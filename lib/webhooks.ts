import { safeJsonResponse } from "./safe-json";

export interface WebhookRegistration {
  id: string;
  url: string;
  events: string[]; // e.g., ["VestingDeposited", "VestingClaimed", "VestingRevoked"]
  createdAt: string;
}

// In-memory store for demonstration. In production, this would be a database.
let webhooks: WebhookRegistration[] = [];

export function registerWebhook(url: string, events: string[]): WebhookRegistration {
  const newWebhook: WebhookRegistration = {
    id: crypto.randomUUID(),
    url,
    events,
    createdAt: new Date().toISOString(),
  };
  webhooks.push(newWebhook);
  return newWebhook;
}

export function unregisterWebhook(id: string): boolean {
  const initialLength = webhooks.length;
  webhooks = webhooks.filter((w) => w.id !== id);
  return webhooks.length < initialLength;
}

export function getWebhooks(): WebhookRegistration[] {
  return [...webhooks];
}

export async function triggerWebhooks(eventName: string, payload: any) {
  const targets = webhooks.filter((w) => w.events.includes(eventName) || w.events.includes("*"));
  
  const results = await Promise.allSettled(
    targets.map(async (webhook) => {
      try {
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Stellar-Batch-Pay-Event": eventName,
          },
          body: JSON.stringify({
            event: eventName,
            payload,
            timestamp: new Date().toISOString(),
          }),
        });
        return { id: webhook.id, success: response.ok, status: response.status };
      } catch (error) {
        return { id: webhook.id, success: false, error: error instanceof Error ? error.message : "Unknown error" };
      }
    })
  );

  return results;
}
