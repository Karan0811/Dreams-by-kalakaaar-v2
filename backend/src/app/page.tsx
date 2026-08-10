/**
 * Root page — this backend serves no browser UI of its own
 * (`10-backend-architecture.md` Section 3.1: everything under `app/api/**`
 * is a Route Handler). Before this file existed, `app/` had zero
 * `page.tsx` anywhere, which breaks Next.js's own built-in `/404` and
 * `/_error` static generation during `next build` (reproduced on the
 * unmodified repo — not something this sprint's routes introduced). A
 * minimal real page is the fix; it also doubles as a human-readable
 * landing point pointing at `/api/docs`.
 */
export default function RootPage() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '3rem', maxWidth: 640 }}>
      <h1>Dreams by Kalakaaar — API</h1>
      <p>
        This service exposes a REST API under <code>/api/v1</code>. Interactive documentation is
        available at <a href="/api/docs">/api/docs</a>.
      </p>
    </main>
  );
}
