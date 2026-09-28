import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { CourseCard, CourseThumbnail } from "@/components/course-card"
import { ProgressBar } from "@/components/progress"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { getCourses, resumeLesson } from "@/lib/catalog"

export const metadata: Metadata = { title: "Courses — Lumen" }

export default async function CoursesPage() {
  const courses = await getCourses()
  const inProgress = courses.find((c) => c.progress.owned && c.progress.percent < 100)
  const next = inProgress && resumeLesson(inProgress)

  return (
    <div className="relative isolate flex flex-1 flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgb(91_108_255/0.18),transparent)]"
      />
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-12 pb-24 sm:px-6">
        <p className="text-sm font-medium text-primary">Courses</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">Learn by building real apps</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Every course is one complete project, recorded start to finish, with the source code for each lesson.
        </p>

        {inProgress && next && (
          <section className="mt-10 grid overflow-hidden rounded-2xl border bg-card sm:grid-cols-[20rem_1fr]">
            <div className="relative aspect-video sm:aspect-auto">
              <CourseThumbnail src={inProgress.thumbnail} sizes="(min-width: 640px) 320px, 100vw" />
            </div>
            <div className="flex flex-col gap-3 p-6">
              <p className="text-sm font-medium text-primary">Continue learning</p>
              <h2 className="font-heading text-xl font-semibold tracking-tight">{inProgress.title}</h2>
              <p className="text-sm text-muted-foreground">
                Up next: {next.index + 1}. {next.title} · {next.duration}
              </p>
              <div className="flex items-center gap-3">
                <ProgressBar value={inProgress.progress.percent} className="flex-1" />
                <span className="text-xs text-muted-foreground">{inProgress.progress.percent}%</span>
              </div>
              <Link href={`/courses/${inProgress.slug}/${next.slug}`} className={cn(buttonVariants({ size: "lg" }), "mt-2 w-fit")}>
                Resume lesson <ArrowRight data-icon="inline-end" />
              </Link>
            </div>
          </section>
        )}

        <h2 className="mt-16 mb-6 font-heading text-2xl font-semibold tracking-tight">All courses</h2>
        {courses.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <CourseCard key={c.slug} course={c} showProgress />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card/40 px-6 py-16 text-center">
            <BookOpen className="size-10 text-primary/60" strokeWidth={1.25} />
            <p className="text-sm text-muted-foreground">The first courses are on their way. Check back soon.</p>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
