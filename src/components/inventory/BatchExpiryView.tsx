import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getDaysUntilExpiry, getExpiryStatus } from '../../services/fefo';
import { formatUGX, formatDate } from '../../services/formatters';
import { StockBatch } from '../../types';
import {
  Clock,
  Search,
  Filter,
  AlertOctagon,
  Trash2,
  X,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

export const BatchExpiryView: React.FC = () => {
  const { batches, products, suppliers, currentUser, requestApproval } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedBatchForWriteOff, setSelectedBatchForWriteOff] = useState<StockBatch | null>(null);
  const [writeOffReason, setWriteOffReason] = useState('Expired past manufacturer shelf-life. Safe disposal quarantine under NDA.');

  // Sort batches by FEFO (earliest expiry first)
  const sortedBatches = [...batches].sort(
    (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
  );

  const filteredBatches = sortedBatches.filter(b => {
    const prod = products.find(p => p.id === b.productId);
    const days = getDaysUntilExpiry(b.expiryDate);

    if (locationFilter !== 'all' && b.location !== locationFilter) return false;

    if (statusFilter === 'expired' && days > 0) return false;
    if (statusFilter === 'critical_30' && (days <= 0 || days > 30)) return false;
    if (statusFilter === 'warning_60' && (days <= 30 || days > 60)) return false;
    if (statusFilter === 'notice_90' && (days <= 60 || days > 90)) return false;
    if (statusFilter === 'safe' && days <= 90) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.batchNumber.toLowerCase().includes(q) ||
      (prod && prod.brandName.toLowerCase().includes(q)) ||
      (prod && prod.genericName.toLowerCase().includes(q))
    );
  });

  const handleOpenWriteOff = (batch: StockBatch) => {
    setSelectedBatchForWriteOff(batch);
    const days = getDaysUntilExpiry(batch.expiryDate);
    setWriteOffReason(
      days <= 0
        ? `Expired batch on ${formatDate(batch.expiryDate)}. Unfit for dispensing; quarantine for regulatory disposal.`
        : `Physical damage / container compromise for batch ${batch.batchNumber}.`
    );
  };

  const handleSubmitWriteOffRequest = () => {
    if (!selectedBatchForWriteOff) return;
    const prod = products.find(p => p.id === selectedBatchForWriteOff.productId);
    const amountVal = selectedBatchForWriteOff.quantityOnHand * selectedBatchForWriteOff.costPriceUGX;

    requestApproval({
      requestType: 'write_off',
      requestedByUserId: currentUser.id,
      requestedByUserName: currentUser.name,
      title: `Stock Write-Off: ${prod?.brandName || 'Product'} (Batch ${selectedBatchForWriteOff.batchNumber})`,
      details: `${writeOffReason}. Quantity: ${selectedBatchForWriteOff.quantityOnHand} units at cost ${formatUGX(amountVal)}. Location: ${selectedBatchForWriteOff.location}.`,
      amountUGX: amountVal,
      relatedRecordId: selectedBatchForWriteOff.id,
    });

    setSelectedBatchForWriteOff(null);
    alert(
      `Write-off request submitted to Director Approvals queue for ${formatUGX(amountVal)}.\nDual control rule applies: Requester cannot self-approve.`
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-700" />
            <span>Batch Inventory &amp; FEFO Expiry Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict First-Expiry-First-Out enforcement. Automatic sale lockout on expired stock.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center gap-3 shadow-xs text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by batch lot #, product brand or generic..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-500 font-medium">Expiry Risk Window:</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="py-1.5 px-2 border border-slate-300 rounded bg-white font-medium"
          >
            <option value="all">All Batches</option>
            <option value="expired">Expired (Strictly Blocked)</option>
            <option value="critical_30">&lt; 30 Days (Critical)</option>
            <option value="warning_60">31 - 60 Days (Warning)</option>
            <option value="notice_90">61 - 90 Days (Notice)</option>
            <option value="safe">&gt; 90 Days (Safe)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-500 font-medium">Location:</label>
          <select
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            className="py-1.5 px-2 border border-slate-300 rounded bg-white font-medium"
          >
            <option value="all">All Locations</option>
            <option value="Shop Floor">Shop Floor</option>
            <option value="Main Store">Main Store</option>
          </select>
        </div>
      </div>

      {/* Batches Data Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Batch / Lot #</th>
                <th className="py-2.5 px-4 font-semibold">Medicine Description</th>
                <th className="py-2.5 px-4 font-semibold">Location</th>
                <th className="py-2.5 px-4 font-semibold">Expiry Date</th>
                <th className="py-2.5 px-4 font-semibold">FEFO Risk Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Units On Hand</th>
                <th className="py-2.5 px-4 font-semibold text-right">Unit Cost (UGX)</th>
                <th className="py-2.5 px-4 font-semibold text-right">Total Cost Value</th>
                <th className="py-2.5 px-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredBatches.map(batch => {
                const prod = products.find(p => p.id === batch.productId);
                const days = getDaysUntilExpiry(batch.expiryDate);
                const expiryInfo = getExpiryStatus(batch.expiryDate);
                const isExpired = days <= 0;

                return (
                  <tr
                    key={batch.id}
                    className={`transition-colors ${
                      isExpired ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      {batch.batchNumber}
                    </td>

                    <td className="py-2.5 px-4">
                      <div className="font-bold text-slate-900">{prod?.brandName || 'Product'}</div>
                      <div className="text-[11px] text-slate-500 italic">
                        {prod?.genericName} {prod?.strength ? `· ${prod?.strength}` : ''}
                      </div>
                    </td>

                    <td className="py-2.5 px-4 font-medium text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                        {batch.location}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 font-mono">
                      <span className={isExpired ? 'font-bold text-rose-700' : 'text-slate-800'}>
                        {formatDate(batch.expiryDate)}
                      </span>
                    </td>

                    <td className="py-2.5 px-4">
                      {isExpired ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded">
                          <AlertOctagon className="w-3 h-3" />
                          <span>EXPIRED (SALE BLOCKED)</span>
                        </span>
                      ) : days <= 30 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3" />
                          <span>Expires in {days}d (Critical)</span>
                        </span>
                      ) : days <= 60 ? (
                        <span className="text-[11px] font-medium text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded">
                          Expires in {days}d (Warning)
                        </span>
                      ) : days <= 90 ? (
                        <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          Expires in {days}d (Notice)
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          Safe ({days}d remaining)
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 text-right font-bold font-mono tabular-nums text-slate-900">
                      {batch.quantityOnHand} {prod?.baseUnit || 'units'}
                    </td>

                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                      {formatUGX(batch.costPriceUGX)}
                    </td>

                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {formatUGX(batch.quantityOnHand * batch.costPriceUGX)}
                    </td>

                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenWriteOff(batch)}
                        className="px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100 transition-colors"
                        title="Submit write-off authorization request to Director"
                      >
                        Request Write-Off
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* WRITE-OFF REQUEST MODAL */}
      {selectedBatchForWriteOff && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Stock Write-Off Authorization Request
                </h3>
              </div>
              <button onClick={() => setSelectedBatchForWriteOff(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <p className="text-slate-600">
              Per Esart SOP &amp; Uganda NDA guidelines, stock write-offs require formal Director
              sign-off before items can be deducted from the inventory ledger.
            </p>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
              <div>
                <span className="text-slate-500">Medicine:</span>{' '}
                <strong className="text-slate-900">
                  {products.find(p => p.id === selectedBatchForWriteOff.productId)?.brandName}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Batch Lot:</span>{' '}
                <strong className="font-mono">{selectedBatchForWriteOff.batchNumber}</strong>
              </div>
              <div>
                <span className="text-slate-500">Expiry Date:</span>{' '}
                <span>{formatDate(selectedBatchForWriteOff.expiryDate)}</span>
              </div>
              <div>
                <span className="text-slate-500">Units to Quarantine:</span>{' '}
                <strong className="font-mono">{selectedBatchForWriteOff.quantityOnHand} units</strong>
              </div>
              <div>
                <span className="text-slate-500">Financial Loss:</span>{' '}
                <strong className="text-rose-700 font-mono">
                  {formatUGX(
                    selectedBatchForWriteOff.quantityOnHand * selectedBatchForWriteOff.costPriceUGX
                  )}
                </strong>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Reason / Disposal Category *
              </label>
              <textarea
                value={writeOffReason}
                onChange={e => setWriteOffReason(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded h-20"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedBatchForWriteOff(null)}
                className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitWriteOffRequest}
                className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded font-bold shadow-xs"
              >
                Submit to Director
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
