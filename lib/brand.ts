// Which AI receptionist brand a client sees is derived entirely from their
// `industry` field — there is no separate DB column for it. Dental clients
// get "Nova", every other industry (plumbing/HVAC/electrical/other, and any
// future trades industry) gets "Alex". Add new dental-adjacent industries to
// DENTAL_INDUSTRIES if/when they're introduced.
const DENTAL_INDUSTRIES = new Set(['dental']);

export type ReceptionistBrand = 'Alex' | 'Nova';

export function getReceptionistBrand(industry: string | null | undefined): ReceptionistBrand {
  if (industry && DENTAL_INDUSTRIES.has(industry.toLowerCase())) {
    return 'Nova';
  }
  return 'Alex';
}
