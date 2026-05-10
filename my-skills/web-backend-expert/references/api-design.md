# API Design Principles

## RESTful Routing
- Use nouns, not verbs: `/transactions`, not `/getTransactions`.
- Use plural: `/accounts`, not `/account`.
- Nesting: `/accounts/:id/transactions`.

## HTTP Status Codes
- **200 OK**: Successful GET/PUT.
- **201 Created**: Successful POST.
- **204 No Content**: Successful DELETE.
- **400 Bad Request**: Validation or client error.
- **401 Unauthorized**: Missing authentication.
- **403 Forbidden**: Authenticated but no permission.
- **404 Not Found**: Resource doesn't exist.
- **500 Internal Server Error**: Unexpected server-side failure.
