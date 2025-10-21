export const dynamic = 'force-dynamic';

import { readFile } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const file = path.join(process.cwd(), 'src', 'data', 'catalog.json');
    const raw = await readFile(file, 'utf-8');
    const properties = JSON.parse(raw);
    return Response.json({ ok: true, data: { properties } });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err?.message || 'read error' }), { status: 500 });
  }
}
