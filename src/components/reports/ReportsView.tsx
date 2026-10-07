import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatUGX, formatDateTime, formatDate } from '../../services/formatters';
import { getDaysUntilExpiry } from '../../services/fefo';
import {
  BarChart3,
  TrendingUp,
  Download,
  DollarSign,
  FileText,
  AlertTriangle,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { sales, batches, products, currentShift, settings } = useApp();
  const [activeTab, setActiveTab] = useState<'sales' | 'valuation' | 'expiry' | 'efris'>('sales');

  // Sales totals
  const totalSalesUGX = sales.reduce((s, sale) => s + sale.totalUGX, 0) + currentShift.totalSalesUGX;
  const cashSalesUGX =
    sales.flatMap(s => s.payments).filter(p => p.method === 'cash').reduce((s, p) => s + p.amountUGX, 0) +
    currentShift.cashSalesUGX;
  const mtnSalesUGX =
    sales.flatMap(s => s.payments).filter(p => p.method === 'mtn_momo').reduce((s, p) => s + p.amountUGX, 0) +
    currentShift.mtnMoMoSalesUGX;
  const airtelSalesUGX =
    sales.flatMap(s => s.payments).filter(p => p.method === 'airtel_money').reduce((s, p) => s + p.amountUGX, 0) +
    currentShift.airtelSalesUGX;
  const cardSalesUGX =
    sales.flatMap(s => s.payments).filter(p => p.method === 'card').reduce((s, p) => s + p.amountUGX, 0) +
    currentShift.cardSalesUGX;

  // Stock Valuation
  const totalCostValuationUGX = batches.reduce((sum, b) => sum + b.quantityOnHand * b.costPriceUGX, 0);
  const totalRetailValuationUGX = batches.reduce((sum, b) => {
    const prod = products.find(p => p.id === b.productId);
    return sum + b.quantityOnHand * (prod?.retailPriceUGX || b.costPriceUGX);
  }, 0);
  const potentialGrossProfitUGX = totalRetailValuationUGX - totalCostValuationUGX;

  // Expiry risk metrics
  const expiredBatches = batches.filter(b => getDaysUntilExpiry(b.expiryDate) <= 0 && b.quantityOnHand > 0);
  const criticalBatches = batches.filter(
    b => getDaysUntilExpiry(b.expiryDate) > 0 && getDaysUntilExpiry(b.expiryDate) <= 30 && b.quantityOnHand > 0
  );
  const warningBatches = batches.filter(
    b => getDaysUntilExpiry(b.expiryDate) > 30 && getDaysUntilExpiry(b.expiryDate) <= 60 && b.quantityOnHand > 0
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-700" />
            <span>Business Intelligence &amp; URA EFRIS Fiscal Reports</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time financial reconciliation, stock valuation, margin analysis &amp; fiscal audit logs.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 text-xs border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-3.5 py-1.5 rounded-md font-semibold transition-colors ${
            activeTab === 'sales'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Daily Sales &amp; Channels
        </button>
        <button
          onClick={() => setActiveTab('valuation')}
          className={`px-3.5 py-1.5 rounded-md font-semibold transition-colors ${
            activeTab === 'valuation'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Stock Valuation &amp; Margins
        </button>
        <button
          onClick={() => setActiveTab('expiry')}
          className={`px-3.5 py-1.5 rounded-md font-semibold transition-colors ${
            activeTab === 'expiry'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Expiry Risk Exposure
        </button>
        <button
          onClick={() => setActiveTab('efris')}
          className={`px-3.5 py-1.5 rounded-md font-semibold transition-colors ${
            activeTab === 'efris'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          URA EFRIS Fiscal Audit
        </button>
      </div>

      {/* TAB 1: SALES & CHANNELS */}
      {activeTab === 'sales' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500 uppercase font-medium">Physical Cash</span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                {formatUGX(cashSalesUGX)}
              </div>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500 uppercase font-medium">MTN Mobile Money</span>
              <div className="text-xl font-bold font-mono text-amber-700 mt-1 tabular-nums">
                {formatUGX(mtnSalesUGX)}
              </div>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500 uppercase font-medium">Airtel Money</span>
              <div className="text-xl font-bold font-mono text-rose-700 mt-1 tabular-nums">
                {formatUGX(airtelSalesUGX)}
              </div>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500 uppercase font-medium">POS Card &amp; Terminal</span>
              <div className="text-xl font-bold font-mono text-indigo-700 mt-1 tabular-nums">
                {formatUGX(cardSalesUGX)}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3">
              Daily Trading Summary &amp; Accountant Export
            </h3>
            <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Total Gross Turnover:</span>
                <span className="font-bold font-mono text-slate-900 tabular-nums">
                  {formatUGX(totalSalesUGX)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Total Transactions Count:</span>
                <span className="font-bold font-mono text-slate-900 tabular-nums">
                  {sales.length + 1}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Tax Collected (URA VAT):</span>
                <span className="font-bold font-mono text-slate-900 tabular-nums">
                  {formatUGX(sales.reduce((s, a) => s + a.taxUGX, 0))}
                </span>
              </div>
              <div className="flex justify-between py-1 font-bold text-sm text-emerald-900 pt-2">
                <span>Net Sales Realized:</span>
                <span className="font-mono tabular-nums">{formatUGX(totalSalesUGX)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VALUATION & MARGINS */}
      {activeTab === 'valuation' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500 uppercase font-medium">Valuation (Cost Basis)</span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                {formatUGX(totalCostValuationUGX)}
              </div>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500 uppercase font-medium">Valuation (Retail Yield)</span>
              <div className="text-xl font-bold font-mono text-emerald-800 mt-1 tabular-nums">
                {formatUGX(totalRetailValuationUGX)}
              </div>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500 uppercase font-medium">Projected Gross Margin</span>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
                {formatUGX(potentialGrossProfitUGX)}{' '}
                <span className="text-xs font-normal">
                  ({Math.round((potentialGrossProfitUGX / (totalRetailValuationUGX || 1)) * 100)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
              Product Margins &amp; Contribution Analysis
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 font-semibold">Medicine</th>
                    <th className="p-2.5 font-semibold">Category</th>
                    <th className="p-2.5 font-semibold text-right">Cost Price (UGX)</th>
                    <th className="p-2.5 font-semibold text-right">Retail Price (UGX)</th>
                    <th className="p-2.5 font-semibold text-right">Wholesale Price</th>
                    <th className="p-2.5 font-semibold text-right">Retail Gross Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {products.map(p => {
                    const marginUGX = p.retailPriceUGX - p.costPriceUGX;
                    const marginPercent = Math.round((marginUGX / p.retailPriceUGX) * 100);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">{p.brandName}</td>
                        <td className="p-2.5 text-slate-600">{p.category}</td>
                        <td className="p-2.5 text-right font-mono tabular-nums text-slate-600">
                          {formatUGX(p.costPriceUGX)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatUGX(p.retailPriceUGX)}
                        </td>
                        <td className="p-2.5 text-right font-mono text-emerald-800 tabular-nums">
                          {formatUGX(p.wholesalePriceUGX)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-700 tabular-nums">
                          {formatUGX(marginUGX)} ({marginPercent}%)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EXPIRY RISK */}
      {activeTab === 'expiry' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
              <span className="text-xs text-rose-800 font-bold uppercase">Expired Lots (Blocked)</span>
              <div className="text-xl font-bold font-mono text-rose-900 mt-1 tabular-nums">
                {expiredBatches.length} lots
              </div>
              <p className="text-[11px] text-rose-700 mt-1">Requires formal Director write-off</p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-xs text-amber-800 font-bold uppercase">&lt; 30 Days (Critical)</span>
              <div className="text-xl font-bold font-mono text-amber-900 mt-1 tabular-nums">
                {criticalBatches.length} lots
              </div>
              <p className="text-[11px] text-amber-700 mt-1">FEFO prioritized at counter</p>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <span className="text-xs text-yellow-800 font-bold uppercase">31 - 60 Days (Warning)</span>
              <div className="text-xl font-bold font-mono text-yellow-900 mt-1 tabular-nums">
                {warningBatches.length} lots
              </div>
              <p className="text-[11px] text-yellow-700 mt-1">Check supplier return agreements</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EFRIS FISCAL AUDIT */}
      {activeTab === 'efris' && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  URA EFRIS System-to-System Fiscal Device Status
                </h3>
              </div>
              <p className="text-slate-500 mt-0.5">
                Device Serial: <strong className="font-mono text-slate-800">{settings.efrisDeviceNumber}</strong> · TIN: <strong className="font-mono text-slate-800">{settings.tinNumber}</strong>
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded font-bold text-xs">
              EFRIS ONLINE (SYNC ACTIVE)
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="p-2.5 font-semibold">Fiscal Invoice #</th>
                    <th className="p-2.5 font-semibold">Date &amp; Time</th>
                    <th className="p-2.5 font-semibold">Buyer Name</th>
                    <th className="p-2.5 font-semibold">Verification Code</th>
                    <th className="p-2.5 font-semibold">Anti-Tamper Signature</th>
                    <th className="p-2.5 font-semibold text-right">Taxable UGX</th>
                    <th className="p-2.5 font-semibold text-right">VAT UGX</th>
                    <th className="p-2.5 font-semibold text-right">Gross Total UGX</th>
                    <th className="p-2.5 font-semibold text-center">URA Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {sales.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-900">
                        {s.efrisRecord.fiscalInvoiceNumber}
                      </td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-500">
                        {formatDateTime(s.timestamp)}
                      </td>
                      <td className="p-2.5 font-medium text-slate-800">{s.customerName}</td>
                      <td className="p-2.5 font-mono text-emerald-800 font-bold">
                        {s.efrisRecord.verificationCode}
                      </td>
                      <td className="p-2.5 font-mono text-[10px] text-slate-500 truncate max-w-xs">
                        {s.efrisRecord.antiTamperSignature}
                      </td>
                      <td className="p-2.5 text-right font-mono tabular-nums">
                        {formatUGX(s.efrisRecord.taxableAmountUGX)}
                      </td>
                      <td className="p-2.5 text-right font-mono tabular-nums text-slate-600">
                        {formatUGX(s.efrisRecord.taxAmountUGX)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatUGX(s.efrisRecord.grossAmountUGX)}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          Validated
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
