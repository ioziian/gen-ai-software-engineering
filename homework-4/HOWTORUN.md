# HOWTORUN — homework-4 cold-start runbook

A 4-agent autonomous bug-fixing pipeline. One command drives four Claude Code subprocesses
(research-verifier → bug-fixer → security-verifier ‖ unit-test-generator) and writes
structured artifacts for the seeded bug batch.

---

## Prerequisites

| Requirement | Check | Install |
|---|---|---|
| Node.js ≥ 20 | `node --version` | https://nodejs.org |
| npm ≥ 10 | `npm --version` | bundled with Node |
| Claude Code CLI | `claude --version` | `npm install -g @anthropic-ai/claude-code` |
| git | `git --version` | https://git-scm.com |

**No Anthropic API key is needed.** The pipeline invokes `claude -p` as a subprocess, which
uses your Claude Code subscription. No `ANTHROPIC_API_KEY` is read at any point.

### Install Claude Code (only needed to run the pipeline)
```bash
npm install -g @anthropic-ai/claude-code
claude /login        # one-time OAuth in the browser
claude --version
```

---

## Installation
```bash
cd homework-4
npm install
```

---

## 1. Observe the bugs (no Claude needed)

```bash
npm test
```
Three baseline assertions fail against the buggy source:

| Test | Bug | Asserts |
|---|---|---|
| `BUG-001: GET /links?page=1 returns the FIRST page` | 001 | page 1 returns the first 10 links |
| `BUG-002: GET /links/:slug for an unknown slug returns 404` | 002 | unknown slug → 404, not 500 |
| `SEC-001: POST /links rejects a javascript: scheme` | SEC | `javascript:` URL → 400 |

Optionally run the server and poke it:
```bash
npm start            # http://localhost:3000
```

---

## 2. Run the pipeline (one command)

```bash
npm run pipeline -- --bug 001-shortener-bugs
# short form: npm run pipeline -- -b 001-shortener-bugs
```

What happens, in order:
1. **Pre-flight** — Zod-validates the 4 agents + 2 skills, checks `claude`/`git`/`npx`.
2. **Stage 1 (deterministic)** — runs `vitest`, saves the failing baseline to
   `context/bugs/001-shortener-bugs/baseline-tests.txt`.
3. **Stage 2 — Research Verifier (Opus 4.8)** — verifies `research/codebase-research.md`
   against source (it contains one planted location error to catch) → `verified-research.md`.
4. **Stage 3 — Bug Fixer (Sonnet 4.6)** — applies the fixes to `src/`, writes
   `fix-summary.md`; the orchestrator then re-runs `vitest` and appends the results.
5. **Stages 4 ‖ 5 (parallel)** — Security Verifier (Opus) writes `security-report.md`;
   Unit Test Generator (Sonnet) writes `tests/links/*.test.ts` + `test-report.md`; the
   orchestrator re-runs `vitest` and appends the final results.

A run typically takes 2–4 minutes. Pino JSON logs show each stage start/done.

---

## 3. Confirm the fixes
```bash
npm test             # all green, including the new tests/links/*.test.ts
```

Artifacts written under `context/bugs/001-shortener-bugs/`:
```
baseline-tests.txt                 Stage 1
research/verified-research.md      Stage 2
fix-summary.md                     Stage 3 (+ orchestrator test results)
security-report.md                 Stage 4
test-report.md                     Stage 5 (+ orchestrator final test run)
```

---

## Re-running the pipeline

The changed-file detection uses `git diff --name-only HEAD -- src/`, so `src/` must be in
its **buggy committed state** before a run (then the fixer's edits appear as the working-tree
delta). To run again after a previous run already modified `src/`:

```bash
git checkout src/                  # restore the buggy source
npm run pipeline -- --bug 001-shortener-bugs
```

If you run with an already-fixed, committed `src/`, the reviewers receive empty
`<changed-file>` blocks and have nothing to review.

---

## Troubleshooting

**`claude: command not found`** — install Claude Code (`npm install -g @anthropic-ai/claude-code`)
and ensure the npm global bin dir is on `PATH` (`npm bin -g`).

**`Pipeline failed: Bug not found: …/bug-context.md`** — the `--bug` id must match a folder
under `context/bugs/`. The only batch is `001-shortener-bugs`.

**`Agent X failed: Command failed: claude -p`** — a transient API error. Re-run; the pipeline
is stateless and each stage reads its input fresh from disk.

**`Agent X exceeded 300s timeout`** — each `claude -p` subprocess is killed after 5 minutes.
Rare; re-run the pipeline.

**`Missing system dependency: <cmd>`** — install the named tool (`claude`, `git`, or `npx`)
and ensure it is on `PATH`.
