import Link from "next/link"
import { notFound } from "next/navigation"
import { asc, eq } from "drizzle-orm"
import { ChevronRight, Lock, Trash2, VideoOff } from "lucide-react"
import { requireAdmin } from "@/lib/auth/server"
import { db } from "@/lib/db"
import { formatDuration } from "@/lib/utils"
import { lessons, sections } from "@/lib/db/schema"
import { signedUrl } from "@/lib/imagekit"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { deleteLesson, saveLessonVideo, updateLesson } from "../../actions"
import { ActionForm, DeleteButton, Field, MediaUpload } from "../../components"

export default async function LessonEditorPage({ params }: PageProps<"/admin/lessons/[id]">) {
  await requireAdmin()
  const { id } = await params
  // Up to 9 digits keeps it inside Postgres' integer range.
  const lesson = /^\d{1,9}$/.test(id)
    ? await db.query.lessons.findFirst({
        where: eq(lessons.id, Number(id)),
        with: {
          section: {
            with: {
              course: {
                columns: { id: true, title: true },
                with: { sections: { orderBy: [asc(sections.position), asc(sections.id)], columns: { id: true, title: true } } },
              },
            },
          },
        },
      })
    : undefined
  if (!lesson) notFound()
  const { course } = lesson.section

  return (
    <>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin" className="transition-colors hover:text-foreground">
          Courses
        </Link>
        <ChevronRight className="size-3.5 shrink-0" />
        <Link href={`/admin/courses/${course.id}`} className="truncate transition-colors hover:text-foreground">
          {course.title}
        </Link>
        <ChevronRight className="size-3.5 shrink-0" />
        <span className="truncate text-foreground">{lesson.title}</span>
      </nav>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">{lesson.title}</h1>
        <Badge variant={lesson.isPublished ? "default" : "secondary"}>{lesson.isPublished ? "Published" : "Draft"}</Badge>
        {lesson.isFreePreview && <Badge variant="outline">Free preview</Badge>}
      </div>

      <div className="mt-8 grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="font-heading text-lg font-semibold">Details</h2>
          <ActionForm action={updateLesson.bind(null, lesson.id)} className="mt-5 flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Title" htmlFor="title" required>
                <Input id="title" name="title" required maxLength={200} defaultValue={lesson.title} />
              </Field>
              <Field label="Slug" htmlFor="slug" required hint="Unique within this course.">
                <Input id="slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={lesson.slug} className="font-mono" />
              </Field>
              <Field label="Section" htmlFor="sectionId" hint="Moving it puts it at the end of that section.">
                <NativeSelect id="sectionId" name="sectionId" defaultValue={String(lesson.sectionId)} className="w-full">
                  {course.sections.map((s) => (
                    <NativeSelectOption key={s.id} value={s.id}>
                      {s.title}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              {/* Keyed by the saved value: Base UI warns when an uncontrolled Switch's default changes after a save refreshes the page. */}
              <div className="flex flex-col justify-center gap-3 sm:pt-6">
                <Label>
                  <Switch key={String(lesson.isPublished)} name="isPublished" defaultChecked={lesson.isPublished} /> Published
                </Label>
                <Label>
                  <Switch key={String(lesson.isFreePreview)} name="isFreePreview" defaultChecked={lesson.isFreePreview} /> Free preview
                  <span className="font-normal text-muted-foreground">(anyone can watch)</span>
                </Label>
              </div>
            </div>
            <Field label="Lesson notes" htmlFor="contentMd" hint="Markdown. Shown under the video.">
              <Textarea id="contentMd" name="contentMd" maxLength={100_000} defaultValue={lesson.contentMd} className="min-h-72 font-mono" />
            </Field>
          </ActionForm>
        </section>

        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-heading text-lg font-semibold">Video</h2>
              {lesson.videoPath && <span className="font-mono text-xs text-muted-foreground">{formatDuration(lesson.durationS)}</span>}
            </div>
            <div className="mt-4 grid aspect-video place-items-center overflow-hidden rounded-xl border bg-black">
              {lesson.videoPath ? (
                // Private file: the signed URL outlives the video by an hour, like the student player's will.
                <video src={signedUrl(lesson.videoPath, lesson.durationS + 3600)} controls preload="metadata" className="size-full" />
              ) : (
                <VideoOff className="size-8 text-primary/60" strokeWidth={1.25} />
              )}
            </div>
            <p className="mt-3 mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3.5" /> Private. It only plays through signed URLs.
            </p>
            <MediaUpload
              label={lesson.videoPath ? "Replace video" : "Upload video"}
              accept="video/*"
              isPrivate
              save={saveLessonVideo.bind(null, lesson.id)}
            />
          </section>

          <section className="rounded-2xl border border-destructive/20 bg-card p-5">
            <h2 className="font-heading text-lg font-semibold">Delete lesson</h2>
            <p className="mt-2 mb-4 text-sm text-muted-foreground">Removes the lesson and its video from ImageKit.</p>
            <DeleteButton
              action={deleteLesson.bind(null, lesson.id)}
              confirmText={`Delete "${lesson.title}" and its video? This can't be undone.`}
              size="lg"
              className="w-full"
            >
              <Trash2 data-icon="inline-start" /> Delete lesson
            </DeleteButton>
          </section>
        </div>
      </div>
    </>
  )
}
