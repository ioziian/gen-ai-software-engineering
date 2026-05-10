#!/bin/bash
# Тестові curl-запити для Banking Transactions API

# Створити транзакцію
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"fromAccount":"ACC-12345","toAccount":"ACC-67890","amount":100.50,"currency":"USD","type":"transfer"}'
echo -e "\n---"

# Отримати всі транзакції
curl http://localhost:3000/transactions
echo -e "\n---"

# Отримати транзакції для конкретного акаунта
curl "http://localhost:3000/transactions?accountId=ACC-12345"
echo -e "\n---"

# Баланс акаунта
curl http://localhost:3000/accounts/ACC-12345/balance
echo -e "\n---"

# Зведення по акаунту
curl http://localhost:3000/accounts/ACC-12345/summary
echo -e "\n---"
