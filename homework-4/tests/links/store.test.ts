import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { reset, createLink } from '../../src/store';

const app = createApp();

describe('listLinks — pagination after BUG-001 fix', () => {
  beforeEach(() => {
    reset();
    for (let i = 0; i < 12; i++) createLink(`https://example.com/page/${i}`);
  });

  it('page 2 returns the remaining 2 links (partial last page)', async () => {
    const res = await request(app).get('/links?page=2&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.links).toHaveLength(2);
    expect(res.body.links[0].url).toBe('https://example.com/page/10');
  });

  it('pagination envelope reports correct totalPages for 12 items / limit 10', async () => {
    const res = await request(app).get('/links?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(12);
    expect(res.body.pagination.totalPages).toBe(2);
    expect(res.body.pagination.page).toBe(1);
  });
});

describe('listLinks — empty store edge case', () => {
  beforeEach(() => reset());

  it('empty store: page 1 returns empty array with total 0', async () => {
    const res = await request(app).get('/links?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.links).toHaveLength(0);
    expect(res.body.pagination.total).toBe(0);
  });
});
