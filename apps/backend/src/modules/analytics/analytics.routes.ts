import { Router } from "express";

const router = Router();

router.use((_req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Modulo analytics pendiente de implementacion",
    },
  });
});

export { router as analyticsRouter };
