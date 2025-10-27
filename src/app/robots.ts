export default function robots() {
  const base = process.env.SITE_URL || 'http://localhost:3000';
  return {
    rules: [
      { userAgent: '*', allow: '/' },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
