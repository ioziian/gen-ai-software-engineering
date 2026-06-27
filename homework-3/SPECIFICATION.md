# Fraud Detection Specification

> This repository provides a layered, document-only specification package for a fraud detection (suspicious transaction handling) feature in a regulated finance environment.
>
> **Homework 3 scope:** No code, APIs, or UI are required. This specification is written so an engineering team (or AI agent) could implement the feature without guessing.

## Scope & Non-Goals
- **In scope:** ingestion of transaction events, real-time evaluation (rules/heuristics), decision recording, immutable audit logging, privacy-safe notifications, and internal fraud/compliance review workflow semantics.
- **Out of scope (for this homework):** implementation code, API designs, UI designs, model training, vendor selection, and production infrastructure provisioning details.

## Stakeholders & Personas
- **End user (customer):** wants legitimate transactions to succeed with minimal friction and clear, privacy-safe communication when something is flagged.
- **Fraud analyst (internal):** needs fast triage, an auditable decision history, and explainability for why something was flagged.
- **Compliance/Ops (internal):** needs strong auditability, access controls, retention, and repeatable processes suitable for regulated environments.

## High-Level Objective
- Detect and handle suspicious financial transactions to reduce fraud losses while preserving customer trust and meeting audit/compliance expectations, without specifying implementation details.

## Mid-Level Objectives
- **M1 — Real-time suspicious activity detection:** Flag potentially fraudulent transactions with low friction for legitimate users.
  - **Assumed target:** false positive rate (FPR) < 2%. Rationale: excessive false positives create high customer friction and support load in consumer finance contexts.
- **M2 — Decision explainability:** Every fraud decision is explainable and reproducible based on recorded inputs and rule/threshold/version metadata.
- **M3 — Auditability & traceability:** Every action affecting a transaction’s fraud status is traceable with immutable audit events suitable for internal review and compliance.
- **M4 — Timely, privacy-safe notifications:** Notify customers and internal stakeholders promptly without revealing detection logic.
  - **Assumed targets:** customer notification emitted within 2 seconds; analyst notification within 5 seconds. Rationale: rapid awareness reduces fraud impact and improves user trust.
- **M5 — Secure and compliant data handling:** Ensure privacy/security consistent with regulated environments (e.g., PCI DSS, GDPR where applicable) and clear boundaries for sensitive data.
- **M6 — Resolution workflow correctness:** Provide a consistent, permissioned workflow for triaging and resolving flags (false positives vs confirmed fraud), including concurrency rules.

## Non-Functional & Policy Requirements
- **Security (baseline):**
  - Data in transit encrypted (TLS 1.2+); data at rest encrypted (AES-256 or equivalent).
  - No sensitive cardholder data (PAN, CVV) is logged or exposed in error messages.
- **Audit logging (policy):**
  - All fraud-related actions produce audit events with timestamp, actor (system/user), action type, and identifiers.
  - Audit events are immutable (append-only) and access-controlled.
- **Performance (assumed targets):**
  - Sustained throughput ≥ 100 transactions/second for evaluation.
  - Detection latency p95 < 200ms for evaluation + decision recording (excluding downstream notification delivery time).
  - Rationale: aligns with near-real-time payments UX while leaving space for downstream systems.
- **Reliability (assumed targets):**
  - Detection/evaluation path availability ≥ 99.9% monthly.
  - Degraded mode must be explicitly defined (see Edge Cases & Failure Modes).
- **Consistency semantics:**
  - After a transaction is flagged, the updated fraud status should be visible to internal ops/analysts within an assumed target of 5 seconds (time-to-consistency).
- **Rate limiting / abuse controls:**
  - Internal review actions must be rate-limited to prevent automation abuse; externally visible notifications should have guardrails to avoid spamming a user (assumed targets acceptable).
- **Retention:**
  - Fraud decision records and audit events must have an explicit retention policy suitable for regulated environments (assumed: multi-year retention), including access logging and deletion constraints where applicable.
- **Language rule:** All files, comments, and artifacts must be written in English.

## Implementation Notes
- **Data classification & logging:**
  - **PCI/Highly sensitive:** PAN, CVV, full track data — must never be stored in logs; avoid storage in the fraud domain unless explicitly required (out of scope here).
  - **PII:** user identifiers, email/phone, address — store only if required for fraud workflows; restrict access; redact in logs.
  - **Derived risk signals:** device fingerprint hash, velocity counters, geo anomalies — may be stored, but treat as sensitive; log only in aggregated/redacted form.
- **Monetary values:** use Decimal (or equivalent) to avoid rounding errors; specify a rounding policy (e.g., bankers rounding) and currency handling where applicable.
- **Idempotency & replay:**
  - Evaluation/decision recording must be idempotent per transaction event (define an idempotency key, e.g., transaction_id + event_version).
  - The system must support reprocessing (replay/backfill) without producing duplicate decisions/audit events.
- **Error semantics (must be explicit in the implementation later):**
  - **Data error:** invalid/missing fields → record an audit event; do not silently ignore.
  - **System error:** dependency outage/timeouts → follow degraded-mode policy (fail-safe stance must be defined per edge case).
  - **Fraud signal:** suspicious pattern detected → produce a decision record and audit events; notify as per policy.
- **Identifiers & formatting:**
  - Transaction IDs are UUIDv4 format (assumed).
  - Every decision record includes: decision_id, transaction_id, decision outcome, rule IDs, threshold values, rule set version, timestamp(s), and actor (system).
- **Audit log access:** audit records are accessible only to authorized roles; access itself should be auditable.
- **Notification privacy:** user notifications must never reveal internal thresholds, rules, or model logic.

## Context

### Beginning context
- A transaction ingestion source exists (event stream or API) producing transaction events.
- A secure data store exists for transaction records and fraud decision records.
- An append-only audit log store exists for fraud-related events.
- Notification channels exist for customers and internal analysts (email/push/dashboard), with privacy-safe templates.
- An internal “review surface” exists conceptually (could be a dashboard later), but UI is out of scope here.

### Ending context
- For each evaluated transaction event, the system records:
  - A **decision record** (flagged/not flagged, plus explainability metadata).
  - One or more **audit events** documenting evaluation and any subsequent actions.
- If flagged, the system emits:
  - A privacy-safe **customer notification event** (if policy says notify).
  - An **analyst notification event** (or queue item) for internal review.
- The transaction’s fraud status becomes visible to internal stakeholders within the defined consistency window.

## State Model

### Flag/Case States (conceptual)
- `unreviewed` — system-flagged, waiting for triage.
- `under_review` — an analyst is investigating.
- `cleared` — determined legitimate (false positive).
- `confirmed_fraud` — confirmed fraud.
- `blocked` — transaction/account action taken (conceptual; implementation out of scope).
- `expired` — reached time limit without review (policy-defined behavior required).

### Allowed Transitions (high-level)
- `unreviewed` → `under_review` (analyst action)
- `under_review` → `cleared` | `confirmed_fraud` (analyst action)
- `unreviewed` → `expired` (system policy)
- Any state change must produce an audit event with actor and reason.

### Concurrency Rule (must be implemented later)
- If two analysts act concurrently, the system must either (a) enforce optimistic concurrency (version checks) or (b) serialize updates; the rejected/overridden action must be audited.

## Edge Cases & Failure Modes

| Scenario | Expected behavior (user-visible + internal) | Audit/compliance notes | Fail-safe stance |
|---|---|---|---|
| Duplicate transaction event ingested | Idempotency prevents duplicate decisions; the second event produces no side effects beyond a single “duplicate ignored” audit event (optional). | Record that a duplicate was detected (if required for ops). | Fail closed on idempotency mismatch (do not create multiple decisions). |
| Out-of-order events (e.g., reversal arrives before original) | Record data error/ordering anomaly; decision may be deferred or marked “needs reconciliation” (policy-defined). | Audit anomaly and any deferral. | Prefer safe handling that avoids incorrectly clearing fraud flags. |
| Decision store unavailable | Evaluation result cannot be persisted; follow degraded policy (e.g., hold transaction for review or allow with limited risk). | Audit system error with correlation IDs. | Must be explicitly defined; default preference is risk-averse (fail-safe). |
| Audit log store unavailable | Do not proceed with actions that require auditability; queue audit events for later append or block the action. | Audit system error somewhere reliable; do not “lose” audit intent silently. | Fail closed for state-changing actions requiring audit. |
| Notification service failure | Decision/audit still recorded; notification is retried with backoff and deduped. | Audit that notification attempt failed and later succeeded/failed permanently. | Fail open for notifications (do not block decision), but ensure retry/dedup. |
| Analyst permission boundary violated | Deny access; record security audit event for unauthorized attempt. | Access attempts are auditable. | Fail closed (deny). |
| High-velocity burst | Rate limit internal actions; suspicious burst increases risk signals; ensure system remains stable under load. | Audit throttling and burst detection signals (redacted). | Prefer stability and conservative decisioning under overload. |

## Verification Plan

| Mid-Level Objective | How we verify (document-only plan) |
|---|---|
| M1 | Define measurable detection outcomes and an evaluation approach (offline analysis, labeled dataset approach, shadow mode), plus operational metrics (FPR/FNR assumptions). |
| M2 | Ensure decision record schema includes rule IDs/thresholds/versions; review checklists confirm explainability fields exist. |
| M3 | Review audit event model for completeness and immutability; ensure every state transition/action maps to an audit event type. |
| M4 | Review notification policy and templates for privacy; define timing targets and retry/dedup behavior as requirements. |
| M5 | Review data classification + logging policy; confirm “never log PAN/CVV” is enforced as a requirement; access boundaries defined. |
| M6 | Review state model + transition rules; include concurrency expectations and audit requirements for conflicts. |

## Low-Level Tasks

> Format: Each task is document-only and updates `homework-3/SPECIFICATION.md` (unless otherwise stated). Each task references the mid-level objectives (`M1`–`M6`) it serves.

### 1. Define transaction event inputs and required fields
Serves: M1, M2, M3  
Acceptance:
- Defines required fields (transaction_id, timestamp, amount, currency, merchant, location signals, account/user IDs).
- Defines validation rules for missing/invalid fields (data error semantics).

### 2. Define “decision record” schema (conceptual)
Serves: M2, M3  
Acceptance:
- Lists all required fields, including rule IDs, thresholds, rule set version, timestamps, and actor.
- States immutability expectations (append vs update behavior).

### 3. Define audit event types and required fields
Serves: M3, M5, M6  
Acceptance:
- Enumerates audit event types (evaluated, flagged, state_changed, notification_attempted, access_denied, etc.).
- Defines required fields (actor, action, before/after state identifiers, correlation IDs).

### 4. Write data classification and redaction rules table
Serves: M5  
Acceptance:
- Distinguishes PCI/PII/derived signals.
- Explicitly states “never log PAN/CVV” and provides examples of acceptable redaction.

### 5. Define idempotency strategy and replay/backfill requirements
Serves: M1, M2, M3  
Acceptance:
- Defines idempotency key shape (conceptual) and replay behavior.
- States how duplicates/out-of-order events are handled (policy-level).

### 6. Define “suspicious criteria” (rules/heuristics) list
Serves: M1, M2  
Acceptance:
- Lists at least 10 criteria with rationale and a concrete example each.
- Includes at least one velocity-based, one geo-based, one merchant/category-based, and one user-behavior-based criterion.

### 7. Define scoring/decisioning outcomes (conceptual)
Serves: M1, M2, M6  
Acceptance:
- Defines possible outcomes (e.g., allow, flag_for_review, block/hold as conceptual).
- Defines which outcomes trigger notifications and/or internal review.

### 8. Define state model details and transition rules
Serves: M6, M3  
Acceptance:
- Adds allowed transitions table and forbidden transitions.
- Defines how conflicts/concurrency are handled and audited.

### 9. Define permission model for internal access
Serves: M5, M3  
Acceptance:
- Defines roles (analyst, compliance, support optional) and permitted actions.
- Requires auditing of access and denied attempts.

### 10. Specify customer notification policy and templates (privacy-safe)
Serves: M4, M5  
Acceptance:
- Includes at least 3 templates (flagged, resolved-cleared, resolved-confirmed fraud) with redaction rules.
- Explicitly forbids revealing thresholds/rules/model logic.

### 11. Specify analyst notification policy and triage information
Serves: M4, M2, M3  
Acceptance:
- Defines what analysts receive (decision explainability fields, risk signals in redacted form).
- Defines timing targets and retry/dedup requirements.

### 12. Define degraded-mode behavior for key dependency failures
Serves: M3, M5, M1  
Acceptance:
- Defines behavior when decision store is down, audit log is down, notification is down.
- States the fail-safe stance per failure mode and why.

### 13. Add measurable performance targets section refinements
Serves: M1, M4  
Acceptance:
- Converts single latency numbers to percentile-based targets where relevant.
- Adds brief rationale for each assumed target.

### 14. Define monitoring/metrics expectations (document-only)
Serves: M1, M3, M4  
Acceptance:
- Lists key metrics (flag rate, FPR proxy, latency p95/p99, audit append failures, notification retry rate).
- Defines at least 5 alert conditions tied to targets.

### 15. Expand Edge Cases & Failure Modes table to “complete” coverage
Serves: M1, M3, M5, M6  
Acceptance:
- Adds at least 15 total rows.
- Each row has expected behavior + audit notes + fail-safe stance.

### 16. Create a “Verification Plan” matrix that fully covers M1–M6
Serves: M1–M6  
Acceptance:
- Every objective has at least 2 verification methods (e.g., review + metric threshold).
- Includes at least one compliance review checkpoint.

### 17. Add “Assumptions” section for all non-verified numeric targets
Serves: M1, M4  
Acceptance:
- Lists every assumed target in one place with short justification.
- Ensures the same numbers appear consistently across the document.

### 18. Spec consistency pass (internal review checklist)
Serves: M1–M6  
Acceptance:
- No “generate code” language remains.
- Objective IDs are used consistently in tasks.
- All tasks have acceptance criteria and map to objectives.
