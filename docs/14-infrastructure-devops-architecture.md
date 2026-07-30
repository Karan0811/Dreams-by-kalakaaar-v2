# 14 · Infrastructure & DevOps Architecture — Dreams by Kalakaaar v2

**Document owner:** Principal Cloud Architect / SRE Lead
**Status:** Draft for review — implementation-ready
**Audience:** Backend Engineering, Frontend Engineering, DevOps, Security, QA, Product, Future team members
**Depends on:** `00-project-vision.md` through `13-testing-strategy.md`, in full
**Precedes:** All infrastructure provisioning, deployment configuration, and operational runbook creation

This document defines infrastructure and operational architecture only. It contains no Terraform, no `vercel.json` contents, no shell scripts. Its purpose is to be the single reference from which every environment, deployment pipeline, monitoring dashboard, and incident runbook is built — every decision here traces back to a concrete requirement named in `00`–`13`, not to generic cloud-architecture best practice for its own sake.

---

# 1. Introduction

### 1.1 Purpose

`10-backend-architecture.md` defines how the application is built and organized; `11-frontend-architecture.md` defines how three separate Next.js applications are structured; `12-security-architecture.md` defines the trust guarantees the platform makes; `13-testing-strategy.md` defines how the team knows the platform works before it ships. This document defines the last remaining piece: **where and how the platform actually runs** — the production topology, the environments code passes through on its way to real users, the managed services it depends on, and the operational discipline that keeps it available, fast, secure, and recoverable once it's live.

Every technology named in this document's stack is already finalized by prior documents — Vercel (`10-backend-architecture.md` Section 1.6, `11-frontend-architecture.md` Section 3.1), Supabase Postgres (`08-database-design.md`, `10-backend-architecture.md` Section 2.6), Cloudflare R2 (`10-backend-architecture.md` Section 11), Upstash Redis (`10-backend-architecture.md` Section 13.7), Inngest (`10-backend-architecture.md` Section 12), Razorpay (`10-backend-architecture.md` Section 16), Resend (`10-backend-architecture.md` Section 15.5), and the Sentry/OpenTelemetry/PostHog monitoring stack (`10-backend-architecture.md` Section 18, `11-frontend-architecture.md` Section 23). This document does not choose between providers — it defines precisely how the chosen providers are composed, configured, secured, and operated together as one coherent production system.

### 1.2 Scope

In scope: production topology, environment strategy (Development/Preview/Staging/Production), network topology and trust boundaries, deployment architecture and CI/CD, the compute layer (Vercel's execution model), database/storage/cache/background-job infrastructure, CDN and asset delivery, domain/DNS/TLS, secrets and configuration management, infrastructure-layer security, monitoring/logging/metrics/alerting/health checks, scaling and capacity planning, cost management, backup and disaster recovery, platform operations, maintenance strategy, third-party dependency management, and infrastructure lifecycle.

Out of scope: application code, database schema (`08-database-design.md`'s domain), API contract detail (`09-api-architecture.md`'s domain), and application-level security controls already fully specified in `12-security-architecture.md` — this document references that document's controls rather than restating them, focusing instead on the infrastructure substrate those controls run on.

### 1.3 Audience

Every engineer who deploys code, DevOps and platform engineering who own the infrastructure directly, Security (`12-security-architecture.md`'s owners, since infrastructure security is a shared boundary), QA (`13-testing-strategy.md` Section 23's environment strategy is implemented here), and future team members who need to understand not just what runs where, but why.

### 1.4 Objectives

1. Define the platform's complete production topology — every managed service, how they connect, and where the trust boundaries between them sit.
2. Define an environment strategy (Development, Preview, Staging, Production) that gives every stage of `13-testing-strategy.md`'s test pyramid a correctly-isolated, correctly-provisioned place to run.
3. Specify deployment architecture precise enough that a deployment's full lifecycle — from merge to production traffic to rollback, if needed — is unambiguous.
4. Define capacity, scaling, and cost management practices proportionate to `00-project-vision.md` Section 15's stated 1M+ user growth ambition, without over-provisioning for scale the platform doesn't yet have.
5. Define monitoring, alerting, and incident-response operational practice that gives the team continuous, evidenced confidence in production health — extending `12-security-architecture.md` Section 26's incident response process to infrastructure-class incidents specifically.
6. Define backup, disaster recovery, and high-availability architecture meeting `12-security-architecture.md` Section 25's stated RPO/RTO targets concretely, at the infrastructure level.

### 1.5 Relationship to Previous Documents

| Document | What This Document Inherits and Extends |
|---|---|
| `00-project-vision.md` | Section 15's scale ambition and Section 14's performance targets — the concrete infrastructure sizing and scaling triggers (Section 18) this document defines are calibrated against them. |
| `08-database-design.md` | The schema and RLS model (Section 20.9-adjacent) this document's database infrastructure (Section 8) provisions and operates. |
| `09-api-architecture.md` | The API surface and rate-limit/caching contract (Sections 2.7, 2.20) this document's caching layer (Section 10) and compute layer (Section 7) serve. |
| `10-backend-architecture.md` | Section 1.2's stated infrastructure-provisioning boundary ("owned by a future infrastructure-operations document, if warranted") — this document is that document. Sections 12 (Inngest), 16 (Payments), 17 (Integrations), 18 (Observability), 19 (Health), and 25 (Deployment) are expanded here into full operational architecture. |
| `11-frontend-architecture.md` | The three-app monorepo (`apps/buyer`, `apps/creator`, `apps/internal`) this document's deployment architecture (Section 6) and compute layer (Section 7) actually deploy and run. |
| `12-security-architecture.md` | Section 18's infrastructure security summary — this document is that section's full expansion, and Section 25's backup/DR requirements, which this document's Section 19 implements concretely. |
| `13-testing-strategy.md` | Section 23's environment-tier definitions (Local, CI, Staging, Production) — this document's Section 4 is the authoritative infrastructure specification behind that document's environment strategy. |

### 1.6 How This Document Is Used

Before any environment is provisioned, any deployment pipeline stage is configured, or any monitoring dashboard is built, it is checked against the relevant section here. Where an operational need arises that this document does not yet cover, this document is updated first — consistent with every document preceding it in this series.

---

# 2. Infrastructure Philosophy

### 2.1 Managed Services Over Self-Operated Infrastructure

Every layer of this platform's infrastructure — compute (Vercel), database (Supabase), object storage (Cloudflare R2), cache (Upstash), background jobs (Inngest) — is a managed service, not a self-hosted, self-patched, self-scaled system. **Architecture:** the platform owns application logic and configuration; the underlying compute, storage, and networking primitives are operated by providers whose sole business is operating them reliably at a scale far beyond what a small platform engineering team could independently achieve. **Why:** this is a direct, deliberate extension of `10-backend-architecture.md` Section 1's finalized stack — every hour not spent patching a database server or managing a Kubernetes cluster is an hour spent on the product itself, and the reliability, security patching cadence, and scaling headroom a managed provider offers as their core competency exceeds what a growing team can match while also building product.

### 2.2 Infrastructure as Code

**What the rule is:** every piece of infrastructure configuration that a provider allows to be defined declaratively — Vercel project settings, environment variable definitions (Section 14), Supabase RLS policies and migrations (`10-backend-architecture.md` Section 2.8), DNS records (Section 13) — is defined in version-controlled configuration, never configured ad hoc through a web console with no change history. **Why it exists:** infrastructure configured only through a UI is infrastructure with no audit trail, no code review, and no reliable way to reproduce in a new environment — exactly the failure mode `12-security-architecture.md` Section 18.4 names as configuration drift. **How every engineer implements it:** any infrastructure change proposal goes through the same pull-request review process as application code (`13-testing-strategy.md` Section 3.5), with the configuration-as-code artifact as the actual, reviewable change — a console click is never the system of record for a security- or availability-relevant setting.

### 2.3 Immutable Deployments

Every production deployment is a complete, immutable build artifact (Vercel's deployment model) — never a mutation of a running system. A deployment either is or isn't live; there is no "patch the running server" operation. **Why:** immutability is what makes instant rollback (Section 6.6) possible and reliable — rolling back means promoting a previously-built, already-verified artifact back to serving traffic, not attempting to undo a sequence of live changes whose exact prior state may not be fully reconstructible.

### 2.4 Environment Parity

Every environment below Production (Section 4) is built to be as structurally identical to Production as is safely achievable — same application build process, same database schema-migration state, same Infrastructure-as-Code definitions — differing only in scale, data (always synthetic below Production, per `13-testing-strategy.md` Section 22.6), and third-party service mode (sandbox vs. live, Section 23). This is the infrastructure-level guarantee that makes `13-testing-strategy.md` Section 23.2's staging-parity claim actually true, not aspirational.

### 2.5 Automate the Operationally Repetitive

Any operational task performed more than a handful of times manually is a candidate for automation — deployment (Section 6), health verification (Section 16), backup execution (Section 19), and routine scaling decisions (Section 18) are automated by default; manual intervention is reserved for genuinely judgment-requiring decisions (a Tier 1 release's go/no-go call, per `13-testing-strategy.md` Section 29.4; an incident's containment strategy, per `12-security-architecture.md` Section 26.4), never for repetitive, rule-following operational work a script can perform more reliably and faster than a human under pressure.

### 2.6 Fail Fast, Recover Automatically, Alert Precisely

Consistent with `10-backend-architecture.md` Section 2.11's fault-tolerance principle and `12-security-architecture.md` Section 2.5's fail-closed principle applied at the infrastructure level: transient failures (a brief database connection blip, a momentary third-party timeout) are handled with automatic retry and circuit-breaking (Section 7.5); genuine failures trigger fast, precise alerting (Section 16.4) to the right owner, not a generic, noisy alert everyone learns to ignore; and every automated recovery action (an auto-scaling event, a circuit breaker opening) is itself observable (Section 17), so automatic recovery never becomes invisible recovery.

### 2.7 Cost as an Engineering Input, Not an Afterthought

Every infrastructure decision in this document accounts for its cost implication at current scale and at `00-project-vision.md` Section 15's projected scale — Section 20 makes this explicit, but the principle applies throughout: the platform favors usage-based, elastic-cost managed services (matching its actual, currently-modest traffic) over fixed, over-provisioned capacity purchased speculatively ahead of demonstrated need, mirroring `13-testing-strategy.md` Section 32's "scope to demonstrated need, not speculative future scale" discipline applied here to infrastructure spend specifically.

### 2.8 Operational Ownership Is Explicit

Every piece of infrastructure has a named owning function (Section 21's responsibility matrix), and every operational process (deployment, incident response, capacity review) has a defined owner and escalation path — mirroring `12-security-architecture.md` Section 26.3's incident-role model, extended here to routine operations, not only incidents.

---

# 3. Production Architecture

### 3.1 Complete Production Topology

```
                              ┌───────────────────────────┐
                              │        End Users            │
                              │  Browsers · Buyer PWA ·      │
                              │  Creator/Internal staff       │
                              └──────────────┬─────────────┘
                                              │ HTTPS (TLS 1.3, Section 13.3)
                                              ▼
                              ┌───────────────────────────┐
                              │   Cloudflare (DNS + CDN)    │
                              │  Section 12–13               │
                              └──────────────┬─────────────┘
                                              │
                              ┌───────────────▼─────────────┐
                              │   Vercel Edge Network         │
                              │  Global PoPs · Edge Middleware│
                              │  (11-frontend-architecture.md │
                              │   §3.4, §6.2)                 │
                              └──────────────┬─────────────┘
                                              │
                 ┌────────────────────────────┼────────────────────────────┐
                 │                             │                             │
       ┌─────────▼─────────┐        ┌─────────▼─────────┐        ┌─────────▼─────────┐
       │   apps/buyer         │        │   apps/creator      │        │   apps/internal     │
       │  (Vercel Functions +  │        │  (Vercel Functions)  │        │  (Vercel Functions)  │
       │   Edge Runtime)        │        │                       │        │                       │
       └─────────┬─────────┘        └─────────┬─────────┘        └─────────┬─────────┘
                 │                             │                             │
                 └────────────────────────────┼────────────────────────────┘
                                              │  Server-side only (Section 5.3)
              ┌────────────────────────────────┼────────────────────────────────┐
              │                                │                                │
   ┌──────────▼─────────┐         ┌────────────▼───────────┐        ┌───────────▼──────────┐
   │  Supabase Postgres   │         │   Upstash Redis          │        │  Cloudflare R2         │
   │  (Section 8)          │         │   (Section 10)            │        │  (Section 9)            │
   └───────────────────────┘         └───────────────────────────┘        └────────────────────────┘
              │
   ┌──────────▼─────────┐
   │  Inngest              │
   │  (Section 11)          │
   └──────────┬─────────┘
              │
   ┌──────────▼──────────────────────────────────────────────────┐
   │        Third-Party Services (Section 23)                       │
   │   Razorpay · Resend · Sentry · OpenTelemetry Collector ·        │
   │   PostHog                                                       │
   └──────────────────────────────────────────────────────────────┘
```

### 3.2 Topology Principles

This topology encodes three deliberate decisions, each stated once here and referenced throughout the rest of this document: **(1) Cloudflare sits in front of Vercel** for DNS and CDN (Section 12), not the reverse — Vercel's own edge network handles application routing and rendering, while Cloudflare's broader network provides DNS resolution, a first layer of DDoS absorption, and R2's storage-adjacent delivery, avoiding a redundant double-CDN architecture for the same content. **(2) All data stores sit behind the application tier**, reachable only from Vercel's server-side runtime, never from any browser directly (`12-security-architecture.md` Section 4.4's Trust Boundary 3) — restated here as the topology's defining shape, not an incidental detail. **(3) Third-party services sit entirely outside the platform's own infrastructure boundary**, reached exclusively via outbound, credentialed, circuit-broken calls (`10-backend-architecture.md` Section 17) — restated here because every infrastructure decision about resilience (Section 7.5) and monitoring (Section 16) treats this boundary as a place where failure is expected and must be handled gracefully, never assumed away.

### 3.3 Request Flow — Standard Buyer Request

```
1. Browser resolves domain via Cloudflare DNS (Section 13.2)
2. TLS handshake terminates at Vercel's edge (Section 13.3)
3. Vercel Edge Middleware runs (auth/session check, geo-detection —
   11-frontend-architecture.md §6.6)
4. Request routed to the appropriate Vercel Function (Region: closest
   to Supabase's primary region, Section 7.2, to minimize database
   round-trip latency)
5. Application code executes (Server Component render, Route Handler,
   or Server Action — 11-frontend-architecture.md §7)
6. Server-side calls issued to Supabase (via pooler, Section 8.3),
   Upstash (Section 10), and/or R2 (Section 9) as needed
7. Response streamed back through Vercel's edge to the browser
8. Telemetry (trace, log, metric) emitted throughout, correlated by
   a single correlation ID (Section 17.5)
```

### 3.4 Request Flow — Webhook Ingestion (Razorpay)

```
1. Razorpay issues an HTTPS POST directly to a dedicated Route
   Handler endpoint (no Cloudflare-level caching or transformation —
   webhook traffic bypasses CDN caching entirely, Section 12.4)
2. Signature verified (12-security-architecture.md §22.4) before any
   processing
3. Event recorded (idempotency check, §22.5 of that document) and an
   Inngest event emitted for asynchronous processing (Section 11.4)
4. A fast, minimal 200 response returned to Razorpay immediately —
   the actual business-logic processing happens asynchronously in
   Inngest, never synchronously within the webhook request itself,
   both to meet Razorpay's expected webhook response-time budget and
   to isolate webhook-processing failures from webhook-receipt
   acknowledgment (10-backend-architecture.md §16.3)
```

### 3.5 Failure Isolation Points

| Failure Point | Isolation Mechanism | Section |
|---|---|---|
| A single Vercel Function instance crashes | Stateless, ephemeral functions — Vercel routes the next request to a new instance automatically; no session/state is lost since none is held in-process | 7.4 |
| Supabase Postgres primary becomes unavailable | Connection pooler + Supabase's own managed failover (Section 8.5); application-layer circuit breaking prevents request pile-up | 8.5, 7.5 |
| Upstash Redis becomes unavailable | Fail-closed for security-critical checks (`12-security-architecture.md` §5.9), graceful degradation for non-critical caching (Section 10.5) | 10.5 |
| Razorpay/Resend/PostHog/Sentry unavailable | Circuit breaker + documented per-service fallback (`10-backend-architecture.md` §17.2–17.5) | 23.5 |
| A specific Vercel region/PoP degrades | Vercel's global edge network automatically routes around it — no single-region dependency for compute | 7.2 |
| Cloudflare experiences an outage | DNS/CDN-layer risk, mitigated by Section 13.2's secondary-DNS consideration and R2's own multi-region durability independent of Cloudflare's edge | 13.2, 9.4 |

---

# 4. Environment Strategy

### 4.1 Environment Tiers

Directly implements `13-testing-strategy.md` Section 23.1's environment table, specified here at the infrastructure-provisioning level:

| Environment | Purpose | Compute | Database | Third-Party Mode | Lifetime |
|---|---|---|---|---|---|
| **Development (Local)** | Individual engineer iteration | Local Next.js dev server (Turbopack, `11-frontend-architecture.md` §1.9) | Local Postgres instance or a dedicated ephemeral dev branch (Section 8.6) | Fully mocked (`13-testing-strategy.md` §22.3) | Per-developer, persistent until reset |
| **CI (Ephemeral)** | Automated test execution (`13-testing-strategy.md` §24) | GitHub Actions (or equivalent) runners | Freshly-provisioned, migrated Postgres instance per run | Fully mocked | Single pipeline run, destroyed after |
| **Preview** | Per-pull-request review and manual verification | Vercel Preview Deployment (one per PR, `11-frontend-architecture.md` §6.9) | A shared, isolated Preview-tier Supabase project or branch (Section 8.6) | Sandbox/test mode | Lifetime of the PR |
| **Staging** | E2E testing, manual QA, pre-release verification (`13-testing-strategy.md` §10, §28) | Vercel (dedicated Staging deployment target) | Dedicated Staging Supabase project, periodically reset (`13-testing-strategy.md` §23.4) | Sandbox/test mode | Persistent, reset on a defined cadence |
| **Production** | Real platform traffic | Vercel (Production deployment target) | Production Supabase project | Live mode | Persistent |

### 4.2 Environment Comparison

| Property | Development | Preview | Staging | Production |
|---|---|---|---|---|
| Deployed via | N/A (local) | Automatic, every PR push | Automatic, every merge to a `staging` branch or manual promotion | Automatic, every merge to `main` (Section 6.3) |
| Publicly reachable | No | Yes, unique URL per PR (unindexed, Section 13.5) | Yes, access-restricted (Section 4.4) | Yes, public |
| Data | Synthetic, developer-controlled | Synthetic, seeded via `13-testing-strategy.md` §22.5's seeding API | Synthetic, seeded via the same API, periodically reset | Real user data |
| Third-party credentials | Mocked/none | Sandbox-tier (Section 23.3) | Sandbox-tier | Live-tier |
| Monitoring | Local console only | Sentry (dedicated non-production project), no PostHog | Sentry (dedicated staging project), PostHog (tagged distinctly) | Full production monitoring stack (Section 16) |
| Scaling | N/A | Vercel default Preview limits | Modest, fixed capacity | Full auto-scaling (Section 18) |

### 4.3 Environment Promotion Flow

```
Local Development
      │  (git push)
      ▼
Preview Deployment  ──► Automated PR pipeline (13-testing-strategy.md §24.1)
      │  (PR approved + merged)
      ▼
Staging Deployment  ──► Full E2E suite, manual QA (13-testing-strategy.md §10, §28)
      │  (Release readiness checklist passed — 13-testing-strategy.md §29)
      ▼
Production Deployment  ──► Post-deployment verification (Section 16.5,
                            13-testing-strategy.md §30)
```

No environment is ever skipped for a standard release — a change reaches Production only after passing through Preview and, for anything above `13-testing-strategy.md` Section 26.3's Tier 3 (Low-risk), Staging as well. Emergency hotfixes follow the same promotion path on a compressed timeline, never bypassing environments entirely (`12-security-architecture.md` Section 26.6's bypass-procedure discipline applies identically here).

### 4.4 Environment Access Control

| Environment | Who Has Access |
|---|---|
| Development | The individual engineer, on their own machine |
| Preview | Any team member with repository access (via Vercel's PR-comment-linked URL); not publicly discoverable/indexed |
| Staging | Engineering and QA team members, authenticated via the same internal-role auth model as Production's internal apps (`12-security-architecture.md` §6.9), plus a shared, rotated basic-auth or IP-allowlist layer in front of the entire Staging deployment to prevent public discovery |
| Production | End users (public apps); internal roles per `12-security-architecture.md` Section 6's RBAC; infrastructure-level access restricted per Section 21's responsibility matrix |

### 4.5 Environment Data Isolation

Every environment's database, storage bucket, cache namespace, and third-party credential set is fully distinct (`12-security-architecture.md` Section 17.3) — there is no environment in this platform where Staging or Preview code can, even in a misconfiguration scenario, reach Production data, since the credentials required to do so simply do not exist in those environments' configuration at all (a structural guarantee, not a permission that happens to be denied).

---

# 5. Network Topology

### 5.1 Trust Boundary Restatement

This section implements `12-security-architecture.md` Section 4's trust boundaries at the network-infrastructure level — that document defines *what* must be true at each boundary; this section defines *how the network is actually shaped* to make it true.

### 5.2 Network Zones

| Zone | Contents | Reachability |
|---|---|---|
| **Public Zone** | Vercel Edge Network, Cloudflare DNS/CDN | Internet-reachable by design |
| **Application Zone** | Vercel Functions running `apps/buyer`/`apps/creator`/`apps/internal` server-side code | Reachable only via the Public Zone's routing; no direct internet ingress to a Function bypassing Vercel's own edge |
| **Data Zone** | Supabase Postgres, Upstash Redis, Cloudflare R2 | Reachable only from the Application Zone's server-side runtime, authenticated and, where supported, IP-restricted (Section 5.4) |
| **Background Processing Zone** | Inngest's execution environment | Reachable from the Application Zone (event emission) and reaches back into the Application Zone (Route Handler invocation for job steps) and the Data Zone directly |
| **External Zone** | Razorpay, Resend, Sentry, OpenTelemetry Collector, PostHog | Reached only via outbound, credentialed calls from the Application/Background Processing Zones; reaches inbound only via signature-verified webhooks (Section 3.4) |

### 5.3 No Direct Database Exposure

Restated as this document's own explicit network-architecture commitment, extending `12-security-architecture.md` Section 18.2: Supabase Postgres is never configured with a publicly-open port reachable from arbitrary internet addresses. Connections arrive exclusively through Supabase's connection pooler (Section 8.3), itself reachable only by credentials held server-side, and — where the platform's Supabase tier supports it — further restricted by IP allow-listing to Vercel's known egress ranges plus a narrow set of explicitly-authorized operator IPs (Section 21.4).

### 5.4 Egress Control

Vercel Functions' outbound network calls are limited, by the application's own architecture (`10-backend-architecture.md` Section 17), to the specific, named third-party domains in Section 23's inventory — there is no general-purpose outbound proxy or unrestricted internet access pattern in normal application code, which is both a security property (`12-security-architecture.md` Section 9.5's SSRF-prevention posture) and an operational one (unexpected outbound traffic to an unrecognized domain is itself a monitoring signal, Section 16.4).

### 5.5 Internal Service-to-Service Communication

The platform has no traditional internal service mesh — `apps/buyer`, `apps/creator`, and `apps/internal` do not call each other directly over the network; each is an independent Vercel deployment communicating with the shared Data Zone directly (per its own Service Layer, `11-frontend-architecture.md` Section 3.1), never routing through one another. Where cross-app coordination is needed (none currently required at launch), it would occur through the shared database or through Inngest events, never a direct app-to-app network call — this keeps the three-app topology's failure modes independent, consistent with `11-frontend-architecture.md` Section 3.2's stated rationale for the three-app split.

### 5.6 Network Diagram — Trust Zones

```
┌─────────────────────────────── PUBLIC ZONE ───────────────────────────────┐
│  Cloudflare DNS/CDN  ◄──────────────────────────────────►  End Users        │
│         │                                                                    │
│  Vercel Edge Network                                                         │
└─────────┼─────────────────────────────────────────────────────────────────┘
          │  (TLS-terminated, authenticated per-request)
┌─────────▼─────────────────── APPLICATION ZONE ────────────────────────────┐
│  apps/buyer  │  apps/creator  │  apps/internal   (Vercel Functions)          │
└─────────┬─────────────────────────────────────────────────────────────────┘
          │  (credentialed, pooled/authenticated connections only)
┌─────────▼──────────────────────── DATA ZONE ──────────────────────────────┐
│  Supabase Postgres  │  Upstash Redis  │  Cloudflare R2                       │
└─────────┬─────────────────────────────────────────────────────────────────┘
          │
┌─────────▼──────────────── BACKGROUND PROCESSING ZONE ─────────────────────┐
│  Inngest (orchestration; executes by invoking back into the Application    │
│  Zone's Route Handlers for actual job logic, per 10-backend-architecture.md│
│  §12)                                                                       │
└─────────┬─────────────────────────────────────────────────────────────────┘
          │  (outbound, credentialed only)
┌─────────▼──────────────────────── EXTERNAL ZONE ───────────────────────────┐
│  Razorpay  │  Resend  │  Sentry  │  OpenTelemetry Collector  │  PostHog      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.7 DDoS and Volumetric Protection

Cloudflare's network-layer protection (Section 12.2) and Vercel's own platform-level DDoS mitigation together provide the first line of defense against volumetric attacks before traffic ever reaches application code; `12-security-architecture.md` Section 8.3's application-layer rate limiting is the second, more granular line of defense against abusive-but-sub-DDoS-scale traffic patterns (credential stuffing, scraping) that a network-layer control alone would not distinguish from legitimate traffic.

---

# 6. Deployment Architecture

### 6.1 Deployment Model

Every deployment is a complete, versioned build of the relevant app(s) (`apps/buyer`, `apps/creator`, `apps/internal`), produced by Vercel's build pipeline from a specific Git commit, and promoted through the environment chain in Section 4.3 — never a partial or incremental update to a running system (Section 2.3's immutability principle).

### 6.2 CI/CD Pipeline (Infrastructure View)

This section is the infrastructure-provisioning counterpart to `13-testing-strategy.md` Section 24.1's full pipeline-stage detail; restated here at the level relevant to deployment infrastructure specifically:

```
Git push ──► Vercel detects change ──► Build triggered
   │
   ▼
Turborepo determines affected apps/packages (11-frontend-architecture.md §3.3)
   │
   ▼
Only affected apps are rebuilt — unaffected apps reuse their cached build
   │
   ▼
Build artifact produced per affected app (Next.js production build,
including Server/Client Component boundary resolution, per
11-frontend-architecture.md §7.6)
   │
   ▼
13-testing-strategy.md §24.1's full test pipeline runs against the build
   │
   ▼
On success: deployment promoted to the target environment (Preview
automatically; Staging/Production per §4.3's promotion flow)
```

### 6.3 Production Deployment Trigger

Production deployment is triggered automatically on every merge to `main`, gated entirely by `13-testing-strategy.md` Section 26's quality gates and, for Tier 1 releases, Section 29.4's named human go/no-go sign-off — there is no separate, manual "click to deploy" step for a change that has already passed every required gate, since an additional manual step here would add friction without adding a genuine safety check beyond what the gates already enforce.

### 6.4 Zero-Downtime Deployment

Vercel's deployment model is inherently zero-downtime for the Application Zone: a new deployment is built and fully verified (Section 6.2) *before* it begins receiving any production traffic, and traffic is atomically cut over from the prior deployment to the new one — there is no window where some requests are served by a half-updated system. Database migrations (Section 8.7) are the one deployment component requiring explicit backward-compatibility discipline (`10-backend-architecture.md` Section 25.2) to preserve this zero-downtime property end-to-end, since the database itself is not "deployed" atomically the way application code is.

### 6.5 Blue/Green-Equivalent Model

Restated from `10-backend-architecture.md` Section 25.5: Vercel's immutable-deployment-plus-instant-alias-reassignment model is functionally a blue/green deployment pattern without requiring the platform to provision or manage two parallel environments manually — the "old" deployment (blue) remains fully built and addressable even after the "new" deployment (green) receives production traffic, which is precisely what makes Section 6.6's rollback capability instant rather than requiring a rebuild.

### 6.6 Rollback Architecture

**What the rule is:** rolling back a production deployment is a traffic-reassignment operation (pointing the production domain alias back at a prior, already-built deployment), never a rebuild-and-redeploy operation. **Why it exists:** during an incident, the time cost of a rebuild (even a fast one) is time the platform spends in a degraded or broken state — instant alias reassignment reduces recovery time to seconds. **How every engineer implements it:** `13-testing-strategy.md` Section 30.3's rollback-readiness verification is a mandatory pre-deployment check specifically because it confirms this instant-rollback path is genuinely safe to use (i.e., the prior deployment would still function correctly against the current, possibly-since-migrated database schema) — a rollback that would itself break the platform (due to a non-backward-compatible migration) is flagged and escalated *before* deployment, never discovered for the first time during an actual incident.

### 6.7 Deployment Responsibility Matrix

| Activity | Owner | Approver (if required) |
|---|---|---|
| Standard (Tier 2/3) Production deployment | Automatic (CI/CD, on merge) | Code review approval (`13-testing-strategy.md` §26.2) |
| Tier 1 Production deployment | Automatic trigger, human-gated | Named engineering lead sign-off (`13-testing-strategy.md` §29.4) |
| Rollback decision | On-call engineer | Incident Commander, for a SEV-1/2 incident (`12-security-architecture.md` §26.3) |
| Database migration execution | CI/CD pipeline, elevated migration role (`12-security-architecture.md` §18.3) | Code review + explicit sign-off for irreversible migrations (§14.4 of that document) |
| Manual emergency hotfix | Designated senior engineer | Engineering lead, per the bypass procedure (`12-security-architecture.md` §26.6) |

### 6.8 Feature Flag Integration in Deployment

Where a change is deployed but not yet ready for full user exposure (a large feature, a risky change warranting gradual rollout), it ships behind a feature flag (Section 22.4) rather than being held back from deployment entirely — decoupling *deployment* (code reaching production, verified safe to run) from *release* (the feature becoming visible/active to users), a distinction this architecture treats as deliberate and load-bearing: it allows Section 6.3's continuous-deployment cadence to proceed without every individual feature needing to be release-ready the moment it's deployment-ready.

---

# 7. Compute Layer

### 7.1 Execution Model

Application code executes as Vercel Functions — ephemeral, stateless, request-scoped compute units automatically provisioned and torn down per request (or reused briefly for consecutive requests under load, an implementation detail of Vercel's platform, not a property the application depends on). Every Route Handler, Server Action, and Server Component render (`11-frontend-architecture.md` Section 7) runs in this model — there is no persistent, long-running application server process the platform manages directly.

### 7.2 Regional Placement

Vercel Functions for all three apps are configured to execute in the region geographically closest to Supabase's primary database region (Section 8.2), minimizing the database round-trip latency that dominates most request handling time — this is a deliberate choice prioritizing database-adjacency over pure edge-proximity-to-user for compute, since the platform's request handling is database-read/write-heavy (`09-api-architecture.md`'s CRUD-dominant API surface) and the latency cost of a cross-region database round-trip per request would exceed the latency benefit of running compute marginally closer to a geographically distant user. Static assets and cacheable content (Section 12) are served from Vercel's/Cloudflare's full global edge network regardless of this compute-region choice, so this trade-off applies specifically to dynamic, database-backed rendering, not the platform's overall global responsiveness.

### 7.3 Runtime Selection

Route Handlers and Server Actions that require full Node.js API compatibility (Drizzle's Postgres driver, Better Auth, the Razorpay/Resend SDKs) run on Vercel's Node.js runtime; Edge Middleware (`11-frontend-architecture.md` Section 6.6 — auth/session pre-checks, geo/locale detection) runs on Vercel's Edge Runtime specifically for its lower cold-start latency at the point where every single request passes through it, before routing decisions are made. This split is deliberate and narrow: the Edge Runtime's more limited API surface makes it unsuitable for the platform's database- and SDK-heavy business logic, so it is used only for the thin, universally-applicable middleware layer, never for full application logic.

### 7.4 Statelessness and Cold Starts

Consistent with `10-backend-architecture.md` Section 2.9's statelessness principle: no Vercel Function holds in-memory state across requests that the application depends on for correctness (session state lives in Redis/the JWT, per `12-security-architecture.md` Section 7; cached data lives in Upstash, Section 10) — a cold start (a fresh Function instance with no warm in-memory cache) never produces incorrect behavior, only a marginal latency cost, which Vercel's platform-level warming and the platform's own request-volume pattern (`13-testing-strategy.md` Section 13.4's latency targets already account for realistic cold-start distribution) keep within acceptable bounds without requiring application-level workarounds.

### 7.5 Resilience Patterns at the Compute Layer

Restated from `10-backend-architecture.md` Section 17.2–17.5 as an infrastructure-operational concern: every outbound call from a Vercel Function to a Data Zone or External Zone dependency (Section 5.2) is wrapped with a timeout and, for third-party integrations specifically, a circuit breaker — this is what prevents a single slow dependency from exhausting a Function's own execution time budget (Vercel's per-invocation duration limit) and, at scale, from causing a pile-up of concurrently-executing, all-stuck Function invocations that could itself become a self-inflicted availability incident.

### 7.6 Concurrency and Auto-Scaling

Vercel Functions scale horizontally and automatically per incoming request volume — there is no fixed "server count" the platform manages or a manual scaling decision required for ordinary traffic growth within Vercel's platform limits (Section 20.5's cost/limit awareness applies here). This auto-scaling is the primary mechanism behind Section 18's scaling strategy for the compute layer specifically; Sections 18.2–18.4 address the layers (database connections, third-party rate limits) that don't scale as automatically and therefore require deliberate capacity planning.

### 7.7 Per-App Compute Isolation

Each of the three apps (`apps/buyer`, `apps/creator`, `apps/internal`) is a fully independent Vercel project with its own deployment, scaling behavior, and resource limits — a traffic spike or a runaway function in `apps/buyer` (the highest-traffic, public-facing app) cannot consume `apps/creator` or `apps/internal`'s compute capacity or availability, a direct infrastructure-level payoff of `11-frontend-architecture.md` Section 3.2's three-app architectural decision.

---

# 8. Database Infrastructure

### 8.1 Managed Postgres via Supabase

Supabase provides the platform's PostgreSQL infrastructure as a fully managed service — provisioning, patching, minor-version upgrades, and the underlying compute/storage scaling of the database instance itself are Supabase's operational responsibility, not the platform's. The application interacts with this infrastructure exclusively through Drizzle ORM (`10-backend-architecture.md` Section 2.7) over the connection pooler (Section 8.3).

### 8.2 Regional Configuration

The Production Supabase project is provisioned in a single primary region, chosen to be geographically proximate to the platform's primary launch market (`00-project-vision.md`'s stated market focus) and to Vercel's compute region (Section 7.2), minimizing round-trip latency for the dominant share of traffic. `12-security-architecture.md` Section 21.7's cross-border data-transfer review is the gating process for any future multi-region expansion of this configuration.

### 8.3 Connection Pooling

Every application connection to Postgres passes through Supabase's connection pooler (PgBouncer-based, operating in transaction-pooling mode) rather than connecting directly to the database's native connection limit — this is essential given Vercel Functions' inherently high-concurrency, short-lived-connection execution model (Section 7.4): without pooling, a traffic spike could exhaust Postgres's native connection ceiling almost immediately, since each concurrently-executing Function would otherwise attempt its own direct connection. The pooler's own connection budget (Section 18.3's capacity-planning table) is the actual scaling constraint the platform manages proactively, rather than Postgres's raw connection limit.

### 8.4 Row-Level Security as Infrastructure Configuration

`12-security-architecture.md` Section 6.6's RLS policies are provisioned as versioned, migration-managed configuration (Section 2.2's Infrastructure-as-Code principle applied specifically to database security policy) — every RLS policy is defined in a tracked migration file, reviewed identically to a schema migration, and applied through the same controlled migration pipeline (Section 8.7), never configured ad hoc through Supabase's dashboard in a way that would leave no change-history record.

### 8.5 High Availability

Supabase's managed Postgres offering includes automated failover for the underlying database infrastructure (physical/instance-level failure) as part of its platform-level SLA — the platform's own infrastructure architecture layers `10-backend-architecture.md` Section 17's application-level resilience (retries, circuit breaking) on top of this, so that a brief failover event (typically seconds) degrades gracefully (a handful of retried requests) rather than surfacing as a hard outage to end users. `12-security-architecture.md` Section 25.1's continuous point-in-time-recovery capability is the complementary control for data-loss scenarios, distinct from this availability-focused failover behavior.

### 8.6 Database Branching (Preview/Development)

Where Supabase's plan tier supports database branching (an ephemeral, schema-matching database instance per Preview deployment, mirroring Vercel's own per-PR Preview deployment model), each Preview environment (Section 4.1) receives its own isolated database branch, seeded via `13-testing-strategy.md` Section 22.5's dedicated seeding API — this gives every pull request genuinely isolated data, avoiding the alternative (a single shared Preview database) that would risk one PR's test data interfering with another's, consistent with `13-testing-strategy.md` Section 22.4's test-isolation discipline extended to the Preview-environment level specifically.

### 8.7 Migration Execution

Schema migrations (`10-backend-architecture.md` Section 2.8, Section 25.2) run through the CI/CD pipeline's dedicated migration step (`12-security-architecture.md` Section 18.3, Section 24.5), using the elevated migration-scoped database role, immediately ahead of the corresponding application deployment being promoted to receive traffic — migrations are applied *before* the new application code that depends on them goes live, and are written to remain backward-compatible with the immediately-prior application version specifically to preserve Section 6.6's instant-rollback guarantee.

### 8.8 Backup Architecture (Database)

Fully specified in `12-security-architecture.md` Section 25.1–25.3; restated here as this document's infrastructure-provisioning confirmation: continuous point-in-time recovery is enabled on the Production Supabase project with a minimum 30-day retention window, verified restorable via a quarterly test restore into an isolated environment (that document's Section 25.3), with the restore procedure itself documented as part of Section 19.6's disaster-recovery runbook.

### 8.9 Database Monitoring

Query performance (slow-query identification), connection-pool utilization (Section 18.3's capacity signal), replication/failover events, and storage growth are monitored continuously (Section 16.3) via Supabase's own platform metrics, ingested into the platform's unified observability pipeline (Section 17.5) alongside application-level telemetry so a database-layer anomaly and its downstream application-level symptom (elevated API latency, per `13-testing-strategy.md` Section 13.4) can be correlated and investigated together.

---

# 9. Object Storage

### 9.1 Cloudflare R2 as the Storage Substrate

Cloudflare R2 provides the platform's object storage for all uploaded media (product/creator photography, storefront banners, verification documents, message/ticket attachments — `10-backend-architecture.md` Section 11, `12-security-architecture.md` Section 15). R2 was selected within the finalized stack specifically for its zero-egress-fee model, materially reducing the cost of serving high volumes of product imagery relative to egress-charged alternatives — a direct, deliberate cost-architecture decision (Section 20.3) given imagery is the platform's highest-bandwidth content category by a wide margin.

### 9.2 Bucket Architecture

A single R2 bucket per environment (Production, Staging; Preview/Development use a shared, clearly-namespaced test bucket or local emulation), internally organized by the path-scoped prefix segmentation `12-security-architecture.md` Section 15.2 defines (public-servable media, pending-scan quarantine, restricted verification-evidence) — never a single undifferentiated bucket with access control applied only at the object level, since prefix-level policy is both simpler to reason about and simpler to audit.

### 9.3 Upload Architecture (Infrastructure View)

Restated at the infrastructure-provisioning level from `10-backend-architecture.md` Section 11 and `12-security-architecture.md` Section 14.1–14.2: the application issues short-lived, narrowly-scoped pre-signed upload URLs; the browser uploads directly to R2, never through a Vercel Function as a proxy — this is both a security architecture (that document's Section 14.1) and an infrastructure-cost/performance architecture, since routing large file uploads through Vercel Functions would consume Function execution time and, depending on Vercel's specific payload-size limits, could hit platform ceilings that direct-to-R2 upload avoids entirely.

### 9.4 Durability and Replication

R2 provides Cloudflare's standard multi-region-redundant durability guarantee for stored objects as a platform-managed property — the platform does not additionally implement its own cross-provider backup of R2 content as a matter of course, since R2's own durability model is treated as sufficient for the media-asset category of data (distinct from the database, where `12-security-architecture.md` Section 25's additional backup rigor reflects that data's higher criticality and lower inherent redundancy).

### 9.5 CDN-Fronted Delivery

Public-facing media is served through a CDN-fronted, platform-controlled domain in front of R2 (Section 12.2) rather than R2's raw storage URL — this both closes the private-by-default access model `12-security-architecture.md` Section 15.1 requires and gives the platform a caching layer (Section 12) that keeps repeat image requests from hitting R2's origin at all for the platform's most-viewed content.

### 9.6 Storage Lifecycle Management

Orphaned uploads (objects never linked to a published resource, per `12-security-architecture.md` Section 15.4) are garbage-collected by a scheduled Inngest job (Section 11.2) after a defined grace period; deleted resources' associated objects are actively deleted from R2, not merely dereferenced — this lifecycle discipline keeps storage costs (Section 20.3) proportional to genuinely active content rather than accumulating indefinitely.

### 9.7 Storage Monitoring

Total storage consumption, upload success/failure rates, and pending-scan-quarantine queue depth (`12-security-architecture.md` Section 14.4's malware-scanning pipeline) are tracked continuously (Section 16.3) — a growing quarantine queue is both an operational signal (the scanning pipeline may be falling behind) and a potential security signal (a spike in flagged uploads, per that document's Section 19.2), routed to the appropriate owner (Section 21) depending on which interpretation the data supports.

---

# 10. Caching Layer

### 10.1 Upstash Redis Architecture

Upstash Redis provides the platform's caching, rate-limiting counter storage, and session-revocation-denylist infrastructure (`10-backend-architecture.md` Section 13.7, Section 14; `12-security-architecture.md` Section 7.4). Upstash was selected within the finalized stack specifically for its serverless, HTTP-based connection model, which is a natural fit for Vercel Functions' ephemeral execution (Section 7.4) — a traditional persistent-TCP-connection Redis client would fight against a stateless, rapidly-scaling Function fleet, whereas Upstash's REST/HTTP interface imposes no persistent-connection-count concern analogous to Section 8.3's Postgres pooling need.

### 10.2 Cache Key Namespacing

Every Redis key follows `10-backend-architecture.md` Section 14.2's `{module}:{entity}:{identifier}:{qualifier}` convention, additionally prefixed per environment (Section 4) so that Development, Preview, Staging, and Production never share a logical keyspace even if, in a lower-scale configuration, they were to share an underlying Upstash instance for cost reasons (Section 20.4) — environment isolation at the key-namespace level is a deliberate, explicit safeguard against cross-environment data bleed, independent of whether the instances are physically separate.

### 10.3 Cache Categories and TTL Strategy

| Category | Example | TTL | Failure Behavior if Unavailable |
|---|---|---|---|
| Response/query cache | Cached Product listing results | 60s (matching ISR revalidation, `11-frontend-architecture.md` §7.4) | Graceful degradation — falls through to Postgres directly (Section 10.5) |
| Rate-limit counters | Login attempt counts (`12-security-architecture.md` §5.9) | 15 min sliding window | **Fail closed** — requests rejected if the check cannot complete (that document's §5.9) |
| Session-revocation denylist | Revoked refresh-token families (`12-security-architecture.md` §7.4) | Matches token lifetime (30 days max) | **Fail closed** — a refresh cannot be validated if revocation status cannot be checked |
| Idempotency-key results | Cached response for a replayed idempotent request (`10-backend-architecture.md` §12) | 24 hours | Falls through to re-executing the operation's own idempotency check at the database layer (that document's §12.3) |

### 10.4 Cache Invalidation

Cache entries are invalidated explicitly by the Service Layer function that mutates the underlying data (`10-backend-architecture.md` Section 14.4's write-through/invalidate-on-write pattern), never relied upon to expire purely by TTL for data where staleness would be user-visible in a confusing way — restated here as an infrastructure-operational concern: Section 16.3's monitoring tracks cache hit/miss ratio specifically to detect an invalidation-logic regression (a sudden, unexplained drop in hit rate, or conversely, evidence of stale data being served longer than the documented TTL would suggest).

### 10.5 Fail-Closed vs. Fail-Open — The Explicit Split

Restated and made infrastructure-operational from `12-security-architecture.md` Section 2.5/5.9: **security-critical Redis operations (rate limiting, revocation checks) fail closed** — an Upstash outage during these checks results in requests being rejected, a deliberate, accepted availability cost in exchange for never silently disabling a security control. **Performance-oriented caching (response/query caches) fails open** — an Upstash outage for these categories results in the application falling through to querying Postgres directly, a real latency cost but not a correctness or security one. This split is configured explicitly, per cache category, and is the single most important operational rule in this section, since conflating the two categories in either direction (fail-open on security checks, or fail-closed on routine caching) would be a serious defect.

### 10.6 Cache Capacity and Eviction

Upstash's managed memory limits (per the platform's chosen plan tier, Section 20.4's cost consideration) are monitored (Section 16.3) with alerting ahead of approaching capacity; TTL-based expiration (Section 10.3) is the primary, deliberate eviction mechanism, keeping the working set proportional to genuinely active data (recent rate-limit windows, currently-valid revoked tokens) rather than requiring the platform to rely on Redis's own memory-pressure eviction policies as the primary capacity-management strategy.

---

# 11. Background Jobs

### 11.1 Inngest Architecture

Inngest provides the platform's durable, retryable background-job orchestration (`10-backend-architecture.md` Section 12), operating as a managed execution/orchestration layer that invokes back into the application's own Route Handlers to run actual job logic (Section 5.5's service-to-service model) — Inngest itself does not run application code directly; it durably schedules, retries, and sequences calls into the platform's own deployed infrastructure, meaning a job's actual business logic runs within the same Vercel/Application Zone environment (and therefore the same database connection pooling, secrets management, and observability pipeline) as any other request.

### 11.2 Job Families

Restated from `13-testing-strategy.md` Section 17.2 as an infrastructure inventory: `notifications`, `search-indexing`, `media-processing`, `payouts`, `analytics`, `cleanup` — each a distinct Inngest function family with its own trigger events, retry configuration, and monitoring dashboard (Section 16.3), so an operational issue in one family (e.g., `media-processing` falling behind due to a malware-scanning-service slowdown) is isolated and diagnosable independent of the others.

### 11.3 Event-Driven Triggering

Jobs are triggered by events emitted from Service Layer functions at the moment a relevant state change occurs (an order placed, a media object uploaded, a payout batch scheduled) — restated here as an infrastructure reliability property: event emission and job execution are decoupled, so a transient Inngest-platform-level delay never blocks the triggering request's own response to the user; the user-facing operation completes synchronously, and its downstream side effects (an email, a search-index update) complete asynchronously, verified via `13-testing-strategy.md` Section 17.6's wiring smoke checks.

### 11.4 Retry and Idempotency at the Infrastructure Level

Inngest's built-in step-level retry (`10-backend-architecture.md` Section 12.2) means a transient failure in one step of a multi-step job (e.g., a Resend API timeout during a notification-fan-out job) retries only that step, not the entire job from the beginning — this is an infrastructure property the platform relies on rather than re-implements, but every job's business logic is still written to be idempotent under this retry model (`12-security-architecture.md` Section 13.4's Zero Trust principle applied to job re-execution), since infrastructure-level retry alone does not guarantee application-level idempotency without the job logic itself cooperating.

### 11.5 Dead-Letter Handling

A job that exhausts its configured retry budget is recorded as a terminal failure (`08-database-design.md`'s `SystemEvent` entity, per `13-testing-strategy.md` Section 17.4) and, for job families with a documented lower-priority fallback (`10-backend-architecture.md` Section 18.5 — e.g., an in-app notification persisting even if email delivery permanently fails), that fallback executes; for job families with no fallback, the terminal failure is surfaced as an alert (Section 16.4) routed to the owning module's engineers (Section 21), never silently dropped.

### 11.6 Scheduled (Cron) Jobs

Time-based jobs (creator payout batching, storage cleanup sweeps, session/token-family expiry cleanup) are configured as Inngest scheduled functions rather than a separately-managed cron infrastructure — this keeps all background-execution infrastructure, whether event-triggered or time-triggered, under one operational model with one monitoring surface (Section 16.3), rather than splitting operational ownership across two different scheduling systems.

### 11.7 Job Concurrency and Throughput

Inngest's per-function concurrency controls are configured per job family based on the downstream dependency each family's steps call — `media-processing` jobs (which call the malware-scanning service and R2) are throttled to a concurrency ceiling that respects that scanning service's own rate limits, while `notifications` jobs (largely calling Resend, which tolerates materially higher throughput) are configured with a higher concurrency ceiling — this per-family tuning is reviewed as part of Section 18.4's capacity planning whenever a new job family is introduced or an existing one's downstream dependency changes.

### 11.8 Background Job Monitoring

Job success/failure rate, retry frequency, queue depth (jobs pending execution), and per-family execution latency are tracked continuously (Section 16.3) via Inngest's own dashboard, correlated into the platform's unified observability pipeline (Section 17.5) by the same correlation ID the triggering request carried — this is what makes it possible to trace a user-visible symptom ("my order confirmation email never arrived") back through the exact job execution (or failure) that should have produced it.

---

# 12. CDN & Asset Delivery

### 12.1 CDN Architecture

Two complementary CDN layers serve the platform: **Vercel's Edge Network** serves the application's own rendered content (HTML/RSC payloads, per `11-frontend-architecture.md` Section 7's rendering strategy) and static build assets (JS/CSS bundles), while **Cloudflare's CDN** fronts Cloudflare R2 (Section 9.5) for media-asset delivery specifically — this split reflects that application content and media content have different caching characteristics (ISR-revalidated dynamic content vs. long-lived immutable media objects) best served by the layer purpose-built for each.

### 12.2 Static Asset Delivery

JavaScript/CSS bundles produced by the Next.js build are content-hashed (a filename that changes whenever the content changes) and served with long-lived, immutable `Cache-Control` headers from Vercel's Edge Network — a returning visitor's browser and every intermediate CDN edge cache serve these assets without a single origin round-trip until the underlying content genuinely changes (i.e., a new deployment), which is precisely why content-hashing (rather than a fixed filename with a short TTL) is the platform's asset-versioning strategy: it makes aggressive, indefinite caching safe.

### 12.3 Image Optimization Pipeline

`next/image` (per `11-frontend-architecture.md` Section 16.5) generates responsive, modern-format (AVIF/WebP-with-fallback) image variants at request time, cached at Vercel's edge after first generation so subsequent requests for the same size/format variant are served from cache rather than regenerated — combined with Section 9.6's R2-sourced, pre-generated responsive breakpoint widths at upload time, this two-stage approach (pre-generate the major size tiers at upload; let Vercel's image optimization handle exact-fit and format negotiation at request time) balances storage cost against request-time compute cost.

### 12.4 Cache-Control Strategy by Content Type

| Content Type | Cache-Control Strategy | Rationale |
|---|---|---|
| Static JS/CSS bundles | `public, max-age=31536000, immutable` | Content-hashed filenames make indefinite caching safe (Section 12.2) |
| ISR-revalidated pages (Category, Product Detail) | `s-maxage` matching the ISR revalidation window (`11-frontend-architecture.md` §7.4), `stale-while-revalidate` | Serves cached content instantly while refreshing in the background |
| SSR pages (Cart, Checkout, Account) | `private, no-store` | Personalized, must never be cached by a shared CDN layer |
| Product/creator media (R2-sourced) | `public, max-age` set to a long duration with cache-busting via content-addressed object keys on genuine replacement | Media rarely changes in place; a genuinely new image gets a new object key rather than overwriting the cached one |
| API responses (via the BFF, `11-frontend-architecture.md` §10.1) | `private, no-store` by default; explicit, narrow exceptions only for genuinely public, non-personalized read endpoints | Prevents accidental caching of personalized or sensitive API responses at any shared layer |
| Webhook endpoints | `no-store`, and explicitly excluded from any CDN caching layer entirely (Section 3.4) | Webhook requests must always reach the application directly |

### 12.5 Cache Purging

On-demand revalidation (`11-frontend-architecture.md` Section 7.4's webhook-triggered ISR revalidation from Admin CMS actions) is the platform's primary cache-invalidation mechanism for dynamic content — a full CDN purge is reserved for genuinely exceptional circumstances (a mis-published piece of content requiring immediate, platform-wide removal) and is a manual, logged, access-controlled operation (Section 21.4), not a routine deployment step, since routine deployments rely on content-hashed asset versioning (Section 12.2) rather than purging to ensure freshness.

### 12.6 Edge Middleware and CDN Interaction

Vercel Edge Middleware (Section 7.3) runs on every request before any CDN cache is consulted for personalized/authenticated routes, ensuring auth/session checks are never bypassed by a stale cached response — this ordering (middleware before cache-serving for any route where middleware has a role) is a deliberate configuration choice preventing the class of bug where a CDN serves a cached page to a user whose session state should have altered what they're shown.

---

# 13. Domain & DNS Strategy

### 13.1 Domain Architecture

Each of the three apps is served from its own subdomain of the platform's primary domain — a public-facing domain for `apps/buyer` (the platform's primary brand domain), a distinct subdomain for `apps/creator`, and a distinct, non-marketed subdomain for `apps/internal` — rather than path-based routing under one domain. **Why:** distinct subdomains give each app its own cookie/session boundary by default (`12-security-architecture.md` Section 7.2's per-app cookie scoping requirement is satisfied structurally by this domain architecture, not merely by configuration discipline), and allow independent Vercel project configuration (custom domains, caching rules, Section 12.4) per app without any cross-app interference.

### 13.2 DNS Provider and Resilience

Cloudflare is the platform's authoritative DNS provider (Section 3.2), chosen for its combined DNS-and-CDN role reducing the number of distinct providers in the platform's critical path. DNS records are managed as Infrastructure-as-Code (Section 2.2) rather than through ad hoc dashboard edits, with change history providing an audit trail for any DNS modification — a category of change with outsized potential impact (a DNS misconfiguration can take the entire platform offline even with every application-layer system healthy) and correspondingly treated with elevated review rigor (Section 21.4's access restriction).

### 13.3 SSL/TLS Architecture

TLS termination occurs at Vercel's edge for all first-party application traffic (Section 8.2 of `12-security-architecture.md`), with certificates automatically provisioned and renewed by Vercel's platform-managed certificate issuance — no manually-managed certificate exists anywhere in the platform's critical path. Cloudflare's DNS/proxy layer, where configured in proxied (not DNS-only) mode, additionally terminates and re-originates TLS at Cloudflare's edge for its own CDN functions (Section 12.1) — both hops are TLS 1.2-minimum/1.3-preferred, with no plaintext hop anywhere between the end user and the application (`12-security-architecture.md` Section 16.1's data-in-transit guarantee, confirmed here at the DNS/TLS-provisioning level).

### 13.4 Certificate Monitoring

Independent of Vercel's auto-renewal, certificate expiry across every first-party domain is monitored on a scheduled check (Section 16.3) as a defense-in-depth measure against a platform-level renewal failure going unnoticed (`12-security-architecture.md` Section 16.6) — restated here as a concrete, scheduled infrastructure monitoring task with a named owner (Section 21.2), not merely a documented risk.

### 13.5 Preview Deployment Domains

Every Vercel Preview deployment (Section 4.1) receives an automatically-generated, unique, unindexed subdomain (not a custom domain) — these are excluded from search-engine indexing by default (Vercel's platform behavior) and are not linked from any production surface, minimizing their discoverability without requiring the platform to maintain a separate access-control layer purely for URL obscurity (which is complemented by, not a substitute for, Section 4.4's genuine access-control layer for Staging specifically).

### 13.6 Domain Security

`DNSSEC` is enabled at the domain registrar/DNS-provider level to prevent DNS-response spoofing; `CAA` (Certificate Authority Authorization) records restrict which certificate authorities may issue certificates for the platform's domains, reducing the risk of a fraudulently-issued certificate from an authority outside this explicit allow-list — both are provisioned once as part of initial domain setup and reviewed whenever the platform's certificate-issuance configuration changes.

### 13.7 Subdomain Inventory

| Subdomain (Illustrative) | App/Purpose | Public? |
|---|---|---|
| `www.<domain>` / `<domain>` | `apps/buyer` | Yes |
| `sell.<domain>` (or equivalent) | `apps/creator` | Yes (marketed as the creator-onboarding entry point) |
| `ops.<domain>` (or equivalent, deliberately non-marketed) | `apps/internal` | Reachable but not publicly linked/marketed; access-gated (`12-security-architecture.md` §6.4) |
| `api.<domain>` (if a distinct API subdomain is used rather than path-based routing within each app) | Route Handlers, where exposed as a distinct origin | Depends on `09-api-architecture.md`'s finalized routing decision |
| `cdn.<domain>` / media subdomain | R2-fronted media delivery (Section 9.5) | Yes |

---

# 14. Secrets & Configuration

### 14.1 Configuration Philosophy

Restated and made infrastructure-operational from `12-security-architecture.md` Section 17: every credential, connection string, and environment-specific setting is externalized configuration, never hardcoded — and every such value is provisioned per-environment (Section 4.5's isolation guarantee), stored exclusively in Vercel's encrypted environment-variable store (or a dedicated secrets-management service, per that document's Section 17.2's near-term-hardening framing), and never committed to source control.

### 14.2 Configuration Categories

| Category | Examples | Scope |
|---|---|---|
| Infrastructure connection config | Supabase connection strings (pooled + direct), Upstash Redis URL, R2 credentials | Per-environment, server-only |
| Third-party integration credentials | Razorpay keys, Resend API key, Sentry DSN, PostHog key | Per-environment, server-only (except the narrow, documented public-key exceptions, `12-security-architecture.md` §17.4) |
| Application behavior configuration | Feature flags (Section 22.4), rate-limit tier values (`12-security-architecture.md` §8.3), cache TTLs (Section 10.3) | Per-environment, may be adjusted without a full redeployment where the platform's feature-flag infrastructure supports runtime toggling |
| Build-time configuration | Next.js build flags, Turborepo remote-cache credentials | CI/build-environment scoped |

### 14.3 Environment Variable Provisioning Workflow

A new environment variable is: (1) proposed and documented (its purpose, its required value per environment, and — critically — whether it belongs in the `NEXT_PUBLIC_*` client-exposed allow-list per `12-security-architecture.md` Section 17.4, decided explicitly, never by default); (2) added to Vercel's environment-variable store for each relevant environment independently (Section 4.5); (3) verified present and correctly scoped by a CI check (`12-security-architecture.md` Section 24.4) before the code depending on it is deployed. A deployment that references an unconfigured environment variable fails its build/health check (Section 16.5) rather than silently running with an undefined value.

### 14.4 Configuration Drift Prevention

Environment-variable values across Preview, Staging, and Production are periodically audited (Section 21's operational cadence) to confirm each environment holds the values `13-testing-strategy.md` Section 23.3's environment-configuration table expects — specifically checking that no environment inadvertently holds a credential belonging to a different environment's tier (a Staging deployment accidentally configured with a live Razorpay key being the canonical, highest-severity example this audit exists to catch).

### 14.5 Runtime Configuration vs. Feature Flags

Deployment-time configuration (Section 14.2, requiring a new deployment to change) is distinguished from genuinely runtime-adjustable configuration (Section 22.4's feature flags, adjustable without a redeployment) — this distinction is made explicitly per configuration value at the time it's introduced, since treating every configuration value as requiring a full redeployment to change would slow legitimate operational response (e.g., adjusting a rate-limit threshold during an active abuse incident), while treating every value as runtime-adjustable would introduce unnecessary complexity for values that genuinely only make sense to change alongside a code deployment.

### 14.6 Secrets Rotation Operational Procedure

Implements `12-security-architecture.md` Section 17.5's rotation cadence at the infrastructure-execution level: a scheduled reminder (Section 22.2's maintenance-window-adjacent cadence) triggers rotation review for every credential in Section 14.2's inventory; rotation itself follows the documented "update Vercel's store, confirm application pickup, then revoke the old credential at the provider" sequence, with the intermediate "confirm pickup" step verified via Section 16.5's health-check mechanism before the old credential is invalidated, preventing a rotation-induced outage.

---

# 15. Infrastructure Security

### 15.1 Relationship to `12-security-architecture.md`

This section is the infrastructure-provisioning implementation of `12-security-architecture.md` Section 18 (Infrastructure Security) and the network-adjacent portions of that document's Sections 4 (Trust Boundaries), 8 (API Security's transport layer), and 17 (Secrets Management) — it does not restate that document's rationale in full; it confirms and operationalizes it at the level of actual provider configuration.

### 15.2 Least-Privilege Infrastructure Access

Every operator credential (Vercel account access, Supabase project access, Cloudflare account access, Upstash/Inngest/Razorpay/Resend dashboard access) is provisioned per named individual, never a shared team login, and scoped to the minimum role each individual's function requires (Section 21's responsibility matrix) — a frontend engineer has no legitimate need for Supabase's project-owner role, and is not granted it, consistent with `12-security-architecture.md` Section 2.3's least-privilege principle applied to human operator access specifically, not only application service-account access.

### 15.3 Infrastructure Change Audit Trail

Every infrastructure-provider console supporting activity logging (Vercel's deployment/team-activity log, Supabase's project audit log, Cloudflare's audit log) has this logging enabled and retained, feeding the platform's unified observability pipeline (Section 17.5) where each provider's export capability allows — this extends `12-security-architecture.md` Section 20's application-level audit-logging discipline to infrastructure-provider-level actions (a team member's Vercel environment-variable edit, a Supabase RLS policy change made outside the Section 2.2 IaC pipeline as an emergency exception) so that infrastructure-level actions carry the same non-repudiation guarantee as application-level ones.

### 15.4 Network-Layer Access Restriction

Where a provider's tier supports it (Section 8.3's IP-allowlisting note), direct infrastructure access (a database administration client, an Upstash CLI session) is restricted to a defined set of known-source IPs (office/VPN egress, specific CI/CD runner ranges) — reducing the credential-alone attack surface for infrastructure access to require both a valid credential and network-origin legitimacy, a defense-in-depth layer (`12-security-architecture.md` Section 2.2) applied at the infrastructure-operator level.

### 15.5 Provider-Level Security Configuration Baseline

| Provider | Baseline Security Configuration |
|---|---|
| Vercel | MFA required for all team member accounts; deployment protection (Preview deployment access restriction, Section 4.4) enabled; environment variables encrypted at rest (`12-security-architecture.md` §17.2) |
| Supabase | MFA required for all project-owner-tier accounts; RLS enabled and enforced on every multi-tenant table (`12-security-architecture.md` §6.6); connection pooler as the only application-facing connection path (Section 8.3) |
| Cloudflare | MFA required for account access; DNSSEC and CAA records configured (Section 13.6); WAF/DDoS protection enabled at the account tier appropriate to the platform's risk profile |
| Upstash | MFA required for account access; TLS-only connections enforced (`12-security-architecture.md` §16.1); per-environment instance/database isolation (Section 10.2) |
| Inngest | MFA required for account access; signing-key-based event authentication (`12-security-architecture.md` §17.1) |

### 15.6 Infrastructure Vulnerability Management

Provider-side infrastructure (the managed Postgres instance, the Vercel Function runtime) is patched and maintained by each respective provider as part of their managed-service commitment (Section 2.1) — the platform's own vulnerability-management responsibility (`12-security-architecture.md` Section 27) is scoped to application-level dependencies (Section 23.4 of this document) and configuration the platform itself controls, with provider-side infrastructure vulnerabilities tracked via each provider's own security-advisory communication channel, subscribed to as part of Section 21.2's operational monitoring.

### 15.7 Infrastructure Incident Coordination

Where an incident (`12-security-architecture.md` Section 26) has an infrastructure-provider component (a Vercel platform outage, a Supabase-side incident), the platform's own incident response process coordinates directly with that provider's status/support channel as part of Section 26.4's containment and recovery phases — this document's Section 21.5 names the specific escalation path for each provider, so an infrastructure-provider-side incident does not require the on-call engineer to discover the correct escalation channel for the first time during the incident itself.

---

# 16. Monitoring & Health Checks

### 16.1 Monitoring Philosophy

Extends `10-backend-architecture.md` Section 18 and `12-security-architecture.md` Section 19's observability/detection architecture with the infrastructure-operational layer: every managed service in Section 3.1's topology has defined health signals, every health signal has a defined alerting threshold and owner, and the platform's overall health is continuously, automatically assessed — never inferred only from the absence of user complaints.

### 16.2 Health Check Architecture

Restated and expanded from `10-backend-architecture.md` Section 19.7: each of the three apps exposes a dedicated health endpoint, checked by Vercel's own platform monitoring and by an external, independent uptime-monitoring service (deliberately independent of Vercel itself, so a Vercel-platform-level issue affecting the health endpoint's own reachability is still detected). The health endpoint verifies, in order: the application process itself is responsive; the database connection pool (Section 8.3) can obtain a connection; Redis (Section 10.1) is reachable; and, for a deeper (but less frequently polled) check, that the most recent background-job execution (Section 11.8) completed within its expected window.

### 16.3 Monitored Signals by Layer

| Layer | Key Signals | Tooling |
|---|---|---|
| Compute (Section 7) | Function invocation count, error rate, duration (p50/p95/p99), cold-start frequency | Vercel Analytics, OpenTelemetry |
| Database (Section 8) | Query latency, connection-pool utilization, replication lag (if applicable), storage growth | Supabase metrics, OpenTelemetry |
| Cache (Section 10) | Hit/miss ratio, memory utilization, command latency | Upstash metrics |
| Storage (Section 9) | Upload success rate, storage volume, quarantine-queue depth | Application-level metrics via OpenTelemetry |
| Background Jobs (Section 11) | Success/failure rate, retry rate, queue depth, per-family latency | Inngest dashboard, OpenTelemetry |
| Frontend (real-user) | Core Web Vitals (`13-testing-strategy.md` §13.3), JS error rate | PostHog, Sentry, Vercel Speed Insights |
| Security (`12-security-architecture.md` §19) | `SecurityEvent` volume/severity distribution | Application-level, via the unified pipeline (Section 17.5) |
| Third-party integrations (Section 23) | Per-service call success rate, latency, circuit-breaker state | OpenTelemetry, provider-side dashboards |

### 16.4 Alerting Architecture

Alerting follows the same severity-tiered model `12-security-architecture.md` Section 19.3 defines for security events, extended here to infrastructure/availability signals generally: **Critical** (a health check failing, error rate exceeding a defined threshold, the database or cache becoming unreachable) pages the on-call engineer immediately; **High** (a sustained latency-budget regression, a circuit breaker opening, a background-job family's failure rate spiking) alerts within a short, defined window during and outside business hours; **Medium/Low** (a gradual storage-growth trend, a minor cache-hit-ratio decline) feed into Section 21's regular operational review rather than paging anyone individually.

### 16.5 Post-Deployment Health Verification

Implements `13-testing-strategy.md` Section 30.2's post-deployment checklist at the infrastructure-execution level: immediately following every deployment (Section 6.3), the automated smoke-test suite (that document's Section 24.2) exercises the health endpoint (Section 16.2) and a representative set of critical-path requests against the newly-live deployment; a failure here triggers Section 6.6's rollback consideration automatically, before the deployment is considered complete or broader monitoring (Section 16.4) is relied upon as the primary detection mechanism for a bad deployment.

### 16.6 Synthetic Monitoring

Beyond passive real-user and infrastructure-metric monitoring, synthetic checks (automated, scheduled requests exercising key flows — home page load, a representative Product Detail page, the health endpoint) run continuously against Production from multiple geographic locations, independent of actual user traffic — this is what allows the platform to detect a regional or provider-specific availability issue even during low-traffic periods (e.g., overnight in the platform's primary market) when real-user signal volume alone might be too sparse to reliably indicate a problem quickly.

### 16.7 Dashboard and Visibility

A unified operational dashboard (built on the OpenTelemetry-fed pipeline, Section 17.5) surfaces Section 16.3's signals across every layer in one place, accessible to the full engineering team — consistent with `13-testing-strategy.md` Section 2.3's "quality is everyone's responsibility" philosophy applied to operational health: infrastructure visibility is not siloed to a DevOps-only tool inaccessible to the engineers whose code most directly affects these signals.

---

# 17. Logging & Metrics

### 17.1 Structured Logging

Every log entry, across every app and every layer, is structured (JSON, per `10-backend-architecture.md` Section 18) rather than free-text — restated here as an infrastructure-ingestion requirement: structured logging is what makes centralized log aggregation (Section 17.4) and correlation (Section 17.5) mechanically possible at all, since a log-aggregation pipeline can reliably index and query structured fields in a way free-text logging would require fragile, error-prone parsing to approximate.

### 17.2 Log Levels and Retention

| Level | Use | Retention |
|---|---|---|
| `ERROR` | Unhandled exceptions, failed critical operations | 90 days (extended for any log tied to a `12-security-architecture.md` §20.3 audit-relevant event, per that document's retention table) |
| `WARN` | Recoverable failures, fallback-path activation (circuit breaker opening, degraded-mode operation) | 30 days |
| `INFO` | Significant business events (order placed, payout processed) — not a full request/response trace | 30 days |
| `DEBUG` | Verbose, development-oriented detail | Not enabled in Production by default; enabled temporarily, scoped, and time-boxed for active incident investigation only |

### 17.3 Sensitive Data in Logs

Restated as an infrastructure-pipeline confirmation of `12-security-architecture.md` Section 20.4: the logging pipeline's ingestion layer applies the same sensitive-field redaction as a defense-in-depth backstop beyond application-level discipline — any log entry matching a known-sensitive field-name pattern is redacted at ingestion, regardless of whether the emitting application code correctly avoided logging it in the first place, giving the platform two independent chances to prevent a sensitive-data logging leak rather than relying on application discipline alone.

### 17.4 Centralized Log Aggregation

Logs from all three Vercel apps, Inngest job executions, and (where each provider supports export) Supabase/Upstash/R2 platform-level logs are aggregated into a single, unified pipeline (via OpenTelemetry's collector architecture, per the finalized stack) rather than remaining siloed in each provider's own separate dashboard — an engineer investigating an issue queries one system, not five, to reconstruct what happened across the full request path.

### 17.5 Correlation and Tracing

Every request is assigned a correlation ID at the point it enters the Application Zone (Vercel Edge Middleware, Section 7.3), which propagates through every downstream call — database queries, Redis operations, Inngest job triggers, third-party API calls — via OpenTelemetry's distributed tracing (`10-backend-architecture.md` Section 18.5, `12-security-architecture.md` Section 19.5). This is the platform's single most valuable operational capability for incident investigation: a single correlation ID reconstructs the complete, ordered sequence of everything that happened in service of one request or one background job execution, across every infrastructure layer in Section 3.1's topology.

### 17.6 Metrics Architecture

Beyond individual log entries, aggregated metrics (request rate, error rate, latency percentiles, resource utilization — Section 16.3's full signal inventory) are emitted continuously via OpenTelemetry's metrics API, distinct from logging (metrics are pre-aggregated, low-cardinality, and cheap to query over long time ranges; logs are high-cardinality, detailed, and comparatively expensive to query broadly) — the platform uses each for its appropriate purpose: metrics for dashboards and alerting thresholds (Section 16.4), logs for detailed forensic investigation of a specific incident once a metric has indicated something worth investigating.

### 17.7 Business Metrics vs. Operational Metrics

Operational metrics (this section) are distinguished from and complementary to the business/product metrics `01-product-requirements.md` Section 10 defines (checkout conversion, creator retention) — both flow through related but distinct pipelines: operational metrics inform infrastructure health and capacity decisions (Section 18); business metrics, captured primarily via PostHog (`11-frontend-architecture.md` Section 23.2), inform product decisions. Where the two intersect (e.g., a latency regression's effect on checkout conversion), correlation is possible precisely because both share the platform's unified observability foundation (Section 17.5), even though their primary audiences and purposes differ.

### 17.8 Log and Metric Access Control

Read access to the aggregated observability pipeline is available broadly across engineering (Section 16.7's "visibility is not siloed" principle) for operational/debugging purposes, while access to any log stream containing pre-redaction sensitive data (a narrow, tightly-controlled exception path used only for specific incident investigation, per `12-security-architecture.md` Section 20.6's audit-log access-control model) is restricted to the same limited set of roles authorized for that document's Critical-tier data access.

---

# 18. Scaling Strategy

### 18.1 Scaling Philosophy

Restated from Section 2.7 and `00-project-vision.md` Section 15's growth ambition: the platform scales its infrastructure ahead of demonstrated need only where the cost of scaling reactively would be unacceptably disruptive (Section 18.3's database connection ceiling being the primary example), and scales reactively, automatically, and elastically everywhere the underlying managed service supports it natively (Section 18.2's compute layer) — never provisioning large fixed capacity speculatively across the board.

### 18.2 Compute Scaling

Fully automatic, per Section 7.6 — Vercel Functions scale horizontally with incoming request volume with no manual intervention required within the platform's configured plan-tier limits. The platform's operational responsibility here is limited to monitoring for and, if ever approached, upgrading the relevant Vercel plan-tier ceiling (Section 20.5) well ahead of it becoming a genuine constraint, verified via Section 16.3's compute-layer signal tracking.

### 18.3 Database Connection Scaling

The platform's most deliberately-managed scaling constraint: Section 8.3's connection pooler has a finite connection budget, and unlike compute (Section 18.2), this does not scale purely automatically with traffic — it requires proactive capacity planning as traffic grows.

| Traffic Tier (Illustrative) | Estimated Peak Concurrent Requests | Required Pooler Connection Budget | Action |
|---|---|---|---|
| Launch (current) | Low hundreds | Supabase's default pooler tier | No action — headroom is ample |
| Early growth | Low thousands | Approaching a meaningful fraction of the default tier's budget | Monitor closely (Section 16.3); begin evaluating a pooler-tier upgrade |
| Established growth | High thousands+ | Requires an upgraded Supabase compute/pooler tier | Proactively upgrade *before* the prior tier's utilization trend (Section 16.4's Medium-severity signal) reaches a defined warning threshold, never reactively after exhaustion causes user-visible errors |

### 18.4 Third-Party Rate Limit Scaling

Razorpay, Resend, and other third-party integrations (Section 23) each carry their own account-tier rate/volume limits, independent of the platform's own infrastructure scaling — these are tracked explicitly (Section 21.2's vendor-relationship ownership) and proactively renegotiated/upgraded ahead of traffic growth approaching them, following the same "monitor the trend, act before the threshold" discipline as Section 18.3's database connection planning, since a third-party rate limit breach degrades user experience (a failed payment, a delayed email) in a way entirely outside the platform's own infrastructure control to remediate reactively in the moment.

### 18.5 Caching as a Scaling Lever

Section 10's caching layer is itself a deliberate scaling strategy, not merely a latency optimization: every request served from Upstash cache (Section 10.3) or from Vercel's edge cache (Section 12.4) for ISR-revalidated content is a request that never reaches the database connection pool (Section 18.3) at all — as traffic grows, the platform's caching strategy is reviewed specifically for opportunities to shift additional read-heavy, cacheable traffic (`08-database-design.md` Section 2.5's read-heavy optimization philosophy) further from the database, since this is materially cheaper than scaling the database tier itself.

### 18.6 Background Job Scaling

Inngest's execution model (Section 11.1) scales job throughput largely automatically, bounded by Section 11.7's per-family concurrency configuration, which is itself the deliberate scaling lever for this layer — as traffic grows, concurrency ceilings are revisited per job family against their downstream dependencies' own capacity (a malware-scanning service, Resend's sending limits), following the same proactive-review discipline as Section 18.4.

### 18.7 Capacity Planning Cadence

Section 18.3–18.4's proactive-scaling decisions are informed by a regular (monthly, more frequent as growth accelerates) capacity-review process (Section 21's operational cadence) examining Section 16.3's trend data against Section 18.3's tiered thresholds — capacity decisions are never made purely reactively, in the middle of an incident, when they can instead be anticipated from trend data reviewed on a predictable cadence.

### 18.8 Load Testing as Scaling Validation

`13-testing-strategy.md` Section 13.5's load testing is this document's primary empirical validation mechanism for whether Section 18.3–18.4's capacity plan actually holds under realistic concurrent traffic — a capacity plan is not considered validated on paper calculation alone; it is confirmed against an actual simulated-load test result before being relied upon ahead of an anticipated high-traffic event (that document's Section 13.5's seasonal-shopping-period example).

---

# 19. Backup & Disaster Recovery

### 19.1 Relationship to `12-security-architecture.md` Section 25

That document defines the platform's backup/DR *requirements and rationale* (RPO/RTO targets, encryption, integrity verification); this section defines the *infrastructure execution* of those requirements — the concrete provisioning, runbooks, and recovery procedures.

### 19.2 Backup Inventory

| Data Store | Backup Mechanism | Frequency/Coverage | Retention |
|---|---|---|---|
| Supabase Postgres | Continuous point-in-time recovery (WAL-based) | Continuous | 30 days minimum (`12-security-architecture.md` §25.1), extended for compliance-relevant data per that document's §21.5 |
| Cloudflare R2 | Bucket versioning enabled | Continuous (every object write/delete versioned) | Per Section 15.4's deliberate-deletion-only application pattern, combined with a defined version-retention window |
| Upstash Redis | Not independently backed up | N/A | Redis holds no data above `12-security-architecture.md` §3.3's Medium sensitivity tier by design (§15.5) — fully reconstructable from Postgres/application state if lost, so dedicated backup is unnecessary |
| Application configuration (Section 14) | Version-controlled Infrastructure-as-Code (Section 2.2) | Every change | Indefinite (Git history) |
| Inngest job/event history | Provider-managed retention | Per Inngest's platform retention policy | Sufficient for operational replay/audit within the platform's typical incident-investigation window |

### 19.3 Disaster Scenarios and Response

| Scenario | Primary Response | RTO Target |
|---|---|---|
| Bad deployment (application-level regression) | Instant rollback (Section 6.6) | Minutes |
| Database corruption/accidental mass deletion | Point-in-time recovery restore (Section 19.5) | Under 4 hours (`12-security-architecture.md` §25.4) |
| Full Supabase regional outage | Failover per Supabase's managed HA (Section 8.5); if a genuine extended regional outage, restore into a new region from backup (Section 19.5) | Under 4 hours for restore-based recovery; faster if Supabase's own failover resolves it |
| Full Vercel platform outage | No self-hosted failover exists for compute — this is an accepted dependency on Vercel's own platform-level availability SLA, monitored (Section 16.6) with status communicated per Section 21.6 | Dependent on Vercel's own incident resolution |
| R2 data loss (a hypothetical, low-likelihood provider-level event) | Bucket versioning (Section 19.2) provides object-level recovery; R2's own durability guarantee (Section 9.4) makes a full-bucket-loss scenario extremely unlikely | Object-level: minutes; theoretical full-bucket scenario: dependent on Cloudflare's own incident resolution |
| Ransomware/mass destructive attack (`12-security-architecture.md` §25.6) | Point-in-time recovery restore to a pre-attack point, combined with credential rotation (Section 14.6) and incident response (§26 of that document) | Under 4 hours for data recovery; full incident closure timeline varies |

### 19.4 High Availability Architecture

The platform's HA posture is inherited primarily from its managed-service providers (Section 2.1): Vercel's compute layer has no single point of failure by construction (Section 7.6's auto-scaling, multi-instance-by-default model); Supabase provides managed database failover (Section 8.5); Upstash and R2 similarly provide provider-managed redundancy. The platform's own architectural contribution to HA is ensuring application code correctly tolerates the brief interruptions these managed failovers can still produce (Section 7.5's resilience patterns) rather than treating any single request's failure during a failover event as a hard, unrecoverable error.

### 19.5 Database Restore Procedure (Runbook Summary)

```
1. Incident Commander (12-security-architecture.md §26.3) confirms restore
   is the correct response (vs. a faster alternative, e.g., rollback alone
   resolving an application-level-only issue)
2. Identify the target restore point (a specific timestamp, chosen to be
   immediately before the corrupting event, balancing data-loss minimization
   against restoring corrupted data)
3. Initiate point-in-time-recovery restore into a NEW, isolated Supabase
   project/instance — never restore-in-place over the live production
   database, preserving the corrupted state as forensic evidence
   (12-security-architecture.md §26.5) until the incident is fully closed
4. Verify the restored instance's data integrity against a defined
   verification checklist (row counts for key tables, spot-checks against
   known-good recent records)
5. Cut application traffic over to the restored instance (a coordinated
   configuration change, Section 14.3's provisioning workflow followed
   under incident-response urgency, per 12-security-architecture.md §26.6's
   accountable-bypass procedure if the standard timeline must be
   compressed)
6. Confirm application health (Section 16.2) against the restored instance
   before declaring the incident's data-recovery phase complete
7. Post-incident review (12-security-architecture.md §26.6) examines root
   cause and whether Section 19's backup/recovery architecture itself
   needs adjustment
```

### 19.6 Disaster Recovery Rehearsal

Implements `12-security-architecture.md` Section 25.5 at the infrastructure-execution level: a full rehearsal of Section 19.5's runbook — an actual restore into an isolated environment, followed by actual application-health verification against it — is conducted at minimum annually, with the rehearsal's actual elapsed time measured against Section 19.3's RTO targets, and any gap between rehearsed and target time treated as a finding requiring remediation (faster tooling, a more precisely pre-defined restore-point-identification process) before the next scheduled rehearsal.

### 19.7 Backup Integrity Verification

Restated as a scheduled infrastructure task (Section 21.2): quarterly, at minimum, a backup is actually restored and verified (`12-security-architecture.md` Section 25.3) — an untested backup is treated as an unverified claim, not a reliable recovery capability, consistent with that document's explicit rejection of "backups are configured" as sufficient evidence of genuine recoverability.

### 19.8 Disaster Recovery Communication Plan

During a genuine disaster-recovery event, the Communications Lead role (`12-security-architecture.md` Section 26.3) owns both internal (engineering, leadership) and, where warranted, external (affected users, per that document's Section 26.7) communication — this document's contribution is ensuring the infrastructure-level status information (which systems are affected, current recovery-phase progress against Section 19.3's RTO target) is available and legible to that role throughout the event via Section 16.7's unified dashboard, rather than requiring ad hoc status-gathering from multiple disconnected systems during an already-high-pressure event.

---

# 20. Cost Management

### 20.1 Cost Philosophy

Restated from Section 2.7: infrastructure cost scales with actual usage (Vercel's request/compute-based billing, Supabase's compute-tier billing, R2's storage-and-zero-egress model, Upstash's request-based billing) rather than fixed, speculatively-large provisioned capacity — the platform's cost structure is, by the finalized stack's own design, naturally proportional to real traffic and real growth, minimizing the risk of either paying for unused speculative capacity or being caught undersized by unexpectedly fast growth.

### 20.2 Cost Drivers by Layer

| Layer | Primary Cost Driver | Optimization Lever |
|---|---|---|
| Compute (Vercel) | Function invocation count and duration | Rendering-strategy discipline (`11-frontend-architecture.md` §7) minimizing unnecessary server-side compute (e.g., ISR/PPP over full SSR where the data allows it, Section 7.4/7.7 of that document) |
| Database (Supabase) | Compute tier (instance size) and storage volume | Query-performance discipline (`13-testing-strategy.md` §13.7) keeping the required compute tier lower than an unoptimized query pattern would demand |
| Storage (R2) | Storage volume (egress is zero-cost, Section 9.1) | Section 9.6's lifecycle management (orphaned-object cleanup) keeping storage proportional to genuinely active content |
| Cache (Upstash) | Request volume and memory tier | Section 10.3's TTL discipline keeping the working set — and therefore memory tier requirement — proportional to genuinely active data |
| Background Jobs (Inngest) | Execution/step count | Section 11.7's concurrency tuning avoids both under-provisioning (causing retries, which cost additional executions) and unnecessary over-triggering |
| Third-party (Razorpay, Resend, PostHog, Sentry) | Transaction volume (Razorpay), email volume (Resend), event volume (PostHog), error-event volume (Sentry) | Section 23's integration-scoping discipline; Sentry's error-rate itself being low is both a reliability *and* cost signal |
| CDN/Edge (Vercel, Cloudflare) | Bandwidth and edge-request volume | Section 12's aggressive, correctly-scoped caching strategy directly minimizes origin-hitting requests |

### 20.3 Storage Cost Architecture (R2 Specifically)

Restated from Section 9.1 as this section's concrete cost rationale: R2's zero-egress-fee model was a deliberate selection specifically because product/creator photography (`06-design-system.md` Section 9's rigorous photography quality standard, implying meaningful per-image file size) is the platform's highest-bandwidth content category, and an egress-charged storage provider would make image-heavy growth — precisely the growth pattern a successful, catalog-expanding marketplace expects — disproportionately, unpredictably expensive relative to actual business value generated.

### 20.4 Environment Cost Allocation

Non-production environments (Section 4) are provisioned at deliberately smaller capacity tiers than Production — Preview/Development/CI environments in particular are ephemeral and minimally provisioned (Section 4.1), and Staging runs at a modest, fixed tier sufficient for its testing purpose (`13-testing-strategy.md` Section 23) without mirroring Production's full scale — cost-proportionality applies across the environment strategy, not only within Production.

### 20.5 Cost Monitoring and Anomaly Detection

Spend across every provider in Section 20.2's inventory is tracked against a defined budget/trend baseline, with alerting (Section 16.4's Medium-severity tier, typically) on any unexpected spike — a sudden cost anomaly is frequently a leading indicator of an operational problem (a runaway background job, Section 11.7's concurrency misconfiguration causing excessive retries; an unoptimized query causing elevated Function duration, Section 20.2's compute driver) before that problem manifests as a user-visible symptom, making cost monitoring a genuine operational-health signal, not merely a finance concern.

### 20.6 Cost Optimization Review Cadence

Aligned with Section 18.7's capacity-planning cadence: a regular (monthly, or more frequent during active growth) review examines Section 20.2's per-layer cost trends against usage growth, specifically distinguishing cost growth that is proportional and expected (more users, more orders, more storage — a healthy signal) from cost growth disproportionate to usage growth (a signal of inefficiency worth investigating, per Section 20.5).

### 20.7 Cost-Aware Architecture Decisions

Every architectural decision elsewhere in this document that has a cost dimension states it explicitly rather than treating cost as an afterthought reviewed only in this section — Section 7.2's compute-region choice, Section 9.1's storage-provider selection, Section 12's caching strategy, and Section 18's scaling discipline are all, in part, cost decisions, consistent with Section 2.7's stated principle that cost is an engineering input considered alongside performance, security, and reliability at the point each decision is made, not a separate, later-stage optimization pass.

---

# 21. Platform Operations

### 21.1 Operational Responsibility Matrix

| Function | Primary Owner | Escalation |
|---|---|---|
| Deployment pipeline health (Section 6) | DevOps/Platform Engineering | Engineering Lead |
| Database infrastructure (Section 8) | DevOps/Platform Engineering, with Backend Engineering for schema/query concerns | Engineering Lead |
| Storage infrastructure (Section 9) | Backend Engineering (Media module owners, per `10-backend-architecture.md` §5.25) | DevOps/Platform Engineering |
| Caching infrastructure (Section 10) | Backend Engineering | DevOps/Platform Engineering |
| Background jobs (Section 11) | Backend Engineering (per job-family module ownership) | DevOps/Platform Engineering |
| CDN/Domain/DNS (Sections 12–13) | DevOps/Platform Engineering | Engineering Lead (given blast radius, Section 13.2) |
| Secrets/configuration (Section 14) | DevOps/Platform Engineering | Engineering Lead + Security |
| Infrastructure security (Section 15) | Security, with DevOps/Platform Engineering for provider-configuration execution | Engineering Lead |
| Monitoring/alerting (Section 16) | DevOps/Platform Engineering, with on-call rotation for active alert response | Incident Commander (per `12-security-architecture.md` §26.3), for escalated incidents |
| Backup/DR (Section 19) | DevOps/Platform Engineering | Engineering Lead |
| Cost management (Section 20) | Engineering Lead, with input from DevOps/Platform Engineering | Founder/leadership (`00-project-vision.md` §5.4's Founder persona) |
| Third-party vendor relationships (Section 23) | Engineering Lead | Founder/leadership for contract/tier decisions |

### 21.2 On-Call Rotation

A defined on-call rotation (DevOps/Platform Engineering and senior Backend Engineering, rotating on a regular, sustainable cadence) owns first response to Section 16.4's Critical/High alerts outside standard working hours — mirroring `12-security-architecture.md` Section 26.3's incident-role model, with the on-call engineer serving as the initial Incident Commander until a dedicated one is assigned for a genuinely significant incident. On-call load and alert-quality (Section 16.4's tiering discipline — specifically, avoiding alert fatigue from over-broad Critical-tier classification) are reviewed regularly as part of Section 21.1's operational cadence, since a rotation that pages too frequently on low-value signals degrades response quality precisely when a genuine incident occurs.

### 21.3 Runbooks

Every recurring operational procedure with more than trivial complexity — database restore (Section 19.5), credential rotation (Section 14.6), a manual rollback (Section 6.6), scaling-tier upgrade (Section 18.3) — has a documented, versioned runbook (living alongside this document, referenced from it, updated whenever the underlying procedure changes) so that the correct execution of these procedures does not depend on any single individual's memory, especially under the time pressure of an active incident.

### 21.4 Access Review Cadence

Infrastructure access (Section 15.2) is reviewed on a regular cadence (quarterly, at minimum) — confirming every individual's granted access still matches their current role and genuine operational need, and revoking access for anyone whose role has changed or who has left the team, mirroring `12-security-architecture.md` Section 17.6's secrets-access review discipline extended here to infrastructure-provider access broadly.

### 21.5 Provider Escalation Contacts

Each managed-service provider in Section 3.1's topology has a documented support/escalation path (support tier, status-page URL, and — where the platform's plan tier includes it — a named account contact) maintained as part of Section 21.3's runbook set, so that Section 15.7's infrastructure-incident coordination has a ready, pre-researched path rather than requiring discovery during the incident itself.

### 21.6 Status Communication

For any incident with genuine user-visible impact, a status-communication channel (a public status page, or — at the platform's current scale — a defined internal-to-external communication path via Support, per `01-product-requirements.md` Section 4.25) is updated per `12-security-architecture.md` Section 26.7's factual, specific transparency principle — infrastructure status communication follows the same honesty-first content discipline `05-design-principles.md` Section 12 establishes for the product generally, extended here to operational incident communication specifically.

### 21.7 Operational Meeting Cadence

A regular (weekly or biweekly) operational review examines Section 16's monitoring trends, Section 18.7's capacity signals, Section 20.6's cost trends, and any open Section 21.3 runbook gaps or Section 15.6 vulnerability-tracking items — this is the standing forum where slow-building operational risk (the kind no single alert would trigger) is caught, distinct from and complementary to incident-driven, reactive operational attention.

---

# 22. Maintenance Strategy

### 22.1 Planned Maintenance Philosophy

The platform's managed-service architecture (Section 2.1) means the large majority of underlying infrastructure maintenance (database patching, runtime updates) is the provider's responsibility and typically requires no platform-initiated maintenance window at all — this section addresses the maintenance the platform itself must actively plan and execute: dependency updates, schema migrations with genuine operational impact, and provider-tier upgrades.

### 22.2 Maintenance Windows

Where a maintenance action does carry genuine, if brief, risk of user-visible impact (a rare, more invasive database migration; a coordinated multi-step credential rotation, Section 14.6), it is scheduled during the platform's lowest-traffic window (informed by Section 16.3's traffic-pattern data) and communicated internally in advance — the platform's architecture (Section 6.4's zero-downtime deployment model) is designed specifically to make the need for genuine user-facing maintenance windows rare, reserved for the narrow category of change that cannot be made zero-downtime by construction.

### 22.3 Dependency Update Cadence

Application-level dependencies (npm packages, per `12-security-architecture.md` Section 24.3) follow a regular, proactive update cadence — not deferred until a vulnerability forces an urgent update — distinguishing routine version-currency maintenance (a scheduled, lower-urgency cadence) from security-driven patches (Section 15.6/`12-security-architecture.md` Section 27.3's expedited path). Major framework version upgrades (a future Next.js major version, for instance) are planned as a deliberate, scoped project with its own testing rigor (`13-testing-strategy.md` Section 22's full pyramid re-verified against the upgrade), never adopted reflexively on release day.

### 22.4 Feature Flags as a Maintenance and Release Tool

Restated from Section 6.8: the platform's feature-flag infrastructure (evaluated server-side, per `11-frontend-architecture.md`'s architecture, with flag state itself treated as Section 14.5's runtime-adjustable configuration category) supports gradual rollout, instant kill-switch capability for a problematic feature without requiring a full redeployment/rollback, and maintenance-mode-adjacent capability (temporarily disabling a specific, non-critical feature during a targeted maintenance action without taking the entire platform offline) — this is the platform's primary tool for making maintenance and risky-release management surgical rather than all-or-nothing.

### 22.5 Provider-Side Maintenance Coordination

Where a managed-service provider schedules their own maintenance (a Supabase-side database maintenance window, for instance), the platform subscribes to that provider's maintenance-notification channel (Section 21.5's escalation-contact runbook includes this) and, for any provider-side maintenance with a stated potential availability impact, plans Section 7.5's resilience patterns (retry, circuit breaking) to absorb it gracefully, and communicates internally ahead of the window per Section 22.2.

### 22.6 Deprecation and Sunset Process

Restated from `09-api-architecture.md` Section 25 (API versioning) and `08-database-design.md`'s schema-evolution discipline: any deprecated infrastructure component (an old API version, an unused background-job family, a legacy configuration value) follows a defined sunset timeline — deprecated, then monitored for residual usage, then removed — never left indefinitely in an ambiguous, half-maintained state, consistent with `12-security-architecture.md` Section 8.8's observation that unmaintained legacy surface area is a common, avoidable source of accumulated risk.

---

# 23. Third-Party Services

### 23.1 Service Inventory (Infrastructure View)

Extends `12-security-architecture.md` Section 23.1's risk-tiered inventory with this document's infrastructure-operational detail:

| Service | Role | Plan Tier Consideration | Failure Mode Handling |
|---|---|---|---|
| Razorpay | Payment processing | Tier scales with transaction volume; monitored per Section 18.4 | Circuit breaker (`10-backend-architecture.md` §17.5); COD fallback where regionally applicable (per `13-testing-strategy.md` §16.3) |
| Resend | Transactional email | Tier scales with send volume | Retry via Inngest (Section 11.4); in-app notification fallback (`10-backend-architecture.md` §18.5) |
| Cloudflare R2 | Object storage | Storage-volume-based (Section 20.3) | R2's own durability (Section 9.4); no application-level fallback needed given R2's SLA |
| Upstash Redis | Cache/rate-limit/session infrastructure | Request-volume-based | Fail-closed/fail-open split (Section 10.5) |
| Inngest | Background job orchestration | Execution-volume-based | Built-in retry (Section 11.4); dead-letter handling (Section 11.5) |
| Sentry | Error monitoring | Event-volume-based | If Sentry itself is unavailable, application error handling continues unaffected (Sentry is an observability sink, never in the request's critical path) |
| OpenTelemetry Collector | Telemetry pipeline | Self-hosted-or-managed collector, scales with telemetry volume | Telemetry loss during a collector outage is an acceptable, bounded degradation — never allowed to block or slow the requests it's observing |
| PostHog | Product analytics | Event-volume-based | Same non-blocking posture as Sentry — analytics capture failure never affects the user-facing request |

### 23.2 Vendor Onboarding Process

Any new third-party service proposed for integration follows: `12-security-architecture.md` Section 23.2's security/compliance evaluation, this document's own infrastructure-fit evaluation (does it fit the platform's existing resilience patterns, Section 7.5; what is its own availability SLA and status-communication channel, Section 21.5), and an explicit cost-model evaluation (Section 20.2's framework applied to the new service) — before being added to Section 23.1's inventory and integrated into the unified monitoring pipeline (Section 16.3).

### 23.3 Multi-Environment Third-Party Configuration

Fully specified at `13-testing-strategy.md` Section 23.3's table; restated here as this document's infrastructure-provisioning confirmation: every third-party service is configured with genuinely separate credentials and, where the provider offers one, a genuinely separate sandbox/test-mode environment per Section 4's environment tiers — never a single shared account/credential used across Development, Staging, and Production with only application-level logic distinguishing "test" from "real" behavior.

### 23.4 Third-Party Dependency Risk Management

Beyond the vendor-relationship risk `12-security-architecture.md` Section 23.6 reviews annually, this document's specific infrastructure concern is **service concentration risk**: Section 3.1's topology deliberately does not introduce unnecessary dependencies on services beyond what's functionally required, and where a service in Section 23.1 has no readily-available alternative (Razorpay for the platform's specific regional payment-method support, per `10-backend-architecture.md` Section 16), that concentration is a known, accepted, and monitored risk rather than an unexamined one.

### 23.5 Service-Level Agreement Awareness

Each provider's own stated (or plan-tier-implied) availability SLA is tracked (Section 21.5's runbook) and factored into Section 19.3's disaster-scenario planning — the platform's own overall availability target is necessarily bounded by the weakest SLA among its critical-path dependencies (most notably Vercel and Supabase), a constraint this document names explicitly rather than implicitly assuming the platform's own availability could exceed what its foundational managed services themselves commit to.

---

# 24. Infrastructure Review Checklist

This checklist is evaluated before this document is considered final, and periodically thereafter as the platform evolves, and — in its production-readiness form (Section 24.2) — before any major release or infrastructure change.

### 24.1 Document Consistency Review

- [ ] Does every section's terminology and service reference match `08-database-design.md`, `09-api-architecture.md`, `10-backend-architecture.md`, `11-frontend-architecture.md`, `12-security-architecture.md`, and `13-testing-strategy.md` exactly, with no undocumented drift?
- [ ] Does Section 4's environment strategy remain fully consistent with `13-testing-strategy.md` Section 23's environment-tier table?
- [ ] Does Section 15 fully and correctly reference every relevant control in `12-security-architecture.md` without duplicating or contradicting it?

### 24.2 Production Readiness Checklist (Per Major Release/Infrastructure Change)

- [ ] **Deployment**: Rollback path confirmed viable (Section 6.6, `13-testing-strategy.md` §30.3).
- [ ] **Database**: Any migration reviewed for backward compatibility and reversibility status (Section 8.7).
- [ ] **Monitoring**: New functionality has corresponding health signals and alerting configured (Section 16.3–16.4) before it carries production traffic.
- [ ] **Scaling**: Capacity impact assessed against Section 18.3–18.4's thresholds for any change with a meaningful traffic or resource-consumption profile.
- [ ] **Security**: Section 15's baseline configuration confirmed unaffected or correctly updated for any infrastructure-touching change.
- [ ] **Backup/DR**: Any new data store or storage category has a defined backup strategy (Section 19.2) before going live.
- [ ] **Cost**: Any new infrastructure component has an estimated cost impact reviewed (Section 20.2) before provisioning.
- [ ] **Secrets**: Any new credential is provisioned per-environment correctly (Section 14.3) with no cross-environment leakage (Section 14.4).
- [ ] **Runbooks**: Any new operationally-significant procedure has a corresponding runbook (Section 21.3) before it's relied upon in production.

### 24.3 Ongoing Health Review Checklist (Section 21.7's Cadence)

- [ ] Monitoring trends (Section 16.3) reviewed for any Medium/Low-severity signal warranting proactive attention before it becomes Critical/High.
- [ ] Capacity trends (Section 18.7) reviewed against Section 18.3–18.4's tiered thresholds.
- [ ] Cost trends (Section 20.6) reviewed for any disproportionate growth signal.
- [ ] Access review (Section 21.4) completed for the current period.
- [ ] Backup integrity (Section 19.7) verified for the current period, if due.
- [ ] Third-party vendor risk (Section 23.4–23.5) reviewed for any material change.

---

# 25. Future Infrastructure Evolution

Consistent with the "reserve the seam, don't build the feature" discipline established throughout this document series, the following are explicitly deferred — not built for v2 launch — with the specific architectural readiness already in place for each, mirroring `12-security-architecture.md` Section 31's structure applied here to infrastructure specifically.

| Enhancement | Current Readiness | Trigger for Prioritization |
|---|---|---|
| **Multi-region compute/database deployment** | Section 8.2's single-region choice is deliberate for launch; Section 3.1's topology does not structurally prevent a future multi-region expansion | International market expansion becoming an active roadmap item (`04-information-architecture.md` §21), triggering `12-security-architecture.md` §21.7's data-residency review first |
| **Dedicated secrets-management service** (beyond Vercel's environment-variable store) | `12-security-architecture.md` §17.2's near-term-hardening framing; Section 14.1 of this document does not architecturally depend on Vercel's store specifically | Team/secrets scale exceeding Vercel's store's access-control granularity |
| **Database read replicas** | Section 8.1's single-primary model is sufficient at current read/write ratio; `08-database-design.md` §2.4's OLTP/analytics isolation principle already anticipates eventual read-scaling need | Sustained database-layer latency pressure (Section 16.3) not resolved by caching (Section 18.5) alone |
| **Dedicated incident-management tooling** (beyond the process defined in Section 21 and `12-security-architecture.md` §26) | Process-level readiness exists; tooling is currently lightweight/manual | Incident frequency or team size reaching a point where manual coordination (Section 21.2) becomes the bottleneck rather than the underlying technical response |
| **Formal SRE error-budget practice** | Section 16's monitoring foundation and Section 18.7's capacity-review cadence are direct prerequisites already in place | Sufficient production traffic/incident history to establish meaningful, statistically-grounded reliability targets beyond Section 3.1's currently-qualitative resilience goals |
| **Automated capacity scaling for the database layer** (beyond Section 18.3's manual, proactive tier-upgrade process) | Supabase's own platform capability is the dependency; the platform's own process (Section 18.7) is designed to be superseded by automation without requiring a philosophical change, only a tooling one | Supabase platform capability maturing to support it reliably at the platform's risk tolerance |
| **Expanded synthetic monitoring coverage** (Section 16.6, currently scoped to key flows) | Foundation (the synthetic-check infrastructure itself) already exists | Growing screen/flow surface area (per `07-ui-screens-wireframes.md`'s inventory) making broader synthetic coverage proportionately valuable |
| **Chaos engineering practice** (deliberate, controlled production fault injection beyond `13-testing-strategy.md` §13.6's staging-based stress testing) | Section 7.5's resilience patterns and Section 19.6's DR rehearsal discipline are the direct precursors | Platform maturity and traffic scale reaching a point where staging-based stress testing alone no longer provides sufficient confidence in production-specific failure modes |
| **Infrastructure cost allocation by team/module** (beyond Section 20's platform-wide cost tracking) | Section 20.2's per-layer cost-driver breakdown is the foundation this would extend | Team size and module-ownership structure (Section 21.1) growing to a point where granular cost accountability per owning team adds genuine decision-making value |

---

*This document is the infrastructure and operations constitution of Dreams by Kalakaaar v2. Every environment provisioned, every deployment executed, every alert configured, and every dollar of infrastructure spend — today and years from now — should be traceable to a decision and its reasoning recorded here, and, transitively, back to `08-database-design.md`, `09-api-architecture.md`, `10-backend-architecture.md`, `11-frontend-architecture.md`, `12-security-architecture.md`, and `13-testing-strategy.md`. Where a new operational need arises that this document does not yet cover, it is resolved deliberately, documented, and added here before it is relied upon in production — the operational discipline leads, the infrastructure follows.*
