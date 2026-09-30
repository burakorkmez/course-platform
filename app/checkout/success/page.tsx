import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { hasLifetime, isSubscribed } from "@/lib/access"
import { getCourse, getViewer } from "@/lib/catalog"
import { SiteHeader } from "@/components/site-header"
import { WaitForAccess } from "./wait-for-access"

export const metadata: Metadata = { title: "Thanks for your purchase — Lumen", robots: { index: false } }

// Polar sends buyers here after paying. Access arrives by webhook, usually within seconds: until it has, this page
// shows a wait state that re-renders it every 2s, and once it has, it redirects to what they bought.
export default async function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  const { plan, course: slug } = await searchParams
  const viewer = await getViewer()
  if (!viewer.user) {
    const here = new URLSearchParams({ plan: String(plan ?? ""), course: String(slug ?? "") })
    redirect(`/sign-in?next=${encodeURIComponent(`/checkout/success?${here}`)}`)
  }

  const course = typeof slug === "string" && slug ? await getCourse(slug) : null
  const granted =
    plan === "monthly" ? isSubscribed(viewer.entitlements) : plan === "lifetime" ? hasLifetime(viewer.entitlements) : !!course?.progress.owned
  if (granted) redirect(course ? `/courses/${course.slug}` : "/courses")

  return (
    <div className="relative isolate flex flex-1 flex-col overflow-x-clip">
      <SiteHeader />
      <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 pt-12 pb-72 text-center sm:px-6">
        <div aria-hidden className="glow-planet pointer-events-none absolute top-[62%] left-1/2 -z-10 w-176 -translate-x-1/2 sm:w-272" />
        <WaitForAccess plan={String(plan ?? "")} course={typeof slug === "string" && slug ? slug : undefined} />
      </main>
    </div>
  )
}
