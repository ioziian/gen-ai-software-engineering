# Architecture

## Overview
The application follows a layered architecture to ensure separation of concerns, testability, and maintainability, implemented in TypeScript.

## Diagram
```mermaid
graph TD
    Client --> API[Express API (Routes)]
    API --> Middleware[Middleware (Validation, Error)]
    API --> Service[Ticket Service]
    Service --> Repository[Ticket Repository]
    Repository --> Model[Ticket Model / Store]
    Service --> Parser[Parsers (CSV/JSON/XML)]
    Service --> ClassService[Classification Service]
```

## Layers
1. **Routes (`src/routes/`):** Define API endpoints and handle HTTP request/response mapping.
2. **Middleware (`src/middleware/`):** Handle request validation and global error handling.
3. **Services (`src/services/`):** Contain business logic (ticket creation, import orchestration, classification).
4. **Repositories (`src/repositories/`):** Abstract data access logic (interaction with in-memory store).
5. **Parsers (`src/parsers/`):** Responsible for converting raw input formats (CSV, JSON, XML) into normalized objects.
6. **Validators (`src/validators/`):** Use Joi to enforce data integrity.
