import { Logo } from "@/components/site-header"

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <Logo />
        <p>Project-based courses for developers who ship.</p>
      </div>
    </footer>
  )
}
