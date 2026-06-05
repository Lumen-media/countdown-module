import { useCountdownStore, formatTime } from "../../store.js"

function getPreviewBg(config: ReturnType<typeof useCountdownStore.getState>["config"]): React.CSSProperties {
  const { background, preset } = config.appearance
  if (background.type === "solid") return { backgroundColor: background.color }
  if (background.type === "gradient") return { backgroundImage: background.value }
  if (background.type === "image") return { backgroundImage: `url(${background.value})`, backgroundSize: "cover" }
  if (background.type === "video") return { backgroundColor: "#000" }

  switch (preset) {
    case "light-clean": return { backgroundColor: "#ffffff" }
    case "vibrant-blur": return { backgroundImage: "linear-gradient(135deg, #7c3aed 0%, #2563eb 50%, #06b6d4 100%)" }
    default: return { backgroundColor: "#000000" }
  }
}

export function CountdownPreview() {
  const { config, timerState } = useCountdownStore()
  const { appearance, preText, postText } = config
  const { remainingSeconds } = timerState

  const isLight = appearance.preset === "light-clean"
  const timerColor = appearance.timerColor || (isLight ? "#000000" : "#ffffff")
  const subColor = isLight
    ? `rgba(0,0,0,${appearance.prePostOpacity ?? 0.8})`
    : `rgba(255,255,255,${appearance.prePostOpacity ?? 0.8})`

  const glow = (appearance.textShadowGlow ?? 0)
  const timerShadow = glow > 0 ? `0 0 ${glow * 40}px rgba(255,255,255,0.8)` : undefined
  const subShadow = glow > 0 ? `0 0 ${glow * 24}px rgba(255,255,255,0.5)` : undefined

  return (
    <div
      className="w-full h-full rounded-xl overflow-hidden flex flex-col items-center justify-center gap-2.5 relative isolate"
      style={getPreviewBg(config)}
    >
      {preText && (
        <span
          className="text-lg font-medium text-center block leading-snug"
          style={{ color: subColor, textShadow: subShadow }}
        >
          {preText}
        </span>
      )}

      <span
        className="block text-center leading-none tabular-nums tracking-tight"
        style={{
          fontSize: "80px",
          fontWeight: 900,
          color: timerColor,
          letterSpacing: "-2px",
          fontFamily: appearance.font === "Inter (System Default)" ? "system-ui, sans-serif" : appearance.font,
          textShadow: timerShadow,
        }}
      >
        {formatTime(remainingSeconds)}
      </span>

      {postText && (
        <span
          className="text-base font-normal text-center block leading-snug"
          style={{ color: subColor, textShadow: subShadow }}
        >
          {postText}
        </span>
      )}
    </div>
  )
}
