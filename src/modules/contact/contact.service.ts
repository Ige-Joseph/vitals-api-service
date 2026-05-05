import { ContactMessage } from "@prisma/client";
import { contactRepository } from "./contact.repository";
import { CreateContactInput } from "./contact.types";
import { normalizeEmail } from "../../shared/utils/normalize-email";
import { env } from "../../config/env";
import {
  sendAdminNotification,
  sendUserConfirmation,
} from "../../shared/services/email.service";
import { escapeHtml } from "../../shared/utils/escape-html";

export class ContactService {
  async createContactMessage(input: CreateContactInput): Promise<ContactMessage> {
    const normalizedEmail = normalizeEmail(input.email);

    const contactMessage = await contactRepository.create({
      name: input.name.trim(),
      email: normalizedEmail,
      subject: input.subject.trim(),
      message: input.message.trim(),
      status: "new",
    });

    const safeName = escapeHtml(contactMessage.name);
    const safeEmail = escapeHtml(contactMessage.email);
    const safeSubject = escapeHtml(contactMessage.subject);
    const safeMessage = escapeHtml(contactMessage.message);

    await sendAdminNotification({
      subject: `New Contact Form Submission: ${contactMessage.subject}`,
      text: [
        "A new contact form message was received.",
        "",
        `Name: ${contactMessage.name}`,
        `Email: ${contactMessage.email}`,
        `Subject: ${contactMessage.subject}`,
        "",
        "Message:",
        contactMessage.message,
        "",
        `Created At: ${contactMessage.createdAt.toISOString()}`,
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111; max-width: 700px; margin: 0 auto;">
          <div style="padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="margin-top: 0;">New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${safeName}</p>
            <p><strong>Email:</strong> ${safeEmail}</p>
            <p><strong>Subject:</strong> ${safeSubject}</p>
            <div style="margin-top: 16px; padding: 16px; background: #f9fafb; border-radius: 8px;">
              <strong>Message</strong>
              <p style="margin-top: 8px; white-space: pre-line;">${safeMessage}</p>
            </div>
            <p style="margin-top: 16px;"><strong>Created At:</strong> ${contactMessage.createdAt.toISOString()}</p>
          </div>
        </div>
      `,
      replyTo: contactMessage.email,
    });

    await sendUserConfirmation({
      to: contactMessage.email,
      subject: "We received your message",
      text: [
        `Hi ${contactMessage.name},`,
        "",
        "Thanks for reaching out.",
        "We’ve received your message and will get back to you as soon as possible.",
        "",
        "Best regards,",
        env.BREVO_FROM_NAME,
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto;">
          <div style="padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="margin-top: 0;">We received your message</h2>
            <p>Hi ${safeName},</p>
            <p>Thanks for reaching out.</p>
            <p>We’ve received your message and will get back to you as soon as possible.</p>
            <p style="margin-top: 24px;">Best regards,<br /><strong>${escapeHtml(env.BREVO_FROM_NAME)}</strong></p>
          </div>
        </div>
      `,
    });

    return contactMessage;
  }
}

export const contactService = new ContactService();