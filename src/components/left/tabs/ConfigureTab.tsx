import { useState } from "react"
import { RotateCcw, Video } from "lucide-react"
import { useCountdownStore } from "../../../store.js"
import type { BackgroundPreset } from "../../../types.js"

const PRESETS: { id: BackgroundPreset; label: string }[] = [
  { id: "dark-minimal", label: "Dark Minimal" },
  { id: "light-clean", label: "Light Clean" },
  { id: "vibrant-blur", label: "Vibrant Blur" },
  { id: "custom-video", label: "Custom Video" },
]

function PresetThumbnail({ preset }: { preset: BackgroundPreset }) {
  const base: React.CSSProperties = {
    width: "100%",
    height: "52px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "-0.5px",
    overflow: "hidden",
    position: "relative",
  }

  if (preset === "dark-minimal") {
    return (
      <div style={{ ...base, background: "#000", color: "#fff" }}>
        05:00
      </div>
    )
  }
  if (preset === "light-clean") {
    return (
      <div style={{ ...base, background: "#fff", color: "#000" }}>
        05:00
      </div>
    )
  }
  if (preset === "vibrant-blur") {
    return (
      <div
        style={{
          ...base,
          background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 50%, #06b6d4 100%)",
          color: "#fff",
        }}
      >
        05:00
      </div>
    )
  }
  return (
    <div style={{ ...base, background: "#111", color: "#666", flexDirection: "column", gap: "4px" }}>
      <Video size={16} />
      <span style={{ fontSize: "9px", fontWeight: 500 }}>05:00</span>
    </div>
  )
}

export function ConfigureTab() {
  const { config, setConfig, setTotalSeconds, updateAppearance } = useCountdownStore()
  const [localMinutes, setLocalMinutes] = useState(String(Math.floor(config.totalSeconds / 60)).padStart(2, "0"))
  const [localSeconds, setLocalSeconds] = useState(String(config.totalSeconds % 60).padStart(2, "0"))

  function applyDuration(mins: number, secs: number) {
    const total = Math.max(0, mins * 60 + secs)
    setTotalSeconds(total)
  }

  function handleMinutesBlur(val: string) {
    const n = Math.min(99, Math.max(0, parseInt(val) || 0))
    const secs = config.totalSeconds % 60
    setLocalMinutes(String(n).padStart(2, "0"))
    applyDuration(n, secs)
  }

  function handleSecondsBlur(val: string) {
    const n = Math.min(59, Math.max(0, parseInt(val) || 0))
    const mins = Math.floor(config.totalSeconds / 60)
    setLocalSeconds(String(n).padStart(2, "0"))
    applyDuration(mins, n)
  }

  function addSeconds(delta: number) {
    const next = Math.max(0, config.totalSeconds + delta)
    setTotalSeconds(next)
    setLocalMinutes(String(Math.floor(next / 60)).padStart(2, "0"))
    setLocalSeconds(String(next % 60).padStart(2, "0"))
  }

  const sectionLabel: React.CSSProperties = {
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
    marginBottom: "8px",
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--input)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "8px 10px",
    fontSize: "13px",
    color: "var(--foreground)",
    outline: "none",
    boxSizing: "border-box",
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* DURATION */}
      <div>
        <div style={sectionLabel}>Duration</div>
        <div style={{ display: "flex", gap: "8px" }}>
          <DurationBox
            value={localMinutes}
            label="Minutes"
            onChange={setLocalMinutes}
            onBlur={handleMinutesBlur}
            max={99}
          />
          <DurationBox
            value={localSeconds}
            label="Seconds"
            onChange={setLocalSeconds}
            onBlur={handleSecondsBlur}
            max={59}
          />
        </div>
        <div style={{ display: "flex", gap: "4px", marginTop: "10px" }}>
          <AdjustButton onClick={() => addSeconds(10)}>+ 10s</AdjustButton>
          <AdjustButton onClick={() => addSeconds(-10)}>− 10s</AdjustButton>
          <AdjustButton
            onClick={() => {
              const t = config.totalSeconds
              setLocalMinutes(String(Math.floor(t / 60)).padStart(2, "0"))
              setLocalSeconds(String(t % 60).padStart(2, "0"))
            }}
            icon={<RotateCcw size={11} />}
          >
            Reset
          </AdjustButton>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px" }}>
          <ToggleSwitch
            checked={config.allowNegative}
            onChange={(v) => setConfig({ allowNegative: v })}
          />
          <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
            Allow negative time
          </span>
        </div>
      </div>

      {/* DISPLAY TEXT */}
      <div>
        <div style={sectionLabel}>Display Text</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <input
            style={inputStyle}
            placeholder="Pre text"
            value={config.preText}
            onChange={(e) => setConfig({ preText: e.target.value })}
          />
          <textarea
            style={{ ...inputStyle, resize: "none", minHeight: "64px", lineHeight: "1.5" }}
            placeholder="Post text"
            value={config.postText}
            onChange={(e) => setConfig({ postText: e.target.value })}
            rows={2}
          />
        </div>
      </div>

      {/* ON COMPLETION */}
      <div>
        <div style={sectionLabel}>On Completion</div>
        <select
          style={{
            ...inputStyle,
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
            paddingRight: "30px",
            cursor: "pointer",
          }}
          value={config.actions.autoAdvance.enabled ? "auto-next" : "none"}
          onChange={(e) => {
            setConfig({
              actions: {
                ...config.actions,
                autoAdvance: {
                  ...config.actions.autoAdvance,
                  enabled: e.target.value !== "none",
                  target: "next",
                },
              },
            })
          }}
        >
          <option value="none">None</option>
          <option value="auto-next">Auto-switch to next Scene</option>
        </select>
      </div>

      {/* BACKGROUND PRESET */}
      <div>
        <div style={sectionLabel}>Background Preset</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
          }}
        >
          {PRESETS.map((p) => {
            const isSelected = config.appearance.preset === p.id
            return (
              <button
                key={p.id}
                onClick={() => updateAppearance({ preset: p.id })}
                style={{
                  background: "transparent",
                  border: `2px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                  borderRadius: "10px",
                  padding: "6px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  transition: "border-color 0.15s",
                }}
              >
                <PresetThumbnail preset={p.id} />
                <span
                  style={{
                    fontSize: "11px",
                    color: isSelected ? "var(--foreground)" : "var(--muted-foreground)",
                    fontWeight: isSelected ? 600 : 400,
                    textAlign: "center",
                  }}
                >
                  {p.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function DurationBox({
  value,
  label,
  onChange,
  onBlur,
  max,
}: {
  value: string
  label: string
  onChange: (v: string) => void
  onBlur: (v: string) => void
  max: number
}) {
  return (
    <div
      style={{
        flex: 1,
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "12px 8px 10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onBlur(e.target.value)}
        style={{
          background: "transparent",
          border: "none",
          outline: "none",
          fontSize: "32px",
          fontWeight: 700,
          color: "var(--foreground)",
          width: "100%",
          textAlign: "center",
          padding: 0,
        }}
        maxLength={2}
      />
      <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>{label}</span>
    </div>
  )
}

function AdjustButton({
  children,
  onClick,
  icon,
}: {
  children: React.ReactNode
  onClick: () => void
  icon?: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: "1px solid var(--border)",
        borderRadius: "6px",
        padding: "4px 10px",
        fontSize: "12px",
        color: "var(--muted-foreground)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {children}
    </button>
  )
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: "32px",
        height: "18px",
        borderRadius: "9px",
        background: checked ? "var(--primary)" : "var(--muted)",
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "2px",
          left: checked ? "16px" : "2px",
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
        }}
      />
    </button>
  )
}
