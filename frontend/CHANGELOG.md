# Production Audit Changelog

**Read this first — important limitation.** My sandbox for this audit could reach the
npm registry for metadata (`npm install --dry-run` worked) but tarball downloads were
blocked (`403 Forbidden` on every package `.tgz`). That means I could **not** run a real
`npm install`, `npm run dev`, `npm run build`, `npm run lint`, or `npm run typecheck`
in this session. Everything below comes from a careful, file-by-file manual audit —
reading every source file, tracing every import graph, and checking specific claims
(Tailwind v4's monorepo content-detection behavior, Better Auth's default cookie name
and recommended middleware helper) against current documentation via search rather than
assuming. It is not a substitute for actually running the four commands yourself. Please
run them and send me anything that still fails — I'd rather you catch a residual issue
than believe this is more verified than it is.

---

## Critical (would break the app at runtime)

### 1. `<Button asChild>` silently rendered nothing
**Where:** `packages/ui/src/primitives/Button.tsx`
**Why it happened:** Radix's `Slot` (what powers `asChild`) requires its `children` to
be *exactly one* valid React element — internally it does the equivalent of
`React.Children.only()`. Button always rendered `{isLoading ? <Loader2/> : null}
{children}` as two sibling expressions. Even with `isLoading` false, that pattern
produces an array as the `children` prop, and an array is never `isValidElement`, so
Slot's clone path never ran and it silently returned `null`.
**Impact:** Every `asChild` button across both apps rendered as nothing — 11 call
sites: the Home page's two hero CTAs and "View all" links, Cart's checkout button,
the Account dashboard's "Start Browsing" / footer links, both apps' error/not-found
"Go Home" buttons, and the Creator app's "become a creator" CTAs.
**Fix:** When `asChild` is true, `children` is now passed through to `Slot` completely
untouched as the single element. The loading-spinner treatment only applies to the
native `<button>` path (this matches how shadcn/ui's own Button avoids the same trap).

### 2. `@dbk/api-client`'s client-safe entry re-exported server-only code
**Where:** `packages/api-client/src/index.ts`, `client.ts`, `browserFetch.ts`,
`QueryProvider.tsx`
**Why it happened:** `apiFetch` (which reads `API_BASE_URL`, a server-only secret, and
is the only thing allowed to call the upstream REST API per the BFF architecture) was
exported from the same barrel as the TanStack Query hooks. `browserFetch.ts` and
`QueryProvider.tsx` — both genuinely client-side — imported `ApiError` *from `client.ts`*,
dragging the server-only module into every client bundle that used them.
**Fix:** Extracted `ApiError` into its own `errors.ts` with no server dependencies.
Split the package into `@dbk/api-client` (hooks, `browserFetch`, `QueryProvider`,
`ApiError`) and `@dbk/api-client/server` (`apiFetch` and every endpoint function).
Added `import "server-only"` to `client.ts` and each `endpoints/*.server.ts` file so
any future accidental client import fails loudly at build time instead of silently
shipping. Updated every Route Handler and Server Component to import from `/server`.
(`@dbk/auth` already had this split from an earlier pass — hardened it the same way
with `server-only` guards.)

### 3. Better Auth had no database — sign-up, sign-in, and password reset were all dead on arrival
**Where:** `packages/auth/src/better-auth.config.ts`
**Why it happened:** `betterAuth({...})` was configured with a secret, base URL, and
session settings, but no `database` option at all — Better Auth had nothing to persist
users, sessions, or verification tokens to.
**Fix:** Wired a `pg.Pool` (Better Auth accepts a raw driver instance directly — no
separate Kysely/ORM setup needed) pointed at `DATABASE_URL`, the same Supabase Postgres
instance the rest of the stack uses.
**Remaining step (not something I can do from here):** Better Auth's own tables
(`user`/`session`/`account`/`verification`) are separate from the marketplace's
application schema. Run `npx @better-auth/cli generate` (or a hand-written equivalent
migration) against `DATABASE_URL` before auth will work against a real database.

### 4. `requireEmailVerification: true` with no way to ever send that email
**Where:** same file
**Why it happened:** Turning on required email verification without providing
`emailVerification.sendVerificationEmail` means a newly signed-up user has no way to
ever complete verification — permanently locked out. Password reset had the same gap
(`emailAndPassword.sendResetPassword` was never provided, so the Forgot Password screen
would submit successfully and do nothing).
**Fix:** Added `packages/auth/src/email.ts` with real Resend-backed senders for both
flows, wired into the config. In any environment without `RESEND_API_KEY` set (e.g.,
a fresh `npm run dev` before `.env.local` is filled in), it logs the link to the
console instead of throwing, so local auth flows stay usable without a real email
provider while making the missing key visible rather than silently swallowed.

### 5. Google OAuth was always "on" with empty-string credentials
**Where:** same file
**Why it happened:** `socialProviders.google` was unconditionally configured, so any
environment without `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` set got a broken,
always-visible Google sign-in button.
**Fix:** Only registers the Google provider when both env vars are actually present.

### 6. Home page referenced seven images that don't exist
**Where:** `apps/buyer/app/(marketing)/page.tsx`
**Why it happened:** The hero and category grid used `next/image` with hardcoded
paths like `/images/hero-handmade.jpg` and `/images/categories/ceramics.jpg`, but no
`public/` directory or any image files were ever created in either app.
**Impact:** Every one of those seven images would render as a broken-image icon.
**Fix:** Replaced with self-contained icon/gradient treatments (brand-colored gradient
panel for the hero, `lucide-react` icon tiles for categories) — no file dependency,
so nothing to 404. Left a comment marking this as the place to swap in real
photography once a media pipeline is connected; `ProductCard`'s use of `next/image`
for actual product photos is untouched and was already correctly guarded against
missing images (data-driven from the API, not hardcoded).

### 7. Tailwind v4 never generated styles for the shared UI package
**Where:** `apps/buyer/app/globals.css`, `apps/creator/app/globals.css`
**Why it happened:** Tailwind v4's automatic content detection only scans downward
from the stylesheet's own project root — it does not reach sibling Turborepo packages
that are transpiled in rather than pre-built. This is a documented, common gotcha
(confirmed against Tailwind's GitHub issue tracker and docs) for exactly this
monorepo shape. Every utility class used inside `@dbk/ui` (i.e., almost the entire
visual design of `Button`, `Navbar`, `ProductCard`, `Sidebar`, everything) would have
been silently absent from the generated CSS — the components would render, but
completely unstyled.
**Fix:** Added explicit `@source "../../../packages/ui/src";` (and `@source
"../components";` for belt-and-braces explicitness) to both apps' `globals.css`,
per Tailwind's documented fix for this exact scenario.

### 8. Several `@dbk/ui` primitives were missing `"use client"`
**Where:** `Button.tsx`, `Avatar.tsx`, `Label.tsx`, `Separator.tsx`, `Textarea.tsx`
**Why it happened:** `Avatar` wraps Radix's `AvatarPrimitive`, which tracks image-load
status internally; `Textarea` defines its own `onInput` handler; `Button` accepts
arbitrary event-handler props by design. None of these had `"use client"` on their own
file. Current call sites happened not to trigger a hard build error (no Server
Component currently passes them a function prop), but that's fragile — the first
future page that does (a completely natural thing to write, since these components'
public API looks fully interactive) would hit a cryptic RSC boundary error.
**Fix:** Added `"use client"` to all five, matching the convention every other
interactive/Radix-wrapping primitive in the library already followed.

---

## TypeScript correctness

### 9. Two real `noUncheckedIndexedAccess` violations
**Where:** `apps/buyer/components/CartView.tsx`, `packages/utils/src/errorMessages.ts`
- `CartView.tsx` indexed `item.product.images[0]` three separate times in the same
  JSX block. TypeScript's control-flow narrowing doesn't carry across independent
  index-access expressions, so `noUncheckedIndexedAccess` (on in `tsconfig.base.json`)
  would flag the second and third accesses as possibly `undefined`. Fixed by indexing
  once into a local `primaryImage` variable, matching the pattern already used
  correctly in `ProductCard.tsx` and `ProductGallery.tsx`.
- `errorMessages: Record<string, string>` means *every* access into it — including
  `errorMessages.DEFAULT` via dot notation — types as `string | undefined` under
  `noUncheckedIndexedAccess`, since a `Record` carries no guarantee a given key
  exists. `getErrorMessage`'s `?? errorMessages.DEFAULT` fallback therefore didn't
  actually guarantee a `string`, conflicting with its declared return type. Fixed by
  extracting a real `DEFAULT_ERROR_MESSAGE` constant instead of reading the fallback
  back out of the map.

### 10. Unsafe casts
- `SignupForm.tsx`: `setValue("acceptedTerms", ... ? true : undefined as never)`.
  Root cause: `acceptedTerms` was typed `z.literal(true)`, which doesn't match what a
  Checkbox's `onCheckedChange` naturally produces (`boolean`). Changed the schema to
  `z.boolean().refine(v => v === true, ...)` — identical validation and error message,
  natural `boolean` type, no cast needed anywhere.
- `session.ts`: `(user as unknown as { roles?: ... }).roles` — masking the fact that
  `roles`/`hasCreatorProfile` were never actually declared to Better Auth (see #10
  below... referring to the config fix). Added `user.additionalFields` to the auth
  config so these are real, migrated columns, and replaced the blind cast with a
  narrow, explicitly-typed, runtime-validated `parseRoles()` that falls back safely
  instead of trusting unchecked data.
- `packages/utils/src/testing/fixtures.ts`: three `as never` casts to satisfy the
  branded `Id` type. Added a proper `createId()` helper to `@dbk/types` and used it
  instead — same effect, self-documenting, reusable anywhere a test needs an `Id`.

### 11. Duplicated type definitions
`AddCartItemInput` was independently defined three times (the Route Handler's inferred
body shape, `cart.server.ts`'s local interface, and `useCart.ts`'s local interface) —
structurally identical but three separate sources of truth. Consolidated into one
Zod-derived `AddCartItemInput` in `@dbk/utils`, and — see next item — actually used it
for validation instead of just typing.

### 12. `searchParams` typed narrower than Next.js 15's real page-prop shape
**Where:** `apps/buyer/app/(shop)/products/page.tsx`
Declared `Promise<Record<string, string | undefined>>`, but Next.js 15's actual
`searchParams` type allows `string | string[] | undefined` (repeated query params
produce arrays). This risked a mismatch against Next's own generated page-prop
validation. Widened the type and added a `firstValue()` normalizer.

---

## Security

### 13. Cart mutation endpoint accepted unvalidated request bodies
**Where:** `apps/buyer/app/api/cart/items/route.ts`
`await request.json()` was passed straight through to `addCartItem()` and on to the
upstream API with no shape or type validation — a malformed or malicious request body
would be forwarded as-is. Added `addCartItemSchema` (UUID product id, integer quantity
clamped 1–20, string-keyed customization map) and a `safeParse` with a proper 400 +
field-level error response on failure.

### 14. Creator dashboard `period` query param forwarded unvalidated
**Where:** `apps/creator/app/api/dashboard/performance/route.ts`
Lower severity (just a string forwarded to an internal query param, not user content),
but still an arbitrary client-supplied value reaching the upstream API unchecked.
Added an explicit allow-list (`last_7_days` / `last_30_days` / `last_90_days` /
`year_to_date`), falling back to `last_30_days` for anything else.

### 15. Middleware's session-cookie check was hand-rolled instead of using Better Auth's own helper
**Where:** both apps' `middleware.ts`
The manual check (`request.cookies.get("better-auth.session_token") ??
request.cookies.get("__Secure-better-auth.session_token")`) happened to be correct
today, but duplicates logic Better Auth already owns and would silently drift out of
sync with any cookie-name/prefix customization made in `better-auth.config.ts` later.
Confirmed via Better Auth's GitHub issues that `getSessionCookie()` from
`better-auth/cookies` is the documented, Edge-safe, officially recommended helper for
exactly this use case — switched both middlewares to use it instead.

**Confirmed clean, not flagged:** no `dangerouslySetInnerHTML` anywhere; grepped every
`"use client"` file for non-`NEXT_PUBLIC_` env var access and found none (only
`auth-client.ts`'s legitimate use of `NEXT_PUBLIC_APP_URL`); Better Auth's own CSRF
protection is active via `trustedOrigins`; cookies use Better Auth's httpOnly/secure/
sameSite=lax defaults (never overridden to something weaker).

---

## Project structure / tooling

### 16. `npm run typecheck` — the exact command in your validation checklist — didn't exist
**Where:** root `package.json`
Only `type-check` (with a hyphen) was defined. Added `typecheck` as an alias so both
spellings work.

### 17. `turbo.json`'s `lint` and `type-check` tasks required a full production build first
**Where:** root `turbo.json`
Both were wired with `"dependsOn": ["^build"]`, meaning a plain `npm run lint` would
trigger a full `next build` of every dependency first — slow, and it means a `lint`
failure could actually be masking an unrelated `build` failure instead of reporting
lint issues directly. Changed to `^lint` / `^type-check` respectively, matching every
package's own `lint`/`type-check` scripts. Also removed a `globalDependencies: [".env"]`
entry referencing a root `.env` file that was never created (each app scopes its own
`.env*` via the per-task `build.inputs`, which was already correct).

### 18. `packages/config/package.json` had two dead entries
A `"./tailwind-preset"` export pointed at `./tailwind/preset.ts`, which was never
created (the actual token/theme files are plain `.css`, imported directly — this
entry was leftover from an earlier draft of the approach). `"main": "index.js"` also
pointed at a file that doesn't exist. Neither was ever imported by anything (verified
by grep), so this wasn't causing a runtime error, but it's a landmine for anyone who
later does `import "@dbk/config"` expecting `main` to resolve. Removed both.

---

## Verified clean (audited, not flagged as issues)

- **Radix Dialog / Dropdown / Tooltip / NavigationMenu / Sheet / Popover / Tabs:** none
  of these are used anywhere in the codebase yet (only declared as dependencies for
  future sprints), so there was nothing to misuse. `Slot` (via `Button asChild`) was
  the only Radix primitive actually in use with a real bug — see #1.
- **`FormField`'s `React.cloneElement`:** every call site passes exactly one child
  element; no violation.
- **No `any` in source** (grepped the whole tree; the only hits were in
  framework-generated `.next/types`, which have been deleted from this delivery
  anyway since they're stale build output).
- **No circular imports** between packages (`types` → nothing; `utils` → `types`;
  `api-client`/`auth`/`ui` → `types`/`utils`; apps → all packages, never the reverse).

---

## Known follow-ups (not fixed — flagging honestly rather than silently leaving them)

- **`ProductGallery`'s thumbnail strip** uses `role="tablist"`/`role="tab"` without
  full keyboard arrow-key navigation or `aria-controls` — a simplified pattern, not a
  complete ARIA tabs implementation. Works fine with mouse/touch and screen readers can
  still navigate it via standard means, but a future pass should either implement full
  roving-tabindex keyboard support or switch to Radix's own `Tabs` primitive (already
  a declared dependency).
- **Better Auth's `user.additionalFields` config shape** and the `better-auth/cookies`
  and `better-auth/next-js` subpath exports are used per current documentation and
  several corroborating GitHub threads, but I could not execute-verify them against
  the exact installed `better-auth@^1.1.10`. If `npm install`/`npm run build` flags
  anything in `packages/auth`, it's the most likely place.
- **Everything flagged as out of scope in the previous delivery is still out of
  scope**: Orders, Wishlist, Addresses, Messages, Notifications, Settings, Checkout,
  and the Creator app's Products/Orders/Analytics/Payouts pages and full registration
  flow. Nothing here regressed that list; it's unchanged from before.
- **Guest cart** (`apps/buyer/app/api/cart/route.ts`) still returns an empty stub for
  unauthenticated visitors rather than a real session-scoped guest cart — flagged
  inline in the code, same as the previous delivery.

---

## What I could not do

I could not run `npm install`, `npm run dev`, `npm run build`, `npm run lint`, or
`npm run typecheck` in this sandbox (tarball downloads from the npm registry return
403). Every fix above was made and cross-checked by reading source directly, tracing
the full import graph by hand, and verifying the two claims I was least confident about
(Tailwind v4's monorepo content-detection limitation, and Better Auth's recommended
middleware helper) against current documentation and GitHub issues via web search.
Please run the four commands yourself before treating this as production-ready, and
send me the exact output if anything still fails — with a real error message I can fix
it precisely rather than guessing.

---

## Sprint 0.75 — Shared Commerce Foundation

Added reusable, product-agnostic frontend infrastructure to `packages/ui`,
`packages/utils`, and `packages/api-client`: shared hooks, dashboard layout
primitives (including an extended, backward-compatible collapsible
`Sidebar`), abstraction-only upload infrastructure, reusable search
infrastructure, a notification center, `ErrorBoundary`/`ApiErrorState`/`NetworkErrorState`,
a `Shimmer` loading effect, and a generic optimistic-mutation wrapper +
query-key factory. Zero new npm dependencies. Full inventory in
`docs/frontend/shared-commerce-foundation.md`, IMPLEMENTATION_REPORT.md,
and MERGE_CHECKLIST.md.

Same sandbox limitation as above applies: no `npm install` in this
session, so this was validated via a standalone `tsc` syntax pass plus
manual review against this repo's actual `tsconfig.base.json`
(`noUncheckedIndexedAccess`, `strict`) and `packages/config/eslint/base.js`
rule set, not a live lint/typecheck/build run. See IMPLEMENTATION_REPORT.md
for specifics.
