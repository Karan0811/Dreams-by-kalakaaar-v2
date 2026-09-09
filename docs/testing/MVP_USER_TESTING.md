# MVP User Testing

Phase-by-phase manual test checklist for the Buyer MVP flows. Created for
Phase 1 (Cart), extended through Phase 2 (Checkout + Order Creation), and
Phase 3 (MVP Frontend + E2E Hardening).

**Phase 3 update:** unlike Phases 1–2 — which were written without a running
environment — Phase 3 stood up a real local stack (Postgres 16 + Redis +
migrated/seeded database + backend + both frontend apps, all actually
running) and exercised it directly. Items below marked **[x] (verified
Phase 3, API-level)** were confirmed for real against that stack via direct
HTTP requests (curl) to the backend and BFF routes — not by clicking through
the rendered browser UI, since this sandbox has no browser automation tool.
Cart, Checkout, and Orders pages in this codebase are client-rendered
("use client" components fetching via TanStack Query after hydration), so a
non-JS HTTP client only ever sees the loading shell — the underlying API
contracts those components call were verified directly instead. Everything
still marked **[ ]** genuinely still needs a real click-through in a
browser before sign-off. Do not check a box based on this document alone.

Legend: **[ ]** = not yet run · **[x] (verified Phase 3, API-level)** = the
underlying API/service behavior was confirmed live; the UI interaction
itself still needs a manual browser pass.

---

## Phase 1 — Cart

Flow under test: **Login → Product → Add to Cart → Cart → Quantity Update
→ Remove Item.**

### Add to Cart

**Add a product to cart (logged in)**
- Purpose: confirm the primary Add to Cart action on a product detail page actually creates a cart item against the real backend.
- Steps: Log in as a buyer. Open a product detail page for an ACTIVE product with in-stock inventory. Click "Add to Cart".
- Expected Result: toast "Added to cart"; the cart icon/badge in the site header updates its count; `GET /v1/users/me/cart` (or the Cart page) shows the item.
- Pass/Fail: [ ]

**Add to Cart — sold out product**
- Purpose: confirm a sold-out product can't be added.
- Steps: Open a product whose availability is `sold_out`.
- Expected Result: the button reads "Notify Me When Available" and is disabled as an Add-to-Cart action; no cart item is created.
- Pass/Fail: [ ]

**Add to Cart — same variant twice**
- Purpose: confirm adding an already-in-cart variant merges quantity instead of creating a duplicate row.
- Steps: Add the same product twice (e.g. via the sticky mobile bar, then the panel button).
- Expected Result: cart still shows a single line item for that variant, with quantity 2; no duplicate rows.
- Pass/Fail: [ ]

**Add to Cart — signed out**
- Purpose: confirm a signed-out visitor gets a clear sign-in prompt instead of a silent/confusing failure.
- Steps: Log out. Open a product detail page. Click "Add to Cart".
- Expected Result: toast "Please sign in to add items to your cart." (not the generic "please try again" message); no cart item is created anywhere.
- Pass/Fail: [ ]

### Cart Page

**View cart (logged in, has items)**
- Purpose: confirm the cart page renders real items with correct price, quantity, and subtotal.
- Steps: Add 1–2 products to cart, navigate to `/cart`.
- Expected Result: each line shows product title (linking to the product page), variant attributes (if any), unit price, and quantity controls; "Subtotal (N items)" matches `sum(price × quantity)`.
- Pass/Fail: [ ]

**View cart — empty**
- Purpose: confirm a genuinely empty cart shows the empty state, not an error.
- Steps: As a logged-in buyer with nothing in cart, navigate to `/cart`.
- Expected Result: "Your cart is empty" with a "Browse Products" CTA.
- Pass/Fail: [ ]

**View cart — signed out**
- Purpose: confirm a signed-out visitor navigating directly to `/cart` sees a sign-in prompt, not a false "empty cart" message.
- Steps: Log out. Navigate directly to `/cart`.
- Expected Result: "Sign in to view your cart" with a "Sign In" button linking to `/login` — **not** "Your cart is empty".
- Pass/Fail: [ ]

**Cart — only own items visible**
- Purpose: confirm a buyer can never see another buyer's cart.
- Steps: As Buyer A, add an item to cart. Log out, log in as Buyer B (no items added).
- Expected Result: Buyer B's `/cart` is empty; Buyer A's item never appears for Buyer B.
- Pass/Fail: [ ]

### Quantity Update

**Increase quantity**
- Purpose: confirm the `+` control increases quantity and updates the subtotal.
- Steps: On `/cart`, click `+` on a line item.
- Expected Result: quantity increments by 1; subtotal recalculates; the `+` button disables once `quantity === quantityAvailable`.
- Pass/Fail: [ ]

**Decrease quantity**
- Purpose: confirm the `-` control decreases quantity and the button disables at 1.
- Steps: Click `-` on a line item with quantity 2, then again at quantity 1.
- Expected Result: quantity decrements to 1; the `-` button is disabled at quantity 1 (removal is a separate explicit action, not decrement-to-zero).
- Pass/Fail: [ ]

**Quantity update — exceeds stock**
- Purpose: confirm the client can't request more than server-known stock, and the server independently rejects it too.
- Steps: Attempt to increase quantity past `quantityAvailable` (e.g. via rapid clicks, or directly calling `PATCH /v1/users/me/cart/{cartItemId}` with an inflated quantity).
- Expected Result: UI shows "Only N available." toast and blocks the client-side attempt; a direct API call with an excessive quantity gets `422` from the server (`InsufficientStockError`), never a silent success.
- Pass/Fail: [ ]

**Quantity update — variant no longer available**
- Purpose: confirm a variant that became inactive after being added shows correctly and can't be adjusted.
- Steps: Add a variant to cart, then have it set to a non-ACTIVE status (or soft-delete its product) from the creator/admin side, then revisit `/cart`.
- Expected Result: line item shows "No longer available" instead of quantity controls; the item can still be removed.
- Pass/Fail: [ ]

### Remove Item

**Remove a single item**
- Purpose: confirm the trash icon removes only that line item.
- Steps: With 2+ items in cart, click the trash icon on one.
- Expected Result: toast "Removed from cart"; that item disappears; other items and the subtotal remain correct.
- Pass/Fail: [ ]

**Remove last item**
- Purpose: confirm removing the only item returns to the empty-cart state.
- Steps: Remove the only item in the cart.
- Expected Result: cart page shows the "Your cart is empty" state.
- Pass/Fail: [ ]

**Remove — cross-user protection**
- Purpose: confirm a buyer cannot remove another buyer's cart item by guessing/reusing a `cartItemId`.
- Steps: As Buyer A, note a `cartItemId` from their cart. Log in as Buyer B and call `DELETE /v1/users/me/cart/{that cartItemId}`.
- Expected Result: `404` (item not found for this user); Buyer A's item is untouched.
- Pass/Fail: [ ]

### Data Integrity

**Price is never trusted from the client**
- Purpose: confirm line-item price always reflects `productVariants.priceAmount` server-side, never a client-supplied value.
- Steps: Inspect the `POST /v1/users/me/cart/items` and `PATCH /v1/users/me/cart/{cartItemId}` request/response bodies — confirm neither accepts nor echoes a client-supplied price; confirm the cart subtotal always matches current variant prices in the database.
- Pass/Fail: [ ]

**Soft-deleted product disappears from cart**
- Purpose: confirm a product removed (soft-deleted) by its creator no longer appears in a buyer's cart or blocks checkout silently.
- Steps: Add a product to cart, then soft-delete that product from the creator side, then reload `/cart`.
- Expected Result: the item no longer appears in the cart (it's filtered server-side, same as the Wishlist module); attempting to add/update that variant directly via the API returns the "not available" error, not a silent success.
- Pass/Fail: [ ]

---

## Phase 2 — Checkout + Order Creation

Flow under test: **Buyer → Cart → Checkout → Create Order → Order Confirmation.**

### Automated vs. manual coverage — read this first

`backend/src/modules/orders/__tests__/checkout-safety.test.ts` covers the
Service Layer's wiring (`createOrder` delegates to `checkoutFromCart` with
the right arguments, returns its result unmodified, and propagates its
errors) with `checkoutFromCart` itself mocked out — it does **not** exercise
real SQL. The actual re-validation logic (stock checks, deleted-product
rejection, price/total computation, the empty-cart guard, the
duplicate-submission row lock) lives in `checkoutFromCart`
(`repository.ts`) and needs a **live Postgres database** to verify for
real — no automated test in this codebase (for any module) runs against a
live DB. Every item below needs to be run manually against a real
environment before this phase can be considered verified.

### Happy Path

**Full checkout flow**
- Purpose: confirm the entire buyer flow from cart to order confirmation works end-to-end.
- Steps: Log in. Add 1–2 products to cart. Open `/cart`, confirm quantities/total. Click through to `/checkout`. Confirm the order summary matches the cart. Select (or add) a shipping address. Click "Place Order".
- Expected Result: success toast "Order placed!"; redirected to `/account/orders/{orderId}`; that page shows status "Pending", the correct items, quantities, unit prices, line totals, and shipping address; the cart is now empty.
- Pass/Fail: [ ]

**Order appears in order history**
- Purpose: confirm a placed order shows up in the buyer's order list.
- Steps: After placing an order, navigate to `/account/orders`.
- Expected Result: the new order appears at the top (most recent first) with status "Pending" and the correct total.
- Pass/Fail: [ ]

**Order items match cart exactly**
- Purpose: confirm quantities and prices on the order match what was in the cart at submit time.
- Steps: Add 2 different products with different quantities, check out, compare the order detail page line-by-line against what the cart showed.
- Expected Result: same products, same quantities, same unit prices, same computed total (`sum(unitPriceAmount × quantity)` for both).
- Pass/Fail: [ ]

### Validation

**Empty cart cannot check out**
- Purpose: confirm an empty cart can't produce an order.
- Steps: With an empty cart, navigate directly to `/checkout`.
- Expected Result: "Your cart is empty" empty state with a "Browse Products" CTA — no "Place Order" button is ever shown. (Separately: a direct `POST /v1/users/me/orders` call with an empty cart returns `422` / `VALIDATION_ERROR`.)
- Pass/Fail: [ ]

**No saved address**
- Purpose: confirm checkout can't proceed without a shipping address.
- Steps: As a buyer with no saved addresses, add items to cart and go to `/checkout`.
- Expected Result: "You don't have any saved addresses yet." with an "Add an address" link; "Place Order" is disabled until an address exists and is selected.
- Pass/Fail: [ ]

**Product goes out of stock after cart, before checkout**
- Purpose: confirm the server re-checks stock at order-creation time, not just at add-to-cart time.
- Steps: Add a product to cart. From another session/admin, reduce that variant's stock below the cart quantity (or set it out of stock). Return to `/checkout` and click "Place Order".
- Expected Result: order is rejected with a clear "no longer has enough stock" message; no order or order items are created; cart is untouched (item remains for the buyer to adjust).
- Pass/Fail: [ ]

**Product deleted after cart, before checkout**
- Purpose: confirm a soft-deleted product blocks checkout instead of silently vanishing from the total.
- Steps: Add a product to cart. Soft-delete that product from the creator side. Return to `/checkout` and click "Place Order".
- Expected Result: order is rejected (same "no longer available" class of message as the stock case above); no order is created with a missing/lower total than expected.
- Pass/Fail: [ ]

### Security / Tampering

Most of the scenarios below are prevented **by the shape of the API itself**
— `POST /v1/users/me/orders` accepts only `{ shippingAddressId }`; there is
no price, total, buyer ID, or product/cart ID field for a client to send in
the first place, and the authenticated `userId` always comes from the
verified access token, never the request body. Confirm this holds for real
by trying the raw requests below (e.g. via curl/Postman) against a running
backend, not just the buyer UI:

**Price/total tampering**
- Steps: `POST /v1/users/me/orders` with a body like `{ "shippingAddressId": "<valid-id>", "totalAmount": 1, "unitPriceAmount": 1 }`.
- Expected Result: the extra fields are silently ignored (Zod strips unknown keys); the created order's total reflects real database prices, not `1`.
- Pass/Fail: [x] (verified Phase 3, API-level) — with 1 real item (₹650) in cart, this exact tampered body produced an order with `subtotalAmount: 65000` (₹650), not `1`.

**Buyer ID tampering**
- Steps: `POST /v1/users/me/orders` with `{ "shippingAddressId": "<valid-id>", "userId": "<someone-elses-id>" }` using Buyer A's own access token.
- Expected Result: the order is created for Buyer A (the token's subject), never for the `userId` in the body.
- Pass/Fail: [x] (verified Phase 3, API-level) — sent `userId: "00000000-0000-0000-0000-000000000000"` in the body; the created order's `userId` was the authenticated buyer's real ID.

**Another user's shipping address ID**
- Steps: As Buyer A, note Buyer B's `shippingAddressId` (or any UUID not owned by A). `POST /v1/users/me/orders` with that ID using Buyer A's token.
- Expected Result: `404 NOT_FOUND` ("Shipping address not found") — never a 500, and never an order created against another buyer's address.
- Pass/Fail: [x] (verified Phase 3, API-level) — Buyer B calling `POST /v1/users/me/orders` with Buyer A's real `shippingAddressId` got `404`, not `500`.

**Another user's order ID**
- Steps: As Buyer A, place an order and note its ID. Log in as Buyer B and call `GET /v1/users/me/orders/{Buyer A's orderId}` and `POST /v1/users/me/orders/{Buyer A's orderId}/cancel`.
- Expected Result: both return `404 NOT_FOUND`; Buyer A's order is untouched.
- Pass/Fail: [x] partial (verified Phase 3, API-level) — `GET` correctly returned `404`. `POST .../cancel` returned `404` too with a normal request body, **but returned `500` (not `404`) when sent with a completely empty body** — the route handler's `await request.json()` throws on empty input instead of treating it as "no reason given." **Not reachable through the real frontend** (`cancelOrder()` in `orders.server.ts` always sends a JSON body, even `{}}`, since `reason` is optional) — found only by sending a raw request with no body. Flagged as a backend defensive-coding gap for a future hardening pass; not fixed here since it's backend route code outside Phase 3's frontend scope and isn't reachable via any real client.

**Quantity 0 / negative / extremely large**
- Steps: These can't be sent at order-creation time (no quantity field exists there) — instead try them against the Cart endpoints: `POST /v1/users/me/cart/items` and `PATCH /v1/users/me/cart/{cartItemId}` with `quantity: 0`, `quantity: -5`, and `quantity: 999999`.
- Expected Result: all three are rejected with `422` by the Cart module's own schema (`min(1).max(99)`) before ever reaching an order; a quantity within range but exceeding real stock is separately rejected by checkout's own stock check.
- Pass/Fail: [ ]

**Create an order with an empty cart (API-level)**
- Steps: With a genuinely empty cart, `POST /v1/users/me/orders` with a valid `shippingAddressId`.
- Expected Result: `422 VALIDATION_ERROR`, "Your cart is empty."
- Pass/Fail: [x] (verified Phase 3, API-level) — got exactly this response with a genuinely empty cart.

**Cart modified between checkout display and order creation**
- Steps: Open `/checkout` in one tab (loads and displays the current cart). In another tab/session, remove or change quantity of an item in that same cart. Back in the first tab, click "Place Order" without refreshing.
- Expected Result: the order reflects the cart's state **at submit time** (from the second tab's changes), not what was displayed when the first tab loaded — confirms the server re-reads the cart rather than trusting anything the client sent.
- Pass/Fail: [ ]

**Duplicate submission (double-click / concurrent retry)**
- Purpose: confirm a double-click (or a client retrying a timed-out request) can't create two orders from the same cart.
- Steps: Click "Place Order" twice in rapid succession (or fire two concurrent `POST /v1/users/me/orders` requests with the same body/token at the same time).
- Expected Result: exactly one order is created; the second request either fails with "Your cart is empty" (if it lands after the first commits) or is blocked/serialized by the database lock until the first completes. Never two orders from one cart.
- Pass/Fail: [x] (verified Phase 3, API-level) — fired 2 truly concurrent `POST` requests (backgrounded curl, same cart/token). Exactly one returned `201` with a real order; the other returned `422` "Your cart is empty" — the `FOR UPDATE` cart-row lock serialized them correctly.

**Unauthenticated order creation**
- Steps: `POST /v1/users/me/orders` with no `Authorization` header (or an invalid/expired one).
- Expected Result: `401 AUTHENTICATION_ERROR`; no order created.
- Pass/Fail: [x] (verified Phase 3, API-level) — got `401`.

---

## Phase 3 — MVP Frontend + E2E Hardening

Scope: audit every buyer/creator MVP page for complete/incomplete/broken/
missing, fix genuinely broken things using the existing architecture (no
new business features, no backend changes beyond what's documented below
as out of scope), verify real timings, and re-validate the whole stack.

Unlike Phases 1–2 (written without a running environment), Phase 3 stood up
a real local stack — Postgres 16 + Redis + migrated/seeded database +
backend + both frontend apps, all actually running — and exercised it
directly. Items above marked **[x] (verified Phase 3, API-level)** were
confirmed for real via direct HTTP requests to the backend and BFF routes,
not by clicking through the rendered browser UI (this sandbox has no
browser automation tool). Cart, Checkout, and Orders pages in this codebase
are client components (fetch via TanStack Query after hydration), so a
non-JS HTTP client only ever sees the loading shell — the underlying API
contracts those components call were verified directly instead. Anything
still marked **[ ]** genuinely still needs a real browser click-through.

### Audit findings

**Complete and working (code review + live verification):** Home, Products,
Product Detail, Cart, Checkout, Orders list, Order Detail, Addresses,
Notifications, Wishlist. No 10+ second delays found anywhere in this flow —
see Performance below.

**Broken — fixed this phase:**
- Buyer account nav (`AccountNav.tsx`) and the account dashboard's shortcut
  cards linked to `/account/messages` and `/account/settings`, neither of
  which exists as a page — 404 on every account page load. Messages has no
  backend module at all; Settings has a working backend endpoint
  (`GET/PATCH /v1/users/me/profile`) but zero frontend wiring anywhere.
  Both are outside the buyer's stated MVP priority flow. **Fix:** removed
  both dead links; replaced the dashboard's dead Messages/Settings cards
  with a working Addresses card. Settings is a reasonable candidate for a
  future phase since its backend is already built.
- Creator dashboard's Pending Actions and Last 30 Days widgets
  (`DashboardOverview.tsx`) call `/creator/dashboard/pending-actions` and
  `/creator/dashboard/performance` — **neither endpoint exists in the
  backend at all** (confirmed via full source search). Worse, the
  component didn't check `isError`, so a failed request silently rendered
  "You're all caught up" / "No sales data yet" instead of an error — a
  false-empty state. **Fix:** added `isError` handling using the existing
  `ErrorState` component (same pattern as `NotificationsClient.tsx`), so a
  failure now shows a real error with retry instead of a fake empty state.
  The missing backend endpoints themselves are **not** built this phase —
  no `creator/dashboard` module exists; building one is new backend
  feature work outside a frontend-hardening phase's scope.
- Google Fonts build/dev failure (see Performance below).

**Incomplete — completed this phase (small, data already existed):**
- Order Detail (`OrderDetailClient.tsx`) showed quantity and line total per
  item but not unit price, even though the API already returns
  `unitPriceAmount`. This file (Phase 2, above) already documented unit
  price as expected. **Fix:** now shows "Qty N × ₹X" alongside the line
  total.

**Missing — confirmed no backend support, not built (out of scope):**
- Creator order visibility (no `creator/orders` endpoint exists — only
  `admin/orders` and the buyer's own `users/me/orders`).
- Buyer Settings/profile-edit page (backend ready, no frontend at all, not
  in the stated priority flow).
- Buyer Messages (no backend module at all).

**Found, not fixed (explicitly out of scope):** `POST
/v1/users/me/orders/{orderId}/cancel` returns `500` instead of `404` when
sent a request with a completely empty body — not reachable through the
real frontend. See the "Another user's order ID" row above. This is
backend route code; flagged for a future backend hardening pass rather
than fixed here.

### Performance

Measured against the real local stack described above (not estimated):

| Operation | Warm timing |
|---|---|
| Products list (backend-direct) | ~250–300ms |
| Product detail (backend-direct) | ~270–420ms |
| Cart get/add (backend-direct) | ~250–300ms |
| Addresses create (backend-direct) | ~250ms |
| Checkout / order creation (backend-direct) | ~264ms |
| Order detail (backend-direct) | ~330–350ms |
| Buyer SSR pages, warm (home, products, cart, checkout, orders, addresses) | ~90–520ms |

No operation in the priority flow showed a 10+ second delay. This is
consistent with the separate performance-audit work already having
addressed the major backend bottlenecks (redundant session calls, N+1
queries, missing indexes, over-fetching) in earlier phases.

**Root cause found and fixed this phase — Google Fonts build/dev failure.**
Both `apps/buyer/app/layout.tsx` and `apps/creator/app/layout.tsx` used
`next/font/google` (Inter, Fraunces), which fetches from
`fonts.googleapis.com` at both `next build` time and on each `next dev`
cold compile. In a network-restricted environment, this fetch fails; `next
build` fails outright (confirmed same result in the Phase 1/2 audit); `next
dev` retries 3× with backoff before falling back — **measured at ~12–14
seconds added to the first compile of the very first route hit**, and
recurring on every subsequent cold compile of a new route. This plausibly
explains some portion of "even when the network itself does not appear to
be the problem" 10+ second reports. **Fix:** replaced both with
self-hosted `@fontsource/inter` / `@fontsource/fraunces` (bundled via npm,
zero network calls at build or runtime). This happened to align exactly
with `@dbk/config/tailwind/tokens.css`'s existing
`--font-family-sans`/`--font-family-serif` values (already literally
`"Inter"`/`"Fraunces"`), so no token or Tailwind change was needed.
Verified: no more font-fetch errors in dev server logs, and **both buyer
and creator `next build`s now succeed with zero workaround** (previously
needed a temporary stub-and-revert just to validate the rest of the build
pipeline).

**Not found:** duplicate/redundant requests. The `getServerSession()`
`cache()`-based de-dup from the earlier perf audit is intact and confirmed
working. No N+1 patterns found in the pages exercised this phase.

**Not measurable in this sandbox:** true browser-rendered (post-hydration,
client-fetch) timing for Cart/Checkout/Orders/Addresses pages — these are
client components, so a non-JS HTTP client only observes the SSR loading
shell, not the actual data-fetch-and-render sequence a real browser would
show. The underlying API calls those components make were verified
directly instead (see table above and the re-checked Security/Tampering
rows). A real browser-based pass (Lighthouse, or manual DevTools
Network-tab timing) is still recommended before final production sign-off.

### Build / Test Results

- Backend: `typecheck` ✅ clean · `lint` ✅ 0 errors, 1 pre-existing warning
  (`assign-admin.ts`, unrelated to this phase) · `test` ✅ 103/103 passing,
  11 files · `build` ✅ succeeds.
- Frontend (all 8 packages via Turborepo): `type-check` ✅ clean across
  every package · `lint` ✅ 0 errors, only pre-existing warnings (none
  newly introduced by this phase's edits).
- `apps/buyer` production build (`next build`) ✅ succeeds, including
  `/account/orders/[orderId]` (unit-price fix) and every other route — no
  font workaround needed.
- `apps/creator` production build (`next build`) ✅ succeeds, including
  `components/DashboardOverview.tsx` (error-state fix) — no font
  workaround needed.

### Remaining manual tests / blockers

- A real browser click-through of the full buyer flow (Home → Products →
  Product Detail → Cart → Checkout → Address → Order Confirmation → Orders
  → Order Detail) has not been done — this sandbox has no browser
  automation tool. Everything client-rendered was verified at the API
  level only (see Performance above).
- The Quantity 0/negative/large and "cart modified mid-checkout" Phase 2
  rows above are still genuinely unverified — not attempted this phase.
- The confirmed `cancel`-with-empty-body `500` (see above) needs a backend
  fix in a future phase; not attempted here as it's outside frontend scope
  and not reachable through the real client.
- Settings (buyer profile editing) has a working backend endpoint but no
  frontend at all — good candidate for a dedicated future phase.

---

## Phase 4 — Product Completeness + Modern UI

Scope: implement genuinely missing MVP product functionality (buyer variant
selection was the confirmed gap), verify Cart/Checkout/Order correctness
with real variants, audit the creator product lifecycle, and apply a
tasteful UI modernization pass without redesigning the architecture, RLS,
or the separate backend performance work.

### 1. Product completeness

**Confirmed gap (the codebase's own comments said as much):** the buyer
Product Detail page had no variant-selector UI at all. `getPublicProductDetail`
computed every ACTIVE variant via `findVariantsForProduct` but discarded all
but one auto-picked default; `ProductPurchasePanel` only ever added that
single fixed `variantId` to cart. A product with, say, King/Queen sizes at
different prices had no way for a buyer to pick between them — Add to Cart
silently used whichever variant the backend defaulted to.

**Fixed:**
- Backend (`modules/products/service.ts`): `getPublicProductDetail` now
  returns a `variants[]` array — every ACTIVE variant with its `attributes`,
  `price`, and per-variant `availability` (`in_stock`/`low_stock`/`sold_out`,
  computed the same way the existing product-list aggregate does it, just
  per variant). Additive only — no changes to RLS, the cart/order
  transaction logic, or the separate performance-audit code paths.
- Frontend types (`@dbk/types`): added `ProductVariant` and a `variants`
  field on `Product`.
- Frontend (`apps/buyer`): new `ProductVariantSelector` (attribute-grouped
  pill picker — a "Size" row, a "Color" row, etc.), a `ProductVariantProvider`
  context so the selector, the live price/availability display, and the
  mobile sticky Add-to-Cart bar all agree on one selection, and rewired
  `ProductPurchasePanel` + `StickyAddToCartBar` to add the *selected*
  variant's real ID — not a fixed default — with per-variant sold-out/price
  handling.
- Order Detail: variant attributes (e.g. "Size: Queen") were already
  captured in `variantAttributesSnapshot` at order time but never rendered;
  now shown alongside quantity/unit price/line total.

**Verified live** against a real running stack (Postgres 16 + Redis +
migrated/seeded DB + backend + buyer app):
- Fetched a real two-variant product (`indigo-block-printed-bedsheet-set-*`,
  King ₹2,400 / Queen ₹2,100) — confirmed the API returns both with correct
  per-variant prices.
- Added the Queen variant to cart via the real BFF route
  (`POST /api/cart/items`) and confirmed the cart entry's `variant.attributes`
  and `priceAmount` were Queen's, not King's.
- Checked out and confirmed the resulting order's `subtotalAmount` was
  exactly Queen's price (`210000` for qty 1, `420000` for qty 2 on a second
  pass) — never King's — and the order item's `variantAttributesSnapshot`
  correctly recorded `{"size":"Queen"}`.
- **Stock validation, defense in depth:** forced the King variant's
  inventory to 0 directly in the database, confirmed the product API
  correctly reported `"availability": "sold_out"` for that variant only
  (Queen unaffected), and confirmed `POST /api/cart/items` for the sold-out
  King variant is rejected **server-side** with `422` ("Only 0 unit(s)
  available for this variant") — not just hidden/disabled in the UI.

**Creator product lifecycle — audited, not rebuilt.** `ProductCreateForm`,
`ProductEditView`, `ProductVariantManager`, `ProductInventoryPanel`,
`ProductStatusPanel`, and `ProductImageGallery` were already fully wired to
real backend mutations (create/update/archive/delete for products and
variants, relative stock adjustment, publish/pause/archive with the
backend's own readiness validation surfaced as real errors). No bugs found;
nothing needed to be built here — this was already complete MVP
functionality, contrary to what the gap in buyer variant selection might
have suggested about the rest of the lifecycle.

**Not built (no backend support, or already ruled out of scope):** creator
order visibility, buyer Messages, Razorpay/payment — unchanged from Phase 3,
still correctly out of scope.

### 2. UI/UX modernization

The existing design-token foundation (`@dbk/config/tailwind/tokens.css`) was
already a considered warm terracotta/olive/gold palette with a real design
doc behind it — not a generic template — so this was an enhancement pass on
top of it, not a redesign. Changed, in order of reach (most-shared
component first):

- **`ProductCard`** (used in every product grid — Home, Products, Related
  Products, Wishlist): shadow-lift on hover instead of a flat static image,
  serif product titles for hierarchy, compare-at-price (strikethrough)
  shown when present, smoother image zoom transition.
- **`Navbar`**: every interactive element (menu, search, wishlist, cart,
  account) now has an explicit color transition instead of an instant snap;
  active nav links get a pill background instead of just a color change;
  logo gets a small brand-accent mark.
- **`Button`** primary variant: added shadow depth (`shadow-sm` resting,
  `shadow-md` on hover, no shadow on press) for a more tactile feel.
- **`EmptyState`**: icon now sits in a soft circular badge instead of
  floating bare — used across Cart, Orders, Wishlist, Notifications, etc.,
  so this one change reaches every empty state in the app.
- **Cart page** (`CartView`): the two hand-rolled empty states (signed-out,
  empty cart) now use the shared `EmptyState` component (picking up its
  icon-badge polish for free instead of duplicating markup); line-item
  cards get a shadow-lift on hover; the quantity stepper is now a single
  grouped pill control instead of two separate buttons.
- **Product Detail**: price/availability now live-update with the selected
  variant (`ProductPriceDisplay`, new) instead of showing a frozen default.

**Deliberately not done this phase** (explicitly out of budget, flagged
rather than silently skipped): a dedicated pass on Checkout, Orders list,
and Account screens beyond what already existed; a mobile-specific
responsive audit beyond what the existing Tailwind breakpoints already
provide; new custom animation/transition work beyond applying the
existing `--duration-*`/`--ease-*` tokens to the components above.

### 3. Validation

- Backend: `typecheck` ✅ clean · `lint` ✅ 0 errors, 1 pre-existing warning
  (`assign-admin.ts`) · `test` ✅ 103/103 passing · `build` ✅ succeeds.
- Frontend (all 8 packages via Turborepo): `type-check` ✅ clean across
  every package · `lint` ✅ 0 errors; every warning count checked against
  the pre-change baseline and confirmed pre-existing (including the same
  `'CartEntry'`/`'Product'` type-only-import false positives already noted
  in Phase 3 — these are an existing ESLint-rule quirk, not real dead code).
- `apps/buyer` production build ✅ succeeds, including
  `/products/[slug]` (variant selector) and `/cart` (polish pass).
- `apps/creator` production build ✅ succeeds, unaffected by this phase's
  buyer-side and shared-`@dbk/ui` changes.
- Manual "Product → Variant → Cart → Checkout → Order" flow: **verified
  live**, API-level, as detailed in §1 above (real two-price product, real
  cart entry, real order, real stock rejection). Not verified via an actual
  browser click-through — this sandbox has no browser automation tool, same
  limitation noted in Phase 3.

### 4. Remaining gaps

- No browser-based visual QA (screenshots, actual click-through, responsive
  device testing) — only curl/API-level verification and code review were
  possible in this sandbox. The UI changes are typecheck/lint/build-clean
  and the underlying data flow is verified, but actual rendered appearance
  and responsive behavior have not been visually confirmed.
- Checkout, Orders, and Account screens did not get a dedicated visual
  polish pass this phase (see §2) — only what they inherited for free from
  the shared `EmptyState`/`Button` changes.
- The Phase 3 cancel-with-empty-body `500` and buyer Settings page remain
  open from Phase 3, unchanged.
- This sandbox's Postgres/Redis/dev-server processes were repeatedly killed
  and restarted by the environment during this phase (not by anything in
  the codebase) — seed data and all migrations survived every restart, and
  each verification step was re-confirmed after each restart, but this is
  worth noting as an environment characteristic, not a product issue.

---

*Sections for Wishlist (UI), Addresses (UI), and other deferred flows will
be added here as those phases are completed.*

