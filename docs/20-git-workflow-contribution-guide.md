# 20 · Git Workflow & Contribution Guide — Dreams by Kalakaaar v2

**Document owner:** Principal Software Engineer / Engineering Manager
**Status:** Draft for review — the handbook every engineer reads before their first commit
**Audience:** Every engineer, present and future, and every AI-assisted contribution made on their behalf
**Depends on:** `00-project-vision.md` through `19` in full, most directly `13-testing-strategy.md`, `14-infrastructure-devops-architecture.md`, `15-engineering-standards.md`, and `17-performance-scalability-architecture.md`
**Precedes:** Every commit, branch, pull request, review, and release from this point forward

> **This document defines how code moves from an engineer's idea to production, safely and predictably, every time.** `15-engineering-standards.md` defines how code is written. This document defines how it travels — through a branch, a commit history, a pull request, a review, a merge, a release — and how every person and process along that path knows exactly what's expected of them.

---

# 1. Introduction

### Purpose

Every prior document in this series defines *what* the system does and *how* it is built. This document defines the last remaining, purely procedural question: **how does a change actually get from an engineer's local machine into production, and how does the team collaborate on that journey without stepping on each other, losing history, or shipping something nobody reviewed.** A team without this document is not a team without opinions about git — it is a team with as many slightly different git habits as it has engineers, each one a small, compounding source of friction, lost context, and inconsistent history.

### Scope

**In scope:** git philosophy and repository structure; branching, naming, and commit conventions; the full pull request lifecycle and code review standards; merge strategy and conflict resolution; release and hotfix workflows; semantic versioning; documentation and Architecture Decision Record contribution; dependency management and technical debt policy; AI-assisted development rules; contributor responsibilities including pairing and security contribution; and new engineer onboarding.

**Out of scope:** the actual CI/CD pipeline implementation (`14-infrastructure-devops-architecture.md` Section 6's domain — this document defines what triggers it and what gates it enforces, never its configuration syntax), coding standards themselves (`15-engineering-standards.md`'s domain, referenced not restated), and testing strategy in depth (`13-testing-strategy.md`'s domain, referenced wherever a workflow step depends on it).

### Audience

Every engineer — founding, senior, or first-week — and, per Section 17, every AI coding assistant operating under an engineer's direction. This document is written so a new hire's first pull request looks structurally identical to a five-year veteran's five-hundredth.

### Objectives

1. Make the path from idea to production **predictable** — the same shape of change should always move through the same shape of workflow, regardless of who's driving it.
2. Make collaboration **low-friction** — branch names, commit messages, and PR structure exist so that any engineer can understand any other engineer's in-progress or completed work without needing to ask.
3. Make history **legible and permanent** — restated from `15-engineering-standards.md` Section 2.3's "code is read far more than written" principle, applied to git history itself: a commit log is read by future engineers debugging a regression years from now, and this document's conventions (Section 6) exist to make that reading fast and trustworthy.
4. Make releases **safe and reversible** — Sections 11–13 extend `14-infrastructure-devops-architecture.md` Section 6's deployment architecture with the human-workflow discipline that feeds it correctly-formed, correctly-versioned, correctly-reviewed changes.
5. Make quality **structural**, not aspirational — every rule in this document is, wherever possible, enforced by branch protection, required status checks, and CODEOWNERS routing (Section 3.4), not left to memory and goodwill, mirroring `15-engineering-standards.md` Section 1.4's identical stated objective for coding standards.

### Definitions

| Term | Meaning in this document |
|---|---|
| Trunk | The `main` branch — the single, always-deployable source of truth (Section 4.2). |
| Feature Branch | A short-lived branch created from trunk for one cohesive unit of work (Section 4.3). |
| Draft PR | A pull request opened before its change is ready for review, signaling work-in-progress (Section 7.3). |
| Blocking Review Comment | A review finding that must be resolved before merge (Section 8.5), mirroring `15-engineering-standards.md`'s identical Blocking Finding concept. |
| Squash Merge | A merge strategy collapsing a branch's commits into one commit on trunk (Section 9.2). |
| Release Branch | A short-lived branch cut from trunk to stabilize a release candidate (Section 11). |
| Hotfix | An emergency, expedited fix for a production-impacting issue, following a compressed but never skipped version of the standard workflow (Section 12). |
| ADR | Architecture Decision Record — a durable, versioned record of a significant technical decision and its reasoning (Section 14.4). |

### References

This document assumes and builds directly on `13-testing-strategy.md`'s quality gates and release-readiness process (Sections 26, 29 of that document), `14-infrastructure-devops-architecture.md`'s deployment architecture (Section 6 of that document), `15-engineering-standards.md`'s coding and review standards (Sections 25–29 of that document), and `12-security-architecture.md`'s CI/CD security posture (Section 24 of that document). Where this document names a gate, a check, or a standard already defined elsewhere, it references that document directly rather than restating it.

### How to Use This Document

A new engineer reads Sections 1–8 in full before their first pull request (Section 19 sequences this explicitly). Every other section is a living reference, consulted as the relevant situation — a release, a hotfix, a dependency bump, an AI-assisted contribution — actually arises.

---

# 2. Git Philosophy

### Purpose

To state, once, the values every more specific rule in Sections 3–21 is downstream of.

### Rules

**Trunk-Based Development.** `main` is always deployable (Section 4.2) — restated as a Standard, not an aspiration: a broken `main` is treated with the same urgency as a production incident (`12-security-architecture.md` Section 26's severity model applied to the trunk's own health), because every engineer's next branch is created from it and every deployment (`14-infrastructure-devops-architecture.md` Section 6.3) is triggered from it.

**Small, Frequent Changes Over Large, Infrequent Ones.** A pull request that does one cohesive thing (`15-engineering-standards.md` Section 5.4) merges faster, reviews more thoroughly, and reverts more safely than a large, multi-concern one — this preference is stated once here and enforced throughout Sections 4, 7–9.

**History Is a Product, Not a Byproduct.** Commit messages (Section 6) and PR descriptions (Section 7.4) are written for a future reader — an engineer running `git blame` during an incident six months from now — not merely as a formality to satisfy a required field.

**Automate the Enforceable, Review the Judgment-Requiring.** Every rule in this document that *can* be enforced by tooling (branch protection, required checks, commit-format linting) is — mirroring `15-engineering-standards.md` Section 1.4's identical philosophy — reserving human review (Section 8) for the things only human judgment can assess: is this the right design, does this test actually cover the risk, is this the right trade-off.

### Best Practices

- Commit early and often locally; curate before pushing (Section 6.6) — local history is a scratchpad, pushed history is a product.
- Keep a feature branch's lifetime short (Section 4.3) — the longer a branch lives, the more it diverges from trunk and the more expensive its eventual merge becomes.

### Common Mistakes

- Treating `main`'s deployability as someone else's problem — restated from Section 2.6 of `15-engineering-standards.md`: quality, including trunk health, is everyone's responsibility, not a gate owned solely by whoever last merged.
- Batching many unrelated changes into one long-lived branch "to save review overhead," which in practice multiplies review difficulty and revert risk (Section 4.3).

### Review Checklist

- [ ] Does this change keep `main` deployable at every point in its history (Section 2, Rule 1)?
- [ ] Is this pull request the smallest cohesive unit of work it could reasonably be (Section 2, Rule 2)?

---

# 3. Repository Structure

### Purpose

To define how the single Turborepo monorepo (`11-frontend-architecture.md` Section 3.3, `10-backend-architecture.md` Section 4) is governed as a shared, collaboratively-owned artifact — repository *structure* is that document's domain; repository *ownership and contribution rules* are this document's.

### Rules

**One Monorepo, One Set of Contribution Rules.** `apps/buyer`, `apps/creator`, `apps/internal`, and every `packages/*` package live in one repository with one branching model (Section 4), one PR process (Section 7), and one release cadence (Section 11) — restated from `15-engineering-standards.md` Section 5.2: introducing a new top-level folder, app, or package requires an Engineering Decision Record equivalent (this document's ADR process, Section 14.4), never an ad hoc addition.

**CODEOWNERS as Enforced, Not Advisory, Routing.** A `CODEOWNERS` file, mirroring `11-frontend-architecture.md` Section 4.6's ownership table exactly, automatically routes review requests: `apps/buyer` to Buyer Experience engineers, `packages/ui` to Design Systems Engineering (cross-functional with Design, per `06-design-system.md` Section 1.4), `packages/api-client`/`packages/types` requiring review from at least one engineer outside the proposing app's team, and `packages/auth` requiring a security-conscious senior engineer regardless of author. **Why this is enforced, not advisory:** an advisory ownership convention degrades under deadline pressure exactly when it matters most; branch-protection-enforced CODEOWNERS review (Section 8.2) never does.

**No Force-Push to Trunk, Ever.** `main`'s history is append-only from the perspective of any individual engineer — force-pushes to `main` are disabled at the repository-configuration level (mirroring `12-security-architecture.md` Section 24.2's identical direct-push prohibition), since a force-push to trunk can silently destroy another engineer's already-merged work.

### Best Practices

- Keep the repository root clean and navigable — `15-engineering-standards.md` Section 5.3's "where new code goes" decision table is the canonical reference; a contributor unsure where something belongs consults it before creating a new location.
- Treat `CODEOWNERS` as a living document, updated whenever team structure or module ownership genuinely changes (Section 21.3), not left to silently drift from actual practice.

### Common Mistakes

- Adding a new top-level folder for "just this one thing" instead of finding its correct home in the existing structure (`15-engineering-standards.md` Section 5.6) — a strong signal to pause and raise the ambiguity explicitly rather than resolve it unilaterally.
- Assuming CODEOWNERS review is a formality to route around when a reviewer "isn't available fast enough" — restated as a firm rule: the correct response to a slow required reviewer is to flag it (Section 8.6's escalation path), never to merge without the required review.

### Review Checklist

- [ ] Is new code placed according to the existing monorepo structure, with no new top-level structure introduced without an ADR (Section 14.4)?
- [ ] Does this change correctly route to its `CODEOWNERS`-defined required reviewer(s)?

---

# 4. Branching Strategy

### Purpose

To define the platform's trunk-based branching model precisely enough that "what branch do I create, and from where" is never an ambiguous question.

### Rules

**Trunk-Based Development, restated as concrete structure:**

```
main (always deployable, per 14-infrastructure-devops-architecture.md §6.3)
  │
  ├── feature/{ticket-id}-{short-description}   (Section 5)
  ├── fix/{ticket-id}-{short-description}
  ├── chore/{short-description}
  ├── release/{version}                          (Section 11, cut only at release time)
  └── hotfix/{ticket-id}-{short-description}      (Section 12, cut from main directly)
```

**Every feature/fix/chore branch is created from the latest `main`**, never from another in-progress feature branch (which would couple two unrelated changes' lifecycles and history) — restated as a Standard: branching from a branch other than current `main` requires an explicit, reviewed justification (a genuinely dependent, sequenced pair of PRs, Section 4.5), never a default habit.

**Branch Lifetime Is Short.** A feature branch's target lifetime is measured in days, not weeks — restated from Section 2's philosophy: the longer a branch lives, the more expensive its eventual merge and the higher its risk of silent divergence from trunk. A branch approaching or exceeding two weeks of age without merging is flagged in Section 21's regular engineering review as a signal the underlying work may need to be split into smaller, independently-mergable pieces (mirroring `15-engineering-standards.md` Section 3.5's DRY-vs-premature-abstraction discipline, applied here to work decomposition instead of code).

### Feature Development Workflow

```
1. Pick up a ticket/task, confirm acceptance criteria are defined
   (13-testing-strategy.md §3.6)
2. Branch from latest main: feature/{ticket-id}-{description}
3. Implement + write tests in the same branch, per 15-engineering-
   standards.md §3.2's "tests alongside code, same PR" rule
4. Push regularly; open a Draft PR early (§7.3) if the work benefits
   from early, in-progress visibility
5. Mark PR ready for review once complete and self-reviewed (§7.5)
6. Address review feedback (§8)
7. Merge via the appropriate strategy (§9) once all gates pass
8. Delete the branch immediately after merge (§4.6)
```

### Bug Fix Workflow

Identical shape to Feature Development, using the `fix/` prefix, with one mandatory addition per `13-testing-strategy.md` Section 3.4/27.4: a regression test reproducing the original failure is written and confirmed failing *before* the fix itself is written — restated here as a branching-workflow-level checkpoint, not merely a testing-strategy aspiration: a `fix/` branch's first meaningful commit is the failing regression test, its second is the fix that makes it pass.

### Chore/Maintenance Workflow

Used for dependency updates (Section 15), documentation-only changes (Section 14), and other non-feature, non-fix maintenance work — following the same branch-and-PR shape but typically qualifying for Section 9.4's lighter-weight review/merge path given its lower risk profile.

### Branch Dependency (Stacked Branches)

Where a large body of work is deliberately decomposed into a sequence of dependent PRs (Section 2's "small changes" preference applied to genuinely large features), each subsequent branch is created from the prior one, explicitly labeled as stacked in its PR description (Section 7.4), and merged in sequence — never treated as a substitute for genuine decomposition where the pieces could instead be made independent.

### Best Practices

- Sync a long-running feature branch with `main` regularly (a rebase or merge, per Section 10.2's guidance) rather than letting it drift for the branch's full lifetime and facing one large, difficult reconciliation at the end.
- Prefer decomposing large work into independently-mergable pieces over a single long-lived branch, even when that requires more upfront design thought about sequencing.

### Common Mistakes

- Branching from another feature branch by habit rather than deliberate, justified choice (Rule 2), creating a tangled, hard-to-reason-about dependency chain.
- Letting a branch live for weeks without syncing against `main`, producing a large, conflict-heavy merge at the end that could have been avoided by regular, incremental syncing.
- Writing the fix before the regression test on a `fix/` branch, losing the verification that the test would have actually failed against the original bug (defeating the purpose of `13-testing-strategy.md` Section 3.4's test-first discipline).

### Review Checklist

- [ ] Was this branch created from current `main` (or an explicitly justified, labeled stacked branch)?
- [ ] Does the branch's age and scope suggest it should have been decomposed further?
- [ ] For a `fix/` branch, does the commit history show a failing regression test preceding the fix?

---

# 5. Branch Naming Conventions

### Purpose

A branch name is the first, cheapest piece of context any other engineer sees — restated from `15-engineering-standards.md` Section 7.1's naming philosophy, applied to branches specifically: a correctly-named branch needs no further explanation to understand its type and subject at a glance.

### Rules

**Pattern:** `{type}/{ticket-id}-{kebab-case-short-description}`

| Type | Use | Example |
|---|---|---|
| `feature/` | New functionality | `feature/DK-482-creator-payout-history` |
| `fix/` | A bug fix | `fix/DK-511-cart-quantity-race-condition` |
| `chore/` | Maintenance, dependency updates, tooling | `chore/upgrade-drizzle-orm` |
| `docs/` | Documentation-only changes | `docs/update-onboarding-guide` |
| `refactor/` | Restructuring with no behavior change (Section 16.2) | `refactor/extract-shared-pagination-helper` |
| `release/` | A release branch (Section 11) | `release/2.4.0` |
| `hotfix/` | An emergency production fix (Section 12) | `hotfix/DK-611-payment-webhook-signature` |

**Ticket ID is mandatory for `feature/` and `fix/` branches** (traceable back to a tracked unit of work, per `13-testing-strategy.md` Section 27's bug-lifecycle and `01-product-requirements.md`'s requirement-traceability philosophy applied to engineering execution) — a `feature/`or `fix/` branch with no corresponding tracked ticket is a signal the work wasn't properly scoped or prioritized before starting, not merely a naming-convention gap.

**Descriptions are short, specific, and kebab-case** — mirroring `15-engineering-standards.md` Section 7.6's variable-naming specificity principle: `feature/DK-482-payouts` is too vague to be useful; `feature/DK-482-creator-payout-history-export` states the actual subject.

### Best Practices

- Keep the description under roughly six words — a branch name is a label, not a summary; the full context belongs in the PR description (Section 7.4) and commit messages (Section 6).
- Use the same ticket ID consistently across the branch name, commit messages (Section 6.3), and PR title (Section 7.4) so all three are trivially cross-referenceable.

### Common Mistakes

- Vague, generic branch names (`fix/bug`, `feature/update`) that provide zero scanning value in a branch list or PR queue.
- Reusing a branch name after deletion for an unrelated piece of work, creating confusing historical ambiguity if the deleted branch's PR or CI history is ever referenced later.

### Review Checklist

- [ ] Does the branch name follow the `{type}/{ticket-id}-{description}` pattern?
- [ ] Is the description specific enough to convey the branch's actual subject without opening the PR?

---

# 6. Commit Message Standards

### Purpose

Restated from Section 2's "history is a product" philosophy: a commit message is read far more often, by far more people, over a far longer time horizon than it is written — this section makes that reading fast and reliable.

### Rules

**Conventional Commits, platform-wide, enforced by commit-lint tooling on every push:**

```
{type}({scope}): {short, imperative-mood summary}

{optional longer body — the "why," not a restatement of the "what"
already visible in the diff}

{optional footer — ticket reference, breaking-change notice}
```

| Type | Use |
|---|---|
| `feat` | A new feature, user- or system-facing |
| `fix` | A bug fix |
| `docs` | Documentation-only change |
| `refactor` | Restructuring with no behavior change |
| `test` | Adding or correcting tests, no production-code behavior change |
| `chore` | Tooling, dependency updates, non-production-code maintenance |
| `perf` | A change specifically and primarily for performance (`17-performance-scalability-architecture.md`'s domain) |
| `ci` | CI/CD pipeline configuration changes |
| `revert` | Reverting a prior commit |

**Scope** names the affected module or package (`feat(payouts): ...`, `fix(checkout): ...`), matching `15-engineering-standards.md` Section 5.3's module/package vocabulary exactly — this is what makes `git log --grep` and scoped history review (Section 6.5) genuinely useful at monorepo scale.

**Summary is imperative mood, present tense, no trailing period** — "add creator payout export," never "added" or "adds" or "Adding" — mirroring the convention git's own tooling (merge commit messages, `git revert`) already assumes.

**Breaking changes are flagged explicitly**, via a `!` after the type/scope (`feat(api)!: ...`) and a `BREAKING CHANGE:` footer explaining the impact — this is the mechanism Section 13's semantic-versioning automation depends on to correctly classify a release's version bump.

### Commit Examples

**Good:**
```
feat(creator-dashboard): add payout history export to CSV

Creators requested the ability to export payout history for their
own bookkeeping (per support ticket volume, DK-490). Reuses the
existing shared CSV-export utility from packages/utils.

Refs: DK-490
```

**Bad:**
```
fixed stuff
```
```
WIP
```
```
Update ProductCard.tsx
```

*Why the "bad" examples fail:* `"fixed stuff"` carries zero scope or subject information; `"WIP"` is a local-history-only marker that should never reach pushed, reviewable history (Section 6.6); `"Update ProductCard.tsx"` restates the diff's file path, which `git log` already shows, without conveying the actual *change* or *why*.

### Commit Granularity

**Rule:** a pushed commit represents one logical, reviewable step — restated from `15-engineering-standards.md` Section 4.4's "coherent narrative" principle, applied to commit history instead of function bodies: a commit history that reads top-to-bottom as a clear sequence of logical steps (add the schema migration; add the Repository function; add the Service Layer logic; add the Route Handler; add tests) is preferred over either one enormous commit or dozens of trivial, noisy ones ("fix typo," "fix typo again").

### Local History Curation

**Rule:** before pushing, an engineer curates local, exploratory commits (interactive rebase, squashing false-starts and "WIP" markers) into the clean, logical sequence Section 6.4 describes — local history is a scratchpad (Section 2's philosophy); pushed history is the product every future reader depends on.

### Best Practices

- Reference the ticket ID in every commit's footer (Section 5's branch-naming consistency extended to commits) so `git log` and issue-tracker cross-referencing stay trivially connected.
- Write the commit body to answer "why," not "what" — the diff already shows what changed; the body's value is explaining a decision or trade-off the diff alone can't convey.

### Common Mistakes

- Pushing raw, uncurated local history (`WIP`, `fix`, `fix again`, `actually fix`) instead of curating it into a clean, logical sequence before pushing (Section 6.6).
- Writing a commit body that merely restates the diff in prose ("changed the button color to blue") instead of explaining the reasoning a diff alone can't show.
- Omitting the `BREAKING CHANGE` footer for a genuinely breaking API change, silently breaking Section 13's automated version-bump classification.

### Review Checklist

- [ ] Does every commit in this PR follow the Conventional Commits format?
- [ ] Is local, exploratory history curated into a clean, logical sequence before pushing (Section 6.6)?
- [ ] Are breaking changes explicitly flagged (Section 6, Rule 4)?

---

