import Link from 'next/link'
import RagtagLogo from '@/components/RagtagLogo'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function LandingPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Nav */}
      <nav className="max-w-broadsheet mx-auto px-6 md:px-12 py-5 flex items-center justify-between">
        <RagtagLogo className="h-7 w-auto" />
        <Link href="/auth/login" className="font-garamond italic text-text-secondary text-sm hover:text-text-primary">
          Sign in
        </Link>
      </nav>

      <hr className="rule-thin mx-6 md:mx-12" />

      {/* Hero */}
      <section className="max-w-broadsheet mx-auto px-6 md:px-12 py-20 md:py-28 text-center">
        <p className="edition-badge tracking-widest mb-8 text-text-secondary">
          EST. {new Date().getFullYear()} · THE PAPER YOUR PEOPLE MAKE
        </p>
        <h1 className="masthead-name text-6xl md:text-8xl lg:text-9xl mb-6 leading-none">
          Your group.<br />
          Your paper.<br />
          Every week.
        </h1>
        <p className="font-lora text-lg md:text-xl text-text-secondary max-w-xl mx-auto mb-10 leading-relaxed">
          Ragtag turns the links your friends share into a newspaper worth reading.
        </p>
        <Link href="/auth/login" className="btn-primary inline-block text-base">
          Start your paper →
        </Link>
      </section>

      <hr className="rule-thick mx-6 md:mx-12" />

      {/* How it works */}
      <section className="max-w-broadsheet mx-auto px-6 md:px-12 py-20">
        <div className="text-center mb-14">
          <p className="section-header mb-3">How it works</p>
          <hr className="rule-thin max-w-xs mx-auto" />
        </div>

        <div className="grid md:grid-cols-3 gap-0">
          {[
            {
              number: 'I.',
              heading: 'Submit links all week',
              body: 'Your contributors paste URLs — articles, essays, videos, anything worth sharing. A quick note tells the group what caught their eye.',
            },
            {
              number: 'II.',
              heading: 'We compile the edition',
              body: 'When you\'re ready, hit Compile. We extract the full text, and our editorial AI organizes everything into a paper with sections, ledes, and flow.',
            },
            {
              number: 'III.',
              heading: 'Read it together',
              body: 'Publish, and everyone gets a link to a real newspaper page. Full articles, bylines, beautiful type. Something worth opening on Sunday morning.',
            },
          ].map((step, i) => (
            <div key={i} className={`py-8 ${i > 0 ? 'md:border-l md:border-rules md:pl-10' : ''} ${i > 0 ? 'md:ml-0 pl-0' : ''}`}>
              <p className="font-playfair font-bold text-accent text-xl mb-4">{step.number}</p>
              <h3 className="font-playfair font-bold text-xl text-text-primary mb-3 leading-tight">
                {step.heading}
              </h3>
              <p className="font-lora text-text-secondary leading-relaxed">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <hr className="rule-thick mx-6 md:mx-12" />

      {/* Edition preview mockup */}
      <section className="max-w-broadsheet mx-auto px-6 md:px-12 py-16">
        <div className="text-center mb-10">
          <p className="section-header mb-3">What an edition looks like</p>
          <hr className="rule-thin max-w-xs mx-auto" />
        </div>

        {/* Fake edition */}
        <div className="border border-rules/30 p-8 md:p-14 max-w-3xl mx-auto bg-background/80">
          {/* Masthead */}
          <div className="text-center">
            <hr className="rule-thin mb-3" />
            <p className="edition-badge text-text-secondary">
              Vol. 1 &nbsp;·&nbsp; {DAYS[new Date().getDay()]}, {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} &nbsp;·&nbsp; Edition #0001
            </p>
            <hr className="rule-thin mt-3 mb-6" />
            <h2 className="masthead-name text-5xl md:text-7xl mb-2">
              The Sunday Dispatch
            </h2>
            <p className="font-garamond italic text-text-secondary text-lg mb-4">
              &ldquo;Curated by people who actually read things.&rdquo;
            </p>
            <p className="section-header text-text-secondary text-xs">
              Spencer G. &nbsp;·&nbsp; Carly M. &nbsp;·&nbsp; The Culture Desk
            </p>
            <hr className="rule-thick mt-5 mb-8" />
          </div>

          {/* Lead section */}
          <div className="mb-10">
            <p className="section-header text-accent mb-1">On Our Minds</p>
            <hr className="rule-thin mb-3" />
            <p className="font-garamond italic text-text-secondary mb-5">
              Three of you were reading about the same thing this week without knowing it.
            </p>
            <div className="bg-rules/10 h-40 mb-4 flex items-center justify-center">
              <span className="font-courier text-xs text-text-secondary tracking-widest">[ARTICLE IMAGE]</span>
            </div>
            <h3 className="font-playfair font-bold text-2xl md:text-3xl text-text-primary mb-1 leading-tight">
              The Quiet Revolution Happening in Reading Habits
            </h3>
            <p className="font-garamond italic text-text-secondary text-sm mb-3">by Spencer G.</p>
            <p className="pull-quote">
              &ldquo;The piece that finally made me understand what everyone keeps talking about.&rdquo;
            </p>
            <p className="font-lora text-text-primary leading-relaxed text-sm mb-2">
              For the past decade, we have been told that attention spans are shrinking. The evidence,
              on closer inspection, is more complicated. People read more words than ever — they simply
              choose different containers for them. The newsletter has replaced the magazine. The thread
              has replaced the op-ed. And somewhere in that shift, something was gained and something lost…
            </p>
            <a href="#" className="continue-reading">
              Continue reading at The Atlantic →
            </a>
          </div>

          <hr className="rule-thick mb-8" />

          {/* Standard sections */}
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { title: 'Culture', items: ['The last great record store', 'What we talk about when we talk about taste'] },
              { title: 'Signal', items: ['On the geometry of ordinary grief', 'Why the commute isn\'t coming back'] },
            ].map((col, i) => (
              <div key={i}>
                <p className="section-header text-accent mb-1">{col.title}</p>
                <hr className="rule-thin mb-4" />
                {col.items.map((item, j) => (
                  <div key={j} className="mb-5">
                    <h4 className="font-playfair font-bold text-base leading-tight mb-1">{item}</h4>
                    <p className="font-garamond italic text-text-secondary text-xs">by Carly M.</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="rule-thick mx-6 md:mx-12" />

      {/* CTA */}
      <section className="max-w-broadsheet mx-auto px-6 md:px-12 py-20 text-center">
        <h2 className="masthead-name text-4xl md:text-6xl mb-6">
          Start your paper.
        </h2>
        <p className="font-lora text-text-secondary text-lg mb-10 max-w-md mx-auto">
          Free to start. Invite your contributors. Publish your first edition this week.
        </p>
        <Link href="/auth/login" className="btn-primary inline-block">
          Get started →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-rules">
        <div className="max-w-broadsheet mx-auto px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <RagtagLogo className="h-6 w-auto" />
          <p className="font-garamond italic text-text-secondary text-sm">
            &ldquo;The paper your people make.&rdquo;
          </p>
          <Link href="/auth/login" className="font-garamond italic text-text-secondary text-sm hover:text-text-primary">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  )
}
