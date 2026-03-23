import { createApp } from "./src/app.js";
import { pool } from "./src/db/index.js";
import { startSheetsSyncJob } from "./src/jobs/sheets-sync.job.js";
import { env } from "./src/shared/env.js";
import { logger } from "./src/shared/utils/logger.js";

async function verifyDatabaseConnection(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Shutting down server");
  await pool.end();
  process.exit(0);
}

export async function main(): Promise<void> {
  try {
    await verifyDatabaseConnection();
    logger.info("Conexion a PostgreSQL verificada");
  } catch (error) {
    logger.fatal({ err: error }, "No fue posible verificar la conexion a PostgreSQL");
    process.exit(1);
  }

  const app = await createApp();
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "Backend escuchando");
  });

  startSheetsSyncJob();

  const handleSignal = (signal: NodeJS.Signals): void => {
    void (async () => {
      server.close(async () => {
        await shutdown(signal);
      });
    })();
  };

  process.on("SIGINT", handleSignal);
  process.on("SIGTERM", handleSignal);
}

void main();
