"use server"

import * as Sentry from "@sentry/nextjs"
import { headers } from "next/headers"
import { requireAdmin } from "@/lib/auth/server"
import { scenarios } from "./scenarios"

// Runs one playground scenario inside its own span, so its logs show up in the trace waterfall too.
export async function runScenario(name: string) {
  return Sentry.withServerActionInstrumentation("runLogScenario", { headers: await headers() }, async () => {
    await requireAdmin()
    if (!Object.hasOwn(scenarios, name)) throw new Error(`Unknown scenario: ${name}`)
    const scenario = scenarios[name]
    await Sentry.startSpan({ name: `Logs playground: ${scenario.label}`, op: "playground" }, scenario.run)
  })
}
