import { useEffect, useRef } from "react"
import { animate } from "animejs"

export function CircularProgress({
  remaining,
  total,
  color,
  size,
}: {
  remaining: number
  total: number
  color: string
  size: number
}) {
  const circleRef = useRef<SVGCircleElement>(null)
  const radius = 44
  const circumference = 2 * Math.PI * radius

  useEffect(() => {
    const el = circleRef.current
    if (!el) return

    const progress = Math.max(0, Math.min(1, remaining / total))
    const offset = circumference * (1 - progress)

    animate(el, {
      strokeDashoffset: offset,
      duration: 1000,
      ease: "linear",
    })
  }, [remaining, total])

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="3"
      />
      <circle
        ref={circleRef}
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
        transform="rotate(-90 50 50)"
        style={{ transition: "stroke 260ms ease" }}
      />
    </svg>
  )
}
