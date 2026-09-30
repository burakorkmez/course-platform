import * as Sentry from "@sentry/nextjs"
import { redirect } from "next/navigation"
import { PolarClientError } from "@polar-sh/sdk"
import { auth } from "@/lib/auth/server"
import { polar } from "@/lib/polar"

// Billing: opens Polar's customer portal (receipts, invoices, cancelling the monthly plan) for the signed-in user.
export async function GET(request: Request) {
  const { data } = await auth.getSession()
  if (!data?.user) redirect("/sign-in?next=/api/portal")
  Sentry.setUser({ id: data.user.id })

  const session = await polar.customerSessions
    .create({ external_customer_id: data.user.id, return_url: new URL("/courses", request.url).href })
    .catch((e) => {
      // Not a Polar customer yet: they've never bought anything.
      if (e instanceof PolarClientError && (e.statusCode === 404 || e.statusCode === 422)) return null
      throw e
    })
  // "no_polar_customer" from someone who did pay means their Polar customer isn't linked to this user id.
  Sentry.logger.info("Billing portal requested", { outcome: session ? "opened" : "no_polar_customer" })
  redirect(session?.customer_portal_url ?? "/#pricing")
}
