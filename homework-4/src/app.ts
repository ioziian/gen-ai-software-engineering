import express, { type Express } from 'express';
import * as store from './store';

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  // Create a short link.
  // SEC-001 (security): the submitted `url` is stored with NO scheme validation, so
  // `javascript:`, `data:`, and `file:` URLs are accepted and later served by the
  // redirect endpoint (dangerous-scheme injection — CWE-20 improper input validation,
  // enabling CWE-79 stored XSS when a short link is opened in a browser).
  app.post('/links', (req, res) => {
    const { url } = req.body ?? {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url is required' });
    }
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({ error: 'invalid url' });
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return res.status(400).json({ error: 'url must use http or https' });
    }
    const link = store.createLink(url);
    res.status(201).json({
      id: link.id,
      slug: link.slug,
      url: link.url,
      shortUrl: `${req.protocol}://${req.get('host')}/r/${link.slug}`,
    });
  });

  // List links with pagination (delegates to store.listLinks — BUG-001 lives there).
  app.get('/links', (req, res) => {
    const page = Number.parseInt(String(req.query.page ?? '1'), 10) || 1;
    const limit = Number.parseInt(String(req.query.limit ?? '10'), 10) || 10;
    const { links, total } = store.listLinks(page, limit);
    res.json({ links, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  });

  // Metadata for one slug.
  // BUG-002 (logic): the `!` non-null assertion wrongly assumes the slug always exists.
  // For an unknown slug `link` is undefined at runtime, so reading `link.slug` throws and
  // Express returns HTTP 500 instead of a clean 404. (Type-checks; fails only at runtime.)
  app.get('/links/:slug', (req, res) => {
    const link = store.getBySlug(req.params.slug);
    if (!link) return res.status(404).json({ error: 'not found' });
    res.json({
      slug: link.slug,
      url: link.url,
      clicks: link.clicks,
      createdAt: link.createdAt,
    });
  });

  // Redirect + count click (correct — included to make the security issue observable).
  app.get('/r/:slug', (req, res) => {
    const link = store.recordClick(req.params.slug);
    if (!link) return res.status(404).json({ error: 'not found' });
    res.redirect(302, link.url);
  });

  return app;
}
