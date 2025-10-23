export const dynamic = 'force-dynamic';
import catalog from '@/data/catalog.json';

export async function GET() {
  return Response.json({ ok: true, data: { properties: catalog.properties } });
}

