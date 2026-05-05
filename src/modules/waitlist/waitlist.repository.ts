import { Prisma, WaitlistEntry } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma";

class WaitlistRepository {
  async findByEmail(email: string): Promise<WaitlistEntry | null> {
    return prisma.waitlistEntry.findUnique({
      where: { email },
    });
  }

  async create(
    data: Pick<
      Prisma.WaitlistEntryCreateInput,
      "email" | "name" | "marketingConsent" | "marketingConsentAt"
    >
  ): Promise<WaitlistEntry> {
    return prisma.waitlistEntry.create({
      data,
    });
  }

  async countAll(): Promise<number> {
    return prisma.waitlistEntry.count();
  }

  async countCreatedBetween(start: Date, end: Date): Promise<number> {
    return prisma.waitlistEntry.count({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });
  }
}

export const waitlistRepository = new WaitlistRepository();