import { LeftPanel } from "./left/LeftPanel.js"
import { RightPanel } from "./right/RightPanel.js"

export function CountdownDialog() {
  return (
    <div
      className="flex overflow-hidden bg-background text-foreground"
      style={{ width: "min(90vw, 1200px)", height: "min(88vh, 800px)", minWidth: "800px" }}
    >
      <LeftPanel />
      <RightPanel />
    </div>
  )
}
