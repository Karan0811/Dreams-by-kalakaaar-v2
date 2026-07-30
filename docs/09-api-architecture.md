# 09 · API Specification — Dreams by Kalakaaar v2

**Document owner:** Principal API Architect
**Status:** Draft for review
**Audience:** Backend Engineering, Frontend Engineering, QA, Security, DevOps, Future team members
**Last updated:** 2026
**Depends on:** 00-project-vision.md, 01-product-requirements.md, 02-user-personas.md, 03-user-journeys.md, 04-information-architecture.md, 05-design-principles.md, 06-design-system.md, 07-ui-screens-wireframes.md, 08-database-design.md
**Precedes:** All route implementations, OpenAPI/Swagger definitions, SDK generation, client integration code

> **This document defines the API contract only.** It contains no route handlers, no controllers, no services, no ORM/database query code, and no framework-specific implementation. Its purpose is to be the single, unambiguous reference from which every endpoint is implemented — front end and back end alike build *against* this document, not around it. Every entity, field, and relationship referenced below traces directly back to 08-database-design.md; if a field is not defined there, it does not appear in a response here without an explicit note.

---

# 1. Introduction

## 1.1 Purpose of the API

The Dreams by Kalakaaar v2 API is the single integration surface between every client — the Buyer App, Creator Dashboard, Admin Panel, Moderator Panel, Support Panel, and the Public Website — and the platform's data and business logic. No client is permitted direct database access; every read and write, across every role, flows through this API. This centralization is deliberate: it is what makes Row-Level Security policies, business-rule enforcement (01-product-requirements.md Section 7), audit logging (08-database-design.md Section 23), and consistent validation possible to guarantee in one place rather than duplicated (and inevitably drifting) across five different frontends.

## 1.2 API Philosophy

Three convictions shape every decision in this document:

1. **The API is a product, not a byproduct.** It has its own consumers (five distinct frontends, and eventually third-party integrations, Section 29), its own versioning lifecycle, and its own quality bar — the same "premium, minimal, modern" standard the product brief sets for UI applies equally to error messages, response shapes, and documentation clarity.
2. **Predictability beats cleverness.** Every resource follows the same conventions for pagination, filtering, error shape, and naming, so a developer who has learned one endpoint has effectively learned them all. Deviating from convention requires a documented reason, not a shortcut.
3. **The API encodes trust, not just data.** Because Dreams by Kalakaaar's differentiator is trust (verified makers, authentic goods, fair moderation), the API surfaces provenance wherever it matters — verification status, review eligibility, order history — rather than hiding it behind opaque booleans.

## 1.3 Design Goals

- **Consistency** — one set of conventions across ~30 resource groups and 8 client-facing roles (Guest, Buyer, Creator, Creator Team Member, Admin, Moderator, Support Executive, Super Admin, per 01-product-requirements.md Section 3).
- **Security by default** — every endpoint states its required authentication and authorization explicitly; nothing is "open by omission."
- **Backward compatibility** — a v1 client should keep working for a defined deprecation window even as the API evolves (Section 27).
- **Scalability** — the contract itself must not preclude horizontal scaling, caching, or read-replica routing (mirrors 08-database-design.md Section 2.7–2.9).
- **Developer experience** — self-describing errors, consistent envelopes, generous examples, and an OpenAPI definition that can generate typed SDKs for the TypeScript frontends without hand-written glue code.
- **Auditability** — every mutating request is traceable end-to-end via correlation IDs (Section 2.13) back to the `AuditLog` row it produced (08-database-design.md Section 23.1).

## 1.4 REST Principles

The API is **resource-oriented REST over HTTPS**, not RPC-style action endpoints, except where a genuine action has no natural resource representation (e.g., `POST /v1/orders/{orderId}/cancel` — an action-suffixed endpoint is preferred here over inventing an artificial "CancellationRequest resource creation" only to satisfy REST purism). Rules:

- Resources are nouns, pluralized (`/products`, `/orders`), never verbs.
- Standard HTTP methods map onto CRUD + defined actions (Section 2.2).
- Resource state is represented, not procedure calls — the client asks the API to change a resource's state (`PATCH /orders/{id}` with `status: cancelled`) only where that mutation is a **simple, unconditional field change**; where the transition carries business rules, side effects, or eligibility checks (see 08-database-design.md Section 4.4's lifecycle philosophy), it is a dedicated action endpoint instead (`POST /orders/{id}/cancel`), so the API can validate, audit, and clearly document the transition's preconditions rather than letting clients silently attempt disallowed state changes through a generic field update.
- HATEOAS (hypermedia links in responses) is **not** used at V1 — it adds client complexity disproportionate to this platform's five known, first-party clients. This may be revisited if/when a public partner API (Section 29) makes discoverability more valuable. Documented as a deliberate simplicity trade-off (Guiding Principle: simplicity over premature sophistication).

## 1.5 Versioning Strategy

The API is versioned in the URL path: `/v1/...`. See Section 27 for the full versioning and deprecation policy. Path-based versioning is chosen over header-based versioning for one reason above all others: **debuggability**. A path-versioned API is trivially inspectable in browser dev tools, curl, logs, and CDN cache keys without needing to inspect request headers — a meaningful win for a lean team that does not yet have dedicated API-platform tooling.

**Alternatives considered:**

| Alternative | Why not chosen |
|---|---|
| Header-based versioning (`Accept: application/vnd.dreamsbykalakaaar.v1+json`) | More "correct" REST purism, but harder to debug, harder to cache at the CDN/edge layer by version, and invisible in casual log inspection — a real cost for a small team without dedicated API tooling. |
| No versioning, evolve in place with additive-only changes | Works until the first genuinely breaking change (a renamed field, a restructured nested object) becomes unavoidable; deferring the decision only delays the pain, and this platform's roadmap (AI search, subscriptions, wholesale — Section 29) makes a breaking change a "when," not an "if." |

## 1.6 Backward Compatibility

Within a major version (`v1`), the following are **guaranteed non-breaking** and may ship at any time without a version bump: adding a new optional request field, adding a new field to a response, adding a new endpoint, adding a new enum value to a field that is documented as "open enum" (Section 2.7), relaxing a validation rule. The following are **breaking** and require a new major version: removing or renaming a field, changing a field's type, changing an endpoint's URL or method, adding a *required* request field, removing an enum value, tightening a validation rule in a way that could reject previously-valid requests.

## 1.7 Scalability Goals

The API contract is designed so the platform can scale from thousands to millions of users, products, and orders (mirroring 08-database-design.md's stated scale target) without a contract-breaking redesign:

- **Cursor-based pagination everywhere** (Section 2.9) — the contract never assumes offset pagination remains cheap at scale.
- **Idempotency keys on all mutating financial/order endpoints** (Section 2.8) — safe client retries under network instability at any traffic volume.
- **Bulk endpoints for high-volume creator operations** (Section 6, Product Bulk Import/Export) — avoids forcing thousands of sequential single-resource calls for legitimate bulk use cases (Small Creative Studios persona, 02-user-personas.md).
- **Explicit rate limiting and its headers** (Section 2.16, Section 8) — the contract documents backpressure from day one rather than treating it as an operational afterthought.
- **Webhook-based async patterns for slow operations** (payment confirmation, bulk import processing, media processing — Section 21) rather than long-held synchronous HTTP requests.

## 1.8 Consistency Rules

1. Every list endpoint supports the same pagination, filtering, and sorting query-parameter conventions (Section 2.9–2.11) unless explicitly noted as an exception with a stated reason.
2. Every resource's timestamps are named `createdAt` / `updatedAt` (never `created_on`, `dateCreated`, etc.) — see Section 2.12 for the full field-naming convention.
3. Every error response uses the same envelope (Section 2.14) regardless of which endpoint or status code produced it.
4. Every resource ID in a URL path is a UUID (mirrors 08-database-design.md Section 26.1) and is validated as such before any business logic runs.
5. Monetary amounts are always represented as integer minor units (e.g., cents) with an explicit currency code alongside — never a floating-point major-unit number — to eliminate an entire class of rounding bugs in a system that moves real money (08-database-design.md Section 14).


---

# 2. API Standards

## 2.1 Naming Conventions

- **URLs:** lowercase, kebab-case for multi-word path segments (`/creator-payouts`, not `/creatorPayouts` or `/creator_payouts`); resource collections are plural nouns (`/products`, `/orders`, `/stores`).
- **JSON fields:** `camelCase` throughout every request and response body, matching the TypeScript frontend's native conventions and avoiding a serialization-layer translation step.
- **Enums:** `SCREAMING_SNAKE_CASE` string values (e.g., `"status": "PENDING_APPROVAL"`), chosen for unambiguous visual distinction from regular string data in logs and payloads.
- **Booleans:** always prefixed `is`/`has`/`can` (`isVerified`, `hasActiveSubscription`, `canCancel`) so intent is unambiguous without reading documentation.
- **IDs:** every resource identifier field is named `id` at the top level of its own object, and `{resource}Id` when referenced from another resource (e.g., a `Product`'s own field is `id`; an `Order`'s reference to it is `productId`).

## 2.2 HTTP Methods

| Method | Usage | Idempotent? | Safe? |
|---|---|---|---|
| `GET` | Retrieve a resource or collection. Never mutates state. | Yes | Yes |
| `POST` | Create a new resource, or trigger a non-idempotent action (e.g., `POST /orders`). | No (unless an Idempotency-Key is supplied, Section 2.8) | No |
| `PUT` | Full replacement of a resource's mutable fields. Used sparingly — most updates are partial. | Yes | No |
| `PATCH` | Partial update of a resource's mutable fields. The default update verb across this API. | Yes (for the fields supplied) | No |
| `DELETE` | Remove a resource. Per 08-database-design.md Section 2.13, this triggers the entity's documented soft-delete/state-transition, never a physical row delete, except for the small set of entities explicitly modeled as hard-deletable (ephemeral cart items, expired tokens). | Yes | No |

Action endpoints that don't map cleanly to CRUD (`cancel`, `approve`, `resend-verification`, `mark-shipped`) are modeled as `POST /{resource}/{id}/{action}` — a deliberate, documented exception to strict REST resource modeling (Section 1.4).

## 2.3 Status Codes

| Code | Meaning | Usage |
|---|---|---|
| `200 OK` | Successful `GET`, `PATCH`, `PUT`, or action `POST` that doesn't create a resource. | |
| `201 Created` | Successful `POST` that creates a new resource. Response includes the created resource and a `Location` header. | |
| `202 Accepted` | Request accepted for asynchronous processing (e.g., bulk import, media processing). Response includes a job/status reference. | |
| `204 No Content` | Successful `DELETE`, or an action that produces no response body. | |
| `400 Bad Request` | Malformed request (invalid JSON, missing required field with no more specific code applicable). | |
| `401 Unauthorized` | Missing or invalid authentication credentials. | |
| `403 Forbidden` | Authenticated, but not authorized for this resource/action (RBAC/ownership failure). | |
| `404 Not Found` | Resource does not exist, **or** the caller is not authorized to know it exists (Section 22.4 — a deliberate anti-enumeration pattern for sensitive resources). | |
| `409 Conflict` | Request conflicts with current resource state (e.g., duplicate email on registration, stock unavailable at checkout, idempotency key reused with a different payload). | |
| `422 Unprocessable Entity` | Request is well-formed but fails business-rule/domain validation (e.g., a Product submitted for publish without required media). | |
| `429 Too Many Requests` | Rate limit exceeded. Includes `Retry-After` header. | |
| `500 Internal Server Error` | Unexpected server fault. Never exposes internal detail to the client (Section 22.7). | |
| `503 Service Unavailable` | Planned maintenance or a downstream dependency (payment processor, storage) is unavailable. | |

**Distinguishing `400` vs. `422`:** `400` means the request could not even be parsed/understood as a valid instance of the resource shape (wrong types, malformed JSON). `422` means the request was understood but violates a business rule that requires domain knowledge to detect (e.g., "a Product must have at least one active variant before publishing," per 08-database-design.md Section 8.1's constraints). This distinction matters for client error-handling logic: `400` errors indicate a client bug; `422` errors indicate a legitimate business-rule rejection the UI should present to the user.

## 2.4 Headers

### 2.4.1 Standard Request Headers

| Header | Required | Purpose |
|---|---|---|
| `Authorization: Bearer {accessToken}` | On all authenticated endpoints | JWT access token (Section 3.1) |
| `Content-Type: application/json` | On all request bodies | Payload format |
| `Accept: application/json` | Recommended | Response format negotiation (JSON is the only supported format at V1) |
| `Idempotency-Key: {uuid}` | Required on financial/order-mutating `POST` endpoints (Section 2.8) | Safe retry support |
| `X-Correlation-Id: {uuid}` | Optional (server-generated if absent) | Request tracing (Section 2.13) |
| `X-Client-Version` | Recommended | Client app version, for compatibility diagnostics and phased-rollout debugging |
| `Accept-Language` | Optional | Locale preference (V1 supports a single locale per 00-project-vision.md Section 24 scope, but the header is honored where feasible to avoid a future breaking change) |

### 2.4.2 Standard Response Headers

| Header | Purpose |
|---|---|
| `X-Correlation-Id` | Echoes or assigns the request's correlation ID |
| `X-RateLimit-Limit` / `X-RateLimit-Remaining` / `X-RateLimit-Reset` | Rate limit state (Section 2.16) |
| `X-Request-Id` | Unique ID for this specific request/response pair, distinct from the (potentially client-supplied, multi-request) correlation ID |
| `Cache-Control` | Explicit caching directive per endpoint (Section 24.1) |
| `ETag` | Present on cacheable `GET` responses supporting conditional requests |

## 2.5 Authentication Headers

All authenticated requests carry a short-lived JWT access token via `Authorization: Bearer {token}`. No authentication credentials are ever accepted via query string (a common but insecure anti-pattern that leaks tokens into logs, browser history, and referrer headers). Full flow detail in Section 3.

## 2.6 Idempotency

Per Section 1.7's scalability goals, every `POST` endpoint that creates a financial or order-affecting resource (`POST /orders`, `POST /payments/intents`, `POST /orders/{id}/refund-requests`) **requires** an `Idempotency-Key` header. The API service persists the key alongside the resulting resource/response for a defined window (recommended: 24 hours). A repeated request with the same key and identical payload returns the original `201`/`200` response without re-executing the operation. A repeated request with the same key and a **different** payload returns `409 Conflict` with an explanation — this is a deliberate safety behavior, not a bug: it surfaces a client-side logic error (reusing a key across genuinely different requests) rather than silently executing the wrong one.

## 2.7 Pagination

Cursor-based pagination is used for all list endpoints, per Section 1.7's scalability rationale (offset pagination degrades at scale, per 08-database-design.md Section 27.6).

**Request parameters:**

| Parameter | Type | Description |
|---|---|---|
| `limit` | integer | Page size. Default `20`, max `100`. |
| `cursor` | string (opaque) | Opaque, server-generated pagination cursor from the prior page's response. Omit for the first page. |

**Response envelope:**

```json
{
  "data": [ /* array of resources */ ],
  "pagination": {
    "nextCursor": "eyJpZCI6IjAxOTAwZm...",
    "hasMore": true,
    "limit": 20
  }
}
```

Total counts are **deliberately omitted** from paginated responses by default (a `COUNT(*)` across millions of rows is expensive and, per 08-database-design.md Section 2.5, the API optimizes the hot browsing path). Where a total is genuinely needed (e.g., an admin table view), it is available via a separate, explicitly-named `?includeTotalCount=true` opt-in parameter, documented per-endpoint where supported, returning an additional `pagination.totalCount` field — clients should not assume this field is present unless they requested it.

## 2.8 Filtering

Filtering uses bracket-suffixed query parameters for operators beyond simple equality, keeping the convention uniform across every list endpoint:

| Pattern | Example | Meaning |
|---|---|---|
| `field=value` | `?status=ACTIVE` | Equality |
| `field[in]=a,b` | `?status[in]=ACTIVE,PAUSED` | Value in set |
| `field[gte]=x` / `field[lte]=x` | `?price[gte]=1000&price[lte]=5000` | Range (minor units) |
| `field[contains]=x` | `?title[contains]=necklace` | Substring match (non-full-text; use `/search` endpoints, Section 7, for ranked full-text search) |

Each endpoint's documentation (Sections 3–20) enumerates its **specific** filterable fields; a filter parameter not in that list is ignored (never silently applied, never a `400` — chosen so that adding a new, more specific filter later is additive/non-breaking per Section 1.6).

## 2.9 Sorting

`?sort=field` for ascending, `?sort=-field` for descending (a leading hyphen), matching a widely-recognized REST convention. Multiple sort keys are comma-separated and applied in order (`?sort=-createdAt,title`). Each endpoint documents its sortable fields explicitly, since sortable fields must be indexed per 08-database-design.md Section 27.5 — arbitrary sorting is not supported.

## 2.10 Searching

Full-text/ranked search is **not** expressed as a filter parameter on list endpoints; it lives at dedicated `/search` endpoints (Section 7) backed by the `SearchIndex` read model (08-database-design.md Section 24.1). This separation keeps list-endpoint semantics simple (structured filters over structured fields) and keeps search semantics (ranking, typo-tolerance, synonyms) in one well-documented place rather than leaking fuzzy-matching behavior into every resource's filter parameters.

## 2.11 Field Naming

- All field names are `camelCase` (Section 2.1).
- Money fields are always a two-field pair: `{name}Amount` (integer, minor units) and `{name}Currency` (ISO 4217 code), e.g., `totalAmount: 499900, totalCurrency: "INR"` — never a single float. This mirrors 08-database-design.md Section 14's money-as-integer-minor-units modeling.
- Nested resource summaries (e.g., an `Order`'s embedded `store` object) include only display-relevant fields, not the full resource — see Section 2.15 (Metadata & Embedding).

## 2.12 Date Format

All dates/timestamps are ISO 8601 in UTC, with millisecond precision, using the `Z` suffix (e.g., `"2026-07-22T14:30:00.000Z"`). The API never returns or accepts localized/offset timestamps — timezone conversion is a client-side presentation concern, per the Timezone Policy below.

## 2.13 Timezone Policy

The API service and database are UTC-only, end to end (matches 08-database-design.md's `created_at`/`updated_at` convention). Clients are responsible for converting to the user's local timezone for display, using the user's stored `timezone` preference (08-database-design.md Section 5.1, `User.timezone`) or the browser/device's detected timezone as a fallback for unauthenticated contexts. This is a deliberate, standard practice: storing and transmitting UTC everywhere eliminates an entire category of daylight-saving and cross-timezone bugs.

## 2.14 UUID Strategy

Every resource ID exposed by the API is a UUID string (mirrors 08-database-design.md Section 26.1), rendered in canonical lowercase hyphenated form (`"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`). The API never exposes internal sequential/auto-increment identifiers, consistent with the database layer's own ID strategy — there is no translation layer to keep in sync, and IDs are safe to expose in URLs without enabling enumeration attacks.

## 2.15 Error Format

Every error response, regardless of status code or endpoint, uses this envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request could not be processed because of a validation error.",
    "details": [
      {
        "field": "email",
        "issue": "must be a valid email address"
      }
    ],
    "correlationId": "b3f1c2e4-9a7d-4e11-8c2a-1f9e0d5b7a33",
    "timestamp": "2026-07-22T14:30:00.000Z"
  }
}
```

- `code` is a stable, machine-readable string (`SCREAMING_SNAKE_CASE`) that clients can branch logic on — never a raw exception class name or free-text-only message.
- `message` is a human-readable, generic summary safe to log and safe to show a developer; it is **not** guaranteed safe to show directly to end users without localization/rewording (client UIs map `code` to user-facing copy, per 06-design-system.md's content/voice guidelines).
- `details` is present only for `400`/`422` validation-class errors and enumerates every field-level issue in one response (not just the first) so a form can highlight all problems at once.
- `correlationId` always matches the response's `X-Correlation-Id` header, letting a developer jump from a UI error toast straight to server-side logs (Section 2.13/22.9).
- Full catalog of `code` values by category is in Section 23.

## 2.16 Success Response Format

Single-resource responses return the resource directly as the response body's top-level object (not nested under a `data` key) — e.g., `GET /products/{id}` returns the Product object at the root. Collection responses use the pagination envelope (Section 2.7), with the array under `data`. This intentional asymmetry (root object for singular, `data`-wrapped for plural) is a widely adopted convention (mirroring Stripe's and GitHub's APIs) that keeps single-resource payloads lean while giving list responses room for pagination metadata without ambiguity about which keys are "the resource" vs. "metadata about the response."

## 2.17 Metadata and Embedding

Some `GET` list/detail endpoints support `?include=` to embed related resources inline and avoid client-side N+1 request chains (e.g., `GET /orders/{id}?include=items,payment` embeds `OrderItem`s and the `Payment` summary in one response). Each endpoint documents its specific supported `include` values; requesting an unsupported value is ignored, not an error (same additive-non-breaking rationale as Section 2.8's filter behavior). Embedded resources use the same shape as their own dedicated endpoint's response, so a client's response-parsing logic is reusable whether a resource arrived embedded or standalone.

## 2.18 Correlation IDs

Every request is assigned a correlation ID (client-supplied via `X-Correlation-Id`, or server-generated if absent) that is propagated through every downstream system the request touches — the API service, the job queue (for any async work the request triggers), and the resulting `AuditLog`/`SecurityEvent` rows (08-database-design.md Sections 23.1, 23.5). This is the backbone of the platform's debuggability: a support agent investigating a buyer's "my payment failed" report can trace the exact request, its downstream effects, and its audit trail from one ID.

## 2.19 Tracing IDs

Distinct from the request-scoped Correlation ID, a **Trace ID** (`X-Trace-Id`, following W3C Trace Context conventions where feasible) spans an entire distributed operation that may involve multiple requests (e.g., checkout → payment webhook → order confirmation notification). This is primarily an observability/infrastructure concern (APM tooling) rather than a client-facing contract element, documented here so its existence and header name are agreed upon before implementation, avoiding two different naming schemes emerging independently in the API service and the job-queue workers.

## 2.20 Rate Limit Headers

See Section 8 for full rate-limiting policy. Every response (successful or not) includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` (Unix timestamp of window reset), so clients can proactively back off before hitting `429`, rather than only reacting after the fact.


---

# 3. Authentication APIs

Base path: `/v1/auth`. All authentication endpoints are **unauthenticated** (no bearer token required) except where noted. This domain implements the flows required by 08-database-design.md Section 5 (Identity domain) and integrates with the platform's chosen auth provider (Section 1.9).

## 3.1 Authentication Model

- **Access tokens:** short-lived JWTs (recommended TTL: 15 minutes), carrying `sub` (User ID), `roles`, and `storeId` (if the active session context is a specific Store, for Creator Team Members with multi-store access, per 08-database-design.md Section 6.4). Signed with an asymmetric key so the API service (and any future microservice) can verify tokens without a round-trip to an auth database.
- **Refresh tokens:** long-lived (recommended TTL: 30 days), opaque, single-use with rotation (mirrors 08-database-design.md Section 5.5's rotation-lineage design), stored hashed, delivered as an `HttpOnly`, `Secure`, `SameSite=Strict` cookie — never in a JSON response body or `localStorage`, to mitigate XSS-based token theft (Section 22.3).
- **Access tokens** are returned in the JSON response body (not a cookie) and held in memory by the client, re-fetched via `POST /v1/auth/refresh` on expiry using the refresh cookie.

## 3.2 POST /v1/auth/register

Creates a new `User` (08-database-design.md Section 5.1) with role `Buyer` by default (Creator onboarding is a separate, subsequent flow — Section 5.1 — since becoming a Creator requires an approval workflow, not just signup).

**Request:**
```json
{
  "email": "buyer@example.com",
  "password": "Str0ngP@ssword!",
  "displayName": "Asha Rao",
  "marketingConsent": true
}
```

**Validation rules:** `email` — valid format, checked against existing `User.email` for uniqueness (08-database-design.md Section 5.1); `password` — minimum 10 characters, must include at least one letter and one number (specific policy owned by Security, Section 22.1); `displayName` — 2–50 characters.

**Response `201 Created`:**
```json
{
  "id": "9c3e1a20-...",
  "email": "buyer@example.com",
  "displayName": "Asha Rao",
  "status": "PENDING_EMAIL_VERIFICATION",
  "createdAt": "2026-07-22T14:30:00.000Z"
}
```
No access/refresh tokens are issued at this point — see Section 3.5 (Email Verification). This is a deliberate security posture: an unverified email should not yet grant a usable session, per 01-product-requirements.md's authentication business rules.

**Errors:** `409 EMAIL_ALREADY_REGISTERED`, `422 VALIDATION_ERROR`.

## 3.3 POST /v1/auth/login

**Request:** `{ "email": "...", "password": "..." }`

**Response `200 OK`:**
```json
{
  "accessToken": "eyJhbGciOi...",
  "expiresIn": 900,
  "user": { "id": "...", "email": "...", "displayName": "...", "roles": ["BUYER"] }
}
```
A `Set-Cookie` header issues the refresh-token cookie (Section 3.1). If the account has MFA enabled (future, Section 3.16), this endpoint instead returns `200 OK` with `{ "mfaRequired": true, "mfaChallengeToken": "..." }` and no access token, pending `POST /v1/auth/mfa/verify`.

**Errors:** `401 INVALID_CREDENTIALS` (deliberately identical error/message whether the email doesn't exist or the password is wrong, to avoid account enumeration — Section 22.4), `403 ACCOUNT_SUSPENDED` / `403 ACCOUNT_BANNED` (with a support-contact reference in `details`), `429 TOO_MANY_ATTEMPTS` (brute-force throttling, Section 8.3).

## 3.4 POST /v1/auth/logout

**Auth required.** Revokes the current refresh token (deletes/invalidates the corresponding `RefreshToken` row, 08-database-design.md Section 5.5) and clears the refresh cookie. Response `204 No Content`. Does not invalidate the still-live access token (it simply expires naturally within its short TTL) — documented as an accepted trade-off, since revoking already-issued short-lived JWTs immediately would require a server-side denylist check on every request, undermining the stateless-verification benefit of JWTs for a 15-minute exposure window. See Section 3.10 (Sessions) for a "log out everywhere" endpoint that does force-invalidate more aggressively for security-sensitive scenarios.

## 3.5 POST /v1/auth/refresh

Exchanges a valid refresh-token cookie for a new access token (and rotates the refresh token, per Section 3.1). **No `Authorization` header required** — this endpoint's auth is the refresh cookie itself. Response mirrors `POST /v1/auth/login`'s success shape. **Errors:** `401 INVALID_REFRESH_TOKEN` (expired, revoked, or reused-after-rotation — the latter case additionally triggers a `SecurityEvent`, 08-database-design.md Section 23.5, since token-reuse is a signature of token theft).

## 3.6 POST /v1/auth/forgot-password

**Request:** `{ "email": "..." }`. **Response `200 OK`** with a generic `{ "message": "If an account exists for this email, a reset link has been sent." }` **regardless of whether the email exists** — another anti-enumeration measure (Section 22.4). Internally creates a `PasswordReset` row (08-database-design.md Section 5.8) and triggers an email `Notification` (Section 17).

## 3.7 POST /v1/auth/reset-password

**Request:** `{ "token": "...", "newPassword": "..." }`. Validates the token against `PasswordReset` (unexpired, unconsumed). On success: updates the credential, marks the token consumed, revokes **all** existing refresh tokens/sessions for the user (a password reset is a strong security signal — every other session should die), and logs a `SecurityEvent`. Response `204 No Content`. **Errors:** `400 INVALID_OR_EXPIRED_TOKEN`, `422 VALIDATION_ERROR` (password policy).

## 3.8 POST /v1/auth/verify-email

**Request:** `{ "token": "..." }`. Validates against `EmailVerification` (08-database-design.md Section 5.6). On success: `User.status` transitions from `PENDING_EMAIL_VERIFICATION` to `ACTIVE`, and — unlike registration — **this endpoint does issue tokens**, logging the newly-verified user straight in (response shape matches `POST /v1/auth/login`), removing friction from the signup→first-use path. **Errors:** `400 INVALID_OR_EXPIRED_TOKEN`.

## 3.9 POST /v1/auth/resend-verification

**Auth optional** (accepts either an authenticated request from a logged-in-but-unverified user, or an unauthenticated `{ "email": "..." }` body with the same anti-enumeration generic response as Section 3.6). Rate-limited more aggressively than most endpoints (Section 8.3) to prevent email-bombing abuse.

## 3.10 GET /v1/auth/sessions

**Auth required.** Lists the caller's active sessions (08-database-design.md Section 5.4/5.10) — device name, IP-derived approximate location, last-active timestamp, current-session flag. Powers an Account Settings "where you're logged in" screen (07-ui-screens-wireframes.md).

## 3.11 DELETE /v1/auth/sessions/{sessionId}

**Auth required.** Revokes a specific session (e.g., a lost/stolen device). **`DELETE /v1/auth/sessions` (no ID)** revokes **all** sessions except the current one — the "log out everywhere else" action. Response `204 No Content`.

## 3.12 GET /v1/auth/me

**Auth required.** Returns the current authenticated `User`'s core identity + role summary — the endpoint every client calls on app boot to hydrate session state.

```json
{
  "id": "9c3e1a20-...",
  "email": "buyer@example.com",
  "displayName": "Asha Rao",
  "avatarUrl": "https://cdn.dreamsbykalakaaar.com/...",
  "roles": ["BUYER"],
  "isCreator": false,
  "emailVerified": true,
  "createdAt": "2026-01-14T09:12:00.000Z"
}
```

## 3.13 POST /v1/auth/change-password

**Auth required.** Requires current password + new password in the body (re-authentication for a sensitive action, per Security guidance, Section 22.1). Revokes all other sessions on success (same rationale as Section 3.7). `204 No Content`.

## 3.14 POST /v1/auth/oauth/{provider}

Where `{provider}` is `google` or `apple` (per platform decisions; extensible without a version bump per Section 1.6). Implements the OAuth authorization-code exchange: the client sends the provider's authorization code, the API service exchanges it server-side (never trusting a client-supplied ID token without server verification), creates or links an `AuthenticationAccount` (08-database-design.md Section 5.3), and returns the standard login-success shape. **Errors:** `409 OAUTH_ACCOUNT_ALREADY_LINKED_TO_DIFFERENT_USER`.

## 3.15 DELETE /v1/auth/account

**Auth required.** Initiates account deletion per the erasure-request path documented in 08-database-design.md Section 29.4 — this does **not** hard-delete synchronously; it transitions `User.status` to `pending_deletion`, sends a confirmation email with a cancellation window (recommended: 14 days), and a background job performs the actual data-minimization/hard-delete of eligible fields after the window closes, honoring Section 2.16's retention rules for financial/legal records. Response `202 Accepted` with a `{ "deletionScheduledFor": "..." }` payload.

## 3.16 MFA Endpoints (Future — Contract Reserved)

Per 00-project-vision.md's phased roadmap, MFA ships post-V1. The contract is reserved now to avoid a breaking change later: `POST /v1/auth/mfa/enroll`, `POST /v1/auth/mfa/verify`, `POST /v1/auth/mfa/disable`, `GET /v1/auth/mfa/backup-codes`. These map directly onto 08-database-design.md Section 5.9's `MFA` entity and are documented here as placeholders so the `POST /v1/auth/login` response shape (`mfaRequired`/`mfaChallengeToken`, Section 3.3) is correct from V1 launch even before MFA itself ships — adding the actual enrollment/verification endpoints later is additive, not breaking.

---

# 4. User APIs

Base path: `/v1/users`. Covers buyer-side (and shared) account data — 08-database-design.md's Customer domain (Section 11) plus the shared `UserProfile` (Section 5.2). All endpoints in this section operate on **the authenticated caller's own data** (`/v1/users/me/...`) except where explicitly noted as admin-scoped (those live under `/v1/admin/users`, Section 15).

## 4.1 GET /v1/users/me/profile · PATCH /v1/users/me/profile

`GET` returns the combined `User` + `UserProfile` + `BuyerProfile` view. `PATCH` accepts a partial update of mutable fields (`displayName`, `bio`, `avatarMediaId`, `pronouns`, timezone/locale). Email and phone changes are **not** accepted here — see Section 4.2, since changing a verified contact method re-triggers verification (08-database-design.md Section 5.6/5.7) and warrants its own explicit flow rather than being buried in a generic profile PATCH.

## 4.2 POST /v1/users/me/email · POST /v1/users/me/phone

Initiates a contact-method change: creates a new `EmailVerification`/`PhoneVerification` row scoped to the *new* value, sends the verification code/link, and does **not** update the live `User.email`/`phone` field until `POST /v1/users/me/email/confirm` (analogous to Section 3.8) is called with the code. This two-step pattern prevents an account takeover via a typo'd or attacker-supplied email silently becoming the account's login identity.

## 4.3 POST /v1/users/me/avatar

`multipart/form-data` upload, delegating to the Media pipeline (Section 20) — this endpoint is a thin wrapper that uploads via the shared upload flow and then sets `UserProfile.avatarMediaId`, rather than duplicating upload/validation logic.

## 4.4 Addresses — `/v1/users/me/addresses`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/v1/users/me/addresses` | List saved addresses (08-database-design.md Section 11.2). Not paginated — address books are small by nature; a flat array is returned. |
| `POST` | `/v1/users/me/addresses` | Create a new address. |
| `GET` | `/v1/users/me/addresses/{id}` | Retrieve one. |
| `PATCH` | `/v1/users/me/addresses/{id}` | Update. **Rejected with `409 ADDRESS_IN_USE_BY_PENDING_ORDER`** if the address is currently referenced by a non-final `CheckoutSession` (rare race, but documented since the database layer snapshots addresses at order time, per 08-database-design.md Section 2.3 — editing an address mid-checkout would be surprising). |
| `DELETE` | `/v1/users/me/addresses/{id}` | Remove. Hard-deletable per 08-database-design.md Section 2.13 (ephemeral once unreferenced by any Order, since Orders snapshot their own copy). |
| `POST` | `/v1/users/me/addresses/{id}/set-default` | Sets this address as default shipping address, atomically unsetting any prior default (enforces the "exactly one default" invariant from 08-database-design.md Section 26.5/26.6). |

**Address object shape:**
```json
{
  "id": "...",
  "label": "Home",
  "recipientName": "Asha Rao",
  "line1": "221B Residency Road",
  "line2": null,
  "city": "Bengaluru",
  "region": "Karnataka",
  "postalCode": "560025",
  "country": "IN",
  "phone": "+91XXXXXXXXXX",
  "isDefault": true,
  "createdAt": "..."
}
```

## 4.5 Preferences — `/v1/users/me/preferences`

`GET`/`PATCH` over a single combined resource merging 08-database-design.md's `Preferences`, `NotificationPreferences`, and `PrivacyPreferences` (Sections 11.8–11.10) into one client-facing object (the split is a database-layer domain-ownership decision, per 08-database-design.md Guiding Principle 2, but need not be surfaced as three separate API round-trips for what the UI presents as one Settings screen — see Section 2.17's embedding philosophy applied here as a deliberate response-shape simplification rather than a literal 1:1 mirror of table structure).

```json
{
  "preferredCategories": ["home-decor", "jewelry"],
  "notifications": {
    "email": { "orderUpdates": true, "marketing": false, "priceDrops": true },
    "push": { "orderUpdates": true, "newMessages": true },
    "sms": { "orderUpdates": false }
  },
  "privacy": {
    "marketingConsent": true,
    "dataSharingConsent": false
  }
}
```

## 4.6 Wishlist — `/v1/users/me/wishlists`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/v1/users/me/wishlists` | List the buyer's named wishlists (08-database-design.md Section 11.3). |
| `POST` | `/v1/users/me/wishlists` | Create a new named wishlist. |
| `GET` | `/v1/users/me/wishlists/{id}/items` | Paginated wishlist items, each embedding a Product summary (Section 2.17). |
| `POST` | `/v1/users/me/wishlists/{id}/items` | Add a product (`{ "productId": "...", "variantId": "...", "note": "..." }`). Returns `409 ALREADY_IN_WISHLIST` if already present (idempotent-in-intent, not idempotent-in-mechanism — see Section 2.6's distinction; this uses a conflict response rather than the Idempotency-Key mechanism since it's not a payment-affecting mutation). |
| `DELETE` | `/v1/users/me/wishlists/{id}/items/{itemId}` | Remove. |

A convenience alias `POST /v1/products/{productId}/wishlist` / `DELETE /v1/products/{productId}/wishlist` targets the buyer's **default** wishlist directly, since the overwhelmingly common case (per 07-ui-screens-wireframes.md's PDP "save" heart icon) is a single-tap save without wishlist selection — the nested-resource form above remains available for the full multi-wishlist management UI.

## 4.7 Notifications — `/v1/users/me/notifications`

See Section 17 for the full Notification API; the user-facing subset is summarized here for discoverability: `GET /v1/users/me/notifications` (paginated in-app notification feed), `POST /v1/users/me/notifications/{id}/read`, `POST /v1/users/me/notifications/read-all`.

## 4.8 Recently Viewed — `GET /v1/users/me/recently-viewed`

Paginated, most-recent-first list of Products the caller has viewed, sourced from `Events`/`ProductViews` (08-database-design.md Sections 21.2–21.3) filtered to the current user. **Not user-editable** beyond a bulk `DELETE /v1/users/me/recently-viewed` (clear history) — individual-item removal is intentionally not exposed, since this is a low-stakes convenience feature where a "clear all" is sufficient and a per-item removal UI/endpoint would be disproportionate engineering effort for the value it adds.

## 4.9 Saved Searches — `/v1/users/me/saved-searches`

`GET`/`POST`/`DELETE` over stored search queries + filter combinations a buyer wants to revisit or (future) be alerted about (e.g., "notify me about new wedding-gift jewelry under ₹5,000"). At V1, this is storage + retrieval only; alerting is a Section 29 future capability noted here so the resource shape (which already includes an `alertsEnabled: false` field, defaulted off) doesn't need a breaking change when alerting ships.

## 4.10 Account Settings — `/v1/users/me/account`

`GET` returns account-level metadata not covered by `/profile` (linked `AuthenticationAccount`s, active role summary, account creation source). This is distinct from `/v1/auth/me` (Section 3.12, minimal session-hydration shape) — `/v1/users/me/account` is the fuller settings-screen payload, intentionally split so the app-boot call (`/auth/me`) stays as small and fast as possible.


---

# 5. Creator APIs

Base path: `/v1/creator` for the acting creator's own resources (analogous to `/v1/users/me`), and `/v1/stores/{storeId}/...` for store-scoped resources reachable by the store's team (08-database-design.md Section 7). Every endpoint under `/v1/stores/{storeId}` enforces `StoreTeam` membership (Section 6.4/7.7) via RBAC (Section 22.2) — a request from a `User` who is not on that store's team returns `403 FORBIDDEN`, and per Section 2.3's `404`-for-unauthorized policy on sensitive resources, store-management endpoints specifically return `403` (not `404`) because store existence is not itself sensitive (storefronts are public), only management access is.

## 5.1 Creator Registration — `POST /v1/creator/apply`

**Auth required (as an existing Buyer `User`).** Submits a creator application (08-database-design.md Section 7.1, `Creator.onboarding_status: pending_review`).

**Request:**
```json
{
  "legalName": "Meera Textiles",
  "businessName": "Meera Textiles",
  "creatorCategory": "INDEPENDENT_ARTISAN",
  "craftFocus": "hand-block-printing",
  "storeNamePreference": "Meera Textiles Co.",
  "portfolioDescription": "..."
}
```
**Response `201 Created`** with the `Creator` resource in `pending_review` status. Does **not** create a `Store` yet (per 08-database-design.md Section 7.2's lifecycle — a `Store` is created in `draft` status only on `Creator` approval, Section 5.2 below).

## 5.2 GET /v1/creator/application

Returns the caller's application status (`pending_review`, `approved`, `rejected`) plus any reviewer feedback, for a status-tracking screen. On `approved`, the response includes the newly-created `storeId`.

## 5.3 Creator Profile — `GET /v1/creator/profile` · `PATCH /v1/creator/profile`

The `Creator` entity's own fields (08-database-design.md Section 7.1) — legal/business identity, creator category, onboarding status — distinct from `Store` (public-facing) and `UserProfile` (shared). Legal-name/tax-identifier changes on `PATCH` trigger a re-verification flag rather than applying instantly (business rule, consistent with the platform's trust posture).

## 5.4 Store Details — `/v1/stores/{storeId}`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/v1/stores/{storeId}` | Public storefront data — **unauthenticated**, this is the endpoint powering the public Store page (07-ui-screens-wireframes.md). Returns `Store` + embedded `StoreBranding` + aggregate stats (`productCount`, `averageRating`, `reviewCount`). |
| `PATCH` | `/v1/stores/{storeId}` | Update core store fields (name, tagline, category). Team-authenticated. Slug is immutable once the store has any published Product or completed Order (08-database-design.md Section 7.2) — attempting to change it returns `422 SLUG_IMMUTABLE`. |
| `POST` | `/v1/stores/{storeId}/publish` | Transitions `Store.status` from `draft` to `active`. Validates the `StoreVerification` precondition (08-database-design.md Section 7.5) server-side; returns `422 STORE_NOT_VERIFIED` if unmet. |
| `POST` | `/v1/stores/{storeId}/pause` · `POST /v1/stores/{storeId}/resume` | Creator-initiated pause (e.g., vacation without using formal Vacation Mode scheduling, Section 5.7) / resume. |

## 5.5 Store Branding — `/v1/stores/{storeId}/branding`

`GET`/`PATCH` over `StoreBranding` (08-database-design.md Section 7.3) — logo, banner, brand color, about/story content. Logo/banner fields accept a `mediaId` (uploaded via Section 20 first, then referenced here), never raw binary in this endpoint's body.

## 5.6 Store Policies — `/v1/stores/{storeId}/policies`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/v1/stores/{storeId}/policies` | Current effective policy set (shipping, returns, custom-order terms), public. |
| `PUT` | `/v1/stores/{storeId}/policies/{policyType}` | Creates a **new version** of the given policy type (08-database-design.md Section 7.4's versioning philosophy — this is a `PUT` that logically creates, not overwrites, per the append-only-version pattern; documented as a deliberate exception to the "PUT = full replacement in place" convention because the underlying entity is itself versioned). |
| `GET` | `/v1/stores/{storeId}/policies/{policyType}/history` | Full version history, for support/dispute-resolution tooling. |

## 5.7 Vacation Mode — `/v1/stores/{storeId}/vacation-mode`

`GET`/`PUT` over `StoreSettings.vacationMode` (08-database-design.md Section 7.9) — `{ "isEnabled": true, "returnDate": "2026-08-15", "message": "Back Aug 15!" }`. When enabled, the platform (server-side, not client-trusted) hides the store's Products from search/browse endpoints (Section 7) and surfaces the vacation message on the storefront and at add-to-cart time for anyone with the product already in an active cart.

## 5.8 Verification & Documents — `/v1/creator/verification`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/v1/creator/verification` | Current `StoreVerification` status (08-database-design.md Section 7.5). |
| `POST` | `/v1/creator/verification/documents` | Uploads a verification document (ID proof, business registration) via the Media pipeline (Section 20), attaching it as evidence. Response `202 Accepted` — verification review is asynchronous, performed by Admin/Moderator staff (Section 15/16), not instant. |
| `GET` | `/v1/creator/verification/documents` | List submitted documents + their individual review status. |

Document contents are never returned in list/detail responses as inline data — only a short-lived, signed download URL (Section 20.9), and only to the uploading creator and authorized internal staff, enforced by RBAC (Section 22.2) and audited on every access (08-database-design.md Section 23.1) given the sensitivity of identity documents.

## 5.9 Bank & Tax Details — `/v1/creator/payout-account`

`GET`/`PUT` over the creator's payout-destination details, feeding `Payout` (08-database-design.md Section 14.5). **This endpoint never returns full account numbers in `GET` responses** — only masked display values (e.g., `"accountNumberMasked": "****1234"`), consistent with 08-database-design.md Section 29.1's encryption/exposure posture for sensitive financial fields; the full value is write-only, accepted on `PUT` and immediately encrypted at rest, never echoed back. Updating payout details triggers a mandatory re-verification hold (configurable window, e.g., 24–48 hours) before the new details become payout-eligible, a standard anti-fraud control against account-takeover-driven payout redirection.

## 5.10 Creator Dashboard — `GET /v1/creator/dashboard`

A single, purpose-built aggregate endpoint (a deliberate exception to strict per-resource REST modeling, justified the same way as Section 4.5) returning the at-a-glance summary the Creator Dashboard home screen needs in one round trip: open-order count, pending-message count, low-stock alert count, this-week revenue snapshot, recent `OrderTimeline` events. Backed by `StoreAnalytics` (08-database-design.md Section 7.6) and other denormalized/precomputed sources — this endpoint is explicitly documented as **eventually consistent** (may lag the true live state by up to the background-refresh interval, Section 24.3) and clients should not treat it as a source of truth for anything requiring strict correctness (e.g., it must never be the basis for an inventory-availability decision at checkout).

## 5.11 Creator Analytics — `/v1/stores/{storeId}/analytics`

| Endpoint | Description |
|---|---|
| `GET /v1/stores/{storeId}/analytics/overview?period=` | `StoreAnalytics` rollup (08-database-design.md Section 7.6) for a given period (`7d`, `30d`, `90d`, `custom` with `from`/`to`). |
| `GET /v1/stores/{storeId}/analytics/products` | Per-product performance (`ProductAnalytics`, Section 8.13) — views, conversion, wishlist adds, sorted by any of those metrics. |
| `GET /v1/stores/{storeId}/analytics/export` | Triggers an async CSV export job (Section 20.8-style async pattern); response `202 Accepted` with a job reference, resolved via `GET /v1/jobs/{jobId}` (Section 6.11's bulk-job polling pattern, shared infrastructure). |

## 5.12 Creator Payouts — `/v1/stores/{storeId}/payouts`

`GET` (paginated list, mirrors `Payout`, 08-database-design.md Section 14.5), `GET /v1/stores/{storeId}/payouts/{payoutId}` (detail, including the contributing `SubOrder`/`Commission` breakdown), `GET /v1/stores/{storeId}/payouts/{payoutId}/statement` (returns a signed URL to a generated PDF statement, via the Media pipeline). All read-only from the creator's side — payouts are system/finance-initiated (Section 12), never creator-triggered, consistent with the money-flow model in 08-database-design.md Section 14.11.

## 5.13 Creator Reviews — `GET /v1/stores/{storeId}/reviews`

Read-only aggregate/listing of Reviews across the store's Products (08-database-design.md Section 16.1), for the Creator Dashboard's reputation view. Reply-posting lives at the Review resource itself (Section 13.4), not duplicated here.

## 5.14 Creator Followers (Future — Contract Reserved)

`GET /v1/stores/{storeId}/followers` and `POST/DELETE /v1/stores/{storeId}/follow` are reserved for the Community Features direction named in 00-project-vision.md Section 26, out of scope for V2. Documented here only to confirm the URL shape is pre-agreed and won't collide with a differently-shaped endpoint introduced ad hoc later.

---

# 6. Product APIs

Base path: `/v1/products` for public/buyer-facing reads, `/v1/stores/{storeId}/products` for creator-side writes — a deliberate split (rather than one path serving both) because the two audiences have materially different filtering, field-visibility, and authorization needs (public reads never see `draft`/`pending_approval` products or internal fields like `ProductApproval` history; creator writes need exactly those).

## 6.1 GET /v1/products (Public Listing)

**Unauthenticated-friendly** (works without a token; personalization such as wishlist-state is added when authenticated). The primary category/collection browsing endpoint.

**Supported filters (Section 2.8):** `categoryId`, `storeId`, `price[gte]`/`price[lte]`, `materialId[in]`, `techniqueId[in]`, `tagId[in]`, `isMadeToOrder`, `occasionId`. **Supported sorts (Section 2.9):** `-createdAt` (default, "newest"), `price`, `-price`, `-averageRating`, `-unitsSold` ("best-selling"). Only `status=ACTIVE` Products are ever returned by this endpoint — `status` is not a client-supplied filter here (it's implicitly and non-overridably scoped), since exposing draft/pending inventory publicly would be a data leak.

**Response item shape (list view — intentionally lean, per 08-database-design.md Section 2.3's denormalized-for-browsing philosophy):**
```json
{
  "id": "...",
  "title": "Hand Block-Printed Cotton Scarf",
  "slug": "hand-block-printed-cotton-scarf",
  "storeId": "...",
  "storeName": "Meera Textiles",
  "primaryImageUrl": "https://cdn.../thumb.jpg",
  "priceFromAmount": 89900,
  "priceFromCurrency": "INR",
  "averageRating": 4.8,
  "reviewCount": 132,
  "isMadeToOrder": false,
  "isWishlisted": false
}
```

## 6.2 GET /v1/products/{idOrSlug}

Full Product Detail Page payload — accepts either the UUID or the `(storeId, slug)`-resolved canonical slug path `/v1/products/by-slug/{storeSlug}/{productSlug}` (both documented since 04-information-architecture.md's URL architecture uses human-readable slugs at the frontend routing layer while internal references use IDs; the API supports both entry points rather than forcing the frontend to resolve slug→ID in a separate round trip). Response embeds (`?include=` optional refinement, default includes the common PDP needs): `variants`, `media` (ordered gallery), `specifications`, `disclosures`, `customizationOptions`, `store` (summary), `category` (breadcrumb chain, from `SEOHierarchy`, 08-database-design.md Section 10.9).

## 6.3 Product CRUD (Creator-Side) — `/v1/stores/{storeId}/products`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/v1/stores/{storeId}/products` | Creator's own product list, all statuses, team-authenticated. Supports `status[in]` filter unlike the public endpoint. |
| `POST` | `/v1/stores/{storeId}/products` | Creates a new `Product` in `draft` status (08-database-design.md Section 8.1). Minimal required fields at creation (`title`); the rest is filled in via subsequent `PATCH` calls against the working draft — mirrors the `ProductDraft` entity's role (Section 8.16) as an evolving work-in-progress distinct from a fully-specified publish-ready listing. |
| `GET` | `/v1/stores/{storeId}/products/{id}` | Full creator-side detail, including internal fields (`ProductApproval` history summary, `ProductStatusHistory`). |
| `PATCH` | `/v1/stores/{storeId}/products/{id}` | Partial update. If the Product is currently `active`, edits are staged into `ProductDraft` (08-database-design.md Section 8.16) rather than applied live, **unless** the field is explicitly flagged as a "safe live edit" (e.g., typo fixes to description below a change-magnitude threshold — implementation detail deferred, but the *contract* distinction between "requires re-review" and "applies immediately" is owned here and must be documented per-field in the OpenAPI spec, Section 26). |
| `DELETE` | `/v1/stores/{storeId}/products/{id}` | Archives the product (soft, per 08-database-design.md Section 2.13) — `status → archived`. Blocked with `409 PRODUCT_HAS_PENDING_ORDERS` if in-flight orders reference it (Restrict-adjacent business rule; the underlying `OrderItem` snapshot means the *product* can still archive safely from a data-integrity standpoint, but the platform blocks it anyway as a UX safeguard so a creator doesn't accidentally disappear a listing a buyer is mid-transaction on — override available via `?force=true` for legitimate cases, logged specially). |

## 6.4 Drafts & Publishing

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/v1/stores/{storeId}/products/{id}/draft` | Current unpublished working state (08-database-design.md Section 8.16). |
| `POST` | `/v1/stores/{storeId}/products/{id}/submit-for-review` | Transitions to `pending_approval`, creating a `ProductApproval` row (Section 8.17). Server-side validates the publish-readiness business rules (≥1 active variant, ≥1 primary media with alt text, required disclosures for the category — 08-database-design.md Section 8.1/22.7/8.11) and returns `422 PRODUCT_NOT_PUBLISH_READY` with a `details` array enumerating every unmet requirement if validation fails, so the Creator Dashboard can surface a complete checklist in one round trip rather than one error at a time. |
| `POST` | `/v1/stores/{storeId}/products/{id}/publish` | **Internal/system-triggered** (called by the moderation approval workflow, Section 16, not directly by creators) — transitions `pending_approval → active` on approval. Exposed in this document for completeness of the state machine, but access-restricted to the Moderation service role. |

## 6.5 Variants — `/v1/stores/{storeId}/products/{id}/variants`

Standard nested CRUD (`GET`/`POST`/`GET :id`/`PATCH :id`/`DELETE :id`) over `ProductVariant` (08-database-design.md Section 8.2). `DELETE` is blocked with `409` while the variant has any non-zero `Inventory.availableQuantity` unless `?force=true`, and always blocked (no override) if the variant has ever appeared in an `OrderItem` — archived instead (`status → archived`), never hard-deleted, per the database layer's Restrict rule.

## 6.6 Inventory — `/v1/stores/{storeId}/variants/{variantId}/inventory`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `.../inventory` | Current `Inventory` snapshot (08-database-design.md Section 9.1). |
| `POST` | `.../inventory/adjustments` | Creates an `InventoryTransaction` (Section 9.2) of type `manual_adjustment` — the only creator-facing write path onto inventory; there is deliberately no raw `PATCH` on the quantity field itself, since every stock change must be an auditable, typed transaction, never a silent overwrite. |
| `GET` | `.../inventory/transactions` | Paginated ledger history (Section 9.2), for reconciliation/support. |

## 6.7 Pricing — `PATCH /v1/stores/{storeId}/products/{id}/variants/{variantId}/price`

A narrowly-scoped, dedicated pricing endpoint (rather than folding into the general variant `PATCH`) because price changes are business-sensitive enough to warrant their own audit granularity and, at V2 launch, their own validation (e.g., a maximum single-change percentage guardrail to catch fat-finger pricing errors before they go live — a documented future enhancement, not a V1 hard requirement, but the dedicated endpoint gives room to add it non-breakingly).

## 6.8 Discounts — `/v1/stores/{storeId}/products/{id}/discounts`

Store/product-level promotional pricing, distinct from platform-wide `Coupons` (Section 6.9 of the database doc / Section 9 here). `GET`/`POST`/`DELETE` over a discount window (`{ "type": "PERCENTAGE", "value": 15, "startsAt": "...", "endsAt": "..." }`) applied to specific variants or the whole product.

## 6.9 Collections, Categories, Tags (Read Endpoints)

| Endpoint | Description |
|---|---|
| `GET /v1/categories` | Full category tree (08-database-design.md Section 10.1), cacheable long-TTL (Section 24.1) since it changes rarely. |
| `GET /v1/categories/{idOrSlug}` | Single category + its direct children + breadcrumb path. |
| `GET /v1/collections` | Published `Collection`s (Section 10.3), paginated. |
| `GET /v1/collections/{idOrSlug}` | Collection detail + its curated Product list (paginated). |
| `GET /v1/tags` · `GET /v1/materials` · `GET /v1/techniques` | Reference/taxonomy lookups powering filter UI (08-database-design.md Sections 8.6–8.7). |

Category/Collection/Tag/Material/Technique **write** endpoints are Admin/CMS-scoped (Section 18), not creator-facing — creators *apply* taxonomy to their products (via the Product `PATCH` payload's `categoryIds`/`tagIds` fields) but do not create new taxonomy terms themselves, per 08-database-design.md Section 10.1's "platform-curated, not creator-created" design decision.

## 6.10 Media Upload for Products — `/v1/stores/{storeId}/products/{id}/media`

`POST` accepts an already-uploaded `mediaId` (from the shared Media pipeline, Section 20 — product images are uploaded generically, then attached here) plus `{ "displayOrder": 1, "isPrimary": true, "altText": "...", "variantId": null }`. `PATCH /v1/.../media/{mediaId}` reorders/updates; `DELETE` removes the association (not the underlying `Media` asset, which may be referenced elsewhere — garbage-collected independently per 08-database-design.md Section 25.1). `altText` is a **required** field on this endpoint's request body, enforced with `400 VALIDATION_ERROR` if omitted — the API refuses to let accessibility be an afterthought, directly enforcing 08-database-design.md Section 22.7's accessibility-by-construction design.

## 6.11 Bulk Import / Bulk Export

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/v1/stores/{storeId}/products/bulk-import` | Accepts a previously-uploaded CSV/spreadsheet `mediaId` (Section 20). Response `202 Accepted` with `{ "jobId": "..." }` — processing is always asynchronous (Section 1.7), never inline, since a large studio's catalog import can take minutes and must not hold an HTTP connection open. |
| `GET` | `/v1/jobs/{jobId}` | Generic async-job status polling endpoint (shared across bulk import, analytics export, and any future long-running operation) — `{ "status": "PROCESSING", "progress": 0.64, "resultUrl": null }` → on completion, `{ "status": "COMPLETED", "resultUrl": "https://..." }` (a signed URL to a results/error report) or `{ "status": "FAILED", "error": {...} }`. |
| `POST` | `/v1/stores/{storeId}/products/bulk-export` | Same async pattern, producing a downloadable export of the store's catalog. |

## 6.12 Duplicate, Archive, Restore

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/v1/stores/{storeId}/products/{id}/duplicate` | Creates a new `draft` Product pre-filled from this one (media references copied, not re-uploaded) — a common creator convenience for near-identical variant listings. |
| `POST` | `/v1/stores/{storeId}/products/{id}/archive` | Explicit action-endpoint alias for the archive transition (equivalent effect to `DELETE`, Section 6.3, exposed as a named action too since "archive" is the creator-facing mental model, not "delete"). |
| `POST` | `/v1/stores/{storeId}/products/{id}/restore` | Reverses an archive, returning to `draft` (not directly back to `active` — re-publishing always re-enters the review gate at `submit-for-review`, ensuring a previously-archived listing can't silently reappear without a fresh eligibility check against current policy). |

## 6.13 Digital Downloads (Future — Contract Reserved)

Per 08-database-design.md Section 30, `Product.productType` already anticipates a `DIGITAL` value. `GET /v1/orders/{orderId}/items/{itemId}/download` is reserved as the eventual buyer-facing download-delivery endpoint (signed, time-limited, watermarked-if-applicable), documented now so its URL shape and the `DigitalDelivery` entity it will read from (per the database doc's Section 30 extension note) are pre-agreed.


---

# 7. Search APIs

Base path: `/v1/search`. Backed by `SearchIndex` (08-database-design.md Section 24.1); deliberately separate from `/v1/products`' structured filtering (Section 6.1), per Section 2.10's rationale.

## 7.1 GET /v1/search

**Query parameters:** `q` (required, the search string), plus the **same** filter/sort parameters as `GET /v1/products` (Section 6.1) — search results can be further narrowed by category/price/material exactly like browsing, so the two endpoints share a filter vocabulary even though they differ in ranking mechanism.

**Response** mirrors `GET /v1/products`' list shape, with one addition: each item includes a `matchType` (`"title"`, `"tag"`, `"creator"`, `"material"`) hint for potential UI highlighting, and the envelope includes a `searchMeta` block:
```json
{
  "data": [ /* product summaries */ ],
  "searchMeta": { "query": "handwoven scarf", "resultCount": 47, "correctedQuery": null },
  "pagination": { ... }
}
```
`correctedQuery` is populated (non-null) when `Synonyms`/typo-tolerance (08-database-design.md Section 24.5) substantially altered interpretation of the query — e.g., `"correctedQuery": "handwoven scarf"` if the buyer typed `"handwoven scarve"` — so the frontend can render a "showing results for…" affordance.

Every search request is logged to `SearchHistory` (Section 24.2) server-side; this is a **side effect of the request**, not a separate client call, since requiring the client to explicitly log its own searches would be both redundant and unreliable (a client that crashes mid-session shouldn't lose analytics fidelity).

## 7.2 GET /v1/search/autocomplete

**Query parameters:** `q` (required, typically called on every keystroke with client-side debouncing). Optimized for sub-100ms response (08-database-design.md Section 24.4) — returns a lightweight array of suggestion strings plus, optionally, up to 3 matched Product summaries for a rich autocomplete dropdown:
```json
{
  "suggestions": ["handwoven scarf", "handwoven blanket", "handwoven bag"],
  "topProducts": [ /* up to 3 lean product summaries */ ]
}
```

## 7.3 GET /v1/search/categories/{categoryId}

Category-scoped search — equivalent to `GET /v1/products?categoryId={id}&sort=...` but exposed as its own path for the 04-information-architecture.md category-page use case where the frontend wants search-relevance ranking within a fixed category scope rather than the newest/best-selling default sorts.

## 7.4 GET /v1/search/creators

Searches `Store` records by name/craft-focus, distinct from product search — powers the "find a maker" discovery path.

## 7.5 GET /v1/search/trending

Returns `TrendingSearch` (08-database-design.md Section 24.3), optionally scoped by category. Cached aggressively (Section 24.1) since it changes only on the scheduled recompute job's cadence, never per-request.

## 7.6 GET /v1/products/{id}/recommendations

Product-to-product recommendations (`ProductRecommendation`, 08-database-design.md Section 8.18), accepting a `type` filter (`SAME_CREATOR`, `SIMILAR_CATEGORY`, `FREQUENTLY_BOUGHT_TOGETHER`) — powers PDP "you may also like" rails.

## 7.7 GET /v1/users/me/recently-viewed (cross-reference)

See Section 4.8 — listed here for discoverability since it's conceptually part of the discovery surface, but owned and documented in full under User APIs since it's account-scoped data, not search-index data.

## 7.8 GET /v1/products/popular

Platform- or category-scoped "popular now" listing, sourced from `SalesAnalytics`/`ProductViews` rollups (08-database-design.md Sections 21.3, 21.5) rather than live counting — same eventually-consistent caveat as Section 5.10.

---

# 8. Cart APIs

Base path: `/v1/carts`. Implements 08-database-design.md's Cart & Checkout domain (Section 12). A cart belongs to either an authenticated `User` or an anonymous guest session (Section 8.6).

## 8.1 GET /v1/carts/current

Returns (creating if absent) the caller's active `Cart` (08-database-design.md Section 12.1), with embedded `CartItem`s, each carrying a **live-revalidated** price/availability check (not just the `priceAtAdd` snapshot) — the cart view must always reflect current truth, since 08-database-design.md Section 2.3 is explicit that `priceAtAdd` is a display-continuity aid, not final billing truth. Response includes a `priceChanged`/`unavailable` flag per item where the live check disagrees with the snapshot, so the UI can surface "price updated" or "no longer available" banners.

## 8.2 POST /v1/carts/current/items — Add Item

**Request:** `{ "variantId": "...", "quantity": 2, "customizations": [{ "optionId": "...", "value": "..." }] }`. Server-side validates: variant is `active`, quantity ≤ available stock (or unlimited for made-to-order per 08-database-design.md Section 9.1), all `required: true` `CustomizationOption`s (Section 8.8) are present and pass their validation rules. **Errors:** `422 INSUFFICIENT_STOCK` (with `details.availableQuantity`), `422 MISSING_REQUIRED_CUSTOMIZATION`.

## 8.3 PATCH /v1/carts/current/items/{itemId} — Update Quantity

`{ "quantity": 3 }`. Same stock validation as add. Setting `quantity: 0` is equivalent to `DELETE` (documented alias, both accepted).

## 8.4 DELETE /v1/carts/current/items/{itemId} — Remove Item

`204 No Content`.

## 8.5 Save for Later — `POST /v1/carts/current/items/{itemId}/save-for-later` · `POST /v1/carts/current/saved-items/{itemId}/move-to-cart`

Moves an item between the active cart and a "saved for later" holding area (implemented as a `CartItem`-status field, not a separate table, since it's cart-scoped ephemeral state rather than the durable `Wishlist`, Section 4.6 — a deliberate distinction: Save-for-Later is "I want this in this shopping session but not right now," Wishlist is "I'm interested in this long-term").

## 8.6 Guest Carts

Unauthenticated requests to any `/v1/carts/current` endpoint are honored using a `X-Guest-Cart-Token` header (a server-issued opaque token, first returned on the initial anonymous `GET /v1/carts/current` call and expected to be persisted client-side and replayed on subsequent requests). On login/registration, `POST /v1/carts/current/merge` (called automatically by the client immediately post-auth) merges the guest cart's items into the now-authenticated user's cart, with a documented conflict rule: if the same variant exists in both, quantities are summed (capped at available stock).

## 8.7 Apply / Remove Coupon — `POST /v1/carts/current/coupon` · `DELETE /v1/carts/current/coupon`

`{ "code": "WELCOME10" }`. Validates against the coupon-definition entity (08-database-design.md Section 11.6/12.3) — eligibility, expiry, minimum-order-value, per-user usage limits. Creates a `CouponApplication` (Section 12.3). **Errors:** `422 COUPON_EXPIRED`, `422 COUPON_NOT_ELIGIBLE`, `422 COUPON_USAGE_LIMIT_REACHED`, `404 COUPON_NOT_FOUND` (deliberately not distinguished from "invalid code" to avoid enabling coupon-code enumeration/brute-forcing, per Section 22.4's anti-enumeration pattern applied here too).

## 8.8 Gift Wrap & Gift Message

`PATCH /v1/carts/current` accepts `{ "giftWrapRequested": true, "giftMessage": "Happy Birthday!", "giftRecipientName": "Priya" }`, populating what will become `GiftMessage` (Section 12.8) at checkout completion.

## 8.9 Shipping Estimate — `GET /v1/carts/current/shipping-estimate?postalCode={code}`

Pre-checkout, non-committal shipping cost/timeline preview (does not create a `ShippingSelection`, Section 12.5 — that happens during actual checkout, Section 9) — lets the PDP/cart show "estimated delivery by…" without forcing the buyer into the full checkout flow just to see a shipping estimate.

## 8.10 GET /v1/carts/current/summary

Computed subtotal/estimated-tax/estimated-shipping/discount/estimated-total, recalculated live on every call (never cached beyond request scope, since cart contents change frequently and a stale total displayed to a buyer is a trust problem, not just a minor UX one).

## 8.11 DELETE /v1/carts/current — Clear Cart

Removes all `CartItem`s (not the `Cart` row itself, which persists as an empty active cart). `204 No Content`.

---

# 9. Checkout APIs

Base path: `/v1/checkout`. Implements `CheckoutSession` (08-database-design.md Section 12.4) as an explicit, multi-step state machine — the API surfaces each step as its own endpoint rather than one giant "place order" call, so the frontend's multi-step checkout UI (07-ui-screens-wireframes.md) maps directly onto server state at every step, and a page refresh mid-checkout resumes correctly.

## 9.1 POST /v1/checkout/sessions

Creates a `CheckoutSession` from the caller's current `Cart`. **Requires `Idempotency-Key`** (Section 2.6) — a duplicate submit (e.g., double-click) must not create two sessions. Server-side, this call also creates `Reservation`s (08-database-design.md Section 9.3) against each cart item's inventory, holding stock for the session's TTL (recommended: 15 minutes). Response includes the session `id` and its current `status: "STARTED"`.

**Errors:** `409 CART_EMPTY`, `422 ITEMS_UNAVAILABLE` (with `details` listing which items failed live re-validation, per Section 8.1's revalidation note — checkout start is the first *hard* stock check, not just a display hint).

## 9.2 GET /v1/checkout/sessions/{id}

Full current-state snapshot: selected address, `ShippingSelection`s per store, `TaxCalculation`, `OrderPreview` totals, `PaymentIntent` status, remaining reservation TTL (`expiresAt`) — everything the checkout UI needs to render its current step and remaining time.

## 9.3 PATCH /v1/checkout/sessions/{id}/address

`{ "shippingAddressId": "...", "billingAddressId": "..." }` (or inline new-address objects for a buyer checking out without a saved address — accepted here directly rather than forcing a separate `POST /v1/users/me/addresses` round trip first, since 07-ui-screens-wireframes.md's checkout flow supports "use this address just once" without saving it). Triggers server-side recomputation of `TaxCalculation` and `DeliveryEstimate` (Sections 12.9–12.10) — response includes the updated `OrderPreview` totals inline, so the frontend never needs a separate call after every address change.

## 9.4 GET /v1/checkout/sessions/{id}/shipping-methods

Available shipping methods **per store** in the session (since a multi-store cart may offer different methods per creator, 08-database-design.md Section 12.5) — response is grouped by `storeId`, each with its own method list, cost, and estimated delivery window.

## 9.5 PATCH /v1/checkout/sessions/{id}/shipping

`{ "selections": [{ "storeId": "...", "methodId": "..." }] }` — sets the `ShippingSelection` per store. Response includes updated totals (same inline-recompute pattern as 9.3).

## 9.6 Taxes — `GET /v1/checkout/sessions/{id}/tax-breakdown`

Read-only detail view of the computed `TaxCalculation` (Section 12.9) — jurisdiction, rate, amount — for transparency/receipt-preview purposes; taxes themselves are computed automatically on every relevant state change (address, cart contents), never client-set.

## 9.7 Coupons & Gift Cards (Checkout-Scoped)

`POST /v1/checkout/sessions/{id}/coupon` and `POST /v1/checkout/sessions/{id}/gift-card` mirror the cart-level coupon endpoint (Section 8.7) but scoped to the checkout session, since a coupon/gift-card's final validity (stock, price) must be re-verified at the point of actual purchase, not trusted from the earlier cart-stage application. Gift Card redemption reduces `OrderPreview`'s payable total and, on order completion, is recorded as a payment-method component alongside any card/UPI payment (08-database-design.md Section 14.2 — a gift card redemption produces its own `Transaction` type).

## 9.8 GET /v1/checkout/sessions/{id}/order-preview

Explicit endpoint for the final review-before-payment screen — full computed `OrderPreview` (Section 12.7): line items, shipping breakdown per store, tax, discounts, grand total. This is the "does everything look right" screen's data source, deliberately separate from the more general session-state endpoint (9.2) so the frontend has one unambiguous "this is what will be charged" call to make immediately before initiating payment.

## 9.9 Payment Initialization — `POST /v1/checkout/sessions/{id}/payment-intent`

Creates a `PaymentIntent` (08-database-design.md Section 12.6) via the configured payment processor, returning the client-side handle the frontend's payment SDK needs (e.g., a processor client secret) to collect payment details. **Requires `Idempotency-Key`.** See Section 12 for the full Payment API and processor-integration contract.

## 9.10 Payment Verification / Checkout Completion — `POST /v1/checkout/sessions/{id}/complete`

Called by the client after the payment SDK reports success, **as a confirmation trigger only** — the platform does not trust client-reported payment success alone; this endpoint verifies the `PaymentIntent` status directly with the processor (or waits briefly for the corresponding webhook, Section 21, whichever resolves first) before finalizing. On verified success: atomically creates `Order`/`SubOrder`/`OrderItem` (08-database-design.md Section 13), converts `Reservation`s into real `InventoryTransaction` decrements (Section 9.2 of the database doc), computes `Commission` per `SubOrder` (Section 14.6), and returns the created `Order`. On payment failure/timeout: releases reservations, returns `402 PAYMENT_FAILED` (a deliberately used, less-common status code, chosen specifically for payment-failure semantics per its HTTP spec intent) with processor-provided failure detail in `details`.

**Response `201 Created`:**
```json
{
  "orderId": "...",
  "orderNumber": "DK-2026-0193422",
  "status": "PLACED",
  "totalAmount": 189800,
  "totalCurrency": "INR"
}
```

## 9.11 Checkout Validation — `POST /v1/checkout/sessions/{id}/validate`

A dry-run endpoint the frontend can call at any step to get the **full** current set of blocking issues (address missing, shipping not selected, item unavailable) in one `422` response with a complete `details` array — used to drive a checkout-readiness checklist UI, distinct from the field-specific validation errors each individual step endpoint already returns, since a "can I proceed to payment" holistic check is a genuinely different question than "did this one PATCH succeed."


---

# 10. Order APIs

Base path: `/v1/orders` (buyer-facing) and `/v1/stores/{storeId}/orders` (creator-facing, scoped to that store's `SubOrder`s). Implements 08-database-design.md's Order domain (Section 13).

## 10.1 POST /v1/orders — Create Order

**Not directly callable.** Order creation happens exclusively via `POST /v1/checkout/sessions/{id}/complete` (Section 9.10) — this path is documented here only to state explicitly that there is **no** standalone "create an order from scratch" endpoint, closing off a potential integrity gap where a client could otherwise attempt to fabricate an order bypassing checkout validation, payment, and reservation logic.

## 10.2 GET /v1/orders — Order History (Buyer)

**Auth required.** Paginated, `-placedAt` default sort. Filterable by `status[in]`. Each list item is the `Order`-level summary (aggregated status across its `SubOrder`s per 08-database-design.md Section 13.1) with an embedded lean preview of its items (thumbnail + count), not the full nested detail — full detail is a separate call (10.3) to keep the list endpoint fast per Section 2.5's read-optimization philosophy.

## 10.3 GET /v1/orders/{id} — Order Details

Full detail: `Order` + all `SubOrder`s (each with its `Store` summary, `OrderItem`s, `Shipment`/`ShipmentTracking`, per-store status) + `Invoice` reference + payment summary (masked). Ownership-checked: `403 FORBIDDEN` if the caller is neither the buyer nor a team member of any involved `Store` (creators see only their own `SubOrder` slice via the store-scoped path, Section 10.9, not this buyer-facing full-order endpoint).

## 10.4 GET /v1/orders/{id}/invoice

Returns a signed URL to the generated `Invoice` PDF (08-database-design.md Section 13.6), via the Media pipeline (Section 20).

## 10.5 GET /v1/orders/{id}/tracking

Aggregated tracking view across all `Shipment`s in the order — each with carrier, tracking number, and its `ShipmentTracking` event history (08-database-design.md Section 13.7–13.8), for a unified "track my order" screen even when a multi-store order ships as several separate packages.

## 10.6 POST /v1/orders/{id}/cancel

`{ "scope": "FULL" | "SUB_ORDER" | "ITEM", "targetId": "...", "reason": "..." }` (per 08-database-design.md Section 13.12's `Cancellation` scope model). Server-side eligibility check: only permitted while the targeted scope has not yet shipped (business rule; post-shipment requests are redirected to Return/Refund, Sections 10.7–10.8). **Errors:** `422 CANCELLATION_WINDOW_PASSED`. On success: releases/reverses inventory via `InventoryTransaction`, initiates `Refund` (Section 12.7) if payment was already captured, `200 OK` with the updated `Order`.

## 10.7 Return Requests — `/v1/orders/{id}/return-requests`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/v1/orders/{id}/return-requests` | `{ "itemIds": [...], "reason": "..." }` — creates a `ReturnRequest` (08-database-design.md Section 13.9), status `requested`. |
| `GET` | `/v1/orders/{id}/return-requests` | List for this order. |
| `GET` | `/v1/return-requests/{id}` | Detail, including status history and any attached return-shipping label. |
| `POST` | `/v1/return-requests/{id}/approve` · `POST /v1/return-requests/{id}/reject` | Creator/Admin-scoped (Section 5, Section 15) decision endpoints. |
| `POST` | `/v1/return-requests/{id}/confirm-received` | Creator marks the physical item received, advancing status toward `completed`. |

## 10.8 Refund Requests — `/v1/orders/{id}/refund-requests`

Mirrors the Return Request shape (08-database-design.md Section 13.10), with `{ "orderItemIds": [...], "amountRequested": 45000, "reason": "...", "linkedReturnRequestId": null }` — `linkedReturnRequestId` is optional since not every refund implies a physical return (per the database doc's explicit rationale for keeping these as two entities). Approval (`POST /v1/refund-requests/{id}/approve`) triggers the actual `Refund` (Section 12.7).

## 10.9 Creator Order Management — `/v1/stores/{storeId}/orders`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/v1/stores/{storeId}/orders` | Paginated `SubOrder` list for this store (08-database-design.md Section 13.2), filterable by `status[in]`, sortable by `-createdAt` (default) or `-priority` (a computed field surfacing orders nearing their promised ship date first). |
| `GET` | `/v1/stores/{storeId}/orders/{subOrderId}` | Full detail from the creator's perspective — buyer's shipping address, `OrderItem`s with chosen customizations, any `GiftMessage`. |
| `POST` | `/v1/stores/{storeId}/orders/{subOrderId}/accept` | For creators using manual accept rather than `StoreSettings.autoAcceptOrders` (08-database-design.md Section 7.9) — explicit acknowledgment starting the fulfillment clock. |
| `POST` | `/v1/stores/{storeId}/orders/{subOrderId}/mark-shipped` | `{ "carrier": "...", "trackingNumber": "...", "itemIds": [...] }` — creates a `Shipment` (Section 13.7), optionally partial (a subset of `itemIds` for split shipments). |
| `POST` | `/v1/stores/{storeId}/orders/{subOrderId}/mark-delivered` | Manual override for carriers without tracking webhook support; normally, delivery status arrives via the carrier-tracking webhook path (Section 21.6) rather than a manual creator action. |

## 10.10 Exchange — `/v1/order-items/{itemId}/exchanges`

`POST` — `{ "replacementVariantId": "..." }` (08-database-design.md Section 13.13). Server-side computes any price difference and returns the required follow-up action (`{ "priceDifferenceAmount": 0, "action": "NONE" }` or `{"action": "ADDITIONAL_PAYMENT_REQUIRED", "paymentIntentId": "..."}` or `{"action": "PARTIAL_REFUND_ISSUED", ...}`).

## 10.11 Reorder — `POST /v1/orders/{id}/reorder`

Convenience endpoint that adds all (still-available) items from a prior order back to the caller's current `Cart`, applying the *current* price and availability (never the historical order's snapshot values, per 08-database-design.md Section 2.3 — a reorder is a fresh cart-building action, not a resurrection of the old order). Response includes any items that could not be re-added (`discontinued`, `out_of_stock`) so the frontend can inform the buyer clearly rather than silently dropping them.

## 10.12 GET /v1/orders/{id}/timeline

Returns the buyer-facing `OrderTimeline` (08-database-design.md Section 13.4) event feed — the human-readable "Your order has been shipped" style history that powers the order-detail screen's status tracker, distinct from the more technical `OrderStatusHistory` which is not exposed to buyers at all (internal/audit-only, reachable only via Admin/Support tooling, Sections 15/17).

## 10.13 GET /v1/orders/{id}/messages (cross-reference)

See Section 14 (Messaging APIs) — surfaced here for discoverability: `OrderCommunication` (08-database-design.md Section 13.11) links a `Conversation` to an Order, and this convenience path resolves directly to that conversation's messages without the client needing to look up the conversation ID separately.

---

# 11. Payment APIs

Base path: `/v1/payments`. Implements 08-database-design.md's Payment domain (Section 14). Most of this domain is **system/webhook-driven** (Section 21) rather than directly client-called; the endpoints below are the client-facing subset plus the internal contract documented for completeness.

## 11.1 GET /v1/payments/methods

Returns the platform's currently supported payment method types for the caller's context (region-aware, per 08-database-design.md Section 30's internationalization extension point) — e.g., `["CARD", "UPI", "NETBANKING", "WALLET", "COD"]` for an India-market launch, informing which payment SDK components the checkout UI renders. `COD` (cash on delivery) availability is further filtered per-order based on order value, shipping address serviceability, and store eligibility — this endpoint accepts optional `?amount=&postalCode=&storeIds=` to return an accurately-filtered set rather than a static global list.

## 11.2 Saved Payment Methods — `/v1/users/me/payment-methods`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/v1/users/me/payment-methods` | List `SavedPaymentMethod`s (08-database-design.md Section 11.5) — masked display data only. |
| `POST` | `/v1/users/me/payment-methods` | Saves a new method, given a processor-issued setup-intent token from the client-side payment SDK (the API service never receives raw card data — it only receives the processor's tokenized reference, per 08-database-design.md Section 29.1's hard architectural constraint). |
| `DELETE` | `/v1/users/me/payment-methods/{id}` | Removes a saved method. |
| `POST` | `/v1/users/me/payment-methods/{id}/set-default` | Sets default (mirrors the address default pattern, Section 4.4). |

## 11.3 Payment Intent — `POST /v1/checkout/sessions/{id}/payment-intent` (cross-reference)

Documented fully in Section 9.9; listed here for domain completeness since it is, structurally, the entry point into the Payment domain even though it's exposed under the Checkout path for workflow clarity.

## 11.4 GET /v1/payments/{id}

**Auth required, ownership-checked.** Read-only detail of a `Payment` (08-database-design.md Section 14.1) — status, masked method, amount, linked `Transaction`s. Primarily used by Support/Admin tooling (Section 15) and, for the buyer's own payments, surfaced through the Order detail endpoint (Section 10.3) rather than called directly in normal buyer flows.

## 11.5 Payment Failure & Retry

A failed `PaymentIntent` (Section 9.10) does not require a new `CheckoutSession` — `POST /v1/checkout/sessions/{id}/payment-intent` (Section 9.9) may be called again against the same still-valid session (while its `Reservation`s remain unexpired) to retry with a different payment method, avoiding the frustration of losing cart/address/shipping selections after a single failed payment attempt.

## 11.6 Webhook Events (cross-reference)

Processor webhooks (payment succeeded/failed, dispute opened, settlement completed) are documented fully in Section 21 (Webhook Specifications), since they follow the platform's general inbound-webhook contract rather than being a bespoke Payment-domain pattern.

## 11.7 Refund — `POST /v1/refund-requests/{id}/approve` (cross-reference)

See Section 10.8. Approval of a `RefundRequest` triggers the underlying `Refund` (08-database-design.md Section 14.7) against the processor; this endpoint lives under the Order-domain path (`/v1/refund-requests/...`) rather than `/v1/payments/...` since the *request/approval workflow* is order-context-driven even though its financial effect lands in the Payment domain — documented explicitly here to prevent the two domains' overlapping ownership from causing a duplicate/conflicting endpoint to be built later.

## 11.8 Partial Refund

Supported natively by `POST /v1/refund-requests` (Section 10.8) accepting `amountRequested` less than the full `OrderItem` line total — there is no separate "partial refund" endpoint; partial-vs-full is simply a matter of the requested amount, keeping the contract minimal.

## 11.9 Settlement (Internal, Read-Only for Admin)

`GET /v1/admin/settlements` (Section 15) — `Settlement` (08-database-design.md Section 14.4) records are created exclusively by the processor-reconciliation background job (Section 21.7), never via a direct-write client endpoint; Admin tooling only reads them.

## 11.10 Creator Payout (cross-reference)

See Section 5.12 — `Payout` (08-database-design.md Section 14.5) read endpoints live under the Creator API path; there is no client-callable "trigger my payout" endpoint, since payouts run on the platform's own scheduled cadence (Section 14.11 of the database doc), a deliberate design choice preventing creators from forcing off-cycle payouts that would complicate reconciliation.

## 11.11 Commission — `GET /v1/stores/{storeId}/orders/{subOrderId}/commission`

Read-only breakdown of the `Commission` (08-database-design.md Section 14.6) applied to a given `SubOrder`, for creator transparency — rate applied, computed amount, category-specific rate reference if applicable.

## 11.12 Platform Fees

Documented here as a naming clarification: "Platform Fees" in the original product brief maps onto the same `Commission` entity/endpoint above — there is intentionally no separate "fees" resource, since introducing a second fee-like entity alongside `Commission` would violate 08-database-design.md's single-owning-domain principle for what is, functionally, the same concept (the platform's take on a transaction).


---

# 12. Review APIs

Base path: `/v1/reviews`, plus nested read paths under `/v1/products/{id}/reviews`. Implements 08-database-design.md's Reviews domain (Section 16).

## 12.1 GET /v1/products/{id}/reviews

**Unauthenticated-friendly.** Paginated, sortable (`-createdAt` default, `-helpfulVotes`, `-rating`, `rating`). Filterable by `rating[in]`, `hasMedia=true` (photo/video reviews only). Each item embeds `Rating` dimensions, any `MediaReview` thumbnails, and the `CreatorReply` if present.

## 12.2 POST /v1/products/{id}/reviews — Create Review

**Auth required.** Server-side enforces the eligibility gate from 08-database-design.md Section 16.1: the caller must have a completed `OrderItem` for this product, and no existing `Review` for that same `OrderItem`. **Errors:** `403 NOT_ELIGIBLE_TO_REVIEW` (not a purchaser, or order not yet completed), `409 REVIEW_ALREADY_EXISTS`.

**Request:**
```json
{
  "orderItemId": "...",
  "title": "Beautifully made",
  "body": "Exceeded expectations, arrived well packaged.",
  "ratings": [
    { "dimension": "OVERALL", "score": 5 },
    { "dimension": "AS_DESCRIBED", "score": 5 },
    { "dimension": "SHIPPING", "score": 4 }
  ],
  "mediaIds": ["..."]
}
```
New reviews default to `published` unless flagged by automated content screening (a background classification step, Section 21), in which case `status: pending_moderation` is returned and the review is not yet publicly visible — the response still returns `201 Created` with the review object so the buyer sees their submission was received, with `status` communicating the actual visibility state.

## 12.3 PATCH /v1/reviews/{id} · DELETE /v1/reviews/{id}

Author-only, time-window-limited (policy-configurable, e.g., editable within 30 days of posting — a business rule enforced server-side, returning `403 EDIT_WINDOW_EXPIRED` beyond it). `DELETE` is a soft removal (author-initiated retraction, `status → removed`), distinct from moderation-initiated removal (Section 16).

## 12.4 Creator Reply — `POST /v1/reviews/{id}/reply` · `PATCH /v1/reviews/{id}/reply`

Store-team-authenticated, ownership-checked against the review's product's store. Enforces the one-reply-per-review invariant (08-database-design.md Section 16.4) — `POST` on an already-replied review returns `409 REPLY_ALREADY_EXISTS` with a pointer to use `PATCH` instead.

## 12.5 Like / Helpful Vote — `POST /v1/reviews/{id}/vote`

`{ "direction": "HELPFUL" | "NOT_HELPFUL" }`. Idempotent per caller (a repeat call updates the caller's existing vote rather than adding a duplicate, enforced by the database layer's unique constraint on `(review_id, user_id)`, 08-database-design.md Section 16.5). `DELETE /v1/reviews/{id}/vote` retracts.

## 12.6 Report Review — `POST /v1/reviews/{id}/report`

`{ "reason": "..." }` — creates a `ReviewReport` (Section 16.6), feeding the Moderation queue (Section 16). `201 Created`, no visible effect on the review's own status until a moderator acts.

## 12.7 GET /v1/stores/{storeId}/rating-summary · GET /v1/products/{id}/rating-summary

Precomputed aggregate breakdown (average, count-per-star, per-dimension averages) — read from the denormalized aggregate fields (08-database-design.md Section 2.3), not computed live, for fast PDP/storefront rendering.

---

# 13. Messaging APIs

Base path: `/v1/conversations`. Implements 08-database-design.md's Messaging domain (Section 15). Real-time delivery mechanism depends on the backend-architecture decision flagged in Section 1.9 (native WebSocket vs. Supabase Realtime); this section documents the HTTP contract, which is identical either way, with real-time delivery layered on top (Section 13.8).

## 13.1 GET /v1/conversations — Conversation List

Paginated, `-lastMessageAt` sort. Each item is a lean summary: other participant(s), last message preview, unread count, linked `orderId` if any (via `OrderCommunication`, 08-database-design.md Section 13.11).

## 13.2 POST /v1/conversations — Start Conversation

`{ "recipientUserId": "...", "orderId": null, "initialMessage": "..." }` (`recipientUserId` is typically a Store's primary contact when initiated from a PDP "ask a question" action — the request accepts either a `storeId` or a `recipientUserId`, resolved server-side to the appropriate `Participant` set). If an open conversation already exists between the same parties for the same order context, the existing conversation is returned instead of creating a duplicate (`200 OK` rather than `201`, with a body flag `{"wasExisting": true}`).

## 13.3 GET /v1/conversations/{id}/messages

Paginated (cursor-based per Section 2.7, but note: message history is more naturally paginated **backwards** from most-recent — this endpoint's cursor semantics are explicitly documented as reverse-chronological, `?before=cursor` rather than the platform-wide default `?cursor=`, a deliberate, narrowly-scoped exception called out here rather than silently diverging from convention).

## 13.4 POST /v1/conversations/{id}/messages — Send Message

`{ "body": "...", "attachmentMediaIds": [...] }`. Rate-limited per Section 8.4 to prevent spam. Triggers a `Notification` (Section 17) to other participants and, where the real-time channel is connected, an immediate push over that channel in addition to the HTTP response — the HTTP response is always the source of truth (the message is durably created before the response returns); the real-time channel is a delivery optimization, not the primary write path.

## 13.5 Read Receipts — `POST /v1/conversations/{id}/read`

Marks all messages in the conversation as read up to the current point for the caller, creating/updating `ReadReceipt` rows (08-database-design.md Section 15.5) in bulk rather than requiring one call per message.

## 13.6 Typing Status — `POST /v1/conversations/{id}/typing`

A fire-and-forget, **not persisted** signal (no corresponding database row — this is purely a real-time/ephemeral broadcast to other participants over the real-time channel, Section 13.8). Documented here for contract completeness even though it has no REST "resource" backing it, since it's a legitimate, expected part of the messaging UX (07-ui-screens-wireframes.md).

## 13.7 Archive & Block

`POST /v1/conversations/{id}/archive` (soft, reversible, per-participant — archiving hides it from the default list without affecting the other participant's view). `POST /v1/users/{userId}/block` (platform-wide, not conversation-scoped — a blocked user's future messages are rejected at the `POST /v1/conversations` / `POST .../messages` layer with `403 USER_BLOCKED`, and existing conversations with them are auto-archived).

## 13.8 Real-Time Delivery Contract

Regardless of the underlying transport (native WebSocket under Option A, Supabase Realtime channel subscription under Option B — Section 1.9), the client-facing real-time event contract is: subscribe to a per-conversation channel (`conversation:{id}`) and receive `message.created`, `message.read`, `typing.started` events shaped identically to their corresponding REST resource fields, so the frontend's message-rendering logic is shared between the initial `GET .../messages` fetch and subsequent real-time events without a translation layer.

---

# 14. Notification APIs

Base path: `/v1/notifications` (in-app) plus `/v1/users/me/notification-preferences`. Implements 08-database-design.md's Notification domain (Section 17). Note: `EmailQueue`/`SMSQueue`/`PushQueue` (database Sections 17.3–17.5) are **entirely internal** — there is no client-facing API for them; they are consumed only by background delivery workers (Section 21).

## 14.1 GET /v1/notifications — In-App Feed

Paginated, `-createdAt` sort, filterable by `isRead`, `type[in]`. Each item mirrors `Notification` + its `InAppNotification` display fields (icon, action URL, grouped count) — 08-database-design.md Sections 17.1, 17.6.

## 14.2 POST /v1/notifications/{id}/read · POST /v1/notifications/read-all

Marks read. `read-all` accepts an optional `{ "before": "2026-07-22T00:00:00.000Z" }` to scope the bulk action, rather than always marking literally everything read (useful if new notifications arrive between page-load and the "mark all read" click).

## 14.3 GET /v1/notifications/unread-count

A lightweight, dedicated endpoint (rather than requiring a full list fetch) for the persistent bell-icon badge — polled or, preferably, updated via the real-time channel's `notification.created` event (mirroring Section 13.8's pattern) rather than polling in production.

## 14.4 Notification Preferences (cross-reference)

Full CRUD lives under `/v1/users/me/preferences` (Section 4.5) as part of the combined preferences resource — not duplicated here, per Guiding Principle 2 applied to the API layer (one canonical endpoint per piece of state).

## 14.5 Push Device Registration — `POST /v1/users/me/push-devices` · `DELETE /v1/users/me/push-devices/{id}`

Registers/deregisters a device token (APNs/FCM) for push delivery — an API-layer concern not directly mapped to a single database entity in 08-database-design.md (it feeds the `PushQueue`'s recipient resolution), documented here as the necessary client-side counterpart to that domain.

## 14.6 Channel-Specific Notes

- **Email/SMS delivery** have no client-facing "send" endpoint at all — they are always system-triggered side effects of other domain events (order placed, message received), per 08-database-design.md Section 17's fan-out model.
- **In-app** is the only channel with direct client read/write endpoints, since it's the only channel the client itself renders (email/SMS/push are rendered by external systems the API only dispatches to).

---

# 15. Support APIs

Base path: `/v1/support`. Implements 08-database-design.md's Support domain (Section 18).

## 15.1 Tickets — `/v1/support/tickets`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/v1/support/tickets` | Caller's own tickets (buyer/creator view), paginated. Support-agent/Admin view is `/v1/admin/support/tickets` (Section 15, Admin APIs) with cross-user visibility and queue-management filters. |
| `POST` | `/v1/support/tickets` | `{ "category": "ORDER_ISSUE", "subject": "...", "body": "...", "orderId": null, "attachmentMediaIds": [] }` — creates a `Ticket` (08-database-design.md Section 18.1) + its first `TicketMessage`. |
| `GET` | `/v1/support/tickets/{id}` | Full detail + message thread (internal-note messages excluded from non-staff responses — filtered server-side based on caller role, never trusted to the client to hide). |

## 15.2 Replies — `POST /v1/support/tickets/{id}/messages`

`{ "body": "...", "attachmentMediaIds": [], "isInternalNote": false }` — `isInternalNote: true` is accepted only from staff-role callers; a non-staff caller supplying it is ignored (silently forced to `false`), not errored, to avoid leaking the existence of the internal-note feature to end users via an error message.

## 15.3 Attachments (cross-reference)

Uploaded via the shared Media pipeline (Section 20) and referenced by `attachmentMediaIds`, mirroring the pattern used throughout this document (Product media, Review media, Message attachments) — one upload flow, referenced consistently everywhere.

## 15.4 Escalation — `POST /v1/support/tickets/{id}/escalate`

Staff-only. `{ "escalateTo": "...", "reason": "..." }` — creates an `Escalation` (08-database-design.md Section 18.4), reassigns `Ticket.assignedAgent`.

## 15.5 Priority & Category — `PATCH /v1/support/tickets/{id}`

Staff-only fields (`priority`, `category`, `assignedAgentId`) are accepted on the same ticket `PATCH` endpoint but rejected with `403` if the caller is not staff — buyer/creator callers may only `PATCH` a narrower field set (none, at V1; tickets are otherwise read/reply-only from the requester's side).

## 15.6 FAQs — `GET /v1/support/faqs`

Public, unauthenticated. Returns platform-wide `FAQ` entries (08-database-design.md Section 20.6), filterable by `category`. Write endpoints live under Admin/CMS (Section 18).

## 15.7 Knowledge Base — `GET /v1/support/knowledge-base` · `GET /v1/support/knowledge-base/{id}`

Staff-only by default (`internalOnly` flag per-article, 08-database-design.md Section 18.7); articles with `internalOnly: false` are additionally reachable from the public FAQ-adjacent surface if the platform chooses to expose a public help center later — documented as an existing extension point rather than a new endpoint needed for it.

## 15.8 Macros — `GET /v1/support/macros`

Staff-only. Canned-response templates (08-database-design.md Section 18.8) for agent tooling; `POST /v1/support/tickets/{id}/messages` accepts an optional `macroId` shortcut that server-side expands into the template body (with usage-count increment) rather than requiring the agent's client to fetch-then-paste.


---

# 16. Admin APIs

Base path: `/v1/admin`. All endpoints require an `Admin` or `Super Admin` role (01-product-requirements.md Section 3.5/3.8); most support broader cross-tenant visibility than any other API surface, and are therefore the most heavily audited (every request logged to `AuditLog`, 08-database-design.md Section 23.1, with full before/after snapshots on writes).

## 16.1 GET /v1/admin/dashboard

Aggregate platform health snapshot (mirrors the pattern of Section 5.10's creator dashboard, but platform-wide): GMV trend, active-user/creator counts, open-ticket count, pending-moderation-case count, recent `SystemEvent`s. Backed by `PlatformAnalytics` (08-database-design.md Section 21.7) and `DashboardSnapshots` (Section 21.10) — eventually consistent, same caveat as Section 5.10.

## 16.2 Users — `/v1/admin/users`

Full cross-user `GET` (search/filter/paginate by email, status, role, join date), `GET /{id}` (full profile including internal fields), `PATCH /{id}/status` (`{ "status": "SUSPENDED", "reason": "..." }` — routes through the same lifecycle transitions as 08-database-design.md Section 5.1, always logged), `POST /{id}/roles` / `DELETE /{id}/roles/{roleId}` (RBAC management, Section 6 of the database doc, itself logged to `PermissionAudit`).

## 16.3 Creators — `/v1/admin/creators`

`GET` (list, filterable by `onboardingStatus[in]`, `verificationStatus[in]`), `GET /{id}` (full application + verification detail, including uploaded documents), `POST /{id}/approve` · `POST /{id}/reject` (the `Creator` application review action, 08-database-design.md Section 7.1 — approval triggers `Store` creation per that entity's lifecycle), `POST /{id}/verification/approve` · `POST /{id}/verification/reject` (the separate `StoreVerification`, Section 7.5, review action).

## 16.4 Products — `/v1/admin/products`

Full cross-store visibility, all statuses. `GET /{id}/approval-history` (full `ProductApproval` trail, 08-database-design.md Section 8.17). `POST /{id}/force-archive` (Admin override of the creator-facing archive/delete flow, Section 6.3, for policy-violation takedowns outside the formal Moderation case flow — used sparingly; the primary takedown path is via Moderation, Section 17, and this exists for narrowly-scoped emergency use).

## 16.5 Orders — `/v1/admin/orders`

Full cross-store `GET`/`GET /{id}` (support/investigation visibility across every buyer and store — the only role, besides the involved parties themselves, permitted to view arbitrary order detail). Read-only; Admin does not directly mutate order state outside of the same action endpoints already exposed to creators/buyers (Sections 10, 15) — mutating another party's order data outside documented business processes is deliberately not exposed, even to Admins, keeping every state change traceable to a documented, auditable workflow rather than an arbitrary override.

## 16.6 Payments — `/v1/admin/payments`

Read-only cross-payment visibility (`Payment`, `Transaction`, `Dispute` — 08-database-design.md Section 14), plus `GET /v1/admin/settlements` and `GET /v1/admin/payouts` (cross-store payout visibility, distinct from the store-scoped creator-facing view, Section 5.12).

## 16.7 Reports — `GET /v1/admin/reports/{reportType}`

Generic parameterized reporting endpoint (`reportType` enum: `sales`, `commission`, `refunds`, `disputes`, `creator-performance`, etc.), each accepting `from`/`to`/relevant scope filters, always returning either an inline (small) result set or a `202 Accepted` async job reference (Section 6.11's shared job-polling pattern) for larger exports — the response mode is documented per report type in the eventual OpenAPI spec (Section 26) based on expected result size.

## 16.8 CMS, Announcements, Coupons, Categories (cross-reference)

Write access to these resources is Admin-scoped; full endpoint detail lives in Section 18 (CMS APIs) and Section 6.9 (Categories) to avoid duplicating the same resource documentation under two base paths — this section notes only that `/v1/admin/...` aliases exist where a distinct admin-side list/moderation view (e.g., "all coupons across the platform including inactive/expired") differs meaningfully from the public-facing shape.

## 16.9 Inventory — `GET /v1/admin/inventory/low-stock`

Cross-store `LowStockAlert` visibility (08-database-design.md Section 9.4), for platform-ops monitoring of overall marketplace health, distinct from each creator's own store-scoped alert view (Section 6.6).

## 16.10 Analytics (cross-reference)

Full platform-wide analytics endpoints are documented in Section 19 (Analytics APIs) rather than duplicated here — Admin is simply the role authorized to call them.

## 16.11 Moderation (cross-reference)

Case-management endpoints live under `/v1/moderation` (Section 17) and are reachable by both `Admin` and `Moderator` roles per RBAC (Section 22.2) — not duplicated under `/v1/admin` to avoid two URLs for the same resource.

## 16.12 Settings — `/v1/admin/settings`

Platform-level `System` domain configuration (08-database-design.md Section 3's System/Future domain note — global feature flags, platform-wide operational toggles). `GET`/`PATCH`, Super-Admin-only for the most sensitive keys (enforced per-key via an internal sensitivity classification, not uniformly across the whole resource).

## 16.13 Audit Logs — `GET /v1/admin/audit-logs`

Read-only, paginated, heavily filterable (`actorId`, `targetType`, `targetId`, `action`, date range) view over `AuditLog` (08-database-design.md Section 23.1). Super-Admin-only, given the sensitivity of platform-wide action history. Never returns a total count by default (Section 2.7's rationale applies with particular force here, given this table's expected volume).

---

# 17. Moderator APIs

Base path: `/v1/moderation`. Requires `Moderator`, `Admin`, or `Super Admin` role. Implements 08-database-design.md's Moderation domain (Section 19) as a unified case-management surface across every moderatable entity type, per that domain's explicit design intent ("a single Moderator queue rather than per-feature tooling").

## 17.1 GET /v1/moderation/cases

Paginated queue, filterable by `subjectType[in]` (`PRODUCT`, `STORE`, `REVIEW`, `MESSAGE`, `USER`), `status[in]`, `severity[in]`, sortable by `-severity,createdAt` (default — most severe, oldest-first). This single endpoint serves "Reported Products," "Reported Reviews," "Reported Users," and "Reported Messages" from the original brief as filtered views of the same underlying resource (`subjectType=PRODUCT` etc.), rather than four separate endpoints — directly reflecting 08-database-design.md Section 19.1's design rationale and avoiding four near-duplicate API surfaces that would inevitably drift from each other over time.

## 17.2 GET /v1/moderation/cases/{id}

Full case detail: subject snapshot (resolved based on `subjectType`/`subjectId`), all `Evidence`, `Decision` history, `Appeal` status.

## 17.3 POST /v1/moderation/cases/{id}/evidence

Adds `Evidence` (08-database-design.md Section 19.2) — screenshots, notes, linked prior-history references.

## 17.4 Approvals & Rejections

For `subjectType: PRODUCT` cases originating from `ProductApproval` (08-database-design.md Section 8.17): `POST /v1/moderation/cases/{id}/approve` (publishes the product, per Section 6.4's `publish` action) and `POST /v1/moderation/cases/{id}/reject` (`{ "feedback": "..." }`, returns product to `draft` with reviewer feedback surfaced to the creator).

## 17.5 Decisions — `POST /v1/moderation/cases/{id}/decisions`

The general-purpose decision-recording endpoint for non-product cases (or product cases needing a decision type beyond simple approve/reject): `{ "type": "WARNING" | "CONTENT_REMOVED" | "SUSPENSION" | "BAN" | "NO_ACTION", "rationale": "..." }` — creates a `Decision` (Section 19.3) and, depending on `type`, cascades into the corresponding `Warning`/`Suspension`/`Ban` entity (Sections 19.6–19.8), all in one atomic server-side operation so the API consumer never has to orchestrate multi-step "decide, then separately create the sanction" logic.

## 17.6 Ban / Suspend — `POST /v1/moderation/users/{userId}/suspend` · `POST /v1/moderation/stores/{storeId}/suspend` · `POST /v1/moderation/users/{userId}/ban`

Direct sanction endpoints (equivalent effect to the `decisions` endpoint above with the corresponding `type`, exposed as explicit action shortcuts since "ban this user" is a common, high-clarity moderator action deserving its own obvious endpoint rather than requiring knowledge of the generic decision-type enum). Always requires a linked `ModerationCase`/`Decision` — there is no sanction endpoint that bypasses case creation, ensuring every sanction is traceable (08-database-design.md Section 19.9).

## 17.7 Warnings — `GET /v1/moderation/users/{userId}/warnings`

History of `Warning`s issued to a user/store (Section 19.6), feeding escalating-consequence policy logic both for moderator context and (read-only) for the affected user's own account-standing view.

## 17.8 Appeals — `/v1/moderation/appeals`

`GET` (queue, staff-facing) and, from the affected party's side, `POST /v1/moderation/decisions/{decisionId}/appeal` (`{ "statement": "..." }`, buyer/creator-facing — creates an `Appeal`, Section 19.4). `POST /v1/moderation/appeals/{id}/uphold` · `POST /v1/moderation/appeals/{id}/overturn` (staff decision on the appeal).

## 17.9 Violations — `GET /v1/moderation/users/{userId}/violations`

Read-only accumulated `Violation` history (Section 19.5), informing escalating-consequence decisions — staff-facing context, not directly actionable itself.

---

# 18. CMS APIs

Base path: `/v1/cms` (write, Admin/content-team-scoped) and public read paths for published content (`/v1/pages`, `/v1/articles`, etc., mirroring the Product domain's public-vs-management split pattern, Section 6). Implements 08-database-design.md's CMS domain (Section 20).

## 18.1 Pages — `GET /v1/pages/{slug}` (public) · `/v1/cms/pages` (management, full CRUD)

`Page` + ordered `Section` blocks (08-database-design.md Sections 20.1–20.2). The public endpoint returns only `status: published` pages and only published `Section`s within them; the management endpoints expose drafts and full edit history.

## 18.2 Homepage — `GET /v1/cms/homepage`

A purpose-built aggregate endpoint (same justified-exception pattern as Section 5.10/16.1) assembling the homepage's full composition in one call: active `Banner`s, featured `Collection`s, curated Product rails, active platform `Announcement` — since the homepage is a uniquely high-traffic, uniquely composed screen (07-ui-screens-wireframes.md) that would otherwise require 4–5 separate client-side round trips.

## 18.3 Banners — `/v1/cms/banners` (management) · embedded in Section 18.2's response (public consumption)

`GET`/`POST`/`PATCH`/`DELETE`, scoped by `placement` (08-database-design.md Section 20.3). No standalone public `GET /v1/banners` endpoint — banners are always consumed embedded within the page/homepage response that displays them, since a banner has no meaning outside its placement context.

## 18.4 Featured Products — `PATCH /v1/cms/collections/{id}/featured-products`

Curatorial ordering of a `Collection`'s Product membership (08-database-design.md Section 10.3) — `{ "productIds": ["...", "..."] }` (order-significant array, replacing the full curated set — a rare, deliberate use of full-replacement `PUT`-like semantics on a `PATCH` verb because the curatorial action is inherently "here is the complete new lineup," not an incremental add/remove).

## 18.5 Blogs / Articles — `/v1/articles` (public) · `/v1/cms/articles` (management)

Standard published-content CRUD pattern, mirroring Section 18.1, over `Article` (08-database-design.md Section 20.5).

## 18.6 Static Pages, Policies, FAQs

`Page` (18.1) covers general static pages. Platform-wide `LegalDocument` (Terms, Privacy Policy) is served via `GET /v1/legal/{documentType}` (public, always returns the current effective version, with `GET /v1/legal/{documentType}/versions` for history — mirrors the `StorePolicy` versioning pattern, Section 5.6). `FAQ` management is `/v1/cms/faqs`; public read is `/v1/support/faqs` (Section 15.6) — deliberately exposed under the Support path publicly since that's where a user goes looking for it, even though it's authored via CMS tooling.

## 18.7 SEO Pages — embedded, not standalone

SEO metadata (`SEOContent`, 08-database-design.md Section 20.8) is never a separately-fetched resource; it's embedded in the relevant `Page`/`Article`/Product response (`seo: { metaTitle, metaDescription, canonicalUrl }`), since SEO tags are only ever consumed alongside their owning content for server-side rendering.

## 18.8 Landing Pages

Modeled as a `Page` (18.1) with a marketing-specific `Section` composition — no separate entity or endpoint family, consistent with 08-database-design.md Section 20.2's flexible modular-block design intentionally covering this case without a dedicated "LandingPage" table.

---

# 19. Analytics APIs

Base path: `/v1/admin/analytics` (platform/admin-facing) and `/v1/stores/{storeId}/analytics` (creator-facing, documented in Section 5.11 — cross-referenced, not duplicated here). Implements 08-database-design.md's Analytics domain (Section 21). Every endpoint in this section is **read-only** and **eventually consistent** (Section 2.4/2.5 of the database doc) — none of these endpoints are ever a dependency for a correctness-critical decision elsewhere in the API (a hard rule, restated from the database doc's Section 2.4).

## 19.1 GET /v1/admin/analytics/sales

`{ period, groupBy: "day"|"week"|"month", scope: "platform"|categoryId|storeId }` query-driven, backed by `SalesAnalytics` (Section 21.5) — GMV, order count, AOV time series.

## 19.2 GET /v1/admin/analytics/traffic

Site-wide traffic rollups from `Events`/`ProductViews` (Sections 21.2–21.3) — page views, unique visitors, top entry pages.

## 19.3 GET /v1/admin/analytics/orders · /revenue · /products · /creators · /customers

Domain-scoped rollup views, each backed by the correspondingly-named database rollup table (`SalesAnalytics`, `ProductAnalytics`, `CreatorAnalytics`) or a computed cross-table view — parameterized identically (`period`, `groupBy`, filters relevant to that scope) for consistency across the whole Analytics surface, per Section 1.8's platform-wide consistency rules.

## 19.4 GET /v1/admin/analytics/conversion · /funnels

Funnel-stage breakdowns (view → add-to-cart → checkout-start → purchase), sourced from `Events` (Section 21.2). Funnel definitions themselves are a fixed, platform-defined set at V1 (not user-configurable funnel-building) — a deliberate scope reduction; configurable funnel analytics is a substantial feature in its own right and is out of scope until demonstrated need.

## 19.5 GET /v1/admin/analytics/retention

Cohort-based buyer/creator retention curves, computed by a scheduled aggregation job (not live) — response includes a `computedAt` timestamp so consumers know precisely how stale the cohort data is.

## 19.6 GET /v1/admin/analytics/exports

Lists prior export jobs (mirrors the `GET /v1/jobs/{jobId}` pattern, Section 6.11) with their `resultUrl`s; `POST /v1/admin/analytics/exports` triggers a new one for any of the above report types, always async (`202 Accepted`).

## 19.7 GET /v1/admin/analytics/experiments · POST /v1/admin/analytics/experiments

`Experiment` (Section 21.8) definition CRUD and assignment-summary reads, for the platform's A/B testing infrastructure — Admin/Product-team-scoped, not exposed to Creator or Buyer roles at all.


---

# 20. Upload APIs

Base path: `/v1/media`. Implements 08-database-design.md's Media domain (Section 22) as a single, shared upload pipeline consumed by every other domain (Product media, avatars, review photos, message/ticket attachments, verification documents) — per that domain's explicit design rationale ("avoids five slightly different image implementations across features").

## 20.1 Upload Flow Overview

Uploads are a **two-phase** process, not a single blocking `POST` with the binary inline, for two reasons: (1) large video files should not tie up an API service worker/connection for the duration of transfer, and (2) it decouples "where the bytes physically land" (Section 22.6's `StorageLocation` abstraction) from the API contract, so the storage backend can change without a client-facing breaking change.

**Phase 1 — Request an upload slot:**

`POST /v1/media/uploads`
```json
{ "fileName": "scarf-front.jpg", "mimeType": "image/jpeg", "fileSizeBytes": 2456123, "context": "PRODUCT_MEDIA" }
```
**Response `201 Created`:**
```json
{
  "mediaId": "...",
  "uploadUrl": "https://storage.dreamsbykalakaaar.com/...(signed, short-lived)",
  "uploadMethod": "PUT",
  "expiresAt": "2026-07-22T14:45:00.000Z"
}
```
The `uploadUrl` is a signed, direct-to-storage URL (a standard pre-signed-URL pattern) — the client uploads the binary **directly to object storage**, not through the API service, keeping the API service stateless and avoiding proxying large binary payloads through application servers.

**Phase 2 — Confirm completion:**

`POST /v1/media/{mediaId}/confirm` — called by the client after the direct storage upload succeeds. Transitions `Media.uploadStatus` from `processing` to a pending-validation state and enqueues async processing (Section 20.5). Response `202 Accepted`.

Clients poll `GET /v1/media/{mediaId}` (or subscribe to a real-time `media.ready` event, mirroring Section 13.8's pattern) until `uploadStatus: "ready"`, at which point `thumbnailUrls`/`url` fields are populated and the media may be referenced by other resources (Product media, Review media, etc.).

## 20.2 GET /v1/media/{id}

```json
{
  "id": "...",
  "mediaType": "IMAGE",
  "uploadStatus": "READY",
  "url": "https://cdn.dreamsbykalakaaar.com/...",
  "thumbnails": { "small": "...", "medium": "...", "large": "..." },
  "width": 2400,
  "height": 1800,
  "altText": null
}
```
`altText` is populated separately (Section 6.10's context-specific alt-text pattern, 08-database-design.md Section 22.7) since a single image may need different alt text per usage context — this base media object exposes only a fallback/default value if one has been set.

## 20.3 File/Chunk Upload for Large Files (Video)

For files above a size threshold (implementation-configurable, e.g., 20MB), Phase 1's response instead returns **multiple** signed chunk-upload URLs plus a `multipartUploadId`, and Phase 2 becomes `POST /v1/media/{mediaId}/confirm-multipart` with the ordered list of uploaded chunk ETags — following the standard multipart-upload pattern most object-storage providers natively support, rather than inventing a bespoke chunking protocol.

## 20.4 Validation

Server-side, on confirmation: MIME-type verification against actual file content (not just the client-declared `mimeType`, which is untrusted input), file-size-limit enforcement per `context` (e.g., avatars capped smaller than product galleries), and dimension/duration sanity checks. **Errors** (returned from the `confirm` call once async validation completes, surfaced via the polled `GET`/real-time event): `422 INVALID_FILE_TYPE`, `422 FILE_TOO_LARGE`, `422 CORRUPT_FILE`.

## 20.5 Compression & Image Processing

Asynchronous, background-job-driven (08-database-design.md Section 22.4–22.5, Section 28.6 of that document) — thumbnail generation at standard size variants, format optimization (e.g., WebP/AVIF derivative generation alongside the original), and, for images, dominant-color extraction for blur-up placeholder rendering. None of this blocks the upload-confirmation response; it happens after `202 Accepted`, with `uploadStatus` transitioning `processing → ready` (or `failed`) once complete.

## 20.6 Virus Scan

A mandatory async validation step for all uploads before `uploadStatus` can reach `ready` — files failing the scan transition to `failed` with a generic `{"reason": "FAILED_SECURITY_SCAN"}` (deliberately non-specific to avoid giving an attacker signal about which detection evaded/triggered) and are never made retrievable via `url`/`thumbnails`, regardless of caller.

## 20.7 CDN URLs

All `url`/`thumbnails` values returned by this domain are CDN-fronted URLs (never direct storage-bucket URLs), consistent with 08-database-design.md Section 22.6's storage-location abstraction — the API's job is to hand back a fast, cacheable, publicly-fetchable URL; which physical CDN/storage backend serves it is an infrastructure concern invisible to the contract.

## 20.8 Signed/Time-Limited URLs for Sensitive Media

For non-public media (creator verification documents, Section 5.8; ticket attachments, Section 15.3), `url` is **not** a long-lived CDN URL but a short-lived signed URL (regenerated fresh on each `GET`, per-caller-authorized) — the general `GET /v1/media/{id}` endpoint applies the correct access policy automatically based on `context` and the caller's role, so consuming code elsewhere in the API never has to special-case "is this sensitive media" logic itself.

## 20.9 Deletion

`DELETE /v1/media/{id}` is only permitted when the caller is the uploading user (or staff) **and** the media has no active references from any other resource (enforced server-side by checking `08-database-design.md Section 25.1`'s reference-counting model) — otherwise `409 MEDIA_IN_USE`. Orphaned, never-referenced uploads are additionally garbage-collected automatically by a background job after a grace period, so a client is never required to explicitly clean up an abandoned upload flow.

---

# 21. Webhook Specifications

This section covers two distinct directions: **inbound** webhooks (external providers, primarily the payment processor and shipping carriers, notifying the platform) and **outbound** webhooks (the platform notifying future third-party integrators, Section 29). At V2 launch, only inbound webhooks are load-bearing; outbound webhooks are documented as a reserved, forward-compatible contract.

## 21.1 Inbound: Payment Processor Webhooks — `POST /v1/webhooks/payments/{provider}`

Receives asynchronous payment lifecycle events (`payment_intent.succeeded`, `payment_intent.failed`, `charge.dispute.created`, `payout.paid`, etc. — exact event names are processor-specific and enumerated in the eventual OpenAPI spec once a specific processor is selected). This endpoint is the **authoritative** source of truth for payment state (Section 9.10 explicitly defers final order-completion confirmation to this path, not client-reported success) — a payment is never considered final based on client-side signals alone.

## 21.2 Inbound: Shipping Carrier Webhooks — `POST /v1/webhooks/shipping/{carrier}`

Receives tracking-status updates, creating `ShipmentTracking` rows (08-database-design.md Section 13.8) and, on a terminal "delivered" event, auto-advancing `Shipment`/`SubOrder` status — the primary path for delivery confirmation, with Section 10.9's manual `mark-delivered` action as a fallback for carriers without webhook support.

## 21.3 Verification & Security

Every inbound webhook **must** verify the provider's signature (HMAC-based, per each provider's documented scheme) before processing — an unsigned or invalid-signature request is rejected with `401 INVALID_WEBHOOK_SIGNATURE` and is **not** retried by the platform (retry behavior, Section 21.4, applies to the platform's own processing failures, not to rejecting forged requests). Webhook endpoints are explicitly exempted from standard user-facing rate limiting (Section 8) but are subject to their own, more generous, provider-specific throughput allowance, since legitimate webhook traffic is bursty and provider-controlled, not user-controlled.

## 21.4 Retry Strategy (Inbound)

If the platform's processing of a valid, verified webhook fails transiently (e.g., a momentary database issue), the platform returns a `5xx` so the provider's own retry mechanism re-delivers — this endpoint's contract explicitly relies on the provider's retry/backoff behavior rather than reimplementing one, since duplicating a well-tested provider retry system adds risk without benefit. All webhook processing is designed to be **idempotent by construction** (keyed on the provider's own event ID, deduplicated server-side) so a provider's retry-driven re-delivery never causes a duplicate `Order`/`Payment` state change.

## 21.5 Payload Structure

Inbound payloads follow each provider's own documented schema (not a Dreams by Kalakaaar-defined shape, since the platform is a webhook *consumer* here) — this document does not redefine them, but requires that every handler validate the payload against the provider's published schema before acting on it, rejecting unrecognized/malformed payloads with a logged `SecurityEvent` rather than best-effort partial processing.

## 21.6 Supported Events (Summary Table)

| Source | Event | Effect |
|---|---|---|
| Payment processor | `payment_intent.succeeded` | Finalizes order (if not already finalized via the synchronous `complete` path, Section 9.10 — whichever arrives first wins, the other is a no-op deduplication) |
| Payment processor | `payment_intent.payment_failed` | Releases reservations, marks `PaymentIntent`/`CheckoutSession` failed |
| Payment processor | `charge.dispute.created` | Creates `Dispute` (08-database-design.md Section 14.8), alerts Admin |
| Payment processor | `payout.paid` / `payout.failed` | Updates `Payout` status (Section 14.5) |
| Shipping carrier | `shipment.in_transit` / `shipment.delivered` / `shipment.exception` | Creates `ShipmentTracking`, advances `Shipment` status |

## 21.7 Internal/Scheduled Triggers (Not True Webhooks, Documented for Completeness)

Several "background job" effects referenced throughout this document (`Settlement` reconciliation, `SearchIndex` rebuilding, aggregate-counter recomputation) are triggered by a scheduler (cron-style, per Section 1.9's architecture-option table), not by inbound webhooks — noted here explicitly so implementers don't mistake every async effect in this document for a webhook-driven one.

## 21.8 Outbound Webhooks (Future — Contract Reserved)

Per 00-project-vision.md Section 26's future-opportunities list (marketplace integrations, third-party syndication), the platform will eventually need to notify external systems of its own events (`order.created`, `product.updated`). Reserved contract: `POST /v1/admin/webhook-subscriptions` (partner/integrator registers a callback URL + event-type subscription list), with outbound deliveries signed with a Dreams-by-Kalakaaar-issued HMAC secret (mirroring the verification pattern this platform itself relies on as a consumer, Section 21.3) and following the same idempotent, retry-with-backoff contract described above, symmetrically applied in the outbound direction.


---

# 22. API Security

This section restates and extends 08-database-design.md Section 29 (Security Strategy) specifically at the API contract layer — the database document defines what's protected at rest and in the schema; this section defines what's enforced at the request/response boundary.

## 22.1 JWT

Access tokens are short-lived (Section 3.1), asymmetrically signed, and carry only the minimum claims needed for stateless authorization decisions (`sub`, `roles`, `storeId` context, `exp`, `iat`). No PII beyond the User ID is embedded in the token itself — role and permission data is intentionally kept in the token (rather than requiring a database lookup per request) for performance, but is treated as **advisory** for UX purposes only where the stakes are low; every genuinely sensitive authorization decision (Section 22.2) is re-verified against current database state, not trusted from a token that could be up to 15 minutes stale relative to a just-revoked permission.

## 22.2 Authorization: RBAC

Every endpoint's required role(s) are explicitly documented (Sections 3–21 state this per resource group; the full per-endpoint matrix belongs in the OpenAPI spec, Section 26). Enforcement happens in a shared authorization layer applied before any handler logic runs, mirroring 08-database-design.md Section 6.8's RBAC-as-default philosophy at the schema layer — the API does not reimplement authorization logic per-endpoint; it declares required roles/permissions and defers to one shared enforcement mechanism, both for consistency and to make a security audit of "what can each role do" tractable (one place to review, not thirty).

## 22.3 Authorization: Ownership & ABAC

Beyond role membership, many endpoints require **ownership** (a Creator managing only their own Store's data, a Buyer accessing only their own Order) — this is enforced as a second, explicit check per-resource (never assumed from role alone), using the same `ResourcePermission` extension seam documented at the database layer (08-database-design.md Section 6.5/6.9) for the narrower set of cases needing fine-grained, temporary, or cross-boundary grants (e.g., a Support Executive escalated into a specific order's context, Section 6.5 of the database doc).

## 22.4 Anti-Enumeration Pattern

Applied consistently across this document (Sections 3.3, 3.6, 8.7): where a resource's existence is itself sensitive information (does this email have an account, is this coupon code valid, does this specific Order ID belong to anyone), the API returns identical, generic responses (`401`, `404`, or a neutral `200`) regardless of whether the underlying reason is "doesn't exist" or "exists but you're not authorized," specifically to prevent an attacker from using response differences to enumerate valid emails, coupon codes, or resource IDs. This is a deliberate, documented deviation from the otherwise-precise `403` vs. `404` distinction (Section 2.3) — the general rule is "be precise," with this named, narrow exception where precision itself is the vulnerability.

## 22.5 Rate Limiting

See Section 8 (headers) and Section 24 for the mechanics; the security purpose specifically is: brute-force protection on `/v1/auth/login` (tighter, IP+account-keyed limits), abuse protection on messaging/review-creation (spam prevention), and general fair-use protection on every other endpoint. Limits are tiered by authentication state (unauthenticated requests get the tightest limits) and by role (Admin/internal service-to-service calls may run under a separate, higher-throughput tier, explicitly configured rather than exempted entirely — even internal tooling should not be able to accidentally hammer the database unbounded).

## 22.6 CSRF

Because the API uses `Authorization: Bearer` tokens (not cookie-based session auth) for all state-changing requests, classic CSRF (which exploits ambient cookie-based auth) is substantially mitigated by construction — the one exception is the refresh-token cookie itself (Section 3.1), which **is** vulnerable to CSRF in principle; it is mitigated by `SameSite=Strict` (preventing the cookie from being sent on cross-site requests at all) plus scoping the refresh endpoint to only ever return a new access token (never directly mutate account state), minimizing the blast radius even in a hypothetical bypass.

## 22.7 XSS

The API's responsibility here is narrow but important: never reflect unsanitized user input back in a response in a way that could be executed if a client naively rendered it as HTML (the frontend's responsibility to escape on render is primary, but the API additionally strips/rejects obviously malicious payloads — script tags, event handler attributes — in free-text fields like Review bodies and Messages, as defense-in-depth, not as the sole control).

## 22.8 SQL Injection

Not directly an API-contract concern (it's an implementation-layer guarantee provided by parameterized queries/the ORM, per 08-database-design.md's Drizzle-based implementation path) but stated here as a non-negotiable requirement: **no endpoint may ever construct a query by string-concatenating unsanitized request input**, regardless of framework. This is a hard implementation rule this document establishes even though it's not itself expressible as part of the wire contract.

## 22.9 Request Validation

Every endpoint validates its request body/query/path parameters against a strict schema **before** any business logic executes — unknown fields are rejected by default (not silently ignored) on write endpoints, since silently accepting-and-discarding unexpected fields can mask client bugs and, in edge cases, be an injection vector for logic the client believes it's setting but isn't. (This is the one place this document deliberately diverges from the "unknown query filters are ignored, not errored" convention of Section 2.8 — that leniency applies specifically to **read-endpoint filter parameters**, an additive-and-safe case; **write-endpoint body fields** are validated strictly, since an unexpected field silently accepted on a write is a materially different risk than an unrecognized filter silently ignored on a read.)

## 22.10 Response Validation

Every response is validated against its documented schema before being sent (server-side, as a defense-in-depth safety net against handler bugs accidentally leaking an internal field) — e.g., a bug that accidentally includes a `passwordHash` field on a `User` object is caught by response-schema validation stripping unlisted fields, not relied upon to simply "not happen" through code review alone.

## 22.11 Input Sanitization

Free-text fields (Review bodies, Messages, Product descriptions) are sanitized for storage (never storing raw executable markup) while preserving intended rich-text formatting where applicable (e.g., Product descriptions support a constrained, allow-listed rich-text subset — bold, italics, lists, links — never arbitrary HTML/script).

## 22.12 Sensitive Data Masking

Applied consistently: payment method details (Section 11.2 — last4/brand only), payout bank details (Section 5.9 — masked account numbers), and any other field flagged sensitive at the database layer (08-database-design.md Section 29.1) is masked in every response by default; an unmasked value is **never** returned by any read endpoint, full stop — only accepted on write, and only ever used, decrypted, at the point of actual processor/bank submission.

## 22.13 Encryption

In transit: TLS everywhere, no exceptions, including internal service-to-service calls. At rest: inherited from the database layer's posture (08-database-design.md Section 29.1); the API layer's specific responsibility is to never log sensitive field values in plaintext (structured logging redacts fields tagged sensitive before they reach any log sink).

## 22.14 Audit Logging

Every mutating request (`POST`/`PATCH`/`PUT`/`DELETE`) produces an `AuditLog` entry (08-database-design.md Section 23.1) keyed by the request's Correlation ID (Section 2.18), capturing actor, action, target, and before/after state — this is enforced at the same shared middleware layer as authorization (Section 22.2), not left to individual endpoint implementations to remember to call, ensuring no endpoint can accidentally ship without audit coverage.

## 22.15 API Keys (Future — Internal Service-to-Service and Partner Access)

At V2 launch, all clients are first-party and authenticate via the standard JWT flow (Section 3); there is no public API-key-based access. Section 29's future public/partner API will introduce API keys as a separate authentication mechanism (distinct from user JWTs — a key represents an *application*, not a *user*), scoped, rotatable, and revocable, with their own rate-limit tier (Section 22.5) — reserved here so the eventual design doesn't collide with assumptions baked into the user-auth flow.

## 22.16 Secrets

No API secret (signing keys, processor API keys, webhook signing secrets) is ever transmitted to or stored by any client — they exist only server-side, managed through the deployment platform's secrets management (Vercel/Supabase environment configuration, or equivalent under Option A of Section 1.9), rotated on a defined schedule, and never logged.

## 22.17 CORS

The API's CORS policy allows only the platform's own first-party frontend origins (Buyer App, Creator Dashboard, Admin Panel, Moderator Panel, Support Panel, Public Website domains) at V2 — no wildcard origin, ever, given the sensitivity of the data in play. A future public API (Section 29) would introduce a separate, more permissive CORS policy scoped specifically to its own dedicated endpoints, never loosening the first-party surface's policy.

---

# 23. Error Handling

## 23.1 Global Error Format

Restated from Section 2.15 for completeness of this section: every error, from every endpoint, uses the single envelope shape defined there. This section catalogs the `code` values by category.

## 23.2 Validation Errors (`400` / `422`)

| Code | Meaning |
|---|---|
| `VALIDATION_ERROR` | Generic field-level validation failure; see `details` array. |
| `MISSING_REQUIRED_FIELD` | A specific required field was absent (may appear within `details` rather than as the top-level code). |
| `INVALID_FORMAT` | A field's value doesn't match its expected format (email, UUID, date). |
| `BUSINESS_RULE_VIOLATION` | A `422`-class domain rule failure not covered by a more specific code below (e.g., "Product not publish-ready"). |

## 23.3 Authentication Errors (`401`)

| Code | Meaning |
|---|---|
| `UNAUTHENTICATED` | No or malformed `Authorization` header. |
| `TOKEN_EXPIRED` | Access token past `exp` — client should attempt `POST /v1/auth/refresh`. |
| `INVALID_CREDENTIALS` | Login failure (Section 3.3's anti-enumeration-unified code). |
| `INVALID_REFRESH_TOKEN` | Refresh flow failure (Section 3.5). |

## 23.4 Authorization Errors (`403`)

| Code | Meaning |
|---|---|
| `FORBIDDEN` | Generic role/permission failure. |
| `NOT_RESOURCE_OWNER` | Authenticated, correct role, but fails the ownership check (Section 22.3). |
| `ACCOUNT_SUSPENDED` / `ACCOUNT_BANNED` | Account-standing-based access denial (with support-contact `details`). |
| `USER_BLOCKED` | Messaging-specific block enforcement (Section 13.7). |

## 23.5 Business Rule Errors (`422` / `409`)

| Code | Meaning |
|---|---|
| `INSUFFICIENT_STOCK` | Cart/checkout stock validation failure (Section 8.2). |
| `PRODUCT_NOT_PUBLISH_READY` | Product publish-readiness gate (Section 6.4). |
| `CANCELLATION_WINDOW_PASSED` | Order-cancellation eligibility failure (Section 10.6). |
| `NOT_ELIGIBLE_TO_REVIEW` | Review eligibility gate (Section 12.2). |
| `SLUG_IMMUTABLE` | Immutable-slug business rule (Section 5.4). |
| `STORE_NOT_VERIFIED` | Store-publish precondition (Section 5.4). |

## 23.6 Payment Errors (`402` / `422`)

| Code | Meaning |
|---|---|
| `PAYMENT_FAILED` | Processor-reported payment failure (Section 9.10). |
| `PAYMENT_METHOD_DECLINED` | Specific decline reason surfaced from the processor, mapped to a platform-stable code set (not the processor's raw, potentially-changing error strings — this document's `code` values are a stable abstraction the frontend can rely on regardless of which processor is behind them). |

## 23.7 Rate Limit Errors (`429`)

| Code | Meaning |
|---|---|
| `RATE_LIMIT_EXCEEDED` | Always paired with a `Retry-After` header (seconds) and the standard `X-RateLimit-*` headers (Section 2.20). |

## 23.8 Server Errors (`500` / `503`)

| Code | Meaning |
|---|---|
| `INTERNAL_ERROR` | Generic unexpected failure. `message` is always a fixed, generic string ("An unexpected error occurred.") — internal exception detail, stack traces, and database error text are **never** included in the response body, only in server-side logs keyed by `correlationId`, per Section 22.10's response-validation safety net. |
| `SERVICE_UNAVAILABLE` | Planned maintenance or downstream dependency outage; includes `Retry-After` where a maintenance window end time is known. |
| `DEPENDENCY_TIMEOUT` | A downstream call (payment processor, storage) exceeded its timeout budget (Section 24.9). |

## 23.9 Retry Strategy (Client Guidance)

This document recommends, and the eventual client SDKs (Section 26) should implement, exponential backoff with jitter for `429`, `503`, and `DEPENDENCY_TIMEOUT` responses, honoring any `Retry-After` header as a floor. `500` responses are **not** automatically retried by client-side logic beyond a single conservative attempt — a repeated `500` likely indicates a genuine bug, not a transient condition, and blind retry storms against a struggling backend are counterproductive. Mutating requests are only safely retryable when an `Idempotency-Key` was supplied (Section 2.6); clients must not blindly retry a `POST` without one.


---

# 24. Performance Guidelines

## 24.1 Caching

Every `GET` response declares an explicit `Cache-Control` directive, tiered by volatility: fully public, rarely-changing resources (`/v1/categories`, published `/v1/pages/{slug}`) get long `max-age` with CDN caching; personalized/frequent-write resources (`/v1/carts/current`, `/v1/orders`) are `no-store` or very short `max-age` with `must-revalidate`; semi-personalized, moderate-volatility resources (`/v1/products/{id}`) use a short `max-age` plus `ETag`-based conditional-request support (`If-None-Match` → `304 Not Modified`), letting clients avoid re-downloading unchanged payloads without sacrificing freshness. This mirrors 08-database-design.md Section 2.10's layered caching philosophy, applied concretely at the HTTP layer.

## 24.2 Compression

All responses above a small size threshold are `gzip`/`br`-compressed (standard `Accept-Encoding` negotiation) — assumed infrastructure-level behavior (reverse proxy / edge layer), not something individual endpoint implementations need to handle themselves, but stated here as a required platform-wide default given the moderately large payloads some endpoints (full Order detail, full Product detail with embeds) can produce.

## 24.3 Pagination (cross-reference)

See Section 2.7. Restated here for completeness of the Performance section: this is the single highest-leverage contract decision for API performance at scale, since it directly determines whether list endpoints degrade linearly or remain roughly constant-time as the underlying tables grow into the millions of rows (08-database-design.md Section 27.6).

## 24.4 Lazy Loading (Embedding Discipline)

Per Section 2.17, related-resource embedding is opt-in (`?include=`), never on-by-default for anything beyond the minimal fields a screen needs — a list endpoint never eagerly embeds every possible relationship "just in case," since that would silently degrade every caller's performance for the benefit of the rare caller that needed the extra data. Each endpoint's documentation (Sections 3–21) explicitly states its default embed set and its full list of supported optional includes.

## 24.5 Batch APIs

Where a client's real-world usage pattern would otherwise require many sequential single-resource calls, a purpose-built batch endpoint is provided instead of leaving the client to hand-roll `Promise.all`-style fan-out (which multiplies request overhead and complicates error handling): bulk product import/export (Section 6.11), bulk notification-read (Section 14.2's `read-all`), bulk address/cart operations kept deliberately simple since those collections are naturally small. New batch endpoints are added reactively, based on observed real client call-pattern data post-launch, rather than speculatively for every resource — over-provisioning batch endpoints "just in case" adds contract surface area without demonstrated value.

## 24.6 Parallel Requests

The API contract is designed so a well-built client **can** safely fire independent `GET` requests in parallel (e.g., fetching Product detail and its Reviews simultaneously) — no endpoint has a hidden ordering dependency on another within a single page-load's data-fetching phase, except where explicitly documented (e.g., checkout's step endpoints, Section 9, are inherently sequential by business logic, not an artificial contract limitation).

## 24.7 Request Limits

Maximum request body size is capped (recommended: 1MB for JSON bodies; binary uploads are handled entirely outside the JSON request path via the signed-URL flow, Section 20.1, specifically to avoid ever needing a large binary-carrying JSON request). Maximum `limit` query parameter value is capped at 100 (Section 2.7) to prevent a single request from requesting an unreasonably large page.

## 24.8 Timeouts

Every endpoint has a maximum processing-time budget (recommended: 10 seconds for synchronous endpoints) after which the platform returns `503 SERVICE_UNAVAILABLE` / `DEPENDENCY_TIMEOUT` rather than holding the connection indefinitely — this is precisely why genuinely slow operations (bulk import, analytics export, media processing) are modeled as async (`202 Accepted` + job polling, Section 6.11) rather than synchronous in the first place; the timeout budget is a safety net for unexpected slowness, not a design tool for handling expected slowness.

## 24.9 Streaming

Not used for any endpoint at V1 — every response is a complete, buffered JSON payload. This is a deliberate simplicity choice: streaming (chunked transfer, server-sent events) adds meaningful client and infrastructure complexity, and V1's data volumes (bounded by pagination, Section 2.7) don't yet justify it. The one exception, real-time messaging/notification delivery (Section 13.8, Section 14.3), uses a dedicated real-time channel rather than HTTP streaming on the REST endpoints themselves — kept as a clearly separate mechanism rather than blurring the REST contract's request/response model.

---

# 25. API Versioning

## 25.1 v1

The entire contract in this document is `v1`, effective from V2 platform launch (note: platform "V2" and API "v1" are independent numbering schemes — the platform's second major version launches with the API's *first* major version, since this is a ground-up rebuild with no prior public API to version against).

## 25.2 Future v2 (API)

A future API `v2` is anticipated to be driven by the same forces named in 08-database-design.md Section 30 (AI features, subscriptions, wholesale, internationalization) wherever those require a genuinely breaking contract change (Section 1.6) rather than an additive one — most of Section 30's extension points there are designed precisely so they *don't* require an API version bump, and the same additive-first philosophy applies here: a new API major version is a last resort, not a default response to new features.

## 25.3 Deprecation

A deprecated endpoint/field is marked with a `Deprecation` response header (per the emerging IETF convention) carrying a sunset date, and is documented as deprecated in the OpenAPI spec (Section 26) with a stated replacement. Deprecated surface area remains fully functional for a minimum, published deprecation window (recommended: 6 months) before removal.

## 25.4 Migration

When `v2` is eventually introduced, `v1` continues running unmodified for its deprecation window — the platform runs both versions simultaneously (not a hard cutover), giving every client team a defined migration runway. A migration guide (endpoint-by-endpoint mapping of what changed and why) is a required deliverable alongside any future `v2` launch, mirroring this document's own level of explanatory detail.

## 25.5 Compatibility

Within `v1`'s lifetime, Section 1.6's additive/breaking distinction is the enforced contract; any change classified as breaking is, by definition, not permitted to ship under the `v1` path at all — it either waits for `v2` or is redesigned to be additive.

---

# 26. Documentation Standards

## 26.1 OpenAPI / Swagger

The authoritative, machine-readable contract is an OpenAPI 3.1 specification, generated from (or kept in strict lockstep with) this document — this document is the human-readable narrative and rationale; the OpenAPI file is the precise, implementable, tooling-consumable schema (exact field types, required/optional flags, enum value lists, min/max constraints) that this document intentionally does not duplicate at that level of low-level precision (per this document's own stated purpose: specification, not implementation detail). Every endpoint described in Sections 3–21 must have a corresponding OpenAPI path definition before implementation begins; a discrepancy between the two is treated as a bug in whichever one is wrong, resolved before coding proceeds, never silently left unreconciled.

## 26.2 Examples

Every OpenAPI operation includes at least one realistic request example and one realistic success-response example, plus at least one representative error-response example per distinct error condition the endpoint can produce — mirroring the representative examples already given throughout Sections 3–21 of this document, expanded to full coverage in the machine-readable spec.

## 26.3 Request/Response Samples

Generated automatically from the OpenAPI examples (26.2) into human-browsable API reference documentation (e.g., via a standard OpenAPI-rendering tool), so the reference docs and the machine-readable contract can never drift from each other — they are the same source, rendered two ways.

## 26.4 Field Descriptions

Every field in every schema carries a one-sentence `description` in the OpenAPI spec, cross-referencing the owning database entity from 08-database-design.md where relevant (e.g., a `Product.status` field's description notes its five-state lifecycle and links back to that document's Section 8.1) — maintaining the traceability chain from database design through API contract that this document's own introduction establishes as a principle.

## 26.5 Enums

Every enum field's OpenAPI schema explicitly lists all current valid values, and each is annotated as either a **closed enum** (adding a new value is a breaking change, requiring a version bump — used sparingly, only where client logic is known to exhaustively switch on every value with no default case, e.g., a payment method type driving completely different SDK integration code per value) or an **open enum** (new values may be added non-breakingly per Section 1.6, and clients must handle an unrecognized value gracefully, typically by falling back to a generic display treatment — the default posture for most status/category fields in this document, e.g., `ModerationCase.subjectType` or `Notification.type`, where new values are expected to be added over time as the platform grows).

## 26.6 Validation Rules

Every field's format, length, and range constraints (mirroring 08-database-design.md Section 26's constraint definitions, translated to the API's request-validation layer, Section 22.9) are captured in the OpenAPI schema using standard JSON Schema constructs (`minLength`, `maxLength`, `pattern`, `minimum`, `maximum`) rather than left implicit in prose, so client-side form validation can be generated directly from the same source of truth as server-side validation, eliminating an entire category of "client validation doesn't match server validation" bugs.

---

# 27. API Lifecycle

## 27.1 Design

Every new endpoint or breaking change begins as a proposed addition to this document (or its OpenAPI companion) and is reviewed against the Final Review Checklist (Section 29) **before** implementation begins — this document's own existence is the enforcement mechanism for a documentation-first API lifecycle, mirroring the project's overall documentation-first workflow.

## 27.2 Development

Implementation proceeds directly from the agreed OpenAPI spec; contract tests (verifying the implementation matches the spec, not just "the code works") are a required part of any endpoint's definition of done, catching drift between documented and actual behavior before it reaches a client team.

## 27.3 Testing

Beyond contract tests, every endpoint requires: unit tests for its business-rule branches (the `422`-class errors enumerated in Section 23.5 in particular, since these encode the platform's actual business logic), and integration tests covering its documented authorization matrix (Section 22.2/22.3) — a role that should be forbidden must be tested as forbidden, not just assumed.

## 27.4 Release

Endpoints ship behind the same `FeatureFlagAccess` mechanism documented at the database layer (08-database-design.md Section 6.6) where a phased rollout is warranted (new checkout flows, new payment methods) — the API contract itself doesn't change based on flag state (the endpoint always exists and is always documented), but its *behavior* may be gated, keeping the contract stable while still allowing safe, gradual rollout.

## 27.5 Monitoring

Every endpoint's error rate, p50/p95/p99 latency, and rate-limit-rejection rate are tracked from launch, keyed by the same Correlation ID / endpoint-path dimensions established in Section 2.18 — the observability strategy is inseparable from the contract decisions made in this document (correlation IDs, stable error codes) precisely because they were designed together, not bolted on after the fact.

## 27.6 Deprecation & Sunset Policy

Restated from Section 25.3–25.4 with the operational lens: a deprecated endpoint's usage is actively monitored (not just documented-and-forgotten); if usage remains non-trivial as the sunset date approaches, the affected client team(s) are proactively notified before removal, not surprised by a `410 Gone` on the sunset date itself.

---

# 28. Future APIs

Per 00-project-vision.md Section 25–26 and 08-database-design.md Section 30, the following are explicitly **not** part of the V1 contract but have identified extension points already reserved (each cross-referenced to where in this document or the database doc the seam already exists):

| Future capability | Reserved extension point |
|---|---|
| AI Recommendations | `GET /v1/products/{id}/recommendations`'s `type` parameter (Section 7.6) already anticipates an `AI_SIMILARITY` value, additive per Section 26.5's open-enum convention. |
| AI Search | `GET /v1/search` (Section 7.1) is already the single search entry point; a future ranking-algorithm change is an internal implementation detail behind the same contract, not a new endpoint. |
| Voice Search | Would layer a speech-to-text client-side (or a new `POST /v1/search/voice` accepting audio, transcribing server-side) ahead of the existing `GET /v1/search` contract — reserved as an additive new endpoint, not a change to the existing one. |
| AR Preview | `ProductMedia`'s `mediaType` extension point (08-database-design.md Section 8.3/30) anticipates a 3D/AR asset type; `GET /v1/products/{id}` would additively expose an `arAssetUrl` field. |
| Live Shopping | A genuinely new domain (real-time video + integrated cart actions) — no existing extension point claims to cover this; documented honestly as requiring net-new design work, not a small addition, when scoped. |
| Subscriptions | `POST /v1/subscriptions` (new resource) would generate recurring `Order`s via the same `POST /v1/checkout/sessions/{id}/complete` internal path (Section 9.10) programmatically — the Order-creation contract itself needs no change. |
| Gift Registry | Builds on `GiftHistory`/`GiftMessage` (08-database-design.md Section 30) — a new `/v1/registries` resource family, additive. |
| Marketplace Ads | A new domain entirely (ad placement, creator ad spend, impression tracking) — reserved namespace `/v1/ads`, no further design committed at this stage. |
| Creator Memberships | Would extend the `Creator`/`Store` domain (Section 5) with a new tier/subscription-status field plus gated-feature-access endpoints — additive to existing resources rather than a new domain. |
| Internationalization | Section 2.11's money-as-minor-units-plus-currency-code convention and Section 9.6's jurisdiction-aware tax modeling are already internationalization-ready; a future multi-locale launch primarily needs new `Accept-Language`-driven content-translation endpoints (`/v1/products/{id}/translations/{locale}`) layered on top, not a restructuring of existing ones. |

---

# 29. Final Review Checklist

Before any endpoint in this document is considered ready for OpenAPI formalization and implementation, it is reviewed against:

- [ ] **Consistency** — does it follow Section 2's naming, pagination, filtering, error-format, and response-envelope conventions without an undocumented deviation?
- [ ] **Naming** — are the URL, field names, and enum values consistent with Section 2.1's conventions and with equivalent patterns elsewhere in this document?
- [ ] **Security** — is its required role/ownership check explicit (Section 22.2/22.3)? Does it avoid leaking sensitive data (Section 22.12)? Is it correctly rate-limited (Section 22.5)?
- [ ] **Scalability** — does its list-endpoint pagination avoid offset-based patterns (Section 2.7)? Does it avoid N+1 patterns that would degrade at scale (Section 24.4)?
- [ ] **Performance** — does it declare an appropriate caching policy (Section 24.1)? Are slow operations correctly modeled as async (Section 24.8)?
- [ ] **Maintainability** — does every field and relationship trace back to a documented entity in 08-database-design.md, with no undocumented "mystery field"?
- [ ] **Developer Experience** — does it have complete request/response examples (Section 26.2)? Are its error codes specific and actionable (Section 23)?
- [ ] **Future Readiness** — for any field likely to need future extension (Section 28), is it modeled as an open enum or otherwise additive-friendly (Section 26.5) rather than a closed, breaking-change-prone shape?

---

*This document is the definitive API specification for Dreams by Kalakaaar v2. No route handler, controller, service, or client SDK should be written without first tracing its shape back to a decision documented here — and, per Section 26.1, without a corresponding, kept-in-sync OpenAPI definition. Where an implementation need arises that this document does not yet cover, this document must be updated first — the contract leads, the code follows. See Section 1.9 for the one open architectural decision (backend framework choice) that should be resolved with the founders before implementation begins.*
