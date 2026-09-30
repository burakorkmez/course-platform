"use server"

import * as Sentry from "@sentry/nextjs"
import { refresh } from "next/cache"
import { headers } from "next/headers"
import { and, eq, isNull, sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/lib/db"
import { lessonComments, lessonProgress } from "@/lib/db/schema"
import { getCourse, getViewer } from "@/lib/catalog"
import { isFileOrDerived, signedUrl } from "@/lib/imagekit"
import { AI_LIMIT_MESSAGE, discussionView, lessonTutor, spendAiCall } from "@/lib/tutor"

// The lesson, if this visitor may watch it: the same visibility and lock rules the lesson page renders with.
async function watchable(courseSlug: string, lessonSlug: string) {
  const lesson = (await getCourse(courseSlug))?.lessons.find((l) => l.slug === lessonSlug)
  return lesson && !lesson.locked ? lesson : null
}

// The player's signerFn. It signs only this lesson's video and the files ImageKit derives from it (poster, seek
// thumbnails, ?tr= renditions), so it can't be used to unlock any other private file.
export async function signLessonUrl(courseSlug: string, lessonSlug: string, url: string) {
  return Sentry.withServerActionInstrumentation("signLessonUrl", { headers: await headers() }, async () => {
    const lesson = await watchable(courseSlug, lessonSlug)
    const where = { course_slug: courseSlug, lesson_slug: lessonSlug }
    // Successful signs aren't logged: the player asks for every segment. Refusals are: "locked" from a paying user
    // means an access bug (or an expired session mid-video); "not_this_lessons_file" means someone probing for files.
    if (!lesson?.videoPath) {
      Sentry.logger.warn("Lesson video signing refused", { ...where, reason: "locked" })
      throw new Error("You can't watch this lesson")
    }
    const href = new URL(z.string().parse(url)).href
    if (!isFileOrDerived(href, lesson.videoPath)) {
      Sentry.logger.warn("Lesson video signing refused", { ...where, reason: "not_this_lessons_file" })
      throw new Error("That URL isn't part of this lesson")
    }
    return signedUrl(href, lesson.durationS + 3600)
  })
}

const progressInput = z.object({
  positionS: z.number().min(0).max(86_400).optional(),
  completed: z.boolean().optional(),
})

// Saves where the viewer is in a lesson and/or whether it's complete. Signed-out previews aren't tracked.
export async function saveProgress(courseSlug: string, lessonSlug: string, input: z.input<typeof progressInput>) {
  return Sentry.withServerActionInstrumentation("saveProgress", { headers: await headers() }, async () => {
    const { userId } = await getViewer()
    const lesson = userId ? await watchable(courseSlug, lessonSlug) : null
    if (!userId || !lesson) return
    const { positionS, completed } = progressInput.parse(input)
    const position = positionS === undefined ? undefined : Math.floor(positionS)

    await db
      .insert(lessonProgress)
      .values({ userId, lessonId: lesson.id, positionS: position ?? 0, completedAt: completed ? new Date() : null })
      .onConflictDoUpdate({
        target: [lessonProgress.userId, lessonProgress.lessonId],
        set: {
          positionS: position,
          // Completing again keeps the first completion time; undefined leaves the column alone.
          completedAt: completed === undefined ? undefined : completed ? sql`coalesce(lesson_progress.completed_at, now())` : null,
          updatedAt: new Date(),
        },
      })
    // Position saves happen every few seconds; only a completion change needs the page to re-render (and a log: these
    // are where students finish or drop off, per course and lesson).
    if (completed !== undefined) {
      Sentry.logger.info(completed ? "Lesson completed" : "Lesson marked incomplete", {
        course_slug: courseSlug,
        lesson_slug: lessonSlug,
        lesson_id: lesson.id,
        // The player auto-completes at 90% and sends the position along; the manual toggle doesn't.
        source: positionS === undefined ? "manual" : "player",
      })
      refresh()
    }
  })
}

// A question in this lesson's discussion (not a reply), if there is one with that id.
async function findQuestion(lessonId: number, id: number) {
  const [question] = await db
    .select()
    .from(lessonComments)
    .where(and(eq(lessonComments.id, id), eq(lessonComments.lessonId, lessonId), isNull(lessonComments.parentId)))
  return question
}

const commentInput = z.object({
  parentId: z.number().int().nullable(),
  body: z.string().trim().min(1).max(2000),
})

// Posts a question in the lesson's discussion, or a reply under one (replies don't nest). Signed-in viewers who can
// watch the lesson only.
export async function postComment(courseSlug: string, lessonSlug: string, parentId: number | null, formData: FormData) {
  return Sentry.withServerActionInstrumentation("postComment", { headers: await headers() }, async () => {
    const { userId } = await getViewer()
    const lesson = userId ? await watchable(courseSlug, lessonSlug) : null
    if (!userId || !lesson) throw new Error("You can't comment on this lesson")
    const input = commentInput.parse({ parentId, body: formData.get("body") })
    if (input.parentId !== null && !(await findQuestion(lesson.id, input.parentId))) throw new Error("That question isn't on this lesson")

    await db.insert(lessonComments).values({ lessonId: lesson.id, userId, ...input })
    Sentry.logger.info(input.parentId === null ? "Lesson question posted" : "Lesson reply posted", {
      course_slug: courseSlug,
      lesson_slug: lessonSlug,
      lesson_id: lesson.id,
    })
    refresh()
  })
}

// The AI tutor answers a question in the lesson's discussion, once. Anyone who can post there can ask it to, within
// their daily AI limit (which comes back as { error } for the button to show, since it isn't a failure).
export async function askAi(courseSlug: string, lessonSlug: string, questionId: number) {
  return Sentry.withServerActionInstrumentation("askAi", { headers: await headers() }, async () => {
    const { userId, admin } = await getViewer()
    const course = userId ? await getCourse(courseSlug) : null
    const lesson = course?.lessons.find((l) => l.slug === lessonSlug)
    if (!userId || !course || !lesson || lesson.locked) throw new Error("You can't ask about this lesson")
    const question = await findQuestion(lesson.id, z.number().int().parse(questionId))
    if (!question) throw new Error("That question isn't on this lesson")
    const [answer] = await db
      .select({ id: lessonComments.id })
      .from(lessonComments)
      .where(and(eq(lessonComments.parentId, question.id), isNull(lessonComments.userId)))
    if (!answer) {
      if (!admin && !(await spendAiCall(userId))) return { error: AI_LIMIT_MESSAGE }
      // One Sentry conversation per question: the agent run, its model and tool calls, tokens and latency.
      Sentry.setConversationId(`lesson-question-${question.id}`)
      // The answer is public, so the tutor reads the course as everyone in this discussion sees it, not as the asker.
      const { text } = await lessonTutor(discussionView(course, lesson), lesson, "comment-answer").generate({
        prompt: `A student asked this in the lesson's discussion. Answer them:\n\n${question.body}`,
      })
      if (!text.trim()) throw new Error("The tutor gave an empty answer")
      // Two clicks at once: the unique index keeps the first answer and drops this one.
      await db.insert(lessonComments).values({ lessonId: lesson.id, parentId: question.id, body: text.trim() }).onConflictDoNothing()
      Sentry.logger.info("AI answered a lesson question", { course_slug: courseSlug, lesson_slug: lessonSlug, lesson_id: lesson.id })
    }
    refresh()
  })
}
