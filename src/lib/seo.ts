// src/lib/seo.ts
export const SITE_ORIGIN =
  process.env.SITE_URL || 'http://localhost:3000';

export const CANONICAL_HOST =
  process.env.CANONICAL_HOST || new URL(SITE_ORIGIN).hostname;

export function canonicalFor(pathname = '/', search = '') {
  const u = new URL(pathname, SITE_ORIGIN);
  if (search) u.search = search;
  return u.toString();
}
