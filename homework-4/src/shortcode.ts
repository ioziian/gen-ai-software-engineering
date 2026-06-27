const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Deterministic, stable base62 slug for a numeric id (offset keeps slugs >= 2 chars). */
export function toSlug(id: number): string {
  let n = id + 1000;
  let slug = '';
  while (n > 0) {
    slug = ALPHABET[n % 62] + slug;
    n = Math.floor(n / 62);
  }
  return slug;
}
