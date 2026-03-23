import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(10, "DATABASE_URL debe tener al menos 10 caracteres"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET debe tener al menos 32 caracteres"),
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  ALLOWED_ORIGINS: z.string().default("http://localhost:5173"),
  GOOGLE_SHEETS_ID: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().email().optional().or(z.literal("")),
  GOOGLE_PRIVATE_KEY: z.string().optional(),
  GOOGLE_SHEETS_TAB_QNAP: z.string().default("Hoja 1"),
  GOOGLE_SHEETS_TAB_AXIS: z.string().default("Hoja 2"),
  GOOGLE_SHEETS_TAB_STOCK: z.string().default("Stock"),
  GOOGLE_SHEETS_SYNC_HOURS: z.coerce.number().int().positive().default(12),
  GOOGLE_API_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  GOOGLE_API_RETRIES: z.coerce.number().int().min(0).default(3),
  GOOGLE_API_RETRY_DELAY_MS: z.coerce.number().int().min(0).default(300),
  SESSION_TTL_MIN: z.coerce.number().int().positive().default(10),
  ADMIN_SESSION_TTL_MIN: z.coerce.number().int().positive().default(43200),
  ADMIN_JWT_EXPIRES_IN: z.string().default("30d"),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  LOGIN_RATE_LIMIT_WINDOW_MIN: z.coerce.number().int().positive().default(15),
  LOGIN_RATE_LIMIT_BYPASS_USERS: z.string().default(""),
  STOCK_CACHE_TTL_SEC: z.coerce.number().int().positive().default(120),
  STOCK_CATALOG_CACHE_TTL_SEC: z.coerce.number().int().positive().default(180),
  OSO_ORDERS_CACHE_TTL_SEC: z.coerce.number().int().positive().default(120),
  PUPPETEER_EXECUTABLE_PATH: z.string().optional(),
  CHROME_BIN: z.string().optional(),
  APP_VERSION: z.string().default("1.0.0"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Error validando variables de entorno:");
  for (const issue of parsedEnv.error.issues) {
    const path = issue.path.join(".") || "process.env";
    console.error(`- ${path}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsedEnv.data;

export type Env = typeof env;
