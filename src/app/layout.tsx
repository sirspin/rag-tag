import type { Metadata } from 'next'
import { Playfair_Display, Lora, EB_Garamond, Courier_Prime } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
  display: 'swap',
})

const garamond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-garamond',
  display: 'swap',
})

const courier = Courier_Prime({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-courier',
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
      className={`${playfair.variable} ${lora.variable} ${garamond.variable} ${courier.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
