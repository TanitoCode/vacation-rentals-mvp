export const dynamic = 'force-dynamic';

const BASE = 'https://login.smoobu.com';
const CUSTOMER_ID = (process.env.SMOOBU_CUSTOMER_ID || '').trim();

const isProd = process.env.NODE_ENV === 'production';
const useMock = process.env.USE_MOCK === '1'; // <-- control explícito

let cachedIds: string[] | null = null;

async function resolveApartmentIds(BASE: string): Promise<string[]> {
  // 1) Si en .env definís una lista manual (opcional), úsala
  const fromEnv = (process.env.SMOOBU_APARTMENT_IDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  if (fromEnv.length > 0) {
    return (cachedIds = fromEnv);
  }

  // 2) Si ya los obtuvimos, usa el cache
  if (cachedIds && cachedIds.length > 0) return cachedIds;

  // 3) Consultar a Smoobu y tomar TODOS los IDs
  const res = await fetch(`${BASE}/api/apartments`, {
    headers: { 'Api-Key': process.env.SMOOBU_API_KEY! }
  });
  const json = await res.json();

  // Estructuras tolerantes: (a) array directo o (b) {apartments:[...]}
  const list = Array.isArray(json) ? json : (json?.apartments || json?.data?.apartments || []);
  const ids = list.map((a: any) => String(a.id)).filter(Boolean);

  return (cachedIds = ids);
}


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const start  = searchParams.get('start')  || '2025-11-01';
  const end    = searchParams.get('end')    || '2025-11-05';
  const guests = Number(searchParams.get('guests') || '2');

  // 1) Nunca mocks en producción
  if (isProd && useMock) {
    return new Response(
      JSON.stringify({ ok:false, error:'Mocks deshabilitados en producción (USE_MOCK=1)' }),
      { status: 500 }
    );
  }

  // 2) Dev con mocks (si USE_MOCK=1)
  if (useMock) {
    return Response.json({
      ok: true,
      mock: true,
      data: {
        currency: 'USD',
        quotes: [
          { apartmentId: '2113656', available: true,  total: 250 },
          { apartmentId: '2254116', available: false, total: 0   },
          { apartmentId: '2646938', available: true,  total: 150 }
        ],
        params: { start, end, guests }
      }
    });
  }

  // 3) Real (USE_MOCK=0) — requiere API key y customerId
  if (!process.env.SMOOBU_API_KEY) {
    return new Response(
      JSON.stringify({ ok:false, error:'SMOOBU_API_KEY missing' }),
      { status: 500 }
    );
  }
  if (!CUSTOMER_ID) {
    return new Response(
      JSON.stringify({ ok:false, error:'SMOOBU_CUSTOMER_ID missing' }),
      { status: 500 }
    );
  }

  const ids = await resolveApartmentIds(BASE);

  const body = {
    arrivalDate: start,
    departureDate: end,
    apartments: ids,
    adults: guests,
    children: 0,
    customerId: CUSTOMER_ID
  };

  const res = await fetch(`${BASE}/booking/checkApartmentAvailability`, {
    method: 'POST',
    headers: {
      'Api-Key': process.env.SMOOBU_API_KEY!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const txt = await res.text();
    return new Response(JSON.stringify({ ok:false, status:res.status, body:txt }), { status: res.status });
  }

  // Normalización a { currency, quotes[] }
  const raw = await res.json() as any;
  const availableIds = new Set((raw?.availableApartments || []).map((x: any) => String(x)));
  let currency = 'USD';

  const quotes = Object.entries(raw?.prices || {}).map(([id, info]: any) => {
    if (info?.priceElements?.[0]?.currencyCode) {
      currency = info.priceElements[0].currencyCode;
    }
    const total = typeof info?.price === 'number' ? info.price : 0;
    return {
      apartmentId: String(id),
      available: availableIds.has(String(id)),
      total: Math.round(total * 100) / 100
    };
  });

  return Response.json({ ok:true, mock:false, data:{ currency, quotes } });
}
