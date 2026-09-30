import type { ReactNode } from "react"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

// The shell for /terms-of-service and /privacy: a readable column whose headings, lists, tables and links are styled
// from here, so the pages themselves are plain JSX text.
export function LegalPage({ title, effective, children }: { title: string; effective: string; children: ReactNode }) {
  return (
    <div className="relative isolate flex flex-1 flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgb(91_108_255/0.18),transparent)]"
      />
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-12 pb-24 sm:px-6">
        <p className="text-sm font-medium text-primary">Legal</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 text-sm text-muted-foreground">Effective {effective}</p>
        <div className="mt-10 text-foreground/85 [&_a]:text-primary [&_a]:underline-offset-4 [&_a:hover]:underline [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:font-heading [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-foreground [&_li]:mt-2 [&_p]:mt-4 [&_p]:leading-relaxed [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:leading-relaxed">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

// A bordered table that scrolls sideways on phones instead of widening the page.
export function LegalTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-xl border">
      <table className="w-full min-w-xl text-left text-sm">
        <thead className="bg-card text-foreground">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
