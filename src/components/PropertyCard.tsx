// src/components/PropertyCard.tsx
import Link from "next/link";

type CardProps = {
  href: string;
  title: string;
  imageUrl?: string;
  location?: string;
  badges?: string[];
};

export default function PropertyCard({ href, title, imageUrl, location, badges = [] }: CardProps) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70 transition-colors"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-800 to-slate-900" />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3">
          <h3 className="text-lg font-semibold text-white drop-shadow">{title}</h3>
          {location && <p className="text-sm text-slate-200 drop-shadow-sm line-clamp-1">{location}</p>}
        </div>
      </div>

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 pt-2">
          {badges.map((b, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded-full bg-black/30 px-3 py-1 text-sm text-slate-200"
            >
              {b}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
