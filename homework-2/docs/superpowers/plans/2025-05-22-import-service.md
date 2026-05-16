# Import Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `ImportService` to support CSV, JSON, and XML imports, and expose it via `/import` endpoint.

**Architecture:** Create `ImportService` that depends on `TicketService` for bulk creation. Add `/import` route in `TicketRoutes` that uses `ImportService` based on `Content-Type`.

**Tech Stack:** Node.js, Express, csv-parse, xml2js, TypeScript.

---

### Task 1: Create ImportService

**Files:**
- Create: `homework-2/src/services/importService.ts`

- [ ] **Step 1: Write ImportService**

```typescript
import { parse } from 'csv-parse/sync';
import { Parser } from 'xml2js';
import { TicketService } from './ticketService';

export class ImportService {
  constructor(private ticketService: TicketService) {}

  async importFromJSON(data: any[]) {
    return this.bulkProcess(data);
  }

  async importFromCSV(content: string) {
    const records = parse(content, { columns: true, skip_empty_lines: true });
    return this.bulkProcess(records);
  }

  async importFromXML(content: string) {
    const parser = new Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(content);
    const tickets = result.tickets.ticket;
    return this.bulkProcess(Array.isArray(tickets) ? tickets : [tickets]);
  }

  private async bulkProcess(records: any[]) {
    const summary = { total: records.length, successful: 0, failed: 0, errors: [] as any[] };
    for (const record of records) {
      try {
        await this.ticketService.create(record, true);
        summary.successful++;
      } catch (error: any) {
        summary.failed++;
        summary.errors.push({ record, error: error.message });
      }
    }
    return summary;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add homework-2/src/services/importService.ts
git commit -m "feat: implement import service for CSV/JSON/XML"
```

### Task 2: Update TicketRoutes

**Files:**
- Modify: `homework-2/src/routes/ticketRoutes.ts`

- [ ] **Step 1: Add import route**

```typescript
import { ImportService } from '../services/importService';
// ... assuming ticketService is already imported
const importService = new ImportService(ticketService);

router.post('/import', async (req, res) => {
  const format = req.headers['content-type'];
  let result;
  try {
    if (format === 'application/json') {
      result = await importService.importFromJSON(req.body);
    } else if (format === 'text/csv') {
      result = await importService.importFromCSV(req.body.toString());
    } else if (format === 'application/xml' || format === 'text/xml') {
      result = await importService.importFromXML(req.body.toString());
    } else {
      return res.status(400).json({ error: 'Unsupported format' });
    }
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add homework-2/src/routes/ticketRoutes.ts
git commit -m "feat: add import endpoint to ticket routes"
```
