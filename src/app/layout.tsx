import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_ORIGIN } from '@/lib/seo';
const SITE = process.env.SITE_URL || 'http://localhost:3000';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // 👇 Esto hace que todas las URLs relativas apunten al dominio correcto (prod/dev)
  metadataBase: new URL(SITE),

  title: 'AR Vacations | Alquileres vacacionales en Playa del Carmen',
  description:
    'Departamentos y condos en Playa del Carmen. Disponibilidad en tiempo real y reserva segura.',

  // Para la home, canonical relativo (resuelto con metadataBase)
  alternates: { canonical: '/' },

  openGraph: {
    type: 'website',
    siteName: 'AR Vacations',
    url: '/', // se resuelve a SITE
    title: 'AR Vacations | Alquileres vacacionales en Playa del Carmen',
    description:
      'Departamentos y condos en Playa del Carmen. Disponibilidad en tiempo real y reserva segura.',
    images: ['/og-default.jpg'], // 👈 relativo, más seguro
  },

  // “Twitter” = X. Sigue llamándose “twitter” en la API de Next/HTML.
  twitter: {
    card: 'summary_large_image',
    title: 'AR Vacations | Alquileres vacacionales en Playa del Carmen',
    description:
      'Departamentos y condos en Playa del Carmen. Disponibilidad en tiempo real y reserva segura.',
    images: ['/og-default.jpg'], // relativo
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
