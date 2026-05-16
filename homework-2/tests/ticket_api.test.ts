import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { app } from '../src/app';

describe('Ticket API', () => {
  it('should create a ticket', async () => {
    const res = await request(app)
      .post('/tickets')
      .send({ 
        customer_email: 'test@example.com',
        subject: 'Test subject', 
        description: 'Test description content' 
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('should get all tickets', async () => {
    const res = await request(app).get('/tickets');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
