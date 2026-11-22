import type { Metadata } from 'next'
import '../src/index.css'
import '../src/App.css'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'MICRA | Regenerative Aquaculture Development',
    template: '%s | MICRA',
  },
  description: 'MICRA is a regenerative aquaculture developer and implementation platform transforming traditional coastal shrimp farming through a retrofit-first, cluster-based approach.',
  applicationName: 'MICRA',
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
