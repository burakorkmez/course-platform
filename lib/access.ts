// Who can watch what, from the purchase and subscription rows the Polar webhook writes. Pure, so it's unit-tested.

export type Entitlements = {
  purchases: { kind: "course" | "lifetime"; courseId: number | null; status: string }[]
  subscriptions: { status: string }[]
}
export type Plan = "course" | "monthly" | "lifetime"

// Only a full refund revokes a purchase. A canceled subscription stays active until Polar revokes it at period end.
export const ACTIVE_SUBSCRIPTION = ["active", "trialing", "past_due"]
const paid = (status: string) => status === "paid" || status === "partially_refunded"
const subscribed = (status: string) => ACTIVE_SUBSCRIPTION.includes(status)

export const hasLifetime = (e: Entitlements) => e.purchases.some((p) => p.kind === "lifetime" && paid(p.status))
export const isSubscribed = (e: Entitlements) => e.subscriptions.some((s) => subscribed(s.status))
export const hasAllAccess = (e: Entitlements) => hasLifetime(e) || isSubscribed(e)
export const ownsCourse = (e: Entitlements, courseId: number) =>
  e.purchases.some((p) => p.kind === "course" && p.courseId === courseId && paid(p.status))
export const hasCourseAccess = (e: Entitlements, courseId: number) => hasAllAccess(e) || ownsCourse(e, courseId)

// What this person may still buy. Lifetime: nothing. Monthly: the lifetime upgrade. A course owner: All Access only.
// Pass the course to include buying it on its own.
export function buyOptions(e: Entitlements, courseId?: number): Plan[] {
  if (hasLifetime(e)) return []
  if (isSubscribed(e)) return ["lifetime"]
  if (courseId === undefined || ownsCourse(e, courseId)) return ["monthly", "lifetime"]
  return ["course", "monthly", "lifetime"]
}
