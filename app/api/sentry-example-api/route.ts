// Throws on purpose for the server button on /sentry-example-page; onRequestError reports it. Delete with that page.
export function GET() {
  throw new Error("Sentry Test Error (server)")
}
