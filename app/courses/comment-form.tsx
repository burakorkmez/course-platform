"use client"

import { useState, useTransition } from "react"
import { Reply, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SubmitButton } from "@/components/submit-button"

// A question or reply box for the lesson's discussion. The form clears itself once the comment is posted.
export function CommentForm({
  action,
  placeholder,
  label,
  autoFocus,
  onDone,
}: {
  action: (formData: FormData) => Promise<void>
  placeholder: string
  label: string
  autoFocus?: boolean
  // Given for a reply box: closes it after posting, and adds a Cancel button.
  onDone?: () => void
}) {
  const [failed, setFailed] = useState(false)
  return (
    <form
      className="min-w-0 flex-1"
      action={async (formData) => {
        setFailed(false)
        try {
          await action(formData)
          onDone?.()
        } catch {
          setFailed(true)
        }
      }}
    >
      <Textarea
        name="body"
        required
        maxLength={2000}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus={autoFocus}
        className="min-h-20 resize-none bg-card/60"
      />
      <div className="mt-2 flex items-center justify-end gap-2">
        {failed && <p className="mr-auto text-xs text-destructive">Couldn&apos;t post that. Please try again.</p>}
        {onDone && (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
        <SubmitButton variant="secondary">{label}</SubmitButton>
      </div>
    </form>
  )
}

// Under a question: reply to it, or (until the AI tutor has answered it) have the tutor answer.
export function QuestionActions({
  reply,
  askAi,
}: {
  reply: (formData: FormData) => Promise<void>
  askAi?: () => Promise<{ error: string } | undefined>
}) {
  const [replying, setReplying] = useState(false)
  const [asking, startAsking] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" aria-expanded={replying} onClick={() => setReplying(!replying)}>
          <Reply data-icon="inline-start" /> Reply
        </Button>
        {askAi && (
          <Button
            variant="outline"
            size="sm"
            disabled={asking}
            onClick={() =>
              startAsking(async () => {
                setError(null)
                try {
                  // Only the daily limit comes back as an error; anything else throws.
                  setError((await askAi())?.error ?? null)
                } catch {
                  setError("The AI couldn't answer. Try again.")
                }
              })
            }
          >
            <Sparkles data-icon="inline-start" className={cn("text-primary", asking && "animate-pulse")} />
            {asking ? "Writing an answer…" : "Ask AI"}
          </Button>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      {replying && (
        <div className="mt-3">
          <CommentForm action={reply} placeholder="Write a reply…" label="Reply" autoFocus onDone={() => setReplying(false)} />
        </div>
      )}
    </>
  )
}
