import { Router, Request, Response } from "express";
import { sendDailyWaitlistSummary } from "../shared/services/waitlist-summary.service";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "API is healthy",
  });
});

router.post("/waitlist-summary", async (_req: Request, res: Response) => {
  await sendDailyWaitlistSummary();

  return res.status(200).json({
    success: true,
    message: "Daily waitlist summary email sent.",
  });
});

export default router;