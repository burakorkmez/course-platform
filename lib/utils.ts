export { cn } from "cn"

// "1h 5m" / "12m", for course and section totals.
export function formatDuration(totalSeconds: number) {
  const minutes = Math.round(totalSeconds / 60)
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`
}

// "04:12", for a single lesson.
export const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

const units = [["year", 31_536_000], ["month", 2_592_000], ["week", 604_800], ["day", 86_400], ["hour", 3_600], ["minute", 60]] as const
const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

// "just now", "5 minutes ago", "yesterday", for comments.
export function timeAgo(date: Date, now = Date.now()) {
  const seconds = (now - date.getTime()) / 1000
  const [unit, size] = units.find(([, size]) => seconds >= size) ?? []
  return unit ? relative.format(-Math.floor(seconds / size), unit) : "just now"
}
