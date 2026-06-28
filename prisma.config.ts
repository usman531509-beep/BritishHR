import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 configuration. The connection URL lives here (for Migrate/CLI);
// the runtime PrismaClient uses the pg driver adapter (see src/lib/db/prisma.ts).
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations/CLI need a *direct* (non-pooled) connection — DATABASE_URL is a
    // pooled (PgBouncer) URL in production and can't run DDL. Recognise the common
    // direct-URL variable names: DIRECT_URL (manual), DATABASE_URL_UNPOOLED (Neon
    // Vercel integration), POSTGRES_URL_NON_POOLING (Vercel Postgres). Fall back
    // to DATABASE_URL for local dev where one URL is fine.
    url:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.POSTGRES_URL_NON_POOLING ??
      process.env.DATABASE_URL,
  },
});
