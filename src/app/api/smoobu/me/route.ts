export const dynamic = 'force-dynamic';

const BASE = 'https://login.smoobu.com';

export async function GET() {
  if (!process.env.SMOOBU_API_KEY) {
    return new Response(JSON.stringify({ ok:false, error:'SMOOBU_API_KEY missing' }), { status: 400 });
  }
  const res = await fetch(`${BASE}/api/me`, {
    headers: { 'Api-Key': process.env.SMOOBU_API_KEY! }
  });
  const data = await res.json();
  return Response.json({ ok: true, data });
}
