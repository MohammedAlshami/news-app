import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

const projectRoot = fileURLToPath(new URL(".", import.meta.url))

// Load .env.local when running: npx drizzle-kit push / generate / studio
config({ path: resolve(projectRoot, ".env.local") })
config({ path: resolve(projectRoot, ".env") })

if (!process.env.DATABASE_URL) {
  console.warn(
    "[drizzle] DATABASE_URL is not set. Add it to .env.local (copy from .env.example).",
  )
}

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
})
