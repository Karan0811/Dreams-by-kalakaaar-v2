# 12 · Security Architecture — Dreams by Kalakaaar v2

**Document owner:** Principal Security Architect
**Status:** Draft for review — implementation-ready
**Audience:** Backend Engineering, Frontend Engineering, DevOps, Security, QA, Future team members
**Depends on:** `00-project-vision.md` through `11-frontend-architecture.md`, in full
**Precedes:** All implementation — no authentication flow, database policy, API route, integration, or deployment configuration is built without tracing back to a decision recorded here.

This document defines security architecture only. It contains no application code, no policy syntax, no configuration file contents. Its purpose is to be the single reference from which every trust decision the platform makes — who is allowed to do what, to which data, under what conditions, with what evidence left behind — is derived.

---

# 1. Introduction

### 1.1 Purpose

`08-database-design.md` defines what data exists. `09-api-architecture.md` defines how it is exposed. `10-backend-architecture.md` defines how it is served. `11-frontend-architecture.md` defines how it is consumed. This document defines the one property that must hold true across all four regardless of who is asking: **no request, from any client, in any role, ever obtains data or effects it is not entitled to — and every request that tries leaves a record.**

Security is not a layer bolted onto this architecture. It is the set of guarantees the rest of the architecture was already designed to make possible — `10-backend-architecture.md` Section 1.7's "the backend is the only trust boundary" principle, `09-api-architecture.md` Section 22's platform-wide security rules, and `08-database-design.md` Section 29's data-protection posture are the raw material this document assembles into one coherent, implementation-ready security architecture.

### 1.2 Scope

In scope: identity and authentication, authorization and RBAC, session and token architecture, API and input security, browser and frontend security, backend and infrastructure security, file and storage security, encryption and key management, secrets management, privacy and regulatory compliance, monitoring and audit, payment and third-party integration security, CI/CD and supply-chain security, backup and disaster recovery, incident response, vulnerability management, and security testing.

Out of scope: application code and configuration syntax; a specific penetration-testing vendor or tool selection (Section 28 states the requirement, not the vendor); infrastructure provisioning detail (owned, per `10-backend-architecture.md` Section 1.2, by a future infrastructure-operations document, if warranted).

### 1.3 Audience

Every engineer who writes a Route Handler, Server Action, Service Layer function, Inngest job, or frontend component; every engineer who configures a third-party integration; DevOps and platform engineering; QA; and every future engineer who needs to understand not just what the security rules are, but why each one exists and what breaks if it is skipped.

### 1.4 Objectives

1. State the platform's security philosophy once, precisely, so every subsequent section is an application of it rather than an independent judgment call.
2. Define the platform's threat model and trust boundaries explicitly, so "is this actually a risk here" is answered by reference to a documented model, not by intuition per engineer.
3. Specify identity, authorization, session, and API security architecture concretely enough that `10-backend-architecture.md` Section 20's summary treatment is fully expanded here into an implementable specification.
4. Close every gap `09-api-architecture.md` and `10-backend-architecture.md` left open specifically for this document to resolve: MFA readiness, detailed encryption/key-management architecture, GDPR-class privacy mechanics, incident response process, and the full OWASP Top 10 compliance mapping.
5. Give every engineer a security review checklist (Section 30) equivalent in authority to `10-backend-architecture.md` Section 28's architecture checklist — nothing ships without passing both.

### 1.5 Relationship to Previous Documents

| Document | What This Document Inherits and Extends |
|---|---|
| `00-project-vision.md` | Trust as the platform's core differentiator (Section 12) — security is that promise's technical foundation. |
| `01-product-requirements.md` | The role model (Section 3) this document's authorization architecture (Section 6) enforces. |
| `08-database-design.md` | Section 29's data-protection posture, Section 6's RBAC/ABAC data model, Section 23's audit tables — this document specifies how those are enforced and operated, not what they are. |
| `09-api-architecture.md` | Section 22's platform-wide API security rules, Section 21's webhook contract, Section 23's error taxonomy — this document is the full architecture those sections summarized. |
| `10-backend-architecture.md` | Section 20's security-architecture summary, Section 7–8's auth/authz implementation, Section 17.6's secrets handling — this document is the authoritative, expanded version of all of it. |
| `11-frontend-architecture.md` | Section 21's frontend security posture (BFF pattern, token handling, CSP) — this document confirms and extends it from the platform's side of the trust boundary. |

### 1.6 How This Document Is Used

Before any new module, endpoint, integration, or infrastructure change ships, it is checked against the relevant section(s) of this document and, at minimum, Section 30's review checklist. Where an implementation need arises that this document does not yet cover, this document is updated first — consistent with every document preceding it in this series.

---

# 2. Security Philosophy

### 2.1 Zero Trust Architecture

No request is trusted by virtue of its origin. A request from the Admin Panel is not inherently more trustworthy than a request from the public Buyer app — both are validated identically by the same pipeline (`10-backend-architecture.md` Section 6), and both are subject to the identical rule: **authentication proves identity; authorization is re-evaluated on every single request, never cached as a standing grant.** There is no network-position-based trust (no "requests from our own VPC are safe," no "internal service calls skip validation") — every Route Handler, Server Action, and Inngest job step re-verifies identity and permission at the point of use, per `10-backend-architecture.md` Section 2.9's statelessness principle applied specifically to trust: nothing about a caller's authorization is assumed to persist from a prior request.

This extends explicitly to service-to-service calls: an Inngest job calling back into a Route Handler, or one module's Service Layer calling another's (`10-backend-architecture.md` Section 3.6), carries and re-validates its own actor context rather than inheriting an ambient "this is internal, so it's trusted" exemption.

### 2.2 Defense in Depth

Every sensitive operation is protected by more than one independent control, so that a single control's failure does not become a full compromise. Concretely, three layers recur throughout this document:

1. **Application-layer authorization** (`10-backend-architecture.md` Sections 6.4, 8) — the primary, business-rule-aware control.
2. **Database-layer Row-Level Security** (`10-backend-architecture.md` Section 20.9) — a backstop that holds even if application logic has a bug.
3. **Network/platform-layer controls** (Section 18 — CSP, CORS, rate limiting, Vercel/Supabase platform hardening) — controls that reduce blast radius regardless of what happens in application code.

No section of this document treats a single control as sufficient for a genuinely sensitive operation (authentication, payment, data export, privilege escalation) — Section 30's checklist explicitly asks "what is the second control here" for any change touching those areas.

### 2.3 Least Privilege

Every role (`01-product-requirements.md` Section 3), every database connection (`10-backend-architecture.md` Section 20.9's RLS-scoped vs. service-role connections), every third-party API credential (Section 17), and every internal service (Inngest jobs, Section 5.4) is granted the minimum access it needs to perform its function, never a broader grant for convenience. A Support Executive's elevated access to a specific order (`10-backend-architecture.md` Section 8.9) is a narrow, time-bound, audited `ResourcePermission` grant, never a standing broadening of the Support role itself.

### 2.4 Secure by Default

Every new endpoint, table, and Redis key starts in its most restrictive state and is deliberately, explicitly opened up — never the reverse. `10-backend-architecture.md` Section 6.3 states this precisely for authentication ("the default posture is authentication required... never absent by omission"); this document applies the same default-deny posture to authorization scope, CORS origins (Section 11.3), RLS policies (Section 6.6), and outbound network access from server-side code (Section 9.5's SSRF controls).

### 2.5 Fail Closed

When a security control cannot complete its check — a Redis outage during rate-limit evaluation, a malformed JWT, an ambiguous ownership check — the system denies the request rather than allowing it through. This is a deliberate, explicit exception to `10-backend-architecture.md` Section 2.11's general fault-tolerance philosophy of graceful degradation: graceful degradation is correct for *availability* concerns (an analytics event that fails to send should not break checkout) and is explicitly wrong for *authorization* concerns (an authorization check that fails to complete must never be interpreted as "allow"). Every security-critical control in this document states its fail-closed behavior explicitly at the point it's defined.

### 2.6 Assume Breach

Architecture decisions throughout this document are made as if a component will eventually be compromised, not as if perfect prevention is achievable. This is why audit logging (Section 20) is comprehensive and tamper-resistant rather than "nice to have," why session/token lifetimes are short (Section 7), why encryption at rest exists even though the database itself has its own access controls (Section 16), and why incident response (Section 26) is a rehearsed process rather than an improvised one. The question this document repeatedly asks is not only "how do we prevent this," but "if this control fails, what is the blast radius, and how fast can we detect and contain it."

### 2.7 Security as a Product Feature

Consistent with `00-project-vision.md`'s framing of trust as the platform's core differentiator, security is treated with the same design rigor as any user-facing capability: it has an owner, a specification (this document), a review process (Section 30), and a quality bar — not a compliance checkbox completed once before launch and revisited only after an incident.

---

# 3. Threat Model

### 3.1 Methodology

This threat model follows a STRIDE-informed approach (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) applied to the platform's actual architecture (`10-backend-architecture.md` Section 3's request pipeline) rather than treated as an abstract exercise — every threat category below is mapped to the specific component it threatens and the specific section of this document that mitigates it.

### 3.2 Actors

| Actor | Motivation | Primary Targets |
|---|---|---|
| **Unauthenticated attacker** | Data theft, fraud, disruption | Public endpoints, authentication flows, payment flows |
| **Malicious or compromised buyer account** | Fraud (fake orders, chargebacks), abuse of other buyers/creators via messaging/reviews | Checkout, Payments, Reviews, Messaging |
| **Malicious or compromised creator account** | Fraudulent listings, payout fraud, data scraping of buyer information | Products, Payouts, Orders (own store scope) |
| **Malicious insider (internal role)** | Data exfiltration, unauthorized privilege use, sabotage | Admin/Moderator/Support surfaces, Audit Log itself |
| **Compromised third-party dependency** | Supply-chain compromise, credential theft | npm dependencies (Section 24.3), CI/CD pipeline (Section 24) |
| **Automated bot/scraper** | Catalog scraping, credential stuffing, inventory/price manipulation via rapid requests | Public catalog endpoints, Authentication endpoints |
| **Payment fraud actor** | Card testing, stolen-card usage, refund fraud | Checkout/Payment, Refund Requests |

### 3.3 Assets Ranked by Sensitivity

| Sensitivity Tier | Assets | Governing Sections |
|---|---|---|
| **Critical** | Payment credentials/tokens, Razorpay webhook secret, encryption keys, Better Auth signing keys, creator payout bank details, MFA secrets | Sections 16, 17, 22 |
| **High** | Authentication credentials (password hashes), session/refresh tokens, PII (addresses, phone, government-ID-adjacent creator tax fields), audit logs | Sections 5, 7, 20, 21 |
| **Medium** | Order and payment history, private messages, moderation case data, internal role assignments | Sections 6, 20, 21 |
| **Standard** | Published product/store content, public reviews, public CMS content | Section 8 (still validated, but not confidentiality-sensitive) |

### 3.4 Attack Surface Inventory

| Surface | Exposure | Primary Mitigations |
|---|---|---|
| Public REST API (`09-api-architecture.md`) | Internet-facing, unauthenticated + authenticated | Sections 8–10 |
| Five first-party frontends (`11-frontend-architecture.md`) | Internet-facing (Buyer), authenticated-internal (Creator/Admin/Moderator/Support) | Sections 11–12 |
| Webhook receivers (Razorpay, future shipping carriers) | Internet-facing, unauthenticated by transport, authenticated by signature | Section 22.4–22.5 |
| Direct-to-R2 upload URLs | Internet-facing, short-lived signed | Section 14 |
| Third-party integrations (outbound) | Server-to-server | Section 23 |
| CI/CD pipeline | Internal, credentialed | Section 24 |
| Database (Supabase Postgres) | Not directly internet-facing; reachable only via the pooler from the application tier and from authorized operator tooling | Sections 6.6 (RLS), 18 |

### 3.5 Threats by STRIDE Category (Representative, Non-Exhaustive)

| Category | Representative Threat | Primary Section |
|---|---|---|
| **Spoofing** | Forged JWT; forged webhook claiming a payment succeeded | Sections 5, 22.4 |
| **Tampering** | Client-side price/quantity manipulation at checkout; modified request payloads bypassing validation | Sections 8.6 (server-side recomputation), 9 |
| **Repudiation** | A creator disputing they issued a listing change; an internal role denying an action | Section 20 (tamper-resistant audit) |
| **Information Disclosure** | IDOR exposing another buyer's order; verbose error leaking stack traces; over-broad API response fields | Sections 6.2, 8.6, 10 |
| **Denial of Service** | Credential-stuffing flood against Login; scraping flood against catalog endpoints; payment-webhook flood | Sections 5.9, 8.3, 22.5 |
| **Elevation of Privilege** | A Moderator attempting an Admin-only action; a Buyer attempting to act as a Creator Team Member of a store they don't belong to | Section 6 |

### 3.6 Explicitly Out of Scope for This Threat Model

Physical security of Vercel/Supabase/Cloudflare/Upstash data centers (owned by those providers' own compliance programs, evaluated as part of third-party risk in Section 23.6); nation-state-level advanced persistent threats (the platform's control set is proportionate to a growing marketplace's realistic risk profile, not a high-value nation-state target); and denial-of-service at the network/infrastructure layer below the application (mitigated by Vercel's and Cloudflare's platform-level DDoS protection, not re-architected here).

---

# 4. Trust Boundaries

### 4.1 Boundary Diagram

```
                    ┌─────────────────────────────────────────┐
                    │         UNTRUSTED ZONE                    │
                    │  Browser / Mobile PWA / any external      │
                    │  caller — including the Admin Panel's     │
                    │  own browser tab                          │
                    └─────────────────┬───────────────────────┘
                                       │  TRUST BOUNDARY 1
                                       │  (TLS, CORS, rate limit,
                                       │   auth, input validation)
                    ┌─────────────────▼───────────────────────┐
                    │      Next.js Application (Vercel)         │
                    │  Route Handlers · Server Actions ·         │
                    │  Middleware Pipeline (10-backend §6)       │
                    └─────────────────┬───────────────────────┘
                                       │  TRUST BOUNDARY 2
                                       │  (Service Layer ownership/
                                       │   business-rule checks)
                    ┌─────────────────▼───────────────────────┐
                    │        Service Layer (per module)          │
                    └─────────────────┬───────────────────────┘
                                       │  TRUST BOUNDARY 3
                                       │  (Repository-scoped
                                       │   connection + RLS)
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
   ┌──────────▼─────────┐   ┌──────────▼─────────┐   ┌──────────▼─────────┐
   │  Supabase Postgres   │   │  Cloudflare R2      │   │  Upstash Redis      │
   │  (RLS-enforced)      │   │  (private by        │   │  (server-only       │
   │                       │   │   default)          │   │   access)           │
   └───────────────────────┘   └─────────────────────┘   └─────────────────────┘
                                       │  TRUST BOUNDARY 4
                                       │  (outbound, credentialed,
                                       │   circuit-broken)
                    ┌─────────────────▼───────────────────────┐
                    │   Third-Party Services (Razorpay, Resend,  │
                    │   PostHog, Sentry) — Section 23            │
                    └─────────────────────────────────────────┘
```

### 4.2 Boundary 1 — Client to Application

Every crossing of this boundary is TLS-encrypted (Section 16.1), origin-checked (Section 11.3), rate-limited (Section 8.3), and — for any non-public endpoint — authenticated (Section 5) before a single byte of business logic executes. This is the platform's primary, highest-traffic trust boundary and the one most directly exposed to the Section 3.2 actor list in full.

### 4.3 Boundary 2 — Presentation to Service Layer

Internal to the application, but treated as a genuine boundary per `10-backend-architecture.md` Section 6.4/8.2: coarse role authorization happens at the pipeline; fine-grained ownership and business-rule authorization happens explicitly, again, inside every Service Layer function — this boundary exists specifically so that a bug or omission in the outer pipeline check is not the only thing standing between an unauthorized request and a data mutation.

### 4.4 Boundary 3 — Service Layer to Data Stores

Crossing into Postgres, R2, or Redis is where Defense in Depth's third layer (Section 2.2) lives: RLS policies (Section 6.6) enforce tenant isolation at the database itself, R2 objects are private-by-default with access mediated exclusively through signed URLs the application generates (`10-backend-architecture.md` Section 11.5), and Redis is reachable only from server-side application code, never from any client directly.

### 4.5 Boundary 4 — Application to Third Parties

Outbound calls to Razorpay, Resend, PostHog, Sentry, and any future integration cross into infrastructure this platform does not control. Every such call is credentialed with a scoped, rotatable secret (Section 17), wrapped with a timeout and defined failure behavior (`10-backend-architecture.md` Section 17.2–17.5), and — critically — every *inbound* crossing of this same boundary (a webhook) is treated as untrusted input requiring signature verification (Section 22.4) exactly as rigorously as Boundary 1's client traffic, since a webhook endpoint is, from a threat-model perspective, just another internet-facing entry point that happens to expect a specific caller.

### 4.6 Cross-Cutting: Internal Roles Do Not Cross a Lesser Boundary

A request from the Admin Panel crosses Boundary 1 identically to a request from the public Buyer app — elevated role does not imply a shortened or weakened boundary-crossing path. This is the concrete, architectural expression of Section 2.1's Zero Trust principle: there is no "internal traffic" fast lane that skips validation.

---

# 5. Identity & Authentication

### 5.1 Authentication Architecture

Better Auth is the platform's system of record for credential verification, session issuance, and OAuth, per `10-backend-architecture.md` Section 7.1. This section specifies the security properties that configuration must guarantee, not the configuration itself.

**What the rule is:** every authenticated request presents a short-lived (15-minute) signed JWT access token, verified on every single request (Section 2.1); long-lived session continuity is provided exclusively by a rotating, `HttpOnly`/`Secure`/`SameSite=Strict` refresh-token cookie (`10-backend-architecture.md` Section 7.2), never by a long-lived access token.

**Why it exists:** a short access-token TTL bounds the damage window of a leaked token to minutes, not days; keeping the refresh token `HttpOnly` means it is never readable by JavaScript, closing the single most common token-theft vector (XSS-driven `localStorage`/`document.cookie` reads) by construction rather than by discipline — directly matching `11-frontend-architecture.md` Section 21.3–21.4's client-side commitment that no token of consequence is ever placed anywhere JavaScript can read it.

**How every engineer implements it:** no engineer ever writes custom credential-verification, token-issuance, or session logic — Better Auth's flows are the only path, wrapped by the Auth module (`10-backend-architecture.md` Section 5.2). Any code that manually decodes a JWT payload without calling Better Auth's verification function is a defect, not a shortcut.

**Common mistakes:** storing the access token in `localStorage` "just for this one debugging feature"; extending the access-token TTL to "reduce refresh calls"; treating a successfully-issued token as proof of current authorization rather than re-checking authorization on every request (Section 2.1).

**Security implications:** a leaked refresh token is the platform's single highest-value credential-theft target, which is exactly why Section 5.1's cookie hardening, Section 5.9's brute-force protections, and Section 7's rotation/reuse-detection design all converge on protecting it specifically.

### 5.2 Password Policies

Passwords are validated against a policy enforced identically client-side (advisory, `11-frontend-architecture.md` Section 11.2) and server-side (authoritative, Better Auth configuration): minimum 12 characters, checked against a breached-password corpus (a k-anonymity API such as the Have I Been Pwned Passwords API, queried by prefix hash so the actual password is never transmitted to the third party) rather than an arbitrary complexity-character-class rule set. **Why:** complexity rules (requiring symbols/numbers) are well-documented to push users toward predictable substitution patterns (`P@ssw0rd1`) without meaningfully increasing entropy; breached-password screening directly blocks the credentials attackers actually try first. Passwords are hashed with Argon2id (Better Auth's supported modern default), never MD5/SHA-family alone, never reversible encryption — a password hash is never decryptable by design, and no support workflow (Section 5.10) ever involves "looking up" a user's password, only resetting it.

**Common mistake:** allowing a support workflow to reset a password to a temporary, support-agent-chosen value communicated verbally or via an unencrypted channel — the platform's only supported reset path is the token-based flow in Section 5.7, even for support-assisted cases.

### 5.3 Multi-Factor Authentication (Readiness)

MFA is not enabled by default at launch (per `08-database-design.md`'s `MFA` entity, Section 5.9, and `09-api-architecture.md` Section 3.16's "Future — Contract Reserved" framing), but the architecture is MFA-ready, not MFA-absent: Better Auth's TOTP plugin is configured and available for **mandatory** enablement on the highest-sensitivity role — **Super Admin** — from launch, since the blast radius of a single compromised Super Admin credential (`10-backend-architecture.md` Section 8.4) is large enough to warrant MFA before general buyer/creator rollout is prioritized. Buyer/Creator MFA is an opt-in toggle reserved for near-term (not "future/speculative") enablement — the `MFA`/`Devices`/`TrustedDevices` tables already exist (`08-database-design.md` Section 5.9–5.11) specifically so this is a configuration and UI change, not a schema or architecture change, when prioritized.

### 5.4 OAuth Security

Google and Apple OAuth (`10-backend-architecture.md` Section 7.8) are configured via Better Auth's provider-plugin model with the following non-negotiable properties: the `state` parameter is used on every authorization request and verified on callback (CSRF protection specific to the OAuth flow, distinct from Section 7.5's general CSRF posture); redirect URIs are allow-listed exactly (no wildcard subdomains) per environment; and an OAuth-authenticated identity is linked to a platform account **by verified email match only**, never by an unverified claim from the provider, closing the account-takeover vector where an attacker registers a look-alike OAuth identity to hijack an existing platform account. A user who already has a password-based account and later signs in via OAuth with the same verified email is linked to their existing account, never silently issued a second, duplicate identity.

### 5.5 Email Verification

Implements `09-api-architecture.md` Section 3.8/`10-backend-architecture.md` Section 7.6: a cryptographically random, single-use, time-limited (24-hour) verification token is issued by Better Auth and delivered exclusively through the Notifications module's audited delivery pipeline (`10-backend-architecture.md` Section 15.5) — never returned in an API response body, never logged in plaintext (Section 20.4's redaction rule applies). An unverified account has restricted functionality (cannot check out, cannot publish a store) per `01-product-requirements.md` AUTH-02, which is itself a security control: it bounds the damage a mass-registered fake-account campaign can do before it's forced through a real-email choke point.

### 5.6 Phone Verification

Where enabled (SMS notification opt-in, `10-backend-architecture.md` Section 5.15's `SMSQueue`), phone verification uses a 6-digit OTP, rate-limited to a maximum of 5 send attempts per phone number per hour and 5 verification attempts per issued code before that code is invalidated — preventing both SMS-bombing abuse of a third party's phone number and brute-force guessing of the 6-digit space.

### 5.7 Password Reset Flow

Implements `09-api-architecture.md` Section 3.6–3.7: a reset request **always** returns an identical, generic success response regardless of whether the submitted email corresponds to a real account (`10-backend-architecture.md` Section 5's anti-enumeration pattern, applied specifically here since password-reset request is a classic account-enumeration vector). The reset token is single-use, expires in 1 hour, and — critically — **on successful reset, every other active session for that account is immediately revoked** (`10-backend-architecture.md` Section 7.7's stated business rule), since a password reset is frequently a response to a suspected compromise, and leaving a potentially-attacker-held session alive through that moment would defeat the reset's purpose.

### 5.8 Secure Onboarding

Registration (`01-product-requirements.md` AUTH-01) is rate-limited per IP and per declared email domain (Section 8.3) to blunt mass fake-account creation; Terms of Service/Privacy Policy consent is captured with a timestamp and document version (`01-product-requirements.md` LEGAL-01) as an auditable, non-repudiable record (Section 20); and Creator Registration's identity-verification evidence (`01-product-requirements.md` Section 7.5) is handled under the same file-upload security controls as any other sensitive upload (Section 14), never treated as lower-risk simply because it's collected during a "positive," growth-oriented flow.

### 5.9 Brute-Force Protection

Login attempts are rate-limited using a Redis-backed sliding window (`10-backend-architecture.md` Section 13.7), keyed by **both** IP address and the targeted account identifier independently, so an attacker cannot bypass the account-level limit by rotating IPs, nor bypass the IP-level limit by targeting many accounts from one IP. Failed-attempt thresholds: 5 failed attempts against a single account within 15 minutes triggers a progressive delay (`01-product-requirements.md` AUTH-03); 10 within an hour triggers Section 5.10's temporary account lockout. Every failed attempt is logged as a `SecurityEvent` (`08-database-design.md` Section 23.5) with correlation ID, IP, and (if resolvable) approximate geolocation, feeding Section 19's anomaly detection.

**Fail-closed behavior:** if the Redis rate-limit check itself cannot be completed (an Upstash outage), authentication requests are **rejected**, not allowed through unchecked — a brute-force window opening during a cache outage is an unacceptable trade against a brief, honest "try again shortly" degradation (Section 2.5).

### 5.10 Account Lockout

A temporary lockout (15 minutes, exponentially increasing on repeated triggering) follows the threshold in Section 5.9 — never a permanent lockout requiring support intervention for a simple failed-login pattern, since permanent lockout is itself a denial-of-service vector an attacker can weaponize against a legitimate user by deliberately failing their login. The account owner is notified by email of the lockout event (a genuine security notification, distinct from and never conflated with a marketing notification, `01-product-requirements.md` NOTIF-01's "critical notifications always sent" rule) with guidance to reset their password if they don't recognize the attempts. Lockout state is stored in Redis with its own TTL matching the lockout duration, never in a way that requires a manual unlock step for the common case.

### 5.11 Session Hijacking Protections

Beyond token architecture (Section 7), the platform binds a session's refresh-token cookie to a coarse device/browser fingerprint hash (User-Agent plus a small set of low-entropy client hints, deliberately *not* a high-entropy fully-identifying fingerprint, which would itself be a privacy concern, Section 21) recorded at issuance; a refresh attempt from a materially different fingerprint does not automatically fail (network/browser conditions change legitimately) but does elevate that request's `SecurityEvent` severity for anomaly-detection review (Section 19.2) rather than being silently accepted as routine.

---

# 6. Authorization & RBAC

### 6.1 Authorization Model

Two-tier, matching `10-backend-architecture.md` Section 7.10/8 exactly, restated here with its full security rationale: **Tier 1 (coarse RBAC)** — a fast, JWT-claim-driven role check at the pipeline (Section 6.4 of that document) rejecting obviously-unauthorized requests before any database work. **Tier 2 (fine-grained ownership/business-rule authorization)** — Service-Layer-internal checks (does this caller own this specific resource, does this operation satisfy this resource's current state's business rules) that require domain knowledge no generic middleware can express. **Why two tiers, not one:** a single-tier model tends toward one of two failure modes — either RBAC roles multiply into an unmanageable number of hyper-specific roles trying to express ownership (`Store-Owner-For-Store-abc123`), or ownership checks are skipped because "the role already gates this," which is precisely the assumption Section 6.2 explicitly forbids.

### 6.2 The Ownership-Check Rule (Non-Negotiable)

**What the rule is:** every Service Layer function operating on a specific resource instance performs an explicit ownership or scope check, regardless of what the pipeline's coarse RBAC step already verified. **Why it exists:** RBAC answers "is this actor a Creator"; it cannot answer "is this actor a Creator who owns *this* store" — conflating the two is the single most common real-world cause of IDOR (Insecure Direct Object Reference) vulnerabilities, where an authenticated, correctly-roled user simply changes a resource ID in the URL/payload and receives another user's data. **How every engineer implements it:** every module exposes small, named, reusable guard functions (`10-backend-architecture.md` Section 8.2's `assertStoreTeamMembership(userId, storeId)` pattern) called explicitly at the top of every resource-scoped Service Layer function — never assumed, never deferred, never satisfied implicitly by a `WHERE` clause alone (a query that merely filters by `storeId` without first asserting the caller may access that `storeId` can still leak a *count* or a *not-found-vs-forbidden* distinction that itself constitutes information disclosure, Section 6.5). **Common mistake:** writing a Repository function that filters by the *caller's own* ID correctly for the "list my own resources" case, then reusing that same function unmodified for a "get resource by ID" case where the ID is caller-supplied and must be independently verified.

### 6.3 Permission Model

`ResourcePermission` (`08-database-design.md` Section 6.5) is the platform's mechanism for the genuinely dynamic, narrow, or temporary access grants that don't fit a static role — a Support Executive escalated into a specific disputed order (`10-backend-architecture.md` Section 8.9), a Creator Team Member granted access to a specific report. Every such grant is: (1) scoped to a specific resource, never role-wide; (2) time-bound where the underlying business reason is inherently temporary (an escalation ends when the ticket closes); (3) itself audit-logged at grant and use time (Section 20); and (4) resolved through the single shared `hasResourcePermission(...)` function (`10-backend-architecture.md` Section 8.3), never re-implemented per module.

### 6.4 Role Definitions (Security Posture Summary)

| Role | Coarse RBAC Scope | Elevated-Risk Notes |
|---|---|---|
| **Guest** | Public read endpoints only | No session; rate-limited identically to any unauthenticated caller |
| **Buyer** | Own-resource CRUD only (Section 8.7 of the backend doc) | Highest population, lowest per-account privilege — the platform's account-takeover-fraud surface (Section 22.6), not a privilege-escalation surface |
| **Creator** | Own-store-scoped CRUD, gated further by `StoreTeam` role (Owner/Manager/Editor, Section 6.7 below) | Payout-account access (Section 22.7) is the highest-value target within this role |
| **Creator Team Member** | Subset of Creator scope per invited role | Invitation flow (Section 6.8) itself is a security-relevant boundary |
| **Moderator** | Full `/v1/moderation/*` | Can affect other users' visibility/standing platform-wide — actions are logged at Critical severity (Section 20.3) |
| **Support Executive** | Full `/v1/support/*`, escalated `ResourcePermission` for specific cases | Broadest *read* access to buyer/creator PII among non-Admin roles — Section 21's PII-minimization discipline applies most acutely here |
| **Admin** | Full `/v1/admin/*` except Super-Admin-reserved operations (Section 6.5) | Can approve creators, issue refunds, moderate at scale |
| **Super Admin** | Everything, including platform policy and audit-log access | MFA-mandatory (Section 5.3); every action reviewed at the highest audit tier (Section 20.3) |

### 6.5 Admin Hierarchy and Sensitive-Operation Gating

Admin and Super Admin are distinct roles, never a single role with an internal flag (`10-backend-architecture.md` Section 8.4) — this distinction exists specifically so that the platform's most consequential, hardest-to-reverse operations (commission/policy configuration, audit-log access, permission/role assignment — `01-product-requirements.md` Section 5.11) have a smaller, more tightly controlled population who can perform them, independent of the much larger day-to-day operational Admin population. Every Super-Admin-only endpoint enforces this at both Tier 1 (RBAC) and, for the handful of genuinely irreversible actions (permanent account termination, financial policy change), a mandatory secondary confirmation step at the Presentation Layer (`00-project-vision.md` Section 3.8's stated principle, made concrete here as a UX+authorization requirement, not authorization alone).

### 6.6 Row-Level Security (RLS) — The Database-Layer Backstop

Fully specified at the implementation level in `10-backend-architecture.md` Section 20.9; restated here as this document's authoritative security control statement: **RLS is Defense in Depth's third layer (Section 2.2), never the primary authorization mechanism.** Every multi-tenant table (scoped by `store_id` or `user_id`) has an RLS policy restricting rows to the requesting connection's authenticated context. The application's default database connection operates under this RLS-constrained role; a separate, explicitly-provisioned service-role connection — used only by Admin/Moderator/Support Repository functions and background jobs that legitimately need cross-tenant reads (`10-backend-architecture.md` Section 20.9's final paragraph) — is never the default, and its use is restricted to the specific Repository functions that declare a documented cross-tenant need, never adopted platform-wide "to simplify things."

**Why this specific design:** if a Service Layer authorization bug ever allowed an unauthorized query to reach the Repository Layer, RLS ensures that query still cannot return another tenant's rows, because the database itself — not application code — enforces the boundary at the lowest possible layer. This is the single most important defense-in-depth control in this entire document for the platform's most common realistic vulnerability class (Section 3.5's Information Disclosure / IDOR row).

### 6.7 Creator and Store-Team Authorization

A Creator's effective permission is the union of platform role and `StoreTeam` role (`10-backend-architecture.md` Section 8.6): Owner (full store control including team management and payout visibility), Manager (operational control, no team/payout access), Editor (catalog editing only). Every Products/Orders/Payouts Service Layer function checks the specific `StoreTeam` role required for that operation, not merely "is this caller a member of this store's team" — the finer distinction (only Owner may remove a team member; only Owner/Manager may view Payouts) is enforced as additional, explicit Service-Layer guard logic, never left to client-side UI omission alone (`04-information-architecture.md` Section 16's rule that restricted destinations are never merely hidden — they are also, always, independently server-enforced).

### 6.8 Team Invitation Security

Store Team invitations (`01-product-requirements.md` Section 4.16) use a single-use, time-limited (7-day) token delivered to the invitee's email — never an open, guessable, or reusable invite link — and require the invitee to already hold or create a verified platform account (Section 5.5) before the invitation can be accepted, closing the vector where an invitation link forwarded or leaked outside its intended recipient could be used to join a store's team as an unverified or anonymous identity.

### 6.9 Role-Specific Security Postures — Buyer, Creator, Admin, Internal Tools

**Buyer security** centers on account-takeover resistance (Sections 5.9–5.11) and payment-fraud detection (Section 22.6) — the population is large, individual privilege is low, and the dominant risk is credential-stuffing/ATO against real accounts, not privilege escalation.

**Creator security** adds payout-account protection (Section 22.7's masked-storage, re-verification-hold pattern) and store-team boundary enforcement (Section 6.7–6.8) on top of the Buyer baseline, since a compromised Creator account carries both financial risk (payout redirection) and platform-integrity risk (fraudulent listings reaching real buyers).

**Admin/Internal Tools security** (Admin, Moderator, Support) inverts the population/privilege trade-off relative to Buyer: a small, known, employment-verified population with disproportionately high privilege per account. This is why internal-role authentication is held to a stricter standard than consumer authentication (`10-backend-architecture.md` Section 6.3's mention of a "separate, more restrictive access path" for internal roles is made concrete here): mandatory MFA for Super Admin (Section 5.3, extending to all internal roles as a near-term priority), tighter session TTLs are considered for internal-role sessions specifically (a documented candidate for Section 31's near-term hardening), and every internal-role action is audit-logged at a minimum severity floor higher than the equivalent buyer-facing action (Section 20.3).

---

# 7. Session Architecture

### 7.1 Token Lifecycle

| Token | Lifetime | Storage | Renewal |
|---|---|---|---|
| Access token (JWT) | 15 minutes | In-memory on the server (BFF, `11-frontend-architecture.md` Section 12.1); never persisted to browser storage | Silently reissued using a valid refresh token |
| Refresh token | 30 days, sliding | `HttpOnly`, `Secure`, `SameSite=Strict` cookie | Rotated on every use (Section 7.3) |
| Password reset token | 1 hour, single-use | Hashed at rest in Postgres (never stored plaintext, mirroring password-hash treatment) | Not renewable — a new request issues a new token |
| Email/phone verification token | 24 hours (email) / 10 minutes (phone OTP), single-use | Hashed at rest | Resend issues a new token, invalidating the prior one |
| Store-team invitation token | 7 days, single-use | Hashed at rest | Not renewable — a new invitation must be sent |

**What the rule is:** every token in this table has an explicit, bounded lifetime and a defined single-use-or-rotation behavior; no token in this system is indefinitely valid. **Why:** bounded lifetimes are the platform's primary mitigation against the *impact* of a leaked token, complementing (never replacing) the controls that prevent leakage in the first place (Sections 9–12).

### 7.2 Cookie Strategy

The refresh-token cookie is the platform's only persistent client-side authentication artifact, and it is configured with every available hardening attribute: `HttpOnly` (inaccessible to JavaScript, closing the XSS-to-token-theft path per `11-frontend-architecture.md` Section 21.4), `Secure` (never transmitted over plaintext HTTP), `SameSite=Strict` (not sent on cross-site navigation or subrequests, closing the majority of CSRF vectors against it by itself, Section 7.5), scoped to the specific app's exact domain (never a shared parent-domain cookie across `apps/buyer`/`apps/creator`/`apps/internal`, per `11-frontend-architecture.md` Section 3.2's deliberate app separation — a compromise of one app's session cookie must never grant access to another app), and a `__Host-` cookie-name prefix where the deployment topology supports it, which browsers enforce as an additional guarantee that the cookie was set securely and path-scoped to the root.

### 7.3 Refresh Token Rotation and Reuse Detection

**What the rule is:** every use of a refresh token immediately invalidates it and issues a new one (rotation); if a refresh token that has already been rotated is ever presented again, the entire token family (every token descended from that original issuance) is revoked immediately, and the account's active sessions are force-logged-out. **Why it exists:** rotation bounds a leaked-but-not-yet-used refresh token's usable window to a single exchange; reuse detection is what turns an *undetected* leak into a *detected, contained* one — a legitimate client only ever presents its most recently issued refresh token, so any presentation of a stale one is unambiguous evidence that a second party has a copy. **How every engineer implements it:** this logic lives exclusively inside the Better Auth session module (`10-backend-architecture.md` Section 7.2–7.7); no feature code ever manually reads, writes, or bypasses refresh-token state. **Common mistake:** implementing a "remember me" feature by extending the refresh token's lifetime indefinitely rather than through the sliding-window renewal already built into Section 7.1's model — an unbounded token defeats the entire rotation/detection design.

### 7.4 Session Termination

Sessions are explicitly, immediately revoked (not merely allowed to expire) on: user-initiated logout, password reset (Section 5.7), account suspension (`01-product-requirements.md` Section 8.6), and detected refresh-token reuse (Section 7.3). Revocation is enforced via a Redis-backed denylist of revoked token families checked on every refresh attempt (`10-backend-architecture.md` Section 7.7), since a stateless JWT alone cannot be invalidated before its natural expiry — this is a deliberate, necessary exception to pure statelessness (`10-backend-architecture.md` Section 2.9), scoped as narrowly as possible (only revoked-token lookups touch Redis; ordinary access-token verification remains fully stateless).

### 7.5 CSRF Protection

Three independent layers, per Defense in Depth (Section 2.2): (1) `SameSite=Strict` on the refresh cookie (Section 7.2), which alone blocks the overwhelming majority of CSRF vectors; (2) Next.js Server Actions' built-in, framework-level CSRF token verification (`11-frontend-architecture.md` Section 21.2), used for all progressive-enhancement-eligible mutations; (3) explicit origin/referer validation in every Route Handler accepting a mutating request from client-side `fetch` (Section 10.2 of the frontend document), rejecting any request whose `Origin` header does not match the expected first-party app domain. No mutating endpoint relies on `SameSite` alone — the second and third layers exist specifically for the realistic edge cases (older browsers, certain proxy/embedding contexts) where `SameSite` enforcement cannot be assumed universal.

### 7.6 Concurrent Session Handling

Multiple concurrent sessions per account are permitted by default (a buyer signed in on both a phone and a laptop is normal, expected usage) and visible to the account holder via a "manage devices/sessions" view (leveraging `08-database-design.md`'s `Devices`/`TrustedDevices` entities), from which any individual session can be manually revoked — giving the account holder the same session-termination capability described in Section 7.4 as a self-service security control, not only a platform-triggered one.

---

# 8. API Security

### 8.1 The API as the Sole Data Access Path

Restated from `09-api-architecture.md` Section 1: every client, first-party or (if ever authorized) third-party, reaches platform data exclusively through the versioned REST API — there is no direct database access path from any frontend, and no "internal-only, less-validated" API variant. Section 8's controls apply uniformly to every endpoint regardless of which frontend calls it.

### 8.2 Transport Security

TLS 1.2 minimum, TLS 1.3 preferred, enforced platform-wide via Vercel's edge termination (`10-backend-architecture.md` Section 1.6); HTTP requests are redirected, never served, per `09-api-architecture.md` Section 2.4. HSTS (`Strict-Transport-Security`, minimum 1-year `max-age`, `includeSubDomains`, submitted to browser preload lists) is set on every response, closing the initial-request downgrade window HSTS exists specifically to prevent.

### 8.3 Rate Limiting

Implements `10-backend-architecture.md` Section 13.7's Upstash-Redis sliding-window limiter, with tiers set specifically by endpoint sensitivity (not one flat platform-wide number):

| Tier | Example Endpoints | Limit | Rationale |
|---|---|---|---|
| Authentication | Login, Register, Password Reset Request | 5/min per IP, 5/15min per account (Section 5.9) | Brute-force/enumeration resistance |
| Payment-initiating | Checkout/Payment endpoints | 10/min per account | Card-testing-fraud resistance (Section 22.6) |
| Standard authenticated | Most `/v1/*` CRUD endpoints | 100/min per account | Baseline abuse resistance without constraining legitimate use |
| Public catalog (unauthenticated) | Search, Product listing | 60/min per IP | Scraping resistance, per `04-information-architecture.md` Section 10's search-abuse consideration |
| Webhooks | Razorpay webhook receiver | Not rate-limited by caller identity (Section 22.5 covers its distinct protection model) | A legitimate payment processor must never be throttled |

Every rate-limit rejection returns the standard `429` error envelope (`09-api-architecture.md` Section 2.15) with a `Retry-After` header, and is itself logged as a `SecurityEvent` when it recurs beyond a threshold suggestive of deliberate abuse rather than an occasional legitimate burst.

### 8.4 Request Validation

Every request body, query parameter, and path parameter is validated against a Zod schema before touching any Service Layer logic (`10-backend-architecture.md` Section 6.5's pipeline stage, `11-frontend-architecture.md` Section 11.2's shared-schema pattern extended server-side as the authoritative copy). **What the rule is:** validation is allow-list-based (defining exactly the shape, type, and constraints of acceptable input) never deny-list-based (attempting to filter out "known bad" patterns) — allow-listing is exhaustive by construction; deny-listing is inherently incomplete against inputs the list's author didn't anticipate.

### 8.5 Mass Assignment Prevention

Every Zod input schema explicitly enumerates only the fields a given operation is permitted to set — a `Product` update schema, for instance, never includes `storeId`, `verificationStatus`, or `id` as accepted input fields, even though those fields exist on the underlying entity, because accepting them would let a caller attempt to reassign a resource to a different owner or forge a system-controlled field. This is enforced by construction (the schema simply has no field for it), not by a runtime "strip disallowed fields" filter, which is a weaker, more error-prone pattern.

### 8.6 IDOR Prevention (API-Layer Restatement)

Every path parameter representing a resource ID (`/v1/orders/{orderId}`) is resolved through the Section 6.2 ownership-check pattern before any data is returned or mutated — restated here specifically because IDOR is fundamentally an *API-surface* vulnerability class (Section 3.5), and this document's authorization architecture (Section 6) is the control that closes it; Section 8 exists to state explicitly that no endpoint is exempt from this pattern regardless of how "internal" or "low-risk" it may seem at the time it's written.

### 8.7 Response Field Minimization

Every API response is shaped by an explicit output/serialization schema (`09-api-architecture.md` Section 2.9's field-naming conventions extended here as a security control) that includes only the fields the calling role/context is entitled to see — a `Product` response to a Guest never includes a creator's internal cost/margin fields even if those fields exist on the underlying entity; an `Order` response to a Buyer never includes another buyer's data even in a hypothetically shared context. Over-fetching at the ORM layer (Drizzle) is explicitly permitted internally (fetching a full row is often simplest), but the **response serialization layer is a mandatory, separate step** — raw Repository/Drizzle query results are never returned directly as an API response body.

### 8.8 API Versioning as a Security Boundary

`09-api-architecture.md` Section 1.4's `/v1/` prefix strategy has a security dimension worth stating explicitly: a deprecated version is fully decommissioned (Section 25 of that document), not left indefinitely reachable with weaker validation than the current version — an old, unmaintained API version is a common source of accumulated, unpatched vulnerabilities in systems that version by permanently accreting endpoints rather than retiring them.

---

# 9. Input Validation

### 9.1 Input Sanitization Philosophy

**What the rule is:** input is validated for shape and constraint (Section 8.4) and, separately, sanitized for safe storage/rendering only where it is inherently free-form content (rich text, search queries) — validation and sanitization are treated as distinct steps with distinct purposes, never conflated. **Why:** a field can be perfectly valid (a correctly shaped string) while still being dangerous to render unescaped (Section 10) or interpret as a query fragment (Section 9.2) — validation alone does not guarantee safety at every downstream use.

### 9.2 SQL Injection Prevention

**What the rule is:** all database access goes through Drizzle ORM's parameterized query builder (`10-backend-architecture.md` Section 2.7); raw SQL string concatenation with any request-derived value is prohibited without exception. **Why it exists:** parameterized queries separate query structure from data at the protocol level, making SQL injection structurally impossible for the parameterized portion of a query, regardless of what the input contains. **How every engineer implements it:** Drizzle's query builder or, where a genuinely complex query requires raw SQL (rare, and requiring senior review), Drizzle's tagged-template `sql` helper with parameterized placeholders — string interpolation (template literals building SQL text directly from a variable) into a raw query is a blocking code-review finding with no exceptions. **Common mistake:** believing a value is "safe" because it was already validated by Zod (Section 8.4) and therefore skipping parameterization for a raw-SQL edge case — validation and injection-safety are independent properties (Section 9.1); a validated, syntactically-correct string can still contain SQL metacharacters.

### 9.3 NoSQL / Cache-Key Injection Prevention

Redis keys (`10-backend-architecture.md` Section 14.2's `{module}:{entity}:{identifier}:{qualifier}` convention) are always constructed from a fixed template with validated, typed identifier values (UUIDs, enumerated strings) — never from raw, unvalidated user input directly concatenated into a key string, which could otherwise allow a crafted input to collide with or overwrite an unrelated cache entry.

### 9.4 Command Injection Prevention

The application never shells out to construct a system command from request-derived input; the platform's architecture (`10-backend-architecture.md` Section 1) has no legitimate use case requiring this, and any future integration proposing it (e.g., a file-processing tool) requires an explicit security review (Section 30) and, wherever possible, a library-based alternative to shell invocation entirely.

### 9.5 Server-Side Request Forgery (SSRF) Prevention

**What the rule is:** the application never fetches a URL supplied or influenced by user input from server-side code without passing through an explicit allow-list/validation layer. **Why it exists:** the platform accepts URLs in a small number of legitimate contexts (a future webhook-URL configuration for third-party integrations, an image-URL-based upload path if ever added) — any such feature is a classic SSRF vector, where a malicious URL (e.g., pointing at an internal Vercel/Supabase metadata endpoint or an internal-only service) could be used to make the server issue requests on the attacker's behalf into the private network. **How every engineer implements it:** any feature accepting a user-supplied URL for server-side fetching validates the URL's scheme (`https` only), resolves and checks the destination is not a private/link-local/loopback IP range (deny-listing RFC 1918 ranges, `169.254.169.254` cloud-metadata addresses, and `localhost`/`127.0.0.1` explicitly) before the request is issued, and — for the current v2 feature set — this pathway does not exist at all (the platform has no user-supplied-URL-fetching feature today), making Section 9.5 a forward-looking control gate for Section 31's future integrations rather than an active mitigation for a present feature.

### 9.6 XML/XXE Prevention

The platform does not parse XML from any untrusted source (all API payloads are JSON per `09-api-architecture.md` Section 2.1); if any future integration requires XML parsing (an unusual carrier/logistics API, for instance), the parser is configured with external entity resolution disabled by default, treated as a mandatory configuration step reviewed before that integration ships, never an assumed-safe default.

### 9.7 File-Path and Traversal Injection Prevention

Object keys for Cloudflare R2 uploads (Section 14–15) are always server-generated (a UUID-based path, never derived from the client-supplied filename directly) — a client-supplied filename is stored only as display metadata, never used to construct the actual storage path, closing path-traversal vectors (`../../` sequences) entirely by never giving user input a role in path construction.

### 9.8 Regular Expression Denial of Service (ReDoS) Prevention

Validation regular expressions (within Zod schemas, Section 8.4) are reviewed for catastrophic backtracking risk before merging — patterns with nested quantifiers over user-controlled-length input are avoided or rewritten with bounded, non-backtracking equivalents; any regex applied to unbounded-length user input (e.g., a free-text review body) is additionally protected by the platform's general request-size limits (`09-api-architecture.md` Section 2.5's payload size caps), which bound the input length any single regex evaluation could ever process.

---

# 10. Output Encoding

### 10.1 Context-Aware Encoding

**What the rule is:** every piece of dynamic data is encoded appropriately for the specific context it is rendered into — HTML body, HTML attribute, URL parameter, or JSON payload — and that encoding is applied at the point of output, not assumed to have happened earlier. **Why it exists:** the same string ("O'Brien's Pottery") requires different escaping depending on whether it lands inside an HTML text node, an `href` attribute, or a JSON string value; using the wrong context's escaping rules is a common source of XSS that survives otherwise-correct-looking sanitization.

### 10.2 XSS Prevention — Primary Control

React's JSX escaping (`11-frontend-architecture.md` Section 21.1) is the platform's primary, structural XSS defense — every piece of dynamic content rendered through standard JSX interpolation (`{value}`) is automatically HTML-entity-escaped by React itself, making reflected and stored XSS structurally difficult by default rather than dependent on every engineer remembering to escape manually. `dangerouslySetInnerHTML` is used in exactly one reviewed location platform-wide (Creator storefront Rich Text story content, `11-frontend-architecture.md` Section 21.1) and only after passing through a server-side sanitizer (Section 10.3) — this narrow, documented exception is treated as a standing security-review item, re-confirmed whenever that code path changes, not a one-time approval.

### 10.3 Rich Text Sanitization

Creator storefront story content (the platform's only genuinely rich-text, HTML-bearing user input, `06-design-system.md` Section 14's constrained Rich Text component) is sanitized server-side, on write, using an allow-list HTML sanitizer permitting only a small, fixed set of safe formatting tags (`<p>`, `<strong>`, `<em>`, `<br>`, `<a>` with `href` further restricted to `http(s)` schemes only) — every other tag, attribute, and inline event handler (`onclick`, etc.) is stripped entirely. Sanitization happens once, server-side, at write time, never client-side-only and never re-trusted on every render — the sanitized value stored in Postgres is the value that is safe to render, by construction, for the lifetime of that content.

### 10.4 JSON Output Encoding

API responses are serialized through the standard `JSON.stringify` pathway (`09-api-architecture.md` Section 2.9), which correctly escapes JSON-significant characters by construction; the platform never hand-constructs JSON response strings via manual concatenation, which is both an unnecessary reinvention and a realistic source of injection if ever done incorrectly.

### 10.5 SQL Output Context

Not applicable as a distinct output-encoding concern — see Section 9.2; SQL "output" in this platform's architecture only ever occurs via parameterized queries, which is an input-side control, not an output-encoding one.

### 10.6 Email/Notification Content Encoding

Transactional email templates (Resend, `10-backend-architecture.md` Section 15.5) interpolate dynamic content (order details, buyer names) through the templating engine's own auto-escaping (React Email or an equivalent JSX-based template, consistent with the platform's React-everywhere convention) rather than raw string concatenation into an HTML email body — the same XSS-prevention rationale in Section 10.2 applies identically to email rendering, since a compromised or malicious display name, for instance, is exactly as dangerous rendered in an HTML email as rendered in the web app if not correctly escaped.

### 10.7 Log Output Encoding

Structured log entries (`10-backend-architecture.md` Section 18) never interpolate untrusted input directly into a log-message *format string* in a way that could enable log injection (forged log entries via embedded newlines/control characters designed to spoof a different log entry) — the platform's structured JSON logging format (fields as data, not concatenated text) is itself the primary control here, since a JSON field value containing a newline remains a single field value, never reinterpreted as a new log line by any correctly-configured log aggregator (Sentry/OpenTelemetry pipeline, Section 19).

---

# 11. Browser Security

### 11.1 Security Headers — Baseline Set

Every response from every first-party application sets the following headers, configured once per app (`11-frontend-architecture.md` Section 21.8) and verified in CI (Section 28.4):

| Header | Value (Representative) | Purpose |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Enforce HTTPS (Section 8.2) |
| `Content-Security-Policy` | See Section 11.2 | Primary XSS/injection-defense-in-depth control |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME-type sniffing attacks |
| `X-Frame-Options` | `DENY` (or `SAMEORIGIN` where a legitimate first-party embed exists) | Clickjacking prevention (Section 11.4) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer leakage to third-party destinations |
| `Permissions-Policy` | Deny by default; allow only features actually used (camera for future upload features, none by default) | Reduce browser-API attack surface |

### 11.2 Content Security Policy (CSP)

Extends `11-frontend-architecture.md` Section 21.8: each app's CSP is generated per-request with a cryptographic nonce applied to any framework-required inline script, `script-src` restricted to `'self'` plus the nonce (never `'unsafe-inline'`, never `'unsafe-eval'`), `img-src` allow-listing only the platform's own origin and the specific Cloudflare R2 bucket domain, `connect-src` allow-listing only the app's own origin (for BFF calls, `11-frontend-architecture.md` Section 10.1) plus the specific, named domains for Sentry and PostHog (Section 23), and `frame-ancestors 'none'` as the CSP-native, more robust complement to the legacy `X-Frame-Options` header (Section 11.4). CSP violation reports are collected (`report-to`/`report-uri` directive, pointed at a lightweight logging endpoint) and reviewed as a leading indicator of both misconfiguration and active exploitation attempts — a spike in CSP violation reports for a specific directive is itself a Section 19 monitoring signal.

### 11.3 CORS

The API accepts cross-origin requests **only** from the platform's own first-party app origins (`apps/buyer`, `apps/creator`, `apps/internal`'s production and preview-deployment domains, per `10-backend-architecture.md` Section 6.2's exact-match allow-list) — `Access-Control-Allow-Origin: *` is never set on any authenticated endpoint, and is set only on the small set of genuinely public, unauthenticated, non-sensitive endpoints (e.g., a public sitemap-adjacent read) where doing so carries no confidentiality risk. Preflight (`OPTIONS`) responses are cached (`Access-Control-Max-Age`) to a reasonable duration to avoid unnecessary preflight round-trip overhead, without weakening the allow-list itself.

### 11.4 Clickjacking Prevention

`X-Frame-Options: DENY` and CSP's `frame-ancestors 'none'` (Section 11.1–11.2) together prevent any of the platform's authenticated applications from being embedded in a third-party iframe — this specifically protects the highest-risk clickjacking targets: Checkout/Payment confirmation, Admin approval actions, and any destructive-action confirmation dialog (`06-design-system.md` Section 18), where a UI-redressing overlay attack could otherwise trick an authenticated user into confirming an action they did not intend.

### 11.5 Subresource Integrity (SRI)

Any third-party script loaded directly (not bundled via the Next.js build, Section 16.3 of the frontend document) — a rare case, since Sentry/PostHog are loaded via their npm SDKs and bundled, not via a raw `<script src>` tag — requires an SRI hash if such a raw-tag pattern is ever introduced, ensuring the browser refuses to execute the script if its content has been tampered with at the CDN/network layer.

### 11.6 Browser Storage Discipline

Restated from `11-frontend-architecture.md` Section 21.4 as a security-architecture requirement, not merely a frontend convention: `localStorage`/`sessionStorage` never hold an access token, refresh token, or PII beyond what the user themselves would already see rendered on screen — this is verified in code review (Section 30) whenever a PR introduces new client-side persisted state (`11-frontend-architecture.md` Section 9.8).

---

# 12. Frontend Security

### 12.1 The BFF Boundary as the Frontend's Primary Security Control

Restated as this document's authoritative statement, extending `11-frontend-architecture.md` Section 10.1/21.3: the browser holds no credential capable of directly calling the REST API — every Next.js Route Handler and Server Action is the actual bearer-token holder, server-side only. This single architectural decision is the frontend's most consequential security property, and every other frontend security control in this section exists to protect the integrity of that boundary rather than to compensate for its absence.

### 12.2 Dependency Trust Boundary

Frontend npm dependencies execute with full access to whatever a Client Component can access — which, given Section 12.1, is deliberately little (no tokens, no direct API credentials). A compromised frontend dependency (a supply-chain attack, Section 24.3) is therefore contained to a materially smaller blast radius than it would be in an architecture where the browser held API credentials directly — this containment is a direct, intended consequence of the BFF pattern, not a separate control.

### 12.3 Client-Side Secrets

No `NEXT_PUBLIC_*` environment variable (the only class of environment variable Next.js ships to the browser bundle) ever contains a credential, API key, or signing secret — this is enforced by a documented allow-list of what may legitimately be `NEXT_PUBLIC_*` (Section 17.4) and a CI check (Section 24.4) scanning for accidental secret exposure in build output.

### 12.4 Third-Party Script Risk

PostHog and Sentry's client-side SDKs (the only third-party client-side code running in the browser context) are configured with input-masking for sensitive fields (`11-frontend-architecture.md` Section 23.5) and are the only two third-party scripts permitted to execute client-side at all — any future proposal to add a third-party client-side script (a marketing pixel, a chat widget) requires explicit security review (Section 30) given that such scripts execute with the same DOM access as first-party code and represent a direct extension of the frontend's trust boundary to a party the platform does not control.

### 12.5 Clipboard and Autofill Security

Payment-adjacent form fields (Section 22.2) disable autofill/autocomplete attributes only where doing so is a genuine security benefit (never for convenience-reducing reasons alone) — specifically, the platform never handles raw card-number input at all (Section 22.2's Razorpay-hosted-fields architecture), which structurally removes the autofill/clipboard-sniffing risk category for payment data entirely rather than mitigating it after the fact.

---

# 13. Backend Security

### 13.1 The Layered Pipeline as a Security Control

Restated from `10-backend-architecture.md` Section 6: every request passes through Origin/CORS validation → Rate Limiting → Authentication → Authorization (coarse) → Input Validation, in that specific, fixed order, before any Service Layer code executes. **Why the order matters:** validating input before confirming the caller is authorized to submit it at all would waste compute on attacker-supplied payloads designed to probe validation behavior; authenticating before rate-limiting would allow an attacker to exhaust authentication-processing resources before ever being throttled. The order itself is a deliberate security control, documented once here so it is never silently reordered by a well-intentioned refactor.

### 13.2 Service Layer as the Business-Rule Security Boundary

Restated from Sections 2.3, 6.1–6.2: the Service Layer is where fine-grained authorization, ownership checks, and business-rule validation (a state-machine transition is actually legal, `01-product-requirements.md` Section 8's state models) are enforced — a Route Handler or Server Action never contains authorization logic inline; it delegates entirely to the Service Layer, which is the only layer permitted to declare "this operation is allowed" or "this operation is denied."

### 13.3 Repository Layer Isolation

The Repository Layer (`10-backend-architecture.md` Section 3.7) is the only code permitted to construct a Drizzle query — no Service Layer function ever bypasses its module's Repository to query the database directly, which is what keeps Section 9.2's parameterization guarantee and Section 6.6's RLS-connection-scoping consistently true across the entire codebase rather than dependent on every individual query site.

### 13.4 Background Job Security (Inngest)

Every Inngest job step re-establishes its own actor context and re-runs the relevant Section 6.2 ownership/authorization checks rather than trusting the context that enqueued it — a job triggered by a buyer action does not inherit that buyer's authorization implicitly; it re-derives what it's permitted to do from the job payload's validated identifiers, exactly matching Section 2.1's Zero Trust principle applied to internal service-to-service execution. Inngest's own dashboard/management interface is protected by its own credential (Section 17), scoped narrowly, and never shared with broader team access than the individuals who operate the job pipeline.

### 13.5 Idempotency as a Security Property

`10-backend-architecture.md` Section 12's idempotency-key architecture (mandatory on payment/order-mutating endpoints) is a security control as much as a reliability one: it is the mechanism that makes safe, automatic retry (Section 8.3's rate-limit-triggered client backoff-and-retry, Section 22.5's webhook-replay handling) possible without risking duplicate financial transactions — every endpoint in `09-api-architecture.md`'s idempotency-required list is treated as a security-review item whenever its implementation changes, not merely a reliability one.

### 13.6 Server-Side Timing Consistency

Authentication-adjacent comparisons (password-hash verification via Argon2id's constant-time comparison, Section 5.2; token comparison in Sections 5.7/6.8's single-use-token validation) use constant-time comparison functions exclusively, never a standard `===`/string-equality check, which can leak information about how much of a secret matched via response-timing differences — this is a well-understood, narrow, but real class of vulnerability (timing side-channel attacks) that Better Auth's built-in primitives handle correctly by default, and no engineer manually re-implements credential comparison logic that would reintroduce this risk.

---

# 14. File Upload Security

### 14.1 Direct-to-R2 Upload Architecture (Security Restatement)

Extends `11-frontend-architecture.md` Section 11.4/21.7: uploads never transit the Next.js application server as a proxy — the browser uploads directly to Cloudflare R2 using a short-lived, narrowly-scoped pre-signed URL obtained from an authenticated, authorized Route Handler. **Why:** this both improves performance (Section 16 of the frontend document) and reduces the application server's exposure to malicious upload payloads, since the server never buffers or processes raw file bytes itself — it only ever issues and validates the *permission* to upload, and separately validates the *result* after the fact (Section 14.4).

### 14.2 Pre-Signed URL Scoping

Every pre-signed upload URL is scoped to: a specific, server-generated object key (Section 9.7 — never client-influenced), a maximum file size (enforced by R2's pre-signed URL policy, not merely a client-side check), an allow-listed set of MIME types appropriate to the upload context (images only for product/creator photography; no executable, script, or archive MIME types accepted anywhere on the platform), and a short expiry (5 minutes) — an unused pre-signed URL cannot be exploited hours or days after issuance.

### 14.3 Image Validation

Beyond MIME-type declaration (which is client-supplied and untrusted on its own), every uploaded image is validated server-side, post-upload, by actually parsing the file's binary header/magic bytes to confirm it is genuinely the image format it claims to be — a file renamed to `.jpg` that is not actually a valid JPEG is rejected and the object deleted from R2, closing the vector where a malicious file (e.g., a script or HTML payload) is uploaded with a spoofed image extension in the hope it is later served or interpreted as something other than an image.

### 14.4 Malware Scanning Architecture

Every uploaded object triggers an asynchronous Inngest job (Section 13.4) that scans the object for known-malicious content before it is marked available for public serving — until that scan completes successfully, the object exists in R2 but is not linked into any publicly-servable Product/Storefront record, and a scan that flags the content quarantines the object (moved to a restricted-access prefix, never deleted outright, preserving it as evidence) and flags the uploading account for Section 20's audit trail and, if the pattern recurs, Section 19's anomaly-detection review. This asynchronous-scan-before-publish pattern is a deliberate architectural choice: scanning synchronously within the upload request would both slow the upload experience and give an attacker real-time signal about the scanning behavior itself.

### 14.5 Metadata Stripping

Uploaded images are stripped of EXIF metadata (GPS coordinates, device identifiers) during the same post-upload processing step that generates the responsive image variants (`11-frontend-architecture.md` Section 16.5) — this is a deliberate privacy control (Section 21) as much as a security one, preventing a creator or buyer from inadvertently disclosing their precise location or device information through an uploaded photo.

### 14.6 Content-Type Enforcement on Serving

When an object is served (via R2's CDN-fronted delivery), the `Content-Type` header is set explicitly from the platform's own validated record of the file's actual type (Section 14.3), never trusted from the originally-uploaded file's client-supplied header — this, combined with `X-Content-Type-Options: nosniff` (Section 11.1) on the serving response, prevents a browser from being tricked into executing an uploaded file as script content regardless of what extension or declared type it originally carried.

### 14.7 Upload Rate Limiting

Upload-URL-issuing endpoints are rate-limited per account (Section 8.3's Standard tier, tightened further for this specific endpoint to 20 pre-signed-URL issuances per hour) to prevent storage-exhaustion and malware-scanning-pipeline-flooding abuse from a single compromised or malicious account.

---

# 15. Storage Security

### 15.1 Cloudflare R2 Access Model

The R2 bucket is **private by default** — no object is publicly readable by its raw R2 URL. Public-facing delivery (product images, storefront banners) is served exclusively through a CDN-fronted, platform-controlled domain that R2 is configured to serve behind, never through directly exposed bucket credentials or a public-bucket-policy shortcut. Write access (object creation) is granted exclusively via the pre-signed-URL mechanism (Section 14.2), scoped per-request; there is no standing, long-lived write credential distributed to any client, first-party or otherwise.

### 15.2 Bucket Segmentation

Distinct logical prefixes (not separate buckets, to keep operational overhead manageable at current scale, but enforced via IAM-equivalent path-scoped policies) separate: publicly-servable, scanned-and-approved media; pending-scan quarantine (Section 14.4); and any future non-media document storage (e.g., a creator's verification evidence, `01-product-requirements.md` Section 7.5) — the latter is never placed in a path reachable by the public-serving CDN configuration at all, since verification evidence is confidential regardless of the scan outcome for the media pipeline it superficially resembles.

### 15.3 Verification Evidence Handling

Creator identity/authenticity verification evidence (Section 5.8) is stored in R2's restricted, non-public prefix, accessible only via short-lived, individually-issued signed read URLs generated on demand for an authorized Admin reviewing a specific application (Section 6.4's Admin role scope) — never via a durable, shareable link, and never rendered directly in a way that would cache the underlying object URL in browser history or a CDN edge cache designed for public content.

### 15.4 Deletion and Retention

Object deletion (a creator removing a product image, an account-deletion cascading cleanup, `01-product-requirements.md` AUTH-07) issues an actual R2 delete request, not merely a database-record removal that leaves the underlying object orphaned and indefinitely retrievable by anyone who retained its object key — orphaned-object cleanup is verified as part of the account/store-deletion Service Layer flow (`10-backend-architecture.md` Section 9's soft-delete model, extended here specifically for the storage layer, where "soft delete" the database row does not mean "leave the R2 object publicly reachable").

### 15.5 Redis (Upstash) Security

Upstash Redis is reachable exclusively from the Next.js application's server-side runtime via a TLS-encrypted connection string held as a secret (Section 17); no client, first-party or third-party, ever connects to Redis directly. Redis holds no data classified above the Section 3.3 "Medium" sensitivity tier by design — session-revocation flags (Section 7.4), rate-limit counters (Section 8.3), and cache entries (`10-backend-architecture.md` Section 14) are all either derived, reconstructable, or short-lived; Redis is explicitly never used as the system of record for anything in the "High" or "Critical" tier (payment data, password hashes, PII), which remain exclusively in Postgres under RLS (Section 6.6) and encryption (Section 16).

---

# 16. Encryption Strategy

### 16.1 Data in Transit

TLS 1.2 minimum (1.3 preferred) on every network hop the platform controls or configures: browser-to-Vercel (Section 8.2), Vercel-to-Supabase (Supabase's connection pooler enforces TLS by default, `10-backend-architecture.md` Section 2.6), Vercel-to-Upstash, Vercel-to-Cloudflare R2, and every outbound call to Razorpay/Resend/PostHog/Sentry (Section 23). No plaintext connection exists anywhere in the platform's data path — this is a configuration-verified property (Section 24.4's CI checks, Section 30's review checklist), not an assumption.

### 16.2 Data at Rest — Database

Supabase Postgres provides disk-level (storage-layer) encryption at rest as a platform-managed default, covering the entire database volume. Beyond that baseline, specific column-level fields classified in the "Critical" tier (Section 3.3) receive **application-layer encryption**, encrypted before the value ever reaches Postgres and decrypted only in the Service Layer function that legitimately needs the plaintext:

| Field Category | Encryption Approach | Rationale |
|---|---|---|
| Creator payout bank account details | Application-layer AES-256-GCM, envelope-encrypted (Section 16.4) | Storage-level encryption alone does not protect against a compromised database credential or a misconfigured backup export exposing readable data; this field warrants a second, independent layer |
| MFA secrets (TOTP seed) | Application-layer AES-256-GCM | A leaked plaintext TOTP seed defeats the entire purpose of Section 5.3's MFA control |
| Government-ID-adjacent creator tax/verification fields | Application-layer AES-256-GCM | Regulatory-sensitivity tier, treated identically to payout details |
| Password hashes | Argon2id (Section 5.2) — a hash, not encryption; explicitly never reversible | Distinguished here to be explicit: hashing and encryption serve different purposes and are never confused in this architecture |
| Ordinary PII (address, phone, email) | Storage-level encryption only (Postgres default) plus RLS (Section 6.6) | Proportionate control for High-tier (not Critical-tier) data — application-layer encryption here would add operational complexity (Section 16.5) disproportionate to the marginal risk reduction, given RLS and access-logging already scope and audit access tightly |

### 16.3 Data at Rest — Object Storage

Cloudflare R2 provides server-side encryption at rest by default for all stored objects, covering both public media (Section 15.1) and the restricted verification-evidence prefix (Section 15.3) identically — the confidentiality control for verification evidence is primarily the access-control model (Section 15.3), with storage-level encryption as a defense-in-depth complement, not the primary control (since the data must remain readable, in decrypted form, to the R2 service layer itself in order to serve authorized requests).

### 16.4 Key Management

Application-layer encryption (Section 16.2) uses envelope encryption: a small number of Data Encryption Keys (DEKs) — never a single platform-wide key — encrypt the actual field values, and the DEKs themselves are encrypted by a Key Encryption Key (KEK) held in the platform's secrets manager (Section 17.2), never co-located in the same datastore as the data it protects. DEK rotation is scheduled (annually, or immediately upon any suspected compromise per Section 26) and implemented as a re-encryption background job (Inngest, Section 13.4) that re-wraps existing ciphertext under a new DEK without requiring a full plaintext data migration — old DEKs are retained, encrypted under the current KEK, only long enough to decrypt any not-yet-migrated records, then destroyed.

### 16.5 Encryption Operational Discipline

Every application-layer encryption/decryption call is centralized in a single, well-tested `packages`-equivalent backend module (mirroring `10-backend-architecture.md` Section 3's shared-module pattern) — no Service Layer function implements its own cryptographic primitive calls directly, which is what prevents the two most common real-world cryptography implementation failures: inconsistent IV/nonce handling across call sites, and silent algorithm/parameter drift as the codebase grows.

### 16.6 Transport-Layer Certificate Management

TLS certificates for all first-party domains are provisioned and auto-renewed by Vercel's platform-managed certificate issuance (Section 8.2's TLS enforcement is meaningless without this); certificate expiry is additionally monitored independently (Section 19.4) as a defense-in-depth check against a platform-level renewal failure going unnoticed.

---

# 17. Secrets Management

### 17.1 Secrets Inventory (Representative)

| Secret Category | Examples | Access Scope |
|---|---|---|
| Database credentials | Supabase connection string (pooled + direct) | Application server runtime only |
| Auth signing keys | Better Auth JWT signing secret | Application server runtime only |
| Payment credentials | Razorpay API key/secret, webhook signing secret | Application server runtime only (Section 22) |
| Storage credentials | Cloudflare R2 access key/secret | Application server runtime only |
| Cache credentials | Upstash Redis connection URL | Application server runtime only |
| Email credentials | Resend API key | Application server runtime only |
| Background job credentials | Inngest signing/event key | Application server runtime and CI (job registration) only |
| Monitoring credentials | Sentry DSN, PostHog API key | Split: a public, intentionally-exposable client key (Section 12.3) and a separate, private server-side key with elevated access |
| Encryption keys | KEK (Section 16.4) | A narrower scope than general application secrets — accessible only to the specific encryption module (Section 16.5), never broadly injected into the general runtime environment where feasible to avoid |

### 17.2 Secrets Storage

All secrets are stored exclusively in Vercel's encrypted environment-variable store (or, for the KEK specifically, a dedicated secrets-management service if the platform's growth warrants stronger key-isolation guarantees than Vercel's general environment-variable store provides — evaluated as a near-term hardening item, Section 31) — never committed to source control under any circumstance, never placed in a `.env` file tracked by git, and never logged (Section 20.4's redaction rule applies to any value matching a secrets-pattern heuristic as an additional safety net beyond disciplined logging practice).

### 17.3 Environment Separation

Development, Preview (per-PR, Vercel's preview-deployment model), and Production environments hold **entirely distinct** credential sets for every integration in Section 17.1 — a Preview deployment never has access to production Razorpay, Resend, or database credentials, both to prevent a compromised or misconfigured preview environment from affecting production data, and to prevent development/testing activity (test payments, test emails) from ever reaching real users or real financial rails.

### 17.4 Client-Exposed Configuration

Only the narrow, explicitly reviewed set of values that are genuinely safe for public exposure (Section 12.3) — Sentry's public DSN, PostHog's public project key, Razorpay's *publishable* (not secret) key used to initialize their client-side hosted-fields widget (Section 22.2) — are ever configured as `NEXT_PUBLIC_*` variables; this allow-list is documented explicitly and reviewed whenever a new `NEXT_PUBLIC_*` variable is proposed (Section 30).

### 17.5 Secret Rotation

Every credential in Section 17.1 has a defined rotation cadence (90 days for standard API keys, immediately upon any suspected exposure per Section 26, annually at minimum for the KEK per Section 16.4) and a documented rotation procedure that updates the credential in Vercel's environment store and confirms successful application restart/pickup **before** the old credential is revoked at the provider — avoiding a rotation-induced outage where the new credential isn't yet live and the old one has already been invalidated.

### 17.6 Access to Secrets Management Tooling

Access to Vercel's environment-variable configuration UI (and any future dedicated secrets-management service) is restricted to a small, named set of engineers (platform/DevOps leads and, for production specifically, an even narrower subset) — this access list is itself subject to the same least-privilege (Section 2.3) and audit (Section 20) discipline as any other sensitive platform capability, reviewed on a regular cadence for continued necessity.

### 17.7 Local Development Secrets

Local development uses either a shared, non-production "development" credential set (Section 17.3) distributed via a secured, access-controlled channel (never Slack/email/plaintext chat) or, preferably, fully mocked/sandboxed equivalents (a local Postgres instance, Razorpay's test-mode keys, Resend's test mode) — no engineer's local machine ever holds a production secret under any normal workflow.

---

# 18. Infrastructure Security

### 18.1 Platform Trust Model

The platform relies on Vercel (compute/edge), Supabase (managed Postgres), Cloudflare (R2 storage), and Upstash (managed Redis) as trusted infrastructure providers — their own platform-level security (physical security, hypervisor isolation, provider-side patching) is accepted as a foundation the same way any modern cloud-native architecture accepts its infrastructure providers' shared-responsibility model, evaluated as part of third-party/vendor risk (Section 23.6) rather than re-implemented.

### 18.2 Network Exposure Minimization

Supabase Postgres is not directly internet-reachable in an unrestricted sense — connections are mediated through Supabase's connection pooler, and, where the platform's growth and Supabase's tier support it, IP allow-listing restricts direct-database-connection-string usage to Vercel's known egress ranges and specifically-authorized operator tooling (e.g., a database-administration client used by a senior engineer for migrations, itself subject to Section 17.6's access discipline). Upstash Redis and Cloudflare R2 are similarly reachable only via authenticated, credentialed connections — neither service is configured for anonymous/public network access at the infrastructure layer.

### 18.3 Principle of Least Infrastructure Privilege

The application's database connection role (Section 6.6) has exactly the privileges required for normal operation (`SELECT`/`INSERT`/`UPDATE`/`DELETE` on application tables, subject to RLS) and explicitly lacks schema-modification privileges (`CREATE`/`ALTER`/`DROP`) in production — schema migrations (`10-backend-architecture.md` Section 2.8) run under a separate, more privileged, and more tightly access-controlled migration role, invoked only through the CI/CD pipeline's controlled migration step (Section 24.5), never via the application's standing runtime credential.

### 18.4 Configuration Drift Prevention

Infrastructure and platform configuration (Vercel project settings, Supabase RLS policies, CSP headers) is defined as code wherever the respective platform supports it (Vercel's `next.config.ts`/`vercel.json`, Supabase migration-managed RLS policy definitions) rather than configured ad hoc through a web console with no change history — this ensures every security-relevant configuration change goes through the same CI/CD review process (Section 24) as application code, rather than existing as an unreviewed, undocumented manual change.

### 18.5 Multi-Tenancy Isolation (Restated)

The platform's tenancy model — many creators and buyers sharing one application and one database — relies on Section 6.6's RLS as its primary tenant-isolation control; this is explicitly named here as an infrastructure-security property, since a multi-tenant SaaS platform's single most consequential infrastructure-level risk is cross-tenant data leakage, and this document's answer to that risk is architectural (RLS + Service Layer authorization, Sections 6.1–6.6), not merely operational.

---

# 19. Monitoring & Detection

### 19.1 Security Event Pipeline

Extends `10-backend-architecture.md` Section 18's observability architecture with a security-specific event class: a `SecurityEvent` (`08-database-design.md` Section 23.5) is emitted for every authentication failure (Section 5.9), every authorization denial (Section 6), every rate-limit rejection above the routine-burst threshold (Section 8.3), every file-upload scan flag (Section 14.4), and every detected refresh-token reuse (Section 7.3) — each carries the acting identity (or `null` for unauthenticated), IP, correlation ID, and event-specific context, feeding both Section 20's audit trail and this section's real-time detection layer.

### 19.2 Threat Detection Rules

| Signal | Detection Rule | Response |
|---|---|---|
| Failed logins | 10+ failed attempts against one account within 1 hour | Automatic lockout (Section 5.10); alert if pattern spans many accounts from one IP (credential-stuffing signature) |
| Authorization denials | 20+ `403` responses from one account within 10 minutes | Flag for review — a legitimate user rarely triggers this volume of denied requests; suggestive of probing/IDOR attempts |
| Geographic/device anomaly | Session refresh from a materially different fingerprint (Section 5.11) combined with a new, unrecognized geolocation | Elevated `SecurityEvent` severity, optional step-up verification prompt (near-term MFA-adjacent enhancement, Section 31) |
| Payment velocity | Multiple failed payment attempts across different cards from one account/session in a short window | Card-testing-fraud signature (Section 22.6) — automatic temporary checkout throttling |
| Webhook anomaly | A webhook payload failing signature verification (Section 22.4) | Immediate rejection and Critical-severity alert — a plausible active-attack signal, not routine noise |
| Mass data access | An internal role account issuing an unusually high volume of resource-detail reads in a short window | Flag for Section 26 review — potential insider-threat or compromised-internal-account exfiltration pattern |

### 19.3 Alerting and Severity

Security events are triaged using the same severity framework referenced in `11-frontend-architecture.md` Section 23.4, extended here as the authoritative definition: **Critical** (active exploitation signal — webhook forgery, confirmed session hijack, RLS/authorization bypass) pages on-call immediately; **High** (strong abuse signal — credential-stuffing pattern, repeated IDOR probing) alerts within the hour during business hours, immediately outside them if volume is significant; **Medium/Low** (routine rate-limit hits, isolated failed logins) are aggregated into daily/weekly security review rather than individually alerted, to keep signal-to-noise high enough that Critical/High alerts are never missed amid low-value noise.

### 19.4 Infrastructure and Certificate Monitoring

Beyond application-level detection, platform-level health is monitored independently: TLS certificate expiry (Section 16.6), Supabase/Upstash/R2 service-health status, and dependency-vulnerability feeds (Section 27.2) — each with its own alerting path, since an infrastructure-level failure (an expiring certificate, a provider outage) is a distinct failure mode from an application-level security event and should not be silently folded into the same alert stream where it could be missed.

### 19.5 OpenTelemetry as the Correlation Backbone

Every security event, application log entry, and trace span shares the platform's correlation ID (`10-backend-architecture.md` Section 18.5, `09-api-architecture.md` Section 2.18) end to end through the OpenTelemetry pipeline — this is what makes real incident investigation (Section 26) tractable: a single suspicious `SecurityEvent` can be traced forward and backward through the exact sequence of application logic, database queries, and third-party calls that produced it, rather than requiring manual, error-prone log correlation across disconnected systems.

---

# 20. Audit Logging

### 20.1 What Is Audited

Every action listed in `08-database-design.md` Section 23's `AuditLog` entity design: all internal-role actions (Admin/Moderator/Support, without exception), every state transition on Orders/Payments/Refunds/Verification (`01-product-requirements.md` Section 8's state models), every authentication and session-lifecycle event (Section 5, 7), every permission/role change (Section 6.3–6.5), and every access to Section 3.3's Critical-tier data fields, including *read* access, not only writes — reading a creator's payout bank details or a buyer's full order history from an internal tool is itself an audited event, since unauthorized *disclosure* (Section 3.5's Information Disclosure category) is a real risk independent of whether any data was modified.

### 20.2 Audit Log Immutability

**What the rule is:** audit log entries are append-only — no application code path, including Admin/Super Admin tooling, ever updates or deletes an existing `AuditLog` row. **Why it exists:** an audit trail that can be edited by the same roles it is meant to hold accountable (Section 2.6's Assume Breach, applied specifically to the insider-threat actor in Section 3.2) provides no real evidentiary value — non-repudiation (Section 3.5's Repudiation category) requires that the record of an action survive independent of the actor who performed it. **How every engineer implements it:** the `AuditLog` table has no `UPDATE`/`DELETE` grant for the application's standard database role at all (Section 18.3's least-privilege principle applied here specifically) — enforced at the database permission level, not merely by application-code convention, so that even a Service Layer bug could not accidentally violate it.

### 20.3 Audit Severity and Retention

| Severity | Examples | Retention |
|---|---|---|
| **Critical** | Super Admin policy changes, account termination, payment/refund actions, MFA/security-setting changes, RLS or permission-model changes | 7 years (aligned with the longer end of financial-record retention expectations, Section 21.5) |
| **High** | Admin/Moderator actions (approval, suspension, content removal), authentication events, permission grants | 3 years |
| **Standard** | Routine internal-role reads of Standard/Medium-tier data, ordinary state transitions | 1 year |

Retention periods are enforced by an automated Inngest job (Section 13.4), never manual deletion — and even at the end of a retention period, Critical-tier entries tied to an active legal hold or ongoing investigation (Section 26) are excluded from automated purge until that hold is explicitly lifted.

### 20.4 Sensitive Data Redaction in Logs

**What the rule is:** audit and application logs never contain raw passwords, tokens, full payment-card numbers, or full government-ID-adjacent values — logging middleware (`10-backend-architecture.md` Section 18) redacts known-sensitive field names automatically (a deny-list of field-name patterns: `password`, `token`, `secret`, `cardNumber`, etc.) as a defense-in-depth backstop, in addition to the primary control of simply never passing such values into a log call to begin with. **Common mistake:** logging an entire request/response object "for debugging" without first stripping sensitive fields — this is exactly the pattern the redaction middleware exists to catch, but engineers are still expected to never rely on the backstop as the primary safeguard.

### 20.5 Chain of Custody for Investigations

When an audit trail is pulled for an incident investigation (Section 26) or a legal/regulatory request (Section 21), the export process itself is logged (an audit log entry recording that audit logs were accessed and by whom) — maintaining an unbroken chain of accountability even for the act of reviewing accountability records.

### 20.6 Audit Log Access Control

Read access to the `AuditLog` table is restricted to Admin and Super Admin roles (Section 6.4), with Super-Admin-only access to logs recording *other* Admins' actions specifically — this prevents a scenario where a single compromised or malicious Admin account could both act and quietly erase or review-and-conceal evidence of having acted, since reviewing another Admin's audit trail requires the higher-privilege role.

---

# 21. Privacy & Compliance

### 21.1 Privacy Architecture Principles

Extends `10-backend-architecture.md` Section 9's soft-delete/data-lifecycle model with the platform's full privacy posture: data is collected only for a stated, legitimate purpose (`01-product-requirements.md` LEGAL-01's Terms/Privacy consent capture), retained only as long as that purpose or a legal retention obligation requires (Section 20.3's audit-log retention table is one concrete instance of this general principle), and never repurposed for an undisclosed use without renewed consent (`06-design-system.md` Section 10.10's data-usage transparency principle, given a concrete compliance backing here).

### 21.2 GDPR/Data-Subject-Rights Readiness

Though the platform's initial launch market may not mandate GDPR directly, the architecture is built GDPR-ready rather than GDPR-absent, consistent with `01-product-requirements.md` Section 12's assumption that broader market expansion is a near-term possibility: the platform supports, as first-class Service Layer capabilities (not future work), **right to access** (a data-export function producing a complete, structured record of everything held about a data subject), **right to erasure** (the account-deletion flow, `01-product-requirements.md` AUTH-07, extended to genuinely remove or irreversibly anonymize personal data once legal/financial retention obligations are satisfied — Section 21.5), **right to rectification** (standard profile-editing capability, already present), and **right to data portability** (the same export function in a structured, machine-readable format).

### 21.3 Consent Management

Every consent event (Terms/Privacy acceptance, marketing-communication opt-in, `01-product-requirements.md` NOTIF-02) is recorded with a timestamp and the specific document version accepted (`01-product-requirements.md` LEGAL-01), stored durably and treated as itself an audit-relevant record (Section 20) — a consent state is never inferred or assumed; it is always a specific, timestamped, versioned record the platform can produce on request.

### 21.4 Data Minimization

Every Service Layer function and API response schema (Section 8.7) is reviewed for whether it requests or returns more data than its specific purpose requires — a Support Executive's ticket-resolution view (`01-product-requirements.md` SUPP-02) surfaces only the order/account fields relevant to that ticket's category, not a full account dossier, directly implementing the platform's stated "scoped access" design intent as an enforced technical property, not merely a documented aspiration.

### 21.5 Data Retention and Deletion

| Data Category | Retention Trigger | Deletion/Anonymization Behavior |
|---|---|---|
| Active account data | Duration of active account | Retained fully while account is active |
| Deleted-account personal data | Account deletion request, minus any active-order/dispute/payout block (`01-product-requirements.md` AUTH-07) | PII fields anonymized/nulled; transactional records (orders, payment history) retained in a de-identified form to satisfy financial/tax record-keeping obligations |
| Financial transaction records | Regulatory requirement (typically 7 years for payment/tax records in most applicable jurisdictions) | Retained in full for the statutory period regardless of account-deletion status, de-identified from the buyer's *profile* but not from the transaction's own required financial detail |
| Audit logs | Section 20.3's severity-based schedule | Automated purge past retention period, subject to legal-hold exceptions (Section 20.3) |
| Uploaded media (deleted listings) | Listing/store deletion | R2 object deletion (Section 15.4), not merely a database-record soft-delete |

### 21.6 Right to Erasure vs. Financial Record-Keeping — The Explicit Tension and Its Resolution

**What the rule is:** account deletion anonymizes the personal-identity layer of a buyer's or creator's data (name, contact details, address) while preserving the transactional-financial layer (order amounts, tax-relevant records) in a de-identified form. **Why:** these two obligations — the right to erasure and mandatory financial record retention — are in genuine tension, and this architecture resolves it by separating *identity* from *transaction record* at the data-modeling level (`08-database-design.md`'s entity design already supports this separation), so erasure can satisfy the former without violating the latter. This resolution is documented explicitly here so no engineer independently "solves" this tension differently in a specific feature, which would produce inconsistent compliance behavior across the platform.

### 21.7 Cross-Border Data Transfer

All primary data stores (Supabase Postgres, Cloudflare R2, Upstash Redis) are provisioned in a specific, documented region aligned with the platform's primary launch market; any future multi-region expansion (`04-information-architecture.md` Section 21's International future-readiness) triggers a dedicated data-residency and cross-border-transfer review before regional data stores are introduced — not assumed to be automatically compliant by virtue of the platform's existing single-region architecture.

### 21.8 Privacy by Design in New Features

Every new feature proposal that collects, stores, or processes personal data is evaluated against Section 21.1's principles at design time (folded into Section 30's review checklist) — privacy review is not a separate, sequential gate after a feature is built, but a standing question asked alongside every other architectural consideration in this document.

---

# 22. Payment Security

### 22.1 Payment Architecture Boundary

The platform **never** handles, stores, or transmits raw payment-card data at any point — Razorpay's hosted-fields/Checkout widget (client-side, rendered in an iframe Razorpay controls) captures card details directly into Razorpay's own PCI-DSS-compliant infrastructure; the platform's frontend and backend only ever handle a Razorpay-generated, non-reversible payment token/order reference. This architectural choice removes the platform from PCI-DSS Scope entirely for cardholder data (a SAQ-A-eligible posture, the lightest PCI compliance tier, achievable specifically because raw card data never transits or is stored by the platform's own systems) — restated here as the single most consequential payment-security decision in this document, since every other control in this section operates downstream of this boundary already being correctly drawn.

### 22.2 Client-Side Payment Handling

The Buyer app's Checkout (`11-frontend-architecture.md` Section 10.3) initializes Razorpay's client-side SDK using only the *publishable* key (Section 17.4) and renders Razorpay's own hosted payment-input UI — the platform's own form components (Section 11 of the design system) never directly capture a card number, CVV, or expiry field; Razorpay's widget owns that entire interaction surface, consistent with Section 22.1's PCI-scope-avoidance architecture.

### 22.3 Server-Side Payment Verification

**What the rule is:** a payment is never considered successful based on a client-side callback or redirect alone — the backend independently verifies payment status by calling Razorpay's server-to-server verification API (using the platform's *secret* key, held exclusively server-side per Section 17.1) before marking an order as paid. **Why it exists:** a client-side success callback is fully within an attacker's control to forge (a manipulated browser could simply invoke the "payment succeeded" callback without ever completing a real payment) — server-side verification against Razorpay's own API is the only trustworthy source of truth for payment state, directly implementing `09-api-architecture.md`'s payment-domain contract and `10-backend-architecture.md`'s stated principle that financial state transitions are never client-asserted.

### 22.4 Webhook Signature Verification

**What the rule is:** every incoming Razorpay webhook's payload signature is verified against the webhook signing secret (Section 17.1) before the payload is parsed or acted upon in any way — an unverified or invalid signature results in immediate rejection (`401`/`400`, per `09-api-architecture.md` Section 21) with no further processing, logged as a Critical `SecurityEvent` (Section 19.2's webhook-anomaly row). **Why it exists:** the webhook endpoint is, from an external network perspective, just another internet-facing URL (Section 4.5) — without signature verification, any party who discovers the endpoint could forge a "payment succeeded" event and cause the platform to release goods, mark orders complete, or trigger a creator payout for a payment that never actually occurred. **How every engineer implements it:** signature verification happens in a single, shared webhook-ingestion module (`10-backend-architecture.md` Section 16), never re-implemented per webhook handler, using constant-time comparison (Section 13.6) for the signature check itself.

### 22.5 Webhook Replay Protection

Beyond signature verification, every processed webhook's unique event ID (Razorpay's own idempotent event identifier) is recorded and checked against prior processed events before any state change is applied — a webhook delivered twice (Razorpay's own at-least-once delivery guarantee, combined with the platform's own retry-safe idempotent processing per `10-backend-architecture.md` Section 12) is processed exactly once in its actual effect, and a *maliciously* replayed, previously-valid, correctly-signed webhook (captured and resent by an attacker who observed it in transit, despite Section 16.1's TLS protection reducing this risk substantially) is rejected as a duplicate rather than reapplied. Webhook events additionally carry a timestamp validated against a reasonable freshness window (rejecting a signed-but-stale event beyond, for example, 5 minutes old) as a further replay-window reduction.

### 22.6 Fraud Detection

Payment-velocity monitoring (Section 19.2's payment-velocity row) flags: multiple distinct cards attempted from one account/session in a short window (card-testing signature), a new account attempting an unusually high-value first purchase, and mismatched billing-signal patterns (`01-product-requirements.md` Section 7.18's fraud-prevention business rules, given their concrete technical implementation here) — flagged transactions are held for a brief automated or manual review rather than auto-approved, consistent with `01-product-requirements.md` PAY-03's payment-hold-until-fulfillment-confirmed business rule already providing a natural buffer point for this review to occur within.

### 22.7 Creator Payout Security

Payout bank-account details are application-layer-encrypted at rest (Section 16.2), and any *change* to a creator's registered payout account triggers a mandatory hold period (a defined number of days, e.g., 3–7, during which no payout is released to the newly-registered account) plus a notification to the account's verified email and, where phone verification exists (Section 5.6), an SMS alert — this hold-and-notify pattern is the platform's primary control against payout-redirection fraud, where an attacker who has compromised a creator account attempts to silently redirect future earnings to a different bank account before the legitimate creator notices.

### 22.8 Refund Security

Refund issuance (`01-product-requirements.md` PAY-05) is restricted to Admin/Support roles operating within their defined authority limits (Section 6.4) and is always issued to the **original payment method**, never to an alternate account or payment instrument supplied after the fact — this closes a common refund-fraud vector where an attacker (an internal-role account compromise, or a social-engineering attempt against Support) attempts to redirect a refund to a destination other than where the original payment came from.

---

# 23. Third-Party Integration Security

### 23.1 Integration Inventory and Risk Tier

| Integration | Purpose | Data Exposed | Risk Tier |
|---|---|---|---|
| Razorpay | Payments | Order amounts, buyer identity references, payment tokens (never raw card data, Section 22.1) | Critical |
| Resend | Transactional email | Buyer/creator email addresses, order/account content within email bodies | High |
| Cloudflare R2 | Object storage | All uploaded media (Section 15) | High |
| Upstash Redis | Caching, rate limiting, sessions | Ephemeral, non-Critical-tier data (Section 15.5) | Medium |
| Inngest | Background job orchestration | Whatever payload each job legitimately requires — scoped per job, not a blanket data feed | Medium |
| Sentry | Error monitoring | Error context, potentially including request metadata (scrubbed per Section 23.4) | Medium |
| PostHog | Product analytics | Behavioral/usage events, explicitly excluding Checkout/Payment screens and masked sensitive fields (`11-frontend-architecture.md` Section 23.5) | Medium |

### 23.2 Vendor Security Evaluation

Every integration in Section 23.1 was selected with its own security/compliance posture as an explicit input (Razorpay's PCI-DSS Level 1 certification underpins Section 22.1's scope-avoidance architecture; Supabase/Vercel/Cloudflare/Upstash's respective SOC 2-class attestations underpin Section 18.1's infrastructure trust model) — any future integration proposal is evaluated against the same bar (data handled, certifications held, breach-history transparency, data-processing-agreement availability) before being added to this inventory, not adopted purely on functional merit.

### 23.3 Least-Privilege Third-Party Credentials

Every third-party API credential (Section 17.1) is scoped to the minimum capability that integration requires — Resend's API key is scoped to send-only (no account-management capability); Cloudflare R2's credential is scoped to the specific bucket, not account-wide storage access; PostHog and Sentry's server-side keys are scoped to event-ingestion/error-reporting, never granted broader project-administration capability through the credential the running application holds.

### 23.4 Outbound Data Minimization

Data sent to third parties is minimized to what each integration's specific function requires — Sentry's error-reporting integration is configured to scrub known-sensitive field patterns (Section 20.4's redaction deny-list, applied identically here) from error context before transmission; PostHog's event schema (`11-frontend-architecture.md` Section 23.2) is a deliberately defined, reviewed set of fields, never a blanket "send the whole request/response object" integration pattern.

### 23.5 Third-Party Failure Isolation

Every third-party call is wrapped with the timeout and circuit-breaker behavior defined in `10-backend-architecture.md` Section 17.2–17.5 — restated here as a security property, not only a reliability one: an unresponsive or compromised third party must never be able to hang or otherwise degrade the platform's own request-handling in a way that could be leveraged as part of a denial-of-service chain, and a third party returning unexpected/malformed data is never trusted without the same input-validation discipline (Section 8.4) applied to any other untrusted input source.

### 23.6 Vendor Risk Review Cadence

The Section 23.1 inventory and each vendor's security posture is reviewed at a minimum annual cadence (more frequently for Critical-tier vendors, i.e., Razorpay) — checking for any material change in that vendor's own security posture, certification status, or publicly disclosed incidents, and re-evaluating whether the platform's integration-level controls (Sections 23.3–23.5) remain sufficient.

---

# 24. CI/CD Security

### 24.1 Pipeline Trust Model

The CI/CD pipeline (building, testing, and deploying every one of the three Next.js apps to Vercel) is itself treated as a privileged system requiring the same rigor as production infrastructure — a compromised pipeline can inject malicious code into every deployment it produces, making it, from a threat-model perspective (Section 3.4), as sensitive as the production environment it deploys into.

### 24.2 Branch Protection and Review Requirements

No code reaches the `main` branch (and therefore no code is deployed to production) without: passing all automated checks (Section 22 of `11-frontend-architecture.md` — unit, integration, accessibility, E2E, and performance tests; this document's Section 28's security-specific checks), and at least one human code review satisfying `10-backend-architecture.md` Section 27/`11-frontend-architecture.md` Section 27's review checklists, which explicitly include this document's Section 30 items for any security-relevant change. Direct pushes to `main` are disabled at the repository-configuration level, not merely discouraged by convention.

### 24.3 Dependency Supply-Chain Security

Every dependency addition (npm package, for both frontend and backend, since both share the Next.js/TypeScript ecosystem) is checked by an automated Software Composition Analysis tool (integrated into CI) against known-vulnerability databases before merge; lockfiles (`package-lock.json`/equivalent) are committed and enforced (`npm ci`, never `npm install`, in CI) so the exact dependency tree that passed review is the exact tree that deploys, eliminating drift between what was reviewed and what ships. New dependencies from unfamiliar or low-reputation publishers (low download count, recently transferred ownership, no meaningful commit history) are flagged for explicit senior-engineer review before adoption, given the well-documented rise of supply-chain attacks specifically targeting popular open-source package ecosystems via exactly this vector.

### 24.4 Build-Time Secret Scanning

Every CI run scans both the committed source and the build output for accidentally-committed secrets (API keys, connection strings) using a pattern-based secret-scanning tool, and separately verifies (Section 12.3) that no `NEXT_PUBLIC_*` variable outside the documented allow-list (Section 17.4) is present in the client-side build bundle — both checks are build-blocking, not advisory.

### 24.5 Migration Pipeline Security

Database schema migrations (`10-backend-architecture.md` Section 2.8) run through a dedicated, controlled CI/CD step using the elevated migration role (Section 18.3), never manually against production from an engineer's local machine — this ensures every schema change is reviewed (Section 24.2), versioned, and auditable in the same way as application code, and that the elevated migration credential is never distributed to individual developer workstations.

### 24.6 Deployment Environment Isolation

Preview deployments (one per pull request, Vercel's standard model) are publicly reachable by URL but use entirely separate credentials from production (Section 17.3) and connect to a separate, non-production database/storage/cache instance — a Preview deployment compromise or misconfiguration cannot reach production data as a structural property of environment separation, not merely a configuration convention.

### 24.7 CI/CD Credential Scope

The CI/CD system's own credentials (Vercel deployment tokens, database migration credentials, Section 17.1's various API keys as needed for integration tests against sandboxed/test-mode third-party endpoints) are scoped as narrowly as each pipeline step requires and stored in the CI platform's own encrypted secrets store — never printed to build logs (Section 20.4's redaction discipline extended to CI output specifically) and never accessible to a pipeline step that doesn't explicitly declare a need for that specific credential.

### 24.8 Post-Deployment Verification

Every production deployment is followed by an automated smoke-test suite verifying core critical paths (authentication, checkout availability, key API health) before the deployment is considered complete — a failed post-deployment check triggers an automatic rollback to the prior known-good deployment (Vercel's instant-rollback capability), rather than leaving a potentially broken or insecurely-configured deployment live while a human investigates.

---

# 25. Backup & Disaster Recovery

### 25.1 Backup Scope and Cadence

Supabase Postgres's continuous backup/point-in-time-recovery capability is enabled, providing recovery to any point within a defined retention window (a minimum of 30 days, extended further for compliance-relevant data per Section 21.5's retention obligations); Cloudflare R2 objects are protected against accidental deletion via Section 15.4's deliberate-deletion-only pattern (no bulk/automated deletion path exists outside explicit, audited Service Layer flows) combined with R2's own versioning capability enabled on the bucket, providing a recovery path for accidental or malicious object overwrite/deletion independent of the application-level safeguards.

### 25.2 Backup Encryption and Access

Backups inherit the same at-rest encryption guarantees as the live data they're derived from (Section 16.2–16.3) — a backup is never a lower-security-posture copy of the data it protects. Access to restore from backup is restricted to the same narrow, named set of engineers with production infrastructure access (Section 17.6), and any restore operation is itself logged and treated as a Critical-severity operational event, both because a restore is a powerful capability (it can overwrite current state) and because the *need* to restore is frequently itself evidence of an incident (Section 26) warranting investigation.

### 25.3 Backup Integrity Verification

Backup restorability is verified on a regular cadence (quarterly, at minimum) via an actual test restore into an isolated, non-production environment — an untested backup is not a reliable recovery capability, and this verification is treated as a required operational practice, not an assumed property of having backups configured.

### 25.4 Recovery Time and Recovery Point Objectives

The platform's stated targets: **RPO (Recovery Point Objective)** of under 5 minutes for the primary database (achievable via point-in-time recovery's continuous WAL-based backup model) and **RTO (Recovery Time Objective)** of under 4 hours for full-platform restoration in a genuine disaster scenario (full regional provider outage requiring restoration into a new environment) — these targets are documented explicitly here so that Section 25.1's backup configuration and Section 26's incident-response procedure are both designed and rehearsed against a concrete, agreed bar, not an implicit, untested assumption.

### 25.5 Disaster Recovery Rehearsal

A full disaster-recovery rehearsal (restoring a complete, isolated environment from backup and verifying application functionality against it) is conducted at minimum annually, with findings feeding back into Section 25.1–25.4's targets and procedures — the platform does not consider disaster recovery a solved problem based on backup configuration alone; it is verified as an actually-executable procedure.

### 25.6 Ransomware and Destructive-Attack Resilience

Section 25.1's point-in-time recovery capability and R2 versioning are specifically the platform's primary control against a scenario where an attacker (external, or a compromised/malicious internal account, Section 3.2) attempts mass data destruction or encryption-for-ransom — because backups are continuous, encrypted, and access-restricted independently of the application's own runtime credentials (Section 18.3's least-privilege principle meaning even a fully compromised application runtime credential cannot itself delete backup history), the platform retains a recovery path that does not depend on the attacker's cooperation.

---

# 26. Incident Response

### 26.1 Incident Response Philosophy

Extends Section 2.6's Assume Breach principle into an operational procedure: the platform assumes that despite every control in this document, an incident will eventually occur, and is prepared to detect, contain, eradicate, and recover from one with a documented, rehearsed process rather than improvisation under pressure.

### 26.2 Incident Classification

| Severity | Definition | Examples | Initial Response Time |
|---|---|---|---|
| **SEV-1 (Critical)** | Active exploitation, confirmed data breach, payment-system compromise, platform-wide outage with security implications | Confirmed unauthorized access to Critical-tier data; webhook forgery causing fraudulent payouts | Immediate — on-call paged, incident commander assigned within 15 minutes |
| **SEV-2 (High)** | Strong evidence of attempted or partial compromise, contained but significant | Detected but blocked mass-exfiltration attempt; a single account confirmed compromised with limited blast radius | Within 1 hour |
| **SEV-3 (Medium)** | Suspicious activity requiring investigation, no confirmed compromise | Anomalous access pattern under Section 19.2 review, unconfirmed | Within 1 business day |
| **SEV-4 (Low)** | Routine security-relevant events, no individual response required | Isolated failed-login clusters, routine rate-limit hits | Aggregated into regular security review (Section 19.3) |

### 26.3 Incident Response Roles

**Incident Commander** (rotating on-call senior engineer): owns the response, coordinates communication, and makes containment decisions. **Technical Lead**: executes investigation and containment actions within their domain (database, application, infrastructure). **Communications Lead** (for SEV-1/SEV-2 with user impact): owns internal stakeholder and, where warranted, external/regulatory/user communication. A single engineer may hold multiple roles for a SEV-3/4 incident; SEV-1 incidents always have distinct individuals in each role to avoid the incident commander being consumed by hands-on technical work at the expense of coordination.

### 26.4 Incident Response Phases

```
Detection → Triage/Classification (Section 26.2) → Containment → Eradication → Recovery → Post-Incident Review (Section 26.6)
```

**Containment** prioritizes stopping ongoing harm over preserving convenience — a compromised credential is revoked immediately (Section 7.4's session-revocation and Section 17.5's emergency-rotation capability exist specifically to make this fast), even before root cause is fully understood, consistent with Section 2.5's fail-closed philosophy applied at the operational level. **Eradication** removes the actual vulnerability or attacker foothold (a patched dependency, a corrected authorization check, a revoked and reissued credential). **Recovery** restores normal operation, verified against Section 25.4's RTO/RPO targets where a restore was required.

### 26.5 Evidence Preservation

Section 20's immutable audit log and Section 19.5's correlation-ID-linked observability data are the platform's primary forensic evidence sources during an investigation — Section 26.4's containment actions are performed in a way that preserves this evidence (e.g., revoking a credential rather than deleting the account associated with it, which would destroy investigative context) wherever containment and evidence preservation are not in direct conflict; where they are (an active, ongoing exfiltration that must be stopped immediately), containment takes priority, consistent with the harm-reduction-first ordering in Section 26.4.

### 26.6 Post-Incident Review

Every SEV-1 and SEV-2 incident receives a blameless post-incident review within 5 business days of resolution, producing a written record of timeline, root cause, containment/recovery actions taken, and — critically — specific, owned, tracked follow-up items closing the gap that allowed the incident, which are fed back into this document as dated revisions where they represent a genuine architectural change, not merely a one-off fix.

### 26.7 User and Regulatory Notification

Where an incident involves confirmed unauthorized access to personal data, notification obligations (to affected users and, where applicable, regulatory bodies per Section 21.2's compliance posture) are evaluated against the specific jurisdictions and data categories involved, with the Communications Lead role (Section 26.3) owning execution — notification content is factual, specific about what data was involved and what action affected users should take, consistent with `05-design-principles.md` Section 10.12's transparency principle applied to the platform's most difficult communication moment.

---

# 27. Vulnerability Management

### 27.1 Vulnerability Sources

Automated dependency scanning (Section 24.3, continuous, not point-in-time), periodic penetration testing (Section 28.3), internal code review findings, responsible-disclosure reports (Section 27.5), and Section 19's active-monitoring signals collectively feed one unified vulnerability-tracking process rather than being handled as disconnected, ad hoc concerns per source.

### 27.2 Severity Scoring and SLA

Vulnerabilities are scored using CVSS (Common Vulnerability Scoring System) as a consistent, comparable baseline, with remediation SLAs tied to score and to the specific data/system sensitivity affected (Section 3.3's tiering) — a Critical-CVSS vulnerability in a Critical-tier-data-adjacent component is remediated within 24–48 hours; the same CVSS score in a lower-sensitivity component follows a 7-day SLA; High/Medium/Low severities follow progressively longer, but still defined and tracked, SLAs (30/60/90 days respectively) rather than an indefinite "someday" backlog.

### 27.3 Patch Management

Dependency updates addressing known vulnerabilities are prioritized ahead of routine version-bump maintenance and, for Critical/High severity findings, are fast-tracked through an expedited (but never skipped) version of the standard CI/CD review process (Section 24.2) — security patches are never held back purely to bundle with an unrelated feature release, given the exposure-window cost of delay.

### 27.4 Vulnerability Disclosure Program

A documented, publicly accessible responsible-disclosure process (a security contact address and a stated good-faith safe-harbor commitment for researchers reporting in good faith) gives external security researchers a legitimate channel to report findings — this is treated as a genuine input source (Section 27.1), not a formality, since external researchers routinely find issues an internal team's own review misses given a different vantage point and adversarial mindset.

### 27.5 Vulnerability Tracking and Closure

Every tracked vulnerability has an owner, a due date derived from Section 27.2's SLA, and a required verification step (the fix is confirmed to actually close the vulnerability, via retest, before the item is closed) — a vulnerability is never marked resolved purely because a fix was deployed, without independent confirmation that the fix is effective.

---

# 28. Security Testing Strategy

### 28.1 Testing Layers

Security testing extends `11-frontend-architecture.md` Section 22 and `10-backend-architecture.md` Section 27's general testing strategy with security-specific layers, applied at every layer of the stack rather than treated as a single, separate "security testing" phase bolted on before release.

### 28.2 Static Application Security Testing (SAST)

Automated static-analysis scanning (integrated into CI, Section 24) checks for known insecure-code patterns — raw SQL string concatenation (Section 9.2), missing input validation on new endpoints (Section 8.4), `dangerouslySetInnerHTML` usage outside the single reviewed location (Section 10.2), and hardcoded-secret patterns (Section 24.4) — on every pull request, build-blocking on any Critical/High finding.

### 28.3 Dynamic and Penetration Testing

An external, independent penetration test is conducted at minimum annually and after any major architectural change (a new payment flow, a new authentication method) — covering authentication/session handling (Sections 5, 7), authorization/IDOR testing (Section 6), API security (Section 8), and the OWASP Top 10 categories in Section 29 specifically. Findings follow the same Section 27.2 severity-SLA process as any other vulnerability source, with no separate, weaker standard applied to externally-discovered findings.

### 28.4 Security-Focused CI Checks

Beyond Section 28.2's SAST, CI verifies: security headers are present and correctly configured on a representative set of routes (Section 11.1), CORS configuration matches the documented allow-list (Section 11.3), rate-limiting configuration is present on newly added endpoints matching Section 8.3's tier requirements, and RLS policies exist for any newly added multi-tenant table (Section 6.6) — these are automated, build-blocking gates specifically because manual review alone has repeatedly, industry-wide, proven insufficient to catch a missing RLS policy or an accidentally-permissive CORS configuration before it reaches production.

### 28.5 Authorization Testing

A dedicated test suite (distinct from general functional testing) specifically attempts unauthorized access patterns for every resource-scoped endpoint: accessing another user's resource by ID substitution (IDOR, Section 6.2), attempting an action with a role one level below what's required (Section 6.4), and attempting a `StoreTeam`-role-restricted action with an insufficient team role (Section 6.7) — this suite runs on every PR touching authorization-relevant code and is treated as equally release-blocking as functional test failure.

### 28.6 Fuzzing and Boundary Testing

Input-validation boundaries (Section 8.4's Zod schemas) are fuzz-tested with malformed, oversized, and boundary-condition payloads as part of the integration test suite (`11-frontend-architecture.md` Section 22.3's MSW-based pattern extended to adversarial inputs specifically) — verifying that invalid input is rejected with the correct error response (`09-api-architecture.md` Section 2.15) rather than causing an unhandled exception that could leak implementation detail (Section 3.5) or crash a request-handling process.

### 28.7 Security Regression Testing

Every closed vulnerability (Section 27.5) gains a corresponding regression test preventing its reintroduction — a security bug fixed without an accompanying test is considered incompletely resolved, mirroring standard engineering discipline for functional bugs but applied with zero exceptions for security findings specifically, given the disproportionate cost of a regression in this category.

---

# 29. OWASP Top 10 Compliance Matrix

Mapped to the OWASP Top 10 (2021 edition, the current industry-standard baseline), cross-referencing this document's controls for each category.

| # | Category | Primary Controls | Section(s) |
|---|---|---|---|
| **A01** | Broken Access Control | Two-tier authorization, mandatory ownership checks, RLS backstop, permission-scoped `ResourcePermission` grants | 6.1–6.9 |
| **A02** | Cryptographic Failures | TLS everywhere, envelope encryption for Critical-tier fields, Argon2id password hashing, centralized crypto module | 16, 5.2 |
| **A03** | Injection | Parameterized queries only (Drizzle), allow-list input validation, context-aware output encoding, SSRF allow-listing | 9, 10 |
| **A04** | Insecure Design | Threat model and trust boundaries defined before implementation; Zero Trust/Defense-in-Depth/Least-Privilege as standing design principles, not retrofits | 2, 3, 4 |
| **A05** | Security Misconfiguration | Infrastructure-as-code for security-relevant config, CI-enforced security headers/CORS/RLS checks, environment separation | 11.1–11.3, 18.4, 28.4 |
| **A06** | Vulnerable and Outdated Components | Automated SCA scanning, defined patch SLAs, lockfile-enforced reproducible builds | 24.3, 27 |
| **A07** | Identification and Authentication Failures | Short-lived tokens with rotation/reuse detection, brute-force/lockout protection, breached-password screening, MFA-ready architecture | 5, 7 |
| **A08** | Software and Data Integrity Failures | Webhook signature verification, SRI for any raw third-party script, immutable audit log, CI/CD supply-chain controls | 22.4, 11.5, 20.2, 24 |
| **A09** | Security Logging and Monitoring Failures | Comprehensive `SecurityEvent` pipeline, tiered alerting, correlation-ID-linked observability, immutable audit trail | 19, 20 |
| **A10** | Server-Side Request Forgery (SSRF) | Explicit SSRF-prevention control gate for any user-influenced server-side URL fetch, private-IP-range deny-listing | 9.5 |

Every category above has at least one architectural (not merely procedural) control — this matrix is reviewed against the OWASP Top 10's current edition whenever that list is revised, and against this document's own contents whenever a new feature introduces a code pattern not yet covered by an existing row.

---

# 30. Architecture Review Checklist

Every PR touching authentication, authorization, payment, file handling, third-party integration, or infrastructure configuration is evaluated against this checklist before merge, in addition to `10-backend-architecture.md` Section 28 and `11-frontend-architecture.md` Section 27's checklists.

### Identity & Access
- [ ] Does every resource-scoped operation perform an explicit ownership/permission check (Section 6.2), independent of coarse RBAC?
- [ ] Are new tokens/sessions bounded in lifetime and correctly stored (Section 7.1–7.2)?
- [ ] Does any new internal-role capability follow least-privilege scoping (Section 2.3, 6.3)?

### Input & Output
- [ ] Is every new input validated via an allow-list Zod schema (Section 8.4), with no raw SQL construction (Section 9.2)?
- [ ] Is every new dynamic output rendered through context-appropriate encoding (Section 10.1), with no new `dangerouslySetInnerHTML` usage without explicit review (Section 10.2)?
- [ ] Does any new user-supplied-URL-fetching capability include SSRF allow-listing (Section 9.5)?

### Data Protection
- [ ] Is any newly stored field correctly classified (Section 3.3) and, if Critical-tier, application-layer encrypted (Section 16.2)?
- [ ] Does any new logging call avoid sensitive-field exposure (Section 20.4)?
- [ ] Is any new data-retention or deletion behavior consistent with Section 21.5?

### API & Infrastructure
- [ ] Does a new endpoint have appropriate rate limiting (Section 8.3) and correct CORS scope (Section 11.3)?
- [ ] Does a new multi-tenant table have an RLS policy (Section 6.6)?
- [ ] Are new third-party credentials scoped to least privilege and correctly stored (Section 17)?

### Payments & Webhooks
- [ ] Does any payment-adjacent change preserve PCI-scope avoidance (Section 22.1) — no raw card data touched by platform code?
- [ ] Does any new/modified webhook handler verify signature and replay-protect (Section 22.4–22.5)?

### Monitoring & Response
- [ ] Does a new sensitive action emit an appropriate `SecurityEvent`/audit log entry (Sections 19.1, 20.1)?
- [ ] Is the change's severity/blast-radius understood well enough to know how it would be triaged under Section 26.2 if it failed?

### Testing
- [ ] Does the change include or update authorization-boundary tests (Section 28.5) where relevant?
- [ ] Have SAST/CI security checks passed cleanly (Section 28.2, 28.4)?

---

# 31. Future Security Enhancements

Consistent with the "reserve the seam, don't build the feature" discipline established throughout this document series, the following are explicitly deferred — not built in v2 — with the specific architectural readiness already in place for each.

| Enhancement | Current Readiness | Trigger for Prioritization |
|---|---|---|
| **Mandatory MFA for all internal roles** (currently Super-Admin-only, Section 5.3) | `MFA` entity and Better Auth TOTP plugin already integrated | Team growth beyond the current small internal-role population, or any SEV-2+ incident involving an internal-role account |
| **Buyer/Creator opt-in MFA** | Same underlying readiness as above | Product prioritization once core v2 feature set stabilizes |
| **Dedicated secrets-management service** (beyond Vercel's environment-variable store, Section 17.2) | Architecture does not depend on Vercel's store specifically — the KEK (Section 16.4) is already the first candidate for isolation | Scale of secrets/team large enough that Vercel's built-in store's access-control granularity becomes limiting |
| **IP allow-listing for direct database access** (Section 18.2, partially dependent on Supabase tier) | Documented as the target posture already | Supabase plan tier supporting it at the platform's current/near-term scale |
| **Step-up (re-)authentication for high-risk actions** (Section 19.2's geographic/device-anomaly row) | Anomaly-detection signal already defined | MFA rollout (the natural mechanism for step-up verification) reaching general availability |
| **Formal bug-bounty program** (evolution of Section 27.4's disclosure process) | Disclosure channel already exists | Platform scale/profile reaching a point where paid incentive meaningfully increases quality/volume of external findings |
| **Real-time collaborative session security** (tied to `11-frontend-architecture.md` Section 26's flagged WebSocket/real-time transport gap) | Not yet designed — flagged jointly with frontend/backend architecture as a dependency | Product decision to build real-time collaboration features |
| **Regional data residency controls** (Section 21.7) | Data-separation-by-identity architecture already supports future extension | International market expansion becoming an active roadmap item |
| **Automated anomaly-detection model** (beyond Section 19.2's rule-based thresholds) | Rule-based detection is the deliberate v2 baseline — sufficient at current scale/traffic | Traffic and event volume reaching a scale where rule-based thresholds produce excessive false positives/negatives |

---

*This document is the security constitution of Dreams by Kalakaaar v2. Every credential issued, every row of data stored, every request accepted, and every integration added — today and years from now — should be traceable to a decision and its reasoning recorded here. Where a new situation is not yet covered, it is resolved deliberately, documented, and added to this document before it is shipped — never decided silently in a single pull request.*
