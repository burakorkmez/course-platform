import { webhooks } from "@polar-sh/sdk/2026-10"
import { handleEvent } from "@/lib/polar-webhook"

// Polar → us. Invalid signature: 403. Anything that throws below: 500, so Polar retries (10 times over a few hours).
export async function POST(request: Request) {
  let event: webhooks.WebhookPayload
  try {
    event = await webhooks.validateEvent(await request.text(), Object.fromEntries(request.headers), process.env.POLAR_WEBHOOK_SECRET!)
  } catch (e) {
    if (e instanceof webhooks.PolarWebhookVerificationError) return new Response("Invalid signature", { status: 403 })
    // A type this API version doesn't know; we don't subscribe to any, so there's nothing to do.
    if (e instanceof webhooks.PolarWebhookUnknownTypeError) return new Response(null, { status: 202 })
    if (e instanceof webhooks.PolarWebhookError) return new Response("Invalid payload", { status: 400 })
    throw e
  }
  await handleEvent(request.headers.get("webhook-id")!, event)
  return new Response(null, { status: 202 })
}
