import { displayAnchor } from "../../lib/display-mode.js"
import { useCountdownStore, formatTime } from "../../store.js"
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
  if (bg.type === "image") return { backgroundImage: `url(${bg.value})`, backgroundSize: "cover", backgroundPosition: "center" }
  return {}
}

function ProfileBg() {
  const profileBackground = useCountdownStore((s) => s.profileBackground)

  if (!profileBackground) {
    return <div className="absolute inset-0" style={{ background: "var(--background)" }} />
  }

  const { src, type } = profileBackground
  const isReady = src.startsWith("blob:") || src.startsWith("http") || src.startsWith("data:")

  if (!isReady) {
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

  return <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
}

export function CountdownPreview() {
  const config = useCountdownStore((s) => s.config)
  const profileBackground = useCountdownStore((s) => s.profileBackground)
  const { appearance, preText, postText } = config
  const remainingSeconds = config.totalSeconds
  const cornerActive = appearance.overlayMode === "corner"

  const glow = appearance.textShadowGlow ?? 0
  const timerShadow = glow > 0 ? `0 0 ${glow * 40}px rgba(255,255,255,0.8)` : undefined
  const subColor = `${appearance.prePostColor ?? "#ffffff"}${Math.round((appearance.prePostOpacity ?? 0.8) * 255).toString(16).padStart(2, "0")}`
  const subShadow = glow > 0 ? `0 0 ${glow * 24}px rgba(255,255,255,0.5)` : undefined
  const isProfile = appearance.background.type === "profile"

  return (
    <div
      className="relative isolate h-full w-full overflow-hidden rounded-xl"
      style={isProfile ? {} : bgToStyle(appearance.background)}
    >
      {isProfile && <ProfileBg />}

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
            className="block text-center font-medium leading-snug"
            style={{
              fontSize: cornerActive ? "14px" : "16px",
              color: subColor,
              textShadow: subShadow,
              transition: "font-size 260ms ease",
            }}
          >
            {formatPreText(preText)}
          </span>
        )}

        <span
          className="block text-center leading-none tabular-nums"
          style={{
            fontSize: cornerActive ? "54px" : "80px",
            fontWeight: 900,
            color: appearance.timerColor,
            letterSpacing: "-2px",
            fontFamily: appearance.font === "Inter (System Default)" ? "system-ui, sans-serif" : appearance.font,
            textShadow: timerShadow,
            transition: "font-size 260ms ease",
          }}
        >
          {formatTime(remainingSeconds)}
        </span>

        {postText && (
          <TextCarousel
            text={postText}
            style={{
              fontSize: "16px",
              color: subColor,
              textShadow: subShadow,
              transition: "font-size 260ms ease",
            }}
            className="block text-center font-normal leading-snug"
          />
        )}
      </div>
    </div>
  )
}
