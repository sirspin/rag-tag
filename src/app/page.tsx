'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import RagtagLogo from '@/components/RagtagLogo'

const CYCLING_WORDS = ['mom', 'book', 'run', 'film', 'brunch']

function OrnamentRule() {
  return (
    <div className="flex items-center gap-0 mx-6 md:mx-12">
      <div className="flex-1 border-t-2 border-rules" />
      <span className="px-4 text-text-secondary" style={{ fontFamily: 'var(--font-arvo)', fontSize: '0.5rem', letterSpacing: '0.3em' }}>✦ ✦ ✦</span>
      <div className="flex-1 border-t-2 border-rules" />
    </div>
  )
}

export default function LandingPage() {
  const [wordIndex, setWordIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setWordIndex(i => (i + 1) % CYCLING_WORDS.length)
        setVisible(true)
      }, 320)
    }, 2400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-background min-h-screen">
      {/* Nav */}
      <nav className="max-w-broadsheet mx-auto px-6 md:px-12 pt-5 pb-0 flex items-center justify-between">
        <RagtagLogo className="h-7 w-auto" />
        <Link href="/auth/login" className="font-arvo text-[0.7rem] tracking-[0.14em] uppercase text-text-secondary hover:text-text-primary transition-colors">
          Sign in
        </Link>
      </nav>

      {/* Single thick rule */}
      <div className="mx-6 md:mx-12 mt-3">
        <div className="border-t-[3px] border-rules" />
      </div>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="max-w-broadsheet mx-auto px-6 md:px-12 pt-14 pb-14 md:pt-18 md:pb-16">

        {/* Headline column — full width */}
        <div>
          <p
            className="font-quattrocento italic text-text-secondary mb-5 leading-snug"
            style={{ fontSize: 'clamp(0.95rem, 2vw, 1.15rem)' }}
          >
            The web is full of things worth reading.
            <br />
            Your group chat is full of links nobody reads.
          </p>

          <h1
            className="font-quattrocento font-bold text-text-primary mb-8"
            style={{
              fontSize: 'clamp(2.4rem, 6.5vw, 5rem)',
              letterSpacing: '0.01em',
              lineHeight: '0.94',
            }}
          >
            Ragtag is a shared<br />
            newspaper for your{' '}
            <span
              className="text-accent inline-block"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(5px)',
                transition: 'opacity 0.28s ease, transform 0.28s ease',
                minWidth: '5ch',
              }}
            >
              {CYCLING_WORDS[wordIndex]}
            </span>
            {' '}club.
          </h1>

          <Link href="/auth/login" className="btn-primary inline-block">
            Start your paper →
          </Link>
        </div>

      </section>

      <OrnamentRule />

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="max-w-broadsheet mx-auto px-6 md:px-12 py-16">

        <div className="text-center mb-10">
          <p className="font-arvo text-[0.58rem] tracking-[0.22em] uppercase text-text-secondary">
            How it works
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-0">
          {[
            {
              numeral: 'I',
              kicker: 'Create a Paper',
              heading: 'Become the editor. Set the tone. Invite your newsroom.',
              body: 'Your paper, your rules. Pick a name, write a tagline. Invite the people whose taste you trust.',
            },
            {
              numeral: 'II',
              kicker: 'Open Submissions',
              heading: 'File links and stories from anywhere. The paper organizes itself.',
              body: 'From the web, by SMS, by email. File a link, add a note. No publishing step required.',
            },
            {
              numeral: 'III',
              kicker: 'Read and Share',
              heading: 'Your group\'s finds, plus recommended reads, in one place.',
              body: 'Visit your paper anytime. Always current. Everything your people have been reading, laid out properly.',
            },
          ].map((step, i) => (
            <div
              key={i}
              className={[
                'py-8',
                i > 0 ? 'md:pl-10 md:border-l md:border-rules' : '',
                i < 2 ? 'md:pr-10' : '',
                i > 0 ? 'border-t border-rules/30 md:border-t-0' : '',
              ].join(' ')}
            >
              <p
                className="font-arvo font-bold text-accent mb-3"
                style={{ fontSize: '0.7rem', letterSpacing: '0.22em' }}
              >
                {step.numeral}.
              </p>
              <p className="font-arvo text-[0.58rem] tracking-[0.16em] uppercase text-text-secondary mb-2">
                {step.kicker}
              </p>
              <p className="font-quattrocento font-bold text-text-primary leading-tight mb-3" style={{ fontSize: '1rem' }}>
                {step.heading}
              </p>
              <div className="w-6 border-t border-rules/50 mb-3" />
              <p className="font-quattrocento text-text-secondary leading-relaxed text-sm">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <OrnamentRule />

      {/* ── See it in action ──────────────────────────────────────────── */}
      <section className="max-w-broadsheet mx-auto px-6 md:px-12 py-16">

        <div className="text-center mb-10">
          <p className="font-arvo text-[0.58rem] tracking-[0.22em] uppercase text-text-secondary">
            See it in action
          </p>
        </div>

        {/* Ruled placeholder — telegraph paper feel */}
        <div
          className="border border-rules/40 py-20 px-8 text-center relative overflow-hidden"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 27px,
              rgba(42,31,14,0.055) 27px,
              rgba(42,31,14,0.055) 28px
            )`,
          }}
        >
          {/* Corner ornaments */}
          <span className="absolute top-3 left-4 font-arvo text-rules/30 text-lg leading-none select-none">✦</span>
          <span className="absolute top-3 right-4 font-arvo text-rules/30 text-lg leading-none select-none">✦</span>
          <span className="absolute bottom-3 left-4 font-arvo text-rules/30 text-lg leading-none select-none">✦</span>
          <span className="absolute bottom-3 right-4 font-arvo text-rules/30 text-lg leading-none select-none">✦</span>

          <p className="font-quattrocento italic text-text-secondary text-xl mb-2">
            Example papers coming soon.
          </p>
          <p className="font-arvo text-[0.58rem] tracking-[0.1em] uppercase text-text-secondary/40">
            Real papers by real groups will appear here.
          </p>
        </div>

      </section>

      <OrnamentRule />

      {/* ── Footer CTA ────────────────────────────────────────────────── */}
      <section className="max-w-broadsheet mx-auto px-6 md:px-12 py-20 text-center">
        <p className="font-arvo text-[0.58rem] tracking-[0.22em] uppercase text-text-secondary mb-6">
          Your paper awaits
        </p>
        <h2
          className="font-quattrocento font-bold text-text-primary mb-6"
          style={{
            fontSize: 'clamp(2rem, 5.5vw, 4rem)',
            lineHeight: '0.95',
            letterSpacing: '0.02em',
          }}
        >
          Start your paper →
        </h2>
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 border-t border-rules/50" />
          <span className="font-arvo text-[0.5rem] tracking-[0.3em] text-text-secondary/50">✦</span>
          <div className="w-12 border-t border-rules/50" />
        </div>
        <p className="font-quattrocento italic text-text-secondary text-lg mb-10 max-w-sm mx-auto">
          Free to start. Invite your staff reporters. The paper goes live the moment you do.
        </p>
        <Link href="/auth/login" className="btn-primary inline-block">
          Start your paper →
        </Link>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t-2 border-rules">
        <div className="max-w-broadsheet mx-auto px-6 md:px-12 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <RagtagLogo className="h-5 w-auto opacity-80" />
          <p className="font-quattrocento italic text-text-secondary text-sm">
            &ldquo;The paper your people make.&rdquo;
          </p>
          <Link
            href="/auth/login"
            className="font-arvo text-[0.6rem] tracking-[0.14em] uppercase text-text-secondary hover:text-text-primary transition-colors"
          >
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  )
}
