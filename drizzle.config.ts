import { loadEnvConfig } from "@next/env"
import { defineConfig } from "drizzle-kit"

loadEnvConfig(process.cwd())

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  casing: "snake_case",
  // neon_auth is managed by Neon Auth; migrations must never touch it. `generate` ignores this filter,
  // so if a new migration ever CREATEs something in neon_auth, delete that statement before migrating.
  schemaFilter: ["public"],
  dbCredentials: { url: process.env.DATABASE_URL! },
})
