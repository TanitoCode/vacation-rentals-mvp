'use client';

import { useState, useRef, useEffect } from 'react';

export default function Gallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [idx, setIdx] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  if (!images || images.length === 0) return null;

  const total = images.length;
  const go = (i: number) => setIdx((i + total) % total);
  const next = () => go(idx + 1);
  const prev = () => go(idx - 1);

  // cerrar con ESC cuando está abierto
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, idx]);

  return (
    <section
      className="mb-4 outline-none"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); }
      }}
      onTouchStart={(e) => { touchStartX.current = e.changedTouches[0]?.clientX ?? null; }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        const end = e.changedTouches[0]?.clientX ?? null;
        if (start != null && end != null) {
          const dx = end - start;
          if (dx > 40) prev();
          if (dx < -40) next();
        }
        touchStartX.current = null;
      }}
      aria-label="Galería de imágenes"
    >
      {/* Imagen principal (click abre lightbox) */}
      <div className="relative aspect-video w-full overflow-hidden rounded border border-slate-700">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="block h-full w-full"
          aria-label="Abrir imagen en pantalla completa"
        >
          <img
            src={images[idx]}
            alt={`${name} — imagen ${idx + 1} de ${total}`}
            className="h-full w-full object-cover"
            loading="eager"
          />
        </button>

        {/* Controles */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded bg-black/40 px-2 py-1 text-white hover:bg-black/60"
              aria-label="Imagen anterior"
            >
              ←
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-black/40 px-2 py-1 text-white hover:bg-black/60"
              aria-label="Siguiente imagen"
            >
              →
            </button>

            <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">
              {idx + 1}/{total}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {total > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setIdx(i)}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded border ${i === idx ? 'border-blue-500 ring-2 ring-blue-500/40' : 'border-slate-700'}`}
              aria-label={`Ver imagen ${i + 1}`}
            >
              <img src={src} alt={`${name} miniatura ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {/* LIGHTBOX */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <img
              src={images[idx]}
              alt={`${name} — imagen ${idx + 1} de ${total}`}
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()} // no cerrar al click sobre la imagen
            />
            {/* Flechas en overlay */}
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded bg-white/10 px-3 py-2 text-white hover:bg-white/20"
                  aria-label="Imagen anterior"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded bg-white/10 px-3 py-2 text-white hover:bg-white/20"
                  aria-label="Siguiente imagen"
                >
                  →
                </button>
              </>
            )}
            {/* Cerrar */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              className="absolute right-4 top-4 rounded bg-white/10 px-3 py-1.5 text-white hover:bg-white/20"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
