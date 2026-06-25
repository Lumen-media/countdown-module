import { type ReactNode } from "react"
import { Monitor, Zap } from "lucide-react"
import { Card } from "@lumen-media/module-sdk/ui"
import { t } from "../../i18n.js"
import { CountdownPreview } from "./CountdownPreview.js"

export function RightPanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 pb-3 shrink-0">
        <h3 className="text-sm font-semibold text-foreground">{t("rightPanel.livePreviewStage")}</h3>
      </div>

      <div className="flex-1 flex items-stretch overflow-hidden min-h-0 pl-4">
        <CountdownPreview />
      </div>

      <div className="grid grid-cols-2 gap-3 pl-4 pt-4 shrink-0">
        <InfoCard icon={<Monitor size={15} />} label={t("rightPanel.currentOutput")} value={t("rightPanel.defaultOutput")} />
        <InfoCard icon={<Zap size={15} />} label={t("rightPanel.nextAction")} value={t("rightPanel.defaultNextAction")} />
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