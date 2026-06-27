import type { Metadata } from "next";
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
      <body className="h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100">
        {children}
      </body>
    </html>
  );
}
