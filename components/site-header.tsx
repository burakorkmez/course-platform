import Link from "next/link"
import { cn } from "@/lib/utils"
import { UserButton } from "@/components/user-button"

// The star is sized in em, so a text size on the logo scales both.
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <svg viewBox="0 0 24 24" className="size-[1.5em] text-primary drop-shadow-[0_0_8px_var(--glow)]" aria-hidden>
        <path
          fill="currentColor"
          d="M12 0c0 6.6 5.4 12 12 12-6.6 0-12 5.4-12 12 0-6.6-5.4-12-12-12 6.6 0 12-5.4 12-12Z"
        />
      </svg>
      LUMEN
    </Link>
  )
}

const links = [
  { href: "/#features", label: "Features" },
  { href: "/courses", label: "Courses" },
  { href: "/#reviews", label: "Reviews" },
  { href: "/#pricing", label: "Pricing" },
]

export function SiteHeader() {
  return (
    <header className="relative z-10 mx-auto flex h-18 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
      <Logo className="text-lg" />
      <nav className="hidden items-center gap-8 text-base font-semibold text-foreground/80 md:flex">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="transition-colors hover:text-foreground">
            {l.label}
          </Link>
        ))}
      </nav>
      <UserButton />
    </header>
  )
}
