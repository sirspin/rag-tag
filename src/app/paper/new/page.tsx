import PaperForm from '@/components/forms/PaperForm'
import Link from 'next/link'

export default function NewPaperPage() {
  return (
    <div className="bg-background min-h-screen">
      <nav className="max-w-2xl mx-auto px-6 py-5">
        <Link href="/dashboard" className="font-garamond italic text-text-secondary text-sm hover:text-text-primary">
          ← Back to dashboard
        </Link>
      </nav>
      <hr className="rule-thin max-w-2xl mx-auto px-6" />

      <main className="max-w-2xl mx-auto px-6 py-14">
        <div className="mb-12">
          <p className="section-header mb-3">New paper</p>
          <h1 className="masthead-name text-5xl leading-tight mb-4">
            Start your paper.
          </h1>
          <p className="font-garamond italic text-text-secondary text-lg">
            Give it a name, set your cadence, and invite your contributors.
          </p>
        </div>

        <hr className="rule-thick mb-12" />

        <PaperForm />
      </main>
    </div>
  )
}
