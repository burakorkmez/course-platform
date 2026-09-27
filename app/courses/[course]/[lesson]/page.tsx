import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  Captions,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  FolderGit2,
  Lock,
  Maximize,
  Play,
  PlayCircle,
  Search,
  Settings,
  Volume2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Curriculum } from "@/components/curriculum"
import { ProgressBar, ProgressRing } from "@/components/progress"
import { Logo } from "@/components/site-header"
import { UserButton } from "@/components/user-button"
import { PRICE, canWatch, courses, getCourse, getLessons, getProgress } from "@/lib/courses"

export const dynamicParams = false

export function generateStaticParams() {
  return courses.flatMap((c) => getLessons(c).map((l) => ({ course: c.slug, lesson: l.slug })))
}

async function load(params: PageProps<"/courses/[course]/[lesson]">["params"]) {
  const { course: courseSlug, lesson: lessonSlug } = await params
  const course = getCourse(courseSlug)
  const lessons = course ? getLessons(course) : []
  const lesson = lessons.find((l) => l.slug === lessonSlug)
  if (!course || !lesson) notFound()
  return { course, lessons, lesson }
}

export async function generateMetadata({ params }: PageProps<"/courses/[course]/[lesson]">): Promise<Metadata> {
  const { course, lesson } = await load(params)
  return { title: `${lesson.title} · ${course.title} — Lumen` }
}

export default async function LessonPage({ params }: PageProps<"/courses/[course]/[lesson]">) {
  const { course, lessons, lesson } = await load(params)
  const progress = getProgress(course)
  const locked = !canWatch(course, lesson)
  const done = progress.owned && lesson.index < progress.completed
  const prev = lessons[lesson.index - 1]
  const next = lessons[lesson.index + 1]
  const lessonHref = (slug: string) => `/courses/${course.slug}/${slug}`

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-20 flex h-16 items-center gap-6 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
        <Logo />
        <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm text-muted-foreground md:flex">
          <Link href="/courses" className="transition-colors hover:text-foreground">
            Courses
          </Link>
          <ChevronRight className="size-3.5 shrink-0" />
          <Link href={`/courses/${course.slug}`} className="truncate transition-colors hover:text-foreground">
            {course.title}
          </Link>
          <ChevronRight className="size-3.5 shrink-0" />
          <span className="shrink-0 text-foreground">Lesson {lesson.index + 1}</span>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <label className="relative hidden lg:block">
            <span className="sr-only">Search lessons</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search lessons, topics, or keywords…"
              className="h-9 w-72 rounded-lg border border-input bg-card/60 pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </label>
          <UserButton />
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 xl:grid-cols-[19rem_minmax(0,1fr)_20rem]">
        {/* Curriculum: below the lesson on small screens, a sticky scrolling column on xl */}
        <aside className="border-t p-4 xl:sticky xl:top-16 xl:h-[calc(100svh-4rem)] xl:overflow-y-auto xl:border-t-0 xl:border-r">
          <div className="px-3 pt-2 pb-6">
            <Link href={`/courses/${course.slug}`} className="block font-heading text-lg font-semibold tracking-tight hover:text-primary">
              {course.title}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">{course.tagline}</p>
            {progress.owned && (
              <div className="mt-4 flex items-center gap-3">
                <ProgressBar value={progress.percent} className="flex-1" />
                <span className="text-xs text-muted-foreground">{progress.percent}%</span>
              </div>
            )}
          </div>
          <Curriculum course={course} current={lesson.slug} />
        </aside>

        <main className="order-first min-w-0 p-4 sm:p-6 xl:order-none xl:p-8">
          <div className="relative aspect-video overflow-hidden rounded-xl border bg-black shadow-[0_20px_80px_-30px_var(--glow)]">
            <Image
              src={course.thumbnail}
              alt=""
              fill
              preload
              sizes="(min-width: 1280px) 900px, 100vw"
              className={cn("object-cover", locked ? "opacity-15 blur-sm" : "opacity-45")}
            />
            {locked ? (
              <div className="absolute inset-0 grid place-items-center p-6 text-center">
                <div>
                  <span className="mx-auto grid size-12 place-items-center rounded-full border border-primary/30 bg-primary/10">
                    <Lock className="size-5 text-primary" />
                  </span>
                  <h2 className="mt-4 font-heading text-xl font-semibold">This lesson is locked</h2>
                  <p className="mt-2 hidden text-sm text-muted-foreground sm:block">
                    Buy the course to watch every lesson, or start with the free previews.
                  </p>
                  <div className="mt-5 flex justify-center gap-3">
                    <Button size="lg">Buy course · {PRICE}</Button>
                    <Link href="/#pricing" className={buttonVariants({ variant: "outline", size: "lg" })}>
                      See plans
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  aria-label="Play lesson"
                  className="absolute inset-0 m-auto grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition hover:scale-105"
                >
                  <Play className="ml-0.5 size-6 fill-current" />
                </button>
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-4 pt-10 pb-3">
                  <ProgressBar value={done ? 100 : 35} className="h-1 bg-white/15" />
                  <div className="mt-3 flex items-center gap-4 text-foreground/90">
                    <button type="button" aria-label="Play">
                      <Play className="size-4 fill-current" />
                    </button>
                    <span className="font-mono text-xs">
                      {done ? lesson.duration : "04:12"} / {lesson.duration}
                    </span>
                    <div className="ml-auto flex items-center gap-4">
                      {[
                        { icon: Volume2, label: "Volume" },
                        { icon: Captions, label: "Captions" },
                        { icon: Settings, label: "Settings" },
                        { icon: Maximize, label: "Fullscreen" },
                      ].map(({ icon: Icon, label }) => (
                        <button key={label} type="button" aria-label={label} className="transition-colors hover:text-primary">
                          <Icon className="size-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <p className="mt-8 text-sm text-primary">
            Lesson {lesson.index + 1} · {lesson.section}
          </p>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{lesson.title}</h1>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!locked &&
              (done ? (
                <Button variant="secondary" size="lg">
                  <Check data-icon="inline-start" /> Completed
                </Button>
              ) : (
                <Button size="lg">
                  <Check data-icon="inline-start" /> Mark complete
                </Button>
              ))}
            {prev && (
              <Link href={lessonHref(prev.slug)} className={buttonVariants({ variant: "ghost", size: "lg" })}>
                <ChevronLeft data-icon="inline-start" /> Previous
              </Link>
            )}
            {next && (
              <Link href={lessonHref(next.slug)} className={buttonVariants({ variant: "outline", size: "lg" })}>
                Next lesson <ChevronRight data-icon="inline-end" />
              </Link>
            )}
          </div>

          <Tabs defaultValue="overview" className="mt-10">
            <TabsList variant="line" className="w-full justify-start border-b">
              <TabsTrigger value="overview" className="flex-none px-3">
                Overview
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex-none px-3">
                Resources
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="pt-4">
              <p className="max-w-2xl leading-relaxed text-muted-foreground">
                In this lesson of <span className="text-foreground">{course.title}</span> we work through “{lesson.title}”, part of the{" "}
                {lesson.section} section. Code along in your own editor, then compare with the finished source in Resources.
              </p>
              <div className="mt-6 max-w-2xl rounded-xl border bg-card p-5">
                <h2 className="font-medium">How to get the most out of it</h2>
                <ul className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
                  {["Watch it through once, then code along", "Pause and try each step before you see the solution", "Mark it complete to keep your progress in sync"].map(
                    (tip) => (
                      <li key={tip} className="flex gap-2.5">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {tip}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="resources" className="pt-4">
              {locked ? (
                <p className="text-sm text-muted-foreground">Resources unlock when you buy the course.</p>
              ) : (
                <ul className="flex max-w-2xl flex-col divide-y rounded-xl border bg-card">
                  {[
                    { icon: Download, name: `${lesson.slug}-starter.zip`, meta: "1.2 MB" },
                    { icon: Download, name: `${lesson.slug}-final.zip`, meta: "1.4 MB" },
                    { icon: FileText, name: "Lesson notes.pdf", meta: "240 KB" },
                    { icon: FolderGit2, name: "GitHub repository", meta: "github.com" },
                  ].map(({ icon: Icon, name, meta }) => (
                    <li key={name}>
                      <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-accent">
                        <Icon className="size-4 text-primary" />
                        <span className="flex-1 truncate">{name}</span>
                        <span className="text-xs text-muted-foreground">{meta}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </main>

        <aside className="flex flex-col gap-4 p-4 sm:p-6 xl:sticky xl:top-16 xl:h-[calc(100svh-4rem)] xl:overflow-y-auto xl:border-l">
          {progress.owned ? (
            <section className="rounded-2xl border bg-card p-5">
              <h2 className="font-heading text-lg font-semibold">Your progress</h2>
              <div className="mt-4 flex items-center gap-5">
                <ProgressRing value={progress.percent} />
                <div className="text-sm">
                  <p className="font-medium">
                    {progress.completed} of {progress.total} lessons
                  </p>
                  <p className="text-muted-foreground">{progress.percent === 100 ? "Course completed" : "Completed"}</p>
                </div>
              </div>
              <ProgressBar value={progress.percent} className="mt-5" />
            </section>
          ) : (
            <section className="rounded-2xl border bg-card p-5">
              <h2 className="font-heading text-lg font-semibold">Unlock the full course</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                All {progress.total} lessons, the source code and lifetime access for a one-time {PRICE}.
              </p>
              <Button size="lg" className="mt-4 w-full">
                Buy course · {PRICE}
              </Button>
            </section>
          )}

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-heading text-lg font-semibold">Up next</h2>
            {next ? (
              <Link href={lessonHref(next.slug)} className="group -mx-2 mt-2 flex items-center gap-4 rounded-xl p-2 transition-colors hover:bg-accent">
                <span className="grid size-12 shrink-0 place-items-center rounded-lg border bg-background/60">
                  {canWatch(course, next) ? <PlayCircle className="size-5 text-primary" /> : <Lock className="size-4 text-muted-foreground" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {next.index + 1}. {next.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {next.duration} · {next.section}
                  </span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">That&apos;s the last lesson. Nice work finishing the course!</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
