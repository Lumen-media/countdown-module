import { create } from "zustand"
import type { BackgroundConfig, BackgroundPreset, CountdownConfig, CountdownState } from "./types.js"

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

type CountdownStore = {
  config: CountdownConfig
  timerState: CountdownState
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
}

export const useCountdownStore = create<CountdownStore>((set, get) => ({
  config: DEFAULT_CONFIG,
  timerState: {
    status: "idle",
    remainingSeconds: DEFAULT_CONFIG.totalSeconds,
    startedAt: null,
    pausedAt: null,
  },

  _openBackgroundPicker: null as CountdownStore["_openBackgroundPicker"],
  setOpenBackgroundPicker: (fn) => set({ _openBackgroundPicker: fn }),
  profileBackground: null,
  setProfileBackground: (bg) => set({ profileBackground: bg }),
  _hostFs: null,
  setHostFs: (fs) => set({ _hostFs: fs }),

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
    const { timerState, config } = get()
    if (timerState.status === "running") return

    if (timerState.status === "paused" && timerState.pausedAt !== null && timerState.startedAt !== null) {
      const pausedDuration = Date.now() - timerState.pausedAt
      set((s) => ({
        timerState: {
          ...s.timerState,
          status: "running",
          startedAt: (s.timerState.startedAt ?? 0) + pausedDuration,
          pausedAt: null,
        },
      }))
    } else {
      set({
        timerState: {
          status: "running",
          remainingSeconds: config.totalSeconds,
          startedAt: Date.now(),
          pausedAt: null,
        },
      })
    }
  },

  pauseTimer: () =>
    set((s) => ({
      timerState: {
        ...s.timerState,
        status: "paused",
        pausedAt: Date.now(),
      },
    })),

  resetTimer: () =>
    set((s) => ({
      timerState: {
        status: "idle",
        remainingSeconds: s.config.totalSeconds,
        startedAt: null,
        pausedAt: null,
      },
    })),

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
      return
    }

    set((s) => ({ timerState: { ...s.timerState, remainingSeconds: remaining } }))
  },
}))

export function formatTime(seconds: number): string {
  const abs = Math.abs(seconds)
  const mins = Math.floor(abs / 60)
  const secs = Math.floor(abs % 60)
  const sign = seconds < 0 ? "-" : ""
  return `${sign}${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
}
