# Homework 3 — Fraud Detection Specification Design (Document-Only)

## Summary

This design note explains how we will reshape `homework-3/SPECIFICATION.md` so it better meets the Homework 3 rubric in `homework-3/TASKS.md`. The output is a *layered*, *execution-ready* specification intended for an engineering team (or AI agent) to implement without guessing, while keeping implementation (code/API/UI) out of scope for this homework.

The chosen feature scope remains: suspicious-transaction detection and handling in a regulated FinTech context, including decision recording, auditability, privacy-safe notifications, and internal review workflows.

## Design Goals (rubric-aligned)

1. **Layered structure with traceability**
   - Maintain a strict layering: High-level objective → mid-level objectives → NFR/policy → implementation notes → context (begin/end) → low-level tasks.
   - Every low-level task explicitly maps to one or more mid-level objectives.

2. **Self-contained rubric requirements inside `SPECIFICATION.md`**
   - Edge cases/failure modes, verification expectations, and measurable performance targets are first-class sections *inside the spec*.
   - Supporting docs can exist, but graders should not need them to assess rubric coverage.

3. **Regulated-environment realism without turning into generic compliance prose**
   - Include concrete, feature-scoped constraints: data handling, redaction rules, audit immutability, access boundaries, retention.
   - Avoid generic “security essay”; prefer specific policy statements tied to fraud detection flows.

4. **Decision-complete context and workflow semantics**
   - Expand beginning/ending context into explicit hypothetical components and artifacts.
   - Define a state model for flagged transactions/cases with allowed transitions and concurrency handling.

## Key Structural Decisions

### A) Keep assumed numeric targets, but justify them

The spec can keep assumed targets (false positive rate, throughput, latency), but each must be labeled “assumed” and briefly justified as reasonable for FinTech UX and ops workflows. This prevents the numbers from reading like arbitrary placeholders.

### B) Expand NFRs beyond encryption and logging

In addition to privacy and security, the spec should explicitly state:
- Reliability expectations (assumed SLOs are acceptable)
- Consistency semantics (time-to-consistency for flag status visibility)
- Rate limiting and abuse controls
- Retention and access control boundaries

### C) Decompose low-level tasks into many small, checkable slices

Instead of a handful of broad tasks that each “produce a doc”, we will create a substantial list of smaller tasks, each producing one checkable artifact or spec section (e.g., “Define decision record fields”, “Define audit event types”, “Write edge-case table rows for out-of-order ingestion”, “Define notification redaction rules”, etc.).

### D) Add a verification matrix to eliminate ambiguity

A verification plan table is required to show exactly how each mid-level objective would be verified (as documentation): review checkpoints, test categories, sampling/audit procedures, and metric-based checks.

## Acceptance Criteria for the Spec Package (document-only)

- `SPECIFICATION.md` contains explicit sections for:
  - Scope & non-goals
  - Stakeholders
  - Edge cases & failure modes (table)
  - Verification plan (matrix)
  - Performance expectations (measurable, labeled assumed if needed)
- Low-level tasks are substantial, granular, and each includes:
  - Objective mapping (e.g., `M1`, `M2`, …)
  - Output artifact(s)
  - Acceptance criteria
- All content is written in English and is internally consistent.

## Note on Filename Casing (risk only)

The assignment text refers to `specification.md` and `agents.md`. This repo currently uses `SPECIFICATION.md` and `AGENTS.md`. Some environments are case-sensitive; confirm grading/submission expectations for exact casing. This note does not mandate renaming.

