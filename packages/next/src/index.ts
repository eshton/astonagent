export { createChatRoute } from "./route.js";
export type {
  ChatRoute,
  ChatRouteOptions,
  ChatRoutePostBody,
  ChatRouteAuthContext,
  ProviderInput,
  ProviderResolverContext,
} from "./route.js";

export { sseEncodeEvent, sseHeartbeat, sseStream, sseDecode } from "./sse.js";

// Client hook is re-exported via the "./client" subpath so server bundles don't
// pull in React. Users import { useAstonChat } from "@astonagent/next/client".
