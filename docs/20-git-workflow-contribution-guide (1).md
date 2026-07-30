# 20 · Git Workflow & Contribution Guide — Dreams by Kalakaaar v2

**Document owner:** Principal Software Engineer / Staff Developer Experience Engineer
**Status:** Draft for review
**Audience:** Every engineer, present and future — this is the document a new contributor reads before their first commit
**Last updated:** 2026
**Depends on:** 00-project-vision.md through 19-operations-runbook.md in full, most directly 15-engineering-standards.md (Sections 3–8, 24–29) and 16-cicd-release-management.md (Sections 3–5, 12, 17, 24)
**Precedes:** Every commit, branch, and pull request in this repository

> **This document is the human collaboration layer, not the pipeline.** 16-cicd-release-management.md defines how code moves safely from commit to production — the machinery. 15-engineering-standards.md defines how code is written — the craft. This document defines how people work together inside that machinery and that craft: how a contributor picks up work, structures a branch and its commits, writes a pull request another human will actually enjoy reviewing, and grows from a first-week contributor into someone who reviews others' work with confidence. Where this document's subject matter is already fully specified elsewhere in this series, it says so explicitly and points there rather than re-deriving it — this is deliberate, not an oversight.

---

# 1. Introduction

## 1.1 Purpose

Every prior document in this series describes a system worth building and the disciplined engineering practice for building it correctly. This document describes something more specific and more human: how a person — a founding engineer on day one, or an engineer joining eighteen months from now — actually works inside this repository day to day, from picking up a ticket to seeing their code run in production, and how they collaborate with everyone else doing the same thing at the same time without stepping on each other.

## 1.2 Scope

**In scope:** the day-to-day contributor experience — repository structure from a working engineer's vantage point, branching and commit conventions, the full pull request lifecycle and code review culture, merge strategy and conflict resolution, release-branch and hotfix workflow (as a contributor experiences them), versioning, documentation contribution, dependency management workflow, technical debt policy from a day-to-day contribution lens, AI-assisted development rules, pair programming guidance, and new-engineer onboarding.

**Out of scope:** the CI/CD pipeline's own internal mechanics (owned by 16-cicd-release-management.md — this document describes what a contributor does; that document describes what happens to their code once it's pushed), the coding standards themselves (owned by 15-engineering-standards.md — this document assumes that document's Rules as given and focuses on collaboration process around them), and infrastructure/deployment architecture (owned by 14-infrastructure-devops-architecture.md).

## 1.3 Audience

Every engineer who will ever open a pull request against this repository — this document is written to be equally useful as a first-week onboarding read (Section 19) and as a standing reference an experienced contributor still consults for a specific convention.

## 1.4 Objectives

1. Make contributing **predictable** — restated from 15-engineering-standards.md Section 1.4's identical objective, applied here specifically to the *process* of contributing rather than the code itself: a contributor should never have to guess how to name a branch, structure a commit, or format a pull request.
2. Make code review **a genuinely collaborative, developmental practice**, not a gate to be endured — Section 8 treats review as one of this team's primary mechanisms for shared learning and codebase-wide quality, not merely a bureaucratic checkpoint.
3. Make the monorepo **approachable** — Section 3 orients a contributor (especially a new one) to a large, multi-app, multi-package codebase without requiring them to already have a mental map of the whole thing.
4. Make onboarding **fast and complete** — Section 19 is written so a new engineer's first week produces a real, merged, production pull request, not merely a series of reading assignments.
5. Make the practices in this document **actually followed**, not merely written down — every section states not just the rule but the reviewer-facing checklist that keeps it enforced in practice, consistent with 15-engineering-standards.md Section 25.2's stated reviewer mandate.

## 1.5 Definitions

Restated from 15-engineering-standards.md Section 1.5 and 16-cicd-release-management.md Section 1.5 without modification — this document uses those two documents' terminology (Convention, Standard, Deployment, Release, Rollback, Hotfix) exactly as defined there, adding only the terms specific to this document's own scope:

| Term | Meaning in this document |
|---|---|
| Contribution | Any change proposed to the repository — code, tests, or documentation — regardless of its author's tenure or role. |
| Contributor | Anyone opening a pull request against this repository — every engineer, at every level, is a contributor first. |
| CODEOWNERS | The repository mechanism mapping file/folder paths to required reviewers (Section 8.5). |
| ADR (Architecture Decision Record) | The specific, lightweight document format this repository uses to record a significant, hard-to-reverse technical decision (Section 14.4) — the concrete artifact 15-engineering-standards.md Section 29's Engineering Decision Record process produces. |

## 1.6 References

This document is the contributor-facing synthesis of, and defers entirely to, 15-engineering-standards.md for coding standards and 16-cicd-release-management.md for pipeline/deployment mechanics. Wherever this document's topic list overlaps with those two documents' own stated scope (branching, PR lifecycle, hotfix, versioning), this document states the rule concisely, cites the authoritative source, and focuses its own added detail on the contributor-experience and collaboration-culture dimensions those two more architecturally-focused documents don't fully cover.

## 1.7 Guiding Principles

1. **Every contributor is a first-class contributor.** There is no tenure-based exception to any convention in this document — restated from 15-engineering-standards.md Section 2.6, a founding engineer's pull request is reviewed against the identical bar as a new hire's first one.
2. **Small, frequent contributions beat large, infrequent ones.** Restated from 16-cicd-release-management.md Section 2.1's trunk-based development philosophy, this document's Section 4 and Section 7 exist to make small, frequent contribution the natural, easy default.
3. **Review is teaching, not gatekeeping.** A reviewer's job is to make the codebase better and the author better at working in it — restated as this document's central cultural commitment, elaborated fully in Section 8.
4. **Documentation and code are contributed with equal seriousness.** Section 14 treats a documentation pull request with the same process rigor as a code one, since this entire documentation series' value depends on it staying current.
5. **The repository's history is a product, not a byproduct.** Restated from 15-engineering-standards.md Section 24.1: commits and pull requests are written for the future engineer who will read them during an investigation (18-observability-monitoring.md Section 19) or an archaeology exercise, not merely to satisfy the merge button.

## 1.8 Non-Goals

This document does not: redefine coding standards (15) or pipeline mechanics (16); include GitHub Actions configuration or any executable script; or prescribe a specific project-management/ticketing tool beyond assuming pull requests reference a tracked work item.

---

# 2. Git Philosophy

## 2.1 Git as a Communication Tool, Not Just a Version Store

Restated as this document's foundational stance: this team treats Git history — commit messages, branch names, pull request descriptions — as a form of technical writing aimed at a future reader, not merely a mechanical record of what changed. A commit message and a pull request description are documentation with a very specific, very valuable audience: the engineer (possibly the same person, months later) trying to understand why the codebase looks the way it does.

## 2.2 Trunk-Based Development, Restated

Fully specified in 16-cicd-release-management.md Section 2.5 and Section 4; this document does not re-derive it. The short version, for orientation: one long-lived branch (`main`), always deployable, with short-lived feature branches merging back frequently — restated here only because every subsequent section of this document assumes it as the working model a contributor operates within.

## 2.3 Small Commits, Small Pull Requests

Restated and extended from 15-engineering-standards.md Section 24.5 and Section 5.4: this team's default is that a pull request should be reviewable in one focused sitting. This isn't a rule imposed for its own sake — it's a direct consequence of Section 2.1's philosophy: a smaller, more focused change produces a clearer commit message, a clearer PR description, and a clearer piece of history a future reader can actually make sense of.

## 2.4 Linear, Legible History

Restated from 15-engineering-standards.md Section 24.6: this repository uses squash-merge exclusively, producing one clean commit per pull request on `main`'s history. This is a deliberate choice for history legibility (Section 2.1) over preserving every individual work-in-progress commit — a contributor's in-progress branch history can be as messy as it needs to be to support their own iterative process; what matters is that `main`'s history reads as a clean, understandable sequence of complete, reviewed changes.

## 2.5 Git Is Forgiving; Use That

**Rule:** contributors are encouraged to commit early and often on their own feature branch, push frequently to get Preview-deployment feedback (16-cicd-release-management.md Section 11), and not worry about a "perfect" commit history until the final squash-merge cleans it up automatically. This is a deliberate anti-anxiety stance: Git's branch model makes experimentation on a feature branch essentially free, and this team wants contributors to use that freedom rather than being precious about crafting a perfect commit sequence by hand.

## 2.6 Best Practices

- Write every commit message and PR description as if the reader has zero context beyond what's in front of them — restated from Section 2.1, since that's usually the actual reading condition for a future investigator.
- Push work-in-progress often; don't wait for a "finished" state to get it into a Preview deployment and start getting real feedback (16-cicd-release-management.md Section 11.9).

## 2.7 Common Mistakes

- Treating an in-progress feature branch's commit history as precious and needing careful curation — restated from Section 2.5, this effort is largely wasted given squash-merge (Section 2.4) collapses it all into one commit anyway; the effort is better spent on the final PR description.
- Writing a commit message or PR description assuming the reader already has the same context the author does — the single most common cause of a repository history that's technically complete but practically useless to a future reader.

## 2.8 Review Checklist

- [ ] Does this contribution follow trunk-based development (Section 2.2), with no long-lived divergent branch?
- [ ] Is the pull request appropriately small and focused (Section 2.3)?


---

# 3. Repository Structure

## 3.1 Purpose

To orient a contributor to this repository's monorepo layout — restated and re-framed from 10-backend-architecture.md Section 4 and 11-frontend-architecture.md's structure specifically for "where do I go to make this change," rather than those documents' architectural "why is it organized this way" framing.

## 3.2 Repository Structure at a Glance

```
dreams-by-kalakaaar/
├── src/app/                  # Route Handlers + page routing (Next.js App Router)
├── src/modules/              # Backend business logic — one folder per domain
├── src/shared/                # Cross-cutting backend infrastructure
├── src/jobs/                   # Inngest background job definitions
├── apps/buyer, creator, internal   # The three frontend applications (11-frontend-architecture.md)
├── packages/                    # Shared frontend packages (ui, types, utils, etc.)
├── openapi/                       # The machine-readable API contract (09-api-architecture.md §26.1)
├── tests/e2e, tests/contract        # Cross-cutting test suites (13-testing-strategy.md §4.1)
└── docs/                              # This entire documentation series
```

Full detail on every folder's purpose is owned by 10-backend-architecture.md Section 4.2 and 11-frontend-architecture.md's own structural documentation — this section exists only to give a contributor a fast, practical orientation, not to duplicate that architectural detail.

## 3.3 Monorepo Contribution Rules

**Rule:** restated from 15-engineering-standards.md Sections 5.3 and 6.2: a contribution touches only the modules/packages its change actually requires, and never reaches across a module's or package's public-interface boundary. For a contributor new to the monorepo, the practical heuristic is: if you find yourself importing something from deep inside another module's internals (not its `service.ts`/`index.ts` public export), stop — that's a signal either the change belongs in a different place, or the module you need something from needs to expose it properly through its public interface first.

## 3.4 Finding Your Way Around

| I'm working on... | Start here |
|---|---|
| A backend business rule or API endpoint | `src/modules/{domain}/`, per 10-backend-architecture.md §5's module list |
| A UI component used across apps | `packages/ui` |
| Something specific to the Buyer, Creator, or Internal app | `apps/{buyer,creator,internal}/` |
| A background job | `src/jobs/{event-family}/`, per that document's §12.4 |
| The API contract itself | `openapi/v1.yaml`, cross-checked against 09-api-architecture.md |
| This documentation series | `docs/` |

## 3.5 Best Practices

- When genuinely unsure where a change belongs, check 15-engineering-standards.md Section 5.3's decision table before guessing — and if the answer is still unclear, ask in code review or via an Engineering Decision Record (that document's Section 29) rather than picking arbitrarily.
- Use Turborepo's affected-package detection (11-frontend-architecture.md §3.3, 16-cicd-release-management.md §6.3) to your own advantage locally — running only the tests for what you've actually touched keeps your local iteration loop fast.

## 3.6 Common Mistakes

- A new contributor creating a new top-level folder for "just this one thing" instead of finding the correct existing home — restated from 15-engineering-standards.md Section 5.6, this is one of the most common new-contributor missteps and is easily avoided by checking Section 3.4's table first.
- Importing across a module/package boundary without going through its public interface (Section 3.3) — usually an honest mistake from not yet having internalized the boundary discipline, caught reliably by the lint rule (that document's §26.2) and gently corrected in review.

## 3.7 Review Checklist

- [ ] Is the change located in the correct module/package per Section 3.4's guide?
- [ ] Does it respect every module/package boundary, importing only through public interfaces (Section 3.3)?

---

# 4. Branching Strategy

## 4.1 Purpose

Fully specified in 16-cicd-release-management.md Section 4; this document restates it briefly for contributor orientation and adds the practical, day-to-day guidance that document's more architectural framing doesn't cover.

## 4.2 The Short Version

One permanent branch, `main`, always deployable. Every contribution is a short-lived branch off the latest `main`, merged back via a reviewed pull request within days, never weeks. There is no `develop` branch, no long-lived per-environment branch, and no release branch cut in the traditional sense (16-cicd-release-management.md Section 4.2's explicit "notably absent" list) — full rationale in that document's Sections 2.5 and 4.1–4.2.

## 4.3 Practical Branch Lifecycle Diagram

```
git checkout main && git pull          ── always start from fresh, current main
git checkout -b feat/creator-vacation-mode
   │
   │  (work, commit freely — Section 2.5)
   │
   ▼
git push -u origin feat/creator-vacation-mode   ── Preview deployment triggers
   │                                                (16-cicd-release-management.md §11)
   ▼
Open pull request (Section 7)
   │
   ▼
Address review feedback (new commits, not force-pushed rewrites — Section 7.7)
   │
   ▼
Approved + CI green ──► Squash-merge ──► Branch deleted (Section 4.5)
```

## 4.4 Keeping a Branch Current

**Rule:** if `main` has moved forward significantly since a branch was created, the contributor rebases (preferred, for a cleaner resulting history) or merges `main` into their branch before requesting final review — restated from 15-engineering-standards.md Section 24.2's short-lived-branch philosophy: the need for this should be rare precisely because branches are short-lived by convention; a branch requiring frequent rebasing against a fast-moving `main` is itself a signal the branch has been open too long (Section 3.6's parallel concern, applied here to branch lifetime rather than folder structure).

## 4.5 Branch Cleanup

**Rule:** restated from 15-engineering-standards.md Section 4.7: a branch is deleted immediately upon merge — most Git hosting platforms offer to do this automatically at merge time, and this team always accepts that offer. A lingering merged branch adds navigational noise for every future contributor browsing the repository's branch list.

## 4.6 Best Practices

- Branch directly off the latest `main`, every time — never off another engineer's still-open branch, which creates a hidden, confusing dependency chain (restated from 15-engineering-standards.md §4.7).
- Push early and often (Section 2.5) rather than working locally for an extended period before the first push — this gets Preview-deployment and CI feedback into the loop as early as possible.

## 4.7 Common Mistakes

- A branch that lives for weeks, accumulating large, hard-to-resolve merge conflicts — restated from 16-cicd-release-management.md Section 3.5, the correct response is incremental rebasing or, if truly unsalvageable, reimplementing the change in smaller pieces against current `main`, not a forced merge past conflicts.
- Branching off another feature branch instead of `main` (Section 4.6), which silently couples two contributors' work in a way that complicates both review and eventual merge ordering.

## 4.8 Review Checklist

- [ ] Is the branch reasonably current with `main`, without an excessive, unresolved divergence (Section 4.4)?
- [ ] Was the branch deleted immediately upon merge (Section 4.5)?


---

# 5. Branch Naming Conventions

## 5.1 Purpose

To make a branch's name itself informative — restated and fully specified from 15-engineering-standards.md Section 24.2's naming pattern, expanded here with the complete category list and worked examples a contributor can copy the pattern from directly.

## 5.2 Naming Pattern

`{type}/{short-kebab-case-description}` — the type prefix mirrors this document's commit-type taxonomy (Section 6.3) exactly, so a branch's category is legible before ever opening it.

## 5.3 Branch Type Prefixes

| Prefix | Used For | Example |
|---|---|---|
| `feat/` | A new user-facing or API-facing capability | `feat/creator-vacation-mode` |
| `fix/` | A bug fix | `fix/coupon-expiry-timezone-bug` |
| `refactor/` | A behavior-preserving restructuring (15-engineering-standards.md §26.2) | `refactor/extract-order-pricing-service` |
| `test/` | Adding/improving tests without a behavior change | `test/checkout-idempotency-coverage` |
| `docs/` | Documentation-only changes | `docs/update-payment-runbook` |
| `chore/` | Tooling, dependency, or configuration changes | `chore/upgrade-drizzle-orm` |
| `hotfix/` | An emergency, expedited fix (16-cicd-release-management.md §17) | `hotfix/payment-webhook-signature-check` |

## 5.4 Naming Quality Guidance

**Rule:** the description portion is specific enough that another engineer glancing at the branch list understands roughly what it does, without needing to open it — `fix/checkout-bug` is too vague; `fix/coupon-expiry-timezone-bug` is appropriately specific, mirroring 15-engineering-standards.md Section 7.2's general naming-quality principles applied here to branches.

## 5.5 Best Practices

- Include a ticket/issue reference in the branch name where the team's workflow uses one (e.g., `feat/1234-creator-vacation-mode`), placed after the type prefix, keeping the type-first ordering that makes the branch list scannable by category.
- Keep the description short — long enough to be specific (Section 5.4), short enough to remain readable in a terminal prompt or a narrow UI column.

## 5.6 Common Mistakes

- A branch name with no type prefix at all (`creator-vacation-mode`), losing the at-a-glance categorization Section 5.3's prefix system provides.
- An overly generic description (`fix/bug`, `feat/updates`) that provides no more information than the prefix alone already did.

## 5.7 Review Checklist

- [ ] Does the branch name use a correct type prefix (Section 5.3)?
- [ ] Is the description specific enough to convey the change's actual content at a glance (Section 5.4)?

---

# 6. Commit Message Standards

## 6.1 Purpose

Fully specified in 15-engineering-standards.md Section 24.3; this document restates the standard and adds the worked examples and edge-case guidance a contributor benefits from having close at hand while actually writing commits.

## 6.2 Conventional Commits Format

`{type}({scope}): {description}` — restated exactly from 15-engineering-standards.md Section 24.3: `type` from Section 6.3's table below, `scope` an optional, specific area of the codebase the commit touches (a module name, a package name), and `description` a concise, imperative-mood summary (restated from that document's general naming philosophy: describes the change's effect, not a narration of what was typed).

## 6.3 Commit Types

| Type | Used For | Example |
|---|---|---|
| `feat` | A new capability | `feat(orders): add exchange request endpoint` |
| `fix` | A bug fix | `fix(checkout): correct timezone handling in coupon expiry check` |
| `refactor` | Behavior-preserving restructuring | `refactor(payments): extract commission calculation into its own function` |
| `test` | Test-only additions/changes | `test(reviews): add eligibility-gate edge case coverage` |
| `docs` | Documentation-only changes | `docs(runbook): add cache-flush recovery step` |
| `chore` | Tooling/dependency/config | `chore(deps): upgrade drizzle-orm to 0.34` |
| `perf` | A performance improvement with no behavior change | `perf(products): add composite index for category browsing` |
| `security` | A security-specific fix (12-security-architecture.md-relevant) | `security(auth): fix session-fixation vector in OAuth callback` |

## 6.4 Commit Body and Footer

**Rule:** for any commit whose *why* isn't obvious from its one-line summary, a body (a blank line after the summary, then free-text paragraphs) explains the reasoning — restated from 15-engineering-standards.md Section 22.5's "comments explain why" principle, applied here to commit messages specifically. A footer references the relevant ticket/issue and, for a breaking change to a shared package (that document's §24.2), includes an explicit `BREAKING CHANGE:` marker.

## 6.5 Commit Granularity on a Feature Branch

Restated from Section 2.5: individual commits on a feature branch need not each be a perfect, atomic, conventional-commit-formatted unit — that discipline is fully applied only at the point of writing the final pull-request title/description that becomes the squash-merge commit (Section 6.6). Contributors are free to commit "WIP," "fix typo," or similarly informal messages during active development on their own branch.

## 6.6 The Squash-Merge Commit

**Rule:** because this repository squash-merges every pull request (Section 2.4), the pull request's own title becomes `main`'s permanent commit message — restated as this document's single most important commit-message-quality checkpoint: the PR title, not any individual in-branch commit, is written to Section 6.2's full Conventional Commits standard, since it is what actually lands in `main`'s permanent, legible history.

## 6.7 Best Practices

- Write the PR title (Section 6.6) as if it's the only sentence a future engineer running `git log` will ever see about this change — because, given squash-merge, it is.
- Use the commit body (Section 6.4) generously for any non-obvious change — restated from 15-engineering-standards.md Section 22.5, a slightly longer, genuinely informative commit message is never a mistake; a terse one that omits necessary context is.

## 6.8 Common Mistakes

- A vague PR title (`fix bug`, `updates`) that becomes an equally vague, unhelpful permanent commit message once squash-merged — the single most consequential commit-message mistake in this workflow, given Section 6.6's stated stakes.
- Describing *what* changed in painstaking file-by-file detail in a commit body instead of *why* — restated from Section 6.4, the diff itself already shows what changed; the message's unique value is explaining the reasoning the diff alone can't convey.

## 6.9 Review Checklist

- [ ] Does the pull request's title follow the full Conventional Commits standard (Section 6.2), since it will become the permanent commit message (Section 6.6)?
- [ ] For a non-obvious change, does the PR description explain *why*, not just *what* (Section 6.7)?


---

# 7. Pull Request Lifecycle

## 7.1 Purpose

Fully specified in 16-cicd-release-management.md Section 5; this document restates the lifecycle briefly for contributor orientation and adds the pull request template and drafting guidance that document's more pipeline-oriented framing doesn't cover.

## 7.2 The Lifecycle, Restated

```
Draft (optional, for early feedback) ──► Ready for Review ──► CI Pipeline
(16-cicd-release-management.md §6) ──► Code Review (Section 8) ──►
Squash-merge to `main` (Section 2.4) ──► Branch deleted (Section 4.5)
```

Full stage-by-stage detail (including CI-gate mechanics) is owned by 16-cicd-release-management.md Section 5; restated here only to the depth needed for this document's own added content below.

## 7.3 The Pull Request Template

Every pull request follows a consistent structure, restated and expanded from 15-engineering-standards.md Section 24.4:

| Section | Content |
|---|---|
| **What & Why** | What changed and the business/technical reason — linking to the relevant product requirement (01-product-requirements.md) or bug report, never assuming the reader already has that context |
| **How** | A brief description of the approach taken, especially for anything non-obvious — not a line-by-line narration of the diff, which the diff itself already shows |
| **Testing** | Which test levels (13-testing-strategy.md §5) this change is covered by, and how it was manually verified if applicable |
| **Screenshots/Recordings** | For any UI-visible change — restated as a required item for frontend PRs specifically, since a visual change is often faster to review by seeing than by reading |
| **Deployment Notes** | Anything a reviewer or the release owner should know before this reaches Staging/Production — a migration, a feature flag, a required environment-variable addition |
| **Trade-offs & Follow-ups** | Any deliberate trade-off made and any explicitly deferred follow-up work — restated from 15-engineering-standards.md Section 24.4, never left implicit for a reviewer to guess at |

## 7.4 Drafting a Strong Pull Request

**Rule:** a pull request is written to be reviewable **without** a synchronous conversation — restated as this section's central quality bar: a reviewer should be able to understand the change's purpose, approach, and risk from the PR description and diff alone, with a follow-up question being the exception (for genuine ambiguity), not the norm (because the description omitted context it should have included).

## 7.5 Draft Pull Requests

**Rule:** a draft PR (opened before the change is complete) is a legitimate, encouraged tool for early, low-stakes feedback on direction — restated from 15-engineering-standards.md Section 5.7: opening early gets Preview-deployment and fast-CI feedback flowing (16-cicd-release-management.md §11.9) well before the change is polished, and invites early course-correction before significant additional effort is invested in a direction review might redirect.

## 7.6 Requesting Review

**Rule:** a pull request is marked "ready for review" only once its author believes it genuinely meets the Definition of Done (15-engineering-standards.md Section 30.2) — restated as a professional courtesy to reviewers: requesting review on a pull request the author knows is incomplete or likely to need substantial rework wastes a reviewer's attention and is discouraged; use Draft status (Section 7.5) instead for anything not yet at that bar.

## 7.7 Responding to Feedback

**Rule:** restated from 15-engineering-standards.md Section 5.7: feedback is addressed via new commits pushed to the same branch, never a force-pushed rewrite that erases the reviewer's ability to see what changed since their last pass — the final squash-merge (Section 2.4) collapses everything into one clean commit regardless, so there's no cost to keeping the in-progress history additive during review.

## 7.8 Best Practices

- Keep pull requests small (Section 2.3) — this is the single highest-leverage thing an author can do to get fast, high-quality review.
- Self-review the diff before requesting review — reading your own change as if you were the reviewer catches an embarrassing number of issues before anyone else has to point them out.

## 7.9 Common Mistakes

- A pull request description that says only "see title" or links a ticket with no further context — restated from 15-engineering-standards.md Section 24.7, leaving a future reader with no explanation of *why* a change was made.
- Force-pushing over review feedback, erasing the incremental history a reviewer was tracking (Section 7.7).

## 7.10 Review Checklist

- [ ] Does the pull request follow the full template (Section 7.3)?
- [ ] Is it reviewable without requiring a synchronous conversation to understand basic intent (Section 7.4)?

---

# 8. Code Review Standards

## 8.1 Purpose

To state this team's code review culture and process in full — restated from 15-engineering-standards.md Section 25's consolidated checklist and elevated here into its own complete treatment of review as a *collaborative and developmental* practice, per this document's Guiding Principle 3 (Section 1.7).

## 8.2 Review Responsibility Matrix

| Role | Responsibility |
|---|---|
| Author | Submits a reviewable pull request (Section 7.4), responds to feedback promptly and openly, and is the final decision-maker on genuinely subjective, non-blocking suggestions |
| Reviewer | Works through 15-engineering-standards.md Section 25.3's consolidated checklist, distinguishes blocking from non-blocking findings (that document's §25.4) explicitly, and reviews promptly (Section 8.6) |
| CODEOWNERS-designated reviewer | Required approval for changes to their owned path (Section 8.5) — a stronger obligation than a general reviewer, since their approval is a hard merge gate for that specific area |
| Second reviewer (for Critical-tier changes) | Restated from 13-testing-strategy.md §26.3's risk-tiering: a Payments/Auth/Checkout/migration change benefits from a second, independent reviewer's perspective, given the elevated stakes |

## 8.3 What Makes a Good Review

Restated and elevated from 15-engineering-standards.md Section 25.2's "review is the primary enforcement mechanism" stance: a good review checks correctness and standards-compliance (that document's Section 25.3), *and* asks whether there's a clearer or simpler way to accomplish the same goal (Section 3.4/3.6 of that document's KISS and Least-Astonishment principles), *and* genuinely tries to understand the author's context before raising a concern — a review that only checks boxes mechanically misses this practice's full value.

## 8.4 Review Tone and Culture

**Rule:** restated identically from 15-engineering-standards.md Section 25.5: review comments address the code, never the author personally, phrased constructively. Beyond that baseline, this team treats review comments as an opportunity to share context and reasoning, not just a verdict — a comment explaining *why* a suggested change is better (linking to the relevant section of 15-engineering-standards.md or this series generally where applicable) teaches, where a bare "change this" does not.

## 8.5 CODEOWNERS Philosophy

**Rule:** every module (10-backend-architecture.md Section 4.4's per-module ownership) and every significant package/app area has a designated set of owners recorded in the repository's CODEOWNERS configuration, whose approval is a required, automatically-enforced gate for any change to that path — restated as the code-level enforcement mechanism for that document's Section 4.4 ownership principle. CODEOWNERS exists specifically to ensure the engineer(s) with the deepest context on a given area always see and weigh in on changes there, without requiring every reviewer on the team to independently remember who "should" review what.

**CODEOWNERS is a floor, not a ceiling:** any engineer may review any pull request and leave feedback; CODEOWNERS only guarantees that the *designated* owner's approval is specifically required before merge for their area, never restricting who else may also contribute a review.

## 8.6 Review Turnaround

**Rule:** restated from 15-engineering-standards.md Section 25.5 and 13-testing-strategy.md Section 2.5's fast-feedback philosophy: pull requests are reviewed promptly — this team's standing expectation is that a request for review receives an initial response (an actual review pass, or at minimum an acknowledgment with an expected timeline) within one business day. A pull request sitting unreviewed for days undermines the fast, small-batch contribution model this entire document is built around (Section 2.3).

## 8.7 Handling Disagreement

**Rule:** a genuine, substantive disagreement between author and reviewer that isn't resolved through discussion escalates to a third opinion (another senior engineer, or a Tech Lead) rather than being unilaterally overridden by either party — restated as a deliberate, calm process for the rare case where review discussion alone doesn't converge, avoiding both an author steamrolling a legitimate concern and a reviewer blocking indefinitely over a genuinely subjective preference (15-engineering-standards.md Section 25.4's blocking-vs-non-blocking distinction is the first tool for resolving this; escalation is the backstop for the cases that distinction alone doesn't settle).

## 8.8 Approving and Requesting Changes

**Rule:** an approval means the reviewer has genuinely worked through the checklist (15-engineering-standards.md Section 25.3) and believes the change is ready to merge, not a courtesy rubber-stamp — restated from that document's Section 25.6 as this document's own stated cultural expectation. "Request changes" is reserved for genuine blocking findings; a reviewer with only non-blocking suggestions approves with comments, never withholding approval over something they themselves have classified as optional.

## 8.9 Best Practices

- Review the *diff* first for correctness and standards, then step back and ask whether the *approach* itself is right — restated from Section 8.3, both matter, and neither substitutes for the other.
- When leaving a non-blocking suggestion, say so explicitly ("nit:", "optional:", or an equivalent team convention) so the author isn't left guessing whether it's required (15-engineering-standards.md §25.4).

## 8.10 Common Mistakes

- A reviewer approving without actually reading carefully, treating review as a formality — restated from 15-engineering-standards.md Section 25.6, this is the single most damaging review anti-pattern, since it silently defeats the entire quality-enforcement model this series depends on.
- A reviewer treating every comment as blocking by default, creating friction over genuinely optional preferences (that document's §25.6's identical stated concern).

## 8.11 Review Checklist

- [ ] Did the review genuinely work through 15-engineering-standards.md Section 25.3's checklist, not a superficial pass?
- [ ] Is every blocking vs. non-blocking finding clearly distinguished (that document's §25.4)?
- [ ] Did the designated CODEOWNERS reviewer(s) actually approve, not merely a general team member (Section 8.5)?


---

# 9. Merge Strategy

## 9.1 Purpose

Fully specified in 15-engineering-standards.md Section 24.6 (squash-merge, exclusively); this document restates the decision briefly and adds the specific procedural guidance for when a merge is and isn't permitted.

## 9.2 Squash-Merge, Exclusively

**Rule:** restated without modification: every pull request squash-merges to `main`, producing one commit per PR, with the PR's title (Section 6.6) becoming that commit's message. This repository does not support or permit merge commits (which would preserve a noisy, hard-to-navigate branch-merge history) or rebase-merge (which would preserve every individual in-branch commit on `main`, undermining Section 2.4's linear-legible-history goal) as alternatives — squash-merge is enforced as the repository's only available merge button configuration, not a per-PR choice.

## 9.3 Merge Decision Table

| Condition | Merge Permitted? |
|---|---|
| All CI gates green (16-cicd-release-management.md §6) | Required, no exception |
| At least one approval, zero unresolved blocking findings (Section 8.8) | Required, no exception |
| CODEOWNERS-designated approval for every touched path (Section 8.5) | Required, no exception |
| Branch is reasonably current with `main` (Section 4.4) | Required — a significantly stale branch is rebased first |
| A second reviewer's approval, for a Critical-tier change (Section 8.2) | Required for Critical-tier (13-testing-strategy.md §25.2); standard single-approval otherwise |

## 9.4 Who Merges

**Rule:** the pull request's author merges it once every Section 9.3 condition is satisfied — restated as a deliberate ownership choice: the author, having addressed all feedback, is best positioned to do a final check and execute the merge at a moment of their own choosing (e.g., not walking away from a computer mid-merge), rather than a reviewer merging on the author's behalf the instant they approve.

## 9.5 Best Practices

- Do a final review of your own diff immediately before merging, especially if meaningful time has passed since the last review pass or if `main` has moved forward since.
- Merge promptly once approved and green — restated from Section 2.3's small-batch philosophy, letting an approved, ready PR sit unmerged only increases the chance of it going stale against `main`.

## 9.6 Common Mistakes

- Merging with an unresolved review comment left open, assuming it was implicitly non-blocking without confirming with the reviewer (Section 8.8's distinction exists specifically to prevent this ambiguity).
- Merging a branch that has drifted significantly from `main` without rebasing first, risking a subtle integration issue that CI's own affected-scope detection might not fully catch if the drift is significant enough.

## 9.7 Review Checklist

- [ ] Are all Section 9.3 conditions satisfied before merge?
- [ ] For a Critical-tier change, has a second reviewer's approval been obtained (Section 8.2)?

---

# 10. Conflict Resolution

## 10.1 Purpose

To state how this team handles merge conflicts — both the Git-mechanical kind (two branches editing the same lines) and, briefly, the human kind (Section 10.6, cross-referenced from Section 8.7) — since both are a normal, expected part of collaborative development this document treats calmly and procedurally rather than as an exceptional crisis.

## 10.2 Git Merge Conflicts — When They Happen

Given trunk-based development and short-lived branches (Section 4), genuine merge conflicts should be relatively rare — restated from Section 4.4, their frequency is itself a signal of branch lifetime health. When they do occur, they're resolved by the contributor whose branch is being updated (rebasing or merging `main` in), not by the reviewer or anyone else.

## 10.3 Resolution Workflow

```
`main` has moved forward with changes overlapping this branch's own edits
   │
   ▼
Contributor rebases (preferred) or merges `main` into their branch
   │
   ▼
Git flags the specific conflicting lines
   │
   ▼
Contributor resolves each conflict by understanding BOTH changes' intent
(never a blind "keep mine" or "keep theirs" without reading both) —
consulting the other change's author if the correct resolution isn't
immediately clear
   │
   ▼
Resolved branch is tested locally (Section 3.5's affected-scope testing)
before being pushed, re-triggering CI (16-cicd-release-management.md §6)
   │
   ▼
If the conflict resolution was non-trivial (more than a mechanical
whitespace/import-ordering fix), the reviewer is informed explicitly,
since a resolved conflict can silently introduce a subtle bug a
diff-only review might not catch
```

## 10.4 Complex Conflicts

**Rule:** for a conflict resolution complex enough that the contributor isn't fully confident it preserves both changes' correct intent, they reach out directly to the other change's author (or, if that's impractical, to the relevant CODEOWNERS-designated reviewer, Section 8.5) rather than guessing — restated from Section 10.2's collaborative framing: a merge conflict is a signal that two people touched overlapping logic, and briefly synchronizing directly is usually faster and safer than each working it out independently and hoping for the best.

## 10.5 Escalating a Persistent Conflict Pattern

If the same two areas of the codebase repeatedly conflict across many pull requests, this is treated as a signal worth raising beyond the individual conflict — restated from 15-engineering-standards.md Section 6.5's module-scoping guidance: a recurring conflict hotspot often indicates a module boundary that's drawn in the wrong place, or two features that should genuinely be coordinated/sequenced rather than developed fully independently.

## 10.6 Human Disagreement During Conflict Resolution (Cross-Reference)

Fully specified in Section 8.7 — a conflict resolution that surfaces a genuine design disagreement (not just a mechanical merge conflict) follows that section's escalation path, never resolved unilaterally by whichever contributor happens to be doing the rebase.

## 10.7 Best Practices

- Rebase/merge `main` in frequently during a longer-running piece of work (even though branches should generally be short-lived, Section 4.4) — resolving small conflicts incrementally is far easier than resolving one large accumulated conflict at the end.
- Test thoroughly after any non-trivial conflict resolution (Section 10.3) — a syntactically-clean resolution can still be semantically wrong in a way only tests reveal.

## 10.8 Common Mistakes

- Blindly accepting "my" or "their" side of a conflict without reading both changes' actual intent (Section 10.3) — a well-documented source of silent, hard-to-detect bugs.
- Resolving a complex conflict entirely alone when the other change's author was readily available to consult (Section 10.4), missing an easy opportunity to avoid a mistake.

## 10.9 Review Checklist

- [ ] Was a non-trivial conflict resolution explicitly flagged to the reviewer (Section 10.3)?
- [ ] Was the resolution tested, not merely assumed correct from a clean merge (Section 10.7)?


---

# 11. Release Branches

## 11.1 Purpose

To state, explicitly, this repository's stance on release branches — a deliberate **absence**, not an oversight — restated and cross-referenced fully from 16-cicd-release-management.md Section 4.2 and Section 13, so a contributor coming from a GitFlow-style background doesn't mistakenly assume this repository uses a pattern it deliberately doesn't.

## 11.2 Why No Release Branches

Fully justified in 16-cicd-release-management.md Sections 2.2–2.3 (continuous deployment) and Section 13.4 (no fixed release cadence) — restated briefly here: `main` itself is always deployable and continuously promoted through Preview → Staging → Production (that document's Section 19) on every merge, per that document's stated risk-tiering (Section 14.2 of that document). There is no separate branch representing "what's in the next release" because there is no batched "next release" in the traditional sense — every merged, gate-passing change is itself a release candidate.

## 11.3 What a Contributor Experiences Instead

```
Pull request merged to `main`
   │
   ▼
Automatically promoted through the environment pipeline (16-cicd-release-
management.md §19), gated by the change's own risk tier (§14.2 of that
document) — no separate "cut a release branch" step exists for a
contributor to perform
```

A contributor's involvement in "release" ends, in the overwhelming majority of cases, at merge — the pipeline (owned entirely by 16-cicd-release-management.md) takes it from there, with the release owner (that document's Section 14.4) only becoming a distinct, active role for a Tier 1 change requiring explicit sign-off.

## 11.4 If a Grouped Release Is Needed

Restated from 16-cicd-release-management.md Section 18.4: a release owner may choose to coordinate several already-merged, already-independently-tested changes into one Staging-validation-and-Production-promotion cycle — this is a scheduling convenience performed by the release owner using the existing pipeline, never a Git-level release-branch mechanism a contributor needs to interact with directly.

## 11.5 Best Practices

- Do not create a release branch for any purpose — restated as this section's single, simple rule: if a contributor finds themselves wanting one, this is a signal to re-read 16-cicd-release-management.md Section 2 and reconsider the underlying need through this platform's actual continuous-deployment model instead.

## 11.6 Common Mistakes

- A contributor with prior GitFlow experience creating a `release/x.y` branch out of habit — corrected immediately in review, with a pointer to this section and 16-cicd-release-management.md Section 4.2's explicit "notably absent" list.

## 11.7 Review Checklist

- [ ] Does this contribution avoid introducing any release-branch pattern, consistent with this repository's trunk-based model (Section 11.2)?

---

# 12. Hotfix Workflow

## 12.1 Purpose

Fully specified in 16-cicd-release-management.md Section 17; this document restates it briefly from a contributor's day-to-day perspective and adds the specific Git-mechanical steps (branch creation, PR handling) that document's more process-architecture framing doesn't spell out at the individual-contributor level.

## 12.2 The Short Version

For a Critical-severity production issue (13-testing-strategy.md §27.2) only — never for a merely-urgent-but-not-Critical issue, per 16-cicd-release-management.md Section 17.2's strict qualification bar — a `hotfix/*` branch (Section 5.3) is created directly off `main`, the fix is implemented with a regression test (never skipped, even under pressure, per that document's §17.4/§17.9), and it travels through an expedited-but-not-reduced-rigor review and pipeline path fully specified in that document's Section 17.3.

## 12.3 A Contributor's Hotfix Checklist

- [ ] Confirmed the issue genuinely meets the Critical-severity bar (16-cicd-release-management.md §17.2) — if uncertain, treated as **not** qualifying, per that document's default-to-standard-pipeline stance for ambiguous cases.
- [ ] Created a `hotfix/*` branch directly off current `main`.
- [ ] Implemented the fix with an accompanying regression test (13-testing-strategy.md §27.4) — non-negotiable, restated from that document's §17.9's single most important standing reminder.
- [ ] Obtained real-time, synchronous review from a designated senior engineer/lead (16-cicd-release-management.md §17.3), not an asynchronous review-queue request.
- [ ] Confirmed every standard CI gate still ran and passed in full (that document's §17.4) — only the review *turnaround*, not the gates themselves, is compressed.
- [ ] Obtained explicit, named authorization before merge (that document's §17.5).

## 12.4 Best Practices

- Reach for the hotfix path only when genuinely warranted (Section 12.3's first item) — restated from 16-cicd-release-management.md Section 17.9, resisting the temptation to treat merely-urgent as Critical under pressure.
- Write the regression test first if at all feasible, even under time pressure — restated from 15-engineering-standards.md Section 3.4's test-first discipline for bug fixes, applied here with even greater weight given the stakes.

## 12.5 Common Mistakes

- Skipping the regression test "just this once" under Critical-severity urgency — restated as 16-cicd-release-management.md Section 17.9's single most important standing caution, repeated here because it is the most common and most damaging hotfix-process failure mode.
- Requesting hotfix-path treatment for an issue that, on reflection, is High rather than Critical severity — corrected by the authorizing engineer (that document's §17.7), who is specifically responsible for this classification check.

## 12.6 Review Checklist

- [ ] Does the issue genuinely meet the Critical-severity bar (16-cicd-release-management.md §17.2)?
- [ ] Does the hotfix include a regression test, with every standard CI gate still enforced in full (Section 12.3)?

---

# 13. Versioning Strategy

## 13.1 Purpose

Fully specified in 16-cicd-release-management.md Section 24; this document restates the framework briefly and focuses its own added content on what a contributor specifically needs to do when their change affects a versioned artifact.

## 13.2 The Short Version

| What | Versioning Scheme | A Contributor's Responsibility |
|---|---|---|
| Shared `packages/*` | Semantic Versioning (16-cicd-release-management.md §24.2) | Correctly classify whether their change is a breaking/major, additive/minor, or fix/patch change to a package's public interface |
| Application deployments (`apps/*`) | Commit SHA + release tag (that document's §24.3) | No contributor action required — automatic |
| Public API (09-api-architecture.md) | Path-based major version (that document's §25) | Follow 09-api-architecture.md Section 1.6's additive-vs-breaking discipline when modifying any endpoint |
| Database schema | Sequential migration history (10-backend-architecture.md §25.2) | Follow 16-cicd-release-management.md Section 12.3's backward-compatibility discipline for every migration |

## 13.3 Classifying a Shared Package Change

**Rule:** restated from 16-cicd-release-management.md Section 24.2 and 24.10: when modifying a `packages/*` shared package's public interface (15-engineering-standards.md §6.2's export-surface definition), a contributor explicitly assesses whether the change is breaking (removes/renames an export, changes a function's parameter contract in a way existing callers would need to change for), additive (a new, optional capability existing callers don't need to adjust for), or a pure fix — and bumps the version accordingly. When genuinely uncertain, default to treating it as breaking (that document's §24.10's identical stated principle).

## 13.4 API Contract Changes

**Rule:** restated from 09-api-architecture.md Section 1.6: any change to a documented endpoint is checked against that section's additive-vs-breaking criteria before implementation begins, not discovered to be breaking only after the fact — a genuinely breaking API change requires the OpenAPI-spec-first update process (15-engineering-standards.md §14.3) and is flagged explicitly in the pull request description (Section 7.3's "Deployment Notes") as requiring coordinated client-side awareness.

## 13.5 Best Practices

- When touching a shared package's public interface, explicitly state the version-bump classification in the pull request description (Section 7.3), so the reviewer's job includes confirming that classification is correct, not just that the code itself works.
- Prefer additive API changes over breaking ones wherever a design choice allows it (09-api-architecture.md §1.6's own stated preference), since an additive change requires none of the coordinated-rollout overhead a breaking one does.

## 13.6 Common Mistakes

- Under-classifying a shared package's breaking change as merely additive/patch, silently breaking a dependent app or package (16-cicd-release-management.md §24.8's identical stated failure mode).
- Modifying a documented API endpoint's response shape without checking whether the change is genuinely additive per 09-api-architecture.md Section 1.6's precise criteria.

## 13.7 Review Checklist

- [ ] Is a shared-package version-bump classification stated explicitly and correct (Section 13.3)?
- [ ] Does any API contract change correctly follow 09-api-architecture.md Section 1.6's additive-vs-breaking discipline (Section 13.4)?


---

# 14. Documentation Contributions

## 14.1 Purpose

To state how this entire documentation series (00–19, and this document itself) is contributed to and kept current — restated as Guiding Principle 4 (Section 1.7) made fully concrete: documentation is a first-class contribution, following the identical PR/review process as code, not a lesser, informally-handled category of change.

## 14.2 What Counts as a Documentation Contribution

- A correction or clarification to an existing document in this series.
- A module/package README (15-engineering-standards.md §22.3).
- A doc comment on an exported function/component (that document's §22.4).
- A new or updated Architecture Decision Record (Section 14.4).
- A runbook update following an incident (19-operations-runbook.md §25.3).

## 14.3 Documentation Contribution Workflow

**Rule:** a documentation-only pull request follows the identical lifecycle as a code pull request (Section 7) — branch (`docs/`, Section 5.3), PR template (Section 7.3), review (Section 8), squash-merge (Section 9.2) — with one adjustment: the CODEOWNERS reviewer (Section 8.5) for a given architecture document is typically that document's original owning role (e.g., the Principal Backend Architect for 10-backend-architecture.md) or, where that's impractical long-term, a designated documentation-steward role Engineering Leadership assigns.

## 14.4 Architecture Decision Records (ADRs)

**Rule:** restated and made concrete from 15-engineering-standards.md Section 29's Engineering Decision Record process: a significant, hard-to-reverse technical decision not already settled by an existing document in this series is recorded as a short, dated, attributed ADR — context/problem, options considered, decision and rationale, consequences accepted (that document's §29.3's exact structure) — stored in a dedicated, discoverable location in the repository (e.g., `docs/adr/`), numbered sequentially for easy chronological reference.

**Rule, restated from that document's §29.4:** an ADR is written before or during the decision, never manufactured afterward to retroactively justify a choice already shipped — if a significant decision was made informally without one, the correcting action is writing an honest ADR that says so, not backdating one to imply deliberation that didn't happen.

## 14.5 When to Update This Series' Existing Documents vs. Write a New ADR

| Situation | Action |
|---|---|
| A decision fits cleanly within an existing document's stated scope (e.g., a new backend module following 10-backend-architecture.md's established module pattern) | Update that document directly, or rely on its existing content if no update is actually needed |
| A decision doesn't fit any existing document's scope, or meaningfully deviates from one (15-engineering-standards.md §29.2's required-record situations) | Write a new ADR (Section 14.4) |
| A significant decision accumulates enough weight/scope over time that it deserves to become its own full architecture document | Escalate to Engineering Leadership — this is a deliberate, infrequent, high-bar promotion from ADR to full document, not a routine occurrence |

## 14.6 Keeping Documentation Current

**Rule:** restated identically from 15-engineering-standards.md Section 22.6 and 18-observability-monitoring.md Section 22.6: a pull request that changes a public interface, a business rule, or an operational procedure updates the corresponding documentation **in the same pull request** — never as a deferred, separately-ticketed follow-up. This is the single most important discipline in this section, since every other rule here is secondary to this one actually being followed consistently.

## 14.7 Best Practices

- Treat a documentation gap discovered during unrelated work as worth fixing immediately, in a small dedicated `docs/` PR, rather than merely noting it and moving on (15-engineering-standards.md §22.7's identical stated concern about staleness).
- Write ADRs concisely (Section 14.4) — this is a lightweight decision log, not a second architecture-documentation series; a new ADR that's ballooning toward document-length is often actually Section 14.5's "promote to a full document" case.

## 14.8 Common Mistakes

- Deferring a needed documentation update to "a follow-up PR" that, per 15-engineering-standards.md Section 22.7's identical observation, essentially never actually happens.
- Writing an ADR retroactively to justify an already-shipped decision, undermining the honesty Section 14.4 requires.

## 14.9 Review Checklist

- [ ] Does this pull request update every documentation artifact its change affects, in the same PR (Section 14.6)?
- [ ] Does a significant new decision have a corresponding ADR, written contemporaneously, not retroactively (Section 14.4)?

---

# 15. Dependency Management

## 15.1 Purpose

To state how this repository adds, updates, and removes third-party dependencies — restated and extended from 15-engineering-standards.md Section 19.8's dependency-hygiene principle and 16-cicd-release-management.md Section 8.3's dependency-scanning gate into the concrete contribution workflow around them.

## 15.2 Adding a New Dependency

**Rule:** restated from 15-engineering-standards.md Section 19.8: before adding a new dependency, a contributor checks its maintenance status (is it actively maintained, or effectively abandoned), license compatibility (compatible with this platform's own licensing posture), bundle-size impact for anything client-bundled (that document's §20.3), and — for anything touching sensitive data — its own security track record. This judgment is exercised *before* the dependency is added, since 16-cicd-release-management.md Section 8.3's automated scanning catches *known* vulnerabilities in an *already-added* dependency, not this broader upfront suitability judgment.

## 15.3 Dependency Update Workflow

```
Routine (non-security) update ──► Standard PR (`chore/`, Section 5.3),
travels through the full standard pipeline (16-cicd-release-management.md §6)
like any other change — no special process
   │
Security-relevant update (a CVE fix) ──► Expedited per 16-cicd-release-
management.md §8.3's non-bypassable blocking classification for Critical/
High findings — prioritized ahead of routine feature work, though not
necessarily requiring the full hotfix path (Section 12) unless the
vulnerability is actively being exploited or the fix is otherwise urgent
enough to qualify
```

## 15.4 Reviewing a Dependency-Update Pull Request

**Rule:** a dependency-update PR's review focuses specifically on: does the changelog/release notes for the new version indicate any breaking change relevant to this codebase's usage, does the automated test suite (13-testing-strategy.md Section 6–10) still pass in full, and — for a major-version bump specifically — has the update been smoke-tested manually in a Preview deployment (16-cicd-release-management.md Section 11) beyond just the automated suite, given that a major version bump is the update category most likely to introduce a subtle, test-suite-invisible behavior change.

## 15.5 Removing a Dependency

**Rule:** removing a no-longer-needed dependency follows the identical review rigor as adding one — restated as a deliberately symmetric standard: confirm via a repository-wide search that the dependency is genuinely unused (not merely unused in the specific area the contributor happened to be working in), and note the removal explicitly in the PR description (Section 7.3) so the reviewer can independently verify the "genuinely unused" claim.

## 15.6 Best Practices

- Batch routine, low-risk dependency updates together periodically rather than reviewing each individually as a distraction from feature work — but never batch a security-relevant update with anything else, keeping it independently, quickly mergeable (Section 15.3).
- Read the actual changelog for any major-version dependency bump, not just trust that "tests still pass" is sufficient confirmation (Section 15.4).

## 15.7 Common Mistakes

- Bumping a dependency's major version as part of an unrelated feature PR, conflating two independently-reviewable changes (15-engineering-standards.md §5.4's identical stated concern about scope creep) and making both harder to review and to revert independently if either causes an issue.
- Assuming a passing test suite alone is sufficient confirmation for a major-version dependency bump, without any manual smoke-testing (Section 15.4).

## 15.8 Review Checklist

- [ ] Was the dependency's maintenance status, license, and (if client-bundled) size impact considered before adding it (Section 15.2)?
- [ ] For a major-version bump, was manual smoke-testing performed beyond the automated suite (Section 15.4)?
- [ ] Is a dependency removal confirmed genuinely unused repository-wide (Section 15.5)?

---

# 16. Technical Debt Policy

## 16.1 Purpose

Fully specified in 15-engineering-standards.md Section 27; this document restates the policy briefly and focuses its own added content on the specific contribution-workflow mechanics of recording and addressing debt.

## 16.2 The Short Version

Restated from 15-engineering-standards.md Section 27.2–27.3: a deliberate, known shortcut is recorded at the moment it's taken — an inline comment plus a tracked ticket — never left silently undocumented. Technical debt is triaged with severity-proportional urgency (that document's §27.4) and addressed via protected, recurring capacity (§27.5), not left to "whenever there's spare time."

## 16.3 Recording Debt in a Pull Request

**Rule:** if a pull request knowingly introduces a shortcut (for a genuinely legitimate reason — a deadline, an evolving requirement), the PR description's "Trade-offs & Follow-ups" section (Section 7.3) states it explicitly, alongside the inline comment and ticket 15-engineering-standards.md Section 27.3 requires — this gives the reviewer the opportunity to weigh in on whether the trade-off is actually acceptable *before* merge, not merely to discover it later reading the code.

## 16.4 A Reviewer's Role in Technical Debt

**Rule:** a reviewer encountering an undocumented shortcut (a piece of code that looks like a deliberate simplification but lacks Section 16.3's required comment/ticket) treats this as a blocking finding — restated from 15-engineering-standards.md Section 27.3's stated principle that an undocumented shortcut is *worse* than a documented one, since the reviewer is specifically positioned to catch and correct this gap before it becomes invisible, permanent debt.

## 16.5 Refactoring Pull Requests

Fully specified in 15-engineering-standards.md Section 26; restated briefly here as a contribution-workflow note: a refactoring PR is never bundled with a behavior change (that document's §26.2), is branched as `refactor/*` (Section 5.3), and its review focuses specifically on confirming behavior-preservation (via existing test coverage, that document's §26.4) rather than re-litigating logic the change doesn't actually alter.

## 16.6 Best Practices

- Record debt at the moment it's introduced, in the same PR, per Section 16.3 — never as an intention to "go back and document it later."
- As a reviewer, treat an undocumented shortcut with the same seriousness as any other Standard violation (Section 16.4) — this is easy to let slide under time pressure and is precisely why it needs explicit reviewer discipline.

## 16.7 Common Mistakes

- Introducing a shortcut without the required inline comment and ticket, planning to document it "after this PR ships" — restated from 15-engineering-standards.md Section 27.6, this essentially never actually happens once the immediate pressure passes.
- A reviewer letting an undocumented shortcut through because flagging it feels like unnecessary friction under the same deadline pressure the author is facing — the fix is the shared understanding that recording debt takes seconds, while undocumented debt costs far more later.

## 16.8 Review Checklist

- [ ] Does every deliberate shortcut in this PR have both an inline comment and a tracked ticket (Section 16.3)?
- [ ] Is a refactoring PR free of any bundled behavior change (Section 16.5)?


---

# 17. AI-Assisted Development

## 17.1 Purpose

Fully specified in 15-engineering-standards.md Section 28; this document restates the standard briefly and focuses its own added content on the specific, practical contribution-workflow implications — how AI-assisted work shows up in a branch, a commit, and a pull request.

## 17.2 The Short Version

Restated without modification from 15-engineering-standards.md Section 28.2: code produced with AI assistance is reviewed identically to hand-written code, with the submitting engineer fully accountable for every line, regardless of how it was drafted. There is no separate review track, no relaxed bar, and no special PR label required to disclose AI assistance (its use is treated as an ordinary drafting tool, per that document's §28.3, not a fact requiring special process).

## 17.3 Practical Implications for Contribution

**Rule:** an author using AI assistance to draft a change still personally verifies every factual claim (15-engineering-standards.md §28.4), still writes the pull request description in their own understanding of the change (Section 7.4's "reviewable without a synchronous conversation" bar applies regardless of drafting method), and must be able to answer any reviewer question about the change's reasoning without needing to re-consult the AI tool mid-conversation — restated from that document's §28.7's review checklist, this is the practical test for whether Section 17.2's accountability standard is actually being met.

## 17.4 Commit Messages and AI Assistance

**Rule:** a commit message or PR description is never itself an unedited AI-generated artifact the author hasn't reviewed for accuracy — restated from Section 6's stated quality bar for commit messages generally: whether drafted by a human or an AI tool, a commit message must accurately describe *this specific change*, and an author is responsible for verifying that accuracy before it becomes part of `main`'s permanent history (Section 2.4).

## 17.5 Sensitive Data (Cross-Reference)

Fully specified in 15-engineering-standards.md Section 28.5: no real user data, production credentials, or secrets are ever pasted into an external AI tool's prompt, restated here as a contribution-workflow-relevant reminder specifically because debugging a real, reported issue is exactly the moment an engineer might be tempted to paste a real log or stack trace for AI-assisted help — a sanitized/synthetic reproduction is used instead, always.

## 17.6 Best Practices

- Use AI assistance the way this team uses any tool — to move faster on the mechanical parts of a task, while keeping full personal ownership of the judgment, correctness, and explanation of the result (Section 17.3).
- Verify AI-suggested library usage or API behavior against actual documentation before relying on it, especially for anything touching this platform's finalized, specific stack (15-engineering-standards.md's technology-stack assumptions) — a generically-plausible AI suggestion can be subtly wrong for this platform's specific conventions.

## 17.7 Common Mistakes

- Submitting a pull request whose author can't actually explain a specific design choice because it came from an AI suggestion they accepted without full understanding — restated from 15-engineering-standards.md Section 28.6, this is treated as a genuine accountability gap, not a minor process footnote.
- Pasting a real error log containing user data into an external AI tool for debugging help (Section 17.5) instead of a sanitized reproduction.

## 17.8 Review Checklist

- [ ] Can the author explain and defend every part of this change, regardless of drafting method (15-engineering-standards.md §28.7)?
- [ ] Does the commit/PR description accurately reflect the actual change, verified by the author (Section 17.4)?

---

# 18. Contributor Responsibilities

## 18.1 Purpose

To consolidate, in one place, what every contributor to this repository is expected to do — the individual-level counterpart to 16-cicd-release-management.md Section 27's release-process responsibility matrix and 19-operations-runbook.md Section 3's operational matrix, focused here specifically on day-to-day contribution.

## 18.2 The Contributor's Standing Obligations

| Area | Obligation |
|---|---|
| Code quality | Follow 15-engineering-standards.md in full; every pull request meets that document's Definition of Done (§30.2) before requesting review |
| Testing | Follow 13-testing-strategy.md's test-level expectations for every change (that document's §5, §23 of the engineering standards document) |
| Review | Review others' pull requests promptly and thoroughly (Section 8.6), not only submit your own |
| Documentation | Keep documentation current in the same PR as the change it describes (Section 14.6) |
| Security | Follow 12-security-architecture.md's coding practices; report any suspected security issue immediately, per Section 18.5 below |
| Operations | Be prepared to take on-call duty per the rotation (19-operations-runbook.md §3.3) and follow its procedures when it's your turn |
| Collaboration culture | Uphold Section 8.4's review tone and Section 10's calm, collaborative conflict-resolution norms |

## 18.3 Everyone Reviews

**Rule:** restated from Section 1.7's Guiding Principle 1: every contributor, regardless of tenure, is expected to both submit and review pull requests — this is not a responsibility that accrues only to senior engineers. A newer contributor's review is valuable precisely because they bring fresh eyes and are more likely to ask a genuinely clarifying question a more familiar reviewer might not think to ask.

## 18.4 Ownership Beyond Your Own Code

Restated from 19-operations-runbook.md Section 2.2's identical stated principle for production operations: every contributor bears some responsibility for the health of the whole codebase, not only the specific module they most often work in — reviewing outside your usual area, flagging an inconsistency you notice while reading unrelated code, and keeping this documentation series current are all normal, expected contributions, not overreach.

## 18.5 Reporting a Security Concern

**Rule:** a suspected security vulnerability — in this platform's own code or in a dependency — is reported immediately through the security-specific channel 12-security-architecture.md's own process defines, never filed as a standard, publicly-visible bug ticket or discussed in an open pull request, given the risk of prematurely disclosing an exploitable weakness before a fix is ready.

## 18.6 Pair Programming Guidance

**Rule:** pair programming is an encouraged, freely-available practice for any contribution that benefits from it — a genuinely complex piece of business logic, an unfamiliar area of the codebase for a newer contributor (directly supporting Section 19's onboarding goals), or a Critical-tier change (13-testing-strategy.md §25.2) where a second perspective during implementation, not only during review, adds real value. When pairing, the pull request's authorship reflects both contributors (a co-authorship convention, e.g., `Co-authored-by:` trailers), and the pairing itself does not substitute for the standard independent code-review step (Section 8) — even a paired change is reviewed by someone who wasn't part of writing it, preserving the fresh-eyes value independent review provides.

## 18.7 Best Practices

- Make time for review as a first-class part of your own workflow, not something squeezed in only after your own work is done (Section 8.6's turnaround expectation depends on this).
- Offer to pair when you notice a teammate stuck or working in unfamiliar territory (Section 18.6) — this is one of the fastest, most effective ways this team shares knowledge.

## 18.8 Common Mistakes

- Treating review as secondary to "real work" (your own pull requests), leading to slow review turnaround platform-wide (Section 8.6's identical stated concern).
- Discussing a suspected security vulnerability in an open, publicly-visible channel or pull request instead of the dedicated, private reporting path (Section 18.5).

## 18.9 Review Checklist

- [ ] Is this contributor actively reviewing others' work, not only submitting their own (Section 18.3)?
- [ ] Was any pairing-produced change still independently reviewed by someone who wasn't part of writing it (Section 18.6)?

---

# 19. New Engineer Onboarding

## 19.1 Purpose

To state how a new engineer goes from "just joined" to "shipped a real, production pull request" — restated as Objective 4 (Section 1.4): a fast, complete onboarding that produces real, working familiarity, not merely a stack of reading assignments.

## 19.2 Onboarding Workflow

```
Day 1 ── Access provisioned (repository, CI, deployment platforms,
         observability tooling — 18-observability-monitoring.md §19.5's
         "provisioned proactively, not reactively" principle applied here
         to onboarding specifically)
   │
   ▼
Days 1–2 ── Read this document (20) and 15-engineering-standards.md
             Sections 1–8 in full (that document's own stated onboarding
             priority, §1.7) ── local development environment set up
   │
   ▼
Days 2–3 ── Paired first contribution (Section 18.6) — a small, well-
             scoped, genuinely real (not a toy/throwaway) change, guided
             by an assigned onboarding buddy
   │
   ▼
Day 3–5 ── First pull request opened, reviewed, and merged independently
             (with the buddy available but not required)
   │
   ▼
Week 2 ── First independent code review of someone else's pull request
            (Section 18.3 — review responsibility begins early, deliberately)
   │
   ▼
Weeks 2–4 ── Gradually increasing scope of independent work; introduction
              to the on-call rotation's shadowing process (ahead of
              actually joining it, per 19-operations-runbook.md §3.3)
```

## 19.3 The Onboarding Buddy

**Rule:** every new engineer is assigned a specific, named onboarding buddy (an existing team member, not necessarily their manager) for their first two to four weeks — restated as this platform's primary mechanism for making the tribal-knowledge parts of this codebase (the parts this documentation series, however thorough, can't fully substitute for) transferable quickly and personally, rather than left for the new engineer to slowly discover alone.

## 19.4 Required Reading, Prioritized

Restated and consolidated from across this series, in the order most useful for a first week: 00-project-vision.md and 01-product-requirements.md (what and why); this document (20) and 15-engineering-standards.md (how); 08-database-design.md and 09-api-architecture.md (the data model and contract, read as reference material, not necessarily front-to-back); 10-backend-architecture.md and 11-frontend-architecture.md (the system's shape) — the remaining documents (12–19) are treated as standing reference material, consulted as relevant situations arise rather than required front-to-back reading in the first week.

## 19.5 First Contribution Selection

**Rule:** a new engineer's first pull request is a genuinely real, shippable, useful change — restated as a deliberate rejection of toy "fix a typo" onboarding tasks in favor of something small but real, chosen by the onboarding buddy specifically to touch a representative slice of the stack (a Route Handler, a Service Layer function, a test) so the new engineer experiences the actual, full contribution workflow (Sections 4–9) on real, valuable work from day one.

## 19.6 Contributor Checklist for a New Engineer's First Pull Request

- [ ] Local development environment fully working, first Preview deployment successfully triggered (16-cicd-release-management.md §11).
- [ ] Branch named per Section 5's convention.
- [ ] Pull request follows the full template (Section 7.3).
- [ ] Tests written at the appropriate level (13-testing-strategy.md §5), following the module's existing patterns.
- [ ] Change reviewed by both the onboarding buddy and at least one additional reviewer (Section 8.2), for extra learning-oriented feedback beyond the standard single-approval bar.
- [ ] Squash-merged and observed through Staging/Production promotion (16-cicd-release-management.md §19) — the new engineer sees their own change complete its full journey through the pipeline.

## 19.7 Responsibilities

The onboarding buddy owns guiding the new engineer through Section 19.2's workflow and selecting an appropriate first contribution (Section 19.5); Engineering Leadership owns ensuring every new engineer is actually assigned a buddy and that Day 1 access provisioning (Section 19.2) happens without delay.

## 19.8 Best Practices

- Encourage questions liberally during the first weeks — restated from Section 10.4's no-blame culture applied here specifically: a new engineer asking "why does this work this way" is exactly the fresh-eyes value Section 18.3 describes, often surfacing a genuine documentation or clarity gap.
- Revisit onboarding buddy assignments and the reading list (Section 19.4) periodically as this series itself grows, keeping the onboarding path current with the actual, current documentation set.

## 19.9 Common Mistakes

- Assigning a "fix a typo" or otherwise trivial, non-representative first task, which fails to actually exercise the full contribution workflow a new engineer needs to build confidence in (Section 19.5).
- Leaving a new engineer without a clearly assigned buddy, or with a buddy who is themselves too overloaded to actually be available (Section 19.3) — treated as an onboarding-process failure worth correcting immediately, not a minor oversight.

## 19.10 Review Checklist

- [ ] Was a real, representative first contribution selected, not a trivial placeholder task (Section 19.5)?
- [ ] Did the new engineer's first pull request follow the complete standard workflow, with buddy support available throughout (Section 19.6)?


---

# 20. Review Checklists

## 20.1 Purpose

To consolidate every review-relevant checklist from Sections 2–19 into a single, practical reference a reviewer or contributor can work through directly — this section is a distillation, not new content, mirroring 15-engineering-standards.md Section 25.3's identical consolidating role for that document's own coding standards.

## 20.2 The Complete Contribution Checklist

**Before requesting review (author):**
- [ ] Branch named per Section 5's convention; based on current `main` (Section 4.4).
- [ ] Commits are as clean as convenient, but not agonized over (Section 2.5) — the PR title is what matters most (Section 6.6).
- [ ] Pull request follows the full template (Section 7.3), including testing notes, screenshots (if UI-visible), and deployment notes.
- [ ] Meets 15-engineering-standards.md Section 30.2's Definition of Done in full.
- [ ] Any deliberate trade-off or technical debt is recorded, both inline and in the PR description (Section 16.3).
- [ ] Any shared-package or API-contract versioning implication is correctly classified and stated (Section 13.3–13.4).
- [ ] Any documentation this change affects is updated in the same PR (Section 14.6).

**During review (reviewer):**
- [ ] Worked through 15-engineering-standards.md Section 25.3's full coding-standards checklist.
- [ ] Distinguished blocking from non-blocking findings explicitly (Section 8.8).
- [ ] Confirmed CODEOWNERS-designated approval where applicable (Section 8.5); a second reviewer for Critical-tier changes (Section 8.2).
- [ ] Checked for any undocumented shortcut requiring Section 16.4's blocking-finding treatment.
- [ ] Reviewed with Section 8.4's constructive, teaching-oriented tone.

**Before merge:**
- [ ] Every Section 9.3 merge-decision condition satisfied.
- [ ] Branch reasonably current with `main`; any conflict resolved and tested (Section 10.3).

**Special cases:**
- [ ] Hotfix: Section 12.3's complete checklist.
- [ ] New engineer's first PR: Section 19.6's complete checklist.
- [ ] Dependency update: Section 15.4's review focus (changelog review, major-version smoke-testing).

## 20.3 Responsibilities

Every contributor uses the author-facing portion of Section 20.2 before requesting review; every reviewer uses the reviewer-facing portion during review — restated as this section's sole purpose: making the standards defined throughout Sections 2–19 mechanically checkable in the moment they matter, not merely understood in the abstract.

## 20.4 Best Practices

- Keep this consolidated checklist visible/linked directly from the pull request template itself (Section 7.3), so it's encountered at the moment of use, not only when a contributor happens to re-read this document.

## 20.5 Common Mistakes

- Treating this consolidated checklist as a substitute for actually understanding the reasoning behind each item (Sections 2–19) — restated from 15-engineering-standards.md's own stated caution: a checklist run through mechanically without genuine understanding misses the judgment calls no checklist can fully automate.

## 20.6 Review Checklist

- [ ] Was Section 20.2's complete checklist actually used, not merely assumed satisfied?

---

# 21. Future Evolution

## 21.1 Purpose

To name the specific, plausible directions this contribution workflow would evolve as the team grows — restated in the same evidence-driven spirit as every prior document's own "future" section (15-engineering-standards.md's own forward-looking stance throughout, 16-cicd-release-management.md Section 29, 18-observability-monitoring.md Section 22.6, 19-operations-runbook.md Section 25), never speculative process overhead added ahead of a demonstrated need.

## 21.2 More Granular CODEOWNERS

As the team grows beyond its founding size, CODEOWNERS (Section 8.5) may evolve from broad, module-level ownership toward more granular, sub-module ownership for the platform's largest, most-actively-developed areas (Products, Orders, Payments) — reconsidered specifically when a module's contributor count grows large enough that a single owner or small owning group becomes a genuine review-turnaround bottleneck (Section 8.6's stated target).

## 21.3 A Dedicated Release-Coordination Role

Restated from 16-cicd-release-management.md Section 29.5's progressive-delivery-tooling direction: as release volume grows, a more formalized release-coordination function (beyond the per-release "release owner" role that document's Section 14.4 currently defines) may become warranted — reconsidered when the current, lightweight per-release ownership model shows signs of strain (a rising rate of miscommunicated or under-coordinated releases, per that document's own Section 21.4 metrics).

## 21.4 Expanded Pairing/Mentorship Structure

As the team grows, Section 18.6's informal, freely-available pairing practice may formalize into a more structured mentorship program (assigned mentor-mentee relationships beyond the initial onboarding buddy period, Section 19.3) — adopted specifically if informal pairing alone proves insufficient to spread deep codebase knowledge broadly enough as the team and codebase both scale.

## 21.5 Contribution from Outside the Core Team

Not anticipated at this platform's current stage (this is an internal product engineering team, not an open-source project accepting external contributions) but this document's structure — clear conventions, a well-defined PR template, CODEOWNERS-enforced review — is deliberately compatible with an eventual external-contribution model (e.g., for a future public API's SDK repositories, 09-api-architecture.md Section 22.15's reserved future scope) without requiring a fundamental redesign of this workflow, should that ever become relevant.

## 21.6 Success Criteria for Any Future Evolution

Every item in this section is adopted only in response to a specific, evidenced trigger — never adopted preemptively "because it's the natural next step," mirroring 15-engineering-standards.md Section 3.5's YAGNI principle and 16-cicd-release-management.md Section 29.7's identical stated evidence-driven adoption bar, both restated here as this document's own closing commitment.

## 21.7 Review Checklist

- [ ] Is any proposed evolution to this workflow backed by a specific, evidenced trigger (Section 21.6), not adopted speculatively?

---

*This document is the definitive Git workflow and contribution guide for Dreams by Kalakaaar v2. Every contributor — on their first day or their thousandth pull request — follows the conventions documented here, and every reviewer enforces them, consistently and without tenure-based exception (Guiding Principle 1, Section 1.7). Where this document's guidance and 15-engineering-standards.md's or 16-cicd-release-management.md's more detailed authority on a given topic ever appear to diverge, those two documents are authoritative and this document is corrected to match — this document's role is to make their standards livable and legible in day-to-day collaboration, never to silently redefine them. Good code, well tested and well reviewed, written by people who trust and teach each other along the way — that is what this document exists to make the default, ordinary experience of working on this codebase.*
