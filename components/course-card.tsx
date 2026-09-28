import Link from "next/link"
import { Image } from "@imagekit/next"
import { Clock, PlayCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProgressBar } from "@/components/progress"
import type { Course } from "@/lib/catalog"

// Fills its (relative, sized) parent: the ImageKit image, or a soft glow with a play icon when there's none yet.
export function CourseThumbnail({ src, sizes, preload, className }: { src: string | null; sizes: string; preload?: boolean; className?: string }) {
  return src ? (
    <Image src={src} alt="" fill sizes={sizes} preload={preload} className={cn("object-cover", className)} />
  ) : (
    <div aria-hidden className={cn("absolute inset-0 grid place-items-center bg-[radial-gradient(ellipse_at_center,rgb(91_108_255/0.25),transparent_70%)]", className)}>
      <PlayCircle className="size-10 text-primary/60" strokeWidth={1.25} />
    </div>
  )
}

export function CourseCard({ course, showProgress }: { course: Course; showProgress?: boolean }) {
  const { lessons, duration } = course.stats
  const { owned, percent } = course.progress

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition hover:border-primary/40 hover:shadow-[0_8px_40px_-12px_var(--glow)]"
    >
      <div className="relative aspect-video overflow-hidden border-b">
        <CourseThumbnail
          src={course.thumbnail}
          sizes="(min-width: 1024px) 352px, (min-width: 640px) 50vw, 100vw"
          className="transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-heading text-lg font-medium tracking-tight">{course.title}</h3>
        {course.tagline && <p className="line-clamp-2 text-sm text-muted-foreground">{course.tagline}</p>}
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
