import { useState } from "react"
import { Save, Trash2, Upload } from "lucide-react"
import { Button, ScrollArea } from "@lumen-media/module-sdk/ui"
import { useCountdownStore } from "../../store.js"
import type { HotkeyAction } from "../../types.js"
import { t } from "../../i18n.js"
import { useEventListener } from "usehooks-ts"

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
      {children}
    </p>
  )
}

function formatHotkey(hk: string): string {
  let result = hk.replace(/Key([A-Z])/g, "$1")
  result = result.replace(/ArrowUp/g, "↑")
  result = result.replace(/ArrowDown/g, "↓")
  result = result.replace(/Escape/g, "Esc")
  result = result.replace(/Equal/g, "=")
  result = result.replace(/Minus/g, "-")
  result = result.replace(/Enter/g, "Enter")
  result = result.replace(/Space/g, "Space")
  return result
}

const HOTKEY_ACTIONS: { action: HotkeyAction; labelKey: string }[] = [
  { action: "start", labelKey: "configure.hotkeys.start" },
  { action: "pause", labelKey: "configure.hotkeys.pause" },
  { action: "reset", labelKey: "configure.hotkeys.reset" },
  { action: "add10", labelKey: "configure.hotkeys.add10" },
  { action: "sub10", labelKey: "configure.hotkeys.sub10" },
]

export function TimerSettings() {
  const { config, timerPresets, saveTimerPreset, loadTimerPreset, deleteTimerPreset, updateHotkeys, setConfig } = useCountdownStore()
  const timerRunning = useCountdownStore((s) => s.timerState.status) === "running"
  const [presetName, setPresetName] = useState("")
  const [recordingHotkey, setRecordingHotkey] = useState<HotkeyAction | null>(null)

  useEventListener("keydown", (event) => {
    if (!recordingHotkey) return
    event.preventDefault()
    event.stopPropagation()
    const parts: string[] = []
    if (event.ctrlKey) parts.push("Ctrl")
    if (event.shiftKey) parts.push("Shift")
    const code = event.code === "Space" ? "Space" : event.code.startsWith("Key") ? event.code : event.code
    parts.push(code)
    updateHotkeys({ [recordingHotkey]: parts.join("+") })
    setRecordingHotkey(null)
  })

  return (
    <div className="flex flex-col gap-4 min-w-64 select-none">
      <div>
        <SectionLabel>{t("configure.section.timerPresets")}</SectionLabel>
        <div className="flex flex-col gap-2">
          <div className="flex gap-1.5">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder={t("configure.timerPresets.namePlaceholder")}
              onKeyDown={(e) => { if (e.key === "Enter") { saveTimerPreset(presetName || `Preset ${timerPresets.length + 1}`); setPresetName("") } }}
              className="flex-1 bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none text-foreground placeholder:text-muted-foreground"
            />
            <Button
              variant="outline"
              size="xs"
              disabled={timerRunning}
              onClick={() => { saveTimerPreset(presetName || `Preset ${timerPresets.length + 1}`); setPresetName("") }}
              className="shrink-0 h-auto"
            >
              <Save size={11} />
              {t("configure.timerPresets.save")}
            </Button>
          </div>
          {timerPresets.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">{t("configure.timerPresets.noPresets")}</p>
          ) : (
            <ScrollArea className="flex flex-col max-h-40">
              <div className="flex flex-col flex-1 gap-1 pr-3">
                {timerPresets.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5 bg-background rounded-lg px-2 py-1.5">
                    <span className="flex-1 text-xs text-foreground truncate">{p.name}</span>
                    <button
                      type="button"
                      onClick={() => loadTimerPreset(p.id)}
                      disabled={timerRunning}
                      className="text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      title={t("configure.timerPresets.load")}
                    >
                      <Upload size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTimerPreset(p.id)}
                      className="text-muted-foreground hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer p-0.5"
                      title={t("configure.timerPresets.delete")}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      <div>
        <SectionLabel>{t("configure.section.webhook")}</SectionLabel>
        <div className="flex flex-col gap-1.5">
          <input
            type="text"
            value={config.behavior.webhookUrl}
            onChange={(event) => setConfig({ behavior: { ...config.behavior, webhookUrl: event.target.value } })}
            placeholder="https://example.com/webhook"
            className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div>
        <SectionLabel>{t("configure.section.hotkeys")}</SectionLabel>
        <div className="flex flex-col gap-1.5">
          {HOTKEY_ACTIONS.map(({ action, labelKey }) => (
            <div key={action} className="flex items-center gap-2 bg-background rounded-lg px-2 py-1.5">
              <span className="flex-1 text-xs text-foreground">{t(labelKey)}</span>
              <button
                type="button"
                onClick={() => setRecordingHotkey(recordingHotkey === action ? null : action)}
                className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border bg-transparent cursor-pointer transition-colors min-w-[4rem] text-center ${recordingHotkey === action
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
                  }`}
              >
                {recordingHotkey === action ? t("configure.hotkeys.record") : formatHotkey(config.hotkeys[action])}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
