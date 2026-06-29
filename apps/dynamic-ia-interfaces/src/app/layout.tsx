import type { Metadata } from "next";
import { BottomStatusBar } from "@platform/design-system/status-bar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dynamic IA Interfaces",
  description:
    "Prototype system where interfaces are generated at runtime by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        {children}
        <BottomStatusBar registerNavigationKeybinds={false} />
      </body>
    </html>
  );
}
