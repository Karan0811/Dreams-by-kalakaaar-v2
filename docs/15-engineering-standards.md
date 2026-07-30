# 15 · Engineering Standards & Coding Guidelines — Dreams by Kalakaaar v2

**Document owner:** Principal Software Engineer / Tech Lead
**Status:** Draft for review
**Audience:** Every engineer on the project, present and future — this is the handbook a new hire reads in their first week
**Last updated:** 2026
**Depends on:** 00-project-vision.md through 13-testing-strategy.md in full, most directly 08-database-design.md, 09-api-architecture.md, 10-backend-architecture.md, 11-frontend-architecture.md, 12-security-architecture.md, and 13-testing-strategy.md
**Precedes:** All code written for Dreams by Kalakaaar v2, from the first commit onward

> **This document defines how we write code, not what code accomplishes.** 08 through 13 define the data model, API contract, backend architecture, frontend architecture, security architecture, and testing strategy. This document is the connective tissue: the conventions, principles, and review discipline that make code written by any engineer, on any part of the system, immediately legible to any other engineer — and that keep the system this documentation series describes from drifting away from what actually gets built.

---

# 1. Introduction

## 1.1 Purpose

Every prior document in this series answers "what should the system do" and "how is it architected." This document answers a different, equally consequential question: **how does an engineer, sitting down to write a function, name a variable, structure a component, or review a pull request, make a decision consistent with everyone else on the team** — without needing to ask, without needing to guess, and without needing to re-derive a convention from first principles every time. A codebase without this document is not a codebase without opinions; it is a codebase with as many silent, undocumented opinions as it has engineers, each slightly different, each a small tax on every future reader.

## 1.2 Scope

**In scope:** engineering philosophy and principles; project organization, module boundaries, and naming conventions across every layer of the stack (08–11); language- and framework-specific standards (TypeScript, React, Next.js, backend, database access, API development); cross-cutting coding standards (state management, error handling, validation, logging, security, performance, accessibility); documentation and commenting philosophy; git/PR workflow and code review discipline; refactoring and technical debt management; AI-assisted development guidelines; and the Definition of Done that closes every unit of work.

**Out of scope:** architectural decisions themselves (owned by 08–12, which this document assumes as given and builds conventions atop), testing strategy in depth (owned by 13-testing-strategy.md, referenced here only where a coding convention directly serves testability), and infrastructure/deployment configuration (10-backend-architecture.md Section 1.2's stated boundary, unchanged here).

## 1.3 Audience

Every engineer — frontend, backend, full-stack — regardless of tenure. This document is written to be equally useful to a founding engineer who has internalized these conventions and to a new hire on their first pull request; it is the single artifact either can point to when a convention is unclear or disputed.

## 1.4 Objectives

1. Make the codebase **predictable** — a developer who has read one module, one component, one endpoint, already knows the shape of the next one (a principle 10-backend-architecture.md Section 2.13 established for backend modules specifically; this document extends it to every layer of the stack).
2. Make code review **objective** — most review disagreements are convention disagreements in disguise; this document exists so a reviewer can point to a documented rule rather than a personal preference (Section 25).
3. Make onboarding **fast** — a new engineer's ramp-up time is dominated by learning unwritten conventions; writing them down converts tribal knowledge into a searchable reference.
4. Make quality **structural, not aspirational** — conventions in this document are, wherever possible, enforced by tooling (linting, type-checking, CI gates per 13-testing-strategy.md Section 24) rather than left to memory and goodwill.
5. Make the codebase **safe to change** — consistent naming, clear module boundaries, and disciplined refactoring practice (Section 26) are what let the system keep evolving without accumulating the kind of undifferentiated complexity that makes every future change riskier than the last.

## 1.5 Definitions

| Term | Meaning in this document |
|---|---|
| Convention | A rule this document states as the expected default for a given situation, enforced by review and, where possible, tooling. |
| Standard | A convention treated as non-negotiable — a pull request violating a Standard is not mergeable regardless of reviewer discretion. |
| Best Practice | A recommended approach that improves code quality but is not independently blocking — a reviewer may raise it as a suggestion, not a requirement. |
| Blocking Finding | A code review comment that must be resolved before merge (Section 25.4). |
| Non-Blocking Finding | A code review comment offered as a suggestion or teaching moment, left to the author's judgment. |

## 1.6 References

This document is written to be read alongside, and never in contradiction with, 08-database-design.md (data model and naming), 09-api-architecture.md (API contract and naming), 10-backend-architecture.md (backend module structure), 11-frontend-architecture.md (frontend app/package structure), 12-security-architecture.md (security architecture and rationale), and 13-testing-strategy.md (testing philosophy and pyramid). Where this document states a convention, it is very often making that prior document's own stated pattern explicit and binding at the level of individual code, not introducing a new idea.

## 1.7 How to Use This Document

Each of Sections 2–31 follows a consistent internal shape wherever the underlying topic warrants it: **Purpose** (why this section exists), **Rules** (the non-negotiable standards), **Best Practices** (recommended, non-blocking guidance), **Common Mistakes** (the specific, recurring errors this section exists to prevent), and **Review Checklist** (what a reviewer checks against this section during code review, feeding directly into Section 25's consolidated checklist). A new engineer should read Sections 1–8 in full before their first pull request; the remaining sections are best used as a living reference, consulted as the relevant situation arises.

---

# 2. Engineering Philosophy

## 2.1 Purpose

To state, once and explicitly, the values that every more specific rule in this document is downstream of — so that when a situation arises this document doesn't explicitly cover, an engineer can reason from these values to the right answer rather than being stuck without guidance.

## 2.2 Boring Technology, Interesting Product

Dreams by Kalakaaar's differentiation is in its product experience and trust model (00-project-vision.md), not in its engineering novelty. Every technology choice across 08–12 (Postgres, Next.js, Drizzle, a modular monolith rather than microservices) is deliberately conventional and well-understood — this document's coding standards extend that same philosophy to the level of individual code: the correct, boring, well-understood pattern is preferred over a clever one, every time, unless the clever pattern solves a real, named problem the boring one cannot.

## 2.3 Code Is Read Far More Than It Is Written

Every convention in this document optimizes for the reader, not the writer. A slightly more verbose but immediately clear name beats a terse but ambiguous one (Section 7); a slightly longer function that reads top-to-bottom as a clear narrative beats a shorter one that requires jumping between abstractions to understand (Section 4.4); a comment explaining *why* beats a comment restating *what* the next line already says (Section 22.5).

## 2.4 Consistency Beats Local Optimization

A codebase where every module follows the same shape (10-backend-architecture.md Section 4.3's stated Developer Experience principle) is more valuable, in aggregate, than one where each module is locally "optimal" for its specific problem but structured differently from its neighbors. An engineer proposing a locally-better-but-globally-inconsistent pattern carries the burden of proof (Section 29's engineering decision process), not the reverse.

## 2.5 Explicit Over Implicit

Magic — hidden side effects, implicit type coercion, framework behavior a reader must already know to correctly predict — is avoided throughout this codebase, mirroring 10-backend-architecture.md Section 9.5's "no hidden side effects" principle for the Service Layer, extended here to every layer: a reader should be able to trace what a piece of code does by reading it, not by knowing an unstated convention that happens to apply.

## 2.6 Quality Is Everyone's Responsibility, at Every Layer

13-testing-strategy.md Section 2.3 established this for testing specifically; this document restates it for engineering practice broadly. There is no separate role responsible for "clean code" that other engineers can defer to — every engineer, on every pull request, is accountable to the standards in this document, and every reviewer is accountable for enforcing them (Section 25).

## 2.7 Optimize for the Team You'll Have, Not the Team You Have

Conventions in this document are written assuming the engineering team will grow past its founding size — naming clarity, module boundaries, and documentation standards that feel like "overhead" for a two-person team are exactly what prevents a ten-person team from grinding to a halt under accumulated undocumented tribal knowledge. This mirrors 10-backend-architecture.md Section 1.8's modular-monolith rationale (pre-paving a path for future scale without paying its full cost today) applied to engineering process rather than system architecture.

---

# 3. Core Engineering Principles

## 3.1 Purpose

To establish the small set of foundational software-engineering principles every more specific standard in this document is an application of — so that a novel situation can be reasoned about from principle, not just from precedent.

## 3.2 SOLID Principles (Applied Pragmatically)

| Principle | What It Means in This Codebase | Where It's Already Applied |
|---|---|---|
| **S** — Single Responsibility | A function, component, or module does one thing; a Service Layer function performs one business operation, never an implicit bundle of several (10-backend-architecture.md Section 2.6). | Every module's three-layer structure (Section 12.2). |
| **O** — Open/Closed | Code is extended via new, additive implementations (a new job consumer, a new enum value) rather than by modifying existing, stable logic to special-case a new scenario. | 09-api-architecture.md Section 1.6's additive-non-breaking API evolution philosophy; 08-database-design.md's open-enum convention (its Section 26.5, restated at the API layer). |
| **L** — Liskov Substitution | Any implementation of a shared interface (a Repository interface, Section 12.4) must be fully substitutable for another without breaking the caller's expectations — a mocked-in-tests Repository must behave contractually identically to the real one for every case the caller depends on. | 10-backend-architecture.md Section 2.7's dependency-inversion design. |
| **I** — Interface Segregation | A module's public interface (Section 6.2) exposes only what callers need — a Service Layer never forces a caller to depend on internal-only types or functions it doesn't use. | Module public-interface discipline (Section 6). |
| **D** — Dependency Inversion | Higher-level business logic depends on abstractions (a Repository interface), not concrete implementations (a specific Drizzle query) — restated directly from 10-backend-architecture.md Section 2.7. | The three-layer module structure throughout the backend. |

**Applied pragmatically** means: SOLID is a set of design pressures this codebase leans into, not a ceremony applied uniformly regardless of a module's actual complexity. A three-line utility function does not need an injected interface and a mock; a Service Layer function orchestrating multiple Repository calls and external integrations does. Section 3.5 (YAGNI) is the explicit counterbalance preventing SOLID from being applied as dogma past the point it earns its keep.

## 3.3 DRY (Don't Repeat Yourself) — and Its Limits

**Rule:** genuine logic duplication — the same business rule, the same validation, the same computation expressed in two places — is refactored into one shared, named location the moment a second occurrence appears (the widely-recognized "rule of three" is *not* the standard here; two occurrences of true business logic is the trigger, since business rules are exactly the kind of thing that silently drifts apart when duplicated even briefly).

**The limit:** DRY applies to **logic**, not to **coincidental similarity**. Two pieces of code that happen to look similar today but represent conceptually distinct business rules (e.g., a Buyer's shipping-address validation and a Creator's business-address validation, which may happen to have identical rules today but represent different concepts that could diverge) are **not** merged into one shared function merely because they're currently identical — this is a common, well-documented DRY anti-pattern ("premature abstraction") that this document explicitly guards against.

**Common Mistake:** conflating "this looks the same" with "this is the same," producing a shared abstraction that later has to grow awkward conditional branches to handle two concepts that were never actually one thing.

## 3.4 KISS (Keep It Simple)

**Rule:** the simplest implementation that correctly and completely solves the actual, current problem is preferred over a more general, more "flexible," or more "future-proof" one — restated directly from 10-backend-architecture.md Section 2.3's "pragmatic, not dogmatic" Clean Architecture stance and Section 1.8's rejection of premature microservice complexity, applied here at the level of individual functions and components.

**Best Practice:** when choosing between two correct implementations, prefer the one a new engineer could understand fastest without additional explanation — simplicity is measured by reader comprehension cost, not by line count or by how few abstractions are used (an overly terse, clever one-liner is not "simpler" than a clear, slightly longer equivalent).

## 3.5 YAGNI (You Aren't Gonna Need It)

**Rule:** do not build configurability, abstraction, or generality for a future requirement that is not yet confirmed — every reserved extension point in 08-database-design.md and 10-backend-architecture.md (e.g., the `ai` module boundary, 10-backend-architecture.md Section 5.26) is a deliberate, documented exception, decided at the architecture level with explicit reasoning, not a license for ad hoc speculative generality anywhere else in the codebase.

**Common Mistake:** building a generic "plugin system" or heavily parameterized abstraction for a feature that currently has exactly one real use case, on the speculative belief a second use case will arrive — YAGNI's discipline is to build the concrete thing well, and generalize *when* (not before) a second real, confirmed need appears, at which point the correct abstraction is usually obvious from having two real examples to generalize from, rather than guessed at in advance.

## 3.6 Principle of Least Astonishment

**Rule:** code should behave the way a reader familiar with this document's conventions would expect it to — a function named `getUser` should not have the side effect of also logging the user out; a component named `ProductCard` should not perform a network mutation on render. Naming (Section 7) and behavior are a contract; violating that contract, even in a way that's technically correct, is treated as a defect in the code's design, not merely a documentation gap.

## 3.7 Review Checklist

- [ ] Does this change introduce genuine logic duplication that should be consolidated (Section 3.3)?
- [ ] Does this change introduce speculative generality for a use case that doesn't yet exist (Section 3.5)?
- [ ] Would a new engineer, reading this code cold, correctly predict what it does from its name alone (Section 3.6)?
- [ ] Is this the simplest correct solution to the actual problem, or a more general solution to a broader problem nobody asked for (Section 3.4)?


---

# 4. Clean Architecture Rules

## 4.1 Purpose

To make 10-backend-architecture.md Section 3.2's three-layer backend structure (Presentation → Service → Repository) and 11-frontend-architecture.md's component-architecture layering into concrete, enforceable rules an engineer applies on every single file, not just an architectural diagram reviewed once at design time.

## 4.2 The Dependency Rule

**Rule:** dependencies point in one direction only — outer layers (Route Handlers, Server Actions, React components) depend on inner layers (Service Layer, custom hooks encapsulating business logic); inner layers never import from or depend on outer layers. A Service Layer function never imports a Next.js-specific type (a `Request`/`Response` object, a React component); a Repository function never imports a Service Layer type. This is the single most load-bearing rule in this section, and the one most commonly violated under deadline pressure — restated here as a Standard, not a Best Practice, precisely because it's the rule most likely to erode without explicit, repeated statement.

## 4.3 Layer Responsibility Matrix

| Layer | Responsibility | May Depend On | Must Never Depend On |
|---|---|---|---|
| Route Handler / Server Action (10-backend-architecture.md Section 3.2) | Parse/validate request, call one Service Layer function, shape the response | Service Layer (one module's public interface) | Another module's Repository or internal types; Drizzle directly |
| Service Layer | Business logic, orchestration, authorization checks, transaction boundaries | Repository Layer (same module), other modules' Service Layer public interfaces | Next.js-specific types/APIs; another module's Repository Layer |
| Repository Layer | Data access — the only layer permitted to import Drizzle | Drizzle, the database schema | Service Layer logic of any kind; business rules |
| React Component (Presentation) | Render UI, handle user interaction, call hooks | Custom hooks, `packages/ui` components | Direct API/fetch calls (always via TanStack Query + the typed API client, 11-frontend-architecture.md Section 9); Drizzle or any backend-only code |
| Custom Hook (Frontend business logic) | Encapsulate data-fetching (TanStack Query) or client state logic (Zustand) for reuse across components | The typed API client, Zustand stores | Rendering JSX directly (a hook returns data/functions, never markup) |

## 4.4 Function and Component Depth

**Rule:** a function or component should be readable top-to-bottom as a coherent narrative at one level of abstraction — if a function mixes "orchestrate three high-level steps" with "compute this one low-level arithmetic detail" in the same body, the low-level detail is extracted into its own well-named function, even if it's only called once. This is not a rule about line count (a function is not "too long" merely for being 40 lines if every line operates at the same conceptual level) — it is a rule about **mixed levels of abstraction** within one function being a readability defect regardless of length.

**Common Mistake:** treating "extract a function" as always synonymous with "reduce line count," producing a maze of tiny, oddly-named functions each called from exactly one place, which harms readability as much as an overly long function does — extraction is warranted when it clarifies a distinct concept, not merely to hit an arbitrary line-count target.

## 4.5 Layered Error Handling

Per 10-backend-architecture.md Section 18: errors are thrown as typed domain errors from the Service Layer and caught exactly once, at the pipeline's terminal error-handling boundary (that document's Section 6.10) — a Route Handler never wraps its Service Layer call in an ad hoc `try/catch` that re-implements error-shaping logic already owned centrally. This is a Clean Architecture rule as much as an error-handling rule: it keeps the outer layer thin (Section 4.3) by not letting cross-cutting concerns (error shaping) leak into it.

## 4.6 Architecture Diagram — Where a New Piece of Logic Belongs

```
                     "I need to add logic that..."
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
   ...shapes an HTTP      ...enforces a          ...reads or writes
   request/response        business rule          the database
          │                     │                     │
          ▼                     ▼                     ▼
   Route Handler /        Service Layer          Repository Layer
   Server Action         (Section 12.4)          (Section 13.2)
   (Section 14.2)
          │                     │                     │
          └──────────► calls ──┴──────► calls ───────┘
             (never the reverse direction)
```

## 4.7 Best Practices

- Prefer composition (a Service Layer function calling several small, named helper functions) over a single large function with internal comments marking "sections" — if a function needs a comment saying `// now handle refunds`, that's a signal the refund-handling logic should be its own named function instead (Section 22.5 on the difference between comments and function extraction).
- When in doubt about which layer new logic belongs in, ask "does this need to know about HTTP" (Route Handler), "does this need to know a business rule" (Service Layer), or "does this need to know SQL/Drizzle" (Repository) — nearly every case resolves cleanly against this question.

## 4.8 Review Checklist

- [ ] Does this change respect the dependency direction (Section 4.2) — no inner layer importing from an outer one?
- [ ] Is new logic placed in the correct layer per the responsibility matrix (Section 4.3)?
- [ ] Does any function/component mix abstraction levels in a way that harms top-to-bottom readability (Section 4.4)?
- [ ] Is error handling delegated to the centralized boundary rather than re-implemented ad hoc (Section 4.5)?

---

# 5. Project Organization

## 5.1 Purpose

To state, at the coding-standards level, the organizational rules that make 10-backend-architecture.md Section 4 and 11-frontend-architecture.md's monorepo structure something every engineer maintains correctly by default, not just something documented once and slowly eroded.

## 5.2 The Monorepo as the Unit of Organization

The entire codebase — `apps/buyer`, `apps/creator`, `apps/internal`, and every `packages/*` package (11-frontend-architecture.md) plus the backend's `src/modules/`, `src/shared/`, `src/jobs/` structure (10-backend-architecture.md Section 4.1) — lives in one Turborepo-managed monorepo. **Rule:** new code is placed according to the existing structure those two documents define; introducing a new top-level folder, a new app, or a new package requires an explicit Engineering Decision Record (Section 29), never an ad hoc addition during ordinary feature work.

## 5.3 Where New Code Goes — Decision Table

| I'm adding... | It goes in... |
|---|---|
| A new backend business capability | A new or existing `src/modules/{domain}/` folder, matching an 08-database-design.md domain (10-backend-architecture.md Section 5) |
| A new UI component reusable across apps | `packages/ui` |
| A new UI component specific to one app's feature | That app's own `components/` folder (`apps/buyer/.../components/`) |
| A new shared TypeScript type used by both frontend and backend | `packages/types` (11-frontend-architecture.md's shared-types package) |
| A new utility with zero domain knowledge | `src/lib/` (backend) or `packages/utils` (frontend/shared), per 10-backend-architecture.md Section 4.2's "genuinely generic" bar |
| A new background job | `src/jobs/{event-family}/`, matching an existing or new Inngest job family (10-backend-architecture.md Section 12.4) |
| A new Route Handler | `src/app/api/v1/{path}/route.ts`, where `{path}` is the literal URL path from 09-api-architecture.md |

## 5.4 One Feature, One Cohesive Change

**Rule:** a pull request implements one feature, fix, or refactor — not a bundle of unrelated changes. A PR adding a new endpoint should not also happen to reformat an unrelated file, upgrade an unrelated dependency, or fix an unrelated typo three modules away (each of those is its own, separately-reviewable PR). This is stated here, in Project Organization, because it is fundamentally about keeping the *history* of the codebase organized and legible, not just its current-state file tree — restated and enforced procedurally in Section 24.3.

## 5.5 Colocation Principle

**Rule:** code that changes together lives together. A module's tests live beside its implementation (10-backend-architecture.md Section 4.1's `__tests__/` convention); a component's styles, tests, and stories (if applicable) live beside the component, not in parallel, mirrored folder trees (`components/Button.tsx` alongside `components/Button.test.tsx`, never a separate top-level `tests/` mirror of the entire `components/` tree, except for the genuinely cross-cutting suites 13-testing-strategy.md Section 4.1 already scopes to `tests/e2e/` and `tests/contract/`).

## 5.6 Common Mistakes

- Creating a new top-level folder for "just this one feature" instead of finding its correct home within the existing module/package structure — a strong signal to pause and check Section 5.3's decision table, or raise the ambiguity explicitly (Section 29) rather than resolving it unilaterally.
- Letting a pull request's scope creep to include unrelated cleanup, making the change harder to review and harder to revert independently if needed (Section 5.4).

## 5.7 Review Checklist

- [ ] Is new code placed according to Section 5.3's decision table, with no new top-level structure introduced without an Engineering Decision Record (Section 29)?
- [ ] Does this pull request represent one cohesive change (Section 5.4), free of unrelated scope creep?
- [ ] Are tests, and any other co-located artifacts, placed beside the code they test (Section 5.5)?


---

# 6. Module Boundaries

## 6.1 Purpose

To make 10-backend-architecture.md Section 3.6 and Section 5.1's module-boundary discipline into a set of rules enforced on every pull request, not just an architectural intent stated once.

## 6.2 The One-Export-Surface Rule

**Rule:** every backend module exposes exactly one public interface — its `service.ts`'s named exports (10-backend-architecture.md Section 5.1). Every frontend `packages/*` package similarly exposes one clear public entry point (its `index.ts` barrel export). Nothing else in a module or package — internal types, internal helper functions, the Repository Layer — is imported from outside that module/package, full stop. This is enforced by an ESLint rule (10-backend-architecture.md Section 26.2), not left to reviewer memory, and a pull request that bypasses it (a "just this once" deep import) is a blocking finding with no exception.

## 6.3 Cross-Module Communication Patterns

| Need | Correct Pattern | Incorrect Pattern |
|---|---|---|
| Module A needs data owned by Module B | Module A's Service Layer calls Module B's Service Layer's exported function | Module A imports Module B's Repository or queries Module B's tables directly |
| A frontend feature needs a shared UI primitive | Import from `packages/ui`'s public export | Copy-paste a similar component into the app-specific folder |
| Two backend modules need to react to the same event | Both subscribe independently to the same Inngest-emitted event (10-backend-architecture.md Section 12.9) | Module A directly calls into Module B's job-triggering logic |
| A Moderation action needs to change a Product's status | Moderation's Service Layer calls Products' exported `archiveProduct` function | Moderation module writes directly to the `Product` table |

## 6.4 Circular Dependency Prohibition

**Rule:** Module A depending on Module B, and Module B depending on Module A, even indirectly through a chain, is prohibited and caught by CI's dependency-graph lint check. When a genuine bidirectional need arises, it is usually a signal that a third, shared concept should be extracted into its own module or into `shared/` (10-backend-architecture.md Section 4.2) rather than the two modules directly depending on each other.

## 6.5 Best Practices

- When unsure whether a piece of logic belongs to Module A or Module B, ask which module's *data* it primarily concerns (08-database-design.md's per-domain entity ownership, Section 3, is the tie-breaker) — logic should live with the data it's most fundamentally about.
- A module's public interface should be small and intention-revealing — if a module exports twenty loosely-related functions, that's a signal the module itself may be doing too much and could benefit from being split (Section 26's refactoring guidance).

## 6.6 Common Mistakes

- A "temporary" deep import across module boundaries to unblock a deadline, left in place permanently — treated identically to any other blocking finding (Section 6.2); there is no accepted temporary exception to this rule.
- Two modules each maintaining their own near-duplicate copy of the same lookup/utility logic instead of recognizing a shared, third concept that belongs in `shared/` (10-backend-architecture.md Section 4.2).

## 6.7 Review Checklist

- [ ] Does this change import only from another module's public interface, never its internals (Section 6.2)?
- [ ] Does this change introduce a circular dependency between modules (Section 6.4)?
- [ ] Is new cross-module logic placed according to Section 6.3's correct-pattern table?

---

# 7. Naming Conventions

## 7.1 Purpose

Naming is the single highest-leverage readability decision made in any codebase — a correctly-named function needs no comment; an incorrectly-named one needs a comment that will eventually drift out of sync with the code. This section is the authoritative naming reference for every layer of the stack, extending 09-api-architecture.md Section 2.1 (API naming) and 08-database-design.md Section 26.1 (database naming) to cover every remaining layer those documents don't already own.

## 7.2 General Naming Principles

1. **Names describe intent, not implementation.** A function is named for *what business outcome it produces* (`calculateOrderTotal`), not *how* it produces it (`loopThroughItemsAndSum`).
2. **Names are searchable.** Avoid abbreviations that make a codebase-wide search ambiguous (`usr`, `ord`, `qty` are avoided in favor of `user`, `order`, `quantity`) except for a small, universally-understood set (`id`, `url`, `api`) — restated from 09-api-architecture.md Section 2.1's own naming conventions, applied platform-wide.
3. **Names are pronounceable.** A name a reader can say aloud in a conversation or a code review is easier to remember and discuss than one that isn't (`getUserOrderHistory`, not `getUsrOrdHist`).
4. **Boolean names read as a question or assertion.** Restated from 09-api-architecture.md Section 2.1's `is`/`has`/`can` convention, applied to every boolean variable in the codebase, not just API fields — `isLoading`, `hasPermission`, `canEdit`, never a bare `loading` or `flag`.

## 7.3 File Naming

| Artifact | Convention | Example |
|---|---|---|
| React component file | `PascalCase.tsx`, matching the component's exported name | `ProductCard.tsx` |
| Non-component TypeScript file | `kebab-case.ts` | `format-currency.ts` |
| Backend module files | Fixed set of lowercase names per 10-backend-architecture.md Section 4.3 | `service.ts`, `repository.ts`, `schemas.ts` |
| Route Handler | `route.ts` (Next.js convention, non-negotiable) | `src/app/api/v1/orders/route.ts` |
| Test file | Same name as the file under test, with `.test.ts`/`.test.tsx` suffix | `ProductCard.test.tsx` |
| Custom hook file | `kebab-case.ts`, prefixed `use-` matching the exported hook name | `use-cart.ts` (exporting `useCart`) |

## 7.4 Component Naming

**Rule:** `PascalCase`, always a noun or noun phrase describing what the component *is* (`ProductCard`, `CheckoutStepper`), never what it *does* procedurally (avoid `RenderProductInfo`, `DisplayCart`) — a component is a thing, not an action. Compound/variant components follow a `Parent.Child` or `ParentChild` naming pattern consistently within a given component family (matching whichever pattern shadcn/ui's own primitives, per 11-frontend-architecture.md, already establish for consistency with the underlying design-system library).

| Good | Bad | Why |
|---|---|---|
| `OrderTimeline` | `TimelineComponent` | "Component" is redundant noise; every file in this context is a component. |
| `EmptyCartState` | `NoCartData` | Names the concept ("empty state," a recognized UI pattern per 06-design-system.md) rather than a vague description. |
| `ProductGallery.Thumbnail` | `ProductGalleryThumbnailItem` | Compound naming signals the relationship without an unwieldy concatenated name. |

## 7.5 Function Naming

**Rule:** verb or verb phrase, describing the business action performed, matching 10-backend-architecture.md Section 4.3's Service Layer convention extended to every function in the codebase, frontend included.

| Layer | Pattern | Example |
|---|---|---|
| Service Layer (business action) | `verbNoun` | `placeOrder`, `approveProductListing`, `issueRefund` (10-backend-architecture.md Section 4.3) |
| Repository Layer (data access) | `find/insert/update/delete + Noun + Qualifier` | `findManyByStoreId`, `updateStatus`, `insertOne` |
| React event handler | `handle + Event` | `handleSubmit`, `handleQuantityChange` |
| Boolean-returning function | `is/has/can + Condition` | `isEligibleForReview`, `hasActiveSubscription` |
| Custom hook | `use + Noun/Concept` | `useCart`, `useProductAvailability` |
| Pure utility/transform | `verbNoun`, describing the transformation | `formatCurrency`, `parsePaginationCursor` |

## 7.6 Variable Naming

**Rule:** a variable's name states what it holds, at a level of specificity proportional to its scope — a variable used across fifty lines of a function warrants a fully descriptive name (`activeCheckoutSession`); a variable used in the next two lines within an obvious context may reasonably be shorter (`item` inside a `.map()` callback iterating over `items`) without being cryptic. **Prohibited:** single-letter names outside conventional, extremely narrow-scope loop counters (`i`, `j` in a simple numeric loop) and mathematical contexts; names that shadow an outer-scope variable of the same name with a different meaning.

## 7.7 Constant Naming

**Rule:** `SCREAMING_SNAKE_CASE` for true, module-level constants representing a fixed configuration value or a magic number given a name (`MAX_CART_ITEMS`, `DEFAULT_PAGE_SIZE`); regular `camelCase` for a `const`-declared variable that is merely locally immutable within a function's scope but not a conceptually global constant — the distinction is about **conceptual constancy** (a value that represents a fixed platform rule) versus **local immutability** (this particular variable happens not to be reassigned in this function), not merely whether the `const` keyword was used.

## 7.8 Type Naming

**Rule:** `PascalCase`, a noun matching the concept it represents, with no `T` or `I` prefix (a legacy convention from other ecosystems this codebase does not follow, since TypeScript's tooling makes types and interfaces visually and contextually distinguishable without a prefix). A type representing an entity mirrors 08-database-design.md's entity name exactly (`Product`, `SubOrder`) — no renaming for "stylistic" reasons across the type/entity boundary, per this document's Section 1.6 traceability principle.

## 7.9 Enum Naming

**Rule:** the enum itself is `PascalCase` singular (`OrderStatus`, not `OrderStatuses`); enum members are `SCREAMING_SNAKE_CASE`, matching 09-api-architecture.md Section 2.1's wire-format convention exactly, so no translation layer exists between a TypeScript enum member and its JSON representation (`OrderStatus.PENDING_APPROVAL` serializes to `"PENDING_APPROVAL"` with zero mapping code required).

## 7.10 Interface Naming

**Rule:** identical conventions to Type Naming (7.8) — this codebase does not distinguish `interface` from `type` by naming convention, only by the technical criteria in Section 9.6 (when to use one over the other). A props interface for a component is named `{ComponentName}Props` (`ProductCardProps`); a Service Layer function's parameter object is named `{FunctionName}Input` or `{FunctionName}Params` consistently within a module.

## 7.11 API Naming (Cross-Reference)

Fully owned by 09-api-architecture.md Section 2.1 — URL paths (kebab-case), JSON fields (camelCase), enum wire values (SCREAMING_SNAKE_CASE). This document does not restate that section; it ensures every other layer's naming (7.8–7.9 above) is chosen specifically to align with it without translation.

## 7.12 Database Naming (Cross-Reference)

Fully owned by 08-database-design.md Section 26.1 (and the eventual Drizzle schema's own casing convention, typically `snake_case` at the physical column level per Postgres convention, mapped to `camelCase` at the Drizzle/TypeScript layer via Drizzle's own column-mapping feature) — application code, including the Repository Layer, refers to entities and fields using the camelCase TypeScript names Drizzle's schema exposes, never raw snake_case column names, keeping one consistent casing convention visible to every engineer regardless of which layer they're reading.

## 7.13 Route Naming (Frontend Pages, Cross-Reference to Backend Routes)

Frontend page routes (`apps/buyer/app/...`) use kebab-case URL segments matching the public-facing URL structure 04-information-architecture.md defines; backend API routes mirror 09-api-architecture.md's documented paths exactly (Section 5.3 of this document). The two are related but distinct: a frontend page route (`/products/[slug]`) renders UI and internally calls the backend API route (`/api/v1/products/{id}`) — they are never assumed interchangeable or auto-derived from one another, and a change to one does not imply an automatic, unreviewed change to the other.

## 7.14 Import Ordering

**Rule:** a fixed, tool-enforced (ESLint import-order plugin) sequence: (1) external/third-party packages, (2) internal absolute-path imports (`@/modules/...`, `@/shared/...`, `@/packages/...`), (3) relative imports (same-directory or child-directory only, per Section 6.2's deep-import prohibition), (4) type-only imports, grouped separately from value imports where the codebase's TypeScript configuration distinguishes them. Enforced automatically, never manually reordered or debated in review.

## 7.15 Common Mistakes

- Naming a function or variable after its *type* rather than its *purpose* (`orderArray`, `userObject`) — the type is already known from TypeScript's own type system; the name should carry information the type doesn't already provide.
- Inconsistent pluralization (`getProduct` returning an array, or `getProducts` returning a single item) — a function's name and its actual return shape must always agree.
- Reusing a name from 08-database-design.md or 09-api-architecture.md for a different concept in application code, creating confusing cross-document ambiguity (Section 1.6's traceability principle exists specifically to prevent this).

## 7.16 Review Checklist

- [ ] Does every name state intent rather than implementation (Section 7.2)?
- [ ] Do component, function, variable, constant, type, enum, and interface names follow their respective conventions (Sections 7.4–7.10)?
- [ ] Does a boolean variable/field read as a clear question or assertion?
- [ ] Do entity/field names in application code match 08-database-design.md and 09-api-architecture.md exactly, with no undocumented renaming?


---

# 8. Folder & File Standards

## 8.1 Purpose

To extend 10-backend-architecture.md Section 4 and 11-frontend-architecture.md's structural conventions with the file-level rules that keep any given folder's contents predictable regardless of which engineer last touched it.

## 8.2 One Primary Export Per File

**Rule:** a file's default or primary named export matches its filename (a file named `ProductCard.tsx` exports a component named `ProductCard`; `format-currency.ts` exports a function named `formatCurrency`). Small, tightly-related helper functions used only within that file may be co-located and unexported; anything used elsewhere is either its own file or explicitly justified as a cohesive, multi-export module (e.g., a `constants.ts` file exporting several related constants is expected to have multiple exports, since its filename already signals a collection, not a single concept).

## 8.3 File Size as a Signal, Not a Rule

There is no hard line-count limit enforced by tooling — restated from Section 4.4, file/function length is a symptom to investigate, not a metric to optimize directly. A large file where every section operates at a consistent abstraction level and serves one cohesive concept (a large, comprehensive `schemas.ts` for a complex module) is acceptable; a large file mixing many unrelated concerns is a refactoring candidate (Section 26) regardless of its exact line count.

## 8.4 Barrel Files (`index.ts`)

**Rule:** used exactly at package/module public-interface boundaries (Section 6.2) to define the one sanctioned export surface — never used purely as a convenience within a module's internals (an `index.ts` re-exporting everything from every internal file, which would silently defeat Section 6.2's one-export-surface enforcement by making every internal file trivially reachable through the barrel).

## 8.5 Configuration File Placement

Environment/configuration access is centralized (10-backend-architecture.md Section 23.1's `shared/config/env.ts`) — no module defines its own ad hoc configuration-reading logic, even for a seemingly module-specific setting; new configuration values are added to the single, typed, validated central schema.

## 8.6 Example: A Well-Formed Backend Module Folder

```
src/modules/reviews/
├── service.ts        # exports: createReview, updateReview, deleteReview,
│                      #          replyToReview, voteOnReview, reportReview
├── repository.ts      # module-private; never imported outside this folder
├── schemas.ts          # Zod schemas for every Service Layer function's input
├── errors.ts            # ReviewNotEligibleError, DuplicateReplyError, etc.
├── types.ts              # module-internal types not part of the public interface
└── __tests__/
    ├── service.test.ts
    └── repository.test.ts
```

## 8.7 Example: A Well-Formed Frontend Feature Folder

```
apps/buyer/app/(shop)/products/[slug]/
├── page.tsx                    # Server Component — data fetching, composition
├── product-gallery.tsx          # feature-specific component
├── product-gallery.test.tsx
├── use-product-availability.ts  # feature-specific hook
└── loading.tsx                  # Next.js loading UI convention
```

## 8.8 Common Mistakes

- A barrel file (`index.ts`) that re-exports internal implementation detail "for convenience," silently reopening the module-boundary hole Section 6.2 exists to close.
- Splitting a single cohesive concept across many tiny files purely to keep each file short, harming navigability more than a moderately larger, cohesive file would (Section 8.3).

## 8.9 Review Checklist

- [ ] Does every file's primary export match its filename (Section 8.2)?
- [ ] Is a large file large because it's genuinely cohesive, or because it's mixing unrelated concerns (Section 8.3)?
- [ ] Does any `index.ts` barrel file re-export internal-only implementation detail (Section 8.4)?

---

# 9. TypeScript Standards

## 9.1 Purpose

TypeScript is this platform's single most important tool for shifting defect-detection left (13-testing-strategy.md Section 3.3) — this section states how it is used to actually deliver that benefit, rather than being present in the stack but routinely bypassed.

## 9.2 Strict Mode, No Exceptions

**Rule:** the TypeScript compiler runs in strict mode across the entire monorepo, with zero tolerance for `any` outside an explicitly justified, commented, and reviewed exception (10-backend-architecture.md Section 25.1's stated CI gate) — an `any` used to "get past" a type error the engineer doesn't understand is never acceptable; the correct type is worked out, or, in the rare case where a third-party library's types are genuinely incomplete, an `unknown` with an explicit narrowing check is used instead of `any`, preserving type safety at the boundary.

## 9.3 Inference Over Annotation, Except at Boundaries

**Rule:** rely on TypeScript's inference for local variables and internal logic (explicit type annotations on every local variable are noise, not safety, when the type is already obvious from its initializer); **always** explicitly annotate function parameters, function return types for exported/public functions, and object shapes crossing a module boundary (Section 6.2) — the boundary is exactly where inference's convenience gives way to the need for an explicit, stable, reviewable contract.

## 9.4 Zod as the Single Source of Runtime Truth

**Rule:** for every shape that crosses a genuine trust boundary (an API request body, an environment variable, a third-party webhook payload — 10-backend-architecture.md Section 9.4), a Zod schema is defined once, and the corresponding TypeScript type is *derived* from it (`z.infer<typeof Schema>`), never hand-written separately alongside it. This is a Standard, not a Best Practice: a hand-maintained TypeScript type sitting beside a hand-maintained Zod schema for the same shape will drift, and drift here means a runtime validation gap TypeScript's compile-time checking cannot catch.

## 9.5 Discriminated Unions Over Optional-Field Soup

**Rule:** when a type has several mutually-exclusive shapes (e.g., a component's render state: loading, error, or success-with-data — 13-testing-strategy.md Section 7.6's documented state categories), model it as a discriminated union with a common literal `kind`/`status` field, never as one flat interface with a pile of optional fields where "which fields are actually populated" depends on an implicit, undocumented relationship between them.

| Good (Discriminated Union) | Bad (Optional-Field Soup) |
|---|---|
| A type with three variants — `{ status: "loading" }`, `{ status: "error", error: ... }`, `{ status: "success", data: ... }` — where TypeScript itself enforces you can't access `.data` without first narrowing to the `"success"` case | One flat type with `data?`, `error?`, `isLoading?` all optional, where a reader must guess (or trust an unenforced convention) which combination of fields is actually valid at any given time |

## 9.6 `type` vs. `interface`

**Rule:** `interface` for object shapes that represent an entity or a component's props (things that might reasonably be extended/merged, which `interface` supports natively via declaration merging); `type` for everything else — unions, intersections, mapped types, and primitive aliases. This is a technical-capability-driven rule, not a stylistic preference, and is enforced by lint configuration rather than left to individual taste.

## 9.7 No Non-Null Assertions Without Justification

**Rule:** the non-null assertion operator (`!`) is avoided in favor of explicit narrowing (an `if` check, a default value, or — where truly appropriate — a thrown error with a clear message) — a bare `!` silences the compiler's legitimate concern without addressing it, and is one of the more common sources of a runtime `null`/`undefined` crash slipping through a strict-mode codebase. The rare justified use (e.g., a value guaranteed non-null by a check performed several lines earlier that TypeScript's control-flow analysis cannot see through) requires an inline comment explaining why the assertion is safe.

## 9.8 Enums vs. String Union Types

**Rule:** for wire-format values that must exactly match 09-api-architecture.md's enum conventions (Section 7.9), a TypeScript `enum` is used specifically because its members map directly to the SCREAMING_SNAKE_CASE wire values with no separate mapping layer. For internal-only, non-wire-format discrimination (e.g., a component's internal render-mode switch not exposed to any API), a plain string-literal union type is preferred over an `enum`, since it's structurally lighter-weight and avoids `enum`'s occasional interoperability friction with external tooling — the wire-format case is the deciding factor, not a blanket preference for one over the other.

## 9.9 Async Type Discipline

Every `async` function's return type is an explicit `Promise<T>` at its public-interface boundary (Section 9.3); a function that can fail is typed to reflect that failure mode explicitly wherever practical (e.g., a Result-style discriminated union, Section 9.5, for expected/recoverable failure paths) rather than relying solely on `throw`, which is invisible in a function's type signature — thrown exceptions remain the mechanism for the error-taxonomy-driven failures 10-backend-architecture.md Section 18.2 defines, but a function's *expected*, non-exceptional alternate outcomes are modeled in its return type wherever that improves caller clarity.

## 9.10 Common Mistakes

- Using `any` to silence a type error under deadline pressure, intending to "fix it properly later" — later rarely comes, and this is treated as a blocking finding, never a deferred one (Section 9.2).
- Hand-writing a TypeScript interface alongside a Zod schema for the same API shape instead of deriving one from the other (Section 9.4), creating a silent-drift risk.
- Reaching for a non-null assertion (`!`) as a first response to a compiler error rather than understanding and addressing the actual narrowing gap (Section 9.7).

## 9.11 Review Checklist

- [ ] Is `any` present anywhere without an explicit, reviewed justification (Section 9.2)?
- [ ] Are boundary-crossing shapes (API bodies, config) defined once in Zod with TypeScript types derived from them, not duplicated by hand (Section 9.4)?
- [ ] Are mutually-exclusive states modeled as discriminated unions rather than optional-field soup (Section 9.5)?
- [ ] Is every non-null assertion (`!`) accompanied by a comment justifying its safety (Section 9.7)?


---

# 10. React Standards

## 10.1 Purpose

To make 11-frontend-architecture.md's component architecture and 13-testing-strategy.md Section 7's component-testing philosophy into concrete, everyday component-writing rules.

## 10.2 Functional Components Only

**Rule:** every component is a function component using hooks — this codebase has no class components anywhere, a settled, non-negotiable convention (not a comparison of approaches, simply the platform's one way of building components) consistent with React 19 and the hooks-based patterns 11-frontend-architecture.md's state-management architecture assumes throughout.

## 10.3 Props Design

**Rule:** a component's props are the *minimum* information it needs to render and behave correctly — never an entire entity object passed through "just in case" a deeply-nested child needs one field from it (which couples the component to that entity's full shape unnecessarily and makes the component harder to reuse or test in isolation, per 13-testing-strategy.md Section 7.2's isolation-testing goals). Boolean props follow Section 7.2's `is`/`has`/`can` naming; a component with more than a handful of boolean props is a signal it may actually represent several distinct states better modeled as a single discriminated-union `variant` prop (Section 9.5).

| Good | Bad | Why |
|---|---|---|
| `<OrderStatusBadge status={order.status} />` | `<OrderStatusBadge order={order} />` | The badge needs one field, not the whole entity — passing the whole entity couples it unnecessarily and obscures what the component actually uses. |
| `<Button variant="destructive" size="sm" />` | `<Button isDestructive isSmall isDisabled={false} isLoading={false} />` | A small, fixed set of named variants (matching 06-design-system.md's defined variants) is clearer and more constrained than an open-ended pile of independent booleans. |

## 10.4 Composition Over Configuration

**Rule:** prefer composing smaller components together (children, slots, compound components — per Section 7.4's `Parent.Child` naming pattern) over a single component with a large number of configuration props attempting to cover every possible visual variation. This mirrors shadcn/ui's own compositional design (11-frontend-architecture.md), which this codebase's own components should follow consistently rather than reverting to a monolithic-props pattern for app-specific components.

## 10.5 Server Components by Default, Client Components by Exception

**Rule:** restated as a binding convention from 11-frontend-architecture.md's rendering-strategy chapter: a component is a React Server Component unless it specifically needs interactivity, browser-only APIs, or a hook requiring client-side execution (`useState`, `useEffect`, event handlers) — the `"use client"` directive is added only at the specific leaf components that need it, never hoisted to a parent "just to be safe," since doing so unnecessarily expands the client-side JavaScript bundle and forfeits server-rendering benefits for the whole subtree beneath it.

## 10.6 Hooks Standards

- **Rules of Hooks are non-negotiable** — enforced by the ESLint hooks plugin, never manually overridden with a disable comment except in a documented, reviewed rare case.
- **Custom hooks encapsulate one cohesive concern** (`useCart`, `useProductAvailability`), matching Section 7.5's naming convention — a hook that returns an unrelated grab-bag of values for several different concerns is a signal it should be split into separate hooks.
- **Data-fetching hooks always go through TanStack Query** (11-frontend-architecture.md's state-management architecture) — a component never calls `fetch`/the API client directly inside a `useEffect`; this is a Standard, not a preference, since bypassing TanStack Query forfeits caching, request deduplication, and the loading/error state modeling (Section 9.5) the rest of this codebase assumes is available uniformly.
- **Client-only UI state uses Zustand or local `useState`**, chosen by scope: state used by exactly one component tree uses `useState`/`useReducer` locally; state genuinely shared across distant parts of the component tree (e.g., cart contents visible in both a header icon and a cart drawer) uses a Zustand store, per 11-frontend-architecture.md's stated boundary between the two.

## 10.7 List Rendering and Keys

**Rule:** every list-rendering `.map()` call uses a stable, unique `key` — the entity's own `id` (08-database-design.md Section 26.1's UUID convention), never the array index, since an index-based key breaks React's reconciliation correctness the moment the list can reorder, filter, or have items inserted/removed (a common, well-documented React anti-pattern this codebase has zero tolerance for, enforced by lint rule).

## 10.8 Memoization Discipline

**Rule:** `useMemo`/`useCallback`/`React.memo` are applied deliberately, in response to a measured performance problem (a component genuinely re-rendering expensively and unnecessarily, per 13-testing-strategy.md Section 13.3's Core Web Vitals targets), never applied reflexively "just in case" to every component and every callback — indiscriminate memoization adds cognitive overhead and, in many cases, net-negative performance (the memoization bookkeeping cost exceeding the render it prevents) without a demonstrated need.

## 10.9 Accessibility-by-Construction

Restated as a binding React-specific rule from 13-testing-strategy.md Section 12: every interactive element uses a semantically correct HTML element or ARIA role (a clickable `<div>` styled to look like a button is never acceptable where a real `<button>` — or shadcn/ui's `Button` primitive, per 11-frontend-architecture.md — achieves the same visual result with correct semantics and keyboard behavior built in for free).

## 10.10 Common Mistakes

- Fetching data with a raw `useEffect` + `fetch` instead of TanStack Query, silently losing caching/deduplication and reintroducing the loading/error-state boilerplate TanStack Query exists to eliminate (Section 10.6).
- Using array index as a list key, which works fine until the list becomes reorderable/filterable and then produces subtle, hard-to-diagnose rendering bugs (Section 10.7).
- Hoisting `"use client"` to a large parent component "to be safe," silently converting an entire subtree to client-rendered when only one small leaf actually needed it (Section 10.5).
- Reaching for `useMemo`/`useCallback` reflexively on every value/function without a measured reason (Section 10.8).

## 10.11 Review Checklist

- [ ] Are props minimal and well-typed, avoiding whole-entity pass-through where a narrower shape would do (Section 10.3)?
- [ ] Is `"use client"` applied only at the specific components that need it (Section 10.5)?
- [ ] Does every data-fetching need go through TanStack Query, never a raw `useEffect`+`fetch` (Section 10.6)?
- [ ] Are list keys stable and unique, never array indices (Section 10.7)?
- [ ] Is every interactive element semantically correct/accessible by construction (Section 10.9)?

---

# 11. Next.js Standards

## 11.1 Purpose

To make 11-frontend-architecture.md's App Router and rendering-strategy decisions into concrete file- and route-level conventions.

## 11.2 Route Handler vs. Server Action — the Decision Rule

Restated as a binding rule from 10-backend-architecture.md Section 3.5: a Route Handler is the default for anything implementing 09-api-architecture.md's documented contract, or anything that could plausibly be needed by more than one frontend or a future public API. A Server Action is used only for same-origin, form-centric, single-surface interactions (10-backend-architecture.md Section 3.5's exact stated scope) — an engineer choosing between the two defaults to Route Handler unless the specific Server Action criteria are clearly met, never the reverse.

## 11.3 Data Fetching Placement

**Rule:** data fetching for initial page render happens in Server Components (`page.tsx`, `layout.tsx`), fetched directly via the module's Service Layer where the Server Component runs in the same Next.js application as the backend (this platform's actual architecture, per 10-backend-architecture.md Section 1.9's reconciliation) rather than the Server Component making an HTTP round-trip to its own API — calling the Service Layer function directly from a Server Component is the correct, efficient pattern here, since the extra network hop through the API layer would be pure overhead for same-process, same-deployment code. Client-side, subsequent data fetching (pagination, filters, mutations after initial render) goes through TanStack Query calling the typed API client against the real HTTP API (Section 10.6), since that code runs in the browser and has no direct access to server-side modules.

## 11.4 Loading and Error UI

**Rule:** every route segment that fetches data defines its own `loading.tsx` (Next.js's built-in Suspense-boundary convention) and `error.tsx` (Next.js's built-in error-boundary convention) rather than each page hand-rolling its own loading spinner or error-fallback logic inline — this keeps loading/error UX consistent platform-wide (matching 06-design-system.md's defined loading/error state patterns) and keeps page components focused on their actual content rather than boilerplate state-handling.

## 11.5 Metadata and SEO

**Rule:** every public-facing page defines its metadata via Next.js's typed `generateMetadata`/static `metadata` export, populated from the corresponding entity's `SEOContent`/`ProductSEO` fields (08-database-design.md Sections 8.12, 20.8) where applicable — metadata is never hardcoded generically across multiple distinct pages, since 04-information-architecture.md's SEO strategy depends on each page's metadata being genuinely specific to its content.

## 11.6 Caching and Revalidation

**Rule:** every data-fetching call in a Server Component states its caching intent explicitly (Next.js's `fetch` caching options or the equivalent Service-Layer-call caching pattern, per 10-backend-architecture.md Section 13's Redis-layer caching for the underlying data) — relying on an implicit default caching behavior without a considered decision is not acceptable, since incorrect caching is a common, hard-to-diagnose source of stale-content bugs (a Creator publishing a Product and not seeing it reflected, mirroring the exact scenario 10-backend-architecture.md Section 13.3 already calls out at the Redis layer, restated here at the Next.js rendering layer).

## 11.7 Environment-Specific Code

**Rule:** code that must only run server-side (accessing `10-backend-architecture.md Section 23.1`'s `env.ts`, calling a Service Layer function directly) never appears in a file reachable by client-side bundling — Next.js's own server/client module boundary (enforced by the framework and by the `"use client"` convention, Section 10.5) is the mechanism; an engineer never works around a "server-only" boundary error by moving genuinely server-only logic into a shared file client code also imports.

## 11.8 Common Mistakes

- A Server Component making an HTTP call to its own application's API instead of calling the Service Layer directly, adding pointless latency (Section 11.3).
- Omitting `loading.tsx`/`error.tsx` and hand-rolling inline loading/error UI per page, producing inconsistent UX and duplicated boilerplate (Section 11.4).
- Choosing a Server Action for something that should be a Route Handler because it "felt simpler" for the immediate feature, without checking whether the functionality might reasonably be needed by another app or a future integration (Section 11.2).

## 11.9 Review Checklist

- [ ] Is the Route Handler vs. Server Action choice consistent with Section 11.2's decision rule?
- [ ] Does initial-render data fetching call the Service Layer directly rather than round-tripping through the app's own API (Section 11.3)?
- [ ] Does every data-fetching route segment define `loading.tsx`/`error.tsx` (Section 11.4)?
- [ ] Is caching intent explicit, not left to an unconsidered default (Section 11.6)?


---

# 12. Backend Standards

## 12.1 Purpose

To restate 10-backend-architecture.md Sections 3, 5, and 9 as day-to-day coding rules an engineer applies while writing any backend logic, not merely as an architecture diagram consulted occasionally.

## 12.2 The Three-Layer Rule, Restated as Practice

Every backend module's code is written in exactly three layers (Section 4.3): a thin Presentation Layer with zero business logic, a Service Layer containing all business rules and orchestration, and a Repository Layer containing all data access and nothing else. **Rule:** if a Route Handler contains an `if` statement evaluating a business condition (not just a shape-validation check already delegated to Zod, Section 17), that logic is misplaced and belongs in the Service Layer.

## 12.3 Service Layer Function Shape

Restated from 10-backend-architecture.md Section 9.1 as a concrete checklist every Service Layer function follows, in order: (1) ownership/permission checks, (2) business-rule validation, (3) the data operation, wrapped in a transaction if multi-write, (4) post-commit side-effect triggering, (5) return of a typed domain result. A Service Layer function that performs a database write before checking authorization, or that triggers a side effect before its causing transaction has committed, is a defect regardless of whether the happy path "works" — ordering here is a correctness property, not a style preference (10-backend-architecture.md Section 9.3's explicit transaction-then-side-effect sequencing).

## 12.4 Repository Function Shape

Every Repository function does exactly one data-access operation, named per Section 7.5's `find/insert/update/delete` convention, accepts an optional transaction handle as its first parameter (10-backend-architecture.md Section 10.3), and returns a fully-typed domain object inferred from the Drizzle schema (that document's Section 10.4) — never a raw, untyped query result, and never business logic of any kind (a Repository function computing a derived value beyond what the database query itself returns is a layer violation, per Section 4.2).

## 12.5 Idempotency as a Default Consideration

**Rule:** every Service Layer function backing an endpoint documented in 09-api-architecture.md as requiring an `Idempotency-Key` (that document's Section 2.6) implements the idempotency check (10-backend-architecture.md Section 9.6) as its literal first executed step — not an afterthought bolted on once the "real" logic works, since retrofitting idempotency into an already-written function is a common source of subtle bugs (a side effect accidentally triggered before the idempotency check runs).

## 12.6 Event Emission Discipline

**Rule:** every Service Layer function's post-commit event emission (10-backend-architecture.md Section 12.9) uses a past-tense, domain-meaningful event name (`order.placed`, `product.updated`, never a vague `data.changed` or an implementation-detail name like `row.inserted`) — an event name should be independently meaningful to any future consumer without needing to read the emitting module's source code to understand what it represents.

## 12.7 Common Mistakes

- Business logic creeping into a Route Handler "just for this one small check," bypassing the Service Layer entirely for a seemingly trivial case that later grows into a real, undiscoverable business rule living in the wrong layer (Section 12.2).
- A Repository function that "just also" computes a small derived value inline, blurring the Repository/Service boundary in a way that seems harmless until a second caller needs the raw value without the derived computation (Section 12.4).
- Emitting a side-effect-triggering event before the causing transaction has actually committed, risking a notification/search-index update referencing data that a subsequent rollback then makes never actually have existed (Section 12.3, 10-backend-architecture.md Section 9.3).

## 12.8 Review Checklist

- [ ] Is all business logic in the Service Layer, none in the Route Handler or Repository (Section 12.2, 12.4)?
- [ ] Does the Service Layer function follow the correct ordering — auth/validation, then operation, then side effects (Section 12.3)?
- [ ] Is idempotency handled as the literal first step for endpoints that require it (Section 12.5)?
- [ ] Are emitted event names domain-meaningful and past-tense (Section 12.6)?

---

# 13. Database Access Standards

## 13.1 Purpose

To restate 10-backend-architecture.md Section 10 (Repository Layer architecture) as binding, everyday query-writing rules.

## 13.2 Drizzle Is the Only Access Path

**Rule:** no raw SQL string construction anywhere outside Drizzle's parameterized query builder or its tagged-template `sql` helper for the rare, reviewed case a genuinely complex query requires it (12-security-architecture.md Section 9.2) — this is restated here as a coding standard, not merely a security control, because it is also what keeps every query statically type-checked against the schema.

## 13.3 Column Selection Discipline

**Rule:** select only the columns a given Repository function's known callers actually need (10-backend-architecture.md Section 10.4) — a reflexive `SELECT *`-equivalent (Drizzle's default full-row select) is acceptable only where the function's purpose is genuinely "fetch the complete entity" (a detail-view lookup); a function backing a list/summary view explicitly selects its narrower field set.

## 13.4 Relational Queries Over Manual Joins in Application Code

**Rule:** where a Repository function needs related data (a Product with its media), Drizzle's relational query API (`db.query.x.findMany({ with: {...} })`) is used to fetch it in one batched query — manually issuing a separate query per related row inside a loop (the N+1 anti-pattern, 10-backend-architecture.md Section 10.7) is a blocking finding, caught both by the lint rule that document specifies and by reviewer attention to any database call appearing inside a loop body.

## 13.5 Transactions

**Rule:** any Repository-layer sequence of writes that must succeed or fail together is wrapped in a Drizzle transaction at the Service Layer (Section 12.3), with the transaction handle threaded down into each Repository call (10-backend-architecture.md Section 10.3) — a Service Layer function performing multiple independent writes without a shared transaction handle, when those writes are supposed to be atomic, is a correctness defect, not a style issue.

## 13.6 Pagination

**Rule:** every list-returning Repository function implements cursor-based (keyset) pagination via the shared pagination helper (10-backend-architecture.md Section 10.5) — a hand-rolled `OFFSET`-based query is never introduced for a new endpoint; the existing shared helper is used, and if it doesn't yet support a needed variation, it is extended, not bypassed with a one-off alternative.

## 13.7 Migrations

**Rule:** every schema change is expressed as a Drizzle-generated migration (10-backend-architecture.md Section 25.2), reviewed for backward compatibility per that section's stated discipline (additive changes only within a single deploy; renames/drops are multi-step operations spanning several releases) — a migration that would break the currently-deployed application version, even briefly during a rolling deployment, is a blocking finding regardless of how minor the change appears.

## 13.8 Common Mistakes

- A database call inside a `.map()`/`.forEach()` loop, the single most common source of N+1 query performance bugs (Section 13.4) — caught by lint tooling, but still worth an engineer's own vigilance before it ever reaches review.
- A migration that renames a column in a single step, breaking the previous application version's queries against it during a rolling deployment (Section 13.7).
- Reaching for `OFFSET`-based pagination "just this once" because it's marginally simpler to write than keyset pagination, reintroducing the exact scalability problem 08-database-design.md Section 27.6 and this document's Section 13.6 both explicitly reject.

## 13.9 Review Checklist

- [ ] Is every query issued through Drizzle's query builder, with no raw SQL string concatenation (Section 13.2)?
- [ ] Does any Repository function select more columns than its actual callers need (Section 13.3)?
- [ ] Is there a database call inside a loop anywhere in this change (Section 13.4)?
- [ ] Are multi-write operations correctly wrapped in a shared transaction (Section 13.5)?
- [ ] Does any new list endpoint use offset-based rather than cursor-based pagination (Section 13.6)?
- [ ] Is a new migration backward-compatible with the currently-deployed application version (Section 13.7)?


---

# 14. API Development Standards

## 14.1 Purpose

To make 09-api-architecture.md's contract-level conventions binding at the level of how a Route Handler is actually written, closing the gap between "the API is documented to behave this way" and "the code makes it behave that way by construction."

## 14.2 Route Handler Structure

**Rule:** every Route Handler follows the identical internal shape (10-backend-architecture.md Section 6): parse and validate input via the module's Zod schema, call exactly one Service Layer function, shape the result via the shared response-formatting helper (that document's Section 6.9). A Route Handler that calls more than one Service Layer function, or that contains its own bespoke response-shaping logic instead of the shared helper, is a layering defect (Section 4.3) surfaced here as an API-specific instance of that general rule.

## 14.3 New Endpoint Checklist

Before a new endpoint is considered complete, every item below is verified — this is the concrete, everyday application of 09-api-architecture.md Section 26.1's "OpenAPI and implementation must never drift" principle:

- [ ] The endpoint's path, method, and request/response shape are added to the OpenAPI spec (`openapi/v1.yaml`) **before or alongside** implementation, never as an afterthought.
- [ ] The Zod request schema matches the OpenAPI schema's field names, types, and required/optional status exactly.
- [ ] Every documented error code for this endpoint (09-api-architecture.md Section 23's catalog) has a corresponding thrown, typed error in the Service Layer (Section 12).
- [ ] Pagination, filtering, and sorting (if applicable) follow Sections 2.7–2.9 of that document exactly, using the shared helpers (Section 13.6 of this document), never a bespoke implementation.
- [ ] Authorization requirements are correctly annotated in the OpenAPI spec's security section, feeding the generated RBAC matrix (10-backend-architecture.md Section 8.1).
- [ ] A contract test (13-testing-strategy.md Section 9.3) exists verifying the implementation matches the OpenAPI schema.

## 14.4 Idempotency Implementation

Restated as an API-specific rule from Section 12.5: any endpoint 09-api-architecture.md documents as requiring `Idempotency-Key` support is not considered complete until its idempotency behavior (identical key + identical payload → cached result; identical key + different payload → `409`) has a passing test (13-testing-strategy.md Section 9.5).

## 14.5 Response Shape Discipline

**Rule:** a Route Handler never constructs its response body by hand-assembling an object literal inline — it always passes its Service Layer's typed return value through the shared response-shaping helper (Section 14.2), which enforces 09-api-architecture.md Section 2.16's single-resource-vs-collection envelope distinction automatically. An engineer who finds themselves manually writing `{ data: [...], pagination: {...} }` inline in a Route Handler has bypassed the shared helper and should use it instead.

## 14.6 Common Mistakes

- Implementing an endpoint's behavior before updating the OpenAPI spec, then "getting to it later" — the spec silently goes stale the moment implementation and documentation are allowed to diverge even briefly, and later rarely comes (Section 14.3).
- A Route Handler calling two Service Layer functions instead of one, quietly reintroducing cross-module orchestration logic into the Presentation Layer where it doesn't belong (Section 14.2, Section 4.3).
- Hand-rolling a response envelope inline instead of using the shared shaping helper, producing a subtly non-conformant shape that a contract test should — but might not, if one wasn't written — catch (Section 14.5).

## 14.7 Review Checklist

- [ ] Does the OpenAPI spec reflect this endpoint's actual implemented behavior exactly, with no drift (Section 14.3)?
- [ ] Does the Route Handler call exactly one Service Layer function (Section 14.2)?
- [ ] Is every documented error code for this endpoint actually reachable via a thrown, typed error (Section 14.3)?
- [ ] Does a contract test exist and pass for this endpoint (Section 14.3)?

---

# 15. State Management Standards

## 15.1 Purpose

To make 11-frontend-architecture.md's TanStack Query / Zustand split into a concrete, everyday decision rule, since state-management boundary confusion is one of the most common sources of frontend architectural drift.

## 15.2 The Decision Rule

```
Does this state represent data that lives on the server
(fetched via the API, potentially stale, needs caching/refetching)?
   │
   YES ──► TanStack Query (Section 15.3)
   │
   NO — is it UI state genuinely needed across distant parts
        of the component tree (not just parent-to-child props)?
          │
          YES ──► Zustand (Section 15.4)
          │
          NO ──► Local component state (useState/useReducer)
                  (Section 15.5)
```

## 15.3 TanStack Query Standards

**Rule:** every server-state read goes through a `useQuery` call with a well-defined, consistently-structured query key (matching the resource's identity — e.g., `["orders", orderId]`, `["products", { storeId, filters }]`) so caching and invalidation behave predictably; every server-state write goes through a `useMutation` call whose `onSuccess` handler invalidates exactly the query keys that mutation actually affects (never a blanket "invalidate everything," which defeats caching's purpose, and never an omitted invalidation, which leaves stale data visible after a successful mutation — both are equally-weighted mistakes this document treats as defects, not just performance nitpicks).

## 15.4 Zustand Standards

**Rule:** a Zustand store is created for one cohesive, cross-cutting client concern (e.g., cart UI state, active checkout step) — never as a general-purpose "global state" dumping ground for unrelated pieces of state that happen to both need to be "somewhere." A store's actions (state-mutating functions) are named per Section 7.5's verb-phrase convention and contain no server-fetching logic of their own (server data belongs in TanStack Query, Section 15.3, even if a Zustand store's action needs to trigger a related query invalidation, which it does by calling the query client, not by re-implementing fetching itself).

## 15.5 Local State

**Rule:** the default for any state used only within one component or its direct children — `useState` for simple values, `useReducer` for a state object with several related, jointly-updated fields (mirroring Section 9.5's discriminated-union modeling philosophy: a `useReducer`'s action types are themselves a discriminated union, not a pile of independent boolean flags).

## 15.6 Derived State

**Rule:** state that can be computed from other state is **not** stored separately — it is computed at render time (directly, or via `useMemo` per Section 10.8's deliberate-use standard if the computation is genuinely expensive) — storing a derived value in its own `useState`/Zustand field and manually keeping it "in sync" with its source is a common source of state-synchronization bugs this codebase avoids by construction, not by discipline alone.

## 15.7 Common Mistakes

- Storing server data (an Order fetched from the API) in a Zustand store instead of TanStack Query's cache, losing automatic caching/refetching/invalidation and reintroducing manual synchronization logic TanStack Query exists to eliminate (Section 15.2).
- A single, sprawling Zustand store holding every piece of client state in the application ("just one global store for everything"), instead of several small, cohesively-scoped stores per Section 15.4.
- Storing a derived value (e.g., a cart's computed subtotal) in its own state field that must be manually recalculated and kept in sync on every relevant change, instead of simply computing it at render time (Section 15.6).

## 15.8 Review Checklist

- [ ] Is server data managed through TanStack Query, never duplicated into Zustand or local state (Section 15.2–15.3)?
- [ ] Does every mutation's cache invalidation target exactly the affected query keys, neither too broad nor too narrow (Section 15.3)?
- [ ] Is each Zustand store scoped to one cohesive concern (Section 15.4)?
- [ ] Is any state present that could instead be derived at render time (Section 15.6)?


---

# 16. Error Handling Standards

## 16.1 Purpose

To make 10-backend-architecture.md Section 18's error taxonomy and 09-api-architecture.md Section 23's error catalog into everyday rules for how an engineer actually throws, catches, and surfaces errors — both backend and frontend.

## 16.2 Backend: Typed Errors Only

**Rule:** every intentionally-thrown error is an instance of the shared error taxonomy (10-backend-architecture.md Section 18.2) — a bare `throw new Error("something went wrong")` is a blocking finding, enforced by lint rule, with no exception. Every custom error's constructor requires its stable, documented `code` string (matching 09-api-architecture.md Section 23's catalog) as a mandatory argument.

## 16.3 Backend: One Catch Point

**Rule:** errors are allowed to propagate up from the Service/Repository layers uncaught, and are caught exactly once, at the pipeline's shared terminal error-handling boundary (10-backend-architecture.md Section 6.10) — a Route Handler wrapping its own Service Layer call in an ad hoc `try/catch` that reimplements error-to-response mapping is a layering violation (Section 4.5) as much as an error-handling one, and is treated as a blocking finding regardless of whether its bespoke mapping happens to produce a correct-looking response.

## 16.4 Frontend: Error Boundaries and Query Errors

**Rule:** rendering-time errors are caught by Next.js's route-level `error.tsx` boundaries (Section 11.4); data-fetching errors are surfaced through TanStack Query's own `error` state (Section 15.3), rendered via a consistent, design-system-driven error-state component (06-design-system.md's defined error-state pattern), never a raw, unstyled error message or a silently-swallowed failure that leaves a user staring at an indefinitely blank or loading UI.

## 16.5 User-Facing Error Messages

**Rule:** a client-facing error message is derived from the API response's stable `code` (09-api-architecture.md Section 23), mapped to a specific, actionable, plain-language message via a shared, centrally-maintained mapping table (06-design-system.md's content/voice guidelines govern the actual wording) — a raw `error.message` string from the API's `message` field is never displayed directly to an end user, since that field is documented (09-api-architecture.md Section 2.15) as developer-facing and safe-to-log, not guaranteed appropriate for direct end-user display without translation/rewording.

## 16.6 Silent Failure Prohibition

**Rule:** an empty `catch` block, or a `catch` that only logs and otherwise silently continues as if nothing happened, is never acceptable unless explicitly justified with a comment explaining why swallowing this specific error is the correct behavior (e.g., a genuinely optional, best-effort side effect — like a non-critical analytics event, per 10-backend-architecture.md Section 17.2's stated "fail open" cases — where the calling code's correctness doesn't depend on the side effect succeeding). Every other caught error either re-throws, returns a typed failure result (Section 9.9), or is otherwise visibly handled.

## 16.7 Common Mistakes

- A generic, unlisted `throw new Error(...)` instead of a taxonomy-conformant typed error, which the shared terminal handler will map to a correct-looking but under-specified `500` rather than the actual, more useful documented error code (Section 16.2).
- Displaying a raw API error message directly in the UI instead of mapping the stable `code` to an approved, user-appropriate message (Section 16.5).
- An empty `catch` block added "to stop the error from showing up" during debugging, left in place after the underlying issue was never actually resolved (Section 16.6).

## 16.8 Review Checklist

- [ ] Are all intentionally-thrown backend errors instances of the shared taxonomy, never a bare `Error` (Section 16.2)?
- [ ] Is there an ad hoc `try/catch` in a Route Handler duplicating the shared terminal error handler's job (Section 16.3)?
- [ ] Does the frontend surface data-fetching errors via TanStack Query's error state and a design-system error component, never a raw/unstyled failure (Section 16.4)?
- [ ] Is any raw API error message displayed directly to an end user instead of a mapped, approved message (Section 16.5)?
- [ ] Does any `catch` block silently swallow an error without justification (Section 16.6)?

---

# 17. Validation Standards

## 17.1 Purpose

To restate 10-backend-architecture.md Section 9.4's two-layer validation model (shape validation via Zod, business-rule validation via plain Service Layer logic) as a concrete, everyday coding rule, extended to the frontend's own validation needs.

## 17.2 Shape Validation: Zod, Always

**Rule:** every request body, query parameter, and path parameter is validated by a Zod schema before any handler logic executes (Section 14.2) — restated here as a validation-specific standard: an engineer never hand-writes manual `if (!body.email) throw ...`-style shape checks in place of a Zod schema; Zod is the single, non-negotiable mechanism for shape validation platform-wide.

## 17.3 Business-Rule Validation: Service Layer, Never Zod

**Rule:** a validation concern requiring database or cross-field business knowledge (08-database-design.md Section 26.5's cross-row invariants — "does this coupon still have remaining uses," "is this product publish-ready") is **not** expressed as a Zod refinement calling out to the database — Zod schemas remain pure, synchronous, and database-independent; this class of validation lives in the Service Layer as plain TypeScript logic, per 10-backend-architecture.md Section 9.4's explicit rationale for keeping the two layers distinct.

## 17.4 Shared Validation Schemas (Frontend/Backend Parity)

**Rule:** where a validation rule must be enforced identically on both the frontend (for immediate form feedback) and the backend (as the authoritative check), the Zod schema is defined **once**, in a shared package (`packages/types` or an equivalent shared-schema package, per 11-frontend-architecture.md), and imported by both — never independently reimplemented on each side, which would risk the two silently diverging (a frontend accepting input the backend then rejects, or vice versa, producing a confusing user experience).

## 17.5 Form Validation Standards

**Rule:** frontend forms use the shared Zod schema (Section 17.4) integrated with the codebase's form-handling approach, surfacing every field's validation error inline, adjacent to that field, the moment it can be determined (on blur or on submit, per the specific form's UX needs defined in 07-ui-screens-wireframes.md) — never a single generic "form has errors" banner that doesn't localize the problem to a specific field.

## 17.6 Common Mistakes

- Writing a Zod `.refine()` that calls out to the database to check a business rule, blurring the shape/business-rule boundary Section 17.3 exists to keep clean, and making the Zod schema impure and harder to test in isolation.
- Duplicating a validation rule by hand on the frontend and separately on the backend instead of sharing one Zod schema (Section 17.4), risking silent drift between the two.
- A form that only shows a generic top-level error message instead of highlighting the specific invalid field (Section 17.5), forcing the user to guess what actually went wrong.

## 17.7 Review Checklist

- [ ] Is every request shape validated via Zod, with no hand-rolled manual shape checks (Section 17.2)?
- [ ] Does any Zod schema perform database-dependent business-rule validation instead of pure shape validation (Section 17.3)?
- [ ] Is a validation rule needed on both frontend and backend implemented via one shared schema, not duplicated (Section 17.4)?
- [ ] Does frontend form validation surface errors per-field, not just as a generic banner (Section 17.5)?

---

# 18. Logging Standards

## 18.1 Purpose

To make 10-backend-architecture.md Section 19.1's structured-logging architecture into an everyday rule for what an engineer actually writes when they need to log something.

## 18.2 Structured Logging Only

**Rule:** every log line goes through the shared structured logger (10-backend-architecture.md Section 19.1) — `console.log`/`console.error` anywhere in `src/` is forbidden by lint rule, with no exception, since an unstructured log line lacks the correlation ID, module name, and severity level every other log line in the system carries, making it useless for the correlation-ID-driven debugging workflow (that document's Section 19.5) this entire observability strategy depends on.

## 18.3 What to Log, and at What Level

| Level | When to Use | Example |
|---|---|---|
| `debug` | Detailed internal state useful only during active local development/debugging, not expected to be reviewed in production logs routinely | A computed intermediate value in a complex pricing calculation |
| `info` | A significant, expected business event worth a durable trace, but not itself a problem | "Order placed," "Payout batch processed" |
| `warn` | An unexpected but recovered-from condition — the system handled it, but a human should eventually notice the pattern | A retried, eventually-successful external API call; a fallback path being taken |
| `error` | A failure that impacted the current operation's outcome, whether or not it was gracefully handled at a higher level | A Service Layer function's business-rule rejection is generally **not** logged at `error` (it's an expected, handled outcome — Section 16); a genuinely unexpected exception is |

## 18.4 Never Log Sensitive Data

**Rule:** restated as a binding logging-specific rule from 12-security-architecture.md's secrets-and-PII handling: no log line ever includes a raw password, token, full payment card number, or other field flagged sensitive at the schema layer (08-database-design.md Section 29.1) — the shared logger's automatic redaction (10-backend-architecture.md Section 19.1) is a defense-in-depth backstop, not a substitute for an engineer's own care in choosing what to pass into a log call in the first place.

## 18.5 Log Messages Are for Humans and Machines Both

**Rule:** a log message's free-text portion is written to be understood by a human scanning logs during an incident (clear, specific, not merely a variable dump), while its structured `context` fields carry the machine-queryable detail (IDs, counts, durations) — a good log line reads as a clear sentence *and* carries structured fields a dashboard/query can filter on; neither property is sacrificed for the other.

## 18.6 Common Mistakes

- Using `console.log` for "quick" debugging during development and forgetting to remove it or convert it to a structured log call before merging — caught by lint rule, but worth avoiding by habit rather than relying on the linter as the only safety net.
- Logging an entire request or entity object indiscriminately "for completeness," risking an accidental sensitive-field leak the shared logger's redaction may not anticipate for a field it doesn't already know to flag (Section 18.4) — log specific, deliberately-chosen fields, not indiscriminate object dumps.
- Logging every expected, handled business-rule rejection at `error` severity, drowning genuinely unexpected failures in routine noise and undermining Sentry's signal-to-noise ratio (10-backend-architecture.md Section 19.6's stated concern, restated here as a logging-discipline rule).

## 18.7 Review Checklist

- [ ] Is `console.log`/`console.error` present anywhere in this change (Section 18.2)?
- [ ] Is the chosen log level (Section 18.3) appropriate to the actual severity of the event?
- [ ] Does any log call risk including a sensitive field not already covered by automatic redaction (Section 18.4)?
- [ ] Are expected, handled business outcomes logged at an appropriately low severity, not `error` (Section 18.6)?


---

# 19. Security Coding Standards

## 19.1 Purpose

12-security-architecture.md defines the platform's security architecture and rationale in depth; this section restates its most code-level-relevant rules as everyday, checklist-driven engineering practice, so security is applied at the moment code is written, not only reviewed for afterward.

## 19.2 Input Handling

**Rule:** every external input (API request, webhook payload, environment variable) is validated via Zod (Section 17.2) before use; database access is exclusively via Drizzle's parameterized query builder (Section 13.2, 12-security-architecture.md Section 9.2) with zero raw SQL string interpolation of request-derived values, no exceptions.

## 19.3 Output Handling

**Rule:** every API response is shaped by an explicit serialization step (Section 14.5) that includes only fields the calling role/context is entitled to see (12-security-architecture.md Section 8.7) — a Repository Layer's full-row fetch is never returned directly as a response body; the Service Layer or response-shaping helper explicitly selects the caller-appropriate field subset.

## 19.4 Authentication and Authorization in Code

**Rule:** every Service Layer function operating on a specific resource performs its ownership check (Section 8.2 of 10-backend-architecture.md) as an explicit, visible line of code near the top of the function — never assumed satisfied because "the middleware already checked the role." An engineer adding a new resource-scoped endpoint writes this check explicitly, every time, rather than assuming a prior similar endpoint's pattern is somehow automatically inherited.

## 19.5 Mass Assignment Prevention (Restated as Practice)

**Rule:** a Zod input schema for an update operation lists **only** the fields that operation is permitted to modify — restated from 12-security-architecture.md Section 8.5 as a concrete authoring habit: when defining a new "update" schema, an engineer starts from the list of *editable* fields (per 09-api-architecture.md's documented endpoint), never from "all fields on the entity minus a few I should probably exclude," since the latter approach is exactly how a sensitive field (`storeId`, `verificationStatus`) accidentally becomes client-settable.

## 19.6 Secrets in Code

**Rule:** no credential, API key, or secret ever appears in source code, a comment, or a commit — configuration is read exclusively through the typed `env.ts` module (10-backend-architecture.md Section 23.1); automated secrets-scanning runs on every commit (13-testing-strategy.md Section 26.5), and a detected secret in a diff is a blocking finding requiring immediate credential rotation, not just removal from the diff (since the secret was, however briefly, exposed in version control history).

## 19.7 File Upload Handling

**Rule:** restated from 12-security-architecture.md Section 9.7 and 10-backend-architecture.md Section 11: object storage keys are always server-generated, never derived from a client-supplied filename; MIME type is verified against actual uploaded bytes, never trusted from a client-declared header, for any new upload-handling code an engineer writes.

## 19.8 Dependency Hygiene

**Rule:** a new third-party dependency is added only after checking its maintenance status, license compatibility, and (for anything handling sensitive data) its own security track record — automated dependency-vulnerability scanning (13-testing-strategy.md Section 24.7) catches known CVEs in already-added dependencies, but does not substitute for this upfront judgment when *choosing* to add a new one in the first place.

## 19.9 Common Mistakes

- Writing an "update" Zod schema by copying the full entity's field list and only remembering to remove `id`, forgetting a less-obvious sensitive field like `verificationStatus` (Section 19.5) — the correct habit is building the list up from what's editable, not down from everything.
- Assuming a resource-scoped endpoint's ownership check is "probably already handled somewhere" instead of writing the explicit check every single time a new such endpoint is added (Section 19.4).
- Committing a `.env.local` file or a hardcoded API key "temporarily" to unblock local testing (Section 19.6) — there is no accepted temporary exception to this rule, mirroring Section 6.2's identical stance on module-boundary bypasses.

## 19.10 Review Checklist

- [ ] Is every new input validated via Zod before use, with zero raw SQL interpolation anywhere in this change (Section 19.2)?
- [ ] Does every API response explicitly shape its output to the caller's entitled field set (Section 19.3)?
- [ ] Does every resource-scoped Service Layer function contain an explicit, visible ownership check (Section 19.4)?
- [ ] Does an "update" schema list only genuinely editable fields, with no sensitive/system-controlled field reachable (Section 19.5)?
- [ ] Is any credential, key, or secret present anywhere in this diff (Section 19.6)?

---

# 20. Performance Standards

## 20.1 Purpose

To make 10-backend-architecture.md Section 21 and 13-testing-strategy.md Section 13's performance strategy into concrete, everyday coding habits rather than a concern deferred to a later optimization pass.

## 20.2 Backend Query Performance

**Rule:** restated from Section 13.3–13.4 as a binding habit: any new Repository function touching a high-volume table (`Product`, `Order`, `Events` — 08-database-design.md's stated scale targets) is checked against `EXPLAIN ANALYZE` before merge (10-backend-architecture.md Section 21.7) — this is not deferred to a "performance review later" pass; it is part of writing the query correctly the first time.

## 20.3 Frontend Bundle Discipline

**Rule:** a new dependency added to a client-bundled package is evaluated for its bundle-size impact before being added — a large library imported for one small utility function is a signal to find a lighter alternative or extract just the needed logic, since 13-testing-strategy.md Section 13.3's Core Web Vitals targets (LCP, INP) are directly sensitive to shipped JavaScript weight, and an engineer's dependency choices are one of the most common, avoidable sources of that weight growing unnecessarily over time.

## 20.4 Image and Media Performance

**Rule:** every image rendered in a Next.js app uses the framework's built-in `next/image` component (never a raw `<img>` tag) so responsive sizing, lazy-loading, and format optimization (10-backend-architecture.md Section 11.4's server-side thumbnail generation, consumed correctly here) are applied automatically and consistently, rather than each engineer reimplementing (or forgetting to implement) these concerns per image.

## 20.5 Avoiding Premature Optimization

Restated directly from Section 3.4 (KISS) as a performance-specific application: an engineer does not add caching, memoization (Section 10.8), or a denormalized data structure in anticipation of a performance problem that hasn't been measured or demonstrated — 08-database-design.md Section 2.3's own "denormalize by measurement, not assumption" philosophy is the model this codebase follows at every layer, backend and frontend alike.

## 20.6 Common Mistakes

- Adding a large, general-purpose utility library for one small function's worth of functionality, quietly growing the client bundle for negligible benefit (Section 20.3).
- Using a raw `<img>` tag instead of `next/image` "because it was faster to type," losing automatic optimization for that image indefinitely until someone happens to notice and fix it (Section 20.4).
- Adding a cache layer or memoization around a function nobody has actually measured to be slow, adding complexity and a potential staleness bug for a problem that may not exist (Section 20.5).

## 20.7 Review Checklist

- [ ] Has a new query against a high-volume table been checked against `EXPLAIN ANALYZE` (Section 20.2)?
- [ ] Does a new dependency's bundle-size impact seem proportional to the functionality it provides (Section 20.3)?
- [ ] Is every rendered image using `next/image` rather than a raw `<img>` tag (Section 20.4)?
- [ ] Is any new caching/memoization justified by a measured performance problem, not speculative (Section 20.5)?

---

# 21. Accessibility Standards

## 21.1 Purpose

To make 13-testing-strategy.md Section 12's WCAG 2.2 AA testing standard into the everyday coding habits that make components pass that testing by construction, rather than requiring accessibility to be retrofitted after the fact.

## 21.2 Semantic HTML First

**Rule:** the correct semantic HTML element or ARIA role is used for every piece of UI — restated from Section 10.9 as its own accessibility-focused standard: a heading is a real heading element (`<h1>`–`<h6>`, matching the page's actual document outline, per 04-information-architecture.md's information hierarchy), a button is a real `<button>`, a list is a real `<ul>`/`<ol>`. Reaching for `packages/ui`'s shadcn/ui-and-Radix-based primitives (11-frontend-architecture.md) by default is what makes this the path of least resistance rather than an extra burden.

## 21.3 Keyboard Operability

**Rule:** every interactive element is operable via keyboard alone — restated as a concrete authoring habit: an engineer building any new interactive component tests it with a mouse put aside, tabbing through it, before considering it complete, not merely relying on the automated `axe-core` scan (13-testing-strategy.md Section 12.2) to catch what a two-minute manual keyboard pass would catch faster and more completely (automated scanning verifies ARIA attributes are present; it does not verify the resulting tab order and focus behavior is actually sensible).

## 21.4 Focus Management

**Rule:** any component that opens an overlay (modal, drawer, popover) traps focus within it while open and restores focus to the triggering element on close — this is provided by Radix UI's underlying primitives by default (11-frontend-architecture.md); an engineer building a *custom* overlay component that doesn't use those primitives is responsible for implementing this behavior explicitly, and is strongly discouraged from building a custom overlay at all when a Radix-based primitive already covers the need (Section 3.4's KISS principle applied here specifically).

## 21.5 Color and Contrast

**Rule:** color is never the sole means of conveying information (an error state is never indicated by red color alone — it pairs with an icon and/or text, per 06-design-system.md's error-state pattern); all text/background color combinations use 06-design-system.md's defined design tokens, which are themselves verified for WCAG AA contrast (13-testing-strategy.md Section 12.3) — an engineer never introduces an ad hoc, non-token color value for text specifically to "make it stand out," since doing so bypasses the contrast guarantee the token system exists to provide.

## 21.6 Alt Text and Media

**Rule:** restated as a binding practice from 08-database-design.md Section 22.7 and 09-api-architecture.md Section 6.10: every image has meaningful alt text — for a purely decorative image with no informational content, an explicitly empty `alt=""` (never an omitted `alt` attribute entirely) signals to assistive technology that the image is intentionally decorative and should be skipped, which is a materially different and better outcome than a screen reader announcing a meaningless filename.

## 21.7 Common Mistakes

- Building a custom clickable `<div>` for a button-like interaction instead of a real `<button>`/shadcn `Button`, losing keyboard operability and semantic meaning by default (Section 21.2).
- Shipping a new interactive component without ever tabbing through it manually, relying solely on the automated scan to catch keyboard/focus issues it isn't designed to catch (Section 21.3).
- Introducing a one-off color value for emphasis instead of using a design-system token, silently breaking the platform's contrast guarantee for that specific instance (Section 21.5).

## 21.8 Review Checklist

- [ ] Does every interactive element use correct semantic HTML or an accessible primitive, never a styled non-semantic element (Section 21.2)?
- [ ] Has the reviewer (or author) manually tabbed through any new interactive flow (Section 21.3)?
- [ ] Does any new overlay component correctly trap and restore focus (Section 21.4)?
- [ ] Is any information conveyed by color alone, without a text/icon pairing (Section 21.5)?
- [ ] Does every image have appropriate alt text, including explicit empty `alt=""` for decorative images (Section 21.6)?


---

# 22. Documentation Standards

## 22.1 Purpose

To state what must be written down, where, and in what form, so that documentation stays current, discoverable, and genuinely useful rather than becoming — as documentation commonly does — an abandoned artifact nobody trusts.

## 22.2 The Documentation Hierarchy

| Level | Lives In | Covers |
|---|---|---|
| Architecture | This documentation series (00–15 and beyond) | Why the system is shaped the way it is — decisions, trade-offs, rationale (Section 1.6's traceability principle) |
| Module/Package | A `README.md` at the root of each backend module and frontend package | What this specific module/package does, its public interface, and any module-specific conventions not already covered platform-wide by this document |
| Function/Component | Doc comments (Section 22.4) | What a specific exported function/component does, its parameters, and any non-obvious behavior |
| Inline | Code comments (Section 22.5) | Why a specific, non-obvious piece of code does what it does — never restating what's already clear from reading it |

## 22.3 Module README Standard

**Rule:** every backend module (`src/modules/{domain}/README.md`) and every frontend package (`packages/{name}/README.md`) has a short README stating: its responsibility (one or two sentences, mirroring its 10-backend-architecture.md Section 5 entry), its public interface's key exports, and any module-specific gotcha or convention a newcomer would otherwise have to discover the hard way. This is not a restatement of the full architecture document — it's a fast-orientation artifact for someone about to work in this specific folder.

## 22.4 Doc Comments

**Rule:** every exported Service Layer function, every exported custom hook, and every `packages/ui` component carries a doc comment (JSDoc-style, consumed by editor tooling) stating: what it does, its parameters' meaning (beyond what the type signature alone conveys), and — for Service Layer functions specifically — its authorization requirements and the 09-api-architecture.md endpoint(s) it backs, restated directly from 10-backend-architecture.md Section 26.5's stated documentation standard. A function whose name and types already make its behavior fully self-evident may have a brief one-line doc comment; the standard is proportional completeness, not a mandatory minimum line count for every function regardless of its complexity.

## 22.5 Comments Explain Why, Not What

**Rule:** a comment restating what the next line of code already clearly does (`// increment the counter` above `counter++`) is noise and is removed in review; a comment is warranted specifically when the *reason* for a piece of code isn't obvious from the code itself — a workaround for a specific third-party library quirk, a business rule whose origin isn't self-evident from the code alone (with a reference back to the specific document/section that specifies it, per Section 1.6), or a deliberately non-obvious performance trade-off.

| Good Comment | Bad Comment | Why |
|---|---|---|
| `// Razorpay requires amounts in minor units (paise); see 09-api-architecture.md Section 2.11` | `// convert to paise` above a line that already reads `amountInPaise = amount * 100` | The good comment explains an external constraint the reader couldn't infer from the code alone; the bad comment merely restates what's already legible. |
| `// Deliberately not memoized: this component re-renders rarely and the computation is cheap; see Section 20.5` | (no comment, leaving a reviewer to wonder if memoization was simply forgotten) | Explains a deliberate choice a future reader/reviewer might otherwise flag as an oversight. |

## 22.6 Keeping Documentation Current

**Rule:** a pull request that changes a module's public interface, a component's props, or a business rule updates the corresponding README/doc comment in the **same** pull request — documentation updates are never a separate, deferred follow-up ticket, mirroring 13-testing-strategy.md Section 3.2's identical stance on tests being written alongside the code they cover, not promised for later.

## 22.7 Common Mistakes

- A comment that merely narrates the next line in English, adding reading overhead without adding information (Section 22.5).
- A module README that was accurate at the module's creation but has silently gone stale as the module evolved, because updating it wasn't part of the habitual PR workflow (Section 22.6) — the fix is procedural (bake the update into the same PR, every time), not a periodic "documentation cleanup" effort that inevitably falls behind again.

## 22.8 Review Checklist

- [ ] Does a new/changed public function, hook, or component have an appropriately proportional doc comment (Section 22.4)?
- [ ] Does any comment merely restate what the code already makes obvious (Section 22.5)?
- [ ] If this change alters a module's public interface or a documented business rule, is the corresponding README/doc comment updated in this same PR (Section 22.6)?

---

# 23. Testing Expectations

## 23.1 Purpose

13-testing-strategy.md is the authoritative testing strategy document; this section exists specifically to state, briefly and without duplicating that document's depth, what "done" requires of every pull request's tests as a matter of engineering-standards discipline.

## 23.2 Tests Are Part of the Change, Not a Follow-Up

Restated as a binding rule (13-testing-strategy.md Section 3.2, Section 26.2): a pull request introducing new behavior without corresponding tests at the appropriate level (13-testing-strategy.md Section 5) is not mergeable — there is no "add tests in a follow-up PR" path for anything beyond a genuinely time-boxed, tracked, and rare exception requiring explicit sign-off (13-testing-strategy.md Section 26.6's bypass procedure).

## 23.3 Matching Test Level to Change

Restated from 13-testing-strategy.md Section 5.2's decision guide as an authoring habit: before writing a test, an engineer asks whether the change is pure logic (Unit), a rendered component (Component), a cross-module/database interaction (Integration), an HTTP contract (API), or a full business-critical journey (E2E, added sparingly per that document's Section 10.2) — and writes the test at that level, resisting the common shortcut of reaching for a slower, broader test (an E2E test for logic a Unit test could cover in milliseconds) simply because it feels more "thorough."

## 23.4 A Bug Fix Without a Regression Test Is Not a Fix

Restated as a binding rule from 13-testing-strategy.md Section 27.4: every bug-fix pull request includes a test that reproduces the original failure and confirms the fix resolves it — a fix merged without this is treated as incomplete, not merely as missing a nice-to-have.

## 23.5 Review Checklist

- [ ] Does this pull request include tests at the appropriate level(s) for the change it makes (Section 23.3)?
- [ ] If this is a bug fix, does it include a regression test reproducing the original failure (Section 23.4)?
- [ ] Do new/modified tests assert behavior, not implementation detail (13-testing-strategy.md Sections 6.3, 7.2)?


---

# 24. Git & Pull Request Standards

## 24.1 Purpose

To make the codebase's *history* — not just its current-state file tree — a legible, trustworthy artifact, since a well-organized present-day codebase built on an incoherent commit history is still hard to safely reason about (why was this line added, is it safe to revert this specific change).

## 24.2 Branching

**Rule:** short-lived, single-purpose feature branches off the main branch, named descriptively (`{type}/{short-description}`, e.g., `fix/coupon-expiry-timezone-bug`, `feat/creator-vacation-mode`) — a branch that accumulates unrelated commits over an extended lifetime is a signal the underlying work should have been split into multiple, independently-mergeable pieces (Section 5.4).

## 24.3 Commit Standards

**Rule:** commits follow the Conventional Commits format (`type(scope): description`, e.g., `fix(orders): correct timezone handling in coupon expiry check`) — chosen specifically because it makes the commit history itself machine-parseable (feeding automated changelog generation) and human-scannable (a reviewer or future archaeologist can quickly distinguish a `feat` from a `fix` from a `refactor` at a glance). Each commit is a single, coherent logical change — a commit that mixes an unrelated formatting pass with an actual behavioral change makes `git blame`/history review meaningfully harder, and is avoided per Section 5.4's identical principle applied at the commit level rather than only the PR level.

| Type | Used For |
|---|---|
| `feat` | A new user-facing or API-facing capability |
| `fix` | A bug fix |
| `refactor` | A change that doesn't alter behavior, only internal structure |
| `test` | Adding or improving tests without a corresponding behavior change |
| `docs` | Documentation-only changes |
| `chore` | Tooling, dependency, or configuration changes with no direct user-facing effect |

## 24.4 Pull Request Standards

**Rule:** every pull request description states: what changed and why (linking back to the relevant product requirement, 01-product-requirements.md, or bug report), how it was tested (which test levels, per Section 23.3), and any deliberate trade-off or follow-up work explicitly called out (never left implicit for a reviewer to guess at). A pull request template enforces this structure so it's the default, not something an author has to remember to include from a blank description box.

## 24.5 Pull Request Size

**Rule:** a pull request is sized to be reviewable in a single, focused sitting — restated from Section 5.4 as a git-specific standard: when a genuinely large feature can't reasonably be reviewed as one PR, it is broken into a sequence of smaller, independently-mergeable PRs (each behind a feature flag if the full feature isn't yet ready for exposure, per 10-backend-architecture.md Section 25.4's stated flag-based rollout pattern) rather than submitted as one sprawling change that inevitably receives a shallower review than a smaller one would.

## 24.6 Merge Strategy

**Rule:** squash-merge to the main branch, producing one clean commit per pull request on the main branch's history (with the PR's individual, possibly messier, in-progress commits preserved only on the now-closed feature branch) — this keeps main's history at the granularity that actually matters for future archaeology (one commit per reviewed, shipped unit of work) without requiring every individual work-in-progress commit on a feature branch to itself be a polished, atomic unit.

## 24.7 Common Mistakes

- A commit message like `"fixes"` or `"wip"` merged into main's history (avoided by the squash-merge strategy, Section 24.6, but still worth avoiding even on a feature branch for the reviewer's own sanity while the PR is in progress).
- A pull request description that says only "see title" or a bare link to a ticket, leaving a future reader with no context for *why* a change was made without leaving this document's own trail (Section 24.4).
- A single pull request bundling a new feature, an unrelated refactor, and a dependency upgrade together, making it difficult to review, difficult to revert cleanly, and difficult to understand in isolation later (Section 24.5, Section 5.4).

## 24.8 Review Checklist

- [ ] Does the branch name and commit history follow the stated conventions (Sections 24.2–24.3)?
- [ ] Does the PR description explain what changed, why, and how it was tested (Section 24.4)?
- [ ] Is this PR appropriately scoped for a focused single-sitting review, or should it be split (Section 24.5)?

---

# 25. Code Review Checklist

## 25.1 Purpose

To consolidate every review-relevant standard from Sections 2–24 into the single checklist a reviewer actually works through — this section is the practical, everyday distillation of everything preceding it, not new content.

## 25.2 The Reviewer's Mandate

Restated from Section 2.6: a reviewer is as accountable for a merged pull request's adherence to this document as its author. Reviewing is not a rubber-stamp formality; it is where this entire document's standards are actually enforced in practice, pull request by pull request.

## 25.3 Consolidated Review Checklist

**Architecture & Organization**
- [ ] Respects the dependency rule and layer responsibilities (Section 4).
- [ ] New code is placed correctly per the project-organization decision table (Section 5.3).
- [ ] No module-boundary violation — imports only from another module's public interface (Section 6).

**Naming & Style**
- [ ] Names follow the conventions for their category — file, component, function, variable, constant, type, enum (Section 7).
- [ ] Import ordering and file structure follow the stated conventions (Sections 7.14, 8).

**Language & Framework Usage**
- [ ] No unjustified `any`; Zod-derived types at every trust boundary (Section 9).
- [ ] Correct Server/Client Component boundary; no unnecessary `"use client"` hoisting (Section 10.5).
- [ ] Correct Route Handler vs. Server Action choice (Section 11.2).
- [ ] Three-layer backend structure respected; Repository Layer contains no business logic (Section 12).
- [ ] No N+1 queries; correct pagination; correct transaction usage (Section 13).
- [ ] OpenAPI spec updated alongside implementation; no drift (Section 14.3).
- [ ] Server state in TanStack Query, cross-cutting UI state in Zustand, everything else local (Section 15).

**Correctness & Safety**
- [ ] All thrown errors are taxonomy-conformant; no ad hoc `try/catch` duplicating the shared handler (Section 16).
- [ ] Shape validation via Zod; business-rule validation in the Service Layer, not conflated (Section 17).
- [ ] Structured logging only; correct severity level; no sensitive data logged (Section 18).
- [ ] Explicit ownership checks on every resource-scoped operation; no mass-assignment risk; no secrets in the diff (Section 19).
- [ ] No unmeasured premature optimization; no unmeasured performance regression either (Section 20).
- [ ] Semantic HTML, keyboard operability, and correct focus management for any new interactive UI (Section 21).

**Process**
- [ ] Documentation (READMEs, doc comments) updated in this same PR if the public interface or a business rule changed (Section 22.6).
- [ ] Tests present at the correct level(s); bug fixes include a regression test (Section 23).
- [ ] PR description and commit history meet the stated standards (Section 24).

## 25.4 Blocking vs. Non-Blocking Findings

**Rule:** every review comment is implicitly or explicitly classified — a Standard violation (Sections marked as Rules throughout this document) is a **blocking finding**, requiring resolution before merge; a Best Practice suggestion is **non-blocking**, left to the author's judgment, and should be phrased by the reviewer as a suggestion, not a demand, to keep the distinction clear and avoid review friction over genuinely optional stylistic preferences being treated as mandatory.

## 25.5 Review Turnaround and Etiquette

**Rule:** reviews are prioritized promptly (restated from 13-testing-strategy.md Section 24's fast-feedback philosophy, applied to human review latency, not just CI latency) — a pull request sitting unreviewed for days undermines the same fast-feedback principle this entire document is built around. Review comments are phrased constructively, addressing the code, never the author personally, consistent with this project's stated collaborative engineering culture.

## 25.6 Common Mistakes

- A reviewer approving a PR without actually working through the checklist, treating review as a formality rather than the primary enforcement mechanism for this entire document (Section 25.2).
- A reviewer treating a non-blocking stylistic preference as a blocking requirement, creating unnecessary friction and eroding trust in what "blocking" actually means (Section 25.4).


---

# 26. Refactoring Guidelines

## 26.1 Purpose

To make refactoring a normal, ongoing, low-risk part of engineering work rather than a rare, feared, big-bang event — since a codebase that can't be safely refactored incrementally inevitably accumulates the kind of complexity this entire document exists to prevent.

## 26.2 Refactoring Is Never Bundled With Behavior Change

**Rule:** restated from Section 5.4/24.5 as its own explicit standard: a pull request either changes behavior or restructures code without changing behavior — never both in the same PR. This is what makes a refactor genuinely low-risk to review (a reviewer confirming "this doesn't change behavior" is a fundamentally different, faster review than confirming "this new behavior is correct") and low-risk to revert independently if something goes wrong.

## 26.3 When to Refactor

| Signal | Response |
|---|---|
| A function/component mixes abstraction levels (Section 4.4) | Extract the lower-level detail into its own well-named function |
| Genuine logic duplication appears a second time (Section 3.3) | Consolidate into one shared, named location |
| A module's public interface has grown large and loosely-related (Section 6.5) | Consider splitting the module along its actual cohesive sub-concerns |
| A file mixes unrelated concerns despite reasonable length (Section 8.3) | Split along concept boundaries, not line-count targets |
| Tests for a piece of code are unusually hard to write | Often a signal the code itself has a design problem (excessive coupling, hidden dependencies) refactoring should address, rather than reaching for increasingly elaborate mocking to work around it |

## 26.4 Refactoring Safety Net

**Rule:** a refactor is only undertaken where the code being refactored has adequate existing test coverage (13-testing-strategy.md Section 25's risk-tiered coverage targets) to catch an accidental behavior change — if coverage is inadequate, the correct sequence is: add characterization tests capturing current behavior first (in their own PR), then refactor (in a second, separate PR) with confidence those tests would catch a regression, never refactor first and hope nothing broke.

## 26.5 Large-Scale Refactors

**Rule:** a refactor spanning many files or a core architectural pattern (e.g., migrating a module to a new internal structure) is preceded by an Engineering Decision Record (Section 29) and executed incrementally, in a sequence of small, individually-safe pull requests behind no behavior change at any single step — never as one large, high-risk "big bang" PR that's nearly impossible to review thoroughly or to safely revert if an issue surfaces after merge.

## 26.6 Common Mistakes

- "While I was in there" refactoring unrelated code in the middle of a feature PR, violating Section 26.2 and making the PR harder to review and riskier to revert.
- Refactoring code with poor test coverage on the assumption "it's a pure restructuring, it can't break anything" — restructuring that appears behavior-preserving to the author frequently isn't, which is exactly why Section 26.4's safety-net requirement exists.

## 26.7 Review Checklist

- [ ] Does this PR mix a refactor with an actual behavior change (Section 26.2)?
- [ ] Is the refactored code's existing test coverage adequate to catch an accidental regression (Section 26.4)?
- [ ] For a large-scale refactor, does an Engineering Decision Record exist, and is the work sequenced into small, individually-safe steps (Section 26.5)?

---

# 27. Technical Debt Management

## 27.1 Purpose

To treat technical debt as a tracked, visible, prioritized engineering concern — not an informal, tribal-knowledge understanding of "the parts of the codebase we all know are bad," which inevitably means it never actually gets addressed.

## 27.2 What Counts as Technical Debt

A deliberate, known shortcut taken for a legitimate reason (a deadline, an evolving requirement that made an earlier design choice no longer ideal) — distinct from a bug (which is simply incorrect behavior) and distinct from a design this document's standards were never applied to in the first place (which is a standards violation to fix directly, not "debt" to schedule for later, per Section 26.2's stated bundling prohibition making "later" the wrong default for a standards gap discoverable *now*).

## 27.3 Recording Technical Debt

**Rule:** every deliberate shortcut is recorded at the moment it's taken — an inline comment marking the specific location (`// TECH-DEBT: see TICKET-123 — this uses a synchronous check pending the async version in a follow-up`) **and** a corresponding tracked ticket with enough context for someone other than the original author to pick it up later. An undocumented, unticketed shortcut is functionally invisible debt — it cannot be prioritized, scheduled, or even remembered, and this document treats an undocumented shortcut as a worse practice than a documented one, even though the underlying code might be identical, because the *invisibility* is itself the harm.

## 27.4 Prioritizing Technical Debt

**Rule:** technical debt tickets are triaged with the same rigor as Section 27's bug-severity thinking (13-testing-strategy.md Section 27.2's severity matrix, adapted here) — debt with a growing blast radius (e.g., a shortcut in a module now being extended by multiple features, each compounding the original shortcut's awkwardness) is prioritized above debt in a stable, rarely-touched area, since the cost of *not* addressing it compounds specifically where change velocity is highest.

## 27.5 Dedicated Debt-Reduction Time

**Rule:** a defined, protected portion of engineering capacity (a recurring cadence — e.g., a fixed share of each cycle, decided by engineering leadership, not left to "whenever there's spare time," which in practice means never) is allocated specifically to technical debt reduction, treated with the same seriousness as feature-delivery capacity, not as an implicit afterthought squeezed in only when nothing else is urgent.

## 27.6 Common Mistakes

- Taking a shortcut under deadline pressure and mentally noting "I'll fix this later" without writing the comment or the ticket — later, without a tracked record, essentially never comes, and the debt becomes silently permanent (Section 27.3).
- Treating "we'll get to it eventually" as an actual prioritization strategy rather than protecting concrete, scheduled capacity for debt reduction (Section 27.5).

## 27.7 Review Checklist

- [ ] Does this PR introduce a deliberate shortcut that isn't recorded with both an inline comment and a tracked ticket (Section 27.3)?
- [ ] Is a pre-existing technical debt ticket referenced in this change actually being addressed by it, and can it be closed?

---

# 28. AI-Assisted Development Guidelines

## 28.1 Purpose

Given this project's own tooling and the broader engineering landscape, AI-assisted code generation is treated explicitly and deliberately in this document, rather than left as an unaddressed gray area every engineer navigates differently.

## 28.2 AI-Generated Code Is Reviewed Identically

**Rule:** code produced with AI assistance is held to every standard in this document exactly as rigorously as hand-written code — there is no relaxed review bar, no "it's probably fine, the AI wrote it" assumption, and no exemption from any section of this document. The engineer submitting a pull request is fully accountable for every line in it, regardless of how it was drafted, exactly as if they had typed it manually themselves.

## 28.3 AI as a Drafting Tool, Not a Decision-Maker

**Rule:** architectural decisions, module boundaries, security-sensitive logic (Section 19), and anything requiring the trade-off judgment Section 29's Engineering Decision Record process exists for are never delegated to an AI tool's suggestion without deliberate human review of the *reasoning*, not just the output — an AI-suggested approach is evaluated against this document's principles (Section 3) exactly as any human-proposed approach would be, not granted automatic deference for having been machine-generated.

## 28.4 Verifying AI-Generated Claims

**Rule:** an engineer using AI assistance to understand an unfamiliar part of the codebase, a library's behavior, or a security consideration independently verifies any factual claim before relying on it — AI tools can produce confident, plausible-sounding, and incorrect explanations, and this document holds the human engineer responsible for confirming correctness (via documentation, testing, or direct code inspection) exactly as they would be responsible for verifying a claim from any other unverified source.

## 28.5 Sensitive Data and AI Tools

**Rule:** no real user data, production credentials, or secrets (Section 19.6) are ever pasted into an external AI tool's prompt — consistent with 13-testing-strategy.md Section 22.6's absolute prohibition on real user data appearing in any non-production context, extended here explicitly to cover AI-assistant interactions, which are, from a data-handling perspective, simply another external, non-production surface.

## 28.6 Common Mistakes

- Accepting an AI-suggested code change without understanding *why* it works, resulting in a pull request the submitting engineer can't actually explain or defend in review (a violation of Section 28.2's accountability standard).
- Pasting a real error log containing user data or a real stack trace with sensitive context into an external AI tool for debugging help, rather than a sanitized/synthetic reproduction (Section 28.5).

## 28.7 Review Checklist

- [ ] Can the PR's author explain and defend every part of this change, regardless of how it was drafted (Section 28.2)?
- [ ] Does any AI-suggested architectural or security-sensitive decision show evidence of genuine human evaluation against this document's principles, not just acceptance (Section 28.3)?

---

# 29. Engineering Decision Records

## 29.1 Purpose

To give the team a lightweight, consistent, written process for decisions this document doesn't already settle — a new pattern, a new dependency, a deviation from an existing standard — so such decisions are made deliberately and are discoverable later, rather than settled informally in a chat message that's impossible to find in six months.

## 29.2 When a Decision Record Is Required

| Situation | Decision Record Required? |
|---|---|
| Introducing a new top-level folder, app, or package (Section 5.2) | Yes |
| Adding a new third-party dependency with platform-wide reach (not a narrowly-scoped, single-feature utility) | Yes |
| Deviating from a Standard (not a Best Practice) in this document for a specific, justified case | Yes |
| A large-scale refactor spanning many files or a core pattern (Section 26.5) | Yes |
| A routine feature implementation following existing, established patterns | No — this document itself is the record for how routine work is done |

## 29.3 Decision Record Format

A short, consistently-structured document (kept in a defined, discoverable location in the repository) stating: the context/problem, the options considered, the decision made and why, and the consequences/trade-offs accepted — deliberately brief (this is not a second architecture-documentation series; it is a lightweight log of specific, individual decisions) and always dated and attributed.

## 29.4 Decision Records Are Not Retroactive Justification

**Rule:** a decision record is written *before or during* the decision, not manufactured after the fact to retroactively justify a choice already made and shipped — a decision made without one, discovered later to have needed one, is corrected by writing the record honestly at that point (including, if true, "this was decided informally and is being documented after the fact"), not by pretending the deliberation happened when it didn't.

## 29.5 Common Mistakes

- Treating every minor implementation choice as requiring a formal decision record, creating process overhead disproportionate to the decision's actual weight (Section 29.2's table exists specifically to bound this).
- Skipping a decision record for a genuinely significant, hard-to-reverse choice (a new core dependency, a deviation from a Standard) because it felt like it could be "just discussed quickly," leaving no discoverable trail for the next engineer who wonders why the codebase does something unusual in one specific place.

## 29.6 Review Checklist

- [ ] Does this change fall into one of Section 29.2's required-decision-record categories without a corresponding record?
- [ ] If a decision record exists for this change, does it honestly reflect when the deliberation actually happened (Section 29.4)?

---

# 30. Definition of Done

## 30.1 Purpose

To state, unambiguously, the complete bar a unit of work must clear before it is considered finished — consolidating the specific completion criteria scattered across Sections 2–29 into one checklist an engineer can use to self-assess before ever opening a pull request for review.

## 30.2 Definition of Done Checklist

- [ ] The implementation satisfies its originally-stated acceptance criteria in full (13-testing-strategy.md Section 3.6).
- [ ] Code follows every applicable Standard in this document (Sections 4–21), with any deliberate, justified deviation recorded as an Engineering Decision Record (Section 29.2).
- [ ] Tests exist at the appropriate level(s) and pass (Section 23; 13-testing-strategy.md Section 5).
- [ ] The relevant OpenAPI spec, module README, and/or doc comments are updated in the same change if a public interface or business rule changed (Section 22.6, 14.3).
- [ ] The change passes every CI quality gate (13-testing-strategy.md Section 26.2) with no bypassed check.
- [ ] Any deliberate shortcut is recorded as tracked technical debt, not left silently undocumented (Section 27.3).
- [ ] The pull request has been reviewed and approved per Section 25's checklist, with every blocking finding resolved.
- [ ] For a bug fix, a regression test reproducing the original failure is included and passing (Section 23.4).
- [ ] For a change touching a Critical-risk-tier module (Payments, Auth, Checkout, Orders, Moderation — 13-testing-strategy.md Section 25.2), the additional scrutiny that tier requires (deeper review, broader test coverage) has been applied, not merely the standard bar.

## 30.3 "Done" Does Not Mean "Deployed"

**Rule:** this Definition of Done governs when a pull request is ready to merge; production deployment and release readiness are governed by 13-testing-strategy.md Section 29's separate release-readiness checklist, which layers additional, release-scoped criteria (E2E suite results, manual QA sign-off for higher-risk tiers) atop every individual merged change's own Definition of Done — a merged, "done" PR is a necessary but not sufficient condition for a release being ready to ship.

## 30.4 Review Checklist

- [ ] Does this pull request satisfy every item in Section 30.2 before being marked ready for review?

---

# 31. Engineering Review Checklist

Before this document is considered final and ready to govern day-to-day engineering practice, and periodically thereafter as the codebase and team evolve, it is reviewed against:

- [ ] **Consistency** — do this document's naming, structural, and process conventions match 08-database-design.md, 09-api-architecture.md, 10-backend-architecture.md, 11-frontend-architecture.md, 12-security-architecture.md, and 13-testing-strategy.md exactly, with no undocumented drift?
- [ ] **Security** — does Section 19's security coding standards fully reflect every control 12-security-architecture.md defines that has a code-level implication?
- [ ] **Scalability** — do this document's conventions (module boundaries, Section 6; query discipline, Section 13) remain sufficient as the codebase and team grow, per Section 2.7's stated design intent?
- [ ] **Performance** — are Section 20's performance standards still calibrated correctly against 13-testing-strategy.md Section 13's current, evidence-based targets?
- [ ] **Maintainability** — is every section's Rules/Best Practices/Common Mistakes/Review Checklist structure still complete and non-redundant?
- [ ] **Developer Experience** — does a new engineer, reading Sections 1–8, have what they need for a confident first pull request?
- [ ] **Future Readiness** — does this document's structure extend cleanly to new modules, packages, or patterns introduced since it was last reviewed, without requiring a rewrite?

---

*This document is the definitive engineering handbook for Dreams by Kalakaaar v2. No pull request should be opened, reviewed, or merged without it being consistent with the standards documented here — and, transitively, with 08-database-design.md, 09-api-architecture.md, 10-backend-architecture.md, 11-frontend-architecture.md, 12-security-architecture.md, and 13-testing-strategy.md. Where a situation arises that this document does not yet cover, it is resolved through the Engineering Decision Record process (Section 29) and this document is updated to reflect the outcome — the standard leads, the code follows.*
