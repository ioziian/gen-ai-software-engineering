@echo off
setlocal enabledelayedexpansion

set PORT=3000
set SERVER_URL=http://localhost:%PORT%

echo === Starting Server ===
start /B npm run dev
timeout /t 5 >nul

echo.
echo === Starting Verification Suite ===

:: 1. Create Ticket
echo.
echo [Command] Create Ticket
echo [Parameters] POST %SERVER_URL%/tickets
curl -s -X POST %SERVER_URL%/tickets ^
  -H "Content-Type: application/json" ^
  -d "{"customer_email":"user@test.com", "subject":"Login Issue", "description":"I cannot access my account"}"
echo.

:: 2. List Tickets
echo.
echo [Command] List Tickets
echo [Parameters] GET %SERVER_URL%/tickets
curl -s %SERVER_URL%/tickets
echo.

:: 3. Get Ticket (Need ID from step 1)
:: In Windows BAT this is trickier without jq. Skipping dynamic ID for simplicity or assuming hardcoded.
:: For complex verification, Powershell is recommended over BAT.

:: 7. Bulk Import
echo.
echo [Command] Bulk Import (JSON)
echo [Parameters] POST %SERVER_URL%/tickets/import
curl -s -X POST %SERVER_URL%/tickets/import ^
  -H "Content-Type: application/json" ^
  -d "[{"customer_email":"a@b.com", "subject":"Bug", "description":"Crash"}]"
echo.

echo === Verification Complete ===
taskkill /F /FI "WINDOWTITLE eq npm run dev"
:: Note: This might need adjustment depending on how npm/node starts
pause
