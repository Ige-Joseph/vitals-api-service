import { Router } from "express";
import { waitlistController } from "./waitlist.controller";
import { waitlistStatsController } from "./waitlist-stats.controller";
import { asyncHandler } from "../../shared/utils/async-handler";
import { rateLimitMiddleware } from "../../shared/middleware/rateLimit.middleware";

const router = Router();

router.get(
  "/stats",
  asyncHandler(waitlistStatsController.getStats.bind(waitlistStatsController))
);

router.post(
  "/",
  rateLimitMiddleware("waitlist"),
  asyncHandler(waitlistController.create.bind(waitlistController))
);

export default router;