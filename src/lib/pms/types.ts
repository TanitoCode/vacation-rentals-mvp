export interface Unit { id: string; name?: string }
export interface Quote { unitId: string; available: boolean; total: number }
export interface Availability { currency: string; quotes: Quote[] }

export interface PMSProvider {
  listUnits(): Promise<Unit[]>;
  availability(params: { start: string; end: string; guests: number; unitIds: string[] }): Promise<Availability>;
  bookingLink(unitId: string, params?: { start?: string; end?: string; guests?: number }): string;
}
