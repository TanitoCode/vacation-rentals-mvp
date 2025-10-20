import { PMSProvider } from './types';
import { SmoobuProvider } from './smoobu';

export function getProvider(): PMSProvider {
  // mañana podremos elegir proveedor por ENV o por tenant
  return new SmoobuProvider({
    apiKey: process.env.SMOOBU_API_KEY || '',
    baseUrl: 'https://login.smoobu.com',
    customerId: (process.env.SMOOBU_CUSTOMER_ID || '').trim(),
    bookingBase: process.env.SMOOBU_BOOKING_EXTERNAL_URL || '#',
  });
}
