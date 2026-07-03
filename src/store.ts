import { animate } from "animejs"
import { emit } from "@tauri-apps/api/event"
import { create } from "zustand"
import { isCornerActive, type CountdownTickPayload } from "./lib/display-mode.js"
import { DEFAULT_WARNING_SOUND_ID, getBundledSoundDuration, playBundledSound, playSelectedSound } from "./lib/sounds.js"
import type { BackgroundConfig, BackgroundPreset, CountdownConfig, CountdownState, EndAction, HotkeyAction, HotkeyConfig, TimerPreset, WebhookEvent } from "./types.js"

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
  preText: "The event is about to start",
  postText: "We're live!",
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

function getPresentationFlags(config: CountdownConfig, profileBackground: ProfileBackground, externalBackdropActive: boolean) {
  const cornerActive = isCornerActive(config, profileBackground, externalBackdropActive)
  const renderConfiguredBackground = !externalBackdropActive

  return { cornerActive, renderConfiguredBackground }
}

function emitTick(
  remaining: number,
  status: CountdownState["status"],
  config: CountdownConfig,
  profileBackground: ProfileBackground,
  externalBackdropActive: boolean,
) {
  const presentationFlags = getPresentationFlags(config, profileBackground, externalBackdropActive)
  const configJson = JSON.stringify(config)
  const configChanged = configJson !== _lastEmittedConfigJson
  if (configChanged) {
    _lastEmittedConfigJson = configJson
  }
  const payload: CountdownTickPayload = {
    remaining,
    status,
    ...(configChanged ? { config } : {}),
    ...presentationFlags,
  }

  emit("countdown:tick", payload).catch(() => {})
}

function postWebhook(event: WebhookEvent, url?: string) {
  if (!url) return
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
    keepalive: true,
  }).catch(() => {})
}

function projectionProps(
  config: CountdownConfig,
  timerState: CountdownState,
  profileBackground: ProfileBackground,
  externalBackdropActive: boolean,
) {
  const presentationFlags = getPresentationFlags(config, profileBackground, externalBackdropActive)
  const backgroundProps = !externalBackdropActive && config.appearance.background.type === "profile"
    ? { background: "default" }
    : {}

  return {
    ...backgroundProps,
    initialTick: {
      remaining: timerState.remainingSeconds,
      status: timerState.status,
      config,
      ...presentationFlags,
    } satisfies CountdownTickPayload,
  }
}

const COMPLETION_SOUND_SAFETY_SECONDS = 1

let _lastEmittedConfigJson: string | null = null
let _animation: ReturnType<typeof animate> | null = null
let _completionSoundTimer: ReturnType<typeof setTimeout> | null = null
let _completionSoundAudio: HTMLAudioElement | null = null
let _lastTickSecond: number | null = null

function cancelAnimation() {
  if (_animation !== null) {
    _animation.cancel()
    _animation = null
  }
  _lastTickSecond = null
}

function clearCompletionSoundTimer() {
  if (_completionSoundTimer !== null) {
    clearTimeout(_completionSoundTimer)
    _completionSoundTimer = null
  }
}

function stopCompletionSound() {
  clearCompletionSoundTimer()
  if (_completionSoundAudio !== null) {
    _completionSoundAudio.pause()
    _completionSoundAudio = null
  }
  const { timerState } = useCountdownStore.getState()
  if (timerState.completionSoundStarted) {
    useCountdownStore.setState((s) => ({
      timerState: { ...s.timerState, completionSoundStarted: false },
    }))
  }
}

function pauseCompletionSound() {
  clearCompletionSoundTimer()
  if (_completionSoundAudio !== null) {
    _completionSoundAudio.pause()
    // Don't null the reference — keep it alive for resume
  }
  const { timerState } = useCountdownStore.getState()
  if (timerState.completionSoundStarted) {
    useCountdownStore.setState((s) => ({
      timerState: { ...s.timerState, completionSoundStarted: false },
    }))
  }
}

function resumeCompletionSound() {
  if (_completionSoundAudio !== null) {
    _completionSoundAudio.play().catch(() => {})
    useCountdownStore.setState((s) => ({
      timerState: { ...s.timerState, completionSoundStarted: true },
    }))
    return true
  }
  return false
}

function scheduleCompletionSound(get: () => CountdownStore, durationMs: number) {
  clearCompletionSoundTimer()

  const { timerState, config } = get()
  const soundId = config.behavior.completionSound
  if (timerState.status !== "running" || !soundId || timerState.completionSoundStarted) return

  void getBundledSoundDuration(soundId).then((durationSeconds) => {
    const { timerState: latestTimerState, config: latestConfig } = get()
    if (
      latestTimerState.status !== "running" ||
      latestTimerState.completionSoundStarted ||
      latestConfig.behavior.completionSound !== soundId
    ) return

    const leadMs = Math.max(0, (durationSeconds ?? 0) * 1000 - COMPLETION_SOUND_SAFETY_SECONDS * 1000)
    const currentTimeMs = _animation?.currentTime ?? 0
    const delayMs = Math.max(0, durationMs - currentTimeMs - leadMs)

    _completionSoundTimer = setTimeout(() => {
      const { timerState: currentTimerState, config: currentConfig } = get()
      if (
        currentTimerState.status !== "running" ||
        currentTimerState.completionSoundStarted ||
        currentConfig.behavior.completionSound !== soundId
      ) {
        _completionSoundTimer = null
        return
      }

      useCountdownStore.setState((state) => ({
        timerState: {
          ...state.timerState,
          completionSoundStarted: true,
        },
      }))
      _completionSoundAudio = playBundledSound(soundId)
      _completionSoundTimer = null
    }, delayMs)
  })
}

function handleTickCompletion(get: () => CountdownStore, remainingOnFinish = 0) {
  const { timerState, config, profileBackground, _isExternalBackdropActive } = get()
  const externalBackdropActive = _isExternalBackdropActive?.() ?? false
  if (timerState.status !== "running") return

  clearCompletionSoundTimer()
  setFinishedState(timerState, config, profileBackground, externalBackdropActive, remainingOnFinish)
}

function setFinishedState(
  timerState: CountdownState,
  config: CountdownConfig,
  profileBackground: CountdownStore["profileBackground"],
  externalBackdropActive: boolean,
  remainingOnFinish = 0,
) {
  useCountdownStore.setState((s) => ({
    timerState: { ...s.timerState, status: "finished", remainingSeconds: remainingOnFinish },
  }))
  emitTick(remainingOnFinish, "finished", config, profileBackground, externalBackdropActive)
  emitBusEvent("countdown-module:timer.finished", { remaining: remainingOnFinish, total: config.totalSeconds, countUp: config.countUp })

  postWebhook(
    { event: "timer.finished", remaining: remainingOnFinish, total: config.totalSeconds, countUp: config.countUp },
    config.behavior.webhookUrl,
  )

  if (config.behavior.hideOnCompletion) {
    const { _presenter, _overlay, isOverlayActive } = useCountdownStore.getState()
    if (isOverlayActive) {
      _overlay?.clear()
      useCountdownStore.setState({ isOverlayActive: false })
    } else {
      _presenter?.clear()
      useCountdownStore.setState({ isPresenterActive: false })
    }
  }
  if (config.actions.autoAdvance.enabled) {
    const { _queue, _player, _sceneSwitcher, _overlayOpener } = useCountdownStore.getState()
    const action = config.actions.autoAdvance.action
    if (action.type === "queue.next") _queue?.next()
    else if (action.type === "queue.previous") _queue?.previous()
    else if (action.type === "player.next-slide") _player?.nextSlide()
    else if (action.type === "player.play") _player?.play(action.itemId)
    else if (action.type === "change-scene") _sceneSwitcher?.(action.sceneId)
    else if (action.type === "play-media") _player?.play(action.mediaId)
    else if (action.type === "open-overlay") _overlayOpener?.(action.overlayId)
    else if (action.type === "send-webhook") {
      postWebhook(
        { event: "timer.finished", remaining: remainingOnFinish, total: config.totalSeconds, countUp: config.countUp },
        action.payload ?? config.behavior.webhookUrl,
      )
    }
  }
}

function onAnimationUpdate(remaining: number) {
  const store = useCountdownStore.getState()
  if (store.timerState.status !== "running") {
    cancelAnimation()
    return
  }

  const { timerState, config, profileBackground, _isExternalBackdropActive } = store
  const externalBackdropActive = _isExternalBackdropActive?.() ?? false
  const animTime = _animation?.currentTime ?? 0
  const displaySecond = Math.floor(remaining)

  if (!config.allowNegative) {
    if (config.countUp ? remaining >= config.totalSeconds : remaining <= 0) {
      cancelAnimation()
      handleTickCompletion(() => useCountdownStore.getState())
      return
    }
  }

  if (displaySecond !== _lastTickSecond) {
    if (_lastTickSecond === null && animTime < 500) return
    _lastTickSecond = displaySecond

    let updatedConfig = config
    const newFiredTriggers = [...timerState.firedTriggers]
    const { _queue, _player, _hostFs, _sceneSwitcher, _overlayOpener } = store

    for (const trigger of config.actions.timeTriggers) {
      const shouldFire = trigger.enabled &&
        !newFiredTriggers.includes(trigger.atSeconds) &&
        (config.countUp ? remaining >= trigger.atSeconds : remaining <= trigger.atSeconds)

        if (shouldFire) {
          emitBusEvent("countdown-module:timer.trigger", { atSeconds: trigger.atSeconds, triggerType: trigger.type, remaining })
          if (trigger.type === "change-text") {
          updatedConfig = { ...updatedConfig, preText: trigger.preText, postText: trigger.postText }
        } else if (trigger.type === "warning-chime") {
          void playSelectedSound(trigger.sound, _hostFs)
        } else if (trigger.type === "queue.next") {
          _queue?.next()
        } else if (trigger.type === "queue.previous") {
          _queue?.previous()
        } else if (trigger.type === "player.next-slide") {
          _player?.nextSlide()
        } else if (trigger.type === "player.play") {
          _player?.play(trigger.itemId)
        } else if (trigger.type === "send-webhook") {
          postWebhook(
            { event: "timer.trigger", atSeconds: trigger.atSeconds, triggerType: trigger.type, remaining },
            config.behavior.webhookUrl,
          )
        }
        newFiredTriggers.push(trigger.atSeconds)
      }
    }

    postWebhook(
      { event: "timer.tick", remaining, total: config.totalSeconds, countUp: config.countUp },
      config.behavior.webhookUrl,
    )
    emitBusEvent("countdown-module:timer.tick", { remaining, total: config.totalSeconds, countUp: config.countUp })

    if (updatedConfig !== config) {
      useCountdownStore.setState((s) => ({
        config: updatedConfig,
        timerState: { ...s.timerState, remainingSeconds: remaining, firedTriggers: newFiredTriggers },
      }))
    } else {
      useCountdownStore.setState((s) => ({
        timerState: { ...s.timerState, remainingSeconds: remaining, firedTriggers: newFiredTriggers },
      }))
    }

    emitTick(remaining, "running", updatedConfig, profileBackground, externalBackdropActive)
  }
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

export const useCountdownStore = create<CountdownStore>((set, get) => ({
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
      emitTick(timerState.remainingSeconds, timerState.status, config, profileBackground, externalBackdropActive)
      return
    }
    _presenter?.project(PRESENTER_PANEL_ID, projectionProps(config, timerState, profileBackground, externalBackdropActive))
    set({ isPresenterActive: true })
    emitTick(timerState.remainingSeconds, timerState.status, config, profileBackground, externalBackdropActive)
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
    emitTick(timerState.remainingSeconds, timerState.status, config, profileBackground, externalBackdropActive)
  },

  clearOverlay: () => {
    const { _overlay } = get()
    _overlay?.clear()
    set({ isOverlayActive: false })
  },

  rebroadcast: () => {
    const { timerState, config, profileBackground, _isExternalBackdropActive } = get()
    const externalBackdropActive = _isExternalBackdropActive?.() ?? false
    emitTick(timerState.remainingSeconds, timerState.status, config, profileBackground, externalBackdropActive)
  },

  setConfig: (update) =>
    set((s) => ({
      config: {
        ...s.config,
        ...update,
        appearance: update.appearance ? { ...s.config.appearance, ...update.appearance } : s.config.appearance,
        hotkeys: update.hotkeys ? { ...s.config.hotkeys, ...update.hotkeys } : s.config.hotkeys,
        actions: update.actions ? { ...s.config.actions, ...update.actions } : s.config.actions,
        behavior: update.behavior ? { ...s.config.behavior, ...update.behavior } : s.config.behavior,
      },
    })),

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
    emitTick(clamped, ts.status, cfg, profileBackground, externalBackdropActive)
  },

  startTimer: () => {
    const { timerState, config, _presenter, _overlay, isOverlayActive, profileBackground, _isExternalBackdropActive } = get()
    const externalBackdropActive = _isExternalBackdropActive?.() ?? false
    if (timerState.status === "running") return

    cancelAnimation()

    const resuming = timerState.status === "paused"

    let soundResumed = false
    if (resuming) {
      soundResumed = resumeCompletionSound()
      if (!soundResumed) {
        stopCompletionSound()
      }
    } else {
      stopCompletionSound()
    }

      if (config.countUp) {
        const startValue = resuming ? timerState.remainingSeconds : 0
        const durationMs = (config.totalSeconds - startValue) * 1000

        const newState = resuming
          ? {
              ...timerState,
              status: "running" as const,
              pausedAt: null,
              firedTriggers: [],
              completionSoundStarted: soundResumed,
            }
          : {
              status: "running" as const,
              remainingSeconds: 0,
              startedAt: null,
              pausedAt: null,
              firedTriggers: [],
              completionSoundStarted: false,
            }

        set({ timerState: newState })

        const targetObj = { value: startValue }
        _animation = animate(targetObj, {
          value: [startValue, config.totalSeconds],
          duration: durationMs,
          ease: "linear",
          onUpdate: () => { onAnimationUpdate(targetObj.value) },
          onComplete: () => {
            _animation = null
            _lastTickSecond = null
            handleTickCompletion(() => useCountdownStore.getState(), config.totalSeconds)
          },
        })

        if (isOverlayActive) {
          _overlay?.project(PRESENTER_PANEL_ID, projectionProps(config, newState, profileBackground, externalBackdropActive))
        } else {
          _presenter?.project(PRESENTER_PANEL_ID, projectionProps(config, newState, profileBackground, externalBackdropActive))
          set({ isPresenterActive: true })
        }

        emitTick(newState.remainingSeconds, "running", config, profileBackground, externalBackdropActive)
        emitBusEvent("countdown-module:timer.started", { remaining: startValue, total: config.totalSeconds, countUp: true, preText: config.preText, postText: config.postText })
        postWebhook(
          { event: "timer.started", remaining: startValue, total: config.totalSeconds, countUp: true, preText: config.preText, postText: config.postText },
          config.behavior.webhookUrl,
        )
        if (!soundResumed) {
          scheduleCompletionSound(get, durationMs)
        }
        return
      }

    const remainingSeconds = resuming ? timerState.remainingSeconds : config.totalSeconds
    const endValue = config.allowNegative ? -(config.totalSeconds) : 0
    const durationMs = config.allowNegative
      ? (remainingSeconds + config.totalSeconds) * 1000
      : remainingSeconds * 1000
    const soundDurationMs = remainingSeconds * 1000

    const newState = resuming
      ? {
          ...timerState,
          status: "running" as const,
          pausedAt: null,
          firedTriggers: [],
          completionSoundStarted: soundResumed,
        }
      : {
          status: "running" as const,
          remainingSeconds: config.totalSeconds,
          startedAt: null,
          pausedAt: null,
          firedTriggers: [],
          completionSoundStarted: false,
        }

    set({ timerState: newState })

    const targetObj = { value: remainingSeconds }
    _animation = animate(targetObj, {
      value: [remainingSeconds, endValue],
      duration: durationMs,
      ease: "linear",
      onUpdate: () => { onAnimationUpdate(targetObj.value) },
      onComplete: () => {
        _animation = null
        _lastTickSecond = null
        if (!config.allowNegative) {
          handleTickCompletion(() => useCountdownStore.getState())
        }
      },
    })

    if (isOverlayActive) {
      _overlay?.project(PRESENTER_PANEL_ID, projectionProps(config, newState, profileBackground, externalBackdropActive))
    } else {
      _presenter?.project(PRESENTER_PANEL_ID, projectionProps(config, newState, profileBackground, externalBackdropActive))
      set({ isPresenterActive: true })
    }

    emitTick(newState.remainingSeconds, "running", config, profileBackground, externalBackdropActive)
    emitBusEvent("countdown-module:timer.started", { remaining: remainingSeconds, total: config.totalSeconds, countUp: false, preText: config.preText, postText: config.postText })
    postWebhook(
      { event: "timer.started", remaining: remainingSeconds, total: config.totalSeconds, countUp: false, preText: config.preText, postText: config.postText },
      config.behavior.webhookUrl,
    )
    if (!soundResumed) {
      scheduleCompletionSound(get, soundDurationMs)
    }
  },
    pauseTimer: () => {
    _animation?.pause()
    pauseCompletionSound()
    const { timerState, config, profileBackground, _isExternalBackdropActive } = get()
    const externalBackdropActive = _isExternalBackdropActive?.() ?? false
    const newState = { ...timerState, status: "paused" as const, pausedAt: Date.now() }
    set({ timerState: newState })
    emitTick(newState.remainingSeconds, "paused", config, profileBackground, externalBackdropActive)
    emitBusEvent("countdown-module:timer.paused", { remaining: newState.remainingSeconds })
    postWebhook({ event: "timer.paused", remaining: newState.remainingSeconds }, config.behavior.webhookUrl)
  },

  resetTimer: () => {
    cancelAnimation()
    stopCompletionSound()
    const { config, profileBackground, _isExternalBackdropActive } = get()
    const externalBackdropActive = _isExternalBackdropActive?.() ?? false
    const newState = {
      status: "idle" as const,
      remainingSeconds: config.totalSeconds,
      startedAt: null,
      pausedAt: null,
      firedTriggers: [],
      completionSoundStarted: false,
    }
    set({ timerState: newState })
    emitTick(newState.remainingSeconds, "idle", config, profileBackground, externalBackdropActive)
    emitBusEvent("countdown-module:timer.reset", { remaining: config.totalSeconds, total: config.totalSeconds })
    postWebhook(
      { event: "timer.reset", remaining: config.totalSeconds, total: config.totalSeconds },
      config.behavior.webhookUrl,
    )
  },

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


}))

function emitBusEvent(topic: string, payload?: unknown) {
  const { _bus } = useCountdownStore.getState()
  _bus?.emit(topic, payload)
}




