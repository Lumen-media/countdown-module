import { readableColor } from "polished"

export function contrastColor(bg: string): string {
  try { return readableColor(bg) } catch { return "#ffffff" }
}
