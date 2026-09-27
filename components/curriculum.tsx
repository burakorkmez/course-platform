import Link from "next/link"
import { Check, Lock, PlayCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { canWatch, getLessons, getProgress, type Course } from "@/lib/courses"

// Sections with their lessons. `current` highlights the lesson being watched (player sidebar).
export function Curriculum({ course, current }: { course: Course; current?: string }) {
  const lessons = getLessons(course)
  const { owned, completed } = getProgress(course)

  return (
    <div className="flex flex-col gap-6">
      {course.sections.map((section) => {
        const items = lessons.filter((l) => l.section === section.title)
        const done = items.filter((l) => l.index < completed).length
        return (
          <div key={section.title}>
            <div className="mb-2 flex items-center justify-between px-3 text-sm">
              <h3 className="font-medium">{section.title}</h3>
              <span className="text-xs text-muted-foreground">{owned ? `${done} / ${items.length}` : `${items.length} lessons`}</span>
            </div>
            <ul className="flex flex-col gap-0.5">
              {items.map((l) => {
                const locked = !canWatch(course, l)
                const isCurrent = l.slug === current
                const row = (
                  <>
                    {owned && l.index < completed && !isCurrent ? (
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    ) : locked ? (
                      <Lock className="size-5 shrink-0 p-0.5 text-muted-foreground" />
                    ) : (
                      <PlayCircle className={cn("size-5 shrink-0", isCurrent ? "text-primary" : "text-muted-foreground")} />
                    )}
                    <span className="min-w-0 flex-1 truncate">
                      {l.index + 1}. {l.title}
                    </span>
                    {!owned && l.free && <span className="text-xs text-primary">Free</span>}
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">{l.duration}</span>
                  </>
                )
                const rowClass = cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                  isCurrent && "bg-primary/10 text-foreground",
                  locked && "text-muted-foreground"
                )
                return (
                  <li key={l.slug}>
                    {locked ? (
                      <div className={rowClass}>{row}</div>
                    ) : (
                      <Link
                        href={`/courses/${course.slug}/${l.slug}`}
                        aria-current={isCurrent ? "page" : undefined}
                        className={cn(rowClass, !isCurrent && "transition-colors hover:bg-accent")}
                      >
                        {row}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
