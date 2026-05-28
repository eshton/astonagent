import { MODELS } from "@/lib/models";
import { configuredEnvProviders } from "@/lib/resolve-provider";

export const runtime = "nodejs";

export async function GET() {
  // Return the full registry plus which providers have a server-side key, so
  // the client can also offer models for providers it has a browser key for.
  return Response.json({ models: MODELS, envProviders: configuredEnvProviders() });
}
