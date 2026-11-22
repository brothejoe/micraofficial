import type { Metadata } from 'next'
import ResetPasswordForm from '../../_components/reset-password-form'

export const metadata: Metadata = {
  title: 'Atur Ulang Kata Sandi | MICRA Admin',
  robots: { index: false, follow: false },
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}
