export const dynamic = 'force-dynamic';

const BASE = 'https://login.smoobu.com';
const isProd = process.env.NODE_ENV === 'production';
const useMock = process.env.USE_MOCK === '1' || !process.env.SMOOBU_API_KEY;


export async function GET() {
  // Nunca servir mocks en producción:
if (isProd && useMock) {
  return new Response(
    JSON.stringify({ ok: false, error: 'Server misconfigured: mocks disabled in production (missing SMOOBU_API_KEY or USE_MOCK=1)' }),
    { status: 500 }
  );
}

// Dev con mocks
if (useMock) {
  if (!process.env.SMOOBU_API_KEY) {
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
}

 

  const res = await fetch(`${BASE}/api/apartments`, {
    headers: { 'Api-Key': process.env.SMOOBU_API_KEY! },
  });
  if (!res.ok) {
    const txt = await res.text();
    return new Response(JSON.stringify({ ok: false, status: res.status, body: txt }), { status: res.status });
  }
  const data = await res.json();
  return Response.json({ ok: true, data });
}
