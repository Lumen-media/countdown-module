import { useEffect, useRef, useState } from "react"
import { RotateCcw, Video } from "lucide-react"
import { useDebounceValue } from "usehooks-ts"
import { Button, Input, ScrollArea, Select, TextEditor } from "@lumen-media/module-sdk/ui"
import { cn } from "../../../lib/cn.js"
import { useCountdownStore } from "../../../store.js"
import type { BackgroundPreset } from "../../../types.js"
import { t } from "../../../i18n.js"

const PRESETS: { id: BackgroundPreset; labelKey: string }[] = [
  { id: "default", labelKey: "configure.preset.default" },
  { id: "dark-minimal", labelKey: "configure.preset.darkMinimal" },
  { id: "light-clean", labelKey: "configure.preset.lightClean" },
  { id: "custom", labelKey: "configure.preset.custom" },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
      {children}
    </p>
  )
}

const PRESET_STYLES: Record<BackgroundPreset, string> = {
  "default": "bg-background text-foreground border border-border",
  "dark-minimal": "bg-black text-white",
  "light-clean": "bg-white text-black",
  "custom": "bg-card text-muted-foreground flex-col gap-1 border border-dashed border-border",
}

function PresetThumbnail({ preset }: { preset: BackgroundPreset }) {
  const profileBackground = useCountdownStore((s) => s.profileBackground)
  const customBackground = useCountdownStore((s) =>
    s.config.appearance.preset === "custom" ? s.config.appearance.background : null
  )
  const [defaultImgError, setDefaultImgError] = useState(false)
  const [customImgError, setCustomImgError] = useState(false)
  const base = "w-full rounded-md overflow-hidden aspect-video flex items-center justify-center text-xs font-extrabold tracking-tight relative"

  if (preset === "default") {
    const isReady = !defaultImgError && profileBackground?.src && (
      profileBackground.src.startsWith("blob:") ||
      profileBackground.src.startsWith("http") ||
      profileBackground.src.startsWith("data:")
    )
    return (
      <div className={cn(base, !isReady && PRESET_STYLES["default"])}>
        {isReady && (
          profileBackground!.type === "video"
            ? <video src={profileBackground!.src} className="absolute inset-0 w-full h-full object-cover" muted />
            : <img src={profileBackground!.thumb ?? profileBackground!.src} alt="" className="absolute inset-0 w-full h-full object-cover" onError={() => setDefaultImgError(true)} />
        )}
        <span className="relative drop-shadow text-white">05:00</span>
      </div>
    )
  }

  if (preset === "custom") {
    const hasMedia = !customImgError && customBackground && (customBackground.type === "image" || customBackground.type === "video")
    return (
      <div className={cn(base, !hasMedia && PRESET_STYLES["custom"])}>
        {hasMedia && (
          customBackground.type === "video"
            ? <video src={customBackground.value} className="absolute inset-0 w-full h-full object-cover" muted />
            : <img src={customBackground.value} alt="" className="absolute inset-0 w-full h-full object-cover" onError={() => setCustomImgError(true)} />
        )}
        {hasMedia
          ? <span className="relative drop-shadow text-white">05:00</span>
          : <><Video size={14} /><span className="text-[9px]">{t("configure.preset.custom")}</span></>
        }
      </div>
    )
  }

  return (
    <div className={cn(base, PRESET_STYLES[preset])}>
      05:00
    </div>
  )
}

export function ConfigureTab() {
  const { config, setConfig, setTotalSeconds, applyPreset } = useCountdownStore()

  const [localMinutes, setLocalMinutes] = useState(
    String(Math.floor(config.totalSeconds / 60)).padStart(2, "0")
  )
  const [localSeconds, setLocalSeconds] = useState(
    String(config.totalSeconds % 60).padStart(2, "0")
  )

  const [debouncedMinutes] = useDebounceValue(localMinutes, 300)
  const [debouncedSeconds] = useDebounceValue(localSeconds, 300)

  const prevDebounced = useRef({ minutes: debouncedMinutes, seconds: debouncedSeconds })

  useEffect(() => {
    const prev = prevDebounced.current
    const mChanged = prev.minutes !== debouncedMinutes
    const sChanged = prev.seconds !== debouncedSeconds
    prevDebounced.current = { minutes: debouncedMinutes, seconds: debouncedSeconds }

    if (!mChanged && !sChanged) return

    const m = Math.min(99, Math.max(0, parseInt(debouncedMinutes) || 0))
    const s = Math.min(59, Math.max(0, parseInt(debouncedSeconds) || 0))
    setTotalSeconds(m * 60 + s)
  }, [debouncedMinutes, debouncedSeconds])

  function addSeconds(delta: number) {
    const next = Math.max(0, config.totalSeconds + delta)
    setTotalSeconds(next)
    const newMins = String(Math.floor(next / 60)).padStart(2, "0")
    const newSecs = String(next % 60).padStart(2, "0")
    setLocalMinutes(newMins)
    setLocalSeconds(newSecs)
    prevDebounced.current = { minutes: newMins, seconds: newSecs }
  }

  function handleReset() {
    const m = String(Math.floor(config.totalSeconds / 60)).padStart(2, "0")
    const s = String(config.totalSeconds % 60).padStart(2, "0")
    setLocalMinutes(m)
    setLocalSeconds(s)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <SectionLabel>{t("configure.section.duration")}</SectionLabel>
        <div className="flex gap-2">
          {(
            [
              { label: t("configure.duration.minutes"), value: localMinutes, set: setLocalMinutes },
              { label: t("configure.duration.seconds"), value: localSeconds, set: setLocalSeconds },
            ] as const
          ).map(({ label, value, set }) => (
            <div
              key={label}
              className="flex-1 bg-background border border-border rounded-xl py-4 px-2 flex flex-col items-center gap-1.5"
            >
              <input
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(e) => set(e.target.value)}
                maxLength={2}
                className="bg-background dark:bg-background border-none outline-none font-extrabold text-foreground w-full text-center p-0 tabular-nums"
                style={{ fontSize: 36 }}
              />
              <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>{label}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between gap-1.5 mt-2.5">
          {[
            { label: t("configure.adjust.plus10"), delta: 10 },
            { label: t("configure.adjust.minus10"), delta: -10 },
          ].map(({ label, delta }) => (
            <Button
              key={label}
              variant="outline"
              size="xs"
              onClick={() => addSeconds(delta)}
              className="text-muted-foreground hover:text-foreground flex-1"
            >
              {label}
            </Button>
          ))}
          <Button
            variant="outline"
            size="xs"
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground gap-1 flex-1"
          >
            <RotateCcw size={11} />
            {t("configure.adjust.reset")}
          </Button>
        </div>
      </div>

      <div>
        <SectionLabel>{t("configure.section.displayText")}</SectionLabel>
        <div className="flex flex-col gap-2">
          <Input
            placeholder={t("configure.displayText.pre")}
            value={config.preText}
            onChange={(e) => setConfig({ preText: e.target.value })}
            className="bg-background dark:bg-background"
          />
          <label className="max-h-[4.1lh] p-1 overflow-hidden rounded-md border border-input bg-background">
            <ScrollArea className="h-full max-h-[4.1lh]">
              <TextEditor
                placeholder={t("configure.displayText.post")}
                defaultValue={config.postText}
                onChange={(e) => setConfig({ postText: e })}
                className="[&_.tiptap]:p-1"
              />
            </ScrollArea>
          </label>
        </div>
      </div>

      <div>
        <SectionLabel>{t("configure.section.onCompletion")}</SectionLabel>
        <Select
          value={config.actions.autoAdvance.enabled ? "auto-next" : "none"}
          onValueChange={(v) =>
            setConfig({
              actions: {
                ...config.actions,
                autoAdvance: {
                  ...config.actions.autoAdvance,
                  enabled: v !== "none",
                },
              },
            })
          }
        >
          <Select.SelectTrigger className="w-full bg-background dark:bg-background">
            <Select.SelectValue>
              {config.actions.autoAdvance.enabled ? t("configure.onCompletion.autoNext") : t("configure.onCompletion.none")}
            </Select.SelectValue>
          </Select.SelectTrigger>
          <Select.SelectContent>
            <Select.SelectItem value="none">{t("configure.onCompletion.none")}</Select.SelectItem>
            <Select.SelectItem value="auto-next">{t("configure.onCompletion.autoNext")}</Select.SelectItem>
          </Select.SelectContent>
        </Select>
      </div>

      <div>
        <SectionLabel>{t("configure.section.backgroundPreset")}</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => {
            const isSelected = config.appearance.preset === p.id
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className="bg-transparent rounded-xl p-1.5 cursor-pointer flex flex-col gap-1.5 transition-colors border-2"
                style={{
                  borderColor: isSelected ? "var(--primary)" : "var(--border)",
                  borderStyle: p.id === "custom" && !isSelected ? "dashed" : "solid",
                }}
              >
                <PresetThumbnail preset={p.id} />
                <span
                  className={`text-xs text-center ${isSelected ? "text-foreground font-semibold" : "text-muted-foreground font-normal"}`}
                >
                  {t(p.labelKey)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}