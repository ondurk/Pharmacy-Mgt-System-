import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  DollarSign,
  Clock,
  AlertTriangle,
  CheckSquare,
  TrendingUp,
  FileText,
  ShieldAlert,
  ArrowUpRight,
  Package,
  PlusCircle,
  ShoppingBag,
} from 'lucide-react';
import { formatUGX, formatDateTime } from '../../services/formatters';
import { getDaysUntilExpiry } from '../../services/fefo';

export const Dashboard: React.FC<{ onOpenReceipt: (saleId: string) => void }> = ({ onOpenReceipt }) => {
  const {
    sales,
    batches,
    products,
    approvals,
    currentShift,
    controlledEntries,
    setActiveView,
  } = useApp();

  // Calculate metrics
  const totalSalesTodayUGX = sales.reduce((sum, s) => sum + s.totalUGX, 0) + currentShift.totalSalesUGX;
  
  // Expiry buckets
  const expiringIn30Days = batches.filter(b => {
    const days = getDaysUntilExpiry(b.expiryDate);
    return b.quantityOnHand > 0 && days > 0 && days <= 30;
  });

  const expiringIn60Days = batches.filter(b => {
    const days = getDaysUntilExpiry(b.expiryDate);
    return b.quantityOnHand > 0 && days > 30 && days <= 60;
  });

  const expiringIn90Days = batches.filter(b => {
    const days = getDaysUntilExpiry(b.expiryDate);
    return b.quantityOnHand > 0 && days > 60 && days <= 90;
  });

  const expiredBatches = batches.filter(b => {
    const days = getDaysUntilExpiry(b.expiryDate);
    return b.quantityOnHand > 0 && days <= 0;
  });

  const lowStockProducts = products.filter(p => {
    const totalOnHold = batches
      .filter(b => b.productId === p.id && getDaysUntilExpiry(b.expiryDate) > 0)
      .reduce((s, b) => s + b.quantityOnHand, 0);
    return totalOnHold <= p.reorderLevel;
  });

  const pendingApprovals = approvals.filter(a => a.status === 'pending');

  const totalStockValuationCost = batches.reduce((sum, b) => sum + b.quantityOnHand * b.costPriceUGX, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Counter &amp; Operations Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time FEFO batch tracking, EFRIS fiscal sales register &amp; NDA compliance controls.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveView('pos')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-md hover:bg-emerald-800 transition-colors shadow-xs"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Launch Counter POS</span>
          </button>
          <button
            onClick={() => setActiveView('grn')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-md hover:bg-slate-200 transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-slate-500" />
            <span>Receive Goods (GRN)</span>
          </button>
          <button
            onClick={() => setActiveView('wholesale')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-md hover:bg-slate-200 transition-colors"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Wholesale Quote</span>
          </button>
        </div>
      </div>

      {/* KPI Tiles (Sentrifugo Large Grid Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Today's Sales */}
        <div
          onClick={() => setActiveView('shifts')}
          className="bg-gradient-to-br from-emerald-400 to-green-700 border border-emerald-200 rounded-lg p-5 transition-transform hover:-translate-y-0.5 cursor-pointer group shadow-lg text-white"
        >
          <div className="flex items-center justify-between text-white/90 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white/90">
              Today's Gross Sales
            </span>
            <div className="w-9 h-9 rounded-md bg-white/20 text-white flex items-center justify-center ring-1 ring-white/30">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums drop-shadow-sm">
            {formatUGX(totalSalesTodayUGX)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-white/90">
            <span>Shift drawer: {formatUGX(currentShift.expectedCashInDrawerUGX)}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        {/* Tile 2: Expiry Risk */}
        <div
          onClick={() => setActiveView('batches')}
          className="bg-gradient-to-br from-rose-400 to-red-700 border border-rose-200 rounded-lg p-5 transition-transform hover:-translate-y-0.5 cursor-pointer group shadow-lg text-white"
        >
          <div className="flex items-center justify-between text-white/90 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white/90">
              Expiring Within 60 Days
            </span>
            <div className="w-9 h-9 rounded-md bg-white/20 text-white flex items-center justify-center ring-1 ring-white/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums drop-shadow-sm">
            {expiringIn30Days.length + expiringIn60Days.length} <span className="text-sm font-normal text-white/90">batches</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-white/90">
            <span>
              {expiredBatches.length > 0 ? (
                <span className="text-white font-bold">{expiredBatches.length} expired (blocked)</span>
              ) : (
                '0 expired on shelves'
              )}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        {/* Tile 3: Low Stock Alerts */}
        <div
          onClick={() => setActiveView('catalogue')}
          className="bg-gradient-to-br from-amber-300 to-orange-600 border border-amber-200 rounded-lg p-5 transition-transform hover:-translate-y-0.5 cursor-pointer group shadow-lg text-white"
        >
          <div className="flex items-center justify-between text-white/90 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white/90">
              Low Stock Items
            </span>
            <div className="w-9 h-9 rounded-md bg-white/20 text-white flex items-center justify-center ring-1 ring-white/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums drop-shadow-sm">
            {lowStockProducts.length} <span className="text-sm font-normal text-white/90">items</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-white/90">
            <span>Stock below reorder threshold</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        {/* Tile 4: Director Approvals */}
        <div
          onClick={() => setActiveView('approvals')}
          className="bg-gradient-to-br from-sky-400 to-indigo-700 border border-sky-200 rounded-lg p-5 transition-transform hover:-translate-y-0.5 cursor-pointer group shadow-lg text-white"
        >
          <div className="flex items-center justify-between text-white/90 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white/90">
              Pending Director Approvals
            </span>
            <div className="w-9 h-9 rounded-md bg-white/20 text-white flex items-center justify-center ring-1 ring-white/30">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums drop-shadow-sm">
            {pendingApprovals.length} <span className="text-sm font-normal text-white/90">requests</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-white/90">
            <span>Dual-control segregation required</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </div>

      {/* Expiry Breakdown & Controlled Register Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expiry Status Matrix (30 / 60 / 90 Days) */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700" />
              <span>Expiry Risk Timeline</span>
            </h2>
            <button
              onClick={() => setActiveView('batches')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              View Batches
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <div
              onClick={() => setActiveView('batches')}
              className="p-3 rounded-md bg-rose-50 border border-rose-200 flex items-center justify-between cursor-pointer hover:bg-rose-100 transition-colors"
            >
              <div>
                <p className="text-xs font-bold text-rose-900">Expired Stock (Strictly Blocked)</p>
                <p className="text-[11px] text-rose-700 mt-0.5">Cannot be sold · Requires director write-off</p>
              </div>
              <div className="text-base font-bold text-rose-900 font-mono tabular-nums">
                {expiredBatches.length} batches
              </div>
            </div>

            <div
              onClick={() => setActiveView('batches')}
              className="p-3 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors"
            >
              <div>
                <p className="text-xs font-bold text-amber-900">Critical Expiry (0 - 30 Days)</p>
                <p className="text-[11px] text-amber-700 mt-0.5">Prioritized by FEFO auto-selection</p>
              </div>
              <div className="text-base font-bold text-amber-900 font-mono tabular-nums">
                {expiringIn30Days.length} batches
              </div>
            </div>

            <div
              onClick={() => setActiveView('batches')}
              className="p-3 rounded-md bg-yellow-50 border border-yellow-200 flex items-center justify-between cursor-pointer hover:bg-yellow-100 transition-colors"
            >
              <div>
                <p className="text-xs font-bold text-yellow-900">Watchlist Expiry (31 - 60 Days)</p>
                <p className="text-[11px] text-yellow-700 mt-0.5">Evaluate stock run-rate &amp; returns</p>
              </div>
              <div className="text-base font-bold text-yellow-900 font-mono tabular-nums">
                {expiringIn60Days.length} batches
              </div>
            </div>

            <div
              onClick={() => setActiveView('batches')}
              className="p-3 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <div>
                <p className="text-xs font-semibold text-slate-800">Early Notice (61 - 90 Days)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Supplier return window</p>
              </div>
              <div className="text-base font-bold text-slate-800 font-mono tabular-nums">
                {expiringIn90Days.length} batches
              </div>
            </div>
          </div>
        </div>

        {/* NDA Controlled Substances Register Summary */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-700" />
              <span>NDA Controlled Register</span>
            </h2>
            <button
              onClick={() => setActiveView('controlled')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Open Register
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">Total Controlled Transactions</span>
                <span className="font-bold text-slate-900 font-mono tabular-nums">{controlledEntries.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-slate-500">Pharmacist in Charge</span>
                <span className="font-medium text-slate-800">Demo Pharmacist</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-2 mt-2">
              <p className="font-semibold text-slate-800">Controlled Stocks on Premises:</p>
              <div className="divide-y divide-slate-100 text-xs">
                {products.filter(p => p.isControlled).map(cp => {
                  const onHand = batches
                    .filter(b => b.productId === cp.id)
                    .reduce((s, b) => s + b.quantityOnHand, 0);
                  return (
                    <div key={cp.id} className="py-1.5 flex items-center justify-between">
                      <span className="truncate pr-2">{cp.brandName}</span>
                      <span className="font-bold text-slate-900 shrink-0 font-mono tabular-nums">
                        {onHand} {cp.baseUnit}s
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Valuation & Quick Stats */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>Inventory &amp; Fiscal Health</span>
            </h2>
            <button
              onClick={() => setActiveView('reports')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Full Report
            </button>
          </div>

          <div className="mt-4 space-y-4 text-xs">
            <div>
              <span className="text-slate-500">Stock Valuation (Cost Basis)</span>
              <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                {formatUGX(totalStockValuationCost)}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Active Catalogue Size</span>
                <span className="font-semibold text-slate-900 font-mono tabular-nums">{products.length} Products</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Active Batches Tracked</span>
                <span className="font-semibold text-slate-900 font-mono tabular-nums">{batches.length} Lots</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">URA EFRIS Device</span>
                <span className="font-semibold text-emerald-700 font-mono">EFRIS-DEMO-DEVICE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Offsite Backup Health</span>
                <span className="font-semibold text-slate-900">Encrypted (Pull-based)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sales Table with Sentrifugo Data Grid */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Recent Sales &amp; Fiscal Invoices
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Every completed transaction produces a tamper-proof URA EFRIS fiscal invoice.
            </p>
          </div>
          <button
            onClick={() => setActiveView('pos')}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            + New Sale
          </button>
        </div>

        {sales.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No completed sales recorded today</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Open the Counter POS to ring up your first transaction, test FEFO batch allocation, and generate a fiscal receipt.
            </p>
            <button
              onClick={() => setActiveView('pos')}
              className="mt-4 px-4 py-2 bg-emerald-700 text-white rounded-md text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-xs"
            >
              Open Counter POS
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Invoice #</th>
                  <th className="py-2.5 px-4 font-semibold">Time</th>
                  <th className="py-2.5 px-4 font-semibold">Customer</th>
                  <th className="py-2.5 px-4 font-semibold">Items</th>
                  <th className="py-2.5 px-4 font-semibold">Payment Mode</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Total (UGX)</th>
                  <th className="py-2.5 px-4 font-semibold">URA EFRIS Status</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sales.slice(0, 8).map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {formatDateTime(sale.timestamp)}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">
                      {sale.customerName}
                    </td>
                    <td className="py-2.5 px-4">
                      {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}
                    </td>
                    <td className="py-2.5 px-4 capitalize">
                      {sale.payments.map(p => p.method.replace('_', ' ')).join(', ')}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900 font-mono tabular-nums">
                      {formatUGX(sale.totalUGX)}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">
                        EFRIS Fiscalized
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => onOpenReceipt(sale.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 transition-colors"
                      >
                        Receipt Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
