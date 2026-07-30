<div align="center">

# 🏺 Dreams by Kalakaaar

**A premium marketplace for handmade, personalized, and creator-driven products.**

*Verified makers. Authentic craft. Gifting done right.*

[![Status](https://img.shields.io/badge/status-in--development-blue)](#-project-status)
[![Docs](https://img.shields.io/badge/docs-00--20-informational)](#-documentation-index)
[![License](https://img.shields.io/badge/license-proprietary-lightgrey)](#-license)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](#-technology-stack)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](#-technology-stack)

[Documentation](#-documentation-index) · [Tech Stack](#-technology-stack) · [Repo Structure](#-repository-structure) · [Contributing](#-contributing) · [Philosophy](#-development-philosophy)

</div>

---

## 📖 Project Introduction

**Dreams by Kalakaaar** is a curated, two-sided marketplace connecting independent artisans and creators ("Kalakaars") with buyers seeking meaningful, handmade, and personalized products — the kind of purchase people make for a wedding, a housewarming, an anniversary, or simply because a piece of craft genuinely moved them.

Where generic marketplaces optimize for volume and price, Dreams by Kalakaaar optimizes for **trust, craftsmanship, and story**. Every creator is verified. Every listing discloses whether it's handmade or made-to-order. Every buyer gets a premium, calm, trustworthy experience — from discovery through checkout through the moment a gift is unwrapped.

### Vision

> To become the world's most trusted home for handmade and personalized craftsmanship — a place where every purchase carries a story, a maker, and a moment of intention.

### Mission

> To give independent artisans a beautiful, professional, and fair platform to turn their craft into a sustainable livelihood, while giving buyers a delightful, trustworthy way to discover and commission products that mass retail cannot offer.

### Who It's For

| Audience | What They Get |
|---|---|
| 🎁 **Meaningful Gift Buyers** | A curated, trustworthy place to find something that actually means something — with customization, gifting flows, and honest delivery timelines built in. |
| 🌿 **Conscious Shoppers** | Verified authenticity, transparent maker stories, and confidence their money genuinely supports the person who made what they bought. |
| 🎨 **Design Collectors** | A premium, editorial browsing experience worthy of the craftsmanship it showcases. |
| 🧵 **Independent Artisans & Creators** | A professional storefront, an operational toolkit, and a fair path to sustainable income — without needing to become a marketer or a developer. |
| 🏢 **Internal Teams** (Admin, Moderator, Support) | Purpose-built internal tools held to the same design and engineering quality bar as the customer-facing product. |

### Key Features

- 🔍 **Curated discovery** — categories, editorial collections, occasion & festival pages, and relevance-ranked search
- 🧑‍🎨 **Verified creator storefronts** — brand-led, story-first, not a generic listing page
- 🎁 **Native gifting support** — gift notes, recipient-different-from-buyer, personalization at checkout
- ✏️ **Deep customization** — buyer-submitted personalization on made-to-order products, with structured creator clarification flows
- 🛒 **Multi-creator checkout** — one cart, one payment, independently tracked sub-orders per creator
- 💳 **Trustworthy payments** — Razorpay-powered, PCI-scope-minimized, fully auditable
- ⭐ **Verified-purchase reviews** — no fake reviews, no pay-for-placement
- 📊 **Creator tools** — orders, inventory, analytics, payouts, and team management in one dashboard
- 🛡️ **Full trust & safety tooling** — moderation, support, and admin operations built to the same UX bar as the storefront

### Long-Term Goals

Dreams by Kalakaaar aims to become the definitive destination for meaningful gifting globally — expanding into wholesale, corporate gifting, gift registries, creator education, and AI-assisted discovery, while never compromising the platform's founding promise: **structural trust and design discipline are the product**, not just the goods sold on top of it.

---

## 🛠️ Technology Stack

Every technology below is a **finalized, settled decision** — see [`11-frontend-architecture.md`](./docs/11-frontend-architecture.md), [`10-backend-architecture.md`](./docs/10-backend-architecture.md), and [`14-infrastructure-devops-architecture.md`](./docs/14-infrastructure-devops-architecture.md) for the full reasoning behind each choice.

<table>
<tr><td width="140"><b>🖥️ Frontend</b></td><td>

**Next.js 15** (App Router) · **React 19** · **TypeScript** (strict mode) · **Tailwind CSS** · **shadcn/ui** + **Radix UI** · **Framer Motion** · **Lucide Icons** · **React Hook Form** + **Zod** · **TanStack Query** (server state) · **Zustand** (client UI state)

Three deployable apps in one monorepo: `apps/buyer` (PWA), `apps/creator`, `apps/internal` (Admin + Moderator + Support).

</td></tr>
<tr><td><b>⚙️ Backend</b></td><td>

**Next.js Route Handlers** & **Server Actions** as a Backend-for-Frontend layer · **Drizzle ORM** · A modular monolith organized by business domain (Products, Orders, Payments, Creators, Moderation, Support, and more)

</td></tr>
<tr><td><b>🗄️ Database</b></td><td>

**PostgreSQL** via **Supabase** — connection-pooled, Row-Level-Security-enforced, point-in-time recovery enabled

</td></tr>
<tr><td><b>🔐 Authentication</b></td><td>

**Better Auth** — short-lived JWT access tokens, rotating `HttpOnly` refresh tokens, OAuth (Google/Apple), MFA-ready

</td></tr>
<tr><td><b>💳 Payments</b></td><td>

**Razorpay** — hosted payment fields (the platform never touches raw card data), server-verified, webhook-signature-protected

</td></tr>
<tr><td><b>⚡ Caching</b></td><td>

**Upstash Redis** — response caching, rate limiting, session-revocation, all HTTP/serverless-native

</td></tr>
<tr><td><b>📦 Storage</b></td><td>

**Cloudflare R2** — zero-egress-fee object storage for product and creator media, direct-to-bucket signed uploads

</td></tr>
<tr><td><b>🔄 Background Jobs</b></td><td>

**Inngest** — durable, retryable orchestration for notifications, search indexing, media processing, payouts, analytics, and cleanup

</td></tr>
<tr><td><b>📧 Email</b></td><td>

**Resend** — transactional email delivery

</td></tr>
<tr><td><b>📈 Monitoring</b></td><td>

**Sentry** (errors) · **OpenTelemetry** (distributed tracing, logs, metrics) · **PostHog** (product analytics) · **Vercel Speed Insights** (real-user Core Web Vitals)

</td></tr>
<tr><td><b>☁️ Deployment</b></td><td>

**Vercel** — three independent projects (Buyer/Creator/Internal), zero-downtime immutable deployments, instant rollback

</td></tr>
</table>

---

## 📁 Repository Structure

Dreams by Kalakaaar is a **Turborepo-managed monorepo**. Every app shares a common set of internal packages, so the design system, API client, auth integration, and type definitions are each defined exactly once.

```
dreams-by-kalakaaar/
├── apps/
│   ├── buyer/           # Public marketplace + buyer account. PWA-enabled, mobile-first.
│   ├── creator/         # Creator Dashboard — storefront, orders, inventory, payouts.
│   └── internal/        # Admin + Moderator + Support, unified via role-gated route groups.
│
├── packages/
│   ├── ui/              # The design system, implemented — shadcn/ui-based components.
│   ├── config/          # Shared ESLint, TypeScript, and Tailwind configuration.
│   ├── types/           # Shared TypeScript types (API shapes, domain entities).
│   ├── api-client/      # Typed REST client + TanStack Query hooks used by every app.
│   ├── auth/             # Shared Better Auth integration and permission guards.
│   └── utils/            # Shared, pure utilities (money formatting, dates, validation).
│
├── docs/                 # ← You are here. The full architecture & process documentation set.
│
├── turbo.json
├── package.json
└── tsconfig.base.json
```

> **📌 Where does my code go?** See [`15-engineering-standards.md`](./docs/15-engineering-standards.md) Section 5 for the complete decision table — every kind of change has one correct home.

---

## 📚 Documentation Index

Every product, design, and engineering decision behind Dreams by Kalakaaar is documented — in order, each building on the ones before it. **Read in sequence if you're new; jump directly to the relevant document if you already know what you're looking for.**

| # | Document | Purpose | Audience |
|---|---|---|---|
| 00 | [Project Vision](./docs/00-project-vision.md) | Mission, vision, target audience, business goals, brand personality | Everyone |
| 01 | [Product Requirements](./docs/01-product-requirements.md) | Every functional module, requirement, role, and business rule | Product, Engineering, QA |
| 02 | [User Personas](./docs/02-user-personas.md) | Detailed buyer, creator, and internal-role personas | Product, Design, UX Research |
| 03 | [User Journeys](./docs/03-user-journeys.md) | Every end-to-end flow, happy path through failure/recovery | Product, Design, Engineering, QA |
| 04 | [Information Architecture](./docs/04-information-architecture.md) | Sitemap, navigation, taxonomy, search & filter structure | Design, Engineering, SEO, Content |
| 05 | [Design Principles](./docs/05-design-principles.md) | The design philosophy — *why* the product looks and feels the way it does | Design, Product, Engineering |
| 06 | [Design System](./docs/06-design-system.md) | Tokens, color, typography, components — the design language, made concrete | Design, Frontend Engineering |
| 07 | [UI Screens & Wireframes](./docs/07-ui-screens-wireframes.md) | Every screen's layout, states, and navigation, screen by screen | Design, Frontend Engineering, QA |
| 08 | [Database Design](./docs/08-database-design.md) | The complete data model, entities, relationships, and constraints | Backend Engineering |
| 09 | [API Architecture](./docs/09-api-architecture.md) | The REST contract — endpoints, auth, errors, pagination, versioning | Backend & Frontend Engineering |
| 10 | [Backend Architecture](./docs/10-backend-architecture.md) | Module structure, layered architecture, integrations, background jobs | Backend Engineering |
| 11 | [Frontend Architecture](./docs/11-frontend-architecture.md) | App structure, rendering strategy, state management, PWA | Frontend Engineering |
| 12 | [Security Architecture](./docs/12-security-architecture.md) | Threat model, authZ/authN, encryption, privacy, incident response | Everyone, especially Security & Backend |
| 13 | [Testing Strategy & QA](./docs/13-testing-strategy.md) | The full test pyramid, quality gates, release readiness | Everyone |
| 14 | [Infrastructure & DevOps](./docs/14-infrastructure-devops-architecture.md) | Environments, deployment, scaling, monitoring, disaster recovery | DevOps, Backend Engineering |
| 15 | [Engineering Standards](./docs/15-engineering-standards.md) | Coding conventions, naming, review discipline — day-to-day practice | Every engineer |
| 16 | *(reserved — see notes below)* | Accessibility & compliance architecture | Design, Frontend Engineering, QA |
| 17 | [Performance & Scalability](./docs/17-performance-scalability-architecture.md) | Performance budgets, caching, capacity planning, scaling roadmap | Everyone |
| 18 | *(reserved — see notes below)* | Analytics & integrations architecture | Product, Backend Engineering |
| 19 | *(reserved — see notes below)* | Localization & internationalization readiness | Product, Frontend Engineering |
| 20 | [Git Workflow & Contribution Guide](./docs/20-git-workflow-contribution-guide.md) | Branching, commits, PRs, reviews, releases — how we ship | Every engineer |

> **📌 Note on 16 / 18 / 19:** These document slots are reserved in the series' numbering but not yet finalized in this repository snapshot. Treat their listed titles as placeholders until published — check with Engineering Leadership before assuming their scope.

> **New to the team?** Read `00` → `05` for product/design context, then `08` → `15` for engineering architecture, then `20` before your first pull request. See [How Development Works](#-how-development-works) below.

---

## 🧭 Development Philosophy

| Principle | What It Means Here |
|---|---|
| 🏗️ **Clean Architecture** | Strict, one-directional layering (Presentation → Service → Repository on the backend; Server-first, composed components on the frontend). Business logic never leaks into the wrong layer. See `10`, `11`, `15`. |
| 🔒 **Security First** | Zero Trust, defense in depth, least privilege — by default, not by exception. Every request is authenticated and authorized on its own merits, every time. See `12`. |
| ⚡ **Performance First** | Budgets, not aspirations. Core Web Vitals, API latency, and database query performance are tracked continuously and enforced at release time. See `17`. |
| 📝 **Documentation First** | Nothing ships that isn't already described in this documentation set. If a decision isn't written down, it isn't decided. |
| ♿ **Accessibility** | WCAG 2.2 AA, platform-wide, from the first sketch — not a pre-launch audit. See `05`, `06`, `13`. |
| ✅ **Testing** | Confidence, not perfection. A calibrated, risk-proportional test pyramid catches regressions before they reach a real buyer or creator. See `13`. |
| 📈 **Scalability** | Architected for 1M+ users from day one; *provisioned* just ahead of demonstrated need, never speculatively. See `14`, `17`. |

---

## 🚧 Project Status

**Current phase:** Architecture & foundational documentation (`00`–`20` in progress) → pre-implementation.

| Phase | Status |
|---|---|
| Product vision, requirements, personas, journeys (`00`–`03`) | ✅ Complete |
| Information architecture, design principles, design system (`04`–`06`) | ✅ Complete |
| Screen-level UX specification (`07`) | 🟡 In progress |
| Data, API, backend, frontend architecture (`08`–`11`) | ✅ Complete |
| Security, testing, infrastructure, engineering standards (`12`–`15`) | ✅ Complete |
| Performance & scalability, git workflow (`17`, `20`) | ✅ Complete |
| First implementation sprint | ⏳ Upcoming |
| V2 public launch | ⏳ Upcoming |

---

## 🔁 How Development Works

```
Idea / Ticket
     │
     ▼
Feature Branch  ──►  Pull Request  ──►  Code Review  ──►  CI Gates Pass
     │                                                          │
     │                                                          ▼
     │                                                   Merge to `main`
     │                                                          │
     ▼                                                          ▼
  (fix/ branches start with a                          Staging → Manual QA
   failing regression test)                                     │
                                                                  ▼
                                                       Production Deployment
                                                       (zero-downtime, instantly
                                                        reversible)
```

Full detail — branching, commit conventions, PR templates, review standards, release and hotfix workflows — lives in [`20-git-workflow-contribution-guide.md`](./docs/20-git-workflow-contribution-guide.md).

---

## 📏 Coding Standards

All day-to-day coding conventions — naming, project organization, module boundaries, TypeScript/React/Next.js standards, error handling, state management, and the code review checklist — are defined in:

➡️ **[`15-engineering-standards.md`](./docs/15-engineering-standards.md)**

If a convention isn't documented there, it isn't a convention yet — raise it, don't invent it silently.

---

## 🌿 Branch Strategy

Dreams by Kalakaaar uses **trunk-based development**: `main` is always deployable, every change ships through a short-lived branch and a reviewed pull request, and releases and hotfixes follow their own documented, expedited-but-never-skipped paths.

➡️ Full branching model, naming conventions, and commit standards: **[`20-git-workflow-contribution-guide.md`](./docs/20-git-workflow-contribution-guide.md)**

---

## 🤖 CI/CD

Every pull request runs the full automated gate: type-checking, linting, the complete test pyramid (unit → component → integration → API/contract → E2E), visual regression, accessibility scanning, and a Lighthouse performance budget check — before merge is even possible.

➡️ Pipeline stages, quality gates, and release-readiness process: **[`13-testing-strategy.md`](./docs/13-testing-strategy.md)** and **[`14-infrastructure-devops-architecture.md`](./docs/14-infrastructure-devops-architecture.md)**

---

## 🚀 Deployment

Three independently deployed Vercel projects (`apps/buyer`, `apps/creator`, `apps/internal`), immutable builds, zero-downtime cutover, and instant rollback. Every environment — Development, Preview, Staging, Production — is fully isolated with its own data and credentials.

➡️ Full environment strategy, infrastructure topology, and disaster recovery: **[`14-infrastructure-devops-architecture.md`](./docs/14-infrastructure-devops-architecture.md)**

---

## 🤝 Contributing

Dreams by Kalakaaar is built on one core belief: **quality is everyone's responsibility, at every layer.** There is no separate team that "owns" clean code, accessibility, security, or performance — every engineer is accountable to the standards documented in `12`, `13`, `15`, and `17` on every pull request, and every reviewer is accountable for enforcing them.

Before contributing:

1. Read `00`–`05` for product and design context.
2. Read `15-engineering-standards.md` and `20-git-workflow-contribution-guide.md` in full.
3. Confirm your change has clear acceptance criteria before writing code.
4. Write tests alongside your implementation, in the same pull request.
5. Open a pull request that does **one cohesive thing** — small, reviewable, and easy to revert if needed.

> **💡 Philosophy:** Boring technology, interesting product. We favor the correct, well-understood pattern over a clever one — every time — unless the clever pattern solves a real, named problem the boring one can't.

---

## 📄 License

*Proprietary — All Rights Reserved.*
© Dreams by Kalakaaar. This repository and its contents are confidential and intended solely for authorized contributors. License terms to be finalized.

---

## 📬 Contact

For engineering questions, start with the relevant document in the [Documentation Index](#-documentation-index) above.

For anything else — `contact@dreamsbykalakaaar.com` *(placeholder — update before public release)*

---

<div align="center">

**Built with craft, for craft.**

</div>
