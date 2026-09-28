import Link from "next/link"
import { desc, sql } from "drizzle-orm"
import { Image } from "@imagekit/next"
import { BookOpen, ChevronRight, ImageIcon, Plus } from "lucide-react"
import { requireAdmin } from "@/lib/auth/server"
import { db } from "@/lib/db"
import { formatDuration } from "@/lib/utils"
import { courses } from "@/lib/db/schema"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createCourse } from "./actions"
import { StatusBadge, SubmitButton } from "./components"

export default async function AdminPage() {
  await requireAdmin()
  const [list, users] = await Promise.all([
    db.query.courses.findMany({
      orderBy: desc(courses.updatedAt),
      with: { sections: { columns: { id: true }, with: { lessons: { columns: { durationS: true, isPublished: true } } } } },
    }),
    db.execute<{ count: number }>(sql`select count(*)::int as count from neon_auth.user`),
  ])

  const rows = list.map((c) => {
    const lessons = c.sections.flatMap((s) => s.lessons)
    return { ...c, lessons: lessons.length, seconds: lessons.reduce((t, l) => t + l.durationS, 0) }
  })
  const allLessons = list.flatMap((c) => c.sections.flatMap((s) => s.lessons))
  const published = list.filter((c) => c.status === "published").length
  const stats = [
    { label: "Courses", value: list.length, hint: `${published} published · ${list.length - published} not live` },
    { label: "Lessons", value: allLessons.length, hint: `${allLessons.filter((l) => l.isPublished).length} published` },
    { label: "Video", value: formatDuration(rows.reduce((t, c) => t + c.seconds, 0)), hint: "across all lessons" },
    { label: "Students", value: users.rows[0].count, hint: "signed-up accounts" },
  ]

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-primary">Admin</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Courses</h1>
          <p className="mt-2 text-muted-foreground">Create courses, upload their media and arrange the curriculum.</p>
        </div>
        <form action={createCourse} className="flex w-full gap-2 sm:w-auto">
          <Input name="title" required maxLength={200} placeholder="New course title" aria-label="New course title" className="h-9 sm:w-64" />
          <SubmitButton size="lg">
            <Plus data-icon="inline-start" /> New course
          </SubmitButton>
        </form>
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5">
            <dt className="text-sm text-muted-foreground">{s.label}</dt>
            <dd className="mt-2 font-heading text-3xl font-semibold tracking-tight">{s.value}</dd>
            <dd className="mt-1 text-xs text-muted-foreground">{s.hint}</dd>
          </div>
        ))}
      </dl>

      {rows.length ? (
        <div className="mt-8 overflow-hidden rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Lessons</TableHead>
                <TableHead className="text-right">Length</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="py-3 pl-5">
                    <Link href={`/admin/courses/${c.id}`} className="group flex items-center gap-4">
                      <span className="relative grid aspect-video w-24 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted">
                        {c.thumbnailPath ? (
                          <Image src={c.thumbnailPath} alt="" fill sizes="96px" className="object-cover" />
                        ) : (
                          <ImageIcon className="size-4 text-muted-foreground" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium group-hover:text-primary">{c.title}</span>
                        <span className="block truncate font-mono text-xs text-muted-foreground">/{c.slug}</span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="text-right">{c.lessons}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">{formatDuration(c.seconds)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card/40 px-6 py-16 text-center">
          <BookOpen className="size-10 text-primary/60" strokeWidth={1.25} />
          <h2 className="font-heading text-lg font-medium">No courses yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">Give your first course a title above. It starts as a draft, so only you can see it.</p>
        </div>
      )}
    </>
  )
}
