# 16 · CI/CD & Release Management — Dreams by Kalakaaar v2

**Document owner:** Principal DevOps Engineer / Release Manager
**Status:** Draft for review
**Audience:** Every engineer, DevOps/Platform Engineering, QA, Engineering Leadership, Support (for release-communication purposes)
**Last updated:** 2026
**Depends on:** 00-project-vision.md through 15-engineering-standards.md in full, most directly 10-backend-architecture.md (Sections 17, 25), 12-security-architecture.md (Sections 18, 24, 26), 13-testing-strategy.md (Sections 24–30), 14-infrastructure-devops-architecture.md (Sections 4, 6), and 15-engineering-standards.md (Sections 24–25, 27–30)
**Precedes:** All pipeline configuration, deployment tooling setup, and release-process execution

> **This document defines the release process, not its implementation.** It contains no GitHub Actions YAML, no pipeline scripts, and no deployment tooling configuration. Its purpose is to be the single reference from which every pipeline stage, every environment promotion, and every release decision is built and judged — the answer to "how does code safely become a real feature a real buyer or creator uses" from the moment it's committed to the moment it's confirmed working in Production, and every contingency in between.

---

# 1. Introduction

## 1.1 Purpose

Every prior document in this series describes a system worth building correctly (00–09), an architecture worth building it on (10–12), a way of proving it works (13), and a way of writing it consistently (15) — plus, per 14-infrastructure-devops-architecture.md, the infrastructure that system runs on. This document is the connective process across all of it: how a commit becomes a pull request, how a pull request becomes a merged change, how a merged change becomes a deployment, and how a deployment becomes a verified, trustworthy release a real user experiences — with an explicit, rehearsed answer for what happens when any step of that chain fails.

## 1.2 Scope

**In scope:** the complete software delivery lifecycle from a developer's first commit through production release and post-deployment verification — repository and branching workflow, pull request lifecycle, CI pipeline stages, quality and security gates, build and test execution, preview/staging/production environment promotion, database migration sequencing, release strategy (versioning, feature flags, canary/gradual rollout), rollback and hotfix procedures, deployment and post-deployment verification, pipeline failure handling and recovery, artifact management, secrets/configuration handling in the pipeline, compliance/audit trail, and operational ownership.

**Out of scope:** the testing strategy itself (owned by 13-testing-strategy.md — this document orchestrates *when* those tests run in the pipeline, not what they verify), the infrastructure those pipelines deploy to (owned by 14-infrastructure-devops-architecture.md — this document describes the *process* moving code through that infrastructure, not the infrastructure's own shape), and coding standards (owned by 15-engineering-standards.md — this document assumes code already meets that bar by the time it reaches CI).

## 1.3 Audience

Every engineer, since every engineer pushes code through this pipeline; DevOps/Platform Engineering, who own the pipeline's implementation and health; QA, who own staging validation and release-readiness sign-off (13-testing-strategy.md Section 29); engineering leadership, who own release-approval decisions for higher-risk changes; and Support, who need visibility into what shipped and when to answer buyer/creator questions accurately.

## 1.4 Objectives

1. Make the path from commit to production **fully traceable** — every deployment answers "what commit, what tests passed, who approved it, when" without ambiguity (Section 26).
2. Make **every environment promotion deliberate** — nothing reaches Production that hasn't passed through Preview and, for anything above the lowest risk tier, Staging (14-infrastructure-devops-architecture.md Section 4.3), with no silent shortcuts.
3. Make **rollback fast and safe by default**, not something invented under incident pressure — restated and expanded here from 14-infrastructure-devops-architecture.md Section 6.6 into the full decision process (Section 16).
4. Make **release risk proportional to release rigor** — a copy fix and a payment-processing change do not travel through this pipeline with the same ceremony, mirroring 13-testing-strategy.md Section 26.3's risk-tiering applied here at the release-process level specifically.
5. Make **failure a rehearsed, calm procedure**, not an improvised one — every pipeline stage in this document states not just its happy path but its specific failure modes and recovery steps (Section 22).

## 1.5 Definitions

| Term | Meaning in this document |
|---|---|
| Deployment | A specific, versioned build reaching a specific environment (Preview, Staging, or Production) — a technical event. |
| Release | A deployment becoming active/visible to its intended audience — a product/business event, deliberately decoupled from deployment via feature flags (Section 15) per 14-infrastructure-devops-architecture.md Section 6.8. |
| Promotion | The act of moving a specific, already-built artifact from one environment to the next, never rebuilding it along the way (Section 23.2). |
| Release Tier | The risk classification (Tier 1/2/3) a release inherits from 13-testing-strategy.md Section 26.3, driving how much process rigor this document requires (Section 14.3). |
| Rollback | Reverting Production traffic to a prior, already-built deployment (14-infrastructure-devops-architecture.md Section 6.6) — a traffic-reassignment operation, never a rebuild. |
| Hotfix | An emergency, expedited path for a Critical-severity production issue (13-testing-strategy.md Section 27.2), compressed in timeline but never skipped in process (Section 17). |

## 1.6 References

This document sits directly atop 14-infrastructure-devops-architecture.md's deployment architecture (its Sections 4 and 6, restated and operationalized here as day-to-day process) and 13-testing-strategy.md's quality gates and release-readiness framework (its Sections 24–30, which this document's pipeline stages exist specifically to execute). It assumes 12-security-architecture.md's CI/CD security controls (that document's Section 24) and 15-engineering-standards.md's git/PR conventions (that document's Section 24) as already-settled inputs, not decisions this document re-litigates.

## 1.7 Guiding Principles

1. **Every environment is earned, never skipped.** A change reaches Production only after Preview, and — for anything above the lowest risk tier — Staging validation, on every single release, with no informal "just this once" exception (14-infrastructure-devops-architecture.md Section 4.3).
2. **Deployment and release are different events.** Code reaching Production and a feature becoming visible to users are decoupled via feature flags (Section 15) precisely so deployment can be frequent and low-drama while release remains a deliberate, controlled product decision.
3. **Rollback is a first-class, pre-verified capability, not a hopeful assumption.** Every deployment confirms its own rollback safety *before* it happens (Section 16.2), never discovers a rollback is unsafe *during* an incident.
4. **Rigor scales with risk, not with habit.** A Tier 1 (Payments, Auth, Checkout, migrations) release and a Tier 3 (copy-only) release do not travel through identical process weight (Section 14.3) — applying uniform rigor everywhere would both slow down low-risk work and under-scrutinize high-risk work.
5. **Every pipeline failure has a documented recovery path.** This document does not merely describe the happy path of each stage; every section states what breaks, why, and what an engineer does next (per this document's own required structure).

## 1.8 Non-Goals

This document does not: include GitHub Actions YAML, pipeline scripts, or any executable configuration; redefine the testing strategy (13) or infrastructure (14) those pipelines depend on; or prescribe a specific CI vendor beyond what the finalized stack (GitHub-hosted repository, Vercel-hosted deployment) already implies.

---

# 2. CI/CD Philosophy

## 2.1 Continuous Integration Philosophy

Every engineer integrates their work into the shared main branch frequently — in small, reviewable increments (15-engineering-standards.md Section 24.5), never in long-lived branches that diverge for weeks before a painful, high-risk merge. CI's job is to make every single integration attempt immediately and automatically verified (13-testing-strategy.md Section 24.1's full pipeline), so integration problems are caught at the scale of one small change, not accumulated across dozens of unverified changes merged in a batch.

## 2.2 Continuous Deployment Philosophy

Every change that passes CI is **deployable** immediately — restated from 14-infrastructure-devops-architecture.md Section 6.3, this platform practices continuous deployment to Production on every merge to `main` for changes that clear the appropriate quality gates (Section 7), not batched, scheduled release trains. This is possible specifically because Section 2.1's small-increment discipline and Section 15's feature-flag decoupling together make "deploy immediately" a low-risk default rather than a reckless one — deployment frequency is a *symptom* of a healthy, well-tested, well-decoupled pipeline, not a goal pursued independent of that foundation.

## 2.3 Why Continuous Over Batched Releases

| Property | Continuous Deployment (this platform's model) | Batched/Scheduled Releases (rejected default) |
|---|---|---|
| Blast radius per release | Small — one or a few reviewed changes | Large — many changes bundled, harder to isolate a regression's cause |
| Time-to-production for a fix | Minutes to hours | Days to weeks, waiting for the next release train |
| Rollback precision | Precise — rolling back one small deployment reverts one small change | Imprecise — rolling back a batch reverts many unrelated changes together |
| Engineer feedback loop | Fast — an engineer sees their change live and verified quickly | Slow — feedback arrives long after the change was written, when context has faded |

This platform does not batch releases because doing so would trade away every one of these properties without a corresponding, compelling benefit at this platform's scale and risk profile — restated as a deliberate architectural stance this document does not revisit per release, only per genuine, evidenced need (Section 29).

## 2.4 Deployment Frequency and Risk Are Managed Independently

Continuous deployment does not mean uniform risk tolerance — restated from Section 1.7's guiding principles: a Tier 1 change still requires the additional rigor 13-testing-strategy.md Section 26.3 and this document's Section 14.3 specify, even though it flows through the same continuously-deploying pipeline as a Tier 3 change. Frequency of deployment and rigor of process are two independent dials this platform tunes separately, not a single trade-off between "fast" and "careful."

## 2.5 Trunk-Based Development

Restated as the concrete branching philosophy underlying Sections 2.1–2.2: this platform practices trunk-based development (short-lived feature branches off `main`, merged frequently, per 15-engineering-standards.md Section 24.2) rather than long-lived release branches or GitFlow-style branch hierarchies — the specific branching model is detailed fully in Section 4, but the philosophical commitment (frequent integration into one shared trunk) is stated here as the CI/CD strategy's foundation.

## 2.6 Automation Over Manual Process, With Deliberate Human Checkpoints

**Rule:** every mechanically-verifiable step in this pipeline (tests passing, types checking, security scans clearing) is automated, with zero manual "did you remember to check this" steps for anything a machine can check faster and more reliably. Human judgment is reserved specifically for what genuinely requires it — a Tier 1 go/no-go decision (13-testing-strategy.md Section 29.4), an irreversible-migration sign-off (Section 12.5), an emergency hotfix authorization (Section 17) — never inserted as a manual gate merely out of habit or false caution where an automated check would serve equally well and faster.


---

# 3. Repository Workflow

## 3.1 Purpose

To state how the single GitHub monorepo (14-infrastructure-devops-architecture.md's stated repository model, housing `apps/buyer`, `apps/creator`, `apps/internal`, and every `packages/*` per 11-frontend-architecture.md) is used day-to-day as the substrate every other section of this document builds on.

## 3.2 Architecture

One GitHub repository, one `main` branch as the single source of truth, Turborepo-aware CI (11-frontend-architecture.md Section 3.3's dependency-graph-based affected-package detection, restated at the pipeline-infrastructure level in 14-infrastructure-devops-architecture.md Section 6.2) determining which apps/packages a given change actually touches, so verification and deployment effort scales with a change's actual footprint, not the monorepo's total size.

## 3.3 Workflow

```
Engineer creates a short-lived branch off `main` (Section 4.2)
   │
   ▼
Commits pushed ──► Preview deployment + fast CI subset triggered automatically
   │
   ▼
Pull Request opened (Section 5) ──► full CI pipeline (Section 6) + code review
   │
   ▼
Approved + all gates green ──► squash-merged to `main` (15-engineering-standards.md §24.6)
   │
   ▼
`main` merge ──► Staging deployment (Tier 2/3) or direct Production-track (Section 13)
```

## 3.4 Responsibilities

Every engineer is responsible for keeping their own branch current with `main` (rebasing or merging `main` in periodically for a longer-lived branch, though Section 2.5's trunk-based philosophy strongly discourages branches living long enough for this to become a frequent need); DevOps/Platform Engineering owns the repository's branch-protection configuration and CI-trigger wiring itself.

## 3.5 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| A branch has diverged significantly from `main`, producing large, hard-to-resolve merge conflicts | Branch lived too long before merging (violates Section 2.5's trunk-based philosophy) | Rebase incrementally, or — if divergence is severe — close the branch and re-implement the change against current `main` in smaller increments |
| Turborepo's affected-package detection incorrectly determines a change's footprint (too broad, slowing CI; or too narrow, missing a real dependency) | A cross-package dependency not correctly declared in the monorepo's dependency graph | Fix the dependency declaration; treat as a build-configuration bug requiring its own tracked fix, not a one-off pipeline override |

## 3.6 Recovery Strategy

A significantly diverged branch is not force-merged past conflicts under time pressure — it is either incrementally rebased in a controlled manner or, if genuinely unsalvageable, abandoned in favor of a fresh branch reimplementing the same change in smaller pieces against current `main`, per Section 2.5's stated philosophy that this situation is itself a process signal worth heeding, not just a one-time inconvenience to push through.

## 3.7 Best Practices

- Push commits frequently, even before a pull request is opened, to get Preview deployment and fast-CI feedback (Section 11) as early as possible.
- Keep `main` always in a deployable state (Section 2.2) — this is only possible because every merge to it has already cleared the full quality gate (Section 7); no engineer merges "known-broken" code with an intention to fix it in a follow-up commit.

## 3.8 Review Checklist

- [ ] Is the branch short-lived and reasonably current with `main` (Section 3.5)?
- [ ] Does Turborepo's affected-package detection correctly scope this change's CI/deployment footprint?

---

# 4. Branching Strategy

## 4.1 Purpose

To state, precisely, the branch model this platform uses and why — trunk-based development (Section 2.5), not GitFlow or a long-lived release-branch model, and to make explicit why that choice fits this platform's continuous-deployment philosophy (Section 2.2).

## 4.2 Branch Types

| Branch | Purpose | Lifetime | Deploys To |
|---|---|---|---|
| `main` | The single source of truth; always deployable | Permanent | Staging (Tier 2/3 changes, per Section 13) and Production (via the promotion flow, Section 19) |
| `feature/*`, `fix/*`, `refactor/*`, etc. (15-engineering-standards.md Section 24.2's naming convention) | One engineer's in-progress, single-purpose change | Days, rarely longer (Section 2.5) | Preview only (Section 11) |
| `hotfix/*` | An emergency Critical-severity fix (Section 17) | Hours | Preview, then directly promoted through an expedited Staging/Production path (Section 17.4) |

**Notably absent:** a long-lived `develop` branch, per-environment long-lived branches (`staging`, `production` as persistent branches rather than deployment targets), and release branches cut per version — this platform's environments (Section 19) are deployment *targets* promoted to from `main`, not separate, divergent branches requiring their own merge-back discipline, which is precisely the complexity trunk-based development exists to avoid.

## 4.3 Branching Diagram

```
main ──●──●──●──────●──●──────────●──●──●──►  (always deployable, continuously
        │  │  │      │  │          │  │  │      promoted to Staging/Production)
        │  │  │      │  │          │  │  │
        │  │  └──────┘  │          │  │  │
        │  │  feature/  │          │  │  │
        │  │  cart-fix  │          │  │  │
        │  │  (merged)  │          │  │  │
        │  │            └──────────┘  │  │
        │  │           feature/       │  │
        │  │           vacation-mode  │  │
        │  │           (merged)       │  │
        │  └── fix/coupon-timezone    │  │
        │      (merged)               │  │
        └── hotfix/payment-webhook ───┘  │
            (expedited, Section 17)      │
                                    feature/creator-analytics-v2
                                    (in progress, short-lived)
```

## 4.4 Branch Protection Rules

**Rule:** `main` is protected — no direct pushes (all changes arrive via reviewed pull request, 15-engineering-standards.md Section 24.4), no force-pushes ever, and every merge requires the full CI pipeline (Section 6) to pass plus the required code review approval (that document's Section 25.2). These protections are configured once, centrally, and are not individually disable-able by any single engineer, including for a "quick fix" — the bypass procedure (Section 17.5, mirroring 12-security-architecture.md Section 26.6) is the only sanctioned exception path, and it requires named accountability, never a silent, unilateral override.

## 4.5 Responsibilities

Every engineer follows the branch-naming and lifecycle conventions (15-engineering-standards.md Section 24.2); DevOps/Platform Engineering owns and maintains the branch-protection configuration itself.

## 4.6 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| An engineer attempts to push directly to `main` | Misconfiguration or an attempted bypass | Rejected by branch protection automatically; if a genuine emergency motivated the attempt, redirect to the proper hotfix path (Section 17) |
| Two long-lived feature branches conflict extensively when both attempt to merge | Violates Section 2.5's trunk-based, short-lived-branch philosophy | Resolve via careful, incremental rebase of whichever merges second; treat the branch longevity itself as the root cause to avoid repeating |

## 4.7 Best Practices

- Branch directly off the latest `main`, every time — never off another engineer's still-open feature branch, which creates a hidden dependency chain that complicates both review and merge ordering.
- Delete a branch immediately after it merges — a lingering merged branch adds noise without value, per 15-engineering-standards.md Section 24.2's short-lived-branch philosophy extended to branch *cleanup*, not just branch *creation*.

## 4.8 Review Checklist

- [ ] Does the branch name follow the established convention (15-engineering-standards.md Section 24.2)?
- [ ] Is `main` the only branch this change targets for merge?
- [ ] Has the branch been deleted post-merge?


---

# 5. Pull Request Lifecycle

## 5.1 Purpose

To state the complete, ordered lifecycle a pull request travels through — the point at which 15-engineering-standards.md's PR/review standards (its Sections 24–25) and this document's CI/CD machinery meet.

## 5.2 Lifecycle Diagram

```
Draft/WIP (optional) ──► Ready for Review ──► CI Pipeline Runs (Section 6)
                                                     │
                          ┌──────────────────────────┼──────────────────────┐
                          ▼ (fail)                   ▼ (pass)                
                    Author fixes,               Code Review (human)
                    re-pushes, CI                     │
                    re-runs                ┌───────────┴───────────┐
                                            ▼ (changes requested)    ▼ (approved)
                                     Author addresses          Squash-merge to `main`
                                     feedback, re-pushes              │
                                            │                          ▼
                                            └──────────────►   Branch deleted;
                                                                Staging/Production
                                                                promotion begins
                                                                (Section 19)
```

## 5.3 Stage Detail

| Stage | What Happens | Gate |
|---|---|---|
| Draft | Work-in-progress, visible for early feedback, not yet requesting formal review | None — CI's fast subset still runs for early signal |
| Ready for Review | Author marks the PR ready; full CI pipeline (Section 6) triggers | Full CI must pass before review is considered complete (though review can begin in parallel) |
| Code Review | At least one reviewer works through 15-engineering-standards.md Section 25.3's consolidated checklist | At least one approval, zero unresolved blocking findings (that document's Section 25.4) |
| Merge | Squash-merge (15-engineering-standards.md Section 24.6) | Branch protection (Section 4.4) enforces CI-passing + approval before the merge button is even enabled |
| Post-Merge | Branch deleted; deployment promotion begins automatically (Section 19) | N/A — this is the trigger for the next phase, not a gate itself |

## 5.4 Responsibilities

The PR author is responsible for a complete, well-described submission (15-engineering-standards.md Section 24.4) and for promptly addressing review feedback; the reviewer is responsible for a thorough, checklist-driven review within a prompt turnaround (that document's Section 25.5); DevOps/Platform Engineering owns the CI pipeline's own reliability (Section 22) so it never becomes the bottleneck in this lifecycle.

## 5.5 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| CI fails on a seemingly unrelated test | Often a genuine, previously-undetected interaction the change introduced, not "just flaky" | Investigate before assuming flakiness (13-testing-strategy.md Section 24.5's flaky-test policy still requires deliberate quarantine, not a reflexive re-run) |
| A PR sits unreviewed for an extended period | Reviewer bandwidth, unclear ownership | Escalate per Section 27's ownership matrix; a stale PR is itself a process signal worth surfacing, not silently tolerating |
| Merge conflicts appear after approval, before merge | `main` moved forward significantly since the PR was opened | Author rebases/merges `main` in, re-triggering CI; re-review is required only if the rebase introduces a substantive change, not for a trivial conflict resolution |

## 5.6 Recovery Strategy

A PR blocked by a failing, genuinely flaky test (as distinct from a real regression) follows 13-testing-strategy.md Section 24.5's quarantine procedure — the flaky test is removed from the blocking path via the documented quarantine mechanism, never worked around by an individual engineer re-running the pipeline repeatedly until it happens to pass, which would silently erode the entire team's trust in CI results.

## 5.7 Best Practices

- Open a PR early (as a draft) for early, low-stakes feedback on direction before investing heavily in an approach that review might redirect.
- Respond to review feedback in the same PR, as new commits (not force-pushed rewrites that erase the reviewer's ability to see what changed since their last pass) until the final pre-merge squash consolidates everything into one clean commit (Section 4.6 of 15-engineering-standards.md).

## 5.8 Review Checklist

- [ ] Does the PR follow the complete lifecycle (Section 5.2) with no stage skipped?
- [ ] Is any review feedback still unresolved at the point of merge (a blocking-finding violation, 15-engineering-standards.md Section 25.4)?

---

# 6. Continuous Integration Pipeline

## 6.1 Purpose

To state the complete, ordered set of automated checks every pull request passes through — the orchestration layer tying together 13-testing-strategy.md's test levels (Section 24.1), 15-engineering-standards.md's quality standards, and 12-security-architecture.md's security checks (Section 24) into one coherent pipeline.

## 6.2 Pipeline Architecture

```
Push to a PR branch
   │
   ▼
[Affected-Package Detection] ── Turborepo determines which apps/packages
   │                             this change actually touches (11-frontend-architecture.md §3.3)
   ▼
[Type Check] ──────────────────  Zero TypeScript errors (15-engineering-standards.md §9.2)
   │
   ▼
[Lint] ─────────────────────────  Zero errors, incl. module-boundary rules (§6, §26.2 of that doc)
   │
   ▼
[Security & Dependency Scans] ──  Section 8 of this document
   │
   ▼
[Unit + Component Tests] ───────  13-testing-strategy.md §6–7
   │
   ▼
[Integration Tests] ────────────  Ephemeral test database provisioned, §8 of that document
   │
   ▼
[API / Contract Tests] ─────────  §9 of that document, incl. OpenAPI conformance
   │
   ▼
[Build] ────────────────────────  Section 9 of this document
   │
   ▼
[Fast E2E Subset] ──────────────  §10.6 of that document — Chromium-only, mandatory journeys
   │
   ▼
[Visual Regression + Lighthouse CI]  §11.6, §13.3 of that document
   │
   ▼
All green ──► Preview deployment promoted (Section 11); mergeable
```

## 6.3 Affected-Scope Optimization

**Rule:** CI runs the full pipeline only against apps/packages Turborepo's dependency graph determines are actually affected by a given change (14-infrastructure-devops-architecture.md Section 6.2) — a change touching only `apps/creator` does not re-run `apps/internal`'s full test suite, keeping the standard PR feedback loop fast (13-testing-strategy.md Section 24.4's target ceiling) regardless of the monorepo's total size. A change to a shared `packages/*` dependency correctly triggers the full pipeline for every app depending on it, since Turborepo's graph makes that dependency explicit.

## 6.4 Parallelization

Independent pipeline stages (type-check, lint, and the various test levels) run in parallel across CI workers wherever they have no dependency on one another's output, restated from 13-testing-strategy.md Section 24.4 as this document's own binding pipeline-architecture commitment — sequential execution is reserved only for stages with a genuine dependency (the build must succeed before E2E tests run against it).

## 6.5 Responsibilities

DevOps/Platform Engineering owns the pipeline's overall structure, performance, and reliability; every engineer is responsible for a green pipeline on their own PR before requesting review is considered complete (Section 5.3); QA/SDET owns the ongoing health of the test suites the pipeline executes (13-testing-strategy.md Section 27.5).

## 6.6 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| The entire pipeline is slow/degraded platform-wide, not just for one PR | A CI infrastructure issue, an inefficient shared test fixture, or unexpectedly poor cache-hit behavior in Turborepo's build cache | DevOps/Platform Engineering treats this as an incident against Section 22's failure-handling process, not an individual engineer's problem to work around |
| A specific stage (e.g., Integration Tests) fails intermittently across many unrelated PRs | A shared test-environment provisioning issue (e.g., the ephemeral test database isn't reliably ready before tests start) | Investigated as an infrastructure defect in the CI environment itself (14-infrastructure-devops-architecture.md Section 4.1's CI environment tier), not treated as flaky-test quarantine (13-testing-strategy.md Section 24.5), since the root cause is environmental, not test-specific |

## 6.7 Recovery Strategy

A platform-wide CI degradation is escalated immediately to DevOps/Platform Engineering (Section 27's ownership matrix) rather than each affected engineer independently retrying their own pipeline runs — a systemic issue is fixed once, centrally, not worked around individually across every affected PR.

## 6.8 Best Practices

- Keep pipeline stages independent and side-effect-free wherever possible, maximizing safe parallelization (Section 6.4).
- Monitor pipeline execution time as its own tracked metric (Section 21.4) — a slow, gradually-degrading pipeline erodes the fast-feedback principle (13-testing-strategy.md Section 2.5) this entire document is built on, and is worth proactive attention before it becomes a team-wide productivity drag.

## 6.9 Review Checklist

- [ ] Does the pipeline correctly scope its execution to only the affected apps/packages for this change (Section 6.3)?
- [ ] Are independent stages running in parallel, not needlessly sequential (Section 6.4)?
- [ ] Is pipeline execution time within its target ceiling for this PR?


---

# 7. Quality Gates

## 7.1 Purpose

To consolidate, at the pipeline-orchestration level, every quality gate 13-testing-strategy.md Section 26 and 15-engineering-standards.md Section 26.2 already define — this section states *where in the CI/CD pipeline* each gate is enforced, not what each gate independently means (owned by those documents).

## 7.2 Quality Gate Matrix

| Gate | Enforced At | Bypassable? | Owning Document |
|---|---|---|---|
| Type check | Every PR, every push | No | 15-engineering-standards.md §9.2 |
| Lint (incl. module-boundary rules) | Every PR, every push | No | 15-engineering-standards.md §26.2, §6 |
| Unit/Component/Integration/API tests passing | Every PR | No | 13-testing-strategy.md §6–9, §26.2 |
| Coverage thresholds (risk-tiered) | Every PR, delta-measured | Yes, with explicit reviewer sign-off + tracked follow-up, low-risk gaps only | 13-testing-strategy.md §25 |
| Code review approval | Every PR | No | 15-engineering-standards.md §25 |
| OpenAPI contract conformance | Every PR touching an endpoint | No | 09-api-architecture.md §26.1, 13-testing-strategy.md §9.3 |
| Visual regression | Every PR touching `packages/ui` or a covered screen | Yes, via explicit baseline-update approval in the same PR | 13-testing-strategy.md §11.6 |
| Full E2E suite (all browsers) | Every Tier 1/2 release, nightly | No, for Tier 1 releases | 13-testing-strategy.md §10.6 |
| Security scans (Section 8) | Every PR | No, for high/critical findings | 12-security-architecture.md §24 |
| Named human sign-off | Every Tier 1 release | No | 13-testing-strategy.md §29.4 |

## 7.3 Architecture

Every gate in Section 7.2 is enforced by GitHub branch protection (Section 4.4) or the CI pipeline itself (Section 6) — never by a manual checklist a human is trusted to remember to work through unassisted. Where a gate genuinely requires human judgment (code review, Tier 1 sign-off), the *requirement* that judgment be exercised and recorded is itself automated (a merge button that stays disabled until an approval is recorded, a release checklist — Section 18.6 — that must be completed before a Tier 1 deployment proceeds).

## 7.4 Responsibilities

DevOps/Platform Engineering owns the gates' technical enforcement (branch protection rules, CI configuration); Engineering Leadership owns the *policy* of which gates apply at which risk tier (13-testing-strategy.md Section 26.3); every engineer and reviewer is accountable for not attempting to route around a gate outside the documented bypass procedure (Section 7.5).

## 7.5 Bypass Procedure

Restated identically from 13-testing-strategy.md Section 26.6 and 12-security-architecture.md Section 26.6: a gate marked bypassable requires named, senior sign-off, a mandatory tracked follow-up ticket restoring full compliance within a short window, and a logged justification — never a silent, individual workaround. A gate marked **not** bypassable has no exception path at all, full stop, regardless of urgency; Section 17's hotfix process exists precisely to give urgent changes a fast *path through* these gates, never a way *around* them.

## 7.6 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| A gate blocks a genuinely urgent fix | The gate is doing its job — urgency does not exempt correctness | Route through the hotfix process (Section 17), which compresses timeline while preserving every non-bypassable gate |
| A bypassable gate is used repeatedly for the same class of gap | A systemic under-investment in that area (e.g., coverage in a specific module consistently falling short) | Escalated as a technical-debt/process concern (13-testing-strategy.md Section 27.4), not treated as an acceptable steady-state pattern |

## 7.7 Recovery Strategy

Repeated bypass usage against the same gate is reviewed at the platform level (Section 21's metrics) and treated as a signal that either the underlying quality issue needs dedicated remediation or the gate itself needs recalibration — never allowed to become a normalized, unexamined routine exception.

## 7.8 Best Practices

- Treat every gate as a genuine signal, not an obstacle to route around — a failing gate on a rushed change is far more often correct than the schedule pressure suggesting it should be ignored.
- Review the bypass log (Section 26) periodically as its own agenda item, specifically watching for repeated bypass of the same gate.

## 7.9 Review Checklist

- [ ] Did this release pass every gate its risk tier requires (Section 7.2), with any bypass properly logged and justified (Section 7.5)?

---

# 8. Security Checks

## 8.1 Purpose

To state where and how 12-security-architecture.md Section 24's CI/CD security controls are actually executed within this pipeline.

## 8.2 Architecture

```
[Dependency Scanning] ──► Every dependency change, every scheduled sweep of existing deps
   │
   ▼
[Secret Scanning] ──────► Every commit, every push, pre-commit hook + CI-level re-verification
   │
   ▼
[Static Application Security Testing (SAST)] ──► Every PR
   │
   ▼
[Infrastructure/Configuration Scanning] ──► Every change touching deployment configuration
   │
   ▼
All clear ──► Proceeds to remaining pipeline stages (Section 6.2)
```

## 8.3 Dependency Scanning

**Rule:** every dependency addition or version change is scanned against known-vulnerability databases (13-testing-strategy.md Section 24.7, 12-security-architecture.md Section 27); a Critical or High-severity known vulnerability in a new or updated dependency blocks the PR (Section 7.2's non-bypassable classification) until resolved (an upgrade, a patched version, or — rarely — an explicit, time-boxed, documented risk acceptance requiring security-team sign-off). Existing dependencies are additionally re-scanned on a recurring schedule independent of any specific PR, since a previously-safe dependency can have a new vulnerability disclosed at any time.

## 8.4 Secret Scanning

**Rule:** every commit is scanned for credential-shaped patterns (API keys, private keys, connection strings) both locally (a pre-commit hook, catching the mistake before it ever reaches GitHub) and centrally in CI (a backstop, since a pre-commit hook can be skipped locally) — restated from 15-engineering-standards.md Section 19.6 as this document's own pipeline-enforcement commitment: a detected secret blocks the pipeline immediately and triggers mandatory credential rotation, not merely removal from the diff, since the secret was exposed in version-control history the moment it was committed, regardless of whether that commit ever reached `main`.

## 8.5 Static Application Security Testing (SAST)

Automated static analysis scans the codebase for known insecure patterns (12-security-architecture.md's OWASP-aligned control set, that document's Section 29's compliance matrix) beyond what type-checking and linting already catch — findings are triaged by severity, with Critical/High findings blocking (Section 7.2) and Medium/Low findings tracked as technical debt (13-testing-strategy.md Section 27's severity-proportional process) rather than blocking indefinitely.

## 8.6 Infrastructure/Configuration Scanning

Any change to deployment configuration (environment variable schemas, RLS policy migrations per 14-infrastructure-devops-architecture.md Section 8.4, CORS/security-header configuration) receives an additional, targeted security review beyond the standard code review — since a misconfiguration here has a different, often broader blast radius than an application-logic bug, warranting the elevated scrutiny 12-security-architecture.md Section 30's review checklist already specifies.

## 8.7 Responsibilities

DevOps/Platform Engineering owns scanning-tool configuration and pipeline integration; Security (or the security-designated engineering lead, absent a dedicated security team at this platform's current size) owns triage of findings and sign-off on any documented risk acceptance; every engineer is responsible for resolving findings on their own PRs promptly rather than treating them as someone else's problem.

## 8.8 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| A dependency scan flags a vulnerability with no available patched version | The upstream maintainer hasn't released a fix yet | Assess actual exploitability in this platform's specific usage context; if genuinely low-risk given how the dependency is used, a time-boxed, documented risk acceptance (Section 8.3) with a tracked re-check ticket; if genuinely risky, find an alternative dependency |
| Secret scanning produces a false positive (a high-entropy string that isn't actually a credential) | An overly broad detection pattern | Reviewed and, if genuinely a false positive, an explicit, narrowly-scoped allowlist entry is added for that specific pattern — never a blanket disabling of secret scanning for the affected file/module |

## 8.9 Recovery Strategy

A confirmed secret leak (Section 8.4) triggers immediate credential rotation (the leaked credential is treated as compromised the instant it's detected in history, regardless of whether it reached a public repository) and a review of what that credential could have accessed, following 12-security-architecture.md's incident-response process (that document's Section 26) if the exposure window or access scope warrants it.

## 8.10 Best Practices

- Run secret scanning locally (pre-commit) as the first line of defense — catching a leaked secret before it's ever pushed is materially better than catching it in CI after it's already in the repository's history.
- Review dependency-scan findings promptly rather than letting them accumulate into a large, daunting backlog that becomes easy to deprioritize indefinitely.

## 8.11 Review Checklist

- [ ] Are all dependency, secret, SAST, and configuration scans clear for this change, with any bypass properly logged (Section 7.5)?
- [ ] Does any new dependency introduce a known Critical/High vulnerability (Section 8.3)?


---

# 9. Build Pipeline

## 9.1 Purpose

To state how a verified change becomes a concrete, deployable build artifact — the step between "tests pass" and "there is a specific, versioned thing that can be deployed."

## 9.2 Architecture

```
Source (specific Git commit, all tests/gates passed)
   │
   ▼
[Turborepo build orchestration] ── determines build order across package
   │                                 dependencies (11-frontend-architecture.md §3.3)
   ▼
[Next.js production build] ── per affected app (apps/buyer, apps/creator,
   │                            apps/internal), including Server/Client
   │                            Component boundary resolution
   ▼
[Build cache check] ── unaffected apps/packages reuse their existing cached
   │                     build rather than rebuilding (14-infrastructure-
   │                     devops-architecture.md §6.2)
   ▼
Build artifact produced, tagged with its source commit SHA (Section 23.2)
```

## 9.3 Build Reproducibility

**Rule:** a build is a pure, deterministic function of its source commit and its locked dependency versions (the committed lockfile, never a floating/unpinned dependency resolution at build time) — building the same commit twice, at different times, produces functionally identical output. This is what makes Section 16's rollback (redeploying a prior build) and Section 23's artifact management trustworthy: a rollback target is guaranteed to behave exactly as it did when it was first verified, not subject to a dependency having silently updated underneath it since.

## 9.4 Build Caching

Turborepo's remote build cache (14-infrastructure-devops-architecture.md Section 6.2) is used to avoid rebuilding apps/packages a given change doesn't affect — restated here as a build-pipeline-specific efficiency concern: this is what keeps build time roughly proportional to a change's actual footprint rather than the monorepo's total size, directly serving the fast-feedback principle (13-testing-strategy.md Section 2.5) at the build stage specifically.

## 9.5 Environment-Specific Build Configuration

**Rule:** the build artifact itself does not embed environment-specific configuration (API base URLs, feature-flag defaults) baked in at build time in a way that would require a separate build per environment — configuration is injected at runtime via environment variables (10-backend-architecture.md Section 23.1's typed `env.ts`), meaning the identical build artifact promoted through Preview → Staging → Production (Section 19) is genuinely the same artifact at every stage, differing only in which environment's configuration it reads at runtime, never in its own compiled content.

## 9.6 Responsibilities

DevOps/Platform Engineering owns the build pipeline's configuration and performance; every engineer is responsible for keeping the lockfile committed and accurate (never manually editing a lockfile by hand, always through the package manager's own update mechanism) so Section 9.3's reproducibility guarantee holds.

## 9.7 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| Build succeeds locally but fails in CI | An environment difference (a Node.js version mismatch, a case-sensitivity difference between the developer's OS and CI's Linux runners) | Standardize on CI's exact toolchain versions locally (via a version-manager configuration file committed to the repository) to eliminate this class of discrepancy at the source |
| A previously-working build suddenly fails with no source change | An unpinned or improperly-locked dependency resolved differently | Investigate the lockfile's integrity immediately; this is treated as a reproducibility-guarantee violation (Section 9.3), not a one-off flake to retry past |

## 9.8 Recovery Strategy

A reproducibility failure (Section 9.7's second scenario) is treated with the same seriousness as a flaky test (13-testing-strategy.md Section 24.5) — investigated and fixed at its root cause (typically a lockfile or dependency-resolution configuration issue), never worked around by simply retrying the build until it happens to succeed.

## 9.9 Best Practices

- Commit lockfile changes as their own reviewable diff, never silently bundled invisibly within an unrelated feature change.
- Periodically audit that local development environments match CI's toolchain versions exactly, catching drift before it causes a confusing "works on my machine" build failure.

## 9.10 Review Checklist

- [ ] Is the lockfile committed and consistent with the dependencies actually declared?
- [ ] Does the build artifact avoid baking in environment-specific configuration (Section 9.5)?

---

# 10. Test Execution Pipeline

## 10.1 Purpose

To state, at the orchestration level, when and how each of 13-testing-strategy.md's test levels actually executes within this pipeline — that document owns what each level verifies; this section owns its place and timing in the CI/CD flow.

## 10.2 Architecture

Restated and expanded from Section 6.2's pipeline diagram: Unit and Component tests (13-testing-strategy.md Sections 6–7) run first and fastest, requiring no external provisioning; Integration tests (that document's Section 8) run next, against a freshly-provisioned ephemeral database (14-infrastructure-devops-architecture.md Section 4.1's CI environment tier); API/Contract tests (Section 9 of that document) run against a running instance of the built application; the Fast E2E subset (Section 10.6 of that document) runs last, against the Preview deployment itself once it's live (Section 11), since it requires a genuinely deployed, reachable environment rather than an in-process test run.

## 10.3 Ephemeral Test Database Provisioning

**Rule:** every CI run provisions its own fresh, migrated, empty-then-fixture-seeded Postgres instance (13-testing-strategy.md Section 23.1's CI environment tier), destroyed immediately after the run — restated here as a pipeline-orchestration commitment: this is what guarantees Section 22.4 of that document's test-isolation principle holds structurally, not just by convention, since there is no persistent CI database state for one run's leftover data to contaminate another's.

## 10.4 Test Result Reporting

**Rule:** every test level's results (pass/fail counts, coverage deltas, flaky-test flags) are surfaced directly on the pull request itself, not only in a separate CI dashboard an engineer has to navigate to — a failing check is immediately visible and specifically attributable to the failing test level and test name from the PR view itself, minimizing the time between "something failed" and "an engineer understands exactly what."

## 10.5 Responsibilities

QA/SDET owns the ongoing health and strategic coverage of the test suites this pipeline executes (13-testing-strategy.md Section 27.5); DevOps/Platform Engineering owns the orchestration and provisioning (Section 10.3) that makes those suites executable reliably in CI; every engineer is responsible for their own PR's test results.

## 10.6 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| Integration tests fail because the ephemeral database didn't finish provisioning/migrating before tests started | A race condition in the CI environment's setup sequencing | Fixed as a CI-infrastructure defect (Section 22), with an explicit readiness check gating test start, not a test-level retry papering over an environment timing issue |
| The Fast E2E subset fails because the Preview deployment wasn't yet fully live when tests began | A race between deployment completion and E2E trigger timing | The E2E trigger waits on an explicit deployment-ready signal (Section 11.4) rather than a fixed delay, which would be either too short (flaky) or too long (slow) depending on load |

## 10.7 Recovery Strategy

Both scenarios in Section 10.6 are fixed by making implicit timing assumptions explicit (a readiness check, a deployment-ready webhook/signal) rather than by adding an arbitrary delay — restated from 13-testing-strategy.md Section 10.4's "no hard-coded waits" principle, applied here at the pipeline-orchestration level rather than within an individual test's own code.

## 10.8 Best Practices

- Treat any test-execution-pipeline flakiness as an environment or orchestration defect to investigate first, before assuming the test itself is at fault (Section 10.6's scenarios are both, in fact, orchestration issues, not test-logic issues).
- Keep the Fast E2E subset genuinely fast and narrowly scoped (13-testing-strategy.md Section 10.2's mandatory-journey list) — this is the one pipeline stage most tempting to over-broaden "just to be safe," which would directly undermine the standard PR feedback-loop speed this entire pipeline is designed to protect.

## 10.9 Review Checklist

- [ ] Did every applicable test level run and pass for this change's actual scope (Section 6.3's affected-package detection)?
- [ ] Is any test-execution failure attributable to environment/orchestration rather than the test or the code itself (Section 10.6)?


---

# 11. Preview Deployments

## 11.1 Purpose

To state how every pull request becomes a genuinely reachable, isolated, real deployment before it ever merges — the mechanism that lets both automated E2E tests (Section 10.2) and human reviewers/stakeholders verify a change in a real, running environment rather than trusting a description of it.

## 11.2 Architecture

Restated from 14-infrastructure-devops-architecture.md Section 4.1: every pull request automatically triggers a Vercel Preview Deployment per affected app, with its own unique, shareable URL, and — where Supabase's plan tier supports it — its own isolated database branch (that document's Section 8.6), seeded via 13-testing-strategy.md Section 22.5's dedicated seeding API, so one PR's test data can never interfere with another's concurrently-open PR.

## 11.3 Workflow

```
PR opened/updated ──► Vercel Preview Deployment triggered automatically
   │
   ▼
Database branch provisioned (if supported) + seeded (Section 11.2)
   │
   ▼
Preview URL posted as a PR comment automatically
   │
   ▼
Fast E2E subset runs against the live Preview URL (Section 10.2)
   │
   ▼
Reviewer, QA, or stakeholder manually explores the Preview URL as needed
   │
   ▼
PR merged or closed ──► Preview deployment and its database branch torn down
```

## 11.4 Deployment-Ready Signaling

**Rule:** downstream consumers of a Preview deployment (the Fast E2E subset, a human reviewer clicking the posted link) wait on an explicit "deployment ready" signal from Vercel (a webhook or status check), never a fixed delay — restated from Section 10.7 as this section's own specific implementation of that principle.

## 11.5 Access and Discoverability

Restated from 14-infrastructure-devops-architecture.md Section 4.4: a Preview URL is reachable by any team member with repository access but is not publicly indexed or discoverable — it exists specifically for internal review, not as an accidentally-public staging surface, and its third-party integrations run in sandbox/test mode exclusively (that document's Section 4.2), never live credentials.

## 11.6 Responsibilities

DevOps/Platform Engineering owns the Preview-deployment and database-branching pipeline configuration; every engineer uses their own PR's Preview URL as their first checkpoint for "does this actually work as a real, deployed system," not merely trusting a local-only test pass.

## 11.7 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| A Preview deployment fails to build | The same underlying causes as any build failure (Section 9.7), surfaced earlier and more visibly here | Fix as a standard build failure; the PR cannot proceed to review-readiness until Preview builds successfully |
| A Preview deployment's database branch fails to provision | Supabase-platform-tier or quota-related issue | DevOps/Platform Engineering investigates; in the interim, the PR can still be reviewed against a shared fallback Preview database (with the reduced isolation guarantee explicitly noted), never silently blocking all review indefinitely |

## 11.8 Recovery Strategy

A systemic Preview-deployment issue (affecting many PRs simultaneously, not just one) is escalated and fixed centrally (Section 22), never worked around per-PR.

## 11.9 Best Practices

- Use the Preview URL as a genuine pre-merge verification step, not a formality — a manual click-through of the specific change's affected screens catches issues automated tests may miss.
- Keep Preview-environment third-party credentials strictly sandbox-tier, with periodic audits (12-security-architecture.md Section 24) confirming no live credential has been accidentally configured there.

## 11.10 Review Checklist

- [ ] Did the Preview deployment build and become reachable successfully for this PR?
- [ ] Has the change been manually verified against its own Preview URL, not just against automated test results alone?

---

# 12. Database Migration Strategy

## 12.1 Purpose

To state the pipeline-level process for the one deployment component that cannot be made atomic the way application code deployment can (14-infrastructure-devops-architecture.md Section 6.4) — schema migrations require deliberate sequencing and backward-compatibility discipline to preserve zero-downtime deployment and instant-rollback guarantees end to end.

## 12.2 Architecture

```
Migration authored (Drizzle-generated, 10-backend-architecture.md §25.2)
   │
   ▼
Reviewed for backward compatibility (Section 12.3) as part of standard code review
   │
   ▼
Tested in CI against the ephemeral test database (Section 10.3), both applying
and — where a down-migration is defined — reverting (13-testing-strategy.md §14.3)
   │
   ▼
Applied to Staging (Section 19) as part of that promotion, verified there
   │
   ▼
Applied to Production via the elevated migration-scoped role
(14-infrastructure-devops-architecture.md §8.7), immediately ahead of the
corresponding application deployment being promoted to receive traffic —
never after
   │
   ▼
Application deployment promoted, now able to rely on the new schema
```

## 12.3 Backward-Compatibility Discipline

**Rule:** restated as this document's own binding pipeline gate from 10-backend-architecture.md Section 25.2: a migration must leave the schema in a state the **immediately-prior** application version still functions correctly against — additive changes (new nullable columns, new tables) are always safe within a single deployment; destructive changes (column renames, drops, type changes) are executed as a multi-step sequence spanning at least two releases (e.g., release N adds a new column and dual-writes to both old and new; release N+1, after the old column is confirmed unused, drops it) — never as a single-step operation that would break Section 16's instant-rollback guarantee for the release introducing it.

## 12.4 Migration Testing

Restated from 13-testing-strategy.md Section 14.3: every migration is tested for clean forward application against a realistic pre-migration dataset in CI (Section 12.2), and, where a down-migration is defined, for clean reversal — this pipeline stage is what makes Section 12.3's compatibility claim a *verified* property of a given migration, not merely an assumption made in review.

## 12.5 Irreversible Migration Sign-Off

**Rule:** a migration explicitly documented as irreversible (13-testing-strategy.md Section 14.4) requires explicit, named sign-off beyond standard code review before it is permitted to merge — restated here as a pipeline-enforced gate (Section 7.2): the pipeline itself checks for the irreversibility flag in the migration's metadata and blocks merge absent a recorded sign-off, rather than relying on a reviewer remembering to ask about it.

## 12.6 RLS Policy Migrations

Restated from 14-infrastructure-devops-architecture.md Section 8.4: Row-Level Security policy changes are themselves versioned migrations, travelling through this identical pipeline (never applied ad hoc through a dashboard, which would leave no change-history record and bypass Section 12.4's testing) — an RLS policy change additionally receives the elevated security review Section 8.6 of this document specifies for any deployment-configuration change.

## 12.7 Responsibilities

The engineer authoring a schema change owns writing and testing its migration (Section 12.2); a second reviewer specifically confirms backward-compatibility (Section 12.3) as an explicit code-review checklist item, not merely an assumed property; DevOps/Platform Engineering owns the migration-execution pipeline step itself and the elevated migration-scoped database role's access control.

## 12.8 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| A migration applies successfully to Staging but fails against Production | A data-shape difference between Staging's synthetic data and Production's real data (e.g., a NOT NULL constraint Staging's fixtures happened to satisfy but real data doesn't) | Migration is halted before the corresponding application deployment proceeds (Section 12.2's ordering); the migration is revised to handle the real data shape (a backfill step, a more permissive initial constraint) and re-tested |
| A migration succeeds, but the immediately-prior application version, still serving traffic during a rolling deployment, breaks against the new schema | A backward-compatibility violation missed in review (Section 12.3) | Immediate rollback of the *application* deployment (Section 16) if it has already begun; the migration itself is generally not rolled back reactively (per Section 12.3's own logic, a well-designed additive migration doesn't need to be) — this scenario is treated as a process failure in Section 12.7's review step and results in a retrospective (13-testing-strategy.md Section 27.6-style) to close the gap |

## 12.9 Recovery Strategy

A migration-related production incident follows 13-testing-strategy.md Section 27.6's incident process, with particular attention to whether Section 12.3's backward-compatibility review was performed correctly and, if not, why that review step failed to catch the issue — the fix is procedural (strengthening the review step or its tooling), not merely a one-off patch to the specific migration involved.

## 12.10 Best Practices

- Default every new column to nullable or with an explicit default value, making additive migrations trivially backward-compatible without needing a case-by-case judgment call.
- Test a migration against a data-volume and data-shape sample more representative of Production than the CI ephemeral database's minimal fixtures, specifically for any migration touching a high-volume table (08-database-design.md Section 2.1's millions-of-rows scale target), catching Section 12.8's first failure scenario before it ever reaches Staging.

## 12.11 Review Checklist

- [ ] Is this migration additive and backward-compatible within a single deployment, or correctly sequenced across multiple releases if destructive (Section 12.3)?
- [ ] Has the migration been tested for clean forward application (and reversal, if applicable) in CI (Section 12.4)?
- [ ] Does an irreversible migration have explicit, named, recorded sign-off (Section 12.5)?
- [ ] Is an RLS policy change travelling through this same versioned migration pipeline, never applied ad hoc (Section 12.6)?


---

# 13. Continuous Deployment

## 13.1 Purpose

To state the mechanics of how a merged change to `main` actually reaches Staging and Production — the automated engine behind Section 2.2's stated continuous-deployment philosophy.

## 13.2 Architecture

```
Merge to `main`
   │
   ▼
Migration execution (if applicable, Section 12.2), ahead of application deployment
   │
   ▼
Staging deployment (Tier 2/3 changes per 13-testing-strategy.md §26.3;
Tier 1 changes also deploy to Staging first, per Section 14.3)
   │
   ▼
Staging validation (Section 19.3) — full E2E suite, manual QA where the tier requires it
   │
   ▼
Release-readiness checklist (13-testing-strategy.md §29) completed
   │
   ▼
Production deployment triggered — automatic for Tier 2/3 once Staging validation
passes; gated on named human go/no-go for Tier 1 (13-testing-strategy.md §29.4)
   │
   ▼
Post-deployment verification (Section 20)
```

## 13.3 Automatic vs. Gated Promotion

**Rule:** Tier 2/3 releases (13-testing-strategy.md Section 26.3) promote from Staging to Production automatically once Staging validation passes, with no additional manual "click to deploy" step — restated from 14-infrastructure-devops-architecture.md Section 6.3's stated rationale: an additional manual step for a change that has already cleared every required gate adds friction without adding a genuine safety check. Tier 1 releases follow the identical automated pipeline up to the point of the named human sign-off (13-testing-strategy.md Section 29.4), which is the one deliberate, non-automatable checkpoint this document inserts specifically because it requires judgment a pipeline cannot exercise on its own.

## 13.4 Deployment Cadence

There is no fixed release schedule (a weekly release train, a biweekly cutoff) — restated from Section 2.2, deployment happens continuously, as changes clear the pipeline, for Tier 2/3 changes; Tier 1 changes are deployed as soon as they're ready and signed off, not batched to wait for a scheduled window, since batching a Critical-severity fix's deployment to fit an arbitrary schedule would directly work against 13-testing-strategy.md Section 27.6's incident-response urgency requirements.

## 13.5 Responsibilities

DevOps/Platform Engineering owns the deployment pipeline's automation and reliability; the named engineering lead (13-testing-strategy.md Section 29.4) owns the Tier 1 go/no-go decision itself; the on-call engineer (Section 27) owns monitoring the deployment through Section 20's post-deployment verification window.

## 13.6 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| Staging validation passes, but a genuinely new issue is found manually during the release-readiness review (13-testing-strategy.md §29.2) before Production promotion | A gap in automated coverage that manual review caught | The release is held pending resolution — this is Section 29.4's human judgment checkpoint working exactly as intended, not a process failure |
| Production promotion is triggered, but the deployment itself fails to complete on Vercel's platform | An infrastructure-level deployment failure, unrelated to the code's correctness | The deployment simply doesn't go live (Vercel's model, per 14-infrastructure-devops-architecture.md §6.4, never serves traffic from a partially-completed deployment); retried once the underlying infrastructure issue is resolved |

## 13.7 Recovery Strategy

A held Tier 1 release (Section 13.6's first scenario) returns to the standard PR/fix cycle for whatever gap was found, re-entering this same pipeline from the top once addressed — there is no shortcut that skips back to "deploy anyway," even under schedule pressure, per Section 7.5's non-bypassable-gate philosophy applied to the go/no-go decision itself.

## 13.8 Best Practices

- Trust the automated Tier 2/3 promotion path — resisting the urge to manually "double check" every routine deployment defeats the purpose of having established, gate-verified automation in the first place.
- Reserve manual scrutiny specifically for what actually warrants it (Tier 1 releases, Section 14.3), keeping the signal-to-noise ratio of human attention high.

## 13.9 Review Checklist

- [ ] Did this release follow the correct automatic-vs-gated promotion path for its actual risk tier (Section 13.3)?
- [ ] Is a Tier 1 release's go/no-go decision explicitly recorded, not merely implied by a green pipeline (13-testing-strategy.md §29.4)?

---

# 14. Release Strategy

## 14.1 Purpose

To state how release risk (13-testing-strategy.md Section 26.3) translates into concrete process weight within this pipeline — the point where that document's risk-tiering framework becomes operational, day-to-day practice.

## 14.2 Release Tiering (Restated and Operationalized)

| Tier | Trigger | Staging Required? | Full E2E Required? | Manual QA Required? | Human Sign-Off Required? |
|---|---|---|---|---|---|
| Tier 1 — Critical | Payments, Auth, Checkout, Orders, Moderation, any database migration | Yes | Yes, all browsers | Yes (13-testing-strategy.md §28.3) | Yes, named engineering lead |
| Tier 2 — Standard | Any High/Standard risk-tier module change | Yes | Yes, fast subset minimum | Abbreviated (that document's §28.6) | No — automatic promotion once gates pass |
| Tier 3 — Low-risk | Content/copy, CMS-only, low-risk-tier module | No — may promote directly, per that document's own §26.3 allowance | No | No | No |

## 14.3 Release Workflow by Tier

```
Tier 1: Merge ──► Staging ──► Full E2E (all browsers) ──► Manual QA ──►
        Release-readiness checklist ──► Named sign-off ──► Production ──►
        Elevated post-deployment verification (Section 20.3)

Tier 2: Merge ──► Staging ──► Fast E2E ──► Automated release-readiness check ──►
        Production (automatic) ──► Standard post-deployment verification

Tier 3: Merge ──► Production (automatic, Staging optional per risk assessment) ──►
        Standard post-deployment verification
```

## 14.4 Release Ownership

**Rule:** every release has one clearly identified owner — the engineer whose change is being released for a routine Tier 2/3 deployment, or the named engineering lead for a Tier 1 release (13-testing-strategy.md Section 29.4) — responsible for monitoring that specific release through Section 20's verification window and for the initial response if something goes wrong with it, before broader on-call escalation (Section 27) takes over for anything beyond the release owner's own change.

## 14.5 Release Calendar Considerations

There is no fixed release calendar (Section 13.4), but this document recognizes specific windows warranting additional caution regardless of tier: avoid initiating a Tier 1 release immediately before a period of reduced team availability (a weekend, a holiday) unless the release is itself an emergency fix for an active incident (Section 17), since the team's ability to respond quickly to an unexpected issue is reduced during those windows — restated as a judgment-based best practice (Section 14.7), not an automated gate, since a genuine emergency must never wait for a "better" calendar window.

## 14.6 Responsibilities

The release owner (Section 14.4) drives their release through this workflow; Engineering Leadership owns the tiering policy itself and resolves any ambiguous tier classification (13-testing-strategy.md Section 26.3's own stated allowance for this).

## 14.7 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| A change's correct tier is ambiguous | It touches a Critical-tier module only tangentially, or a Standard-tier module unusually deeply | Escalate to Engineering Leadership for an explicit classification decision (Section 14.6) rather than the release owner unilaterally choosing the lower-rigor path |
| A Tier 1 release is initiated immediately before a low-availability window without being an emergency | Schedule pressure overriding Section 14.5's stated caution | Engineering Leadership has standing authority to delay a non-emergency Tier 1 release to a better window, prioritizing safe incident response capacity over an arbitrary deadline |

## 14.8 Recovery Strategy

An incorrectly-tiered release discovered after the fact (e.g., a Tier 2-classified change that, in retrospect, should have been Tier 1) is treated as a process gap warranting a retrospective (13-testing-strategy.md Section 27.6-style), with the tiering criteria itself potentially refined as a result, rather than treated as a one-off misjudgment to move past without adjustment.

## 14.9 Best Practices

- When genuinely uncertain about a release's tier, default to the higher-rigor tier rather than the lower one — the cost of extra caution on a release that turns out not to have needed it is far lower than the cost of insufficient caution on one that did.
- Communicate a Tier 1 release's timing to the broader team (Support in particular, per Section 27's responsibility matrix) ahead of time, not only after something goes wrong.

## 14.10 Review Checklist

- [ ] Is this release's tier classification correct and, if ambiguous, was it explicitly resolved (Section 14.7)?
- [ ] Does the release follow its tier's complete required workflow (Section 14.3), with no step skipped?
- [ ] Is there a single, clearly identified release owner (Section 14.4)?


---

# 15. Feature Flags

## 15.1 Purpose

To state how this platform decouples *deployment* (code reaching Production, verified safe to run) from *release* (a feature becoming visible/active to users) — restated and fully operationalized here from 14-infrastructure-devops-architecture.md Section 6.8 and 10-backend-architecture.md Section 23.2's two-mechanism flag architecture.

## 15.2 The Two Flag Mechanisms, Restated

| Mechanism | Audience | Purpose | Owning Layer |
|---|---|---|---|
| `FeatureFlagAccess` (database-backed) | Backend business-logic gating | Gradual, auditable rollout of new backend capabilities to specific user/store cohorts | 08-database-design.md §6.6, resolved via the Settings & Feature Flags module (10-backend-architecture.md §5.24) |
| PostHog feature flags | Frontend-visible UI experimentation | Gradual UI rollout, A/B testing, client-side gating | 10-backend-architecture.md §19.8 |

This document's release process uses **both**, chosen per the specific change's nature (Section 15.3), never conflating the two or trying to force one mechanism to serve both purposes.

## 15.3 Flag-Gated Deployment Workflow

```
Feature developed behind a flag, defaulted OFF
   │
   ▼
Deployed to Production (Section 13) — code is live, but inactive/invisible
   │
   ▼
Flag enabled for an internal/beta cohort first (dogfooding)
   │
   ▼
Flag enabled progressively for a larger, defined percentage/cohort of real users
   │
   ▼
Monitoring (Section 21) at each expansion step before proceeding further
   │
   ▼
Flag enabled for 100% of users ──► Feature is now fully "released"
   │
   ▼
Flag and its now-dead conditional code removed in a follow-up cleanup PR
(Section 15.6)
```

## 15.4 When a Feature Flag Is Required

**Rule:** any Tier 1 release (Section 14.2) and any large or user-experience-altering Tier 2 feature ships behind a flag by default — restated as this document's own binding policy: the burden of proof is on *not* using a flag (a genuinely small, low-risk, easily-revertible-via-standard-rollback change may reasonably skip one), not on justifying its use, since flag-gated rollout is this platform's primary risk-mitigation tool for anything with meaningful user-facing consequence, complementing rather than replacing Section 16's rollback capability.

## 15.5 Flag Governance

**Rule:** every feature flag has a named owner, a stated purpose, and an expected lifetime — a flag is not created without also being tracked toward its eventual resolution (either full rollout and removal, or a decision to abandon the feature and remove the flag along with its now-unused code path). A flag living indefinitely, past its feature's full rollout, without being cleaned up (Section 15.6) is treated as its own form of technical debt (15-engineering-standards.md Section 27), accumulating conditional-logic complexity that has no ongoing purpose.

## 15.6 Flag Cleanup

**Rule:** once a flag reaches 100% rollout and has been stable for a defined observation period, its removal (deleting the flag and simplifying the now-dead conditional branch to just the "on" path) is scheduled as a tracked, prioritized follow-up — not left indefinitely as accumulating cruft. This cleanup PR is a Section 26.2-style refactor (15-engineering-standards.md) — behavior-preserving, reviewed for that property specifically, never bundled with a further behavior change.

## 15.7 Responsibilities

The feature's owning engineer/team is responsible for the flag's full lifecycle (creation, staged rollout, monitoring at each step, and eventual cleanup); Product/Engineering Leadership jointly own the rollout-percentage/cohort decisions for anything with real business-risk consequence (a pricing change, a checkout-flow alteration).

## 15.8 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| A flag-gated feature shows a problem at a partial-rollout percentage | The feature itself has a bug not caught by earlier testing, surfacing only at real-traffic scale/diversity | The flag is disabled immediately (an instant, low-risk mitigation, since disabling a flag is faster and safer than a full deployment rollback) while the underlying issue is fixed through the standard pipeline |
| A flag is left enabled at a partial percentage indefinitely, with no active rollout progression | Lost ownership/tracking (Section 15.5's governance gap) | Flagged during a periodic flag-audit (Section 15.9) and either progressed to completion or explicitly abandoned with its code path removed |

## 15.9 Recovery Strategy

Disabling a flag is this platform's fastest mitigation tool for a flag-gated feature's problem — faster than Section 16's deployment rollback, since it requires no redeployment at all, only a configuration change (10-backend-architecture.md Section 23.2's flag-resolution mechanism) — and is the first response attempted for any flag-gated issue before considering a full rollback.

## 15.10 Best Practices

- Default every new flag to OFF, requiring an explicit, deliberate action to enable it, never defaulting to ON "to save a step."
- Conduct a periodic (e.g., quarterly) audit of all active flags, identifying any that have stalled at partial rollout or outlived their purpose (Section 15.6).

## 15.11 Review Checklist

- [ ] Does this Tier 1 release, or large user-facing Tier 2 change, ship behind a feature flag (Section 15.4)?
- [ ] Does the flag have a named owner and a stated rollout/cleanup plan (Section 15.5)?
- [ ] Are any stale, fully-rolled-out flags in this area of the codebase overdue for cleanup (Section 15.6)?

---

# 16. Rollback Strategy

## 16.1 Purpose

To state, precisely and without ambiguity, how this platform reverts a problematic Production deployment — restated and fully operationalized from 14-infrastructure-devops-architecture.md Section 6.6's stated architecture into the complete decision process an on-call engineer follows during an actual incident.

## 16.2 Rollback Architecture (Restated)

**What the rule is:** a Production rollback is a traffic-reassignment operation — pointing the Production domain alias back at a prior, already-built, still-addressable Vercel deployment — never a rebuild-and-redeploy. **Why it exists:** during an incident, every second spent rebuilding is a second spent in a degraded state; instant alias reassignment reduces recovery time to seconds rather than the minutes a fresh build-and-deploy cycle would require. **How it's verified safe in advance:** every deployment's rollback safety is confirmed *before* that deployment happens (13-testing-strategy.md Section 30.3), specifically checking that the prior deployment would still function correctly against the current (possibly since-migrated) database schema — this is why Section 12.3's backward-compatibility discipline is treated as load-bearing for rollback, not merely a migration best practice in isolation.

## 16.3 Rollback Decision Tree

```
Production issue detected
   │
   ▼
Is this a flag-gated feature's problem, isolated to that flag?
   │
   YES ──► Disable the flag (Section 15.9) — fastest mitigation, no rollback needed
   │
   NO — is the issue caused by the most recent deployment specifically?
          │
          YES ──► Is the prior deployment confirmed rollback-safe
          │        against the current schema (Section 16.2)?
          │           │
          │           YES ──► Roll back immediately (traffic reassignment)
          │           │
          │           NO ──► Rollback would itself break the platform;
          │                   forward-fix via the hotfix process (Section 17)
          │                   is the only safe path
          ▼
NO (issue isn't deployment-related — a third-party outage, an infrastructure
issue) ──► Rollback would not help; address via Section 17's incident process
           at the actual root cause (12-security-architecture.md §26)
```

## 16.4 Rollback Execution

**Rule:** rollback is executed by the on-call engineer (Section 27) immediately upon confirming the decision tree (Section 16.3) points to it — restated as a binding urgency standard: rollback is not held pending a lengthy approval process during an active incident; the on-call engineer has standing authority to execute it, with the Incident Commander (for a SEV-1/2 incident, 12-security-architecture.md Section 26.3) informed as part of the incident response, not asked for prior permission that would delay recovery.

## 16.5 Post-Rollback Actions

A rollback is never the end of the process — it is the immediate mitigation. Following it: the underlying issue is root-caused via the standard incident-review process (13-testing-strategy.md Section 27.6), a regression test reproducing the issue is written (that document's Section 27.4), and the fix re-enters the standard pipeline (Section 6) from the top, including a fresh Preview deployment and full gate re-verification — a fix is never redeployed by simply "trying again" with the same problematic deployment; it goes through the complete pipeline as a new, distinct change.

## 16.6 Responsibilities

The on-call engineer (Section 27) owns the rollback decision and its execution for a routine incident; the Incident Commander owns overall incident coordination for a SEV-1/2 event, per 12-security-architecture.md Section 26.3; DevOps/Platform Engineering owns the rollback mechanism's own reliability (ensuring the "instant" alias-reassignment capability actually is instant and reliably available).

## 16.7 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| Rollback is attempted, but the prior deployment is found to not actually function correctly against the current schema | A backward-compatibility gap in Section 12.3's discipline was missed | Rollback is aborted before causing further harm; forward-fix via the hotfix process (Section 17) is the only remaining safe path — this is exactly the scenario Section 13-testing-strategy.md §30.3's pre-deployment rollback verification exists to catch *before* it's ever discovered this way |
| A rollback resolves the immediate symptom, but the underlying cause recurs because the root-cause fix (Section 16.5) was never completed | Post-rollback follow-through was not tracked and fell through | Treated as an incident-process gap (13-testing-strategy.md §27.6) — every rollback has a mandatory, tracked follow-up fix, never left as "handled" once the symptom subsides |

## 16.8 Recovery Strategy

A rollback that is itself found to be unsafe (Section 16.7's first scenario) escalates immediately to the Incident Commander and triggers the hotfix process (Section 17) as the primary recovery path, with the specific backward-compatibility gap that made rollback unsafe logged as its own follow-up item to prevent recurrence.

## 16.9 Best Practices

- Verify rollback safety as a standing, automatic pre-deployment check (13-testing-strategy.md Section 30.3), never as a manual step remembered only when someone thinks to ask.
- Treat every rollback as an incident-worthy event deserving a genuine root-cause review (Section 16.5), even if the rollback itself resolved the symptom quickly and the immediate pressure is gone.

## 16.10 Review Checklist

- [ ] Was rollback safety confirmed for this deployment before it went live (Section 16.2)?
- [ ] Following any rollback, is there a tracked, owned follow-up fix in progress (Section 16.5)?


---

# 17. Hotfix Process

## 17.1 Purpose

To state the expedited — but never shortcut-taking — path for a Critical-severity production issue (13-testing-strategy.md Section 27.2) requiring a fix faster than the standard pipeline's normal (already fast) cadence would deliver one, restated and fully specified from this document's Section 4.2's `hotfix/*` branch type.

## 17.2 What Qualifies as a Hotfix

**Rule:** only a Critical-severity issue (13-testing-strategy.md Section 27.2's definition — data loss/corruption, financial miscalculation, a security vulnerability, or complete inability to complete a core journey for any user) qualifies for this expedited path; a High-severity issue, while urgent, follows the standard pipeline (Section 6) at its normal — already fast — cadence, not this compressed one. This distinction is deliberately strict: over-using the hotfix path for merely-urgent-but-not-Critical issues would erode the specific extra caution this path's compression makes necessary.

## 17.3 Hotfix Workflow

```
Critical issue confirmed (13-testing-strategy.md §27.2/27.6)
   │
   ▼
`hotfix/*` branch created directly off `main`
   │
   ▼
Fix implemented WITH a regression test (13-testing-strategy.md §27.4 —
never skipped, even under time pressure)
   │
   ▼
Expedited review: a single senior engineer's review, in real time/synchronously
(a phone/video call or in-person, not an asynchronous queue), replacing the
standard review-turnaround expectation (15-engineering-standards.md §25.5)
with immediacy, but NOT replacing the review itself
   │
   ▼
Full CI pipeline still runs in full (Section 6) — no gate is skipped
(Section 7.5's non-bypassable classification applies identically here)
   │
   ▼
Preview deployment verified (compressed timeline, same rigor)
   │
   ▼
Direct promotion through Staging (compressed validation — the mandatory
Section 10.2 journeys most relevant to the specific fix, not necessarily
the full nightly cross-browser suite) ──► Production
   │
   ▼
Elevated post-deployment verification (Section 20.3) with continuous
on-call monitoring through the observation window
```

## 17.4 What Is Compressed, and What Is Not

| Compressed (Time, Not Rigor) | Never Skipped |
|---|---|
| Review turnaround (synchronous instead of asynchronous, Section 17.3) | Code review itself (still required, still by a senior engineer) |
| Staging validation scope (the specific relevant journeys, not the full nightly matrix) | A regression test for the fix (13-testing-strategy.md §27.4) |
| Time between merge and Production (immediate, not waiting for a batch) | Every CI quality gate (Section 7.2) |
| Formal release-calendar considerations (Section 14.5 — an emergency overrides calendar caution) | Post-deployment verification (Section 20), if anything performed with *more* scrutiny than usual |

## 17.5 Emergency Release Authorization

**Rule:** a hotfix requires authorization from a designated senior engineer or engineering lead before merge — restated identically from 12-security-architecture.md Section 26.6's bypass-procedure discipline: this is not a unilateral individual decision, even under Critical-severity time pressure, precisely because the compressed timeline (Section 17.4) makes the authorizing engineer's own judgment the primary safeguard replacing the time a standard release's slower cadence would otherwise provide for catching a problem.

## 17.6 Responsibilities

The engineer identifying/fixing the Critical issue drives the hotfix; the authorizing senior engineer/lead (Section 17.5) provides expedited review and sign-off; the on-call engineer (Section 27) monitors the deployment through and beyond the standard verification window, given the elevated risk profile of a compressed-timeline release.

## 17.7 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| The hotfix itself introduces a new issue | The compressed timeline, despite every gate still running, carries inherently more risk than a standard release's fuller validation window | Roll back immediately (Section 16) — a hotfix's own rollback safety is verified with the same rigor as any other deployment (Section 16.2), never assumed exempt from that check due to its urgency |
| A "hotfix" is proposed for an issue that, on reflection, isn't actually Critical-severity | Pressure to treat urgency as severity | The authorizing engineer (Section 17.5) is responsible for this classification check specifically, redirecting a non-Critical issue to the standard pipeline even if that's a harder conversation in the moment |

## 17.8 Recovery Strategy

A hotfix that itself requires rollback follows Section 16's identical rollback process — there is no separate, different rollback mechanism for a hotfix; its heightened risk is managed by Section 17.4's preserved rigor and Section 17.6's elevated monitoring, not by a different recovery mechanism.

## 17.9 Best Practices

- Resist the pressure to skip the regression test "just this once" under Critical-severity urgency — restated as this section's single most important standing reminder, since this is precisely the moment that discipline is both hardest to maintain and most valuable.
- Debrief every hotfix afterward (13-testing-strategy.md Section 27.6's incident-review process), specifically examining whether the issue could have been caught earlier in the standard pipeline, closing that gap for next time.

## 17.10 Review Checklist

- [ ] Does this issue genuinely meet the Critical-severity bar for the hotfix path (Section 17.2)?
- [ ] Did every CI gate still run in full, with only timeline/turnaround compressed (Section 17.4)?
- [ ] Is there a named, recorded authorizing engineer (Section 17.5)?
- [ ] Does the fix include a regression test (Section 17.4)?

---

# 18. Release Management

## 18.1 Purpose

To consolidate the end-to-end release-coordination responsibilities this document has built toward across Sections 6–17 into the practical, checklist-driven process a release owner (Section 14.4) actually executes.

## 18.2 Release Management Workflow

```
Change(s) merged to `main` ──► Tier classified (Section 14.2)
   │
   ▼
Release owner identified (Section 14.4)
   │
   ▼
Staging promotion + validation (Section 19)
   │
   ▼
Release-readiness checklist (Section 18.6) completed
   │
   ▼
Production promotion (automatic or gated, per tier, Section 13.3)
   │
   ▼
Post-deployment verification (Section 20)
   │
   ▼
Release communicated (Section 18.5) ──► Release closed out, metrics recorded (Section 21)
```

## 18.3 Release Notes and Communication

**Rule:** every Tier 1 release, and any Tier 2 release with user-visible impact, has release notes stating what changed, why, and any known follow-up work — communicated to the broader team (Support in particular, per Section 27's responsibility matrix, since Support needs to accurately answer buyer/creator questions about a change they weren't personally involved in building) before or immediately upon deployment, never discovered after the fact from an unexpected user report.

## 18.4 Release Grouping

**Rule:** while individual changes deploy continuously (Section 13.4), a release owner may reasonably group several small, related, already-merged changes into one coordinated Staging-validation-and-Production-promotion cycle where doing so makes more sense than promoting each in complete isolation (e.g., several small fixes to the same feature area) — this is a scheduling convenience for the release owner, not a return to batched-release philosophy (Section 2.3); each individual change within the group still passed its own full CI pipeline independently before being eligible for grouping.

## 18.5 Stakeholder Communication

Restated from Section 18.3 with its own explicit responsibility: the release owner (or, for Tier 1, the named engineering lead) ensures Support and, where relevant, Product/Founders are aware of a release's timing and content proportional to its potential visibility/impact — a Tier 3 copy fix needs no such communication; a Tier 1 checkout change does, every time.

## 18.6 Release-Readiness Checklist (Cross-Reference and Pipeline-Specific Additions)

Fully specified in 13-testing-strategy.md Section 29.2; this document adds the following pipeline-specific items, checked as part of the same consolidated process:

- [ ] Every constituent change's CI pipeline (Section 6) passed in full, with no unresolved bypass.
- [ ] Any database migration in this release has confirmed backward-compatibility and rollback safety (Section 12.3, 16.2).
- [ ] Any feature flag introduced by this release has a named owner and rollout plan (Section 15.5).
- [ ] Release notes and stakeholder communication are prepared (Sections 18.3, 18.5), for any release above Tier 3.

## 18.7 Responsibilities

The release owner (Section 14.4) drives the entire workflow (Section 18.2) and completes the checklist (Section 18.6); DevOps/Platform Engineering supports the pipeline mechanics; Support is a required communication recipient, not merely an optional courtesy, for anything above Tier 3.

## 18.8 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| A release proceeds without required stakeholder communication | Process step skipped under time pressure or oversight | Treated as a process gap; communicated retroactively and immediately upon discovery, with the release-readiness checklist (Section 18.6) reinforced as the mechanism that should have caught this |
| Grouped releases (Section 18.4) make it harder to isolate which specific change caused an issue | Overly broad grouping | Favor smaller, more isolable groupings going forward; this is a judgment call the release owner recalibrates based on this kind of experience, not a hard rule violation |

## 18.9 Recovery Strategy

A miscommunicated or under-communicated release is corrected by immediate, direct outreach to the affected stakeholders (Support especially) as soon as the gap is noticed, with the release-readiness checklist (Section 18.6) treated as the standing preventive control going forward.

## 18.10 Best Practices

- Default to over-communicating a release's timing and content to Support rather than under-communicating — the cost of a redundant heads-up is far lower than the cost of Support being blindsided by a buyer/creator question about a change they didn't know happened.
- Keep release grouping (Section 18.4) modest — group only genuinely related changes, resisting the temptation to bundle unrelated work merely because they happened to merge around the same time.

## 18.11 Review Checklist

- [ ] Is the release-readiness checklist (Section 18.6) fully completed and on record?
- [ ] Has stakeholder communication (Section 18.5) occurred proportional to this release's actual visibility/impact?


---

# 19. Environment Promotion

## 19.1 Purpose

To state, precisely, how a specific build artifact moves through 14-infrastructure-devops-architecture.md Section 4's environment tiers — the pipeline-process view of that document's infrastructure-provisioning view.

## 19.2 Promotion Diagram (Restated and Extended)

```
Local Development
      │  (git push)
      ▼
Preview Deployment ──► Fast CI subset + Fast E2E subset (Sections 6, 10)
      │  (PR approved + merged, Section 5)
      ▼
Staging Deployment ──► Full E2E suite + tier-appropriate manual QA (Section 19.3)
      │  (Release-readiness checklist passed, Section 18.6)
      ▼
Production Deployment ──► Post-deployment verification (Section 20)
```

**Rule, restated as this document's own binding commitment:** no environment is ever skipped for a standard release. A change reaches Production only after Preview and — for anything above Tier 3 — Staging. Tier 3 changes may promote directly from Preview's validation to Production per 13-testing-strategy.md Section 26.3's own stated allowance, but this is a deliberate, documented exception for genuinely low-risk changes, never a default shortcut applied indiscriminately.

## 19.3 Staging Validation Requirements by Tier

| Tier | Staging Activities Required |
|---|---|
| Tier 1 | Full cross-browser E2E suite (13-testing-strategy.md §10.6), complete manual QA checklist (§28.3), manual payment verification if Payments-touching (§28.5) |
| Tier 2 | Fast E2E subset at minimum, abbreviated manual QA scoped to the actual changed area (§28.6) |
| Tier 3 | Standard CI gates only; Staging may be skipped entirely per §26.3's allowance |

## 19.4 Artifact Identity Across Environments

**Rule:** restated from Section 9.3/9.5: the identical build artifact is promoted from Preview through Staging to Production — Staging is never a rebuild from a slightly-different branch state, and Production is never a rebuild of what was validated in Staging. This is what makes Staging validation genuinely predictive of Production behavior (13-testing-strategy.md Section 23.2's environment-parity principle) — the *only* things that legitimately differ between what ran in Staging and what runs in Production are runtime environment variables (Section 9.5) and third-party service mode (sandbox vs. live, 13-testing-strategy.md Section 23.3), never the compiled application code itself.

## 19.5 Responsibilities

The release owner (Section 14.4) drives promotion through each environment per Section 19.3's tier-appropriate requirements; QA owns Staging validation execution (13-testing-strategy.md Section 28); DevOps/Platform Engineering owns the promotion mechanism's technical reliability.

## 19.6 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| A change behaves differently in Staging than in Preview | A genuine environment-parity gap (13-testing-strategy.md §23.2's intentional differences — sandbox-mode third-party services, synthetic data — manifesting unexpectedly) | Investigated as a parity issue; if the difference reveals a real bug, fixed through the standard pipeline; if it's an accepted, documented environment difference, the manual QA process (§28) is the appropriate place to have caught it, and its absence/inadequacy for this specific scenario is reviewed |
| A change passes Staging but fails identically-configured Production behavior | A live-vs-sandbox third-party configuration difference (13-testing-strategy.md §23.3) not caught by sandbox-mode testing | This is precisely the class of issue Section 20.4's live-integration post-deployment verification exists to catch — treated as expected residual risk this specific check is designed for, not a process failure if caught there |

## 19.7 Recovery Strategy

An environment-parity-driven issue discovered in Staging is fixed before Production promotion proceeds (Staging validation exists specifically to catch it there); one discovered only in Production is handled via Section 16's rollback/Section 17's hotfix process as appropriate to its severity.

## 19.8 Best Practices

- Treat any Staging-vs-Preview or Staging-vs-Production behavioral discrepancy as worth root-causing, not dismissing as environmental noise — per 13-testing-strategy.md Section 23.5's identical stated discipline.
- Keep Staging's periodic reset cadence (that document's Section 23.4) frequent enough that accumulated test-generated data never itself becomes a source of Staging-specific behavior divergence from a freshly-seeded Production-like state.

## 19.9 Review Checklist

- [ ] Did this release complete the correct Staging validation activities for its tier (Section 19.3)?
- [ ] Is the artifact being promoted to Production identical to what was validated in Staging (Section 19.4)?

---

# 20. Deployment Verification

## 20.1 Purpose

To state what confirms a deployment succeeded — not merely that it completed without a build/deploy-tooling error, but that it is genuinely working correctly under real conditions, restated and fully operationalized from 13-testing-strategy.md Section 30's production-verification framework.

## 20.2 Verification Workflow

```
Deployment completes (traffic cut over, Section 6.4 of the infrastructure doc)
   │
   ▼
[Automated Smoke Test] ── health endpoints, representative reads succeed
   │                       (13-testing-strategy.md §24.2), under one minute
   ▼
[Error-Rate Baseline Check] ── Sentry error rate at or below pre-deployment
   │                            baseline for a defined observation window
   ▼
[Core Web Vitals Check] ── real-user-monitoring data within target (13-
   │                        testing-strategy.md §13.3), for the observation window
   ▼
[Tier-Specific Additional Checks] (Section 20.3)
   │
   ▼
Deployment declared stable ──► Release closed out (Section 18.2)
```

## 20.3 Tier-Specific Verification

| Tier | Additional Verification Beyond Section 20.2's Baseline |
|---|---|
| Tier 1 | Manual live-integration verification for Payments-touching releases (13-testing-strategy.md §28.5, §30.4) — a real, minimal-value transaction against the live Razorpay integration; explicit confirmation of the first post-deployment execution of any touched background job (§30.2) |
| Tier 2 | Standard baseline (Section 20.2); no additional live-transaction verification unless the specific change touches a live third-party configuration |
| Tier 3 | Standard baseline only |

## 20.4 Live Third-Party Integration Verification

Restated from 13-testing-strategy.md Section 30.4 as this document's own binding rule: any release touching Payments performs a real, minimal-value transaction against the live Razorpay integration immediately post-deployment — this is the single check in the entire pipeline that deliberately uses real money movement, specifically because it's the only way to catch a live-credential or live-webhook-configuration error that sandbox testing (Section 8 of that document) structurally cannot reveal.

## 20.5 Observation Window

**Rule:** a deployment is not considered "done" the instant it completes — it remains under active monitoring for a defined observation window (13-testing-strategy.md Section 30.2's stated 30–60 minute baseline, extended for Tier 1 releases per that section's own tier-proportional judgment) before being declared stable, during which the release owner or on-call engineer (Section 27) actively watches Section 21's monitoring signals rather than considering their responsibility discharged the moment the deployment tool reports success.

## 20.6 Responsibilities

The release owner (Section 14.4) or on-call engineer executes and confirms Section 20.2's verification workflow; DevOps/Platform Engineering owns the automated smoke-test and monitoring-baseline tooling itself; QA owns Section 20.3's manual live-integration verification for Tier 1 Payments releases.

## 20.7 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| The automated smoke test fails immediately post-deployment | A fundamental deployment/configuration issue | Rollback consideration (Section 16.3) begins immediately, before the observation window even completes — a failed smoke test is treated as an immediate, high-confidence signal, not one requiring further confirmation first |
| Error rate creeps upward during the observation window, but no single obvious cause is apparent | A subtle regression not caught by pre-deployment testing | Investigated in real time during the observation window itself; if the correlation to this specific deployment strengthens, rollback proceeds per Section 16.3 rather than waiting for definitive proof before acting |

## 20.8 Recovery Strategy

Any Section 20.7 failure scenario feeds directly into Section 16's rollback decision tree — deployment verification and rollback strategy are two halves of one continuous process, not independent concerns; verification exists specifically to trigger rollback promptly when warranted, not merely to produce a passive report after the fact.

## 20.9 Best Practices

- Watch monitoring actively during the observation window, not passively — a dashboard nobody is looking at during the exact window it matters most provides no actual safety benefit.
- For Tier 1 releases specifically, extend the observation window's attentiveness beyond the stated minimum whenever the release owner's own judgment suggests residual uncertainty, rather than mechanically closing out the window the instant the stated minimum elapses.

## 20.10 Review Checklist

- [ ] Did this deployment complete the full verification workflow (Section 20.2) appropriate to its tier (Section 20.3)?
- [ ] For a Payments-touching release, was live-integration verification (Section 20.4) performed and confirmed successful?
- [ ] Was the deployment actively monitored through its full observation window (Section 20.5) before being declared stable?


---

# 21. Monitoring During Releases

## 21.1 Purpose

To state what signals are watched specifically around a release event (as distinct from steady-state platform monitoring, owned by 14-infrastructure-devops-architecture.md Section 16) and how those signals feed the verification/rollback decisions Sections 16 and 20 describe.

## 21.2 Release-Specific Monitoring Signals

| Signal | Source | What It Indicates |
|---|---|---|
| Error rate (by endpoint, by severity) | Sentry (10-backend-architecture.md §19.6) | A regression's most direct, fastest signal |
| Core Web Vitals (real-user monitoring) | PostHog / Lighthouse CI (13-testing-strategy.md §13.3) | A frontend performance regression |
| API p95/p99 latency | OpenTelemetry traces (10-backend-architecture.md §19.2–19.3) | A backend performance regression, often tied to a new query or an N+1 introduced despite Section 6's gates |
| Business metrics (order-placement rate, checkout-completion rate) | Analytics module (08-database-design.md §21) | A silent functional regression that doesn't manifest as an explicit error (e.g., a checkout step subtly broken but not throwing) |
| Background job success/failure rate | Inngest dashboards (10-backend-architecture.md §12) | A regression in an asynchronous path not visible in synchronous request monitoring at all |

## 21.3 Deployment Markers

**Rule:** every deployment is marked as a discrete, timestamped event within the observability stack (10-backend-architecture.md Section 19.3's tracing infrastructure, extended here) — every dashboard tracking Section 21.2's signals displays deployment markers overlaid on its timeline, so a metric shift can be visually and immediately correlated to a specific deployment rather than requiring a separate, manual cross-reference against a deployment log.

## 21.4 Pipeline Health Metrics (Distinct from Release Monitoring)

Beyond monitoring a specific release's real-world impact (Section 21.2), the pipeline's own health is tracked as its own concern: CI execution time trend (13-testing-strategy.md §31.3), flaky-test count (§31.5), deployment frequency and lead time (a standard DevOps performance indicator, tracked here to confirm Section 2.2's continuous-deployment philosophy is actually being realized in practice, not just stated as an intention), and rollback frequency (a rising trend here is itself a signal worth investigating — restated from Section 16.9 — regardless of how quickly each individual rollback was executed).

## 21.5 Responsibilities

The release owner/on-call engineer actively watches Section 21.2's signals during a release's observation window (Section 20.5); DevOps/Platform Engineering owns Section 21.4's pipeline-health metrics and reviews them on a recurring cadence independent of any single release.

## 21.6 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| A release-specific signal (Section 21.2) is difficult to distinguish from normal traffic-pattern noise | Insufficient baseline/statistical rigor in what counts as "a meaningful deviation" | Investigated and, if a genuine gap, the alerting thresholds are recalibrated based on a clearer statistical baseline, rather than each release requiring an ad hoc judgment call about what's "normal" |
| Pipeline-health metrics (Section 21.4) show a slow, sustained degradation (rising CI time, rising flaky-test count) with no single release responsible | Gradual, accumulated technical debt in the test suite or CI infrastructure itself | Addressed as its own tracked initiative (13-testing-strategy.md §27's technical-debt-management process), not attributed to or blocked on any individual release |

## 21.7 Recovery Strategy

A release-specific signal correlated with high confidence to a specific deployment feeds directly into Section 16's rollback decision; a pipeline-health degradation (Section 21.4) is addressed through dedicated, protected debt-reduction capacity (13-testing-strategy.md §27.5), not through any single release's process.

## 21.8 Best Practices

- Establish each Section 21.2 signal's normal baseline range before relying on it during a release's observation window — an engineer watching a dashboard for the first time during an incident, with no sense of what's "normal," is poorly positioned to distinguish a real regression from ordinary variance.
- Review Section 21.4's pipeline-health metrics on a fixed recurring cadence (e.g., monthly), independent of any specific release, so slow degradation is caught proactively rather than only when it becomes severe enough to be undeniable.

## 21.9 Review Checklist

- [ ] Are deployment markers correctly visible on every relevant monitoring dashboard (Section 21.3)?
- [ ] Is pipeline health (Section 21.4) trending acceptably, independent of any single release's outcome?

---

# 22. Pipeline Failure Handling

## 22.1 Purpose

To state, comprehensively, what happens when the pipeline itself — not the code it's verifying — is the thing that's broken: a CI infrastructure outage, a broken shared test fixture, a Vercel platform incident affecting deployment itself.

## 22.2 Failure Categories

| Category | Example | Primary Owner |
|---|---|---|
| CI infrastructure failure | GitHub Actions (or equivalent) runners unavailable/degraded | DevOps/Platform Engineering |
| Shared test/fixture failure | A shared fixture-factory (13-testing-strategy.md §22.2) has a bug affecting many unrelated tests simultaneously | The engineer/team owning the affected module, escalated broadly given the wide blast radius |
| Deployment platform failure | Vercel platform-level incident preventing builds/deployments | DevOps/Platform Engineering, tracking the vendor's own incident status |
| Third-party dependency failure in CI | A package registry outage preventing dependency installation | DevOps/Platform Engineering, with a documented fallback (a cached/mirrored registry, Section 22.6) |

## 22.3 Failure Detection

**Rule:** a platform-wide pipeline failure (affecting multiple, unrelated PRs simultaneously) is detected and escalated as its own incident (12-security-architecture.md Section 26's incident process, applied here to pipeline infrastructure rather than only production systems) rather than each affected engineer independently investigating and reporting the same underlying issue in isolation.

## 22.4 Communication During a Pipeline Outage

**Rule:** a confirmed platform-wide pipeline failure is communicated to the whole engineering team promptly (a status update through whatever the team's standard incident-communication channel is), specifically to prevent every individual engineer from independently spending time diagnosing what is already a known, being-worked issue.

## 22.5 Development Continuity During a Pipeline Outage

**Rule:** engineers continue local development and code review during a CI outage — work does not stop, only merging (since merging requires the pipeline's gates to have actually run, Section 4.4's branch protection). A queue of review-approved, CI-blocked pull requests accumulates safely and is processed once the pipeline is restored, rather than being merged with gates skipped under the pressure of the outage (Section 7.5's non-bypassable classification holds even during a pipeline outage — the correct response to "the gate can't run" is "wait for it to be able to run," never "skip it").

## 22.6 Dependency/Registry Fallback

Where feasible, a cached or mirrored copy of critical build dependencies (14-infrastructure-devops-architecture.md's third-party service inventory, Section 23 of that document) reduces this platform's exposure to a single upstream package registry's own outage — a deliberate, modest redundancy investment given how directly a build-dependency outage would otherwise halt the entire pipeline.

## 22.7 Responsibilities

DevOps/Platform Engineering owns detection, communication, and resolution of pipeline-infrastructure failures (Section 22.2's first, third, and fourth categories); the owning engineer/team handles a shared-fixture failure (Section 22.2's second category) with the same urgency as any other widely-blast-radius bug.

## 22.8 Failure Scenarios (Recursive Note)

This section is itself about failure scenarios; its own "failure scenario" is a failure in detecting or communicating a pipeline outage promptly (Sections 22.3–22.4) — mitigated by automated alerting on pipeline-wide failure-rate spikes (a metric feeding Section 21.4) rather than relying solely on individual engineers noticing and reporting a pattern manually.

## 22.9 Recovery Strategy

Once a pipeline-infrastructure failure is resolved, the queue of blocked pull requests (Section 22.5) is processed through the pipeline in the normal order — no expedited or bulk-bypass mechanism is introduced to "catch up" faster, since doing so would reintroduce exactly the gate-skipping risk Section 22.5 explicitly rejects.

## 22.10 Best Practices

- Invest in pipeline redundancy (Section 22.6) proportional to how disruptive a given failure category would actually be — a build-dependency registry outage halting every single PR's pipeline is a high-blast-radius risk worth proactive mitigation.
- Treat a pipeline outage's resolution time as its own tracked metric (Section 21.4), since a slow-to-resolve pipeline failure has a compounding cost across every engineer waiting on it.

## 22.11 Review Checklist

- [ ] Was a platform-wide pipeline failure detected and communicated promptly (Sections 22.3–22.4)?
- [ ] Did the queue of blocked PRs process through the pipeline normally once restored, with no gate-skipping shortcut taken (Section 22.9)?


---

# 23. Artifact Management

## 23.1 Purpose

To state how build artifacts (Section 9) are identified, stored, and retained — the mechanism that makes Section 16's instant rollback and Section 19's environment promotion both possible in practice, not just in principle.

## 23.2 Artifact Identity

**Rule:** every build artifact is uniquely and permanently identified by its source Git commit SHA (never a mutable tag like "latest") — restated from Section 9.2: a Vercel deployment's own identifier is directly traceable back to the exact commit that produced it, giving Section 26's audit trail an unambiguous, non-reconstructed link from "what's running in Production right now" to "the exact reviewed, tested source code that produced it."

## 23.3 Artifact Retention

**Rule:** prior Production deployments remain addressable (not deleted or garbage-collected) for a defined minimum retention window (long enough to cover any realistic rollback scenario, per Section 16.2, plus a safety margin) — Vercel's own deployment-retention model (14-infrastructure-devops-architecture.md's deployment architecture) is relied upon here rather than the platform building a separate, redundant artifact-storage system, since duplicating what the deployment platform already provides natively would add operational complexity without a corresponding benefit.

## 23.4 Promotion Without Rebuilding

Restated as this section's own explicit commitment, cross-referencing Section 19.4: promoting an artifact from Staging to Production is a promotion of the *identical* build, never a fresh build triggered by the promotion event itself — this is what makes Section 19.4's environment-parity guarantee actually true in practice rather than merely claimed.

## 23.5 Responsibilities

DevOps/Platform Engineering owns the artifact-retention configuration and periodically confirms (as part of Section 16's rollback-readiness verification, applied here as an infrastructure-level check) that a rollback target from within the retention window is genuinely still addressable and functional.

## 23.6 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| A rollback is attempted against a deployment that has already been garbage-collected past the retention window | The retention window was shorter than the time elapsed since that deployment, or a rare platform-level retention bug | Rebuild from the specific commit SHA (Section 23.2) as a fallback — slower than an instant rollback, but still fully reproducible (Section 9.3's guarantee) and far better than no recovery path at all |

## 23.7 Recovery Strategy

If Section 23.6's fallback rebuild-from-commit path is ever actually needed, the retention window itself is reviewed and, if the incident revealed it to be too short for realistic incident-response timelines, extended — treated as a process gap to close, not accepted as a one-off inconvenience.

## 23.8 Best Practices

- Confirm the retention window comfortably exceeds any realistic "how long ago did we deploy the thing we might need to roll back to" scenario, informed by actual observed release cadence (Section 21.4's deployment-frequency metric).

## 23.9 Review Checklist

- [ ] Is every deployed artifact traceable to an exact, immutable commit SHA (Section 23.2)?
- [ ] Does the retention window comfortably cover realistic rollback scenarios (Section 23.8)?

---

# 24. Versioning Strategy

## 24.1 Purpose

To state how this platform version-identifies its releases — distinct from, but related to, the API's own versioning (09-api-architecture.md Section 25, which governs the *contract's* version, not the application's own release version).

## 24.2 Semantic Versioning for Shared Packages

**Rule:** every `packages/*` shared package (11-frontend-architecture.md) follows Semantic Versioning (`MAJOR.MINOR.PATCH`) for its own internal consumption within the monorepo — a breaking change to a shared package's public interface (15-engineering-standards.md Section 6.2) increments its major version, a backward-compatible addition increments minor, a fix increments patch. This is primarily a monorepo-internal discipline (Turborepo's dependency graph, 11-frontend-architecture.md Section 3.3, uses this to determine safe update propagation) rather than a public-facing versioning scheme, since these packages are not independently published outside this repository.

## 24.3 Application Release Identification

**Rule:** the three deployable apps (`apps/buyer`, `apps/creator`, `apps/internal`) are **not** independently semantically versioned in the traditional sense (there is no meaningful "v2.3.1 of the Buyer App" a user needs to know) — each deployment is identified by its commit SHA (Section 23.2) and, for human-readable release communication (Section 18.3), an optional date-based or incrementing release identifier (e.g., `2026.07.23-1`) used purely for communication clarity, never as a technical dependency-resolution mechanism the way Section 24.2's package versions are.

## 24.4 API Versioning (Cross-Reference)

Fully owned by 09-api-architecture.md Section 25 — this document's release process does not introduce a separate API-versioning scheme; a new API major version, when it eventually happens, is itself simply a Tier 1-classified release (Section 14.2) following this document's standard process, with that document's own additive-vs-breaking discipline (its Section 1.6) determining whether a given change even requires one.

## 24.5 Release Tagging

**Rule:** every Production deployment is tagged in the Git repository (a lightweight Git tag pointing at the deployed commit, named per Section 24.3's human-readable identifier) — this is what lets Section 26's audit trail and Section 18.3's release notes reference a specific release unambiguously in conversation and documentation, distinct from (but derived from) the underlying commit SHA identity Section 23.2 already guarantees.

## 24.6 Versioning Table

| What | Versioning Scheme | Purpose |
|---|---|---|
| Shared `packages/*` | Semantic Versioning | Monorepo-internal dependency-safety signaling (Section 24.2) |
| Application deployments (`apps/*`) | Commit SHA + human-readable release tag | Traceability and human communication (Sections 23.2, 24.3, 24.5) |
| Public API (09-api-architecture.md) | Path-based major version (`v1`, future `v2`) | External contract stability for API consumers (that document's Section 25) |
| Database schema | Sequential Drizzle migration history (10-backend-architecture.md §25.2) | Ordered, auditable schema evolution, not a standalone "version number" |

## 24.7 Responsibilities

Every engineer follows Section 24.2's SemVer discipline when modifying a shared package's public interface; DevOps/Platform Engineering owns the automated release-tagging mechanism (Section 24.5).

## 24.8 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| A shared package's breaking change is released as a minor/patch version bump | A SemVer-discipline lapse | Caught by 15-engineering-standards.md's code-review checklist for that package; corrected before the dependent apps update to consume it |
| Confusion arises about "which version is in Production" during an incident | Reliance on a human-readable tag alone without cross-checking the actual deployed commit SHA | The commit SHA (Section 23.2) is always the authoritative answer; the human-readable tag is a convenience layer on top, never the source of truth itself |

## 24.9 Recovery Strategy

A SemVer-discipline lapse in a shared package is corrected with a follow-up release properly reflecting the actual nature of the change, and the dependent-app update process (Turborepo's graph, Section 24.2) is re-verified against the corrected version.

## 24.10 Best Practices

- When genuinely uncertain whether a shared package change is breaking, default to treating it as a major version bump — the cost of an over-cautious major bump (a dependent app updating slightly more deliberately than strictly necessary) is far lower than the cost of an under-cautious minor/patch bump silently breaking a consumer.

## 24.11 Review Checklist

- [ ] Does a shared package's version bump correctly reflect the actual nature of its change (Section 24.2)?
- [ ] Is every Production release correctly tagged (Section 24.5)?

---

# 25. Secrets & Configuration

## 25.1 Purpose

To state how credentials and environment-specific configuration flow through this pipeline specifically — restated and extended from 10-backend-architecture.md Section 23 (application-level configuration architecture) and 12-security-architecture.md's secrets-handling controls (that document's Section 17), focused here on the CI/CD-specific mechanics.

## 25.2 Pipeline-Level Secrets Storage

**Rule:** every credential the pipeline itself needs (a deployment token, a database migration role's credentials, a third-party API key for a sandbox-mode integration test) is stored in the CI platform's own encrypted secrets store (GitHub Actions secrets or equivalent), never in a committed file, a pipeline log, or a build artifact — restated as this document's own binding pipeline-specific commitment, layered atop 15-engineering-standards.md Section 19.6's application-code-level rule.

## 25.3 Per-Environment Secret Isolation

**Rule:** restated from 13-testing-strategy.md Section 23.3 and 14-infrastructure-devops-architecture.md Section 4.5: Preview, Staging, and Production each have entirely distinct credential sets, with no credential shared across environment boundaries — a Preview-tier pipeline run structurally cannot access a Production secret, since that secret is never present in the Preview environment's configuration scope at all, a mechanical guarantee rather than a permission that merely happens to be denied.

## 25.4 Elevated-Access Pipeline Steps

**Rule:** the small number of pipeline steps requiring elevated access (the database migration step's elevated role, per 14-infrastructure-devops-architecture.md Section 8.7 and 12-security-architecture.md Section 18.3) use a narrowly-scoped credential specific to that single step's purpose, never the same broad credential used elsewhere in the pipeline — minimizing the blast radius of any single credential's potential compromise.

## 25.5 Secret Rotation in the Pipeline Context

Restated from 12-security-architecture.md Section 17's rotation policy: pipeline-level secrets are rotated on the same defined schedule as application-level secrets, and a detected leak (Section 8.4) triggers immediate rotation of the specific affected credential — the pipeline's own configuration is updated as part of that same rotation event, never left pointing at a since-revoked credential.

## 25.6 Configuration Validation in CI

Restated from 10-backend-architecture.md Section 23.1: the typed, Zod-validated `env.ts` module's boot-time validation runs as part of the CI build/test process itself (Section 9, Section 10) — a missing or malformed required configuration value is caught in CI, before a deployment is ever attempted, never discovered for the first time as a Production boot failure.

## 25.7 Responsibilities

DevOps/Platform Engineering owns pipeline-level secrets storage and rotation; every engineer follows 15-engineering-standards.md Section 19.6's application-code discipline, ensuring nothing pipeline-adjacent (a debug log, a test fixture) accidentally captures a real secret value.

## 25.8 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| A pipeline step fails because a required secret is missing/misconfigured for a specific environment | Configuration drift or an incomplete environment setup for a newly-added credential requirement | Caught by Section 25.6's boot-time validation in CI before any deployment attempt; fixed by correcting the specific environment's secret configuration |
| A secret is inadvertently logged by a pipeline step (e.g., an overly verbose debug output) | Insufficient log redaction in a specific tool's default verbosity | Treated identically to any other secret leak (Section 8.4/8.9) — immediate rotation, plus a fix to that specific tool's logging configuration to prevent recurrence |

## 25.9 Recovery Strategy

A pipeline-level secrets misconfiguration is fixed directly in the CI platform's secrets store, with Section 25.6's validation re-run to confirm the fix before any deployment proceeds — never worked around by hardcoding a value temporarily "to unblock" the pipeline.

## 25.10 Best Practices

- Audit pipeline-level secrets access periodically (mirroring 12-security-architecture.md's access-review cadence) — confirming every secret still in use is still actually needed, and removing any that have become vestigial.
- Prefer the narrowest-scoped credential available for any given pipeline step (Section 25.4), even where a broader credential would technically also work.

## 25.11 Review Checklist

- [ ] Is every pipeline-level secret stored exclusively in the CI platform's encrypted secrets store (Section 25.2)?
- [ ] Are environment-specific credentials fully isolated, with no cross-environment sharing (Section 25.3)?
- [ ] Does configuration validation (Section 25.6) run in CI before any deployment attempt?

---

# 26. Compliance & Audit

## 26.1 Purpose

To state what this pipeline records, and why, so that "what deployed, when, who approved it, and what tests passed" is always a answerable, evidence-backed question — restated and extended from 12-security-architecture.md's audit-logging architecture (that document's Section 20) applied specifically to the release process.

## 26.2 What Is Recorded

| Event | Recorded Detail |
|---|---|
| Every pull request merge | Author, reviewer(s), approval timestamp, full CI result set, commit SHA (15-engineering-standards.md §24) |
| Every deployment (Preview, Staging, Production) | Source commit SHA, target environment, timestamp, triggering event (automatic merge vs. manual promotion) |
| Every Tier 1 release | The named go/no-go decision-maker and their explicit decision (13-testing-strategy.md §29.4), the completed release-readiness checklist (§29.2 of that document) |
| Every rollback | Triggering incident/reason, executing engineer, timestamp, subsequent root-cause resolution status (Section 16.5) |
| Every quality-gate bypass | Authorizing engineer, justification, tracked follow-up ticket (Section 7.5) |
| Every migration | The migration itself (version-controlled), its backward-compatibility review outcome, and — for irreversible migrations — the explicit sign-off (Section 12.5) |

## 26.3 Audit Trail Integrity

**Rule:** this record is append-only and tamper-evident — restated from 08-database-design.md Section 23.1's `AuditLog` design philosophy, applied here to the release-process record itself (much of which is inherently append-only by virtue of living in Git history and the CI platform's own immutable run logs, per Section 23's artifact-identity guarantees) — no release record is edited after the fact to retroactively present a cleaner picture than what actually happened.

## 26.4 Compliance Considerations

This pipeline's discipline directly supports the broader compliance posture 12-security-architecture.md Section 29 establishes: a complete, evidenced chain from "a specific line of code" to "a specific, approved, tested deployment" is precisely the kind of traceability a compliance audit (financial, security, or data-protection-focused) requires, and this document's Section 26.2 record is designed to answer that kind of inquiry directly, without needing to be specially reconstructed after the fact for audit purposes.

## 26.5 Responsibilities

DevOps/Platform Engineering owns the technical mechanisms recording Section 26.2's events; Engineering Leadership owns periodic review of this record for the kind of pattern-level concerns Section 7.6/7.7 describe (repeated bypasses, tiering disputes); Security/Compliance (or the designated engineering lead absent a dedicated function) owns responding to any external compliance inquiry using this record as its evidentiary basis.

## 26.6 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| A compliance inquiry asks about a specific historical release, and the record is incomplete | A gap in what Section 26.2 captures, or a tooling failure that silently dropped a record | Treated as a serious process gap — investigated and closed (the recording mechanism itself is fixed), not merely answered as best-effort for the one inquiry at hand |

## 26.7 Recovery Strategy

A discovered gap in the audit trail's completeness triggers a review of the recording mechanism itself (Section 26.2's table, re-verified against what's actually captured in practice) — the fix addresses the systemic capture gap, not just the one historical instance that happened to be asked about.

## 26.8 Best Practices

- Treat the release-process audit trail as a first-class deliverable of the pipeline itself, not an incidental byproduct — its completeness is reviewed with the same seriousness as the pipeline's functional correctness.

## 26.9 Review Checklist

- [ ] Is every event in Section 26.2's table actually being captured, verified periodically rather than assumed?
- [ ] Would this platform's release history answer a compliance inquiry about any specific historical deployment without requiring manual reconstruction?


---

# 27. Operational Responsibilities

## 27.1 Purpose

To consolidate, in one place, exactly who owns what across this entire document — every prior section has stated its own local responsibilities; this section is the single, cross-referenced matrix an engineer checks when a situation doesn't cleanly fall under a section they've already read.

## 27.2 Responsibility Matrix

| Responsibility | Primary Owner | Escalation Path |
|---|---|---|
| CI pipeline configuration and reliability (Sections 6, 9, 10) | DevOps/Platform Engineering | Engineering Leadership, for resourcing/prioritization of pipeline health work |
| Code review quality (Section 5) | Every engineer, as reviewer | Engineering Leadership, for a pattern of inadequate review |
| Test suite health and strategic coverage (13-testing-strategy.md §27.5) | QA/SDET | Engineering Leadership |
| Release tiering policy and disputes (Section 14) | Engineering Leadership | N/A — this is the top of the escalation chain for tiering disputes |
| Individual release execution (Section 18) | The release owner (Section 14.4) | The named Tier 1 sign-off lead, or Engineering Leadership for a Tier 2/3 process question |
| Rollback decision and execution (Section 16) | On-call engineer | Incident Commander, for a SEV-1/2 event (12-security-architecture.md §26.3) |
| Hotfix authorization (Section 17) | Designated senior engineer/lead | Engineering Leadership |
| Feature flag lifecycle (Section 15) | The feature's owning engineer/team | Product/Engineering Leadership, for rollout-percentage business decisions |
| Database migration correctness (Section 12) | The authoring engineer + a second reviewer | DevOps/Platform Engineering, for the execution pipeline itself |
| Secrets/configuration management (Section 25) | DevOps/Platform Engineering | Security/Compliance function, for a leak/incident |
| Audit trail completeness (Section 26) | DevOps/Platform Engineering | Engineering Leadership, for periodic review |
| Support/stakeholder communication (Section 18.5) | The release owner | Product/Founders, for anything with broad business visibility |

## 27.3 On-Call Structure

**Rule:** a defined on-call rotation covers Production monitoring and incident-response duty (Section 16, Section 20) at all times, not only during business hours — restated as a binding operational commitment given this platform's continuous-deployment model (Section 2.2) means a deployment can, in principle, occur or an issue can surface at any time, and 13-testing-strategy.md Section 27.6's incident process requires an identified responder available to act on it promptly regardless of when it happens.

## 27.4 Escalation Principles

**Rule:** escalation happens promptly and without hesitation — restated from Section 16.4's stated urgency standard: an on-call engineer facing genuine uncertainty during an active incident escalates to the Incident Commander or a more senior engineer immediately, rather than spending extended time attempting to resolve it alone first. This document treats prompt escalation as a sign of good judgment, never as an admission of inadequacy, since the cost of a brief, unnecessary escalation is trivial compared to the cost of a prolonged, unresolved incident.

## 27.5 Responsibilities

Every role named in Section 27.2's matrix is responsible for knowing their own scope and for escalating promptly (Section 27.4) when a situation exceeds it; Engineering Leadership owns keeping this matrix itself current as the team and its structure evolve.

## 27.6 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| A situation arises that doesn't clearly map to any row in Section 27.2's matrix | A genuinely novel scenario, or a gap in the matrix itself | Escalated to Engineering Leadership by default for any situation without a clear owner, rather than left unaddressed while the right owner is debated |
| The on-call rotation has a coverage gap (nobody actually on call at a given time) | A scheduling failure | Treated as a Critical-severity operational gap in its own right, fixed immediately, since it directly undermines Section 16/20's entire incident-response capability |

## 27.7 Recovery Strategy

A discovered responsibility-matrix gap (Section 27.6) results in the matrix being updated to explicitly cover the newly-identified scenario, closing the ambiguity for next time rather than relying on the same ad hoc escalation-to-leadership default indefinitely for a now-recurring situation.

## 27.8 Best Practices

- Keep the on-call rotation schedule visible and confirmed well in advance, never discovered to have a gap only at the moment an incident actually occurs.
- Review the responsibility matrix (Section 27.2) whenever the team's structure changes meaningfully (new hires, role changes), keeping it a living, accurate reference rather than a document frozen at the moment of this series' authorship.

## 27.9 Review Checklist

- [ ] Is there always a clearly identified on-call engineer (Section 27.3), with no coverage gaps?
- [ ] Does every situation this pipeline can produce map to a clear owner in Section 27.2's matrix?

---

# 28. CI/CD Review Checklist

Before this document is considered final and ready to govern day-to-day release practice, and periodically thereafter as the pipeline and team evolve, it is reviewed against:

- [ ] **Consistency** — does every section's terminology and referenced process match 10-backend-architecture.md, 12-security-architecture.md, 13-testing-strategy.md, 14-infrastructure-devops-architecture.md, and 15-engineering-standards.md exactly, with no undocumented drift?
- [ ] **Completeness** — does every stage from commit to production verification (Sections 3–20) have a stated purpose, architecture, workflow, responsibilities, failure scenarios, recovery strategy, best practices, and review checklist, per this document's own required structure?
- [ ] **Security** — does Section 8's security-check integration and Section 25's secrets handling remain aligned with 12-security-architecture.md's current controls?
- [ ] **Reliability** — does Section 22's failure-handling strategy cover every plausible pipeline-infrastructure failure mode observed in practice, updated as new ones are discovered?
- [ ] **Risk-Proportionality** — does Section 14's tiering framework still correctly calibrate process weight against 13-testing-strategy.md Section 26.3's risk classifications as the platform's actual risk profile evolves (new payment methods, new regulatory obligations)?
- [ ] **Auditability** — does Section 26's recorded audit trail remain sufficient to answer a compliance inquiry about any historical release without manual reconstruction?
- [ ] **Developer Experience** — does the standard PR-to-merge feedback loop (Section 6) remain within its target time ceiling as the codebase and pipeline complexity grow?
- [ ] **Future Readiness** — does this document's structure extend cleanly to new deployment targets, new release patterns (Section 29), or organizational growth (more engineers, more concurrent releases) without requiring a wholesale rewrite?

---

# 29. Future Evolution

## 29.1 Purpose

To name the specific, concrete directions this pipeline's evolution would plausibly take as the platform and team grow — restated in the same evidence-driven spirit as every prior document's own "future" section (10-backend-architecture.md Section 27, 13-testing-strategy.md Section 32), never speculative complexity added ahead of a demonstrated need.

## 29.2 Canary Releases

Not implemented at this platform's current scale (Section 2.4's continuous-deployment-plus-feature-flags model already provides most of canary releasing's risk-mitigation benefit via gradual flag-based rollout, Section 15.3, without the additional infrastructure complexity of true traffic-splitting canary deployments). This is reconsidered specifically if: traffic volume grows large enough that even a flag-gated rollout to a small user percentage represents a meaningful absolute number of affected users before an issue can be caught, or if a specific class of regression (a subtle performance regression rather than a functional bug) proves to need true infrastructure-level traffic-splitting and comparison to detect reliably, which feature flags alone don't provide.

## 29.3 Blue/Green Deployment

Restated from 14-infrastructure-devops-architecture.md Section 6's own stated position: Vercel's deployment model already provides blue/green-equivalent capability natively (every deployment is a distinct, addressable, instantly-promotable unit, per Section 23.2's artifact-identity guarantee) — a distinct, separately-managed blue/green infrastructure layer would be redundant with what this platform's chosen deployment platform already provides, and is not planned as a separate future initiative for that reason.

## 29.4 Multi-Region Deployment

Not implemented at launch (14-infrastructure-devops-architecture.md's stated infrastructure scope); this pipeline's promotion/rollback/verification model (Sections 16, 19–20) is designed to extend to a future multi-region deployment without a fundamental redesign — a multi-region rollout would primarily add a region-sequencing dimension to Section 19's promotion workflow (promote to region A, verify, then region B) rather than requiring a different underlying pipeline architecture.

## 29.5 Progressive Delivery Tooling

As the team and release volume grow, dedicated progressive-delivery tooling (automating the gradual flag-percentage increases and monitoring-driven rollback decisions Sections 15.3 and 21 currently describe as a largely manual, judgment-driven process) is a plausible future investment — reducing the release owner's manual monitoring burden for routine, low-risk rollouts while preserving human judgment specifically for Tier 1 releases where 13-testing-strategy.md Section 29.4 already requires it.

## 29.6 Expanded Automated Release-Readiness Scoring

A future evolution of Section 18.6's release-readiness checklist toward a more automated, metrics-driven readiness score (synthesizing Section 21's monitoring signals, historical rollback rates for similar changes, and test-coverage trends into a single recommended go/no-go signal) — explicitly framed as a *recommendation* feeding the still-human Tier 1 decision (13-testing-strategy.md Section 29.4), never a replacement for it, consistent with Section 2.6's stated principle that automation handles what's mechanically verifiable while human judgment remains for what genuinely requires it.

## 29.7 Success Criteria for Any Future Evolution

Every item in this section is adopted only in response to a specific, evidenced trigger (a demonstrated scaling limit, a specific recurring pain point in the current process, a concrete new business requirement like true multi-region latency needs) — never spec'd out and built preemptively "because it's the natural next step," mirroring 15-engineering-standards.md Section 3.5's YAGNI principle applied here at the release-process-architecture level.

---

*This document is the definitive CI/CD and release management reference for Dreams by Kalakaaar v2. No pipeline configuration, deployment process, or release decision should deviate from what is documented here without first updating this document through the same Engineering Decision Record process 15-engineering-standards.md Section 29 establishes — and, transitively, remaining consistent with 10-backend-architecture.md, 12-security-architecture.md, 13-testing-strategy.md, 14-infrastructure-devops-architecture.md, and 15-engineering-standards.md. Where a situation arises that this document does not yet cover, it is resolved deliberately, documented here afterward, and never quietly improvised as a one-off exception — the process leads, the release follows.*
