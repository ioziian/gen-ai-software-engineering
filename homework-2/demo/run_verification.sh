#!/bin/bash

# Configuration
PORT=3000
SERVER_URL="http://localhost:$PORT"

echo "=== Starting Server (Ctrl+C to stop) ==="
cd ..
npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 5

echo -e "
=== Starting Verification Suite ==="

# 1. Create Ticket
echo -e "
[Command] Create Ticket"
echo "[Parameters] POST $SERVER_URL/tickets"
# Single line to avoid line continuation issues
TICKET_RESPONSE=$(curl -s -X POST "$SERVER_URL/tickets" -H "Content-Type: application/json" -d '{"customer_id":"123", "customer_email":"user@test.com", "customer_name":"Test User", "subject":"Login Issue", "description":"I cannot access my account"}')

echo "$TICKET_RESPONSE" | jq .
TICKET_ID=$(echo "$TICKET_RESPONSE" | jq -r '.id')
echo -e "
"

# 2. List Tickets
echo -e "[Command] List Tickets"
echo "[Parameters] GET $SERVER_URL/tickets"
curl -s "$SERVER_URL/tickets" | jq .
echo -e "
"

# 3. Get Ticket
echo -e "[Command] Get Specific Ticket"
echo "[Parameters] GET $SERVER_URL/tickets/$TICKET_ID"
curl -s "$SERVER_URL/tickets/$TICKET_ID" | jq .
echo -e "
"

# 4. Auto-classify
echo -e "[Command] Auto-classify Ticket"
echo "[Parameters] POST $SERVER_URL/tickets/$TICKET_ID/auto-classify"
curl -s -X POST "$SERVER_URL/tickets/$TICKET_ID/auto-classify" | jq .
echo -e "
"

# 5. Update Ticket
echo -e "[Command] Update Ticket"
echo "[Parameters] PUT $SERVER_URL/tickets/$TICKET_ID"
curl -s -X PUT "$SERVER_URL/tickets/$TICKET_ID" -H "Content-Type: application/json" -d '{"status": "in_progress"}' | jq .
echo -e "
"

# 6. Delete Ticket
echo -e "[Command] Delete Ticket"
echo "[Parameters] DELETE $SERVER_URL/tickets/$TICKET_ID"
curl -s -X DELETE -I "$SERVER_URL/tickets/$TICKET_ID"
echo -e "
"

# 7. Bulk Import
echo -e "[Command] Bulk Import (JSON)"
echo "[Parameters] POST $SERVER_URL/tickets/import"
curl -s -X POST "$SERVER_URL/tickets/import" -H "Content-Type: application/json" -d '[{"customer_id":"1","customer_email":"a@b.com","customer_name":"A","subject":"Bug","description":"Crash"}]' | jq .
echo -e "
"

echo "=== Verification Complete ==="
kill $SERVER_PID
