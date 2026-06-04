import { type LumenHost, LumenPlugin } from "@lumen-media/module-sdk"
import { createElement } from "react"
import { CountdownDialog } from "./components/CountdownDialog.js"
import { setupI18n } from "./i18n.js"

export default class CountdownPlugin extends LumenPlugin {
  async onload(host: LumenHost): Promise<void> {
    setupI18n(host.app.locale)

    host.panels.add({
      id: "countdown.dialog",
      slot: "dialog",
      title: "Countdown",
      component: () => createElement(CountdownDialog),
    })

    host.menus.addItem("tools", {
      type: "action",
      id: "countdown.open",
      label: "Countdown Timer",
      onClick: () => host.ui.openDialog("countdown.dialog"),
    })

    host.commands.add({
      id: "countdown.open",
      title: "Open Countdown Timer",
      run: () => host.ui.openDialog("countdown.dialog"),
    })
  }
}
