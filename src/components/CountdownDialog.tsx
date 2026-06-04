import { LeftPanel } from "./left/LeftPanel.js"
import { RightPanel } from "./right/RightPanel.js"

export function CountdownDialog() {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "var(--background)",
      }}
    >
      <LeftPanel />
      <RightPanel />
    </div>
  )
}
