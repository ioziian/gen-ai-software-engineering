import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { reset, createLink } from '../../src/store';

const app = createApp();

describe('GET /links/:slug — happy path after BUG-002 fix', () => {
  beforeEach(() => reset());

  it('known slug returns 200 with correct response shape', async () => {
    createLink('https://example.com/known');
    const listRes = await request(app).get('/links?page=1&limit=1');
    const slug = listRes.body.links[0].slug;

    const res = await request(app).get(`/links/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe(slug);
    expect(res.body.url).toBe('https://example.com/known');
    expect(res.body.clicks).toBe(0);
    expect(typeof res.body.createdAt).toBe('string');
  });
});

describe('POST /links — scheme validation after SEC-001 fix', () => {
  beforeEach(() => reset());

  it('rejects data: scheme with 400', async () => {
    const res = await request(app)
      .post('/links')
      .send({ url: 'data:text/html,<script>alert(1)</script>' });
    expect(res.status).toBe(400);
  });

  it('rejects file: scheme with 400', async () => {
    const res = await request(app).post('/links').send({ url: 'file:///etc/passwd' });
    expect(res.status).toBe(400);
  });

  it('rejects malformed URL with 400', async () => {
    const res = await request(app).post('/links').send({ url: 'not-a-url' });
    expect(res.status).toBe(400);
  });

  it('accepts http: scheme with 201', async () => {
    const res = await request(app).post('/links').send({ url: 'http://example.com' });
    expect(res.status).toBe(201);
    expect(res.body.slug).toBeTruthy();
  });
});
