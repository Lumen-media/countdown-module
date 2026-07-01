import { memo, useEffect, useState } from "react"
import { emit, listen } from "@tauri-apps/api/event"
import { displayAnchor, type CountdownTickPayload } from "../../lib/display-mode.js"
import { useAdaptiveTextAppearance } from "../../lib/adaptive-text.js"
import { DigitDisplay } from "../DigitDisplay.js"
import { CircularProgress } from "../CircularProgress.js"
import type { BackgroundConfig, CountdownConfig } from "../../types.js"
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
  return {}
}

function bgKey(bg: BackgroundConfig): string {
  if (bg.type === "profile") return "profile"
  if (bg.type === "solid") return `solid:${bg.color}`
  if (bg.type === "gradient") return `gradient:${bg.value}`
  if (bg.type === "image") return `image:${bg.value}:${bg.opacity}`
  if (bg.type === "video") return `video:${bg.value}:${bg.opacity}`
  return ""
}

const ConfiguredBackgroundMedia = memo(function ConfiguredBackgroundMedia_({
  background,
}: {
  background: BackgroundConfig
}) {
  const [imgError, setImgError] = useState(false)

  if (background.type === "image") {
    if (imgError) return null
    return (
      <img
        src={background.value}
        alt=""
        decoding="async"
        onError={() => setImgError(true)}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", opacity: background.opacity, willChange: "transform",
        }}
      />
    )
  }

  if (background.type === "video") {
    return (
      <video
        src={background.value}
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", opacity: background.opacity, willChange: "transform",
        }}
      />
    )
  }

  return null
}, (prev, next) => bgKey(prev.background) === bgKey(next.background))

export function CountdownDisplay({ initialTick }: { initialTick?: CountdownTickPayload }) {
  const [tick, setTick] = useState<CountdownTickPayload | null>(initialTick ?? null)

  useEffect(() => {
    const unlisten = listen<CountdownTickPayload>("countdown:tick", (event) => {
      setTick(event.payload)
    })
    emit("countdown:display-ready").catch(() => {})
    return () => {
      unlisten.then((dispose) => dispose()).catch(() => {})
    }
  }, [])

  if (!tick) {
    return <div data-countdown-stage style={{ width: "100%", height: "100%", background: "black" }} />
  }

  const { remaining, config, cornerActive, renderConfiguredBackground } = tick
  const { appearance, preText, postText } = config
  const bgStyle = renderConfiguredBackground ? bgToStyle(config) : {}
  const { timerColor, prePostColor, timerShadow, subShadow } = useAdaptiveTextAppearance({
    appearance,
  })
  const subColor = `${prePostColor ?? "#ffffff"}${Math.round((appearance.prePostOpacity ?? 0.8) * 255).toString(16).padStart(2, "0")}`

  return (
    <div
      data-countdown-stage
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        ...bgStyle,
      }}
    >
      {renderConfiguredBackground && (
        <ConfiguredBackgroundMedia background={appearance.background} />
      )}

      <div
        style={{
          position: "absolute",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: cornerActive ? "4px" : "10px",
          textAlign: "center",
          maxWidth: "100vw",
          transition: "top 260ms ease, left 260ms ease, transform 260ms ease, gap 260ms ease",
          ...displayAnchor(appearance.cornerPosition, cornerActive),
        }}
      >
        {preText && (
          <span
            style={{
              position: "relative",
              zIndex: 1,
              fontSize: cornerActive ? "14px" : `${Math.round(appearance.fontSize * 0.18)}px`,
              fontWeight: 500,
              color: subColor,
              textShadow: subShadow,
              lineHeight: 1.3,
              whiteSpace: "nowrap",
              transition: "font-size 260ms ease",
            }}
          >
            {formatPreText(preText)}
          </span>
        )}

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {appearance.showProgressBar && (() => {
            const ringSize = cornerActive ? 90 : Math.max(appearance.fontSize * 3.5, 200)
            return (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: ringSize,
                  height: ringSize,
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              >
                <CircularProgress
                  remaining={remaining}
                  total={config.totalSeconds}
                  color={appearance.progressBarColor}
                  size={ringSize}
                />
              </div>
            )
          })()}
          <span
            style={{
              position: "relative",
              zIndex: 1,
              fontSize: cornerActive ? "48px" : `${appearance.fontSize}px`,
              fontWeight: 900,
              color: timerColor,
              fontFamily: appearance.font === "Inter (System Default)" ? "system-ui, sans-serif" : appearance.font,
              textShadow: timerShadow,
              lineHeight: 1,
              whiteSpace: "nowrap",
              transition: "font-size 260ms ease",
            }}
          >
            <DigitDisplay seconds={remaining} animation={appearance.digitAnimation} pulseEffect={appearance.pulseEffect && remaining <= 60} />
          </span>
        </div>

        {postText && (
          <div style={{ position: "relative", zIndex: 1 }}>
            <TextCarousel
              text={postText}
              style={{
                fontSize: cornerActive ? "14px" : `${Math.round(appearance.fontSize * 0.15)}px`,
                fontWeight: 400,
                color: subColor,
                textShadow: subShadow,
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                transition: "font-size 260ms ease",
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
