import { Play, Pause, Eye, ExternalLink } from "lucide-react"
import { useCountdownStore, formatTime } from "../../store.js"
import { Button } from "@lumen-media/module-sdk/ui"

const STATUS_DOT: Record<string, string> = {
  idle: "#f59e0b",
  running: "#22c55e",
  paused: "#6b7280",
  finished: "#ef4444",
}

const STATUS_LABEL: Record<string, string> = {
  idle: "Ready to start",
  running: "Running",
  paused: "Paused",
  finished: "Finished",
}

export function PanelFooter() {
  const { timerState, startTimer, pauseTimer } = useCountdownStore()
  const { status, remainingSeconds } = timerState
  const isRunning = status === "running"

  return (
    <div className="w-full flex flex-col gap-2.5 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full shrink-0 inline-block"
            style={{ background: STATUS_DOT[status] ?? STATUS_DOT.idle }}
          />
          <span className="text-xs text-muted-foreground">
            {STATUS_LABEL[status] ?? STATUS_LABEL.idle}
          </span>
        </div>
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {formatTime(remainingSeconds)}
        </span>
      </div>

      <Button
        onClick={isRunning ? pauseTimer : startTimer}
        className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer border-none transition-opacity hover:opacity-90"
      >
        {isRunning ? <Pause size={14} /> : <Play size={14} />}
        {isRunning ? "Pause" : "Start Countdown"}
      </Button>

      <div className="grid grid-cols-2 gap-5">
        <Button variant="ghost" className="text-xs">
          <Eye size={13} />
          Preview
        </Button>
        <Button variant="ghost" className="text-xs">
          <ExternalLink size={13} />
          Overlay
        </Button>
      </div>
    </div>
  )
}
