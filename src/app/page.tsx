
import RatesPreview from "./RatesPreview";
import AvailabilityPreview from "./AvailabilityPreview";

export default function Home() {
  const bookingUrl = process.env.SMOOBU_BOOKING_EXTERNAL_URL || '#';

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold">MVP — Reserva</h1>
      <p className="mt-2 text-slate-600">Home mínima con botón al motor de Smoobu.</p>

      <a
        href={bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Reservar (abre Smoobu)
      </a>

     <RatesPreview />
      <AvailabilityPreview bookingBase={bookingUrl} />
    </main>
  );
}
