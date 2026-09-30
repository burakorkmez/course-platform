import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  org: "codesistency-gs",
  project: "course-platform-nextjs",

  // Pass the auth token (source map upload; set SENTRY_AUTH_TOKEN in CI/Vercel)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,
});
