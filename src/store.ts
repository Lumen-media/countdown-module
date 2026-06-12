import { emit } from "@tauri-apps/api/event"
import { create } from "zustand"
import type { BackgroundConfig, BackgroundPreset, CountdownConfig, CountdownState } from "./types.js"

type PresenterAPI = { project: (viewId: string, props?: unknown) => void; clear: () => void }

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

const DEFAULT_CONFIG: CountdownConfig = {
  totalSeconds: 300,
  allowNegative: false,
  preText: "The event is about to start",
  postText: "We're live!",
  appearance: {
    font: "Inter (System Default)",
    fontWeight: "Extra Bold",
    fontSize: 140,
    timerColor: "#FFFFFF",
    prePostColor: "#FFFFFF",
    prePostOpacity: 0.8,
    textShadowGlow: 0,
    overlayMode: "fullscreen",
    cornerPosition: "bottom-right",
    background: { type: "profile" },
    preset: "default",
  },
  actions: {
    autoAdvance: { enabled: true, target: "next" },
    timeTriggers: [
      { enabled: false, atSeconds: 60, type: "warning-chime", sound: "" },
      { enabled: false, atSeconds: 30, type: "change-text", preText: "", postText: "" },
    ],
  },
  behavior: {
    hideOnCompletion: true,
  },
}

function emitTick(remaining: number, status: CountdownState["status"], config: CountdownConfig) {
  emit("countdown:tick", { remaining, status, config }).catch(() => {})
}

type CountdownStore = {
  config: CountdownConfig
  timerState: CountdownState
  isPreviewExpanded: boolean
  setPreviewExpanded: (v: boolean) => void
  setConfig: (update: Partial<CountdownConfig>) => void
  updateAppearance: (update: Partial<CountdownConfig["appearance"]>) => void
  applyPreset: (preset: BackgroundPreset, customBackground?: BackgroundConfig) => void
  setTotalSeconds: (seconds: number) => void
  startTimer: () => void
  pauseTimer: () => void
  resetTimer: () => void
  tick: () => void
  _openBackgroundPicker: ((cb: (bg: { src: string; type: string; name: string }) => void) => void) | null
  setOpenBackgroundPicker: (fn: (cb: (bg: { src: string; type: string; name: string }) => void) => void) => void
  profileBackground: { src: string; thumb?: string; type: "theme" | "image" | "video" } | null
  setProfileBackground: (bg: { src: string; thumb?: string; type: "theme" | "image" | "video" } | null) => void
  _hostFs: { read: (path: string) => Promise<Uint8Array> } | null
  setHostFs: (fs: { read: (path: string) => Promise<Uint8Array> }) => void
  _presenter: PresenterAPI | null
  setPresenter: (p: PresenterAPI) => void
  sendToPresenter: () => void
}

export const useCountdownStore = create<CountdownStore>((set, get) => ({
  config: DEFAULT_CONFIG,
  timerState: {
    status: "idle",
    remainingSeconds: DEFAULT_CONFIG.totalSeconds,
    startedAt: null,
    pausedAt: null,
    firedTriggers: [],
  },
  isPreviewExpanded: false,
  setPreviewExpanded: (v) => set({ isPreviewExpanded: v }),

  _openBackgroundPicker: null as CountdownStore["_openBackgroundPicker"],
  setOpenBackgroundPicker: (fn) => set({ _openBackgroundPicker: fn }),
  profileBackground: null,
  setProfileBackground: (bg) => set({ profileBackground: bg }),
  _hostFs: null,
  setHostFs: (fs) => set({ _hostFs: fs }),
  _presenter: null,
  setPresenter: (p) => set({ _presenter: p }),

  sendToPresenter: () => {
    const { _presenter, timerState, config } = get()
    _presenter?.project(PRESENTER_PANEL_ID)
    emitTick(timerState.remainingSeconds, timerState.status, config)
  },

  setConfig: (update) =>
    set((s) => ({ config: { ...s.config, ...update } })),

  updateAppearance: (update) =>
    set((s) => ({
      config: {
        ...s.config,
        appearance: { ...s.config.appearance, ...update },
      },
    })),

  applyPreset: (preset, customBackground) => {
    if (preset === "custom") {
      const { _openBackgroundPicker } = get()
      if (!_openBackgroundPicker) return
      _openBackgroundPicker((bg) => {
        const src = bg.src ?? ""
        const background: BackgroundConfig = bg.type === "video"
          ? { type: "video", value: src, opacity: 0.5 }
          : { type: "image", value: src, opacity: 0.5 }
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

  setTotalSeconds: (seconds) =>
    set((s) => ({
      config: { ...s.config, totalSeconds: Math.max(0, seconds) },
      timerState: {
        ...s.timerState,
        remainingSeconds: Math.max(0, seconds),
      },
    })),

  startTimer: () => {
    const { timerState, config, _presenter } = get()
    if (timerState.status === "running") return

    _presenter?.project(PRESENTER_PANEL_ID)

    if (timerState.status === "paused" && timerState.pausedAt !== null && timerState.startedAt !== null) {
      const pausedDuration = Date.now() - timerState.pausedAt
      const newState = {
        ...timerState,
        status: "running" as const,
        startedAt: (timerState.startedAt ?? 0) + pausedDuration,
        pausedAt: null,
        firedTriggers: [],
      }
      set({ timerState: newState })
      emitTick(newState.remainingSeconds, "running", config)
    } else {
      const newState = {
        status: "running" as const,
        remainingSeconds: config.totalSeconds,
        startedAt: Date.now(),
        pausedAt: null,
        firedTriggers: [],
      }
      set({ timerState: newState })
      emitTick(newState.remainingSeconds, "running", config)
    }
  },

  pauseTimer: () => {
    const { timerState, config } = get()
    const newState = { ...timerState, status: "paused" as const, pausedAt: Date.now() }
    set({ timerState: newState })
    emitTick(newState.remainingSeconds, "paused", config)
  },

  resetTimer: () => {
    const { config } = get()
    const newState = {
      status: "idle" as const,
      remainingSeconds: config.totalSeconds,
      startedAt: null,
      pausedAt: null,
      firedTriggers: [],
    }
    set({ timerState: newState })
    emitTick(newState.remainingSeconds, "idle", config)
  },

  tick: () => {
    const { timerState, config } = get()
    if (timerState.status !== "running" || timerState.startedAt === null) return

    const elapsed = (Date.now() - timerState.startedAt) / 1000
    const raw = config.totalSeconds - elapsed
    const remaining = config.allowNegative ? raw : Math.max(0, raw)

    if (!config.allowNegative && remaining <= 0) {
      set((s) => ({
        timerState: { ...s.timerState, status: "finished", remainingSeconds: 0 },
      }))
      emitTick(0, "finished", config)
      if (config.behavior.hideOnCompletion) {
        get()._presenter?.clear()
      }
      return
    }

    let updatedConfig = config
    const newFiredTriggers = [...timerState.firedTriggers]

    for (const trigger of config.actions.timeTriggers) {
      if (
        trigger.enabled &&
        !newFiredTriggers.includes(trigger.atSeconds) &&
        remaining <= trigger.atSeconds
      ) {
        if (trigger.type === "change-text") {
          updatedConfig = {
            ...updatedConfig,
            preText: trigger.preText,
            postText: trigger.postText,
          }
        }
        newFiredTriggers.push(trigger.atSeconds)
      }
    }

    if (updatedConfig !== config) {
      set((s) => ({
        config: updatedConfig,
        timerState: { ...s.timerState, remainingSeconds: remaining, firedTriggers: newFiredTriggers },
      }))
    } else {
      set((s) => ({
        timerState: { ...s.timerState, remainingSeconds: remaining, firedTriggers: newFiredTriggers },
      }))
    }

    emitTick(remaining, "running", updatedConfig)
  },
}))

export function formatTime(seconds: number): string {
  const abs = Math.abs(seconds)
  const mins = Math.floor(abs / 60)
  const secs = Math.floor(abs % 60)
  const sign = seconds < 0 ? "-" : ""
  return `${sign}${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
}
