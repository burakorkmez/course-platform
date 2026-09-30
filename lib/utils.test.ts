import { expect, it } from "vitest"
import { timeAgo } from "@/lib/utils"

it("says how long ago, in the biggest whole unit", () => {
  const ago = (seconds: number) => timeAgo(new Date(1_000_000_000_000 - seconds * 1000), 1_000_000_000_000)
  expect(ago(20)).toBe("just now")
  expect(ago(5 * 60)).toBe("5 minutes ago")
  expect(ago(3 * 3600 + 59)).toBe("3 hours ago")
  expect(ago(86_400)).toBe("yesterday")
  expect(ago(3 * 604_800)).toBe("3 weeks ago")
})
