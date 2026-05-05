import { Router } from "express";
import waitlistRoutes from "../modules/waitlist/waitlist.route";
import contactRoutes from "../modules/contact/contact.route";
import healthRoutes from "./health.route";

const router = Router();

router.use("/health", healthRoutes);
router.use("/waitlist", waitlistRoutes);
router.use("/contact", contactRoutes);

export default router;