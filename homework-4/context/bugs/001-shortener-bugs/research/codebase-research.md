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
const offset = page * limit;
```

`src/app.ts:34` (BUG-002):
```ts
const link = store.getBySlug(req.params.slug)!;
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
  (`page * limit`), skipping the first page. The offset is computed inline in the
  `GET /links` handler in `src/app.ts`.
- **BUG-002:** `getBySlug` can return `undefined`; the handler dereferences it without a guard.
- **SEC-001:** the `url` is persisted without validating its scheme, so `javascript:` /
  `data:` / `file:` URLs are accepted.
