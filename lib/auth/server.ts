import * as Sentry from "@sentry/nextjs"
import { notFound, redirect } from "next/navigation"
import { connection } from "next/server"
import { createNeonAuth } from "@neondatabase/auth/next/server"

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
})

// Admin = verified email in ADMIN_EMAILS.
export const isAdmin = (user?: { email: string; emailVerified: boolean } | null) =>
  !!user?.emailVerified &&
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    // Blank entries (unset var, trailing comma) must never match an empty email.
    .some((e) => e && e === user.email.toLowerCase())

// Call it in every admin page and action, not just the layout:
// layouts don't re-run on navigation, and actions are reachable by direct POST.
export async function requireAdmin() {
  // Opt out of prerendering first: Neon Auth logs Next's bail-out as a cookie error when getSession hits it.
  await connection()
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect("/sign-in?next=/admin")
  Sentry.setUser({ id: session.user.id })
  if (!isAdmin(session.user)) {
    // Someone signed in probing /admin or POSTing admin actions directly. One now and then is curiosity; a burst isn't.
    Sentry.logger.warn("Admin access denied")
    notFound()
  }
  return session.user
}
