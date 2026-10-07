import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatUGX, formatDate } from '../../services/formatters';
import { ClipboardCheck, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';

export const StockTakeView: React.FC = () => {
  const { batches, products, currentUser, requestApproval } = useApp();

  const [physicalCounts, setPhysicalCounts] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    batches.forEach(b => {
      map[b.id] = b.quantityOnHand;
    });
    return map;
  });

  const [notes, setNotes] = useState('Monthly count audit for Uganda central dispensary');

  const handleCountChange = (batchId: string, val: number) => {
    setPhysicalCounts(prev => ({
      ...prev,
      [batchId]: Math.max(0, val),
    }));
  };

  // Calculate variances
  const variances = batches.map(b => {
    const prod = products.find(p => p.id === b.productId);
    const counted = physicalCounts[b.id] ?? b.quantityOnHand;
    const diff = counted - b.quantityOnHand;
    const diffValueUGX = diff * b.costPriceUGX;
    return {
      batch: b,
      product: prod,
      expected: b.quantityOnHand,
      counted,
      diff,
      diffValueUGX,
    };
  });

  const discrepancies = variances.filter(v => v.diff !== 0);
  const totalVarianceCostUGX = discrepancies.reduce((s, v) => s + v.diffValueUGX, 0);

  const handleSubmitStockTakeApproval = () => {
    if (discrepancies.length === 0) {
      alert('All physical counts reconcile perfectly with stock ledger balances! No adjustments required.');
      return;
    }

    requestApproval({
      requestType: 'stock_adjustment',
      requestedByUserId: currentUser.id,
      requestedByUserName: currentUser.name,
      title: `Stock Count Variance Adjustment (${discrepancies.length} Discrepancies)`,
      details: `${notes}. Net variance cost: ${formatUGX(totalVarianceCostUGX)}. Items affected: ${discrepancies.map(d => `${d.product?.brandName} (${d.diff > 0 ? `+${d.diff}` : d.diff})`).join(', ')}.`,
      amountUGX: Math.abs(totalVarianceCostUGX),
    });

    alert(
      `Stock count variance submitted to Director Approvals queue for sign-off.\nDual control rule applies: Reconciler cannot self-approve.`
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-700" />
            <span>Periodic Stock Count &amp; Variance Reconciliation</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Conduct blind or sheet-based counts. Discrepancies generate formal Director adjustment requests.
          </p>
        </div>

        <button
          onClick={handleSubmitStockTakeApproval}
          className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors shadow-xs"
        >
          Submit Count to Director
        </button>
      </div>

      {/* Variance Alert Banner */}
      {discrepancies.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs flex items-center justify-between text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>{discrepancies.length} Variance(s) Detected:</strong> Net Cost Variance of{' '}
              <strong className="font-mono">{formatUGX(totalVarianceCostUGX)}</strong>.
            </span>
          </div>
          <span className="text-[11px] font-semibold text-amber-800">
            Requires Director sign-off
          </span>
        </div>
      )}

      {/* Count Sheet Grid */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Medicine Description</th>
                <th className="py-2.5 px-4 font-semibold">Batch Lot #</th>
                <th className="py-2.5 px-4 font-semibold">Location</th>
                <th className="py-2.5 px-4 font-semibold">Expiry Date</th>
                <th className="py-2.5 px-4 font-semibold text-right">System Ledger Qty</th>
                <th className="py-2.5 px-4 font-semibold text-right">Physical Count</th>
                <th className="py-2.5 px-4 font-semibold text-right">Variance Units</th>
                <th className="py-2.5 px-4 font-semibold text-right">Cost Variance (UGX)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {variances.map(v => (
                <tr key={v.batch.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    {v.product?.brandName || 'Product'}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-800">
                    {v.batch.batchNumber}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-600">
                    {v.batch.location}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-500">
                    {formatDate(v.batch.expiryDate)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {v.expected}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <input
                      type="number"
                      min="0"
                      value={v.counted}
                      onChange={e => handleCountChange(v.batch.id, Number(e.target.value))}
                      className="w-20 p-1 border border-slate-300 rounded text-right font-mono font-bold text-xs"
                    />
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold tabular-nums">
                    <span
                      className={
                        v.diff > 0
                          ? 'text-emerald-700'
                          : v.diff < 0
                          ? 'text-rose-700'
                          : 'text-slate-400'
                      }
                    >
                      {v.diff > 0 ? `+${v.diff}` : v.diff}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold">
                    <span
                      className={
                        v.diffValueUGX > 0
                          ? 'text-emerald-700'
                          : v.diffValueUGX < 0
                          ? 'text-rose-700'
                          : 'text-slate-400'
                      }
                    >
                      {formatUGX(v.diffValueUGX)}
                    </span>
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
