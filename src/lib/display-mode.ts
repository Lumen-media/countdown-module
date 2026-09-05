import type { CSSProperties } from "react"
import type { CountdownConfig, CountdownStatus } from "../types.js"

type ProfileBackground = {
  src: string
  thumb?: string
  type: "theme" | "image" | "video"
} | null

export type CountdownTickPayload = {
  remaining: number
  status: CountdownStatus
  config?: CountdownConfig
  cornerActive: boolean
  renderConfiguredBackground: boolean
  instanceId?: string
}

export function hasConfiguredBackdrop(
  config: CountdownConfig,
  profileBackground: ProfileBackground
): boolean {
  const bg = config.appearance.background

  if (bg.type === "profile") return Boolean(profileBackground?.src)
  if (bg.type === "image" || bg.type === "video") return Boolean(bg.value)

  return false
}

export function isCornerActive(
  config: CountdownConfig,
  profileBackground: ProfileBackground,
  externalBackdropActive = false
): boolean {
  return config.appearance.overlayMode === "corner" && externalBackdropActive
}

export function displayAnchor(
  position: CountdownConfig["appearance"]["cornerPosition"],
  cornerActive: boolean
): CSSProperties {
  if (!cornerActive) {
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    }
  }

  if (position === "top-left") {
    return {
      top: 24,
      left: 24,
      transform: "translate(0, 0)",
    }
  }

  if (position === "top-right") {
    return {
      top: 24,
      left: "calc(100% - 24px)",
      transform: "translate(-100%, 0)",
    }
  }

  if (position === "bottom-left") {
    return {
      top: "calc(100% - 24px)",
      left: 24,
      transform: "translate(0, -100%)",
    }
  }

  return {
    top: "calc(100% - 24px)",
    left: "calc(100% - 24px)",
    transform: "translate(-100%, -100%)",
  }
}
