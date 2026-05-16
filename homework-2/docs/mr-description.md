# 🚀 Merge Request: Intelligent Customer Support System (Homework 2)

> **Student Name**: Ihor Oziian
> **Date Submitted**: 2026-05-16
> **AI Tools Used**: Gemini CLI

## 📋 Summary
Implementation of the Customer Support Ticket Management System. This project provides a robust REST API for ticket lifecycle management, including bulk multi-format imports and an AI-driven classification engine.

## 🎯 Learning Objectives Coverage
- [x] Application of **Context-Model-Prompt** framework in practice.
- [x] Comprehensive test suite generation (>70% coverage baseline).
- [x] Multi-level documentation implementation.

## 🛠️ Changes Implemented
- **Task 1 (Setup):** Project initialized with TypeScript/Express, strictly following named exports.
- **Task 2 (Model/Store):** Ticket domain model and in-memory repository implemented.
- **Task 3 (Auto-Classification):** Mock LLM service using keyword-based logic for priority/category.
- **Task 4 (API/Service):** Service-Repository pattern applied for core CRUD logic.
- **Task 5 (Import Service):** Bulk processing for JSON, CSV, and XML with partial error reporting.
- **Task 6 (Validation):** Middleware for request data integrity.
- **Task 7 (Testing):** Test coverage achieved across API, Integration, and Performance scenarios.

## 🏗️ Implementation Methodology
This project was developed using a **Subagent-Driven Development** strategy to ensure architectural rigour:
*   **Architectural Design:** Service-Repository pattern implemented to ensure modularity.
*   **Strict Standards:** Adherence to named-export conventions and repository mandates enforced by peer-reviewer subagents.
*   **Mock AI Strategy:** Deterministic keyword analysis used for the "Mock LLM" to ensure predictable testing and logic assessment.
*   **Isolation:** All development tasks were executed as independent subagent delegations with spec compliance and quality review loops.

## 🧱 Architecture Diagram (Schematic)
```text
[Client] 
    |
    v
[Express API (Validation Middleware)]
    |
    v
[TicketService (Orchestrator)]
    |--------------------------|
    v                          v
[TicketStore (Repo)]    [ClassificationService (Mock LLM)]
```

## 📊 Documentation
Documentation is available in `/docs/`:
- **Architecture:** `ARCHITECTURE.md` (Design decisions & data flow).
- **API Reference:** `API_REFERENCE.md` (Endpoints & cURL examples).
- **Testing Guide:** `TESTING_GUIDE.md` (Pyramid & execution instructions).

## 🧪 Verification & Testing
### 1. Test Coverage
Run `npm run test:coverage` to generate the report.
```text
% Coverage report from v8
---------------------------|---------|----------|---------|---------
All files                  |   71.91 |    61.29 |      50 |   71.91 
---------------------------|---------|----------|---------|---------
```

### 2. Manual Verification
To verify the system, execute the following commands:

* **Health Check:**
  `curl http://localhost:3000/health`
  *Response:* `{"status":"OK"}`

* **Create Ticket:**
  `curl -X POST http://localhost:3000/tickets -H "Content-Type: application/json" -d '{"customer_email":"user@test.com", "subject":"Access", "description":"Can not login"}'`
  *Response:* `{"id":"<UUID>", ...}`

* **Auto-Classify:**
  `curl -X POST http://localhost:3000/tickets/<UUID>/auto-classify`
  *Response:* `{"category":"account_access", "priority":"medium", "reasoning":"...", ...}`

* **Bulk Import:**
  `curl -X POST http://localhost:3000/tickets/import -H "Content-Type: application/json" -d '[{"customer_email":"a@b.com", "subject":"S", "description":"D"}]'`
  *Response:* `{"total":1, "successful":1, "failed":0}`

## 📸 Documentation Evidence
*The following logs confirm the system is operational:*
1. **Coverage Report:** `docs/screenshots/coverage_output.txt`
2. **Bulk Import Response:** `docs/screenshots/import_response.json`
3. **Classification Logic:** `docs/screenshots/classify_response.json`

---
*Created with Gemini CLI.*
