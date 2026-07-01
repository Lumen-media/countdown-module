import { Card, Popover, ScrollArea, Separator, Tabs } from "@lumen-media/module-sdk/ui"
import { Settings2 } from "lucide-react"
import { cn } from "../lib/cn.js"
import { useCountdownStore } from "../store.js"
import { t } from "../i18n.js"
import { PanelFooter } from "./left/PanelFooter.js"
import { ConfigureTab } from "./left/tabs/ConfigureTab.js"
import { AppearanceTab } from "./left/tabs/AppearanceTab.js"
import { ActionsTab } from "./left/tabs/ActionsTab.js"
import { RightPanel } from "./right/RightPanel.js"
import { TimerSettings } from "./left/TimerSettings.js"

export function CountdownDialog() {
  const isPreviewExpanded = useCountdownStore((s) => s.isPreviewExpanded)

  return (
    <div data-countdown-ui className="aspect-16/10 h-[80dvh] flex bg-background p-4">
      <Card className={cn("basis-1/4 h-full p-0 gap-0 border-0 overflow-hidden", isPreviewExpanded && "hidden")}>
        <Tabs defaultValue="configure" className="flex flex-col h-full overflow-hidden">
          <Card.CardContent className="flex-1 flex flex-col p-0 overflow-hidden gap-0" style={{ minHeight: 0 }}>
            <div className="px-4 pt-4 pb-3 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-foreground">{t("dialog.title")}</h2>
                <Popover>
                  <Popover.PopoverTrigger className="text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-1 rounded-md hover:bg-card">
                    <Settings2 size={16} />
                  </Popover.PopoverTrigger>
                  <Popover.PopoverContent className="p-3 bg-card border border-border rounded-xl shadow-lg" align="end" sideOffset={6}>
                    <TimerSettings />
                  </Popover.PopoverContent>
                </Popover>
              </div>
              <Tabs.TabsList className="w-full bg-background rounded-lg p-1">
                <Tabs.TabsTrigger value="configure" className="flex-1 data-[state=active]:bg-card data-[state=active]:shadow-sm">{t("dialog.tab.configure")}</Tabs.TabsTrigger>
                <Tabs.TabsTrigger value="appearance" className="flex-1 data-[state=active]:bg-card data-[state=active]:shadow-sm">{t("dialog.tab.appearance")}</Tabs.TabsTrigger>
                <Tabs.TabsTrigger value="actions" className="flex-1 data-[state=active]:bg-card data-[state=active]:shadow-sm">{t("dialog.tab.actions")}</Tabs.TabsTrigger>
              </Tabs.TabsList>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="px-4 pb-4 pt-1">
                <Tabs.TabsContent value="configure">
                  <ConfigureTab />
                </Tabs.TabsContent>
                <Tabs.TabsContent value="appearance">
                  <AppearanceTab />
                </Tabs.TabsContent>
                <Tabs.TabsContent value="actions">
                  <ActionsTab />
                </Tabs.TabsContent>
              </div>
            </ScrollArea>
          </Card.CardContent>

          <Separator />

          <Card.CardFooter className="px-4 py-3">
            <PanelFooter />
          </Card.CardFooter>
        </Tabs>
      </Card>

      <Card className={cn("p-0 gap-0 border-0 bg-transparent overflow-hidden", isPreviewExpanded ? "basis-full rounded-l-xl" : "basis-3/4 rounded-l-none")}>
        <RightPanel />
      </Card>
    </div>
  )
}