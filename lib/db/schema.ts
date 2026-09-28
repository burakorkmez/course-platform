import { relations } from "drizzle-orm"
import { boolean, integer, pgEnum, pgSchema, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core"

// Column names are snake_cased by `casing` in lib/db/index.ts and drizzle.config.ts.
// ponytail: purchases, subscriptions and webhook_events land with Phase 4.

export const courseStatus = pgEnum("course_status", ["draft", "published", "archived"])
export const courseLevel = pgEnum("course_level", ["Beginner", "Intermediate", "Advanced", "All levels"])

export const courses = pgTable("courses", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  slug: text().notNull().unique(),
  title: text().notNull(),
  tagline: text().notNull().default(""),
  descriptionMd: text().notNull().default(""),
  level: courseLevel().notNull().default("All levels"),
  // "What you'll learn" bullets on the course page.
  outcomes: text().array().notNull().default([]),
  // ImageKit file ids are kept so a replaced or deleted file can be removed from ImageKit too.
  thumbnailFileId: text(),
  thumbnailPath: text(),
  trailerFileId: text(),
  trailerPath: text(),
  polarProductId: text().unique(),
  status: courseStatus().notNull().default("draft"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const sections = pgTable("sections", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  courseId: integer()
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text().notNull(),
  position: integer().notNull().default(0),
})

// Slugs are unique per course; lessons don't carry course_id, so the lesson action checks it.
export const lessons = pgTable("lessons", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sectionId: integer()
    .notNull()
    .references(() => sections.id, { onDelete: "cascade" }),
  slug: text().notNull(),
  title: text().notNull(),
  contentMd: text().notNull().default(""),
  videoFileId: text(),
  videoPath: text(),
  durationS: integer().notNull().default(0),
  isFreePreview: boolean().notNull().default(false),
  isPublished: boolean().notNull().default(false),
  position: integer().notNull().default(0),
})

// Managed by Neon Auth and left out of migrations (schemaFilter); declared only so progress can reference it.
export const authUsers = pgSchema("neon_auth").table("user", { id: uuid().primaryKey() })

// One row per user and lesson they've started. A deleted account or lesson takes its progress with it.
export const lessonProgress = pgTable(
  "lesson_progress",
  {
    userId: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    lessonId: integer()
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    positionS: integer().notNull().default(0),
    completedAt: timestamp({ withTimezone: true }),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] })]
)

export const coursesRelations = relations(courses, ({ many }) => ({ sections: many(sections) }))

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  course: one(courses, { fields: [sections.courseId], references: [courses.id] }),
  lessons: many(lessons),
}))

export const lessonsRelations = relations(lessons, ({ one }) => ({
  section: one(sections, { fields: [lessons.sectionId], references: [sections.id] }),
}))
