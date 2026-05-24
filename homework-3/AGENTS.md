# Agent Guidelines for Fraud Detection Feature

## Tech Stack Assumptions
- All documentation and code must be in English.
- Assume a modern backend stack (e.g., Node.js, Python, or Java) with secure database and messaging systems.
- Use industry-standard libraries for encryption, logging, and notifications.

## Domain Rules
- Never log or expose sensitive cardholder data (PAN, CVV, etc.).
- All monetary values must use Decimal types.
- All actions on flagged transactions must be auditable and immutable.
- All notifications must be privacy-preserving and not reveal detection logic.
- All artifacts (files, comments, documentation) must be in English.

## Code Style
- Use clear, descriptive names (in English) for all variables, functions, and files.
- Follow project-specific linting and formatting rules.
- Write concise, meaningful comments (in English) explaining non-obvious logic.

## Testing and Verification
- All detection logic must have unit and integration tests.
- Edge cases (false positives, concurrent reviews, system errors) must be covered by tests.
- Verification steps must be documented for each objective and task.

## Security and Compliance
- All data at rest and in transit must be encrypted.
- Audit logs must be immutable and accessible only to authorized roles.
- All code changes must be reviewed for compliance and security impact.

## Edge Case Handling
- Always prefer idempotent operations for detection and logging.
- On error, fail safe: do not process or approve suspicious transactions if system state is uncertain.
- Document and test all known edge cases.

## Language Rule
- All files, comments, and artifacts must be written in English. Communication in chat may be in any language, but all deliverables must be in English.
