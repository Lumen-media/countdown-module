import { Play, Pause, RotateCcw, Eye, EyeOff, ExternalLink } from "lucide-react"
import { useCountdownStore, formatTime } from "../../store.js"
import { Button } from "@lumen-media/module-sdk/ui"
import { t } from "../../i18n.js"

const STATUS_DOT: Record<string, string> = {
  idle: "#f59e0b",
  running: "#22c55e",
  paused: "#6b7280",
  finished: "#ef4444",
}

export function PanelFooter() {
  const { config, timerState, startTimer, pauseTimer, resetTimer, sendToPresenter, clearPresenter, isPresenterActive, sendToOverlay, clearOverlay, isOverlayActive } = useCountdownStore()
  const { status, remainingSeconds } = timerState
  const isRunning = status === "running"
  const isPaused = status === "paused"
  const isFinished = status === "finished"
  const isNegative = config.allowNegative && remainingSeconds < 0
  const handlePause = isNegative ? resetTimer : pauseTimer
  const statusLabels: Record<string, string> = {
    idle: t("footer.status.idle"),
    running: t("footer.status.running"),
    paused: t("footer.status.paused"),
    finished: t("footer.status.finished"),
  }

  return (
    <div className="w-full flex flex-col gap-2.5 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full shrink-0 inline-block"
            style={{ background: STATUS_DOT[status] ?? STATUS_DOT.idle }}
          />
          <span className="text-xs text-muted-foreground">
            {statusLabels[status] ?? statusLabels.idle}
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
            {t("footer.reset")}
          </Button>
        ) : (
          <>
            <Button
              onClick={isRunning ? handlePause : startTimer}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer border-none transition-opacity hover:opacity-90"
            >
              {isRunning ? <Pause size={14} /> : <Play size={14} />}
              {isRunning ? t("footer.pause") : isPaused ? t("footer.resume") : t("footer.start")}
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
        <Button
          variant="ghost"
          className="text-xs"
          onClick={isOverlayActive ? clearOverlay : isPresenterActive ? clearPresenter : sendToPresenter}
        >
          {isOverlayActive || isPresenterActive ? <EyeOff size={13} /> : <Eye size={13} />}
          {isOverlayActive ? t("footer.closeOverlay") : isPresenterActive ? t("footer.exit") : t("footer.preview")}
        </Button>
        <Button variant="ghost" className="text-xs" onClick={isOverlayActive ? clearOverlay : sendToOverlay}>
          <ExternalLink size={13} />
          {isOverlayActive ? t("footer.overlayActive") : t("footer.overlay")}
        </Button>
      </div>
    </div>
  )
}