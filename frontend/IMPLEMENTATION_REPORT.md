# Implementation Report — Sprint 0.75: Shared Commerce Foundation

Note: the previous sprint's validation-pass reports were archived to
`docs/reports/` (not deleted) so this file can be this sprint's own report,
as requested.

## Scope discipline

Per the brief: no Products, Cart, Checkout, Orders, Wishlist, or Reviews
logic was implemented. Nothing in `apps/`, `packages/auth`, or the existing
Products/Cart/Creator-dashboard files in `packages/api-client` was
modified. Two existing files were **extended** (not replaced, not
duplicated) because the brief's own items map directly onto them:
`packages/ui/src/navigation/Sidebar.tsx` (the "Collapsible Sidebar" item)
and `packages/utils/src/image.ts` (image dimension validation +
compression, alongside its existing pure-math helpers).

## Environment constraint (unchanged from prior sprints)

This sandbox's network egress is blocked for real package installs
(confirmed again this sprint: `npm install --dry-run` resolves the
dependency tree, but tarball downloads 403). No live `npm run
lint`/`typecheck`/`build` was run. Validation performed instead:

1. A standalone `tsc --noEmit` syntax pass (relaxed options, global
   TypeScript) across every file in `packages/ui/src`, `packages/utils/src`,
   and `packages/api-client/src` — zero syntax errors.
2. A scripted scan for unused named imports across every new file — zero
   found.
3. Manual review against this repo's actual `tsconfig.base.json`
   (`strict: true`, `noUncheckedIndexedAccess: true`) and actual
   `packages/config/eslint/base.js` rule set (`jsx-a11y` recommended,
   `react-hooks` recommended, `consistent-type-imports`,
   `no-restricted-imports`) — same method used in the prior validation
   pass, since I could reason about these precisely from source.

**Please run the real pipeline before merging** — this is thorough manual
review, not a substitute for it.

## What was built, by brief section

### 1. Shared Layout Infrastructure
`AppShell`, `TopNav`, `UserMenu`, `NotificationsButton`, `PageHeader`,
`LoadingLayout`, `EmptyLayout`, plus a `CountBadge` primitive. `Breadcrumb`,
`Container`/`Section`/`ResponsiveGrid` already existed (Sprint 0.5) — not
duplicated. `Sidebar` extended with optional, fully backward-compatible
`collapsed`/`onCollapsedChange` props for an icon-only lg+ rail (refactored
with a shared `SidebarNavList` helper to avoid duplicating the nav-item
markup between the collapsed rail and the always-full-label mobile
drawer). "Footer Layout" was **not** added as a separate component — the
existing `Footer` (Sprint 1) already serves that role and a dashboard
context has no established need for a distinct one yet; adding one
speculatively would risk exactly the duplication the brief warns against.

### 2. Shared Hooks
All 13 named in the brief, implemented: `useDebounce`, `usePagination`,
`useInfiniteScroll`, `useConfirmationDialog`, `useLocalStorage`,
`useSessionStorage`, `useMediaQuery`, `useClipboard`, `useImagePreview`,
`useFileUpload`, `usePrevious`, `useBoolean`, `useDisclosure`. Two extras
added because the Form/Upload/Error sections below need them:
`useOnlineStatus` (powers `NetworkErrorState`) and `useUnsavedChangesWarning`
+ `useAutosave` (the brief's own Form Infrastructure section names these).

### 3. Shared Form Infrastructure
`FormError` (top-level banner) and `useAutosave`/`useUnsavedChangesWarning`
(hooks, above). **Deliberately did not build a new "Form Provider" /
Context-based wrapper system.** This platform's established, working
pattern — `register("field")` passed into the existing `FormField`, or
Radix controls wired via react-hook-form's own `Controller` — predates
this sprint and the brief explicitly says not to replace existing
implementations. `useZodForm` (Sprint 0.5) already collapses the
`useForm`+`zodResolver` boilerplate the brief's "RHF wrappers" item was
likely asking for.

### 4. Shared Upload Infrastructure
`FileDropzone` (drag-and-drop + click-to-browse), `UploadProgressItem`,
`ImagePreviewGrid`, `useFileUpload` (validate → queue → progress → retry
state machine). `validateImageUpload` (size/MIME, Sprint 0.5) extended
with `validateImageDimensions` and `compressImage` (canvas-based,
browser-only) in `@dbk/utils/image.ts`. **No backend connection anywhere**
— `useFileUpload` takes an `upload(file, onProgress)` function supplied by
the caller; this package has no knowledge of R2, presigned URLs, or any
specific transport.

### 5. Search Infrastructure
`SearchProvider`/`useSearchContext` (query + persisted recent searches),
`RecentSearchesList`, `CommandPalette` (Dialog-based, filterable list,
arrow-key nav, ARIA combobox/listbox pattern matching `Autocomplete` from
Sprint 0.5). **No Product search implemented** — `CommandPalette` takes a
generic `items` prop with zero awareness of what a "command" is.

### 6. React Query Foundation
`useOptimisticMutation` (generic snapshot/apply/rollback-on-error/invalidate
wrapper around `useMutation`) and `createResourceKeys` (factory generating
the same `{all, lists, list, details, detail}` shape already hand-written
for `productKeys`/`cartKeys`/`creatorDashboardKeys`), both in
`packages/api-client`. **The existing `QueryProvider`'s retry policy and
global defaults were not touched or duplicated** — that's already the
"Retry policies" and "Global query helpers" items from the brief, done
before this sprint.

### 7. Notification Infrastructure
`NotificationProvider`/`useNotifications` (in-memory list, read/unread,
`unreadCount`), `NotificationCenter` (popover list UI),
`NotificationPreferences` (generic per-category `Switch` toggles). Kept
explicitly distinct from `Toaster` (Sprint 0.5, `sonner`): transient
self-dismissing confirmations vs. a persistent, revisitable notification
center — different feature, documented as such so the two don't get
conflated or merged incorrectly later. "Badge Counter" → `CountBadge`
(layout infrastructure, above), used by both `Sidebar` and
`NotificationsButton`.

### 8. Error Handling
`ErrorBoundary` (the one necessary class component — React has no hook
equivalent for `getDerivedStateFromError`), `ApiErrorState` (maps an
`{code, message}`-shaped error through the existing `getErrorMessage()`
into `ErrorState` — structurally typed rather than importing
`@dbk/api-client`'s `ApiError` class, so `packages/ui` doesn't take on a
new package dependency), `NetworkErrorState` (offline-aware `ErrorState`
preset), `RetryButton` (standalone inline retry for contexts smaller than
a full `ErrorState` block).

### 9. Loading States
`Skeleton`, `Spinner`, `Progress` already existed (Sprint 0.5) — not
rebuilt. New: `Shimmer`, a moving-gradient sweep as a second loading
animation option alongside `Skeleton`'s pulse. Self-contained keyframe
(not added to the shared `theme.css`, since it's used by one component,
not a design token); respects `prefers-reduced-motion` via Tailwind's
`motion-safe:` variant.

### 10. Accessibility
Applied throughout, not as a separate deliverable. Specific decisions:
`Sidebar`'s collapsed rail keeps every item's accessible name via
`sr-only` text even when visually icon-only; `FileDropzone` is fully
keyboard-operable (`role="button"`, `tabIndex`, Enter/Space) with the
native file input hidden via `sr-only`+`tabIndex={-1}` rather than
`display:none`; `CommandPalette` follows the same ARIA combobox pattern as
`Autocomplete`; `ErrorBoundary`/`ApiErrorState` never surface raw error
text.

## Real bugs caught and fixed during construction

- **Missing `"use client"` on `RecentSearchesList`** — it wires its own
  `onClick` handlers directly (same category as `Chip`, fixed in the prior
  validation pass); without the directive, a Server Component rendering it
  with a real closure prop would fail to serialize across the RSC
  boundary.
- **`ErrorBoundary`'s first-draft default fallback passed `error.message`
  straight to the user** — exactly the anti-pattern this codebase's own
  `errorMessages.ts` and `ErrorState` doc comments warn against. Changed
  to generic copy; the raw error still reaches the logger for diagnosis.
- **`ApiErrorState`'s first draft re-implemented a fallback
  `getErrorMessage` already provides** — that function already handles
  `undefined`/unrecognized codes and always returns a string; the extra
  ternary was dead logic, simplified after re-reading the actual function.
- **Missing `ChevronsLeft` import** during the first `Sidebar` collapse
  draft, caught before finalizing by rewriting the file cleanly with a
  shared `SidebarNavList` helper (which also removed an unnecessary
  duplication between the collapsed-rail and mobile-drawer nav rendering).
- **Two inaccurate `eslint-disable` comments** (`UploadProgressItem.tsx`,
  `ImagePreviewGrid.tsx`, both for `@next/next/no-img-element`) — checked
  `packages/config/eslint/base.js` directly and confirmed that rule isn't
  registered for this package's own lint run (same class of mistake as the
  `logger.ts` `no-console` disable comment removed in the prior validation
  pass, caught this time before it shipped). Replaced with plain
  explanatory comments.

## Complete list of new files

```
packages/ui/src/hooks/index.ts
packages/ui/src/hooks/useDebounce.ts
packages/ui/src/hooks/usePrevious.ts
packages/ui/src/hooks/useBoolean.ts
packages/ui/src/hooks/useDisclosure.ts
packages/ui/src/hooks/useMediaQuery.ts
packages/ui/src/hooks/useWebStorage.ts        (private, shared by the two below)
packages/ui/src/hooks/useLocalStorage.ts
packages/ui/src/hooks/useSessionStorage.ts
packages/ui/src/hooks/useClipboard.ts
packages/ui/src/hooks/useOnlineStatus.ts
packages/ui/src/hooks/usePagination.ts
packages/ui/src/hooks/useInfiniteScroll.ts
packages/ui/src/hooks/useConfirmationDialog.tsx
packages/ui/src/hooks/useImagePreview.ts
packages/ui/src/hooks/useFileUpload.ts
packages/ui/src/hooks/useUnsavedChangesWarning.ts
packages/ui/src/hooks/useAutosave.ts
packages/ui/src/primitives/CountBadge.tsx
packages/ui/src/layout/TopNav.tsx
packages/ui/src/layout/UserMenu.tsx
packages/ui/src/layout/NotificationsButton.tsx
packages/ui/src/layout/PageHeader.tsx
packages/ui/src/layout/AppShell.tsx
packages/ui/src/layout/LoadingLayout.tsx
packages/ui/src/layout/EmptyLayout.tsx
packages/ui/src/forms/FormError.tsx
packages/ui/src/upload/FileDropzone.tsx
packages/ui/src/upload/UploadProgressItem.tsx
packages/ui/src/upload/ImagePreviewGrid.tsx
packages/ui/src/search/SearchProvider.tsx
packages/ui/src/search/RecentSearchesList.tsx
packages/ui/src/search/CommandPalette.tsx
packages/ui/src/notifications/NotificationProvider.tsx
packages/ui/src/notifications/NotificationCenter.tsx
packages/ui/src/notifications/NotificationPreferences.tsx
packages/ui/src/feedback/ErrorBoundary.tsx
packages/ui/src/feedback/ApiErrorState.tsx
packages/ui/src/feedback/NetworkErrorState.tsx
packages/ui/src/feedback/RetryButton.tsx
packages/ui/src/feedback/Shimmer.tsx
packages/api-client/src/hooks/useOptimisticMutation.ts
packages/api-client/src/query-keys/createResourceKeys.ts
packages/api-client/README.md
docs/frontend/shared-commerce-foundation.md
IMPLEMENTATION_REPORT.md
MERGE_CHECKLIST.md
```

## Complete list of modified (pre-existing) files

```
packages/ui/src/navigation/Sidebar.tsx      — extended with optional collapse support (backward compatible)
packages/ui/src/index.ts                    — barrel additions only, no existing lines changed
packages/utils/src/image.ts                 — extended with dimension validation + compression
packages/api-client/src/index.ts            — one barrel addition (useOptimisticMutation)
packages/api-client/src/query-keys/index.ts — one barrel addition (createResourceKeys)
packages/ui/README.md                       — new-content section appended
packages/utils/README.md                    — new-content section appended
README.md                                   — Sprint 0.75 section + one clarifying note update
CHANGELOG.md                                — Sprint 0.75 entry appended
```

Prior sprint's `IMPLEMENTATION_REPORT.md`/`MERGE_CHECKLIST.md` moved to
`docs/reports/*-validation-pass.md` (archived, not deleted or overwritten
silently).

## Complete list of new dependencies

**None.** Zero new npm packages added this sprint.

## Complete list of export changes

**Additive only.** Every new export listed in
`docs/frontend/shared-commerce-foundation.md`'s tables. No existing export
from `@dbk/ui`, `@dbk/utils`, or `@dbk/api-client` was removed, renamed, or
had its signature changed. `Sidebar`'s `SidebarProps` gained two optional
fields (`collapsed`, `onCollapsedChange`) — additive, not breaking.

## Remaining known issues

1. **Not independently verified with a real toolchain** — see "Environment
   constraint" above. Run the real pipeline before merging.
2. **Adoption is not part of this sprint.** `DashboardChrome`
   (`apps/creator`) still hand-rolls the top bar/avatar pattern that
   `AppShell`/`TopNav`/`UserMenu` now provide reusably; both apps' `(auth)/layout.tsx`
   still hand-roll what `EmptyLayout` now provides. Migrating either is a
   deliberate, separate change — flagged, not done, to avoid touching
   app-level code speculatively in an infrastructure sprint.
3. **`useUnsavedChangesWarning` only covers the browser-native
   close/refresh case** (`beforeunload`) — it does not intercept in-app
   Next.js `<Link>` navigation, since App Router has no built-in
   navigation-blocking API yet. Documented in the hook's own doc comment.
4. **`CommandPalette` has no built-in global keyboard shortcut** (e.g.
   Cmd/Ctrl+K to open) — it's a fully controlled component
   (`open`/`onOpenChange`), matching every other overlay in this package;
   wiring a global shortcut is left to whichever feature adopts it, since
   only one command palette should ever own that shortcut app-wide.
5. Everything already flagged as out-of-scope in the prior validation
   pass (see `docs/reports/IMPLEMENTATION_REPORT-validation-pass.md`) —
   the likely-broken `forgot-password`/`forget-password` endpoint
   mismatch, the pervasive `no-restricted-imports` warning on
   `import * as React`, etc. — is unchanged and still applies, not
   re-litigated here.
