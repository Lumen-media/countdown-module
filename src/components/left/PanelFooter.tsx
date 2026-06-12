import { Play, Pause, RotateCcw, Eye, EyeOff, ExternalLink } from "lucide-react"
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
  const { config, timerState, startTimer, pauseTimer, resetTimer, sendToPresenter, clearPresenter, isPresenterActive } = useCountdownStore()
  const { status, remainingSeconds } = timerState
  const isRunning = status === "running"
  const isPaused = status === "paused"
  const isFinished = status === "finished"
  const isNegative = config.allowNegative && remainingSeconds < 0
  const handlePause = isNegative ? resetTimer : pauseTimer

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

      <div className="flex gap-2">
        {isFinished ? (
          <Button
            onClick={resetTimer}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer border-none transition-opacity hover:opacity-90"
          >
            <RotateCcw size={14} />
            Reset
          </Button>
        ) : (
          <>
            <Button
              onClick={isRunning ? handlePause : startTimer}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer border-none transition-opacity hover:opacity-90"
            >
              {isRunning ? <Pause size={14} /> : <Play size={14} />}
              {isRunning ? "Pause" : isPaused ? "Resume" : "Start Countdown"}
            </Button>
            {isPaused && (
              <Button
                variant="outline"
                onClick={resetTimer}
                className="px-3 py-2.5 rounded-lg cursor-pointer shrink-0"
              >
                <RotateCcw size={14} />
              </Button>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Button variant="ghost" className="text-xs" onClick={isPresenterActive ? clearPresenter : sendToPresenter}>
          {isPresenterActive ? <EyeOff size={13} /> : <Eye size={13} />}
          {isPresenterActive ? "Exit" : "Preview"}
        </Button>
        <Button variant="ghost" className="text-xs">
          <ExternalLink size={13} />
          Overlay
        </Button>
      </div>
    </div>
  )
}
