export { cn } from "cn"

// "1h 5m" / "12m", for course and section totals.
export function formatDuration(totalSeconds: number) {
  const minutes = Math.round(totalSeconds / 60)
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`
}

// "04:12", for a single lesson.
export const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
