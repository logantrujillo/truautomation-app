// Normalizes a phone number for comparison purposes: strips everything but
// digits, then keeps the last 10 digits (US numbers), so "+1 844 748 2410",
// "844-748-2410", and "8447482410" all compare equal regardless of how they
// were typed into the admin assignment form or formatted by Twilio/VAPI.
export function normalizePhone(input: string | null | undefined): string {
  if (!input) return '';
  const digits = input.replace(/\D/g, '');
  return digits.slice(-10);
}

// Formats a normalized 10-digit US number back to E.164 for consistent
// storage (e.g. "8447482410" -> "+18447482410").
export function toE164(input: string | null | undefined): string | null {
  const digits = normalizePhone(input);
  if (digits.length !== 10) return input?.trim() || null;
  return `+1${digits}`;
}
