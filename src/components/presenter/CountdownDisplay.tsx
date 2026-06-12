import { useEffect, useState } from "react"
import { emit, listen } from "@tauri-apps/api/event"
import { formatTime } from "../../store.js"
import type { CountdownConfig, CountdownStatus } from "../../types.js"
import { TextCarousel } from "../TextCarousel.js"

type TickPayload = {
  remaining: number
  status: CountdownStatus
  config: CountdownConfig
}

function bgToStyle(config: CountdownConfig): React.CSSProperties {
  const bg = config.appearance.background
  if (bg.type === "solid") return { backgroundColor: bg.color }
  if (bg.type === "gradient") return { backgroundImage: bg.value }
  if (bg.type === "image") return { backgroundImage: `url(${bg.value})`, backgroundSize: "cover", backgroundPosition: "center" }
  if (bg.type === "video") return {}
  return {}
}

function cornerInset(position: CountdownConfig["appearance"]["cornerPosition"]): React.CSSProperties {
  if (position === "top-left") return { top: 24, left: 24 }
  if (position === "top-right") return { top: 24, right: 24 }
  if (position === "bottom-left") return { bottom: 24, left: 24 }
  return { bottom: 24, right: 24 }
}

export function CountdownDisplay() {
  const [tick, setTick] = useState<TickPayload | null>(null)

  useEffect(() => {
    const unlisten = listen<TickPayload>("countdown:tick", (e) => {
      setTick(e.payload)
    })
    emit("countdown:display-ready").catch(() => {})
    return () => { unlisten.then((f) => f()).catch(() => {}) }
  }, [])

  if (!tick) {
    return <div style={{ width: "100%", height: "100%", background: "black" }} />
  }

  const { remaining, config } = tick
  const { appearance, preText, postText } = config

  const glow = appearance.textShadowGlow ?? 0
  const timerShadow = glow > 0 ? `0 0 ${glow * 40}px rgba(255,255,255,0.8)` : undefined
  const subColor = `${appearance.prePostColor ?? "#ffffff"}${Math.round((appearance.prePostOpacity ?? 0.8) * 255).toString(16).padStart(2, "0")}`
  const subShadow = glow > 0 ? `0 0 ${glow * 24}px rgba(255,255,255,0.5)` : undefined

  if (appearance.overlayMode === "corner") {
    return (
      <div
        style={{
          position: "fixed",
          ...cornerInset(appearance.cornerPosition),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
        }}
      >
        {preText && (
          <span
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: subColor,
              textShadow: subShadow,
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            {preText}
          </span>
        )}

        <span
          style={{
            fontSize: "48px",
            fontWeight: 900,
            color: appearance.timerColor,
            letterSpacing: "-2px",
            fontFamily: appearance.font === "Inter (System Default)" ? "system-ui, sans-serif" : appearance.font,
            textShadow: timerShadow,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            textAlign: "center",
          }}
        >
          {formatTime(remaining)}
        </span>

        {postText && (
          <TextCarousel
            text={postText}
            style={{
              fontSize: "14px",
              fontWeight: 400,
              color: subColor,
              textShadow: subShadow,
              textAlign: "center",
              lineHeight: 1.3,
            }}
          />
        )}
      </div>
    )
  }

  const bgStyle = bgToStyle(config)

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        ...bgStyle,
      }}
    >
      {preText && (
        <span
          style={{
            fontSize: "24px",
            fontWeight: 500,
            color: subColor,
            textShadow: subShadow,
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          {preText}
        </span>
      )}

      <span
        style={{
          fontSize: `${appearance.fontSize}px`,
          fontWeight: 900,
          color: appearance.timerColor,
          letterSpacing: "-2px",
          fontFamily: appearance.font === "Inter (System Default)" ? "system-ui, sans-serif" : appearance.font,
          textShadow: timerShadow,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatTime(remaining)}
      </span>

      {postText && (
        <TextCarousel
          text={postText}
          style={{
            fontSize: "20px",
            fontWeight: 400,
            color: subColor,
            textShadow: subShadow,
            textAlign: "center",
            lineHeight: 1.3,
          }}
        />
      )}
    </div>
  )
}
