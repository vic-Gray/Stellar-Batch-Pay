import { NextRequest, NextResponse } from "next/server";
import { registerWebhook, getWebhooks, unregisterWebhook } from "@/lib/webhooks";
import { safeJsonResponse } from "@/lib/safe-json";

export async function GET() {
  return safeJsonResponse({ webhooks: getWebhooks() });
}

export async function POST(request: NextRequest) {
  try {
    const { url, events } = await request.json();

    if (!url || !Array.isArray(events)) {
      return safeJsonResponse({ error: "Invalid request. 'url' and 'events' (array) are required." }, { status: 400 });
    }

    const webhook = registerWebhook(url, events);
    return safeJsonResponse({ message: "Webhook registered successfully", webhook }, { status: 201 });
  } catch (error) {
    return safeJsonResponse({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return safeJsonResponse({ error: "Missing webhook ID" }, { status: 400 });
  }

  const success = unregisterWebhook(id);
  if (success) {
    return safeJsonResponse({ message: "Webhook unregistered successfully" });
  } else {
    return safeJsonResponse({ error: "Webhook not found" }, { status: 404 });
  }
}
