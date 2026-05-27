import { drizzleStore } from "@astonagent/db";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const store = drizzleStore(db);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "50");
  const conversations = await store.listConversations({ limit });
  return Response.json({ conversations });
}

export async function POST(req: Request) {
  let body: { title?: string } = {};
  try {
    body = (await req.json()) as { title?: string };
  } catch {}
  const conv = await store.createConversation({ title: body.title });
  return Response.json({ conversation: conv });
}
