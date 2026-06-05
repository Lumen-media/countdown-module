import { useEffect, useRef, useState } from "react"
import { RotateCcw, Video } from "lucide-react"
import { useDebounceValue } from "usehooks-ts"
import { Input, Select } from "@lumen-media/module-sdk/ui"
import { useCountdownStore } from "../../../store.js"
import type { BackgroundPreset } from "../../../types.js"

const PRESETS: { id: BackgroundPreset; label: string }[] = [
  { id: "default", label: "Default" },
  { id: "dark-minimal", label: "Dark Minimal" },
  { id: "light-clean", label: "Light Clean" },
  { id: "custom", label: "Custom" },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
      {children}
    </p>
  )
}

function PresetThumbnail({ preset }: { preset: BackgroundPreset }) {
  const base = "w-full h-14 rounded-md flex items-center justify-center text-xs font-extrabold tracking-tight overflow-hidden"

  if (preset === "default") {
    return (
      <div className={`${base}`} style={{ background: "var(--background)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
        05:00
      </div>
    )
  }
  if (preset === "dark-minimal") {
    return <div className={`${base} bg-black text-white`}>05:00</div>
  }
  if (preset === "light-clean") {
    return <div className={`${base} bg-white text-black`}>05:00</div>
  }
  return (
    <div className={`${base} bg-zinc-900 text-muted-foreground flex-col gap-1 border border-dashed border-border`}>
      <Video size={14} />
      <span style={{ fontSize: 9 }}>Custom</span>
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
        <SectionLabel>Duration</SectionLabel>
        <div className="flex gap-2">
          {(
            [
              { label: "Minutes", value: localMinutes, set: setLocalMinutes },
              { label: "Seconds", value: localSeconds, set: setLocalSeconds },
            ] as const
          ).map(({ label, value, set }) => (
            <div
              key={label}
              className="flex-1 bg-card border border-border rounded-xl py-3 px-2 flex flex-col items-center gap-1"
            >
              <input
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(e) => set(e.target.value)}
                maxLength={2}
                className="bg-transparent border-none outline-none font-bold text-foreground w-full text-center p-0 tabular-nums"
                style={{ fontSize: 32 }}
              />
              <span className="text-xs font-medium" style={{ color: "var(--primary)" }}>{label}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-1.5 mt-2.5">
          {[
            { label: "+ 10s", delta: 10 },
            { label: "− 10s", delta: -10 },
          ].map(({ label, delta }) => (
            <button
              key={label}
              onClick={() => addSeconds(delta)}
              className="border border-border rounded-md px-2.5 py-1 text-xs text-muted-foreground bg-transparent cursor-pointer hover:text-foreground transition-colors"
            >
              {label}
            </button>
          ))}
          <button
            onClick={handleReset}
            className="border border-border rounded-md px-2.5 py-1 text-xs text-muted-foreground bg-transparent cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
          >
            <RotateCcw size={11} />
            Reset
          </button>
        </div>
      </div>

      <div>
        <SectionLabel>Display Text</SectionLabel>
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Pre text"
            value={config.preText}
            onChange={(e) => setConfig({ preText: e.target.value })}
          />
          <textarea
            placeholder="Post text"
            value={config.postText}
            onChange={(e) => setConfig({ postText: e.target.value })}
            rows={2}
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none resize-none leading-relaxed placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div>
        <SectionLabel>On Completion</SectionLabel>
        <Select
          value={config.actions.autoAdvance.enabled ? "auto-next" : "none"}
          onValueChange={(v) =>
            setConfig({
              actions: {
                ...config.actions,
                autoAdvance: {
                  ...config.actions.autoAdvance,
                  enabled: v !== "none",
                  target: "next",
                },
              },
            })
          }
        >
          <Select.SelectTrigger className="w-full">
            <Select.SelectValue>
              {config.actions.autoAdvance.enabled ? "Auto-switch to next Scene" : "None"}
            </Select.SelectValue>
          </Select.SelectTrigger>
          <Select.SelectContent>
            <Select.SelectItem value="none">None</Select.SelectItem>
            <Select.SelectItem value="auto-next">Auto-switch to next Scene</Select.SelectItem>
          </Select.SelectContent>
        </Select>
      </div>

      <div>
        <SectionLabel>Background Preset</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => {
            const isSelected = config.appearance.preset === p.id
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className="bg-transparent rounded-xl p-1.5 cursor-pointer flex flex-col gap-1.5 transition-colors border-2"
                style={{
                  borderColor: isSelected ? "#0dd9e8" : "var(--border)",
                  borderStyle: p.id === "custom" && !isSelected ? "dashed" : "solid",
                }}
              >
                <PresetThumbnail preset={p.id} />
                <span
                  className={`text-xs text-center ${isSelected ? "text-foreground font-semibold" : "text-muted-foreground font-normal"}`}
                >
                  {p.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
