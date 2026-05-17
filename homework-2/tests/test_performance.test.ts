import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { ticketRepository } from '../src/repositories/ticketRepository';
import { TicketService } from '../src/services/ticketService';
import { ClassificationService } from '../src/services/classificationService';

describe('Performance Tests', () => {
  beforeEach(() => ticketRepository.clear());

  const validTicket = {
    customer_id: 'U001',
    customer_email: 'user@example.com',
    customer_name: 'Test User',
    subject: 'Test ticket subject',
    description: 'This is a detailed description of the test ticket that meets the minimum length',
  };

  it('creates 100 tickets sequentially in under 500 ms', async () => {
    const service = new TicketService(new ClassificationService());
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      await service.createTicket({ ...validTicket, customer_id: `CUST${i}` });
    }
    const elapsed = Date.now() - start;
    console.log(`100 sequential creates: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(500);
  });

  it('GET /tickets with 500 tickets in store responds in under 100 ms', async () => {
    for (let i = 0; i < 500; i++) {
      ticketRepository.create({ ...validTicket, customer_id: `CUST${i}` } as any);
    }
    const start = Date.now();
    const res = await request(app).get('/tickets');
    const elapsed = Date.now() - start;
    console.log(`GET /tickets (500 tickets): ${elapsed}ms`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(500);
    expect(elapsed).toBeLessThan(100);
  });

  it('20 concurrent POSTs all return 201 with no failures', async () => {
    const promises = Array.from({ length: 20 }, (_, i) =>
      request(app).post('/tickets').send({ ...validTicket, customer_id: `CUST${i}` })
    );
    const start = Date.now();
    const results = await Promise.all(promises);
    const elapsed = Date.now() - start;
    console.log(`20 concurrent POSTs: ${elapsed}ms`);
    results.forEach(res => expect(res.status).toBe(201));
  });

  it('bulk import of 50-row CSV completes in under 1000 ms', async () => {
    const headers = 'customer_id,customer_email,customer_name,subject,description';
    const rows = Array.from({ length: 50 }, (_, i) =>
      'CUST' + (i + 1) + ',user' + (i + 1) + '@example.com,User ' + (i + 1) + ',Login issue ' + (i + 1) + ',Cannot access my account after the password reset attempt'
    );
    const csvContent = headers + '\n' + rows.join('\n');

    const start = Date.now();
    const res = await request(app)
      .post('/tickets/import')
      .set('Content-Type', 'text/csv')
      .send(csvContent);
    const elapsed = Date.now() - start;
    console.log(`Bulk import 50-row CSV: ${elapsed}ms`);
    expect(res.status).toBe(207);
    expect(res.body.successful).toBe(50);
    expect(elapsed).toBeLessThan(1000);
  });
});