import { Router } from "express";
import { contactController } from "./contact.controller";
import { asyncHandler } from "../../shared/utils/async-handler";
import { rateLimitMiddleware } from "../../shared/middleware/rateLimit.middleware";

const router = Router();

router.post(
  "/",
  rateLimitMiddleware("contact"),
  asyncHandler(contactController.create.bind(contactController))
);

export default router;