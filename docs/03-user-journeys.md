# 03 · User Journeys — Dreams by Kalakaaar v2

**Document owner:** UX Architecture & Product Design
**Status:** Draft for review
**Audience:** UX Designers, Product Managers, Engineers, QA, Support, Future team members
**Companion documents:** `00-project-vision.md`, `01-product-requirements.md`, `02-user-personas.md`

---

# 1. Introduction

### 1.1 Purpose

This document defines every end-to-end user journey on Dreams by Kalakaaar v2 — the complete sequence of behavior, decisions, and emotional states a person moves through to accomplish a goal on the platform. It exists so that no screen, flow, or interaction is designed in isolation from the full context that precedes and follows it.

Where `01-product-requirements.md` defines *what* the platform must do and `02-user-personas.md` defines *who* it serves, this document defines *how those people actually move through the product over time* — including the paths that don't go as planned. A journey is only complete when its failure paths, recovery paths, and edge cases are as well understood as its happy path.

### 1.2 Objectives

1. Provide a single, authoritative reference for every meaningful end-to-end journey across buyers, creators, and internal roles.
2. Make emotional state a first-class part of journey design, not an afterthought — consistent with the brand principles in `00-project-vision.md`.
3. Ensure every journey accounts for failure and recovery, not only the happy path, before any screen is designed.
4. Surface cross-functional journeys where buyer, creator, and internal roles intersect, since these are the highest-risk points for confusion, delay, and broken trust.
5. Give UX, Engineering, and QA a shared blueprint so that wireframes, technical estimates, and test plans can be produced without re-deriving basic flow logic from scratch.

### 1.3 Relationship to Other Documents

| Document | Relationship |
|---|---|
| `00-project-vision.md` | Provides the principles (Section 9), brand emotion (Section 19), and target audience (Section 6) that every journey below is designed to honor — especially around trust, simplicity, and emotional care. |
| `01-product-requirements.md` | Provides the functional requirements, business rules (Section 7), and state models (Section 8) that each journey's flows, failure paths, and business rules directly reference. |
| `02-user-personas.md` | Provides the people whose goals, emotional drivers, and pain points each journey is built around. Every journey below should be legible as "a day in the life of" one or more personas from that document. |

This document should be read **before** any wireframe, prototype, or UI specification is created.

---

# 2. Journey Framework

To keep journeys consistent and comparable, every journey in this document uses the same structural vocabulary, defined here.

| Term | Definition |
|---|---|
| **Journey** | A complete, end-to-end sequence of behavior undertaken by a user to accomplish a meaningful goal (e.g., "Checkout," "Order Fulfillment"). |
| **Task** | A discrete action within a journey (e.g., "select a shipping address" is a task within the Checkout journey). |
| **Goal** | The outcome the user is trying to achieve by undertaking the journey. |
| **Entry Point** | Where and how the user begins the journey (a specific page, notification, or external trigger). |
| **Exit Point** | Where the journey concludes, successfully or otherwise. |
| **Decision Point** | A moment within the journey where the user's choice materially changes the subsequent path. |
| **Happy Path** | The ideal, unobstructed sequence of steps from entry to successful goal completion. |
| **Alternate Path** | A valid, non-default sequence that still leads to a successful outcome (e.g., guest vs. signed-in checkout). |
| **Failure Path** | A sequence where the user's intended outcome is not achieved due to an error, unavailability, or policy constraint. |
| **Recovery Path** | The mechanism by which a user returns to a productive path after a failure. |
| **Edge Cases** | Low-frequency but real scenarios that must be handled deliberately rather than left undefined. |
| **Emotional State** | The likely emotional experience of the user at key moments in the journey, used to guide tone, pacing, and reassurance in design. |
| **Success Metrics** | The measurable indicators used to evaluate whether the journey is working well in production. |

Each journey documented in Sections 3–8 follows this consistent structure: **Goal, Trigger, Entry Point, Preconditions, Actors, Main Flow, Alternative Flows, Failure Flows, Recovery, Edge Cases, Emotions, Business Rules, Success Criteria.**

---

# 3. Buyer Journeys

### 3.1 Guest Browsing

| Field | Detail |
|---|---|
| Goal | Explore the platform's products and creators without commitment. |
| Trigger | Arrival via direct URL, search engine, social link, or paid campaign. |
| Entry Point | Homepage, a shared product link, or a shared collection link. |
| Preconditions | None — fully unauthenticated access. |
| Actors | Guest |
| Main Flow | Land on homepage or shared page → browse categories/collections → view product details → optionally wishlist (session-only) or add to cart → optionally sign up or proceed to guest checkout. |
| Alternative Flows | Arrives directly at a specific product via shared link and browses outward from there; arrives via search engine on a category page. |
| Failure Flows | Shared link points to an unpublished/removed listing; page fails to load due to connectivity. |
| Recovery | Unavailable listing shows a clear message with a link to similar products or the creator's storefront; connectivity failure shows a retry-friendly offline state. |
| Edge Cases | Guest returns after a long gap with an expired session cart; guest on very slow connection; guest arriving from a region with limited catalog relevance. |
| Emotions | Curious, exploratory, low-commitment; mild disappointment if a shared link is dead. |
| Business Rules | Guests cannot access account-only features (Section 3.1 of `01-product-requirements.md`). |
| Success Criteria | Guest views multiple products/creators and either proceeds toward a purchase-related action or exits with a positive impression (measured via return-visit rate). |

### 3.2 Account Registration

| Field | Detail |
|---|---|
| Goal | Create a persistent account to unlock full platform functionality. |
| Trigger | Guest attempts a restricted action (checkout, wishlist persistence, messaging) or proactively chooses to sign up. |
| Entry Point | "Sign up" call-to-action from any restricted-action prompt or the account menu. |
| Preconditions | None. |
| Actors | Guest → Buyer |
| Main Flow | Provide email and password (or choose third-party sign-in) → accept Terms of Service and Privacy Policy → receive verification email → confirm verification → land in authenticated Buyer context. |
| Alternative Flows | Registration initiated mid-task (e.g., during checkout), preserving the in-progress cart/action after successful verification. |
| Failure Flows | Email already registered; weak password rejected; verification email not received or link expired. |
| Recovery | Duplicate-email case offers a sign-in or password-reset path without confirming account existence explicitly; expired verification link offers one-tap resend. |
| Edge Cases | User registers with an email later found to be invalid/undeliverable; user abandons mid-registration and returns later with a partially created, unverified account. |
| Emotions | Mild friction tolerance if the value of registering is clear; frustration if the process feels like an unnecessary barrier to a simple task. |
| Business Rules | Email verification and Terms/Privacy consent are mandatory (AUTH-01, AUTH-02, LEGAL-01). |
| Success Criteria | User completes verification and reaches their originally intended task (e.g., resumes checkout) with minimal steps lost. |

### 3.3 Login

| Field | Detail |
|---|---|
| Goal | Regain access to an existing account. |
| Trigger | Returning user attempting any authenticated action. |
| Entry Point | "Sign in" call-to-action from homepage, account menu, or a restricted-action prompt. |
| Preconditions | User has a previously verified account. |
| Actors | Buyer, Creator, Internal roles (via a separate, more restrictive path) |
| Main Flow | Enter credentials or use third-party sign-in → system validates → user lands in their prior context (Buyer/Creator) or last intended destination. |
| Alternative Flows | Login initiated mid-task, preserving the interrupted action; login via "remember me" persisted session. |
| Failure Flows | Incorrect credentials; too many failed attempts triggering rate limiting; account suspended or deleted. |
| Recovery | Generic "incorrect credentials" message with a password-reset link; suspended accounts see a clear status message rather than a generic error. |
| Edge Cases | User has both Buyer and Creator profiles and must land in the correct context or be offered a clear switch; user attempts login on a device that hasn't seen prior session data. |
| Emotions | Mild impatience if login is slow or unclear; frustration and anxiety if repeatedly locked out. |
| Business Rules | Progressive rate limiting on repeated failures (AUTH-03); internal roles require elevated verification (AUTH-08). |
| Success Criteria | Fast, low-friction return to the intended task with minimal re-authentication steps required across visits. |

### 3.4 Search Product

| Field | Detail |
|---|---|
| Goal | Find relevant products or creators matching a specific need or idea. |
| Trigger | User has a product idea, occasion, or keyword in mind. |
| Entry Point | Search bar, available globally. |
| Preconditions | None. |
| Actors | Guest, Buyer |
| Main Flow | Enter query → view ranked results → apply filters/sort → select a result → land on product detail or storefront. |
| Alternative Flows | Query returns a mix of products and creators, requiring the user to choose which to explore; user refines a query after an unsatisfying first result set. |
| Failure Flows | Query returns zero results; query is too vague and returns overwhelming, low-relevance results. |
| Recovery | Zero-result state offers spelling suggestions, related categories, or a "notify me" option; overwhelming result sets are addressed via prominent filter/sort affordances. |
| Edge Cases | Typos and partial matches; queries mixing occasion and product terms ("wedding gift wooden"); queries for currently unavailable/seasonal items. |
| Emotions | Hopeful at the start; frustrated if results feel irrelevant; satisfied when a close match appears quickly. |
| Business Rules | Search excludes unverified, suspended, or rejected creators/listings (SRCH-04). |
| Success Criteria | User finds and engages with a relevant result within a small number of query refinements. |

### 3.5 Browse Categories

| Field | Detail |
|---|---|
| Goal | Explore the catalog by structured product type when no specific search term comes to mind. |
| Trigger | User wants to explore a general area of interest (e.g., "Home Décor"). |
| Entry Point | Category navigation from homepage or global navigation. |
| Preconditions | None. |
| Actors | Guest, Buyer |
| Main Flow | Select a top-level category → optionally drill into a subcategory → apply filters/sort → select a product. |
| Alternative Flows | User browses across multiple categories in one session before deciding. |
| Failure Flows | Category has no published listings currently. |
| Recovery | Empty category shows a clear "coming soon" state with a redirect to related categories rather than a dead end. |
| Edge Cases | Newly retired or merged category accessed via an old bookmark/link. |
| Emotions | Relaxed, exploratory; mild disengagement if browsing feels repetitive or undifferentiated from generic e-commerce. |
| Business Rules | Every published listing belongs to at least one category (CAT-01); retired categories must not orphan listings (CAT-02). |
| Success Criteria | User engages with multiple listings within the category and either purchases or wishlists at least one. |

### 3.6 Browse Collections

| Field | Detail |
|---|---|
| Goal | Discover editorially curated groupings of products relevant to a theme, occasion, or aesthetic. |
| Trigger | User is drawn to a featured collection from the homepage, a campaign link, or social sharing. |
| Entry Point | Homepage feature, category page feature, or direct collection URL. |
| Preconditions | None. |
| Actors | Guest, Buyer |
| Main Flow | Land on a collection page → browse curated listings → select a product → land on product detail. |
| Alternative Flows | Arrives directly via a shared/marketing collection URL without passing through the homepage. |
| Failure Flows | Collection has expired or been unpublished; a listing within the collection has since become unavailable. |
| Recovery | Expired collection redirects to a related, active collection; unavailable listings within an otherwise active collection are automatically excluded from display. |
| Edge Cases | Seasonal collection accessed after its relevant occasion has passed. |
| Emotions | Delight at discovering a well-curated, relevant grouping; reinforces the platform's premium, editorial positioning. |
| Business Rules | Unpublished listings are automatically excluded from collection display (COLL-01). |
| Success Criteria | High engagement rate (click-through to product) from collection views relative to generic browsing. |

### 3.7 View Product

| Field | Detail |
|---|---|
| Goal | Evaluate a specific product in full detail to decide whether to purchase. |
| Trigger | Selecting a product from search, browse, collection, wishlist, or a shared link. |
| Entry Point | Product detail page. |
| Preconditions | None. |
| Actors | Guest, Buyer |
| Main Flow | View images, description, price, disclosure, and availability → review creator information → review customization options if applicable → review existing buyer reviews → decide to wishlist, add to cart, or leave. |
| Alternative Flows | User navigates to the creator's full storefront before deciding; user opens a customization panel to explore options before committing. |
| Failure Flows | Product has just sold out or been unpublished while the user was viewing/deciding. |
| Recovery | Real-time availability update disables "Add to Cart" gracefully with a "notify me" alternative rather than allowing an invalid action. |
| Edge Cases | Product with no reviews yet (new listing); product with incomplete optional fields (e.g., no measurement guide). |
| Emotions | Growing confidence as details reinforce authenticity and quality; hesitation if disclosure or trust signals are unclear; excitement when customization possibilities are discovered. |
| Business Rules | Disclosure of handmade/made-to-order status is mandatory and prominent (PDP-03); real-time availability must be reflected (PDP-02). |
| Success Criteria | High rate of progression from product view to add-to-cart or wishlist among engaged sessions. |

### 3.8 View Creator Store

| Field | Detail |
|---|---|
| Goal | Understand a creator's full brand, story, and catalog to build trust and discover more products. |
| Trigger | Clicking through from a product detail page, search result, or shared storefront link. |
| Entry Point | Creator storefront page. |
| Preconditions | Creator is verified and has at least one published listing. |
| Actors | Guest, Buyer |
| Main Flow | View creator story and verification status → browse full catalog → view aggregate rating and reviews → select a product or message the creator (Buyer only) with a pre-purchase inquiry. |
| Alternative Flows | User arrives directly at the storefront via a shared/marketing link without a prior product view. |
| Failure Flows | Creator has been suspended or storefront link is otherwise invalid. |
| Recovery | Suspended/invalid storefront shows an appropriate message rather than a broken page or generic error. |
| Edge Cases | Newly verified creator with a minimal catalog and no reviews yet. |
| Emotions | Growing trust and connection to the maker's story; reinforces the "human, not generic" brand promise. |
| Business Rules | Unverified/suspended creators' storefronts are not publicly accessible (STORE-01). |
| Success Criteria | Buyers who view a storefront browse multiple listings and show a higher repeat-visit rate to that specific creator over time. |

### 3.9 Wishlist

| Field | Detail |
|---|---|
| Goal | Save products of interest for later consideration, comparison, or gifting planning. |
| Trigger | User finds a product they like but isn't ready to purchase immediately. |
| Entry Point | "Save" or wishlist action on a product detail page or listing card. |
| Preconditions | None (session-based for Guest, persistent for Buyer). |
| Actors | Guest, Buyer |
| Main Flow | Select "save to wishlist" → item appears in wishlist view → user later revisits wishlist → proceeds to cart or removes item. |
| Alternative Flows | Guest wishlist transfers to a persistent wishlist upon sign-in/registration. |
| Failure Flows | Wishlisted item becomes unavailable or its price changes while saved. |
| Recovery | Wishlist clearly flags changed-price or unavailable items rather than silently showing stale information. |
| Edge Cases | Very large wishlists requiring organization; wishlist item from a now-suspended creator. |
| Emotions | Reassurance ("I won't lose this"); mild regret if a wishlisted item sells out before purchase. |
| Business Rules | Guest wishlist is session-only; Buyer wishlist persists across devices (WISH-01). |
| Success Criteria | Meaningful conversion rate from wishlist to eventual purchase, especially around relevant occasions. |

### 3.10 Customization

| Field | Detail |
|---|---|
| Goal | Personalize a made-to-order product with the buyer's specific details before purchase. |
| Trigger | Buyer selects a product that offers customization options. |
| Entry Point | Customization panel on the product detail page or during add-to-cart. |
| Preconditions | Listing has defined customization fields. |
| Actors | Buyer |
| Main Flow | Review available customization fields → complete required fields (text, image, choice, measurement) → preview selections → add to cart with customization attached. |
| Alternative Flows | Buyer saves partial customization progress and returns later before completing. |
| Failure Flows | Required field left incomplete; uploaded image fails format/size validation. |
| Recovery | Clear inline validation prevents add-to-cart until required fields are complete, with specific guidance on what's missing. |
| Edge Cases | Buyer uploads an ambiguous or low-quality reference image; buyer requests something outside the creator's defined options (handled via Messaging, not the customization form itself). |
| Emotions | Creative engagement and anticipation; anxiety about "getting it right" for a meaningful gift. |
| Business Rules | Required fields block add-to-cart until completed (CUST-01); selections are preserved unmodified through to the order (CUST-02). |
| Success Criteria | Low rate of post-order clarification requests, indicating customization capture was clear and complete. |

### 3.11 Add to Cart

| Field | Detail |
|---|---|
| Goal | Move a selected (and, if applicable, customized) product into the cart in preparation for purchase. |
| Trigger | Buyer decides to purchase or provisionally hold an item. |
| Entry Point | "Add to Cart" action on product detail page. |
| Preconditions | Item is currently available; required customization (if any) is complete. |
| Actors | Guest, Buyer |
| Main Flow | Select quantity/customization → confirm add to cart → see confirmation and updated cart count → continue browsing or proceed to cart. |
| Alternative Flows | Buyer adds multiple items across multiple creators before proceeding to cart. |
| Failure Flows | Item sells out at the exact moment of the add-to-cart action. |
| Recovery | Clear, immediate message if the add fails due to availability, with an alternative action (notify me, view similar items). |
| Edge Cases | Buyer attempts to add an item exceeding available stock/production capacity. |
| Emotions | Small moment of satisfaction/progress; minor frustration if an add-to-cart failure interrupts momentum. |
| Business Rules | Cart line items retain exact customization selections (CART-01). |
| Success Criteria | High success rate of add-to-cart actions completing without error. |

### 3.12 Cart Management

| Field | Detail |
|---|---|
| Goal | Review, adjust, and finalize the set of items intended for purchase before checkout. |
| Trigger | Buyer navigates to the cart to review contents. |
| Entry Point | Cart icon/page from global navigation. |
| Preconditions | Cart contains at least one item. |
| Actors | Guest, Buyer |
| Main Flow | View items grouped by creator with shipping estimates → adjust quantities or remove items → apply a coupon if available → proceed to checkout. |
| Alternative Flows | Buyer returns to a product page to change a customization selection, then returns to cart. |
| Failure Flows | An item in the cart has become unavailable or changed price since being added. |
| Recovery | Cart clearly flags affected items with a specific resolution path (remove, view alternative) before allowing checkout to proceed. |
| Edge Cases | Cart spanning many creators with significantly different lead times; persisted cart from a much earlier session with stale pricing. |
| Emotions | Anticipation building toward purchase; frustration if unexpected changes (price, availability) appear at this stage. |
| Business Rules | Cart validates availability before checkout (CART-03); groups items by creator with per-creator shipping estimates (CART-02). |
| Success Criteria | Low cart-abandonment rate attributable to unclear or unresolved cart-state issues. |

### 3.13 Checkout

| Field | Detail |
|---|---|
| Goal | Complete a purchase by confirming address, shipping, payment, and final order details. |
| Trigger | Buyer proceeds from a validated cart. |
| Entry Point | "Checkout" action from the cart. |
| Preconditions | Cart is valid (all items available, customization complete). |
| Actors | Buyer (see also 3.14 Guest Checkout) |
| Main Flow | Select or add shipping address → review shipping/delivery estimates per creator → apply coupon if desired → add gift note/packaging if offered → review full itemized cost → select payment method → confirm and pay. |
| Alternative Flows | Buyer uses a saved address/payment method for a fast repeat checkout. |
| Failure Flows | Address validation fails; an item becomes unavailable mid-checkout; payment fails (see 3.15 Payment). |
| Recovery | Specific, actionable error messages at each step; cart/checkout state is preserved so the buyer doesn't need to restart from scratch. |
| Edge Cases | Multi-creator order where one creator's portion fails validation after the other succeeds; buyer checking out with items requiring significantly different delivery timelines. |
| Emotions | Focused determination to complete the task; anxiety if the process feels long or uncertain; relief and satisfaction upon confirmation. |
| Business Rules | Full itemized cost shown before payment confirmation (CHK-03); multi-creator orders split into independently tracked sub-orders (CHK-05). |
| Success Criteria | High checkout completion rate once initiated; low rate of abandonment at the payment step specifically. |

### 3.14 Guest Checkout

| Field | Detail |
|---|---|
| Goal | Complete a purchase without creating a full account. |
| Trigger | Guest proceeds to checkout without having registered. |
| Entry Point | "Checkout as guest" option presented alongside sign-in/registration. |
| Preconditions | Cart is valid. |
| Actors | Guest |
| Main Flow | Provide email and shipping/payment details → complete checkout as in 3.13 → receive order confirmation with a secure order-lookup method → optionally offered account creation post-purchase. |
| Alternative Flows | Guest later creates an account using the same email and claims their prior guest order history. |
| Failure Flows | Guest provides an invalid or mistyped email, risking loss of order communication. |
| Recovery | Email is confirmed/validated at entry; order confirmation is also shown on-screen immediately, not solely dependent on email delivery. |
| Edge Cases | Guest loses access to the order-lookup details and needs an alternative recovery method (e.g., contacting Support with order and payment reference). |
| Emotions | Relief at not being forced into account creation; some residual anxiety about being able to track the order later. |
| Business Rules | Guest checkout requires only essential information, not a password (CHK-02, Section 7.15). |
| Success Criteria | Guest checkout completion rate comparable to or better than signed-in checkout, given its lower-friction design intent. |

### 3.15 Payment

| Field | Detail |
|---|---|
| Goal | Securely complete payment for the order. |
| Trigger | Buyer confirms the order at the final checkout step. |
| Entry Point | Payment step within Checkout. |
| Preconditions | All prior checkout steps (address, shipping, review) are complete. |
| Actors | Buyer |
| Main Flow | Select or enter payment method → authorize payment → payment is captured → order is confirmed. |
| Alternative Flows | Buyer uses a previously saved payment method for a faster flow. |
| Failure Flows | Payment is declined; payment gateway is temporarily unavailable; a concurrent stock/capacity conflict is discovered at the moment of capture. |
| Recovery | Clear, specific decline messaging with an option to retry or use an alternative method; cart and checkout details are preserved through the failure. |
| Edge Cases | Payment authorized but capture fails due to an item becoming unavailable in the intervening moments (see Section 8 cross-functional handling). |
| Emotions | Peak anxiety point of the journey — trust and clarity are critical here; strong relief upon confirmation. |
| Business Rules | No sensitive raw payment credentials are ever exposed to internal roles (PAY-01); failed payments preserve cart/order-in-progress state. |
| Success Criteria | High payment success rate on first attempt; minimal support contacts related to payment confusion. |

### 3.16 Order Confirmation

| Field | Detail |
|---|---|
| Goal | Receive clear, reassuring confirmation that the order was placed successfully, with accurate details. |
| Trigger | Successful payment capture. |
| Entry Point | Automatic redirect/display immediately following payment. |
| Preconditions | Payment has been captured successfully. |
| Actors | Buyer |
| Main Flow | View order confirmation screen (items, customization, price, estimated delivery per creator) → receive confirmation notification → access the order from order history. |
| Alternative Flows | Guest receives confirmation via email/on-screen with a secure lookup method rather than an account-based order history. |
| Failure Flows | Confirmation notification fails to deliver (e.g., email bounce). |
| Recovery | On-screen confirmation is always shown regardless of notification delivery success; failed notification delivery is logged for follow-up. |
| Edge Cases | Multi-creator order confirmation must clearly present each sub-order's distinct estimated timeline. |
| Emotions | Relief, satisfaction, and anticipation; this moment should reinforce confidence in the decision just made. |
| Business Rules | Confirmation restates customization details exactly as submitted (CUST-04). |
| Success Criteria | Buyers report clarity and confidence in what happens next, measured via low immediate post-purchase support contact rate. |

### 3.17 Track Order

| Field | Detail |
|---|---|
| Goal | Monitor the status and expected delivery of a placed order. |
| Trigger | Buyer wants to check progress, often around an approaching occasion date. |
| Entry Point | Order history / order detail page, or a status-update notification. |
| Preconditions | At least one order exists. |
| Actors | Buyer |
| Main Flow | Navigate to order history → select a specific order → view current state and, once shipped, carrier tracking information per sub-order. |
| Alternative Flows | Buyer follows a direct link from a status-update notification straight to the relevant order. |
| Failure Flows | Tracking data temporarily unavailable from the carrier; order has stalled in a state beyond its expected timeframe. |
| Recovery | Clear "tracking pending update" state rather than a broken view; stalled orders proactively surface a way to contact the creator or raise a support ticket. |
| Edge Cases | Multi-creator order where sub-orders are in very different states (one delivered, one still in production). |
| Emotions | Anticipation, especially as an occasion date nears; anxiety if status appears stalled or unclear. |
| Business Rules | Each sub-order shows an independent, accurate status (ORD-01, ORD-03). |
| Success Criteria | Low support-contact rate for "where is my order" questions, indicating self-serve tracking is sufficiently clear. |

### 3.18 Receive Order

| Field | Detail |
|---|---|
| Goal | Confirm receipt of the order and assess whether it matches expectations. |
| Trigger | Physical delivery of the shipment. |
| Entry Point | Delivery notification or manual confirmation by the buyer. |
| Preconditions | Sub-order is in "Shipped" or "Out for Delivery" state. |
| Actors | Buyer |
| Main Flow | Receive shipment → order state updates to "Delivered" (via carrier confirmation or buyer acknowledgment) → buyer inspects the item → order proceeds toward "Completed" after the return/dispute window closes without issue. |
| Alternative Flows | Buyer proactively confirms delivery before automatic carrier confirmation updates. |
| Failure Flows | Item arrives damaged, incorrect, or incomplete relative to the order. |
| Recovery | Buyer can report an issue directly from the order, initiating the Request Refund or Raise Support Ticket journey. |
| Edge Cases | Delivery to a gift recipient different from the buyer, who has no account/order visibility of their own. |
| Emotions | Excitement and anticipation opening the package; disappointment and frustration if something is wrong, especially for a gift with emotional stakes. |
| Business Rules | Order moves to "Completed" only after the return/dispute window closes without issue (Section 8.2 of `01-product-requirements.md`). |
| Success Criteria | High proportion of orders reaching "Completed" without a reported issue. |

### 3.19 Leave Review

| Field | Detail |
|---|---|
| Goal | Share feedback on a purchased product and the overall experience. |
| Trigger | Order reaches a completed or delivered state; buyer is prompted or chooses to review. |
| Entry Point | Order detail page, or a post-delivery notification prompt. |
| Preconditions | Purchase is verified and complete. |
| Actors | Buyer, Creator (as respondent) |
| Main Flow | Select a star rating → optionally add written feedback → submit review → review appears publicly on the product/storefront, subject to moderation rules. |
| Alternative Flows | Buyer submits a rating only, without written feedback. |
| Failure Flows | Buyer attempts to review a product without a verified completed purchase. |
| Recovery | Review action is simply not available/visible for non-purchased items, avoiding a dead-end error state. |
| Edge Cases | Buyer purchases the same product twice and reviews each purchase separately; creator responds to a review, prompting further reflection from the buyer. |
| Emotions | Motivated by strong positive or negative experience; a sense of contributing to the community of trust. |
| Business Rules | Only verified purchasers may review, once per completed order line item (REV-01). |
| Success Criteria | Healthy review submission rate relative to completed orders, supporting the platform's trust signal density. |

### 3.20 Raise Support Ticket

| Field | Detail |
|---|---|
| Goal | Get help resolving an issue that cannot be self-served. |
| Trigger | Buyer encounters a problem (delay, damage, miscommunication, account issue). |
| Entry Point | "Get help" or "Report an issue" action from an order, or a general support entry point. |
| Preconditions | None (may or may not be tied to a specific order). |
| Actors | Buyer, Support Executive |
| Main Flow | Select issue category → describe the issue, with relevant order attached if applicable → submit ticket → receive status updates until resolution. |
| Alternative Flows | Ticket raised without a specific order reference, routed to general triage. |
| Failure Flows | Ticket sits without a timely response; buyer's issue requires escalation beyond Support Executive authority. |
| Recovery | Escalation path to Admin/Super Admin (see 7. Support Journeys) preserves full context; ticket left "Awaiting User Response" beyond a defined period auto-closes with an easy reopen path. |
| Edge Cases | Buyer raises multiple tickets for the same underlying issue; issue spans both a buyer-side and creator-side concern simultaneously. |
| Emotions | Frustration or worry at the point of raising the issue; the tone and speed of the response strongly shape overall trust in the platform. |
| Business Rules | Tickets progress through defined states with visible status to the buyer at all times (SUPP-01, SUPP-03). |
| Success Criteria | High first-contact resolution rate; strong post-resolution satisfaction score. |

### 3.21 Request Refund

| Field | Detail |
|---|---|
| Goal | Recover payment for an order that was cancelled, undelivered, defective, or otherwise eligible under policy. |
| Trigger | Buyer's order meets a refund-eligible condition, or a support ticket resolves in favor of a refund. |
| Entry Point | Order detail page ("Request Refund") or as an outcome of a support ticket. |
| Preconditions | Order/sub-order is in a refund-eligible state per policy. |
| Actors | Buyer, Support Executive, Admin |
| Main Flow | Select the order/item and reason for refund → submit request → request is reviewed against policy → refund is approved and processed, or rejected with a stated reason. |
| Alternative Flows | Refund is initiated directly by Support/Admin as the resolution to an escalated dispute, without the buyer needing to separately request it. |
| Failure Flows | Refund request falls outside policy eligibility (e.g., past the return window, non-returnable category). |
| Recovery | Rejected requests clearly explain the applicable policy and, where relevant, offer an alternative path (e.g., raising a dispute for further review). |
| Edge Cases | Refund requested after payout has already been released to the creator, requiring reconciliation; partial refund for a multi-item order. |
| Emotions | Anxiety about whether the request will be honored; relief and restored trust when handled fairly and promptly. |
| Business Rules | Refunds are issued to the original payment method (PAY-05); non-returnable categories must be disclosed pre-purchase (Section 7.2). |
| Success Criteria | Refund requests are resolved within policy-defined timeframes with a low subsequent dispute-escalation rate. |

### 3.22 Repeat Purchase

| Field | Detail |
|---|---|
| Goal | Complete another purchase, often from a previously trusted creator. |
| Trigger | Buyer has a new need (another occasion) or wants to return to a creator they previously enjoyed. |
| Entry Point | Creator storefront (direct return visit), order history ("buy again"), homepage personalized suggestions, or a wishlist/notification prompt. |
| Preconditions | Buyer has an existing account and purchase history. |
| Actors | Buyer |
| Main Flow | Return to a known creator or product (directly or via saved/recent history) → repeat the View Product → Cart → Checkout flow, typically faster due to saved addresses/payment methods. |
| Alternative Flows | Buyer discovers a new creator entirely, unrelated to prior purchases. |
| Failure Flows | Previously purchased product or creator is no longer available. |
| Recovery | Clear messaging and suggested alternatives (similar products, similar creators) rather than a dead end. |
| Edge Cases | Buyer wants to reorder the exact same customization as a prior order. |
| Emotions | Confidence and ease, given established trust; mild disappointment if a previously loved creator/product is no longer available. |
| Business Rules | Saved addresses/payment methods streamline repeat checkout (SET-01). |
| Success Criteria | High repeat-purchase rate and short time-to-decision on repeat visits, reflecting established trust. |

### 3.23 Delete Account

| Field | Detail |
|---|---|
| Goal | Permanently remove personal account and data from the platform. |
| Trigger | Buyer decides to stop using the platform, for privacy, preference, or other personal reasons. |
| Entry Point | Account settings → "Delete Account." |
| Preconditions | Account is in an active, non-blocked state (no pending order/dispute/payout conflicts). |
| Actors | Buyer |
| Main Flow | Initiate deletion request → confirm via a secondary confirmation step → account is scheduled for deletion → personal data is removed/anonymized per policy while legally required transactional records are preserved. |
| Alternative Flows | User has both Buyer and Creator profiles; deletion of one does not automatically delete the other unless the same underlying violation/request applies to both. |
| Failure Flows | Deletion requested while an active order, dispute, or payout is pending. |
| Recovery | Deletion is blocked or deferred with a clear explanation of what must resolve first, rather than silently failing. |
| Edge Cases | User requests deletion, then wants to cancel the request within a grace period before it takes effect. |
| Emotions | A sensitive, trust-defining moment — the process must feel respectful and straightforward, not obstructive, even though the platform is losing the user. |
| Business Rules | Deletion preserves legally required transactional records while removing/anonymizing personal data (AUTH-07). |
| Success Criteria | Deletion requests are honored within the policy-defined timeframe with no unresolved blocking conditions left unexplained to the user. |

---

# 4. Creator Journeys

### 4.1 Creator Registration

| Field | Detail |
|---|---|
| Goal | Apply to become a seller on the platform. |
| Trigger | An existing Buyer, or a new user, decides to start selling. |
| Entry Point | "Become a Creator" call-to-action from account menu, homepage, or marketing campaign. |
| Preconditions | User has (or creates) a verified account. |
| Actors | Buyer/Guest → Creator applicant |
| Main Flow | Provide business/craft details → submit portfolio/evidence of craftsmanship → accept the Seller Agreement → submit application for review. |
| Alternative Flows | Existing Buyer applies from their current account, retaining their Buyer profile alongside the new Creator application (AUTH-06). |
| Failure Flows | Incomplete application (missing required evidence/details). |
| Recovery | Inline validation prevents submission until required fields are complete; saved drafts allow the applicant to return and finish later. |
| Edge Cases | Applicant unsure how to present their craft/portfolio persuasively; applicant applying on behalf of a small studio with multiple contributors. |
| Emotions | Hope and vulnerability — for Hobby and Emerging Creator personas, this is an emotionally significant step (see `02-user-personas.md` Section 4.4–4.5). |
| Business Rules | Seller Agreement acceptance is a required, logged step (LEGAL-02). |
| Success Criteria | High application completion rate; applicants feel the process was clear and respectful of their effort, regardless of outcome. |

### 4.2 Verification

| Field | Detail |
|---|---|
| Goal | Have identity, authenticity, and craft quality confirmed to unlock public selling. |
| Trigger | Application submitted (4.1). |
| Entry Point | Automatic transition following application submission. |
| Preconditions | Application is complete. |
| Actors | Creator applicant, Admin |
| Main Flow | Application enters review queue → Admin evaluates identity and authenticity evidence → decision is made (approve/reject) → applicant is notified with outcome and, if rejected, a documented reason. |
| Alternative Flows | Admin requests additional information before deciding, pausing the review clock. |
| Failure Flows | Rejection due to insufficient evidence of authenticity or craft quality. |
| Recovery | Rejected applicants receive a clear reason and a defined path to reapply after addressing it (Section 7.5 of `01-product-requirements.md`). |
| Edge Cases | Borderline cases requiring Admin judgment beyond a simple checklist; applicant disputes a rejection decision. |
| Emotions | Anxious anticipation while waiting; validation and excitement on approval; disappointment, and potential self-doubt, on rejection — especially for Emerging/Hobby Creators. |
| Business Rules | Verification status is one of Pending, Approved, Rejected, Revoked (Section 8.7). |
| Success Criteria | Review turnaround time within a defined SLA; rejected applicants who reapply after improvement succeed at a healthy rate. |

### 4.3 Store Setup

| Field | Detail |
|---|---|
| Goal | Establish a branded storefront presence before publishing products. |
| Trigger | Creator application is approved. |
| Entry Point | Post-approval onboarding flow within the Creator Dashboard. |
| Preconditions | Verification is Approved. |
| Actors | Creator |
| Main Flow | Add storefront name, story, and profile imagery → configure default shipping/lead-time policy → review and accept storefront guardrails → storefront is created in a not-yet-public state pending at least one published listing. |
| Alternative Flows | Creator saves partial storefront setup and completes it across multiple sessions. |
| Failure Flows | Storefront content includes prohibited material, requiring revision before it can be used. |
| Recovery | Flagged content is clearly identified with guidance on what to change, not a generic rejection. |
| Edge Cases | Small Creative Studio setting up a storefront representing multiple contributors under one brand identity. |
| Emotions | Excitement and pride in shaping their brand identity for the first time. |
| Business Rules | Storefront edits containing prohibited content are blocked or flagged for review (STORE-02). |
| Success Criteria | Creators complete storefront setup and reach their first published listing within a short time of approval. |

### 4.4 Create Product

| Field | Detail |
|---|---|
| Goal | Add a new listing to the storefront catalog. |
| Trigger | Creator has a new product ready to offer. |
| Entry Point | "Add product" action within the Creator Dashboard. |
| Preconditions | Storefront setup is complete. |
| Actors | Creator, Creator Team Member (if permitted) |
| Main Flow | Enter product name, description, images, price, category → define customization options if applicable → set shipping/lead-time details → set handmade/made-to-order disclosure → save as draft or submit for publishing. |
| Alternative Flows | Creator duplicates an existing listing as a starting point for a similar new product. |
| Failure Flows | Required fields (image, disclosure, category, price) are missing. |
| Recovery | Listing cannot be submitted for publishing until required fields are complete; clear inline guidance shows what's missing (PDP-01, PDP-03). |
| Edge Cases | Creator uncertain how to categorize a cross-category product; creator wants to offer the same product in multiple variants. |
| Emotions | Creative investment and a degree of vulnerability in presenting their work publicly for evaluation. |
| Business Rules | Every listing must include at minimum one image, accurate disclosure, category, and price (Section 7.1). |
| Success Criteria | Creators complete listing creation without needing external help or repeated failed submission attempts. |

### 4.5 Edit Product

| Field | Detail |
|---|---|
| Goal | Update an existing listing's details, pricing, or availability. |
| Trigger | Creator needs to correct, refresh, or adjust a listing. |
| Entry Point | Listing management view within the Creator Dashboard. |
| Preconditions | Listing exists in the creator's catalog. |
| Actors | Creator, Creator Team Member (if permitted) |
| Main Flow | Select listing → edit relevant fields → save changes → changes reflect publicly, subject to any required re-review for significant edits. |
| Alternative Flows | Minor edits (e.g., a typo fix) publish immediately; substantive edits (e.g., changed disclosure) may require review. |
| Failure Flows | Edit removes a required field, invalidating the listing. |
| Recovery | System prevents saving an edit that would leave the listing non-compliant with minimum requirements. |
| Edge Cases | Editing a listing that has open orders referencing its prior version, which must not be retroactively altered (Section 7.9). |
| Emotions | Routine, low-stakes for minor edits; some anxiety if a substantive change requires re-review and temporarily affects visibility. |
| Business Rules | Price changes do not retroactively affect orders already placed (Section 7.9). |
| Success Criteria | Edits are saved and reflected accurately without unintended side effects on historical orders. |

### 4.6 Publish Product

| Field | Detail |
|---|---|
| Goal | Make a completed listing publicly visible and purchasable. |
| Trigger | Creator finishes preparing a draft listing. |
| Entry Point | "Publish" action from the listing editor. |
| Preconditions | All required fields are complete. |
| Actors | Creator, Admin (review, for newly verified creators or flagged content) |
| Main Flow | Submit for publishing → (if subject to initial review) listing enters Pending Review → listing becomes Published and publicly discoverable. |
| Alternative Flows | Established creators in good standing publish immediately without pre-review, subject to post-publish spot review (Section 7.1). |
| Failure Flows | Listing is rejected during review for a policy violation. |
| Recovery | Creator receives a specific reason and can revise and resubmit. |
| Edge Cases | Creator publishes a listing that duplicates an already-published one; time-sensitive listing (e.g., seasonal) delayed by review queue length. |
| Emotions | Anticipation and pride at going live; frustration if review delays feel opaque or lengthy. |
| Business Rules | New creators' listings are subject to review during an initial trust-building period (Section 7.1). |
| Success Criteria | Listings reach Published state within a predictable, communicated timeframe. |

### 4.7 Manage Inventory

| Field | Detail |
|---|---|
| Goal | Keep stock levels or production capacity accurate to avoid overselling or unrealistic promises. |
| Trigger | Stock changes (sale, restock) or production capacity needs adjustment. |
| Entry Point | Inventory management view within the Creator Dashboard. |
| Preconditions | At least one published listing exists. |
| Actors | Creator, Creator Team Member (if permitted) |
| Main Flow | View current stock/capacity per listing → adjust quantities or lead-time/capacity settings → save changes, reflected immediately on public listings. |
| Alternative Flows | Creator receives a low-stock/near-capacity alert and proactively adjusts before running out. |
| Failure Flows | Two near-simultaneous orders attempt to claim the last unit of stock. |
| Recovery | Atomic stock decrement ensures only one order succeeds; the other buyer is clearly informed and offered an alternative (INV-01). |
| Edge Cases | Sudden demand surge (e.g., viral moment) requiring rapid capacity/lead-time adjustment. |
| Emotions | Operational focus; relief when low-stock alerts prevent an accidental overselling situation. |
| Business Rules | Stock decrements automatically and atomically upon order confirmation (INV-01). |
| Success Criteria | Near-zero overselling incidents; creators report confidence in the accuracy of displayed availability. |

### 4.8 Receive Order

| Field | Detail |
|---|---|
| Goal | Become aware of and begin acting on a new order. |
| Trigger | A buyer completes checkout including this creator's item(s). |
| Entry Point | Creator Dashboard notification/order queue. |
| Preconditions | Order/sub-order has reached Confirmed state. |
| Actors | Creator, Creator Team Member (if permitted) |
| Main Flow | Receive notification of new order → review order and customization details → begin production or prepare stocked item for shipment. |
| Alternative Flows | Order requires clarification before production can begin (see 4.9). |
| Failure Flows | Creator misses or delays reviewing a new order beyond a reasonable window. |
| Recovery | Dashboard prominently surfaces time-sensitive new orders; reminder notifications escalate if unacknowledged. |
| Edge Cases | Multiple new orders arriving simultaneously during a peak/seasonal period. |
| Emotions | Excitement at a new sale; a sense of responsibility given the buyer's (often gift-related) expectations. |
| Business Rules | Creators see only their own sub-orders (ORD-02). |
| Success Criteria | New orders are acknowledged by the creator within a short, predictable window. |

### 4.9 Customization Clarification

| Field | Detail |
|---|---|
| Goal | Resolve ambiguity in a buyer's customization request before committing production time and materials. |
| Trigger | Creator reviews a new order and finds the customization details unclear or incomplete. |
| Entry Point | "Request clarification" action from the order detail view. |
| Preconditions | Order includes customization requiring clarification. |
| Actors | Creator, Buyer |
| Main Flow | Creator sends a specific clarification question via Messaging → order enters "Awaiting Customization Clarification" state → buyer responds → creator confirms understanding and proceeds to production. |
| Alternative Flows | Buyer does not respond promptly, requiring a follow-up reminder. |
| Failure Flows | Buyer never responds within a reasonable window, risking a missed occasion deadline. |
| Recovery | Escalation path to Support if a buyer is unresponsive and a deadline is at risk; clear "waiting on buyer" status prevents the creator from being penalized for the delay. |
| Edge Cases | Clarification reveals the buyer wants something outside the creator's offered options entirely. |
| Emotions | Creator's caution to avoid a costly production error; buyer's reassurance that the creator is being attentive rather than careless. |
| Business Rules | Order does not silently continue toward a production deadline while awaiting buyer input (Section 7.12, Section 8.2). |
| Success Criteria | Clarification exchanges are resolved quickly, minimizing delay to overall fulfillment time. |

### 4.10 Order Fulfillment

| Field | Detail |
|---|---|
| Goal | Complete production (if applicable) and prepare the order for shipment. |
| Trigger | Order is confirmed and, if needed, clarified. |
| Entry Point | Order detail view within the Creator Dashboard. |
| Preconditions | Order is in "In Production" or equivalent active fulfillment state. |
| Actors | Creator, Creator Team Member (if permitted) |
| Main Flow | Produce or prepare the item → mark order as "Ready to Ship" → proceed to Shipping (4.11). |
| Alternative Flows | Creator updates buyer proactively on production progress for a longer-lead-time custom order. |
| Failure Flows | Creator is unable to complete the order within the stated timeline (capacity issue, material shortage, personal circumstance). |
| Recovery | Creator communicates a delay proactively via Messaging/order status update; if unresolved, Support may intervene per policy. |
| Edge Cases | Order requiring materials not currently in the creator's possession, extending timeline beyond the originally stated estimate. |
| Emotions | Pride in the craft process; pressure to meet the promised timeline, especially for occasion-driven orders. |
| Business Rules | Creators are responsible for fulfilling within stated timelines; persistent failure triggers review (Section 7.7). |
| Success Criteria | High on-time fulfillment rate relative to each listing's stated lead time. |

### 4.11 Shipping

| Field | Detail |
|---|---|
| Goal | Hand off the completed order to a carrier and provide tracking information to the buyer. |
| Trigger | Order reaches "Ready to Ship" state. |
| Entry Point | Order detail view → "Mark as Shipped." |
| Preconditions | Item is fully produced/prepared. |
| Actors | Creator |
| Main Flow | Package the item → hand off to carrier → enter tracking information (if available) → mark order as Shipped → buyer is notified automatically. |
| Alternative Flows | Creator ships without carrier tracking for methods that don't support it, clearly disclosed. |
| Failure Flows | Creator marks an order as shipped without accurate tracking, or a shipment is later lost/delayed. |
| Recovery | Delayed/lost shipment triggers the defined Section 5.13/7.3 resolution process (buyer report → investigation → resolution). |
| Edge Cases | International or remote-region shipping with limited tracking granularity. |
| Emotions | Satisfaction at completing the tangible craft-to-delivery cycle; some anxiety about shipment reliability once out of their hands. |
| Business Rules | Marking as shipped requires a valid preceding state and, at minimum, a shipped timestamp (SHIP-02). |
| Success Criteria | High rate of accurate, timely tracking information provided at the point of shipping. |

### 4.12 Receive Payout

| Field | Detail |
|---|---|
| Goal | Receive earned funds from completed sales on a predictable schedule. |
| Trigger | Order reaches a payout-eligible state (e.g., post-delivery-confirmation window closes). |
| Entry Point | Automatic, per the defined payout schedule; visible in the Creator Dashboard payout view. |
| Preconditions | Order/sub-order is Completed and payout-eligible. |
| Actors | Creator |
| Main Flow | Order becomes payout-eligible → payout is calculated (minus commission and any deductions) → funds are transferred per schedule → creator views payout record reconciled against the source order(s). |
| Alternative Flows | Creator reviews upcoming/scheduled payouts proactively before they are disbursed. |
| Failure Flows | A refund or dispute affecting an already-paid-out order requires reconciliation/deduction from a future payout. |
| Recovery | Payout records clearly show any adjustment with a traceable explanation, not an unexplained discrepancy (PAY-04). |
| Edge Cases | Creator's first payout, requiring extra clarity/reassurance on how the process works. |
| Emotions | This is the moment the platform's promise of "sustainable livelihood" becomes tangible — trust here is foundational and non-negotiable. |
| Business Rules | Payout timing and conditions are clearly documented and consistently applied (PAY-03). |
| Success Criteria | Payouts are disbursed accurately and on schedule with near-zero unexplained discrepancies. |

### 4.13 Reply Reviews

| Field | Detail |
|---|---|
| Goal | Respond publicly to buyer feedback to build trust and address concerns. |
| Trigger | A new review is posted on one of the creator's listings. |
| Entry Point | Reviews view within the Creator Dashboard, or a new-review notification. |
| Preconditions | At least one review exists. |
| Actors | Creator |
| Main Flow | View new review → compose a public response → submit → response appears alongside the review on the storefront. |
| Alternative Flows | Creator chooses not to respond to a positive review requiring no follow-up. |
| Failure Flows | Creator's response contains content violating conduct standards. |
| Recovery | Response is subject to the same moderation rules as other public content; violating responses are actioned per Section 7.19. |
| Edge Cases | Responding to a negative review tied to a genuine misunderstanding versus a legitimate quality issue. |
| Emotions | Pride when responding to praise; a mix of defensiveness and professionalism required when responding to criticism. |
| Business Rules | One response per review, publicly visible (REV-03). |
| Success Criteria | Creators who respond to reviews (particularly critical ones) see improved buyer sentiment and trust signals over time. |

### 4.14 Analytics

| Field | Detail |
|---|---|
| Goal | Understand storefront and listing performance to make informed business decisions. |
| Trigger | Creator wants to review recent performance or investigate a specific trend. |
| Entry Point | Analytics view within the Creator Dashboard. |
| Preconditions | Storefront has some activity history (or shows a zero-state for new creators). |
| Actors | Creator |
| Main Flow | Select a time period → review sales, traffic, and conversion metrics → drill into specific listings for detail. |
| Alternative Flows | New creator with no sales yet sees a guided zero-state with next-step suggestions rather than an empty chart. |
| Failure Flows | Data temporarily delayed or incomplete for the most recent period. |
| Recovery | Clear indication of data freshness/lag rather than presenting incomplete data as final. |
| Edge Cases | Creator comparing performance across a highly seasonal period (e.g., wedding season) versus a quiet period. |
| Emotions | Curiosity and a desire for validation; motivation to improve when trends are clear and actionable. |
| Business Rules | Analytics reflect only the creator's own storefront (ANLY-01). |
| Success Criteria | Creators report that analytics meaningfully inform decisions (e.g., which products to expand). |

### 4.15 Pause Store

| Field | Detail |
|---|---|
| Goal | Temporarily halt new orders without deleting the storefront, e.g., due to personal capacity limits or a break. |
| Trigger | Creator needs to stop taking new orders for a period (vacation, capacity overload, personal circumstance). |
| Entry Point | Storefront settings → "Pause Store." |
| Preconditions | Storefront exists and is active. |
| Actors | Creator |
| Main Flow | Select pause → confirm effect (listings removed from active sale, storefront and catalog data preserved) → storefront resumes automatically or manually when the creator is ready. |
| Alternative Flows | Creator schedules a pause in advance (e.g., a known upcoming vacation). |
| Failure Flows | Creator pauses while orders are still in an active fulfillment state, potentially causing confusion about whether those orders are affected. |
| Recovery | Existing open orders are explicitly unaffected by pause mode and must still be fulfilled per prior commitments unless mutually cancelled (Section 7 / SET-03). |
| Edge Cases | Buyer attempts to view a paused storefront expecting to purchase. |
| Emotions | Relief at having a legitimate, low-guilt way to manage capacity without penalty. |
| Business Rules | Pause mode removes listings from active sale while preserving storefront/catalog data (SET-03). |
| Success Criteria | Creators use pause mode as intended, with no resulting spike in missed/abandoned existing orders. |

### 4.16 Invite Team Member

| Field | Detail |
|---|---|
| Goal | Grant scoped access to a collaborator to help operate the storefront. |
| Trigger | Creator (typically a Small Creative Studio) needs delegated help with catalog, orders, or support. |
| Entry Point | Team management view within the Creator Dashboard. |
| Preconditions | Creator account is in good standing. |
| Actors | Creator (owner), Creator Team Member |
| Main Flow | Enter invitee's email → select a predefined role/permission template → send invite → invitee accepts and gains scoped access. |
| Alternative Flows | Owner adjusts an existing team member's role after initial invitation. |
| Failure Flows | Invitee doesn't accept the invitation within a reasonable window. |
| Recovery | Invitation can be resent or revoked by the owner at any time. |
| Edge Cases | Owner removes a team member who has open, attributed actions in progress (e.g., mid-conversation with a buyer). |
| Emotions | Trust-building moment between the owner and collaborator; owner's relief at sharing operational load. |
| Business Rules | Team members cannot access payout/financial settings unless explicitly granted; removed members' past actions remain attributed to them (CDASH-03). |
| Success Criteria | Team invitations are accepted and used productively, with no confusion over permission scope. |

### 4.17 Delete Store

| Field | Detail |
|---|---|
| Goal | Permanently close the storefront and cease selling on the platform. |
| Trigger | Creator decides to stop selling entirely. |
| Entry Point | Storefront settings → "Delete Store." |
| Preconditions | No active, unresolved orders, disputes, or pending payouts. |
| Actors | Creator |
| Main Flow | Initiate deletion request → confirm via a secondary confirmation step, acknowledging consequences (loss of listings, reviews, history) → storefront is deactivated and, per policy, associated data is handled consistently with account deletion rules. |
| Alternative Flows | Creator chooses Pause Store (4.15) instead once made aware it better fits a temporary need. |
| Failure Flows | Deletion requested while active orders, disputes, or pending payouts exist. |
| Recovery | Deletion is blocked with a clear explanation of what must resolve first, similar to Buyer account deletion (Section 3.23). |
| Edge Cases | Creator with a strong review/reputation history reconsidering after seeing what will be lost. |
| Emotions | A significant, often difficult decision — the process should be respectful and clear, offering Pause as a reversible alternative before committing to permanent deletion. |
| Business Rules | Deletion cannot proceed with unresolved financial or dispute obligations outstanding (consistent with AUTH-07 principles). |
| Success Criteria | Deletion requests are handled cleanly with no orphaned orders, disputes, or payout obligations left unresolved. |

---

# 5. Admin Journeys

### 5.1 Review Creator

| Field | Detail |
|---|---|
| Goal | Evaluate a new creator application for authenticity, quality, and completeness. |
| Trigger | New application enters the review queue. |
| Entry Point | Admin Dashboard application queue. |
| Preconditions | Application is complete and submitted. |
| Actors | Admin |
| Main Flow | Open application → review portfolio/evidence and identity information → assess against authenticity and quality criteria → proceed to Approve (5.2) or Reject (5.3). |
| Alternative Flows | Admin requests additional information from the applicant before deciding. |
| Failure Flows | Insufficient or ambiguous evidence to make a confident decision. |
| Recovery | Admin can pause the review and request clarification rather than defaulting to an uninformed approve/reject. |
| Edge Cases | Application from a small studio with multiple contributors requiring assessment of the whole team, not one individual. |
| Emotions | Responsibility — this decision materially affects a real person's opportunity and the platform's trust standard. |
| Business Rules | Section 7.5 verification criteria. |
| Success Criteria | Consistent, well-documented decisions within SLA. |

### 5.2 Approve Creator

| Field | Detail |
|---|---|
| Goal | Grant a reviewed applicant the ability to set up and publish a storefront. |
| Trigger | Review (5.1) concludes positively. |
| Entry Point | Application review view. |
| Preconditions | Application meets verification criteria. |
| Actors | Admin |
| Main Flow | Confirm approval decision → system notifies the applicant → applicant proceeds to Store Setup (4.3). |
| Alternative Flows | — |
| Failure Flows | Approval granted in error (e.g., overlooked policy conflict), discovered later. |
| Recovery | Verification can be revoked post-approval if a violation is later discovered (Section 8.7). |
| Edge Cases | — |
| Emotions | Satisfaction in enabling a genuine creator's opportunity. |
| Business Rules | ADM-01. |
| Success Criteria | Approved creators proceed successfully to storefront setup and first listing. |

### 5.3 Reject Creator

| Field | Detail |
|---|---|
| Goal | Decline an application that does not meet platform standards, with a fair, documented reason. |
| Trigger | Review (5.1) concludes negatively. |
| Entry Point | Application review view. |
| Preconditions | Application does not meet verification criteria. |
| Actors | Admin |
| Main Flow | Select rejection reason from documented policy categories → confirm rejection → applicant is notified with the reason and reapplication guidance. |
| Alternative Flows | — |
| Failure Flows | Applicant disputes the rejection as unfair or mistaken. |
| Recovery | Defined appeal/reapplication path per Section 7.5, rather than a permanent, unexplained dead end. |
| Edge Cases | Borderline application rejected primarily due to incomplete evidence rather than a genuine quality/authenticity concern. |
| Emotions | Admin's responsibility to be fair and clear; applicant's disappointment, particularly for Hobby/Emerging Creator personas. |
| Business Rules | ADM-01; Section 7.5 reapplication cooldown. |
| Success Criteria | Rejected applicants understand why and, where appropriate, successfully reapply after improvement. |

### 5.4 Moderate Listing

| Field | Detail |
|---|---|
| Goal | Review a flagged or newly submitted listing for policy compliance. |
| Trigger | Listing flagged by automated detection, user report, or routine new-creator review. |
| Entry Point | Admin/Moderator content queue. |
| Preconditions | Listing exists and is flagged or pending review. |
| Actors | Admin, Moderator |
| Main Flow | Review listing content against policy → approve, reject, request changes, or escalate → action is logged with reason. |
| Alternative Flows | Listing requires creator input (request changes) before a final decision. |
| Failure Flows | Ambiguous case not clearly covered by documented policy. |
| Recovery | Escalate to Admin/Super Admin for a policy judgment rather than setting inconsistent precedent. |
| Edge Cases | A listing that was compliant at review time later becomes non-compliant due to a creator edit. |
| Emotions | Diligence balanced with fairness to the creator's livelihood. |
| Business Rules | ADM-02, Section 7.19 severity framework. |
| Success Criteria | Consistent, timely moderation decisions within SLA. |

### 5.5 Moderate Reviews

| Field | Detail |
|---|---|
| Goal | Review flagged buyer reviews for authenticity and conduct compliance. |
| Trigger | A review is flagged by a user or automated abuse detection. |
| Entry Point | Admin/Moderator content queue. |
| Preconditions | Review exists and is flagged. |
| Actors | Admin, Moderator |
| Main Flow | Review flagged content → assess against conduct/authenticity policy → approve (remains visible), remove, or escalate. |
| Alternative Flows | — |
| Failure Flows | Creator attempts to use flagging to suppress a legitimate negative review. |
| Recovery | Independent moderator judgment prevents unilateral creator removal of fair criticism (REV-04). |
| Edge Cases | Review containing a legitimate quality complaint mixed with policy-violating language, requiring partial rather than binary action. |
| Emotions | Balancing buyer's right to honest feedback against protection from abuse. |
| Business Rules | REV-04, Section 7.19. |
| Success Criteria | Flagged reviews are resolved fairly and quickly, maintaining review trustworthiness. |

### 5.6 Manage Categories

| Field | Detail |
|---|---|
| Goal | Keep the category taxonomy accurate and useful as the catalog evolves. |
| Trigger | Catalog growth or shifts reveal a taxonomy gap, redundancy, or need for reorganization. |
| Entry Point | Admin Dashboard taxonomy management view. |
| Preconditions | — |
| Actors | Admin |
| Main Flow | Create, edit, merge, or retire a category → reassign or archive affected listings as needed → changes reflect across Browse Categories (3.5). |
| Alternative Flows | — |
| Failure Flows | Retiring a category without reassigning affected listings. |
| Recovery | System requires reassignment/archival before a category can be fully retired (CAT-02). |
| Edge Cases | Merging two categories with conflicting listing counts/attributes. |
| Emotions | — |
| Business Rules | CAT-02. |
| Success Criteria | Taxonomy changes cause zero orphaned listings. |

### 5.7 Manage Collections

| Field | Detail |
|---|---|
| Goal | Curate and merchandise product groupings for buyer discovery. |
| Trigger | A campaign, seasonal moment, or ongoing editorial need. |
| Entry Point | CMS / Admin Dashboard collections view. |
| Preconditions | — |
| Actors | Admin |
| Main Flow | Create a collection → select/curate listings → schedule publish/unpublish dates → collection appears in Browse Collections (3.6). |
| Alternative Flows | Collection is featured on the homepage or a category page in addition to its own page. |
| Failure Flows | A listing within the collection becomes unavailable after curation. |
| Recovery | Unavailable listings are automatically excluded from display without manual cleanup (COLL-01). |
| Edge Cases | Overlapping scheduled campaigns competing for the same featured placement. |
| Emotions | Creative, brand-building satisfaction. |
| Business Rules | COLL-01, COLL-02. |
| Success Criteria | Collections drive measurably higher engagement than generic browsing. |

### 5.8 Refund Processing

| Field | Detail |
|---|---|
| Goal | Approve and process a refund within policy authority. |
| Trigger | A refund request (3.21) requires Admin-level review, or Support escalates a case. |
| Entry Point | Admin Dashboard refund/dispute queue. |
| Preconditions | Refund request exists and is pending review. |
| Actors | Admin, Support Executive (as originator) |
| Main Flow | Review order, payment, and dispute context → approve or reject against policy → refund is processed to original payment method if approved. |
| Alternative Flows | Case requires escalation to Super Admin due to unusual severity or financial impact. |
| Failure Flows | Refund would exceed Admin's policy authority. |
| Recovery | Escalate to Super Admin (ADM-03). |
| Edge Cases | Refund needed after payout already released to creator, requiring reconciliation. |
| Emotions | Fairness to both buyer and creator must be balanced carefully. |
| Business Rules | PAY-05, ADM-03. |
| Success Criteria | Refunds processed within policy SLA with full traceability. |

### 5.9 Coupon Creation

| Field | Detail |
|---|---|
| Goal | Configure a platform-wide promotional coupon for an acquisition or retention campaign. |
| Trigger | A marketing or business initiative requires a promotional mechanism. |
| Entry Point | Admin Dashboard coupons view. |
| Preconditions | — |
| Actors | Admin, Super Admin (for limits beyond standard policy) |
| Main Flow | Define eligibility rules (segment, minimum order value, category, validity window) → set discount stacking behavior → activate coupon → coupon becomes usable at Checkout (3.13). |
| Alternative Flows | — |
| Failure Flows | Coupon configuration conflicts with existing discount stacking limits. |
| Recovery | System blocks configuration exceeding platform-defined limits, requiring Super Admin override if genuinely needed (Section 7.10). |
| Edge Cases | Coupon expiring at the exact moment a buyer is mid-checkout (Section 8, Coupon Expiry cross-functional journey). |
| Emotions | — |
| Business Rules | CPN-01, Section 7.10. |
| Success Criteria | Coupons perform as intended without unexpected margin erosion or buyer confusion. |

### 5.10 Analytics

| Field | Detail |
|---|---|
| Goal | Understand platform-wide health and performance to inform operational and strategic decisions. |
| Trigger | Routine monitoring or investigation of a specific concern (e.g., a spike in disputes). |
| Entry Point | Admin Dashboard analytics view. |
| Preconditions | — |
| Actors | Admin, Super Admin |
| Main Flow | Select metric/time period → review aggregate and segmented data (by category, creator, region) → drill into anomalies. |
| Alternative Flows | — |
| Failure Flows | — |
| Recovery | — |
| Edge Cases | Aggregate data must not expose buyer-identifiable information beyond what's operationally necessary. |
| Emotions | — |
| Business Rules | ANLY-03. |
| Success Criteria | Admin decisions are informed by timely, accurate aggregate data. |

### 5.11 Policy Updates

| Field | Detail |
|---|---|
| Goal | Update platform-wide policy configuration (commission structure, discount limits, verification requirements). |
| Trigger | A business or operational need to adjust platform-wide rules. |
| Entry Point | Super Admin configuration view. |
| Preconditions | — |
| Actors | Super Admin |
| Main Flow | Propose policy change → review impact → apply change, versioned with an effective date → change applies prospectively only. |
| Alternative Flows | — |
| Failure Flows | Policy change would retroactively affect in-progress or already-completed transactions. |
| Recovery | System enforces that changes apply only to future transactions, not retroactively (ADM-04). |
| Edge Cases | Policy change taking effect mid-checkout session (Section 8, Price Change cross-functional journey). |
| Emotions | High responsibility given business-critical, trust-affecting nature. |
| Business Rules | ADM-04. |
| Success Criteria | Policy changes apply cleanly with no retroactive disruption to existing users. |

---

# 6. Moderator Journeys

### 6.1 Review Flags

| Field | Detail |
|---|---|
| Goal | Triage incoming flagged content (listings, reviews, storefronts) by priority and severity. |
| Trigger | Content is flagged by automated detection or user report. |
| Entry Point | Moderator content queue. |
| Preconditions | Flagged content exists. |
| Actors | Moderator |
| Main Flow | Review incoming flag queue → prioritize by severity and SLA proximity → open each item for investigation (6.2). |
| Alternative Flows | — |
| Failure Flows | Queue volume exceeds capacity, risking SLA breach. |
| Recovery | High-priority items are surfaced for escalation/reallocation rather than processed strictly first-in-first-out regardless of severity. |
| Edge Cases | Coordinated or repeated false-flagging targeting a specific creator. |
| Emotions | — |
| Business Rules | Section 7.19. |
| Success Criteria | Queue processed within SLA with priority given to higher-severity items. |

### 6.2 Investigate Content

| Field | Detail |
|---|---|
| Goal | Determine whether flagged content actually violates policy. |
| Trigger | Item selected from the flag queue (6.1). |
| Entry Point | Content investigation view. |
| Preconditions | — |
| Actors | Moderator |
| Main Flow | Review the flagged content and relevant context (listing history, prior violations) → assess against documented policy → determine action (6.3). |
| Alternative Flows | — |
| Failure Flows | Ambiguous case not clearly covered by policy. |
| Recovery | Escalate (6.4) rather than guess. |
| Edge Cases | Content that was compliant when flagged but has since changed. |
| Emotions | Diligence and fairness. |
| Business Rules | Section 7.19. |
| Success Criteria | Accurate determinations, reflected in a low appeal-overturn rate. |

### 6.3 Take Action

| Field | Detail |
|---|---|
| Goal | Apply the appropriate consequence for a confirmed violation. |
| Trigger | Investigation (6.2) concludes with a violation determination. |
| Entry Point | Content investigation view. |
| Preconditions | Violation confirmed. |
| Actors | Moderator |
| Main Flow | Select action per the severity framework (Warning → Content Removal → Temporary Suspension → Permanent Termination) → apply action within Moderator authority → log action with reason. |
| Alternative Flows | Action exceeds Moderator authority (suspension/termination), requiring escalation (6.4). |
| Failure Flows | — |
| Recovery | — |
| Edge Cases | Repeat low-severity violations that in aggregate warrant a higher-severity response. |
| Emotions | Weighing consistency and fairness against the real livelihood impact on the creator. |
| Business Rules | Section 7.19. |
| Success Criteria | Actions are proportionate, consistent, and fully logged. |

### 6.4 Escalate

| Field | Detail |
|---|---|
| Goal | Pass a case beyond Moderator authority (suspension, termination, or genuinely ambiguous policy question) to Admin/Super Admin. |
| Trigger | Case severity or ambiguity exceeds Moderator authority. |
| Entry Point | Content investigation view → "Escalate." |
| Preconditions | — |
| Actors | Moderator, Admin, Super Admin |
| Main Flow | Document full investigation context and recommendation → escalate to Admin/Super Admin → escalated party reviews and decides. |
| Alternative Flows | — |
| Failure Flows | Escalation lacks sufficient context, requiring the receiving party to redo investigation work. |
| Recovery | Structured escalation format ensures context is preserved (Section 7.19). |
| Edge Cases | — |
| Emotions | — |
| Business Rules | Section 3.6 (Moderator restrictions), Section 7.19. |
| Success Criteria | Escalations are resolved without duplicated investigation effort. |

### 6.5 Appeals

| Field | Detail |
|---|---|
| Goal | Give an affected creator or buyer a fair opportunity to contest a moderation decision. |
| Trigger | Affected party submits an appeal following a moderation action. |
| Entry Point | Appeal submission form linked from the moderation action notification. |
| Preconditions | A moderation action has been taken against the appellant. |
| Actors | Creator/Buyer (appellant), Moderator/Admin (reviewer, typically not the original decision-maker) |
| Main Flow | Appellant submits additional context/argument → a reviewer (ideally independent of the original decision) re-evaluates → decision is upheld or reversed, with the appellant notified either way. |
| Alternative Flows | — |
| Failure Flows | Appeal reviewed by the same person with no independent check, risking bias. |
| Recovery | Process design assigns appeals to an independent reviewer where feasible. |
| Edge Cases | Repeated appeals on the same decision without new information. |
| Emotions | The appellant's sense of fairness and being heard is critical to preserving trust even in a negative outcome. |
| Business Rules | Section 7.19 (appeal process). |
| Success Criteria | Appeals are resolved fairly and within a reasonable timeframe, with outcomes clearly explained. |

---

# 7. Support Journeys

### 7.1 Receive Ticket

| Field | Detail |
|---|---|
| Goal | Capture an incoming buyer or creator issue for resolution. |
| Trigger | Buyer or Creator raises a support ticket (3.20). |
| Entry Point | Support ticket queue. |
| Preconditions | Ticket has been submitted. |
| Actors | Support Executive |
| Main Flow | New ticket appears in queue → is categorized/routed (automatically or manually) → assigned to a Support Executive. |
| Alternative Flows | — |
| Failure Flows | Ticket submitted without a clear category. |
| Recovery | Defaults to general triage rather than being lost (SUPP-01). |
| Edge Cases | Multiple tickets from the same buyer about the same underlying issue. |
| Emotions | — |
| Business Rules | SUPP-01. |
| Success Criteria | All tickets are captured and routed without loss. |

### 7.2 Investigate

| Field | Detail |
|---|---|
| Goal | Gather the context needed to understand and resolve the reported issue. |
| Trigger | Ticket assigned (7.1). |
| Entry Point | Ticket detail view. |
| Preconditions | — |
| Actors | Support Executive |
| Main Flow | Review relevant order, payment (non-sensitive), and message history → identify root cause → determine resolution path. |
| Alternative Flows | — |
| Failure Flows | Available context is insufficient to determine root cause. |
| Recovery | Contact Buyer (7.3) or Contact Creator (7.4) for more information. |
| Edge Cases | Issue spans both a buyer-side and creator-side concern. |
| Emotions | — |
| Business Rules | SUPP-02 (scoped access). |
| Success Criteria | Root cause is identified without unnecessary back-and-forth. |

### 7.3 Contact Buyer

| Field | Detail |
|---|---|
| Goal | Gather additional information or communicate a resolution to the buyer. |
| Trigger | Investigation (7.2) requires buyer input, or a resolution is ready to communicate. |
| Entry Point | Ticket detail view → message buyer. |
| Preconditions | — |
| Actors | Support Executive, Buyer |
| Main Flow | Send a message/question to the buyer → buyer responds → investigation or resolution proceeds. |
| Alternative Flows | — |
| Failure Flows | Buyer doesn't respond within a reasonable window. |
| Recovery | Ticket moves to "Awaiting User Response" state; auto-closes with reopen option after a defined period (SUPP-03). |
| Edge Cases | — |
| Emotions | Buyer's frustration should be met with empathy and clarity. |
| Business Rules | SUPP-03. |
| Success Criteria | Buyer responses are received promptly, enabling timely resolution. |

### 7.4 Contact Creator

| Field | Detail |
|---|---|
| Goal | Gather additional information from, or communicate an outcome to, the relevant creator. |
| Trigger | Investigation (7.2) requires creator input or action. |
| Entry Point | Ticket detail view → message creator. |
| Preconditions | — |
| Actors | Support Executive, Creator |
| Main Flow | Send a message/request to the creator → creator responds or takes requested action → investigation or resolution proceeds. |
| Alternative Flows | — |
| Failure Flows | Creator is unresponsive or disputes the framing of the issue. |
| Recovery | Escalation path (7.7) if unresolved within a reasonable window. |
| Edge Cases | Creator's response reveals the issue is actually a buyer-side misunderstanding. |
| Emotions | Creator's livelihood-related anxiety should be met with fairness and clear reasoning. |
| Business Rules | SUPP-02. |
| Success Criteria | Creator responses are received promptly and issues are resolved fairly. |

### 7.5 Resolve Issue

| Field | Detail |
|---|---|
| Goal | Bring the ticket to a fair, policy-consistent resolution. |
| Trigger | Sufficient information has been gathered (7.2–7.4). |
| Entry Point | Ticket detail view. |
| Preconditions | — |
| Actors | Support Executive |
| Main Flow | Determine resolution per policy → communicate the outcome to the relevant party/parties → apply any necessary action (e.g., refund, see 7.6) → close the ticket (7.8). |
| Alternative Flows | Resolution requires no financial action, only clarification or communication. |
| Failure Flows | Resolution required falls outside Support Executive's policy authority. |
| Recovery | Escalate (7.7). |
| Edge Cases | Resolution acceptable to one party but disputed by the other. |
| Emotions | Both buyer and creator should feel heard, even if the outcome doesn't fully satisfy either. |
| Business Rules | Section 7 (all relevant business rules depending on issue type). |
| Success Criteria | High satisfaction score and low re-escalation rate on resolved tickets. |

### 7.6 Refund (Support-Initiated)

| Field | Detail |
|---|---|
| Goal | Issue a refund or credit as part of resolving a ticket, within authorized policy limits. |
| Trigger | Resolution (7.5) determines a refund is the appropriate outcome. |
| Entry Point | Ticket detail view → issue refund. |
| Preconditions | Refund amount is within Support Executive's authorized limit. |
| Actors | Support Executive |
| Main Flow | Select refund amount/reason within policy → process refund to original payment method → ticket and order records updated accordingly. |
| Alternative Flows | — |
| Failure Flows | Refund amount exceeds authorized limit. |
| Recovery | Escalate to Admin (7.7). |
| Edge Cases | Refund needed after payout already released to creator. |
| Emotions | — |
| Business Rules | SUPP-02, PAY-05. |
| Success Criteria | Refunds are processed accurately and promptly within authority. |

### 7.7 Escalate

| Field | Detail |
|---|---|
| Goal | Pass a ticket beyond Support Executive authority to Admin (or further to Super Admin). |
| Trigger | Case exceeds refund/resolution authority, or requires policy judgment. |
| Entry Point | Ticket detail view → "Escalate." |
| Preconditions | — |
| Actors | Support Executive, Admin, Super Admin |
| Main Flow | Document full ticket context and recommendation → escalate → Admin/Super Admin reviews and resolves, or provides guidance for the Support Executive to complete resolution. |
| Alternative Flows | — |
| Failure Flows | Escalation lacks sufficient context. |
| Recovery | Structured escalation ensures full history is preserved (SUPP-04). |
| Edge Cases | Time-sensitive escalation (e.g., an occasion deadline) requiring expedited handling. |
| Emotions | — |
| Business Rules | SUPP-04. |
| Success Criteria | Escalations are resolved without duplicated investigation and within an appropriate timeframe given urgency. |

### 7.8 Close Ticket

| Field | Detail |
|---|---|
| Goal | Formally conclude the support interaction once resolved. |
| Trigger | Resolution (7.5) is complete and communicated. |
| Entry Point | Ticket detail view → "Close." |
| Preconditions | Resolution has been applied and communicated. |
| Actors | Support Executive |
| Main Flow | Confirm resolution outcome is recorded → close ticket → buyer/creator is notified of closure and can reopen if needed. |
| Alternative Flows | Ticket auto-closes after prolonged inactivity in "Awaiting User Response" (SUPP-03). |
| Failure Flows | Ticket closed prematurely before the issue is genuinely resolved. |
| Recovery | Clear, easy reopen path available to the buyer/creator (SUPP-03). |
| Edge Cases | — |
| Emotions | Closure should leave both parties with a clear sense of what happened and why. |
| Business Rules | SUPP-03. |
| Success Criteria | Low reopen rate, indicating genuine resolution rather than premature closure. |

---

# 8. Cross-Functional Journeys

These journeys involve multiple roles interacting across the platform and represent the highest-risk points for confusion, delay, or broken trust.

### 8.1 Multi-Creator Checkout

| Field | Detail |
|---|---|
| Goal | Complete a single purchase spanning items from more than one creator. |
| Trigger | Buyer's cart contains items from two or more creators at checkout. |
| Entry Point | Checkout (3.13). |
| Preconditions | Cart contains multi-creator items, all currently valid. |
| Actors | Buyer, multiple Creators |
| Main Flow | Buyer completes one payment for the full cart → system creates independent sub-orders per creator → each creator receives and fulfills only their own sub-order → buyer tracks each sub-order independently. |
| Alternative Flows | Buyer proceeds with only a subset of creators after removing an unavailable item from another. |
| Failure Flows | One creator's portion becomes invalid (e.g., sold out) after payment authorization but before capture. |
| Recovery | The affected sub-order is excluded from the charge, the buyer is clearly informed, and the remaining valid sub-orders proceed normally rather than the entire order failing (CHK-05). |
| Edge Cases | Creators with significantly different delivery timelines within the same order, requiring clear per-creator expectation-setting rather than a single combined delivery promise. |
| Emotions | Buyer expects simplicity ("one checkout") despite the underlying complexity — any confusion here directly damages trust. |
| Business Rules | CHK-05. |
| Success Criteria | High success rate for multi-creator checkouts with no buyer confusion about which items belong to which sub-order. |

### 8.2 Partial Refund

| Field | Detail |
|---|---|
| Goal | Refund a portion of a multi-item order without disrupting the remaining valid items. |
| Trigger | One item/sub-order within a larger order is defective, cancelled, or otherwise refund-eligible while the rest is not. |
| Entry Point | Request Refund (3.21) or Refund Processing (5.8). |
| Preconditions | Order contains multiple items/sub-orders, only some of which are refund-eligible. |
| Actors | Buyer, Support Executive/Admin, affected Creator |
| Main Flow | Refund request/decision scoped to the specific affected item(s) → partial refund is processed → remaining order items/sub-orders continue toward fulfillment unaffected. |
| Alternative Flows | — |
| Failure Flows | Refund scoping is ambiguous, risking an unintended full-order refund. |
| Recovery | Order/sub-order granularity ensures refunds are precisely scoped (Section 7.3). |
| Edge Cases | Partial refund affecting a coupon that was applied across the whole order, requiring proportional recalculation. |
| Emotions | Buyer's relief that the rest of their order isn't disrupted by one issue. |
| Business Rules | PAY-05, Section 7.3. |
| Success Criteria | Partial refunds are accurately scoped with no unintended impact on unaffected items. |

### 8.3 Dispute

| Field | Detail |
|---|---|
| Goal | Fairly resolve a disagreement between buyer and creator that cannot be resolved through direct communication alone. |
| Trigger | Buyer or creator raises an unresolved concern (e.g., quality disagreement, delivery dispute). |
| Entry Point | Raise Support Ticket (3.20) or an escalation from Messaging (MSG-03 context). |
| Preconditions | Direct buyer-creator communication has not resolved the issue. |
| Actors | Buyer, Creator, Support Executive, Admin |
| Main Flow | Order moves to "Disputed" state → Support investigates using order and message history → resolution is determined and applied (refund, replacement commitment, or other) → order exits "Disputed" state. |
| Alternative Flows | Dispute is resolved directly between buyer and creator before Support intervention is needed. |
| Failure Flows | Evidence is insufficient or contradictory between the two parties. |
| Recovery | Support/Admin makes a documented, policy-consistent judgment call; appeal process available (6.5) if either party disagrees. |
| Edge Cases | Dispute involving a customization disagreement where "correctness" is subjective. |
| Emotions | High emotional stakes for both sides — buyer's trust and creator's livelihood/reputation are both directly at risk. |
| Business Rules | Section 7.3, Section 8.2 (Disputed state), MSG-03. |
| Success Criteria | Disputes are resolved fairly and within a reasonable timeframe, with low repeat-dispute rates for the same creator or buyer. |

### 8.4 Account Suspension

| Field | Detail |
|---|---|
| Goal | Temporarily disable an account (buyer or creator) due to a confirmed policy violation. |
| Trigger | Moderation (6.3) or Admin action determines suspension is the appropriate consequence. |
| Entry Point | Moderation/Admin action interface. |
| Preconditions | Violation confirmed at a severity warranting suspension. |
| Actors | Moderator (recommends), Admin (authorizes), affected Buyer/Creator |
| Main Flow | Suspension is applied → affected account transitions to "Suspended" state → account holder is notified with reason and, where applicable, appeal path → functionality is restricted per suspension scope. |
| Alternative Flows | Suspension is time-bound and automatically lifts after a defined period; or requires manual reinstatement review. |
| Failure Flows | Suspension applied in error or disproportionate to the violation. |
| Recovery | Appeal process (6.5) allows reconsideration; reinstatement is possible upon successful appeal. |
| Edge Cases | Suspended creator has open orders that must still be resolved/fulfilled or refunded despite the suspension. |
| Emotions | Significant distress for the affected party, especially creators whose livelihood is directly impacted — the process must be as fair and transparent as possible. |
| Business Rules | Section 7.19, Section 8.6 (Account states). |
| Success Criteria | Suspensions are applied consistently and proportionately, with a low rate of successful appeals indicating high initial decision accuracy. |

### 8.5 Creator Verification Revoked

| Field | Detail |
|---|---|
| Goal | Withdraw a creator's verified status due to a confirmed serious violation (e.g., authenticity misrepresentation). |
| Trigger | Investigation confirms a violation serious enough to affect verification status itself, not just individual content. |
| Entry Point | Admin action interface. |
| Preconditions | Violation confirmed at a severity warranting revocation. |
| Actors | Admin, affected Creator |
| Main Flow | Verification status changes to "Revoked" → storefront and all listings are removed from public visibility → creator is notified with reason and any applicable path to reapply → open orders are handled per policy (fulfilled, cancelled, or refunded depending on state). |
| Alternative Flows | — |
| Failure Flows | Revocation disrupts in-progress orders without a clear resolution plan for affected buyers. |
| Recovery | Open orders at time of revocation are explicitly resolved (fulfillment completion, cancellation, or refund) rather than left in limbo. |
| Edge Cases | Creator has both an active storefront and pending payouts at the time of revocation, requiring careful financial reconciliation. |
| Emotions | Severe consequence — reserved for confirmed, serious violations, and communicated with clarity given its significant impact. |
| Business Rules | Section 7.5, Section 8.7 (Revoked state). |
| Success Criteria | Revocation is applied only where clearly warranted, with all affected buyer orders resolved cleanly. |

### 8.6 Gift Order

| Field | Detail |
|---|---|
| Goal | Purchase and send a product to a recipient other than the buyer, with an appropriate gifting experience. |
| Trigger | Buyer selects a "this is a gift" option during checkout. |
| Entry Point | Checkout (3.13), CHK-04. |
| Preconditions | — |
| Actors | Buyer, Creator, (implicit) Recipient |
| Main Flow | Buyer designates a different shipping recipient → adds a gift note and packaging preference if offered → completes checkout → creator fulfills with recipient-facing packaging/note, without exposing buyer payment details to the recipient. |
| Alternative Flows | Buyer without a gift-specific need still adds a personal note without formal gift packaging. |
| Failure Flows | Gift note or packaging preference is lost or not passed through to the creator. |
| Recovery | Order confirmation and creator order view both restate gift details clearly, preventing silent loss of this information (Section 7.14). |
| Edge Cases | Recipient wants to return/exchange an item but has no account or order visibility of their own. |
| Emotions | High emotional stakes — this is often the platform's most meaningful use case, and errors here (wrong note, wrong recipient) are disproportionately damaging to trust. |
| Business Rules | Section 7.14, CHK-04, ORD-05. |
| Success Criteria | Gift orders are fulfilled with 100% accuracy on recipient details, note content, and packaging preference. |

### 8.7 Custom Order

| Field | Detail |
|---|---|
| Goal | Successfully complete a made-to-order purchase from customization through delivery. |
| Trigger | Buyer purchases a listing with customization options. |
| Entry Point | Customization (3.10) through Order Fulfillment (4.10). |
| Preconditions | — |
| Actors | Buyer, Creator |
| Main Flow | Buyer submits customization details → creator reviews, optionally requests clarification (4.9) → creator produces the item → order proceeds through Shipping (4.11) to delivery. |
| Alternative Flows | Creator accepts customization as submitted without needing clarification. |
| Failure Flows | Miscommunication leads to a produced item that doesn't match buyer intent. |
| Recovery | Dispute (8.3) process handles post-production disagreements; Customization Clarification (4.9) is designed specifically to prevent this failure mode proactively. |
| Edge Cases | Buyer wants to change customization details after production has already started (Section 7.12 — requires mutual agreement). |
| Emotions | High buyer anticipation and creator craftsmanship pride; shared risk if communication breaks down. |
| Business Rules | Section 7.12, CUST-01–04. |
| Success Criteria | Low rate of customization-related disputes relative to total custom order volume. |

### 8.8 Order Cancellation

| Field | Detail |
|---|---|
| Goal | Terminate an order before fulfillment is complete, per policy eligibility. |
| Trigger | Buyer requests cancellation, or mutual agreement between buyer and creator. |
| Entry Point | Order detail page → "Cancel Order" (buyer-initiated), or Messaging-based mutual agreement. |
| Preconditions | Order/sub-order is in a cancellation-eligible state per Section 7.2. |
| Actors | Buyer, Creator, (Support, if disputed) |
| Main Flow | Buyer requests cancellation → system checks eligibility against current order state → if eligible, order is cancelled and refunded; if not, buyer is shown the applicable policy and, where relevant, offered to request mutual cancellation with the creator. |
| Alternative Flows | Creator-initiated cancellation (e.g., unable to fulfill), triggering an automatic refund to the buyer. |
| Failure Flows | Cancellation requested at the exact moment the creator marks the item as shipped. |
| Recovery | A clear precedence rule resolves the race condition (e.g., shipped-state changes take precedence if confirmed first, with the cancellation request redirected to a return/refund flow instead) (ORD-04). |
| Edge Cases | Partial cancellation of a multi-item order from the same creator. |
| Emotions | Buyer's relief if cancellation is honored smoothly; creator's need for fairness if production time was already invested. |
| Business Rules | Section 7.2, ORD-04. |
| Success Criteria | Cancellation eligibility is applied consistently and transparently, with clear communication when a request cannot be honored. |

### 8.9 Inventory Conflict

| Field | Detail |
|---|---|
| Goal | Resolve a situation where more buyers attempt to purchase an item than are available. |
| Trigger | Two or more buyers attempt to purchase the last unit(s) of a stocked item, or exceed a creator's made-to-order capacity, at nearly the same time. |
| Entry Point | Cart Management (3.12), Checkout (3.13), or Payment (3.15). |
| Preconditions | Stock/capacity is at or near its limit. |
| Actors | Buyer(s), Creator |
| Main Flow | System atomically decrements stock/capacity at order confirmation → the first successful buyer's order proceeds normally → any subsequent conflicting attempt is blocked with a clear message before payment is charged. |
| Alternative Flows | Blocked buyer is offered to join a "notify me" list or view similar alternatives. |
| Failure Flows | A conflict is detected only after payment capture rather than before, due to a timing edge case. |
| Recovery | If detected post-capture, the affected buyer is immediately and automatically refunded with a clear explanation, without requiring them to request it. |
| Edge Cases | High-demand/viral moment causing many simultaneous attempts on a single limited listing. |
| Emotions | Disappointment for the unsuccessful buyer; this moment must be handled with speed and clarity to preserve trust despite the negative outcome. |
| Business Rules | INV-01, Section 7.11. |
| Success Criteria | Zero instances of a buyer being charged for an item that cannot actually be fulfilled. |

### 8.10 Price Change

| Field | Detail |
|---|---|
| Goal | Allow a creator to update a listing's price without disrupting existing orders or in-progress buyer sessions. |
| Trigger | Creator edits a listing's price (4.5). |
| Entry Point | Edit Product (4.5). |
| Preconditions | — |
| Actors | Creator, Buyer(s) with the item in an active cart or in-progress checkout |
| Main Flow | Creator saves a new price → change applies to all future views and new cart additions → any order already placed retains its original price. |
| Alternative Flows | — |
| Failure Flows | A buyer has the item in their cart at the old price when the change occurs. |
| Recovery | Cart clearly surfaces the updated price before checkout can proceed, rather than silently charging the old or ambiguously charging the new price without notice (CART-04, Section 7.9). |
| Edge Cases | Price change occurring in the exact window between a buyer's checkout review step and final payment confirmation. |
| Emotions | Buyer's trust depends on transparency here — silent price changes at the point of payment are highly damaging. |
| Business Rules | Section 7.9. |
| Success Criteria | Zero instances of a buyer being charged a price they were not clearly shown before confirming payment. |

### 8.11 Coupon Expiry

| Field | Detail |
|---|---|
| Goal | Ensure coupon validity is applied consistently and predictably at the moment it matters — checkout. |
| Trigger | A coupon's validity window ends while it may be in use by one or more buyers. |
| Entry Point | Checkout (3.13), Cart Management (3.12). |
| Preconditions | Coupon has an active validity window that is at or near its end. |
| Actors | Buyer, Admin (coupon configuration) |
| Main Flow | Coupon is applied while valid → if checkout completes before expiry, the discount is honored → if the validity window ends before final payment confirmation, the discount is removed with a clear explanation before the buyer is charged. |
| Alternative Flows | — |
| Failure Flows | Buyer is confused or frustrated when an expected discount is not honored. |
| Recovery | Clear, specific messaging (not a silent price change) explains the coupon has expired and shows the updated total before requiring confirmation (Section 7.8). |
| Edge Cases | Coupon expiring at the exact moment of final payment submission. |
| Emotions | Mild frustration is likely; clarity and honesty in the messaging prevent it from becoming distrust. |
| Business Rules | CPN-01, Section 7.8. |
| Success Criteria | Zero instances of a buyer being charged a different total than what was clearly shown and confirmed. |

---

# 9. Journey Dependency Matrix

This matrix shows what each journey depends on to function correctly, and what it in turn affects if it breaks or changes. It is intended to help teams reason about ripple effects before making changes to any single journey.

| Journey | Depends On | Impacts |
|---|---|---|
| Guest Browsing | Categories, Collections, Search | Account Registration, Add to Cart |
| Account Registration | Notifications, Legal consent | Login, Checkout, Wishlist persistence |
| Login | Account Registration | All authenticated journeys |
| Search Product | Categories, Product Detail data | View Product, Browse Categories |
| Browse Categories | Manage Categories (Admin) | View Product, Search Product |
| Browse Collections | Manage Collections (Admin), Publish Product | View Product |
| View Product | Publish Product, Manage Inventory, Reviews | Add to Cart, Wishlist, View Creator Store |
| View Creator Store | Verification, Publish Product, Reply Reviews | View Product, Repeat Purchase |
| Wishlist | Account Registration, View Product | Repeat Purchase, Notifications |
| Customization | Create Product (customization fields) | Add to Cart, Customization Clarification |
| Add to Cart | View Product, Customization, Manage Inventory | Cart Management |
| Cart Management | Add to Cart, Manage Inventory, Price Change | Checkout |
| Checkout | Cart Management, Coupon Creation | Payment, Multi-Creator Checkout |
| Guest Checkout | Cart Management | Order Confirmation, Account Registration (post-purchase) |
| Payment | Checkout | Order Confirmation, Receive Payout |
| Order Confirmation | Payment | Track Order, Receive Order |
| Track Order | Order Fulfillment, Shipping | Receive Order |
| Receive Order | Shipping | Leave Review, Request Refund |
| Leave Review | Receive Order | Reply Reviews, Moderate Reviews |
| Raise Support Ticket | Order/Account context | Receive Ticket, Dispute |
| Request Refund | Receive Order, Order Cancellation | Refund Processing, Partial Refund |
| Repeat Purchase | View Creator Store, Order Confirmation | Payment, Checkout |
| Delete Account | No pending orders/disputes | (terminal) |
| Creator Registration | Account Registration | Verification |
| Verification | Creator Registration, Review Creator | Store Setup |
| Store Setup | Verification | Create Product |
| Create Product | Store Setup, Manage Categories | Publish Product |
| Edit Product | Create Product | Publish Product, Price Change |
| Publish Product | Create Product, Moderate Listing | View Product, Browse Categories/Collections |
| Manage Inventory | Publish Product | Add to Cart, Inventory Conflict |
| Receive Order | Payment, Checkout | Customization Clarification, Order Fulfillment |
| Customization Clarification | Customization, Receive Order | Order Fulfillment |
| Order Fulfillment | Receive Order, Customization Clarification | Shipping |
| Shipping | Order Fulfillment | Track Order, Receive Order |
| Receive Payout | Payment, Receive Order (Completed state) | (terminal for creator) |
| Reply Reviews | Leave Review | View Creator Store |
| Analytics (Creator) | Receive Order, View Product | (informs Create/Edit Product) |
| Pause Store | Store Setup | Manage Inventory, Publish Product |
| Invite Team Member | Store Setup | Create Product, Receive Order (delegated) |
| Delete Store | No active orders/disputes | (terminal) |
| Review Creator | Creator Registration | Approve/Reject Creator |
| Approve Creator | Review Creator | Store Setup |
| Reject Creator | Review Creator | Creator Registration (reapply) |
| Moderate Listing | Publish Product | View Product, Browse |
| Moderate Reviews | Leave Review | View Product, View Creator Store |
| Manage Categories | — | Browse Categories, Create Product |
| Manage Collections | Publish Product | Browse Collections, Homepage |
| Refund Processing | Request Refund, Raise Support Ticket | Payment, Partial Refund |
| Coupon Creation | — | Checkout, Coupon Expiry |
| Analytics (Admin) | All transactional journeys | Policy Updates |
| Policy Updates | Analytics (Admin) | Coupon Creation, Manage Categories |
| Review Flags | Moderate Listing, Moderate Reviews | Investigate Content |
| Investigate Content | Review Flags | Take Action |
| Take Action | Investigate Content | Account Suspension, Creator Verification Revoked |
| Escalate (Moderator) | Take Action | Policy Updates (Admin/Super Admin decision) |
| Appeals | Take Action, Account Suspension | Account Suspension (reversal) |
| Receive Ticket | Raise Support Ticket | Investigate (Support) |
| Investigate (Support) | Receive Ticket | Contact Buyer, Contact Creator |
| Contact Buyer | Investigate (Support) | Resolve Issue |
| Contact Creator | Investigate (Support) | Resolve Issue |
| Resolve Issue | Contact Buyer, Contact Creator | Refund (Support), Close Ticket |
| Refund (Support-Initiated) | Resolve Issue | Payment, Partial Refund |
| Escalate (Support) | Resolve Issue | Refund Processing (Admin), Dispute |
| Close Ticket | Resolve Issue | (terminal) |
| Multi-Creator Checkout | Checkout, Manage Inventory | Order Fulfillment (per creator), Payment |
| Partial Refund | Refund Processing, Request Refund | Receive Payout (adjustment) |
| Dispute | Raise Support Ticket, Messaging | Refund Processing, Account Suspension, Appeals |
| Account Suspension | Take Action (Moderator/Admin) | Login, Store Setup/Publish Product (if creator) |
| Creator Verification Revoked | Take Action, Review Creator | Store Setup, Publish Product, Order Cancellation |
| Gift Order | Checkout, Customization | Order Fulfillment, Shipping |
| Custom Order | Customization, Customization Clarification | Order Fulfillment, Dispute |
| Order Cancellation | Checkout, Order Fulfillment | Refund Processing |
| Inventory Conflict | Manage Inventory, Checkout | Payment, Refund Processing |
| Price Change | Edit Product | Cart Management, Checkout |
| Coupon Expiry | Coupon Creation | Checkout, Cart Management |

---

# 10. Journey Risks

Risk analysis is provided for the platform's **major journeys** — those with the highest transaction volume, trust sensitivity, or cross-functional complexity.

| Journey | Business Risk | UX Risk | Technical Risk (High Level) | Operational Risk |
|---|---|---|---|---|
| Checkout | Abandonment directly costs revenue at the highest-intent moment. | Multi-step complexity may overwhelm first-time/low-tech-comfort buyers. | Coordinating validation across cart, inventory, and payment in real time. | None distinct beyond standard transaction volume handling. |
| Payment | Failed or unclear payment handling directly threatens trust and conversion. | Peak-anxiety moment; unclear errors cause abandonment. | Reliability of the payment capture and confirmation sequence. | Payment failures may spike support contact volume. |
| Multi-Creator Checkout | Complexity could suppress cross-creator basket size if buyers find it confusing. | Buyers may not understand why an order splits into multiple deliveries. | Coordinating atomic multi-vendor order creation from one payment. | Creators may be confused about their role in a larger order. |
| Customization | Poor capture leads to costly rework and buyer dissatisfaction. | Buyers may not realize a field is required until blocked at submission. | None distinct at this level of documentation. | Increases support/clarification load on creators. |
| Customization Clarification | Delays here risk missed occasion deadlines, damaging trust. | Buyers may not notice or respond to clarification requests promptly. | None distinct at this level of documentation. | Creator workload increases during high clarification volume periods (e.g., wedding season). |
| Order Fulfillment | Missed timelines damage both buyer trust and creator standing. | Buyers have limited visibility into production progress by default. | None distinct at this level of documentation. | Uneven fulfillment reliability across creators affects platform-wide reputation. |
| Track Order | Poor tracking clarity increases support burden and buyer anxiety. | Ambiguous states ("processing" with no further detail) frustrate buyers. | Dependency on third-party carrier data availability/accuracy. | Support fields "where is my order" questions if self-serve tracking is unclear. |
| Receive Order / Leave Review | Weak review pipeline undermines the platform's core trust differentiator. | Buyers may skip reviewing if the prompt is poorly timed or effortful. | None distinct at this level of documentation. | Moderation workload scales with review volume. |
| Request Refund | Inconsistent refund handling damages trust on both buyer and creator sides. | Buyers may not understand eligibility criteria upfront. | Reconciliation logic when a refund follows an already-released payout. | Refund policy misapplication risk if not consistently trained/documented. |
| Creator Registration / Verification | Onboarding too strict suppresses supply growth; too lax undermines trust differentiator. | Emotionally vulnerable moment for Hobby/Emerging Creators (per persona doc) — poor experience discourages genuine talent. | None distinct at this level of documentation. | Review queue bottlenecks directly limit marketplace growth rate. |
| Create/Publish Product | Inconsistent listing quality undermines premium brand positioning. | Creators with low tech/business confidence may struggle without guidance. | None distinct at this level of documentation. | Review workload scales with listing volume, especially for new creators. |
| Manage Inventory | Overselling directly breaks the platform's core trust promise. | Creators may not notice low-stock/capacity warnings in time. | Real-time accuracy under concurrent demand. | Creator confusion about stocked vs. made-to-order capacity settings. |
| Receive Payout | Payout errors are existentially damaging to creator trust and retention. | Lack of clarity on deductions/timing causes anxiety, especially for first payouts. | Reconciliation accuracy across refunds, disputes, and commission. | Payout disputes increase Support/Admin workload. |
| Dispute | Poorly resolved disputes damage trust for both buyer and creator, and can trigger public reputational harm (e.g., negative reviews, social sharing). | Both parties need to feel heard; a purely transactional resolution process risks perceived unfairness. | None distinct at this level of documentation. | Requires well-trained Support/Admin judgment; inconsistency risk if policy is ambiguous. |
| Account Suspension / Verification Revoked | Reputational risk if perceived as inconsistent or unfair; legal risk if due process is inadequate. | Affected users need clear, respectful communication despite the negative outcome. | None distinct at this level of documentation. | Appeals workload; risk of public backlash if handled insensitively. |
| Gift Order | Errors here (wrong recipient, lost note) are disproportionately damaging given emotional stakes. | Gift-specific options must be discoverable, not buried, without cluttering standard checkout. | Ensuring gift metadata reliably passes through the sub-order pipeline. | Support cases involving a non-account-holder recipient add complexity. |
| Inventory Conflict | Charging a buyer for an unfulfillable item is a severe trust breach. | Buyers need immediate, clear communication if their attempted purchase fails. | Real-time concurrency handling at high-demand moments. | Spike in support contacts during viral/high-demand events. |
| Price Change / Coupon Expiry | Perceived "bait and switch" pricing is highly damaging to trust and can create legal exposure. | Any price shown must remain honest and current through to final confirmation. | Timing coordination between listing/coupon state and in-progress checkout sessions. | Support cases around perceived pricing discrepancies. |

---

# 11. Journey Metrics

The following metrics apply across journeys, measured per journey once instrumented in production. Given this document precedes implementation, targets are expressed as **directional benchmarks** consistent with `00-project-vision.md` Section 14, not fabricated historical data.

| Metric | Definition | Applies Most Critically To |
|---|---|---|
| **Completion Rate** | Share of users who begin the journey and reach its defined success criteria. | Checkout, Payment, Creator Registration, Create Product |
| **Drop-off Rate** | Share of users who abandon the journey at a specific step, and which step. | Checkout, Verification, Account Registration |
| **Average Completion Time** | Time from journey entry point to exit point. | Checkout, Search Product, Order Fulfillment (production time) |
| **Error Rate** | Share of journey attempts encountering a failure path. | Payment, Add to Cart, Inventory Conflict |
| **Support Contacts** | Number of support tickets generated per journey attempt or completion. | Track Order, Request Refund, Receive Payout |
| **User Satisfaction** | Post-journey satisfaction signal (e.g., CSAT-style prompt or NPS proxy). | Receive Order, Dispute resolution, Creator Verification outcome |

### 11.1 Priority Journeys for Metric Instrumentation

Given limited early-stage instrumentation capacity, the following journeys should be prioritized for metrics from day one, as they carry the highest business and trust impact:

| Journey | Primary Metric Focus |
|---|---|
| Checkout | Completion rate, drop-off by step |
| Payment | Error rate, completion rate |
| Creator Registration / Verification | Completion rate, average completion time, drop-off rate |
| Order Fulfillment | Average completion time (vs. stated lead time), on-time rate |
| Track Order | Support contacts (as an inverse clarity indicator) |
| Request Refund / Dispute | Average completion time, user satisfaction |
| Receive Payout | Error rate (discrepancies), user satisfaction |
| Leave Review | Completion rate relative to eligible orders |

---

# 12. Journey Priorities

Priority reflects the journey's importance to launch readiness and core trust, following the MoSCoW-aligned tiers used throughout this documentation set.

| Priority | Journeys |
|---|---|
| **Critical** | Account Registration, Login, Search Product, View Product, Add to Cart, Cart Management, Checkout, Guest Checkout, Payment, Order Confirmation, Track Order, Receive Order, Creator Registration, Verification, Store Setup, Create Product, Publish Product, Manage Inventory, Receive Order (Creator), Order Fulfillment, Shipping, Receive Payout, Multi-Creator Checkout, Inventory Conflict, Price Change |
| **High** | Guest Browsing, Browse Categories, Browse Collections, View Creator Store, Wishlist, Customization, Customization Clarification, Leave Review, Raise Support Ticket, Request Refund, Review Creator, Approve Creator, Reject Creator, Moderate Listing, Refund Processing, Receive Ticket, Investigate (Support), Contact Buyer, Contact Creator, Resolve Issue, Refund (Support), Close Ticket, Dispute, Account Suspension, Gift Order, Custom Order, Order Cancellation, Coupon Expiry |
| **Medium** | Repeat Purchase, Edit Product, Reply Reviews, Analytics (Creator), Pause Store, Moderate Reviews, Coupon Creation, Analytics (Admin), Review Flags, Investigate Content, Take Action, Escalate (Moderator), Escalate (Support), Partial Refund, Creator Verification Revoked |
| **Low** | Delete Account, Invite Team Member, Delete Store, Manage Categories, Manage Collections, Policy Updates, Appeals |

*Note: "Low" priority reflects lower expected usage frequency at launch, not lower quality bar — these journeys still require full, well-designed flows per this document's standards, particularly Appeals and Delete Account, which carry outsized trust importance despite low frequency.*

---

# 13. Journey Opportunities

Consistent with `00-project-vision.md` Section 25 (AI Vision) and Section 26 (Future Opportunities), and `01-product-requirements.md` Section 15, the following opportunities are identified for future iterations — not in scope for v2.

### 13.1 Future Improvements
- Guided, template-assisted listing creation to reduce friction in Create Product for Hobby and Emerging Creators.
- Proactive production-progress updates within Order Fulfillment, reducing buyer anxiety without requiring buyers to actively check Track Order.
- A lightweight, structured "clarification form" pattern for Customization Clarification to reduce back-and-forth message volume.
- Expanded self-serve resolution options within Request Refund to reduce Support ticket volume for straightforward, policy-clear cases.

### 13.2 AI Opportunities
- AI-assisted query understanding within Search Product to better interpret occasion- and relationship-based queries.
- AI-drafted response suggestions for Creators within Customization Clarification and Reply Reviews.
- AI-assisted triage within Receive Ticket to route and prioritize incoming support volume more accurately.
- AI-based anomaly detection to flag likely Inventory Conflict or fraud risk before it affects a buyer.

### 13.3 Automation
- Automated low-stock and near-capacity alerts within Manage Inventory (already partially specified as INV-03, extendable further).
- Automated, policy-consistent handling of straightforward Coupon Expiry and Price Change edge cases without manual Support involvement.
- Automated escalation timers ensuring no ticket, dispute, or moderation item silently exceeds its SLA without visibility.

### 13.4 Personalization
- Personalized homepage and Browse Collections surfacing based on prior Wishlist and purchase behavior.
- Personalized occasion reminders (e.g., anniversary, recurring gifting patterns) that could prompt a well-timed Repeat Purchase journey.
- Personalized onboarding guidance within Creator Registration and Create Product based on the creator's craft category and stated experience level.

---

*This document is the behavioral blueprint for Dreams by Kalakaaar v2. All wireframes, prototypes, and technical specifications should be traceable to a specific journey, flow, and emotional context defined here.*