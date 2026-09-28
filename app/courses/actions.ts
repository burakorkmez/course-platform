"use server"

import { refresh } from "next/cache"
import { sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/lib/db"
import { lessonProgress } from "@/lib/db/schema"
import { getCourse, getViewer } from "@/lib/catalog"
import { isFileOrDerived, signedUrl } from "@/lib/imagekit"

// The lesson, if this visitor may watch it: the same visibility and lock rules the lesson page renders with.
async function watchable(courseSlug: string, lessonSlug: string) {
  const lesson = (await getCourse(courseSlug))?.lessons.find((l) => l.slug === lessonSlug)
  return lesson && !lesson.locked ? lesson : null
}

// The player's signerFn. It signs only this lesson's video and the files ImageKit derives from it (poster, seek
// thumbnails, ?tr= renditions), so it can't be used to unlock any other private file.
export async function signLessonUrl(courseSlug: string, lessonSlug: string, url: string) {
  const lesson = await watchable(courseSlug, lessonSlug)
  if (!lesson?.videoPath) throw new Error("You can't watch this lesson")
  const href = new URL(z.string().parse(url)).href
  if (!isFileOrDerived(href, lesson.videoPath)) throw new Error("That URL isn't part of this lesson")
  return signedUrl(href, lesson.durationS + 3600)
}

const progressInput = z.object({
  positionS: z.number().min(0).max(86_400).optional(),
  completed: z.boolean().optional(),
})

// Saves where the viewer is in a lesson and/or whether it's complete. Signed-out previews aren't tracked.
export async function saveProgress(courseSlug: string, lessonSlug: string, input: z.input<typeof progressInput>) {
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
  // Position saves happen every few seconds; only a completion change needs the page to re-render.
  if (completed !== undefined) refresh()
}
