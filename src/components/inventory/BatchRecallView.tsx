import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateTime, formatDate, formatUGX } from '../../services/formatters';
import { SearchCode, AlertTriangle, Phone, Download, CheckCircle2, User } from 'lucide-react';

export const BatchRecallView: React.FC = () => {
  const { batches, products, sales, movements } = useApp();
  const [selectedBatchNumber, setSelectedBatchNumber] = useState<string>(
    batches[0]?.batchNumber || ''
  );
  const [customBatchInput, setCustomBatchInput] = useState('');

  const activeBatchSearch = customBatchInput.trim() || selectedBatchNumber;

  const currentBatch = batches.find(b => b.batchNumber === activeBatchSearch);
  const product = currentBatch ? products.find(p => p.id === currentBatch.productId) : null;

  // Find all sales that include items from this batch
  const matchingSales = sales.filter(s =>
    s.items.some(item => item.batchNumber === activeBatchSearch)
  );

  // Total units dispensed from this batch
  const totalDispensedInSales = matchingSales.reduce((sum, s) => {
    const item = s.items.find(i => i.batchNumber === activeBatchSearch);
    return sum + (item ? item.quantity : 0);
  }, 0);

  const handleExportRecallList = () => {
    const headers = [
      'Invoice #',
      'Dispensed Date/Time',
      'Batch Number',
      'Medicine',
      'Patient / Customer Name',
      'Phone Contact',
      'Quantity Dispensed',
      'Prescribing Doctor',
      'Dispensing Staff',
    ];

    const rows: (string | number)[][] = [];

    matchingSales.forEach(s => {
      const item = s.items.find(i => i.batchNumber === activeBatchSearch);
      if (item) {
        rows.push([
          s.invoiceNumber,
          s.timestamp,
          item.batchNumber,
          `"${item.productName}"`,
          `"${s.customerName}"`,
          `"${s.customerPhone || 'N/A'}"`,
          item.quantity,
          `"${item.prescriptionDetails?.prescriberName || 'N/A'}"`,
          `"${s.cashierName}"`,
        ]);
      }
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nda_batch_recall_${activeBatchSearch}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <SearchCode className="w-5 h-5 text-rose-700" />
            <span>NDA Batch Traceability &amp; Patient Recall Handling</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Instantly trace every customer, prescription &amp; dispensation tied to a specific batch lot number.
          </p>
        </div>

        {matchingSales.length > 0 && (
          <button
            onClick={handleExportRecallList}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-md flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Recall Contact Sheet</span>
          </button>
        )}
      </div>

      {/* Batch Selector Box */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs shadow-xs">
        <div>
          <label className="font-semibold text-slate-700 block mb-1">
            Select Active Batch Lot #
          </label>
          <select
            value={selectedBatchNumber}
            onChange={e => {
              setSelectedBatchNumber(e.target.value);
              setCustomBatchInput('');
            }}
            className="w-full p-2 border border-slate-300 rounded font-mono font-medium bg-white"
          >
            {batches.map(b => {
              const p = products.find(prod => prod.id === b.productId);
              return (
                <option key={b.id} value={b.batchNumber}>
                  {b.batchNumber} — {p?.brandName || 'Product'} (Exp: {formatDate(b.expiryDate)})
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">
            Or Type Any Historic / Recalled Batch #
          </label>
          <input
            type="text"
            placeholder="e.g. CTM-2026-A1 or AMX-2025-10"
            value={customBatchInput}
            onChange={e => setCustomBatchInput(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded font-mono"
          />
        </div>
      </div>

      {/* Batch Dossier Card */}
      {currentBatch && product && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-slate-900">
                Lot #{currentBatch.batchNumber}
              </span>
              <span className="font-semibold text-slate-700">· {product.brandName}</span>
              <span className="text-slate-500 italic">({product.genericName})</span>
            </div>
            <div className="text-slate-500 text-[11px] mt-1 space-x-3">
              <span>Expiry Date: <strong className="text-slate-800">{formatDate(currentBatch.expiryDate)}</strong></span>
              <span>·</span>
              <span>Location: <strong className="text-slate-800">{currentBatch.location}</strong></span>
              <span>·</span>
              <span>NDA Reg: <strong className="text-slate-800">{product.ndaRegNumber || 'N/A'}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-medium">On Shelves</span>
              <span className="font-bold font-mono text-base text-slate-900 tabular-nums">
                {currentBatch.quantityOnHand} units
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-medium">Dispensed in Sales</span>
              <span className="font-bold font-mono text-base text-rose-700 tabular-nums">
                {totalDispensedInSales} units
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Traceability Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="font-bold text-slate-900 text-xs">
            Patients &amp; Sales Dispensed from Batch {activeBatchSearch}
          </span>
          <span className="text-[11px] text-slate-500">
            {matchingSales.length} matching transactions
          </span>
        </div>

        {matchingSales.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-800">
              No sales recorded for batch {activeBatchSearch} in current sales records.
            </p>
            <p className="text-slate-400 mt-1">
              Either this lot remains untouched in stores, or has not been dispensed to any walk-in customer.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Invoice #</th>
                  <th className="py-2.5 px-4 font-semibold">Date &amp; Time</th>
                  <th className="py-2.5 px-4 font-semibold">Customer / Patient</th>
                  <th className="py-2.5 px-4 font-semibold">Phone Contact</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Qty Dispensed</th>
                  <th className="py-2.5 px-4 font-semibold">Prescriber Details</th>
                  <th className="py-2.5 px-4 font-semibold">Dispensing Cashier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {matchingSales.map(sale => {
                  const saleItem = sale.items.find(i => i.batchNumber === activeBatchSearch);

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                        {sale.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {formatDateTime(sale.timestamp)}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {sale.customerName}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-700">
                        {sale.customerPhone || 'N/A'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-700 tabular-nums">
                        {saleItem ? `${saleItem.quantity} ${saleItem.unit}` : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {saleItem?.prescriptionDetails ? (
                          <div>
                            <span className="font-medium text-slate-800">
                              {saleItem.prescriptionDetails.prescriberName}
                            </span>
                            <span className="block text-[10px] font-mono text-slate-500">
                              {saleItem.prescriptionDetails.prescriberRegNo}
                            </span>
                          </div>
                        ) : (
                          'OTC (No Rx required)'
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {sale.cashierName}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
