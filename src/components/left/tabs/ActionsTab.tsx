import { Bell, ChevronsRight, Music, Plus, Type } from "lucide-react"
import { Label, Select, Switch } from "@lumen-media/module-sdk/ui"
import { useCountdownStore } from "../../../store.js"
import type { TimeTrigger } from "../../../types.js"

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
      {children}
    </p>
  )
}

function formatTime(seconds: number) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0")
  const s = String(seconds % 60).padStart(2, "0")
  return `${m}:${s}`
}

function TriggerCard({ trigger }: { trigger: TimeTrigger }) {
  const isChime = trigger.type === "warning-chime"
  const label = isChime ? "Warning Chime" : "Change Pre/Post Text"
  const Icon = isChime ? Bell : Type

  return (
    <div className="bg-background rounded-xl px-3 pt-3 pb-2.5 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon size={13} className="text-muted-foreground shrink-0" />
        <span className="text-sm font-semibold text-foreground flex-1">{label}</span>
        <Switch checked={trigger.enabled} onCheckedChange={() => { }} className="shrink-0" />
      </div>
      {isChime && (
        <div className="flex items-center justify-between px-0.5">
          <span className="text-sm font-mono font-bold" style={{ color: "var(--primary)" }}>
            {formatTime(trigger.atSeconds)}
          </span>
          <Music size={13} className="text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

export function ActionsTab() {
  const { config, setConfig } = useCountdownStore()
  const { autoAdvance } = config.actions
  const { hideOnCompletion } = config.behavior

  return (
    <div className="flex flex-col gap-5">
      <div>
        <SectionLabel>End Action</SectionLabel>
        <div className="bg-background rounded-xl px-3 pt-3 pb-2.5 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "color-mix(in srgb, var(--primary) 20%, transparent)" }}
            >
              <ChevronsRight size={13} style={{ color: "var(--primary)" }} />
            </div>
            <span className="text-sm font-semibold text-foreground flex-1">Auto-Advance</span>
            <Switch
              checked={autoAdvance.enabled}
              onCheckedChange={(v) =>
                setConfig({ actions: { ...config.actions, autoAdvance: { ...autoAdvance, enabled: v } } })
              }
              className="shrink-0"
            />
          </div>
          <p className="text-xs text-muted-foreground leading-snug">
            Automatically transition to the next item in the playlist when timer reaches zero.
          </p>
          <Select
            value={autoAdvance.target}
            onValueChange={(v) =>
              setConfig({ actions: { ...config.actions, autoAdvance: { ...autoAdvance, target: v } } })
            }
          >
            <Select.SelectTrigger className="w-full bg-background dark:bg-background">
              <Select.SelectValue>Go to Next Item</Select.SelectValue>
            </Select.SelectTrigger>
            <Select.SelectContent>
              <Select.SelectItem value="next">Go to Next Item</Select.SelectItem>
            </Select.SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <SectionLabel>Time Triggers</SectionLabel>
        <div className="flex flex-col gap-2">
          {config.actions.timeTriggers.map((trigger, i) => (
            <TriggerCard key={i} trigger={trigger} />
          ))}
          <button
            type="button"
            className="w-full border border-dashed border-border rounded-xl py-2.5 text-xs text-muted-foreground cursor-pointer flex items-center justify-center gap-1.5 hover:text-foreground hover:border-foreground/30 transition-colors bg-transparent"
          >
            <Plus size={12} />
            Add Time Trigger
          </button>
        </div>
      </div>

      <div>
        <SectionLabel>Behavior</SectionLabel>
        <div className="space-y-2">
          <Label className="flex w-full items-center justify-between text-sm text-foreground">
            Hide on completion
            <Switch
              checked={hideOnCompletion}
              onCheckedChange={(v) => setConfig({ behavior: { ...config.behavior, hideOnCompletion: v } })}
              className="shrink-0"
            />
          </Label>

          <Label className="flex w-full items-center justify-between text-sm text-foreground">
            Allow negative time (overrun)
            <Switch
              checked={config.allowNegative}
              onCheckedChange={(v) => setConfig({ allowNegative: v })}
              className="shrink-0"
            />
          </Label>

        </div>
      </div>
    </div>
  )
}
