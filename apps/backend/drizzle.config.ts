import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config();

export default defineConfig({
  driver: "pg",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL ?? "",
  },
});
