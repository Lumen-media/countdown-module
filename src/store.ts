import { create } from "zustand"
import type { CountdownConfig, CountdownState, CountdownStatus } from "./types.js"

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
    background: { type: "solid", color: "#000000" },
    preset: "dark-minimal",
  },
  actions: {
    autoAdvance: { enabled: true, target: "next" },
    timeTriggers: [],
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
  setTotalSeconds: (seconds: number) => void
  startTimer: () => void
  pauseTimer: () => void
  resetTimer: () => void
  tick: () => void
}

export const useCountdownStore = create<CountdownStore>((set, get) => ({
  config: DEFAULT_CONFIG,
  timerState: {
    status: "idle",
    remainingSeconds: DEFAULT_CONFIG.totalSeconds,
    startedAt: null,
    pausedAt: null,
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
