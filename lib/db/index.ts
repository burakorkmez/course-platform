import { Pool } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-serverless"
import * as schema from "./schema"

// WebSocket Pool (not neon-http) so interactive transactions work. Node 22 ships the WebSocket it needs.
export const db = drizzle({ client: new Pool({ connectionString: process.env.DATABASE_URL }), schema, casing: "snake_case" })
