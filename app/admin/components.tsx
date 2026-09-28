"use client"

import { startTransition, useActionState, useRef, useState, type ComponentProps, type ReactNode } from "react"
import { ImageKitAbortError, upload } from "@imagekit/next"
import { Loader2, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ProgressBar } from "@/components/progress"
import { SubmitButton } from "@/components/submit-button"
import { getUploadAuth, type FormState } from "./actions"

export { SubmitButton }

export function Field({
  label,
  htmlFor,
  hint,
  required,
  className,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  required?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {/* Visual only: screen readers already announce the input's `required`. */}
        {required && (
          <span aria-hidden className="-ml-1 text-primary">
            *
          </span>
        )}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function StatusBadge({ status }: { status: "draft" | "published" | "archived" }) {
  return (
    <Badge variant={status === "published" ? "default" : status === "draft" ? "secondary" : "outline"} className="capitalize">
      {status}
    </Badge>
  )
}

// Edit form with a Save button and an inline error / "Saved" note.
// It submits through onSubmit rather than action=, because React resets a form after its action runs,
// which would wipe the admin's edits whenever validation fails.
export function ActionForm({
  action,
  className,
  children,
}: {
  action: (state: FormState, data: FormData) => Promise<FormState>
  className?: string
  children: ReactNode
}) {
  const [state, formAction, pending] = useActionState(action, null)
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        startTransition(() => formAction(data))
      }}
    >
      {children}
      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          Save changes
        </Button>
        <p aria-live="polite" className={cn("text-sm", state?.error ? "text-destructive" : "text-muted-foreground")}>
          {!pending && (state?.error ?? (state?.saved && "Saved"))}
        </p>
      </div>
    </form>
  )
}

export function DeleteButton({
  action,
  confirmText,
  children,
  ...props
}: { action: () => Promise<void>; confirmText: string } & ComponentProps<typeof Button>) {
  return (
    <form action={action} onSubmit={(e) => confirm(confirmText) || e.preventDefault()}>
      <SubmitButton variant="destructive" {...props}>
        {children}
      </SubmitButton>
    </form>
  )
}

type UploadedFile = { fileId: string; filePath: string; durationS?: number }

// Reads the length from the file's own metadata; 0 when the browser can't decode it.
function readDuration(file: File) {
  return new Promise<number>((resolve) => {
    const video = document.createElement("video")
    video.preload = "metadata"
    video.onloadedmetadata = video.onerror = () => {
      URL.revokeObjectURL(video.src)
      resolve(Number.isFinite(video.duration) ? video.duration : 0)
    }
    video.src = URL.createObjectURL(file)
  })
}

// Browser → ImageKit upload with progress and cancel, then `save` stores the file on the course or lesson.
export function MediaUpload({
  label,
  accept,
  isPrivate = false,
  save,
}: {
  label: string
  accept: string
  isPrivate?: boolean
  save: (file: UploadedFile) => Promise<void>
}) {
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abort = useRef<AbortController>(null)

  async function send(file: File) {
    setError(null)
    setProgress(0)
    abort.current = new AbortController()
    try {
      const { folder, ...auth } = await getUploadAuth()
      const res = await upload({
        ...auth,
        file,
        fileName: file.name,
        folder: `${folder}/${isPrivate ? "lessons" : "courses"}`,
        isPrivateFile: isPrivate,
        abortSignal: abort.current.signal,
        onProgress: (e) => setProgress(Math.round((e.loaded / e.total) * 100)),
      })
      const durationS = file.type.startsWith("video/") ? Math.round(res.duration ?? (await readDuration(file))) : undefined
      await save({ fileId: res.fileId!, filePath: res.filePath!, durationS })
    } catch (e) {
      if (!(e instanceof ImageKitAbortError)) setError(e instanceof Error ? e.message : "Upload failed. Please try again.")
    } finally {
      setProgress(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {progress === null ? (
        <label className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full has-focus-visible:ring-3 has-focus-visible:ring-ring/50")}>
          <Upload data-icon="inline-start" /> {label}
          <input
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ""
              if (file) send(file)
            }}
          />
        </label>
      ) : (
        <div className="flex items-center gap-3">
          <ProgressBar value={progress} className="flex-1" />
          <span className="w-20 text-right font-mono text-xs text-muted-foreground">{progress < 100 ? `${progress}%` : "Saving…"}</span>
          <Button variant="ghost" size="icon-sm" aria-label="Cancel upload" disabled={progress === 100} onClick={() => abort.current?.abort()}>
            <X />
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
