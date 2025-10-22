// src/app/propiedades/[slug]/page.tsx
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

type CatalogProperty = {
  id: string;
  name?: string;
  slug?: string;
  active?: boolean;
  images?: string[];
  description?: string;
  capacity?: number;
  bedrooms?: number;
  bathrooms?: number;
  pms?: { smoobu?: { apartmentId?: string } };
};

async function getCatalog(): Promise<CatalogProperty[]> {
  // URL absoluta robusta para SSR
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const url = `${proto}://${host}/api/catalog/properties`;

  const res = await fetch(url, { cache: 'no-store' });
  const json = await res.json();
  return (json?.data?.properties ?? []) as CatalogProperty[];
}

function buildBookingUrl(base: string, apartmentId: string, start?: string, end?: string) {
  const u = new URL(base);
  u.searchParams.set('apartmentId', apartmentId);
  if (start) u.searchParams.set('arrival', start);     // best-effort (si Smoobu lo ignora, no rompe)
  if (end)   u.searchParams.set('departure', end);
  return u.toString();
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const catalog = await getCatalog();
  const prop =
    catalog.find(p => p.slug === params.slug) ||
    catalog.find(p => p.id === params.slug);

  if (!prop || prop.active === false) {
    notFound();
  }

  const name = prop.name ?? prop.slug ?? prop.id;
  const bookingBase = process.env.SMOOBU_BOOKING_EXTERNAL_URL || '#';
  const aptId = prop.pms?.smoobu?.apartmentId;

  const start = (searchParams?.start as string) || undefined;
  const end   = (searchParams?.end   as string) || undefined;

  const reservarHref = aptId
    ? buildBookingUrl(bookingBase, aptId, start, end)
    : bookingBase;

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold mb-4">{name}</h1>

    {/* Filtro local: fechas y huéspedes (recarga por GET y mantiene el deep-link) */}
<form method="get" className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
  <div>
    <label className="block text-sm text-slate-400 mb-1" htmlFor="start">Desde</label>
    <input
      id="start"
      name="start"
      type="date"
      defaultValue={start}
      className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
    />
  </div>
  <div>
    <label className="block text-sm text-slate-400 mb-1" htmlFor="end">Hasta</label>
    <input
      id="end"
      name="end"
      type="date"
      defaultValue={end}
      className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
    />
  </div>
  <div>
    <label className="block text-sm text-slate-400 mb-1" htmlFor="guests">Huéspedes</label>
    <input
      id="guests"
      name="guests"
      type="number"
      min={1}
      defaultValue={(searchParams?.guests as string) || '2'}
      className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
    />
  </div>
  <div className="flex items-end">
    <button
      type="submit"
      className="w-full rounded bg-slate-700 px-4 py-2 text-white hover:bg-slate-600"
    >
      Aplicar
    </button>
  </div>
</form>
      {/* Imagen de portada si existe, si no un placeholder */}
      {prop.images?.[0] ? (
        <img
          src={prop.images[0]}
          alt={name}
          className="mb-4 aspect-video w-full rounded object-cover"
        />
      ) : (
        <div className="mb-4 aspect-video w-full rounded bg-slate-800/30" />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <section>
          <h2 className="font-semibold mb-2">Descripción</h2>
          <p className="text-slate-300">{prop.description ?? 'Sin descripción por ahora.'}</p>
        </section>

        <section>
          <h2 className="font-semibold mb-2">Detalles</h2>
          <ul className="text-slate-300 space-y-1">
            <li><span className="text-slate-400">ID:</span> {prop.id}</li>
            {prop.capacity   !== undefined && <li><span className="text-slate-400">Capacidad:</span> {prop.capacity}</li>}
            {prop.bedrooms   !== undefined && <li><span className="text-slate-400">Dormitorios:</span> {prop.bedrooms}</li>}
            {prop.bathrooms  !== undefined && <li><span className="text-slate-400">Baños:</span> {prop.bathrooms}</li>}
          </ul>

          <a
            href={reservarHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            aria-disabled={!aptId}
          >
            Reservar en Smoobu
          </a>
        </section>
      </div>
    </main>
  );
}
