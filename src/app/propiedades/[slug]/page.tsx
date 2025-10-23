// src/app/propiedades/[slug]/page.tsx
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Gallery from '@/components/Gallery';


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

// URL absoluta robusta para SSR
async function absUrl(pathname: string) {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}${pathname}`;
}

async function getCatalog(): Promise<CatalogProperty[]> {
  const url = await absUrl('/api/catalog/properties');
  const res = await fetch(url, { cache: 'no-store' });
  const json = await res.json();
  return (json?.data?.properties ?? []) as CatalogProperty[];
}

function buildBookingUrl(base: string, apartmentId: string, start?: string, end?: string) {
  const u = new URL(base);
  u.searchParams.set('apartmentId', apartmentId);
  if (start) u.searchParams.set('arrival', start);   // best-effort
  if (end) u.searchParams.set('departure', end);
  return u.toString();
}

async function getUnitAvailability(aptId: string, start?: string, end?: string, guests?: number) {
  if (!start || !end) return null; // sin fechas no consultamos

  const qs = new URLSearchParams({
    start,
    end,
    guests: String(guests ?? 2),
    ids: aptId, // pedimos SOLO esta unidad
  });

  const url = await absUrl(`/api/smoobu/availability?${qs.toString()}`);
  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    return { apartmentId: aptId, available: false, total: 0 };
  }

  const json = await res.json();
  const quotes = Array.isArray(json?.data?.quotes) ? json.data.quotes : [];
  if (quotes.length === 0) {
    return { apartmentId: aptId, available: false, total: 0 };
  }

  const q = quotes.find((x: any) => String(x.apartmentId) === String(aptId));
  return q ?? { apartmentId: aptId, available: false, total: 0 };
}

export default async function Page(
  props: {
    // 👇 En Next 15, ambos llegan como Promesas
    params: Promise<{ slug: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  // ✅ Esperamos ambas promesas ANTES de usarlas
  const [{ slug }, sp] = await Promise.all([props.params, props.searchParams]);

  const catalog = await getCatalog();
  const prop =
    catalog.find((p) => p.slug === slug) ||
    catalog.find((p) => p.id === slug);

  if (!prop || prop.active === false) notFound();

  const activeCount = catalog.filter((p) => p.active !== false).length;

  const name = prop.name ?? prop.slug ?? prop.id;
  const bookingBase = process.env.SMOOBU_BOOKING_EXTERNAL_URL || '#';
  const aptId = prop.pms?.smoobu?.apartmentId ?? undefined;

  // Filtros desde la URL (ya resueltos)
  const start = (sp.start as string) ?? undefined;
  const end = (sp.end as string) ?? undefined;
  const guests = Number((sp.guests as string) ?? '2');

  // Chequeo de disponibilidad para esta unidad (si hay fechas)
  const unitQuote = aptId ? await getUnitAvailability(aptId, start, end, guests) : null;
  const hasDates = !!(start && end);
  const isAvail = unitQuote ? !!unitQuote.available : undefined;

  const reservarHref = aptId
    ? buildBookingUrl(bookingBase, aptId, start, end)
    : bookingBase;

  // Link a la home con las mismas fechas para ver otras disponibles (solo si hay +1 activa)
  const otherAvailableHref =
    hasDates ? `/?start=${start}&end=${end}&guests=${guests}` : '/';
  const showOtherBtn = activeCount > 1 && hasDates && isAvail === false;

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold mb-4">{name}</h1>

      {/* Filtro local: fechas y huéspedes */}
      <form method="get" className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1" htmlFor="start">Desde</label>
          <input id="start" name="start" type="date" defaultValue={start}
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1" htmlFor="end">Hasta</label>
          <input id="end" name="end" type="date" defaultValue={end}
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1" htmlFor="guests">Huéspedes</label>
          <input id="guests" name="guests" type="number" min={1} defaultValue={String(guests)}
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" />
        </div>
        <div className="flex items-end">
          <button type="submit" className="w-full rounded bg-slate-700 px-4 py-2 text-white hover:bg-slate-600">
            Aplicar
          </button>
        </div>
      </form>

      {/* Estado de disponibilidad + botón “Ver otras disponibles” cuando NO hay */}
      {hasDates && (
        <div className="mb-3 flex items-center gap-3">
          {isAvail === true && (
            <span className="inline-block rounded bg-green-700/30 px-3 py-1 text-green-300">
              Disponible para estas fechas
            </span>
          )}
          {isAvail === false && (
            <>
              <span className="inline-block rounded bg-red-700/30 px-3 py-1 text-red-300">
                No disponible para estas fechas
              </span>
              {showOtherBtn && (
                <Link
                  href={otherAvailableHref}
                  className="inline-flex items-center rounded border border-slate-600 px-3 py-1 text-slate-100 hover:bg-slate-800"
                >
                  Ver otras disponibles
                </Link>
              )}
            </>
          )}
        </div>
      )}

      {/* Galería si hay imágenes; si no, placeholder */}
      {(prop.images?.length ?? 0) > 0 ? (
        <Gallery images={prop.images!} name={name} />
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
            {prop.capacity !== undefined && <li><span className="text-slate-400">Capacidad:</span> {prop.capacity}</li>}
            {prop.bedrooms !== undefined && <li><span className="text-slate-400">Dormitorios:</span> {prop.bedrooms}</li>}
            {prop.bathrooms !== undefined && <li><span className="text-slate-400">Baños:</span> {prop.bathrooms}</li>}
          </ul>

          {/* Botón reservar (sin onClick, server component) */}
          {isAvail === false ? (
            <div
              className="mt-4 inline-flex items-center rounded bg-slate-600 px-4 py-2 text-white opacity-50 cursor-not-allowed"
              aria-disabled="true"
            >
              No disponible para estas fechas
            </div>
          ) : (
            <a
              href={reservarHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Reservar en Smoobu
            </a>
          )}
        </section>
      </div>
    </main>
  );
}
