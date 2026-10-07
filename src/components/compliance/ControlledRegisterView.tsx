import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateTime } from '../../services/formatters';
import { ShieldAlert, Printer, Search, Download, FileText, CheckCircle2 } from 'lucide-react';

export const ControlledRegisterView: React.FC = () => {
  const { controlledEntries, products, settings } = useApp();
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const controlledProducts = products.filter(p => p.isControlled);

  const filteredEntries = controlledEntries.filter(entry => {
    if (selectedProductFilter !== 'all' && entry.productId !== selectedProductFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      entry.drugName.toLowerCase().includes(q) ||
      entry.batchNumber.toLowerCase().includes(q) ||
      (entry.patientName && entry.patientName.toLowerCase().includes(q)) ||
      (entry.prescriberName && entry.prescriberName.toLowerCase().includes(q)) ||
      entry.referenceDoc.toLowerCase().includes(q)
    );
  });

  const handlePrintRegister = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'Date/Time',
      'Controlled Drug',
      'Batch #',
      'Transaction Type',
      'Quantity',
      'Running Balance',
      'Patient Name',
      'Prescriber Name',
      'Prescriber Reg #',
      'Pharmacist',
      'Reference Doc',
    ];

    const rows = filteredEntries.map(e => [
      e.timestamp,
      `"${e.drugName} ${e.strength}"`,
      e.batchNumber,
      e.transactionType,
      e.quantity,
      e.runningBalance,
      `"${e.patientName || '—'}"`,
      `"${e.prescriberName || '—'}"`,
      `"${e.prescriberRegNo || '—'}"`,
      `"${e.pharmacistName}"`,
      e.referenceDoc,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nda_controlled_register_${Date.now()}.csv`);
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
            <ShieldAlert className="w-5 h-5 text-rose-700" />
            <span>National Drug Authority (NDA) Controlled Substances Register</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Statutory ledger for Class A &amp; B controlled narcotics and psychotropics. Running balance verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrintRegister}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-800 rounded-md hover:bg-slate-900 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Register</span>
          </button>
        </div>
      </div>

      {/* NDA Regulatory Notice */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="font-semibold">NDA Compliance Requirement:</strong>
          <p className="text-amber-800 text-[11px]">
            Every intake and dispensing of Pethidine, Morphine, Diazepam and other Schedule medicines
            must record the patient name, prescriber UMDC number, dispensing pharmacist sign-off, and
            running balance. Discrepancies must be notified to NDA Uganda within 24 hours.
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center gap-3 shadow-xs text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient, doctor reg, batch, drug..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-500 font-medium">Controlled Drug:</label>
          <select
            value={selectedProductFilter}
            onChange={e => setSelectedProductFilter(e.target.value)}
            className="py-1.5 px-2 border border-slate-300 rounded bg-white font-medium"
          >
            <option value="all">All Controlled Substances</option>
            {controlledProducts.map(cp => (
              <option key={cp.id} value={cp.id}>
                {cp.brandName} ({cp.strength})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Official NDA Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Date &amp; Time</th>
                <th className="py-2.5 px-3 font-semibold">Controlled Medicine</th>
                <th className="py-2.5 px-3 font-semibold">Batch #</th>
                <th className="py-2.5 px-3 font-semibold">Action</th>
                <th className="py-2.5 px-3 font-semibold text-right">Quantity</th>
                <th className="py-2.5 px-3 font-semibold text-right">Running Balance</th>
                <th className="py-2.5 px-3 font-semibold">Patient &amp; Contact</th>
                <th className="py-2.5 px-3 font-semibold">Prescriber &amp; Reg #</th>
                <th className="py-2.5 px-3 font-semibold">Pharmacist</th>
                <th className="py-2.5 px-3 font-semibold">Reference Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEntries.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {formatDateTime(entry.timestamp)}
                  </td>

                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    {entry.drugName}
                  </td>

                  <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                    {entry.batchNumber}
                  </td>

                  <td className="py-2.5 px-3">
                    {entry.transactionType === 'receipt' ? (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        RECEIPT (+)
                      </span>
                    ) : entry.transactionType === 'dispense' ? (
                      <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                        DISPENSED (-)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                        DESTRUCTION
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums">
                    {entry.quantity}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-900 bg-emerald-50/50 tabular-nums">
                    {entry.runningBalance}
                  </td>

                  <td className="py-2.5 px-3 text-slate-800">
                    <div className="font-medium">{entry.patientName || '—'}</div>
                    {entry.patientContact && (
                      <div className="text-[10px] text-slate-400">{entry.patientContact}</div>
                    )}
                  </td>

                  <td className="py-2.5 px-3">
                    <div className="font-medium text-slate-900">{entry.prescriberName || '—'}</div>
                    {entry.prescriberRegNo && (
                      <div className="text-[10px] font-mono text-slate-500">{entry.prescriberRegNo}</div>
                    )}
                  </td>

                  <td className="py-2.5 px-3 font-medium text-slate-700">
                    {entry.pharmacistName}
                  </td>

                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                    {entry.referenceDoc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
