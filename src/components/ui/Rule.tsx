export function RuleThin({ className = '' }: { className?: string }) {
  return <hr className={`rule-thin ${className}`} />
}

export function RuleThick({ className = '' }: { className?: string }) {
  return <hr className={`rule-thick ${className}`} />
}

export function RuleDouble({ className = '' }: { className?: string }) {
  return (
    <div className={`border-t-2 border-b border-rules py-0.5 ${className}`} />
  )
}
