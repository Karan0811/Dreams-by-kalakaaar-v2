import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@dbk/api-client";
import { Toaster } from "@dbk/ui";
// FIX (Phase 3 — Google Fonts build/dev issue): see apps/buyer/app/layout.tsx's
// matching comment. Self-hosted via @fontsource; no network fetch, and the
// family names match @dbk/config/tailwind/tokens.css's existing
// `--font-family-sans`/`--font-family-serif` values directly.
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/fraunces/400.css";
import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Creator Dashboard | Dreams by Kalakaaar",
    template: "%s | Creator Dashboard",
  },
  description: "Manage your storefront, orders, and performance on Dreams by Kalakaaar.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf7f3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[var(--z-toast)] focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:shadow-lg"
        >
          Skip to content
        </a>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
