import type { Metadata } from 'next'
import { Quattrocento, Arvo, Fraunces } from 'next/font/google'
import './globals.css'

const quattrocento = Quattrocento({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-quattrocento',
  display: 'swap',
})

const arvo = Arvo({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-arvo',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Ragtag',
  description: 'The paper your people make.',
  openGraph: {
    title: 'Ragtag',
    description: 'The paper your people make.',
    siteName: 'Ragtag',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${quattrocento.variable} ${arvo.variable} ${fraunces.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
