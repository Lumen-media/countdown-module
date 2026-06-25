import { Bell, ChevronRight, ChevronsRight, ExternalLink, Image, Music, Plus, SkipBack, SkipForward, Type, X } from "lucide-react"
import { Label, Select, Switch } from "@lumen-media/module-sdk/ui"
import { useCountdownStore } from "../../../store.js"
import type { CountdownSoundSelection, EndAction, TimeTrigger } from "../../../types.js"
import { createBundledSoundSelection, createDefaultBundledSoundSelection, SOUND_OPTIONS } from "../../../lib/sounds.js"
import { t } from "../../../i18n.js"

const NO_SOUND_VALUE = ""

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
      {children}
    </p>
  )
}

function formatAtSeconds(seconds: number) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0")
  const s = String(seconds % 60).padStart(2, "0")
  return `${m}:${s}`
}

function defaultTriggerSound() {
  return createDefaultBundledSoundSelection()
}

function isLibrarySound(sound: CountdownSoundSelection | null): sound is CountdownSoundSelection & { source: "library"; path: string } {
  return Boolean(sound && sound.source === "library" && sound.path)
}

type ActionOption = { value: EndAction["type"] | "warning-chime" | "change-text"; label: string; icon: React.ReactNode }

function getActionOptions(): ActionOption[] {
  return [
    { value: "change-text", label: t("actions.option.changeText"), icon: <Type size={13} /> },
    { value: "warning-chime", label: t("actions.option.playSound"), icon: <Bell size={13} /> },
    { value: "queue.next", label: t("actions.option.nextInQueue"), icon: <ChevronsRight size={13} /> },
    { value: "queue.previous", label: t("actions.option.previousInQueue"), icon: <SkipBack size={13} /> },
    { value: "player.next-slide", label: t("actions.option.nextSlide"), icon: <ChevronRight size={13} /> },
    { value: "player.play", label: t("actions.option.playSpecificMedia"), icon: <Image size={13} /> },
  ]
}

function EndActionSelector() {
  const { config, setConfig, _openMediaPicker } = useCountdownStore()
  const { autoAdvance } = config.actions
  const action = autoAdvance.action
  const endActionOptions = getActionOptions().filter(
    (option) => option.value !== "warning-chime" && option.value !== "change-text"
  ) as { value: EndAction["type"]; label: string; icon: React.ReactNode }[]

  function updateAction(patch: EndAction) {
    setConfig({ actions: { ...config.actions, autoAdvance: { ...autoAdvance, action: patch } } })
  }

  function handleTypeChange(type: EndAction["type"]) {
    if (type === "player.play") {
      updateAction({ type: "player.play", itemId: "", itemTitle: "" })
    } else {
      updateAction({ type } as EndAction)
    }
  }

  function handlePickMedia() {
    if (!_openMediaPicker) return
    _openMediaPicker((item) => {
      updateAction({ type: "player.play", itemId: item.id, itemTitle: item.title })
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <Select value={action.type} onValueChange={(value) => handleTypeChange(value as EndAction["type"])}>
        <Select.SelectTrigger className="w-full bg-background dark:bg-background">
          <Select.SelectValue>
            <span className="flex items-center gap-1.5">
              {endActionOptions.find((option) => option.value === action.type)?.icon}
              {endActionOptions.find((option) => option.value === action.type)?.label}
            </span>
          </Select.SelectValue>
        </Select.SelectTrigger>
        <Select.SelectContent>
          {endActionOptions.map((option) => (
            <Select.SelectItem key={option.value} value={option.value}>
              <span className="flex items-center gap-1.5">
                {option.icon}
                {option.label}
              </span>
            </Select.SelectItem>
          ))}
        </Select.SelectContent>
      </Select>

      {action.type === "player.play" && (
        <div className="flex items-center gap-2">
          {action.itemTitle ? (
            <div className="flex-1 flex items-center gap-2 bg-background rounded-md px-3 py-2 min-w-0">
              <Image size={12} className="text-muted-foreground shrink-0" />
              <span className="text-xs text-foreground truncate flex-1">{action.itemTitle}</span>
              <button
                type="button"
                onClick={() => updateAction({ type: "player.play", itemId: "", itemTitle: "" })}
                className="text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0 shrink-0"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handlePickMedia}
              className="flex-1 flex items-center justify-center gap-1.5 bg-background rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-foreground/30 cursor-pointer transition-colors"
            >
              <ExternalLink size={12} />
              {t("actions.chooseMedia")}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function TriggerCard({ trigger, index }: { trigger: TimeTrigger; index: number }) {
  const { config, setConfig, _openMediaPicker, _library } = useCountdownStore()
  const actionOptions = getActionOptions()
  const currentOption = actionOptions.find((option) => option.value === trigger.type)
  const soundPlaceholder = t("actions.selectAudio")

  function replaceTrigger(next: TimeTrigger) {
    const updated = config.actions.timeTriggers.map((item, itemIndex) => itemIndex === index ? next : item)
    setConfig({ actions: { ...config.actions, timeTriggers: updated as TimeTrigger[] } })
  }

  function updateTrigger(patch: Partial<TimeTrigger>) {
    replaceTrigger({ ...trigger, ...patch } as TimeTrigger)
  }

  function changeType(newType: TimeTrigger["type"]) {
    const base = { enabled: trigger.enabled, atSeconds: trigger.atSeconds }
    if (newType === "warning-chime") replaceTrigger({ ...base, type: "warning-chime", sound: defaultTriggerSound() })
    else if (newType === "change-text") replaceTrigger({ ...base, type: "change-text", preText: "", postText: "" })
    else if (newType === "player.play") replaceTrigger({ ...base, type: "player.play", itemId: "", itemTitle: "" })
    else replaceTrigger({ ...base, type: newType } as TimeTrigger)
  }

  function removeTrigger() {
    const updated = config.actions.timeTriggers.filter((_, itemIndex) => itemIndex !== index)
    setConfig({ actions: { ...config.actions, timeTriggers: updated } })
  }

  function handlePickMedia() {
    if (!_openMediaPicker) return
    _openMediaPicker((item) => {
      replaceTrigger({ ...trigger, type: "player.play", itemId: item.id, itemTitle: item.title } as TimeTrigger)
    })
  }

  function handlePickLibraryAudio() {
    if (!_openMediaPicker || !_library) return

    _openMediaPicker(async (item) => {
      if (item.type !== "audio") return
      const media = await _library.get(item.id)
      if (!media?.path) return

      replaceTrigger({
        ...trigger,
        type: "warning-chime",
        sound: {
          source: "library",
          value: item.id,
          label: item.title,
          path: media.path,
        },
      })
    })
  }

  return (
    <div className="bg-background rounded-xl px-3 pt-3 pb-2.5 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Switch
          checked={trigger.enabled}
          onCheckedChange={(checked) => updateTrigger({ enabled: checked })}
          className="shrink-0"
        />
        <div className="flex items-center gap-1.5 flex-1 min-w-0 text-xs text-muted-foreground">
          {currentOption?.icon}
          <span className="truncate">{currentOption?.label}</span>
        </div>
        <button
          type="button"
          onClick={removeTrigger}
          className="text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0 shrink-0"
        >
          <X size={13} />
        </button>
      </div>

      <Select value={trigger.type} onValueChange={(value) => changeType(value as TimeTrigger["type"])}>
        <Select.SelectTrigger className="w-full bg-card dark:bg-card text-xs">
          <Select.SelectValue>
            <span className="flex items-center gap-1.5">
              {currentOption?.icon}
              {currentOption?.label}
            </span>
          </Select.SelectValue>
        </Select.SelectTrigger>
        <Select.SelectContent>
          {actionOptions.map((option) => (
            <Select.SelectItem key={option.value} value={option.value}>
              <span className="flex items-center gap-1.5">
                {option.icon}
                {option.label}
              </span>
            </Select.SelectItem>
          ))}
        </Select.SelectContent>
      </Select>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{t("actions.at")}</span>
        <input
          type="text"
          value={formatAtSeconds(trigger.atSeconds)}
          onChange={(event) => {
            const parts = event.target.value.split(":")
            if (parts.length === 2) {
              const minutes = parseInt(parts[0]) || 0
              const seconds = Math.min(59, parseInt(parts[1]) || 0)
              updateTrigger({ atSeconds: minutes * 60 + seconds })
            }
          }}
          className="w-14 text-right bg-transparent border-none outline-none text-sm font-mono font-bold tabular-nums"
          style={{ color: "var(--primary)" }}
        />
      </div>

      {trigger.type === "change-text" && (
        <div className="flex flex-col gap-1.5">
          <input
            type="text"
            placeholder={t("actions.preText")}
            value={trigger.preText}
            onChange={(event) => updateTrigger({ preText: event.target.value })}
            className="w-full bg-card rounded-md px-2 py-1.5 text-xs border-none outline-none text-foreground placeholder:text-muted-foreground"
          />
          <input
            type="text"
            placeholder={t("actions.postText")}
            value={trigger.postText}
            onChange={(event) => updateTrigger({ postText: event.target.value })}
            className="w-full bg-card rounded-md px-2 py-1.5 text-xs border-none outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
      )}

      {trigger.type === "warning-chime" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t("actions.sound")}</span>
            <Music size={13} className="text-muted-foreground" />
          </div>

          {SOUND_OPTIONS.length > 0 ? (
            <Select
              value={trigger.sound?.source === "bundled" ? trigger.sound.value : undefined}
              onValueChange={(value) => updateTrigger({ sound: createBundledSoundSelection(value) })}
            >
              <Select.SelectTrigger className="w-full bg-card dark:bg-card text-xs">
                <Select.SelectValue placeholder={soundPlaceholder} />
              </Select.SelectTrigger>
              <Select.SelectContent>
                {SOUND_OPTIONS.map((sound) => (
                  <Select.SelectItem key={sound.id} value={sound.id}>
                    {sound.label}
                  </Select.SelectItem>
                ))}
              </Select.SelectContent>
            </Select>
          ) : (
            <div className="rounded-md bg-card px-2 py-1.5 text-xs text-muted-foreground">
              {t("actions.noBundledSounds")}
            </div>
          )}

          {trigger.sound?.source === "bundled" && (
            <button
              type="button"
              onClick={() => updateTrigger({ sound: null })}
              className="self-end text-xs text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0"
            >
              {t("actions.clearBundledSound")}
            </button>
          )}

          {isLibrarySound(trigger.sound) && (
            <div className="flex items-center gap-2 bg-card rounded-md px-3 py-2 min-w-0">
              <Music size={12} className="text-muted-foreground shrink-0" />
              <span className="text-xs text-foreground truncate flex-1">{trigger.sound.label}</span>
              <button
                type="button"
                onClick={() => updateTrigger({ sound: null })}
                className="text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0 shrink-0"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handlePickLibraryAudio}
            className="flex items-center justify-center gap-1.5 bg-card rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-foreground/30 cursor-pointer transition-colors w-full"
          >
            <ExternalLink size={12} />
            {t("actions.chooseLibraryAudio")}
          </button>
        </div>
      )}

      {trigger.type === "player.play" && (
        trigger.itemTitle ? (
          <div className="flex items-center gap-2 bg-card rounded-md px-3 py-2 min-w-0">
            <Image size={12} className="text-muted-foreground shrink-0" />
            <span className="text-xs text-foreground truncate flex-1">{trigger.itemTitle}</span>
            <button
              type="button"
              onClick={() => replaceTrigger({ ...trigger, type: "player.play", itemId: "", itemTitle: "" })}
              className="text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0 shrink-0"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handlePickMedia}
            className="flex items-center justify-center gap-1.5 bg-card rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-foreground/30 cursor-pointer transition-colors w-full"
          >
            <ExternalLink size={12} />
            {t("actions.chooseMedia")}
          </button>
        )
      )}
    </div>
  )
}

export function ActionsTab() {
  const { config, setConfig } = useCountdownStore()
  const { autoAdvance } = config.actions
  const { hideOnCompletion, completionSound } = config.behavior
  const soundPlaceholder = t("actions.selectAudio")

  function addTrigger() {
    const newTrigger: TimeTrigger = { enabled: true, atSeconds: 60, type: "change-text", preText: "", postText: "" }
    setConfig({ actions: { ...config.actions, timeTriggers: [...config.actions.timeTriggers, newTrigger] } })
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <SectionLabel>{t("actions.section.endAction")}</SectionLabel>
        <div className="bg-background rounded-xl px-3 pt-3 pb-2.5 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "color-mix(in srgb, var(--primary) 20%, transparent)" }}
            >
              <SkipForward size={13} style={{ color: "var(--primary)" }} />
            </div>
            <span className="text-sm font-semibold text-foreground flex-1">{t("actions.autoAdvance.title")}</span>
            <Switch
              checked={autoAdvance.enabled}
              onCheckedChange={(checked) =>
                setConfig({ actions: { ...config.actions, autoAdvance: { ...autoAdvance, enabled: checked } } })
              }
              className="shrink-0"
            />
          </div>
          <p className="text-xs text-muted-foreground leading-snug">
            {t("actions.autoAdvance.description")}
          </p>
          {autoAdvance.enabled && <EndActionSelector />}
        </div>
      </div>

      <div>
        <SectionLabel>{t("actions.section.timeTriggers")}</SectionLabel>
        <div className="flex flex-col gap-2">
          {config.actions.timeTriggers.map((trigger, index) => (
            <TriggerCard key={index} trigger={trigger} index={index} />
          ))}
          <button
            type="button"
            onClick={() => addTrigger()}
            className="border border-dashed border-border rounded-xl py-2.5 text-xs text-muted-foreground cursor-pointer flex items-center justify-center gap-1.5 hover:text-foreground hover:border-foreground/30 transition-colors bg-transparent w-full"
          >
            <Plus size={12} />
            {t("actions.addTrigger")}
          </button>
        </div>
      </div>

      <div>
        <SectionLabel>{t("actions.section.behavior")}</SectionLabel>
        <div className="space-y-3">
          <div className="bg-background rounded-xl px-3 pt-3 pb-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-foreground">{t("actions.completionSound")}</span>
              <Music size={13} className="text-muted-foreground" />
            </div>
            {SOUND_OPTIONS.length > 0 ? (
              <Select
                value={completionSound || NO_SOUND_VALUE}
                onValueChange={(value) => setConfig({ behavior: { ...config.behavior, completionSound: value === NO_SOUND_VALUE ? "" : value } })}
              >
                <Select.SelectTrigger className="w-full bg-card dark:bg-card text-xs">
                  <Select.SelectValue placeholder={soundPlaceholder} />
                </Select.SelectTrigger>
                <Select.SelectContent>
                  <Select.SelectItem value={NO_SOUND_VALUE}>
                    {t("actions.noAudio")}
                  </Select.SelectItem>
                  {SOUND_OPTIONS.map((sound) => (
                    <Select.SelectItem key={sound.id} value={sound.id}>
                      {sound.label}
                    </Select.SelectItem>
                  ))}
                </Select.SelectContent>
              </Select>
            ) : (
              <div className="rounded-md bg-card px-2 py-1.5 text-xs text-muted-foreground">
                {t("actions.noBundledSounds")}
              </div>
            )}
          </div>

          <Label className="flex w-full items-center justify-between text-sm text-foreground">
            {t("actions.hideOnCompletion")}
            <Switch
              checked={hideOnCompletion}
              onCheckedChange={(checked) => setConfig({ behavior: { ...config.behavior, hideOnCompletion: checked } })}
              className="shrink-0"
            />
          </Label>
          <Label className="flex w-full items-center justify-between text-sm text-foreground">
            {t("actions.allowNegative")}
            <Switch
              checked={config.allowNegative}
              onCheckedChange={(checked) => setConfig({ allowNegative: checked })}
              className="shrink-0"
            />
          </Label>
        </div>
      </div>
    </div>
  )
}
