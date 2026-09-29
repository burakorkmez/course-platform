"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"
import { buyOptions, type Plan } from "@/lib/access"
import { getCourse, getViewer } from "@/lib/catalog"
import { LIFETIME_PRODUCT_ID, MONTHLY_PRODUCT_ID, polar } from "@/lib/polar"

// Sends the buyer to Polar's hosted checkout. It never grants anything: access only comes from the webhook.
export async function checkout(plan: Plan, courseSlug?: string) {
  const course = courseSlug === undefined ? null : await getCourse(z.string().parse(courseSlug))
  const back = course ? `/courses/${course.slug}` : "/#pricing"
  const { user, entitlements } = await getViewer()
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(back)}`)

  const productId = { course: course?.status === "published" && course.productId, monthly: MONTHLY_PRODUCT_ID, lifetime: LIFETIME_PRODUCT_ID }[
    z.enum(["course", "monthly", "lifetime"]).parse(plan)
  ]
  // Checked again here, not just by which buttons render: nobody pays twice for what they already have.
  if (!productId || !buyOptions(entitlements, course?.id).includes(plan)) redirect(back)

  // Next rejects server actions whose Origin doesn't match the host, so this is our own origin.
  const origin = (await headers()).get("origin")!
  const success = new URL("/checkout/success", origin)
  success.searchParams.set("plan", plan)
  if (course) success.searchParams.set("course", course.slug)

  // Polar reuses an existing customer with the same email (say, from a purchase made before this app) and then ignores
  // external_customer_id, so link that customer to this user first: the Billing portal finds customers by that id.
  // Verified emails only, so nobody can claim someone else's billing history.
  if (user.emailVerified) {
    const [customer] = (await polar.customers.list({ email: user.email, limit: 1 })).items
    if (customer && !customer.external_id) await polar.customers.update(customer.id, { external_id: user.id })
  }

  const session = await polar.checkouts.create({
    products: [productId],
    // Copied onto the order and subscription: it's how the webhook knows who paid, whichever customer Polar picks.
    metadata: { user_id: user.id },
    external_customer_id: user.id,
    customer_email: user.email,
    customer_name: user.name,
    success_url: success.href,
    return_url: new URL(back, origin).href,
  })
  redirect(session.url)
}
