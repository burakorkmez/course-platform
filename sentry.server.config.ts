import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://43bbe5a17498b207e07bfc0f844aa777@o4509813037137920.ingest.de.sentry.io/4512169823502416",

  // Capture 100% in dev, 10% in production, except AI tutor chats (app/api/tutor): every turn is its own request, and
  // Sentry's Conversations view can only replay a chat whose turns were all traced.
  // Adjust based on your traffic volume
  tracesSampler: ({ attributes, inheritOrSampleWith }) =>
    attributes?.["url.path"] === "/api/tutor" ? 1 : inheritOrSampleWith(process.env.NODE_ENV === "development" ? 1.0 : 0.1),

  // The tunnel relays every browser envelope (replay segments every few seconds); don't trace Sentry's own traffic.
  ignoreSpans: ["POST /monitoring"],

  // Never send cookies, bodies or signed URLs (ImageKit signs via ?ik-t=&ik-s=).
  // AI prompts and answers are kept (the default, spelled out): they're what Conversations replays for a tutor chat.
  dataCollection: {
    cookies: false,
    httpBodies: [],
    urlQueryParams: false,
    genAI: { inputs: true, outputs: true },
  },
});
