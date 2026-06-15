# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start server in development mode (respawn)
npm test             # Run full test suite with coverage
npm run test:coverage # Run coverage report
```

Run a single test file:
```bash
npx vitest tests/test_ticket_api.test.ts
```

Run tests matching a name pattern:
```bash
npx vitest -t "auto-classify"
```

## Verification

### Automated Verification Scripts
Located in `demo/`, these scripts start the server and run a comprehensive verification suite:
- **macOS/Linux:** `./demo/run_verification.sh`
- **Windows:** `./demo/run_verification.bat`

Coverage threshold is 85% for statements, branches, functions, and lines.

## Architecture

Layered Express API with in-memory storage — no database.

```
Routes → Services → Repositories
           ↕            ↕
       Validators    Parsers (CSV/JSON/XML)
           ↕
  ClassificationService → ClassificationLogger
```

## Development Standards

- **Error Handling:** When catching errors, always check if `err` is an instance of `Error` before accessing `err.message` (e.g., `const message = err instanceof Error ? err.message : String(err);`).
- **TypeScript Types:** Ensure all external dependencies have type definitions (`@types/*`).
- **API Requirements:** For raw body parsing (like CSV `text/csv`), ensure the corresponding middleware (`express.text({ type: 'text/csv' })`) is configured in `app.ts`.
- **Test Fixtures:** Use randomized, unique IDs (e.g., `U001` format) in `tests/fixtures/` to ensure test isolation and data privacy.

## Tests

Test files live in `tests/`, fixtures in `tests/fixtures/`. Each test file clears the repository in `beforeEach` to ensure isolation.
