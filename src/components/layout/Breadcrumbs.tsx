import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Breadcrumbs: React.FC = () => {
  const { activeView, setActiveView, settings } = useApp();

  const viewTitles: Record<string, string> = {
    dashboard: 'Operational Dashboard',
    pos: 'Point of Sale (Counter POS)',
    catalogue: 'Product Catalogue & Pricing',
    batches: 'Batch Ledger & FEFO Expiry Tracking',
    ledger: 'Immutable Stock Movement Ledger',
    grn: 'Goods Received Notes (GRN Intake)',
    controlled: 'National Drug Authority Controlled Register',
    recall: 'Batch Traceability & Customer Recall',
    stocktake: 'Periodic Stock Count & Reconciliation',
    wholesale: 'Wholesale Orders & Delivery Notes',
    approvals: 'Director Approvals & Dual-Control Queue',
    shifts: 'Cashier Shift Reconciliation',
    reports: 'Business Intelligence & URA EFRIS Fiscal Reports',
    import: 'Excel / CSV Data Import & Opening Stock',
    settings: 'Company Configuration & Database Backups',
  };

  const currentLabel = viewTitles[activeView] || 'Overview';

  return (
    <div className="mb-5 bg-[#202020] border border-slate-700 px-5 py-3 flex items-center justify-between text-sm text-slate-400 shadow">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveView('dashboard')}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          <Home className="w-3.5 h-3.5 text-slate-400" />
          <span>Home</span>
        </button>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="capitalize font-medium text-slate-300">
          Pharmacy
        </span>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="font-semibold text-white">{currentLabel}</span>
      </div>

      <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
        <span>Currency: <strong className="text-slate-200">{settings.currencyCode}</strong></span>
        <span>·</span>
        <span>URA EFRIS: <strong className="text-emerald-700 font-medium">Ready (Active)</strong></span>
      </div>
    </div>
  );
};
