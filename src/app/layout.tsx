import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// src/app/layout.tsx
export const metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'AR Vacations | Alquileres vacacionales en Playa del Carmen',
    template: '%s · AR Vacations',
  },
  description:
    'Departamentos y condos en Playa del Carmen. Disponibilidad en tiempo real y reserva segura.',
  applicationName: 'AR Vacations',
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'AR Vacations',
    url: '/',
    title: 'AR Vacations | Alquileres vacacionales en Playa del Carmen',
    description:
      'Departamentos y condos en Playa del Carmen. Disponibilidad en tiempo real y reserva segura.',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@arvacations', // si no tienes, déjalo vacío o quítalo
  },
  icons: {
    icon: '/favicon.ico',
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
