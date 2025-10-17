export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    nodeEnv: process.env.NODE_ENV,
    useMock: process.env.USE_MOCK ?? null,
    hasApiKey: !!process.env.SMOOBU_API_KEY,
    hasCustomerId: !!process.env.SMOOBU_CUSTOMER_ID,
  });
}
