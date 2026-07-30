# 11 · Frontend Architecture — Dreams by Kalakaaar v2

**Document owner:** Principal Frontend Architecture
**Status:** Draft for review (implementation-ready baseline v1.0)
**Audience:** Every frontend engineer, present and future, on Dreams by Kalakaaar
**Companion documents:** `00-project-vision.md` through `06-design-system.md`, `08-database-design.md`, `09-api-architecture.md`

---

# 1. Introduction

### 1.1 Purpose

This document is the frontend engineering constitution of Dreams by Kalakaaar v2. It defines how the frontend — across the Buyer PWA, Creator Dashboard, Admin Panel, Moderator Panel, and Support Panel — is structured, rendered, styled, tested, and scaled, and it explains *why* each decision was made, not just what the decision is.

Every prior document in this series answered a different question: `00-project-vision.md` answered *why the product exists*; `01-product-requirements.md` answered *what it must do*; `02`–`04` answered *who it's for and how it's organized*; `05`–`06` answered *how it should look and feel*; `08`–`09` answer *how data is modeled and exposed*. This document answers the question that sits between all of them and actual working software: **how do we build it, so that it stays fast, accessible, maintainable, and coherent as the team and the product both grow well beyond what any one engineer can hold in their head?**

### 1.2 Scope

This document covers frontend application architecture, project structure, routing, rendering strategy, component architecture, state management, API communication patterns, forms, authentication UX, design system integration, responsiveness, accessibility, performance, PWA behavior, error handling, animation, internationalization readiness, security (frontend-facing concerns), testing, monitoring, coding standards, and scalability strategy.

It does not contain application code. Where a decision has a concrete shape (a folder tree, a state-ownership rule, a caching policy), it is specified precisely enough that two different engineers would independently arrive at the same implementation — that precision is the point of an architecture document, even though no code is written here.

### 1.3 Audience

Every frontend engineer who touches this codebase, from the first hire building v2 to the fiftieth engineer joining after Series B. Also read by Product, Design, and Backend Engineering, since frontend architecture decisions constrain and are constrained by all three.

### 1.4 Objectives

1. Define one coherent frontend architecture that serves five distinct applications (Buyer, Creator, Admin, Moderator, Support) while maximizing shared code, shared design language, and shared engineering practice.
2. Make every rendering, state-management, and data-fetching decision traceable to a specific reason — performance, SEO, accessibility, DX, or product requirement — never to habit or trend.
3. Give the team a project structure and set of conventions specific enough that "where does this code go" is never an ambiguous question.
4. Build accessibility, performance, and offline-resilience in as architectural properties from the start, not retrofitted concerns.
5. Establish a testing, monitoring, and review discipline that lets the team ship confidently at increasing velocity as the codebase grows.
6. Architect for the future (native apps, AI features, internationalization, a possible monorepo split into independently deployed apps) without over-engineering for needs that don't exist yet.

### 1.5 Frontend Philosophy

Three beliefs shape every decision in this document:

**Server-first, client-when-necessary.** The default is to render on the server and ship as little JavaScript as the interaction genuinely requires. Client-side interactivity is added deliberately, component by component, not assumed as the baseline the way it was in the pre-Server-Components era of React.

**The architecture should make the right thing easy and the wrong thing hard.** A well-designed folder structure, a well-typed API client, and a small number of well-understood state-management primitives should make it easier for a new engineer to do the correct thing than to improvise an inconsistent one. Convention over configuration, everywhere it's viable.

**Five apps, one system.** The Buyer, Creator, Admin, Moderator, and Support experiences are visually and behaviorally distinct products serving distinct roles (per `01-product-requirements.md` Section 3), but they are not five separately invented codebases. They share one design system (`06-design-system.md`), one component library, one API client, one auth integration, and one set of engineering conventions. Divergence is allowed only where the underlying product genuinely diverges (e.g., PWA behavior exists only for Buyer), never out of convenience.

### 1.6 Design Goals

| Goal | What It Means Concretely |
|---|---|
| **Performance** | Core Web Vitals in the "Good" band on the Buyer app at the 75th percentile, in production, on mid-tier mobile hardware — not just on a developer's machine (per `00-project-vision.md` Section 14). |
| **Accessibility** | WCAG 2.2 AA is a build-time and CI-enforced constraint, not a post-launch audit item (per `05-design-principles.md` Section 9, `06-design-system.md` Section 26). |
| **Maintainability** | A new engineer can locate the code for any given feature within minutes using folder structure and naming conventions alone (Section 4). |
| **Scalability** | The architecture holds up at 1M+ users and a large, growing catalog (per `00-project-vision.md` Section 15) without a structural rewrite — verified specifically in Section 25. |
| **Developer Experience** | Type safety from the database through the API to the UI, fast local iteration, and a testing strategy that catches regressions before code review, not after production. |
| **Offline Resilience** | The Buyer PWA remains meaningfully useful without connectivity, consistent with the platform's stated inclusivity commitment to lower-connectivity users (per `05-design-principles.md` Sections 4.18, 8.10). |

### 1.7 References

This document is written to be internally consistent with, and should never be read in isolation from:

| Document | What This Document Draws From It |
|---|---|
| `00-project-vision.md` | Brand principles, performance/PWA/accessibility targets (Section 14), technology stack confirmation. |
| `01-product-requirements.md` | The functional modules and roles that determine application boundaries (Section 5 of this document). |
| `02-user-personas.md` | Device, connectivity, and tech-comfort context that shapes performance and progressive-enhancement decisions. |
| `03-user-journeys.md` | The flows that determine loading, error, and optimistic-update behavior per interaction. |
| `04-information-architecture.md` | The sitemap and navigation structure this document's routing architecture (Section 6) implements directly. |
| `05-design-principles.md` | The UX philosophy (calm interfaces, forgiveness, progressive disclosure) that motion, error, and form architecture (Sections 11, 18, 19) operationalize. |
| `06-design-system.md` | The tokens and component inventory that `packages/ui` (Section 4) implements as actual, working components. |
| `08-database-design.md` | Entity shape, ID strategy (UUIDs), money-as-minor-units modeling, and soft-delete philosophy that the frontend's TypeScript types and forms must respect. |
| `09-api-architecture.md` | The REST contract, error envelope, pagination format, and authentication header model that the API client layer (Section 10) wraps. |

### 1.8 Guiding Principles

- **Convention over configuration.** A junior engineer's first PR should look structurally identical to a senior engineer's tenth, because the framework and folder structure make the correct pattern the path of least resistance.
- **Boring technology, applied precisely.** Every technology in the finalized stack is mature and widely adopted; the architecture's value comes from how deliberately these pieces are composed, not from novelty.
- **Explicit boundaries.** Server state (TanStack Query) and client UI state (Zustand) are never allowed to blur into one undifferentiated "state" — see Section 9 for the exact ownership rule.
- **Progressive enhancement, not graceful degradation as an afterthought.** Core buyer flows (browse, view product, add to cart) must function with a slow or interrupted connection; this is designed in from Section 3 onward, not patched in Section 17.
- **No silent architectural drift.** Any deviation from this document is a deliberate, reviewed, documented exception — never an accumulation of small, undocumented "just this once" choices.

### 1.9 Non-Goals

This document explicitly does **not**:
- Compare Next.js to other frameworks, or debate any technology choice in the finalized stack — every decision below assumes the stack in the Platform Context is final.
- Specify backend architecture, database schema, or API endpoint contracts — those are `08-database-design.md` and `09-api-architecture.md`'s domain; this document treats the REST API as a given, external contract.
- Provide implementation code, component markup, or configuration file contents.
- Define visual design tokens or component visual specifications — those are fully owned by `06-design-system.md`; this document defines how those tokens and components are *organized and consumed* in the codebase (`packages/ui`), not what they look like.

---

# 2. Frontend Architecture Principles

### 2.1 Component-First

Every unit of UI is a component with a single, nameable responsibility. Screens (per `07-ui-screens-wireframes.md`) are compositions of components, never monolithic files mixing data-fetching, business logic, and markup for an entire page. This is not a stylistic preference — it is what makes the component inventory in `06-design-system.md` Sections 13–22 directly implementable as a matching set of real, reusable code components, keeping design and engineering artifacts in permanent correspondence.

### 2.2 Composition Over Inheritance

React has no class inheritance model for components, and this architecture never simulates one. Complex components are built by composing smaller components and passing behavior via props, children, and render props/slots — never by creating a hierarchy of "base" and "extended" component classes. A `DangerButton` is not `Button` with a subclass; it is `Button` with a `variant="danger"` prop, exactly mirroring the variant model defined in `06-design-system.md` Section 13.

### 2.3 Feature-Based Architecture

Code is organized primarily by **feature/domain** (`checkout`, `product-catalog`, `creator-orders`) and only secondarily by technical type (`components`, `hooks`, `api`). A feature-based structure means the code for "everything related to Checkout" lives in one place, so a change to checkout behavior touches one directory tree, not five parallel folders scattered by file type. Full structure in Section 4.

### 2.4 Atomic Design Compatibility

`packages/ui` is organized in a way that is *compatible* with atomic design thinking (primitives → composed components → patterns) without adopting its full ceremony or terminology (atoms/molecules/organisms) as a rigid taxonomy, since that taxonomy tends to produce debate about classification rather than useful structure at scale. Concretely: **Primitives** (Button, Input, Badge — directly from `06-design-system.md` Sections 13–14, 17) → **Composed Components** (ProductCard, OrderTimeline — Sections 15, 19–21) → **Patterns** (a full Checkout flow, a full Product Detail page) which live in the consuming app, not in `packages/ui`, since patterns are typically feature-specific and not meant for cross-app reuse.

### 2.5 Separation of Concerns

Three concerns are always kept structurally distinct, never interleaved in the same file: **data** (fetching/mutating via TanStack Query and the API client, Section 10), **state** (Zustand for client UI state, Section 9), and **presentation** (components that receive data and state as props/hooks and render markup). A component file that both fetches data with `fetch()` directly and contains its own bespoke local caching logic is an architecture violation, not a shortcut.

### 2.6 Reusable UI

No visual pattern is implemented twice. If a second screen needs something close to an existing component, the existing component is extended with a new variant or composition — consistent with `06-design-system.md` Section 12.3's reusability principle — rather than a parallel, near-duplicate component being created. This is enforced in code review (Section 27), not just aspired to.

### 2.7 Predictable State

Given the same server data and the same user input, a screen's rendered output is deterministic. This rules out state stored in ad hoc module-level mutable variables, uncoordinated `useEffect` chains that mutate multiple pieces of state in sequence, and any pattern where "what caused this re-render" cannot be answered by reading the component's props, hooks, and store subscriptions alone.

### 2.8 Performance-First

Performance is a design input, not a post-launch optimization pass. Every new screen is built with its expected bundle-size impact, rendering strategy (Section 7), and Core Web Vitals contribution considered *before* the first line of code, not measured and fixed after the fact. Section 16 defines the concrete performance budget and enforcement mechanism.

### 2.9 Accessibility-First

Every component in `packages/ui` ships with its accessibility behavior (keyboard interaction, focus management, ARIA semantics) as part of its initial implementation, matching the component-level accessibility requirement already established in `06-design-system.md` Section 12.4. A component without defined accessible behavior is not considered complete, regardless of how it looks.

### 2.10 Responsive-First

Every component and screen is built and reviewed at the mobile breakpoint first (per `06-design-system.md` Section 27), with tablet and desktop treated as expansions of a working mobile design — never the reverse. This directly reflects that mobile is the dominant buyer discovery channel (per `02-user-personas.md` Section 14.1).

### 2.11 Offline-First (Buyer App)

The Buyer PWA is architected so that previously viewed content remains available and the app shell always renders, even without connectivity — this is a first-class architectural requirement of the Buyer app's data-fetching and caching layers (Sections 9–10, 17), not a bolt-on service worker added at the end.

### 2.12 Progressive Enhancement

Core buyer flows are built to function with baseline HTML/CSS behavior first (server-rendered content, native form submission fallback via Server Actions), with JavaScript-driven enhancements (client-side validation, optimistic UI, animated transitions) layered on top. A buyer on a slow connection or with JavaScript still loading should never see a broken or non-functional page — they should see a slightly less animated, still-functional one.

### 2.13 Developer Experience

Fast local iteration (Turbopack dev server), end-to-end type safety (Section 24.3), colocated tests, and a small number of well-documented patterns (this document) are treated as directly serving the business — a fast, confident engineering team ships the roadmap in `00-project-vision.md` Section 26 faster and with fewer regressions. DX is not in tension with rigor here; the conventions in this document exist specifically to make the *correct* implementation the fastest one to write.

---

# 3. Overall Frontend Architecture

### 3.1 High-Level Architecture

Dreams by Kalakaaar ships as **three deployable Next.js applications**, sharing a common set of internal packages, all deployed on Vercel:

1. **`apps/buyer`** — the public marketplace and buyer account experience. Installable PWA. Mobile-first. Server-rendered for SEO-critical surfaces (Home, Category, Collection, Product Detail, Creator Store).
2. **`apps/creator`** — the Creator Dashboard. Authenticated-only, desktop-first, client-heavy (not SEO-relevant, not a PWA).
3. **`apps/internal`** — Admin, Moderator, and Support surfaces, unified into one deployable app with role-gated route groups. Authenticated-only, desktop-first, client-heavy.

This three-app split (rather than one monolithic app, or five fully independent apps) is a deliberate middle point, explained fully in Section 3.2.

### 3.2 Why Three Apps, Not One or Five

| Option Considered | Why Rejected / Accepted |
|---|---|
| **One single Next.js app for everything** | Rejected. Buyer needs aggressive SEO optimization, PWA behavior, and a public bundle size budget; internal tools need neither and would bloat the buyer bundle with code split for roles 99% of buyer traffic never uses. Auth models also differ enough (consumer sign-up/guest checkout vs. internal SSO-style access) that co-locating them raises accidental-exposure risk. |
| **Five fully independent apps (Buyer, Creator, Admin, Moderator, Support)** | Rejected for v2. Admin, Moderator, and Support share the same internal-user auth model, the same desktop-first design language, and substantially overlapping data views (per `04-information-architecture.md` Section 7.1's "superset view" pattern) — splitting them into three separate deployments today would triple deployment/monitoring overhead for three teams that, at launch scale, are small and often the same handful of people. |
| **Three apps: Buyer / Creator / Internal (chosen)** | Buyer is isolated because its performance, SEO, and PWA requirements are categorically different from every other surface. Creator is isolated because it has its own distinct auth context (a Buyer account extended with a Creator profile, per `01-product-requirements.md` AUTH-06) and its own release cadence tied to creator-facing features. Admin/Moderator/Support are unified because they share an internal-only auth boundary and a desktop-first, data-dense design language, while still being cleanly separated *within* `apps/internal` by route group and permission (Section 6.6), so a future split into independent apps (Section 25.6) is a low-risk, additive change, not a rewrite. |

### 3.3 Monorepo Structure

All three apps live in a single Turborepo-managed monorepo, alongside a set of shared packages. Turborepo provides task caching and dependency-graph-aware builds — critical once three apps share several packages, so that changing `apps/creator` doesn't trigger a full rebuild of `apps/buyer` when nothing it depends on changed.

```
dreams-by-kalakaaar/
├── apps/
│   ├── buyer/
│   ├── creator/
│   └── internal/
└── packages/
    ├── ui/
    ├── config/
    ├── types/
    ├── api-client/
    ├── auth/
    └── utils/
```

Full detail on every folder in Section 4.

### 3.4 Request Lifecycle (Buyer App, Server-Rendered Page)

```
Browser Request
      │
      ▼
Vercel Edge Network ── (static/ISR asset cache hit?) ──► Cached HTML/RSC payload returned
      │ (miss)
      ▼
Next.js Server (Node/Edge runtime per-route)
      │
      ├─► Middleware (auth session check, locale/geo detection, A/B assignment)
      │
      ▼
App Router — Server Component tree begins rendering
      │
      ├─► Server Component fetches data via Route Handler / direct server-side
      │     call to the REST API (09-api-architecture.md), in parallel where
      │     the component tree allows (Section 7.5)
      │
      ├─► Suspense boundaries stream in completed sections as they resolve
      │     (Section 7.6 — Streaming)
      │
      ▼
HTML + React Server Component payload sent to browser
      │
      ▼
Browser paints server-rendered HTML immediately (fast First Contentful Paint,
      no JS execution required to see content)
      │
      ▼
Client-side React hydrates only the Client Component "islands"
      (interactive elements: Add to Cart button, filters, image gallery)
      │
      ▼
TanStack Query (client) takes over for any further client-driven data needs
      (pagination, filter changes, optimistic mutations) — Section 10
```

### 3.5 Request Lifecycle (Dashboard App, Client-Heavy Screen)

```
Browser Request → Middleware (session check; redirect to Login if absent)
      │
      ▼
Server Component renders the authenticated shell (Sidebar, layout chrome)
      + an initial, server-fetched snapshot of critical above-the-fold data
      (e.g., Dashboard "Pending Actions" — per 06-design-system.md 4.11)
      │
      ▼
Client Component tree hydrates; TanStack Query takes ownership of all
further data fetching, refetching, and mutation for the interactive
dashboard (Tables, Charts, real-time-feeling order queues)
```

**Why the split differs:** Buyer screens prioritize fast, crawlable, mostly-static-feeling content, so Server Components own the data. Dashboard screens are inherently interactive, session-long, and never crawled, so after an initial server-rendered shell, TanStack Query's client-side cache (Section 9.10) owns the experience — this avoids re-fetching the same dashboard data on every internal navigation, which would be wasteful for a user who may spend hours a day in this app.

### 3.6 Hydration Strategy

Next.js 15 + React 19's Server Components model means **hydration is selective, not whole-page**, by construction: only Client Components (`"use client"` boundaries) ship JavaScript and hydrate; Server Components render to HTML/RSC payload and never hydrate at all, because they have no client-side behavior to attach. This is the single largest architectural lever for the Buyer app's performance budget (Section 16) — a Product Detail page's description, reviews, and creator story can be pure Server Components (zero client JS), while only the Add to Cart button, customization panel, and image gallery are Client Components requiring hydration.

**Rule:** a component is a Client Component only if it genuinely needs browser APIs, interactivity (event handlers), or React hooks that require the client runtime (`useState`, `useEffect`, Zustand store access). Every component defaults to Server Component status and is only demoted to Client Component when a specific, identifiable need requires it — never preemptively.

### 3.7 Data Flow (Conceptual)

```
┌─────────────┐      REST (09-api-architecture.md)      ┌──────────────┐
│  Backend API │ ◄───────────────────────────────────────►│ Next.js BFF  │
│ (per 09-api- │        server-to-server only,             │  Layer       │
│ architecture)│        Bearer token never reaches         │ (Route       │
│              │        the browser (Section 12.4)         │  Handlers +  │
└─────────────┘                                            │  Server      │
                                                             │  Actions)   │
                                                             └──────┬───────┘
                                                                    │
                                            Server Components fetch │ directly,
                                            server-side, within the │ same request
                                                                    │
                                                             ┌──────▼───────┐
                                                             │   Browser    │
                                                             │ ┌──────────┐ │
                                                             │ │TanStack  │ │  client-side
                                                             │ │Query     │◄┼──refetch/mutate
                                                             │ │(server   │ │  after first
                                                             │ │ state)   │ │  hydration
                                                             │ └──────────┘ │
                                                             │ ┌──────────┐ │
                                                             │ │Zustand   │ │  client-only UI
                                                             │ │(client   │ │  state, never
                                                             │ │ state)   │ │  synced to server
                                                             │ └──────────┘ │
                                                             └──────────────┘
```

This diagram encodes the architecture's most important data-flow rule, expanded fully in Section 10: **the browser never talks to the REST API directly.** It talks to Next.js's own Route Handlers and Server Actions, which act as a Backend-for-Frontend (BFF) layer that attaches the authenticated Bearer token server-side and forwards the request. Full rationale in Section 12.4.

---

# 4. Project Structure

### 4.1 Complete Folder Hierarchy

```
dreams-by-kalakaaar/
├── apps/
│   ├── buyer/
│   │   ├── app/                       # App Router — routes, layouts, pages
│   │   │   ├── (marketing)/           # Landing, About — route group, minimal layout
│   │   │   ├── (shop)/                # Home, Category, Collection, Product, Search, Creator Store
│   │   │   ├── (account)/             # Buyer Account Zone — Orders, Wishlist, Settings, etc.
│   │   │   ├── (auth)/                # Login, Signup, Reset Password, etc.
│   │   │   ├── checkout/              # Isolated layout (no global nav — 04-information-architecture.md 4.6)
│   │   │   ├── api/                   # Route Handlers (BFF layer, Section 10)
│   │   │   ├── layout.tsx             # Root layout (fonts, providers, PWA meta)
│   │   │   ├── error.tsx              # Root error boundary
│   │   │   ├── not-found.tsx          # 404
│   │   │   └── global-error.tsx       # Catastrophic fallback (Section 18.1)
│   │   ├── features/                  # Feature-based modules (Section 4.3)
│   │   │   ├── product-catalog/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── wishlist/
│   │   │   ├── creator-storefront/
│   │   │   ├── reviews/
│   │   │   ├── messaging/
│   │   │   ├── orders/
│   │   │   └── search/
│   │   ├── public/                    # Static assets, manifest.json, service worker
│   │   ├── middleware.ts              # Auth/session/locale middleware
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   ├── creator/
│   │   ├── app/
│   │   │   ├── (dashboard)/           # Overview, Products, Orders, Inventory, Analytics, Payouts, etc.
│   │   │   ├── (onboarding)/          # Creator Registration, Verification, Store Setup
│   │   │   ├── api/
│   │   │   ├── layout.tsx
│   │   │   └── error.tsx
│   │   ├── features/
│   │   │   ├── product-management/
│   │   │   ├── order-fulfillment/
│   │   │   ├── inventory/
│   │   │   ├── analytics/
│   │   │   ├── payouts/
│   │   │   └── store-settings/
│   │   ├── middleware.ts
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── internal/
│       ├── app/
│       │   ├── (admin)/               # Route group, permission-gated (Section 6.6)
│       │   ├── (moderator)/
│       │   ├── (support)/
│       │   ├── api/
│       │   ├── layout.tsx
│       │   └── error.tsx
│       ├── features/
│       │   ├── creator-approval/
│       │   ├── moderation-queue/
│       │   ├── support-tickets/
│       │   ├── platform-analytics/
│       │   ├── cms/
│       │   └── audit-log/
│       ├── middleware.ts
│       ├── next.config.ts
│       └── package.json
│
├── packages/
│   ├── ui/                            # packages/ui — see 4.2
│   │   ├── src/
│   │   │   ├── primitives/            # Button, Input, Badge, Chip, Tag... (06-design-system.md §13-14, 17)
│   │   │   ├── composed/              # ProductCard, OrderTimeline, ReviewCard... (§15, 19-21)
│   │   │   ├── navigation/            # Navbar, Sidebar, BottomNav, Breadcrumbs... (§16)
│   │   │   ├── overlays/              # Modal, Dialog, BottomSheet, Tooltip... (§18)
│   │   │   ├── feedback/              # Toast, Alert, Skeleton, StatusBadge... (§17)
│   │   │   ├── data-display/          # Table, Charts, Timeline... (§19)
│   │   │   ├── tokens/                # Token definitions (Section 13.2)
│   │   │   └── icons/                 # Icon set (06-design-system.md §7)
│   │   └── package.json
│   │
│   ├── config/
│   │   ├── eslint/
│   │   ├── typescript/
│   │   └── tailwind/                  # Tailwind config implementing token scales
│   │
│   ├── types/
│   │   ├── api/                       # Types mirroring 09-api-architecture.md response shapes
│   │   ├── domain/                    # Domain types mirroring 08-database-design.md entities
│   │   └── shared/                    # Cross-cutting shared types
│   │
│   ├── api-client/
│   │   ├── src/
│   │   │   ├── endpoints/             # Typed functions per resource (products, orders, etc.)
│   │   │   ├── query-keys/            # Centralized TanStack Query key factory (Section 9.11)
│   │   │   ├── hooks/                 # useProduct(), useCreateOrder(), etc.
│   │   │   └── client.ts              # Base fetch wrapper (correlation IDs, error envelope parsing)
│   │   └── package.json
│   │
│   ├── auth/
│   │   ├── src/
│   │   │   ├── better-auth.config.ts
│   │   │   ├── session.ts
│   │   │   └── guards/                # Route/permission guard helpers (Section 12)
│   │   └── package.json
│   │
│   └── utils/
│       ├── src/
│       │   ├── formatting/            # Money (minor units → display), dates (UTC → local)
│       │   ├── validation/            # Shared Zod schemas (Section 11.2)
│       │   └── testing/               # Shared test utilities/fixtures
│       └── package.json
│
├── turbo.json
├── package.json                       # Workspace root
└── tsconfig.base.json
```

### 4.2 Purpose of Every Top-Level Folder

| Folder | Purpose |
|---|---|
| `apps/buyer` | The public marketplace and buyer account application. Owns SEO, PWA, and guest/buyer auth concerns. |
| `apps/creator` | The Creator Dashboard application. Owns creator-facing business logic and operational UI. |
| `apps/internal` | The unified Admin/Moderator/Support application. Owns internal-role operational UI and permission gating. |
| `packages/ui` | The implemented component library — the code-level realization of `06-design-system.md`. Framework-agnostic within React; contains no app-specific business logic, only presentation and interaction behavior. |
| `packages/config` | Shared build/lint/type configuration so all three apps enforce identical standards (Section 24) without copy-pasted config files drifting out of sync. |
| `packages/types` | The single source of truth for TypeScript types shared across apps — API response shapes, domain entities, and cross-cutting types (e.g., money, pagination envelopes). |
| `packages/api-client` | The typed wrapper around the REST API (`09-api-architecture.md`), including the TanStack Query hook layer every app consumes (Section 10). |
| `packages/auth` | The Better Auth integration shared by all three apps, since all three authenticate against the same identity system, just with different role expectations post-login (Section 12). |
| `packages/utils` | Small, pure, well-tested shared utilities (money formatting, date/timezone conversion, shared Zod schemas) used across apps and packages. |

### 4.3 Feature Organization (`features/` within each app)

Within each app, `features/` is organized by product domain, not technical layer. A single feature folder (e.g., `features/checkout`) contains everything specific to that feature:

```
features/checkout/
├── components/         # Checkout-specific components (not reusable elsewhere)
├── hooks/              # useCheckoutFlow(), useApplyCoupon(), etc.
├── stores/             # Zustand store(s) scoped to checkout UI state (Section 9.4)
├── schemas/            # Zod validation schemas for checkout forms
├── utils/              # Checkout-specific pure functions
└── index.ts            # Public exports — only what other features/app/ routes need
```

**Rule:** a feature folder's `index.ts` is the only sanctioned import surface for other features. Reaching into `features/checkout/components/SomeInternalComponent` from outside the `checkout` feature is a lint-enforced violation (Section 24.5) — this is what keeps feature boundaries real rather than aspirational as the codebase grows.

### 4.4 Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Component files | PascalCase, matching the exported component name | `ProductCard.tsx` |
| Hook files | camelCase, `use` prefix | `useCartSync.ts` |
| Route segment folders | kebab-case, matching the URL segment | `app/(shop)/creator-directory/` |
| Zustand stores | camelCase, `Store` suffix | `checkoutStore.ts` |
| Zod schemas | camelCase, `Schema` suffix | `addressSchema.ts` |
| Query key factories | camelCase, matching the resource | `productKeys.ts` |
| Test files | Colocated, `.test.ts(x)` suffix | `ProductCard.test.tsx` |
| Type-only files | camelCase, `.types.ts` suffix | `checkout.types.ts` |

Full coding standards in Section 24.

### 4.5 Shared Libraries vs. App-Specific Code

The rule for whether code belongs in `packages/` or in an app's `features/` is simple and consistently applied: **if two or more apps need it, or if it has zero app-specific business logic, it belongs in a package.** A `Button` belongs in `packages/ui` because Creator, Admin, and Buyer all render buttons identically per the design system. A `useCheckoutFlow` hook belongs in `apps/buyer/features/checkout` because checkout exists only in the Buyer app and is deeply specific to its business logic. When in doubt, code starts in the app's `features/` folder and is only "promoted" to a shared package once a second, genuine consumer exists — premature abstraction into a shared package is avoided as deliberately as premature duplication.

### 4.6 Code Ownership

| Area | Primary Owner |
|---|---|
| `apps/buyer` | Buyer Experience frontend engineers |
| `apps/creator` | Creator Experience frontend engineers |
| `apps/internal` | Platform/Internal Tools frontend engineers |
| `packages/ui` | Design Systems Engineering (cross-functional with Design, per `06-design-system.md` Section 1.4) |
| `packages/api-client`, `packages/types` | Shared, co-owned by all frontend engineers; changes require review from at least one engineer outside the proposing app's team, since a change here affects every app |
| `packages/auth` | Shared, requires review from a security-conscious senior engineer regardless of author, given its sensitivity (Section 21) |

Ownership is documented via a CODEOWNERS file mapping directly to this table, so PR review routing is automatic, not a manual judgment call per pull request.

---

# 5. Application Architecture

### 5.1 Buyer App

The Buyer app implements the Public Screens and Buyer Screens defined in `07-ui-screens-wireframes.md` Sections 3 and 5, and the full sitemap in `04-information-architecture.md` Section 3.1–3.3. It is the only app with:
- **Guest access** to the majority of its surface (per `01-product-requirements.md` Section 3.1's Guest role).
- **SEO obligations** (Section 6.8, indexable routes per `04-information-architecture.md` Section 17.1).
- **PWA behavior** (Section 17).
- **A strict client-side JavaScript budget** (Section 16.2), since it is the only app where a meaningful share of traffic is unauthenticated, first-visit, and potentially on constrained mobile hardware or connectivity (`02-user-personas.md` Section 10.6).

### 5.2 Creator Dashboard

Implements `07-ui-screens-wireframes.md` Section 6. Authenticated-only; every route requires a verified Creator profile (Section 12.3). Desktop-first (per `06-design-system.md` Section 18's scoping of Creator tooling as functional-but-secondary on mobile, though — unlike Admin — Creator retains a genuinely usable mobile experience for order-checking-on-the-go, since creators are frequently away from a desk). Not a PWA in v2; not indexed by search engines.

### 5.3 Admin Panel, Moderator Panel, Support Panel (within `apps/internal`)

These three roles share one deployable app but are cleanly separated by:
- **Route groups**: `(admin)`, `(moderator)`, `(support)` — each with its own layout, navigation chrome, and permission gate (Section 6.6).
- **Feature module boundaries**: `features/creator-approval`, `features/moderation-queue`, `features/support-tickets` are independent modules with no cross-imports, even though they render within the same deployed application.
- **Independent data scopes**: a Moderator's TanStack Query cache never contains payment data a Moderator isn't permitted to see (Section 9.9), enforced by the API itself (`09-api-architecture.md` Section 2.3's 403/404 model) as the authoritative boundary, with the frontend's route/component gating as a defense-in-depth UX layer, never the sole security mechanism (Section 21.6).

Desktop-first throughout, per `06-design-system.md` Section 18's explicit scoping decision that internal operational tooling is not a mobile design priority for v2.

### 5.4 Shared UI

`packages/ui` (Section 4.2) is consumed identically by all three apps. A `Table` component used in `apps/internal`'s User directory and a `Table` used in `apps/creator`'s Inventory view are the *same* component, configured with different columns — never two independently built tables that happen to look similar. This is the mechanism that keeps `06-design-system.md`'s consistency rules (its Section 17) true in practice, not just in documentation.

### 5.5 Shared Logic, Components, Hooks, Utilities

| Shared Artifact | Package | Example |
|---|---|---|
| Data-fetching hooks | `packages/api-client` | `useProduct(id)`, `useOrders(filters)` |
| Domain formatting utilities | `packages/utils` | `formatMoney(amountMinorUnits, currency)`, `formatOrderStatus(status)` |
| Validation schemas | `packages/utils` (base schemas) + feature-level extension | `addressSchema`, `emailSchema` |
| Auth guards | `packages/auth` | `requireRole('creator')`, `requireVerifiedCreator()` |
| Design tokens & primitives | `packages/ui` | Every Section 13–22 component from `06-design-system.md` |

**Rule:** if a hook, utility, or component is duplicated near-identically in two apps' `features/` folders, that is a signal (caught in code review, Section 27) that it should be promoted to the relevant shared package, per the promotion rule in Section 4.5.

---

# 6. Routing Architecture

### 6.1 App Router

All three apps use the Next.js 15 App Router exclusively — no Pages Router, no mixed-router legacy patterns. The App Router's nested layout model maps directly onto `04-information-architecture.md`'s hierarchical sitemap (Section 3), making the folder structure of `app/` a near-literal implementation of that document's zones.

### 6.2 Nested Layouts

Layouts compose top-down, each adding only the chrome relevant to its scope:

```
app/layout.tsx                    → <html>, providers, fonts, PWA meta (all routes)
app/(shop)/layout.tsx             → Global Navbar, Footer (04-ia.md §4.1, 4.4)
app/(shop)/products/[slug]/layout.tsx → Breadcrumb context (04-ia.md §13)
```

This mirrors `04-information-architecture.md` Section 4's navigation-visibility rules exactly: the Checkout route group intentionally does **not** nest under the `(shop)` layout that provides the Global Navbar, because Checkout deliberately omits lateral navigation (per `04-information-architecture.md` Section 13's "Custom Flows" breadcrumb rule and `06-design-system.md` Section 6.14's isolated Checkout Layout). A route group's layout inclusion or exclusion is always a direct, intentional implementation of an IA/design-system decision, never an accident of folder placement.

### 6.3 Parallel Routes

Used specifically for the Creator and Internal dashboards' composite views — e.g., `apps/creator/app/(dashboard)/@pendingActions` and `@analytics` rendering side-by-side as independent, independently-loading slots within the Dashboard Overview layout (per `06-design-system.md` Section 15's dashboard widget composition). This lets one slow-loading widget (e.g., Analytics, which may aggregate more data) stream in independently without blocking the Pending Actions widget's render — a direct, structural implementation of the dashboard's stated priority ordering (pending actions before performance data, per `05-design-principles.md` Section 4.11).

### 6.4 Intercepting Routes

Used narrowly and deliberately for the **Image Viewer** (`06-design-system.md` Section 18) on Product Detail: navigating to a product image from the gallery intercepts the route to show a full-screen overlay (preserving the underlying Product Detail page and its URL context), while a *direct* link to that same image-viewer URL (e.g., shared or bookmarked) renders the full standalone page. This gives correct browser back-button behavior and shareable deep links without duplicating the image-viewer UI as two separate implementations.

### 6.5 Loading States

Every route segment that fetches data defines a co-located `loading.tsx`, which Next.js automatically wraps in a Suspense boundary. `loading.tsx` renders the corresponding Skeleton component from `packages/ui` (per `06-design-system.md` Section 25.1) matching that route's expected content shape — never a generic spinner, consistent with the design system's explicit preference (Section 15 of this document expands the full loading-state architecture).

### 6.6 Error Boundaries

Every route segment likely to fail independently (data-fetching-heavy segments especially) defines a co-located `error.tsx` Client Component boundary. Error boundaries are deliberately granular — a failure loading the Reviews section of a Product Detail page shows an inline error *within that section*, not a full-page crash, consistent with `05-design-principles.md` Section 14's error-state principles. Full error architecture in Section 18.

**Permission-based routing (`apps/internal` specifically):** each route group's layout performs a server-side permission check (via `packages/auth`, Section 12.3) before rendering; a Moderator navigating to an `(admin)`-only route server-redirects to a 403 page before any admin-only data is ever fetched — the check happens *before* data fetching, not as a client-side conditional render after the fact, since the latter would briefly fetch and hold unauthorized data in the client bundle even if not painted.

### 6.7 Not Found Pages

Each app defines both a root `not-found.tsx` and, where meaningful, segment-specific ones (e.g., a Product Detail `not-found.tsx` that suggests similar products rather than the generic site-wide 404, per `07-ui-screens-wireframes.md` Section 3.27's design intent applied at the correct route scope).

### 6.8 Metadata Strategy

Every Buyer app route exports a `generateMetadata` function producing title, description, canonical URL, and Open Graph tags server-side, per `04-information-architecture.md` Section 17's indexability rules (Section 17.1's table). Metadata is generated from the same server-fetched data used to render the page — never duplicated or hand-maintained separately, which would risk drift between what's rendered and what's described to search engines and social previews.

### 6.9 SEO Architecture

| Requirement (from `04-information-architecture.md` §17) | Frontend Implementation |
|---|---|
| Canonical URLs, no duplicate content from filter/sort query params (§17.3) | `generateMetadata` always sets canonical to the unparameterized path; filter/sort state lives in the URL for shareability (Section 9.7) but is explicitly excluded from the canonical tag |
| Structured data (Product, Organization, ItemList — §17.5) | Rendered server-side as JSON-LD within each Server Component, sourced from the same fetched data as the visible content |
| Sitemap | Generated via Next.js's `sitemap.ts` convention, dynamically enumerating published Products, Creators, Categories, and Collections from the API at build/revalidation time |
| `robots.txt` | Explicitly disallows `apps/buyer`'s `/checkout`, `/account`, and `/api` paths; Dashboards apps are never publicly deployed under a crawlable domain path in the first place |
| Non-indexable routes (§17.1) | `generateMetadata` sets `robots: { index: false }` on Search Results, Cart, and all Authentication routes |

---

# 7. Rendering Strategy

### 7.1 The Core Question Every Route Answers

For every route, three questions determine its rendering strategy: **Is this content the same for every visitor at a given moment (cacheable)? Does it need to be indexed by search engines? How fresh must the data be?** The answers map deterministically onto Next.js's rendering primitives, per the decision matrix in Section 7.9 — rendering strategy is never chosen by default or by habit, but derived from these three answers per route.

### 7.2 Server-Side Rendering (SSR)

Used for routes whose content is personalized or must reflect real-time state on every request: Cart, Order Detail, Checkout, and every Buyer Account Zone route. These render fresh on every request because showing stale cart contents or stale order status would be a direct trust violation (per `05-design-principles.md` Section 10.6's real-time availability principle).

### 7.3 Static Site Generation (SSG)

Used only for content with no meaningful per-visitor variation and infrequent underlying changes: Legal pages (Terms, Privacy, Refund Policy), the About page, and the Authentication screens' static shell. These are generated at build time and served from Vercel's edge cache with no per-request server work at all.

### 7.4 Incremental Static Regeneration (ISR)

The default strategy for the Buyer app's highest-traffic, SEO-critical, catalog-driven routes: Home, Category, Collection, Product Detail, Creator Storefront, Occasion/Festival pages. These are statically generated, served instantly from cache, and **revalidated** on a time-based interval (e.g., 60 seconds for Category/Collection, 5 minutes for less volatile Creator Storefront content) **and** on-demand, triggered by a webhook from the Admin CMS (`07-ui-screens-wireframes.md` Section 7.11) the moment a Collection is published or a listing's status changes. This gives the performance and cost profile of fully static pages with correctness closer to server-rendering — critical given `01-product-requirements.md` PDP-02's requirement that availability be real-time-accurate: a Product Detail page's *page shell* is ISR-cached, but its live availability/price is fetched client-side on top of the cached shell (Section 7.7, Partial Prerendering) so a stale cache never shows an unavailable item as purchasable.

### 7.5 Client-Side Rendering (CSR)

Used deliberately and narrowly: the Creator Dashboard and `apps/internal` applications are predominantly CSR *after* an initial server-rendered authenticated shell (per Section 3.5), because their content is never crawled, is always personalized/permissioned, and benefits far more from TanStack Query's client-side caching across in-app navigation (Section 9.10) than from server rendering on every route change. Full-page CSR (no server rendering at all) is otherwise avoided platform-wide — even Dashboard apps render their layout chrome and first meaningful paint server-side (Section 3.5).

### 7.6 Streaming

Every route with multiple independently-loading data dependencies uses React Suspense boundaries (via `loading.tsx`, Section 6.5, and inline `<Suspense>` for sub-sections) to stream content progressively: a Product Detail page's core details (title, price, images) resolve and paint first, while Reviews and Related Products stream in moments later without blocking the primary content. This directly implements the Skeleton-first, progressive-content loading philosophy from `06-design-system.md` Section 15 at the rendering-architecture level, not just the visual-loading-state level.

### 7.7 Partial Prerendering (PPP)

Next.js 15's Partial Prerendering is used specifically for exactly the case described in Section 7.4: a route with a **static shell** (layout, images, description — safe to prerender and cache aggressively) and a **dynamic hole** (live price/availability, personalized "recently viewed" strip) that renders fresh per-request within that same cached shell. Product Detail and Category pages are the primary beneficiaries — this is the concrete mechanism that resolves the tension between "cache aggressively for performance" and "never show stale availability" without requiring two entirely different rendering strategies bolted together manually.

### 7.8 Server Components vs. Client Components

| | Server Component (default) | Client Component (`"use client"`) |
|---|---|---|
| **When used** | Default for everything; explicitly required for anything needing interactivity, browser APIs, or React state/effect hooks | Add to Cart button, filter controls, image gallery, forms, any Zustand-connected component, anything using `onClick`/`onChange` |
| **Data fetching** | Directly, `async/await`, server-side, close to the data source | Via TanStack Query hooks (Section 10) |
| **Bundle impact** | Zero — never shipped to the client | Shipped and hydrated; kept as small and as leaf-level as possible (Section 16.3) |
| **Example** | Product description, creator story, reviews list rendering | "Add to Cart" button, quantity stepper, wishlist heart toggle |

**The "leaf Client Component" rule:** Client Component boundaries are pushed as far down the component tree as possible — a Product Card's image and title remain a Server Component; only the small "Add to Cart" button within it is a Client Component. This is the single highest-leverage rule in this entire section for controlling the Buyer app's shipped JavaScript weight (Section 16.2), since it prevents an entire card (and everything nested "above" the interactive element) from being needlessly hydrated.

### 7.9 Server Actions

Used for all buyer-facing form mutations that don't need optimistic, instantaneous client feedback and benefit from progressive enhancement (Section 2.12): Newsletter signup, Support Ticket submission, Review submission, Address CRUD. A Server Action is a server-side function callable directly from a form's `action` attribute, working even before client JavaScript hydrates — this is what makes Section 2.12's progressive-enhancement principle concretely true for these flows, rather than aspirational. High-frequency, latency-sensitive mutations (Add to Cart, Wishlist toggle, filter changes) instead go through TanStack Query mutations calling Route Handlers (Section 10.2), since these need optimistic UI (Section 10.3) that Server Actions alone don't provide as cleanly.

### 7.10 Decision Matrix

| Route Type | Strategy | Rationale |
|---|---|---|
| Home, Category, Collection | ISR + PPP | High traffic, SEO-critical, mostly stable content with a live availability "hole" |
| Product Detail | ISR + PPP | Same as above; the canonical example driving Section 7.7 |
| Creator Storefront | ISR | SEO-critical, changes infrequently (creator-managed content) |
| Search Results | SSR (not cached) | Query-dependent, effectively infinite unique URLs; not meaningfully cacheable |
| Cart, Checkout, Order Detail, Account | SSR | Personalized, must be fresh, low traffic-per-page relative to catalog pages |
| Legal, About | SSG | Fully static, changes rarely |
| Creator Dashboard, Admin, Moderator, Support | Server shell + CSR (TanStack Query) | Authenticated, permissioned, never crawled, session-long usage pattern |
| Authentication screens | SSG shell + Client Component form | Static layout, interactive form logic only |

---

# 8. Component Architecture

### 8.1 Component Hierarchy

```
packages/ui (Primitives) → packages/ui (Composed) → app/features (Feature Components) → app/features (Patterns) → app/ (Pages)
```

Each layer may only depend on the layer(s) to its left, never the reverse — `packages/ui` never imports from an app's `features/`, which would invert the dependency direction and make the shared library implicitly coupled to one app's business logic.

### 8.2 Presentational Components

Components that receive all their data via props and contain no data-fetching or global-state-subscription logic of their own. The entire `packages/ui` primitives and composed layers (`06-design-system.md` Sections 13–22) are presentational by construction — a `ProductCard` renders whatever `product` prop it's given; it has no idea whether that data came from a Server Component's direct fetch, a TanStack Query cache, or a Storybook fixture, which is exactly what makes it independently testable and reusable across all three apps.

### 8.3 Container Components

Components (typically Server Components, or Client Components using TanStack Query) responsible for fetching data and passing it down to presentational components. Containers live in `app/` route files and `features/*/components/`, never in `packages/ui`. A route's `page.tsx` is very often *entirely* a container: fetch data, render the presentational tree, done — with no markup of its own beyond composing already-built components.

### 8.4 Shared Components

Any component living in `packages/ui`, by definition — reusable across at least two of the three apps, or foundational enough (a `Button`) that it's expected to be used everywhere.

### 8.5 Business Components

Feature-specific composed components that encode product/business logic and are not intended for reuse outside their feature — e.g., `CheckoutStepper` (aware of the specific 4-step checkout flow from `03-user-journeys.md` 3.13), or `CustomizationClarificationThread` (aware of the specific order-state machine from `01-product-requirements.md` Section 8.2). These live in the owning feature's `components/` folder.

### 8.6 Layout Components

Structural components (`AppShell`, `DashboardSidebarLayout`, `CheckoutLayout`) implementing the layout patterns from `06-design-system.md` Section 6. Layout components are intentionally "dumb" about content — they define regions (header, sidebar, main, footer) and accept children, never reaching into business logic themselves.

### 8.7 Compound Components

Used for components with tightly coupled internal parts that must share implicit state — e.g., `Tabs.Root`, `Tabs.List`, `Tabs.Trigger`, `Tabs.Content` (built on Radix UI's compound-component primitives, per the finalized stack). This pattern is used specifically where Radix UI already provides it (Tabs, Select, Dialog, Dropdown, Accordion) rather than reinvented for components where a simpler prop-driven API suffices.

### 8.8 Headless Components

Radix UI primitives (unstyled, behavior-and-accessibility-only) form the foundation of every interactive `packages/ui` component per the finalized stack — Radix supplies correct keyboard interaction, focus management, and ARIA wiring (directly satisfying `06-design-system.md` Section 26's accessibility specifications) while `packages/ui` supplies the Tailwind-based visual styling on top via shadcn/ui's established pattern of "own the component code, don't import a black-box library." This is why the stack pairs shadcn/ui with Radix UI rather than a fully pre-styled component library: it gives full design-token control (Section 13) while inheriting battle-tested accessibility behavior rather than re-implementing it.

### 8.9 Reusable Patterns

Common cross-feature UI patterns (a paginated list with filters, a form wizard, a confirmation-before-destructive-action flow) are extracted into reusable **hooks and layout compositions** in `packages/ui` or `packages/utils` once they recur a third time across features — e.g., `useStepperFlow()` powering both Checkout and Creator Registration's Stepper-driven flows (`07-ui-screens-wireframes.md` Sections 3.13 pattern reused at 4.9), even though the two flows' actual steps and content are entirely different and remain feature-specific.

### 8.10 Composition Patterns

- **Slot-based composition** (children/named slots) for layout-shaped components (`Card` accepting a `header` and `footer` slot).
- **Render props / function-as-children** used sparingly, only where a component needs to expose internal state to its consumer (e.g., a `Combobox` exposing highlighted-option state) — Radix UI's primitives already provide this where needed, so it is rarely hand-rolled.
- **Prop-driven variants** (never boolean-explosion props like `isPrimaryLarge`) — every `packages/ui` component's variants map 1:1 to the variant tables defined in `06-design-system.md` (e.g., `<Button variant="primary" size="lg">`, mirroring Section 13.2 exactly).

---

# 9. State Management

### 9.1 The Governing Rule: State Ownership by Origin, Not Convenience

Every piece of state in this codebase is classified by **where it originates**, and that classification determines its home. This is the single most important architectural rule in this document for long-term maintainability, because uncontrolled state-management sprawl is the most common source of hard-to-debug frontend bugs at scale.

| State Category | Origin | Owner | Never Stored In |
|---|---|---|---|
| **Server state** | The REST API (`09-api-architecture.md`) | TanStack Query | Zustand, `useState`, React Context |
| **Client UI state** | The browser session, ephemeral, never persisted server-side | Zustand | TanStack Query |
| **Form state** | User input in progress, not yet submitted | React Hook Form | Zustand (except see 9.4 for multi-step exceptions) |
| **URL state** | Shareable/bookmarkable user intent (filters, search query, pagination, active tab) | Next.js `searchParams` | Zustand, component `useState` |
| **Local state** | Ephemeral, single-component concern (an accordion's expanded/collapsed state) | `useState`/`useReducer` | Zustand (would be needless global scope for something no other component needs) |
| **Persistent state** | Must survive a page reload or return visit, but is not server data (e.g., "has dismissed this tooltip") | Zustand with `persist` middleware (`localStorage`) | Not sent to the server unless it becomes a genuine account preference, in which case it becomes server state |

### 9.2 Why Not One Unified State Library

A common anti-pattern in React architecture is reaching for a single global store (Redux-style, or an overloaded Context) for everything. This architecture deliberately rejects that: **server state and client state have fundamentally different lifecycles** — server state can go stale, needs refetching, needs cache invalidation, and is shared across components that didn't request it; client UI state has none of those concerns and needs none of TanStack Query's machinery. Using TanStack Query for both keeps the two concerns from ever accidentally blurring — a bug where "the cart drawer's open/closed state" is treated as if it needs server-cache invalidation logic simply cannot happen if it structurally lives in Zustand instead.

### 9.3 Local State

Default choice for anything scoped to a single component or a shallow, obvious parent-child relationship: `useState`/`useReducer`. Promoted to Zustand only when a second, non-adjacent component genuinely needs to read or write the same state — premature promotion to global state is treated as a code-review flag (Section 27), not a safe default.

### 9.4 Global (Client UI) State — Zustand Architecture

Zustand stores are **scoped and feature-specific**, never one monolithic app-wide store. Each feature that needs cross-component client state defines its own store in `features/*/stores/`:

```
features/cart/stores/cartDrawerStore.ts      # is the drawer open? (UI only — cart *contents* are server state, Section 9.1)
features/checkout/stores/checkoutStore.ts    # current step, in-progress (unsubmitted) form selections across steps
features/product-catalog/stores/filterPanelStore.ts   # is the mobile filter sheet open?
```

**The Checkout exception:** multi-step flows (Checkout, Creator Registration — per `07-ui-screens-wireframes.md` Sections 3.13, 4.9) are the one deliberate case where in-progress, not-yet-submitted form data spanning multiple steps is held in a Zustand store rather than purely in React Hook Form, because React Hook Form's state doesn't naturally survive unmounting a step's form when the user navigates to the next step in a Stepper. The store holds each step's *validated, submitted-within-the-flow* data; the currently active step's *in-progress* field state remains owned by that step's own React Hook Form instance until the step is completed.

**Store design conventions:**
- Every store is small, typed, and named for its feature and concern (`checkoutStore`, not `appStore`).
- Selectors are used at every consumption site (`useCheckoutStore((s) => s.currentStep))`) rather than destructuring the whole store, so components only re-render when their specific slice changes — a direct performance discipline (Section 16.9).
- No store holds data fetched from the API — that is a Section 9.1 violation, full stop.

### 9.5 Server State — TanStack Query Architecture

Every piece of data that originates from the REST API flows through TanStack Query, accessed exclusively via the typed hooks in `packages/api-client` (never via ad hoc `useEffect` + `fetch` in a component — this is a lint-enforced rule, Section 24.5).

### 9.6 Query Key Factory

`packages/api-client/src/query-keys/` defines a centralized, hierarchical key factory per resource, following the widely-adopted "array key hierarchy" pattern:

```
productKeys.all              → ['products']
productKeys.lists()          → ['products', 'list']
productKeys.list(filters)    → ['products', 'list', { filters }]
productKeys.detail(id)       → ['products', 'detail', id]
```

This hierarchy is what makes cache invalidation precise and safe: publishing a new product invalidates `productKeys.lists()` (every filtered list view refetches) without needlessly invalidating `productKeys.detail(unrelatedId)` for every other already-cached product detail page. Every mutation hook in `packages/api-client` documents exactly which query keys it invalidates, reviewed explicitly in PRs touching mutations (Section 27).

### 9.7 URL State

Filters, search queries, sort order, pagination, and active tab selections live in the URL's `searchParams`, never in Zustand or component state, because this state must be shareable and bookmarkable — directly implementing `04-information-architecture.md` Section 10's requirement that filtered/sorted result sets be shareable URLs. TanStack Query's `queryKey` for these list views is derived directly from `searchParams`, so the URL is the actual source of truth and the query cache is a pure function of it — there is no separate "filter state" to keep in sync with the URL, eliminating an entire class of state-synchronization bugs.

### 9.8 Persistent (Local) State

Zustand's `persist` middleware (backed by `localStorage`, with an explicit fallback path for the Buyer PWA's offline scenario, Section 17.3) is used narrowly: dismissed-tooltip flags, a guest's session cart *before* authentication (Section 9.12), and locally-remembered UI preferences that are not significant enough to warrant a server-side account setting. Anything a user would reasonably expect to follow them across devices (per `01-product-requirements.md` WISH-01, SET-01 on cross-device persistence) is server state, not `localStorage` state — `localStorage` is explicitly a single-device, best-effort convenience layer, never treated as a durable data store.

### 9.9 State Boundaries Across Apps

Each app has its own TanStack Query cache and its own Zustand stores — state is never shared in-memory across `apps/buyer`, `apps/creator`, and `apps/internal`, since they are entirely separate deployed applications with no shared runtime. The *only* things shared across apps are the **hook and store definitions** (code, from `packages/api-client` and, where genuinely cross-app, `packages/ui`-adjacent client state patterns) — never live application state itself. A Creator switching between their Buyer and Creator context (per `01-product-requirements.md` AUTH-06) is a full navigation between two separate applications, each independently fetching its own fresh state on load — this is a deliberate simplicity trade-off over attempting shared client-side state across origins, which would add significant complexity for a context-switch that happens infrequently per session.

### 9.10 Caching Philosophy

TanStack Query's cache is configured per-resource based on how frequently that resource changes and how costly staleness would be:

| Resource Type | `staleTime` | Rationale |
|---|---|---|
| Product/Category/Collection listings | 60s | Matches the ISR revalidation window (Section 7.4); avoids refetching data the CDN just served fresh |
| Product Detail (non-availability fields) | 5 min | Descriptive content changes rarely |
| Live availability/price (the PPP "hole," Section 7.7) | 0 (always refetch) | Correctness-critical, per `01-product-requirements.md` PDP-02 |
| Cart contents | 0 (always refetch on mount; optimistic updates for mutations, Section 10.3) | Must never show stale cart state |
| Order status | 30s, plus refetch-on-window-focus | Buyers actively checking order status expect near-real-time accuracy without needing manual refresh |
| Creator Dashboard analytics | 5 min | Explicitly non-real-time data (`01-product-requirements.md` ANLY-01 doesn't require real-time analytics) |
| Admin/Moderator queues | 15s, plus refetch-on-window-focus | Operational tools where a stale queue count risks duplicated effort across internal team members |

`gcTime` (cache garbage collection) is set generously (default 5 minutes, extended to the full session for the Buyer app's browsing history, Section 17.4's offline-caching needs) so that navigating back to a recently viewed Category doesn't trigger a full network refetch and loading-state flash.

### 9.11 Prefetching

Server Components prefetch data for likely-next navigations directly into the TanStack Query cache via `HydrationBoundary` (React Query's SSR/RSC integration) — e.g., a Category page's Server Component prefetches the first few Product Detail pages a user is statistically likely to click, so that navigation feels instant. Hover/viewport-based client-side prefetching (via Next.js's built-in `<Link>` prefetching, plus a custom `usePrefetchOnHover` hook wrapping TanStack Query's `prefetchQuery`) supplements this for Client Component-heavy navigation within Dashboards.

### 9.12 Guest-to-Authenticated State Transition

A Guest's session Cart and Wishlist (per `01-product-requirements.md` CART-01, WISH-01) are held in a `localStorage`-persisted Zustand store while unauthenticated. On sign-in or registration, a dedicated migration routine calls the API to merge this local state into the newly authenticated buyer's server-side cart/wishlist (`03-user-journeys.md` 4.2's "preserving the in-progress cart/action" requirement), after which the local store is cleared and the feature switches to reading exclusively from TanStack Query/server state going forward — this transition is a one-time, explicit, tested code path, never an ambiguous dual-source-of-truth state.

---

# 10. API Communication

### 10.1 REST Architecture — the Backend-for-Frontend (BFF) Pattern

The browser **never** calls the REST API (`09-api-architecture.md`) directly. Every request flows: `Browser → Next.js Route Handler or Server Action → REST API`. Next.js's server runtime acts as a lightweight BFF layer for all three apps. This is a deliberate architectural decision, not an accident of "Next.js happens to have Route Handlers":

- **Security**: the Bearer access token (`09-api-architecture.md` Section 2.4.1) is attached server-side and never sent to or stored in the browser, eliminating an entire class of XSS-driven token-theft risk (expanded in Section 21.3). The browser only ever holds a Better Auth session cookie (`httpOnly`, `secure`, `sameSite=lax`).
- **Consistency**: request correlation IDs (`09-api-architecture.md` Section 2.18), retry logic, and error-envelope parsing (Section 10.9) are implemented once, server-side, in `packages/api-client`, rather than duplicated in every client component that would otherwise call the API directly.
- **Flexibility**: the BFF layer can aggregate multiple backend calls into one response shaped for a specific screen (e.g., a Dashboard Overview's Route Handler calling three backend endpoints in parallel and returning one combined payload), reducing client-side request waterfalls without requiring the backend API itself to expose bespoke, screen-specific aggregate endpoints.

### 10.2 Server Actions vs. Route Handlers — When Each Is Used

| | Server Actions | Route Handlers |
|---|---|---|
| **Used for** | Form submissions benefiting from progressive enhancement (Section 7.9): Support Tickets, Reviews, Address CRUD, Creator Registration steps | Anything called from a Client Component via TanStack Query: Add to Cart, filter changes, real-time-feeling mutations, anything needing optimistic UI |
| **Why** | Works without client JS having hydrated yet; integrates directly with `<form action={...}>` | TanStack Query needs a stable, cacheable, retriable HTTP endpoint shape to manage — Server Actions aren't a natural fit for that caching/query-key model |

### 10.3 Optimistic Updates

Applied per the same low-risk/reversible rule established in `06-design-system.md` Section 25.2: Wishlist toggle, notification read-state, and cart quantity adjustments update the TanStack Query cache **immediately** (via `onMutate`), before the server confirms, with automatic rollback (`onError`) and a Toast notification if the mutation ultimately fails. High-consequence mutations (Payment, Order placement, Refund requests) **never** use optimistic UI — the interface waits for confirmed server success before indicating completion, exactly matching `05-design-principles.md` Section 15's stated trust-over-perceived-speed trade-off for consequential actions.

### 10.4 Pagination

List endpoints use the cursor/offset pagination envelope defined in `09-api-architecture.md` Section 2.7, wrapped by `packages/api-client` into a `useInfiniteQuery`-based hook for any list the UI presents as "Load more" (per `06-design-system.md` Section 25.4's mobile-first, explicit-load-more preference) or a `useQuery`-based paginated hook for Admin/Internal tables using numbered Pagination (`06-design-system.md` Section 16).

### 10.5 Filtering

Filter parameters map directly to the query-string filter syntax defined in `09-api-architecture.md` Section 2.8 (`field[operator]=value`), constructed by a shared `buildFilterParams()` utility in `packages/api-client` so every feature's filter UI produces a consistent, correctly-encoded query string rather than each feature hand-rolling its own parameter construction.

### 10.6 Infinite Scrolling

Explicitly **not** the default pattern platform-wide (per `06-design-system.md` Section 25.4's rejection of engagement-maximizing infinite scroll as an anti-pattern, `05-design-principles.md` Section 18's Community anti-pattern rejection). `useInfiniteQuery` is used only to power the explicit, user-triggered "Load more" button — the hook's technical capability for automatic scroll-triggered fetching is deliberately unused for buyer-facing catalog browsing, reserved only for genuinely continuous internal-tool logs (e.g., Audit Log, `07-ui-screens-wireframes.md` Section 7.16) where the UX rationale against infinite scroll doesn't apply.

### 10.7 Retries

`packages/api-client`'s base fetch wrapper implements automatic retry (via TanStack Query's built-in retry, configured to 2 attempts with exponential backoff) for `GET` requests failing with a network error or a `503` (per `09-api-architecture.md` Section 2.3). Mutating requests (`POST`/`PATCH`/`DELETE`) are retried automatically **only** when an `Idempotency-Key` was attached (per `09-api-architecture.md` Section 2.4.1's requirement on financial/order-mutating endpoints) — retrying a non-idempotent mutation without that guarantee risks duplicate orders or duplicate charges, so the client-side retry logic strictly mirrors the backend's idempotency contract rather than assuming its own safety.

### 10.8 Caching

See Section 9.10 for the full per-resource `staleTime`/`gcTime` policy — this is the client-side complement to the HTTP `Cache-Control`/`ETag` headers `09-api-architecture.md` Section 2.4.2 defines at the transport level; `packages/api-client` respects both layers (HTTP caching for the BFF-to-backend leg, TanStack Query caching for the browser-to-BFF leg).

### 10.9 Error Recovery

Every API error response's envelope (`09-api-architecture.md` Section 2.15 — `{ error: { code, message, details, correlationId } }`) is parsed once, centrally, in `packages/api-client`'s base client, and normalized into a typed `ApiError` object with the same shape regardless of which endpoint produced it. Feature code never parses raw error responses itself. `code` (the machine-readable `SCREAMING_SNAKE_CASE` value) drives UI branching — e.g., `code === 'VALIDATION_ERROR'` maps `details` onto React Hook Form field errors (Section 11.5); `code === 'INSUFFICIENT_STOCK'` triggers the Inventory Conflict recovery flow from `03-user-journeys.md` Section 8.9. `message` is never shown directly to end users unlocalized/unreworded, per `09-api-architecture.md` Section 2.15's explicit caveat — user-facing copy is always mapped from `code` through `06-design-system.md` Section 12's content voice guidelines, maintained in a single `errorMessages.ts` mapping table in `packages/utils`.

### 10.10 Loading Strategy

See Section 15 (Loading Principles → Section 6.5's `loading.tsx` mechanism for route-level loads) and Section 9.10 for query-level `isLoading`/`isFetching` distinctions: `isLoading` (no cached data yet) renders a Skeleton; `isFetching` with existing cached data (a background refetch) renders no visible loading state at all by default, avoiding the common anti-pattern of flashing a spinner over content the user can already see and use.

---

# 11. Forms Architecture

### 11.1 React Hook Form as the Standard

Every form on the platform — from a two-field Login form to the multi-step Add Product editor — is built on React Hook Form, never manually managed `useState` per field. This is a firm, no-exceptions rule: manual form state management is a common source of unnecessary re-renders (RHF is uncontrolled-by-default, minimizing re-render count) and inconsistent validation-timing behavior across the app, directly undermining `05-design-principles.md` Section 11.3's requirement that validation timing be consistent platform-wide.

### 11.2 Validation — Zod as the Single Source of Truth

Every form's validation rules are defined as a Zod schema, shared between client-side validation (via RHF's `zodResolver`) and, critically, **structurally mirrored by the backend's own validation** (`09-api-architecture.md` Section 2.3's 422 business-rule validation). Base schemas for common fields (email, phone, address, money) live in `packages/utils/validation` and are composed into feature-specific schemas (`features/checkout/schemas/addressSchema.ts` extends the shared `addressSchema` with checkout-specific refinements) — this means a change to what counts as a valid Indian postal code, for example, is made once and automatically applies to every form using that shared primitive, rather than needing to be found and fixed in N separate places.

### 11.3 Dynamic Forms

The Product Editor's Customization Options configuration (`07-ui-screens-wireframes.md` Section 6.7, implementing `01-product-requirements.md` CUST-01's per-listing customization fields) is the platform's primary dynamic-form use case: a creator defines an arbitrary number of customization fields (text/image/choice/measurement), each becoming a corresponding dynamic Zod schema entry and RHF field array at both creation time (the creator's form) and purchase time (the buyer's Customization Panel, rendering whatever schema that specific listing defines). RHF's `useFieldArray` powers the variable-length field configuration; the resulting schema is persisted as structured data (not free-form text) so the buyer-facing form can be generated deterministically from it.

### 11.4 File Uploads

The Upload component (`06-design-system.md` Section 14) wraps direct-to-Cloudflare-R2 upload via pre-signed URLs obtained from a Route Handler (never uploading through the Next.js server itself as a proxy, which would needlessly consume server compute/bandwidth for what is fundamentally a client-to-storage transfer). Upload progress is tracked via the underlying `XMLHttpRequest`/`fetch` progress events and reflected in the component's progress-indicator state (per `06-design-system.md` Section 15's Progress principle); a successful upload returns a stable asset reference which is what's actually stored in the form's field value — the form never holds raw file bytes in its state after the upload begins.

### 11.5 Autosave

Used specifically for the Product Editor's Drafts feature (`07-ui-screens-wireframes.md` Section 6.9) and Creator Registration's multi-step application (Section 4.9): a debounced (e.g., 2-second idle) autosave calls a Server Action to persist the current form state as a Draft, giving creators the "safely pause and resume" guarantee `03-user-journeys.md` Section 4.9's recovery flow requires, without requiring an explicit "Save Draft" click for every incremental change. Autosave failures are silent-but-logged (Sentry, Section 23) and retried on the next debounce cycle — they never surface a disruptive error to the creator for what is, from their perspective, a background convenience feature, though a persistent failure eventually surfaces a non-blocking Toast so the creator isn't unknowingly working against a broken autosave.

### 11.6 Wizard Forms

Multi-step forms (Checkout, Creator Registration) combine RHF (per-step field validation) with the Zustand store pattern from Section 9.4 (cross-step submitted-data accumulation) and Next.js's Stepper component (`06-design-system.md` Section 16) for the visual progress indicator. Each step validates independently before allowing progression (`05-design-principles.md` Section 11.8's Progressive Forms principle) — a step's "Next" action is disabled until that step's own Zod schema passes, never deferred to a single validation pass at final submission.

### 11.7 Error Handling

Form-level error handling follows one path, end to end: Zod validation failure → RHF's `errors` object → `06-design-system.md` Section 14.1's inline, field-adjacent error styling. Server-side validation failures (`09-api-architecture.md`'s `422` responses with field-level `details`, Section 10.9 above) are mapped back onto the *same* RHF `errors` object via `setError()`, so a field that passes client validation but fails a server-side business rule (e.g., an email already registered) renders through the identical visual and accessibility treatment as a client-side validation error — the user never perceives a categorical difference between "your input was locally invalid" and "the server rejected this for a business reason," which matches the unified error-experience goal in `05-design-principles.md` Section 14.

### 11.8 Accessibility

Every form field is rendered via a shared `FormField` wrapper component (`packages/ui`) that automatically wires the label, input, description, and error message together with correct `htmlFor`/`id`/`aria-describedby`/`aria-invalid` associations — satisfying `06-design-system.md` Section 26.12 by construction, not by each feature remembering to wire ARIA attributes correctly by hand every time. Error messages are additionally announced via an `aria-live="polite"` region on submission failure, ensuring screen reader users are notified of validation failures without needing to re-navigate to each field to discover them.

---

# 12. Authentication UX

### 12.1 Better Auth Integration

`packages/auth` wraps Better Auth's client and server SDKs, configured once and consumed identically by all three apps. Better Auth issues and manages a session (via an `httpOnly`, `secure` cookie) directly on each app's domain; this session — **not** a raw API Bearer token — is what the browser ever holds, consistent with Section 10.1's BFF security rationale. When a Server Component or Route Handler needs to call the REST API, `packages/auth` exchanges the validated Better Auth session for the API's expected Bearer token server-side, on that request, never persisting or forwarding a long-lived API token to the client.

### 12.2 Protected Routes

Every app's `middleware.ts` performs the first-line session check: an absent or invalid session redirects to that app's Login screen before any route handler or page component executes, preserving the originally requested URL (per `03-user-journeys.md` 4.11's Session Expired recovery flow) as a `redirectTo` parameter for post-login continuation. This middleware-level check is a **UX convenience and defense-in-depth measure**, not the sole security boundary — every Server Component and Route Handler independently re-validates the session server-side before returning any protected data (Section 21.6), since middleware alone can theoretically be bypassed by a misconfigured edge case and must never be the only gate.

### 12.3 Guest Routes

`apps/buyer` explicitly allow-lists routes accessible without a session (Home, Category, Product Detail, Cart, Guest Checkout, and the Authentication routes themselves) in `middleware.ts` — the default posture for `apps/buyer` is "public unless a route is explicitly protected," the inverse of `apps/creator` and `apps/internal`'s "protected unless explicitly public" posture, directly reflecting the differing Guest-access models defined in `01-product-requirements.md` Section 3.1 versus Sections 3.3–3.8.

### 12.4 Session Handling

Session validity is checked server-side on every protected request (Section 12.2); the client additionally holds a lightweight, non-sensitive "is authenticated + role + display name" snapshot (via a Zustand store populated from the initial server-rendered shell, per Section 9.4's client-UI-state category) purely to drive UI decisions like showing the correct account menu without an extra round-trip — this client snapshot is **never** treated as authoritative for anything security-sensitive; every actual data request re-validates server-side regardless of what the client snapshot claims.

### 12.5 Role-Aware Navigation

Navigation chrome (Section 6, `packages/ui`'s Sidebar/Navbar components) renders conditionally based on the authenticated user's role and permissions, following `04-information-architecture.md` Section 16's rule precisely: **restricted destinations are omitted from navigation entirely, never shown disabled.** This is implemented by passing a `permissions` object (resolved server-side from the session, Section 12.2) into the navigation component tree, which filters its own rendered items — there is no client-side "role guessing" from a JWT payload inspected in the browser, since the permission set is a server-authoritative value fetched fresh, not decoded client-side from a token the client never holds (Section 12.1).

### 12.6 Permission-Aware UI

Beyond navigation, individual actions within a screen (e.g., a "Suspend Creator" button visible only to Admin, not Moderator, per `01-product-requirements.md` Section 3.5–3.6's differing authority) are gated by the same server-resolved `permissions` object, consumed via a shared `usePermission('creator:suspend')` hook in `packages/auth`. As with routing (Section 6.6), this UI-level gating is a UX layer preventing a user from *attempting* an action they'd be rejected for — the authoritative enforcement is always the backend API's own permission check (`09-api-architecture.md` Section 2.3's `403` model), and the frontend never assumes its own gating is sufficient security (expanded in Section 21.6).

---

# 13. Design System Integration

### 13.1 shadcn/ui as the Foundation Layer

Per the finalized stack, shadcn/ui's model — component source code copied into the repository and owned directly, rather than installed as an opaque npm dependency — is used as the starting scaffold for `packages/ui`'s primitives (Section 4.2), then modified to precisely match `06-design-system.md`'s token values, variants, and states (Sections 3–22 of that document). This is why shadcn/ui was the right foundation choice for this project specifically: a fully pre-styled component library (e.g., a themed MUI or Ant Design) would fight against the deliberately custom, warm, editorial visual language `06-design-system.md` defines, whereas shadcn/ui's "you own the code" model means there is no ceiling on how precisely the implementation can match that design system.

### 13.2 Design Tokens

`packages/config/tailwind` implements every token category from `06-design-system.md` Section 2 (color, typography, spacing, radius, elevation, motion, opacity, z-index, sizing, duration, breakpoints) as Tailwind theme extensions, following the identical three-tier naming (`color-brand-primary`, `space-200`, etc., Section 2.1 of that document) so that a class like `bg-color-brand-primary` or `p-space-200` in code reads as a literal, traceable implementation of a specific documented design decision — never an arbitrary Tailwind default or an ad hoc hex/pixel value (directly enforcing `06-design-system.md` Section 31's "no arbitrary values" QA rule at the tooling level via a custom ESLint/Tailwind lint rule, Section 24.6).

### 13.3 Theme System

Tailwind's CSS custom-property-based theming mechanism is used so that the token *values* (Section 13.2) can be swapped at the CSS-variable layer without touching component code — this is the concrete technical mechanism that makes `06-design-system.md` Section 28's Dark Mode strategy (alias-tier remapping with zero component-level changes) actually achievable: a future dark theme is implemented as an alternate CSS custom-property set, activated by a `data-theme` attribute, with every existing component automatically correct because they reference the semantic-tier CSS variables, never a hardcoded value.

### 13.4 Typography, Spacing, Icons

Directly implement `06-design-system.md` Sections 4 (type scale as Tailwind `text-*` utilities mapped to `type-*` tokens), 5 (spacing scale as `space-*` utilities), and 7 (Lucide Icons, per the finalized stack, wrapped in a thin `packages/ui/icons` layer that maps the design system's meaning-based icon names — e.g., `icon/verified-badge`, Section 30 of that document — onto the specific Lucide icon component used, so a future icon-set swap touches one mapping file, not every consuming component).

### 13.5 Dark Mode

Not implemented in v2 (per `06-design-system.md` Section 28's explicit future-capability framing), but Section 13.3's CSS-variable theming mechanism means the frontend architecture requires zero structural rework to add it later — this is validated as an explicit non-goal check in the Architecture Review Checklist (Section 27).

### 13.6 Brand Consistency

Framer Motion (per the finalized stack) is configured with a single shared `motion` token config (durations/easing from `06-design-system.md` Section 2.8, 10.3) imported everywhere animation is used, rather than each component hand-specifying its own transition timing — this is the code-level enforcement mechanism for `06-design-system.md` Section 17's "Motion" consistency rule.

### 13.7 Component Governance

`packages/ui` changes go through a lighter-weight but still real review process (Section 27): any new component or variant must be traceable to an existing entry in `06-design-system.md` Sections 13–22, or — if it represents a genuinely new pattern — trigger a documented update to that document *first*, before the component ships in code. Design and Frontend Engineering jointly own this gate (per `06-design-system.md` Section 1.4), preventing the two artifacts (the design system doc and the actual component library) from silently diverging over time, which is the single most common failure mode of design systems at growing companies.

---

# 14. Responsive Design

### 14.1 Breakpoints

Tailwind's breakpoint configuration implements the exact tokens from `06-design-system.md` Section 2.14 (`xs`/`sm`/`md`/`lg`/`xl`), so every responsive utility class (`md:grid-cols-3`) maps directly and unambiguously onto a documented design decision rather than an arbitrary pixel value chosen per-component.

### 14.2 Mobile-First Implementation

Every component and every Tailwind utility is authored mobile-first: unprefixed classes define the mobile (`xs`) styling, with `md:`/`lg:`/`xl:` prefixes layering on progressively larger-viewport adaptations. This is not merely a CSS authoring convention — it is enforced by Section 2.10's architectural principle and checked in the Architecture/Design Review process (Sections 27, `05-design-principles.md` Section 19) by building and reviewing every new screen at the mobile breakpoint first, full stop, before a desktop variant is even considered.

### 14.3 Adaptive Layouts (Tablet, Desktop, Large Displays)

Layout components (Section 8.6) use CSS Grid and Flexbox with Tailwind's responsive variants to **reflow structurally** at breakpoints — not merely scale proportionally — matching `06-design-system.md` Section 27's explicit rule (e.g., Cart's two-column Checkout layout collapsing to single-column on mobile is a genuine structural change in DOM layout composition via conditional rendering/CSS grid-template-area swaps, not a squeeze-and-shrink of the same fixed layout).

### 14.4 Touch Interactions

All interactive elements meet the 44×44px minimum touch target (`06-design-system.md` Section 2.12, 26.8) via a shared Tailwind utility class (`min-h-touch min-w-touch`) applied through `packages/ui`'s primitive components by default, so touch-target compliance is inherited automatically rather than needing to be remembered per-instance. Framer Motion's gesture utilities power swipe-to-dismiss (Bottom Sheet, per `06-design-system.md` Section 18) with a mandatory, equally-accessible non-gesture close button always present (per `05-design-principles.md` Section 6.12's rule that gestures accelerate, never replace, a standard control).

### 14.5 Safe Areas

The Buyer PWA's root layout applies `env(safe-area-inset-*)` CSS environment variables to the Bottom Navigation and any full-screen overlay (Image Viewer, Bottom Sheet), ensuring correct rendering on notched/rounded-corner mobile devices when installed as a standalone PWA (Section 17.6) — this is invisible in a regular browser tab (where the browser chrome already handles safe areas) but essential once the app runs edge-to-edge as an installed application.

### 14.6 Foldables and Orientation

Layouts use relative units (`%`, `fr`, `vw`/`vh` avoided in favor of container-relative sizing) and CSS Grid's auto-flow capabilities specifically so that an abrupt aspect-ratio change (a foldable device's fold, or a rotation from portrait to landscape) triggers an automatic, correct reflow via the existing responsive breakpoint system rather than requiring bespoke foldable-specific code — `06-design-system.md` Section 27's foldable and landscape/portrait guidance is treated as additional breakpoint-behavior test cases (Section 22.6), not a separate architectural subsystem.

---

# 15. Accessibility

### 15.1 WCAG 2.2 AA as a Build-Time Constraint

Accessibility conformance is enforced at three points in the development lifecycle, not audited once before launch: **component authoring** (every `packages/ui` component ships with its accessibility behavior as part of its definition, Section 2.9), **CI** (automated axe-core scans run against every PR's affected routes, Section 22.5), and **code review** (the Architecture Review Checklist, Section 27, includes accessibility as a mandatory, non-optional gate).

### 15.2 Keyboard Navigation

Every interactive surface is operable via Tab/Shift+Tab/Enter/Space/Escape and, for composite widgets, arrow keys — inherited by construction from Radix UI's primitives (Section 8.8) for anything built on them, and explicitly implemented and tested (Section 22.5) for any custom interactive component that isn't. Focus order follows DOM order, which is why component composition (Section 8) always keeps visual and DOM order aligned — CSS-only reordering (e.g., `flex-direction: row-reverse` purely for visual effect) that would desync visual and focus order is avoided or, where genuinely necessary for a responsive reflow, paired with an explicit `tabIndex` correction.

### 15.3 Focus Management

Modal, Dialog, and Bottom Sheet components (`packages/ui`, built on Radix UI's `Dialog` primitive) trap focus within themselves while open and restore focus to the triggering element on close, satisfying `06-design-system.md` Section 26.5 without bespoke per-instance focus-management code. Route transitions (App Router navigations) move focus to the new page's main heading (`h1`) via a shared `useRouteFocusManagement` hook, ensuring screen reader users are correctly oriented to new content after every client-side navigation, which the browser's native page-load focus behavior would otherwise handle automatically but SPA-style navigation does not provide for free.

### 15.4 ARIA

Following `06-design-system.md` Section 26.4's philosophy exactly: semantic HTML elements (`<button>`, `<nav>`, `<table>`) are used first; ARIA attributes are added only to fill genuine semantic gaps native HTML can't express (e.g., `aria-live` regions for toast notifications and async status changes, `aria-expanded` on custom disclosure widgets). Radix UI supplies correct ARIA wiring for every compound/headless component it powers (Section 8.8); custom components' ARIA implementation is code-reviewed against the WAI-ARIA Authoring Practices Guide pattern for that widget type.

### 15.5 Screen Readers

Manual testing with VoiceOver (macOS/iOS) and NVDA (Windows) is a required step (not optional) in the QA process (Section 22.5) for any new interactive pattern not already covered by an existing, previously-tested `packages/ui` component — automated tooling (axe-core) catches structural violations but cannot verify that the actual experience of using a screen reader through a flow is coherent, per `05-design-principles.md` Section 20.4's insight that automated tools alone are insufficient.

### 15.6 Contrast

Enforced at the token level (Section 13.2) — since every color usage in the codebase references a `06-design-system.md`-defined semantic token, and every token pairing was pre-verified for WCAG 2.2 AA contrast (`06-design-system.md` Section 3.11), contrast violations can only occur if a component bypasses the token system with an arbitrary color value, which the lint rule in Section 13.2/24.6 prevents.

### 15.7 Reduced Motion

`packages/ui`'s shared Framer Motion configuration (Section 13.6) wraps every animated transition in a check against the `prefers-reduced-motion` media query (surfaced via a `useReducedMotion` hook built on Framer Motion's own utility), automatically substituting an instant or fade-only transition per `06-design-system.md` Section 10.9 — this is implemented once, centrally, so no individual component author needs to remember to add this check themselves.

### 15.8 Forms

See Section 11.8 — the shared `FormField` wrapper component is the single implementation point for form accessibility platform-wide.

### 15.9 Images and Charts

Every image-rendering component (`next/image`-based, Section 16.6) requires an `alt` prop at the TypeScript type level — a missing `alt` is a compile-time error, not a runtime oversight, for any image sourced from creator/product content; purely decorative images use an explicit `alt=""` (never omitted) so the intent is unambiguous in code review. Chart components (`packages/ui/data-display`, wrapping the charting library) always render a paired, visually-hidden-but-screen-reader-accessible data table alongside the visual chart, satisfying `06-design-system.md` Section 26.14 as a structural property of the `Chart` component itself, not an opt-in the consuming feature must remember to add.

---

# 16. Performance

### 16.1 Core Web Vitals as the Governing Metric

The Buyer app's performance budget is defined and enforced in terms of Core Web Vitals at the 75th percentile of real user traffic (via PostHog's session data plus Vercel Speed Insights), not synthetic lab scores alone — matching `00-project-vision.md` Section 14's Lighthouse 95+/sub-2-second targets, but measured where it actually matters: real devices, real networks, real people.

| Metric | Target | Primary Architectural Lever |
|---|---|---|
| **LCP** (Largest Contentful Paint) | < 2.0s | Server Components + ISR/PPP (Section 7) eliminate client-side data-fetch waterfalls before the largest element (typically the primary product image) can paint |
| **INP** (Interaction to Next Paint) | < 200ms | Small, leaf-level Client Component boundaries (Section 7.8) keep hydration and event-handler execution cost low |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Skeleton states matching exact content dimensions (Section 6.5); explicit `width`/`height` on every `next/image` usage; font-loading strategy (Section 16.7) preventing FOIT/FOUT-driven reflow |

### 16.2 Bundle Splitting and the Buyer JS Budget

`apps/buyer` enforces an explicit, CI-checked JavaScript budget per route (via `@next/bundle-analyzer` integrated into CI, Section 22.7) — a hard ceiling on shipped, hydrated JS for the Home, Category, and Product Detail routes specifically, since these are the highest-traffic, most performance-sensitive pages on the platform. A PR that pushes a route over budget fails CI and requires either optimization or an explicit, reviewed exception — this is the concrete enforcement mechanism behind the "Performance-First" principle (Section 2.8) actually holding under normal team growth and feature pressure, rather than degrading silently over time the way unenforced performance intentions typically do.

### 16.3 Lazy Loading and Code Splitting

Next.js's automatic route-based code splitting is the baseline; additionally, `next/dynamic` is used deliberately for genuinely heavy, below-the-fold, or conditionally-rendered components — the Image Viewer (Section 6.4), the Rich Text editor (used only in Creator storefront Branding, Section 6 of `07-ui-screens-wireframes.md`), and chart libraries (Analytics, used only by authenticated Creator/Admin) are all dynamically imported so their weight never touches the Buyer app's guest-facing critical path.

### 16.4 Dynamic Imports

Applied with the same discipline described in 16.3, always paired with a matching Skeleton `loading` fallback (never Next.js's default blank-until-loaded behavior) so a dynamically imported component's load time is never perceived as a broken or frozen UI.

### 16.5 Image Optimization

Every image on the platform renders through `next/image`, which handles responsive `srcset` generation, automatic modern-format serving (AVIF/WebP with fallback), and lazy loading below the fold (directly implementing `06-design-system.md` Section 25.3) by default. Product and creator photography (per `06-design-system.md` Section 9's rigorous quality guidelines) is served from Cloudflare R2 (per the finalized stack) through a Next.js Image loader configured for R2's URL structure, with a defined set of standard responsive breakpoint widths generated at upload time (Section 11.4) rather than generated on-demand per request, trading a small amount of storage for consistently fast delivery.

### 16.6 Font Optimization

`next/font` (used for both the serif and sans typeface roles defined in `06-design-system.md` Section 4.2) self-hosts and subsets fonts at build time, eliminating render-blocking third-party font requests entirely and applying `font-display: swap` with a matched fallback-font metric override, which is the specific technique that prevents the layout shift (CLS) that unmanaged custom web fonts commonly cause.

### 16.7 Memoization

Applied surgically, not by default: `React.memo`, `useMemo`, and `useCallback` are used only where profiling (React DevTools Profiler, checked during code review for any component identified as a re-render hotspot) demonstrates a genuine, measurable benefit — blanket memoization is avoided as an anti-pattern, since it adds cognitive overhead and, in React 19's compiler-assisted world (the React Compiler, part of the React 19 toolchain), is increasingly handled automatically for straightforward cases, making manual memoization a targeted tool for genuinely complex cases rather than a default habit.

### 16.8 Virtualization

Long lists in internal tools (Audit Log, large Order/User tables in `apps/internal`, per `07-ui-screens-wireframes.md` Section 7) use windowed/virtualized rendering (a lightweight virtualization library, rendering only the visible row range) once a list's typical length exceeds roughly 100 rows, since rendering thousands of DOM rows for a data-dense internal table is a common, avoidable source of INP degradation in exactly the tools where operational users spend the most consecutive hours.

### 16.9 Rendering Optimization

Beyond Section 9.4's Zustand selector discipline, list-rendering components always supply stable, unique `key` props (entity IDs from `08-database-design.md`'s UUID strategy, never array index) to prevent unnecessary remount/re-render cascades on list reordering or filtering.

### 16.10 Prefetching

See Section 9.11 — Next.js `<Link>` prefetching is enabled by default for all in-viewport links on the Buyer app (its cost is justified by the high likelihood of navigation), and deliberately disabled/manual for Admin/Internal tables' row links, where prefetching every visible row in a dense table would waste bandwidth on links the operator is scanning, not about to click.

---

# 17. PWA Architecture

PWA capability is scoped **exclusively to `apps/buyer`**. `apps/creator` and `apps/internal` are explicitly not PWAs — a deliberate scoping decision, not an oversight: PWA investment (offline caching, installability, background sync) serves the platform's stated goal of inclusivity for lower-connectivity buyers (`05-design-principles.md` Sections 4.18, 8.10), which has no equivalent product need for internal operational tools that are desktop-first, always-online-by-assumption, and used by a small, known set of staff (per `06-design-system.md` Section 18's explicit scoping).

### 17.1 Manifest

`apps/buyer/public/manifest.json` defines the installable app's name, icons (multiple resolutions per platform requirements), theme color (matching `06-design-system.md` Section 3's `color-brand-primary`), display mode (`standalone`, so the installed app hides browser chrome), and start URL. The manifest is generated via Next.js's `manifest.ts` file convention rather than a static JSON file, so its contents (e.g., theme color) can programmatically stay in sync with the design token source of truth (Section 13.2) rather than requiring manual duplication.

### 17.2 Service Worker

Implemented via `next-pwa` or an equivalent Workbox-based integration compatible with the App Router (evaluated at implementation time for current compatibility with Next.js 15's caching model; the architectural requirement — not a specific library — is the durable decision here). The service worker registers on first visit and manages three caching strategies, applied per resource type:

| Resource Type | Strategy | Rationale |
|---|---|---|
| App shell (layout, navigation chrome, `packages/ui` static assets, fonts) | Cache-first, precached at install | Never re-fetched once cached; changes only on a new deployment (Section 17.7) |
| Catalog pages (Category, Product Detail HTML/RSC payload, previously visited) | Stale-while-revalidate | Instant repeat-visit rendering from cache, silently refreshed in the background — directly implementing `06-design-system.md` Section 25.6's "caching awareness" principle |
| API responses (via the BFF Route Handlers, Section 10.1) | Network-first with cache fallback | Prefers fresh data when online; falls back to the last-known-good cached response when offline, satisfying Section 2.11's offline-first principle without ever showing stale data when a fresh connection is available |

### 17.3 Offline Caching

The previously-viewed-content guarantee (per `05-design-principles.md` Section 4.17, `06-design-system.md` Section 24 "Offline" error state) is implemented as: any Product, Category, or Collection page a buyer has visited in the current or a recent prior session remains renderable from the service worker's cache with zero network dependency, with a persistent, non-blocking Offline banner (`06-design-system.md` Section 17, `07-ui-screens-wireframes.md` Section 10.2) rather than a broken page. Cart contents (held in TanStack Query's cache, hydrated from the last successful fetch) similarly remain visible offline, clearly marked as potentially stale, with all mutating actions (checkout, quantity changes) disabled with an explanatory state until connectivity returns — consistent with `05-design-principles.md` Section 4.17's read-only-while-offline principle.

### 17.4 Background Sync

Used specifically for actions a buyer takes while offline that are safe to queue and replay: Wishlist additions and, narrowly, non-payment cart modifications. The Background Sync API registers a sync event that the service worker replays against the real API the moment connectivity returns, with a clear, non-alarming confirmation once synced (`06-design-system.md` Section 15's Background Sync principle) — explicitly **never** used for Checkout or Payment submission, which always require a live, confirmed connection given their consequential, hard-to-reverse nature (mirroring the Optimistic Update exclusion in Section 10.3).

### 17.5 Push Notifications

Architecturally reserved (the manifest and service worker registration support it) but not enabled as a default-on feature in v2, pending an explicit product decision on notification categories and consent flow consistent with `01-product-requirements.md` NOTIF-02's opt-in requirements — the technical foundation is in place so enabling it later is a feature-flagged addition, not new infrastructure.

### 17.6 Installability

The platform follows standard installability criteria (valid manifest, registered service worker, served over HTTPS) automatically once Sections 17.1–17.2 are in place; an in-app install *prompt* (as opposed to the browser's native, often-ignored one) is shown at a deliberately chosen moment — after a buyer's second meaningful session, not on first visit — per `06-design-system.md` Section 18's explicit guidance against an intrusive first-visit prompt, working toward the platform's stated PWA install rate target (`00-project-vision.md` Section 14).

### 17.7 Update Strategy

The service worker uses a "stale-while-revalidate for the shell, prompt-to-refresh for a new version" pattern: when a new deployment's service worker is detected, a small, dismissible in-app notification (not a forced reload) informs the buyer an update is available, giving them control over when to refresh rather than yanking them out of an in-progress task (e.g., mid-Checkout) — directly consistent with `05-design-principles.md` Section 2.12's Calm Interfaces philosophy applied to the specifically disruptive moment of a forced app reload.

---

# 18. Error Handling

### 18.1 Global Error Boundaries

Each app defines a root `global-error.tsx` (Next.js's catch-all for errors escaping even the root layout) rendering the calm, minimal `06-design-system.md` Section 14 "500" composition. Beneath that, route-segment-level `error.tsx` boundaries (Section 6.6) catch failures at the most granular level feasible, so a failure in one Suspense-streamed section (Section 7.6) never takes down an entire otherwise-working page — matching `05-design-principles.md` Section 14's explicit granularity requirement.

### 18.2 API Errors

Handled centrally per Section 10.9's normalized `ApiError` shape. Every feature-level error-handling code checks `error.code`, never `error.message` string content (which is documented as not guaranteed stable or user-facing-safe, per `09-api-architecture.md` Section 2.15) — this is enforced via TypeScript's discriminated-union typing on the `ApiError` type in `packages/types`, making it a compile-time property rather than a convention that could be silently violated.

### 18.3 Validation Errors

See Section 11.7 — unified through React Hook Form's `errors` object regardless of client or server origin.

### 18.4 Retry UX

Every error state (Toast, Alert, full-page error boundary) that represents a plausibly-transient failure includes an explicit, prominent Retry action (`06-design-system.md` Section 14's cross-cutting Retry pattern), wired to simply re-trigger the same TanStack Query/Server Component fetch that failed — never requiring a full page reload as the only recovery path, per `04-information-architecture.md` Section 19's general recovery principle.

### 18.5 Fallback UI

Component-level error boundaries (used for genuinely optional, non-critical page sections — e.g., a Recommendations carousel, a third-party-adjacent widget) render a minimal, silent fallback (the section simply doesn't appear) rather than an error message, when that section's failure has no meaningful impact on the buyer's ability to complete their actual task — reserving visible error messaging (Toast/Alert/full boundary) for failures that genuinely block or meaningfully degrade the user's goal.

### 18.6 Toast Notifications

The Toast/Snackbar components (`06-design-system.md` Section 17) are the default surface for transient, non-blocking mutation errors (a failed Wishlist toggle, a failed optimistic update rollback, Section 10.3) — implemented via a single, app-root-level Toast provider/queue (one instance per app) so that multiple near-simultaneous errors queue and display sequentially rather than stacking chaotically or silently overwriting one another.

### 18.7 Recovery Patterns

The platform-wide recovery pattern hierarchy, applied consistently: (1) automatic retry where safe (Section 10.7), (2) explicit user-triggered Retry action (Section 18.4), (3) state-preserving fallback to a prior valid state (e.g., Cart reverting an optimistic update, Section 10.3), (4) escalation to a Support contact path (`06-design-system.md` Section 14's Escalation row) only once the above are exhausted or inapplicable — never presenting "contact support" as the first or only response to a routine, retriable failure.

---

# 19. Animations

### 19.1 Motion Philosophy — Implementation

Framer Motion (per the finalized stack) is the sole animation library platform-wide, configured once via the shared motion-token wrapper described in Section 13.6, directly implementing `06-design-system.md` Section 10's motion system and `05-design-principles.md` Section 6's interaction principles. No component hand-rolls CSS transitions or a competing animation approach — this single-library discipline is what keeps motion feeling like one coherent system (per `05-design-principles.md` Section 20.2, insight 11) rather than a patchwork of inconsistent timing.

### 19.2 Micro-Interactions

Implemented as small `whileHover`/`whileTap`/`animate` variants on `packages/ui` primitives (Button press-scale, Wishlist heart fill-transition, Toggle state change), using the `duration-fast` (120ms) token exclusively for this category, per `06-design-system.md` Section 10.2.

### 19.3 Page Transitions

Deliberately minimal: full route-to-route transitions rely on the App Router's native streaming/Suspense-driven content replacement (Section 7.6) rather than a custom animated page-transition wrapper, since heavy page-transition animation on every navigation would work against both the performance budget (Section 16) and the Calm Interfaces philosophy (`05-design-principles.md` Section 2.12) — motion here is reserved for within-page state changes (a filter applying, a modal opening) where it clarifies cause and effect, not for the navigation event itself.

### 19.4 Loading Animations

Skeleton shimmer (Section 6.5, `06-design-system.md` Section 10.6) is implemented as a lightweight CSS/Framer Motion `animate` loop distinct from the interaction-triggered animations above, deliberately continuous and subtle rather than attention-grabbing, since its purpose is reassurance of progress, not delight.

### 19.5 Accessibility Considerations

Every Framer Motion animation instance consumes the shared `useReducedMotion` hook (Section 15.7) as a build-time-enforced pattern (a custom ESLint rule flags any direct `motion.div` usage that doesn't pass through the shared wrapper, Section 24.6) — this is the single mechanism that guarantees `06-design-system.md` Section 26.7's reduced-motion requirement holds true across every animation in the codebase, present and future, rather than depending on every engineer remembering to add the check manually each time.

### 19.6 Performance

Framer Motion animations exclusively animate GPU-accelerated CSS properties (`transform`, `opacity`) wherever functionally possible, avoiding layout-triggering properties (`width`, `top`, `margin`) that would force expensive browser reflow — this is a code-review-enforced convention (Section 27) directly protecting the INP and CLS budgets defined in Section 16.1.

---

# 20. Internationalization Readiness

Full internationalization is explicitly out of scope for v2 (per `01-product-requirements.md` Section 14, `04-information-architecture.md` Section 21), but the frontend architecture is built so that adding it later is additive, not a rewrite — the same "reserve the seam, don't build the feature" discipline applied throughout this document's Future-facing sections.

### 20.1 Architecture

Every user-facing string in the codebase is authored as a value passed through a single, centralized content layer (`packages/utils`'s content/copy module) rather than inlined directly in JSX — even though v2 ships only one locale, this means introducing `next-intl` or an equivalent App-Router-compatible i18n library later is a matter of wrapping that existing content layer, not hunting down and refactoring hundreds of hardcoded strings scattered across components.

### 20.2 Localization

The `app/[locale]/` route-segment pattern (Next.js's standard i18n routing convention) is structurally compatible with the current `app/` structure (Section 4.1) — the architecture avoids any routing decision today that would conflict with inserting a locale segment later, consistent with `04-information-architecture.md` Section 12.2's reserved future URL strategy.

### 20.3 Currency

Per Section 9's money-handling convention (mirroring `09-api-architecture.md` Section 2.11's minor-units modeling), every money value flows through the shared `formatMoney(amountMinorUnits, currencyCode)` utility (`packages/utils`) — never manually formatted inline — so that supporting a second currency later is a matter of that single utility handling additional currency codes and locale-aware formatting rules, not a platform-wide search-and-replace of ad hoc `₹${amount}` string interpolation.

### 20.4 Dates

Per `09-api-architecture.md` Section 2.13's UTC-only API contract, every date rendered in the UI flows through a shared `formatDate(isoString, userTimezone)` utility, converting from the API's UTC timestamps to the buyer's stored or detected timezone at the point of display — never at the point of storage or transmission — which is both a correctness requirement today (buyers in different regions of a single-locale launch market may still span time zones) and the exact mechanism that scales cleanly to full multi-region internationalization later.

### 20.5 Language Switching

Not built in v2 (no second language exists to switch to), but the reserved `app/[locale]/` structure (Section 20.2) means the eventual language-switcher UI is additive — a new navigation control writing to that route segment — rather than requiring new architectural plumbing.

### 20.6 Future Readiness

The combination of Sections 20.1–20.4 means the actual future cost of internationalization is concentrated entirely in **content translation and locale-specific business logic** (tax rules, address formats per `06-design-system.md` Section 11.11) — the frontend's technical plumbing for it is already in place by construction, not as a deferred architectural debt.

---

# 21. Security

### 21.1 XSS Prevention

React's default JSX escaping is the baseline defense and is never bypassed casually — `dangerouslySetInnerHTML` is used in exactly one deliberately reviewed location platform-wide (rendering a Creator's Rich Text story content, Section 11.4/6.14 of `07-ui-screens-wireframes.md`), and only after that content passes through a server-side HTML sanitizer (allow-listing a small, safe subset of formatting tags) before ever reaching the client — user-generated rich content is never trusted and rendered raw.

### 21.2 CSRF Considerations

Server Actions (Section 7.9) have built-in CSRF protection as a Next.js framework guarantee (origin-checked, encrypted action references) — this is a primary reason form-submission-style mutations prefer Server Actions over a hand-rolled Route Handler POST where progressive enhancement isn't otherwise required. For Route Handlers that do accept mutating requests from client-side fetches (Section 10.2), the Better Auth session cookie's `sameSite=lax` configuration (Section 12.1) provides the primary CSRF defense, supplemented by explicit origin validation in the Route Handler for any particularly sensitive mutation (payment-adjacent actions).

### 21.3 Token Handling

As established in Sections 10.1 and 12.1: the REST API's Bearer access token **never reaches the browser** under any code path. This isn't a convention the team is asked to remember — it's a structural property of the architecture, since `packages/api-client`'s functions that attach the Bearer token are only ever invoked from server-side code (Server Components, Route Handlers, Server Actions), and the token itself is only ever read from a server-side environment/session context, never serialized into any payload sent to the client. This single decision eliminates the most common frontend token-theft vector (a stored token readable by any injected script) by construction, rather than by discipline.

### 21.4 Secure Storage

The browser holds only the `httpOnly` Better Auth session cookie (inaccessible to JavaScript entirely, eliminating XSS-based cookie theft as a token-exfiltration path) and non-sensitive `localStorage` data (Section 9.8 — UI preferences, guest cart before authentication). No access token, refresh token, or personally sensitive data is ever written to `localStorage` or `sessionStorage`, which are both readable by any script running on the page and therefore treated as inherently untrusted storage for anything security-sensitive.

### 21.5 Client Validation

Client-side Zod validation (Section 11.2) is explicitly a **UX layer, not a security boundary** — every mutation is re-validated server-side (by the backend API, per `09-api-architecture.md` Section 2.3's 422 model) regardless of what the client already checked, since client-side validation code is fully visible and bypassable by any user with browser developer tools. This distinction is stated explicitly in `packages/utils/validation`'s documentation so no engineer mistakes client validation for a genuine security control.

### 21.6 The Defense-in-Depth Principle (Cross-Referenced)

Repeated deliberately from Sections 6.6, 12.5, 12.6: every frontend-level access/permission check (route redirects, hidden navigation items, disabled buttons) is a **UX convenience**, never the system's actual security boundary. The authoritative enforcement is always server-side — the backend API's own authentication and RBAC checks (`09-api-architecture.md` Section 2.3, `08-database-design.md` Section 6's Authorization Domain). This principle is significant enough to warrant restating here as a security-specific rule: a frontend engineer should never reason "this is safe because the UI doesn't expose it" — the UI not exposing an action is about not confusing or tempting a user into attempting something they'd be rejected for; it is never load-bearing for actual data protection.

### 21.7 File Upload Security

Direct-to-R2 uploads (Section 11.4) use short-lived, narrowly-scoped pre-signed URLs (requested per-upload from a Route Handler that first validates the requesting user's permission to upload to that specific context — e.g., only to their own storefront's media library) — the pre-signed URL itself constrains allowed file size and MIME type at the storage layer, so even a maliciously crafted direct upload request can't exceed the constraints the Route Handler authorized. Uploaded images are additionally validated (dimensions, format, and a basic content-safety check per `01-product-requirements.md` Section 7.18's fraud/abuse-screening requirement) server-side after upload, before being surfaced anywhere publicly.

### 21.8 Content Security Policy

Each app's `next.config.ts` sets a strict Content Security Policy header, allow-listing only the specific origins required (the app's own origin, Cloudflare R2 for images, and the specific, named domains for Sentry/PostHog, Section 23) — `unsafe-inline` and `unsafe-eval` are avoided for script-src wherever Next.js's build output allows (using nonce-based CSP for any framework-required inline scripts), since a permissive CSP substantially weakens the XSS defenses described in Section 21.1 even when React's escaping is correctly applied everywhere else.

---

# 22. Testing Strategy

### 22.1 Unit Testing

Pure functions in `packages/utils` (money formatting, date conversion, validation schema logic) and `packages/api-client`'s response-parsing/error-normalization logic (Section 10.9) are covered by unit tests (Vitest, the standard modern choice for a Next.js/TypeScript codebase) with a high bar for coverage specifically because these functions are shared across all three apps — a bug here has the widest possible blast radius in the codebase, which is exactly why it receives the most rigorous, fastest-feedback-loop test coverage.

### 22.2 Component Testing

`packages/ui` components are tested via React Testing Library, asserting on rendered accessibility tree and behavior (keyboard interaction, state transitions) rather than implementation detail — a test verifies "pressing Enter on a focused Select option selects it and closes the dropdown," never "the internal `isOpen` state variable becomes false." This is deliberate: implementation-detail-coupled tests break on every internal refactor even when behavior is unchanged, which trains engineers to avoid or delete tests rather than trust them.

### 22.3 Integration Testing

Feature-level tests (e.g., "adding a product with required customization fields to the cart blocks until required fields are complete," directly testing the behavior specified in `01-product-requirements.md` CUST-01) run against a mocked API layer (via MSW — Mock Service Worker — intercepting the same `packages/api-client` calls the real app makes, so the mock boundary is at the network layer, not a hand-rolled fake of the client itself) to verify multi-component feature flows without the cost and flakiness of a full end-to-end browser test.

### 22.4 Visual Regression Testing

`packages/ui` components are captured via Storybook (or an equivalent component-explorer tool) with automated visual snapshot testing (e.g., Chromatic or a Percy-equivalent) on every PR touching `packages/ui`, catching unintended visual drift from the `06-design-system.md` specification before it ships — this is the primary enforcement mechanism for the "no arbitrary values" design-system rule (Section 13.2) at the actual rendered-pixel level, complementing the token-usage lint rule.

### 22.5 Accessibility Testing

Automated: `axe-core` (via `@axe-core/playwright` or equivalent) runs against every significant route in CI (Section 22.7), failing the build on any WCAG 2.2 AA violation with zero tolerance for regressions (an existing, accepted exception requires an explicit, documented waiver, never a silent skip). Manual: screen reader spot-checks (Section 15.5) are a required checklist item (Section 27) before any genuinely new interaction pattern ships, since automated tooling — as `05-design-principles.md` Section 20.4 notes — catches structural issues but not experiential coherence.

### 22.6 End-to-End (E2E) Testing

Playwright covers the platform's Critical-priority journeys as classified in `03-user-journeys.md` Section 12 (Checkout, Payment, Creator Registration/Verification, Order Fulfillment, Multi-Creator Checkout, Inventory Conflict, Price Change) end-to-end against a real staging environment and real (sandboxed/test-mode) backend integration — these are the flows where a regression has the highest business cost, so they receive the highest-fidelity (and highest-cost-to-run) test coverage, while High/Medium/Low priority journeys rely more heavily on the faster integration-test layer (Section 22.3). E2E tests additionally run against multiple viewport sizes (mobile/tablet/desktop, Section 14.1's breakpoints) for the Buyer app specifically, given its mobile-first, multi-device-critical usage pattern.

### 22.7 Performance Testing

CI runs Lighthouse CI against the Buyer app's Critical-priority routes on every PR, failing the build if a change regresses the Section 16.1 Core Web Vitals budget beyond a defined tolerance — this is the automated enforcement layer behind Section 16.2's bundle-budget discipline, catching a performance regression at PR time rather than discovering it weeks later in production monitoring (Section 23).

---

# 23. Monitoring

### 23.1 Sentry — Error Reporting

Sentry (per the finalized stack) is integrated into all three apps, capturing every uncaught error boundary invocation (Section 18.1), every normalized `ApiError` (Section 10.9) above a defined severity threshold, and every Server Action/Route Handler failure. Every captured error is tagged with the request's Correlation ID (`09-api-architecture.md` Section 2.18), so a Sentry error and the corresponding backend log entry for the same failed request can be joined in seconds during an incident — this cross-referencing is precisely why Section 10.1's BFF layer propagates correlation IDs consistently rather than treating them as an optional nicety.

### 23.2 PostHog — Product Analytics

PostHog (per the finalized stack) captures the buyer- and creator-facing product analytics events that feed the KPIs defined in `01-product-requirements.md` Section 10 and `00-project-vision.md` Section 14 (checkout completion rate, drop-off by step, search-to-purchase conversion) — events are defined in a single, versioned event schema (`packages/utils/analytics`) so that "what counts as a checkout-step-completed event" is defined once and consistently fired from every place it's relevant, rather than redefined ad hoc per feature with subtly inconsistent semantics that would corrupt the resulting funnel data.

### 23.3 Frontend Logging

Structured, leveled logging (not `console.log`) is used for anything warranting a durable record short of a full Sentry error — significant state transitions in complex flows (Checkout step progression, Creator Registration step completion) log a breadcrumb-level event visible in Sentry's session replay/breadcrumb trail even when no error ultimately occurs, which is frequently what makes a *user-reported* ("I tried to check out and it didn't work") issue debuggable after the fact, since the user's own description is rarely precise enough to reproduce the exact failure alone.

### 23.4 Error Reporting Triage

Sentry alerts are configured with severity-based routing (matching the platform's operational severity framework, `01-product-requirements.md` Section 7.19's pattern applied to engineering incidents): a spike in Checkout or Payment errors pages the on-call engineer immediately; a new, low-frequency error in a Low-priority journey (per `03-user-journeys.md` Section 12) is triaged during normal working hours — this priority mapping directly reuses the same journey-priority classification already established in the UX documentation, rather than inventing a separate, disconnected incident-severity taxonomy.

### 23.5 User Analytics

Beyond conversion funnels (23.2), PostHog session replay (feature-flagged, and explicitly excluding Checkout/Payment screens and any field containing personal/payment data via PostHog's input-masking configuration, per Section 21's security posture) is used narrowly for qualitative UX investigation — understanding *why* a specific screen underperforms its funnel target, a question aggregate analytics alone cannot answer.

### 23.6 Performance Monitoring

Vercel Speed Insights (real-user Core Web Vitals collection, integrated at the platform level given the Vercel deployment target) is the system of record for the Section 16.1 performance budget in production, cross-referenced against Lighthouse CI's synthetic pre-merge checks (Section 22.7) — synthetic testing catches regressions before merge; real-user monitoring confirms the budget is actually being met for real traffic, since lab conditions never perfectly predict real-world device/network diversity.

---

# 24. Coding Standards

### 24.1 Folder Conventions

Fully specified in Section 4 — every new feature, component, and utility has an unambiguous, singular correct location, verified in code review against Sections 4.1–4.5 specifically for any PR introducing a new top-level folder or a cross-feature import.

### 24.2 Component Conventions

- One component per file; the file name matches the exported component name exactly (Section 4.4).
- Props are always explicitly typed via a named `interface` or `type` (never inferred implicitly from usage, and never `any`).
- A component's props type is named `{ComponentName}Props`, colocated in the same file for a component with no other consumers, or in a matching `.types.ts` file when the type is genuinely shared.
- Every component exported from `packages/ui` has a colocated Storybook story (Section 22.4) as a build-blocking requirement, not an optional nicety.

### 24.3 Hooks Conventions

- Every custom hook begins with `use` (enforced by the `eslint-plugin-react-hooks` rule set, extended with project-specific custom hooks rules).
- A hook that wraps a TanStack Query call is named for the *data it returns*, not the technical mechanism (`useProduct(id)`, not `useProductQuery(id)`) — this keeps consuming code readable and insulates it from a future underlying data-fetching library change.
- Hooks with side effects (`useEffect`-based) document, in an adjacent comment, exactly what external system they synchronize with — an unexplained `useEffect` is treated as a code smell warranting justification in review, per the general React guidance that most `useEffect` usage in a Server-Components-first architecture indicates state or data-flow that should be reconsidered (Section 9's ownership model).

### 24.4 TypeScript Standards

- `strict` mode is enabled platform-wide, with no per-file `// @ts-nocheck` or `any` escape hatches permitted without an explicit, reviewed, comment-justified exception.
- Domain types (`packages/types/domain`) are structured to mirror `08-database-design.md`'s entity definitions field-for-field, so a frontend engineer reading a `Product` type sees the same shape a backend engineer sees reading the database schema — eliminating an entire class of "what does this field actually mean" cross-team friction.
- API response types (`packages/types/api`) mirror `09-api-architecture.md`'s documented response shapes exactly, ideally **generated** from the API's own OpenAPI/schema definition where the backend team publishes one, rather than hand-transcribed and left to drift — this generation pipeline is called out explicitly as a near-term investment priority (Section 25.4) given how much downstream type-safety depends on it staying accurate.

### 24.5 Import Rules

- Absolute imports (`@dreams/ui`, `@dreams/api-client`) are used for all cross-package imports; relative imports (`../../../`) are reserved for within-feature, colocated files only, enforced by an ESLint import-path rule.
- Feature-boundary enforcement (Section 4.3): an ESLint custom rule (or `eslint-plugin-boundaries`) prevents any import reaching past a feature's `index.ts` public export surface from outside that feature.
- Circular imports are build-blocking (Turborepo's dependency graph plus an ESLint circular-dependency rule), since a monorepo with several interdependent packages is exactly the environment where circular dependencies silently creep in without active prevention.

### 24.6 Naming Conventions

Fully specified in Section 4.4, extended with: boolean variables/props use `is`/`has`/`can` prefixes (mirroring `09-api-architecture.md` Section 2.1's identical API-field convention, so the naming vocabulary is consistent from database through API through UI props); event handler props are named `on{Event}` (`onSubmit`, `onQuantityChange`), matching native DOM/React convention exactly rather than inventing project-specific alternatives.

### 24.7 Documentation

Every `packages/ui`, `packages/api-client`, and `packages/auth` exported function/component carries a TSDoc comment explaining its purpose and, where non-obvious, *why* it exists in its current form (linking back to the relevant section of `05-design-principles.md`, `06-design-system.md`, or this document where applicable) — feature-level code within an app's `features/` folder is documented more lightly (self-documenting via clear naming and this document's conventions), reserving the heavier documentation investment for the shared, cross-team-consumed surface where the cost of ambiguity is highest.

---

# 25. Scalability Strategy

### 25.1 Feature Modules

The feature-based architecture (Sections 2.3, 4.3) is the primary scalability mechanism for **team** growth: new feature teams can be added by giving them ownership of a new `features/*` folder with a clear, enforced boundary (Section 24.5), without needing to understand or risk destabilizing the rest of the app — this is what allows the frontend engineering org to grow past a size where every engineer can hold the entire codebase in their head, which `00-project-vision.md` Section 21.3 explicitly identifies as a real organizational risk.

### 25.2 Code Ownership

Fully specified in Section 4.6 — CODEOWNERS-enforced, so PR review routing scales automatically as the team grows, without relying on tribal knowledge of "who should review this."

### 25.3 Reusable Packages

The `packages/*` structure (Section 4.2) is designed so that any package can, in principle, be extracted to its own versioned, independently-publishable npm package later (e.g., if `packages/ui` were ever needed by a future, separately-repoed native app shell, Section 25.6) without restructuring — each package already has its own `package.json`, its own clear public API surface, and no hidden cross-package coupling beyond its declared dependencies.

### 25.4 Monorepo Readiness — Already Realized, With a Near-Term Investment Flagged

The monorepo structure (Section 3.3) is not a future aspiration in this architecture — it is the actual v2 structure, chosen specifically because it gives the shared-code benefits of a monorepo (one `packages/ui`, one `packages/api-client`) while the three apps remain small enough that operational overhead stays low. The near-term investment flagged in Section 24.4 — generating `packages/types/api` from a real backend schema definition rather than hand-transcribing it — is the most valuable scalability investment specifically because manual type transcription is the first thing to silently drift as both frontend and backend teams grow and ship independently; this should be prioritized before the API surface (`09-api-architecture.md`) grows significantly larger than it is today.

### 25.5 Design System Evolution

`packages/ui`'s governance model (Section 13.7) is the scalability mechanism for **design consistency** specifically: as more engineers (and potentially, eventually, external contributors) touch the UI layer, the requirement that every component trace back to a documented `06-design-system.md` entry is what prevents the natural entropy of many hands touching a shared visual language — this is checked in PR review (Section 27) as rigorously as any functional requirement, not treated as a lower-priority "polish" concern.

### 25.6 Future Native Apps

If native iOS/Android apps are pursued (per `00-project-vision.md` Section 21 flagging native apps as a considered-but-deferred v2 scope decision), this architecture's separation of `packages/api-client` (a pure, framework-agnostic-by-design TypeScript API layer) and `packages/ui` (React-specific, and therefore *not* directly reusable in a native context) means the API contract and business-logic layer would transfer largely as-is to a React Native implementation (which can reuse `packages/api-client`, `packages/types`, `packages/utils`, and `packages/auth`'s non-DOM logic), while only the presentation layer (`packages/ui`) would need a genuinely native-specific reimplementation — this is a substantially smaller lift than a from-scratch native rebuild, and is a direct, deliberate payoff of Section 9's strict state-ownership separation (server/business state is never entangled with React-DOM-specific presentation code).

### 25.7 Future Desktop Apps

Should a desktop-installed variant of the Creator Dashboard or `apps/internal` ever be warranted (e.g., for offline-capable, high-frequency internal tooling), the same `apps/creator`/`apps/internal` Next.js codebases are wrappable via Tauri or an equivalent lightweight desktop-shell technology with minimal modification, since they are already standard web applications with no browser-specific assumptions baked in beyond what any modern web app requires — this is noted as a theoretical option, not a committed roadmap item, and is deliberately not over-engineered for in the current architecture beyond simply not *precluding* it.

---

# 26. Future Enhancements

Consistent with `00-project-vision.md` Section 25–26 and `01-product-requirements.md` Section 15, the following are frontend-architecture-relevant future directions — not built in v2, and each evaluated here specifically for what it would require of *this* architecture, not whether it should be built (a product decision made elsewhere).

| Enhancement | Frontend Architecture Implication |
|---|---|
| **AI-Powered UI** (search, recommendations, creator assistance) | Would consume the existing `packages/api-client` pattern against new AI-backed endpoints; UI would render AI-suggested content through visually distinguished components (per `06-design-system.md` Section 32's transparency requirement) — additive to Section 8's component hierarchy, not a new architectural layer. |
| **Voice Search** | Would extend the existing Search feature module (`features/search`) with a Web Speech API-backed input mode feeding the same query pipeline (Section 10) — the search *results* architecture is unaffected; only the query-input mechanism gains a new modality. |
| **AR Preview** | Would extend the Image Viewer component (Section 6.4, `06-design-system.md` Section 32) with a WebXR-backed mode, dynamically imported (Section 16.3) given its substantial, niche-use bundle weight — never part of the Buyer app's critical-path bundle. |
| **Advanced Personalization** | Would extend Section 9.11's prefetching/recommendation logic with richer signals; architecturally, this is a data-layer enhancement (new query parameters, new cached resource types) rather than a new state-management or rendering paradigm. |
| **Offline Ordering** | Would extend Section 17.4's Background Sync scope to include order placement — a deliberate, currently-excluded case given payment's consequential nature (Section 17.4) — requiring a dedicated product and risk review before revisiting that exclusion, not a purely technical decision. |
| **Real-Time Collaboration** (e.g., Creator Team Members co-editing a listing) | Would require a WebSocket or equivalent real-time transport layer not currently in the architecture (`09-api-architecture.md` Section 1.9 flags this same gap at the API layer) — the single largest genuinely new piece of infrastructure among these future enhancements, and one that should be scoped jointly with the backend architecture decision referenced there. |
| **Micro-Frontends** | **Not recommended, and only justified if** a specific future team-scaling pain point emerges that Section 25.1's feature-module boundaries within a single app can no longer address — e.g., a genuinely independent product line requiring its own deploy cadence at a scale where even the three-app split (Section 3.2) becomes limiting. Introduced prematurely, micro-frontends add substantial runtime and tooling complexity (shared dependency versioning, cross-app state, inconsistent performance characteristics) that this architecture's monorepo-with-shared-packages approach (Section 25.4) already solves more simply at Dreams by Kalakaaar's current and near-future scale. |

---

# 27. Architecture Review Checklist

Every significant PR — and every new feature at the design stage — is evaluated against this checklist, extending `05-design-principles.md` Section 19 and `06-design-system.md` Section 31 with frontend-architecture-specific criteria.

### Performance
- [ ] Does this stay within the route's JS bundle budget (Section 16.2)?
- [ ] Are Client Component boundaries pushed as far down the tree as possible (Section 7.8)?
- [ ] Are images served via `next/image` with explicit dimensions (Section 16.5)?
- [ ] Is the correct rendering strategy applied per the Section 7.10 decision matrix?

### Accessibility
- [ ] Does this meet WCAG 2.2 AA (Section 15.1)? Has axe-core run clean in CI (Section 22.5)?
- [ ] Is keyboard operability and focus management verified (Section 15.2–15.3)?
- [ ] Does any new animation respect reduced motion via the shared hook (Section 19.5)?

### Maintainability
- [ ] Is this code in its correct feature/package location per Section 4?
- [ ] Does it reuse an existing `packages/ui` component/pattern rather than duplicating one (Section 2.6)?
- [ ] Are state ownership rules (Section 9.1) respected — no server data in Zustand, no UI-only state in TanStack Query?

### Scalability
- [ ] Does this respect feature-boundary import rules (Section 24.5)?
- [ ] Would this still make sense at 10x the current traffic/catalog size (Section 25)?

### Security
- [ ] Does any new mutation re-validate server-side, not rely solely on client validation (Section 21.5)?
- [ ] Does this avoid introducing any path where a Bearer token or sensitive data could reach the client (Section 21.3–21.4)?
- [ ] Is any new frontend permission check clearly a UX layer, with the real enforcement confirmed server-side (Section 21.6)?

### Consistency
- [ ] Does this use only documented design tokens (Section 13.2) — no arbitrary values?
- [ ] Does naming follow Section 24.6's conventions?

### Developer Experience
- [ ] Is this fully typed, with no `any` escape hatches (Section 24.4)?
- [ ] Is there adequate test coverage at the appropriate layer (Section 22)?
- [ ] Is documentation present where this document requires it (Section 24.7)?

### Production Readiness
- [ ] Are loading, empty, and error states all explicitly handled (Sections 6.5–6.6, 18)?
- [ ] Is monitoring/error reporting correctly instrumented for any new critical flow (Section 23)?
- [ ] Has this been verified across the required breakpoints (Section 14.1) and, for Buyer-app changes, offline behavior (Section 17.3)?

---

*This document is the frontend engineering constitution of Dreams by Kalakaaar v2. Every application, component, and line of frontend code — today and years from now — should be traceable to a decision and its reasoning in this document. Where a new situation genuinely isn't covered here, that gap should be resolved deliberately, documented, and added — never decided silently in a single PR.*
