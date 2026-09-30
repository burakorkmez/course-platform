"use server"

import * as Sentry from "@sentry/nextjs"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"
import { buyOptions, type Plan } from "@/lib/access"
import { getCourse, getViewer } from "@/lib/catalog"
import { LIFETIME_PRODUCT_ID, MONTHLY_PRODUCT_ID, polar } from "@/lib/polar"

// Sends the buyer to Polar's hosted checkout. It never grants anything: access only comes from the webhook.
export async function checkout(plan: Plan, courseSlug?: string) {
  return Sentry.withServerActionInstrumentation("checkout", { headers: await headers() }, async () => {
    const started = Date.now()
    const course = courseSlug === undefined ? null : await getCourse(z.string().parse(courseSlug))
    const back = course ? `/courses/${course.slug}` : "/#pricing"
    // One log per attempt, keyed by where it ended up: a funnel of who tried to buy what, and why they didn't get to pay.
    const attempt = { plan, ...(course && { course_slug: course.slug }) }
    const { user, entitlements } = await getViewer()
    if (!user) {
      Sentry.logger.info("Checkout attempt", { ...attempt, outcome: "sign_in_required" })
      redirect(`/sign-in?next=${encodeURIComponent(back)}`)
    }

    const productId = { course: course?.status === "published" && course.productId, monthly: MONTHLY_PRODUCT_ID, lifetime: LIFETIME_PRODUCT_ID }[
      z.enum(["course", "monthly", "lifetime"]).parse(plan)
    ]
    // A missing product is a config bug (a Buy button shown for a course with no Polar product, or an unset env var).
    if (!productId) {
      Sentry.logger.warn("Checkout attempt", { ...attempt, outcome: "no_product" })
      redirect(back)
    }
    // Checked again here, not just by which buttons render: nobody pays twice for what they already have.
    if (!buyOptions(entitlements, course?.id).includes(plan)) {
      Sentry.logger.info("Checkout attempt", { ...attempt, outcome: "already_owned" })
      redirect(back)
    }

    // Next rejects server actions whose Origin doesn't match the host, so this is our own origin. Next lets requests
    // without one through (old browsers, scripts), so rebuild it from the host Next compared against.
    const h = await headers()
    const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`
    const success = new URL("/checkout/success", origin)
    success.searchParams.set("plan", plan)
    if (course) success.searchParams.set("course", course.slug)

    // Polar reuses an existing customer with the same email (say, from a purchase made before this app) and then ignores
    // external_customer_id, so link that customer to this user first: the Billing portal finds customers by that id.
    // Verified emails only, so nobody can claim someone else's billing history.
    let linkedCustomer = false
    if (user.emailVerified) {
      const [customer] = (await polar.customers.list({ email: user.email, limit: 1 })).items
      if (customer && !customer.external_id) {
        await polar.customers.update(customer.id, { external_id: user.id })
        linkedCustomer = true
      }
    }

    const session = await polar.checkouts.create({
      products: [productId],
      // Copied onto the order and subscription: it's how the webhook knows who paid, whichever customer Polar picks.
      metadata: { user_id: user.id },
      external_customer_id: user.id,
      customer_email: user.email,
      customer_name: user.name,
      // Polar fills in {CHECKOUT_ID} so the success page can check the payment. Appended raw: searchParams would escape the braces.
      success_url: `${success.href}&checkout_id={CHECKOUT_ID}`,
      return_url: new URL(back, origin).href,
    })
    // checkout_id matches the order's checkout in Polar; pair it with the "Polar webhook processed" log for the same user.
    Sentry.logger.info("Checkout attempt", {
      ...attempt,
      outcome: "sent_to_polar",
      product_id: productId,
      checkout_id: session.id,
      linked_existing_customer: linkedCustomer,
      duration_ms: Date.now() - started,
    })
    redirect(session.url)
  })
}
