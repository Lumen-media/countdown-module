import { Input } from "@lumen-media/module-sdk/ui"
import { t } from "../i18n.js"

export type QueueTriggerConfig = { seconds: number }

export function CountdownSummary({
  value,
  onEdit,
}: {
  value: QueueTriggerConfig
  onEdit: () => void
}) {
  const mins = Math.floor(value.seconds / 60)
  const secs = value.seconds % 60
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onEdit() }}
      className="text-sm font-mono font-semibold text-primary tabular-nums hover:underline cursor-pointer bg-transparent border-none p-0"
    >
      {mins}:{String(secs).padStart(2, '0')}
    </button>
  )
}

export function QueueTriggerConfigComponent({
  value,
  onChange,
}: {
  value: QueueTriggerConfig
  onChange: (v: QueueTriggerConfig) => void
}) {
  const minutes = Math.floor(value.seconds / 60)
  const secs = value.seconds % 60

  function setMinutes(m: number) {
    onChange({ seconds: Math.max(0, m) * 60 + secs })
  }

  function setSecs(s: number) {
    onChange({ seconds: minutes * 60 + Math.min(59, Math.max(0, s)) })
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {t("queue.wait.description")}
      </p>
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs text-muted-foreground">{t("queue.wait.minutes")}</label>
          <Input
            type="number"
            min={0}
            value={minutes}
            onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs text-muted-foreground">{t("queue.wait.seconds")}</label>
          <Input
            type="number"
            min={0}
            max={59}
            value={secs}
            onChange={(e) => setSecs(parseInt(e.target.value) || 0)}
          />
        </div>
      </div>
    </div>
  )
}