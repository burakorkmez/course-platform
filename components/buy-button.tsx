import type { ComponentProps } from "react"
import { checkout } from "@/app/checkout/actions"
import type { Plan } from "@/lib/access"
import { SubmitButton } from "@/components/submit-button"

// Starts a Polar checkout; signed-out visitors go to sign in first. `contents` lets the button size itself in the parent's layout.
export function BuyButton({ plan, course, ...props }: { plan: Plan; course?: string } & ComponentProps<typeof SubmitButton>) {
  return (
    <form action={checkout.bind(null, plan, course)} className="contents">
      <SubmitButton {...props} />
    </form>
  )
}
