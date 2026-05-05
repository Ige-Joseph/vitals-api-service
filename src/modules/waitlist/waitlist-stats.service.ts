import { waitlistRepository } from "./waitlist.repository";

export interface WaitlistStats {
  totalSignups: number;
  signupsToday: number;
}

export class WaitlistStatsService {
  async getStats(): Promise<WaitlistStats> {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const [totalSignups, signupsToday] = await Promise.all([
      waitlistRepository.countAll(),
      waitlistRepository.countCreatedBetween(startOfToday, startOfTomorrow),
    ]);

    return {
      totalSignups,
      signupsToday,
    };
  }
}

export const waitlistStatsService = new WaitlistStatsService();