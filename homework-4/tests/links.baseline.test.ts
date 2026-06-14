import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { reset, createLink } from '../src/store';

const app = createApp();

describe('baseline — seeded defects (fail pre-fix, pass post-fix)', () => {
  beforeEach(() => {
    reset();
    for (let i = 0; i < 12; i++) createLink(`https://example.com/page/${i}`);
  });

  it('BUG-001: GET /links?page=1 returns the FIRST page', async () => {
    const res = await request(app).get('/links?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.links).toHaveLength(10);
    expect(res.body.links[0].url).toBe('https://example.com/page/0');
  });

  it('BUG-002: GET /links/:slug for an unknown slug returns 404, not 500', async () => {
    const res = await request(app).get('/links/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('SEC-001: POST /links rejects a javascript: scheme with 400', async () => {
    const res = await request(app).post('/links').send({ url: 'javascript:alert(document.cookie)' });
    expect(res.status).toBe(400);
  });
});
