// Sentry tunnel: browser events come here (same origin, so ad blockers leave them alone) and go on to Sentry.
// Unlike the SDK's tunnelRoute rewrite, only the envelope body is forwarded, never the visitor's cookies: those
// leaked session tokens and big cookie jars got 400 "Request Header Or Cookie Too Large" from Sentry.
// It only ever posts to our own project, so it can't relay events anywhere else.
const ingest = "https://o4509813037137920.ingest.de.sentry.io/api/4512169823502416/envelope/"
// Room for a replay's compressed full snapshot, the biggest thing the SDK sends; anything more isn't ours to relay.
const maxBytes = 4 * 1024 * 1024

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length")) > maxBytes) return new Response(null, { status: 413 })
  const body = await request.arrayBuffer()
  if (body.byteLength > maxBytes) return new Response(null, { status: 413 })
  const res = await fetch(ingest, {
    method: "POST",
    headers: { "Content-Type": "application/x-sentry-envelope" },
    body,
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null)
  if (!res) return new Response(null, { status: 502 })
  // Pass Sentry's rate limits on so the SDK backs off when asked.
  const headers = new Headers()
  for (const name of ["retry-after", "x-sentry-rate-limits"]) {
    const value = res.headers.get(name)
    if (value) headers.set(name, value)
  }
  return new Response(null, { status: res.status, headers })
}
