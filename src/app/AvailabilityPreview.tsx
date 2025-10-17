'use client';

import { useEffect, useState } from 'react';


type Quote = { apartmentId: string; available: boolean; total: number };
type ApiResp = { ok: boolean; mock?: boolean; data?: { currency?: string; quotes?: Quote[] } };

function fmt(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function nightsBetween(start: string, end: string) {
  // Smoobu usa arrival/departure → noches = días entre las fechas
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const diffDays = Math.round((e.getTime() - s.getTime()) / 86_400_000);
  return Math.max(1, diffDays || 0);
}

function buildBookingUrl(base: string, apartmentId: string, start: string, end: string) {
  const u = new URL(base);                 // p.ej. https://booking.smoobu.com/ARVACATIONS
  u.searchParams.set('apartmentId', apartmentId);
  // Best-effort: muchas instancias lo ignoran, pero no rompe nada.
  u.searchParams.set('arrival', start);    // YYYY-MM-DD
  u.searchParams.set('departure', end);    // YYYY-MM-DD
  // Si quisieras probar alternativas sin romper nada:
  // u.searchParams.set('checkin', start);
  // u.searchParams.set('checkout', end);
  // u.searchParams.set('adults', String(guests)); // si tuviéramos guests
  return u.toString();
}

export default function AvailabilityPreview({ bookingBase }: { bookingBase: string }) {
  const [start, setStart] = useState('2025-11-01');
  const [end, setEnd] = useState('2025-11-05');
  const [guests, setGuests] = useState(2);
  const [loading, setLoading] = useState(false);
  const [isMock, setIsMock] = useState<boolean | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currency, setCurrency] = useState('USD');

  // nombres reales (desde nuestro endpoint /api/smoobu/apartments)
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/smoobu/apartments', { cache: 'no-store' });
        const j = await r.json();
        const map: Record<string, string> = {};
        (j?.data?.apartments || []).forEach((a: any) => (map[String(a.id)] = a.name));
        setNames(map);
      } catch { }
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const r = await fetch(`/api/smoobu/availability?start=${start}&end=${end}&guests=${guests}`);
      const j: ApiResp = await r.json();
      setIsMock(j.mock);
      setQuotes(j.data?.quotes || []);
      if (j.data?.currency) setCurrency(j.data.currency);
    } catch (err: any) {
      setError(err?.message ?? 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  // listas derivadas
  const available = quotes.filter(q => q.available);
  const availableSorted = available.slice().sort(
    (a, b) => (a.total - b.total) || a.apartmentId.localeCompare(b.apartmentId)
  );

  const nights = nightsBetween(start, end);

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">Disponibilidad (por rango) — preview</h2>

      <form onSubmit={onSubmit} className="mt-4 grid max-w-md gap-3">
        <label className="grid gap-1">
          <span className="text-sm text-slate-600">Desde</span>
          <input type="date" value={start} onChange={e => setStart(e.target.value)} className="rounded border px-3 py-2" required />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-slate-600">Hasta</span>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="rounded border px-3 py-2" required />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-slate-600">Huéspedes</span>
          <input type="number" min={1} value={guests} onChange={e => setGuests(parseInt(e.target.value || '1', 10))} className="rounded border px-3 py-2" />
        </label>
        <button type="submit" disabled={loading} className="mt-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60">
          {loading ? 'Buscando…' : 'Buscar disponibilidad'}
        </button>
      </form>

      {typeof isMock !== 'undefined' && (
        <p className="mt-2 text-sm text-slate-500">
          Modo datos: <strong>{isMock ? 'MOCK (sin API Key)' : 'REAL (API Smoobu)'}</strong>
        </p>
      )}

      {error && <p className="mt-3 text-red-600">{error}</p>}

      {quotes.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Disponibles ({available.length})</h3>
        
         <ul className="space-y-2">
  {availableSorted.map((q) => {



    return (
      <li key={q.apartmentId} className="rounded border p-3">
        <div className="font-semibold">{names[q.apartmentId] ?? `Propiedad ${q.apartmentId}`}</div>
        <div className="text-sm text-slate-600">ID: {q.apartmentId}</div>

        <div className="mt-1">Total: <strong>{fmt(q.total, currency)}</strong></div>
        <div className="text-sm text-slate-600">
          Estadía: {nights} {nights === 1 ? 'noche' : 'noches'}
        </div>
        <div className="mt-1">Promedio/noche: <strong>{fmt(q.total / nights, currency)}</strong></div>

        <a
          href={buildBookingUrl(bookingBase, q.apartmentId, start, end)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
        >
          Reservar en Smoobu
        </a>
      </li>
    );
  })}
</ul>
        </div>
      )}
    </section>
  );
}
