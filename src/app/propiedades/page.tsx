// src/app/propiedades/page.tsx
import Link from 'next/link';
import { headers } from 'next/headers';

type CatalogProperty = {
  id: string;
  name?: string;
  slug?: string;
  active?: boolean;
  images?: string[];
  pms?: { smoobu?: { apartmentId?: string } };
};

async function getCatalog(): Promise<CatalogProperty[]> {
  // Construye URL absoluta para SSR
  const h = await headers(); // FIX: en tu proyecto es Promise<ReadonlyHeaders>
  const host =
    h.get('x-forwarded-host') ??
    h.get('host') ??
    'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? 'http';

  const url = `${proto}://${host}/api/catalog/properties`;

  const res = await fetch(url, { cache: 'no-store' });
  const json = await res.json();
  const list = json?.data?.properties ?? [];
  return (list as CatalogProperty[]).filter(p => p.active !== false);
}
export default async function Page() {
  const bookingUrl = process.env.SMOOBU_BOOKING_EXTERNAL_URL || '#';
  const properties = await getCatalog();

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold mb-4">Propiedades</h1>

      {properties.length === 0 ? (
        <p className="text-slate-600">Aún no hay propiedades en el catálogo.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => {
            const name = p.name ?? p.slug ?? p.id;
            const apartmentId = p.pms?.smoobu?.apartmentId;
            const reservarHref = apartmentId
              ? `${bookingUrl}?apartmentId=${apartmentId}`
              : bookingUrl;

            return (
              <article key={p.id} className="rounded border p-4">
                {/* Mini portada si tenés imágenes (opcional) */}
                {/* {p.images?.[0] && (
                  <img src={p.images[0]} alt={name} className="mb-3 aspect-video w-full rounded object-cover" />
                )} */}
                <h2 className="font-semibold">{name}</h2>
                <p className="text-sm text-slate-600">ID: {p.id}</p>

                <div className="mt-3 flex gap-2">
                  <a
                    href={reservarHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
                  >
                    Reservar
                  </a>
                  <Link
                    href={`/propiedades/${p.slug ?? p.id}`}
                    className="rounded border px-3 py-1.5 hover:bg-slate-50"
                  >
                    Ver detalles
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
