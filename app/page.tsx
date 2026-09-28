import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check, Download, Lock, Play, PlayCircle, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CourseCard } from "@/components/course-card"
import { HeroVideo } from "@/components/hero-video"
import { ProgressRing } from "@/components/progress"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Stars, Testimonials, avatars } from "@/components/testimonials"
import preview from "@/public/app-preview.jpg"
import { getCourses } from "@/lib/catalog"

// ponytail: static until Phase 5 reads prices from Polar
const plans = [
  {
    name: "Single course",
    price: "$25",
    period: "one-time",
    description: "Own one course, forever.",
    features: ["Lifetime access to one course", "All lessons and resources", "Progress tracking", "Future course updates"],
    cta: "Browse courses",
    href: "/#courses",
  },
  {
    name: "Monthly",
    price: "$50",
    period: "/month",
    description: "Every course while you're subscribed.",
    features: ["Every course on the platform", "New courses as they launch", "Progress tracking", "Cancel anytime"],
    cta: "Subscribe",
    href: "/sign-in",
  },
  {
    name: "Lifetime",
    price: "$250",
    period: "one-time",
    description: "Every course, current and future.",
    features: ["Every course, forever", "All future courses included", "Progress tracking", "One payment, no subscription"],
    cta: "Get lifetime access",
    href: "/sign-in",
    featured: true,
  },
]

const lessons = [
  { title: "Setting up your environment", time: "08:12", state: "done" },
  { title: "Next.js fundamentals", time: "12:40", state: "done" },
  { title: "Setting up authentication", time: "32:10", state: "current", at: "14:32" },
  { title: "Building the UI", time: "18:45", state: "locked" },
] as const

// Staggered fade-up for the hero on first paint.
const rise = "motion-safe:animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both"

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children: string }) {
  return (
    <div className="reveal mx-auto mb-12 max-w-2xl text-center">
      <p className="mb-3 text-sm font-medium text-primary">{eyebrow}</p>
      <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-4 text-muted-foreground">{children}</p>
    </div>
  )
}

function Feature({ title, description, className, children }: { title: string; description: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col overflow-hidden rounded-2xl border bg-card transition-colors hover:border-primary/30", className)}>
      <div className="p-6 pb-0">
        <h3 className="font-heading text-lg font-medium tracking-tight">{title}</h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-1 flex-col justify-end p-6">{children}</div>
    </div>
  )
}

export default async function Home() {
  const courses = await getCourses()
  // The first free preview lesson on the platform, for the "Watch before you buy" tile.
  const freePreview = courses.flatMap((c) => c.lessons.filter((l) => l.free).map((l) => `/courses/${c.slug}/${l.slug}`))[0] ?? "/courses"
  return (
    <div className="relative isolate flex flex-1 flex-col overflow-x-clip">
      <SiteHeader />

      <main className="flex-1">
        {/* -mt-18 slides the hero under the h-18 header so the globe fills the whole first screen */}
        <section className="relative isolate -mt-18 flex min-h-svh flex-col items-center justify-center px-4 pt-32 pb-24 text-center sm:px-6">
          <HeroVideo />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_38rem_24rem_at_50%_52%,rgb(5_6_15/0.85)_35%,rgb(5_6_15/0.55)_65%,transparent)]"
          />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-linear-to-t from-background to-transparent" />
          <Badge
            variant="outline"
            className={cn(rise, "h-8 gap-2 border-primary/30 bg-primary/10 px-3 text-sm text-foreground backdrop-blur [&>svg]:size-4!")}
          >
            <Sparkles className="text-primary" /> New courses every month
          </Badge>
          <h1 className={cn(rise, "mt-6 font-heading text-5xl leading-[1.05] font-semibold tracking-[-0.04em] delay-100 sm:text-6xl lg:text-7xl")}>
            Learn By <span className="text-gradient">Building</span>
            <br />
            Real <span className="text-gradient">Projects</span>
          </h1>
          <p className={cn(rise, "mt-6 max-w-xl text-base text-foreground/80 delay-200 sm:text-lg")}>
            Project-based video courses that turn complex topics into clear, step-by-step lessons, so you can ship
            real apps faster.
          </p>
          <div className={cn(rise, "mt-10 flex flex-col gap-3 delay-300 sm:flex-row")}>
            <Link href="/#courses" className={buttonVariants({ size: "xl" })}>
              Browse Courses <ArrowRight data-icon="inline-end" />
            </Link>
            <Link href="/#pricing" className={buttonVariants({ variant: "outline", size: "xl" })}>
              View Pricing
            </Link>
          </div>
          <div className={cn(rise, "mt-10 flex items-center gap-3 delay-500")}>
            <div className="flex -space-x-2">
              {avatars.slice(0, 5).map((src) => (
                <Image key={src} src={src} alt="" width={32} height={32} className="size-8 rounded-full ring-2 ring-background" />
              ))}
            </div>
            <div className="text-left">
              <Stars />
              <p className="mt-1 text-xs text-foreground/70">Loved by developers who ship</p>
            </div>
          </div>
        </section>

        <section className="relative mx-auto -mt-16 max-w-5xl px-4 sm:px-6">
          <div className={cn(rise, "relative rounded-2xl border bg-card/60 p-2 shadow-[0_-10px_60px_-20px_var(--glow)] backdrop-blur delay-700")}>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-[15%] -top-px h-px bg-linear-to-r from-transparent via-primary to-transparent"
            />
            <Image
              src={preview}
              alt="Lesson player with the course curriculum, a video and progress tracking"
              placeholder="blur"
              className="rounded-xl"
            />
          </div>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-background to-transparent" />
        </section>

        <section id="features" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-24 sm:px-6">
          <SectionHeading eyebrow="Features" title="Built so you actually finish">
            A player that keeps your place, tracks your progress and hands you the code for every step.
          </SectionHeading>
          <div className="reveal grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Feature
              className="md:col-span-2"
              title="Pick up right where you left off"
              description="Your place is saved as you watch, on every device. Come back tomorrow and press play."
            >
              <div className="rounded-xl border bg-background/60 p-1.5">
                {lessons.map((l) => (
                  <div
                    key={l.title}
                    className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm", l.state === "current" && "bg-primary/10")}
                  >
                    {l.state === "done" && (
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    )}
                    {l.state === "current" && <PlayCircle className="size-5 shrink-0 text-primary" />}
                    {l.state === "locked" && <Lock className="size-5 shrink-0 p-0.5 text-muted-foreground" />}
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate", l.state === "locked" && "text-muted-foreground")}>{l.title}</p>
                      {l.state === "current" && (
                        <div className="mt-2 h-1 rounded-full bg-muted">
                          <div className="h-full w-[45%] rounded-full bg-primary shadow-[0_0_8px_var(--glow)]" />
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {"at" in l && <span className="hidden sm:inline">{l.at} / </span>}
                      {l.time}
                    </span>
                  </div>
                ))}
              </div>
            </Feature>

            <Feature title="See how far you've come" description="Progress on every course, so you always know what's next.">
              <div className="flex items-center gap-5">
                <ProgressRing value={42} />
                <div className="text-sm">
                  <p className="font-medium">4 of 10 lessons</p>
                  <p className="text-muted-foreground">Full-Stack Next.js</p>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-3 text-xs text-muted-foreground">
                {[
                  { name: "TypeScript Deep Dive", pct: 100 },
                  { name: "System Design", pct: 18 },
                ].map((c) => (
                  <div key={c.name}>
                    <div className="mb-1.5 flex justify-between">
                      <span>{c.name}</span>
                      <span>{c.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${c.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Feature>

            <Feature title="Source code for every lesson" description="Download the exact code at each step. Never get stuck on a typo.">
              <div className="flex-1 overflow-hidden rounded-xl border bg-background/60">
                <div className="flex items-center justify-between border-b px-4 py-2.5 font-mono text-xs text-muted-foreground">
                  lesson-07/auth.ts
                  <Download className="size-3.5" />
                </div>
                <pre className="overflow-hidden p-4 font-mono text-xs leading-relaxed text-foreground/90">
                  <span className="block">
                    <span className="text-primary">import</span> {"{ getSession }"} <span className="text-primary">from</span>{" "}
                    <span className="text-primary/70">&quot;./session&quot;</span>
                  </span>
                  <span className="block">&nbsp;</span>
                  <span className="block">
                    <span className="text-primary">export async function</span> requireUser() {"{"}
                  </span>
                  <span className="block pl-4">
                    <span className="text-primary">const</span> session = <span className="text-primary">await</span> getSession()
                  </span>
                  <span className="block pl-4">
                    <span className="text-primary">if</span> (!session) redirect(<span className="text-primary/70">&quot;/sign-in&quot;</span>)
                  </span>
                  <span className="block pl-4">
                    <span className="text-primary">return</span> session.user
                  </span>
                  <span className="block">{"}"}</span>
                </pre>
              </div>
            </Feature>

            <Feature
              className="md:col-span-2"
              title="Watch before you buy"
              description="Every course has free preview lessons. No account, no card, just press play."
            >
              <div className="relative aspect-2/1 overflow-hidden rounded-xl border sm:aspect-5/2">
                <Image src={preview} alt="" fill sizes="(min-width: 1024px) 720px, 100vw" className="object-cover object-[50%_20%] opacity-50" />
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent" />
                <Badge className="absolute top-3 left-3">Free preview</Badge>
                <Link
                  href={freePreview}
                  aria-label="Watch a free preview lesson"
                  className="absolute inset-0 m-auto grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition hover:scale-110"
                >
                  <Play className="ml-0.5 size-5 fill-current" />
                </Link>
                <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 font-mono text-xs text-muted-foreground">
                  <span>02:14</span>
                  <div className="h-1 flex-1 rounded-full bg-muted">
                    <div className="h-full w-1/4 rounded-full bg-primary" />
                  </div>
                  <span>08:12</span>
                </div>
              </div>
            </Feature>
          </div>
        </section>

        <section id="courses" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-24 sm:px-6">
          <SectionHeading eyebrow="Courses" title="Learn by shipping real apps">
            Every course is a complete project, recorded start to finish, with source code for each lesson.
          </SectionHeading>
          {courses.length ? (
            <div className="reveal grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.slice(0, 3).map((c) => (
                <CourseCard key={c.slug} course={c} />
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">The first courses are on their way. Check back soon.</p>
          )}
        </section>

        <section id="reviews" className="relative mx-auto max-w-6xl scroll-mt-8 px-4 py-24 sm:px-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_40%_at_50%_65%,rgb(91_108_255/0.14),transparent)]"
          />
          <SectionHeading eyebrow="Reviews" title="Don't take our word for it">
            Developers use these courses to land jobs, launch side projects and level up at work.
          </SectionHeading>
          <Testimonials />
        </section>

        <section id="pricing" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-24 sm:px-6">
          <SectionHeading eyebrow="Pricing" title="Simple pricing, no surprises">
            Buy a single course, or unlock everything with a subscription or a one-time lifetime pass.
          </SectionHeading>
          <div className="reveal grid items-start gap-6 lg:grid-cols-3">
            {plans.map((p) => (
              <Card
                key={p.name}
                className={cn(
                  "[--card-spacing:--spacing(6)]",
                  p.featured && "ring-primary/50 shadow-[0_0_60px_-15px_var(--glow)]"
                )}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{p.name}</CardTitle>
                  <CardDescription>{p.description}</CardDescription>
                  {p.featured && (
                    <CardAction>
                      <Badge>Best value</Badge>
                    </CardAction>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  <p className="flex items-baseline gap-1">
                    <span className="font-heading text-4xl font-semibold tracking-tight">{p.price}</span>
                    <span className="text-muted-foreground">{p.period}</span>
                  </p>
                  <ul className="flex flex-col gap-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="size-4 text-primary" /> {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link
                    href={p.href}
                    className={cn(buttonVariants({ variant: p.featured ? "default" : "outline", size: "lg" }), "w-full")}
                  >
                    {p.cta}
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="reveal relative isolate overflow-hidden rounded-3xl border bg-card px-6 pt-20 pb-56 text-center sm:pt-24 sm:pb-64">
            <div
              aria-hidden
              className="glow-planet pointer-events-none absolute top-[68%] left-1/2 -z-10 w-176 -translate-x-1/2 sm:w-272"
            />
            <h2 className="mx-auto max-w-2xl font-heading text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              Your next project <span className="text-gradient">starts today</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              Watch the free lessons, then pick the plan that fits. Pay once or monthly, your call.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/sign-in" className={buttonVariants({ size: "xl" })}>
                Get Started <ArrowRight data-icon="inline-end" />
              </Link>
              <Link href="/#courses" className={buttonVariants({ variant: "outline", size: "xl" })}>
                Browse Courses
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
