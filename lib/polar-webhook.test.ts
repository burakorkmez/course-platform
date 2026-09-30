import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import type { webhooks } from "@polar-sh/sdk/2026-10"
import type { PGlite } from "@electric-sql/pglite"
import type { PgliteDatabase } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import * as schema from "@/lib/db/schema"
import { courses, purchases, subscriptions, webhookEvents } from "@/lib/db/schema"

// The handler runs against a real (in-memory) Postgres, since dedupe, ordering and rollback all live in SQL.
vi.mock("@/lib/db", async () => {
  const { PGlite } = await import("@electric-sql/pglite")
  const { drizzle } = await import("drizzle-orm/pglite")
  return { db: drizzle({ client: new PGlite(), schema: await import("@/lib/db/schema"), casing: "snake_case" }) }
})
const cancel = vi.hoisted(() => vi.fn())
const sentry = vi.hoisted(() => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }, captureException: vi.fn(), setUser: vi.fn() }))
vi.mock("@sentry/nextjs", () => sentry)
vi.mock("@/lib/polar", () => ({
  polar: { subscriptions: { update: cancel } },
  MONTHLY_PRODUCT_ID: "prod_monthly",
  LIFETIME_PRODUCT_ID: "prod_lifetime",
  PRICES_TAG: "polar-prices",
}))

const db = (await import("@/lib/db")).db as unknown as PgliteDatabase<typeof schema> & { $client: PGlite }
const { handleEvent } = await import("@/lib/polar-webhook")

const user = "5f0c7c2e-8a7b-4a53-9a4f-0c1d2e3f4a5b"
const at = (minute: number) => `2026-09-01T10:${String(minute).padStart(2, "0")}:00.000000Z`
let delivery = 0

const order = (status: string, modified: number, product_id = "prod_course", id = "ord_1") =>
  ({
    type: "order.updated",
    data: { id, status, product_id, created_at: at(0), modified_at: at(modified), metadata: { user_id: user }, customer: { external_id: null } },
  }) as unknown as webhooks.WebhookPayload
const subscription = (status: string, modified: number, cancel_at_period_end = false) =>
  ({
    type: "subscription.updated",
    data: {
      id: "sub_1",
      status,
      product_id: "prod_monthly",
      cancel_at_period_end,
      current_period_end: "2026-10-01T10:00:00Z",
      created_at: at(0),
      modified_at: at(modified),
      metadata: { user_id: user },
      customer: { external_id: null },
    },
  }) as unknown as webhooks.WebhookPayload
const send = (event: webhooks.WebhookPayload, id = `msg_${++delivery}`) => handleEvent(id, event)

beforeAll(async () => {
  // Neon Auth's table, which the migrations reference but don't create.
  await db.$client.exec(`create schema neon_auth; create table neon_auth.user (id uuid primary key);`)
  await migrate(db, { migrationsFolder: "drizzle" })
  await db.insert(courses).values({ title: "Course", slug: "course", polarProductId: "prod_course" })
})

beforeEach(async () => {
  await db.delete(purchases)
  await db.delete(subscriptions)
  await db.delete(webhookEvents)
  cancel.mockReset()
  vi.clearAllMocks()
})

describe("Polar webhook", () => {
  it("records a paid course order, then a partial and a full refund", async () => {
    await send(order("paid", 1))
    expect(await db.select().from(purchases)).toMatchObject([{ userId: user, kind: "course", status: "paid" }])
    await send(order("partially_refunded", 2))
    expect((await db.select().from(purchases))[0].status).toBe("partially_refunded")
    await send(order("refunded", 3))
    expect((await db.select().from(purchases))[0].status).toBe("refunded")
  })

  it("falls back to the customer's external id for orders without our metadata", async () => {
    const event = order("paid", 1) as unknown as { data: { metadata: object; customer: object } }
    event.data.metadata = {}
    event.data.customer = { external_id: user }
    await send(event as unknown as webhooks.WebhookPayload)
    expect(await db.select().from(purchases)).toMatchObject([{ userId: user, status: "paid" }])
  })

  it("applies a redelivered webhook-id only once", async () => {
    await send(order("paid", 1), "msg_same")
    await send(order("refunded", 2), "msg_same")
    expect((await db.select().from(purchases))[0].status).toBe("paid")
  })

  it("ignores an older order event that arrives late", async () => {
    await send(order("refunded", 2))
    await send(order("paid", 1))
    expect((await db.select().from(purchases))[0].status).toBe("refunded")
    expect(sentry.logger.info).toHaveBeenLastCalledWith("Polar webhook processed", expect.objectContaining({ outcome: "stale", order_status: "paid" }))
  })

  it("ignores an older subscription event that arrives late", async () => {
    await send(subscription("canceled", 2))
    await send(subscription("active", 1))
    expect(await db.select().from(subscriptions)).toMatchObject([{ status: "canceled" }])
  })

  it("cancels the monthly plan at period end when lifetime is bought", async () => {
    await send(subscription("active", 1))
    await send(order("paid", 2, "prod_lifetime"))
    expect(cancel).toHaveBeenCalledExactlyOnceWith("sub_1", { cancel_at_period_end: true })
  })

  it("leaves a plan that's already canceling alone", async () => {
    await send(subscription("active", 1, true))
    await send(order("paid", 2, "prod_lifetime"))
    expect(cancel).not.toHaveBeenCalled()
  })

  it("rolls everything back when the cancel fails, so Polar's retry redoes it", async () => {
    await send(subscription("active", 1))
    cancel.mockRejectedValueOnce(new Error("Polar is down"))
    await expect(send(order("paid", 2, "prod_lifetime"), "msg_lifetime")).rejects.toThrow("Polar is down")
    expect(await db.select().from(purchases)).toEqual([])

    await send(order("paid", 2, "prod_lifetime"), "msg_lifetime")
    expect(await db.select().from(purchases)).toMatchObject([{ kind: "lifetime", status: "paid" }])
    expect(cancel).toHaveBeenCalledTimes(2)
  })

  it("acknowledges an order for an unlinked product without recording it, so it can be redelivered", async () => {
    await expect(send(order("paid", 1, "prod_unknown"))).resolves.toBeUndefined()
    expect(await db.select().from(purchases)).toEqual([])
    expect(await db.select().from(webhookEvents)).toEqual([])
    // Someone paid and got nothing: it has to reach Sentry as an issue (which alerts), not just a log line.
    expect(sentry.captureException).toHaveBeenCalledOnce()
    expect(sentry.logger.error).toHaveBeenCalledWith("Polar webhook not applied", expect.objectContaining({ event_type: "order.updated" }))
  })
})
