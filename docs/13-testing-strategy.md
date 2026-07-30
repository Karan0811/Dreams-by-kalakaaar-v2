# 13 · Testing Strategy & Quality Assurance — Dreams by Kalakaaar v2

**Document owner:** Principal QA Architect / SDET Lead
**Status:** Draft for review
**Audience:** Frontend Engineering, Backend Engineering, QA, DevOps, Security, Product, Future team members
**Last updated:** 2026
**Depends on:** 00-project-vision.md, 01-product-requirements.md, 02-user-personas.md, 03-user-journeys.md, 04-information-architecture.md, 05-design-principles.md, 06-design-system.md, 07-ui-screens-wireframes.md, 08-database-design.md, 09-api-architecture.md, 10-backend-architecture.md, 11-frontend-architecture.md
**Precedes:** All test implementation, CI pipeline configuration, release sign-off procedures

> **This document defines testing strategy and quality process only.** It contains no test code, no framework configuration files, and no CI YAML. Its purpose is to be the single reference from which every test suite, quality gate, and release checklist is built — every testing decision in this document traces back to a concrete risk named in 00–11, not to abstract best practice for its own sake.

> **Testing tooling, stated once, not re-litigated.** Consistent with 10-backend-architecture.md Section 24's structure and 11-frontend-architecture.md's Turborepo monorepo (`apps/buyer`, `apps/creator`, `apps/internal`, `packages/*`), this document assumes: **Vitest** for unit, component, and integration tests (the natural fit for a Vite-adjacent, Next.js 15/React 19/TypeScript codebase); **React Testing Library** for component-level rendering and interaction assertions; **Mock Service Worker (MSW)** for API mocking at the component/integration boundary; **Playwright** for end-to-end and cross-browser testing (already named in 10-backend-architecture.md Section 24.4); and **axe-core** (via Playwright's accessibility-testing integration) for automated accessibility scanning. These are treated as settled implementation detail, not decisions this document re-argues — the same posture 10-backend-architecture.md took toward its own finalized stack.

---

# 1. Introduction

## 1.1 Purpose

This document defines how Dreams by Kalakaaar v2 knows it works — before a bug reaches a buyer placing a real order, a creator managing real inventory, or a payment moving real money. Every prior document in this series (00 through 11) describes what the platform should do and how it is built; this document describes how the team verifies, continuously and automatically wherever possible, that it actually does what those documents say, and defines the human and process discipline that catches what automation cannot.

## 1.2 Scope

**In scope:** quality philosophy and principles; the testing pyramid and each test level's objectives, scope, and ownership; test strategy for every major platform capability (auth, payments, search, uploads, background jobs, notifications); non-functional testing (performance, accessibility, security validation checkpoints); test data, environment, and mocking strategy; CI/CD test execution; coverage policy; quality gates; bug management; manual QA process; release readiness and production verification; testing metrics; and the automation roadmap.

**Out of scope:** test implementation code, CI pipeline YAML, specific tool configuration syntax, and infrastructure provisioning (10-backend-architecture.md Section 1.2's stated boundary applies equally here — this document specifies *what* must be verified and to what standard, never the literal test file contents).

## 1.3 Audience

Every engineer on the team, since quality is not a QA-team-only concern in this architecture (Section 2.3); QA/SDET specialists who own the deeper test-strategy and automation-roadmap decisions; DevOps engineers who wire this strategy into CI/CD (Section 24); product and design stakeholders who define acceptance criteria (Section 29.3) and review release readiness (Section 29).

## 1.4 Objectives

1. Make quality a property the system is *built* with, not inspected into afterward — shift-left testing (Section 3.4) as a working discipline, not a slogan.
2. Give every test level (Sections 6–21) a clear, non-overlapping mandate, so the team never wonders "should this be a unit test or an integration test" without an answerable rule.
3. Define concrete, numeric coverage and quality gates (Sections 25–26) that block a release on objective criteria, removing "is this ready" from being a subjective, last-minute debate.
4. Specify testing strategy for the platform's highest-risk domains by name — payments (Razorpay, 10-backend-architecture.md Section 16), authentication (Better Auth, Section 7), background jobs (Inngest, Section 12) — at a depth proportional to their real-world consequence of failure.
5. Establish a bug-management and release-readiness process (Sections 27, 29–30) that is fast for low-risk changes and appropriately rigorous for high-risk ones, never uniformly slow or uniformly loose.

## 1.5 Definitions

| Term | Meaning in this document |
|---|---|
| Test Level | A category of test distinguished by what it exercises and in what isolation (Unit, Component, Integration, API, E2E — Section 5). |
| Quality Gate | An automated or human checkpoint that must pass before code/a release can proceed to the next stage (Section 26). |
| Flaky Test | A test that produces different results (pass/fail) across runs with no underlying code change — treated as a defect in the test itself, never tolerated as "normal" (Section 24.6). |
| Test Pyramid | The relative-volume model governing how many tests exist at each level (Section 4) — many fast/cheap tests at the base, few slow/expensive tests at the top. |
| Shift-Left | Moving quality activities (test-writing, review, static analysis) as early as possible in the development lifecycle, per Section 3.4. |
| Blast Radius | The scope of users/data a given bug or regression could affect — the primary factor driving severity classification (Section 27.2) and release-gate strictness (Section 26.3). |

## 1.6 References

This document assumes and does not restate: 08-database-design.md's entity/domain model, 09-api-architecture.md's API contract and error taxonomy, 10-backend-architecture.md's module boundaries and Section 24 testing-strategy foundation (this document is that section's full expansion, not a duplicate), and 11-frontend-architecture.md's three-app monorepo structure, rendering strategy, and state-management architecture. Where this document names a specific module, endpoint, or component pattern, it is referencing that prior document's definition directly.

## 1.7 Guiding Principles

1. **A test's value is its ability to catch a real regression, not its existence.** A test suite is judged by the bugs it prevents from reaching production, not by a coverage percentage in isolation (Section 25.1's explicit rejection of coverage-as-the-goal).
2. **Every test level has exactly one job.** Overlapping test levels asserting the same thing at different layers is waste, not thoroughness — Section 5's test-level matrix exists specifically to prevent this.
3. **Tests are first-class code.** They are reviewed with the same rigor as production code (Section 3.5), refactored when they rot, and never disabled/skipped without a tracked, time-boxed reason (Section 24.6).
4. **Risk determines rigor, not habit.** Payment and authentication code (Sections 15–16) is tested more exhaustively than a CMS banner-scheduling field, deliberately and proportionally — this document does not apply uniform testing depth everywhere, since that would both under-test the highest-risk surfaces and waste effort on the lowest-risk ones.
5. **Every quality gate has an owner and a bypass process.** No gate exists that cannot be explained, and every gate that can be bypassed under genuine emergency has a documented, accountable bypass procedure (Section 26.5) — silent, undocumented workarounds are treated as a process failure to fix, not a convenience to preserve.

## 1.8 Non-Goals

This document does not: prescribe a specific test-runner configuration beyond the tooling named in this document's header (settled, not re-litigated, per that note); define the API contract or data model (owned by 09 and 08 respectively — this document verifies conformance to them, it does not redefine them); or commit to a specific third-party QA/bug-tracking tool (Section 27's process is tool-agnostic, describing workflow and states, not a specific product's configuration).

---

# 2. Quality Philosophy

## 2.1 Quality Is a Trust Signal, Not a Cost Center

Dreams by Kalakaaar's entire differentiation is trust — in verified makers, authentic goods, fair order fulfillment (00-project-vision.md's stated core value). A bug that overcharges a buyer, loses a creator's inventory count, or silently drops a customization request is not merely an inconvenience; it is a direct violation of the platform's central promise. Quality engineering in this document is treated with the same seriousness 08-database-design.md gives financial data integrity and 09-api-architecture.md gives API contract stability — because a testing gap in checkout or messaging is, functionally, a trust gap.

## 2.2 Prevention Over Detection

The cheapest bug is the one that never gets written; the second-cheapest is the one caught by a fast, local unit test before a pull request is even opened. Cost of a defect rises by roughly an order of magnitude at each stage it survives undetected (local dev → CI → staging → production), a widely-observed industry pattern this strategy is explicitly built around: the testing pyramid (Section 4), shift-left practices (Section 3.4), and quality gates (Section 26) all exist to push detection as early as economically sensible, reserving the most expensive detection mechanisms (manual QA, production verification) for what only they can catch.

## 2.3 Quality Is Everyone's Responsibility

There is no separate "QA throws it over the wall" phase in this process. Every engineer writes tests for their own code (Section 3.2); a dedicated QA/SDET function (Section 27.5's ownership model) exists to own test *strategy*, deep exploratory testing, automation infrastructure, and release-readiness judgment — not to be the sole party responsible for catching bugs engineers didn't bother to test for themselves.

## 2.4 Confidence, Not Perfection

The goal of this strategy is not zero bugs (an impossible and, past a point, actively counterproductive standard to chase) — it is **calibrated confidence**: the team should always know, with evidence, how confident it can be in a given release, which specific areas carry the most residual risk, and what verification remains before shipping. Section 26's quality gates and Section 31's testing metrics exist to make this confidence measurable and legible, not a gut feeling.

## 2.5 Fast Feedback Above All

A test suite that takes an hour to tell a developer they broke something is a test suite that will be ignored, worked around, or eventually deleted. Every design decision in Sections 4–5 (the pyramid shape, per-level scope discipline) exists in service of keeping the *common* feedback loop (a developer's local test run, a pull request's CI check) fast — seconds to a few minutes — while still catching what needs catching, deferring only the genuinely slow, high-value checks (full E2E suites, performance tests) to less frequent, still-fast-enough-to-be-useful cadences (Section 24.3).

---

# 3. Testing Principles

## 3.1 Testing Lifecycle

Quality activities span the full development lifecycle, not a phase at the end:

```
Design & Spec ──► Local Development ──► Pull Request ──► CI Pipeline ──► Staging ──► Production
     │                    │                    │               │              │             │
     ▼                    ▼                    ▼               ▼              ▼             ▼
Acceptance          Unit/Component        Code Review    Full automated   Manual QA /   Production
criteria defined    tests written          + test         suite runs      exploratory   verification
(Section 29.3)       alongside code        review          (Section 24)    testing        (Section 30)
                     (Section 3.2)         (Section 3.5)                   (Section 28)
```

Every stage above has a defined quality activity; no stage is "quality-free" on the assumption a later stage will catch everything.

## 3.2 Developer Testing Workflow

Every engineer, for every change: (1) writes or updates unit/component tests alongside the implementation, in the same pull request, never as a promised follow-up (a PR that adds behavior without corresponding tests is not mergeable, per Section 26.2's code quality gate); (2) runs the affected package's test suite locally before pushing (Turborepo's dependency-graph-aware task running, per 11-frontend-architecture.md Section 3.3, means only the affected app/package's tests need to run locally for fast iteration, not the entire monorepo's suite); (3) writes an integration or API test (Sections 8–9) when the change crosses a module boundary (10-backend-architecture.md Section 3.6) or touches a Route Handler's documented contract (09-api-architecture.md); (4) flags in the pull request description when a change is high-risk enough (Section 26.3's risk tiers) to warrant E2E coverage (Section 10) or manual QA attention (Section 28) beyond automation.

## 3.3 Shift-Left Testing

Concretely, in this codebase: TypeScript's compiler and Zod's runtime schemas (10-backend-architecture.md Section 9.4) catch shape errors before any test even runs; ESLint's module-boundary and anti-pattern rules (10-backend-architecture.md Section 26.2) catch architectural violations at write-time; pre-commit hooks run the affected package's fast unit tests locally; and — the highest-leverage shift-left practice of all — every new feature's acceptance criteria (Section 29.3) are written and agreed *before* implementation begins, not reverse-engineered from the finished code, so "does this meet the bar" is answerable objectively rather than argued after the fact.

## 3.4 Test-First Where It Earns Its Keep

This strategy does not mandate strict TDD (test-then-code) universally — for UI-heavy, exploratory component work, writing the component first and the test immediately after is often more productive, and this document does not force a workflow that fights the grain of the work. Test-first **is** the required discipline specifically for: business-rule-heavy Service Layer functions (10-backend-architecture.md Section 9, where the rule itself — e.g., 08-database-design.md Section 26.5's cross-row invariants — is often clearer to state as a test assertion first) and any bug fix (a regression test reproducing the bug is written and confirmed failing *before* the fix is written, confirming the fix actually addresses the reported behavior and not just a symptom).

## 3.5 Code Review as a Quality Gate

Every pull request's review explicitly evaluates test quality, not just production code quality: are the right test levels used (Section 5)? Do tests assert behavior, not implementation detail (Section 6.4)? Is a genuinely risky edge case (Section 21) covered? A reviewer approving a PR with inadequate tests is, in this process, as accountable for the resulting gap as the PR's author — test-quality review is not optional or secondary to logic review.

## 3.6 Acceptance Criteria as the Testing Contract

Every feature, before implementation, has acceptance criteria stated in specific, testable terms (Section 29.3) — not vague ("the checkout should work well") but concrete ("a buyer with an expired card sees a specific, actionable error message and can retry with a different payment method without losing their cart"). Acceptance criteria are the bridge between product intent (01-product-requirements.md) and this document's test levels: each criterion should be traceable to at least one automated test (where automatable) or an explicit manual test case (Section 28, where it genuinely cannot be automated economically).


---

# 4. Testing Pyramid

## 4.1 The Shape

```
                        ▲
                       ╱ ╲          E2E (Section 10) — fewest, slowest,
                      ╱───╲         highest-fidelity, run on PR merge + nightly
                     ╱     ╲
                    ╱───────╲       API Tests (Section 9) — contract-level,
                   ╱         ╲       run on every PR
                  ╱───────────╲
                 ╱             ╲    Integration Tests (Section 8) — cross-module,
                ╱───────────────╲    real test-database, run on every PR
               ╱                 ╲
              ╱───────────────────╲  Component Tests (Section 7) — rendered UI,
             ╱                     ╲  mocked data, run on every PR
            ╱───────────────────────╲
           ╱                         ╲ Unit Tests (Section 6) — pure logic, fully
          ╱───────────────────────────╲ isolated, run on every save (watch mode)
```

## 4.2 Why This Shape

Directly mirrors 10-backend-architecture.md Section 24.8's stated pyramid, extended here with the frontend's Component Testing layer (Section 7) inserted between Unit and Integration, since 11-frontend-architecture.md's component-first architecture (its Section 8) makes rendered-component behavior a distinct, high-value, fast-to-run test layer that a backend-only pyramid doesn't need. Each layer down is faster and cheaper to write and run, and each layer up is closer to what a real user actually experiences — the pyramid shape exists so that the *bulk* of defect-catching happens at the fast, cheap layers, and the slow, expensive layers are reserved for what only they can verify: genuine end-to-end user-journey correctness (Section 10) and true cross-browser/cross-device fidelity (Section 11.3–11.5).

## 4.3 Target Volume Ratios (Illustrative, Not a Hard Quota)

| Level | Approximate Share of Total Test Count | Typical Execution Time (Full Suite) |
|---|---|---|
| Unit | ~50% | Seconds |
| Component | ~25% | Under a minute |
| Integration | ~15% | A few minutes |
| API | ~7% | A few minutes |
| E2E | ~3% | 10–30 minutes |

These ratios are directional, not a quota engineers write tests to satisfy — a module with unusually complex business logic (Payments, Section 16) will skew further toward Unit/Integration than this average; a highly visual, low-logic UI area will skew toward Component. The anti-pattern this table exists to prevent is the **inverted pyramid** (an "ice cream cone" — heavy reliance on slow E2E tests to catch what a unit test could have caught in milliseconds), which is treated as a structural defect in the test suite itself when observed (Section 31.4's metric tracks this directly).

## 4.4 Anti-Patterns Explicitly Rejected

| Anti-Pattern | Why Rejected |
|---|---|
| Testing implementation detail instead of behavior (e.g., asserting a component's internal state variable rather than its rendered output) | Produces brittle tests that break on safe refactors and fail to catch real behavioral regressions — directly addressed in Section 6.4/7.2. |
| Relying on E2E tests for logic that could be unit-tested | Slow feedback, flaky, expensive to maintain — addressed by Section 4.3's ratio guidance and Section 10.2's scoped E2E mandate. |
| 100% coverage as a goal in itself | Produces low-value tests asserting trivial getters/setters while missing genuine edge cases — rejected explicitly in Section 25.1 in favor of risk-based coverage targets. |
| Skipping tests "temporarily" without a tracked ticket | Becomes permanent; treated as a blocked-merge condition (Section 26.2), never a silent allowance. |

---

# 5. Test Levels

## 5.1 The Complete Test-Level Matrix

| Level | What It Verifies | Isolation | Speed | Owner | Section |
|---|---|---|---|---|---|
| Unit | A single function/module's logic, fully isolated from I/O | Complete (no DB, no network, no filesystem) | Milliseconds | Engineer authoring the code | 6 |
| Component | A single UI component's rendered output and interaction behavior | Isolated from real API (MSW-mocked) | Sub-second | Frontend engineer | 7 |
| Integration | Multiple units/modules working together against a real test database | Real Postgres (ephemeral, per-run), external services mocked | Seconds | Engineer authoring the feature | 8 |
| API (Contract) | A Route Handler's actual HTTP behavior against the documented contract (09-api-architecture.md) | Full pipeline, test database, external services mocked/sandboxed | Seconds | Backend engineer + QA | 9 |
| E2E | A complete real user journey through a real browser against a staging deployment | None — closest to production reality | Minutes | QA/SDET, with engineer input for new journeys | 10 |
| Smoke | The smallest set of checks confirming a deployment is fundamentally alive and functional | Against the actual deployed environment | Under a minute | CI, automatic, every deployment | 24.2 |
| Regression | Re-verification that previously-fixed bugs and previously-working critical paths remain correct | Varies (unit through E2E, whichever level originally caught the class of bug) | Varies | Automated where possible; QA for the manual subset | 24.5, 28 |
| Visual Regression | Pixel/layout-level UI consistency across changes | Screenshot-diffing against a baseline | Seconds–minutes | Frontend engineer + QA | 11.6 |
| Exploratory/Manual | Unscripted, judgment-driven probing for issues automation isn't designed to find | Real environment, human tester | Variable | QA | 28 |

## 5.2 Choosing the Right Level (Decision Guide)

```
Is it pure logic with no I/O, no rendering?
   │
   YES ──► Unit Test (Section 6)
   │
   NO — does it render UI?
          │
          YES ──► Component Test (Section 7)
          │
          NO — does it cross a module boundary or need a real database?
                 │
                 YES ──► Integration Test (Section 8)
                 │
                 NO — is it verifying an HTTP endpoint's contract?
                        │
                        YES ──► API Test (Section 9)
                        │
                        NO — is it a complete, business-critical user journey?
                               │
                               YES ──► E2E Test (Section 10), used sparingly
                               │
                               NO ──► Reconsider — most things fit above;
                                      an uncategorizable test is a signal to
                                      re-scope, not a signal for a new level.
```

## 5.3 Ownership Summary

Every test level has a **primary owner** (who writes the majority of tests at that level) and a **secondary reviewer** (who ensures quality and coverage at a strategic level): Unit/Component/Integration are engineer-authored, QA-reviewed for coverage gaps during code review and release readiness (Section 29); API and E2E tests are jointly owned (engineers write the initial coverage for new endpoints/journeys, QA/SDET maintains and extends the suite's overall health, flakiness, and strategic coverage, per Section 27.5); Smoke, Regression (automated portion), and Visual Regression run entirely in CI without a human trigger; Exploratory/Manual testing (Section 28) is QA-owned exclusively.


---

# 6. Unit Testing

## 6.1 Objectives

Verify that a single function, class, or module produces correct output for a given input, in complete isolation from databases, networks, the filesystem, and other modules — the fastest, cheapest, most numerous layer of the pyramid (Section 4.3), and the layer where the large majority of business-logic defects should be caught before a pull request is even opened.

## 6.2 Scope

**In scope:** every Service Layer function's business-rule branches (10-backend-architecture.md Section 9.1 — ownership checks, validation logic, distinct success/failure paths, with the Repository Layer mocked per that document's Section 24.1); every pure utility function (`shared/money.ts`, `shared/pagination.ts`, `shared/dates.ts` per 10-backend-architecture.md Section 4.1); every Zod schema's validation behavior (valid input accepted, invalid input rejected with the expected error shape); every Zustand store's state-transition logic (11-frontend-architecture.md's state-management layer — reducers/actions tested independent of any rendered component).

**Out of scope:** anything requiring a real database connection (Section 8), anything requiring component rendering (Section 7), anything requiring a real network call to an external service (mocked at this level if referenced at all, per Section 22.3).

## 6.3 Best Practices

- **One logical assertion focus per test** — a test name should read as a specification sentence ("rejects a coupon that has expired," not "test coupon 3"), and a failing test's name alone should tell a reader what broke without needing to read its body.
- **Arrange-Act-Assert structure**, consistently, across the entire codebase — the setup, the action under test, and the verification are visually and structurally distinct in every test file.
- **No conditional logic inside a test.** A test with an `if` statement is testing multiple things and should be split into multiple tests — conditional logic in a test is a strong signal the test itself needs simplification.
- **Test the contract, not the implementation.** A unit test for a Service Layer function asserts its return value and its calls to (mocked) dependencies — it never reaches into private implementation detail that could change under a safe refactor without changing the function's actual behavior.

## 6.4 Standards

| Standard | Requirement |
|---|---|
| Isolation | Zero real I/O — no real database, no real network call, no real filesystem access, no real timers (fake/mocked clocks for any time-dependent logic, e.g., `Reservation` expiry checks, 08-database-design.md Section 9.3). |
| Determinism | A unit test must produce the same result every run, in any order, on any machine — any test exhibiting flakiness is immediately quarantined (Section 24.6) and fixed or deleted, never left "usually passing." |
| Speed | The full unit suite for any single package/app completes in well under 30 seconds locally, enabling watch-mode-driven development (Section 3.2). |
| Naming | Test files co-located with the code they test (`service.ts` ↔ `service.test.ts`), per 10-backend-architecture.md Section 4.1's `__tests__/` convention and 11-frontend-architecture.md's package structure. |

## 6.5 Responsibilities

The engineer authoring a piece of logic writes its unit tests in the same pull request (Section 3.2) — there is no separate "unit test backlog" or deferred test-writing phase. Code review (Section 3.5) is the enforcement mechanism for adequate unit coverage of new business logic.

## 6.6 Success Criteria

- Every Service Layer function (10-backend-architecture.md Section 5's ~26 modules) has unit tests covering at minimum: the happy path, every documented authorization failure (09-api-architecture.md Section 23.4), and every documented business-rule failure (that document's Section 23.5) relevant to that function.
- Every shared utility function has unit tests covering its documented valid-input range and its boundary conditions (Section 21's edge-case discipline applies with particular force here, since these functions are used platform-wide).
- No unit test depends on execution order or on another test's side effects (verified by CI running the suite with randomized test order, Section 24.4).

---

# 7. Component Testing

## 7.1 Objectives

Verify that a single UI component (per 11-frontend-architecture.md's `packages/ui` design-system components and each app's feature-specific components) renders correctly given a set of props/state, and behaves correctly in response to user interaction — without a real backend, a real router, or a full page render.

## 7.2 Scope

**In scope:** every reusable component in `packages/ui` (buttons, form fields, the design system's primitives built on shadcn/ui and Radix, per 06-design-system.md); every feature component with non-trivial logic (a Product card's wishlist-toggle interaction, a Cart line item's quantity stepper, a Checkout step's form validation display); every custom hook consuming TanStack Query or Zustand (11-frontend-architecture.md's state-management layer) tested via React Testing Library's hook-testing utilities.

**Out of scope:** full-page composition and routing behavior (Integration/E2E, Sections 8, 10); real API calls (always mocked via MSW at this layer, Section 22.3); pixel-level visual fidelity (Visual Regression, Section 11.6).

## 7.3 Best Practices

- **Test from the user's perspective, via React Testing Library's query priorities** — query rendered output by accessible role and label (`getByRole`, `getByLabelText`) before falling back to test IDs, since this simultaneously verifies the component is usable by assistive technology (a direct, free accessibility-regression check layered into ordinary component tests, reinforcing Section 12's dedicated accessibility layer rather than duplicating it) and avoids brittle coupling to internal DOM structure.
- **Never assert on a component's internal state or implementation** — assert on what the component renders and what it does in response to interaction (Section 6.4's "test the contract" principle, applied to UI).
- **Mock at the network boundary (MSW), not at the component-import boundary** — a component test that mocks an entire child component or hook risks testing a fiction that doesn't reflect real composition; mocking the actual API response a component's data-fetching hook would receive keeps the test realistic while still avoiding a real network dependency.

## 7.4 Standards

| Standard | Requirement |
|---|---|
| Accessibility baseline | Every component test includes an `axe-core` scan (the same engine used in Section 12's dedicated accessibility testing, run here at the component level for the fastest possible feedback on a per-component accessibility regression) with zero violations as a passing condition. |
| Design-system conformance | Every `packages/ui` component's tests verify it correctly forwards `className`/`ref` and respects the design tokens defined in 06-design-system.md (verified structurally — correct variant prop produces the correct token-driven class, not a pixel-level check, which belongs to Section 11.6). |
| Responsive/state coverage | Every component with distinct visual states (loading, error, empty, populated — a recurring pattern across 07-ui-screens-wireframes.md's screens) has a test for each state. |

## 7.5 Responsibilities

Frontend engineers write component tests alongside every new or modified component, in the same pull request (Section 3.2). The design-system package (`packages/ui`) maintains a higher coverage bar than feature-specific components, since a regression there has platform-wide blast radius across all three apps (11-frontend-architecture.md's shared-package architecture).

## 7.6 Success Criteria

- Every `packages/ui` component has tests for every documented prop-driven variant and every interactive state.
- Every feature component handling asynchronous data (via TanStack Query) has tests for its loading, error, empty, and success-with-data render states.
- Zero `axe-core` violations across the component test suite (Section 12.2 defines the platform-wide accessibility standard this enforces at the earliest possible layer).

---

# 8. Integration Testing

## 8.1 Objectives

Verify that multiple units — most importantly, a Service Layer function and its real Repository Layer (10-backend-architecture.md Section 3.2) — work correctly together against a real (ephemeral, test-scoped) PostgreSQL instance, catching the class of bug that mocked-repository unit tests structurally cannot: an incorrect join, a missed `WHERE` clause, a constraint violation, a transaction that doesn't roll back correctly.

## 8.2 Scope

**In scope:** every Repository Layer function, exercised against a real Supabase-Postgres-compatible test database with the actual Drizzle schema (08-database-design.md) applied via real migrations (10-backend-architecture.md Section 25.2); every Service Layer function's full transaction behavior (that document's Section 9.3 — does a multi-write operation actually roll back atomically on a mid-transaction failure); cross-module Service Layer calls (Section 3.6's module-boundary-respecting interaction pattern) verified end-to-end at the business-logic layer, still below the HTTP boundary.

**Out of scope:** HTTP-layer concerns (routing, header parsing, response shaping — Section 9); real external service calls (Razorpay, Resend, R2 — always mocked/stubbed at this layer via the Integration Layer's client interfaces, 10-backend-architecture.md Section 17, so a test verifies "did we call Razorpay correctly" without actually hitting Razorpay's sandbox, which belongs to Section 16.2's dedicated payment-integration testing).

## 8.3 Best Practices

- **A fresh, migrated, empty database per test run** (never a shared, persistent test database that accumulates state across runs) — provisioned in CI as an ephemeral instance (Section 23.2), seeded only with the specific fixture data (Section 22.2) each test suite needs, and torn down after.
- **Test real transactional behavior explicitly** — for every Service Layer function identified in 10-backend-architecture.md Section 9.3 as multi-write-transactional (checkout completion being the canonical example), an integration test deliberately induces a failure partway through and asserts the entire operation rolled back, not just that the happy path commits correctly.
- **Isolate tests from each other within the same database** — each test either runs within its own rolled-back transaction (a common, fast isolation pattern) or cleans up its own fixture data explicitly; tests must never depend on a specific execution order or on data left behind by a previous test (Section 22.4's test-isolation discipline, applied concretely here).

## 8.4 Standards

| Standard | Requirement |
|---|---|
| Schema fidelity | The integration test database's schema is created via the same Drizzle migrations that would run in staging/production (10-backend-architecture.md Section 25.2), never a hand-maintained separate test schema that could drift from the real one. |
| RLS verification | Where Row-Level Security policies are configured (10-backend-architecture.md Section 20.9), integration tests explicitly verify the policy's enforcement — e.g., a test asserting that a query executed in one Store's RLS context cannot read another Store's `Order` rows, directly testing the defense-in-depth layer that document describes. |
| Cross-module boundary respect | An integration test exercising a cross-module call (e.g., Orders calling Payments, per 10-backend-architecture.md Section 5.12/5.14) calls through the real public Service Layer interface, never reaching into another module's Repository Layer directly — the test suite itself models and enforces the same module-boundary discipline the architecture requires (10-backend-architecture.md Section 3.6). |

## 8.5 Responsibilities

The engineer implementing a feature that spans multiple Repository functions or crosses a module boundary writes the corresponding integration tests in the same pull request. QA/SDET (Section 27.5) periodically reviews integration-test coverage across the highest-risk modules (Orders, Payments, Inventory) for gaps not caught by per-feature test-writing.

## 8.6 Success Criteria

- Every Repository Layer function has at least one integration test verifying its actual generated query against real data.
- Every documented multi-write transaction (10-backend-architecture.md Section 9.3) has a test verifying correct rollback behavior on partial failure.
- Every RLS policy (that document's Section 20.9) has at least one integration test explicitly verifying cross-tenant access is denied.


---

# 9. API Testing

## 9.1 Objectives

Verify that every Route Handler (10-backend-architecture.md Section 3.2) behaves exactly as 09-api-architecture.md documents it — correct status codes, correct response envelope shape (that document's Sections 2.7, 2.15–2.16), correct error codes for every documented failure mode, and correct enforcement of authentication/authorization (Sections 6.3–6.4 of that document) — at the actual HTTP boundary, exercising the full request pipeline (10-backend-architecture.md Section 6) rather than any individual layer in isolation.

## 9.2 Scope

**In scope:** every documented endpoint in 09-api-architecture.md, tested for its documented success response, every documented error response (that document's Section 23's full catalog, per-endpoint), pagination behavior (cursor correctness, `hasMore` accuracy — that document's Section 2.7), filtering/sorting behavior against the documented allowed-field list (Sections 2.8–2.9), and idempotency-key behavior for every endpoint requiring one (Section 2.6).

**Out of scope:** UI rendering (Sections 7, 10–11); true cross-browser behavior (Section 11.3, since API tests don't involve a browser at all); real third-party service calls (mocked/sandboxed, Section 16.2 for the payment-specific sandbox strategy).

## 9.3 Contract Testing (Automated Drift Detection)

Restated and expanded from 10-backend-architecture.md Section 24.5: every API test additionally validates the actual response against the OpenAPI 3.1 specification's schema (09-api-architecture.md Section 26.1) programmatically — not merely "does this field exist" hand-written assertions, but an automated schema-conformance check that fails the build the moment implementation and documentation diverge in field name, type, required-ness, or enum values. This is the single highest-leverage test in this entire document for keeping 09-api-architecture.md a *living*, trustworthy contract rather than a document that quietly goes stale.

## 9.4 Best Practices

- **One test suite per resource group**, mirroring 09-api-architecture.md's own section structure (Auth, Users, Creators, Products, …) — a developer extending the Orders API knows exactly where the corresponding API tests live, mirroring 10-backend-architecture.md Section 4.3's "one developer who knows one module's layout knows every module's layout" philosophy applied to the test suite itself.
- **Test the full authorization matrix per endpoint** — for every endpoint, explicit tests exist for: the correctly-authorized role succeeding, every other role receiving `403`, an unauthenticated request receiving `401` (where authentication is required), and — critically — an authenticated-but-wrong-owner request receiving the correct ownership-based rejection (09-api-architecture.md Section 22.3), not just a role check.
- **Test every documented error code explicitly**, not just the happy path — 09-api-architecture.md Section 23's full per-category error catalog is the checklist; an endpoint's API test suite is not considered complete until every error code that section documents for that endpoint has a corresponding test inducing it.

## 9.5 Standards

| Standard | Requirement |
|---|---|
| Idempotency verification | Every endpoint requiring an `Idempotency-Key` (09-api-architecture.md Section 2.6) has a test verifying: identical key + identical payload replayed returns the original result without re-executing side effects (verified by asserting no duplicate database row / no duplicate external call); identical key + different payload returns `409`. |
| Anti-enumeration verification | Every endpoint documented as using the anti-enumeration pattern (09-api-architecture.md Section 22.4 — login, forgot-password, coupon application) has a test asserting the response is byte-for-byte identical (status, body shape, timing-insensitive) regardless of whether the underlying resource exists. |
| Pagination correctness | Every paginated list endpoint has a test verifying cursor-based traversal returns the complete, non-duplicated, correctly-ordered result set across multiple pages, and that `hasMore: false` is accurate on the final page. |
| Rate limit headers | A representative sample of endpoints (at minimum one per resource group) is tested for the presence and correctness of `X-RateLimit-*` headers (09-api-architecture.md Section 2.20). |

## 9.6 Responsibilities

The backend engineer implementing or modifying an endpoint writes its API tests in the same pull request; QA/SDET maintains the shared contract-testing infrastructure (Section 9.3) and periodically audits full-catalog error-code coverage (Section 9.4's completeness bar) across the API surface, since this is easy for individual feature work to under-cover incrementally.

## 9.7 Success Criteria

- 100% of documented endpoints (09-api-architecture.md) have at least one passing API test.
- 100% of documented error codes per endpoint have a corresponding induced-failure test.
- Zero schema-conformance drift between the OpenAPI spec and actual Route Handler responses, enforced as a CI-blocking check (Section 24.4).

---

# 10. End-to-End Testing

## 10.1 Objectives

Verify complete, business-critical user journeys (03-user-journeys.md) through a real browser against a real, deployed (staging) environment — the only test level that exercises the frontend, the API, the database, and (where safe to do so, Section 10.5) real or realistic third-party integrations together, as a genuine user would experience them.

## 10.2 Scope — Deliberately Narrow

Per Section 4.3's pyramid discipline, E2E tests are reserved **exclusively** for journeys where end-to-end fidelity is the point — where a bug could only plausibly be caught by the real interaction of frontend, backend, and browser together, not by any lower, faster test level. The canonical, mandatory journey set:

| Journey | Why It's an E2E Candidate (Not Just Unit/Integration) |
|---|---|
| Guest signup → email verification → first login | Spans Auth's token-issuance, a real email-delivery-adjacent flow (Section 17.6's mocked-in-staging approach), and session establishment across a page reload. |
| Browse → PDP → customize → add to cart → guest checkout → order confirmation | The platform's single most business-critical path (00-project-vision.md's core value proposition) — spans Products, Inventory, Cart, Checkout, Payments, Orders, and Notifications together. |
| Creator: apply → get approved → publish a product → receive and fulfill an order | Exercises the Creator Dashboard app (11-frontend-architecture.md's second app) against the same backend, verifying the multi-app architecture's shared-backend assumption holds under real conditions. |
| Buyer: request a return → creator approves → refund processed | Exercises the Orders↔Payments cross-module flow (10-backend-architecture.md Section 5.12/5.14) end-to-end, including a real (sandboxed) Razorpay refund call (Section 16.2). |
| Moderator: review a reported product → take a moderation action → creator sees the consequence | Exercises the Internal app (11-frontend-architecture.md's third app) against real cross-role data visibility. |

New journeys are added to this suite deliberately and sparingly — a proposed new E2E test is evaluated against the question "could this realistically be caught by a faster test level instead," and only added if the answer is genuinely no.

## 10.3 Cross-Browser & Device Coverage

Playwright's multi-browser-engine support runs the full E2E suite against Chromium, WebKit (Safari engine), and Firefox on every scheduled run (Section 10.6's cadence), plus a mobile-viewport configuration (given the Buyer Web App's PWA/mobile-first nature, per 11-frontend-architecture.md) for the highest-traffic journeys (browse-to-checkout). This is the platform's primary mechanism for catching genuine cross-browser rendering/behavior divergence — a class of bug no other test level in this document can catch, since Unit/Component/Integration/API tests never involve a real browser engine at all.

## 10.4 Best Practices

- **Test user-visible behavior, never internal routing/state** — an E2E test interacts with the page the way a real user would (clicking a labeled button, reading rendered text) and never reaches into the frontend's internal state management (Zustand stores, TanStack Query cache) to shortcut an assertion.
- **Independent, fully-seeded test data per run** — every E2E test creates its own test user/store/product fixtures at the start of the test (via a dedicated test-data-seeding API, Section 22.5) rather than depending on shared, persistent staging data that could be mutated by another concurrently-running test or by manual QA activity.
- **No hard-coded waits** — every wait is an explicit assertion-driven wait (e.g., "wait until this element is visible," "wait until this network request completes") using Playwright's built-in auto-waiting, never an arbitrary `sleep(3000)`, which is both slow (accumulates across a large suite) and a leading cause of flakiness (Section 24.6) if the arbitrary duration proves insufficient under load.

## 10.5 Third-Party Service Handling in E2E

Real email delivery (Resend), real payment processing (Razorpay), and real push notifications are never exercised against production/live provider accounts in E2E tests — Razorpay's own sandbox/test-mode environment (Section 16.2) is used for payment-flow journeys, and Resend's test mode (or an internal mock inbox the E2E environment routes to, per Section 23.3's staging-environment configuration) is used for email-dependent journeys (e.g., verifying an order-confirmation email is queued and its content is correct, without needing to actually receive it in a real inbox).

## 10.6 Execution Cadence

The full cross-browser E2E suite is not run on every single commit (its runtime, per Section 4.3's ~10–30 minutes, would slow the standard PR feedback loop unacceptably) — it runs on every merge to the main branch (a single-browser/Chromium-only fast subset) and in full, all-browser configuration on a nightly schedule plus mandatorily before any production release (Section 29's release-readiness gate), per 10-backend-architecture.md Section 25.1's CI-pipeline structure extended here with E2E's specific cadence.

## 10.7 Responsibilities

QA/SDET owns the E2E suite's overall health, structure, and cross-browser configuration; engineers propose and pair with QA to add coverage when introducing a genuinely new business-critical journey (Section 10.2's addition bar); any engineer may and should fix a flaky E2E test they encounter rather than merely re-running it, per Section 24.6's zero-tolerance-for-known-flakiness policy.

## 10.8 Success Criteria

- Every journey in Section 10.2's mandatory table passes on every browser/device configuration named in Section 10.3, on every nightly run and every pre-release run.
- Zero tests in the E2E suite are in a known-flaky, skipped, or `.only`-restricted state at any time (Section 24.6).
- Median E2E suite runtime does not regress beyond an agreed ceiling without an explicit, reviewed decision to accept the increase (Section 31.3's metric).


---

# 11. UI Testing

## 11.1 Objectives

Beyond individual component correctness (Section 7) and full-journey correctness (Section 10), UI Testing verifies the platform's visual and interactive quality at the level 05-design-principles.md and 06-design-system.md define it — consistent, premium, minimal, accessible presentation across every real-world rendering context (browser, device, viewport) a buyer or creator actually uses.

## 11.2 Scope

Responsive layout correctness (11.3), cross-browser rendering fidelity (11.4, extending Section 10.3's E2E-level coverage with more targeted, non-journey-specific checks), mobile-specific interaction patterns (11.5), and visual regression detection (11.6) — the four concerns that together ensure the design system (06-design-system.md) is faithfully and consistently rendered everywhere it's used.

## 11.3 Responsive Testing

Every screen documented in 07-ui-screens-wireframes.md is tested at the breakpoint set 06-design-system.md defines (mobile, tablet, desktop, and any named intermediate breakpoints) — verifying not just that content doesn't visually break (no horizontal overflow, no overlapping elements) but that the *information architecture* itself adapts correctly per breakpoint (e.g., a navigation pattern that collapses to a mobile menu below a defined width, per 04-information-architecture.md's navigation model). Responsive checks are implemented as a combination of Component-level tests (Section 7) rendering at specific viewport widths via React Testing Library's viewport-mocking utilities, and a dedicated Playwright responsive-check pass across the Section 10.2 mandatory journeys at each breakpoint.

## 11.4 Cross-Browser Testing

Extends Section 10.3's E2E-level browser-engine coverage (Chromium, WebKit, Firefox) with targeted, non-journey checks for browser-specific CSS/JS behavior known to diverge historically (form-control default styling, date-input behavior, flexbox/grid edge cases, CSS custom-property support underlying the design system's token architecture, 06-design-system.md) — run as a dedicated Playwright suite distinct from the full user-journey E2E suite (Section 10), since these are narrow, targeted rendering checks, not full business-flow verifications, and can therefore run faster and more frequently.

## 11.5 Mobile Testing

Given the Buyer Web App's PWA architecture (11-frontend-architecture.md), mobile testing covers: touch-target sizing (minimum tap-target dimensions per accessibility/usability standards, verified as part of Section 12's accessibility scan), gesture interactions (swipe-based image galleries on Product Detail Pages, per 07-ui-screens-wireframes.md), PWA-specific behavior (install prompt, offline-shell behavior, service-worker cache correctness for the app shell), and viewport-specific input behavior (mobile keyboard types for email/phone/numeric fields, verified at the Component level, Section 7, since this is a per-field concern rather than a full-journey one). Real-device testing (as distinct from browser-engine device emulation) is performed manually (Section 28.4) on a defined minimum device/OS matrix ahead of major releases, since emulation cannot fully substitute for real touch-input and real-device performance characteristics.

## 11.6 Visual Regression Testing

Automated screenshot-diffing (via Playwright's built-in visual comparison capability) runs against a curated set of the platform's most visually significant, highest-traffic screens (homepage, Product Detail Page, Cart, Checkout steps, Creator Dashboard home, per 07-ui-screens-wireframes.md's own prioritization) on every pull request that touches `packages/ui` or a covered screen's components — a pixel-level diff beyond an agreed threshold blocks the PR pending explicit human review and baseline approval (never an automatic fail-and-forget; a genuine, intended design change updates the baseline as part of that same PR, while an unintended regression is caught and fixed). This is the mechanism that most directly protects 06-design-system.md's consistency guarantee against silent drift introduced by seemingly-unrelated changes (a shared component's padding change rippling unnoticed across a dozen screens, for instance).

## 11.7 Standards

| Standard | Requirement |
|---|---|
| Breakpoint coverage | Every screen in 07-ui-screens-wireframes.md tested at minimum at mobile, tablet, and desktop breakpoints. |
| Visual regression threshold | A defined, documented pixel-difference tolerance (accounting for anti-aliasing/font-rendering variance across CI runners) — tight enough to catch real regressions, loose enough to avoid false-positive noise on every run. |
| Real-device matrix | A minimum defined set of physical/emulated devices (current-generation and one-generation-back for both iOS and Android, plus a representative low-end Android device given 00-project-vision.md's broad accessibility-of-craft ambition) reviewed manually before every major release (Section 28.4). |

## 11.8 Responsibilities

Frontend engineers are responsible for responsive/cross-browser correctness of their own components as part of standard development (verified via Section 7's component tests and Section 11.6's automated visual regression); QA owns the manual real-device testing pass (Section 28.4) and the curated visual-regression baseline screen list, expanding it as new high-traffic screens ship.

## 11.9 Success Criteria

- Zero unreviewed visual regressions merge to main (Section 11.6's PR-blocking gate).
- Every Section 10.2 mandatory journey passes at mobile, tablet, and desktop breakpoints.
- The manual real-device matrix (Section 11.7) is executed and signed off before every major release (Section 29).

---

# 12. Accessibility Testing

## 12.1 Objectives

Verify the platform meets **WCAG 2.2 Level AA** conformance (the standard this document adopts as the platform's explicit accessibility bar, consistent with 05-design-principles.md and 06-design-system.md's stated accessibility commitment, and with 08-database-design.md Section 22.7's accessibility-by-construction alt-text requirement) — not as a final pre-launch audit, but as a continuously-enforced property verified at multiple layers throughout development.

## 12.2 Scope and Layered Enforcement

| Layer | What It Catches | Mechanism |
|---|---|---|
| Component tests (Section 7.4) | Per-component accessibility violations (missing labels, incorrect ARIA roles, insufficient color contrast in a component's design-token usage) | Automated `axe-core` scan on every component test run |
| E2E tests (Section 10) | Page-level and flow-level accessibility issues (focus management across a multi-step Checkout flow, 09-api-architecture.md-adjacent Section 9's step model; focus trapping in modals; skip-link presence) | Automated `axe-core` scan integrated into Playwright, run against every Section 10.2 mandatory journey |
| Manual audit | Issues automated scanning cannot detect — genuine screen-reader usability, logical reading order, meaningful (not just present) alt text, keyboard-only full-journey usability | QA/accessibility-specialist manual pass (Section 12.5), pre-release |

## 12.3 Best Practices

- **Keyboard-only navigation is tested for every interactive flow** — every Section 10.2 mandatory journey has a manual (and, where feasible, automated via Playwright's keyboard-simulation API) pass verifying complete task completion using only a keyboard, with visible, logical focus order and no keyboard traps.
- **Screen-reader testing on real assistive technology**, not just automated ARIA-attribute checks — a manual pass using at minimum one desktop screen reader (e.g., NVDA or VoiceOver) and one mobile screen reader (VoiceOver on iOS or TalkBack on Android) against the Section 10.2 mandatory journeys, since automated tools can verify ARIA attributes are *present* but cannot verify the resulting experience is actually *coherent* to a real screen-reader user.
- **Color contrast is verified against design tokens, not ad hoc** — 06-design-system.md's defined color tokens are verified once, centrally, for WCAG AA contrast ratios (normal and large text) as part of the design system's own component tests (Section 7.4), so every component correctly using those tokens inherits compliance by construction rather than needing per-component manual contrast checking.

## 12.4 Standards

| Standard | Requirement |
|---|---|
| Conformance level | WCAG 2.2 Level AA, platform-wide, across all three apps (11-frontend-architecture.md) — no app or screen is exempted. |
| Automated scan pass rate | Zero `axe-core` violations of "serious" or "critical" impact level merge to main, at both the component (Section 7.4) and E2E (12.2) layers. |
| Alt text | Enforced at the API layer already (09-api-architecture.md Section 6.10's mandatory `altText` field on product media uploads) — accessibility testing verifies this enforcement actually blocks a non-compliant upload, and that alt text is rendered correctly (not merely present in the database) on every consuming screen. |
| Focus management | Every modal, drawer, and multi-step flow (Checkout, Section 10.2) traps and restores focus correctly, verified in E2E tests. |

## 12.5 Responsibilities

Frontend engineers are responsible for building accessible components by default (06-design-system.md's shadcn/ui-and-Radix-based foundation provides strong accessibility primitives out of the box — this document's role is verifying that foundation is used correctly, not compensating for its absence). QA owns the manual screen-reader/keyboard-only audit pass, conducted at minimum before every major release and whenever a Section 10.2 mandatory journey changes substantially.

## 12.6 Success Criteria

- Zero serious/critical automated accessibility violations anywhere in the component or E2E suites.
- Every Section 10.2 mandatory journey is fully completable via keyboard-only navigation and via at minimum one screen reader, verified manually before release.
- 06-design-system.md's color tokens maintain WCAG AA contrast ratios, verified as part of the design system's own test suite (not re-verified ad hoc per feature).


---

# 13. Performance Testing

## 13.1 Objectives

Verify the platform meets its stated performance goals under both normal and elevated load — 09-api-architecture.md Section 1.7's scalability goals and 10-backend-architecture.md Section 21's performance strategy translated here into measurable, testable targets, so "the platform is fast" and "the platform scales" are verified claims, not assumptions.

## 13.2 Scope

Frontend performance (Core Web Vitals against 11-frontend-architecture.md's rendering-strategy decisions), API response-time performance (per-endpoint, against 09-api-architecture.md's documented caching/pagination contract), database query performance (against 08-database-design.md Section 27's indexing strategy), and system-level load/stress behavior (13.5–13.6) under simulated concurrent traffic.

## 13.3 Frontend Performance Targets

| Metric | Target | Rationale |
|---|---|---|
| Largest Contentful Paint (LCP) | Under 2.5s on a simulated median mobile connection | Core Web Vitals "good" threshold; directly affects perceived quality for the platform's stated "premium, minimal, modern" positioning (05-design-principles.md). |
| Interaction to Next Paint (INP) | Under 200ms | Ensures Cart/Checkout interactions (09-api-architecture.md Sections 8–9) feel immediate, not sluggish. |
| Cumulative Layout Shift (CLS) | Under 0.1 | Prevents the jarring "content jump" anti-pattern, especially on image-heavy Product listings (08-database-design.md Section 8.3's media galleries). |
| Time to Interactive on the Product Detail Page | Under 3s on simulated 4G | The platform's highest-traffic, conversion-critical screen (03-user-journeys.md). |

Measured via Lighthouse CI (or an equivalent automated Core Web Vitals collection tool) integrated into the CI pipeline (Section 24), run against the Section 10.2 mandatory journeys' key screens on every merge to main, with a regression beyond a defined threshold blocking the build.

## 13.4 API Performance Targets

| Endpoint Category | p95 Latency Target | Rationale |
|---|---|---|
| Public browsing reads (Product list/detail, Search) | Under 200ms | 08-database-design.md Section 2.5's read-heavy optimization philosophy — this is the platform's dominant traffic pattern and must feel instant. |
| Cart/Checkout mutations | Under 400ms | Includes live stock/price revalidation (09-api-architecture.md Section 8.1) — slightly higher budget reflecting genuine synchronous work, still fast enough to not feel laggy. |
| Order placement (`checkout/sessions/{id}/complete`) | Under 1.5s | Includes payment-processor round-trip verification (10-backend-architecture.md Section 16.3) — the platform's most complex synchronous operation, budgeted accordingly. |
| Admin/Analytics reads | Under 800ms | Lower-frequency, internal-only traffic; explicitly a lower priority than buyer-facing latency per 08-database-design.md Section 2.4's OLTP/analytics isolation. |

Measured via automated performance assertions integrated into the API test suite (Section 9) for representative endpoints, plus dedicated load testing (13.5) for realistic concurrent-traffic conditions single-request timing cannot reveal.

## 13.5 Load Testing

Simulates expected production-level concurrent traffic (a defined target, e.g., a specified number of concurrent active sessions during a peak sales period, informed by 00-project-vision.md's growth projections) against a staging environment, verifying: p95/p99 latency remains within Section 13.4's targets under this load, error rate remains at zero for legitimate requests, and the database connection pooler (10-backend-architecture.md Section 10.8) does not exhaust its connection budget. Run on a defined periodic cadence (not per-commit, given cost/duration) and mandatorily ahead of any anticipated high-traffic event (a planned marketing campaign, a seasonal shopping period per 00-project-vision.md's gifting-occasion focus).

## 13.6 Stress Testing

Deliberately pushes traffic **beyond** expected peak load to find the platform's actual breaking point and verify its failure mode is graceful, not catastrophic — specifically verifying: rate limiting (09-api-architecture.md Section 22.5) correctly sheds excess load rather than the system falling over uncontrolled; the Razorpay circuit breaker (10-backend-architecture.md Section 17.5) correctly opens under sustained downstream slowness rather than every request hanging to its full timeout; and the system recovers cleanly (returns to normal latency/error rates) once load subsides, without requiring a manual restart. Stress testing's goal is not to pass at extreme load — it is to confirm the platform degrades predictably and recovers automatically when it inevitably does fail under load, directly verifying 10-backend-architecture.md Section 2.11's fault-tolerance principle under real duress rather than only in isolated unit tests of individual fallback logic.

## 13.7 Database Query Performance

For any new or modified Repository Layer function (10-backend-architecture.md Section 10), an `EXPLAIN ANALYZE` review against representative data volumes (not just the small integration-test fixture set, Section 8.2 — a separate, periodically-refreshed performance-testing dataset sized to represent realistic future scale, per 08-database-design.md Section 2.1's stated millions-of-rows target) is required before merge for any query touching a high-volume table (`Product`, `Order`, `Events`) — directly implementing that document's Section 28.1 and 10-backend-architecture.md Section 21.7's stated code-review gate as an actual, checked practice rather than an aspirational guideline.

## 13.8 Responsibilities

QA/SDET owns load/stress testing infrastructure and cadence (Section 27.5); frontend engineers are responsible for their own Core Web Vitals budget compliance (Section 13.3) as part of standard PR review; backend engineers are responsible for their own query-performance review (Section 13.7) as part of standard PR review for high-volume-table queries.

## 13.9 Success Criteria

- All Section 13.3/13.4 targets met on every main-branch build (frontend) and every API test run (backend, for representative endpoints).
- Load testing (13.5) confirms Section 13.4's latency targets hold at the defined peak-concurrency target with zero elevated error rate.
- Stress testing (13.6) confirms graceful degradation (rate limiting engages, circuit breaker opens, no cascading failure) and full automatic recovery once load subsides.

---

# 14. Database Testing

## 14.1 Objectives

Verify the platform's data layer — schema, constraints, migrations, and Row-Level Security — behaves exactly as 08-database-design.md specifies, since a database-layer defect (a missing constraint, a broken migration, a misconfigured RLS policy) has the widest possible blast radius of any bug category in this document.

## 14.2 Scope

Schema/constraint conformance (does the actual Drizzle schema match every entity, relationship, and constraint 08-database-design.md documents), migration safety (does every migration apply cleanly and reversibly, per 10-backend-architecture.md Section 25.2's backward-compatibility discipline), RLS policy correctness (Section 8.4 of this document, restated here as this level's own explicit concern), and data-integrity invariants (08-database-design.md Section 26.5's cross-row business rules — the ones that can't be expressed as a single-table CHECK constraint).

## 14.3 Best Practices

- **Every migration is tested in both directions** where a down-migration is defined — applying and reverting a migration against a realistic pre-migration dataset, verifying no data loss occurs on a reversible migration and that an irreversible migration (e.g., a data-backfill-dependent column drop) is explicitly documented as such rather than silently assumed reversible.
- **Constraint violations are tested explicitly, not just happy-path inserts** — for every CHECK/unique/foreign-key constraint 08-database-design.md Section 26 documents, a test attempts to violate it and asserts the expected rejection (e.g., attempting to insert a negative `Inventory.availableQuantity`, per that document's Section 26.4, and asserting the database itself rejects it, not just the application layer).
- **Test the full schema against 08-database-design.md's entity list as a checklist**, on a periodic (not per-PR, given cost) audit cadence — every entity in that document's Sections 5–24 has a corresponding, structurally-matching Drizzle schema definition, with no undocumented drift in either direction (an entity documented but not implemented, or a table implemented but not documented).

## 14.4 Standards

| Standard | Requirement |
|---|---|
| Migration reversibility | Every migration explicitly states whether it is reversible; irreversible migrations require an explicit sign-off (Section 26.4's release-gate escalation) before merging. |
| RLS coverage | Every multi-tenant table (`store_id`/`user_id`-scoped, per 10-backend-architecture.md Section 20.9) has a corresponding RLS-policy test verifying cross-tenant denial. |
| Constraint coverage | Every constraint documented in 08-database-design.md Section 26 has at least one test verifying its enforcement. |
| Referential integrity | Every documented cascade/deletion rule (that document's Section 4.5, Section 25) has a test verifying the actual behavior (Restrict blocks deletion with dependents; Soft-cascade correctly propagates a status change without hard-deleting children). |

## 14.5 Responsibilities

Backend engineers writing a schema change or migration write its corresponding tests in the same pull request; QA/SDET conducts the periodic full-schema audit against 08-database-design.md (14.3's checklist practice) ahead of major releases.

## 14.6 Success Criteria

- Every migration in the repository has been tested for clean application against a realistic pre-migration dataset.
- Every documented constraint and cascade rule (08-database-design.md Sections 4.5, 25–26) has a corresponding passing test.
- Zero undocumented drift between 08-database-design.md's entity list and the actual Drizzle schema, verified at each major release audit.


---

# 15. Authentication & Authorization Testing

## 15.1 Objectives

Verify that Better Auth-backed identity (10-backend-architecture.md Section 7) and the platform's layered RBAC/ownership/`ResourcePermission` model (that document's Section 8) correctly and completely gate every protected resource — the single test category where a gap most directly translates into a data breach or account-takeover risk, and therefore tested with the least tolerance for "probably fine" assumptions anywhere in this document.

## 15.2 Scope

Full credential lifecycle (registration, login, logout, refresh, password reset, email/phone verification — 09-api-architecture.md Section 3), session/token security properties (expiry, rotation, reuse detection — 10-backend-architecture.md Section 7.2), the complete RBAC coarse-check matrix (every endpoint × every role, Section 9.4's authorization-matrix testing extended here as its own dedicated concern), ownership/ABAC fine-grained checks (10-backend-architecture.md Section 8.2–8.3), and the immediate-revocation override mechanism (that document's Section 8.5).

## 15.3 Authentication Test Matrix

| Scenario | Expected Result |
|---|---|
| Valid credentials | `200` with access token + refresh cookie set |
| Invalid password | `401 INVALID_CREDENTIALS` (identical response whether email exists or not, per 09-api-architecture.md Section 22.4) |
| Non-existent email | `401 INVALID_CREDENTIALS` (identical to above — explicitly tested for byte-for-byte response equivalence) |
| Suspended/banned account | `403 ACCOUNT_SUSPENDED` / `403 ACCOUNT_BANNED` with support-contact detail |
| Expired access token on a protected request | `401 TOKEN_EXPIRED`, client-transparent refresh succeeds (Section 7.3) |
| Refresh token reuse after rotation | `401 INVALID_REFRESH_TOKEN` **and** a `SecurityEvent` is recorded (10-backend-architecture.md Section 7.2) |
| Password reset request for non-existent email | Generic success response, no account-existence signal leaked (09-api-architecture.md Section 3.6) |
| Password reset completion | All other active sessions revoked (Section 3.7 of that document) |
| MFA-enrolled login (future) | Login response withholds tokens pending MFA challenge completion (09-api-architecture.md Section 3.3) |
| Immediate-revocation flag set (e.g., an active Ban) | Next request with an otherwise-still-valid access token is rejected, forcing re-authentication (10-backend-architecture.md Section 8.5) |

## 15.4 Authorization Test Matrix (RBAC)

For every endpoint documented in 09-api-architecture.md, an automated matrix test asserts, for each of the platform's roles (Guest, Buyer, Creator, Creator Team Member, Admin, Moderator, Support Executive, Super Admin — 01-product-requirements.md Section 3): correct success for authorized roles, `403 FORBIDDEN` for unauthorized roles, `401 UNAUTHENTICATED` for unauthenticated requests where authentication is required. This matrix is generated programmatically from the OpenAPI spec's security annotations (mirroring 10-backend-architecture.md Section 8.1's own generation approach) so the test suite and the enforcement mechanism share one source of truth and cannot silently diverge.

## 15.5 Ownership/ABAC Test Matrix

Beyond role sufficiency, every resource-scoped endpoint is tested for: the correct owner succeeding, a different user of the *same* sufficient role being rejected (e.g., Buyer A cannot view Buyer B's Order, even though both hold the `Buyer` role — 09-api-architecture.md Section 22.3's ownership-check requirement), a Creator Team Member of a *different* Store being rejected from a Store-scoped endpoint (10-backend-architecture.md Section 8.6), and — for the narrow `ResourcePermission`-gated cases (Section 8.3) — a Support Executive without an active escalation grant being rejected from an out-of-scope Order, then succeeding once a time-boxed grant is issued, then being rejected again once it expires.

## 15.6 Best Practices

- **Negative-path testing is not optional** — for every authentication/authorization test, the "should this be rejected" cases outnumber and are given equal rigor to the "should this succeed" case, inverting the more intuitive but wrong instinct to primarily test the happy path here.
- **Session-fixation and token-leakage scenarios are explicitly tested** — verifying the refresh-token cookie is never accessible to JavaScript (`HttpOnly`, 10-backend-architecture.md Section 7.4), never sent cross-origin (`SameSite=Strict`), and never appears in any URL, query string, or non-`HttpOnly` storage anywhere in the frontend (verified via Component/E2E test assertions on network requests and storage APIs).

## 15.7 Responsibilities

Backend engineers implementing a new endpoint's authorization requirement contribute to the generated matrix (15.4) by correctly annotating the OpenAPI spec; QA/SDET owns the ownership/ABAC matrix (15.5)'s ongoing completeness and the dedicated authentication-security test suite (15.3), reviewed with particular scrutiny given this category's risk profile (Section 26.3's risk-tiering).

## 15.8 Success Criteria

- 100% of documented endpoints pass the full role × endpoint authorization matrix (15.4) with no gaps.
- Every scenario in Section 15.3's authentication matrix has a passing, automated test.
- Zero instances of token/credential leakage across storage, URLs, or cross-origin requests, verified in every release cycle.

---

# 16. Payment Testing

## 16.1 Objectives

Verify the complete money-movement path — capture, refund, dispute, settlement, creator payout (10-backend-architecture.md Section 16, 08-database-design.md Section 14) — with the highest rigor of any domain in this document, since a payment-layer defect directly costs a real person real money and directly threatens the platform's foundational trust proposition (00-project-vision.md).

## 16.2 Razorpay Sandbox Strategy

All automated testing (Integration, API, and E2E) against payment flows uses **Razorpay's official test-mode/sandbox environment**, never production credentials, at every test level below manual pre-release verification (Section 28.5) — Razorpay's sandbox provides deterministic test card numbers/UPI handles that simulate specific outcomes (successful capture, specific decline reasons, timeout) on demand, which this test suite relies on explicitly (Section 16.3's scenario matrix) rather than attempting to simulate Razorpay's behavior with hand-rolled mocks wherever the sandbox itself can be exercised directly — real sandbox interaction catches integration-contract drift (10-backend-architecture.md Section 16.2's webhook-signature verification, most importantly) that a purely mocked test cannot.

## 16.3 Payment Scenario Matrix

| Scenario | Verification |
|---|---|
| Successful card payment | `Order` created, `Payment.status = succeeded`, `Commission` computed correctly, inventory decremented (09-api-architecture.md Section 9.10) |
| Declined card (sandbox-simulated decline) | `402 PAYMENT_FAILED` with mapped, stable `code` (09-api-architecture.md Section 23.6); `Reservation` released; cart/checkout session remains valid for retry (Section 11.5 of that document) |
| Payment timeout / network failure mid-capture | No `Order` created; `PaymentIntent` remains in a safely-retryable state (10-backend-architecture.md Section 16.6); no duplicate charge on retry (verified via idempotency, Section 16.5 of that document) |
| Webhook arrives before client confirmation | Order created exactly once via the webhook path; the subsequent client-confirmation call is a safe no-op (10-backend-architecture.md Section 16.3's dual-path idempotency) |
| Webhook arrives after client confirmation | Order already created via client path; webhook processing is a safe no-op |
| Forged/invalid webhook signature | `401`, request rejected before any processing, `SecurityEvent` logged (10-backend-architecture.md Section 16.2) |
| Duplicate webhook delivery (provider retry) | No duplicate `Order`/`Payment` state change (idempotent by event ID, per that document's Section 21.4 of the API doc) |
| Full refund | `Refund` created, `RefundRequest.status` and `Refund` status change atomically (10-backend-architecture.md Section 16.4); Razorpay refund API called with correct amount |
| Partial refund | Correct partial amount reflected across `Refund`, buyer-visible order status, and creator payout computation |
| Refund on an already-fully-refunded order | Rejected with an appropriate conflict error, never a duplicate/over-refund |
| Dispute/chargeback webhook | `Dispute` created (08-database-design.md Section 14.8), Admin alerted (10-backend-architecture.md Section 21.6) |
| Creator payout batch | Correct aggregation of eligible `SubOrder`s net of `Commission` and any `Refund`s (08-database-design.md Section 14.11's money-flow model), correct exclusion of disputed/refunded orders |
| COD (cash on delivery) order | Correctly bypasses Razorpay capture while still creating a valid `Order`/`Payment` record reflecting the COD method, per 09-api-architecture.md Section 11.1's regional-method scoping |

## 16.4 Best Practices

- **Never use real payment credentials or real bank accounts in any automated test**, including staging E2E — Section 16.2's sandbox strategy is non-negotiable across every environment except a final, narrowly-scoped, human-supervised manual production-verification check (Section 30.4) using a real but minimal-value transaction specifically to verify the live integration is correctly configured post-deployment.
- **Test the full audit trail, not just the money movement** — every scenario in Section 16.3 additionally asserts the corresponding `AuditLog`/financial-ledger entries (08-database-design.md Section 14.9–14.10) are correctly written, since 10-backend-architecture.md Section 16.8 treats this as equally load-bearing as the transaction itself.
- **Test the circuit breaker under simulated Razorpay unavailability** — a dedicated test simulates sustained sandbox timeouts and verifies the circuit breaker (10-backend-architecture.md Section 17.5) opens correctly, returns fast `503` responses, and recovers once simulated availability returns.

## 16.5 Standards

| Standard | Requirement |
|---|---|
| Coverage | Every scenario in Section 16.3's matrix has a passing automated test at the appropriate level (Integration for internal logic, API for endpoint contract, a subset via E2E for genuine end-to-end confidence per Section 10.2). |
| No live credentials in CI | Enforced by secrets-scanning (10-backend-architecture.md Section 17.6's secrets-management discipline) and environment-configuration review — the CI environment has no access to production Razorpay credentials at all, structurally, not merely by convention. |
| Financial reconciliation testing | A dedicated test verifies that, across a batch of simulated orders/refunds/disputes, the platform's own `Ledger`/`AccountingEntry` records (08-database-design.md Section 14.9–14.10) reconcile exactly against the simulated Razorpay sandbox transaction history — the single most important test in this section, since it verifies the platform's own books are internally consistent, not merely that individual API calls succeeded. |

## 16.6 Responsibilities

Backend engineers on the Payments module (10-backend-architecture.md Section 5.14) own this suite's implementation; QA/SDET reviews it with the highest scrutiny of any module in the codebase (Section 26.3's risk-tiering) and personally verifies the reconciliation test (16.5) ahead of every release touching Payments.

## 16.7 Success Criteria

- 100% of Section 16.3's scenario matrix passes on every release candidate.
- The financial reconciliation test (16.5) passes with zero discrepancy on every release candidate touching the Payments module.
- Zero live payment credentials ever present in any non-production environment, verified continuously via automated secrets scanning.


---

# 17. Background Job Testing

## 17.1 Objectives

Verify every Inngest job function (10-backend-architecture.md Section 12) executes correctly, retries correctly on transient failure, and — critically — never produces a duplicate or partial side effect on retry, since background jobs are the platform's mechanism for nearly every side effect that isn't strictly synchronous with a user's request (notifications, search indexing, media processing, payouts, analytics, cleanup).

## 17.2 Scope

Every job family named in 10-backend-architecture.md Section 12.4 (`notifications`, `search-indexing`, `media-processing`, `payouts`, `analytics`, `cleanup`), tested for: correct triggering (the right event causes the right job to run), correct step-by-step execution and checkpointing, correct idempotent behavior under Inngest's automatic retry (that document's Section 12.2), and correct terminal behavior on exhausted retries (dead-letter handling, Section 18.5 of that document).

## 17.3 Notification Testing (Within This Domain)

Given notifications' merged Messaging & Notifications module (10-backend-architecture.md Section 5.15), notification-specific testing verifies: the fan-out logic correctly respects a recipient's `NotificationPreferences` (08-database-design.md Section 11.9 — a recipient who opted out of email marketing but not order updates receives the order-update email and not a marketing one, tested as explicit, distinct scenarios); each channel (Email via Resend, Push, In-App, and — where applicable — SMS) is independently retryable and independently failable without affecting sibling channels (10-backend-architecture.md Section 15.6); real-time delivery via Supabase Realtime (that document's Section 15.2) correctly broadcasts a durably-written `Message`/`Notification` to a subscribed client in an Integration-level test simulating a Realtime subscription; and every sent notification's `DeliveryLog` (08-database-design.md Section 17.8) accurately reflects the actual provider-reported outcome.

## 17.4 Job Retry & Idempotency Test Matrix

| Scenario | Expected Result |
|---|---|
| Job step fails transiently (simulated network blip) | Inngest retries only the failed step, not the entire job (10-backend-architecture.md Section 12.2) |
| Job step succeeds but acknowledgment to Inngest is lost, triggering an unnecessary retry | No duplicate side effect (no duplicate email, no duplicate search-index write) — verified via an idempotency-key or upsert-based check in the job step itself |
| Job exhausts its retry budget | Job's terminal failure is recorded (`SystemEvent`, 08-database-design.md Section 23.8); for user-facing consequence jobs, a lower-priority fallback still occurs where documented (10-backend-architecture.md Section 18.5 — e.g., an in-app notification still appears even if email delivery permanently failed) |
| Scheduled (cron) job runs twice due to a scheduler-level overlap | No duplicate `Payout` batch, no duplicate archiving action — verified via the job's own idempotent, state-checking design |
| A burst of triggering events arrives simultaneously (e.g., many `order.placed` events during a simulated flash sale) | Each triggers an independent, correctly-scoped job execution; no cross-contamination between concurrent executions' data (10-backend-architecture.md Section 22.4) |

## 17.5 Best Practices

- **Test jobs at the Integration level primarily** (Section 8), invoking the job function directly against a real test database with the external service call (Resend, Razorpay) mocked at the Integration Layer boundary (10-backend-architecture.md Section 17) — full Inngest-infrastructure-level testing (actually triggering via Inngest's own event system end-to-end) is reserved for a smaller set of E2E-adjacent smoke checks (Section 17.6) verifying the wiring itself, not the business logic within each job.
- **Explicitly test time-based/scheduled jobs with a controllable clock** — cron-triggered jobs (Payout batching, cleanup sweeps) are tested by directly invoking the job function with a mocked "current time" rather than waiting for or attempting to manipulate a real scheduler in tests.

## 17.6 Job Wiring Smoke Checks

A small, dedicated set of tests (run in staging, not full CI on every PR, given their infrastructure dependency) verifies the actual Inngest event-trigger wiring is correctly configured end-to-end — an event emitted by a Service Layer function actually reaches and triggers the intended Inngest function in the deployed environment. This is deliberately separated from Section 17.5's business-logic-focused Integration tests, since "is the event correctly wired" and "does the job's logic behave correctly" are different failure modes worth verifying independently.

## 17.7 Responsibilities

The engineer implementing or modifying a job function writes its Integration-level tests (17.5) in the same pull request; QA/SDET owns the wiring smoke-check suite (17.6) and periodically audits retry/idempotency coverage across all job families.

## 17.8 Success Criteria

- Every job family has passing tests for its documented happy path, its retry behavior, and its terminal-failure behavior (Section 17.4's matrix, applied per job).
- Zero duplicate side effects observed under simulated retry/duplicate-trigger conditions across any job family.
- Notification fan-out correctly respects `NotificationPreferences` in 100% of tested scenarios.

---

# 18. File Upload Testing

## 18.1 Objectives

Verify the shared Media upload pipeline (10-backend-architecture.md Section 11, 09-api-architecture.md Section 20) — the two-phase signed-URL flow, validation, processing, and security controls — behaves correctly across every consuming context (Product media, avatars, review photos, verification documents, message/ticket attachments), since this pipeline is shared platform-wide and a defect here has broad blast radius by construction.

## 18.2 Scope

The full two-phase flow (signed-URL request → direct-to-R2 upload → confirmation → async validation/processing), MIME-type and file-size validation against actual uploaded bytes (never trusting client-declared metadata, per 09-api-architecture.md Section 20.4), virus-scan integration (that document's Section 20.6), image-optimization/thumbnail generation correctness (Section 20.5), and access-control correctness for sensitive media (Section 20.8's signed-URL-per-request pattern for verification documents).

## 18.3 Upload Test Matrix

| Scenario | Expected Result |
|---|---|
| Valid image upload (correct MIME, within size limit) | `uploadStatus` transitions `processing → ready`; thumbnails generated at all documented size variants (08-database-design.md Section 22.4) |
| File with spoofed `Content-Type` (e.g., an executable renamed with a `.jpg` extension and a JPEG MIME type claimed) | Rejected at server-side content-sniffing validation (09-api-architecture.md Section 20.4), never reaches `ready` |
| File exceeding the size limit for its context | `422 FILE_TOO_LARGE`, rejected before any processing begins |
| File failing the virus scan (simulated via a test-only scanner configuration or a known EICAR-style test signature) | Object deleted from R2 entirely, never retrievable by any caller regardless of role (09-api-architecture.md Section 20.6) |
| Product media upload missing required `altText` | `400 VALIDATION_ERROR`, rejected at the request-validation layer before any upload-slot is even issued (09-api-architecture.md Section 6.10) |
| Multipart/chunked upload for a large video file | All chunks correctly assembled; `confirm-multipart` correctly validates chunk completeness (09-api-architecture.md Section 20.3) |
| Sensitive media (verification document) access by an unauthorized caller | `403`/`404` per the anti-enumeration policy applicable to the resource, no signed URL ever generated (10-backend-architecture.md Section 11.5) |
| Sensitive media access by an authorized caller | A freshly-generated, short-lived signed URL is returned, verified to actually expire after its stated window |
| Orphaned upload (never referenced by any resource) | Garbage-collected by the scheduled cleanup job (10-backend-architecture.md Section 12.4) after the defined grace period, verified via a time-mocked Integration test |
| Attempted deletion of media still referenced by another resource | `409 MEDIA_IN_USE` (09-api-architecture.md Section 20.9) |

## 18.4 Best Practices

- **Test against real (small, synthetic) binary files, not just metadata** — MIME-sniffing and virus-scan integration tests must exercise actual file bytes in an Integration-level test against a real (test-configured) R2 bucket, since a purely mocked test of "the validation function returns true/false" would not catch a real content-sniffing library integration bug.
- **Never use real malware samples for virus-scan testing** — the industry-standard EICAR test file (a harmless string recognized by virus scanners as a test signature) is used exclusively for this purpose.

## 18.5 Responsibilities

The Media module's owning engineers (10-backend-architecture.md Section 5.25) maintain this suite; QA/SDET periodically audits it against every consuming module's specific upload context (Product media's alt-text requirement, verification documents' access-control requirement) to ensure context-specific rules aren't only tested in the generic pipeline.

## 18.6 Success Criteria

- Every scenario in Section 18.3's matrix has a passing automated test.
- Zero test failures related to trusting client-declared file metadata over actual content inspection.
- Sensitive media access control is verified with zero gaps across every sensitive-context consumer (verification documents, ticket attachments).

---

# 19. Search & Filtering Testing

## 19.1 Objectives

Verify the Search module (10-backend-architecture.md Section 5.18, 08-database-design.md Section 24) returns correct, relevantly-ranked results, correctly applies structured filters, and correctly maintains its `SearchIndex` read-model as underlying Product/Store/Category data changes — since search is the platform's primary discovery mechanism and a stale or incorrect index directly undermines buyer trust in what's actually available.

## 19.2 Scope

Full-text query matching and ranking (09-api-architecture.md Section 7.1), structured filter/sort correctness (that document's Sections 2.8–2.9 applied to both Search and standard Product-listing endpoints), autocomplete latency and relevance (Section 7.2 of that document), typo-tolerance/synonym behavior (08-database-design.md Section 24.5), and — critically — index-freshness (does a newly-published Product become searchable promptly, does an archived Product stop appearing).

## 19.3 Search Test Matrix

| Scenario | Expected Result |
|---|---|
| Exact title match query | Returned as a top-ranked result |
| Typo'd query with a known synonym/correction mapping | `correctedQuery` populated in response (09-api-architecture.md Section 7.1); relevant results still returned |
| Query combined with structured filters (category + price range) | Results satisfy both the text-relevance match and every structured filter simultaneously |
| Query matching zero products | Empty result set with a correct `resultCount: 0`, no error |
| Newly-published Product | Appears in search results within the documented index-freshness window (verified via an Integration test triggering the `search-indexing` job, 10-backend-architecture.md Section 12.4, and asserting the `SearchIndex` row is created/updated) |
| Archived/paused Product | No longer appears in search or public listing results, even though its underlying row is soft-deleted, not hard-deleted (08-database-design.md Section 2.13) |
| Store in Vacation Mode | Store's Products excluded from search/browse results per 09-api-architecture.md Section 5.7's server-side enforcement |
| Autocomplete query (partial input) | Returns suggestions within the documented latency target (that document's Section 7.2), sourced correctly from the precomputed `Autocomplete` table (08-database-design.md Section 24.4) |
| Search ranking with recency/popularity boosts | A newer or higher-`unitsSold` product ranks above an older, less-popular one for an otherwise-equal text match, verified against the documented weighting (10-backend-architecture.md Section 14.3) |

## 19.4 Best Practices

- **Test index-maintenance asynchronously, with explicit wait/poll assertions**, never assuming instant consistency — since `SearchIndex` updates are Inngest-job-driven (10-backend-architecture.md Section 12.4), tests trigger the underlying event and then poll/wait for the expected index state within a defined timeout, mirroring how the real system actually behaves rather than asserting synchronous consistency that doesn't exist by design.
- **Test filter/search parameter combinations systematically**, not just individually — a combinatorial test matrix (category × price range × material, for a representative sample of realistic combinations) catches interaction bugs a series of single-filter tests would miss.

## 19.5 Responsibilities

The Search module's owning engineers write and maintain this suite; QA/SDET periodically reviews search-relevance quality using `SearchAnalytics` production data (08-database-design.md Section 21.4) to identify real-world zero-result or poor-relevance query patterns worth adding as regression tests.

## 19.6 Success Criteria

- Every scenario in Section 19.3's matrix passes.
- Index-freshness (publish-to-searchable latency) remains within the documented target on every test run.
- Zero instances of an archived/paused/vacation-mode-excluded Product appearing in search results.


---

# 20. Error Handling Validation

## 20.1 Objectives

Verify that every error condition the platform can encounter — from a malformed request to an unexpected internal fault — is handled per 09-api-architecture.md Section 2.15/23's documented envelope and error-code catalog, and per 10-backend-architecture.md Section 18's error-taxonomy/mapping strategy, with no error ever reaching a client as a raw stack trace, an inconsistent shape, or a silently-swallowed failure.

## 20.2 Scope

Every error class in 10-backend-architecture.md Section 18.2's taxonomy (`ValidationError`, `AuthenticationError`, `AuthorizationError`, `NotFoundError`, `ConflictError`, `PaymentError`, `RateLimitError`, `IntegrationError`), verified for correct HTTP status mapping, correct envelope shape, and correct `code` value per 09-api-architecture.md Section 23's catalog; the terminal catch-all handler's behavior for genuinely unexpected exceptions (10-backend-architecture.md Section 18.3); and error-handling behavior specifically within background jobs (Section 17 of this document) and integrations (10-backend-architecture.md Section 17.2's per-service fallback behavior).

## 20.3 Error Handling Test Matrix

| Error Category | Test Verifies |
|---|---|
| Malformed request body | `400 VALIDATION_ERROR` with a complete `details` array covering every invalid field in one response, not just the first (09-api-architecture.md Section 2.15) |
| Business-rule violation (e.g., publishing an incomplete Product) | `422` with the specific documented `code` (e.g., `PRODUCT_NOT_PUBLISH_READY`) and a `details` array enumerating every unmet requirement (that document's Section 6.4) |
| Resource conflict (duplicate idempotency key, mismatched payload) | `409 CONFLICT` with an explanation distinguishing it from a successful idempotent replay |
| Unexpected internal exception (deliberately injected in a test) | Generic `500 INTERNAL_ERROR` returned to the client with **no** internal detail (stack trace, exception message, database error text) present anywhere in the response body; full detail present in server-side logs keyed by `correlationId` (10-backend-architecture.md Section 19.1) |
| Downstream dependency timeout (simulated Razorpay/R2/Resend slowness) | `503 SERVICE_UNAVAILABLE` or `DEPENDENCY_TIMEOUT` per the per-integration fallback behavior documented in 10-backend-architecture.md Section 17.2, never a hung request beyond the documented timeout budget |
| Rate limit exceeded | `429 RATE_LIMIT_EXCEEDED` with correct `Retry-After` and `X-RateLimit-*` headers |
| Anti-enumeration-protected endpoint queried for a non-existent vs. existent-but-unauthorized resource | Identical response in both cases, verified byte-for-byte (09-api-architecture.md Section 22.4) |

## 20.4 Best Practices

- **Deliberately inject failures rather than only testing naturally-occurring ones** — fault-injection testing (forcing a database connection failure, forcing a mocked Razorpay client to throw) is a required technique for verifying the terminal error handler and per-integration fallback behavior, since these paths are, by definition, rarely exercised by normal happy-path development and are exactly where untested code tends to hide.
- **Assert on the *absence* of leaked information, not just the presence of a generic message** — a passing error-handling test for an unexpected exception explicitly asserts the response body does *not* contain a stack trace, a file path, or a database error string, not merely that it contains a generic message (a test that only checks for the presence of an expected field can pass even if additional, leaked fields are also present).

## 20.5 Responsibilities

Every engineer verifies their own code's error paths as part of standard Unit/Integration/API test-writing (Sections 6, 8–9); QA/SDET owns a dedicated fault-injection test suite specifically targeting the terminal error handler and integration fallback behavior, since these cross-cutting paths are easy for individual feature work to under-test.

## 20.6 Success Criteria

- Every error class in the taxonomy (20.2) has passing tests verifying correct status/envelope/code mapping.
- Zero instances of internal exception detail (stack traces, raw database errors) present in any client-facing response, verified via the fault-injection suite.
- Every documented `code` value in 09-api-architecture.md Section 23 has at least one test inducing it and verifying the exact code is returned.

---

# 21. Edge Case Testing

## 21.1 Objectives

Verify the platform correctly handles inputs, states, and timing conditions at the boundaries of what's expected — the class of defect that happy-path testing (Sections 6–10) structurally cannot catch, and which frequently constitutes the actual, real-world source of production incidents.

## 21.2 Categories of Edge Cases

| Category | Representative Examples |
|---|---|
| Boundary values | Zero-quantity cart item; maximum-length text fields (Review body, Message content); a coupon at exactly its minimum-order-value threshold; pagination at exactly `limit: 100` (09-api-architecture.md Section 2.7's stated cap). |
| Concurrency | Two simultaneous requests to decrement the same `ProductVariant`'s last unit of inventory (08-database-design.md Section 9's reservation model, verified to correctly allow only one to succeed); two simultaneous `PATCH` requests to the same Order attempting conflicting status transitions. |
| Empty/null states | A Store with zero Products (storefront renders correctly, not broken); a Cart with zero items (Checkout correctly blocked with `409 CART_EMPTY`, per 09-api-architecture.md Section 9.1); a Product with no Reviews (rating summary renders a correct "no reviews yet" state, not a division-by-zero average). |
| Timing/race conditions | A `Reservation` expiring at the exact moment a buyer submits payment (08-database-design.md Section 9.3); a Product being archived by its creator while a buyer has it in an active cart (09-api-architecture.md Section 6.3's `force=true` override interacting correctly with in-flight carts). |
| Unicode/internationalization-adjacent input | Product titles/Review bodies containing emoji, right-to-left script, or characters outside the basic multilingual plane, verified to store, retrieve, and render correctly without truncation or corruption, even though full internationalization (10-backend-architecture.md Section 27.4) is a future scope. |
| Extremely large/small numeric values | An Order with a very large item quantity (verified against any documented maximum, or verified to be handled gracefully if unbounded); a Product priced at the smallest valid currency unit. |
| Malicious/adversarial input (beyond standard security testing, Section 20.1 of 10-backend-architecture.md) | Deliberately oversized request payloads (09-api-architecture.md Section 24.7's size cap); deeply nested JSON designed to stress a parser; a `?limit=` query parameter attempting to exceed the documented cap. |

## 21.3 Best Practices

- **Maintain a living edge-case registry** — every production incident or bug report that traces back to an untested edge case (Section 27's bug lifecycle) results in a new regression test added to this category, not just a point fix, per Section 3.4's test-first bug-fixing discipline — over time, this registry becomes the platform's own accumulated, battle-tested edge-case knowledge, distinct from and complementing the generic categories in Section 21.2.
- **Deliberately test concurrency with actual concurrent execution**, not just sequential simulation — the inventory-race scenario (21.2) is tested by genuinely firing concurrent requests against a real test database (an Integration-level test, Section 8) and asserting exactly one succeeds, not by reasoning about the code's correctness in the abstract.

## 21.4 Responsibilities

Every engineer considers edge cases for their own feature as part of standard test-writing (Sections 6, 8–9) and PR self-review; QA/SDET owns the cross-cutting living edge-case registry (21.3) and conducts periodic exploratory testing (Section 28) specifically hunting for untested boundary conditions across the platform.

## 21.5 Success Criteria

- Every category in Section 21.2 has representative test coverage across the platform's highest-risk modules (Payments, Orders, Inventory, Cart/Checkout).
- Every historical production incident traceable to an edge case has a corresponding permanent regression test (21.3).
- The concurrency-race test for inventory decrement (21.2) passes reliably under genuine concurrent load, not just sequential simulation.


---

# 22. Test Data Management

## 22.1 Objectives

Ensure every test level has exactly the data it needs — no more, no less — to run deterministically, in isolation, without depending on or polluting shared state, and without ever using real user data.

## 22.2 Fixtures

Each module (10-backend-architecture.md Section 5) maintains a co-located fixture-factory set (e.g., `createTestProduct()`, `createTestOrder()`) producing valid, schema-conformant entities with sensible defaults and easily-overridable fields for the specific scenario under test — factories are composable (`createTestOrder()` internally uses `createTestProduct()`/`createTestUser()` rather than duplicating setup logic), directly modeling 08-database-design.md's own entity-relationship structure so a fixture for a complex entity like `Order` is trivial to assemble correctly without hand-constructing every foreign-keyed dependency inline in each test.

## 22.3 Mocking Strategy

| Boundary | Mocking Approach |
|---|---|
| External services (Razorpay, Resend, R2, PostHog) at Unit/Integration level | Fully mocked via the Integration Layer's client interfaces (10-backend-architecture.md Section 17) — tests assert *that* the client was called correctly, never make a real network call. |
| External services at E2E level | Real sandbox/test-mode environments where the provider offers one (Razorpay, Section 16.2); an internal test-double service otherwise (Resend's test mode or an equivalent captured-mail approach, Section 10.5). |
| API responses at Component-test level | Mock Service Worker (MSW) intercepts network requests at the actual `fetch`/HTTP boundary, so components are tested against realistic response shapes without any real backend — critically, MSW mock handlers are defined against the **same OpenAPI schema** (09-api-architecture.md Section 26.1) the real backend conforms to, so a frontend mock and the real API can never silently diverge in shape without a contract-test failure elsewhere (Section 9.3) surfacing it. |
| Time | A controllable/fake clock (never the real system clock) for any test involving expiry, scheduling, or time-based business logic (`Reservation` TTL, `CheckoutSession` expiry, Payout cadence). |
| Randomness | A seeded/deterministic random-value source for any test involving generated identifiers or randomized selection, ensuring reproducible failures. |

## 22.4 Test Isolation

Every test — at every level — is independently runnable and independently repeatable, with no dependency on execution order or on state left behind by another test: Unit tests have zero shared state by construction (Section 6.4); Integration tests either run within a rolled-back transaction or explicitly clean up their own fixtures (Section 8.3); Component tests reset MSW handlers and any rendered DOM between tests; E2E tests seed their own fully-isolated fixture data per run (Section 10.4) rather than relying on persistent shared staging data. CI enforces this by running test suites with randomized execution order (10-backend-architecture.md Section 24's referenced discipline) specifically to surface any hidden order-dependency as a build failure rather than a silent, latent risk.

## 22.5 Test Data Seeding for E2E and Staging

A dedicated, non-production-exposed seeding API (accessible only within the E2E/staging environment, never deployed to or reachable from production, per Section 23.3's environment separation) allows E2E tests to programmatically create exactly the Users/Stores/Products/Orders a given test journey needs, rather than depending on a shared pool of pre-existing staging data that could be mutated by concurrent test runs or manual QA activity — this is the mechanism referenced in Section 10.4's "independent, fully-seeded test data per run" best practice.

## 22.6 No Real User Data, Ever

Under no circumstances is real, production user data (even anonymized or "scrubbed") used in any non-production test environment — this is a hard, non-negotiable rule, not merely a best practice, directly extending 08-database-design.md Section 29's PII/GDPR-readiness posture: synthetic, fixture-generated data (22.2) is always sufficient for this platform's testing needs, and the risk of an imperfect anonymization process leaking real personal or financial data into a lower-security test environment is never an acceptable trade for the marginal realism gained.

## 22.7 Responsibilities

Each module's owning engineers maintain that module's fixture factories (22.2); QA/SDET owns the E2E seeding API (22.5) and the platform-wide mocking-strategy conventions (22.3), ensuring new integrations added to the platform follow the established pattern rather than each introducing a bespoke mocking approach.

## 22.8 Success Criteria

- Zero tests, at any level, depend on execution order (verified by CI's randomized-order enforcement).
- Zero instances of real user data present in any non-production environment, verified by periodic audit.
- Every module has a complete, composable fixture-factory set covering its own entities.

---

# 23. Test Environment Strategy

## 23.1 Environment Tiers

| Environment | Purpose | Data | Access |
|---|---|---|---|
| Local | Individual developer iteration (Section 3.2) | Locally-seeded synthetic fixtures, ephemeral | Developer's own machine |
| CI (ephemeral, per-run) | Automated test execution (Section 24) | Freshly-provisioned, migrated, fixture-seeded per run, destroyed after | CI pipeline only, no human access |
| Staging | E2E testing (Section 10), manual QA (Section 28), pre-release verification | Synthetic, seeded via the dedicated seeding API (Section 22.5), periodically reset | Engineering + QA team |
| Production | Real platform traffic | Real user data | End users; internal access strictly limited and audited (10-backend-architecture.md Section 20.9) |

## 23.2 Environment Parity

Staging runs the identical application build (the same Vercel deployment artifact, per 10-backend-architecture.md Section 25.5's blue/green-equivalent deployment model) and the identical Supabase Postgres schema-migration state as would be promoted to production — the only intentional differences are: third-party services run in sandbox/test mode (Razorpay, Section 16.2; Resend's test-mode/captured-mail equivalent) rather than live mode, and data is entirely synthetic (Section 22.6). This parity is what makes staging E2E results (Section 10) a trustworthy predictor of production behavior rather than a false-confidence exercise against a meaningfully different system.

## 23.3 Third-Party Service Configuration Per Environment

| Service | Local/CI | Staging | Production |
|---|---|---|---|
| Razorpay | Fully mocked (Section 22.3) | Sandbox/test mode (Section 16.2) | Live mode |
| Resend | Fully mocked / captured | Test mode or a captured-inbox equivalent | Live sending |
| Cloudflare R2 | A local/CI-scoped test bucket | A staging-scoped bucket, isolated from production assets | Production bucket |
| Supabase Postgres | Ephemeral per-CI-run instance | A persistent but regularly-reset staging project | Production project |
| Sentry / PostHog | Disabled or a dedicated non-production project | A dedicated staging project, tagged distinctly from production events | Production project |

## 23.4 Environment Provisioning and Reset

CI environments are provisioned fresh per run and destroyed immediately after (Section 22.4's isolation guarantee extended to the infrastructure level, not just application-level state) — this is a deliberate, non-negotiable practice specifically to prevent the class of bug where tests pass locally or in a "warm" shared CI environment but fail against a truly clean deploy. Staging is reset on a defined periodic cadence (e.g., nightly) to prevent slow accumulation of test-generated cruft from degrading its usefulness as a realistic pre-release environment, with the E2E seeding API (Section 22.5) responsible for populating whatever specific data a given testing session needs after each reset.

## 23.5 Responsibilities

DevOps/platform engineering owns environment provisioning and parity maintenance; QA/SDET owns the staging reset cadence and flags any observed environment drift (a staging-only bug that doesn't reproduce, or a production bug that staging failed to catch) as an environment-parity defect to investigate and close, not merely a one-off anomaly to work around.

## 23.6 Success Criteria

- Staging environment configuration drift from production (beyond the intentional differences in Section 23.3) is reviewed and reconciled on a defined cadence.
- Zero CI test runs share state with a prior run (verified structurally by the ephemeral-provisioning approach itself).
- Every staging-vs-production behavioral discrepancy discovered is root-caused to a specific, documented environment difference, never left unexplained.

---

# 24. CI/CD Test Pipeline

## 24.1 Pipeline Stages

Extends 10-backend-architecture.md Section 25.1's stated CI stages with this document's full testing-strategy detail:

```
PR opened/updated
   │
   ▼
[Type Check] ── TypeScript strict mode, zero `any` outside justified exceptions
   │
   ▼
[Lint] ── includes module-boundary rules, no-raw-process.env, no-console.log
   │        (10-backend-architecture.md Section 26.2)
   ▼
[Unit Tests] ── full suite, all affected packages (Section 6)
   │
   ▼
[Component Tests] ── full suite, all affected packages, incl. axe-core scan (Section 7)
   │
   ▼
[Integration Tests] ── ephemeral test database provisioned (Section 8)
   │
   ▼
[API / Contract Tests] ── full suite + OpenAPI conformance check (Section 9)
   │
   ▼
[Build Verification] ── `next build` succeeds cleanly across all three apps
   │
   ▼
[Fast E2E Subset] ── Chromium-only, Section 10.2's mandatory journeys (on merge to main)
   │
   ▼
[Visual Regression] ── screenshot diff against baseline (Section 11.6)
   │
   ▼
[Lighthouse CI] ── Core Web Vitals budget check (Section 13.3)
   │
   ▼
Merge permitted / Deployment proceeds
```

Nightly and pre-release pipelines additionally run: the full cross-browser E2E suite (Section 10.6), load testing (Section 13.5), and the full accessibility manual-audit trigger (Section 12.5, scheduled as a human task, not automated).

## 24.2 Smoke Testing (Post-Deployment)

Immediately after any deployment (to staging or production), an automated smoke-test suite — a small, fast (under one minute) set of checks confirming the deployment is fundamentally alive — runs against the actual deployed environment: the health endpoints respond (10-backend-architecture.md Section 19.7), a representative read endpoint from each major resource group returns successfully, and the database/Redis connectivity checks pass. A failed smoke test triggers an automatic rollback consideration (Section 30.3) before any broader traffic exposure, never proceeding to declare a deployment successful on the strength of the build/test stages alone without this final live-environment confirmation.

## 24.3 Regression Testing (Automated Portion)

The full accumulated automated test suite (Unit through E2E) **is** the platform's primary regression-testing mechanism by construction — every bug fixed per Section 3.4's test-first discipline leaves behind a permanent regression test, and every merge to main re-runs the complete relevant suite, meaning a regression (a previously-fixed bug recurring) is caught the moment it's reintroduced, not discovered later in manual testing or, worse, in production. The nightly full-suite run (Section 24.1) exists specifically to catch regression risk from cross-cutting changes (a shared package update, a dependency upgrade) that might not be exercised by any single day's pull requests individually.

## 24.4 CI Test Execution Standards

| Standard | Requirement |
|---|---|
| Parallelization | Test suites run in parallel across available CI workers, split by package/module (leveraging Turborepo's dependency-graph-aware task scheduling, 11-frontend-architecture.md Section 3.3), to keep the standard PR feedback loop within a target ceiling (e.g., under 10 minutes for the full Section 24.1 pipeline excluding nightly-only stages). |
| Determinism | Randomized test execution order (Section 22.4) is the CI default, not an occasional check, to continuously surface hidden order-dependencies. |
| Blocking | No stage in Section 24.1's pipeline is advisory-only for a standard PR — every stage must pass for merge to be permitted (10-backend-architecture.md Section 25.1's stated no-bypass posture, restated here as this document's own binding standard). |

## 24.5 Flaky Test Policy

A test that fails intermittently without a corresponding code change is **quarantined immediately** upon detection (automatically removed from the blocking pipeline and flagged with a tracked, owned ticket) — never left in the blocking pipeline "for now," since a known-flaky blocking test trains engineers to reflexively re-run failures rather than investigate them, corroding the entire suite's credibility. A quarantined test has a defined resolution SLA (fixed or deliberately deleted within a short, tracked window) and quarantine status is visible platform-wide (a dashboard or equivalent, Section 31), never silently accumulating as permanent, ignored red noise.

## 24.6 Responsibilities

DevOps/platform engineering owns the CI pipeline's infrastructure and performance (parallelization, caching, Section 24.4); every engineer is responsible for immediately investigating and either fixing or properly quarantining a flaky test they encounter (Section 24.5), rather than re-running the pipeline until it passes.

## 24.7 Success Criteria

- The standard PR pipeline (Section 24.1, excluding nightly-only stages) completes within its target time ceiling on the large majority of runs.
- Zero known-flaky tests remain in the blocking pipeline at any time (Section 24.5's quarantine discipline).
- Every production deployment passes its post-deployment smoke test (Section 24.2) before being considered complete.


---

# 25. Code Coverage Policy

## 25.1 Coverage as a Diagnostic, Not a Goal

Restated from Section 1.7/4.4: a coverage percentage is a **diagnostic signal** pointing at *possibly* under-tested code, never a target engineers write low-value tests to satisfy. A module hitting 100% line coverage with tests that never assert meaningful behavior (Section 6.3's rejected anti-pattern) provides less real confidence than a module at 80% coverage where every test asserts a genuine business rule or edge case. This policy's numeric targets (25.2) exist to flag areas warranting a closer look, not as an automatic release-blocking metric in isolation from human judgment about *what* is and isn't covered.

## 25.2 Coverage Targets by Risk Tier

| Risk Tier | Modules | Minimum Line Coverage | Minimum Branch Coverage |
|---|---|---|---|
| Critical (financial/trust-critical) | Payments, Orders, Checkout, Auth, Moderation (10-backend-architecture.md Sections 5.14, 5.12, 5.11, 5.2, 5.20) | 90% | 85% |
| High (core commerce) | Products, Inventory, Cart, Stores, Reviews | 85% | 75% |
| Standard | Messaging & Notifications, Search, Support, CMS, Media | 75% | 65% |
| Low (low-risk, low-change-frequency) | Settings & Feature Flags, Audit (write-only, largely exercised transitively by every other module's tests) | 60% | 50% |

These targets apply to the combined Unit + Component + Integration test suites for each module; API and E2E coverage (Sections 9–10) are tracked separately by *endpoint*/*journey* completeness (Sections 9.7, 10.8) rather than by line percentage, since HTTP-boundary and full-journey tests are not naturally suited to line-coverage measurement of the underlying business logic they exercise indirectly.

## 25.3 Coverage Reporting

Coverage is measured and reported per pull request (delta against the base branch — did this PR's new code meet its module's tier target, not merely "did overall coverage not decrease," which would allow a large PR to dilute a real gap) and tracked platform-wide over time (Section 31.1's metric) to catch slow erosion that no single PR's delta view would reveal.

## 25.4 Exemptions

Generated code (Drizzle schema type exports, OpenAPI-generated client types), pure configuration files, and trivial re-export/barrel files are excluded from coverage measurement entirely — including them would dilute the signal this policy exists to provide without representing any genuine testing gap.

## 25.5 Responsibilities

Each module's owning engineers are responsible for meeting their tier's coverage target for new/modified code (Section 25.3's delta view); QA/SDET reviews platform-wide coverage trends (Section 31.1) and flags sustained decline in any Critical or High tier module as requiring dedicated attention, independent of any single feature's PR review.

## 25.6 Success Criteria

- Every pull request's new/modified code meets its module's tier-appropriate coverage target (25.2).
- No Critical or High tier module's overall coverage trends downward over a sustained period without an explicit, reviewed justification.
- 100% of Critical-tier modules' documented business rules (traced to 08-database-design.md Section 26.5 and 09-api-architecture.md Section 23.5's catalogs) have at least one covering test, independent of raw line-coverage percentage.

---

# 26. Quality Gates

## 26.1 Gate Overview

A quality gate is a checkpoint — automated or human — that must pass before code advances to the next stage. This document defines gates at three points: **code merge** (26.2), **release** (26.3–26.4), and **post-release verification** (Section 30). Every gate has a stated owner and a stated bypass procedure for genuine emergencies (26.5) — no gate in this platform exists as an unexplained, unaccountable blocker.

## 26.2 Code Quality Gate (Merge-Blocking)

| Check | Requirement | Bypassable? |
|---|---|---|
| Type check | Zero TypeScript errors | No |
| Lint | Zero errors (warnings reviewed, not necessarily blocking, per team convention) | No |
| Unit/Component/Integration tests | 100% passing, no skipped/`.only`-restricted tests | No |
| API/Contract tests | 100% passing, zero OpenAPI schema drift | No |
| Coverage (new/modified code) | Meets the module's risk-tier target (Section 25.2) | Yes, with explicit reviewer sign-off and a tracked follow-up ticket, for genuinely low-risk gaps only |
| Code review approval | At least one approving review, with explicit test-quality assessment (Section 3.5) | No |
| Visual regression (if `packages/ui` or a covered screen touched) | No unreviewed pixel diff beyond threshold (Section 11.6) | Yes, via explicit baseline-update approval as part of the same PR |

## 26.3 Release Risk Tiering

Every release is classified by risk, driving which additional gates (26.4) apply beyond the standard merge gate already satisfied by every constituent PR:

| Risk Tier | Trigger | Additional Required Gates |
|---|---|---|
| Tier 1 — Critical | Any change touching Payments, Checkout, Auth, or a database migration | Full E2E suite (all browsers), load testing if traffic-pattern-relevant, manual QA sign-off (Section 28), financial reconciliation test (Section 16.5), Product/Founder sign-off |
| Tier 2 — Standard | Any change touching a High or Standard risk-tier module (Section 25.2) not otherwise Tier 1 | Fast E2E subset, full accessibility automated scan, QA smoke pass |
| Tier 3 — Low-risk | Content/copy changes, CMS-only changes, low-risk-tier module changes | Standard merge gate only; no additional release-specific gate |

## 26.4 Release Quality Gate

Beyond the per-PR merge gate (26.2), a release (a deployment promoted to production) additionally requires, scaled by its risk tier (26.3): the full E2E suite passing on the target commit (Section 10.6), zero open Critical/High-severity defects (Section 27.2) against the release scope, the release-readiness checklist (Section 29) fully signed off, and — for Tier 1 releases specifically — explicit, named human sign-off beyond automated gates, since some risks (a subtle payment-reconciliation edge case, a moderation-policy change with real user-impact judgment involved) warrant a human decision-maker's explicit accountability, not only a green CI pipeline.

## 26.5 Security Validation Checkpoints

Layered throughout, not a single end-of-pipeline gate: dependency-vulnerability scanning on every dependency change (10-backend-architecture.md Section 24.7 restated as an enforced gate here), the full authentication/authorization matrix (Section 15.4–15.5) passing as part of the standard merge gate for any change touching Auth or a protected endpoint, secrets-scanning confirming no credential ever appears in a diff (10-backend-architecture.md Section 17.6), and a mandatory security-focused review (beyond standard code review, Section 3.5) for any Tier 1 release (26.3) touching Payments, Auth, or PII-handling code.

## 26.6 Bypass Procedure

For the narrow set of gates marked bypassable (26.2) or for a genuine, rare production-emergency hotfix that cannot wait for the full standard pipeline: a bypass requires explicit, named sign-off from a designated senior engineer or engineering lead (never a unilateral individual decision), a mandatory follow-up ticket restoring full gate compliance within a short, tracked window, and a retrospective note explaining why the bypass was necessary — logged and reviewed, never silent, mirroring 10-backend-architecture.md's own posture on accountable exceptions (that document's Section 8.5's revocation-override pattern, applied here to process rather than authorization).

## 26.7 Responsibilities

Engineering leads own the gate definitions themselves (this section); every engineer is subject to and benefits from the gates equally, with no role-based exemption from the standard merge gate (26.2); QA/SDET owns the release-risk-tiering judgment (26.3) for any release whose classification isn't immediately obvious from its changed-module list alone.

## 26.8 Success Criteria

- Zero merges to main bypass the standard code quality gate (26.2) without a logged, accountable exception (26.6).
- Every Tier 1 release (26.3) has documented, named human sign-off before production deployment.
- Zero Critical or High-severity defects (Section 27.2) remain open against any released scope at the time of release.


---

# 27. Bug Management Process

## 27.1 Bug Lifecycle

```
Reported ──► Triaged ──► Confirmed ──► In Progress ──► Fixed ──► Verified ──► Closed
    │                        │                                       │
    │                        ▼                                       ▼
    │                  Cannot Reproduce                        Reopened (if verification fails)
    │                  (returned to reporter
    │                   for more detail)
    ▼
Duplicate (merged into
an existing report)
```

Every bug, regardless of source (automated test failure, manual QA finding, production incident, user report via Support — 09-api-architecture.md Section 15), enters this same lifecycle — there is no separate, less-rigorous path for "small" bugs, though severity (27.2) determines *urgency* and *rigor of verification*, not whether the lifecycle itself is followed.

## 27.2 Defect Severity Matrix

| Severity | Definition | Example | Response Expectation |
|---|---|---|---|
| Critical | Data loss/corruption, financial miscalculation, security vulnerability, or complete inability to complete a core journey (checkout, login) for any user | An overcharge during payment capture; an authentication bypass; inventory decrementing twice for one order | Immediate — treated as an incident (Section 27.6), fix and verify before any other work, hotfix release if already in production |
| High | A core journey is degraded or fails for a significant subset of users, with no reasonable workaround | Checkout fails for a specific, common payment method; search returns no results for a broad query category | Fixed within the current release cycle; blocks release if discovered pre-release (Section 26.4) |
| Medium | A non-core feature is broken, or a core feature has a workaround | A Creator Dashboard analytics chart renders incorrectly; a notification preference doesn't persist correctly | Scheduled for a near-term release; does not block an in-progress release unless it regresses further |
| Low | Cosmetic, minor UX friction, or an edge case with negligible real-world blast radius | A minor visual misalignment; a slightly awkward error-message wording | Backlogged, addressed opportunistically or in a dedicated quality-focused cycle |

Severity is assessed by **blast radius and consequence**, not by how the bug was found — a Critical bug found by an automated test is treated with the same urgency as one found in production, since the lifecycle (27.1) and severity matrix are about the bug's actual impact, not its discovery channel.

## 27.3 Triage

Every newly-reported bug is triaged (severity assigned per 27.2, module/owner identified per 10-backend-architecture.md Section 5's ownership map, and a reproduction attempt made) within a defined SLA scaled by initially-apparent severity — a report that looks potentially Critical is triaged immediately, regardless of when during the day/week it arrives; a report that looks Low is triaged within the standard daily/weekly cadence.

## 27.4 Regression Test Requirement

Per Section 3.4's test-first discipline, **every** bug fix, regardless of severity, is accompanied by a regression test reproducing the original failure and confirming the fix resolves it — a bug fix pull request without a corresponding new/updated test is not mergeable (an extension of Section 26.2's code quality gate specifically to bug-fix PRs), since a fix without a regression test offers no protection against the exact same bug recurring later.

## 27.5 QA Workflow and Ownership

QA/SDET's role in this process spans: strategic test-coverage ownership (deciding where deeper Integration/E2E/manual investment is warranted, informed by Section 31's metrics and this section's bug-pattern history), exploratory/manual testing (Section 28) that automation cannot replace, release-readiness judgment (Section 29) synthesizing all of the above into a go/no-go recommendation, and triage/severity-assessment partnership with engineering (27.2–27.3) — QA is not a gate that merely blocks or approves after the fact; it is embedded throughout the lifecycle from Section 3.1 onward, consistent with Section 2.3's "quality is everyone's responsibility" philosophy applied specifically to how the QA function itself operates within the team.

## 27.6 Incident Process (Critical Production Bugs)

A Critical-severity bug discovered in production is handled as an incident, not a standard bug ticket: immediate assessment of whether an automatic rollback (10-backend-architecture.md Section 25.3, Section 30.3 of this document) resolves it faster than a forward-fix, immediate communication to affected stakeholders (Support, per that module's escalation path, 09-api-architecture.md Section 15.4), a fix following the same test-first regression discipline (27.4) as any other bug, and a mandatory blameless post-incident review identifying whether a gap in this document's testing strategy (a missing test category, an insufficiently rigorous gate) contributed to the bug reaching production, with any identified gap resulting in a concrete addition to this document or the test suite, not merely a retrospective note.

## 27.7 Success Criteria

- Every bug follows the full lifecycle (27.1) with no undocumented shortcuts for any severity level.
- 100% of merged bug fixes include a corresponding regression test (27.4).
- Every Critical-severity production incident has a completed blameless post-incident review resulting in a concrete process or test-suite improvement (27.6).

---

# 28. Manual QA Checklist

## 28.1 Objectives

Define the scope of testing that remains deliberately human-driven — exploratory testing, real-device verification, and judgment-based checks automation is not well-suited to — performed on a defined cadence ahead of every release, scaled by that release's risk tier (Section 26.3).

## 28.2 Exploratory Testing

Unscripted, judgment-driven probing of the platform by a QA specialist, deliberately without a fixed script, specifically to find the class of issue a written test case (which only checks what someone thought to write down in advance) cannot — conducted against every Tier 1 release (Section 26.3) and periodically against the platform broadly (not tied to any specific release) to catch slow-accumulating UX friction or cross-feature interaction issues no single feature's testing would surface.

## 28.3 Pre-Release Manual Checklist (Tier 1/2 Releases)

- [ ] Complete the full Section 10.2 mandatory journey set manually, on at least one real mobile device and one desktop browser, independent of the automated E2E suite (a human catches subjective quality issues — awkward copy, confusing flow — that a passing automated assertion does not).
- [ ] Verify the specific feature(s) in this release against their acceptance criteria (Section 29.3), not just that "it works," but that it works as *specified*.
- [ ] Execute the real-device matrix pass (Section 11.7) for any release touching a visually significant screen.
- [ ] Conduct the manual accessibility pass (Section 12.5) — keyboard-only and screen-reader — for any release touching a Section 10.2 mandatory journey.
- [ ] Verify all release-relevant notifications (email, in-app, push — Section 17.3) render correctly and contain accurate content, checked against a real (test-mode) delivery, not just an automated content-assertion.
- [ ] Verify the specific bug fixes included in this release are confirmed resolved manually, in addition to their automated regression test (Section 27.4) — a second, independent confirmation before considering a fix release-ready.
- [ ] Review Sentry/error-monitoring dashboards (10-backend-architecture.md Section 19.6) from the staging environment's recent activity for any unexpected error signal not otherwise flagged.

## 28.4 Real-Device Testing Matrix

A minimum defined set, reviewed and updated periodically as device/OS market share shifts: current-generation and one-generation-back iPhone (Safari), a current-generation and a representative mid-range Android device (Chrome), and desktop coverage across Chrome, Safari, Firefox, and Edge — chosen to balance genuine device/browser-engine diversity against the practical cost of maintaining and executing a matrix, per 00-project-vision.md's stated ambition of broad accessibility across the craft-buying audience, which skews toward requiring solid support on a mid-range Android device specifically, not just flagship hardware.

## 28.5 Manual Payment Verification

Restated from Section 16.4/30.4: a narrowly-scoped, human-supervised check using a real (minimal-value) transaction against the live Razorpay integration is performed once per production deployment that touches the Payments module, specifically to catch live-configuration issues (an incorrect live API key, a misconfigured live webhook endpoint) that sandbox testing (Section 16.2), by its nature, cannot reveal.

## 28.6 Responsibilities

QA owns the full manual testing program (28.2–28.5); for Tier 2/3 releases (Section 26.3) with no Payments/Auth/migration involvement, the manual checklist (28.3) is abbreviated to only the items relevant to that release's actual changed scope, per this document's stated risk-proportional rigor principle (Section 1.7).

## 28.7 Success Criteria

- Every Tier 1 release has a fully completed, signed-off manual checklist (28.3) before deployment.
- The real-device matrix (28.4) is executed and passes for every release touching a visually significant screen.
- Manual payment verification (28.5) is performed and confirmed successful for every Payments-touching production deployment.


---

# 29. Release Readiness Checklist

## 29.1 Objectives

Synthesize every gate and check defined in this document into a single, final, risk-tier-scaled checklist that produces an unambiguous go/no-go decision for any given release — the point at which every prior section's evidence is assembled and reviewed together, rather than trusted individually and never re-examined as a whole.

## 29.2 Release Readiness Checklist

- [ ] Standard code quality gate (Section 26.2) passed for every constituent pull request.
- [ ] Release risk tier correctly classified (Section 26.3), with all corresponding additional gates satisfied.
- [ ] Full E2E suite (Section 10) passing on the release candidate commit, across the required browser/device matrix for this tier.
- [ ] Zero open Critical or High-severity defects (Section 27.2) against this release's scope.
- [ ] Coverage targets (Section 25.2) met for all new/modified code in this release.
- [ ] Manual QA checklist (Section 28.3) completed and signed off, scaled to this release's tier.
- [ ] Performance targets (Section 13.3–13.4) verified with no unaddressed regression.
- [ ] Accessibility automated scan (Section 12.2) shows zero serious/critical violations; manual pass (Section 12.5) completed for Tier 1/2 releases touching a mandatory journey.
- [ ] Security validation checkpoints (Section 26.5) cleared, including dependency-vulnerability scan and, for Tier 1, dedicated security review.
- [ ] Database migrations (Section 14, 10-backend-architecture.md Section 25.2) tested for clean application and documented reversibility status.
- [ ] Payment scenario matrix (Section 16.3) and financial reconciliation test (Section 16.5) passing, for any release touching Payments.
- [ ] Rollback plan confirmed and understood (Section 30.3) before deployment begins.
- [ ] Named human sign-off obtained for Tier 1 releases (Section 26.4).

## 29.3 Acceptance Criteria as the Underlying Standard

Every checklist item above ultimately traces back to a feature or fix's originally-defined acceptance criteria (Section 3.6) — release readiness is not "did the generic checklist pass" in the abstract, but "does this release satisfy what was specifically promised for it," with the checklist serving as the structured, repeatable mechanism for confirming that promise was kept across every relevant quality dimension.

## 29.4 Go/No-Go Decision

For Tier 1 releases, a named decision-maker (an engineering lead or equivalent, per Section 26.4) reviews the completed checklist (29.2) and makes an explicit go/no-go call, documented (not verbal/informal) — a checklist with every item checked is the *input* to this decision, not a substitute for it, since a human reviewing the whole picture may still identify residual risk (e.g., a Section 21 edge case discovered late, a borderline performance regression) worth a deliberate delay even with every individual gate technically green.

## 29.5 Success Criteria

- 100% of production releases have a fully completed Section 29.2 checklist on record.
- Every Tier 1 release has a documented, named go/no-go decision (29.4), not an implicit "CI was green so we shipped."

---

# 30. Production Verification

## 30.1 Objectives

Confirm, after a deployment reaches production, that it behaves correctly under real conditions — the final verification layer, since staging parity (Section 23.2) is deliberately close but never claimed to be perfect, and some classes of issue (real third-party live-mode configuration, real-world traffic patterns) can only be confirmed in production itself.

## 30.2 Post-Deployment Verification Checklist

- [ ] Automated smoke test (Section 24.2) passes immediately post-deployment.
- [ ] Sentry error rate (10-backend-architecture.md Section 19.6) remains at its pre-deployment baseline or better for a defined observation window (e.g., 30–60 minutes) post-deployment, with any spike investigated before the deployment is considered stable.
- [ ] Core Web Vitals (Section 13.3) from real-user monitoring (RUM, via PostHog or an equivalent field-data source) remain within target for the deployed changes.
- [ ] For any release touching Payments: manual payment verification (Section 28.5) completed successfully against the live integration.
- [ ] For any release touching a background job (Section 17): the first scheduled/triggered execution post-deployment is confirmed to complete successfully, not merely assumed correct because staging tests passed.
- [ ] Key business metrics (order-placement rate, checkout-completion rate — 08-database-design.md Section 21) remain within expected range, with any significant deviation investigated as a potential silent regression before being attributed to normal traffic variance.

## 30.3 Rollback Verification

Before any Tier 1/2 deployment begins, the rollback path is explicitly confirmed, not merely assumed available: the prior Vercel deployment remains addressable and instantly promotable (10-backend-architecture.md Section 25.3); any database migration included in this release has been confirmed to leave the schema in a state the *prior* application version still functions correctly against (that document's Section 25.2's backward-compatibility discipline) — the specific test for this is re-running the prior version's full API test suite (Section 9) against the *new*, post-migration schema in a pre-deployment staging check, confirming rollback wouldn't itself introduce a new failure. If a migration is genuinely irreversible or the prior version would not function against the new schema, this is flagged explicitly during release readiness (Section 29.2) as elevated risk requiring additional sign-off, not discovered for the first time during an actual rollback attempt under incident pressure.

## 30.4 Live Third-Party Integration Verification

For Razorpay specifically (Section 28.5): a real, minimal-value transaction is completed against the live integration immediately post-deployment for any release touching Payments, confirming live API keys, live webhook endpoint registration, and live signature-verification configuration are all correctly in place — this is the single check in this entire document that deliberately uses real (if minimal) money movement, precisely because it verifies a class of configuration error (a staging-vs-production credential or webhook-URL mismatch) that no sandbox test, however thorough, can reveal.

## 30.5 Responsibilities

DevOps/platform engineering owns the automated smoke-test and monitoring-baseline verification (30.2); QA owns manual payment/integration verification (30.4) and confirms rollback readiness (30.3) as part of release sign-off (Section 29.4); the on-call engineer for the deployment window owns active monitoring during the post-deployment observation window and the decision to trigger rollback if verification fails.

## 30.6 Success Criteria

- Every production deployment completes its full Section 30.2 checklist within the defined observation window before being declared stable.
- Rollback readiness (30.3) is explicitly confirmed, never assumed, for every Tier 1/2 deployment.
- Zero production incidents traced to a live-configuration issue that Section 30.4's verification, had it been performed, would have caught.

---

# 31. Testing Metrics

## 31.1 Coverage Trend

Tracked per module against Section 25.2's risk-tier targets, over time (not just per-PR) — the metric that reveals slow erosion no single pull request's delta view would catch.

## 31.2 Defect Escape Rate

The proportion of bugs discovered in production versus those caught pre-production (by any automated or manual test level, Sections 6–21, 28) — the single most important metric in this document for judging whether the testing strategy as a whole is working, since it directly measures what actually reached real users despite everything upstream. A rising escape rate for any severity tier (Section 27.2) is treated as a signal to invest in a specific, identified test-level gap (traced via Section 27.6's post-incident review), not addressed by generically "writing more tests."

## 31.3 Test Suite Execution Time

Tracked per test level (Unit, Component, Integration, API, E2E) against the target ceilings implied by Section 4.3's pyramid design and Section 24.4's CI standards — a sustained upward trend in any level's execution time is treated as a maintainability signal requiring attention (parallelization, test-suite pruning of redundant coverage) before it degrades the fast-feedback principle (Section 2.5) this entire strategy depends on.

## 31.4 Pyramid Shape Health

The actual, current ratio of tests across levels (Section 4.3) tracked over time — a drift toward an inverted pyramid (disproportionate growth in E2E tests relative to Unit/Component/Integration) is flagged and investigated as a structural regression in testing discipline, since it signals engineers reaching for slow, expensive E2E coverage to compensate for gaps at faster levels rather than closing those gaps directly.

## 31.5 Flaky Test Count

The number of tests currently in quarantine (Section 24.5) and their average time-to-resolution — tracked as a leading indicator of overall suite health and engineering trust in CI results; a persistently high or growing count signals a suite the team has stopped fully trusting, undermining Section 26's entire quality-gate model.

## 31.6 Mean Time to Detect and Mean Time to Resolve

For defects by severity tier (Section 27.2): how long from introduction to detection (ideally, for Critical/High-severity issues, within minutes via automated gates, not days via user reports), and how long from detection to a verified, deployed fix — both tracked to validate that Section 27's bug-management process is actually delivering the response-time expectations it states, not merely documenting an aspiration.

## 31.7 Reporting Cadence

These metrics are reviewed on a regular (e.g., biweekly or monthly) cadence by engineering leadership and QA together, and additionally referenced directly during release-readiness review (Section 29.4) for any metric showing a concerning trend relevant to the release under consideration.

## 31.8 Success Criteria

- All six metrics (31.1–31.6) are tracked continuously and visible platform-wide, not compiled ad hoc only when someone asks.
- Defect escape rate (31.2) for Critical/High-severity issues trends toward zero over time, with any increase promptly investigated per Section 27.6.
- Pyramid shape (31.4) remains consistent with Section 4.3's target ratios, with deliberate, reviewed exceptions only where a specific module's risk profile justifies it (Section 4.3's own stated allowance).

---

# 32. Automation Roadmap

## 32.1 Current-State Automation (V2 Launch)

Every test level and testing category defined in Sections 6–21 of this document is automated at launch, per this document's own stated standards — this is not a future-state aspiration; it is the baseline this document specifies as required for release readiness (Section 29). The roadmap below concerns *expansion and deepening* of automation beyond this already-comprehensive baseline, not filling an acknowledged initial gap.

## 32.2 Near-Term Roadmap

| Initiative | Rationale |
|---|---|
| Expand the visual regression baseline screen set (Section 11.6) as new high-traffic screens ship | Keeps design-system consistency protection (06-design-system.md) proportional to the platform's actual growing surface area. |
| Automate a larger share of the manual real-device matrix (Section 28.4) via cloud device-farm integration | Reduces manual QA burden for routine cross-device checks, freeing exploratory testing (Section 28.2) capacity for genuinely judgment-requiring work. |
| Expand contract testing (Section 9.3) to include response-time assertions per endpoint | Closes the gap between "the response shape is correct" and "the response meets its documented performance target" (Section 13.4) in the same automated check. |
| Build a synthetic-monitoring layer replaying the Section 10.2 mandatory journeys continuously against production (not just staging/pre-release) | Extends E2E-level confidence into continuous, always-on production verification, complementing Section 30's point-in-time post-deployment checks with an ongoing signal. |

## 32.3 Medium-Term Roadmap

| Initiative | Rationale |
|---|---|
| Mutation testing for Critical-tier modules (Section 25.2) | Validates that existing tests would actually catch a deliberately-introduced logic error, addressing Section 25.1's stated concern that high line coverage can coexist with low-value tests — mutation testing directly measures test *effectiveness*, not just code execution. |
| Automated load testing integrated into the standard (not just periodic) release pipeline for Tier 1 releases (Section 26.3) | As traffic grows, load-testing cadence should tighten from periodic to release-gated for the highest-risk release tier, per this document's stated risk-proportional philosophy. |
| AI-assisted test-case generation for edge-case discovery (Section 21), reviewed and curated by QA rather than auto-merged | A future extension explicitly consistent with 08-database-design.md Section 30 and 10-backend-architecture.md Section 27.1's reserved AI-capability seams — applied here to testing itself, with human review remaining the acceptance gate per this document's Section 2.3 "quality is everyone's responsibility" philosophy, never fully autonomous. |

## 32.4 Long-Term Direction

As the platform's future architecture evolves (10-backend-architecture.md Section 27 — internationalization, B2B/wholesale, potential microservice extraction), this document's structure is designed to extend without a rewrite: a new module (10-backend-architecture.md Section 5.26's reserved `ai` module, a future `subscriptions`/`wholesale` module) inherits this document's existing per-domain testing pattern (Sections 6–21's structure) directly, and a future microservice extraction (that document's Section 22.6) would require contract testing (Section 9.3) to expand from an in-process OpenAPI-conformance check to a true cross-service contract-testing discipline (e.g., consumer-driven contract testing) — a natural, anticipated evolution of a pattern already established here, not a new testing philosophy.

## 32.5 Success Criteria

- Every near-term roadmap item (32.2) is scoped, prioritized, and tracked against a concrete trigger condition (traffic growth, surface-area growth) rather than pursued speculatively ahead of demonstrated need.
- Mutation-testing pilot results (32.3) for at least one Critical-tier module inform whether broader rollout is warranted, based on evidence of actual test-effectiveness gaps found.

---

# 33. Architecture Review Checklist

Before this document is considered final and ready to govern implementation, and periodically thereafter as the platform evolves, it is reviewed against:

- [ ] **Consistency** — does every section's terminology and module reference match 08-database-design.md, 09-api-architecture.md, 10-backend-architecture.md, and 11-frontend-architecture.md exactly, with no undocumented drift?
- [ ] **Naming** — do test-level names, gate names, and severity classifications remain consistent across every section that references them?
- [ ] **Security** — does Section 15 and Section 26.5's security validation checkpoints fully cover every authentication/authorization surface named in 10-backend-architecture.md Sections 7–8?
- [ ] **Scalability** — does Section 13's performance-testing strategy remain proportional to 08-database-design.md Section 2's stated millions-of-users/products/orders scale target, re-validated as real traffic data becomes available (Section 31)?
- [ ] **Performance** — are Section 13.3–13.4's numeric targets still the right targets, re-validated periodically against real user-experience data rather than treated as permanently fixed at their initial values?
- [ ] **Maintainability** — does the test suite's actual pyramid shape (Section 31.4) still match this document's stated design (Section 4)?
- [ ] **Developer Experience** — does the standard PR feedback loop (Section 24.4) remain within its target time ceiling as the codebase and suite grow?
- [ ] **Future Readiness** — does this document's structure (Sections 6–21's per-domain pattern) still extend cleanly to every module named in 10-backend-architecture.md Section 5, including modules added since this document was last reviewed?

---

*This document is the definitive testing strategy and quality assurance reference for Dreams by Kalakaaar v2. No test suite, CI pipeline stage, or release process should be built without first tracing its shape back to a decision documented here — and, transitively, back to 08-database-design.md, 09-api-architecture.md, 10-backend-architecture.md, and 11-frontend-architecture.md. Where an implementation need arises that this document does not yet cover, this document must be updated first — the quality bar leads, the code follows.*
