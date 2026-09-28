import Link from "next/link"
import { notFound } from "next/navigation"
import { asc, eq } from "drizzle-orm"
import { Image } from "@imagekit/next"
import { ChevronRight, Film, ImageIcon, Plus, Trash2 } from "lucide-react"
import { requireAdmin } from "@/lib/auth/server"
import { db } from "@/lib/db"
import { courseLevel, courseStatus, courses, lessons, sections } from "@/lib/db/schema"
import { publicUrl } from "@/lib/imagekit"
import { formatDuration } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { createSection, deleteCourse, saveCourseMedia, updateCourse } from "../../actions"
import { ActionForm, DeleteButton, Field, MediaUpload, StatusBadge, SubmitButton } from "../../components"
import { CurriculumEditor } from "./curriculum-editor"

export default async function CourseEditorPage({ params }: PageProps<"/admin/courses/[id]">) {
  await requireAdmin()
  const { id } = await params
  // Up to 9 digits keeps it inside Postgres' integer range.
  const course = /^\d{1,9}$/.test(id)
    ? await db.query.courses.findFirst({
        where: eq(courses.id, Number(id)),
        with: {
          sections: {
            orderBy: [asc(sections.position), asc(sections.id)],
            columns: { id: true, title: true },
            with: {
              lessons: {
                orderBy: [asc(lessons.position), asc(lessons.id)],
                columns: { id: true, title: true, durationS: true, isPublished: true, isFreePreview: true, videoPath: true },
              },
            },
          },
        },
      })
    : undefined
  if (!course) notFound()

  const allLessons = course.sections.flatMap((s) => s.lessons)

  return (
    <>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin" className="transition-colors hover:text-foreground">
          Courses
        </Link>
        <ChevronRight className="size-3.5 shrink-0" />
        <span className="truncate text-foreground">{course.title}</span>
      </nav>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">{course.title}</h1>
        <StatusBadge status={course.status} />
      </div>

      <div className="mt-8 grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="font-heading text-lg font-semibold">Details</h2>
            <ActionForm action={updateCourse.bind(null, course.id)} className="mt-5 flex flex-col gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Title" htmlFor="title" required>
                  <Input id="title" name="title" required maxLength={200} defaultValue={course.title} />
                </Field>
                <Field label="Slug" htmlFor="slug" required hint={`/courses/${course.slug}`}>
                  <Input id="slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={course.slug} className="font-mono" />
                </Field>
                <Field label="Tagline" htmlFor="tagline" hint="One line under the title, on course cards and the course page." className="sm:col-span-2">
                  <Input id="tagline" name="tagline" maxLength={200} defaultValue={course.tagline} placeholder="Build and ship a real app with Claude Code" />
                </Field>
                <Field label="Status" htmlFor="status" hint="Draft: only you. Archived: only people who already have access.">
                  <NativeSelect id="status" name="status" defaultValue={course.status} className="w-full">
                    {courseStatus.enumValues.map((s) => (
                      <NativeSelectOption key={s} value={s}>
                        {s[0].toUpperCase() + s.slice(1)}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Level" htmlFor="level">
                  <NativeSelect id="level" name="level" defaultValue={course.level} className="w-full">
                    {courseLevel.enumValues.map((l) => (
                      <NativeSelectOption key={l} value={l}>
                        {l}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field
                  label="Polar product ID"
                  htmlFor="polarProductId"
                  hint="Optional. Without it the course can't be bought on its own, only through All Access."
                  className="sm:col-span-2"
                >
                  <Input id="polarProductId" name="polarProductId" defaultValue={course.polarProductId ?? ""} placeholder="Not linked yet" className="font-mono" />
                </Field>
              </div>
              <Field label="Description" htmlFor="descriptionMd" hint="Markdown. Shown on the course page.">
                <Textarea id="descriptionMd" name="descriptionMd" maxLength={20_000} defaultValue={course.descriptionMd} className="min-h-40 font-mono" />
              </Field>
              <Field label="What you'll learn" htmlFor="outcomes" hint="One outcome per line. Shown as a checklist on the course page.">
                <Textarea
                  id="outcomes"
                  name="outcomes"
                  defaultValue={course.outcomes.join("\n")}
                  placeholder={"Plan an app with Claude Code\nShip it to the App Store"}
                  className="min-h-28"
                />
              </Field>
            </ActionForm>
          </section>

          <section className="rounded-2xl border bg-card p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-heading text-lg font-semibold">Curriculum</h2>
              <p className="text-sm text-muted-foreground">
                {course.sections.length} sections · {allLessons.length} lessons · {formatDuration(allLessons.reduce((t, l) => t + l.durationS, 0))}
              </p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Drag the handles to reorder. Click a lesson to edit it and upload its video.</p>
            <div className="mt-5">
              <CurriculumEditor courseId={course.id} sections={course.sections} />
            </div>
            <form action={createSection.bind(null, course.id)} className="mt-4 flex gap-2">
              <Input name="title" required maxLength={200} placeholder="New section title" aria-label="New section title" />
              <SubmitButton variant="outline">
                <Plus data-icon="inline-start" /> Add section
              </SubmitButton>
            </form>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-heading text-lg font-semibold">Thumbnail</h2>
            <div className="relative mt-4 grid aspect-video place-items-center overflow-hidden rounded-xl border bg-muted">
              {course.thumbnailPath ? (
                <Image src={course.thumbnailPath} alt="" fill sizes="22rem" className="object-cover" />
              ) : (
                <ImageIcon className="size-8 text-primary/60" strokeWidth={1.25} />
              )}
            </div>
            <p className="mt-3 mb-4 text-xs text-muted-foreground">16:9, at least 1280×720. Public.</p>
            <MediaUpload
              label={course.thumbnailPath ? "Replace thumbnail" : "Upload thumbnail"}
              accept="image/*"
              save={saveCourseMedia.bind(null, course.id, "thumbnail")}
            />
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-heading text-lg font-semibold">Trailer</h2>
            <div className="mt-4 grid aspect-video place-items-center overflow-hidden rounded-xl border bg-black">
              {course.trailerPath ? (
                <video src={publicUrl(course.trailerPath)} controls preload="metadata" className="size-full" />
              ) : (
                <Film className="size-8 text-primary/60" strokeWidth={1.25} />
              )}
            </div>
            <p className="mt-3 mb-4 text-xs text-muted-foreground">Plays on the course page. Public.</p>
            <MediaUpload
              label={course.trailerPath ? "Replace trailer" : "Upload trailer"}
              accept="video/*"
              save={saveCourseMedia.bind(null, course.id, "trailer")}
            />
          </section>

          <section className="rounded-2xl border border-destructive/20 bg-card p-5">
            <h2 className="font-heading text-lg font-semibold">Delete course</h2>
            <p className="mt-2 mb-4 text-sm text-muted-foreground">
              Removes every section, lesson and uploaded file. To hide a course but keep it for its students, set it to Archived instead.
            </p>
            <DeleteButton
              action={deleteCourse.bind(null, course.id)}
              confirmText={`Delete "${course.title}" with all ${allLessons.length} lessons and their videos? This can't be undone.`}
              size="lg"
              className="w-full"
            >
              <Trash2 data-icon="inline-start" /> Delete course
            </DeleteButton>
          </section>
        </div>
      </div>
    </>
  )
}
