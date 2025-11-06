// src/components/SectionCard.tsx
import React, { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
  title?: string;
  className?: string;
}>;

export default function SectionCard({ title, className = '', children }: Props) {
  return (
    <section
      className={`rounded-2xl border border-slate-700/60 bg-slate-900/50 shadow-lg shadow-black/20 backdrop-blur-sm ${className}`}
    >
      {title ? (
        <header className="border-b border-slate-700/60 px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        </header>
      ) : null}

      <div className="p-4 text-slate-300">{children}</div>
    </section>
  );
}
