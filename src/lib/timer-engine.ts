import { animate } from "animejs"
import { emit } from "@tauri-apps/api/event"
import { isCornerActive, type CountdownTickPayload } from "./display-mode.js"
import { getBundledSoundDuration, playBundledSound, playSelectedSound } from "./sounds.js"
import type { CountdownConfig, CountdownState, WebhookEvent } from "../types.js"

type ProfileBackground = { src: string; thumb?: string; type: "theme" | "image" | "video" } | null

type StoreAPI = {
  get: () => {
    config: CountdownConfig
    timerState: CountdownState
    profileBackground: ProfileBackground
    isOverlayActive: boolean
    isPresenterActive: boolean
    _isExternalBackdropActive: (() => boolean) | null
    _presenter: { project: (viewId: string, props?: unknown) => void; clear: () => void } | null
    _overlay: { project: (viewId: string, props?: unknown) => void; clear: () => void } | null
    _queue: { next: () => void; previous: () => void; goTo: (index: number) => void } | null
    _player: { nextSlide: () => void; play: (itemId: string) => void } | null
    _hostFs: { read: (path: string) => Promise<Uint8Array> } | null
    _sceneSwitcher: ((sceneId: string) => void) | null
    _overlayOpener: ((overlayId: string) => void) | null
    _bus: { emit: (topic: string, payload?: unknown) => void } | null
  }
  set: (fn: (state: Record<string, unknown>) => Record<string, unknown>) => void
}

const PRESENTER_PANEL_ID = "countdown.presenter"
const COMPLETION_SOUND_SAFETY_SECONDS = 1

function getPresentationFlags(config: CountdownConfig, profileBackground: ProfileBackground, externalBackdropActive: boolean) {
  const cornerActive = isCornerActive(config, profileBackground, externalBackdropActive)
  const renderConfiguredBackground = !externalBackdropActive
  return { cornerActive, renderConfiguredBackground }
}

export function projectionProps(
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

export class TimerEngine {
  private animation: ReturnType<typeof animate> | null = null
  private completionSoundTimer: ReturnType<typeof setTimeout> | null = null
  private completionSoundAudio: HTMLAudioElement | null = null
  private lastTickSecond: number | null = null
  private lastEmittedConfigJson: string | null = null

  constructor(private api: StoreAPI) {}

  private cancelAnimation() {
    if (this.animation !== null) {
      this.animation.cancel()
      this.animation = null
    }
    this.lastTickSecond = null
  }

  private clearCompletionSoundTimer() {
    if (this.completionSoundTimer !== null) {
      clearTimeout(this.completionSoundTimer)
      this.completionSoundTimer = null
    }
  }

  private stopCompletionSound() {
    this.clearCompletionSoundTimer()
    if (this.completionSoundAudio !== null) {
      this.completionSoundAudio.pause()
      this.completionSoundAudio = null
    }
    const { timerState } = this.api.get()
    if (timerState.completionSoundStarted) {
      this.api.set((s) => ({ timerState: { ...s.timerState, completionSoundStarted: false } }))
    }
  }

  private pauseCompletionSound() {
    this.clearCompletionSoundTimer()
    if (this.completionSoundAudio !== null) {
      this.completionSoundAudio.pause()
    }
    const { timerState } = this.api.get()
    if (timerState.completionSoundStarted) {
      this.api.set((s) => ({ timerState: { ...s.timerState, completionSoundStarted: false } }))
    }
  }

  private resumeCompletionSound(): boolean {
    if (this.completionSoundAudio !== null) {
      this.completionSoundAudio.play().catch((err) => console.warn("[countdown-module]", err))
      this.api.set((s) => ({ timerState: { ...s.timerState, completionSoundStarted: true } }))
      return true
    }
    return false
  }

  private scheduleCompletionSound(durationMs: number) {
    this.clearCompletionSoundTimer()
    const { timerState, config } = this.api.get()
    const soundId = config.behavior.completionSound
    if (timerState.status !== "running" || !soundId || timerState.completionSoundStarted) return

    void getBundledSoundDuration(soundId).then((durationSeconds) => {
      const latest = this.api.get()
      if (
        latest.timerState.status !== "running" ||
        latest.timerState.completionSoundStarted ||
        latest.config.behavior.completionSound !== soundId
      ) return

      const leadMs = Math.max(0, (durationSeconds ?? 0) * 1000 - COMPLETION_SOUND_SAFETY_SECONDS * 1000)
      const currentTimeMs = this.animation?.currentTime ?? 0
      const delayMs = Math.max(0, durationMs - currentTimeMs - leadMs)

      this.completionSoundTimer = setTimeout(() => {
        const current = this.api.get()
        if (
          current.timerState.status !== "running" ||
          current.timerState.completionSoundStarted ||
          current.config.behavior.completionSound !== soundId
        ) {
          this.completionSoundTimer = null
          return
        }
        this.api.set((s) => ({ timerState: { ...s.timerState, completionSoundStarted: true } }))
        this.completionSoundAudio = playBundledSound(soundId)
        this.completionSoundTimer = null
      }, delayMs)
    })
  }

  private postWebhook(event: WebhookEvent, url?: string) {
    if (!url) return
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      keepalive: true,
    }).catch((err) => console.warn("[countdown-module]", err))
  }

  private emitBusEvent(topic: string, payload?: unknown) {
    this.api.get()._bus?.emit(topic, payload)
  }

  emitTick(
    remaining: number,
    status: CountdownState["status"],
    config: CountdownConfig,
    profileBackground: ProfileBackground,
    externalBackdropActive: boolean,
  ) {
    const presentationFlags = getPresentationFlags(config, profileBackground, externalBackdropActive)
    const configJson = JSON.stringify(config)
    const configChanged = configJson !== this.lastEmittedConfigJson
    if (configChanged) {
      this.lastEmittedConfigJson = configJson
    }
    const payload: CountdownTickPayload = {
      remaining,
      status,
      ...(configChanged ? { config } : {}),
      ...presentationFlags,
    }
    emit("countdown:tick", payload).catch((err) => console.warn("[countdown-module]", err))
  }

  private setFinishedState(
    timerState: CountdownState,
    config: CountdownConfig,
    profileBackground: ProfileBackground,
    externalBackdropActive: boolean,
    remainingOnFinish = 0,
  ) {
    this.api.set((s) => ({
      timerState: { ...s.timerState, status: "finished", remainingSeconds: remainingOnFinish },
    }))
    this.emitTick(remainingOnFinish, "finished", config, profileBackground, externalBackdropActive)
    this.emitBusEvent("countdown-module:timer.finished", { remaining: remainingOnFinish, total: config.totalSeconds, countUp: config.countUp })
    this.postWebhook(
      { event: "timer.finished", remaining: remainingOnFinish, total: config.totalSeconds, countUp: config.countUp },
      config.behavior.webhookUrl,
    )

    const state = this.api.get()
    if (config.behavior.hideOnCompletion) {
      if (state.isOverlayActive) {
        state._overlay?.clear()
        this.api.set({ isOverlayActive: false } as Record<string, unknown>)
      } else {
        state._presenter?.clear()
        this.api.set({ isPresenterActive: false } as Record<string, unknown>)
      }
    }
    if (config.actions.autoAdvance.enabled) {
      const action = config.actions.autoAdvance.action
      if (action.type === "queue.next") state._queue?.next()
      else if (action.type === "queue.previous") state._queue?.previous()
      else if (action.type === "player.next-slide") state._player?.nextSlide()
      else if (action.type === "player.play") state._player?.play(action.itemId)
      else if (action.type === "change-scene") state._sceneSwitcher?.(action.sceneId)
      else if (action.type === "play-media") state._player?.play(action.mediaId)
      else if (action.type === "open-overlay") state._overlayOpener?.(action.overlayId)
      else if (action.type === "send-webhook") {
        this.postWebhook(
          { event: "timer.finished", remaining: remainingOnFinish, total: config.totalSeconds, countUp: config.countUp },
          action.payload ?? config.behavior.webhookUrl,
        )
      }
    }
  }

  private handleTickCompletion(remainingOnFinish = 0) {
    const { timerState, config, profileBackground, _isExternalBackdropActive } = this.api.get()
    const externalBackdropActive = _isExternalBackdropActive?.() ?? false
    if (timerState.status !== "running") return
    this.clearCompletionSoundTimer()
    this.setFinishedState(timerState, config, profileBackground, externalBackdropActive, remainingOnFinish)
  }

  private onAnimationUpdate(remaining: number) {
    const store = this.api.get()
    if (store.timerState.status !== "running") {
      this.cancelAnimation()
      return
    }

    const { timerState, config, profileBackground, _isExternalBackdropActive } = store
    const externalBackdropActive = _isExternalBackdropActive?.() ?? false
    const animTime = this.animation?.currentTime ?? 0
    const displaySecond = Math.floor(remaining)

    if (!config.allowNegative) {
      if (config.countUp ? remaining >= config.totalSeconds : remaining <= 0) {
        this.cancelAnimation()
        this.handleTickCompletion()
        return
      }
    }

    if (displaySecond !== this.lastTickSecond) {
      if (this.lastTickSecond === null && animTime < 500) return
      this.lastTickSecond = displaySecond

      let updatedConfig = config
      const newFiredTriggers = [...timerState.firedTriggers]
      const { _queue, _player, _hostFs, _sceneSwitcher, _overlayOpener } = store

      for (const trigger of config.actions.timeTriggers) {
        const shouldFire = trigger.enabled &&
          !newFiredTriggers.includes(trigger.atSeconds) &&
          (config.countUp ? remaining >= trigger.atSeconds : remaining <= trigger.atSeconds)

        if (shouldFire) {
          this.emitBusEvent("countdown-module:timer.trigger", { atSeconds: trigger.atSeconds, triggerType: trigger.type, remaining })
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
            this.postWebhook(
              { event: "timer.trigger", atSeconds: trigger.atSeconds, triggerType: trigger.type, remaining },
              config.behavior.webhookUrl,
            )
          }
          newFiredTriggers.push(trigger.atSeconds)
        }
      }

      this.postWebhook(
        { event: "timer.tick", remaining, total: config.totalSeconds, countUp: config.countUp },
        config.behavior.webhookUrl,
      )
      this.emitBusEvent("countdown-module:timer.tick", { remaining, total: config.totalSeconds, countUp: config.countUp })

      if (updatedConfig !== config) {
        this.api.set((s) => ({
          config: updatedConfig,
          timerState: { ...s.timerState, remainingSeconds: remaining, firedTriggers: newFiredTriggers },
        }))
      } else {
        this.api.set((s) => ({
          timerState: { ...s.timerState, remainingSeconds: remaining, firedTriggers: newFiredTriggers },
        }))
      }

      this.emitTick(remaining, "running", updatedConfig, profileBackground, externalBackdropActive)
    }
  }

  startTimer() {
    const { timerState, config, _presenter, _overlay, isOverlayActive, profileBackground, _isExternalBackdropActive } = this.api.get()
    const externalBackdropActive = _isExternalBackdropActive?.() ?? false
    if (timerState.status === "running") return

    this.cancelAnimation()
    const resuming = timerState.status === "paused"

    let soundResumed = false
    if (resuming) {
      soundResumed = this.resumeCompletionSound()
      if (!soundResumed) this.stopCompletionSound()
    } else {
      this.stopCompletionSound()
    }

    if (config.countUp) {
      const startValue = resuming ? timerState.remainingSeconds : 0
      const durationMs = (config.totalSeconds - startValue) * 1000

      const newState = resuming
        ? { ...timerState, status: "running" as const, pausedAt: null, firedTriggers: [], completionSoundStarted: soundResumed }
        : { status: "running" as const, remainingSeconds: 0, startedAt: null, pausedAt: null, firedTriggers: [], completionSoundStarted: false }

      this.api.set({ timerState: newState } as Record<string, unknown>)

      const targetObj = { value: startValue }
      this.animation = animate(targetObj, {
        value: [startValue, config.totalSeconds],
        duration: durationMs,
        ease: "linear",
        onUpdate: () => { this.onAnimationUpdate(targetObj.value) },
        onComplete: () => {
          this.animation = null
          this.lastTickSecond = null
          this.handleTickCompletion(config.totalSeconds)
        },
      })

      if (isOverlayActive) {
        _overlay?.project(PRESENTER_PANEL_ID, projectionProps(config, newState, profileBackground, externalBackdropActive))
      } else {
        _presenter?.project(PRESENTER_PANEL_ID, projectionProps(config, newState, profileBackground, externalBackdropActive))
        this.api.set({ isPresenterActive: true } as Record<string, unknown>)
      }

      this.emitTick(newState.remainingSeconds, "running", config, profileBackground, externalBackdropActive)
      this.emitBusEvent("countdown-module:timer.started", { remaining: startValue, total: config.totalSeconds, countUp: true, preText: config.preText, postText: config.postText })
      this.postWebhook(
        { event: "timer.started", remaining: startValue, total: config.totalSeconds, countUp: true, preText: config.preText, postText: config.postText },
        config.behavior.webhookUrl,
      )
      if (!soundResumed) this.scheduleCompletionSound(durationMs)
      return
    }

    const remainingSeconds = resuming ? timerState.remainingSeconds : config.totalSeconds
    const endValue = config.allowNegative ? -(config.totalSeconds) : 0
    const durationMs = config.allowNegative
      ? (remainingSeconds + config.totalSeconds) * 1000
      : remainingSeconds * 1000
    const soundDurationMs = remainingSeconds * 1000

    const newState = resuming
      ? { ...timerState, status: "running" as const, pausedAt: null, firedTriggers: [], completionSoundStarted: soundResumed }
      : { status: "running" as const, remainingSeconds: config.totalSeconds, startedAt: null, pausedAt: null, firedTriggers: [], completionSoundStarted: false }

    this.api.set({ timerState: newState } as Record<string, unknown>)

    const targetObj = { value: remainingSeconds }
    this.animation = animate(targetObj, {
      value: [remainingSeconds, endValue],
      duration: durationMs,
      ease: "linear",
      onUpdate: () => { this.onAnimationUpdate(targetObj.value) },
      onComplete: () => {
        this.animation = null
        this.lastTickSecond = null
        if (!config.allowNegative) this.handleTickCompletion()
      },
    })

    if (isOverlayActive) {
      _overlay?.project(PRESENTER_PANEL_ID, projectionProps(config, newState, profileBackground, externalBackdropActive))
    } else {
      _presenter?.project(PRESENTER_PANEL_ID, projectionProps(config, newState, profileBackground, externalBackdropActive))
      this.api.set({ isPresenterActive: true } as Record<string, unknown>)
    }

    this.emitTick(newState.remainingSeconds, "running", config, profileBackground, externalBackdropActive)
    this.emitBusEvent("countdown-module:timer.started", { remaining: remainingSeconds, total: config.totalSeconds, countUp: false, preText: config.preText, postText: config.postText })
    this.postWebhook(
      { event: "timer.started", remaining: remainingSeconds, total: config.totalSeconds, countUp: false, preText: config.preText, postText: config.postText },
      config.behavior.webhookUrl,
    )
    if (!soundResumed) this.scheduleCompletionSound(soundDurationMs)
  }

  pauseTimer() {
    this.animation?.pause()
    this.pauseCompletionSound()
    const { timerState, config, profileBackground, _isExternalBackdropActive } = this.api.get()
    const externalBackdropActive = _isExternalBackdropActive?.() ?? false
    const newState = { ...timerState, status: "paused" as const, pausedAt: Date.now() }
    this.api.set({ timerState: newState } as Record<string, unknown>)
    this.emitTick(newState.remainingSeconds, "paused", config, profileBackground, externalBackdropActive)
    this.emitBusEvent("countdown-module:timer.paused", { remaining: newState.remainingSeconds })
    this.postWebhook({ event: "timer.paused", remaining: newState.remainingSeconds }, config.behavior.webhookUrl)
  }

  resetTimer() {
    this.cancelAnimation()
    this.stopCompletionSound()
    const { config, profileBackground, _isExternalBackdropActive } = this.api.get()
    const externalBackdropActive = _isExternalBackdropActive?.() ?? false
    const newState = {
      status: "idle" as const,
      remainingSeconds: config.totalSeconds,
      startedAt: null,
      pausedAt: null,
      firedTriggers: [],
      completionSoundStarted: false,
    }
    this.api.set({ timerState: newState } as Record<string, unknown>)
    this.emitTick(newState.remainingSeconds, "idle", config, profileBackground, externalBackdropActive)
    this.emitBusEvent("countdown-module:timer.reset", { remaining: config.totalSeconds, total: config.totalSeconds })
    this.postWebhook(
      { event: "timer.reset", remaining: config.totalSeconds, total: config.totalSeconds },
      config.behavior.webhookUrl,
    )
  }
}
