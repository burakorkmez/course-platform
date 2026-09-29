import { cache } from "react"
import { connection } from "next/server"
import { asc, desc, eq, type SQL } from "drizzle-orm"
import { auth, isAdmin } from "@/lib/auth/server"
import { db } from "@/lib/db"
import { courses, lessonProgress, lessons, purchases, sections, subscriptions } from "@/lib/db/schema"
import { hasCourseAccess, type Entitlements } from "@/lib/access"
import { clock, formatDuration } from "@/lib/utils"

// The student-facing catalog. Pages render per request straight from Postgres, so admin edits show up immediately.
// ponytail: no caching yet; add 'use cache' + cacheTag('catalog') (with cacheComponents) when traffic warrants it.

// Who's looking, what they've bought, and how far they've got in every lesson they've started. Cached per request.
export const getViewer = cache(async () => {
  await connection()
  const { data } = await auth.getSession()
  const user = data?.user
  const [progress, owned, subscribed] = user
    ? await Promise.all([
        db.select().from(lessonProgress).where(eq(lessonProgress.userId, user.id)),
        db.select().from(purchases).where(eq(purchases.userId, user.id)),
        db.select().from(subscriptions).where(eq(subscriptions.userId, user.id)),
      ])
    : [[], [], []]
  const entitlements: Entitlements = { purchases: owned, subscriptions: subscribed }
  return { user, userId: user?.id, admin: isAdmin(user), entitlements, progress: new Map(progress.map((r) => [r.lessonId, r])) }
})
type Viewer = Awaited<ReturnType<typeof getViewer>>

const findCourses = (where: SQL) =>
  db.query.courses.findMany({
    where,
    orderBy: desc(courses.createdAt),
    with: {
      sections: {
        orderBy: [asc(sections.position), asc(sections.id)],
        with: { lessons: { orderBy: [asc(lessons.position), asc(lessons.id)] } },
      },
    },
  })

type Row = Awaited<ReturnType<typeof findCourses>>[number]

const canAccess = (courseId: number, { admin, entitlements }: Viewer) => admin || hasCourseAccess(entitlements, courseId)

function toCourse(row: Row, viewer: Viewer) {
  const { admin, userId, progress } = viewer
  const access = canAccess(row.id, viewer)
  // Students see published lessons only, and a section only once it has one. Admins see everything.
  let index = 0
  const courseSections = row.sections
    .map((s) => ({
      title: s.title,
      lessons: s.lessons
        .filter((l) => admin || l.isPublished)
        .map((l) => ({
          id: l.id,
          slug: l.slug,
          title: l.title,
          section: s.title,
          index: index++,
          duration: clock(l.durationS),
          durationS: l.durationS,
          free: l.isFreePreview,
          locked: !access && !l.isFreePreview,
          videoPath: l.videoPath,
          contentMd: l.contentMd,
          done: !!progress.get(l.id)?.completedAt,
          positionS: progress.get(l.id)?.positionS ?? 0,
        })),
    }))
    .filter((s) => s.lessons.length)
  const courseLessons = courseSections.flatMap((s) => s.lessons)
  const completed = courseLessons.filter((l) => l.done).length

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    description: row.descriptionMd,
    level: row.level,
    outcomes: row.outcomes,
    thumbnail: row.thumbnailPath,
    trailer: row.trailerPath,
    // The Polar product that sells this course on its own; null means All Access only.
    productId: row.polarProductId,
    status: row.status,
    updated: row.updatedAt.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    signedIn: !!userId,
    sections: courseSections,
    lessons: courseLessons,
    stats: { lessons: courseLessons.length, duration: formatDuration(courseLessons.reduce((t, l) => t + l.durationS, 0)) },
    progress: {
      // Full access to every lesson: admin, All Access, or bought on its own.
      owned: access,
      completed,
      total: courseLessons.length,
      percent: courseLessons.length ? Math.round((completed / courseLessons.length) * 100) : 0,
    },
  }
}

export type Course = ReturnType<typeof toCourse>
export type Lesson = Course["lessons"][number]

// Published courses, newest first.
export async function getCourses() {
  const viewer = await getViewer()
  return (await findCourses(eq(courses.status, "published"))).map((row) => toCourse(row, viewer))
}

// Published → everyone. Archived → people with access (so it stays watchable for them). Draft → admin only.
// Cached per request so generateMetadata, the page and server actions share one query.
export const getCourse = cache(async (slug: string) => {
  const viewer = await getViewer()
  const [row] = await findCourses(eq(courses.slug, slug))
  const visible = row && (row.status === "published" || (row.status === "archived" && canAccess(row.id, viewer)) || viewer.admin)
  return visible ? toCourse(row, viewer) : null
})

// The lesson to pick up from: the first one not completed yet (or the last one when everything is done).
export const resumeLesson = (course: Course) => course.lessons.find((l) => !l.done) ?? course.lessons.at(-1)
