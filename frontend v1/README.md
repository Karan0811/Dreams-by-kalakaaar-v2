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

## Notes for the next sprint

- **Backend dependency**: every Route Handler assumes a running upstream
  REST API at `API_BASE_URL` (docs 09/10). Until that's live, Server
  Components that call it (Home's featured row, PLP, PDP) will render their
  already-correct empty/error states rather than content.
- **Document 17 gap**: not applicable to this repo state — `docs/17-*`
  is present in this checkout.
- **Not yet built** (explicitly out of Sprint 1's 23-item scope, but linked
  to from navigation so they're the natural next slice): Orders
  list/detail, Wishlist page, Addresses, Messages, Notifications, Settings,
  Checkout, Creator Products/Orders/Analytics/Payouts pages, and the full
  Creator Registration flow at `/become-a-creator`.
- **Guest cart**: `/api/cart` currently returns an empty cart shape for
  unauthenticated visitors rather than persisting a session-scoped guest
  cart — flagged inline in `apps/buyer/app/api/cart/route.ts` as the seam
  for that follow-up work.
