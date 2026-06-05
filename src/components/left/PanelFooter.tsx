import { Play, Pause, Eye, ExternalLink } from "lucide-react"
import { useCountdownStore, formatTime } from "../../store.js"

const STATUS_COLORS: Record<string, string> = {
  idle: "#f59e0b",
  running: "#22c55e",
  paused: "#6b7280",
  finished: "#ef4444",
}

const STATUS_LABELS: Record<string, string> = {
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
    <div
      style={{
        borderTop: "1px solid var(--border)",
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        flexShrink: 0,
        background: "var(--background)",
      }}
    >
      {/* Status row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: STATUS_COLORS[status] ?? "#f59e0b",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
            {STATUS_LABELS[status] ?? "Ready to start"}
          </span>
        </div>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--foreground)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatTime(remainingSeconds)}
        </span>
      </div>

      {/* Primary button */}
      <button
        onClick={isRunning ? pauseTimer : startTimer}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          border: "none",
          background: "#0dd9e8",
          color: "#000",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          transition: "opacity 0.15s",
        }}
      >
        {isRunning ? <Pause size={14} /> : <Play size={14} />}
        {isRunning ? "Pause" : "Start Countdown"}
      </button>

      {/* Secondary buttons */}
      <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
        <button
          style={{
            background: "transparent",
            border: "none",
            fontSize: "12px",
            color: "var(--muted-foreground)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "0",
          }}
        >
          <Eye size={13} />
          Preview
        </button>
        <button
          style={{
            background: "transparent",
            border: "none",
            fontSize: "12px",
            color: "var(--muted-foreground)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "0",
          }}
        >
          <ExternalLink size={13} />
          Overlay
        </button>
      </div>
    </div>
  )
}
