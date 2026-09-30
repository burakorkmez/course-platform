import Link from "next/link"
import { MessagesSquare, Sparkles } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { getComments, getViewer, type Comment } from "@/lib/catalog"
import { timeAgo } from "@/lib/utils"
import { askAi, postComment } from "./actions"
import { CommentForm, QuestionActions } from "./comment-form"

// The lesson's discussion, under its notes. Everyone who can watch the lesson reads it; signed-in viewers ask, reply,
// and can have the AI tutor answer a question.
export async function LessonComments({ courseSlug, lessonSlug, lessonId }: { courseSlug: string; lessonSlug: string; lessonId: number }) {
  const [{ user }, questions] = await Promise.all([getViewer(), getComments(lessonId)])
  const post = (parentId: number | null) => postComment.bind(null, courseSlug, lessonSlug, parentId)

  return (
    <section id="discussion" className="mt-10 max-w-2xl scroll-mt-20 border-t pt-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-heading text-lg font-semibold">Discussion</h2>
        {questions.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {questions.length} {questions.length === 1 ? "question" : "questions"}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Stuck on something? Ask here. Classmates can reply, and the AI tutor answers in seconds.</p>

      {user ? (
        <div className="mt-5 flex gap-3">
          <UserAvatar name={user.name} image={user.image} />
          <CommentForm action={post(null)} placeholder="Ask a question about this lesson…" label="Post question" />
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Sign in to ask a question or join the discussion.</p>
          <Link href={`/sign-in?next=/courses/${courseSlug}/${lessonSlug}`} className={buttonVariants({ variant: "outline" })}>
            Sign in
          </Link>
        </div>
      )}

      {questions.length === 0 ? (
        <div className="py-12 text-center">
          <MessagesSquare className="mx-auto size-10 text-primary/60" strokeWidth={1.25} />
          <p className="mt-3 text-sm text-muted-foreground">No questions yet. Be the first to ask.</p>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-8">
          {questions.map((question) => (
            <li key={question.id}>
              <CommentView comment={question} />
              {/* Indented to line up with the text, past the avatar */}
              <div className="ml-11">
                {user && (
                  <QuestionActions
                    reply={post(question.id)}
                    askAi={question.replies.some((r) => !r.author) ? undefined : askAi.bind(null, courseSlug, lessonSlug, question.id)}
                  />
                )}
                {question.replies.length > 0 && (
                  <ul className="mt-4 flex flex-col gap-5 border-l pl-4 sm:pl-5">
                    {question.replies.map((reply) => (
                      <li key={reply.id}>
                        <CommentView comment={reply} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function CommentView({ comment }: { comment: Comment }) {
  const { author } = comment
  const posted = (
    <time dateTime={comment.createdAt.toISOString()} className="text-xs text-muted-foreground">
      {timeAgo(comment.createdAt)}
    </time>
  )

  if (!author) {
    // The AI tutor's answer: tinted, labeled, and upfront that it can be wrong.
    return (
      <div className="flex gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 ring-1 ring-primary/30">
          <Sparkles className="size-4 text-primary" />
        </span>
        <div className="min-w-0 flex-1 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="font-medium">Lumen AI</span>
            <Badge variant="outline" className="border-primary/30 text-primary">
              AI answer
            </Badge>
            {posted}
          </p>
          <p className="mt-2 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-foreground/90">{comment.body}</p>
          <p className="mt-3 text-xs text-muted-foreground">Written by AI from the lesson notes. It can make mistakes.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      <UserAvatar name={author.name} image={author.image} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
          {/* data-sentry-mask: keeps names out of session replays, like the account menu */}
          <span className="font-medium" data-sentry-mask>
            {author.name}
          </span>
          {posted}
        </p>
        <p className="mt-1 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-foreground/90">{comment.body}</p>
      </div>
    </div>
  )
}

function UserAvatar({ name, image }: { name: string; image?: string | null }) {
  return (
    <Avatar>
      <AvatarImage src={image ?? undefined} alt="" />
      <AvatarFallback data-sentry-mask>{name.charAt(0).toUpperCase() || "?"}</AvatarFallback>
    </Avatar>
  )
}
