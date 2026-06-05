import { useState } from "react"
import { Maximize2, Monitor, Zap } from "lucide-react"
import { CountdownPreview } from "./CountdownPreview.js"

export function RightPanel() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "var(--background)",
        overflow: "hidden",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px 12px",
          flexShrink: 0,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--foreground)",
          }}
        >
          Live Preview Stage
        </h3>
        <button
          onClick={() => setIsFullscreen((v) => !v)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--muted-foreground)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            padding: "4px 8px",
            borderRadius: "6px",
          }}
        >
          <Maximize2 size={13} />
          {isFullscreen ? "Exit" : "Fullscreen"}
        </button>
      </div>

      {/* Preview area */}
      <div
        style={{
          flex: 1,
          padding: isFullscreen ? "0" : "0 20px",
          overflow: "hidden",
          display: "flex",
          alignItems: "stretch",
          color: "var(--foreground)",
        }}
      >
        <CountdownPreview />
      </div>

      {/* Info cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          padding: "12px 20px 16px",
          flexShrink: 0,
        }}
      >
        <InfoCard
          icon={<Monitor size={15} />}
          label="Current Output"
          value="Main Hall Screen • 1920×1080"
        />
        <InfoCard
          icon={<Zap size={15} />}
          label="Next Action"
          value='Auto-switch to "Welcome Video"'
        />
      </div>
    </div>
  )
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "12px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
      }}
    >
      <span style={{ color: "var(--muted-foreground)", marginTop: "1px", flexShrink: 0 }}>
        {icon}
      </span>
      <div>
        <div style={{ fontSize: "10px", color: "var(--muted-foreground)", marginBottom: "3px" }}>
          {label}
        </div>
        <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--foreground)" }}>
          {value}
        </div>
      </div>
    </div>
  )
}
