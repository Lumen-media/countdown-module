import { Clock3 } from "lucide-react"
import { formatTime, useCountdownStore } from "../store.js"

type CountdownHeaderStatusProps = {
  onOpen: () => void
}

export function CountdownHeaderStatus({ onOpen }: CountdownHeaderStatusProps) {
  const { status, remainingSeconds } = useCountdownStore((s) => s.timerState)

  if (status !== "running") return null

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex max-w-full items-center gap-1.5 text-left text-foreground transition-opacity hover:opacity-80"
      title="Open countdown"
      aria-label="Open countdown"
    >
      <Clock3 size={12} className="shrink-0 text-primary" />
      <span className="truncate font-semibold tabular-nums">{formatTime(remainingSeconds)}</span>
    </button>
  )
}
