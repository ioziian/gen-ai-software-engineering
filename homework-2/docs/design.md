# 📝 Design Specification: Intelligent Customer Support System (HW2)

**Date:** 2026-05-16
**Topic:** Homework 2 - Customer Support Ticket System
**Status:** Approved

## 1. Objectives
Build a robust REST API for managing support tickets with bulk import capabilities and automated AI-driven classification.

## 2. Architecture
- **Language:** TypeScript
- **Framework:** Express.js
- **Pattern:** Service-Repository Pattern
- **Storage:** In-memory (Atomic array operations)

### Components:
1. **Routes (`/src/routes`)**: Express router definitions for `/tickets`.
2. **Controllers (`/src/controllers`)**: Request/Response handling.
3. **Services (`/src/services`)**:
   - `TicketService`: Core CRUD and business logic.
   - `ImportService`: Multi-format parsing (CSV, JSON, XML).
   - `ClassificationService`: Mock LLM for auto-categorization.
4. **Repository (`/src/models`)**: `TicketStore` for in-memory persistence.
5. **Middleware**:
   - `ValidationMiddleware`: Request body validation.
   - `ErrorHandler`: Centralized error management.

## 3. Data Model (Ticket)
- `id`: UUID (v4)
- `customer_id`, `customer_email`, `customer_name`
- `subject` (1-200), `description` (10-2000)
- `category` (Enum), `priority` (Enum), `status` (Enum)
- `created_at`, `updated_at`, `resolved_at` (nullable)
- `assigned_to` (nullable), `tags` (string[])
- `metadata`: `{ source, browser, device_type }`
- `classification`: `{ confidence, reasoning, keywords }`

## 4. Key Features & Logic
- **Duplicate Detection:** Prevents creation of tickets with identical `customer_email` and `subject`.
- **Bulk Import:** Supports CSV, JSON, XML. Returns detailed summary. Partial success allowed.
- **Auto-classification:** Triggered on creation (optional). Uses a keyword-based mock LLM service with simulated delay.
- **Priority Rules:**
  - `Urgent`: keywords "can't access", "critical", "production down", "security".
  - `High`: keywords "important", "blocking", "asap".
  - Default: `Medium`.

## 5. Endpoints
- `POST /tickets`: Create single ticket.
- `POST /tickets/import`: Bulk import from file.
- `GET /tickets`: List with filters (`category`, `priority`, `status`).
- `GET /tickets/:id`: Get by ID.
- `PUT /tickets/:id`: Update.
- `DELETE /tickets/:id`: Delete.
- `POST /tickets/:id/auto-classify`: Manually trigger AI classification.

## 6. Testing Strategy
- **Framework:** Vitest or Jest.
- **Coverage Goal:** >85%.
- **Files:** Unit tests for services, Integration tests for API, Performance tests for concurrency.

## 7. Documentation
- README.md (Mermaid diagrams)
- API_REFERENCE.md
- ARCHITECTURE.md
- TESTING_GUIDE.md
