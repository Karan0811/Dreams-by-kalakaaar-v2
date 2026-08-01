# Merge Checklist — Validation & Stabilization Pass

## Before merging

- [ ] Run `npm install` in a networked environment (could not be run in
      this sandbox — see IMPLEMENTATION_REPORT.md).
- [ ] Run `npm run lint` — expect **0 errors**. The two real errors found in
      the prior log (`DataTable.tsx` aria-sort, `Card.tsx` heading content)
      are fixed. Pre-existing warnings (see below) will still print but
      should not fail the command.
- [ ] Run `npm run typecheck` — expect **0 errors** (already confirmed clean
      in the real log prior to this pass's changes; this pass's changes are
      type-safe by manual review and a syntax-only `tsc` pass).
- [ ] Run `npm run build` — expect **both** `apps/buyer` and `apps/creator`
      to complete. The confirmed, deterministic failure in `apps/creator`
      (`useSearchParams()` / Suspense) is fixed. `apps/buyer`'s prior build
      was interrupted (not a code failure) — re-run to confirm a clean pass.
- [ ] Confirm with whoever owns `packages/auth` whether
      `ForgotPasswordForm.tsx`'s `/api/auth/forgot-password` fetch call is
      hitting the right endpoint (Better Auth is configured for
      `forget-password`) — flagged, not fixed, see report.
- [ ] Confirm with the Products team that `ProductListClient.tsx`'s
      `useSearchParams()` usage doesn't hit the same Suspense requirement
      during their own build (analysis suggests it's fine — parent page
      already forces dynamic rendering — but not independently verified,
      Products module is off-limits to this pass).

## Complete list of files changed this session

| File | Reason |
|---|---|
| `packages/ui/src/data/DataTable.tsx` | Real lint error: `aria-sort` moved from `<button>` to `<th>`. Also added keyboard support (`role`, `tabIndex`, `onKeyDown`) to the clickable row — a related a11y gap found while fixing the logged error. |
| `packages/ui/src/primitives/Card.tsx` | Real lint error: `CardTitle`'s `<h3>` had no literal children for the linter to see through `{...props}`. Destructured `children` explicitly. |
| `apps/creator/app/(auth)/login/page.tsx` | Real, deterministic build failure: added required `<Suspense>` boundary around `useSearchParams()`-using `CreatorLoginForm`. |
| `apps/buyer/app/(auth)/login/page.tsx` | Same pattern/fix as above, applied preemptively (identical code shape, not independently log-confirmed due to an unrelated build interruption). |
| `packages/ui/src/media/Image.tsx` | Latent bug: `hasError` never reset on a new `src`, so a reused instance got stuck on the placeholder after one failure. |
| `packages/ui/src/primitives/Chip.tsx` | Missing `"use client"` — inconsistent with every other component in the library that wires its own click handler. |
| `packages/ui/src/forms/Autocomplete.tsx` | Missing `aria-activedescendant` — arrow-key navigation wasn't announced to screen readers. |
| `packages/utils/src/file.ts` | `formatFileSize` indexed an array with a value TypeScript (correctly, under this repo's `noUncheckedIndexedAccess`) treats as possibly out of range. Added a fallback. |
| `packages/utils/src/logger.ts` | Real warning: removed an `eslint-disable` comment for a rule (`no-console`) that isn't actually enabled in this repo. |
| `packages/ui/src/feedback/EmptyState.tsx` | Tidiness only: merged two import statements from the same module into one. No behavior change. |

No other files were touched. `apps/*` files outside the two listed above,
`packages/api-client`, `packages/auth`, and `packages/types` were read for
context but not modified.

## Complete list of new dependencies

**None.** This pass added zero new npm dependencies. (The prior Sprint 0.5
pass added several Radix packages, `react-hook-form`, and
`@hookform/resolvers` to `packages/ui/package.json` — unchanged this
session.)

## Complete list of export changes

**None.** No public export was added, removed, or renamed from `@dbk/ui`
or `@dbk/utils` in this pass. Every fix was an internal implementation
change behind an already-existing, already-exported name.

## Remaining known issues

See "Out-of-scope issues found and explicitly NOT touched" in
IMPLEMENTATION_REPORT.md for full detail. Summary:

1. **Likely live bug, out of scope**: `ForgotPasswordForm.tsx` probably
   calls the wrong Better Auth endpoint (`forgot-password` vs. the
   configured `forget-password`). Needs the Authentication owner.
2. **Pre-existing, non-blocking, out of scope**: `no-restricted-imports`
   warning on `import * as React from "react"` across ~40+ files in
   `packages/ui` (both old and new). Warning-level, doesn't fail the
   build; a real fix is a deliberate repo-wide import-style refactor, not
   a validation-pass change.
3. **Pre-existing, out of scope**: two unused-`eslint-disable` warnings in
   `packages/auth/src/email.ts`, and one `no-restricted-imports` warning in
   `packages/api-client/src/QueryProvider.tsx`.
4. **Tooling quirk, documented not fixed**: Next.js's build-time ESLint
   step printed a non-fatal `Cannot serialize key "parse" in "parser"`
   message during both app builds; didn't block either build. Looks like a
   root-level Next.js/typescript-eslint flat-config interaction, outside
   `packages/ui`/`packages/utils` scope.
5. **Environment, not code**: the captured `apps/buyer` build log ends in a
   SIGINT (exit 130) after compiling and type-checking successfully —
   re-run to get a clean, uninterrupted result.
6. **Needs Products-team confirmation**: `ProductListClient.tsx`'s
   `useSearchParams()` usage — likely fine (parent page already forces
   dynamic rendering) but not independently build-verified since the
   Products module is off-limits to this pass.
