import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateTime } from '../../services/formatters';
import { Layers, Search, Filter, Download, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export const StockLedgerView: React.FC = () => {
  const { movements, products } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredMovements = movements.filter(m => {
    const prod = products.find(p => p.id === m.productId);
    if (typeFilter !== 'all' && m.movementType !== typeFilter) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      m.batchNumber.toLowerCase().includes(q) ||
      m.referenceId.toLowerCase().includes(q) ||
      m.userName.toLowerCase().includes(q) ||
      (prod && prod.brandName.toLowerCase().includes(q)) ||
      (m.reason && m.reason.toLowerCase().includes(q))
    );
  });

  const handleExportCSV = () => {
    const headers = [
      'Timestamp',
      'Movement ID',
      'Product Name',
      'Batch Number',
      'Movement Type',
      'Quantity Delta',
      'Previous Qty',
      'New Qty',
      'Reference Doc',
      'Location',
      'User',
      'Reason',
    ];

    const rows = filteredMovements.map(m => {
      const prod = products.find(p => p.id === m.productId);
      return [
        m.timestamp,
        m.id,
        `"${prod?.brandName || 'Product'}"`,
        m.batchNumber,
        m.movementType,
        m.quantity,
        m.previousQuantity,
        m.newQuantity,
        m.referenceId,
        m.location,
        `"${m.userName}"`,
        `"${m.reason || ''}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `esart_stock_ledger_${Date.now()}.csv`);
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
            <Layers className="w-5 h-5 text-emerald-700" />
            <span>Immutable Stock Movement Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically auditable transaction ledger. Stock balances are derived exclusively from ledger movements.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Ledger</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center gap-3 shadow-xs text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice #, GRN #, batch, user, medicine..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-500 font-medium">Movement Type:</label>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="py-1.5 px-2 border border-slate-300 rounded bg-white font-medium"
          >
            <option value="all">All Movements</option>
            <option value="receive">Goods Received (GRN)</option>
            <option value="sell">Counter POS Sales</option>
            <option value="return">Customer Returns</option>
            <option value="write_off">Stock Write-Offs</option>
            <option value="adjust_add">Stock Take Adjustments (+)</option>
            <option value="adjust_sub">Stock Take Adjustments (-)</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                <th className="py-2.5 px-4 font-semibold">Medicine</th>
                <th className="py-2.5 px-4 font-semibold">Batch / Lot</th>
                <th className="py-2.5 px-4 font-semibold">Movement Action</th>
                <th className="py-2.5 px-4 font-semibold text-right">Delta Qty</th>
                <th className="py-2.5 px-4 font-semibold text-right">Stock Progression</th>
                <th className="py-2.5 px-4 font-semibold">Reference Document</th>
                <th className="py-2.5 px-4 font-semibold">Logged By</th>
                <th className="py-2.5 px-4 font-semibold">Reason / Audit Trail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredMovements.map(m => {
                const prod = products.find(p => p.id === m.productId);

                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {formatDateTime(m.timestamp)}
                    </td>

                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      {prod?.brandName || 'Product'}
                    </td>

                    <td className="py-2.5 px-4 font-mono font-medium text-slate-800">
                      {m.batchNumber}
                    </td>

                    <td className="py-2.5 px-4">
                      {m.movementType === 'receive' && (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          + Delivery In (GRN)
                        </span>
                      )}
                      {m.movementType === 'sell' && (
                        <span className="text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          - POS Dispense
                        </span>
                      )}
                      {m.movementType === 'return' && (
                        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                          + Customer Return
                        </span>
                      )}
                      {m.movementType === 'write_off' && (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                          - Stock Write-Off
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 text-right font-mono font-bold tabular-nums">
                      <span
                        className={
                          m.quantity > 0
                            ? 'text-emerald-700'
                            : m.quantity < 0
                            ? 'text-rose-700'
                            : 'text-slate-600'
                        }
                      >
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 text-right font-mono text-[11px] text-slate-500 tabular-nums">
                      {m.previousQuantity} → <strong className="text-slate-900">{m.newQuantity}</strong>
                    </td>

                    <td className="py-2.5 px-4 font-mono text-[11px] font-semibold text-slate-800">
                      {m.referenceId}
                    </td>

                    <td className="py-2.5 px-4 font-medium text-slate-700">
                      {m.userName}
                    </td>

                    <td className="py-2.5 px-4 text-[11px] text-slate-500 max-w-xs truncate" title={m.reason}>
                      {m.reason || 'Standard transaction'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
