import { prisma } from "../../infrastructure/database/prisma";
import { ContactMessage, Prisma } from "@prisma/client";

export class ContactRepository {
  async create(data: Prisma.ContactMessageCreateInput): Promise<ContactMessage> {
    return prisma.contactMessage.create({
      data,
    });
  }
}

export const contactRepository = new ContactRepository();