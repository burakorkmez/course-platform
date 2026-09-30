"use server"

import * as Sentry from "@sentry/nextjs"
import { after } from "next/server"
import { refresh } from "next/cache"
import { redirect } from "next/navigation"
import { and, eq, ne, sql } from "drizzle-orm"
import { z } from "zod"
import { errors } from "@polar-sh/sdk/2026-10"
import { requireAdmin } from "@/lib/auth/server"
import { db } from "@/lib/db"
import { courseLevel, courseStatus, courses, lessons, sections } from "@/lib/db/schema"
import { deleteFiles, uploadAuth } from "@/lib/imagekit"
import { LIFETIME_PRODUCT_ID, MONTHLY_PRODUCT_ID, polar } from "@/lib/polar"

// Audit trail: every change that affects what students see or can buy logs one "Admin: …" line. requireAdmin() tags it
// with the admin's user.id, so "who unpublished this / deleted that, and when" is one search in Sentry Logs.

// ponytail: the catalog (lib/catalog.ts) renders per request, so there's no cache to bust. Once it uses 'use cache', call updateTag('catalog') here.

export type FormState = { error?: string; saved?: boolean } | null

const title = z.string().trim().min(1, "Title is required").max(200)
const slug = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slugs use lowercase letters, numbers and single dashes")
const media = z.object({ fileId: z.string().min(1), filePath: z.string().startsWith("/"), durationS: z.number().int().min(0).optional() })
const ids = z.array(z.number().int())

const slugify = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "untitled"

function uniqueSlug(base: string, taken: string[]) {
  let s = base
  for (let n = 2; taken.includes(s); n++) s = `${base}-${n}`
  return s
}

// Postgres unique_violation (drizzle wraps the driver error in `cause`).
const isUniqueViolation = (e: unknown) => [(e as { code?: string }).code, (e as { cause?: { code?: string } }).cause?.code].includes("23505")

const lessonSlugs = async (courseId: number, exceptLessonId = 0) =>
  (
    await db
      .select({ slug: lessons.slug })
      .from(lessons)
      .innerJoin(sections, eq(lessons.sectionId, sections.id))
      .where(and(eq(sections.courseId, courseId), ne(lessons.id, exceptLessonId)))
  ).map((r) => r.slug)

const nextPosition = (table: "sections" | "lessons", parentId: number) =>
  table === "sections"
    ? sql<number>`(select coalesce(max(position), -1) + 1 from sections where course_id = ${parentId})`
    : sql<number>`(select coalesce(max(position), -1) + 1 from lessons where section_id = ${parentId})`

export async function getUploadAuth() {
  await requireAdmin()
  return uploadAuth()
}

// ---- Courses ----

export async function createCourse(formData: FormData) {
  await requireAdmin()
  const t = title.parse(formData.get("title"))
  const taken = (await db.select({ slug: courses.slug }).from(courses)).map((r) => r.slug)
  const [course] = await db
    .insert(courses)
    .values({ title: t, slug: uniqueSlug(slugify(t), taken) })
    .returning({ id: courses.id })
  Sentry.logger.info("Admin: course created", { course_id: course.id })
  redirect(`/admin/courses/${course.id}`)
}

const courseInput = z.object({
  title,
  slug,
  tagline: z.string().trim().max(200),
  status: z.enum(courseStatus.enumValues),
  level: z.enum(courseLevel.enumValues),
  descriptionMd: z.string().max(20_000),
  // One per line in the form.
  outcomes: z
    .string()
    .transform((v) => v.split("\n").map((line) => line.trim()).filter(Boolean))
    .pipe(z.array(z.string().max(200, "Keep each outcome under 200 characters")).max(20, "Up to 20 outcomes")),
  polarProductId: z
    .string()
    .trim()
    .transform((v) => v || null),
})

export async function updateCourse(courseId: number, _: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const input = courseInput.safeParse(Object.fromEntries(formData))
  if (!input.success) return { error: input.error.issues[0].message }
  // A typo here would leave buyers paying without getting access (the webhook can't match the product), so check it now.
  const productId = input.data.polarProductId
  if (productId) {
    // 404 is an unknown id, 422 a malformed one; anything else (network, auth, rate limit) is ours to surface.
    const product = await polar.products.get(productId).catch((e) => {
      if (e instanceof errors.ResourceNotFound || e instanceof errors.HTTPValidationError) return null
      throw e
    })
    if (!product || product.is_recurring || productId === MONTHLY_PRODUCT_ID || productId === LIFETIME_PRODUCT_ID)
      return { error: "That isn't a one-time course product in Polar. Copy its ID from the product's page." }
  }
  try {
    await db.update(courses).set(input.data).where(eq(courses.id, courseId))
  } catch (e) {
    if (isUniqueViolation(e)) return { error: "Another course already uses that slug or Polar product" }
    throw e
  }
  Sentry.logger.info("Admin: course updated", {
    course_id: courseId,
    course_slug: input.data.slug,
    status: input.data.status,
    polar_product_id: productId ?? "none",
  })
  refresh()
  return { saved: true }
}

export async function saveCourseMedia(courseId: number, kind: "thumbnail" | "trailer", file: z.input<typeof media>) {
  await requireAdmin()
  const { fileId, filePath } = media.parse(file)
  const [old] = await db
    .select({ thumbnail: courses.thumbnailFileId, trailer: courses.trailerFileId })
    .from(courses)
    .where(eq(courses.id, courseId))
  await db
    .update(courses)
    .set(
      z.enum(["thumbnail", "trailer"]).parse(kind) === "thumbnail"
        ? { thumbnailFileId: fileId, thumbnailPath: filePath }
        : { trailerFileId: fileId, trailerPath: filePath }
    )
    .where(eq(courses.id, courseId))
  Sentry.logger.info("Admin: course media replaced", { course_id: courseId, kind, replaced_existing: !!old?.[kind] })
  after(() => deleteFiles([old?.[kind]]))
  refresh()
}

// A course someone bought can't be deleted: the page offers Archive instead, and purchases' RESTRICT FK blocks it here too.
export async function deleteCourse(courseId: number) {
  await requireAdmin()
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    with: { sections: { with: { lessons: { columns: { videoFileId: true } } } } },
  })
  await db.delete(courses).where(eq(courses.id, courseId))
  if (course) {
    const videos = course.sections.flatMap((s) => s.lessons.map((l) => l.videoFileId))
    Sentry.logger.warn("Admin: course deleted", { course_id: courseId, course_slug: course.slug, lessons_deleted: videos.length })
    after(() => deleteFiles([course.thumbnailFileId, course.trailerFileId, ...videos]))
  }
  redirect("/admin")
}

// ---- Sections ----

export async function createSection(courseId: number, formData: FormData) {
  await requireAdmin()
  await db.insert(sections).values({ courseId, title: title.parse(formData.get("title")), position: nextPosition("sections", courseId) })
  refresh()
}

export async function renameSection(sectionId: number, newTitle: string) {
  await requireAdmin()
  await db.update(sections).set({ title: title.parse(newTitle) }).where(eq(sections.id, sectionId))
  refresh()
}

export async function deleteSection(sectionId: number) {
  await requireAdmin()
  const videos = await db.select({ id: lessons.videoFileId }).from(lessons).where(eq(lessons.sectionId, sectionId))
  await db.delete(sections).where(eq(sections.id, sectionId))
  Sentry.logger.warn("Admin: section deleted", { section_id: sectionId, lessons_deleted: videos.length })
  after(() => deleteFiles(videos.map((v) => v.id)))
  refresh()
}

export async function reorderSections(courseId: number, order: number[]) {
  await requireAdmin()
  await db.transaction(async (tx) => {
    for (const [position, id] of ids.parse(order).entries())
      await tx.update(sections).set({ position }).where(and(eq(sections.id, id), eq(sections.courseId, courseId)))
  })
  refresh()
}

// ---- Lessons ----

export async function createLesson(sectionId: number, formData: FormData) {
  await requireAdmin()
  const t = title.parse(formData.get("title"))
  const section = await db.query.sections.findFirst({ where: eq(sections.id, sectionId), columns: { courseId: true } })
  if (!section) throw new Error("Section not found")
  await db.insert(lessons).values({
    sectionId,
    title: t,
    slug: uniqueSlug(slugify(t), await lessonSlugs(section.courseId)),
    position: nextPosition("lessons", sectionId),
  })
  refresh()
}

const lessonInput = z.object({
  title,
  slug,
  sectionId: z.coerce.number().int(),
  contentMd: z.string().max(100_000),
  // Switches submit "on" when checked and nothing when not, like checkboxes.
  isFreePreview: z.literal("on").optional().transform(Boolean),
  isPublished: z.literal("on").optional().transform(Boolean),
})

export async function updateLesson(lessonId: number, _: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const input = lessonInput.safeParse(Object.fromEntries(formData))
  if (!input.success) return { error: input.error.issues[0].message }
  const data = input.data

  const lesson = await db.query.lessons.findFirst({ where: eq(lessons.id, lessonId), with: { section: true } })
  if (!lesson) return { error: "This lesson no longer exists" }
  const { courseId } = lesson.section
  const target = await db.query.sections.findFirst({ where: and(eq(sections.id, data.sectionId), eq(sections.courseId, courseId)) })
  if (!target) return { error: "Pick a section from this course" }
  if ((await lessonSlugs(courseId, lessonId)).includes(data.slug)) return { error: "Another lesson in this course already uses that slug" }

  // A lesson moved to another section goes to the end of it.
  const moved = data.sectionId !== lesson.sectionId
  await db
    .update(lessons)
    .set({ ...data, position: moved ? nextPosition("lessons", data.sectionId) : undefined })
    .where(eq(lessons.id, lessonId))
  Sentry.logger.info("Admin: lesson updated", {
    lesson_id: lessonId,
    course_id: courseId,
    lesson_slug: data.slug,
    published: data.isPublished,
    free_preview: data.isFreePreview,
    moved_section: moved,
  })
  refresh()
  return { saved: true }
}

export async function saveLessonVideo(lessonId: number, file: z.input<typeof media>) {
  await requireAdmin()
  const { fileId, filePath, durationS = 0 } = media.parse(file)
  const [old] = await db.select({ fileId: lessons.videoFileId }).from(lessons).where(eq(lessons.id, lessonId))
  await db.update(lessons).set({ videoFileId: fileId, videoPath: filePath, durationS }).where(eq(lessons.id, lessonId))
  // duration_s 0 means the upload's metadata had no duration: progress and auto-complete won't work for this lesson.
  Sentry.logger.info("Admin: lesson video replaced", { lesson_id: lessonId, duration_s: durationS, replaced_existing: !!old?.fileId })
  after(() => deleteFiles([old?.fileId]))
  refresh()
}

export async function deleteLesson(lessonId: number) {
  await requireAdmin()
  const lesson = await db.query.lessons.findFirst({ where: eq(lessons.id, lessonId), with: { section: { columns: { courseId: true } } } })
  if (!lesson) redirect("/admin")
  await db.delete(lessons).where(eq(lessons.id, lessonId))
  Sentry.logger.warn("Admin: lesson deleted", { lesson_id: lessonId, course_id: lesson.section.courseId, lesson_slug: lesson.slug })
  after(() => deleteFiles([lesson.videoFileId]))
  redirect(`/admin/courses/${lesson.section.courseId}`)
}

export async function reorderLessons(sectionId: number, order: number[]) {
  await requireAdmin()
  await db.transaction(async (tx) => {
    for (const [position, id] of ids.parse(order).entries())
      await tx.update(lessons).set({ position }).where(and(eq(lessons.id, id), eq(lessons.sectionId, sectionId)))
  })
  refresh()
}
