import { describe, expect, it } from "vitest"
import { buyOptions, hasAllAccess, ownsCourse, type Entitlements } from "@/lib/access"

const course = (status: string, courseId = 1) => ({ kind: "course" as const, courseId, status })
const lifetime = (status: string) => ({ kind: "lifetime" as const, courseId: null, status })
const has = (purchases: Entitlements["purchases"] = [], subscriptions: Entitlements["subscriptions"] = []) => ({ purchases, subscriptions })

describe("access", () => {
  it("keeps a course through a partial refund and loses it on a full one", () => {
    expect(ownsCourse(has([course("paid")]), 1)).toBe(true)
    expect(ownsCourse(has([course("partially_refunded")]), 1)).toBe(true)
    expect(ownsCourse(has([course("refunded")]), 1)).toBe(false)
    expect(ownsCourse(has([course("paid", 2)]), 1)).toBe(false)
  })

  it("gives All Access to lifetime and to live subscriptions only", () => {
    expect(hasAllAccess(has([lifetime("paid")]))).toBe(true)
    expect(hasAllAccess(has([lifetime("refunded")]))).toBe(false)
    for (const status of ["active", "trialing", "past_due"]) expect(hasAllAccess(has([], [{ status }]))).toBe(true)
    for (const status of ["canceled", "incomplete", "unpaid", "paused"]) expect(hasAllAccess(has([], [{ status }]))).toBe(false)
    expect(hasAllAccess(has([course("paid")]))).toBe(false)
  })

  it("only offers what someone doesn't have yet", () => {
    expect(buyOptions(has(), 1)).toEqual(["course", "monthly", "lifetime"])
    expect(buyOptions(has())).toEqual(["monthly", "lifetime"])
    expect(buyOptions(has([course("paid")]), 1)).toEqual(["monthly", "lifetime"])
    expect(buyOptions(has([course("refunded")]), 1)).toEqual(["course", "monthly", "lifetime"])
    expect(buyOptions(has([], [{ status: "active" }]), 1)).toEqual(["lifetime"])
    expect(buyOptions(has([lifetime("paid")], [{ status: "active" }]), 1)).toEqual([])
  })
})
