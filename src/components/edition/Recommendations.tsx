import type { AIRecommendation } from '@/types'

export default function Recommendations({ recommendations }: { recommendations: AIRecommendation[] }) {
  if (!recommendations || recommendations.length === 0) return null

  return (
    <section className="mt-10">
      <div className="mb-6">
        <p className="section-header text-text-secondary mb-1">Further Reading</p>
        <hr className="rule-thin" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {recommendations.map((rec, i) => (
          <div key={i} className="pb-6 border-b border-rules/20 last:border-0">
            <h4 className="font-quattrocento font-bold text-base text-text-primary leading-tight mb-1">
              <a
                href={rec.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
              >
                {rec.title}
              </a>
            </h4>
            <p className="font-arvo text-xs text-accent mb-1">{rec.source_name}</p>
            <p className="font-quattrocento italic text-text-secondary text-sm leading-relaxed">
              {rec.reason}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
