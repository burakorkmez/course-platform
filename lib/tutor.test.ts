import { afterEach, describe, expect, it, vi } from "vitest"
import type { PGlite } from "@electric-sql/pglite"
import type { PgliteDatabase } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import type { Course, Lesson } from "@/lib/catalog"
import * as schema from "@/lib/db/schema"
import { aiUsage } from "@/lib/db/schema"

// The daily limit is one SQL upsert, so it runs against a real (in-memory) Postgres.
vi.mock("@/lib/db", async () => {
  const { PGlite } = await import("@electric-sql/pglite")
  const { drizzle } = await import("drizzle-orm/pglite")
  return { db: drizzle({ client: new PGlite(), schema: await import("@/lib/db/schema"), casing: "snake_case" }) }
})
const db = (await import("@/lib/db")).db as unknown as PgliteDatabase<typeof schema> & { $client: PGlite }
const { DAILY_AI_LIMIT, discussionView, readLesson, spendAiCall } = await import("@/lib/tutor")

const lesson = (slug: string, locked: boolean, free = false) =>
  ({ slug, title: slug, section: "Basics", locked, free, contentMd: `${slug} notes` }) as unknown as Lesson
const course = (...lessons: Lesson[]) => ({ slug: "course", lessons }) as unknown as Course

afterEach(() => vi.useRealTimers())

describe("tutor", () => {
  it("reads unlocked lessons and never a locked one's notes", () => {
    const c = course(lesson("intro", false), lesson("paid", true))
    expect(readLesson(c, "intro")).toEqual({ title: "intro", section: "Basics", notes: "intro notes" })
    expect(readLesson(c, "paid")).toEqual({ title: "paid", locked: true })
    expect(() => readLesson(c, "made-up")).toThrow()
  })

  it("answers in a free preview's discussion from free previews only, even for an owner", () => {
    const [intro, paid] = [lesson("intro", false, true), lesson("paid", false)]
    const owned = course(intro, paid)
    expect(readLesson(discussionView(owned, intro), "paid")).toEqual({ title: "paid", locked: true })
    expect(readLesson(discussionView(owned, intro), "intro")).toMatchObject({ notes: "intro notes" })
    // A paid lesson's discussion is for people with access, who can read every lesson.
    expect(readLesson(discussionView(owned, paid), "paid")).toMatchObject({ notes: "paid notes" })
  })

  it("spends AI calls up to the daily limit, and starts over the next day", async () => {
    const user = "5f0c7c2e-8a7b-4a53-9a4f-0c1d2e3f4a5b"
    // Neon Auth's table, which the migrations reference but don't create.
    await db.$client.exec(`create schema neon_auth; create table neon_auth.user (id uuid primary key);`)
    await migrate(db, { migrationsFolder: "drizzle" })
    await db.$client.query("insert into neon_auth.user (id) values ($1)", [user])
    const burst = () => Promise.all(Array.from({ length: DAILY_AI_LIMIT + 20 }, () => spendAiCall(user)))

    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-09-30T23:00:00Z") })
    expect((await burst()).filter(Boolean)).toHaveLength(DAILY_AI_LIMIT)
    // Refused calls aren't counted.
    expect(await db.select().from(aiUsage)).toMatchObject([{ day: "2026-09-30", count: DAILY_AI_LIMIT }])

    vi.setSystemTime(new Date("2026-10-01T00:30:00Z"))
    expect(await spendAiCall(user)).toBe(true)
  })
})
