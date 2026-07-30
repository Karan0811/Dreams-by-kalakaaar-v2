# 08 · Database Design — Dreams by Kalakaaar v2

**Document owner:** Principal Software Architect / Staff Database Architect
**Status:** Draft for review
**Audience:** Founders, Engineering, Database/Platform Team, Security, QA, Future team members
**Last updated:** 2026
**Depends on:** 00-project-vision.md, 01-product-requirements.md, 02-user-personas.md, 03-user-journeys.md, 04-information-architecture.md, 05-design-principles.md, 06-design-system.md, 07-ui-screens-wireframes.md
**Precedes:** 09-api-architecture.md, 10-infrastructure-architecture.md (future), all ORM models, all migrations

> **This document defines logical database architecture only.** It contains no SQL, no Prisma schema, no Drizzle ORM models, and no migration code. Its purpose is to be the single, unambiguous reference that the eventual Drizzle ORM schema, Supabase/PostgreSQL migrations, and RLS policies are implemented *from* — not the other way around. If an implementation detail is not traceable to a decision in this document, the implementation is wrong, or this document is incomplete and must be updated first.

---

# 1. Introduction

## 1.1 Purpose

Dreams by Kalakaaar v2 is a multi-creator marketplace connecting independent artisans ("Kalakaars") with buyers seeking handmade, personalized, and story-rich products. Every functional module described in 01-product-requirements.md — authentication, storefronts, products, customization, cart/checkout, orders, payments, messaging, reviews, notifications, support, moderation, CMS, analytics, and search — ultimately reads from and writes to a relational database. This document exists to design that database as a coherent whole *before* a single table is created, so that:

- Every entity has a clear owner, purpose, and lifecycle.
- Every relationship is deliberate, not accidental.
- Every future feature (AI, internationalization, wholesale, subscriptions) has a known extension path rather than requiring destructive schema surgery.
- Engineers implementing the Drizzle ORM schema have one unambiguous source of truth instead of reverse-engineering intent from code.

## 1.2 Objectives

1. Define a normalized, PostgreSQL-native logical data model covering all 26 domains required by the product.
2. Establish a database philosophy (normalization posture, caching, search, archiving, soft delete, audit) that scales from day one to millions of users, products, and orders without a rewrite.
3. Specify entity purpose, attributes (by category, not by SQL type), relationships, lifecycle, indexing intent, and constraints for every entity.
4. Provide a relationships matrix and cascade/deletion strategy that removes ambiguity around what happens when a parent entity is deleted, suspended, or archived.
5. Define security, performance, and compliance strategies (encryption, PII handling, GDPR-readiness, backups, disaster recovery) at the data layer.
6. Provide a forward-looking extension model for AI, internationalization, wholesale/B2B, subscriptions, and marketplace federation so v2's schema does not need to be redesigned to support v3+.

## 1.3 Scope

**In scope:** logical entities, domains, relationships, cardinalities, lifecycle states, indexing *intent*, constraint *intent*, partitioning philosophy, caching philosophy, search philosophy, security and compliance posture, and future extension points.

**Out of scope:** physical table DDL, Drizzle schema definitions, migration scripts, exact column types/lengths, exact index syntax, ORM query code, API contracts (see forthcoming 09-api-architecture.md), infrastructure/network topology (see forthcoming infrastructure architecture doc).

## 1.4 Audience

- Founders and technical co-founders validating that the data architecture supports the business model.
- Backend engineers who will translate this document into Drizzle ORM schema and Supabase Postgres migrations.
- Security and compliance reviewers.
- Future engineers onboarding onto the codebase who need the "why," not just the "what."

## 1.5 Relationship with Previous Documents

| Document | What this document inherits from it |
|---|---|
| 00-project-vision.md | The creator-first, trust-by-design, premium-quality philosophy that shapes verification, moderation, and audit modeling. |
| 01-product-requirements.md | The full functional module list and business rules (Section 7 of that document) that become constraints in this document. |
| 02-user-personas.md | The user roles (Guest, Buyer, Creator, Creator Team Member, Admin, Moderator, Support Executive, Super Admin) that shape the Identity and Authorization domains. |
| 03-user-journeys.md | The step-by-step flows (browse → customize → cart → checkout → order → post-purchase) that define entity lifecycle states and required timestamps. |
| 04-information-architecture.md | The taxonomy, navigation, and URL structure that shape the Catalog and Search domains. |
| 05-design-principles.md / 06-design-system.md | Indirectly: performance and perceived-speed expectations that shape caching and indexing philosophy. |
| 07-ui-screens-wireframes.md | The screen-level data requirements (e.g., what a Product Detail page needs) that validate entity attribute completeness. |

## 1.6 Database Philosophy

Dreams by Kalakaaar v2 treats the database as **the source of truth for trust**, not merely a data store. Because the platform's core differentiator is trust — verified makers, authentic handmade goods, transparent order status, fair dispute resolution — the schema is designed around three philosophies:

1. **Provenance over convenience.** Every mutable business fact (price, status, verification) keeps enough history to answer "what did the buyer see, and when?" without bolting on audit logging after the fact.
2. **Creator-first ownership.** Nearly every entity in the marketplace either belongs to a `Store` or references one, because the platform's value proposition is built on individual maker identity, not anonymous inventory.
3. **Boring core, extensible edges.** The transactional core (orders, payments, inventory) uses conservative, well-understood normalized relational patterns. Experimental or fast-moving surface area (AI features, analytics, search ranking signals) is deliberately isolated into its own domains so it can evolve independently without risking the integrity of money-movement and order-fulfillment data.

## 1.7 Guiding Principles

1. **Normalize by default, denormalize by measurement.** Every entity starts fully normalized (3NF). Denormalization is introduced only where a specific, named read pattern (e.g., product card rendering, order timeline rendering) is shown to require it, and each such decision is documented inline with its justification (Section 2.2).
2. **Every entity has one owner domain.** No entity is shared ambiguously between two domains; cross-domain access happens via foreign keys and read models, not duplicated tables.
3. **Soft delete is the default; hard delete is the exception.** Data that ever touched money, identity, or a transaction is never hard-deleted, only state-transitioned (Section 2.9).
4. **Every table that matters to trust or money is audit-friendly by construction.** Status changes are modeled as append-only history tables, not just "updated_at" overwrites (Section 2.11).
5. **IDs are opaque, globally unique, and sortable.** All primary keys use UUID (or ULID-style time-sortable identifiers) — never sequential integers — so IDs are safe to expose in URLs, safe across future horizontal sharding, and safe against enumeration attacks.
6. **Multi-tenancy is logical, not physical, at this stage.** Every creator's data lives in the same shared tables (isolated by `store_id` / `creator_id` and Postgres Row-Level Security), avoiding the operational overhead of database-per-tenant while preserving a future path to physical isolation for enterprise/marketplace-federation use cases (Section 30).
7. **Internationalization is a first-class citizen, not an afterthought.** Even though multi-currency/localization is out of scope for V2 (per 00-project-vision.md, Section 24), every entity that could vary by locale (product content, currency, tax) is modeled so a locale/currency dimension can be added without restructuring primary keys.
8. **The schema assumes it will be read far more than it is written.** Marketplace browsing traffic vastly outweighs checkout traffic; the schema and indexing strategy optimize for cheap, fast reads on the hot path (Section 2.5) while keeping writes correct and safe.

---

# 2. Database Strategy

## 2.1 Why PostgreSQL

PostgreSQL (via Supabase) is the single system of record for Dreams by Kalakaaar v2.

**Reasons:**
- **Relational integrity where it matters most.** Marketplace commerce is fundamentally relational: an Order references a Buyer, a Store, Payment, and Shipment records that must never drift out of sync. Postgres's foreign keys, transactions, and constraint system make "impossible states impossible" at the data layer rather than relying entirely on application code.
- **Rich type system.** Native support for `JSONB` (semi-structured product customization data, evolving metadata), arrays, full-text search (`tsvector`), range types (availability calendars), and enumerations covers nearly every domain need without introducing a second database.
- **Row-Level Security (RLS).** Supabase's RLS model lets multi-tenant isolation (a creator only ever seeing their own store's orders) be enforced at the database layer, not only in application code — a critical defense-in-depth layer for a marketplace handling other people's money and personal data.
- **Proven horizontal scaling path.** Postgres extensions (Citus-style sharding, logical replication, `pg_partman` for partitioning) and managed read-replica support give a credible path from "single primary" to "sharded, replicated, and partitioned" without a database migration to a different engine.
- **Ecosystem fit.** Drizzle ORM, Supabase Auth/Storage/Realtime, and Vercel's serverless Postgres connection pooling (via Supabase's pooler / PgBouncer) are all designed around Postgres, minimizing integration risk.
- **Extensions for future needs.** `pgvector` gives a credible in-database path to AI-powered semantic search and recommendations (Section 30) without introducing a separate vector database in early phases.

**Alternatives considered:**

| Alternative | Why not chosen as primary store |
|---|---|
| MySQL / PlanetScale | Weaker native JSON/full-text/range-type support; PlanetScale's branching model is compelling but the Supabase-native ecosystem (Auth, Storage, Realtime, RLS) aligns better with the chosen stack. |
| MongoDB / other document stores | Marketplace commerce is inherently relational (orders ↔ payments ↔ inventory ↔ shipments); document stores push referential integrity into the application layer, which is a poor trade for a money-handling system. |
| DynamoDB / other key-value stores | Excellent at massive scale for single-access-pattern workloads, but marketplace query patterns are varied and ad hoc (admin tooling, analytics, support), which key-value stores handle poorly without extensive secondary indexing infrastructure. |
| Multiple specialized databases from day one (Postgres + Elasticsearch + Redis + a vector DB) | Justified *eventually* (Section 2.10, Section 24, Section 30) but not on day one — added operational complexity is not worth it before there is traffic to justify it. |

**Trade-offs accepted:** a single Postgres primary is a scaling ceiling and a single point of write contention until read replicas, partitioning, and (eventually) sharding are introduced. This is accepted deliberately: correctness and simplicity in year one is worth more than pre-optimizing for a scale the platform has not yet reached (see Section 2.6 and Section 30 for the growth path).

## 2.2 Normalization Strategy

The schema targets **Third Normal Form (3NF)** as the default for all transactional (OLTP) entities: Identity, Authorization, Marketplace, Product, Inventory, Catalog, Customer, Cart & Checkout, Order, Payment, Messaging, Reviews, Support, Moderation.

Rationale: 3NF eliminates update anomalies that are unacceptable in commerce (e.g., a store's display name being stored redundantly on every product row and drifting out of sync). Every non-key attribute depends on the whole primary key and nothing but the key.

## 2.3 Denormalization Strategy

Denormalization is applied surgically, only where a named, high-frequency read pattern justifies it, and always alongside the normalized source of truth (never replacing it):

| Denormalized field | Where it lives | Why | Source of truth |
|---|---|---|---|
| Store display name & avatar snapshot | `OrderItem`, `Review` | Order history and reviews must display correctly even if a creator later renames their store or the relationship ends; historical accuracy outranks live-join freshness. | `Store` |
| Product title/price/thumbnail snapshot | `OrderItem`, `CartItem` | A buyer's cart/order must reflect the price and title *at the time of action*, immune to later product edits. | `Product` / `ProductVariant` |
| Aggregate counters (`review_count`, `average_rating`, `wishlist_count`, `units_sold`) | `Product`, `Store` | Rendering product cards and storefronts at list-page volume must avoid a `COUNT()`/`AVG()` aggregation per row on every page view. | `Review`, `WishlistItem`, `OrderItem` (recomputed via background job / trigger, see Section 28) |
| Current inventory quantity | `ProductVariant.available_quantity` | Checkout and PDP rendering need O(1) stock reads; full transactional history lives in `InventoryTransaction`. | `InventoryTransaction` (append-only ledger) |
| Search-optimized document | `SearchIndex` (Section 24) | Full-text/semantic search cannot be performed efficiently by joining ten normalized tables at query time. | All contributing entities (Product, Store, Category, Tag) |

Every denormalized field above is explicitly documented as **derived data**: it is rebuildable at any time from its source of truth, and its staleness tolerance is defined per field (e.g., aggregate counters may lag by seconds via async recomputation; price/title snapshots must never change once written).

## 2.4 OLTP vs. Analytics

The transactional schema (Sections 5–19) is optimized for OLTP: short, indexed, highly concurrent reads and writes tied to a single buyer/creator session. Analytics (Section 21) is treated as a **separate logical domain** that reads from OLTP tables asynchronously (via scheduled aggregation jobs and, at scale, Change Data Capture into a warehouse) rather than running heavy aggregate queries directly against production OLTP tables. This isolation protects checkout and browsing latency from being degraded by dashboard or reporting queries.

## 2.5 Read-Heavy Optimization

Marketplace browsing (homepage, category, search, product detail, storefront) is the dominant traffic pattern and is read-heavy by orders of magnitude compared to writes (a product is viewed thousands of times for every one purchase). Strategy:
- Aggressive indexing on filter/sort columns used by browsing (Section 27).
- Read replicas for all browsing-path queries once traffic justifies it (Section 2.6, Section 28).
- Application-layer and CDN caching (via Next.js/Vercel) in front of the database for anonymous, non-personalized reads (Section 2.10).
- Denormalized aggregate counters (Section 2.3) to avoid expensive joins on the hot path.

## 2.6 Write-Heavy Optimization

Writes are concentrated in a few well-known hot paths: order placement, inventory decrement, payment webhooks, messaging, and notification delivery. Strategy:
- Keep write transactions short and narrowly scoped (e.g., order placement writes to `Order`, `OrderItem`, `InventoryTransaction`, `PaymentIntent` in one transaction; it does not also update analytics or recompute unrelated aggregates synchronously).
- Move non-critical-path writes (analytics events, notification fan-out, search index updates) to background jobs / a queue rather than the synchronous request path (Section 28).
- Use row-level locking scoped as narrowly as possible (e.g., lock a single `ProductVariant` inventory row, never a whole `Product` or `Store`) to minimize contention during flash-sale-style demand spikes.

## 2.7 Horizontal Scaling Philosophy

V2 launches on a single logical Postgres primary (with read replicas). The schema is designed so horizontal scaling can be introduced later without a redesign:
- All primary keys are UUIDs, not auto-increment integers, so rows can later be redistributed across shards without key collisions.
- High-volume, naturally partitionable domains (Order, Payment, Audit, Analytics, Notification) include a `created_at`/tenant-oriented shape from day one, making both time-based partitioning (Section 2.8) and future tenant-based sharding (Section 2.9) straightforward.
- Cross-entity references favor IDs over embedded joins, so a future shard boundary drawn along `store_id` (a natural marketplace tenant boundary) does not require redesigning relationships.

## 2.8 Partitioning Philosophy

High-volume, time-ordered tables are designed to be partitioned by range on `created_at` once volume warrants it (a Postgres/`pg_partman` concern, not introduced at day-one scale): `Order`, `OrderStatusHistory`, `Payment`, `Transaction`, `AuditLog`, `NotificationDeliveryLog`, `SearchHistory`, analytics event tables. Partitioning is a physical/implementation concern for the eventual migration layer, but the *logical* schema in this document keeps these tables append-heavy and time-ordered by design so partitioning is a non-breaking operational change later, not a schema redesign.

## 2.9 Future Sharding Strategy

If/when a single Postgres primary becomes the bottleneck, the natural shard key is `store_id` for creator/marketplace-side data and a buyer-oriented key (`user_id` or a derived tenant key) for buyer-side data, because nearly every read/write in the system is scoped to "one creator's business" or "one buyer's account." This document does not commit to a specific sharding technology (e.g., Citus vs. application-level sharding) but ensures the logical model does not preclude it: no entity's primary key depends on a cross-shard sequence, and no core transactional query requires a cross-shard join in the common case (an order's items, payment, and shipment all belong to the same order and, transitively, the same store/buyer pair).

## 2.10 Caching Philosophy

Caching is layered, from closest-to-user to closest-to-database:
1. **CDN/edge caching (Vercel)** for fully public, non-personalized pages (marketing pages, public storefronts for anonymous visitors, category pages) with short TTLs and on-demand revalidation on relevant writes.
2. **Application-level cache (TanStack Query on the client; a server-side cache such as Redis/Upstash at the edge function layer for shared, expensive reads)** for semi-personalized, frequently-read data (e.g., a buyer's own cart, a creator's own dashboard summary).
3. **Database-level materialized views (Section 28)** for expensive aggregate reads that are acceptable to be slightly stale (storefront analytics, trending searches, top-selling products).
4. The database itself is never treated as a cache; it is always the durable source of truth, and every cache above it has a defined invalidation or TTL strategy so staleness is bounded and explicit, never silent.

## 2.11 Search Strategy

See Section 24 for the full Search domain design. At a strategic level: Postgres full-text search (`tsvector`/`tsquery` with GIN indexes) is the V2 search engine, chosen because it requires no additional infrastructure and is sufficient at V2's expected scale (tens of thousands to low millions of products). The schema isolates a dedicated `SearchIndex` read-model table so that, if/when scale or ranking sophistication demands it, the platform can introduce a dedicated search engine (e.g., Postgres-adjacent `pg_search`/typesense/Elasticsearch/Algolia) as an *additional* consumer of the same source-of-truth tables, without changing how Product/Store/Category data is modeled.

## 2.12 Archiving Strategy

Entities with unbounded growth and diminishing access frequency over time (old `AuditLog` rows, old `NotificationDeliveryLog` rows, completed `Order`s older than a defined active window, old `SearchHistory`) are candidates for a **hot/cold** archiving strategy: recent data stays in the primary, fully-indexed tables; older data is moved to cheaper, less-indexed cold storage (a separate archive schema or external object storage) on a scheduled job, governed by the Data Retention Philosophy (Section 2.16). Archiving is additive and reversible — nothing is deleted purely for being old unless retention policy requires it.

## 2.13 Soft Delete Philosophy

**Default posture: soft delete.** Any entity that a user "deletes" from their perspective (a Product taken down, a Store closed, a Review removed by the author, an Address removed from an account) is state-transitioned (e.g., `status = archived` / `deleted_at` timestamp set) rather than physically removed, for three reasons: (1) referential integrity — an old Order must still be able to display the Product/Store/Address as they were; (2) trust and moderation — a takedown must be reversible and auditable, not destructive; (3) analytics — historical reporting must not silently lose data.

**Exceptions (hard delete permitted):** ephemeral, non-authoritative data with no downstream referential or legal dependency — e.g., an expired `RefreshToken`, a `CartItem` removed from an *unconverted* cart, a draft `Notification` that failed validation before send, expired `PasswordReset` tokens. Additionally, hard delete is required, not merely permitted, when fulfilling a verified legal "right to erasure" request (Section 29.4) for genuinely personal data that has no independent legal retention requirement (e.g., financial records, which are retained per Section 2.16 regardless of erasure requests, with PII minimized instead).

## 2.14 Versioning Philosophy

Entities whose content buyers rely on at a point in time — most importantly `Product` (title, description, price, images) and `StorePolicy` — are versioned via an append-only history/version table (`ProductVersion`) rather than only tracking "last updated." This lets the platform answer "what did this product look like when this order was placed?" precisely, which is both a trust requirement (dispute resolution) and, in most consumer marketplace regulatory environments, an expectation for commerce platforms.

## 2.15 Audit Philosophy

Any state transition that affects money, trust, or account standing is captured in an **append-only history table** (e.g., `OrderStatusHistory`, `ProductStatusHistory`, `PermissionAudit`) in addition to a general-purpose `AuditLog` (Section 23) that captures who did what, when, from where, and to what prior/new state, across the whole platform. History tables are domain-specific and structured (e.g., `OrderStatusHistory.from_status`/`to_status`); `AuditLog` is the platform-wide, less structured ledger used primarily for security and compliance review. Both are append-only: rows are never updated or deleted (subject to the retention policy in Section 2.16).

## 2.16 Data Retention Philosophy

Retention is defined per data category, not per table, because a single table (e.g., `User`) can contain fields with different retention obligations:

| Data category | Default retention | Rationale |
|---|---|---|
| Financial/transactional records (Payment, Transaction, Invoice, Ledger, AccountingEntry) | Minimum statutory period for the platform's operating jurisdiction (commonly 7 years for financial records) | Tax and financial regulatory compliance; cannot be shortened by a user erasure request. |
| Order/commerce history (Order, OrderItem, Shipment) | Retained indefinitely in archived form | Core to buyer/creator trust, dispute resolution, and platform history; archived (Section 2.12) rather than deleted. |
| Security/audit logs (AuditLog, LoginHistory, SecurityEvent) | 1–2 years hot, archived thereafter per security policy | Balances incident-investigation needs against unbounded storage growth. |
| Marketing/behavioral analytics (Events, ProductViews, SearchHistory) | 12–24 months, then aggregated-and-purged at the row level | Detailed event-level data has diminishing value past this window; aggregated rollups are retained longer. |
| Personal profile data not tied to a transaction (UserProfile fields, NotificationPreferences) | Retained until account deletion or erasure request | No independent legal retention requirement beyond the account's own lifecycle. |
| Session/auth artifacts (Session, RefreshToken, EmailVerification, PasswordReset tokens) | Short-lived; deleted on expiry or use | Ephemeral by design (Section 2.13). |

---

# 3. High-Level Data Domains

Twenty-six logical domains organize the schema. Each domain is a bounded set of entities with a single clear owner and business responsibility; cross-domain interaction happens only through documented relationships (Section 25).

| # | Domain | Purpose | Business Responsibility | Primary Entities | Key Dependencies | Future Growth |
|---|---|---|---|---|---|---|
| 1 | Identity | Who a person is, on this platform, across devices. | Account existence, credentials, sessions, device trust. | User, UserProfile, AuthenticationAccount, Session, RefreshToken, EmailVerification, PhoneVerification, PasswordReset, MFA, Devices, TrustedDevices | Better Auth (Section 5) | SSO/enterprise identity federation, passkeys. |
| 2 | Authorization | What an identity is allowed to do. | RBAC, resource-level permissions, feature flags. | Role, Permission, RolePermission, UserRole, ResourcePermission, FeatureFlagAccess, PermissionAudit | Identity | ABAC, fine-grained team permissions. |
| 3 | Marketplace | The creator's business identity on the platform. | Store existence, branding, policies, verification, team. | Creator, Store, StoreBranding, StorePolicy, StoreVerification, StoreAnalytics, StoreTeam, StoreInvitation, StoreSettings, StoreSocialLinks, StoreFAQ, StoreAnnouncement | Identity, Authorization | Multi-store-per-creator, franchise/brand groups. |
| 4 | Product | What is for sale. | Catalog content, variants, media, customization definitions. | Product, ProductVariant, ProductMedia, ProductCategory, ProductTag, ProductMaterial, ProductTechnique, CustomizationOption, CustomizationValue, ProductSpecification, ProductDisclosure, ProductSEO, ProductAnalytics, ProductStatusHistory, ProductVersion, ProductDraft, ProductApproval, ProductRecommendation | Marketplace, Catalog, Media | Digital products, product bundles, wholesale SKUs. |
| 5 | Inventory | How much of what is available, and when. | Stock levels, reservations, made-to-order capacity. | Inventory, InventoryTransaction, Reservation, LowStockAlert, AvailabilityCalendar, Backorder, ProductionCapacity | Product | Multi-warehouse, real-time production scheduling. |
| 6 | Catalog | How products are organized and discovered structurally. | Taxonomy, navigation, curated collections. | Category, Subcategory, Collection, Occasion, Festival, GiftGuide, Taxonomy, NavigationNode, SEOHierarchy, URLMapping | Product | AI-curated dynamic collections. |
| 7 | Customer | The buyer's account-side data beyond core identity. | Buyer profile, addresses, wishlist, saved payment refs, preferences. | BuyerProfile, Address, Wishlist, WishlistItem, SavedPaymentMethod, Coupons, GiftHistory, Preferences, NotificationPreferences, PrivacyPreferences | Identity | Loyalty accounts, gift registries. |
| 8 | Cart & Checkout | The in-progress path from intent to order. | Ephemeral cart state, checkout session, pre-order calculations. | Cart, CartItem, CouponApplication, CheckoutSession, ShippingSelection, PaymentIntent, OrderPreview, GiftMessage, TaxCalculation, DeliveryEstimate | Customer, Product, Inventory, Payment | Multi-store split checkout, saved checkout templates. |
| 9 | Order | The durable record of a completed or in-progress transaction. | Order lifecycle, fulfillment, returns/exchanges. | Order, SubOrder, OrderItem, OrderTimeline, OrderStatusHistory, Invoice, Shipment, ShipmentTracking, ReturnRequest, RefundRequest, OrderCommunication, Cancellation, Exchange | Cart & Checkout, Payment, Marketplace | B2B purchase orders, subscriptions. |
| 10 | Payment | Money movement and accounting. | Payment capture, settlement, creator payout, commission, disputes. | Payment, PaymentMethod, Transaction, Settlement, Payout, Commission, Refund, Dispute, Ledger, AccountingEntry | Order, Marketplace | Multi-currency ledgers, instant payouts. |
| 11 | Messaging | Buyer↔creator (and support) communication. | Conversations, attachments, read state. | Conversation, Participant, Message, Attachment, ReadReceipt, Notification, ModerationFlag | Identity, Order | Real-time typing indicators, AI-suggested replies. |
| 12 | Reviews | Trust signal from completed transactions. | Ratings, review content, creator replies, moderation. | Review, Rating, MediaReview, CreatorReply, ReviewVote, ReviewReport, ReviewModeration | Order, Product | Verified-photo review incentives, review AI summarization. |
| 13 | Notification | Cross-channel user communication delivery. | Templates, queues, delivery logs, preferences. | Notification, NotificationTemplate, EmailQueue, SMSQueue, PushQueue, InAppNotification, NotificationPreference, DeliveryLog | Identity, Order, Messaging | Multi-language templates, send-time optimization. |
| 14 | Support | Human-assisted issue resolution. | Tickets, escalation, refund workflows, knowledge base. | Ticket, TicketMessage, TicketAttachment, Escalation, RefundWorkflow, SupportAgent, KnowledgeBase, Macros | Order, Identity, Authorization | AI-assisted ticket triage, chatbots. |
| 15 | Moderation | Platform trust and safety enforcement. | Case management, evidence, decisions, appeals, sanctions. | ModerationCase, Evidence, Decision, Appeal, Violation, Warning, Ban, Suspension, AuditTrail | Product, Store, Review, Identity | AI content moderation pre-screening. |
| 16 | CMS | Editorial and static content. | Marketing pages, banners, articles, legal docs. | Page, Section, Banner, Announcement, Article, FAQ, LegalDocument, SEOContent, MediaLibrary | Media | Multi-locale CMS, personalized content blocks. |
| 17 | Analytics | Aggregate business intelligence. | Metrics, events, dashboards, experiments. | Metrics, Events, ProductViews, SearchAnalytics, SalesAnalytics, CreatorAnalytics, PlatformAnalytics, Experiment, FeatureUsage, DashboardSnapshots | All domains (read-only) | Data warehouse, real-time BI. |
| 18 | Media | Binary asset management. | Image/video storage references, transformations. | Media, Image, Video, Thumbnail, Transformation, StorageLocation, AltText, Metadata, Version | Product, CMS, Store | AI image enhancement, video transcoding pipelines. |
| 19 | Audit | Platform-wide accountability trail. | Who did what, when, and to what. | AuditLog, Activity, ChangeHistory, VersionHistory, SecurityEvent, LoginHistory, APIUsage, SystemEvent | All domains (read-only) | SIEM integration, anomaly detection. |
| 20 | Search | Discoverability infrastructure. | Search indexing, history, ranking signals. | SearchIndex, SearchHistory, TrendingSearch, Autocomplete, Synonyms, Filters, Recommendations, AI Search Preparation | Product, Catalog, Store | Vector/semantic search, personalized ranking. |
| 21 | Support (see 14) | — | — | — | — | — |
| 22 | System | Cross-cutting platform configuration. | Feature flags, global settings, health/config state. | (see Section 3.1 note below) | All domains | Multi-environment config management. |
| 23 | Future | Reserved namespace for forward-looking domains. | Placeholder ownership for AI, wholesale, subscriptions. | (see Section 30) | All domains | AI, B2B, subscriptions, federation. |

> **Note on numbering:** the table above enumerates the 26 domains named in the brief; "Support" (14) and "21" in the original outline refer to the same domain and are not duplicated as separate entity sets. "Settings" and "System" are treated as one domain (System) that owns platform-level configuration (feature flags, global settings, environment-level toggles) distinct from `StoreSettings` (Marketplace domain, per-store) and `Preferences` (Customer domain, per-buyer). This avoids an ambiguous "Settings" entity that could otherwise be owned by three different domains at once — a direct application of Guiding Principle 2 (Section 1.7).

---

# 4. Entity Relationship Overview

## 4.1 Core Entities

At the center of the schema are five entities that nearly everything else relates to, directly or transitively:

- **User** — the single identity record for every human on the platform (buyer, creator, admin, moderator, support agent all reference `User`; role is layered on top via Authorization, not a separate identity per role).
- **Store** — a creator's marketplace presence; the anchor for Product, Inventory, Order (seller side), and Payout.
- **Product** — the sellable unit; the anchor for Media, Inventory, Reviews, Cart/Order line items.
- **Order** — the durable transaction record; the anchor for Payment, Shipment, Messaging context, Reviews eligibility, Support tickets.
- **Payment** — the money-movement record; the anchor for Settlement, Payout, Refund, Dispute.

## 4.2 Relationship Types Used

| Type | Meaning | Representative example |
|---|---|---|
| One-to-One | Each parent row has at most one corresponding child row, and vice versa. | `User` ↔ `UserProfile`; `Store` ↔ `StoreBranding` |
| One-to-Many | A parent row has many child rows, each child belongs to exactly one parent. | `Store` → `Product`; `Order` → `OrderItem` |
| Many-to-Many | Rows on both sides can relate to many rows on the other side, via a join entity. | `Product` ↔ `Category` via `ProductCategory`; `Role` ↔ `Permission` via `RolePermission` |
| Aggregation | A "has-a" relationship where the child can conceptually exist/be reassigned independently of this specific parent. | `StoreTeam` member (a `User`) aggregated into a `Store` — the user still exists if removed from the store. |
| Composition | A "part-of" relationship where the child has no independent meaning without the parent and is deleted/archived with it. | `OrderItem` has no meaning without its `Order`; `ProductVariant` has no meaning without its `Product`. |

## 4.3 Ownership

Every entity has exactly one **owning domain** (Section 3) and, in nearly all cases, one **owning parent entity** whose lifecycle it follows for cascade purposes (Section 4.5). Entities without a natural single parent (e.g., `AuditLog`, which references many other entities polymorphically) are explicitly called out as domain-owned-but-parentless in their domain section.

## 4.4 Lifecycle Philosophy

Every entity with business meaning (not pure join tables) carries an explicit lifecycle state, expressed as a status enumeration (e.g., `Product.status`: draft → pending_approval → active → paused → archived) plus, where the state itself is a trust-relevant fact, a companion append-only history table (Section 2.15). Pure join/link tables (e.g., `RolePermission`, `ProductCategory`) do not carry lifecycle state of their own; their existence *is* the fact being modeled, and their removal (a row delete) is the state change.

## 4.5 Cascade Philosophy

Cascade behavior is deliberately conservative and is one of three explicit patterns, chosen per relationship (documented per-entity in Sections 5–24, and summarized platform-wide in the Relationships Matrix, Section 25):

1. **Cascade (hard delete children with parent)** — reserved for pure composition of ephemeral, non-authoritative data (e.g., deleting an unconverted `Cart` cascades to its `CartItem`s).
2. **Restrict (block parent deletion while children exist)** — the default for anything with financial or trust meaning (e.g., a `Store` with any `Order` history can never be hard-deleted, only suspended/archived).
3. **Soft-cascade (parent state change propagates a state change, not a delete, to children)** — the dominant pattern for commerce data (e.g., archiving a `Product` transitions its `ProductVariant`s to archived too, but an existing `OrderItem` referencing that product is untouched, because `OrderItem` stores its own denormalized snapshot per Section 2.3).


---

# 5. Identity Domain

The Identity domain answers exactly one question — "who is this, technically?" — and deliberately holds no business-role information (that is Authorization's job, Section 6) and no marketplace-facing profile content (that is `BuyerProfile`/`Store`, Sections 7 and 11). This separation means a single `User` row can be a buyer, a creator, and (rarely) a support agent without three separate identity records, avoiding one of the most common marketplace-schema mistakes: identity fragmentation across roles.

Better Auth is the authentication system of record; the Identity domain's tables are the durable, queryable Postgres representation that Better Auth's session/credential model maps onto, so the rest of the platform never needs to reach into an opaque auth provider to answer "who is this user."

### 5.1 User

- **Purpose:** The single canonical identity row for every human interacting with the platform, regardless of role.
- **Attributes (by category):** stable unique identifier; primary email (unique, verified flag); primary phone (optional, verified flag); account status (active, suspended, banned, deactivated, pending_deletion); timestamps (created, last_login); locale/timezone preference; soft-delete marker.
- **Relationships:** one-to-one with `UserProfile`; one-to-many with `AuthenticationAccount`, `Session`, `RefreshToken`, `Devices`; one-to-one (optional) with `Creator` (Section 7) and `BuyerProfile` (Section 11); many-to-many with `Role` via `UserRole` (Section 6).
- **Lifecycle:** created on signup → active → (optional) suspended/banned by Moderation (Section 15) → (optional) pending_deletion on erasure request (Section 29.4) → soft-deleted, never hard-deleted while any Order/Payment references it (Restrict cascade, Section 4.5).
- **Indexes (intent):** unique on email; unique on phone (where present); index on status for admin filtering; index on created_at for cohort/analytics queries.
- **Constraints:** email uniqueness enforced at the database level (not only application level), since it is also the RLS anchor for nearly every downstream policy.
- **Audit requirements:** every status transition (active→suspended, suspended→banned, etc.) is written to `AuditLog` (Section 23) with actor, reason, and timestamp.

### 5.2 UserProfile

- **Purpose:** Human-facing profile attributes shared across all roles (display name, avatar, bio) that are not authentication-relevant and change more often than core identity.
- **Attributes:** display name; avatar media reference (Section 22); short bio; preferred pronouns (optional); public-profile visibility flag.
- **Relationships:** one-to-one with `User`.
- **Lifecycle:** created alongside `User`; editable at will; no independent deletion (Composition — Cascade with `User`, since profile content has no meaning without the identity it describes).
- **Indexes:** none beyond the `User` foreign key; not a query-driver table on its own.
- **Constraints:** display name length/content policy enforced at application layer; no uniqueness required (display names may collide).

### 5.3 AuthenticationAccount

- **Purpose:** Represents one method of authenticating as a given `User` — a password credential, or a linked OAuth/social provider account (per Better Auth's multi-provider model). A single `User` may have several (e.g., password + Google).
- **Attributes:** provider type (email/password, Google, Apple, etc.); provider-specific external account identifier; credential metadata (never the raw secret — Better Auth owns secret storage); linked timestamp; last-used timestamp.
- **Relationships:** many-to-one with `User`.
- **Lifecycle:** created when a login method is added; removable independently (a user can unlink Google while keeping password login), subject to "at least one active method" business rule enforced at application layer.
- **Indexes:** composite unique on (provider type, provider external id) to prevent the same external account linking to two `User`s; index on `user_id`.
- **Constraints:** a `User` must retain at least one `AuthenticationAccount` at all times (enforced at application layer, not a database constraint, since it is a cross-row business rule).

### 5.4 Session

- **Purpose:** An active, authenticated browser/app session for a `User`.
- **Attributes:** session token reference (opaque; the actual signed token is managed by Better Auth); device/user-agent fingerprint reference; IP address (for security review, retained per Section 2.16); created/expires timestamps; revoked flag.
- **Relationships:** many-to-one with `User`; many-to-one (optional) with `Devices`.
- **Lifecycle:** created on login → active until expiry or explicit logout/revocation → hard-deleted after expiry (ephemeral exception, Section 2.13), except where retained briefly for security-review purposes via `LoginHistory` (Section 23), which is the durable record — `Session` itself is not the audit trail.
- **Indexes:** index on `user_id` (list active sessions); index on expires_at (cleanup jobs).
- **Constraints:** none beyond foreign key; expiry enforced at application/Better Auth layer.

### 5.5 RefreshToken

- **Purpose:** Long-lived token used to mint new short-lived access sessions without re-authentication.
- **Attributes:** token reference (opaque, hashed at rest); associated `Session`/`User`; issued/expires timestamps; rotation lineage marker (to detect refresh-token reuse, a standard security control).
- **Relationships:** many-to-one with `User`.
- **Lifecycle:** created on login → rotated on use → revoked on logout, password change, or suspected compromise → hard-deleted on expiry (ephemeral exception, Section 2.13).
- **Indexes:** index on `user_id`; index on expires_at.
- **Constraints:** stored hashed, never in plaintext, regardless of encryption-at-rest (defense in depth, Section 29.1).

### 5.6 EmailVerification / 5.7 PhoneVerification

- **Purpose:** Time-boxed proof-of-ownership tokens for an email address or phone number, required before that contact method is trusted for account recovery or notifications.
- **Attributes:** target contact value; verification code/token (hashed); expiry; consumed flag/timestamp; attempt counter (rate-limit/brute-force defense).
- **Relationships:** many-to-one with `User`.
- **Lifecycle:** created on signup or contact-change request → consumed on successful verification (hard-deleted or marked consumed and later purged; ephemeral exception) → expired tokens purged by scheduled job.
- **Indexes:** index on `user_id`; index on expires_at for cleanup.
- **Constraints:** attempt counter enforces a maximum retry count before requiring a new token to be issued.

### 5.8 PasswordReset

- **Purpose:** Time-boxed token authorizing a password change without the current password.
- **Attributes:** token (hashed); expiry; consumed flag; requesting IP (security context).
- **Relationships:** many-to-one with `User`.
- **Lifecycle:** created on "forgot password" request → single-use, consumed on success → expired tokens purged (ephemeral exception).
- **Indexes:** index on `user_id`; index on expires_at.
- **Constraints:** issuing a new reset token invalidates any prior unconsumed token for the same user (prevents multiple valid resets existing simultaneously).

### 5.9 MFA

- **Purpose:** Multi-factor authentication enrollment and challenge state for a `User` (TOTP authenticator, and future factors).
- **Attributes:** factor type; encrypted secret/credential reference; enrollment status; backup codes (hashed, one-time-use, stored as a set); last-used timestamp.
- **Relationships:** many-to-one with `User`.
- **Lifecycle:** enrolled → active → optionally disabled/removed by the user (with re-authentication required) → removed on account deletion.
- **Indexes:** index on `user_id`.
- **Constraints:** secrets encrypted at rest (Section 29.1); backup codes single-use, tracked as consumed.

### 5.10 Devices / 5.11 TrustedDevices

- **Purpose:** `Devices` records every device/browser combination seen for a `User` (for session and security visibility); `TrustedDevices` is the subset explicitly marked to skip repeat MFA challenges for a bounded period.
- **Attributes (Devices):** device fingerprint hash; device name/type (best-effort, user-agent-derived); first-seen/last-seen timestamps.
- **Attributes (TrustedDevices):** references a `Devices` row; trust-expiry timestamp; revocation flag.
- **Relationships:** many-to-one with `User`; `TrustedDevices` many-to-one with `Devices`.
- **Lifecycle:** `Devices` rows accumulate over time and are pruned per retention policy (Section 2.16, analytics-adjacent category); `TrustedDevices` entries expire automatically and can be revoked instantly (e.g., "log out all devices" action).
- **Indexes:** index on `user_id`; index on fingerprint hash.
- **Constraints:** trust cannot be granted without a prior completed MFA challenge on that device (application-layer rule).

---

# 6. Authorization Domain

The Authorization domain is intentionally separate from Identity so that "who am I" and "what can I do" evolve independently — a `User` can gain/lose the Creator role, be promoted to Admin, or have a specific permission revoked for cause, without ever touching their core identity record. This mirrors 01-product-requirements.md's Section 3 role model (Guest, Buyer, Creator, Creator Team Member, Admin, Moderator, Support Executive, Super Admin).

### 6.1 Role

- **Purpose:** A named bundle of permissions representing a platform-level function (Buyer, Creator, Creator Team Member, Admin, Moderator, Support Executive, Super Admin), plus store-scoped roles for team management (Owner, Manager, Editor within `StoreTeam`, Section 7).
- **Attributes:** role name; scope (platform-level vs. store-level); description; system-reserved flag (platform roles cannot be deleted by admins, only configured).
- **Relationships:** many-to-many with `Permission` via `RolePermission`; many-to-many with `User` via `UserRole`.
- **Lifecycle:** platform roles are seeded and effectively permanent; store-scoped roles (if a store defines custom team roles beyond the defaults, future extension) can be created/retired per store.
- **Indexes:** unique on (name, scope).
- **Constraints:** system-reserved roles cannot be deleted (Restrict), only have their permission set adjusted by Super Admin.

### 6.2 Permission

- **Purpose:** An atomic capability (e.g., `product:create`, `order:refund`, `store:verify`) that can be granted to a Role.
- **Attributes:** permission key (namespaced string, e.g., domain:action); human-readable description; category (grouping for admin UI).
- **Relationships:** many-to-many with `Role` via `RolePermission`.
- **Lifecycle:** additive over time as features ship; never silently repurposed (a retired permission is deprecated, not deleted, to keep `PermissionAudit` history meaningful).
- **Indexes:** unique on permission key.
- **Constraints:** none beyond uniqueness.

### 6.3 RolePermission

- **Purpose:** Join entity granting a `Permission` to a `Role`.
- **Attributes:** none beyond the two foreign keys and a granted-at timestamp.
- **Relationships:** many-to-one with `Role`; many-to-one with `Permission`.
- **Lifecycle:** pure link table; row existence is the fact (Section 4.4); removal is the revocation event, logged to `PermissionAudit`.
- **Indexes:** composite unique on (role_id, permission_id).

### 6.4 UserRole

- **Purpose:** Join entity assigning a `Role` to a `User`, optionally scoped to a specific `Store` (for `StoreTeam` roles) so the same `User` can hold "Manager" on one store and "Editor" on another.
- **Attributes:** optional store scope (null for platform-level roles); granted-at timestamp; granted-by reference.
- **Relationships:** many-to-one with `User`; many-to-one with `Role`; many-to-one (optional) with `Store`.
- **Lifecycle:** created on role assignment (signup as buyer, creator onboarding approval, admin promotion, team invitation acceptance) → removed on role revocation, logged to `PermissionAudit`.
- **Indexes:** composite index on (user_id, store_id); index on role_id for "who has this role" admin queries.
- **Constraints:** composite unique on (user_id, role_id, store_id) to prevent duplicate assignment.

### 6.5 ResourcePermission

- **Purpose:** Fine-grained, per-resource permission overrides beyond what a Role grants — e.g., a specific Creator Team Member given access to exactly one product line, or a Support Executive granted temporary elevated access to one specific ticket/order for an escalation.
- **Attributes:** resource type; resource id; permission key; expiry (optional, for temporary grants).
- **Relationships:** many-to-one with `User`; polymorphic reference to the target resource (documented, not a database-enforced polymorphic foreign key — see Section 26 constraint note).
- **Lifecycle:** created for exceptional/temporary access; expires automatically or is revoked manually; always logged to `PermissionAudit`.
- **Indexes:** composite index on (user_id, resource_type, resource_id).

### 6.6 FeatureFlagAccess

- **Purpose:** Controls early/limited access to in-development features per user or per store (beta cohorts), independent of the System domain's global feature-flag definitions.
- **Attributes:** feature flag key; target (`User` or `Store`); enabled flag; enrolled-at timestamp.
- **Relationships:** many-to-one (optional) with `User`; many-to-one (optional) with `Store`.
- **Lifecycle:** created when a cohort is enrolled; removed when a feature graduates to general availability or the flag is retired.
- **Indexes:** composite index on (feature_key, user_id) and (feature_key, store_id).

### 6.7 PermissionAudit

- **Purpose:** Append-only history of every grant/revocation across `RolePermission`, `UserRole`, and `ResourcePermission`.
- **Attributes:** action type (grant/revoke); actor; target user/role/permission/resource references; timestamp; reason (optional, required for revocations tied to moderation).
- **Relationships:** references `User` (actor and, where applicable, target), `Role`, `Permission`.
- **Lifecycle:** append-only, never updated or deleted (subject to Section 2.16 audit retention).
- **Indexes:** index on target user; index on timestamp (descending, for recent-activity views).

## 6.8 RBAC Philosophy

Dreams by Kalakaaar v2 uses **Role-Based Access Control as the default and primary model** because the platform's permission needs are well-bounded and enumerable (a fixed set of platform roles, plus a small, fixed set of store-team roles). RBAC is simpler to reason about, audit, and implement correctly with Postgres RLS policies than a fully dynamic attribute-based model, and it maps directly onto 01-product-requirements.md's Section 3 role definitions.

## 6.9 Future ABAC Support

`ResourcePermission` (Section 6.5) is the deliberate seam for future **Attribute-Based Access Control**: as the platform grows (larger creative studios with complex internal permission needs, enterprise/B2B buyers with procurement-approval workflows, Section 30), fine-grained, conditional, and attribute-driven rules can be layered on top of the RBAC core without replacing it — RBAC continues to answer "what can this role generally do," while ABAC-style `ResourcePermission` rows answer "what can this specific user do with this specific resource, right now."


---

# 7. Marketplace Domain

The Marketplace domain models the creator's business identity — the single most important domain for the platform's differentiation, since Dreams by Kalakaaar competes on trust in the maker, not just the product (00-project-vision.md, Section 6).

### 7.1 Creator

- **Purpose:** Marks a `User` as an approved seller and holds seller-specific identity data not relevant to buyers (tax/legal business info, payout eligibility status).
- **Attributes:** legal name/business name; tax identifier reference (encrypted, Section 29.1); creator category (Independent Artisan, Custom/Personalization Specialist, Small Creative Studio, Emerging/Aspiring — per 02-user-personas.md); onboarding status; approval timestamp.
- **Relationships:** one-to-one with `User`; one-to-many with `Store` (modeled as one-to-many now, even though V2 launch may constrain to one store per creator, to avoid a future breaking migration — see Section 30).
- **Lifecycle:** created on creator application → pending_review → approved (creates default `Store`) or rejected → active → suspended (Moderation, Section 15) → closed.
- **Indexes:** unique on `user_id`; index on onboarding status (admin review queue).
- **Constraints:** cannot transition to `active` without a completed `StoreVerification` (Section 7.5).
- **Audit:** every status transition logged to `AuditLog` and mirrored in a creator-specific status history for support visibility.

### 7.2 Store

- **Purpose:** The buyer-facing storefront entity — the anchor nearly every marketplace-side entity (Product, Order fulfillment side, Payout) attaches to.
- **Attributes:** store name (unique, URL-safe slug); tagline/short description; status (draft, active, paused, suspended, closed); category/craft focus; launch date; storefront URL slug.
- **Relationships:** many-to-one with `Creator`; one-to-one with `StoreBranding`, `StorePolicy`, `StoreSettings`, `StoreAnalytics`; one-to-many with `StoreTeam`, `StoreInvitation`, `StoreSocialLinks`, `StoreFAQ`, `StoreAnnouncement`, `Product`; one-to-many with `Order` (as seller side, via `SubOrder`, Section 13).
- **Lifecycle:** created on creator approval → draft while creator builds catalog → active on publish → paused (creator-initiated, e.g., vacation mode) → suspended (Moderation-initiated) → closed (creator- or platform-initiated, terminal; Restrict hard-delete while any Order references it — Section 4.5).
- **Indexes:** unique on slug; index on status (for public listing queries, excluding non-active); index on creator_id.
- **Constraints:** slug immutable once the store has any published Product or completed Order (to preserve inbound links and buyer trust).

### 7.3 StoreBranding

- **Purpose:** Visual/identity presentation layer — logo, banner, brand color, story/about content.
- **Attributes:** logo media reference; banner media reference; brand accent color; "about/story" rich text content; featured media gallery references.
- **Relationships:** one-to-one with `Store`.
- **Lifecycle:** Composition with `Store` (Cascade — has no independent meaning).
- **Indexes:** none beyond foreign key.

### 7.4 StorePolicy

- **Purpose:** Buyer-facing policy content specific to a store — shipping timelines, returns/exchanges policy, custom-order terms — versioned so a buyer's order can reference the exact policy text they agreed to at purchase time.
- **Attributes:** policy type (shipping, returns, custom-order terms); rich text content; effective-from timestamp; version number.
- **Relationships:** one-to-many from `Store` (versioned history, not one-to-one, per Section 2.14 versioning philosophy).
- **Lifecycle:** new version created on edit; prior versions retained indefinitely (append-only) for dispute resolution.
- **Indexes:** composite index on (store_id, policy_type, effective_from descending) to fetch "policy in effect at time X."

### 7.5 StoreVerification

- **Purpose:** Tracks the platform's authenticity/quality verification process for a creator's store (00-project-vision.md's "Verified Maker" concept).
- **Attributes:** verification status (pending, in_review, verified, rejected, revoked); verification method/evidence references; reviewer (internal Admin/Moderator `User`); decision timestamp; expiry/re-verification due date (verification is not assumed permanent).
- **Relationships:** one-to-one (current) plus historical rows with `Store`; references reviewing `User`.
- **Lifecycle:** created at creator onboarding → in_review → verified/rejected → periodic re-verification per platform policy → revoked (Moderation-triggered).
- **Indexes:** index on status (admin review queue); index on expiry date (re-verification scheduling).
- **Constraints:** a `Store` cannot transition to `active` publish state without at least one `verified` `StoreVerification` row (business rule, application-enforced).

### 7.6 StoreAnalytics

- **Purpose:** Denormalized, store-scoped performance snapshot for the Creator Dashboard (01-product-requirements.md Section 4.18/4.20), refreshed asynchronously — not a live-computed view (Section 2.10, Section 28).
- **Attributes:** period (daily/weekly/monthly rollup key); views count; conversion rate; units sold; revenue; average rating snapshot.
- **Relationships:** many-to-one with `Store`.
- **Lifecycle:** append-only time series, recomputed by scheduled job; never mutated in place once a period closes.
- **Indexes:** composite index on (store_id, period).

### 7.7 StoreTeam

- **Purpose:** Membership of a `User` on a `Store`'s internal team (Small Creative Studios persona, 02-user-personas.md), with a store-scoped role (Owner/Manager/Editor).
- **Attributes:** store-scoped role reference (`Role`/`UserRole`, Section 6.4); joined-at timestamp; status (active, removed).
- **Relationships:** many-to-one with `Store`; many-to-one with `User`.
- **Lifecycle:** created on invitation acceptance (Section 7.8) → active → removed (soft state change, not hard delete, to preserve historical "who worked on this store" audit trail).
- **Indexes:** composite unique on (store_id, user_id).

### 7.8 StoreInvitation

- **Purpose:** Pending invitation for a `User` (by email, possibly not yet registered) to join a `Store`'s team.
- **Attributes:** invited email; proposed role; status (pending, accepted, declined, expired, revoked); expiry timestamp.
- **Relationships:** many-to-one with `Store`; references inviting `User`.
- **Lifecycle:** created → accepted (creates `StoreTeam` row) / declined / expired / revoked → terminal states retained briefly for support visibility, then archived.
- **Indexes:** index on invited email; index on store_id.

### 7.9 StoreSettings

- **Purpose:** Store-scoped operational configuration — vacation mode, order auto-accept rules, notification routing preferences, custom-order lead time defaults.
- **Attributes:** vacation mode flag + return date; auto-accept-orders flag; default lead-time for made-to-order items; notification routing preferences (which team member receives which alert type).
- **Relationships:** one-to-one with `Store`.
- **Lifecycle:** Composition with `Store` (Cascade).
- **Indexes:** none beyond foreign key.

### 7.10 StoreSocialLinks

- **Purpose:** External social/portfolio links displayed on the storefront (Instagram, personal website, etc.).
- **Attributes:** platform type; URL; display order.
- **Relationships:** many-to-one with `Store`.
- **Lifecycle:** Composition with `Store` (Cascade); freely added/removed by creator.
- **Indexes:** index on store_id.

### 7.11 StoreFAQ

- **Purpose:** Store-specific frequently-asked-questions content, distinct from platform-wide FAQ (CMS domain, Section 20).
- **Attributes:** question text; answer rich text; display order; published flag.
- **Relationships:** many-to-one with `Store`.
- **Lifecycle:** Composition with `Store` (Cascade).
- **Indexes:** index on store_id.

### 7.12 StoreAnnouncement

- **Purpose:** Time-boxed banner/message a creator posts on their own storefront (e.g., "closed for the holidays Dec 20–27").
- **Attributes:** message content; start/end display window; announcement type (info, vacation, promo).
- **Relationships:** many-to-one with `Store`.
- **Lifecycle:** created → active within its display window → expired (soft, retained for history) → creator-deletable.
- **Indexes:** composite index on (store_id, start_at, end_at) for "currently active announcements" queries.


---

# 8. Product Domain

The Product domain is the largest and most detailed domain, reflecting the platform's core differentiator: rich, personalizable, story-rich listings rather than commodity SKUs (00-project-vision.md, 01-product-requirements.md Section 4.6/4.14).

### 8.1 Product

- **Purpose:** The canonical listing — the parent for variants, media, customization, and the entity buyers ultimately add to cart.
- **Attributes:** title; description (rich text); base price; product type (ready-made, made-to-order, digital [future]); status (draft, pending_approval, active, paused, archived, rejected); lead-time-to-ship (for made-to-order); creator/store reference; primary category reference; created/updated timestamps; aggregate counters (Section 2.3: average_rating, review_count, units_sold, wishlist_count).
- **Relationships:** many-to-one with `Store`; one-to-many with `ProductVariant`, `ProductMedia`, `ProductSpecification`, `ProductDisclosure`, `ProductVersion`, `ProductStatusHistory`, `ProductDraft`, `ProductApproval`; many-to-many with `Category` via `ProductCategory`, with `Tag` via `ProductTag`, with `Material` via `ProductMaterial`, with `Technique` via `ProductTechnique`; one-to-one with `ProductSEO`, `ProductAnalytics`.
- **Lifecycle:** `ProductDraft` (Section 8.16) → submitted for approval → `ProductApproval` (Section 8.17) reviewed → `active` (published, discoverable) → `paused` (creator-initiated, e.g., out of stock) → `archived` (creator- or platform-initiated, terminal for discovery but retained for historical Order references — Soft-cascade, Section 4.5) → `rejected` (moderation, returns to draft with feedback).
- **Indexes:** index on (store_id, status); composite index on (status, primary_category_id) for category-page browsing; index on created_at for "new arrivals"; full-text index (`tsvector`) on title+description feeding Search (Section 24).
- **Constraints:** cannot transition to `active` without at least one `ProductVariant` with a valid price and at least one `ProductMedia` (business rule — a listing cannot go live with no image or no purchasable variant).
- **Audit:** every status transition recorded in `ProductStatusHistory`; every content edit recorded in `ProductVersion`.

### 8.2 ProductVariant

- **Purpose:** A specific purchasable configuration of a Product (size, color, material combination) with its own price and inventory tracking.
- **Attributes:** variant attributes (structured, e.g., size/color as key-value pairs); price (may override or extend base price); SKU-equivalent internal reference code; status (active, archived).
- **Relationships:** many-to-one with `Product`; one-to-one with `Inventory` (Section 9.1); referenced by `CartItem`/`OrderItem` (as a snapshot source, Section 2.3).
- **Lifecycle:** created with Product or added later → active → archived (Soft-cascade from Product archival, or independently if a specific variant is discontinued while the product remains active).
- **Indexes:** index on product_id; unique on (product_id, variant-attribute-combination) to prevent duplicate variants.
- **Constraints:** price must be a positive value; a Product must always retain at least one active variant while `active` itself (application-enforced).

### 8.3 ProductMedia

- **Purpose:** Ordered image/video gallery for a Product (references `Media`, Section 22, rather than storing binary data itself).
- **Attributes:** display order; media type (image, video); "primary" flag (exactly one primary image per product); optional variant scoping (a media item can be tied to a specific color variant).
- **Relationships:** many-to-one with `Product`; many-to-one with `Media`; optional many-to-one with `ProductVariant`.
- **Lifecycle:** Composition with `Product` (Soft-cascade — media archived alongside product archival, retained for historical order/review display via denormalized references).
- **Indexes:** composite index on (product_id, display_order).
- **Constraints:** exactly one row per product may have `is_primary = true` (application-enforced, since a database CHECK cannot easily express "exactly one" across rows without a partial unique index — noted as a partial-unique-index candidate in Section 27).

### 8.4 ProductCategory (join) / 8.5 ProductTag (join)

- **Purpose:** Many-to-many links from `Product` to `Category` (Section 10.1) and `Tag` (a free-form, creator- or platform-defined label distinct from formal taxonomy).
- **Attributes:** none beyond foreign keys; `ProductCategory` includes a "primary category" flag (one primary, others secondary, mirroring 04-information-architecture.md's classification model).
- **Relationships:** many-to-one with `Product`; many-to-one with `Category`/`Tag`.
- **Lifecycle:** pure link tables (Section 4.4).
- **Indexes:** composite index on (category_id, product_id) to drive category-page browsing efficiently; composite unique on (product_id, category_id) / (product_id, tag_id).

### 8.6 ProductMaterial / 8.7 ProductTechnique

- **Purpose:** Structured, filterable attributes describing what a handmade product is made of and how — core to the "authenticity" and craftsmanship storytelling the platform is built around (00-project-vision.md, Section 3–5), and directly used as PDP content and search filters (04-information-architecture.md Section 11).
- **Attributes:** `Material`/`Technique` reference entities hold a name and description; the join tables (`ProductMaterial`, `ProductTechnique`) hold only foreign keys.
- **Relationships:** many-to-many between `Product` and `Material`/`Technique`.
- **Lifecycle:** pure link tables; `Material`/`Technique` reference entities are platform-curated (to keep filters meaningful) with creator-suggestion workflow (future extension) rather than fully free-text.
- **Indexes:** composite index on (material_id, product_id) / (technique_id, product_id) for filtered browsing.

### 8.8 CustomizationOption / 8.9 CustomizationValue

- **Purpose:** Defines the personalization/customization schema for made-to-order products (01-product-requirements.md Section 4.14) — e.g., an option "Engraving Text" (free text, max length) or "Frame Color" (a set of `CustomizationValue`s to choose from), decoupled from `ProductVariant` because customization is often buyer-supplied content, not a pre-defined SKU dimension.
- **Attributes (CustomizationOption):** option name; input type (free text, single-select, multi-select, file upload [future], date picker); required flag; validation rules (max length, allowed characters); display order.
- **Attributes (CustomizationValue):** for select-type options, the enumerated choices; optional price adjustment per value.
- **Relationships:** many-to-one with `Product`; `CustomizationValue` many-to-one with `CustomizationOption`; referenced by `CartItem`/`OrderItem` as the buyer's chosen values (stored as a snapshot, Section 2.3, since option definitions may change after an order is placed).
- **Lifecycle:** defined by creator at product-authoring time; editable; archived options remain referenceable by historical orders (Soft-cascade).
- **Indexes:** index on product_id.
- **Constraints:** free-text customization values are captured on the order/cart side with length limits inherited from the option's validation rules (application-enforced).

### 8.10 ProductSpecification

- **Purpose:** Structured spec sheet (dimensions, weight, care instructions) distinct from free-text description, to support consistent PDP rendering and future filterable search facets.
- **Attributes:** spec key (e.g., "Dimensions", "Weight", "Care Instructions"); spec value; display order.
- **Relationships:** many-to-one with `Product`.
- **Lifecycle:** Composition with `Product` (Cascade).
- **Indexes:** index on product_id.

### 8.11 ProductDisclosure

- **Purpose:** Mandatory authenticity/sourcing disclosures the platform requires for trust (e.g., "handmade by the creator" vs. "assembled from sourced components," country of material origin) — directly supporting the "Authenticity First" core value (00-project-vision.md Section 5) and countering the "authenticity uncertainty" problem (Section 6.2).
- **Attributes:** disclosure type; disclosure value/statement; required-for-category flag (some disclosures are mandatory only for certain product categories).
- **Relationships:** many-to-one with `Product`.
- **Lifecycle:** required at submission time for categories that mandate it (enforced by `ProductApproval`, Section 8.17); editable thereafter with re-review trigger.
- **Indexes:** index on product_id.

### 8.12 ProductSEO

- **Purpose:** SEO metadata independent of buyer-facing content — meta title/description overrides, canonical URL slug — supporting 04-information-architecture.md Section 12 (URL Architecture).
- **Attributes:** URL slug (unique per store); meta title override; meta description override; structured-data hints (future, e.g., schema.org Product markup fields).
- **Relationships:** one-to-one with `Product`.
- **Lifecycle:** Composition with `Product` (Cascade); slug immutable once product has any completed Order (mirrors Section 7.2's store-slug rule) to preserve inbound SEO links.
- **Indexes:** unique on (store_id, slug).

### 8.13 ProductAnalytics

- **Purpose:** Denormalized per-product performance snapshot (views, conversion rate, wishlist adds) feeding the Creator Dashboard, refreshed asynchronously (Section 2.10, Section 28), separate from the always-current aggregate counters on `Product` itself (Section 2.3) because analytics needs period-over-period breakdowns, not just current totals.
- **Attributes:** period key; views; add-to-cart count; purchases; conversion rate; wishlist adds.
- **Relationships:** many-to-one with `Product`.
- **Lifecycle:** append-only time series.
- **Indexes:** composite index on (product_id, period).

### 8.14 ProductStatusHistory

- **Purpose:** Append-only audit trail of every `Product.status` transition (Section 2.15).
- **Attributes:** from_status; to_status; actor (creator or moderator); reason (required for moderation-driven transitions); timestamp.
- **Relationships:** many-to-one with `Product`.
- **Lifecycle:** append-only, never updated/deleted.
- **Indexes:** index on product_id; index on timestamp.

### 8.15 ProductVersion

- **Purpose:** Append-only content snapshot (Section 2.14) capturing title/description/price/media state at each meaningful edit, so historical orders and disputes can reference "what the listing said when this was purchased."
- **Attributes:** version number; snapshotted content fields; created_at.
- **Relationships:** many-to-one with `Product`.
- **Lifecycle:** append-only; a new row is written on every publish-affecting edit (not on every keystroke — drafts are handled by `ProductDraft`).
- **Indexes:** composite index on (product_id, version_number descending).

### 8.16 ProductDraft

- **Purpose:** Working, unpublished edit state for a Product — allows a creator to edit a live listing without those changes affecting what buyers see until explicitly published (and, for existing live products, without requiring re-approval mid-edit).
- **Attributes:** draft content fields (mirrors Product's editable fields); last-saved timestamp.
- **Relationships:** one-to-one with `Product`.
- **Lifecycle:** created/updated continuously while a creator edits → on publish, promoted into a new `ProductVersion` and applied to the live `Product` row, then cleared.
- **Indexes:** unique on product_id.

### 8.17 ProductApproval

- **Purpose:** Tracks the platform's editorial/curation review of a new or edited listing before it goes (or returns to) `active` — direct support for 01-product-requirements.md Section 7.1 (Product/Listing Approval business rules) and the platform's curation-over-open-listing philosophy (00-project-vision.md).
- **Attributes:** submission timestamp; reviewer reference; decision (approved, rejected, changes_requested); feedback notes; decided_at.
- **Relationships:** many-to-one with `Product`; references reviewing `User` (Admin/Moderator).
- **Lifecycle:** created on submission → reviewed → decided; a Product may accumulate several `ProductApproval` rows over its lifetime (each edit that requires re-review creates a new one) — append-only history, not overwritten.
- **Indexes:** composite index on (product_id, submitted_at descending); index on decision (review-queue filtering).

### 8.18 ProductRecommendation

- **Purpose:** Precomputed "related/recommended products" associations, seeding both simple rule-based recommendations at V2 launch (same category/creator, frequently-bought-together) and a clean seam for future AI-driven recommendations (Section 30) without a schema change.
- **Attributes:** source product; recommended product; recommendation type (same_creator, similar_category, frequently_bought_together, ai_similarity [future]); score/rank; generated_at.
- **Relationships:** many-to-one (source) and many-to-one (recommended) with `Product`.
- **Lifecycle:** recomputed periodically by background job (Section 28); fully replaceable/rebuildable derived data (Section 2.3 philosophy extended to a whole entity, not just a field).
- **Indexes:** composite index on (source_product_id, recommendation_type, score descending).


---

# 9. Inventory Domain

Inventory is modeled as an append-only ledger (`InventoryTransaction`) with a derived current-quantity snapshot (`Inventory`), not a single mutable "quantity" field alone — because a marketplace with both stocked and made-to-order goods needs a full, auditable history of every stock movement (received, sold, returned, adjusted) to resolve disputes and prevent overselling.

### 9.1 Inventory

- **Purpose:** The current, queryable stock-state snapshot for a `ProductVariant`.
- **Attributes:** available quantity; reserved quantity (held by in-progress checkouts, Section 9.3); reorder threshold; tracking mode (tracked, untracked/made-to-order-unlimited).
- **Relationships:** one-to-one with `ProductVariant`.
- **Lifecycle:** created with the variant; continuously updated (derived from `InventoryTransaction`, Section 2.3 denormalization pattern) → for made-to-order items with unlimited tracking mode, quantity fields are not meaningful and `ProductionCapacity` (Section 9.7) governs availability instead.
- **Indexes:** unique on variant_id; index on available_quantity for low-stock queries.
- **Constraints:** available_quantity must never go negative (application-enforced via transactional decrement checks, reinforced by a database CHECK constraint as defense-in-depth).

### 9.2 InventoryTransaction

- **Purpose:** Append-only ledger of every stock movement — the source of truth `Inventory.available_quantity` is derived from.
- **Attributes:** transaction type (restock, sale, return, manual_adjustment, reservation_release); quantity delta (signed); reference to the causing entity (Order, ReturnRequest, or manual admin action); timestamp; actor.
- **Relationships:** many-to-one with `ProductVariant`.
- **Lifecycle:** append-only, never updated or deleted.
- **Indexes:** index on (variant_id, created_at) for ledger reconstruction and audit.

### 9.3 Reservation

- **Purpose:** A short-lived hold on inventory quantity while a buyer is mid-checkout, preventing oversell without permanently decrementing stock until payment succeeds.
- **Attributes:** quantity held; expiry timestamp (checkout session timeout); status (active, released, converted_to_order).
- **Relationships:** many-to-one with `ProductVariant`; many-to-one with `CheckoutSession` (Section 12.4).
- **Lifecycle:** created on checkout start → converted (on successful order placement, decrementing `Inventory` via an `InventoryTransaction`) or released (on checkout abandonment/expiry, returning quantity to available) — ephemeral by nature (Section 2.13 exception).
- **Indexes:** index on expiry timestamp (cleanup job); index on variant_id.

### 9.4 LowStockAlert

- **Purpose:** Notifies a creator when a variant's available quantity drops below its configured reorder threshold.
- **Attributes:** triggered_at; acknowledged flag; threshold value at time of trigger.
- **Relationships:** many-to-one with `ProductVariant`.
- **Lifecycle:** created by a background job watching `Inventory` thresholds → acknowledged by creator → new alert not re-created until quantity rises above threshold and drops again (debounce logic, application-layer).
- **Indexes:** index on variant_id; index on acknowledged flag.

### 9.5 AvailabilityCalendar

- **Purpose:** For made-to-order and date-bound products (e.g., custom cakes for a specific event date), tracks which future dates/date-ranges are available, supporting Postgres range types.
- **Attributes:** date range; capacity for that range; booked count.
- **Relationships:** many-to-one with `Product` (or `Store`, for creator-wide capacity across all their made-to-order products — modeled at the level each creator needs, documented per-store vs. per-product in creator onboarding).
- **Lifecycle:** created by creator (calendar setup) → consumed as orders book dates → recurring resets (e.g., weekly capacity) handled by scheduled job.
- **Indexes:** GiST index on the date range column (Postgres range-type-native indexing) for efficient overlap queries.

### 9.6 Backorder

- **Purpose:** Represents a buyer's order placed against a variant that is temporarily out of stock but restockable (as distinct from made-to-order, which is never "in stock" by design).
- **Attributes:** quantity backordered; expected fulfillment date estimate; status (pending, fulfilled, cancelled).
- **Relationships:** many-to-one with `ProductVariant`; many-to-one with `OrderItem`.
- **Lifecycle:** created at order time if backorder is enabled for the variant → fulfilled (converts to a standard `InventoryTransaction` sale once restocked) or cancelled (triggers refund workflow).
- **Indexes:** index on variant_id; index on status.

### 9.7 ProductionCapacity

- **Purpose:** For made-to-order creators, tracks how many concurrent custom orders they can accept per period, distinct from `AvailabilityCalendar` (specific dates) — this is a rolling capacity limit (e.g., "max 10 custom orders per week").
- **Attributes:** period definition; max concurrent orders; current committed count.
- **Relationships:** many-to-one with `Store`.
- **Lifecycle:** configured by creator; decremented as `Order`s are accepted, incremented back on cancellation.
- **Indexes:** index on store_id.

## 9.8 Future Reservation Strategy

At V2 launch, `Reservation` uses simple time-boxed row locks scoped to a single `ProductVariant`, sufficient for expected traffic. As flash-sale-style demand spikes become relevant (e.g., a viral product drop), the schema anticipates (without implementing at V2) a queue-based reservation model (e.g., a Redis-backed short-TTL lock in front of the Postgres row, only writing to Postgres on confirmed reservation) to avoid row-lock contention at extreme concurrency — a purely operational/caching-layer evolution that does not require changing the `Reservation` entity's shape.


---

# 10. Catalog Domain

The Catalog domain models discovery *structure*, distinct from Product content (Section 8) and Search *infrastructure* (Section 24) — it answers "how is the marketplace organized," directly implementing 04-information-architecture.md's taxonomy (Section 8), product classification (Section 9), and URL architecture (Section 12).

### 10.1 Category / 10.2 Subcategory

- **Purpose:** The formal, platform-curated taxonomy tree buyers navigate (Home Décor → Wall Art → Framed Prints, etc.).
- **Attributes:** name; slug; description; parent category reference (self-referential for arbitrary depth, with `Subcategory` as a documented alias for a `Category` row with a non-null parent, rather than a separate table — avoiding a rigid two-level-only structure that would need restructuring for a third level later).
- **Relationships:** self-referential one-to-many (parent → children); many-to-many with `Product` via `ProductCategory`; one-to-one with `NavigationNode`, `SEOHierarchy`.
- **Lifecycle:** platform-curated, not creator-created (curation-first philosophy); additive, rarely restructured; restructuring triggers `URLMapping` redirect creation (Section 10.10).
- **Indexes:** unique on slug; index on parent_id.

### 10.3 Collection

- **Purpose:** Editorially curated cross-category groupings ("Editor's Picks," seasonal drops) — supports the "Quality Over Quantity"/curation core value distinct from algorithmic taxonomy.
- **Attributes:** title; description; cover media reference; curation type (manual, rule-based [future], AI-assisted [future]); published flag; display order.
- **Relationships:** many-to-many with `Product` (direct curation, via a join table `CollectionProduct`, implied member of this entity's relationship set); optionally scoped to a `GiftGuide`/`Occasion`.
- **Lifecycle:** created/edited by internal content/curation team (CMS-adjacent); published/unpublished.
- **Indexes:** unique on slug; index on published flag.

### 10.4 Occasion / 10.5 Festival

- **Purpose:** Time- and context-oriented groupings for gifting use cases (Wedding, Anniversary, Diwali, Christmas) — directly supports the "Meaningful Gift Buyers" and "Occasion-Driven Casual Buyers" personas (00-project-vision.md Section 8.2).
- **Attributes:** name; slug; description; seasonal date range (for Festival, using a Postgres range type); recurring flag (annual recurrence).
- **Relationships:** many-to-many with `Product` (products tagged for an occasion); referenced by `Collection`/`GiftGuide`.
- **Lifecycle:** platform-curated; Festival rows recur annually via a scheduled activation window rather than being recreated each year.
- **Indexes:** GiST index on date range (Festival); unique on slug.

### 10.6 GiftGuide

- **Purpose:** Editorial content combining Occasion/Festival context with curated product picks and narrative content — a hybrid of Collection and CMS Article, scoped specifically to gifting use cases.
- **Attributes:** title; narrative content (rich text); associated Occasion/Festival reference; published window.
- **Relationships:** many-to-many with `Product`; many-to-one (optional) with `Occasion`/`Festival`.
- **Lifecycle:** created/published by content team; time-boxed visibility.
- **Indexes:** index on published window; index on occasion/festival reference.

### 10.7 Taxonomy

- **Purpose:** A conceptual umbrella entity documenting the *relationships* between Category, Material, Technique, Tag, Occasion — i.e., the rules for which attribute types apply to which category (e.g., "Technique" filters are only relevant for handmade craft categories, not all categories). Modeled as a rules/config table rather than a data table with its own primary business rows.
- **Attributes:** category reference; applicable attribute type (material, technique, tag, occasion); required vs. optional flag.
- **Relationships:** many-to-one with `Category`.
- **Lifecycle:** platform-configured, changes infrequently.
- **Indexes:** composite index on (category_id, attribute_type).

### 10.8 NavigationNode

- **Purpose:** Drives the site's primary/secondary navigation menus (04-information-architecture.md Section 4) as configurable data rather than hardcoded routes, so navigation can be reorganized without a deploy.
- **Attributes:** label; target type (category, collection, static page, external URL); target reference; display order; nav placement (primary, footer, mobile-only).
- **Relationships:** self-referential (nested menus); polymorphic target reference (documented pattern, Section 26).
- **Lifecycle:** content-team-managed; low write frequency.
- **Indexes:** composite index on (nav_placement, display_order).

### 10.9 SEOHierarchy

- **Purpose:** Captures the canonical parent-chain for breadcrumb and structured-data generation (04-information-architecture.md Section 13), decoupled from the raw `Category` tree so breadcrumb logic can diverge from strict taxonomy where needed (e.g., a product may be breadcrumbed under its primary category even if tagged to several).
- **Attributes:** entity type (product, category, collection); entity reference; breadcrumb path (ordered list of category/collection references).
- **Relationships:** references `Product`/`Category`/`Collection` polymorphically.
- **Lifecycle:** recomputed when underlying category assignment changes (derived data, Section 2.3 philosophy).
- **Indexes:** index on (entity_type, entity_id).

### 10.10 URLMapping

- **Purpose:** Redirect table ensuring URL stability (04-information-architecture.md Section 12.1 Canonical Rules) — when a slug changes (rare, per Sections 7.2/8.12's slug-immutability rules, but still possible for pre-launch or unlisted entities), old URLs 301-redirect rather than 404.
- **Attributes:** old path; new path; redirect type (301 permanent); created_at.
- **Relationships:** none (standalone lookup table).
- **Lifecycle:** append-only; old mappings never removed (a redirect chain is resolved at the application layer, not by deleting history).
- **Indexes:** unique on old_path.

---

# 11. Customer Domain

The Customer domain holds buyer-side account data that is not core identity (Identity domain, Section 5) — it is the buyer-equivalent counterpart to the Marketplace domain's creator-side data.

### 11.1 BuyerProfile

- **Purpose:** Buyer-specific account attributes distinct from the shared `UserProfile` (Section 5.2) — e.g., default currency/locale for commerce purposes, marketing consent.
- **Attributes:** marketing-consent flag; default shipping address reference; buyer-tier/segment (future loyalty extension seam); account creation source.
- **Relationships:** one-to-one with `User`.
- **Lifecycle:** created when a `User` first acts as a buyer (which, given the platform's model, is essentially every `User` — even Creators can buy); Composition with `User` (Cascade at the buyer-profile level; the underlying `User` itself follows Section 5.1's Restrict rule).
- **Indexes:** unique on user_id.

### 11.2 Address

- **Purpose:** Shipping/billing addresses saved to a buyer's account.
- **Attributes:** recipient name; address lines; city/region/postal/country; address type (shipping, billing); default flag; label (Home, Work).
- **Relationships:** many-to-one with `User`.
- **Lifecycle:** creatable/editable/deletable freely while unused by any pending Order; once referenced by an `Order` (via denormalized snapshot, Section 2.3), the Order's copy is immutable even if the source Address is later edited or deleted.
- **Indexes:** index on user_id; index on default flag.
- **Constraints:** exactly one default shipping address per user (application-enforced, partial-unique-index candidate, Section 27).

### 11.3 Wishlist / 11.4 WishlistItem

- **Purpose:** Buyer-curated saved-for-later product lists (01-product-requirements.md Section 4.8), feeding both a personal UX feature and the `Product.wishlist_count` aggregate (Section 2.3).
- **Attributes (Wishlist):** name (supports multiple named lists, e.g., "Wedding Ideas," future extension beyond a single default list); visibility (private, shareable link [future]).
- **Attributes (WishlistItem):** added_at timestamp; optional note.
- **Relationships:** `Wishlist` many-to-one with `User`; `WishlistItem` many-to-one with `Wishlist` and with `Product` (or `ProductVariant`, where variant-level specificity matters).
- **Lifecycle:** freely created/removed by buyer.
- **Indexes:** composite unique on (wishlist_id, product_id); index on user_id.

### 11.5 SavedPaymentMethod

- **Purpose:** A *reference* to a tokenized payment method held by the payment processor (Stripe or similar, via the Payment domain, Section 14) — this table never stores raw card data, only the processor's token/reference and display-safe metadata (last 4 digits, card brand, expiry).
- **Attributes:** processor token reference; display metadata (brand, last4, expiry); default flag.
- **Relationships:** many-to-one with `User`.
- **Lifecycle:** created on save-at-checkout consent; removable by buyer at any time.
- **Indexes:** index on user_id.
- **Constraints:** raw PAN/CVV data must never be persisted in this or any Dreams by Kalakaaar-owned table (Section 29.1) — enforced by architectural policy, not merely a database constraint.

### 11.6 Coupons

- **Purpose:** Buyer-facing record of coupon codes a buyer has saved or been targeted with, distinct from the coupon *definition* itself (which is store- or platform-owned, modeled under Cart & Checkout as `CouponApplication`'s referenced coupon-definition entity, Section 12.3) — this table is the buyer's personal "my coupons" view.
- **Attributes:** coupon reference; saved_at; used flag.
- **Relationships:** many-to-one with `User`; many-to-one with the coupon-definition entity.
- **Lifecycle:** created when a buyer saves/claims a coupon; marked used on redemption.
- **Indexes:** composite index on (user_id, used flag).

### 11.7 GiftHistory

- **Purpose:** Tracks products a buyer has purchased *as gifts* (distinct from self-purchases) to power future gifting-specific features (gift reminders, "buy again for the same person") without overloading the core `Order` entity with gifting-specific query patterns.
- **Attributes:** recipient name/relationship (buyer-entered, not necessarily a platform `User`); occasion reference; order reference.
- **Relationships:** many-to-one with `User` (the giver); many-to-one with `Order`; optional many-to-one with `Occasion`.
- **Lifecycle:** created automatically when an order is marked as a gift at checkout (`GiftMessage`, Section 12.8).
- **Indexes:** index on user_id.

### 11.8 Preferences / 11.9 NotificationPreferences / 11.10 PrivacyPreferences

- **Purpose:** Layered preference entities — `Preferences` for general commerce preferences (preferred categories, size profile for apparel-adjacent products), `NotificationPreferences` for channel/frequency opt-in/out (feeding the Notification domain, Section 17), `PrivacyPreferences` for consent and data-sharing choices (feeding Section 29 GDPR-readiness).
- **Attributes:** each is a set of typed key-value preference flags scoped to its category.
- **Relationships:** one-to-one with `User` each.
- **Lifecycle:** Composition with `User` (Cascade); freely editable.
- **Indexes:** unique on user_id (each).

---

# 12. Cart & Checkout Domain

This domain is deliberately modeled as **ephemeral working state**, sharply distinct from the durable Order domain (Section 13) — nothing in Cart & Checkout is a permanent business record; everything here either converts into an Order or is discarded/expires.

### 12.1 Cart

- **Purpose:** A buyer's (or guest's, via a session-bound anonymous cart) current in-progress selection of items, potentially spanning multiple stores (a single cart can contain products from several creators, which is why checkout later splits into `SubOrder`s per store, Section 13.2).
- **Attributes:** owner reference (User, or anonymous session token for guest carts); status (active, converted, abandoned); last_activity_at.
- **Relationships:** one-to-many with `CartItem`; one-to-one (on conversion) with `CheckoutSession`.
- **Lifecycle:** created on first add-to-cart → active, mutated freely → converted (on successful order placement — Cascade-deleted once converted, since `OrderItem` holds the durable snapshot, Section 2.3) → abandoned (expired after inactivity window, hard-deleted by scheduled job, per Section 2.13 ephemeral exception).
- **Indexes:** index on owner reference; index on last_activity_at (abandonment cleanup).

### 12.2 CartItem

- **Purpose:** A single product/variant selection within a Cart, including chosen customization values.
- **Attributes:** quantity; chosen variant reference; chosen customization values (structured, referencing `CustomizationValue`/free-text input); price-at-add snapshot (for display continuity, not final billing truth — final price is re-validated at checkout).
- **Relationships:** many-to-one with `Cart`; many-to-one with `ProductVariant`.
- **Lifecycle:** Composition with `Cart` (Cascade).
- **Indexes:** index on cart_id.

### 12.3 CouponApplication

- **Purpose:** Records a coupon code applied to a Cart/CheckoutSession and the discount it produced, prior to order finalization.
- **Attributes:** coupon-definition reference; discount amount computed; applied_at.
- **Relationships:** many-to-one with `Cart` or `CheckoutSession`.
- **Lifecycle:** ephemeral, tied to the cart/checkout lifecycle (Cascade); on successful order placement, the *result* (discount amount applied) is copied into the durable `Order` record, not this row itself.
- **Indexes:** index on cart_id/checkout_session_id.

### 12.4 CheckoutSession

- **Purpose:** The transient state machine for the checkout flow itself — shipping selection, tax calculation, payment intent creation — separate from `Cart` because a single cart can be "attempted" through checkout multiple times (e.g., a failed payment retries within the same checkout session without re-building the cart).
- **Attributes:** status (started, address_selected, shipping_selected, payment_pending, completed, failed, abandoned); expiry timestamp.
- **Relationships:** one-to-one with `Cart`; one-to-many with `ShippingSelection`, `PaymentIntent`; one-to-one with `OrderPreview`, `TaxCalculation`, `DeliveryEstimate`, `GiftMessage`.
- **Lifecycle:** created on "proceed to checkout" → progresses through status states → completed (triggers Order creation, Section 13.1) or abandoned/expired (ephemeral cleanup).
- **Indexes:** index on cart_id; index on expiry (cleanup job).

### 12.5 ShippingSelection

- **Purpose:** The buyer's chosen shipping method/speed per store (since a multi-store cart may have different shipping options per creator).
- **Attributes:** store reference; selected shipping method; cost; estimated delivery window (references `DeliveryEstimate`).
- **Relationships:** many-to-one with `CheckoutSession`; many-to-one with `Store`.
- **Lifecycle:** Composition with `CheckoutSession` (Cascade); on order completion, copied into `Shipment` (Section 13.7) as durable record.
- **Indexes:** index on checkout_session_id.

### 12.6 PaymentIntent

- **Purpose:** A reference to the payment processor's payment-intent object (Stripe-style two-phase payment: create intent → confirm) — the local row tracks status so the application can reconcile webhook events without re-querying the processor for every read.
- **Attributes:** processor reference/token; amount; currency; status (requires_payment_method, processing, succeeded, failed, cancelled).
- **Relationships:** many-to-one with `CheckoutSession`; on success, one-to-one with the resulting `Payment` (Section 14.1).
- **Lifecycle:** created at payment step → updated via processor webhook → succeeded (triggers Order creation) or failed/cancelled (checkout session reverts, `Reservation`s released, Section 9.3).
- **Indexes:** unique on processor reference; index on checkout_session_id.

### 12.7 OrderPreview

- **Purpose:** A computed, not-yet-committed summary of what the Order *will* look like (line items, taxes, shipping, total) shown to the buyer for final review before payment confirmation — kept separate from the final `Order` so re-computation (e.g., a price or tax change mid-session) never silently mutates a "real" order record.
- **Attributes:** computed subtotal, tax, shipping, discount, total; computed_at.
- **Relationships:** one-to-one with `CheckoutSession`.
- **Lifecycle:** recomputed on any relevant change (address, coupon, shipping selection) until checkout completes; Cascade-deleted with the session.
- **Indexes:** none beyond foreign key.

### 12.8 GiftMessage

- **Purpose:** Buyer-entered gift note and gift-wrap preference for a checkout, supporting the platform's gifting-experience focus (00-project-vision.md Section 6.2).
- **Attributes:** message text; gift-wrap requested flag; recipient name (for `GiftHistory`, Section 11.7).
- **Relationships:** one-to-one with `CheckoutSession`; on completion, copied to `Order`/`OrderItem` as a durable field.
- **Lifecycle:** Composition with `CheckoutSession` (Cascade).

### 12.9 TaxCalculation

- **Purpose:** Records the computed tax breakdown for a checkout, supporting 01-product-requirements.md Section 7.6 business rules and future jurisdiction-specific tax logic (Section 30 internationalization).
- **Attributes:** jurisdiction; tax rate applied; tax amount; calculation method/provider reference (in case an external tax API is used).
- **Relationships:** one-to-one with `CheckoutSession`.
- **Lifecycle:** recomputed as address/cart changes; final value copied into `Order` on completion.

### 12.10 DeliveryEstimate

- **Purpose:** Computed estimated delivery window shown pre-purchase, combining `Store` shipping policy, `Product` lead time, and carrier transit estimates.
- **Attributes:** estimated earliest/latest delivery date; basis (made-to-order lead time vs. stocked-item shipping).
- **Relationships:** many-to-one with `CheckoutSession`; many-to-one with `Store`.
- **Lifecycle:** recomputed as relevant inputs change; copied into `Order`/`Shipment` on completion.


---

# 13. Order Domain

Order is the durable, immutable-once-placed record of a completed transaction — the entity every other domain (Payment, Shipping, Reviews, Support, Messaging context) ultimately anchors back to for "what did the buyer actually buy."

### 13.1 Order

- **Purpose:** The top-level transaction record for a single checkout, which may span multiple stores.
- **Attributes:** buyer reference; order number (human-friendly, unique, immutable); status (placed, processing, partially_shipped, shipped, delivered, completed, cancelled, refunded — aggregated from `SubOrder` states); placed_at; totals (subtotal, tax, shipping, discount, grand total — durable snapshot, not recomputed from live prices); billing address snapshot; payment reference.
- **Relationships:** many-to-one with `User` (buyer); one-to-many with `SubOrder`; one-to-one with `Invoice`; one-to-many with `OrderTimeline`, `OrderStatusHistory`, `OrderCommunication`.
- **Lifecycle:** created atomically from a completed `CheckoutSession` (Section 12.4) → status progresses as `SubOrder`s progress → completed (terminal, successful) or cancelled/refunded (terminal, unsuccessful) — Restrict hard-delete permanently (financial record, Section 2.16).
- **Indexes:** unique on order_number; index on (buyer_id, placed_at descending) for order history; index on status.
- **Constraints:** grand total must equal the sum of its `SubOrder` totals (application-enforced at creation, reinforced by a periodic reconciliation job, Section 28).
- **Audit:** every status transition recorded in `OrderStatusHistory`; every buyer-visible event recorded in `OrderTimeline`.

### 13.2 SubOrder

- **Purpose:** The per-store slice of an Order — since Dreams by Kalakaaar is a multi-creator marketplace, a single buyer checkout can (and often will) include products from several different Stores, each of which fulfills, ships, and gets paid independently.
- **Attributes:** store reference; status (mirrors Order's state machine but scoped to this store's items); subtotal/shipping/tax portion attributable to this store; creator payout status reference (Section 14.6).
- **Relationships:** many-to-one with `Order`; many-to-one with `Store`; one-to-many with `OrderItem`; one-to-one (per fulfillment) with `Shipment`.
- **Lifecycle:** created alongside `Order`, one row per distinct store in the cart → progresses independently (one creator can ship while another is still preparing a made-to-order item) → the parent `Order.status` is a computed aggregate of all its `SubOrder` states (e.g., "partially_shipped" when some but not all SubOrders have shipped).
- **Indexes:** index on order_id; index on (store_id, status) for the Creator Dashboard's order-management view.
- **Constraints:** Restrict hard-delete (financial record).

### 13.3 OrderItem

- **Purpose:** A single product-variant line item within a SubOrder, holding the full denormalized snapshot (Section 2.3) of what was purchased.
- **Attributes:** product/variant reference (for traceability) plus denormalized title, image, price-at-purchase, chosen customization values, quantity; line total.
- **Relationships:** many-to-one with `SubOrder`; many-to-one (reference only) with `Product`/`ProductVariant`; referenced by `Review` (Section 15.1), `ReturnRequest`, `Backorder`.
- **Lifecycle:** created once, immutable thereafter (Restrict — a financial line item is never edited after order placement; corrections happen via `Cancellation`/`Exchange`/`RefundRequest`, which create new records rather than mutating this one).
- **Indexes:** index on suborder_id; index on product_id (for "has this buyer purchased this product" eligibility checks feeding Reviews, Section 15).

### 13.4 OrderTimeline

- **Purpose:** Buyer-facing, human-readable event feed for an order ("Your order has been shipped," "Creator started working on your custom piece") — distinct from the more technical `OrderStatusHistory`, optimized for direct UI rendering rather than audit precision.
- **Attributes:** event type; display message; timestamp; visible-to-buyer flag.
- **Relationships:** many-to-one with `Order` (or `SubOrder`, for store-specific events).
- **Lifecycle:** append-only.
- **Indexes:** index on order_id.

### 13.5 OrderStatusHistory

- **Purpose:** Append-only, audit-grade record of every status transition on `Order`/`SubOrder` (Section 2.15).
- **Attributes:** from_status; to_status; actor (system, creator, admin, buyer-initiated-cancellation); timestamp; reason.
- **Relationships:** many-to-one with `Order`/`SubOrder`.
- **Lifecycle:** append-only.
- **Indexes:** index on order_id; index on timestamp.

### 13.6 Invoice

- **Purpose:** The formal billing document reference for an Order (buyer-facing receipt; may also support future business-buyer invoicing needs, Section 30).
- **Attributes:** invoice number (unique); generated_at; PDF/document reference (Media domain); line-item breakdown snapshot.
- **Relationships:** one-to-one with `Order`.
- **Lifecycle:** generated once at order completion; immutable thereafter; a refund/adjustment generates a separate credit-note-style record rather than mutating the original invoice (financial audit integrity).
- **Indexes:** unique on invoice_number.

### 13.7 Shipment / 13.8 ShipmentTracking

- **Purpose:** `Shipment` represents one physical package dispatched for a SubOrder (a SubOrder may split into multiple Shipments, e.g., partial shipment); `ShipmentTracking` is the append-only carrier-status feed for that shipment.
- **Attributes (Shipment):** carrier; tracking number; shipped_at; status (label_created, in_transit, delivered, exception); items included (references a subset of `OrderItem`s for partial shipments).
- **Attributes (ShipmentTracking):** carrier status code; description; location (if provided by carrier); event timestamp.
- **Relationships:** `Shipment` many-to-one with `SubOrder`; `ShipmentTracking` many-to-one with `Shipment`.
- **Lifecycle:** `Shipment` created when a creator marks items as shipped → status updated via carrier webhook/polling → delivered (terminal); `ShipmentTracking` append-only.
- **Indexes:** index on suborder_id; unique on tracking_number (scoped per carrier); index on (shipment_id, event_timestamp) for `ShipmentTracking`.

### 13.9 ReturnRequest / 13.10 RefundRequest

- **Purpose:** `ReturnRequest` models the buyer-initiated request to send an item back; `RefundRequest` models the money-side request (which may exist without a physical return, e.g., a partial refund for a damaged item the buyer keeps) — kept as two entities because 01-product-requirements.md Section 7.2/7.3 treats returns and refunds as related but distinct business rules (not every return implies a refund of the full amount, and not every refund requires a physical return).
- **Attributes (ReturnRequest):** order item(s) reference; reason; status (requested, approved, rejected, item_received, completed); return shipping label reference.
- **Attributes (RefundRequest):** order/order-item reference; requested amount; reason; status (requested, approved, rejected, processed); linked `ReturnRequest` (optional).
- **Relationships:** many-to-one with `Order`/`OrderItem`; `RefundRequest` one-to-one (optional) with `ReturnRequest`; one-to-one (on approval) with `Refund` (Section 14.7).
- **Lifecycle:** requested → creator/platform review → approved/rejected → (for returns) item received confirmation → completed; Restrict hard-delete (financial/dispute record).
- **Indexes:** index on order_id; index on status (support/creator queue views).

### 13.11 OrderCommunication

- **Purpose:** Order-scoped log linking to the Messaging domain (Section 15) — records which `Conversation`/`Message` relates to which Order, so support and creators can see full communication context on an order without Messaging needing an order-specific schema of its own.
- **Attributes:** none beyond foreign keys and linked_at.
- **Relationships:** many-to-one with `Order`; many-to-one with `Conversation`.
- **Lifecycle:** pure link table.
- **Indexes:** composite index on (order_id, conversation_id).

### 13.12 Cancellation

- **Purpose:** Records a full or partial order cancellation, distinct from `ReturnRequest` (which implies goods were shipped) — cancellation happens before or during fulfillment, before the buyer has received anything.
- **Attributes:** scope (full order, specific SubOrder, specific OrderItem); reason; initiated_by (buyer, creator, system/timeout); cancelled_at; refund reference.
- **Relationships:** many-to-one with `Order`/`SubOrder`/`OrderItem`; one-to-one (optional) with `Refund`.
- **Lifecycle:** created on cancellation request → processed (triggers inventory release via `InventoryTransaction`, refund via `Refund`) → terminal.
- **Indexes:** index on order_id.

### 13.13 Exchange

- **Purpose:** Records a buyer request to swap a received item for a different variant (size/color exchange) rather than a refund.
- **Attributes:** original order item reference; requested replacement variant; status (requested, approved, rejected, shipped, completed); price difference (if any) and its payment/refund direction.
- **Relationships:** many-to-one with `OrderItem`; many-to-one with `ProductVariant` (replacement); one-to-one (optional) with a follow-on `Shipment`.
- **Lifecycle:** requested → reviewed → processed (may spawn a new mini-fulfillment cycle) → completed.
- **Indexes:** index on order_item_id.

---

# 14. Payment Domain

The Payment domain models money movement with the conservatism appropriate to a marketplace handling other people's livelihoods — every entity here is append-only or state-transitioned, never overwritten, and the domain models both the buyer-facing payment and the creator-facing payout/commission split, since Dreams by Kalakaaar is a marketplace (money flows buyer → platform → creator, minus commission), not a direct merchant-of-record-per-creator model.

### 14.1 Payment

- **Purpose:** The record of a buyer's successful (or attempted) payment for an Order.
- **Attributes:** order reference; amount; currency; processor reference (Stripe payment intent/charge ID or similar); status (pending, succeeded, failed, refunded, partially_refunded); method type reference.
- **Relationships:** one-to-one with `Order`; one-to-one with `PaymentIntent` (Section 12.6, the pre-order-completion counterpart); one-to-many with `Transaction`, `Refund`, `Dispute`.
- **Lifecycle:** created on successful checkout → succeeded (immutable core record) → subsequent refunds/disputes recorded as related entities, never by mutating this row's original amount (Restrict, financial record).
- **Indexes:** unique on processor reference; index on order_id.

### 14.2 PaymentMethod

- **Purpose:** The specific instrument used for a given `Payment` (as distinct from `SavedPaymentMethod`, Section 11.5, which is the buyer's saved-for-reuse reference — `PaymentMethod` here is the point-in-time record of what was actually charged, immutable even if the saved method is later removed).
- **Attributes:** type (card, wallet, bank transfer); display metadata snapshot (brand, last4).
- **Relationships:** many-to-one with `Payment`.
- **Lifecycle:** created with `Payment`, immutable.
- **Indexes:** index on payment_id.

### 14.3 Transaction

- **Purpose:** Append-only ledger of every discrete money-movement event tied to a `Payment` (authorization, capture, refund, chargeback) — the granular event log that `Payment.status` is a rolled-up summary of.
- **Attributes:** transaction type; amount; processor event reference; timestamp.
- **Relationships:** many-to-one with `Payment`.
- **Lifecycle:** append-only.
- **Indexes:** index on payment_id; index on timestamp.

### 14.4 Settlement

- **Purpose:** Represents the platform's own settlement with its payment processor (funds landing in the platform's account before creator payout) — the bridge between "buyer paid" and "platform can now pay the creator."
- **Attributes:** processor settlement/payout batch reference; amount; settled_at; status.
- **Relationships:** many-to-many with `Payment` (a settlement batch typically covers many payments) via an implied join, and one-to-many with `Payout`.
- **Lifecycle:** created by processor webhook/reconciliation job; append-only once settled.
- **Indexes:** index on settled_at.

### 14.5 Payout

- **Purpose:** Represents a payment from the platform to a Creator's bank account/connected payment account, for their earned share of one or more completed Orders (net of `Commission`, Section 14.6, and net of any `Refund`s attributable to their SubOrders).
- **Attributes:** store/creator reference; amount; currency; status (scheduled, processing, paid, failed); scheduled_for; paid_at; processor payout reference.
- **Relationships:** many-to-one with `Store`; many-to-many with `SubOrder` (a payout typically aggregates many SubOrders' net earnings) via a join entity implied here (`PayoutLineItem`, documented as part of this entity's relationship set rather than a separate top-level section, to keep the domain list aligned with the requested outline).
- **Lifecycle:** scheduled per platform payout cadence → processing → paid (terminal, Restrict — financial record) or failed (retried per platform policy).
- **Indexes:** index on (store_id, status); index on scheduled_for.

### 14.6 Commission

- **Purpose:** Records the platform's commission/fee taken on a given SubOrder — modeled as its own entity (not just a percentage field on Store) because commission rates can change over time and per-category, and historical orders must retain the rate that actually applied.
- **Attributes:** suborder reference; commission rate applied; commission amount; category-specific rate reference (if rates vary by product category).
- **Relationships:** one-to-one with `SubOrder`.
- **Lifecycle:** created at order completion, immutable (Restrict).
- **Indexes:** index on suborder_id.

### 14.7 Refund

- **Purpose:** The money-movement record of an actual refund issued (as distinct from `RefundRequest`, Section 13.10, which is the request/approval workflow — `Refund` is created only once a `RefundRequest` is approved and processed).
- **Attributes:** amount; reason; processed_at; processor reference; linked `RefundRequest`.
- **Relationships:** one-to-one with `RefundRequest`; many-to-one with `Payment`.
- **Lifecycle:** created on approval, processed via processor, immutable thereafter (Restrict).
- **Indexes:** index on payment_id.

### 14.8 Dispute

- **Purpose:** Represents a payment-processor-level dispute/chargeback (buyer disputes the charge with their bank/card issuer) — distinct from platform-level `ReturnRequest`/`RefundRequest`/Support `Ticket`, since a Dispute has external processor deadlines and evidence requirements the platform must respond to.
- **Attributes:** processor dispute reference; reason code; amount disputed; status (needs_response, under_review, won, lost); response deadline.
- **Relationships:** many-to-one with `Payment`.
- **Lifecycle:** created via processor webhook → evidence submitted → resolved (won/lost, terminal, Restrict — financial/legal record).
- **Indexes:** index on payment_id; index on response deadline (ops alerting).

### 14.9 Ledger / 14.10 AccountingEntry

- **Purpose:** `Ledger` is the platform's internal double-entry-style accounting record tying together Payment, Commission, Payout, and Refund into a coherent financial picture (which account owes/is owed what); `AccountingEntry` is each individual debit/credit line within that ledger.
- **Attributes (Ledger):** account type (platform revenue, creator payable, tax payable, buyer refund payable); running balance snapshot (derived, recomputed from entries).
- **Attributes (AccountingEntry):** debit/credit amount; account reference; source entity reference (Payment, Payout, Refund, Commission); entry timestamp.
- **Relationships:** `AccountingEntry` many-to-one with `Ledger`; polymorphic reference to the source financial event.
- **Lifecycle:** append-only, forming the permanent financial record of the platform (Restrict, longest retention category per Section 2.16).
- **Indexes:** index on (ledger_account, entry_timestamp).

## 14.11 Money Flow Explained

1. Buyer completes checkout → `PaymentIntent` confirmed → `Payment` created (`succeeded`) → `Transaction` (capture) logged.
2. Order recorded as `Order`/`SubOrder`/`OrderItem`; `Commission` computed per `SubOrder`.
3. Processor settles funds to the platform's account → `Settlement` recorded.
4. On the platform's payout cadence (e.g., weekly), net-eligible `SubOrder`s (order not disputed, past any return window) are aggregated into a `Payout` per Store, net of `Commission` and any `Refund`s.
5. `Payout` is sent to the creator's connected payment account; `AccountingEntry` rows close out the ledger for that cycle.
6. If a buyer requests a refund: `RefundRequest` approved → `Refund` processed against the original `Payment` → `Transaction` (refund) logged → if the corresponding `Payout` has not yet occurred, the refunded amount is excluded from it; if it already occurred, the shortfall is recorded as a payable adjustment against the creator's *next* `Payout` (documented business rule, application-enforced).


---

# 15. Messaging Domain

### 15.1 Conversation

- **Purpose:** A thread between two or more parties — typically buyer↔creator, sometimes buyer/creator↔support (Section 18).
- **Attributes:** context type (order-related, pre-sale inquiry, support-escalated); status (open, archived); last_message_at.
- **Relationships:** one-to-many with `Participant`, `Message`; many-to-one (optional) with `Order` via `OrderCommunication` (Section 13.11).
- **Lifecycle:** created on first message → active → archived (soft, buyer/creator-initiated) — never hard-deleted while linked to an Order (Restrict) to preserve dispute-resolution context.
- **Indexes:** index on last_message_at (inbox sorting).

### 15.2 Participant

- **Purpose:** Join entity for who is part of a `Conversation`.
- **Attributes:** role in conversation (buyer, creator, support agent); joined_at; muted flag.
- **Relationships:** many-to-one with `Conversation`; many-to-one with `User`.
- **Lifecycle:** pure link table with light state (muted flag); removal (leaving a conversation) is rare and soft.
- **Indexes:** composite unique on (conversation_id, user_id).

### 15.3 Message

- **Purpose:** A single message within a `Conversation`.
- **Attributes:** sender reference; body text; sent_at; edited flag; deleted flag (soft, sender-initiated retraction — content is blanked but the row persists for moderation/audit continuity).
- **Relationships:** many-to-one with `Conversation`; many-to-one with `User` (sender); one-to-many with `Attachment`, `ReadReceipt`.
- **Lifecycle:** created on send → editable within a short window (policy-defined) → soft-deletable; append-only at the audit layer (a `ModerationFlag`-eligible copy is preserved even if soft-deleted, per Section 15.7).
- **Indexes:** composite index on (conversation_id, sent_at).

### 15.4 Attachment

- **Purpose:** File/image attached to a `Message` (references `Media`, Section 22).
- **Relationships:** many-to-one with `Message`; many-to-one with `Media`.
- **Lifecycle:** Composition with `Message` (Soft-cascade).
- **Indexes:** index on message_id.

### 15.5 ReadReceipt

- **Purpose:** Tracks which `Participant` has read which `Message`, for unread-count and read-indicator UI.
- **Attributes:** read_at.
- **Relationships:** many-to-one with `Message`; many-to-one with `User`.
- **Lifecycle:** created/updated on read event.
- **Indexes:** composite unique on (message_id, user_id).

### 15.6 Notification (cross-reference)

- Messaging generates `Notification` (Section 17) rows (e.g., "New message from [Store]") rather than owning notification delivery itself — Notification is a shared, cross-domain concern (Section 17.1) referenced here for completeness of the domain's outbound effects.

### 15.7 ModerationFlag

- **Purpose:** Marks a `Message` (or `Conversation`) as flagged for Trust & Safety review (e.g., automated policy-violation detection, or a user report) — feeds the Moderation domain (Section 19).
- **Attributes:** flag reason; flagged_by (system or user); status (pending, reviewed, actioned, dismissed).
- **Relationships:** many-to-one with `Message`; one-to-one (on escalation) with `ModerationCase` (Section 19.1).
- **Lifecycle:** created on flag → reviewed → resolved; append-only history retained regardless of the underlying message's soft-delete state.
- **Indexes:** index on status.

---

# 16. Reviews Domain

### 16.1 Review

- **Purpose:** A buyer's post-purchase review of a Product/Store, gated to verified purchasers only (per 01-product-requirements.md Section 7.4) — the core trust signal for the "authenticity" and "quality" value proposition.
- **Attributes:** buyer reference; product reference; order-item reference (proof of purchase); title; body text; status (published, pending_moderation, removed); verified-purchase flag (always true by construction, given the eligibility gate).
- **Relationships:** many-to-one with `User` (author); many-to-one with `Product`; one-to-one with `OrderItem` (eligibility anchor); one-to-many with `Rating` (if ratings are multi-dimensional, e.g., quality/shipping/communication — modeled as separate rows rather than columns so new rating dimensions can be added without a schema migration), `MediaReview`, `CreatorReply`, `ReviewVote`, `ReviewReport`.
- **Lifecycle:** created only after `OrderItem` reaches a "delivered/completed" state → published (default) or pending_moderation (if flagged by automated filters) → removed (Moderation action, soft, Section 19).
- **Indexes:** index on product_id; unique on (order_item_id) — one review per purchased item, preventing duplicate reviews for the same purchase.
- **Constraints:** a `Review` cannot be created without a matching completed `OrderItem` for the same buyer and product (application-enforced eligibility check, per 01-product-requirements.md Section 7.4).

### 16.2 Rating

- **Purpose:** One scored dimension of a Review (overall, as-described accuracy, shipping speed, communication).
- **Attributes:** dimension type; score value (bounded range).
- **Relationships:** many-to-one with `Review`.
- **Lifecycle:** created with the Review, immutable thereafter (a review edit creates updated rows, tracked via the review's own edit history if editing is permitted by policy).
- **Indexes:** composite index on (review_id, dimension_type).

### 16.3 MediaReview

- **Purpose:** Buyer-uploaded photo/video evidence attached to a Review (references `Media`, Section 22) — high-trust signal, directly supporting "authenticity uncertainty" mitigation (00-project-vision.md Section 6.2).
- **Relationships:** many-to-one with `Review`; many-to-one with `Media`.
- **Lifecycle:** Composition with `Review` (Soft-cascade).
- **Indexes:** index on review_id.

### 16.4 CreatorReply

- **Purpose:** A Store's single public reply to a Review — supports creator voice/trust-building without turning reviews into an open thread.
- **Attributes:** body text; replied_at.
- **Relationships:** one-to-one with `Review`; many-to-one with `Store`.
- **Lifecycle:** created once per review (business rule: a store may reply once, editable but not duplicated).
- **Indexes:** unique on review_id.

### 16.5 ReviewVote

- **Purpose:** "Helpful/not helpful" community voting on a Review, feeding review sort/ranking.
- **Attributes:** vote direction (helpful/not helpful).
- **Relationships:** many-to-one with `Review`; many-to-one with `User`.
- **Lifecycle:** freely created/changed by voter.
- **Indexes:** composite unique on (review_id, user_id).

### 16.6 ReviewReport

- **Purpose:** A user-initiated report that a Review violates policy (fake, abusive, off-topic).
- **Attributes:** reason; reported_by; status (pending, reviewed, dismissed).
- **Relationships:** many-to-one with `Review`; feeds `ModerationCase` (Section 19.1) on escalation.
- **Lifecycle:** created on report → reviewed → resolved.
- **Indexes:** index on status.

### 16.7 ReviewModeration

- **Purpose:** The moderation decision record specific to a Review (distinct from the general `ModerationCase`, this is the lightweight, review-specific outcome log referenced by `Review.status`).
- **Attributes:** decision; reviewer; decided_at; notes.
- **Relationships:** one-to-one (per decision event, so history is preserved) with `Review`.
- **Lifecycle:** append-only.
- **Indexes:** index on review_id.

---

# 17. Notification Domain

### 17.1 Notification

- **Purpose:** The canonical, channel-agnostic record of "something happened that this user should be told about" — the single row that fans out into channel-specific queue entries (`EmailQueue`, `SMSQueue`, `PushQueue`, `InAppNotification`).
- **Attributes:** recipient reference; notification type (order_shipped, new_message, price_drop_wishlist_item, review_reminder, etc.); payload (structured data for template rendering); created_at; read flag (for in-app relevance).
- **Relationships:** many-to-one with `User`; one-to-many with `EmailQueue`, `SMSQueue`, `PushQueue`; one-to-one with `InAppNotification` (where applicable).
- **Lifecycle:** created by the triggering domain event → fanned out per `NotificationPreference` (Section 11.9) → read/unread state tracked for in-app relevance; archived per retention policy (Section 2.16).
- **Indexes:** index on (user_id, created_at descending); index on read flag.

### 17.2 NotificationTemplate

- **Purpose:** Versioned content template per notification type and channel (subject/body with variable placeholders), decoupling content authoring from application code.
- **Attributes:** notification type; channel; template content; version; active flag.
- **Relationships:** referenced by `Notification` fan-out logic.
- **Lifecycle:** versioned (Section 2.14 pattern) so historical notifications can reference the template version actually sent.
- **Indexes:** composite index on (notification_type, channel, active).

### 17.3 EmailQueue / 17.4 SMSQueue / 17.5 PushQueue

- **Purpose:** Channel-specific outbound delivery queues — decoupled from `Notification` itself so delivery retries, provider failures, and channel-specific status don't pollute the canonical notification record.
- **Attributes:** recipient contact (email/phone/device token); rendered content; status (queued, sent, delivered, failed, bounced); provider reference; attempt count.
- **Relationships:** many-to-one with `Notification`.
- **Lifecycle:** created on fan-out → processed by background worker (Section 28) → terminal status; failed sends retried per policy then marked permanently failed.
- **Indexes:** index on status (worker polling); index on notification_id.

### 17.6 InAppNotification

- **Purpose:** The specific renderable representation for the in-app notification center/bell icon, distinct from the raw `Notification` record for display-layer flexibility (icon, action link, grouping).
- **Attributes:** display icon/type; action URL; grouped-count (for batched notifications, e.g., "3 people liked your review").
- **Relationships:** one-to-one with `Notification`.
- **Lifecycle:** created alongside Notification; read state shared with parent.
- **Indexes:** index on user reference (via parent).

### 17.7 NotificationPreference (cross-reference)

- See Section 11.9 (`NotificationPreferences`, Customer domain) — the Notification domain reads from it at fan-out time rather than owning a duplicate copy, per Guiding Principle 2 (Section 1.7).

### 17.8 DeliveryLog

- **Purpose:** Append-only, provider-level delivery event log (opened, clicked, bounced) for analytics and deliverability monitoring — distinct from the queue tables' terminal status, since a single queued message can generate multiple delivery events over time (sent → delivered → opened → clicked).
- **Attributes:** queue entry reference; event type; event timestamp; provider metadata.
- **Relationships:** many-to-one with `EmailQueue`/`SMSQueue`/`PushQueue` (polymorphic reference, Section 26).
- **Lifecycle:** append-only.
- **Indexes:** index on (queue_entry_type, queue_entry_id, event_timestamp).

---

# 18. Support Domain

### 18.1 Ticket

- **Purpose:** A buyer- or creator-initiated support case, optionally linked to an Order.
- **Attributes:** requester reference; category (order issue, account issue, payment issue, general); subject; status (open, pending_customer, pending_internal, resolved, closed); priority; assigned agent reference.
- **Relationships:** many-to-one with `User` (requester); many-to-one (optional) with `Order`; many-to-one (optional) with `SupportAgent`; one-to-many with `TicketMessage`, `Escalation`.
- **Lifecycle:** created → triaged/assigned → worked → resolved → closed (soft, retained indefinitely for support-quality analytics, Restrict-adjacent given potential dispute-evidence value).
- **Indexes:** index on (status, priority) for agent queues; index on requester_id.

### 18.2 TicketMessage

- **Purpose:** Message thread within a Ticket (distinct from general `Message`/`Conversation`, Section 15, since support threads have agent-specific metadata like internal notes).
- **Attributes:** sender reference; body; internal-note flag (visible to staff only, not the requester); sent_at.
- **Relationships:** many-to-one with `Ticket`.
- **Lifecycle:** append-only.
- **Indexes:** index on ticket_id.

### 18.3 TicketAttachment

- **Purpose:** File attached to a `TicketMessage` (references `Media`).
- **Relationships:** many-to-one with `TicketMessage`; many-to-one with `Media`.
- **Lifecycle:** Composition (Soft-cascade).

### 18.4 Escalation

- **Purpose:** Records a Ticket being escalated to a higher tier/specialist (e.g., from Support Executive to Admin for a payment dispute).
- **Attributes:** escalated_from/to (SupportAgent references); reason; escalated_at.
- **Relationships:** many-to-one with `Ticket`.
- **Lifecycle:** append-only.
- **Indexes:** index on ticket_id.

### 18.5 RefundWorkflow

- **Purpose:** Support-side orchestration record linking a `Ticket` to the underlying `RefundRequest` (Section 13.10) it resulted in, so support agents have a unified view without duplicating refund logic in the Support domain.
- **Attributes:** none beyond foreign keys and linked_at.
- **Relationships:** many-to-one with `Ticket`; many-to-one with `RefundRequest`.
- **Lifecycle:** pure link table.

### 18.6 SupportAgent

- **Purpose:** Support-specific profile data for a `User` holding the Support Executive role (specialties, current load, shift schedule) — distinct from the generic `UserRole` assignment (Section 6.4), which only grants permission, not operational metadata.
- **Attributes:** specialty tags; current open-ticket count (denormalized, Section 2.3); active/available status.
- **Relationships:** one-to-one with `User`.
- **Lifecycle:** created on Support Executive onboarding; Composition with `User`.
- **Indexes:** index on active/available status (ticket-assignment routing).

### 18.7 KnowledgeBase

- **Purpose:** Internal (and optionally buyer-facing) help articles used by agents and Macros to resolve common issues quickly.
- **Attributes:** title; body content; category; internal-only flag.
- **Relationships:** none required beyond standalone content; may be referenced from CMS `Article` (Section 20.5) if published externally.
- **Lifecycle:** authored/edited by support/content team.
- **Indexes:** full-text index on title+body.

### 18.8 Macros

- **Purpose:** Canned/templated agent responses for common ticket categories, improving response time and consistency.
- **Attributes:** trigger category; template content; usage count (denormalized).
- **Relationships:** none required beyond standalone content.
- **Lifecycle:** authored/edited by support leads.
- **Indexes:** index on trigger category.

---

# 19. Moderation Domain

### 19.1 ModerationCase

- **Purpose:** The central case-management record for any trust-and-safety investigation — a Product listing, a Store, a Review, or a Message flagged for review, unified under one case model so Moderators have a single queue rather than per-entity-type tooling.
- **Attributes:** subject type (product, store, review, message, user); subject reference (polymorphic, Section 26); status (open, under_review, resolved, appealed); severity; opened_at.
- **Relationships:** one-to-many with `Evidence`, `Decision`, `Appeal`; polymorphic reference to the subject entity.
- **Lifecycle:** opened (from a `ModerationFlag`, `ReviewReport`, automated detection, or manual admin action) → reviewed → decided → optionally appealed → closed.
- **Indexes:** index on (status, severity) for the moderation queue; index on (subject_type, subject_id).

### 19.2 Evidence

- **Purpose:** Attached supporting material for a case (screenshots, flagged content snapshots, prior history references).
- **Attributes:** evidence type; content reference/snapshot; added_by; added_at.
- **Relationships:** many-to-one with `ModerationCase`.
- **Lifecycle:** append-only.
- **Indexes:** index on case_id.

### 19.3 Decision

- **Purpose:** The moderator's ruling on a case, including the action taken.
- **Attributes:** decided_by; decision type (no_action, warning, content_removed, suspension, ban); rationale; decided_at.
- **Relationships:** many-to-one with `ModerationCase`.
- **Lifecycle:** append-only (a case can have multiple decisions over time, e.g., initial decision then a reversal after appeal).
- **Indexes:** index on case_id.

### 19.4 Appeal

- **Purpose:** The subject's (creator's/user's) formal appeal of a `Decision`.
- **Attributes:** appellant reference; statement; status (pending, upheld, overturned); decided_at.
- **Relationships:** one-to-one (per appeal instance) with `Decision`.
- **Lifecycle:** created on appeal submission → reviewed → decided.
- **Indexes:** index on status.

### 19.5 Violation

- **Purpose:** A structured record of a specific policy violation type attributed to a `User`/`Store`, accumulated over time to support escalating-consequence policies (e.g., three violations → suspension).
- **Attributes:** violation category; severity; linked `ModerationCase`; recorded_at.
- **Relationships:** many-to-one with `User`/`Store`; many-to-one with `ModerationCase`.
- **Lifecycle:** append-only.
- **Indexes:** index on (subject reference, recorded_at).

### 19.6 Warning

- **Purpose:** A formal, user-visible warning issued as a `Decision` outcome, short of suspension.
- **Attributes:** message; acknowledged flag; issued_at.
- **Relationships:** many-to-one with `User`/`Store`; many-to-one with `Decision`.
- **Lifecycle:** created on issuance; acknowledged by recipient.
- **Indexes:** index on subject reference.

### 19.7 Ban / 19.8 Suspension

- **Purpose:** `Suspension` is a time-boxed or indefinite-but-reversible restriction (Store paused from selling, User temporarily blocked); `Ban` is a terminal, platform-wide restriction — modeled separately because they have materially different reversal semantics and downstream effects (a Suspension pauses `Store.status`; a Ban also revokes `AuthenticationAccount` access, Section 5.3).
- **Attributes (Suspension):** scope; start/end (nullable end for indefinite); reason; linked `Decision`.
- **Attributes (Ban):** reason; effective_at; linked `Decision`; appeal-eligibility flag.
- **Relationships:** many-to-one with `User`/`Store`; many-to-one with `Decision`.
- **Lifecycle:** created on decision → active → lifted (Suspension) or permanent (Ban, subject to `Appeal`).
- **Indexes:** index on subject reference; index on active/effective flag.

### 19.9 AuditTrail (domain-specific)

- **Purpose:** Moderation-domain-specific append-only trail, distinct from the platform-wide `AuditLog` (Section 23), capturing every moderation action with the full case context needed for trust-and-safety reporting and legal requests.
- **Attributes:** case reference; action; actor; timestamp; full context snapshot.
- **Relationships:** many-to-one with `ModerationCase`.
- **Lifecycle:** append-only, longest retention tier alongside financial records (Section 2.16), given potential legal relevance.
- **Indexes:** index on case_id.


---

# 20. CMS Domain

### 20.1 Page

- **Purpose:** A standalone marketing/informational page (About, Careers, How It Works) with structured, editable content — distinct from Product/Store pages, which are generated from commerce data, not authored content.
- **Attributes:** slug; title; status (draft, published); SEO metadata.
- **Relationships:** one-to-many with `Section`.
- **Lifecycle:** authored → published → versioned edits (Section 2.14 pattern applies to CMS content too, for legal-document-adjacent pages especially).
- **Indexes:** unique on slug.

### 20.2 Section

- **Purpose:** A modular content block within a `Page` (hero, text block, image gallery, FAQ block), enabling flexible page composition without a rigid one-page-one-template model.
- **Attributes:** block type; content payload (structured per block type); display order.
- **Relationships:** many-to-one with `Page`.
- **Lifecycle:** Composition with `Page` (Cascade).
- **Indexes:** composite index on (page_id, display_order).

### 20.3 Banner

- **Purpose:** Site-wide or placement-specific promotional banner (homepage hero, category-page banner).
- **Attributes:** placement; content/media reference; link target; active window (start/end).
- **Relationships:** none required beyond standalone content; references `Media`.
- **Lifecycle:** scheduled activation/deactivation.
- **Indexes:** composite index on (placement, active window).

### 20.4 Announcement

- **Purpose:** Platform-wide announcement (distinct from `StoreAnnouncement`, Section 7.12, which is per-store) — e.g., "site maintenance scheduled," "new feature launched."
- **Attributes:** message; severity/type; active window.
- **Lifecycle:** scheduled activation/deactivation.
- **Indexes:** index on active window.

### 20.5 Article

- **Purpose:** Editorial long-form content (blog-style — maker spotlights, gifting guides in article form, craft education) supporting the platform's storytelling differentiation.
- **Attributes:** title; slug; body content; author reference; published_at; status.
- **Relationships:** many-to-many with `Product`/`Store` (featured-in-article references); references `Media` for cover images.
- **Lifecycle:** authored → published → versioned edits.
- **Indexes:** unique on slug; index on published_at.

### 20.6 FAQ

- **Purpose:** Platform-wide FAQ content, distinct from `StoreFAQ` (Section 7.11).
- **Attributes:** question; answer; category; display order.
- **Lifecycle:** content-team managed.
- **Indexes:** index on category.

### 20.7 LegalDocument

- **Purpose:** Terms of Service, Privacy Policy, Creator Agreement — versioned, with acceptance tracking implied via a link to `User` acceptance records (kept in the Identity/Audit domain, referenced here rather than duplicated, per Guiding Principle 2).
- **Attributes:** document type; version; content; effective_from.
- **Lifecycle:** append-only versioning (Section 2.14) — legal documents are never edited in place once effective, only superseded by a new version.
- **Indexes:** composite index on (document_type, effective_from descending).

### 20.8 SEOContent

- **Purpose:** SEO overrides for CMS entities (Page, Article), mirroring `ProductSEO`'s pattern (Section 8.12) for consistency across the platform.
- **Attributes:** meta title/description overrides; canonical URL.
- **Relationships:** polymorphic reference to Page/Article (Section 26).
- **Indexes:** index on (entity_type, entity_id).

### 20.9 MediaLibrary

- **Purpose:** The CMS-facing organizational view over `Media` (Section 22) assets used in editorial content — a curated subset/folder structure, not a duplicate storage layer.
- **Attributes:** folder/tag organization metadata.
- **Relationships:** many-to-many with `Media`.
- **Indexes:** index on tag/folder.

---

# 21. Analytics Domain

The Analytics domain is read-mostly from the platform's perspective: it consumes events from every other domain but is never a dependency *for* transactional correctness (Section 2.4) — if analytics ingestion lags or fails, checkout and order processing must be entirely unaffected.

### 21.1 Metrics

- **Purpose:** Generic named-metric time-series table (a flexible fact table) for platform KPIs that don't warrant their own dedicated table (GMV, active creators, active buyers).
- **Attributes:** metric name; scope (platform, store, product); period; value.
- **Indexes:** composite index on (metric_name, scope_id, period).

### 21.2 Events

- **Purpose:** Raw behavioral event stream (page views, clicks, add-to-cart, search performed) — the rawest layer analytics is built from, deliberately schema-light (structured payload) so new event types don't require migrations.
- **Attributes:** event type; actor (user or anonymous session); payload; occurred_at.
- **Lifecycle:** append-only; high volume; candidate for early partitioning (Section 2.8) and the shortest retention tier before aggregation-and-purge (Section 2.16).
- **Indexes:** index on (event_type, occurred_at).

### 21.3 ProductViews

- **Purpose:** Denormalized rollup specifically for product view counts (split out from generic `Events` because it's the single highest-volume, most-queried analytics need — feeding `Product.views` display and `ProductAnalytics`, Section 8.13).
- **Attributes:** product reference; period; view count.
- **Indexes:** composite index on (product_id, period).

### 21.4 SearchAnalytics

- **Purpose:** Aggregated search behavior (query volume, zero-result queries, click-through) feeding both merchandising decisions and the Search domain's `TrendingSearch`/`Synonyms` (Section 24).
- **Attributes:** normalized query text; period; search count; zero-result flag; click-through rate.
- **Indexes:** composite index on (normalized_query, period).

### 21.5 SalesAnalytics

- **Purpose:** Aggregated sales rollups (by category, by store, by time period) for platform-level BI, distinct from `StoreAnalytics` (Section 7.6, creator-facing) — this is the internal/admin-facing equivalent.
- **Attributes:** scope; period; GMV; order count; average order value.
- **Indexes:** composite index on (scope, period).

### 21.6 CreatorAnalytics

- **Purpose:** Admin-facing rollup of creator health metrics (order fulfillment rate, response time, dispute rate) feeding internal creator-success and moderation risk-scoring workflows.
- **Attributes:** store reference; period; fulfillment rate; average response time; dispute rate.
- **Indexes:** composite index on (store_id, period).

### 21.7 PlatformAnalytics

- **Purpose:** Top-level, cross-cutting platform health rollup (total GMV, active users, take-rate) for executive/founder dashboards.
- **Attributes:** period; the platform's core KPI set.
- **Indexes:** index on period.

### 21.8 Experiment

- **Purpose:** A/B test / feature-experiment definition and assignment tracking, supporting a documentation-first, measured approach to future feature rollout.
- **Attributes:** experiment key; variant definitions; start/end; status.
- **Relationships:** one-to-many with an implied assignment record (which `User`/session saw which variant), tracked here rather than as a separate top-level domain entity, consistent with the requested outline's flat list.
- **Indexes:** unique on experiment key.

### 21.9 FeatureUsage

- **Purpose:** Tracks adoption of specific platform features (e.g., "% of creators using AvailabilityCalendar") to inform roadmap prioritization.
- **Attributes:** feature key; user/store reference; first_used_at; usage_count.
- **Indexes:** composite index on (feature_key, user_id/store_id).

### 21.10 DashboardSnapshots

- **Purpose:** Point-in-time cached renders of expensive dashboard aggregations (materialized-view-adjacent, Section 28), so a founder/admin dashboard load doesn't recompute heavy aggregates live.
- **Attributes:** dashboard key; snapshot payload; generated_at.
- **Indexes:** composite index on (dashboard_key, generated_at descending).

---

# 22. Media Domain

Media is deliberately its own domain rather than embedded per-feature, because images/video are referenced from Product, Store, CMS, Reviews, and Messaging alike — a single, well-modeled asset-management domain avoids five slightly different "image" implementations across the codebase.

### 22.1 Media

- **Purpose:** The canonical asset record — one row per uploaded file, regardless of which feature it's used from.
- **Attributes:** owner reference (uploading User); media type (image, video, document); original filename; MIME type; file size; upload status (processing, ready, failed).
- **Relationships:** one-to-many with `Image`/`Video` (type-specific detail), `Thumbnail`, `Transformation`, `Version`; referenced (many-to-many in effect, via each consuming table's foreign key) from `ProductMedia`, `StoreBranding`, `Attachment`, `MediaReview`, `MediaLibrary`, `Banner`.
- **Lifecycle:** created on upload → processed (thumbnails/transformations generated async, Section 28) → ready → referenceable; a `Media` row is only hard-deleted once *no* referencing table points to it (garbage-collected by a background job, Section 28) — otherwise Restrict.
- **Indexes:** index on owner reference; index on upload status (processing queue).

### 22.2 Image / 22.3 Video

- **Purpose:** Type-specific metadata that doesn't apply to the other type (dimensions for Image; duration/codec for Video).
- **Attributes (Image):** width, height, dominant color (for placeholder/blur-up rendering).
- **Attributes (Video):** duration, codec, resolution.
- **Relationships:** one-to-one with `Media`.
- **Indexes:** none beyond foreign key.

### 22.4 Thumbnail

- **Purpose:** Generated smaller/optimized renditions of an `Image`/`Video` for responsive delivery.
- **Attributes:** size variant (small, medium, large); storage location reference.
- **Relationships:** many-to-one with `Media`.
- **Lifecycle:** generated async on upload (Section 28); regenerable derived data (Section 2.3 philosophy).
- **Indexes:** composite index on (media_id, size_variant).

### 22.5 Transformation

- **Purpose:** Records any on-demand or scheduled transformation applied (crop, format conversion, future AI enhancement) so the pipeline is auditable and idempotent (a transformation isn't reapplied if already recorded).
- **Attributes:** transformation type; parameters; applied_at.
- **Relationships:** many-to-one with `Media`.
- **Indexes:** index on media_id.

### 22.6 StorageLocation

- **Purpose:** Abstracts *where* the binary actually lives (Supabase Storage bucket/path today; potentially a CDN or alternate object store later) so `Media` metadata never needs to change if the underlying storage backend changes.
- **Attributes:** provider; bucket/container; path/key; public URL (if applicable).
- **Relationships:** one-to-one with `Media` (or with each `Thumbnail`/`Transformation` variant, since each rendition has its own physical location).
- **Indexes:** none beyond foreign key.

### 22.7 AltText

- **Purpose:** Accessibility-critical alt text, modeled as its own entity (rather than a column on `Media`) because a single image can need different alt text depending on context (a product photo used both as a PDP gallery image and a category-page thumbnail may warrant different descriptive text) — directly supporting the Accessibility priority stated in this project's architecture mandate.
- **Attributes:** context (e.g., product_gallery, category_thumbnail); alt text content; author (creator-provided or AI-suggested, future).
- **Relationships:** many-to-one with `Media`.
- **Lifecycle:** required at Product-publish time for all `ProductMedia` (business rule enforced by `ProductApproval`, Section 8.17), reflecting the platform's accessibility commitment.
- **Indexes:** composite index on (media_id, context).

### 22.8 Metadata

- **Purpose:** Generic, extensible key-value technical metadata (EXIF data, color profile, upload source device) that doesn't warrant dedicated columns.
- **Attributes:** key; value.
- **Relationships:** many-to-one with `Media`.
- **Indexes:** composite index on (media_id, key).

### 22.9 Version

- **Purpose:** If a creator replaces/re-crops an image used on a live listing, `Version` preserves prior renditions so historical Order/Review references (which snapshot media at time of purchase, Section 2.3) remain valid even after the creator updates their gallery.
- **Attributes:** version number; superseded_at.
- **Relationships:** many-to-one with `Media` (self-referential lineage).
- **Lifecycle:** append-only.
- **Indexes:** composite index on (media_id, version_number).

---

# 23. Audit Domain

The Audit domain is the platform-wide accountability layer, complementing (not replacing) the domain-specific history tables described throughout this document (`ProductStatusHistory`, `OrderStatusHistory`, `PermissionAudit`, moderation's `AuditTrail`). Where those are structured and narrow, `AuditLog` is broad and general — the answer to "show me everything that happened to this record, regardless of domain."

### 23.1 AuditLog

- **Purpose:** The general-purpose, platform-wide append-only ledger of state-changing actions.
- **Attributes:** actor reference (User, or "system" for automated actions); action type; target entity type + id (polymorphic, Section 26); before/after snapshot (structured); timestamp; request context (IP, user agent).
- **Relationships:** references `User` (actor); polymorphic reference to any target entity.
- **Lifecycle:** append-only, retained per Section 2.16 (1–2 years hot, archived thereafter).
- **Indexes:** index on (target_type, target_id); index on (actor_id, timestamp); index on timestamp for time-range queries.

### 23.2 Activity

- **Purpose:** A lighter-weight, user-facing "activity feed" record (distinct from the security-oriented `AuditLog`) — e.g., a Creator's "recent activity" dashboard widget showing their own recent listing edits, order updates.
- **Attributes:** actor reference; activity type; display summary; occurred_at.
- **Relationships:** many-to-one with `User`.
- **Indexes:** index on (actor_id, occurred_at descending).

### 23.3 ChangeHistory

- **Purpose:** Generic before/after field-level diff record for entities that don't warrant their own dedicated version table (unlike `ProductVersion`, Section 8.15, or `StorePolicy` versioning, Section 7.4) — a catch-all diff log.
- **Attributes:** entity type + id; changed field; old value; new value; changed_by; changed_at.
- **Indexes:** index on (entity_type, entity_id, changed_at).

### 23.4 VersionHistory

- **Purpose:** A cross-domain umbrella concept documenting that any entity following the Versioning Philosophy (Section 2.14) uses the same conventions (append-only, `version_number`, `created_at`) — this section documents the pattern; the concrete tables are domain-owned (`ProductVersion`, `StorePolicy`, `LegalDocument`), per Guiding Principle 2, rather than a single shared polymorphic table, to keep each domain's version rows strongly typed and independently indexable.

### 23.5 SecurityEvent

- **Purpose:** Security-specific subset of audit activity warranting dedicated monitoring — failed login attempts, permission escalation attempts, suspicious device/location changes, MFA failures.
- **Attributes:** event type; severity; user reference; IP/device context; timestamp.
- **Lifecycle:** append-only; feeds real-time alerting (Section 29) in addition to historical audit.
- **Indexes:** index on (user_id, timestamp); index on severity.

### 23.6 LoginHistory

- **Purpose:** Durable record of every successful and failed login attempt (the durable counterpart to the ephemeral `Session`, Section 5.4).
- **Attributes:** user reference; success flag; IP; device fingerprint; timestamp.
- **Lifecycle:** append-only.
- **Indexes:** index on (user_id, timestamp descending).

### 23.7 APIUsage

- **Purpose:** Tracks API-level request activity (rate-limit enforcement input, abuse detection, future public/partner API billing per Section 30).
- **Attributes:** actor/API-key reference; endpoint; timestamp; response status.
- **Lifecycle:** append-only, shortest retention tier (high volume, low long-term value beyond aggregation).
- **Indexes:** index on (actor_id, timestamp).

### 23.8 SystemEvent

- **Purpose:** Platform/infrastructure-level events (deployment markers, background-job failures, scheduled-maintenance windows) useful for correlating "why did X happen" with "what was the platform doing at the time."
- **Attributes:** event type; severity; description; occurred_at.
- **Indexes:** index on occurred_at.

---

# 24. Search Domain

### 24.1 SearchIndex

- **Purpose:** The dedicated read-model table search queries run against — a denormalized document per searchable entity (Product primarily, also Store, Collection) combining title, description, tags, materials, category names, and creator name into a single indexed document, so search never has to join five normalized tables at query time (Section 2.11).
- **Attributes:** entity type; entity reference; searchable text (feeding a `tsvector` column); ranking-boost fields (recency, popularity, verified-store flag); last_indexed_at.
- **Relationships:** references `Product`/`Store`/`Collection` (polymorphic, Section 26).
- **Lifecycle:** rebuilt/updated asynchronously whenever a source entity changes (Section 28); fully derived, rebuildable data (Section 2.3 philosophy extended to a whole entity).
- **Indexes:** GIN index on the full-text search vector; index on entity_type for scoped rebuilds.

### 24.2 SearchHistory

- **Purpose:** Per-user (or per-session, for guests) record of past searches, powering "recent searches" UI and feeding `SearchAnalytics`/`TrendingSearch`.
- **Attributes:** user/session reference; query text; searched_at; result count.
- **Lifecycle:** append-only; shorter retention tier (Section 2.16) with periodic aggregation into `SearchAnalytics` before purge.
- **Indexes:** index on (user_id, searched_at descending).

### 24.3 TrendingSearch

- **Purpose:** Precomputed, periodically-refreshed list of currently-popular search terms, derived from `SearchAnalytics`.
- **Attributes:** query text; rank; period; velocity (rate of increase, to surface genuinely trending vs. consistently popular).
- **Lifecycle:** recomputed on a schedule (Section 28); fully derived.
- **Indexes:** index on (period, rank).

### 24.4 Autocomplete

- **Purpose:** Precomputed prefix-match suggestions for the search box, distinct from full search results, optimized for sub-100ms response as the buyer types.
- **Attributes:** prefix; suggested completion; popularity weight.
- **Lifecycle:** rebuilt periodically from `SearchHistory`/`SearchAnalytics` and the product catalog's title corpus.
- **Indexes:** index on prefix (btree, supports prefix-range scans).

### 24.5 Synonyms

- **Purpose:** Platform-curated synonym mapping (e.g., "necklace" ↔ "pendant") so search recall isn't limited to exact-term matching — directly improves discovery for a catalog with varied, sometimes idiosyncratic creator-chosen product terminology.
- **Attributes:** term; synonym set (array or linked rows).
- **Lifecycle:** curated by the content/search team; low write frequency.
- **Indexes:** index on term.

### 24.6 Filters

- **Purpose:** Defines which filter facets (category, material, price range, occasion, lead time) are available and how they're computed for a given search/category context — configuration data, not per-search-result data.
- **Attributes:** facet type; applicable scope (category, global); computation method (enumerated values vs. range).
- **Lifecycle:** platform-configured, low write frequency.
- **Indexes:** index on scope.

### 24.7 Recommendations (search-context)

- **Purpose:** Distinct from `ProductRecommendation` (Section 8.18, product-to-product associations), this is search-context recommendation — "no results for X, try Y" and "people also searched for" — read from `SearchAnalytics` co-occurrence patterns.
- **Attributes:** source query; recommended query/category; score.
- **Lifecycle:** recomputed periodically; fully derived.
- **Indexes:** index on source query.

## 24.8 AI Search Preparation

While AI-powered search is explicitly out of scope for V2 (00-project-vision.md, Section 24), `SearchIndex` (24.1) is deliberately structured so that a future semantic/vector-embedding column (via the Postgres `pgvector` extension) can be added to the *same* table alongside the existing `tsvector` column, rather than requiring a parallel search infrastructure. The searchable-text field this domain already builds (title + description + tags + materials + creator context) is precisely the input a future embedding-generation job would consume — meaning V2's Search domain is not just "current search," it is also, unmodified, the input pipeline for V3's AI search (Section 30).


---

# 25. Relationships Matrix

The following tables summarize ownership, cascade, and deletion strategy for the platform's most structurally significant entities (a full matrix across all ~150 entities is impractical to render usefully in prose; these represent each domain's anchor entities and the patterns that generalize to their children, per the per-entity lifecycle notes in Sections 5–24).

## 25.1 Core Anchor Entities

| Entity | Parent | Representative Children | Ownership | Cascade Rule | Deletion Strategy |
|---|---|---|---|---|---|
| User | — (root identity) | UserProfile, AuthenticationAccount, Session, Creator, BuyerProfile | Identity | Soft-cascade to profile-level children; Restrict on hard delete while any Order/Payment references it | Soft delete (status → deactivated/pending_deletion); never hard-deleted while financial history exists |
| Store | Creator | Product, StoreTeam, StoreBranding, SubOrder (referenced) | Marketplace | Soft-cascade to Product (archived, not deleted); Restrict while any Order exists | Soft delete (status → closed) |
| Product | Store | ProductVariant, ProductMedia, ProductVersion | Product | Soft-cascade to ProductVariant/ProductMedia on archive; OrderItem retains its own snapshot | Soft delete (status → archived) |
| ProductVariant | Product | Inventory, CartItem (referenced), OrderItem (referenced) | Product | Soft-cascade from Product; Restrict on hard delete while Inventory or Order history exists | Soft delete |
| Cart | User (or guest session) | CartItem, CouponApplication | Cart & Checkout | Cascade (hard delete) on conversion or abandonment | Hard delete (ephemeral) |
| CheckoutSession | Cart | ShippingSelection, PaymentIntent, OrderPreview | Cart & Checkout | Cascade (hard delete) on completion or expiry | Hard delete (ephemeral) |
| Order | User (buyer) | SubOrder, Invoice, OrderTimeline | Order | Restrict — permanent financial record | Never deleted; archived (cold storage) after active window |
| SubOrder | Order, Store | OrderItem, Shipment | Order | Restrict | Never deleted |
| OrderItem | SubOrder | Review (referenced), Backorder | Order | Restrict, immutable after creation | Never deleted or edited |
| Payment | Order | Transaction, Refund, Dispute | Payment | Restrict — permanent financial record | Never deleted |
| Payout | Store | (PayoutLineItem, implied) | Payment | Restrict | Never deleted |
| Conversation | — (root, participants) | Message, Participant | Messaging | Restrict while linked to an Order (via OrderCommunication); otherwise archivable | Soft delete (status → archived) |
| Review | User, Product | Rating, MediaReview, CreatorReply | Reviews | Soft-cascade to children on removal | Soft delete (status → removed) |
| Ticket | User | TicketMessage, Escalation | Support | Restrict-adjacent (retained for dispute/QA value) | Soft delete (status → closed), retained indefinitely |
| ModerationCase | (polymorphic subject) | Evidence, Decision, Appeal | Moderation | Restrict | Never deleted (legal/trust retention tier) |
| Media | (uploading User) | Thumbnail, Transformation, Version | Media | Restrict while any referencing table points to it | Hard delete only after reference-count reaches zero (background-job garbage collection) |

## 25.2 Cross-Domain Reference Summary

| Referencing Domain | References | Nature of Reference |
|---|---|---|
| Order | Cart & Checkout, Payment, Marketplace, Product | Order is created from a completed CheckoutSession; references Store via SubOrder; snapshots Product/ProductVariant content |
| Payment | Order | One Payment per Order; Refund/Dispute reference Payment |
| Reviews | Order, Product | Review eligibility gated on a completed OrderItem |
| Messaging | Order (optional), Identity | Conversation may link to an Order via OrderCommunication |
| Support | Order (optional), Identity | Ticket may reference an Order for context |
| Moderation | Product, Store, Review, Message, Identity | Polymorphic subject reference into whichever domain is under review |
| Analytics | All domains | Read-only aggregation; never a write dependency for other domains |
| Search | Product, Catalog, Marketplace | SearchIndex derived from these domains' content |
| Notification | Identity, Order, Messaging | Notification triggers originate from events in these domains |
| Audit | All domains | Polymorphic, platform-wide observer; never a write dependency |

---

# 26. Constraints

## 26.1 Primary Keys

Every entity uses a UUID (v4 or a time-sortable variant such as UUIDv7/ULID for high-insert-volume, time-ordered tables like `Order`, `Events`, `AuditLog`, where sortable-by-creation IDs meaningfully improve index locality) as its primary key, per Guiding Principle 5 (Section 1.7). No entity uses an auto-increment integer primary key, to keep IDs safe to expose publicly and safe for future horizontal partitioning/sharding (Section 2.7).

## 26.2 Unique Constraints

| Entity | Unique constraint | Purpose |
|---|---|---|
| User | email | One account per verified email |
| AuthenticationAccount | (provider, provider_external_id) | Prevent one external account linking to two Users |
| Store | slug | Stable, unique storefront URLs |
| Product (via ProductSEO) | (store_id, slug) | Unique product URLs per store |
| Order | order_number | Human-referenceable, unique order identifier |
| Payment | processor_reference | Prevent duplicate payment records from webhook replay |
| RolePermission | (role_id, permission_id) | Prevent duplicate grants |
| UserRole | (user_id, role_id, store_id) | Prevent duplicate role assignments |
| WishlistItem | (wishlist_id, product_id) | Prevent duplicate wishlist entries |
| Review | order_item_id | One review per purchased item |
| CreatorReply | review_id | One reply per review |
| ReadReceipt | (message_id, user_id) | One read-state per participant per message |

## 26.3 Foreign Keys

Every relationship documented in Sections 5–24 is enforced as an actual foreign-key constraint at the database level (not merely an application-layer convention), except where an entity is explicitly documented as **polymorphic** (Section 26.6), in which case referential integrity for that specific reference is enforced at the application layer plus a periodic reconciliation job (Section 28), since Postgres foreign keys cannot natively target "one of several possible tables."

## 26.4 Check Constraints

Representative examples of database-level CHECK constraints (beyond application-layer validation) used as defense-in-depth for the platform's most safety-critical invariants:

| Entity.Field | Constraint | Rationale |
|---|---|---|
| Inventory.available_quantity | >= 0 | Prevents oversell even if application-layer logic has a bug |
| ProductVariant.price | > 0 | No free or negative-price listings |
| Order.grand_total | >= 0 | No negative order totals |
| Rating.score | within defined valid range (e.g., 1–5) | Data integrity for trust signal |
| Payout.amount | >= 0 | No negative payouts |
| Reservation.expiry | > created_at | Logical time ordering |

## 26.5 Business Constraints (Application-Enforced)

Constraints that span multiple rows or tables, and therefore cannot be expressed as a single-table CHECK constraint, are enforced in application/service logic with tests, and where feasible reinforced by database triggers as defense-in-depth:

- A `User` must retain at least one `AuthenticationAccount` (Section 5.3).
- A `Product` cannot become `active` without at least one active `ProductVariant` and at least one `ProductMedia` with alt text (Sections 8.1, 8.2, 22.7).
- A `Store` cannot publish without a `verified` `StoreVerification` (Section 7.5).
- `Order.grand_total` must equal the sum of its `SubOrder` totals (Section 13.1), reconciled periodically (Section 28).
- A buyer may only create a `Review` for a `Product` they have a completed `OrderItem` for (Section 16.1).
- Exactly one `default` `Address` per `User` (Section 11.2) and exactly one `is_primary` `ProductMedia` per `Product` (Section 8.3) — both strong partial-unique-index candidates (Section 26.6).

## 26.6 Validation Rules and Implementation Notes

- **Polymorphic references** (e.g., `ModerationCase.subject`, `AuditLog.target`, `NavigationNode.target`, `SEOContent.entity`) are documented consistently throughout this document as (entity_type, entity_id) pairs rather than a single foreign key, since no single table can be the target. Referential integrity for these is validated at write time by application logic and checked periodically by a reconciliation job (Section 28) rather than a native database foreign key.
- **"Exactly one" invariants** (default address, primary product image, single creator reply) are strong candidates for Postgres **partial unique indexes** (e.g., a unique index on `product_id` filtered `WHERE is_primary = true`) at implementation time — noted here as an implementation-layer recommendation, not specified further since this document defines intent, not DDL.

## 26.7 Soft Deletes

Per Section 2.13, soft-deletable entities carry a `status` enumeration (preferred, since most entities have more than a binary deleted/not-deleted state — e.g., `Product.status` has five+ meaningful states) rather than a bare boolean `is_deleted` flag, except for purely binary cases (e.g., a `Message.deleted` flag, where "soft-deleted" genuinely is the only alternate state to "normal"). This keeps lifecycle modeling consistent with the Lifecycle Philosophy (Section 4.4).

---

# 27. Indexing Strategy

Indexing intent is described here at the strategic level; exact index definitions belong to the eventual Drizzle/Postgres migration layer, not this document.

## 27.1 Primary Indexes

Every table's primary key (UUID) is automatically indexed. High-cardinality foreign keys used in frequent joins (e.g., `Product.store_id`, `OrderItem.suborder_id`) are always indexed, since Postgres does not automatically index foreign key columns.

## 27.2 Composite Indexes

Composite indexes are built around actual query patterns identified per-domain in Sections 5–24 (e.g., `(store_id, status)` on `Product` for a creator's dashboard listing view; `(buyer_id, placed_at desc)` on `Order` for order history). Column order in a composite index always places the highest-selectivity, most-frequently-filtered-alone column first.

## 27.3 Search Indexes

GIN indexes on `tsvector` columns (`SearchIndex.searchable_text`, `Product.title`+`description`) power full-text search (Section 24). Trigram (`pg_trgm`) indexes are the recommended implementation-layer choice for fuzzy/typo-tolerant matching on creator/product names.

## 27.4 Filtering Indexes

Category, material, technique, tag, and occasion join tables (Section 8) are indexed on the "many" side first (e.g., `(category_id, product_id)`) because browsing a category is a far more frequent query than listing a product's categories.

## 27.5 Sorting Indexes

Common sort orders (newest, best-selling, price low-to-high/high-to-low, highest-rated) each imply an index whose leading columns match the filter (e.g., category or store scope) followed by the sort column, so Postgres can satisfy filter+sort without a separate sort step.

## 27.6 Pagination Indexes

Keyset (cursor-based) pagination is the intended pattern for all list views at scale (category browsing, order history, search results) rather than `OFFSET`-based pagination, because `OFFSET` degrades linearly with page depth at millions of rows. This implies indexes that include the pagination cursor column (typically `created_at` + `id` as a tiebreaker) as the trailing columns of relevant composite indexes.

## 27.7 Analytics Indexes

Time-series analytics tables (Section 21) are indexed primarily on `(scope_id, period)` and secondarily on raw `occurred_at`/`created_at` for range scans, anticipating eventual partitioning (Section 27.9) rather than relying on indexing alone at extreme volume.

## 27.8 Time-Series Indexes

High-volume append-only tables (`AuditLog`, `Events`, `OrderStatusHistory`, `NotificationDeliveryLog`) are indexed on their timestamp column, with the expectation that at scale this indexing strategy is complemented by partitioning (Section 27.9), not a substitute for it.

## 27.9 Partial Indexes

Partial indexes are the recommended implementation for: "exactly one" invariants (Section 26.6); "active only" queries on tables where most historical rows are terminal/inactive (e.g., an index on `Product` `WHERE status = 'active'` for public browsing, since the vast majority of browsing queries never need to see draft/archived rows).

## 27.10 Future Partition Indexes

When time-based partitioning (Section 2.8) is introduced for a table, each partition gets its own local indexes automatically (standard Postgres/`pg_partman` behavior); this document's indexing intent (columns and order) carries forward unchanged into the partitioned structure — partitioning changes the physical storage layout, not the logical indexing strategy defined here.

---

# 28. Performance Strategy

## 28.1 Query Optimization

Query patterns are designed around the read-heavy/write-heavy split established in Section 2.5/2.6: browsing queries are pre-optimized via denormalized aggregates and dedicated indexes; transactional queries are kept narrow and short-lived. All non-trivial queries are expected to be reviewed against `EXPLAIN ANALYZE` output before shipping, as an engineering practice (not a schema concern, but enabled by the indexing strategy above).

## 28.2 Caching

Per Section 2.10's layered caching philosophy: CDN edge caching for public pages, TanStack Query/edge cache for semi-personalized reads, materialized views (below) for expensive aggregates.

## 28.3 Materialized Views

Candidates for Postgres materialized views, refreshed on a schedule or on-demand via background job: `StoreAnalytics`/`ProductAnalytics` rollups (Section 7.6, 8.13), `TrendingSearch` (Section 24.3), `DashboardSnapshots` (Section 21.10), category-page "best sellers" listings. Materialized views are explicitly *derived* data (Section 2.3 philosophy) and are never the source of truth for any write path.

## 28.4 Read Replicas

Once traffic justifies it, all anonymous/browsing-path reads (homepage, category, search, product detail, public storefront) are routed to read replicas, isolating them from the transactional primary's write load (checkout, payment, order processing) — directly supporting the OLTP/read-heavy split in Section 2.4/2.5.

## 28.5 Batch Processing

Bulk operations (bulk product import for Small Creative Studios, Section 3; bulk notification fan-out; scheduled Payout batch processing, Section 14.5) are processed in chunked batches with backoff, never as a single unbounded transaction, to avoid long-held locks on hot tables like `Inventory` and `Order`.

## 28.6 Background Jobs

The following are explicitly designed as asynchronous background jobs, not synchronous request-path work: aggregate counter recomputation (Section 2.3); `SearchIndex` rebuilding (Section 24.1); `Media` thumbnail/transformation generation (Section 22.4/22.5); `Notification` channel fan-out (Section 17); `LowStockAlert` generation (Section 9.4); `ProductRecommendation`/search `Recommendations` recomputation (Sections 8.18, 24.7); `Reservation`/`Cart`/`CheckoutSession` expiry cleanup (Sections 9.3, 12.1, 12.4); `Order.grand_total` reconciliation against `SubOrder` totals (Section 26.5); archiving of aged data per the retention policy (Section 2.16); `Media` garbage collection (Section 25.1).

## 28.7 Connection Pooling

Given the Next.js/Vercel serverless deployment model (many short-lived function invocations), all database access goes through Supabase's connection pooler (PgBouncer-based) rather than direct long-lived connections per invocation, to avoid exhausting Postgres's connection limit under concurrent serverless load.

## 28.8 Future Scaling

The combination of read replicas (28.4), partitioning (Section 2.8), and the sharding-ready ID/ownership model (Section 2.7/2.9) gives a defined, non-disruptive path from "single primary handles everything" to "primary handles writes, replicas handle reads, hot tables are partitioned, and (if ever necessary) store-scoped data is sharded" — each step is additive infrastructure, not a schema rewrite.

---

# 29. Security Strategy

## 29.1 Encryption

- **In transit:** all client-database and service-to-service traffic is encrypted (TLS), standard for the Supabase/Vercel stack.
- **At rest:** Supabase Postgres provides encryption at rest by default for the full database. Beyond that platform-level baseline, specific highly sensitive fields (Creator tax identifiers, Section 7.1; MFA secrets, Section 5.9) are additionally application-layer encrypted (envelope encryption) so that even a raw database dump/backup does not expose them in plaintext — a defense-in-depth measure beyond the storage-level baseline.
- **Secrets:** raw payment credentials (card numbers, CVVs) are never stored anywhere in the Dreams by Kalakaaar database, full stop — only processor tokens (Section 11.5, 14.2). Authentication secrets (passwords, refresh tokens, MFA backup codes) are always stored hashed, never encrypted-and-reversible, since they should never need to be read back in plaintext.

## 29.2 PII

Personally identifiable information is concentrated in a known, minimal set of tables (`User`, `UserProfile`, `Address`, `Creator`'s legal/tax fields, `Payment`'s billing-adjacent fields) rather than scattered — a deliberate consequence of the normalization strategy (Section 2.2) — which makes PII auditing, access-control review, and erasure-request fulfillment (Section 29.4) tractable rather than requiring a database-wide audit.

## 29.3 Financial Data

Financial entities (Payment, Transaction, Settlement, Payout, Commission, Refund, Dispute, Ledger, AccountingEntry) are the most conservatively modeled in the schema: append-only wherever possible (Section 2.15), Restrict-only cascade behavior (Section 4.5), longest retention tier (Section 2.16), and RLS policies scoped so that a Creator can only ever see their own Store's financial rows, and a Buyer only their own.

## 29.4 GDPR Readiness

Even though V2 initially targets a defined core market (00-project-vision.md Section 24), the schema is built GDPR-ready from day one rather than retrofitted later, because retrofitting privacy architecture into a live commerce database is materially harder than building it in:
- **Right to access:** PII concentration (Section 29.2) makes "export everything about this user" a bounded, well-defined query.
- **Right to erasure:** soft-delete-by-default (Section 2.13) plus the documented hard-delete exception path (a verified erasure request triggers hard deletion of genuinely personal fields while financial/legal records are retained with PII minimized — e.g., an `Order`'s buyer reference can be anonymized to a placeholder while the transaction record itself, required for tax retention, remains).
- **Right to rectification:** standard field updates; version history (Section 2.14) is retained for legitimate business/legal reasons and is not itself considered a rectification obstacle.
- **Data minimization:** each entity's attribute list (Sections 5–24) was scoped to what the corresponding UI screens (07-ui-screens-wireframes.md) and business rules (01-product-requirements.md Section 7) actually require — no speculative "just in case" personal fields.
- **Consent tracking:** `PrivacyPreferences` (Section 11.10) and `LegalDocument` acceptance tracking (Section 20.7) give an auditable consent trail.

## 29.5 Audit

Section 23's `AuditLog`, combined with domain-specific history tables throughout this document, gives complete after-the-fact visibility into "who accessed/changed what," a core requirement for both security incident response and regulatory audit requests.

## 29.6 Retention

Governed centrally by Section 2.16's per-data-category retention table, applied consistently across all domains rather than each domain inventing its own retention rule.

## 29.7 Backups

Standard practice for the chosen stack: continuous/point-in-time-recovery backups via Supabase's managed Postgres backup capability, with backup encryption inheriting the same at-rest encryption posture as the primary database (Section 29.1). Backup retention windows are configured to meet or exceed the shortest operationally-relevant retention period in Section 2.16 (i.e., long enough to recover from an incident discovered weeks later, not just an immediate rollback).

## 29.8 Disaster Recovery

The read-replica architecture (Section 28.4) doubles as a disaster-recovery asset (a replica can be promoted to primary); combined with point-in-time-recovery backups (29.7), the platform's data-layer DR posture supports both a fast failover path (replica promotion, for infrastructure failure) and a point-in-time restore path (for logical/application-level data corruption, which replica promotion alone cannot fix since replicas mirror corruption too).


---

# 30. Future Expansion

The schema in this document is deliberately shaped so that each of the following V3+ directions (00-project-vision.md Sections 25–26) is an **additive extension**, not a redesign:

| Future capability | Extension path already present in this schema |
|---|---|
| AI Recommendations | `ProductRecommendation` (8.18) and search `Recommendations` (24.7) already model a `recommendation_type` dimension; an `ai_similarity` type slots in without a schema change. |
| AI Search | `SearchIndex` (24.1) already isolates a searchable-document read-model; adding a `pgvector` embedding column is additive (Section 24.8). |
| AI Product Description / Image Enhancement | `ProductVersion` (8.15) and `Media.Transformation` (22.5) already track authorship/provenance of content changes; an "AI-generated" author/transformation-type value is additive. |
| AR Products | `ProductMedia` (8.3) already supports a `media_type` dimension; a future `3d_model`/`ar_asset` type is additive, alongside a corresponding `Media` type. |
| Wholesale / Corporate Buyers | `ResourcePermission` (6.5) and the Order/Payment domains' store-scoped, quantity-based modeling already generalize to bulk/negotiated pricing without core restructuring; a future `WholesalePriceTier` entity would attach to `Product`/`ProductVariant` additively. |
| Subscriptions | `Order`'s independence from `Cart`/`CheckoutSession` as the durable record means a future `SubscriptionPlan` entity can generate recurring `Order`s programmatically without changing how `Order` itself is structured. |
| Digital Products | `Product.product_type` (8.1) already anticipates a `digital` value; fulfillment for digital goods would introduce a `DigitalDelivery` entity referencing `Media`/`StorageLocation` (22) rather than `Shipment` (13.7). |
| International Sellers / Multi-Currency | `Payment.currency` and `TaxCalculation.jurisdiction` (12.9, 14.1) are already modeled as explicit fields, not assumed-single-currency; `StorePolicy` (7.4) already supports jurisdiction-specific content via versioning. |
| Marketplace Federation | The `store_id`-centric ownership model (Section 2.9) and logical (not physical) multi-tenancy (Guiding Principle 6) mean a future federated/white-label marketplace instance is a routing and RLS-policy concern layered on the existing schema, not a new data model. |

---

# 31. Database Review Checklist

Before this document is considered final and ready to seed ORM/migration work, it should be reviewed against:

- [ ] **Completeness** — every functional module in 01-product-requirements.md Section 4 maps to at least one entity in this document.
- [ ] **Normalization** — every OLTP entity is verified against 3NF (Section 2.2); every denormalization is justified and documented (Section 2.3).
- [ ] **Performance** — every screen in 07-ui-screens-wireframes.md has an identifiable, efficient query path against the indexing strategy (Section 27).
- [ ] **Security** — every PII-bearing and financial entity has a documented encryption, access-control, and retention posture (Section 29).
- [ ] **Scalability** — every high-volume entity has a documented partitioning/archiving path (Sections 2.8, 2.12).
- [ ] **Integrity** — every relationship has a documented cascade/deletion rule (Section 4.5, Section 25).
- [ ] **Maintainability** — every entity has exactly one owning domain (Guiding Principle 2); no ambiguous shared ownership remains.
- [ ] **Extensibility** — every Section 30 future direction has a credible, additive extension path with no identified need for a breaking schema change.
- [ ] **Analytics** — every domain's key business questions are answerable from the Analytics domain (Section 21) without querying production OLTP tables directly.
- [ ] **Compliance** — GDPR-readiness (Section 29.4) and financial retention (Section 2.16) requirements are met for the platform's initial target jurisdiction(s).

---

# 32. Key Insights

## 32.1 Top Database Design Insights

1. Identity and role are deliberately separate domains — one `User` can be buyer, creator, and (rarely) staff without duplicate identity records.
2. Every entity has exactly one owning domain — ambiguous shared ownership (like a single "Settings" table) is a design smell this schema explicitly avoids.
3. Marketplace commerce is fundamentally multi-party — `SubOrder` exists specifically because a single buyer checkout can span many creators.
4. Snapshotting (denormalized copies at time of action) is how commerce systems stay historically accurate despite live catalog data changing constantly.
5. Append-only history tables are cheaper to reason about than "just add an updated_at column" — they answer "what changed and why," not just "what is it now."
6. Soft delete is the default; hard delete is the deliberate exception, reserved for ephemeral, non-authoritative data.
7. Polymorphic references (moderation subjects, audit targets) are honestly documented as an application-enforced integrity trade-off, not hidden behind false foreign-key confidence.
8. A schema's job is to make "impossible states impossible" wherever a database constraint can do that job better than application code.
9. UUIDs everywhere remove an entire category of future migration pain around ID exposure and sharding.
10. Customization is modeled separately from product variants because buyer-supplied content and pre-defined SKU dimensions have different validation and storage needs.
11. Inventory as a ledger (not just a mutable counter) is what makes disputes and stock reconciliation possible after the fact.
12. Reviews are gated on verified purchase at the schema level (a real foreign-key-backed constraint concept), not just a UI checkbox.
13. Media is its own domain because five different "image implementations" across features is a common and avoidable anti-pattern.
14. Analytics is read-only and asynchronous by design so dashboards can never slow down checkout.
15. Search is a derived read-model, never the source of truth, so ranking/infrastructure can evolve independently of catalog data.
16. Money-movement entities (Payment, Payout, Ledger) are the most conservatively modeled tables in the entire schema, and rightly so.
17. Every "exactly one" business rule (default address, primary image, single reply) is called out explicitly rather than left as an implicit assumption.
18. A documentation-first database design forces the question "which domain owns this" before code makes an arbitrary, hard-to-reverse choice.
19. Versioning content (products, policies, legal documents) is what lets a marketplace answer "what did the buyer see" months later.
20. The schema treats trust (verification, moderation, disputes) as first-class data, not an afterthought bolted onto a generic e-commerce schema.
21. Store-level ownership is the natural, forward-compatible tenant boundary for a creator marketplace.
22. Separating `Cart`/`CheckoutSession` (ephemeral) from `Order` (durable) avoids ever having "almost-orders" pollute reporting.
23. A `Reservation` layer prevents oversell without prematurely committing inventory before payment succeeds.
24. Commission is its own entity (not a Store-level percentage field) because rates change over time and history must be precise.
25. GDPR-readiness is dramatically cheaper to build in from the start than to retrofit into a live commerce schema.
26. A well-designed schema documents *why*, not just *what* — every table in this document answers "why does this exist" before "what columns does it have."
27. Normalize by default, denormalize by measured necessity — never the reverse.
28. Domain boundaries in the schema should mirror the org's eventual team boundaries (catalog, commerce, trust & safety, growth) so ownership stays clear as the team grows.
29. The best schema for a marketplace is one where "who gets paid, how much, and why" can always be reconstructed from first principles.
30. A schema built for millions of rows from day one costs little more to design than one built for thousands — and saves a rewrite later.

## 32.2 Top Scalability Insights

1. UUID primary keys remove the single biggest historical blocker to future sharding.
2. Read replicas solve the platform's actual dominant load pattern (browsing) before anything more exotic is needed.
3. Time-ordered, append-only tables are partition-ready by construction, not by retrofit.
4. `store_id` is the natural, already-present shard key for a creator marketplace — no artificial tenant ID needed.
5. Denormalized aggregate counters remove the single most common source of "SELECT COUNT(*) at scale" pain.
6. Materialized views defer expensive aggregation cost to a schedule, not the request path.
7. Keeping analytics fully decoupled from OLTP protects checkout latency as reporting complexity grows.
8. Logical multi-tenancy (shared tables + RLS) is dramatically cheaper to operate at V2 scale than database-per-tenant, while preserving a later path to physical isolation.
9. Background jobs, not synchronous request-path work, absorb nearly all non-critical-path write amplification (search indexing, notification fan-out, thumbnailing).
10. Connection pooling is a first-class scalability concern the moment a serverless deployment model is chosen.
11. Batch, chunked processing prevents any single bulk operation from becoming a platform-wide lock contention event.
12. A schema that never requires cross-shard joins for its most common queries is a schema that can actually be sharded later.
13. Caching layers closest to the user (CDN) absorb the most traffic for the least database cost.
14. Keyset pagination scales where offset pagination silently degrades.
15. Archiving old, cold data out of hot tables keeps indexes small and fast for the data that's actually queried often.
16. Partial indexes on "active only" subsets dramatically reduce index bloat on tables dominated by terminal-state rows.
17. Reservation-based inventory holds prevent oversell without the cost of pessimistic locking across the whole checkout flow.
18. A ledger-based accounting model scales to reconciliation and audit needs that a single "balance" field never could.
19. Isolating Search as its own derived domain means scaling search infrastructure never requires touching commerce tables.
20. Designing for "millions" from day one is mostly about *habits* (indexing, denormalization discipline, async jobs) more than exotic technology.
21. A conservative single-primary-Postgres launch is itself a scalability decision — it defers complexity until traffic actually demands it.
22. Media garbage collection by reference-counting keeps storage costs proportional to actual use, not upload history.
23. Payout batching (rather than per-order payout) keeps the platform's highest-stakes financial writes infrequent and reviewable.
24. Versioned content tables scale review/dispute resolution without scaling storage unreasonably, since versions are only written on meaningful edits.
25. FeatureFlagAccess and Experiment tables let the platform scale *rollout risk* management, not just data volume.
26. A schema that separates "current state" from "history" scales query performance on the hot path (current state) independently of audit-depth requirements (history).
27. Composite indexes ordered around real query shape scale far better than a large number of single-column indexes.
28. GIN/trigram search indexes scale discovery without needing a second search infrastructure until genuinely necessary.
29. Range-type columns (GiST-indexed) scale availability/date-based queries far better than manual date-pair comparisons.
30. The clearest sign of a scalable schema is that "add a read replica" or "add a partition" are the answers to growth, not "redesign the tables."

## 32.3 Top Performance Insights

1. The dominant traffic pattern (browsing) should shape indexing priorities more than the dominant business-value pattern (checkout).
2. Denormalized snapshots on `OrderItem`/`CartItem` avoid an expensive join on every cart/order render.
3. Aggregate counters computed asynchronously avoid `COUNT()`/`AVG()` on every product-card render.
4. Short, narrowly-scoped write transactions minimize lock contention during demand spikes.
5. Row-level locking on a single `ProductVariant`'s inventory (never the whole `Product`/`Store`) prevents unrelated operations from blocking each other.
6. Full-text GIN indexes make Postgres-native search fast enough to avoid a second search system at V2 scale.
7. Materialized views make expensive dashboard aggregation feel instant to the person viewing it.
8. Keyset pagination keeps deep-page performance constant instead of degrading with page depth.
9. Composite indexes matched to actual filter+sort query shapes avoid unnecessary sort steps.
10. Isolating analytics reads from OLTP tables protects the checkout path's p99 latency from reporting query variance.
11. Connection pooling prevents serverless function concurrency from exhausting Postgres's connection ceiling.
12. Async background jobs for thumbnailing/search-indexing/notification-fan-out keep the synchronous request path fast and predictable.
13. Partial indexes on active-only rows reduce the working-set size the query planner has to consider for the most common queries.
14. Reservation-based inventory checks are O(1) reads against a denormalized quantity, not an on-the-fly ledger sum.
15. CDN-cached public pages remove the database from the request path entirely for anonymous browsing traffic.
16. Batch/chunked bulk operations avoid the tail-latency spikes a single giant transaction would cause for concurrent users.
17. Read replicas isolate expensive analytical/admin queries from transactional latency-sensitive queries.
18. Range-type (GiST) indexes make availability-calendar overlap checks fast without manual date-math query plans.
19. A well-scoped `SearchIndex` document avoids the N-table-join-per-search-query anti-pattern.
20. Time-ordered UUIDs (where used, e.g., UUIDv7 for high-volume append tables) preserve index locality that random UUIDs would otherwise fragment.
21. Materialized aggregate rollups (`StoreAnalytics`, `ProductAnalytics`) are computed once per period and read many times, the ideal cache-friendly access pattern.
22. Reconciliation jobs (Section 26.5/28.6) catch drift without requiring every write path to carry expensive real-time cross-table validation.
23. Table partitioning (once volume warrants it) keeps individual index sizes bounded, preserving query performance as historical data accumulates.
24. Garbage-collected `Media` (reference-counted) keeps storage-layer performance from degrading under years of orphaned uploads.
25. Explicit `EXPLAIN ANALYZE` review discipline (Section 28.1) catches performance regressions before they reach production traffic.
26. Denormalizing "current inventory quantity" while retaining the ledger gives both fast reads and fully auditable writes.
27. Short-TTL, narrowly-scoped Reservation locks (Section 9.8's future evolution) prevent flash-sale-style contention from degrading the whole platform.
28. Search autocomplete precomputation avoids running full-text queries on every keystroke.
29. Isolating high-write-volume event tables (`Events`, `AuditLog`) from low-write-volume reference tables prevents unrelated write load from competing for the same table's cache pages.
30. Performance is a design decision made at schema time (what to denormalize, what to index, what to make async), not a problem to solve after launch.

## 32.4 Top Security Insights

1. Raw payment credentials never touch the platform's database — only processor tokens.
2. Passwords, refresh tokens, and MFA backup codes are hashed, never stored reversibly.
3. Sensitive fields beyond the platform-level encryption baseline (tax IDs, MFA secrets) get application-layer envelope encryption as defense-in-depth.
4. Row-Level Security enforces multi-tenant isolation at the database layer, not only in application code.
5. PII concentration in a small, known set of tables makes access review and erasure requests tractable.
6. Append-only audit tables mean a compromised account's actions are still fully reconstructable after the fact.
7. Every permission grant/revocation is itself an audited event (`PermissionAudit`), not a silent row update.
8. RBAC-by-default with a documented ABAC extension seam avoids both premature complexity and a future dead-end.
9. Refresh-token rotation lineage tracking detects token-reuse attacks, a standard and important security control.
10. Rate-limit-relevant attempt counters (verification tokens, password resets) are modeled at the schema level, not left to be an afterthought.
11. Financial data gets the platform's most conservative cascade (Restrict) and longest retention, appropriately reflecting its risk profile.
12. `SecurityEvent` and `LoginHistory` are durable and separate from ephemeral `Session`, so security review survives session expiry.
13. Soft-delete-by-default means a compromised or malicious deletion attempt is recoverable, not destructive.
14. GDPR-readiness designed in from day one avoids the far more dangerous alternative: retrofitting privacy controls into a live, populated commerce database.
15. Moderation's `AuditTrail` gets the longest retention tier alongside financial records, reflecting its potential legal relevance.
16. Polymorphic references are honestly flagged as an application-enforced trust boundary rather than falsely presented as database-guaranteed.
17. `ResourcePermission`'s temporary/expiring grants avoid permanent over-provisioning of elevated access for one-off support cases.
18. Backups inherit the same encryption posture as the primary database — a backup is not a security blind spot.
19. Disaster recovery planning explicitly distinguishes replica-promotion (infra failure) from point-in-time restore (logical corruption), since they solve different failure modes.
20. Verification (`StoreVerification`) is modeled with an expiry, so trust signals don't silently become stale and unearned.
21. Device/session trust (`TrustedDevices`) is time-boxed and revocable, not a permanent bypass of MFA.
22. Business-critical "one active login method" and "one default address" rules are enforced even though they cross rows, via explicit application-layer contracts documented here, not left implicit.
23. A `Dispute` (external processor-level) is modeled distinctly from an internal `RefundRequest`, since their evidence and deadline requirements genuinely differ.
24. Ban vs. Suspension are modeled as distinct entities because their reversal semantics and downstream effects genuinely differ — conflating them would create ambiguity at the exact moment precision matters most.
25. `Violation` accumulation supports escalating-consequence policy without requiring ad hoc cross-case queries.
26. Creator tax/legal identifiers are isolated to the `Creator` entity, not scattered across `Store`/`Payout`, minimizing the surface area needing the highest protection tier.
27. `APIUsage` logging is a security asset (abuse detection) in addition to a future billing asset (Section 30).
28. Every entity touching money or trust has a named actor field on its history/audit row — "the system" is an explicit, auditable actor, never an unattributed gap.
29. Security event severity classification (`SecurityEvent.severity`) enables real-time alerting to be layered on top of the same durable audit data used for after-the-fact review.
30. Security is treated as a property of the schema's shape (what's encrypted, what's isolated, what's auditable) as much as a property of the application code running on top of it.

## 32.5 Top Marketplace Insights

1. `SubOrder` is the single most important marketplace-specific modeling decision — commerce logic that assumes "one seller per order" breaks the moment a buyer's cart spans two creators.
2. Store-level ownership, not Creator-level, is the correct anchor for nearly all marketplace data, since a Creator may (eventually) run more than one Store.
3. Commission-as-its-own-entity lets rate changes happen without ever corrupting historical order economics.
4. Payout batching per Store reflects how creators actually think about their earnings — as a business, not a per-transaction trickle.
5. `StoreVerification` operationalizes "trust by design" as literal, queryable data, not a marketing claim.
6. Made-to-order and stocked inventory are different enough (capacity vs. quantity) to warrant genuinely different entities (`ProductionCapacity`/`AvailabilityCalendar` vs. `Inventory`).
7. Customization is decoupled from variant selection because buyer-authored content (engraving text) and creator-defined SKU dimensions (size/color) have fundamentally different validation needs.
8. Review eligibility gated on verified purchase is what makes the platform's trust signal meaningfully different from an open, ungated review system.
9. `StoreTeam` and store-scoped roles (Section 6.4) reflect that Small Creative Studios are a distinct persona with distinct data needs from solo Independent Artisans.
10. Product-level and Store-level disclosure/policy content (Sections 8.11, 7.4) directly operationalize the "Authenticity First" core value as structured, versioned data.
11. `GiftMessage`/`GiftHistory` reflect that gifting is a first-class buyer journey, not a checkout afterthought (00-project-vision.md's "Meaningful Gift Buyers" persona).
12. Curated `Collection`/`GiftGuide` entities operationalize "Quality Over Quantity" as an actual editorial data model, not just a stated value.
13. `ProductApproval` as an append-only, re-triggerable review history reflects that curation is ongoing, not a one-time gate.
14. Creator-facing `StoreAnalytics`/`ProductAnalytics` vs. admin-facing `SalesAnalytics`/`CreatorAnalytics` reflects that the same underlying events serve two audiences with very different privacy/scope boundaries.
15. `StoreAnnouncement` and `StoreSettings.vacation_mode` reflect that solo makers have real-life availability constraints a generic e-commerce schema often ignores.
16. `Backorder` vs. made-to-order being distinct concepts reflects two genuinely different buyer expectations that a single "out of stock" flag would conflate.
17. `Exchange` as its own entity (not just a Return + new Order) reflects how buyers actually think about a straightforward size swap.
18. `OrderCommunication` linking Messaging to Order context means support and creators never lose the thread when investigating an issue.
19. `CreatorReply`'s one-reply-per-review constraint keeps review threads readable while still giving creators a voice.
20. `LowStockAlert` and `ProductionCapacity` reflect that solo/small creators need proactive signals a large retailer's ops team would otherwise provide manually.
21. Aggregated `wishlist_count`/`units_sold` feed both buyer-facing social proof and creator-facing demand signals from the same underlying data.
22. `StoreInvitation` models team growth as a real workflow (pending/accepted/declined), not just an instant add.
23. The Commission/Payout split cleanly separates "what the platform earns" from "what the creator is owed," which is foundational to marketplace trust.
24. `Dispute` handling being modeled distinctly from platform-internal refunds acknowledges that payment processors, not just the platform, are a party to some conflicts.
25. `ModerationCase`'s unified queue across Product/Store/Review/Message reflects that trust-and-safety work is fundamentally cross-cutting, not per-feature.
26. Occasion/Festival modeling operationalizes seasonal, gifting-driven demand as first-class discovery data.
27. `ProductDisclosure` requirements varying per category reflect that "authenticity" means different things for jewelry vs. wall art vs. custom apparel.
28. A creator's tax/legal identity (`Creator`) being separate from their public brand (`Store`) reflects that legal accountability and public identity are related but distinct concerns.
29. Verified-purchase `MediaReview` photos directly counter the "authenticity uncertainty" problem named in 00-project-vision.md.
30. Every marketplace-specific entity in this schema traces back to a named problem or persona in 00–02, not a generic e-commerce template — that traceability is itself the strongest signal the schema fits the actual business.

## 32.6 Top Engineering Insights

1. A documentation-first database design forces domain-ownership decisions before code makes them implicitly and irreversibly.
2. Every entity's "why" should be answerable in one sentence before its attributes are even discussed.
3. Consistent per-entity documentation shape (Purpose, Attributes, Relationships, Lifecycle, Indexes, Constraints) makes a 150-entity schema navigable rather than overwhelming.
4. Explicitly naming denormalization decisions (and their source of truth) prevents "which table is actually correct" ambiguity six months into implementation.
5. A cascade philosophy defined once (Section 4.5) and applied consistently is far more maintainable than ad hoc per-table decisions.
6. Treating audit/history as a first-class modeling concern, not an afterthought, avoids painful retrofits when the first dispute or compliance request arrives.
7. Keeping Analytics strictly read-only and asynchronous is an architectural guardrail, not just a performance optimization.
8. A schema document that references the product requirements it satisfies is easier to review for completeness than one presented in isolation.
9. Explicitly documenting "future extension path" per entity turns future-proofing from a vague aspiration into a checkable claim (Section 30).
10. Consistent ID strategy (UUIDs everywhere) removes an entire category of "which ID type does this table use" bugs.
11. A single canonical `User` table, with role layered on top, avoids the common and painful anti-pattern of per-role identity tables that inevitably drift.
12. Separating ephemeral (Cart/Checkout) from durable (Order) data by domain, not just by table name, keeps the mental model clean for every engineer who touches checkout code.
13. A documented database review checklist (Section 31) turns "is this schema done" into an answerable question, not a feeling.
14. Writing "why not" alternatives alongside every major decision (Section 2) preserves institutional memory that would otherwise be lost the first time someone questions the choice.
15. Isolating Media as its own domain avoids the common anti-pattern of every feature reinventing image handling slightly differently.
16. A schema is a form of documentation — future engineers will read table/column intent long before they read this document, so consistency between the two matters.
17. Business rules that span multiple rows (Section 26.5) should be named explicitly, even when enforced at the application layer, so they're never "discovered" the hard way.
18. Keeping a domain's boundary aligned with a plausible future team boundary (catalog team, commerce team, trust & safety team) pays off as the org grows.
19. A logical/physical separation of concerns (this document vs. eventual Drizzle schema) keeps architecture decisions reviewable independent of ORM syntax debates.
20. Naming things consistently (Store vs. Creator, Order vs. SubOrder) across the whole schema reduces the cognitive load of context-switching between domains.
21. Explicitly stating what's *out of scope* for this document (SQL, ORM code, exact types) keeps its purpose sharp and prevents scope creep into premature implementation detail.
22. A schema that can explain its own trade-offs (Section 2.3's denormalization table) is one that can be safely modified later by someone who wasn't in the original design conversation.
23. Treating soft-delete, versioning, and audit as platform-wide *philosophies* (Section 2) rather than per-table decisions keeps the whole schema internally consistent.
24. Documenting index *intent* rather than exact syntax gives implementation flexibility while still capturing the reasoning that would otherwise be lost.
25. A well-organized 26-domain structure scales as a mental model even as the number of individual entities grows into the hundreds.
26. Explicit "what happens on future migration" language for polymorphic references and reconciliation jobs de-risks a known weak point in relational schema design.
27. Writing this document before any ORM model exists is itself a forcing function against premature, code-driven schema decisions.
28. A schema aligned tightly to real user personas and journeys (02–03) is easier to validate for completeness than one designed from abstract commerce theory alone.
29. Reviewing a schema against a named checklist (Section 31) before implementation catches gaps that are far cheaper to fix on paper than in a live migration.
30. The best database architecture document is one a new engineer could use, on their first day, to correctly guess how a not-yet-built feature should be modeled.

## 32.7 Top Future-Proofing Insights

1. A `product_type` dimension on `Product` (physical, made-to-order, digital [future]) avoids a schema-splitting decision later.
2. `ProductRecommendation.recommendation_type` already anticipates AI-driven scoring as an additive value, not a new table.
3. `SearchIndex` is structured so a vector-embedding column is additive, not a search-infrastructure migration.
4. Explicit `currency` and `jurisdiction` fields (rather than assumed single-currency/single-market) mean internationalization is a data-population problem later, not a schema problem.
5. `store_id`-centric ownership is already the natural boundary for a future federated/white-label marketplace.
6. `ResourcePermission` is a deliberate seam for future ABAC without disturbing the RBAC core.
7. UUID primary keys mean future horizontal sharding never collides with legacy sequential IDs.
8. Time-ordered, append-only tables are already partition-ready, so scaling writes later is an operational change, not a redesign.
9. `Creator`-to-`Store` modeled as one-to-many (even though V2 may launch one-store-per-creator) avoids a breaking migration when multi-store creators arrive.
10. `ProductionCapacity`/`AvailabilityCalendar` already generalize toward future subscription-style recurring commitments.
11. Versioned `LegalDocument`/`StorePolicy` entities are ready for future multi-jurisdiction legal content without restructuring.
12. The Media domain's `Transformation` entity already anticipates future AI image-enhancement pipelines as just another transformation type.
13. `FeatureFlagAccess` and `Experiment` entities mean future feature rollouts have a data model ready before the first experiment is even designed.
14. Analytics being fully decoupled from OLTP means a future data-warehouse/CDC pipeline is an addition, not a re-architecture.
15. The explicit Search/Analytics domain split anticipates that these two areas will scale and specialize fastest, and isolates that churn from commerce-critical tables.
16. `APIUsage` tracking, present from day one, is ready to support a future public/partner API and its billing model without new instrumentation.
17. Logical multi-tenancy today preserves an explicit, named path to physical tenant isolation for future enterprise/B2B customers (Section 30).
18. `Ledger`/`AccountingEntry` double-entry-style modeling is ready to absorb multi-currency accounting complexity without restructuring.
19. The clean separation between `RefundRequest` (platform) and `Dispute` (processor) anticipates future multi-processor or multi-region payment expansion.
20. `GiftHistory`/`GiftMessage` are structured to extend naturally into a future formal Gift Registry feature (00-project-vision.md Section 26) without new foundational tables.
21. `Collection`/`GiftGuide` curated-content modeling anticipates AI-assisted or rule-based dynamic collections as an additive curation_type value.
22. The `Occasion`/`Festival` entities anticipate B2B/corporate gifting expansion (bulk orders tied to a business occasion) without new taxonomy tables.
23. Wholesale pricing is anticipated by the variant/price model already supporting per-context pricing, needing only an additive price-tier entity.
24. `NotificationTemplate` versioning already anticipates future multi-language templates as an additive locale dimension.
25. `StoreTeam`/store-scoped roles already anticipate larger creative studios and, eventually, enterprise/brand-group team structures.
26. The clean domain boundary between Moderation and Support anticipates these teams scaling independently (trust & safety vs. customer service) as the org grows.
27. `DashboardSnapshots` as a generic, keyed snapshot table anticipates many future internal dashboards without a new table per dashboard.
28. The consistent (entity_type, entity_id) polymorphic-reference pattern used across Moderation, Audit, CMS, and Navigation means any *new* domain needing a similar polymorphic reference already has a proven, consistent pattern to follow.
29. Every domain in Section 3 is scoped narrowly enough that a genuinely new future domain (e.g., a "Subscriptions" domain) can be added to the list without requiring any existing domain to be restructured.
30. The strongest future-proofing insight of all: this schema was designed to make *the next unknown feature* easy to place, not just the currently-known roadmap — because the true test of a marketplace database is how gracefully it absorbs the feature nobody has thought of yet.

---

*This document is the definitive database architecture reference for Dreams by Kalakaaar v2. No Drizzle ORM model, Supabase Postgres migration, or Row-Level Security policy should be written without first tracing its shape back to a decision documented here. Where an implementation need arises that this document does not yet cover, this document must be updated first — the database design leads, the code follows.*
