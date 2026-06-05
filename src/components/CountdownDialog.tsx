import { LeftPanel } from "./left/LeftPanel.js"
import { RightPanel } from "./right/RightPanel.js"

export function CountdownDialog() {
  return (
    <div
      style={{
        display: "flex",
        width: "min(90vw, 1200px)",
        height: "min(88vh, 800px)",
        minWidth: "800px",
        overflow: "hidden",
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <LeftPanel />
      <RightPanel />
    </div>
  )
}
