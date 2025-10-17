export const dynamic = 'force-dynamic'; // sin caché en dev

const BASE = 'https://login.smoobu.com';
// Reemplazá por 2–3 IDs reales tuyos (los ves en Avanzado → API Keys → Propiedades)
const IDS = ['2113656', '2254116', '2646938'];
const isProd = process.env.NODE_ENV === 'production';
const useMock = process.env.USE_MOCK === '1' || !process.env.SMOOBU_API_KEY;

export async function GET(request: Request) {

  // Nunca servir mocks en producción:
if (isProd && useMock) {
  return new Response(
    JSON.stringify({ ok: false, error: 'Server misconfigured: mocks disabled in production (missing SMOOBU_API_KEY or USE_MOCK=1)' }),
    { status: 500 }
  );
}

// Dev con mocks
if (useMock) {
  // Si todavía no hay API key, devolvemos MOCK para no frenar
  if (!process.env.SMOOBU_API_KEY) {
    return Response.json({
      ok: true,
      mock: true,
      data: {
        data: {
          '2113656': {
            '2025-11-01': { price: 120, available: 1, min_length_of_stay: 2 },
            '2025-11-02': { price: 130, available: 1, min_length_of_stay: 2 }
          },
          '2254116': {
            '2025-11-01': { price: 95, available: 0, min_length_of_stay: 3 },
            '2025-11-02': { price: 110, available: 1, min_length_of_stay: 3 }
          },
          '2646938': {
            '2025-11-01': { price: 150, available: 1, min_length_of_stay: 2 }
          }
        }
      }
    });
  }
}

  

  // Cuando tengas 2FA y pongas SMOOBU_API_KEY en .env.local, esta parte hará la llamada real:
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start') || '2025-11-01';
  const end   = searchParams.get('end')   || '2025-11-05';

  const url = new URL('/api/rates', BASE);
  IDS.forEach(id => url.searchParams.append('apartments[]', id));
  url.searchParams.set('start_date', start);
  url.searchParams.set('end_date', end);

  const res = await fetch(url.toString(), {
    headers: { 'Api-Key': process.env.SMOOBU_API_KEY! }
  });

  if (!res.ok) {
    const txt = await res.text();
    return new Response(JSON.stringify({ ok:false, status:res.status, body:txt }), { status: res.status });
  }

  const data = await res.json();
  return Response.json({ ok:true, data });
}
