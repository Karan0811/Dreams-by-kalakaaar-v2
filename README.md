# Dreams by Kalakaaar v2

A documentation-first, premium e-commerce platform for handcrafted resin
art and personalized gifts.

## Project Status

Foundation phase (auth, database, shared packages, frontend/backend
scaffolding) is complete. **Sprint 01 — Products Module**, including a
subsequent hardening pass (reusable-component migration, Creator Dashboard
completion, backend logging review, realistic demo data, and a
previously-undetected migration bug fix), is complete: see `CHANGELOG.md`
for the full list of additions and
`docs/testing/sprint-01-production.md` for the manual testing checklist.

One cross-cutting gap carries over from the foundation phase and blocks
full end-to-end verification of the creator-side Products UI against a
live session: the frontend's Better Auth session and the backend's
JWT-based `authenticate()` middleware are not yet bridged. See
`frontend/packages/auth/src/access-token.ts` for the full explanation —
it's the top priority for the next sprint.

## Folder Structure

- `docs/` — architecture, design system, roadmap, engineering standards
- `design/` — visual design references
- `backend/` — Next.js (App Router) Route Handlers, Drizzle ORM, Better
  Auth; see `backend/README.md` and `backend/SCOPE.md`
- `frontend/` — Turborepo workspace (buyer + creator apps, shared
  packages); see `frontend/README.md`
- `database/migrations/` — SQL migrations (generated via `drizzle-kit`,
  not hand-written)
- `adr/` — architecture decision records

## Where to start

- New to the backend: `backend/README.md`, then `backend/SCOPE.md`
- New to the frontend: `frontend/README.md`
- What's built vs. deferred, and why: `backend/SCOPE.md`
- Full roadmap: `docs/IMPLEMENTATION_ROADMAP.md`
- API reference: run the backend, then visit `/api/docs` (Swagger UI)
