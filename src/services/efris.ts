import { EfrisInvoiceRecord, CompanySettings } from '../types';

/**
 * Pluggable URA EFRIS (Electronic Fiscal Receipting and Invoicing System) adapter.
 * Produces official fiscal attributes required by Uganda Revenue Authority.
 */
export function generateEfrisFiscalRecord(
  grossAmountUGX: number,
  taxAmountUGX: number,
  buyerTin: string | undefined,
  settings: CompanySettings
): EfrisInvoiceRecord {
  const now = new Date();
  const year = now.getFullYear();
  const sequence = Math.floor(100000 + Math.random() * 900000);
  const fiscalInvoiceNumber = `INV-UG-${year}-${sequence}`;
  const verificationCode = `${Math.floor(100000 + Math.random() * 900000)}`;
  
  // Deterministic anti-tamper signature simulation
  const rawPayload = `${settings.tinNumber}|${settings.efrisDeviceNumber}|${fiscalInvoiceNumber}|${grossAmountUGX}|${taxAmountUGX}|${verificationCode}`;
  let hash = 0;
  for (let i = 0; i < rawPayload.length; i++) {
    hash = (hash << 5) - hash + rawPayload.charCodeAt(i);
    hash |= 0;
  }
  const antiTamperSignature = `EFRIS-SIG-${Math.abs(hash).toString(16).toUpperCase()}-${sequence}`;

  // QR Code payload formatted per URA technical spec
  const qrPayload = `https://efris.ura.go.ug/verify?fdn=${settings.efrisDeviceNumber}&inv=${fiscalInvoiceNumber}&tin=${settings.tinNumber}&amt=${grossAmountUGX}&tax=${taxAmountUGX}&vc=${verificationCode}`;

  return {
    fiscalDocNumber: settings.efrisDeviceNumber,
    fiscalInvoiceNumber,
    verificationCode,
    antiTamperSignature,
    qrPayload,
    taxableAmountUGX: grossAmountUGX - taxAmountUGX,
    taxAmountUGX,
    grossAmountUGX,
    buyerTin,
    issuedAt: now.toISOString(),
    syncStatus: 'synced_mock',
  };
}
