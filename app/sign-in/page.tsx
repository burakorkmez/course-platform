import type { Metadata } from "next"
import Image from "next/image"
import { redirect } from "next/navigation"
import { Check } from "lucide-react"
import { auth } from "@/lib/auth/server"
import { Logo } from "@/components/site-header"
import { Stars, testimonials } from "@/components/testimonials"
import { SocialSignIn } from "./social-sign-in"

export const metadata: Metadata = { title: "Sign in — Lumen", robots: { index: false } }

const benefits = ["Pick up every lesson right where you left off", "Watch free preview lessons in every course", "Source code for every lesson you own"]
const quote = testimonials.find((t) => t.name === "Amara Nwosu")!

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const { next } = await searchParams
  // Only same-site paths, so ?next= can't bounce people to another site. Parsing the way the browser will catches
  // "//evil.com", "/\evil.com" and "/<tab>/evil.com"; the "//" check catches "/.//evil.com", which normalizes to "//evil.com".
  // A placeholder origin stands in for ours, so a spoofed Host header can't widen what counts as same-site.
  const url = typeof next === "string" && next ? URL.parse(next, "http://lumen.invalid") : null
  const destination =
    url?.origin === "http://lumen.invalid" && !url.pathname.startsWith("//") ? url.pathname + url.search + url.hash : "/courses"

  const { data: session } = await auth.getSession()
  if (session?.user) redirect(destination)

  return (
    <div className="relative isolate grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-6 sm:px-10 lg:bg-[radial-gradient(ellipse_60%_45%_at_40%_45%,rgb(91_108_255/0.1),transparent)]">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            Welcome to <span className="text-gradient">Lumen</span>
          </h1>
          <p className="mt-3 text-muted-foreground">Sign in to track your progress and pick up right where you left off.</p>
          <div className="mt-8">
            <SocialSignIn next={destination} />
          </div>
          <ul className="mt-8 flex flex-col gap-3 border-t pt-8 text-sm text-muted-foreground">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-2.5">
                <Check className="size-4 shrink-0 text-primary" /> {b}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">New here? Signing in creates your account.</p>
      </div>

      {/* The animated scene: its own panel on large screens, a dimmed background behind the form on phones. */}
      <div className="absolute inset-0 -z-10 overflow-hidden lg:relative lg:inset-auto lg:z-auto lg:m-3 lg:rounded-3xl lg:border">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/sign-in-scene.jpg"
          aria-hidden
          className="absolute inset-0 size-full object-cover opacity-25 lg:opacity-100"
        >
          {/* No source matches under reduced motion, so the poster shows instead. */}
          <source src="/sign-in-scene.mp4" type="video/mp4" media="(prefers-reduced-motion: no-preference)" />
        </video>
        <figure className="absolute inset-x-0 bottom-0 hidden bg-linear-to-t from-background via-background/60 to-transparent p-10 pt-40 lg:block">
          <Stars />
          <blockquote className="mt-4 max-w-md font-heading text-2xl leading-snug font-medium tracking-tight">“{quote.quote}”</blockquote>
          <figcaption className="mt-6 flex items-center gap-3">
            <Image src={quote.avatar} alt="" width={40} height={40} className="size-10 rounded-full ring-1 ring-primary/30" />
            <div>
              <div className="text-sm font-medium">{quote.name}</div>
              <div className="text-xs text-muted-foreground">{quote.role}</div>
            </div>
          </figcaption>
        </figure>
      </div>
    </div>
  )
}
