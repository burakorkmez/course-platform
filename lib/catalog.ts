import { cache } from "react"
import { connection } from "next/server"
import { asc, desc, eq, type SQL } from "drizzle-orm"
import { auth, isAdmin } from "@/lib/auth/server"
import { db } from "@/lib/db"
import { courses, lessonProgress, lessons, sections } from "@/lib/db/schema"
import { clock, formatDuration } from "@/lib/utils"

// The student-facing catalog. Pages render per request straight from Postgres, so admin edits show up immediately.
// ponytail: no caching yet; add 'use cache' + cacheTag('catalog') (with cacheComponents) when traffic warrants it.

// ponytail: fixed until Phase 4 reads course prices from Polar.
export const PRICE = "$25"

// Who's looking, and how far they've got in every lesson they've started. Cached per request.
export const getViewer = cache(async () => {
  await connection()
  const { data } = await auth.getSession()
  const user = data?.user
  const rows = user ? await db.select().from(lessonProgress).where(eq(lessonProgress.userId, user.id)) : []
  return { userId: user?.id, admin: isAdmin(user), progress: new Map(rows.map((r) => [r.lessonId, r])) }
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

function toCourse(row: Row, { admin, userId, progress }: Viewer) {
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
          // ponytail: no purchases until Phase 4, so only admins and free previews unlock.
          locked: !admin && !l.isFreePreview,
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
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    description: row.descriptionMd,
    level: row.level,
    outcomes: row.outcomes,
    thumbnail: row.thumbnailPath,
    trailer: row.trailerPath,
    status: row.status,
    updated: row.updatedAt.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    signedIn: !!userId,
    sections: courseSections,
    lessons: courseLessons,
    stats: { lessons: courseLessons.length, duration: formatDuration(courseLessons.reduce((t, l) => t + l.durationS, 0)) },
    progress: {
      // Full access to every lesson. ponytail: admins only until Phase 4 adds purchases and All Access.
      owned: admin,
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

// Published → everyone. Draft and archived → admin only for now (archived opens to owners once purchases exist).
// Cached per request so generateMetadata, the page and server actions share one query.
export const getCourse = cache(async (slug: string) => {
  const viewer = await getViewer()
  const [row] = await findCourses(eq(courses.slug, slug))
  return row && (row.status === "published" || viewer.admin) ? toCourse(row, viewer) : null
})

// The lesson to pick up from: the first one not completed yet (or the last one when everything is done).
export const resumeLesson = (course: Course) => course.lessons.find((l) => !l.done) ?? course.lessons.at(-1)
