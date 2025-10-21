export const dynamic = 'force-dynamic';

import { getProvider } from '@/lib/pms/provider';

const isProd = process.env.NODE_ENV === 'production';
const useMock = (process.env.USE_MOCK ?? '').trim() === '1';

export async function GET() {
  // Nunca servir mock en producción
  if (isProd && useMock) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Mocks deshabilitados en producción (USE_MOCK=1)' }),
      { status: 500 }
    );
  }

  // DEV con mock
  if (useMock) {
    return Response.json({
      ok: true,
      mock: true,
      data: {
        apartments: [
          { id: 2113656, name: 'ALDEA 104 2' },
          { id: 2254116, name: 'ALDEA 111' },
          { id: 2646938, name: 'ALDEA 121' },
        ],
      },
    });
  }

  // REAL vía provider
  const pms = getProvider();
  const units = await pms.listUnits();

  // Mantener el mismo contrato que ya usa tu UI
  const apartments = units.map(u => ({ id: u.id, name: u.name }));
  return Response.json({ ok: true, mock: false, data: { apartments } });
}
