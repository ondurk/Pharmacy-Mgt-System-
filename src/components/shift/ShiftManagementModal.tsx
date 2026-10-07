import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatUGX, formatDateTime } from '../../services/formatters';
import { Coins, Clock, CheckCircle2, AlertTriangle, Printer, X, DollarSign } from 'lucide-react';

export const ShiftManagementModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { currentShift, openShift, closeShift, currentUser } = useApp();

  const [openingFloat, setOpeningFloat] = useState<number>(100000);
  const [actualCountedCash, setActualCountedCash] = useState<number>(
    currentShift.expectedCashInDrawerUGX || 100000
  );
  const [shiftNotes, setShiftNotes] = useState('Counter 1 end of shift cash count verified.');

  const isShiftOpen = currentShift.status === 'open';
  const variance = actualCountedCash - currentShift.expectedCashInDrawerUGX;

  const handleOpenNewShift = () => {
    openShift(openingFloat, 'New Counter Shift');
    onClose();
  };

  const handleCloseShift = () => {
    closeShift(actualCountedCash, shiftNotes);
    alert(
      `Shift closed successfully!\nExpected Cash: ${formatUGX(currentShift.expectedCashInDrawerUGX)}\nCounted Cash: ${formatUGX(actualCountedCash)}\nVariance: ${formatUGX(variance)}`
    );
    onClose();
  };

  const handlePrintZReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-5 space-y-4 text-xs max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-sm">
              Cashier Shift Management &amp; Reconciliation
            </h3>
          </div>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {isShiftOpen ? (
          <div className="space-y-4">
            {/* Active Shift Overview */}
            <div className="p-3 bg-emerald-50 rounded border border-emerald-200 space-y-1.5 text-xs text-emerald-950">
              <div className="flex items-center justify-between">
                <span className="font-medium">Active Cashier:</span>
                <strong className="font-bold">{currentShift.cashierName}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Shift Opened:</span>
                <span>{formatDateTime(currentShift.openedAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Opening Cash Float:</span>
                <span className="font-mono font-bold">{formatUGX(currentShift.openingFloatUGX)}</span>
              </div>
            </div>

            {/* Shift Takings Breakdown */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
                Shift Takings by Payment Channel
              </h4>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded divide-y divide-slate-200 space-y-2">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-600">Cash Received from Sales:</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {formatUGX(currentShift.cashSalesUGX)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-600">MTN Mobile Money Sales:</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {formatUGX(currentShift.mtnMoMoSalesUGX)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-600">Airtel Money Sales:</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {formatUGX(currentShift.airtelSalesUGX)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-600">Card / POS Terminal Sales:</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {formatUGX(currentShift.cardSalesUGX)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 font-bold text-slate-900 text-sm">
                  <span>Gross Sales Total:</span>
                  <span className="font-mono text-emerald-800 tabular-nums">
                    {formatUGX(currentShift.totalSalesUGX)}
                  </span>
                </div>
              </div>
            </div>

            {/* Cash Drawer Reconciliation */}
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg space-y-3">
              <h4 className="font-bold text-slate-900 text-xs flex items-center justify-between">
                <span>Closing Cash Drawer Reconciliation</span>
                <span className="text-[11px] text-slate-500 font-normal">Opening Float + Cash Sales</span>
              </h4>

              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">Expected Physical Cash:</span>
                <span className="font-mono font-bold text-base text-slate-900 tabular-nums">
                  {formatUGX(currentShift.expectedCashInDrawerUGX)}
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Physical Cash Counted in Till (UGX) *
                </label>
                <input
                  type="number"
                  value={actualCountedCash}
                  onChange={e => setActualCountedCash(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded font-mono text-base font-bold text-slate-900"
                />
              </div>

              <div className="p-2.5 rounded bg-white border border-slate-200 flex items-center justify-between font-bold text-xs">
                <span>Cash Variance (Counted - Expected):</span>
                <span
                  className={`font-mono text-sm tabular-nums ${
                    variance === 0
                      ? 'text-emerald-700'
                      : variance > 0
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }`}
                >
                  {variance === 0
                    ? 'UGX 0 (Perfect Match)'
                    : variance > 0
                    ? `+${formatUGX(variance)} (Overage)`
                    : `${formatUGX(variance)} (Shortage)`}
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Cashier Closing Notes
                </label>
                <input
                  type="text"
                  value={shiftNotes}
                  onChange={e => setShiftNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrintZReport}
                className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Z-Report</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCloseShift}
                  className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded font-bold shadow-xs"
                >
                  Confirm &amp; Close Shift
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-900 text-xs">
              No cashier shift is currently open. Enter opening cash float to begin trading.
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Opening Float in Cash Drawer (UGX)
              </label>
              <input
                type="number"
                value={openingFloat}
                onChange={e => setOpeningFloat(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded font-mono text-base font-bold"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleOpenNewShift}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold shadow-xs"
              >
                Open Cashier Shift
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
