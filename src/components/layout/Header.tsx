import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Menu, LogOut, Search, ShoppingCart, UserRound, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onOpenShiftModal: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenShiftModal, onLogout }) => {
  const { settings, currentUser, setActiveView, approvals, batches, resetDatabaseToDefault } = useApp();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const alerts = approvals.filter(a => a.status === 'pending').length
    + batches.filter(b => b.quantityOnHand > 0).slice(0, 14).length;

  return (
    <header className="sticky top-0 z-40 shadow-lg">
      <div className="h-16 bg-[#062b57] text-white flex items-center justify-between border-b border-blue-950">
        <div className="h-full flex items-center">
          <button className="h-16 w-14 flex items-center justify-center bg-[#07366e] border-r border-blue-950" aria-label="Toggle menu">
            <Menu className="w-5 h-5" />
          </button>
          <button onClick={() => setActiveView('dashboard')} className="h-16 px-4 flex items-center bg-[#041b17] border-r border-blue-950">
            <img src={settings.logoDataUrl || '/assets/esart-pharmacy-logo.jpg'} alt="Esart Pharmacy" className="h-12 w-32 object-contain rounded-sm border border-emerald-900/60 bg-[#05251f]" />
          </button>
        </div>

        <div className="hidden md:flex items-center flex-1 max-w-xl mx-6">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-blue-200 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="w-full bg-[#021a35] border border-blue-800/70 rounded-sm pl-9 pr-3 py-2 text-sm text-white placeholder:text-blue-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              placeholder="Search medicine, batch, customer, supplier, receipt..."
              onKeyDown={e => { if (e.key === 'Enter') setActiveView('catalogue'); }}
            />
          </div>
        </div>

        <div className="h-full flex items-center">
          <button onClick={() => setActiveView('pos')} className="h-full px-4 border-l border-blue-900 hover:bg-[#07366e] flex items-center gap-2 text-sm font-semibold">
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">POS - Retail</span>
          </button>
          <button className="relative h-full px-4 border-l border-blue-900 hover:bg-[#07366e]" onClick={() => setActiveView('batches')}>
            <Bell className="w-5 h-5" />
            {alerts > 0 && <span className="absolute top-3 right-2 text-[10px] bg-red-700 rounded px-1 font-bold">{alerts}</span>}
          </button>
          <button onClick={onOpenShiftModal} className="hidden lg:flex h-full px-4 border-l border-blue-900 hover:bg-[#07366e] items-center text-xs">
            Shift Open
          </button>
          <div className="relative h-full">
            <button onClick={() => setShowUserMenu(v => !v)} className="h-full px-4 border-l border-blue-900 hover:bg-[#07366e] flex items-center gap-2">
              <UserRound className="w-5 h-5" />
              <span className="hidden md:block text-left leading-tight">
                <span className="block text-xs font-bold">{currentUser.name}</span>
                <span className="block text-[10px] uppercase text-emerald-300">{currentUser.role}</span>
              </span>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full w-56 bg-[#1f1f1f] border border-slate-700 shadow-2xl py-2 text-sm">
                <button onClick={() => { resetDatabaseToDefault(); setShowUserMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-slate-800 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Reset demo data
                </button>
                <button onClick={onLogout} className="w-full px-4 py-2 text-left text-red-300 hover:bg-red-950 flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
