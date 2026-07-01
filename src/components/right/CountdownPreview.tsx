import { memo, useState } from "react"
import { displayAnchor } from "../../lib/display-mode.js"
import { useAdaptiveTextAppearance } from "../../lib/adaptive-text.js"
import { useCountdownStore } from "../../store.js"
import { DigitDisplay } from "../DigitDisplay.js"
import { CircularProgress } from "../CircularProgress.js"
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
    return <div className="absolute inset-0" style={{ background: "var(--background)" }} />
  }

  const { src, type } = profileBackground
  const isReady = src.startsWith("blob:") || src.startsWith("http") || src.startsWith("data:")

  if (!isReady || imgError) {
    return <div className="absolute inset-0" style={{ background: "var(--background)" }} />
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
  const remainingSeconds = config.totalSeconds
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
            className="relative block text-center font-medium leading-snug"
            style={{
              zIndex: 1,
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
          className="relative flex items-center justify-center"
          style={{ margin: cornerActive ? 0 : "4px 0" }}
        >
          {appearance.showProgressBar && (() => {
            const ringSize = cornerActive ? 110 : Math.round(timerFs * 4.2)
            return (
              <div
                className="absolute"
                style={{
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
                  remaining={remainingSeconds}
                  total={config.totalSeconds}
                  color={appearance.progressBarColor}
                  size={ringSize}
                />
              </div>
            )
          })()}
          <span
            className="relative block text-center leading-none"
            style={{
              zIndex: 1,
              fontSize: `${timerFs}px`,
              fontWeight: 900,
              color: timerColor,
              fontFamily: appearance.font === "Inter (System Default)" ? "system-ui, sans-serif" : appearance.font,
              textShadow: timerShadow,
              whiteSpace: "nowrap",
              transition: "font-size 260ms ease",
            }}
          >
            <DigitDisplay seconds={remainingSeconds} animation={appearance.digitAnimation} pulseEffect={appearance.pulseEffect && remainingSeconds <= 60} />
          </span>
        </div>

        {postText && (
          <div className="relative" style={{ zIndex: 1 }}>
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
