# API Reference

## Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/tickets` | Create a new ticket (options: `?auto_classify=true`) |
| `POST` | `/tickets/import` | Bulk import tickets (CSV/JSON/XML) |
| `GET` | `/tickets` | List tickets (supports filters: `status`, `priority`, `category`, `customer_id`) |
| `GET` | `/tickets/:id` | Get ticket by ID |
| `PUT` | `/tickets/:id` | Update ticket details |
| `DELETE` | `/tickets/:id` | Delete ticket |
| `POST` | `/tickets/:id/auto-classify`| Auto-classify existing ticket |

## Data Formats
- **JSON:** Supported for all endpoints.
- **CSV:** Supported via `/tickets/import` (requires `Content-Type: text/csv`).
- **XML:** Supported via `/tickets/import` (requires `Content-Type: application/xml`).

## Important Notes
- **CSV Import:** Ensure `text/csv` is set as `Content-Type`. The application uses `express.text` middleware for raw body parsing.
- **Auto-classification:** Keyword-based classification is available for new tickets or existing ticket IDs.
