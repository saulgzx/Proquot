import { Router } from "express";

const router = Router();

router.all("*", (_req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Modulo usuarios pendiente de implementacion",
    },
  });
});

export { router as usuariosRouter };
