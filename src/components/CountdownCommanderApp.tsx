import { useCallback } from "react"
import { Play, Pause, RotateCcw, Timer, Clock, Square } from "lucide-react"
import { useCountdownStore } from "../store.js"
import { t } from "../i18n.js"
import { formatTime } from "../store.js"

const QUICK_PRESETS = [5, 10, 15, 30] as const

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    running: "bg-green-500/15 text-green-400 border-green-500/30",
    paused: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    idle: "bg-muted text-muted-foreground border-border",
    finished: "bg-red-500/15 text-red-400 border-red-500/30",
  }
  const labels: Record<string, string> = {
    running: t("footer.status.running"),
    paused: t("footer.status.paused"),
    idle: t("footer.status.idle"),
    finished: t("footer.status.finished"),
  }
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${colors[status] || colors.idle}`}>
      {labels[status] || status}
    </span>
  )
}

export function CountdownCommanderApp({ onClose }: { onClose: () => void }) {
  const status = useCountdownStore((s) => s.timerState.status)
  const remaining = useCountdownStore((s) => s.timerState.remainingSeconds)
  const totalSeconds = useCountdownStore((s) => s.config.totalSeconds)
  const startTimer = useCountdownStore((s) => s.startTimer)
  const pauseTimer = useCountdownStore((s) => s.pauseTimer)
  const resetTimer = useCountdownStore((s) => s.resetTimer)
  const setTotalSeconds = useCountdownStore((s) => s.setTotalSeconds)


  const isRunning = status === "running"
  const isPaused = status === "paused"
  const isIdle = status === "idle"

  const handlePreset = useCallback((minutes: number) => {
    setTotalSeconds(minutes * 60)
  }, [setTotalSeconds])

  function ActionButton({
    icon: Icon,
    label,
    onClick,
    disabled,
    accent,
  }: {
    icon: typeof Play
    label: string
    onClick: () => void
    disabled?: boolean
    accent?: "green" | "yellow" | "red"
  }) {
    const accentStyles: Record<string, string> = {
      green: "hover:border-green-500/40 hover:bg-green-500/5",
      yellow: "hover:border-yellow-500/40 hover:bg-yellow-500/5",
      red: "hover:border-red-500/40 hover:bg-red-500/5",
    }
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm text-left cursor-pointer border border-border bg-card/50 ${accent ? accentStyles[accent] : "hover:border-foreground/20 hover:bg-card"} transition-all text-foreground disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-card/50`}
      >
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${accent === "green" ? "bg-green-500/15 text-green-400" : accent === "yellow" ? "bg-yellow-500/15 text-yellow-400" : accent === "red" ? "bg-red-500/15 text-red-400" : "bg-muted text-muted-foreground"}`}>
          <Icon size={14} />
        </span>
        <span className="flex-1">{label}</span>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-1">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
            <Timer size={13} />
          </span>
          <span className="text-sm font-semibold text-foreground">{t("dialog.title")}</span>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="bg-card/30 rounded-xl border border-border/50 p-3">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {t("configure.section.duration")}
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            {formatTime(totalSeconds)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {QUICK_PRESETS.map((m) => {
            const isActive = totalSeconds === m * 60
            return (
              <button
                key={m}
                type="button"
                onClick={() => handlePreset(m)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left cursor-pointer border transition-all ${
                  isActive
                    ? "border-primary/40 bg-primary/8 text-primary"
                    : "border-border bg-background text-foreground hover:border-foreground/30 hover:bg-card"
                }`}
              >
                <Clock size={13} className={isActive ? "text-primary" : "text-muted-foreground"} />
                <span className={isActive ? "font-medium" : ""}>{m} {t("configure.duration.minutes")}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-card/30 rounded-xl border border-border/50 p-3">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5 block">
          {t("configure.section.onCompletion")}
        </span>
        {!isIdle && (
          <div className="mb-2.5 flex items-center gap-2 bg-background rounded-lg px-3 py-2 border border-border/50">
            <span className="text-[11px] text-muted-foreground">{t("rightPanel.currentOutput")}:</span>
            <span className="text-sm font-mono font-semibold text-foreground">{formatTime(remaining)}</span>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <ActionButton
            icon={isPaused ? Play : Play}
            label={isPaused ? t("footer.resume") : t("footer.start")}
            onClick={() => { startTimer(); onClose() }}
            disabled={isRunning}
            accent="green"
          />
          <ActionButton
            icon={isPaused ? Square : Pause}
            label={isPaused ? t("footer.resume") : t("footer.pause")}
            onClick={() => { pauseTimer(); onClose() }}
            disabled={!isRunning && !isPaused}
            accent="yellow"
          />
          <ActionButton
            icon={RotateCcw}
            label={t("footer.reset")}
            onClick={() => { resetTimer(); onClose() }}
            disabled={isIdle}
            accent="red"
          />
        </div>
      </div>

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center gap-2 flex-1 rounded-xl px-3 py-2.5 text-sm cursor-pointer border border-border bg-transparent text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-card transition-all"
        >
          <Timer size={14} />
          {t("footer.exit")}
        </button>
      </div>
    </div>
  )
}
