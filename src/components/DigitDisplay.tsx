import { memo, useEffect, useRef, useState } from "react"
import { animate } from "animejs"
import { formatTime } from "../lib/format-time.js"

function AnimatedChar({ char, animation, skip }: { char: string; animation: string; skip: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prevRef = useRef(char)
  const lastAnimRef = useRef<ReturnType<typeof animate> | null>(null)
  const [displayChar, setDisplayChar] = useState(char)

  useEffect(() => {
    if (skip) {
      prevRef.current = char
      setDisplayChar(char)
      return
    }

    if (prevRef.current === char) return

    const el = ref.current
    if (!el) return

    lastAnimRef.current?.cancel()

    const oldChar = prevRef.current
    prevRef.current = char

    if (animation === "flip") {
      setDisplayChar(oldChar)
      el.style.transformOrigin = "50% 50%"
      lastAnimRef.current = animate(el, {
        rotateX: [0, -90],
        opacity: [1, 0],
        duration: 200,
        ease: "inSine",
        onComplete: () => {
          lastAnimRef.current = null
          setDisplayChar(char)
          requestAnimationFrame(() => {
            if (!ref.current) return
            animate(ref.current, {
              rotateX: [90, 0],
              opacity: [0, 1],
              duration: 200,
              ease: "outSine",
            })
          })
        },
      })
    } else if (animation === "blur") {
      setDisplayChar(char)
      animate(el, { filter: ["blur(4px)", "blur(0px)"], opacity: [0, 1], duration: 250, ease: "outSine" })
    } else {
      setDisplayChar(char)
      animate(el, { scale: [0.7, 1], opacity: [0.3, 1], duration: 250, ease: "outBack" })
    }
  }, [char])

  const isDigit = char >= "0" && char <= "9"

  return (
    <span
      ref={ref}
      className="inline-block text-center"
      style={{
        width: isDigit ? "0.6em" : "0.3em",
        backfaceVisibility: "hidden",
      }}
    >
      {displayChar}
    </span>
  )
}

export const DigitDisplay = memo(function DigitDisplay({
  seconds,
  animation = "none",
  pulseEffect = false,
}: {
  seconds: number
  animation?: string
  pulseEffect?: boolean
}) {
  const [ready, setReady] = useState(false)
  const containerRef = useRef<HTMLSpanElement>(null)
  const formatted = formatTime(seconds)

  useEffect(() => {
    setReady(true)
  }, [])

  useEffect(() => {
    if (!pulseEffect || !containerRef.current) return
    const anim = animate(containerRef.current, {
      scale: [1, 1.015],
      duration: 2000,
      direction: "alternate",
      loop: true,
      ease: "inOutSine",
    })
    return () => { anim.cancel() }
  }, [pulseEffect])

  return (
    <span
      ref={containerRef}
      className="tabular-nums leading-none"
      style={{ letterSpacing: "-2px" }}
    >
      {formatted.split("").map((char, i) => (
        <AnimatedChar key={i} char={char} animation={animation} skip={!ready} />
      ))}
    </span>
  )
})
