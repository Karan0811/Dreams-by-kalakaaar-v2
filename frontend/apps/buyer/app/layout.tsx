import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@dbk/api-client";
import { Toaster } from "@dbk/ui";
// FIX (Phase 3 — Google Fonts build/dev issue): next/font/google fetches
// Inter/Fraunces from fonts.googleapis.com at build AND dev-server compile
// time. In a network-restricted environment (this sandbox; also plausibly
// some CI/self-hosted runners) that fetch fails, and `next build` fails
// outright (confirmed in the Phase 1/2 audit), while `next dev` retries
// 3x with backoff before falling back — measured at ~12–14s added to the
// first compile of every route that imports this layout. Self-hosting via
// @fontsource (npm package, bundled at build time, zero runtime/build-time
// network calls) removes the dependency entirely. This also happens to
// exactly match the family names @dbk/config/tailwind/tokens.css already
// declares (`--font-family-sans: "Inter", ...`, `--font-family-serif:
// "Fraunces", ...`), so no token/Tailwind config change is needed — the
// self-hosted @font-face rules below satisfy that existing contract
// directly, replacing next/font/google's `.variable` override of the same
// two custom properties.
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
    default: "Dreams by Kalakaaar — Handmade, from real creators",
    template: "%s | Dreams by Kalakaaar",
  },
  description:
    "Discover one-of-a-kind handmade goods from independent creators across India — ceramics, textiles, jewelry, and more.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
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
