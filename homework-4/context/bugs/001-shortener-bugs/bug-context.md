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
