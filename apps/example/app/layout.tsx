import type { ReactNode } from "react";
import { AppShell } from "./_components/AppShell";
import "./globals.css";

export const metadata = {
  title: "astonagent demo",
  description: "Streaming agent chat with swappable providers and themes.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
