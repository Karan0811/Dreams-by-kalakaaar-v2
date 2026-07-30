# 17 · Performance & Scalability Architecture — Dreams by Kalakaaar v2

**Document owner:** Principal Performance Engineer / SRE Lead
**Status:** Draft for review — implementation-ready
**Audience:** Frontend Engineering, Backend Engineering, DevOps, QA, Product, Future team members
**Depends on:** `00-project-vision.md` through `15-engineering-standards.md`, in full, most directly `08-database-design.md`, `09-api-architecture.md`, `10-backend-architecture.md`, `11-frontend-architecture.md`, `13-testing-strategy.md`, and `14-infrastructure-devops-architecture.md`
**Precedes:** All performance-sensitive implementation decisions, capacity provisioning, and load-testing execution

This document defines performance and scalability architecture only. It contains no application code, no query syntax, no configuration file contents. Its purpose is to be the single reference from which every rendering decision, query design, cache policy, and capacity plan is derived — every target and strategy in this document traces back to a concrete requirement named in `00`–`15`, not to generic performance-engineering folklore.

---

# 1. Introduction

### 1.1 Purpose

`11-frontend-architecture.md` chose Server Components, ISR, and Partial Prerendering; `10-backend-architecture.md` chose a modular monolith with a layered pipeline; `08-database-design.md` chose Postgres with a specific indexing philosophy; `14-infrastructure-devops-architecture.md` chose managed, elastically-scaling infrastructure. Each of those documents justified its choice in terms of performance and scale, but none of them is the *complete, cross-cutting* performance story — a Product Detail page's actual load time is a function of rendering strategy, API latency, database query plan, cache hit rate, and CDN placement all at once. This document is that complete story: it defines the platform's performance budgets, the concrete optimization techniques applied at every layer to meet them, and the scaling strategy that keeps those budgets holding true from the platform's first thousand users to its millionth.

### 1.2 Scope

In scope: performance philosophy and budgets; frontend rendering and asset optimization; backend and API performance; database query and index optimization; caching architecture across every layer; CDN and edge strategy; search, media, and background-job performance; pagination and virtualization; capacity planning and scaling strategy (horizontal, vertical, auto); load/stress testing and benchmarking; performance monitoring and regression detection; and a scalability roadmap from launch through 1M+ users.

Out of scope: infrastructure provisioning mechanics (`14-infrastructure-devops-architecture.md`'s domain, referenced not restated), security architecture (`12-security-architecture.md`'s domain, referenced where a security control has a performance dimension), and coding-convention detail (`15-engineering-standards.md`'s domain — this document defines *what* performance the code must achieve; that document defines *how* code is written day-to-day to achieve it).

### 1.3 Audience

Every engineer whose code has a performance dimension — which, on this platform, is every engineer. Frontend Engineering owns Sections 4, 8–10; Backend Engineering owns Sections 5–6, 11–12; DevOps/Platform Engineering owns Sections 13–15; QA owns Section 15's execution per `13-testing-strategy.md` Section 13; and Product owns the business context behind Section 3's targets.

### 1.4 Objectives

1. Establish one set of performance budgets (Section 3), extending `00-project-vision.md` Section 14 and `13-testing-strategy.md` Section 13's targets into a complete, layer-by-layer specification.
2. Define the concrete rendering, caching, and query optimization techniques that make `11-frontend-architecture.md` Section 7's rendering strategy and `10-backend-architecture.md`'s architecture actually meet those budgets in practice, not just in theory.
3. Define a scaling strategy calibrated to `00-project-vision.md` Section 15's 1M+ user ambition, with explicit, named thresholds at which each layer's scaling lever is pulled — never scaling reactively, under pressure, for a threshold that could have been anticipated.
4. Define how the platform detects a performance regression before it reaches production, and how it responds when one does anyway.
5. Give every engineer a performance review checklist (Section 20) equivalent in authority to `13-testing-strategy.md` Section 26's quality gates — performance is a release-blocking concern, not a best-effort aspiration.

### 1.5 Relationship to Previous Documents

| Document | What This Document Inherits and Extends |
|---|---|
| `00-project-vision.md` | Section 14's Lighthouse/Core Web Vitals targets and Section 15's 1M+ user scale ambition — the concrete numeric budgets (Section 3) and scaling roadmap (Section 19) this document defines are the operational expansion of both. |
| `08-database-design.md` | Section 2's scale assumptions, Section 27's indexing strategy, and Section 2.5's read-heavy optimization philosophy — Section 6 of this document is that indexing strategy's full performance-tuning expansion. |
| `09-api-architecture.md` | Section 2.7's pagination contract and Section 2.20's rate-limit headers — Section 12 of this document defines the latency budget every endpoint is held to. |
| `10-backend-architecture.md` | Section 21's performance strategy summary and Section 13's Redis caching architecture — this document is the full expansion of both. |
| `11-frontend-architecture.md` | Section 7's rendering strategy and Section 16's performance budget — this document is that section's complete, cross-layer counterpart. |
| `12-security-architecture.md` | Section 8.3's rate limiting — referenced here as a scaling *protection* mechanism (Section 13.6), not re-derived. |
| `13-testing-strategy.md` | Section 13's performance-testing targets and methodology — this document defines the architecture those tests validate; that document defines how they're executed. |
| `14-infrastructure-devops-architecture.md` | Section 18's scaling strategy and Section 8.3's connection-pooling capacity table — this document's Section 13–14 are the performance-engineering counterpart to that document's infrastructure-provisioning view of the same scaling problem. |

### 1.6 How This Document Is Used

Before any performance-sensitive feature ships, it is checked against Section 3's budgets and Section 20's review checklist. Before any capacity decision is made, it is checked against Section 14's planning tables. Where a performance need arises that this document does not yet cover, this document is updated first.

---

# 2. Performance Philosophy

### 2.1 Performance Is a Feature, Not a Metric

Restated from `00-project-vision.md` Section 14 and `05-design-principles.md` Section 16.1: a fast platform is not a technical nicety layered on top of the product — it is directly part of the premium, trustworthy experience the platform promises. A slow Product Detail page is, to a buyer, indistinguishable from a broken one; a slow Checkout is a direct conversion cost. Every performance decision in this document is made with this framing: performance is user-facing product quality, evaluated with the same rigor as any other quality dimension in `13-testing-strategy.md`.

### 2.2 Measure Before Optimizing

Restated from `15-engineering-standards.md` Section 20.5 and `08-database-design.md` Section 2.3's "denormalize by measurement, not assumption" principle, applied platform-wide: no optimization — a cache layer, an index, a memoized computation, a denormalized field — is introduced speculatively. Section 16's monitoring architecture exists specifically so that every optimization decision in this document is backed by an actual measured bottleneck, not a guess about where one might exist.

### 2.3 Fast by Default, Not Fast by Exception

Performance is architected as a structural property of the system's default path — Server Components that ship zero JavaScript by default (Section 4.3), cursor-based pagination as the only pagination pattern (Section 12.4), indexes designed alongside the schema rather than added reactively (Section 6.3) — rather than a special "fast path" reserved for a few hand-optimized screens while everything else is left to accumulate latency. An engineer building a new feature should find that following this document's default patterns produces fast code without additional, feature-specific optimization effort.

### 2.4 Budgets, Not Aspirations

Every performance target in Section 3 is a **budget** — a number tracked continuously (Section 16) and enforced at release time (Section 20), not a soft goal revisited only when someone notices things feel slow. A budget that is silently exceeded and never remediated is, functionally, not a budget at all; this document treats budget regressions with the same seriousness `13-testing-strategy.md` Section 26 treats a failing test.

### 2.5 Scale Ahead of Need, Not Ahead of Evidence

Restated from `14-infrastructure-devops-architecture.md` Section 18.1: the platform's architecture (caching, pagination, indexing, modular structure) is designed from day one to scale to `00-project-vision.md`'s stated ambition without a future rewrite — but *provisioning* (compute tier, database tier, cache memory) scales reactively to demonstrated need, on a proactive monitoring-driven cadence (Section 14.7 of that document), never speculatively far ahead of actual traffic. The distinction is between architecture (scale-ready from day one) and infrastructure sizing (scaled just ahead of demonstrated need).

### 2.6 The User's Perceived Experience Is the Real Metric

Server-side latency, database query time, and bundle size are all *inputs* to what actually matters: how fast the platform *feels* to a buyer on a mid-tier mobile device on a real-world connection, or to a creator managing their dashboard during a busy period. Every technical metric in this document (Section 3.2's server-side latency budgets, Section 3.3's database targets) is ultimately in service of Section 3.1's user-perceived Core Web Vitals targets — a technically fast backend behind a poorly-optimized frontend is not, from the platform's actual audience's perspective, a fast platform.

### 2.7 Graceful Degradation Under Load

Consistent with `10-backend-architecture.md` Section 2.11 and `12-security-architecture.md` Section 2.5: when the platform is genuinely under more load than it can serve at full performance, it degrades predictably and recoverably (rate limiting, circuit breaking, cache-serving stale-but-available content) rather than failing catastrophically. Section 13.6 and Section 15.4 make this an explicitly tested, not merely hoped-for, property.

---

# 3. Performance Targets

### 3.1 Core Web Vitals Budget (Restated and Finalized)

Consolidates `00-project-vision.md` Section 14 and `13-testing-strategy.md` Section 13.3 into this document's single authoritative table:

| Metric | Target | Measured At | Enforcement |
|---|---|---|---|
| Largest Contentful Paint (LCP) | Under 2.0s (p75, real-user, mid-tier mobile) | `apps/buyer`'s highest-traffic screens (Home, Category, Product Detail) | Lighthouse CI (build-blocking, Section 16.6) + Vercel Speed Insights (production, Section 16.2) |
| Interaction to Next Paint (INP) | Under 200ms (p75) | All interactive surfaces, all three apps | Real-user monitoring (Section 16.2) |
| Cumulative Layout Shift (CLS) | Under 0.1 | All screens | Lighthouse CI + real-user monitoring |
| Time to First Byte (TTFB) | Under 600ms (p75) | Every server-rendered route | OpenTelemetry trace (Section 16.3) |
| First Contentful Paint (FCP) | Under 1.5s (p75) | All screens | Lighthouse CI |

### 3.2 API Latency Budget (Restated from `13-testing-strategy.md` Section 13.4)

| Endpoint Category | p95 Target | p99 Target |
|---|---|---|
| Public browsing reads (Product/Search) | Under 200ms | Under 500ms |
| Cart/Checkout mutations | Under 400ms | Under 900ms |
| Order placement (payment-verifying) | Under 1.5s | Under 3s |
| Admin/Analytics reads | Under 800ms | Under 1.8s |
| Webhook processing (acknowledgment only, Section 11) | Under 300ms | Under 700ms |

### 3.3 Database Query Budget

| Query Category | Target |
|---|---|
| Primary-key / unique-index lookup | Under 5ms |
| Indexed filtered list query (e.g., Product by category + filters) | Under 30ms |
| Aggregation query (e.g., Creator Analytics summary) | Under 150ms |
| Full-text/relevance search query | Under 100ms |
| Any query touching a high-volume table without hitting an index | **Not permitted to ship** — flagged by `EXPLAIN ANALYZE` review (`15-engineering-standards.md` Section 20.2) before merge |

### 3.4 Frontend Bundle Budget

| Route | Max Initial JS (gzipped) |
|---|---|
| `apps/buyer` Home | 120 KB |
| `apps/buyer` Category / Search Results | 130 KB |
| `apps/buyer` Product Detail | 140 KB |
| `apps/buyer` Checkout | 160 KB (highest budget given its interaction density, still deliberately capped) |
| `apps/creator` / `apps/internal` (authenticated, not guest-critical-path) | 250 KB (materially looser, per `11-frontend-architecture.md` Section 16.2's stated Buyer-app-specific budget enforcement) |

### 3.5 Availability and Throughput Targets

| Metric | Target | Source |
|---|---|---|
| Platform availability | 99.9% | `00-project-vision.md` Section 14 |
| Concurrent request handling at launch traffic | No degradation below Section 3.2's budgets | Baseline, validated via Section 15.2 |
| Concurrent request handling at 10x launch traffic | Graceful degradation only (Section 2.7), no hard failure | Validated via Section 15.3's load testing |

### 3.6 Budget Enforcement Mechanism

Every target in this section is enforced by a specific, named mechanism (Lighthouse CI, `EXPLAIN ANALYZE` review, real-user monitoring alerting) — restated as this section's governing rule: **a target without an enforcement mechanism is not a budget, it's a hope.** Section 20's review checklist exists specifically to confirm every shipped change was checked against the relevant enforcement mechanism, not merely that the target is documented here.

---

# 4. Frontend Performance

### 4.1 Purpose

To define how `11-frontend-architecture.md` Section 7's rendering strategy, translated into Section 3.1's Core Web Vitals budget, is actually achieved and sustained as the codebase grows.

### 4.2 Architecture — Rendering Decision Flow

```
New route/screen
      │
      ▼
Is content the same for every visitor, cacheable? ──NO──► SSR (personalized:
      │ YES                                                Cart, Checkout, Account)
      ▼
Does it need real-time-accurate data within an
otherwise-cacheable shell (price, availability)? ──YES──► ISR + Partial
      │ NO                                                 Prerendering
      ▼
Fully static, rarely changes? ──YES──► SSG (Legal, About)
      │ NO
      ▼
ISR (Category, Collection, Creator Storefront)
```

Directly implements `11-frontend-architecture.md` Section 7.10's decision matrix — restated here as the performance-architecture rationale: this decision tree exists specifically to route every new route to the cheapest rendering strategy that still meets its correctness requirements, since the cheapest strategy is, by construction, also the fastest for the end user (a cached, pre-rendered response beats any server computation performed per-request).

### 4.3 Server Components as the Default Performance Lever

Restated from `11-frontend-architecture.md` Section 3.6/7.8: every component defaults to Server Component status, shipping zero client-side JavaScript, until a specific, identified interactivity need promotes it to a Client Component — this is the single highest-leverage performance decision available to any engineer on this platform, since it directly determines Section 3.4's bundle budget without requiring any additional, deliberate optimization effort once the convention is followed correctly.

### 4.4 Streaming and Suspense

Restated from `11-frontend-architecture.md` Section 7.6: every route with independently-loading data sections uses Suspense boundaries so the fastest-resolving content paints first — a Product Detail page's title/price/images resolve and paint before its Reviews section, rather than the entire page waiting on the slowest data dependency. This is a direct Section 3.1 LCP optimization: the "largest contentful" element is almost always resolvable faster than the full page's total data dependency graph, and streaming ensures LCP measures against that faster resolution, not the slowest one.

### 4.5 Partial Prerendering (PPP)

Restated from `11-frontend-architecture.md` Section 7.7: the mechanism that resolves the tension between aggressive caching (Section 8) and real-time correctness (Section 3.3's availability requirement) — a static, edge-cached shell with a small, fast-resolving dynamic "hole" for price/availability. This is the concrete technique behind Section 4.2's ISR+PPP branch, and it is this document's primary architectural answer to "how can the platform's highest-traffic pages be both instant and accurate."

### 4.6 JavaScript Optimization

Beyond Section 4.3's Server-Component-by-default discipline: `next/dynamic` is used for genuinely heavy, below-the-fold, or conditionally-rendered components (the Image Viewer, Rich Text editor, chart libraries — `11-frontend-architecture.md` Section 16.3), each paired with a matching Skeleton fallback; third-party client-side scripts are limited to the two explicitly reviewed exceptions (Sentry, PostHog client SDKs, `11-frontend-architecture.md` Section 12.4), since every additional third-party script directly consumes Section 3.4's bundle budget without the platform's own architectural review having any control over its internal efficiency.

### 4.7 CSS Optimization

Tailwind CSS's build-time purging (per the finalized stack) ships only the utility classes actually used across the codebase, not the full Tailwind utility set — combined with `06-design-system.md` Section 2's token-driven design system, this keeps CSS bundle size proportional to genuinely used design patterns rather than growing unboundedly as the design system's *available* (but not necessarily used-everywhere) token set grows.

### 4.8 Bundle Splitting and Code Splitting

Restated from `11-frontend-architecture.md` Section 16.2–16.3: Next.js's automatic route-based code splitting is the baseline; CI enforces Section 3.4's per-route budget via `@next/bundle-analyzer` integrated into the pipeline (`11-frontend-architecture.md` Section 16.2), failing the build on a budget regression rather than allowing bundle growth to be discovered later via a degraded Core Web Vitals trend.

### 4.9 Lazy Loading

Below-the-fold imagery uses `next/image`'s built-in lazy loading by default (Section 10.3); below-the-fold, non-critical components (a Recommendations carousel, a "You might also like" section) are dynamically imported (Section 4.6) so their weight is deferred until the browser has idle capacity or the user scrolls near them, never blocking the initial, above-the-fold render.

### 4.10 Best Practices

- Every new Client Component boundary is placed as far down the component tree as possible (Section 4.3), reviewed explicitly in code review (`15-engineering-standards.md` Section 10.11).
- Every new third-party dependency added to a client-bundled package is evaluated for its Section 3.4 bundle impact before being added (`15-engineering-standards.md` Section 20.3).
- Memoization (`useMemo`/`useCallback`) is applied only in response to a measured re-render cost, never reflexively (`15-engineering-standards.md` Section 10.8).

### 4.11 Bottlenecks

| Bottleneck | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Over-hydrated component trees | High INP, high initial JS | `"use client"` hoisted too high in the tree | Push the boundary down (Section 4.3) |
| Waterfall data fetching | High LCP/TTFB | Sequential `await`s instead of parallel fetching in a Server Component | Parallelize independent data fetches; use Suspense boundaries per-section (Section 4.4) |
| Unoptimized third-party scripts | High INP, main-thread blocking | An unreviewed client-side script added outside Section 4.6's narrow allow-list | Enforce the third-party script review gate |
| Render-blocking web fonts | High CLS, delayed FCP | Fonts not using `next/font`'s self-hosting/subsetting | Section 10.4's font optimization |

### 4.12 Optimization Strategy

Prioritized in order of typical impact-to-effort ratio: (1) confirm Server-Component-by-default discipline is followed (Section 4.3, effectively free once habitual); (2) apply streaming/Suspense boundaries to any route with a slow data dependency (Section 4.4); (3) apply PPP to any cacheable-but-availability-sensitive route (Section 4.5); (4) audit and dynamically import heavy, non-critical-path components (Section 4.6); (5) only then consider component-level memoization (Section 4.10) for a specific, measured hotspot.

### 4.13 Scaling Strategy

Frontend performance scales almost entirely independent of user count, by construction — a Server-Component-rendered, ISR-cached page serves the millionth concurrent visitor at the same per-request cost as the first, since Vercel's edge network (`14-infrastructure-devops-architecture.md` Section 12) serves cached content without re-executing application logic per request. The scaling concern at this layer is therefore not "will it slow down as traffic grows" but "does cache hit rate remain high as the catalog grows" (Section 7.6's cache-invalidation discipline) and "does the CDN's edge footprint keep pace with a growing, more geographically distributed user base" (`14-infrastructure-devops-architecture.md` Section 12.1, a provider-managed property).

### 4.14 Review Checklist

- [ ] Does this route/component follow Section 4.2's rendering-strategy decision tree correctly?
- [ ] Is every Client Component boundary justified and pushed as far down the tree as possible (Section 4.3)?
- [ ] Does this change stay within Section 3.4's bundle budget for its route (verified by CI, Section 4.8)?
- [ ] Are Suspense boundaries used for any independently-loading data section (Section 4.4)?
- [ ] Is every image rendered via `next/image`, never a raw `<img>` (Section 10.3)?

---

# 5. Backend Performance

### 5.1 Purpose

To define how `10-backend-architecture.md`'s layered, modular-monolith architecture is tuned to meet Section 3.2's API latency budgets, at both the individual-request level and under concurrent load.

### 5.2 Request Lifecycle Performance Profile

```
Request arrives at Vercel edge (14-infrastructure-devops-architecture.md §7.2)
      │  ~1-5ms — edge routing
      ▼
Middleware (auth/session check, §6.6 of that document)
      │  ~5-15ms — JWT verification, Redis session-revocation check
      ▼
Pipeline: CORS → Rate Limit → Auth → Authorization → Validation
      │  ~5-20ms — mostly Redis-backed checks (Section 7) and
      │             synchronous Zod validation
      ▼
Service Layer (business logic, ownership checks)
      │  ~5-50ms — depends on orchestration complexity
      ▼
Repository Layer (database query)
      │  ~5-150ms — the dominant cost for most endpoints
      │             (Section 6's optimization target)
      ▼
Response shaping + serialization
      │  ~1-5ms
      ▼
Response returned
```

This profile is why Section 6 (Database Performance) receives this document's deepest optimization attention: for the large majority of endpoints, database query time is the dominant, most variable, and most directly engineer-controllable component of total request latency.

### 5.3 Compute-Layer Performance

Restated from `14-infrastructure-devops-architecture.md` Section 7: Vercel Functions' stateless, auto-scaling execution model (Section 7.4/7.6 of that document) means compute-layer performance is dominated by two factors this document directly addresses — **cold-start latency** (mitigated by keeping Function bundle size lean, Section 5.5) and **per-request execution efficiency** (mitigated by Sections 5.4–5.7's backend-specific optimization techniques), rather than by a fixed "server capacity" ceiling the platform must manually scale.

### 5.4 Synchronous vs. Asynchronous Work

**Rule (restated from `10-backend-architecture.md` Section 12):** any work not required to produce the response the caller is waiting for is deferred to an Inngest background job (Section 11) rather than performed synchronously within the request — sending a confirmation email, updating a search index, computing analytics aggregates are never on a Checkout request's critical path. This is the single most impactful backend-performance architectural decision: it keeps Section 3.2's latency budgets achievable by construction, since the request only ever waits on genuinely necessary synchronous work (the payment verification call, the database write itself).

### 5.5 Function Bundle Size (Cold Start Mitigation)

Backend dependencies are kept lean per Route Handler/Server Action bundle — a large, rarely-used dependency (a heavy PDF-generation library used only by one Admin export feature, for instance) is dynamically imported within the specific handler that needs it rather than imported at a shared module level that would inflate every Function's cold-start bundle, mirroring Section 4.6's frontend dynamic-import discipline applied to backend code.

### 5.6 Parallel Execution

**Rule:** independent operations within a Service Layer function (e.g., fetching a Product and its Creator's storefront policy, which don't depend on each other) are executed in parallel (`Promise.all`-equivalent), never sequentially awaited one after another unless a genuine data dependency requires sequencing — restated as a binding backend-performance convention: sequential `await`s for independent operations are a code-review-blocking finding (feeding `15-engineering-standards.md` Section 25's checklist) since they directly and avoidably inflate Section 5.2's Service Layer latency contribution.

### 5.7 Response Payload Size

API responses are shaped to include only the fields the calling context needs (`15-engineering-standards.md` Section 19.3, `12-security-architecture.md` Section 8.7) — restated here as a performance property, not only a security one: a smaller response payload is faster to serialize, faster to transmit, and faster for the client to parse, meaning the same field-minimization discipline that closes an information-disclosure risk also directly improves Section 3.2's latency budget and Section 3.4's effective data-transfer cost.

### 5.8 Third-Party Integration Latency Isolation

Every third-party call (Razorpay, Resend) is wrapped with a timeout and circuit breaker (`10-backend-architecture.md` Section 17.2–17.5) specifically so a slow or degraded third party cannot silently inflate Section 3.2's latency budget for the requests depending on it beyond a bounded, predictable ceiling — a request depending on a circuit-broken-open integration fails fast (Section 13.6) rather than hanging until the third party's own, potentially much longer, timeout.

### 5.9 Bottlenecks

| Bottleneck | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Sequential awaits | Elevated Service Layer latency | Independent async operations awaited one at a time | Section 5.6's parallel-execution rule |
| Synchronous side effects on the critical path | Elevated request latency, especially for Checkout | Notification/analytics/search-index logic not deferred to Inngest | Section 5.4's async-by-default rule |
| Large Function cold starts | Elevated p99 latency, especially after low-traffic periods | Heavy dependencies imported at the module level | Section 5.5's lean-bundle discipline |
| Third-party call hangs | Elevated p99/p999 latency, occasional timeouts | Missing or misconfigured timeout/circuit breaker | Section 5.8 |

### 5.10 Optimization Strategy

Prioritized: (1) confirm Section 5.4's sync/async split is correct for any new endpoint (highest impact, since it directly determines what's even on the latency-critical path); (2) confirm Section 5.6's parallelization for any multi-step Service Layer function; (3) profile and address Section 6's database-layer cost, which dominates most remaining latency; (4) only then consider Function-bundle-level optimization (Section 5.5) for a specific, measured cold-start problem.

### 5.11 Scaling Strategy

Restated from `14-infrastructure-devops-architecture.md` Section 7.6/18.2: compute scales automatically and horizontally with Vercel's platform model — the backend-performance-architecture contribution to scaling is ensuring each individual request stays efficient (Sections 5.4–5.8) so that a given traffic volume requires proportionally less aggregate compute, directly and favorably affecting `14-infrastructure-devops-architecture.md` Section 20.2's cost-per-request driver as traffic grows.

### 5.12 Review Checklist

- [ ] Is any work not required for the response deferred to a background job (Section 5.4)?
- [ ] Are independent async operations executed in parallel, not sequentially (Section 5.6)?
- [ ] Does the response payload include only necessary fields (Section 5.7)?
- [ ] Is every third-party call wrapped with a timeout and circuit breaker (Section 5.8)?

---

# 6. Database Performance

### 6.1 Purpose

To expand `08-database-design.md` Section 27's indexing strategy and `10-backend-architecture.md` Section 10's Repository Layer architecture into the platform's most consequential, deepest performance-tuning discipline — restated from Section 5.2, the database is the dominant latency contributor for most requests, making this section this document's highest-leverage.

### 6.2 Query Optimization Principles

Restated and expanded from `15-engineering-standards.md` Section 13: (1) select only needed columns (Section 13.3 of that document); (2) use Drizzle's relational query API for related data, never N+1 loop-issued queries (Section 13.4); (3) every query against a high-volume table is `EXPLAIN ANALYZE`-reviewed before merge (Section 20.2 of that document); (4) cursor-based pagination exclusively (Section 12.4 of this document).

### 6.3 Index Strategy

Restated from `08-database-design.md` Section 27 as this document's performance-architecture confirmation: every foreign key has a covering index by default (required for efficient join and cascade-delete performance); every column appearing in a `WHERE` clause across the platform's documented query patterns (`09-api-architecture.md`'s filter/sort catalog) has a matching index, including composite indexes for common multi-column filter combinations (category + price range, per `04-information-architecture.md` Section 11's filter combinations); and every index's actual usage is periodically reviewed (Section 6.7) to catch both **missing** indexes (a slow query revealing a gap) and **unused** indexes (write-amplification cost with no corresponding read benefit, a real cost this document does not ignore).

### 6.4 N+1 Query Prevention

**What the rule is:** restated as this document's performance-critical restatement of `15-engineering-standards.md` Section 13.4 and `10-backend-architecture.md` Section 10.7: a database call inside a loop is never acceptable. **Why it's here, specifically, at this level of emphasis:** N+1 queries are the single most common, most severe, and most easily-introduced database performance defect in any ORM-based codebase, and their cost scales *with the data itself* — a query pattern that's imperceptibly slow with 10 test-fixture rows becomes catastrophically slow with the thousands of rows a real Product listing or Order history will contain at scale (directly threatening Section 3.3's budget precisely as the platform grows, which is exactly when it's hardest to fix reactively). **Enforcement:** a lint rule flags database calls within loop constructs; `13-testing-strategy.md` Section 13.7's `EXPLAIN ANALYZE` review is the second, human-judgment layer.

### 6.5 Connection Pooling

Restated from `14-infrastructure-devops-architecture.md` Section 8.3: every application connection passes through Supabase's transaction-pooling connection pooler, never a direct connection — this document's performance-specific addition is that pooler efficiency (fast connection acquisition, minimal idle-connection overhead) directly contributes to Section 5.2's request-lifecycle latency profile, making pooler configuration (transaction vs. session mode, pool size) a genuine performance-tuning lever reviewed as part of Section 14's capacity planning, not merely an infrastructure-provisioning detail.

### 6.6 Read/Write Optimization

Restated from `08-database-design.md` Section 2.5's read-heavy optimization philosophy: the platform's dominant traffic pattern (catalog browsing, per `01-product-requirements.md`'s persona research) is read-heavy by a wide margin, and Section 6.3's indexing and Section 7's caching strategy are both weighted accordingly — write-path performance (Section 3.2's Checkout/mutation budget) receives correspondingly focused, but narrower, optimization attention proportional to its lower relative traffic volume but higher per-request consequence (a slow checkout write directly costs a conversion, per Section 2.1's philosophy).

### 6.7 Database Monitoring for Performance

Restated from `14-infrastructure-devops-architecture.md` Section 8.9 with this document's performance-specific lens: slow-query logs are reviewed on a regular cadence (Section 14.7), specifically hunting for queries approaching or exceeding Section 3.3's budget table, with every flagged query resulting in either an index addition (Section 6.3), a query restructure (Section 6.2), or — if the query is fundamentally expensive by nature (a complex analytics aggregation) — a migration to Section 7's caching layer or a pre-computed, asynchronously-maintained read model (mirroring `08-database-design.md`'s `SearchIndex`/`Autocomplete` read-model pattern applied to any other similarly expensive-to-compute-on-demand data).

### 6.8 Materialized/Denormalized Read Models

Where a query pattern is both high-frequency and inherently expensive to compute from normalized data on every request (search relevance ranking, Section 9; analytics aggregation, `10-backend-architecture.md` Section 5's Analytics module), the platform maintains a denormalized, asynchronously-updated read model (per `08-database-design.md` Section 2.3's measured, not speculative, denormalization philosophy) rather than computing the expensive result synchronously on every request — this trades a small amount of eventual-consistency latency (the read model updates via Inngest, Section 11, shortly after the underlying write) for a dramatic, measured improvement in read-path latency for the platform's highest-value, highest-frequency queries.

### 6.9 Bottlenecks

| Bottleneck | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Missing index | Slow, table-scanning queries; latency growing with table size | A query pattern not anticipated by `08-database-design.md`'s original index set | Add a targeted index (Section 6.3), verified via `EXPLAIN ANALYZE` |
| N+1 queries | Latency scaling with result-set size in a way a single query wouldn't | A loop issuing a query per iteration instead of one relational/batched query | Section 6.4's prevention discipline |
| Connection pool exhaustion | Elevated latency or connection errors under concurrent load | Traffic growth outpacing the provisioned pooler tier | `14-infrastructure-devops-architecture.md` Section 18.3's proactive tier-upgrade process |
| Expensive on-demand aggregation | Slow Analytics/Search responses | Computing a complex aggregate synchronously per request | Section 6.8's denormalized read-model pattern |
| Lock contention on a hot row | Elevated write latency under concurrent load (e.g., inventory decrement) | High-concurrency writes to the same row (`08-database-design.md` Section 9's Reservation model) | The Reservation-based concurrency pattern that document already defines, verified under load (Section 15.4) |

### 6.10 Optimization Strategy

Prioritized: (1) eliminate any N+1 pattern (Section 6.4) — highest severity, since its cost compounds with scale; (2) confirm correct index coverage for every new query pattern (Section 6.3) before it ships, not after a slow-query alert; (3) for genuinely expensive, high-frequency aggregate queries, evaluate a denormalized read model (Section 6.8); (4) tune connection-pool configuration (Section 6.5) as a capacity-planning response to measured, growing contention, not a speculative pre-emptive change.

### 6.11 Scaling Strategy

Restated from `14-infrastructure-devops-architecture.md` Section 18.3's capacity-tiered table: database compute/connection capacity is the platform's most deliberately, proactively managed scaling constraint (unlike Section 5.11's largely-automatic compute scaling). Section 14.4 of this document extends that table with the query-optimization dimension: a well-indexed, N+1-free query pattern (Sections 6.3–6.4) means a given database tier serves materially more traffic before requiring an upgrade than an unoptimized equivalent — query discipline is therefore itself a scaling lever, not merely a latency one, directly reducing how soon and how often a costly database-tier upgrade (`14-infrastructure-devops-architecture.md` Section 20.2) becomes necessary.

### 6.12 Review Checklist

- [ ] Does every new Repository function select only necessary columns (Section 6.2)?
- [ ] Is there a database call inside a loop anywhere in this change (Section 6.4)?
- [ ] Does a new query against a high-volume table have `EXPLAIN ANALYZE` evidence of correct index usage (Section 6.3)?
- [ ] Is a genuinely expensive, high-frequency aggregate query a candidate for Section 6.8's read-model pattern rather than on-demand computation?
- [ ] Is pagination cursor-based, never offset-based (Section 12.4)?

---

# 7. Caching Strategy

### 7.1 Purpose

To consolidate every caching layer across the platform — browser, CDN/edge, application (Redis), and database query-plan caching — into one coherent strategy, since these layers are individually specified in `10-backend-architecture.md` Section 13–14 and `11-frontend-architecture.md` Sections 7, 9.10, but their *interaction* (what happens when one layer's cache is stale relative to another's) is this document's specific responsibility.

### 7.2 The Cache Hierarchy

```
Browser Cache (Section 7.3)
      │  fastest, most local, shortest-lived for dynamic content
      ▼
CDN / Edge Cache (Section 8)
      │  Vercel Edge Network + Cloudflare, per 14-infrastructure-
      │  devops-architecture.md §12
      ▼
Application Cache (Upstash Redis, Section 7.5)
      │  server-side, shared across all Function instances
      ▼
Database Query Plan Cache (Postgres-internal, Section 7.7)
      │  lowest layer, provider-managed
      ▼
Database (source of truth)
```

A request is served from the highest (fastest) layer that holds valid, sufficiently-fresh data for it — this hierarchy is the platform's primary latency-reduction mechanism, since every layer a request is served from above the database itself avoids that layer's full query cost (Section 6).

### 7.3 Browser Caching

Static assets (Section 4.8's bundle output) use long-lived, immutable `Cache-Control` headers enabled by content-hashed filenames (`14-infrastructure-devops-architecture.md` Section 12.2) — a returning visitor's browser serves these with zero network round-trip. Personalized/dynamic content (Cart, Account, Checkout) is explicitly marked `private, no-store` (that document's Section 12.4), preventing any shared cache layer from inadvertently serving one user's personalized content to another — a correctness requirement that takes priority over the latency benefit caching would otherwise offer for this content category.

### 7.4 CDN/Edge Caching

Fully specified in Section 8; summarized here as this hierarchy's second layer: ISR-revalidated pages (Section 4.2) are cached at Vercel's edge with a `stale-while-revalidate` policy, serving instantly from cache while refreshing in the background — this is the layer that makes Section 3.1's LCP target achievable for the platform's highest-traffic catalog pages even under significant concurrent load, since the overwhelming majority of requests for a popular Category or Product page are served without touching the Application or Database layers at all.

### 7.5 Application (Redis) Caching

Restated from `10-backend-architecture.md` Section 13–14 with this document's performance lens: Upstash Redis caches computed, expensive-to-derive results (a Product listing query's result set, a computed Analytics summary) with the per-category TTL strategy `11-frontend-architecture.md` Section 9.10 defines — this is the layer that protects Section 6's database from repeated identical or near-identical query load, particularly valuable for data that's expensive to query but doesn't need CDN-layer public cacheability (e.g., a specific buyer's personalized-but-cacheable-for-a-few-seconds recommendation set).

### 7.6 Cache Invalidation Strategy

**The hardest problem in this section, addressed explicitly:** restated from `10-backend-architecture.md` Section 14.4 and `11-frontend-architecture.md` Section 7.4's webhook-triggered on-demand ISR revalidation: every cache layer is invalidated **explicitly, by the write path that changes the underlying data**, never relied upon to become consistent purely through TTL expiry for data where staleness would be user-visible in a confusing way (a Creator publishing a Product and not seeing it appear, `10-backend-architecture.md` Section 13.3's named example). The write path (a Service Layer function) is responsible for triggering: (1) Redis cache-key invalidation for any Application-layer cache the write affects; (2) an on-demand ISR revalidation call for any CDN-cached page the write affects. Both are triggered from the same transaction-committed point (`15-engineering-standards.md` Section 12.3's ordering rule), never from a client-side action alone.

### 7.7 Database Query Plan Caching

Postgres's own internal query-plan caching (a provider-managed property of Supabase's infrastructure) benefits from query *consistency* — the same parameterized query shape (Drizzle's parameterization, `12-security-architecture.md` Section 9.2) issued repeatedly allows Postgres to reuse a cached execution plan rather than re-planning from scratch each time — restated here as a performance-relevant reason (beyond the already-established security reason) that ad hoc, hand-constructed query variants are avoided in favor of the platform's standard, consistent Repository-function query patterns (`15-engineering-standards.md` Section 13.2).

### 7.8 Cache Consistency vs. Cache Hit Rate Trade-off

Every cache category's TTL (`11-frontend-architecture.md` Section 9.10's table) represents a deliberate trade-off between freshness and hit rate — restated here as this document's explicit framing: a shorter TTL improves consistency at the cost of more frequent cache misses (and therefore more database load, Section 6); a longer TTL improves hit rate and reduces database load at the cost of a larger window of potential staleness. This trade-off is made explicitly, per data category, based on how consequential staleness would be for that specific category (near-zero tolerance for Cart contents or live availability; higher tolerance for a Creator's aggregate rating, which changes slowly and where a few seconds of staleness has no meaningful user impact).

### 7.9 Cache Stampede Prevention

**Rule:** for high-traffic cache keys (a popular Product's listing data), the platform avoids the "thundering herd" pattern where a cache expiry causes many concurrent requests to simultaneously miss and simultaneously recompute the same expensive result — implemented via `stale-while-revalidate` semantics (Section 7.4's CDN layer) and, at the Redis layer, a brief "recomputation in progress" lock so only one request recomputes a freshly-expired key while concurrent requests are served the just-expired (still acceptable) value rather than all independently hitting the database simultaneously.

### 7.10 Bottlenecks

| Bottleneck | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Low cache hit rate | Database load higher than expected for the traffic volume | TTLs too short, or cache keys too granular/fragmented (e.g., keying by a high-cardinality field unnecessarily) | Review TTL/key-design against Section 7.8's trade-off framework |
| Stale data user-visibly served | User-reported "I don't see my change" issues | Missing explicit invalidation on a specific write path (Section 7.6) | Audit every Service Layer write function for corresponding cache/ISR invalidation |
| Cache stampede | Latency/load spikes correlated with a specific cache key's expiry | No stampede protection on a high-traffic key (Section 7.9) | Apply stale-while-revalidate/locking to the affected key |

### 7.11 Optimization Strategy

Prioritized: (1) ensure every new expensive, repeatable query has a corresponding cache entry (Section 7.5) before considering database-level optimization alone; (2) ensure every write path affecting cached data has explicit invalidation (Section 7.6) — a cache without correct invalidation is worse than no cache, since it introduces a correctness bug in exchange for a performance gain; (3) tune TTLs (Section 7.8) based on measured hit-rate and staleness-tolerance data, not guessed values.

### 7.12 Scaling Strategy

Restated from `14-infrastructure-devops-architecture.md` Section 18.5: caching is itself a deliberate scaling lever — every request served from Section 7.2's hierarchy above the database is a request the database never sees, meaning cache hit rate directly and favorably affects Section 6.11's database-scaling timeline. As traffic grows, cache hit rate (Section 16.3) is monitored specifically for degradation, and TTL/key-design tuning (Section 7.11) is revisited before the database tier is upgraded reactively.

### 7.13 Review Checklist

- [ ] Does a new expensive, repeatable query have a corresponding cache entry (Section 7.5)?
- [ ] Does every write path affecting cached/ISR-cached data include explicit invalidation (Section 7.6)?
- [ ] Is the chosen TTL for new cached data justified against Section 7.8's freshness/hit-rate trade-off?
- [ ] Is a high-traffic cache key protected against stampede (Section 7.9)?

---

# 8. CDN Strategy

### 8.1 Purpose

To expand `14-infrastructure-devops-architecture.md` Section 12's CDN/asset-delivery infrastructure specification into this document's performance-optimization lens — that document defines *what* is provisioned; this section defines *how it's tuned* for Section 3.1's Core Web Vitals budget.

### 8.2 Edge Network Architecture

Restated from `14-infrastructure-devops-architecture.md` Sections 3.2, 12.1: Vercel's global edge network serves application content (HTML/RSC payloads, static bundles); Cloudflare's CDN fronts R2-sourced media (Section 10). Both networks serve content from a Point of Presence geographically close to the requesting user, directly reducing the network round-trip-time component of Section 3.1's TTFB/LCP budget for users outside the platform's primary compute region (Section 5.3's region choice affects only dynamic, non-cached compute — cached content is served from edge regardless of where the origin compute region sits).

### 8.3 Cache-Control Policy (Performance-Tuning View)

Restated from `14-infrastructure-devops-architecture.md` Section 12.4's table, with this document's tuning rationale: `stale-while-revalidate` is used specifically wherever the underlying content is cacheable (ISR-revalidated catalog pages) so that a cache-refresh operation *never* blocks the user who triggered it — that user is served the immediately-available stale content while the refresh happens in the background for the *next* request, directly protecting Section 3.1's LCP budget from ever regressing due to a cache-refresh event.

### 8.4 Edge Middleware Performance

Restated from `11-frontend-architecture.md` Section 7.3: auth/session checks run on Vercel's Edge Runtime specifically for its lower cold-start latency, since this middleware executes on every single request regardless of downstream caching — its own latency contribution (Section 5.2's first pipeline stage) is minimized by keeping this code path as lean as possible (a JWT verification and a Redis lookup, nothing more), since any inefficiency here is paid by every request platform-wide, cached or not.

### 8.5 Geographic Distribution

The platform's primary launch market (`00-project-vision.md`) determines Section 5.3's compute-region choice, but Section 8.2's edge caching means the *cached-content* experience for geographically distant users (a future international buyer, per `04-information-architecture.md` Section 21's reserved future readiness) is already substantially mitigated by CDN edge presence, even before any future multi-region compute expansion (`14-infrastructure-devops-architecture.md` Section 25) is warranted — restated here as a performance-architecture observation feeding that document's future-evolution trigger conditions.

### 8.6 Cache Purging and Origin Shielding

Restated from `14-infrastructure-devops-architecture.md` Section 12.5: on-demand ISR revalidation (Section 7.6) is preferred over broad cache purging for routine content updates; a full purge is reserved for exceptional cases. Origin-shielding (a single edge location consolidating multiple nearby PoPs' cache-miss requests into one origin request rather than each PoP independently hitting origin) is enabled where the CDN provider supports it, directly reducing Section 6's database load during a cache-cold period (e.g., immediately following a deployment or a purge event) by preventing a multiplied cache-miss stampede across many edge locations simultaneously.

### 8.7 Bottlenecks

| Bottleneck | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Low edge cache hit ratio for catalog pages | Elevated origin (compute+database) load, degraded LCP for cache-missed requests | Overly short ISR revalidation window, or excessive on-demand revalidation frequency | Tune the revalidation window against Section 7.8's freshness trade-off |
| Slow Edge Middleware | Elevated TTFB platform-wide, even for otherwise-cached content | Middleware performing unnecessary work beyond the minimal auth/session check | Audit and lean out Section 8.4's middleware logic |
| Cache-miss stampede after deployment/purge | Temporary origin-load spike immediately post-deployment | No origin shielding, or an overly aggressive full-purge-on-deploy pattern | Section 8.6's origin shielding and on-demand-revalidation-over-purge preference |

### 8.8 Optimization Strategy

Prioritized: (1) confirm Section 8.3's Cache-Control policy is correctly applied per content type (the highest-leverage, lowest-effort lever); (2) confirm Section 8.4's middleware stays minimal; (3) enable origin shielding (Section 8.6) if not already default at the platform's CDN tier; (4) monitor and tune ISR revalidation windows (Section 7.8) based on measured hit-rate data (Section 16.3), not a one-time initial guess left unrevisited.

### 8.9 Scaling Strategy

CDN/edge capacity scales automatically and transparently with the provider's own global network growth (`14-infrastructure-devops-architecture.md` Section 2.1's managed-services philosophy) — the platform's own scaling responsibility at this layer is entirely about maximizing cache hit rate (Section 8.3, 7.8) as traffic and catalog size grow, since a higher hit rate means the CDN absorbs a proportionally larger share of growing traffic without any corresponding growth in origin (compute/database) load.

### 8.10 Review Checklist

- [ ] Does new cacheable content have a correctly-scoped `Cache-Control` policy (Section 8.3)?
- [ ] Does any new Edge Middleware logic remain minimal and fast (Section 8.4)?
- [ ] Is on-demand revalidation used in preference to broad purging for this change (Section 8.6)?

---

# 9. Search Performance

### 9.1 Purpose

To define how the Search module (`10-backend-architecture.md` Section 5.18, `08-database-design.md` Section 24) meets Section 3.2's search-specific latency budget and Section 3.3's search-query database budget, since search is the platform's primary discovery mechanism (`04-information-architecture.md` Section 10) and a slow search experience directly undermines the buyer discovery journeys `03-user-journeys.md` Section 3.4 describes.

### 9.2 Search Architecture (Performance View)

Restated from `08-database-design.md` Section 24 and `13-testing-strategy.md` Section 19: search does not query normalized `Product`/`Store` tables directly on every request — it queries a purpose-built, denormalized `SearchIndex` read model (Section 6.8's pattern applied specifically here), asynchronously maintained by an Inngest job (Section 11.2's `search-indexing` family) whenever underlying Product/Store data changes. This is the single most important search-performance architectural decision: it decouples search-query latency entirely from the cost of the normalized schema's join complexity.

### 9.3 Full-Text Query Optimization

Postgres's native full-text search capability (`tsvector`/`tsquery`, per `08-database-design.md` Section 24) is indexed via a GIN index on the `SearchIndex` table's searchable-text column, giving sub-100ms query performance (Section 3.3) even as catalog size grows into the hundreds of thousands of listings — restated here as the specific mechanism that makes Section 3.3's search-query budget achievable without requiring a separate, dedicated search-engine infrastructure component at the platform's current and near-term scale.

### 9.4 Autocomplete Performance

The `Autocomplete` table (`08-database-design.md` Section 24.4) is a further-specialized, even more narrowly-optimized read model specifically for the sub-Section-3.2 latency this interaction demands (a user typing expects near-instantaneous suggestion feedback, tighter than a full search-results-page load) — pre-computed and indexed for prefix-matching performance, refreshed asynchronously on the same `search-indexing` job cadence as the main `SearchIndex`.

### 9.5 Filter and Facet Performance

Structured filter combinations (category × price range × material, per `04-information-architecture.md` Section 11) are served by composite indexes on the `SearchIndex` table covering the platform's documented, common filter-combination patterns (`13-testing-strategy.md` Section 19.4's combinatorial testing approach directly validates this) — an uncommon, long-tail filter combination not covered by a composite index still functions correctly (Postgres falls back to a less-optimal but still-indexed query plan), just without the same tightest-tier latency guarantee as the platform's most common combinations.

### 9.6 Index Freshness vs. Query Performance Trade-off

Restated from `13-testing-strategy.md` Section 19.4: search-index updates are asynchronous (Section 9.2), meaning there is a small, bounded window between a Product being published and it becoming searchable — this is a deliberate trade-off, explicitly the same freshness-vs-hit-rate framing as Section 7.8, applied here specifically: synchronous index updates on every write would slow the write path (Product publish) to protect a read-path guarantee (instant searchability) that isn't actually required by any documented user journey (`03-user-journeys.md` doesn't require sub-second publish-to-searchable latency), so the asynchronous approach is the correct, deliberate choice, not an unaddressed gap.

### 9.7 Search Result Ranking Performance

Ranking (relevance + recency/popularity boosts, `10-backend-architecture.md` Section 14.3) is computed as part of the same indexed query rather than as a separate post-query sorting pass over an unbounded result set — the `SearchIndex`'s denormalized structure includes pre-computed ranking-input fields (recency, `unitsSold`) specifically so ranking can be expressed as an efficient, indexed `ORDER BY` rather than requiring an expensive runtime join to compute those inputs per query.

### 9.8 Bottlenecks

| Bottleneck | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Slow full-text queries | Search latency exceeding Section 3.3's budget | Missing or degraded GIN index; query not using the indexed `SearchIndex` table | Verify index health and query plan (Section 6.7's monitoring extended to Search specifically) |
| Stale search results | Buyer-reported "I published this but can't find it" | Search-indexing job backlog or failure (`13-testing-strategy.md` Section 17's job-reliability testing) | Monitor `search-indexing` job queue depth (`14-infrastructure-devops-architecture.md` Section 16.3) |
| Slow filter combinations | Elevated latency for specific, uncommon filter combinations | No composite index covering that specific combination | Add a targeted composite index if the combination proves common enough to warrant it (Section 6.3's measured-need discipline) |

### 9.9 Optimization Strategy

Prioritized: (1) confirm the `SearchIndex`/`Autocomplete` read-model pattern (Section 9.2) is used for every search-adjacent query, never a live query against normalized tables; (2) verify GIN/composite index coverage (Sections 9.3, 9.5) against actual, measured query patterns; (3) monitor and tune the `search-indexing` job's throughput (Section 11) as catalog size grows, ensuring Section 9.6's freshness window stays within an acceptable, documented bound even at scale.

### 9.10 Scaling Strategy

Search-query performance scales sub-linearly with catalog growth specifically because of Section 9.2's indexed-read-model architecture — a GIN-indexed full-text query's cost grows far more slowly with table size than an unindexed equivalent would. The genuine scaling concern at this layer is the *indexing* pipeline's own throughput (Section 11.7's job-concurrency tuning) keeping pace with catalog growth rate, monitored and tuned proactively per `14-infrastructure-devops-architecture.md` Section 18.6–18.7's cadence.

### 9.11 Review Checklist

- [ ] Does a new search-adjacent feature query the `SearchIndex`/`Autocomplete` read models, never normalized tables directly (Section 9.2)?
- [ ] Is a new common filter combination covered by an appropriate composite index (Section 9.5)?
- [ ] Is Section 9.6's freshness window still within its documented, acceptable bound (verified via monitoring, Section 16)?

---

# 10. Media Performance

### 10.1 Purpose

To expand `11-frontend-architecture.md` Section 16.5 and `10-backend-architecture.md` Section 11's media pipeline into this document's full media-performance optimization strategy, since product/creator photography (`06-design-system.md` Section 9) is the platform's highest-bandwidth content category by a wide margin.

### 10.2 Upload Performance

Restated from `12-security-architecture.md` Section 14.1 and `14-infrastructure-devops-architecture.md` Section 9.3: uploads go directly browser-to-R2 via pre-signed URLs, never proxied through a Vercel Function — this is both a security and a performance decision, since routing large file uploads through application compute would consume Function execution time/duration budget (Section 5.3) for a transfer that has no need to pass through application logic at all.

### 10.3 Responsive Image Delivery

`next/image` generates responsive, format-negotiated (AVIF/WebP-with-fallback) variants at request time, combined with R2-sourced pre-generated responsive breakpoint widths at upload time (`11-frontend-architecture.md` Section 16.5) — this two-stage approach means a mobile buyer on a constrained connection downloads a materially smaller image payload than a desktop buyer viewing the same Product, directly protecting Section 3.1's mobile-weighted LCP budget (`13-testing-strategy.md` Section 13.3's "simulated median mobile connection" measurement context).

### 10.4 Font Optimization

Restated from `11-frontend-architecture.md` Section 16.6: `next/font` self-hosts and subsets both the serif and sans typeface roles (`06-design-system.md` Section 4.2) at build time, eliminating render-blocking third-party font requests and applying `font-display: swap` with a matched fallback-metric override — this is Section 3.1's CLS budget's most direct mitigation, since unmanaged custom web fonts are among the most common real-world causes of layout shift as text reflows once a custom font finally loads.

### 10.5 Media Processing Pipeline Performance

The asynchronous media-processing job (`10-backend-architecture.md` Section 12.4's `media-processing` family, `12-security-architecture.md` Section 14.4's malware-scanning pipeline) generates responsive variants and completes validation off the critical path of the upload request itself — a creator's upload confirmation is not blocked waiting for the full processing pipeline to complete, consistent with Section 5.4's async-by-default backend-performance principle applied specifically to media handling.

### 10.6 Video/Rich Media (Future Scope Note)

Current v2 scope is image-dominant; any future video or richer media format (per `01-product-requirements.md` Section 14's stated out-of-scope list) would require its own dedicated streaming/transcoding performance strategy not covered by this section's image-optimized architecture — flagged here explicitly so a future feature proposing video support triggers a deliberate extension of this document rather than assuming the existing image pipeline's performance characteristics apply unchanged.

### 10.7 Bottlenecks

| Bottleneck | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Oversized image payloads | Elevated LCP, especially on mobile | Missing responsive variant for the requested viewport, or a raw `<img>` bypassing `next/image` | Enforce `next/image` usage (Section 4.9); verify responsive breakpoint generation (Section 10.3) |
| Layout shift from images | Elevated CLS | Missing explicit width/height on an image element | Enforce explicit dimensions as part of Section 20's review checklist |
| Slow media-processing pipeline | Delayed availability of newly-uploaded media at full quality/variant coverage | `media-processing` job backlog | Monitor and tune job concurrency (`14-infrastructure-devops-architecture.md` Section 11.7) |

### 10.8 Optimization Strategy

Prioritized: (1) confirm every image uses `next/image` with correct responsive configuration (Section 10.3); (2) confirm explicit dimensions are always specified to prevent CLS; (3) confirm the direct-to-R2 upload path (Section 10.2) is used for any new upload feature, never a Function-proxied alternative.

### 10.9 Scaling Strategy

Media delivery scales via Section 8's CDN architecture largely independent of catalog size for any individual request (a cached, CDN-served image costs the same to serve regardless of total catalog size) — the genuine scaling concern is aggregate storage growth (`14-infrastructure-devops-architecture.md` Section 20.3's R2 cost driver) and media-processing job throughput (Section 10.5) keeping pace with upload volume growth, both monitored and capacity-planned per Section 14.

### 10.10 Review Checklist

- [ ] Does every image use `next/image`, never a raw `<img>` tag (Section 10.3)?
- [ ] Does every image element specify explicit dimensions to prevent CLS?
- [ ] Does any new upload feature use the direct-to-R2 pattern, never a Function-proxied upload (Section 10.2)?

---

# 11. Background Jobs Performance

### 11.1 Purpose

To define how `10-backend-architecture.md` Section 12's Inngest-based job architecture is tuned for throughput and latency, since background-job performance directly determines Section 9.6's search-freshness window, notification delivery timeliness, and payout-batch completion time — all user-visible outcomes even though the jobs themselves run off the request-response critical path (Section 5.4).

### 11.2 Job Family Performance Profiles

| Job Family | Latency Sensitivity | Throughput Profile | Primary Performance Concern |
|---|---|---|---|
| `notifications` | Medium — buyers expect timely order updates | High volume, bursty (correlated with order volume) | Resend API rate limits (`14-infrastructure-devops-architecture.md` §18.4) |
| `search-indexing` | Medium — affects Section 9.6's freshness window | Steady, correlated with catalog change rate | Indexing-job execution speed vs. write volume |
| `media-processing` | Low-medium — affects time-to-full-quality-availability | Bursty (correlated with upload volume, e.g., a creator bulk-uploading a new collection) | Malware-scanning service throughput (an external dependency) |
| `payouts` | Low — batch, scheduled, not real-time-sensitive | Scheduled, predictable volume | Correct, complete aggregation within the scheduled window |
| `analytics` | Low — near-real-time acceptable, not instant | Steady, high volume (every significant event) | Aggregate computation efficiency at scale |
| `cleanup` | Very low — background maintenance | Low, scheduled | Doesn't compete with higher-priority job families for concurrency budget |

### 11.3 Concurrency Tuning

Restated from `14-infrastructure-devops-architecture.md` Section 11.7: per-family concurrency ceilings are tuned to each family's downstream dependency capacity, not set uniformly — `media-processing`'s ceiling respects the malware-scanning service's own throughput limit; `notifications`' ceiling respects Resend's account-tier sending rate. This document's specific performance addition: concurrency ceilings are revisited whenever Section 11.2's throughput profile changes materially (a growing order volume increasing `notifications` load), following the same proactive-review cadence as Section 14's capacity planning generally.

### 11.4 Job Execution Efficiency

Each job step (`10-backend-architecture.md` Section 12.2's step-based model) is kept small and independently retryable — restated here as a performance rather than reliability rationale: smaller, more granular steps mean a transient failure's retry cost is bounded to that specific step's work, not a larger unit of work that would need to be redone in full, directly protecting overall job-family throughput under a partial-failure/retry scenario.

### 11.5 Batch Processing Optimization

Scheduled, batch-oriented jobs (payout batching, cleanup sweeps) process their working set using Section 6.2's query-optimization discipline (batched, indexed queries — never row-by-row processing that would reintroduce Section 6.4's N+1 pattern within the job itself) — a payout batch job computing payouts for thousands of creators uses set-based SQL aggregation wherever possible rather than iterating and querying per creator.

### 11.6 Event-Driven vs. Polling

Restated from `10-backend-architecture.md` Section 12.1: jobs are triggered by events (Section 5.4's emission pattern), never by a polling loop checking for work — polling wastes compute cycles checking for work that usually isn't there and introduces an inherent latency floor equal to the poll interval; event-driven triggering has near-zero latency overhead and no wasted idle-check compute, a direct performance (and cost, `14-infrastructure-devops-architecture.md` Section 20.2) advantage of the platform's chosen architecture.

### 11.7 Bottlenecks

| Bottleneck | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Job queue backlog | Growing delay between trigger and execution for a specific family | Concurrency ceiling too low for current volume, or a downstream dependency slowdown | Tune concurrency (Section 11.3) or investigate the downstream dependency (Section 5.8's circuit-breaker signal) |
| Row-by-row batch processing | Slow scheduled-job completion, risk of missing its scheduled window | A batch job not using set-based query optimization (Section 11.5) | Refactor to batched, indexed queries |
| Downstream rate-limit throttling | Elevated retry rate for a specific job family | Job throughput exceeding a third party's own rate limit (e.g., Resend) | Coordinate concurrency ceiling with the third party's documented limit; consider a tier upgrade if genuinely traffic-driven |

### 11.8 Optimization Strategy

Prioritized: (1) confirm event-driven triggering (Section 11.6) for any new job, never polling; (2) confirm batch jobs use set-based query patterns (Section 11.5); (3) tune concurrency ceilings (Section 11.3) based on measured queue-depth and downstream-capacity data, not a one-time default left unrevisited as volume grows.

### 11.9 Scaling Strategy

Restated from `14-infrastructure-devops-architecture.md` Section 18.6: Inngest's execution model scales throughput largely automatically within Section 11.3's concurrency configuration, which is itself the deliberate scaling lever revisited per Section 14's capacity-review cadence — the job-family-specific downstream dependencies (Resend, the malware scanner) are frequently the actual scaling constraint before Inngest's own orchestration capacity is, making Section 23 (in `14-infrastructure-devops-architecture.md`) third-party-tier planning as relevant to background-job scaling as Inngest's own configuration.

### 11.10 Review Checklist

- [ ] Is a new job event-driven, never polling-based (Section 11.6)?
- [ ] Does a new batch job use set-based, indexed query patterns rather than row-by-row processing (Section 11.5)?
- [ ] Is the job's concurrency ceiling appropriately scoped to its actual downstream dependency capacity (Section 11.3)?

---

# 12. API Performance

### 12.1 Purpose

To consolidate this document's frontend (Section 4), backend (Section 5), and database (Section 6) performance architecture into the single, holistic view of what determines Section 3.2's per-endpoint latency budget — the API is where all of those layers' individual contributions are experienced together, by both first-party frontend consumers and, in the future, any external integration.

### 12.2 Response Time Budget by Operation Type (Consolidated)

Restated from Section 3.2 with this section's added architectural mapping — which layer's optimization is most responsible for each category meeting its budget:

| Operation Type | Budget (p95) | Primary Responsible Layer |
|---|---|---|
| Simple reads (single-entity lookup) | Under 100ms | Section 6 (indexed primary-key lookup) |
| List/filtered reads | Under 200ms | Sections 6–7 (indexed query + cache) |
| Writes (non-payment) | Under 400ms | Section 5 (Service Layer efficiency, async side-effect deferral) |
| Payment-verifying writes | Under 1.5s | Section 5.8 (third-party latency isolation) |
| Search | Under 100ms (query itself); page-level budget per Section 3.1 | Section 9 |

### 12.3 Rate Limiting as a Performance Protection

Restated from `12-security-architecture.md` Section 8.3 with this document's performance framing: rate limiting is not only an abuse-prevention control — it is a performance-protection mechanism, ensuring no single caller (whether malicious or simply misbehaving) can consume a disproportionate share of Section 3.2's latency budget's underlying capacity (database connections, Section 6.5; compute, Section 5.3) at the expense of every other concurrent user.

### 12.4 Pagination Performance

**Rule (restated from `09-api-architecture.md` Section 2.7 and `15-engineering-standards.md` Section 13.6):** every list endpoint uses cursor-based (keyset) pagination exclusively — never `OFFSET`-based pagination. **Why this matters at the performance-architecture level:** `OFFSET`-based pagination's cost grows linearly with the offset depth (the database must still scan and discard every skipped row), meaning a buyer paging deep into a large result set experiences steadily degrading performance exactly as the platform's catalog grows — the scenario `00-project-vision.md` Section 15's scale ambition makes not just plausible but expected. Cursor-based pagination's cost is constant regardless of position within the result set, making it the only pagination strategy compatible with this document's scaling philosophy (Section 2.5).

### 12.5 Infinite Scroll vs. Load-More Performance

Restated from `13-testing-strategy.md` Section 19's search-testing context and `06-design-system.md` Section 25.4: the platform's default is an explicit, user-triggered "Load more" action rather than automatic infinite scroll — restated here with a performance rationale layered on top of the already-established UX rationale: explicit-trigger pagination bounds how much content and how many concurrent in-flight requests a single browsing session can generate, whereas automatic infinite scroll (especially combined with fast scrolling) can trigger request bursts that stress both client-side rendering performance and server-side request volume without a corresponding, deliberate user action driving each one.

### 12.6 Virtualization

For any list rendering a large number of DOM elements simultaneously (internal Admin/Moderator/Support tables — `13-testing-strategy.md` Section 13.8's stated threshold of roughly 100+ rows), windowed/virtualized rendering (rendering only the currently-visible row range) is used rather than rendering the full result set's DOM nodes at once — this is primarily an INP/frontend-rendering-performance concern (Section 3.1) rather than an API-latency one, but is grouped here since it's the direct client-side consequence of a list-heavy API response and is most relevant to the internal, data-dense tools this document's Section 3.4 gives a looser bundle budget but no looser interaction-responsiveness expectation.

### 12.7 GraphQL/Over-fetching Consideration (Explicitly Not Adopted)

The platform's REST API (`09-api-architecture.md` Section 1) uses explicit, purpose-shaped response schemas per endpoint (`15-engineering-standards.md` Section 14.5) rather than a general-purpose query language allowing arbitrary client-specified field selection — restated here as a deliberate performance-relevant architectural choice, not an oversight: purpose-shaped REST responses are simpler to cache predictably (Section 7) and to optimize server-side (a known, fixed response shape per endpoint allows Section 6.2's column-selection discipline to be applied precisely), trade-offs this document considers to favor REST's simplicity and cacheability at the platform's current API-surface complexity.

### 12.8 Bottlenecks

| Bottleneck | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Deep-pagination slowdown | Latency growing for users paging far into a result set | `OFFSET`-based pagination in violation of Section 12.4 | Migrate to cursor-based pagination |
| Request burst from infinite scroll | Latency/load spikes correlated with fast-scrolling sessions | An endpoint or screen not following Section 12.5's explicit-trigger default | Convert to Load More pattern |
| Slow-rendering large lists | Poor INP on internal data-dense screens | Missing virtualization for a large row count | Apply Section 12.6's virtualization pattern |

### 12.9 Optimization Strategy

Prioritized: (1) verify every list endpoint uses cursor-based pagination (Section 12.4) — a foundational, non-negotiable check; (2) verify explicit-trigger pagination UX (Section 12.5) for buyer-facing lists; (3) apply virtualization (Section 12.6) to any internal data-dense list crossing the row-count threshold.

### 12.10 Scaling Strategy

API performance at scale is the aggregate outcome of every other section in this document — Section 12's own specific scaling contribution is ensuring the API's *interaction pattern* itself (pagination, rate limiting) doesn't become a scaling bottleneck independent of the underlying compute/database/cache layers already addressed elsewhere; cursor-based pagination (Section 12.4) is the single most important such guarantee, since it is what keeps API performance *flat* with respect to result-set depth even as the platform's total catalog and order-history volume grow substantially.

### 12.11 Review Checklist

- [ ] Does every list endpoint use cursor-based pagination, never `OFFSET` (Section 12.4)?
- [ ] Does the endpoint meet its Section 12.2 budget category's latency target?
- [ ] Is rate limiting correctly configured for a new endpoint per its sensitivity tier (Section 12.3, `12-security-architecture.md` §8.3)?
- [ ] Does a new large-list UI use virtualization if it crosses Section 12.6's threshold?

---

# 13. Scalability Strategy

### 13.1 Purpose

To consolidate every layer's scaling approach (already stated per-section as "Scaling Strategy" throughout Sections 4–12) into one holistic scaling architecture, and to define the specific mechanisms — horizontal, vertical, and automatic scaling — this platform relies on at each layer.

### 13.2 Horizontal Scaling

The platform's default scaling mode wherever the underlying managed service supports it: **compute** (Vercel Functions, Section 5.11) scales horizontally and automatically, adding concurrent execution capacity per incoming request volume with no manual intervention; **background job execution** (Inngest, Section 11.9) similarly scales horizontally within configured concurrency ceilings. Horizontal scaling is preferred throughout this architecture wherever available because it has no practical upper ceiling within the provider's platform limits and requires no coordinated, riskier "resize" operation the way vertical scaling does.

### 13.3 Vertical Scaling

Reserved for the layers that don't horizontally scale by nature: **database compute tier** (Supabase's instance size, Section 6.11) and **connection pooler capacity** (Section 6.5) scale vertically — a tier upgrade, planned proactively per Section 14's capacity thresholds, never a horizontal "add more database instances" operation for the platform's primary read/write workload (read replicas, `14-infrastructure-devops-architecture.md` Section 25's future-evolution table, are the eventual horizontal-scaling answer for *read* traffic specifically, deferred until Section 6.11's caching-first mitigation is no longer sufficient).

### 13.4 Automatic vs. Manual Scaling Triggers

| Layer | Scaling Mode | Trigger |
|---|---|---|
| Compute (Vercel Functions) | Automatic, horizontal | Real-time request volume — no manual action |
| CDN/Edge | Automatic (provider-managed) | No platform-side action required |
| Database compute tier | Manual, vertical | Proactive review against Section 14.3's thresholds |
| Connection pooler | Manual, vertical (tied to database tier) | Same as above |
| Redis (Upstash) | Largely automatic within plan tier; manual tier upgrade at higher volume | Section 14.4's monitored thresholds |
| Background job concurrency | Manual configuration, automatic execution within it | Section 11.3's proactive review |
| R2 storage | Automatic (usage-based, no provisioning ceiling in practice) | No platform-side action required |

### 13.5 Scalability Architecture Principles (Restated)

Every architectural decision enabling this scaling model is already made in prior documents — this section names them explicitly as the *reasons* horizontal-by-default scaling is achievable: statelessness (`10-backend-architecture.md` Section 2.9, Section 5.4 of this document), the modular-monolith's clean module boundaries (`10-backend-architecture.md` Section 3.6, allowing a future extraction to independently-scaled services if ever warranted, per that document's Section 22.6), cursor-based pagination (Section 12.4), and cache-first read paths (Section 7) — restated here as the collective architectural foundation that makes Section 13.2's horizontal scaling actually work rather than merely being theoretically available.

### 13.6 Overload Protection

Restated from Section 2.7 and `12-security-architecture.md` Section 8.3: when demand genuinely exceeds provisioned capacity even after Section 13.2–13.3's scaling responses, the platform degrades predictably — rate limiting sheds excess load at the API boundary (returning a fast, honest `429` rather than accepting a request it cannot serve promptly), circuit breakers (Section 5.8) prevent a slow downstream dependency from causing request pile-up, and cached content (Section 7) continues to serve even if the origin is under database-layer pressure. This is a deliberately tested property (Section 15.4's stress testing), not an assumed one.

### 13.7 Multi-App Scaling Independence

Restated from `11-frontend-architecture.md` Section 3.2 and `14-infrastructure-devops-architecture.md` Section 7.7: `apps/buyer`, `apps/creator`, and `apps/internal` scale entirely independently as separate Vercel projects — a traffic spike on the public Buyer app (by far the platform's highest-traffic surface) has zero capacity impact on the Creator or Internal apps' own scaling, a direct, structural benefit of the three-app architectural split at the scaling-strategy level specifically, not merely the security-isolation level `12-security-architecture.md` Section 5.3 already established.

### 13.8 Bottlenecks

| Bottleneck | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Vertical-scaling-layer lag | Database/pooler capacity approached before a planned upgrade | Capacity review (Section 14) not conducted frequently enough for actual growth rate | Increase review cadence during periods of accelerating growth |
| A single hot module blocking overall scaling | One module's inefficient query pattern forcing a database-tier upgrade earlier than the platform's aggregate load would otherwise require | A Section 6 optimization gap concentrated in one module | Target that module's specific query optimization before defaulting to a blanket tier upgrade |

### 13.9 Optimization Strategy

Prioritized: (1) maximize horizontal-scaling coverage (Section 13.2) — the lowest-operational-overhead scaling mode, already the default for most of the architecture; (2) for the vertically-scaled layers (Section 13.3), extend their effective capacity via Section 6–7's query/caching optimization before defaulting to a tier upgrade, since optimization is typically cheaper and faster than a provisioning change; (3) verify Section 13.6's overload protection holds under genuinely tested load (Section 15), not merely architected in theory.

### 13.10 Scaling Roadmap Summary (Full Detail in Section 19)

This section establishes the *mechanisms*; Section 19 applies them against `00-project-vision.md` Section 15's specific 10K/100K/1M+ user milestones with concrete, numbered thresholds and actions per milestone.

### 13.11 Review Checklist

- [ ] Does a new architectural component scale horizontally by default, or is vertical scaling a deliberate, justified exception (Sections 13.2–13.3)?
- [ ] Does the change respect Section 13.7's app-independence — no new cross-app coupling that would undermine independent scaling?
- [ ] Has Section 13.6's overload-protection behavior been considered for any new high-traffic-potential endpoint?

---

# 14. Capacity Planning

### 14.1 Purpose

To translate Section 13's scaling mechanisms into concrete, numbered thresholds and a review cadence — extending `14-infrastructure-devops-architecture.md` Section 18.3–18.7's infrastructure-provisioning capacity tables with this document's performance-engineering detail on *why* each threshold is set where it is.

### 14.2 Capacity Planning Inputs

| Signal | Source | Used For |
|---|---|---|
| Request volume trend (per endpoint category) | OpenTelemetry metrics (Section 16.3) | Compute and rate-limit-tier planning |
| Database connection-pool utilization | Supabase metrics (`14-infrastructure-devops-architecture.md` §8.9) | Section 14.3's database-tier trigger |
| Cache hit rate trend | Upstash/Vercel edge metrics (Section 7.10) | Determines whether database-tier upgrade or cache-tuning is the correct response to rising load |
| Background job queue depth | Inngest dashboard (Section 11.7) | Job-concurrency-tier planning |
| Storage volume growth rate | R2 metrics (`14-infrastructure-devops-architecture.md` §9.7) | Storage-cost and lifecycle-policy planning |

### 14.3 Database Capacity Tiers (Consolidated from `14-infrastructure-devops-architecture.md` §18.3, with Performance Annotation)

| Traffic Tier | Estimated Peak Concurrent Requests | Pooler Connection Budget | Performance-Engineering Action Before Upgrade |
|---|---|---|---|
| Launch | Low hundreds | Default tier | None — headroom ample; monitor per Section 14.6's cadence |
| Early growth | Low thousands | Approaching default tier's budget | Confirm Section 6's query/index optimization is fully applied; confirm Section 7's cache hit rate is maximized before concluding a tier upgrade (rather than optimization) is genuinely required |
| Established growth | High thousands+ | Requires upgraded tier | Proactive upgrade, informed by Section 14.2's trend data, executed well ahead of the prior tier's exhaustion |

### 14.4 Compute and Redis Capacity Guidance

Compute (Section 13.2) requires no proactive tier planning under normal growth given its automatic horizontal scaling — the only compute-related capacity action is monitoring for and, if ever approached, requesting an increase to Vercel's platform-level plan-tier ceiling (`14-infrastructure-devops-architecture.md` Section 20.5) well ahead of it becoming constraining. Upstash Redis capacity (memory tier) is monitored against Section 7.8's TTL-driven working-set size — a growing memory-utilization trend independent of a corresponding TTL/key-design change (Section 7.11) signals genuine data-volume growth warranting a tier review, distinguished explicitly from a trend caused by suboptimal TTL configuration (which should be tuned first, per Section 7.11's optimization-before-provisioning discipline).

### 14.5 Capacity Table by User Scale Milestone

| Milestone | Est. Concurrent Peak Sessions | Database Tier Expectation | Redis Tier Expectation | Background Job Concurrency |
|---|---|---|---|---|
| 10K registered users | Low hundreds | Launch/default tier | Default tier | Default concurrency ceilings |
| 100K registered users | Low-to-mid thousands | One tier upgrade likely required (Section 14.3's "established growth" row) | Likely one tier upgrade | Concurrency ceilings tuned per Section 11.3, especially `notifications`/`search-indexing` |
| 1M+ registered users | High thousands to low tens of thousands | Multiple tier upgrades; read-replica evaluation triggered (`14-infrastructure-devops-architecture.md` §25) | Multiple tier upgrades; possible instance segmentation by cache category | Full per-family concurrency and third-party-tier renegotiation (`14-infrastructure-devops-architecture.md` §18.4) |

*These figures are directional planning inputs, not committed provisioning decisions — every milestone's actual required tier is confirmed against Section 14.2's real, measured trend data at the time, never provisioned purely from this table's estimate in advance of genuine need (Section 2.5).*

### 14.6 Capacity Review Cadence

Aligned with `14-infrastructure-devops-architecture.md` Section 18.7/21.7: a monthly capacity review (more frequent during periods of accelerating growth) examines Section 14.2's full signal set against Section 14.3–14.5's tables, producing an explicit decision — no action, optimize first (Sections 6–7, 11), or proactively upgrade a specific tier — documented and tracked, never left as an implicit assumption that "things seem fine."

### 14.7 Capacity Planning for Seasonal/Occasion-Driven Spikes

Restated from `13-testing-strategy.md` Section 13.5 and `00-project-vision.md`'s stated occasion/gifting-driven demand pattern (Section 7, Journey Triggers per `02-user-personas.md` Section 11): capacity is reviewed and, where warranted, temporarily over-provisioned ahead of a known, anticipated high-traffic period (a major festival or gifting season) rather than relying solely on Section 13.2's automatic scaling to absorb a sharp, predictable demand spike in real time — this is the one deliberate exception to Section 2.5's "scale to demonstrated need" principle, justified specifically because the need is *confidently anticipated*, not speculative.

### 14.8 Review Checklist

- [ ] Has Section 14.2's signal set been reviewed within the current review cadence (Section 14.6)?
- [ ] For any capacity concern, has Section 6–7's optimization-before-provisioning discipline been applied before concluding a tier upgrade is required?
- [ ] Is there an anticipated seasonal/occasion-driven traffic spike (Section 14.7) requiring proactive, temporary capacity planning?

---

# 15. Load Testing

### 15.1 Purpose

To define this document's performance-architecture ownership of load/stress testing, complementing `13-testing-strategy.md` Section 13.5–13.6's testing-process definition with the specific scenarios, targets, and interpretation framework this document's budgets require.

### 15.2 Load Testing Scope

Simulates expected production-level concurrent traffic against Staging (`14-infrastructure-devops-architecture.md` Section 4.1), validating that Section 3.2's API latency budgets and Section 3.3's database budgets hold under realistic concurrent load — not merely under the single-request conditions Section 6's `EXPLAIN ANALYZE` review checks in isolation. The specific traffic profile simulated mirrors `03-user-journeys.md`'s documented Critical-priority journeys (Section 12 of that document) at a concurrency level informed by Section 14.5's milestone table.

### 15.3 Benchmarking Methodology

Every load test run is benchmarked against the *same* prior baseline (the previous release's load-test result), not only against Section 3's absolute targets — this is what allows the platform to detect a **relative regression** (this release is 15% slower under the same load than the last one) even in cases where the absolute number still technically meets budget, catching a slow, accumulating performance decay before it eventually breaches Section 3's hard targets.

### 15.4 Stress Testing

Restated from `13-testing-strategy.md` Section 13.6 with this document's interpretation framework: stress testing deliberately exceeds expected peak load specifically to validate Section 13.6's overload-protection behavior — the goal is not for the system to succeed at extreme load, but to confirm it fails *predictably*: rate limiting sheds load correctly, circuit breakers open correctly (Section 5.8), and the system recovers automatically once load subsides, without requiring manual intervention or leaving the platform in a degraded state after the stress event ends.

### 15.5 Load Testing Scenarios

| Scenario | What It Validates |
|---|---|
| Sustained peak-equivalent traffic (Section 14.5's milestone-appropriate concurrency) | Section 3.2's latency budgets hold at genuinely expected load, not just low-traffic conditions |
| Sudden traffic spike (e.g., simulating a successful marketing campaign or a viral moment) | Section 13.2's horizontal auto-scaling responds correctly and quickly enough to avoid a user-visible degradation window |
| Sustained overload (stress testing, beyond expected peak) | Section 13.6's graceful-degradation behavior |
| Database-layer isolation test (load concentrated on write-heavy operations, e.g., simulated concurrent checkouts) | Section 6.9's lock-contention and connection-pool-exhaustion bottlenecks specifically |
| Third-party dependency degradation simulation (artificially slowed Razorpay/Resend sandbox responses) | Section 5.8's circuit-breaker and timeout behavior under a realistic, isolated failure mode |

### 15.6 Load Testing Cadence

Per `13-testing-strategy.md` Section 13.5: a defined periodic cadence (not per-commit, given cost/duration), mandatorily ahead of any anticipated high-traffic event (Section 14.7), and after any architecturally significant change (a new caching layer, a database-tier change, a new high-traffic feature) — never treated as a one-time, pre-launch-only exercise, since the platform's actual traffic profile and bottleneck locations evolve as it grows.

### 15.7 Interpreting Load Test Results

A load test result is interpreted against three questions, in order: (1) did every scenario in Section 15.5 meet Section 3's absolute budgets; (2) did any metric regress relative to the prior baseline (Section 15.3), even if still within absolute budget; (3) did the stress-testing scenario (Section 15.4) degrade and recover as designed. A "pass" requires satisfying all three, not merely the first — a load test that technically meets absolute targets while showing a clear regression trend is treated as an early warning requiring investigation, not a clean pass.

### 15.8 Bottlenecks

| Bottleneck | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Load test reveals a budget miss only under concurrency | A specific endpoint passes single-request testing but fails under load | Lock contention, connection-pool exhaustion, or a shared-resource bottleneck not visible in isolated testing | Section 6.9's concurrency-specific bottleneck table |
| Stress test reveals cascading failure instead of graceful degradation | The system doesn't recover automatically, or one failure triggers unrelated failures | Missing or misconfigured circuit breaker/rate limit (Section 13.6) | Audit and correct the specific missing protection |

### 15.9 Optimization Strategy

Every load-test finding is triaged against this document's relevant section (a database bottleneck against Section 6, a caching gap against Section 7, a job-throughput issue against Section 11) — load testing is a *detection* mechanism, not itself an optimization technique; its findings feed directly into the optimization strategies already defined per-layer throughout this document.

### 15.10 Scaling Strategy

Load testing is the empirical validation step for Section 14.5's milestone-based capacity table — a capacity plan is not considered trustworthy until confirmed against an actual load test result at the relevant concurrency level, consistent with `13-testing-strategy.md` Section 13.8's identical framing.

### 15.11 Review Checklist

- [ ] Has a load test been run against the current release candidate for any change with meaningful traffic-pattern impact?
- [ ] Do results meet Section 3's absolute budgets across every Section 15.5 scenario?
- [ ] Is there a regression relative to the prior baseline (Section 15.3), even if still within absolute budget?
- [ ] Did the stress-testing scenario degrade and recover as designed (Section 15.4)?

---

# 16. Performance Monitoring

### 16.1 Purpose

To define how the platform continuously observes its own performance against Section 3's budgets — extending `14-infrastructure-devops-architecture.md` Section 16's infrastructure-monitoring architecture with this document's performance-specific signal set and interpretation framework.

### 16.2 Real-User Monitoring (RUM)

Core Web Vitals (Section 3.1) are measured from actual user sessions via Vercel Speed Insights and PostHog (per the finalized stack), not only from synthetic/lab testing — restated from `11-frontend-architecture.md` Section 16.1: real-user data is the platform's system of record for whether Section 3.1's targets are genuinely being met for real buyers on real devices and real networks, since synthetic testing alone can never fully predict real-world device/network diversity.

### 16.3 Application Performance Monitoring (APM)

OpenTelemetry's distributed tracing (`10-backend-architecture.md` Section 18.5, `12-security-architecture.md` Section 19.5) provides the platform's request-level performance visibility — every request's correlation ID ties together its frontend render time, API latency, database query time, and any third-party call latency into one traceable timeline, making it possible to identify *which specific layer* is responsible for a given request's total latency, directly operationalizing Section 5.2's request-lifecycle profile as a live, queryable signal rather than a static diagram.

### 16.4 Performance Dashboards

A unified performance dashboard (built on Section 16.3's OpenTelemetry pipeline, per `14-infrastructure-devops-architecture.md` Section 16.7) surfaces Section 3's full budget table alongside live measured values — Core Web Vitals percentiles, per-endpoint-category API latency percentiles, database query performance, cache hit rates (Section 7), and job-family throughput (Section 11) — in one place, accessible to the full engineering team, consistent with that document's "visibility is not siloed" principle applied here to performance specifically.

### 16.5 Performance Regression Detection

**What the rule is:** every merge to `main` is checked, via Lighthouse CI (`13-testing-strategy.md` Section 24.1) and a corresponding API-latency-regression check (comparing the release candidate's representative-endpoint latency against the prior release's baseline, mirroring Section 15.3's load-test regression methodology at the per-PR scale), against the immediately preceding baseline. **Why:** a single PR's performance impact is often small and easy to dismiss individually ("this is only 10ms slower"), but the platform has observed (and this document's Section 2.4 explicitly names) that unchecked, incremental regressions compound over many such small changes into a genuine budget breach nobody individually "caused." Catching regressions at the smallest possible unit of change (a single PR) is what prevents this compounding.

### 16.6 Automated Performance Gates

Restated from `13-testing-strategy.md` Section 24.1's CI pipeline: Lighthouse CI enforces Section 3.1's Core Web Vitals budget and Section 3.4's bundle-size budget as build-blocking checks; a dedicated API-latency assertion (`13-testing-strategy.md` Section 13.4) is integrated into the API test suite for representative, Critical-tier endpoints — a PR that regresses either beyond a defined tolerance fails CI, consistent with `13-testing-strategy.md` Section 26's quality-gate model applied specifically to performance.

### 16.7 Alerting on Performance Degradation

Extends `14-infrastructure-devops-architecture.md` Section 16.4's severity-tiered alerting model with performance-specific thresholds: a sustained Core Web Vitals regression in production (detected via Section 16.2's RUM data, not just Section 16.6's pre-merge check) or a sustained API-latency-budget breach alerts at that document's High-severity tier; a database query exceeding Section 3.3's budget by a significant margin, sustained, alerts similarly — these are genuine operational alerts, not merely dashboard color-coding nobody actively monitors.

### 16.8 Bottlenecks

| Bottleneck | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Monitoring blind spot | A real production performance issue not caught by any dashboard/alert | A signal not yet instrumented (Section 16.4's coverage gap) | Extend instrumentation coverage as new features/layers are added |
| Alert fatigue | Performance alerts routinely ignored | Thresholds set too sensitively, generating false-positive noise | Recalibrate thresholds against Section 16.7's genuine-degradation bar |
| Regression undetected until user-reported | A performance issue reaches production before Section 16.5–16.6 catch it | A gap in CI's pre-merge coverage (e.g., an endpoint or screen not included in the automated check set) | Expand automated coverage to close the specific gap |

### 16.9 Optimization Strategy

Prioritized: (1) ensure Section 16.6's automated gates cover every Critical-priority journey and endpoint (`03-user-journeys.md` Section 12); (2) ensure Section 16.2's RUM data is the actual source of truth for production Core Web Vitals reporting, not synthetic data alone; (3) tune Section 16.7's alert thresholds against real, observed noise/signal ratio.

### 16.10 Scaling Strategy

Monitoring infrastructure itself scales with the platform (`14-infrastructure-devops-architecture.md` Section 17.4's centralized aggregation pipeline, provider-managed) — this document's scaling-relevant monitoring responsibility is ensuring Section 16.4's dashboards and Section 16.7's alerting remain interpretable and actionable as traffic and data volume grow, revisiting dashboard/alert design periodically (Section 14.6's cadence) rather than assuming a dashboard designed for launch-scale traffic remains equally useful at 1M+-user scale without revision.

### 16.11 Review Checklist

- [ ] Does a new critical-path feature have corresponding performance monitoring coverage (Section 16.4) before shipping?
- [ ] Did Section 16.6's automated performance gates pass for this change?
- [ ] Is there any indication of a Section 16.5 regression relative to the prior baseline?

---

# 17. Optimization Guidelines

### 17.1 Purpose

To consolidate every section's "Optimization Strategy" subsection into one prioritized, cross-layer decision framework — since a real-world performance issue rarely announces which single layer it belongs to, and an engineer investigating a slow screen needs one place to start.

### 17.2 The Optimization Priority Framework

```
Slow screen/endpoint reported or detected (Section 16)
      │
      ▼
1. Is the request even necessary? (Section 5.4 — should this be
   deferred to a background job, or eliminated entirely via better
   caching, Section 7?)
      │
      ▼
2. Is the database query optimal? (Section 6 — indexed, N+1-free,
   selecting only needed columns — the dominant cost for most
   requests, per Section 5.2)
      │
      ▼
3. Is the result cached appropriately? (Section 7 — should this
   result be served from Redis/CDN rather than recomputed?)
      │
      ▼
4. Is the rendering strategy optimal? (Section 4 — Server
   Component by default, streaming, PPP)
      │
      ▼
5. Is the client-side bundle/hydration cost minimal? (Section 4.3,
   4.6 — only after 1-4 are confirmed correct)
      │
      ▼
6. Only now: consider a targeted, measured optimization
   (memoization, a denormalized read model, Section 6.8) for the
   specific remaining bottleneck
```

**Why this order:** each step addresses a progressively narrower, more specific class of problem, and — critically — each step is progressively more expensive to implement and maintain. Skipping ahead (reaching for memoization or a denormalized read model before confirming the query itself is optimized, for instance) risks adding complexity that doesn't address the actual bottleneck, a direct violation of Section 2.2's measure-before-optimizing philosophy.

### 17.3 General Optimization Guidelines

- **Optimize the common case, not the exception.** Section 3's budgets are p95/p99 targets — optimization effort is prioritized toward the traffic patterns that represent the platform's actual dominant load (catalog browsing, per Section 6.6), not a rare, low-traffic edge case, unless that edge case's cost is disproportionately severe (e.g., a rare but catastrophically slow query risking a timeout cascade).
- **Prefer architectural fixes over tactical patches.** A recurring N+1 pattern across multiple endpoints is a signal to strengthen Section 6.4's lint enforcement or improve a shared Repository helper, not merely to fix each instance individually as it's discovered.
- **Every optimization is measured before and after.** An optimization that cannot demonstrate a measured improvement (Section 16's monitoring providing the before/after evidence) is not merged purely on the strength of theoretical reasoning — this mirrors Section 2.2's core philosophy applied at the level of an individual optimization PR.

### 17.4 Anti-Patterns Explicitly Rejected

| Anti-Pattern | Why Rejected |
|---|---|
| Premature caching (Section 7.11's discipline) | Adds correctness risk (staleness, Section 7.6) for an unmeasured performance benefit |
| Premature memoization (Section 10.8) | Adds cognitive overhead without demonstrated need |
| Optimizing a rarely-hit code path at the expense of readability | Violates `15-engineering-standards.md` Section 2.3's reader-first philosophy for a benefit few users ever experience |
| Reaching for infrastructure scaling before confirming query/cache optimization (Section 6.10, 14.3) | More expensive, slower to provision, and often masks — rather than fixes — the actual root cause |

### 17.5 Review Checklist

- [ ] Was Section 17.2's priority framework followed for this optimization, or was a later-stage technique reached for before earlier, cheaper ones were confirmed insufficient?
- [ ] Is there measured before/after evidence for this optimization's claimed benefit (Section 17.3)?
- [ ] Does this optimization avoid Section 17.4's explicitly-rejected anti-patterns?

---

# 18. Bottleneck Analysis

### 18.1 Purpose

To provide a single, consolidated diagnostic reference — every bottleneck table from Sections 4–16, brought together with a systematic diagnostic path, so an engineer investigating a real production performance issue has one place to start regardless of which layer turns out to be responsible.

### 18.2 Systematic Diagnostic Path

```
Symptom observed (Section 16's monitoring, or a user report)
      │
      ▼
Identify the correlation ID (Section 16.3) for a representative
slow request
      │
      ▼
Trace through OpenTelemetry: where does the time actually go?
      │
      ├─► Frontend render/hydration time dominant ──► Section 4's
      │    bottleneck table (over-hydration, waterfall fetching)
      │
      ├─► Network/edge time dominant ──► Section 8's bottleneck
      │    table (cache miss, slow middleware)
      │
      ├─► Backend Service Layer time dominant ──► Section 5's
      │    bottleneck table (sequential awaits, sync side effects)
      │
      ├─► Database query time dominant ──► Section 6's bottleneck
      │    table (missing index, N+1, lock contention)
      │
      ├─► Third-party call time dominant ──► Section 5.8 /
      │    23 of 14-infrastructure-devops-architecture.md
      │    (circuit breaker, timeout configuration)
      │
      └─► Background job delay (an async side effect, not the
           original request itself) ──► Section 11's bottleneck
           table
```

### 18.3 Consolidated Bottleneck Reference Table

| Symptom | Most Likely Layer | Section |
|---|---|---|
| High LCP, otherwise fast API | Frontend rendering/streaming | 4 |
| High INP | Over-hydration, excessive client JS | 4.3, 4.6 |
| High CLS | Missing image dimensions, unmanaged fonts | 10.3–10.4 |
| High TTFB despite fast database | Edge/CDN cache miss, slow middleware | 8 |
| Slow API, fast individual query | Sequential awaits, synchronous side effects | 5.6, 5.4 |
| Slow API, slow query | Missing index, N+1, or genuinely expensive aggregation | 6 |
| Slow API only under concurrency | Lock contention, connection pool exhaustion | 6.9 |
| Search feels slow or stale | Missing GIN/composite index, or indexing-job backlog | 9.8 |
| Delayed notification/email | `notifications` job backlog or third-party rate limit | 11.7 |
| Growing infra cost without proportional traffic growth | Cache hit-rate degradation, or an inefficient query pattern | 7.10, 6.9 |

### 18.4 Root Cause vs. Symptom Discipline

**Rule:** every bottleneck investigation traces to a *root cause* (a missing index, a specific unbounded loop, a misconfigured TTL) before a fix is applied — a fix that only addresses the symptom (e.g., adding a cache layer over a fundamentally unoptimized query, masking rather than resolving Section 6's underlying issue) is treated as incomplete, since the underlying inefficiency remains and will resurface as traffic grows past what the symptomatic fix can continue to mask.

### 18.5 Post-Incident Performance Review

Any performance-related production incident (a budget breach severe enough to trigger Section 16.7's alerting, or a genuine user-facing degradation) receives a review — mirroring `12-security-architecture.md` Section 26.6's post-incident-review discipline applied here to performance incidents specifically — identifying root cause via Section 18.2's diagnostic path, and resulting in either a targeted fix, a new automated regression check (Section 16.6) preventing recurrence, or, where the incident reveals a gap in this document itself, a documented update to the relevant section.

### 18.6 Review Checklist

- [ ] Was Section 18.2's diagnostic path followed to identify the actual root-cause layer, rather than guessing?
- [ ] Does the applied fix address the root cause, not merely mask the symptom (Section 18.4)?
- [ ] For a production incident, has Section 18.5's post-incident review been completed?

---

# 19. Future Scaling Strategy

### 19.1 Purpose

To apply Section 13's scaling mechanisms and Section 14's capacity-planning framework against `00-project-vision.md` Section 15's specific growth ambition, milestone by milestone — extending Section 14.5's summary table into a full narrative roadmap.

### 19.2 10K Users

At this scale, the platform operates comfortably within its launch-tier provisioning across every layer (Section 14.5). The primary engineering focus at this milestone is **establishing measurement discipline** — ensuring Section 16's monitoring is fully instrumented and Section 15's load-testing baseline is established, so that every subsequent growth milestone is navigated with real data (Section 14.2) rather than guesswork. No infrastructure-tier upgrades are anticipated at this milestone; the architectural foundations (Sections 4–12) are already built for materially greater scale than this milestone represents.

### 19.3 100K Users

Database connection-pool utilization and Redis memory utilization begin approaching the thresholds warranting Section 14.3's "established growth" response — a proactive tier upgrade for both, informed by Section 14.2's trend data, executed ahead of exhaustion. Background job concurrency (`notifications`, `search-indexing` specifically, per Section 11.2's highest-volume families) is retuned against measured throughput. This is also the milestone at which Section 14.7's seasonal-spike capacity planning becomes operationally significant — at 10K users, a seasonal spike is unlikely to meaningfully stress the platform; at 100K, a concentrated gifting-occasion spike (per `02-user-personas.md` Section 11's Journey Triggers) can plausibly approach several multiples of average daily traffic, warranting explicit pre-event capacity review.

### 19.4 1M+ Users

The milestone at which several of `14-infrastructure-devops-architecture.md` Section 25's reserved future-evolution items become genuinely relevant, not merely theoretical:

- **Database read replicas** (that document's Section 25) are evaluated if sustained database-layer latency pressure persists despite Section 6–7's full optimization and caching discipline — the read-heavy traffic profile (Section 6.6) makes read-replica-based horizontal read-scaling a natural next lever once vertical scaling and caching alone are no longer sufficient.
- **Multi-region compute/database deployment** becomes relevant specifically if international market expansion (`04-information-architecture.md` Section 21) has also become an active roadmap item by this point — the two triggers (traffic scale and geographic expansion) are related but distinct, and multi-region is pursued in response to whichever arrives first with genuine, demonstrated need.
- **Search infrastructure evaluation**: Section 9.2's Postgres-native full-text search, while architected to scale sub-linearly with catalog size (Section 9.10), is re-evaluated at this milestone against a dedicated search-engine infrastructure component (e.g., a managed search service) if catalog size and query complexity growth have outpaced what GIN-indexed Postgres full-text search comfortably serves within Section 3.3's budget — this is evaluated with evidence at this milestone, not assumed necessary in advance.
- **Chaos engineering practice** (`14-infrastructure-devops-architecture.md` Section 25's reserved item) becomes a meaningful investment once traffic scale and system complexity make staging-based stress testing (Section 15.4) alone insufficient to build full confidence in production-specific failure modes.

### 19.5 Beyond 1M Users — Directional Considerations

Not committed architecture, but named here so a future team revisiting this document understands the reasoning chain that would lead to them: **module extraction into independently-deployed services** (`10-backend-architecture.md` Section 22.6's reserved microservice-extraction path) becomes worth evaluating only if a *specific* module's scaling profile diverges sharply from the rest of the monolith (e.g., Search or Analytics requiring independent scaling at a rate the rest of the platform doesn't) — restated from that document's own stated principle: extraction is justified by a demonstrated, specific need, never pursued generally "because the platform is big now."

### 19.6 Scaling Roadmap Table (Consolidated)

| Milestone | Primary Focus | Key Triggers |
|---|---|---|
| 10K users | Measurement/monitoring discipline (Section 16) | None — establishing baseline |
| 100K users | Proactive database/Redis tier upgrades; job concurrency retuning; seasonal-spike planning becomes operationally significant | Section 14.2's trend data crossing Section 14.3's "established growth" thresholds |
| 1M+ users | Read replicas; multi-region evaluation; dedicated search infrastructure evaluation; chaos engineering | Sustained, measured pressure despite full optimization at prior layers |
| Beyond 1M | Selective module extraction (only if module-specific scaling divergence is demonstrated) | A specific module's scaling profile diverging materially from the platform's aggregate profile |

### 19.7 What Does Not Change with Scale

Explicitly named, since it's easy to assume everything requires re-architecture at scale: Section 4's rendering strategy, Section 6's indexing/query-optimization discipline, Section 7's caching architecture, and Section 12's API-performance patterns (cursor pagination, explicit-trigger loading) remain the platform's approach at every milestone in Section 19.6 — they were architected from `00-project-vision.md` Section 15's scale ambition from the start (Section 2.5's philosophy), and the future-scaling work in this section is about *provisioning and selective infrastructure additions* (replicas, multi-region, dedicated search), not about rebuilding the application-level performance architecture this entire document defines.

---

# 20. Performance Review Checklist

This checklist consolidates every section's individual review checklist into the platform's binding, release-gating performance standard — extending `13-testing-strategy.md` Section 26's quality-gate model with this document's performance-specific criteria.

### 20.1 Frontend Performance
- [ ] Rendering strategy follows Section 4.2's decision tree correctly.
- [ ] Client Component boundaries are minimal and justified (Section 4.3).
- [ ] Bundle budget (Section 3.4) is met, verified by CI.
- [ ] Every image uses `next/image` with explicit dimensions (Section 10.3).
- [ ] Suspense boundaries are used for independently-loading sections (Section 4.4).

### 20.2 Backend Performance
- [ ] Non-critical-path work is deferred to a background job (Section 5.4).
- [ ] Independent async operations are parallelized (Section 5.6).
- [ ] Response payloads include only necessary fields (Section 5.7).
- [ ] Third-party calls have timeouts and circuit breakers (Section 5.8).

### 20.3 Database Performance
- [ ] No database call inside a loop (Section 6.4).
- [ ] New queries against high-volume tables have `EXPLAIN ANALYZE` evidence of index usage (Section 6.3).
- [ ] Pagination is cursor-based, never offset-based (Section 12.4).
- [ ] Only necessary columns are selected (Section 6.2).

### 20.4 Caching
- [ ] New expensive, repeatable queries have a corresponding cache entry (Section 7.5).
- [ ] Every write path affecting cached data includes explicit invalidation (Section 7.6).
- [ ] TTLs are justified against the freshness/hit-rate trade-off (Section 7.8).

### 20.5 API Design
- [ ] List endpoints use cursor-based pagination (Section 12.4).
- [ ] Rate limiting is correctly tiered for new endpoints (Section 12.3).
- [ ] Large internal lists use virtualization where the row-count threshold is crossed (Section 12.6).

### 20.6 Monitoring and Regression
- [ ] New critical-path features have performance monitoring coverage (Section 16.4) before shipping.
- [ ] Automated performance gates (Lighthouse CI, API-latency assertions) pass (Section 16.6).
- [ ] No unexplained regression relative to the prior baseline (Section 16.5).

### 20.7 Scalability
- [ ] New architecture scales horizontally by default, or vertical scaling is a deliberate, justified exception (Section 13.2–13.3).
- [ ] Capacity impact has been considered against Section 14's thresholds for any traffic-significant change.
- [ ] Load testing has been performed for any change with meaningful traffic-pattern impact (Section 15.11).

### 20.8 Sign-Off

For any release classified as Tier 1 (Critical) per `13-testing-strategy.md` Section 26.3, this Section 20 checklist is completed and signed off alongside that document's own release-readiness checklist (Section 29) — performance is not a separate, optional review track but a integrated, equally-weighted component of release readiness.

---

*This document is the performance and scalability constitution of Dreams by Kalakaaar v2. Every rendering decision, every query, every cache policy, and every capacity plan — today and at 1M+ users — should be traceable to a target and a strategy recorded here, and, transitively, back to `00-project-vision.md` through `15-engineering-standards.md`. Where a new performance need arises that this document does not yet cover, it is resolved deliberately, measured, documented, and added here before it is relied upon in production — the budget leads, the optimization follows.*
