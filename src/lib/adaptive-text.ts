import { useMemo } from "react"
import { mix, rgba, saturate } from "polished"
import type { BackgroundConfig } from "../types.js"

type AdaptiveTextOptions = {
  appearance: {
    timerColor: string
    prePostColor: string
    textShadowGlow?: number
    background: BackgroundConfig
  }
}

type AdaptiveTextResult = {
  timerColor: string
  prePostColor: string
  timerShadow?: string
  subShadow?: string
  sampledColor: string | null
}

function averageHexColors(colors: string[]) {
  if (colors.length === 0) return null
  return colors.slice(1).reduce((acc, color, index) => mix(1 / (index + 2), color, acc), colors[0])
}

function sampleGradientColor(value: string) {
  const colors = value.match(/#[0-9a-fA-F]{6}/g) ?? []
  return averageHexColors(colors)
}

function resolveStaticSample(background: BackgroundConfig) {
  if (background.type === "solid") return background.color
  if (background.type === "gradient") return sampleGradientColor(background.value)
  return null
}

function buildTextShadow(
  textColor: string,
  glowColor: string,
  glowStrength: number,
  compact = false
) {
  const outlineColor =
    textColor.toUpperCase() === "#FFFFFF"
      ? rgba("#000000", compact ? 0.62 : 0.72)
      : rgba("#FFFFFF", compact ? 0.22 : 0.28)
  const nearBlur = compact ? 6 : 10
  const farBlur = compact ? 14 : 26
  const nearOpacity = compact ? 0.18 + glowStrength * 0.18 : 0.22 + glowStrength * 0.24
  const farOpacity = compact ? 0.08 + glowStrength * 0.1 : 0.1 + glowStrength * 0.14

  return [
    `0 1px 3px ${outlineColor}`,
    `0 0 ${Math.round(nearBlur + glowStrength * (compact ? 12 : 18))}px ${rgba(glowColor, nearOpacity)}`,
    `0 0 ${Math.round(farBlur + glowStrength * (compact ? 18 : 24))}px ${rgba(glowColor, farOpacity)}`,
  ].join(", ")
}

export function useAdaptiveTextAppearance({ appearance }: AdaptiveTextOptions): AdaptiveTextResult {
  const sampledColor = resolveStaticSample(appearance.background)
  const timerColor = appearance.timerColor
  const prePostColor = appearance.prePostColor
  const glowStrength = appearance.textShadowGlow ?? 0
  const resolvedGlowColor = sampledColor
    ? saturate(0.18, mix(0.55, timerColor, sampledColor))
    : timerColor

  return useMemo(
    () => ({
      timerColor,
      prePostColor,
      timerShadow:
        glowStrength > 0
          ? buildTextShadow(timerColor, resolvedGlowColor, glowStrength, false)
          : `0 1px 3px ${timerColor.toUpperCase() === "#FFFFFF" ? rgba("#000000", 0.72) : rgba("#FFFFFF", 0.28)}`,
      subShadow:
        glowStrength > 0
          ? buildTextShadow(prePostColor, resolvedGlowColor, glowStrength * 0.72, true)
          : `0 1px 2px ${prePostColor.toUpperCase() === "#FFFFFF" ? rgba("#000000", 0.58) : rgba("#FFFFFF", 0.22)}`,
      sampledColor,
    }),
    [timerColor, prePostColor, glowStrength, resolvedGlowColor, sampledColor]
  )
}
