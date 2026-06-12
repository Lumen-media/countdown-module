import { useEffect, useRef, useState } from "react"
import { animate } from "animejs"

type TextCarouselProps = {
  text: string
  style?: React.CSSProperties
  className?: string
}

export function TextCarousel({ text, style, className }: TextCarouselProps) {
  const lines = text.split("\n").filter((l) => l.length > 0)
  const [index, setIndex] = useState(0)
  const spanRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    setIndex(0)
  }, [text])

  useEffect(() => {
    if (lines.length <= 1) return

    const id = setInterval(() => {
      const el = spanRef.current
      if (!el) return

      animate(el, {
        rotateX: [0, -90],
        opacity: [1, 0],
        duration: 300,
        ease: "inSine",
        onComplete: () => {
          setIndex((i) => (i + 1) % lines.length)
          setTimeout(() => {
            if (!spanRef.current) return
            animate(spanRef.current, {
              rotateX: [90, 0],
              opacity: [0, 1],
              duration: 400,
              ease: "outSine",
            })
          }, 20)
        },
      })
    }, 10000)

    return () => clearInterval(id)
  }, [lines.length])

  if (lines.length === 0) return null

  if (lines.length === 1) {
    return (
      <span style={style} className={className}>
        {lines[0]}
      </span>
    )
  }

  return (
    <span style={{ display: "inline-block", perspective: "600px" }}>
      <span
        ref={spanRef}
        style={{ ...style, display: "inline-block", transformOrigin: "50% 50%" }}
        className={className}
      >
        {lines[index]}
      </span>
    </span>
  )
}
