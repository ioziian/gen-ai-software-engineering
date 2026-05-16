import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('Ticket API', () => {
  it('POST /tickets should create a new ticket', async () => {
    const response = await request(app)
      .post('/tickets')
      .send({
        subject: 'Test Subject',
        description: 'Test Description',
        customer_email: 'test@example.com'
      });
    expect(response.status).toBe(201);
    expect(response.body.subject).toBe('Test Subject');
  });

  it('GET /tickets should return all tickets', async () => {
    const response = await request(app).get('/tickets');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
