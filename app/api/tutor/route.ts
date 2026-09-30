import * as Sentry from "@sentry/nextjs"
import { createAgentUIStreamResponse } from "ai"
import { z } from "zod"
import { getCourse, getViewer } from "@/lib/catalog"
import { AI_LIMIT_MESSAGE, lessonTutor, spendAiCall } from "@/lib/tutor"

// What useChat sends: the chat's id and its messages, plus the lesson being watched (the transport's body).
const chatRequest = z.object({
  id: z.string().min(1).max(100),
  courseSlug: z.string(),
  lessonSlug: z.string(),
  messages: z.array(z.unknown()).min(1).max(40),
})

// The lesson tutor's chat endpoint: signed-in students, on lessons they can watch, within their daily AI limit.
export async function POST(request: Request) {
  const { userId, admin } = await getViewer()
  if (!userId) return new Response("Sign in to ask the tutor", { status: 401 })

  const input = chatRequest.safeParse(await request.json().catch(() => null))
  if (!input.success) return new Response("Bad request", { status: 400 })
  const { id, courseSlug, lessonSlug, messages } = input.data
  // The whole history goes to the model on every turn, so its size is what a request costs.
  if (JSON.stringify(messages).length > 200_000) return new Response("This chat is too long. Start a new one.", { status: 413 })

  const course = await getCourse(courseSlug)
  const lesson = course?.lessons.find((l) => l.slug === lessonSlug)
  // Same rule as the video: no tutor on a lesson this student can't watch.
  if (!course || !lesson || lesson.locked) return new Response("You can't ask about this lesson", { status: 403 })
  // useChat shows this text in the chat panel.
  if (!admin && !(await spendAiCall(userId))) return new Response(AI_LIMIT_MESSAGE, { status: 429 })

  // Every AI span of this turn joins the chat's conversation in Sentry. getViewer has already set the user.
  Sentry.setConversationId(id)
  return createAgentUIStreamResponse({
    agent: lessonTutor(course, lesson),
    uiMessages: messages,
    abortSignal: request.signal,
    // The stream catches model errors (bad key, rate limit, timeout) before Next sees them, so they're reported here.
    // Tool errors pass through too, but Sentry has already captured those and skips an error it has seen.
    onError: (error) => {
      Sentry.captureException(error)
      return "The tutor couldn't answer that. Please try again."
    },
  })
}
