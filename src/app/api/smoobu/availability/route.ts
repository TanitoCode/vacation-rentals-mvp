export const dynamic = 'force-dynamic';

import { getProvider } from '@/lib/pms/provider';

const isProd = process.env.NODE_ENV === 'production';
const useMock = (process.env.USE_MOCK ?? '').trim() === '1';

function parseIdsFromEnv(): string[] {
  return (process.env.SMOOBU_APARTMENT_IDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function parseIdsFromQuery(searchParams: URLSearchParams): string[] {
  const raw = searchParams.get('ids') || '';
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const start  = searchParams.get('start')  || '2025-11-01';
  const end    = searchParams.get('end')    || '2025-11-05';
  const guests = Number(searchParams.get('guests') || '2');

  // Nunca mocks en producción
  if (isProd && useMock) {
    return new Response(
      JSON.stringify({ ok:false, error:'Mocks deshabilitados en producción (USE_MOCK=1)' }),
      { status: 500 }
    );
  }

  // DEV mock
  if (useMock) {
    const mockQuotes = [
      { unitId: '2113656', available: true,  total: 250 },
      { unitId: '2254116', available: false, total: 0   },
      { unitId: '2646938', available: true,  total: 150 }
    ];
    const ids = parseIdsFromQuery(searchParams);
    const filtered = ids.length ? mockQuotes.filter(q => ids.includes(q.unitId)) : mockQuotes;
    const quotes = filtered.map(q => ({ apartmentId: q.unitId, available: q.available, total: q.total }));
    return Response.json({ ok: true, mock: true, data: { currency: 'USD', quotes, params: { start, end, guests } } });
  }

  // REAL vía provider
  const pms = getProvider();

  // Prioridad: ids? -> env? -> todas
  let unitIds = parseIdsFromQuery(searchParams);
  if (unitIds.length === 0) unitIds = parseIdsFromEnv();
  if (unitIds.length === 0) {
    const units = await pms.listUnits();
    unitIds = units.map(u => u.id);
  }

  const avail = await pms.availability({ start, end, guests, unitIds });
  const quotes = avail.quotes.map(q => ({
    apartmentId: q.unitId,
    available: q.available,
    total: q.total,
  }));
  return Response.json({ ok: true, mock: false, data: { currency: avail.currency, quotes } });
}
