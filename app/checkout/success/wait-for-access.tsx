"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import * as Sentry from "@sentry/nextjs"
import { Button, buttonVariants } from "@/components/ui/button"

// Re-renders the server page every 2s; it redirects as soon as the webhook has granted access. Gives up after a minute.
// checkout is the Polar checkout the page verified as this user's; paid, that the page saw it succeed (each refresh
// re-checks, and the minute starts over once it does). Only a paid checkout alerts.
export function WaitForAccess({ checkout, paid, plan, course }: { checkout: string; paid: boolean; plan: string; course?: string }) {
  const router = useRouter()
  const [waiting, setWaiting] = useState(true)

  useEffect(() => {
    if (!waiting) return
    const started = Date.now()
    const timer = setInterval(() => {
      if (Date.now() - started < 60_000) return router.refresh()
      clearInterval(timer)
      setWaiting(false)
      if (!paid) return
      // Paid, and a minute later still no access: the webhook failed or hasn't arrived. The worst thing that can happen
      // to a customer, so it's an issue (alerts, and keeps the replay), not just a log. checkout_id leads to the
      // "Checkout attempt" log, and their user.id to the "Polar webhook …" logs that say where it broke.
      Sentry.logger.error("Access not granted after checkout", { plan, checkout_id: checkout, ...(course && { course_slug: course }), waited_s: 60 })
      Sentry.captureMessage("Access not granted 60s after checkout", { level: "error", tags: { plan } })
    }, 2000)
    return () => clearInterval(timer)
  }, [router, waiting, checkout, paid, plan, course])

  return waiting ? (
    <div role="status">
      <Loader2 className="mx-auto size-10 animate-spin text-primary/60" strokeWidth={1.25} />
      <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        Thanks for your <span className="text-gradient">purchase</span>
      </h1>
      <p className="mt-4 text-muted-foreground">We&apos;re unlocking your access. This usually takes a few seconds.</p>
    </div>
  ) : (
    <div role="status">
      <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Your payment went through</h1>
      <p className="mt-4 text-muted-foreground">
        Your access is taking longer than usual to unlock. Your receipt is in your inbox, and there&apos;s no need to pay again.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button size="lg" onClick={() => setWaiting(true)}>
          Check again
        </Button>
        <Link href="/courses" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Browse courses
        </Link>
      </div>
    </div>
  )
}
