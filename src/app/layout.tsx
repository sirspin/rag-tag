import type { Metadata } from 'next'
import { Quattrocento, Arvo } from 'next/font/google'
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

export const metadata: Metadata = {
  title: 'Commonplace',
  description: 'The paper your people make.',
  openGraph: {
    title: 'Commonplace',
    description: 'The paper your people make.',
    siteName: 'Commonplace',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${quattrocento.variable} ${arvo.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
