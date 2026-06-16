# ✅ Final Verification Checklist: Banking Transactions API

This checklist provides a step-by-step guide to verify that all requirements for Homework 1 have been implemented correctly.

## 1. Environment & Startup
- [ ] **Install dependencies:** `cd homework-1 && npm install`
- [ ] **Start the server:** `npm start` (Server should be on http://localhost:3000)

## 2. Core Functional Tests (Task 1 & 3)
Run these commands in a separate terminal:

### A. Create a Transaction (POST /transactions)
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccount": "ACC-12345",
    "toAccount": "ACC-67890",
    "amount": 100.50,
    "currency": "USD",
    "type": "transfer"
  }'
```
- [ ] Expect: HTTP 201 Created with transaction details.

### B. List Transactions with Filter (GET /transactions)
```bash
curl "http://localhost:3000/transactions?accountId=ACC-12345"
```
- [ ] Expect: HTTP 200 with an array containing the transaction above.

### C. Get Specific Transaction (GET /transactions/:id)
*(Use the ID from the POST response)*
```bash
curl http://localhost:3000/transactions/<id>
```
- [ ] Expect: HTTP 200 with the transaction object.

### D. Get Account Balance (GET /accounts/:id/balance)
```bash
curl http://localhost:3000/accounts/ACC-12345/balance
```
- [ ] Expect: HTTP 200 with balance `-100.5`.

---

## 3. Validation Tests (Task 2)
Verify that the API rejects invalid data:

### A. Invalid Account Format
```bash
curl -i -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"fromAccount": "INVALID", "toAccount": "ACC-67890", "amount": 10, "currency": "USD", "type": "deposit"}'
```
- [ ] Expect: HTTP 400 with message "Account must be in format ACC-XXXXX".

### B. Negative Amount
```bash
curl -i -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"fromAccount": "ACC-12345", "toAccount": "ACC-67890", "amount": -50, "currency": "USD", "type": "deposit"}'
```
- [ ] Expect: HTTP 400 with message "Amount must be a positive number".

### C. Excessive Decimal Places (3+)
```bash
curl -i -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"fromAccount": "ACC-12345", "toAccount": "ACC-67890", "amount": 10.555, "currency": "USD", "type": "deposit"}'
```
- [ ] Expect: HTTP 400 with message "Amount must have at most 2 decimal places".

### D. Invalid Currency
```bash
curl -i -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"fromAccount": "ACC-12345", "toAccount": "ACC-67890", "amount": 10, "currency": "XYZ", "type": "deposit"}'
```
- [ ] Expect: HTTP 400 with message "Invalid currency code".

---

## 4. Additional Feature: Account Summary (Task 4)
```bash
curl http://localhost:3000/accounts/ACC-12345/summary
```
- [ ] Expect: HTTP 200 with `totalWithdrawals: 100.5`, `transactionCount: 1`, and `mostRecentTransaction` timestamp.

---

## 5. Balance Integrity Verification
1. Create a transfer of 50.00 from `ACC-A` to `ACC-B`.
2. Check balance of `ACC-A` (should be -50.00).
3. Check balance of `ACC-B` (should be 50.00).
- [ ] **Verified?**
