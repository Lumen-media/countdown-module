import { create } from "zustand"
import { TimerEngine, projectionProps } from "./lib/timer-engine.js"
import { DEFAULT_WARNING_SOUND_ID } from "./lib/sounds.js"
import { t } from "./i18n.js"
import type { BackgroundConfig, BackgroundPreset, CountdownConfig, CountdownState, EndAction, HotkeyAction, HotkeyConfig, TimerPreset } from "./types.js"

type PresenterAPI = { project: (viewId: string, props?: unknown) => void; clear: () => void }
type OverlayAPI = { project: (viewId: string, props?: unknown) => void; clear: () => void; onStateChange?: (handler: (state: "idle" | "live") => void) => { dispose(): void } }
type QueueAPI = { next: () => void; previous: () => void; goTo: (index: number) => void }
type PlayerAPI = { nextSlide: () => void; play: (itemId: string) => void }
type LibraryItem = { id: string; title: string; type: string; thumbnail?: string }
type LibraryLookupItem = { id: string; path: string; name: string; type: string }
type LibraryLookupAPI = { list: (type?: string, query?: string) => Promise<LibraryLookupItem[]>; get: (id: string) => Promise<LibraryLookupItem | null> }

type ProfileBackground = CountdownStore["profileBackground"]

const PRESENTER_PANEL_ID = "countdown.presenter"

const PRESET_CONFIGS: Record<Exclude<BackgroundPreset, "custom">, Pick<CountdownConfig["appearance"], "background" | "timerColor" | "prePostColor">> = {
  "default": {
    background: { type: "profile" },
    timerColor: "#FFFFFF",
    prePostColor: "#FFFFFF",
  },
  "dark-minimal": {
    background: { type: "solid", color: "#000000" },
    timerColor: "#FFFFFF",
    prePostColor: "#FFFFFF",
  },
  "light-clean": {
    background: { type: "solid", color: "#FFFFFF" },
    timerColor: "#000000",
    prePostColor: "#000000",
  },
}

const DEFAULT_HOTKEYS: HotkeyConfig = {
  start: "Ctrl+Enter",
  pause: "Ctrl+KeyP",
  reset: "Ctrl+Backspace",
  add10: "Ctrl+Equal",
  sub10: "Ctrl+Minus",
}

const DEFAULT_CONFIG: CountdownConfig = {
  totalSeconds: 300,
  allowNegative: false,
  countUp: false,
  preText: t("configure.default.preText"),
  postText: t("configure.default.postText"),
  hotkeys: DEFAULT_HOTKEYS,
  appearance: {
    font: "Inter (System Default)",
    fontWeight: "Extra Bold",
    fontSize: 140,
    timerColor: "#FFFFFF",
    prePostColor: "#FFFFFF",
    prePostOpacity: 0.8,
    textShadowGlow: 0.35,
    digitAnimation: "none",
    pulseEffect: false,
    showProgressBar: false,
    progressBarColor: "#FFFFFF",
    overlayMode: "fullscreen",
    cornerPosition: "bottom-right",
    background: { type: "profile" },
    preset: "default",
  },
  actions: {
    autoAdvance: { enabled: false, action: { type: "queue.next" } as EndAction },
    timeTriggers: [],
  },
  behavior: {
    hideOnCompletion: true,
    completionSound: DEFAULT_WARNING_SOUND_ID,
    webhookUrl: "",
  },
}

type CountdownStore = {
  config: CountdownConfig
  timerState: CountdownState
  isPreviewExpanded: boolean
  setPreviewExpanded: (v: boolean) => void
  isPresenterActive: boolean
  isOverlayActive: boolean
  setOverlayActive: (v: boolean) => void
  setConfig: (update: Partial<CountdownConfig>) => void
  updateAppearance: (update: Partial<CountdownConfig["appearance"]>) => void
  updateHotkeys: (update: Partial<HotkeyConfig>) => void
  applyPreset: (preset: BackgroundPreset, customBackground?: BackgroundConfig) => void
  setTotalSeconds: (seconds: number) => void
  startTimer: () => void
  pauseTimer: () => void
  resetTimer: () => void
  handleHotkey: (action: HotkeyAction) => void
  timerPresets: TimerPreset[]
  setTimerPresets: (presets: TimerPreset[]) => void
  saveTimerPreset: (name: string) => TimerPreset[]
  loadTimerPreset: (id: string) => void
  deleteTimerPreset: (id: string) => void
  _openBackgroundPicker: ((cb: (bg: { src: string; type: string; name: string }) => void) => void) | null
  setOpenBackgroundPicker: (fn: (cb: (bg: { src: string; type: string; name: string }) => void) => void) => void
  profileBackground: { src: string; thumb?: string; type: "theme" | "image" | "video" } | null
  setProfileBackground: (bg: { src: string; thumb?: string; type: "theme" | "image" | "video" } | null) => void
  _hostFs: { read: (path: string) => Promise<Uint8Array> } | null
  setHostFs: (fs: { read: (path: string) => Promise<Uint8Array> }) => void
  _presenter: PresenterAPI | null
  setPresenter: (p: PresenterAPI) => void
  _overlay: OverlayAPI | null
  setOverlay: (p: OverlayAPI) => void
  _isExternalBackdropActive: (() => boolean) | null
  setExternalBackdropActivityReader: (reader: () => boolean) => void
  _saveImmediate: (() => void) | null
  setSaveImmediate: (fn: () => void) => void
  sendToPresenter: () => void
  clearPresenter: () => void
  sendToOverlay: () => void
  clearOverlay: () => void
  rebroadcast: () => void
  _queue: QueueAPI | null
  setQueue: (q: QueueAPI) => void
  _player: PlayerAPI | null
  setPlayer: (p: PlayerAPI) => void
  _library: LibraryLookupAPI | null
  setLibrary: (library: LibraryLookupAPI) => void
  _openMediaPicker: ((cb: (item: LibraryItem) => void) => void) | null
  setOpenMediaPicker: (fn: (cb: (item: LibraryItem) => void) => void) => void
  _sceneSwitcher: ((sceneId: string) => void) | null
  setSceneSwitcher: (fn: (sceneId: string) => void) => void
  _overlayOpener: ((overlayId: string) => void) | null
  _bus: { emit: (topic: string, payload?: unknown) => void } | null
  setBus: (bus: { emit: (topic: string, payload?: unknown) => void }) => void
  setOverlayOpener: (fn: (overlayId: string) => void) => void
}

export const useCountdownStore = create<CountdownStore>((set, get) => {
  const engine = new TimerEngine({ get, set: set as (fn: (state: Record<string, unknown>) => Record<string, unknown>) => void })

  return {
    config: DEFAULT_CONFIG,
    timerState: {
      status: "idle",
      remainingSeconds: DEFAULT_CONFIG.totalSeconds,
      startedAt: null,
      pausedAt: null,
      firedTriggers: [],
      completionSoundStarted: false,
    },
    isPreviewExpanded: false,
    setPreviewExpanded: (v) => set({ isPreviewExpanded: v }),
    isPresenterActive: false,
    isOverlayActive: false,
    setOverlayActive: (v) => set({ isOverlayActive: v }),

    _openBackgroundPicker: null as CountdownStore["_openBackgroundPicker"],
    setOpenBackgroundPicker: (fn) => set({ _openBackgroundPicker: fn }),
    profileBackground: null,
    _saveImmediate: null as CountdownStore["_saveImmediate"],
    setSaveImmediate: (fn) => set({ _saveImmediate: fn }),
    setProfileBackground: (bg) => set({ profileBackground: bg }),
    _hostFs: null,
    setHostFs: (fs) => set({ _hostFs: fs }),
    _presenter: null,
    setPresenter: (p) => set({ _presenter: p }),
    _overlay: null,
    setOverlay: (p) => set({ _overlay: p }),
    _isExternalBackdropActive: null,
    setExternalBackdropActivityReader: (reader) => set({ _isExternalBackdropActive: reader }),
    _queue: null,
    setQueue: (q) => set({ _queue: q }),
    _player: null,
    setPlayer: (p) => set({ _player: p }),
    _library: null,
    setLibrary: (library) => set({ _library: library }),
    _openMediaPicker: null as CountdownStore["_openMediaPicker"],
    setOpenMediaPicker: (fn) => set({ _openMediaPicker: fn }),
    _sceneSwitcher: null as CountdownStore["_sceneSwitcher"],
    setSceneSwitcher: (fn) => set({ _sceneSwitcher: fn }),
    _overlayOpener: null as CountdownStore["_overlayOpener"],
    setOverlayOpener: (fn) => set({ _overlayOpener: fn }),
    _bus: null,
    setBus: (bus) => set({ _bus: bus }),

    sendToPresenter: () => {
      const { _presenter, _overlay, timerState, config, isOverlayActive, profileBackground, _isExternalBackdropActive } = get()
      const externalBackdropActive = _isExternalBackdropActive?.() ?? false
      if (isOverlayActive) {
        if (!_overlay) return
        _overlay.project(PRESENTER_PANEL_ID, projectionProps(config, timerState, profileBackground, externalBackdropActive))
        engine.emitTick(timerState.remainingSeconds, timerState.status, config, profileBackground, externalBackdropActive)
        return
      }
      _presenter?.project(PRESENTER_PANEL_ID, projectionProps(config, timerState, profileBackground, externalBackdropActive))
      set({ isPresenterActive: true })
      engine.emitTick(timerState.remainingSeconds, timerState.status, config, profileBackground, externalBackdropActive)
    },

    clearPresenter: () => {
      const { _presenter } = get()
      _presenter?.clear()
      set({ isPresenterActive: false })
    },

    sendToOverlay: () => {
      const { _overlay, timerState, config, profileBackground, _isExternalBackdropActive } = get()
      const externalBackdropActive = _isExternalBackdropActive?.() ?? false
      if (!_overlay) return
      _overlay.project(PRESENTER_PANEL_ID, projectionProps(config, timerState, profileBackground, externalBackdropActive))
      set({ isOverlayActive: true })
      engine.emitTick(timerState.remainingSeconds, timerState.status, config, profileBackground, externalBackdropActive)
    },

    clearOverlay: () => {
      const { _overlay } = get()
      _overlay?.clear()
      set({ isOverlayActive: false })
    },

    rebroadcast: () => {
      const { timerState, config, profileBackground, _isExternalBackdropActive } = get()
      const externalBackdropActive = _isExternalBackdropActive?.() ?? false
      engine.emitTick(timerState.remainingSeconds, timerState.status, config, profileBackground, externalBackdropActive)
    },

    setConfig: (update) =>
      set((s) => {
        const merged = {
          ...s.config,
          ...update,
          appearance: update.appearance ? { ...s.config.appearance, ...update.appearance } : s.config.appearance,
          hotkeys: update.hotkeys ? { ...s.config.hotkeys, ...update.hotkeys } : s.config.hotkeys,
          actions: update.actions ? { ...s.config.actions, ...update.actions } : s.config.actions,
          behavior: update.behavior ? { ...s.config.behavior, ...update.behavior } : s.config.behavior,
        }
        if ("countUp" in update && update.countUp) merged.allowNegative = false
        if ("allowNegative" in update && update.allowNegative) {
          merged.countUp = false
          merged.behavior = { ...merged.behavior, hideOnCompletion: false }
        }
        if (merged.countUp && merged.allowNegative) merged.allowNegative = false
        return { config: merged }
      }),

    updateAppearance: (update) =>
      set((s) => ({
        config: {
          ...s.config,
          appearance: { ...s.config.appearance, ...update },
        },
      })),

    updateHotkeys: (update) =>
      set((s) => ({
        config: {
          ...s.config,
          hotkeys: { ...s.config.hotkeys, ...update },
        },
      })),

    applyPreset: (preset, customBackground) => {
      if (preset === "custom") {
        const { _openBackgroundPicker } = get()
        if (!_openBackgroundPicker) return
        _openBackgroundPicker((bg) => {
          const src = bg.src ?? ""
          const background: BackgroundConfig = bg.type === "video"
            ? { type: "video", value: src }
            : { type: "image", value: src }
          set((s) => ({
            config: {
              ...s.config,
              appearance: {
                ...s.config.appearance,
                preset: "custom",
                background: customBackground ?? background,
              },
            },
          }))
          get()._saveImmediate?.()
        })
        return
      }

      const presetConfig = PRESET_CONFIGS[preset]
      set((s) => ({
        config: {
          ...s.config,
          appearance: {
            ...s.config.appearance,
            preset,
            ...presetConfig,
          },
        },
      }))
    },

    setTotalSeconds: (seconds) => {
      const clamped = Math.max(0, seconds)
      set((s) => ({
        config: { ...s.config, totalSeconds: clamped },
        timerState: {
          ...s.timerState,
          remainingSeconds: s.config.countUp ? 0 : clamped,
        },
      }))
      const { config: cfg, timerState: ts, profileBackground, _isExternalBackdropActive } = get()
      const externalBackdropActive = _isExternalBackdropActive?.() ?? false
      engine.emitTick(clamped, ts.status, cfg, profileBackground, externalBackdropActive)
    },

    startTimer: () => engine.startTimer(),
    pauseTimer: () => engine.pauseTimer(),
    resetTimer: () => engine.resetTimer(),

    handleHotkey: (action) => {
      const { timerState, config, startTimer, pauseTimer, resetTimer } = get()
      switch (action) {
        case "start":
          if (timerState.status === "idle" || timerState.status === "paused") startTimer()
          break
        case "pause":
          if (timerState.status === "running") pauseTimer()
          break
        case "reset":
          if (timerState.status !== "idle") resetTimer()
          break
        case "add10":
          get().setTotalSeconds(config.totalSeconds + 10)
          break
        case "sub10":
          get().setTotalSeconds(Math.max(0, config.totalSeconds - 10))
          break
      }
    },

    timerPresets: [],
    setTimerPresets: (presets) => set({ timerPresets: presets }),

    saveTimerPreset: (name) => {
      const { config, timerPresets } = get()
      const id = `preset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const newPreset: TimerPreset = {
        id,
        name,
        config: JSON.parse(JSON.stringify(config)),
      }
      const updated = [...timerPresets, newPreset]
      set({ timerPresets: updated })
      return updated
    },

    loadTimerPreset: (id) => {
      const { timerPresets, setConfig } = get()
      const preset = timerPresets.find((p) => p.id === id)
      if (preset) setConfig(preset.config)
    },

    deleteTimerPreset: (id) => {
      const { timerPresets } = get()
      set({ timerPresets: timerPresets.filter((p) => p.id !== id) })
    },
  }
})
