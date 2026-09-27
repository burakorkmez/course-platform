# Course Platform — v1 Spec

## Context

You're a solo content creator who wants your own paid course platform: one admin/instructor (you), with everyone else a student who signs up, pays, and watches pre-recorded courses. This spec comes out of the alignment interview and removes the big guesswork before implementation. **When it's approved, the next step is a phased implementation plan, not code.**

Repo at interview time: a fresh `create-next-app` scaffold (Next.js 16.3.6, React 19.2.8, Tailwind 4, TS) with no app code. Since then, a UI pass has built the student pages (`/`, `/courses`, `/courses/[course]`, `/courses/[course]/[lesson]`) on hard-coded courses, progress and access in `lib/courses.ts`, plus Neon Auth sign-in (`/sign-in`, `/api/auth/[...path]`, `proxy.ts`). The phases below replace that fake data and `canWatch` with the real ones. Per AGENTS.md, read `node_modules/next/dist/docs/` before writing Next code: `proxy.ts` replaces middleware, and the caching model has changed.

---

## 1. Product & scope

**Students:** a landing page (courses + 3-tier pricing), a sales page per course, a lesson player, progress tracking, a dashboard, and billing through the Polar portal.
**Admin:** CRUD for courses, sections and lessons; browser uploads to ImageKit; drag-and-drop reorder; draft/published/archived states; a read-only users view.
**Out of scope:** gamification, forum, mobile app, live streaming, multiple instructors, i18n, custom billing UI, emails, AI, trials, discount codes.

## 2. Pricing & access rules

| Product         | Polar type                                                    | Grants                                                  |
| --------------- | ------------------------------------------------------------- | ------------------------------------------------------- |
| Course (~$25)   | one-time, one product per course (`courses.polar_product_id`) | that course                                             |
| Monthly (~$50)  | subscription (`POLAR_MONTHLY_PRODUCT_ID`)                     | all courses while status ∈ {active, trialing, past_due} |
| Lifetime ($250) | one-time (`POLAR_LIFETIME_PRODUCT_ID`)                        | all courses, current and future                         |

```
ownsCourse(u,c)   = purchase(course=c, status ∈ {paid, partially_refunded})
hasAllAccess(u)   = purchase(kind=lifetime, status ∈ {paid, partially_refunded})
                    OR subscription(status ∈ {active, trialing, past_due})
canWatch(u,l)     = admin OR (lesson published AND course visible to u AND
                    (l.is_free_preview OR hasAllAccess(u) OR ownsCourse(u, l.course)))
course visibility = published → everyone · archived → only users with access · draft → admin only
```

- Polar webhooks are the **only** source of access. The checkout success page just polls until access shows up.
- Only a **full** refund revokes access. Partial refunds keep it.
- A canceled subscription keeps access until `subscription.revoked`. Past due keeps access while Polar retries.
- To remove access after refunding a subscription payment, you revoke the subscription in Polar. The app reacts to `subscription.revoked`.
- Monthly → lifetime: on `order.paid` for lifetime, PATCH the subscription `cancel_at_period_end=true` (idempotent).
- No upgrade credit.
- Buy buttons:
  - all-access users: none (only "Start/Continue");
  - monthly users: lifetime upgrade only;
  - course owners: all-access upsell only.
  - The server re-checks ownership before creating a checkout.

## 3. Pages & routes

**Public:**

- `/` (landing + pricing)
- `/courses/[course]` (sales page: trailer, description, price from Polar, full curriculum with locks)
- `/courses/[course]/[lesson]` (player; free previews work logged-out; a locked lesson shows a lock screen with buy CTA)
- `/sign-in`
- `/checkout/success`

**Signed-in:**

- `/dashboard` (My courses = started courses, Continue watching, progress bars)
- `/account` (Billing → Polar portal; "email to delete account")

**Admin:**

- `/admin` (courses)
- `/admin/courses/[id]` (course form + section/lesson tree with drag-and-drop)
- `/admin/lessons/[id]`
- `/admin/users` (read-only: user + what they own)

**API:**

- `/api/auth/[...path]` (Neon Auth)
- `/api/webhooks/polar`
- `/api/imagekit/upload-auth` (admin only)
- `/api/portal` (creates a Polar customer session, then redirects)
- Media signing endpoint(s)

Admin is enforced by `requireAdmin()` in the admin layout **and** in every admin action/route. Admin = verified session email ∈ `ADMIN_EMAILS`.

## 4. Data model (Drizzle, Neon Postgres)

Users live in the managed `neon_auth.user` table (uuid). We declare it read-only in Drizzle and exclude it from migrations.

- **courses:** id, slug (unique), title, description_md, thumbnail_path, trailer_path, polar_product_id (unique, nullable), status enum(draft|published|archived), position, timestamps
- **sections:** id, course_id → courses (cascade), title, position
- **lessons:** id, section_id → sections (cascade), slug (unique per course), title, content_md, video_file_id, video_path, duration_s, is_free_preview, is_published, position
- **attachments:** id, lesson_id → lessons (cascade), name, file_id, file_path, size_bytes
- **lesson_progress:** PK(user_id, lesson_id); user_id → neon_auth.user (cascade), lesson_id → lessons (cascade); position_s, completed_at (nullable), updated_at
- **purchases:** polar_order_id PK, user_id, polar_product_id, kind(course|lifetime), course_id → courses (**RESTRICT**, so the DB itself blocks hard-deleting a paid course), status(paid|partially_refunded|refunded), polar_modified_at (used to ignore out-of-order events), timestamps
- **subscriptions:** polar_subscription_id PK, user_id, status, current_period_end, cancel_at_period_end, polar_modified_at (used to ignore out-of-order events)
- **webhook_events:** webhook_id PK, type, received_at (idempotency)

Ordering: an integer `position`, rewritten in one transaction on reorder. Course % = completed published lessons ÷ published lessons, and 0% when a course has none.

## 5. Architecture

- Server components read data straight through Drizzle. Mutations are server actions validated with zod. Route handlers exist only for webhooks, auth, the portal redirect, upload auth and media signing.
- Catalog/sales content is cached and revalidated by admin mutations. Per-user parts (buttons, progress, locks) render dynamically. Check the Next 16 caching docs against Neon Auth's `force-dynamic` requirement for session reads.
- DB driver: Neon serverless over WebSocket (`Pool`) so interactive transactions work (the webhook needs them).
- Client state: minimal. The player reports progress, the admin tree handles drag-and-drop (dnd-kit), and forms use shadcn + react-hook-form + zod. No global store, no real-time.

## 6. Integrations: what each service owns

- **Neon Postgres:** all app data.
- **Neon Auth:** identity and sessions (Google + GitHub OAuth; own OAuth apps in production). No SMTP in v1.
- **Polar** (sandbox locally): products, prices, checkout, tax/receipts (merchant of record), customer portal, refunds, and future benefits and discounts.
  - Customers are linked by `external_customer_id = user.id`.
  - Pin the API version.
- **ImageKit (Pro plan):** file storage and delivery.
  - Lesson videos and attachments: `isPrivateFile: true`, served only through signed URLs after `canWatch`.
  - Thumbnails and trailers: public.
  - Uploads go browser → ImageKit using one-time auth params from the admin-only route.
  - When a file is replaced or deleted, the ImageKit file is deleted too (best effort, after the DB commit).
- **Sentry (`@sentry/nextjs` 11):** errors and webhook failures. `dataCollection` must be restrictive so cookies, bodies and signed URLs are never sent. Tunnel route excluded from the `proxy.ts` matcher.
- **Vercel:** hosting and Analytics. Envs: local (Neon dev branch, Polar sandbox, ImageKit dev folder) + production.

## 7. Webhook handling (`/api/webhooks/polar`)

1. Verify the signature with the `standardwebhooks` library. The adapter can't verify new secrets. Invalid → 403.
2. In one transaction: insert `webhook-id` into `webhook_events` ON CONFLICT DO NOTHING (duplicate → 200 and stop), then apply the event:
   - `order.paid` / `order.refunded` / `order.updated`: map product → course or lifetime, then upsert the purchase with its status.
   - `subscription.*`: upsert the subscription from the payload.
   - Both upserts skip the write when the payload's `modified_at` is older than the stored `polar_modified_at`, so a late `order.updated` can't undo a refund. A null `modified_at` counts as `created_at`.
   - Lifetime purchase + subscription not already canceling → PATCH it `cancel_at_period_end=true`, still before commit.
3. Commit, then 200. The `webhook-id` only lands together with all of its work: any failure (including the PATCH) rolls it back, so Polar's retry redoes everything. Every step is an idempotent upsert or PATCH, so redoing is safe. No outbox: Polar's retries are the queue. Add one only if a step ever becomes non-idempotent or too slow for the 10s timeout.
4. Unknown product or missing external id → roll back, report to Sentry, return 200 (a non-2xx would count toward auto-disabling the endpoint). Once the product is mapped, re-deliver the event from Polar and it applies normally. Any other error → 500 so Polar retries (10 retries, 10s timeout).

## 8. Video & progress

- **Delivery:** a time-boxed 1-day spike on ImageKit HLS (`ik-master.m3u8?tr=sr-…`) with per-segment signing (their beta player's `signerFn`, or hls.js with our signer). If it works, ship HLS. Otherwise, ship a signed original MP4 in a native `<video>`. The player component is swappable either way.
- **Signed URL expiry:** video ≈ duration + 1h, re-signed on a player error (keeping currentTime); attachments ≈ 5 min.
- **Resume:** position is saved every ~15s, on pause, and on `pagehide` (signed-in only). Lessons auto-complete at ≥90% watched, and there's a manual complete/incomplete toggle.
- **Markdown:** textarea with a Write/Preview tab. Rendering is server-side with syntax highlighting.

## 9. SEO, UI, security, quality

- **SEO:** metadata + OG (course thumbnail) on the landing and published course pages; `sitemap.ts` and `robots.ts`. Lessons, dashboard, account and admin are noindex.
- **UI:**
  - shadcn/ui with light/dark themes (system default + toggle).
  - Mobile-first student pages; admin is desktop-first.
  - Skeleton loading states, and empty states for no courses / no progress / no purchases.
  - Double submissions blocked with pending states. Expired sessions redirect to sign-in and return.
- **Security:**
  - All keys are server-only (Polar token and webhook secret, ImageKit private key, `DATABASE_URL`).
  - Access is checked on every signing path; admin is checked in every admin action.
  - No custom rate limiting in v1.
- **Testing / done:**
  - Vitest unit tests for the access function and webhook handler: paid, full vs partial refund, duplicate `webhook-id`, out-of-order order and subscription events, lifetime canceling the subscription, and a failed cancel leaving the event retryable.
  - A manual sandbox run-through of all 3 products + refund + cancel before launch.
  - Sentry receiving events in production.

## 10. Future-proofing (cheap now, nothing built)

- The status enum can take `coming_soon` later.
- Bundles = a product→courses join table, with the access function unchanged.
- `lesson_progress` timestamps support certificates and drop-off analytics.
- Discord/GitHub benefits are Polar config only.
- Lessons can gain transcript/caption columns, and pgvector plus Neon AI Gateway can power the AI tutor later.
- Comments = a new table, with the instructor badge coming from `ADMIN_EMAILS`.

---

## ASSUMPTIONS (defaulted, not asked)

1. Your cut-off line meant "the checkout success page is never a source of access."
2. USD pricing. Polar handles tax and receipts.
3. Duplicate one-time purchases are prevented by the UI plus a server check. A rare race with two tabs means a manual refund.
4. Scale: hundreds to low thousands of students, with announcement spikes. Neon autoscaling plus the Vercel CDN is enough.
5. Slug URLs `/courses/[course]/[lesson]`. Sections have no draft state (they're hidden when they have no published lessons).
6. Archived courses stay watchable for anyone with access. Admin can view everything.
7. Video duration is read from metadata on upload.
8. Browsers: evergreen, last 2 versions, plus iOS Safari.
9. Production OAuth uses your own Google and GitHub OAuth apps.
10. Account deletion is manual. It cascades progress; you cancel any Polar subscription by hand.

## OPEN RISKS

1. **ImageKit HLS segment signing isn't documented** and their player is beta. The spike may force the MP4 fallback, with no adaptive quality.
2. **ImageKit upload:** there's a 2 GB cap and no resumable upload. A high-bitrate 30-min recording may need re-encoding, and a failed upload restarts from zero.
3. **ImageKit cost:** Pro plan required. HLS processing is about $3.30 per 10-min video (one-time) plus bandwidth.
4. **Neon Auth SDK is `0.5.0-beta`** and doesn't allow custom hooks or plugins. The escape hatch is self-hosted Better Auth (same lineage).
5. **Polar:** the adapter can't verify new webhook secrets, and API versions ship quarterly (next one early October), so pin the version. After 10 failures in a row the endpoint auto-disables, so a bad deploy can silently stop access grants. Mitigation: a Sentry alert, then re-deliver from Polar.
6. **Neon branches** each have their own Auth URL, so the local dev branch needs its own trusted-domain setup.
7. **Next 16 caching vs session reads:** verify in the bundled docs before building cached catalog pages.
8. **Sentry v11 defaults** would leak cookies and signed URLs unless configured.

---

# Implementation Plan (phased)

Each phase ends with a checkpoint you can verify before moving on. The riskiest unknowns go first.

**Stack notes from the bundled Next 16.3 docs:**

- Turn on `cacheComponents: true`. Data is dynamic by default. Catalog reads use `'use cache'` + `cacheLife` + `cacheTag`, and admin actions call `updateTag`.
- Session reads (`auth.getSession()`) go inside components wrapped in `<Suspense>`, not in a layout's top level. With cacheComponents, reading cookies outside a boundary is a build error. This replaces Neon Auth's `force-dynamic` advice.
- `proxy.ts` only does optimistic redirects. Real auth checks go in pages, actions and routes.

**Planned file layout** (kept small):

- `lib/env.ts`: zod-parsed env, server-only.
- `lib/db/schema.ts` and `lib/db/index.ts`.
- `lib/auth.ts`: `getCurrentUser`, `requireUser`, `requireAdmin`.
- `lib/access.ts`: pure rules + loaders.
- `lib/polar.ts` and `lib/imagekit.ts`: SDK clients + signing.
- Root: `proxy.ts`, `instrumentation*.ts`, `drizzle.config.ts`.

**Dependencies:**

- `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`, `@neondatabase/auth`, `zod`
- `@polar-sh/sdk`, `standardwebhooks`, `@imagekit/next`, `@sentry/nextjs`, `@vercel/analytics`
- `next-themes`, `@dnd-kit/core`, `@dnd-kit/sortable`
- `react-markdown`, `remark-gfm`, `rehype-pretty-code`
- `vitest`, plus shadcn components
- `hls.js` only if Spike A passes

**One simplification vs the spec:** forms use native `<form>` + server actions + `useActionState`, with zod validating on the server. React-hook-form is dropped. We add it only if a form needs rich client-side validation.

## Phase 0: Accounts + spikes (≈1–2 days)

- **Accounts:**
  - Neon project: `main` plus a `dev` branch, with Neon Auth on (Google + GitHub).
  - Polar **sandbox** org: 1 test course product, a monthly product, a lifetime product.
  - ImageKit Pro with "restrict unsigned URLs" for private files, and a `dev/` folder.
  - Sentry project and Vercel project.
- **Spike A (≤1 day), HLS + signing:**
  - Upload a private 1080p test video.
  - Try a signed `ik-master.m3u8` in hls.js and check whether the segments load or return 401.
  - Then try the beta player's `signerFn`.
  - **Decide HLS or MP4** and write the result into this file.
  - Also measure how long a 1.5 GB upload takes and whether it's reliable.
- **Spike B (≤2h), Neon Auth + cacheComponents:** sign in, and read the session in a Suspense-wrapped server component with `cacheComponents: true`. No build errors, no `force-dynamic`.
- **Spike C (≤1h), Polar webhooks:** a sandbox webhook reaches localhost through a tunnel and verifies with `standardwebhooks`. Note which API version is pinned.
- **Checkpoint:** all three spikes answered. If any fails, we revisit the spec before Phase 1.

## Phase 1: Foundation

- shadcn init, then `next.config.ts` with `cacheComponents: true`, then `lib/env.ts`.
- Drizzle:
  - Schema for all 8 tables. `neon_auth.user` is declared with `pgSchema` and excluded from migrations via `schemaFilter`.
  - Neon WebSocket `Pool` driver (interactive transactions).
  - Generate and apply the first migration to `dev`.
- Auth:
  - `/api/auth/[...path]` handler, a `/sign-in` page with Google/GitHub buttons, and `lib/auth.ts`.
  - `proxy.ts` redirects signed-out users away from `/dashboard`, `/account` and `/admin`.
  - `requireAdmin()` checks the verified email against `ADMIN_EMAILS`.
- App shell: header, user menu, theme toggle (next-themes).
- Sentry (restrictive `dataCollection`, tunnel excluded from the proxy matcher) + `<Analytics />`.
- **Deploy the skeleton to Vercel now.**
- **Checkpoint:**
  - GitHub and Google sign-in work locally and in production.
  - A non-admin gets redirected or 404 on `/admin/*`.
  - A test error shows up in Sentry without cookies.

## Phase 2: Admin content

- `/admin` course list; `/admin/courses/[id]` course form (slug, title, description_md, `polar_product_id`, status).
- Section/lesson tree with dnd-kit. A reorder is one server action that rewrites positions in a transaction.
- `/admin/lessons/[id]`: title, slug, markdown textarea with a Write/Preview tab, free-preview toggle, published toggle.
- Delete rules:
  - Course: blocked by the FK when purchases exist; the UI offers Archive instead.
  - Section and lesson deletes cascade.
- Every action calls `requireAdmin()` and `updateTag('catalog')`.
- **Checkpoint:** create a course with 2 sections and 4 lessons, reorder them, publish or unpublish, and confirm that deleting a course with a (fake) purchase row fails cleanly.

## Phase 3: Media (depends on the Spike A decision)

- `/api/imagekit/upload-auth` (admin only).
- Browser upload with `@imagekit/next` `upload()`: progress bar, abort, and duration read from `<video>` metadata.
- Lesson videos and attachments upload with `isPrivateFile: true`. Thumbnails and trailers are public.
- `lib/imagekit.ts`:
  - `signVideo(path, duration)` and `signAttachment(path)`.
  - Best-effort `deleteFile` after the DB commit on replace or delete.
- `<LessonPlayer>` is a client component: HLS or MP4 per the spike, re-signs on an error while keeping `currentTime`, and emits progress events.
- Attachments go through a route that re-checks access, then redirects to a 5-minute signed URL.
- **Checkpoint:** upload a real lesson, play it in admin, confirm the raw unsigned URL returns 401 and that an expired URL re-signs without losing your place.

## Phase 4: Payments & access (test-first)

- `lib/access.ts`:
  - Pure functions `ownsCourse`, `hasAllAccess`, `canWatch` and `buyOptions` work on plain rows.
  - Thin DB loaders sit on top.
  - **Vitest tests first.**
- `/api/webhooks/polar`:
  1. Verify the signature.
  2. In one transaction: dedupe on `webhook-id`, run `applyEvent`, and for a lifetime purchase cancel any subscription at period end. Commit only when all of it succeeded.
  - Unknown product → roll back, Sentry, 200 (re-deliver from Polar once mapped). Any other error → 500.
  - `applyEvent` is pure-ish and unit-tested with fixture payloads: paid, full refund, partial refund, duplicate, out-of-order order and subscription updates, revoked, lifetime-while-subscribed, and a failed cancel rolling back the `webhook-id`.
- Checkout server action:
  - Runs `requireUser`, then `buyOptions` (refuses if already owned), then creates a Polar checkout with `external_customer_id=user.id` and `success_url=/checkout/success?product=…`.
- `/checkout/success`: a client component polls a server action every 2s for up to 60s, then redirects to the course. After that, it shows a "still processing" message.
- `/api/portal`: creates a customer session and redirects.
- **Checkpoint:**
  - `vitest` passes.
  - In the sandbox, buy a course, then monthly, then lifetime (which auto-cancels monthly), then fully refund the course (access gone), then partially refund lifetime (access kept).
  - Redelivering a webhook from Polar changes nothing.

## Phase 5: Student experience

- `/` landing: a course grid (cached) and pricing. Prices come from Polar products, cached with `cacheLife('hours')`. Buttons come from `buyOptions`, wrapped in Suspense.
- `/courses/[course]` sales page:
  - Trailer, description, price, and the curriculum with lock icons and free-preview badges.
  - Buttons that depend on what the student owns.
  - Visibility rules for draft, published and archived.
- `/courses/[course]/[lesson]` player page:
  - Checks `canWatch`; a locked lesson shows a lock screen with a CTA.
  - Curriculum sidebar (a sheet on mobile), next/previous, and markdown rendered with rehype-pretty-code.
  - Attachments list.
- Progress:
  - A server action upserts `lesson_progress` (throttled to about every 15s, on pause, on `pagehide`, signed-in only).
  - Auto-complete at ≥90%, plus the manual toggle.
  - Resume sets `currentTime` from the saved position.
- `/dashboard`: My courses (started) with % bars, and Continue watching (most recent `updated_at`, not completed), with empty states.
- `/account`: Billing button to the portal, and the "email to delete account" note.
- **Checkpoint:**
  - A logged-out visitor watches a free preview.
  - A locked lesson can't get a signed URL (check the network tab).
  - Resume works across devices.
  - The % updates.
  - All-access users see no buy buttons.

## Phase 6: Admin users + SEO + polish

- `/admin/users`: a read-only table of users joined to their purchases and subscription status.
- `generateMetadata` + OG on the landing and course pages; `sitemap.ts` and `robots.ts`; noindex on lessons, dashboard, account and admin.
- `loading.tsx` skeletons, `error.tsx` boundaries, empty states, and pending states on every submit button. Check mobile layouts at 375px.
- **Checkpoint:** Lighthouse SEO check on the course page, no horizontal scroll on mobile, and no unhandled error paths.

## Phase 7: Launch

- Production setup:
  - Polar production products and IDs in the Vercel env.
  - A webhook endpoint with a pinned API version and a fresh secret.
  - An ImageKit production folder.
  - Your own Google and GitHub OAuth apps, plus trusted domains in Neon Auth.
  - Run migrations on Neon `main`.
- A Sentry alert on any webhook route error. Know that you can re-deliver webhooks from the Polar dashboard.
- **Final run-through:** the Phase 4 and Phase 5 checkpoints against production with a real $1 test product, refunded afterwards.

## Verification summary

- Automated: `npx vitest` (access + webhook) and `npm run build` (catches cacheComponents or Suspense mistakes).
- Manual: the checkpoint lists above, run in the Polar sandbox locally and once in production.
