import { useEffect, useState } from 'react'

function normalizePercentage(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) {
    return 0
  }
  return Math.min(100, Math.max(0, numericValue))
}

function MatchRing({ value, size = 74 }) {
  const percentage = normalizePercentage(value)
  const [animatedPercentage, setAnimatedPercentage] = useState(0)
  const radius = 29
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedPercentage / 100) * circumference
  const strength = percentage >= 75 ? 'strong' : percentage >= 40 ? 'moderate' : 'low'

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setAnimatedPercentage(percentage)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [percentage])

  return (
    <div
      className={`match-ring match-ring-${strength}`}
      style={{ '--match-ring-size': `${size}px` }}
      role="img"
      aria-label={`${percentage}% match`}
    >
      <svg viewBox="0 0 72 72" aria-hidden="true">
        <circle className="match-ring-track" cx="36" cy="36" r={radius} />
        <circle
          className="match-ring-progress"
          cx="36"
          cy="36"
          r={radius}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <strong>{percentage}%</strong>
      <span>match</span>
    </div>
  )
}

export default MatchRing
