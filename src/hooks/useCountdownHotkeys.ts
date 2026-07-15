import type { RefObject } from "react"
import { useEventListener } from "usehooks-ts"
import { useCountdownStore } from "../store.js"
import type { HotkeyAction } from "../types.js"

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  )
}

export function useCountdownHotkeys(targetRef: RefObject<HTMLElement | null>) {
  useEventListener(
    "keydown",
    (event) => {
      if (isEditableTarget(event.target)) return

      const hotkeys = useCountdownStore.getState().config.hotkeys
      for (const [action, stored] of Object.entries(hotkeys)) {
        const parts = stored.split("+")
        const key = parts.pop()
        if (!key) continue

        const hasCtrl = parts.includes("Ctrl")
        const hasShift = parts.includes("Shift")
        const match =
          event.ctrlKey === hasCtrl &&
          event.shiftKey === hasShift &&
          (event.code === key || event.key === key)

        if (match) {
          event.preventDefault()
          event.stopPropagation()
          useCountdownStore.getState().handleHotkey(action as HotkeyAction)
          break
        }
      }
    },
    targetRef as RefObject<HTMLElement>
  )
}
