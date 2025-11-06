// src/app/propiedades/[slug]/page.tsx
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';

// Usa rutas relativas (evita problemas de alias @/)
import Gallery from '../../../components/Gallery';
import SectionCard from '../../../components/SectionCard';

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
  location?: {
    address?: string;
    city?: string;
    country?: string;
    mapsUrl?: string;
  };
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
  if (start) u.searchParams.set('arrival', start);
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

// JSON-LD para SEO
function PropertyJsonLd({ prop, url }: { prop: CatalogProperty; url: string }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Apartment',
    name: prop.name ?? prop.slug ?? prop.id,
    url,
    description: prop.description ?? '',
    image: (prop.images && prop.images.length > 0) ? prop.images : undefined,
    numberOfRooms: prop.bedrooms ?? undefined,
    occupancy: prop.capacity
      ? { '@type': 'QuantitativeValue', value: prop.capacity }
      : undefined,
    address: prop.location?.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: prop.location.address,
          addressLocality: prop.location?.city,
          addressCountry: prop.location?.country,
        }
      : undefined,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// --- canónica + metadatos por propiedad ---
export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const SITE = process.env.SITE_URL || 'http://localhost:3000';

  const catalog = await getCatalog();
  const prop =
    catalog.find((p) => p.slug === slug) ||
    catalog.find((p) => p.id === slug);

  if (!prop || prop.active === false) {
    return {
      title: 'Propiedad no encontrada · AR Vacations',
      description: 'Verifica el enlace o vuelve al listado.',
      alternates: { canonical: `${SITE}/propiedades/${slug}` },
    };
  }

  const title = `${prop.name ?? prop.slug ?? prop.id} · AR Vacations`;
  const description =
    prop.description ??
    'Departamentos y condos en Playa del Carmen. Disponibilidad en tiempo real y reserva segura.';
  const url = `${SITE}/propiedades/${slug}`;
  const images =
    prop.images?.length ? prop.images : [`${SITE}/og-default.jpg`];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      siteName: 'AR Vacations',
      title,
      description,
      url,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
  };
}

export default async function Page(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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
  const otherAvailableHref = hasDates
    ? `/?start=${start}&end=${end}&guests=${guests}`
    : '/';
  const showOtherBtn = activeCount > 1 && hasDates && isAvail === false;

  const SITE = process.env.SITE_URL || 'http://localhost:3000';
  const pageUrl = `${SITE}/propiedades/${slug}`;

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-bold">{name}</h1>
      <PropertyJsonLd prop={prop} url={pageUrl} />

      {/* Filtro local: fechas y huéspedes */}
      <form method="get" className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm text-slate-400" htmlFor="start">
            Desde
          </label>
          <input
            id="start"
            name="start"
            type="date"
            defaultValue={start}
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400" htmlFor="end">
            Hasta
          </label>
          <input
            id="end"
            name="end"
            type="date"
            defaultValue={end}
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400" htmlFor="guests">
            Huéspedes
          </label>
          <input
            id="guests"
            name="guests"
            type="number"
            min={1}
            defaultValue={String(guests)}
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

      {/* Galería (usa tu componente existente) */}
      <section className="mb-4 outline-none" aria-label="Galería de imágenes">
        <Gallery images={prop.images ?? []} name={name} />
      </section>

      {/* Layout en tarjetas (nueva estética) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna izquierda: Descripción + Mapa */}
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Descripción">
            <p>{prop.description ?? 'Sin descripción por ahora.'}</p>
          </SectionCard>

          <SectionCard title="Mapa">
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-slate-700/60">
              <iframe
                src={`https://www.google.com/maps?q=${encodeURIComponent(
                  prop.location?.address ?? 'Playa del Carmen'
                )}&z=16&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="h-full w-full"
                title={`Mapa de ${name}`}
              />
            </div>

            <div className="mt-3">
              <a
                href={prop.location?.mapsUrl ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg border border-slate-600/70 px-3 py-1.5 text-slate-100 hover:bg-slate-800"
              >
                Ver en Google Maps
              </a>
            </div>
          </SectionCard>
        </div>

        {/* Columna derecha: Detalles + Acción */}
        <div className="lg:col-span-1">
          <SectionCard title="Detalles" className="sticky top-6">
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <dt className="text-slate-400">ID</dt>
                <dd>{prop.id}</dd>
              </div>
              {prop.capacity !== undefined && (
                <div className="grid grid-cols-2 gap-2">
                  <dt className="text-slate-400">Capacidad</dt>
                  <dd>{prop.capacity}</dd>
                </div>
              )}
              {prop.bedrooms !== undefined && (
                <div className="grid grid-cols-2 gap-2">
                  <dt className="text-slate-400">Dormitorios</dt>
                  <dd>{prop.bedrooms}</dd>
                </div>
              )}
              {prop.bathrooms !== undefined && (
                <div className="grid grid-cols-2 gap-2">
                  <dt className="text-slate-400">Baños</dt>
                  <dd>{prop.bathrooms}</dd>
                </div>
              )}
              {prop.location?.address && (
                <div className="grid grid-cols-2 gap-2">
                  <dt className="text-slate-400">Ubicación</dt>
                  <dd className="leading-snug">{prop.location.address}</dd>
                </div>
              )}
            </dl>

            {isAvail === false ? (
              <div
                className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-slate-600 px-4 py-2 text-white opacity-60"
                aria-disabled="true"
              >
                No disponible para estas fechas
              </div>
            ) : (
              <a
                href={reservarHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Reservar en Smoobu
              </a>
            )}
          </SectionCard>
        </div>
      </div>
    </main>
  );
}
