# Homework 3 — SPECIFICATION.md Improvement Plan (Fraud Detection)

> **Goal:** Improve `homework-3/SPECIFICATION.md` so it better satisfies the rubric in `homework-3/TASKS.md` (layering, traceability, edge cases, verification, performance).  
> **Deliverables:** Documents only (no code, no APIs, no UI).

## Summary

`SPECIFICATION.md` is currently a good start, but it is (a) too “template-like”, (b) missing several rubric-required details *inside the spec*, and (c) under-decomposed at the low-level task layer (too few tasks; acceptance criteria are present but shallow and not traceably mapped to objectives).

This plan is a concrete edit map for rewriting/expanding `SPECIFICATION.md` while keeping the same feature scope: fraud/suspicious-transaction detection and handling in a regulated environment.

## Potential Risk (case-sensitive environments)

This repo currently uses uppercase filenames (`SPECIFICATION.md`, `AGENTS.md`). Some graders/CI environments are case-sensitive and may expect the exact deliverable names stated in the assignment (`specification.md`, `agents.md`). This plan does **not** require renaming files, but you should confirm submission expectations for casing before final submission.

## Edit Map for `homework-3/SPECIFICATION.md`

### 1) Replace the opening directive so it matches Homework 3

**Change:** Replace the line:

- “Ingest the information from this file, implement the Low-Level Tasks, and generate the code…”

**With:** A document-only framing such as:

- This repository provides a layered specification package for a fraud detection feature.
- Implementation (code/API/UI) is out of scope for Homework 3; the purpose is to enable implementation without guessing.

**Done when:** The intro makes no request to generate code and clearly states scope boundaries.

---

### 2) Add a “Scope & Non-Goals” section (explicit boundaries)

**Add section:** `## Scope & Non-Goals`

**Include:**
- In-scope: ingestion of transaction events, real-time evaluation, decision recording, audit logging, notifications, analyst/compliance review workflow hooks.
- Out-of-scope examples: model training, full-case management UI, user-facing UI, APIs, exact database choices, integrations with specific vendors.

**Done when:** A reader can tell what is being specified and what is intentionally not specified.

---

### 3) Add “Stakeholders & Personas” (to satisfy the rubric’s stakeholder realism)

**Add section:** `## Stakeholders & Personas`

**Include at minimum:**
- End user (card/account holder)
- Fraud analyst (internal)
- Compliance / Ops (internal)
- (Optional) Support (internal)

**Done when:** Each stakeholder has 1–2 lines describing what they need from the system.

---

### 4) Strengthen the High-Level Objective into a single crisp statement + boundary

**Change:** Keep the idea, but rewrite as one sentence plus one boundary sentence.

**Done when:** High-level objective is a “north star” outcome and does not drift into implementation.

---

### 5) Rewrite Mid-Level Objectives to be observable and verifiable (and label assumptions)

**Change:** Keep current objectives but expand/clarify with verifiable wording.

**Add:**
- For every numeric target (false positive rate, latency, throughput): label “assumed target” and add 1–2 sentence justification (“reasonable for FinTech UX/ops”).
- Add objectives that cover explainability and workflow correctness, e.g.:
  - “Every fraud decision is explainable: rule IDs / thresholds / model version (if any) are recorded and auditable.”
  - “Flagged transactions follow a consistent, permissioned workflow state model.”

**Done when:** Each objective can be checked via a stated verification method (see Verification Plan section).

---

### 6) Expand “Non-Functional & Policy Requirements” to cover reliability and operational needs

**Change:** Keep existing security requirements but add missing NFR categories required by rubric:

**Add targets/ranges for:**
- Reliability/availability expectations (assumed SLOs are fine, labeled as such)
- Latency percentiles (e.g., p95/p99) rather than a single number where appropriate
- Consistency semantics: when flags become visible to analysts; time-to-consistency
- Rate limiting / abuse controls (assumed targets)
- Retention requirements (audit log retention; access logging)
- Access control boundaries (who can view what; least privilege)

**Done when:** NFRs are measurable and cover more than encryption/logging.

---

### 7) Upgrade “Implementation Notes” into concrete guardrails (still doc-only)

**Change:** Keep current notes, but add specificity:

**Add:**
- Data classification table: PCI/PII/derived risk signals; what may be stored, logged, redacted.
- Explainability rules: what must be stored with each decision record (rule identifiers, thresholds, versioning).
- Idempotency rules: define idempotency keys and replay/backfill expectations.
- Error semantics: categories (data error vs system error vs fraud signal) and required behavior (“fail-safe” stance).
- Currency/money handling: currency codes, rounding policy, multi-currency stance (in/out of scope explicitly).

**Done when:** An implementer can build without guessing privacy/logging/idempotency/error rules.

---

### 8) Make Context “Beginning / Ending” decision-complete (explicit components + artifacts)

**Change:** Replace generic bullets with explicit hypothetical components and artifacts.

**Add:**
- Named components (even if hypothetical): Ingestion, Detection, Audit Log Store, Notification Service, Analyst/Compliance Review Store.
- For “ending context”, list the artifacts per flow:
  - decision record created
  - audit entries appended
  - notification event emitted (or queued)
  - review case opened/updated (if in-scope)

**Done when:** Beginning/ending context provides a clear “before vs after” workspace and artifacts list.

---

### 9) Add an explicit “State Model” for flagged transactions / cases

**Add section:** `## State Model`

**Include:**
- States (example): `unreviewed`, `under_review`, `cleared`, `confirmed_fraud`, `blocked`, `expired`
- Allowed transitions and who/what can transition
- Concurrency note: how conflicting actions are resolved/audited

**Done when:** Workflow behavior is defined without code.

---

### 10) Add “Edge Cases & Failure Modes” as a self-contained table in the spec

**Add section:** `## Edge Cases & Failure Modes`

**Format:** Table with columns:
- Scenario
- Expected behavior (user-visible + internal)
- Audit/compliance notes (what must be recorded)
- Fail-safe stance (fail open/closed) and why

**Minimum coverage examples (tailor to fraud detection):**
- Duplicate event ingestion
- Out-of-order events
- Partial dependency failure (DB down, notification down)
- Stale geo/IP/device signals
- Concurrency: two analysts act simultaneously
- Permission boundary violation attempt
- High-velocity burst / rate limit triggers

**Done when:** Edge cases are specific, not generic, and include expected behavior.

---

### 11) Add a “Verification Plan” section with an explicit mapping matrix

**Add section:** `## Verification Plan`

**Include:**
- A matrix: Mid-Level Objective → verification method (review checklist, test category descriptions, sampling/audit review, metrics thresholds).
- For at least several low-level tasks: explicit acceptance criteria that are checkable.

**Done when:** “How we know we met this” exists for every mid-level objective.

---

### 12) Expand Low-Level Tasks into a substantial, traceable decomposition

**Change:** Replace the current 6 tasks with ~15–30 smaller tasks.

**Each task must include:**
- Purpose (1–2 lines)
- Serves objective(s): reference mid-level objective IDs (add IDs like `M1`, `M2`, …)
- Output artifact(s): what doc/spec section/table/state model is produced or updated
- Acceptance criteria: 2–5 checkable items

**Suggested task groups:**
- Decision record + audit log record definitions (fields, immutability expectations)
- Explainability/versioning strategy for rules
- Permission model and access boundaries (who sees what)
- Notification policy: templates, redaction rules, timing targets
- Degraded-mode behavior: what happens when dependencies are down
- Monitoring/metrics definitions (tied to assumed performance targets)
- Edge case table completion + review checklist

**Done when:** The task list shows real decomposition and is mapped to objectives.

## Spec Self-Review Checklist (before submission)
- No “implement code” language in `SPECIFICATION.md`.
- Every numeric target is labeled assumed/non-assumed and justified.
- Edge cases, verification, and performance are inside `SPECIFICATION.md` (not only in README).
- Low-level tasks are many, specific, and have acceptance criteria + objective mapping.
- README references match actual final headings/sections.

