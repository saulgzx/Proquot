import { Router } from "express";

const router = Router();

router.all("*", (_req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Modulo stock pendiente de implementacion",
    },
  });
});

export { router as stockRouter };
