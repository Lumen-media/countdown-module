import { useEffect, useRef, useState } from "react"
import { useEventListener } from "usehooks-ts"
import { HexColorPicker } from "react-colorful"
import { Info, MoveDownLeft, MoveDownRight, MoveUpLeft, MoveUpRight } from "lucide-react"
import { Combobox, HoverCard, Input, Popover, Select, Slider, Switch, ToggleGroup } from "@lumen-media/module-sdk/ui"
import { cn } from "../../../lib/cn.js"
import { useLocalFonts } from "../../../hooks/useLocalFonts.js"
import { t } from "../../../i18n.js"
import { useCountdownStore } from "../../../store.js"
import type { BackgroundConfig, CountdownConfig } from "../../../types.js"

const FONT_WEIGHTS = ["Thin", "Light", "Regular", "Medium", "Semi Bold", "Bold", "Extra Bold", "Black"]
const BG_TYPES = ["solid", "gradient"] as const

type EditableBgType = (typeof BG_TYPES)[number]

function SectionLabel({ children, info }: { children: React.ReactNode; info?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-1.5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {children}
      </p>
      {info}
    </div>
  )
}

function InfoHint({ children }: { children: React.ReactNode }) {
  return (
    <HoverCard>
      <HoverCard.HoverCardTrigger className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground">
        <Info size={13} />
      </HoverCard.HoverCardTrigger>
      <HoverCard.HoverCardContent className="w-64 p-3 text-xs leading-relaxed text-muted-foreground" align="start">
        {children}
      </HoverCard.HoverCardContent>
    </HoverCard>
  )
}

function isValidHex(hex: string) {
  return /^#[0-9a-fA-F]{6}$/.test(hex)
}

function ColorRow({
  label,
  color,
  onChange,
  opacity,
}: {
  label: string
  color: string
  onChange: (c: string) => void
  opacity?: number
}) {
  const [local, setLocal] = useState(color)
  const [hexInput, setHexInput] = useState(color.toUpperCase())

  useEffect(() => {
    setLocal(color)
    setHexInput(color.toUpperCase())
  }, [color])

  function handlePickerChange(c: string) {
    setLocal(c)
    setHexInput(c.toUpperCase())
    onChange(c)
  }

  function handleHexInput(raw: string) {
    const upper = raw.toUpperCase()
    setHexInput(upper)
    const withHash = upper.startsWith("#") ? upper : `#${upper}`
    if (isValidHex(withHash)) {
      setLocal(withHash)
      onChange(withHash)
    }
  }

  function handleHexBlur() {
    const withHash = hexInput.startsWith("#") ? hexInput : `#${hexInput}`
    if (isValidHex(withHash)) {
      setHexInput(withHash.toUpperCase())
    } else {
      setHexInput(local.toUpperCase())
    }
  }

  const pct = opacity !== undefined ? ` ${Math.round(opacity * 100)}%` : ""

  return (
    <div className="flex items-center justify-between rounded-md bg-background px-3 py-2.5">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <Popover>
          <Popover.PopoverTrigger
            className="h-5 w-5 shrink-0 cursor-pointer rounded border border-border/60"
            style={{ background: local }}
          />
          <Popover.PopoverContent className="w-auto p-3" align="start" alignOffset={8}>
            <HexColorPicker color={local} onChange={handlePickerChange} />
          </Popover.PopoverContent>
        </Popover>
        <input
          type="text"
          value={hexInput + pct}
          onChange={(event) => {
            const raw = event.target.value.replace(/\s*\d+%$/, "")
            handleHexInput(raw)
          }}
          onFocus={(event) => {
            setHexInput(event.target.value.replace(/\s*\d+%$/, ""))
          }}
          onBlur={handleHexBlur}
          className="w-12 border-none bg-transparent p-0 text-right font-mono text-xs text-muted-foreground outline-none"
          spellCheck={false}
        />
      </div>
    </div>
  )
}

function FontSizeInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [local, setLocal] = useState(`${value}px`)

  useEffect(() => {
    setLocal(`${value}px`)
  }, [value])

  function handleChange(raw: string) {
    if (!/^\d*(px)?$/i.test(raw)) return
    setLocal(raw)
    const num = parseInt(raw)
    if (!Number.isNaN(num) && num >= 12 && num <= 400) onChange(num)
  }

  function handleBlur() {
    const num = Math.max(12, Math.min(400, parseInt(local) || value))
    setLocal(`${num}px`)
    onChange(num)
  }

  return (
    <Input
      type="text"
      value={local}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={handleBlur}
      onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
      className="w-20 bg-background px-1 text-center dark:bg-background"
    />
  )
}

function SliderRow({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  format = (v: number) => `${Math.round(v)}%`,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  format?: (v: number) => string
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{format(value)}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  )
}

function parseGradient(value: string): { angle: number; color1: string; color2: string } {
  const match = value.match(/linear-gradient\((\d+)deg,\s*(#[0-9a-fA-F]{6}),\s*(#[0-9a-fA-F]{6})\)/)
  if (match) return { angle: parseInt(match[1]), color1: match[2], color2: match[3] }
  return { angle: 90, color1: "#000000", color2: "#ffffff" }
}

function buildGradient(angle: number, color1: string, color2: string): string {
  return `linear-gradient(${angle}deg, ${color1}, ${color2})`
}

function switchBgType(prev: BackgroundConfig, type: EditableBgType): BackgroundConfig {
  if (type === "solid") {
    return { type: "solid", color: prev.type === "solid" ? prev.color : "#000000" }
  }

  return {
    type: "gradient",
    value: prev.type === "gradient" ? prev.value : "linear-gradient(90deg, #000000, #ffffff)",
  }
}

function RotationKnob({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  function getAngle(event: MouseEvent) {
    if (!ref.current) return 0
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    let angle = Math.atan2(event.clientX - cx, -(event.clientY - cy)) * (180 / Math.PI)
    if (angle < 0) angle += 360
    return Math.round(angle)
  }

  useEventListener("mousemove", (event) => {
    if (dragging) onChange(getAngle(event))
  })
  useEventListener("mouseup", () => setDragging(false))

  function handleMouseDown(event: React.MouseEvent) {
    event.preventDefault()
    setDragging(true)
    onChange(getAngle(event.nativeEvent))
  }

  return (
    <div className="flex items-center gap-2">
      <div
        ref={ref}
        onMouseDown={handleMouseDown}
        className="relative h-8 w-8 shrink-0 cursor-grab select-none rounded-full border border-border bg-card"
      >
        <div
          className="pointer-events-none absolute inset-0 flex justify-center pt-1"
          style={{ transform: `rotate(${value}deg)` }}
        >
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        </div>
      </div>
      <span className="w-7 font-mono text-xs text-muted-foreground">{value}°</span>
    </div>
  )
}

function GradientEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { angle, color1, color2 } = parseGradient(value)

  function update(patch: Partial<{ angle: number; color1: string; color2: string }>) {
    const next = { angle, color1, color2, ...patch }
    onChange(buildGradient(next.angle, next.color1, next.color2))
  }

  return (
    <div className="flex flex-col gap-2">
      <ColorRow label={t("appearance.background.color1")} color={color1} onChange={(c) => update({ color1: c })} />
      <ColorRow label={t("appearance.background.color2")} color={color2} onChange={(c) => update({ color2: c })} />
      <div className="flex items-center justify-between rounded-md bg-background px-3 py-2.5">
        <span className="text-sm text-foreground">{t("appearance.background.angle")}</span>
        <RotationKnob value={angle} onChange={(v) => update({ angle: v })} />
      </div>
    </div>
  )
}

export function AppearanceTab() {
  const appearance = useCountdownStore((s) => s.config.appearance)
  const updateAppearance = useCountdownStore((s) => s.updateAppearance)
  const { fonts } = useLocalFonts()
  const bg = appearance.background
  const bgType = bg.type === "profile" ? null : bg.type

  return (
    <div className="flex flex-col gap-5">
      <div>
        <SectionLabel>{t("appearance.section.typography")}</SectionLabel>
        <div className="flex flex-col gap-2">
          <Combobox value={appearance.font} onValueChange={(value) => updateAppearance({ font: value })}>
            <Combobox.ComboboxInput
              placeholder={t("appearance.searchFont")}
              className="bg-background px-1 dark:bg-background"
            />
            <Combobox.ComboboxContent>
              <Combobox.ComboboxList>
                {fonts.map((font) => (
                  <Combobox.ComboboxItem key={font} value={font}>
                    {font}
                  </Combobox.ComboboxItem>
                ))}
                <Combobox.ComboboxEmpty>{t("appearance.noFontsFound")}</Combobox.ComboboxEmpty>
              </Combobox.ComboboxList>
            </Combobox.ComboboxContent>
          </Combobox>

          <div className="flex gap-2">
            <Select value={appearance.fontWeight} onValueChange={(value) => updateAppearance({ fontWeight: value })}>
              <Select.SelectTrigger className="flex-1 bg-background dark:bg-background">
                <Select.SelectValue>{appearance.fontWeight}</Select.SelectValue>
              </Select.SelectTrigger>
              <Select.SelectContent>
                {FONT_WEIGHTS.map((weight) => (
                  <Select.SelectItem key={weight} value={weight}>
                    {weight}
                  </Select.SelectItem>
                ))}
              </Select.SelectContent>
            </Select>

            <FontSizeInput value={appearance.fontSize} onChange={(value) => updateAppearance({ fontSize: value })} />
          </div>
        </div>
      </div>

      <div>
        <SectionLabel>{t("appearance.section.colors")}</SectionLabel>
        <div className="flex flex-col gap-2">
          <ColorRow
            label={t("appearance.color.timerText")}
            color={appearance.timerColor}
            onChange={(color) => updateAppearance({ timerColor: color })}
          />

          <ColorRow
            label={t("appearance.color.prePostText")}
            color={appearance.prePostColor}
            onChange={(color) => updateAppearance({ prePostColor: color })}
            opacity={appearance.prePostOpacity}
          />

          <SliderRow
            label={t("appearance.color.prePostOpacity")}
            value={appearance.prePostOpacity * 100}
            onChange={(value) => updateAppearance({ prePostOpacity: value / 100 })}
          />
        </div>
      </div>

      <div>
        <SectionLabel>{t("appearance.section.backgroundLayer")}</SectionLabel>
        <div className="flex flex-col gap-3">
          <ToggleGroup
            value={bgType ? [bgType] : []}
            onValueChange={(values) => {
              const value = values[values.length - 1] as EditableBgType | undefined
              if (value) updateAppearance({ background: switchBgType(bg, value) })
            }}
            className="w-full rounded-lg bg-background p-1"
          >
            {BG_TYPES.map((bgLayerType) => (
              <ToggleGroup.ToggleGroupItem
                key={bgLayerType}
                value={bgLayerType}
                className={cn("flex-1 text-xs capitalize aria-pressed:bg-card", bgType === bgLayerType && "bg-card shadow-sm")}
              >
                {t(`appearance.background.${bgLayerType}`)}
              </ToggleGroup.ToggleGroupItem>
            ))}
          </ToggleGroup>

          {bg.type === "solid" && (
            <ColorRow
              label={t("appearance.background.color")}
              color={bg.color}
              onChange={(color) => updateAppearance({ background: { ...bg, color } })}
            />
          )}

          {bg.type === "gradient" && (
            <GradientEditor value={bg.value} onChange={(value) => updateAppearance({ background: { ...bg, value } })} />
          )}
        </div>
      </div>

      <div>
        <SectionLabel>{t("appearance.section.visualEffects")}</SectionLabel>
        <div className="flex flex-col gap-2">
          <SliderRow
            label={t("appearance.effect.textShadowGlow")}
            value={appearance.textShadowGlow * 100}
            onChange={(value) => updateAppearance({ textShadowGlow: value / 100 })}
          />
        </div>
      </div>

      <div>
        <SectionLabel>{t("appearance.section.animations")}</SectionLabel>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">{t("appearance.animation.digitTransition")}</span>
            <ToggleGroup
              value={[appearance.digitAnimation]}
              onValueChange={(values) => {
                const value = values[values.length - 1] as CountdownConfig["appearance"]["digitAnimation"] | undefined
                if (value) updateAppearance({ digitAnimation: value })
              }}
              className="w-full rounded-lg bg-background p-1"
            >
              {(["none", "flip", "blur"] as const).map((anim) => (
                <ToggleGroup.ToggleGroupItem
                  key={anim}
                  value={anim}
                  className={cn(
                    "flex-1 text-xs capitalize aria-pressed:bg-card",
                    appearance.digitAnimation === anim && "bg-card shadow-sm",
                  )}
                >
                  {t(`appearance.animation.${anim}`)}
                </ToggleGroup.ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="flex items-center justify-between rounded-md bg-background px-3 py-2.5">
            <span className="text-sm text-foreground">{t("appearance.animation.pulseEffect")}</span>
            <Switch checked={appearance.pulseEffect} onCheckedChange={(checked) => updateAppearance({ pulseEffect: checked })} />
          </div>

          <div className="flex items-center justify-between rounded-md bg-background px-3 py-2.5">
            <span className="text-sm text-foreground">{t("appearance.animation.showProgressBar")}</span>
            <Switch checked={appearance.showProgressBar} onCheckedChange={(checked) => updateAppearance({ showProgressBar: checked })} />
          </div>

          {appearance.showProgressBar && (
            <ColorRow
              label={t("appearance.animation.progressBarColor")}
              color={appearance.progressBarColor}
              onChange={(color) => updateAppearance({ progressBarColor: color })}
            />
          )}
        </div>
      </div>

      <div>
        <SectionLabel
          info={(
            <InfoHint>{t("appearance.displayMode.info")}</InfoHint>
          )}
        >
          {t("appearance.section.displayMode")}
        </SectionLabel>
        <div className="flex flex-col gap-2">
          <ToggleGroup
            value={[appearance.overlayMode]}
            onValueChange={(values) => {
              const value = values[values.length - 1] as CountdownConfig["appearance"]["overlayMode"] | undefined
              if (value) updateAppearance({ overlayMode: value })
            }}
            className="w-full rounded-lg bg-background p-1"
          >
            <ToggleGroup.ToggleGroupItem
              value="fullscreen"
              className={cn("flex-1 text-xs aria-pressed:bg-card", appearance.overlayMode === "fullscreen" && "bg-card shadow-sm")}
            >
              {t("appearance.displayMode.fullscreen")}
            </ToggleGroup.ToggleGroupItem>
            <ToggleGroup.ToggleGroupItem
              value="corner"
              className={cn("flex-1 text-xs aria-pressed:bg-card", appearance.overlayMode === "corner" && "bg-card shadow-sm")}
            >
              {t("appearance.displayMode.corner")}
            </ToggleGroup.ToggleGroupItem>
          </ToggleGroup>

          {appearance.overlayMode === "corner" && (
            <ToggleGroup
              value={[appearance.cornerPosition]}
              onValueChange={(values) => {
                const value = values[values.length - 1] as CountdownConfig["appearance"]["cornerPosition"] | undefined
                if (value) updateAppearance({ cornerPosition: value })
              }}
              className="grid w-full grid-cols-2 gap-1 rounded-lg bg-background p-1"
            >
              {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((position) => (
                <ToggleGroup.ToggleGroupItem
                  key={position}
                  value={position}
                  className={cn(
                    "rounded-md py-1.5 text-xs aria-pressed:bg-card",
                    appearance.cornerPosition === position && "bg-card shadow-sm",
                    position === "top-left" || position === "bottom-left" ? "justify-start pl-3" : "justify-end pr-3",
                  )}
                >
                  {position === "top-left" && <><MoveUpLeft size={13} /> {t("appearance.displayMode.topLeft")}</>}
                  {position === "top-right" && <>{t("appearance.displayMode.topRight")} <MoveUpRight size={13} /></>}
                  {position === "bottom-left" && <><MoveDownLeft size={13} /> {t("appearance.displayMode.bottomLeft")}</>}
                  {position === "bottom-right" && <>{t("appearance.displayMode.bottomRight")} <MoveDownRight size={13} /></>}
                </ToggleGroup.ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        </div>
      </div>
    </div>
  )
}
