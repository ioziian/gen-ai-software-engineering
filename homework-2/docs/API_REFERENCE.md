# API Reference

## Endpoints

- `POST /tickets`: Create ticket
- `POST /tickets/import`: Bulk import
- `GET /tickets`: List tickets
- `GET /tickets/:id`: Get by ID
- `PUT /tickets/:id`: Update
- `DELETE /tickets/:id`: Delete

## Examples
```bash
curl -X POST http://localhost:3000/tickets -H "Content-Type: application/json" -d '{"customer_email":"test@example.com", "subject":"Issue", "description":"Detailed description of issue"}'
```
