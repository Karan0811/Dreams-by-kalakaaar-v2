# MVP User Testing

Phase-by-phase manual test checklist for the Buyer MVP flows. This document
did not exist before Phase 1 (Cart) — it is created here per the Sprint 02
audit workflow and will grow with each subsequent phase (Orders, Wishlist
UI, Addresses UI, Checkout, ...).

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

*Sections for Orders, Wishlist (UI), Addresses (UI), Checkout, and other
deferred flows will be added here as those phases are completed.*
