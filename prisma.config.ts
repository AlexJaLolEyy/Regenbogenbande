// Prisma 7 configuration for CLI commands (migrate, studio, etc.)
// The adapter in src/lib/prisma.ts handles runtime connections; this file is CLI-only.
//
// The Prisma CLI does not load Next.js-style env files, so we pick one explicitly:
//   - default:            .env.development  (safe: never touches production by accident)
//   - PRISMA_ENV=production -> .env.production
//
// PowerShell examples:
//   npx prisma migrate dev                                   (development DB)
//   $env:PRISMA_ENV="production"; npx prisma migrate deploy  (production DB)
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

const target = process.env.PRISMA_ENV === "production" ? "production" : "development";
config({ path: `.env.${target}` });

console.log(`[prisma.config] using .env.${target}`);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations need a direct (non-pooled) connection; fall back to DATABASE_URL if DIRECT_URL isn't set
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
