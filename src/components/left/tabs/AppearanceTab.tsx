import { useEffect, useState } from "react"
import { HexColorPicker } from "react-colorful"
import { Combobox, Input, Popover, Select, Slider, ToggleGroup } from "@lumen-media/module-sdk/ui"
import { cn } from "../../../lib/cn.js"
import { useLocalFonts } from "../../../hooks/useLocalFonts.js"
import { useCountdownStore } from "../../../store.js"
import type { BackgroundConfig } from "../../../types.js"

const FONT_WEIGHTS = ["Thin", "Light", "Regular", "Medium", "Semi Bold", "Bold", "Extra Bold", "Black"]

const BG_TYPES = ["solid", "gradient", "image", "video"] as const
type EditableBgType = (typeof BG_TYPES)[number]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
      {children}
    </p>
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
    <div className="flex items-center justify-between bg-background rounded-md px-3 py-2.5">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <Popover>
          <Popover.PopoverTrigger
            className="w-5 h-5 rounded shrink-0 border border-border/60 cursor-pointer"
            style={{ background: local }}
          />
          <Popover.PopoverContent className="p-3 w-auto" align="start" alignOffset={8}>
            <HexColorPicker color={local} onChange={handlePickerChange} />
          </Popover.PopoverContent>
        </Popover>
        <input
          type="text"
          value={hexInput + pct}
          onChange={(e) => {
            const raw = e.target.value.replace(/\s*\d+%$/, "")
            handleHexInput(raw)
          }}
          onFocus={(e) => {
            setHexInput(e.target.value.replace(/\s*\d+%$/, ""))
          }}
          onBlur={handleHexBlur}
          className="w-12 bg-transparent border-none outline-none text-xs font-mono text-muted-foreground text-right p-0"
          spellCheck={false}
        />
      </div>
    </div>
  )
}

function FontSizeInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [local, setLocal] = useState(`${value}px`)
  useEffect(() => { setLocal(`${value}px`) }, [value])

  function handleChange(raw: string) {
    if (!/^\d*(px)?$/i.test(raw)) return
    setLocal(raw)
    const num = parseInt(raw)
    if (!isNaN(num) && num >= 12 && num <= 400) onChange(num)
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
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      className="w-20 px-1 bg-background dark:bg-background text-center"
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
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  )
}

function switchBgType(prev: BackgroundConfig, type: EditableBgType): BackgroundConfig {
  if (type === "solid") {
    return { type: "solid", color: prev.type === "solid" ? prev.color : "#000000" }
  }
  if (type === "gradient") {
    return { type: "gradient", value: prev.type === "gradient" ? prev.value : "linear-gradient(to right, #000000, #ffffff)" }
  }
  const val = prev.type === "image" || prev.type === "video" ? prev.value : ""
  const op = prev.type === "image" || prev.type === "video" ? prev.opacity : 0.5
  return { type, value: val, opacity: op }
}

export function AppearanceTab() {
  const { config, updateAppearance } = useCountdownStore()
  const { fonts } = useLocalFonts()
  const { appearance } = config
  const bg = appearance.background
  const bgType = bg.type === "profile" ? null : bg.type

  return (
    <div className="flex flex-col gap-5">
      <div>
        <SectionLabel>Typography</SectionLabel>
        <div className="flex flex-col gap-2">
          <Combobox value={appearance.font} onValueChange={(v) => updateAppearance({ font: v })}>
            <Combobox.ComboboxInput
              placeholder="Search font…"
              className="bg-background px-1 dark:bg-background"
            />
            <Combobox.ComboboxContent>
              <Combobox.ComboboxList>
                {fonts.map((f) => (
                  <Combobox.ComboboxItem key={f} value={f}>{f}</Combobox.ComboboxItem>
                ))}
                <Combobox.ComboboxEmpty>No fonts found</Combobox.ComboboxEmpty>
              </Combobox.ComboboxList>
            </Combobox.ComboboxContent>
          </Combobox>

          <div className="flex gap-2">
            <Select value={appearance.fontWeight} onValueChange={(v) => updateAppearance({ fontWeight: v })}>
              <Select.SelectTrigger className="flex-1 bg-background dark:bg-background">
                <Select.SelectValue>{appearance.fontWeight}</Select.SelectValue>
              </Select.SelectTrigger>
              <Select.SelectContent>
                {FONT_WEIGHTS.map((w) => (
                  <Select.SelectItem key={w} value={w}>{w}</Select.SelectItem>
                ))}
              </Select.SelectContent>
            </Select>

            <FontSizeInput
              value={appearance.fontSize}
              onChange={(v) => updateAppearance({ fontSize: v })}
            />
          </div>
        </div>
      </div>

      <div>
        <SectionLabel>Colors</SectionLabel>
        <div className="flex flex-col gap-2">
          <ColorRow
            label="Timer Text"
            color={appearance.timerColor}
            onChange={(c) => updateAppearance({ timerColor: c })}
          />
          <ColorRow
            label="Pre / Post Text"
            color={appearance.prePostColor}
            onChange={(c) => updateAppearance({ prePostColor: c })}
            opacity={appearance.prePostOpacity}
          />
          <SliderRow
            label="Pre / Post Opacity"
            value={appearance.prePostOpacity * 100}
            onChange={(v) => updateAppearance({ prePostOpacity: v / 100 })}
          />
        </div>
      </div>

      {bg.type !== "profile" && (
        <div>
          <SectionLabel>Background Layer</SectionLabel>
          <div className="flex flex-col gap-3">
            <ToggleGroup
              value={bgType ? [bgType] : []}
              onValueChange={(vals) => {
                const v = vals[vals.length - 1] as EditableBgType | undefined
                if (v) updateAppearance({ background: switchBgType(bg, v) })
              }}
              className="w-full bg-background rounded-lg p-1"
            >
              {BG_TYPES.map((t) => (
                <ToggleGroup.ToggleGroupItem
                  key={t}
                  value={t}
                  className={cn("flex-1 text-xs capitalize data-[state=on]:bg-card data-[state=on]:shadow-sm")}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </ToggleGroup.ToggleGroupItem>
              ))}
            </ToggleGroup>

            {bg.type === "solid" && (
              <ColorRow
                label="Color"
                color={bg.color}
                onChange={(c) => updateAppearance({ background: { ...bg, color: c } })}
              />
            )}

            {bg.type === "gradient" && (
              <Input
                value={bg.value}
                onChange={(e) => updateAppearance({ background: { ...bg, value: e.target.value } })}
                placeholder="linear-gradient(to right, #000000, #ffffff)"
                className="bg-background text-xs"
              />
            )}

            {(bg.type === "image" || bg.type === "video") && (
              <SliderRow
                label="Opacity Overlay"
                value={bg.opacity * 100}
                onChange={(v) => updateAppearance({ background: { ...bg, opacity: v / 100 } })}
              />
            )}
          </div>
        </div>
      )}

      <div>
        <SectionLabel>Visual Effects</SectionLabel>
        <SliderRow
          label="Text Shadow / Glow"
          value={appearance.textShadowGlow * 100}
          onChange={(v) => updateAppearance({ textShadowGlow: v / 100 })}
        />
      </div>
    </div>
  )
}
