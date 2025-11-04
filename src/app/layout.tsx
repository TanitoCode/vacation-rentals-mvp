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
  title: 'AR Vacations | Alquileres vacacionales en Playa del Carmen',
  description:
    'Departamentos y condos en Playa del Carmen. Disponibilidad en tiempo real y reserva segura.',
  alternates: { canonical: SITE },
  openGraph: {
    type: 'website',
    siteName: 'AR Vacations',
    url: SITE,
    title: 'AR Vacations | Alquileres vacacionales en Playa del Carmen',
    description:
      'Departamentos y condos en Playa del Carmen. Disponibilidad en tiempo real y reserva segura.',
    images: [`${SITE}/og-default.jpg`], // fallback global
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AR Vacations | Alquileres vacacionales en Playa del Carmen',
    description:
      'Departamentos y condos en Playa del Carmen. Disponibilidad en tiempo real y reserva segura.',
    images: [`${SITE}/og-default.jpg`],
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
