import { createHmac } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

export function createServerServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!serviceKey || !url) throw new Error('Server-side Supabase service access is not configured.')
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function consumeServerRateLimit(request: Request, action: string, limit: number, windowSeconds: number) {
  const secret = process.env.RATE_LIMIT_SECRET?.trim()
  const ip = request.headers.get('x-real-ip')?.trim()
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (!secret || secret.length < 32 || !ip) {
    throw new Error('Server-side rate limiting is not configured.')
  }

  const keyHash = createHmac('sha256', secret).update(`${action}:${ip}`).digest('hex')
  const client = createServerServiceClient()
  const { data, error } = await client.rpc('consume_rate_limit', {
    p_key_hash: keyHash,
    p_window_seconds: windowSeconds,
    p_limit: limit,
  })
  if (error) throw new Error(`Server-side rate limiting failed: ${error.message}`)
  if (typeof data !== 'boolean') throw new Error('Server-side rate limiting returned an invalid result.')
  return data
}
