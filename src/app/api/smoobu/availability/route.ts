export const dynamic = 'force-dynamic';

const BASE = 'https://login.smoobu.com';
const IDS = ['2113656', '2254116', '2646938']; // usa tus IDs reales
const CUSTOMER_ID = (process.env.SMOOBU_CUSTOMER_ID || '').trim();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const start  = searchParams.get('start')  || '2025-11-01';
  const end    = searchParams.get('end')    || '2025-11-05';
  const guests = Number(searchParams.get('guests') || '2');

  // MOCK si no hay key (para dev)
  if (!process.env.SMOOBU_API_KEY) {
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

  if (!CUSTOMER_ID) {
    return new Response(JSON.stringify({ ok:false, status:400, body:'SMOOBU_CUSTOMER_ID is missing' }), { status: 400 });
  }

  // Llamada REAL
  const body = {
    arrivalDate: start,
    departureDate: end,
    apartments: IDS,
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

  // Normalización al formato de nuestro front
  const raw = await res.json() as any;
  const availableIds = new Set((raw?.availableApartments || []).map((x: any) => String(x)));
  let currency = 'USD';

  const quotes = Object.entries(raw?.prices || {}).map(([id, info]: any) => {
    // currency: intenta sacar currencyCode de priceElements; si no, toma el símbolo o deja USD
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

  return Response.json({ ok: true, mock: false, data: { currency, quotes } });
}
