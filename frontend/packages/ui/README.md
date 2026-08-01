# @dbk/ui

Design-token-driven component library shared by every app in this monorepo.
Nothing in here should contain Product (or any other module's) domain
logic — components take generic props and let feature code supply the
copy, data, and business rules.

Tokens/theme live in `@dbk/config/tailwind`; components here consume them
via CSS variables and the color/spacing utility classes those tokens
generate — see `06-design-system.md` for the source of truth.

## Adding to this package

- New primitives/composed components go in the folder matching their
  category below, not in a catch-all `components/` directory.
- Every new component is exported from `src/index.ts`. If you add a file
  without exporting it, nothing outside this package can use it.
- Anything built on a Radix primitive follows the existing pattern:
  `React.forwardRef`, a `displayName`, and styling via `cn()` with token
  classes — not inline hex colors or magic pixel values.
- New Radix dependencies get added to `package.json` `dependencies` *and*
  `peerDependencies` isn't needed for Radix itself (only for `react`,
  `react-dom`, and `react-hook-form`, which apps must also have a copy of).

## Components

### Primitives
`Button` `Input` `PasswordInput` `Label` `Textarea` `Checkbox`
`RadioGroup` / `RadioGroupItem` / `RadioGroupItemRow` `Switch`
`Select` / `SelectTrigger` / `SelectContent` / `SelectItem`
`Badge` `Chip` `Card` (+ `CardHeader/Title/Description/Content/Footer`)
`Skeleton` `Avatar` `Separator` `FormField` `SearchInput` `Progress`

- **Chip vs. Badge**: Badge is a static, non-interactive status label
  (`AvailabilityStatusBadge` is the domain-specific example). Chip is an
  interactive, dismissible tag (e.g. an active filter pill) with an
  `onRemove` callback. Don't reach for one where the other fits — that's
  how the two quietly become duplicates of each other.
- **Divider**: use `Separator`, not a new component — it already does this.
- **Select vs. Autocomplete**: `Select` is for a short, known list (Radix
  Select under the hood). `Autocomplete` (under `forms/`) is for a list the
  user filters by typing. Neither wraps the other.

### Layout
`Container` `Section` `ResponsiveGrid`

`ResponsiveGrid`'s column classes are written out as full static string
literals per breakpoint (see the comment in `layout/ResponsiveGrid.tsx`) —
Tailwind's build-time scanner needs the complete class name to appear
literally in source, so don't refactor this into a template-literal
concatenation (`` `${prefix}grid-cols-${n}` ``) even though it looks
redundant; that silently stops generating CSS.

### Feedback
`Spinner` `EmptyState` `ErrorState` `NotFoundState` `Alert`
`AvailabilityStatusBadge` `Toaster` / `toast`

- **EmptyState vs. ErrorState vs. NotFoundState**: a legitimately-empty
  collection, a recoverable failure (with an optional retry action), and
  "the specific thing you asked for doesn't exist" are three different user
  situations with different expected reactions — kept as three components
  rather than one with a `variant` prop, so their copy/icon defaults can't
  drift into meaning the wrong thing for one of the three cases.

### Overlays
`Dialog` (+ subcomponents) `Sheet` (+ subcomponents)
`Drawer` (+ subcomponents — a thin preset of `Sheet` with `side="bottom"`
plus a grab handle, not a separate implementation)
`Popover` `TooltipProvider` / `Tooltip` `DropdownMenu` (+ subcomponents)
`ConfirmDialog`

- Mount `TooltipProvider` once near your app root (e.g. alongside
  `Toaster`), not per-tooltip.
- Tooltips are supplementary only — never the sole place a control's label
  or error text lives, since there's no reliable touch-device equivalent to
  hover.
- `ConfirmDialog` owns the modal shell + button wiring for any "are you
  sure?" flow (Delete Product, discarding a draft, etc.); pass
  `destructive` to get the danger-variant confirm button automatically.

### Disclosure
`Tabs` `Accordion` `Breadcrumb` `Pagination`

`Pagination` is for the numbered `PagedResponse` envelope (Admin/Creator
management tables). The buyer storefront's Product list uses cursor
pagination (`PaginatedResponse` + `useInfiniteQuery`) and its own
"Load more" affordance — that's an intentionally different UX for a
different data shape, not something this component also renders.

### Data
`Table` (+ `TableHeader/Body/Row/Head/Cell/Caption`) `DataTable`

`DataTable` is a deliberately dependency-free, column-defs-in/rows-out
table with built-in single-column sort, a loading skeleton state, and an
empty state. It is **not** `@tanstack/react-table` — that's the right
upgrade path if a future screen needs client-side multi-column sort, column
resizing, or virtualization, but this package doesn't take on that
dependency speculatively.

### Media
`Image` `ImagePlaceholder`

`Image` wraps `next/image`, requires `alt` (pass `alt=""` explicitly for
decorative images — it's never silently omitted), and falls back to
`ImagePlaceholder` on a missing or broken `src` instead of the browser's
default broken-image icon.

### Forms
`Autocomplete` `useZodForm`

- `Autocomplete` is a minimal combobox (Popover + Input + manual keyboard
  nav / ARIA combobox pattern) rather than `cmdk`. Right-sized for
  client-side-filterable short lists; revisit if a screen needs
  server-side fuzzy search over large datasets.
- `useZodForm(schema, options?)` collapses the
  `useForm({ resolver: zodResolver(schema) })` boilerplate already repeated
  in `LoginForm`/`SignupForm`. It is **not** a new Form/Context system —
  this platform's established pattern (`register("field")` passed into the
  existing `FormField`) stays exactly as-is. For Radix-based controls that
  don't support native `register()` (`Select`, `Switch`, `RadioGroup`), wire
  them up with react-hook-form's own `Controller`, same as you would in any
  RHF codebase — no extra wrapper is added here.

### Composed / Navigation
`ProductCard` `WishlistButton` `AnalyticsCard` (composed) — pre-existing,
owned by the Products module, unchanged in this sprint.
`Navbar` `BottomNav` `Footer` `Sidebar` (navigation) — pre-existing,
unchanged in this sprint.

## New dependencies added this sprint

`@radix-ui/react-select`, `@radix-ui/react-popover`,
`@radix-ui/react-tooltip`, `@radix-ui/react-accordion`,
`@radix-ui/react-progress`, `@radix-ui/react-radio-group`,
`@radix-ui/react-switch`, `react-hook-form`, `@hookform/resolvers`.
(`@radix-ui/react-dialog`, `-tabs`, and `-dropdown-menu` were already
present, added ahead of this sprint.)

## Sprint 0.75 — Shared Commerce Foundation

Full inventory and usage examples: `docs/frontend/shared-commerce-foundation.md`.
Zero new dependencies this sprint. New top-level folders: `hooks/`,
`upload/`, `search/`, `notifications/`. Extended (not duplicated):
`Sidebar` (optional icon-only collapse), `feedback/` (`ErrorBoundary`,
`ApiErrorState`, `NetworkErrorState`, `RetryButton`, `Shimmer`),
`layout/` (`AppShell`, `TopNav`, `UserMenu`, `NotificationsButton`,
`PageHeader`, `LoadingLayout`, `EmptyLayout`), `primitives/`
(`CountBadge`), `forms/` (`FormError`).
