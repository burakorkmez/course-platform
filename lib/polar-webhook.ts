import * as Sentry from "@sentry/nextjs"
import { and, eq, inArray, lte } from "drizzle-orm"
import { revalidateTag } from "next/cache"
import { z } from "zod"
import type { webhooks } from "@polar-sh/sdk/2026-10"
import { ACTIVE_SUBSCRIPTION } from "@/lib/access"
import { db } from "@/lib/db"
import { courses, purchases, subscriptions, webhookEvents } from "@/lib/db/schema"
import { LIFETIME_PRODUCT_ID, MONTHLY_PRODUCT_ID, PRICES_TAG, polar } from "@/lib/polar"

type Event = webhooks.WebhookPayload
type Order = Extract<Event, { type: "order.paid" }>["data"]
type Subscription = Extract<Event, { type: "subscription.updated" }>["data"]
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
// What one event did, as log attributes. "stale" = an older event arriving late, which leaves newer state alone.
type Outcome = Record<string, string | number | boolean>

// An event we can't apply until something is fixed on our side, like an order for a product no course is linked to.
// It's rolled back and acknowledged, since non-2xx replies count toward Polar disabling the endpoint.
// Fix the cause, then redeliver the event from the Polar dashboard.
class Unprocessable extends Error {}

// Applies one verified event exactly once. The webhook-id is stored in the same transaction as the event's effects,
// so any failure (including the Polar API call) rolls both back and Polar's retry redoes everything.
export async function handleEvent(webhookId: string, event: Event) {
  const started = Date.now()
  const delivery = { webhook_id: webhookId, event_type: event.type }
  try {
    const outcome = await db.transaction(async (tx) => {
      const [fresh] = await tx.insert(webhookEvents).values({ webhookId, type: event.type }).onConflictDoNothing().returning()
      return fresh ? await applyEvent(tx, event) : { outcome: "duplicate" }
    })
    // One wide event per delivery, logged after commit: search webhook_id, order_id, subscription_id or user.id to see
    // exactly what a payment, refund or renewal did to someone's access.
    Sentry.logger.info("Polar webhook processed", { ...delivery, ...outcome, duration_ms: Date.now() - started })
  } catch (e) {
    if (!(e instanceof Unprocessable)) {
      // Nothing was applied and Polar will retry. The same webhook_id failing ~10 times means Polar is about to
      // disable the endpoint, which silently stops every access grant.
      Sentry.logger.error("Polar webhook failed, Polar will retry", { ...delivery, error: String(e), duration_ms: Date.now() - started })
      throw e
    }
    // Acknowledged but not applied: someone may have paid without getting access. Reported as an issue so it alerts.
    // Fix the cause (usually a course's Polar product id), then redeliver the event from the Polar dashboard.
    Sentry.logger.error("Polar webhook not applied", { ...delivery, reason: e.message })
    Sentry.captureException(e, { tags: delivery })
  }
}

async function applyEvent(tx: Tx, event: Event): Promise<Outcome> {
  switch (event.type) {
    case "order.paid":
    case "order.updated":
    case "order.refunded":
      return applyOrder(tx, event.data)
    case "subscription.created":
    case "subscription.updated":
      return applySubscription(tx, event.data)
    case "product.created":
    case "product.updated":
      revalidateTag(PRICES_TAG, "max")
      return { outcome: "prices_refreshed", product_id: event.data.id }
  }
  return { outcome: "ignored" }
}

// Our checkouts put the Neon Auth user id in metadata, which Polar copies onto the order and subscription. That's what
// to trust: when Polar reuses an existing customer with the same email, it drops the checkout's external_customer_id.
function userIdOf(what: string, { metadata, customer }: { metadata: Record<string, unknown>; customer: { external_id?: string | null } }) {
  const id = String(metadata.user_id ?? customer.external_id ?? "")
  if (!z.guid().safeParse(id).success) throw new Unprocessable(`${what} has no user id in its metadata or external customer id`)
  Sentry.setUser({ id })
  return id
}

async function applyOrder(tx: Tx, order: Order): Promise<Outcome> {
  const { status } = order
  const seen = { order_id: order.id, order_status: status }
  // Draft, pending and void orders never granted anything.
  if (status !== "paid" && status !== "partially_refunded" && status !== "refunded") return { outcome: "ignored", ...seen }
  const productId = order.product_id ?? ""
  // Monthly renewals: the subscription events carry that plan's access.
  if (productId === MONTHLY_PRODUCT_ID) return { outcome: "ignored", ...seen, reason: "monthly_order" }
  const userId = userIdOf(`order ${order.id}`, order)

  let courseId: number | null = null
  if (productId !== LIFETIME_PRODUCT_ID) {
    const [course] = await tx.select({ id: courses.id }).from(courses).where(eq(courses.polarProductId, productId))
    if (!course) throw new Unprocessable(`order ${order.id} is for product "${productId}", which no course is linked to`)
    courseId = course.id
  }

  const modifiedAt = order.modified_at ?? order.created_at
  const [applied] = await tx
    .insert(purchases)
    .values({ polarOrderId: order.id, userId, polarProductId: productId, kind: courseId ? "course" : "lifetime", courseId, status, polarModifiedAt: modifiedAt })
    .onConflictDoUpdate({
      target: purchases.polarOrderId,
      set: { status, polarModifiedAt: modifiedAt, updatedAt: new Date() },
      // An older event arriving late (say, order.paid after order.refunded) leaves the newer state alone.
      setWhere: lte(purchases.polarModifiedAt, modifiedAt),
    })
    .returning()

  // Lifetime replaces the monthly plan: cancel it at period end, so they keep what they paid for this month.
  if (applied?.kind === "lifetime" && applied.status !== "refunded") {
    const monthly = await tx
      .select({ id: subscriptions.polarSubscriptionId })
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), inArray(subscriptions.status, ACTIVE_SUBSCRIPTION), eq(subscriptions.cancelAtPeriodEnd, false)))
    for (const { id } of monthly) await polar.subscriptions.update(id, { cancel_at_period_end: true })
    return { outcome: "applied", ...seen, kind: "lifetime", product_id: productId, monthly_plans_canceled: monthly.length }
  }
  const kind = courseId ? "course" : "lifetime"
  return { outcome: applied ? "applied" : "stale", ...seen, kind, product_id: productId, ...(courseId ? { course_id: courseId } : {}) }
}

async function applySubscription(tx: Tx, subscription: Subscription): Promise<Outcome> {
  if (subscription.product_id !== MONTHLY_PRODUCT_ID)
    throw new Unprocessable(`subscription ${subscription.id} is for product ${subscription.product_id}, not the monthly plan`)
  const userId = userIdOf(`subscription ${subscription.id}`, subscription)

  const modifiedAt = subscription.modified_at ?? subscription.created_at
  const state = {
    status: subscription.status,
    currentPeriodEnd: new Date(subscription.current_period_end),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    polarModifiedAt: modifiedAt,
  }
  const [applied] = await tx
    .insert(subscriptions)
    .values({ polarSubscriptionId: subscription.id, userId, ...state })
    .onConflictDoUpdate({
      target: subscriptions.polarSubscriptionId,
      set: { ...state, updatedAt: new Date() },
      setWhere: lte(subscriptions.polarModifiedAt, modifiedAt),
    })
    .returning({ id: subscriptions.polarSubscriptionId })
  return {
    outcome: applied ? "applied" : "stale",
    subscription_id: subscription.id,
    subscription_status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end,
  }
}
