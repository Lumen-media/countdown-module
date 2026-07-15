import { useEffect, useState } from "react"
import {
  Bell,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsRight,
  Copy,
  Globe,
  Image,
  Layers,
  Monitor,
  Music,
  Plus,
  SkipBack,
  SkipForward,
  Type,
  X,
} from "lucide-react"
import { Combobox, Label, Select, Switch } from "@lumen-media/module-sdk/ui"
import { useCountdownStore } from "../../../store.js"
import type { CountdownSoundSelection, EndAction, TimeTrigger } from "../../../types.js"
import {
  createBundledSoundSelection,
  createDefaultBundledSoundSelection,
  SOUND_OPTIONS,
} from "../../../lib/sounds.js"
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

type ActionOption = {
  value: EndAction["type"] | "warning-chime" | "change-text"
  label: string
  icon: React.ReactNode
}
type LibraryMediaOption = { id: string; name: string; type: string; path: string }
type SoundComboboxOption =
  | { key: string; label: string; source: "bundled"; value: string }
  | { key: string; label: string; source: "library"; value: string; path: string }

function getActionOptions(): ActionOption[] {
  return [
    { value: "change-text", label: t("actions.option.changeText"), icon: <Type size={13} /> },
    { value: "warning-chime", label: t("actions.option.playSound"), icon: <Bell size={13} /> },
    {
      value: "queue.next",
      label: t("actions.option.nextInQueue"),
      icon: <ChevronsRight size={13} />,
    },
    {
      value: "queue.previous",
      label: t("actions.option.previousInQueue"),
      icon: <SkipBack size={13} />,
    },
    {
      value: "player.next-slide",
      label: t("actions.option.nextSlide"),
      icon: <ChevronRight size={13} />,
    },
    {
      value: "player.play",
      label: t("actions.option.playSpecificMedia"),
      icon: <Image size={13} />,
    },
    { value: "change-scene", label: t("actions.option.changeScene"), icon: <Monitor size={13} /> },
    { value: "open-overlay", label: t("actions.option.openOverlay"), icon: <Layers size={13} /> },
    { value: "send-webhook", label: t("actions.option.sendWebhook"), icon: <Globe size={13} /> },
  ]
}

function AudioCombobox({
  value,
  onSelect,
}: {
  value: CountdownSoundSelection | null
  onSelect: (sound: CountdownSoundSelection | null) => void
}) {
  const _library = useCountdownStore((s) => s._library)
  const [libraryItems, setLibraryItems] = useState<LibraryMediaOption[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)

  const bundledItems: SoundComboboxOption[] = SOUND_OPTIONS.map((sound) => ({
    key: `bundled:${sound.id}`,
    label: sound.label,
    source: "bundled",
    value: sound.id,
  }))

  useEffect(() => {
    if (value?.source === "bundled") {
      const selected = SOUND_OPTIONS.find((sound) => sound.id === value.value)
      setQuery(selected?.label ?? "")
      return
    }

    if (value?.source === "library") {
      setQuery(value.label)
      return
    }

    setQuery("")
  }, [value])

  useEffect(() => {
    if (!_library) {
      setLibraryItems([])
      return
    }

    let cancelled = false
    setLoading(true)

    void _library
      .list("audio")
      .then((nextItems) => {
        if (!cancelled) {
          setLibraryItems(nextItems as LibraryMediaOption[])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [_library])

  const libraryOptions: SoundComboboxOption[] = libraryItems.map((item) => ({
    key: `library:${item.id}`,
    label: item.name,
    source: "library",
    value: item.id,
    path: item.path,
  }))

  const normalizedQuery = query.trim().toLowerCase()
  const bundledFiltered = normalizedQuery
    ? bundledItems.filter((item) => item.label.toLowerCase().includes(normalizedQuery))
    : bundledItems
  const libraryFiltered = normalizedQuery
    ? libraryOptions.filter((item) => item.label.toLowerCase().includes(normalizedQuery))
    : libraryOptions

  return (
    <div className="flex flex-col gap-2">
      <Combobox
        value=""
        onValueChange={(selectedKey) => {
          const selected = [...bundledItems, ...libraryOptions].find(
            (item) => item.key === selectedKey
          )
          if (!selected) return

          if (selected.source === "bundled") {
            onSelect(createBundledSoundSelection(selected.value))
          } else {
            onSelect({
              source: "library",
              value: selected.value,
              label: selected.label,
              path: selected.path,
            })
          }
        }}
      >
        <Combobox.ComboboxInput
          placeholder={t("actions.selectAudio")}
          className="bg-card px-1 text-xs dark:bg-card"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Combobox.ComboboxContent>
          <Combobox.ComboboxList>
            {bundledFiltered.length > 0 && (
              <>
                <div className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("actions.bundledAudio")}
                </div>
                {bundledFiltered.map((item) => (
                  <Combobox.ComboboxItem key={item.key} value={item.key}>
                    <span className="truncate">{item.label}</span>
                  </Combobox.ComboboxItem>
                ))}
              </>
            )}
            {libraryFiltered.length > 0 && (
              <>
                <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("actions.libraryAudio")}
                </div>
                {libraryFiltered.map((item) => (
                  <Combobox.ComboboxItem key={item.key} value={item.key}>
                    <span className="truncate">{item.label}</span>
                  </Combobox.ComboboxItem>
                ))}
              </>
            )}
            {bundledFiltered.length === 0 && libraryFiltered.length === 0 && (
              <div className="flex w-full justify-center py-2 text-center text-sm text-muted-foreground">
                {loading ? t("actions.loadingMedia") : t("actions.noAudioSourcesFound")}
              </div>
            )}
          </Combobox.ComboboxList>
        </Combobox.ComboboxContent>
      </Combobox>

      {value && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="self-end text-xs text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0"
        >
          {t("actions.clearSelectedSound")}
        </button>
      )}
    </div>
  )
}
function LibraryMediaCombobox({
  mediaType,
  placeholder,
  emptyLabel,
  onSelect,
}: {
  mediaType?: "audio" | "video" | "image"
  placeholder: string
  emptyLabel: string
  onSelect: (item: LibraryMediaOption) => void
}) {
  const _library = useCountdownStore((s) => s._library)
  const [items, setItems] = useState<LibraryMediaOption[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!_library) {
      setItems([])
      return
    }

    let cancelled = false
    setLoading(true)

    void _library
      .list(mediaType)
      .then((nextItems) => {
        if (!cancelled) {
          setItems(nextItems as LibraryMediaOption[])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [_library, mediaType])

  const normalizedQuery = query.trim().toLowerCase()
  const filteredItems = normalizedQuery
    ? items.filter((item) => `${item.name} ${item.type}`.toLowerCase().includes(normalizedQuery))
    : items

  return (
    <Combobox
      value=""
      onValueChange={(value) => {
        const item = items.find((entry) => entry.id === value)
        if (item) {
          onSelect(item)
          setQuery("")
        }
      }}
    >
      <Combobox.ComboboxInput
        placeholder={placeholder}
        className="bg-card px-1 text-xs dark:bg-card"
        disabled={!_library}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <Combobox.ComboboxContent>
        <Combobox.ComboboxList>
          {filteredItems.map((item) => (
            <Combobox.ComboboxItem key={item.id} value={item.id}>
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate flex-1">{item.name}</span>
                {!mediaType && (
                  <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {item.type}
                  </span>
                )}
              </div>
            </Combobox.ComboboxItem>
          ))}
          {filteredItems.length === 0 && (
            <div className="flex w-full justify-center py-2 text-center text-sm text-muted-foreground">
              {loading ? t("actions.loadingMedia") : emptyLabel}
            </div>
          )}
        </Combobox.ComboboxList>
      </Combobox.ComboboxContent>
    </Combobox>
  )
}

function EndActionSelector() {
  const actions = useCountdownStore((s) => s.config.actions)
  const setConfig = useCountdownStore((s) => s.setConfig)
  const { autoAdvance } = actions
  const action = autoAdvance.action
  const endActionOptions = getActionOptions().filter(
    (option) => option.value !== "warning-chime" && option.value !== "change-text"
  ) as { value: EndAction["type"]; label: string; icon: React.ReactNode }[]

  function updateAction(patch: EndAction) {
    setConfig({ actions: { ...actions, autoAdvance: { ...autoAdvance, action: patch } } })
  }

  function handleTypeChange(type: EndAction["type"]) {
    if (type === "player.play") {
      updateAction({ type: "player.play", itemId: "", itemTitle: "" })
    } else if (type === "change-scene") {
      updateAction({ type: "change-scene", sceneId: "", sceneName: "" })
    } else if (type === "open-overlay") {
      updateAction({ type: "open-overlay", overlayId: "", overlayName: "" })
    } else if (type === "send-webhook") {
      updateAction({ type: "send-webhook", payload: undefined })
    } else {
      updateAction({ type } as EndAction)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Select
        value={action.type}
        onValueChange={(value) => handleTypeChange(value as EndAction["type"])}
      >
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
            <LibraryMediaCombobox
              placeholder={t("actions.searchMedia")}
              emptyLabel={t("actions.noMediaFound")}
              onSelect={(item) =>
                updateAction({ type: "player.play", itemId: item.id, itemTitle: item.name })
              }
            />
          )}
        </div>
      )}

      {action.type === "change-scene" && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={t("actions.chooseScene")}
            value={
              (action as { type: "change-scene"; sceneId: string; sceneName: string }).sceneName
            }
            onChange={(event) =>
              updateAction({
                type: "change-scene",
                sceneId: event.target.value,
                sceneName: event.target.value,
              })
            }
            className="flex-1 bg-card rounded-md px-2 py-1.5 text-xs border-none outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
      )}

      {action.type === "open-overlay" && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={t("actions.chooseOverlay")}
            value={
              (action as { type: "open-overlay"; overlayId: string; overlayName: string })
                .overlayName
            }
            onChange={(event) =>
              updateAction({
                type: "open-overlay",
                overlayId: event.target.value,
                overlayName: event.target.value,
              })
            }
            className="flex-1 bg-card rounded-md px-2 py-1.5 text-xs border-none outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
      )}

      {action.type === "send-webhook" && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={t("actions.webhookPayload")}
            value={(action as { type: "send-webhook"; payload?: string }).payload ?? ""}
            onChange={(event) =>
              updateAction({ type: "send-webhook", payload: event.target.value || undefined })
            }
            className="flex-1 bg-card rounded-md px-2 py-1.5 text-xs border-none outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
      )}
    </div>
  )
}

function TriggerCard({
  trigger,
  index,
  total,
}: {
  trigger: TimeTrigger
  index: number
  total: number
}) {
  const actions = useCountdownStore((s) => s.config.actions)
  const setConfig = useCountdownStore((s) => s.setConfig)
  const actionOptions = getActionOptions()
  const currentOption = actionOptions.find((option) => option.value === trigger.type)
  function replaceTrigger(next: TimeTrigger) {
    const updated = actions.timeTriggers.map((item, itemIndex) =>
      itemIndex === index ? next : item
    )
    setConfig({ actions: { ...actions, timeTriggers: updated as TimeTrigger[] } })
  }

  function updateTrigger(patch: Partial<TimeTrigger>) {
    replaceTrigger({ ...trigger, ...patch } as TimeTrigger)
  }

  function changeType(newType: TimeTrigger["type"]) {
    const base = { enabled: trigger.enabled, atSeconds: trigger.atSeconds }
    if (newType === "warning-chime")
      replaceTrigger({ ...base, type: "warning-chime", sound: defaultTriggerSound() })
    else if (newType === "change-text")
      replaceTrigger({ ...base, type: "change-text", preText: "", postText: "" })
    else if (newType === "player.play")
      replaceTrigger({ ...base, type: "player.play", itemId: "", itemTitle: "" })
    else replaceTrigger({ ...base, type: newType } as TimeTrigger)
  }

  function duplicateTrigger() {
    const duplicate: TimeTrigger = { ...trigger } as TimeTrigger
    if (duplicate.type === "warning-chime")
      duplicate.sound = duplicate.sound ? { ...duplicate.sound } : null
    const updated = [...actions.timeTriggers]
    updated.splice(index + 1, 0, duplicate)
    setConfig({ actions: { ...actions, timeTriggers: updated } })
  }

  function moveTrigger(direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= total) return
    const updated = [...actions.timeTriggers]
    const [removed] = updated.splice(index, 1)
    updated.splice(newIndex, 0, removed)
    setConfig({ actions: { ...actions, timeTriggers: updated } })
  }

  function removeTrigger() {
    const updated = actions.timeTriggers.filter((_, itemIndex) => itemIndex !== index)
    setConfig({ actions: { ...actions, timeTriggers: updated } })
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
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => moveTrigger(-1)}
            disabled={index === 0}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer p-0.5"
            title={t("actions.moveUp")}
          >
            <ChevronUp size={13} />
          </button>
          <button
            type="button"
            onClick={() => moveTrigger(1)}
            disabled={index === total - 1}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer p-0.5"
            title={t("actions.moveDown")}
          >
            <ChevronDown size={13} />
          </button>
          <button
            type="button"
            onClick={duplicateTrigger}
            className="text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0.5"
            title={t("actions.duplicateTrigger")}
          >
            <Copy size={12} />
          </button>
          <button
            type="button"
            onClick={removeTrigger}
            className="text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0.5"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <Select
        value={trigger.type}
        onValueChange={(value) => changeType(value as TimeTrigger["type"])}
      >
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
          className="w-14 text-right bg-transparent border-none outline-none text-sm font-mono font-bold tabular-nums text-primary"
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

          <AudioCombobox value={trigger.sound} onSelect={(sound) => updateTrigger({ sound })} />
        </div>
      )}

      {trigger.type === "player.play" &&
        (trigger.itemTitle ? (
          <div className="flex items-center gap-2 bg-card rounded-md px-3 py-2 min-w-0">
            <Image size={12} className="text-muted-foreground shrink-0" />
            <span className="text-xs text-foreground truncate flex-1">{trigger.itemTitle}</span>
            <button
              type="button"
              onClick={() =>
                replaceTrigger({ ...trigger, type: "player.play", itemId: "", itemTitle: "" })
              }
              className="text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0 shrink-0"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <LibraryMediaCombobox
            placeholder={t("actions.searchMedia")}
            emptyLabel={t("actions.noMediaFound")}
            onSelect={(item) =>
              replaceTrigger({
                ...trigger,
                type: "player.play",
                itemId: item.id,
                itemTitle: item.name,
              } as TimeTrigger)
            }
          />
        ))}
    </div>
  )
}

export function ActionsTab() {
  const totalSeconds = useCountdownStore((s) => s.config.totalSeconds)
  const actions = useCountdownStore((s) => s.config.actions)
  const behavior = useCountdownStore((s) => s.config.behavior)
  const allowNegative = useCountdownStore((s) => s.config.allowNegative)
  const countUp = useCountdownStore((s) => s.config.countUp)
  const setConfig = useCountdownStore((s) => s.setConfig)
  const { autoAdvance } = actions
  const { hideOnCompletion, completionSound } = behavior
  const soundPlaceholder = t("actions.selectAudio")

  function addTrigger() {
    const triggerAtSeconds = Math.max(0, Math.min(totalSeconds, Math.floor(totalSeconds / 2)))
    const newTrigger: TimeTrigger = {
      enabled: true,
      atSeconds: triggerAtSeconds,
      type: "change-text",
      preText: "",
      postText: "",
    }
    setConfig({ actions: { ...actions, timeTriggers: [...actions.timeTriggers, newTrigger] } })
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <SectionLabel>{t("actions.section.endAction")}</SectionLabel>
        <div className="bg-background rounded-xl px-3 pt-3 pb-2.5 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-primary/20">
              <SkipForward size={13} className="text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground flex-1">
              {t("actions.autoAdvance.title")}
            </span>
            <Switch
              checked={autoAdvance.enabled}
              onCheckedChange={(checked) =>
                setConfig({
                  actions: { ...actions, autoAdvance: { ...autoAdvance, enabled: checked } },
                })
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
          {actions.timeTriggers.map((trigger, index) => (
            <TriggerCard
              key={index}
              trigger={trigger}
              index={index}
              total={actions.timeTriggers.length}
            />
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
              <span className="text-sm font-semibold text-foreground">
                {t("actions.completionSound")}
              </span>
              <Music size={13} className="text-muted-foreground" />
            </div>
            {SOUND_OPTIONS.length > 0 ? (
              <Select
                value={completionSound || NO_SOUND_VALUE}
                onValueChange={(value) =>
                  setConfig({
                    behavior: {
                      ...behavior,
                      completionSound: value === NO_SOUND_VALUE ? "" : value,
                    },
                  })
                }
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
              onCheckedChange={(checked) =>
                setConfig({ behavior: { ...behavior, hideOnCompletion: checked } })
              }
              className="shrink-0"
            />
          </Label>
          <Label className="flex w-full items-center justify-between text-sm text-foreground">
            {t("actions.allowNegative")}
            <Switch
              checked={allowNegative}
              onCheckedChange={(checked) => {
                setConfig({ allowNegative: checked, countUp: checked ? false : countUp })
              }}
              className="shrink-0"
            />
          </Label>
          <Label className="flex w-full items-center justify-between text-sm text-foreground">
            {t("actions.countUp")}
            <Switch
              checked={countUp}
              onCheckedChange={(checked) => {
                setConfig({ countUp: checked, allowNegative: checked ? false : allowNegative })
                useCountdownStore.getState().setTotalSeconds(totalSeconds)
              }}
              className="shrink-0"
            />
          </Label>
        </div>
      </div>
    </div>
  )
}
