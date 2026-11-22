import { NextResponse } from 'next/server'
import { consumeServerRateLimit, createServerServiceClient } from '../../../src/lib/server-rate-limit'
import { getEnquiryLabel, isEnquiryType } from '../../../src/lib/enquiry-types'

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > 12 * 1024) return NextResponse.json({ error: 'The request is too large.' }, { status: 413 })
  const origin = request.headers.get('origin')
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) {
        return NextResponse.json({ error: 'Cross-origin form submissions are not accepted.' }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: 'The request origin is invalid.' }, { status: 403 })
    }
  }

  let input: unknown
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'The request body must be valid JSON.' }, { status: 400 })
  }
  if (!input || typeof input !== 'object') {
    return NextResponse.json({ error: 'The request body is invalid.' }, { status: 400 })
  }

  const body = input as Record<string, unknown>
  if (typeof body.website === 'string' && body.website.trim()) {
    return NextResponse.json({ error: 'The message could not be accepted.' }, { status: 400 })
  }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const enquiryType = body.enquiryType === undefined ? 'general' : body.enquiryType
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!isEnquiryType(enquiryType)) {
    return NextResponse.json({ error: 'Select a valid enquiry type.' }, { status: 400 })
  }
  if (name.length < 1 || name.length > 120) {
    return NextResponse.json({ error: 'Name must be between 1 and 120 characters.' }, { status: 400 })
  }
  if (email.length < 3 || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  if (subject.length > 200) {
    return NextResponse.json({ error: 'Subject must be no more than 200 characters.' }, { status: 400 })
  }
  const storedSubject = subject
    ? `${getEnquiryLabel(enquiryType)}: ${subject}`
    : getEnquiryLabel(enquiryType)
  if (storedSubject.length > 200) {
    return NextResponse.json({ error: 'Shorten the subject to no more than 160 characters.' }, { status: 400 })
  }
  if (message.length < 1 || message.length > 5000) {
    return NextResponse.json({ error: 'Message must be between 1 and 5,000 characters.' }, { status: 400 })
  }

  try {
    const allowed = await consumeServerRateLimit(request, 'public-enquiry', 5, 900)
    if (!allowed) {
      return NextResponse.json({ error: 'Too many enquiries have been submitted from this connection. Please try again later.' }, {
        status: 429,
        headers: { 'Retry-After': '900' },
      })
    }
  } catch {
    return NextResponse.json({ error: 'The contact form is temporarily unavailable because its server-side protections are not ready.' }, { status: 503 })
  }

  const client = createServerServiceClient()
  const { error } = await client.from('enquiries').insert({ name, email, subject: storedSubject, message })
  if (error) {
    return NextResponse.json({ error: `Your message could not be saved: ${error.message}` }, { status: 502 })
  }

  return NextResponse.json({ submitted: true }, { status: 201 })
}
