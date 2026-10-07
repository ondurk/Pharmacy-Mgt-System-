import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Breadcrumbs } from './components/layout/Breadcrumbs';
import { Dashboard } from './components/dashboard/Dashboard';
import { PosScreen } from './components/pos/PosScreen';
import { ThermalReceiptModal } from './components/pos/ThermalReceiptModal';
import { ProductCatalogue } from './components/inventory/ProductCatalogue';
import { BatchExpiryView } from './components/inventory/BatchExpiryView';
import { StockLedgerView } from './components/inventory/StockLedgerView';
import { GoodsReceivedNoteView } from './components/purchasing/GoodsReceivedNoteView';
import { ControlledRegisterView } from './components/compliance/ControlledRegisterView';
import { BatchRecallView } from './components/inventory/BatchRecallView';
import { StockTakeView } from './components/inventory/StockTakeView';
import { WholesaleOrdersView } from './components/wholesale/WholesaleOrdersView';
import { ApprovalsQueueView } from './components/approvals/ApprovalsQueueView';
import { ReportsView } from './components/reports/ReportsView';
import { DataImportTool } from './components/import/DataImportTool';
import { CompanySettingsView } from './components/settings/CompanySettingsView';
import { ShiftManagementModal } from './components/shift/ShiftManagementModal';
import { Sale } from './types';
import { Lock, Mail } from 'lucide-react';

const STORAGE_AUTH_KEY = 'esart_management_system_auth';

const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const { settings } = useApp();
  const [userId, setUserId] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !password.trim()) {
      setError('Enter a User ID and password.');
      return;
    }
    localStorage.setItem(STORAGE_AUTH_KEY, '1');
    onLogin();
  };

  return (
    <div className="min-h-screen bg-[#0b1018] text-slate-200 flex items-start justify-center px-6 pt-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-10">
          <div className="mx-auto w-64 overflow-hidden rounded border border-emerald-900/70 bg-[#041b17] p-1 shadow-2xl">
            <img src={settings.logoDataUrl || '/assets/esart-pharmacy-logo.jpg'} alt="Esart Pharmacy" className="h-28 w-full object-contain rounded-sm" />
          </div>
        </div>

        <form onSubmit={submit} className="bg-[#222] border border-[#333] shadow-2xl px-7 py-8">
          <p className="text-center text-lg text-slate-300 mb-2">Login to start your session</p>
          <p className="text-center text-xs text-slate-400 mb-7">Team testing: use User ID <strong>admin</strong> and any non-empty password.</p>
          <label className="relative block mb-5">
            <input value={userId} onChange={e => setUserId(e.target.value)} className="w-full bg-[#2e2e2e] border border-[#555] py-3 pl-4 pr-12 text-lg outline-none focus:border-sky-500" placeholder="User ID" />
            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
          </label>
          <label className="relative block mb-5">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#2e2e2e] border border-[#555] py-3 pl-4 pr-12 text-lg outline-none focus:border-sky-500" placeholder="Password" />
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
          </label>
          {error && <div className="text-sm text-red-300 mb-4">{error}</div>}
          <button className="bg-[#0069a6] hover:bg-[#007bc2] px-8 py-3 text-white font-semibold text-lg">Sign In</button>
          <button type="button" className="block mt-6 text-left text-orange-400 hover:text-orange-300">I forgot my password</button>
        </form>
      </div>
    </div>
  );
};

const MainLayout: React.FC = () => {
  const { activeView, sales, settings } = useApp();
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem(STORAGE_AUTH_KEY) === '1');

  const handleCompletedSale = (sale: Sale) => setActiveReceiptSale(sale);
  const handleOpenReceipt = (saleId: string) => {
    const s = sales.find(item => item.id === saleId);
    if (s) setActiveReceiptSale(s);
  };

  if (!authenticated) {
    return <LoginScreen onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <div className="pharmacy-dark min-h-screen bg-[#111820] flex flex-col font-sans text-slate-200 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <Header onOpenShiftModal={() => setIsShiftModalOpen(true)} onLogout={() => { localStorage.removeItem(STORAGE_AUTH_KEY); setAuthenticated(false); }} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 bg-[#1d2229]">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs />
            {activeView === 'dashboard' && <Dashboard onOpenReceipt={handleOpenReceipt} />}
            {activeView === 'pos' && <PosScreen onCompletedSale={handleCompletedSale} />}
            {activeView === 'catalogue' && <ProductCatalogue />}
            {activeView === 'batches' && <BatchExpiryView />}
            {activeView === 'ledger' && <StockLedgerView />}
            {activeView === 'grn' && <GoodsReceivedNoteView />}
            {activeView === 'controlled' && <ControlledRegisterView />}
            {activeView === 'recall' && <BatchRecallView />}
            {activeView === 'stocktake' && <StockTakeView />}
            {activeView === 'wholesale' && <WholesaleOrdersView />}
            {activeView === 'approvals' && <ApprovalsQueueView />}
            {activeView === 'shifts' && (
              <div className="space-y-4">
                <div className="bg-[#242424] p-6 border border-slate-700 shadow-xs flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white">Shift Reconciliation Console</h2>
                    <p className="text-xs text-slate-400 mt-1">Manage cashier drawer balances, cash counts, and Z-Report closure summaries.</p>
                  </div>
                  <button onClick={() => setIsShiftModalOpen(true)} className="px-4 py-2 bg-[#0069a6] text-white font-bold text-xs hover:bg-[#007bc2] transition-colors">Open Drawer Reconciliation Form</button>
                </div>
              </div>
            )}
            {activeView === 'reports' && <ReportsView />}
            {activeView === 'import' && <DataImportTool />}
            {activeView === 'settings' && <CompanySettingsView />}
          </div>
        </main>
      </div>

      {activeReceiptSale && <ThermalReceiptModal sale={activeReceiptSale} settings={settings} onClose={() => setActiveReceiptSale(null)} />}
      {isShiftModalOpen && <ShiftManagementModal onClose={() => setIsShiftModalOpen(false)} />}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
