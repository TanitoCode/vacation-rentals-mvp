export const dynamic = 'force-dynamic';

const BASE = 'https://login.smoobu.com';

export async function GET() {
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
