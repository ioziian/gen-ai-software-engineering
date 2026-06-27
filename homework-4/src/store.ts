import { toSlug } from './shortcode';

export interface Link {
  id: number;
  slug: string;
  url: string;
  clicks: number;
  createdAt: string;
}

export interface ListResult {
  links: Link[];
  total: number;
}

let links: Link[] = [];
let nextId = 1;

export function createLink(url: string): Link {
  const id = nextId++;
  const link: Link = { id, slug: toSlug(id), url, clicks: 0, createdAt: new Date().toISOString() };
  links.push(link);
  return link;
}

export function getBySlug(slug: string): Link | undefined {
  return links.find((l) => l.slug === slug);
}

export function recordClick(slug: string): Link | undefined {
  const link = links.find((l) => l.slug === slug);
  if (link) link.clicks++;
  return link;
}

// BUG-001 (logic): `page` is 1-based, so offset must be (page - 1) * limit.
// Using `page * limit` skips the entire first page; page=1 never returns the first items.
export function listLinks(page: number, limit: number): ListResult {
  const offset = (page - 1) * limit;
  return { links: links.slice(offset, offset + limit), total: links.length };
}

/** Test/seed helpers. */
export function reset(): void {
  links = [];
  nextId = 1;
}

export function seed(): void {
  reset();
  for (let i = 0; i < 12; i++) createLink(`https://example.com/page/${i}`);
}
