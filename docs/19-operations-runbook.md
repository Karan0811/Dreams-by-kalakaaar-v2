# 19 · Operations Runbook — Dreams by Kalakaaar v2

**Document owner:** Principal Site Reliability Engineer / Incident Commander
**Status:** Draft for review
**Audience:** Every on-call engineer, DevOps/Platform Engineering, Engineering Leadership, Support
**Last updated:** 2026
**Depends on:** 00-project-vision.md through 18-observability-monitoring.md in full, most directly 10-backend-architecture.md (Sections 11–17), 12-security-architecture.md (Section 26), 13-testing-strategy.md (Section 27), 14-infrastructure-devops-architecture.md (Sections 19, 21–22), 16-cicd-release-management.md (Sections 16–17, 27), and 18-observability-monitoring.md (Sections 17–21)
**Precedes:** Nothing — this is the document an on-call engineer opens during an actual incident, the terminal, most operationally concrete artifact in this series

> **This document defines operational procedure, not architecture.** 14-infrastructure-devops-architecture.md defines what the infrastructure *is*; 18-observability-monitoring.md defines how it's *observed*; 16-cicd-release-management.md defines how *changes* move through it safely. This document defines what an engineer actually *does* — day to day, and in the worst five minutes of an incident — to keep it running. It contains no application code, no infrastructure-provisioning syntax, and no executable scripts beyond the rare, explicitly-necessary command referenced to make a recovery step unambiguous.

---

# 1. Introduction

## 1.1 Purpose

Every prior document in this series describes a system worth building, an architecture worth building it on, and the observability to know when something's wrong. This document is what turns that knowledge into action at 3 AM: the concrete, rehearsed, step-by-step procedures an on-call engineer follows when a specific thing breaks, the cadence of routine operational care that keeps most of those procedures from ever needing to be used, and the disaster-recovery playbook for the scenarios severe enough to threaten the platform's survival, not just its uptime.

## 1.2 Scope

**In scope:** the complete operational cadence (daily through quarterly, Sections 4–7); incident management workflow, severity classification, and escalation (Sections 8–10); specific recovery procedures for every major platform component (Sections 11–17); backup, restore, and disaster recovery (Sections 18–19); routine maintenance procedures (Section 20); change management for operational (non-release-pipeline) changes (Section 21); operational KPIs (Section 22); incident communication (Section 23); and the postmortem and continuous-improvement discipline that closes the loop on every incident (Sections 24–25).

**Out of scope:** the release pipeline itself (owned by 16-cicd-release-management.md — this document's Section 11 rollback procedure *invokes* that pipeline's rollback mechanism, never redefines it), the observability architecture itself (owned by 18-observability-monitoring.md — this document assumes that architecture exists and uses it as its primary diagnostic toolset), and infrastructure provisioning (owned by 14-infrastructure-devops-architecture.md).

## 1.3 Audience

Every engineer who takes on-call duty, since this is the document they have open during an actual incident; DevOps/Platform Engineering, who own most recovery procedures' technical execution; Engineering Leadership, who own severity-4/disaster-level escalation decisions and postmortem follow-through; and Support, who need the communication templates (Section 23) to keep buyers and creators accurately informed during an incident.

## 1.4 Objectives

1. Make every recovery procedure **rehearsed, not improvised** — an on-call engineer facing a database outage at 3 AM should be executing a known playbook (Section 12), not inventing one under pressure.
2. Make the **routine operational cadence** (Sections 4–7) thorough enough that most of this document's recovery procedures are rarely needed — proactive care is this document's first line of defense, not an afterthought to reactive firefighting.
3. Make **escalation unambiguous** — restated from 18-observability-monitoring.md Section 17.6's alert routing, extended here into the full human escalation chain (Section 10), so no engineer is ever uncertain who to call next.
4. Make **disaster recovery a tested capability, not a theoretical document** — Section 19's procedures are only as good as the last time they were actually rehearsed, and this document treats that rehearsal discipline as non-negotiable.
5. Make every incident **produce learning, not just resolution** — Section 24's postmortem process ensures every incident, regardless of how quickly it was resolved, feeds back into making the platform and this document itself measurably better.

## 1.5 Definitions

| Term | Meaning in this document |
|---|---|
| Runbook | A specific, step-by-step recovery procedure for a named failure scenario (Sections 11–17) — written to be followed under pressure, without requiring the reader to derive the solution from first principles in the moment. |
| Incident Commander (IC) | The single person coordinating a SEV-1/SEV-2 incident's response (Section 8.4) — restated and fully operationalized from 12-security-architecture.md Section 26.3. |
| RTO (Recovery Time Objective) | The maximum acceptable time to restore service after a disaster (Section 19.3). |
| RPO (Recovery Point Objective) | The maximum acceptable amount of data loss, measured in time (Section 19.3) — "we can lose at most the last N minutes of writes." |
| Maintenance Window | A pre-communicated, planned period during which a operationally-risky change is performed (Section 20.5). |
| Change | Any operational action outside the standard code-deployment pipeline that could affect production behavior — a manual database operation, a DNS change, a third-party configuration change (Section 21). |

## 1.6 References

This document sits atop and cross-references rather than duplicates: 18-observability-monitoring.md (the diagnostic toolset every procedure here assumes — Sections 4–8 of that document), 16-cicd-release-management.md (the deployment/rollback mechanism Section 11 of this document invokes), 12-security-architecture.md Section 26 (the incident-response framework this document's Sections 8–10 fully operationalize into concrete workflow), 13-testing-strategy.md Section 27 (the bug/defect severity matrix this document's Section 9 maps its own incident severity against), and 14-infrastructure-devops-architecture.md Section 19 (the backup/DR *infrastructure* this document's Sections 18–19 turn into executable *procedure*).

## 1.7 Guiding Principles

1. **Rehearsed beats reactive.** Every recovery procedure in this document is designed to be followed, not improvised — restated as Objective 1, and reinforced by Section 19.6's mandatory disaster-recovery drill cadence.
2. **Proactive care is cheaper than reactive recovery.** Sections 4–7's routine cadence exists specifically to catch a growing problem while it's still cheap and calm to fix, before it becomes Section 8's incident.
3. **One person coordinates; many people can execute.** Restated from 12-security-architecture.md Section 26.3: a SEV-1/2 incident has exactly one Incident Commander at any moment, preventing the confusion of multiple uncoordinated responders each independently deciding what to do.
4. **Communicate early, communicate often, communicate honestly.** Restated as Section 23's central philosophy — an under-communicated incident erodes trust even when the technical resolution is fast; silence is never the safe default.
5. **Every incident is a lesson, extracted deliberately.** Section 24's blameless postmortem process converts every incident, regardless of severity, into a concrete improvement to the system or to this document itself — an incident that produces no change to prevent its recurrence is treated as an incomplete response.

## 1.8 Non-Goals

This document does not: redefine the observability architecture (18) or release pipeline (16) it depends on; include infrastructure-provisioning syntax or application code; or prescribe specific incident-management tooling beyond assuming the communication channels and paging system 16-cicd-release-management.md Section 27.3's on-call rotation already implies.

---

# 2. Operations Philosophy

## 2.1 Boring Operations Are Good Operations

Restated from 15-engineering-standards.md Section 2.2's "boring technology" philosophy, applied here to operational practice: the best on-call shift is an uneventful one, and this document's entire structure — heavy investment in Sections 4–7's routine cadence, rehearsed runbooks (Sections 11–17), and proactive capacity/security review — is built specifically to make uneventful shifts the norm, not the exception.

## 2.2 Operations Is Everyone's Responsibility, Not Just On-Call's

Restated from 13-testing-strategy.md Section 2.3 and 15-engineering-standards.md Section 2.6's identical stated principle for quality and code review, respectively: every engineer who ships code owns some responsibility for how it behaves in production, not only the engineer currently holding the on-call pager. The on-call rotation (16-cicd-release-management.md Section 27.3) is the *first responder*, not the *sole owner*, of production health.

## 2.3 Prevent, Detect, Respond, Learn

This document's four-part operational lifecycle, restated and made explicit: **prevent** (Sections 4–7's routine cadence, Section 20's maintenance discipline), **detect** (relying entirely on 18-observability-monitoring.md's alerting architecture, not redefined here), **respond** (Sections 8–17's incident management and recovery procedures), **learn** (Sections 24–25's postmortem and continuous-improvement discipline) — each stage feeding the next, and Learn feeding back into Prevent, closing the loop.

## 2.4 Calm Under Pressure

Every procedure in this document is written assuming its reader may be tired, stressed, or working at 3 AM — restated as a deliberate authorial discipline: steps are explicit and ordered, decision points are structured as decision trees (Section 11.3) rather than open-ended judgment calls wherever a clear rule can be stated, and escalation (Section 10) is always presented as an available, encouraged option, never a last resort to be avoided out of pride.

## 2.5 Data-Driven, Blameless

Restated identically from 18-observability-monitoring.md Section 2.6: every operational decision — from a severity classification to a postmortem's root-cause finding — is grounded in observed data (18-observability-monitoring.md's toolset), and every incident review examines the *system and process* that allowed a failure, never the individual who happened to be on call or who wrote the code in question.

---

# 3. Operational Responsibilities

## 3.1 Purpose

To consolidate, in one place, who owns what across this platform's live operation — the operational counterpart to 16-cicd-release-management.md Section 27.2's release-focused responsibility matrix, and 18-observability-monitoring.md Section 22.3's observability-governance matrix, now focused specifically on keeping the running system healthy.

## 3.2 Responsibility Matrix

| Responsibility | Primary Owner | Backup/Escalation |
|---|---|---|
| On-call rotation coverage | Every rotating engineer (16-cicd-release-management.md §27.3) | Engineering Leadership, for coverage gaps |
| Incident Commander duty (SEV-1/2) | Designated senior engineers on a separate IC rotation | Engineering Leadership |
| Daily/Weekly operational checks (Sections 4–5) | The on-call engineer for that period | DevOps/Platform Engineering |
| Monthly/Quarterly reviews (Sections 6–7) | DevOps/Platform Engineering | Engineering Leadership |
| Database operations and recovery (Section 12) | DevOps/Platform Engineering | A designated database-specialist engineer, if the team has one |
| Payment operations and recovery (Section 16) | Payments module's owning engineers (10-backend-architecture.md §5.14) | Finance/Founders, for anything with real financial reconciliation impact |
| Security-relevant incidents (any severity) | Security/Compliance function (or the designated engineering lead) | Engineering Leadership, per 12-security-architecture.md §26 |
| Disaster recovery execution (Section 19) | DevOps/Platform Engineering, with Engineering Leadership authorization | Founders, for a genuine platform-survival-level event |
| Customer/stakeholder communication during an incident (Section 23) | The Incident Commander, executed via Support | Product/Founders, for anything with broad public visibility |
| Postmortem facilitation (Section 24) | The Incident Commander for that incident | Engineering Leadership, for ensuring follow-through |

## 3.3 On-Call Structure

Restated and extended from 16-cicd-release-management.md Section 27.3: two distinct rotations operate in parallel — a **primary on-call** rotation (first responder to any page, executing Sections 4–5's routine checks and Sections 11–17's recovery procedures) and a smaller **Incident Commander** rotation (drawn from senior engineers, activated specifically for SEV-1/2 incidents per Section 8.4, coordinating rather than personally executing every recovery step).

## 3.4 Workflow

```
Routine operation (Sections 4–7) ──► signal detected (18-observability-
monitoring.md §17) ──► primary on-call acknowledges and begins triage
(Section 8.2) ──► severity classified (Section 9) ──► SEV-1/2: IC
activated (Section 8.4); SEV-3/4: primary on-call proceeds independently,
escalating per Section 10 if needed ──► recovery procedure executed
(Sections 11–19 as applicable) ──► incident resolved ──► postmortem
(Section 24) ──► continuous improvement (Section 25)
```

## 3.5 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| No one acknowledges a page within the expected window | On-call engineer unavailable/unreachable | Automatic escalation to the secondary/backup on-call, per the paging system's own escalation-policy configuration (Section 10.2) |
| Ambiguity over whether a situation warrants Incident Commander activation | The situation's severity isn't immediately obvious | Default to activating the IC rotation for any uncertain case — restated from 16-cicd-release-management.md §14.9's identical "when uncertain, default to the higher-rigor path" principle |

## 3.6 Recovery Steps

Not applicable at this section's level (this section defines *who*, not *how* — recovery steps are procedure-specific, Sections 11–19).

## 3.7 Escalation

A responsibility-matrix gap (Section 3.2 lacking a clear owner for a specific situation) escalates to Engineering Leadership by default, mirroring 16-cicd-release-management.md Section 27.6's identical stated fallback.

## 3.8 Best Practices

- Keep the on-call and IC rotation schedules visible and confirmed well in advance (restated from 16-cicd-release-management.md §27.8) — never discovered to have a gap only when an incident is already underway.
- Review the responsibility matrix (Section 3.2) whenever team structure changes, keeping it a living, trustworthy reference.

## 3.9 Review Checklist

- [ ] Is there always a clearly identified primary on-call and IC-rotation engineer, with no coverage gaps (Section 3.3)?
- [ ] Does every operational situation this platform can produce map to a clear owner in Section 3.2's matrix?


---

# 4. Daily Operations

## 4.1 Purpose

To state the minimal, fast, daily cadence of proactive checks that catch a developing problem while it's still cheap and calm to address — restated as Section 2.1's "boring operations" philosophy made concrete and scheduled.

## 4.2 Workflow

```
Start of on-call day/shift
   │
   ▼
Review 18-observability-monitoring.md §18.3's Incident Response Dashboard
and §18.4's Platform Health Dashboard for anything unusual since last check
   │
   ▼
Confirm the prior 24h's deployments (16-cicd-release-management.md §21.3
markers) all completed their post-deployment verification (that document's
§20) without a lingering unresolved concern
   │
   ▼
Review overnight/prior-day alert history (18-observability-monitoring.md
§17) — any fired-and-resolved alert warrants a quick "did this actually
get looked at" check, not just a "did it resolve itself" assumption
   │
   ▼
Confirm background job health (13-observability-monitoring.md §13) —
no unexpected "silence" or elevated failure rate in any job family
   │
   ▼
Confirm error-budget status (18-observability-monitoring.md §20.6) hasn't
crossed a threshold since the last check
   │
   ▼
End of check — any finding logged and, if actionable, ticketed
```

## 4.3 Daily Checklist

- [ ] Platform Health Dashboard reviewed — no unexplained anomaly in the four golden signals (18-observability-monitoring.md §5.4).
- [ ] All deployments from the prior 24h confirmed stable (16-cicd-release-management.md §20.5's observation window closed cleanly for each).
- [ ] Alert history reviewed — no unaddressed fired alert.
- [ ] Background job health confirmed across all families (18-observability-monitoring.md §13.3).
- [ ] Error-budget status confirmed within normal range (that document's §20.6).
- [ ] Dependency status strip (Section 18.5 of that document) shows all third-party services healthy.

## 4.4 Responsibilities

The primary on-call engineer for that period performs the daily check; findings requiring action are ticketed and, if urgent, escalated per Section 10 immediately rather than held for the next scheduled review.

## 4.5 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| The daily check itself reveals a developing problem (e.g., a slow, sub-alert-threshold degradation trend) | Gradual degradation not yet severe enough to have paged (18-observability-monitoring.md §10.6's stated failure mode) | Ticketed for investigation at normal priority, or escalated immediately if the trend's trajectory suggests it will become urgent soon |
| The daily check is skipped | Time pressure, on-call fatigue, or simple oversight | Treated as a process gap; a missed daily check is noted and the following day's check is not skipped to "catch up," since the routine's value is its consistency, not a retrospective audit |

## 4.6 Recovery Steps

Not applicable at this section's level — findings route to the appropriate Sections 11–17 recovery procedure or a standard-priority ticket.

## 4.7 Escalation

Any finding the on-call engineer is uncertain how to interpret escalates to DevOps/Platform Engineering per Section 10's standard path, rather than being dismissed due to uncertainty.

## 4.8 Best Practices

- Keep the daily check genuinely fast (a well-designed dashboard, per 18-observability-monitoring.md Section 18.4, should make this a 5–10 minute routine, not a lengthy audit) — a check that's too burdensome to sustain daily will eventually be skipped.
- Treat a "clean" daily check as expected and unremarkable, not something to second-guess — restated from Section 2.1, an uneventful check is this document's success condition, not a sign that something must be being missed.

## 4.9 Review Checklist

- [ ] Was the daily check completed for every day in the review period (Section 4.5)?
- [ ] Were all findings ticketed and, where urgent, escalated promptly (Section 4.4)?

---

# 5. Weekly Operations

## 5.1 Purpose

To state the weekly cadence of slightly deeper review — restated and cross-referenced directly from 18-observability-monitoring.md Section 21.2's Weekly Operational Review, with this section adding the specifically *operational* (as opposed to purely observability-governance) checks that belong alongside it.

## 5.2 Workflow

```
Weekly review session (DevOps/Platform Engineering, with on-call input)
   │
   ▼
Alert-firing pattern review (18-observability-monitoring.md §21.4) —
which alerts fired, how often, was each response appropriate
   │
   ▼
Incident summary — every incident (any severity) from the past week
briefly reviewed for status (resolved, in postmortem, follow-up pending)
   │
   ▼
Deployment frequency and rollback-rate review (16-cicd-release-management.md
§21.4's pipeline-health metrics)
   │
   ▼
Capacity spot-check — database/storage growth trend (18-observability-
monitoring.md §11.3, §12.5) sanity-checked against expectations
   │
   ▼
Backup completion confirmation (Section 18.4 of this document) — the
past week's automated backups completed successfully, not merely assumed
```

## 5.3 Weekly Checklist

- [ ] Alert-firing patterns reviewed; any fatigue-inducing or ineffective alert flagged for recalibration (18-observability-monitoring.md §21.4).
- [ ] Every incident from the past week has a known status (resolved / postmortem in progress / follow-up tracked).
- [ ] Deployment frequency and rollback rate reviewed against the norm.
- [ ] Capacity trend spot-checked; no unexpected acceleration in growth.
- [ ] Automated backup completion confirmed for every day in the past week (Section 18.4).
- [ ] Any Medium/Low-severity finding from the daily checks (Section 4) reviewed in aggregate for a pattern the daily cadence alone wouldn't surface.

## 5.4 Responsibilities

DevOps/Platform Engineering facilitates; the prior week's on-call engineer(s) contribute context on anything they personally handled.

## 5.5 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| An incident from the past week has no tracked follow-up status | Postmortem process (Section 24) not completed or not started | Escalated as a process gap — a status-less incident is a signal the blameless-learning loop (Section 2.3) isn't closing, addressed with the same seriousness as a technical gap |
| Backup completion cannot be confirmed for a specific day | A backup job failure that itself went unnoticed | Investigated immediately as its own incident (Section 18.5's failure-scenario table), given how directly this threatens Section 19's disaster-recovery readiness |

## 5.6 Recovery Steps

Not applicable at this section's level — findings route to the appropriate downstream process (postmortem follow-through, Section 12 for a backup failure, etc.).

## 5.7 Escalation

A repeated pattern of unaddressed weekly findings escalates to Engineering Leadership as a resourcing/prioritization conversation, not left to accumulate indefinitely.

## 5.8 Best Practices

- Keep the weekly review a standing, calendared session, not an ad hoc "whenever there's time" activity — restated from 18-observability-monitoring.md Section 21.7's identical concern about skipped reviews.
- Use the weekly review specifically to catch patterns invisible at the daily cadence (Section 5.3's last item) — this is the review's unique value-add over the daily check, not a redundant re-check of the same data.

## 5.9 Review Checklist

- [ ] Did the weekly review occur as scheduled, with all Section 5.3 items covered?
- [ ] Did every finding produce a tracked outcome (resolved, ticketed, or escalated)?

---

# 6. Monthly Operations

## 6.1 Purpose

To state the monthly cadence of deeper, longer-horizon review — restated and cross-referenced from 18-observability-monitoring.md Section 21.2's Monthly Reliability Review, with this section's operational additions (cost, security posture spot-check, restore verification).

## 6.2 Workflow

```
Monthly review session (DevOps/Platform Engineering + Engineering Leadership)
   │
   ▼
SLO/error-budget trend review (18-observability-monitoring.md §20.6)
   │
   ▼
Dependency-reliability trend review (that document's §14.4)
   │
   ▼
Capacity planning review (that document's §21.5) — database/storage/job-
throughput growth against 08-database-design.md §2's scale trajectory
   │
   ▼
Cost review (Section 6.4 of this document)
   │
   ▼
Restore verification (Section 18.6 of this document) — a real, scheduled
test restore from backup, not merely confirming backups "completed"
   │
   ▼
Dashboard/alert relevance spot-check (18-observability-monitoring.md §18.8)
```

## 6.3 Monthly Checklist

- [ ] SLO/error-budget trend reviewed; any sustained negative trend triggers Section 20.5-of-that-document's policy response.
- [ ] Dependency-reliability trends reviewed; any degrading vendor flagged for a business-level conversation.
- [ ] Capacity trend reviewed against the platform's stated scale trajectory; proactive scaling work initiated if warranted (14-infrastructure-devops-architecture.md §18).
- [ ] Cost review completed (Section 6.4).
- [ ] A real test restore performed and verified (Section 18.6) — not skipped even if the prior month's test succeeded.
- [ ] Dashboard and alert relevance spot-checked; obvious pruning candidates flagged for the Quarterly review's fuller audit.

## 6.4 Cost Review

Restated and extended from 14-infrastructure-devops-architecture.md Section 20: monthly spend across Vercel, Supabase, Cloudflare R2, Upstash Redis, Inngest, Razorpay, Resend, and the observability stack (Sentry, PostHog, the OpenTelemetry backend) is reviewed against budget and against the prior month's trend — an unexplained cost spike in any single service is investigated as a potential signal of a technical issue (a garbage-collection failure inflating R2 storage, per 18-observability-monitoring.md Section 12.8) as often as it is a pure business/usage-growth explanation, and both possibilities are checked before either is assumed.

## 6.5 Responsibilities

DevOps/Platform Engineering facilitates and executes the technical checks (SLO, capacity, restore verification); Engineering Leadership facilitates the cost review and any resulting budget/vendor decisions.

## 6.6 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| A test restore fails or reveals data that doesn't match expectations | A backup-integrity issue, or a restore-procedure gap (Section 18's own procedure needing correction) | Treated as a Critical-priority finding regardless of the fact that it occurred during a routine drill, not a live incident — restated from Section 19.6's disaster-recovery-readiness discipline: a failed drill is exactly the kind of finding this cadence exists to surface safely, before a real disaster makes it far more costly to discover |
| Cost review finds an unexplained spike with no clear technical or business cause | Insufficient cost-attribution granularity across services | The specific service's cost-breakdown tooling is reviewed/improved to close the attribution gap for next month's review |

## 6.7 Recovery Steps

A failed restore test (Section 6.6) triggers immediate investigation and correction of the backup/restore procedure itself (Section 18), re-tested before the next monthly cycle, not deferred to "whenever there's time."

## 6.8 Escalation

A failed restore test or a sustained SLO/error-budget negative trend escalates immediately to Engineering Leadership, given the direct threat to disaster-recovery readiness and platform reliability respectively.

## 6.9 Best Practices

- Never skip the monthly restore-verification test, even when confident nothing has changed — restated from Section 6.3, since the entire value of this test is catching an unexpected, otherwise-invisible drift in backup integrity or restore-procedure correctness.
- Investigate cost anomalies for a technical root cause before assuming pure business growth (Section 6.4) — cost data is a surprisingly effective, often-overlooked observability signal in its own right.

## 6.10 Review Checklist

- [ ] Was a real restore test actually performed and verified this month, not merely assumed successful (Section 6.3)?
- [ ] Was every cost anomaly investigated for both technical and business causes (Section 6.4)?

---

# 7. Quarterly Operations

## 7.1 Purpose

To state the quarterly cadence of the deepest, most comprehensive review this platform performs — restated and cross-referenced from 18-observability-monitoring.md Section 21.2's Quarterly Observability Governance Review and Section 22.4's periodic audit, with this section's operational additions (full disaster-recovery drill, security review, this entire document's currency check).

## 7.2 Workflow

```
Quarterly review (Engineering Leadership + DevOps/Platform Engineering +
Security/Compliance function)
   │
   ▼
Full disaster-recovery drill (Section 19.6) — a complete, timed, end-to-end
recovery exercise, not just the monthly restore-verification subset
   │
   ▼
Full security review (Section 7.4)
   │
   ▼
Full observability governance audit (18-observability-monitoring.md §22.4)
   │
   ▼
This document's own currency review (does every procedure still match
the actual, current production system)
   │
   ▼
Operational KPI trend review (Section 22 of this document) over the
full quarter
```

## 7.3 Quarterly Checklist

- [ ] A full, timed disaster-recovery drill completed, with actual RTO/RPO measured against target (Section 19.3).
- [ ] Full security review completed (Section 7.4).
- [ ] Full observability governance audit completed (18-observability-monitoring.md §22.4).
- [ ] Every runbook in Sections 11–19 reviewed against the current, actual production architecture — any drift corrected.
- [ ] Operational KPIs (Section 22) reviewed as a full-quarter trend, informing the next quarter's priorities.
- [ ] Secret rotation schedule (Section 20.3) confirmed on track for every credential category.

## 7.4 Security Review

Restated and cross-referenced from 12-security-architecture.md's own periodic review cadence (that document's Section 30): a quarterly check specifically of operational security posture — are all access grants (database elevated roles, third-party service admin access) still minimal and justified (that document's Section 8), has secret rotation (Section 20.3) actually occurred on schedule, and does the incident-response process (Section 8 of this document) still align with that document's Section 26 framework.

## 7.5 Responsibilities

Engineering Leadership facilitates; DevOps/Platform Engineering executes the drill and technical audits; Security/Compliance (or the designated lead) executes Section 7.4.

## 7.6 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| The disaster-recovery drill reveals the actual RTO/RPO significantly exceeds target (Section 19.3) | Infrastructure, procedure, or team-familiarity gaps | Treated as a Critical-priority finding — the specific gap (slow restore process, unclear runbook, missing access) is closed and re-drilled before the next quarter, not merely noted |
| This document is found to be significantly out of date against the actual production system | New services/patterns introduced without a corresponding runbook update (mirroring 18-observability-monitoring.md §22.8's identical failure mode) | Corrected immediately as part of the quarterly review itself, restoring this document's trustworthiness before the next incident needs to rely on it |

## 7.7 Recovery Steps

A failed disaster-recovery drill (Section 7.6) is treated exactly as a real disaster's postmortem would be (Section 24) — root-caused, with concrete action items, re-drilled to confirm the fix actually closes the gap.

## 7.8 Escalation

Any Section 7.6 failure scenario escalates immediately to Engineering Leadership and, for a disaster-recovery drill failure specifically, to Founders, given the direct platform-survival implications.

## 7.9 Best Practices

- Treat the quarterly disaster-recovery drill as seriously as a real incident — restated from Section 1.7's "rehearsed beats reactive" principle, this drill is only valuable if executed with genuine rigor, not treated as a formality.
- Rotate which team member leads the drill across quarters, building broad team familiarity with Section 19's procedures rather than concentrating that knowledge in one person.

## 7.10 Review Checklist

- [ ] Was the disaster-recovery drill executed with genuine rigor, producing an actual measured RTO/RPO (Section 7.3)?
- [ ] Is this document's content confirmed current against the actual production system (Section 7.6)?


---

# 8. Incident Management

## 8.1 Purpose

To state the complete, ordered workflow an incident travels through — restated and fully operationalized from 12-security-architecture.md Section 26's incident-response framework and 18-observability-monitoring.md Section 19's investigation workflow, unified here into this platform's single, authoritative incident-management process.

## 8.2 Incident Lifecycle Diagram

```
Detected (18-observability-monitoring.md §17 alert, or a human report)
   │
   ▼
Acknowledged (primary on-call, within the paging system's response window)
   │
   ▼
Triaged ──► Severity classified (Section 9)
   │
   ├─ SEV-3/4 ──► Primary on-call proceeds independently, standard
   │                investigation workflow (18-observability-monitoring.md §19.2)
   │
   └─ SEV-1/2 ──► Incident Commander activated (Section 8.4)
                    │
                    ▼
              War-room/coordination channel opened
                    │
                    ▼
              Investigation (18-observability-monitoring.md §19) +
              Communication (Section 23) run in parallel, not sequentially
                    │
                    ▼
              Mitigation applied (rollback §11, hotfix, or a component-
              specific recovery procedure, §§12–17)
                    │
                    ▼
              Verified resolved (impact confirmed gone, not just the
              triggering alert cleared)
                    │
                    ▼
              Incident closed ──► Postmortem scheduled (Section 24)
```

## 8.3 Triage

**Rule:** every acknowledged incident is triaged within minutes, not left in an ambiguous "someone's looking at it" state — triage answers, in order: what is the user-visible impact (if any), is it worsening/stable/improving, and what severity does that impact warrant (Section 9). Triage is deliberately fast and coarse; deep root-cause investigation (18-observability-monitoring.md Section 19.3's hypothesis-ordered approach) begins immediately after, not gated behind a lengthy triage process.

## 8.4 Incident Commander Activation

**Rule:** for any incident classified SEV-1 or SEV-2 (Section 9), the on-call IC-rotation engineer is activated immediately — the IC's role is coordination, not necessarily hands-on technical execution: they ensure investigation and mitigation are proceeding (delegating specific technical work to the primary on-call or additional engineers as needed), own the communication cadence (Section 23), and make the final call on judgment-requiring decisions (e.g., whether to roll back per Section 11's decision tree) when there's genuine ambiguity a single responding engineer shouldn't resolve alone under pressure.

## 8.5 Multi-Responder Coordination

For an incident requiring more than one engineer, the IC (Section 8.4) explicitly assigns roles — restated as a coordination discipline preventing the common incident-response failure mode of multiple people independently investigating the same thing while another genuinely necessary angle goes unexamined: one engineer typically owns active mitigation, another owns ongoing investigation/root-cause work, and the IC owns communication and overall coordination, with roles reassigned explicitly (not silently) as the incident evolves.

## 8.6 Responsibilities

The primary on-call engineer is first responder for every incident; the IC-rotation engineer is activated for SEV-1/2 specifically (Section 8.4); every engineer pulled into a multi-responder incident (Section 8.5) executes their assigned role and communicates status changes back to the IC rather than working in isolation.

## 8.7 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| An incident's severity is initially under-classified, then worsens | Triage (Section 8.3) is necessarily a fast, imperfect first assessment | Severity is re-classified the moment new information warrants it — restated as a standing rule: severity is never treated as fixed once assigned; it is re-evaluated continuously as the incident's actual impact becomes clearer |
| Multiple engineers duplicate the same investigative work during a multi-responder incident | Section 8.5's role assignment wasn't made explicit | The IC corrects this the moment it's noticed, re-assigning roles explicitly — this is exactly the failure mode Section 8.5 exists to prevent, and its recurrence is itself worth a postmortem note (Section 24) |

## 8.8 Recovery Steps

Not applicable at this section's level — mitigation is procedure-specific (Sections 11–17), invoked as part of this workflow's mitigation stage (Section 8.2).

## 8.9 Escalation

Fully specified in Section 10.

## 8.10 Best Practices

- Open the coordination channel (Section 8.2) immediately upon SEV-1/2 classification, even before a clear plan exists — restated from Section 2.4's "calm under pressure" principle: the channel's existence itself reduces chaos, giving every subsequent action a single, visible place to happen.
- Re-classify severity without hesitation as new information arrives (Section 8.7) — treating an initial classification as permanent produces either an under-resourced response to a worsening situation or an over-escalated response to one that's actually stabilizing.

## 8.11 Review Checklist

- [ ] Was the incident acknowledged and triaged within the expected response window (Section 8.3)?
- [ ] Was the Incident Commander correctly activated for any SEV-1/2 classification (Section 8.4)?
- [ ] Were multi-responder roles explicitly assigned and communicated (Section 8.5)?

---

# 9. Severity Levels

## 9.1 Purpose

To state this platform's authoritative incident-severity scale — restated and fully reconciled from 12-security-architecture.md Section 26.3's SEV-1/2 terminology (used throughout this series to date) and 13-testing-strategy.md Section 27.2's Critical/High/Medium/Low defect-severity matrix, unified here into one consistent framework covering both a *reported bug's* severity and a *live incident's* severity, since the two are the same underlying concept viewed from different discovery points (13-testing-strategy.md Section 17.4's own stated framing).

## 9.2 Severity Table

| Incident Severity | Defect-Severity Equivalent | Definition | Response Expectation |
|---|---|---|---|
| **SEV-1** | Critical | Complete or near-complete platform outage; a core journey (checkout, login) is unusable for all/most users; confirmed data loss/corruption; confirmed active security breach | Immediate, all-hands-available response; Incident Commander activated; continuous communication (Section 23) until resolved |
| **SEV-2** | Critical / High | A core journey significantly degraded for a meaningful subset of users; a Critical-tier module (Payments, Auth, Orders) showing sustained, serious errors; an imminent SEV-1 risk (e.g., database connection pool near exhaustion) | Immediate response; Incident Commander activated; regular communication cadence |
| **SEV-3** | High / Medium | A non-core feature broken, or a core feature degraded with a viable workaround; a leading-indicator signal not yet user-impacting | Prompt response within the primary on-call's normal working response time; no IC activation required by default |
| **SEV-4** | Medium / Low | Cosmetic or minor issue; a routine, non-urgent finding from Sections 4–7's operational cadence | Standard-priority ticket; addressed in normal workflow, no incident-response urgency |

## 9.3 Severity Determination Factors

Restated from 13-testing-strategy.md Section 27.2's stated approach: severity is assessed by **blast radius and consequence**, not by technical complexity or how the issue was discovered — a simple, easily-understood bug causing a total checkout outage is SEV-1; a genuinely complex, hard-to-diagnose issue affecting a rarely-used internal admin feature is SEV-3 or SEV-4, regardless of how much engineering effort its diagnosis required.

## 9.4 Special Case: Security Incidents

**Rule:** any confirmed or suspected security incident (a data breach, an authentication bypass, active exploitation of a vulnerability) is classified at minimum SEV-2, regardless of its immediately-apparent user-facing impact — restated from 12-security-architecture.md's own posture: the *potential* consequence of an under-responded security incident is severe enough to warrant elevated urgency even when current, visible impact seems limited, since security incidents frequently have effects (data exfiltration, ongoing unauthorized access) that aren't immediately visible through normal monitoring.

## 9.5 Special Case: Financial/Payment Incidents

**Rule:** any incident involving confirmed incorrect money movement (an overcharge, a failed-but-recorded-as-successful payment, a payout miscalculation) is classified at minimum SEV-2 — restated from 08-database-design.md Section 29.3's stated conservative posture toward financial data, applied here to incident response specifically, given the direct, real-world consequence to a real buyer or creator's finances.

## 9.6 Responsibilities

The primary on-call engineer makes the initial severity classification during triage (Section 8.3); the Incident Commander (once activated) has authority to re-classify as the incident evolves (Section 8.7); Section 9.4–9.5's special cases are non-discretionary floors, not defaulted below even if the responding engineer's initial judgment differs.

## 9.7 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| A security or financial incident is initially mis-classified below its mandatory floor (Sections 9.4–9.5) | The responding engineer didn't immediately recognize the incident as security/financial in nature | Corrected immediately upon recognition, with the IC activated retroactively if not already — this specific failure mode is treated as a training/awareness gap worth addressing in the postmortem (Section 24), not merely a one-off correction |

## 9.8 Recovery Steps

Not applicable — severity classification determines *which* recovery procedure and response cadence applies, not a recovery action itself.

## 9.9 Escalation

Fully specified in Section 10; severity directly determines escalation urgency per that section's matrix.

## 9.10 Best Practices

- When genuinely uncertain about severity, classify one level higher than the minimum plausible reading — restated from 16-cicd-release-management.md Section 14.9's identical "default to higher rigor when uncertain" principle, applied here to severity classification specifically.
- Keep Sections 9.4–9.5's mandatory floors front-of-mind — these are the two categories most likely to be initially under-classified precisely because their full consequence isn't always immediately visible in the first moments of triage.

## 9.11 Review Checklist

- [ ] Was severity classified according to actual blast radius/consequence, not technical complexity (Section 9.3)?
- [ ] Were Sections 9.4–9.5's mandatory floors correctly applied for any security or financial incident?

---

# 10. Escalation Process

## 10.1 Purpose

To state, unambiguously, who is contacted next when a situation exceeds the current responder's ability to resolve it alone — restated and fully specified from 16-cicd-release-management.md Section 27.4's stated urgency principle into this document's complete, concrete escalation chain.

## 10.2 Escalation Matrix

| Situation | Escalates From | Escalates To | Expected Response Time |
|---|---|---|---|
| Primary on-call doesn't acknowledge a page | Automated paging system | Secondary/backup on-call | Automatic, per the paging system's configured timeout |
| SEV-1/2 incident detected | Primary on-call | Incident Commander (Section 8.4) | Immediate |
| An incident requires specialized module knowledge (e.g., Payments-specific) | Primary on-call / IC | The relevant module's owning engineers (16-cicd-release-management.md §27.2's matrix) | Prompt — within minutes for SEV-1/2 |
| A security incident (Section 9.4) | Primary on-call / IC | Security/Compliance function, in parallel with standard IC coordination | Immediate |
| A disaster-recovery-level event (Section 19) | Incident Commander | Engineering Leadership + Founders | Immediate |
| A decision requires business/financial judgment beyond engineering scope (e.g., a public-communication tone decision, a significant customer-remediation commitment) | Incident Commander | Product/Founders | Prompt, without blocking the technical response itself |
| Engineering Leadership is unreachable during a SEV-1 | Incident Commander | The next-most-senior available engineer, empowered to make the call in their absence | Immediate — this platform never allows an unreachable leader to become a bottleneck during a SEV-1 |

## 10.3 Escalation Diagram

```
Primary On-Call
      │  (page unacknowledged, or situation exceeds scope)
      ▼
Secondary On-Call / Incident Commander (per situation, Section 10.2)
      │  (SEV-1/2 confirmed, or specialized expertise needed)
      ▼
Module-Specific Expert  ──parallel──►  Security/Compliance (if applicable)
      │
      ▼
Engineering Leadership
      │  (disaster-recovery-level, or Leadership unreachable)
      ▼
Founders / Next-Most-Senior Available Engineer
```

## 10.4 No-Blame Escalation Culture

**Rule:** restated from Section 2.5 and 16-cicd-release-management.md Section 27.4: escalating is never treated as an admission of inadequacy — an engineer who escalates promptly when genuinely uncertain is exercising exactly the judgment this document wants to reinforce, and this platform's culture explicitly rewards fast escalation over prolonged, unsuccessful solo effort.

## 10.5 Responsibilities

Every responder is responsible for recognizing when a situation exceeds their own scope or confidence and escalating per Section 10.2 without hesitation; Engineering Leadership owns keeping the escalation matrix itself current and ensuring every engineer knows how to reach the next link in the chain at any hour.

## 10.6 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| An engineer delays escalation, attempting to resolve a SEV-1/2 situation alone for an extended period | Insufficient internalization of Section 10.4's no-blame culture, or genuine uncertainty about when escalation is warranted | Addressed in the postmortem (Section 24) as a process/culture finding, never as an individual failing — the fix is reinforcing Section 10.4's stated culture more clearly, not admonishing the specific engineer |
| The escalation chain itself has a gap (nobody reachable at a specific link) | A contact-information or availability gap | Section 10.2's final row (bypass an unreachable link, escalate to the next-most-senior available person) is the standing mitigation; the specific gap is closed immediately afterward |

## 10.7 Recovery Steps

Not applicable — escalation is a coordination action, not itself a technical recovery step.

## 10.8 Escalation

This section defines escalation itself; recursively, a gap in the escalation process (Section 10.6) escalates to Engineering Leadership for correction.

## 10.9 Best Practices

- Escalate early — restated as this section's single most important standing reminder, mirroring 16-cicd-release-management.md Section 27.4's identical stance: the cost of an unnecessary escalation is trivial; the cost of a delayed one during a genuine SEV-1 is not.
- Keep contact information and the escalation chain's reachability verified regularly (feeding into Section 7's quarterly review), not assumed current indefinitely.

## 10.10 Review Checklist

- [ ] Did escalation happen promptly whenever a situation warranted it, per Section 10.2's matrix?
- [ ] Was Section 10.4's no-blame culture actually reflected in how any delayed escalation was reviewed (Section 10.6)?


---

# 11. Service Recovery Procedures

## 11.1 Purpose

To state the general pattern every component-specific recovery procedure (Sections 12–17) follows, and to fully specify the platform's general-purpose recovery mechanism — deployment rollback — restated and cross-referenced directly from 16-cicd-release-management.md Section 16, never re-derived here.

## 11.2 The General Recovery Pattern

Every recovery procedure in this document follows the same shape: **contain** (stop the problem from getting worse — often by disabling a feature flag, per 16-cicd-release-management.md §15.9's fastest-mitigation-tool principle, or rolling back a deployment), **mitigate** (restore service, even if the underlying root cause isn't yet fully understood), **confirm** (verify the mitigation actually restored expected behavior, using 18-observability-monitoring.md's toolset, never just assuming success), and **resolve** (the underlying root cause is fixed, following the standard pipeline, per 16-cicd-release-management.md Section 6, not a permanent workaround).

## 11.3 Deployment Rollback (Cross-Reference, Fully Specified Elsewhere)

The platform's primary, fastest recovery mechanism for a deployment-caused incident is rollback — its complete decision tree, execution process, and post-rollback discipline are fully specified in 16-cicd-release-management.md Section 16 and are not duplicated here. This document's role is simply to state clearly: **when in doubt during a SEV-1/2 incident correlated with a recent deployment, roll back first, diagnose the deeper root cause second** — restated directly from that document's Section 16.2's stated rationale (every second in a degraded state matters more than fully understanding the cause before acting).

## 11.4 Feature Flag Disable (Cross-Reference)

For any incident traced to a flag-gated feature, disabling the flag (16-cicd-release-management.md Section 15.9) is the fastest available mitigation — faster than a full deployment rollback since it requires no redeployment — and is attempted first whenever the incident is clearly scoped to a specific, identifiable flagged feature.

## 11.5 Workflow — Choosing the Right Recovery Path

```
Incident confirmed, mitigation needed
   │
   ▼
Is this clearly scoped to one specific, flag-gated feature?
   │
   YES ──► Disable the flag (Section 11.4) — fastest path
   │
   NO — is this correlated with a recent deployment (16-cicd-release-
        management.md §21.3's deployment markers)?
          │
          YES ──► Rollback decision tree (that document's §16.3)
          │
          NO — is this a specific component failure (database, cache,
               storage, auth, payment, background jobs)?
                 │
                 YES ──► The component-specific procedure (Sections 12–17)
                 │
                 NO ──► Novel incident — full investigation (18-
                        observability-monitoring.md §19), IC-coordinated
                        (Section 8.4), mitigation improvised under IC
                        judgment and documented thoroughly for the
                        postmortem (Section 24)
```

## 11.6 Responsibilities

The primary on-call engineer (or IC, for SEV-1/2) executes Section 11.5's decision workflow; the specific component-owning team (per 16-cicd-release-management.md Section 27.2's matrix) is escalated to per Section 10 for anything requiring specialized knowledge.

## 11.7 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| Rollback is attempted but found unsafe (16-cicd-release-management.md §16.7) | A backward-compatibility gap | Escalate immediately to the hotfix process (that document's §17), per that section's own stated recovery path |
| A recovery action (flag disable, rollback) doesn't actually restore expected behavior | The initial hypothesis about the cause was wrong | Re-enter Section 11.5's decision workflow with the new information — this is not a failure of the process, but the process working as intended when the first hypothesis proves incorrect |

## 11.8 Recovery Steps

Fully specified per-scenario in Section 11.5's decision workflow, referencing 16-cicd-release-management.md Sections 15–16 and this document's Sections 12–17.

## 11.9 Escalation

Per Section 10's standard matrix; a novel incident (Section 11.5's final branch) escalates to the Incident Commander by default given its inherently higher uncertainty.

## 11.10 Best Practices

- Attempt the fastest, least-invasive mitigation first (flag disable, then rollback, then component-specific procedure) whenever more than one path is plausible — restated from Section 11.5's ordering, which is deliberately sequenced from fastest/safest to slowest/most-invasive.
- Document every recovery action taken in real time (feeding Section 24's postmortem), not reconstructed from memory afterward.

## 11.11 Review Checklist

- [ ] Was the fastest appropriate mitigation path chosen and attempted first (Section 11.10)?
- [ ] If the first mitigation attempt didn't work, was the decision workflow correctly re-entered rather than improvised from scratch (Section 11.7)?

---

# 12. Database Recovery

## 12.1 Purpose

To state the specific recovery procedures for Supabase PostgreSQL failure scenarios — restated and extended from 18-observability-monitoring.md Section 11's database monitoring and 14-infrastructure-devops-architecture.md Section 19's backup/DR infrastructure into concrete, executable incident response.

## 12.2 Workflow — Database Incident Triage

```
Database-related alert fires (18-observability-monitoring.md §11.4)
   │
   ▼
Identify the specific failure mode:
   ├─ Connection pool exhaustion (Section 12.4)
   ├─ Query performance degradation (Section 12.5)
   ├─ Replication lag (Section 12.6, once read replicas exist)
   ├─ Data corruption/integrity issue (Section 12.7)
   └─ Complete database unavailability (Section 12.8)
```

## 12.3 Responsibilities

DevOps/Platform Engineering owns database-recovery execution; the engineer whose recent change (if any) is implicated collaborates on root-cause diagnosis.

## 12.4 Recovery: Connection Pool Exhaustion

**Failure Scenario:** the Supabase connection pooler (10-backend-architecture.md Section 10.8) is at or near its connection limit, causing new requests to fail or queue excessively. **Recovery Steps:** (1) confirm via the database monitoring dashboard (18-observability-monitoring.md §11.4) that this is genuinely pool exhaustion, not a symptom of a different root cause; (2) identify whether a specific recent deployment or traffic spike is the proximate cause (16-cicd-release-management.md §21.3's markers); (3) if deployment-caused, roll back immediately (Section 11.3); (4) if traffic-spike-caused, confirm rate limiting (09-api-architecture.md §22.5) is functioning correctly to shed excess load; (5) if neither, escalate to DevOps/Platform Engineering to assess emergency pool-size/scaling adjustment. **Escalation:** immediate IC activation, per Section 9.2's SEV-2 classification for this failure mode given its cascading-failure risk.

## 12.5 Recovery: Query Performance Degradation

**Failure Scenario:** a specific query pattern's latency has degraded, elevating overall database latency (18-observability-monitoring.md §11.3's slow-query-log signal). **Recovery Steps:** (1) identify the specific slow query via tracing (that document's Section 6.2) and the slow-query log; (2) determine if it's deployment-correlated (a new, poorly-performing query just shipped) — if so, roll back (Section 11.3); (3) if it's a gradual, volume-driven degradation (10-backend-architecture.md §21.7's `EXPLAIN ANALYZE` review needed), assess whether an emergency index addition or query-pattern fix can be safely fast-tracked through the hotfix process (16-cicd-release-management.md §17); (4) if neither is immediately actionable, consider temporarily disabling or rate-limiting the specific feature driving the problematic query as a stopgap. **Escalation:** SEV-2 or SEV-3 depending on overall platform impact.

## 12.6 Recovery: Replication Lag (Future — Once Read Replicas Exist)

**Failure Scenario:** a read replica (10-backend-architecture.md Section 22.3) falls significantly behind the primary, risking stale-data reads on replica-routed traffic. **Recovery Steps:** (1) confirm via replication-lag monitoring (18-observability-monitoring.md §11.3); (2) if lag is severe, temporarily route affected read traffic back to the primary (a configuration change in the Repository Layer's connection-selection logic, that document's Section 22.3) until the replica catches up; (3) investigate the replica's own resource saturation as the likely root cause. **Escalation:** SEV-2 if affecting business-critical read paths; SEV-3 otherwise.

## 12.7 Recovery: Data Corruption/Integrity Issue

**Failure Scenario:** a specific data integrity problem is discovered (e.g., via a failed constraint, an unexpected application error, or a manual report) — restated as this platform's most serious database failure mode short of total unavailability. **Recovery Steps:** (1) immediately assess scope — how many rows/entities are affected, and is the cause still actively occurring (a live bug still writing bad data) or already stopped; (2) if actively occurring, the responsible write path is disabled immediately (a flag disable or emergency rollback, Sections 11.3–11.4) to stop further corruption before any repair is attempted; (3) affected data is assessed against Section 18's backup strategy for a clean recovery point; (4) a targeted restore or manual data-correction plan is developed and reviewed by at least two engineers before execution, given the risk of a correction attempt itself causing further harm; (5) full details are captured for the mandatory postmortem (Section 24). **Escalation:** SEV-1, always — restated from Section 9.5's financial-data floor and 08-database-design.md Section 29's stated conservative posture toward data integrity generally.

## 12.8 Recovery: Complete Database Unavailability

**Failure Scenario:** Supabase Postgres is entirely unreachable — a platform-level outage on Supabase's side, or a catastrophic configuration/network failure. **Recovery Steps:** (1) confirm via Supabase's own status page and this platform's independent connectivity checks (18-observability-monitoring.md Section 14.8's "don't rely solely on the vendor's status page" principle, checked both ways here — confirm both independently to rule out a platform-side vs. this-platform-side cause); (2) if Supabase-side, this is a third-party outage (Section 14's parallel procedure) — there is no self-service recovery action beyond monitoring the vendor's resolution and communicating impact (Section 23); (3) if this-platform-side (a misconfiguration, an exhausted quota), the specific cause is corrected directly; (4) if the outage is prolonged and severe enough to threaten data currency, Section 19's disaster-recovery process is considered. **Escalation:** SEV-1, immediate, all-hands.

## 12.9 Best Practices

- Never attempt a data-correction write (Section 12.7) without a second engineer's review, regardless of time pressure — a rushed, unreviewed corrective write during an active incident is a well-documented way to turn one data problem into two.
- Confirm both the vendor's status and this platform's own independent signals before concluding a database issue is entirely out of this team's hands (Section 12.8) — the two occasionally diverge, and assuming a vendor-side cause without confirmation risks missing a genuinely fixable local issue.

## 12.10 Review Checklist

- [ ] Was the specific database failure mode correctly identified before a recovery action was chosen (Section 12.2)?
- [ ] For any data-correction action, was it reviewed by a second engineer before execution (Section 12.7)?

---

# 13. Cache Recovery

## 13.1 Purpose

To state recovery procedures for Upstash Redis failure — restated and extended from 18-observability-monitoring.md Section 12's cache monitoring and 10-backend-architecture.md Section 13's caching architecture.

## 13.2 Workflow

```
Redis-related alert fires (18-observability-monitoring.md §12.6)
   │
   ▼
Identify failure mode:
   ├─ Complete unreachability (Section 13.4)
   ├─ Degraded performance (elevated command latency) (Section 13.5)
   └─ Cache-data correctness issue (stale/incorrect cached values) (Section 13.6)
```

## 13.3 Responsibilities

DevOps/Platform Engineering owns Redis infrastructure recovery; the module whose cache namespace is affected (10-backend-architecture.md Section 13.3's per-module key convention) collaborates on assessing functional impact.

## 13.4 Recovery: Complete Unreachability

**Failure Scenario:** the application cannot connect to Redis at all. **Recovery Steps:** (1) confirm via Upstash's status page and this platform's independent connectivity check (mirroring Section 12.8's dual-confirmation principle); (2) assess immediate functional impact — restated from 10-backend-architecture.md Section 17.2's fail-open/fail-closed distinction: rate limiting (a security control, 09-api-architecture.md §22.5) and session caching degrade, and this platform's documented fallback behavior for each affected feature engages automatically (the application does not crash outright on Redis unavailability, per that document's fault-tolerance design, Section 2.11); (3) if the outage is vendor-side, monitor for resolution and communicate impact (Section 23) if user-visible degradation is occurring (e.g., rate limiting failing open more permissively than normal is a security-relevant, if not immediately user-visible, condition worth noting); (4) if configuration/network-side, correct directly. **Escalation:** SEV-1, given rate limiting's security role (18-observability-monitoring.md Section 12.6's stated rationale).

## 13.5 Recovery: Degraded Performance

**Failure Scenario:** Redis is reachable but responding slowly, elevating overall request latency. **Recovery Steps:** (1) confirm via command-latency monitoring (18-observability-monitoring.md §12.3); (2) check for a memory-pressure/eviction-rate correlation (that document's Section 12.3) — if the cache is undersized for its current working set, this is a capacity issue requiring a scaling adjustment, tracked at Section 6.2's monthly capacity review if not urgent enough to warrant immediate action; (3) if a specific cache-key namespace is disproportionately implicated, investigate whether a recent change introduced an inefficient caching pattern (e.g., overly large cached values, per 10-backend-architecture.md §13.4's TTL/sizing discipline) and roll back if deployment-correlated. **Escalation:** SEV-2 or SEV-3 depending on overall latency impact.

## 13.6 Recovery: Cache-Data Correctness Issue

**Failure Scenario:** cached data is stale or incorrect in a way that's user-visible (e.g., a Creator's product update not reflecting due to a cache-invalidation bug). **Recovery Steps:** (1) confirm the specific cache-invalidation logic (10-backend-architecture.md §13.3) responsible for the affected data is functioning — is invalidation not firing at all, or firing but writing an incorrect value; (2) as an immediate mitigation, the specific affected cache keys/namespace can be manually flushed (a narrowly-scoped action, never a blanket full-cache flush, which would cause a stampede, per that document's Section 13.5's stampede-prevention concern, against every cached value simultaneously); (3) the underlying invalidation-logic bug is fixed through the standard pipeline. **Escalation:** SEV-3 typically, escalated to SEV-2 if the incorrect cached data has a financial or trust-critical dimension (e.g., stale pricing).

## 13.7 Best Practices

- Never perform a blanket full-cache flush as a first response — restated from Section 13.6, since this indiscriminately removes the performance benefit caching provides for every namespace simultaneously and risks a stampede (10-backend-architecture.md Section 13.5); always scope a flush to the specific, identified affected keys/namespace.
- Treat Redis unreachability as a security-relevant incident by default (Section 13.4), not merely a performance concern, given its rate-limiting role.

## 13.8 Review Checklist

- [ ] Was the specific cache failure mode correctly identified (Section 13.2)?
- [ ] Was any cache-flush action scoped narrowly, never a blanket full flush (Section 13.7)?


---

# 14. Storage Recovery

## 14.1 Purpose

To state recovery procedures for Cloudflare R2 failure scenarios — restated and extended from 18-observability-monitoring.md Section 12.4–12.5's storage monitoring and 10-backend-architecture.md Section 11's media architecture.

## 14.2 Workflow

```
R2-related alert fires (18-observability-monitoring.md §12.6)
   │
   ▼
Identify failure mode:
   ├─ Complete unreachability (Section 14.4)
   ├─ Elevated upload/download error rate (Section 14.5)
   └─ Virus-scan pipeline backlog (Section 14.6)
```

## 14.3 Responsibilities

DevOps/Platform Engineering owns R2 infrastructure recovery; the Media module's owning engineers (10-backend-architecture.md Section 5.25) own pipeline-specific findings.

## 14.4 Recovery: Complete Unreachability

**Failure Scenario:** R2 is entirely unreachable — new uploads fail, existing media becomes unservable (or served in a degraded fashion if fronted by a CDN cache still holding recently-served assets, per that document's §22.6). **Recovery Steps:** (1) confirm via Cloudflare's status page and independent connectivity check (mirroring Section 12.8's dual-confirmation principle); (2) assess scope — is this affecting all media or a specific subset (e.g., only newly-uploaded content not yet CDN-cached); (3) communicate impact if user-visible (Section 23) — Product images failing to load is a highly visible, trust-relevant degradation given 00-project-vision.md's emphasis on authentic product presentation; (4) if vendor-side, monitor for resolution; if configuration-side (an expired credential, per Section 20.3's rotation schedule), correct directly. **Escalation:** SEV-1 if platform-wide and prolonged; SEV-2 if partial/limited.

## 14.5 Recovery: Elevated Upload/Download Error Rate

**Failure Scenario:** a meaningful share of upload or download requests are failing, short of complete unavailability. **Recovery Steps:** (1) confirm via error-rate monitoring (18-observability-monitoring.md §12.5) whether the failures are concentrated in a specific operation (upload confirmation, signed-URL generation, thumbnail retrieval) or general; (2) if deployment-correlated, roll back (Section 11.3); (3) if not deployment-correlated, investigate whether a specific upload-context (Product media vs. verification documents vs. message attachments, per 10-backend-architecture.md §11) is disproportionately affected, narrowing the investigation to that context's specific code path. **Escalation:** SEV-2 or SEV-3 depending on scope and which upload context is affected (verification-document failures block Creator onboarding, a High-priority path; a Message-attachment failure is lower-stakes).

## 14.6 Recovery: Virus-Scan Pipeline Backlog

**Failure Scenario:** the mandatory virus-scanning step (10-backend-architecture.md Section 11.6) is falling behind upload volume, delaying legitimate uploads from reaching `ready` status. **Recovery Steps:** (1) confirm via queue-depth monitoring (18-observability-monitoring.md §12.5); (2) assess whether this is a genuine throughput/scaling issue with the scanning service itself (an Integration Layer dependency, 10-backend-architecture.md §17) or a spike in upload volume outpacing normal capacity; (3) if a scanning-service-side issue, this is treated as a third-party dependency failure (Section 14's parallel procedure applied to this specific integration); (4) communicate to affected creators if the delay is significant (e.g., "your uploaded photos are being processed and will appear shortly") via the standard notification path, not left as a silent, confusing delay. **Escalation:** SEV-3 typically; escalated if the backlog is severe enough to functionally block Product publishing or Creator verification.

## 14.7 Best Practices

- Distinguish which upload context is affected before assessing severity (Section 14.5) — not every storage issue is equally urgent, and Creator-onboarding-blocking issues (verification documents) warrant faster escalation than a lower-stakes context.
- Proactively communicate processing delays (Section 14.6) rather than leaving creators to wonder why their upload hasn't completed — restated from Section 23's communication philosophy applied to a specific, common friction point.

## 14.8 Review Checklist

- [ ] Was the specific storage failure mode and affected upload context correctly identified (Section 14.2, 14.5)?
- [ ] Was user/creator-facing communication issued proportional to the delay's visibility and duration (Section 14.6)?

---

# 15. Authentication Recovery

## 15.1 Purpose

To state recovery procedures for Better Auth / authentication-layer failures — restated and extended from 10-backend-architecture.md Section 7's authentication architecture and 12-security-architecture.md's identity-security posture.

## 15.2 Workflow

```
Authentication-related alert fires (elevated login/session-refresh
failure rate, per 18-observability-monitoring.md §10.3)
   │
   ▼
Identify failure mode:
   ├─ Complete authentication outage (no one can log in) (Section 15.4)
   ├─ Session/token-refresh failures (existing sessions breaking) (Section 15.5)
   ├─ OAuth provider failure (Section 15.6)
   └─ Suspected credential-stuffing / brute-force attack (Section 15.7)
```

## 15.3 Responsibilities

The Auth module's owning engineers (10-backend-architecture.md Section 5.2) own authentication-specific recovery; Security/Compliance is engaged immediately for Section 15.7's attack scenario per Section 9.4's mandatory security-incident floor.

## 15.4 Recovery: Complete Authentication Outage

**Failure Scenario:** no user, of any role, can successfully log in. **Recovery Steps:** (1) confirm via login-endpoint monitoring (09-api-architecture.md §3.3) whether the failure is at the Better Auth layer itself, the underlying database (Section 12's procedures, since identity data lives in the same Postgres instance per 10-backend-architecture.md §7.1), or a recent deployment; (2) if deployment-correlated, roll back immediately (Section 11.3) — this is one of the platform's highest-severity possible incidents, since it blocks every single user interaction requiring authentication; (3) if database-correlated, follow Section 12's relevant procedure; (4) if neither, escalate immediately to the Auth module's owning engineers for deep investigation. **Escalation:** SEV-1, immediate, always.

## 15.5 Recovery: Session/Token-Refresh Failures

**Failure Scenario:** new logins succeed, but existing sessions are failing to refresh (09-api-architecture.md Section 3.5), effectively logging users out unexpectedly. **Recovery Steps:** (1) confirm via refresh-endpoint-specific monitoring whether this is isolated to the refresh flow or part of a broader auth issue (Section 15.4); (2) check for a recent change to refresh-token rotation logic or session-storage configuration (10-backend-architecture.md §7.2) as the likely deployment-correlated cause, rolling back if so; (3) assess whether this correlates with Redis unavailability (Section 13.4), since session caching depends on it. **Escalation:** SEV-2 — a significant, trust-eroding disruption even though new logins still function.

## 15.6 Recovery: OAuth Provider Failure

**Failure Scenario:** a specific OAuth provider (Google, Apple — 09-api-architecture.md Section 3.14) is failing, while email/password login continues to function. **Recovery Steps:** (1) confirm the failure is provider-side (checking that provider's own status) versus this platform's integration configuration; (2) if provider-side, this is a third-party dependency issue with a narrow, specific blast radius (only users who exclusively use that OAuth method are blocked) — communicate the specific affected login method clearly (Section 23) so unaffected users aren't confused into thinking the whole platform is down; (3) if configuration-side (an expired OAuth client credential), correct directly per Section 20.3's rotation-schedule discipline. **Escalation:** SEV-2 or SEV-3 depending on what share of the user base relies primarily on the affected provider.

## 15.7 Recovery: Suspected Credential-Stuffing / Brute-Force Attack

**Failure Scenario:** a sharp, anomalous spike in failed login attempts, potentially indicating an automated attack (09-api-architecture.md Section 8.3's brute-force throttling under active test). **Recovery Steps:** (1) confirm via `SecurityEvent`/`LoginHistory` monitoring (08-database-design.md §23.5–23.6) that this is genuinely attack-shaped (many failures against many distinct accounts from a concentrated set of sources) rather than, e.g., a legitimate client-side bug causing repeated failed retries; (2) Security/Compliance is engaged immediately per Section 9.4's mandatory floor; (3) rate-limiting thresholds for authentication endpoints (09-api-architecture.md §22.5) are reviewed and, if warranted, tightened temporarily; (4) affected accounts (if any successful unauthorized access is confirmed) are handled per 12-security-architecture.md's account-compromise response procedure. **Escalation:** SEV-2 minimum, per Section 9.4; escalated to SEV-1 if any successful unauthorized access is confirmed.

## 15.8 Best Practices

- Distinguish a broad authentication outage (Section 15.4) from a narrower, provider-specific failure (Section 15.6) quickly and communicate the distinction clearly — conflating the two either alarms unaffected users unnecessarily or under-communicates a genuinely broad problem.
- Treat any anomalous authentication-failure pattern with initial suspicion toward an attack (Section 15.7) rather than immediately assuming a benign technical cause, given the security stakes of being wrong in that direction.

## 15.9 Review Checklist

- [ ] Was the specific authentication failure mode correctly identified before a recovery path was chosen (Section 15.2)?
- [ ] Was Security/Compliance engaged immediately for any suspected attack pattern, per the mandatory floor (Section 15.7)?


---

# 16. Payment Recovery

## 16.1 Purpose

To state recovery procedures for Razorpay/payment-layer failures — restated and extended from 10-backend-architecture.md Section 16's payment architecture, 16-cicd-release-management.md Section 8's payment scenario matrix, and 18-observability-monitoring.md Section 14's third-party monitoring, applied here to live incident response for this platform's single highest-stakes dependency.

## 16.2 Workflow

```
Payment-related alert fires (Razorpay circuit breaker open, or elevated
payment failure rate, per 18-observability-monitoring.md §14.5)
   │
   ▼
Identify failure mode:
   ├─ Razorpay platform-wide outage (Section 16.4)
   ├─ Circuit breaker open, intermittent Razorpay degradation (Section 16.5)
   ├─ Webhook delivery failure/lag (Section 16.6)
   ├─ Payout processing failure (Section 16.7)
   └─ Suspected fraudulent transaction pattern (Section 16.8)
```

## 16.3 Responsibilities

The Payments module's owning engineers (10-backend-architecture.md Section 5.14) own payment-recovery execution; Finance/Founders are engaged for anything requiring real financial reconciliation decisions (Section 16.7).

## 16.4 Recovery: Razorpay Platform-Wide Outage

**Failure Scenario:** Razorpay is entirely unreachable or failing all requests. **Recovery Steps:** (1) confirm via Razorpay's status page and independent monitoring (18-observability-monitoring.md §14.7's dual-confirmation principle); (2) confirm the circuit breaker (10-backend-architecture.md §17.5) has correctly opened, shedding load with fast, clear failures rather than every checkout attempt hanging to its full timeout; (3) communicate clearly to buyers attempting checkout (Section 23) — a specific, honest "payment processing is temporarily unavailable, please try again shortly" message, never a generic, confusing error; (4) monitor Razorpay's status for resolution; the circuit breaker automatically attempts recovery per its configured cool-down (that document's §17.5) — no manual re-enable action is needed unless the automatic recovery itself appears stuck. **Escalation:** SEV-1 — this directly blocks the platform's core commerce function.

## 16.5 Recovery: Circuit Breaker Open, Intermittent Degradation

**Failure Scenario:** Razorpay is not fully down but is slow/unreliable enough that the circuit breaker has opened. **Recovery Steps:** (1) confirm via dependency monitoring (18-observability-monitoring.md §14.3) the actual severity — is this a brief, self-resolving blip or a sustained degradation; (2) if sustained, treat as Section 16.4's scenario for communication purposes even though it's not a complete outage, since the user-facing effect (checkout unavailable) is the same; (3) avoid manually forcing the circuit breaker closed prematurely — its cool-down-then-test-request design (10-backend-architecture.md §17.5) exists specifically to avoid re-opening the floodgates onto a still-struggling dependency, which would worsen rather than help the situation. **Escalation:** SEV-2, escalated to SEV-1 if sustained beyond a short window.

## 16.6 Recovery: Webhook Delivery Failure/Lag

**Failure Scenario:** Razorpay webhooks (payment confirmation, refund status) are delayed or failing to arrive, per 10-backend-architecture.md Section 16.3's dual-path (synchronous + webhook) order-confirmation design. **Recovery Steps:** (1) confirm whether the synchronous client-confirmation path (09-api-architecture.md §9.10) is still functioning correctly — if so, impact is limited, since that path alone can complete order creation even without webhook confirmation arriving promptly; (2) if both paths are affected, this is a more severe, Section 16.4-equivalent scenario; (3) once webhook delivery resumes, confirm the idempotent processing design (10-backend-architecture.md §21.4 of the API doc) correctly handles the backlog of delayed webhooks without creating duplicate processing — this should be automatic by design, but is explicitly verified, not assumed, following a significant delay incident. **Escalation:** SEV-2 or SEV-3 depending on whether the synchronous path remains functional.

## 16.7 Recovery: Payout Processing Failure

**Failure Scenario:** the scheduled `payouts` Inngest job (10-backend-architecture.md Section 16.7) fails to correctly process creator payouts. **Recovery Steps:** (1) confirm scope — did the job fail entirely, or did specific individual payouts within the batch fail; (2) do **not** re-trigger a failed payout batch without careful review — restated as this procedure's most important caution: a naive retry risks double-paying creators whose payout actually succeeded before the job reported failure, given the real-money stakes; (3) reconcile the batch's actual state against Razorpay's own payout records (10-backend-architecture.md Section 16.8's audit-trail discipline) before any corrective action; (4) Finance/Founders are engaged given the direct financial-reconciliation stakes; (5) affected creators are proactively communicated with (Section 23) if their payout is delayed, since this directly affects their livelihood, per 00-project-vision.md's creator-first value. **Escalation:** SEV-1, always, per Section 9.5's financial-incident floor.

## 16.8 Recovery: Suspected Fraudulent Transaction Pattern

**Failure Scenario:** an anomalous pattern of transactions suggesting fraud (stolen-card testing, coordinated abuse of a coupon/refund flow). **Recovery Steps:** (1) confirm via transaction-pattern monitoring and Razorpay's own fraud-detection signals; (2) Security/Compliance engaged immediately per Section 9.4's mandatory floor; (3) affected transaction types/methods may be temporarily restricted (e.g., disabling a specific payment method showing concentrated abuse) as a contained mitigation; (4) confirmed-fraudulent transactions are handled per the standard `Dispute`/`Refund` workflow (08-database-design.md Section 14.7–14.8) plus any additional account-level action (a Ban, per that document's Section 19.7) warranted by the Moderation domain. **Escalation:** SEV-2 minimum, per Section 9.4/9.5's mandatory floors.

## 16.9 Best Practices

- Never re-trigger a failed payout batch without full reconciliation against Razorpay's own records first (Section 16.7) — this is the single highest-consequence mistake possible in this entire runbook, given the risk of double-paying real money to real creators.
- Trust the circuit breaker's own automatic recovery cool-down (Section 16.5) rather than manually forcing it closed early — restated from that section, premature manual intervention here typically worsens rather than helps the situation.

## 16.10 Review Checklist

- [ ] Was payout-batch reconciliation performed against Razorpay's own records before any corrective action (Section 16.7)?
- [ ] Was Finance/Founders engaged for any incident with real financial-reconciliation stakes (Section 16.3)?

---

# 17. Background Job Recovery

## 17.1 Purpose

To state recovery procedures for Inngest job failures — restated and extended from 10-backend-architecture.md Section 12's background-job architecture and 18-observability-monitoring.md Section 13's job monitoring.

## 17.2 Workflow

```
Job-related alert fires (18-observability-monitoring.md §13.4)
   │
   ▼
Identify failure mode:
   ├─ A specific job family showing elevated failure rate (Section 17.4)
   ├─ Job-family "silence" — unexpectedly zero executions (Section 17.5)
   ├─ Growing queue depth / execution lag (Section 17.6)
   └─ Dead-letter (exhausted-retry) jobs accumulating (Section 17.7)
```

## 17.3 Responsibilities

The owning module's engineers (10-backend-architecture.md Section 5, per job family) own job-specific recovery; DevOps/Platform Engineering owns Inngest infrastructure-level issues.

## 17.4 Recovery: Elevated Failure Rate for a Specific Job Family

**Failure Scenario:** a specific job family (e.g., `notifications`) shows a failure rate significantly above baseline. **Recovery Steps:** (1) examine recent failed job executions' traces/logs (18-observability-monitoring.md §6, §4) to identify the specific failing step; (2) check whether the failure correlates with a specific downstream dependency's own issue (Resend for `notifications`, Razorpay for `payouts` — Section 16's procedures apply if so); (3) if code-deployment-correlated, roll back (Section 11.3); (4) if the failure is isolated to a specific job step with a clear, safe fix, consider a targeted hotfix (16-cicd-release-management.md §17). **Escalation:** SEV-1 for `payouts` (per Section 16.7's stakes); SEV-2/3 for other families depending on user-facing consequence.

## 17.5 Recovery: Job-Family Silence

**Failure Scenario:** a job family that should be actively executing shows zero executions — restated from 18-observability-monitoring.md Section 13.7 as a uniquely dangerous failure mode since it produces no failure signal, only an absence. **Recovery Steps:** (1) confirm the triggering event is actually being emitted by the upstream Service Layer function (10-backend-architecture.md §12.9) — check whether the emission code itself is functioning, possibly via a recent deployment correlation; (2) confirm Inngest's own event-ingestion/routing is healthy (a wiring-level check, that document's §17.6); (3) if the emission side is broken, roll back or hotfix the specific emitting code; (4) if Inngest-side, escalate to DevOps/Platform Engineering for infrastructure-level investigation, and consider whether Inngest itself is experiencing a vendor-side incident (Section 14's parallel procedure). **Escalation:** SEV-2, given how easily this failure mode can go unnoticed and accumulate significant unprocessed backlog before detection.

## 17.6 Recovery: Growing Queue Depth / Execution Lag

**Failure Scenario:** a job family's triggering events are arriving faster than they're being processed. **Recovery Steps:** (1) confirm via queue-depth monitoring (18-observability-monitoring.md §13.3) whether this correlates with an unusual traffic spike (in which case it may resolve as the spike subsides, monitored rather than urgently intervened upon) or a genuine throughput regression (in which case a recent change to the job's own logic, or a downstream dependency slowdown, is the likely cause); (2) for `payouts` specifically, any lag is treated with elevated urgency given the direct financial-timeliness implications for creators. **Escalation:** SEV-2/3 depending on family and severity of lag.

## 17.7 Recovery: Dead-Letter Job Accumulation

**Failure Scenario:** jobs are exhausting their retry budget and landing in a permanent-failure state (10-backend-architecture.md Section 18.5). **Recovery Steps:** (1) review each dead-lettered job individually, not only in aggregate (restated from 18-observability-monitoring.md §13.7) — each represents a specific, real business event that failed to complete; (2) for `payouts`-family dead letters, immediate, individual remediation is required given the financial stakes (a specific creator's payout genuinely failed to process and needs manual attention, following Section 16.7's reconciliation-first discipline); (3) for lower-stakes families (e.g., a single failed `notifications` job), manual re-triggering after confirming the underlying cause is resolved is generally safe, given the idempotent-by-design job architecture (10-backend-architecture.md §12.2). **Escalation:** SEV-1 for `payouts` dead letters; SEV-3/4 for most other families.

## 17.8 Best Practices

- Treat job-family silence (Section 17.5) with the same urgency as an elevated failure rate, despite producing no direct failure signal — restated from 18-observability-monitoring.md Section 13.7, this is precisely the failure mode most likely to be missed without deliberate attention.
- Review every dead-lettered `payouts` job individually and promptly (Section 17.7) — this is a real creator's real, delayed income, not merely a technical cleanup task.

## 17.9 Review Checklist

- [ ] Was the specific job-family failure mode correctly identified (Section 17.2)?
- [ ] Were `payouts`-family failures/dead-letters given Section 9.5-mandated SEV-1 urgency and individual remediation (Sections 17.4, 17.7)?


---

# 18. Backup & Restore

## 18.1 Purpose

To state how this platform's backups are validated and how a restore is actually performed — restated and fully operationalized from 14-infrastructure-devops-architecture.md Section 19's backup/DR infrastructure and 08-database-design.md Section 29.7's backup-encryption posture into concrete, executable procedure.

## 18.2 What Is Backed Up

| Data | Backup Mechanism | Frequency |
|---|---|---|
| Supabase PostgreSQL (all application data, 08-database-design.md's full schema) | Continuous/point-in-time-recovery backup (Supabase's managed capability, 14-infrastructure-devops-architecture.md §19) | Continuous (point-in-time recovery within a defined retention window) |
| Cloudflare R2 media assets | R2's own durability guarantees (object storage's inherent redundancy) plus this platform's own reference-counted retention discipline (10-backend-architecture.md §25.1) | Continuous (inherent to object storage) |
| Application configuration/secrets | Version-controlled (for non-secret config) or the CI/CD platform's own encrypted secrets store's built-in redundancy (for secrets, 16-cicd-release-management.md §25.2) | Continuous (inherent to the storage mechanism) |
| Codebase | Git repository (GitHub's own redundancy) | Continuous |

## 18.3 Workflow — Backup Validation (Weekly, Cross-Referenced from Section 5)

```
Automated backup completion signal checked (Section 5.3's weekly item)
   │
   ▼
Backup integrity spot-check — confirm the backup is not just "completed"
but genuinely restorable (a metadata/checksum-level check, distinct from
a full restore test)
   │
   ▼
Any anomaly ──► escalate immediately (Section 18.7), never deferred to
the next monthly restore test
```

## 18.4 Workflow — Restore Verification (Monthly, Cross-Referenced from Section 6)

```
Select a recent backup point
   │
   ▼
Restore into an isolated, non-production environment (never restore-tested
directly against production)
   │
   ▼
Verify: schema matches expectations, a representative sample of data is
present and correct, referential integrity holds (spot-checking a few
of 08-database-design.md's documented entity relationships)
   │
   ▼
Verify application code (a specific commit, per 16-cicd-release-management.md
§23.2) can successfully connect to and operate against the restored data
   │
   ▼
Document actual restore duration (feeding Section 19.3's RTO tracking)
   │
   ▼
Tear down the test-restore environment
```

## 18.5 Point-in-Time Recovery Procedure

**Rule:** restoring to a specific point in time (e.g., "restore to 10 minutes before the corruption began," per Section 12.7's data-corruption scenario) uses Supabase's native point-in-time-recovery capability, restoring into a **new**, isolated database instance first — never restoring directly over the live production database in place. Once the restored instance is verified correct (per Section 18.4's verification steps, compressed under incident time pressure but not skipped), a deliberate cutover decision is made (which data, if any, between the restore point and the present must be reconciled or accepted as lost, per the incident's specific RPO implications, Section 19.3).

## 18.6 Responsibilities

DevOps/Platform Engineering owns backup infrastructure, the weekly validation check, and the monthly restore-verification test; Engineering Leadership is informed of every restore-verification result, not only failures.

## 18.7 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| A backup fails to complete | An infrastructure-level issue with the backup mechanism itself | Escalated immediately as a Critical-priority finding (Section 6.6's identical stance) — a missed backup is a direct hole in disaster-recovery readiness, not a routine, deferrable issue |
| A restore test succeeds but takes significantly longer than the target RTO (Section 19.3) | The restore procedure or infrastructure isn't fast enough for the platform's stated recovery objectives | Investigated and improved (a faster restore mechanism, a smaller/more targeted restore scope) before the next monthly cycle, since this directly threatens the platform's actual disaster-recovery capability regardless of backup data integrity being fine |

## 18.8 Recovery Steps

Fully specified in Section 18.5 for point-in-time recovery; a failed backup (Section 18.7) is recovered by immediately identifying and fixing the underlying backup-mechanism issue, with an out-of-cycle backup triggered manually if the automated one failed.

## 18.9 Escalation

A failed backup or a restore test revealing a significant integrity or RTO gap escalates immediately to Engineering Leadership, per Section 6.8's identical stated urgency.

## 18.10 Best Practices

- Always restore into an isolated environment first, never directly over production — restated as this section's single most important safety rule, protecting against a restore procedure itself introducing new problems into the live system.
- Track actual restore duration every time (Section 18.4), building a real, evidence-based understanding of this platform's actual RTO capability rather than an assumed or aspirational one.

## 18.11 Review Checklist

- [ ] Was the most recent backup validation and restore-verification test completed and passing (Sections 18.3–18.4)?
- [ ] Was any restore performed into an isolated environment first, never directly over production (Section 18.5)?

---

# 19. Disaster Recovery

## 19.1 Purpose

To state the platform's complete response to a genuinely catastrophic event — one severe enough to threaten sustained operation, not merely a component failure Sections 12–17 already cover — restated and fully operationalized from 14-infrastructure-devops-architecture.md Section 19's DR infrastructure into this document's most serious, least-frequently-invoked, most-rehearsed procedure.

## 19.2 What Qualifies as a Disaster

Restated as a deliberately narrow, high-bar definition: a complete, prolonged Vercel or Supabase platform-level outage with no clear resolution timeline; a confirmed, severe data-integrity catastrophe affecting a broad swath of the platform's data; or a security breach severe enough to require a full platform-wide credential rotation and integrity review before service can be trusted to resume. A single-component failure, however severe (even a SEV-1 database or payment outage), is handled by Sections 12–17's procedures first — disaster recovery is invoked specifically when those procedures prove insufficient to the scale of the event.

## 19.3 RTO and RPO

| Objective | Target | Rationale |
|---|---|---|
| RTO (Recovery Time Objective) | A defined maximum acceptable downtime (calibrated against real, drilled restore-duration data, per Section 18.4, not an aspirational guess) | Balances the real cost of extended downtime against the cost of over-engineering for a faster-than-necessary recovery capability |
| RPO (Recovery Point Objective) | A defined maximum acceptable data loss window, informed by Supabase's point-in-time-recovery granularity (Section 18.5) | Reflects how much "replay the last few minutes of activity" loss is tolerable versus how much would constitute unacceptable harm to buyers/creators |

Both targets are set deliberately, reviewed at every Quarterly Operations cycle (Section 7.3) against real drilled performance, and never treated as fixed-forever numbers disconnected from actual demonstrated capability.

## 19.4 Disaster Recovery Workflow

```
Disaster confirmed (Section 19.2's bar met) ──► Engineering Leadership +
Founders notified immediately
   │
   ▼
Incident Commander (a senior-most available engineer) takes charge of
the full recovery effort, distinct in scale from a standard SEV-1 IC role
   │
   ▼
Assess: is the primary infrastructure (Vercel/Supabase) itself recovering
on its own vendor-side timeline, or does this platform need to execute
its own restore (Section 18.5) into alternate infrastructure?
   │
   ▼
Execute the appropriate recovery path — vendor-side wait-and-monitor,
or full platform restore
   │
   ▼
Full integrity verification before resuming traffic (data correctness,
security posture confirmed clean if the disaster involved a breach)
   │
   ▼
Gradual, monitored traffic resumption (mirroring 16-cicd-release-
management.md §15.3's staged-rollout philosophy, applied here to
disaster recovery rather than a feature release)
   │
   ▼
Full postmortem (Section 24), mandatorily reviewed at the Board/Founder
level given the event's severity
```

## 19.5 Communication During a Disaster

Restated and elevated from Section 23's standard incident-communication framework: a disaster-level event warrants the most transparent, most frequent communication this platform ever issues — buyers and creators are kept informed via every available channel (status page, email, in-app banner) with honest, regularly-updated information, even when the news is "we don't yet have a resolution timeline," since restated from Section 1.7's guiding principle, silence is never the safe default, and it is at its most costly during the platform's most severe events.

## 19.6 Disaster Recovery Drills

**Rule:** restated and elevated from Section 7.3's quarterly requirement: a full, realistic disaster-recovery drill is conducted at minimum quarterly, simulating a genuine catastrophic scenario (e.g., "the production database is being restored from backup into entirely new infrastructure") end-to-end, with actual RTO/RPO measured against target (Section 19.3) — a drill that reveals a significant gap is treated with the same seriousness as a real disaster's postmortem (Section 7.6), and the drill is repeated after remediation to confirm the gap is genuinely closed, not merely believed fixed.

## 19.7 Responsibilities

Engineering Leadership owns disaster classification (Section 19.2) and drill scheduling; the disaster-response Incident Commander (a senior-most available engineer) owns execution; Founders are informed immediately and involved in any business-continuity decisions (customer remediation commitments, public communication tone) beyond pure technical recovery.

## 19.8 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| A genuine disaster occurs and the team discovers the drilled procedure doesn't actually work as expected under real conditions | A gap the drills (Section 19.6) hadn't yet surfaced, or a genuinely novel failure mode | Handled via improvised, IC-coordinated response under Section 8.5's multi-responder discipline, with the specific gap becoming the highest-priority finding in the subsequent postmortem (Section 24) and immediately incorporated into the next drill |
| RTO/RPO targets prove unrealistic against the platform's actual infrastructure capability | Targets set aspirationally rather than from real drilled data | Recalibrated at the next Quarterly Operations review (Section 7) against actual demonstrated performance, communicated honestly to Founders/stakeholders rather than left as an unmet, undiscussed gap |

## 19.9 Recovery Steps

Fully specified in Section 19.4's workflow.

## 19.10 Escalation

A confirmed disaster is, by definition, already escalated to the highest level (Engineering Leadership + Founders, Section 19.4) — there is no further escalation tier beyond this within the platform's own organization.

## 19.11 Best Practices

- Rehearse disasters as if they were real (Section 7.9's identical stated principle) — a drill's entire value depends on genuine rigor, not a walkthrough treated as a formality.
- Communicate with maximal honesty and frequency during an actual disaster (Section 19.5) — restated as this platform's single most important crisis-communication principle, since trust, once damaged by perceived silence or evasiveness during the platform's worst moment, is far harder to rebuild than the technical system itself.

## 19.12 Review Checklist

- [ ] Does the most recent disaster-recovery drill's measured RTO/RPO meet target (Section 19.3, 19.6)?
- [ ] Were Founders and Engineering Leadership notified immediately upon disaster classification, per Section 19.4?


---

# 20. Maintenance Procedures

## 20.1 Purpose

To state the routine, planned maintenance actions that keep the platform's operational foundation healthy — restated and extended from 12-security-architecture.md's secrets-rotation policy and 10-backend-architecture.md Section 17.6's secrets-management architecture into concrete, scheduled procedure.

## 20.2 Maintenance Schedule

| Maintenance Activity | Frequency | Requires a Maintenance Window? |
|---|---|---|
| Secret rotation — third-party API keys (Razorpay, Resend, R2, Sentry, PostHog) | Per 12-security-architecture.md's rotation policy (typically quarterly or per-vendor-recommendation) | No, if rotated with proper overlap (Section 20.3); Yes, if a provider requires a hard cutover |
| Secret rotation — internal signing keys (Better Auth JWT signing) | Per that document's rotation policy | Yes — a signing-key rotation requires careful overlap handling (Section 20.3) to avoid invalidating in-flight sessions abruptly |
| Dependency updates (npm packages, per 15-engineering-standards.md §19.8) | Ongoing, via standard PR process; security-critical updates expedited | No — travels through the standard CI/CD pipeline (16-cicd-release-management.md §6) |
| Database maintenance (index rebuilding, vacuum operations, if not fully automatic under Supabase's managed service) | As needed, informed by 18-observability-monitoring.md §11.3's monitoring | Sometimes, for anything with a potential performance-impact window |
| TLS/certificate renewal | Per certificate validity period, automated where the hosting/CDN platform supports it (typical for Vercel/Cloudflare-fronted domains) | No, if automated; escalated as an operational finding if any manual renewal step is ever discovered still necessary |

## 20.3 Secret Rotation Procedure

**Rule:** every credential rotation follows an overlap pattern — the new credential is provisioned and verified functional *before* the old one is revoked, never a hard cutover that risks a gap where neither credential is valid. **Workflow:** (1) generate/obtain the new credential from the provider; (2) update the CI/CD platform's encrypted secrets store (16-cicd-release-management.md §25.2) with the new value, deployed and verified functional in a lower environment first (Staging); (3) confirm Production is using the new credential successfully; (4) revoke the old credential only after this confirmation; (5) record the rotation in the audit trail (that document's §26.2). **Emergency rotation** (following a suspected leak, per that document's §8.4/8.9) skips the leisurely overlap-verification sequence in favor of immediate revocation-then-replacement, accepting brief service disruption as the necessary trade-off against continued exposure risk.

## 20.4 Certificate Renewal

Given this platform's Vercel/Cloudflare-fronted hosting (14-infrastructure-devops-architecture.md's stated architecture), TLS certificate provisioning and renewal is expected to be fully automated by the hosting/CDN platform — this section's operational role is simply to periodically confirm (at the Monthly Operations review, Section 6.3) that automated renewal is actually functioning, since a silent automation failure here would otherwise go unnoticed until a certificate actually expired and caused an outage.

## 20.5 Maintenance Windows

**Rule:** a maintenance action requiring one is communicated to affected users in advance (Section 23's communication framework, applied here proactively rather than reactively) with a clear stated time window and expected impact — restated from 16-cicd-release-management.md Section 14.5's identical stated caution around scheduling risky work: a maintenance window is scheduled during a period of lower traffic where feasible, and never scheduled immediately before a period of reduced team availability (a weekend, a holiday) unless genuinely unavoidable.

## 20.6 Responsibilities

DevOps/Platform Engineering owns the maintenance schedule and execution; Security/Compliance owns the rotation policy itself (12-security-architecture.md); the release owner/on-call engineer (16-cicd-release-management.md Section 27.3) monitors any maintenance action through its own observation window, exactly as a standard deployment would be (that document's Section 20.5).

## 20.7 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| A credential rotation is discovered to have missed its scheduled window | Insufficient tracking/reminder discipline | Caught at the Quarterly Operations security review (Section 7.4); rotated immediately upon discovery, following the standard overlap procedure (Section 20.3) unless the delay itself suggests elevated risk warranting emergency rotation |
| A maintenance action causes unexpected user-facing impact despite being planned | Insufficient testing of the maintenance action itself in a lower environment first | Treated as an incident per Section 8's standard workflow, with the maintenance procedure itself reviewed and improved for next time |

## 20.8 Recovery Steps

A failed/incomplete rotation is recovered by completing the overlap procedure (Section 20.3) as soon as discovered; an unexpectedly impactful maintenance action is recovered via the standard incident-response workflow (Section 8), potentially including a rollback (Section 11.3) if the maintenance action was deployment-adjacent.

## 20.9 Escalation

A missed rotation deadline discovered at the quarterly review escalates to Security/Compliance immediately, not deferred to the next scheduled rotation cycle.

## 20.10 Best Practices

- Always use the overlap pattern for routine rotation (Section 20.3) — a hard cutover is unnecessary risk for a situation that isn't an emergency.
- Test any maintenance action with real production-adjacent impact in Staging first, exactly as a standard code change would be (16-cicd-release-management.md §19), even though maintenance actions don't travel through the standard code-deployment pipeline.

## 20.11 Review Checklist

- [ ] Are all scheduled credential rotations on track per Section 20.2's schedule, confirmed at the Quarterly review (Section 7.4)?
- [ ] Did any recent maintenance action requiring a window follow Section 20.5's communication and scheduling discipline?

---

# 21. Change Management

## 21.1 Purpose

To state how operationally-risky changes **outside** the standard code-deployment pipeline (16-cicd-release-management.md's full scope) are governed — a manual database operation, a DNS change, a third-party service configuration change, an emergency credential rotation — restated and extended from that document's Section 26.6 bypass-procedure discipline into this document's own, broader change-control framework.

## 21.2 What Counts as a "Change" Under This Section

Restated from Section 1.5's definition: any operational action with the potential to affect production behavior that does **not** travel through the standard CI/CD pipeline (16-cicd-release-management.md Section 6) — a manual `SQL` query run directly against production for a data-correction task (Section 12.7), a DNS record change, a third-party dashboard configuration change (e.g., adjusting a Razorpay account setting), or an emergency credential rotation (Section 20.3).

## 21.3 Change Approval Workflow

```
Change proposed (by any engineer)
   │
   ▼
Risk-assessed: Is this reversible? What's the blast radius if it goes wrong?
   │
   ▼
Low-risk, easily reversible ──► A single senior engineer's review/approval
   │                              suffices
   ▼
High-risk or hard-to-reverse (e.g., a manual data-correction write,
Section 12.7; a DNS change affecting the primary domain) ──► Requires
a second engineer's independent review before execution, mirroring
16-cicd-release-management.md §12.5's irreversible-migration sign-off
discipline
   │
   ▼
Executed, with the specific action and its outcome logged (Section 21.5)
   │
   ▼
Verified (per 18-observability-monitoring.md's toolset) that the intended
effect occurred and no unintended side effect resulted
```

## 21.4 Emergency Change Exception

**Rule:** during an active SEV-1/2 incident, a change may be executed with the Incident Commander's authorization alone (rather than Section 21.3's full second-reviewer process) if waiting for that fuller review would meaningfully worsen the incident's impact — restated identically from 16-cicd-release-management.md Section 17.5's hotfix-authorization discipline, applied here to non-code operational changes: this is a compressed-timeline exception, never a skipped-rigor one, and the change is still fully logged and reviewed after the fact (Section 21.5).

## 21.5 Change Logging

**Rule:** every change under this section's scope is logged with: what was changed, why, who executed it, who approved it (per Section 21.3's risk-tiered approval), and its verified outcome — restated from 16-cicd-release-management.md Section 26's audit-trail discipline, extended here to cover the operational-change category that document's own audit trail (scoped to the code pipeline) doesn't capture.

## 21.6 Responsibilities

Every engineer proposing an operational change follows Section 21.3's risk-tiered approval process; the Incident Commander has standing authority for Section 21.4's emergency exception during an active incident; DevOps/Platform Engineering owns the change log's completeness and periodic review.

## 21.7 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| A change is executed without the appropriate review tier | Time pressure or an incomplete understanding of the change's actual risk/reversibility | Treated as a process gap, reviewed at the next Weekly Operations review (Section 5) — not punitive toward the individual, per Section 2.5's blameless culture, but corrected going forward |
| A logged change's outcome doesn't match its intended effect | An error in the change itself, or an unanticipated side effect | Investigated as a standard incident if the discrepancy is causing active harm (Section 8); otherwise corrected and re-verified |

## 21.8 Recovery Steps

An incorrectly-executed change is corrected via a follow-up change through the same Section 21.3 process (reversing or fixing the original action), never left uncorrected because "it's already done."

## 21.9 Escalation

A change causing active production harm is escalated exactly as any other incident would be (Section 10), regardless of the fact that it originated from a manual operational action rather than a code deployment.

## 21.10 Best Practices

- Default to the higher-review tier when a change's risk/reversibility is genuinely uncertain (restated from 16-cicd-release-management.md §14.9's identical principle, applied here).
- Log every change immediately upon execution, not reconstructed from memory afterward — restated from Section 21.5, this is what makes the change log a trustworthy audit artifact.

## 21.11 Review Checklist

- [ ] Was this change correctly risk-tiered and approved per Section 21.3, with Section 21.4's emergency exception used only when genuinely warranted?
- [ ] Is the change fully logged with its verified outcome (Section 21.5)?

---

# 22. Operational KPIs

## 22.1 Purpose

To state the specific, tracked numbers this platform uses to judge whether its operational practice (this entire document) is actually working — restated and consolidated from 18-observability-monitoring.md Section 19.6's MTTD/MTTR and Section 20's SLO/error-budget framework, plus this document's own operational-cadence-specific metrics.

## 22.2 Core Operational KPIs

| KPI | What It Measures | Target Direction |
|---|---|---|
| MTTD (Mean Time to Detect) | Time from an issue's actual onset to detection (18-observability-monitoring.md §19.6) | Decreasing, or stable at an already-low value |
| MTTR (Mean Time to Resolve) | Time from detection to verified resolution | Decreasing, or stable at an already-low value |
| Incident count, by severity | Raw frequency of SEV-1 through SEV-4 incidents | Decreasing for SEV-1/2 specifically; stable-or-decreasing overall |
| Postmortem completion rate | Percentage of incidents with a completed postmortem (Section 24) within the expected timeframe | 100% — restated as a non-negotiable target, not merely an aspiration |
| Postmortem action-item closure rate | Percentage of postmortem action items actually completed, not left open indefinitely | High, tracked to catch the specific failure mode of "we said we'd fix it and didn't" |
| Disaster-recovery drill RTO/RPO | Actual measured performance against target (Section 19.3) | Meeting or beating target consistently |
| Error budget consumption (per SLO) | 18-observability-monitoring.md §20.4 | Healthy remaining budget, reviewed per that document's escalating policy (§20.5) |
| On-call page volume and after-hours page rate | How often the on-call rotation is actually paged, and how much of that is off-hours | Low and stable — a rising trend signals either a real reliability regression or alert-fatigue-inducing miscalibration (18-observability-monitoring.md §17.9), both worth investigating |

## 22.3 Monitoring Strategy

Every KPI in Section 22.2 is tracked continuously and reviewed at the cadence appropriate to its own volatility — MTTD/MTTR and incident counts at the Weekly review (Section 5); error budgets and DR drill results at the Monthly/Quarterly reviews (Sections 6–7) respectively, per those sections' own stated cadences.

## 22.4 Responsibilities

DevOps/Platform Engineering owns KPI tracking infrastructure; Engineering Leadership owns interpreting KPI trends into concrete investment decisions (more reliability-focused capacity, a change to on-call structure, a renewed push on postmortem follow-through).

## 22.5 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| MTTR trends upward over several months | A growing system complexity outpacing the team's diagnostic tooling/familiarity, or a specific recurring root-cause pattern not being fully addressed | Investigated at the Monthly review (Section 6) as a dedicated topic, potentially informing an investment in 18-observability-monitoring.md's tooling or this document's own runbook clarity |
| Postmortem action-item closure rate is low | Action items are logged but not actually prioritized against ordinary feature work | Escalated to Engineering Leadership as a resourcing/prioritization conversation — restated from Section 25's continuous-improvement discipline, an unclosed action item represents a known, identified risk left unaddressed |

## 22.6 Recovery Steps

Not applicable at this section's level — KPI trends inform investment decisions, not direct recovery actions.

## 22.7 Escalation

A sustained negative KPI trend (Section 22.5) escalates to Engineering Leadership at the relevant review cadence, or immediately if the trend suggests an acute, worsening risk rather than a gradual one.

## 22.8 Best Practices

- Review KPI trends over months, not just react to any single data point — restated from 18-observability-monitoring.md Section 10.7's identical stated concern about gradual degradation being different from, and often more important than, any single threshold breach.
- Use postmortem action-item closure rate as a genuine accountability metric, not a vanity number — restated from Section 22.5, since this is precisely the metric that reveals whether Section 24's learning loop is actually closing or merely producing well-intentioned documents nobody follows up on.

## 22.9 Review Checklist

- [ ] Are all Section 22.2 KPIs tracked continuously and reviewed at their appropriate cadence?
- [ ] Has postmortem action-item closure rate been reviewed recently, with any gap escalated (Section 22.5)?


---

# 23. Communication Plan

## 23.1 Purpose

To state how this platform communicates during an incident — to affected users, to internal stakeholders, and across the responding team itself — restated as the concrete execution of Section 1.7's "communicate early, communicate often, communicate honestly" guiding principle.

## 23.2 Communication Channels by Audience

| Audience | Channel | Owner |
|---|---|---|
| Internal responding team | The incident coordination channel (Section 8.2) | Incident Commander |
| Broader engineering team | A status update in the team's standard channel | Incident Commander |
| Support | Direct, proactive notification, ahead of buyer/creator inquiries where possible | Incident Commander, executed via Support's own escalation path (16-cicd-release-management.md §27.2) |
| Buyers/Creators | A status page and/or in-app banner for SEV-1/2 incidents with user-visible impact; email for anything requiring individual account-level follow-up (e.g., a specific delayed payout, per Section 16.7) | Incident Commander, with Support/Product executing the actual outward-facing message |
| Founders/Board | Direct notification for SEV-1/2 and always for a disaster-level event (Section 19.5) | Incident Commander |

## 23.3 Communication Cadence

**Rule:** for a SEV-1/2 incident, a status update is issued at a regular, predictable interval (e.g., every 30 minutes) even when there's no new substantive information — restated from Section 1.7: "we're still investigating, no new update" is a legitimate, valuable communication in its own right, since it confirms the incident hasn't been forgotten, and silence is never an acceptable substitute for a scheduled update, however uneventful.

## 23.4 Communication Templates — Structure (Not Verbatim Scripts)

Every incident communication, regardless of audience, follows a consistent structure: **what's happening** (in plain language, avoiding internal jargon for external-facing messages), **who's affected** (as specifically as can be honestly stated), **what we're doing about it**, and **when to expect the next update**. A resolution communication additionally states **what was fixed** and, where appropriate, **what we're doing to prevent recurrence** (a brief, honest pointer to the postmortem process, Section 24, without needing to expose its full technical detail externally).

## 23.5 Internal vs. External Communication Discipline

**Rule:** internal, technical detail (specific root-cause hypotheses, specific system names) is appropriate for Section 23.2's internal channels but is translated into plain, non-technical language for buyer/creator-facing communication — restated as a deliberate, considered translation step the Incident Commander or Support explicitly performs, never a copy-paste of internal engineering shorthand into a customer-facing message.

## 23.6 Responsibilities

The Incident Commander owns the overall communication cadence and internal updates; Support owns translating and delivering buyer/creator-facing communication (Section 23.5), working directly with the IC rather than independently guessing at appropriate messaging.

## 23.7 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| An incident runs long with no external communication issued | The responding team is fully consumed by technical resolution, with no one explicitly assigned the communication role | Restated from Section 8.5's role-assignment discipline: the IC assigns communication as an explicit responsibility from the start of any SEV-1/2 incident, never left as an implicit "someone will get to it" |
| A communicated resolution turns out to be premature (the issue recurs) | Declaring resolution before full verification (18-observability-monitoring.md §20's post-fix verification discipline) | A prompt, honest follow-up communication is issued immediately upon recurrence — restated from Section 23.1's honesty principle, never allowed to go uncorrected out of a reluctance to admit the initial "all clear" was wrong |

## 23.8 Recovery Steps

Not applicable — this section governs communication process, not technical recovery.

## 23.9 Escalation

A significant communication gap or error (Section 23.7) is itself escalated to Engineering Leadership/Product for review, treated with the same seriousness as a technical process gap.

## 23.10 Best Practices

- Assign the communication role explicitly and early in any SEV-1/2 incident (Section 23.7) — never leave it as an assumed, unassigned responsibility.
- When in doubt about whether to communicate something, communicate it — restated from Section 1.7, the cost of a slightly-too-cautious extra update is trivial compared to the trust cost of perceived silence.

## 23.11 Review Checklist

- [ ] Was communication explicitly assigned as a role from the start of this incident (Section 23.7)?
- [ ] Did communication follow the regular cadence (Section 23.3), even during periods with no substantive update?

---

# 24. Postmortem Process

## 24.1 Purpose

To state how every incident becomes a documented, learned-from artifact — restated and fully operationalized from 13-testing-strategy.md Section 27.6's blameless post-incident review requirement into this document's complete, mandatory postmortem procedure.

## 24.2 When a Postmortem Is Required

**Rule:** every SEV-1 and SEV-2 incident receives a full, written postmortem, mandatorily, within a defined short window (e.g., within 3–5 business days of resolution) — restated as this document's non-negotiable completion-rate target (Section 22.2's 100% postmortem-completion KPI). SEV-3 incidents receive a lighter-weight postmortem at the responding engineer's/team's discretion, informed by whether the incident revealed a genuinely novel or recurring pattern worth the fuller process. SEV-4 findings are typically resolved via standard ticketing without a dedicated postmortem, unless a pattern across several SEV-4 findings suggests a worthwhile deeper investigation.

## 24.3 Postmortem Structure

Every postmortem follows a consistent structure: **timeline** (what happened, when, in objective, factual terms — restated from real-time notes captured during the incident per 18-observability-monitoring.md §19.9's identical stated discipline), **impact** (who/what was affected, and for how long — informed by the actual observability data, not estimated after the fact), **root cause** (the outcome of Section 19.4-of-that-document's structured root-cause analysis — the deep, systemic cause, not just the proximate trigger), **what went well** (restated as a deliberate, required section — a blameless process celebrates effective response as much as it examines gaps), **what could be improved**, and **action items** (each with a named owner and a target date, feeding Section 22.2's closure-rate KPI).

## 24.4 Blameless Facilitation

**Rule:** restated identically from Section 2.5 and 18-observability-monitoring.md Section 2.6: the postmortem facilitator (typically the incident's own IC, Section 24.6) explicitly steers discussion away from individual blame and toward systemic/process causes — a postmortem that identifies "an engineer made a mistake" as its root cause has not yet actually found the root cause, since the deeper, more useful question is always "what about our system or process made that mistake possible, likely, or hard to catch," per that document's Section 19.4's five-whys-style discipline.

## 24.5 Postmortem Review and Sharing

**Rule:** every SEV-1/2 postmortem is reviewed by Engineering Leadership and shared broadly across engineering (not confined to only the directly-involved responders) — restated as this platform's deliberate choice to treat incidents as organization-wide learning opportunities, not private, siloed events, mirroring 15-engineering-standards.md's broader "quality is everyone's responsibility" culture applied here to operational learning specifically.

## 24.6 Responsibilities

The incident's own Incident Commander typically facilitates its postmortem; every engineer involved in the incident's response contributes their perspective and timeline detail; Engineering Leadership reviews every SEV-1/2 postmortem and owns ensuring action items are tracked (feeding Section 25).

## 24.7 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| A postmortem is completed but its action items are never actually done | Insufficient prioritization against ordinary feature work (Section 22.5's identical stated concern) | Escalated as its own tracked concern — restated from Section 22.2's closure-rate KPI, a consistently low closure rate is itself worth a dedicated Engineering Leadership conversation about resourcing/prioritization |
| A postmortem discussion drifts toward blaming a specific individual despite Section 24.4's stated discipline | Facilitation lapse, or a genuinely difficult, emotionally-charged incident | The facilitator redirects immediately, restating the blameless framing explicitly if needed — this is treated as a facilitation skill worth deliberately building across the team, not merely hoped for |

## 24.8 Recovery Steps

Not applicable — this section governs the learning process itself, not a technical recovery action.

## 24.9 Escalation

A postmortem revealing a systemic, high-severity gap (e.g., a disaster-recovery drill failure, Section 19.8) escalates its findings directly to Engineering Leadership and, where warranted, Founders, beyond the postmortem document's standard review audience.

## 24.10 Best Practices

- Capture the timeline in real time during the incident itself (Section 24.3), never reconstructed from memory days later, which inevitably loses detail and accuracy.
- Include "what went well" genuinely, not as a token gesture — restated from Section 24.3, recognizing effective response builds the confidence and morale that makes the next incident's response better too.

## 24.11 Review Checklist

- [ ] Was a postmortem completed within the required window for every SEV-1/2 incident (Section 24.2)?
- [ ] Did the postmortem identify systemic root causes, not individual blame (Section 24.4)?
- [ ] Were action items assigned named owners and target dates (Section 24.3)?

---

# 25. Continuous Improvement

## 25.1 Purpose

To state how this document, and the operational practice it describes, actually gets better over time — restated as the closing stage of Section 2.3's Prevent-Detect-Respond-Learn lifecycle, ensuring every incident's learning (Section 24) and every operational review's finding (Sections 4–7) accumulates into genuine, lasting improvement rather than being re-discovered repeatedly.

## 25.2 The Improvement Loop

```
Postmortem action items (Section 24.3) + operational review findings
(Sections 4–7) + KPI trends (Section 22)
   │
   ▼
Prioritized against ordinary feature-delivery work (Engineering Leadership,
per 22.4's stated ownership) — reliability/operational work is not
automatically deprioritized by default, per 18-observability-monitoring.md
§20.5's error-budget-driven prioritization framework
   │
   ▼
Executed through the standard pipeline (16-cicd-release-management.md §6)
for any code/system change; through this document's own update process
(Section 25.4) for a runbook/process change
   │
   ▼
Verified effective — a fix for a recurring incident pattern is confirmed,
where feasible, via a subsequent drill (Section 19.6) or simply the
absence of recurrence tracked over time (Section 22.2's incident-count KPI)
```

## 25.3 Runbook Currency as Continuous Improvement

**Rule:** every incident that reveals a gap or inaccuracy in this document's own procedures (Sections 11–19) results in this document being updated — restated from 18-observability-monitoring.md Section 22.6's identical documentation-currency discipline, applied here to this specific document: a runbook that isn't updated after every incident that tests it against reality inevitably drifts stale, exactly the failure mode Section 7.6 of this document exists to catch at the quarterly cadence, but which this section's discipline aims to prevent from accumulating in the first place by closing gaps immediately, incident by incident.

## 25.4 This Document's Own Update Process

Changes to this Operations Runbook follow 15-engineering-standards.md Section 29's Engineering Decision Record process for any genuinely novel procedural pattern, and a lighter-weight, direct-edit-and-review process for a straightforward correction or addition (e.g., adding a newly-discovered failure scenario to an existing component's recovery procedure, Sections 12–17) — the specific update mechanism scales with the significance of the change, mirroring this entire series' documentation-first philosophy applied to its own maintenance.

## 25.5 Responsibilities

Engineering Leadership owns prioritizing improvement work against feature delivery; every engineer who identifies a runbook gap (during an incident, a drill, or routine use) is responsible for proposing its correction, per Section 25.4, rather than merely noting it informally and moving on.

## 25.6 Failure Scenarios

| Scenario | Cause | Response |
|---|---|---|
| The same category of incident recurs multiple times despite prior postmortems' action items | The action items were completed but insufficient, or were never actually completed (Section 24.7) | Escalated as a pattern worth deeper investigation at the Monthly/Quarterly review (Sections 6–7) — a recurring pattern despite documented "fixes" is itself a significant finding, not dismissed as bad luck |
| This document accumulates outdated procedures over time despite Section 25.3's stated discipline | Individual incidents' updates happen, but no one owns the document's overall coherence as it grows | Caught at the Quarterly Operations review (Section 7.6), which explicitly reviews this document's currency as a whole, not just incident-by-incident patches |

## 25.7 Recovery Steps

Not applicable — this section governs the ongoing improvement process itself.

## 25.8 Escalation

A recurring incident pattern (Section 25.6) escalates to Engineering Leadership as a priority-investment conversation, distinct from and more urgent than routine backlog-style tracking.

## 25.9 Best Practices

- Update this document as part of the same work that identifies its gap (mirroring 15-engineering-standards.md §22.6's "documentation update in the same PR" discipline), not as a deferred, separate follow-up task that risks never happening.
- Treat a recurring incident pattern as a signal to invest more deeply, not merely to re-run the same fix again — restated from Section 25.6, repetition despite "resolution" is itself the most important signal this entire continuous-improvement discipline exists to catch.

## 25.10 Review Checklist

- [ ] Was this document updated as part of the most recent incident that revealed a gap in it (Section 25.3)?
- [ ] Has any recurring incident pattern been identified and escalated as a deeper investment priority (Section 25.6)?

---

# 26. Operations Review Checklist

Before this document is considered final and ready to govern day-to-day operational practice, and at every Quarterly Operations review (Section 7) thereafter, it is reviewed against:

- [ ] **Consistency** — does every section's terminology and referenced architecture match 10-backend-architecture.md, 12-security-architecture.md, 13-testing-strategy.md, 14-infrastructure-devops-architecture.md, 16-cicd-release-management.md, and 18-observability-monitoring.md exactly, with no undocumented drift?
- [ ] **Completeness** — does every recovery procedure (Sections 12–17) have a stated purpose, workflow, responsibilities, failure scenarios, recovery steps, escalation, best practices, and review checklist, per this document's own required structure?
- [ ] **Rehearsal Currency** — has every procedure in Sections 12–19 actually been exercised (via a real incident or a deliberate drill) recently enough to trust it still works as written?
- [ ] **Severity Consistency** — does Section 9's SEV-1 through SEV-4 scale remain correctly reconciled with 13-testing-strategy.md's Critical/High/Medium/Low defect severity matrix?
- [ ] **Escalation Accuracy** — is Section 10's escalation matrix current with the team's actual structure and contact reachability?
- [ ] **Disaster Readiness** — does the most recent disaster-recovery drill (Section 19.6) meet RTO/RPO targets, and is this document's Section 19 procedure consistent with what was actually drilled?
- [ ] **Learning Loop Integrity** — is the postmortem-to-action-item-to-closure pipeline (Sections 24–25) actually functioning, per Section 22.2's closure-rate KPI, not merely producing well-intentioned but unfollowed documents?
- [ ] **Future Readiness** — does this document's structure extend cleanly to a new service, dependency, or failure mode introduced since it was last reviewed, without requiring a wholesale rewrite?

---

*This document is the definitive operations runbook for Dreams by Kalakaaar v2. Every on-call engineer is expected to be familiar with its structure before taking a shift, and to open it directly during any incident rather than improvising from memory. No procedure in this document is considered trustworthy until it has been rehearsed — in a real incident or a deliberate drill — and every incident that tests a procedure against reality is an opportunity to make this document, and the platform it protects, measurably better than it was before. The system cannot run itself, and this document is how the team makes sure that when it doesn't, they know exactly what to do next.*
