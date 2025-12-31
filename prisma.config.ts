// Prisma 7 configuration for CLI commands (migrate, studio, etc.)
// The DATABASE_URL is used by CLI tools, while the adapter in prisma.ts handles runtime connections
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
