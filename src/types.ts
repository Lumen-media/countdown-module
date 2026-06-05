export type TimeTrigger =
  | { enabled: boolean; atSeconds: number; type: "warning-chime"; sound: string }
  | { enabled: boolean; atSeconds: number; type: "change-text"; preText: string; postText: string }

export type BackgroundConfig =
  | { type: "profile" }
  | { type: "solid"; color: string }
  | { type: "gradient"; value: string }
  | { type: "image"; value: string; opacity: number }
  | { type: "video"; value: string; opacity: number }

export type BackgroundPreset = "dark-minimal" | "light-clean" | "default" | "custom"

export type CountdownConfig = {
  totalSeconds: number
  allowNegative: boolean
  preText: string
  postText: string
  appearance: {
    font: string
    fontWeight: string
    fontSize: number
    timerColor: string
    prePostColor: string
    prePostOpacity: number
    textShadowGlow: number
    overlayMode: "fullscreen" | "corner"
    cornerPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right"
    background: BackgroundConfig
    preset: BackgroundPreset | null
  }
  actions: {
    autoAdvance: { enabled: boolean; target: string }
    timeTriggers: TimeTrigger[]
  }
  behavior: {
    hideOnCompletion: boolean
  }
}

export type CountdownStatus = "idle" | "running" | "paused" | "finished"

export type CountdownState = {
  status: CountdownStatus
  remainingSeconds: number
  startedAt: number | null
  pausedAt: number | null
}
