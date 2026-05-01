import "dotenv/config";
import { defineConfig } from "prisma/config";

if (!process.env.DATABASE_URL) {
  console.error("");
  console.error("❌ DATABASE_URL is not set.");
  console.error("");
  console.error("   Locally:  copy .env.example to .env and set DATABASE_URL.");
  console.error("   Railway:  on the API service, add a Reference Variable:");
  console.error("                 DATABASE_URL = ${{ Postgres.DATABASE_URL }}");
  console.error("             (replace 'Postgres' with the name of your DB service).");
  console.error("");
  process.exit(1);
}

export default defineConfig({
  schema: "./prisma/schema.prisma",
  migrations: {
    path: "./prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
