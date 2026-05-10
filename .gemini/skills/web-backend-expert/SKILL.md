---
name: web-backend-expert
description: Expert guidance for JS/TS, Node.js, and Express.js development. Use this when creating routes, middleware, controllers, or service layers in a web backend.
---

# Web Backend Expert (Node.js/Express)

## Overview

This skill provides idiomatic patterns and best practices for building scalable and maintainable backends using the Node.js ecosystem. It focuses on clean architecture, robust error handling, and type safety.

## Architectural Patterns

### 1. Layered Architecture
- **Routes:** Entry points, handle HTTP-specific logic (params, body parsing).
- **Controllers:** Orchestrate the flow between the request and the service layer.
- **Services:** Contain the core business logic. Keep them decoupled from HTTP.
- **Models/DataAccess:** Interface with the data source (in-memory, DB).

### 2. Error Handling
- Use a centralized error-handling middleware.
- Prefer custom Error classes (e.g., `AppError`, `ValidationError`).
- Always use `async/await` with `try/catch` or an async wrapper for Express routes.

## Development Standards

- **ES Modules vs CommonJS:** Adhere to the project's existing module system.
- **TypeScript:** Prefer interfaces over types for public APIs. Use strict null checks.
- **Validation:** Use a validation layer (e.g., Joi, Zod, or custom validators as seen in `src/validators`) for all incoming request data.
- **Environment:** Never hardcode configuration; use environment variables.

## Resources

### references/
- `express-patterns.md`: Code templates for routes, middleware, and error handlers.
- `ts-node-best-practices.md`: Optimization tips for Node.js and TypeScript.
- `api-design.md`: RESTful API design principles (status codes, resource naming).

### scripts/
- `scaffold-module.cjs`: A utility to quickly generate a new folder structure for a feature (route, controller, validator).
