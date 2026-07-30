# 01 · Product Requirements Document — Dreams by Kalakaaar v2

**Document owner:** Product Management
**Status:** Draft for review
**Audience:** Product, Design, Engineering, QA, Marketing, Business, Support, Legal
**Companion document:** `00-project-vision.md`

---

# 1. Introduction

### 1.1 Purpose

This Product Requirements Document (PRD) translates the vision, principles, and goals defined in `00-project-vision.md` into a precise, actionable specification of what Dreams by Kalakaaar v2 must do. It defines every user-facing capability, business rule, state, and quality bar required to build, test, and launch the platform.

This document is written to be sufficiently detailed that:
- A **UX designer** can design every screen and flow without needing to guess intent.
- An **engineering team** can scope, estimate, and sequence work without needing additional product clarification.
- A **QA team** can derive test plans and edge cases directly from acceptance criteria.
- **Marketing, Business, and Support** teams can understand product behavior, constraints, and policy precisely enough to represent it externally.

### 1.2 Scope

This PRD covers the full v2 product surface area: the buyer-facing marketplace, the creator-facing selling tools, the internal admin/operations tools, and the platform-wide capabilities (search, messaging, notifications, payments, trust and safety) that connect them.

This PRD deliberately does **not** cover:
- Technology choices, system architecture, or infrastructure design.
- API contracts, data models, or database schema.
- Visual design specifications (colors, spacing, components) — these belong to a separate design system and screen-level design documentation.
- Detailed engineering implementation plans — these belong to subsequent technical design documents.

### 1.3 Objectives

1. Define every functional module required for a complete, premium, trustworthy handmade and personalized commerce experience.
2. Define precise, testable requirements and acceptance criteria for each module.
3. Define every user role and its permissions, restrictions, and goals.
4. Define the business rules that govern trust, payments, fulfillment, and content on the platform.
5. Define the states and transitions of the platform's core entities (orders, payments, accounts, etc.).
6. Define the non-functional bar (performance, accessibility, security, scalability) the product must meet.
7. Establish success metrics, risks, assumptions, and constraints so that trade-offs during build can be made consistently with product intent.
8. Clearly separate what is in scope for v2 from what is deliberately deferred.

### 1.4 References

| Document | Purpose |
|---|---|
| `00-project-vision.md` | Defines the product vision, mission, principles, target audience, brand, and success metrics that this PRD operationalizes. |

### 1.5 Definitions

See Section 16 (Glossary) for the full list. Key terms used throughout this document:

| Term | Definition |
|---|---|
| Creator / Kalakaar | An individual or small studio selling handmade or personalized products on the platform. |
| Buyer | A customer browsing or purchasing on the platform. |
| Storefront | A creator's branded page containing their catalog, story, and identity. |
| Listing | A single product published by a creator. |
| Order | A confirmed purchase transaction, which may contain items from one or more creators. |
| Sub-order | The portion of an order attributable to a single creator, tracked and fulfilled independently. |
| Customization | Buyer-provided input (text, image, choice) that personalizes a made-to-order product. |
| Verification | The process by which a creator's identity, authenticity, and quality are confirmed before or during selling. |
| Module | A cohesive functional area of the product (e.g., Search, Checkout, Messaging). |

---

# 2. Product Overview

### 2.1 High-Level Product Description

Dreams by Kalakaaar v2 is a curated, two-sided marketplace connecting independent creators of handmade and personalized products with buyers seeking meaningful, story-rich purchases — most commonly for gifting and milestone occasions. The platform provides creators with a premium storefront and selling toolkit, and provides buyers with a trustworthy, beautifully designed discovery and purchasing experience, including native support for product customization and made-to-order fulfillment.

### 2.2 Marketplace Overview

The marketplace operates as a **multi-vendor, order-aggregating platform**:

- Each creator operates an independent storefront within the marketplace, with their own brand presentation, catalog, and policies (within platform-wide guardrails).
- Buyers can purchase from multiple creators in a single checkout; the resulting order is split into **sub-orders**, one per creator, each fulfilled and tracked independently.
- The platform mediates trust (verification, reviews, dispute resolution), payments (collection and creator payout), and discovery (search, curation, recommendations) so that neither buyers nor creators need to manage these independently.
- Curation and verification distinguish the marketplace from open, self-serve platforms: creator onboarding includes an authenticity and quality review, and listings may be subject to review before or after publishing (see Section 7 for detailed rules).

### 2.3 Core Value Proposition

- **For buyers:** a curated, trustworthy destination to discover and buy meaningful handmade and personalized products, with a premium browsing and checkout experience purpose-built for gifting.
- **For creators:** a professional, low-friction platform to present their brand, manage made-to-order and stocked products, and grow a sustainable creative business.

### 2.4 Business Model Overview (High Level)

The platform generates revenue primarily through a **commission on completed sales**, with potential future complementary models (subscriptions, promoted placements, value-added creator services) evaluated separately from this PRD. Buyers are not charged platform fees directly beyond the listed product price, applicable shipping, and applicable taxes. Detailed pricing, commission rates, and monetization mechanics are defined in a separate business/finance specification and are out of scope for this document.

### 2.5 Primary User Journeys

| Journey | Primary Role | Summary |
|---|---|---|
| Discover and buy a gift | Buyer | Browse or search, find a meaningful product, optionally customize it, check out, track delivery. |
| Commission a custom product | Buyer | Find a creator offering customization, submit personalization details, communicate with the creator if needed, complete purchase, track production and delivery. |
| Join as a creator | Creator | Apply, complete identity and craft verification, set up storefront and first listings, go live. |
| Fulfill an order | Creator | Receive order notification, confirm/produce the item, update production status, ship, mark as fulfilled. |
| Resolve a post-purchase issue | Buyer, Creator, Support | Buyer raises an issue (missing item, defect, delay), creator responds, support intervenes if unresolved, resolution recorded. |
| Moderate platform content or trust issue | Admin, Moderator | Review flagged listing, review, or creator account; take action (approve, reject, suspend, escalate). |

---

# 3. User Roles

Every role below defines **purpose**, **permissions**, **restrictions**, and **primary goals**. Roles are additive in some cases (e.g., a Creator Team Member operates within a Creator account) and mutually exclusive in others (e.g., a single session is either Buyer-context or Admin-context).

### 3.1 Guest

**Purpose:** An unauthenticated visitor exploring the platform before creating an account.

| Aspect | Detail |
|---|---|
| Permissions | Browse homepage, categories, collections, search, view product detail pages, view creator storefronts, view public reviews, add items to a session-based cart, initiate account creation or sign-in. |
| Restrictions | Cannot check out without authenticating or providing guest checkout details (see Section 7.14). Cannot save a wishlist beyond the current session. Cannot message creators. Cannot leave reviews. Cannot access any account, order, or dashboard functionality. |
| Primary Goals | Evaluate whether the platform has relevant products before committing to an account; complete a purchase with minimal friction. |

### 3.2 Buyer

**Purpose:** A registered user who browses, purchases, and manages their own orders and account.

| Aspect | Detail |
|---|---|
| Permissions | Everything a Guest can do, plus: maintain a persistent wishlist and cart, complete checkout, view and track order history, manage saved addresses and payment methods, message creators regarding their own orders, submit reviews for purchased items, raise support tickets and disputes, manage notification and communication preferences, delete or export their own account data. |
| Restrictions | Cannot access any creator, admin, moderator, or support tooling. Cannot view other buyers' orders, messages, or personal data. Cannot review a product without a verified purchase (see Section 7). |
| Primary Goals | Find and buy meaningful products with confidence; track and manage orders; communicate with creators when needed; resolve issues quickly. |

### 3.3 Creator (Kalakaar)

**Purpose:** A verified individual or studio owner who sells products on the platform.

| Aspect | Detail |
|---|---|
| Permissions | Apply for and manage a storefront, create/edit/publish/unpublish listings, manage inventory and customization options, receive and manage orders and sub-orders, communicate with buyers regarding their orders, view their own sales analytics and payout history, manage store policies (within platform guardrails), invite and manage Creator Team Members, respond to reviews, participate in eligible promotions/coupons. |
| Restrictions | Cannot access another creator's storefront management, orders, analytics, or payout data. Cannot bypass platform-mandated policies (e.g., minimum disclosure requirements, prohibited categories). Cannot directly modify buyer accounts or personal data beyond what is necessary to fulfill an order. Subject to suspension or removal for policy violations (see Section 7). |
| Primary Goals | Present their brand professionally; get discovered by the right buyers; manage orders and customization efficiently; grow sales sustainably. |

### 3.4 Creator Team Member

**Purpose:** An individual granted limited access to a Creator's storefront to help operate the business (relevant for Small Creative Studios, see `00-project-vision.md` Section 8.1).

| Aspect | Detail |
|---|---|
| Permissions | Subset of Creator permissions, scoped by role assigned by the Creator (e.g., Catalog Manager, Order Manager, Support Responder). Exact permission sets are configurable within predefined role templates. |
| Restrictions | Cannot invite or remove other team members unless explicitly granted that permission. Cannot access payout or financial settings unless explicitly granted. Cannot delete the storefront or the owning Creator account. All actions are attributable and auditable back to the individual team member. |
| Primary Goals | Perform delegated day-to-day operational tasks (order fulfillment, catalog updates, buyer communication) efficiently without needing full account access. |

### 3.5 Admin

**Purpose:** An internal platform operator responsible for day-to-day marketplace operations across creators, buyers, and content.

| Aspect | Detail |
|---|---|
| Permissions | Review and approve/reject creator applications, review and moderate listings, manage categories and collections, manage platform-wide coupons and promotions, view aggregate and per-entity analytics, manage CMS content, configure platform settings, issue refunds within policy, suspend or reinstate accounts, escalate to Super Admin where required. |
| Restrictions | Cannot modify financial/payout configuration or platform-wide policy without Super Admin approval. Cannot access raw payment credential data. All sensitive actions are logged and auditable. |
| Primary Goals | Keep the marketplace healthy, trustworthy, and compliant; resolve operational issues efficiently. |

### 3.6 Moderator

**Purpose:** An internal role focused specifically on trust, safety, and content quality.

| Aspect | Detail |
|---|---|
| Permissions | Review flagged listings, reviews, messages (in dispute context), and creator profiles; approve, reject, or escalate content; issue warnings; recommend suspension. |
| Restrictions | Cannot directly suspend or terminate accounts without Admin/Super Admin action (configurable by severity threshold — see Section 7.19). Cannot access payment or payout data. Cannot modify platform-wide settings, coupons, or CMS content. |
| Primary Goals | Maintain authenticity, quality, and safety standards across all public content and listings. |

### 3.7 Support Executive

**Purpose:** An internal role focused on resolving buyer and creator support issues.

| Aspect | Detail |
|---|---|
| Permissions | View and respond to support tickets, view order and account details necessary to resolve a ticket (scoped access), issue refunds or credits within defined policy limits, escalate unresolved or high-severity issues to Admin. |
| Restrictions | Cannot modify listings, storefronts, or platform settings. Cannot issue refunds beyond policy-defined limits without escalation. Cannot access another support executive's internal notes attribution or performance data (that is a Support Lead/Admin function, out of scope for this document). |
| Primary Goals | Resolve buyer and creator issues quickly, fairly, and consistently with platform policy. |

### 3.8 Super Admin

**Purpose:** The highest level of internal platform control, reserved for a small number of trusted operators (typically founding/leadership team).

| Aspect | Detail |
|---|---|
| Permissions | All Admin permissions, plus: manage platform-wide policy and configuration, manage commission and payout structures, manage role assignments for all internal roles, access full audit logs, perform irreversible actions (permanent account termination, financial adjustments outside standard policy). |
| Restrictions | Actions at this level should require secondary confirmation and are fully audited given their sensitivity and irreversibility. |
| Primary Goals | Ensure the platform's overall integrity, policy consistency, and financial and legal compliance. |

---

# 4. Functional Modules

Each module below defines **purpose**, **business value**, **users involved**, **dependencies**, and **future expansion**. Detailed functional requirements for each module follow in Section 5.

### 4.1 Authentication & Account

| Aspect | Detail |
|---|---|
| Purpose | Allow users to securely create an account, sign in, manage credentials, and manage their profile across Buyer and Creator contexts. |
| Business Value | Establishes trust and personalization; a secure, low-friction auth experience directly affects conversion and retention. |
| Users Involved | Guest, Buyer, Creator, Creator Team Member, Admin, Moderator, Support Executive, Super Admin. |
| Dependencies | Notification module (verification emails/SMS), Legal module (consent to terms). |
| Future Expansion | Social sign-on expansion, biometric sign-in on supported devices, single sign-on for enterprise/B2B accounts. |

### 4.2 Homepage

| Aspect | Detail |
|---|---|
| Purpose | Serve as the primary entry point, orienting buyers toward relevant discovery paths (curated collections, categories, trending creators). |
| Business Value | Drives initial engagement and sets the premium brand tone; a strong homepage materially affects bounce rate and discovery depth. |
| Users Involved | Guest, Buyer. |
| Dependencies | CMS (editorial content), Search & Discovery, Collections, Categories, Analytics (personalization signals). |
| Future Expansion | AI-personalized homepage layouts, dynamic occasion-based curation (e.g., upcoming festivals). |

### 4.3 Search & Discovery

| Aspect | Detail |
|---|---|
| Purpose | Let buyers find relevant products and creators quickly, through query search, filters, and guided discovery. |
| Business Value | Core driver of conversion; poor search directly causes buyer drop-off and undermines the "curated, trustworthy" positioning. |
| Users Involved | Guest, Buyer. |
| Dependencies | Categories, Product Detail data, Creator Storefront data, Analytics (relevance signals). |
| Future Expansion | AI-powered semantic and visual search, natural-language gifting assistant (see `00-project-vision.md` Section 25). |

### 4.4 Categories

| Aspect | Detail |
|---|---|
| Purpose | Organize the catalog into a browsable taxonomy (e.g., Home Décor, Jewelry, Apparel, Art). |
| Business Value | Supports structured discovery for buyers who browse rather than search; supports catalog organization for creators and admins. |
| Users Involved | Guest, Buyer, Creator, Admin. |
| Dependencies | Product Detail, Admin taxonomy management. |
| Future Expansion | Localized/regional category variants, dynamic seasonal categories. |

### 4.5 Collections

| Aspect | Detail |
|---|---|
| Purpose | Present editorially curated groupings of products (e.g., "Wedding Gifts," "Under ₹2,000," "Meet the Maker: [Creator]"). |
| Business Value | Reinforces curation and premium brand positioning; supports merchandising and campaign-driven discovery. |
| Users Involved | Guest, Buyer, Admin (curation), Creator (inclusion visibility only). |
| Dependencies | CMS, Product Detail, Categories. |
| Future Expansion | AI-assisted collection generation, buyer-created/shareable collections. |

### 4.6 Product Detail

| Aspect | Detail |
|---|---|
| Purpose | Present a single listing in full detail — imagery, description, price, customization options, creator information, reviews, and availability. |
| Business Value | The primary conversion surface of the platform; must clearly communicate authenticity, craftsmanship, and trust. |
| Users Involved | Guest, Buyer, Creator (as owner/editor). |
| Dependencies | Creator Storefront, Customization, Reviews, Wishlist, Cart, Inventory. |
| Future Expansion | AR/3D product preview (see `00-project-vision.md` Section 26), AI-generated descriptions (creator-assist). |

### 4.7 Creator Storefront

| Aspect | Detail |
|---|---|
| Purpose | Present a creator's brand, story, and full catalog as a cohesive, branded page. |
| Business Value | Central to the platform's differentiation from generic marketplaces; builds buyer trust and creator brand equity. |
| Users Involved | Guest, Buyer, Creator (as owner/editor), Admin/Moderator (review). |
| Dependencies | Product Detail, Reviews, Messaging, Creator Dashboard. |
| Future Expansion | Storefront customization themes, creator-hosted events/launches. |

### 4.8 Wishlist

| Aspect | Detail |
|---|---|
| Purpose | Let buyers save products of interest for later consideration or gifting planning. |
| Business Value | Increases return visits and conversion over time; provides signal for personalization. |
| Users Involved | Guest (session-only), Buyer (persistent). |
| Dependencies | Authentication (persistence), Product Detail, Notifications (price/availability alerts). |
| Future Expansion | Shareable wishlists (precursor to Gift Registry, see `00-project-vision.md` Section 26). |

### 4.9 Cart

| Aspect | Detail |
|---|---|
| Purpose | Hold selected items (including customization selections) prior to checkout, potentially spanning multiple creators. |
| Business Value | Directly impacts conversion; must handle multi-creator complexity without confusing the buyer. |
| Users Involved | Guest (session-only), Buyer (persistent). |
| Dependencies | Product Detail, Customization, Inventory, Checkout. |
| Future Expansion | Save-for-later within cart, cross-device cart sync improvements. |

### 4.10 Checkout

| Aspect | Detail |
|---|---|
| Purpose | Guide the buyer through address, shipping, payment, and order confirmation in a fast, trustworthy flow. |
| Business Value | The single highest-leverage conversion surface on the platform; friction here directly costs revenue. |
| Users Involved | Guest (guest checkout), Buyer. |
| Dependencies | Cart, Payments, Shipping, Orders, Coupons. |
| Future Expansion | One-click/express checkout, saved gifting profiles. |

### 4.11 Payments

| Aspect | Detail |
|---|---|
| Purpose | Securely collect buyer payment and manage creator payouts. |
| Business Value | Foundational to trust and legal compliance; payment failures or insecurity directly threaten the business. |
| Users Involved | Buyer, Creator (payout side), Admin/Support (dispute handling), Super Admin (policy configuration). |
| Dependencies | Checkout, Orders, Refunds. |
| Future Expansion | Multiple currencies, buy-now-pay-later options, creator financing (flagged as future in vision doc). |

### 4.12 Orders

| Aspect | Detail |
|---|---|
| Purpose | Represent and track the full lifecycle of a purchase, from confirmation through fulfillment to completion. |
| Business Value | Central operational record for both buyer trust and creator accountability. |
| Users Involved | Buyer, Creator, Support, Admin. |
| Dependencies | Checkout, Payments, Shipping, Customization, Messaging. |
| Future Expansion | Multi-stage production tracking for complex custom orders, subscription-based recurring orders. |

### 4.13 Shipping & Fulfillment

| Aspect | Detail |
|---|---|
| Purpose | Define how creators fulfill and ship orders, and how buyers track delivery. |
| Business Value | Directly affects buyer trust and satisfaction, especially for gifting/time-sensitive purchases. |
| Users Involved | Creator, Buyer, Support. |
| Dependencies | Orders, Notifications. |
| Future Expansion | Platform-negotiated shipping rates, integrated multi-carrier tracking, international shipping expansion. |

### 4.14 Customization & Personalization

| Aspect | Detail |
|---|---|
| Purpose | Let buyers provide personalization input (text, image, choice, measurements) for made-to-order products. |
| Business Value | A core differentiator versus generic marketplaces; directly enables the platform's gifting/personalization value proposition. |
| Users Involved | Buyer, Creator. |
| Dependencies | Product Detail, Cart, Orders, Messaging (clarification requests). |
| Future Expansion | AI-assisted customization preview, guided design tools. |

### 4.15 Reviews & Ratings

| Aspect | Detail |
|---|---|
| Purpose | Let buyers rate and review purchased products and their experience with a creator. |
| Business Value | Core trust signal for future buyers; also a feedback loop for creators and platform quality control. |
| Users Involved | Buyer (author), Creator (respondent), Guest/Buyer (readers), Moderator (moderation). |
| Dependencies | Orders (verified purchase requirement), Moderation. |
| Future Expansion | Photo/video reviews, verified "gift recipient" reviews. |

### 4.16 Messaging

| Aspect | Detail |
|---|---|
| Purpose | Enable structured, order-contextual communication between buyers and creators. |
| Business Value | Essential for customization clarification and issue resolution; reduces reliance on off-platform channels, preserving trust and auditability. |
| Users Involved | Buyer, Creator, Creator Team Member, Support (dispute context). |
| Dependencies | Orders, Notifications, Moderation (abuse handling). |
| Future Expansion | Rich media messages, AI-drafted response suggestions for creators. |

### 4.17 Notifications

| Aspect | Detail |
|---|---|
| Purpose | Inform users of relevant events (order updates, messages, price drops, account activity) across appropriate channels. |
| Business Value | Drives re-engagement and operational transparency; reduces support burden by keeping users proactively informed. |
| Users Involved | All roles. |
| Dependencies | Orders, Messaging, Wishlist, Payments, Support. |
| Future Expansion | Granular per-category notification preferences, push notifications via future native apps. |

### 4.18 Creator Dashboard

| Aspect | Detail |
|---|---|
| Purpose | Central hub for creators to manage their storefront, listings, orders, and performance. |
| Business Value | Directly determines creator satisfaction and retention; a poor dashboard experience undermines "creator empowerment" as a core value. |
| Users Involved | Creator, Creator Team Member. |
| Dependencies | Inventory, Orders, Analytics, Messaging, Payments. |
| Future Expansion | Advanced business tooling (marketing, forecasting) per `00-project-vision.md` Section 26 (Creator Tools). |

### 4.19 Inventory Management

| Aspect | Detail |
|---|---|
| Purpose | Track stock levels for stocked products and production capacity/lead time for made-to-order products. |
| Business Value | Prevents overselling and broken buyer promises; critical to trust for both stocked and custom goods. |
| Users Involved | Creator, Creator Team Member. |
| Dependencies | Product Detail, Cart, Orders. |
| Future Expansion | Demand forecasting assistance, low-stock automation. |

### 4.20 Analytics & Reporting

| Aspect | Detail |
|---|---|
| Purpose | Provide creators and internal teams with visibility into performance (sales, traffic, conversion, satisfaction). |
| Business Value | Enables data-informed decisions for creators (what to make more of) and the platform (what to promote, fix, or investigate). |
| Users Involved | Creator, Admin, Super Admin. |
| Dependencies | Orders, Product Detail, Reviews, Search. |
| Future Expansion | Predictive analytics, benchmarking against category peers. |

### 4.21 Coupons & Promotions

| Aspect | Detail |
|---|---|
| Purpose | Enable discount and promotional mechanisms at the platform and creator level. |
| Business Value | Drives acquisition and conversion campaigns while requiring careful guardrails to protect creator margins and brand positioning. |
| Users Involved | Buyer, Creator, Admin, Super Admin. |
| Dependencies | Cart, Checkout, Orders. |
| Future Expansion | Loyalty-linked promotions (see `00-project-vision.md` Section 26). |

### 4.22 Admin Dashboard

| Aspect | Detail |
|---|---|
| Purpose | Central operational console for Admin, Moderator, Support Executive, and Super Admin roles. |
| Business Value | Enables efficient, consistent marketplace operations at scale. |
| Users Involved | Admin, Moderator, Support Executive, Super Admin. |
| Dependencies | All other modules (read/moderate/manage access as scoped per role). |
| Future Expansion | Workflow automation, advanced fraud-detection tooling. |

### 4.23 CMS & Content

| Aspect | Detail |
|---|---|
| Purpose | Manage editorial and marketing content (homepage features, collections, brand storytelling, legal pages). |
| Business Value | Supports brand voice and merchandising without requiring engineering involvement for routine content changes. |
| Users Involved | Admin, Super Admin. |
| Dependencies | Homepage, Collections, Legal. |
| Future Expansion | Localization workflows, creator-authored editorial content. |

### 4.24 Settings

| Aspect | Detail |
|---|---|
| Purpose | Let users (buyers, creators, internal roles) configure account, notification, privacy, and storefront settings. |
| Business Value | Supports user control, trust, and regulatory compliance (privacy preferences, communication consent). |
| Users Involved | All roles. |
| Dependencies | Authentication, Notifications, Legal. |
| Future Expansion | Granular privacy controls aligned with expanding regulatory requirements across markets. |

### 4.25 Support

| Aspect | Detail |
|---|---|
| Purpose | Provide buyers and creators a structured way to raise, track, and resolve issues. |
| Business Value | Directly affects trust and retention; especially critical given the higher support complexity of made-to-order commerce. |
| Users Involved | Buyer, Creator, Support Executive, Admin. |
| Dependencies | Orders, Payments, Messaging, Notifications. |
| Future Expansion | AI-assisted support triage and response drafting (see `00-project-vision.md` Section 25). |

### 4.26 Legal & Compliance

| Aspect | Detail |
|---|---|
| Purpose | Present and manage legally required content and consent (terms of service, privacy policy, seller agreements, refund policy). |
| Business Value | Reduces legal and regulatory risk; establishes clear, enforceable terms for all parties. |
| Users Involved | All roles (as consumers of legal content), Super Admin (as manager). |
| Dependencies | CMS, Authentication (consent capture). |
| Future Expansion | Region-specific legal variants as the platform expands geographically. |

---

# 5. Functional Requirements

Requirement IDs are prefixed per module for traceability. Priority follows MoSCoW (**Must**, **Should**, **Could**).

### 5.1 Authentication & Account

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| AUTH-01 | Users can create an account using email and password. | Must | Baseline access mechanism required for any persistent functionality. | Account is created only after email format validation and password strength requirements are met; confirmation is sent to the user. | Notifications | Duplicate email attempts must be rejected with a clear, non-enumerating message that does not confirm whether the email is already registered. |
| AUTH-02 | Users can verify their email address after registration. | Must | Confirms real ownership of the email, reduces fraud and undeliverable notifications. | A verification link/code is sent on registration; unverified accounts have restricted functionality (e.g., cannot check out) until verified. | Notifications | Expired or already-used verification links must show a clear message with an option to resend. |
| AUTH-03 | Users can sign in with verified credentials. | Must | Core access requirement. | Correct credentials grant access; incorrect credentials show a generic error without revealing which field was wrong. | — | Repeated failed attempts must trigger progressive rate limiting/lockout to prevent brute-force attacks. |
| AUTH-04 | Users can reset a forgotten password. | Must | Prevents account lockout support burden; standard trust expectation. | A reset link is sent to the registered email/phone; link expires after a defined window; password cannot be reset to the same previous value without re-authentication context. | Notifications | Reset requests for non-existent accounts must not reveal account existence. |
| AUTH-05 | Users can sign in using supported third-party identity providers. | Should | Reduces friction for account creation and sign-in. | Third-party sign-in creates or links to an existing account matched by verified email; user is informed which identity was used. | Notifications | If the third-party email differs from an existing account's email, the system must not silently merge accounts. |
| AUTH-06 | A single account can hold both a Buyer profile and a Creator profile. | Must | Many creators are also buyers; forcing separate accounts adds friction and fragments trust/history. | Users can apply to become a Creator from a Buyer account; both contexts remain accessible via a clear context switch. | Creator onboarding | Suspension of the Creator profile must not automatically suspend the Buyer profile, and vice versa, unless the underlying violation applies to both. |
| AUTH-07 | Users can permanently delete their account. | Must | Regulatory requirement (data subject rights) and baseline user trust expectation. | Deletion request is confirmed via a secondary step; personal data is removed or anonymized per policy while preserving legally required transactional records. | Legal, Orders | Deletion must be blocked or deferred while an active order, dispute, or payout is pending, with a clear explanation to the user. |
| AUTH-08 | Internal roles (Admin, Moderator, Support Executive, Super Admin) authenticate through a separate, more restrictive access path. | Must | Prevents privilege escalation risk and separates internal tooling from consumer-facing auth surface. | Internal accounts require elevated verification (e.g., mandatory strong authentication); access is scoped per role from first login. | — | A former employee's access must be fully revocable immediately upon offboarding. |

### 5.2 Homepage

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| HOME-01 | The homepage displays curated collections and featured creators. | Must | Establishes premium, editorial tone and supports discovery for undecided buyers. | Homepage renders configured collections/featured creators from CMS without requiring engineering changes to update content. | CMS, Collections | If a featured collection has no available products, it must not be shown. |
| HOME-02 | The homepage adapts content based on general context (e.g., new vs. returning visitor). | Should | Increases relevance and reduces bounce for repeat visitors. | Returning signed-in buyers see relevant sections (e.g., "Continue browsing," recently viewed) in addition to editorial content. | Analytics, Wishlist | New/guest users must still see a complete, non-empty homepage experience. |
| HOME-03 | The homepage surfaces seasonal/occasion-based merchandising. | Should | Aligns with gifting-driven demand patterns identified in the vision document. | Admin can schedule occasion-based content (e.g., a festival collection) to appear and expire on defined dates without manual intervention at the boundary times. | CMS | Overlapping scheduled campaigns must have a defined priority/resolution rule rather than an undefined visual conflict. |

### 5.3 Search & Discovery

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| SRCH-01 | Users can search products and creators via a text query. | Must | Core discovery mechanism for buyers with purchase intent. | Search returns relevant results ranked by relevance; irrelevant/zero-result queries show a helpful empty state with suggestions. | Product Detail, Creator Storefront | Queries with typos or partial matches must still surface reasonably relevant results (fuzzy matching). |
| SRCH-02 | Users can filter search and category results by defined attributes (price range, category, customization availability, delivery timeframe, rating). | Must | Enables buyers to narrow large result sets efficiently. | Filters combine using AND logic within a category and update result counts live; filters can be cleared individually or entirely. | Categories, Product Detail | Filter combinations that yield zero results must clearly explain why and suggest removing a specific filter. |
| SRCH-03 | Users can sort results (relevance, newest, price, rating). | Must | Supports diverse buyer intent (e.g., budget-driven vs. quality-driven). | Selected sort persists across pagination within the same session/query. | — | Sort by rating must account for minimum review count to avoid a single 5-star review dominating results (see Section 7). |
| SRCH-04 | Search results and rankings exclude unverified, suspended, or rejected creators/listings. | Must | Protects buyer trust and platform authenticity standard. | Suspended/rejected content never appears in public search or browse surfaces, even if directly linked. | Admin, Creator Verification | A listing suspended mid-session must be removed from subsequent searches without requiring a full page reload cache clear elsewhere. |
| SRCH-05 | The platform logs search queries and result interactions to improve relevance over time. | Should | Enables ongoing relevance tuning and informs future AI-powered search (vision doc Section 25). | Search analytics are captured without storing personally identifying query data beyond what is needed for aggregate improvement, per privacy policy. | Analytics, Legal | Search logging must respect user opt-out preferences where applicable under privacy settings. |

### 5.4 Categories

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| CAT-01 | The platform defines a structured, hierarchical category taxonomy. | Must | Provides a consistent browsing structure and supports catalog organization. | Categories support at least two levels (e.g., Home Décor > Wall Art); every published listing belongs to at least one category. | Admin | A listing with no assigned category must not be publishable. |
| CAT-02 | Admin can create, edit, merge, and retire categories. | Must | Keeps taxonomy relevant as the catalog evolves. | Retiring a category requires reassignment or archival of affected listings; it cannot silently orphan active listings. | Admin Dashboard | Merging two categories must preserve all affected listings' visibility without manual re-tagging by creators. |
| CAT-03 | Category pages display all published listings within that category, subject to search/filter functionality (Section 5.3). | Must | Supports structured browsing as an alternative to search. | Category pages paginate and load performantly regardless of category size. | Search & Discovery | A category with zero published listings must show a clear "coming soon" or redirect experience, not a broken empty page. |

### 5.5 Collections

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| COLL-01 | Admin can create curated collections combining listings across categories and creators. | Must | Reinforces editorial curation, a core differentiator per the vision document. | Collections can be published, scheduled, and unpublished independently of the underlying listings' own status. | CMS, Product Detail | If a listing within a collection becomes unpublished, it must be automatically excluded from the collection's display without manual cleanup. |
| COLL-02 | Collections can be featured on the homepage, category pages, or as standalone landing pages. | Should | Increases merchandising flexibility for campaigns and seasonal moments. | Each collection has a shareable URL suitable for marketing use. | Homepage, Categories | Collections used in paid marketing campaigns must remain accessible even if temporarily unfeatured from organic placements. |

### 5.6 Product Detail

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| PDP-01 | A product detail page displays images, description, price, creator identity, customization options (if any), shipping/lead-time estimate, and reviews. | Must | Primary conversion surface; must give buyers full confidence to purchase. | All fields render even if optional fields (e.g., customization) are absent, without layout breakage. | Creator Storefront, Customization, Reviews, Inventory | A listing missing required fields (e.g., no images) must not be publishable (see Section 7). |
| PDP-02 | The product detail page reflects real-time availability (in stock, made-to-order with lead time, or sold out). | Must | Prevents buyers from purchasing unavailable items, a major trust risk. | Sold-out stocked items disable "Add to Cart" and offer a "notify me when available" option. | Inventory, Notifications | A race condition where the last unit is purchased by another buyer during checkout must be handled gracefully (see Section 7 and Section 8). |
| PDP-03 | The product detail page clearly discloses whether a product is handmade, made-to-order, or includes non-handmade components. | Must | Core authenticity promise of the platform; misrepresentation undermines the entire value proposition. | Disclosure labels are mandatory fields at listing creation and are displayed prominently, not buried. | Creator onboarding | A creator attempting to publish without completing disclosure fields must be blocked with a clear explanation. |
| PDP-04 | Buyers can view a creator's profile and other listings directly from the product detail page. | Must | Encourages storefront discovery and reinforces brand-led shopping. | A visible, prominent link/section connects to the full creator storefront. | Creator Storefront | — |
| PDP-05 | The product detail page supports multiple images and, where provided, a size/measurement guide. | Should | Reduces buyer uncertainty, particularly important for apparel, jewelry, and made-to-order goods. | At least one image is mandatory; measurement guide is optional but structured (not free text only) when provided. | — | Listings without a measurement guide in categories where it is typically expected should be flagged for creator guidance, not blocked. |

### 5.7 Creator Storefront

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| STORE-01 | Each creator has a branded storefront page including name, story, verification status, catalog, and aggregate rating. | Must | Central to brand-led differentiation from generic listing-based marketplaces. | Storefront is publicly viewable once the creator is verified and has at least one published listing. | Creator Verification, Product Detail, Reviews | An unverified or suspended creator's storefront must not be publicly accessible; direct links must show an appropriate message rather than an error. |
| STORE-02 | Creators can customize their storefront's story, profile imagery, and policies (within platform guardrails). | Must | Supports brand identity, a core value proposition for creators. | Changes are reflected on the public storefront after passing any required review (see Section 7). | CMS, Admin (review) | Storefront edits containing prohibited content must be blocked or flagged for review before publishing. |
| STORE-03 | The storefront displays a verified maker indicator. | Must | Core trust signal distinguishing genuine creators, per the brand promise. | The badge is only shown for creators who have completed the verification process (see Section 7). | Creator Verification | The badge must be automatically removed if verification is revoked. |

### 5.8 Wishlist

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| WISH-01 | Buyers can add or remove products from a persistent wishlist. | Must | Supports gifting-planning behavior and return engagement. | Wishlist persists across sessions and devices for signed-in buyers. | Authentication | Guests can wishlist within a session but are prompted to sign in to persist it; the session wishlist should transfer on sign-in without loss. |
| WISH-02 | Buyers are notified of significant changes to wishlisted items (price drop, back in stock, about to sell out). | Should | Drives re-engagement and conversion from passive interest. | Notifications respect the buyer's notification preferences (see Section 5.17). | Notifications, Inventory | A wishlisted item that becomes permanently unavailable (creator removed it) should update its wishlist state to reflect that clearly rather than leaving a dead link. |

### 5.9 Cart

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| CART-01 | Buyers can add products, including selected customization options, to a cart. | Must | Prerequisite for checkout. | Cart line items retain the exact customization selections made at add-time. | Product Detail, Customization | Changing a required customization option after adding to cart must prompt the buyer to review before checkout, not silently proceed with incomplete data. |
| CART-02 | The cart groups items by creator and shows shipping/lead-time estimates per creator group. | Must | Reflects the multi-vendor nature of orders and sets accurate delivery expectations. | Buyers can clearly see which items ship from which creator and on what estimated timeline. | Shipping, Inventory | If creators have significantly different lead times, the cart must not imply a single combined delivery date without clarification. |
| CART-03 | The cart validates item availability before proceeding to checkout. | Must | Prevents checkout failures and buyer frustration. | Unavailable items are flagged with a clear resolution path (remove, notify when available) before checkout can proceed. | Inventory | An item that sells out while sitting in the cart must be caught at the latest possible pre-payment checkpoint, not only at cart load time. |
| CART-04 | Cart persists across sessions for signed-in buyers. | Should | Reduces friction and supports the common "add now, decide later" buying pattern, especially relevant for gifting. | Cart contents are retained and restored on next sign-in on any device. | Authentication | Persisted cart items with since-changed prices must clearly show the buyer the updated price before checkout, not the stale price. |

### 5.10 Checkout

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| CHK-01 | Buyers can complete checkout by providing/selecting a shipping address, delivery preferences, and payment method. | Must | Core transaction flow. | Checkout completes in a minimal number of steps with clear progress indication; all required fields are validated inline. | Payments, Shipping | Address validation failures must give specific, actionable feedback (not a generic "invalid address" message). |
| CHK-02 | Guests can complete checkout without creating a full account, with an option to create one post-purchase. | Should | Reduces friction for first-time or one-off buyers (e.g., occasion-driven casual buyers per vision doc). | Guest checkout captures the minimum information required to fulfill and communicate about the order. | Authentication, Orders | A guest who later creates an account with the same email should be able to see/link their prior guest order (with appropriate verification). |
| CHK-03 | Checkout clearly itemizes price, shipping, taxes, discounts, and total before payment confirmation. | Must | Transparency requirement for trust and, in many jurisdictions, legal compliance. | No hidden fees are introduced at the final payment step that were not shown earlier in the flow. | Payments, Coupons | If tax or shipping cannot be finally calculated until address entry, the flow must clearly show an estimate earlier and the final figure before payment authorization. |
| CHK-04 | Buyers can add a gift note and choose gift packaging (where offered by the creator) during checkout. | Should | Directly supports the platform's core gifting use case. | Gift options, when selected, are clearly passed through to the relevant creator's sub-order. | Orders, Customization | Gift note content must be subject to basic abuse/spam screening (see Section 7.18) since it is read by the creator. |
| CHK-05 | Checkout supports orders spanning multiple creators as a single payment transaction split into sub-orders. | Must | Reflects the multi-vendor marketplace model while keeping the buyer experience simple (one checkout, one payment). | Buyer completes one payment; the system creates and tracks independent sub-orders per creator. | Orders, Payments | If one creator's portion of the order fails validation (e.g., item just sold out) after payment authorization but before capture, the flow must handle it without charging for the unavailable item (see Section 8). |

### 5.11 Payments

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| PAY-01 | The platform securely collects buyer payment via supported methods. | Must | Foundational transaction requirement and legal/compliance necessity. | No sensitive raw payment credentials are ever visible to or stored by internal roles beyond what compliance requires. | Checkout | Declined or failed payments must present a clear, actionable message and preserve the buyer's cart/order-in-progress state. |
| PAY-02 | The platform calculates and displays applicable taxes based on buyer location and product/creator jurisdiction rules. | Must | Legal requirement; incorrect tax handling creates compliance risk. | Tax calculation is consistent and auditable per order. | Checkout, Legal | Tax-exempt scenarios (where applicable) must be supported without manual workaround by support staff. |
| PAY-03 | The platform holds buyer payment and releases payout to creators according to a defined payout schedule and policy. | Must | Protects buyers (recourse before fulfillment is confirmed) and gives creators a predictable payout cadence. | Payout timing and conditions (e.g., post-delivery-confirmation) are clearly documented and consistently applied. | Orders, Shipping | Disputed orders must have payout held or reversible until resolution (see Section 7). |
| PAY-04 | Creators can view their payout history and upcoming scheduled payouts. | Must | Financial transparency is essential to creator trust and retention. | Payout records reconcile clearly against completed orders and any deductions (commission, refunds). | Creator Dashboard | A payout affected by a later refund/dispute must show a clear, traceable adjustment, not an unexplained discrepancy. |
| PAY-05 | The platform supports full and partial refunds to the original payment method. | Must | Necessary for returns, cancellations, and dispute resolution (see Section 7). | Refunds are traceable to a specific order/sub-order and reason code. | Orders, Support | Refunds after a payout has already been released to the creator must trigger a defined reconciliation process rather than an unrecoverable loss. |

### 5.12 Orders

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| ORD-01 | Buyers can view a full history of past and current orders, including sub-orders per creator. | Must | Core post-purchase trust and self-service requirement. | Each sub-order shows independent status, items, price, and tracking where applicable. | Checkout, Shipping | A cancelled sub-order within a larger order must not make the entire order appear cancelled. |
| ORD-02 | Creators can view and manage incoming orders relevant to their storefront only. | Must | Operational necessity for fulfillment; also a data-isolation/security requirement. | Creators see only their own sub-orders, never another creator's data within a shared order. | Creator Dashboard | — |
| ORD-03 | Orders progress through clearly defined states visible to both buyer and creator (see Section 8). | Must | Sets accurate expectations and reduces support burden through transparency. | State changes are timestamped and reflected in both buyer and creator views without delay. | Notifications | A state regression (e.g., "Shipped" reverting to "Processing") must require a specific, logged justification, not be silently possible. |
| ORD-04 | Buyers can request cancellation of an order or sub-order, subject to defined policy windows (see Section 7). | Must | Necessary safety valve for buyer confidence, especially relevant to made-to-order timing sensitivity. | Cancellation eligibility is clearly shown based on current order state; ineligible cancellation attempts explain why. | Business Rules (7.2), Payments | A cancellation requested at the exact moment a creator marks an item as shipped must be resolved by a clear precedence rule (see Section 7). |
| ORD-05 | Orders support gift-specific metadata (gift note, recipient name if different from buyer) without altering the buyer's own account/shipping identity. | Should | Supports the platform's core gifting use case cleanly. | Gift metadata flows through to the creator's fulfillment view without exposing full buyer payment details unnecessarily. | Checkout, Customization | — |

### 5.13 Shipping & Fulfillment

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| SHIP-01 | Creators define shipping options and estimated timelines per listing or storefront-wide default. | Must | Made-to-order timelines vary significantly by creator/craft; a single platform-wide default would be inaccurate and erode trust. | Estimated timelines are shown to buyers pre-purchase and are honored/tracked post-purchase. | Product Detail, Orders | A creator who repeatedly misses stated timelines should be flagged for review (see Section 7). |
| SHIP-02 | Creators can mark a sub-order as shipped and provide tracking information where available. | Must | Enables buyer tracking and triggers downstream notification and payout timing logic. | Marking as shipped is only possible from a valid preceding state (see Section 8) and requires at minimum a shipped timestamp. | Orders, Notifications | Marking as shipped without valid tracking (where tracking is claimed) should be flagged if later disputed. |
| SHIP-03 | Buyers can track the delivery status of each sub-order. | Must | Core trust and transparency requirement, especially for time-sensitive gifts. | Tracking information, when available, is displayed in a consistent format regardless of shipping carrier. | Orders | If a carrier's tracking data is temporarily unavailable, the buyer must see a clear "tracking pending update" state, not a broken/empty view. |
| SHIP-04 | The platform defines a process for delayed, lost, or damaged shipments. | Must | Directly affects buyer trust; a documented process reduces ad hoc, inconsistent resolutions. | Buyers can report a shipping issue directly from the order, initiating a defined support/resolution flow. | Support, Refunds | Repeated shipping issues tied to a specific creator must be visible to Admin for pattern detection. |

### 5.14 Customization & Personalization

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| CUST-01 | Creators can define customization options per listing (text input, image upload, single/multi-select choices, measurements). | Must | Core differentiator of the platform; must support diverse craft types. | Customization fields can be marked required or optional; required fields block add-to-cart until completed. | Product Detail, Cart | A listing with no customization options must simply not display the customization section, rather than an empty one. |
| CUST-02 | Buyers provide customization input at the time of adding to cart or during checkout. | Must | Ensures the creator receives complete personalization details with the order. | Customization data is preserved unmodified from cart through to the creator's order view. | Cart, Orders | Uploaded customization images must be validated for basic format/size constraints and screened for prohibited content (see Section 7.18). |
| CUST-03 | Creators can request clarification from a buyer regarding submitted customization details. | Should | Reduces production errors and buyer dissatisfaction from misunderstood requests. | Clarification requests use the Messaging module and are tied to the specific order. | Messaging, Orders | An order awaiting buyer clarification must not silently continue toward a production/shipping deadline without a clear "waiting on buyer" state (see Section 8). |
| CUST-04 | Buyers can preview a summary of their customization selections before final purchase confirmation. | Must | Reduces order errors and post-purchase disputes. | The order confirmation screen and confirmation notification both restate the customization details exactly as submitted. | Checkout, Notifications | — |

### 5.15 Reviews & Ratings

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| REV-01 | Only buyers with a verified completed purchase can review a product. | Must | Prevents fake/incentivized reviews, protecting the platform's core authenticity promise. | Review submission is only available from a completed order's item, and only once per purchased item. | Orders | A buyer who purchases the same product twice may be allowed to leave a review per distinct order, not per product, per policy (see Section 7). |
| REV-02 | Reviews include a star rating and optional written feedback. | Must | Supports both quick-scan and detailed trust signals for future buyers. | Star rating is mandatory; written feedback is optional but subject to moderation if provided. | Moderation | Empty or non-substantive written feedback must still be permitted (rating alone is a valid review). |
| REV-03 | Creators can publicly respond to reviews on their storefront. | Should | Allows creators to address feedback transparently, reinforcing trust and accountability. | One response per review; response is publicly visible alongside the original review. | Creator Storefront | Abusive creator responses are subject to the same moderation rules as any other public content (see Section 7.19). |
| REV-04 | Reviews can be flagged for moderation by users or automatically by abuse-detection rules. | Must | Protects platform integrity from spam, abuse, or retaliatory reviews. | Flagged reviews are hidden from public view pending Moderator decision if flagged with sufficient severity/volume. | Moderation | A creator must not be able to unilaterally remove a negative review by flagging it themselves without independent moderation review. |

### 5.16 Messaging

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| MSG-01 | Buyers and creators can exchange messages tied to a specific order or pre-purchase product inquiry. | Must | Essential for customization clarification and general trust-building communication. | Messages are threaded per order/inquiry context, not a single undifferentiated inbox. | Orders, Product Detail | A buyer must not be able to message a creator with no relationship to an order or a legitimate pre-purchase inquiry, to prevent spam/abuse. |
| MSG-02 | Messages support text and image attachments. | Should | Necessary for customization clarity (e.g., sharing reference images). | Attachments are validated for size/format and screened per content policy. | Customization | — |
| MSG-03 | Messages are retained and accessible as part of the order record for support/dispute purposes. | Must | Necessary for fair, evidence-based dispute resolution. | Support and Admin roles can access relevant message threads when handling an escalated dispute, scoped to that specific order. | Support | Message access by internal roles outside of an active support/dispute context must not be permitted, to protect user privacy. |
| MSG-04 | The platform detects and restricts attempts to share off-platform contact information intended to bypass the platform (see Section 7.18). | Should | Protects platform trust, payment security, and dispute-resolution capability. | Detected attempts are flagged; repeated violations escalate per policy. | Moderation | Legitimate mentions (e.g., a creator's publicly known brand name) must not be over-flagged; detection should target actionable contact-sharing patterns. |

### 5.17 Notifications

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| NOTIF-01 | Users receive notifications for critical account and order events (verification, order confirmation, status changes, messages, disputes). | Must | Keeps users informed without requiring active polling; reduces support burden. | Critical notifications (e.g., order confirmation, security alerts) are always sent regardless of preference settings. | Orders, Messaging, Authentication | — |
| NOTIF-02 | Users can configure preferences for non-critical notification categories (marketing, wishlist alerts, recommendations). | Must | Respects user control and supports regulatory consent requirements. | Preference changes take effect immediately for future notifications. | Settings | Users who opt out of all non-critical notifications must still receive critical/legal/security notifications. |
| NOTIF-03 | Notifications are delivered via appropriate channels (email at minimum; SMS/push where applicable and consented). | Must | Ensures timely delivery across varying user channel preferences. | Channel selection respects both technical availability and user consent. | Settings | Failed delivery on one channel should not silently fail without any record; a fallback or logged failure is required. |

### 5.18 Creator Dashboard

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| CDASH-01 | Creators have a single dashboard summarizing pending actions (new orders, messages needing response, low stock, pending clarifications). | Must | Reduces operational overhead and missed actions, directly supporting creator success (a core business goal). | Dashboard surfaces time-sensitive items prominently (e.g., orders nearing a fulfillment deadline). | Orders, Messaging, Inventory | An empty/new creator's dashboard must show clear onboarding guidance rather than a blank state. |
| CDASH-02 | Creators can manage their full listing catalog (create, edit, publish, unpublish, archive) from the dashboard. | Must | Core operational necessity for running a storefront. | Unpublishing a listing removes it from public discovery immediately while preserving it in the creator's own catalog view. | Product Detail | Archiving a listing that has open orders referencing it must not break historical order records. |
| CDASH-03 | Creators can manage Creator Team Member access from the dashboard. | Should | Supports Small Creative Studio segment (per vision doc). | Owner can invite, adjust role, and revoke access; revoked members lose access immediately. | Authentication | A removed team member's past actions must remain attributed to them in the audit trail even after removal. |

### 5.19 Inventory Management

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| INV-01 | Creators can set and update stock quantities for stocked (non-made-to-order) products. | Must | Prevents overselling. | Stock decrements automatically and atomically upon order confirmation. | Orders | Two near-simultaneous purchases of the last unit must be resolved so only one succeeds; the other is handled per Section 8 cart/checkout edge case rules. |
| INV-02 | Creators can set production capacity or lead time for made-to-order products (e.g., maximum concurrent orders, days to produce). | Must | Prevents creators from being overwhelmed and buyers from receiving unrealistic timelines. | Once capacity is reached, the listing reflects a longer lead time or temporary unavailability rather than allowing unlimited orders. | Product Detail | A sudden surge in orders (e.g., viral moment) must degrade gracefully into an accurate longer lead-time estimate, not an inconsistent or broken state. |
| INV-03 | The platform notifies creators of low stock or approaching production capacity limits. | Should | Helps creators proactively manage supply and avoid unintentional overselling or overcommitment. | Threshold-based alerts are configurable per creator where reasonable defaults exist. | Notifications | — |

### 5.20 Analytics & Reporting

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| ANLY-01 | Creators can view sales performance (revenue, order volume, top products) over selectable time periods. | Must | Directly supports creator business decisions, a core value proposition. | Data reflects only the creator's own storefront and is available without excessive delay. | Orders | A brand-new creator with no sales must see a clear zero-state with guidance, not an empty/broken chart. |
| ANLY-02 | Creators can view storefront traffic and conversion indicators (views, wishlist adds, cart adds, conversion rate). | Should | Helps creators understand and improve their listings' effectiveness. | Metrics are presented at both storefront and per-listing granularity. | Search & Discovery, Wishlist, Cart | — |
| ANLY-03 | Admin and Super Admin can view aggregate platform-wide KPIs (see Section 10) and drill into per-creator or per-category performance. | Must | Necessary for operating and growing the marketplace responsibly. | Aggregate views do not expose individual buyer-identifiable data beyond what is operationally necessary. | Legal | — |

### 5.21 Coupons & Promotions

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| CPN-01 | Admin can create platform-wide coupons with defined eligibility rules (e.g., first-time buyers, minimum order value, category restrictions, validity window). | Must | Enables acquisition and retention campaigns at the platform level. | Coupons are automatically invalidated outside their eligibility rules or validity window without manual intervention. | Checkout | Expired coupons applied at the exact moment of expiry during checkout must be resolved consistently (e.g., honored if applied before expiry, rejected if after). |
| CPN-02 | Creators can create storefront-specific promotions within platform-defined guardrails (e.g., maximum discount depth). | Should | Gives creators marketing flexibility while protecting overall marketplace price integrity and creator margin health. | Creator promotions cannot exceed platform-defined limits; attempts beyond limits are blocked with explanation. | Creator Dashboard | — |
| CPN-03 | The platform defines clear rules for discount stacking (see Section 7.10). | Must | Prevents unintended margin erosion and buyer confusion from unpredictable discount combinations. | The system enforces stacking rules consistently at checkout, with the applied discount breakdown shown transparently to the buyer. | Checkout | — |

### 5.22 Admin Dashboard

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| ADM-01 | Admin can review and approve/reject creator applications. | Must | Core gate for the platform's authenticity/curation promise. | Rejected applicants receive a clear, policy-based reason; approved applicants are notified and can proceed to storefront setup. | Creator Verification, Notifications | Reapplication after rejection must be supported with a defined cooldown or improvement requirement, not permanently blocked without recourse. |
| ADM-02 | Admin/Moderator can review flagged listings, reviews, and storefronts and take defined actions (approve, reject, request changes, escalate). | Must | Maintains ongoing content and trust quality beyond initial onboarding. | All moderation actions are logged with actor, timestamp, and reason. | Moderation | A flagged item awaiting review beyond a defined SLA should be surfaced for prioritization, not silently backlogged indefinitely. |
| ADM-03 | Admin can issue refunds and manage disputes within policy limits, escalating to Super Admin where required. | Must | Necessary for timely operational issue resolution. | Refunds/dispute actions are fully traceable to the responsible order and actor. | Payments, Support | — |
| ADM-04 | Super Admin can configure platform-wide policy parameters (commission structure, discount stacking limits, verification requirements). | Must | Central control point for business-critical configuration. | Changes are versioned and auditable; changes do not retroactively alter already-completed orders. | — | A policy change taking effect mid-checkout session must not alter the price/terms a buyer already agreed to in that session. |

### 5.23 CMS & Content

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| CMS-01 | Admin can create and schedule editorial content (homepage features, collections, brand storytelling pages) without engineering involvement. | Must | Supports agile merchandising and brand storytelling at operational speed. | Content changes can be previewed before publishing and scheduled for future publish/unpublish dates. | Homepage, Collections | — |
| CMS-02 | Admin can manage static legal and informational pages (About, Terms, Privacy, Refund Policy, FAQ). | Must | Legal necessity and operational flexibility to update policy content. | Legal page changes are versioned with an effective date visible to users. | Legal | — |

### 5.24 Settings

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| SET-01 | Buyers can manage saved addresses and payment methods. | Must | Reduces friction on repeat purchases. | Buyers can add, edit, remove, and set a default address/payment method. | Payments, Checkout | Removing a payment method or address tied to a pending order must not disrupt that order's already-confirmed details. |
| SET-02 | Users can manage notification and communication preferences. | Must | Regulatory and trust requirement (see NOTIF-02). | Preferences persist and take effect immediately. | Notifications | — |
| SET-03 | Creators can manage storefront-level settings (policies, default lead times, vacation/pause mode). | Must | Supports operational flexibility, especially for solo creators managing capacity. | Enabling "pause mode" removes the storefront's listings from active sale while preserving the storefront and catalog data. | Creator Dashboard | Orders already placed before a pause must still be fulfilled per existing commitments unless mutually cancelled per policy. |

### 5.25 Support

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| SUPP-01 | Buyers and creators can raise a support ticket tied to a specific order or general account issue. | Must | Core resolution mechanism for issues that cannot be self-served. | Tickets capture category, description, and relevant order reference where applicable. | Orders | A ticket raised without a clear category must still be routable, defaulting to general triage rather than being lost. |
| SUPP-02 | Support Executives can view relevant order, payment (non-sensitive), and message data needed to resolve a ticket. | Must | Necessary operational access, scoped to protect broader privacy. | Access is limited to data relevant to the specific ticket's order/account. | Payments, Messaging | — |
| SUPP-03 | Tickets progress through defined states (see Section 8) and users are notified of status changes. | Must | Sets clear expectations and reduces repeat inbound contact for status checks. | Ticket state and last update are visible to the ticket's creator at all times. | Notifications | A ticket left in "Awaiting User Response" beyond a defined period should auto-close with clear notice and an easy reopen path. |
| SUPP-04 | Escalation paths exist from Support Executive to Admin to Super Admin for unresolved or high-severity issues. | Must | Ensures complex or sensitive issues receive appropriate authority and attention. | Escalated tickets retain full history; no context is lost in handoff. | — | — |

### 5.26 Legal & Compliance

| ID | Description | Priority | Business Reason | Acceptance Criteria | Dependencies | Edge Cases |
|---|---|---|---|---|---|---|
| LEGAL-01 | Users must accept Terms of Service and Privacy Policy during account creation. | Must | Legal necessity for enforceable terms and data processing consent. | Consent is timestamped and tied to the specific version of the document accepted. | Authentication | Material changes to terms must require re-consent from existing users before continued use of affected functionality. |
| LEGAL-02 | Creators must accept a Seller Agreement, including authenticity, disclosure, and conduct obligations, before publishing listings. | Must | Establishes enforceable expectations specific to the creator relationship. | Seller Agreement acceptance is a required, logged step in creator onboarding. | Creator Verification | — |
| LEGAL-03 | The platform provides a clear, accessible Refund and Cancellation Policy referenced at checkout. | Must | Legal transparency requirement and trust/expectation-setting mechanism. | Policy is linked directly within the checkout flow, not only buried in a footer. | Checkout, CMS | — |

---

# 6. User Stories

Stories are grouped by module. Each follows the format: **As a** \<role\>, **I want** ..., **so that** ..., with acceptance criteria.

### 6.1 Authentication & Account

**US-01 — Create an account**
As a Guest, I want to create an account with my email and a password, so that I can save my information and complete purchases.
*Acceptance Criteria:* Account is created only after valid email/password input; a verification email is sent; the account is unverified until confirmed.

**US-02 — Recover access**
As a Buyer, I want to reset my password if I forget it, so that I can regain access to my account without contacting support.
*Acceptance Criteria:* A reset link is emailed; the link expires after a defined window; successful reset immediately signs the user in.

**US-03 — Operate as both buyer and creator**
As a Buyer who also sells my own crafts, I want to apply to become a Creator from my existing account, so that I don't need to manage two separate identities.
*Acceptance Criteria:* Applying for a Creator profile does not require a new account; both profiles remain accessible from a single sign-in.

### 6.2 Homepage & Discovery

**US-04 — Discover curated products**
As a Buyer, I want to see curated collections on the homepage, so that I can quickly find meaningful products without needing to know exactly what I'm looking for.
*Acceptance Criteria:* Homepage displays at least one active curated collection at all times; collections link to a full browsing page.

**US-05 — Search for a specific idea**
As a Buyer, I want to search for a product using a general idea (e.g., "wooden anniversary gift"), so that I can find relevant options even without knowing the exact product name.
*Acceptance Criteria:* Search returns relevant results for partial/fuzzy matches; zero-result queries show helpful suggestions rather than a dead end.

**US-06 — Narrow results**
As a Buyer, I want to filter search results by price and customization availability, so that I can find products that fit my budget and gifting needs.
*Acceptance Criteria:* Filters can be combined; result counts update live; filters can be cleared individually.

### 6.3 Product & Storefront

**US-07 — Evaluate authenticity before buying**
As a Buyer, I want to clearly see whether a product is handmade or made-to-order, so that I can trust what I'm purchasing.
*Acceptance Criteria:* Disclosure label is visible on the product detail page without requiring the buyer to scroll or search for it.

**US-08 — Explore a creator's full catalog**
As a Buyer, I want to view a creator's full storefront after finding one product I like, so that I can discover more items from a maker I trust.
*Acceptance Criteria:* A visible link from the product page leads to the full storefront; the storefront shows all the creator's published listings.

**US-09 — Present my brand professionally**
As a Creator, I want to customize my storefront with my story and photography, so that buyers understand and connect with my craft.
*Acceptance Criteria:* Creator can edit story/imagery from the dashboard; changes reflect publicly after passing any required review.

### 6.4 Customization

**US-10 — Personalize a gift**
As a Buyer, I want to provide a name and short message to be engraved on a product, so that the gift feels personal to the recipient.
*Acceptance Criteria:* Required customization fields block checkout until completed; submitted text is shown back to the buyer for confirmation before payment.

**US-11 — Clarify an ambiguous request**
As a Creator, I want to ask a buyer a clarifying question about their customization request, so that I can avoid producing the wrong item.
*Acceptance Criteria:* Creator can send a message tied to the specific order; the order reflects a "waiting on buyer" status until the buyer responds.

### 6.5 Cart & Checkout

**US-12 — Buy from multiple creators at once**
As a Buyer, I want to purchase items from two different creators in a single checkout, so that I don't have to complete multiple separate transactions.
*Acceptance Criteria:* A single payment is made; two independent sub-orders are created, each trackable separately.

**US-13 — Check out without creating an account**
As a Guest, I want to complete a purchase without being forced to create an account, so that I can buy quickly for a one-off need.
*Acceptance Criteria:* Guest checkout requires only essential information; an account creation option is offered but not mandatory.

**US-14 — Understand the full cost upfront**
As a Buyer, I want to see the full price breakdown (item, shipping, tax, discounts) before paying, so that I'm not surprised at the final step.
*Acceptance Criteria:* All cost components are visible before the final payment confirmation action.

### 6.6 Orders & Fulfillment

**US-15 — Track my order**
As a Buyer, I want to track the status of each item in my order, so that I know when to expect delivery, especially for a gift with a deadline.
*Acceptance Criteria:* Each sub-order shows an independent, accurate status and, where available, carrier tracking information.

**US-16 — Manage incoming orders**
As a Creator, I want to see all my new orders in one place, so that I can start production without delay.
*Acceptance Criteria:* New orders appear on the creator dashboard immediately upon confirmation, with customization details attached.

**US-17 — Cancel before production starts**
As a Buyer, I want to cancel an order shortly after placing it, so that I'm not charged for something I no longer need.
*Acceptance Criteria:* Cancellation is available within the policy-defined window and clearly explains eligibility if the window has passed.

### 6.7 Reviews & Trust

**US-18 — Leave honest feedback**
As a Buyer, I want to leave a review after receiving my order, so that I can share my experience with future buyers.
*Acceptance Criteria:* Review option appears only after order completion; rating is required, written feedback is optional.

**US-19 — Respond to feedback**
As a Creator, I want to respond publicly to a review, so that I can address concerns or thank a happy customer.
*Acceptance Criteria:* One public response is allowed per review, visible alongside it on the storefront.

### 6.8 Support & Disputes

**US-20 — Get help with a problem order**
As a Buyer, I want to raise a support ticket about a delayed order, so that I can get help without waiting indefinitely.
*Acceptance Criteria:* Ticket is created with the relevant order attached; buyer receives status updates until resolution.

**US-21 — Escalate a difficult case**
As a Support Executive, I want to escalate a complex dispute to Admin, so that it can be resolved with appropriate authority.
*Acceptance Criteria:* Escalation preserves full ticket history; Admin is notified and can act without needing the buyer/creator to repeat information.

### 6.9 Platform Operations

**US-22 — Approve a new creator**
As an Admin, I want to review a creator's application and verification details, so that I can ensure only genuine, quality creators join the platform.
*Acceptance Criteria:* Admin can approve or reject with a documented reason; the applicant is notified accordingly.

**US-23 — Moderate flagged content**
As a Moderator, I want to review a flagged listing, so that I can remove content that violates authenticity or quality standards.
*Acceptance Criteria:* Moderator action (approve/reject/escalate) is logged with reason and immediately reflected on the public listing status.

**US-24 — Configure platform policy**
As a Super Admin, I want to update the platform's discount stacking limits, so that promotional campaigns don't erode creator margins beyond acceptable levels.
*Acceptance Criteria:* Policy changes are versioned and apply only to future transactions, not retroactively.

---

# 7. Business Rules

### 7.1 Product / Listing Approval

- Every new listing from a newly verified creator is subject to review before becoming publicly visible, for a defined initial trust-building period.
- Established creators in good standing may publish listings that go live immediately but remain subject to post-publish review and takedown if found in violation.
- Listings must include: at least one image, an accurate handmade/made-to-order disclosure, a category, and a price before they can be published.
- Listings that misrepresent authenticity (e.g., claiming handmade for mass-manufactured goods) are subject to immediate unpublishing and creator review, with repeat violations leading to suspension (see 7.19).

### 7.2 Returns & Cancellations

- Buyers may cancel an order free of charge within a defined short window after placement (before creator production/fulfillment begins).
- Once a creator has begun production of a made-to-order item, cancellation is only allowed by mutual agreement between buyer and creator, or in the case of platform policy violations by the creator.
- Stocked (non-made-to-order) products follow a standard return window post-delivery, unless the category is inherently non-returnable (e.g., personalized items, perishable goods, items for hygiene reasons) — non-returnable categories must be clearly disclosed pre-purchase.
- Return shipping cost responsibility (buyer vs. creator) depends on the return reason (defective/wrong item vs. buyer preference change) and is defined consistently platform-wide.

### 7.3 Refunds

- Refunds are issued to the original payment method.
- Full refunds apply for orders cancelled within the eligible window, non-delivery, or confirmed defective/incorrect items.
- Partial refunds may apply for partially fulfilled multi-item orders or minor, mutually agreed discrepancies.
- Refunds tied to disputes are held pending investigation outcome; funds already paid out to a creator may be reversed/deducted from future payouts if a refund is later approved.

### 7.4 Reviews

- Only verified purchasers may review the specific item they purchased, once per completed order line item.
- Reviews cannot be edited after a defined window post-submission but may be removed by the buyer at any time.
- Reviews containing personal attacks, off-topic content, or content unrelated to the product/order experience are subject to moderation removal.
- A creator cannot pay, incentivize, or coerce buyers for reviews; violations are treated as a trust and safety issue (see 7.19).

### 7.5 Seller (Creator) Verification

- All creators must complete identity verification and provide evidence of their craft/authenticity (e.g., process photos, portfolio) before their storefront becomes publicly visible.
- Verification status is one of: Pending, Approved, Rejected, Revoked (see Section 8.7 for full state model).
- Verification may be revoked at any time for confirmed policy violations, requiring the creator to cease selling until re-verified or permanently, depending on severity.
- Reapplication after rejection is allowed after a defined cooldown period or upon addressing the stated rejection reason.

### 7.6 Taxes

- Applicable taxes are calculated based on buyer location and relevant jurisdictional rules at the time of checkout.
- Tax amounts are itemized separately from product price and shipping in the order summary.
- Tax-exempt transactions (where legally applicable) require appropriate documentation/verification before exemption is applied.

### 7.7 Shipping

- Every listing must have a defined shipping method and estimated timeframe before it can be published.
- Estimated delivery timelines shown to buyers must combine both production/lead time (for made-to-order items) and carrier transit time.
- Creators are responsible for fulfilling within their stated timelines; persistent failure to do so affects their internal quality standing and may trigger review (see 7.19).
- International shipping availability is creator-configurable and must be clearly shown before checkout for buyers outside the creator's serviceable regions.

### 7.8 Coupons

- Platform-wide coupons are configured with explicit eligibility rules (user segment, minimum order value, category, validity window).
- A coupon cannot be applied to an order after its validity window has expired, regardless of when it was added to a cart.
- Coupons cannot reduce a creator's net payout below their listed cost floor unless the platform explicitly subsidizes the difference (configuration-dependent, not a default assumption).

### 7.9 Pricing

- Creators set their own listing prices; the platform does not dictate specific product pricing.
- Prices displayed to buyers are inclusive of all mandatory platform-added components except tax and shipping, which are itemized separately.
- Price changes to a listing do not retroactively affect orders already placed at a prior price.

### 7.10 Discount Stacking

- A defined, platform-configured maximum applies to how many discount types (platform coupon, creator promotion, other future mechanisms) may combine on a single order.
- Where stacking is allowed, the applied order and interaction (e.g., percentage vs. flat discounts) must be deterministic and shown transparently to the buyer.
- Discount stacking limits are configurable by Super Admin (see ADM-04) and apply prospectively only.

### 7.11 Inventory

- Stock levels for stocked products must decrement atomically at order confirmation to prevent overselling.
- Made-to-order products are governed by creator-defined production capacity rather than a fixed stock count; once capacity is reached, new orders reflect an extended lead time or temporary unavailability.
- Inventory discrepancies discovered post-purchase (e.g., manual creator error) are treated as a fulfillment issue subject to Section 7.2/7.3 (cancellation/refund) rules.

### 7.12 Custom Orders

- Every made-to-order listing must clearly state estimated production lead time before purchase.
- Once a buyer submits required customization details, the creator has a defined window to flag any issue (e.g., request clarification) before production is assumed to begin.
- Substantive changes to customization details after production has started require mutual agreement and may affect delivery timeline and/or price.

### 7.13 Digital Products

- Digital or downloadable products (if offered) are non-returnable once delivered/downloaded, except in cases of confirmed technical defect or non-delivery.
- Digital products must be clearly labeled as such prior to purchase to avoid confusion with physical handmade goods.

### 7.14 Gift Orders

- Buyers may designate a different shipping recipient than the account holder without exposing the recipient to the buyer's full account/payment details.
- Gift notes and packaging preferences, where offered, are passed to the fulfilling creator as part of the order but are not used for any purpose beyond fulfillment.
- Price/payment information is never included in gift packaging or shipment-facing documentation by default.

### 7.15 Guest Checkout

- Guest checkout requires a valid email (for order communication) and shipping/payment details, but not a password or full profile.
- Guest orders are fully trackable via a secure order-lookup mechanism (e.g., order ID plus email) without requiring account creation.
- A guest may later claim their guest order history by creating an account with the matching, verified email.

### 7.16 Communication

- All order-related buyer-creator communication is expected to occur through the platform's Messaging module to preserve auditability and support dispute resolution.
- Marketing communication requires explicit opt-in consent and can be withdrawn at any time (see NOTIF-02, SET-02).

### 7.17 Spam

- Automated and pattern-based detection flags likely spam behavior (e.g., mass identical messages, rapid repeated account creation) for moderation review.
- Confirmed spam accounts/content are removed and associated accounts may be suspended per Section 7.19.

### 7.18 Fraud Prevention

- Attempts to bypass platform payment (e.g., soliciting off-platform payment to avoid commission) are treated as a serious policy violation subject to immediate review and potential suspension.
- Unusual transaction patterns (e.g., rapid high-value orders from a new account, mismatched billing/shipping signals) are flagged for review before fulfillment/payout where risk indicators are significant.
- Chargeback and payment dispute patterns are tracked per buyer and per creator to identify systemic issues.

### 7.19 Content Moderation

- Content (listings, storefront copy, reviews, messages in disputed context) found to violate authenticity, safety, or conduct standards is actioned on a severity scale: **Warning → Content Removal → Temporary Suspension → Permanent Termination**.
- Moderators may action lower-severity violations directly; suspension and termination require Admin or Super Admin authorization, respectively, consistent with role permissions in Section 3.
- All moderation actions are logged with actor, reason, and timestamp, and are subject to an appeal process available to the affected creator or buyer.

---

# 8. Product States

### 8.1 Product / Listing

| State | Description |
|---|---|
| Draft | Created by a creator but not submitted for review or publishing. |
| Pending Review | Submitted and awaiting Admin/Moderator review (new creators, or flagged listings). |
| Published | Live and publicly discoverable/purchasable. |
| Unpublished | Manually hidden by the creator; not publicly visible but retained in the creator's catalog. |
| Sold Out | Published but temporarily unavailable due to stock/capacity limits. |
| Rejected | Failed review; not publicly visible; creator notified with reason. |
| Archived | Retired by the creator; retained for historical order reference only, not purchasable. |
| Removed | Taken down by Admin/Moderator for policy violation. |

**Key transitions:** Draft → Pending Review → Published; Published ↔ Sold Out (automatic based on inventory); Published → Unpublished (creator action, reversible); Published → Removed (moderation action); any active state → Archived (creator action, generally not reversible for that specific listing).

### 8.2 Order (and Sub-order)

| State | Description |
|---|---|
| Pending Payment | Checkout initiated; payment not yet confirmed. |
| Confirmed | Payment successfully authorized/captured; order/sub-order created and visible to the creator. |
| Awaiting Customization Clarification | Creator has requested buyer input before production can begin. |
| In Production | Creator is actively producing a made-to-order item (or preparing a stocked item for shipment). |
| Ready to Ship | Item is complete and awaiting handover to carrier. |
| Shipped | Handed to carrier; tracking available where applicable. |
| Delivered | Confirmed received by buyer (via carrier confirmation or buyer acknowledgment). |
| Completed | Delivery confirmed and the return/dispute window has closed without issue; payout eligible. |
| Cancelled | Terminated before fulfillment, by buyer request (within policy) or mutual agreement. |
| Disputed | Buyer or creator has raised an unresolved issue requiring Support/Admin intervention. |
| Refunded | Full or partial refund issued; order closed. |

**Key transitions:** Confirmed → Awaiting Customization Clarification → In Production (or directly Confirmed → In Production if no clarification is needed); In Production → Ready to Ship → Shipped → Delivered → Completed; any pre-Shipped state → Cancelled (subject to Section 7.2 policy); any state → Disputed (buyer/creator initiated); Disputed → Refunded or back to an active fulfillment state depending on resolution.

### 8.3 Payment

| State | Description |
|---|---|
| Initiated | Payment attempt started. |
| Authorized | Funds reserved but not yet captured. |
| Captured | Funds successfully collected from the buyer. |
| Failed | Payment attempt unsuccessful; buyer prompted to retry or use another method. |
| Refunded (Full/Partial) | Funds returned to the buyer, fully or partially. |
| Disputed (Chargeback) | Buyer's payment provider has raised a formal dispute outside the platform's native dispute flow. |

### 8.4 Shipment

| State | Description |
|---|---|
| Not Yet Shipped | Item not yet handed to a carrier. |
| Shipped | Handed to carrier; in transit. |
| Out for Delivery | Final-mile delivery in progress (where carrier data supports this granularity). |
| Delivered | Carrier-confirmed or buyer-confirmed delivery. |
| Delayed | Tracking indicates the shipment has exceeded its estimated delivery window. |
| Lost | Confirmed lost in transit, triggering the Section 5.13 / 7.3 resolution process. |
| Returned to Sender | Delivery failed and the item has been returned to the creator. |

### 8.5 Refund

| State | Description |
|---|---|
| Requested | Buyer or Support has initiated a refund request. |
| Under Review | Being evaluated against policy and, if applicable, dispute evidence. |
| Approved | Refund approved; payment processing initiated. |
| Rejected | Refund request denied, with reason provided to the requester. |
| Processed | Funds successfully returned to the buyer's original payment method. |

### 8.6 Account

| State | Description |
|---|---|
| Unverified | Registered but email/phone not yet confirmed. |
| Active | Fully functional account in good standing. |
| Restricted | Limited functionality due to a specific, defined issue (e.g., unresolved payment dispute) without full suspension. |
| Suspended | Temporarily disabled due to a policy violation, pending review or a defined suspension period. |
| Terminated | Permanently disabled; typically irreversible and reserved for severe or repeated violations. |
| Deletion Requested | User has requested account deletion; pending resolution of any blocking conditions (see AUTH-07). |
| Deleted | Account and associated personal data removed/anonymized per policy. |

### 8.7 Creator Verification

| State | Description |
|---|---|
| Not Started | Application not yet submitted. |
| Pending Review | Application submitted; awaiting Admin review. |
| Approved | Verified; storefront eligible to go live. |
| Rejected | Application denied with a documented reason; reapplication eligible per policy (7.5). |
| Revoked | Previously approved verification withdrawn due to a policy violation. |

### 8.8 Support Ticket

| State | Description |
|---|---|
| Open | Newly created, unassigned or awaiting first response. |
| In Progress | Actively being worked by a Support Executive. |
| Awaiting User Response | Support has requested more information from the ticket creator. |
| Escalated | Passed to Admin or Super Admin for higher-authority resolution. |
| Resolved | Issue addressed; ticket closed with an outcome recorded. |
| Auto-Closed | Closed automatically after prolonged inactivity in "Awaiting User Response," with a clear reopen path. |

### 8.9 Notification

| State | Description |
|---|---|
| Queued | Generated and awaiting delivery. |
| Delivered | Successfully sent via the applicable channel. |
| Failed | Delivery attempt unsuccessful; may trigger retry or fallback channel per policy. |
| Read | User has viewed/opened the notification (where technically observable). |

### 8.10 Wishlist (Item-Level)

| State | Description |
|---|---|
| Active | Item is wishlisted and available for purchase. |
| Price Changed | Item remains available but its price has changed since being wishlisted. |
| Unavailable | Item is sold out or temporarily unavailable. |
| Removed by Creator | The underlying listing has been unpublished, archived, or removed. |

### 8.11 Cart (Item-Level)

| State | Description |
|---|---|
| Valid | Item and its selected customization/quantity are available and ready for checkout. |
| Needs Attention | Item requires buyer action (e.g., price changed, customization option no longer available). |
| Unavailable | Item can no longer be purchased (sold out, listing removed) and must be resolved before checkout proceeds. |

---

# 9. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Core buyer-facing pages (homepage, search, product detail, cart, checkout) must load and become interactive within a premium-grade target consistent with `00-project-vision.md` Section 14 (initial load under 2 seconds; Lighthouse 95+). Performance must not degrade materially as catalog size and traffic grow. |
| **Accessibility** | The platform must conform to WCAG 2.2 AA across all buyer- and creator-facing surfaces, including keyboard navigability, screen-reader compatibility, sufficient color contrast, and accessible form validation messaging. |
| **Security** | The platform must protect user data and payment information consistent with OWASP Top 10 guidance, apply the principle of least privilege across all internal roles (Section 3), and maintain full audit logging for sensitive and irreversible actions. |
| **SEO** | Public-facing pages (homepage, categories, collections, product detail, creator storefronts) must be crawlable and structured to support strong organic discoverability, given the importance of organic reach for a curated marketplace. |
| **Reliability** | Core transactional flows (checkout, payment, order status updates) must degrade gracefully under partial failure (e.g., a non-critical personalization service being unavailable must not block checkout). |
| **Scalability** | The product experience must remain consistent whether the platform has hundreds or hundreds of thousands of creators and buyers, per `00-project-vision.md` Section 15 (support for 1M+ users). |
| **Maintainability** | Functional modules should be independently updatable (e.g., changes to Coupons should not require changes to Shipping) to support long-term evolution without regression risk. |
| **Availability** | The platform must target 99.9% availability for core buyer- and creator-facing functionality, consistent with `00-project-vision.md` Section 14. |
| **Compliance** | The platform must support applicable consumer protection, data privacy, and tax regulations for its launch market(s), with architecture that allows extension to additional markets over time. |
| **Offline** | Core informational browsing (e.g., previously viewed content) should degrade gracefully with a clear offline state, consistent with Progressive Web App support referenced in the vision document. |
| **Browser Support** | The platform must support current and one prior major version of leading modern browsers (Chrome, Safari, Firefox, Edge) on both desktop and mobile. |
| **Localization** | While full localization is out of scope for v2 (Section 14), the product must be structured so that currency, date/time formatting, and future language support can be added without a fundamental redesign. |

---

# 10. Success Metrics

Metrics build directly on `00-project-vision.md` Sections 10, 14, and 15, expressed here at product-execution granularity.

### 10.1 Business KPIs

| Metric | Target / Direction |
|---|---|
| Gross Merchandise Value (GMV) | Growing month over month post-launch. |
| Take rate / net platform revenue | Sustainable and consistent with defined commission policy. |
| Checkout conversion rate | 4%+ (per vision doc Section 14). |

### 10.2 User (Buyer) KPIs

| Metric | Target / Direction |
|---|---|
| Net Promoter Score (NPS) | 70+ |
| Buyer repeat purchase rate | 35%+ |
| Search-to-purchase conversion | Improving over time via relevance tuning. |

### 10.3 Creator KPIs

| Metric | Target / Direction |
|---|---|
| Creator retention (3/6/12 months) | 80%+ retention benchmark. |
| Average creator revenue per month | Growing and trending toward platform-defined sustainable-livelihood benchmarks. |
| Time from application to first sale | Minimized, reflecting onboarding and discoverability effectiveness. |

### 10.4 Operational KPIs

| Metric | Target / Direction |
|---|---|
| Support ticket resolution time | Within defined SLA per severity tier. |
| Dispute rate (orders resulting in a dispute) | Minimized and trending down over time. |
| Creator verification turnaround time | Fast enough to avoid discouraging genuine applicants while preserving review quality. |

### 10.5 Quality KPIs

| Metric | Target / Direction |
|---|---|
| Lighthouse performance score | 95+ |
| WCAG 2.2 AA conformance | Full conformance across core flows. |
| Platform availability | 99.9% |
| PWA install rate | 20%+ |

---

# 11. Risks

### 11.1 Product Risks

| Risk | Description |
|---|---|
| Feature overreach | Attempting to ship too many modules at premium quality simultaneously could dilute execution quality across all of them. |
| Customization complexity underestimated | The diversity of craft types may require more flexible customization tooling than initially scoped, risking creator frustration if too rigid. |
| Trust signal insufficiency | If verification and review mechanisms are not sufficiently visible/robust, buyers may not perceive the intended trust differentiation from competitors. |

### 11.2 Business Risks

See `00-project-vision.md` Section 21.1 for the full business risk register (marketplace liquidity, monetization sensitivity, brand dilution, competitive response); this PRD's functional scope is designed to directly mitigate several of these (e.g., curated onboarding mitigates brand dilution risk).

### 11.3 Operational Risks

| Risk | Description |
|---|---|
| Moderation bottleneck | If listing/creator review volume outpaces Moderator/Admin capacity, either quality suffers (rushed review) or growth suffers (backlog delays). |
| Support complexity from customization | Made-to-order disputes are inherently more nuanced than standard retail, risking longer resolution times and higher support cost per ticket than initially planned. |
| Inconsistent creator fulfillment reliability | Since creators independently control production timelines, inconsistent reliability across creators could unevenly affect buyer trust in the platform as a whole. |

### 11.4 Legal Risks

| Risk | Description |
|---|---|
| Tax and consumer protection compliance | Incorrect tax calculation or non-compliant refund/cancellation policy could create regulatory exposure. |
| Authenticity/misrepresentation liability | If handmade/made-to-order disclosures are not enforced rigorously, the platform could face claims related to misleading commerce practices. |
| Data privacy compliance | Handling personal and payment data across potentially multiple jurisdictions requires ongoing compliance diligence as the platform grows. |

### 11.5 Technical Risks (High Level Only)

| Risk | Description |
|---|---|
| Scalability of multi-vendor order logic | Splitting and independently tracking sub-orders at scale is more complex than single-vendor commerce and must be architected carefully (technical design out of scope for this document). |
| Real-time inventory accuracy | Preventing overselling under concurrent demand requires careful handling; failure here directly damages buyer trust. |

---

# 12. Assumptions

1. Sufficient buyer demand exists for a premium, curated handmade/personalized marketplace, as established in `00-project-vision.md` Section 16.
2. Creators are willing to accept a structured verification and review process in exchange for the trust and discoverability benefits it provides.
3. The initial launch market and creator categories provide sufficient breadth to validate core flows (search, customization, checkout, fulfillment) before broader expansion.
4. Multi-vendor, sub-order checkout is an acceptable buyer experience when clearly communicated, rather than requiring separate checkouts per creator.
5. A commission-based model (with details defined separately) is sufficient to sustain the business without requiring buyer-facing platform fees at launch.
6. Support and moderation capacity can scale roughly in line with creator and order growth without requiring a fundamentally different operating model at moderate scale.

---

# 13. Constraints

| Category | Constraint |
|---|---|
| **Budget** | Product scope for v2 must be achievable by a lean team, consistent with the vision document's assumption that a small team can achieve premium quality using modern tooling; large-scope features requiring significant additional headcount are deferred (see Section 14). |
| **Timeline** | V2 must ship a focused, high-quality core experience rather than a broad but shallow feature set, consistent with `00-project-vision.md` Section 17's scoping discipline. |
| **Resources** | Moderation and support operations must be sized appropriately to the actual creator/order volume at launch; features that assume large-scale operational teams (e.g., extensive manual curation at high volume) are not assumed available at launch. |
| **Compliance** | The product must operate within the tax, consumer protection, and data privacy requirements of its initial launch market(s) before any multi-market expansion is undertaken. |

---

# 14. Out of Scope for V2

Consistent with and expanding on `00-project-vision.md` Section 24, the following are explicitly out of scope for this PRD's v2 release:

- Native mobile applications (iOS/Android).
- AI-powered features of any kind (search, recommendations, generation, support triage) — see Section 15.
- Community features (forums, follow/feed functionality, social interaction beyond order-contextual messaging).
- Subscription or membership programs for buyers or creators.
- Loyalty and rewards programs.
- B2B and wholesale purchasing flows.
- Gift registry functionality.
- Full multi-currency and multi-language localization.
- Creator financing, lending, or advance-payment tools.
- Advanced/predictive analytics and business intelligence beyond core performance reporting.
- Third-party marketplace syndication (e.g., listing distribution to other platforms).
- AR/3D product preview.
- Storefront theming/customization beyond platform-defined brand-consistent templates.

---

# 15. Future Enhancements

Consistent with `00-project-vision.md` Sections 25–26, the following represent directions for future versions, to be scoped independently once core v2 functionality is validated:

| Enhancement | Description |
|---|---|
| **AI** | AI-powered search and recommendations, AI-assisted listing creation for creators, AI gifting assistant, AI-assisted customer support triage, AI-based fraud detection. |
| **Community** | Maker spotlights, buyer collections/boards, follow/favorite functionality, editorial content connecting buyers and creators. |
| **Subscriptions** | Curated periodic delivery subscriptions for buyers; premium tool subscriptions for creators. |
| **Wholesale** | Creator-enabled wholesale pricing and terms for retail partners. |
| **B2B** | Corporate and hospitality gifting sourced at scale through the platform. |
| **Creator Academy** | Educational resources and guided tools to help creators grow their business and craft presentation skills. |
| **Loyalty Program** | Rewards mechanics for repeat buyers and long-term engagement. |
| **Gift Registry** | Curated registries for weddings, baby showers, and other milestone events. |
| **AR Preview** | Augmented reality preview of applicable products (e.g., wall art, home décor) before purchase. |
| **Mobile Apps** | Native iOS and Android applications extending the responsive web experience. |

---

# 16. Glossary

| Term | Definition |
|---|---|
| Creator / Kalakaar | An individual or small studio selling handmade or personalized products on the platform. |
| Buyer | A customer browsing or purchasing on the platform. |
| Guest | An unauthenticated visitor. |
| Creator Team Member | An individual granted scoped access to help operate a Creator's storefront. |
| Storefront | A creator's branded page containing their catalog, story, and identity. |
| Listing | A single product published by a creator. |
| Order | A confirmed purchase transaction, potentially spanning multiple creators. |
| Sub-order | The portion of an order attributable to a single creator, tracked and fulfilled independently. |
| Customization | Buyer-provided input (text, image, choice, measurement) that personalizes a made-to-order product. |
| Verification | The process confirming a creator's identity, authenticity, and quality before/while selling. |
| Made-to-order | A product produced only after a buyer places an order, typically personalized. |
| Curation | The editorial and review process maintaining quality and authenticity standards across the platform. |
| Moderation | The review and enforcement process addressing policy violations in listings, reviews, and conduct. |
| Payout | The transfer of funds owed to a creator following a completed, eligible order. |
| Sub-order Dispute | A disagreement between buyer and creator (or flagged by the platform) requiring Support/Admin resolution. |
| SLA | Service Level Agreement — a defined target time for resolving a given type of request or issue. |
| KPI | Key Performance Indicator — a measurable value used to evaluate success against a defined goal. |
| WCAG | Web Content Accessibility Guidelines. |
| OWASP | Open Web Application Security Project. |
| PWA | Progressive Web App. |
| MoSCoW | A prioritization framework: Must have, Should have, Could have, Won't have (this document uses Must / Should / Could). |

---

*This document operationalizes `00-project-vision.md` into a complete functional specification for Dreams by Kalakaaar v2. Subsequent UX design specifications, engineering design documents, and QA test plans should trace directly back to the requirements, states, and rules defined here.*