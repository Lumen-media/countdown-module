import { useEffect, useRef, useState } from "react"
import { emit, listen } from "@tauri-apps/api/event"
import { displayAnchor, type CountdownTickPayload } from "../../lib/display-mode.js"
import { useAdaptiveTextAppearance } from "../../lib/adaptive-text.js"
import { DigitDisplay } from "../DigitDisplay.js"
import { FlipClockDisplay } from "../FlipClockDigit.js"
import { CircularProgress } from "../CircularProgress.js"
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
  return {}
}

export function CountdownDisplay({ initialTick }: { initialTick?: CountdownTickPayload }) {
  const [tick, setTick] = useState<CountdownTickPayload | null>(initialTick ?? null)
  const cachedConfigRef = useRef<CountdownConfig | null>(initialTick?.config ?? null)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    if (!initialTick) return
    if (initialTick.config) {
      cachedConfigRef.current = initialTick.config
    }
    setTick(initialTick)
    setImgError(false)
  }, [initialTick])

  useEffect(() => {
    const unlistenPromise = listen<CountdownTickPayload>("countdown:tick", (event) => {
      const payload = event.payload
      if (payload.config) {
        cachedConfigRef.current = payload.config
      }
      setTick(payload)
    })
    emit("countdown:display-ready").catch((err) =>
      console.warn("[countdown-module] display ready", err)
    )
    return () => {
      unlistenPromise
        .then((dispose) => void dispose())
        .catch((err) => console.warn("[countdown-module] unlisten", err))
    }
  }, [])

  const config = tick?.config ?? cachedConfigRef.current

  if (!tick || !config) {
    return (
      <div data-countdown-stage style={{ width: "100%", height: "100%", background: "black" }} />
    )
  }

  const { remaining, cornerActive, renderConfiguredBackground } = tick
  const { appearance, preText, postText } = config
  const bgStyle = renderConfiguredBackground ? bgToStyle(config) : {}
  // biome-ignore lint/correctness/useHookAtTopLevel: the display cannot derive appearance until a tick/config exists.
  const { timerColor, prePostColor, timerShadow, subShadow } = useAdaptiveTextAppearance({
    appearance,
  })
  const subColor = `${prePostColor ?? "#ffffff"}${Math.round(
    (appearance.prePostOpacity ?? 0.8) * 255
  )
    .toString(16)
    .padStart(2, "0")}`

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
      {renderConfiguredBackground && !imgError && appearance.background.type === "image" && (
        <img
          src={appearance.background.value}
          alt=""
          decoding="async"
          onError={() => setImgError(true)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}
      {renderConfiguredBackground && appearance.background.type === "video" && (
        <video
          src={appearance.background.value}
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
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
          {appearance.showProgressBar &&
            (() => {
              const isFlipClock = appearance.digitAnimation === "flip"
              const ringSize = cornerActive
                ? isFlipClock
                  ? 118
                  : 90
                : Math.max(appearance.fontSize * (isFlipClock ? 4.6 : 3.5), 200)
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
              fontFamily:
                appearance.font === "Inter (System Default)"
                  ? "system-ui, sans-serif"
                  : appearance.font,
              textShadow: timerShadow,
              lineHeight: 1,
              whiteSpace: "nowrap",
              transition: "font-size 260ms ease",
            }}
          >
            {appearance.digitAnimation === "flip" ? (
              <FlipClockDisplay
                seconds={remaining}
                color={timerColor}
                fontFamily={
                  appearance.font === "Inter (System Default)"
                    ? "system-ui, sans-serif"
                    : appearance.font
                }
                fontSize={cornerActive ? 48 : appearance.fontSize}
              />
            ) : (
              <DigitDisplay
                seconds={remaining}
                animation={appearance.digitAnimation}
                pulseEffect={appearance.pulseEffect && remaining <= 60}
              />
            )}
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
