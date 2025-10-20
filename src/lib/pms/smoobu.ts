import { PMSProvider, Unit, Availability } from './types';

type Cfg = { apiKey: string; baseUrl: string; customerId: string; bookingBase: string };

export class SmoobuProvider implements PMSProvider {
  constructor(private cfg: Cfg) {}

  bookingLink(unitId: string, params?: { start?: string; end?: string; guests?: number }) {
    const u = new URL(this.cfg.bookingBase);
    u.searchParams.set('apartmentId', unitId);
    if (params?.start) u.searchParams.set('arrival', params.start);
    if (params?.end)   u.searchParams.set('departure', params.end);
    // si alguna vez soporta huéspedes, se agrega aquí
    return u.toString();
  }

  async listUnits(): Promise<Unit[]> {
    const r = await fetch(`${this.cfg.baseUrl}/api/apartments`, {
      headers: { 'Api-Key': this.cfg.apiKey }
    });
    const j = await r.json();
    const arr = Array.isArray(j) ? j : (j?.apartments || j?.data?.apartments || []);
    return arr.map((a: any) => ({ id: String(a.id), name: a.name }));
  }

  async availability(p: { start: string; end: string; guests: number; unitIds: string[] }): Promise<Availability> {
    const body = {
      arrivalDate: p.start,
      departureDate: p.end,
      apartments: p.unitIds,
      adults: p.guests,
      children: 0,
      customerId: this.cfg.customerId,
    };

    const r = await fetch(`${this.cfg.baseUrl}/booking/checkApartmentAvailability`, {
      method: 'POST',
      headers: { 'Api-Key': this.cfg.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!r.ok) throw new Error(`Smoobu ${r.status}`);

    const raw = await r.json();
    const available = new Set((raw?.availableApartments || []).map((x: any) => String(x)));
    let currency = 'USD';

    const quotes = Object.entries(raw?.prices || {}).map(([id, info]: any) => {
      if (info?.priceElements?.[0]?.currencyCode) currency = info.priceElements[0].currencyCode;
      const total = typeof info?.price === 'number' ? info.price : 0;
      return { unitId: String(id), available: available.has(String(id)), total: Math.round(total * 100) / 100 };
    });

    return { currency, quotes };
  }
}
