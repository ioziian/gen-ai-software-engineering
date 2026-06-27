All 3 fixes applied. Summary at `context/bugs/001-shortener-bugs/fix-summary.md`.

**BUG-001** (`src/store.ts:39`) — `page * limit` → `(page - 1) * limit`. Page 1 now returns items 1–10.

**BUG-002** (`src/app.ts:40`) — dropped `!` assertion, added `if (!link) return 404`.

**SEC-001** (`src/app.ts:18`) — `new URL(url)` parse + protocol allowlist (`http:`/`https:`); malformed URLs also get 400.

## Test Results (orchestrator-recorded)
```

 RUN  v3.2.6 /Users/ihoroziian/Documents/set/gen-ai-software-engineering/homework-4

 ✓ tests/links.smoke.test.ts (2 tests) 19ms
 ✓ tests/links.baseline.test.ts (3 tests) 19ms

 Test Files  2 passed (2)
      Tests  5 passed (5)
   Start at  22:16:03
   Duration  410ms (transform 43ms, setup 0ms, collect 287ms, tests 38ms, environment 0ms, prepare 109ms)


```
