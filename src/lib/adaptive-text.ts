import { useEffect, useMemo, useRef, useState, type RefObject } from "react"
import { mix, rgba, saturate } from "polished"
import type { BackgroundConfig, CountdownConfig } from "../types.js"

type ProfileBackground = { src: string; thumb?: string; type: "theme" | "image" | "video" } | null

type AdaptiveTextOptions = {
  appearance: CountdownConfig["appearance"]
  profileBackground?: ProfileBackground
  renderConfiguredBackground?: boolean
  imageRef?: RefObject<HTMLImageElement | null>
  videoRef?: RefObject<HTMLVideoElement | null>
}

type AdaptiveTextResult = {
  timerColor: string
  prePostColor: string
  timerShadow?: string
  subShadow?: string
  sampledColor: string | null
}

const SAMPLE_WIDTH = 24
const SAMPLE_HEIGHT = 16

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

function getCropRect(width: number, height: number, appearance: CountdownConfig["appearance"]) {
  if (appearance.overlayMode !== "corner") {
    return {
      x: width * 0.455,
      y: height * 0.455,
      w: width * 0.09,
      h: height * 0.09,
    }
  }

  const w = width * 0.08
  const h = height * 0.08
  const marginX = width * 0.07
  const marginY = height * 0.07

  if (appearance.cornerPosition === "top-left") return { x: marginX, y: marginY, w, h }
  if (appearance.cornerPosition === "top-right") return { x: width - w - marginX, y: marginY, w, h }
  if (appearance.cornerPosition === "bottom-left") return { x: marginX, y: height - h - marginY, w, h }
  return { x: width - w - marginX, y: height - h - marginY, w, h }
}

function sampleElementColor(
  element: HTMLImageElement | HTMLVideoElement,
  appearance: CountdownConfig["appearance"],
  naturalWidth: number,
  naturalHeight: number,
) {
  const canvas = document.createElement("canvas")
  canvas.width = SAMPLE_WIDTH
  canvas.height = SAMPLE_HEIGHT
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) return null

  const crop = getCropRect(naturalWidth, naturalHeight, appearance)

  try {
    context.drawImage(element, crop.x, crop.y, crop.w, crop.h, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT)
  } catch {
    return null
  }

  const { data } = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT)
  let r = 0
  let g = 0
  let b = 0
  let count = 0

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3]
    if (alpha === 0) continue
    r += data[index]
    g += data[index + 1]
    b += data[index + 2]
    count += 1
  }

  if (count === 0) return null

  const toHex = (value: number) => Math.round(value / count).toString(16).padStart(2, "0")
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function bgConfigKey(bg: BackgroundConfig): string {
  if (bg.type === "profile") return "profile"
  if (bg.type === "solid") return `solid:${bg.color}`
  if (bg.type === "gradient") return `gradient:${bg.value}`
  if (bg.type === "image") return `image:${bg.value}:${bg.opacity}`
  if (bg.type === "video") return `video:${bg.value}:${bg.opacity}`
  return ""
}

function buildTextShadow(textColor: string, glowColor: string, glowStrength: number, compact = false) {
  const outlineColor = textColor.toUpperCase() === "#FFFFFF"
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

export function useAdaptiveTextAppearance({
  appearance,
  profileBackground = null,
  renderConfiguredBackground = true,
  imageRef,
  videoRef,
}: AdaptiveTextOptions): AdaptiveTextResult {
  const [sampledMediaColor, setSampledMediaColor] = useState<string | null>(null)
  const background = appearance.background
  const mediaToken = `${background.type === "image" || background.type === "video" ? background.value : ""}|${profileBackground?.src ?? ""}|${profileBackground?.type ?? ""}|${appearance.overlayMode}|${appearance.cornerPosition}`

  const backgroundKey = bgConfigKey(background)
  const staticSample = useMemo(() => {
    if (!renderConfiguredBackground && background.type !== "profile") return null
    if (background.type === "profile" && profileBackground?.type === "theme") return null
    return resolveStaticSample(background)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backgroundKey, profileBackground, renderConfiguredBackground])

  const appearanceRef = useRef(appearance)
  appearanceRef.current = appearance

  useEffect(() => {
    let interval: number | null = null
    const cleanups: Array<() => void> = []
    let raf: number | null = null

    setSampledMediaColor(null)

    if (!renderConfiguredBackground && background.type !== "profile") {
      return () => {
        if (interval !== null) window.clearInterval(interval)
        if (raf !== null) window.cancelAnimationFrame(raf)
        cleanups.forEach((cleanup) => cleanup())
      }
    }

    const sampleImage = () => {
      const image = imageRef?.current
      if (!image || !image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) return false
      setSampledMediaColor(sampleElementColor(image, appearanceRef.current, image.naturalWidth, image.naturalHeight))
      return true
    }

    const sampleVideo = () => {
      const video = videoRef?.current
      if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) return false
      setSampledMediaColor(sampleElementColor(video, appearanceRef.current, video.videoWidth, video.videoHeight))
      return true
    }

    let attempts = 0
    const tickUntilReady = () => {
      const sampled = sampleImage() || sampleVideo()
      attempts += 1
      if (!sampled && attempts < 30) {
        raf = window.requestAnimationFrame(tickUntilReady)
      }
    }
    tickUntilReady()

    const image = imageRef?.current
    if (image) {
      const handleLoad = () => {
        window.requestAnimationFrame(() => {
          sampleImage()
        })
      }
      image.addEventListener("load", handleLoad)
      cleanups.push(() => image.removeEventListener("load", handleLoad))
    }

    const video = videoRef?.current
    if (video) {
      const handleReady = () => {
        window.requestAnimationFrame(() => {
          sampleVideo()
        })
      }
      video.addEventListener("loadeddata", handleReady)
      video.addEventListener("canplay", handleReady)
      cleanups.push(() => video.removeEventListener("loadeddata", handleReady))
      cleanups.push(() => video.removeEventListener("canplay", handleReady))
      interval = window.setInterval(() => {
        sampleVideo()
      }, 350)
    }

    return () => {
      if (interval !== null) window.clearInterval(interval)
      if (raf !== null) window.cancelAnimationFrame(raf)
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [imageRef, mediaToken, renderConfiguredBackground, videoRef])

  const sampledColor = sampledMediaColor ?? staticSample
  const timerColor = appearance.timerColor
  const prePostColor = appearance.prePostColor
  const glowStrength = appearance.textShadowGlow ?? 0
  const resolvedGlowColor = useMemo(() => {
    return sampledColor ? saturate(0.18, mix(0.55, timerColor, sampledColor)) : timerColor
  }, [sampledColor, timerColor])

  return useMemo(() => ({
    timerColor,
    prePostColor,
    timerShadow: glowStrength > 0
      ? buildTextShadow(timerColor, resolvedGlowColor, glowStrength, false)
      : `0 1px 3px ${timerColor.toUpperCase() === "#FFFFFF" ? rgba("#000000", 0.72) : rgba("#FFFFFF", 0.28)}`,
    subShadow: glowStrength > 0
      ? buildTextShadow(prePostColor, resolvedGlowColor, glowStrength * 0.72, true)
      : `0 1px 2px ${prePostColor.toUpperCase() === "#FFFFFF" ? rgba("#000000", 0.58) : rgba("#FFFFFF", 0.22)}`,
    sampledColor,
  }), [timerColor, prePostColor, glowStrength, resolvedGlowColor, sampledColor])
}
