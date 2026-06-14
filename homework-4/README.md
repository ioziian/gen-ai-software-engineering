# Homework 4 — 4-Agent Bug-Fixing Pipeline

**Author:** Ihor Oziian (ihor.oziian@gmail.com)

A single-command, multi-agent pipeline that takes a seeded bug report and drives it through
**research verification → fixing → security review → test generation**, fully autonomously.
Each stage is a distinct agent defined in `agents/*.agent.md` (model, tools, skills, and
prompt in one file). The orchestrator does **not** call the Anthropic SDK directly — it
spawns the **Claude Code CLI in non-interactive print mode (`claude -p`)** as the agent
runtime, one subprocess per stage. Because the runtime is your existing Claude Code
subscription, the pipeline needs **no `ANTHROPIC_API_KEY` and costs $0 per run**.

The artifact under analysis is a minimal **URL-shortener REST API** (`src/`) with three
seeded issues (2 logic bugs + 1 security vulnerability) that the pipeline fixes and proves
fixed with generated tests.

---

## The 4-Agent Pipeline

```
                       npm run pipeline -- --bug 001-shortener-bugs
                                        │
                                        ▼
        ┌───────────────────────────────────────────────────────┐
        │  Orchestrator (scripts/run-pipeline.ts → stages.ts)    │
        │  - loads + Zod-validates 4 agents & 2 skills           │
        │  - checks claude / git / npx on PATH (exit 2 if absent)│
        │  - spawns `claude -p` per stage, writes artifacts      │
        └───────────────────────────────────────────────────────┘
                                        │
   Stage 1 (deterministic): orchestrator runs `vitest` → baseline-tests.txt (3 failing)
                                        │
   ┌────────────────────────┐   ┌────────────────────┐
   │ 2 Research Verifier    │──▶│ 3 Bug Fixer        │  orchestrator runs vitest,
   │ Opus 4.8               │   │ Sonnet 4.6         │  appends results to fix-summary.md
   │ skill: research-       │   │ Read,Grep,Edit,Wr. │            │
   │ quality-measurement    │   │                    │            │
   │ Read, Grep             │   │                    │            │
   └────────────────────────┘   └────────────────────┘            │
   verified-research.md          fix-summary.md                   │
                                          ┌────────────────────────┴───────────────┐
                                          │   Promise.allSettled (parallel,         │
                                          │   partial-failure isolation)            │
                                          ▼                                         ▼
                              ┌────────────────────────┐         ┌──────────────────────────────┐
                              │ 4 Security Verifier    │         │ 5 Unit Test Generator        │
                              │ Opus 4.8               │         │ Sonnet 4.6                   │
                              │ Read, Grep             │         │ skill: unit-tests-FIRST      │
                              │                        │         │ Read, Grep, Write            │
                              └────────────────────────┘         └──────────────────────────────┘
                              security-report.md                 test-report.md  (+ vitest re-run)
```

Agents communicate only through files in `context/bugs/<ID>/`. Each stage receives the
prior stage's output wrapped in XML-style tags (`<bug-context>`, `<verified-research>`,
`<changed-file name="...">`) in the user message streamed to `claude -p` over stdin. Skills
are injected into each agent's system prompt as `<skill name="...">` blocks.

---

## Per-agent model justification

Models are assigned per agent in YAML frontmatter (`model:` field, Zod-validated against
the `claude-opus-4-8 | claude-sonnet-4-6` enum at startup) and passed to Claude Code via
`--model`. The two **verification** stages — where a missed error is far more costly than a
slow response — run on **Opus 4.8**; the routine fix/scaffold stages run on **Sonnet 4.6**.

| Agent | Model | Justification |
|---|---|---|
| **Research Verifier** | `claude-opus-4-8` | High-precision fact-checking: every `file:line` reference and snippet must be matched character-by-character against source and scored L0–L4. A false "verified" silently corrupts every later stage, so the pipeline pays for Opus precision exactly where errors propagate furthest. |
| **Bug Fixer** | `claude-sonnet-4-6` | Mechanical application of small, well-localized edits against verified findings. The change region and intent are specified upstream; this is execution, not open-ended reasoning, so Sonnet is sufficient. |
| **Security Verifier** | `claude-opus-4-8` | Adversarial security review. False negatives (a missed vulnerability shipping) are the worst possible failure, so this gate gets the strongest reasoning model to maximize recall on subtle issues. |
| **Unit Test Generator** | `claude-sonnet-4-6` | Pattern-driven generation of FIRST-compliant Vitest tests guided by a skill and existing test patterns — constrained, example-led work Sonnet executes reliably. |

**Opus showcase:** Opus 4.8 is reserved for the two stages whose output is a *judgment the
rest of the pipeline trusts blindly* (research verification, security sign-off). Every other
stage produces easily-checked structured output, so Sonnet 4.6 delivers the same end result
at lower latency and cost.

---

## The mini application

A minimal URL shortener (Express + in-memory store, TypeScript). It seeds 12 links at
startup so pagination spans more than one page.

| Method & path | Purpose | Seeded issue |
|---|---|---|
| `POST /links` | Create a short link from `{ "url": "..." }` | **SEC-001** — no URL scheme validation |
| `GET /links?page=&limit=` | List links, paginated | **BUG-001** — pagination off-by-one |
| `GET /links/:slug` | Metadata for one slug | **BUG-002** — crashes on unknown slug |
| `GET /r/:slug` | Redirect + count click | — (correct) |

### Seeded defects (before → after)

| ID | Type | File | Bug | Fix |
|---|---|---|---|---|
| **BUG-001** | logic | `src/store.ts` `listLinks()` | `offset = page * limit` skips page 1 | `offset = (page - 1) * limit` |
| **BUG-002** | logic | `src/app.ts` `GET /links/:slug` | reads `link.slug` with no null guard → 500 | null-check → clean 404 |
| **SEC-001** | security (CWE-20→79) | `src/app.ts` `POST /links` | accepts `javascript:` / `data:` / `file:` schemes | allowlist `http:` / `https:`, else 400 |

The repo ships with the **buggy** code in place and baseline tests that **fail** on it
(`tests/links.baseline.test.ts`). The pipeline applies the fixes; afterwards the whole
suite — including the agent-generated tests in `tests/links/` — passes.

---

## How to run

### Prerequisites
- Node.js ≥ 20, npm ≥ 10
- Claude Code CLI installed and authenticated (`claude --version`, `claude /login` once) —
  only needed to run the *pipeline*; the app and tests run without it.
- `git` on PATH (the orchestrator uses `git diff` to find changed files).

### Install
```bash
npm install
```

### See the bugs (baseline tests fail)
```bash
npm test
# 3 failing: BUG-001 pagination, BUG-002 unknown-slug 404, SEC-001 javascript: scheme
```

### Run the app manually
```bash
npm start            # http://localhost:3000
curl 'http://localhost:3000/links?page=1&limit=10'   # BUG-001: returns links 11–12
curl  http://localhost:3000/links/does-not-exist     # BUG-002: HTTP 500
curl -X POST http://localhost:3000/links \
     -H 'content-type: application/json' \
     -d '{"url":"javascript:alert(1)"}'              # SEC-001: HTTP 201 (accepted)
```

### Run the pipeline (single command)
```bash
npm run pipeline -- --bug 001-shortener-bugs
```
This drives all four agents in order, fixes the code, generates tests, and writes the
artifacts under `context/bugs/001-shortener-bugs/`.

### Confirm the fixes
```bash
npm test             # all green, including the generated tests/links/*.test.ts
```

> **Re-running:** the changed-file detection uses `git diff -- src/`, so `src/` must be in
> its **buggy committed state** before each run. To re-run, restore the buggy source first
> (`git checkout src/`), then run the pipeline again. See HOWTORUN.md.

---

## Project structure

```
homework-4/
├── agents/                4 agent definitions (.agent.md = frontmatter + prompt)
├── skills/                research-quality-measurement.md, unit-tests-FIRST.md
├── scripts/
│   ├── run-pipeline.ts    CLI entry — argv parse + startup validation
│   └── pipeline/          agent-loader, skill-loader, validators, claude-runner,
│                          stages, messages, logger, types
├── src/                   URL-shortener API (shortcode, store, app, index)
├── tests/                 links.smoke + links.baseline (seed); links/ (agent-generated)
├── context/bugs/001-shortener-bugs/
│   ├── bug-context.md     seeded report (input)
│   ├── research/codebase-research.md   seeded research (input; one planted error)
│   └── …generated…        verified-research, fix-summary, security-report, test-report
├── docs/screenshots/      before/after + pipeline-run captures
├── SPECIFICATION.md       the full spec this project was built from
├── README.md  ·  HOWTORUN.md
```

---

## AI tools used

- **Claude Code (Opus 4.8)** — wrote the `SPECIFICATION.md` and implemented this project
  from that spec.
- **Claude Code CLI (`claude -p`)** — *is* the pipeline runtime: each of the four agents is
  a headless `claude -p` subprocess with a per-agent model, injected skills, and an
  allow-listed toolset.
- Models exercised by the pipeline itself: **Opus 4.8** (research verification, security
  review) and **Sonnet 4.6** (bug fixing, test generation).

---

## Notes
- No `ANTHROPIC_API_KEY` is read anywhere — the pipeline uses your Claude Code subscription.
- Exit codes: `0` all stages clean · `1` an agent stage failed · `2` pre-flight failure
  (usage error, missing bug folder, missing `claude`/`git`/`npx`, invalid frontmatter or
  skill reference).
