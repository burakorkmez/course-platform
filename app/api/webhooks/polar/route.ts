import * as Sentry from "@sentry/nextjs"
import { webhooks } from "@polar-sh/sdk/2026-10"
import { handleEvent } from "@/lib/polar-webhook"

// Polar → us. Invalid signature: 403. Anything that throws below: 500, so Polar retries (10 times over a few hours).
export async function POST(request: Request) {
  const webhookId = request.headers.get("webhook-id") ?? ""
  let event: webhooks.WebhookPayload
  try {
    event = await webhooks.validateEvent(await request.text(), Object.fromEntries(request.headers), process.env.POLAR_WEBHOOK_SECRET!)
  } catch (e) {
    // Every delivery rejected here = POLAR_WEBHOOK_SECRET no longer matches Polar's (rotated or mistyped). Polar disables
    // the endpoint after ~10 failures in a row, and then nobody who pays gets access.
    if (e instanceof webhooks.PolarWebhookVerificationError) {
      Sentry.logger.warn("Polar webhook rejected", { webhook_id: webhookId, reason: "invalid_signature" })
      return new Response("Invalid signature", { status: 403 })
    }
    // A type this API version doesn't know; we don't subscribe to any, so there's nothing to do. Seeing these usually
    // means the endpoint's API version in Polar no longer matches the one pinned in lib/polar.ts.
    if (e instanceof webhooks.PolarWebhookUnknownTypeError) {
      Sentry.logger.warn("Polar webhook rejected", { webhook_id: webhookId, reason: "unknown_type" })
      return new Response(null, { status: 202 })
    }
    if (e instanceof webhooks.PolarWebhookError) {
      Sentry.logger.warn("Polar webhook rejected", { webhook_id: webhookId, reason: "invalid_payload" })
      return new Response("Invalid payload", { status: 400 })
    }
    throw e
  }
  await handleEvent(webhookId, event)
  return new Response(null, { status: 202 })
}
