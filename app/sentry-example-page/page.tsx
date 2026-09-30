"use client"

import { Button } from "@/components/ui/button"

// Sentry smoke test: each button raises a real error through the app's own Sentry init. Delete once verified in production.
export default function SentryExamplePage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Sentry test</h1>
      <p className="text-muted-foreground">Each button throws a real error. Then check Issues in Sentry.</p>
      <div className="flex gap-3">
        <Button
          onClick={() => {
            throw new Error("Sentry Test Error (client)")
          }}
        >
          Throw client error
        </Button>
        <Button variant="outline" onClick={() => fetch("/api/sentry-example-api")}>
          Throw server error
        </Button>
      </div>
    </main>
  )
}
