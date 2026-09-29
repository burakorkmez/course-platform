import { redirect } from "next/navigation"
import { PolarClientError } from "@polar-sh/sdk"
import { auth } from "@/lib/auth/server"
import { polar } from "@/lib/polar"

// Billing: opens Polar's customer portal (receipts, invoices, cancelling the monthly plan) for the signed-in user.
export async function GET(request: Request) {
  const { data } = await auth.getSession()
  if (!data?.user) redirect("/sign-in?next=/api/portal")

  const session = await polar.customerSessions
    .create({ external_customer_id: data.user.id, return_url: new URL("/courses", request.url).href })
    .catch((e) => {
      // Not a Polar customer yet: they've never bought anything.
      if (e instanceof PolarClientError && (e.statusCode === 404 || e.statusCode === 422)) return null
      throw e
    })
  redirect(session?.customer_portal_url ?? "/#pricing")
}
