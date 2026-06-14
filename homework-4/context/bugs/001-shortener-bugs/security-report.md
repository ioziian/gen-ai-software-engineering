## Summary

**Findings: 0 CRITICAL, 0 HIGH, 1 MEDIUM, 0 LOW, 2 INFO.**

SEC-001 is genuinely remediated. The `POST /links` handler now parses the submitted URL with `new URL(url)` and enforces a protocol allowlist (`http:`/`https:`), rejecting `javascript:`, `data:`, and `file:` schemes with a clean 400. The `try/catch` does **not** swallow errors and fall through — its catch path returns 400, and the allowlist check sits *after* the parse, so a malformed or non-http(s) URL can never reach `store.createLink`. Stored-XSS via the `/r/:slug` redirect (the original attack path) is closed. Overall posture after the fix is good; the one remaining item is a host-header reflection that is low-impact in this design.

## Findings

**Severity: MEDIUM**
**File:** `src/app.ts:30` (`shortUrl: \`${req.protocol}://${req.get('host')}/r/${link.slug}\``)
**Description:** Host header injection. `req.get('host')` is attacker-controlled (clients set the `Host` header freely) and is reflected unescaped into the `shortUrl` field of the JSON response. Impact is limited here because the value is only echoed back to the same caller in a JSON body (not HTML, so no direct XSS; `Content-Type: application/json` prevents script execution), and it is not persisted. The real risk surfaces if `shortUrl` is later stored, emailed, or rendered as a clickable link elsewhere — then a poisoned `Host` produces links pointing at an attacker domain.
**Remediation:** Build the base URL from a trusted config value rather than the inbound header.
```ts
const base = process.env.PUBLIC_BASE_URL ?? `${req.protocol}://${req.get('host')}`;
// ...
shortUrl: `${base}/r/${link.slug}`,
```
Set `PUBLIC_BASE_URL` in deployment; only fall back to the header in dev.

---

**Severity: INFO**
**File:** `src/app.ts:62` (`res.redirect(302, link.url)`)
**Description:** Open redirect — inherent to a URL shortener (the product *is* redirecting to arbitrary user URLs). The SEC-001 allowlist already restricts destinations to `http:`/`https:`, which removes the dangerous-scheme angle. No new gap introduced. Noted for awareness, not a defect.
**Remediation:** None required for the threat model. If phishing-abuse becomes a concern, add a domain blocklist/reputation check or an interstitial warning page.

---

**Severity: INFO**
**File:** `src/app.ts:18-26`
**Description:** The allowlist compares `parsed.protocol` (correct — `URL` normalizes scheme to lowercase with trailing colon, e.g. `HTTP://` → `http:`), so case-variant bypass (`JavaScript:`) is not possible. Confirmed safe. No SSRF: the server issues a client-side 302 and never fetches `link.url` itself.

## Scope

**Reviewed (from `<changed-file>` blocks):**
- `src/app.ts` — SEC-001 scheme allowlist, BUG-002 404 handling, pagination passthrough.
- `src/store.ts` — BUG-001 offset fix, link CRUD/seed helpers.

**NOT reviewed (not injected):**
- `scripts/pipeline/claude-runner.ts` — modified per git status but not provided; outside this review.
- `src/shortcode.ts` (`toSlug`) — referenced by `store.ts` but not changed/injected; slug generation not audited.

No security issue blocks SEC-001 sign-off. SEC-001 = remediated.