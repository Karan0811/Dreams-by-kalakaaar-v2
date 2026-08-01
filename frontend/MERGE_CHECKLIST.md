# Merge Checklist — Sprint 0.75: Shared Commerce Foundation

## Before merging

- [ ] Run `npm install` in a networked environment (blocked in this
      sandbox — see IMPLEMENTATION_REPORT.md).
- [ ] Run `npm run lint` — expect 0 errors from this sprint's files. (Any
      pre-existing warnings from before this sprint, e.g. the
      `no-restricted-imports` warning on `import * as React`, are
      unrelated and documented in the prior validation pass's report.)
- [ ] Run `npm run typecheck` — expect 0 errors. All new code was written
      against this repo's actual `noUncheckedIndexedAccess`/`strict`
      settings and syntax-checked standalone; not independently confirmed
      with real installed types.
- [ ] Run `npm run build` — expect no new failures introduced by this
      sprint. Nothing here touches routing or page-level code, so this
      sprint shouldn't affect build behavior either way, but confirm.
- [ ] Skim `docs/frontend/shared-commerce-foundation.md` for the usage
      examples before adopting any of these in a feature branch.
- [ ] Decide whether/when to migrate `DashboardChrome` onto
      `AppShell`/`TopNav`/`UserMenu`, and both apps' `(auth)/layout.tsx`
      onto `EmptyLayout` — both are flagged as natural follow-ups, neither
      was done this sprint (see IMPLEMENTATION_REPORT.md, "Remaining known
      issues" #2).

## Components added

**Layout**: `AppShell`, `TopNav`, `UserMenu`, `NotificationsButton`,
`PageHeader`, `LoadingLayout`, `EmptyLayout`, `CountBadge`.

**Upload**: `FileDropzone`, `UploadProgressItem`, `ImagePreviewGrid`.

**Search**: `SearchProvider`, `RecentSearchesList`, `CommandPalette`.

**Notifications**: `NotificationProvider`, `NotificationCenter`,
`NotificationPreferences`.

**Error handling**: `ErrorBoundary`, `ApiErrorState`, `NetworkErrorState`,
`RetryButton`.

**Loading**: `Shimmer`.

**Forms**: `FormError`.

**Extended (not new)**: `Sidebar` (optional collapse).

## Hooks added

`useDebounce`, `usePrevious`, `useBoolean`, `useDisclosure`,
`useMediaQuery`, `useLocalStorage`, `useSessionStorage`, `useClipboard`,
`useOnlineStatus`, `usePagination`, `useInfiniteScroll`,
`useConfirmationDialog`, `useImagePreview`, `useFileUpload`,
`useUnsavedChangesWarning`, `useAutosave`.

## Providers added

`SearchProvider` (`useSearchContext`), `NotificationProvider`
(`useNotifications`). Neither is mounted anywhere yet — that's for the
feature that first needs them to do, scoped to whatever subtree actually
needs the context (e.g. `NotificationProvider` around the dashboard shell,
not necessarily the whole app).

## Utilities added

`@dbk/utils`: `readImageDimensions`, `validateImageDimensions`,
`compressImage` (all in `image.ts`, browser-only).

`@dbk/api-client`: `useOptimisticMutation`, `createResourceKeys`.

## Modified files

See IMPLEMENTATION_REPORT.md's "Complete list of modified (pre-existing)
files" — nine files, all additive extensions (barrel exports, new optional
props, new functions appended to an existing module). No existing
behavior, export, or prop changed or removed.

## Dependencies added

None.

## Validation results

No live pipeline run (network blocked in this sandbox). Validated via:
standalone `tsc --noEmit` syntax pass across all three touched packages
(0 errors), scripted unused-import scan (0 found), manual review against
the real `tsconfig.base.json` and `packages/config/eslint/base.js`. Full
detail in IMPLEMENTATION_REPORT.md.

## Remaining known issues

See IMPLEMENTATION_REPORT.md's "Remaining known issues" section — five
items, none blocking, all either pre-existing (carried forward from the
prior validation pass) or explicit, documented scope boundaries of this
sprint (no adoption in `apps/`, `useUnsavedChangesWarning`'s
`beforeunload`-only coverage, `CommandPalette`'s lack of a built-in global
shortcut).
