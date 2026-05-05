import { waitlistRepository } from "../../modules/waitlist/waitlist.repository";
import { sendAdminNotification } from "./email.service";

export async function sendDailyWaitlistSummary(): Promise<void> {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const [todayCount, totalCount] = await Promise.all([
    waitlistRepository.countCreatedBetween(startOfToday, startOfTomorrow),
    waitlistRepository.countAll(),
  ]);

  await sendAdminNotification({
    subject: "Daily Waitlist Summary",
    text: [
      "Here is your waitlist summary.",
      "",
      `New signups today: ${todayCount}`,
      `Total signups: ${totalCount}`,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto;">
        <div style="padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="margin-top: 0;">Daily Waitlist Summary</h2>
          <p><strong>New signups today:</strong> ${todayCount}</p>
          <p><strong>Total signups:</strong> ${totalCount}</p>
        </div>
      </div>
    `,
  });
}