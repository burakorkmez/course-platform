import * as Sentry from "@sentry/nextjs"

// Sentry Logs playground (/admin/sentry-logs). Each scenario emits exactly what the real code logs in that situation
// (same messages and attributes as lib/polar-webhook.ts, app/checkout/actions.ts, lib/imagekit.ts, …), so the searches,
// dashboards and alerts you build on this data keep working on real traffic. Every log carries simulated: true; add
// !simulated:true to a search to hide them. Server-only. Delete this folder once you've explored.

const { logger } = Sentry
type Attributes = Record<string, string | number | boolean>
type Scenario = { area: string; label: string; detail: string; run: () => unknown }

const pick = <T>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]
const between = (min: number, max: number) => Math.round(min + Math.random() * (max - min))
const id = (prefix: string) => `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const student = () => crypto.randomUUID()

const courses = [
  { course_id: 1, course_slug: "nextjs-from-scratch", product_id: "prod_nextjs" },
  { course_id: 2, course_slug: "postgres-for-app-developers", product_id: "prod_postgres" },
  { course_id: 3, course_slug: "typescript-in-practice", product_id: "prod_typescript" },
]
const lessons = ["setting-up", "routing", "server-actions", "authentication", "deploying"]

// Runs fn as someone: a fake student's id (so there are many users to group by), null for no one (webhooks, visitors),
// or undefined to stay you (admin actions). Everything inside is tagged simulated: true.
function as<T>(userId: string | null | undefined, fn: () => T) {
  return Sentry.withIsolationScope((scope) => {
    if (userId !== undefined) scope.setUser(userId ? { id: userId } : null)
    scope.setAttributes({ simulated: true })
    return fn()
  })
}

// What lib/polar-webhook.ts logs after committing a delivery, inside spans shaped like the real request's, so the log
// shows up in the trace waterfall.
function webhook(event_type: string, outcome: Attributes, webhook_id = id("msg")) {
  const started = Date.now()
  return Sentry.startSpan({ name: "POST /api/webhooks/polar", op: "http.server" }, async () => {
    await Sentry.startSpan({ name: "db.transaction", op: "db" }, () => pause(between(15, 60)))
    logger.info("Polar webhook processed", { webhook_id, event_type, ...outcome, duration_ms: Date.now() - started })
  })
}

export const scenarios: Record<string, Scenario> = {
  // ---- Payments (lib/polar-webhook.ts) ----
  purchase_journey: {
    area: "Payments",
    label: "Full purchase journey",
    detail: "One student: checkout → webhook grants the course → first lesson done. Open a log, click its user.id: the whole story.",
    run: () =>
      as(student(), async () => {
        const course = pick(courses)
        logger.info("Checkout attempt", {
          plan: "course",
          course_slug: course.course_slug,
          outcome: "sent_to_polar",
          product_id: course.product_id,
          checkout_id: id("chk"),
          linked_existing_customer: false,
          duration_ms: between(300, 900),
        })
        await webhook("order.paid", { outcome: "applied", order_id: id("ord"), order_status: "paid", kind: "course", product_id: course.product_id, course_id: course.course_id })
        logger.info("Lesson completed", { course_slug: course.course_slug, lesson_slug: lessons[0], lesson_id: between(1, 60), source: "player" })
      }),
  },
  lifetime: {
    area: "Payments",
    label: "Lifetime bought, monthly plan canceled",
    detail: "kind: lifetime with monthly_plans_canceled: 1, since lifetime replaces the subscription.",
    run: () =>
      as(student(), () =>
        webhook("order.paid", { outcome: "applied", order_id: id("ord"), order_status: "paid", kind: "lifetime", product_id: "prod_lifetime", monthly_plans_canceled: 1 })
      ),
  },
  refund: {
    area: "Payments",
    label: "Partial, then full refund",
    detail: "Same order_id three times: paid → partially_refunded → refunded. Search that order_id.",
    run: () =>
      as(student(), async () => {
        const order = { order_id: id("ord"), kind: "course", product_id: courses[0].product_id, course_id: courses[0].course_id }
        for (const order_status of ["paid", "partially_refunded", "refunded"])
          await webhook(order_status === "paid" ? "order.paid" : "order.refunded", { outcome: "applied", ...order, order_status })
      }),
  },
  subscription: {
    area: "Payments",
    label: "Monthly plan renews, then cancels",
    detail: "subscription.updated twice: active, then cancel_at_period_end: true (they keep access until the period ends).",
    run: () =>
      as(student(), async () => {
        const subscription_id = id("sub")
        await webhook("subscription.updated", { outcome: "applied", subscription_id, subscription_status: "active", cancel_at_period_end: false })
        await webhook("subscription.updated", { outcome: "applied", subscription_id, subscription_status: "active", cancel_at_period_end: true })
      }),
  },
  duplicate: {
    area: "Payments",
    label: "Polar redelivers the same event",
    detail: "Same webhook_id twice: applied, then outcome: duplicate. Nothing was granted twice.",
    run: () =>
      as(student(), async () => {
        const webhook_id = id("msg")
        const order = { order_id: id("ord"), order_status: "paid", kind: "course", product_id: courses[1].product_id, course_id: courses[1].course_id }
        await webhook("order.paid", { outcome: "applied", ...order }, webhook_id)
        await webhook("order.paid", { outcome: "duplicate" }, webhook_id)
      }),
  },
  out_of_order: {
    area: "Payments",
    label: "Events arrive out of order",
    detail: "The refund lands before the late order.paid, which is logged outcome: stale and changes nothing.",
    run: () =>
      as(student(), async () => {
        const order = { order_id: id("ord"), kind: "course", product_id: courses[2].product_id, course_id: courses[2].course_id }
        await webhook("order.refunded", { outcome: "applied", ...order, order_status: "refunded" })
        await webhook("order.paid", { outcome: "stale", ...order, order_status: "paid" })
      }),
  },
  not_applied: {
    area: "Payments",
    label: "Paid for a course that isn't linked",
    detail: "Error log plus an issue (which alerts). Someone paid and got nothing: fix the product id, redeliver from Polar.",
    run: () =>
      as(student(), () => {
        const delivery = { webhook_id: id("msg"), event_type: "order.paid" }
        const reason = `order ${id("ord")} is for product "prod_typo", which no course is linked to`
        logger.error("Polar webhook not applied", { ...delivery, reason })
        Sentry.captureException(new Error(`[simulated] ${reason}`), { tags: { ...delivery, simulated: true } })
      }),
  },
  retries: {
    area: "Payments",
    label: "Database down, Polar retries",
    detail: "The same webhook_id fails 3 times, then succeeds. ~10 failures in a row and Polar disables the endpoint.",
    run: () =>
      as(student(), async () => {
        const webhook_id = id("msg")
        for (let attempt = 0; attempt < 3; attempt++)
          logger.error("Polar webhook failed, Polar will retry", {
            webhook_id,
            event_type: "order.paid",
            error: "Error: Connection terminated due to connection timeout",
            duration_ms: between(10_000, 10_050),
          })
        await webhook("order.paid", { outcome: "applied", order_id: id("ord"), order_status: "paid", kind: "lifetime", product_id: "prod_lifetime" }, webhook_id)
      }),
  },

  // ---- Webhook route (app/api/webhooks/polar/route.ts) ----
  secret_rotated: {
    area: "Webhook route",
    label: "Webhook secret rotated",
    detail: "10 deliveries rejected with reason: invalid_signature. Chart count() of these: a spike means POLAR_WEBHOOK_SECRET is wrong.",
    run: () =>
      as(null, () => {
        for (let i = 0; i < 10; i++) logger.warn("Polar webhook rejected", { webhook_id: id("msg"), reason: "invalid_signature" })
      }),
  },
  api_drift: {
    area: "Webhook route",
    label: "Polar API version drift",
    detail: "reason: unknown_type. The endpoint's API version in Polar no longer matches the one pinned in lib/polar.ts.",
    run: () =>
      as(null, () => {
        for (let i = 0; i < 3; i++) logger.warn("Polar webhook rejected", { webhook_id: id("msg"), reason: "unknown_type" })
      }),
  },
  bad_payload: {
    area: "Webhook route",
    label: "Malformed payload",
    detail: "reason: invalid_payload, answered with a 400.",
    run: () => as(null, () => logger.warn("Polar webhook rejected", { webhook_id: id("msg"), reason: "invalid_payload" })),
  },

  // ---- Checkout (app/checkout/actions.ts) ----
  checkout_funnel: {
    area: "Checkout",
    label: "25 checkout attempts",
    detail: 'Mixed outcomes across students. Search "Checkout attempt", group by outcome (then by plan) for a funnel chart.',
    run: () => {
      const outcomes = ["sent_to_polar", "sent_to_polar", "sent_to_polar", "sent_to_polar", "sign_in_required", "sign_in_required", "already_owned", "no_product"]
      for (let i = 0; i < 25; i++) {
        const outcome = pick(outcomes)
        const plan = pick(["course", "course", "monthly", "lifetime"])
        const course = plan === "course" ? { course_slug: pick(courses).course_slug } : {}
        as(outcome === "sign_in_required" ? null : student(), () => {
          const attempt = { plan, ...course, outcome }
          if (outcome === "no_product") return logger.warn("Checkout attempt", attempt)
          if (outcome !== "sent_to_polar") return logger.info("Checkout attempt", attempt)
          logger.info("Checkout attempt", { ...attempt, product_id: id("prod"), checkout_id: id("chk"), linked_existing_customer: Math.random() < 0.1, duration_ms: between(250, 1200) })
        })
      }
    },
  },
  no_product: {
    area: "Checkout",
    label: "Buy button with no Polar product",
    detail: "A warn: a course shows a Buy button but has no product id (or an env var is unset). Nobody can buy it.",
    run: () => as(student(), () => logger.warn("Checkout attempt", { plan: "course", course_slug: courses[2].course_slug, outcome: "no_product" })),
  },

  // ---- Prices (lib/polar.ts) ----
  prices_down: {
    area: "Prices",
    label: "Polar API down: prices fail",
    detail: "5 visitors hit it: 5 error logs, and the exceptions group into one issue with 5 events.",
    run: () =>
      as(null, () => {
        for (let i = 0; i < 5; i++) {
          logger.error("Couldn't load prices from Polar", { error: "PolarError: API error occurred: Status 503 Service Unavailable" })
          Sentry.captureException(new Error("[simulated] PolarError: API error occurred: Status 503 Service Unavailable"), { tags: { simulated: true } })
        }
      }),
  },
  prices_refreshed: {
    area: "Prices",
    label: "Price changed in Polar",
    detail: "product.updated webhook: outcome: prices_refreshed, and the price cache is revalidated.",
    run: () => as(null, () => webhook("product.updated", { outcome: "prices_refreshed", product_id: courses[0].product_id })),
  },

  // ---- Storage (lib/imagekit.ts + admin cleanup) ----
  cleanup_failures: {
    area: "Storage",
    label: "Course deleted, some files left behind",
    detail: "You delete a course with 12 videos; 3 ImageKit deletes fail. Each file_id is an orphan you still pay to store.",
    run: () =>
      as(undefined, async () => {
        logger.warn("Admin: course deleted", { course_id: 4, course_slug: "old-course", lessons_deleted: 12 })
        await Sentry.startSpan({ name: "after: deleteFiles", op: "function" }, async () => {
          await pause(between(40, 120))
          for (const status of ["500", "429", "fetch failed"]) logger.warn("ImageKit delete failed", { file_id: id("file"), status })
        })
      }),
  },
  no_duration: {
    area: "Storage",
    label: "Video uploaded without a duration",
    detail: "duration_s: 0 means the upload had no metadata: progress and auto-complete won't work on that lesson.",
    run: () => as(undefined, () => logger.info("Admin: lesson video replaced", { lesson_id: between(1, 60), duration_s: 0, replaced_existing: true })),
  },

  // ---- Learning (app/courses/actions.ts) ----
  completions: {
    area: "Learning",
    label: "Students finish lessons",
    detail: "20 completions across 6 students. Group by lesson_slug to see where people finish (and where they stop).",
    run: () => {
      const students = Array.from({ length: 6 }, student)
      for (let i = 0; i < 20; i++)
        as(pick(students), () => {
          const course = pick(courses)
          const attributes = { course_slug: course.course_slug, lesson_slug: pick(lessons), lesson_id: between(1, 60), source: Math.random() < 0.8 ? "player" : "manual" }
          if (Math.random() < 0.1) logger.info("Lesson marked incomplete", { ...attributes, source: "manual" })
          else logger.info("Lesson completed", attributes)
        })
    },
  },
  signing_refused: {
    area: "Learning",
    label: "Video signing refused",
    detail: "One student gets reason: locked (an access bug or expired session); another probes other files (not_this_lessons_file).",
    run: () => {
      const where = { course_slug: courses[0].course_slug, lesson_slug: lessons[3] }
      as(student(), () => {
        for (let i = 0; i < 2; i++) logger.warn("Lesson video signing refused", { ...where, reason: "locked" })
      })
      as(student(), () => {
        for (let i = 0; i < 4; i++) logger.warn("Lesson video signing refused", { ...where, reason: "not_this_lessons_file" })
      })
    },
  },

  // ---- Admin & security (app/admin/actions.ts, lib/auth/server.ts) ----
  admin_audit: {
    area: "Admin & security",
    label: "An admin edits a course",
    detail: 'Publishes it, updates a lesson, deletes another, all under your user.id. Search "Admin:" for the audit trail.',
    run: () =>
      as(undefined, () => {
        const course = courses[0]
        logger.info("Admin: course updated", { course_id: course.course_id, course_slug: course.course_slug, status: "published", polar_product_id: course.product_id })
        logger.info("Admin: lesson updated", { lesson_id: 12, course_id: course.course_id, lesson_slug: lessons[2], published: true, free_preview: false, moved_section: false })
        logger.warn("Admin: lesson deleted", { lesson_id: 13, course_id: course.course_id, lesson_slug: "draft-lesson" })
      }),
  },
  admin_probe: {
    area: "Admin & security",
    label: "A student probes /admin",
    detail: "6 \"Admin access denied\" from one user.id within seconds: that's not curiosity.",
    run: () =>
      as(student(), () => {
        for (let i = 0; i < 6; i++) logger.warn("Admin access denied")
      }),
  },

  // ---- What Sentry Logs can do ----
  all_levels: {
    area: "Log features",
    label: "Every log level",
    detail: "trace, debug, info, warn, error, fatal. Filter by severity, or see how each one is colored.",
    run: () =>
      as(undefined, () => {
        logger.trace("Entering function", { fn: "applyOrder" })
        logger.debug("Cache lookup", { key: "polar-prices", hit: false })
        logger.info("Order created", { order_id: id("ord") })
        logger.warn("Rate limit approaching", { current: 95, max: 100 })
        logger.error("Payment failed", { reason: "card_declined" })
        logger.fatal("Database unavailable", { host: "primary" })
      }),
  },
  fmt: {
    area: "Log features",
    label: "Parameterized messages (fmt)",
    detail: "3 logs from one template: the values land in message.parameter.* and all three share sentry.message.template.",
    run: () =>
      as(undefined, () => {
        for (const [plan, price] of [["lifetime", "$299"], ["monthly", "$29"], ["course", "$79"]])
          logger.info(logger.fmt`Student ${student()} bought ${plan} for ${price}`)
      }),
  },
  wide_event: {
    area: "Log features",
    label: "Scattered logs vs one wide event",
    detail: "4 thin logs that say little on their own, then 1 wide event with everything as queryable attributes.",
    run: () =>
      as(student(), () => {
        for (const step of ["Starting checkout", "Validating plan", "Creating Polar checkout", "Checkout complete"]) logger.info(step)
        logger.info("Checkout attempt", {
          plan: "lifetime",
          outcome: "sent_to_polar",
          product_id: "prod_lifetime",
          checkout_id: id("chk"),
          linked_existing_customer: true,
          duration_ms: between(300, 900),
        })
      }),
  },
}
