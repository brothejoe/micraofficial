'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Leaf, LockKeyhole } from 'lucide-react'
import { supabase } from '../../src/lib/supabase'

type RecoveryStatus = 'checking' | 'ready' | 'invalid' | 'success'

export default function ResetPasswordForm() {
  const [status, setStatus] = useState<RecoveryStatus>(supabase ? 'checking' : 'invalid')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState(supabase ? '' : 'Koneksi Supabase belum dikonfigurasi.')

  useEffect(() => {
    if (!supabase) return

    let active = true
    let recoveryEventReceived = false
    const url = new URL(window.location.href)
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''))
    const hasRecoveryMarker = url.searchParams.get('type') === 'recovery' ||
      url.searchParams.has('code') ||
      hashParams.get('type') === 'recovery'
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        recoveryEventReceived = true
        if (active) setStatus('ready')
      }
    })

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) {
        setErrorMessage(`Tautan pemulihan tidak dapat diverifikasi: ${error.message}`)
        setStatus('invalid')
      } else if (recoveryEventReceived || (hasRecoveryMarker && data.session)) {
        setStatus('ready')
      } else {
        setErrorMessage('Tautan tidak valid atau sudah kedaluwarsa. Kembali ke login dan minta tautan baru.')
        setStatus('invalid')
      }
    }).catch(error => {
      if (!active) return
      setErrorMessage(error instanceof Error ? `Tautan pemulihan tidak dapat diverifikasi: ${error.message}` : 'Tautan pemulihan tidak dapat diverifikasi.')
      setStatus('invalid')
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase || password !== confirmation) return

    setBusy(true)
    setErrorMessage('')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw new Error(`Kata sandi gagal diperbarui: ${error.message}`)
      window.history.replaceState({}, '', '/admin/reset-password')
      setPassword('')
      setConfirmation('')
      setStatus('success')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Kata sandi gagal diperbarui. Minta tautan baru jika tautan sudah kedaluwarsa.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="password-reset-page">
      <section className="password-reset-card">
        <div className="password-reset-brand"><span className="brand-mark"><Leaf size={22} /></span><span>MICRA<small>CONTENT MANAGEMENT</small></span></div>
        {status === 'checking' && <>
          <div className="password-reset-icon"><LockKeyhole size={21} /></div>
          <h1>Memeriksa tautan</h1>
          <p className="password-reset-copy">Sedang memvalidasi tautan pemulihan kata sandi.</p>
        </>}
        {status === 'ready' && <>
          <div className="password-reset-icon"><LockKeyhole size={21} /></div>
          <h1>Buat kata sandi baru</h1>
          <p className="password-reset-copy">Pilih kata sandi baru untuk akun administrator Anda.</p>
          <form className="password-reset-form" onSubmit={submit}>
            <label>Kata sandi baru
              <input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} />
            </label>
            <label>Ulangi kata sandi baru
              <input type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={event => setConfirmation(event.target.value)} />
            </label>
            {password && confirmation && password !== confirmation && <p className="password-reset-error" role="alert">Kata sandi belum sama.</p>}
            {errorMessage && <p className="password-reset-error" role="alert">{errorMessage}</p>}
            <p className="password-reset-hint">Gunakan minimal 8 karakter.</p>
            <button className="primary-btn" disabled={busy || password.length < 8 || password !== confirmation}>
              {busy ? 'Menyimpan…' : 'Simpan kata sandi baru'}
            </button>
          </form>
        </>}
        {status === 'invalid' && <>
          <div className="password-reset-icon"><LockKeyhole size={21} /></div>
          <h1>Tautan tidak dapat digunakan</h1>
          <p className="password-reset-copy" role="alert">{errorMessage}</p>
          <Link className="outline-btn password-reset-link" href="/admin">Kembali ke login</Link>
        </>}
        {status === 'success' && <>
          <div className="password-reset-icon success"><Leaf size={21} /></div>
          <h1>Kata sandi berhasil diubah</h1>
          <p className="password-reset-copy">Gunakan kata sandi baru untuk masuk ke dashboard admin.</p>
          <Link className="primary-btn password-reset-link" href="/admin">Masuk ke dashboard</Link>
        </>}
      </section>
    </main>
  )
}
