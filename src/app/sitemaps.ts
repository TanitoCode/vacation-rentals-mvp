import catalog from '@/data/catalog.json';

export default async function sitemap() {
  const base = process.env.SITE_URL || 'http://localhost:3000';

  const props = (catalog as any).properties || [];
  const items = props
    .filter((p: any) => p.active !== false)
    .map((p: any) => ({
      url: `${base}/propiedades/${p.slug || p.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1 },
    ...items,
  ];
}
