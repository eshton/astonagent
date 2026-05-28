import { availableModels } from "@/lib/resolve-provider";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ models: availableModels() });
}
