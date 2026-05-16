@echo off
REM Test curl requests for Banking Transactions API (Windows)

REM Create a transaction
curl -X POST http://localhost:3000/transactions ^
  -H "Content-Type: application/json" ^
  -d "{\"fromAccount\":\"ACC-12345\",\"toAccount\":\"ACC-67890\",\"amount\":100.50,\"currency\":\"USD\",\"type\":\"transfer\"}"
echo.
echo ---

REM Get all transactions
curl http://localhost:3000/transactions
echo.
echo ---

REM Get transactions for a specific account
curl "http://localhost:3000/transactions?accountId=ACC-12345"
echo.
echo ---

REM Get account balance
curl http://localhost:3000/accounts/ACC-12345/balance
echo.
echo ---

REM Get account summary
curl http://localhost:3000/accounts/ACC-12345/summary
echo.
echo ---
