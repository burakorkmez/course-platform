import { unstable_cache } from "next/cache"
import { createPolar } from "@polar-sh/sdk/2026-10"

// Server-only. The import path pins Polar's API version; the webhook endpoint in Polar must use the same one.
// Anything but POLAR_SERVER=production talks to the sandbox, so a missing variable can never take real money.
export const polar = createPolar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  environment: process.env.POLAR_SERVER === "production" ? "production" : "sandbox",
})

export const MONTHLY_PRODUCT_ID = process.env.POLAR_MONTHLY_PRODUCT_ID
export const LIFETIME_PRODUCT_ID = process.env.POLAR_LIFETIME_PRODUCT_ID

export const PRICES_TAG = "polar-prices"
type Prices = Record<string, { label: string; cents: number } | undefined>

// Each product's fixed price, as { label: "$25", cents: 2500 }. Product webhooks revalidate it.
// ponytail: unstable_cache and the first 100 products; 'use cache' + cacheLife once cacheComponents is on.
const fetchPrices = unstable_cache(
  async () => {
    const { items } = await polar.products.list({ is_archived: false, limit: 100 })
    const prices: Prices = {}
    for (const product of items) {
      const price = product.prices.find((p) => p.amount_type === "fixed" && !p.is_archived)
      if (price && "price_amount" in price)
        prices[product.id] = {
          cents: price.price_amount,
          label: new Intl.NumberFormat("en-US", { style: "currency", currency: price.price_currency, trailingZeroDisplay: "stripIfInteger" }).format(
            price.price_amount / 100
          ),
        }
    }
    return prices
  },
  [PRICES_TAG],
  { tags: [PRICES_TAG], revalidate: 3600 }
)

// Failures aren't cached, so the next request retries; until then the page renders without prices.
export const getPrices = () =>
  fetchPrices().catch((e) => {
    console.error("Couldn't load prices from Polar", e)
    return {} as Prices
  })
