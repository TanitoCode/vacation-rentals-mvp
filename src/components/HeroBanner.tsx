// src/components/HeroBanner.tsx
type HeroBannerProps = {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  badges?: string[];
};

export default function HeroBanner({ title, subtitle, imageUrl, badges = [] }: HeroBannerProps) {
  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl">
      {/* Fondo */}
      <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full">
        {imageUrl ? (
          // Usamos <img> para simplicidad; más adelante podemos migrar a next/image
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-slate-800 to-slate-900" />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Contenido */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-slate-200 drop-shadow-sm line-clamp-1">{subtitle}</p>
          )}

          {/* Badges */}
          {badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {badges.map((b, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full bg-black/40 px-3 py-1 text-sm text-slate-100 backdrop-blur"
                >
                  {b}
                </span>
              ))}
            </div>
          )}

          {/* CTA secundaria: ancla a disponibilidad */}
          <div className="mt-4">
            <a
              href="#disponibilidad"
              className="inline-flex items-center rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-white"
            >
              Ver disponibilidad
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
