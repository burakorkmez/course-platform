import Link from "next/link"
import { HeroVideo } from "@/components/hero-video"
import { Logo } from "@/components/site-header"

const columns = [
  {
    title: "Learn",
    links: [
      { href: "/courses", label: "Courses" },
      { href: "/#features", label: "Features" },
      { href: "/#reviews", label: "Reviews" },
      { href: "/#pricing", label: "Pricing" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/sign-in", label: "Sign in" },
      { href: "/api/portal", label: "Billing" },
    ],
  },
]

export function SiteFooter() {
  return (
    // From md up the height tracks the width, so the scene's character keeps the same spot beside the text.
    <footer className="relative isolate flex flex-col border-t md:h-[clamp(36rem,50vw,60rem)]">
      {/* The character sits bottom-left of the video. On phones the video is a strip under the links so it never sits behind text. */}
      <HeroVideo name="footer-scene" className="object-bottom-left mask-t-from-75% max-md:top-auto max-md:h-104" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/4 bg-linear-to-t from-background to-transparent" />

      <div className="mx-auto grid w-full max-w-6xl flex-1 content-start gap-12 px-4 pt-16 pb-72 sm:px-6 md:grid-cols-[1fr_auto] md:pt-20 md:pb-0">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-base text-muted-foreground">Project-based courses for developers who ship.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-16">
          {columns.map((c) => (
            <div key={c.title}>
              <h3 className="font-heading text-sm font-medium">{c.title}</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {c.links.map((l) => (
                  <li key={l.href}>
                    {/* /api/portal is a route handler, so it gets a full page load instead of client navigation. */}
                    {l.href.startsWith("/api/") ? (
                      <a href={l.href} className="transition-colors hover:text-foreground">
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className="transition-colors hover:text-foreground">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <p className="border-t py-6 text-sm text-muted-foreground">© {new Date().getFullYear()} Lumen. All rights reserved.</p>
      </div>
    </footer>
  )
}
