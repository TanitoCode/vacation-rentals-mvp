// src/app/propiedades/page.tsx
import { headers } from "next/headers";
import PropertyCard from "@/components/PropertyCard";

type CatalogProperty = {
  id: string;
  name?: string;
  slug?: string;
  active?: boolean;
  images?: string[];
  capacity?: number;
  bedrooms?: number;
  bathrooms?: number;
  location?: {
    address?: string;
    city?: string;
    country?: string;
  };
};

export const metadata = {
  title: "Propiedades · AR Vacations",
  description:
    "Listado de departamentos y condos con disponibilidad y reserva segura.",
  alternates: { canonical: "/propiedades" },
};

async function absUrl(pathname: string) {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}${pathname}`;
}

async function getCatalog(): Promise<CatalogProperty[]> {
  const url = await absUrl("/api/catalog/properties");
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  return (json?.data?.properties ?? []) as CatalogProperty[];
}

function withQuery(base: string, qs: Record<string, string | undefined>) {
  const u = new URL(base, "http://dummy");
  Object.entries(qs).forEach(([k, v]) => v && u.searchParams.set(k, v));
  return u.pathname + (u.search ? u.search : "");
}

export default async function Page({
  searchParams,
}: {
  searchParams?: { start?: string; end?: string; guests?: string };
}) {
  const props = await getCatalog();
  const items = props.filter((p) => p.active !== false);

  const q = {
    start: searchParams?.start,
    end: searchParams?.end,
    guests: searchParams?.guests,
  };

  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Propiedades</h1>
        <p className="mt-1 text-slate-400">
          Elegí una unidad. Si definiste fechas en la home o en otra ficha,
          las mantenemos al abrir el detalle.
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => {
          const title = p.name ?? p.slug ?? p.id;
          const img = p.images?.[0];
          const location =
            p.location?.address ||
            [p.location?.city, p.location?.country].filter(Boolean).join(", ") ||
            undefined;
          const badges = [
            p.capacity ? `${p.capacity} huéspedes` : null,
            p.bedrooms ? `${p.bedrooms} dorm.` : null,
            p.bathrooms
              ? `${p.bathrooms} baño${p.bathrooms > 1 ? "s" : ""}`
              : null,
          ].filter(Boolean) as string[];

          const href = withQuery(`/propiedades/${p.slug ?? p.id}`, q);

          return (
            <PropertyCard
              key={p.id}
              href={href}
              title={title}
              imageUrl={img ?? "/og-default.jpg"}
              location={location}
              badges={badges}
            />
          );
        })}
      </section>
    </main>
  );
}
