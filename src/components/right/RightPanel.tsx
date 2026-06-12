import { Maximize2, Monitor, Zap } from "lucide-react"
import { Card } from "@lumen-media/module-sdk/ui"
import { useCountdownStore } from "../../store.js"
import { CountdownPreview } from "./CountdownPreview.js"

export function RightPanel() {
  const isPreviewExpanded = useCountdownStore((s) => s.isPreviewExpanded)
  const setPreviewExpanded = useCountdownStore((s) => s.setPreviewExpanded)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
        <h3 className="text-sm font-semibold text-foreground">Live Preview Stage</h3>
        <button
          onClick={() => setPreviewExpanded(!isPreviewExpanded)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground bg-transparent border-none cursor-pointer px-2 py-1 rounded-md hover:text-foreground transition-colors"
        >
          <Maximize2 size={13} />
          {isPreviewExpanded ? "Exit" : "Fullscreen"}
        </button>
      </div>

      <div className={["flex-1 flex items-stretch overflow-hidden min-h-0", isPreviewExpanded ? "" : "px-5"].join(" ")}>
        <CountdownPreview />
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 py-3 shrink-0">
        <InfoCard icon={<Monitor size={15} />} label="Current Output" value="Main Hall Screen • 1920×1080" />
        <InfoCard icon={<Zap size={15} />} label="Next Action" value='Auto-switch to "Welcome Video"' />
      </div>
    </div>
  )
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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
