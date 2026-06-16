# Temporary Implementation Plan: Banking Transactions API

This file tracks the implementation plan and progress for Homework 1 (Banking Transactions API).

---

## Phase 1: Project Setup
- [x] 1. Initialize project structure under homework-1/ (src, docs/screenshots, demo, etc.)
- [x] 2. Choose technology stack (Node.js or Python)
- [x] 3. Create .gitignore, README.md, HOWTORUN.md, and initial package.json (or requirements.txt)

## Phase 2: Core API Implementation
- [x] 4. Implement in-memory storage for transactions and accounts
- [x] 5. Create Transaction model (id, fromAccount, toAccount, amount, currency, type, timestamp, status)
- [x] 6. Implement endpoints:
    - [x] POST /transactions
    - [x] GET /transactions
    - [x] GET /transactions/:id
    - [x] GET /accounts/:accountId/balance
- [x] 7. Add basic error handling and HTTP status codes

---

Express.js server initialized and running (src/index.js)

## Phase 3: Transaction Validation
- [x] 8. Implement validation logic (amount, account, currency)
- [x] 9. Return meaningful error messages for invalid requests

## Phase 4: Transaction Filtering
- [x] 10. Add filtering to GET /transactions (accountId, type, date range, combined)

## Phase 5: Additional Feature
- [x] 11. Implement one additional feature: Transaction Summary Endpoint (GET /accounts/:accountId/summary)

## Phase 6: Documentation & Demo
- [x] 12. Update README.md with project overview, features, and architecture
- [x] 13. Write HOWTORUN.md with step-by-step run instructions
- [x] 14. Prepare demo files in demo/ (run.sh, sample-requests.http, sample-data.json)
- [x] 15. Create final verification checklist and polish documentation

## Phase 7: Verification
- [x] 16. Test all endpoints with sample requests
- [x] 17. Verify error handling and validation
- [x] 18. Confirm additional feature works as specified

---

**Decisions:**
- Technology stack: Node.js/Express (default, unless changed)
- Additional feature: Transaction Summary Endpoint (Option A)

---

Update this file as steps are completed.
