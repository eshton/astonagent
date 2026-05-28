import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "./ThemeProvider.js";
import { MessageList } from "./MessageList.js";
import { Markdown } from "./components.js";
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

describe("Markdown", () => {
  it("renders GFM tables wrapped for scrolling", () => {
    const { container } = render(
      <Markdown>{"| A | B |\n| - | - |\n| 1 | 2 |"}</Markdown>,
    );
    expect(container.querySelector(".aston-table-wrap table")).not.toBeNull();
    expect(container.querySelectorAll("th")).toHaveLength(2);
    expect(container.querySelectorAll("td")).toHaveLength(2);
  });

  it("renders lists", () => {
    const { container } = render(<Markdown>{"- one\n- two\n- three"}</Markdown>);
    expect(container.querySelectorAll("ul li")).toHaveLength(3);
  });

  it("opens links in a new tab safely", () => {
    render(<Markdown>{"[Anthropic](https://anthropic.com)"}</Markdown>);
    const link = screen.getByText("Anthropic") as HTMLAnchorElement;
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noreferrer");
  });
});
