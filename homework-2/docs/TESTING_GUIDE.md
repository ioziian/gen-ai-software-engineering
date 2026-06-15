# Testing Guide

## Strategy
We follow a testing pyramid approach, emphasizing fast, isolated tests, with integration tests to ensure component interaction.

## Test Types
- **Unit Tests:** Test individual components (Services, Parsers, Validators) in isolation using mocks where necessary.
- **Integration Tests:** Test interactions between layers (API routes + Services + Store) using `supertest`.
- **Performance Tests:** Verify processing times for bulk imports and high-load scenarios.

## Execution
Run the full suite using:
```bash
npm test
```
To generate a coverage report:
```bash
npm run test:coverage
```

## Conventions
- **Framework:** Vitest.
- **Isolation:** Each test file clears the repository in `beforeEach`.
- **Fixtures:** Located in `tests/fixtures/`, using randomized, unique IDs (e.g., `U001` format) for privacy and test stability.
- **Assertions:** Use `expect` from Vitest/Supertest.
