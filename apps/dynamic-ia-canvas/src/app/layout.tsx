import type { Metadata } from "next";
import { BottomStatusBar } from "@platform/design-system/status-bar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dynamic IA Canvas",
  description:
    "AI generates custom UI components on demand, rendered on a spatial canvas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className="w-screen overflow-hidden bg-neutral-950 text-neutral-100"
        style={{ height: "calc(100vh - var(--app-status-bar-height, 2rem))" }}
      >
        {children}
        <BottomStatusBar registerNavigationKeybinds={false} />
      </body>
    </html>
  );
}
