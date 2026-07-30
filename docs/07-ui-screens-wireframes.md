# 07 · UI Screens & Wireframe Specifications — Dreams by Kalakaaar v2

**Document owner:** UX Architecture & Product Design
**Status:** Draft for review
**Audience:** Design, Product Management, Engineering, QA, Future contributors
**Companion documents:** `00-project-vision.md`, `01-product-requirements.md`, `02-user-personas.md`, `03-user-journeys.md`, `04-information-architecture.md`, `05-design-principles.md`, `06-design-system.md`

---

# 1. Introduction

### 1.1 Purpose
This document is the master blueprint for every screen in Dreams by Kalakaaar v2. It defines, screen by screen, what appears, why, in what order, and how it behaves — without specifying visual styling, code, or implementation. It is the document a designer opens before creating a single Figma frame, and the document QA opens to verify a screen is complete.

### 1.2 Objectives
1. Enumerate every screen required by the functional modules in `01-product-requirements.md`, organized consistently by module and role.
2. Specify each screen's purpose, structure, states, navigation, and accessibility behavior at wireframe-level detail.
3. Map every screen to the components defined in `06-design-system.md`, so no screen requires an undocumented component.
4. Map navigation and user flows so no screen exists in isolation from the journeys defined in `03-user-journeys.md`.
5. Provide the checklists and matrices needed to verify completeness, consistency, and accessibility before any screen moves to visual design.

### 1.3 Audience
Design, Product Management, Engineering, QA, and future contributors building or reviewing any screen on the platform.

### 1.4 Scope
This document covers layout, sections, hierarchy, interaction, states, navigation, and accessibility behavior for every screen. It does **not** cover color, typography styling, spacing values, component visual specification (all defined in `06-design-system.md`), or code/implementation of any kind.

### 1.5 Relationship with Previous Documents

| Document | Relationship |
|---|---|
| `00-project-vision.md` | Source of the brand and product principles every screen must express. |
| `01-product-requirements.md` | Source of the functional requirements each screen fulfills. |
| `02-user-personas.md` | Source of the people each screen is designed for. |
| `03-user-journeys.md` | Source of the behavioral flows each screen is a waypoint within. |
| `04-information-architecture.md` | Source of the sitemap and navigation structure each screen occupies. |
| `05-design-principles.md` | Source of the *why* behind every UX and interaction decision specified here. |
| `06-design-system.md` | Source of every component, token, and pattern referenced throughout this document. |

### 1.6 How to Use This Document
Designers use each screen's specification as a literal Figma-frame outline. Engineers use it to scope implementation. QA uses Sections 16–18 and 31-equivalent checklists to verify shipped screens match intent. No screen should be designed or built without first reading its entry here.

### 1.7 Shared Conventions (Applied to Every Screen Unless Noted Otherwise)

To avoid repeating identical guidance ~125 times, the following defaults apply to **every screen** in this document. Each screen's table only calls out a deviation or screen-specific detail; where a field says "Standard," this default applies.

| Behavior | Standard Default |
|---|---|
| **Empty State** | Illustration + heading + one line of copy + single primary CTA, per `06-design-system.md` Section 23. |
| **Error State** | Inline validation per Section 14.1; full-page 404/403/401/500 compositions per Section 24; Offline as a persistent banner, not a takeover. |
| **Loading State** | Skeleton screens matching content shape per Section 25.1; Retry action on any failed load. |
| **Responsive Behavior** | Mobile-first single column → Tablet 2-column grid where applicable → Laptop/Desktop full grid per Section 27; bottom navigation (mobile) / persistent top or side navigation (tablet+) per `04-information-architecture.md` Section 4. |
| **Accessibility** | WCAG 2.2 AA; full keyboard operability; visible focus states; screen-reader-appropriate semantic structure; per Section 26. |

---

# 2. Screen Organization

Screens are organized into nine modules, mirroring `04-information-architecture.md` Section 3's sitemap zones:

| Module | Screen Count | Primary Audience |
|---|---|---|
| Public | 28 | Guest, Buyer |
| Authentication | 13 | Guest, Buyer, Creator applicant |
| Buyer | 16 | Buyer |
| Creator | 22 | Creator, Creator Team Member |
| Admin | 19 | Admin, Super Admin |
| Moderator | 8 | Moderator |
| Support | 9 | Support Executive |
| System | 10 (largely shared with Public/cross-cutting) | All |
| Future | 10 | Reserved, not built in v2 |

---

# 3. Public Screens

### 3.1 Landing Page
| Field | Detail |
|---|---|
| Purpose | Campaign/pre-launch entry point distinct from Home, for marketing-driven traffic. |
| Target Users | Guest |
| Entry Points | Paid campaigns, external marketing links, social referral |
| Exit Points | Home, Sign Up, a specific Collection/Category |
| Primary Goal | Convert campaign traffic into a signed-up Buyer or a first purchase |
| Page Sections | 1) Hero (headline + single CTA) 2) Value proposition (3 short pillars) 3) Featured Collection or Creator 4) Trust strip (verification, reviews summary) 5) Footer |
| Components Used | Button (Primary/Secondary), Collection Card, Creator Card, Tag |
| Actions | Primary CTA (e.g., "Explore Collections" or "Shop the Collection") |
| Navigation | Global Navbar (minimal variant, optional), Footer |
| Empty States | N/A (fully CMS-authored, always populated) |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Single-column hero on mobile; two-column hero (copy + image) on desktop |
| Accessibility Notes | Standard; hero heading is a true `h1` |
| Success Criteria | High click-through rate from hero CTA into core discovery flow |

### 3.2 Home
| Field | Detail |
|---|---|
| Purpose | Primary entry point orienting buyers toward discovery paths. Per `04-information-architecture.md` Section 14.1. |
| Target Users | Guest, Buyer |
| Entry Points | Direct URL, logo click, external links |
| Exit Points | Category, Collection, Product Detail, Creator Store, Search |
| Primary Goal | Orient the buyer and drive them into a discovery path within seconds |
| Page Sections | 1) Hero (seasonal/occasion-led) 2) Featured Collections row 3) Featured/verified Creators row 4) Category entry grid 5) Personalized row (returning Buyer only: recently viewed/wishlist-related) 6) Footer |
| Components Used | Navbar, Collection Card, Creator Card, Category Card, Product Card (in personalized row) |
| Actions | Tap into any Collection/Category/Creator/Product |
| Navigation | Global Navbar, Bottom Navigation (mobile), Footer |
| Empty States | N/A — Home always shows CMS-curated content (per `01-product-requirements.md` HOME-01) |
| Error States | Standard; if a featured Collection has zero available products it is excluded from rendering, not shown broken |
| Loading States | Skeleton for Collection/Creator rows while CMS content loads |
| Responsive Behaviour | Vertically stacked single-column rows on mobile; horizontally scrollable rows within each section on all breakpoints; grid-based Category entry expands from 2-col (mobile) to 4–6 col (desktop) |
| Accessibility Notes | Each row is a labeled landmark/region so screen reader users can jump between sections |
| Success Criteria | Low bounce rate; high progression into Category/Collection/Search |

### 3.3 About
| Field | Detail |
|---|---|
| Purpose | Communicate brand mission, vision, and story to build trust with new visitors. |
| Target Users | Guest, Buyer, prospective Creator |
| Entry Points | Footer link, marketing referral |
| Exit Points | Home, Become a Creator, Collections |
| Primary Goal | Build brand trust and emotional connection |
| Page Sections | 1) Mission statement (editorial, serif-led per `06-design-system.md` Section 4.2) 2) "Why handmade" narrative 3) Founder/team note (optional) 4) CTA to explore or become a creator |
| Components Used | Button, Illustration (brand-personality style) |
| Actions | "Explore Collections," "Become a Creator" |
| Navigation | Global Navbar, Footer |
| Empty States | N/A |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Single-column, constrained reading width (per `06-design-system.md` Section 6.5) at all breakpoints |
| Accessibility Notes | Standard; long-form content uses proper heading hierarchy |
| Success Criteria | Supports downstream trust; not directly conversion-measured |

### 3.4 Collections (Landing/Index)
| Field | Detail |
|---|---|
| Purpose | Browse all active curated Collections. |
| Target Users | Guest, Buyer |
| Entry Points | Global Navigation, Home feature links |
| Exit Points | Individual Collection page |
| Primary Goal | Help buyers discover a themed collection matching their intent |
| Page Sections | 1) Page title + brief framing 2) Grid of Collection Cards |
| Components Used | Collection Card, Navbar, Breadcrumb (Home > Collections) |
| Actions | Select a Collection |
| Navigation | Breadcrumb, Bottom Navigation (mobile) |
| Empty States | N/A (always at least one active seasonal collection expected) |
| Error States | Standard |
| Loading States | Skeleton grid |
| Responsive Behaviour | 1-col (mobile) → 2-col (tablet) → 3–4 col (desktop) grid |
| Accessibility Notes | Standard |
| Success Criteria | High click-through into individual Collections |

### 3.5 Collection (Individual)
| Field | Detail |
|---|---|
| Purpose | Present a single curated grouping of products. |
| Target Users | Guest, Buyer |
| Entry Points | Home feature, Collections index, marketing/shared link, Category cross-promotion |
| Exit Points | Product Detail, related Collections |
| Primary Goal | Convert curated discovery into product consideration |
| Page Sections | 1) Collection title + editorial story 2) Curated product grid (manually ordered) 3) Related Collections row |
| Components Used | Product Card, Breadcrumb, Collection Card (related row) |
| Actions | Select a product |
| Navigation | Breadcrumb (Home > Collections > [Name]) |
| Empty States | Expired/unpublished Collection redirects to an active related Collection (per `04-information-architecture.md` Section 5) |
| Error States | Standard; unavailable listing within collection auto-excluded from grid |
| Loading States | Skeleton grid |
| Responsive Behaviour | Standard grid responsive pattern |
| Accessibility Notes | Standard |
| Success Criteria | High engagement rate relative to generic category browsing (per `04-information-architecture.md` Section 23.2) |

### 3.6 Categories (Landing/Index)
| Field | Detail |
|---|---|
| Purpose | Browse the full category taxonomy. |
| Target Users | Guest, Buyer |
| Entry Points | Global Navigation |
| Exit Points | Individual Category page |
| Primary Goal | Structured entry into the catalog |
| Page Sections | 1) Page title 2) Category grid (top-level categories) |
| Components Used | Category Card |
| Actions | Select a Category |
| Navigation | Breadcrumb (Home > Categories) |
| Empty States | N/A |
| Error States | Standard |
| Loading States | Skeleton grid |
| Responsive Behaviour | Standard grid responsive pattern |
| Accessibility Notes | Standard |
| Success Criteria | Supports structured browsing conversion path |

### 3.7 Category (Individual)
| Field | Detail |
|---|---|
| Purpose | Browse all listings within a category/subcategory. |
| Target Users | Guest, Buyer |
| Entry Points | Categories index, Global Navigation, Search refinement, breadcrumb from subcategory |
| Exit Points | Product Detail, Subcategory |
| Primary Goal | Let a buyer narrow to relevant products via structure + filters |
| Page Sections | 1) Category title + optional editorial framing 2) Subcategory navigation (tabs/chips) 3) Filter + Sort controls (Section 11, 14 of `04-information-architecture.md`) 4) Product grid 5) Related Collections row |
| Components Used | Product Card, Chip (filters), Dropdown (sort), Breadcrumb, Tabs (subcategory) |
| Actions | Apply filter/sort, select a product |
| Navigation | Breadcrumb (Home > Category > Subcategory) |
| Empty States | "Coming soon" with related-category redirect if zero published listings (per `01-product-requirements.md` CAT-03) |
| Error States | Standard; filter combos returning zero results explain why and suggest removing a filter |
| Loading States | Skeleton grid; filter changes show an inline loading indicator without full page reload |
| Responsive Behaviour | Filters collapse to bottom-sheet/full-screen overlay on mobile (per `06-design-system.md` Section 18) |
| Accessibility Notes | Filter controls fully keyboard operable; result count announced on filter change |
| Success Criteria | High filter-to-product-view conversion |

### 3.8 Occasions (Landing/Index + Individual)
| Field | Detail |
|---|---|
| Purpose | SEO/editorial landing pages targeting occasion-specific intent (e.g., "Wedding Gifts"). |
| Target Users | Guest, Buyer |
| Entry Points | Organic search, Home feature, footer links |
| Exit Points | Product Detail, related Category/Collection |
| Primary Goal | Convert occasion-driven search intent into browsing/purchase |
| Page Sections | 1) Occasion title + editorial framing 2) Curated/filtered product view (Occasion tag) 3) Related Occasions/Collections |
| Components Used | Product Card, Collection Card |
| Actions | Select a product or related occasion |
| Navigation | Breadcrumb (Home > Occasions > [Name]) |
| Empty States | Standard |
| Error States | Standard |
| Loading States | Skeleton grid |
| Responsive Behaviour | Standard grid responsive pattern |
| Accessibility Notes | Standard |
| Success Criteria | Strong organic entry conversion (per `04-information-architecture.md` Section 17.2) |

### 3.9 Festivals (Landing/Index + Individual)
| Field | Detail |
|---|---|
| Purpose | Seasonal/culturally specific landing pages (e.g., Diwali), scheduled to publish/unpublish automatically. |
| Target Users | Guest, Buyer |
| Entry Points | Organic search, Home seasonal feature |
| Exit Points | Product Detail, related Collection |
| Primary Goal | Capture seasonal demand spikes |
| Page Sections | Same structure as Occasions (3.8) |
| Components Used | Product Card, Collection Card, Banner (seasonal countdown-free, informational only) |
| Actions | Select a product |
| Navigation | Breadcrumb |
| Empty States | Standard; page unpublishes automatically outside its active window (per `01-product-requirements.md` HOME-03) |
| Error States | Standard |
| Loading States | Skeleton grid |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | High seasonal traffic conversion |

### 3.10 Creator Directory
| Field | Detail |
|---|---|
| Purpose | Browse/search all verified creators (reserved structural entry per `04-information-architecture.md` Section 13, breadcrumb "Creators"). |
| Target Users | Guest, Buyer |
| Entry Points | Global Navigation (secondary), Creator Storefront breadcrumb |
| Exit Points | Individual Creator Store |
| Primary Goal | Support creator-led discovery for trust-driven buyers |
| Page Sections | 1) Page title 2) Filter (category, rating) 3) Creator Card grid |
| Components Used | Creator Card, Chip (filters) |
| Actions | Select a creator |
| Navigation | Breadcrumb (Home > Creators) |
| Empty States | Standard |
| Error States | Standard |
| Loading States | Skeleton grid |
| Responsive Behaviour | Standard grid responsive pattern |
| Accessibility Notes | Standard |
| Success Criteria | Supports Conscious Shopper and Design Collector discovery patterns (`02-user-personas.md` 3.2–3.3) |

### 3.11 Creator Store (Storefront)
| Field | Detail |
|---|---|
| Purpose | Present a creator's full brand, story, and catalog. |
| Target Users | Guest, Buyer |
| Entry Points | Product Detail link, Search, Creator Directory, shared link |
| Exit Points | Product Detail (within store), Message Creator (Buyer only) |
| Primary Goal | Build trust and convert storefront visitors into buyers |
| Page Sections | 1) Store Banner + Store Header (avatar, name, verification badge, rating) 2) Creator story 3) Storefront policies (shipping, customization) 4) Portfolio Gallery (full catalog grid) 5) Reviews summary |
| Components Used | Store Banner, Store Header, Portfolio Gallery, Product Card, Review Summary, Button (Message, Buyer only) |
| Actions | Select a product, message the creator (pre-purchase inquiry), follow/share |
| Navigation | Breadcrumb (Home > Creators > [Name]) |
| Empty States | New creator with minimal catalog: encouraging "just getting started" framing (per `05-design-principles.md` Section 13) |
| Error States | Suspended/invalid storefront shows a clear status message, not a broken page (per `04-information-architecture.md` Section 5) |
| Loading States | Skeleton for header + gallery |
| Responsive Behaviour | Banner/header stack vertically on mobile; gallery grid reduces from 4-col to 2-col |
| Accessibility Notes | Verification badge has accessible text equivalent, not icon-only |
| Success Criteria | High repeat-visit rate to a given creator (per `02-user-personas.md` Section 14.1 insight 17) |

### 3.12 Product Listing (Grid context, e.g. within Search/Category — cross-referenced)
| Field | Detail |
|---|---|
| Purpose | Reusable grid presentation of products; not a standalone screen but a pattern used within Category, Collection, Search, Storefront, Wishlist. |
| Target Users | Guest, Buyer |
| Entry Points | N/A (embedded pattern) |
| Exit Points | Product Detail |
| Primary Goal | Consistent scan-and-select experience across all browsing contexts |
| Page Sections | Grid of Product Cards with consistent card structure (image, title, creator, price, availability badge, rating) |
| Components Used | Product Card |
| Actions | Select a product, quick-add to wishlist |
| Navigation | N/A (inherits host screen's navigation) |
| Empty States | Host-screen-specific (see 3.6–3.9, 3.13) |
| Error States | Standard |
| Loading States | Skeleton grid |
| Responsive Behaviour | 2-col (mobile) → 3-col (tablet) → 4-col (desktop) |
| Accessibility Notes | Standard |
| Success Criteria | Consistent scanability across every host screen |

### 3.13 Product Detail
| Field | Detail |
|---|---|
| Purpose | Present a single listing in full detail to support a purchase decision. |
| Target Users | Guest, Buyer |
| Entry Points | Category, Collection, Search, Storefront, Wishlist, shared link |
| Exit Points | Cart, Creator Store, Wishlist |
| Primary Goal | Convert product consideration into Add to Cart |
| Page Sections | 1) Image gallery 2) Title, price, availability, disclosure badge 3) Customization Panel (if applicable) 4) Description & details (materials, technique, size) 5) Creator identity strip (links to Store) 6) Reviews 7) Related/similar products |
| Components Used | Image Viewer, Tag (disclosure), Status Badge (availability), Customization Panel, Review Card, Review Summary, Product Card (related row), Button (Add to Cart — Primary, Wishlist — Ghost) |
| Actions | Select customization options, Add to Cart, Add to Wishlist, visit Creator Store |
| Navigation | Breadcrumb (Home > Category > Subcategory > Product, or Home > Creator > Product per arrival context, per `04-information-architecture.md` Section 13) |
| Empty States | No reviews yet: "Be the first to share your experience" (per `06-design-system.md` Section 13) |
| Error States | Sold-out mid-view: real-time availability update disables Add to Cart with "notify me" alternative (per `01-product-requirements.md` PDP-02) |
| Loading States | Skeleton for gallery + details |
| Responsive Behaviour | Single-column stack on mobile (gallery above details); two-column (gallery left, details right) on tablet/desktop |
| Accessibility Notes | Gallery fully keyboard-navigable; disclosure/availability never conveyed by color alone |
| Success Criteria | High Product Detail → Add to Cart conversion rate |

### 3.14 Search (Entry / Empty Query State)
| Field | Detail |
|---|---|
| Purpose | Full-screen (mobile) or overlay (desktop) search entry experience prior to a query being entered. |
| Target Users | Guest, Buyer |
| Entry Points | Global Navbar search icon/field |
| Exit Points | Search Results |
| Primary Goal | Minimize typing and accelerate query entry |
| Page Sections | 1) Search input (auto-focused) 2) Recent Searches (Buyer, signed-in) 3) Trending Searches |
| Components Used | Search Bar, Chip (recent/trending query shortcuts) |
| Actions | Enter query, select a recent/trending suggestion |
| Navigation | Close/cancel returns to prior screen |
| Empty States | No recent searches: show Trending only |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Full-screen takeover on mobile; anchored overlay/dropdown on desktop |
| Accessibility Notes | Input auto-focus announced; suggestion list keyboard-navigable |
| Success Criteria | Fast time-to-query-submission |

### 3.15 Search Results
| Field | Detail |
|---|---|
| Purpose | Present ranked results for a submitted query. |
| Target Users | Guest, Buyer |
| Entry Points | Search entry, refined query from a prior Search Results page |
| Exit Points | Product Detail, Creator Store |
| Primary Goal | Help the buyer find a relevant match quickly |
| Page Sections | 1) Query restatement + result count 2) Filter + Sort controls 3) Result grid (Product + Creator result types) |
| Components Used | Product Card, Creator Card, Chip (filters), Dropdown (sort) |
| Actions | Apply filter/sort, select a result, refine query |
| Navigation | Breadcrumb (Home > Search Results for "[query]") |
| Empty States | Zero results: spelling suggestions, related categories, "notify me" option (per `01-product-requirements.md` SRCH-01, `06-design-system.md` Section 13) |
| Error States | Standard |
| Loading States | Skeleton grid |
| Responsive Behaviour | Filters collapse to overlay on mobile, matching Category page pattern (3.7) |
| Accessibility Notes | Result count changes announced on filter/sort application |
| Success Criteria | High Search → Product Detail conversion; low zero-result rate |

### 3.16 Wishlist (Public/Guest session variant — cross-reference to 5.8 for Buyer persistent variant)
| Field | Detail |
|---|---|
| Purpose | Session-only saved-items view for Guests. |
| Target Users | Guest |
| Entry Points | Global Navigation wishlist icon |
| Exit Points | Product Detail, Cart, Sign Up (to persist) |
| Primary Goal | Encourage sign-up to persist saved items |
| Page Sections | 1) Grid of saved Product Cards 2) Sign-up prompt banner |
| Components Used | Product Card, Banner |
| Actions | Remove item, Add to Cart, Sign Up |
| Navigation | Standard |
| Empty States | "Save things you love here for later" + browse CTA (per `06-design-system.md` Section 13) |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Standard grid |
| Accessibility Notes | Standard |
| Success Criteria | High Guest → Sign Up conversion from this prompt |

### 3.17 Cart (Guest/Buyer shared structure)
| Field | Detail |
|---|---|
| Purpose | Review and adjust items prior to checkout. |
| Target Users | Guest, Buyer |
| Entry Points | Global Navigation cart icon, Add to Cart action |
| Exit Points | Checkout, Product Detail (edit) |
| Primary Goal | Confirm cart contents are accurate and complete before checkout |
| Page Sections | 1) Items grouped by Creator, with per-creator shipping estimate 2) Coupon entry 3) Order subtotal summary 4) Checkout CTA |
| Components Used | Cart component, Coupon Card, Payment Summary (partial/subtotal view), Button (Primary — Checkout) |
| Actions | Adjust quantity, remove item, apply coupon, proceed to checkout |
| Navigation | Standard |
| Empty States | "Your cart is empty" + browse CTA |
| Error States | Unavailable/price-changed items flagged with a specific resolution path before checkout can proceed (per `01-product-requirements.md` CART-03) |
| Loading States | Standard |
| Responsive Behaviour | Single column on mobile; summary panel sticky on desktop |
| Accessibility Notes | Quantity steppers fully keyboard operable |
| Success Criteria | Low cart-abandonment rate attributable to unresolved cart-state issues |

### 3.18 Gift Guide
| Field | Detail |
|---|---|
| Purpose | Editorial, guided discovery surface specifically for gift-giving intent, combining Occasion/Recipient taxonomy. |
| Target Users | Guest, Buyer (primarily Meaningful Gift Buyer persona) |
| Entry Points | Home feature, footer, organic search |
| Exit Points | Product Detail, Collection, Occasion page |
| Primary Goal | Reduce gift-choice anxiety through guided curation |
| Page Sections | 1) Guided entry (recipient/occasion picker) 2) Curated results matching selection |
| Components Used | Chip (recipient/occasion selectors), Product Card |
| Actions | Select recipient/occasion filters, select a product |
| Navigation | Breadcrumb (Home > Gift Guide) |
| Empty States | Standard |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Guided picker stacks vertically on mobile |
| Accessibility Notes | Standard |
| Success Criteria | High conversion for the Meaningful Gift Buyer persona specifically |

### 3.19 Blog (Future)
| Field | Detail |
|---|---|
| Purpose | Reserved future content-marketing surface (per `04-information-architecture.md` Section 17.1). |
| Target Users | Guest, Buyer |
| Entry Points | Footer, organic search (future) |
| Exit Points | Product/Collection/Occasion pages (future) |
| Primary Goal | Not built in v2 — reserved |
| Page Sections | Not specified in v2 |
| Components Used | N/A |
| Actions | N/A |
| Navigation | N/A |
| Empty States | N/A |
| Error States | N/A |
| Loading States | N/A |
| Responsive Behaviour | N/A |
| Accessibility Notes | N/A |
| Success Criteria | N/A — see Section 23 Future Screens |

### 3.20 FAQ / Help Center
| Field | Detail |
|---|---|
| Purpose | Public, indexable self-service help content. |
| Target Users | Guest, Buyer, Creator |
| Entry Points | Footer, Support entry point |
| Exit Points | Contact Support, Ticket creation |
| Primary Goal | Resolve common questions without a support contact |
| Page Sections | 1) Search within Help Center 2) Topic categories 3) Article list/detail |
| Components Used | Search Bar (scoped), List |
| Actions | Search, select a topic/article, escalate to Contact Support |
| Navigation | Breadcrumb (Help Center > Topic > Article) |
| Empty States | Search with no matching articles: prompt to Contact Support |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | High self-resolution rate (reduces Support ticket volume) |

### 3.21 Support (Contact / Raise Ticket entry)
| Field | Detail |
|---|---|
| Purpose | Entry point to raise a new support ticket. |
| Target Users | Guest (limited), Buyer, Creator |
| Entry Points | Footer, Order Detail "Get help," FAQ escalation |
| Exit Points | Support Ticket Detail (confirmation) |
| Primary Goal | Capture a complete, well-categorized support request |
| Page Sections | 1) Issue category selector 2) Related order selector (if applicable) 3) Description field 4) Submit |
| Components Used | Select, Textarea, Upload (attachment), Button (Primary — Submit) |
| Actions | Select category, describe issue, attach evidence, submit |
| Navigation | Standard |
| Empty States | N/A |
| Error States | Missing category defaults to general triage, not blocked (per `01-product-requirements.md` SUPP-01) |
| Loading States | Standard |
| Responsive Behaviour | Standard form responsive pattern |
| Accessibility Notes | Standard form accessibility (Section 14 of `06-design-system.md`) |
| Success Criteria | High first-contact-resolution downstream (ticket captured with sufficient detail) |

### 3.22 Contact
| Field | Detail |
|---|---|
| Purpose | General, non-ticket company contact (press, partnerships) distinct from Support. |
| Target Users | Guest |
| Entry Points | Footer |
| Exit Points | N/A (form submission confirmation) |
| Primary Goal | Capture general inquiries |
| Page Sections | 1) Contact form (name, email, message) |
| Components Used | Text input, Textarea, Button |
| Actions | Submit inquiry |
| Navigation | Standard |
| Empty States | N/A |
| Error States | Standard validation |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | N/A (low-frequency, low-priority screen per Section 24) |

### 3.23–3.26 Legal Pages (Privacy, Terms, Cookies, Accessibility Statement)
| Field | Detail |
|---|---|
| Purpose | Present required legal/compliance content, versioned with an effective date. |
| Target Users | All roles |
| Entry Points | Footer, Checkout (Refund Policy link), Authentication (Terms/Privacy consent) |
| Exit Points | N/A |
| Primary Goal | Legal transparency and accessible policy communication (per `01-product-requirements.md` LEGAL-01–03) |
| Page Sections | 1) Plain-language summary (top) 2) Full legal text 3) Effective date |
| Components Used | None beyond typography/content structure |
| Actions | N/A (read-only) |
| Navigation | Breadcrumb (Legal > [Document Name]) |
| Empty States | N/A |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Constrained reading width at all breakpoints |
| Accessibility Notes | Proper heading hierarchy for long-form legal content navigation |
| Success Criteria | N/A — compliance/trust surface, not conversion-measured |

### 3.27 404 Not Found
| Field | Detail |
|---|---|
| Purpose | Handle broken/removed/mistyped links gracefully. |
| Target Users | All roles |
| Entry Points | Any broken/invalid URL |
| Exit Points | Home, Search, popular Categories |
| Primary Goal | Recover the user without a dead end (per `04-information-architecture.md` Section 19) |
| Page Sections | 1) Illustration 2) Heading + short copy 3) Search Bar 4) Links to Home/popular Categories |
| Components Used | Illustration, Search Bar, Button |
| Actions | Search, navigate Home |
| Navigation | Standard |
| Empty States | N/A (this is itself a recovery/error surface) |
| Error States | N/A |
| Loading States | N/A |
| Responsive Behaviour | Standard |
| Accessibility Notes | Heading clearly announces the error to screen readers |
| Success Criteria | High recovery rate (user proceeds to a productive page rather than exiting) |

### 3.28 500 / Maintenance / Offline (shared structural pattern — see Section 10 System Screens for full detail; cross-referenced here as they are reachable from any public URL)
| Field | Detail |
|---|---|
| Purpose | See Section 10.4 (500), 10.3 (Maintenance), 10.2 (Offline) for full specification. |
| Target Users | All roles |
| Entry Points | Any page, upon the relevant failure/state condition |
| Exit Points | Retry, Home |
| Primary Goal | Communicate status honestly and offer recovery |
| Page Sections | See Section 10 |
| Components Used | See Section 10 |
| Actions | See Section 10 |
| Navigation | See Section 10 |
| Empty States | N/A |
| Error States | N/A (these are error states themselves) |
| Loading States | N/A |
| Responsive Behaviour | Standard |
| Accessibility Notes | See Section 10 |
| Success Criteria | See Section 10 |

---

# 4. Authentication Screens

### 4.1 Login (Sign In)
| Field | Detail |
|---|---|
| Purpose | Authenticate a returning user. |
| Target Users | Buyer, Creator, Creator Team Member |
| Entry Points | Account menu, restricted-action prompt (e.g., checkout), direct link |
| Exit Points | Buyer/Creator context (prior intended destination if interrupted), Forgot Password, Sign Up |
| Primary Goal | Fast, low-friction return to an authenticated session |
| Page Sections | 1) Email/password fields 2) Third-party sign-in options 3) "Forgot password" link 4) Link to Sign Up |
| Components Used | Text input, Password input, Button (Primary), Text button (secondary links) |
| Actions | Submit credentials, third-party sign-in, navigate to Forgot Password/Sign Up |
| Navigation | Centered Authentication Layout (per `06-design-system.md` Section 6.13), no global nav distraction |
| Empty States | N/A |
| Error States | Generic "incorrect credentials" message (does not reveal which field was wrong); progressive rate limiting after repeated failures (per `01-product-requirements.md` AUTH-03) |
| Loading States | Button shows loading state during submission |
| Responsive Behaviour | Single centered column at all breakpoints, max-width ~400–480px |
| Accessibility Notes | Password visibility toggle has accessible label; error announced to screen reader on submit failure |
| Success Criteria | High login success rate on first attempt |

### 4.2 Signup (Registration)
| Field | Detail |
|---|---|
| Purpose | Create a new account. |
| Target Users | Guest |
| Entry Points | "Sign up" CTA, restricted-action prompt |
| Exit Points | Email Verification, prior intended destination post-verification |
| Primary Goal | Complete registration with minimal friction, preserving any in-progress task |
| Page Sections | 1) Email/password fields (or third-party sign-in) 2) Terms/Privacy consent checkbox 3) Submit |
| Components Used | Text input, Password input, Checkbox (consent), Button (Primary) |
| Actions | Submit registration, accept consent, third-party sign-up |
| Navigation | Centered Authentication Layout |
| Empty States | N/A |
| Error States | Duplicate email: generic message that doesn't confirm account existence (per `01-product-requirements.md` AUTH-01); weak password rejected inline |
| Loading States | Button loading state during submission |
| Responsive Behaviour | Standard centered column |
| Accessibility Notes | Consent checkbox has explicit, unambiguous label; password requirements stated upfront, not only after failure |
| Success Criteria | High completion rate through to verified account |

### 4.3 Guest Checkout (entry decision point)
| Field | Detail |
|---|---|
| Purpose | Offer a no-account path into Checkout. |
| Target Users | Guest |
| Entry Points | Cart "Checkout" action, when unauthenticated |
| Exit Points | Checkout (Address step), Sign Up, Login |
| Primary Goal | Present guest checkout as a first-class, equally prominent option, not a buried afterthought |
| Page Sections | 1) Three equally weighted options: Continue as Guest / Sign Up / Log In |
| Components Used | Button (all three options styled with clear but non-competing hierarchy — Guest as Primary given its conversion importance per `01-product-requirements.md` CHK-02) |
| Actions | Select a path |
| Navigation | Centered Authentication Layout |
| Empty States | N/A |
| Error States | N/A |
| Loading States | N/A |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Guest checkout completion rate comparable to or better than signed-in checkout |

### 4.4 Forgot Password
| Field | Detail |
|---|---|
| Purpose | Initiate password reset. |
| Target Users | Buyer, Creator |
| Entry Points | Login screen link |
| Exit Points | Confirmation state (check your email), Reset Password (via emailed link) |
| Primary Goal | Reduce account-lockout support burden |
| Page Sections | 1) Email input 2) Submit |
| Components Used | Text input, Button (Primary) |
| Actions | Submit email |
| Navigation | Centered Authentication Layout |
| Empty States | N/A |
| Error States | Request for a non-existent account shows the same confirmation message as a valid one (does not reveal account existence, per `01-product-requirements.md` AUTH-04) |
| Loading States | Button loading state |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | High completion rate through to successful password reset |

### 4.5 Reset Password
| Field | Detail |
|---|---|
| Purpose | Set a new password via a time-limited emailed link. |
| Target Users | Buyer, Creator |
| Entry Points | Emailed reset link |
| Exit Points | Login (auto-signed-in on success) |
| Primary Goal | Complete reset securely and quickly |
| Page Sections | 1) New password field (+ confirmation) 2) Submit |
| Components Used | Password input (×2), Button (Primary) |
| Actions | Submit new password |
| Navigation | Centered Authentication Layout |
| Empty States | N/A |
| Error States | Expired/already-used link: clear message with a one-tap resend option (per `01-product-requirements.md` AUTH-02 pattern) |
| Loading States | Button loading state |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | High successful reset completion rate |

### 4.6 OTP Verification
| Field | Detail |
|---|---|
| Purpose | Verify a one-time code (phone/2FA contexts). |
| Target Users | Buyer, Creator |
| Entry Points | Following phone verification trigger or elevated security action |
| Exit Points | Verified context continuation |
| Primary Goal | Fast, low-friction code entry |
| Page Sections | 1) Segmented OTP input 2) Resend code link (with cooldown) |
| Components Used | OTP input, Text button (resend) |
| Actions | Enter code (auto-advance per digit), resend |
| Navigation | Centered Authentication Layout |
| Empty States | N/A |
| Error States | Incorrect code: inline error, code field clears for retry |
| Loading States | Auto-submits and shows loading state on full code entry |
| Responsive Behaviour | Standard |
| Accessibility Notes | Supports paste of a full code; each segment properly labeled for assistive tech |
| Success Criteria | High verification success rate on first attempt |

### 4.7 Email Verification
| Field | Detail |
|---|---|
| Purpose | Confirm email ownership post-registration. |
| Target Users | Buyer, Creator |
| Entry Points | Emailed verification link, or an in-app "pending verification" prompt |
| Exit Points | Verified account context |
| Primary Goal | Confirm real ownership with minimal friction |
| Page Sections | 1) Confirmation state ("check your email") if link not yet clicked 2) Success state once verified |
| Components Used | Illustration, Button (resend) |
| Actions | Resend verification email |
| Navigation | Centered Authentication Layout |
| Empty States | N/A |
| Error States | Expired/used link: clear message + resend (per `01-product-requirements.md` AUTH-02) |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | High verification completion rate within a reasonable time window |

### 4.8 Phone Verification
| Field | Detail |
|---|---|
| Purpose | Confirm phone ownership (where applicable, e.g., SMS notification opt-in). |
| Target Users | Buyer, Creator |
| Entry Points | Settings (opt-in to SMS), Creator Verification flow |
| Exit Points | OTP Verification (4.6) |
| Primary Goal | Enable SMS-channel notifications reliably |
| Page Sections | 1) Phone number input 2) Submit (triggers OTP) |
| Components Used | Phone input, Button (Primary) |
| Actions | Submit phone number |
| Navigation | Standard (embedded in Settings or Creator Verification flow) |
| Empty States | N/A |
| Error States | Invalid format caught inline before submission |
| Loading States | Button loading state |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | High completion rate through to verified phone |

### 4.9 Creator Registration (Application Form)
| Field | Detail |
|---|---|
| Purpose | Capture a creator application for review. |
| Target Users | Buyer applying to become a Creator, new Guest applicant |
| Entry Points | "Become a Creator" CTA |
| Exit Points | Creator Verification (status screen) |
| Primary Goal | Capture a complete, high-quality application with encouraging, low-intimidation guidance |
| Page Sections | 1) Progressive multi-step form: Business/craft details → Portfolio/evidence upload → Seller Agreement consent → Review & Submit |
| Components Used | Stepper, Text input, Textarea, Upload, Checkbox (consent), Button (Primary) |
| Actions | Complete each step, save draft, submit |
| Navigation | Stepper (no breadcrumb, per `04-information-architecture.md` Section 13) |
| Empty States | N/A |
| Error States | Incomplete required fields block progression to next step with specific inline guidance (per `01-product-requirements.md` Section 4.1) |
| Loading States | Upload progress indicator for portfolio evidence |
| Responsive Behaviour | Single-column stepped form at all breakpoints |
| Accessibility Notes | Each step's heading announces step number/total (e.g., "Step 2 of 4") |
| Success Criteria | High application completion rate; applicants report the process felt clear and respectful |

### 4.10 Creator Verification (Status Screen)
| Field | Detail |
|---|---|
| Purpose | Show the applicant their current verification status. |
| Target Users | Creator applicant |
| Entry Points | Post-submission redirect, return visit while Pending |
| Exit Points | Store Setup (on Approved), Creator Registration (on Rejected, to reapply) |
| Primary Goal | Communicate status honestly and set clear expectations |
| Page Sections | 1) Status indicator (Pending/Approved/Rejected) 2) Explanation/next-step guidance specific to status |
| Components Used | Status Badge, Illustration, Button (context-dependent: "Set Up Store" or "Reapply") |
| Actions | Proceed to Store Setup, or reapply |
| Navigation | Standard |
| Empty States | N/A |
| Error States | Rejected state includes the specific documented reason (per `01-product-requirements.md` Section 7.5) |
| Loading States | N/A (status is fetched, shown with skeleton briefly) |
| Responsive Behaviour | Standard |
| Accessibility Notes | Status change is clearly announced, not conveyed by color/badge alone |
| Success Criteria | Rejected applicants who reapply after improvement succeed at a healthy rate |

### 4.11 Session Expired
| Field | Detail |
|---|---|
| Purpose | Handle an expired authentication session gracefully. |
| Target Users | Buyer, Creator, internal roles |
| Entry Points | Any authenticated action attempted after session expiry |
| Exit Points | Login (with return-to-prior-action redirect) |
| Primary Goal | Recover the user's context without losing their in-progress task where feasible |
| Page Sections | 1) Explanation message 2) Sign-in prompt |
| Components Used | Illustration, Button (Primary — Sign In) |
| Actions | Re-authenticate |
| Navigation | Standard |
| Empty States | N/A |
| Error States | N/A (this is itself a session-state screen) |
| Loading States | N/A |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | High re-authentication and task-resumption rate |

### 4.12 Access Denied (403 — role/permission boundary)
| Field | Detail |
|---|---|
| Purpose | Explain a permission boundary clearly and respectfully (per `04-information-architecture.md` Section 19). |
| Target Users | Any authenticated role attempting an out-of-scope action |
| Entry Points | Any restricted destination accessed without sufficient permission |
| Exit Points | An appropriate, permitted destination |
| Primary Goal | Explain the boundary without implying user error |
| Page Sections | 1) Explanation message 2) Link to an appropriate destination |
| Components Used | Illustration, Button |
| Actions | Navigate to a permitted destination |
| Navigation | Standard |
| Empty States | N/A |
| Error States | N/A |
| Loading States | N/A |
| Responsive Behaviour | Standard |
| Accessibility Notes | Message clearly announced, not implying fault |
| Success Criteria | User understands the boundary and proceeds productively |

### 4.13 Account Suspended
| Field | Detail |
|---|---|
| Purpose | Communicate account suspension status and available recourse. |
| Target Users | Suspended Buyer or Creator |
| Entry Points | Login attempt on a suspended account |
| Exit Points | Appeal submission (per `03-user-journeys.md` 6.5), Support contact |
| Primary Goal | Communicate the situation clearly, respectfully, and with a genuine path forward |
| Page Sections | 1) Status explanation + reason (where disclosable) 2) Appeal/Support CTA |
| Components Used | Alert, Button |
| Actions | Submit an appeal, contact Support |
| Navigation | Standard |
| Empty States | N/A |
| Error States | N/A |
| Loading States | N/A |
| Responsive Behaviour | Standard |
| Accessibility Notes | Tone-appropriate, respectful language (per `05-design-principles.md` Section 12) |
| Success Criteria | Fair, clear communication; appeal path is genuinely discoverable and usable |

---

# 5. Buyer Screens

### 5.1 Buyer Dashboard (Account Overview)
| Field | Detail |
|---|---|
| Purpose | Central summary landing point for the Buyer Account Zone. |
| Target Users | Buyer |
| Entry Points | Account menu |
| Exit Points | Orders, Wishlist, Messages, Settings |
| Primary Goal | Orient the buyer to recent activity and common next actions |
| Page Sections | 1) Recent orders summary 2) Quick links (Wishlist, Messages, Settings) |
| Components Used | Order Card, List, Button |
| Actions | Navigate to any account sub-section |
| Navigation | Account sidebar/tabs (mobile: stacked menu) |
| Empty States | New buyer, no orders yet: prompt to browse (per `06-design-system.md` Section 13) |
| Error States | Standard |
| Loading States | Skeleton for recent orders list |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Fast navigation to the buyer's actual intent |

### 5.2 Profile
| Field | Detail |
|---|---|
| Purpose | Manage personal account information. |
| Target Users | Buyer |
| Entry Points | Account menu, Settings |
| Exit Points | Settings |
| Primary Goal | Let the buyer keep their information current |
| Page Sections | 1) Name, email, phone fields 2) Save action |
| Components Used | Text input, Button (Primary) |
| Actions | Edit and save profile fields |
| Navigation | Settings sub-navigation |
| Empty States | N/A |
| Error States | Standard field validation |
| Loading States | Button loading state on save |
| Responsive Behaviour | Standard form pattern |
| Accessibility Notes | Standard |
| Success Criteria | Successful save confirmed clearly |

### 5.3 Addresses
| Field | Detail |
|---|---|
| Purpose | Manage saved shipping addresses. |
| Target Users | Buyer |
| Entry Points | Settings, Checkout ("manage addresses") |
| Exit Points | Checkout |
| Primary Goal | Accelerate future checkout via saved addresses (per `01-product-requirements.md` SET-01) |
| Page Sections | 1) List of saved Address Cards 2) Add new address form (modal or inline) |
| Components Used | Address Card, Button, Modal (add/edit) |
| Actions | Add, edit, remove, set default address |
| Navigation | Settings sub-navigation |
| Empty States | No saved addresses: prompt to add one |
| Error States | Address validation failures give specific, actionable feedback (per `01-product-requirements.md` CHK-01) |
| Loading States | Standard |
| Responsive Behaviour | List stacks on mobile; modal becomes full-screen on mobile |
| Accessibility Notes | Standard form accessibility |
| Success Criteria | High reuse rate of saved addresses at checkout |

### 5.4 Payment Methods
| Field | Detail |
|---|---|
| Purpose | Manage saved payment methods. |
| Target Users | Buyer |
| Entry Points | Settings, Checkout ("manage payment methods") |
| Exit Points | Checkout |
| Primary Goal | Accelerate future checkout; reinforce payment security trust (per `06-design-system.md` Section 10.3) |
| Page Sections | 1) List of saved payment methods 2) Add new method form |
| Components Used | List, Button, Modal (add) |
| Actions | Add, remove, set default payment method |
| Navigation | Settings sub-navigation |
| Empty States | No saved methods: prompt to add one |
| Error States | Standard payment form validation |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Payment form meets elevated visual/security trust bar |
| Success Criteria | Removing a method tied to a pending order doesn't disrupt that order (per `01-product-requirements.md` SET-01) |

### 5.5 Orders (List)
| Field | Detail |
|---|---|
| Purpose | View full order history. |
| Target Users | Buyer |
| Entry Points | Account menu, Order Confirmation link |
| Exit Points | Order Detail |
| Primary Goal | Let the buyer find and track any past or current order |
| Page Sections | 1) Filter (status, date range) 2) List of Order Cards |
| Components Used | Order Card, Dropdown (filter) |
| Actions | Select an order, filter list |
| Navigation | Account sidebar/tabs |
| Empty States | No orders yet: browse prompt |
| Error States | Standard |
| Loading States | Skeleton list |
| Responsive Behaviour | Standard list pattern |
| Accessibility Notes | Standard |
| Success Criteria | Fast order lookup |

### 5.6 Order Detail
| Field | Detail |
|---|---|
| Purpose | Full detail and management for a specific order, including its sub-orders. |
| Target Users | Buyer |
| Entry Points | Orders list, notification link, Order Confirmation |
| Exit Points | Tracking, Leave Review, Request Refund, Raise Support Ticket, Messages |
| Primary Goal | Give complete transparency and self-service action on an order |
| Page Sections | 1) Order summary (items, customization, price) per sub-order 2) Order Timeline per sub-order 3) Actions (Track, Review, Refund, Support, Message Creator) |
| Components Used | Order Timeline, Tracking, Payment Summary, Button (multiple secondary actions) |
| Actions | Track shipment, leave a review, request a refund, raise a ticket, message the creator |
| Navigation | Standard, back to Orders list |
| Empty States | N/A |
| Error States | Cancelled sub-order within a larger order does not make the whole order appear cancelled (per `03-user-journeys.md` 3.17) |
| Loading States | Skeleton |
| Responsive Behaviour | Sub-orders stack vertically on mobile; side-by-side comparison possible on desktop for multi-creator orders |
| Accessibility Notes | Timeline states announced clearly, not conveyed by color alone |
| Success Criteria | Low support-contact rate for "where is my order" type questions |

### 5.7 Tracking
| Field | Detail |
|---|---|
| Purpose | Focused, detailed shipment tracking view for a sub-order. |
| Target Users | Buyer |
| Entry Points | Order Detail |
| Exit Points | Order Detail |
| Primary Goal | Reassure the buyer with clear, current delivery status |
| Page Sections | 1) Current status (prominent) 2) Carrier detail 3) Timeline history |
| Components Used | Tracking, Timeline |
| Actions | Return to Order Detail |
| Navigation | Standard |
| Empty States | Tracking data temporarily unavailable: "tracking pending update" state, not broken/empty (per `04-information-architecture.md` Section 19) |
| Error States | Standard |
| Loading States | Skeleton |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Low anxiety, high self-service satisfaction |

### 5.8 Wishlist (Buyer persistent)
| Field | Detail |
|---|---|
| Purpose | Persistent, cross-device saved-items view. |
| Target Users | Buyer |
| Entry Points | Account menu, Global Navigation icon |
| Exit Points | Product Detail, Cart |
| Primary Goal | Support gifting-planning behavior over time |
| Page Sections | 1) Grid of saved Product Cards, flagged for price-change/unavailability |
| Components Used | Product Card, Status Badge (price-changed/unavailable) |
| Actions | Remove, Add to Cart |
| Navigation | Account sidebar/tabs, Global Navigation icon |
| Empty States | "Save things you love here for later" |
| Error States | Removed-by-creator items shown with clear status, not a dead link (per `01-product-requirements.md` WISH-02) |
| Loading States | Skeleton grid |
| Responsive Behaviour | Standard grid |
| Accessibility Notes | Standard |
| Success Criteria | Meaningful wishlist-to-purchase conversion, especially around occasions |

### 5.9 Notifications
| Field | Detail |
|---|---|
| Purpose | In-app list of platform notifications. |
| Target Users | Buyer |
| Entry Points | Global Navigation icon |
| Exit Points | Relevant Order/Message/Wishlist page per notification |
| Primary Goal | Keep the buyer informed without requiring active polling |
| Page Sections | 1) Chronological list, read/unread state |
| Components Used | Notification, List |
| Actions | Select a notification (navigates to relevant context), mark as read |
| Navigation | Global Navigation icon |
| Empty States | "You're all caught up" |
| Error States | Standard |
| Loading States | Skeleton list |
| Responsive Behaviour | Standard |
| Accessibility Notes | Unread state conveyed by more than color alone (e.g., dot + weight) |
| Success Criteria | High click-through to relevant context |

### 5.10 Messages
| Field | Detail |
|---|---|
| Purpose | Order-contextual buyer-creator conversation threads. |
| Target Users | Buyer |
| Entry Points | Account menu, Order Detail |
| Exit Points | Order Detail (return) |
| Primary Goal | Structured, auditable communication tied to a specific order |
| Page Sections | 1) Thread list (left, desktop) 2) Active thread view (message history + composer) |
| Components Used | List, Textarea (composer), Upload (attachment) |
| Actions | Send message, attach image |
| Navigation | Account sidebar/tabs |
| Empty States | "Messages appear here when you're chatting with a creator about an order" |
| Error States | Standard |
| Loading States | Skeleton for thread list and message history |
| Responsive Behaviour | Single-pane (list → thread) navigation on mobile; two-pane split on desktop |
| Accessibility Notes | New messages announced to screen reader users in an active thread |
| Success Criteria | Reduces reliance on off-platform communication channels |

### 5.11 Support Tickets (List + Detail)
| Field | Detail |
|---|---|
| Purpose | Track raised support tickets and their resolution status. |
| Target Users | Buyer |
| Entry Points | Account menu, Order Detail |
| Exit Points | Ticket Detail |
| Primary Goal | Self-service visibility into support resolution progress |
| Page Sections | List: 1) List of tickets with status. Detail: 1) Conversation thread 2) Related order context 3) Status |
| Components Used | List, Status Badge, Textarea (reply) |
| Actions | View ticket, reply, reopen (if auto-closed) |
| Navigation | Account sidebar/tabs |
| Empty States | "No open support requests" + raise-ticket CTA |
| Error States | Standard |
| Loading States | Skeleton |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Buyer always knows current ticket status without needing to ask |

### 5.12 Reviews (Buyer's own submitted reviews)
| Field | Detail |
|---|---|
| Purpose | View and manage reviews the buyer has submitted. |
| Target Users | Buyer |
| Entry Points | Account menu, Order Detail ("Leave a Review") |
| Exit Points | Product Detail (view live review) |
| Primary Goal | Let buyers track and manage their own review history |
| Page Sections | 1) List of submitted reviews with rating, product, date |
| Components Used | Review Card, List |
| Actions | Edit (within window), remove |
| Navigation | Account sidebar/tabs |
| Empty States | "You haven't reviewed anything yet" |
| Error States | Standard |
| Loading States | Skeleton |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Encourages ongoing review contribution |

### 5.13 Coupons (Buyer's available/applied coupons)
| Field | Detail |
|---|---|
| Purpose | View available and previously used coupons. |
| Target Users | Buyer |
| Entry Points | Account menu, Checkout ("view available coupons") |
| Exit Points | Checkout (apply) |
| Primary Goal | Transparency on discount eligibility |
| Page Sections | 1) List of Coupon Cards (available/expired) |
| Components Used | Coupon Card |
| Actions | Copy/apply code |
| Navigation | Account sidebar/tabs |
| Empty States | "No coupons available right now" |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | N/A — low-frequency utility screen |

### 5.14 Gift History
| Field | Detail |
|---|---|
| Purpose | Filtered view of past orders marked as gifts, supporting repeat-gifting behavior. |
| Target Users | Buyer (primarily Meaningful Gift Buyer persona) |
| Entry Points | Account menu |
| Exit Points | Order Detail, Repeat Purchase flow |
| Primary Goal | Help buyers recall and repeat successful past gifting decisions |
| Page Sections | 1) Filtered Order Card list (gift-flagged orders only) |
| Components Used | Order Card, List |
| Actions | View order, reorder/repeat purchase |
| Navigation | Account sidebar/tabs |
| Empty States | "No gift orders yet" |
| Error States | Standard |
| Loading States | Skeleton |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Supports Repeat Purchase journey (per `03-user-journeys.md` 3.22) |

### 5.15 Settings
| Field | Detail |
|---|---|
| Purpose | Central hub for account, notification, and privacy settings. |
| Target Users | Buyer |
| Entry Points | Account menu |
| Exit Points | Profile, Addresses, Payment Methods, Notification Preferences, Privacy, Delete Account |
| Primary Goal | Organized, findable access to all account configuration |
| Page Sections | 1) Grouped settings sections (Personal Info, Addresses, Payment, Notifications, Privacy & Data, Delete Account) |
| Components Used | List (grouped links) |
| Actions | Navigate to a specific settings sub-page |
| Navigation | Account sidebar/tabs |
| Empty States | N/A |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Every setting is findable within one navigation level |

### 5.16 Delete Account
| Field | Detail |
|---|---|
| Purpose | Let a buyer permanently delete their account. |
| Target Users | Buyer |
| Entry Points | Settings |
| Exit Points | Confirmation, logged out |
| Primary Goal | A respectful, straightforward, non-obstructive deletion process (per `03-user-journeys.md` 3.23) |
| Page Sections | 1) Explanation of consequences 2) Secondary confirmation step |
| Components Used | Alert, Confirmation Dialog, Button (Danger) |
| Actions | Confirm deletion |
| Navigation | Settings sub-navigation |
| Empty States | N/A |
| Error States | Blocked with clear explanation if a pending order/dispute/payout exists (per `01-product-requirements.md` AUTH-07) |
| Loading States | Button loading state |
| Responsive Behaviour | Standard |
| Accessibility Notes | Confirmation dialog fully keyboard operable and clearly worded |
| Success Criteria | Deletion requests honored within policy timeframe with no unexplained blocking |

---

# 6. Creator Screens

### 6.1 Creator Dashboard (Overview)
| Field | Detail |
|---|---|
| Purpose | Central summary of pending actions and performance for a creator. |
| Target Users | Creator, Creator Team Member |
| Entry Points | Dashboard switch control, post-verification landing |
| Exit Points | Orders, Products, Messages, Analytics, Payouts |
| Primary Goal | Surface time-sensitive actions before performance data (per `06-design-system.md` Section 4.11) |
| Page Sections | 1) Pending Actions strip (new orders, low stock, unread messages, pending clarifications) 2) Key performance summary (Analytics Cards) 3) Quick links |
| Components Used | Analytics Card, Order Card, Alert |
| Actions | Navigate to any pending action or dashboard section |
| Navigation | Creator sidebar (per `04-information-architecture.md` Section 6) |
| Empty States | New creator: guided zero-state with first-step guidance (per `01-product-requirements.md` CDASH-01) |
| Error States | Standard |
| Loading States | Skeleton for each widget |
| Responsive Behaviour | Sidebar collapses to drawer on mobile/tablet; widgets stack single-column on mobile |
| Accessibility Notes | Pending-action counts announced, not conveyed by a colored dot alone |
| Success Criteria | Creators act on pending items within a short, predictable window |

### 6.2 Analytics
| Field | Detail |
|---|---|
| Purpose | Detailed performance reporting. |
| Target Users | Creator |
| Entry Points | Creator sidebar, Dashboard Overview |
| Exit Points | Product Editor (drill-in from a specific listing's performance) |
| Primary Goal | Inform business decisions with clear, accessible data |
| Page Sections | 1) Time period selector 2) Sales/traffic/conversion Charts 3) Per-listing breakdown table |
| Components Used | Charts, Analytics Card, Table |
| Actions | Change time period, drill into a listing |
| Navigation | Creator sidebar |
| Empty States | New creator, no sales yet: guided zero-state (per `01-product-requirements.md` ANLY-01) |
| Error States | Data freshness/lag clearly indicated, not presented as final if incomplete |
| Loading States | Skeleton charts |
| Responsive Behaviour | Charts stack single-column on mobile; table becomes horizontally scrollable |
| Accessibility Notes | Every chart paired with an accessible data-table equivalent (per `06-design-system.md` Section 26.14) |
| Success Criteria | Creators report analytics meaningfully inform decisions |

### 6.3 Orders (List / Queue)
| Field | Detail |
|---|---|
| Purpose | List and prioritize incoming/active orders. |
| Target Users | Creator, Creator Team Member |
| Entry Points | Creator sidebar, Dashboard pending-action link |
| Exit Points | Order Detail |
| Primary Goal | Prioritize time-sensitive orders needing action |
| Page Sections | 1) Filter (status) 2) Prioritized Order Queue list |
| Components Used | Order Queue, Order Card, Dropdown (filter) |
| Actions | Select an order, filter |
| Navigation | Creator sidebar |
| Empty States | New creator/no orders yet: encouraging zero-state |
| Error States | Standard |
| Loading States | Skeleton list |
| Responsive Behaviour | Standard list pattern |
| Accessibility Notes | Standard |
| Success Criteria | New orders acknowledged within a short, predictable window |

### 6.4 Order Detail (Creator view)
| Field | Detail |
|---|---|
| Purpose | Manage a specific order/sub-order through fulfillment. |
| Target Users | Creator, Creator Team Member |
| Entry Points | Orders list, Dashboard alert |
| Exit Points | Customization Clarification (Messages), Shipping action |
| Primary Goal | Give the creator everything needed to fulfill correctly |
| Page Sections | 1) Buyer/gift details (recipient, note if applicable) 2) Customization details 3) Order Timeline / status control 4) Mark Shipped action |
| Components Used | Order Timeline, Customization Panel (read view), Button (status actions), Gift Message (if applicable) |
| Actions | Request clarification, update status, mark shipped, message buyer |
| Navigation | Standard, back to Orders |
| Empty States | N/A |
| Error States | Status changes only possible from valid preceding states (per `01-product-requirements.md` SHIP-02) |
| Loading States | Skeleton |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | High on-time fulfillment rate |

### 6.5 Inventory
| Field | Detail |
|---|---|
| Purpose | Manage stock/capacity across all listings. |
| Target Users | Creator, Creator Team Member |
| Entry Points | Creator sidebar |
| Exit Points | Edit Product (drill-in) |
| Primary Goal | Prevent overselling, keep availability accurate |
| Page Sections | 1) Inventory Table (listing, stock/capacity, low-stock alert) |
| Components Used | Inventory Table |
| Actions | Edit quantity/capacity inline |
| Navigation | Creator sidebar |
| Empty States | No listings yet: prompt to Add Product |
| Error States | Atomic decrement prevents overselling; conflicting near-simultaneous edits handled gracefully (per `01-product-requirements.md` INV-01) |
| Loading States | Skeleton table |
| Responsive Behaviour | Table becomes horizontally scrollable / card-based list on mobile |
| Accessibility Notes | Inline-editable cells fully keyboard operable |
| Success Criteria | Near-zero overselling incidents |

### 6.6 Products (List)
| Field | Detail |
|---|---|
| Purpose | Manage the full listing catalog. |
| Target Users | Creator, Creator Team Member |
| Entry Points | Creator sidebar |
| Exit Points | Add Product, Edit Product, Drafts |
| Primary Goal | Full visibility and control over the catalog |
| Page Sections | 1) Filter (status: Published/Draft/Sold Out/Archived) 2) Product list/grid |
| Components Used | Product Card (creator variant with status badge), Dropdown (filter) |
| Actions | Create, edit, publish/unpublish, archive |
| Navigation | Creator sidebar |
| Empty States | New creator: prompt to Add Product |
| Error States | Standard |
| Loading States | Skeleton grid |
| Responsive Behaviour | Standard grid |
| Accessibility Notes | Standard |
| Success Criteria | Creators manage catalog without external help |

### 6.7 Add Product
| Field | Detail |
|---|---|
| Purpose | Create a new listing. |
| Target Users | Creator, Creator Team Member (if permitted) |
| Entry Points | Products list |
| Exit Points | Products list (on save/publish) |
| Primary Goal | Guided, encouraging listing creation with clear required-field guidance |
| Page Sections | 1) Images/Media (Upload) 2) Title, description, price, category 3) Customization options configuration 4) Disclosure (handmade/made-to-order) 5) Shipping/lead-time 6) Save Draft / Submit for Publishing |
| Components Used | Product Editor, Upload, Text input, Select, Textarea, Stepper (if broken into steps) |
| Actions | Fill fields, save draft, submit for publishing |
| Navigation | Standard, back to Products |
| Empty States | N/A |
| Error States | Required fields (image, disclosure, category, price) block submission with specific guidance (per `01-product-requirements.md` Section 7.1) |
| Loading States | Upload progress for images |
| Responsive Behaviour | Single-column form on mobile; multi-column field grouping on desktop |
| Accessibility Notes | Standard form accessibility; contextual guidance/examples for less-experienced creators (per `06-design-system.md` Section 11.14) |
| Success Criteria | Creators complete listing creation without external help |

### 6.8 Edit Product
| Field | Detail |
|---|---|
| Purpose | Modify an existing listing. |
| Target Users | Creator, Creator Team Member (if permitted) |
| Entry Points | Products list, Inventory (drill-in) |
| Exit Points | Products list |
| Primary Goal | Safe, clear editing without breaking historical order references |
| Page Sections | Same structure as Add Product (6.7), pre-populated |
| Components Used | Same as 6.7 |
| Actions | Edit fields, save |
| Navigation | Standard |
| Empty States | N/A |
| Error States | Edits removing a required field are blocked from saving (per `03-user-journeys.md` 4.5) |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Edits save without unintended effects on historical orders |

### 6.9 Drafts
| Field | Detail |
|---|---|
| Purpose | View and resume incomplete/unpublished listing drafts. |
| Target Users | Creator |
| Entry Points | Products list (filtered), Add Product (save-and-exit) |
| Exit Points | Add/Edit Product (resume) |
| Primary Goal | Let creators safely pause and resume listing creation |
| Page Sections | 1) List of draft listings with last-edited date |
| Components Used | List, Product Card (draft variant) |
| Actions | Resume editing, delete draft |
| Navigation | Products sub-navigation |
| Empty States | "No drafts" |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Reduces abandoned/incomplete listing creation |

### 6.10 Media Library
| Field | Detail |
|---|---|
| Purpose | Central repository of a creator's uploaded images for reuse across listings/storefront. |
| Target Users | Creator, Creator Team Member |
| Entry Points | Product Editor (Upload step), Storefront Settings |
| Exit Points | Back to the initiating form |
| Primary Goal | Avoid redundant re-uploads and support consistent visual quality |
| Page Sections | 1) Grid of uploaded media 2) Upload new |
| Components Used | Upload, Image grid |
| Actions | Select existing media, upload new, delete unused media |
| Navigation | Embedded within Product Editor/Storefront Settings, not a standalone sidebar item |
| Empty States | "No media uploaded yet" + upload prompt |
| Error States | Invalid file format/size caught with clear inline message |
| Loading States | Upload progress indicators |
| Responsive Behaviour | Grid reduces columns on mobile |
| Accessibility Notes | Each media item has an editable alt-text field |
| Success Criteria | Reduced duplicate uploads; consistent photography quality bar |

### 6.11 Reviews (Creator view)
| Field | Detail |
|---|---|
| Purpose | View and respond to buyer reviews. |
| Target Users | Creator |
| Entry Points | Creator sidebar, new-review notification |
| Exit Points | N/A (self-contained) |
| Primary Goal | Enable transparent, timely response to feedback |
| Page Sections | 1) Filter (rating, responded/unresponded) 2) Review list with inline reply composer |
| Components Used | Review Card, Textarea (reply) |
| Actions | Reply to a review |
| Navigation | Creator sidebar |
| Empty States | "No reviews yet" |
| Error States | Response content subject to moderation rules (per `01-product-requirements.md` REV-03) |
| Loading States | Skeleton list |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | High response rate to critical reviews specifically |

### 6.12 Messages (Creator inbox)
| Field | Detail |
|---|---|
| Purpose | Order-contextual and pre-purchase-inquiry buyer communication. |
| Target Users | Creator, Creator Team Member (if permitted) |
| Entry Points | Creator sidebar, Order Detail |
| Exit Points | Order Detail (return) |
| Primary Goal | Fast, structured communication reducing production errors |
| Page Sections | Same two-pane structure as Buyer Messages (5.10) |
| Components Used | List, Textarea, Upload |
| Actions | Send message, request clarification, attach image |
| Navigation | Creator sidebar |
| Empty States | "No messages yet" |
| Error States | Standard |
| Loading States | Skeleton |
| Responsive Behaviour | Single-pane on mobile, two-pane on desktop |
| Accessibility Notes | Standard |
| Success Criteria | Reduced clarification cycles per order (per `03-user-journeys.md` 4.9) |

### 6.13 Store Settings (hub)
| Field | Detail |
|---|---|
| Purpose | Central hub linking to Branding, Shipping, Payouts, Coupons, Team, Verification, Policies. |
| Target Users | Creator |
| Entry Points | Creator sidebar |
| Exit Points | Each linked sub-section |
| Primary Goal | Organized, findable storefront configuration |
| Page Sections | 1) Grouped settings links, plus Pause Store toggle |
| Components Used | List (grouped links), Toggle (Pause Store) |
| Actions | Navigate to sub-section, toggle Pause Store |
| Navigation | Creator sidebar |
| Empty States | N/A |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Every setting findable within one navigation level |

### 6.14 Branding
| Field | Detail |
|---|---|
| Purpose | Edit storefront story, imagery, and identity. |
| Target Users | Creator |
| Entry Points | Store Settings |
| Exit Points | Store Preview |
| Primary Goal | Let creators shape a genuine brand identity |
| Page Sections | 1) Store Banner upload 2) Avatar upload 3) Storefront name 4) Story (Rich Text) |
| Components Used | Upload, Rich Text input, Text input |
| Actions | Edit and save branding fields |
| Navigation | Store Settings sub-navigation |
| Empty States | N/A |
| Error States | Prohibited content flagged/blocked before publishing (per `01-product-requirements.md` STORE-02) |
| Loading States | Upload progress |
| Responsive Behaviour | Standard form pattern |
| Accessibility Notes | Standard |
| Success Criteria | Creators report the storefront authentically reflects their brand |

### 6.15 Shipping (Storefront policy)
| Field | Detail |
|---|---|
| Purpose | Configure default shipping methods and lead times. |
| Target Users | Creator |
| Entry Points | Store Settings |
| Exit Points | N/A |
| Primary Goal | Set accurate, honest delivery expectations platform-wide for the creator |
| Page Sections | 1) Default lead time 2) Shipping method/regions served |
| Components Used | Text input, Select |
| Actions | Edit and save shipping defaults |
| Navigation | Store Settings sub-navigation |
| Empty States | N/A |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Reduces per-listing repetitive configuration |

### 6.16 Payouts
| Field | Detail |
|---|---|
| Purpose | View payout history and upcoming payouts. |
| Target Users | Creator |
| Entry Points | Creator sidebar |
| Exit Points | Order Detail (drill into a reconciling order) |
| Primary Goal | Financial transparency, foundational to creator trust |
| Page Sections | 1) Upcoming payout summary 2) Payout history table |
| Components Used | Payout Summary, Table |
| Actions | Drill into a specific payout's reconciling orders |
| Navigation | Creator sidebar |
| Empty States | First-time creator, no payouts yet: reassuring explanation of how/when payouts begin |
| Error States | Any adjustment (refund/dispute impact) shown with a clear, traceable explanation (per `01-product-requirements.md` PAY-04) |
| Loading States | Skeleton table |
| Responsive Behaviour | Table becomes card-based list on mobile |
| Accessibility Notes | Standard |
| Success Criteria | Near-zero unexplained payout discrepancies reported |

### 6.17 Coupons (Creator storefront-level)
| Field | Detail |
|---|---|
| Purpose | Create storefront-specific promotions within platform guardrails. |
| Target Users | Creator |
| Entry Points | Creator sidebar or Store Settings |
| Exit Points | N/A |
| Primary Goal | Give creators promotional flexibility without harming margin |
| Page Sections | 1) List of active/past promotions 2) Create new promotion form |
| Components Used | Coupon Card, Text input, Select |
| Actions | Create, edit, deactivate a promotion |
| Navigation | Creator sidebar |
| Empty States | "No active promotions" |
| Error States | Attempts exceeding platform-defined discount limits are blocked with explanation (per `01-product-requirements.md` CPN-02) |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Promotions used without unintended margin erosion |

### 6.18 Team Members
| Field | Detail |
|---|---|
| Purpose | Manage delegated Creator Team Member access. |
| Target Users | Creator (owner) |
| Entry Points | Store Settings |
| Exit Points | N/A |
| Primary Goal | Safe, scoped delegation of operational tasks |
| Page Sections | 1) List of current team members with role 2) Invite new member form |
| Components Used | List, Text input (email), Select (role template), Button |
| Actions | Invite, adjust role, revoke access |
| Navigation | Store Settings sub-navigation |
| Empty States | "You haven't added any team members yet" |
| Error States | Standard invite validation |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Team invitations used productively with no permission-scope confusion |

### 6.19 Verification (Creator-side status/management)
| Field | Detail |
|---|---|
| Purpose | View verification status and, if needed, resubmit information. |
| Target Users | Creator |
| Entry Points | Store Settings, persistent banner if incomplete |
| Exit Points | N/A |
| Primary Goal | Transparency on trust/verification standing |
| Page Sections | 1) Current status 2) Submitted evidence (read-only or resubmit if requested) |
| Components Used | Status Badge, Upload (if resubmission needed) |
| Actions | Resubmit information if requested |
| Navigation | Store Settings sub-navigation |
| Empty States | N/A |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Creators always understand their current verification standing |

### 6.20 Policies
| Field | Detail |
|---|---|
| Purpose | View/configure storefront-level policies (within platform guardrails), e.g., customization change policy. |
| Target Users | Creator |
| Entry Points | Store Settings |
| Exit Points | N/A |
| Primary Goal | Let creators set clear, buyer-visible expectations within allowed bounds |
| Page Sections | 1) Editable policy fields (where platform allows creator customization) |
| Components Used | Textarea, Text input |
| Actions | Edit and save |
| Navigation | Store Settings sub-navigation |
| Empty States | N/A |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Reduces buyer confusion/disputes over policy expectations |

### 6.21 Store Preview
| Field | Detail |
|---|---|
| Purpose | Preview the storefront exactly as buyers will see it, before/while making changes. |
| Target Users | Creator |
| Entry Points | Branding, Products |
| Exit Points | Back to editing context |
| Primary Goal | Confidence that changes look right before they go live |
| Page Sections | Renders the public Creator Store (3.11) layout in a preview context |
| Components Used | Same as Creator Store (3.11) |
| Actions | Return to editing |
| Navigation | Modal/full-screen preview overlay |
| Empty States | N/A |
| Error States | N/A |
| Loading States | Standard |
| Responsive Behaviour | Includes a device-size toggle (mobile/desktop preview) |
| Accessibility Notes | Standard |
| Success Criteria | Reduces surprises after publishing changes |

### 6.22 Creator Profile (personal account settings, distinct from Storefront Branding)
| Field | Detail |
|---|---|
| Purpose | Manage the creator's personal account settings (shared with their Buyer identity where applicable). |
| Target Users | Creator |
| Entry Points | Account-level menu within Creator Dashboard |
| Exit Points | N/A |
| Primary Goal | Distinguish personal account management from public storefront branding |
| Page Sections | Same structure as Buyer Profile (5.2) |
| Components Used | Text input, Button |
| Actions | Edit and save |
| Navigation | Account-level menu |
| Empty States | N/A |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Standard |

---

# 7. Admin Screens

### 7.1 Admin Dashboard
| Field | Detail |
|---|---|
| Purpose | Operational overview for Admin/Super Admin. |
| Target Users | Admin, Super Admin |
| Entry Points | Admin login, Admin Navigation root |
| Exit Points | Creator Applications, Refund Queue, Moderation, Analytics |
| Primary Goal | Surface pending operational actions first (per `06-design-system.md` Section 4.11) |
| Page Sections | 1) Pending applications count 2) Moderation/Refund queue sizes 3) Platform health KPIs |
| Components Used | Alert, Analytics Card, List |
| Actions | Navigate to any queue/section |
| Navigation | Admin sidebar |
| Empty States | Standard |
| Error States | Standard |
| Loading States | Skeleton widgets |
| Responsive Behaviour | Desktop-first (per `06-design-system.md` Section 18); functional but secondary on mobile |
| Accessibility Notes | Standard |
| Success Criteria | Admin acts on highest-priority items first |

### 7.2 Users (Buyer directory)
| Field | Detail |
|---|---|
| Purpose | Directory of buyer accounts. |
| Target Users | Admin |
| Entry Points | Admin sidebar |
| Exit Points | User Detail |
| Primary Goal | Fast lookup and operational access to buyer accounts |
| Page Sections | 1) Search/filter 2) User Table |
| Components Used | User Table, Search Bar |
| Actions | Search, select a user |
| Navigation | Admin sidebar |
| Empty States | N/A |
| Error States | Standard |
| Loading States | Skeleton table |
| Responsive Behaviour | Table scrollable on mobile |
| Accessibility Notes | Standard table accessibility |
| Success Criteria | Fast account lookup during support/escalation |

### 7.3 Creators (Directory + Detail)
| Field | Detail |
|---|---|
| Purpose | Directory and full operational view of creators. |
| Target Users | Admin |
| Entry Points | Admin sidebar |
| Exit Points | Creator Detail (orders, payments, moderation history for that creator) |
| Primary Goal | Full operational visibility into any creator |
| Page Sections | List: Table. Detail: 1) Profile summary 2) Orders 3) Payments 4) Moderation history |
| Components Used | User Table (creator variant), Tabs (detail sections) |
| Actions | Search, select, drill into sub-sections |
| Navigation | Admin sidebar |
| Empty States | N/A |
| Error States | Standard |
| Loading States | Skeleton |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Complete context available without cross-referencing multiple tools |

### 7.4 Creator Applications (Review Queue + Detail)
| Field | Detail |
|---|---|
| Purpose | Review and decide on new creator applications. |
| Target Users | Admin |
| Entry Points | Admin sidebar, Dashboard alert |
| Exit Points | Application Detail → Approve/Reject outcome |
| Primary Goal | Consistent, timely, well-documented review decisions |
| Page Sections | Queue: prioritized list. Detail: 1) Portfolio/evidence 2) Identity info 3) Approve/Reject actions with reason capture |
| Components Used | List, Creator Approval, Button (Success/Danger variants) |
| Actions | Review, approve, reject, request more info |
| Navigation | Admin sidebar |
| Empty States | "No pending applications" |
| Error States | Standard |
| Loading States | Skeleton |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Review turnaround within SLA |

### 7.5 Products (Platform-wide listing directory)
| Field | Detail |
|---|---|
| Purpose | Platform-wide listing directory for operational/moderation lookup. |
| Target Users | Admin |
| Entry Points | Admin sidebar |
| Exit Points | Listing Review Detail (Moderation) |
| Primary Goal | Fast lookup of any listing platform-wide |
| Page Sections | 1) Search/filter (category, status) 2) Table |
| Components Used | Table, Search Bar |
| Actions | Search, select, drill into moderation view |
| Navigation | Admin sidebar |
| Empty States | N/A |
| Error States | Standard |
| Loading States | Skeleton table |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Fast listing lookup |

### 7.6 Orders (Platform-wide)
| Field | Detail |
|---|---|
| Purpose | Platform-wide order directory. |
| Target Users | Admin |
| Entry Points | Admin sidebar |
| Exit Points | Order Detail (Admin view) |
| Primary Goal | Operational visibility across all orders |
| Page Sections | 1) Search/filter (status, date, creator, buyer) 2) Table |
| Components Used | Table, Search Bar |
| Actions | Search, filter, select an order |
| Navigation | Admin sidebar |
| Empty States | N/A |
| Error States | Standard |
| Loading States | Skeleton table |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Fast order lookup during dispute handling |

### 7.7 Payments
| Field | Detail |
|---|---|
| Purpose | Platform-wide payout overview. |
| Target Users | Admin, Super Admin |
| Entry Points | Admin sidebar |
| Exit Points | Refund Queue |
| Primary Goal | Financial operational visibility |
| Page Sections | 1) Payout status summary 2) Table of recent payouts |
| Components Used | Table, Analytics Card |
| Actions | Drill into a payout |
| Navigation | Admin sidebar |
| Empty States | N/A |
| Error States | Standard |
| Loading States | Skeleton |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Standard |

### 7.8 Refunds (Queue + Detail)
| Field | Detail |
|---|---|
| Purpose | Review and process pending refund/dispute requests. |
| Target Users | Admin |
| Entry Points | Admin sidebar, Dashboard alert, Support escalation |
| Exit Points | Order Detail |
| Primary Goal | Fair, timely, policy-consistent refund resolution |
| Page Sections | Queue: prioritized list. Detail: 1) Order/payment context 2) Approve/Reject with reason |
| Components Used | List, Payment Summary, Button (Success/Danger) |
| Actions | Approve, reject, escalate to Super Admin |
| Navigation | Admin sidebar |
| Empty States | "No pending refund requests" |
| Error States | Requests exceeding Admin authority flagged for Super Admin escalation |
| Loading States | Skeleton |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Refunds processed within SLA with full traceability |

### 7.9 Collections (Curation management)
| Field | Detail |
|---|---|
| Purpose | Create and manage curated Collections. |
| Target Users | Admin |
| Entry Points | Admin sidebar |
| Exit Points | Collection page (preview) |
| Primary Goal | Fast, flexible merchandising without engineering involvement |
| Page Sections | 1) List of collections 2) Create/edit form (listing selection, scheduling) |
| Components Used | List, Product Card (selection UI), Date Picker (scheduling) |
| Actions | Create, edit, schedule, publish/unpublish |
| Navigation | Admin sidebar |
| Empty States | N/A |
| Error States | Unavailable listings auto-excluded from a collection (per `01-product-requirements.md` COLL-01) |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Collections publishable without engineering support |

### 7.10 Categories (Taxonomy management)
| Field | Detail |
|---|---|
| Purpose | Manage the category taxonomy. |
| Target Users | Admin |
| Entry Points | Admin sidebar |
| Exit Points | N/A |
| Primary Goal | Keep taxonomy accurate as the catalog grows |
| Page Sections | 1) Hierarchical category tree/list 2) Create/edit/merge/retire actions |
| Components Used | Table (tree-structured), Button |
| Actions | Create, edit, merge, retire a category |
| Navigation | Admin sidebar |
| Empty States | N/A |
| Error States | Retiring a category requires listing reassignment first (per `01-product-requirements.md` CAT-02) |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Zero orphaned listings after taxonomy changes |

### 7.11 CMS
| Field | Detail |
|---|---|
| Purpose | Manage editorial and legal content. |
| Target Users | Admin, Super Admin |
| Entry Points | Admin sidebar |
| Exit Points | Homepage/Legal page (preview) |
| Primary Goal | Content changes without engineering involvement |
| Page Sections | 1) Content list (Homepage features, Legal pages, Occasion pages) 2) Editor with preview and scheduling |
| Components Used | Rich Text input, Date Picker, Button (preview/publish) |
| Actions | Edit, preview, schedule, publish |
| Navigation | Admin sidebar |
| Empty States | N/A |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Content changes ship without engineering dependency |

### 7.12 Support (Admin oversight view)
| Field | Detail |
|---|---|
| Purpose | Admin-level visibility into Support queue health (distinct from Support Executive's own working queue, Section 9). |
| Target Users | Admin |
| Entry Points | Admin sidebar |
| Exit Points | Ticket Detail |
| Primary Goal | Monitor SLA and escalation health across the Support function |
| Page Sections | 1) Queue health summary 2) Escalated tickets list |
| Components Used | Analytics Card, List |
| Actions | Drill into an escalated ticket |
| Navigation | Admin sidebar |
| Empty States | Standard |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Standard |

### 7.13 Moderation (Admin oversight view)
| Field | Detail |
|---|---|
| Purpose | Admin-level visibility into Moderation queue health (distinct from Moderator's own working queue, Section 8). |
| Target Users | Admin |
| Entry Points | Admin sidebar |
| Exit Points | Listing/Review Moderation Detail |
| Primary Goal | Monitor moderation SLA and escalation health |
| Page Sections | 1) Queue health summary 2) Escalated items list |
| Components Used | Analytics Card, List |
| Actions | Drill into an escalated item |
| Navigation | Admin sidebar |
| Empty States | Standard |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Standard |

### 7.14 Reports
| Field | Detail |
|---|---|
| Purpose | Scheduled/exportable reporting views. |
| Target Users | Admin, Super Admin |
| Entry Points | Admin sidebar, Analytics |
| Exit Points | N/A |
| Primary Goal | Support offline/exported analysis |
| Page Sections | 1) Report type selector 2) Table with export action |
| Components Used | Table, Select, Button (export) |
| Actions | Generate, export |
| Navigation | Admin sidebar |
| Empty States | Standard |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Standard |

### 7.15 Analytics (Platform-wide)
| Field | Detail |
|---|---|
| Purpose | Aggregate platform KPI reporting. |
| Target Users | Admin, Super Admin |
| Entry Points | Admin sidebar |
| Exit Points | Creator Detail, Category drill-in |
| Primary Goal | Inform operational and strategic decisions |
| Page Sections | 1) KPI summary (per `01-product-requirements.md` Section 10) 2) Charts 3) Segmented drill-in (by category, creator, region) |
| Components Used | Analytics Card, Charts |
| Actions | Change time period, drill into a segment |
| Navigation | Admin sidebar |
| Empty States | Standard |
| Error States | Standard |
| Loading States | Skeleton charts |
| Responsive Behaviour | Standard |
| Accessibility Notes | Accessible data-table equivalent for every chart |
| Success Criteria | Standard |

### 7.16 Audit Logs
| Field | Detail |
|---|---|
| Purpose | Full chronological record of internal actions. |
| Target Users | Super Admin |
| Entry Points | Admin sidebar (Super Admin only) |
| Exit Points | N/A |
| Primary Goal | Complete accountability and traceability |
| Page Sections | 1) Filter (actor, action type, date) 2) Table |
| Components Used | Audit Log (Table variant) |
| Actions | Search, filter |
| Navigation | Admin sidebar |
| Empty States | N/A |
| Error States | Standard |
| Loading States | Skeleton table |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Every sensitive action fully traceable |

### 7.17 Feature Flags
| Field | Detail |
|---|---|
| Purpose | Reserved administrative control surface for toggling in-development capabilities. |
| Target Users | Super Admin |
| Entry Points | Admin sidebar (Super Admin only) |
| Exit Points | N/A |
| Primary Goal | Controlled rollout capability |
| Page Sections | 1) List of flags with toggle state |
| Components Used | List, Toggle |
| Actions | Toggle a flag |
| Navigation | Admin sidebar |
| Empty States | N/A |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | N/A — operational utility, not user-facing |

### 7.18 Roles & Permissions
| Field | Detail |
|---|---|
| Purpose | Manage internal role assignments and permission scope. |
| Target Users | Super Admin |
| Entry Points | Admin sidebar (Super Admin only) |
| Exit Points | N/A |
| Primary Goal | Safe, auditable control over internal access |
| Page Sections | 1) Permission Matrix (roles × permissions) 2) User-to-role assignment list |
| Components Used | Permission Matrix, Table |
| Actions | Assign/revoke a role, adjust permission scope |
| Navigation | Admin sidebar |
| Empty States | N/A |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Table scrollable on mobile |
| Accessibility Notes | Standard |
| Success Criteria | Zero unauthorized access incidents |

### 7.19 System Settings
| Field | Detail |
|---|---|
| Purpose | Platform-wide policy configuration (commission, discount stacking limits, verification requirements). |
| Target Users | Super Admin |
| Entry Points | Admin sidebar (Super Admin only) |
| Exit Points | N/A |
| Primary Goal | Central, versioned, auditable policy control |
| Page Sections | 1) Grouped policy configuration sections 2) Change history |
| Components Used | Text input, Select, Table (change history) |
| Actions | Edit and save a policy value |
| Navigation | Admin sidebar |
| Empty States | N/A |
| Error States | Changes apply prospectively only, never retroactively (per `01-product-requirements.md` ADM-04) |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Policy changes apply cleanly with no retroactive disruption |

---

# 8. Moderator Screens

### 8.1 Dashboard
| Field | Detail |
|---|---|
| Purpose | Moderator overview, prioritized by SLA and severity. |
| Target Users | Moderator |
| Entry Points | Moderator login |
| Exit Points | Review Queue |
| Primary Goal | Surface SLA-at-risk and high-severity items first |
| Page Sections | 1) Queue size by severity 2) SLA-at-risk items list |
| Components Used | Analytics Card, List, Status Badge |
| Actions | Navigate into a queue |
| Navigation | Moderator sidebar |
| Empty States | "Queue is clear" |
| Error States | Standard |
| Loading States | Skeleton |
| Responsive Behaviour | Desktop-first, functional on mobile |
| Accessibility Notes | Standard |
| Success Criteria | Moderators address highest-severity items first |

### 8.2 Review Queue
| Field | Detail |
|---|---|
| Purpose | Prioritized list of flagged listings, reviews, and storefronts. |
| Target Users | Moderator |
| Entry Points | Moderator sidebar, Dashboard |
| Exit Points | Creator Review, Product Review |
| Primary Goal | Efficient triage by severity/SLA |
| Page Sections | 1) Filter (content type, severity) 2) Prioritized list |
| Components Used | List, Status Badge, Dropdown (filter) |
| Actions | Select an item to review |
| Navigation | Moderator sidebar |
| Empty States | "Queue is clear" |
| Error States | Standard |
| Loading States | Skeleton list |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Queue processed within SLA |

### 8.3 Creator Review
| Field | Detail |
|---|---|
| Purpose | Investigate a flagged creator/storefront. |
| Target Users | Moderator |
| Entry Points | Review Queue |
| Exit Points | Take Action outcome, Escalate |
| Primary Goal | Fair, documented investigation |
| Page Sections | 1) Storefront content in question 2) Violation context/history 3) Action panel |
| Components Used | Creator Profile (read view), Button (action set) |
| Actions | Approve, remove content, warn, escalate |
| Navigation | Moderator sidebar |
| Empty States | N/A |
| Error States | Ambiguous cases route to Escalate rather than a forced binary decision |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Accurate, consistent decisions (low appeal-overturn rate) |

### 8.4 Product Review
| Field | Detail |
|---|---|
| Purpose | Investigate a flagged listing. |
| Target Users | Moderator |
| Entry Points | Review Queue |
| Exit Points | Take Action outcome, Escalate |
| Primary Goal | Fair, documented investigation |
| Page Sections | 1) Listing content in question 2) Violation context/history 3) Action panel |
| Components Used | Product Detail (read view), Button (action set) |
| Actions | Approve, reject, request changes, escalate |
| Navigation | Moderator sidebar |
| Empty States | N/A |
| Error States | Same as 8.3 |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Same as 8.3 |

### 8.5 Appeals
| Field | Detail |
|---|---|
| Purpose | Review appeals submitted against moderation decisions. |
| Target Users | Moderator (ideally a reviewer independent of the original decision), Admin |
| Entry Points | Moderator sidebar |
| Exit Points | Decision History |
| Primary Goal | Fair, independent reconsideration |
| Page Sections | 1) Appeal list 2) Detail: original decision + appellant's argument + outcome action |
| Components Used | List, Alert, Button (uphold/reverse) |
| Actions | Review, uphold, reverse |
| Navigation | Moderator sidebar |
| Empty States | "No pending appeals" |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Appeals resolved fairly within a reasonable timeframe |

### 8.6 Reports (Moderation-specific)
| Field | Detail |
|---|---|
| Purpose | Summarized moderation activity and trend reporting. |
| Target Users | Moderator, Admin |
| Entry Points | Moderator sidebar |
| Exit Points | N/A |
| Primary Goal | Identify patterns (repeat violators, category-specific issues) |
| Page Sections | 1) Trend charts 2) Table |
| Components Used | Charts, Table |
| Actions | Filter, export |
| Navigation | Moderator sidebar |
| Empty States | Standard |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Accessible chart data-equivalents |
| Success Criteria | Standard |

### 8.7 Escalations
| Field | Detail |
|---|---|
| Purpose | Track items escalated to Admin/Super Admin. |
| Target Users | Moderator |
| Entry Points | Moderator sidebar, Creator/Product Review (escalate action) |
| Exit Points | N/A |
| Primary Goal | Visibility into escalation status/outcome |
| Page Sections | 1) List of escalated items with status |
| Components Used | List, Status Badge |
| Actions | View escalation status/outcome |
| Navigation | Moderator sidebar |
| Empty States | "No active escalations" |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | No escalation lost or unresolved silently |

### 8.8 Decision History
| Field | Detail |
|---|---|
| Purpose | Personal/team log of past moderation decisions. |
| Target Users | Moderator |
| Entry Points | Moderator sidebar |
| Exit Points | N/A |
| Primary Goal | Self-review and consistency-checking over time |
| Page Sections | 1) Filterable table of past decisions with reasons |
| Components Used | Table |
| Actions | Filter, review a past decision |
| Navigation | Moderator sidebar |
| Empty States | Standard |
| Error States | Standard |
| Loading States | Skeleton table |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Standard |

---

# 9. Support Screens

### 9.1 Dashboard
| Field | Detail |
|---|---|
| Purpose | Support Executive overview, prioritized by SLA. |
| Target Users | Support Executive |
| Entry Points | Support login |
| Exit Points | Tickets |
| Primary Goal | Surface SLA-at-risk and unassigned tickets first |
| Page Sections | 1) Unassigned count 2) SLA-at-risk list 3) My open tickets count |
| Components Used | Analytics Card, List |
| Actions | Navigate into queue |
| Navigation | Support sidebar |
| Empty States | "Queue is clear" |
| Error States | Standard |
| Loading States | Skeleton |
| Responsive Behaviour | Desktop-first, functional on mobile |
| Accessibility Notes | Standard |
| Success Criteria | Executives address highest-priority tickets first |

### 9.2 Tickets (Queue)
| Field | Detail |
|---|---|
| Purpose | List of open/assigned support tickets. |
| Target Users | Support Executive |
| Entry Points | Support sidebar, Dashboard |
| Exit Points | Ticket Detail |
| Primary Goal | Efficient triage and assignment |
| Page Sections | 1) Filter (status, category, SLA proximity) 2) List |
| Components Used | List, Status Badge, Dropdown (filter) |
| Actions | Select, self-assign a ticket |
| Navigation | Support sidebar |
| Empty States | "No tickets in this view" |
| Error States | Standard |
| Loading States | Skeleton list |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Standard |

### 9.3 Ticket Detail
| Field | Detail |
|---|---|
| Purpose | Investigate and resolve a specific ticket. |
| Target Users | Support Executive |
| Entry Points | Tickets queue |
| Exit Points | Refund Requests (if applicable), Escalation |
| Primary Goal | Full context in one place to resolve efficiently and fairly |
| Page Sections | 1) Issue summary + related order 2) Conversation thread 3) Buyer View / Creator View tabs (scoped context) 4) Resolution actions (reply, refund, escalate, close) |
| Components Used | Tabs, Textarea (reply), Payment Summary (refund context), Button (action set) |
| Actions | Reply, issue refund (within limits), escalate, close |
| Navigation | Support sidebar |
| Empty States | N/A |
| Error States | Refund amount exceeding authority routes to Escalate, not a blocked dead end (per `01-product-requirements.md` SUPP-02) |
| Loading States | Skeleton |
| Responsive Behaviour | Tabs stack on mobile |
| Accessibility Notes | Standard |
| Success Criteria | High first-contact resolution rate |

### 9.4 Buyer View (scoped context panel within Ticket Detail)
| Field | Detail |
|---|---|
| Purpose | Scoped, relevant buyer account/order context for resolving a ticket. |
| Target Users | Support Executive |
| Entry Points | Ticket Detail |
| Exit Points | N/A (embedded panel) |
| Primary Goal | Sufficient context without excess access (per `01-product-requirements.md` SUPP-02) |
| Page Sections | 1) Relevant order(s) 2) Relevant account notes |
| Components Used | Order Card, List |
| Actions | Read-only reference (no edit) |
| Navigation | Embedded within Ticket Detail |
| Empty States | N/A |
| Error States | N/A |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Standard |

### 9.5 Creator View (scoped context panel within Ticket Detail)
| Field | Detail |
|---|---|
| Purpose | Scoped, relevant creator account/order context for resolving a ticket. |
| Target Users | Support Executive |
| Entry Points | Ticket Detail |
| Exit Points | N/A (embedded panel) |
| Primary Goal | Same as 9.4, for the creator side of a ticket |
| Page Sections | 1) Relevant order(s) 2) Relevant storefront notes |
| Components Used | Order Card, List |
| Actions | Read-only reference |
| Navigation | Embedded within Ticket Detail |
| Empty States | N/A |
| Error States | N/A |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Standard |

### 9.6 Refund Requests (Support working queue)
| Field | Detail |
|---|---|
| Purpose | Process refund requests within Support's policy authority. |
| Target Users | Support Executive |
| Entry Points | Support sidebar, Ticket Detail |
| Exit Points | Ticket Detail |
| Primary Goal | Fast, policy-consistent refund handling |
| Page Sections | 1) Queue list 2) Approve/reject with reason |
| Components Used | List, Payment Summary, Button |
| Actions | Approve, reject, escalate if beyond authority |
| Navigation | Support sidebar |
| Empty States | "No pending refund requests" |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Standard |

### 9.7 Knowledge Base (internal reference, distinct from public FAQ)
| Field | Detail |
|---|---|
| Purpose | Internal reference articles supporting consistent ticket resolution. |
| Target Users | Support Executive |
| Entry Points | Support sidebar, Ticket Detail (contextual suggestion) |
| Exit Points | N/A |
| Primary Goal | Consistent, accurate resolution guidance |
| Page Sections | 1) Search 2) Article list/detail |
| Components Used | Search Bar, List |
| Actions | Search, read an article |
| Navigation | Support sidebar |
| Empty States | Standard |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Reduces resolution inconsistency across executives |

### 9.8 Macros (canned response templates)
| Field | Detail |
|---|---|
| Purpose | Manage reusable response templates for common ticket types. |
| Target Users | Support Executive, Admin (management) |
| Entry Points | Support sidebar, Ticket Detail (insert macro) |
| Exit Points | N/A |
| Primary Goal | Speed and consistency in common responses |
| Page Sections | 1) List of macros 2) Create/edit form |
| Components Used | List, Textarea |
| Actions | Create, edit, insert into a reply |
| Navigation | Support sidebar |
| Empty States | "No macros yet" |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Reduced average reply composition time |

### 9.9 Reports (Support-specific)
| Field | Detail |
|---|---|
| Purpose | Support performance and volume reporting. |
| Target Users | Support Executive, Admin |
| Entry Points | Support sidebar |
| Exit Points | N/A |
| Primary Goal | Visibility into resolution time, volume, satisfaction trends |
| Page Sections | 1) Trend charts 2) Table |
| Components Used | Charts, Table |
| Actions | Filter, export |
| Navigation | Support sidebar |
| Empty States | Standard |
| Error States | Standard |
| Loading States | Standard |
| Responsive Behaviour | Standard |
| Accessibility Notes | Accessible chart data-equivalents |
| Success Criteria | Standard |

---

# 10. System Screens

These are cross-cutting states reachable from virtually any screen in the platform, defined once here and referenced (not redefined) wherever they appear elsewhere in this document.

### 10.1 Loading (Generic full-page)
| Field | Detail |
|---|---|
| Purpose | Full-page loading state for initial app/route load. |
| Target Users | All roles |
| Entry Points | Any initial navigation |
| Exit Points | Loaded destination screen |
| Primary Goal | Communicate progress without a blank screen |
| Page Sections | Skeleton matching the destination screen's approximate layout, or a minimal branded loading indicator for very fast loads |
| Components Used | Skeleton, Loading Spinner |
| Actions | N/A |
| Navigation | N/A |
| Empty States | N/A |
| Error States | Transitions to 500/Network Error if load fails |
| Loading States | This is itself the loading state |
| Responsive Behaviour | Standard |
| Accessibility Notes | Loading state announced to screen reader ("Loading [context]") |
| Success Criteria | Perceived speed; no indefinite/unexplained wait |

### 10.2 Offline
| Field | Detail |
|---|---|
| Purpose | Communicate loss of connectivity while preserving access to cached content. |
| Target Users | All roles |
| Entry Points | Any point connectivity is lost |
| Exit Points | Auto-recovers on reconnect |
| Primary Goal | Calm, non-alarming status communication (per `06-design-system.md` Section 14) |
| Page Sections | Persistent banner over the last-loaded, cached page content — not a full takeover |
| Components Used | Banner |
| Actions | Retry (manual) or automatic reconnect detection |
| Navigation | N/A |
| Empty States | N/A |
| Error States | N/A (this is the offline state itself) |
| Loading States | N/A |
| Responsive Behaviour | Standard |
| Accessibility Notes | Status change announced |
| Success Criteria | User can still access previously loaded content productively |

### 10.3 Maintenance
| Field | Detail |
|---|---|
| Purpose | Communicate planned downtime. |
| Target Users | All roles |
| Entry Points | Any page during a maintenance window |
| Exit Points | Platform restoration |
| Primary Goal | Clear expectation-setting, no implication of normal functionality |
| Page Sections | 1) Illustration 2) Explanation + expected restoration window |
| Components Used | Illustration |
| Actions | N/A |
| Navigation | None shown (full takeover, unlike Offline) |
| Empty States | N/A |
| Error States | N/A |
| Loading States | N/A |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | Minimal confusion/support contact during planned downtime |

### 10.4 Error (500 Server Error)
| Field | Detail |
|---|---|
| Purpose | Handle unexpected system failure. |
| Target Users | All roles |
| Entry Points | Any unexpected failure |
| Exit Points | Retry, Home, Support |
| Primary Goal | Calm acknowledgment without exposing technical detail |
| Page Sections | 1) Illustration 2) Heading + calm explanation 3) Retry (Primary) 4) Support link (Text button) |
| Components Used | Illustration, Button |
| Actions | Retry, contact Support |
| Navigation | Standard |
| Empty States | N/A |
| Error States | This is itself an error state |
| Loading States | N/A |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | High retry-success rate |

### 10.5 Success (Generic confirmation pattern)
| Field | Detail |
|---|---|
| Purpose | Reusable confirmation pattern for completed significant actions (not Order Confirmation specifically, which has its own richer screen). |
| Target Users | All roles |
| Entry Points | Completion of a consequential action (e.g., ticket resolved, application submitted) |
| Exit Points | Relevant next destination |
| Primary Goal | Clear, proportional positive confirmation (per `06-design-system.md` Section 10.7) |
| Page Sections | 1) Success icon/illustration 2) Specific confirmation message 3) Next-step CTA |
| Components Used | Toast (minor actions) or full confirmation composition (major actions) |
| Actions | Proceed to next step |
| Navigation | Standard |
| Empty States | N/A |
| Error States | N/A |
| Loading States | N/A |
| Responsive Behaviour | Standard |
| Accessibility Notes | Announced to screen reader |
| Success Criteria | Standard |

### 10.6 Confirmation (Dialog pattern)
| Field | Detail |
|---|---|
| Purpose | Reusable confirmation-before-consequential-action pattern (maps to Confirmation Dialog, `06-design-system.md` Section 18). |
| Target Users | All roles |
| Entry Points | Any Danger-variant button action |
| Exit Points | Confirmed action proceeds, or Cancel returns to prior state |
| Primary Goal | Prevent accidental irreversible actions |
| Page Sections | 1) Restated consequence 2) Confirm (Danger) / Cancel actions |
| Components Used | Confirmation Dialog, Button |
| Actions | Confirm, Cancel |
| Navigation | Modal overlay |
| Empty States | N/A |
| Error States | N/A |
| Loading States | Confirm button shows loading state during processing |
| Responsive Behaviour | Full-screen on mobile, centered modal on desktop |
| Accessibility Notes | Focus trapped within dialog; Escape cancels |
| Success Criteria | Near-zero accidental irreversible actions |

### 10.7 Empty States (Generic pattern reference)
| Field | Detail |
|---|---|
| Purpose | Cross-reference to the Shared Conventions (Section 1.7) and `06-design-system.md` Section 23 — not a distinct screen, but the governing pattern applied throughout Sections 3–9. |
| Target Users | All roles |
| Entry Points | N/A |
| Exit Points | N/A |
| Primary Goal | N/A |
| Page Sections | N/A |
| Components Used | N/A |
| Actions | N/A |
| Navigation | N/A |
| Empty States | N/A |
| Error States | N/A |
| Loading States | N/A |
| Responsive Behaviour | N/A |
| Accessibility Notes | N/A |
| Success Criteria | N/A |

### 10.8 Permission Denied (403 — cross-reference to 4.12 Access Denied)
| Field | Detail |
|---|---|
| Purpose | See Section 4.12 for full specification; identical pattern used platform-wide regardless of which role is denied access. |
| Target Users | All roles |
| Entry Points | Any restricted destination |
| Exit Points | An appropriate, permitted destination |
| Primary Goal | See 4.12 |
| Page Sections | See 4.12 |
| Components Used | See 4.12 |
| Actions | See 4.12 |
| Navigation | See 4.12 |
| Empty States | N/A |
| Error States | N/A |
| Loading States | N/A |
| Responsive Behaviour | Standard |
| Accessibility Notes | See 4.12 |
| Success Criteria | See 4.12 |

### 10.9 Server Error (cross-reference to 10.4)
| Field | Detail |
|---|---|
| Purpose | See Section 10.4 — identical pattern. |
| Target Users | All roles |
| Entry Points | N/A | 
| Exit Points | N/A |
| Primary Goal | N/A |
| Page Sections | N/A |
| Components Used | N/A |
| Actions | N/A |
| Navigation | N/A |
| Empty States | N/A |
| Error States | N/A |
| Loading States | N/A |
| Responsive Behaviour | N/A |
| Accessibility Notes | N/A |
| Success Criteria | N/A |

### 10.10 Network Error
| Field | Detail |
|---|---|
| Purpose | Handle a failed network request distinct from full Offline state (e.g., a single action failed mid-session while otherwise connected). |
| Target Users | All roles |
| Entry Points | Any failed network request |
| Exit Points | Retry |
| Primary Goal | Localized, non-disruptive error handling |
| Page Sections | Inline error message at the point of the failed action (e.g., a Toast or inline Alert), not a full-page takeover |
| Components Used | Toast, Alert |
| Actions | Retry |
| Navigation | N/A |
| Empty States | N/A |
| Error States | This is itself an error state |
| Loading States | N/A |
| Responsive Behaviour | Standard |
| Accessibility Notes | Standard |
| Success Criteria | User can retry without losing unrelated page state |

---

# 11. Component Mapping

Rather than repeating each screen's component list (already specified per-screen in Sections 3–10), this section provides the **reverse mapping** — which screens consume each `06-design-system.md` component family — so design system changes can be impact-assessed quickly.

| Component Family (`06-design-system.md` Section) | Consuming Screens (representative, not exhaustive) |
|---|---|
| **Navigation** (§16: Navbar, Sidebar, Bottom Nav, Drawer, Tabs, Breadcrumbs, Stepper) | Every screen (Navbar/Bottom Nav); Creator/Admin/Moderator/Support Dashboards (Sidebar); Checkout, Creator Registration (Stepper); Category, Product Detail, Creator Store (Breadcrumbs) |
| **Layout** (§6: Grid, Container, Sidebar patterns) | All screens |
| **Input** (§14: Text, Textarea, Select, Upload, etc.) | Signup/Login, Add/Edit Product, Checkout, Support Ticket, Creator Registration, all Settings screens |
| **Feedback** (§17: Toast, Alert, Banner, Skeleton, Status Badge, Chip, Tag) | Every screen with async actions or state communication — Cart, Order Detail, Product Detail, all Dashboards |
| **Commerce** (§20: Cart, Checkout, Payment Summary, Tracking, Wishlist, Coupon, Customization Panel) | Cart, Checkout, Order Detail, Tracking, Product Detail, Wishlist |
| **Creator** (§21: Store Banner, Store Header, Portfolio Gallery, Inventory Table, Order Queue, Payout Summary, Product Editor) | Creator Store (public), Creator Dashboard, Products, Inventory, Orders, Payouts |
| **Admin** (§22: Dashboard, User Table, Creator Approval, Moderation Queue, Audit Log, Permission Matrix) | Admin Dashboard, Users, Creators, Creator Applications, Roles & Permissions, Audit Logs |
| **Overlay** (§18: Modal, Dialog, Bottom Sheet, Popover, Tooltip, Confirmation Dialog, Image Viewer) | Delete Account, Delete Store, all destructive actions, Product Detail (Image Viewer), Filters (Bottom Sheet on mobile) |
| **Data Display** (§19: Tables, Lists, Timeline, Charts, KPI Cards) | Admin/Moderator/Support queues and detail screens, Analytics (Creator + Admin), Order Timeline |
| **Product** (§15: Product Card, Creator Card, Review Card, Order Card, Collection Card, Category Card, Analytics Card) | Home, Category, Collection, Search Results, Wishlist, Orders, Creator Store, all Dashboards |

---

# 12. Navigation Mapping

Full per-screen previous/next/alternative-path detail is embedded in each screen's specification (Sections 3–10, "Navigation" and "Exit Points" rows). This section summarizes navigation-chrome presence per module, since that chrome (Sidebar vs. Bottom Nav vs. none) is consistent within a module rather than varying screen-by-screen.

| Module | Breadcrumb | Bottom Navigation (mobile) | Sidebar (tablet+) | Back Navigation | Deep Linking |
|---|---|---|---|---|---|
| Public (browse/discovery) | Yes (Category/Collection/Product/Creator/Search) | Yes | No (top nav only) | Browser/system back preserves scroll position | Every public URL is a valid, shareable deep link (per `04-information-architecture.md` Section 12) |
| Public (Cart/Checkout) | No (Stepper instead in Checkout) | Hidden during Checkout | No | Preserves entered data on back | Cart is deep-linkable; Checkout steps are not individually deep-linkable |
| Authentication | No | No | No | Returns to the screen that triggered auth | Not indexed/deep-linked externally |
| Buyer Account Zone | No | Yes (Account tab active) | Tab/stacked menu (mobile), persistent tabs (desktop) | Standard | Order Detail deep-linkable from notifications/email |
| Creator Zone | No (Stepper in onboarding) | Not primary (desktop-first per `06-design-system.md` §18) | Yes, persistent | Standard | Deep-linkable within authenticated session |
| Admin/Moderator/Support Zones | No | No (desktop-first) | Yes, persistent | Standard | Deep-linkable within authenticated session, permission-gated |
| System screens | N/A | N/A | N/A | Retry/Home only | Not deep-linked (reached via state, not URL, except 404) |

---

# 13. User Flow Mapping

Full flow detail (Goal, Trigger, Main/Alternative/Failure/Recovery flows) is defined in `03-user-journeys.md`. This section maps each major flow to its concrete screen sequence for wireframing purposes.

| Flow | Screen Sequence |
|---|---|
| **Discovery** | Home → Category or Collection or Search Results → Product Detail → Creator Store (optional) |
| **Purchase** | Product Detail → Cart → Checkout (Address → Shipping → Review → Payment) → Order Confirmation |
| **Gift Purchase** | Product Detail → Customization Panel (gift note) → Cart → Checkout (gift options) → Order Confirmation → Gift History |
| **Customization** | Product Detail (Customization Panel) → Cart → Order Detail (Creator: Customization Clarification via Messages) → Order Fulfillment |
| **Guest Checkout** | Cart → Guest Checkout (decision) → Checkout → Order Confirmation → (optional) Signup |
| **Creator Onboarding** | Creator Registration (multi-step) → Creator Verification (status) → Store Setup (Branding, Shipping) → Add Product → Products (Published) |
| **Creator Product Creation** | Products → Add Product → Media Library (optional) → Drafts (optional pause) → Products (Published) → Store Preview |
| **Checkout (detail)** | Cart → Checkout Address → Shipping → Review (Payment Summary) → Payment → Order Confirmation |
| **Returns / Refund** | Order Detail → Request Refund → (internal: Refund Requests / Refunds queue) → Order Detail (updated status) |
| **Review** | Order Detail → Leave Review → Product Detail (review now visible) → Creator Reviews (Creator replies) |
| **Support** | Order Detail or FAQ → Support (raise ticket) → Support Tickets (buyer tracking) → (internal: Tickets → Ticket Detail → Resolve) |
| **Admin Approval** | Creator Registration (applicant) → Creator Applications (Admin queue) → Application Detail → Approve/Reject → Creator Verification (status, applicant view) |
| **Moderation** | (flag triggered) → Review Queue → Creator/Product Review → Take Action → Decision History → (if appealed) Appeals |

---