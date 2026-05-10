# Banking Validation Edge Cases

## Transactions
- **Negative Amount**: Must be rejected with 400 Bad Request.
- **Zero Amount**: Usually rejected or handled as a special case.
- **Identical Accounts**: Transferring from and to the same account should be validated (allowed or blocked based on policy).
- **Insufficient Balance**: Check if `fromAccount` has enough funds before completing a `transfer` or `withdrawal`.

## IDs
- **Duplicate Transaction ID**: Ensure the storage logic prevents overwriting existing transactions with the same ID.
