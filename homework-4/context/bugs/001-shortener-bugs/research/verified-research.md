Read both files. Comparing claims to source.

**Findings:**
- BUG-001: research cites `src/app.ts:40`, but offset code lives in `src/store.ts:39`. Snippet content matches store. Wrong **file**.
- BUG-002: research cites `src/app.ts:33`/`:34`; actual defect at `src/app.ts:40`. Wrong **line**, right file.
- SEC-001: research cites `src/app.ts:17`; actual `createLink(url)` at `src/app.ts:18`. Off-by-one line.

All three hypotheses sound. Writing report.

---

# Verified Research — Batch 001 (URL Shortener)

## Verification Summary

**PASS — Research Quality Level: L3 (Solid).** All three root-cause hypotheses are correct and grounded in concrete code constructs; reproduction steps and fix regions are present. However, every `file:line` citation is off — BUG-001 points at the wrong file entirely (`app.ts` vs `store.ts`), and BUG-002/SEC-001 are off by one or more lines. These are location errors, not hypothesis errors, so the research remains fix-ready. **The Bug Fixer can proceed using the corrected locations below.**

## Verified Claims

| Claim | Result | Evidence |
|---|---|---|
| Offset bug at `src/app.ts:40` | ✗ | `app.ts:40` is `const link = store.getBySlug(...)!`. `app.ts:31` calls `store.listLinks()`; offset lives in `src/store.ts:39`. |
| Offset uses `page * limit` (should be `(page-1)*limit`) | ✓ | `src/store.ts:39`: `const offset = page * limit; // BUG-001` |
| BUG-001 offset "computed inline in the GET /links handler in src/app.ts" | ✗ | Not inline in app.ts; `app.ts:28-33` delegates to `store.listLinks(page, limit)` (`store.ts:38-41`). |
| Unknown-slug crash at `src/app.ts:33`/`:34` | ✗ | Defect is at `src/app.ts:40`; lines 33-34 are the `/links` handler end and a blank/comment line. |
| `getBySlug` dereferenced with `!`, no null guard | ✓ | `src/app.ts:40`: `const link = store.getBySlug(req.params.slug)!;` then `link.slug` at `:42`. `store.getBySlug` returns `Link \| undefined` (`store.ts:26`). |
| SEC-001: `url` stored with no scheme allowlist at `src/app.ts:17` | ✗ (line) / ✓ (defect) | Claimed line 17 is the 400 return; actual store call is `src/app.ts:18`: `store.createLink(url); // SEC-001: no scheme allowlist`. No protocol check anywhere in `POST /links` (`app.ts:13-25`). |
| Dangerous URL later served by redirect | ✓ | `src/app.ts:50-53` `GET /r/:slug` → `res.redirect(302, link.url)` with no validation. |

## Discrepancies Found

- **BUG-001 — wrong file.** Claimed `src/app.ts:40`; the offset defect is in `src/store.ts:39` inside `listLinks()`. The root-cause hypothesis also wrongly states the offset is "computed inline in the GET /links handler in src/app.ts" — it is in `store.listLinks()`, called from `app.ts:31`. **Corrected location: `src/store.ts:39`.** Hypothesis sound; fix `const offset = (page - 1) * limit;`.
- **BUG-002 — wrong line.** Claimed `src/app.ts:33`/`:34`; actual defect at **`src/app.ts:40`** (`getBySlug(...)!`) with the unguarded deref at `:42`. Right file, right defect, line off by ~6–7. Fix: null-check `link`, return 404 `{ error: 'not found' }`.
- **SEC-001 — line off by one.** Claimed `src/app.ts:17` (which is the existing 400 `url is required` return); actual store call at **`src/app.ts:18`**. Right file, right defect. Fix: validate `new URL(url).protocol ∈ {http:, https:}` before `:18`, else 400.

## Research Quality Assessment

**L3 — Solid.** All three defects are real and the hypotheses cite specific code constructs: the `page * limit` offset formula (`store.ts:39`), the `!` non-null assertion on a `Link | undefined` return (`app.ts:40` + `store.ts:26`), and the absence of any protocol allowlist between `app.ts:13` and `:18`. Two of the three are traceable through two or more locations — BUG-001 spans `store.listLinks` and the `app.ts:31` call site; SEC-001 spans the unvalidated `createLink` store and the `GET /r/:slug` redirect sink (`app.ts:50-53`) that makes it exploitable. Reproduction steps and fix regions are stated. It falls short of **L4** because every citation is mislocated (BUG-001 names the wrong file), edge-case analysis is thin (e.g. empty/`data:`/`file:` schemes, malformed `new URL()` throwing, negative/zero `page`), and broader impact/CVE context beyond the inline CWE tags is absent. Location errors do not undermine the hypotheses, so the work remains fix-ready.

## References

- `src/app.ts:13-25` — `POST /links` handler (SEC-001)
- `src/app.ts:18` — `store.createLink(url)` (corrected SEC-001 location)
- `src/app.ts:28-33` — `GET /links` handler, calls `store.listLinks` at `:31`
- `src/app.ts:39-47` — `GET /links/:slug` handler (BUG-002)
- `src/app.ts:40` — `getBySlug(...)!` (corrected BUG-002 location)
- `src/app.ts:50-53` — `GET /r/:slug` redirect sink (SEC-001)
- `src/store.ts:26-28` — `getBySlug` returns `Link | undefined`
- `src/store.ts:38-41` — `listLinks`, offset at `:39` (corrected BUG-001 location)
- `src/store.ts:49-52` — `seed()` (12 links, repro)