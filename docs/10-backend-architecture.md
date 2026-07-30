# 10 · Backend Architecture — Dreams by Kalakaaar v2

**Document owner:** Principal Software Architect / Staff Backend Engineer
**Status:** Draft for review
**Audience:** Backend Engineering, Frontend Engineering, DevOps, Security, QA, Future team members
**Last updated:** 2026
**Depends on:** 00-project-vision.md, 01-product-requirements.md, 02-user-personas.md, 03-user-journeys.md, 04-information-architecture.md, 05-design-principles.md, 06-design-system.md, 07-ui-screens-wireframes.md, 08-database-design.md, 09-api-architecture.md
**Precedes:** All implementation — route handlers, server actions, Drizzle schema, Inngest functions, deployment configuration

> **This document defines backend architecture only.** It contains no application code, no route handler bodies, no Drizzle schema definitions, no Inngest function implementations. Its purpose is to be the single reference from which the entire backend is built — every module, every request path, every background job traces back to a decision recorded here.

> ✅ **Reconciliation with 09-api-architecture.md, Section 1.9.** That document flagged an unresolved conflict between a FastAPI-based backend and this project's established Next.js/Supabase stack, and recommended the latter pending confirmation. **That confirmation has now happened.** This document finalizes the backend as **Next.js 15 (App Router) Route Handlers and Server Actions**, running on Vercel, against Supabase PostgreSQL via Drizzle ORM, with Better Auth for identity. The API *contract* defined in 09-api-architecture.md remains valid unchanged — this document describes how that contract is fulfilled. Two additional gaps 09 left open are resolved here as well: the payment processor is **Razorpay** (09 Section 11/16, and its webhook contract, Section 21, now has a concrete provider), and the search evolution path (08-database-design.md Section 24, 09 Section 7) is **PostgreSQL full-text search at launch, with Meilisearch as the documented future migration**, not an abstract "dedicated search engine."

---

# 1. Introduction

## 1.1 Purpose

This document specifies the backend architecture for Dreams by Kalakaaar v2: how the logical database design (08-database-design.md) and the API contract (09-api-architecture.md) are actually realized as a running system — what runs where, how a request moves through the system from edge to database and back, how the codebase is organized so that a team of any size can work in it without stepping on each other, and how the platform's operational concerns (security, performance, observability, scalability) are met in practice, not just in principle.

## 1.2 Scope

**In scope:** logical backend architecture, module boundaries, request lifecycle, authentication/authorization implementation strategy, data-access patterns, background job architecture, caching strategy, third-party integration patterns, error handling, observability, security architecture, performance and scalability strategy, configuration management, testing strategy, CI/CD integration, coding standards, and future evolution paths.

**Out of scope:** the API contract itself (defined authoritatively in 09-api-architecture.md — this document does not redefine endpoints, only describes how they're fulfilled), the database schema itself (defined authoritatively in 08-database-design.md — this document does not redefine entities, only describes how they're accessed), UI/frontend component architecture (07-ui-screens-wireframes.md, 06-design-system.md), infrastructure provisioning/Terraform-level detail (a future 11-infrastructure-operations.md, if warranted, would own exact resource sizing and provisioning — this document owns the *logical* architecture that infrastructure serves), and any application code.

## 1.3 Audience

Backend engineers implementing this architecture; frontend engineers who need to understand what the backend guarantees (consistency, latency, error shape) when building against it; DevOps/platform engineers responsible for deployment and operations; security reviewers; and future engineers onboarding who need the reasoning, not just the file tree.

## 1.4 Objectives

1. Translate 08-database-design.md's logical data model and 09-api-architecture.md's API contract into a concrete, buildable backend without contradicting either.
2. Define a codebase structure that scales from a small founding team to a larger engineering organization without requiring a rewrite — module boundaries today should be the seams a future team split (or future microservice extraction, Section 27) would naturally follow.
3. Make every cross-cutting concern (auth, validation, error handling, logging, rate limiting) a **shared, centrally-owned** mechanism that individual feature code opts into by convention, not one that each route reimplements — the same "one place to get it right" philosophy 09-api-architecture.md applied to authorization (its Section 22.2) is applied here to the entire request pipeline.
4. Specify a security posture that treats the backend as the single trust boundary between untrusted clients and the platform's data — no client, however privileged its role, is ever trusted to enforce its own authorization.
5. Give a credible, non-hand-wavy scalability story appropriate to a serverless-first deployment model, including the specific places (database connections, background work, real-time delivery) where "serverless" requires deliberate architecture rather than being free by default.

## 1.5 Definitions

| Term | Meaning in this document |
|---|---|
| Route Handler | A Next.js App Router `route.ts` file implementing one or more HTTP methods for a given path — the primary implementation mechanism for 09-api-architecture.md's REST endpoints. |
| Server Action | A Next.js server-side function callable directly from a React Server/Client Component without a hand-rolled `fetch` — used selectively (Section 3.5) for form-style, same-origin mutations where a dedicated REST endpoint adds no value. |
| Module | A bounded unit of backend code owning one or more of 08-database-design.md's domains (Section 5) — the backend's primary organizational unit, mapped 1:1 or many:1 onto database domains. |
| Service Layer | The module-internal layer containing business logic and orchestration, called by Route Handlers/Server Actions and calling the Repository Layer (Section 9). |
| Repository Layer | The module-internal layer containing all Drizzle ORM query code — the *only* layer permitted to import Drizzle or issue SQL (Section 10). |
| Edge Function / Serverless Function | A Vercel-deployed unit of compute executing one request (or one background-job step) — the physical execution unit this entire architecture assumes throughout (Section 1.9 reconciliation above). |

## 1.6 References

This document is written to be read alongside, and never in contradiction with, 08-database-design.md (data model) and 09-api-architecture.md (API contract). Where this document describes *how* something works, those two documents remain authoritative for *what* it is. Any apparent conflict between this document and either of those two is a bug in this document, to be corrected, not a signal that the earlier documents should silently be reinterpreted.

## 1.7 Guiding Principles

Restated and extended from 08-database-design.md Section 1.7 and 09-api-architecture.md Section 1.3, now applied at the backend-systems level:

1. **The backend is the only trust boundary.** Every client — including the Admin Panel — is untrusted input from the backend's perspective. Nothing about authorization, pricing, or inventory is ever computed client-side and merely validated server-side; it is computed server-side, full stop.
2. **Boring, explicit, and observable beats clever.** A serverless, stateless, horizontally-scaling architecture is not exotic — it succeeds by being predictable under load and easy to reason about from logs, not by being architecturally novel.
3. **Every module owns its data access.** No feature reaches across a module boundary to query another module's tables directly — cross-module data needs go through that module's Service Layer's public interface (Section 5.1, Section 9), mirroring 08-database-design.md's "every entity has one owning domain" principle at the code layer.
4. **Async by default for anything not on the critical user-facing path.** Mirrors 08-database-design.md Section 28.6 and 09-api-architecture.md Section 24.8 — this document specifies concretely *how* (Inngest, Section 12) rather than restating *that* it should happen.
5. **Idempotency and retries are load-bearing, not aspirational.** Given a serverless architecture's higher tail-latency variance and Vercel function timeout limits, safe retries (09-api-architecture.md Section 2.6) are not a nice-to-have; they are how the system stays correct under real-world network conditions.

## 1.8 Backend Philosophy

Dreams by Kalakaaar v2's backend is a **modular monolith**, not a microservice architecture, and not an undifferentiated "everything in one folder" codebase either. It is one deployable unit (a single Next.js application) internally organized into strictly-bounded modules whose boundaries mirror 08-database-design.md's 26 domains. This is a deliberate middle path:

- **Why not microservices at launch:** microservices trade code-level coupling for network-level coupling and add substantial operational overhead (service discovery, distributed tracing, cross-service transactions, independent deployment pipelines) that a lean team building a not-yet-proven product cannot productively absorb. 08-database-design.md Section 2.1 makes the same call for the database (single Postgres primary before sharding); this document makes the analogous call for the application tier.
- **Why not an undifferentiated monolith:** without enforced module boundaries, a growing codebase inevitably accumulates cross-cutting dependencies that make it progressively harder to reason about, test, or eventually extract a service from, if that's ever warranted (Section 27.6). Strict module boundaries, enforced by convention and lint tooling (Section 26), give the team microservice-style clarity of ownership without paying the operational cost until (if ever) traffic or team-scaling genuinely demands it.
- **The migration path is deliberately pre-paved.** Because each module owns its data access and communicates with other modules only through defined interfaces (Section 5.1), extracting any single module into its own service later is a mechanical, low-risk refactor — a network call replacing a function call — rather than an archaeological untangling project.

## 1.9 Non-Goals

This document explicitly does **not**:
- Re-litigate the technology stack, which is final per this document's brief and the reconciliation note above.
- Specify infrastructure-as-code, exact Vercel/Supabase resource tiers, or cost modeling.
- Define the API contract (owned by 09-api-architecture.md) or the data model (owned by 08-database-design.md).
- Prescribe a specific test framework's syntax (Section 24 defines strategy and coverage expectations, not tool-specific test code).
- Commit to microservices, GraphQL, or an event bus at launch — these are documented as future paths (Section 27), evaluated only if concrete evidence (team scale, traffic patterns, or module coupling pain) warrants them.

---

# 2. Architectural Principles

## 2.1 Documentation First

Consistent with every prior document in this series: no module, endpoint, background job, or schema change ships without first being reflected in the relevant architecture document. This is not process for its own sake — it is what has allowed 08 and 09 to be internally consistent with each other and with 00–07, and it is what will let this document stay authoritative as the team grows past the point where any one person holds the whole system in their head.

## 2.2 Security First

Security is not a section reviewed at the end (though Section 20 exists for depth) — it is a filter applied at every other section. Every module's design (Section 5), every layer of the request pipeline (Section 6), and every integration (Section 17) states its security posture as part of its core design, not as an afterthought bolted on. This mirrors 08-database-design.md's Section 29 and 09-api-architecture.md's Section 22, extended here to cover backend-implementation-specific concerns (secrets management, RLS enforcement from application code, webhook signature verification).

## 2.3 Clean Architecture (Layered, Not Dogmatic)

The backend follows a pragmatic three-layer separation per module — **Route Handler/Server Action → Service Layer → Repository Layer** (Section 3.2) — inspired by Clean Architecture's dependency-direction discipline (inner layers never depend on outer layers) without adopting its full ceremony (no separate "use case" classes per action, no forced interface-per-implementation abstraction where a module has exactly one implementation). The goal is testability and clear responsibility, not architectural purity for its own sake — a Service Layer function should be testable without spinning up an HTTP server or a real database, and that goal is achieved with three layers, not eight.

## 2.4 Modularity

Restated from Section 1.8: modules are the primary unit of ownership, testing, and (eventually, if warranted) extraction. A module's internals are free to be reorganized without affecting other modules, as long as its public interface (Section 5.1) is unchanged — the same information-hiding discipline that makes 08-database-design.md's per-domain entity design maintainable is applied to code.

## 2.5 Domain-Driven Design (Applied Pragmatically)

The backend borrows DDD's most valuable ideas — bounded contexts (modules, mapped to 08-database-design.md's domains), a ubiquitous language (the same entity/field names used in 08 and 09 are used, unchanged, in code — no translation layer renaming `SubOrder` to `OrderLineGroup` in application code for no reason), and rich domain logic living in the Service Layer rather than leaking into Route Handlers — without adopting DDD's heavier tactical patterns (Aggregates-as-a-formal-pattern, Domain Events as a mandatory architecture, a separate Domain layer distinct from Service Layer) unless a specific module's complexity earns it. Order/Payment (Sections 5, 16) are the modules most likely to eventually warrant heavier DDD tactics, given their complexity; this is noted as a targeted future refinement, not a day-one requirement across all 26 modules.

## 2.6 Single Responsibility

Applied at three granularities: a **module** owns one domain's business logic; a **Service Layer function** performs one business operation (e.g., `placeOrder`, not a combined `placeOrderAndSendNotificationAndUpdateAnalytics` — orchestration of side effects is explicit and visible, not hidden inside a single sprawling function, per Section 9.6); a **Repository function** performs one data-access operation, named for the query it runs, not the feature that happens to call it.

## 2.7 Dependency Inversion

Service Layer code depends on Repository Layer **interfaces** (TypeScript types describing what data operations are available), not on Drizzle's concrete query builder API directly — this keeps business logic testable with an in-memory or mocked repository implementation, and keeps the specific ORM (Drizzle) an implementation detail confined to one layer, consistent with 08-database-design.md's own framing of itself as "logical design" independent of "implementation."

## 2.8 Composition Over Inheritance

Shared behavior across modules (validation helpers, pagination helpers, error-throwing utilities) is provided as composable functions and shared middleware (Section 6), never as a base class every module's services must extend. TypeScript's structural typing and functional composition patterns are a better fit for this codebase's needs than a class-inheritance hierarchy, which tends to accumulate unwanted coupling between "conceptually shares some behavior" and "is actually the same kind of thing."

## 2.9 Stateless Services

Every Route Handler, Server Action, and Inngest function is stateless — no in-memory state is assumed to persist between invocations (a hard requirement of the serverless execution model, Section 1.9 reconciliation, not a stylistic preference). Anything that must persist between requests lives in Postgres (durable) or Redis (cache/ephemeral, Section 13) — never in a module-level variable that happens to survive within one warm serverless instance, since that survival is an unreliable implementation detail of the runtime, not a guarantee.

## 2.10 Horizontal Scalability

A direct consequence of statelessness (2.9): because no request depends on prior in-process state, Vercel can run an arbitrary number of concurrent function instances without coordination, and the backend's scaling story is "the platform scales the compute layer for us" for the application tier — the genuinely hard scaling problems this architecture must solve deliberately are the database (08-database-design.md Section 2.6–2.9) and background job throughput (Section 12), both addressed in their respective sections.

## 2.11 Fault Tolerance

Every external dependency call (database, Redis, R2, Razorpay, Resend, PostHog) is wrapped with an explicit timeout and a defined failure behavior (Section 17.2–17.4) — the backend never assumes a downstream dependency is always available, and a downstream outage degrades gracefully (per-dependency fallback behavior documented in Section 17) rather than cascading into a full outage of unrelated functionality (e.g., an Resend outage should not prevent order placement; it should queue the confirmation email for retry).

## 2.12 Observability

Every request and every background job execution is traceable end-to-end via the same Correlation ID convention established in 09-api-architecture.md Section 2.18, propagated through OpenTelemetry spans (Section 19) and surfaced in Sentry (Section 19.6) — observability is designed in at the architecture level (Section 6, Section 19), not added after an incident makes its absence painful.

## 2.13 Developer Experience

A backend architecture that is hard to work in produces bugs. Concretely: consistent module structure (Section 4) means a developer who has built one module already knows the shape of the next one; strict typing end-to-end (TypeScript + Zod + Drizzle's inferred types, Section 9.4) means a whole class of runtime bugs are caught at compile/validation time instead of in production; and centrally-owned cross-cutting concerns (Section 6) mean a feature developer writes business logic, not boilerplate.


---

# 3. Overall Backend Architecture

## 3.1 High-Level Architecture

Dreams by Kalakaaar v2's backend is a single Next.js 15 application deployed to Vercel, serving five distinct frontends (Buyer Web App, Creator Dashboard, Admin Panel, Moderator Panel, Support Panel — 09-api-architecture.md's stated client list) through one shared API surface (Route Handlers implementing 09-api-architecture.md's contract) plus a narrow set of Server Actions for same-origin, form-style interactions where a REST round trip adds no value (Section 3.5). All persistent state lives in Supabase PostgreSQL (08-database-design.md); all durable file/media assets live in Cloudflare R2 (Section 11); all cache and ephemeral state lives in Upstash Redis (Section 13); all deferred/asynchronous work runs through Inngest (Section 12); all real-time delivery (messaging, notifications, order status) runs through Supabase Realtime (Section 15.2).

```
                                   ┌──────────────────────────────┐
                                   │        Vercel Edge / CDN      │
                                   │  (static assets, cached GETs) │
                                   └───────────────┬────────────────┘
                                                    │
   ┌───────────────┐  ┌───────────────┐  ┌────────▼────────┐  ┌───────────────┐  ┌───────────────┐
   │ Buyer Web App │  │Creator Dashbrd│  │  Next.js App     │  │  Admin Panel  │  │Moderator/Support│
   │     (PWA)      │  │                │  │  (Route Handlers │  │               │  │     Panels      │
   └───────┬───────┘  └───────┬───────┘  │  + Server Actions)│  └───────┬───────┘  └───────┬───────┘
           │                  │          └────────┬──────────┘          │                  │
           └──────────────────┴────────────────────┼──────────────────┴──────────────────┘
                                                     │  (all requests converge here)
                        ┌────────────────────────────┼─────────────────────────────┐
                        │                            │                             │
              ┌─────────▼─────────┐        ┌─────────▼─────────┐        ┌──────────▼─────────┐
              │  Middleware Chain  │        │   Better Auth      │        │  Zod Validation     │
              │  (Section 6)       │◄──────►│   (Section 7)      │        │  (Section 9.4)      │
              └─────────┬─────────┘        └────────────────────┘        └──────────┬─────────┘
                        │                                                            │
              ┌─────────▼────────────────────────────────────────────────────────────▼─────────┐
              │                          Module Service Layer (Section 5, 9)                     │
              │   Auth · Users · Stores · Products · Orders · Payments · Messaging · … (26 total) │
              └─────────┬────────────────────────────────────────────────────────────┬─────────┘
                        │                                                            │
              ┌─────────▼─────────┐                                        ┌─────────▼─────────┐
              │ Repository Layer   │                                        │  Integration Layer │
              │ (Drizzle ORM,      │                                        │  (Section 17)       │
              │  Section 10)       │                                        │                     │
              └─────────┬─────────┘                                        └─────────┬─────────┘
                        │                                        ┌─────────────────────┼─────────────────────┐
              ┌─────────▼─────────┐                    ┌─────────▼──────┐  ┌───────────▼──────┐  ┌───────────▼──────┐
              │ Supabase PostgreSQL│                    │  Cloudflare R2  │  │     Razorpay      │  │      Resend       │
              │  (08-database-     │                    │  (Section 11)   │  │  (Section 16)     │  │  (Section 15.1)   │
              │   design.md)       │                    └─────────────────┘  └───────────────────┘  └───────────────────┘
              └─────────┬─────────┘
                        │
              ┌─────────▼─────────┐        ┌────────────────────┐        ┌────────────────────┐
              │  Upstash Redis     │        │      Inngest       │        │  Supabase Realtime │
              │  (Section 13)      │        │   (Section 12)      │        │   (Section 15.2)    │
              └────────────────────┘        └────────────────────┘        └────────────────────┘
```

## 3.2 Logical Layers

Every module (Section 5) is internally structured into exactly three layers, in strict dependency order (outer depends on inner, never the reverse):

1. **Presentation Layer** (Route Handler / Server Action) — parses and validates the incoming request (Zod, Section 9.4), calls exactly one Service Layer function, and shapes that function's return value into the HTTP response defined by 09-api-architecture.md. Contains **no business logic** — if a Route Handler contains an `if` statement deciding a business rule, that logic belongs in the Service Layer instead.
2. **Service Layer** — contains all business logic: validation beyond basic shape-checking (business rules like 08-database-design.md Section 26.5's cross-row invariants), orchestration of multiple Repository calls within a transaction, side-effect triggering (enqueuing an Inngest job, Section 9.6), and authorization decisions that require domain knowledge beyond simple RBAC (ownership checks, 09-api-architecture.md Section 22.3).
3. **Repository Layer** — the only layer that imports Drizzle or constructs SQL. Contains pure data-access functions (Section 10) with no business logic of their own — a Repository function answers "give me this data" or "persist this change," never "should this be allowed."

## 3.3 Execution Flow (Synchronous Request)

1. Request arrives at Vercel's edge, routed to the matching Next.js Route Handler.
2. The shared middleware chain (Section 6) runs: correlation ID assignment, rate-limit check, authentication (JWT verification via Better Auth), and (where applicable) coarse-grained RBAC role check.
3. The Route Handler parses and validates the request body/query against its Zod schema (Section 9.4). A validation failure short-circuits here with a `400`/`422` per 09-api-architecture.md Section 2.15's error format — the Service Layer is never invoked with malformed input.
4. The Route Handler calls one Service Layer function, passing the validated input plus the authenticated actor's identity/role context.
5. The Service Layer performs any needed ownership/business-rule checks, opens a database transaction where multiple writes must be atomic (Section 9.3), calls one or more Repository functions, and — outside the transaction, after it commits — enqueues any async side effects (Inngest jobs for notifications, search-index updates, analytics events; Section 9.6, Section 12.9).
6. The Repository Layer executes the Drizzle query/queries against Supabase Postgres, returning typed domain objects.
7. Control returns up the stack; the Route Handler shapes the Service Layer's return value into the exact response shape 09-api-architecture.md specifies and returns it.
8. Structured logging and OpenTelemetry span completion happen automatically via the middleware chain's response-finalization hook (Section 19.1), regardless of success or failure.

## 3.4 Request Lifecycle (Annotated)

```
Client Request
   │
   ▼
[Vercel Edge] ── static asset? ──► CDN cache hit, short-circuit
   │ no
   ▼
[Next.js Middleware] ── correlation ID, basic rate limit (Section 6.1, 13.6)
   │
   ▼
[Route Handler entrypoint]
   │
   ▼
[Auth Middleware] ── verify JWT (Better Auth) ──► 401 if invalid/expired
   │
   ▼
[RBAC Guard] ── coarse role check against endpoint's declared requirement ──► 403 if role insufficient
   │
   ▼
[Zod Request Validation] ──► 400/422 if malformed
   │
   ▼
[Service Layer] ── ownership check, business rules ──► 403/409/422 as applicable
   │        │
   │        ▼
   │   [Repository Layer] ── Drizzle query ──► Supabase Postgres
   │        │
   │   [Integration Layer] ── external call (Razorpay, R2, etc.) if needed (Section 17)
   │
   ▼
[Response Shaping] ── per 09-api-architecture.md contract
   │
   ▼
[Logging / Tracing Finalization] (Section 19)
   │
   ▼
Client Response
```

## 3.5 When to Use a Server Action Instead of a Route Handler

Route Handlers implementing 09-api-architecture.md's documented REST contract are the default and the overwhelming majority of backend surface area — they are what every non-first-party consumer (and, in principle, any future public API, 09-api-architecture.md Section 22.15) would call. Server Actions are used only for a narrow, explicitly-scoped set of cases: same-origin, form-centric mutations invoked directly from a Server Component's form `action` prop where introducing a REST round trip would add friction with no corresponding benefit (e.g., a simple "save draft" autosave from the Creator Dashboard's product editor, or a CMS content-editing form in the Admin Panel). **Rule:** if a piece of functionality is or could plausibly become relevant to more than one frontend, or could plausibly be needed by a future public API, it is a Route Handler, not a Server Action — Server Actions are reserved for genuinely single-surface, form-shaped interactions. Server Actions still route through the identical Service Layer as Route Handlers (Section 3.2) — the only difference is the Presentation Layer's transport mechanism; business logic, validation, and authorization are never duplicated between the two.

## 3.6 Module Interaction

Modules never import another module's Repository Layer directly — 08-database-design.md's per-domain table ownership (its Guiding Principle 2) is enforced at the code layer by making a module's Repository functions unexported (module-private) outside that module's own Service Layer. When Module A's business logic needs data owned by Module B (e.g., the Order module needing to check Product availability, owned by the Product module), Module A's Service Layer calls Module B's Service Layer's public interface — never Module B's Repository Layer, and never Module B's underlying tables directly. This mirrors 08-database-design.md Section 25.2's cross-domain reference summary, made concrete as an enforced code dependency rule (Section 26.2 documents the specific lint rule).


---

# 4. Project Structure

## 4.1 Complete Folder Hierarchy

```
dreams-by-kalakaaar/
├── src/
│   ├── app/                           # Next.js App Router — routing & presentation layer only
│   │   ├── (buyer)/                   # Buyer Web App route group (pages, layouts)
│   │   ├── (creator)/                 # Creator Dashboard route group
│   │   ├── (admin)/                   # Admin Panel route group
│   │   ├── (moderator)/               # Moderator Panel route group
│   │   ├── (support)/                 # Support Panel route group
│   │   └── api/
│   │       └── v1/                    # Route Handlers — mirrors 09-api-architecture.md's path structure 1:1
│   │           ├── auth/
│   │           ├── users/
│   │           ├── creator/
│   │           ├── stores/
│   │           ├── products/
│   │           ├── categories/
│   │           ├── collections/
│   │           ├── search/
│   │           ├── carts/
│   │           ├── checkout/
│   │           ├── orders/
│   │           ├── return-requests/
│   │           ├── refund-requests/
│   │           ├── payments/
│   │           ├── reviews/
│   │           ├── conversations/
│   │           ├── notifications/
│   │           ├── support/
│   │           ├── admin/
│   │           ├── moderation/
│   │           ├── cms/
│   │           ├── media/
│   │           ├── webhooks/
│   │           │   ├── payments/[provider]/
│   │           │   └── shipping/[carrier]/
│   │           └── jobs/[jobId]/
│   │
│   ├── modules/                        # Business logic — the heart of the backend, framework-agnostic
│   │   ├── auth/
│   │   │   ├── service.ts              # Public Service Layer interface (Section 3.2)
│   │   │   ├── repository.ts           # Module-private Drizzle queries (Section 10)
│   │   │   ├── schemas.ts              # Zod request/response schemas (Section 9.4)
│   │   │   ├── errors.ts               # Module-specific error classes (Section 18.2)
│   │   │   ├── types.ts                # Module-internal TypeScript types
│   │   │   └── __tests__/              # Unit + integration tests co-located with the module (Section 24)
│   │   ├── users/
│   │   ├── creators/
│   │   ├── stores/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── inventory/
│   │   ├── customization/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── shipping/
│   │   ├── messaging/
│   │   ├── notifications/
│   │   ├── reviews/
│   │   ├── wishlist/
│   │   ├── search/
│   │   ├── cms/
│   │   ├── moderation/
│   │   ├── support/
│   │   ├── analytics/
│   │   ├── audit/
│   │   ├── settings/
│   │   ├── media/
│   │   └── feature-flags/
│   │       # each module folder follows the identical internal shape shown for `auth/` above
│   │
│   ├── shared/                         # Cross-module infrastructure — imported BY modules, never imports FROM them
│   │   ├── db/
│   │   │   ├── schema/                 # Drizzle schema definitions, organized to mirror 08-database-design.md's domains
│   │   │   ├── client.ts               # Supabase Postgres connection/pooling setup (Section 10.7)
│   │   │   └── migrations/             # Drizzle-generated migration files
│   │   ├── auth/
│   │   │   └── better-auth.config.ts   # Better Auth configuration (Section 7)
│   │   ├── redis/
│   │   │   └── client.ts               # Upstash Redis client (Section 13)
│   │   ├── storage/
│   │   │   └── r2-client.ts            # Cloudflare R2 client (Section 11)
│   │   ├── jobs/
│   │   │   └── inngest-client.ts       # Inngest client + shared job utilities (Section 12)
│   │   ├── email/
│   │   │   └── resend-client.ts        # Resend client (Section 15.1)
│   │   ├── payments/
│   │   │   └── razorpay-client.ts      # Razorpay SDK wrapper (Section 16)
│   │   ├── realtime/
│   │   │   └── supabase-realtime.ts    # Supabase Realtime channel helpers (Section 15.2)
│   │   ├── observability/
│   │   │   ├── logger.ts               # Structured logging wrapper (Section 19.1)
│   │   │   ├── tracing.ts              # OpenTelemetry setup (Section 19.3)
│   │   │   └── sentry.ts               # Sentry initialization (Section 19.6)
│   │   ├── validation/
│   │   │   └── common-schemas.ts       # Shared Zod primitives (UUID, money, pagination — Section 9.4)
│   │   ├── errors/
│   │   │   └── base-errors.ts          # Base error classes every module extends (Section 18.2)
│   │   ├── middleware/                 # The shared middleware chain (Section 6)
│   │   │   ├── correlation-id.ts
│   │   │   ├── rate-limit.ts
│   │   │   ├── authenticate.ts
│   │   │   ├── authorize.ts
│   │   │   └── error-handler.ts
│   │   └── config/
│   │       └── env.ts                  # Typed, validated environment variable access (Section 23.1)
│   │
│   ├── jobs/                            # Inngest function definitions (Section 12), one folder per module that has jobs
│   │   ├── notifications/
│   │   ├── search-indexing/
│   │   ├── media-processing/
│   │   ├── payouts/
│   │   ├── analytics/
│   │   └── cleanup/
│   │
│   └── lib/                             # Small, genuinely generic utilities with zero domain knowledge
│       ├── money.ts                     # Minor-units/currency helpers (09-api-architecture.md Section 2.11)
│       ├── pagination.ts                # Cursor encode/decode helpers (09-api-architecture.md Section 2.7)
│       └── dates.ts                     # UTC/ISO-8601 helpers (09-api-architecture.md Section 2.12)
│
├── tests/
│   ├── e2e/                             # Playwright end-to-end tests (Section 24.4)
│   └── contract/                        # OpenAPI contract tests (Section 24.5)
│
├── openapi/
│   └── v1.yaml                          # Machine-readable contract (09-api-architecture.md Section 26.1)
│
├── drizzle.config.ts
├── inngest.config.ts
├── next.config.ts
├── .env.example
└── package.json
```

## 4.2 Purpose of Every Top-Level Folder

| Folder | Purpose |
|---|---|
| `src/app/` | Next.js routing only — pages, layouts, and Route Handlers. Route Handlers are intentionally thin (Section 3.2); this folder should never contain business logic. |
| `src/modules/` | The actual backend — one folder per 08-database-design.md domain (with a small number of pragmatic merges/splits noted in Section 4.4). This is where a new engineer spends nearly all their time. |
| `src/shared/` | Infrastructure and cross-cutting concerns every module depends on but no module owns. A one-directional dependency: `shared` never imports from `modules`. |
| `src/jobs/` | Inngest function definitions — the async counterpart to `app/api/v1/`, organized by the domain event they respond to rather than by which module triggered them, since a single Inngest function often serves multiple triggering modules (e.g., the notifications job folder handles events from Orders, Messaging, and Reviews alike). |
| `src/lib/` | Deliberately small — genuinely domain-agnostic helpers only. A function belongs here only if it would make sense in a completely unrelated project; anything with Dreams-by-Kalakaaar-specific knowledge belongs in `shared/` or a module. |
| `tests/e2e/` and `tests/contract/` | Cross-module and cross-layer tests that don't belong co-located with any single module (Section 24). |
| `openapi/` | The machine-readable companion to 09-api-architecture.md (that document's Section 26.1) — kept in this repository, versioned alongside the code that implements it, and validated in CI (Section 25.1) against actual Route Handler behavior via contract tests. |

## 4.3 Naming Conventions

- Module folders are named as plural nouns matching 08-database-design.md's domain names in kebab-case (`orders/`, not `Order/` or `order_management/`).
- Every module's internal files follow the identical fixed set of names (`service.ts`, `repository.ts`, `schemas.ts`, `errors.ts`, `types.ts`) — a developer who has worked in one module can navigate any other module without relearning its internal layout, directly serving Section 2.13's Developer Experience principle.
- Route Handler files are always `route.ts` (Next.js convention) and their folder path is the literal API path from 09-api-architecture.md, with dynamic segments in `[bracket]` notation — there is never a mismatch between "what 09 says the URL is" and "what folder the handler lives in," since the folder path *is* the URL by construction.
- Service Layer functions are named as verb phrases describing the business operation (`placeOrder`, `approveProductListing`, `issueRefund`), not CRUD-generic names (`update`, `process`) — a function name should tell a reader what business event it represents without needing to read its body.
- Repository Layer functions are named after the query they perform, prefixed by intent (`findById`, `findManyByStoreId`, `insertOne`, `updateStatus`) — deliberately CRUD-generic, since the Repository Layer's entire job is being an unopinionated data-access facade; business meaning lives one layer up.

## 4.4 Code Ownership

Each module folder has a designated owning engineer or sub-team (recorded in a `CODEOWNERS` file mapping module paths to reviewers) — mirroring 08-database-design.md's per-domain single-ownership principle applied to code review responsibility, not just data modeling. A small number of modules are pragmatically **merged** in the codebase relative to 08-database-design.md's domain list, where the database-layer separation (justified for data-modeling clarity) would produce an unnecessarily thin code module: `messaging` (database Section 15) and `notifications` (database Section 17) share a module in code, since their business logic is tightly intertwined (nearly every messaging action also triggers a notification) even though their tables remain properly separated per 08-database-design.md's domain-ownership principle at the *data* layer; similarly, `moderation` (database Section 19) and `support` (database Section 18) remain **separate** modules in code despite some workflow overlap, because their staff audiences, SLAs, and escalation paths are genuinely distinct enough to warrant independent ownership. Every such merge/split decision is deliberate and documented here rather than left as an unexplained inconsistency between this document and 08-database-design.md's domain list.


---

# 5. Domain Modules

## 5.1 The Module Contract

Every module, regardless of size, exposes exactly one **public interface**: a set of named, typed Service Layer functions exported from its `service.ts`. This is the *only* thing other modules — and Route Handlers/Server Actions — are permitted to import. A module's `repository.ts`, `errors.ts` internals, and `types.ts` internals are implementation details; only types explicitly re-exported from `service.ts` are part of the contract. This single rule is what makes Section 3.6's module-interaction discipline enforceable rather than aspirational, and it is checked mechanically (Section 26.2's lint rule), not left to code-review vigilance alone.

Each module below is described with: **Responsibility** (what business capability it owns), **Owned Entities** (its 08-database-design.md tables), **Boundaries** (what it explicitly does *not* do), and **Dependencies** (which other modules' public interfaces it calls).

## 5.2 Auth

**Responsibility:** identity, sessions, credentials — implements 09-api-architecture.md Section 3 in full, wrapping Better Auth (Section 7). **Owned Entities:** `User` (identity fields only), `AuthenticationAccount`, `Session`, `RefreshToken`, `EmailVerification`, `PhoneVerification`, `PasswordReset`, `MFA`, `Devices`, `TrustedDevices` (08-database-design.md Section 5). **Boundaries:** does not own profile content (`UserProfile` — that's the Users module) or role/permission assignment (`UserRole` — that's a shared RBAC concern, Section 8, though the *table* is read by Auth to populate JWT claims). **Dependencies:** none among other business modules — Auth is intentionally a dependency *for* nearly every other module (via the shared Authentication middleware, Section 6.3) but depends on none of them, keeping it the lowest, most stable layer of the module graph.

## 5.3 Users

**Responsibility:** buyer-side account data — profile, addresses, preferences, wishlist. Implements 09-api-architecture.md Section 4. **Owned Entities:** `UserProfile`, `BuyerProfile`, `Address`, `Wishlist`, `WishlistItem`, `SavedPaymentMethod`, `Coupons` (buyer-side), `GiftHistory`, `Preferences`, `NotificationPreferences`, `PrivacyPreferences` (08-database-design.md Sections 5.2, 11). **Boundaries:** does not perform authentication (depends on Auth for identity, never re-implements it). **Dependencies:** Auth (identity lookups), Media (avatar upload references).

## 5.4 Creators

**Responsibility:** creator application/onboarding, creator-specific identity, verification, payout-account details. Implements 09-api-architecture.md Section 5's `/v1/creator/*` paths. **Owned Entities:** `Creator`, `StoreVerification` (08-database-design.md Sections 7.1, 7.5). **Boundaries:** does not own the public storefront (`Store` itself — that's the Stores module); Creators module is specifically the *applicant/identity* side of becoming and remaining a verified maker. **Dependencies:** Auth, Users (an applicant is first a `User`), Media (verification document uploads), Stores (triggers `Store` creation on approval).

## 5.5 Stores

**Responsibility:** the public-facing storefront and its management — branding, policies, team, settings. Implements 09-api-architecture.md Section 5's `/v1/stores/*` paths. **Owned Entities:** `Store`, `StoreBranding`, `StorePolicy`, `StoreAnalytics`, `StoreTeam`, `StoreInvitation`, `StoreSettings`, `StoreSocialLinks`, `StoreFAQ`, `StoreAnnouncement` (08-database-design.md Section 7.2–7.12). **Boundaries:** does not own Products (a distinct module, related by `storeId` foreign key only) or Orders' seller-side fulfillment (Orders module owns `SubOrder`, referencing `storeId`). **Dependencies:** Creators (ownership root), Auth/Users (team membership), Media (branding assets).

## 5.6 Products

**Responsibility:** the full product-listing lifecycle — CRUD, variants, media association, customization schema, publishing workflow. Implements 09-api-architecture.md Section 6. **Owned Entities:** `Product`, `ProductVariant`, `ProductMedia`, `ProductSpecification`, `ProductDisclosure`, `ProductSEO`, `ProductAnalytics`, `ProductStatusHistory`, `ProductVersion`, `ProductDraft`, `ProductApproval`, `ProductRecommendation`, `CustomizationOption`, `CustomizationValue` (08-database-design.md Section 8). **Boundaries:** does not own stock quantity (Inventory module, related by `variantId`) or category/taxonomy definitions (Categories module owns `Category`/`Tag`/`Material`/`Technique`; Products only owns the join tables `ProductCategory`/`ProductTag`/etc., which live in this module since they're meaningless without a Product). **Dependencies:** Stores (ownership), Media, Categories (taxonomy references), Inventory (publish-readiness check), Moderation (approval workflow).

## 5.7 Categories

**Responsibility:** platform-curated taxonomy and discovery structure. Implements 09-api-architecture.md Section 6.9's read endpoints plus CMS-scoped writes (Section 5.16 below). **Owned Entities:** `Category`, `Collection`, `Occasion`, `Festival`, `GiftGuide`, `Taxonomy`, `NavigationNode`, `SEOHierarchy`, `URLMapping`, `Tag`, `Material`, `Technique` (08-database-design.md Section 10). **Boundaries:** does not apply taxonomy to Products (that's the `ProductCategory` join, owned by Products) — Categories owns only the vocabulary, not its application. **Dependencies:** Media (category/collection cover images).

## 5.8 Inventory

**Responsibility:** stock levels, reservations, availability. Implements 09-api-architecture.md Section 6.6. **Owned Entities:** `Inventory`, `InventoryTransaction`, `Reservation`, `LowStockAlert`, `AvailabilityCalendar`, `Backorder`, `ProductionCapacity` (08-database-design.md Section 9). **Boundaries:** never mutates `ProductVariant` itself (Products module owns that); Inventory is called *by* Products/Cart/Checkout for stock decisions, not the other way around. **Dependencies:** Products (variant existence check only, read-only).

## 5.9 Customization

**Responsibility:** validating buyer-supplied customization input against a product's defined schema at cart/checkout time. **Owned Entities:** none of its own beyond validation logic — reads `CustomizationOption`/`CustomizationValue` (owned by Products) and is invoked by Cart. **Boundaries:** deliberately a thin, focused module (potentially a set of exported pure functions from Products' own service rather than a fully separate module in the final implementation) — called out with its own section here because 08-database-design.md gives it deliberate entity-level separation from `ProductVariant` (Section 8.8–8.9), and this document preserves that same conceptual separation at the code layer even where the implementation is lightweight.

## 5.10 Cart

**Responsibility:** ephemeral in-progress buyer selection. Implements 09-api-architecture.md Section 8. **Owned Entities:** `Cart`, `CartItem`, `CouponApplication` (cart-scoped) (08-database-design.md Section 12.1–12.3). **Boundaries:** never creates an `Order` — Cart's terminal states are "converted" (handed off to Checkout) or "abandoned," never "completed" itself. **Dependencies:** Products (live price/availability revalidation, Section 8.1 of the API doc), Inventory (stock checks), Customization.

## 5.11 Checkout

**Responsibility:** the multi-step transition from Cart to Order — address, shipping, tax, payment initiation. Implements 09-api-architecture.md Section 9. **Owned Entities:** `CheckoutSession`, `ShippingSelection`, `PaymentIntent` (pre-completion), `OrderPreview`, `GiftMessage`, `TaxCalculation`, `DeliveryEstimate` (08-database-design.md Section 12.4–12.10). **Boundaries:** does not create the durable `Order` itself except via its final `complete` action, which is the **sole** entry point into Order creation (09-api-architecture.md Section 10.1's explicit closure of any alternate path). **Dependencies:** Cart, Inventory (reservations), Users (addresses), Shipping (methods/rates), Payments (intent creation), Orders (the one call that creates the durable record on success).

## 5.12 Orders

**Responsibility:** the durable transaction record and its full lifecycle — fulfillment, cancellation, returns, exchanges. Implements 09-api-architecture.md Section 10. **Owned Entities:** `Order`, `SubOrder`, `OrderItem`, `OrderTimeline`, `OrderStatusHistory`, `Invoice`, `OrderCommunication`, `Cancellation`, `Exchange`, `ReturnRequest`, `RefundRequest` (08-database-design.md Section 13). **Boundaries:** does not directly move money (Payments module owns `Payment`/`Refund`/`Transaction`; Orders calls Payments' interface to trigger those effects) and does not directly manage carrier tracking data beyond `Shipment`/`ShipmentTracking`, which it owns jointly with the Shipping module's rate/label concerns (Section 5.13). **Dependencies:** Checkout (creation trigger), Payments, Inventory (decrement/release), Shipping, Messaging (via `OrderCommunication`), Notifications.

## 5.13 Shipping

**Responsibility:** shipment creation, carrier integration, tracking. **Owned Entities:** `Shipment`, `ShipmentTracking` (08-database-design.md Section 13.7–13.8 — modeled here as a distinct module from Orders because carrier-integration logic, Section 17, is a materially different concern from order-lifecycle business rules, even though the two entities live conceptually within the Order domain at the database layer; this is a deliberate, documented module split narrower than the database's domain boundary, justified by the different *kind* of complexity each side carries). **Dependencies:** Orders (SubOrder context), the carrier-webhook Integration Layer (Section 17).

## 5.14 Payments

**Responsibility:** all money movement — payment capture, refunds, disputes, settlement, creator payouts, commission. Implements 09-api-architecture.md Section 11. **Owned Entities:** `Payment`, `PaymentMethod`, `Transaction`, `Settlement`, `Payout`, `Commission`, `Refund`, `Dispute`, `Ledger`, `AccountingEntry` (08-database-design.md Section 14). **Boundaries:** never decides *whether* a refund is warranted (that's Orders' `RefundRequest` approval workflow) — Payments only executes the money movement once told to, keeping the "should this happen" business decision and the "make this happen" execution cleanly separated, mirroring 08-database-design.md Section 13.10/14.7's explicit RefundRequest/Refund entity split. **Dependencies:** the Razorpay Integration Layer (Section 16), Orders (context).

## 5.15 Messaging & Notifications

**Responsibility:** buyer↔creator/support conversations and all cross-channel outbound notification delivery — merged into one code module per Section 4.4's rationale. Implements 09-api-architecture.md Sections 13–14. **Owned Entities:** `Conversation`, `Participant`, `Message`, `Attachment`, `ReadReceipt`, `ModerationFlag`, `Notification`, `NotificationTemplate`, `EmailQueue`, `SMSQueue`, `PushQueue`, `InAppNotification`, `DeliveryLog` (08-database-design.md Sections 15, 17). **Dependencies:** Media (attachments), the Resend/Supabase-Realtime Integration Layer (Section 15), virtually every other module (as an event *consumer* — Orders, Reviews, Support, Moderation all trigger notifications through this module's public interface rather than each reimplementing delivery logic).

## 5.16 Reviews

**Responsibility:** post-purchase ratings and review content. Implements 09-api-architecture.md Section 12. **Owned Entities:** `Review`, `Rating`, `MediaReview`, `CreatorReply`, `ReviewVote`, `ReviewReport`, `ReviewModeration` (08-database-design.md Section 16). **Dependencies:** Orders (purchase-eligibility check, read-only), Media, Moderation (report escalation).

## 5.17 Wishlist

**Responsibility:** buyer-curated saved-product lists — a genuinely small module, called out separately from Users despite living under `/v1/users/me/wishlists` in the API contract, because its data (`Wishlist`/`WishlistItem`) and its consumers (Product-card "is this wishlisted" checks across nearly every browsing endpoint) are distinct enough to warrant independent internal ownership even while sharing a URL namespace with Users for API ergonomics. **Dependencies:** Products (existence checks), Users (ownership).

## 5.18 Search

**Responsibility:** the `SearchIndex` read-model and all query-time ranking/filtering logic. Implements 09-api-architecture.md Section 7. **Owned Entities:** `SearchIndex`, `SearchHistory`, `TrendingSearch`, `Autocomplete`, `Synonyms`, `Filters`, `Recommendations` (search-context) (08-database-design.md Section 24). **Boundaries:** never writes to Product/Store/Category tables — strictly a downstream consumer, kept updated via Inngest jobs (Section 12.6) reacting to changes in those modules, never a synchronous write path any other module depends on for its own correctness. **Dependencies:** none for reads (self-contained); consumes events from Products, Stores, Categories for index maintenance.

## 5.19 CMS

**Responsibility:** editorial and static content — pages, banners, articles, legal documents. Implements 09-api-architecture.md Section 18. **Owned Entities:** `Page`, `Section`, `Banner`, `Announcement`, `Article`, `FAQ`, `LegalDocument`, `SEOContent`, `MediaLibrary` (08-database-design.md Section 20). **Dependencies:** Media.

## 5.20 Moderation

**Responsibility:** unified trust-and-safety case management. Implements 09-api-architecture.md Section 17. **Owned Entities:** `ModerationCase`, `Evidence`, `Decision`, `Appeal`, `Violation`, `Warning`, `Ban`, `Suspension`, `AuditTrail` (moderation-specific) (08-database-design.md Section 19). **Dependencies:** Products, Stores, Reviews, Messaging, Auth/Users (as polymorphic subjects it acts upon — Moderation calls into each of these modules' interfaces to actually execute a sanction, e.g., calling Products' `archiveProduct` rather than mutating `Product.status` directly, preserving Section 3.6's module-boundary discipline even for cross-cutting enforcement actions).

## 5.21 Support

**Responsibility:** ticketing, agent tooling, knowledge base. Implements 09-api-architecture.md Section 15. **Owned Entities:** `Ticket`, `TicketMessage`, `TicketAttachment`, `Escalation`, `RefundWorkflow`, `SupportAgent`, `KnowledgeBase`, `Macros` (08-database-design.md Section 18). **Dependencies:** Orders (context linkage), Media, Payments (via Orders, for `RefundWorkflow`).

## 5.22 Analytics

**Responsibility:** read-only, asynchronous aggregation across every other domain. Implements 09-api-architecture.md Section 19 and Section 5.11's creator-facing analytics. **Owned Entities:** `Metrics`, `Events`, `ProductViews`, `SearchAnalytics`, `SalesAnalytics`, `CreatorAnalytics`, `PlatformAnalytics`, `Experiment`, `FeatureUsage`, `DashboardSnapshots` (08-database-design.md Section 21). **Boundaries:** strictly read/aggregate-only with respect to every other module's own tables — Analytics never writes to another module's owned entities, only reads them (typically via read replicas once introduced, Section 22.3) to compute its own rollups. **Dependencies:** none synchronously; consumes events from every module asynchronously via Inngest and PostHog (Section 12, Section 19.7).

## 5.23 Audit

**Responsibility:** platform-wide accountability logging. **Owned Entities:** `AuditLog`, `Activity`, `ChangeHistory`, `SecurityEvent`, `LoginHistory`, `APIUsage`, `SystemEvent` (08-database-design.md Section 23). **Boundaries:** write-only from every other module's perspective (every module calls Audit's `record(...)` interface; only Admin-facing Route Handlers read from it, Section 5.24). This module's writes happen via the shared middleware chain (Section 6.6), not via explicit per-endpoint calls, ensuring no endpoint can accidentally ship without audit coverage (mirroring 09-api-architecture.md Section 22.14). **Dependencies:** none (a true leaf module, depended upon by everything, depending on nothing).

## 5.24 Settings & Feature Flags

**Responsibility:** platform-level configuration and feature-flag/experiment gating. Implements 09-api-architecture.md Section 16.12. **Owned Entities:** the `System`-domain configuration described in 08-database-design.md Section 3's note, plus `FeatureFlagAccess` (Section 6.6 of that document). **Dependencies:** none; consumed by every module wanting to check a flag.

## 5.25 Media

**Responsibility:** the shared upload/processing/delivery pipeline. Implements 09-api-architecture.md Section 20 in full. **Owned Entities:** `Media`, `Image`, `Video`, `Thumbnail`, `Transformation`, `StorageLocation`, `AltText`, `Metadata`, `Version` (08-database-design.md Section 22). **Dependencies:** the Cloudflare R2 Integration Layer (Section 11), Inngest (async processing, Section 12.4).

## 5.26 Future AI (Reserved Module Boundary)

Per 08-database-design.md Section 30 and 09-api-architecture.md Section 28, a future `ai` module is reserved as the eventual home for embedding generation, recommendation-model serving, and AI-assisted moderation/search-ranking — deliberately scoped as its own module from the start of this document's thinking (even though it contains no code at V2 launch) specifically so that when it does arrive, it consumes Products/Search/Reviews' public interfaces the same way every other module does, rather than being grafted in with special-cased cross-module access.


---

# 6. Request Processing Pipeline

The pipeline described here is the concrete implementation of 09-api-architecture.md Section 1.8's "consistency rules" and Section 2's platform-wide standards — every Route Handler passes through the same ordered chain of shared middleware before ever reaching module-specific logic, so cross-cutting behavior (auth, validation, logging) cannot silently diverge between endpoints.

## 6.1 Middleware Chain (Ordered)

1. **Correlation ID assignment** (`shared/middleware/correlation-id.ts`) — reads `X-Correlation-Id` if present, else generates one; attaches it to the request context for propagation through every subsequent layer, per 09-api-architecture.md Section 2.18.
2. **Rate limiting** (`shared/middleware/rate-limit.ts`) — checks the caller's current rate-limit state in Redis (Section 13.6) before any further processing; a `429` here short-circuits the entire pipeline, since it would be wasteful to authenticate/validate a request that's about to be rejected anyway.
3. **Authentication** (`shared/middleware/authenticate.ts`) — verifies the JWT (Section 7), attaching the resolved actor (User ID, roles, active store context) to the request context. Public/unauthenticated endpoints explicitly opt out of this step (a declared exception list, not a silent skip) rather than authentication being opt-in per endpoint — the default posture is "authentication required," matching 09-api-architecture.md's framing that authorization must be explicit, never absent by omission.
4. **Coarse-grained authorization (RBAC)** (`shared/middleware/authorize.ts`) — checks the resolved actor's role against the endpoint's declared minimum role requirement (Section 8.1). Fine-grained ownership checks happen later, inside the Service Layer (step 6), since they require domain knowledge the middleware layer doesn't have.
5. **Request validation** — Zod schema parsing (Section 9.4), executed at the top of the Route Handler itself rather than as generic middleware, since each endpoint's schema is necessarily endpoint-specific; documented as logically part of the pipeline even though it's not implemented as a shared middleware function.
6. **Service Layer invocation** — the Route Handler calls exactly one Service Layer function (Section 3.2), which performs fine-grained ownership/business-rule authorization internally before touching any data.
7. **Response shaping and error normalization** (`shared/middleware/error-handler.ts`) — catches any thrown error from steps 3–6 and maps it to 09-api-architecture.md Section 2.15's error envelope (Section 18.3's mapping table), ensuring no unhandled exception ever reaches the client as a raw stack trace.
8. **Logging/tracing finalization** (Section 19.1) — regardless of the outcome of steps 1–7, request duration, status code, and correlation ID are logged, and the OpenTelemetry span is closed.

## 6.2 Why a Shared Chain, Not Per-Endpoint Wiring

This chain is implemented once, centrally, and every Route Handler is wrapped by it via a shared higher-order function (e.g., a `withApiHandler(...)` wrapper each `route.ts` file uses) — never hand-assembled per endpoint. This is the single most important structural decision in this section: it makes "did we forget to add auth to this endpoint" a class of bug that is architecturally difficult to introduce, rather than a class of bug that code review must catch by vigilance every time.

## 6.3 Authentication (Pipeline Role)

Step 3 above delegates to Better Auth's session/JWT verification (Section 7) — the middleware's job is narrowly to call Better Auth's verification function and attach the result to context; it contains no authentication logic of its own, keeping Better Auth as the single source of truth for "is this credential valid" per Section 7's full treatment.

## 6.4 Authorization (Pipeline Role)

Step 4's coarse RBAC check is a fast, cheap, table-driven comparison (endpoint → required role(s), a static mapping generated from the OpenAPI spec's security annotations, 09-api-architecture.md Section 26.1) — it exists specifically to reject obviously-unauthorized requests (a Buyer calling an Admin-only endpoint) before any database work happens, as a performance and defense-in-depth measure layered in front of, not instead of, the Service Layer's fine-grained checks (Section 8).

## 6.5 Validation

Every Route Handler's first line of business-specific code is parsing `request.body`/`request.query`/route params through a Zod schema imported from that module's `schemas.ts` (Section 9.4). A validation failure throws a typed `ValidationError` (Section 18.2), caught by step 7's error handler and mapped to `400`/`422` automatically — Route Handlers never manually construct a validation-error response; they only ever throw and let the shared handler do the shaping, ensuring every validation error across the entire API has byte-for-byte identical envelope structure.

## 6.6 Business Rules

Business-rule enforcement (as distinct from shape validation) happens exclusively in the Service Layer (Section 9), never in middleware and never in the Route Handler — middleware and Route Handlers have no domain knowledge by design (Section 2.6's Single Responsibility principle), so a rule like "a Product must have at least one active variant before publishing" (08-database-design.md Section 8.1) can only ever live in the Products module's Service Layer, findable in exactly one place.

## 6.7 Database Access

Exclusively through the Repository Layer (Section 10), called only from the Service Layer — Route Handlers, middleware, and Server Actions never import Drizzle directly (enforced by the same lint rule as Section 3.6's module-boundary rule, Section 26.2).

## 6.8 Logging

Every layer of the pipeline logs through the shared structured logger (`shared/observability/logger.ts`, Section 19.1), never `console.log` — every log line automatically includes the request's correlation ID, actor ID (if authenticated), module name, and a severity level, so log aggregation and search (Section 19) works uniformly across the entire codebase without per-call-site configuration.

## 6.9 Response Generation

Route Handlers construct their success response using shared response-shaping helpers (`shared/http/respond.ts`-style utilities, implied by this document's conventions even where not spelled out file-by-file) that enforce 09-api-architecture.md Section 2.16's single-resource-vs-collection envelope distinction automatically — a Route Handler passes its Service Layer's return value and a resource type; the helper produces the correctly-shaped JSON body and status code, removing an entire class of "this endpoint's response shape doesn't quite match the spec" bugs.

## 6.10 Error Handling (Pipeline Role)

Restated and detailed fully in Section 18; noted here as the pipeline's terminal, catch-all layer — no error, of any kind, from any layer, is ever allowed to produce a response that doesn't conform to 09-api-architecture.md Section 2.15's envelope.

---

# 7. Authentication Architecture

## 7.1 Better Auth

Better Auth is the system of record for credential verification, session issuance, and OAuth provider integration, wrapping and persisting into the exact `User`/`AuthenticationAccount`/`Session`/`RefreshToken` tables 08-database-design.md Section 5 defines — Better Auth is configured to use Drizzle adapters against Supabase Postgres directly, so there is no separate "auth database" to keep in sync with the application's own data; identity lives in the same Postgres instance as everything else, queryable via the same Repository Layer conventions (Section 10) as any other module's data, with Better Auth simply being the trusted component responsible for writing to and verifying against those tables correctly.

## 7.2 Session Lifecycle

Matches 09-api-architecture.md Section 3.1 exactly: short-lived (15-minute) signed JWT access tokens returned in the response body; long-lived (30-day), rotating, `HttpOnly`/`Secure`/`SameSite=Strict` cookie-based refresh tokens. Better Auth's built-in session-rotation mechanism implements the rotation-on-use, reuse-detection behavior described in 08-database-design.md Section 5.5 — a refresh token's reuse after rotation triggers Better Auth's revocation hook, which this architecture wires to also emit a `SecurityEvent` (Section 5.23) and, for high-severity cases, an Inngest job (Section 12) that can optionally force-expire all of that user's other sessions as an automated containment response.

## 7.3 Refresh Strategy

The frontend's API client (shared across all five apps, per 09-api-architecture.md's multi-client design) wraps every request with automatic, transparent access-token refresh: on a `401 TOKEN_EXPIRED`, the client calls `POST /v1/auth/refresh` once, then retries the original request exactly once with the new token — never in an uncontrolled retry loop. This client-side contract is documented here (even though it's frontend behavior) because the backend's token-expiry design (a deliberately short 15-minute TTL) only works well in practice if every client implements this refresh behavior consistently; it is treated as part of the platform's authentication *architecture*, not left as an unstated assumption.

## 7.4 Cookies

The refresh-token cookie is scoped to the `/v1/auth` path family (not domain-wide) and set with `Secure` (HTTPS-only, no exceptions even in local development past the earliest bootstrap stage) and `SameSite=Strict`. Given the multi-app architecture (five distinct frontends, potentially on distinct subdomains), the cookie's domain scope is set to the shared parent domain (e.g., `.dreamsbykalakaaar.com`) so a single login is usable across apps without requiring five separate authentication flows — a deliberate single-sign-on-by-shared-cookie design appropriate for first-party subdomains, made possible specifically because every frontend is first-party and under the platform's own domain control.

## 7.5 CSRF

Restated from 09-api-architecture.md Section 22.6: `SameSite=Strict` on the refresh cookie is the primary mitigation. Additionally, the refresh endpoint itself performs an `Origin` header check against the known set of first-party frontend origins (Section 22.17's CORS allow-list, reused here) as defense-in-depth, rejecting refresh attempts from unexpected origins even if a `SameSite` bypass were somehow found.

## 7.6 Email Verification

Implements 09-api-architecture.md Section 3.8 — Better Auth's verification-token issuance is used, with the actual email *delivery* delegated to the Notifications module (Section 5.15) via Resend (Section 15.1), keeping "generate and validate a verification token" (an Auth concern) cleanly separated from "deliver an email" (a Notifications concern) rather than letting Better Auth's own email-sending capability be used directly, which would bypass this platform's unified notification-delivery/audit pipeline.

## 7.7 Password Reset

Implements 09-api-architecture.md Section 3.6–3.7, same Better-Auth-generates/Notifications-module-delivers split as email verification. On successful reset, the Auth module's Service Layer explicitly calls its own session-revocation function to invalidate all other active sessions (per 08-database-design.md Section 5.8's business rule) — this is Auth module-internal orchestration, not a cross-module call, since sessions are Auth's own owned entity.

## 7.8 OAuth Readiness

Better Auth's provider-plugin architecture is configured for Google and Apple OAuth (09-api-architecture.md Section 3.14) at launch-readiness even if not all providers are enabled on day one — adding a new provider is a configuration change (registering a new Better Auth plugin with its client credentials, Section 23.3) rather than new application code, directly serving 09-api-architecture.md Section 1.6's additive-non-breaking extensibility goal at the OAuth-provider-list level specifically.

## 7.9 Role Architecture

A `User`'s roles are resolved at authentication time (from `UserRole`, 08-database-design.md Section 6.4) and embedded in the issued JWT's `roles` claim (09-api-architecture.md Section 22.1) — this is a deliberate performance trade-off: role checks against the JWT claim are free (no database round trip) for the token's 15-minute lifetime, at the cost of a role change not taking effect until the user's next token refresh. For the narrow set of cases where this staleness is unacceptable (an Admin revoking a Moderator's access and needing it to take effect *immediately*, not within 15 minutes), Section 8.5 documents the explicit override mechanism.

## 7.10 Permission Model

The JWT's `roles` claim drives the pipeline's coarse RBAC check (Section 6.4); fine-grained `ResourcePermission` checks (08-database-design.md Section 6.5) are **never** embedded in the token (they're too numerous and too dynamic to be practical as claims) and are instead resolved via a direct, cached (Section 13.4) database lookup inside the Service Layer at the point of use — a deliberate two-tier permission-resolution architecture: fast/coarse from the token, precise/fine-grained from a cached database read, matching the two-tier RBAC/ABAC model 08-database-design.md Section 6.8–6.9 establishes at the data layer.


---

# 8. Authorization

## 8.1 RBAC (Implementation)

The static endpoint→role mapping consumed by the pipeline's coarse check (Section 6.4) is generated from the OpenAPI spec's per-operation security annotations (09-api-architecture.md Section 26.1) at build time, not hand-maintained separately — this guarantees the authorization middleware can never silently drift from the documented contract, since they share one source of truth. The mapping is a simple `{ method, path } → Role[]` table; any role in the array satisfies the check (an "any of" relationship, matching how 08-database-design.md Section 6's Role entity is structured — a single endpoint might be reachable by `Admin` or `Super Admin`, for instance).

## 8.2 Ownership Rules

Ownership checks (does this Creator's team include the caller, is this the buyer's own Order) are implemented as small, reusable Service-Layer-level guard functions per module (e.g., Stores' `assertStoreTeamMembership(userId, storeId)`), called explicitly at the top of every Service Layer function that operates on a specific resource instance — never assumed, never skipped because "the RBAC middleware already checked the role." Role sufficiency and ownership sufficiency are always two separate, both-required checks, directly implementing 09-api-architecture.md Section 22.3's stated two-check model.

## 8.3 Resource Permissions

`ResourcePermission` (08-database-design.md Section 6.5) grants are resolved via a dedicated Auth-module Service Layer function (`hasResourcePermission(userId, resourceType, resourceId, permissionKey)`) that any module can call for the narrow set of cases needing fine-grained, temporary, or cross-boundary access (e.g., a Support Executive escalated into a specific order). This function's result is cached briefly in Redis (Section 13.4, short TTL given the security sensitivity of stale-permission risk) rather than hitting Postgres on every call.

## 8.4 Admin Hierarchy

`Admin` and `Super Admin` are modeled as genuinely distinct roles (not a single "Admin" role with an internal seniority flag), per 01-product-requirements.md Section 3's role definitions — every endpoint's coarse RBAC requirement (Section 8.1) explicitly states which of the two (or both) it accepts, and the most sensitive operations (Section 16.12's platform settings, Section 16.13's audit-log access in 09-api-architecture.md) are `Super Admin`-only, enforced identically through the same mapping mechanism, not a special-cased secondary check.

## 8.5 Immediate Revocation Override

For the rare case where a role change must take effect faster than the JWT's 15-minute natural expiry (Section 7.9's documented staleness trade-off) — most critically, an emergency Ban/Suspension (08-database-design.md Section 19.7–19.8) — the Moderation module's sanction-issuing Service Layer function additionally writes a short-lived "force-reauthenticate" flag to Redis keyed by User ID (Section 13). The pipeline's authentication step (Section 6.3) checks this flag on every request (a cheap Redis lookup) in addition to standard JWT verification, and rejects an otherwise-valid-but-now-flagged token with `401`, forcing an immediate re-authentication that will pick up the user's new (sanctioned) role state. This is a narrowly-scoped, explicitly-justified exception to the "roles are only as fresh as the token" trade-off, applied only where the stakes (an actively-harmful account continuing to act during a 15-minute window) clearly warrant the added check on every single request.

## 8.6 Creator Permissions

A Creator's effective permissions are the union of their platform-level `Creator`/`Buyer` role plus their store-scoped `StoreTeam` role (Owner/Manager/Editor, 08-database-design.md Section 7.7/6.4) — every Stores/Products/Orders (creator-side) Service Layer function that checks ownership (Section 8.2) additionally checks the specific store-scoped role where the operation warrants finer distinction (e.g., only `Owner` may remove another team member; `Editor` may edit Products but not view `Payout` data) — this finer-grained distinction is implemented as additional Service-Layer guard checks, not new platform-level roles, keeping 08-database-design.md's RBAC-as-default model (its Section 6.8) intact.

## 8.7 Buyer Permissions

The default, most numerous role. Nearly every Buyer-facing Service Layer function's authorization is simply "is this the authenticated caller's own resource" (Section 8.2's ownership check applied to `userId`) — Buyers have no store-scoped or platform-administrative permission surface at all, keeping their authorization model the simplest in the system by design.

## 8.8 Moderator Permissions

`Moderator` role's coarse RBAC grants access to the full `/v1/moderation/*` surface (09-api-architecture.md Section 17) uniformly — 08-database-design.md's unified-case-management design (Section 19.1) means there is no finer-grained "this Moderator can only see Review reports, not Product reports" split at V2 launch; the `ResourcePermission` extension seam (Section 8.3) is the documented path if such a split is ever needed for a specialized Trust & Safety team structure in the future.

## 8.9 Support Permissions

`Support Executive` role's coarse RBAC grants access to `/v1/support/*` (09-api-architecture.md Section 15). Fine-grained escalation-driven access to a *specific* Order/Payment record outside a Support Executive's normal scope (e.g., investigating a payment dispute) uses the `ResourcePermission` temporary-grant mechanism (Section 8.3) explicitly, rather than broadening the Support role's baseline permissions platform-wide — keeping the common case narrow and the exceptional case auditable and time-bound, per 08-database-design.md Section 32.4 insight #17.

---

# 9. Business Logic Layer

## 9.1 Service Layer

As established in Section 3.2, the Service Layer is where business rules, orchestration, and authorization converge. Every Service Layer function follows a consistent internal shape: (1) ownership/permission checks (Section 8), (2) business-rule validation beyond basic shape (e.g., 08-database-design.md Section 26.5's cross-row invariants), (3) the actual data operation, wrapped in a transaction if it spans multiple writes (Section 9.3), (4) post-commit side-effect triggering (Section 9.6), (5) return of a typed domain result for the Presentation Layer to shape into a response.

## 9.2 Use Cases

Rather than a formal "Use Case" class per DDD tactical patterns (deliberately not adopted, per Section 2.5), each Service Layer function *is* a use case — named for the business action it performs (`placeOrder`, `submitProductForReview`, `issueCreatorPayout`), directly discoverable and directly testable in isolation. A module's `service.ts` file is, in effect, a readable table of contents of everything that module can do — a valuable property this document deliberately optimizes for over deeper architectural layering.

## 9.3 Transactions

Any Service Layer function that performs more than one write that must succeed or fail together wraps those writes in a single Drizzle transaction (`db.transaction(async (tx) => { ... })`), passing the transaction handle down into Repository Layer calls rather than each Repository function opening its own connection. The canonical example, restated from 09-api-architecture.md Section 9.10: checkout completion's `Order`/`SubOrder`/`OrderItem` creation, `Reservation`-to-`InventoryTransaction` conversion, and `Commission` computation happen inside one transaction — a partial failure (e.g., a Commission-calculation bug) rolls back the entire order creation rather than leaving an Order in an inconsistent, partially-written state. Side effects that should **not** be rolled back with the transaction (Section 9.6 — notification dispatch, search-index updates) are deliberately triggered *after* the transaction commits successfully, never inside it, since an Inngest job enqueue is not itself transactional with the database write and should not be conflated with it.

## 9.4 Validation

Two distinct validation layers, each with a distinct responsibility, both using Zod: (1) **Presentation-layer shape validation** (Section 6.5) — is this a well-formed request per 09-api-architecture.md's documented schema (correct types, required fields present, string formats valid)? This uses Zod schemas defined in each module's `schemas.ts`, generated to match the OpenAPI spec exactly (Section 26.1 of the API doc). (2) **Service-layer business validation** — does this well-formed request satisfy the business rules that require domain/database knowledge to evaluate (08-database-design.md Section 26.5)? This is plain TypeScript logic in the Service Layer, not Zod, since Zod schemas describe static shape, not dynamic cross-row business state. Conflating these two would either bloat Zod schemas with database-dependent refinements (slow, awkward) or push shape validation into the Service Layer (duplicative, inconsistent) — keeping them distinct and each in its natural layer is a deliberate design choice.

## 9.5 Side Effects

Every side effect a Service Layer function triggers beyond its own module's data (sending a notification, updating the search index, recording an analytics event, revoking sessions) is **explicit and visible** in that function's body — never hidden inside a Repository call, a database trigger, or an ORM lifecycle hook. This is a deliberate rejection of "magic" (e.g., Drizzle lifecycle hooks that fire side effects on insert) in favor of code a reader can trace top-to-bottom: reading `placeOrder`'s source is sufficient to know everything that happens when an order is placed, without needing to also know about hidden hooks firing elsewhere.

## 9.6 Idempotency (Service Layer Enforcement)

For endpoints requiring an `Idempotency-Key` (09-api-architecture.md Section 2.6), the Service Layer function checks a dedicated idempotency-record table/Redis entry (keyed on the caller-supplied key, scoped per-endpoint) at its very start, before any business logic runs: if a completed result already exists for this key, it is returned directly without re-executing; if a different payload hash arrives for the same key, a `409` is thrown per the API doc's specification; otherwise, the operation proceeds and its result is recorded against the key (inside the same transaction as the operation's own writes, Section 9.3, so the idempotency record and the operation's effects can never diverge).


---

# 10. Repository Layer

## 10.1 Drizzle Architecture

Drizzle ORM is used in its **query-builder** mode (not its lighter "just types" mode) as the sole means of database access across the entire backend — no raw SQL strings are constructed anywhere outside of Drizzle's own parameterized query builder (a hard rule, restated from 09-api-architecture.md Section 22.8's non-negotiable SQL-injection defense). Drizzle's schema definitions in `shared/db/schema/` are organized into files that mirror 08-database-design.md's 26 domains exactly (one schema file per domain, e.g., `schema/orders.ts` defines `Order`, `SubOrder`, `OrderItem`, etc.) — the schema layer is the one place in the codebase where the database document's domain boundaries and the code's module boundaries are guaranteed to match one-to-one, since both are derived from the same source document.

## 10.2 Repositories

Each module's `repository.ts` exports a set of narrow, single-purpose functions operating only on that module's own owned tables (Section 5's per-module entity lists) — a Repository function never joins across another module's tables directly; if a Service Layer needs data from two modules, it calls each module's own Repository (via each module's Service Layer, Section 3.6) and composes the results in application code, or, where a genuine cross-domain read-optimized view is needed (e.g., an Order-detail page needing Store name), the *owning* module's Repository exposes a purpose-built read function that performs the join internally against its own foreign-keyed reference (e.g., Orders' repository may join `SubOrder` to `Store` for a denormalized read, since `store_id` is Orders' own foreign key into a table it's allowed to read), never reaching into a table it doesn't own for a table it doesn't own.

## 10.3 Transactions (Repository Layer Role)

Every Repository function accepts an optional Drizzle transaction handle as its first parameter (defaulting to the shared module-level connection when not in a transaction) — this uniform signature is what lets Service Layer code compose multiple Repository calls into one atomic transaction (Section 9.3) without each Repository function needing transaction-awareness logic of its own; it simply uses whichever handle (transaction or default connection) it's given.

## 10.4 Query Philosophy

Repository functions return **fully-typed domain objects** inferred directly from Drizzle's schema definitions (via `$inferSelect`/`$inferInsert`), never raw, untyped query results — the Service Layer above never has to guess a field's type or handle an `any`. Queries are written to select only the columns a given Repository function's callers actually need (never a blanket `SELECT *` reflex) — directly serving 08-database-design.md Section 2.5's read-optimization philosophy at the query-construction level, and keeping payloads (and therefore serialization cost and network transfer) proportional to actual need.

## 10.5 Pagination (Repository Layer Implementation)

Cursor-based pagination (09-api-architecture.md Section 2.7) is implemented at the Repository layer using keyset pagination against an indexed `(createdAt, id)` composite (08-database-design.md Section 27.6) — the opaque cursor string the API returns is a base64-encoded, signed representation of the last row's `(createdAt, id)` pair; a Repository's paginated `findMany*` functions accept a decoded cursor and translate it into a `WHERE (createdAt, id) < (cursorCreatedAt, cursorId)` predicate (or the ascending equivalent), never an `OFFSET`. This logic is implemented once as a shared Repository-layer helper (`shared/db/pagination.ts`-style utility) that every module's paginated Repository functions compose with, rather than each module hand-rolling its own keyset logic.

## 10.6 Filtering

Repository functions accept a typed filter-options object (mirroring each endpoint's documented filterable-field list from 09-api-architecture.md, Section 2.8) and translate it into Drizzle `where` clauses — filter fields not present in a given endpoint's documented allowlist are never accepted at the Repository function's type signature level at all (TypeScript's structural typing makes an undocumented filter a compile-time error, not a runtime check that could be forgotten), which is a stronger guarantee than the API layer's own "unrecognized filters are ignored" leniency (09-api-architecture.md Section 2.8) — the Repository layer is stricter than the API contract by design, since it's the last line of defense against an accidentally-overbroad query.

## 10.7 N+1 Prevention

Two enforced patterns: (1) any Repository function returning a list of resources that will need related data (e.g., Products needing their primary image) uses Drizzle's relational query API (`db.query.products.findMany({ with: { media: true } })`) to fetch related rows in a single batched query, never triggering N individual queries by looping over results and querying per-item; (2) a lint rule (Section 26.2) flags any database call found inside a loop body anywhere in the codebase as a build-time warning, catching the N+1 anti-pattern even in cases the relational-query-API convention alone wouldn't prevent.

## 10.8 Connection Management

Given the serverless execution model (Section 1.9 reconciliation, Section 2.9's statelessness principle), every Route Handler/Server Action/Inngest function invocation potentially runs in a fresh, short-lived environment — direct, unpooled Postgres connections at this invocation volume would rapidly exhaust Supabase Postgres's connection limit (08-database-design.md Section 28.7's exact concern). The Drizzle client (`shared/db/client.ts`) is therefore configured to connect through **Supabase's built-in connection pooler** (a PgBouncer-based transaction-mode pooler), not a direct Postgres connection string, for all application-tier read/write traffic — this is a non-negotiable, foundational configuration decision, not a performance tuning option to revisit later. Long-running Inngest job steps that need many sequential queries within one execution reuse a single pooled connection for their duration rather than opening a new one per query, but still never hold a direct (non-pooled) connection open, since Inngest functions are themselves short-lived serverless invocations subject to the identical connection-exhaustion risk.


---

# 11. File & Media Architecture

## 11.1 Cloudflare R2

R2 is the durable object-storage backend for every `Media` asset (08-database-design.md Section 22, its `StorageLocation` abstraction, Section 22.6) — chosen (per this document's final stack) specifically for its zero-egress-fee pricing model, which matters materially for a media-heavy marketplace where every Product Detail Page view re-fetches several images, and CDN egress cost scales directly with browsing volume, not just upload volume. R2's S3-compatible API means the `shared/storage/r2-client.ts` wrapper uses a standard S3 SDK client configured against R2's endpoint, keeping the integration unexceptional and well-understood rather than bespoke.

## 11.2 Upload Flow (Implementation)

Implements 09-api-architecture.md Section 20.1's two-phase signed-URL pattern precisely: the Media module's Service Layer generates a pre-signed R2 `PUT` URL (short expiry, scoped to a specific object key derived from a newly-created `Media` row's ID) for Phase 1, and the client uploads directly to R2, bypassing the Next.js application tier entirely for the binary transfer — a deliberate architectural choice that keeps Vercel serverless function execution time (and therefore cost and timeout risk, Section 24.8 of the API doc) unaffected by upload size, since the application tier never proxies file bytes.

## 11.3 Validation

Phase 2's confirmation (09-api-architecture.md Section 20.4) triggers an Inngest job (Section 12.4) that fetches the uploaded object's actual header bytes from R2 to verify true MIME type (never trusting the client-declared `Content-Type`), checks the object's actual size against the declared `fileSizeBytes`, and rejects (transitioning `Media.uploadStatus` to `failed`) on any mismatch — this validation happens server-side, asynchronously, against the actual stored bytes, not against anything the client asserts about them.

## 11.4 Image Optimization

The same Inngest job pipeline (Section 12.4) generates the thumbnail size variants and format derivatives (WebP/AVIF alongside the original) described in 08-database-design.md Section 22.4, using a server-side image-processing library invoked within the Inngest function — never in the Route Handler's request/response cycle, keeping potentially slow (multi-second) image-transform work entirely off the synchronous path, consistent with 09-api-architecture.md Section 24.8's timeout-budget philosophy.

## 11.5 Security

Every uploaded object's R2 key is a non-guessable UUID-derived path (never the original filename, which could leak information or enable path-based enumeration); public-context media (Product images, Store branding) is served through Cloudflare's CDN layer fronting the R2 bucket with a long cache TTL, while sensitive-context media (creator verification documents, ticket attachments — 09-api-architecture.md Section 20.8) is served exclusively via short-lived, per-request signed R2 URLs generated fresh on each authorized `GET /v1/media/{id}` call, with the authorization check (is this caller permitted to see this specific document) performed by the Media module's Service Layer before any signed URL is ever generated — never relying on the URL's obscurity alone as a security control.

## 11.6 Virus Scanning

A mandatory Inngest job step (Section 12.4) between upload-confirmation and `uploadStatus: ready`, calling a virus/malware-scanning service (a third-party scanning API or a self-hosted ClamAV-style service, integrated via the Integration Layer's standard external-call pattern, Section 17) — objects failing this scan are immediately deleted from R2 (not merely marked failed and left in storage) and never become retrievable through any Media module endpoint, regardless of caller privilege, per 09-api-architecture.md Section 20.6's stated behavior.

## 11.7 Future Video Support

R2's multipart-upload API (already the standard mechanism for S3-compatible object storage) directly supports 09-api-architecture.md Section 20.3's chunked-upload contract for large video files without any architectural change — video-specific processing (transcoding, duration/codec extraction for `Video`, 08-database-design.md Section 22.3) is a new Inngest job added to the existing media-processing pipeline (Section 12.4) when video support is prioritized, not a new upload architecture.

---

# 12. Background Jobs

## 12.1 Inngest

Inngest is the platform's background-job and event-orchestration system, chosen (per the final stack) specifically because it is designed for serverless execution models — an Inngest function is itself a Vercel serverless function invocation triggered by Inngest's own durable event queue/scheduler, meaning there is no separate "worker fleet" to provision, deploy, or scale independently (directly resolving the exact operational-overhead concern 09-api-architecture.md Section 1.9's Option A/B comparison raised about background-job architecture under a serverless model). Every async side effect referenced throughout 08-database-design.md (Section 28.6) and 09-api-architecture.md (Section 24.8, "background workers") is implemented as an Inngest function.

## 12.2 Retry Strategy

Inngest provides built-in, configurable step-level retry with exponential backoff — every job function is composed of explicit `step.run(...)` calls (Inngest's primitive for a retryable, individually-checkpointed unit of work), so a transient failure partway through a multi-step job (e.g., "update search index" succeeds but "send notification" fails) retries only the failed step, not the entire job from scratch. Every job step is written to be idempotent (mirroring Section 9.6's Service-Layer idempotency discipline, applied here to background execution) so Inngest's automatic retries — including the rare case of a step's *effects* succeeding but its *acknowledgment* to Inngest failing, triggering an unnecessary retry — can never produce a duplicate side effect (e.g., a duplicate notification).

## 12.3 Scheduling

Recurring jobs (Payout batch processing, 08-database-design.md Section 14.11's payout cadence; `LowStockAlert` sweeps, Section 9.4; retention-policy archiving, Section 2.16) are defined as Inngest **cron-triggered** functions, with their schedule expression documented alongside the function definition in `src/jobs/`. Event-triggered jobs (a notification firing because an Order shipped) are defined as Inngest **event-triggered** functions, subscribing to a named event (`order.shipped`) that the Orders module's Service Layer emits via `inngest.send(...)` immediately after its triggering transaction commits (Section 9.3's stated timing rule) — the event name itself becomes part of this module's implicit internal contract and is documented per-module where it's emitted and where it's consumed.

## 12.4 Queues (by Domain)

| Job Family | Triggers | Responsibility |
|---|---|---|
| `notifications` | `order.*`, `message.created`, `review.replied`, etc. (broad event surface) | Fan-out to Email (Resend)/Push/In-App/Realtime per 09-api-architecture.md Section 17; implements `EmailQueue`/`SMSQueue`/`PushQueue` processing (08-database-design.md Sections 17.3–17.5). |
| `search-indexing` | `product.updated`, `store.updated`, `category.updated` | Rebuilds the affected `SearchIndex` document(s) (08-database-design.md Section 24.1) — never synchronous with the triggering write, per Section 5.18's module boundary. |
| `media-processing` | `media.upload-confirmed` | Validation (Section 11.3), thumbnailing/optimization (Section 11.4), virus scan (Section 11.6) — the full pipeline described in Section 11, chained as ordered `step.run` calls within one Inngest function. |
| `payouts` | cron (scheduled cadence) | Aggregates eligible `SubOrder`s into `Payout` batches (08-database-design.md Section 14.5/14.11), reconciles `Commission`, calls the Razorpay payout API (Section 16.7). |
| `analytics` | broad event surface (nearly every domain event) + cron for rollups | Writes `Events` rows, computes scheduled `StoreAnalytics`/`ProductAnalytics`/`SalesAnalytics` rollups (08-database-design.md Section 21), and forwards events to PostHog (Section 19.7). |
| `cleanup` | cron | Expires stale `Reservation`/`Cart`/`CheckoutSession` rows (08-database-design.md Sections 9.3, 12.1, 12.4), purges expired auth tokens (Section 2.13 of the database doc's ephemeral-data exception), garbage-collects orphaned `Media` (Section 25.1 of that document). |

## 12.5 Email Jobs (cross-reference)

Fully covered under `notifications` above and Section 15.1; not a separate job family, since email is one delivery channel within the unified Notification fan-out, not an independently-triggered concern.

## 12.6 Notification Jobs (cross-reference)

See row above and Section 15 in full.

## 12.7 Cleanup Jobs (cross-reference)

See row above.

## 12.8 Search Indexing (cross-reference)

See row above and Section 14 in full.

## 12.9 Analytics (Enqueue Pattern)

Every module's Service Layer functions emit a lightweight domain event (`inngest.send({ name: "order.placed", data: {...} })`) as their final, post-transaction step (Section 9.5/9.6) — this single event is consumed independently by both the `notifications` and `analytics` job families (and, for relevant events, `search-indexing`) via Inngest's fan-out-to-multiple-functions model, meaning a Service Layer function emits **one** event without needing to know or care how many downstream jobs care about it — a new future consumer (e.g., a future `ai` module reacting to `product.updated` to regenerate embeddings, Section 27.1) subscribes to the existing event stream without requiring any change to the emitting module's code, directly serving 09-api-architecture.md Section 1.6's additive-non-breaking philosophy at the event-architecture level.

## 12.10 Future AI Jobs

Reserved job family `src/jobs/ai/` (currently empty) for embedding generation, recommendation-model batch scoring, and AI-assisted content moderation pre-screening (08-database-design.md Section 30, 09-api-architecture.md Section 28) — consuming the same `product.updated`/`review.created`/`message.created` event stream every other job family already relies on (Section 12.9), requiring zero changes to any emitting module when this job family is eventually implemented.


---

# 13. Caching Strategy

## 13.1 Redis

Upstash Redis (a serverless-native, HTTP-based Redis, chosen specifically for compatibility with Vercel's serverless execution model — no persistent TCP connection pool to manage, unlike a traditional self-hosted Redis, mirroring the same serverless-fit rationale as Inngest's selection, Section 12.1) is the platform's cache and ephemeral-state layer, implementing 08-database-design.md Section 2.10's layered caching philosophy and 09-api-architecture.md Section 24.1's per-endpoint caching directives concretely.

## 13.2 Cache Hierarchy

Three tiers, matching the database document's own layering exactly:

1. **CDN/edge caching (Vercel's own edge cache, in front of the application)** — for fully public, non-personalized `GET` responses (published CMS pages, public Category/Collection listings), driven by the `Cache-Control` headers each Route Handler sets per 09-api-architecture.md Section 24.1.
2. **Redis application-level cache** — for expensive-to-compute, moderate-volatility, semi-personalized reads (a Store's public profile summary, a Product's aggregate rating snapshot, resolved RBAC/`ResourcePermission` checks, Section 8.3). Read-through pattern: a Repository or Service Layer function checks Redis first, falls through to Postgres on a miss, and writes the result back to Redis with an explicit TTL.
3. **Database materialized views** — for the heaviest aggregate computations (`StoreAnalytics`, `TrendingSearch`), per 08-database-design.md Section 28.3, refreshed by the `analytics` Inngest job family (Section 12.4) rather than computed on any request path at all.

## 13.3 Invalidation

Every Redis cache key follows a consistent naming convention (`{module}:{entity}:{id}:{fieldset}`) enabling both direct-key invalidation (a Service Layer function that mutates an entity explicitly deletes that entity's cache keys as part of its post-write side effects, Section 9.5) and pattern-based invalidation for aggregate/list caches (e.g., invalidating all `products:list:*` cache entries when any Product in a given category changes, since a list-level cache can't be invalidated by a single entity's key). Cache invalidation is always **explicit, in code, at the point of mutation** — never relied upon to happen "eventually" via TTL expiry alone for any cache whose staleness would be user-visible in a confusing way (e.g., a Creator publishing a Product should never see their own change fail to appear due to stale cache); TTL-only expiry (Section 13.4) is reserved for caches where brief staleness is an accepted, documented trade-off (e.g., `TrendingSearch`).

## 13.4 TTL

Every cache entry has an explicit TTL, chosen per data-volatility category and documented alongside its cache-key convention: short TTL (30–60 seconds) for RBAC/`ResourcePermission` resolution (Section 8.3, balancing performance against the immediate-revocation concerns of Section 8.5); medium TTL (5–15 minutes) for semi-personalized aggregate reads (Store/Product summaries); long TTL (hours) for rarely-changing reference data (Category tree, platform Settings). No cache entry is ever stored without an explicit TTL — an unbounded-lifetime cache entry is a known source of subtle, hard-to-diagnose staleness bugs and is disallowed by convention (enforced in code review, Section 26).

## 13.5 Stampede Prevention

For high-traffic cache keys with an expensive underlying computation (e.g., a popular Product's rating summary), the Redis client wrapper (`shared/redis/client.ts`) implements a standard **request-coalescing / locking** pattern: on a cache miss, the first request to observe the miss acquires a short-lived Redis lock and computes the value, while concurrent requests for the same key during that window wait briefly and then read the now-populated cache rather than each independently recomputing — preventing a classic "thundering herd" scenario where a single popular cache entry's expiry causes dozens of simultaneous expensive recomputations against Postgres at once.

## 13.6 Session Caching

The `authenticate` middleware (Section 6.3) caches the resolved actor context (User ID, roles, active store) in Redis keyed by a hash of the access token for the remainder of that token's short lifetime, avoiding a repeated Better Auth/database round-trip on every single request from the same session within its 15-minute window — a meaningful latency win given how frequently the authentication step runs (on nearly every request), applied narrowly since the token's own short TTL already bounds the staleness risk (Section 7.9).

## 13.7 Rate Limiting (Implementation)

09-api-architecture.md Section 8/22.5's rate-limiting policy is implemented via Redis using a sliding-window or token-bucket algorithm (a standard, well-understood Redis pattern — atomic increment-with-expiry on a per-caller, per-endpoint-tier key), executed as the pipeline's second middleware step (Section 6.1) before any authentication/database work, so a request that will be rejected is rejected as cheaply as possible. Rate-limit tiers are keyed by IP address for unauthenticated requests and by User ID for authenticated ones (a stricter, unforgeable identifier once available), with distinct, more generous limits for internal service-to-service calls (Inngest jobs calling back into Route Handlers, where applicable) versus end-user traffic, per 09-api-architecture.md Section 22.5's stated tiering.

---

# 14. Search Architecture

## 14.1 Full Text Search (Launch Implementation)

At V2 launch, search is implemented entirely within Supabase Postgres using native `tsvector`/`tsquery` full-text search with GIN indexing, against the `SearchIndex` read-model table (08-database-design.md Section 24.1) — no separate search infrastructure is provisioned or operated at launch, directly implementing that document's Section 2.11 strategic decision and 09-api-architecture.md Section 7's search contract without introducing a second data store to keep synchronized at this stage of the platform's life.

## 14.2 Filtering

Search filtering (category, price range, material, occasion — 09-api-architecture.md Section 7.1) is implemented as additional `WHERE` predicates combined with the `tsquery` match in the same Postgres query, using the identical Repository-layer filter-translation pattern described in Section 10.6 — search is not architecturally distinct from structured browsing at the query-construction level; it differs only in that its base predicate is a ranked text match rather than an equality/range filter.

## 14.3 Ranking

Postgres's `ts_rank`/`ts_rank_cd` functions provide baseline relevance scoring, combined (via a weighted sum, computed in the query) with the ranking-boost fields 08-database-design.md Section 24.1 specifies (recency, popularity/`unitsSold`, verified-store flag) — the exact weighting is a tunable configuration value (Section 23), not hardcoded, so ranking behavior can be adjusted based on observed search-quality metrics (`SearchAnalytics`, Section 5.22) without a code deployment.

## 14.4 Autocomplete

Implemented via a Postgres trigram (`pg_trgm`) index over product titles and a precomputed `Autocomplete` table (08-database-design.md Section 24.4), rebuilt by a scheduled Inngest job (Section 12.4's `search-indexing` family) — chosen over a live prefix-query against the full catalog specifically to meet 09-api-architecture.md Section 7.2's sub-100ms latency target, which a precomputed, small, heavily-indexed lookup table can reliably hit where a live full-catalog query might not under load.

## 14.5 Future Meilisearch Migration

Per this document's final-stack reconciliation and 08-database-design.md Section 2.11's explicitly-planned evolution path, Meilisearch is the identified future search engine once Postgres full-text search's ranking sophistication or query latency becomes a demonstrated (not speculative) limitation — likely triggered by catalog size crossing into the low millions of Products, or by product requirements demanding typo-tolerant fuzzy matching and faceted search sophistication beyond what `pg_trgm`/`tsvector` comfortably provide. The migration is architected to be additive, not a rewrite: the `SearchIndex` table remains the canonical, Postgres-resident source of the searchable document per product (08-database-design.md Section 24.1's own design intent), and a Meilisearch adoption would introduce a new Inngest job step that additionally pushes each `SearchIndex` update into a Meilisearch index, with the Search module's Repository Layer switching its **read** path from Postgres full-text queries to Meilisearch API calls behind the exact same Service Layer interface (Section 5.18) — Route Handlers, and every other module's code, are entirely unaffected by this migration, since they only ever call Search's Service Layer, never its Repository Layer directly (Section 3.6's module-boundary discipline paying off precisely as intended).

---

# 15. Notification Architecture

## 15.1 Email

Resend is the transactional email provider, called from the `notifications` Inngest job family (Section 12.4) via `shared/email/resend-client.ts` — never called synchronously from a Route Handler or Service Layer, since email delivery latency/failure must never block or fail a user-facing request (08-database-design.md Section 2.4's OLTP-isolation philosophy, applied here to a specific external dependency). Every email corresponds to a `NotificationTemplate` (08-database-design.md Section 17.2), rendered server-side (React Email or an equivalent templating approach, given the Next.js/React stack) before being handed to Resend's send API.

## 15.2 Realtime

Supabase Realtime (Postgres logical-replication-based change broadcasting, native to the already-chosen Supabase Postgres instance — requiring no additional infrastructure) powers in-app real-time delivery: message delivery (09-api-architecture.md Section 13.8), typing indicators, live order-status updates, and the in-app notification bell's live unread-count (Section 14.3 of the API doc). The Messaging & Notifications module's Service Layer writes the durable row (a `Message`, a `Notification`) via its normal transactional write path (Section 9.3) first; Supabase Realtime's built-in Postgres-changes subscription mechanism then broadcasts that write to subscribed clients automatically, meaning the backend does not need to separately "push" the event through a bespoke WebSocket-management layer — the database write *is* the real-time trigger, a notably simpler architecture than maintaining an independent WebSocket server would require, and the specific reason Supabase Realtime was selected over a bespoke solution.

## 15.3 Push

Web Push (for the Buyer Web App PWA, per this platform's stated PWA architecture) is implemented as an additional channel within the same `notifications` Inngest job (Section 12.4), using registered push subscriptions (09-api-architecture.md Section 14.5's device-registration endpoint) — delivered via the standard Web Push protocol, queued and retried using the identical `PushQueue` (08-database-design.md Section 17.5) pattern as email.

## 15.4 In-App

Implemented directly against the `Notification`/`InAppNotification` tables (08-database-design.md Sections 17.1, 17.6), read via Route Handlers (09-api-architecture.md Section 14.1) and updated live via Supabase Realtime (Section 15.2) — the only channel with no external delivery dependency at all, since the client reads/subscribes directly against Dreams by Kalakaaar's own database-backed API.

## 15.5 Delivery Pipeline

A single Inngest function, triggered by any domain event (Section 12.9), performs: (1) look up the target `User`'s `NotificationPreferences` (08-database-design.md Section 11.9) to determine which channels are opted in for this notification type, (2) create the canonical `Notification` row, (3) fan out a `step.run` per enabled channel (email, push, SMS, in-app — each independently retryable per Section 12.2), (4) record delivery outcomes in `DeliveryLog` (08-database-design.md Section 17.8) for each channel's actual provider-reported status.

## 15.6 Retry

Each channel's `step.run` uses Inngest's built-in exponential-backoff retry (Section 12.2); a channel that exhausts its retry budget (e.g., Resend returns a persistent hard-bounce) marks that specific `EmailQueue`/`PushQueue`/`SMSQueue` entry `failed` without affecting the other channels' delivery for the same underlying `Notification` — channel failures are isolated from each other by design, consistent with 08-database-design.md Section 17.3–17.5's per-channel-queue modeling.

## 15.7 Templates

`NotificationTemplate` rows (08-database-design.md Section 17.2) are versioned content, edited via CMS-adjacent Admin tooling (09-api-architecture.md Section 18) rather than hardcoded in application code — a copy change to a transactional email does not require a code deployment, and every sent notification's `DeliveryLog` entry references the exact template version used, preserving 08-database-design.md's versioning philosophy (Section 2.14) applied to notification content specifically.

---

# 16. Payment Architecture

## 16.1 Razorpay

Razorpay is the platform's payment processor (finalizing the placeholder left open in 09-api-architecture.md Section 11/21), supporting the full method set 09-api-architecture.md Section 11.1 anticipates for an India-market launch (Cards, UPI, Netbanking, Wallets, and COD as a platform-managed non-Razorpay-processed method). All Razorpay API calls are wrapped by `shared/payments/razorpay-client.ts`, the sole point of contact between application code and the Razorpay SDK — the Payments module's Service Layer (Section 5.14) is the only caller of this client, keeping payment-processor-specific logic fully isolated from the rest of the codebase, per Section 2.11's fault-isolation principle and directly supporting a future multi-processor or multi-region expansion (08-database-design.md Section 30) without that change rippling beyond this one client wrapper and the Payments module.

## 16.2 Webhook Verification

`POST /v1/webhooks/payments/razorpay` (09-api-architecture.md Section 21.1) verifies Razorpay's HMAC-SHA256 webhook signature (computed against the raw request body using the platform's Razorpay webhook secret, Section 23.3) **before** any parsing or processing occurs — an invalid signature is rejected with `401` and logged as a `SecurityEvent` (08-database-design.md Section 23.5), never silently ignored, since a forged webhook attempting to falsely mark an order paid is a direct financial-fraud vector this check exists specifically to close.

## 16.3 Order Synchronization

On a verified `payment.captured` webhook event, the Payments module's Service Layer looks up the corresponding `PaymentIntent`/`CheckoutSession` by Razorpay's order/payment reference (stored at intent-creation time, 09-api-architecture.md Section 9.9) and calls Checkout's `completeSession` Service Layer function (Section 5.11) — the exact same function the synchronous client-confirmation path (09-api-architecture.md Section 9.10) calls, with the idempotency mechanism (Section 9.6) ensuring that whichever of the two paths (synchronous client confirmation vs. asynchronous webhook) arrives first performs the actual order creation, and the second arrival is a safe, detected no-op.

## 16.4 Refund Flow

`POST /v1/refund-requests/{id}/approve` (09-api-architecture.md Section 10.8) triggers the Payments module's `issueRefund` Service Layer function, which calls Razorpay's refund API and, on success, creates the `Refund` row (08-database-design.md Section 14.7) within the same transaction as updating `RefundRequest.status` — a Razorpay API failure (network error, processor-side rejection) rolls back the `RefundRequest` status change too, so the two can never diverge (a `RefundRequest` marked "approved" always implies a corresponding successful `Refund`, never a silent gap). Razorpay's own refund-status webhook (asynchronous, since some refund methods settle non-instantly) is handled by the same idempotent webhook-processing pattern as Section 16.2–16.3, updating `Refund.status` from `processing` to `completed`/`failed` as Razorpay reports it.

## 16.5 Idempotency (Payment-Specific)

Every Razorpay API call the Payments module makes (`create order`, `capture payment`, `create refund`) passes Razorpay's own supported idempotency mechanism (where available) in addition to this platform's own `Idempotency-Key`-driven Service Layer idempotency (Section 9.6) — a deliberate double layer, since a network timeout on the platform's *own* call to Razorpay (where the platform can't be certain whether Razorpay received and processed the request) is exactly the failure mode Razorpay's processor-side idempotency key is designed to make safe to retry.

## 16.6 Failure Recovery

A failed/timed-out call to Razorpay from within a Service Layer function does not leave the platform's own data in an ambiguous state: the calling transaction (Section 9.3) is rolled back, and the `PaymentIntent`/`CheckoutSession` remains in its prior, well-defined status, safely retryable by the client (09-api-architecture.md Section 11.5) — the platform never marks something "paid" optimistically before Razorpay confirms it, and never leaves a "maybe paid, maybe not" ambiguous state for a human to later untangle.

## 16.7 Creator Payout (Razorpay Route/Payouts Integration)

The `payouts` Inngest job (Section 12.4) calls Razorpay's payout/vendor-transfer API (e.g., RazorpayX or an equivalent linked-account payout mechanism) for each eligible `Payout` batch (08-database-design.md Section 14.5), using the creator's `Creator.payoutAccount` details (09-api-architecture.md Section 5.9) resolved through the same masked-storage, re-verification-hold pattern that endpoint describes — payout execution is exclusively job-triggered on the platform's own schedule (Section 12.3), never client/creator-initiated, per that same section's stated business rule.

## 16.8 Audit Trail

Every Payments module write (`Payment`, `Transaction`, `Refund`, `Payout` state changes) is captured both in that module's own append-only tables (08-database-design.md Section 14's inherent audit-friendly modeling) and in the platform-wide `AuditLog` (Section 5.23) via the shared middleware's automatic audit-write (Section 6.6 of the API doc's Section 22.14 restated here) — financial data receives the most conservative, most redundantly-audited treatment of any module in the system, consistent with 08-database-design.md Section 29.3's stated posture.


---

# 17. Integration Architecture

## 17.1 Third-Party Services (Inventory)

| Service | Purpose | Primary Consumer Module(s) |
|---|---|---|
| Supabase PostgreSQL | System of record (08-database-design.md) | All modules (Repository Layer) |
| Supabase Auth (via Better Auth adapter) | Credential storage substrate | Auth |
| Supabase Realtime | Real-time delivery | Messaging & Notifications |
| Cloudflare R2 | Object storage | Media |
| Upstash Redis | Cache, rate limiting, session cache | Shared (all modules via `shared/redis`) |
| Inngest | Background jobs, event orchestration | Shared (all modules emit events) |
| Resend | Transactional email | Messaging & Notifications |
| Razorpay | Payment processing, payouts | Payments |
| Sentry | Error tracking | Shared (Section 19.6) |
| OpenTelemetry (+ a compatible backend) | Distributed tracing | Shared (Section 19.3) |
| PostHog | Product analytics, feature flags | Analytics, Settings & Feature Flags |

## 17.2 Failure Handling (General Pattern)

Every integration is wrapped by a consistent pattern in its `shared/{service}/` client module: an explicit timeout (Section 17.3), a bounded retry policy for transient failures only (Section 17.4), and a documented fallback/degradation behavior for when retries are exhausted — never an unbounded retry, and never a silent swallow of a failure that the caller needs to know about. The specific fallback behavior is **per-integration and explicitly documented**, since "fail open" and "fail closed" are each correct in different cases: a PostHog analytics-event failure fails open (the user-facing request succeeds regardless; the event is simply lost or, better, queued for later retry via Inngest rather than sent synchronously in the first place — Section 12.9's event-emission pattern already ensures this by design); a Razorpay payment-capture failure fails closed (the order is not created; the client sees a clear payment failure, Section 16.6).

## 17.3 Timeouts

Every outbound call to an external service has an explicit timeout configured at the client-wrapper level (never left to the runtime's or SDK's default, which may be too generous for this platform's own request-budget constraints, 09-api-architecture.md Section 24.8) — recommended budgets: 3–5 seconds for synchronous-path dependencies called from within a Route Handler (Razorpay intent creation, R2 signed-URL generation), up to 30 seconds for Inngest job steps calling slower external operations (virus scanning, large-file processing), since jobs are not subject to the same tight user-facing latency budget as a synchronous request.

## 17.4 Retries

Synchronous-path external calls (from within a Route Handler's request/response cycle) use a minimal retry budget (at most one immediate retry for a clearly-transient error class like a connection reset) — a Route Handler should not itself implement an extended retry-with-backoff loop, since that would hold the serverless function (and the user's request) open for an extended, unpredictable duration; if an external dependency needs a more resilient extended-retry treatment, the operation is redesigned to be asynchronous (queued via Inngest, Section 12) rather than retried synchronously. Inngest job steps use Inngest's own built-in exponential-backoff retry (Section 12.2), which is the appropriate mechanism precisely because a job step is not bound by a user's waiting browser tab.

## 17.5 Circuit Breakers

For the platform's most critical synchronous-path dependency (Razorpay, Section 16), a circuit-breaker pattern is implemented in `shared/payments/razorpay-client.ts`: after a configured threshold of consecutive failures/timeouts within a short window, the circuit "opens," and subsequent calls fail fast (immediately returning a `503 SERVICE_UNAVAILABLE` per 09-api-architecture.md Section 23.8, rather than each waiting out its own full timeout) for a cool-down period before allowing a small number of test requests through to check recovery — this protects both the user experience (a fast, clear "payments are temporarily unavailable" beats every checkout attempt individually timing out slowly) and the platform's own function-execution budget (a Vercel function held open the full timeout duration on every request during a Razorpay outage would itself become a resource-exhaustion problem). Other, less request-latency-critical integrations (PostHog, Sentry) do not warrant a circuit breaker at launch — their failure modes are already isolated by being asynchronous/best-effort (Section 17.2), and a circuit breaker would add complexity without a corresponding risk it mitigates.

## 17.6 Secrets Management

Every third-party credential (Razorpay API keys, Resend API key, R2 access keys, Better Auth signing keys, Sentry DSN) is stored exclusively as a Vercel encrypted environment variable (or, for the small number requiring rotation coordination with Supabase directly, a Supabase project secret), never committed to the repository, never logged (Section 19.1's structured logger redacts any field matching a known secret-key-name pattern as an additional safety net), and accessed exclusively through the typed, validated environment-variable module (`shared/config/env.ts`, Section 23.1) — no module reaches into `process.env` directly, ensuring every secret's usage is discoverable by searching for its typed accessor, and ensuring a missing required secret fails fast and loudly at application boot (Section 23.1) rather than producing a confusing runtime error deep inside a request.

---

# 18. Error Handling

## 18.1 Global Error Strategy

Every error, anywhere in the backend, is either (a) a known, typed domain error explicitly thrown by Service Layer or Repository Layer code, or (b) an unexpected exception caught by the pipeline's terminal error-handling middleware (Section 6.10) and treated as an unclassified `500`. There is no third category — the codebase does not use generic, untyped `throw new Error("something went wrong")` calls in Service Layer code; every intentionally-thrown error is an instance of a specific error class (Section 18.2) carrying enough structured information for the error handler to map it correctly to 09-api-architecture.md Section 2.15's envelope without guessing.

## 18.2 Error Taxonomy

A small, shared hierarchy in `shared/errors/base-errors.ts`, extended per-module where a module needs error types specific to its own business rules:

| Base Class | Maps to HTTP Status | Used For |
|---|---|---|
| `ValidationError` | `400` / `422` | Zod parse failures, business-rule violations (09-api-architecture.md Section 23.2, 23.5) |
| `AuthenticationError` | `401` | Missing/invalid/expired credentials (Section 23.3) |
| `AuthorizationError` | `403` | RBAC/ownership failures (Section 23.4) |
| `NotFoundError` | `404` | Resource does not exist (or caller unauthorized to know, per the anti-enumeration pattern, Section 22.4 of the API doc — the calling code explicitly chooses whether a given `NotFoundError` should mask a `403` case, per-endpoint, matching that section's documented exceptions) |
| `ConflictError` | `409` | Idempotency-key payload mismatch, duplicate resource, business-state conflict (09-api-architecture.md Section 23.5) |
| `PaymentError` | `402` | Payment-specific failures (Section 23.6) |
| `RateLimitError` | `429` | Thrown by the rate-limit middleware itself (Section 6.1), rarely by module code directly |
| `IntegrationError` | `503` | A wrapped, classified failure from Section 17's external-service clients |

Each subclass carries a stable `code` string (matching 09-api-architecture.md Section 23's catalog exactly — e.g., `INSUFFICIENT_STOCK`, `PRODUCT_NOT_PUBLISH_READY`) and an optional `details` array, both consumed directly by the error-handling middleware to construct the response envelope without any additional mapping logic — the error class *is* the mapping, by construction.

## 18.3 API Responses (Error Mapping)

The terminal error-handling middleware (Section 6.10) performs a simple, exhaustive `instanceof` check against the taxonomy above; any error that is *not* an instance of a known subclass is treated as unexpected, logged with full internal detail server-side (Section 19.1), and returned to the client as a generic `500 INTERNAL_ERROR` with **no internal detail leaked** — directly implementing 09-api-architecture.md Section 23.8's stated requirement that stack traces and internal exception text never reach the client.

## 18.4 Logging (Error-Specific)

Every error, known or unexpected, is logged with its full context (module, function, actor, correlation ID, and — for known errors — its structured `details`; for unexpected errors — its full stack trace) before the middleware constructs the client-facing response, ensuring the two (what the client sees and what gets logged) are never the same payload — the client sees a safe, generic representation; the log sees everything, keyed by `correlationId` for support/debugging lookup exactly as 09-api-architecture.md Section 2.15 anticipates.

## 18.5 Recovery

For errors within an Inngest job step (as distinct from a synchronous request), "recovery" means Inngest's own retry mechanism (Section 12.2) for transient errors, and, for errors that exhaust retries, a dead-letter handling path: the job's final failure state is recorded (a `SystemEvent`, 08-database-design.md Section 23.8) and, for job families with user-facing consequence (e.g., a failed notification-delivery job), a lower-priority fallback path is attempted where one exists (e.g., an in-app notification is still created even if the email-delivery step permanently failed) rather than the entire job's failure silently discarding every channel's attempt.

---

# 19. Logging & Observability

## 19.1 Structured Logs

Every log line is a structured JSON object (never a free-text string), emitted through the shared `shared/observability/logger.ts` wrapper, automatically including: `correlationId`, `timestamp` (ISO 8601 UTC, matching 09-api-architecture.md Section 2.12's platform-wide convention), `module`, `severity` (`debug`/`info`/`warn`/`error`), `actorId` (if authenticated), and a `message` plus arbitrary structured `context`. Fields matching a known-sensitive pattern (password hashes, full payment card references, raw tokens) are automatically redacted by the logger itself before the line is emitted, as a defense-in-depth backstop against an engineer accidentally logging something sensitive (Section 17.6's secrets-logging concern, generalized to all sensitive data, not just credentials).

## 19.2 Tracing

Every request and every Inngest job execution is wrapped in an OpenTelemetry trace, with the pipeline's Correlation ID (Section 6.1) set as the trace's own correlating attribute — so a support engineer or on-call developer can go from a user-reported Correlation ID directly to the full distributed trace of everything that request touched (database queries, external API calls, enqueued jobs and their own subsequent execution), not just the single Route Handler's own logs.

## 19.3 Metrics

Beyond individual traces, aggregate metrics (request rate, error rate, p50/p95/p99 latency per endpoint, cache hit rate, rate-limit rejection rate, Inngest job success/failure rate) are emitted via OpenTelemetry's metrics API to whichever backend the platform's observability stack is configured against — this document specifies *that* these metrics exist and *what* they measure (directly implementing 09-api-architecture.md Section 27.5's monitoring requirements), leaving the specific metrics-backend/dashboarding tool selection as an infrastructure-provisioning detail outside this document's scope (Section 1.2).

## 19.4 OpenTelemetry

Chosen as the platform's tracing/metrics instrumentation standard specifically for its vendor-neutrality — the application code instruments itself against the OpenTelemetry SDK's API, not against a specific proprietary vendor's SDK, meaning the actual trace/metrics backend (whether that ends up being a Sentry-integrated tracing view, a dedicated APM vendor, or a self-hosted collector) can change without touching a single line of instrumented application code, directly mirroring this document's Section 1.8 modular-monolith philosophy applied to the observability tooling layer itself.

## 19.5 Correlation IDs

Restated as the connective tissue across this entire section: assigned at the pipeline's first middleware step (Section 6.1), propagated into every log line (19.1), every trace (19.2), every Sentry error report (19.6), and returned to the client in the `X-Correlation-Id` response header and every error envelope (09-api-architecture.md Section 2.15/2.18) — this is the single identifier that ties a user's bug report to the complete internal picture of what happened, and its consistent propagation through every layer of this architecture is treated as a first-class design requirement, not an incidental logging detail.

## 19.6 Sentry

Sentry captures every unexpected (`500`-class, Section 18.3) exception with full stack trace, request context, and the correlation ID as a searchable tag — configured via `shared/observability/sentry.ts`, initialized once at application boot and wrapped around both the Route Handler pipeline (Section 6) and every Inngest job function, so a failure in either surface is captured identically. Known, expected domain errors (`ValidationError`, `NotFoundError`, etc. — Section 18.2) are explicitly **not** sent to Sentry as errors (they would drown genuine signal in expected, routine `4xx` noise); they are captured only in structured logs (19.1), keeping Sentry's error stream a reliable signal of genuinely unexpected backend faults.

## 19.7 Health Endpoints

`GET /v1/health` (unauthenticated, excluded from the standard rate-limit tier) performs a lightweight liveness check (the application process can respond); `GET /v1/health/ready` additionally verifies connectivity to Postgres (via the pooler) and Redis, returning `503` if either is unreachable — used by Vercel's own deployment health checks and by external uptime monitoring, giving both an unambiguous, fast signal distinct from a full end-to-end functional test.

## 19.8 PostHog (Product Analytics Integration)

Distinct from OpenTelemetry (system/operational observability, 19.2–19.3) and from 08-database-design.md's internal `Events`/`Metrics` domain (business-data analytics, Section 5.22) — PostHog is the platform's **product**-analytics tool (feature usage, funnel analysis, session replay where applicable, and, per the final stack, feature-flag management, overlapping with but distinct from the Settings & Feature Flags module's own `FeatureFlagAccess` entity, Section 5.24). Domain events emitted for the `analytics` Inngest job family (Section 12.9) are additionally forwarded to PostHog as a side effect of that same job, keeping PostHog populated from the identical single event stream every other analytics/notification consumer uses, rather than instrumenting PostHog calls separately throughout the codebase.


---

# 20. Security Architecture

This section is the backend-implementation counterpart to 08-database-design.md Section 29 and 09-api-architecture.md Section 22 — those documents establish the required posture; this section states concretely how the chosen stack achieves it.

## 20.1 OWASP

The backend's design is reviewed against the OWASP API Security Top 10 as a standing checklist (not a one-time exercise): broken object-level authorization (mitigated by Section 8.2's mandatory per-resource ownership checks), broken authentication (Section 7), excessive data exposure (Section 22.10 of the API doc's response-schema validation, enforced here via Repository-layer column-selection discipline, Section 10.4), lack of rate limiting (Section 13.7), mass assignment (Section 22.9 of the API doc's strict unknown-field rejection on writes), security misconfiguration (Section 20.9's headers, Section 23's config validation), injection (Section 20.2), improper asset management (09-api-architecture.md Section 25's versioning/deprecation discipline preventing forgotten, unmaintained old endpoints from lingering), and insufficient logging/monitoring (Section 19).

## 20.2 Input Validation

Every request body/query/path parameter is validated by Zod (Section 9.4) before reaching business logic; every value bound into a Drizzle query is parameterized by construction (Section 10.1), eliminating SQL injection as an achievable attack vector through normal code paths — the two together mean malicious input is rejected at the boundary (shape validation) or rendered inert by construction (parameterized queries) rather than relying on manual escaping anywhere in the codebase.

## 20.3 Output Encoding

API responses are always `application/json` (09-api-architecture.md Section 2.4.1) — a content type that browsers do not execute as markup, which by itself substantially mitigates reflected-XSS risk from the API layer. Free-text fields that may eventually be rendered as HTML by a frontend (Product descriptions' constrained rich-text subset, per 09-api-architecture.md Section 22.11) are sanitized at write time (Section 20.4) using an allow-list HTML sanitizer, never a deny-list, since allow-lists fail safely (unknown tags/attributes are stripped) where deny-lists fail open (an unanticipated attack vector is missed).

## 20.4 Sanitization

Implemented at the Service Layer, immediately after Zod validation and before persistence (a dedicated sanitization step for the small set of fields — Reviews, Messages, Product/CMS rich-text — that accept any user-authored free text or constrained markup), so sanitized content is what's stored in Postgres, not merely what's rendered — protecting every future consumer of that data (including, notably, any future admin tooling or export feature that might render it differently than the primary frontend does).

## 20.5 Rate Limiting (cross-reference)

Fully covered in Section 13.7; restated here as a security control specifically: brute-force protection on authentication endpoints, spam prevention on content-creation endpoints (Reviews, Messages), and general denial-of-service resilience.

## 20.6 Secrets (cross-reference)

Fully covered in Section 17.6.

## 20.7 Encryption

In transit: TLS everywhere, enforced by Vercel's platform defaults for all HTTP traffic, with no HTTP-only fallback ever configured. At rest: inherited from Supabase Postgres's default encryption plus the application-layer envelope encryption for the specific highly-sensitive fields 08-database-design.md Section 29.1 names (Creator tax identifiers, MFA secrets) — implemented as a shared `shared/security/encryption.ts` utility (AES-256-GCM or an equivalent authenticated-encryption scheme) called explicitly by the Creators and Auth modules' Service Layers at the point of writing those specific fields, with the encryption key itself managed as a Vercel/Supabase secret (Section 17.6), never derived from anything request-specific.

## 20.8 PII

The backend's PII-handling discipline mirrors 08-database-design.md Section 29.2's concentration principle directly: because PII lives in a small, known set of tables/modules (Auth, Users, Creators' legal fields, Payments' billing-adjacent fields), the account-deletion/erasure-request Inngest job (implementing 09-api-architecture.md Section 3.15) has a bounded, enumerable, testable scope — it does not need to search the entire schema for "anything that might be personal data," it visits a fixed, documented list of tables across a fixed, documented list of modules.

## 20.9 RLS (Row-Level Security)

Supabase's native Postgres RLS is enabled as a **defense-in-depth second layer**, not the primary authorization mechanism — the primary mechanism is always the application-layer RBAC/ownership checks (Sections 6.4, 8) performed explicitly in the Service Layer, since those checks can express the platform's full business-rule complexity (e.g., 08-database-design.md Section 26.5's cross-row invariants) in a way raw RLS policies cannot easily replicate. RLS policies are configured on every multi-tenant table (anything scoped by `store_id` or `user_id`) as a backstop specifically against the failure mode of a bug in application-layer authorization logic — even if a Service Layer function had an authorization bug, a correctly-configured RLS policy would still prevent, say, one Store's team member from reading another Store's `Order` rows directly at the database level, since the application connects to Postgres using a role Supabase's RLS evaluates against the authenticated user's context (passed through via Supabase's standard RLS-JWT-claim integration) rather than a single, universally-privileged service-role connection for all application traffic. The narrow set of genuinely cross-tenant operations (Admin/Moderator/Support tooling, Section 5.20-5.21, and background jobs, Section 12) explicitly use a separate, more privileged service-role database connection, scoped only to the specific Repository functions that legitimately need cross-tenant reads, never used as the default connection for ordinary request traffic.

## 20.10 Security Headers

Every response includes: `Strict-Transport-Security` (HSTS, forcing HTTPS on all future requests from a client that has seen this header once), `X-Content-Type-Options: nosniff`, `Content-Security-Policy` (scoped appropriately per app — stricter for the Admin/Moderator/Support panels than the public-facing Buyer app, given their differing embedded-content needs), and `Referrer-Policy: strict-origin-when-cross-origin` — configured once, centrally, in Next.js's shared middleware/headers configuration (Section 6), applied uniformly rather than per-route, so no individual endpoint can accidentally ship without them.

## 20.11 Audit Logging (cross-reference)

Fully covered in Sections 5.23, 6.6, and 18.4 — restated here as the closing security control: every mutating action, across every module, is captured centrally and cannot be disabled or bypassed by any individual endpoint's implementation, since it is enforced by the shared pipeline (Section 6), not opted into per-module.

---

# 21. Performance Strategy

## 21.1 Connection Pooling (cross-reference)

Fully covered in Section 10.8 — restated here as the single highest-leverage performance decision in this entire document, given the serverless execution model: without Supabase's pooler in front of every application-tier connection, this architecture would not function correctly at any meaningful concurrency, regardless of how well-optimized any individual query is.

## 21.2 Caching (cross-reference)

Fully covered in Section 13.

## 21.3 Lazy Loading

Restated from 09-api-architecture.md Section 24.4 at the implementation layer: Repository Layer functions never eagerly join/embed related data unless the calling Service Layer function explicitly requests it (Section 10.4's column-selection discipline extended to relationship-loading discipline) — an endpoint's default `?include=` behavior (documented per-endpoint in 09-api-architecture.md) is implemented as an explicit parameter threaded from the Route Handler down through the Service Layer to the specific Repository function call, never a Repository-layer default that eagerly loads "just in case."

## 21.4 Streaming

Not used for standard JSON API responses (consistent with 09-api-architecture.md Section 24.9's stated V1 scope) — the one exception where Next.js's native response-streaming capability is used is server-rendered page responses themselves (React Server Components streaming HTML to the browser), which is a frontend-rendering-performance concern outside this document's backend-API scope, noted here only to distinguish it clearly from API-response streaming, which remains unused.

## 21.5 Pagination (cross-reference)

Fully covered in Sections 10.5 and 09-api-architecture.md Section 2.7 — the single most important scalability-preserving performance decision for every list endpoint in the system.

## 21.6 Image Optimization (cross-reference)

Fully covered in Section 11.4 — combined with Next.js's built-in `next/image` component on the frontend (outside this document's scope but noted for completeness of the end-to-end image-performance story), the backend's responsibility is producing correctly-sized, correctly-formatted derivative assets ahead of time so the frontend never needs to request an oversized original.

## 21.7 Database Optimization

Beyond the indexing strategy already fully specified in 08-database-design.md Section 27 (which this document does not repeat), the backend's specific responsibility is ensuring the Repository Layer's actual generated SQL matches that indexing strategy's intent — every new paginated/filtered/sorted Repository function is reviewed (as part of standard code review, Section 26) against an `EXPLAIN ANALYZE` of its generated query before merging, per 08-database-design.md Section 28.1's stated engineering-practice requirement, now made concrete as an actual code-review gate rather than an abstract aspiration.

---

# 22. Scalability

## 22.1 Horizontal Scaling (Application Tier)

As established in Section 2.10, this is effectively free given Vercel's serverless model and this architecture's strict statelessness (Section 2.9) — the application tier's scaling story requires no architectural intervention as traffic grows; Vercel provisions additional function instances automatically. The genuinely hard scaling problems this document must address deliberately are the ones below.

## 22.2 Database Scaling

Follows 08-database-design.md Section 2.6–2.9's strategy directly: connection pooling (Section 10.8/21.1) first, read replicas (22.3) next, partitioning of high-volume time-ordered tables (that document's Section 2.8) after that, and store-scoped sharding (that document's Section 2.9) only if and when a single (possibly read-replica-assisted) Postgres primary genuinely becomes the bottleneck — this document commits to no premature complexity here, matching the database document's own explicitly conservative, evidence-driven scaling posture.

## 22.3 Read Replicas

Once provisioned (a Supabase configuration change, not an application-architecture change), the Repository Layer's connection-selection logic (`shared/db/client.ts`) is extended to route explicitly read-only Repository functions (list/detail `GET`-backing queries with no subsequent write in the same request) to a replica connection, while any Repository function called from within a write transaction (Section 9.3) always uses the primary — this routing decision is made once, centrally, in the database client module, not scattered across every module's Repository files, so enabling replica routing platform-wide is a small, contained change when the time comes.

## 22.4 Background Workers (Scaling)

Inngest's own infrastructure scales job-execution concurrency automatically (mirroring the serverless application tier's own auto-scaling, Section 22.1) — the backend's responsibility is ensuring individual job functions are appropriately scoped (Section 12.2's step-based checkpointing) so a burst of triggering events (e.g., a flash-sale-driven spike in `order.placed` events) produces many small, independently-scaling job executions rather than a few large, slow ones that would become a throughput bottleneck regardless of how much underlying compute Inngest can provision.

## 22.5 Storage Scaling

Cloudflare R2 scales storage capacity and request throughput transparently as a managed service; the backend's only scaling-relevant responsibility (Section 11) is ensuring upload/processing traffic never routes through the application tier's own compute (the direct-to-R2 signed-URL pattern, Section 11.2, is precisely what keeps media storage scaling decoupled from application-tier scaling).

## 22.6 Future Microservices

Per Section 1.8's modular-monolith rationale, the specific, concrete trigger conditions under which extracting a module into an independent service would be reconsidered are: (a) a single module's resource consumption (compute time, database connections) becomes disproportionate enough to threaten the shared application tier's overall latency/cost profile in a way that can't be addressed by the caching/scaling strategies already documented (Sections 13, 21–22); or (b) team scale grows large enough that a single shared deployable genuinely becomes a coordination bottleneck (frequent deployment conflicts, difficulty attributing incidents to a specific team's code) despite the module-boundary discipline (Section 3.6) already in place. Because every module's data access is already confined to its own Repository Layer and its own owned tables (Section 5, Section 10.2), and cross-module calls already go through explicit Service Layer interfaces (Section 3.6) rather than direct database access, extracting a candidate module (Payments and Search are the most plausible early candidates, given their distinct scaling/latency profiles) is a mechanical exercise — replacing an in-process function call with a network call behind the identical interface — not an architectural redesign.


---

# 23. Configuration

## 23.1 Environment Variables

All environment variables are accessed exclusively through `shared/config/env.ts`, a single module that parses `process.env` through a Zod schema at application boot (not lazily, on first access) — an application that starts with a missing or malformed required environment variable fails immediately and loudly at boot, never partway through serving its first request to a real user. Every other module imports typed values from this module (`import { env } from "@/shared/config/env"`), never reading `process.env` directly — this is the same "one place to get it right" discipline applied throughout this document (Sections 6.2, 17.6), applied here to configuration specifically, and it is what makes Section 17.6's "no module reaches into `process.env` directly" secrets-handling guarantee actually enforceable (a lint rule, Section 26.2, flags direct `process.env` access anywhere outside this one file).

## 23.2 Feature Flags

Two distinct, deliberately-separate flag mechanisms, per Section 19.8's earlier note: (1) `FeatureFlagAccess` (08-database-design.md Section 6.6) — platform-defined, database-backed, per-user/per-store cohort flags for gradual internal rollout of new backend capabilities (09-api-architecture.md Section 27.4), resolved via the Settings & Feature Flags module's Service Layer; (2) PostHog feature flags — used specifically for **frontend-visible** experimentation and gradual UI rollout, resolved client-side (or via PostHog's server-side SDK for server-rendered gating), and not the mechanism backend business logic itself branches on. This split exists because the two have different audiences and different risk profiles: a backend capability flag gating, say, a new checkout code path needs to be evaluated with the low latency and strong consistency a direct database/cache-backed lookup provides and needs to be auditable through this platform's own `AuditLog`; a frontend UI experiment flag benefits from PostHog's purpose-built experimentation/analytics tooling and does not carry the same backend-consistency requirements.

## 23.3 Secrets

Restated from Section 17.6/20.6: every third-party credential is a Vercel (or, where project-scoped, Supabase) encrypted environment variable, validated at boot by the same `env.ts` schema (Section 23.1) that validates all other configuration — secrets and non-secret configuration flow through one unified, typed validation mechanism, differing only in that secret values are additionally flagged (a `.secret()` wrapper in the Zod schema) so the structured logger (Section 19.1) and any future configuration-dumping debug tooling automatically redact them.

## 23.4 Runtime Config

Values that may legitimately change per-environment without being secrets (API base URLs, feature-flag defaults, rate-limit thresholds, cache TTL defaults) are likewise defined in `env.ts`'s schema, with environment-specific `.env` files (`.env.development`, `.env.production` — never committed except as `.env.example` templates) providing the actual values per Vercel environment (Preview/Production, per Section 25).

## 23.5 Build Config

Next.js's own build configuration (`next.config.ts`) is kept minimal and behavior-neutral where possible — no build-time logic that changes application *behavior* (as opposed to purely build-mechanical concerns like bundling/output settings) lives here, since build-time-conditional behavior is a common source of "works in development, breaks in production" bugs that this document's emphasis on environment-variable-driven, runtime-validated configuration (23.1) is specifically designed to avoid.

---

# 24. Testing Strategy

## 24.1 Unit Tests

Every Service Layer function has unit tests covering its business-rule branches (its authorization checks, its validation logic, its distinct success and failure paths) with the Repository Layer **mocked** (per Section 2.7's dependency-inversion design, this is straightforward — a Service Layer function depends on a Repository *interface*, easily substituted with an in-memory fake in tests) — unit tests exercise business logic in isolation, fast, without a real database, and are the majority (by count) of the test suite, co-located with each module in its `__tests__/` folder (Section 4.1).

## 24.2 Integration Tests

Exercise a Service Layer function against a **real** (test-database-instance) Repository Layer, verifying that the actual Drizzle queries produce correct results against actual Postgres — these catch the class of bug unit tests' mocked repositories cannot (an incorrect join, a missed `WHERE` clause, a constraint violation) and are run against a dedicated, ephemeral test database (provisioned per CI run, Section 25.1, and reset between test suites) rather than any shared or production-adjacent database.

## 24.3 API Tests

Exercise a full Route Handler (the entire pipeline, Section 6, end to end) via HTTP-level requests against a running instance of the application, verifying the actual request/response contract — status codes, response shape, error envelopes — matches 09-api-architecture.md exactly. These are the tests most directly responsible for catching a divergence between "what the API doc says" and "what the code actually does."

## 24.4 E2E Tests

A smaller, deliberately-curated set of end-to-end tests (Playwright, per the `tests/e2e/` structure, Section 4.1) covering the platform's most business-critical user journeys end-to-end through a real browser against a real (staging) deployment — signup→verify→browse→cart→checkout→order-confirmation being the canonical example, directly mirroring 03-user-journeys.md's most important documented flows. E2E tests are kept few and high-value deliberately (per the standard testing-pyramid principle) since they are the slowest and most brittle test category; broad coverage is the responsibility of unit/integration/API tests (24.1–24.3), not E2E.

## 24.5 Contract Testing

Automated verification that the actual, running API's behavior matches the OpenAPI specification (09-api-architecture.md Section 26.1) exactly — implemented as a dedicated `tests/contract/` suite that, for every documented operation, asserts the actual response against the OpenAPI schema's shape/type/required-field constraints. This is the mechanical enforcement of Section 26.1's stated rule ("a discrepancy between the two is treated as a bug... resolved before coding proceeds") — contract tests run in CI (Section 25.1) and fail the build on any drift, rather than relying on manual review to catch it.

## 24.6 Performance Testing

Load testing against a staging environment (using a standard load-testing tool, run on a periodic/pre-major-release cadence rather than on every commit, given its cost/duration) validates that the platform's stated scalability goals (09-api-architecture.md Section 1.7, this document's Section 22) hold under realistic concurrent load, with particular attention to the checkout/payment path (Section 9/16) and the highest-traffic browsing endpoints (Product listing/detail, Search) — the two areas 08-database-design.md Section 2.5–2.6 identifies as the platform's dominant read and write hot paths, respectively.

## 24.7 Security Testing

Beyond the standing OWASP-checklist review (Section 20.1), automated dependency-vulnerability scanning runs in CI (Section 25.1) against every dependency update, and a periodic (not-per-commit) penetration-testing/security-review cadence is recommended once the platform reaches a scale/maturity that warrants it — noted here as a process commitment this document establishes rather than a specific tool selection, which is an operational detail outside this document's scope.

## 24.8 Testing Pyramid Summary

```
                    ▲
                   ╱ ╲          E2E (few, high-value, slow)
                  ╱───╲
                 ╱     ╲        API / Contract Tests
                ╱───────╲
               ╱         ╲      Integration Tests
              ╱───────────╲
             ╱             ╲    Unit Tests (many, fast, isolated)
            ╱───────────────╲
```

---

# 25. CI/CD Integration

## 25.1 Deployment Pipeline

Every pull request triggers, in order: type checking (TypeScript strict mode, zero tolerance for `any` outside explicitly justified, commented exceptions), linting (Section 26.2's module-boundary and no-raw-`process.env` rules among the standard rule set), unit tests (24.1), integration tests (24.2, against an ephemeral CI-provisioned test database), API/contract tests (24.3/24.5), and a build verification (`next build` succeeding cleanly) — a merge to the main branch is blocked unless every stage passes, with no manual override path for a red pipeline, since this platform's financial and trust-critical surface area (Payments, Moderation) makes "we'll fix it after merging" an unacceptable risk posture.

## 25.2 Migration Strategy

Drizzle migrations are generated from schema changes (`drizzle-kit generate`) and committed to the repository as versioned SQL files (`shared/db/migrations/`) — migrations run as an explicit, separate deployment step **before** the new application code that depends on them is promoted to serve traffic (never bundled into the application's own boot sequence, which would risk multiple concurrent serverless instances racing to apply the same migration). Every migration is written to be backward-compatible with the *previous* application version for the duration of a deployment rollout (additive columns with defaults, never a same-deploy column rename/drop) — mirroring 09-api-architecture.md Section 1.6's additive-first philosophy at the schema-migration layer, since Vercel's deployment model means old and new application code can both be briefly live simultaneously during a rollout.

## 25.3 Rollback

Because application deployments are immutable, versioned Vercel deployments, rolling back application code is a near-instant traffic-repoint to the prior deployment. Database migrations are **not** automatically rolled back alongside an application rollback (per 25.2's backward-compatible-migration discipline, the prior application version continues to function correctly against a schema that has since gained new, unused-by-it columns) — a genuine schema rollback (reverting a migration) is a deliberate, manually-triggered, rare operation, never an automatic consequence of an application rollback, since the two have fundamentally different risk profiles and coupling them automatically would be dangerous.

## 25.4 Feature Rollout

Ties directly to Section 23.2's `FeatureFlagAccess` mechanism: new, higher-risk backend capabilities (a new checkout code path, a new payment method) are deployed dark (code present, flag off) and enabled progressively per cohort, rather than every deployment being an all-or-nothing traffic cutover — decoupling "deploy" from "release" in the standard, widely-adopted sense.

## 25.5 Blue/Green Readiness

Vercel's own deployment model (every deployment is a distinct, addressable, instantly-promotable unit) already provides blue/green-equivalent capability natively for the application tier without additional architecture — the specific discipline this document adds on top is ensuring database migrations (25.2) never break the "both old and new application code must work against the current schema simultaneously" invariant, which is the one place a naive blue/green assumption (that only application code needs this property) would otherwise fall short for a system with a shared, non-versioned database.


---

# 26. Coding Standards

## 26.1 Folder Conventions

Restated and made prescriptive from Section 4: every module folder contains exactly the fixed file set (`service.ts`, `repository.ts`, `schemas.ts`, `errors.ts`, `types.ts`, `__tests__/`); no module introduces an additional top-level file without a documented reason recorded in this document (Section 5's per-module entries are the place such an exception would be noted, as Section 5.9's Customization module already demonstrates). Route Handler folders under `src/app/api/v1/` mirror 09-api-architecture.md's URL paths exactly, with zero deviation — a developer should never need to search for where an endpoint lives; its file path *is* its URL.

## 26.2 Naming, Imports, and Enforced Boundaries

- **Imports:** absolute imports via a configured path alias (`@/modules/...`, `@/shared/...`), never deep relative imports (`../../../../shared/db/client`) — enforced by lint configuration, both for readability and because deep relative imports are a common symptom of (and contributor to) module-boundary violations.
- **Module boundary enforcement:** a custom ESLint rule (or an off-the-shelf module-boundary plugin configured for this purpose) statically forbids any file under `src/modules/{moduleA}/` from importing anything from `src/modules/{moduleB}/repository.ts` or `src/modules/{moduleB}/types.ts` (module-private files) — only `src/modules/{moduleB}/service.ts`'s exported surface is importable cross-module, mechanically enforcing Section 3.6 and Section 5.1's module-contract discipline rather than leaving it as a convention that erodes over time without tooling backing it.
- **No raw `process.env`:** a lint rule forbids `process.env` access outside `shared/config/env.ts` (Section 23.1).
- **No database calls inside loops:** a lint rule flags this pattern (Section 10.7's N+1 prevention) as a build warning.
- **No raw SQL strings:** a lint rule flags any string literal that looks like a SQL statement outside Drizzle's own query-builder usage (Section 20.2's injection-prevention discipline, made mechanically enforced rather than merely policy).

## 26.3 Error Conventions

Every intentionally-thrown error is an instance of the Section 18.2 taxonomy, never a bare `Error` or a plain string thrown — enforced by lint rule (`no-throw-literal` and a custom rule requiring thrown values to extend the shared base error classes). Every custom error class constructor requires its stable `code` string as a mandatory (not optional) constructor argument, making it a compile-time error to introduce a new thrown error without also giving it a client-facing, documented code.

## 26.4 Logging Conventions

Only the shared structured logger (`shared/observability/logger.ts`, Section 19.1) is used — a lint rule forbids direct `console.log`/`console.error` calls anywhere in `src/`, both to guarantee every log line carries the structured context (correlation ID, module, severity) this document's observability architecture depends on, and to prevent accidental sensitive-data leakage through an unstructured, unredacted log call.

## 26.5 Documentation Standards

Every exported Service Layer function carries a doc comment stating: the business operation it performs, its authorization requirements (which role(s)/ownership check it performs internally), and a reference to the relevant 09-api-architecture.md endpoint(s) and 08-database-design.md entity/entities it operates on — maintaining the same cross-document traceability chain this entire documentation series has established from Section 00 through this document, now anchored at the level of individual functions, not just architecture-document sections.

---

# 27. Future Architecture

## 27.1 AI

Per 08-database-design.md Section 30 and 09-api-architecture.md Section 28, the reserved `ai` module (Section 5.26) and job family (Section 12.10) are the identified integration points. Concretely, the most likely first AI capability — semantic product search/recommendations — would be implemented as: an Inngest job consuming the existing `product.updated` event stream (Section 12.9, requiring zero changes to the Products module) to generate embeddings (via an external LLM/embedding-provider API, wrapped by a new `shared/ai/` integration client following this document's Section 17 integration-pattern conventions exactly) and store them in a `pgvector` column on `SearchIndex` (08-database-design.md Section 24.8's already-reserved extension point) — the Search module's Service Layer interface (Section 5.18) is unchanged; only its internal ranking implementation gains a new signal, invisible to every calling module per Section 3.6's boundary discipline.

## 27.2 Marketplace Federation

Per 08-database-design.md Section 30's `store_id`-centric ownership model, a federated/white-label marketplace instance would primarily be a **routing and configuration** concern layered on top of this existing architecture — a new Route Handler middleware step (inserted into the Section 6 pipeline) resolving which federated instance/tenant a request belongs to (by domain or header) and scoping subsequent RLS-policy evaluation (Section 20.9) accordingly, rather than a rewrite of any module's business logic, which already operates in terms of `storeId`/`userId` scoping regardless of which "instance" that store conceptually belongs to.

## 27.3 Subscriptions

A new `subscriptions` module, generating recurring `Order`s by programmatically calling Checkout's existing `completeSession`-equivalent internal interface (Section 5.11) on a schedule (a new Inngest cron job family) — the Order-creation path itself, and everything downstream of it (Payments, Shipping, Notifications), requires no change, since a subscription-generated order is, from the Order module's perspective, simply an order.

## 27.4 Internationalization

The backend's UTC-everywhere (09-api-architecture.md Section 2.13) and minor-units-plus-currency-code (Section 2.11) conventions are already internationalization-ready. The primary new backend work for a genuine multi-locale launch would be: a new `Accept-Language`-aware content-resolution layer in the CMS and Products modules (resolving a `{entityId}/translations/{locale}` lookup, per 09-api-architecture.md Section 28's reserved contract) and locale-aware tax/shipping computation in Checkout (08-database-design.md Section 12.9's jurisdiction field is already modeled, requiring rule-table population rather than a schema or architecture change).

## 27.5 B2B

Wholesale/corporate-buyer support (08-database-design.md Section 30) would introduce a new `wholesale` module owning tiered-pricing entities that attach to existing `Product`/`ProductVariant` records (additive foreign keys, no change to those modules' own tables) and a new buyer-role variant (a `ResourcePermission`-based procurement-approval workflow, Section 8.3's existing extension seam, rather than a new platform-level role requiring RBAC-model changes, Section 6.9 of the database doc).

## 27.6 GraphQL

Not planned, and not a "future default" this document endorses — 09-api-architecture.md Section 1.4 already made a deliberate, justified choice for REST over the platform's five known first-party clients. GraphQL would only become worth reconsidering if a future public/partner API (09-api-architecture.md Section 22.15) faced third-party integrators with widely varying, unpredictable data-shape needs that a fixed REST contract serves poorly — a real but currently entirely hypothetical future trigger condition, noted here so a future team doesn't mistake its absence from this document for an oversight.

## 27.7 Microservices

Fully covered in Section 22.6 — restated here only to note that this document's Future Architecture section deliberately treats microservices as a *response to evidence*, not a default trajectory every growing backend eventually and inevitably takes; a modular monolith that maintains its module-boundary discipline (Section 3.6, Section 26.2's enforced tooling) can serve a very large fraction of this platform's realistic growth curve without ever needing the change.

## 27.8 Event Bus

The Inngest-based event-emission pattern already established (Section 12.9) is, functionally, a lightweight event bus scoped to this single application's own module-to-job communication. A more general-purpose, cross-service event bus (Kafka, or a managed equivalent) would become relevant specifically at the point microservice extraction (27.7/22.6) actually happens — at which point the *events* this architecture already emits (Section 12.9's `order.placed`, `product.updated`, etc.) become the natural payload definitions for that future bus, requiring the events' shapes to be formalized and versioned (mirroring 09-api-architecture.md Section 26's OpenAPI discipline, applied to event schemas) rather than invented from scratch.

---

# 28. Final Review Checklist

Before any module, endpoint, or job in this architecture is considered ready for implementation, it is reviewed against:

- [ ] **Architecture Consistency** — does it follow the three-layer module structure (Section 3.2)? Does it respect module boundaries (Section 3.6, enforced per Section 26.2)?
- [ ] **Security** — is authentication/authorization explicit and layered per Sections 7–8? Are inputs validated and outputs never leaking sensitive data (Section 20)?
- [ ] **Performance** — does it use cursor pagination, appropriate caching, and connection pooling correctly (Sections 13, 21)? Has its generated SQL been checked against `EXPLAIN ANALYZE` (Section 21.7)?
- [ ] **Maintainability** — does every field and behavior trace back to 08-database-design.md and 09-api-architecture.md, with no undocumented deviation? Does it follow the coding standards (Section 26)?
- [ ] **Developer Experience** — is the module's public interface (Section 5.1) clear and well-documented (Section 26.5)? Are its tests (Section 24) present at the appropriate pyramid level?
- [ ] **Scalability** — does it avoid assumptions that break under horizontal scaling or serverless statelessness (Section 2.9–2.10)? Does it correctly use async/background processing for non-critical-path work (Section 12)?
- [ ] **Reliability** — are external calls wrapped with timeouts, retries, and defined fallback behavior (Section 17)? Is every mutating operation idempotent where required (Section 9.6, Section 12.2)?
- [ ] **Future Readiness** — does it use open, additive patterns (event emission, Section 12.9; reserved module/job boundaries, Sections 5.26, 12.10, 27) rather than closed, hard-to-extend shapes?

---

*This document is the definitive backend architecture reference for Dreams by Kalakaaar v2. No route handler, service function, repository query, Inngest job, or infrastructure configuration should be written without first tracing its shape back to a decision documented here — and, transitively, back to 08-database-design.md and 09-api-architecture.md. Where an implementation need arises that this document does not yet cover, this document must be updated first — the architecture leads, the code follows.*
