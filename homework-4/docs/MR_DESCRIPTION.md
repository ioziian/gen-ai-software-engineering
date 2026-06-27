# Homework 4 — Single-Command 4-Agent Bug-Fixing Pipeline (URL Shortener)

**Student:** Ihor Oziian
**Stack:** Node.js · TypeScript · Express · Vitest · Claude Code subagents (`claude -p`) + skills

## Summary

This PR implements a single-command, multi-agent bug-fixing pipeline built on Claude Code
subagents and skills. One command — `npm run pipeline -- --bug 001-shortener-bugs` — loads and
Zod-validates 4 agents and 2 skills, then runs them in order, each reading the previous agent's
file artifact and producing its own. The orchestrator does not call the Anthropic SDK; it spawns
the Claude Code CLI in headless mode (`claude -p`) as the agent runtime, so the pipeline needs
**no `ANTHROPIC_API_KEY` and costs $0 per run**.

The pipeline operates on a small Express URL-shortener API seeded with **2 logic bugs + 1
security issue**, and drives it to a fully fixed, security-reviewed, and tested state.

**Result:** all three defects fixed, the security issue independently confirmed remediated by the
Opus security gate, and the test suite grown from **3 failing → 13 passing** (incl. 8
agent-generated tests).

## What was done

- **Sample app** (`src/`) — in-memory URL shortener (Express + TypeScript) with two seeded logic
  bugs (pagination off-by-one; unknown-slug crash) and one security issue (missing URL scheme
  allowlist), plus baseline tests that fail pre-fix.
- **Two skills** the agents are required to use:
  - `research-quality-measurement` — L0–L4 quality rubric for the research verifier.
  - `unit-tests-FIRST` — FIRST principles (Vitest) for the test generator.
- **Four agents** (`agents/*.agent.md`), each with an explicit `model:` chosen by role and
  Zod-validated at load.
- **Single-command orchestration** (`scripts/run-pipeline.ts` → `npm run pipeline`) that spawns
  `claude -p` per stage, injects skills into system prompts, passes context between agents as
  XML-tagged messages, and runs the tests deterministically.
- **Full artifact trail** under `context/bugs/001-shortener-bugs/` produced by the run.

## Pipeline

```
npm run pipeline -- --bug 001-shortener-bugs
        ↓
Orchestrator (scripts/run-pipeline.ts → stages.ts)
   Stage 1 (deterministic): run vitest → baseline-tests.txt (3 failing)
   ├── Stage 2: Research Verifier  (Opus 4.8)   → verified-research.md
   ├── Stage 3: Bug Fixer          (Sonnet 4.6) → edits src/ + fix-summary.md
   └── Promise.allSettled (parallel)
       ├── Stage 4: Security Verifier   (Opus 4.8)   → security-report.md
       └── Stage 5: Unit Test Generator (Sonnet 4.6) → tests/links/* + test-report.md
```

| # | Agent | Model | Produces |
|---|-------|-------|----------|
| 2 | Research Verifier | **Opus 4.8** | `research/verified-research.md` |
| 3 | Bug Fixer | Sonnet 4.6 | edits in `src/` + `fix-summary.md` |
| 4 | Security Verifier | **Opus 4.8** | `security-report.md` |
| 5 | Unit Test Generator | Sonnet 4.6 | tests in `tests/links/` + `test-report.md` |

**Model rationale:** Opus 4.8 for the two judgment gates the pipeline trusts blindly (research
verification, security sign-off — a missed error there propagates everywhere); Sonnet 4.6 for the
mechanical execution stages (applying localized edits, scaffolding FIRST tests).

## Seeded defects

- **BUG-001** (logic, `src/store.ts`) — pagination off-by-one: `offset = page * limit` skips the
  first page; `page=1` never returns the first items. Fix: `(page - 1) * limit`.
- **BUG-002** (logic, `src/app.ts`) — unknown-slug crash: `GET /links/:slug` dereferences an
  undefined lookup → HTTP 500 instead of 404. Fix: null-guard returns a clean 404.
- **SEC-001** (security, `src/app.ts`, CWE-20 → CWE-79) — `POST /links` stores any URL with no
  scheme allowlist, accepting `javascript:` / `data:` / `file:` (stored-XSS via the redirect).
  Fix: validate `new URL(url).protocol ∈ {http:, https:}`, else 400.

## Results (before → after)

| Check | Before | After |
|-------|--------|-------|
| `GET /links?page=1&limit=10` | ids 11–12 (first page skipped) | **ids 1–10** |
| `GET /links/does-not-exist` | HTTP **500** (crash) | **HTTP 404** `{ "error": "not found" }` |
| `POST /links {"url":"javascript:…"}` | HTTP **201** (accepted) | **HTTP 400** `url must use http or https` |
| Test suite (`npm test`) | 3 failing / 2 passing | **13 passing / 0 failing** |
| `tsc --noEmit` | clean | clean |
| Security review | — | SEC-001 **remediated** (Opus-confirmed) |

The research verifier also **caught a planted citation error** in the seeded research (it claimed
BUG-001 lived at `app.ts:40`; the verifier proved the offset is in `store.ts:39`, graded the
research **L3 Solid**, and supplied the corrected location for the fixer).

## Screenshots

**Before — buggy app & failing tests**

![Before](https://raw.githubusercontent.com/ioziian/gen-ai-software-engineering/homework-4-submission/homework-4/docs/screenshots/01-before.png)

**Pipeline run (one command, four agents)**

![Pipeline run](https://raw.githubusercontent.com/ioziian/gen-ai-software-engineering/homework-4-submission/homework-4/docs/screenshots/02-pipeline-run.png)

**After — all fixes applied, suite green (incl. agent-generated tests)**

![After](https://raw.githubusercontent.com/ioziian/gen-ai-software-engineering/homework-4-submission/homework-4/docs/screenshots/03-after.png)

## How AI was used

- **Claude Code (Opus 4.8)** — wrote `SPECIFICATION.md` and implemented the project from that
  spec.
- **Claude Code CLI (`claude -p`)** — *is* the pipeline runtime: each of the 4 agents is a
  headless subprocess with a per-agent model, injected skills, and an allow-listed toolset.
- Models exercised by the pipeline: **Opus 4.8** (research verification, security review) and
  **Sonnet 4.6** (bug fixing, test generation).

## Project structure

```
homework-4/
├── agents/                4 agent defs (.agent.md = frontmatter + prompt)
├── skills/                research-quality-measurement.md, unit-tests-FIRST.md
├── scripts/
│   ├── run-pipeline.ts    CLI entry — argv + startup validation
│   └── pipeline/          agent-loader, skill-loader, validators, claude-runner,
│                          stages, messages, logger, types
├── src/                   URL-shortener API (shortcode, store, app, index)
├── tests/                 links.smoke + links.baseline (seed); links/ (agent-generated)
├── context/bugs/001-shortener-bugs/
│   ├── bug-context.md · research/codebase-research.md   (seed inputs)
│   └── verified-research.md · fix-summary.md · security-report.md · test-report.md (generated)
├── docs/screenshots/      01-before · 02-pipeline-run · 03-after
├── SPECIFICATION.md · README.md · HOWTORUN.md
```

## How to run

```bash
npm install
npm test          # baseline: 3 failing (the seeded defects)
npm run pipeline -- --bug 001-shortener-bugs   # 4-agent pipeline (needs Claude Code CLI)
npm test          # 13 passing (incl. agent-generated tests)
```

See `HOWTORUN.md` for the cold-start runbook.

## Deliverables

- [x] 4 required agents, explicit per-agent model in frontmatter (Zod-validated)
- [x] Two skills created and consumed by the right agents
- [x] Sample app with 2 seeded bugs + 1 seeded security issue
- [x] Single-command runner (`npm run pipeline`)
- [x] All agent artifacts committed (verified-research, fix-summary, security-report, test-report)
- [x] `npm test` green (13 passing) + `tsc` clean
- [x] README + HOWTORUN + SPECIFICATION + before/pipeline/after screenshots
