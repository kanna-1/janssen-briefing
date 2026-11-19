import type { Metadata, Viewport } from "next";
import "highlight.js/styles/github.css";
import "./globals.css";

import { Providers } from "@/components/Providers";
import { NavDock } from "@/components/NavDock";

export const viewport: Viewport = {
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Janssen's Briefing",
  description:
    "A focused news archive with full-text search, story grouping, and AI-assisted reading.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <main className="flex-1">{children}</main>
          <NavDock />
        </Providers>
      </body>
    </html>
  );
}
