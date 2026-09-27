import Image from "next/image"
import Link from "next/link"
import { Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ProgressBar } from "@/components/progress"
import { getProgress, getStats, type Course } from "@/lib/courses"

export function CourseCard({ course, showProgress }: { course: Course; showProgress?: boolean }) {
  const { lessons, duration } = getStats(course)
  const { owned, percent } = getProgress(course)

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition hover:border-primary/40 hover:shadow-[0_8px_40px_-12px_var(--glow)]"
    >
      <div className="relative aspect-video overflow-hidden border-b">
        <Image
          src={course.thumbnail}
          alt=""
          fill
          sizes="(min-width: 1024px) 352px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        {course.badge && <Badge className="absolute top-3 left-3">{course.badge}</Badge>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-heading text-lg font-medium tracking-tight">{course.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{course.tagline}</p>
        <div className="mt-auto flex items-center gap-4 pt-3 text-xs text-muted-foreground">
          <span>{lessons} lessons</span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" /> {duration}
          </span>
          <span>{course.level}</span>
        </div>
        {showProgress && owned && (
          <div className="pt-2">
            <ProgressBar value={percent} />
            <p className="mt-2 text-xs text-muted-foreground">{percent === 100 ? "Completed" : `${percent}% complete`}</p>
          </div>
        )}
      </div>
    </Link>
  )
}
