'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { enquiryTypes, type EnquiryType } from '../../src/lib/enquiry-types'

export default function ContactForm({ initialType = 'general' }: { initialType?: EnquiryType }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    setBusy(true)
    setMessage('')
    setSent(false)

    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.get('name'),
          email: values.get('email'),
          enquiryType: values.get('enquiryType'),
          subject: values.get('subject'),
          message: values.get('message'),
          website: values.get('website'),
        }),
      })
      const result: unknown = await response.json()
      if (!response.ok) {
        const detail = result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
          ? result.error
          : 'Your message could not be sent. Please try again.'
        throw new Error(detail)
      }
      form.reset()
      setSent(true)
      setMessage('Thank you. Your message has been sent to MICRA.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Your message could not be sent. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="contact-form" id="contact-form" onSubmit={submit}>
      <label>Name<input name="name" autoComplete="name" maxLength={120} required /></label>
      <label>Email<input name="email" type="email" autoComplete="email" maxLength={320} required /></label>
      <label>Enquiry type
        <select name="enquiryType" defaultValue={initialType} required>
          {enquiryTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
        </select>
      </label>
      <label>What would you like to discuss?<input name="subject" maxLength={160} /></label>
      <label>Message<textarea name="message" rows={5} maxLength={5000} required /></label>
      <label className="website-field" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <button className="button-primary" disabled={busy}>{busy ? 'Sending…' : 'Send message'}{sent ? <CheckCircle2 size={17} /> : <ArrowRight size={17} />}</button>
      <p className={`form-message ${sent ? 'success' : ''}`} role="status" aria-live="polite">{message}</p>
    </form>
  )
}
