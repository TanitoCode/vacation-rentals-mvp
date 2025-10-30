import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_ORIGIN } from '@/lib/seo';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: 'AR Vacations | Alquileres vacacionales en Playa del Carmen',
    template: '%s · AR Vacations',
  },
  description:
    'Departamentos y condos en Playa del Carmen. Disponibilidad en tiempo real y reserva segura.',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'AR Vacations',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@arvacations',
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
