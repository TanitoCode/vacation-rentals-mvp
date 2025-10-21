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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const start  = searchParams.get('start')  || '2025-11-01';
  const end    = searchParams.get('end')    || '2025-11-05';
  const guests = Number(searchParams.get('guests') || '2');

  // Nunca mocks en producción por seguridad
  if (isProd && useMock) {
    return new Response(
      JSON.stringify({ ok:false, error:'Mocks deshabilitados en producción (USE_MOCK=1)' }),
      { status: 500 }
    );
  }

  // DEV con mocks
  if (useMock) {
    return Response.json({
      ok: true,
      mock: true,
      data: {
        currency: 'USD',
        quotes: [
          { unitId: '2113656', available: true,  total: 250 },
          { unitId: '2254116', available: false, total: 0   },
          { unitId: '2646938', available: true,  total: 150 }
        ].map(q => ({ apartmentId: q.unitId, available: q.available, total: q.total })), // compat
        params: { start, end, guests }
      }
    });
  }

  // REAL vía provider
  const pms = getProvider();

  // 1) Si hay lista en ENV, úsala; si no, traemos todas las unidades del PMS
  let unitIds = parseIdsFromEnv();
  if (unitIds.length === 0) {
    const units = await pms.listUnits();
    unitIds = units.map(u => u.id);
  }

  // 2) Consultamos disponibilidad al PMS y devolvemos con el mismo contrato
  const avail = await pms.availability({ start, end, guests, unitIds });
  // `avail.quotes` trae { unitId, available, total }; tu UI espera `apartmentId`
  const quotes = avail.quotes.map(q => ({
    apartmentId: q.unitId,
    available: q.available,
    total: q.total,
  }));

  return Response.json({ ok: true, mock: false, data: { currency: avail.currency, quotes } });
}
