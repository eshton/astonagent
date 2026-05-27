import { defineTool } from "@astonagent/core";
import { z } from "zod";

export const getWeather = defineTool({
  name: "getWeather",
  description: "Look up the current weather in a city. Returns a short human-readable forecast.",
  inputSchema: z.object({
    city: z.string().describe("The name of the city to look up"),
  }),
  execute: async ({ city }) => {
    // Stubbed deterministic mock so the demo works offline. Replace with a real
    // weather API in your own app.
    const hashed = Array.from(city.toLowerCase()).reduce(
      (acc, c) => (acc * 31 + c.charCodeAt(0)) % 997,
      7,
    );
    const conditions = ["sunny", "cloudy", "rainy", "windy", "snowy", "foggy"];
    const condition = conditions[hashed % conditions.length];
    const temp = (hashed % 30) + 5;
    return { city, condition, temperatureC: temp, source: "stubbed" };
  },
});
