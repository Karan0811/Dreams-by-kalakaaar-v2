# 06 · Design System — Dreams by Kalakaaar v2

**Document owner:** Design Systems Architecture
**Status:** Draft for review (baseline v1.0)
**Audience:** Design, Frontend Engineering, Product Management, QA, Future contributors
**Companion documents:** `00-project-vision.md`, `01-product-requirements.md`, `02-user-personas.md`, `03-user-journeys.md`, `04-information-architecture.md`, `05-design-principles.md`

---

# 1. Introduction

### 1.1 Purpose

This document defines the complete Design System of Dreams by Kalakaaar v2 — the concrete design language (tokens, color, typography, spacing, layout, iconography, motion, and component specifications) through which the philosophy defined in `05-design-principles.md` is expressed consistently across every screen.

Where `05-design-principles.md` explains *why* the product should feel a certain way, this document defines *the exact vocabulary* — values, scales, and component behavior — that makes that feeling reproducible by any designer or engineer, at any time, without guesswork.

### 1.2 Objectives

1. Define a complete, named set of design tokens covering color, typography, spacing, elevation, motion, and layout.
2. Define the full visual language — color system, typographic system, iconography, illustration, photography, and motion — in enough detail to be applied consistently without further interpretation.
3. Define every component's purpose, variants, and states at a specification level, without prescribing code or markup.
4. Establish accessibility and responsiveness as structural properties of every token and component, not optional add-ons.
5. Provide the Figma and naming conventions needed to keep design and engineering artifacts in permanent sync as the team grows.
6. Provide a Design QA checklist so every shipped screen can be verified against this system before release.

### 1.3 Scope

This document covers the complete design language: tokens, color, typography, spacing, layout, iconography, illustration, photography, motion, elevation, and the full component inventory (buttons, inputs, product/commerce/creator/admin components, navigation, feedback, overlays, data display), plus accessibility, responsive, dark mode, Figma organization, naming conventions, QA, and future evolution.

This document does **not** include code, CSS, Tailwind classes, component markup, or any framework-specific implementation. Every value defined here (a color, a spacing unit, a duration) is a **design decision**, expressed in design terms (hex values, rem/px scale, milliseconds) — translating those values into a specific technology is the responsibility of a subsequent frontend implementation guide.

### 1.4 Audience

Design (product designers, design systems contributors), Frontend Engineering, Product Management, QA, and future team members building or reviewing any UI on the platform.

### 1.5 Relationship with Previous Documents

| Document | Relationship |
|---|---|
| `00-project-vision.md` | Source of brand personality (Section 18) and product principles that this system's visual choices express. |
| `01-product-requirements.md` | Source of the functional modules that determine which components must exist. |
| `02-user-personas.md` | Source of the accessibility needs and tech-comfort range this system must design for by default. |
| `03-user-journeys.md` | Source of the emotional states that inform component tone (e.g., calm confirmation states vs. reassuring error states). |
| `04-information-architecture.md` | Source of the page/navigation structure that this system's layout and navigation components must support. |
| `05-design-principles.md` | Source of the *why* behind every value and rule defined in this document — this system is the direct, literal implementation of that philosophy. |

### 1.6 How to Use This Design System

- **Designers** use this document as the authoritative reference for every token, color, type style, spacing value, and component variant when building Figma files — no new token or component should be invented ad hoc without first checking (and, if genuinely missing, extending) this document.
- **Engineers** use this document as the specification for what a component must support (variants, states, accessibility behavior) independent of how it is technically built.
- **Product Managers and QA** use Sections 23–26 and 31 to verify that shipped work meets the defined bar before release.
- **Future contributors** should treat any deviation from this document as a deliberate, documented decision — never a silent drift.

---

# 2. Design Tokens

### 2.1 Token Philosophy

Design tokens are the smallest, named units of design decision — a color, a spacing value, a duration — that stand in for a raw value so that changing the token's definition in one place updates every use of it consistently. Tokens are organized in three tiers:

| Tier | Definition | Example |
|---|---|---|
| **Global (Reference) Tokens** | Raw, context-free values — the complete palette of available options. | `clay-500`, `space-400`, `radius-200` |
| **Alias (Semantic) Tokens** | Named for their *purpose*, mapped to a global token. | `color-action-primary` → `clay-500` |
| **Component Tokens** | Scoped to a specific component's specific property, mapped to an alias token. | `button-primary-background` → `color-action-primary` |

Design and engineering should always reference **semantic** or **component** tokens in practice, never global/reference tokens directly — this is what allows the entire visual system (e.g., a future dark mode or rebrand) to update without touching every individual screen.

### 2.2 Color Tokens (Overview)

Full palette defined in Section 3. Color tokens are organized into: Brand (Primary, Secondary, Accent), Neutral, Background/Surface, Border, Text, Semantic (Success/Warning/Error/Info), Disabled, and Overlay.

### 2.3 Typography Tokens (Overview)

Full scale defined in Section 4. Typography tokens combine: typeface family, weight, size, line-height, and letter-spacing into named text styles (e.g., `type-heading-lg`, `type-body-md`).

### 2.4 Spacing Tokens

Based on a **4pt base unit** (see Section 5.2 for full rationale), providing fine enough granularity for compact UI (forms, tables) while remaining simple to reason about.

| Token | Value | Typical Use |
|---|---|---|
| `space-025` | 2px | Hairline separation (icon-to-label gap) |
| `space-050` | 4px | Minimal internal padding |
| `space-100` | 8px | Tight component padding |
| `space-150` | 12px | Standard internal component spacing |
| `space-200` | 16px | Default spacing unit between related elements |
| `space-300` | 24px | Spacing between distinct component groups |
| `space-400` | 32px | Section-internal spacing |
| `space-600` | 48px | Spacing between major page sections |
| `space-800` | 64px | Large section separation (desktop) |
| `space-1200` | 96px | Hero/landing section separation (desktop only) |

### 2.5 Border Radius Tokens

| Token | Value | Typical Use |
|---|---|---|
| `radius-none` | 0px | Tables, full-bleed imagery |
| `radius-100` | 4px | Small controls (chips, tags) |
| `radius-200` | 8px | Inputs, buttons |
| `radius-300` | 12px | Cards |
| `radius-400` | 16px | Modals, larger containers |
| `radius-full` | 9999px | Avatars, pills, circular icon buttons |

*Rationale:* a consistently soft, moderate radius scale (never sharp, never overly rounded) reinforces the "warm but not decorative" visual philosophy from `05-design-principles.md` Section 5.10.

### 2.6 Elevation Tokens

See full detail in Section 11. Named `elevation-0` through `elevation-4`, each mapping to a defined shadow token and used to communicate a consistent z-axis hierarchy (resting, raised, overlay, modal, tooltip).

### 2.7 Shadow Tokens

| Token | Description | Used By |
|---|---|---|
| `shadow-none` | No shadow | Flat/resting elements |
| `shadow-sm` | Subtle, tight, low-opacity shadow | Cards at rest (optional, often unshadowed) |
| `shadow-md` | Moderate shadow with soft spread | Raised cards, dropdowns |
| `shadow-lg` | Pronounced shadow, larger blur radius | Modals, popovers |
| `shadow-xl` | Strongest shadow, reserved for top-most layers | Toasts, floating action elements |

### 2.8 Motion Tokens

See full detail in Section 10. Duration and easing tokens (`duration-fast`, `duration-standard`, `duration-slow`; `ease-standard`, `ease-emphasized`) are defined once and reused by every animated component.

### 2.9 Opacity Tokens

| Token | Value | Use |
|---|---|---|
| `opacity-disabled` | 40% | Disabled component state |
| `opacity-overlay` | 60% | Modal/dialog backdrop |
| `opacity-hover-scrim` | 8% | Subtle hover-state surface tint |
| `opacity-pressed-scrim` | 12% | Subtle pressed-state surface tint |

### 2.10 Blur Tokens

| Token | Value | Use |
|---|---|---|
| `blur-none` | 0px | Default |
| `blur-sm` | 8px | Backdrop blur behind modals (where supported) |
| `blur-md` | 16px | Reserved for future immersive/media-heavy contexts (e.g., image viewer backdrop) |

### 2.11 Z-Index Tokens

| Token | Layer | Value (relative order) |
|---|---|---|
| `z-base` | Default page content | 0 |
| `z-sticky` | Sticky headers/navigation | 100 |
| `z-dropdown` | Dropdowns, autocomplete menus | 200 |
| `z-overlay` | Drawer, bottom sheet | 300 |
| `z-modal` | Modal, dialog | 400 |
| `z-toast` | Toast/snackbar notifications | 500 |
| `z-tooltip` | Tooltip | 600 |

### 2.12 Sizing Tokens

| Token | Value | Use |
|---|---|---|
| `size-icon-sm` | 16px | Compact inline icons |
| `size-icon-md` | 20px | Default UI icon size |
| `size-icon-lg` | 24px | Navigation and emphasis icons |
| `size-touch-target-min` | 44px | Minimum interactive touch target (Section 26.8) |
| `size-avatar-sm` | 32px | Compact creator/user avatar |
| `size-avatar-md` | 48px | Standard avatar |
| `size-avatar-lg` | 96px | Profile/storefront header avatar |

### 2.13 Duration Tokens

| Token | Value | Use |
|---|---|---|
| `duration-instant` | 0ms | State changes that must feel immediate (e.g., pressed state) |
| `duration-fast` | 120ms | Micro-interactions (hover, toggle) |
| `duration-standard` | 200ms | Standard transitions (page element entrance, dropdown open) |
| `duration-slow` | 320ms | Larger, spatial transitions (modal open, drawer slide) |

### 2.14 Breakpoint Tokens

| Token | Value | Target |
|---|---|---|
| `breakpoint-xs` | 0–479px | Small mobile |
| `breakpoint-sm` | 480–767px | Standard mobile |
| `breakpoint-md` | 768–1023px | Tablet |
| `breakpoint-lg` | 1024–1439px | Laptop / small desktop |
| `breakpoint-xl` | 1440px+ | Desktop / large displays |

### 2.15 Naming Strategy

Tokens follow the pattern: `[category]-[property]-[variant/scale]`, e.g., `color-text-secondary`, `space-200`, `radius-300`. Semantic tokens follow `[category]-[role]-[state]`, e.g., `color-action-primary-hover`. This consistent, predictable naming allows any contributor to infer a token's purpose without consulting documentation for every single value.

### 2.16 Token Hierarchy

Global → Semantic → Component, as defined in Section 2.1. A component must never reference a Global token directly; this rule alone is what makes future rebranding, theming, or dark mode (Section 28) achievable without a component-by-component rewrite.

### 2.17 Future Extensibility

The token structure reserves room for: a dark-mode alias layer (Section 28), a future high-contrast theme alias layer (Section 3.16), and locale-specific typography tokens for future internationalization (Section 32) — all achievable by adding new alias-tier mappings without altering component-tier token names.

---

# 3. Color System

The palette is warm, earthy, and restrained — evoking natural materials (clay, wood, linen, ink) rather than a typical tech-brand palette of saturated blues and purples. All values below are the working baseline; final calibration happens in visual design review but should stay within this palette's character.

### 3.1 Brand Colors

| Token | Role | Illustrative Value | Notes |
|---|---|---|---|
| `color-brand-primary` | Primary brand/action color | `#B5502E` (warm terracotta/clay) | Used for primary actions, key brand moments; evokes fired clay and craft materials |
| `color-brand-primary-hover` | Primary hover state | `#9C4326` | Slightly deepened |
| `color-brand-primary-active` | Primary pressed state | `#87391F` | Further deepened |
| `color-brand-secondary` | Secondary brand color | `#4B5A45` (muted sage/olive) | Used sparingly for secondary emphasis, complements primary warmly |
| `color-brand-accent` | Tertiary accent | `#C99A4B` (warm ochre/gold) | Reserved for rare, high-value moments (verification badge, milestone celebration) — never for routine UI |

### 3.2 Neutral Colors

| Token | Illustrative Value | Notes |
|---|---|---|
| `color-neutral-000` | `#FFFFFF` | Pure white, used sparingly (elevated surfaces on light theme) |
| `color-neutral-050` | `#FAF7F3` | Warm off-white — primary background, avoids sterile pure white |
| `color-neutral-100` | `#F0EAE2` | Subtle surface tint |
| `color-neutral-200` | `#E2D9CC` | Borders, dividers |
| `color-neutral-400` | `#B4A996` | Muted/placeholder text, disabled borders |
| `color-neutral-600` | `#7C7267` | Secondary text |
| `color-neutral-800` | `#453F38` | Primary text (not pure black — softer, warmer) |
| `color-neutral-900` | `#28241F` | Highest-emphasis text, headlines |

### 3.3 Background & Surface

| Token | Role | Maps To |
|---|---|---|
| `color-background-default` | Page background | `color-neutral-050` |
| `color-background-subtle` | Section/zone differentiation | `color-neutral-100` |
| `color-surface-default` | Card/component surface | `color-neutral-000` |
| `color-surface-raised` | Elevated surface (modal, popover) | `color-neutral-000` (with elevation shadow, Section 11) |

### 3.4 Border

| Token | Role | Maps To |
|---|---|---|
| `color-border-default` | Standard dividers, input borders | `color-neutral-200` |
| `color-border-strong` | Emphasis borders (focused input container) | `color-neutral-400` |
| `color-border-focus` | Focus ring | `color-brand-primary` |

### 3.5 Text

| Token | Role | Maps To |
|---|---|---|
| `color-text-primary` | Primary reading text | `color-neutral-800` |
| `color-text-secondary` | Supporting/secondary text | `color-neutral-600` |
| `color-text-placeholder` | Placeholder/hint text | `color-neutral-400` |
| `color-text-on-brand` | Text on brand-colored surfaces | `color-neutral-000` |
| `color-text-link` | Hyperlink text | `color-brand-primary` |

### 3.6 Semantic Colors

| Token | Role | Illustrative Value |
|---|---|---|
| `color-success` | Positive/confirmation states | `#4B7A51` (muted forest green) |
| `color-success-background` | Success surface tint | `#EAF3EA` |
| `color-warning` | Caution states | `#B8792E` (warm amber) |
| `color-warning-background` | Warning surface tint | `#FBF0DF` |
| `color-error` | Error/destructive states | `#A33B2E` (muted brick red) |
| `color-error-background` | Error surface tint | `#F8E9E6` |
| `color-info` | Neutral informational states | `#3E6E8E` (muted slate blue) |
| `color-info-background` | Info surface tint | `#E9F1F5` |

*Rationale:* semantic colors are deliberately muted rather than saturated "alarm" colors — consistent with the Calm Interfaces philosophy (`05-design-principles.md` Section 2.12), even an error state should feel serious, not alarming.

### 3.7 Disabled

| Token | Role | Value |
|---|---|---|
| `color-disabled-background` | Disabled component fill | `color-neutral-100` |
| `color-disabled-text` | Disabled text | `color-neutral-400` |
| `color-disabled-border` | Disabled border | `color-neutral-200` |

### 3.8 Overlay

| Token | Role | Value |
|---|---|---|
| `color-overlay-scrim` | Modal/drawer backdrop | `color-neutral-900` at `opacity-overlay` (60%) |

### 3.9–3.10 Dark Mode & High Contrast Strategy

Dark mode is a future (post-v2) capability per `05-design-principles.md` Section 18; the token architecture (Section 2.1) reserves an alias-tier remapping specifically so dark mode can be added by redefining semantic tokens (e.g., `color-background-default` → a dark neutral) without touching component-tier tokens or component logic. Full detail in Section 28.

A high-contrast alias theme is similarly reserved as a future accessibility enhancement, remapping text/border tokens to higher-contrast neutral values without a structural rebuild.

### 3.11 Color Accessibility

All text/background token pairings defined above are selected to meet or exceed WCAG 2.2 AA contrast ratios (4.5:1 for standard text, 3:1 for large text and UI components) at their intended use. Any new color pairing proposed in the future must be verified against this standard before adoption — this is a non-negotiable gate per `05-design-principles.md` Section 9.4.

### 3.12–3.13 Color Usage Rules — Do

- Use `color-brand-primary` for the single primary action on a screen; do not apply it to multiple competing elements.
- Use semantic colors (success/warning/error/info) only for their defined meaning — never repurpose `color-error` for decorative emphasis.
- Pair every semantic color with a corresponding icon or text label, never color alone (per `05-design-principles.md` Section 9.4).
- Use neutral tones for the vast majority of the interface; brand and semantic color should each appear sparingly and purposefully.

### 3.14 Color Usage Rules — Don't

- Do not introduce new colors outside this palette without a documented design system update.
- Do not use `color-brand-accent` (ochre/gold) for routine UI — it is reserved for rare, high-significance moments only (Section 3.1).
- Do not use saturated, high-alarm red/green tones that would contradict the Calm Interfaces philosophy.
- Do not rely on color alone to communicate any state (availability, validation, status).

---

# 4. Typography System

### 4.1 Font Philosophy

Typography should feel warm, editorial, and highly legible — closer to a well-set print publication than a typical SaaS interface. Two typeface roles are defined: a **display/editorial serif** for storytelling and brand moments, and a **humanist sans** for interface and functional text, reflecting the balance of "Craft" (serif, editorial) and "Clarity" (sans, functional) from `05-design-principles.md` Sections 2.1, 5.3.

### 4.2 Typeface Roles

| Role | Token | Character | Used For |
|---|---|---|---|
| **Primary (Display/Editorial)** | `font-family-serif` | A warm, moderate-contrast humanist serif (e.g., in the character of Tiempos/Canela-style editorial serifs) | Homepage hero, Collection/Occasion page headlines, Creator storytelling content, marketing |
| **Secondary (Interface)** | `font-family-sans` | A clean, highly legible humanist sans-serif (e.g., in the character of Inter/Söhne-style UI sans) | All UI text — navigation, buttons, forms, body copy, dashboards |
| **Fallback Stack** | `font-family-fallback` | System-default serif/sans-serif fallbacks matched to each role | Ensures graceful degradation if a custom font fails to load |

*Numeric Typography:* all numeric content (prices, order totals, analytics figures) uses `font-family-sans` with **tabular figures** (fixed-width numerals) so that numbers in tables and lists align vertically for easy scanning/comparison.

### 4.3 Type Scale

| Token | Role | Size / Line Height (approx.) | Typeface |
|---|---|---|---|
| `type-display-lg` | Hero headline | 48px / 56px | Serif |
| `type-display-md` | Section/Collection headline | 36px / 44px | Serif |
| `type-heading-lg` | Page title | 28px / 36px | Serif |
| `type-heading-md` | Section heading | 22px / 30px | Serif or Sans (context-dependent) |
| `type-heading-sm` | Sub-section heading | 18px / 26px | Sans (semibold) |
| `type-title-md` | Card/product title | 16px / 24px | Sans (medium) |
| `type-body-lg` | Emphasized body text | 16px / 24px | Sans (regular) |
| `type-body-md` | Default body text | 14px / 22px | Sans (regular) |
| `type-body-sm` | Secondary/supporting text | 13px / 20px | Sans (regular) |
| `type-caption` | Captions, metadata, timestamps | 12px / 16px | Sans (regular) |
| `type-label` | Form labels, small UI labels | 13px / 18px | Sans (medium) |
| `type-button` | Button text | 14–16px / 20–24px (size-dependent) | Sans (semibold) |

### 4.4 Line Heights

Line heights are set generously (roughly 1.4–1.5× font size for body text) to preserve legibility and the calm, spacious feel established in `05-design-principles.md` Section 5.2 — tight line-heights are avoided even in compact UI contexts, since cramped text undermines the premium, readable character of the brand.

### 4.5 Letter Spacing

- Body and heading text uses default (0) letter spacing at the serif/sans's natural metrics.
- All-caps labels (rare, used sparingly for small metadata labels like "NEW" or category eyebrows) use a modest positive letter-spacing (~0.04em) to preserve legibility at small caps sizes.

### 4.6 Responsive Typography

Type scale reduces modestly at smaller breakpoints (e.g., `type-display-lg` may step down one level on mobile) to preserve proportional hierarchy without requiring horizontal scrolling or awkward wrapping; the *relative* hierarchy between scale steps is preserved at every breakpoint (per `05-design-principles.md` Section 16, Content Priority).

### 4.7 Accessibility

- All type scale steps meet minimum legible size (no body text below 13px).
- Line length is constrained (via layout, Section 6) to a comfortable reading measure (roughly 60–80 characters) for long-form content like creator stories and legal text.
- Text must remain legible and layout must not break under 200% browser zoom (per `05-design-principles.md` Section 9.5).

### 4.8 Typography Rules

- Never use more than three type scale steps on a single screen region to maintain hierarchy clarity.
- Headings always use the defined scale steps — never an arbitrary custom size "just for this screen."
- Serif is reserved for editorial/storytelling contexts; it is never used for functional UI text (buttons, form labels, table data), which always uses the Sans role for maximum legibility and neutrality.

---

# 5. Spacing System

### 5.1 Spacing Philosophy
Spacing is treated as an active design tool (per `05-design-principles.md` Section 5.2), not a leftover. Generous, consistent spacing is a primary mechanism for achieving the platform's calm, premium feel — spacing decisions should always be made by referencing the token scale (Section 2.4), never an arbitrary pixel value.

### 5.2 4pt vs. 8pt Grid
The system uses a **4pt base unit** rather than a strict 8pt grid, because commerce-dense contexts (product cards, tables, dashboards) frequently require finer intermediate values (e.g., 12px, 20px) than an 8pt-only grid comfortably provides. All spacing tokens (Section 2.4) remain multiples of 4, preserving grid discipline while allowing necessary granularity.

### 5.3 Margins
Page-level margins scale by breakpoint: 16px on mobile (`space-200`), 24px on tablet (`space-300`), and 48–64px on desktop (`space-600`–`space-800`), ensuring content never feels cramped against the viewport edge at any size.

### 5.4 Padding
Component-internal padding follows the token scale consistently by component density: compact components (chips, tags) use `space-100`; standard components (buttons, inputs, cards) use `space-150`–`space-200`; spacious components (modals, feature panels) use `space-300`–`space-400`.

### 5.5 Section Spacing
Vertical spacing between major page sections (e.g., between a Product page's imagery block and its description block) uses `space-400`–`space-600`, giving each section room to breathe and be visually distinct without a hard divider line in most cases.

### 5.6 Card Spacing
Internal card padding uses `space-200`; spacing between cards in a grid uses `space-200`–`space-300` depending on breakpoint, ensuring a consistent, comfortable rhythm across Product, Creator, and Order card grids alike.

### 5.7 Form Spacing
Vertical spacing between form fields uses `space-200`; spacing between a label and its input uses `space-050`–`space-100`; spacing between grouped/related fields (e.g., city/state/postal code) is tighter (`space-150`) than spacing between unrelated field groups (`space-300`), visually reinforcing logical grouping.

### 5.8 Table Spacing
Table cell padding uses `space-100`–`space-150` to preserve scannability at higher information density (per `05-design-principles.md` Section 5.14), noticeably tighter than card or form spacing, appropriate to Admin/internal contexts where density is a feature, not a flaw.

### 5.9 Dashboard Spacing
Dashboard widget spacing uses `space-300` between widgets and `space-200` internal widget padding, balancing information density with the calm, uncluttered feel expected even in operational contexts (per `05-design-principles.md` Section 4.11).

### 5.10 Responsive Spacing
Spacing tokens step down proportionally at smaller breakpoints (e.g., a `space-600` section gap on desktop may reduce to `space-400` on mobile) while preserving the same *relative* rhythm — spacing never collapses to zero or becomes visually cramped even at the smallest supported viewport.

---

# 6. Layout System

### 6.1 Grid System
A **12-column fluid grid** is used at `lg`/`xl` breakpoints, collapsing to **8 columns** at `md` (tablet) and a **4-column** (effectively single-column-dominant) grid at `xs`/`sm` (mobile), consistent with the Mobile First principle (`05-design-principles.md` Section 8).

### 6.2 Columns
Gutters between columns use `space-200` (mobile) to `space-300` (desktop). Content components (product cards, form fields) align strictly to the column grid; arbitrary, off-grid positioning is not permitted.

### 6.3 Container Widths

| Breakpoint | Container Max Width |
|---|---|
| `xs`/`sm` (mobile) | 100% (fluid, with `space-200` margins) |
| `md` (tablet) | 100% (fluid, with `space-300` margins) |
| `lg` (laptop) | 1120px |
| `xl` (desktop) | 1280px, with additional whitespace beyond this used as margin, never stretched content (per `05-design-principles.md` Section 5.20 desktop rule) |

### 6.4 Responsive Breakpoints
See Section 2.14 for the full token definition (`breakpoint-xs` through `breakpoint-xl`).

### 6.5 Content Width
Long-form text content (creator stories, legal pages, article-style content) is constrained to a comfortable reading measure (~640–720px) even within a wider page container, per the typographic accessibility guidance in Section 4.7.

### 6.6 Max Width
No content container exceeds `xl` container width (1280px); on ultra-wide displays, additional space becomes margin rather than stretched layout.

### 6.7 Sidebars
Dashboard contexts (Creator, Admin) use a persistent left sidebar at `lg`/`xl` breakpoints (fixed width, ~240–280px), collapsing to a drawer/off-canvas pattern at `md` and below, consistent with `04-information-architecture.md` Section 4.7–4.9.

### 6.8 Headers
The global buyer-facing header is persistent and fixed-position at all breakpoints, containing logo, search entry, and account/cart/wishlist icons (per `04-information-architecture.md` Section 4.1); dashboard headers are lighter-weight, showing context (current section) and a persistent account/context-switch control.

### 6.9 Footers
The buyer-facing footer (per `04-information-architecture.md` Section 4.4) is a full-width, multi-column layout on desktop, collapsing to stacked, accordion-grouped sections on mobile to manage length.

### 6.10 Dashboard Layout
Standard pattern: persistent sidebar navigation (Section 6.7) + a content area using the same 12-column grid, with widgets/cards arranged per Section 5.9 spacing rules.

### 6.11 Creator Layout
Mirrors the general Dashboard Layout, with a Creator-specific sidebar structure (per `04-information-architecture.md` Section 6) and a persistent "Pending Actions" summary region at the top of the Dashboard Overview page.

### 6.12 Admin Layout
Mirrors the general Dashboard Layout, favoring denser table-based content areas (Section 5.8) appropriate to high-volume operational review tasks.

### 6.13 Authentication Layout
A focused, centered single-column layout (max-width ~400–480px) with minimal surrounding navigation, reflecting the Focus principle (`05-design-principles.md` Section 3) — sign-in/sign-up should not compete visually with global navigation.

### 6.14 Checkout Layout
A two-column layout on `lg`/`xl` (form flow on the left, persistent order summary on the right), collapsing to a single-column, linear flow on mobile/tablet with the order summary presented as a collapsible section above the primary action — consistent with `04-information-architecture.md` Section 13's decision to omit breadcrumbs/lateral navigation during Checkout.

---

# 7. Iconography

### 7.1 Icon Philosophy
Icons are simple, warm, and immediately legible — supporting text, never replacing it (per `05-design-principles.md` Section 5.15). The icon set favors gently rounded terminals consistent with the border-radius philosophy (Section 2.5) over sharp, geometric, tech-style iconography.

### 7.2 Size Rules
Icons use the sizing tokens defined in Section 2.12: `size-icon-sm` (16px) for inline/dense contexts, `size-icon-md` (20px) as the default UI size, `size-icon-lg` (24px) for navigation and higher-emphasis contexts. Icons are never sized arbitrarily outside this scale.

### 7.3 Stroke Rules
A consistent stroke weight (~1.5–1.75px at default size) is used across the entire icon set; stroke weight scales proportionally at larger icon sizes to maintain consistent visual density.

### 7.4 Filled vs. Outline
**Outline** style is the default across the platform, reinforcing a light, restrained visual weight. **Filled** icon variants are reserved for indicating an active/selected state (e.g., a filled heart for an already-wishlisted item, filled bottom-navigation icon for the active tab) — the fill itself becomes a meaningful state signal, not a stylistic choice made per-screen.

### 7.5 Navigation Icons
Navigation icons (bottom navigation, sidebar) always pair with a text label at rest, since icon-only navigation fails both the Clarity and Accessibility principles (`05-design-principles.md` Sections 3, 9) — the only exception is space-constrained bottom navigation, where labels remain but may abbreviate.

### 7.6 Action Icons
Action icons (edit, delete, share, message) always pair with a visible text label or an accessible tooltip/label at minimum, per Section 7.5's reasoning.

### 7.7 Status Icons
Status icons (verified badge, order state indicators) always pair with color *and* shape/form distinction, never relying on color alone (per Section 3.14, Section 26).

### 7.8 Marketplace Icons
A small set of marketplace-specific icons (handmade disclosure mark, made-to-order clock, verified maker badge) are treated as distinct, higher-emphasis trust symbols — visually distinguished from the general UI icon set to stand out as meaningful signals, consistent with `05-design-principles.md` Section 5.18.

### 7.9 Accessibility
Every icon used as an interactive control has an accessible text label exposed to assistive technology, even when no visible text label is present; purely decorative icons are marked as such so they are not announced.

---

# 8. Illustration System

### 8.1 Illustration Style
Illustrations use warm, hand-drawn-feeling linework with a restrained, brand-consistent color palette drawn from Section 3 — never generic corporate clip-art or overly literal stock-illustration styles.

### 8.2 Brand Personality
Illustration should feel like it was made by the same hand that would design the rest of the product — warm, human, a little textured — reinforcing the "Craft over Commerce" philosophy even in purely functional interface moments.

### 8.3 Empty States
Illustrations for empty states (per `05-design-principles.md` Section 13) are simple, warm, and specific to context — never a single generic "empty box" illustration reused everywhere regardless of meaning.

### 8.4 Onboarding
Onboarding illustrations (Creator application, first-time dashboard views) should feel encouraging and orienting, avoiding anything that could read as intimidating or overly corporate given the emotional vulnerability of new creators (`02-user-personas.md` Section 4.4–4.5).

### 8.5 Marketing
Marketing illustration (campaign pages, occasion pages) may take slightly more expressive liberty than functional-UI illustration, but must remain within the same core style and palette to preserve brand coherence.

### 8.6 Error States
Error-state illustration should be calm and reassuring, never alarming or comedic in a way that trivializes a genuine problem (e.g., a payment failure) — tone must match the emotional stakes defined per error type in `05-design-principles.md` Section 14.

### 8.7 Support
Support/Help Center illustration should feel approachable and human, reinforcing that a real, competent person is available to help.

### 8.8 Creator
Creator-facing illustration (onboarding, dashboard zero-states) should specifically avoid generic "startup dashboard" visual tropes, instead reflecting craft and materiality consistent with the platform's core identity.

### 8.9 Consistency Rules
All illustration shares a single consistent line weight, color palette (drawn only from Section 3 tokens), and level of detail; no illustration should be sourced from a stylistically mismatched external library.

---

# 9. Photography Guidelines

Photography is the platform's single most important trust signal (per `05-design-principles.md` Section 5.17) and receives correspondingly rigorous guidelines.

### 9.1 Product Photography
- Shot against clean, minimally styled backgrounds (Section 9.4) that let the product's material and craftsmanship read clearly.
- Includes at least one true-to-color, well-lit primary image per listing, supplemented by detail/texture and in-context/scale-reference images where possible.
- Never digitally altered in a way that misrepresents color, scale, or material — authenticity of representation is a trust requirement, not just an aesthetic one (per `01-product-requirements.md` PDP-03).

### 9.2 Creator Photography
- Creator portraits and workshop/process imagery should feel authentic and unposed rather than corporate headshot-style, reinforcing the "Human before Transaction" philosophy.
- Process photography (hands at work, materials, workspace) is strongly encouraged as it directly reinforces the handmade authenticity promise.

### 9.3 Lifestyle Images
- Used to show products in real, plausible contexts (a piece of décor in a styled room) to aid buyer decision-making, always supplementary to — never a replacement for — accurate primary product photography.

### 9.4 Background Rules
- Product photography defaults to neutral, warm-toned backgrounds (drawing from the neutral palette in Section 3.2) — never pure clinical white or busy, distracting backgrounds that compete with the product.

### 9.5 Lighting
- Soft, natural-feeling lighting is preferred over harsh studio lighting or artificial-looking flash, consistent with the warm, human brand character.

### 9.6 Composition
- Generous negative space around the subject, consistent with the platform's whitespace philosophy (Section 5.1); products should not be cropped so tightly that context or scale is lost.

### 9.7 Editing Rules
- Minimal color correction for true-to-life accuracy is expected; heavy filtering, artificial saturation boosts, or retouching that alters the actual appearance of the product is prohibited.

### 9.8 Do
- Show texture, material, and true color accurately.
- Include scale reference where size might be ambiguous.
- Maintain consistent quality bar across a single creator's full catalog.

### 9.9 Don't
- Do not use stock photography for actual product listings.
- Do not heavily filter or stage images in a way that could mislead a buyer's expectations.
- Do not mix drastically inconsistent photography quality within a single storefront without guidance/support offered to the creator (a platform quality-support opportunity, not just a rule).

---

# 10. Motion System

### 10.1 Motion Philosophy
Motion clarifies, never decorates (per `05-design-principles.md` Section 6.6) — every animation should have an identifiable functional purpose: showing spatial relationships, confirming an action, or guiding attention to a change.

### 10.2 Animation Timing / Durations
Uses the duration tokens defined in Section 2.13: `duration-fast` (120ms) for micro-interactions, `duration-standard` (200ms) for standard UI transitions, `duration-slow` (320ms) for larger spatial transitions (modal, drawer). No animation exceeds ~400ms, keeping the interface feeling responsive rather than sluggish.

### 10.3 Easing

| Token | Curve Character | Use |
|---|---|---|
| `ease-standard` | Gentle ease-in-out | Default for most transitions (opacity, position) |
| `ease-emphasized` | Slightly more pronounced deceleration | Larger, spatially significant transitions (modal/drawer entrance) |
| `ease-exit` | Slightly accelerated | Exit transitions, so dismissal feels quick and doesn't linger |

### 10.4 Transitions
Element transitions (e.g., a product card expanding into a detail view) preserve spatial continuity where feasible — the destination should feel like it grew from its origin, not appeared unrelated, per `05-design-principles.md` Section 6.5.

### 10.5 Micro-interactions
Small state confirmations (adding to cart, toggling a wishlist heart) use `duration-fast` with a subtle scale or color transition — noticeable but not attention-hijacking.

### 10.6 Loading
Loading states use a gentle, continuous motion (skeleton shimmer or subtle pulsing) rather than a spinning indicator wherever a skeleton pattern is feasible (per `05-design-principles.md` Section 15).

### 10.7 Success
Success confirmations use a brief, warm, non-gimmicky motion (e.g., a checkmark drawing in) at `duration-standard`, proportional to the significance of the action per `05-design-principles.md` Section 6.8 (a completed order deserves more presence than a minor toggle).

### 10.8 Error
Error-state motion (e.g., a form field shake) is used sparingly and subtly — enough to draw attention to the specific error without feeling punitive or jarring.

### 10.9 Reduced Motion
Every motion defined in this system has a defined reduced-motion equivalent (typically an instant or fade-only transition), automatically applied when a user's reduced-motion preference is detected, per `05-design-principles.md` Section 6.16.

---

# 11. Elevation System

Elevation communicates a consistent z-axis hierarchy, always paired with the z-index tokens (Section 2.11) and shadow tokens (Section 2.7).

| Elevation Token | Shadow | Z-Index | Used By |
|---|---|---|---|
| `elevation-0` | `shadow-none` | `z-base` | Page background, resting cards (flat design default) |
| `elevation-1` | `shadow-sm` | `z-base` (with slight visual lift) | Cards on hover, sticky sub-navigation |
| `elevation-2` | `shadow-md` | `z-dropdown` | Dropdowns, autocomplete menus, popovers |
| `elevation-3` | `shadow-lg` | `z-overlay` / `z-modal` | Drawers, bottom sheets, modals, dialogs |
| `elevation-4` | `shadow-xl` | `z-toast` / `z-tooltip` | Toasts, tooltips, floating action elements |

**Sticky elements** (e.g., a sticky checkout summary or sticky table header) use `elevation-1` to visually separate from scrolling content beneath them. **Floating buttons** (rare, used only where a persistent primary action genuinely warrants it) use `elevation-2`–`elevation-3` depending on context, always the highest elevation appropriate to signal they float above standard content.

---

# 12. Component Principles

### 12.1 Component Philosophy
Every component exists to solve a real, recurring interface problem identified across `01-product-requirements.md` and `03-user-journeys.md` — components are never created speculatively. Each component specification in Sections 13–22 defines purpose, variants, and states, deliberately without prescribing markup or code.

### 12.2 Composition
Complex UI patterns (e.g., a Product Card containing an image, badge, title, price, and rating) are built by composing smaller, independently defined components (image, badge, text style, rating) rather than being defined as a single monolithic, non-reusable unit.

### 12.3 Reusability
A component defined for one context (e.g., a Card) should be reusable across Buyer, Creator, and Admin contexts wherever the underlying content pattern is genuinely equivalent, with variants (Section 12.7) handling legitimate contextual differences.

### 12.4 Accessibility
Every component specification includes its accessibility requirements (keyboard behavior, focus handling, ARIA role expectations at a conceptual level) as a first-class part of its definition, not an appendix.

### 12.5 Responsiveness
Every component must be specified with its behavior across breakpoints (Section 2.14) — components that only make sense at one screen size are flagged as needing a distinct responsive variant, not silently left broken.

### 12.6 States
Every interactive component defines its full state set at minimum: default, hover, focus, pressed/active, disabled, and loading (where applicable) and error (where applicable), consistent with `05-design-principles.md` Section 6.

### 12.7 Variants
Variants represent legitimate, named differences in a component's appearance or behavior for different contexts (e.g., Button: Primary/Secondary/Tertiary) — variants are never created for purely cosmetic, one-off reasons.

### 12.8 Naming
Component names describe what the component *is*, not where it's used (e.g., "Card" not "HomepageBox"), so the same component can be confidently reused across unrelated contexts. Full naming convention in Section 30.

### 12.9 Extensibility
Every component is specified with room for future variants (e.g., a future AI-suggested product badge) without requiring a redefinition of the component's core structure.

---

# 13. Buttons

| Variant | Purpose | Visual Weight | Typical Use |
|---|---|---|---|
| **Primary** | The single most important action on a screen | Highest (filled, `color-brand-primary`) | "Add to Cart," "Confirm Order," "Publish Listing" |
| **Secondary** | An important but non-primary action | Medium (outlined, `color-border-strong`) | "Save for Later," "Edit," "View Details" |
| **Tertiary** | A lower-emphasis supporting action | Low (text-only with subtle background on interaction) | "Skip," "Learn More" |
| **Ghost** | Minimal-emphasis action, often on media/imagery | Lowest (transparent background, visible border only on interaction) | Actions overlaid on product imagery |
| **Text** | Inline, link-like action | Minimal (text + underline on hover) | "View all," inline navigation-style actions |
| **Danger** | Destructive or high-consequence actions | High but using `color-error` instead of brand primary | "Delete Listing," "Cancel Order," "Suspend Account" |
| **Success** | Rare, used for explicit positive-confirmation actions distinct from routine primary actions | Uses `color-success` | "Approve Creator," "Mark Resolved" (internal contexts) |

### 13.1 States
Every button variant defines: Default, Hover, Focus (visible focus ring using `color-border-focus`), Pressed, Disabled (`opacity-disabled`), and Loading (spinner replacing label, button remains same size to prevent layout shift).

### 13.2 Sizes

| Token | Height | Use |
|---|---|---|
| `button-size-sm` | 32px | Compact contexts (table row actions, dense dashboards) |
| `button-size-md` | 40px | Default size across most of the platform |
| `button-size-lg` | 48px | Primary conversion actions (Add to Cart, Confirm Order) |

### 13.3 Icons
Buttons may include a leading or trailing icon (`size-icon-md`) alongside a text label; icon-only buttons are permitted only for well-established, universally recognized actions (e.g., a close "X") and always carry an accessible label.

### 13.4 Accessibility
All buttons meet minimum touch target size (`size-touch-target-min`, 44px, achieved via padding even where visual height is smaller), have a visible focus state, and expose their disabled/loading state to assistive technology.

### 13.5 Usage Rules
- Exactly one Primary button per screen/section at a time — never two competing primary actions.
- Danger buttons always require a confirmation step (Section 18.7) before executing an irreversible action.
- Button labels always describe the specific action and outcome (per `05-design-principles.md` Section 12.4) — never generic labels like "Submit" alone.

---

# 14. Inputs

| Input Type | Purpose | Key Behavior Notes |
|---|---|---|
| **Text** | Single-line general input | Persistent visible label (never placeholder-only, per `05-design-principles.md` Section 11.2) |
| **Textarea** | Multi-line input (e.g., customization instructions, review text) | Auto-expands with content up to a defined max height, then scrolls |
| **Password** | Credential input | Includes show/hide toggle; communicates requirements upfront (Section 11.10 of `05-design-principles.md`) |
| **Search** | Query input | Includes a search icon, clear/reset action, and connects to suggestion/autocomplete behavior (Section 16.9) |
| **Phone** | Phone number input | Uses numeric input mode; supports country code selection where relevant |
| **Email** | Email input | Uses email input mode/keyboard on mobile; validated on blur, not per keystroke |
| **OTP** | One-time code entry | Segmented single-digit fields with auto-advance; supports paste of a full code |
| **Select** | Single choice from a defined list | Opens a dropdown (Section 18.6) or, on mobile, a native-feeling full-screen/sheet picker |
| **Multi-Select** | Multiple choices from a defined list | Displays selections as removable chips (Section 17.12) within or below the control |
| **Autocomplete** | Text input with dynamic suggestions | Used for search and address entry; suggestions appear in a dropdown (Section 18.6) below the field |
| **Date Picker** | Date selection | Calendar overlay on desktop; native-feeling picker pattern on mobile |
| **Time Picker** | Time selection (where relevant, e.g., support scheduling) | Simple scrollable or segmented selector |
| **Address** | Structured address entry | Supports autocomplete (Section 11.11 of `05-design-principles.md`); accommodates regional format variation |
| **Color Picker** | Rare, reserved for internal/CMS contexts (e.g., campaign theming) | Not used in core buyer/creator/product flows |
| **Upload** | File/image upload (product images, customization reference images) | Drag-and-drop with a clear, accessible click-to-browse alternative (per `05-design-principles.md` Section 6.11); shows upload progress and clear error states for invalid files |
| **Rich Text** | Formatted text entry (e.g., creator story) | A constrained, simple formatting toolset (bold, italic, line breaks) — never a full word-processor-level toolbar, to preserve simplicity |

### 14.1 Validation, Errors, Success
- Validation occurs on field blur or form submission, never on every keystroke (per `05-design-principles.md` Section 11.3).
- Error state: `color-error` border, an adjacent icon, and specific inline message text explaining the fix.
- Success state (where relevant, e.g., a verified/available field): `color-success` border and icon, used sparingly to avoid visual noise.

### 14.2 Disabled and Read-Only
- **Disabled** fields use `color-disabled-*` tokens and cannot receive focus.
- **Read-only** fields remain focusable/selectable (for copying values) but are visually distinguished from editable fields via a subtle background tint, without the full disabled-opacity treatment.

---

# 15. Product Components

| Component | Purpose | Key Content | States/Variants |
|---|---|---|---|
| **Product Card** | Represent a listing in a grid/list context | Primary image, title, creator name, price, availability badge, rating summary | Default, Sold Out (dimmed image + badge), Wishlisted (filled heart icon) |
| **Creator Card** | Represent a creator in search/discovery contexts | Avatar, name, verification badge, short tagline, rating | Default, Unverified (not shown publicly per `04-information-architecture.md` Section 16) |
| **Review Card** | Display a single buyer review | Rating, reviewer name (or initials), verified-purchase indicator, review text, optional creator response | Default, With Creator Response |
| **Order Card** | Summarize an order/sub-order in list contexts | Item thumbnail(s), creator name, status badge, total, date | Variant per order state (Section 8.2 of `01-product-requirements.md`) |
| **Collection Card** | Represent a curated collection | Cover image, collection title, short description | Default, Featured (larger size on Home) |
| **Category Card** | Represent a category in browse contexts | Representative image, category name | Default |
| **Recommendation Card** | Present a related/similar product suggestion | Same structure as Product Card, in a horizontally scrollable row | Default |
| **Gift Card** *(gifting UI element, not a monetary gift card product)* | Represent the gift-note/packaging selection at checkout | Icon, short label, expandable note field | Collapsed, Expanded |
| **Coupon Card** | Represent an available/applied coupon | Code, discount description, eligibility note, expiry | Available, Applied, Expired/Ineligible |
| **Analytics Card** | Summarize a single performance metric (Creator/Admin dashboards) | Metric label, value, trend indicator (up/down, muted color use per Section 3.6) | Default, Zero-state (new creator, no data yet) |

---

# 16. Navigation Components

| Component | Purpose | Key Behavior |
|---|---|---|
| **Navbar** | Persistent global buyer-facing header | Fixed position; contains logo, search, category entry, account/cart/wishlist icons (per `04-information-architecture.md` Section 4.1) |
| **Sidebar** | Persistent dashboard navigation (Creator/Admin) | Collapsible at `md` and below into a drawer pattern (Section 6.7) |
| **Bottom Navigation** | Primary mobile navigation | Five-item fixed bar (Home, Search, Wishlist, Cart, Account); active item uses filled icon variant (Section 7.4) |
| **Drawer** | Secondary mobile navigation / off-canvas panel | Slide-in from the left (navigation) or right (contextual panels/filters); dismissible via scrim tap or explicit close |
| **Tabs** | Switch between related views within the same context | Underline-style active indicator; always keyboard-navigable via arrow keys |
| **Breadcrumbs** | Show hierarchical position (per `04-information-architecture.md` Section 13) | Truncates gracefully on narrow viewports (e.g., collapsing middle segments) |
| **Pagination** | Navigate multi-page result/list sets | Numbered pagination on desktop; "Load more" or infinite scroll pattern preferred on mobile (Section 25.4) |
| **Stepper** | Show progress through a linear multi-step flow (Checkout, Creator Application) | Clearly indicates completed, current, and upcoming steps; replaces breadcrumbs in these contexts per `04-information-architecture.md` Section 13 |
| **Search Bar** | Global and scoped search entry (Section 10 of `04-information-architecture.md`) | Expands to full-screen overlay on mobile activation (Section 8.3 of `05-design-principles.md`) |
| **Command Palette** | Fast, keyboard-driven navigation for internal power users (Admin/Support) | Reserved for internal/Admin contexts only; not part of the buyer/creator experience in v2 |
| **Footer** | Persistent site-wide footer navigation | Multi-column on desktop, accordion-grouped on mobile (Section 6.9) |

---

# 17. Feedback Components

| Component | Purpose | Key Behavior |
|---|---|---|
| **Toast** | Brief, non-blocking confirmation of an action | Auto-dismisses after a few seconds; never used for critical information the user must not miss |
| **Snackbar** | Similar to Toast, may include a single inline action (e.g., "Undo") | Used specifically where an immediately reversible action benefits from an undo affordance (per `05-design-principles.md` Section 3, Forgiveness) |
| **Alert** | Persistent, page-level message requiring acknowledgment or explaining a state | Used for account restrictions, verification status, or other conditions the user should not miss |
| **Banner** | Prominent, page-top message for broader announcements | Used sparingly (e.g., planned maintenance notice) to avoid banner fatigue |
| **Progress (bar)** | Indicate completion progress of a determinate process | Used for uploads, multi-step form completion |
| **Skeleton** | Structural loading placeholder (Section 25.1) | Matches the approximate shape/layout of the content it precedes |
| **Loading Spinner** | Indeterminate loading indicator | Reserved for short, unpredictable-duration waits where a skeleton isn't feasible |
| **Rating** | Display or input a star rating | Read-only (display) and interactive (review submission) variants |
| **Review Summary** | Aggregate rating display (e.g., "4.8 average, 132 reviews") | Always shows review count alongside average to support the minimum-count safeguard (per `01-product-requirements.md` SRCH-03) |
| **Status Badge** | Compactly communicate a state (order status, verification status) | Always paired with text label, never color/icon alone (Section 3.14) |
| **Chip** | Compact, removable representation of a selection (filter, multi-select value) | Includes a clear remove affordance |
| **Tag** | Non-removable, informational label (e.g., "Handmade," "Made to Order") | Visually distinct from Chip to avoid implying it's interactive/removable |
| **Notification** | In-app representation of a platform notification (Section 4.9 of `05-design-principles.md`) | Read/unread visual states; links to relevant context |

---

# 18. Overlay Components

| Component | Purpose | Key Behavior |
|---|---|---|
| **Modal** | Focused, blocking interaction over page content | Uses `elevation-3`; dismissible via explicit close, scrim tap (for non-critical modals), or Escape key |
| **Dialog** | A smaller, more focused variant of Modal, typically for a single decision | Same elevation/behavior as Modal, more constrained width |
| **Bottom Sheet** | Mobile-optimized equivalent of a Modal/Dropdown for selection or detail content | Slides up from the bottom; supports drag-to-dismiss in addition to explicit close |
| **Popover** | Lightweight, anchored contextual content | Uses `elevation-2`; dismisses on outside click/tap |
| **Tooltip** | Brief, supplementary clarification on hover/focus | Never contains essential information (per `05-design-principles.md` Section 12.10); appears on hover (desktop) or tap-and-hold (mobile, used sparingly) |
| **Dropdown** | Anchored list of selectable options (Select input, menu) | Keyboard-navigable via arrow keys, closes on selection or outside interaction |
| **Confirmation Dialog** | Explicit confirmation step before a consequential/irreversible action | Required before any Danger-variant button action (Section 13) completes; clearly restates the consequence |
| **Image Viewer** | Full-screen/expanded view of product or creator imagery | Supports pinch-zoom (mobile) and keyboard navigation between images (desktop) |
| **Media Viewer** | Generalized viewer for other media types (e.g., a future video/process content) | Reserved for future expansion; not core to v2 scope |
| **Share Sheet** | Native or in-platform sharing of a product/collection/creator link | Uses platform-native share behavior where available, with an in-platform fallback (copy link) |

---

# 19. Data Display

| Component | Purpose | Key Behavior |
|---|---|---|
| **Tables** | Structured tabular data (Admin user/creator lists, Creator inventory) | Sortable columns where relevant; sticky header on scroll; row density per Section 5.8 |
| **Lists** | Scannable vertical content (Order History, Messages, Notifications) | Consistent field alignment (date, status, amount) across all list instances (per `05-design-principles.md` Section 5.13) |
| **Timeline** | Sequential representation of events (order status history, moderation action history) | Clear chronological ordering with timestamp and actor where relevant |
| **Activity Feed** | Chronological stream of relevant events (Creator Dashboard "recent activity") | Grouped by day/relevance; not an infinite, algorithmic feed (avoiding the anti-pattern flagged in `05-design-principles.md` Section 18) |
| **Charts** | Visualize trends (Analytics: sales over time, traffic) | Always paired with an accessible data-equivalent (Section 26.13); uses semantic/neutral color tokens, not arbitrary chart-library defaults |
| **Graphs** | Synonymous with Charts in this system; no distinct component | — |
| **Statistics** | Single-value summary display (e.g., "132 orders this month") | Uses `type-display` or `type-heading` scale for the number, `type-caption` for the label |
| **Metrics** | Synonymous with Statistics in most contexts; used within Analytics Cards (Section 15) | — |
| **KPI Cards** | Dashboard-level summary of a key metric with trend | See Analytics Card (Section 15) |
| **Dashboard Widgets** | General term for any card-like summary/action element on a dashboard | Composed from Analytics Card, Order Card, Alert, and List components as appropriate to content |

---

# 20. Commerce Components

| Component | Purpose | Key Behavior |
|---|---|---|
| **Cart** | Display and manage items prior to checkout | Grouped by creator (per `01-product-requirements.md` CART-02); each line item shows customization summary, quantity, price |
| **Checkout** | Composite flow component (Address, Shipping, Review, Payment steps) | Uses Stepper (Section 16) for progress; persistent order summary panel (Section 6.14) |
| **Payment Summary** | Itemized cost breakdown | Shows subtotal, shipping, tax, discounts, and total, always in that consistent order, before any payment confirmation (per `01-product-requirements.md` CHK-03) |
| **Invoice** | Formal order record (viewable/downloadable) | Structured, print-friendly layout; consistent with Payment Summary field ordering |
| **Order Timeline** | Visualize an order/sub-order's progression through states | Uses the Timeline component (Section 19), scoped to Order states (Section 8.2 of `01-product-requirements.md`) |
| **Tracking** | Display shipment tracking detail | Shows current status prominently, with carrier detail and timeline beneath |
| **Wishlist** | Grid/list of saved items | Uses Product Card (Section 15) with a remove action and price/availability-change indicators (per `01-product-requirements.md` WISH-02) |
| **Coupon** | Apply/display a discount at checkout | Uses Coupon Card (Section 15); shows applied discount clearly within Payment Summary |
| **Gift Message** | Capture and display a buyer's gift note | Uses Textarea input (Section 14) with a character limit indicator; displayed to the creator within Order detail |
| **Customization Panel** | Capture buyer personalization input on Product Detail | Composed from relevant Input components (Text, Upload, Select) per listing configuration (per `01-product-requirements.md` CUST-01) |
| **Shipping Card** | Display shipping method/estimate | Shows carrier/method and estimated delivery window per creator/sub-order |
| **Address Card** | Display/select a saved address | Shows formatted address with a clear "default" indicator and edit/remove actions |

---

# 21. Creator Components

| Component | Purpose | Key Behavior |
|---|---|---|
| **Store Banner** | Wide, brand-expressive header image for a storefront | Creator-uploaded; cropped/positioned consistently across devices |
| **Store Header** | Storefront identity block (name, avatar, verification badge, rating) | Persistent at the top of the Creator Storefront page (per `04-information-architecture.md` Section 14.3) |
| **Creator Profile** | Editable version of Store Header + story content, used in Storefront Settings | Includes inline editing affordances for the creator, distinct from the public read-only Store Header |
| **Portfolio Gallery** | Grid display of a creator's published catalog on their storefront | Uses Product Card (Section 15) in a responsive grid |
| **Analytics Dashboard** | Composite view of Creator performance | Composed of Analytics Cards (Section 15) and Charts (Section 19) |
| **Inventory Table** | Manage stock/capacity across listings | Uses Table component (Section 19); inline-editable quantity/capacity fields |
| **Order Queue** | List of incoming/active orders needing creator attention | Uses Order Card (Section 15) in a prioritized list, surfacing time-sensitive items first (per `05-design-principles.md` Section 4.11) |
| **Payout Summary** | Display payout history and upcoming payouts | Uses List/Table components; each entry links to its reconciling order(s) |
| **Review Dashboard** | List of reviews with reply capability | Uses Review Card (Section 15) with an inline reply composer |
| **Product Editor** | Composite form for creating/editing a listing | Uses Progressive Form pattern (Section 11.8 of `05-design-principles.md`); combines Text, Upload, Select, and Customization-field-configuration inputs |

---

# 22. Admin Components

| Component | Purpose | Key Behavior |
|---|---|---|
| **Dashboard** | Admin/Moderator/Support overview | Composed of Alert, Analytics Card, and prioritized List components, per `04-information-architecture.md` Section 15 |
| **User Table** | Directory of buyer accounts (Admin view) | Sortable/searchable Table (Section 19), with scoped drill-in to User Detail |
| **Creator Approval** | Review interface for creator applications | Composite of Creator Profile-equivalent content plus Approve/Reject actions (Danger/Success button variants, Section 13) |
| **Moderation Queue** | List of flagged content awaiting review | Uses List component with severity-based Status Badges (Section 17) |
| **Audit Log** | Chronological record of internal actions | Uses Timeline/Table hybrid; read-only, Super Admin scoped |
| **Analytics** | Platform-wide performance view | Composed of Analytics Cards and Charts, same underlying components as Creator Analytics Dashboard at a platform-wide data scope |
| **Support Queue** | List of open support tickets | Uses List component with SLA-proximity indicators (Status Badge variant) |
| **Reports** | Exportable/scheduled reporting views | Table-based, with export action (download as file, no further UI specification needed here) |
| **Permission Matrix** | Super Admin view/editor of role permissions | A structured Table mapping roles to permissions, using Chip/Tag components to represent granted permissions |

---

# 23. Empty States

Full principle-level guidance is defined in `05-design-principles.md` Section 13. This section defines the component-level specification.

### 23.1 Guidelines
Every empty state is composed of: an Illustration (Section 8.3, sized moderately — never overwhelming the available space), a short heading, one line of supporting copy, and where applicable, a single primary Button (Section 13) directing to the most useful next action.

### 23.2 Illustrations
Empty-state illustrations use the standard Illustration System (Section 8), sized at a consistent moderate scale (roughly 120–160px) regardless of context, to maintain visual consistency across the many empty states enumerated in `05-design-principles.md` Section 13.

### 23.3 Copy
Follows the Content Design principles (`05-design-principles.md` Section 12.11) — encouraging, specific, never apologetic or negative.

### 23.4 CTA
A single, clear primary action where one exists (e.g., "Explore Collections"); omitted entirely (not shown as a disabled/greyed button) where no meaningful action applies (e.g., "No Notifications").

### 23.5 Actions
Secondary actions, where they exist, use the Tertiary or Text button variant (Section 13) to avoid competing with the primary action.

### 23.6 Accessibility
Empty-state illustrations are marked decorative (not announced); the heading and supporting copy carry the full meaning and must be sufficient on their own for a screen reader user.

---

# 24. Error States

Full principle-level guidance is defined in `05-design-principles.md` Section 14. This section defines the component-level specification.

| Error Type | Component Composition |
|---|---|
| **Validation** | Inline field-level error styling (Section 14.1) — no separate page-level component needed |
| **404** | Full-page composition: Illustration + heading + Search Bar (Section 16) + links to Home/Categories |
| **403 / 401** | Full-page or Alert composition (Section 17) depending on context, explaining the boundary plainly |
| **500** | Full-page composition: Illustration + heading + Retry button (Primary) + Support link (Text button) |
| **Offline** | Persistent Banner (Section 17) rather than a full-page takeover, since cached content should remain visible beneath it |
| **Retry** | A consistent Retry action pattern (Primary or Secondary button labeled specifically, e.g., "Try Again") reused across every recoverable error type |
| **Recovery** | Composed from the same building blocks (Illustration, heading, copy, Button) as other error states — recovery is a state of the same component family, not a separate one |
| **Escalation** | Where self-service recovery isn't possible, the error composition includes a Text-button link to Support (Section 4.14 of `05-design-principles.md`) |

---

# 25. Loading States

Full principle-level guidance is defined in `05-design-principles.md` Section 15.

### 25.1 Skeletons
Skeleton components mirror the approximate shape of the content they precede (e.g., a Product Card skeleton shows an image-shaped block, a title-shaped bar, and a price-shaped bar) using a subtle, continuous shimmer motion (Section 10.6).

### 25.2 Optimistic Updates
Applied only to low-risk, easily reversible actions (e.g., Wishlist toggle) — the UI updates immediately, with a silent background reconciliation and a graceful rollback + Toast notification if the action ultimately fails.

### 25.3 Lazy Loading
Below-the-fold imagery and content load progressively as the user scrolls, using a Skeleton placeholder until loaded, to preserve initial page performance.

### 25.4 Infinite Scroll / Pagination
Mobile browsing/search contexts default to a "Load more" pattern (explicit user-triggered loading of the next batch) rather than fully automatic infinite scroll, avoiding the engagement-maximizing anti-pattern flagged in `05-design-principles.md` Section 18 (Community); desktop Admin/internal Tables use explicit numbered Pagination (Section 16) given their task-oriented, reference-lookup nature.

### 25.5 Retry
Any failed load state offers an explicit Retry action (Section 24) rather than requiring a full page reload.

### 25.6 Caching
Where content is shown from cache (e.g., a brief offline period), a subtle, non-alarming indicator communicates that the view may not reflect the latest state.

### 25.7 Offline
See Section 24 (Offline error state) — cached content remains visible and interactive in a clearly marked read-only state where feasible.

---

# 26. Accessibility Specifications

Full principle-level rationale is defined in `05-design-principles.md` Section 9. This section defines the concrete specification every component must meet.

| Area | Specification |
|---|---|
| **26.1 WCAG 2.2 AA** | The baseline conformance target for every screen and component; specific success criteria are checked per the Design QA Checklist (Section 31). |
| **26.2 Keyboard** | Every interactive component is operable via Tab (move focus), Shift+Tab (move focus backward), Enter/Space (activate), and Escape (dismiss overlays), with arrow-key support for composite widgets (Tabs, Dropdown, Radio groups). |
| **26.3 Screen Readers** | Every component's semantic role, name, and state must be programmatically determinable; components are specified with their intended accessible role at a conceptual level (e.g., "Tabs behave as a tablist with tab/tabpanel relationships"). |
| **26.4 ARIA Philosophy** | ARIA attributes are used only to convey semantics not otherwise available from the native structure — the guiding rule is "use semantic structure first, ARIA to fill genuine gaps," never ARIA as a substitute for good structure. |
| **26.5 Focus States** | Every focusable element has a visible focus indicator using `color-border-focus`, with sufficient contrast against all backgrounds it may appear on (Section 3.11). |
| **26.6 Contrast** | All text/background and meaningful UI-element/background pairings meet WCAG 2.2 AA contrast minimums (Section 3.11). |
| **26.7 Motion** | All motion respects reduced-motion user preference (Section 10.9); no essential information is conveyed by motion alone. |
| **26.8 Touch Targets** | Minimum 44×44px touch target (`size-touch-target-min`), including sufficient spacing between adjacent targets to prevent accidental activation. |
| **26.9 Zoom** | Layouts remain functional and content remains legible at up to 200% browser zoom without horizontal scrolling of the primary content area. |
| **26.10 Reduced Motion** | See Section 10.9; a system-level preference is respected automatically, with no separate in-app toggle required (though one may be added in Settings in the future). |
| **26.11 Language** | Page language is correctly and consistently identified; content follows the plain-language content principles (`05-design-principles.md` Section 9.15). |
| **26.12 Forms** | Every field has a persistent, programmatically associated label; errors are announced and associated with their field (Section 14.1). |
| **26.13 Images** | Every meaningful image has descriptive alternative text; decorative images are marked as such (Section 7.9, 8's illustration guidance). |
| **26.14 Charts** | Every chart/graph has an accessible data-equivalent (a summarized text description or accessible data table) alongside the visual (Section 19). |

---

# 27. Responsive Design System

Full principle-level rationale is defined in `05-design-principles.md` Section 16. This section maps that philosophy to concrete breakpoint behavior using the tokens in Section 2.14.

| Context | Breakpoint(s) | Layout Behavior |
|---|---|---|
| **Mobile** | `xs`, `sm` | Single-column; bottom navigation; full-width primary actions; Stepper/linear flows for Checkout |
| **Tablet** | `md` | 8-column grid; condensed top navigation with collapsible category menu; 2-column product grids |
| **Laptop** | `lg` | Full 12-column grid; persistent top navigation; sidebar-based dashboards; 3–4 column product grids |
| **Desktop / Large Displays** | `xl` | Same structural grid as Laptop with increased container max-width (Section 6.3) and additional margin rather than stretched components |
| **Ultra-wide** | Beyond `xl` | Content container caps at `xl` max-width; excess space becomes margin only, never stretched layout (per `05-design-principles.md` Section 5.20 rule for desktop) |
| **Foldables** | Variable, treated as a special case at any breakpoint | No critical content or control is positioned where a device fold/hinge would obscure it; layouts must remain functional across an abrupt aspect-ratio change |
| **Landscape** | Any breakpoint, landscape orientation | Mobile/tablet landscape relocates bottom navigation appropriately (per `05-design-principles.md` Section 16) rather than cropping a portrait-designed layout |
| **Portrait** | Any breakpoint, portrait orientation | The default, fully supported orientation for all core flows |
| **Adaptive Components** | All | Components reflow structurally at breakpoints (e.g., Cart's two-column Checkout layout collapsing to single-column) rather than merely scaling proportionally (Section 6.14) |

---

# 28. Dark Mode Strategy

Dark mode is a **future capability**, not built in v2 (per `05-design-principles.md` Section 18), but the token architecture (Section 2.1) is deliberately structured to support it without component-level rework.

| Area | Strategy |
|---|---|
| **Color Rules** | Dark mode is implemented purely as an alternate mapping at the Semantic (alias) token tier — e.g., `color-background-default` would map to a dark neutral instead of `color-neutral-050` — with all Global and Component tier tokens/structure unchanged. |
| **Images** | Product and creator photography (Section 9) is not altered for dark mode; only surrounding UI chrome (backgrounds, surfaces, borders) changes. |
| **Elevation** | Dark surfaces typically communicate elevation through subtle lightness/tint shifts in addition to shadow (since shadows read less clearly on dark backgrounds) — this nuance is deferred to the dark-mode-specific token definition when built. |
| **Contrast** | All dark-mode color pairings must independently meet WCAG 2.2 AA contrast (Section 3.11, 26.6) — dark-mode tokens are not simply inverted light-mode values, but deliberately chosen and verified. |
| **States** | All interactive states (hover, focus, pressed) are re-mapped at the semantic tier for dark mode, preserving identical component-tier behavior. |
| **Icons** | The icon set (Section 7) remains stroke-based and inherits `color-text-*` tokens, requiring no separate dark-mode icon asset set. |
| **Accessibility** | Dark mode must meet the same accessibility bar (Section 26) as light mode — it is a first-class theme, not a lower-priority variant. |
| **Future Expansion** | The same alias-tier remapping approach reserved for Dark Mode also supports a potential future High-Contrast theme (Section 3.10) using the identical mechanism. |

---

# 29. Figma Organization

| Area | Convention |
|---|---|
| **Pages** | Separate Figma pages per major zone: Foundations (tokens/color/type), Components, Buyer Flows, Creator Flows, Admin/Internal Flows, Archive (deprecated work, never deleted outright). |
| **Variables** | All Section 2 design tokens are implemented as Figma Variables (color, spacing, radius) organized in matching Global → Semantic collections, mirroring the token tiering in Section 2.1. |
| **Styles** | Typography (Section 4) and effect/shadow (Section 2.7) styles are defined once in the Foundations page and applied everywhere via shared styles, never locally detached. |
| **Components** | Every component in Sections 13–22 exists as a Figma main component in the Components page, never duplicated or locally overridden in flow files without a documented reason. |
| **Variants** | Figma variant properties mirror the documented variants in this document exactly (e.g., a Button component's variant property values match Section 13's variant names precisely). |
| **Naming** | Follows the convention defined in Section 30. |
| **Auto Layout** | All components use Auto Layout configured to reflect the spacing tokens (Section 2.4) exactly, so resizing behavior in Figma matches intended responsive behavior. |
| **Libraries** | A single published Team Library contains Foundations and Components; flow files consume the library rather than containing embedded, divergent copies. |
| **Versioning** | Library changes are published with descriptive version notes; breaking changes (e.g., a renamed token) are flagged clearly and communicated to all consuming files before publishing. |
| **Branching** | Significant component changes are developed in a Figma branch and reviewed before merging into the main library, mirroring standard code-review discipline. |
| **Documentation** | Each component's Figma page includes inline documentation (purpose, variant explanation, usage do/don't) directly adjacent to the component, mirroring Sections 13–22 of this document. |

---

# 30. Component Naming Convention

| Category | Convention | Example |
|---|---|---|
| **Tokens** | `[category]-[property]-[variant/scale]`, lowercase, hyphenated (Section 2.15) | `color-text-secondary`, `space-200` |
| **Components** | PascalCase, descriptive of function not location (Section 12.8) | `ProductCard`, `OrderTimeline` |
| **Variants** | Property name + value pairs matching this document's variant tables exactly | `Variant=Primary`, `Size=Large` |
| **Icons** | `icon/[name]`, lowercase, hyphenated, named for meaning not appearance | `icon/heart`, `icon/verified-badge` |
| **Assets** | `asset/[category]/[name]` | `asset/illustration/empty-wishlist` |
| **Illustrations** | `illustration/[context]/[specific-name]` | `illustration/empty-state/no-orders` |
| **Frames** | `[Breakpoint] / [Flow] / [Screen Name]` | `Mobile / Checkout / Payment Step` |
| **Sections** | Match the Global Sitemap zone names from `04-information-architecture.md` Section 3 | `Buyer Account Zone`, `Creator Zone` |
| **Pages** (Figma) | Match Section 29's page list exactly | `Foundations`, `Components`, `Buyer Flows` |

---

# 31. Design QA Checklist

This checklist supplements the Design Review Checklist in `05-design-principles.md` Section 19 with system-specific verification. Every shipped screen must pass all applicable items.

### Visual QA
- [ ] All colors used are drawn from defined tokens (Section 3) — no arbitrary hex values.
- [ ] All typography uses defined type scale steps (Section 4.3) — no arbitrary font sizes.
- [ ] All spacing uses defined spacing tokens (Section 2.4) — no arbitrary pixel gaps.

### Accessibility QA
- [ ] Contrast verified against WCAG 2.2 AA for all text/background pairings used (Section 26.6).
- [ ] Full keyboard operability verified (Section 26.2).
- [ ] All images/icons have appropriate alt text or decorative marking (Section 26.13).
- [ ] Focus states are visible on every interactive element (Section 26.5).

### Interaction QA
- [ ] All defined component states (Section 12.6) are implemented, not just the default state.
- [ ] Motion respects reduced-motion preference (Section 26.7).
- [ ] Loading, empty, and error states are designed, not left to default/placeholder treatment (Sections 23–25).

### Responsive QA
- [ ] Verified at `xs`, `md`, and `xl` breakpoints at minimum (Section 27).
- [ ] No horizontal scroll or broken layout at 200% zoom (Section 26.9).

### Content QA
- [ ] Copy matches the voice/tone guidance (`05-design-principles.md` Section 12).
- [ ] All labels, errors, and empty-state copy reviewed against Sections 23–24 guidance.

### Component QA
- [ ] No new one-off component created where an existing component (Sections 13–22) could be reused or extended via a documented variant.
- [ ] Any genuinely new component is proposed as a system addition, not a silent local override.

### Performance QA
- [ ] Images are appropriately optimized; below-the-fold content uses lazy loading (Section 25.3).
- [ ] Skeleton states are used for predictable-shape content loads (Section 25.1).

### Consistency QA
- [ ] Naming follows Section 30 conventions.
- [ ] Component usage matches its documented purpose (Sections 13–22) — not repurposed for an unrelated meaning.

### Marketplace QA
- [ ] Trust signals (verification, disclosure, reviews) are present and prominent per `05-design-principles.md` Section 7.4.
- [ ] Pricing and availability are transparent and accurate at every step (Section 3.6 tokens used correctly for semantic meaning).

---

# 32. Future Evolution

| Area | Design System Readiness Consideration |
|---|---|
| **AI Components** | A future AI-suggestion or AI-assistant surface would introduce a new component family (e.g., an "AI Suggestion" card variant) clearly visually distinguished from editorial/human-curated content, consistent with `05-design-principles.md` Section 18's transparency requirement. |
| **AR Components** | An AR preview mode would extend the Image Viewer (Section 18) with a new mode/variant rather than introducing a structurally separate component. |
| **Voice UI** | Should voice interaction be introduced, the existing Content Design voice (Section 12 of `05-design-principles.md`) is directly reusable, since it was designed to read naturally aloud. |
| **Internationalization** | Typography tokens (Section 4) and spacing (Section 5) are structured to be extensible with locale-specific overrides (e.g., different line-height needs for non-Latin scripts) without restructuring the token tiers. |
| **RTL Support** | Layout and component specifications are directionally logical (start/end rather than hardcoded left/right) in intent, allowing a future RTL locale to be supported via mirroring rather than component redesign. |
| **Enterprise Features** | A future Admin permission/reporting expansion would extend existing Table, Permission Matrix, and Analytics components (Sections 19, 22) rather than requiring new foundational patterns. |
| **Creator Studio** (expanded creator tooling) | Would extend the existing Creator Component family (Section 21) with new components following the same tokens and interaction principles, preserving a single coherent Creator experience. |
| **Business Accounts** | A future Wholesale/Corporate buyer experience (per `04-information-architecture.md` Section 21) would likely warrant new component variants (e.g., a bulk-quantity input) built from the same Input foundation (Section 14), not a parallel design language. |
| **Future Devices** | Because this system is token- and principle-driven rather than device-specific, it is structurally portable to new form factors as they emerge, requiring new breakpoint/layout definitions rather than a philosophical rebuild. |

---

# 33. Key Insights

### 33.1 Top 25 Design System Insights

1. A three-tier token hierarchy (Global → Semantic → Component) is what makes future rebranding or dark mode achievable without a component-by-component rewrite.
2. Naming tokens by purpose (semantic tier), not raw value, is what allows the same design decision to evolve without breaking every screen that uses it.
3. A 4pt base spacing unit balances grid discipline with the finer granularity commerce-dense UI genuinely needs.
4. Reserving elevation and z-index as separate but linked token systems avoids the common bug class of visually-elevated elements sitting behind lower z-index layers.
5. Defining component states (Section 12.6) as a mandatory part of every component's specification prevents the common gap where only the "happy path" default state gets designed.
6. A restrained, muted semantic color palette (Section 3.6) is a deliberate system-level choice reinforcing Calm Interfaces, not an oversight of "not being colorful enough."
7. Treating Illustration and Photography as governed systems (Sections 8–9), not ad hoc asset choices, protects brand consistency at the volume this catalog will eventually reach.
8. A documented Figma-to-token mapping (Section 29) is what keeps design and implementation from silently drifting apart over time.
9. Component naming by function, not location (Section 12.8, 30), is what enables genuine reuse across Buyer, Creator, and Admin contexts.
10. Explicitly reserving structural room for Dark Mode and future themes (Section 28) avoids an expensive retrofit later for a capability that's easy to anticipate now.
11. A single duration/easing token set (Section 2.8, 10) applied everywhere is what makes motion feel like one coherent system rather than per-screen guesswork.
12. Defining "Do" and "Don't" explicitly for color usage (Section 3.12–3.14) is more actionable than stating principles only in the positive.
13. A token-driven typography scale (Section 4.3) prevents the common drift where every new screen introduces a slightly different font size "just this once."
14. Command Palette being explicitly scoped to internal-only use (Section 16) reflects a deliberate choice not to import a pattern popular in developer tools into a consumer marketplace context without justification.
15. This document's insistence on zero raw/arbitrary values (Section 31, Visual QA) is what actually enforces the token system in practice, not just in principle.
16. Defining accessibility specifications (Section 26) at the same rigor as visual specifications signals that accessibility is a system-level requirement, not a per-component afterthought.
17. A consistent icon stroke weight and style (Section 7.3) does more to make a large icon set feel coherent than any individual icon's cleverness.
18. Separating "Filled vs. Outline" icon usage into a meaningful state signal (Section 7.4), rather than a stylistic choice, prevents ambiguous or inconsistent icon usage across the platform.
19. A single elevation scale (Section 11) mapped consistently to shadow and z-index tokens prevents the common bug of visually-inconsistent modal/dropdown/tooltip layering.
20. Reserving Blur tokens (Section 2.10) even though barely used in v2 shows the system anticipates future immersive/media-rich contexts without needing new foundational work later.
21. This system's Figma Variables mapping (Section 29) directly to the same token tiers defined in Section 2 keeps the design tool and the documentation as two views of one source of truth, not two divergent artifacts.
22. Explicit component versioning/branching discipline (Section 29) scales design collaboration the same way code review scales engineering collaboration.
23. A system that names its own future evolution paths (Section 32) is far less likely to make foundational decisions that block that evolution.
24. Defining "what a button is for" (Section 13) independently of "how many buttons currently exist" keeps the system's logic intact even as the product's screen count grows dramatically.
25. The clearest sign this system is working: a new designer or engineer should be able to build a compliant new screen using only Sections 2–22, without inventing a single new token or pattern.

### 33.2 Top 25 UI Insights

1. A warm off-white background (`color-neutral-050`) rather than pure white immediately signals a more human, less clinical product than most e-commerce defaults.
2. Pairing a serif (editorial) and sans (interface) typeface role directly visualizes the platform's dual character: craft and clarity.
3. Generous line-height on body text is one of the cheapest, highest-leverage decisions for making an interface feel calm rather than dense.
4. Reserved, sparing use of the accent color (`color-brand-accent`) makes rare, meaningful moments (verification, milestones) feel genuinely special rather than diluted by overuse.
5. Tabular figures for all numeric UI prevent the subtle but real scanability problem of misaligned numbers in tables and lists.
6. A single, consistent card padding value across Product, Creator, and Order cards makes very different content types feel like they belong to the same product.
7. Status badges that always pair color with text prevent a whole category of confusing, inaccessible UI that relies on color alone.
8. A soft, moderate border-radius scale (never sharp, never pill-shaped everywhere) is a small, consistent signal of the brand's warm-but-restrained character.
9. Grouping cart items by creator (rather than a flat list) directly reflects and clarifies the platform's multi-vendor structure to the buyer.
10. Persistent order summary during Checkout (Section 6.14) reduces the single highest-anxiety unknown in the purchase flow: "what am I actually paying?"
11. A stepper replacing breadcrumbs during linear flows (Checkout, Creator Application) correctly signals "this is a sequence, not a place," matching user mental models.
12. Skeleton loading states that mirror real content shape reduce the jarring layout shift that erodes perceived quality.
13. Toast vs. Alert vs. Banner as three distinct components (Section 17) prevents the common anti-pattern of using one blunt "notification" pattern for messages of very different urgency.
14. A single visual treatment for "verified" trust badges, distinct from the general icon set, makes trust signals immediately recognizable at a glance across the whole platform.
15. Consistent review-count-alongside-average-rating display (Section 17) prevents a single early review from misleadingly dominating a new listing's perceived quality.
16. A dedicated, distinct visual treatment for Danger buttons (using `color-error` instead of brand primary) prevents accidental destructive actions from looking like routine ones.
17. Bottom navigation using filled-icon-for-active-state is a small, effective way to communicate location without adding any extra visual weight (like a background pill) that could clutter a five-item bar.
18. Chips (removable) and Tags (informational) being visually distinct prevents users from trying to remove/interact with non-interactive labels.
19. A consistent avatar size scale (Section 2.12) across Creator cards, storefront headers, and internal user tables keeps identity representation coherent everywhere it appears.
20. Keeping the color palette's semantic colors muted rather than saturated (Section 3.6) is a small choice with an outsized effect on the platform's overall "calm" feeling.
21. A generously sized primary action button (`button-size-lg`, 48px) for checkout/conversion moments reflects their outsized importance relative to routine secondary actions.
22. Long-form content (creator stories) constrained to a comfortable reading width (Section 6.5) meaningfully improves the perceived quality of what is otherwise "just text."
23. A single consistent empty-state composition pattern (illustration + heading + copy + optional CTA) across a dozen+ different empty states (Section 23) keeps a potentially disjointed set of edge cases feeling like one coherent, considered system.
24. Reserving the serif typeface strictly for editorial/storytelling content (never functional UI) keeps the interface legible while still allowing warmth where it matters most.
25. The overall visual system succeeds when a screen nobody has designed yet (using only this document) would still look and feel unmistakably like Dreams by Kalakaaar.

### 33.3 Top 25 Frontend Insights

*(High-level structural/specification implications only — no code, framework, or implementation detail, consistent with this document's scope.)*

1. A three-tier token system implies a corresponding three-tier implementation structure (raw values → semantic aliases → component-scoped references) that should be preserved in whatever technology implements it.
2. Explicit component state definitions (Section 12.6) give frontend engineering a complete, unambiguous checklist of what must be built for every interactive component, reducing late-discovered gaps.
3. A single duration/easing token set (Section 2.8, 10) implies motion should be implemented via shared, reusable primitives rather than per-component custom timing values.
4. Skeleton-first loading philosophy (Section 25.1) has a direct technical implication: components need to know their approximate rendered shape before their data has loaded.
5. The optimistic-update rule being scoped specifically to low-risk, reversible actions (Section 25.2) gives engineering a clear, principled boundary for where optimistic UI is and isn't appropriate.
6. Reduced-motion support being a system-wide requirement (Section 10.9, 26.7) implies every animated component's implementation must expose a reduced-motion-aware code path, not just the highest-visibility ones.
7. Consistent focus-state and keyboard-navigation requirements (Section 26.2, 26.5) across every component imply a shared, reusable focus-management approach rather than per-component bespoke handling.
8. The explicit rule against arbitrary values (Section 31, Visual QA) implies tokens should be enforced at the implementation layer (e.g., linting against raw hex/pixel values), not just requested via documentation.
9. Components specified as compositions of smaller components (Section 12.2) suggest a corresponding composable implementation structure, avoiding monolithic, hard-to-reuse component code.
10. Accessible-data-equivalent requirements for charts (Section 26.14) have a direct technical implication: chart components need a parallel, accessible data-table rendering path, not just a visual canvas/SVG output.
11. The Figma-to-token mapping (Section 29) implies a need for an ongoing, reliable sync mechanism between design tooling and implementation tokens to prevent drift over time.
12. Reserving Dark Mode as an alias-tier-only change (Section 28) has a direct technical implication: components must reference semantic tokens exclusively, never hardcoded raw colors, for this to work without component rewrites.
13. The Load-more-over-infinite-scroll default on mobile (Section 25.4) is a simpler, more predictable technical pattern than true infinite scroll, with fewer edge cases around scroll-position restoration.
14. A consistent breakpoint token set (Section 2.14) implies responsive logic should be implemented against these shared breakpoints, not arbitrary per-component media queries.
15. Explicit touch-target-size requirements (Section 26.8) apply even when a component's visual size is smaller — implying padding/hit-area must sometimes exceed the visible element bounds.
16. Every component's responsiveness being a first-class specification requirement (Section 12.5) implies no component should be considered "done" until its cross-breakpoint behavior is verified, not just its default desktop appearance.
17. The naming convention (Section 30) directly maps to implementation naming, reducing translation friction between design files and a future component library/codebase.
18. Elevation tokens mapped consistently to both shadow and z-index (Section 11) prevent a common implementation bug class where visual layering and interaction layering fall out of sync.
19. The rich-text editor being deliberately constrained (Section 14, Rich Text) rather than full-featured reduces implementation complexity and avoids a class of formatting-related edge cases in creator storytelling content.
20. Consistent validation-timing rules (on blur/submit, not per-keystroke, Section 14.1) simplify implementation by establishing one standard behavior rather than requiring per-form decisions.
21. A single Confirmation Dialog pattern required before every Danger action (Section 18) implies this should be a shared, reusable implementation pattern, not a bespoke dialog built per destructive action.
22. Tabular-figure numeric typography (Section 4.2) has a specific typographic implementation requirement (fixed-width numeral variants) that must be verified in whatever typeface is ultimately selected.
23. This document's strict non-implementation scope means a subsequent, separate technical/frontend architecture document will be needed to translate these specifications into an actual technology stack decision.
24. Defining accessibility and responsiveness as mandatory parts of every component specification (Section 12.4–12.5), rather than a separate audit pass, front-loads that work into initial implementation rather than costly retrofit.
25. A component library structured around this document's Sections 13–22 gives frontend engineering a natural, matching implementation module structure to plan and estimate against.

### 33.4 Top 25 Accessibility Insights

1. Defining accessibility specifications at the same structural rigor as color and typography (Section 26) signals it is not optional polish but core system architecture.
2. A visible focus state is a binary requirement — every interactive component either has one or the keyboard experience is broken for some users; there is no acceptable partial state.
3. Requiring an accessible data-equivalent for every chart (Section 26.14) is one of the most commonly skipped accessibility requirements in analytics-heavy products, and one of the most consequential for excluding creators from their own performance data.
4. Minimum touch target sizing (Section 26.8) benefits far more users than only those with diagnosed motor impairments — it improves usability for anyone using the platform one-handed or in a hurry.
5. Color-paired-with-text-or-icon as a system-wide rule (Section 3.14, 17) prevents the single most common accessibility failure in status/badge-heavy interfaces.
6. Persistent, non-placeholder form labels (Section 14) are both a usability and accessibility requirement — the two goals align completely here.
7. The ARIA philosophy of "semantic structure first" (Section 26.4) produces more robust accessibility than heavy reliance on ARIA patches over poor underlying structure.
8. 200% zoom support without horizontal scroll (Section 26.9) is a frequently under-tested requirement that this system makes explicit and checkable.
9. Reduced-motion as an automatic, system-detected behavior (Section 26.10) removes the burden from users to discover and enable an in-app setting.
10. Requiring alt text and decorative-image marking as a binary classification (Section 26.13) prevents the common failure of over-verbose alt text on purely decorative illustration.
11. A component-level accessibility specification (Section 12.4) is only meaningful if genuinely applied at build time, which is why it's reinforced again in the QA checklist (Section 31).
12. Keyboard operability requirements extending to composite widgets (Tabs, Dropdown) with arrow-key support (Section 26.2) reflect real assistive-technology usage patterns, not just basic Tab-key support.
13. Confirmation dialogs before destructive actions (Section 18) benefit cognitive accessibility as much as they prevent general user error.
14. This system's accessibility requirements are largely achieved through disciplined use of the same tokens and components already required for visual consistency — accessibility and consistency reinforce rather than compete with each other here.
15. Explicitly documenting accessible states for disabled/read-only inputs (Section 14.2) prevents a common gap where only the "happy path" input state is made accessible.
16. Screen-reader-first thinking (Section 26.3) tends to also improve SEO and general content structure, since both rely on meaningful semantic hierarchy.
17. A single, consistent focus-ring token (`color-border-focus`) applied everywhere is simpler to implement correctly and verify than per-component custom focus treatments.
18. Requiring every notification/toast to avoid being the sole carrier of critical information (Section 17) protects users who may miss a transient, auto-dismissing message for any reason, not only accessibility-related ones.
19. Table accessibility (proper semantic structure, not just visual grid styling) is especially important in Admin/internal tools where dense data review is the primary task.
20. This system treats accessibility testing with real assistive technology as necessary because automated tools alone (per `05-design-principles.md` Section 20.4, insight 18) cannot catch every real usability issue.
21. Designing for 44px minimum touch targets from the start avoids the costly retrofit of redesigning cramped mobile interfaces later.
22. Accessible customization forms (Section 14, Section 11.13 of `05-design-principles.md`) matter disproportionately here since customization is a core, not peripheral, platform feature.
23. A consistent error-state pattern that's both visually clear and programmatically announced (Section 14.1, 26.12) serves both sighted and non-sighted users identically well.
24. This document's explicit accessibility requirements reduce the risk of accessibility being treated as a discretionary trade-off under shipping pressure, since it's specified with the same weight as visual requirements.
25. The ultimate accessibility test for this system: could someone using only a keyboard and a screen reader complete a full purchase, unaided, using only what's specified here? The system is designed so the answer is yes.

### 33.5 Top 25 Design Engineering Insights

1. Design Engineering's core function on this platform is to keep Sections 2 (Tokens) and 29 (Figma Organization) synchronized as a single source of truth, not two independently maintained artifacts.
2. A token-driven system (rather than component-by-component hardcoded values) is what makes systemic changes (a rebrand, a dark mode launch) a configuration change rather than a full re-implementation.
3. Enforcing "no arbitrary values" (Section 31) requires tooling/process discipline, not just documentation — this is a core Design Engineering responsibility.
4. Component variants specified in this document (e.g., Button's seven variants) should map to an identical, minimal set of implementation variants — divergence between documented and built variants is a Design Engineering process failure to catch.
5. The naming convention (Section 30) is only valuable if enforced consistently across both Figma and implementation — this bridging responsibility sits squarely with Design Engineering.
6. Accessibility specifications (Section 26) require Design Engineering collaboration to translate into testable, verifiable implementation criteria, not just design intent.
7. A well-maintained component library reduces the marginal cost of every future feature — this compounding value is the primary business case for investing in Design Engineering discipline early.
8. Versioned, documented library changes (Section 29) prevent the common failure mode where a "quick fix" to one component silently breaks its usage elsewhere.
9. Design QA (Section 31) is most effective when it's a shared responsibility between design and engineering, not a late-stage design-only gate.
10. Reserved future-evolution paths (Section 32) only remain viable if today's implementation genuinely avoids the shortcuts that would foreclose them — this requires ongoing Design Engineering vigilance, not just a one-time architectural decision.
11. A consistent elevation/z-index system (Section 11, 2.11) prevents a very common and hard-to-debug class of layering bugs that Design Engineering is well-positioned to catch early via systemic review.
12. Motion tokens (Section 10) being centrally defined rather than per-component allows Design Engineering to tune platform-wide feel (e.g., making everything feel snappier) with a single, low-risk change.
13. This document's careful separation of "what a component is for" from "how many currently exist" is what allows Design Engineering to plan a scalable component roadmap rather than reactively patching individual screens.
14. Bridging Section 29 (Figma) and a future Storybook-equivalent documentation surface is a natural, high-value Design Engineering initiative once this system is implemented.
15. Component composition principles (Section 12.2) directly inform a sensible component hierarchy for implementation, reducing the risk of deeply nested, hard-to-maintain component trees.
16. Design tokens expressed as Figma Variables (Section 29) with a clear tier structure make it feasible to auto-generate at least part of the implementation token set directly from design files, reducing manual transcription error.
17. A shared vocabulary between design and engineering (tokens, component names, state names) meaningfully reduces the friction and ambiguity of day-to-day collaboration.
18. Explicit component QA criteria (Section 31) give Design Engineering an objective basis to flag drift during code review, not just during design review.
19. This system's future-evolution section (Section 32) should inform Design Engineering's technical debt prioritization — features anticipated here deserve proactively flexible implementation today.
20. A consistent breakpoint token set shared between design and implementation (Section 2.14, 27) prevents the common bug where design and code disagree about where a layout should adapt.
21. Reduced-motion and accessibility requirements being system-wide (not per-feature opt-in) simplify Design Engineering's job: build the accessible behavior once, into the shared primitives, rather than per-screen.
22. The system's insistence on single, canonical components (Section 12.3) over duplicated context-specific copies is the single highest-leverage Design Engineering practice for long-term maintainability.
23. Design Engineering should treat every "just this once" custom value or pattern request as a signal to evaluate whether the system itself has a genuine gap (and should be extended) or whether the request should be redirected to an existing pattern.
24. A living, versioned system (Section 29) is more valuable than a perfectly complete but static one — Design Engineering's ongoing maintenance is what keeps this document actually true over time.
25. The ultimate Design Engineering success metric: the time and effort required to build a new, on-brand, accessible screen should decrease over time as the system matures, not increase.

### 33.6 Top 25 Product Insights

1. A comprehensive design system is itself a product investment with a compounding return: every well-specified component reduces the cost of every future feature that uses it.
2. This document operationalizes `05-design-principles.md`'s philosophy into decisions specific enough that two different designers would independently arrive at nearly the same screen.
3. The warm, restrained visual language (Sections 3–5) is a direct expression of the "Craft over Commerce" and "Premium without Luxury Pretension" philosophies — visually distinguishing the product from generic marketplace competitors.
4. Explicit component specifications for both Creator and Admin tooling (Sections 21–22), held to the same rigor as buyer-facing components, reflect the product's stated commitment to treating creators and internal operations with equal design care.
5. A system this detailed reduces product risk around brand dilution as the team scales beyond the founding group's shared intuition.
6. Reserved future-evolution paths (Section 32) reduce the product cost of eventually pursuing roadmap opportunities identified in `00-project-vision.md` Section 26.
7. The system's accessibility rigor (Section 26) directly expands the product's addressable market beyond what a narrower, less careful approach would reach.
8. A token-driven system gives product management a credible answer to "how hard would a rebrand or major visual refresh be" — a common but often poorly-answered business question.
9. This document, paired with `05-design-principles.md`, gives a new team member enough context to make product-aligned design decisions independently, reducing the bottleneck of requiring senior review for every small decision.
10. Component specifications that explicitly enumerate states (Section 12.6) prevent the common product failure of shipping a feature that only works in its ideal, happy-path state.
11. A single consistent design language across the entire platform, including Admin/internal tools, is what makes the platform feel like one coherent product to build and maintain, not several disconnected ones.
12. The system's explicit rejection of manipulative patterns (inherited from `05-design-principles.md` and reinforced in component rules like Confirmation Dialogs, Section 18) is a durable product-trust investment.
13. Design QA (Section 31) functioning as a genuine release gate, not just guidance, is what protects product quality as release velocity increases over time.
14. This document's mobile-first specification throughout (spacing, layout, navigation) directly reflects the dominant usage channel identified in prior research (`02-user-personas.md`).
15. A system that documents "why" alongside "what" (tying components back to specific PRD requirements and journeys) keeps design decisions traceable to real product needs rather than aesthetic preference.
16. The commerce component set (Section 20) reflects the platform's specific multi-vendor, customization-heavy transaction model rather than a generic e-commerce template — a meaningful product differentiation investment.
17. Treating trust-signal components (verification badges, review summaries) as first-class, carefully specified elements (Section 17) operationalizes the platform's core differentiation strategy at the component level.
18. This system anticipates and structurally accommodates Dark Mode, AI, AR, and internationalization (Sections 28, 32) without requiring the product roadmap to be constrained by today's implementation choices.
19. A well-specified Design QA checklist (Section 31) reduces the product risk of inconsistent quality across features built by different team members or contractors over time.
20. The system's insistence on plain, honest content (inherited from `05-design-principles.md` Section 12) throughout every component (Sections 17, 23–24) protects the product's trust-based positioning at a granular, enforceable level.
21. Explicit specification of Empty and Error states (Sections 23–24) as first-class product surfaces, not afterthoughts, protects conversion and retention at exactly the moments competitors often neglect.
22. A shared component vocabulary (Section 30) between design, product, and engineering reduces miscommunication risk during feature specification and review.
23. This document functions as an onboarding artifact as much as a build specification — its long-term product value depends on being genuinely used, not just published.
24. The system's future-evolution sections consistently favor additive extension over structural rework, which directly reduces the product cost and risk of pursuing new opportunities over time.
25. Ultimately, this document exists to ensure that Dreams by Kalakaaar's premium, trustworthy feel is a repeatable system property — not dependent on any single designer's individual judgment being present for every future decision.

### 33.7 Top 25 Business Insights

1. A rigorous, documented design system reduces the long-term cost of design and engineering execution, directly supporting the lean-team assumption in `00-project-vision.md` Section 16.
2. Consistent, accessible design expands total addressable market (older adults, users with disabilities, lower-connectivity users) beyond what competitors with less disciplined design typically reach.
3. A token-driven, themeable architecture (Section 2, 28) reduces the future cost of business-driven visual changes (rebranding, seasonal campaigns, a future dark mode feature) considerably.
4. Design system discipline is a direct lever on engineering velocity and therefore time-to-market — a real, measurable business asset, not just a design nicety.
5. Investing equally in Creator- and Admin-facing component quality (Sections 21–22) protects operational efficiency, which directly affects the KPIs defined in `01-product-requirements.md` Section 10.4.
6. A documented Design QA process (Section 31) reduces the business risk of inconsistent quality as the team scales with new hires or external contributors.
7. The system's explicit rejection of dark patterns and manipulative UI (inherited throughout from `05-design-principles.md`) is a deliberate long-term trust investment over short-term conversion optimization.
8. Reserved structural room for future business models (Wholesale, Corporate, per `04-information-architecture.md` Section 21) reduces the switching cost of pursuing those opportunities when the business is ready.
9. A single coherent visual and interaction language across the entire platform reduces customer confusion and support burden, indirectly protecting the operational KPIs in `01-product-requirements.md`.
10. This system's accessibility investment reduces legal and reputational risk associated with accessibility non-compliance in relevant jurisdictions.
11. A well-documented system reduces key-person dependency risk — the product's visual and interaction quality does not depend on any single designer remaining on the team indefinitely.
12. The premium-but-accessible visual positioning (warm, restrained, never luxury-exclusive) supports a broader addressable market than either a purely budget or purely luxury-positioned competitor could reach.
13. Faster, more consistent component reuse (Section 12.3) directly reduces the marginal engineering cost of each new feature over the product's lifetime.
14. Trust-signal components (verification, reviews, disclosure) being rigorously and consistently specified (Section 17) operationalizes the platform's core differentiation strategy in a way that scales with the catalog.
15. This document reduces onboarding time for new designers and engineers, protecting velocity during team-scaling phases identified as a risk in `00-project-vision.md` Section 21.3.
16. A system this comprehensive is itself a defensible asset — competitors attempting to replicate the platform's premium positioning would need to independently develop equivalent design discipline, not just copy a visual style.
17. Future-evolution readiness (Section 32) across AI, AR, internationalization, and business accounts reduces the future cost of pursuing the business diversification opportunities in `00-project-vision.md` Section 26.
18. Mobile-first design and engineering investment directly protects the primary revenue-generating channel identified in persona and journey research.
19. This system's consistent, calm, non-manipulative interaction patterns (informed by `05-design-principles.md`) are a differentiated growth strategy: sustainable trust-based growth over short-term, trick-driven conversion gains.
20. A documented naming and organization convention (Sections 29–30) reduces coordination overhead as design and engineering teams grow beyond a size where informal alignment is sufficient.
21. Design system investment made early, before the catalog and feature set grow large, is dramatically cheaper than retrofitting consistency onto an already-large, inconsistent product later.
22. This document's rigor signals to future investors, partners, and hires that the product's quality bar is a genuine, sustained organizational discipline, not a one-time launch effort.
23. Reduced redesign risk (via timeless, principle-driven rather than trend-driven choices) protects the business from a recurring, often underestimated cost most competitors will eventually incur.
24. The system's explicit accessibility, performance-perception, and offline-resilience requirements (Sections 25–27) collectively protect the platform's usability across the full range of real-world conditions its actual audience experiences, not just ideal lab conditions.
25. Ultimately, this design system exists to make Dreams by Kalakaaar's stated competitive advantage — structural and design discipline, not just product supply — genuinely operational and defensible at scale, not merely aspirational.

---

*This document is the single source of truth for the visual and interaction design language of Dreams by Kalakaaar v2 — for Figma, for a future Storybook-equivalent component library, and for every screen built from this day forward. No component, color, or pattern should be introduced outside this system without a documented, deliberate extension of it.*