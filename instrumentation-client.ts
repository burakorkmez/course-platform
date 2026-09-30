import * as Sentry from "@sentry/nextjs";

// ImageKit signs private URLs with ?ik-s=. Replay and logs aren't covered by dataCollection, so both go through this
// (Video.js puts the failing URL in HLS error messages, which the player logs).
const withoutSignatures = <T>(data: T): T =>
  JSON.parse(JSON.stringify(data).replace(/ik-s=[^&"\\]*/g, "ik-s=[Filtered]"));

Sentry.init({
  dsn: "https://43bbe5a17498b207e07bfc0f844aa777@o4509813037137920.ingest.de.sentry.io/4512169823502416",

  // Send through our own route (app/monitoring/route.ts) so ad blockers don't drop events.
  // proxy.ts only matches /dashboard, /account and /admin, so it's already excluded there.
  tunnel: "/monitoring",

  // Capture 100% in dev, 10% in production
  // Adjust based on your traffic volume
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Record every session in dev, 10% in production, plus 100% of sessions with an error
  replaysSessionSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    // Text is readable; user names/emails opt back in with data-sentry-mask. Inputs stay masked and all media
    // (incl. <video src=signed>) stays blocked.
    Sentry.replayIntegration({
      maskAllText: false,
      beforeAddRecordingEvent: withoutSignatures,
    }),
  ],

  beforeSendLog: withoutSignatures,

  // Never send cookies, bodies or signed URLs (ImageKit signs via ?ik-t=&ik-s=).
  dataCollection: {
    cookies: false,
    httpBodies: [],
    urlQueryParams: false,
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
