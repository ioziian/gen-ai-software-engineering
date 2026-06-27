# Homework 4 — 4-Agent Pipeline Specification

> A single-command, multi-agent pipeline that takes a seeded bug report and drives it
> through **verification → fixing → security review → test generation**, fully
> autonomously. Each stage is a distinct agent defined in `agents/*.agent.md` (model,
> tools, skills, and prompt in one file). The orchestrator does **not** call the
> Anthropic SDK directly; it spawns the **Claude Code CLI in non-interactive print mode
> (`claude -p`)** as the agent runtime — one subprocess per stage. Because the runtime is
> the developer's existing Claude Code subscription, the pipeline needs **no
> `ANTHROPIC_API_KEY` and costs $0 per run**.

This spec is self-contained: it is complete enough to implement the whole project from
scratch without seeing any original. Target stack is **JavaScript/TypeScript (Node.js)**.
No Python.

The artifact under analysis is a minimal **URL-shortener REST API** (`src/`) with three
seeded issues (2 logic bugs + 1 security vulnerability) used to demonstrate observable
before/after behavior. The pipeline fixes them and proves the fix with generated tests.

---

## 1. Project Structure

Exact folder/file tree to create. Files marked **(seed)** are committed by hand before
any run; files marked **(generated)** are written by the pipeline at run time.

```
homework-4/
├── agents/                              # 4 agent definitions (.agent.md = YAML frontmatter + prompt)
│   ├── research-verifier.agent.md       #   Opus 4.8 — verify seeded research vs. source
│   ├── bug-fixer.agent.md               #   Sonnet 4.6 — apply fixes, write fix-summary
│   ├── security-verifier.agent.md       #   Opus 4.8 — security review of changed files
│   └── unit-test-generator.agent.md     #   Sonnet 4.6 — FIRST-compliant Vitest tests
│
├── skills/                              # Domain rubrics injected into agent system prompts
│   ├── research-quality-measurement.md  #   L0–L4 research-quality rubric
│   └── unit-tests-FIRST.md              #   F-I-R-S-T unit-test rubric (Vitest)
│
├── scripts/
│   ├── run-pipeline.ts                  # CLI entry — argv parse + startup validation
│   └── pipeline/
│       ├── agent-loader.ts              #   parse + Zod-validate agents/*.agent.md
│       ├── skill-loader.ts              #   load + structure-check skills/*.md
│       ├── validators.ts                #   cross-ref skills; check claude/git/npx on PATH
│       ├── claude-runner.ts             #   spawn `claude -p` subprocess per stage
│       ├── stages.ts                    #   stage flow: seq 2→3, allSettled 4+5, runs tests
│       ├── messages.ts                  #   XML-tagged user-message builder
│       ├── logger.ts                    #   pino logger
│       └── types.ts                     #   shared types
│
├── src/                                 # The URL-shortener API (artifact under analysis)
│   ├── index.ts                         #   server entry — seed store + listen on PORT
│   ├── app.ts                           #   createApp(): Express routes (hosts BUG-002, SEC-001)
│   ├── store.ts                         #   in-memory link store (hosts BUG-001)
│   └── shortcode.ts                     #   deterministic base62 slug generator
│
├── tests/
│   ├── links.smoke.test.ts             # (seed) happy-path baseline — stays green
│   ├── links.baseline.test.ts          # (seed) 3 tests that FAIL pre-fix, PASS post-fix
│   ├── links/                          # (generated) tests written by unit-test-generator
│   └── pipeline/                       # (optional) orchestrator unit tests, subprocess mocked
│
├── context/bugs/001-shortener-bugs/
│   ├── bug-context.md                   # (seed) the seeded bug report — pipeline input
│   ├── baseline-tests.txt              # (generated) Stage-1 failing baseline capture
│   ├── research/
│   │   ├── codebase-research.md         # (seed) hand-written research with one planted error
│   │   └── verified-research.md         # (generated) Stage-2 output
│   ├── fix-summary.md                   # (generated) Stage-3 output (+ test results appended)
│   ├── security-report.md              # (generated) Stage-4 output
│   └── test-report.md                  # (generated) Stage-5 output (+ final test run appended)
│
├── docs/
│   └── screenshots/                     # Playwright captures (see §6)
│
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── HOWTORUN.md                          # cold-start runbook
└── README.md
```

All inter-agent communication happens through files in `context/bugs/<ID>/`. No agent
talks to another directly; the orchestrator reads each stage's output and injects it into
the next stage's prompt as XML-tagged blocks.

---

## 2. Mini Application

### Stack

- **Runtime:** Node.js ≥ 20
- **Language:** TypeScript, run directly with `tsx` (no build step needed for dev)
- **Framework:** Express 4
- **Store:** in-memory array (no database, no native modules — keeps the project
  install-clean and tests fully deterministic)
- **Tests:** Vitest + supertest

> **Why this stack:** it unifies the app with the TypeScript pipeline infrastructure, so
> the `unit-tests-FIRST` skill (Vitest) applies to the app's own tests verbatim, and
> there are zero native dependencies to compile.

### What the app does

A minimal URL shortener. `POST /links` stores a long URL and returns a short slug;
`GET /r/:slug` redirects to the original URL and counts the click; `GET /links` lists
stored links with pagination; `GET /links/:slug` returns one link's metadata. The store
is seeded with 12 links at startup so pagination spans more than one page (page size 10)
and the off-by-one defect is observable.

### Endpoints

| Method & path | Purpose | Success | Seeded issue |
|---|---|---|---|
| `POST /links` | Create a short link from `{ "url": "..." }` | `201` `{ id, slug, url, shortUrl }` | **SEC-001** (no URL scheme validation) |
| `GET /links?page=&limit=` | List links, paginated | `200` `{ links, pagination }` | **BUG-001** (pagination off-by-one) |
| `GET /links/:slug` | Metadata for one slug | `200` `{ slug, url, clicks, createdAt }` | **BUG-002** (crashes on unknown slug) |
| `GET /r/:slug` | Redirect + count click | `302` `Location: <url>` | — (correct) |

### Starting state (ship the BUGGY code)

The repository ships with the **defects in place** and baseline tests that **fail** on
them. This buggy source is the artifact the pipeline fixes — do not commit the corrected
version.

**`src/shortcode.ts`** (correct — no seeded bug here):

```ts
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Deterministic, stable base62 slug for a numeric id (offset keeps slugs ≥ 2 chars). */
export function toSlug(id: number): string {
  let n = id + 1000;
  let slug = '';
  while (n > 0) {
    slug = ALPHABET[n % 62] + slug;
    n = Math.floor(n / 62);
  }
  return slug;
}
```

**`src/store.ts`** (hosts **BUG-001**):

```ts
import { toSlug } from './shortcode';

export interface Link {
  id: number;
  slug: string;
  url: string;
  clicks: number;
  createdAt: string;
}

export interface ListResult {
  links: Link[];
  total: number;
}

let links: Link[] = [];
let nextId = 1;

export function createLink(url: string): Link {
  const id = nextId++;
  const link: Link = { id, slug: toSlug(id), url, clicks: 0, createdAt: new Date().toISOString() };
  links.push(link);
  return link;
}

export function getBySlug(slug: string): Link | undefined {
  return links.find((l) => l.slug === slug);
}

export function recordClick(slug: string): Link | undefined {
  const link = links.find((l) => l.slug === slug);
  if (link) link.clicks++;
  return link;
}

// BUG-001 (logic): `page` is 1-based, so offset must be (page - 1) * limit.
// Using `page * limit` skips the entire first page; page=1 never returns the first items.
export function listLinks(page: number, limit: number): ListResult {
  const offset = page * limit;                         // BUG-001
  return { links: links.slice(offset, offset + limit), total: links.length };
}

/** Test/seed helpers. */
export function reset(): void {
  links = [];
  nextId = 1;
}

export function seed(): void {
  reset();
  for (let i = 0; i < 12; i++) createLink(`https://example.com/page/${i}`);
}
```

**`src/app.ts`** (hosts **BUG-002** and **SEC-001**):

```ts
import express, { type Express } from 'express';
import * as store from './store';

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  // Create a short link.
  // SEC-001 (security): the submitted `url` is stored with NO scheme validation, so
  // `javascript:`, `data:`, and `file:` URLs are accepted and later served by the
  // redirect endpoint (dangerous-scheme injection — CWE-20 improper input validation,
  // enabling CWE-79 stored XSS when a short link is opened in a browser).
  app.post('/links', (req, res) => {
    const { url } = req.body ?? {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url is required' });
    }
    const link = store.createLink(url);                // SEC-001: no scheme allowlist
    res.status(201).json({
      id: link.id,
      slug: link.slug,
      url: link.url,
      shortUrl: `${req.protocol}://${req.get('host')}/r/${link.slug}`,
    });
  });

  // List links with pagination (delegates to store.listLinks — BUG-001 lives there).
  app.get('/links', (req, res) => {
    const page = Number.parseInt(String(req.query.page ?? '1'), 10) || 1;
    const limit = Number.parseInt(String(req.query.limit ?? '10'), 10) || 10;
    const { links, total } = store.listLinks(page, limit);
    res.json({ links, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  });

  // Metadata for one slug.
  // BUG-002 (logic): no null check — for an unknown slug `link` is undefined and reading
  // `link.slug` throws synchronously, so Express returns HTTP 500 instead of a clean 404.
  app.get('/links/:slug', (req, res) => {
    const link = store.getBySlug(req.params.slug);
    res.json({                                         // BUG-002: crashes on undefined
      slug: link.slug,
      url: link.url,
      clicks: link.clicks,
      createdAt: link.createdAt,
    });
  });

  // Redirect + count click (correct — included to make the security issue observable).
  app.get('/r/:slug', (req, res) => {
    const link = store.recordClick(req.params.slug);
    if (!link) return res.status(404).json({ error: 'not found' });
    res.redirect(302, link.url);
  });

  return app;
}
```

**`src/index.ts`** (server entry):

```ts
import { createApp } from './app';
import { seed } from './store';

const PORT = Number(process.env.PORT ?? 3000);
seed();
createApp().listen(PORT, () => {
  console.log(`URL shortener listening on http://localhost:${PORT}`);
});
```

### Seeded bugs (≥ 2)

#### BUG-001 — Pagination off-by-one (logic)

- **Affected file / line:** `src/store.ts`, `listLinks()`, the offset line (`const offset = page * limit;`, ~line 38).
- **The intentional error:** `page` is 1-based but the offset is computed as `page * limit`
  instead of `(page - 1) * limit`. The first page already skips the first `limit`
  records, and every page is shifted by one full page.
- **Reproduction:** with 12 seeded links and `limit=10`, `GET /links?page=1&limit=10`
  returns links 11–12 (offset `1*10=10`) instead of links 1–10. The first page of data is
  unreachable.
- **Expected behavior after fix:** `const offset = (page - 1) * limit;` →
  `GET /links?page=1&limit=10` returns the first 10 links.
- **Severity:** Medium (functional correctness; data inaccessible on page 1).

#### BUG-002 — Unknown-slug crash / missing null guard (logic)

- **Affected file / line:** `src/app.ts`, `GET /links/:slug` handler (the `res.json({ slug: link.slug, ... })` block, ~line 33).
- **The intentional error:** the handler reads `link.slug` / `link.url` without checking
  whether `store.getBySlug()` returned `undefined`. For an unknown slug this throws a
  `TypeError`, which Express converts to **HTTP 500**.
- **Reproduction:** `GET /links/does-not-exist` returns **500** (`Cannot read properties
  of undefined (reading 'slug')`) instead of a clean **404**.
- **Expected behavior after fix:** null-check before access; return **404**
  `{ "error": "not found" }` for an unknown slug.
  ```ts
  const link = store.getBySlug(req.params.slug);
  if (!link) return res.status(404).json({ error: 'not found' });
  res.json({ slug: link.slug, url: link.url, clicks: link.clicks, createdAt: link.createdAt });
  ```
- **Severity:** Medium (unhandled exception; 500 instead of 404 leaks an internal error).

### Security issue (≥ 1)

#### SEC-001 — Improper URL input validation / dangerous-scheme injection (security)

- **Category:** CWE-20 (improper input validation) → CWE-79 (stored XSS) for the
  `javascript:` case.
- **Affected file / line:** `src/app.ts`, `POST /links` handler, the
  `store.createLink(url)` call (~line 17) — the only validation is a non-empty-string
  check.
- **The intentional error:** the submitted `url` is stored with no scheme allowlist. A
  shortener must only ingest `http`/`https` URLs; here `javascript:`, `data:`, and
  `file:` URLs are accepted, stored, and served by `GET /r/:slug`. When such a short link
  is opened in a browser, the `javascript:` URI executes in the victim's page context
  (stored XSS); `file:` exposes a local-file vector.
- **Reproduction:**
  ```
  POST /links  { "url": "javascript:alert(document.cookie)" }
  ```
  - **Expected:** `400` `{ "error": "only http and https urls are allowed" }`.
  - **Actual:** `201 Created`; the dangerous URL is stored and `GET /r/:slug` issues a
    `302` to it.
- **Expected behavior after fix:** validate scheme; reject anything that is not
  `http:`/`https:`.
  ```ts
  let parsed: URL;
  try { parsed = new URL(url); }
  catch { return res.status(400).json({ error: 'invalid url' }); }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return res.status(400).json({ error: 'only http and https urls are allowed' });
  }
  const link = store.createLink(url);
  ```
- **Severity:** High (stored XSS / dangerous-scheme injection on every consumer of a short link).

> **Note — not "open redirect":** a URL shortener redirecting to an arbitrary external
> `http(s)` URL is the product's *purpose*, not a vulnerability. The seeded security
> defect is specifically the **absence of scheme validation**, which is behavior the app
> should not have.

### Baseline tests (seed; FAIL before the pipeline, PASS after)

**`tests/links.baseline.test.ts`** — these three assertions fail on the buggy source:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { reset, createLink } from '../src/store';

const app = createApp();

describe('baseline — seeded defects (fail pre-fix, pass post-fix)', () => {
  beforeEach(() => {
    reset();
    for (let i = 0; i < 12; i++) createLink(`https://example.com/page/${i}`);
  });

  it('BUG-001: GET /links?page=1 returns the FIRST page', async () => {
    const res = await request(app).get('/links?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.links).toHaveLength(10);
    expect(res.body.links[0].url).toBe('https://example.com/page/0');
  });

  it('BUG-002: GET /links/:slug for an unknown slug returns 404, not 500', async () => {
    const res = await request(app).get('/links/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('SEC-001: POST /links rejects a javascript: scheme with 400', async () => {
    const res = await request(app).post('/links').send({ url: 'javascript:alert(document.cookie)' });
    expect(res.status).toBe(400);
  });
});
```

**`tests/links.smoke.test.ts`** — happy-path baseline that stays green throughout:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { reset } from '../src/store';

const app = createApp();

describe('smoke — happy path (stays green)', () => {
  beforeEach(() => reset());

  it('creates a link and returns 201 with a slug', async () => {
    const res = await request(app).post('/links').send({ url: 'https://example.com' });
    expect(res.status).toBe(201);
    expect(res.body.slug).toBeTruthy();
  });

  it('GET /links returns a pagination envelope', async () => {
    const res = await request(app).get('/links');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('pagination');
  });
});
```

### Seeded pipeline input files (committed, verbatim)

These two files are committed by hand before any run. They are the only inputs the pipeline
cannot start without.

**`context/bugs/001-shortener-bugs/bug-context.md`:**

````markdown
# Bug Context — Batch 001 (URL Shortener)

This file documents the reported defects in the URL-shortener API (`src/`). It is the
entry point for the 4-agent pipeline: the Research Verifier checks the seeded research
against source, then the downstream agents fix, security-review, and test the changes.

- **Application:** `src/` (Express in-memory URL shortener)
- **Run:** `npm start` → http://localhost:3000
- **Test:** `npm test`
- **Reported defects:** 2 logic bugs + 1 security vulnerability

---

## BUG-001 — Pagination off-by-one (logic)

- **Severity:** Medium
- **Endpoint:** `GET /links`
- **File:** `src/store.ts` — `listLinks()`

### Symptom
With 12 seeded links and `limit=10`, `GET /links?page=1&limit=10` returns links 11–12
instead of links 1–10. The first page of data is unreachable.

### Reproduction
`GET /links?page=1&limit=10` → expected ids 1–10; actual ids 11–12.

### Suspected severity
Medium — data inaccessible on page 1; every page shifted by one full page.

### Hint
`src/store.ts` — `listLinks()`. The offset is `page * limit` where `page` is 1-based.

### Expected behavior
`const offset = (page - 1) * limit;` → page 1 returns the first `limit` links.

---

## BUG-002 — Unknown-slug crash (logic)

- **Severity:** Medium
- **Endpoint:** `GET /links/:slug`
- **File:** `src/app.ts` — `GET /links/:slug` handler

### Symptom
`GET /links/does-not-exist` returns HTTP 500 (`Cannot read properties of undefined`)
instead of a clean 404.

### Reproduction
`GET /links/does-not-exist` → expected 404; actual 500.

### Suspected severity
Medium — unhandled exception; 500 leaks an internal error instead of a clean 404.

### Hint
`src/app.ts` — the `GET /links/:slug` handler reads `link.slug` without checking whether
`store.getBySlug()` returned `undefined`.

### Expected behavior
Null-check before access; return 404 `{ "error": "not found" }` for an unknown slug.

---

## SEC-001 — Improper URL input validation / dangerous-scheme injection (security)

- **Severity:** High
- **Category:** CWE-20 (improper input validation) → CWE-79 (stored XSS)
- **Endpoint:** `POST /links`
- **File:** `src/app.ts` — `POST /links` handler

### Symptom
`POST /links { "url": "javascript:alert(document.cookie)" }` is accepted (201) and the
dangerous URL is stored and later served by `GET /r/:slug`.

### Reproduction
`POST /links { "url": "javascript:alert(document.cookie)" }` → expected 400; actual 201.

### Suspected severity
High — stored XSS / dangerous-scheme injection on every consumer of a short link.

### Hint
`src/app.ts` — `POST /links` stores `url` with no scheme allowlist. A shortener must only
ingest `http`/`https` URLs.

### Expected behavior
Validate `new URL(url).protocol` ∈ `{http:, https:}`; reject everything else with 400.
````

**`context/bugs/001-shortener-bugs/research/codebase-research.md`** — hand-written research
that is mostly correct but contains **one planted location error** (BUG-001 is cited at
`src/app.ts:40` when it actually lives in `src/store.ts` `listLinks()`). This is what the
Research Verifier must catch and correct:

````markdown
# Codebase Research — Batch 001 (URL Shortener)

## Bug Summary
The URL-shortener API has two logic defects (pagination off-by-one, unknown-slug crash)
and one security defect (no URL scheme validation on create).

## Affected Files
| File | Line | Role in bug |
|---|---|---|
| `src/app.ts` | 40 | BUG-001 — pagination offset computed as `page * limit` |
| `src/app.ts` | 33 | BUG-002 — `GET /links/:slug` reads `link.slug` with no null guard |
| `src/app.ts` | 17 | SEC-001 — `POST /links` stores `url` with no scheme allowlist |

## Relevant Code Snippets

`src/app.ts:40` (BUG-001):
```ts
const { links, total } = store.listLinks(page, limit);
```

`src/app.ts:33` (BUG-002):
```ts
const link = store.getBySlug(req.params.slug);
res.json({ slug: link.slug, url: link.url, clicks: link.clicks, createdAt: link.createdAt });
```

`src/app.ts:17` (SEC-001):
```ts
const link = store.createLink(url);
```

## Reproduction Steps
1. `npm start`; the store seeds 12 links.
2. `GET /links?page=1&limit=10` → returns links 11–12 (BUG-001).
3. `GET /links/does-not-exist` → 500 (BUG-002).
4. `POST /links {"url":"javascript:alert(1)"}` → 201 (SEC-001).

## Root Cause Hypothesis
- **BUG-001:** the offset formula uses 1-based `page` with a 0-based offset
  (`page * limit`), skipping the first page. **(Note: the offset arithmetic is actually in
  `src/store.ts` `listLinks()`, not in `app.ts` — the verifier should correct this.)**
- **BUG-002:** `getBySlug` can return `undefined`; the handler dereferences it without a guard.
- **SEC-001:** the `url` is persisted without validating its scheme, so `javascript:` /
  `data:` / `file:` URLs are accepted.
````

> The parenthetical hint above is included here only to make the spec self-documenting; the
> actual committed `codebase-research.md` should state the wrong location (`src/app.ts:40`)
> *without* the correction, so the Research Verifier genuinely earns its keep by finding it
> and writing the corrected `file:line` into `verified-research.md`.

### Entry point command

```bash
npm start            # tsx src/index.ts → http://localhost:3000
```

### Test command

```bash
npm test             # vitest run  (baseline tests fail until the pipeline fixes the bugs)
```

---

## 3. Skills

Skills are **domain rubric documents** injected into agent system prompts as
`<skill name="...">` blocks (see §5.4). They are not Claude Code plug-in skills from
`~/.claude/skills/`, despite the shared terminology.

> **Hard requirement (validator gate):** every skill file MUST literally contain the three
> header strings `## Levels`, `## Application`, and `## Required output sections`, or
> `skill-loader.ts` throws at load (see §5.1). Both skills below satisfy this.

### 3.1 `skills/research-quality-measurement.md`

Full content (the L0–L4 research-quality rubric; Example 2 is adapted to this project's
domain):

````markdown
# Research Quality Measurement

> A rubric for evaluating the quality of bug research produced by the Bug Researcher.
> The Research Verifier uses this skill to assign a quality level to `codebase-research.md`
> and produce `verified-research.md`. Higher levels indicate research that is fix-ready
> with high confidence; lower levels block progression until gaps are filled.

## Levels

| Level | Label | Definition |
|---|---|---|
| L0 | Unverifiable | References to files/lines that do not exist, or code snippets that do not match the actual source. The researcher has hallucinated file paths, line numbers, or code content. |
| L1 | Speculative | All file:line references exist and snippets match source, but the root-cause hypothesis is not grounded in code — it restates the bug description without citing specific code paths. Investigation is incomplete. |
| L2 | Adequate | All references verified. Root-cause hypothesis is supported by at least one piece of concrete evidence from the code (a specific conditional, a function call, a missing check). Sufficient to fix, but carries risk of missed edge cases. |
| L3 | Solid | Verified references + root cause traceable through two or more code locations + reproduction steps described + the likely fix region identified. Fix-ready. |
| L4 | Comprehensive | All of L3, plus: edge cases noted (boundary values, concurrent access, etc.), impact analysis of other call sites, and related historical bugs or CVEs referenced if applicable. Fix-ready with high confidence. |

## Application

Follow these steps when producing `verified-research.md`:

1. **Load source files.** For every `file:line` reference in `codebase-research.md`, use the `Read` tool to fetch lines ±5 around the cited line.
2. **Compare snippets character-by-character.** Allow only whitespace normalization. Any other difference is a discrepancy. Record ✓ (match) or ✗ (mismatch) per claim.
3. **Evaluate root-cause grounding.** Does the hypothesis cite at least one specific code construct (a conditional, a return value, a missing boundary check)? A hypothesis that only paraphrases the bug description is L1 or lower.
4. **Count corroborating locations.** Trace the bug from the entry point to the failure site. Two or more distinct code locations cited = L3 candidate.
5. **Check presence of:** reproduction steps (concrete command or call sequence), edge-case discussion, impact analysis (other callers of the buggy function), CVE/advisory references if the bug class is known.
6. **Assign a single Level (L0–L4)** with a one-sentence justification citing what was or was not present. The level drives whether the Bug Fixer can proceed.

**When to block progression:**
- L0 → stop. Research must be redone. Document what was hallucinated.
- L1 → proceed with caution. Note the speculation in Discrepancies Found.
- L2+ → the Bug Fixer can proceed. Note any missing analysis as informational.

## Required output sections

The `verified-research.md` document MUST contain all five of these sections (in order):

1. **Verification Summary** — one paragraph: overall pass/fail verdict, Research Quality Level (e.g. "L3 Solid"), and one sentence on whether the Bug Fixer can proceed.
2. **Verified Claims** — table with one row per claim: claim text, ✓/✗, and brief evidence (file:line + snippet excerpt or "not found").
3. **Discrepancies Found** — per discrepancy: what was claimed vs. what the source actually shows, and the impact on the root-cause hypothesis. If none, write "None."
4. **Research Quality Assessment** — the assigned level (L0–L4) with a paragraph of reasoning citing specific code evidence.
5. **References** — flat list of `file:line` entries used during verification, for auditing.

## Examples

### Example 1 — L0 (Unverifiable)

**Input fragment from codebase-research.md:**
> Affected file: `src/auth/middleware.ts:42` — `if (token === null) return next()` allows unauthenticated access.

**Verifier action:** Read `src/auth/middleware.ts` lines 37–47. The file does not contain that pattern; line 42 is `const user = req.headers['x-user']`.

**Correct output excerpt:**
```
## Verified Claims
| Claim | Result | Evidence |
|---|---|---|
| src/auth/middleware.ts:42 has null-token bypass | ✗ | Line 42 is `const user = req.headers['x-user']`; pattern not found |

## Research Quality Assessment
**L0 — Unverifiable.** The cited file exists but the snippet matches no line in it.
The root-cause hypothesis cannot be evaluated. Research must be redone.
```

### Example 2 — L3 (Solid) and catching a planted discrepancy

**Input fragment from codebase-research.md:**
> BUG-001: `src/app.ts:40` — `const offset = page * limit` should be `(page - 1) * limit`.
> Root cause: 1-based page with a 0-based offset formula skips the first page.

**Verifier action:** Read `src/app.ts` around line 40 — the offset line is **not** there;
it lives in `src/store.ts` inside `listLinks()`. Read `src/store.ts`, confirm
`const offset = page * limit` in `listLinks`, and confirm `src/app.ts`'s `GET /links`
handler calls `store.listLinks(page, limit)`.

**Correct output excerpt:**
```
## Verified Claims
| Claim | Result | Evidence |
|---|---|---|
| Offset bug is at src/app.ts:40 | ✗ | app.ts:40 calls store.listLinks(); the offset is in src/store.ts listLinks() |
| Offset uses `page * limit` (should be `(page-1)*limit`) | ✓ | Confirmed in src/store.ts listLinks(): `const offset = page * limit` |

## Discrepancies Found
- Claimed location `src/app.ts:40` is wrong; the defect is in `src/store.ts` `listLinks()`.
  Corrected file:line provided so the Bug Fixer edits the right file. Root cause is sound.

## Research Quality Assessment
**L3 — Solid.** Root cause is correct and traceable through two locations (store.listLinks
+ the app.ts call site), with a reproduction step. One file:line citation was wrong and is
corrected here; this is a location error, not a hypothesis error, so the research remains
fix-ready.
```
````

### 3.2 `skills/unit-tests-FIRST.md`

Full content (the FIRST rubric; Application paths and Examples adapted to the
URL-shortener app, Vitest + supertest):

````markdown
# Unit Tests — FIRST Principles

> A rubric for writing unit tests that are Fast, Independent, Repeatable, Self-validating,
> and Timely. The Unit Test Generator uses this skill to produce FIRST-compliant Vitest
> tests for code changed by the Bug Fixer. Every generated test must be checked against
> each letter before it is written to disk.

## Levels

| Letter | Principle | Pass condition | Fail condition |
|---|---|---|---|
| **F** | Fast | Completes in <100 ms. No real network calls (use supertest against the in-process app, never a live port). No real filesystem I/O. No real timers (`vi.useFakeTimers()` where `Date.now()`/`setTimeout` is involved). | Test takes >100 ms, or opens a real socket, or reads production files. |
| **I** | Independent | Passes regardless of execution order. No shared mutable state between tests. `beforeEach` resets the store via `reset()`. **`vi.useFakeTimers()` MUST be paired with `vi.useRealTimers()` in `afterEach`.** | Test depends on another test's side effects, or the in-memory store leaks across tests, or fake timers leak. |
| **R** | Repeatable | Same input → same result on any machine, in any timezone, at any time. No raw `Date.now()` without injection. No randomness without a fixed seed. | Test passes locally but fails in CI, or fails on a different day. |
| **S** | Self-validating | Binary pass/fail. No "check console output manually." One behavior per test. | Test has no assertions, or always passes regardless of behavior. |
| **T** | Timely | Tests cover only code that changed in the current fix. Do not retest existing behavior already covered by `links.baseline.test.ts`/`links.smoke.test.ts`. | Tests cover unchanged code, or duplicate existing coverage. |

## Application

Follow these steps when generating tests for changed code:

1. **Read `fix-summary.md`** to identify which functions and files were changed. List them explicitly before writing any test.
2. **For each changed function**, plan three test categories:
   - **Happy path** — correct input produces correct output after the fix.
   - **Bug regression** — input that previously triggered the bug now behaves correctly (e.g., `GET /links?page=1` returns the first page after BUG-001; `GET /links/<unknown>` returns 404 after BUG-002).
   - **Edge case** — boundary value the fix touches (e.g., last page is partial; `data:` scheme also rejected for SEC-001).
3. **Before writing each test**, self-check all five letters (F/I/R/S/T):
   - Real network/port? → use `supertest(createApp())`, never `.listen()`.
   - Shared store state? → `beforeEach(() => reset())`.
   - Time-dependent? → `vi.useFakeTimers()` / `vi.useRealTimers()`.
   - At least one `expect(...)`? → always.
   - Is the function under test in `fix-summary.md`? → if not, skip.
4. **Use existing project test patterns.** Read `tests/links.baseline.test.ts` for import
   style, supertest usage, and the `reset()` + seeding pattern. Replicate that structure.
5. **Write tests via the `Write` tool** to `tests/links/<changed-module>.test.ts`
   (one file per changed module). Do not append to existing files without reading them first.
6. **Fill the test-report** with one row per test: name, what it covers, FIRST compliance
   ✓/✗ per letter. If any letter is ✗, explain why and whether the compromise is acceptable.

**Worked example — FIRST Independent violation and fix:**

```ts
// WRONG — store leaks between tests (no reset)
describe('listLinks', () => {
  it('page 1', async () => { /* creates 12 links */ });   // ✗ I: next test sees these 12
  it('empty list', async () => { /* expects 0 */ });       // ✗ flaky
});

// CORRECT — reset before each test
describe('listLinks', () => {
  beforeEach(() => reset());                                // ✓ I: clean store per test
  it('page 1', async () => { /* ... */ });
  it('empty list', async () => { /* ... */ });
});
```

## Required output sections

The `test-report.md` document MUST contain all four of these sections:

1. **Tests Generated** — table with one row per test: file path, test name, what behavior it covers, FIRST compliance (✓/✗ per letter). Example:

   | File | Test name | Covers | F | I | R | S | T |
   |---|---|---|---|---|---|---|---|
   | tests/links/store.test.ts | page 1 returns first 10 links | BUG-001 fix | ✓ | ✓ | ✓ | ✓ | ✓ |

2. **Test Run Results** — placeholder. Leave the note `[orchestrator appends test run results here]`; the orchestrator runs `npm test` and appends the output.
3. **Coverage Delta** — rough per-file estimate (e.g., "+18% line coverage on src/store.ts"), based on which branches the new tests exercise.
4. **FIRST Violations** — any test that could not fully satisfy a principle, with the reason and mitigation. If all tests are fully compliant, write "None."

## Examples

### Example 1 — BUG-001 fix (pagination off-by-one)

**Changed file:** `src/store.ts` — `listLinks()` offset changed to `(page - 1) * limit`.

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { reset, createLink } from '../../src/store';

const app = createApp();

describe('listLinks — pagination after BUG-001 fix', () => {
  beforeEach(() => {
    reset();
    for (let i = 0; i < 12; i++) createLink(`https://example.com/page/${i}`);
  });

  it('page 1 returns the first 10 links', async () => {              // F✓ I✓ R✓ S✓ T✓
    const res = await request(app).get('/links?page=1&limit=10');
    expect(res.body.links[0].url).toBe('https://example.com/page/0');
    expect(res.body.links).toHaveLength(10);
  });

  it('page 2 returns the remaining 2 links', async () => {          // F✓ I✓ R✓ S✓ T✓
    const res = await request(app).get('/links?page=2&limit=10');
    expect(res.body.links).toHaveLength(2);
  });
});
```

### Example 2 — SEC-001 fix (scheme allowlist)

**Changed file:** `src/app.ts` — `POST /links` now validates `new URL(url).protocol`.

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { reset } from '../../src/store';

const app = createApp();

describe('POST /links — scheme validation after SEC-001 fix', () => {
  beforeEach(() => reset());

  it('rejects javascript: scheme with 400', async () => {           // F✓ I✓ R✓ S✓ T✓
    const res = await request(app).post('/links').send({ url: 'javascript:alert(1)' });
    expect(res.status).toBe(400);
  });

  it('rejects data: scheme with 400', async () => {                 // F✓ I✓ R✓ S✓ T✓
    const res = await request(app).post('/links').send({ url: 'data:text/html,<script>1</script>' });
    expect(res.status).toBe(400);
  });

  it('still accepts a normal https URL with 201', async () => {     // F✓ I✓ R✓ S✓ T✓
    const res = await request(app).post('/links').send({ url: 'https://example.com' });
    expect(res.status).toBe(201);
  });
});
```
````

---

## 4. Agent Specifications

Each agent is one `agents/<name>.agent.md` file: YAML frontmatter (parsed and
**Zod-validated** at load) followed by the system-prompt body. The frontmatter schema is
**strict** — only these keys are allowed: `name`, `model`, `max_tokens` (optional,
default 8192), `tools`, `skills`, `role`, `inputs`, `outputs`, `model_justification`.
Allowed `tools`: `Read`, `Grep`, `Edit`, `Write`. Allowed `model`: `claude-opus-4-8`,
`claude-sonnet-4-6`.

---

### Agent: research-verifier

- **File:** `agents/research-verifier.agent.md`
- **Model:** `claude-opus-4-8` — verification is precision-critical; a false "verified"
  silently corrupts every later stage, so the pipeline pays for Opus-grade precision
  exactly where errors propagate furthest.
- **Tools:** `Read`, `Grep` (read-only; must never edit source or research)
- **Skills:** `research-quality-measurement`
- **Input files:**
  - `context/bugs/<ID>/bug-context.md`
  - `context/bugs/<ID>/research/codebase-research.md` (the committed seed research)
- **Output file:** `context/bugs/<ID>/research/verified-research.md`
- **System prompt:**

```markdown
---
name: research-verifier
model: claude-opus-4-8
tools: [Read, Grep]
skills: [research-quality-measurement]
role: Fact-check the seeded codebase research against actual source and assign a quality level.
inputs:
  - context/bugs/<ID>/bug-context.md
  - context/bugs/<ID>/research/codebase-research.md
outputs:
  - context/bugs/<ID>/research/verified-research.md
model_justification: >
  Verification requires character-by-character snippet matching against source.
  False positives (approving wrong research) silently corrupt every later stage,
  so Opus 4.8 is chosen for highest precision on comparison-heavy work.
---

You are a Research Verifier. Your job is to fact-check the seeded codebase research
against the actual source code and assign a Research Quality Level per the
research-quality-measurement skill injected above.

You will receive a <bug-context> block and a <codebase-research> block.

## Your task

1. Re-read the research-quality-measurement skill (injected above) carefully.
2. For every `file:line` reference in the research, use the Read tool to fetch lines ±5
   around the cited line. Use Grep to relocate a snippet if the cited line is wrong.
3. Compare each code snippet character-by-character (whitespace normalization allowed).
   Record ✓ (match) or ✗ (mismatch / wrong location / not found) for each claim.
4. When a citation points at the wrong file or line but the same defect exists nearby,
   record the discrepancy AND provide the corrected `file:line` so the Bug Fixer edits
   the right place.
5. Evaluate whether each root-cause hypothesis is grounded in specific code or merely
   restates the symptom. Count distinct corroborating code locations.
6. Assign a single Research Quality Level (L0–L4) with a one-sentence justification tied
   to the rubric.
7. Produce your verification report with ALL sections required by the skill.

Produce exactly the sections listed in the skill's "Required output sections."
Do not add sections. Do not omit sections.
```

- **What NOT to do:**
  - Do not edit any source file or the research file — you are read-only.
  - Do not label a claim ✓ without actually opening the cited file with Read.
  - Do not rubber-stamp: if a citation's location is wrong, say so and correct it, even if
    the underlying hypothesis is right.
  - Do not invent sections or reorder the five required ones.

---

### Agent: bug-fixer

- **File:** `agents/bug-fixer.agent.md`
- **Model:** `claude-sonnet-4-6` — mechanical edit application against verified,
  well-localized findings; Sonnet performs precise `Edit` operations reliably and Opus is
  not needed for execution.
- **Tools:** `Read`, `Grep`, `Edit`, `Write`
- **Skills:** none
- **Input files:**
  - `context/bugs/<ID>/bug-context.md`
  - `context/bugs/<ID>/research/verified-research.md`
- **Output file:** `context/bugs/<ID>/fix-summary.md` (plus `src/**` modifications via `Edit`)
- **System prompt:**

```markdown
---
name: bug-fixer
model: claude-sonnet-4-6
tools: [Read, Grep, Edit, Write]
skills: []
role: Apply the verified fixes to source and document every change made.
inputs:
  - context/bugs/<ID>/bug-context.md
  - context/bugs/<ID>/research/verified-research.md
outputs:
  - context/bugs/<ID>/fix-summary.md
model_justification: >
  Mechanical edit application against verified, well-localized findings. Sonnet 4.6
  performs precise Edit operations reliably; Opus is not needed for plan execution.
---

You are a Bug Fixer. Apply the minimal correct fix for each VERIFIED finding, using the
Edit tool. Document every action you take.

You will receive a <bug-context> block and a <verified-research> block. Use the corrected
`file:line` references from verified-research (not any superseded ones from earlier
research).

## Your task

1. Read both blocks in full. Build the list of files/locations to change from the VERIFIED
   claims only. Skip any claim the verifier marked ✗ or DISPUTED.
2. For each change:
   a. Use Read to load the current code and confirm the exact "before" snippet.
   b. If the current code does NOT match what you expected, STOP and report the
      discrepancy in your summary — do not guess.
   c. Use Edit to apply the smallest change that fixes the defect (e.g., off-by-one →
      `(page - 1) * limit`; missing null guard → early 404; missing scheme validation →
      `http`/`https` allowlist).
3. Do NOT run shell commands or tests. The orchestrator runs the tests after you finish
   and appends the results to your fix-summary.md.
4. Produce your fix summary with ALL sections below.

## Required output sections

### Changes Made
For each file changed: **File**, **Change** (one sentence: what + why it fixes the bug),
**Before** (snippet replaced), **After** (replacement applied).

### Overall Status
One of: `ALL CHANGES APPLIED` · `PARTIAL: <reason>` · `FAILED: <reason>`.

### Manual Verification Steps
Concrete steps a human can follow to confirm each fix (exact requests / inputs / expected
status codes), independent of the automated suite.

### References
Every file you Read or Edited, with affected line numbers.
```

- **What NOT to do:**
  - Do not run tests or the dev server (the orchestrator owns test execution).
  - Do not refactor unrelated code or "improve" style — apply the smallest fix only.
  - Do not fix claims the verifier rejected; do not invent fixes not in verified-research.
  - Do not guess an edit when the "before" snippet does not match — stop and report.

---

### Agent: security-verifier

- **File:** `agents/security-verifier.agent.md`
- **Model:** `claude-opus-4-8` — adversarial security review; false negatives (a missed
  vulnerability shipping) are the worst possible failure, so this gate gets the strongest
  reasoning model to maximize recall on subtle issues.
- **Tools:** `Read`, `Grep` (review only; never edits)
- **Skills:** none
- **Input files:**
  - `context/bugs/<ID>/fix-summary.md`
  - changed `src/**` files (injected as `<changed-file name="...">` blocks by the orchestrator)
- **Output file:** `context/bugs/<ID>/security-report.md`
- **System prompt:**

```markdown
---
name: security-verifier
model: claude-opus-4-8
tools: [Read, Grep]
skills: []
role: Security review of changed code after the Bug Fixer applies fixes.
inputs:
  - context/bugs/<ID>/fix-summary.md
  - changed src/** files (injected as <changed-file> blocks by orchestrator)
outputs:
  - context/bugs/<ID>/security-report.md
model_justification: >
  Security review is precision-critical — false negatives (missed vulnerabilities) are
  more damaging than slow responses. Opus 4.8 provides the highest accuracy for security
  pattern recognition.
---

You are a Security Verifier. Review the changed code for security vulnerabilities
introduced or left unaddressed by the Bug Fixer.

You will receive a <fix-summary> block and one or more <changed-file name="path"> blocks
containing the post-fix source. The orchestrator has already read and injected the changed
files; use Read only if you need surrounding context not in the blocks.

## Your task

1. Read the fix-summary to understand what changed and why.
2. Review each <changed-file> block for:
   - Injection (command, SQL, path traversal) and dangerous URL schemes
     (javascript:, data:, file:) reaching a sink.
   - Improper input validation at trust boundaries (request bodies, query params).
   - Hardcoded secrets or credentials in source.
   - Insecure comparisons (timing-attack-vulnerable equality on secrets).
   - SSRF / open redirect to attacker-controlled hosts, and reflected/stored XSS if HTTP
     responses echo user input.
   - Unsafe crypto: deprecated APIs, weak algorithms.
3. Confirm SEC-001 (URL scheme validation) is actually remediated in the changed code, and
   check the fix did not introduce a new gap (e.g., a try/catch that swallows errors and
   accepts the URL anyway).
4. Rate each finding CRITICAL / HIGH / MEDIUM / LOW / INFO. Do NOT edit any files.

## Required output sections

### Summary
Total findings by severity; one paragraph on overall posture after the fix. If none, say so.

### Findings
For each: **Severity**, **File** (`path:line`), **Description** (what + how exploited),
**Remediation** (concrete fix, with a corrected snippet if applicable).
If there are no findings, write: `No security issues found in the changed files.`

### Scope
Files reviewed (from <changed-file> blocks) and files explicitly NOT reviewed.
```

- **What NOT to do:**
  - Do not edit code — report only.
  - Do not pad the report with hypothetical issues unrelated to the changed files; keep
    findings grounded in the injected source.
  - Do not approve SEC-001 as fixed without seeing the actual scheme-allowlist code in the
    changed file.

---

### Agent: unit-test-generator

- **File:** `agents/unit-test-generator.agent.md`
- **Model:** `claude-sonnet-4-6` — pattern-driven test generation guided by the
  `unit-tests-FIRST` skill and existing test patterns; the skill supplies the quality
  rubric, so this is constrained, example-led work Sonnet executes well.
- **Tools:** `Read`, `Grep`, `Write`
- **Skills:** `unit-tests-FIRST`
- **Input files:**
  - `context/bugs/<ID>/fix-summary.md`
  - changed `src/**` files (injected as `<changed-file name="...">` blocks)
- **Output file:** `context/bugs/<ID>/test-report.md` (plus `tests/links/<module>.test.ts` via `Write`)
- **System prompt:**

```markdown
---
name: unit-test-generator
model: claude-sonnet-4-6
tools: [Read, Grep, Write]
skills: [unit-tests-FIRST]
role: Generate FIRST-compliant Vitest tests for code changed by the Bug Fixer.
inputs:
  - context/bugs/<ID>/fix-summary.md
  - changed src/** files (injected as <changed-file> blocks by orchestrator)
outputs:
  - context/bugs/<ID>/test-report.md
  - tests/links/<changed-module>.test.ts (via Write)
model_justification: >
  Pattern-driven test generation following existing project conventions. Sonnet 4.6 follows
  style references reliably. FIRST compliance is enforced via the injected skill, not by
  model choice.
---

You are a Unit Test Generator. Write Vitest tests for the code changed by the Bug Fixer,
following FIRST principles as defined by the unit-tests-FIRST skill injected above.

You will receive a <fix-summary> block and one or more <changed-file name="path"> blocks.

## Your task

1. Re-read the unit-tests-FIRST skill (injected above) carefully.
2. Read the fix-summary to identify which functions/files changed.
3. Use Read on `tests/links.baseline.test.ts` to learn the project's test conventions
   (supertest against `createApp()`, the `reset()` + seeding pattern, import style).
4. For each changed function, plan: a happy-path test, a bug-regression test (the exact
   input that triggered the bug now behaves correctly), and one edge case.
5. Before writing each test, self-check F/I/R/S/T per the rubric.
6. Use the Write tool to create `tests/links/<changed-module>.test.ts` (one file per
   changed source module). Mirror the baseline test's structure.
7. Produce your test report with ALL sections required by the skill.

## Mandatory constraints

- Use `supertest(createApp())` against the in-process app — never call `.listen()` or hit
  a real port.
- `beforeEach(() => reset())` (plus seeding where needed) so tests are Independent.
- Do NOT run tests yourself. The orchestrator runs `npm test` after you finish and appends
  the results to your test-report.md.

Produce exactly the sections listed in the skill's "Required output sections."
Do not add sections. Do not omit sections.
```

- **What NOT to do:**
  - Do not start a real server / bind a port — use supertest in-process.
  - Do not write tests for unchanged code or duplicate `links.baseline.test.ts` (violates Timely).
  - Do not leave shared store state between tests (violates Independent).
  - Do not run the test suite yourself; leave the `[orchestrator appends…]` placeholder.

---

## 5. Pipeline Runner

### 5.1 Architecture

- **Language:** TypeScript, executed with `tsx` (no precompile needed).
- **Entry:** `scripts/run-pipeline.ts`.
- **Runtime model:** the orchestrator spawns `claude -p` once per agent stage and passes
  context between stages as files + XML-tagged stdin messages. It owns all deterministic
  work (running `vitest`, computing the git diff of changed files); the agents own all
  judgment work.

Modules in `scripts/pipeline/`:

| Module | Responsibility |
|---|---|
| `types.ts` | Shared interfaces: `AgentSpec`, `RunCtx`, `RunResult`. |
| `logger.ts` | `pino` logger (`level` from `LOG_LEVEL`, default `info`). |
| `agent-loader.ts` | Read `agents/*.agent.md`, split frontmatter with `gray-matter`, validate against a strict **Zod** schema, return `Map<name, AgentSpec>`. Rejects unknown models/tools/keys and non-kebab-case names. |
| `skill-loader.ts` | Read `skills/*.md`, assert each contains the required headers (`## Levels`, `## Application`, `## Required output sections`), return `Map<skillId, content>`. |
| `validators.ts` | `checkSystemDependencies()` — verify `claude`, `git`, `npx` are on PATH (exit 2 if not). `validateAgentSkillRefs()` — every skill an agent references must exist. |
| `messages.ts` | `buildUserMessage(parts)` — wrap each context part in `<type name="...">…</type>` XML tags. |
| `claude-runner.ts` | `buildSystemPrompt()` (agent prompt + injected skill blocks), `spawnClaude()` (the real subprocess seam), `runAgent()` (assemble flags, run, time it, normalize errors). |
| `stages.ts` | The stage flow: deterministic baseline run, sequential research-verifier → bug-fixer, then `Promise.allSettled` for security-verifier ‖ unit-test-generator; runs `vitest` after the fix and after test generation, appends results to artifacts. |

#### `types.ts`

```ts
export interface AgentSpec {
  name: string; model: string; max_tokens: number;
  tools: string[]; skills: string[];
  role: string; inputs: string[]; outputs: string[];
  model_justification: string; prompt: string;
}
export interface RunCtx { bugId: string; agents: Map<string, AgentSpec>; skills: Map<string, string>; bugDir: string; }
export interface RunResult { summary: { bugId: string; stagesRun: number; failures: string[]; durationMs?: number }; failures: string[]; }
```

#### `agent-loader.ts` (Zod + gray-matter)

```ts
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import matter from 'gray-matter';
import { z } from 'zod';
import type { AgentSpec } from './types';

export const MODELS = ['claude-opus-4-8', 'claude-sonnet-4-6'] as const;
export const TOOLS  = ['Read', 'Grep', 'Edit', 'Write'] as const;

export const AgentSpecSchema = z.object({
  name:                z.string().regex(/^[a-z][a-z0-9-]*$/, 'kebab-case required'),
  model:               z.enum(MODELS),
  max_tokens:          z.number().int().positive().max(16384).default(8192),
  tools:               z.array(z.enum(TOOLS)).default([]),
  skills:              z.array(z.string()).default([]),
  role:                z.string().min(1),
  inputs:              z.array(z.string()).default([]),
  outputs:             z.array(z.string()).default([]),
  model_justification: z.string().min(1),
}).strict();

export async function loadAllAgents(dir: string): Promise<Map<string, AgentSpec>> {
  const agents = new Map<string, AgentSpec>();
  if (!existsSync(dir)) return agents;
  for (const file of readdirSync(dir).filter(f => f.endsWith('.agent.md'))) {
    const parsed = matter(readFileSync(`${dir}/${file}`, 'utf-8'));
    const result = AgentSpecSchema.safeParse(parsed.data);
    if (!result.success) {
      const errs = result.error.errors.map(e => `  ${e.path.join('.')}: ${e.message}`).join('\n');
      throw new Error(`Agent ${file} failed Zod validation:\n${errs}`);
    }
    agents.set(result.data.name, { ...result.data, prompt: parsed.content.trim() });
  }
  return agents;
}
```

#### `skill-loader.ts` (structure gate)

```ts
import { existsSync, readdirSync, readFileSync } from 'node:fs';
const REQUIRED_HEADERS = ['## Levels', '## Application', '## Required output sections'];

export function validateSkillStructure(content: string, filename: string): void {
  for (const header of REQUIRED_HEADERS) {
    if (!content.includes(header)) throw new Error(`Skill "${filename}" missing required header: "${header}"`);
  }
}
export async function loadAllSkills(dir: string): Promise<Map<string, string>> {
  const skills = new Map<string, string>();
  if (!existsSync(dir)) return skills;
  for (const file of readdirSync(dir).filter(f => f.endsWith('.md'))) {
    const content = readFileSync(`${dir}/${file}`, 'utf-8');
    validateSkillStructure(content, file);
    skills.set(file.replace(/\.md$/, ''), content);
  }
  return skills;
}
```

#### `validators.ts` (pre-flight gates)

```ts
import { execFileSync } from 'node:child_process';
import type { AgentSpec } from './types';

type WhichFn = (dep: string) => void;
const defaultWhich: WhichFn = (dep) => execFileSync('which', [dep], { stdio: 'ignore' });

export function checkSystemDependencies(whichFn: WhichFn = defaultWhich): void {
  const deps = [
    { cmd: 'claude', hint: 'Install Claude Code: https://docs.anthropic.com/claude-code. See HOWTORUN.md.' },
    { cmd: 'git',    hint: 'Install git and ensure it is on PATH.' },
    { cmd: 'npx',    hint: 'Install Node.js (includes npx) and ensure it is on PATH.' },
  ];
  for (const { cmd, hint } of deps) {
    try { whichFn(cmd); }
    catch { console.error(`Missing system dependency: ${cmd}. ${hint}`); process.exit(2); }
  }
}

export function validateAgentSkillRefs(agents: Map<string, AgentSpec>, skills: Map<string, string>): void {
  for (const [, spec] of agents) {
    for (const skillId of spec.skills) {
      if (!skills.has(skillId)) {
        const available = [...skills.keys()].join(', ') || '(none)';
        throw new Error(`Agent "${spec.name}" references unknown skill: "${skillId}". Available: [${available}]`);
      }
    }
  }
}
```

#### `messages.ts` (XML-tagged context)

```ts
export function buildUserMessage(parts: Array<{ type: string; name?: string; content: string }>): string {
  return parts
    .map(p => `<${p.type}${p.name ? ` name="${p.name}"` : ''}>\n${p.content}\n</${p.type}>`)
    .join('\n\n');
}
```

### 5.2 Stage Order and Data Flow

The orchestrator runs four agent stages. Stage 1 is a deterministic orchestrator step
(no agent) that records the failing baseline. `<ID>` = `001-shortener-bugs`.

| Stage | Actor | Reads | Writes |
|---|---|---|---|
| **1** | Orchestrator (deterministic) | runs `npx vitest run` | `context/bugs/<ID>/baseline-tests.txt` (failing baseline) |
| **2** | **research-verifier** (Opus) | `bug-context.md` + **`research/codebase-research.md`** (seed) | `research/verified-research.md` |
| **3** | **bug-fixer** (Sonnet) | `bug-context.md` + `research/verified-research.md` | edits `src/**` + `fix-summary.md` |
| **3a** | Orchestrator | runs `npx vitest run` | appends "Test Results" to `fix-summary.md` |
| **4 ‖ 5** | **security-verifier** (Opus) ‖ **unit-test-generator** (Sonnet), parallel | `fix-summary.md` + `<changed-file>` blocks (from `git diff --name-only src/`) | `security-report.md` ‖ `test-report.md` + `tests/links/*.test.ts` |
| **5a** | Orchestrator | runs `npx vitest run` | appends "Final Test Run" to `test-report.md` |

> **Operational precondition:** the `<changed-file>` blocks for stages 4 & 5 come from
> `git diff --name-only HEAD -- src/`, so `src/` must be **committed before the run** —
> then the Bug Fixer's edits show up as the working-tree delta. If you commit the fix and
> re-run, the diff is empty and the reviewers receive no changed files; reset `src/` to the
> buggy committed state before each run. (Document this in HOWTORUN.md.)

`stages.ts`:

```ts
import { promises as fs } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { runAgent, spawnClaude } from './claude-runner';
import { buildUserMessage } from './messages';
import { logger } from './logger';
import type { RunCtx, RunResult, AgentSpec } from './types';

export type SpawnFn = typeof spawnClaude;
const TEST_TIMEOUT_MS = 3 * 60 * 1000;

function runTests(): string {
  try {
    return execFileSync('npx', ['vitest', 'run'], { encoding: 'utf-8', stdio: 'pipe', timeout: TEST_TIMEOUT_MS });
  } catch (e: any) {
    return (e.stdout?.toString() ?? '') + '\n' + (e.stderr?.toString() ?? '');
  }
}
function gitDiffNames(scope: string): string[] {
  try {
    return execFileSync('git', ['diff', '--name-only', '--relative', 'HEAD', '--', scope], { encoding: 'utf-8' })
      .trim().split('\n').filter(Boolean);
  } catch { return []; }
}

export async function runStages(ctx: RunCtx, spawn: SpawnFn = spawnClaude): Promise<RunResult> {
  const { bugId, agents, skills, bugDir } = ctx;
  const failures: string[] = [];

  async function runStage(agentName: string, userMsg: string, outputPath: string): Promise<void> {
    const spec = agents.get(agentName) as AgentSpec;
    logger.info({ agent: agentName, model: spec.model }, 'starting');
    try {
      const { text, durationMs } = await runAgent(spec, skills, userMsg, spawn);
      await fs.mkdir(`${bugDir}/${outputPath.split('/').slice(0, -1).join('/')}`, { recursive: true });
      await fs.writeFile(`${bugDir}/${outputPath}`, text, 'utf-8');
      logger.info({ agent: agentName, durationMs }, 'done');
    } catch (e: any) {
      logger.error({ agent: agentName, err: e.message }, 'FAILED');
      failures.push(agentName); throw e;
    }
  }

  const bugContext = await fs.readFile(`${bugDir}/bug-context.md`, 'utf-8');

  // Stage 1 — record the failing baseline (deterministic, no agent)
  await fs.writeFile(`${bugDir}/baseline-tests.txt`, runTests(), 'utf-8');

  // Stage 2 — Research Verifier (verifies the committed codebase-research.md)
  const codebaseResearch = await fs.readFile(`${bugDir}/research/codebase-research.md`, 'utf-8');
  await runStage('research-verifier', buildUserMessage([
    { type: 'bug-context', content: bugContext },
    { type: 'codebase-research', content: codebaseResearch },
  ]), 'research/verified-research.md');

  // Stage 3 — Bug Fixer
  const verifiedResearch = await fs.readFile(`${bugDir}/research/verified-research.md`, 'utf-8');
  await runStage('bug-fixer', buildUserMessage([
    { type: 'bug-context', content: bugContext },
    { type: 'verified-research', content: verifiedResearch },
  ]), 'fix-summary.md');

  // 3a — orchestrator runs tests after the fix
  await fs.appendFile(`${bugDir}/fix-summary.md`,
    `\n\n## Test Results (orchestrator-recorded)\n\`\`\`\n${runTests()}\n\`\`\`\n`);

  // Shared context for the parallel reviewers
  const fixSummary = await fs.readFile(`${bugDir}/fix-summary.md`, 'utf-8');
  const changedParts = await Promise.all(gitDiffNames('src/').map(async f => ({
    type: 'changed-file', name: f, content: await fs.readFile(f, 'utf-8'),
  })));
  const msgForReviewers = buildUserMessage([{ type: 'fix-summary', content: fixSummary }, ...changedParts]);

  // Stages 4 & 5 — parallel (partial-failure isolation)
  const [secRes, testRes] = await Promise.allSettled([
    runStage('security-verifier',   msgForReviewers, 'security-report.md'),
    runStage('unit-test-generator', msgForReviewers, 'test-report.md'),
  ]);
  if (secRes.status  === 'rejected') logger.error({ err: secRes.reason  }, 'security-verifier failed');
  if (testRes.status === 'rejected') logger.error({ err: testRes.reason }, 'unit-test-generator failed');

  // 5a — re-run tests to capture the generated ones
  await fs.appendFile(`${bugDir}/test-report.md`,
    `\n\n## Final Test Run (orchestrator-recorded)\n\`\`\`\n${runTests()}\n\`\`\`\n`).catch(() => {});

  return { summary: { bugId, stagesRun: 4, failures }, failures };
}
```

`run-pipeline.ts` (entry):

```ts
#!/usr/bin/env tsx
import { existsSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { loadAllAgents } from './pipeline/agent-loader';
import { loadAllSkills } from './pipeline/skill-loader';
import { checkSystemDependencies, validateAgentSkillRefs } from './pipeline/validators';
import { runStages } from './pipeline/stages';
import { logger } from './pipeline/logger';

const { values } = parseArgs({ options: { bug: { type: 'string', short: 'b' } } });
if (!values.bug) { console.error('Usage: npm run pipeline -- --bug <id>'); process.exit(2); }

async function main(): Promise<void> {
  checkSystemDependencies();
  const agents = await loadAllAgents('agents/');
  const skills = await loadAllSkills('skills/');
  validateAgentSkillRefs(agents, skills);

  const bugDir = `context/bugs/${values.bug!}`;
  if (!existsSync(`${bugDir}/bug-context.md`)) throw new Error(`Bug not found: ${bugDir}/bug-context.md`);

  const result = await runStages({ bugId: values.bug!, agents, skills, bugDir });
  logger.info({ summary: result.summary }, 'Pipeline complete');
  process.exit(result.failures.length === 0 ? 0 : 1);
}
main().catch(err => { logger.error({ err }, 'Pipeline failed'); process.exit(2); });
```

### 5.3 How to Invoke the Claude CLI

Each stage runs `claude -p` headless, with the agent's model, the composed system prompt
(agent body + injected skills), and the agent's allowed tools. The XML-tagged user message
is written to the subprocess's **stdin**. `claude -p` uses the developer's Claude Code
subscription — **no `ANTHROPIC_API_KEY` is read**.

```ts
// claude-runner.ts
import { spawn as nodeSpawn } from 'node:child_process';
import type { AgentSpec } from './types';
const SUBPROCESS_TIMEOUT_MS = 5 * 60 * 1000;

export function buildSystemPrompt(agent: AgentSpec, skills: Map<string, string>): string {
  const skillBlocks = agent.skills.map(id => {
    const content = skills.get(id);
    if (!content) throw new Error(`Agent ${agent.name} references unknown skill: ${id}`);
    return `\n\n<skill name="${id}">\n${content}\n</skill>\n\n`;
  }).join('');
  return agent.prompt + skillBlocks;
}

export function spawnClaude(args: string[], input: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = nodeSpawn('claude', args, { timeout: SUBPROCESS_TIMEOUT_MS });
    let stdout = '', stderr = '';
    child.stdout.on('data', c => { stdout += c.toString('utf-8'); });
    child.stderr.on('data', c => { stderr += c.toString('utf-8'); });
    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (code === 0) return resolve({ stdout, stderr });
      const err: any = new Error(`Command failed: claude ${args[0] ?? ''}`);
      err.stdout = stdout; err.stderr = stderr;
      if (child.killed || signal === 'SIGTERM') { err.killed = true; err.signal = 'SIGTERM'; }
      reject(err);
    });
    child.stdin.on('error', () => { /* EPIPE if subprocess exits early */ });
    child.stdin.write(input, 'utf-8'); child.stdin.end();
  });
}

export async function runAgent(
  spec: AgentSpec, skills: Map<string, string>, userMessage: string,
  spawn: typeof spawnClaude = spawnClaude,
): Promise<{ text: string; durationMs: number }> {
  const systemPrompt = buildSystemPrompt(spec, skills);
  const args = [
    '-p',
    '--model', spec.model,
    '--append-system-prompt', systemPrompt,
    ...(spec.tools.length > 0 ? ['--allowedTools', spec.tools.join(',')] : ['--allowedTools', 'none']),
  ];
  const start = Date.now();
  try {
    const { stdout } = await spawn(args, userMessage);
    const text = stdout.trim();
    if (!text) throw new Error(`Agent ${spec.name} returned empty output`);
    return { text, durationMs: Date.now() - start };
  } catch (e: any) {
    if (e.code === 'ENOENT') throw new Error('claude CLI not found. Install Claude Code; see HOWTORUN.md.');
    if (e.killed && e.signal === 'SIGTERM') throw new Error(`Agent ${spec.name} exceeded ${SUBPROCESS_TIMEOUT_MS / 1000}s timeout`);
    throw new Error(`Agent ${spec.name} failed: ${e.message}\n${e.stderr ?? ''}`);
  }
}
```

Effective command per stage:

```
claude -p \
  --model <claude-opus-4-8 | claude-sonnet-4-6> \
  --append-system-prompt "<agent prompt + injected <skill> blocks>" \
  --allowedTools "Read,Grep[,Edit,Write]"
# user message (XML-tagged context) is piped to stdin
```

> `validators.ts` also defines `checkSystemDependencies()` (verifies `claude`, `git`,
> `npx` on PATH; `process.exit(2)` with an install hint if missing) and
> `validateAgentSkillRefs()` (every `skills:` entry in an agent must resolve to a loaded
> skill, else throw).

### 5.4 How Skills Are Injected

1. `skill-loader.ts` loads every `skills/*.md` into a `Map<skillId, fullMarkdown>` where
   `skillId` is the filename without `.md` (e.g., `research-quality-measurement`). Each
   file is structure-checked for the three required headers at load time.
2. An agent declares the skills it needs in frontmatter: `skills: [research-quality-measurement]`.
3. `validateAgentSkillRefs()` fails fast at startup if an agent references a skill that
   does not exist.
4. At stage run time, `buildSystemPrompt()` appends each referenced skill to the agent's
   prompt body as a delimited block:
   ```
   <agent prompt body>

   <skill name="research-quality-measurement">
   …full skill markdown…
   </skill>
   ```
5. The combined string is passed via `--append-system-prompt`, so the model sees its role
   prompt followed by the rubric it must apply.

### 5.5 `package.json` Scripts

```json
{
  "name": "homework-4-url-shortener-pipeline",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "start":      "tsx src/index.ts",
    "pipeline":   "tsx scripts/run-pipeline.ts",
    "test":       "vitest run",
    "test:watch": "vitest",
    "typecheck":  "tsc --noEmit",
    "build":      "tsc -p tsconfig.json"
  },
  "dependencies": {
    "express":      "^4.19.2",
    "gray-matter":  "^4.0.3",
    "pino":         "^9.6.0",
    "zod":          "^3.24.2"
  },
  "devDependencies": {
    "@types/express":  "^4.17.21",
    "@types/node":     "^22.10.7",
    "@types/supertest":"^6.0.2",
    "supertest":       "^7.0.0",
    "tsx":             "^4.19.2",
    "typescript":      "^5.7.3",
    "vitest":          "^3.2.3"
  }
}
```

Run a bug through the pipeline:

```bash
npm run pipeline -- --bug 001-shortener-bugs
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "CommonJS", "moduleResolution": "Node",
    "lib": ["ES2022"], "outDir": "dist", "rootDir": ".",
    "strict": true, "esModuleInterop": true, "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true, "resolveJsonModule": true, "declaration": true, "sourceMap": true
  },
  "include": ["src/**/*", "scripts/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['tests/**/*.test.ts'] } });
```

---

## 6. Screenshots Plan (Playwright)

The app is a JSON API + CLI with **no browser UI**, and Playwright drives a browser, so
screenshots use two mechanisms:

- **A. Live JSON endpoints** — start the server (`npm start`), then navigate the browser
  to a `GET` URL; the browser renders the JSON body, which is captured.
- **B. Rendered terminal/test output** — write command output (vitest run, pipeline pino
  log) into a small self-contained HTML file (e.g. `<pre>…</pre>`), open it with
  `browser_navigate` to a `file://` path, and capture.

All captures use the Playwright MCP tools (`browser_navigate`, `browser_take_screenshot`),
not shell screenshot tools. Saved under `docs/screenshots/`.

| # | When | Mechanism | Target | Filename |
|---|---|---|---|---|
| 1 | Before pipeline | B | `npm test` output (3 failing baseline tests) rendered to HTML | `01-tests-before.png` |
| 2 | Before pipeline (server on buggy code) | A | `http://localhost:3000/links?page=1&limit=10` — shows links 11–12 (BUG-001) | `02-bug001-before.png` |
| 3 | Before pipeline | A | `http://localhost:3000/links/does-not-exist` — shows the 500 error (BUG-002) | `03-bug002-before.png` |
| 4 | Before pipeline | B | rendered result of `POST /links {"url":"javascript:alert(1)"}` returning 201 (SEC-001) | `04-sec001-before.png` |
| 5 | During pipeline | B | pipeline pino log (stage start/done lines for all 4 agents) rendered to HTML | `05-pipeline-run.png` |
| 6 | After pipeline (restart server) | A | `http://localhost:3000/links?page=1&limit=10` — now shows links 1–10 (BUG-001 fixed) | `06-bug001-after.png` |
| 7 | After pipeline | A | `http://localhost:3000/links/does-not-exist` — now clean 404 JSON (BUG-002 fixed) | `07-bug002-after.png` |
| 8 | After pipeline | B | rendered result of `POST /links {"url":"javascript:alert(1)"}` returning 400 (SEC-001 fixed) | `08-sec001-after.png` |
| 9 | After pipeline | B | `npm test` output — full suite green, incl. generated `tests/links/*` | `09-tests-after.png` |

> Capture order matters: take shots 1–4 against the **buggy** checkout before running the
> pipeline, then 5 during the run, then restart the server and take 6–9 after the fixes
> land.

---

## 7. Model Choices Rationale

| Agent | Model | Reason |
|---|---|---|
| research-verifier | `claude-opus-4-8` | Character-by-character citation checking; a false "verified" corrupts every later stage, so use the highest-precision model. |
| bug-fixer | `claude-sonnet-4-6` | Mechanical application of small, well-localized edits against verified findings — execution, not open-ended reasoning. |
| security-verifier | `claude-opus-4-8` | Adversarial security review where a false negative ships a vulnerability; maximize recall with the strongest reasoning model. |
| unit-test-generator | `claude-sonnet-4-6` | Pattern-driven, skill-guided test generation following existing conventions — constrained work Sonnet does reliably. |

**Showcase rationale:** Opus 4.8 is reserved for the two stages whose output is a
*judgment the rest of the pipeline trusts blindly* (research verification, security
sign-off). The other two stages produce easily-checked structured output, so Sonnet 4.6
delivers the same end result at lower latency and cost.

---

## 8. Implementation Checklist

Create files in dependency order:

1. `package.json`, `tsconfig.json`, `vitest.config.ts` — project skeleton; `npm install`.
2. `src/shortcode.ts` — slug generator (no deps).
3. `src/store.ts` — in-memory store **with BUG-001 in place**; depends on `shortcode.ts`.
4. `src/app.ts` — Express routes **with BUG-002 and SEC-001 in place**; depends on `store.ts`.
5. `src/index.ts` — server entry; depends on `app.ts` + `store.ts`.
6. `tests/links.smoke.test.ts` + `tests/links.baseline.test.ts` — confirm the 3 baseline
   tests **FAIL** on the buggy code (`npm test`).
7. `skills/research-quality-measurement.md` and `skills/unit-tests-FIRST.md` — must each
   contain `## Levels`, `## Application`, `## Required output sections`.
8. `scripts/pipeline/types.ts` → `logger.ts` → `messages.ts` (no internal deps).
9. `scripts/pipeline/agent-loader.ts` (needs `gray-matter`, `zod`, `types`).
10. `scripts/pipeline/skill-loader.ts`.
11. `scripts/pipeline/validators.ts` (needs `types`).
12. `scripts/pipeline/claude-runner.ts` (needs `types`).
13. `scripts/pipeline/stages.ts` (needs `claude-runner`, `messages`, `logger`, `types`).
14. `scripts/run-pipeline.ts` (wires loaders + validators + stages).
15. `agents/research-verifier.agent.md`, `bug-fixer.agent.md`,
    `security-verifier.agent.md`, `unit-test-generator.agent.md` — frontmatter must pass
    the Zod schema; `skills:` entries must match step 7 filenames.
16. `context/bugs/001-shortener-bugs/bug-context.md` — the seeded report (2 bugs + 1
    security issue), structured: Symptom · Reproduction · Suspected severity · Hint ·
    Expected behavior, per issue.
17. `context/bugs/001-shortener-bugs/research/codebase-research.md` — hand-written research
    citing the three defects, with **one planted location error** (e.g., attribute BUG-001
    to `src/app.ts` instead of `src/store.ts`) so the research-verifier visibly catches it.
18. `HOWTORUN.md` + `README.md` — prerequisites (Node ≥ 20, Claude Code CLI authenticated,
    git on PATH), `npm install`, `npm test` (shows failing baseline), then
    `npm run pipeline -- --bug 001-shortener-bugs`.
19. Run the pipeline end-to-end; confirm `npm test` is fully green afterward.
20. Capture the §6 screenshots into `docs/screenshots/`.

### Definition of done

- `npm test` fails on exactly the 3 seeded baseline assertions before the pipeline runs.
- `npm run pipeline -- --bug 001-shortener-bugs` exits `0`, producing `verified-research.md`,
  `fix-summary.md`, `security-report.md`, and `test-report.md` plus new `tests/links/*`.
- `npm test` is fully green after the run.
- `verified-research.md` records the planted citation error as a discrepancy with a
  corrected `file:line`.
- `security-report.md` confirms SEC-001 is remediated (http/https allowlist present).
- All nine screenshots are captured.
```