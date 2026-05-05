import { Request, Response } from "express";
import { successResponse } from "../../shared/utils/api-response";
import { waitlistStatsService } from "./waitlist-stats.service";

export class WaitlistStatsController {
  async getStats(_req: Request, res: Response): Promise<Response> {
    const stats = await waitlistStatsService.getStats();

    return res.status(200).json(
      successResponse("Waitlist stats fetched successfully.", stats)
    );
  }
}

export const waitlistStatsController = new WaitlistStatsController();