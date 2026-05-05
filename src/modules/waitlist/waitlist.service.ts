import { WaitlistEntry } from "@prisma/client";
import { waitlistRepository } from "./waitlist.repository";
import { normalizeEmail } from "../../shared/utils/normalize-email";
import { CreateWaitlistInput } from "./waitlist.types";
import { env } from "../../config/env";
import { sendUserConfirmation } from "../../shared/services/email.service";
import { escapeHtml } from "../../shared/utils/escape-html";
import { syncWaitlistContactToBrevo } from "../../shared/services/brevo-contact.service";

interface CreateWaitlistResult {
  entry: WaitlistEntry;
  alreadyExists: boolean;
}

export class WaitlistService {
  async createWaitlistEntry(
    input: CreateWaitlistInput
  ): Promise<CreateWaitlistResult> {
    const normalizedEmail = normalizeEmail(input.email);
    const normalizedName = input.name?.trim() || null;

    const existingEntry = await waitlistRepository.findByEmail(normalizedEmail);

    if (existingEntry) {
      return {
        entry: existingEntry,
        alreadyExists: true,
      };
    }

    const entry = await waitlistRepository.create({
      email: normalizedEmail,
      name: normalizedName,
      marketingConsent: input.marketingConsent,
      marketingConsentAt: input.marketingConsent ? new Date() : null,
    });

    if (entry.marketingConsent) {
      await syncWaitlistContactToBrevo({
        email: entry.email,
        name: entry.name,
      });
    }

    const safeName = escapeHtml(entry.name ?? "there");

    await sendUserConfirmation({
      to: entry.email,
      subject: "You're on the waitlist 🎉",
      text: [
        `Hi ${entry.name ?? "there"},`,
        "",
        "Thanks for joining our waitlist.",
        "We’ve received your request and will keep you updated.",
        "",
        "Best regards,",
        env.BREVO_FROM_NAME,
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto;">
          <div style="padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="margin-top: 0;">You're on the waitlist 🎉</h2>
            <p>Hi ${safeName},</p>
            <p>Thanks for joining our waitlist.</p>
            <p>We’ve received your request and will keep you updated.</p>
            <p style="margin-top: 24px;">
              Best regards,<br />
              <strong>${escapeHtml(env.BREVO_FROM_NAME)}</strong>
            </p>
          </div>
        </div>
      `,
    });

    return {
      entry,
      alreadyExists: false,
    };
  }
}

export const waitlistService = new WaitlistService();