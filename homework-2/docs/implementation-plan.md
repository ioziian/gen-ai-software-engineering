# Intelligent Customer Support System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust support ticket management system with multi-format import, auto-classification, and high test coverage.

**Architecture:** Service-Repository pattern with Express.js and TypeScript. In-memory storage with atomic operations.

**Tech Stack:** Node.js, Express, TypeScript, UUID, Vitest, CSV-parse, XML2JS.

---

### Task 1: Project Initialization

**Files:**
- Create: `homework-2/package.json`
- Create: `homework-2/tsconfig.json`
- Create: `homework-2/src/index.ts`
- Create: `homework-2/src/app.ts`

- [ ] **Step 1: Create package.json**
```json
{
  "name": "homework-2",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "start": "ts-node src/index.ts",
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "express": "^4.18.2",
    "uuid": "^9.0.0",
    "csv-parse": "^5.5.0",
    "xml2js": "^0.6.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "typescript": "^5.1.6",
    "ts-node": "^10.9.1",
    "ts-node-dev": "^2.0.0",
    "@types/express": "^4.17.17",
    "@types/uuid": "^9.0.2",
    "@types/cors": "^2.8.13",
    "@types/xml2js": "^0.4.11",
    "vitest": "^0.34.1",
    "@vitest/coverage-v8": "^0.34.1",
    "supertest": "^6.3.3",
    "@types/supertest": "^2.0.12"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
```

- [ ] **Step 3: Create app.ts and index.ts**
```typescript
// src/app.ts
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'OK' }));

export default app;

// src/index.ts
import app from './app';

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

- [ ] **Step 4: Install dependencies**
Run: `npm install` in `homework-2` directory.

- [ ] **Step 5: Verify setup**
Run: `npm run start` and check `http://localhost:3000/health`.

- [ ] **Step 6: Commit**
`git add package.json tsconfig.json src/app.ts src/index.ts`
`git commit -m "chore: initialize project with TS and Express"`

---

### Task 2: Ticket Model and Store

**Files:**
- Create: `homework-2/src/models/ticket.ts`
- Create: `homework-2/src/models/ticketStore.ts`

- [ ] **Step 1: Define Ticket types and interfaces**
```typescript
// src/models/ticket.ts
export type TicketCategory = 'account_access' | 'technical_issue' | 'billing_question' | 'feature_request' | 'bug_report' | 'other';
export type TicketPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TicketStatus = 'new' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';

export interface Ticket {
  id: string;
  customer_id: string;
  customer_email: string;
  customer_name: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  assigned_to: string | null;
  tags: string[];
  metadata: {
    source: 'web_form' | 'email' | 'api' | 'chat' | 'phone';
    browser?: string;
    device_type?: 'desktop' | 'mobile' | 'tablet';
  };
  classification?: {
    confidence: number;
    reasoning: string;
    keywords: string[];
  };
}
```

- [ ] **Step 2: Implement In-memory TicketStore**
```typescript
// src/models/ticketStore.ts
import { Ticket } from './ticket';

class TicketStore {
  private tickets: Ticket[] = [];

  getAll(): Ticket[] {
    return this.tickets;
  }

  getById(id: string): Ticket | undefined {
    return this.tickets.find(t => t.id === id);
  }

  create(ticket: Ticket): void {
    this.tickets.push(ticket);
  }

  update(id: string, updates: Partial<Ticket>): Ticket | undefined {
    const index = this.tickets.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    this.tickets[index] = { ...this.tickets[index], ...updates, updated_at: new Date().toISOString() };
    return this.tickets[index];
  }

  delete(id: string): boolean {
    const initialLength = this.tickets.length;
    this.tickets = this.tickets.filter(t => t.id !== id);
    return this.tickets.length < initialLength;
  }

  clear(): void {
    this.tickets = [];
  }
}

export const ticketStore = new TicketStore();
```

- [ ] **Step 3: Commit**
`git add src/models/ticket.ts src/models/ticketStore.ts`
`git commit -m "feat: add Ticket model and in-memory storage"`

---

### Task 3: Classification Service (Mock LLM)

**Files:**
- Create: `homework-2/src/services/classificationService.ts`

- [ ] **Step 1: Implement classification logic**
```typescript
// src/services/classificationService.ts
import { TicketCategory, TicketPriority } from '../models/ticket';

export interface ClassificationResult {
  category: TicketCategory;
  priority: TicketPriority;
  confidence: number;
  reasoning: string;
  keywords: string[];
}

export class ClassificationService {
  async classify(subject: string, description: string): Promise<ClassificationResult> {
    const text = (subject + ' ' + description).toLowerCase();
    
    let category: TicketCategory = 'other';
    let priority: TicketPriority = 'medium';
    let keywords: string[] = [];
    let reasoning = 'Classification based on keyword matching.';

    // Priority Rules
    if (text.match(/can't access|critical|production down|security/)) {
      priority = 'urgent';
      keywords.push('critical');
    } else if (text.match(/important|blocking|asap/)) {
      priority = 'high';
      keywords.push('high');
    }

    // Category Rules
    if (text.match(/login|password|2fa|account/)) {
      category = 'account_access';
    } else if (text.match(/error|crash|bug|fail/)) {
      category = 'technical_issue';
    } else if (text.match(/payment|invoice|refund|billing/)) {
      category = 'billing_question';
    }

    return {
      category,
      priority,
      confidence: 0.85,
      reasoning,
      keywords
    };
  }
}
```

- [ ] **Step 2: Commit**
`git add src/services/classificationService.ts`
`git commit -m "feat: implement mock LLM classification service"`

---

### Task 4: Ticket Service and API Routes

**Files:**
- Create: `homework-2/src/services/ticketService.ts`
- Create: `homework-2/src/routes/ticketRoutes.ts`
- Modify: `homework-2/src/app.ts`

- [ ] **Step 1: Implement TicketService**
```typescript
// src/services/ticketService.ts
import { v4 as uuidv4 } from 'uuid';
import { Ticket, TicketStore } from '../models/ticketStore';
import { ClassificationService } from './classificationService';

export class TicketService {
  constructor(
    private store: any,
    private classificationService: ClassificationService
  ) {}

  getAll(filters: any) {
    let tickets = this.store.getAll();
    if (filters.category) tickets = tickets.filter(t => t.category === filters.category);
    if (filters.priority) tickets = tickets.filter(t => t.priority === filters.priority);
    if (filters.status) tickets = tickets.filter(t => t.status === filters.status);
    return tickets;
  }

  getById(id: string) {
    return this.store.getById(id);
  }

  async create(data: any, autoClassify: boolean = false) {
    const existing = this.store.getAll().find(t => t.customer_email === data.customer_email && t.subject === data.subject);
    if (existing) throw new Error('Duplicate ticket found');

    const ticket: any = {
      ...data,
      id: uuidv4(),
      status: data.status || 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      resolved_at: null,
      assigned_to: data.assigned_to || null,
      tags: data.tags || [],
    };

    if (autoClassify) {
      const classification = await this.classificationService.classify(ticket.subject, ticket.description);
      ticket.category = classification.category;
      ticket.priority = classification.priority;
      ticket.classification = {
        confidence: classification.confidence,
        reasoning: classification.reasoning,
        keywords: classification.keywords
      };
    }

    this.store.create(ticket);
    return ticket;
  }

  update(id: string, data: any) {
    return this.store.update(id, data);
  }

  delete(id: string) {
    return this.store.delete(id);
  }

  async autoClassify(id: string) {
    const ticket = this.store.getById(id);
    if (!ticket) return null;

    const classification = await this.classificationService.classify(ticket.subject, ticket.description);
    return this.store.update(id, {
      category: classification.category,
      priority: classification.priority,
      classification: {
        confidence: classification.confidence,
        reasoning: classification.reasoning,
        keywords: classification.keywords
      }
    });
  }
}
```

- [ ] **Step 2: Implement TicketRoutes**
```typescript
// src/routes/ticketRoutes.ts
import { Router } from 'express';
import { TicketService } from '../services/ticketService';
import { ticketStore } from '../models/ticketStore';
import { ClassificationService } from '../services/classificationService';

const router = Router();
const classificationService = new ClassificationService();
const ticketService = new TicketService(ticketStore, classificationService);

router.get('/', (req, res) => {
  const tickets = ticketService.getAll(req.query);
  res.json(tickets);
});

router.post('/', async (req, res) => {
  try {
    const autoClassify = req.query.autoClassify === 'true';
    const ticket = await ticketService.create(req.body, autoClassify);
    res.status(201).json(ticket);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  const ticket = ticketService.getById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

router.put('/:id', (req, res) => {
  const ticket = ticketService.update(req.params.id, req.body);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

router.delete('/:id', (req, res) => {
  const deleted = ticketService.delete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Ticket not found' });
  res.status(204).send();
});

router.post('/:id/auto-classify', async (req, res) => {
  const ticket = await ticketService.autoClassify(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

export default router;
```

- [ ] **Step 3: Register routes in app.ts**
```typescript
// src/app.ts (modified)
import express from 'express';
import cors from 'cors';
import ticketRoutes from './routes/ticketRoutes';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'OK' }));
app.use('/tickets', ticketRoutes);

export default app;
```

- [ ] **Step 4: Commit**
`git add src/services/ticketService.ts src/routes/ticketRoutes.ts src/app.ts`
`git commit -m "feat: implement ticket CRUD service and routes"`

---

### Task 5: Import Service (CSV, JSON, XML)

**Files:**
- Create: `homework-2/src/services/importService.ts`
- Modify: `homework-2/src/routes/ticketRoutes.ts`

- [ ] **Step 1: Implement ImportService**
```typescript
// src/services/importService.ts
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

- [ ] **Step 2: Add import endpoint to TicketRoutes**
```typescript
// src/routes/ticketRoutes.ts (modified)
import { ImportService } from '../services/importService';
// ... inside router setup
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

---

### Task 6: Validation Middleware

**Files:**
- Create: `homework-2/src/middleware/validation.ts`
- Modify: `homework-2/src/routes/ticketRoutes.ts`

- [ ] **Step 1: Implement validation logic**
```typescript
// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';

export const validateTicket = (req: Request, res: Response, next: NextFunction) => {
  const { customer_email, subject, description } = req.body;
  if (!customer_email || !customer_email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (!subject || subject.length > 200) {
    return res.status(400).json({ error: 'Invalid subject' });
  }
  if (!description || description.length < 10 || description.length > 2000) {
    return res.status(400).json({ error: 'Invalid description' });
  }
  next();
};
```

- [ ] **Step 2: Apply middleware to POST/PUT routes**

---

### Task 7: Testing (>85% coverage)

**Files:**
- Create: `homework-2/tests/ticket_api.test.ts`
- Create: `homework-2/tests/import.test.ts`
- Create: `homework-2/tests/classification.test.ts`

- [ ] **Step 1: Write API tests using Supertest**
- [ ] **Step 2: Write Service unit tests**
- [ ] **Step 3: Run coverage report**
Run: `npm run test:coverage`
