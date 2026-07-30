# 18 · Observability & Monitoring Architecture — Dreams by Kalakaaar v2

**Document owner:** Principal Site Reliability Engineer / Staff Observability Engineer
**Status:** Draft for review
**Audience:** Every engineer, DevOps/Platform Engineering, QA, Support, Engineering Leadership
**Last updated:** 2026
**Depends on:** 00-project-vision.md through 16-cicd-release-management.md in full, most directly 08-database-design.md (Sections 21, 23), 09-api-architecture.md (Sections 2.18–2.20), 10-backend-architecture.md (Section 19), 12-security-architecture.md (Sections 20, 26), 13-testing-strategy.md (Sections 13, 31), 14-infrastructure-devops-architecture.md (Sections 16–17), and 16-cicd-release-management.md (Sections 20–21)
**Precedes:** All dashboard construction, alert configuration, and day-to-day operational practice

> **This document defines observability strategy, not implementation.** It contains no OpenTelemetry SDK configuration, no dashboard-as-code, no alert-rule syntax. Its purpose is to be the single reference from which every log line, metric, trace, health check, dashboard, and alert is designed and judged — the answer to "how do we know the platform is actually healthy, and how do we find out fast when it isn't."

---

# 1. Introduction

## 1.1 Purpose

Every prior document in this series describes a system worth building (00–09), an architecture worth building it on (10–14), and a process for safely changing it (15–16). None of that guarantees the system is actually healthy at any given moment, or that a problem — however well-tested the code that caused it — is discovered in seconds rather than from an angry buyer's support ticket hours later. This document exists to close that gap: it defines what this platform observes about itself, continuously, and how that observation turns into fast detection, fast diagnosis, and fast resolution of anything wrong.

## 1.2 Scope

**In scope:** observability philosophy and architecture; logging, metrics, and distributed tracing strategy (the three pillars, Section 3.3); error tracking; health/readiness/liveness checks; monitoring strategy for every architectural layer named in 10-backend-architecture.md and 14-infrastructure-devops-architecture.md (frontend, backend, database, cache, storage, background jobs, third-party dependencies); business metrics and product analytics; audit and security event logging; alerting architecture and severity; dashboards; incident investigation and root-cause analysis; SLOs and error budgets; operational review cadence; and observability governance.

**Out of scope:** the testing strategy that verifies correctness *before* production (owned by 13-testing-strategy.md — this document observes the system *in* production, a genuinely different concern from pre-production verification, though the two are complementary and cross-referenced throughout), the infrastructure being observed (owned by 14-infrastructure-devops-architecture.md), the release process this observability data feeds (owned by 16-cicd-release-management.md, whose Sections 20–21 this document's Sections 8 and 17 directly extend), and incident *response* process/escalation mechanics beyond what's needed to state how observability data triggers and informs it (12-security-architecture.md Section 26 owns the full incident-response process itself).

## 1.3 Audience

Every engineer, since every engineer's code eventually runs in production and every engineer is, at some point, the person diagnosing why it isn't behaving; DevOps/Platform Engineering, who own the observability infrastructure itself; QA, who use production observability data to inform test-coverage priorities (13-testing-strategy.md Section 31); Support, who need visibility into platform health to accurately answer buyer/creator questions; and Engineering Leadership, who use SLOs and operational review data (Sections 20–21) to make investment decisions.

## 1.4 Objectives

1. Make the platform's health **legible at a glance** — a single, well-designed dashboard should answer "is everything okay right now" without requiring an engineer to know where to look.
2. Make **diagnosis fast** — restated from 10-backend-architecture.md Section 2.18's correlation-ID philosophy: any reported problem should be traceable from a single ID to its complete causal chain across every system it touched.
3. Make **detection proactive, not reactive** — the goal is that the platform's own monitoring reports a problem before a buyer or creator does, and this document's alerting strategy (Section 17) is built specifically to close that race in the platform's favor.
4. Make **reliability measurable, not just felt** — SLOs and error budgets (Section 20) turn "the platform feels reliable" into a specific, tracked, objective number every engineering decision can be weighed against.
5. Make **observability itself a governed, evolving discipline** (Section 22) — new services, new failure modes, and new scale bring new things worth observing, and this document's structure is designed to absorb that growth without becoming an unmaintained pile of forgotten dashboards and stale alerts.

## 1.5 Definitions

| Term | Meaning in this document |
|---|---|
| Observability | The property of a system that lets an engineer answer a *novel* question about its internal state from its external outputs (logs, metrics, traces) without having to ship new code to answer it — distinct from *monitoring*, which answers *known*, pre-defined questions. |
| The Three Pillars | Logs, Metrics, and Traces (Section 3.3) — the three complementary data types this architecture is built from. |
| SLI (Service Level Indicator) | A specific, measured metric representing some aspect of the service's behavior (e.g., checkout p95 latency). |
| SLO (Service Level Objective) | A target value or range for an SLI the platform commits to internally (Section 20). |
| Error Budget | The allowed amount of SLO non-compliance over a period, spent deliberately as a risk-tolerance mechanism (Section 20.4). |
| MTTD / MTTR | Mean Time to Detect / Mean Time to Resolve — the platform's core incident-response speed metrics (Section 19.6). |

## 1.6 References

This document sits atop 10-backend-architecture.md Section 19's observability architecture (structured logging, tracing, Sentry, PostHog — restated and fully expanded here into complete production practice), 09-api-architecture.md's correlation-ID and rate-limit-header conventions (Sections 2.18–2.20, the wire-level contract this document's tracing builds on), 14-infrastructure-devops-architecture.md's monitoring and health-check infrastructure (Sections 16–17), and 16-cicd-release-management.md's release-time monitoring (Section 21, which this document's Section 17 generalizes to steady-state operation, not just around a deployment event).

## 1.7 Guiding Principles

1. **Observe behavior, not just presence.** A service returning `200 OK` on a health check while silently computing wrong answers is not "healthy" — this document's monitoring strategy (Sections 9–14) goes past uptime to behavioral correctness signals (business metrics, Section 15) wherever uptime alone would give false confidence.
2. **Every signal has an owner and a purpose.** A metric, log line, or dashboard panel that exists "because it seemed useful" without a stated purpose and a stated consumer is noise, not observability — restated as this document's answer to alert fatigue and dashboard sprawl (Section 22.4).
3. **Correlation is the connective tissue.** Every one of the three pillars (Section 3.3) is only as useful as its ability to be correlated with the others via a shared identifier (Section 6.4) — a log line, a metric spike, and a trace span must be joinable into one coherent incident narrative.
4. **Alert on symptoms users feel, page on causes engineers can fix.** Restated as this document's alerting philosophy (Section 17.2): a customer-facing symptom (elevated checkout failure rate) is what triggers urgency; the underlying cause (a specific dependency's latency) is what the resulting investigation uncovers, not what triggers the initial page.
5. **Observability data is a first-class engineering asset**, reviewed, pruned, and improved on a deliberate cadence (Section 21) — never allowed to silently rot into dashboards nobody trusts and alerts nobody responds to.

## 1.8 Non-Goals

This document does not: include OpenTelemetry SDK code, Sentry configuration syntax, or dashboard-as-code definitions; redefine the testing strategy (13) or infrastructure (14) it observes; or prescribe a specific additional observability vendor beyond the finalized stack (OpenTelemetry, Sentry, PostHog) named in this brief.

---

# 2. Observability Philosophy

## 2.1 Monitoring vs. Observability

**Monitoring** answers questions decided in advance — "is CPU usage above 80%," "did this specific endpoint return a 500." **Observability** is the deeper property that lets an engineer answer a question *nobody thought to ask in advance* — "why did this one specific buyer's checkout fail at 3:14 AM on a Tuesday" — by exploring the system's actual recorded behavior rather than needing a pre-built dashboard for that exact scenario. This platform builds both: monitoring (Sections 9–16) for the known, expected failure modes, and the underlying observability substrate (structured logs, rich metrics, distributed traces, Sections 4–6) that makes the unknown, unanticipated question answerable too.

## 2.2 Why This Matters for a Trust-Based Marketplace

Restated from 00-project-vision.md's core value proposition: Dreams by Kalakaaar's differentiation is trust, and 08-database-design.md Section 1.6 already frames the database as "the source of truth for trust." Observability is the operational counterpart to that same value — a platform that cannot quickly and accurately explain what happened to a specific buyer's order, a specific creator's payout, or a specific payment cannot make good on the trust promise those documents establish at the data-modeling layer, no matter how well the schema and API are designed.

## 2.3 Proactive Over Reactive

Restated from Section 1.4's objective 3 as this section's central philosophical commitment: the platform's own alerting (Section 17) is designed to fire before a buyer notices, not after a support ticket arrives — every monitoring strategy in Sections 9–16 states explicitly what "not okay" looks like *before* it becomes visibly broken to an end user, not merely what "completely down" looks like.

## 2.4 Debuggability Is Designed In, Not Bolted On

Restated from 10-backend-architecture.md Section 2.12: observability is an architectural decision made alongside every other one in this series, not a monitoring layer added after the system is built. Every new module, endpoint, or background job inherits this platform's logging, tracing, and metrics conventions by construction (Sections 4–6), because they are part of the shared middleware/infrastructure every piece of code runs through (10-backend-architecture.md Section 6), not something each engineer must remember to add individually.

## 2.5 Signal Over Noise

**Rule:** every log line, metric, and alert exists for a stated reason and has an identified consumer — restated as this document's guiding rejection of "collect everything, just in case," which in practice produces dashboards nobody reads and alert channels everyone has muted. Section 22's governance process exists specifically to keep this discipline from eroding as the platform grows.

## 2.6 Blameless, Data-Driven Culture

Observability data is used to understand *what happened and why*, never to assign individual blame — restated from 13-testing-strategy.md Section 27.6's blameless post-incident review philosophy, extended here to every use of this document's data: a spike in a specific engineer's deployment correlating with an error-rate increase is a signal about the *change*, investigated with the same rigor and the same lack of judgment as any other data point, informing the system's improvement, not a performance conversation.

---

# 3. Observability Architecture

## 3.1 Purpose

To state the complete, end-to-end shape of this platform's observability system — where data originates, how it flows, where it's stored, and how an engineer actually reaches it during investigation.

## 3.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Every Request / Job Execution                    │
│         (Route Handler, Server Action, Inngest function)             │
└───────────────────────────────┬───────────────────────────────────┘
                                  │  emits, in parallel, at every layer
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌───────────────┐       ┌───────────────────┐      ┌──────────────────┐
│  Structured     │       │   OpenTelemetry    │      │   Sentry (errors  │
│  Logs           │       │   Traces + Metrics  │      │   & exceptions)   │
│  (Section 4)    │       │   (Sections 5–6)    │      │   (Section 7)     │
└───────┬────────┘       └──────────┬─────────┘      └─────────┬────────┘
        │                            │                           │
        ▼                            ▼                           ▼
┌────────────────────────────────────────────────────────────────────┐
│              Correlation ID (09-api-architecture.md §2.18)           │
│         ties every log line, span, and error report together        │
└───────────────────────────────┬────────────────────────────────────┘
                                  │
                ┌──────────────────┼──────────────────┐
                ▼                  ▼                  ▼
        ┌───────────────┐ ┌───────────────┐ ┌───────────────────┐
        │  Dashboards    │ │   Alerting     │ │  PostHog (product  │
        │  (Section 18)  │ │   (Section 17) │ │   analytics,       │
        │                │ │                │ │   Section 16)      │
        └───────────────┘ └───────────────┘ └───────────────────┘
```

## 3.3 The Three Pillars, and How This Platform Uses Each

| Pillar | What It Answers | Where It's Strongest | Where It's Weakest |
|---|---|---|---|
| **Logs** (Section 4) | "What exactly happened, in this specific request/job, in detail?" | Rich, specific, human-readable detail for one event | Expensive to query/aggregate across millions of events; poor for "how often does X happen" |
| **Metrics** (Section 5) | "How is the system behaving in aggregate, over time?" | Cheap to store and query at scale; ideal for dashboards and alerting thresholds | No detail about any single event — cannot answer "why did *this specific* request fail" |
| **Traces** (Section 6) | "How did this one request/job flow through every system it touched, and where did time go?" | Connects cause and effect across module/service boundaries | Only as complete as its instrumentation coverage; a gap in a specific integration's tracing is a blind spot |

**Rule:** no single pillar is used to answer a question the others are better suited for — an engineer diagnosing a specific failed checkout starts from its correlation ID (Section 6.4), pulls its trace to see *where* time was spent or where the failure occurred, and pulls the specific log lines at that point in the trace for full detail — metrics are what alerted them to look in the first place (Section 17), not what they use for the detailed diagnosis itself.

## 3.4 Data Flow: From Event to Insight

```
Event occurs (a request, a job execution, an error)
   │
   ▼
Instrumented at the source (Sections 4–7) — log line + trace span + metric
increment, all tagged with the same correlation ID
   │
   ▼
Exported to the respective backend (Sentry for errors; an OpenTelemetry-
compatible metrics/tracing backend; the structured logging sink)
   │
   ▼
Aggregated into dashboards (Section 18) and evaluated against alert
thresholds (Section 17) continuously
   │
   ▼
On threshold breach: alert fires ──► on-call engineer notified
   │                                  (16-cicd-release-management.md §27.3)
   ▼
Investigation (Section 19) — correlation ID traces the full causal chain
   │
   ▼
Resolution ──► post-incident review (13-testing-strategy.md §27.6) ──►
observability gaps found during investigation are closed (Section 22.5)
```

## 3.5 Monitoring Strategy (Architecture-Level)

The architecture itself is monitored for its own health, not merely assumed reliable: instrumentation overhead (does adding tracing/logging measurably slow down the request path — 13-testing-strategy.md Section 13.4's latency budgets apply here too), data pipeline lag (how long between an event occurring and it being queryable in a dashboard), and data completeness (are traces/logs arriving from every expected source, or is a specific module silently failing to emit).

## 3.6 Alert Strategy (Architecture-Level)

A meta-alert exists for the observability system itself — if the logging/tracing/metrics pipeline stops receiving data from a significant portion of the platform (a "silence" alert, distinct from every other alert in this document which fires on a *signal*, this one fires on the *absence* of expected signal), since an observability outage is uniquely dangerous: it can mask a simultaneous, unrelated production incident by leaving the team blind exactly when they need visibility most.

## 3.7 Responsibilities

DevOps/Platform Engineering owns the observability architecture's infrastructure and its own health monitoring (Section 3.6); every engineer is responsible for correctly instrumenting their own code per the conventions in Sections 4–6, restated from 10-backend-architecture.md Section 2.12's "observability is architecture, not an afterthought" principle.

## 3.8 Common Failures

| Failure | Cause | Response |
|---|---|---|
| A "silent" pipeline gap — a specific module stops emitting logs/traces with no explicit error | A misconfigured exporter, a silently-swallowed initialization error | Caught by Section 3.6's meta-alert; investigated as a Critical-priority gap, since it directly blinds the team to whatever else might be going wrong in that module |
| Instrumentation overhead measurably degrades request latency | Overly verbose tracing (too many spans, too much per-span data) | Instrumentation is reviewed and pruned to the level of detail that's actually useful (Section 22.4), balancing diagnostic value against overhead |

## 3.9 Best Practices

- Instrument at the architectural seams this series has already defined (module boundaries, 10-backend-architecture.md Section 3.6; API endpoints, 09-api-architecture.md) rather than arbitrarily — these seams are exactly where a trace's spans should naturally divide, since they're already the system's own meaningful units of work.
- Treat the observability pipeline's own health as seriously as any production service's health (Section 3.6) — it is production infrastructure, not a side concern.

## 3.10 Review Checklist

- [ ] Does every new module/endpoint/job correctly emit correlated logs, traces, and metrics from day one (Section 3.7)?
- [ ] Is the observability pipeline's own health monitored via a "silence" alert (Section 3.6)?
- [ ] Is instrumentation overhead within an acceptable, measured bound (Section 3.8)?


---

# 4. Logging Strategy

## 4.1 Purpose

To fully restate and operationalize 10-backend-architecture.md Section 19.1's structured-logging architecture as this document's production-logging authority — what gets logged, at what level, in what shape, and how it's actually used once the platform is live.

## 4.2 Architecture

```
Every log call (shared/observability/logger.ts, 10-backend-architecture.md §19.1)
   │
   ▼
Structured JSON emitted with mandatory fields: correlationId, timestamp (UTC
ISO 8601), module, severity, actorId (if authenticated), message, context
   │
   ▼
Automatic redaction of sensitive-field patterns (15-engineering-standards.md §18.4)
   │
   ▼
Shipped to the centralized logging sink (aggregated, indexed, queryable by
every field above)
   │
   ▼
Queryable via correlation ID, module, severity, actor, or free-text search
across `message`/`context`
```

## 4.3 Logging Hierarchy

| Level | Volume (Relative) | Retention | Primary Use |
|---|---|---|---|
| `debug` | Highest | Shortest (days) | Local/active debugging only; rarely reviewed in production without an active investigation already underway |
| `info` | High | Medium (weeks) | Durable trace of expected business events (10-backend-architecture.md §19.1's "Order placed" example) |
| `warn` | Low | Medium–long | Recovered-from anomalies worth noticing in aggregate, even if not urgent individually |
| `error` | Lowest (should be) | Longest among log levels, cross-referenced with Sentry (Section 7) | Genuine failures — reviewed both individually (via alerting, Section 17) and in aggregate (trend review, Section 21) |

## 4.4 Monitoring Strategy

Log volume and level distribution are themselves monitored as metrics (Section 5) — a sudden spike in `error`-level log volume, or a sudden drop in `info`-level volume for a specific module (potentially indicating that module has silently stopped processing requests, distinct from erroring outright), are both alert-worthy signals (Section 17.3) in their own right, independent of any specific log line's content.

## 4.5 Alert Strategy

| Signal | Threshold Concept | Severity |
|---|---|---|
| Sustained spike in `error`-level logs for a specific module | Rate significantly above that module's established baseline | High — investigate promptly, correlate against recent deployments (16-cicd-release-management.md §21.3) |
| Complete absence of expected `info`-level logs from a module that should be actively processing | Zero events over a window where a non-zero baseline is expected | Critical — likely indicates the module has silently stopped functioning, not merely slowed |
| A specific, known-critical log event (e.g., a `SecurityEvent`-tagged log, 08-database-design.md §23.5) | Any single occurrence | Immediate, routed per Section 17.6's severity-specific routing |

## 4.6 Responsibilities

Every engineer follows 15-engineering-standards.md Section 18's logging conventions when writing code; DevOps/Platform Engineering owns the logging pipeline's infrastructure, retention configuration, and query performance; QA/SDET and Support both consume logs during investigation (Section 19) without needing engineering assistance for a standard correlation-ID-based lookup.

## 4.7 Common Failures

| Failure | Cause | Response |
|---|---|---|
| A log line is present but missing its correlation ID | A code path bypassing the shared logger wrapper, or a background job not correctly propagating the ID from its triggering event | Treated as a defect — every log line is traced back to its emitting code and fixed to include the ID, since an uncorrelated log line is nearly as unhelpful as no log line at all during an actual investigation |
| Excessive `debug`-level logging left enabled in production, degrading query performance and cost | An engineer forgetting to adjust log verbosity before shipping | Caught by log-volume monitoring (Section 4.4) and log-level configuration review (Section 22.4) |
| A sensitive field slips past automatic redaction | A newly-introduced field not yet covered by the redaction pattern list | Treated with the same severity as any other data leak (12-security-architecture.md §17); the redaction pattern list is immediately updated, and the specific historical log entries are purged if retained |

## 4.8 Best Practices

- Log at the point where context is richest — a Service Layer function logging a business-rule rejection has far more useful context (which rule, which entity, why) than a generic catch-all logged only at the pipeline's terminal error handler.
- Periodically review actual log-query patterns (what engineers actually search for during investigations) to inform which fields deserve first-class indexing versus which can remain in the less-structured `context` blob.

## 4.9 Review Checklist

- [ ] Does every log line carry a correlation ID, module, and appropriate severity (Section 4.2)?
- [ ] Is log volume/level distribution monitored as its own signal (Section 4.4)?
- [ ] Has a redaction gap been checked for any newly-added sensitive field?

---

# 5. Metrics Strategy

## 5.1 Purpose

To state what this platform measures continuously, in aggregate, and how those measurements are organized so that a dashboard or alert can be built on a stable, well-understood foundation rather than an ad hoc pile of unrelated numbers.

## 5.2 Architecture

Restated from 10-backend-architecture.md Section 19.3: metrics are emitted via the OpenTelemetry Metrics API from every layer of the application (Route Handlers, Service Layer functions, Inngest jobs, the frontend's Core Web Vitals collection) and aggregated into a queryable time-series backend, queried by dashboards (Section 18) and evaluated continuously against alert thresholds (Section 17).

## 5.3 Metrics Hierarchy

```
Platform-Level Metrics (Section 15 — business metrics: GMV, active buyers/creators)
        │
        ▼
Application-Level Metrics (request rate, error rate, latency percentiles —
        │                   per app: buyer, creator, internal)
        ▼
Endpoint/Module-Level Metrics (per-endpoint p95/p99 latency, per-module
        │                       error rate — 09-api-architecture.md's
        │                       resource groups as the natural grouping)
        ▼
Resource-Level Metrics (database connection pool utilization, Redis hit
                         rate, Inngest job queue depth — Sections 11–13)
```

**Rule:** every metric is tagged with enough dimensional context (app, module, endpoint, environment) to be sliced at every level of this hierarchy from one underlying data source — a dashboard showing platform-wide error rate and a dashboard showing one specific endpoint's error rate query the same metric, filtered differently, never two independently-maintained metric definitions that could silently drift apart.

## 5.4 The Four Golden Signals

This platform's core metrics are organized around the widely-recognized four golden signals, applied per endpoint/service:

| Signal | What It Measures | Primary Metric |
|---|---|---|
| Latency | How long a request takes | p50/p95/p99 response time (09-api-architecture.md §1.7, 13-testing-strategy.md §13.4's targets) |
| Traffic | How much demand the system is under | Requests per second, per endpoint/app |
| Errors | The rate of failed requests | Error rate by status code class (4xx vs. 5xx, distinguished per 09-api-architecture.md §2.3's semantics — a 4xx is often expected client behavior, not a system fault, and is tracked separately from 5xx) |
| Saturation | How "full" a resource is | Database connection pool utilization, Redis memory usage, Inngest queue depth |

## 5.5 Monitoring Strategy

Every Section 5.4 signal is monitored continuously per app and per endpoint/module, with established baselines (informed by historical data, not arbitrary guesses) driving both dashboard visualization (Section 18) and alert thresholds (Section 17) — a metric without an established, data-informed baseline is not yet ready to alert on, since an arbitrary threshold produces either constant false alarms or missed real problems.

## 5.6 Alert Strategy

| Signal | Alert Condition | Severity |
|---|---|---|
| Latency | p95/p99 sustained above 13-testing-strategy.md §13.4's target for a defined window | High, escalating to Critical if the breach is severe or sustained |
| Traffic | A sudden, unexplained drop (potential upstream issue preventing requests from arriving at all) or an unprecedented spike (potential abuse or a viral event requiring capacity attention) | Medium–High depending on magnitude |
| Errors | 5xx rate above baseline threshold | High–Critical depending on rate and endpoint criticality (13-testing-strategy.md §25.2's risk tiers inform criticality here directly) |
| Saturation | A resource approaching a hard limit (e.g., database connection pool near exhaustion, 10-backend-architecture.md §10.8's pooling architecture) | Critical — this is a leading indicator of imminent, cascading failure, not just a current problem |

## 5.7 Responsibilities

DevOps/Platform Engineering owns the metrics pipeline's infrastructure and the establishment/maintenance of baselines; every engineer's Service Layer/Repository code (10-backend-architecture.md Sections 9–10) emits metrics through the shared instrumentation layer automatically, requiring no manual per-function metric-emission code for the standard golden signals (Section 5.4), which are captured generically by the shared middleware pipeline (that document's Section 6).

## 5.8 Common Failures

| Failure | Cause | Response |
|---|---|---|
| A metric's baseline becomes stale as real traffic patterns evolve (e.g., seasonal gifting-occasion traffic, 00-project-vision.md's gifting focus) | Baselines set once and never revisited | Baselines are reviewed and recalibrated on a recurring cadence (Section 21.3), not treated as permanently fixed at their initial values |
| A high-cardinality metric dimension (e.g., tagging by individual user ID) overwhelms the metrics backend's storage/query performance | Over-eager dimensional tagging | Dimensional tagging is reviewed for cardinality appropriateness — individual-entity-level detail belongs in traces/logs (Section 3.3's pillar-selection guidance), not as a metric dimension |

## 5.9 Best Practices

- Tag every metric with the same core dimension set (app, module, environment) consistently, so cross-cutting dashboards and alerts can be built without per-metric special-casing.
- Revisit alert thresholds whenever a baseline shift is observed (Section 5.8), rather than tolerating a threshold that's become miscalibrated to current normal behavior.

## 5.10 Review Checklist

- [ ] Are all four golden signals (Section 5.4) tracked for every app and every business-critical endpoint/module?
- [ ] Are alert thresholds based on established, current baselines, not arbitrary or stale values (Section 5.8)?
- [ ] Is any metric's dimensional cardinality risking backend performance/cost (Section 5.8)?


---

# 6. Distributed Tracing

## 6.1 Purpose

To fully restate and operationalize 10-backend-architecture.md Section 19.2/19.4's tracing architecture — how one request or job execution's complete journey, across every layer and every system it touches, becomes a single, visualizable, diagnosable artifact.

## 6.2 Architecture

```
Request enters (Route Handler) ──► Root span created, tagged with
correlation ID (09-api-architecture.md §2.18)
   │
   ▼
[Auth Middleware span] ──► [RBAC Guard span] ──► [Validation span]
   │
   ▼
[Service Layer span] ── may create child spans for:
   │        ├── [Repository Layer query span] ──► Postgres
   │        ├── [Redis cache span] ──► Upstash Redis (Section 12)
   │        ├── [External integration span] ──► Razorpay/Resend/R2 (Section 14)
   │        └── [Inngest event emission span] ──► triggers an async job,
   │             which continues the SAME trace (Section 6.5) in its own
   │             execution, not a disconnected new one
   ▼
Response returned ──► Root span closed, full trace assembled and queryable
```

## 6.3 Trace Flow Diagram — A Concrete Example (Checkout Completion)

```
Trace: "checkout.complete" (correlationId: b3f1c2e4-...)
│
├─ Span: RouteHandler [POST /v1/checkout/sessions/{id}/complete]     12ms
│  ├─ Span: Authenticate                                              3ms
│  ├─ Span: RBAC Guard                                                1ms
│  └─ Span: ServiceLayer [Checkout.completeSession]                 340ms
│      ├─ Span: Repository [Checkout.findSession]                    8ms
│      ├─ Span: Integration [Razorpay.verifyPayment]                180ms  ◄── largest span;
│      │                                                                     the trace makes this
│      │                                                                     immediately visible
│      ├─ Span: Repository [Orders.createOrderTransaction]           95ms
│      │   ├─ Span: DB [INSERT order]                                20ms
│      │   ├─ Span: DB [INSERT sub_orders]                           18ms
│      │   ├─ Span: DB [INSERT order_items]                          22ms
│      │   └─ Span: DB [UPDATE inventory_transaction]                35ms
│      └─ Span: Event Emission [order.placed]                         2ms
│          └─ (continues asynchronously in a separate Inngest execution,
│               same correlationId, visible as a linked trace — Section 6.5)
```

This single view — restated as the entire point of tracing — immediately shows a reviewer that Razorpay's verification call, not the database writes, dominated this request's latency, without needing to separately correlate log timestamps or guess from metrics alone.

## 6.4 Correlation IDs

Restated as the absolute connective tissue across this entire document, from 09-api-architecture.md Section 2.18 and 10-backend-architecture.md Section 19.5: every request is assigned a correlation ID at its first touchpoint (client-supplied or server-generated), and that ID is propagated — unchanged — through every span, every log line, every Sentry error report, and every downstream Inngest job execution that request triggers. This is the single identifier a support agent, an on-call engineer, or an automated investigation tool uses to reconstruct a complete, cross-system narrative from one starting point.

## 6.5 Tracing Across Asynchronous Boundaries

**Rule:** when a Service Layer function emits an event that triggers an Inngest job (10-backend-architecture.md Section 12.9), the correlation ID is passed as part of that event's payload, and the resulting job execution's trace is linked to (not merely tagged similarly to, but formally linked as a child/continuation of) the originating request's trace — this is what prevents the platform's extensive use of asynchronous background processing (that document's Section 12) from becoming an observability blind spot where "what happened after the request returned" is invisible or only reconstructable by manual timestamp correlation.

## 6.6 Monitoring Strategy

Trace completeness (are spans arriving from every expected layer, with no unexpected gaps) and trace latency-attribution accuracy (does the sum of child-span durations reasonably account for the root span's total duration, or is there unaccounted-for "dark" time suggesting an uninstrumented code path) are both monitored as their own health signals for the tracing system itself, per Section 3.6's meta-observability principle.

## 6.7 Alert Strategy

Tracing itself is not typically a direct alert source (that's Section 5's metrics' job) — its primary value is diagnostic, consumed during an investigation already triggered by a metrics- or error-based alert (Section 17). The one exception: a sustained, unexplained rise in "dark" (unattributed) time within traces for a specific endpoint is itself worth a lower-urgency alert, since it signals a growing observability blind spot that should be closed before it hides a real problem.

## 6.8 Responsibilities

DevOps/Platform Engineering owns the tracing infrastructure and instrumentation conventions; every engineer ensures their own new Service Layer functions, Repository functions, and integration calls (10-backend-architecture.md Sections 9–10, 17) produce correctly-scoped spans, following the shared instrumentation pattern rather than inventing a bespoke one per module.

## 6.9 Common Failures

| Failure | Cause | Response |
|---|---|---|
| A trace shows a large gap of "dark" time between two spans | An uninstrumented code path (a new integration client, Section 14, added without following the shared instrumentation pattern) | The specific gap is instrumented; this is treated as a completeness defect, tracked and fixed like any other bug |
| A background job's trace appears disconnected from its triggering request's trace | The correlation ID/trace-linking metadata wasn't correctly propagated in the event payload (Section 6.5) | Fixed at the event-emission code, restoring the link for that event type going forward |

## 6.10 Best Practices

- Create a new span at every genuine architectural seam (a Repository call, an external integration call, an Inngest job boundary) — restated from Section 3.9 — never at an arbitrarily fine grain that would produce excessive span volume without added diagnostic value.
- Periodically sample and review real traces from production (not just when investigating an active incident) to catch instrumentation gaps proactively, per Section 6.9's first failure mode.

## 6.11 Review Checklist

- [ ] Does every new architectural seam (module boundary, integration call, job trigger) produce a correctly-linked span (Section 6.10)?
- [ ] Is the correlation ID correctly propagated across every asynchronous boundary this change introduces (Section 6.5)?
- [ ] Has trace completeness been spot-checked for this area of the codebase recently (Section 6.9)?

---

# 7. Error Tracking

## 7.1 Purpose

To fully restate and operationalize 10-backend-architecture.md Section 19.6's Sentry integration as this document's production error-tracking authority — what gets captured, how it's triaged, and how it feeds both immediate response and longer-term quality trends.

## 7.2 Architecture

```
Unexpected exception occurs (10-backend-architecture.md §18.3's terminal
error-handling boundary, or an uncaught frontend rendering error)
   │
   ▼
Captured by Sentry with: full stack trace, correlation ID (tagged,
searchable), request/user context (non-sensitive fields only, §7.6),
release version (16-cicd-release-management.md §23.2's commit SHA)
   │
   ▼
Grouped/deduplicated by Sentry's fingerprinting (same underlying error
across many occurrences forms one issue, not thousands of separate alerts)
   │
   ▼
Triaged (Section 7.5) ──► assigned, tracked to resolution, or explicitly
deprioritized with a stated reason
```

## 7.3 What Is — and Is Not — Captured

**Rule:** restated precisely from 10-backend-architecture.md Section 19.6: only genuinely unexpected exceptions (the taxonomy's implicit "not a known, typed domain error" category, that document's Section 18.2) are sent to Sentry as errors. Every known, expected domain error (`ValidationError`, `NotFoundError`, a business-rule rejection) is captured in structured logs (Section 4) at an appropriately low severity, never sent to Sentry — this distinction is what keeps Sentry's error stream a high-signal indicator of genuine platform faults rather than being drowned in routine, expected `4xx`-class outcomes.

## 7.4 Frontend Exception Reporting

Sentry's browser SDK captures unhandled frontend exceptions (a React rendering error not caught by a route's `error.tsx` boundary, 15-engineering-standards.md Section 11.4; an unhandled promise rejection) with the same correlation-ID tagging discipline as backend errors, plus frontend-specific context (browser/device, the specific app — buyer/creator/internal — and route) — giving a unified error stream across the full stack rather than a frontend-only and backend-only tool operating in isolation.

## 7.5 Triage Process

Every new Sentry issue is triaged per 13-testing-strategy.md Section 27.2's severity matrix (restated here as this document's own binding classification): assessed for blast radius and consequence, assigned an owner, and either actioned promptly (Critical/High) or explicitly deprioritized with a stated reason (Medium/Low) — an untriaged issue sitting in Sentry's default "unresolved" state indefinitely is treated as a process gap (Section 21.4), not an acceptable steady state.

## 7.6 Sensitive Data in Error Reports

**Rule:** restated from 15-engineering-standards.md Section 18.4 and 12-security-architecture.md's PII-handling posture: Sentry's context capture is configured to scrub known-sensitive fields automatically (mirroring the structured logger's own redaction, Section 4.2), and no engineer manually attaches a sensitive value (a raw payment detail, a password) to a Sentry context/breadcrumb, ever — this is treated with the same severity as any other data-handling violation.

## 7.7 Monitoring Strategy

Error *rate* (as a metric, Section 5.4's Errors golden signal) and error *diversity* (the number of *distinct* issues, as opposed to volume of one recurring issue) are both tracked — a rising error rate driven by one already-known, already-being-fixed issue is a different situation than a rising rate driven by many new, previously-unseen issues appearing simultaneously (the latter being a stronger signal of a broad, systemic problem, e.g., following a bad deployment).

## 7.8 Alert Strategy

| Signal | Alert Condition | Severity |
|---|---|---|
| A brand-new issue type appears | First occurrence of a previously-unseen error fingerprint | Medium by default, escalated to High/Critical automatically if it recurs at a significant rate within a short window |
| A known issue's occurrence rate spikes sharply | Rate significantly exceeds its established baseline | Escalated to the issue's existing severity classification, re-triaged if the spike suggests worsening impact |
| Any error tagged with a Critical-tier module (13-testing-strategy.md §25.2 — Payments, Orders, Auth) | Any occurrence | Immediate, regardless of volume — a single Payments-module error warrants prompt attention even before a "rate" becomes statistically meaningful |

## 7.9 Responsibilities

The engineer who introduced a regression (identified via correlation with a specific deployment, 16-cicd-release-management.md §21.3) owns its fix by default; QA/SDET periodically reviews aggregate error trends (13-testing-strategy.md §31.2's defect-escape-rate metric draws directly from this data); DevOps/Platform Engineering owns the Sentry integration's own health and configuration.

## 7.10 Common Failures

| Failure | Cause | Response |
|---|---|---|
| Sentry's issue grouping incorrectly merges two genuinely distinct errors into one, or splits one error into many near-duplicate issues | Sentry's default fingerprinting doesn't fit this specific error's shape | Custom fingerprinting rules are configured for that specific error pattern, restoring accurate grouping |
| A large backlog of untriaged issues accumulates | Triage (Section 7.5) falling behind, often after a busy release period | Escalated as its own process concern (Section 21.4) — a large untriaged backlog is treated as a leading indicator of quality-process erosion, not merely an inbox-management inconvenience |

## 7.11 Best Practices

- Configure custom Sentry fingerprinting for error patterns whose default grouping doesn't match how the team actually thinks about them (Section 7.10), keeping the issue list a genuinely useful, deduplicated signal.
- Close the loop from every Critical/High Sentry issue back to a regression test (13-testing-strategy.md Section 27.4), exactly as any other bug fix requires.

## 7.12 Review Checklist

- [ ] Is only genuinely unexpected-exception-class error reaching Sentry, with expected domain errors correctly routed to structured logs instead (Section 7.3)?
- [ ] Is the untriaged-issue backlog within an acceptable, actively-managed size (Section 7.5)?
- [ ] Does every Sentry context/breadcrumb avoid any sensitive field (Section 7.6)?


---

# 8. Health Checks

## 8.1 Purpose

To fully restate and extend 10-backend-architecture.md Section 19.7's health-endpoint architecture and 16-cicd-release-management.md Section 20.2's post-deployment smoke-test usage of it into this document's complete, standing health-check strategy.

## 8.2 Architecture — Liveness vs. Readiness vs. Deep Health

| Check Type | Question Answered | What It Verifies | Used By |
|---|---|---|---|
| Liveness (`GET /v1/health`) | "Is the application process running at all?" | The process responds to a request — nothing more | Vercel's own platform-level health monitoring; the fastest, cheapest check |
| Readiness (`GET /v1/health/ready`) | "Is this instance ready to correctly serve real traffic?" | Database connectivity (via the pooler, 10-backend-architecture.md §10.8), Redis connectivity | Post-deployment smoke tests (16-cicd-release-management.md §24.2); load-balancer-equivalent routing decisions |
| Deep Health (an extended, less-frequently-polled check) | "Are this platform's critical downstream dependencies actually healthy?" | Razorpay API reachability, Resend API reachability, R2 reachability — each checked without performing a real transaction | Dashboards (Section 18.4) and dependency-specific alerting (Section 14) |

## 8.3 Health Check Diagram

```
GET /v1/health           ──► 200 OK (process alive)             ~5ms
GET /v1/health/ready     ──► checks: Postgres pool, Redis         ~50ms
                              ──► 200 OK  or  503 (not ready)
GET /v1/health/deep      ──► checks: Razorpay, Resend, R2 reachability
                              (lightweight, non-transactional pings)
                              ──► 200 OK  or  degraded-status detail
                                  per dependency
```

## 8.4 Monitoring Strategy

Readiness and deep-health checks are polled continuously (not only around a deployment event) at a defined interval, with their historical result feeding an uptime/availability metric per dependency (Section 14.4) — a single failed poll is noise; a sustained pattern of failures is a genuine signal.

## 8.5 Alert Strategy

| Signal | Alert Condition | Severity |
|---|---|---|
| Liveness check fails | Any failure | Critical — the application itself may be down |
| Readiness check fails | Sustained failure across multiple consecutive polls (ruling out a single transient blip) | Critical — the application is up but cannot correctly serve real requests |
| Deep-health check shows one dependency degraded | Sustained failure for that specific dependency | High, routed per Section 14's per-dependency alert routing — this is a leading indicator, giving warning before the dependency's degradation necessarily shows up as user-facing errors yet |

## 8.6 Responsibilities

DevOps/Platform Engineering owns the health-check endpoints' implementation and polling infrastructure; the on-call engineer (16-cicd-release-management.md Section 27.3) is the first responder to any health-check-triggered alert.

## 8.7 Common Failures

| Failure | Cause | Response |
|---|---|---|
| Readiness check passes, but the application is still behaviorally broken (e.g., a business-logic bug, not a connectivity issue) | Readiness checks verify *connectivity*, not *correctness* — this is a known, accepted limitation | This is precisely why Section 8.2's health checks are one layer of a broader strategy, not the whole of it — Section 15's business metrics exist specifically to catch this class of "up but wrong" failure that health checks cannot |
| A deep-health check's own polling adds meaningful load/cost against a third-party API | Overly frequent polling, or a check that isn't truly lightweight | Polling frequency and check design are reviewed and tuned to the minimum frequency that still provides timely detection (Section 8.4) |

## 8.8 Best Practices

- Keep liveness checks trivially fast and dependency-free — a liveness check that itself depends on the database defeats its own purpose (if the database is down, you want to know the app is "alive but not ready," Section 8.2's distinction, not conflate the two into a single ambiguous signal).
- Treat a health-check failure as a starting point for investigation (Section 19), never as a self-explanatory diagnosis on its own.

## 8.9 Review Checklist

- [ ] Are liveness, readiness, and deep-health checks each correctly scoped to their own distinct question (Section 8.2)?
- [ ] Is health-check history feeding an availability metric per dependency (Section 8.4)?
- [ ] Is deep-health polling frequency appropriately tuned, not excessive (Section 8.7)?

---

# 9. Frontend Monitoring

## 9.1 Purpose

To state how this platform observes the three Next.js applications (`apps/buyer`, `apps/creator`, `apps/internal`) as experienced by real users in real browsers — a genuinely different vantage point from backend monitoring (Section 10), since frontend behavior depends on the user's own device, network, and browser in ways a server-side view alone cannot see.

## 9.2 Architecture

```
Real User's Browser
   │
   ├─► Core Web Vitals collected in the field (RUM — Real User Monitoring)
   │     via PostHog's web analytics capture, correlated with the specific
   │     app/route/release version
   │
   ├─► Unhandled exceptions captured by Sentry's browser SDK (Section 7.4)
   │
   └─► User-initiated network requests carry the correlation ID (09-api-
        architecture.md §2.18), linking frontend-observed behavior to the
        exact backend trace that served it (Section 6.4)
```

## 9.3 Monitoring Strategy

Restated from 13-testing-strategy.md Section 13.3's Core Web Vitals targets (LCP, INP, CLS), now tracked as **field data** (real users, real devices, real network conditions) rather than only the lab-based Lighthouse CI measurement that document's Section 24.1 runs in CI — the two are complementary: lab data (CI) catches a regression before it ships; field data (this section) confirms real-world experience matches that lab expectation and catches conditions (a specific device/network combination) lab testing didn't anticipate.

## 9.4 Frontend-Specific Signals

| Signal | What It Captures |
|---|---|
| Core Web Vitals (LCP, INP, CLS) | Perceived loading/interactivity/stability quality, segmented by app, route, and device class |
| JavaScript error rate | Unhandled exceptions per page-view, segmented identically |
| Route-level render failures | `error.tsx` boundary triggers (15-engineering-standards.md §11.4), indicating a specific route/component combination failing for real users |
| API request failure rate (client-observed) | Failed `fetch`/TanStack Query calls as experienced client-side — may diverge from server-side error-rate metrics (Section 10) due to network conditions between client and server |

## 9.5 Alert Strategy

| Signal | Alert Condition | Severity |
|---|---|---|
| Core Web Vitals field data regresses materially against its established baseline for a specific route | Sustained regression across a meaningful sample size | High — correlated against recent deployments (16-cicd-release-management.md §21.3) as the first investigative step |
| JavaScript error rate spikes for a specific app/route | Rate significantly above baseline | High–Critical depending on the affected route's business criticality (a Checkout-flow spike is more urgent than a rarely-visited CMS page) |
| Client-observed API failure rate diverges significantly from server-observed error rate for the same endpoint | A network/CDN-layer issue between client and server, not a backend application fault | Routed to DevOps/Platform Engineering as a network/CDN investigation, distinct from a backend-code investigation |

## 9.6 Responsibilities

Frontend engineers own their own app's Core Web Vitals and error-rate health, reviewing field data (not just lab data) as part of standard post-release monitoring (16-cicd-release-management.md Section 20.5's observation window); DevOps/Platform Engineering owns the RUM data pipeline and CDN-layer monitoring.

## 9.7 Common Failures

| Failure | Cause | Response |
|---|---|---|
| Field Core Web Vitals are meaningfully worse than lab (CI) measurements suggested | Lab testing doesn't capture real-world device/network diversity, particularly lower-end devices (13-testing-strategy.md §28.4's stated real-device-matrix rationale) | Investigated with real-device testing (that document's Section 11.5); if a systemic gap between lab and field is found, lab testing conditions are recalibrated to better represent real usage |
| A client-side error is reported without a correlation ID | The error occurred before any network request was made (e.g., a rendering error on initial page load with no prior API call) | A client-generated correlation ID is assigned at page load itself, not only upon the first network request, closing this gap |

## 9.8 Best Practices

- Segment field Core Web Vitals by device class and connection type, not just by an aggregate platform-wide average, which can mask a poor experience for a meaningful subset of users (particularly relevant given 00-project-vision.md's broad-accessibility ambition across device tiers, restated from 13-testing-strategy.md Section 28.4).
- Correlate frontend and backend observability data via the shared correlation ID whenever investigating a user-reported issue, rather than treating frontend and backend monitoring as separate, unconnected investigations.

## 9.9 Review Checklist

- [ ] Are Core Web Vitals tracked as field (RUM) data, not lab data alone (Section 9.3)?
- [ ] Is field data segmented by device/connection class, not just an aggregate average (Section 9.8)?
- [ ] Does every frontend error report carry a correlation ID, even for pre-network-request failures (Section 9.7)?


---

# 10. Backend Monitoring

## 10.1 Purpose

To state how this platform observes its Next.js Route Handlers, Server Actions, and Service Layer logic (10-backend-architecture.md Sections 3, 5) as they actually execute in production.

## 10.2 Architecture

Every backend request flows through the shared middleware pipeline (10-backend-architecture.md Section 6), which is precisely where this platform's backend monitoring instrumentation lives centrally — request/response metrics (Section 5.4's golden signals), the root trace span (Section 6.2), and structured logging (Section 4) are all captured at this one shared layer, meaning every endpoint is monitored identically and automatically the moment it's built through the standard pipeline, with no per-endpoint instrumentation code required.

## 10.3 Monitoring Strategy

| Layer | What's Monitored |
|---|---|
| Per-endpoint (09-api-architecture.md's resource groups) | Request rate, latency percentiles, error rate — against that document's Section 1.7/13-testing-strategy.md Section 13.4's stated targets, per endpoint |
| Per-module (10-backend-architecture.md Section 5's ~26 modules) | Service Layer function execution time and error rate, aggregated up from individual endpoint data by module ownership |
| Authorization layer | RBAC/ownership check failure rate (a rising rate can indicate either an attempted-abuse pattern or a legitimate UX/permissions-configuration bug, distinguished during investigation, Section 19) |
| Idempotency layer | Idempotency-key replay rate and mismatch (`409`) rate (09-api-architecture.md §2.6) — a sudden rise in mismatches can indicate a client-side bug reusing keys incorrectly |

## 10.4 Alert Strategy

Restated and specialized from Section 5.6's general golden-signal alert strategy: per-endpoint latency/error alerts are weighted by that endpoint's risk tier (13-testing-strategy.md Section 25.2) — a Checkout or Payments endpoint's error-rate alert threshold is tighter and its severity classification higher than an equivalent error rate on a low-traffic CMS-management endpoint, directly mirroring that document's risk-proportional philosophy applied here to alerting specifically.

## 10.5 Responsibilities

Backend engineers own their own module's monitored health as part of standard post-release observation (16-cicd-release-management.md Section 20.5); DevOps/Platform Engineering owns the shared middleware instrumentation itself and the alerting-threshold calibration process (Section 21.3).

## 10.6 Common Failures

| Failure | Cause | Response |
|---|---|---|
| A specific endpoint's latency degrades gradually over weeks, never crossing an alert threshold in one discrete jump | Slow, cumulative data growth against a query not scaling well (08-database-design.md §2.1's millions-of-rows target eventually being reached) | Caught by trend review during operational reviews (Section 21.2), not only by threshold-crossing alerts, since gradual degradation is exactly the pattern point-in-time alerting is weakest against |
| Authorization failure rate spikes | Either a genuine attempted-abuse pattern or a broken permissions configuration following a recent deployment | Investigated per Section 19, correlated against recent deployments and, if abuse-pattern-shaped, escalated to the security incident process (12-security-architecture.md §26) |

## 10.7 Best Practices

- Review latency/error trends over weeks and months, not only reactively when an alert fires — gradual degradation (Section 10.6) is a real, common failure mode this discipline specifically catches.
- Keep alert thresholds risk-tier-aware (Section 10.4) rather than uniform across all endpoints, avoiding both alert fatigue on low-risk endpoints and insufficient urgency on high-risk ones.

## 10.8 Review Checklist

- [ ] Is every endpoint's monitoring automatically captured via the shared middleware pipeline, with no gaps from custom/bypassed instrumentation (Section 10.2)?
- [ ] Are alert thresholds correctly weighted by the endpoint's actual risk tier (Section 10.4)?
- [ ] Has a gradual, sub-threshold degradation trend been reviewed recently (Section 10.7)?

---

# 11. Database Monitoring

## 11.1 Purpose

To state how this platform observes Supabase PostgreSQL's health and performance — restated and extended from 14-infrastructure-devops-architecture.md Section 8's database-infrastructure architecture and 10-backend-architecture.md Section 21.7's query-performance discipline into continuous, production monitoring.

## 11.2 Architecture

```
Application (via Drizzle, through the connection pooler, 10-backend-
architecture.md §10.8)
   │
   ▼
Supabase PostgreSQL ── native metrics exposed: connection count,
query latency, lock waits, replication lag (once read replicas are
introduced, that document's §22.3), disk/storage utilization
   │
   ▼
Metrics ingested into this platform's observability pipeline (Section 5),
correlated with application-level traces (Section 6) via query-level spans
```

## 11.3 Monitoring Strategy

| Signal | What It Indicates |
|---|---|
| Connection pool utilization | Approaching saturation is a leading indicator of the exact serverless-connection-exhaustion risk 10-backend-architecture.md Section 10.8 exists to prevent |
| Query latency (p95/p99), overall and per-query-pattern | A specific slow query pattern, traceable via Section 6's tracing to the exact Repository function responsible |
| Lock wait time | Contention — particularly relevant for `Inventory` decrement operations under concurrent load (08-database-design.md Section 9.8's flash-sale-scenario concern) |
| Replication lag (once read replicas exist, 10-backend-architecture.md §22.3) | Whether replica-routed reads risk serving meaningfully stale data |
| Table/index bloat and storage growth | Long-term capacity planning signal (Section 20.5), particularly for high-volume tables (`Order`, `Events`, `AuditLog` — 08-database-design.md's stated scale targets) |
| Slow query log | Individual queries exceeding a defined duration threshold, surfaced for `EXPLAIN ANALYZE` review (10-backend-architecture.md §21.7) |

## 11.4 Alert Strategy

| Signal | Alert Condition | Severity |
|---|---|---|
| Connection pool utilization | Approaching a high-utilization threshold (a leading indicator, alerted on *before* actual exhaustion) | Critical — this is precisely the failure mode that, per 10-backend-architecture.md §10.8, would otherwise cascade into total application failure |
| Query latency (aggregate) | p95/p99 sustained above baseline | High |
| Lock wait time | Sustained contention above baseline, especially on `Inventory`/`Order` tables | High — correlated with concurrent-traffic patterns during investigation |
| Replication lag | Exceeds an acceptable staleness threshold for read-replica-routed traffic | Medium–High depending on which read paths are affected |
| Storage/disk utilization | Approaching provisioned capacity | Medium, trending toward High as capacity planning (Section 20.5) should already be underway well before this becomes urgent |

## 11.5 Responsibilities

DevOps/Platform Engineering owns database infrastructure monitoring and capacity planning; backend engineers are responsible for investigating and resolving specific slow-query findings (Section 11.3's slow query log) attributed to their own module's Repository functions.

## 11.6 Common Failures

| Failure | Cause | Response |
|---|---|---|
| Connection pool exhaustion occurs despite monitoring, faster than the leading-indicator alert could act on | A sudden, sharp traffic spike (a viral product, per 08-database-design.md §9.8's flash-sale scenario) outpacing the alert's response window | Investigated post-incident (13-testing-strategy.md §27.6) specifically to determine whether the leading-indicator threshold needs tightening for faster warning, or whether connection-pool sizing itself needs revisiting (10-backend-architecture.md §22.2's scaling strategy) |
| A specific query's performance degrades only under a realistic production data volume, never having been caught by CI's smaller ephemeral test database (13-testing-strategy.md §13.7) | A gap between CI-scale and production-scale data | This is precisely the gap that document's Section 13.7 exists to close via representative-volume performance testing — the production monitoring finding here feeds back into strengthening that pre-production check |

## 11.7 Best Practices

- Treat connection pool utilization as this platform's single most safety-critical database metric, given the serverless architecture's structural dependency on the pooler (10-backend-architecture.md §10.8) — alert on it earliest and most conservatively among all database signals.
- Feed every production slow-query finding back into 13-testing-strategy.md Section 13.7's pre-production performance-testing dataset, closing the loop between what's observed live and what's tested before release.

## 11.8 Review Checklist

- [ ] Is connection pool utilization alerted on well before actual exhaustion, as a leading indicator (Section 11.4)?
- [ ] Are slow-query findings routed to the responsible module's engineers for `EXPLAIN ANALYZE` review (Section 11.3)?
- [ ] Is storage/capacity growth tracked against a proactive planning horizon, not just reactively alerted near the limit (Section 11.4)?


---

# 12. Cache & Storage Monitoring

## 12.1 Purpose

To state how this platform observes Upstash Redis (caching, rate limiting, session caching — 10-backend-architecture.md Section 13) and Cloudflare R2 (media storage — that document's Section 11), two materially different infrastructure components grouped in one section since both are, from this platform's perspective, supporting stateful services the application depends on but doesn't own the internals of.

## 12.2 Cache (Redis) Architecture

```
Application ── read-through cache pattern (10-backend-architecture.md §13.2)
   │
   ▼
Upstash Redis ── metrics: hit rate, miss rate, eviction rate, memory
utilization, command latency, connection count
   │
   ▼
Ingested into the observability pipeline, correlated with the specific
cache-key namespace (module:entity:id:fieldset, that document's §13.3)
generating the hit/miss
```

## 12.3 Cache Monitoring Strategy

| Signal | What It Indicates |
|---|---|
| Hit rate (overall, and per cache-key namespace) | Whether caching is actually providing its intended latency/load benefit — a low hit rate for a given namespace may indicate a TTL misconfiguration (10-backend-architecture.md §13.4) or a key-naming bug preventing intended reuse |
| Eviction rate | Memory pressure — Redis evicting entries before their TTL naturally expires indicates the cache is undersized for its current working set |
| Command latency | Redis-layer latency contribution to overall request latency (visible as a distinct span in tracing, Section 6.2) |
| Rate-limit-specific key activity | Direct visibility into how close to their limits specific callers are running (09-api-architecture.md §2.20's rate-limit headers reflect this same underlying state) |

## 12.4 Storage (R2) Architecture

```
Media module (10-backend-architecture.md §11) ── signed-URL upload/download
   │
   ▼
Cloudflare R2 ── metrics: request rate, error rate, storage volume growth,
egress volume (relevant given R2's zero-egress-fee pricing rationale,
that document's §11.1, worth confirming actual usage patterns match
the assumption that motivated the choice)
```

## 12.5 Storage Monitoring Strategy

| Signal | What It Indicates |
|---|---|
| Upload/download error rate | Client-side upload failures (09-api-architecture.md §20.4's validation failures are expected and excluded from this signal; genuine R2-side errors are the concern) |
| Storage volume growth rate | Long-term capacity/cost planning (Section 20.5), tracked against the media-processing pipeline's garbage-collection effectiveness (10-backend-architecture.md §25.1's reference-counted cleanup) |
| Signed-URL generation latency | A component of the overall media-serving latency users experience |
| Virus-scan pipeline throughput/failure rate | Whether the mandatory scanning step (that document's §11.6) is keeping pace with upload volume, since a backlog here delays legitimate uploads from ever reaching `ready` status |

## 12.6 Alert Strategy

| Signal | Alert Condition | Severity |
|---|---|---|
| Redis hit rate | Sustained, significant drop for a specific namespace | Medium — a performance/cost concern, not typically an immediate correctness risk, unless the cache in question is rate-limiting (Section 13.7's security-relevant case) |
| Redis eviction rate | Sustained high eviction rate | Medium–High, trending toward a capacity-planning conversation (Section 20.5) |
| Redis connection/command errors | Any sustained failure to reach Redis | Critical — directly threatens rate limiting (a security control, 09-api-architecture.md §22.5) and session caching (10-backend-architecture.md §13.6), not merely a performance concern |
| R2 error rate | Sustained elevation above baseline | High — directly affects Product media, avatars, and verification-document availability |
| Virus-scan pipeline backlog | Growing queue depth over a sustained window | Medium–High depending on how directly it delays legitimate creator/buyer-facing uploads |

## 12.7 Responsibilities

DevOps/Platform Engineering owns both Redis and R2 infrastructure monitoring; the Media module's owning engineers (10-backend-architecture.md Section 5.25) own investigation of storage-pipeline-specific findings (upload/virus-scan issues).

## 12.8 Common Failures

| Failure | Cause | Response |
|---|---|---|
| Redis becomes unreachable | An Upstash-side incident, or a network/configuration issue | Rate limiting (09-api-architecture.md §22.5) and session caching (10-backend-architecture.md §13.6) both degrade — the platform's documented fallback behavior for this dependency (per that document's Section 17.2's fail-open/fail-closed distinction, applied per feature) is invoked, and this is treated as a Critical incident given rate-limiting's security role |
| R2 storage costs grow faster than anticipated | The zero-egress-fee pricing assumption (10-backend-architecture.md §11.1) doesn't hold for actual observed traffic patterns, or garbage collection (§25.1) isn't keeping pace with upload volume | Investigated as a cost-management concern (14-infrastructure-devops-architecture.md §20), with garbage-collection effectiveness reviewed first as the most likely, most fixable cause |

## 12.9 Best Practices

- Monitor cache hit rate per namespace, not only as a single platform-wide aggregate — a platform-wide average can mask one specific, important namespace performing poorly while others compensate in the aggregate number.
- Track R2 storage growth against garbage-collection effectiveness specifically, distinguishing "we're storing more because the platform is growing" (expected, healthy) from "we're storing more because cleanup isn't working" (a defect to fix).

## 12.10 Review Checklist

- [ ] Is Redis connectivity monitored with Critical-severity alerting, given its security-relevant rate-limiting role (Section 12.6)?
- [ ] Is cache hit rate tracked per namespace, not only in aggregate (Section 12.9)?
- [ ] Is R2 storage growth tracked against garbage-collection effectiveness, not just raw volume (Section 12.9)?

---

# 13. Background Job Monitoring

## 13.1 Purpose

To state how this platform observes Inngest job executions — restated and extended from 10-backend-architecture.md Section 12's background-job architecture and 13-testing-strategy.md Section 17's job-testing strategy into continuous production monitoring of the platform's asynchronous processing layer.

## 13.2 Architecture

```
Event emitted (10-backend-architecture.md §12.9) ──► Inngest schedules
execution, linked to the originating trace (Section 6.5)
   │
   ▼
Job function executes (step-by-step, each step individually retryable
and observable, that document's §12.2)
   │
   ▼
Metrics + trace spans + logs emitted per step, same conventions as
synchronous request processing (Sections 4–6)
   │
   ▼
Job completes, fails (after exhausting retries), or is retried —
each outcome recorded distinctly
```

## 13.3 Monitoring Strategy

| Signal | What It Indicates |
|---|---|
| Job success/failure rate, per job family (10-backend-architecture.md §12.4 — `notifications`, `search-indexing`, `media-processing`, `payouts`, `analytics`, `cleanup`) | Direct health of each asynchronous processing pipeline |
| Job execution latency | Whether jobs are completing within an expected time budget — particularly relevant for time-sensitive families like `notifications` (a delayed order-confirmation email is a real, if lesser, quality issue) |
| Retry rate | A rising retry rate indicates a growing rate of transient failures against a specific downstream dependency (correlate with Section 14's third-party monitoring) |
| Queue depth / execution lag | The gap between an event being emitted and its corresponding job beginning execution — a growing lag indicates the job family isn't keeping pace with its triggering event volume |
| Dead-letter / exhausted-retry rate | Jobs that failed permanently after exhausting retries (10-backend-architecture.md §18.5) — each such occurrence warrants individual investigation, not just aggregate tracking |

## 13.4 Alert Strategy

| Signal | Alert Condition | Severity |
|---|---|---|
| `payouts` job family failure | Any failure | Critical — directly affects real money reaching real creators (08-database-design.md §14.11's money-flow model), the platform's highest-stakes asynchronous process |
| `notifications` job family failure rate | Sustained elevation above baseline | High — degrades buyer/creator trust even though it's not itself a financial risk |
| Queue depth/execution lag, any family | Sustained growth beyond an acceptable window | High — a leading indicator of the job family falling behind before it manifests as visibly stale/missing outcomes |
| Dead-letter rate | Any individual occurrence for `payouts`; a rate-based threshold for other families | Critical for `payouts`, Medium–High for others depending on family |

## 13.5 Responsibilities

DevOps/Platform Engineering owns the Inngest execution infrastructure's own health; each job family's owning module engineers (10-backend-architecture.md Section 5) own investigating and resolving failures specific to their own job logic.

## 13.6 Common Failures

| Failure | Cause | Response |
|---|---|---|
| A specific job family's queue depth grows steadily during a traffic spike | Job execution throughput not scaling as fast as the triggering event volume | Investigated against Inngest's own auto-scaling behavior (10-backend-architecture.md §22.4); if genuinely under-provisioned, addressed at the infrastructure/configuration level, not by individual job-logic changes |
| A job silently stops being triggered entirely (as opposed to failing after being triggered) | An event-emission bug in the triggering Service Layer function (10-backend-architecture.md §12.9), or a wiring gap (that document's §17.6's smoke-check scope) | Detected via the "silence" pattern (Section 3.6's meta-observability principle, applied here specifically) — zero executions where a non-zero baseline is expected is itself an alert-worthy signal, distinct from and often more dangerous than an elevated failure rate, since it can go unnoticed far longer |

## 13.7 Best Practices

- Alert on job-family "silence" (zero executions against an expected non-zero baseline) with the same seriousness as an elevated failure rate — restated from Section 13.6, since a job family that has silently stopped triggering entirely produces no failure signal at all, only an absence, which is easy to miss without deliberate monitoring for it.
- Review dead-letter/exhausted-retry jobs individually, not only in aggregate — restated from Section 13.3, since each one represents a specific, real business event that failed to complete (a notification never sent, a search index never updated) and may warrant manual remediation beyond the automated retry logic's own limits.

## 13.8 Review Checklist

- [ ] Is `payouts` job family failure alerted at Critical severity, reflecting its real-money stakes (Section 13.4)?
- [ ] Is job-family "silence" (unexpected zero-execution periods) monitored as its own distinct signal (Section 13.7)?
- [ ] Are dead-letter/exhausted-retry jobs reviewed individually, with a remediation path, not just tracked in aggregate (Section 13.7)?


---

# 14. Third-Party Monitoring

## 14.1 Purpose

To state how this platform observes the external services it depends on — Razorpay, Resend, Cloudflare R2, Supabase, Upstash — restated and extended from 10-backend-architecture.md Section 17's integration architecture (timeouts, retries, circuit breakers) into continuous, dependency-specific monitoring.

## 14.2 Architecture

```
Every outbound integration call (10-backend-architecture.md §17's client
wrappers) ── wrapped with: a trace span (Section 6.2), a timing metric,
a success/failure metric, and — for Razorpay specifically — circuit-breaker
state (that document's §17.5)
   │
   ▼
Per-dependency dashboard panel (Section 18.5) aggregating: call volume,
success rate, p95/p99 latency, circuit-breaker state history
```

## 14.3 Per-Dependency Monitoring Table

| Dependency | Key Signals | Circuit Breaker? |
|---|---|---|
| Razorpay | Success rate, latency, webhook delivery lag (10-backend-architecture.md §16.2's signature-verification success rate too) | Yes (that document's §17.5) — its state is itself a monitored, alertable signal |
| Resend | Send success rate, bounce/complaint rate, delivery latency | No — failure here degrades gracefully (queued retry, §17.2's fail-open case) rather than needing to fail fast |
| Cloudflare R2 | Covered in Section 12.4–12.5 | No |
| Supabase (Postgres + Auth + Realtime) | Covered in Section 11 (database); Auth/Realtime-specific connectivity tracked alongside |
| Upstash Redis | Covered in Section 12.2–12.3 | No |
| OpenTelemetry backend / Sentry / PostHog | The observability stack's own health (Section 3.6's meta-monitoring) | No |

## 14.4 Monitoring Strategy

Every dependency's availability is tracked as its own uptime/success-rate metric over time, feeding both real-time alerting (Section 14.5) and longer-term vendor-reliability review (Section 21.2) — a dependency with a degrading reliability trend over months, even if never severe enough to trigger an individual alert, is a signal worth surfacing at the platform's operational review cadence.

## 14.5 Alert Strategy

| Signal | Alert Condition | Severity |
|---|---|---|
| Razorpay circuit breaker opens | Any occurrence | Critical — checkout/payment capability is directly, immediately affected platform-wide |
| Razorpay webhook delivery lag | Sustained delay beyond an acceptable window | High — order confirmation and payout processing depend on timely webhook processing (10-backend-architecture.md §16.3) |
| Resend delivery failure/bounce rate | Sustained elevation above baseline | Medium — degrades communication quality without blocking core commerce functionality |
| Any dependency's deep-health check (Section 8.2) failing | Sustained failure | High, per that section's alert strategy |

## 14.6 Responsibilities

DevOps/Platform Engineering owns dependency-monitoring infrastructure and the vendor-reliability trend review (Section 21.2); the Payments module's owning engineers (10-backend-architecture.md Section 5.14) own investigating Razorpay-specific findings given that dependency's outsized business criticality.

## 14.7 Common Failures

| Failure | Cause | Response |
|---|---|---|
| A dependency's own status page reports no issue, but this platform's monitoring shows degraded success rate/latency | The issue is specific to this platform's own usage pattern or network path, not a broad vendor outage | Investigated independently rather than assumed resolved based on the vendor's own (broader, less specific) status reporting |
| Circuit breaker flaps open/closed repeatedly in a short window | The underlying dependency issue is intermittent rather than a clean outage | Treated as its own signal worth investigating — a flapping circuit breaker degrades user experience differently (inconsistently) than a cleanly-open one, and its threshold/cool-down tuning (10-backend-architecture.md §17.5) may need adjustment |

## 14.8 Best Practices

- Never rely solely on a vendor's own status page — this platform's own, usage-pattern-specific monitoring is the authoritative signal for whether *this platform* is actually affected, per Section 14.7's first failure mode.
- Review vendor-reliability trends at the operational-review cadence (Section 21.2), informing longer-term decisions (a vendor consistently underperforming its own SLA is a business conversation, not just an engineering alerting concern).

## 14.9 Review Checklist

- [ ] Does every third-party dependency have its own dedicated monitoring signals and appropriate alert thresholds (Section 14.3)?
- [ ] Is Razorpay's circuit-breaker state itself monitored and alerted on, not just the underlying call success rate (Section 14.5)?
- [ ] Are vendor-reliability trends reviewed at the operational cadence, independent of individual alert-worthy incidents (Section 14.4)?

---

# 15. Business Metrics

## 15.1 Purpose

To state how this platform monitors *whether the business is actually working*, as distinct from and complementary to whether the *system* is technically healthy (Sections 9–14) — restated from Section 8.7's explicit point that a health check can pass while the platform is behaviorally broken, and from 08-database-design.md Section 21's Analytics domain, now viewed through an operational-monitoring lens rather than only a reporting one.

## 15.2 Architecture

```
Domain events (10-backend-architecture.md §12.9 — order.placed,
payment.captured, product.published, review.created, etc.)
   │
   ▼
Consumed by the `analytics` Inngest job family (that document's §12.4),
writing to 08-database-design.md §21's Metrics/Events/SalesAnalytics tables
   │
   ▼
Also forwarded to PostHog (Section 16) for product-analytics-specific use
   │
   ▼
Surfaced on business-metrics dashboards (Section 18.6) and monitored for
anomalies against expected patterns (Section 15.4)
```

## 15.3 Key Business Metrics

| Metric | What a Sudden Drop Would Indicate |
|---|---|
| Order-placement rate | A broken checkout flow, even if no individual endpoint is erroring (e.g., a client-side bug preventing form submission that never reaches the backend at all) |
| Checkout-completion rate (started vs. completed) | A specific step in the checkout funnel silently failing or confusing buyers |
| Payment success rate | A Razorpay-side or integration-side issue not severe enough to open the circuit breaker (Section 14.5) but still degrading real transactions |
| New creator applications / product publications | A broken onboarding or publishing flow |
| Search result click-through rate | A search-relevance regression (13-testing-strategy.md §19 — the kind of issue that degrades experience without ever producing an "error") |
| Review submission rate | A broken or newly-inaccessible review-eligibility flow (that document's §16) |

## 15.4 Monitoring Strategy

**Rule:** every Section 15.3 metric has an established baseline (accounting for known cyclical patterns — day-of-week, and critically, the gifting-occasion seasonality 00-project-vision.md's core persona work identifies) and is monitored for **anomalous deviation from that pattern**, not a flat, context-free threshold — a 30% order-rate drop on an ordinary Tuesday is alarming; the same absolute order count on a specific date might be entirely expected if that date sits outside a major gifting season the baseline already accounts for.

## 15.5 Alert Strategy

| Signal | Alert Condition | Severity |
|---|---|---|
| Order-placement or checkout-completion rate | Significant, sustained drop against the seasonally-adjusted baseline (Section 15.4), uncorrelated with any known external cause (a planned marketing pause, e.g.) | Critical — restated from Section 8.7, this is often the *first* signal of a subtle, otherwise-invisible functional regression |
| Payment success rate | Sustained drop, even without the circuit breaker opening | High–Critical depending on magnitude |
| New creator applications/publications | Sustained, unexplained drop | Medium–High, investigated as a potential onboarding-flow regression |

## 15.6 Responsibilities

Product and Engineering Leadership jointly own defining which business metrics warrant dedicated monitoring/alerting (this list evolves as the product does); DevOps/Platform Engineering owns the technical pipeline delivering this data reliably; the on-call engineer treats a business-metric alert with the same operational seriousness as a technical one, per Section 15.5's severity classification.

## 15.7 Common Failures

| Failure | Cause | Response |
|---|---|---|
| A business-metric anomaly is falsely attributed to a technical cause when it's actually a genuine market/demand shift | Insufficient context (e.g., a competitor event, a broader e-commerce trend) not visible from the platform's own data alone | Cross-checked against known external context before assuming a technical regression; Product's involvement in triage (Section 15.6) is specifically what supplies this context engineering alone may lack |
| A genuine functional regression exists but is masked by an unrelated, coincidental positive shift in the same metric (e.g., a marketing campaign boosting raw order volume while checkout-completion *rate* quietly degrades) | Monitoring only the raw count, not the rate/ratio metric that would reveal the underlying problem | Reinforces Section 15.3's preference for rate-based metrics (completion rate, success rate) over raw counts wherever a meaningful denominator exists |

## 15.8 Best Practices

- Prefer rate/ratio metrics over raw counts wherever a meaningful denominator exists (Section 15.7), since raw counts are more easily confounded by unrelated volume changes.
- Involve Product, not only Engineering, in triaging a business-metric anomaly — technical and market-context expertise are both genuinely needed to correctly distinguish a regression from a market shift (Section 15.7).

## 15.9 Review Checklist

- [ ] Are business-metric baselines seasonally/contextually adjusted, not flat thresholds (Section 15.4)?
- [ ] Are rate/ratio metrics preferred over raw counts where a meaningful denominator exists (Section 15.8)?
- [ ] Is Product involved in triaging business-metric anomalies alongside Engineering (Section 15.8)?


---

# 16. Product Analytics

## 16.1 Purpose

To state how this platform uses PostHog to understand user behavior and feature adoption — restated and extended from 10-backend-architecture.md Section 19.8's PostHog integration into its full role in this observability architecture, distinct from both the operational monitoring of Sections 9–14 and the business-metrics *health* monitoring of Section 15.

## 16.2 Architecture

```
Domain events (10-backend-architecture.md §12.9), forwarded via the
`analytics` Inngest job (that document's §12.4)
   │
   ▼
PostHog ── event-based product analytics: funnels, retention cohorts,
session-level behavior, feature-flag-gated experiment analysis
(16-cicd-release-management.md §15's flag-driven rollout, measured here)
   │
   ▼
Consumed by Product/Growth for feature-adoption and UX-quality decisions —
distinct audience and purpose from Sections 9-15's engineering-facing
operational monitoring
```

## 16.3 Distinguishing Product Analytics from Operational Monitoring

| Aspect | Operational Monitoring (Sections 9–15) | Product Analytics (This Section) |
|---|---|---|
| Primary question | "Is the system healthy?" | "How are people actually using it, and is a feature succeeding?" |
| Primary audience | Engineering, on-call | Product, Growth, Design |
| Time sensitivity | Real-time, alerting-driven | Retrospective, trend/cohort-driven |
| Typical artifact | A dashboard panel, an alert | A funnel report, a retention curve, an experiment result |

This distinction matters specifically to prevent PostHog dashboards from being relied upon for incident detection (that's Sections 9–15/17's job, with tighter latency and alerting rigor) and to prevent operational dashboards from being cluttered with product-analysis detail that isn't actionable during an incident.

## 16.4 Monitoring Strategy

Feature adoption (via 16-cicd-release-management.md Section 15's flag-rollout stages) is tracked in PostHog as the rollout progresses — usage rate, funnel completion, and any correlated behavior change (e.g., does a new checkout step increase or decrease overall completion rate) inform the go/no-go decision at each rollout percentage increase, complementing (never replacing) the technical health signals (Section 15) that same rollout is simultaneously monitored against.

## 16.5 Alert Strategy

Product analytics is generally **not** a primary alerting source (restated from Section 16.3's stated distinction) — its role is informing deliberate, human-reviewed decisions (a flag rollout's next step, a feature's continued investment) rather than triggering paging alerts. The one exception: a flag-gated feature's PostHog-observed funnel showing a severe, immediate drop-off at a specific step is a strong signal to *pause* that feature's rollout (16-cicd-release-management.md Section 15.9's flag-disable mitigation), reviewed by the feature's owning team promptly, though this is a considered pause-and-review action, not an automated page.

## 16.6 Responsibilities

Product/Growth own PostHog's dashboard configuration and the interpretation of feature-adoption/funnel data; the feature's owning engineering team monitors PostHog data specifically during a flag-gated rollout (Section 16.4) as a required part of that rollout's own process.

## 16.7 Common Failures

| Failure | Cause | Response |
|---|---|---|
| PostHog data is used as if it were real-time operational monitoring, delaying incident response | A team relying on PostHog dashboards during an active incident instead of Sections 9–15/17's purpose-built operational tooling | Reinforced through onboarding/documentation (this section itself) that PostHog is the wrong tool for incident detection — restated as this section's central, load-bearing distinction |
| Event data forwarded to PostHog is incomplete or inconsistent with the same event's operational-monitoring counterpart | The two consumption paths (Section 15.2's business-metrics pipeline and this section's PostHog forwarding) drift apart in what they capture from the same underlying domain event | Both are fed from the same single event-emission point (10-backend-architecture.md §12.9), per that document's architecture — a drift here is treated as a data-pipeline defect to fix at the shared source, not patched independently in each downstream consumer |

## 16.8 Best Practices

- Keep PostHog and operational dashboards visually and organizationally distinct (Section 18's dashboard architecture), so no one mistakes one for the other during a time-sensitive situation.
- Review flag-gated feature rollout data (Section 16.4) jointly between the owning engineering team and Product at each rollout-percentage increase, not as a purely engineering or purely product decision in isolation.

## 16.9 Review Checklist

- [ ] Is PostHog data clearly scoped to product-analysis use, never relied upon for incident detection (Section 16.5)?
- [ ] Is a flag-gated rollout's PostHog funnel data reviewed jointly by Engineering and Product at each stage (Section 16.4)?
- [ ] Does event data reaching PostHog stay consistent with its operational-monitoring counterpart, both sourced from the same emission point (Section 16.7)?

---

# 17. Alerting Architecture

## 17.1 Purpose

To consolidate every alert defined throughout Sections 4–16 into one coherent alerting system — restated and fully specified from 16-cicd-release-management.md Section 21's release-specific monitoring into this platform's complete, steady-state (not just release-window) alerting architecture.

## 17.2 Alerting Philosophy

Restated as this document's central alerting principle from Section 1.7: **alert on symptoms users feel, page on causes engineers can fix.** A customer-facing symptom (elevated checkout failure rate, Section 15.5) is what justifies waking someone up; the specific underlying cause (a slow query, a third-party outage, a bad deployment) is what the resulting investigation (Section 19) uncovers — this platform does not page an on-call engineer for every low-level infrastructure fluctuation that hasn't yet, and might never, produce a user-visible symptom, since doing so would produce exactly the alert fatigue this section exists to prevent.

## 17.3 Alert Architecture

```
Signal source (Sections 4–16) ── metric, log pattern, trace anomaly,
health check, or business-metric anomaly
   │
   ▼
Evaluated continuously against its threshold/anomaly-detection rule
   │
   ▼
Threshold breached ──► Alert fires, classified by severity (Section 17.4)
   │
   ▼
Routed per severity + affected domain (Section 17.6) ──► on-call
notification (16-cicd-release-management.md §27.3) or a lower-urgency
queue for business-hours triage
   │
   ▼
Acknowledged ──► Investigation begins (Section 19)
```

## 17.4 Alert Severity Matrix

| Severity | Definition | Response Expectation | Example |
|---|---|---|---|
| Critical (Sev-1 equivalent) | Complete or near-complete inability for users to complete a core journey; direct financial/data risk | Immediate page, 24/7, response within minutes | Payment processing down; database connection pool exhausted; Razorpay circuit breaker open |
| High (Sev-2 equivalent) | A core journey significantly degraded for a meaningful subset of users, or a leading indicator of imminent Critical impact | Immediate page during business hours, prompt (not necessarily instant) response off-hours | Sustained elevated error rate on a High-risk-tier endpoint; database connection pool approaching saturation |
| Medium | A non-core feature degraded, or a clear early-warning signal not yet user-impacting | Business-hours triage, not a page | Cache hit-rate drop; a single new Sentry issue type with low initial volume |
| Low | Informational, worth tracking but not requiring prompt action | Reviewed at the next operational review (Section 21) | A gradual capacity trend; a vendor-reliability trend |

This mirrors — and is deliberately kept consistent with — 13-testing-strategy.md Section 27.2's defect severity matrix, since a production incident and a reported bug are, at bottom, the same underlying concept (a gap between intended and actual behavior) observed through two different discovery channels.

## 17.5 Alert Fatigue Prevention

**Rule:** every alert has a stated owner, a stated reason for existing, and a documented expected response — restated from Section 2.5's signal-over-noise principle: an alert that fires repeatedly without leading to meaningful action (Section 21.4's alert-effectiveness review) is either recalibrated (its threshold adjusted) or removed, never left firing indefinitely as ignored noise, since an ignored alert is worse than no alert at all — it erodes trust in every other alert in the system.

## 17.6 Alert Routing

| Domain | Primary Route |
|---|---|
| Payments, Checkout, Orders (Critical/High) | On-call engineer, immediate page, per 16-cicd-release-management.md §27.3 |
| Database/Infrastructure (Critical/High) | DevOps/Platform Engineering on-call |
| Security-relevant (any severity involving a `SecurityEvent`, 08-database-design.md §23.5) | Immediate, routed per 12-security-architecture.md's incident-response process, in parallel with standard on-call routing |
| Business metrics (Section 15) | On-call engineer + Product, jointly, given the cross-functional triage need (Section 15.6) |
| Medium/Low severity, all domains | A non-paging queue reviewed during business hours / operational reviews (Section 21) |

## 17.7 Responsibilities

DevOps/Platform Engineering owns the alerting system's infrastructure and the alert-effectiveness review process (Section 17.5, Section 21.4); every alert's defining engineer/team owns that specific alert's ongoing calibration and relevance.

## 17.8 Common Failures

| Failure | Cause | Response |
|---|---|---|
| Alert fatigue — on-call engineers begin ignoring or slow-responding to pages | Poorly-calibrated thresholds producing frequent false/low-value alerts | Addressed via Section 17.5's recalibration-or-removal discipline, treated as an urgent process fix, since alert fatigue directly threatens this platform's ability to detect and respond to genuine Critical incidents |
| A genuine Critical incident produces no alert at all | A monitoring gap — the specific failure mode wasn't anticipated by any existing alert rule | Closed via the post-incident review process (13-testing-strategy.md §27.6) — every incident without a preceding alert results in a new alert rule being defined to catch that specific failure mode next time (Section 22.5) |

## 17.9 Best Practices

- Review every alert's fire history periodically (Section 21.4) — an alert that never fires might indicate either a genuinely stable system or a broken/miscalibrated rule; an alert that fires constantly and is routinely dismissed is actively harmful and requires immediate attention.
- Keep the severity matrix (Section 17.4) consistent with the bug-severity matrix (13-testing-strategy.md Section 27.2) so the whole organization shares one mental model of "how bad is this," whether the issue was caught by a pre-production test or a production alert.

## 17.10 Review Checklist

- [ ] Does every alert have a stated owner, reason, and documented expected response (Section 17.5)?
- [ ] Is alert severity correctly calibrated per the matrix (Section 17.4), consistent with 13-testing-strategy.md's bug-severity classification?
- [ ] Has alert-firing history been reviewed recently for fatigue-inducing false positives or dangerous false negatives (Section 17.9)?

---

# 18. Dashboards

## 18.1 Purpose

To state how this platform's observability data is made visually legible — restated from Section 1.4's objective that platform health should be answerable "at a glance," and organized so different audiences find what they need without wading through data meant for someone else.

## 18.2 Dashboard Architecture Principle

**Rule:** dashboards are organized by **audience and question**, not by data source — an on-call engineer during an incident needs a fundamentally different view (Section 18.3) than an engineering lead reviewing monthly trends (Section 18.7) or a founder checking overall business health (Section 18.6), even though all three might ultimately draw from overlapping underlying data.

## 18.3 The Incident Response Dashboard

The single, purpose-built view an on-call engineer opens first upon receiving a page — restated from Section 17.3's alerting flow as its natural next step: the four golden signals (Section 5.4) for every app/critical endpoint, overlaid with deployment markers (16-cicd-release-management.md Section 21.3), the current status of every Section 14 third-party dependency, and a direct link into the specific trace/logs for the alert that fired. This dashboard's entire design goal is minimizing the time between "I got paged" and "I understand roughly what's happening" (Section 19.2).

## 18.4 The Platform Health Dashboard

A steady-state, always-available view (not incident-specific) of Sections 9–14's monitoring domains — frontend Core Web Vitals, backend golden signals, database/cache/storage health, background job health, third-party dependency status — the default "is everything okay" view any engineer checks at any time, not only during an active incident.

## 18.5 Dependency Status Dashboard

A focused view of Section 14's third-party monitoring, including circuit-breaker state history and vendor-reliability trends — kept separate from Section 18.4's broader platform view specifically because dependency status is a distinct enough concern (and a common enough first hypothesis during any investigation, per Section 19.3) to warrant its own fast, dedicated view.

## 18.6 The Business Health Dashboard

Section 15's business metrics, presented for a broader audience (Product, Founders, Support leadership) than the engineering-focused dashboards above — GMV trend, order/checkout funnel health, creator-onboarding funnel health, all seasonally contextualized (Section 15.4) — the operational counterpart to 08-database-design.md Section 21's PlatformAnalytics domain, viewed here through a "is this healthy right now" lens rather than a historical-reporting one.

## 18.7 Dashboard Layout — Example Structure (Platform Health Dashboard)

```
┌─────────────────────────────────────────────────────────────────┐
│  PLATFORM HEALTH — Last 24h          [env: Production] [●Live]  │
├─────────────────────┬─────────────────────┬─────────────────────┤
│  Request Rate         │  Error Rate          │  p95 Latency         │
│  (by app)              │  (4xx vs 5xx)        │  (by endpoint group) │
├─────────────────────┴─────────────────────┴─────────────────────┤
│  Core Web Vitals (field data, by app)         [LCP][INP][CLS]    │
├─────────────────────┬─────────────────────┬─────────────────────┤
│  DB Connection Pool   │  Redis Hit Rate       │  Job Queue Depth     │
│  Utilization           │                       │  (by family)         │
├─────────────────────┴─────────────────────┴─────────────────────┤
│  Dependency Status Strip: [Razorpay ●] [Resend ●] [R2 ●] [Redis ●] │
├─────────────────────────────────────────────────────────────────┤
│  Recent Deployments (markers) ──── Recent Sentry Issues (top 5)   │
└─────────────────────────────────────────────────────────────────┘
```

## 18.8 Monitoring Strategy (of Dashboards Themselves)

Dashboard usage itself is tracked (which dashboards are actually viewed, how often) — a dashboard nobody looks at is a maintenance burden without benefit, and this data directly feeds Section 22.4's governance/pruning process.

## 18.9 Alert Strategy

Dashboards are not themselves an alert source (Section 17.3's alerts are evaluated independently of whether anyone is currently looking at a dashboard) — but a dashboard panel showing data notably stale (no update in longer than its expected refresh interval) is itself worth a low-severity "dashboard data pipeline" alert, since a stale, silently-broken dashboard is dangerous precisely because it looks superficially fine at a glance.

## 18.10 Responsibilities

DevOps/Platform Engineering owns dashboard infrastructure and the four core dashboards (Sections 18.3–18.6); individual teams/modules may build additional focused dashboards for their own area, following Section 18.2's audience-and-question organizing principle rather than ad hoc data-dumping.

## 18.11 Common Failures

| Failure | Cause | Response |
|---|---|---|
| Dashboard sprawl — many overlapping, inconsistently-maintained dashboards accumulate over time | No governance process pruning unused/redundant dashboards | Addressed via Section 22.4's periodic dashboard audit, using Section 18.8's usage data to identify pruning candidates |
| A dashboard's data goes silently stale, still displaying old data that looks plausible | A data-pipeline failure not itself alerted on | Closed by Section 18.9's freshness-check alert |

## 18.12 Best Practices

- Design every dashboard around one clear question for one clear audience (Section 18.2) — resist the temptation to build one "everything" dashboard that ends up serving no audience well.
- Include deployment markers on every relevant dashboard (Section 18.3, restated from 16-cicd-release-management.md §21.3) — correlating a metric shift with a deployment is one of the single fastest, highest-value diagnostic steps available.

## 18.13 Review Checklist

- [ ] Does every dashboard serve one clear audience and question (Section 18.2)?
- [ ] Are deployment markers present on every relevant operational dashboard (Section 18.12)?
- [ ] Has dashboard usage been reviewed recently to identify pruning candidates (Section 18.8)?


---

# 19. Incident Investigation

## 19.1 Purpose

To state the concrete, repeatable process an engineer follows from "an alert fired" to "I understand the root cause" — the practical, moment-to-moment application of every pillar and tool this document has defined (Sections 4–8) to an actual, live problem.

## 19.2 Investigation Workflow

```
Alert fires (Section 17) ──► On-call engineer acknowledges
   │
   ▼
Open the Incident Response Dashboard (Section 18.3) ──► orient: which
signal fired, how severe, is it still worsening or already stabilizing
   │
   ▼
Correlate against recent deployments (16-cicd-release-management.md §21.3)
──► is this a "yes, right after a deploy" situation (Section 16 of that
document's rollback path) or not
   │
   ▼
Check Section 18.5's Dependency Status Dashboard ──► rule out (or confirm)
a third-party cause
   │
   ▼
Pull a representative failing request's correlation ID (from Sentry, Section
7, or from the alerting metric's own tagged examples) ──► pull its full
trace (Section 6) ──► identify the specific span where time/failure occurred
   │
   ▼
Pull the specific log lines for that span (Section 4) ──► full contextual detail
   │
   ▼
Root cause identified ──► Section 16 (rollback) or 17 (hotfix) of the
CI/CD document as appropriate, or a standard-priority fix if impact allows
   │
   ▼
Post-incident review (13-testing-strategy.md §27.6) ──► observability gaps
found during this investigation are closed (Section 22.5)
```

## 19.3 First Hypotheses, in Priority Order

Restated as a practical heuristic informed by this platform's own architecture (10-backend-architecture.md): (1) a recent deployment (the single most common cause of a new problem, checked first because it's fastest to confirm or rule out via deployment markers); (2) a third-party dependency issue (checked second via Section 18.5's dashboard, since this platform's own code is not at fault in this case and the response — Section 14 — differs entirely from a code-level fix); (3) a capacity/scale issue (a previously-fine query or resource now exceeding a threshold due to organic growth, 08-database-design.md Section 2.1's stated scale trajectory); (4) a genuinely novel, previously-unseen failure mode, investigated from first principles using the full trace/log toolset once the faster-to-check common causes are ruled out.

## 19.4 Root Cause Analysis

**Rule:** an investigation is not complete when the *symptom* is mitigated (a rollback, a flag disable) — it is complete when the *root cause* is understood and a permanent fix (or an explicit, accepted, documented residual risk) is in place, restated from 13-testing-strategy.md Section 27.6's blameless post-incident review requirement. Root cause analysis technique (the "five whys" or an equivalent structured approach) is applied specifically to distinguish the proximate trigger (e.g., "a specific query got slow") from the deeper systemic cause (e.g., "no alert existed for this table's growing size until it was already a problem," itself pointing to a Section 22.5 governance gap).

## 19.5 Investigation Tooling Access

**Rule:** every engineer has access to Sections 4–8's full toolset (logs, metrics, traces, Sentry, dashboards) without needing to request elevated access during an active incident — restated as an operational-readiness principle: the worst time to discover a permissions gap is during a live Critical incident, so access is provisioned proactively, as part of onboarding, not reactively during a crisis.

## 19.6 Investigation Speed Metrics

Mean Time to Detect (MTTD — from an issue's actual onset to an alert firing) and Mean Time to Resolve (MTTR — from alert to verified fix) are tracked per incident and reviewed in aggregate (Section 21.2) — restated and specialized from 13-testing-strategy.md Section 31.6's identical metric, now the primary lens through which this document's own effectiveness (does the observability architecture actually make investigation fast) is judged.

## 19.7 Responsibilities

The on-call engineer (16-cicd-release-management.md Section 27.3) drives initial investigation; the Incident Commander (12-security-architecture.md Section 26.3, for a SEV-1/2 event) coordinates a broader investigation involving multiple engineers/domains; every engineer who investigates any incident, large or small, contributes their findings to the post-incident review (Section 19.4).

## 19.8 Common Failures

| Failure | Cause | Response |
|---|---|---|
| Investigation stalls because a needed trace/log is missing (an instrumentation gap) | The specific failure occurred in a code path Section 6.9's completeness monitoring hadn't yet caught | The gap is closed immediately following the incident (Section 22.5), and, if the missing data significantly slowed resolution, this is itself flagged as a contributing factor in the post-incident review |
| Investigation jumps to a conclusion (e.g., "it's probably the deployment") without actually confirming it via Section 19.3's structured hypothesis-checking | Time pressure encouraging a shortcut | The correct fix (rollback, hotfix) is not applied until the hypothesis is actually confirmed via dashboard/trace evidence — restated from Section 16.3 of the CI/CD document, which explicitly requires confirming a deployment is the actual cause before rolling back, not merely assuming it |

## 19.9 Best Practices

- Follow Section 19.3's priority-ordered hypothesis list systematically during an active incident, resisting the urge to jump straight to a plausible-sounding guess — the ordered list exists precisely because it reflects this platform's own actual, observed distribution of past root causes.
- Capture investigation notes in real time (not reconstructed from memory afterward) — this is what makes Section 19.4's post-incident review accurate and complete rather than a best-effort recollection.

## 19.10 Review Checklist

- [ ] Did this investigation follow the structured workflow (Section 19.2) rather than an ad hoc approach?
- [ ] Was the root cause actually confirmed via evidence (trace, logs, dashboard) before a fix was applied (Section 19.8)?
- [ ] Were MTTD/MTTR recorded for this incident (Section 19.6)?
- [ ] Did the post-incident review identify and result in closing any observability gap found during investigation (Section 19.8)?

---

# 20. SLOs & Error Budgets

## 20.1 Purpose

To state how this platform turns "reliable" from a felt quality into a specific, measured, and deliberately-managed number — the mechanism that makes reliability investment decisions objective rather than a matter of individual opinion or urgency-of-the-moment.

## 20.2 SLIs (Service Level Indicators)

Restated from Section 1.5's definition and Section 5's metrics architecture: an SLI is a specific, already-being-measured signal chosen as *representative* of user-perceived quality for a given service — not every metric this document tracks becomes an SLI; an SLI is a deliberately curated, small subset chosen specifically because it closely tracks what a real user actually experiences.

## 20.3 This Platform's Core SLOs

| Service/Journey | SLI | SLO Target |
|---|---|---|
| API availability (platform-wide) | Percentage of requests returning a non-5xx response | 99.9% over a rolling 30-day window |
| Checkout completion latency | p95 time from checkout-session creation to order confirmation | Within 13-testing-strategy.md §13.4's stated target, 99% of the time |
| Payment processing success | Percentage of payment attempts that succeed or fail with a clear, actionable client-facing reason (as opposed to a timeout/ambiguous failure) | 99.5% over a rolling 30-day window |
| Page load experience (Buyer App, key journeys) | Core Web Vitals "good" threshold (13-testing-strategy.md §13.3) | Met for 75% of real-user page loads (a standard, realistic field-data threshold — 100% is not a realistic target given real-world device/network diversity) |
| Background job timeliness (`notifications` family) | Percentage of jobs completing within their expected time budget | 99% over a rolling 7-day window |

These specific targets are illustrative of this document's *framework*; their exact numeric values are calibrated against real, observed baseline data (Section 5.5) and revisited at the operational review cadence (Section 21.3), not treated as permanently fixed the moment this document is written.

## 20.4 Error Budgets

**Rule:** each SLO's permitted non-compliance (e.g., 99.9% availability implies a 0.1% "budget" of allowed downtime/errors over the window) is tracked explicitly as a spendable resource, not merely a pass/fail line — restated as this document's central risk-management mechanism: when an error budget is healthy (little of it consumed), the team has room to take on calculated risk (a faster-paced release cadence, a more ambitious architectural change); when a budget is nearly or fully consumed, this is a deliberate, binding signal to prioritize reliability work over new feature velocity until the budget recovers, mirroring the same risk-proportional philosophy 13-testing-strategy.md Section 26.3 and 16-cicd-release-management.md Section 14 apply to individual releases, now applied to the platform's overall reliability posture over time.

## 20.5 Error Budget Policy

```
Error budget remaining > 50%  ──► Normal velocity; standard risk tiering
                                    (16-cicd-release-management.md §14)
                                    applies as usual
Error budget remaining 20–50% ──► Elevated caution; Tier 2 releases receive
                                    slightly more scrutiny; reliability-focused
                                    technical debt (13-testing-strategy.md §27)
                                    gains priority
Error budget remaining < 20%  ──► Reliability freeze consideration: new
                                    feature releases for the affected service
                                    are paused pending Engineering Leadership
                                    review; all available capacity redirects
                                    to closing the reliability gap
Error budget exhausted (0%)   ──► Mandatory freeze for the affected service
                                    until the underlying reliability issue is
                                    resolved and the budget begins recovering
```

## 20.6 Monitoring Strategy

Error budget consumption is tracked continuously (not only reviewed periodically) as its own dashboard-visible metric, per SLO, so the team always has current visibility into how much risk tolerance remains before Section 20.5's escalating response tiers engage.

## 20.7 Alert Strategy

| Signal | Alert Condition | Severity |
|---|---|---|
| Error budget crosses the 50% remaining threshold | Any crossing | Medium — informational, feeding Section 21.3's review, not a page |
| Error budget crosses the 20% remaining threshold | Any crossing | High — triggers Section 20.5's elevated-caution response, communicated to Engineering Leadership |
| Error budget reaches 0% (exhausted) | Any occurrence | Critical — triggers Section 20.5's mandatory freeze consideration, an explicit Engineering Leadership decision point |

## 20.8 Responsibilities

Engineering Leadership owns SLO target-setting and the error-budget-policy escalation decisions (Section 20.5); DevOps/Platform Engineering owns the technical measurement and dashboard infrastructure; every engineer's release/prioritization decisions (16-cicd-release-management.md Section 14) are informed by current error-budget status as a standing input, not an afterthought consulted only during a crisis.

## 20.9 Common Failures

| Failure | Cause | Response |
|---|---|---|
| An SLO target is set too loosely (always trivially met) or too tightly (chronically breached, becoming meaningless as a signal) | Insufficiently data-informed initial calibration | Recalibrated at the operational review cadence (Section 21.3) against real observed baselines and actual user-tolerance research where available, not left permanently fixed at an initial guess |
| Error-budget policy (Section 20.5) is acknowledged but not actually followed under feature-delivery pressure | Insufficient organizational commitment to the framework | Escalated as a governance concern (Section 22) — an error-budget policy that isn't actually honored when it matters provides no real risk-management value, and this gap is treated with the same seriousness as any other broken control |

## 20.10 Best Practices

- Set initial SLO targets deliberately conservative (easier to meet) and tighten them over time as the platform's actual reliability and this framework's organizational maturity both improve, rather than starting with an aspirational target the team immediately and chronically misses.
- Make error-budget status visible platform-wide (Section 20.6), not only to Engineering Leadership, so the whole team shares the same real-time understanding of current reliability risk tolerance.

## 20.11 Review Checklist

- [ ] Is error-budget consumption tracked continuously and visibly for every defined SLO (Section 20.6)?
- [ ] Has Section 20.5's escalating response policy actually been followed the last time a budget crossed a threshold (Section 20.9)?
- [ ] Are SLO targets recalibrated periodically against real data, not left permanently fixed (Section 20.9)?


---

# 21. Operational Reviews

## 21.1 Purpose

To state the recurring, deliberate cadence at which this platform steps back from moment-to-moment alerting and investigation (Sections 17, 19) to review trends, recalibrate thresholds, and make longer-horizon reliability and capacity decisions — the practice that keeps this entire observability architecture continuously accurate and useful rather than a system correctly built once and then slowly drifting stale.

## 21.2 Review Cadence and Content

| Review | Frequency | Content |
|---|---|---|
| Incident Review | Per-incident, promptly after resolution | Root cause, MTTD/MTTR (Section 19.6), observability gaps found (Section 19.8), action items (13-testing-strategy.md §27.6) |
| Weekly Operational Review | Weekly | Alert-firing patterns (Section 17.9), error-budget status (Section 20.6), notable trends since last review |
| Monthly Reliability Review | Monthly | SLO/error-budget trend over the month, dependency-reliability trends (Section 14.4), dashboard usage/pruning (Section 18.8), capacity trends (Section 21.5) |
| Quarterly Observability Governance Review | Quarterly | Full governance audit per Section 22 — alert relevance, dashboard relevance, instrumentation coverage gaps, this document's own currency |

## 21.3 Threshold and Baseline Recalibration

**Rule:** every alert threshold and SLO target (Sections 17.4, 20.3) is explicitly revisited at the Monthly Reliability Review — restated from Sections 5.8 and 20.9: a threshold set once at launch and never revisited will inevitably drift out of calibration as real traffic patterns, scale, and user behavior evolve, and this recurring review is the mechanism that prevents that drift from silently accumulating.

## 21.4 Alert Effectiveness Review

**Rule:** every alert's fire history (how often it fired, how often it led to genuine action versus being dismissed as a false positive) is reviewed at the Weekly Operational Review — restated as the concrete implementation of Section 17.5's fatigue-prevention principle: this is where the decision to recalibrate or remove a specific alert is actually made, on a defined, recurring cadence, rather than only reactively when fatigue has already become a severe problem.

## 21.5 Capacity Planning

Restated from Sections 11.3 and 12.5's storage/database growth signals: the Monthly Reliability Review examines longer-horizon capacity trends (database storage growth, R2 storage growth, background-job throughput needs) against 08-database-design.md Section 2's stated millions-of-users/products/orders scale trajectory, informing proactive infrastructure decisions (14-infrastructure-devops-architecture.md Section 18's scaling strategy) well before any resource actually approaches a hard limit — this is explicitly a *leading*, proactive practice, distinct from and complementary to Section 11.4's *reactive* saturation alerting, which exists as the safety net for whatever this proactive planning process doesn't catch in time.

## 21.6 Responsibilities

DevOps/Platform Engineering facilitates the Weekly and Monthly reviews; Engineering Leadership facilitates the Quarterly Governance Review; every engineer contributes to Incident Reviews for incidents they were involved in investigating (Section 19.7).

## 21.7 Common Failures

| Failure | Cause | Response |
|---|---|---|
| Operational reviews are scheduled but consistently skipped or rushed under delivery pressure | Insufficient organizational prioritization of the review cadence itself | Escalated as a governance concern (Section 22) — a review cadence that doesn't actually happen provides none of this section's stated benefit, and consistent skipping is treated as seriously as any other broken process control |
| Reviews happen but produce no concrete action items, only discussion | The review process lacks a clear decision-and-follow-up structure | Each review type (Section 21.2) is required to produce trackable action items (threshold changes, capacity work, alert removals) with owners, not merely a discussion record |

## 21.8 Best Practices

- Keep each review type's scope disciplined to its stated cadence and content (Section 21.2) — a Weekly Review that tries to also cover Section 21.5's capacity-planning depth will either run long or shortchange one of the two concerns; each review's narrower, consistent scope is what keeps it sustainable long-term.
- Track review action items to completion with the same rigor as any other engineering work item, closing the loop between "we noticed this trend" and "we did something about it."

## 21.9 Review Checklist

- [ ] Is every review type in Section 21.2's table actually occurring on its stated cadence?
- [ ] Do reviews produce concrete, owned, tracked action items, not just discussion (Section 21.7)?
- [ ] Have alert thresholds and SLO targets been recalibrated within the last review cycle if warranted (Section 21.3)?

---

# 22. Governance

## 22.1 Purpose

To state how this observability architecture itself stays healthy, relevant, and trustworthy as the platform, the team, and the codebase all grow — restated as the meta-discipline underlying every prior section: observability infrastructure that isn't itself governed inevitably accumulates the same kind of entropy (Section 18.11's dashboard sprawl, Section 17.8's alert fatigue) this document exists to prevent everywhere else.

## 22.2 Governance Principles

Restated and consolidated from throughout this document: every signal has a stated owner and purpose (Section 2.5); alerts are calibrated and pruned on a defined cadence (Section 21.4); dashboards are audience-scoped and usage-reviewed (Sections 18.2, 18.8); instrumentation coverage gaps found during incidents are closed, not merely noted (Section 19.8); and this document itself is a living artifact, updated as the platform evolves, not a one-time specification frozen at authorship.

## 22.3 Ownership Matrix

| Observability Domain | Governing Owner |
|---|---|
| Logging conventions and infrastructure (Section 4) | DevOps/Platform Engineering |
| Metrics and alerting thresholds (Sections 5, 17) | DevOps/Platform Engineering, with per-domain input from the relevant module's owning engineers |
| Tracing instrumentation standards (Section 6) | DevOps/Platform Engineering |
| Error tracking triage process (Section 7) | Engineering Leadership, executed by the on-call/owning engineer per incident |
| Dashboards (Section 18) | DevOps/Platform Engineering for the core four; individual teams for their own focused dashboards |
| SLOs and error budgets (Section 20) | Engineering Leadership |
| This document itself | Engineering Leadership, reviewed at the Quarterly Governance Review (Section 21.2) |

## 22.4 Periodic Audits

**Rule:** the Quarterly Observability Governance Review (Section 21.2) systematically audits: every active alert (still relevant? correctly calibrated? per Section 21.4's weekly input rolled up), every dashboard (still viewed? still serving its stated audience/question, per Section 18.2), instrumentation coverage (any module/endpoint missing standard logging/tracing/metrics, per Section 3.7's stated expectation that this is automatic but occasionally drifts), and this document's own content (does it still accurately describe the actual system, or has the platform evolved past what's written here).

## 22.5 Closing Observability Gaps

**Rule:** restated as this document's single most operationally important governance commitment, cross-referenced from Sections 6.9, 13.6, 17.8, and 19.8: every incident investigation that reveals an observability gap (a missing trace, a missing alert, a missing dashboard signal) results in that gap being closed as a tracked, prioritized action item — never merely noted in a post-incident review document and left unaddressed. This is what makes this platform's observability architecture genuinely improve over time through real operational experience, rather than remaining static at whatever this document specified on day one.

## 22.6 Documentation Currency

This document is updated whenever a new service, dependency, or architectural pattern is introduced (mirroring 10-backend-architecture.md Section 1's own "documentation-first" commitment) — a new third-party integration is not considered complete until Section 14 is updated to include it; a new job family is not complete until Section 13 reflects it; restated as this series' consistent, standing rule (15-engineering-standards.md Section 29's Engineering Decision Record process governs any genuinely novel observability pattern this document doesn't yet anticipate).

## 22.7 Responsibilities

Engineering Leadership owns this document's overall currency and the Quarterly Governance Review; every engineer introducing a new service, dependency, or significant architectural pattern is responsible for proposing the corresponding update to this document, per Section 22.6.

## 22.8 Common Failures

| Failure | Cause | Response |
|---|---|---|
| This document becomes stale, no longer accurately reflecting the actual production system | New services/patterns introduced without a corresponding documentation update (Section 22.6's discipline lapsing) | Caught at the Quarterly Governance Review (Section 22.4); treated as a process gap to close (tightening the "documentation update as part of the same change" habit, mirroring 15-engineering-standards.md §22.6's identical stance on code documentation generally) |
| Observability investment stalls because it's treated as purely a cost center with no visible return | Insufficient connection drawn between observability quality and actual incident-response speed (Section 19.6's MTTD/MTTR) | Addressed by making Section 19.6's metrics visible and reviewed alongside feature-delivery metrics, demonstrating observability's concrete, measurable contribution to platform reliability rather than treating it as an abstract good practice |

## 22.9 Best Practices

- Treat "update the observability documentation and instrumentation" as a standard, expected line item of any new-integration or new-module work, not a separate, deprioritizable follow-up task.
- Use Section 19.6's MTTD/MTTR trend as the concrete evidence for continued observability investment, making its value legible to stakeholders who don't work with this tooling directly day to day.

## 22.10 Review Checklist

- [ ] Does this document accurately reflect every current service, dependency, and job family (Section 22.6)?
- [ ] Was the most recent incident's observability-gap findings (Section 22.5) actually closed, not merely noted?
- [ ] Is the ownership matrix (Section 22.3) current with the team's actual structure?

---

# 23. Review Checklist

Before this document is considered final and ready to govern day-to-day observability practice, and at every Quarterly Governance Review (Section 21.2) thereafter, it is reviewed against:

- [ ] **Consistency** — does every section's terminology and referenced architecture match 08-database-design.md, 09-api-architecture.md, 10-backend-architecture.md, 12-security-architecture.md, 13-testing-strategy.md, 14-infrastructure-devops-architecture.md, and 16-cicd-release-management.md exactly, with no undocumented drift?
- [ ] **Completeness** — does every monitored layer (Sections 9–16) have a stated purpose, architecture, monitoring strategy, alert strategy, responsibilities, best practices, common failures, and review checklist, per this document's own required structure?
- [ ] **Signal Quality** — are alerts genuinely actionable and appropriately severity-classified (Section 17), with no accumulating fatigue-inducing noise (Section 21.4)?
- [ ] **Correlation Integrity** — does every pillar (logs, metrics, traces) remain joinable via correlation ID across every layer, including asynchronous boundaries (Section 6.5)?
- [ ] **Reliability Measurement** — do SLOs and error budgets (Section 20) remain calibrated to real, current data, and is the error-budget policy actually being honored under real delivery pressure (Section 20.9)?
- [ ] **Operational Discipline** — are the review cadences (Section 21) actually occurring, producing tracked action items, not skipped or rushed?
- [ ] **Governance** — does the Quarterly Governance Review (Section 22.4) find this document, its alerts, and its dashboards current and trustworthy, or accumulating the kind of drift Section 22 exists to prevent?
- [ ] **Future Readiness** — does this document's structure extend cleanly to a new service, dependency, or monitoring domain introduced since it was last reviewed, without requiring a wholesale rewrite?

---

*This document is the definitive observability and monitoring architecture reference for Dreams by Kalakaaar v2. No new service, dependency, module, or job family is considered fully shipped until its corresponding logging, metrics, tracing, alerting, and dashboard coverage exist per the standards documented here — and, transitively, remain consistent with 08-database-design.md, 09-api-architecture.md, 10-backend-architecture.md, 12-security-architecture.md, 13-testing-strategy.md, 14-infrastructure-devops-architecture.md, and 16-cicd-release-management.md. Where a production incident reveals a gap this document did not anticipate, that gap is closed — in the system and in this document — before the incident is considered resolved. The platform cannot be trusted to run itself; this document is how the team makes sure they can always see whether it's actually working.*
