import { ArrowUpRight } from "lucide-react"
import { requireAdmin } from "@/lib/auth/server"
import { buttonVariants } from "@/components/ui/button"
import { scenarios } from "./scenarios"
import { Playground } from "./playground"

const logsInSentry =
  "https://codesistency-gs.sentry.io/explore/logs/?project=4512169823502416&logsQuery=simulated%3Atrue&statsPeriod=1h"

export default async function SentryLogsPage() {
  await requireAdmin()
  const list = Object.entries(scenarios).map(([name, { area, label, detail }]) => ({ name, area, label, detail }))

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">Admin</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Sentry Logs playground</h1>
          <p className="mt-2 text-muted-foreground">
            Each button sends the logs the real app would send in that situation, with the same messages and attributes, tagged{" "}
            <code className="font-mono text-sm text-foreground">simulated: true</code>. They show up in Sentry within a few seconds.
          </p>
        </div>
        <a href={logsInSentry} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Open Logs in Sentry <ArrowUpRight />
        </a>
      </div>
      <Playground scenarios={list} />
    </>
  )
}
