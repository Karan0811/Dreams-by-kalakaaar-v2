# Shared Commerce Foundation

Sprint 0.75 — reusable frontend infrastructure for `@dbk/ui`, `@dbk/utils`,
and `@dbk/api-client`. Everything here is generic: no Products, Cart,
Checkout, Orders, Wishlist, or Reviews logic. Where a piece of this maps
onto something an existing app already hand-rolls (Creator Studio's
`DashboardChrome` header, the duplicated `(auth)/layout.tsx` shell in both
apps), that's noted — adopting the shared version there is a deliberate
follow-up, not done as part of this sprint.

## Hooks (`@dbk/ui`)

All under `packages/ui/src/hooks`, re-exported from `@dbk/ui`.

| Hook | Purpose |
|---|---|
| `useDebounce(value, delayMs?)` | Debounces a value. For debouncing a callback instead, use `@dbk/utils`'s `debounce()`. |
| `usePrevious(value)` | The value from the last render. |
| `useBoolean(initial?)` | `{ value, setTrue, setFalse, toggle, set }`. |
| `useDisclosure(initial?)` | `{ isOpen, open, close, toggle, onOpenChange }` — drop-in for any overlay's `open`/`onOpenChange` props. |
| `useMediaQuery(query)` | SSR-safe `matchMedia` subscription. |
| `useLocalStorage(key, initial)` / `useSessionStorage(key, initial)` | JSON-serialized, SSR-safe web storage, `[value, setValue, remove]`. |
| `useClipboard(resetMs?)` | `{ copy, hasCopied }`. |
| `useOnlineStatus()` | Tracks `navigator.onLine`. |
| `usePagination(totalPages, initialPage?)` | Local page-number state, clamped via `@dbk/utils`'s `clampPage`. For the buyer storefront's cursor pagination, use TanStack Query's `useInfiniteQuery` directly instead. |
| `useInfiniteScroll({ onLoadMore, hasMore, isLoading? })` | Returns a sentinel ref; fires `onLoadMore` via `IntersectionObserver`. Pairs with `useInfiniteQuery`'s `fetchNextPage`/`hasNextPage`. |
| `useConfirmationDialog()` | `{ confirm, ConfirmationDialog }` — imperative `await confirm({...})` on top of the existing `ConfirmDialog`. |
| `useImagePreview(file)` | Object-URL lifecycle for a `File` preview (creates/revokes automatically). |
| `useFileUpload({ upload, validate?, maxFiles? })` | Generic multi-file upload queue: validate → upload → progress → retry. No backend knowledge — you supply `upload`. |
| `useUnsavedChangesWarning(isDirty)` | `beforeunload` guard. Doesn't intercept in-app `<Link>` navigation (App Router has no navigation-blocking API yet) — pair with `useConfirmationDialog` at individual Cancel/Back buttons for that. |
| `useAutosave({ value, onSave, delayMs?, enabled? })` | Debounced autosave with `"idle" \| "saving" \| "saved" \| "error"` status. |

## Form infrastructure (`@dbk/ui`)

- **`FormError`** (`forms/FormError.tsx`) — top-level form error banner, distinct from `FormField`'s per-field error. Mirrors the `formError` state + inline `<p>` already hand-written in `LoginForm`/`SignupForm`.
- **No new Form/Context system.** The platform's established pattern — `register("field")` into the existing `FormField`, or Radix-based controls wired via react-hook-form's own `Controller` — is unchanged. `useZodForm` (from Sprint 0.5) already covers the `useForm` + `zodResolver` boilerplate.

## Layout infrastructure (`@dbk/ui`)

| Component | Purpose |
|---|---|
| `AppShell` | Full responsive dashboard shell: `Sidebar` + `TopNav` + main content, with mobile-drawer and desktop-collapse state wired internally. |
| `Sidebar` (extended) | Now accepts optional `collapsed`/`onCollapsedChange` for an icon-only lg+ rail. Fully backward compatible — omit both props for the original always-expanded behavior. |
| `TopNav` | Generic dashboard top bar. Distinct from `Navbar` (buyer storefront marketing nav) — different context, not a duplicate. |
| `UserMenu` | Account dropdown, built on the existing `Avatar` + `DropdownMenu`. |
| `NotificationsButton` | Bell icon + `CountBadge`, opens arbitrary content (typically `NotificationCenter`) in a `Popover`. |
| `PageHeader` | Title, description, breadcrumb slot, actions slot. |
| `LoadingLayout` | Full-viewport centered `Spinner`. Use a real page-shaped `Skeleton` instead wherever one exists — this is for when there's no shape to match yet. |
| `EmptyLayout` | The focused single-task centered layout (logo + card) that `apps/buyer/app/(auth)/layout.tsx` and `apps/creator/app/(auth)/layout.tsx` currently hand-roll identically. |
| `CountBadge` (primitive) | Small numeric overlay badge for icon buttons. |

### Usage: a dashboard page

```tsx
"use client";
import { AppShell, UserMenu, NotificationsButton, NotificationCenter, useNotifications, PageHeader } from "@dbk/ui";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <AppShell
      sidebarItems={items}
      collapseStorageKey="creator-sidebar-collapsed"
      topNavActions={
        <>
          <NotificationsButton count={unreadCount}>
            <NotificationCenter notifications={notifications} onMarkAsRead={markAsRead} onMarkAllAsRead={markAllAsRead} />
          </NotificationsButton>
          <UserMenu name="Jane" email="jane@example.com" items={[{ label: "Sign out", onSelect: signOut }]} />
        </>
      }
    >
      {children}
    </AppShell>
  );
}
```

## Upload infrastructure (`@dbk/ui` + `@dbk/utils`)

Abstraction only — nothing here calls a backend.

- **`FileDropzone`** — drag-and-drop + click-to-browse selection surface.
- **`useFileUpload`** — the queue/progress/retry state machine; you supply `upload(file, onProgress)`.
- **`UploadProgressItem`** — one row (thumbnail, filename, progress bar, retry/remove) for a file in the queue.
- **`ImagePreviewGrid`** — grid of removable image previews for already-selected (not necessarily uploading) files.
- **`@dbk/utils`: `validateImageDimensions(file, {minWidth, minHeight, maxWidth, maxHeight})`** and **`compressImage(file, {maxWidth?, quality?})`** — browser-only (canvas), extending `image.ts`. `validateImageUpload` (size/MIME type) already existed from Sprint 0.5.

### Usage

```tsx
"use client";
import { FileDropzone, useFileUpload, UploadProgressItem } from "@dbk/ui";

function ProductImageUploader() {
  const { files, addFiles, removeFile, retryFile } = useFileUpload({
    upload: async (file, onProgress) => {
      // supply your own transport — this hook has no backend knowledge
      await uploadToR2(file, onProgress);
    },
  });

  return (
    <>
      <FileDropzone onFilesSelected={addFiles} accept="image/*" hint="PNG, JPG, or WEBP, up to 5MB" />
      {files.map((entry) => (
        <UploadProgressItem key={entry.id} entry={entry} onRemove={removeFile} onRetry={retryFile} />
      ))}
    </>
  );
}
```

## Search infrastructure (`@dbk/ui`)

Reusable only — no Product search implemented.

- **`SearchProvider`** / **`useSearchContext`** — generic `{ query, setQuery, recentSearches, addRecentSearch, clearRecentSearches }`, recent searches persisted via `useLocalStorage` under a caller-supplied key.
- **`RecentSearchesList`** — presentational list for the above.
- **`CommandPalette`** — generic Cmd+K-style shell (`Dialog` + filterable list + arrow-key nav). Takes `items: CommandPaletteItem[]`; has no knowledge of what a "command" is. A future Products quick-search or command menu would supply its own `items` to this shell.

## Notification infrastructure (`@dbk/ui`)

Distinct from `Toaster` (Sprint 0.5, `sonner`-based): `Toaster` is for
transient, self-dismissing confirmations ("Saved"). This is the persistent,
read/unread notification *center* — a different feature, not a duplicate.
A given event might reasonably fire both.

- **`NotificationProvider`** / **`useNotifications`** — in-memory list with `addNotification`, `markAsRead`, `markAllAsRead`, `remove`, `clear`, `unreadCount`. No opinion on where notifications come from (WebSocket, polling, etc.) or cross-session persistence.
- **`NotificationCenter`** — the popover list UI, pass as `NotificationsButton`'s `children`.
- **`NotificationPreferences`** — generic per-category toggle list (`Switch`-based); no built-in category set or persistence.

## React Query foundation (`@dbk/api-client`)

The existing `QueryProvider` (Sprint 1) already provides the retry policy
and global `staleTime`/`gcTime` defaults — not duplicated here.

- **`useOptimisticMutation({ mutationFn, queryKey, updateFn, invalidateKeys?, options? })`** — generic optimistic-update-with-rollback wrapper around `useMutation`. No domain knowledge; a future `useToggleWishlist` would call this rather than hand-rolling the snapshot/rollback dance.
- **`createResourceKeys<TParams, TId>(resource)`** — generates the same `{ all, lists, list, details, detail }` shape already hand-written for `productKeys`/`cartKeys`/`creatorDashboardKeys`, for the *next* resource's query keys.

## Error handling (`@dbk/ui`)

- **`ErrorBoundary`** — the one necessary class component (React has no hook-based error boundary). Logs via `@dbk/utils`'s `logger`; wire `onError` to also report to Sentry at the call site. Default fallback shows generic copy, never the raw `error.message`.
- **`ApiErrorState`** — maps an `{ code, message }`-shaped error (a real `ApiError` instance satisfies this structurally, without `@dbk/ui` depending on `@dbk/api-client`) through `getErrorMessage()` into the existing `ErrorState`.
- **`NetworkErrorState`** — offline-aware `ErrorState` preset, via the new `useOnlineStatus`.
- **`RetryButton`** — standalone inline retry action for contexts smaller than a full `ErrorState` block (a failed table row, a failed thumbnail).

## Loading states (`@dbk/ui`)

`Skeleton`, `Spinner`, `Progress` already existed (Sprint 0.5). New this
sprint:

- **`Shimmer`** — a moving-gradient sweep, as an alternative to `Skeleton`'s pulse-opacity animation. Respects `prefers-reduced-motion` via Tailwind's `motion-safe:` variant.

## Accessibility notes specific to this sprint

- `Sidebar`'s new collapsed rail keeps every nav item's full label in an `sr-only` span and uses `title` for a mouse-hover tooltip — collapsing to icon-only never removes the accessible name.
- `FileDropzone` is keyboard-operable (`role="button"`, `tabIndex`, Enter/Space) with a `sr-only`, `tabIndex={-1}` native file input behind it.
- `CommandPalette` follows the ARIA combobox/listbox pattern (`role="combobox"`, `aria-expanded`, `aria-controls`, `role="listbox"`/`role="option"`), matching `Autocomplete` from Sprint 0.5.
- `ErrorBoundary`'s default fallback and `ApiErrorState` never surface raw error text to screen readers or sighted users — consistent with the existing `errorMessages.ts` policy.
