import { useState } from "react"
import { ConfigureTab } from "./tabs/ConfigureTab.js"
import { AppearanceTab } from "./tabs/AppearanceTab.js"
import { ActionsTab } from "./tabs/ActionsTab.js"
import { PanelFooter } from "./PanelFooter.js"

type Tab = "configure" | "appearance" | "actions"

const TABS: { id: Tab; label: string }[] = [
  { id: "configure", label: "Configure" },
  { id: "appearance", label: "Appearance" },
  { id: "actions", label: "Actions" },
]

export function LeftPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("configure")

  return (
    <div
      style={{
        width: "260px",
        minWidth: "260px",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid var(--border)",
        background: "var(--background)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 16px 0",
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--foreground)",
            margin: "0 0 14px",
          }}
        >
          Countdown
        </h2>

        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            gap: "2px",
            background: "var(--muted)",
            borderRadius: "8px",
            padding: "3px",
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: "5px 0",
                  fontSize: "12px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
                  background: isActive ? "var(--background)" : "transparent",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.25)" : "none",
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          scrollbarWidth: "thin",
        }}
      >
        {activeTab === "configure" && <ConfigureTab />}
        {activeTab === "appearance" && <AppearanceTab />}
        {activeTab === "actions" && <ActionsTab />}
      </div>

      {/* Fixed footer */}
      <PanelFooter />
    </div>
  )
}
