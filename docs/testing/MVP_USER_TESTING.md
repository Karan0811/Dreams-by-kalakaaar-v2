# MVP User Testing

Phase-by-phase manual test checklist for the Buyer MVP flows. This document
did not exist before Phase 1 (Cart) — it is created here per the Sprint 02
audit workflow and will grow with each subsequent phase (Wishlist UI,
Addresses UI, and others still to come).

Run this against a real environment: a live Postgres database (migrated +
seeded), a running `backend` instance, and a running `apps/buyer` instance.
Nothing below has been executed in the sandbox this was built in — it has
no network egress and no `node_modules` installed, so no server could be
started to exercise these live. Every box is unchecked until you run it.

Legend: **[ ]** = not yet run. Check off as you verify each one.

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
- Pass/Fail: [ ]

**Buyer ID tampering**
- Steps: `POST /v1/users/me/orders` with `{ "shippingAddressId": "<valid-id>", "userId": "<someone-elses-id>" }` using Buyer A's own access token.
- Expected Result: the order is created for Buyer A (the token's subject), never for the `userId` in the body.
- Pass/Fail: [ ]

**Another user's shipping address ID**
- Steps: As Buyer A, note Buyer B's `shippingAddressId` (or any UUID not owned by A). `POST /v1/users/me/orders` with that ID using Buyer A's token.
- Expected Result: `404 NOT_FOUND` ("Shipping address not found") — never a 500, and never an order created against another buyer's address.
- Pass/Fail: [ ]

**Another user's order ID**
- Steps: As Buyer A, place an order and note its ID. Log in as Buyer B and call `GET /v1/users/me/orders/{Buyer A's orderId}` and `POST /v1/users/me/orders/{Buyer A's orderId}/cancel`.
- Expected Result: both return `404 NOT_FOUND`; Buyer A's order is untouched.
- Pass/Fail: [ ]

**Quantity 0 / negative / extremely large**
- Steps: These can't be sent at order-creation time (no quantity field exists there) — instead try them against the Cart endpoints: `POST /v1/users/me/cart/items` and `PATCH /v1/users/me/cart/{cartItemId}` with `quantity: 0`, `quantity: -5`, and `quantity: 999999`.
- Expected Result: all three are rejected with `422` by the Cart module's own schema (`min(1).max(99)`) before ever reaching an order; a quantity within range but exceeding real stock is separately rejected by checkout's own stock check.
- Pass/Fail: [ ]

**Create an order with an empty cart (API-level)**
- Steps: With a genuinely empty cart, `POST /v1/users/me/orders` with a valid `shippingAddressId`.
- Expected Result: `422 VALIDATION_ERROR`, "Your cart is empty."
- Pass/Fail: [ ]

**Cart modified between checkout display and order creation**
- Steps: Open `/checkout` in one tab (loads and displays the current cart). In another tab/session, remove or change quantity of an item in that same cart. Back in the first tab, click "Place Order" without refreshing.
- Expected Result: the order reflects the cart's state **at submit time** (from the second tab's changes), not what was displayed when the first tab loaded — confirms the server re-reads the cart rather than trusting anything the client sent.
- Pass/Fail: [ ]

**Duplicate submission (double-click / concurrent retry)**
- Purpose: confirm a double-click (or a client retrying a timed-out request) can't create two orders from the same cart.
- Steps: Click "Place Order" twice in rapid succession (or fire two concurrent `POST /v1/users/me/orders` requests with the same body/token at the same time).
- Expected Result: exactly one order is created; the second request either fails with "Your cart is empty" (if it lands after the first commits) or is blocked/serialized by the database lock until the first completes. Never two orders from one cart.
- Pass/Fail: [ ]

**Unauthenticated order creation**
- Steps: `POST /v1/users/me/orders` with no `Authorization` header (or an invalid/expired one).
- Expected Result: `401 AUTHENTICATION_ERROR`; no order created.
- Pass/Fail: [ ]

---

*Sections for Wishlist (UI), Addresses (UI), and other deferred flows will
be added here as those phases are completed.*

