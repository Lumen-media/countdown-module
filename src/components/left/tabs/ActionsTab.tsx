import { Plus } from "lucide-react"
import { Switch, Select } from "@lumen-media/module-sdk/ui"
import { useCountdownStore } from "../../../store.js"

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
      {children}
    </p>
  )
}

function Divider() {
  return <div className="h-px bg-border my-1" />
}

function SettingRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-2.5 gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="shrink-0" />
    </div>
  )
}

export function ActionsTab() {
  const { config, setConfig } = useCountdownStore()
  const { autoAdvance } = config.actions
  const { hideOnCompletion } = config.behavior

  return (
    <div className="flex flex-col gap-5">
      {/* END ACTION */}
      <div>
        <SectionLabel>End Action</SectionLabel>
        <SettingRow
          label="Auto-Advance"
          description="Automatically transition to the next item in the playlist when timer reaches zero."
          checked={autoAdvance.enabled}
          onCheckedChange={(v) =>
            setConfig({
              actions: {
                ...config.actions,
                autoAdvance: { ...autoAdvance, enabled: v },
              },
            })
          }
        />
        {autoAdvance.enabled && (
          <Select
            value={autoAdvance.target}
            onValueChange={(v) =>
              setConfig({
                actions: {
                  ...config.actions,
                  autoAdvance: { ...autoAdvance, target: v },
                },
              })
            }
          >
            <Select.SelectTrigger className="w-full mt-1">
              <Select.SelectValue>Go to Next Item</Select.SelectValue>
            </Select.SelectTrigger>
            <Select.SelectContent>
              <Select.SelectItem value="next">Go to Next Item</Select.SelectItem>
            </Select.SelectContent>
          </Select>
        )}
      </div>

      {/* TIME TRIGGERS */}
      <div>
        <SectionLabel>Time Triggers</SectionLabel>
        {config.actions.timeTriggers.length === 0 && (
          <p className="text-xs text-muted-foreground mb-2">No triggers added yet.</p>
        )}
        <button className="w-full border border-dashed border-border rounded-lg py-2 text-xs text-muted-foreground cursor-pointer flex items-center justify-center gap-1.5 hover:text-foreground hover:border-foreground/30 transition-colors bg-transparent">
          <Plus size={12} />
          Add Time Trigger
        </button>
      </div>

      {/* BEHAVIOR */}
      <div>
        <SectionLabel>Behavior</SectionLabel>
        <SettingRow
          label="Hide on completion"
          checked={hideOnCompletion}
          onCheckedChange={(v) =>
            setConfig({ behavior: { ...config.behavior, hideOnCompletion: v } })
          }
        />
        <Divider />
        <SettingRow
          label="Allow negative time (overrun)"
          checked={config.allowNegative}
          onCheckedChange={(v) => setConfig({ allowNegative: v })}
        />
      </div>
    </div>
  )
}
