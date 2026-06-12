import { useEffect, useState } from "react"

type TextCarouselProps = {
  text: string
  style?: React.CSSProperties
  className?: string
}

export function TextCarousel({ text, style, className }: TextCarouselProps) {
  const lines = text.split("\n").filter((l) => l.length > 0)

  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (lines.length <= 1) return

    const id = setInterval(() => {
      setVisible(false)
      const timeout = setTimeout(() => {
        setIndex((i) => (i + 1) % lines.length)
        setVisible(true)
      }, 400)
      return () => clearTimeout(timeout)
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
    <span
      style={{ ...style, opacity: visible ? 1 : 0, transition: "opacity 0.4s ease" }}
      className={className}
    >
      {lines[index]}
    </span>
  )
}
