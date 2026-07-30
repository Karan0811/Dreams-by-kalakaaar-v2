import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { QueryProvider } from "@dbk/api-client";
import { Toaster } from "@dbk/ui";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-family-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-family-serif",
  display: "swap",
  weight: ["400", "500", "600"],
});

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
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
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
