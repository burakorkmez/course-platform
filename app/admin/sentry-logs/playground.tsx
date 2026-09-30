"use client"

import { useState, useTransition } from "react"
import { Check, Loader2, Send, TriangleAlert } from "lucide-react"
import * as Sentry from "@sentry/nextjs"
import { Button } from "@/components/ui/button"
import { runScenario } from "./actions"

export type ScenarioInfo = { name: string; area: string; label: string; detail: string }
type Runnable = ScenarioInfo & { run: () => unknown }

const simulated = (fn: () => void) =>
  Sentry.withScope((scope) => {
    scope.setAttributes({ simulated: true })
    fn()
  })

// These happen in the browser in production (the lesson player, the checkout success page), so they run here: they get
// browser attributes and link to this session's replay (open a log's sentry.replay_id).
const browser: Runnable[] = [
  {
    name: "video_failed",
    area: "In the browser",
    label: "Video won't play",
    detail: "media_error_code: 2 (network). Its message has a signed URL: check the log, the signature arrives as ik-s=[Filtered].",
    run: () =>
      simulated(() =>
        Sentry.logger.error("Video playback failed", {
          video: "lesson",
          course_slug: "nextjs-from-scratch",
          lesson_slug: "server-actions",
          media_error_code: 2,
          media_error_message:
            "HLS playlist request error at URL: https://ik.imagekit.io/lumen/dev/lesson.mp4/ik-master.m3u8?tr=sr-240_360_720&ik-t=1790000000&ik-s=3f9a1c0de8b7a6f5",
          position_s: 754,
        })
      ),
  },
  {
    name: "progress_failed",
    area: "In the browser",
    label: "Progress save fails",
    detail: "The student will come back to the wrong spot, or find a finished lesson still unfinished.",
    run: () =>
      simulated(() =>
        Sentry.logger.warn("Lesson progress save failed", { course_slug: "typescript-in-practice", lesson_slug: "routing", completing: true })
      ),
  },
  {
    name: "access_not_granted",
    area: "In the browser",
    label: "Paid, still no access after 60s",
    detail: "Error log plus an issue, with this session's replay attached. The worst thing a customer can hit.",
    run: () =>
      simulated(() => {
        Sentry.logger.error("Access not granted after checkout", { plan: "lifetime", waited_s: 60 })
        Sentry.captureMessage("[simulated] Access not granted 60s after checkout", { level: "error", tags: { plan: "lifetime", simulated: true } })
      }),
  },
]

export function Playground({ scenarios }: { scenarios: ScenarioInfo[] }) {
  const all: Runnable[] = [...scenarios.map((s) => ({ ...s, run: () => runScenario(s.name) })), ...browser]
  const areas = [...new Set(all.map((s) => s.area))]
  return (
    <div className="mt-10 space-y-10">
      {areas.map((area) => (
        <section key={area}>
          <h2 className="font-heading text-lg font-medium tracking-tight">{area}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {all
              .filter((s) => s.area === area)
              .map((s) => (
                <Tile key={s.name} {...s} />
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function Tile({ label, detail, run }: Runnable) {
  const [pending, start] = useTransition()
  const [result, setResult] = useState<"sent" | "failed">()
  const send = () =>
    start(async () => {
      try {
        await run()
        setResult("sent")
      } catch {
        setResult("failed")
      }
    })

  return (
    <div className="flex flex-col rounded-2xl border bg-card p-5">
      <h3 className="font-medium tracking-tight">{label}</h3>
      <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{detail}</p>
      <div className="mt-4 flex items-center gap-3">
        <Button variant="outline" size="sm" disabled={pending} onClick={send}>
          {pending ? <Loader2 className="animate-spin" /> : <Send />} Send logs
        </Button>
        {result === "sent" && !pending && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Check className="size-3.5 text-primary" /> Sent
          </span>
        )}
        {result === "failed" && !pending && (
          <span className="flex items-center gap-1 text-xs text-destructive">
            <TriangleAlert className="size-3.5" /> Failed
          </span>
        )}
      </div>
    </div>
  )
}
