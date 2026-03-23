import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";

import { analyticsRouter } from "./modules/analytics/analytics.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { boRouter } from "./modules/bo/bo.routes.js";
import { cotizacionesRouter } from "./modules/cotizaciones/cotizaciones.routes.js";
import { osoRouter } from "./modules/oso/oso.routes.js";
import { productosRouter } from "./modules/productos/productos.routes.js";
import { sesionesRouter } from "./modules/sesiones/sesiones.routes.js";
import { stockRouter } from "./modules/stock/stock.routes.js";
import { usuariosRouter } from "./modules/usuarios/usuarios.routes.js";
import { env } from "./shared/env.js";
import { errorMiddleware } from "./shared/middleware/error.middleware.js";

export async function createApp(): Promise<Express> {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/auth", authRouter);
  app.use("/api/productos", productosRouter);
  app.use("/api/cotizaciones", cotizacionesRouter);
  app.use("/api/usuarios", usuariosRouter);
  app.use("/api/sesiones", sesionesRouter);
  app.use("/api/stock", stockRouter);
  app.use("/api/oso", osoRouter);
  app.use("/api/bo", boRouter);
  app.use("/api/analytics", analyticsRouter);

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      version: env.APP_VERSION,
    });
  });

  app.use(errorMiddleware);

  return app;
}
