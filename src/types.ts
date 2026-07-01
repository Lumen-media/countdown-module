export type CountdownSoundSelection = {
  source: "bundled" | "library"
  value: string
  label: string
  path?: string
}

export type TimeTrigger =
  | { enabled: boolean; atSeconds: number; type: "warning-chime"; sound: CountdownSoundSelection | null }
  | { enabled: boolean; atSeconds: number; type: "change-text"; preText: string; postText: string }
  | { enabled: boolean; atSeconds: number; type: "queue.next" }
  | { enabled: boolean; atSeconds: number; type: "queue.previous" }
  | { enabled: boolean; atSeconds: number; type: "player.next-slide" }
  | { enabled: boolean; atSeconds: number; type: "player.play"; itemId: string; itemTitle: string }
  | { enabled: boolean; atSeconds: number; type: "send-webhook" }

export type BackgroundConfig =
  | { type: "profile" }
  | { type: "solid"; color: string }
  | { type: "gradient"; value: string }
  | { type: "image"; value: string }
  | { type: "video"; value: string }

export type BackgroundPreset = "dark-minimal" | "light-clean" | "default" | "custom"

export type EndAction =
  | { type: "queue.next" }
  | { type: "queue.previous" }
  | { type: "player.next-slide" }
  | { type: "player.play"; itemId: string; itemTitle: string }
  | { type: "change-scene"; sceneId: string; sceneName: string }
  | { type: "play-media"; mediaId: string; mediaName: string }
  | { type: "open-overlay"; overlayId: string; overlayName: string }
  | { type: "send-webhook"; payload?: string }

export type HotkeyAction = "start" | "pause" | "reset" | "add10" | "sub10"

export type HotkeyConfig = Record<HotkeyAction, string>

export type TimerPreset = {
  id: string
  name: string
  config: CountdownConfig
}

export type CountdownConfig = {
  totalSeconds: number
  allowNegative: boolean
  countUp: boolean
  preText: string
  postText: string
  hotkeys: HotkeyConfig
  appearance: {
    font: string
    fontWeight: string
    fontSize: number
    timerColor: string
    prePostColor: string
    prePostOpacity: number
    textShadowGlow: number
    digitAnimation: "none" | "flip" | "blur"
    pulseEffect: boolean
    showProgressBar: boolean
    progressBarColor: string
    overlayMode: "fullscreen" | "corner"
    cornerPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right"
    background: BackgroundConfig
    preset: BackgroundPreset | null
  }
  actions: {
    autoAdvance: { enabled: boolean; action: EndAction }
    timeTriggers: TimeTrigger[]
  }
  behavior: {
    hideOnCompletion: boolean
    completionSound: string
    webhookUrl: string
  }
}

export type CountdownStatus = "idle" | "running" | "paused" | "finished"

export type CountdownState = {
  status: CountdownStatus
  remainingSeconds: number
  startedAt: number | null
  pausedAt: number | null
  firedTriggers: number[]
  completionSoundStarted: boolean
}

export type WebhookEvent =
  | { event: "timer.started"; remaining: number; total: number; countUp: boolean; preText: string; postText: string }
  | { event: "timer.tick"; remaining: number; total: number; countUp: boolean }
  | { event: "timer.trigger"; atSeconds: number; triggerType: string; remaining: number }
  | { event: "timer.finished"; remaining: number; total: number; countUp: boolean }
  | { event: "timer.paused"; remaining: number }
  | { event: "timer.reset"; remaining: number; total: number }
