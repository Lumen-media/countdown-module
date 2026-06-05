import { ScrollArea, Tabs } from "@lumen-media/module-sdk/ui"
import { ConfigureTab } from "./tabs/ConfigureTab.js"
import { AppearanceTab } from "./tabs/AppearanceTab.js"
import { ActionsTab } from "./tabs/ActionsTab.js"
import { PanelFooter } from "./PanelFooter.js"

export function LeftPanel() {
  return (
    <div
      className="flex flex-col border-r border-border bg-background overflow-hidden shrink-0"
      style={{ width: 260 }}
    >
      <Tabs defaultValue="configure" className="flex flex-col flex-1 overflow-hidden">
        <div className="px-4 pt-4 pb-3 shrink-0">
          <h2 className="text-base font-bold text-foreground mb-3">Countdown</h2>
          <Tabs.TabsList className="w-full">
            <Tabs.TabsTrigger value="configure" className="flex-1">Configure</Tabs.TabsTrigger>
            <Tabs.TabsTrigger value="appearance" className="flex-1">Appearance</Tabs.TabsTrigger>
            <Tabs.TabsTrigger value="actions" className="flex-1">Actions</Tabs.TabsTrigger>
          </Tabs.TabsList>
        </div>

        <ScrollArea className="flex-1">
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

        <PanelFooter />
      </Tabs>
    </div>
  )
}
