import type { MetadataRoute } from 'next';
import { readFile } from 'fs/promises';
import path from 'path';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE = process.env.SITE_URL || 'http://localhost:3000';

  let properties: Array<{ id: string; slug?: string; active?: boolean }> = [];
  try {
    const file = path.join(process.cwd(), 'src', 'data', 'catalog.json');
    const raw = await readFile(file, 'utf-8');
    const json = JSON.parse(raw);
    properties = json?.properties || [];
  } catch {
    // si falla la lectura, igualmente devolvemos la home
  }

  const now = new Date();

  return [
    { url: `${SITE}/`, lastModified: now },
    ...properties
      .filter((p) => p.active !== false)
      .map((p) => ({
        url: `${SITE}/propiedades/${p.slug || p.id}`,
        lastModified: now,
      })),
  ];
}
