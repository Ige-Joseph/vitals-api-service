import { env } from "../../config/env";

interface SyncWaitlistContactParams {
  email: string;
  name?: string | null;
}

export async function syncWaitlistContactToBrevo({
  email,
  name,
}: SyncWaitlistContactParams): Promise<void> {
  try {
    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        "api-key": env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        email,
        attributes: {
          ...(name ? { FNAME: name } : {}),
        },
        listIds: [Number(env.BREVO_WAITLIST_LIST_ID)],
        emailBlacklisted: false,
        updateEnabled: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Brevo contact sync failed ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error("Failed to sync waitlist contact to Brevo:", error);
  }
}