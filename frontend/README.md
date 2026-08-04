# Dreams by Kalakaaar — Frontend Monorepo

Turborepo workspace implementing the Sprint 1 frontend foundation, following
`docs/11-frontend-architecture.md`, `docs/06-design-system.md`,
`docs/04-information-architecture.md`, and `docs/07-ui-screens-wireframes.md`.

## Structure

```
frontend/
├── apps/
│   ├── buyer/       # Buyer-facing storefront (Next.js 15 App Router)
│   └── creator/     # Creator Dashboard (Next.js 15 App Router)
└── packages/
    ├── ui/          # Shared, design-token-driven component library — see packages/ui/README.md
    ├── api-client/  # apiFetch/browserFetch, React Query hooks, query keys
    ├── auth/         # Better Auth config, session + permission guards
    ├── types/        # Shared domain/API TypeScript types
    ├── utils/        # Formatting, shared Zod schemas, cn(), error copy, and other cross-cutting helpers — see packages/utils/README.md
    └── config/        # Shared Tailwind v4 tokens/theme, ESLint, TS presets
```

`apps/internal` (Admin/Moderator/Support) is intentionally not included —
Sprint 1's scope covers Buyer and Creator only.

## Getting started

```bash
npm install
cp apps/buyer/.env.example apps/buyer/.env.local
cp apps/creator/.env.example apps/creator/.env.local
# fill in BETTER_AUTH_SECRET, DATABASE_URL, API_BASE_URL, etc.

npm run dev            # both apps, via Turborepo
npm run dev:buyer      # buyer only, http://localhost:3002
npm run dev:creator    # creator only, http://localhost:3001

npm run build           # production build, both apps
npm run type-check
npm run lint
```

## Sprint 0.5 — Shared Packages Foundation

`packages/ui` and `packages/utils` were extended with the generic,
product-agnostic building blocks every module (Products, and future ones)
draws on: form controls (Radio/Switch/Select/Autocomplete), overlays
(Dialog/Sheet/Drawer/Popover/Tooltip/DropdownMenu/ConfirmDialog), disclosure
(Tabs/Accordion/Breadcrumb/Pagination), a generic DataTable, media handling,
and layout primitives (Container/Section/ResponsiveGrid) on the `ui` side;
a logger, pagination/search/slug/file/image helpers, generic validators, and
error classes on the `utils` side. Full list and usage notes in each
package's own README. No `packages/shared` was created — see that README
for why.

This work didn't touch `apps/`, `packages/api-client`, `packages/auth`, or
anything already owned by the Products module in progress; a follow-up
sprint should migrate existing hand-rolled UI (the native `<select>` in
`apps/buyer/components/ProductListClient.tsx`, for one) onto these
components where it makes sense, but that migration is out of this sprint's
scope.

## Sprint 0.75 — Shared Commerce Foundation

Extended `packages/ui`, `packages/utils`, and `packages/api-client` with
the reusable dashboard/commerce infrastructure future modules will need:
shared hooks (`useDebounce`, `usePagination`, `useFileUpload`,
`useConfirmationDialog`, `useAutosave`, and more), layout primitives
(`AppShell`, `TopNav`, `UserMenu`, `PageHeader`, `EmptyLayout`, a now
collapsible `Sidebar`), upload infrastructure (`FileDropzone` +
`useFileUpload` + progress/preview UI, abstraction-only — no backend
wiring), reusable (non-product) search infrastructure
(`SearchProvider`/`CommandPalette`), a notification center distinct from
the existing toast system, richer error handling (`ErrorBoundary`,
`ApiErrorState`, `NetworkErrorState`), a `Shimmer` loading effect, and a
generic optimistic-mutation wrapper + query-key factory in
`packages/api-client`. No Products/Cart/Checkout/Orders/Wishlist/Reviews
logic. Full inventory and usage examples in
`docs/frontend/shared-commerce-foundation.md`.

As with Sprint 0.5, several of these map directly onto something an app
already hand-rolls (Creator Studio's `DashboardChrome` header, the
duplicated `(auth)/layout.tsx` shell in both apps) — adopting the shared
version there is flagged as a deliberate follow-up, not done as part of
this sprint.

## Sprint 01 — Products Module

Buyer search/filter/sort/pagination on `/products`, wired to the real
backend query contract, plus a hardening pass: gallery zoom, a sticky
mobile Add-to-Cart bar, and a Related Products section. Full creator-side
product management — My Products (search, status tabs, bulk archive/delete,
Duplicate Product), Create, Edit (status transitions, delete, drag-and-drop
image upload/reordering with a keyboard-accessible fallback, autosave, live
preview, inventory adjustment) — built at
`apps/creator/app/(dashboard)/dashboard/products/**`. Every hand-rolled
`<select>`/search box/tab bar/empty-error state in these screens was
migrated onto the shared component library (`@dbk/ui`) rather than left as
one-off markup — including retiring a Dialog primitive this sprint
originally built, in favor of Sprint 0.5's more complete one, once the two
were reconciled. See `../CHANGELOG.md` and
`../docs/testing/sprint-01-production.md` for the full list and manual
test plan.

**Auth bridge gap (top priority for the next sprint)**: this workspace's
Better Auth instance and the backend's `authenticate()` middleware are two
independent, unbridged systems — see `packages/auth/src/access-token.ts`'s
doc comment for the full explanation. Every creator Products BFF route
(`apps/creator/app/api/products/**`) correctly detects this and returns an
explicit `501 AUTH_BRIDGE_NOT_CONFIGURED` rather than silently failing or
faking success. This also affects the Sprint 0.75 dashboard
pending-actions/performance widgets and anything else that calls the
backend from the creator app.

## Notes for the next sprint

- **Backend dependency**: every Route Handler assumes a running upstream
  REST API at `API_BASE_URL` (docs 09/10). Until that's live, Server
  Components that call it (Home's featured row, PLP, PDP) will render their
  already-correct empty/error states rather than content.
- **Not yet built**: Orders list/detail, Wishlist page, Addresses,
  Messages, a Notifications *page/feature* (the reusable
  notification-center infrastructure itself exists as of Sprint 0.75 —
  `NotificationProvider`/`NotificationCenter` — but nothing wires it to a
  real event source yet), Settings, Checkout, Creator
  Orders/Analytics/Payouts pages (Products is now built), Collections/Tags/
  full SEO fields on products (deferred per `backend/SCOPE.md`), and the
  full Creator Registration flow at `/become-a-creator`.
- **Guest cart**: `/api/cart` currently returns an empty cart shape for
  unauthenticated visitors rather than persisting a session-scoped guest
  cart — flagged inline in `apps/buyer/app/api/cart/route.ts` as the seam
  for that follow-up work.

