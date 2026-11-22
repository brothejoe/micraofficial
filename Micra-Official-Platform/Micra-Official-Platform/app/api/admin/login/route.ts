import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { consumeServerRateLimit } from '../../../../src/lib/server-rate-limit'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > 8 * 1024) return NextResponse.json({ error: 'Login request is too large.' }, { status: 413 })
  const origin = request.headers.get('origin')
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) {
        return NextResponse.json({ error: 'Cross-origin login requests are not accepted.' }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: 'The request origin is invalid.' }, { status: 403 })
    }
  }

  let input: unknown
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'The login request must be valid JSON.' }, { status: 400 })
  }
  if (!input || typeof input !== 'object') {
    return NextResponse.json({ error: 'The login request is invalid.' }, { status: 400 })
  }
  const body = input as Record<string, unknown>
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (email.length < 3 || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 1 || password.length > 256) {
    return NextResponse.json({ error: 'Enter a valid email address and password.' }, { status: 400 })
  }

  try {
    const allowed = await consumeServerRateLimit(request, 'admin-login', 8, 900)
    if (!allowed) {
      return NextResponse.json({ error: 'Too many login attempts. Please wait and try again.' }, { status: 429, headers: { 'Retry-After': '900' } })
    }
  } catch {
    return NextResponse.json({ error: 'Login is temporarily unavailable because rate limiting is not ready.' }, { status: 503 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !anonKey) {
    return NextResponse.json({ error: 'Login is temporarily unavailable because Supabase is not configured.' }, { status: 503 })
  }
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data.session) {
    return NextResponse.json({ error: 'The email or password is incorrect.' }, { status: 401 })
  }
  const authenticatedClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
  })
  const { data: profile, error: profileError } = await authenticatedClient
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle()
  if (profileError || !profile || !['super_admin', 'content_admin', 'editor'].includes(profile.role)) {
    return NextResponse.json({ error: 'This account does not have CMS access.' }, { status: 403 })
  }

  return NextResponse.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })
}
