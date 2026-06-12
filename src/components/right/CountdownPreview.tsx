import { useEffect, useRef, useState } from "react"
import { useCountdownStore, formatTime } from "../../store.js"
import type { BackgroundConfig } from "../../types.js"
import { TextCarousel } from "../TextCarousel.js"

function useTimerInterval() {
  const tick = useCountdownStore((s) => s.tick)
  const status = useCountdownStore((s) => s.timerState.status)

  useEffect(() => {
    if (status !== "running") return
    const id = setInterval(tick, 100)
    return () => clearInterval(id)
  }, [status, tick])
}

function useFileBlobSrc(path: string | null | undefined): string | undefined {
  const [src, setSrc] = useState<string | undefined>()
  const urlRef = useRef<string | undefined>()

  useEffect(() => {
    if (!path) { setSrc(undefined); return }
    if (path.startsWith("http") || path.startsWith("blob:") || path.startsWith("data:")) {
      setSrc(path); return
    }

    const store = useCountdownStore.getState()
    if (!store._hostFs) { setSrc(undefined); return }

    store._hostFs.read(path)
      .then((bytes) => {
        if (urlRef.current) URL.revokeObjectURL(urlRef.current)
        urlRef.current = URL.createObjectURL(new Blob([bytes]))
        setSrc(urlRef.current)
      })
      .catch(() => setSrc(undefined))

    return () => {
      if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = undefined }
    }
  }, [path])

  return src
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
        className="absolute inset-0 w-full h-full object-cover"
      />
    )
  }

  return <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
}

export function CountdownPreview() {
  useTimerInterval()
  const { config, timerState } = useCountdownStore()
  const { appearance, preText, postText } = config
  const { remainingSeconds } = timerState

  const glow = appearance.textShadowGlow ?? 0
  const timerShadow = glow > 0 ? `0 0 ${glow * 40}px rgba(255,255,255,0.8)` : undefined
  const subColor = `${appearance.prePostColor ?? "#ffffff"}${Math.round((appearance.prePostOpacity ?? 0.8) * 255).toString(16).padStart(2, "0")}`
  const subShadow = glow > 0 ? `0 0 ${glow * 24}px rgba(255,255,255,0.5)` : undefined
  const isProfile = appearance.background.type === "profile"

  return (
    <div
      className="w-full h-full rounded-xl overflow-hidden flex flex-col items-center justify-center gap-2.5 relative isolate"
      style={isProfile ? {} : bgToStyle(appearance.background)}
    >
      {isProfile && <ProfileBg />}

      <div className="relative z-10 flex flex-col items-center gap-2.5">
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
            color: appearance.timerColor,
            letterSpacing: "-2px",
            fontFamily: appearance.font === "Inter (System Default)" ? "system-ui, sans-serif" : appearance.font,
            textShadow: timerShadow,
          }}
        >
          {formatTime(remainingSeconds)}
        </span>

        {postText && (
          <TextCarousel
            text={postText}
            style={{ color: subColor, textShadow: subShadow }}
            className="text-base font-normal text-center block leading-snug"
          />
        )}
      </div>
    </div>
  )
}
