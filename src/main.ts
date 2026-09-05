import { type LumenHost, LumenPlugin } from "@lumen-media/module-sdk"
import { emit, listen } from "@tauri-apps/api/event"
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow"
import { Timer } from "lucide-react"
import { type ComponentProps, createElement } from "react"
import jersey15FontUrl from "../assets/fonts/Jersey15-Regular.ttf?url"
import { CountdownCommanderApp } from "./components/CountdownCommanderApp.js"
import { CountdownDialog } from "./components/CountdownDialog.js"
import { CountdownHeaderStatus } from "./components/CountdownHeaderStatus.js"
import { CountdownDisplay } from "./components/presenter/CountdownDisplay.js"
import { ErrorBoundary } from "./components/presenter/ErrorBoundary.js"
import {
  CountdownSummary,
  type QueueTriggerConfig,
  QueueTriggerConfigComponent,
} from "./components/QueueTriggerConfig.js"
import { setupI18n, t } from "./i18n.js"
import type { CountdownTickPayload } from "./lib/display-mode.js"
import { useCountdownStore } from "./store.js"
import css from "./styles.css?inline"
import type { CountdownConfig, TimerPreset } from "./types.js"

type SyncCommand = "start" | "pause" | "reset"
type SyncActionMessage = { cmd: SyncCommand; instanceId?: string }

const WINDOW_REGISTRY_KEY = "__lumen_countdown_registry"

type WindowHostRegistry = { ordered: string[] }

function getWindowRegistry(): WindowHostRegistry {
  const w = window as unknown as Record<string, WindowHostRegistry | undefined>
  let registry = w[WINDOW_REGISTRY_KEY]
  if (!registry) {
    registry = { ordered: [] }
    w[WINDOW_REGISTRY_KEY] = registry
  }
  return registry
}

const LOCAL_STORAGE_PREFIX = "countdown-module:"

function readLocal<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : undefined
  } catch {
    return undefined
  }
}

function writeLocal(key: string, value: unknown): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(value))
  } catch {
    // storage unavailable — ignore
  }
}

interface StageBackdropChangeDetail {
  active: boolean
  source: "player" | "lyrics" | "media" | "scene" | "unknown" | null
  mediaType: "image" | "video" | "lyrics" | "color" | "unknown" | null
  id?: string | null
  name?: string | null
}

type HostExt = {
  fs?: { read: (path: string) => Promise<Uint8Array> }
  library?: {
    list?: (
      type?: string,
      query?: string
    ) => Promise<{ id: string; path: string; name: string; type: string }[]>
    get?: (id: string) => Promise<{ id: string; path: string; name: string; type: string } | null>
  }
  presentation?: {
    onStateChange?: (handler: (state: "idle" | "live") => void) => { dispose(): void }
  }
  overlay?: {
    project: (viewId: string, props?: unknown) => void
    clear: () => void
    onStateChange?: (handler: (state: "idle" | "live") => void) => { dispose(): void }
  }
  player?: { current?: () => unknown; state?: () => "playing" | "paused" | "idle" }
  lyrics?: { currentSlide?: () => unknown | null }
  sceneSwitcher?: (sceneId: string) => void
  overlayOpener?: (overlayId: string) => void
  themes: {
    onDefaultBackgroundChange?: (
      handler: (bg: { src: string; type: string; name: string } | null) => void
    ) => { dispose(): void }
  }
}

export default class CountdownPlugin extends LumenPlugin {
  private styleEl: HTMLStyleElement | null = null
  private displayReadyUnlisten: (() => void) | null = null
  private tickUnlisten: (() => void) | null = null
  private actionUnlisten: (() => void) | null = null
  private instanceId = ""
  private isPrimary = false
  private presentationStateDispose: (() => void) | null = null
  private overlayStateDispose: (() => void) | null = null
  private themeBgDispose: (() => void) | null = null
  private persistUnsubscribe: (() => void) | null = null
  private persistTimer: ReturnType<typeof setTimeout> | null = null

  async onload(host: LumenHost): Promise<void> {
    this.styleEl = document.createElement("style")
    this.styleEl.setAttribute("data-module", host.meta.id)
    this.styleEl.textContent = css.replace("__JERSEY_15_FONT_URL__", jersey15FontUrl)
    document.head.appendChild(this.styleEl)

    setupI18n(host.app.locale)

    host.panels.add({
      id: "countdown.presenter",
      slot: "presenter.content",
      component: (props) =>
        createElement(
          ErrorBoundary,
          null,
          createElement(CountdownDisplay, props as ComponentProps<typeof CountdownDisplay>)
        ),
    })

    if (host.window === "presenter") return

    const instanceId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    this.instanceId = instanceId

    const windowRegistry = getWindowRegistry()
    if (!windowRegistry.ordered.includes(instanceId)) windowRegistry.ordered.push(instanceId)
    this.isPrimary = windowRegistry.ordered[0] === instanceId

    let windowLabel = "unknown"
    try {
      windowLabel = getCurrentWebviewWindow().label
    } catch {
      // label unavailable outside a Tauri webview
    }
    console.info("[countdown-module] boot", {
      version: "1.5.3-sync",
      instanceId,
      primary: this.isPrimary,
      primaryId: windowRegistry.ordered[0],
      instanceCount: windowRegistry.ordered.length,
      path: window.location.pathname,
      hostWindow: host.window,
      windowLabel,
    })
    if (!this.isPrimary) return

    useCountdownStore.getState().setInstanceId(instanceId)

    this.tickUnlisten = await listen<CountdownTickPayload>("countdown:tick", (event) => {
      useCountdownStore.getState()._adoptTick(event.payload)
    })
    this.actionUnlisten = await listen<SyncActionMessage>("countdown-module:action", (event) => {
      const payload = event.payload
      if (payload.instanceId && payload.instanceId !== instanceId) {
        useCountdownStore.getState()._adoptAction(payload.cmd)
      }
    })
    useCountdownStore.getState().setSpeakAction((cmd) => {
      void emit("countdown-module:action", { cmd, instanceId })
    })

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
      component: () =>
        createElement(CountdownHeaderStatus, {
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
      id: "countdown.app",
      title: t("main.command.app"),
      type: "app",
      icon: Timer,
      keywords: ["timer", "quick", "preset", "start", "pause", "reset"],
      component: CountdownCommanderApp,
    })

    useCountdownStore.getState().setBus(host.bus)
    useCountdownStore.getState().setPresenter(host.presentation)
    const presentationState = (host.presentation as HostExt["presentation"])?.onStateChange?.(
      (state) => {
        if (state === "idle") useCountdownStore.getState().setPresenterActive(false)
      }
    )
    this.presentationStateDispose = presentationState ? () => presentationState.dispose() : null
    useCountdownStore.getState().setQueue(host.queue)
    useCountdownStore.getState().setPlayer(host.player)

    const hostExt = host as unknown as HostExt
    let stageBackdropActive = false
    useCountdownStore.getState().setExternalBackdropActivityReader(() => {
      const playerActive =
        Boolean(hostExt.player?.current?.()) && hostExt.player?.state?.() !== "idle"
      const lyricsActive = Boolean(hostExt.lyrics?.currentSlide?.())
      return stageBackdropActive || playerActive || lyricsActive
    })

    if (hostExt.fs) useCountdownStore.getState().setHostFs(hostExt.fs)
    if (hostExt.library?.list && hostExt.library?.get)
      useCountdownStore
        .getState()
        .setLibrary({ list: hostExt.library.list, get: hostExt.library.get })
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
    const restored = saved ?? readLocal<Partial<CountdownConfig>>("config")
    if (restored) {
      useCountdownStore.getState().setConfig(restored)
    } else {
      useCountdownStore.getState().setConfig({
        preText: t("configure.default.preText"),
        postText: t("configure.default.postText"),
      })
    }
    console.info("[countdown-module] restore", {
      fromHost: Boolean(saved),
      fromCache: Boolean(saved ? false : restored),
      totalSeconds: useCountdownStore.getState().config.totalSeconds,
    })
    const recordDebug = (payload: Record<string, unknown>) => {
      void host.data.json
        .get<{ totalSecondsHistory?: { at: number }[] }>("__debug")
        .then((prev) => {
          const history = prev?.totalSecondsHistory ?? []
          history.push({ ...payload, at: Date.now() })
          while (history.length > 30) history.shift()
          return history
        })
        .then((history) => host.data.json.set("__debug", { totalSecondsHistory: history }))
        .catch(() => {})
    }
    recordDebug({
      step: "restore",
      fromHost: Boolean(saved),
      fromCache: Boolean(saved ? false : restored),
      totalSeconds: useCountdownStore.getState().config.totalSeconds,
    })
    let lastLoggedTotal = useCountdownStore.getState().config.totalSeconds
    useCountdownStore.subscribe((state) => {
      if (state.config.totalSeconds !== lastLoggedTotal) {
        lastLoggedTotal = state.config.totalSeconds
        console.info("[countdown-module] config.totalSeconds ->", state.config.totalSeconds)
        recordDebug({ step: "totalChanged", to: state.config.totalSeconds })
      }
    })

    this.persistUnsubscribe = useCountdownStore.subscribe((state, prevState) => {
      if (state.config === prevState.config && state.timerPresets === prevState.timerPresets) return

      if (this.persistTimer) clearTimeout(this.persistTimer)
      this.persistTimer = setTimeout(() => {
        this.persistTimer = null
        const state = useCountdownStore.getState()
        host.data.json
          .set("config", state.config)
          .catch((err) => console.warn("[countdown-module] save config", err))
        host.data.json
          .set("timerPresets", state.timerPresets)
          .catch((err) => console.warn("[countdown-module] save timerPresets", err))
        writeLocal("config", state.config)
        writeLocal("timerPresets", state.timerPresets)
      }, 800)
    })

    const applyProfileBg = (
      bg: { src: string; thumb?: string; type: string; name: string } | null
    ) => {
      if (!bg) {
        useCountdownStore.getState().setProfileBackground(null)
        return
      }
      useCountdownStore
        .getState()
        .setProfileBackground(
          bg as { src: string; thumb?: string; type: "theme" | "image" | "video"; name: string }
        )
    }

    const themeBgListener = hostExt.themes.onDefaultBackgroundChange?.(applyProfileBg)
    this.themeBgDispose = themeBgListener ? () => themeBgListener.dispose() : null

    useCountdownStore.getState().setSaveImmediate(() => {
      const config = useCountdownStore.getState().config
      host.data.json
        .set("config", config)
        .catch((err) => console.warn("[countdown-module]", err))
      writeLocal("config", config)
    })

    useCountdownStore.getState().setOpenBackgroundPicker((cb) => host.ui.openBackgroundPicker(cb))

    const savedPresets =
      (await host.data.json.get<TimerPreset[] | undefined>("timerPresets")) ??
      readLocal<TimerPreset[]>("timerPresets")
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

    host.bus.on<StageBackdropChangeDetail>("stage:backdrop-change", (detail) => {
      stageBackdropActive = detail.active
      console.debug("[countdown-module] stage backdrop change", detail)
      useCountdownStore.getState().rebroadcast()
    })
  }

  async onunload(): Promise<void> {
    this.styleEl?.remove()
    this.styleEl = null
    this.displayReadyUnlisten?.()
    this.displayReadyUnlisten = null
    this.tickUnlisten?.()
    this.tickUnlisten = null
    this.actionUnlisten?.()
    this.actionUnlisten = null
    if (this.isPrimary) {
      useCountdownStore.getState().setSpeakAction(null)
      const windowRegistry = getWindowRegistry()
      const idx = windowRegistry.ordered.indexOf(this.instanceId)
      if (idx >= 0) windowRegistry.ordered.splice(idx, 1)
      if (windowRegistry.ordered.length === 0) {
        const w = window as unknown as Record<string, WindowHostRegistry | undefined>
        delete w[WINDOW_REGISTRY_KEY]
      }
    }
    this.presentationStateDispose?.()
    this.presentationStateDispose = null
    this.overlayStateDispose?.()
    this.overlayStateDispose = null
    this.themeBgDispose?.()
    this.themeBgDispose = null
    this.persistUnsubscribe?.()
    this.persistUnsubscribe = null
    if (this.persistTimer) {
      clearTimeout(this.persistTimer)
      this.persistTimer = null
    }
  }
}
