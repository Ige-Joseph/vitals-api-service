import { Request, Response } from "express";
import { createContactSchema } from "./contact.validation";
import { contactService } from "./contact.service";
import { errorResponse, successResponse } from "../../shared/utils/api-response";

export class ContactController {
  async create(req: Request, res: Response): Promise<Response> {
    const parsed = createContactSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(
        errorResponse("Validation failed", parsed.error.flatten().fieldErrors)
      );
    }

    const contactMessage = await contactService.createContactMessage(parsed.data);

    return res.status(201).json(
      successResponse("Your message has been received.", {
        id: contactMessage.id,
        name: contactMessage.name,
        email: contactMessage.email,
        subject: contactMessage.subject,
        message: contactMessage.message,
        status: contactMessage.status,
        createdAt: contactMessage.createdAt,
      })
    );
  }
}

export const contactController = new ContactController();