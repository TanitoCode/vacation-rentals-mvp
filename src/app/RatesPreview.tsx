'use client';

import { useState } from 'react';

type ApiResponse = {
  ok: boolean;
  mock?: boolean;
  data: {
    data: {
      [propertyId: string]: {
        [isoDate: string]: {
          price: number;
          available: number; // 1 disponible, 0 no disponible
          min_length_of_stay: number;
        };
      };
    };
  };
};

const PROPERTY_NAMES: Record<string, string> = {
  '2113656': 'ALDEA 104 2',
  '2254116': 'ALDEA 111',
  '2646938': 'ALDEA 121',
};

export default function RatesPreview() {
  const [start, setStart] = useState('2025-11-01');
  const [end, setEnd] = useState('2025-11-05');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<
    { propertyId: string; date: string; price: number; available: number; minLOS: number }[]
  >([]);
  const [isMock, setIsMock] = useState<boolean | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  async function onFetch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/smoobu/rates?start=${start}&end=${end}`);
      const json: ApiResponse = await res.json();
      setIsMock(json.mock);

      const out: { propertyId: string; date: string; price: number; available: number; minLOS: number }[] = [];
      const data = json?.data?.data || {};
      Object.entries(data).forEach(([propertyId, byDate]) => {
        Object.entries(byDate).forEach(([date, v]) => {
          out.push({
            propertyId,
            date,
            price: v.price,
            available: v.available,
            minLOS: v.min_length_of_stay,
          });
        });
      });

      // orden: por propertyId y fecha
      out.sort((a, b) => (a.propertyId === b.propertyId ? a.date.localeCompare(b.date) : a.propertyId.localeCompare(b.propertyId)));
      setRows(out);
    } catch (err: any) {
      setError(err?.message ?? 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">Disponibilidad & tarifas (preview)</h2>

      <form onSubmit={onFetch} className="mt-4 grid max-w-md gap-3">
        <label className="grid gap-1">
          <span className="text-sm text-slate-600">Desde</span>
          <input type="date" value={start} onChange={e => setStart(e.target.value)} className="rounded border px-3 py-2" required />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-slate-600">Hasta</span>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="rounded border px-3 py-2" required />
        </label>
        <button
          type="submit"
          className="mt-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Consultando…' : 'Consultar'}
        </button>
      </form>

      {typeof isMock !== 'undefined' && (
        <p className="mt-2 text-sm text-slate-500">
          Modo datos: <strong>{isMock ? 'MOCK (sin API Key)' : 'REAL (API Smoobu)'}</strong>
        </p>
      )}

      {error && <p className="mt-3 text-red-600">{error}</p>}

      {rows.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-[640px] border-collapse">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border px-3 py-2">Propiedad</th>
                <th className="border px-3 py-2">ID</th>
                <th className="border px-3 py-2">Fecha</th>
                <th className="border px-3 py-2">Precio</th>
                <th className="border px-3 py-2">Disponible</th>
                <th className="border px-3 py-2">Min. noches</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="odd:bg-white even:bg-slate-50">
                  <td className="border px-3 py-2">{PROPERTY_NAMES[r.propertyId] ?? '(sin nombre)'}</td>
                  <td className="border px-3 py-2">{r.propertyId}</td>
                  <td className="border px-3 py-2">{r.date}</td>
                  <td className="border px-3 py-2">${r.price}</td>
                  <td className="border px-3 py-2">{r.available ? 'Sí' : 'No'}</td>
                  <td className="border px-3 py-2">{r.minLOS}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
