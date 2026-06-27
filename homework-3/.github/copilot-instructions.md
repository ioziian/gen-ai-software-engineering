# Copilot/AI Instructions for Fraud Detection Project

## General Rules
- All files, comments, and documentation must be written in English. Communication in chat may be in any language, but all deliverables must be in English.
- Use clear, descriptive English names for all identifiers.
- Avoid hardcoding sensitive data or credentials.
- Never log or expose sensitive cardholder data (PAN, CVV, etc.).
- Prefer idempotent and auditable operations.
- Follow FinTech and compliance best practices (PCI DSS, GDPR, auditability).
- Write meaningful commit messages in English.

## Naming and Patterns
- Use snake_case or camelCase for variables and functions, as appropriate for the language.
- Use PascalCase for class names.
- Use clear, domain-relevant names for files and folders.

## What to Avoid
- Avoid vague or generic names (e.g., data1, temp, foo).
- Avoid non-English words in code, comments, or documentation.
- Avoid logging or exposing sensitive information.
- Avoid business logic in UI/editor rules files.

## FinTech Defaults
- Always use Decimal for monetary values.
- All audit logs must be immutable and detailed.
- All error messages must be privacy-preserving.
