import { useEffect, useRef, useState } from "react"
import { animate } from "animejs"
import { formatTime } from "../store.js"

function AnimatedChar({ char, skip }: { char: string; skip: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (skip || !ref.current || char === ":") return
    animate(ref.current, {
      scale: [0.7, 1],
      opacity: [0.3, 1],
      duration: 250,
      ease: "outBack",
    })
  }, [])

  const isDigit = char >= "0" && char <= "9"

  return (
    <span
      ref={ref}
      style={{
        display: "inline-block",
        width: isDigit ? "0.6em" : "0.3em",
        textAlign: "center",
      }}
    >
      {char}
    </span>
  )
}

export function DigitDisplay({ seconds }: { seconds: number }) {
  const [animate, setAnimate] = useState(false)
  const formatted = formatTime(seconds)

  useEffect(() => {
    setAnimate(true)
  }, [])

  return (
    <span style={{ fontVariantNumeric: "tabular-nums", lineHeight: 1, letterSpacing: "-2px" }}>
      {formatted.split("").map((char, i) => (
        <AnimatedChar key={`${i}-${char}`} char={char} skip={!animate} />
      ))}
    </span>
  )
}
