import css from "./styles.css?inline"
import jersey15FontUrl from "../assets/fonts/Jersey15-Regular.ttf?url"
import { type LumenHost, LumenPlugin } from "@lumen-media/module-sdk"
import { createElement, type ComponentProps } from "react"
import { Timer } from "lucide-react"
import { listen } from "@tauri-apps/api/event"
import { CountdownDialog } from "./components/CountdownDialog.js"
import { CountdownHeaderStatus } from "./components/CountdownHeaderStatus.js"
import { CountdownCommanderApp } from "./components/CountdownCommanderApp.js"
import { CountdownDisplay } from "./components/presenter/CountdownDisplay.js"
import { QueueTriggerConfigComponent, CountdownSummary, type QueueTriggerConfig } from "./components/QueueTriggerConfig.js"
import { useCountdownStore } from "./store.js"
import type { CountdownConfig, HotkeyAction, TimerPreset } from "./types.js"
import { setupI18n, t } from "./i18n.js"

type HostExt = {
  fs?: { read: (path: string) => Promise<Uint8Array> }
  library?: { list?: (type?: string, query?: string) => Promise<{ id: string; path: string; name: string; type: string }[]>; get?: (id: string) => Promise<{ id: string; path: string; name: string; type: string } | null> }
  overlay?: { project: (viewId: string, props?: unknown) => void; clear: () => void; onStateChange?: (handler: (state: "idle" | "live") => void) => { dispose(): void } }
  player?: { current?: () => unknown; state?: () => "playing" | "paused" | "idle" }
  lyrics?: { currentSlide?: () => unknown | null }
  sceneSwitcher?: (sceneId: string) => void
  overlayOpener?: (overlayId: string) => void
  themes: {
    onDefaultBackgroundChange?: (handler: (bg: { src: string; type: string; name: string } | null) => void) => { dispose(): void }
  }
}

export default class CountdownPlugin extends LumenPlugin {
  private styleEl: HTMLStyleElement | null = null
  private displayReadyUnlisten: (() => void) | null = null
  private overlayStateDispose: (() => void) | null = null
  private handleKeyDown: ((event: KeyboardEvent) => void) | null = null

  async onload(host: LumenHost): Promise<void> {
    this.styleEl = document.createElement("style")
    this.styleEl.setAttribute("data-module", host.meta.id)
    this.styleEl.textContent = css.replace("__JERSEY_15_FONT_URL__", jersey15FontUrl)
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

    host.commands.add({
      id: "countdown.start",
      title: t("main.command.start"),
      keywords: ["timer", "play"],
      run: () => useCountdownStore.getState().startTimer(),
    })
    host.commands.add({
      id: "countdown.pause",
      title: t("main.command.pause"),
      keywords: ["timer", "stop"],
      run: () => {
        const s = useCountdownStore.getState()
        if (s.timerState.status === "paused") s.startTimer()
        else s.pauseTimer()
      },
    })
    host.commands.add({
      id: "countdown.reset",
      title: t("main.command.reset"),
      keywords: ["timer", "clear"],
      run: () => useCountdownStore.getState().resetTimer(),
    })

    host.commands.add({
      id: "countdown.app",
      title: t("main.command.app"),
      type: "app",
      icon: Timer,
      keywords: ["timer", "quick", "preset", "start", "pause", "reset"],
      component: CountdownCommanderApp,
    })

    useCountdownStore.getState().setBus(host.bus)
    useCountdownStore.getState().setPresenter(host.presentation)
    useCountdownStore.getState().setQueue(host.queue)
    useCountdownStore.getState().setPlayer(host.player)

    const hostExt = host as unknown as HostExt
    useCountdownStore.getState().setExternalBackdropActivityReader(() => {
      const playerActive = Boolean(hostExt.player?.current?.()) && hostExt.player?.state?.() !== "idle"
      const lyricsActive = Boolean(hostExt.lyrics?.currentSlide?.())
      return playerActive || lyricsActive
    })

    if (hostExt.fs) useCountdownStore.getState().setHostFs(hostExt.fs)
    if (hostExt.library?.list && hostExt.library?.get) useCountdownStore.getState().setLibrary({ list: hostExt.library.list, get: hostExt.library.get })
    if (hostExt.sceneSwitcher) useCountdownStore.getState().setSceneSwitcher(hostExt.sceneSwitcher)
    if (hostExt.overlayOpener) useCountdownStore.getState().setOverlayOpener(hostExt.overlayOpener)
    if (hostExt.overlay) {
      useCountdownStore.getState().setOverlay(hostExt.overlay)
      const overlayState = hostExt.overlay.onStateChange?.((state) => {
        useCountdownStore.getState().setOverlayActive(state === "live")
      })
      this.overlayStateDispose = overlayState ? () => overlayState.dispose() : null
    }

    const saved = await host.data.json.get<Partial<CountdownConfig> | undefined>("config")
    if (saved) useCountdownStore.getState().setConfig(saved)

    let persistTimer: ReturnType<typeof setTimeout> | null = null
    useCountdownStore.subscribe(() => {
      if (persistTimer) clearTimeout(persistTimer)
      persistTimer = setTimeout(() => {
        const state = useCountdownStore.getState()
        host.data.json.set("config", state.config).catch((err) => console.warn("[countdown-module] save config", err))
        host.data.json.set("timerPresets", state.timerPresets).catch((err) => console.warn("[countdown-module] save timerPresets", err))
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

    useCountdownStore.getState().setSaveImmediate(() => {
      host.data.json.set("config", useCountdownStore.getState().config).catch((err) => console.warn("[countdown-module]", err))
    })

    useCountdownStore.getState().setOpenBackgroundPicker(
      (cb) => host.ui.openBackgroundPicker(cb)
    )

    this.handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return
      const hotkeys = useCountdownStore.getState().config.hotkeys
      for (const [action, stored] of Object.entries(hotkeys)) {
        const parts = stored.split("+")
        const key = parts.pop()!
        const hasCtrl = parts.includes("Ctrl")
        const hasShift = parts.includes("Shift")
        const match = (
          event.ctrlKey === hasCtrl &&
          event.shiftKey === hasShift &&
          (event.code === key || event.key === key)
        )
        if (match) {
          event.preventDefault()
          useCountdownStore.getState().handleHotkey(action as HotkeyAction)
          break
        }
      }
    }
    document.addEventListener("keydown", this.handleKeyDown)

    const savedPresets = await host.data.json.get<TimerPreset[] | undefined>("timerPresets")
    if (savedPresets) useCountdownStore.getState().setTimerPresets(savedPresets)

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
    if (this.handleKeyDown) {
      document.removeEventListener("keydown", this.handleKeyDown)
      this.handleKeyDown = null
    }
  }
}
