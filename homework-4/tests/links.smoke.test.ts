import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { reset } from '../src/store';

const app = createApp();

describe('smoke — happy path (stays green)', () => {
  beforeEach(() => reset());

  it('creates a link and returns 201 with a slug', async () => {
    const res = await request(app).post('/links').send({ url: 'https://example.com' });
    expect(res.status).toBe(201);
    expect(res.body.slug).toBeTruthy();
  });

  it('GET /links returns a pagination envelope', async () => {
    const res = await request(app).get('/links');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('pagination');
  });
});
