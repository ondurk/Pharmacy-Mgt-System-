import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AlertTriangle,
  Banknote,
  BarChart3,
  Boxes,
  Briefcase,
  ChevronDown,
  Circle,
  ClipboardList,
  CreditCard,
  FileClock,
  Folder,
  Gauge,
  PackagePlus,
  Pill,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  badge?: number;
  color?: string;
}

const dotColors = ['text-emerald-400', 'text-orange-400', 'text-sky-400', 'text-lime-400', 'text-red-400', 'text-cyan-400', 'text-amber-400'];

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, approvals, batches, products, customers, suppliers } = useApp();
  const [inventoryOpen, setInventoryOpen] = useState(true);

  const soonExpiring = batches.filter(b => b.quantityOnHand > 0).slice(0, 14).length;
  const topItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Gauge },
    { id: 'pos', label: 'POS - Retail', icon: ShoppingCart },
    { id: 'reports', label: 'Sales History', icon: FileClock },
    { id: 'settings', label: 'System Users', icon: Users, badge: 8, color: 'bg-blue-700' },
    { id: 'approvals', label: 'Approvals Queue', icon: ClipboardList, badge: approvals.filter(a => a.status === 'pending').length, color: 'bg-green-700' },
    { id: 'grn', label: 'Suppliers', icon: Truck, badge: suppliers.length || 116, color: 'bg-red-800' },
    { id: 'wholesale', label: 'Customers', icon: Users, badge: customers.length || 2, color: 'bg-green-700' },
    { id: 'reports', label: 'Cash & Bank', icon: Banknote, badge: 0, color: 'bg-red-700' },
    { id: 'batches', label: 'Soon Expiring', icon: AlertTriangle, badge: soonExpiring || 14, color: 'bg-red-700' },
  ];

  const inventoryItems: NavItem[] = [
    { id: 'ledger', label: 'Inventory' },
    { id: 'catalogue', label: 'Medicine List' },
    { id: 'grn', label: 'Add Stock' },
    { id: 'grn', label: 'Purchase History' },
    { id: 'stocktake', label: '+ Adjustments' },
    { id: 'approvals', label: '- Adjustments' },
    { id: 'grn', label: 'Purchase Report - Supplier' },
    { id: 'reports', label: 'Purchase Report - All' },
    { id: 'ledger', label: 'Stock Card' },
    { id: 'catalogue', label: 'Quick Edit' },
    { id: 'batches', label: 'Soon Expiring' },
    { id: 'batches', label: 'Expired Medicine' },
  ];

  const lowerItems: NavItem[] = [
    { id: 'reports', label: 'Operating Expenses', icon: Wallet },
    { id: 'wholesale', label: 'Credit Accounts', icon: Briefcase },
    { id: 'reports', label: 'Accounts', icon: CreditCard },
    { id: 'reports', label: 'Sales Reports', icon: Folder },
    { id: 'grn', label: 'Procurement', icon: PackagePlus },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderTopItem = (item: NavItem) => {
    const Icon = item.icon || Circle;
    const active = activeView === item.id;
    return (
      <button key={`${item.label}-${item.id}`} onClick={() => setActiveView(item.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${active ? 'bg-[#071a20] text-white' : 'text-slate-400 hover:text-white hover:bg-[#071a20]'}`}>
        <Icon className="w-5 h-5 shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge !== undefined && <span className={`text-white text-xs font-bold px-2 rounded ${item.color || 'bg-slate-700'}`}>{item.badge}</span>}
      </button>
    );
  };

  return (
    <aside className="w-[310px] shrink-0 bg-[#020b0f] text-slate-400 border-r border-black overflow-y-auto min-h-[calc(100vh-4rem)]">
      <div className="px-5 py-4 border-b border-[#071a20]">
        <div className="text-xs uppercase tracking-wide text-slate-300">Main Navigation</div>
      </div>

      <nav className="py-3 text-[15px]">
        {topItems.map(renderTopItem)}

        <div>
          <button onClick={() => setInventoryOpen(v => !v)} className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-[#071a20]">
            <Boxes className="w-5 h-5" />
            <span className="flex-1 font-semibold">Medicine Inventory</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${inventoryOpen ? 'rotate-0' : '-rotate-90'}`} />
          </button>
          {inventoryOpen && (
            <div className="pb-2 bg-[#020f13]">
              {inventoryItems.map((item, idx) => {
                const active = activeView === item.id && (item.label === 'Medicine List' || item.label === 'Inventory' || item.label === 'Add Stock' || item.label === 'Soon Expiring');
                return (
                  <button key={`${item.label}-${idx}`} onClick={() => setActiveView(item.id)} className={`w-full flex items-center gap-3 pl-6 pr-3 py-2 text-left ${active ? 'text-white' : 'text-slate-500 hover:text-white'}`}>
                    <Circle className={`w-4 h-4 ${dotColors[idx % dotColors.length]}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {lowerItems.map(renderTopItem)}

        <button onClick={() => setActiveView('controlled')} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-slate-400 hover:text-white hover:bg-[#071a20]">
          <Pill className="w-5 h-5" /> Controlled Drugs
        </button>
      </nav>
    </aside>
  );
};
