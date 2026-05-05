import { Request, Response } from "express";
import { createWaitlistSchema } from "./waitlist.validation";
import { waitlistService } from "./waitlist.service";
import { errorResponse, successResponse } from "../../shared/utils/api-response";

export class WaitlistController {
  async create(req: Request, res: Response): Promise<Response> {
    const parsed = createWaitlistSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(
        errorResponse("Validation failed", parsed.error.flatten().fieldErrors)
      );
    }

    const result = await waitlistService.createWaitlistEntry(parsed.data);

    if (result.alreadyExists) {
      return res.status(200).json(
        successResponse("You are already on the waitlist.", {
          id: result.entry.id,
          email: result.entry.email,
          name: result.entry.name,
          createdAt: result.entry.createdAt,
        })
      );
    }

    return res.status(201).json(
      successResponse("You have been added to the waitlist.", {
        id: result.entry.id,
        email: result.entry.email,
        name: result.entry.name,
        createdAt: result.entry.createdAt,
      })
    );
  }
}

export const waitlistController = new WaitlistController();