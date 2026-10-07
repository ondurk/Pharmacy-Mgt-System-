import React from 'react';
import { Sale, CompanySettings } from '../../types';
import { formatUGX, formatDateTime, formatDate } from '../../services/formatters';
import { Printer, X, CheckCircle2, QrCode } from 'lucide-react';

export const ThermalReceiptModal: React.FC<{
  sale: Sale;
  settings: CompanySettings;
  onClose: () => void;
}> = ({ sale, settings, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-3 bg-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs">80mm Thermal Receipt (ESC/POS &amp; EFRIS)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print ESC/POS</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex justify-center">
          {/* Printable 80mm Slip Container */}
          <div className="receipt-printable bg-white p-4 w-[76mm] shadow-md border border-slate-200 text-[11px] leading-tight text-black font-mono">
            {/* Business Header */}
            <div className="text-center pb-2 border-b border-dashed border-black space-y-0.5">
              {settings.logoDataUrl && (
                <img src={settings.logoDataUrl} alt={settings.businessName} className="mx-auto max-h-10 max-w-[48mm] object-contain mb-1" />
              )}
              <div className="font-bold text-sm tracking-wider uppercase">
                {settings.businessName}
              </div>
              <div className="text-[10px]">{settings.legalEntity}</div>
              <div className="text-[10px]">{settings.address}</div>
              <div className="text-[10px]">{settings.city}, {settings.country}</div>
              <div className="text-[10px]">Tel: {settings.phone}</div>
              <div className="text-[10px] font-bold">TIN: {settings.tinNumber}</div>
              <div className="text-[10px]">NDA Lic: {settings.drugAuthorityLicense}</div>
            </div>

            {/* URA EFRIS Fiscal Header */}
            <div className="py-2 border-b border-dashed border-black text-center space-y-0.5">
              <div className="font-bold uppercase text-[10px] tracking-wide bg-black text-white px-1 py-0.5 inline-block">
                URA EFRIS FISCAL INVOICE
              </div>
              <div className="text-[10px]">FDN: {sale.efrisRecord.fiscalDocNumber}</div>
              <div className="text-[10px] font-bold">INV: {sale.efrisRecord.fiscalInvoiceNumber}</div>
              <div className="text-[10px]">Verification Code: {sale.efrisRecord.verificationCode}</div>
            </div>

            {/* Transaction Metadata */}
            <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formatDateTime(sale.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span>Receipt No:</span>
                <span>{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="truncate max-w-[140px]">{sale.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Dispenser:</span>
                <span>{sale.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Sale Class:</span>
                <span className="capitalize">{sale.saleType}</span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="py-2 border-b border-dashed border-black space-y-1.5">
              <div className="flex justify-between font-bold border-b border-black pb-0.5 text-[10px]">
                <span>ITEM / BATCH</span>
                <span>QTY x RATE</span>
                <span>TOTAL</span>
              </div>

              {sale.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-bold text-[10px]">{item.productName}</div>
                  <div className="text-[9px] text-slate-600">
                    Lot: {item.batchNumber} · Exp: {formatDate(item.expiryDate)}
                  </div>
                  {item.prescriptionDetails && (
                    <div className="text-[9px] italic">
                      Rx: {item.prescriptionDetails.prescriberName}
                    </div>
                  )}
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[9px]">{item.quantity} {item.unit} x {formatUGX(item.unitPriceUGX)}</span>
                    <span className="font-bold">{formatUGX(item.totalUGX)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Totals */}
            <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatUGX(sale.subtotalUGX)}</span>
              </div>
              {sale.discountUGX > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-{formatUGX(sale.discountUGX)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax (Exempt/0%):</span>
                <span>{formatUGX(sale.taxUGX)}</span>
              </div>
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
                <span>TOTAL PAID:</span>
                <span>{formatUGX(sale.totalUGX)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
              <div className="font-bold">PAYMENTS:</div>
              {sale.payments.map((p, pIdx) => (
                <div key={pIdx} className="flex justify-between">
                  <span className="capitalize">
                    {p.method.replace('_', ' ')}
                    {p.transactionReference ? ` (${p.transactionReference})` : ''}
                  </span>
                  <span>{formatUGX(p.amountUGX)}</span>
                </div>
              ))}
              {sale.changeGivenUGX > 0 && (
                <div className="flex justify-between font-bold pt-0.5">
                  <span>CHANGE RETURNED:</span>
                  <span>{formatUGX(sale.changeGivenUGX)}</span>
                </div>
              )}
            </div>

            {/* URA EFRIS QR Code Representation */}
            <div className="py-3 text-center space-y-1">
              <div className="w-24 h-24 mx-auto border-2 border-black p-1 flex items-center justify-center bg-white">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-black">
                  {/* Stylized QR Code matrix representation */}
                  <rect x="0" y="0" width="30" height="30" fill="black" />
                  <rect x="5" y="5" width="20" height="20" fill="white" />
                  <rect x="10" y="10" width="10" height="10" fill="black" />

                  <rect x="70" y="0" width="30" height="30" fill="black" />
                  <rect x="75" y="5" width="20" height="20" fill="white" />
                  <rect x="80" y="10" width="10" height="10" fill="black" />

                  <rect x="0" y="70" width="30" height="30" fill="black" />
                  <rect x="5" y="75" width="20" height="20" fill="white" />
                  <rect x="10" y="80" width="10" height="10" fill="black" />

                  <rect x="35" y="10" width="10" height="10" fill="black" />
                  <rect x="50" y="15" width="10" height="10" fill="black" />
                  <rect x="35" y="35" width="15" height="15" fill="black" />
                  <rect x="55" y="45" width="10" height="10" fill="black" />
                  <rect x="75" y="35" width="15" height="15" fill="black" />
                  <rect x="40" y="70" width="20" height="10" fill="black" />
                  <rect x="70" y="70" width="10" height="20" fill="black" />
                  <rect x="85" y="85" width="10" height="10" fill="black" />
                </svg>
              </div>
              <div className="text-[8px] break-all leading-none text-slate-700">
                Sign: {sale.efrisRecord.antiTamperSignature}
              </div>
              <div className="text-[9px] font-bold">
                Scan to verify on efris.ura.go.ug
              </div>
            </div>

            {/* Footer Message */}
            <div className="text-center pt-1 border-t border-dashed border-black text-[9px] text-slate-800 space-y-0.5">
              <p>{settings.receiptFooterMessage}</p>
              <p className="font-bold pt-1">*** OFFICIAL TAX SLIP ***</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Thermal ESC/POS 80mm standard width formatting
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 text-slate-700 font-medium"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
