# 04 · Information Architecture — Dreams by Kalakaaar v2

**Document owner:** Information Architecture & UX
**Status:** Draft for review
**Audience:** Product, UX, Engineering, QA, SEO, Content, Future team members
**Companion documents:** `00-project-vision.md`, `01-product-requirements.md`, `02-user-personas.md`, `03-user-journeys.md`

---

# 1. Introduction

### 1.1 Purpose

This document defines the complete Information Architecture (IA) of Dreams by Kalakaaar v2: how content, features, and navigation are structured, grouped, labeled, and connected so that every person — buyer, creator, or internal operator — can find what they need with minimal effort and maximum confidence.

Where `03-user-journeys.md` defines *how people move through behavior over time*, this document defines *the structure they move through* — the pages that exist, how they nest, how they connect to one another, and the rules that govern who can see what. It is the structural skeleton onto which wireframes, navigation systems, and routing will later be built.

### 1.2 Objectives

1. Define a complete, unambiguous sitemap covering every page required by the functional modules in `01-product-requirements.md`.
2. Define navigation systems (global, contextual, dashboard, mobile) that make the platform's structure legible at every level of use.
3. Define content taxonomy and classification systems that support both human browsing and long-term catalog scalability.
4. Define search, filtering, and URL strategies that support fast, confident discovery and strong organic reach.
5. Define permission-based visibility so that every role sees exactly what it needs — no more, no less.
6. Establish an IA foundation that scales to millions of users and a large, diverse catalog without requiring structural rework.

### 1.3 Scope

This document covers the structural and navigational organization of the entire platform: buyer-facing, creator-facing, and internal (Admin/Moderator/Support) surfaces, including sitemap, navigation, taxonomy, search/filter architecture, URL structure, breadcrumbs, dashboards, permissions, SEO structure, mobile IA, and error handling.

This document does **not** cover visual design, component design, API design, or database schema — those are addressed in subsequent design and engineering documentation.

### 1.4 Audience

Product Management, UX/UI Design, Engineering, QA, SEO, Content, and Marketing teams, along with future team members who need to understand platform structure without re-deriving it from screens or code.

### 1.5 Relationship with Previous Documents

| Document | Relationship |
|---|---|
| `00-project-vision.md` | Establishes the brand principles (minimal, premium, trustworthy) and audience segments that this IA is structured to serve. |
| `01-product-requirements.md` | Defines the functional modules (Section 4) and roles (Section 3) that this document translates into a concrete page structure and permission model. |
| `02-user-personas.md` | Defines the people whose mental models this IA's labeling and grouping decisions must match. |
| `03-user-journeys.md` | Defines the journeys (Sections 3–8) that this IA's navigation paths and page relationships must support end-to-end without dead ends. |

### 1.6 Guiding IA Principles (Summary)

The full principle set is defined in Section 2. In summary: this IA favors **clarity over cleverness, recognition over recall, and structure that scales** — consistent with the product principles in `00-project-vision.md` Section 11 ("Simplicity is a discipline") and Section 9's design philosophy.

---

# 2. Information Architecture Principles

| Principle | Definition | Application on Dreams by Kalakaaar |
|---|---|---|
| **Clarity** | Every page, label, and navigation item should communicate its purpose without requiring interpretation. | Category and navigation labels use plain, buyer-familiar language ("Home Décor," not "Living Space Objects"). |
| **Consistency** | Similar things behave and are labeled similarly everywhere they appear. | Product cards, filters, and breadcrumb patterns behave identically across Search, Categories, and Collections. |
| **Recognition over Recall** | Users should be able to recognize where they are and what to do next, rather than needing to remember platform structure. | Persistent global navigation, breadcrumbs, and active-state indicators are present on every page. |
| **Progressive Disclosure** | Show only what's needed at each step; reveal complexity only when relevant. | Product detail pages show core info first, with customization, shipping detail, and reviews available without overwhelming the initial view. |
| **Scalability** | The structure must accommodate significant growth in categories, creators, and content without requiring redesign. | Category taxonomy (Section 8) is hierarchical and extensible; navigation is data-driven rather than hardcoded to today's catalog size. |
| **Discoverability** | Every piece of content should be reachable through at least one intentional, logical path. | No orphaned pages (Section 5 dead-end review); every listing is reachable via category, search, and creator storefront at minimum. |
| **Minimal Cognitive Load** | Reduce the number of decisions and the amount of information a user must hold in mind at once. | Checkout is a linear, single-focus flow (per `03-user-journeys.md` 3.13); filters are grouped and collapsible rather than all exposed at once. |
| **Accessibility** | Structure must be navigable via keyboard, screen reader, and assistive technology, not just visually. | Navigation and breadcrumb structures use logical, semantic hierarchy; no information is conveyed by position or color alone. |
| **Predictability** | Similar actions produce similar, expected outcomes across the platform. | "Back" behavior, breadcrumb behavior, and modal/dialog patterns behave consistently across Buyer, Creator, and Admin contexts. |
| **Content First** | Structure serves the content and the person seeking it, not the organization's internal structure. | Categories and taxonomy (Section 8) are modeled on how buyers think about gifting and craft, not on internal catalog management convenience. |
| **Mobile First** | Core structure is designed for the smallest, most constrained context first, then expanded for larger screens. | Bottom navigation and drawer patterns (Section 18) are the primary design target, with desktop navigation as an expanded variant. |
| **Trust First** | Every structural decision should reinforce, not undermine, the platform's authenticity and trust promise. | Creator verification status and disclosure information are structurally prioritized in product and storefront hierarchy (Section 14). |
| **Marketplace First** | The IA reflects a two-sided marketplace, not a single-brand storefront — buyer and creator structures are distinct but interconnected. | Every product page structurally connects back to its creator's storefront (Section 5); every creator has an independently navigable presence. |
| **Creator First** | Creator-facing IA is held to the same clarity and quality bar as buyer-facing IA, reflecting the "Creator Empowerment" core value. | Creator Dashboard (Section 6) is organized around the creator's actual workflow, not a generic admin-panel template. |
| **SEO Friendly** | Structure and URLs are designed to support strong organic discoverability by default. | Category, collection, product, and creator pages follow clean, descriptive, crawlable URL patterns (Section 12). |

---

# 3. Global Sitemap

The sitemap is organized into nine top-level zones. Indentation reflects hierarchy depth.

### 3.1 Public / Marketing Zone

- **Landing** *(pre-launch / campaign-specific landing pages, distinct from Home)*
- **Home** (Homepage)
  - Featured Collections
  - Featured Creators
  - Occasion/Seasonal Highlights
- **Search Results**
  - Product Results
  - Creator Results
  - No Results State
- **Categories**
  - Category Landing (e.g., Home Décor)
    - Subcategory Landing (e.g., Wall Art)
- **Collections**
  - Collection Landing (e.g., "Wedding Gifts Under ₹2,000")
- **Creator Stores**
  - Creator Storefront (public profile + catalog)
    - Creator Reviews (aggregate, within storefront)
- **Product Detail**
  - Product Detail Page
    - Product Reviews (within product page)
    - Customization Panel (within product page)
- **Occasion & Festival Pages** *(SEO/editorial landing pages — see Section 17)*
- **About**
- **Legal**
  - Terms of Service
  - Privacy Policy
  - Refund & Cancellation Policy
  - Seller Agreement
  - Cookie Policy

### 3.2 Authentication Zone

- Sign Up
- Sign In
- Forgot Password
- Reset Password
- Verify Email
- Verify Phone *(if applicable)*
- Third-Party Sign-In Callback

### 3.3 Buyer Account Zone (Authenticated Buyer)

- Wishlist
- Cart
- Checkout
  - Address Step
  - Shipping Step
  - Review & Payment Step
  - Order Confirmation
- Orders
  - Order List
    - Order Detail
      - Sub-order Detail (per creator)
      - Track Shipment
      - Leave Review
      - Request Refund
      - Raise Support Ticket
- Messages (Buyer inbox, order-contextual threads)
- Notifications
- Profile & Settings
  - Personal Information
  - Saved Addresses
  - Payment Methods
  - Notification Preferences
  - Privacy & Data
  - Delete Account
- Become a Creator *(entry point into Creator Zone)*

### 3.4 Creator Zone (Authenticated Creator)

- Creator Onboarding
  - Application Form
  - Verification Status
- Creator Dashboard (home/overview)
  - Products
    - Product List
      - Create Product
      - Edit Product
  - Inventory
  - Orders
    - Order List
      - Order Detail
        - Customization Clarification Thread
        - Mark Shipped
  - Messages (Creator inbox)
  - Reviews (view + reply)
  - Analytics
  - Payouts
    - Payout History
    - Upcoming Payouts
  - Coupons & Promotions
  - Team Members
  - Storefront Settings
    - Story & Branding
    - Policies (shipping, lead time)
    - Pause Store
  - Delete Store

### 3.5 Support Zone (Buyer & Creator facing)

- Help Center / FAQ
- Contact Support
- Support Ticket List
  - Support Ticket Detail

### 3.6 Admin Zone (Internal — Admin / Super Admin)

- Admin Dashboard (overview)
- Creators
  - Creator Applications (review queue)
    - Application Detail
  - All Creators
    - Creator Detail (Admin view)
- Users (Buyers)
  - User Detail (Admin view)
- Orders (platform-wide)
  - Order Detail (Admin view)
- Payments & Refunds
  - Refund Queue
  - Payout Overview
- Categories (taxonomy management)
- Collections (curation management)
- Coupons & Promotions (platform-wide)
- CMS
  - Homepage Content
  - Legal Pages
  - Occasion/Festival Pages
- Analytics (platform-wide)
- Reports
- Settings (platform configuration — Super Admin)
- Audit Logs (Super Admin)
- Permissions & Roles (Super Admin)

### 3.7 Moderation Zone (Internal — Moderator / Admin)

- Moderation Queue (overview)
  - Flagged Listings
    - Listing Review Detail
  - Flagged Reviews
    - Review Moderation Detail
  - Flagged Storefronts
- Appeals Queue
  - Appeal Detail

### 3.8 Support Operations Zone (Internal — Support Executive)

- Support Queue (overview)
  - Ticket Detail (internal view)
- Escalations Queue

### 3.9 System / Error / Utility Zone

- 404 Not Found
- 500 Server Error
- 403 Forbidden
- 401 Unauthorized
- Offline Page (PWA)
- Maintenance Page
- Generic Error / Try Again
- Session Expired

---

# 4. Navigation Architecture

### 4.1 Global Navigation

Present on every buyer-facing page. Contains: logo/home link, search entry point, primary category/collection entry points, cart, wishlist, account/notifications menu.

| Element | Purpose | Visible To |
|---|---|---|
| Logo / Home | Return to Home from anywhere | All |
| Search | Global entry to Search Architecture (Section 10) | All |
| Categories menu | Entry to Category browsing | All |
| Collections link | Entry to curated Collections | All |
| Wishlist icon | Entry to Wishlist | Guest (session), Buyer (persistent) |
| Cart icon | Entry to Cart | Guest (session), Buyer (persistent) |
| Account menu | Sign in/up (Guest) or account/orders/settings (Buyer) | All (contents vary) |
| "Become a Creator" | Entry to Creator onboarding | Guest, Buyer without a Creator profile |

### 4.2 Primary Navigation

The top-level structural choices within Global Navigation: **Home, Categories, Collections, Search**. These represent the four core discovery paths identified in `03-user-journeys.md` Sections 3.4–3.6, and no additional top-level items should be added without strong justification, to preserve minimal cognitive load.

### 4.3 Secondary Navigation

Appears within a primary section to organize its sub-structure — e.g., subcategory tabs within a Category page, or filter/sort controls within Search Results. Secondary navigation is contextual and disappears when the user leaves that section.

### 4.4 Footer Navigation

Present on every public page. Contains: About, Legal (Terms, Privacy, Refund Policy), Help Center, Contact Support, Become a Creator, social links, and a sitemap-style link cluster to major categories for SEO and discoverability purposes.

### 4.5 Context Navigation

Appears within a specific object's page to navigate related content without leaving that context — e.g., "More from this creator" within a Product Detail page, or "Similar products" within an unavailable-item state.

### 4.6 Breadcrumb Navigation

See Section 13 for full breadcrumb strategy. Present on all Category, Collection, Product, Creator Storefront, Search Result, and Dashboard-nested pages; absent on Home, Cart, and Checkout (single-focus flows where backward navigation via breadcrumb would undermine focus).

### 4.7 Dashboard Navigation

A persistent side or top navigation specific to Creator and Admin contexts, structurally separate from the Global Navigation buyers see. See Sections 6, 7, and 15 for full detail. Dashboard Navigation does not show buyer-facing elements (cart, wishlist) since it represents a distinct operating context.

### 4.8 Admin Navigation

A persistent side navigation for Admin/Super Admin covering the zones defined in Section 3.6, scoped per the permissions model in Section 16.

### 4.9 Creator Navigation

A persistent side navigation for Creator/Creator Team Member covering the zones defined in Section 3.4, scoped per team member permissions (Section 16).

### 4.10 Support Navigation

A persistent navigation for Support Executives covering their ticket queue, escalations, and (read-scoped) reference views into orders/payments needed for resolution.

### 4.11 Mobile / Tablet / Desktop Navigation

| Breakpoint | Primary Pattern | Notes |
|---|---|---|
| Mobile | Bottom navigation (Home, Search, Wishlist, Cart, Account) + slide-out drawer for Categories/Collections/Support | See Section 18 for full mobile IA. |
| Tablet | Condensed top navigation with collapsible category menu; dashboard contexts use a collapsible side rail. | Balances mobile's space constraints with desktop's persistent navigation. |
| Desktop | Persistent top navigation bar (Global Navigation) with full category mega-menu; dashboard contexts use a persistent left-side navigation. | Full navigation is always visible; no collapsing except optional dashboard rail collapse. |

### 4.12 PWA Navigation

Mirrors mobile navigation, with the addition of an Offline state indicator and a Maintenance/connectivity-aware fallback (see Sections 3.9, 19).

### 4.13 Guest vs. Authenticated Navigation

| Element | Guest | Buyer | Creator (in Creator context) |
|---|---|---|---|
| Account menu contents | Sign In / Sign Up | Orders, Wishlist, Settings, Become a Creator | Orders, Wishlist, Settings, Switch to Creator Dashboard |
| Cart/Wishlist | Session-only | Persistent | Persistent (as Buyer identity) |
| Messages | Not available | Buyer inbox | Creator inbox (in Creator context) |
| Dashboard access | Not available | Not available (unless also a Creator) | Full Creator Dashboard |

### 4.14 Role-Based Navigation Visibility Rules

Navigation visibility strictly follows the role and permission model defined in `01-product-requirements.md` Section 3 and detailed further in Section 16 of this document. The governing rule: **navigation only ever exposes destinations a given role is permitted to act on** — restricted destinations are not shown in a disabled state, since a visible-but-disabled item invites confusion and implies a missing feature rather than a permission boundary.

---

# 5. Buyer Information Architecture

Every buyer-facing page is mapped below for hierarchy level, entry/exit points, relationships, common paths, and dead-end risk. "Dead-end risk" identifies pages that could strand a user without a clear next action, and the mitigation the IA applies.

| Page | Hierarchy Level | Entry Points | Exit Points | Relationships / Dependencies | Common Path | Dead-End Mitigation |
|---|---|---|---|---|---|---|
| Home | Top-level | Direct URL, external link, logo click | Categories, Collections, Search, any featured product/creator | Depends on CMS-curated content (Section 3.1) | Home → Collection → Product → Cart | N/A (always has forward paths) |
| Search Results | Top-level | Global search bar | Product Detail, Creator Storefront | Depends on Categories/Product data | Search → filter/sort → Product Detail | Zero-result state offers suggestions/related categories (Section 10) |
| Category Landing | Second-level (under Home) | Global nav, Home links, breadcrumb from subcategory | Subcategory, Product Detail | Depends on Admin taxonomy (Section 8) | Home → Category → Subcategory → Product | Empty category shows related categories, not a dead page |
| Collection Landing | Second-level | Home feature, marketing link, category feature | Product Detail | Depends on Admin curation | Home → Collection → Product → Cart | Expired collection redirects to an active related collection |
| Creator Storefront | Second-level | Product Detail link, Search, shared link | Product Detail (within store), Messages (inquiry) | Depends on Verification status | Product → Storefront → another Product | Suspended storefront shows a clear status message, not a broken page |
| Product Detail | Third-level | Category, Collection, Search, Storefront, Wishlist, shared link | Cart, Storefront, Wishlist, Reviews | Depends on Inventory, Customization, Reviews | Product → Customize → Add to Cart | Sold-out state offers "notify me" and similar products |
| Wishlist | Second-level (Account) | Global nav icon | Product Detail, Cart | Depends on Account persistence (Buyer) | Product → Wishlist → (later) Cart | Empty wishlist shows a prompt to browse Collections |
| Cart | Second-level | Global nav icon, Add to Cart action | Checkout, Product Detail (edit) | Depends on Product/Inventory validity | Product → Cart → Checkout | Empty cart shows a prompt to browse Home/Categories |
| Checkout (Address/Shipping/Review/Payment) | Third-level (linear flow) | Cart "Checkout" action | Order Confirmation | Depends on Cart validity, Payments, Coupons | Cart → Checkout steps → Confirmation | Failure at any step preserves state and returns to the same step, never a full restart |
| Order Confirmation | Third-level | Automatic post-payment | Order Detail, Home (continue browsing) | Depends on completed Payment | Payment → Confirmation → Orders | N/A (always offers next action) |
| Orders (list) | Second-level (Account) | Account menu, Order Confirmation link | Order Detail | Depends on Buyer authentication | Account → Orders → Order Detail | Empty state (no orders yet) prompts browsing |
| Order Detail | Third-level | Orders list, notification link | Track Shipment, Leave Review, Request Refund, Raise Support Ticket | Depends on Order/Sub-order state (Section 8 of PRD) | Orders → Order Detail → Track Shipment | N/A |
| Messages | Second-level (Account) | Account menu, Order Detail (contextual) | Order Detail (return) | Depends on Order context | Order Detail → Messages → back to Order | Empty inbox explains messaging is order-contextual |
| Notifications | Second-level (Account) | Global nav icon | Relevant Order/Message/Wishlist page | Depends on triggering event | Notification → linked page | Empty state explains what will appear here |
| Settings / Profile | Second-level (Account) | Account menu | Sub-settings pages | Depends on Buyer authentication | Account → Settings → specific setting | N/A |
| Become a Creator | Second-level (Account) | Account menu, marketing CTA | Creator Onboarding | Depends on existing Buyer account (or new signup) | Account → Become a Creator → Onboarding | N/A |

### 5.1 Common Buyer Paths

1. **Discovery-led purchase:** Home → Collection/Category/Search → Product Detail → Add to Cart → Checkout → Confirmation.
2. **Trust-led purchase:** Product Detail → Creator Storefront → (browse more) → back to original or new Product → Cart → Checkout.
3. **Gifting-planning path:** Product Detail → Wishlist → (return later) → Wishlist → Cart → Checkout.
4. **Post-purchase support path:** Orders → Order Detail → Raise Support Ticket / Request Refund.
5. **Repeat purchase path:** Account/Orders or direct Creator Storefront revisit → Product Detail → Cart → Checkout (accelerated via saved address/payment).

### 5.2 Dead-End Review

Per the IA principle of Discoverability (Section 2), no page in the Buyer IA should leave a user without a clear next action. The mitigations column above documents how each higher-risk page (empty states, unavailable content, failure states) is handled. This review should be repeated whenever a new buyer-facing page is added.

---

# 6. Creator Information Architecture

| Page | Purpose | Navigation Placement | Relationships |
|---|---|---|---|
| Creator Dashboard (Overview) | Central summary of pending actions and performance | Root of Creator Navigation | Links out to Products, Orders, Messages, Analytics |
| Products (list) | View and manage full catalog | Creator Navigation, primary item | Links to Create/Edit Product |
| Create Product | Add a new listing | From Products list | Depends on Storefront Settings (defaults), Categories |
| Edit Product | Modify an existing listing | From Products list, from Product detail row | Depends on existing listing data |
| Inventory | Manage stock/capacity across listings | Creator Navigation, primary item | Depends on Products |
| Orders (list) | View and manage incoming orders | Creator Navigation, primary item | Links to Order Detail |
| Order Detail | Manage a specific order/sub-order | From Orders list, from Dashboard alerts | Links to Customization Clarification (Messages), Mark Shipped |
| Messages | Order-contextual buyer communication | Creator Navigation, primary item | Depends on Orders, Product inquiries |
| Reviews | View and reply to buyer reviews | Creator Navigation, primary item | Depends on completed Orders |
| Customization Requests | Orders/messages requiring clarification, surfaced distinctly | Dashboard alert + filtered Orders/Messages view | Depends on Orders in "Awaiting Clarification" state |
| Analytics | Performance reporting | Creator Navigation, primary item | Depends on Orders, Products, Reviews data |
| Payouts | View payout history and schedule | Creator Navigation, primary item | Depends on completed Orders |
| Coupons | Manage storefront-level promotions | Creator Navigation, secondary item (under Storefront Settings or standalone) | Depends on platform-wide coupon guardrails (Admin) |
| Team Members | Manage delegated access | Creator Navigation, under Storefront Settings | Depends on Storefront ownership |
| Storefront Settings | Story, branding, policies, pause | Creator Navigation, primary item | Depends on Verification status |
| Verification | View/manage verification status | Creator Navigation, under Storefront Settings, or a persistent banner if incomplete | Gates Storefront/Products visibility |
| Profile | Creator's personal account settings (distinct from storefront brand) | Creator Navigation, account-level menu | Shared with Buyer profile if same account |

### 6.1 Creator IA Notes

- The Creator Dashboard is intentionally a **distinct navigational context** from the Buyer account area, reflecting the "Creator First" principle (Section 2) — creators should never feel like they are operating inside a buyer-oriented interface.
- **Customization Requests** is both a standalone concept and a filtered view of Orders/Messages — it exists as a first-class navigation item because of its outsized importance identified in `03-user-journeys.md` (4.9) and its emotional weight for creators managing time-sensitive craftsmanship.
- A user with both Buyer and Creator profiles switches contexts via a single, clearly labeled control, never through separate accounts (per `01-product-requirements.md` AUTH-06).

---

# 7. Admin Information Architecture

| Page | Purpose | Navigation Placement | Relationships |
|---|---|---|---|
| Admin Dashboard (Overview) | Summary of pending operational actions and platform health | Root of Admin Navigation | Links to all zones below |
| Creator Applications | Review queue for new creators | Admin Navigation, under Creators | Links to Application Detail |
| Application Detail | Full review view for a single application | From Creator Applications | Links to Approve/Reject actions |
| All Creators | Full creator directory (Admin view) | Admin Navigation, under Creators | Links to Creator Detail (Admin) |
| Creator Detail (Admin) | Full operational view of a specific creator | From All Creators, from escalations | Links to Orders, Payments, Moderation history for that creator |
| Users (Buyers) | Buyer account directory (Admin view) | Admin Navigation, primary item | Links to User Detail |
| User Detail (Admin) | Full operational view of a specific buyer account | From Users list, from escalations | Links to Orders, Support history for that buyer |
| Orders (platform-wide) | Full order directory across all creators | Admin Navigation, primary item | Links to Order Detail (Admin) |
| Refund Queue | Pending refund/dispute review | Admin Navigation, under Payments | Links to Order/Payment Detail |
| Payout Overview | Platform-wide payout status | Admin Navigation, under Payments | Depends on Orders, Creator payout schedules |
| Categories | Taxonomy management | Admin Navigation, primary item | Feeds Buyer Category IA (Section 5) |
| Collections | Curation management | Admin Navigation, primary item | Feeds Buyer Collection IA (Section 5) |
| Coupons (platform-wide) | Platform promotion management | Admin Navigation, primary item | Feeds Buyer Checkout (coupon application) |
| CMS | Editorial and legal content management | Admin Navigation, primary item | Feeds Homepage, Legal, Occasion pages |
| Analytics (platform-wide) | Aggregate KPI reporting | Admin Navigation, primary item | Depends on all transactional data |
| Reports | Scheduled/exportable reporting views | Admin Navigation, under Analytics | Depends on Analytics data |
| Settings (Super Admin) | Platform-wide policy configuration | Admin Navigation, Super Admin only | Governs Coupons, Verification, Commission-related structural rules |
| Audit Logs (Super Admin) | Full action log across internal roles | Admin Navigation, Super Admin only | Depends on all logged internal actions |
| Permissions & Roles (Super Admin) | Manage internal role assignments | Admin Navigation, Super Admin only | Governs visibility across the entire Admin/Moderator/Support IA |

### 7.1 Admin IA Notes

- Admin Navigation is intentionally flatter than Creator Navigation in its top level (fewer, broader groupings) since Admin users operate across many entity types daily and need fast lateral movement, not deep hierarchy.
- Every "platform-wide" Admin page (Orders, Analytics) has a corresponding scoped equivalent in the Creator or Buyer IA — the Admin version is a superset view, never a structurally different one, to keep mental models consistent across roles.

---

# 8. Content Taxonomy

The taxonomy is composed of independent but related classification systems. A single listing is typically tagged across several of these dimensions simultaneously, enabling flexible discovery beyond a single rigid hierarchy.

| Taxonomy | Purpose | Example Values | Relationship to Other Taxonomies |
|---|---|---|---|
| **Categories / Subcategories** | Primary structural browsing hierarchy | Home Décor > Wall Art; Jewelry > Earrings | Every listing must belong to exactly one primary Category/Subcategory (Section 4.4 of `01-product-requirements.md`, CAT-01) |
| **Collections** | Editorial, cross-category groupings | "Wedding Gifts," "Under ₹2,000" | Independent of Category; a listing can appear in multiple Collections |
| **Occasions** | Gifting-context tagging | Birthday, Wedding, Housewarming, Anniversary | Maps directly to Journey Triggers (`02-user-personas.md` Section 11); drives Occasion Pages (Section 17) |
| **Materials** | Physical composition tagging | Wood, Ceramic, Cotton, Brass | Applies primarily to physical, handmade categories |
| **Techniques** | Craft process tagging | Hand-thrown, Block-printed, Hand-embroidered | Reinforces authenticity/disclosure promise (PDP-03) |
| **Styles** | Aesthetic tagging | Minimalist, Traditional, Boho, Contemporary | Supports Design Collector persona's aesthetic-led discovery (`02-user-personas.md` 3.3) |
| **Price Bands** | Budget-oriented filtering | Under ₹1,000; ₹1,000–₹3,000; ₹3,000+ | Independent, derived from listing price at query time |
| **Gift Types** | Gifting-intent tagging | Personalized Gift, Group Gift, Self-Purchase-Friendly | Overlaps with Occasions but distinct (a non-occasion "just because" gift) |
| **Recipient Types** | Who the product suits | For Her, For Him, For Kids, For Couples, For Pets | Supports Meaningful Gift Buyer discovery patterns |
| **Rooms** | Home-décor-specific spatial tagging | Living Room, Bedroom, Kitchen, Entryway | Applies to Home Décor category tree only |
| **Festivals** | Culturally/regionally specific occasion tagging | Diwali, Raksha Bandhan, Christmas | Subset of Occasions with strong seasonal scheduling behavior (see CMS Section 4.2, HOME-03) |
| **Themes** | Cross-cutting curatorial concepts | "Meet the Maker," "Sustainable Materials" | Used primarily to power Collections, not standalone browsing |
| **Colors** | Visual attribute tagging | Blue, Terracotta, Multicolor | Applies where visually relevant (excludes purely functional categories) |
| **Sizes** | Physical dimension tagging | Small/Medium/Large, or precise measurements | Category-dependent; some categories (jewelry) use different size logic than others (furniture) |
| **Availability** | Stock/production status | In Stock, Made to Order, Sold Out | Derived from Inventory Management (Section 4.19 of PRD), not manually tagged |
| **Customization** | Personalization availability flag | Customizable, Not Customizable | Derived from listing configuration (Section 4.14 of PRD) |
| **Handmade Certification** | Authenticity/verification signal | Verified Handmade, Verified Made-to-Order | Derived from Creator Verification status (Section 8.7 of PRD), not self-declared alone |
| **Creator Tags** | Creator-level descriptive tagging | Solo Artisan, Small Studio, Sustainable Practice | Applied at storefront level, inherited by all of a creator's listings for discovery purposes |
| **Search Tags** | Internal synonyms/keywords aiding search relevance | e.g., "housewarming" mapped to Home Décor + Occasion | Powers Search Architecture (Section 10), not user-visible as a browsing structure |
| **SEO Tags** | Metadata supporting organic search | Title tags, meta descriptions per page type | See Section 17 |
| **Trending Tags** | Time-sensitive popularity signals | "Trending this week" | Computed, not manually curated; time-bound |
| **Future Tags** | Reserved extension point | Sustainability certifications, regional origin tags | Not active in v2; taxonomy is structured to accommodate future tag types without redesign |

### 8.1 Taxonomy Relationships

- **Category** is the only mandatory, singular classification every listing must have; all other taxonomies are additive metadata layered on top.
- **Collections** are manually curated using any combination of the other taxonomies as selection criteria (e.g., a "Diwali Home Décor" collection combines Category = Home Décor + Festival = Diwali).
- **Availability** and **Handmade Certification** are system-derived, not creator-editable text fields, to preserve trust integrity (consistent with `01-product-requirements.md` Section 7.1, 7.5).
- Taxonomy is designed to be **extensible without restructuring**: new values can be added to any taxonomy (e.g., a new Occasion) without affecting the structure of Categories or any other taxonomy.

---

# 9. Product Classification

| Classification | Definition | IA Implication |
|---|---|---|
| **Physical Products** | Tangible handmade or made-to-order goods, the default and dominant classification. | Standard Product Detail structure applies fully (Section 14.2). |
| **Digital Products** | Downloadable goods (if offered), out of primary scope but structurally reserved. | Requires a distinct disclosure label and non-returnable policy notice (Section 7.13 of PRD); flagged as a Future Product variant for v2 unless explicitly scoped. |
| **Made to Order** | Produced only after purchase, per buyer specification or standard creator design. | Product Detail must surface lead-time prominently; Availability taxonomy reflects capacity, not stock count. |
| **Ready to Ship** | Held in stock, ships without a production step. | Product Detail surfaces stock-based availability and standard shipping estimate. |
| **Limited Edition** | Produced in a capped, non-repeating quantity. | Requires a distinct badge/labeling in taxonomy (Trending/Limited overlap) and urgency-appropriate (but honest) availability messaging. |
| **One of a Kind** | A single, non-repeatable unique item. | Once sold, the listing is archived rather than restocked; Product Detail should clearly communicate uniqueness. |
| **Gift Sets** | Multiple items bundled and sold as a single listing. | Treated as a single product for cart/checkout purposes; internal composition may be described but not separately purchasable. |
| **Custom Orders** | Fully bespoke, typically requiring direct creator-buyer discussion beyond standard customization fields. | May rely more heavily on Messaging (pre-purchase inquiry) than the standard Customization panel; still must resolve to a standard listing and price before purchase. |
| **Subscription Products** | Recurring periodic delivery. | **Out of scope for v2** (per `01-product-requirements.md` Section 14); reserved as a Future Product classification (Section 21). |
| **Future Products** | Placeholder classification for wholesale lots, gift registry contributions, and other models identified in Section 21. | Not active in v2; taxonomy and classification structure should not preclude their future addition. |

---

# 10. Search Architecture

| Element | Definition | Behavior |
|---|---|---|
| **Search Entry Points** | Where a search can be initiated | Global navigation search bar (persistent on every page), Homepage search prompt, "Search this store" within a Creator Storefront (scoped variant). |
| **Search Suggestions** | Predictive suggestions shown as the user types | Blends matching products, creators, and categories; prioritizes previously successful query patterns. |
| **Autocomplete** | Completing a partial query | Suggests full queries and direct navigational shortcuts (e.g., typing "jewe" suggests "Jewelry" category). |
| **Synonyms** | Mapping colloquial terms to catalog taxonomy | e.g., "housewarming gift" maps to Home Décor category + Housewarming occasion tag, per Search Tags (Section 8). |
| **Spelling Correction** | Handling typos and near-matches | Fuzzy matching surfaces relevant results for minor misspellings without requiring an exact match. |
| **Recent Searches** | A buyer's own search history | Shown for signed-in Buyers as a quick-access shortcut at the start of a new search session. |
| **Trending Searches** | Platform-wide popular queries | Surfaced to Guests and Buyers with no search history yet, as a starting point. |
| **Popular Searches** | Sustained (not just trending/short-term) high-frequency queries | Used to inform Category/Collection curation priorities, not necessarily shown directly to users. |
| **Category Search** | Search scoped to a specific category context | Available as a refinement within a Category Landing page. |
| **Creator Search** | Search specifically for creators/storefronts, not products | A distinct result type within global Search Results, not a separate search bar. |
| **Product Search** | The default, dominant search type | Standard global search behavior. |
| **Collection Search** | Finding relevant curated Collections | Collections surfaced within Search Results when a query strongly matches a Collection's theme (e.g., "wedding gifts"). |
| **Filtering Strategy** | See Section 11 | Applied post-search to narrow results. |
| **Sorting Strategy** | Relevance (default), Newest, Price (asc/desc), Rating | Rating sort accounts for minimum review count to prevent single-review distortion (per `01-product-requirements.md` SRCH-03). |
| **Zero Result Strategy** | What happens when a query returns nothing | Shows spelling suggestions, related categories, and an option to be notified if matching products become available. |
| **Search Recovery** | Helping a user recover from an unproductive search | Prominent filter-clearing, alternative query suggestions, and a path back to Category/Collection browsing as an alternative discovery mode. |

---

# 11. Filtering Strategy

| Filter | Applies To | Notes |
|---|---|---|
| Category | Search Results, cross-category browsing | Allows narrowing a broad search into a specific Category. |
| Price | Search Results, Category, Collection pages | Uses Price Band taxonomy (Section 8) plus a custom range option. |
| Color | Search Results, Category pages (where visually relevant) | Excluded for categories where color isn't a meaningful attribute. |
| Material | Search Results, Category pages | Derived from Materials taxonomy. |
| Size | Search Results, Category pages | Category-dependent value sets (Section 8). |
| Availability | Search Results, Category, Collection pages | In Stock / Made to Order / filters out Sold Out by default, with an option to include it. |
| Delivery Time | Search Results, Category pages | Filters by estimated lead time bands (e.g., "Ships within a week"). |
| Customization | Search Results, Category pages | Boolean filter: Customizable listings only. |
| Occasion | Search Results, Category, Collection pages | Derived from Occasions taxonomy. |
| Recipient | Search Results, Category pages | Derived from Recipient Types taxonomy. |
| Rating | Search Results, Category pages | Minimum star-rating threshold, with minimum review count safeguard. |
| Creator | Search Results | Narrows results to a specific creator, most useful when searching within an already-identified creator's broader catalog context. |
| Newest | Sort, not filter | Surfaces recently published listings. |
| Popularity | Sort, not filter | Based on aggregate engagement signals (Section 20 of Analytics, ANLY-02/03). |
| Best Selling | Sort, not filter | Based on completed order volume. |
| Trending | Filter/badge | Time-bound, computed signal (Trending Tags, Section 8). |
| Limited Edition | Filter/badge | Derived from Product Classification (Section 9). |
| Handmade Verified | Filter, default-on where applicable | Reinforces the platform's core trust promise; since verification is a baseline requirement for all listings, this filter is primarily relevant if any non-verified content type is introduced in the future. |
| Future Filters | Reserved | Sustainability certification, regional origin, and other filters identified in Section 21 are not active in v2 but the filter architecture (independent, combinable, AND-logic per SRCH-02) accommodates their future addition without restructuring. |

**Filter combination rule:** all active filters combine using AND logic within a browsing/search context, consistent with `01-product-requirements.md` SRCH-02. Filter state persists across pagination within the same session/query and is clearable individually or entirely.

---

# 12. URL Architecture

URLs are structured to be human-readable, descriptive, stable, and SEO-friendly, independent of any specific technology choice.

| URL Type | Pattern (illustrative) | Notes |
|---|---|---|
| Home | `/` | — |
| Category | `/categories/{category-slug}` | Subcategories nest: `/categories/{category-slug}/{subcategory-slug}` |
| Collection | `/collections/{collection-slug}` | Slug reflects the collection's editorial name |
| Creator Storefront | `/creators/{creator-slug}` | Slug derived from storefront name, unique per creator |
| Product | `/creators/{creator-slug}/products/{product-slug}` | Nesting under the creator reinforces the "brand-led" IA principle and produces a naturally unique, descriptive URL |
| Search Results | `/search?q={query}` | Query parameters carry filters/sort state for shareable, bookmarkable result sets |
| Dashboard (Creator) | `/dashboard/{section}` (e.g., `/dashboard/orders`) | Not indexed by search engines |
| Dashboard (Admin) | `/admin/{section}` | Not indexed by search engines; access-restricted |
| Support | `/support/{topic-or-ticket-id}` | Public Help Center content is SEO-indexable; ticket-specific pages are not |
| Authentication | `/sign-in`, `/sign-up`, `/reset-password` | Not indexed by search engines |
| Settings | `/account/settings/{section}` | Not indexed by search engines |
| Occasion/Festival Pages | `/occasions/{occasion-slug}` | SEO-oriented landing pages (Section 17) |

### 12.1 Canonical Rules

- Every publicly indexable page has exactly one canonical URL; filter/sort query parameters on Search and Category pages do not create separate canonical pages, preventing duplicate-content dilution.
- Product URLs remain stable even if the listing's title is edited; slug changes (if ever necessary) preserve a redirect from the old URL.
- Creator storefront slugs are unique platform-wide and stable for the lifetime of the storefront to preserve external links and SEO equity.

### 12.2 Future URL Strategy

- Localized URL structures (e.g., locale-prefixed paths) are reserved for future international expansion (Section 21) but not required for v2's single-market launch.
- Wholesale, corporate, and other future buyer types (Section 21) would receive their own top-level URL namespace (e.g., `/business/`) rather than being retrofitted into the individual-buyer URL structure.

---

# 13. Breadcrumb Strategy

| Context | Breadcrumb Pattern | Notes |
|---|---|---|
| Categories | Home > Category > Subcategory | Always reflects the taxonomy path, not the user's actual click path |
| Products | Home > Category > Subcategory > Product **or** Home > Creator > Product (when arrived via storefront) | Reflects primary Category by default; if arrived via a Creator Storefront, breadcrumb reflects that context instead, per Recognition-over-Recall |
| Collections | Home > Collections > Collection Name | Collections sit outside the Category hierarchy, so breadcrumb reflects that independence |
| Creator Stores | Home > Creators > Creator Name | "Creators" as an intermediate crumb supports future creator-directory browsing (Section 21) |
| Search Results | Home > Search Results for "{query}" | No deeper nesting; search is treated as a lateral, not hierarchical, path |
| Dashboards (Creator/Admin) | Dashboard > Section > Sub-section (e.g., Dashboard > Products > Edit Product) | Distinct breadcrumb root ("Dashboard," not "Home") to reinforce the separate operating context |
| Support | Help Center > Topic > Article, or Support > Ticket #{id} | Public Help Center content uses topic breadcrumbs; ticket views use a simpler "Support > Ticket" pattern |
| Legal | Legal > Document Name | Flat, single-level structure given the small number of legal pages |
| Custom Flows (Checkout, Onboarding) | No breadcrumb; a linear step indicator is used instead | Breadcrumbs imply lateral exploration, which would undermine focus in a single-purpose linear flow (per Minimal Cognitive Load) |

---

# 14. Content Hierarchy

### 14.1 Homepage
1. Primary occasion/seasonal hero content (highest visual and structural priority)
2. Featured Collections
3. Featured/verified Creators
4. Category entry points
5. Personalized content (returning buyer only — recently viewed, wishlist-related)
6. Footer (legal, support, sitemap links)

### 14.2 Product Page
1. Product imagery (primary visual anchor)
2. Title, price, availability status
3. Handmade/made-to-order disclosure (structurally prioritized per Trust First principle)
4. Customization panel (if applicable)
5. Description and details (materials, technique, size)
6. Creator identity and link to storefront
7. Reviews
8. Related/similar products from the same or related creators

### 14.3 Creator Page
1. Storefront identity (name, imagery, verification badge)
2. Creator story
3. Aggregate rating and review summary
4. Full catalog grid
5. Storefront policies (shipping, customization availability)
6. Contact/inquiry option (Buyer only)

### 14.4 Category Page
1. Category title and brief editorial framing (optional, CMS-driven)
2. Subcategory navigation
3. Filter and sort controls
4. Product grid
5. Related Collections (cross-promotion)

### 14.5 Collection Page
1. Collection title and editorial story/framing
2. Curated product grid (manually ordered, not algorithmically sorted by default)
3. Related Collections

### 14.6 Search Page
1. Query restatement and result count
2. Filter and sort controls
3. Result grid (products and, where relevant, creators)
4. Zero-result guidance (when applicable)

### 14.7 Dashboard (Creator/Admin)
1. Time-sensitive alerts/pending actions (highest priority — see Section 15)
2. Key performance summary
3. Section-specific navigation to deeper content

### 14.8 Support
1. Ticket status and summary
2. Conversation/resolution thread
3. Related order/account context
4. Escalation/reopen actions

### 14.9 Authentication
1. Primary action (sign in / sign up form)
2. Alternative path (switch between sign in/up, third-party options)
3. Legal consent (Terms/Privacy, at registration only)

---

# 15. Dashboard Information Architecture

| Dashboard | Primary Navigation Sections | Key Widgets | Section Priority Order |
|---|---|---|---|
| **Buyer Dashboard** *(Account area)* | Orders, Wishlist, Messages, Settings | Recent orders, wishlist highlights | Orders > Messages > Wishlist > Settings |
| **Creator Dashboard** | Products, Orders, Inventory, Messages, Reviews, Analytics, Payouts, Coupons, Team, Storefront Settings | New orders needing action, low-stock alerts, unread messages, pending clarifications, upcoming payout | Pending Actions > Orders > Messages > Products/Inventory > Analytics > Payouts > Settings |
| **Admin Dashboard** | Creators, Users, Orders, Payments/Refunds, Categories, Collections, Coupons, CMS, Analytics, Reports | Pending creator applications, flagged content queue size, refund queue size, platform health indicators | Pending Applications > Moderation/Refund Queues > Platform Health > Catalog/Content Management |
| **Moderator Dashboard** | Flagged Listings, Flagged Reviews, Flagged Storefronts, Appeals | Queue size by severity, SLA-at-risk items | SLA-at-risk items > High-severity flags > Standard queue > Appeals |
| **Support Dashboard** | Ticket Queue, Escalations | Unassigned tickets, SLA-at-risk tickets, personal open ticket count | SLA-at-risk > Unassigned > My Open Tickets > Escalations |
| **Super Admin Dashboard** | All Admin sections, plus Settings, Audit Logs, Permissions | Platform-wide KPIs, policy change log, escalated/high-severity items requiring final authority | Escalated Decisions > Platform KPIs > Policy/Configuration > Audit Logs |

### 15.1 Dashboard Design Notes

- Every dashboard leads with **pending, time-sensitive action items** before performance/summary data, consistent with the operational urgency identified across internal personas in `02-user-personas.md` Section 5.
- New Creators and new internal role holders see a **guided zero-state** rather than an empty dashboard, consistent with `01-product-requirements.md` CDASH-01 and ANLY-01.
- Widgets are scoped strictly to what a role can act on — a widget is never shown purely for visibility if the viewing role has no corresponding action available (reinforcing the Role-Based Navigation principle, Section 4.14).

---

# 16. Permissions-Based Architecture

| Role | Accessible Pages | Hidden Pages | Restricted Pages | Conditional Navigation |
|---|---|---|---|---|
| **Guest** | Home, Search, Categories, Collections, Product Detail, Creator Storefront, Cart (session), Wishlist (session), Authentication, Legal, Support (Help Center only) | Buyer Account Zone, Creator Zone, Admin/Moderation/Support Operations Zones | Checkout (guest-eligible variant only; full account-based checkout requires sign-in or guest checkout path) | "Become a Creator" redirects to Sign Up first |
| **Buyer** | All Guest pages, plus Buyer Account Zone (Orders, Wishlist persistent, Messages, Notifications, Settings) | Creator Zone (until they apply), Admin/Moderation/Support Operations Zones | None beyond role boundary | "Become a Creator" becomes directly accessible; post-approval, a Dashboard switch control appears |
| **Creator** | All Buyer pages (as their Buyer identity) plus full Creator Zone | Admin/Moderation/Support Operations Zones | Cannot view another creator's Dashboard, Orders, Analytics, or Payouts | Dashboard switch control toggles between Buyer and Creator context |
| **Creator Team Member** | Scoped subset of Creator Zone per assigned role template | Admin/Moderation/Support Operations Zones, and any Creator Zone section not granted (e.g., Payouts, Team Members by default) | Cannot invite/remove team members or access financial settings unless explicitly granted | Navigation dynamically reflects only granted sections |
| **Moderator** | Moderation Zone (Section 3.7) | Admin financial pages (Payments, Payouts, Settings), Support Operations Zone, Buyer/Creator Zones | Cannot access payment/payout data | Escalation actions surface an Admin-handoff path rather than direct access to restricted pages |
| **Support Executive** | Support Operations Zone (Section 3.8), scoped read access to relevant Order/Account/Payment (non-sensitive) data during ticket handling | Admin CMS, Categories, Collections, Settings, Audit Logs, Permissions | Cannot modify listings, storefronts, or platform settings; refund actions capped at policy-defined limits | Escalation actions surface an Admin-handoff path for cases beyond authority |
| **Admin** | Admin Zone (Section 3.6), Moderation Zone (oversight) | Super-Admin-only pages: platform-wide Settings, Audit Logs, Permissions & Roles | Cannot modify commission/payout structure or platform-wide policy without Super Admin | Escalation actions surface a Super-Admin-handoff path for out-of-authority decisions |
| **Super Admin** | All pages platform-wide | None | None (full access, with all sensitive actions logged and often requiring secondary confirmation) | — |

### 16.1 Conditional Navigation Principles

- Navigation items are **added or removed based on role and state**, never merely disabled-in-place, consistent with Section 4.14.
- A single account holding both Buyer and Creator identities sees a **context switch**, not two separate, parallel navigation systems running simultaneously.
- Internal roles never see buyer/creator-facing navigation elements (cart, wishlist) while operating in their internal context, reinforcing a clean separation of operating modes.

---

# 17. SEO Architecture

### 17.1 Indexable Page Hierarchy

| Page Type | Indexable | Priority | Notes |
|---|---|---|---|
| Home | Yes | Highest | Primary domain authority anchor |
| Category / Subcategory | Yes | High | Core organic entry point for broad, high-volume search terms |
| Collection | Yes | High | Captures long-tail, intent-rich queries (e.g., "wedding gifts under 2000") |
| Creator Storefront | Yes | Medium-High | Supports creator-name and brand-specific search |
| Product Detail | Yes | High (long-tail volume) | Largest page count; strongest long-tail SEO contributor |
| Occasion / Festival Pages | Yes | High (seasonal) | Editorial landing pages targeting occasion-specific search intent |
| Guides (Future) | Yes | Medium | Reserved for future content marketing (Section 21) |
| Legal Pages | Yes | Low | Indexable for transparency/trust but not a growth driver |
| Search Results | No (or canonicalized) | — | Prevents thin/duplicate-content indexation |
| Dashboards, Settings, Checkout, Authentication | No | — | Private/transactional, excluded from indexation |

### 17.2 Landing Pages

- **Home** functions as the primary landing page for brand and generic category queries.
- **Occasion Pages** (e.g., `/occasions/wedding-gifts`) and **Festival Pages** (e.g., `/occasions/diwali`) are purpose-built SEO landing pages combining editorial framing with a curated, filtered product view — directly serving the "buyers search by occasion, not product name" insight from `02-user-personas.md` Section 14.1.
- **Category** and **Collection** pages serve as secondary landing pages for more specific intent.

### 17.3 Canonical Structure

- Each Product page is canonical at its creator-nested URL (Section 12); if a product is ever surfaced via multiple contextual paths (category + collection), the canonical tag always points to the single authoritative Product URL.
- Search Results pages are non-canonical/noindex to avoid diluting authority across near-duplicate filtered views.

### 17.4 Internal Linking Strategy

- Every Product page links to its Category, its Creator Storefront, and related/similar products, ensuring strong internal link density supporting crawl discovery.
- Every Category page links to relevant Collections and vice versa, reinforcing topical clustering.
- Footer navigation (Section 4.4) provides a persistent, site-wide link cluster to top-level Categories, supporting crawl efficiency to deep catalog pages.
- Occasion/Festival pages link into relevant Categories and Collections, creating a strong topical bridge between editorial and structural content.

### 17.5 Schema Opportunities

| Page Type | Relevant Structured Data Concepts |
|---|---|
| Product Detail | Product, Offer, AggregateRating, Review |
| Creator Storefront | Organization/Person (as applicable), AggregateRating |
| Collection / Occasion Pages | ItemList, CollectionPage |
| Home | WebSite, SearchAction (sitelinks search box) |
| Legal Pages | WebPage |

*(Structured data implementation itself is an engineering concern; this section identifies opportunity areas only, per this document's IA-only scope.)*

---

# 18. Mobile IA

Given the "Mobile First" principle (Section 2) and the buyer behavior finding that mobile is the dominant discovery device (`02-user-personas.md` Section 14.1, insight 13), mobile IA is the primary design target, not an adaptation of desktop.

| Element | Mobile Pattern |
|---|---|
| **Bottom Navigation** | Persistent five-item bar: Home, Search, Wishlist, Cart, Account. Matches the highest-frequency buyer actions identified across journeys. |
| **Drawer** | Slide-out drawer (accessed from a menu icon) houses Categories, Collections, Support, Legal, and Become a Creator — secondary-frequency destinations that would crowd the bottom bar. |
| **Search** | Full-screen search experience on activation, prioritizing Recent/Trending searches and autocomplete given limited screen real estate. |
| **Filters** | Presented as a full-screen or bottom-sheet overlay rather than an inline sidebar (which desktop uses), to preserve product grid visibility. |
| **Quick Actions** | Swipe or long-press affordances for common actions (e.g., quick-add to wishlist from a grid) to reduce navigation depth on small screens. |
| **Checkout** | Single-column, single-focus linear flow with a persistent progress indicator; no side navigation or drawer access during checkout, minimizing distraction/abandonment risk. |
| **Creator Dashboard (Mobile)** | Condensed to the highest-priority sections (Pending Actions, Orders, Messages) in a bottom or drawer navigation; deeper sections (Analytics detail, Team Management) are reachable but not primary. |
| **Admin (Mobile)** | Not a primary design target for v2 — Admin/Moderator/Support tooling is designed desktop-first given its operational, high-volume nature, with mobile access as a functional but secondary experience. |
| **Offline Navigation** | Previously viewed content (recently browsed products, active cart) remains accessible in a degraded read-only state; actions requiring connectivity are clearly disabled with an explanatory state rather than failing silently. |
| **PWA Considerations** | Bottom navigation and drawer patterns persist identically in the installed PWA context; an install prompt is surfaced at an appropriate, non-intrusive moment (not on first visit) consistent with the PWA install rate target in `00-project-vision.md` Section 14. |

---

# 19. Error Architecture

| Error State | Trigger | Recovery Path |
|---|---|---|
| **404 Not Found** | Broken/removed link, mistyped URL | Search bar, links to Home and popular Categories |
| **500 Server Error** | Unexpected system failure | Retry action, link to Home, Support contact option |
| **403 Forbidden** | Authenticated user attempts to access a page outside their role's permission (Section 16) | Clear explanation of the restriction; link back to an appropriate, permitted destination |
| **401 Unauthorized** | Unauthenticated user attempts to access an account-only page | Redirect to Sign In, preserving the originally intended destination for post-login redirect |
| **No Search Results** | Query returns zero matches | Spelling suggestions, related Categories, "notify me" option (Section 10) |
| **No Orders** | Buyer views Orders with no purchase history | Prompt to browse Home/Categories/Collections |
| **No Products** | Creator views Products with no listings yet, or a Category/Collection currently has none | Creator: guided prompt to Create Product; Buyer-facing: "coming soon" with related-category redirect |
| **Offline** | No network connectivity detected | Cached/previously viewed content remains visible; clear indication of offline status; automatic recovery on reconnect |
| **Maintenance** | Planned platform downtime | Clear messaging with expected restoration window; no navigation elements implying normal functionality |
| **Permission Errors** | Role attempts an action beyond its authority (e.g., Support Executive exceeding refund limit) | Clear explanation with an escalation path where applicable (Section 16) |
| **Validation Errors** | Form input fails validation (checkout address, listing fields, etc.) | Inline, field-specific messaging at the point of error, never a generic top-of-page-only error |

**General Recovery Principle:** every error state provides at least one clear, actionable path forward (retry, redirect, search, or contact support) — consistent with the Discoverability and Recognition-over-Recall principles (Section 2). No error state is a structural dead end.

---

# 20. Cross Navigation Matrix

This matrix documents the most important intentional navigation paths between pages, why they exist, and their relative importance — informing which connections must never be dropped during future redesigns.

| Source Page | Destination Page | Reason | User Intent | Frequency | Importance |
|---|---|---|---|---|---|
| Product Detail | Creator Storefront | Build trust, discover more from the same maker | Trust-building, exploration | High | Critical |
| Product Detail | Cart | Core conversion path | Purchase intent | High | Critical |
| Product Detail | Wishlist | Deferred purchase intent | Planning/consideration | Medium | High |
| Creator Storefront | Product Detail | Continue browsing catalog | Exploration | High | Critical |
| Search Results | Product Detail | Core discovery-to-conversion path | Purchase intent | High | Critical |
| Category | Subcategory | Structured narrowing | Exploration | High | High |
| Home | Collection | Editorial-led discovery | Inspiration-seeking | High | High |
| Collection | Product Detail | Curated discovery-to-conversion | Purchase intent | Medium | Critical |
| Cart | Checkout | Core conversion path | Purchase intent | High | Critical |
| Order Detail | Track Shipment | Post-purchase reassurance | Anxiety reduction | High | High |
| Order Detail | Leave Review | Trust-loop closure | Reciprocity/expression | Medium | High |
| Order Detail | Request Refund / Support Ticket | Issue resolution | Problem-solving | Low-Medium | Critical (when needed) |
| Wishlist | Cart | Delayed conversion | Purchase intent | Medium | High |
| Creator Dashboard (Overview) | Order Detail | Operational action | Task completion | High | Critical |
| Creator Dashboard (Overview) | Products (Create/Edit) | Catalog management | Task completion | Medium | High |
| Order Detail (Creator) | Messages (Clarification) | Resolve ambiguity before production | Risk reduction | Medium | Critical (when needed) |
| Admin Dashboard | Creator Applications | Core operational gate | Task completion | High | Critical |
| Admin Dashboard | Refund Queue | Operational resolution | Task completion | Medium | High |
| Moderation Queue | Listing/Review Detail | Trust and safety enforcement | Task completion | Medium | Critical |
| Support Queue | Ticket Detail | Core support workflow | Task completion | High | Critical |
| Any restricted page attempt | 403/401 error state | Enforce permission boundary | N/A (system-enforced) | Low | Critical (integrity) |

---

# 21. Future Expansion Strategy

Consistent with `00-project-vision.md` Section 25–26 and `01-product-requirements.md` Section 15, the following future capabilities are **not built in v2** but the IA defined in this document deliberately avoids structural choices that would block them.

| Future Capability | IA Readiness Consideration |
|---|---|
| **Wholesale** | Would require a distinct buyer-type navigation context and URL namespace (Section 12.2), separate from the individual-gifting-optimized Buyer IA, rather than retrofitting bulk-order UI into existing Product/Cart pages. |
| **Corporate** | Similarly would warrant a distinct top-level zone (e.g., `/business/`) with its own dashboard, order, and invoicing IA, linked from but structurally separate from individual Buyer Account Zone. |
| **International** | URL structure (Section 12) and taxonomy (Section 8) are designed to be locale-extensible; Category/Occasion taxonomy would need region-specific variants without restructuring the underlying hierarchy. |
| **Luxury** | Could be introduced as a Collection/tag-based curation layer (Section 8) rather than a structurally separate catalog, preserving one unified Product IA. |
| **Subscriptions** | Reserved as a Future Product classification (Section 9); would introduce a new Buyer Account Zone section ("Subscriptions") parallel to Orders. |
| **Gift Registry** | Would introduce a new object type (Registry) with its own creation, sharing, and contribution flows, cross-linking to existing Product and Checkout IA rather than duplicating it. |
| **AI Shopping** | Primarily a Search Architecture (Section 10) enhancement — an AI-assisted query/recommendation layer sitting on top of existing Search entry points, not a structurally new zone. |
| **AR Preview** | Would extend Product Detail's content hierarchy (Section 14.2) with an additional media type, not a new page. |
| **Community** | Would introduce new zones (creator spotlights, buyer boards) linked from Home and Creator Storefront, additive to rather than disruptive of existing IA. |
| **Learning Center / Creator Academy** | Would introduce a new top-level content zone (parallel to Support's Help Center) targeted at creator education, linked prominently from the Creator Dashboard. |

---

# 22. IA Validation Checklist

This checklist should be applied before any major navigation, taxonomy, or sitemap change ships.

| Criterion | Validation Question |
|---|---|
| **Navigation Consistency** | Does this change preserve consistent labeling, placement, and behavior with equivalent elements elsewhere in the IA? |
| **Content Findability** | Can every piece of new or existing content be reached through at least one clear, logical path (Section 5.2 Dead-End Review)? |
| **Accessibility** | Is the structure navigable via keyboard and screen reader, with no information conveyed by position or color alone? |
| **SEO** | Does the change preserve canonical structure, internal linking density, and indexability rules (Section 17)? |
| **Scalability** | Will this structure remain coherent at 10x or 100x the current catalog/creator/user volume? |
| **Performance Considerations** | Does the structure avoid unnecessary depth or redundant data dependencies that would harm perceived navigation speed? |
| **Future Readiness** | Does this change avoid foreclosing any capability identified in Section 21? |
| **Marketplace Readiness** | Does the change respect the distinct-but-connected Buyer/Creator IA separation (Sections 5–6), rather than blurring operating contexts? |

---

# 23. Key Insights

### 23.1 Top 20 UX Insights

1. Buyers navigate by relationship and occasion, not product taxonomy alone — Occasion and Recipient taxonomies (Section 8) are as structurally important as Category.
2. A visible-but-disabled navigation item creates more confusion than a hidden one; permission boundaries should be invisible, not implied as broken (Section 4.14, 16.1).
3. Breadcrumbs should reflect the user's actual arrival context (Category vs. Creator) rather than a single rigid hierarchy, to preserve Recognition over Recall (Section 13).
4. Checkout and other single-focus flows benefit from removing lateral navigation (breadcrumbs, drawer access) entirely, not just de-emphasizing it (Sections 13, 18).
5. Empty and zero-result states are as important to design deliberately as populated ones — they are common, not rare, occurrences (Section 19).
6. Mobile bottom navigation should reflect actual behavioral frequency (Home, Search, Wishlist, Cart, Account), not a generic e-commerce template (Section 18).
7. Dashboard navigation must lead with pending actions before performance data, matching the operational urgency of internal and creator personas (Section 15.1).
8. A single account spanning Buyer and Creator roles needs an explicit context switch, not a blended or dual-simultaneous navigation system (Sections 4.13, 16.1).
9. Product pages should structurally prioritize trust and disclosure information above secondary details like extended descriptions (Section 14.2).
10. Filters should default to excluding unavailable inventory but allow the user to opt back in, rather than hiding availability information entirely (Section 11).
11. Search must handle occasion-and-product blended queries ("wedding gift wooden") as a first-class case, not an edge case (Section 10).
12. Creator-facing IA deserves the same design rigor as buyer-facing IA — a utilitarian dashboard undermines the "Creator Empowerment" brand value (Section 6).
13. Customization-related communication (clarification requests) is important enough to warrant dedicated navigational visibility, not just burial within a generic Orders/Messages view (Section 6).
14. Internal role navigation should never expose buyer/creator-facing elements (cart, wishlist) — operating context should be unambiguous at all times (Section 16.1).
15. Every error and failure state must offer at least one constructive next action; a dead end is a structural failure, not an acceptable edge case (Section 19).
16. Collections and Categories serve different cognitive modes (editorial inspiration vs. structured search) and must remain visually and structurally distinct, not merged (Section 8.1).
17. Guest and Buyer navigation should differ only in what's added upon sign-in, not in fundamentally different structure — this minimizes relearning at the point of conversion (Section 4.13).
18. Admin/Moderator/Support navigation should be flatter and faster than buyer-facing navigation, reflecting high-volume, repetitive operational use rather than exploratory browsing (Section 7.1).
19. Offline and low-connectivity states should degrade to a read-only, previously-cached experience rather than a blank failure, given the platform's accessibility and inclusivity goals (Sections 18–19).
20. Consistent breadcrumb, error, and empty-state patterns across very different contexts (Buyer, Creator, Admin) reduce the platform's overall learning curve even though each context serves a different audience (Section 2).

### 23.2 Top 20 Product Insights

1. The IA's Category/Taxonomy split (Section 8) directly supports both precise search and exploratory browsing without forcing a single rigid structure to serve both needs.
2. Handmade/Made-to-Order/Availability classifications being system-derived rather than creator-editable text (Section 8) is a structural trust safeguard, not just a display choice.
3. Nesting Product URLs under Creator Storefronts (Section 12) reinforces the brand-led differentiation strategy at the structural level, not just visually.
4. The Admin IA's "superset view" pattern (Section 7.1) — every platform-wide Admin page mirrors a scoped Creator/Buyer equivalent — reduces the cognitive cost of building and maintaining consistent tooling.
5. Reserving structural space for Future Products (subscriptions, wholesale) in the classification system (Section 9) avoids costly rework when those models are eventually prioritized.
6. Occasion and Festival pages (Section 17.2) convert a known buyer behavior pattern directly into a structural, SEO-valuable asset, not just a marketing campaign.
7. The Creator Dashboard's prioritization of Pending Actions over performance metrics (Section 15) reflects the operational reality that creators often check in reactively, not just to review trends.
8. Treating "Customization Requests" as a first-class navigation item, not a filtered sub-view, elevates a high-emotional-stakes journey to appropriate structural prominence (Section 6).
9. A clean separation between Moderator (content/trust) and Support (buyer/creator resolution) navigation prevents role confusion even though their queues sometimes relate to the same order (Sections 7, 16).
10. The taxonomy's independence between Category (mandatory, singular) and all other tags (additive) allows the catalog to grow in richness without ever requiring a breaking restructure (Section 8.1).
11. Search Tags/Synonyms (Section 8) are the structural mechanism that closes the gap between how buyers think ("housewarming gift") and how the catalog is organized (Category: Home Décor).
12. Collections functioning independently of Category hierarchy allows merchandising agility (seasonal campaigns) without any taxonomy rework (Section 8.1).
13. The Buyer Dashboard remaining lightweight (Orders, Wishlist, Messages, Settings) compared to the Creator Dashboard reflects the fundamentally different relationship each role has to the platform (Section 15).
14. A dedicated URL namespace reserved for future Wholesale/Corporate buyer types (Section 21) protects the current, carefully-tuned individual-buyer IA from being diluted by fundamentally different purchasing mechanics.
15. Product Classification (Section 9) anticipating Limited Edition and One of a Kind as distinct types, not just tags, ensures inventory and availability logic can treat them correctly from day one.
16. The explicit IA Validation Checklist (Section 22) operationalizes the abstract IA Principles (Section 2) into a repeatable, applicable process for future changes.
17. Cross Navigation Matrix entries marked "Critical (when needed)" (Section 20) — like Request Refund or Customization Clarification — highlight that importance and frequency are not the same axis; low-frequency paths can still be structurally critical.
18. Structuring Admin taxonomy/collection management as its own IA zone (Section 7) rather than folding it into general Settings keeps high-frequency merchandising work fast and separate from rare, high-risk policy configuration.
19. A permissions-based architecture defined at the page level (Section 16), not just the feature level, ensures navigation itself — not only in-page actions — respects role boundaries.
20. Reserving AR Preview and AI Shopping as extensions of existing Product Detail and Search structures (Section 21), rather than new zones, keeps the core IA stable as these capabilities mature.

### 23.3 Top 20 Engineering Insights

*(High-level structural implications only — no implementation, API, or schema detail, consistent with this document's scope.)*

1. A stable, hierarchical Category system with additive, independent tag-based taxonomies (Section 8) implies two structurally different kinds of classification data that will behave differently as the catalog scales.
2. Search must reconcile structured taxonomy (Category, Occasion) with unstructured query text (Section 10) — a purely keyword-based approach would not satisfy the occasion/relationship-driven query patterns identified in persona research.
3. Real-time availability display (Section 9, 11) implies the IA's Product/Category/Search surfaces all depend on a consistently fresh availability signal, not a cached snapshot that could drift from true stock/capacity state.
4. Canonical URL rules (Section 12.1) imply filter/sort state must be excluded from canonical/indexable identity even though it's part of the shareable URL — a distinction that must be preserved consistently across Search and Category surfaces.
5. Multi-context navigation (Buyer/Creator switch, Section 4.13) implies session/identity state must cleanly support a single account operating in two structurally distinct navigational modes.
6. The Admin "superset view" pattern (Section 7.1) implies platform-wide Admin views and scoped Creator/Buyer views should be built on a shared underlying structure with different access scoping, not as entirely separate systems, to avoid long-term drift.
7. Role-based navigation visibility (Section 16) must be enforced consistently at every layer a user could reach a page — direct URL entry, not just navigation-menu visibility — since hiding a link is not equivalent to enforcing a permission boundary.
8. Dead-end mitigation states (Section 5.2, empty/zero-result/error states) are numerous enough across the IA that they warrant being treated as a first-class, reusable pattern rather than one-off handling per page.
9. Breadcrumb behavior that depends on arrival context (Section 13) implies the system must track or infer navigational origin, not just structural position in a fixed hierarchy.
10. Taxonomy extensibility (Section 8, 21) implies the underlying classification structure should not hardcode today's category/tag set as fixed, structural assumptions.
11. Occasion/Festival pages with scheduled publish/unpublish behavior (Section 17.2, referencing HOME-03) imply a need for reliable time-based content activation independent of manual intervention at the boundary moments.
12. Order/Sub-order structural nesting (reflected in Buyer and Creator IA, Sections 5–6) implies navigation and permission scoping must consistently operate at the sub-order level, not just the order level, across every relevant page.
13. Search suggestion/autocomplete/synonym systems (Section 10) imply a need for an evolving mapping between colloquial buyer language and formal taxonomy that will require ongoing curation, not a one-time setup.
14. Offline/degraded-connectivity IA behavior (Sections 18–19) implies meaningful content must be available from a local/cached state, requiring deliberate distinction between content that can degrade gracefully and actions that must hard-fail without connectivity.
15. Consistent cross-role patterns (breadcrumbs, errors, empty states) applied across very different underlying data domains (Buyer orders vs. Admin moderation queues) imply value in shared, reusable structural patterns rather than domain-specific one-offs.
16. SEO indexability rules (Section 17.1) imply a clear, enforced distinction between public/indexable and private/transactional routes must be maintained as new pages are added over time, not decided ad hoc per page.
17. The reserved future URL namespace for Wholesale/Corporate (Section 21) implies today's routing structure should avoid assumptions that would make adding a parallel namespace difficult later.
18. Dashboard "pending action" prioritization (Section 15) implies a need for reliable, real-time-enough aggregation across multiple domains (orders, messages, inventory) to power a single unified summary view.
19. Handmade/Verification status being system-derived rather than creator-input (Section 8) implies this classification must be reliably sourced from the verification and moderation workflows, not treated as ordinary editable listing metadata.
20. The IA Validation Checklist (Section 22) implies navigation and taxonomy changes should be reviewable/auditable as discrete, identifiable changes over time, supporting the "Future Readiness" and "Scalability" criteria in practice, not just in principle.

### 23.4 Top 20 Business Insights

1. Structuring the IA around Occasion and Gifting rather than generic product taxonomy directly reflects and reinforces the platform's core differentiation strategy from `00-project-vision.md`.
2. A Creator IA held to the same quality bar as Buyer IA (Section 6) is a structural investment in creator retention, not merely a UX nicety — it materially affects the "Creator Empowerment" value proposition.
3. Reserved, non-disruptive expansion paths for Wholesale, Corporate, and International (Section 21) reduce the future cost of pursuing the business diversification opportunities identified in `00-project-vision.md` Section 26.
4. SEO-prioritized Occasion and Festival pages (Section 17.2) represent a low-marginal-cost, high-leverage organic growth channel directly aligned with observed buyer search behavior.
5. The Admin/Moderator/Support IA design (Sections 7, 15–16) reflects — and should inform — the operational staffing model, since navigation complexity and queue structure directly shape how efficiently these teams can scale with growth.
6. A taxonomy structured around real gifting occasions (Section 8) creates natural seasonal merchandising moments (festivals, wedding season) that align content strategy directly with demand spikes identified in persona research.
7. Keeping Collections independent of Category (Section 8.1) gives the business ongoing merchandising agility for campaigns and partnerships without requiring engineering involvement for routine curation changes.
8. The explicit, page-level Permissions-Based Architecture (Section 16) reduces legal and trust risk by ensuring sensitive data (payment, personal information) is structurally inaccessible outside its intended role scope, not just procedurally restricted.
9. A consistent, trust-reinforcing structural pattern (verification badges, disclosure prominence) across every Product and Creator page (Sections 8, 14) operationalizes the platform's authenticity promise at scale, beyond what policy alone could guarantee.
10. Dead-end elimination (Section 5.2, 19) protects conversion and retention metrics identified in `00-project-vision.md` Section 14 (checkout conversion, buyer repeat rate) by ensuring no structural moment silently loses a motivated buyer.
11. The reserved Learning Center / Creator Academy zone (Section 21) positions the platform to invest in creator education as a future differentiator without requiring IA rework when that investment is prioritized.
12. Flatter, faster internal navigation (Section 7.1) for Admin/Support directly supports the operational KPIs defined in `01-product-requirements.md` Section 10.4 (ticket resolution time, verification turnaround).
13. A clean, extensible taxonomy (Section 8) reduces the long-term cost of catalog growth, supporting the platform's ambition to scale to 1M+ users without a structural rebuild (`00-project-vision.md` Section 15).
14. Structuring Gift Registry, Subscriptions, and other future models as additive rather than retrofitted capabilities (Section 21) protects the current model's simplicity while preserving future monetization optionality.
15. The Cross Navigation Matrix's "Critical (when needed)" designations (Section 20) highlight paths — like Request Refund and Customization Clarification — where structural quality directly protects trust-sensitive, low-frequency-but-high-stakes moments core to the brand promise.
16. Mobile-first IA (Section 18) directly reflects and protects the dominant buyer discovery channel, aligning structural investment with actual usage patterns rather than a desktop-legacy assumption.
17. A single, consistent Product Classification system (Section 9) that already anticipates Limited Edition, One of a Kind, and future Subscription models supports premium positioning and pricing strategies without waiting for future redesign.
18. Reserved international URL and taxonomy extensibility (Sections 8, 12.2, 21) reduces switching cost if and when geographic expansion becomes a business priority.
19. The IA Validation Checklist (Section 22) institutionalizes scalability and future-readiness as an ongoing discipline rather than a one-time launch consideration, protecting the business from accumulating structural debt as the team and codebase grow.
20. Every structural decision in this document ultimately serves the same business thesis from `00-project-vision.md`: that curated, trustworthy, premium structure — not just product supply — is the platform's defensible, long-term differentiator.

---

*This document is the structural blueprint for Dreams by Kalakaaar v2. All wireframes, navigation systems, routing, menus, and future frontend architecture should be traceable to the sitemap, hierarchy, and rules defined here.*