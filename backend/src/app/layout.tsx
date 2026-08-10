import type { ReactNode } from 'react';

/**
 * Root layout — required by Next.js App Router (every `app/` tree needs
 * exactly one). This backend serves no browser-rendered pages of its own
 * (see `10-backend-architecture.md` Section 3.1 — everything under
 * `app/api/**` is a Route Handler, not a page), but Next.js still needs
 * this file to exist to correctly generate its own built-in `/404` and
 * `/_error` fallback pages during `next build`. Without it, `next build`
 * fails with `<Html> should not be imported outside of pages/_document` —
 * a pre-existing build break this file fixes.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
