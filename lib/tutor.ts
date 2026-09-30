import * as Sentry from "@sentry/nextjs"
import { openai } from "@ai-sdk/openai"
import { isStepCount, tool, ToolLoopAgent, type InferAgentUIMessage } from "ai"
import { sql } from "drizzle-orm"
import { z } from "zod"
import type { Course, Lesson } from "@/lib/catalog"
import { db } from "@/lib/db"
import { aiUsage } from "@/lib/db/schema"

// The AI tutor on the lesson page. It knows the lesson being watched and can read the course's other lessons, never a
// locked one. Sentry traces every run with no setup (the AI SDK reports to it): the agent, each model and tool call,
// tokens and latency.

// Each student's daily AI budget, shared by the tutor chat and "Ask AI": plenty for studying, not for scripting.
// Admins aren't counted.
export const DAILY_AI_LIMIT = 100
export const AI_LIMIT_MESSAGE = `You've used today's ${DAILY_AI_LIMIT} AI answers. More tomorrow (the limit resets at midnight UTC).`

// Spends one of the student's AI calls for today (UTC). False once they're used up, and nothing is spent then. It's a
// single upsert, so parallel requests can't overshoot the limit.
export async function spendAiCall(userId: string) {
  const [spent] = await db
    .insert(aiUsage)
    .values({ userId, day: new Date().toISOString().slice(0, 10), count: 1 })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.day],
      set: { count: sql`${aiUsage.count} + 1` },
      setWhere: sql`${aiUsage.count} < ${DAILY_AI_LIMIT}`,
    })
    .returning({ count: aiUsage.count })
  // One now and then is a keen student; the same user every day is someone scripting it.
  if (!spent) Sentry.logger.warn("AI daily limit reached", { limit: DAILY_AI_LIMIT })
  return !!spent
}

// Another lesson's notes. A locked lesson gives its title only, as the curriculum does: paid notes never leak.
export function readLesson(course: Course, slug: string) {
  const lesson = course.lessons.find((l) => l.slug === slug)
  // An unknown slug means the model made one up. Thrown, so Sentry records a failed tool call (and the model retries).
  if (!lesson) throw new Error(`No lesson "${slug}" in this course`)
  if (lesson.locked) {
    // Students asking about lessons they haven't unlocked: interest in the full course, per lesson.
    Sentry.logger.info("Tutor asked about a locked lesson", { course_slug: course.slug, lesson_slug: slug })
    return { title: lesson.title, locked: true }
  }
  return { title: lesson.title, section: lesson.section, notes: lesson.contentMd || "(no notes yet)" }
}

// The course as everyone who can read a lesson's discussion sees it. A free preview's discussion is open to anyone, so
// an answer posted there may only draw on the free previews, whoever asked for it. Nor on the asker's progress.
export const discussionView = (course: Course, lesson: Lesson): Course => ({
  ...course,
  lessons: course.lessons.map((l) => ({ ...l, done: false, locked: l.locked || (lesson.free && !l.free) })),
})

// agent names it in Sentry, where its runs show up as "invoke_agent <agent>": the chat, or answers in the discussion.
export function lessonTutor(course: Course, lesson: Lesson, agent: "lesson-tutor" | "comment-answer" = "lesson-tutor") {
  const outline = course.lessons
    .map((l) => `${l.index + 1}. ${l.slug}: ${l.title} (${l.section})${l.done ? " [completed]" : ""}${l.locked ? " [locked]" : ""}`)
    .join("\n")

  return new ToolLoopAgent({
    model: openai("gpt-5.4-mini"),
    providerOptions: { openai: { reasoningEffort: "low" } },
    instructions: `You are the tutor on Lumen, an online course platform. A student is watching lesson ${lesson.index + 1} of "${course.title}": "${lesson.title}" (section: ${lesson.section}).

Help them understand this lesson, grounded in its notes below. When a question touches another lesson, read it with readLesson (slugs are in the outline) instead of guessing what it covers. If a lesson is locked, say it unlocks with the full course and don't guess its content beyond the title. If the notes don't cover something, say so, then answer from general knowledge.

Be brief and friendly: a few sentences or a short list. Plain text, no headings or tables; \`backticks\` for code.

Course outline:
${outline}

Notes for this lesson:
${lesson.contentMd || "(This lesson has no written notes yet. Go by its title and the outline.)"}`,
    tools: {
      readLesson: tool({
        description: "Read the notes of another lesson in this course.",
        inputSchema: z.object({ slug: z.string().describe("The lesson's slug from the course outline") }),
        execute: async ({ slug }) => readLesson(course, slug),
      }),
    },
    // A couple of lookups and an answer. Also caps what one question can cost.
    stopWhen: isStepCount(4),
    telemetry: { functionId: agent },
  })
}

export type TutorMessage = InferAgentUIMessage<ReturnType<typeof lessonTutor>>
