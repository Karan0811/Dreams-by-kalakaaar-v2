# Implementation Roadmap — Dreams by Kalakaaar v2

**Document owner:** Principal Engineering Manager / Technical Program Manager
**Status:** Draft for review
**Audience:** Engineering, Product, Design, QA, DevOps, Founders
**Last updated:** 2026
**Depends on:** The complete architecture series, 00-project-vision.md through 20-git-workflow-contribution-guide.md
**Precedes:** Sprint planning, team allocation, and the first line of application code

> **This is the master execution plan, not a project-management artifact.** It does not track tickets or assign story points. It answers one question, phase by phase: in what order does a team build Dreams by Kalakaaar v2 so that every phase's work rests on something already correctly in place, no phase blocks unnecessarily on work that could run in parallel, and the platform reaches production with every architectural decision in the prior 20 documents actually realized, not just documented.

---

## How to Read This Roadmap

Every phase below follows an identical structure so any engineer, at any point, can find what they need without hunting: **Purpose**, **Priority**, **Estimated Duration**, **Estimated Complexity**, **Dependencies**, **Objectives**, **Modules Involved**, **Features**, **Database Impact**, **API Impact**, **Backend Impact**, **Frontend Impact**, **Deliverables**, **Definition of Done / Acceptance Criteria**, and **Risks**. Duration and complexity estimates assume a small, senior, full-stack-capable founding engineering team (the team this entire documentation series has been written for) working with the finalized stack — they are planning inputs, not commitments, and are expected to be recalibrated against real team velocity after Phase 1.

**Complexity scale:** Low (well-understood, mechanical work) · Medium (real design decisions within an established pattern) · High (novel integration or cross-cutting complexity) · Very High (multiple high-risk systems intersecting, e.g., money movement).

**Priority scale:** Critical (blocks nearly everything downstream) · High (blocks a major feature area) · Medium (valuable but the platform can soft-launch without it) · Low (polish, can trail launch).

---

# Phase 0 — Project Initialization

## Purpose
Establish the organizational and tooling foundation the rest of this roadmap assumes exists — every account, every credential, every team agreement — before a single line of application code is written.

**Priority:** Critical · **Estimated Duration:** 1–2 weeks · **Estimated Complexity:** Low · **Dependencies:** None (the true starting point)

## Objectives
- Confirm the full architecture series (00–20) is reviewed and accepted by all founding stakeholders as the binding source of truth.
- Provision every third-party account this platform's finalized stack requires.
- Establish the founding team's working agreements (Section 18 of 20-git-workflow-contribution-guide.md's contributor responsibilities, on-call expectations per 19-operations-runbook.md Section 3.3).

## Modules Involved
None — this phase precedes module-level work entirely.

## Features
Not applicable — this phase produces organizational and infrastructure readiness, not user-facing features.

## Database Impact
None yet — 08-database-design.md's schema is reviewed and signed off, but no Drizzle schema is written until Phase 1.

## API Impact
None yet — 09-api-architecture.md's contract is reviewed and signed off, and the OpenAPI spec skeleton (that document's Section 26.1) is created but empty.

## Backend Impact
Vercel, Supabase, Cloudflare, Upstash, Inngest, Razorpay, Resend, Sentry, PostHog, and GitHub accounts are provisioned for Development, Preview, Staging, and Production tiers (14-infrastructure-devops-architecture.md Section 4).

## Frontend Impact
None yet.

## Deliverables
- A signed-off architecture series (00–20), version-tagged as the project's v1.0 baseline.
- Every third-party account provisioned, with credentials stored per 16-cicd-release-management.md Section 25.2's secrets-management standard from day one — never in a personal password manager or a chat message.
- A GitHub organization and repository created (empty, ready for Phase 1).
- Founding team roles assigned: at minimum, an Incident Commander rotation seed (19-operations-runbook.md Section 3.3), a release-owner default (16-cicd-release-management.md Section 14.4), and a CODEOWNERS draft (20-git-workflow-contribution-guide.md Section 8.5).

## Definition of Done / Acceptance Criteria
- [ ] Every founding engineer has read and can navigate the full architecture series.
- [ ] Every required third-party account exists and its credentials are stored in the platform's chosen secrets mechanism, never anywhere else.
- [ ] The GitHub repository exists with branch protection rules (16-cicd-release-management.md §4.4) pre-configured, even though it's still empty.
- [ ] Working agreements (on-call, review turnaround per 20-git-workflow-contribution-guide.md §8.6) are written down and agreed, not merely assumed.

## Risks

| Risk | Mitigation |
|---|---|
| Architecture documents are treated as optional reading, producing inconsistent early implementation choices | Mandatory review session(s) before Phase 1 begins; Phase 1's own Definition of Done gates on demonstrated familiarity, not just document existence |
| Third-party account provisioning is delayed by business/legal review (payment processor KYC, in particular) | Start Razorpay's merchant onboarding process immediately in this phase, since it is historically the slowest-to-provision dependency and sits on this platform's most Critical-tier path (Phase 8) |

---

# Phase 1 — Repository Foundation

## Purpose
Stand up the Turborepo monorepo, its module/package skeleton, the Drizzle schema, and the CI/CD pipeline itself — the physical scaffolding every subsequent phase builds directly on top of.

**Priority:** Critical · **Estimated Duration:** 2–3 weeks · **Estimated Complexity:** Medium · **Dependencies:** Phase 0

## Objectives
- Create the monorepo structure exactly as 10-backend-architecture.md Section 4.1 and 11-frontend-architecture.md specify — `apps/buyer`, `apps/creator`, `apps/internal`, `packages/*`, `src/modules/`, `src/shared/`, `src/jobs/`.
- Stand up the full CI/CD pipeline (16-cicd-release-management.md Section 6) before any feature work begins, so every subsequent phase's first pull request already runs through a real, enforced pipeline.
- Implement the complete Drizzle schema for every entity in 08-database-design.md, even though most tables will be empty of business logic until their owning phase.

## Modules Involved
`shared/db`, `shared/config`, `shared/observability`, `shared/middleware` (10-backend-architecture.md Section 4.1) — the cross-cutting infrastructure every other module depends on, per that document's dependency-direction rule (Section 2.7).

## Features
None user-facing — this phase is pure foundation.

## Database Impact
The **entire** Drizzle schema (08-database-design.md, all 26 domains) is created and migrated in one foundational migration set, establishing every table, constraint, and relationship up front — even though most business logic populating these tables arrives in later phases. This front-loads schema risk (catching a modeling gap early) rather than discovering it piecemeal.

## API Impact
The OpenAPI spec skeleton (09-api-architecture.md Section 26.1) is populated with every documented endpoint's path and method (empty/stub handlers), giving the contract-testing pipeline (13-testing-strategy.md Section 9.3) something to validate against from day one, even before real implementations exist.

## Backend Impact
The shared middleware pipeline (10-backend-architecture.md Section 6) is implemented in full: correlation ID assignment, rate limiting, authentication scaffolding (pre-Better-Auth-integration stub), error handling, structured logging, and OpenTelemetry tracing — every subsequent module inherits this automatically.

## Frontend Impact
The three Next.js apps are scaffolded with their shared design-token configuration (pending Phase 2's full design system), routing skeleton, and the shared `packages/api-client` wired against the OpenAPI stub.

## Deliverables
- A working Turborepo monorepo, buildable and deployable (empty Preview deployments succeeding) for all three apps.
- The complete Drizzle schema, migrated successfully in a real (empty) Supabase project.
- The full CI/CD pipeline (16-cicd-release-management.md Section 6) green on an empty/skeleton codebase.
- Health check endpoints (18-observability-monitoring.md Section 8) live and monitored.

## Definition of Done / Acceptance Criteria
- [ ] Every entity in 08-database-design.md exists as a migrated Drizzle table.
- [ ] The full CI pipeline (type-check, lint, test, build) runs and passes on every pull request.
- [ ] A trivial pull request (e.g., updating this roadmap itself) can travel from branch to a live Preview deployment successfully.
- [ ] Liveness and readiness health checks (18-observability-monitoring.md §8.2) respond correctly in every environment.
- [ ] Module-boundary lint rules (15-engineering-standards.md §26.2) are configured and demonstrably block a deliberate boundary-violation test case.

## Risks

| Risk | Mitigation |
|---|---|
| The full 26-domain schema is migrated before real usage patterns validate it, risking early rework | Accepted deliberately — 08-database-design.md's schema was already reviewed exhaustively in that document's own process (its Section 31 checklist); front-loading migration risk here is preferable to discovering modeling gaps mid-feature-phase |
| CI/CD pipeline setup consumes more time than estimated, delaying every subsequent phase | This phase is explicitly not compressed — restated from 16-cicd-release-management.md Section 2.1, a slow start here is recovered many times over by every later phase's fast, trustworthy feedback loop |


---

# Phase 2 — Design System

## Purpose
Build `packages/ui` into a complete, tested, accessible component library implementing 06-design-system.md in full, so every subsequent feature phase composes existing, trusted components rather than each inventing its own.

**Priority:** Critical · **Estimated Duration:** 2–3 weeks · **Estimated Complexity:** Medium · **Dependencies:** Phase 1

## Objectives
- Implement 06-design-system.md's full token set (color, typography, spacing) and every core primitive (buttons, form fields, cards, modals) on top of shadcn/ui and Radix, per 11-frontend-architecture.md.
- Establish the component-testing (13-testing-strategy.md Section 7) and visual-regression baseline (that document's Section 11.6) from this phase forward.
- Verify WCAG 2.2 AA compliance (that document's Section 12) at the component level before any feature screen is built on top.

## Modules Involved
`packages/ui`, `packages/config` (11-frontend-architecture.md's shared package structure).

## Features
None end-user-facing directly, but every subsequent phase's UI depends entirely on this phase's output.

## Database Impact
None.

## API Impact
None.

## Backend Impact
None.

## Frontend Impact
The complete, standalone component library — every primitive 07-ui-screens-wireframes.md's screens will need, built and verified in isolation before being composed into real screens.

## Deliverables
- `packages/ui` published (internally, within the monorepo) with every core primitive component, tested and accessible.
- A visual-regression baseline established (13-testing-strategy.md §11.6) for this library's own components.
- A living component reference (a Storybook-equivalent, per that document's stated tooling) any engineer can browse.

## Definition of Done / Acceptance Criteria
- [ ] Every component in 06-design-system.md's specification is implemented, tested (13-testing-strategy.md §7.6), and accessible (zero serious/critical `axe-core` violations, that document's §12.4).
- [ ] Visual regression baselines are captured and reviewed for every component.
- [ ] Design tokens are verified for WCAG AA contrast (that document's §12.3) at the token level, not per-component.

## Risks

| Risk | Mitigation |
|---|---|
| Feature phases begin before the design system is complete, producing one-off, inconsistent components | This phase is treated as a hard gate — no feature-phase UI work begins in earnest until `packages/ui`'s core primitive set is genuinely complete, even if that means a short, deliberate pause |
| Design system scope creep (building components no near-term screen actually needs) | Scoped strictly to 07-ui-screens-wireframes.md's actual documented screen inventory, per 15-engineering-standards.md Section 3.5's YAGNI principle |

---

# Phase 3 — Authentication

## Purpose
Implement the complete Identity domain — Better Auth integration, session/token lifecycle, RBAC foundation — since every subsequent phase's endpoints depend on a working authentication and authorization layer.

**Priority:** Critical · **Estimated Duration:** 2–3 weeks · **Estimated Complexity:** High · **Dependencies:** Phases 1–2

## Objectives
- Implement 09-api-architecture.md Section 3's complete Authentication API surface, backed by 10-backend-architecture.md Section 7's Better Auth architecture.
- Seed the RBAC role/permission model (08-database-design.md Section 6) with the platform's defined roles (01-product-requirements.md Section 3).
- Implement the shared middleware pipeline's real authentication/authorization steps (replacing Phase 1's stub).

## Modules Involved
Auth (10-backend-architecture.md §5.2), and the Users module's identity-adjacent pieces (§5.3) to the extent profile creation is needed for a working signup flow.

## Features
Registration, login, logout, refresh, forgot/reset password, email verification, session management ("log out everywhere"), OAuth (Google/Apple) — the complete buyer-facing and creator-facing signup/login experience.

## Database Impact
`User`, `UserProfile`, `AuthenticationAccount`, `Session`, `RefreshToken`, `EmailVerification`, `PasswordReset`, `Devices`, `TrustedDevices` (08-database-design.md Section 5) become fully live; `Role`, `Permission`, `RolePermission`, `UserRole` (Section 6) are seeded with the platform's defined role set.

## API Impact
09-api-architecture.md Section 3's full endpoint set is implemented and passing its complete API-level test suite (13-testing-strategy.md Section 15).

## Backend Impact
The shared middleware's authentication (10-backend-architecture.md §6.3) and coarse RBAC (§6.4) steps go live, replacing Phase 1's stub — every module built from this phase forward inherits real, enforced authentication automatically.

## Frontend Impact
Signup, login, password-reset, and account-settings screens across the Buyer and Creator apps (07-ui-screens-wireframes.md), built entirely on Phase 2's component library.

## Deliverables
- A working, end-to-end signup → email verification → login → session-refresh flow, in Preview and Staging.
- RBAC seed data covering every platform role.
- The full authentication/authorization test matrix (13-testing-strategy.md Section 15) passing.

## Definition of Done / Acceptance Criteria
- [ ] A new user can register, verify their email, log in, and remain logged in across a session refresh, in every environment.
- [ ] Every role in 01-product-requirements.md Section 3 has a corresponding, seeded `Role` row with correctly assigned permissions.
- [ ] The full authentication/authorization test matrix (13-testing-strategy.md §15.3–15.5) passes with zero gaps.
- [ ] Session/token security properties (refresh rotation, reuse detection) are verified via dedicated tests, not just happy-path coverage.

## Risks

| Risk | Mitigation |
|---|---|
| Better Auth's specific configuration for this platform's multi-app, shared-cookie architecture (10-backend-architecture.md §7.4) proves more complex than anticipated | Time-boxed spike at phase start to validate the shared-cookie SSO approach across `apps/buyer`/`apps/creator`/`apps/internal` before committing the full phase's schedule to it |
| RBAC seed data is incomplete, silently blocking a later phase's role-gated feature | Cross-check the seed data explicitly against every role mentioned across 01-product-requirements.md and 09-api-architecture.md's per-endpoint authorization requirements before declaring this phase done |

---

# Phase 4 — Creator Module

## Purpose
Implement creator identity, onboarding, verification, and storefront management — the foundation every subsequent marketplace-side phase (Product, Orders, Payments) builds on, since nothing can be sold without a Creator and a Store first existing.

**Priority:** Critical · **Estimated Duration:** 3–4 weeks · **Estimated Complexity:** High · **Dependencies:** Phase 3

## Objectives
- Implement the full Creator application → approval → Store creation lifecycle (08-database-design.md Section 7).
- Build the Creator Dashboard app's foundational shell (`apps/creator`, 11-frontend-architecture.md) and its team-management features.
- Implement the Media upload pipeline (10-backend-architecture.md Section 11) early in this phase, since Creator verification documents and Store branding both need it immediately, and every later phase (Products, Reviews, Messaging) depends on the same shared pipeline.

## Modules Involved
Creators, Stores, Media (10-backend-architecture.md Section 5.4–5.5, 5.25).

## Features
Creator application, admin-side approval (a minimal Phase-15-preview slice, since full Admin Panel arrives later), Store creation/branding/policies, StoreVerification, StoreTeam invitations, Vacation Mode, the shared Media upload pipeline in full (signed URLs, validation, virus scanning, thumbnailing).

## Database Impact
`Creator`, `Store`, `StoreBranding`, `StorePolicy`, `StoreVerification`, `StoreTeam`, `StoreInvitation`, `StoreSettings`, `StoreSocialLinks`, `StoreFAQ`, `StoreAnnouncement` (08-database-design.md Section 7); `Media`, `Image`, `Video`, `Thumbnail`, `StorageLocation`, `AltText` (Section 22).

## API Impact
09-api-architecture.md Sections 5 (Creator APIs) and 20 (Upload APIs) in full.

## Backend Impact
The Media module's full R2 integration (10-backend-architecture.md Section 11), including the Inngest-driven processing pipeline (thumbnailing, virus scanning) — the first background-job family to go live (Phase 1's Inngest scaffolding now gets its first real consumer).

## Frontend Impact
The Creator Dashboard app's onboarding flow, Store branding/policy editors, and team-management screens; a minimal internal-facing creator-approval screen (a thin slice of Phase 15's full Admin Panel, scoped narrowly to unblock this phase).

## Deliverables
- A working creator application → (manual/minimal admin) approval → Store live in draft status flow.
- The complete, shared Media upload pipeline, exercised end-to-end for verification documents and Store branding assets.

## Definition of Done / Acceptance Criteria
- [ ] A creator can apply, be approved, and see their newly-created Store in `draft` status.
- [ ] A creator can invite a team member, who accepts and gains store-scoped access per their assigned role.
- [ ] The Media pipeline correctly validates, scans, and processes an uploaded file end-to-end, verified via 13-testing-strategy.md Section 18's full upload test matrix.
- [ ] Vacation Mode correctly hides a store's products from downstream browsing (verifiable once Phase 6 exists; tracked as a cross-phase acceptance item).

## Risks

| Risk | Mitigation |
|---|---|
| Building even a minimal admin-approval slice this early creates throwaway work once Phase 15's full Admin Panel arrives | Scope the minimal slice deliberately narrow (a single approve/reject action) and design it to be a natural subset of Phase 15's eventual UI, not a parallel, later-discarded implementation |
| The Media pipeline's virus-scanning integration (a new third-party dependency) has unknown latency/reliability characteristics | Time-boxed spike to validate the scanning service's actual behavior before committing to its throughput assumptions in 18-observability-monitoring.md's later monitoring design |


---

# Phase 5 — Marketplace

## Purpose
Implement the Catalog domain — taxonomy, navigation, and public storefront browsing — establishing the discovery structure Product listings (Phase 6) will populate.

**Priority:** Critical · **Estimated Duration:** 2 weeks · **Estimated Complexity:** Medium · **Dependencies:** Phase 4

## Objectives
- Implement Category/Collection/Occasion/Festival/Tag/Material/Technique (08-database-design.md Section 10) as platform-curated reference data.
- Build the public Store profile page and the platform's primary navigation structure (04-information-architecture.md).
- Establish the homepage composition mechanism (a minimal version of Phase 14's full CMS) sufficient to launch with a coherent, non-empty homepage once products exist.

## Modules Involved
Categories, Stores (public-read side), CMS (a minimal early slice).

## Features
Category browsing pages, public Store profile pages, primary site navigation, a basic homepage layout (hero + category links), breadcrumb navigation.

## Database Impact
`Category`, `Collection`, `Occasion`, `Festival`, `Tag`, `Material`, `Technique`, `NavigationNode`, `SEOHierarchy`, `URLMapping` (08-database-design.md Section 10) — seeded with the platform's initial curated taxonomy.

## API Impact
09-api-architecture.md Section 6.9 (Categories/Collections read endpoints), Section 5.4 (public Store detail, already partially built in Phase 4).

## Backend Impact
The Categories module's Repository/Service layers; the CMS module's minimal `Page`/`Section` support for the homepage.

## Frontend Impact
Category pages, public Store pages, homepage, and primary navigation across the Buyer app.

## Deliverables
- A navigable, if still product-sparse, public browsing experience — category pages, store pages, homepage — ready for Phase 6 to populate with real inventory.

## Definition of Done / Acceptance Criteria
- [ ] The full category tree (04-information-architecture.md's taxonomy) is seeded and browsable.
- [ ] A public Store page renders correctly with branding, policies, and (once Phase 6 lands) its product catalog.
- [ ] Primary navigation and breadcrumbs match 04-information-architecture.md's documented structure exactly.

## Risks

| Risk | Mitigation |
|---|---|
| Taxonomy seeded in this phase proves incomplete or wrongly structured once real Product data arrives in Phase 6 | Treat the seed data as revisable; 08-database-design.md Section 10.1's platform-curated (not creator-created) model makes taxonomy changes a controlled, low-blast-radius operation |

---

# Phase 6 — Product Management

## Purpose
Implement the full Product domain — the platform's single largest and most detailed domain (08-database-design.md Section 8) — giving creators the ability to list, and buyers the ability to browse, real inventory.

**Priority:** Critical · **Estimated Duration:** 4–5 weeks · **Estimated Complexity:** Very High · **Dependencies:** Phases 4–5

## Objectives
- Implement the complete Product/Variant/Media/Customization CRUD and publishing lifecycle, including the draft → submit-for-review → approve/reject → active state machine.
- Implement Inventory (Section 9 of that document) alongside Products, since publish-readiness depends on it.
- Build the Product Detail Page and the Creator Dashboard's product-authoring screens — the platform's two highest-effort, highest-scrutiny UI surfaces.

## Modules Involved
Products, Inventory, Categories (join tables), Moderation (a minimal slice — the approval workflow specifically, ahead of Phase 15's full case-management UI).

## Features
Product CRUD, variants, media gallery management (with mandatory alt text, per 08-database-design.md §22.7), customization option authoring, inventory tracking, made-to-order/production-capacity support, product publishing/approval workflow, bulk import/export, Product Detail Page, category/search-page product listings (search itself arrives in Phase 16; this phase's listings use structured filtering only, per 09-api-architecture.md Section 6.1).

## Database Impact
The complete Product domain (08-database-design.md Section 8) and Inventory domain (Section 9) go live.

## API Impact
09-api-architecture.md Section 6 (Product APIs) in full, and Section 9's inventory-adjacent endpoints.

## Backend Impact
The Products and Inventory modules' full Service/Repository layers; the first real use of the transactional patterns (10-backend-architecture.md Section 9.3) for multi-write operations like publish-readiness validation.

## Frontend Impact
The Product Detail Page (Buyer app) and the complete product-authoring flow (Creator Dashboard) — both substantial, multi-screen builds per 07-ui-screens-wireframes.md.

## Deliverables
- A creator can author a complete product listing (with variants, media, customization options) and successfully publish it.
- A buyer can browse to and view a fully-rendered Product Detail Page.
- Bulk import/export functioning for at least a representative CSV schema.

## Definition of Done / Acceptance Criteria
- [ ] A Product cannot reach `active` status without satisfying every publish-readiness rule (≥1 active variant, ≥1 primary media with alt text, category-required disclosures) — verified by dedicated tests (13-testing-strategy.md's business-rule coverage expectations).
- [ ] Inventory correctly decrements/tracks via the `InventoryTransaction` ledger, never a raw quantity overwrite (08-database-design.md §9.2).
- [ ] The Product Detail Page renders correctly across every device/browser in 13-testing-strategy.md Section 11's matrix.
- [ ] Bulk import correctly reports per-row success/failure without partial, silent data corruption.

## Risks

| Risk | Mitigation |
|---|---|
| This phase's scope (the largest single domain in 08-database-design.md) risks running long | Sequence sub-features deliberately — core CRUD and publish workflow first, customization and bulk import second, since the former blocks every downstream phase and the latter does not |
| The moderation-approval slice built here becomes throwaway once Phase 15's full Moderation UI arrives | Design the approval action as a clean, reusable Service Layer function (10-backend-architecture.md §5.20) from the start, so Phase 15 only needs to build UI atop already-correct business logic |

---

# Phase 7 — Cart

## Purpose
Implement the ephemeral Cart & Checkout domain's cart-specific half — the bridge between browsing (Phases 5–6) and transacting (Phase 8).

**Priority:** Critical · **Estimated Duration:** 1–2 weeks · **Estimated Complexity:** Medium · **Dependencies:** Phase 6

## Objectives
- Implement Cart/CartItem with guest-cart support and authenticated-cart merge-on-login (09-api-architecture.md Section 8.6).
- Implement Wishlist alongside Cart, since both are buyer-side, product-referencing, relatively low-complexity domains well-suited to build together.

## Modules Involved
Cart, Wishlist (10-backend-architecture.md Section 5.10, 5.17).

## Features
Add/update/remove cart items, save-for-later, guest cart with post-login merge, coupon application (cart-level), gift wrap/message capture, shipping estimate, cart summary; wishlist add/remove, multiple named wishlists.

## Database Impact
`Cart`, `CartItem`, `CouponApplication` (cart-scoped), `Wishlist`, `WishlistItem` (08-database-design.md Sections 12.1–12.3, 11.3–11.4).

## API Impact
09-api-architecture.md Section 8 (Cart APIs) and the Wishlist endpoints under Section 4.6.

## Backend Impact
Live product/price/availability revalidation at every cart read (09-api-architecture.md §8.1), the platform's first real exercise of Products/Inventory's read interfaces from a different module (10-backend-architecture.md §3.6's cross-module call pattern).

## Frontend Impact
The cart drawer/page, wishlist screens, and the "add to cart"/"save" interactions surfaced throughout the Product Detail Page (retrofit onto Phase 6's UI).

## Deliverables
- A buyer (guest or authenticated) can add items to a cart, see live, correct pricing/availability, and have that cart persist and correctly merge across a login event.

## Definition of Done / Acceptance Criteria
- [ ] Cart contents correctly reflect live price/availability, with clear stale-price/unavailable-item indicators (09-api-architecture.md §8.1).
- [ ] A guest cart correctly merges into an authenticated cart on login, with the documented quantity-summing conflict rule (that document's §8.6).
- [ ] Wishlist add/remove works from both the PDP quick-action and the full wishlist management screen.

## Risks

| Risk | Mitigation |
|---|---|
| Guest-cart-to-authenticated-cart merge logic has subtle edge cases (duplicate variants, stock caps) | Dedicated edge-case test coverage (13-testing-strategy.md Section 21) specifically targeting the merge operation before this phase is considered done |


---

# Phase 8 — Checkout

## Purpose
Implement the complete Checkout and Payment domains — the platform's single highest-stakes phase, since it is where real money first moves. This phase is deliberately not compressed or parallelized with adjacent work.

**Priority:** Critical · **Estimated Duration:** 4–6 weeks · **Estimated Complexity:** Very High · **Dependencies:** Phase 7

## Objectives
- Implement the complete multi-step CheckoutSession state machine (08-database-design.md Section 12.4–12.10) and its full Razorpay integration (10-backend-architecture.md Section 16).
- Implement the Payment domain in full — capture, refund groundwork (full refund workflow completes in Phase 9 alongside Orders), commission calculation, webhook processing.
- Establish this platform's circuit-breaker (that document's §17.5), idempotency (09-api-architecture.md §2.6), and financial audit-trail (10-backend-architecture.md §16.8) patterns — the highest-rigor engineering in this entire roadmap.

## Modules Involved
Checkout, Payments, Shipping (10-backend-architecture.md Sections 5.11, 5.14, 5.13).

## Features
Address selection, shipping method selection, tax calculation, coupon/gift-card redemption at checkout, payment intent creation and confirmation (UPI, cards, netbanking, wallets, COD), Razorpay webhook processing, commission calculation, the full payment scenario matrix (13-testing-strategy.md Section 16.3).

## Database Impact
`CheckoutSession`, `ShippingSelection`, `PaymentIntent`, `OrderPreview`, `GiftMessage`, `TaxCalculation`, `DeliveryEstimate` (08-database-design.md Section 12.4–12.10); `Payment`, `PaymentMethod`, `Transaction`, `Commission` (Section 14.1–14.3, 14.6) — `Settlement`/`Payout`/`Refund`/`Dispute`/`Ledger` follow in Phase 9 alongside Orders, since they depend on a completed Order existing first.

## API Impact
09-api-architecture.md Section 9 (Checkout APIs) and Section 11 (Payment APIs) in full; Section 21 (Webhook Specifications) for the Razorpay webhook path.

## Backend Impact
10-backend-architecture.md Section 16's complete Razorpay integration (client wrapper, webhook signature verification, circuit breaker) and Section 9.6's idempotency-enforcement pattern, established here as the template every future payment-adjacent feature follows.

## Frontend Impact
The complete, multi-step Checkout flow across the Buyer app (07-ui-screens-wireframes.md's most conversion-critical screens).

## Deliverables
- A buyer can complete a real (sandbox-mode, then production) purchase end-to-end: address → shipping → payment → order confirmation.
- The full payment scenario matrix (13-testing-strategy.md Section 16.3) passing, including webhook-race, idempotency, and circuit-breaker scenarios.

## Definition of Done / Acceptance Criteria
- [ ] Every scenario in 13-testing-strategy.md Section 16.3's payment matrix has a passing automated test.
- [ ] The financial reconciliation test (that document's Section 16.5) passes with zero discrepancy.
- [ ] Idempotency is verified for every `Idempotency-Key`-requiring endpoint in this domain (09-api-architecture.md Section 2.6).
- [ ] The Razorpay circuit breaker is verified to open, fail fast, and recover correctly under simulated sustained failure (10-backend-architecture.md §17.5).
- [ ] A real, minimal-value transaction against the live Razorpay integration succeeds post-Staging-promotion (16-cicd-release-management.md §20.4), ahead of any production traffic being permitted through this path.

## Risks

| Risk | Mitigation |
|---|---|
| Razorpay's live-mode onboarding/KYC (started in Phase 0) isn't complete by the time this phase needs it | Tracked explicitly from Phase 0 onward as this roadmap's single most important cross-phase dependency; sandbox-mode development proceeds regardless, with live-mode verification gating only the final pre-launch step |
| A payment-flow defect reaches production, given this phase's real-money stakes | This phase alone justifies a mandatory second reviewer (20-git-workflow-contribution-guide.md §8.2) on every pull request, and every release from this module is treated as Tier 1 (16-cicd-release-management.md §14.2) from its very first deployment onward |
| Webhook-vs-synchronous-confirmation race conditions are subtle and easy to under-test | Dedicated, explicit test scenarios for both arrival orderings (13-testing-strategy.md §16.3's webhook-race rows) are a hard gate, not an optional nice-to-have, before this phase is considered done |

---

# Phase 9 — Orders

## Purpose
Implement the complete Order domain — the durable transaction record and its full post-purchase lifecycle (fulfillment, cancellation, returns, exchanges) — completing the Payment domain's remaining pieces (Payout, Settlement, Refund, Dispute, Ledger) alongside it, since they only make sense once real Orders exist.

**Priority:** Critical · **Estimated Duration:** 4–5 weeks · **Estimated Complexity:** Very High · **Dependencies:** Phase 8

## Objectives
- Implement Order/SubOrder/OrderItem creation (the terminal step of Phase 8's checkout flow) and the complete buyer/creator-facing order-management experience.
- Implement Shipment/ShipmentTracking, ReturnRequest/RefundRequest/Refund, Cancellation, Exchange.
- Implement the creator Payout pipeline — the second-highest-stakes feature in this roadmap after Phase 8's checkout itself.

## Modules Involved
Orders, Shipping, Payments (completing its remaining entities).

## Features
Order confirmation and history (buyer), order management and fulfillment (creator), shipment creation/tracking, return/refund/exchange workflows, invoice generation, the scheduled Payout batch job.

## Database Impact
`Order`, `SubOrder`, `OrderItem`, `OrderTimeline`, `OrderStatusHistory`, `Invoice`, `Shipment`, `ShipmentTracking`, `ReturnRequest`, `RefundRequest`, `Cancellation`, `Exchange`, `OrderCommunication` (08-database-design.md Section 13); `Settlement`, `Payout`, `Refund`, `Dispute`, `Ledger`, `AccountingEntry` (Section 14.4–14.10).

## API Impact
09-api-architecture.md Section 10 (Order APIs) in full, and the remaining Section 11 (Payment APIs) endpoints (refund execution, payout/settlement reads).

## Backend Impact
The `payouts` Inngest job family (10-backend-architecture.md Section 12.4) goes live — this platform's highest-financial-stakes background job, built with the reconciliation-first discipline 19-operations-runbook.md Section 16.7 mandates from day one.

## Frontend Impact
Order history and detail (Buyer app), order management/fulfillment screens (Creator Dashboard), the return/refund request flow (both apps).

## Deliverables
- A complete buyer journey from order confirmation through delivery tracking.
- A complete creator fulfillment journey from order receipt through marking shipped.
- A working, tested Payout batch job with full reconciliation against Razorpay's own records.

## Definition of Done / Acceptance Criteria
- [ ] `Order.grandTotal` reconciles exactly against the sum of its `SubOrder` totals on every created order (08-database-design.md §26.5's cross-row invariant, tested per 13-testing-strategy.md §14).
- [ ] A full return → creator approval → refund cycle completes correctly end-to-end.
- [ ] The Payout batch job's reconciliation test (13-testing-strategy.md §16.5, extended here to the full payout cycle) passes with zero discrepancy, and dead-letter/failure handling (19-operations-runbook.md §17.7) is verified via a deliberate fault-injection test.
- [ ] Every documented `OrderStatusHistory`/`OrderTimeline` transition is correctly recorded and buyer-visible where intended.

## Risks

| Risk | Mitigation |
|---|---|
| Payout logic errors risk double-paying or under-paying real creators | Mirrors Phase 8's elevated review/testing rigor exactly; the reconciliation test is treated as a release-blocking gate, never optional, per 19-operations-runbook.md §16.7's standing caution |
| Multi-store order splitting (`SubOrder`) introduces edge cases in partial shipment/partial refund scenarios | Dedicated edge-case test coverage for multi-store cart checkout through to independent per-store fulfillment, exercised before this phase is considered done |

---

# Phase 10 — Messaging

## Purpose
Implement the Messaging domain — buyer↔creator (and, in a minimal slice, support-adjacent) communication — establishing the real-time infrastructure (Supabase Realtime) this platform will also reuse for order-status live updates.

**Priority:** High · **Estimated Duration:** 2–3 weeks · **Estimated Complexity:** Medium · **Dependencies:** Phases 4, 9

## Objectives
- Implement Conversation/Message/Attachment/ReadReceipt with Supabase Realtime-driven live delivery (10-backend-architecture.md Section 15.2).
- Link conversations to Order context (`OrderCommunication`) so buyer/creator/support all see relevant history together.

## Modules Involved
Messaging & Notifications (the merged module, 10-backend-architecture.md Section 5.15) — this phase builds its Messaging half; Notifications' full build-out is Phase 11.

## Features
Starting a conversation (from a Product page or an Order), sending messages/attachments, read receipts, typing indicators, conversation list/archive, block-user.

## Database Impact
`Conversation`, `Participant`, `Message`, `Attachment`, `ReadReceipt`, `ModerationFlag` (08-database-design.md Section 15).

## API Impact
09-api-architecture.md Section 13 (Messaging APIs) in full.

## Backend Impact
The first real use of Supabase Realtime for live delivery (10-backend-architecture.md §15.2) — the database write itself triggers the real-time broadcast, establishing the pattern Phase 11's live notification badge and Phase 9's live order-status updates also rely on.

## Frontend Impact
Conversation list and thread UI across the Buyer and Creator apps, with real-time message delivery and typing indicators.

## Deliverables
- A working, real-time buyer↔creator messaging experience, linked correctly to order context where applicable.

## Definition of Done / Acceptance Criteria
- [ ] A message sent by one party appears in real time for the other, without a page refresh, verified via Supabase Realtime subscription.
- [ ] A conversation started from an Order correctly links via `OrderCommunication` and is visible from the Order detail screen.
- [ ] Block-user correctly prevents further messages and auto-archives the existing conversation.

## Risks

| Risk | Mitigation |
|---|---|
| Supabase Realtime's specific subscription/reconnection behavior under real network conditions (mobile, intermittent connectivity) proves less reliable than assumed | Time-boxed spike validating reconnection behavior early in this phase; a polling-based fallback for message-list refresh is a documented, ready fallback if Realtime proves insufficient |


---

# Phase 11 — Notifications

## Purpose
Implement the complete Notification domain — cross-channel delivery (email, in-app, push) — building on Phase 10's Messaging-adjacent module and Phase 1's Inngest scaffolding.

**Priority:** High · **Estimated Duration:** 2 weeks · **Estimated Complexity:** Medium · **Dependencies:** Phase 10

## Objectives
- Implement the unified notification fan-out pipeline (10-backend-architecture.md Section 15.5) consuming domain events already being emitted since Phase 4 (`inngest.send`, that document's Section 12.9) by every prior phase.
- Wire Resend for transactional email and Web Push for the Buyer PWA.
- Implement notification preferences and the in-app notification center.

## Modules Involved
Messaging & Notifications (completing the module — Notifications half).

## Features
Order-status emails, message-received notifications, review-reminder notifications, in-app notification center with live unread count, notification preferences management, push device registration.

## Database Impact
`Notification`, `NotificationTemplate`, `EmailQueue`, `SMSQueue`, `PushQueue`, `InAppNotification`, `DeliveryLog` (08-database-design.md Section 17); `NotificationPreferences` (already created in Phase 3, now actively consumed).

## API Impact
09-api-architecture.md Section 14 (Notification APIs) in full.

## Backend Impact
The `notifications` Inngest job family goes fully live (10-backend-architecture.md Section 12.4), retroactively delivering on every domain event every prior phase has been emitting since Phase 4 — a satisfying, low-risk integration point since the emitting side has already existed and been tested for several phases.

## Frontend Impact
The in-app notification bell/center (all three apps), notification-preferences settings screen.

## Deliverables
- A buyer/creator correctly receives an order-status email, an in-app notification, and (if opted in) a push notification for the same underlying event, each independently.

## Definition of Done / Acceptance Criteria
- [ ] Every domain event already emitted by Phases 4–10 correctly triggers its documented notification(s), respecting `NotificationPreferences`.
- [ ] Channel failure isolation is verified (13-testing-strategy.md Section 17.3) — a failed email send doesn't block the in-app notification for the same event.
- [ ] The in-app unread-count badge updates live via the real-time channel established in Phase 10.

## Risks

| Risk | Mitigation |
|---|---|
| Retroactively wiring notifications to five phases' worth of already-emitted events surfaces inconsistent event-payload shapes | A brief audit of every `inngest.send` call across Phases 4–10 at this phase's start, standardizing payload shape before building the fan-out logic against it |

---

# Phase 12 — Reviews

## Purpose
Implement the Reviews domain — the platform's core post-purchase trust signal, gated strictly on verified purchase.

**Priority:** High · **Estimated Duration:** 2 weeks · **Estimated Complexity:** Medium · **Dependencies:** Phase 9

## Objectives
- Implement the complete Review/Rating/MediaReview/CreatorReply/ReviewVote/ReviewReport lifecycle, with the purchase-eligibility gate as its central, non-negotiable business rule.

## Modules Involved
Reviews (10-backend-architecture.md Section 5.16).

## Features
Review creation (text + photo/video, multi-dimension ratings), creator replies, helpful-vote, report-review, rating-summary aggregation on Product/Store pages.

## Database Impact
`Review`, `Rating`, `MediaReview`, `CreatorReply`, `ReviewVote`, `ReviewReport`, `ReviewModeration` (08-database-design.md Section 16).

## API Impact
09-api-architecture.md Section 12 (Review APIs) in full.

## Backend Impact
The Reviews module's Service Layer implementing the eligibility check against `OrderItem` (a cross-module read into Orders, per 10-backend-architecture.md Section 3.6's sanctioned pattern) — the platform's clearest example yet of a business rule that must be airtight (a review without a genuine, completed purchase is a direct trust violation).

## Frontend Impact
Review submission flow (post-delivery prompt, per the Notifications phase's review-reminder), review display on PDP/Store pages, creator reply interface.

## Deliverables
- A buyer with a completed order can submit a review; a buyer without one cannot, verified explicitly.

## Definition of Done / Acceptance Criteria
- [ ] Review creation is impossible without a matching, completed `OrderItem` — verified by dedicated negative-path tests (13-testing-strategy.md Section 12.2).
- [ ] Aggregate rating summaries (`Product`/`Store` denormalized counters) update correctly and promptly following a new review.
- [ ] A CreatorReply is correctly limited to one per review, editable but not duplicable.

## Risks

| Risk | Mitigation |
|---|---|
| The eligibility gate has an edge case (e.g., a partially-refunded order item) not fully anticipated | Explicit edge-case test coverage for every `OrderItem` status variant against review eligibility, before this phase is considered done |

---

# Phase 13 — Analytics

## Purpose
Implement the Analytics domain — creator-facing and platform-facing business intelligence — consuming the now-substantial event stream every prior phase has been emitting.

**Priority:** Medium · **Estimated Duration:** 2–3 weeks · **Estimated Complexity:** Medium · **Dependencies:** Phases 6, 9, 11 (needs Products, Orders, and the event-emission pattern all live)

## Objectives
- Implement the `analytics` Inngest job family and the aggregate rollup tables (08-database-design.md Section 21).
- Build the Creator Dashboard's analytics screens and the platform-wide analytics foundation Phase 15's Admin Panel will build further upon.
- Wire PostHog for product analytics and feature-flag-driven experimentation (10-backend-architecture.md Section 19.8).

## Modules Involved
Analytics (10-backend-architecture.md Section 5.22).

## Features
Creator Dashboard analytics (views, conversion, sales trends), Store-level performance summaries, PostHog integration for product-usage analytics and A/B testing infrastructure.

## Database Impact
`Metrics`, `Events`, `ProductViews`, `SearchAnalytics` (populated fully once Phase 16 ships), `SalesAnalytics`, `CreatorAnalytics`, `PlatformAnalytics`, `Experiment`, `FeatureUsage`, `DashboardSnapshots` (08-database-design.md Section 21).

## API Impact
09-api-architecture.md Section 19 (Analytics APIs) and Section 5.11 (creator-facing analytics).

## Backend Impact
The read-only, asynchronous Analytics module (10-backend-architecture.md §5.22) — this phase's defining architectural discipline is ensuring Analytics never becomes a dependency for any other module's correctness (that document's Section 2.4), verified explicitly.

## Frontend Impact
Creator Dashboard analytics screens; the data foundation for Phase 15's platform-wide Admin analytics views.

## Deliverables
- A creator can see accurate views/conversion/sales data for their own store and products.

## Definition of Done / Acceptance Criteria
- [ ] Every domain event from Phases 4–12 correctly feeds its intended analytics rollup.
- [ ] Analytics queries are verified to never run against production OLTP tables directly at the request-serving path (08-database-design.md §2.4's OLTP/analytics isolation), only against precomputed rollups or async-populated tables.
- [ ] PostHog correctly receives forwarded events and feature-flag state is queryable.

## Risks

| Risk | Mitigation |
|---|---|
| Retroactively building analytics atop many phases' already-emitted events surfaces gaps in what was actually captured | An audit pass (mirroring Phase 11's identical concern) confirming every needed analytics dimension was actually present in the emitted event payloads, backfilling emission code where a gap is found |


---

# Phase 14 — CMS

## Purpose
Expand Phase 5's minimal homepage/page slice into the full CMS domain — editorial content, banners, articles, legal documents — giving the platform's marketing and trust-building surfaces their complete, intended richness.

**Priority:** Medium · **Estimated Duration:** 2 weeks · **Estimated Complexity:** Low–Medium · **Dependencies:** Phase 5

## Objectives
- Implement the full Page/Section/Banner/Article/FAQ/LegalDocument/SEOContent domain (08-database-design.md Section 20).
- Build the internal-facing CMS authoring tooling (a first substantial slice of `apps/internal`, ahead of Phase 15's full Admin Panel).

## Modules Involved
CMS (10-backend-architecture.md Section 5.19).

## Features
Full homepage composition (banners, featured collections, curated product rails), Article/blog publishing, platform-wide FAQ, legal document versioning (Terms, Privacy Policy), CMS authoring UI.

## Database Impact
`Page`, `Section`, `Banner`, `Announcement`, `Article`, `FAQ`, `LegalDocument`, `SEOContent`, `MediaLibrary` (08-database-design.md Section 20) — completing what Phase 5 only partially populated.

## API Impact
09-api-architecture.md Section 18 (CMS APIs) in full.

## Backend Impact
The CMS module's Service Layer, including the versioned `LegalDocument` pattern (08-database-design.md §20.7) mirroring `StorePolicy`'s established versioning approach from Phase 4.

## Frontend Impact
The full homepage, Article/blog pages, FAQ pages, legal document pages (Buyer app); the CMS authoring screens (Internal app).

## Deliverables
- A fully composed, editorially-curated homepage; a working internal CMS authoring tool non-engineers can use to update content without a deployment.

## Definition of Done / Acceptance Criteria
- [ ] Non-engineering staff can author and publish a Banner or Article without any code change or deployment.
- [ ] Legal document versioning correctly preserves prior versions and serves the currently-effective one by default.
- [ ] The homepage's aggregate composition endpoint (09-api-architecture.md §18.2) renders correctly with real, live Product/Collection data.

## Risks

| Risk | Mitigation |
|---|---|
| CMS authoring UI is under-scoped, leaving non-technical staff still dependent on engineering for routine content updates | Explicit UX review of the authoring flow with an actual non-engineering stakeholder before this phase is considered done, not just an engineering self-assessment |

---

# Phase 15 — Admin Panel

## Purpose
Build the complete Internal app — Admin, Moderator, and Support surfaces — consolidating every minimal internal-facing slice built ad hoc in Phases 4, 6, and 14 into the platform's full, unified internal operating tool.

**Priority:** High · **Estimated Duration:** 4–5 weeks · **Estimated Complexity:** High · **Dependencies:** Phases 4, 6, 9, 12, 14

## Objectives
- Implement the complete Admin API surface (09-api-architecture.md Section 16) — user/creator/product/order/payment management, reports, settings, audit logs.
- Implement the complete Moderator API surface (that document's Section 17) — the unified `ModerationCase` queue across Products, Stores, Reviews, Messages, Users.
- Implement the complete Support API surface (that document's Section 15) — tickets, escalation, knowledge base.
- Replace every minimal internal-facing slice from earlier phases with this phase's full, proper implementation.

## Modules Involved
Moderation, Support, Audit, Settings & Feature Flags (10-backend-architecture.md Sections 5.20–5.21, 5.23–5.24), plus full Admin-scoped access across every other module.

## Features
Full user/creator/product/order/payment admin management; the unified moderation case queue with evidence, decisions, appeals, bans/suspensions; the full support ticketing system with escalation and knowledge base; platform settings and feature-flag management; audit log browsing.

## Database Impact
`ModerationCase`, `Evidence`, `Decision`, `Appeal`, `Violation`, `Warning`, `Ban`, `Suspension` (08-database-design.md Section 19); `Ticket`, `TicketMessage`, `TicketAttachment`, `Escalation`, `RefundWorkflow`, `SupportAgent`, `KnowledgeBase`, `Macros` (Section 18); `AuditLog`, `SecurityEvent`, `LoginHistory` (Section 23, now with a full browsing UI atop data that's been accumulating since Phase 3).

## API Impact
09-api-architecture.md Sections 15–17 in full.

## Backend Impact
The Moderation module's cross-module sanction-execution pattern (10-backend-architecture.md §5.20 — calling into Products/Stores/Reviews' own public interfaces to execute a takedown, never mutating their tables directly) is fully realized here, replacing every earlier phase's minimal, narrow approval-action shortcut.

## Frontend Impact
The complete Internal app — dashboards, user/creator/product/order management tables, the moderation case queue, the support ticket workspace, settings screens.

## Deliverables
- A fully staffed internal team can run the entire platform's day-to-day trust, safety, and support operations from this app alone, with no remaining dependency on direct database access or engineering intervention for routine operational tasks.

## Definition of Done / Acceptance Criteria
- [ ] Every Section 16–17 (09-api-architecture.md) endpoint is implemented and covered by the full authorization matrix (13-testing-strategy.md Section 15.4) across every internal role (Admin, Super Admin, Moderator, Support Executive).
- [ ] The unified moderation queue correctly surfaces cases from every subject type (Product, Store, Review, Message, User) in one view.
- [ ] Every minimal internal-facing shortcut from Phases 4/6/14 has been replaced by this phase's full implementation, with no lingering parallel/duplicate code path.
- [ ] Audit log browsing is verified against 12-security-architecture.md's compliance requirements for internal access review.

## Risks

| Risk | Mitigation |
|---|---|
| This phase's broad scope (effectively a fourth full application) risks running significantly long | Sequence by internal-team urgency — Admin's order/payment support tools and Moderation's core queue first (since Support is already fielding real user issues by this point in the roadmap), Settings/Feature-Flags and deeper reporting last |
| Replacing earlier phases' minimal internal slices introduces regression risk in already-working, production-serving flows | Every replacement is covered by the same integration/API test suite the original minimal slice had, run before and after the swap, per 13-testing-strategy.md's regression-testing discipline |

---

# Phase 16 — Search

## Purpose
Implement the Search domain — Postgres full-text search, autocomplete, filtering, and trending — the platform's primary discovery mechanism beyond structured category browsing.

**Priority:** High · **Estimated Duration:** 2–3 weeks · **Estimated Complexity:** Medium–High · **Dependencies:** Phase 6

## Objectives
- Implement the `SearchIndex` read-model and the async indexing pipeline (10-backend-architecture.md Section 14) consuming Product/Store/Category change events already emitted since Phase 6.
- Build the full-text search, autocomplete, and filter/sort experience per 09-api-architecture.md Section 7.

## Modules Involved
Search (10-backend-architecture.md Section 5.18).

## Features
Search-as-you-type autocomplete, ranked full-text search results, typo-tolerance/synonym handling, combined search + structured filters, trending searches, search analytics feeding Phase 13's Analytics.

## Database Impact
`SearchIndex`, `SearchHistory`, `TrendingSearch`, `Autocomplete`, `Synonyms`, `Filters` (08-database-design.md Section 24).

## API Impact
09-api-architecture.md Section 7 (Search APIs) in full.

## Backend Impact
The `search-indexing` Inngest job family goes live, consuming the `product.updated`/`store.updated`/`category.updated` events already flowing since Phase 6 — another satisfying, low-integration-risk phase since the emission side has been stable and tested for many phases already.

## Frontend Impact
The search bar/autocomplete component (all apps, though primarily Buyer), search results page with combined text + filter UI.

## Deliverables
- A buyer can search by free text and receive relevantly-ranked, correctly-filtered results, with sub-100ms autocomplete.

## Definition of Done / Acceptance Criteria
- [ ] Every scenario in 13-testing-strategy.md Section 19.3's search test matrix passes, including index-freshness and Vacation-Mode/archived-product exclusion.
- [ ] Autocomplete latency meets its documented target (09-api-architecture.md Section 7.2) under realistic data volume.
- [ ] Search ranking correctly reflects the documented recency/popularity/verified-store weighting (10-backend-architecture.md Section 14.3).

## Risks

| Risk | Mitigation |
|---|---|
| Postgres full-text search's ranking sophistication proves insufficient even at launch scale | Accepted as a known, documented limitation with a pre-planned migration path (10-backend-architecture.md §14.5's Meilisearch evolution) — not a blocker for this phase, since that path is explicitly designed to be additive later, not a redesign |
| Index-freshness lag (publish-to-searchable latency) is worse than acceptable under real load | Load-tested explicitly (13-testing-strategy.md Section 13.5) against a realistic product-publish-rate assumption before this phase is considered done |


---

# Phase 17 — Optimization

## Purpose
A dedicated, deliberate performance-hardening pass across the entire platform — restated from 15-engineering-standards.md Section 20.5's anti-premature-optimization principle: this phase exists specifically *because* every prior phase deliberately deferred non-measured optimization, and this is where real, measured data now drives targeted improvement.

**Priority:** High · **Estimated Duration:** 2–3 weeks · **Estimated Complexity:** Medium–High · **Dependencies:** Phases 1–16 (all feature phases complete)

## Objectives
- Run 13-testing-strategy.md Section 13's full performance-testing suite (load, stress, Core Web Vitals) against the now-complete platform and address every finding against that document's stated targets.
- Conduct `EXPLAIN ANALYZE` review (10-backend-architecture.md Section 21.7) across every high-volume-table query accumulated over Phases 6–16.
- Tune caching (Redis hit rates, Section 13.2 of that document) and CDN/image-optimization configuration against real, representative traffic patterns.

## Modules Involved
Cross-cutting — every module, reviewed against its own performance profile.

## Features
None new user-facing — this phase's "feature" is measured, verified platform-wide performance.

## Database Impact
Index additions/adjustments informed by real query-performance data; no new entities.

## API Impact
No new endpoints; existing endpoints' latency profiles are measured and, where needed, improved (caching, query optimization, response-shape trimming).

## Backend Impact
Caching strategy tuning (10-backend-architecture.md Section 13), connection-pool sizing validation under load, background-job throughput tuning.

## Frontend Impact
Core Web Vitals optimization (bundle-size review, image-loading strategy, Server/Client Component boundary audit) across all three apps.

## Deliverables
- A load-tested, performance-verified platform meeting every target in 13-testing-strategy.md Section 13.3–13.4.
- A documented set of addressed performance findings, with any deliberately-deferred item recorded as tracked technical debt (15-engineering-standards.md Section 27).

## Definition of Done / Acceptance Criteria
- [ ] Every latency/Core-Web-Vitals target in 13-testing-strategy.md Section 13.3–13.4 is met under load-tested, realistic-concurrency conditions.
- [ ] Every high-volume-table query has been reviewed via `EXPLAIN ANALYZE` at least once.
- [ ] Stress testing (that document's Section 13.6) confirms graceful degradation and full automatic recovery under simulated extreme load.

## Risks

| Risk | Mitigation |
|---|---|
| A significant performance finding requires deeper architectural rework than this phase's timebox allows | Findings are triaged by severity (mirroring 13-testing-strategy.md's defect-severity matrix); anything requiring genuine architectural change is escalated as a pre-launch go/no-go conversation (Phase 20) rather than silently absorbed into an over-extended Phase 17 |

---

# Phase 18 — Security Hardening

## Purpose
A dedicated, comprehensive security review and hardening pass against 12-security-architecture.md's full control set, before this platform is trusted with real user data and real money at production scale.

**Priority:** Critical · **Estimated Duration:** 2–3 weeks · **Estimated Complexity:** High · **Dependencies:** Phases 1–17

## Objectives
- Execute a full security review against every control in 12-security-architecture.md (authentication, authorization, input validation, encryption, RLS, secrets management).
- Conduct penetration testing (internal or third-party) against the complete, feature-full platform.
- Execute a full secrets-rotation drill and confirm every credential's rotation policy (16-cicd-release-management.md Section 25, 19-operations-runbook.md Section 20.3) is actually functioning.

## Modules Involved
Cross-cutting — every module, reviewed against 12-security-architecture.md's applicable controls.

## Features
None new user-facing.

## Database Impact
An RLS policy audit across every multi-tenant table (10-backend-architecture.md Section 20.9), confirmed via dedicated cross-tenant-access-denial tests (13-testing-strategy.md Section 14.4).

## API Impact
A full re-verification of the authorization matrix (13-testing-strategy.md Section 15.4) across every endpoint and every role, and a fresh dependency-vulnerability scan (16-cicd-release-management.md Section 8.3) across the entire, now-complete dependency tree.

## Backend Impact
Secrets rotation drill executed for every credential category; circuit-breaker and rate-limiting configuration re-verified under adversarial-simulation conditions.

## Frontend Impact
A security-focused accessibility-adjacent review of client-side data handling (no sensitive data in `localStorage`, correct `HttpOnly`/`SameSite` cookie behavior verified in a real browser, per 10-backend-architecture.md Section 7.4).

## Deliverables
- A completed security review with every finding triaged and, for Critical/High findings, resolved before proceeding to Phase 20.
- A completed penetration test report.
- A verified, working secrets-rotation procedure.

## Definition of Done / Acceptance Criteria
- [ ] Every control in 12-security-architecture.md's review checklist (that document's Section 30) is verified, not merely assumed implemented.
- [ ] Zero Critical or High-severity findings remain open from the penetration test.
- [ ] RLS cross-tenant denial is verified via dedicated tests for every multi-tenant table.
- [ ] A live secrets-rotation drill completes successfully using the documented overlap procedure (19-operations-runbook.md Section 20.3).

## Risks

| Risk | Mitigation |
|---|---|
| Penetration testing surfaces a significant, architecturally-rooted finding late in the roadmap | This phase is scheduled with enough buffer before Phase 20 specifically to absorb this risk; a genuinely severe finding is treated as a launch-blocking gate, never soft-pedaled to preserve a launch date |

---

# Phase 19 — Testing

## Purpose
The final, comprehensive, whole-platform quality pass — full regression, complete E2E coverage, accessibility audit, cross-browser/device verification, and a disaster-recovery drill — synthesizing 13-testing-strategy.md and 19-operations-runbook.md's full standards against the complete, feature-frozen platform.

**Priority:** Critical · **Estimated Duration:** 2–3 weeks · **Estimated Complexity:** High · **Dependencies:** Phases 1–18

## Objectives
- Execute the full E2E suite (13-testing-strategy.md Section 10.2's mandatory journeys) across every browser/device in that document's Section 11 matrix.
- Execute a complete accessibility audit (Section 12) — automated and manual, keyboard-only and screen-reader.
- Execute the first full disaster-recovery drill (19-operations-runbook.md Section 19.6) against the real, production-configured infrastructure.
- Execute the complete manual QA checklist (13-testing-strategy.md Section 28) for every major feature area.

## Modules Involved
Cross-cutting — the entire platform, tested as a whole rather than module by module.

## Features
None new — this phase verifies, exhaustively, everything built in Phases 3–16.

## Database Impact
None new — backup/restore verification (19-operations-runbook.md Section 18) is executed for the first time against real, complete production-shaped data.

## API Impact
None new — full contract-conformance verification (09-api-architecture.md Section 26.1) across every documented endpoint.

## Backend Impact
Full background-job resilience testing (13-testing-strategy.md Section 17) across every job family under realistic, sustained load.

## Frontend Impact
Full cross-browser/device verification (that document's Section 11) across all three apps.

## Deliverables
- A release-readiness-checklist-complete platform (13-testing-strategy.md Section 29.2), with zero open Critical/High-severity defects.
- A completed, successful disaster-recovery drill report.

## Definition of Done / Acceptance Criteria
- [ ] Every item in 13-testing-strategy.md Section 29.2's release-readiness checklist is satisfied.
- [ ] Zero open Critical or High-severity defects against the full platform.
- [ ] The disaster-recovery drill (19-operations-runbook.md Section 19.6) meets its target RTO/RPO.
- [ ] Full accessibility audit (WCAG 2.2 AA) passes with zero serious/critical violations across every mandatory journey.

## Risks

| Risk | Mitigation |
|---|---|
| This late-stage comprehensive pass surfaces a volume of findings larger than the remaining schedule comfortably absorbs | Findings are triaged by severity from day one of this phase, not batched to the end; Critical/High findings are fixed immediately as they're found, in parallel with continued testing, rather than sequentially after a full pass completes |

---

# Phase 20 — Production Launch

## Purpose
The final go-live — the culmination of every prior phase, executed with the full rigor 16-cicd-release-management.md and 19-operations-runbook.md define for the platform's highest-stakes possible deployment event.

**Priority:** Critical · **Estimated Duration:** 1 week (plus a sustained post-launch observation period) · **Estimated Complexity:** High · **Dependencies:** Phases 1–19, all complete and signed off

## Objectives
- Execute the complete release-readiness checklist (13-testing-strategy.md Section 29.2) and obtain named Tier 1 go/no-go sign-off (that document's Section 29.4) from Engineering Leadership and Founders jointly.
- Execute production launch with every safeguard this series defines: gradual, flag-gated traffic ramp-up (16-cicd-release-management.md Section 15), continuous monitoring through the observation window (that document's Section 20.5), and a confirmed, tested rollback path (Section 16) held ready throughout.

## Modules Involved
The complete platform.

## Features
Full production availability of every feature built across Phases 3–16, to real buyers and creators for the first time.

## Database Impact
Production database goes live with real user data for the first time — the moment 08-database-design.md Section 29's full PII/GDPR-readiness and 12-security-architecture.md's full control set become live, real-stakes protections rather than tested-in-theory ones.

## API Impact
The public API surface (09-api-architecture.md) becomes live to real traffic.

## Backend Impact
Every background job family, every third-party integration, and every monitoring/alerting rule (18-observability-monitoring.md) becomes live against real production load for the first time.

## Frontend Impact
All three apps become publicly reachable (Buyer, Creator) or operationally live (Internal) for real use.

## Deliverables
- A live, production Dreams by Kalakaaar v2 platform, serving real buyers and creators.
- A completed post-launch observation report confirming platform stability.

## Definition of Done / Acceptance Criteria
- [ ] Named Tier 1 go/no-go sign-off is obtained and recorded (13-testing-strategy.md §29.4) before traffic is permitted.
- [ ] The full post-deployment verification workflow (that document's Section 30.2, 16-cicd-release-management.md §20) completes successfully.
- [ ] Live payment verification (13-testing-strategy.md §30.4) succeeds against the real Razorpay production integration.
- [ ] The platform sustains stable operation (no SEV-1/2 incident, per 19-operations-runbook.md §9.2) through the defined post-launch observation window.

## Risks

| Risk | Mitigation |
|---|---|
| An issue only manifests under genuine, diverse real-user traffic that no amount of pre-launch testing could fully anticipate | The gradual, flag-gated ramp-up (16-cicd-release-management.md §15.3) and a fully-staffed, elevated-attentiveness on-call rotation (19-operations-runbook.md §3.3) through the observation window are this phase's primary safeguards against exactly this residual risk |
| Launch-day pressure tempts a shortcut past a documented gate | Every gate in this entire roadmap remains non-bypassable at launch precisely as it was throughout development (16-cicd-release-management.md §7.5) — launch urgency is never treated as grounds for an exception |


---

# Critical Path

The sequence of phases that cannot be compressed or reordered without delaying every phase downstream of it — every other phase either depends directly on this chain or can be parallelized alongside it (see Parallel Development Opportunities, below).

```
Phase 0 ──► Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► Phase 6 ──►
Phase 7 ──► Phase 8 ──► Phase 9 ──► Phase 15 ──► Phase 18 ──► Phase 19 ──► Phase 20
```

**Why each link is load-bearing:**
- **0 → 1 → 2:** no feature work is meaningfully possible without the repository, pipeline, and component library existing first.
- **2 → 3:** every screen from Phase 3 onward is built on Phase 2's components; authentication itself needs real UI.
- **3 → 4:** nothing marketplace-side can exist without a `User` and a `Creator`/`Store`.
- **4 → 6:** Products belong to Stores.
- **6 → 7 → 8 → 9:** the core commerce loop — browse, cart, checkout, order — is inherently sequential; each step's data model depends on the completed prior step (a Cart references a Product; an Order is created from a completed Checkout; a Payout depends on completed Orders).
- **9 → 15:** the Admin Panel's order/payment management tooling needs real Orders and Payments to manage.
- **15 → 18 → 19 → 20:** the platform must be feature-complete (including its internal operating tools) before a meaningful security review, before comprehensive testing, and before launch.

**Phases 5, 10–14, 16–17 are explicitly off the critical path** — each depends on specific upstream phases (noted in their own Dependencies field) but does not itself block any later phase's *start*, only its own feature's *completeness* by launch. This is the roadmap's primary lever for schedule compression: parallelizing these phases against the critical path, per the next section, is where real calendar time is saved.

---

# Parallel Development Opportunities

With a team of more than one full-stack engineer, the following phases can run concurrently with the critical path, provided the team is split accordingly and each parallel track respects the same module-boundary discipline (15-engineering-standards.md Section 6) the critical path itself depends on:

| Can Run In Parallel With | Phase(s) | Rationale |
|---|---|---|
| Phase 4 (Creator Module) | Phase 5 (Marketplace)'s taxonomy/seed-data work | Category/taxonomy data entry has no dependency on Creator/Store code being complete, only on Phase 1's schema existing |
| Phase 6 (Product Management) | Phase 2's remaining polish, Phase 5's storefront-page UI | Once Phase 4 is done, a second engineering track can build Product's backend while a frontend-focused track builds out browsing UI against Phase 6's evolving (but interface-stable, per 09-api-architecture.md's contract-first discipline) API |
| Phase 9 (Orders) | Phase 10 (Messaging) | Messaging's core infrastructure (Conversation/Message, Realtime) has no functional dependency on Orders being complete — only `OrderCommunication`'s linkage, a small, late-addable piece |
| Phase 9–11 | Phase 12 (Reviews) | Reviews' eligibility gate needs *a* completed Order to exist for testing, but its own module build can proceed in parallel once Phase 9's `OrderItem` schema (available since Phase 1) is stable |
| Phase 9–12 | Phase 13 (Analytics) | Analytics is inherently a downstream consumer (10-backend-architecture.md §5.22) — it can be built incrementally alongside any phase emitting events, provided its own module never becomes a dependency *for* those phases (that document's Section 2.4) |
| Phase 6, 14 | Phase 16 (Search) | Search's indexing pipeline can be built and tested against Phase 6's Product data as soon as that phase stabilizes, without waiting for Phases 7–13 |
| Throughout Phases 6–16 | Phase 15 (Admin Panel)'s non-Order/Payment slices | Moderation's Product/Review/Store case-handling UI, Support's ticketing, and CMS-adjacent Admin tooling can be built incrementally as their corresponding domain phases stabilize, rather than as one undifferentiated block starting only after Phase 14 |

**Recommended team structure for maximum parallelization** (illustrative, scaled to actual team size): one track owns the critical path (Phases 0–4, 6–9) without interruption; a second track begins Phase 5's taxonomy work during Phase 4, then Phase 10 (Messaging) once its own prerequisites clear, then rolls into Phase 15's incremental Admin/Moderation build-out; a third, frontend-leaning track owns Phase 2 fully, then supports UI build-out across every subsequent phase as each one's API stabilizes.

---

# Risk Matrix

Consolidated from every phase's own Risks table above, ranked by combined likelihood and impact — the roadmap-level view a founder or engineering lead should review before committing to a launch date.

| Risk | Phase(s) Affected | Likelihood | Impact | Mitigation Owner |
|---|---|---|---|---|
| Razorpay live-mode KYC/onboarding delay blocks Phase 8/20 | 0, 8, 20 | Medium | Critical | Start in Phase 0; track as the roadmap's single most important cross-phase dependency |
| Payment/Payout logic defect reaches production | 8, 9 | Low (given elevated rigor) | Critical | Mandatory second reviewer, Tier 1 release treatment from first deployment (16-cicd-release-management.md §14.2) |
| Product Management phase (6) scope overruns its estimate | 6 | Medium | High (delays entire remaining critical path) | Deliberate sub-feature sequencing (core CRUD first) within the phase, per that phase's own stated mitigation |
| Admin Panel phase (15) scope overruns, delaying security/testing/launch | 15 | Medium | High | Sequence by internal-team urgency within the phase; consider adding a second engineer to this phase specifically if team size allows |
| Late-stage security or comprehensive-testing pass (18–19) surfaces a deep, architectural finding | 18, 19 | Low–Medium | Critical | Explicit schedule buffer before Phase 20; any severe finding is a launch-blocking gate, never absorbed silently |
| Supabase Realtime reliability under real mobile/network conditions | 10 | Medium | Medium | Time-boxed early spike with a documented polling fallback |
| Retroactive integration phases (11, 13, 16) surface gaps in earlier phases' event emission | 11, 13, 16 | Medium | Low–Medium | Explicit audit pass at each retroactive phase's start, per those phases' own stated mitigations |
| Team velocity differs meaningfully from this roadmap's estimates | All phases | Medium | Medium | Estimates are explicitly stated as planning inputs (this document's header), recalibrated against real velocity after Phase 1 |

---

# Milestone Timeline

An illustrative timeline assuming a small (2–4 engineer), senior, full-stack-capable founding team, critical-path phases executed sequentially, and the parallel-development opportunities above applied wherever team size allows. Actual duration depends entirely on real team size and velocity, recalibrated after Phase 1 per this document's own header note.

| Milestone | Cumulative Timeframe | What's True at This Point |
|---|---|---|
| **Foundation Complete** | End of Phase 2 (~Week 6–8) | Repository, pipeline, and design system exist; no user-facing feature yet |
| **Identity & Marketplace Foundation** | End of Phase 5 (~Week 13–17) | A user can sign up, a creator can onboard and open a store, basic browsing exists |
| **Catalog Live** | End of Phase 6 (~Week 18–22) | Real products can be listed and viewed — the platform "looks like" a marketplace for the first time |
| **Commerce Loop Complete** | End of Phase 9 (~Week 27–34) | A buyer can complete a real, paid purchase end-to-end and a creator can fulfill it and get paid — the platform's core value proposition is technically provable, even if not yet feature-complete or launched |
| **Feature-Complete** | End of Phase 16 (~Week 38–47) | Every planned feature domain (Messaging, Notifications, Reviews, Analytics, CMS, Admin, Search) is implemented |
| **Launch-Ready** | End of Phase 19 (~Week 43–53) | Optimization, security hardening, and comprehensive testing are complete; the release-readiness checklist is fully satisfied |
| **Production Launch** | Phase 20 (~Week 44–54) | The platform is live to real users |

**The single widest-variance range in this timeline is the Commerce Loop Complete milestone** (Phases 7–9), given Phase 8's deliberately un-compressed, highest-rigor treatment — this is by design, not a scheduling inefficiency to optimize away.

---

# Release Strategy

## Internal Alpha
Following the Commerce Loop Complete milestone (end of Phase 9), the platform is usable end-to-end by the founding team and a small number of trusted internal testers against Staging — validating the core buyer/creator journey works before investing further in the remaining feature-breadth phases (10–16).

## Closed Beta
Following Feature-Complete (end of Phase 16) and a lighter-weight pass of Phases 17–18's most critical items, a small, invited cohort of real creators and buyers uses the platform in Production behind Phase 15's feature-flag infrastructure (16-cicd-release-management.md Section 15) — a genuine, real-stakes but deliberately scope-limited rollout, gathering real usage data ahead of full launch.

## General Availability
Following the complete Phase 17–20 sequence, the platform launches to its full intended audience — restated from Phase 20's own Definition of Done, gated on named Tier 1 sign-off and a gradual, monitored traffic ramp-up, never an abrupt full-scale cutover.

## Post-Launch Cadence
From General Availability onward, the platform operates under 16-cicd-release-management.md's full continuous-deployment model (that document's Section 2.2) — this roadmap's phase-based structure ends at launch; subsequent feature work is planned and prioritized through the team's ordinary product-roadmap process, governed day-to-day by that document and 19-operations-runbook.md rather than by this document's phase sequence.

---

# Future Phases

Beyond Phase 20, the following directions are named — consistent with every architecture document's own stated forward-looking sections (08-database-design.md Section 30, 09-api-architecture.md Section 28, 10-backend-architecture.md Section 27, 16-cicd-release-management.md Section 29) — as plausible, evidence-triggered next chapters, never committed to a specific post-launch date:

| Future Direction | Primary Owning Document(s) | Trigger Condition |
|---|---|---|
| AI-powered search and recommendations | 08-database-design.md §30, 10-backend-architecture.md §27.1 | Demonstrated need for semantic search beyond Postgres full-text's ranking sophistication |
| Meilisearch migration | 10-backend-architecture.md §14.5 | Catalog scale or ranking-sophistication requirements outgrow Postgres full-text search |
| Wholesale/B2B buyer support | 08-database-design.md §30, 10-backend-architecture.md §27.5 | Validated demand from creator studios or corporate gifting buyers |
| Subscriptions | 08-database-design.md §30, 10-backend-architecture.md §27.3 | Validated recurring-purchase demand pattern |
| Internationalization / multi-currency | 08-database-design.md §30, 09-api-architecture.md §28, 10-backend-architecture.md §27.4 | A confirmed decision to expand beyond the initial target market |
| Marketplace federation / white-label | 08-database-design.md §30, 10-backend-architecture.md §27.2 | A confirmed multi-instance or partner-marketplace business requirement |
| Public/partner API | 09-api-architecture.md §22.15, §28 | A confirmed third-party integration or partner-ecosystem business requirement |
| Microservice extraction (Payments/Search candidates) | 10-backend-architecture.md §22.6, §27.7 | Demonstrated scaling or team-coordination limits of the modular monolith — evaluated against evidence, never adopted preemptively |
| Progressive delivery tooling / canary releases | 16-cicd-release-management.md §29.2, §29.5 | Release volume/team size growth beyond what flag-gated rollout alone comfortably manages |

**Every item in this table is adopted only in response to a specific, evidenced trigger** — restated as this roadmap's own closing application of 15-engineering-standards.md Section 3.5's YAGNI principle: this platform's post-launch evolution is planned deliberately, one validated need at a time, never spec'd out and built ahead of demonstrated demand.

---

*This is the definitive implementation roadmap for Dreams by Kalakaaar v2. Every phase above traces back to a specific decision in the architecture series (00–20) this project has produced — nothing in this roadmap is invented independent of that series, and nothing in that series lacks a home in this roadmap's 21 phases. Where real execution reveals a gap between this plan and reality, this document is updated to reflect what was actually learned, exactly as this entire series has treated documentation throughout: the plan leads, but the plan is never more important than getting the platform right.*
