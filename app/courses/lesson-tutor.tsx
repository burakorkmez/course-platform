"use client"

import { useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { ArrowUp, BookOpen, Lock, RotateCcw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { TutorMessage } from "@/lib/tutor"

const suggestions = ["Summarize this lesson", "Explain it more simply", "What should I review first?"]

// The lesson's AI tutor (lib/tutor.ts, app/api/tutor). The chat lives in this component, so another lesson or a reload
// starts a new one (and a new conversation in Sentry).
export function LessonTutor({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
  const [input, setInput] = useState("")
  const { messages, sendMessage, status, error, regenerate } = useChat<TutorMessage>({
    transport: new DefaultChatTransport({ api: "/api/tutor", body: { courseSlug, lessonSlug } }),
  })
  const busy = status === "submitted" || status === "streaming"
  const ask = (text: string) => {
    if (!text.trim() || busy) return
    sendMessage({ text })
    setInput("")
  }

  return (
    <section className="flex h-[32rem] flex-col rounded-2xl border bg-card xl:h-auto xl:min-h-[28rem] xl:flex-1">
      <h2 className="flex items-center gap-2 border-b px-5 py-4 font-heading text-lg font-semibold">
        <Sparkles className="size-4 text-primary" /> Ask the tutor
      </h2>

      {/* column-reverse keeps the newest message in view while an answer streams in */}
      <div className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="m-auto text-center">
            <p className="text-sm text-muted-foreground">Stuck on something? Ask about this lesson.</p>
            <div className="mt-4 flex flex-col gap-2">
              {suggestions.map((s) => (
                <Button key={s} variant="outline" size="sm" onClick={() => ask(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 text-sm" aria-live="polite">
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "ml-8 self-end rounded-xl bg-primary/10 px-3 py-2" : "flex flex-col gap-2"}>
                {m.parts.map((part, i) =>
                  part.type === "text" ? (
                    <p key={i} className="leading-relaxed whitespace-pre-wrap">
                      {part.text}
                    </p>
                  ) : part.type === "tool-readLesson" ? (
                    // The tutor looking something up: the same tool call Sentry shows in the trace.
                    <p key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {part.state === "output-available" && "locked" in part.output ? (
                        <>
                          <Lock className="size-3.5" /> “{part.output.title}” is locked
                        </>
                      ) : (
                        <>
                          <BookOpen className="size-3.5 text-primary" />
                          {part.state === "output-available"
                            ? `Read “${part.output.title}”`
                            : part.state === "output-error"
                              ? "Couldn't open that lesson"
                              : "Reading another lesson…"}
                        </>
                      )}
                    </p>
                  ) : null
                )}
              </div>
            ))}
            {status === "submitted" && <p className="animate-pulse text-muted-foreground">Thinking…</p>}
            {error && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 py-1 pr-1 pl-3 text-destructive">
                {error.message || "Something went wrong."}
                <Button variant="ghost" size="sm" onClick={() => regenerate()}>
                  <RotateCcw data-icon="inline-start" /> Retry
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <form
        className="flex gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this lesson…"
          aria-label="Ask the tutor"
          maxLength={1000}
          className="h-9"
        />
        <Button type="submit" size="icon-lg" disabled={busy || !input.trim()} aria-label="Send">
          <ArrowUp />
        </Button>
      </form>
    </section>
  )
}
