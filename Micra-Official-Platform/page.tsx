import type { Metadata } from 'next'
import AdminApp from '../../src/App'

export const metadata: Metadata = {
  title: 'MICRA Admin',
  description: 'Dashboard pengelolaan konten website MICRA',
}

export default function AdminPage() {
  return <AdminApp />
}
