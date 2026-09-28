import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, LayoutGrid } from "lucide-react"
import { requireAdmin } from "@/lib/auth/server"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/site-header"
import { UserButton } from "@/components/user-button"

export const metadata: Metadata = { title: "Admin — Lumen", robots: { index: false } }

// Desktop-first: a sticky sidebar on lg, a top bar below it.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin()

  return (
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="flex items-center gap-4 border-b bg-sidebar px-4 py-3 lg:sticky lg:top-0 lg:h-svh lg:flex-col lg:items-stretch lg:gap-0 lg:border-r lg:border-b-0 lg:p-4">
        <div className="flex items-center gap-2.5 lg:px-2 lg:py-1.5">
          <Logo />
          <Badge variant="outline" className="border-primary/30 bg-primary/10">
            Admin
          </Badge>
        </div>

        {/* ponytail: one section, so Courses is always the active item. Add usePathname with /admin/users. */}
        <nav className="flex gap-1 text-sm lg:mt-8 lg:flex-col">
          <Link href="/admin" className="flex items-center gap-2.5 rounded-lg bg-primary/10 px-3 py-2 font-medium">
            <LayoutGrid className="size-4 text-primary" /> Courses
          </Link>
          <Link href="/" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <ArrowUpRight className="size-4" /> View site
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3 lg:mt-auto lg:ml-0 lg:border-t lg:px-2 lg:pt-4">
          <UserButton />
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </aside>

      <main className="relative isolate min-w-0 px-4 pt-8 pb-16 sm:px-6 lg:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgb(91_108_255/0.12),transparent)]"
        />
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  )
}
