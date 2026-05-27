import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "./ThemeProvider.js";
import { MessageList } from "./MessageList.js";
import type { AstonMessage } from "@astonagent/core";

describe("ThemeProvider", () => {
  it("sets data-aston-theme attribute", () => {
    const { container } = render(<ThemeProvider theme="my-brand">x</ThemeProvider>);
    expect(container.querySelector("[data-aston-theme='my-brand']")).not.toBeNull();
  });
});

describe("MessageList", () => {
  it("renders user and assistant turns", () => {
    const messages: AstonMessage[] = [
      {
        id: "1",
        role: "user",
        content: [{ type: "text", text: "hi" }],
        createdAt: new Date(),
      },
      {
        id: "2",
        role: "assistant",
        content: [{ type: "text", text: "hello" }],
        createdAt: new Date(),
      },
    ];
    render(<MessageList messages={messages} />);
    expect(screen.getByText("hi")).toBeDefined();
    expect(screen.getByText("hello")).toBeDefined();
  });

  it("shows empty state when no messages", () => {
    render(<MessageList messages={[]} />);
    expect(screen.getByText(/Send a message/i)).toBeDefined();
  });
});
