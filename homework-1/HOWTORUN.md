# ▶️ How to Run and Test the Application

## 1. Start the API Server

You can use the provided script to install dependencies and start the server:

```bash
cd homework-1/demo
./run.sh
```

Or run manually from the project root:

```bash
npm install
npm start
```

The API will be available at: http://localhost:3000

---

## 2. Test the API Endpoints

### Option A: Використання curl-requests.sh (рекомендовано)

Виконайте всі основні запити автоматично:
```bash
cd homework-1/demo
chmod +x curl-requests.sh
./curl-requests.sh
```

### Option B: Використання curl вручну

Відкрийте новий термінал і використовуйте команди з curl-requests.sh або з README.md.

### Option C: VS Code REST Client
1. Встановіть розширення "REST Client" у VS Code.
2. Відкрийте `demo/sample-requests.http`.
3. Натисніть "Send Request" над потрібним запитом.

### Option D: Verification Checklist (Recommended for Final Check)
Follow the step-by-step instructions in `verification-checklist.md` to verify all requirements manually.

---

## 3. Sample Data

Файл `demo/sample-data.json` містить приклади транзакцій для тестування. API використовує in-memory storage, тому ви можете надсилати ці або подібні транзакції через curl чи REST Client.

---

Для деталей дивіться `README.md`.