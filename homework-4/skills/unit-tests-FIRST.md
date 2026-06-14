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
