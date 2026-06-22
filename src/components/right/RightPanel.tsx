import { type ReactNode } from "react"
import { Monitor, Zap } from "lucide-react"
import { Card } from "@lumen-media/module-sdk/ui"
import { CountdownPreview } from "./CountdownPreview.js"

export function RightPanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
        <h3 className="text-sm font-semibold text-foreground">Live Preview Stage</h3>
      </div>

      <div className="flex-1 flex items-stretch overflow-hidden min-h-0 px-5">
        <CountdownPreview />
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 py-3 shrink-0">
        <InfoCard icon={<Monitor size={15} />} label="Current Output" value="Main Hall Screen • 1920×1080" />
        <InfoCard icon={<Zap size={15} />} label="Next Action" value='Auto-switch to "Welcome Video"' />
      </div>
    </div>
  )
}

function InfoCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card className="px-3.5 py-3 flex-row items-start gap-2.5">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-xs font-semibold text-foreground truncate">{value}</p>
      </div>
    </Card>
  )
}
