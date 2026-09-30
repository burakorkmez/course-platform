import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { errors } from "@polar-sh/sdk/2026-10"
import { hasLifetime, isSubscribed } from "@/lib/access"
import { getCourse, getViewer } from "@/lib/catalog"
import { LIFETIME_PRODUCT_ID, MONTHLY_PRODUCT_ID, polar } from "@/lib/polar"
import { SiteHeader } from "@/components/site-header"
import { WaitForAccess } from "./wait-for-access"

export const metadata: Metadata = { title: "Thanks for your purchase — Lumen", robots: { index: false } }

// Polar sends buyers here after paying. Access arrives by webhook, usually within seconds: until it has, this page
// shows a wait state that re-renders it every 2s, and once it has, it redirects to what they bought.
export default async function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  const { plan, course: slug, checkout_id } = await searchParams
  const viewer = await getViewer()
  if (!viewer.user) {
    const here = new URLSearchParams({ plan: String(plan ?? ""), course: String(slug ?? ""), checkout_id: String(checkout_id ?? "") })
    redirect(`/sign-in?next=${encodeURIComponent(`/checkout/success?${here}`)}`)
  }

  const course = typeof slug === "string" && slug ? await getCourse(slug) : null
  const back = course ? `/courses/${course.slug}` : "/courses"
  const granted =
    plan === "monthly" ? isSubscribed(viewer.entitlements) : plan === "lifetime" ? hasLifetime(viewer.entitlements) : !!course?.progress.owned
  if (granted) redirect(back)

  // Only this user's checkout of what they're waiting for gets the wait state, and only a paid one its alert: anyone
  // can open this URL. "confirmed" is a payment still processing, so the wait state (not the alert) covers it too.
  // 404 is an unknown id, 422 a malformed one; anything else (network, auth, rate limit) is ours to surface.
  // ponytail: asks Polar on every 2s refresh until access lands (usually 1-3 calls); cache it if rate limits bite.
  const checkout =
    typeof checkout_id === "string" && checkout_id
      ? await polar.checkouts.get(checkout_id).catch((e) => {
          if (e instanceof errors.ResourceNotFound || e instanceof errors.HTTPValidationError) return null
          throw e
        })
      : null
  const product = plan === "monthly" ? MONTHLY_PRODUCT_ID : plan === "lifetime" ? LIFETIME_PRODUCT_ID : course?.productId
  const paid = checkout?.status === "succeeded"
  if (!checkout || !(paid || checkout.status === "confirmed") || checkout.metadata.user_id !== viewer.user.id || checkout.product_id !== product)
    redirect(back)

  return (
    <div className="relative isolate flex flex-1 flex-col overflow-x-clip">
      <SiteHeader />
      <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 pt-12 pb-72 text-center sm:px-6">
        <div aria-hidden className="glow-planet pointer-events-none absolute top-[62%] left-1/2 -z-10 w-176 -translate-x-1/2 sm:w-272" />
        <WaitForAccess checkout={checkout.id} paid={paid} plan={String(plan ?? "")} course={course?.slug} />
      </main>
    </div>
  )
}
