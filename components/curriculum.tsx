import Link from "next/link"
import { Check, Lock, PlayCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Course } from "@/lib/catalog"

// Sections with their lessons. `current` highlights the lesson being watched (player sidebar).
export function Curriculum({ course, current }: { course: Course; current?: string }) {
  const { owned } = course.progress

  return (
    <div className="flex flex-col gap-6">
      {course.sections.map((section, i) => {
        const done = section.lessons.filter((l) => l.done).length
        return (
          <div key={i}>
            <div className="mb-2 flex items-center justify-between px-3 text-sm">
              <h3 className="font-medium">{section.title}</h3>
              <span className="text-xs text-muted-foreground">{owned ? `${done} / ${section.lessons.length}` : `${section.lessons.length} lessons`}</span>
            </div>
            <ul className="flex flex-col gap-0.5">
              {section.lessons.map((l) => {
                const isCurrent = l.slug === current
                const row = (
                  <>
                    {l.done && !isCurrent ? (
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    ) : l.locked ? (
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
                const rowClass = cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm", isCurrent && "bg-primary/10 text-foreground", l.locked && "text-muted-foreground")
                return (
                  <li key={l.slug}>
                    {l.locked ? (
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
