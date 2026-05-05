import { env } from "../../config/env";

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

async function sendEmail({
  to,
  subject,
  text,
  html,
  replyTo,
}: SendEmailParams): Promise<void> {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          email: env.BREVO_FROM_EMAIL,
          name: env.BREVO_FROM_NAME,
        },
        to: [{ email: to }],
        subject,
        textContent: text,
        ...(html ? { htmlContent: html } : {}),
        ...(replyTo ? { replyTo: { email: replyTo } } : {}),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Brevo API error ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error("Failed to send email via Brevo:", error);
  }
}

export async function sendAdminNotification({
  subject,
  text,
  html,
  replyTo,
}: {
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<void> {
  await sendEmail({
    to: env.ADMIN_EMAIL,
    subject,
    text,
    html,
    replyTo,
  });
}

export async function sendUserConfirmation({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  await sendEmail({
    to,
    subject,
    text,
    html,
  });
}