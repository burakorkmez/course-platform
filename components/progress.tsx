import { cn } from "@/lib/utils"

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)}>
      <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
    </div>
  )
}

export function ProgressRing({ value, className }: { value: number; className?: string }) {
  return (
    <div role="img" aria-label={`${value}% complete`} className={cn("relative size-24 shrink-0", className)}>
      <svg viewBox="0 0 36 36" className="size-full -rotate-90 overflow-visible">
        <circle cx="18" cy="18" r="16" fill="none" strokeWidth="3" className="stroke-muted" />
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${value} 100`}
          className="stroke-primary drop-shadow-[0_0_4px_var(--glow)]"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-heading text-xl font-semibold">{value}%</span>
    </div>
  )
}
