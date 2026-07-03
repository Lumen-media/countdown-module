export function formatTime(seconds: number): string {
  const abs = Math.abs(seconds)
  const mins = Math.floor(abs / 60)
  const secs = Math.floor(abs % 60)
  const sign = seconds < 0 ? "-" : ""
  return `${sign}${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
}
