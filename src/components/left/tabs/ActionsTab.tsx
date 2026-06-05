import { Plus } from "lucide-react"
import { useCountdownStore } from "../../../store.js"

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.08em",
        color: "var(--muted-foreground)",
        textTransform: "uppercase",
        marginBottom: "10px",
      }}
    >
      {children}
    </div>
  )
}

function SettingRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        gap: "12px",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "13px", color: "var(--foreground)", fontWeight: 500 }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "2px" }}>
            {description}
          </div>
        )}
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
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
        width: "36px",
        height: "20px",
        borderRadius: "10px",
        background: checked ? "#0ea5e9" : "var(--muted)",
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
          top: "3px",
          left: checked ? "19px" : "3px",
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

function Divider() {
  return <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />
}

export function ActionsTab() {
  const { config, setConfig } = useCountdownStore()
  const { autoAdvance } = config.actions
  const { hideOnCompletion } = config.behavior

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* END ACTION */}
      <div>
        <SectionLabel>End Action</SectionLabel>
        <SettingRow
          label="Auto-Advance"
          description="Automatically transition to the next item in the playlist when timer reaches zero."
          checked={autoAdvance.enabled}
          onChange={(v) =>
            setConfig({
              actions: {
                ...config.actions,
                autoAdvance: { ...autoAdvance, enabled: v },
              },
            })
          }
        />
        {autoAdvance.enabled && (
          <select
            style={{
              width: "100%",
              background: "var(--input)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "8px 10px",
              fontSize: "13px",
              color: "var(--foreground)",
              outline: "none",
              marginTop: "4px",
              cursor: "pointer",
            }}
            value={autoAdvance.target}
            onChange={(e) =>
              setConfig({
                actions: {
                  ...config.actions,
                  autoAdvance: { ...autoAdvance, target: e.target.value },
                },
              })
            }
          >
            <option value="next">Go to Next Item</option>
          </select>
        )}
      </div>

      {/* TIME TRIGGERS */}
      <div>
        <SectionLabel>Time Triggers</SectionLabel>
        {config.actions.timeTriggers.length === 0 && (
          <p
            style={{
              fontSize: "12px",
              color: "var(--muted-foreground)",
              margin: "0 0 10px",
            }}
          >
            No triggers added yet.
          </p>
        )}
        <button
          style={{
            width: "100%",
            background: "transparent",
            border: "1px dashed var(--border)",
            borderRadius: "8px",
            padding: "8px",
            fontSize: "12px",
            color: "var(--muted-foreground)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          }}
        >
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
          onChange={(v) =>
            setConfig({ behavior: { ...config.behavior, hideOnCompletion: v } })
          }
        />
        <Divider />
        <SettingRow
          label="Allow negative time (overrun)"
          checked={config.allowNegative}
          onChange={(v) => setConfig({ allowNegative: v })}
        />
      </div>
    </div>
  )
}
