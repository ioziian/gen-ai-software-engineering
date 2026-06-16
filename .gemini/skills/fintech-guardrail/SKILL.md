---
name: fintech-guardrail
description: Enforce FinTech standards (ISO 4217, ISO 8601) and banking validation rules. Use this when implementing or reviewing transaction logic, account validation, or money handling.
---

# FinTech Guardrail

## Overview

This skill provides the domain expertise required for building reliable financial software. It ensures consistency across transaction models, currency handling, and account validation.

## Standards & Constraints

### 1. Money Handling
- **Rule:** NEVER use floating-point numbers for currency calculations if precision is critical.
- **Action:** Use integer arithmetic (e.g., cents) or ensure 2-decimal rounding on every operation.
- **Precision:** Maximum 2 decimal places for storage and display.

### 2. Data Formats
- **Currency:** Must follow **ISO 4217** (e.g., USD, EUR, GBP).
- **Date/Time:** All timestamps must be in **ISO 8601** UTC format.
- **Account Numbers:** Follow the pattern `ACC-XXXXX` (where X is alphanumeric).

### 3. Validation Logic
- Amounts must always be positive.
- Status must be one of: `pending`, `completed`, `failed`.
- Type must be one of: `deposit`, `withdrawal`, `transfer`.

## Resources

### references/
- `standards.md`: Quick reference for ISO 4217 and ISO 8601.
- `validation-cases.md`: Common edge cases for banking transactions (e.g., overdrafts, duplicate IDs).
