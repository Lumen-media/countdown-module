import { memo, useState } from "react"
import { displayAnchor } from "../../lib/display-mode.js"
import { useAdaptiveTextAppearance } from "../../lib/adaptive-text.js"
import { useCountdownStore } from "../../store.js"
import { DigitDisplay } from "../DigitDisplay.js"
import { CircularProgress } from "../CircularProgress.js"
import { FlipClockDisplay } from "../FlipClockDigit.js"
import type { BackgroundConfig } from "../../types.js"
import { TextCarousel } from "../TextCarousel.js"

function formatPreText(text: string, maxChars = 28): string {
  const normalized = text.trim()
  if (normalized.length <= maxChars) return normalized

  const slicePoint = normalized.lastIndexOf(" ", maxChars)
  const splitIndex = slicePoint > 0 ? slicePoint : maxChars
  return `${normalized.slice(0, splitIndex)}\n${normalized.slice(splitIndex).trimStart()}`
}

function bgToStyle(bg: BackgroundConfig): React.CSSProperties {
  if (bg.type === "solid") return { backgroundColor: bg.color }
  if (bg.type === "gradient") return { backgroundImage: bg.value }
  return {}
}

const ProfileBg = memo(function ProfileBg_() {
  const profileBackground = useCountdownStore((s) => s.profileBackground)
  const [imgError, setImgError] = useState(false)

  if (!profileBackground) {
    return <div className="absolute inset-0 bg-background" />
  }

  const { src, type } = profileBackground
  const isReady = src.startsWith("blob:") || src.startsWith("http") || src.startsWith("data:")

  if (!isReady || imgError) {
    return <div className="absolute inset-0 bg-background" />
  }

  if (type === "video") {
    return (
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
    )
  }

  return (
    <img
      src={src}
      alt=""
      decoding="async"
      className="absolute inset-0 h-full w-full object-cover"
      onError={() => setImgError(true)}
    />
  )
})

export function CountdownPreview() {
  const config = useCountdownStore((s) => s.config)
  const { appearance, preText, postText } = config
  const previewSeconds = config.countUp ? 0 : config.totalSeconds
  const cornerActive = appearance.overlayMode === "corner"

  const { timerColor, prePostColor, timerShadow, subShadow } = useAdaptiveTextAppearance({
    appearance,
  })

  const timerFs = cornerActive ? 54 : Math.min(appearance.fontSize, 80)
  const textFs = cornerActive ? 14 : Math.round(timerFs * 0.2)
  const subColor = `${prePostColor ?? "#ffffff"}${Math.round((appearance.prePostOpacity ?? 0.8) * 255).toString(16).padStart(2, "0")}`
  const bg = appearance.background

  return (
    <div
      data-countdown-stage
      className="relative isolate h-full w-full overflow-hidden rounded-xl"
      style={bg.type === "profile" ? {} : bgToStyle(bg)}
    >
      {bg.type === "profile" ? (
        <ProfileBg />
      ) : bg.type === "image" ? (
        <img src={bg.value} alt="" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      ) : bg.type === "video" ? (
        <video src={bg.value} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover" />
      ) : null}

      <div
        className="absolute z-10 flex flex-col items-center text-center"
        style={{
          gap: cornerActive ? "6px" : "10px",
          width: cornerActive ? "min(24%, 180px)" : "min(70%, 620px)",
          transition: "top 260ms ease, left 260ms ease, transform 260ms ease, gap 260ms ease, width 260ms ease",
          ...displayAnchor(appearance.cornerPosition, cornerActive),
        }}
      >
        {preText && (
          <span
            className="relative block text-center font-medium leading-snug z-10"
            style={{
              fontSize: `${textFs}px`,
              color: subColor,
              textShadow: subShadow,
              transition: "font-size 260ms ease",
            }}
          >
            {formatPreText(preText)}
          </span>
        )}

        <div
          className={`relative flex items-center justify-center ${cornerActive ? "my-0" : "my-1"}`}
        >
          {appearance.showProgressBar && (() => {
            const isFlipClock = appearance.digitAnimation === "flip"
            const ringSize = cornerActive
              ? (isFlipClock ? 132 : 110)
              : Math.round(timerFs * (isFlipClock ? 5 : 4.2))
            return (
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"
                style={{ width: ringSize, height: ringSize }}
              >
                <CircularProgress
                  remaining={previewSeconds}
                  total={config.totalSeconds}
                  color={appearance.progressBarColor}
                  size={ringSize}
                />
              </div>
            )
          })()}
          <span
            className="relative block text-center leading-none font-black whitespace-nowrap z-10"
            style={{
              fontSize: `${timerFs}px`,
              color: timerColor,
              fontFamily: appearance.font === "Inter (System Default)" ? "system-ui, sans-serif" : appearance.font,
              textShadow: timerShadow,
              transition: "font-size 260ms ease",
            }}
          >
            {appearance.digitAnimation === "flip" ? (
              <FlipClockDisplay
                seconds={previewSeconds}
                color={timerColor}
                fontFamily={appearance.font === "Inter (System Default)" ? "system-ui, sans-serif" : appearance.font}
                fontSize={timerFs}
              />
            ) : (
              <DigitDisplay seconds={previewSeconds} animation={appearance.digitAnimation} pulseEffect={false} />
            )}
          </span>
        </div>

        {postText && (
          <div className="relative z-10">
            <TextCarousel
              text={postText}
              style={{
                fontSize: `${textFs}px`,
                color: subColor,
                textShadow: subShadow,
                transition: "font-size 260ms ease",
              }}
              className="relative block text-center font-normal leading-snug"
            />
          </div>
        )}
      </div>
    </div>
  )
}
