import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Check, ChevronRight, Clock, Play, PlayCircle, RefreshCw, Star, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Curriculum } from "@/components/curriculum"
import { ProgressRing } from "@/components/progress"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { PRICE, courses, getCourse, getLessons, getProgress, getStats, resumeLesson } from "@/lib/courses"

export const dynamicParams = false

export function generateStaticParams() {
  return courses.map((c) => ({ course: c.slug }))
}

export async function generateMetadata({ params }: PageProps<"/courses/[course]">): Promise<Metadata> {
  const course = getCourse((await params).course)
  return { title: `${course?.title} — Lumen`, description: course?.tagline }
}

export default async function CoursePage({ params }: PageProps<"/courses/[course]">) {
  const course = getCourse((await params).course)
  if (!course) notFound()

  const lessons = getLessons(course)
  const stats = getStats(course)
  const progress = getProgress(course)
  const preview = lessons.find((l) => l.free) ?? lessons[0]
  const resume = resumeLesson(course)

  return (
    <div className="relative isolate flex flex-1 flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgb(91_108_255/0.18),transparent)]"
      />
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-24 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/courses" className="transition-colors hover:text-foreground">
            Courses
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="truncate text-foreground">{course.title}</span>
        </nav>

        <div className="mt-8 flex flex-wrap gap-2">
          {course.badge && <Badge>{course.badge}</Badge>}
          <Badge variant="outline">{course.level}</Badge>
          {course.tags.map((t) => (
            <Badge key={t} variant="secondary">
              {t}
            </Badge>
          ))}
        </div>
        <h1 className="mt-4 max-w-3xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl">{course.title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{course.tagline}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5 text-foreground">
            <Star className="size-4 fill-primary text-primary" /> {course.rating}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-4" /> {course.students.toLocaleString("en-US")} students
          </span>
          <span className="flex items-center gap-1.5">
            <PlayCircle className="size-4" /> {stats.lessons} lessons
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" /> {stats.duration}
          </span>
          <span className="flex items-center gap-1.5">
            <RefreshCw className="size-4" /> Updated {course.updated}
          </span>
        </div>

        <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex flex-col gap-12">
            <Link
              href={`/courses/${course.slug}/${preview.slug}`}
              className="group relative block aspect-video overflow-hidden rounded-2xl border shadow-[0_20px_80px_-30px_var(--glow)]"
            >
              <Image
                src={course.thumbnail}
                alt=""
                fill
                preload
                sizes="(min-width: 1024px) 720px, 100vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div aria-hidden className="absolute inset-0 bg-background/30" />
              <span className="absolute inset-0 m-auto grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition group-hover:scale-110">
                <Play className="ml-0.5 size-6 fill-current" />
              </span>
              <span className="absolute bottom-4 left-4 rounded-full border bg-background/70 px-3 py-1 text-xs backdrop-blur">
                Watch a free preview
              </span>
            </Link>

            <section>
              <h2 className="font-heading text-2xl font-semibold tracking-tight">About this course</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">{course.description}</p>
            </section>

            <section className="rounded-2xl border bg-card p-6">
              <h2 className="font-heading text-xl font-semibold tracking-tight">What you&apos;ll learn</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {course.outcomes.map((o) => (
                  <li key={o} className="flex gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {o}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-heading text-2xl font-semibold tracking-tight">Curriculum</h2>
                <p className="text-sm text-muted-foreground">
                  {course.sections.length} sections · {stats.lessons} lessons · {stats.duration}
                </p>
              </div>
              <div className="mt-5 rounded-2xl border bg-card p-3 sm:p-4">
                <Curriculum course={course} />
              </div>
            </section>
          </div>

          <Card className="[--card-spacing:--spacing(6)] lg:sticky lg:top-8">
            {progress.owned ? (
              <>
                <CardHeader>
                  <CardTitle className="text-lg">Your progress</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-5">
                  <ProgressRing value={progress.percent} />
                  <div className="text-sm">
                    <p className="font-medium">
                      {progress.completed} of {progress.total} lessons
                    </p>
                    <p className="text-muted-foreground">{progress.percent === 100 ? "Course completed" : `Up next: ${resume.title}`}</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/courses/${course.slug}/${resume.slug}`} className={cn(buttonVariants({ size: "lg" }), "w-full")}>
                    {progress.percent === 100 ? "Watch again" : "Continue learning"} <ArrowRight data-icon="inline-end" />
                  </Link>
                </CardFooter>
              </>
            ) : (
              <>
                <CardHeader>
                  <p className="flex items-baseline gap-1">
                    <span className="font-heading text-4xl font-semibold tracking-tight">{PRICE}</span>
                    <span className="text-muted-foreground">one-time</span>
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Button size="lg" className="w-full">
                    Buy course
                  </Button>
                  <Link
                    href={`/courses/${course.slug}/${preview.slug}`}
                    className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
                  >
                    Watch free preview
                  </Link>
                  <ul className="mt-3 flex flex-col gap-2.5 text-sm">
                    {[`${stats.lessons} lessons (${stats.duration})`, "Source code for every lesson", "Lifetime access", "Progress tracking"].map(
                      (f) => (
                        <li key={f} className="flex items-center gap-2">
                          <Check className="size-4 text-primary" /> {f}
                        </li>
                      )
                    )}
                  </ul>
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground">
                  <p>
                    Or get every course with{" "}
                    <Link href="/#pricing" className="text-primary underline-offset-4 hover:underline">
                      All Access
                    </Link>
                    .
                  </p>
                </CardFooter>
              </>
            )}
          </Card>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
