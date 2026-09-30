import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://43bbe5a17498b207e07bfc0f844aa777@o4509813037137920.ingest.de.sentry.io/4512169823502416",

  // Capture 100% in dev, 10% in production
  // Adjust based on your traffic volume
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Never send cookies, bodies or signed URLs (ImageKit signs via ?ik-t=&ik-s=).
  dataCollection: {
    cookies: false,
    httpBodies: [],
    urlQueryParams: false,
  },
});
