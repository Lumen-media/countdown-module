import { useEffect, useRef, useState } from "react"
import { animate } from "animejs"
import { formatTime } from "../lib/format-time.js"

type FlipClockDigitProps = {
  digit: string
  color: string
  fontFamily: string
  fontSize: number
}

const CARD_BG = "#171717"
const CARD_BG_ALT = "#202020"
const DIVIDER_BG = "rgba(255,255,255,0.06)"

function HalfDigit({
  digit,
  half,
  color,
  fontFamily,
  fontSize,
  height,
}: FlipClockDigitProps & { half: "top" | "bottom"; height: number }) {
  const halfHeight = height / 2

  return (
    <span
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: half === "top" ? 0 : -halfHeight,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        fontFamily: fontFamily.includes("system-ui")
          ? '"Jersey 15", Roboto Mono, Menlo, SFMono-Regular, Lucida Console, Consolas, monospace'
          : fontFamily,
        fontSize,
        fontWeight: 400,
        fontVariantNumeric: "tabular-nums",
        fontFeatureSettings: '"tnum" 1, "zero" 0',
        lineHeight: 1,
        textShadow: "0 0.08em 0.2em rgba(0,0,0,0.55)",
      }}
    >
      {digit}
    </span>
  )
}

function StaticHalf(props: FlipClockDigitProps & { half: "top" | "bottom"; height: number }) {
  const halfHeight = props.height / 2
  const seamOverlap = 1
  const isTop = props.half === "top"

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: isTop ? 0 : halfHeight - seamOverlap,
        height: halfHeight + seamOverlap,
        overflow: "hidden",
        background: isTop ? CARD_BG_ALT : CARD_BG,
        borderTopLeftRadius: isTop ? 6 : 0,
        borderTopRightRadius: isTop ? 6 : 0,
        borderBottomLeftRadius: isTop ? 0 : 6,
        borderBottomRightRadius: isTop ? 0 : 6,
        boxShadow: isTop ? `inset 0 -1px 0 ${DIVIDER_BG}` : undefined,
      }}
    >
      <HalfDigit {...props} />
    </div>
  )
}

export function FlipClockDigit({ digit, color, fontFamily, fontSize }: FlipClockDigitProps) {
  const [current, setCurrent] = useState(digit)
  const [previous, setPrevious] = useState(digit)
  const [isFlipping, setIsFlipping] = useState(false)
  const topFoldRef = useRef<HTMLDivElement>(null)
  const bottomFoldRef = useRef<HTMLDivElement>(null)
  const previousRef = useRef(digit)

  useEffect(() => {
    if (digit === previousRef.current) return

    setPrevious(previousRef.current)
    previousRef.current = digit
    setCurrent(digit)
    setIsFlipping(true)
  }, [digit])

  useEffect(() => {
    if (!isFlipping || !topFoldRef.current || !bottomFoldRef.current) return

    const top = topFoldRef.current
    const bottom = bottomFoldRef.current
    top.style.transform = "scaleY(1)"
    bottom.style.transform = "scaleY(0)"

    const topAnim = animate(top, {
      scaleY: [1, 0],
      duration: 90,
      ease: "inQuad",
    })
    const bottomAnim = animate(bottom, {
      scaleY: [0, 1],
      delay: 70,
      duration: 110,
      ease: "outQuad",
      onComplete: () => {
        setIsFlipping(false)
      },
    })

    return () => {
      topAnim.cancel()
      bottomAnim.cancel()
    }
  }, [isFlipping])

  const width = Math.round(fontSize * 0.7)
  const height = Math.round(fontSize * 1.02)
  const halfHeight = height / 2
  const seamOverlap = 1
  const common = { color, fontFamily, fontSize, height }

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        width,
        height,
        verticalAlign: "middle",
        perspective: Math.max(360, fontSize * 4),
        borderRadius: 6,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 0.08em 0.22em rgba(0,0,0,0.45)",
        overflow: "visible",
      }}
    >
      <StaticHalf digit={current} half="top" {...common} />
      <StaticHalf digit={current} half="bottom" {...common} />

      {isFlipping && (
        <>
          <div
            ref={topFoldRef}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: halfHeight + seamOverlap,
              overflow: "hidden",
              background: CARD_BG_ALT,
              borderTopLeftRadius: 6,
              borderTopRightRadius: 6,
              boxShadow: `inset 0 -1px 0 ${DIVIDER_BG}`,
              transformOrigin: "bottom",
              backfaceVisibility: "hidden",
              zIndex: 2,
            }}
          >
            <HalfDigit digit={previous} half="top" {...common} />
          </div>
          <div
            ref={bottomFoldRef}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: halfHeight - seamOverlap,
              height: halfHeight + seamOverlap,
              overflow: "hidden",
              background: CARD_BG,
              borderBottomLeftRadius: 6,
              borderBottomRightRadius: 6,
              transformOrigin: "top",
              backfaceVisibility: "hidden",
              zIndex: 2,
            }}
          >
            <HalfDigit digit={current} half="bottom" {...common} />
          </div>
        </>
      )}
    </div>
  )
}

type FlipClockDisplayProps = {
  seconds: number
  color: string
  fontFamily: string
  fontSize: number
}

export function FlipClockDisplay({ seconds, color, fontFamily, fontSize }: FlipClockDisplayProps) {
  const formatted = formatTime(seconds)
  const colonW = Math.max(4, Math.round(fontSize * 0.1))
  const colonSize = Math.max(3, Math.round(fontSize * 0.09))
  const gap = Math.max(3, Math.round(fontSize * 0.045))

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap }}>
      {formatted.split("").map((char, i) =>
        char === ":" ? (
          <div
            key={i}
            style={{
              width: colonW,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: Math.round(fontSize * 0.16),
              color,
            }}
          >
            <div
              style={{
                width: colonSize,
                height: colonSize,
                borderRadius: "50%",
                background: color,
              }}
            />
            <div
              style={{
                width: colonSize,
                height: colonSize,
                borderRadius: "50%",
                background: color,
              }}
            />
          </div>
        ) : (
          <FlipClockDigit
            key={i}
            digit={char}
            color={color}
            fontFamily={fontFamily}
            fontSize={fontSize}
          />
        )
      )}
    </div>
  )
}
