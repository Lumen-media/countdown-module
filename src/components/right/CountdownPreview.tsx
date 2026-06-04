import { useCountdownStore, formatTime } from "../../store.js"

function getPreviewBackground(config: ReturnType<typeof useCountdownStore.getState>["config"]): React.CSSProperties {
  const { background, preset } = config.appearance

  if (background.type === "gradient") {
    return { background: background.value }
  }
  if (background.type === "solid") {
    return { background: background.color }
  }

  switch (preset) {
    case "light-clean":
      return { background: "#ffffff" }
    case "vibrant-blur":
      return {
        background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 50%, #06b6d4 100%)",
      }
    default:
      return { background: "#000000" }
  }
}

export function CountdownPreview() {
  const { config, timerState } = useCountdownStore()
  const { appearance, preText, postText } = config
  const { remainingSeconds } = timerState

  const bgStyle = getPreviewBackground(config)
  const isLight = appearance.preset === "light-clean"
  const textColor = appearance.timerColor || (isLight ? "#000000" : "#ffffff")
  const subColor = `rgba(${isLight ? "0,0,0" : "255,255,255"}, ${appearance.prePostOpacity})`

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
        gap: "8px",
        position: "relative",
      }}
    >
      {preText && (
        <p
          style={{
            margin: 0,
            fontSize: "18px",
            color: subColor,
            fontWeight: 500,
            textAlign: "center",
            textShadow: appearance.textShadowGlow > 0 ? `0 0 ${appearance.textShadowGlow * 30}px currentColor` : "none",
          }}
        >
          {preText}
        </p>
      )}

      <p
        style={{
          margin: 0,
          fontSize: "80px",
          fontWeight: 900,
          color: textColor,
          fontFamily: appearance.font === "Inter (System Default)" ? "system-ui, sans-serif" : appearance.font,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
          letterSpacing: "-2px",
          textShadow: appearance.textShadowGlow > 0 ? `0 0 ${appearance.textShadowGlow * 40}px currentColor` : "none",
        }}
      >
        {formatTime(remainingSeconds)}
      </p>

      {postText && (
        <p
          style={{
            margin: 0,
            fontSize: "16px",
            color: subColor,
            fontWeight: 400,
            textAlign: "center",
          }}
        >
          {postText}
        </p>
      )}
    </div>
  )
}
