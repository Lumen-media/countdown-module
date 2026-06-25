import css from "./styles.css?inline"
import { type LumenHost, LumenPlugin } from "@lumen-media/module-sdk"
import { createElement, type ComponentProps } from "react"
import { listen } from "@tauri-apps/api/event"
import { CountdownDialog } from "./components/CountdownDialog.js"
import { CountdownHeaderStatus } from "./components/CountdownHeaderStatus.js"
import { CountdownDisplay } from "./components/presenter/CountdownDisplay.js"
import { QueueTriggerConfigComponent, CountdownSummary, type QueueTriggerConfig } from "./components/QueueTriggerConfig.js"
import { useCountdownStore } from "./store.js"
import type { CountdownConfig } from "./types.js"
import { setupI18n, t } from "./i18n.js"

type HostExt = {
  fs?: { read: (path: string) => Promise<Uint8Array> }
  library?: { get?: (id: string) => Promise<{ id: string; path: string; name: string; type: string } | null> }
  overlay?: { project: (viewId: string, props?: unknown) => void; clear: () => void; onStateChange?: (handler: (state: "idle" | "live") => void) => { dispose(): void } }
  player?: { current?: () => unknown; state?: () => "playing" | "paused" | "idle" }
  lyrics?: { currentSlide?: () => unknown | null }
  themes: {
    onDefaultBackgroundChange?: (handler: (bg: { src: string; type: string; name: string } | null) => void) => { dispose(): void }
  }
}

export default class CountdownPlugin extends LumenPlugin {
  private styleEl: HTMLStyleElement | null = null
  private displayReadyUnlisten: (() => void) | null = null
  private overlayStateDispose: (() => void) | null = null

  async onload(host: LumenHost): Promise<void> {
    this.styleEl = document.createElement("style")
    this.styleEl.setAttribute("data-module", host.meta.id)
    this.styleEl.textContent = css
    document.head.appendChild(this.styleEl)

    setupI18n(host.app.locale)

    host.panels.add({
      id: "countdown.presenter",
      slot: "presenter.content",
      component: (props) => createElement(CountdownDisplay, props as ComponentProps<typeof CountdownDisplay>),
    })

    if (host.window === "presenter") return

    this.displayReadyUnlisten = await listen("countdown:display-ready", () => {
      useCountdownStore.getState().rebroadcast()
    })

    host.panels.add({
      id: "countdown.dialog",
      slot: "dialog",
      title: t("dialog.title"),
      component: () => createElement(CountdownDialog),
    })

    host.panels.add({
      id: "countdown.header-status",
      slot: "app.header.trailing" as never,
      component: () => createElement(CountdownHeaderStatus, {
        onOpen: () => host.ui.openDialog("countdown.dialog"),
      }),
    })

    host.menus.addItem("tools", {
      type: "action",
      id: "countdown.open",
      label: t("main.menu.open"),
      onClick: () => host.ui.openDialog("countdown.dialog"),
    })

    host.commands.add({
      id: "countdown.open",
      title: t("main.command.open"),
      run: () => host.ui.openDialog("countdown.dialog"),
    })

    useCountdownStore.getState().setPresenter(host.presentation)
    useCountdownStore.getState().setQueue(host.queue)
    useCountdownStore.getState().setPlayer(host.player)
    useCountdownStore.getState().setOpenMediaPicker((cb) => host.ui.openMediaPicker(cb))

    const hostExt = host as unknown as HostExt
    useCountdownStore.getState().setExternalBackdropActivityReader(() => {
      const playerActive = Boolean(hostExt.player?.current?.()) && hostExt.player?.state?.() !== "idle"
      const lyricsActive = Boolean(hostExt.lyrics?.currentSlide?.())
      return playerActive || lyricsActive
    })

    if (hostExt.fs) useCountdownStore.getState().setHostFs(hostExt.fs)
    if (hostExt.library?.get) useCountdownStore.getState().setLibrary({ get: hostExt.library.get })
    if (hostExt.overlay) {
      useCountdownStore.getState().setOverlay(hostExt.overlay)
      const overlayState = hostExt.overlay.onStateChange?.((state) => {
        useCountdownStore.getState().setOverlayActive(state === "live")
      })
      this.overlayStateDispose = overlayState ? () => overlayState.dispose() : null
    }

    const saved = await host.data.json.get<Partial<CountdownConfig> | undefined>("config")
    if (saved) useCountdownStore.getState().setConfig(saved)

    let saveTimer: ReturnType<typeof setTimeout> | null = null
    useCountdownStore.subscribe(() => {
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        host.data.json.set("config", useCountdownStore.getState().config).catch(() => {})
      }, 800)
    })

    const applyProfileBg = (bg: { src: string; thumb?: string; type: string; name: string } | null) => {
      if (!bg) {
        useCountdownStore.getState().setProfileBackground(null)
        return
      }
      useCountdownStore.getState().setProfileBackground(
        bg as { src: string; thumb?: string; type: "theme" | "image" | "video"; name: string }
      )
    }

    hostExt.themes.onDefaultBackgroundChange?.(applyProfileBg)

    useCountdownStore.getState().setOpenBackgroundPicker(
      (cb) => host.ui.openBackgroundPicker(cb)
    )

    host.queue.registerTrigger<QueueTriggerConfig>({
      id: "countdown.wait",
      label: t("main.trigger.wait"),
      ConfigComponent: QueueTriggerConfigComponent,
      SummaryComponent: CountdownSummary,
      defaultConfig: { seconds: 300 },
      onFire(config) {
        const store = useCountdownStore.getState()
        store.setTotalSeconds(config.seconds)
        store.setConfig({
          actions: {
            ...store.config.actions,
            autoAdvance: { enabled: true, action: { type: "queue.next" } },
          },
        })
        store.startTimer()
      },
    })
  }

  async onunload(): Promise<void> {
    this.styleEl?.remove()
    this.styleEl = null
    this.displayReadyUnlisten?.()
    this.displayReadyUnlisten = null
    this.overlayStateDispose?.()
    this.overlayStateDispose = null
  }
}
