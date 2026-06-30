import { useEffect, useState } from "react"
import { emit, listen } from "@tauri-apps/api/event"
import { displayAnchor, type CountdownTickPayload } from "../../lib/display-mode.js"
import { formatTime } from "../../store.js"
import type { CountdownConfig } from "../../types.js"
import { TextCarousel } from "../TextCarousel.js"

function formatPreText(text: string, maxChars = 28): string {
  const normalized = text.trim()
  if (normalized.length <= maxChars) return normalized

  const slicePoint = normalized.lastIndexOf(" ", maxChars)
  const splitIndex = slicePoint > 0 ? slicePoint : maxChars
  return `${normalized.slice(0, splitIndex)}\n${normalized.slice(splitIndex).trimStart()}`
}
function bgToStyle(config: CountdownConfig): React.CSSProperties {
  const bg = config.appearance.background
  if (bg.type === "solid") return { backgroundColor: bg.color }
  if (bg.type === "gradient") return { backgroundImage: bg.value }
  if (bg.type === "image") return { backgroundImage: `url(${bg.value})`, backgroundSize: "cover", backgroundPosition: "center" }
  if (bg.type === "video") return {}
  return {}
}

export function CountdownDisplay({ initialTick }: { initialTick?: CountdownTickPayload }) {
  const [tick, setTick] = useState<CountdownTickPayload | null>(initialTick ?? null)

  useEffect(() => {
    const unlisten = listen<CountdownTickPayload>("countdown:tick", (e) => {
      setTick(e.payload)
    })
    emit("countdown:display-ready").catch(() => {})
    return () => { unlisten.then((f) => f()).catch(() => {}) }
  }, [])

  if (!tick) {
    return <div style={{ width: "100%", height: "100%", background: "black" }} />
  }

  const { remaining, config, cornerActive, renderConfiguredBackground } = tick
  const { appearance, preText, postText } = config

  const glow = appearance.textShadowGlow ?? 0
  const timerShadow = glow > 0 ? `0 0 ${glow * 40}px rgba(255,255,255,0.8)` : undefined
  const subColor = `${appearance.prePostColor ?? "#ffffff"}${Math.round((appearance.prePostOpacity ?? 0.8) * 255).toString(16).padStart(2, "0")}`
  const subShadow = glow > 0 ? `0 0 ${glow * 24}px rgba(255,255,255,0.5)` : undefined
  const bgStyle = renderConfiguredBackground ? bgToStyle(config) : {}

  return (
    <div
      data-countdown-stage
      style={{
        position: "fixed",
        inset: 0,
        ...bgStyle,
      }}
    >
      <div
        style={{
          position: "absolute",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: cornerActive ? "4px" : "10px",
          textAlign: "center",
          transition: "top 260ms ease, left 260ms ease, transform 260ms ease, gap 260ms ease",
          ...displayAnchor(appearance.cornerPosition, cornerActive),
        }}
      >
        {preText && (
          <span
            style={{
              fontSize: cornerActive ? "14px" : "24px",
              fontWeight: 500,
              color: subColor,
              textShadow: subShadow,
              lineHeight: 1.3,
              transition: "font-size 260ms ease",
            }}
          >
            {formatPreText(preText)}
          </span>
        )}

        <span
          style={{
            fontSize: cornerActive ? "48px" : `${appearance.fontSize}px`,
            fontWeight: 900,
            color: appearance.timerColor,
            letterSpacing: "-2px",
            fontFamily: appearance.font === "Inter (System Default)" ? "system-ui, sans-serif" : appearance.font,
            textShadow: timerShadow,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            transition: "font-size 260ms ease",
          }}
        >
          {formatTime(remaining)}
        </span>

        {postText && (
          <TextCarousel
            text={postText}
            style={{
              fontSize: cornerActive ? "14px" : "20px",
              fontWeight: 400,
              color: subColor,
              textShadow: subShadow,
              lineHeight: 1.3,
              transition: "font-size 260ms ease",
            }}
          />
        )}
      </div>
    </div>
  )
}
