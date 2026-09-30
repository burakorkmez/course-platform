import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Check, ChevronLeft, ChevronRight, Clapperboard, Lock, PlayCircle, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { BuyButton } from "@/components/buy-button"
import { SubmitButton } from "@/components/submit-button"
import { CourseThumbnail } from "@/components/course-card"
import { Curriculum } from "@/components/curriculum"
import { ProgressBar, ProgressRing } from "@/components/progress"
import { Logo } from "@/components/site-header"
import { UserButton } from "@/components/user-button"
import { getCourse } from "@/lib/catalog"
import { publicUrl } from "@/lib/imagekit"
import { getPrices } from "@/lib/polar"
import { saveProgress } from "../../actions"
import { LessonComments } from "../../lesson-comments"
import { LessonTutor } from "../../lesson-tutor"
import { VideoPlayer } from "../../video-player"

async function load(params: PageProps<"/courses/[course]/[lesson]">["params"]) {
  const { course: courseSlug, lesson: lessonSlug } = await params
  const course = await getCourse(courseSlug)
  const lesson = course?.lessons.find((l) => l.slug === lessonSlug)
  if (!course || !lesson) notFound()
  return { course, lesson }
}

export async function generateMetadata({ params }: PageProps<"/courses/[course]/[lesson]">): Promise<Metadata> {
  const { course, lesson } = await load(params)
  return { title: `${lesson.title} · ${course.title} — Lumen`, robots: { index: false } }
}

export default async function LessonPage({ params }: PageProps<"/courses/[course]/[lesson]">) {
  const { course, lesson } = await load(params)
  const { progress, lessons } = course
  const { locked } = lesson
  const { done } = lesson
  const prev = lessons[lesson.index - 1]
  const next = lessons[lesson.index + 1]
  const lessonHref = (slug: string) => `/courses/${course.slug}/${slug}`
  // Without a linked Polar product the course comes with All Access only.
  const forSale = course.status === "published" && !!course.productId
  const price = course.productId ? (await getPrices())[course.productId]?.label : undefined
  const buyLabel = price ? `Buy course · ${price}` : "Buy course"

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
            {course.tagline && <p className="mt-1 text-sm text-muted-foreground">{course.tagline}</p>}
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
            {!locked && lesson.videoPath ? (
              <VideoPlayer
                key={lesson.slug}
                imagekitId={process.env.IMAGEKIT_ID!}
                src={publicUrl(lesson.videoPath)}
                lesson={{ courseSlug: course.slug, lessonSlug: lesson.slug, resumeAt: lesson.positionS, done, track: course.signedIn }}
              />
            ) : (
              <>
                <CourseThumbnail
                  src={course.thumbnail}
                  sizes="(min-width: 1280px) 900px, 100vw"
                  preload
                  className={locked ? "opacity-15 blur-sm" : "opacity-30"}
                />
                <div className="absolute inset-0 grid place-items-center p-6 text-center">
                  {locked ? (
                    <div>
                      <span className="mx-auto grid size-12 place-items-center rounded-full border border-primary/30 bg-primary/10">
                        <Lock className="size-5 text-primary" />
                      </span>
                      <h2 className="mt-4 font-heading text-xl font-semibold">This lesson is locked</h2>
                      <p className="mt-2 hidden text-sm text-muted-foreground sm:block">
                        {forSale ? "Buy the course" : "Get All Access"} to watch every lesson, or start with the free previews.
                      </p>
                      <div className="mt-5 flex justify-center gap-3">
                        {forSale && (
                          <BuyButton plan="course" course={course.slug} size="lg">
                            {buyLabel}
                          </BuyButton>
                        )}
                        <Link href="/#pricing" className={buttonVariants({ variant: "outline", size: "lg" })}>
                          See plans
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Clapperboard className="mx-auto size-10 text-primary/60" strokeWidth={1.25} />
                      <h2 className="mt-4 font-heading text-xl font-semibold">Video coming soon</h2>
                      <p className="mt-2 text-sm text-muted-foreground">This lesson&apos;s video hasn&apos;t been uploaded yet.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <p className="mt-8 text-sm text-primary">
            Lesson {lesson.index + 1} · {lesson.section}
          </p>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{lesson.title}</h1>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!locked && course.signedIn && (
              // Toggles: "Completed" marks it not complete again.
              <form action={saveProgress.bind(null, course.slug, lesson.slug, { completed: !done })}>
                <SubmitButton variant={done ? "secondary" : "default"} size="lg" aria-pressed={done}>
                  <Check data-icon="inline-start" /> {done ? "Completed" : "Mark complete"}
                </SubmitButton>
              </form>
            )}
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

          <section className="mt-10 border-t pt-6">
            <h2 className="font-heading text-lg font-semibold">About this lesson</h2>
            {locked ? (
              <p className="mt-3 text-sm text-muted-foreground">The lesson notes unlock with the course.</p>
            ) : (
              // ponytail: plain text until the markdown renderer lands (react-markdown + rehype-pretty-code, per PLAN.md).
              <p className="mt-3 max-w-2xl leading-relaxed whitespace-pre-line text-muted-foreground">
                {lesson.contentMd ||
                  `In this lesson of ${course.title} we work through “${lesson.title}”, part of the ${lesson.section} section. Code along in your own editor as you watch.`}
              </p>
            )}
            <div className="mt-6 max-w-2xl rounded-xl border bg-card p-5">
              <h3 className="font-medium">How to get the most out of it</h3>
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
          </section>

          {/* The discussion unlocks with the lesson, like its notes */}
          {!locked && <LessonComments courseSlug={course.slug} lessonSlug={lesson.slug} lessonId={lesson.id} />}
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
                {forSale
                  ? `All ${progress.total} lessons, the source code and lifetime access${price ? ` for a one-time ${price}` : ""}.`
                  : `All ${progress.total} lessons and the source code come with All Access, along with every other course.`}
              </p>
              <div className="mt-4">
                {forSale ? (
                  <BuyButton plan="course" course={course.slug} size="lg" className="w-full">
                    {buyLabel}
                  </BuyButton>
                ) : (
                  <Link href="/#pricing" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
                    See plans
                  </Link>
                )}
              </div>
            </section>
          )}

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-heading text-lg font-semibold">Up next</h2>
            {next ? (
              <Link href={lessonHref(next.slug)} className="group -mx-2 mt-2 flex items-center gap-4 rounded-xl p-2 transition-colors hover:bg-accent">
                <span className="grid size-12 shrink-0 place-items-center rounded-lg border bg-background/60">
                  {next.locked ? <Lock className="size-4 text-muted-foreground" /> : <PlayCircle className="size-5 text-primary" />}
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

          {/* Same rule as the video: the tutor needs a lesson this student can watch (and an account, since it costs) */}
          {course.signedIn && !locked && <LessonTutor key={lesson.slug} courseSlug={course.slug} lessonSlug={lesson.slug} />}
        </aside>
      </div>
    </div>
  )
}
