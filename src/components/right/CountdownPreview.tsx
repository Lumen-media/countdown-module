import { useCountdownStore, formatTime } from "../../store.js"

function getPreviewBg(config: ReturnType<typeof useCountdownStore.getState>["config"]): string {
  const { background, preset } = config.appearance

  if (background.type === "solid") return background.color
  if (background.type === "gradient") return background.value

  switch (preset) {
    case "light-clean": return "#ffffff"
    case "vibrant-blur": return "linear-gradient(135deg, #7c3aed 0%, #2563eb 50%, #06b6d4 100%)"
    default: return "#000000"
  }
}

export function CountdownPreview() {
  const { config, timerState } = useCountdownStore()
  const { appearance, preText, postText } = config
  const { remainingSeconds } = timerState

  const isLight = appearance.preset === "light-clean"
  const timerColor = appearance.timerColor || (isLight ? "#000000" : "#ffffff")
  const subTextColor = isLight
    ? `rgba(0,0,0,${appearance.prePostOpacity})`
    : `rgba(255,255,255,${appearance.prePostOpacity})`
  const bg = getPreviewBg(config)
  const isGradientOrSolid = !bg.startsWith("linear") || true
  const bgStyle = bg.startsWith("linear-gradient") ? { backgroundImage: bg } : { backgroundColor: bg }

  const textStyle: React.CSSProperties = {
    margin: 0,
    padding: 0,
    lineHeight: 1.3,
    textAlign: "center" as const,
    display: "block",
  }

  const glowValue = appearance.textShadowGlow ?? 0
  const timerGlow = glowValue > 0 ? `0 0 ${glowValue * 40}px rgba(255,255,255,0.8)` : "none"
  const subGlow = glowValue > 0 ? `0 0 ${glowValue * 24}px rgba(255,255,255,0.5)` : "none"

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "10px",
        overflow: "hidden",
        ...bgStyle,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        position: "relative",
        isolation: "isolate",
      }}
    >
      {preText ? (
        <span
          style={{
            ...textStyle,
            fontSize: "18px",
            fontWeight: 500,
            color: subTextColor,
            textShadow: subGlow,
          }}
        >
          {preText}
        </span>
      ) : null}

      <span
        style={{
          ...textStyle,
          fontSize: "80px",
          fontWeight: 900,
          color: timerColor,
          fontFamily:
            appearance.font === "Inter (System Default)"
              ? "system-ui, -apple-system, sans-serif"
              : appearance.font,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-2px",
          textShadow: timerGlow,
        }}
      >
        {formatTime(remainingSeconds)}
      </span>

      {postText ? (
        <span
          style={{
            ...textStyle,
            fontSize: "16px",
            fontWeight: 400,
            color: subTextColor,
            textShadow: subGlow,
          }}
        >
          {postText}
        </span>
      ) : null}
    </div>
  )
}
