import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, MedicineSchedule, UnitOfMeasure } from '../../types';
import { formatUGX } from '../../services/formatters';
import { getDaysUntilExpiry } from '../../services/fefo';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  AlertTriangle,
  Edit2,
  CheckCircle,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export const ProductCatalogue: React.FC = () => {
  const { products, batches, addProduct, updateProduct } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [brandName, setBrandName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [code, setCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [strength, setStrength] = useState('');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [packSize, setPackSize] = useState('');
  const [category, setCategory] = useState('Antibiotics');
  const [schedule, setSchedule] = useState<MedicineSchedule>('otc');
  const [ndaRegNumber, setNdaRegNumber] = useState('');
  const [baseUnit, setBaseUnit] = useState<UnitOfMeasure>('box');
  const [costPriceUGX, setCostPriceUGX] = useState<number>(10000);
  const [retailPriceUGX, setRetailPriceUGX] = useState<number>(16000);
  const [wholesalePriceUGX, setWholesalePriceUGX] = useState<number>(13000);
  const [wholesaleMinQty, setWholesaleMinQty] = useState<number>(5);
  const [reorderLevel, setReorderLevel] = useState<number>(15);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(0);

  // Compute on-hand inventory across batches
  const getProductStock = (productId: string) => {
    const pBatches = batches.filter(b => b.productId === productId);
    const validQty = pBatches
      .filter(b => getDaysUntilExpiry(b.expiryDate) > 0)
      .reduce((s, b) => s + b.quantityOnHand, 0);
    const expiredQty = pBatches
      .filter(b => getDaysUntilExpiry(b.expiryDate) <= 0)
      .reduce((s, b) => s + b.quantityOnHand, 0);
    return { validQty, expiredQty, batchCount: pBatches.length };
  };

  const filteredProducts = products.filter(p => {
    if (scheduleFilter !== 'all' && p.schedule !== scheduleFilter) return false;
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      p.brandName.toLowerCase().includes(q) ||
      p.genericName.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.barcode.includes(q) ||
      (p.ndaRegNumber && p.ndaRegNumber.toLowerCase().includes(q))
    );
  });

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setBrandName('');
    setGenericName('');
    setCode(`MED-${Math.floor(100 + Math.random() * 900)}`);
    setBarcode(`616400100${Math.floor(1000 + Math.random() * 9000)}`);
    setStrength('');
    setDosageForm('Tablet');
    setPackSize('');
    setCategory('Antibiotics');
    setSchedule('otc');
    setNdaRegNumber(`NDA/GEN/2026/${Math.floor(1000 + Math.random() * 9000)}`);
    setBaseUnit('box');
    setCostPriceUGX(10000);
    setRetailPriceUGX(16000);
    setWholesalePriceUGX(13000);
    setWholesaleMinQty(5);
    setReorderLevel(15);
    setTaxRatePercent(0);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setBrandName(p.brandName);
    setGenericName(p.genericName);
    setCode(p.code);
    setBarcode(p.barcode);
    setStrength(p.strength || '');
    setDosageForm(p.dosageForm || 'Tablet');
    setPackSize(p.packSize || '');
    setCategory(p.category);
    setSchedule(p.schedule);
    setNdaRegNumber(p.ndaRegNumber || '');
    setBaseUnit(p.baseUnit);
    setCostPriceUGX(p.costPriceUGX);
    setRetailPriceUGX(p.retailPriceUGX);
    setWholesalePriceUGX(p.wholesalePriceUGX);
    setWholesaleMinQty(p.wholesaleMinQty);
    setReorderLevel(p.reorderLevel);
    setTaxRatePercent(p.taxRatePercent);
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim() || !genericName.trim()) {
      alert('Brand name and Generic name are required.');
      return;
    }

    const payload = {
      code,
      barcode,
      brandName,
      genericName,
      strength,
      dosageForm,
      packSize,
      category,
      schedule,
      ndaRegNumber,
      baseUnit,
      costPriceUGX,
      retailPriceUGX,
      wholesalePriceUGX,
      wholesaleMinQty,
      reorderLevel,
      taxRatePercent,
      requiresPrescription: schedule === 'prescription' || schedule === 'controlled',
      isControlled: schedule === 'controlled',
      active: true,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
    } else {
      addProduct(payload);
    }

    setIsAddModalOpen(false);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Code',
      'Brand Name',
      'Generic Name',
      'Category',
      'Schedule',
      'NDA Reg #',
      'Cost Price (UGX)',
      'Retail Price (UGX)',
      'Wholesale Price (UGX)',
      'Reorder Level',
    ];
    const rows = filteredProducts.map(p => [
      p.code,
      `"${p.brandName}"`,
      `"${p.genericName}"`,
      `"${p.category}"`,
      p.schedule,
      p.ndaRegNumber || '',
      p.costPriceUGX,
      p.retailPriceUGX,
      p.wholesalePriceUGX,
      p.reorderLevel,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `esart_product_catalogue_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Product Catalogue &amp; Price Lists
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage pharmaceutical items, dual retail/wholesale prices, NDA schedules &amp; conversions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 rounded-md hover:bg-emerald-800 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center gap-3 shadow-xs text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by brand, generic, NDA #, barcode..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-500 font-medium">Schedule:</label>
          <select
            value={scheduleFilter}
            onChange={e => setScheduleFilter(e.target.value)}
            className="py-1.5 px-2 border border-slate-300 rounded bg-white font-medium"
          >
            <option value="all">All Schedules</option>
            <option value="otc">OTC Only</option>
            <option value="prescription">Prescription Only (Rx)</option>
            <option value="controlled">Controlled Substances</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-500 font-medium">Category:</label>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="py-1.5 px-2 border border-slate-300 rounded bg-white font-medium capitalize"
          >
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sentrifugo Clean Data Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Code / Barcode</th>
                <th className="py-2.5 px-4 font-semibold">Product &amp; Generic Name</th>
                <th className="py-2.5 px-4 font-semibold">Schedule</th>
                <th className="py-2.5 px-4 font-semibold">NDA Reg #</th>
                <th className="py-2.5 px-4 font-semibold text-right">Cost (UGX)</th>
                <th className="py-2.5 px-4 font-semibold text-right">Retail (UGX)</th>
                <th className="py-2.5 px-4 font-semibold text-right">Wholesale (UGX)</th>
                <th className="py-2.5 px-4 font-semibold text-right">Stock On Hand</th>
                <th className="py-2.5 px-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.map(product => {
                const stock = getProductStock(product.id);
                const isLowStock = stock.validQty <= product.reorderLevel;

                return (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-mono">
                      <div className="font-semibold text-slate-900">{product.code}</div>
                      <div className="text-[10px] text-slate-400">{product.barcode}</div>
                    </td>

                    <td className="py-2.5 px-4">
                      <div className="font-bold text-slate-900">{product.brandName}</div>
                      <div className="text-[11px] text-slate-500 italic">
                        {product.genericName} {product.strength ? `· ${product.strength}` : ''}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {product.category} · Pack: {product.packSize || product.baseUnit}
                      </div>
                    </td>

                    <td className="py-2.5 px-4">
                      {product.schedule === 'controlled' ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                          NDA Controlled
                        </span>
                      ) : product.schedule === 'prescription' ? (
                        <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          Prescription (Rx)
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          OTC
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">
                      {product.ndaRegNumber || '—'}
                    </td>

                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                      {formatUGX(product.costPriceUGX)}
                    </td>

                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatUGX(product.retailPriceUGX)}
                    </td>

                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-emerald-800 font-semibold">
                      {formatUGX(product.wholesalePriceUGX)}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        MOQ: {product.wholesaleMinQty}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 text-right">
                      <div className="font-bold font-mono tabular-nums text-slate-900">
                        {stock.validQty} {product.baseUnit}s
                      </div>
                      {stock.expiredQty > 0 && (
                        <span className="text-[10px] text-rose-600 block font-semibold">
                          +{stock.expiredQty} expired (blocked)
                        </span>
                      )}
                      {isLowStock && (
                        <span className="text-[10px] text-amber-600 font-medium block">
                          Reorder alert (≤{product.reorderLevel})
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                        title="Edit product details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-5 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingProduct ? 'Edit Pharmaceutical Item' : 'New Product Registration'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Section 1: Identification */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 border-b pb-1 text-[11px] uppercase tracking-wider text-slate-500">
                  1. Identification &amp; Regulatory
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">
                      Brand / Trade Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={brandName}
                      onChange={e => setBrandName(e.target.value)}
                      placeholder="e.g. Coartem 20/120mg"
                      className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-slate-700 block mb-1">
                      Generic Active Ingredient (INN) *
                    </label>
                    <input
                      type="text"
                      required
                      value={genericName}
                      onChange={e => setGenericName(e.target.value)}
                      placeholder="e.g. Artemether / Lumefantrine"
                      className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">SKU / Code</label>
                    <input
                      type="text"
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">Barcode (EAN-13)</label>
                    <input
                      type="text"
                      value={barcode}
                      onChange={e => setBarcode(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">NDA Registration #</label>
                    <input
                      type="text"
                      value={ndaRegNumber}
                      onChange={e => setNdaRegNumber(e.target.value)}
                      placeholder="e.g. NDA/MAL/2021/0411"
                      className="w-full p-2 border border-slate-300 rounded font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">Schedule / Class</label>
                    <select
                      value={schedule}
                      onChange={e => setSchedule(e.target.value as MedicineSchedule)}
                      className="w-full p-2 border border-slate-300 rounded bg-white"
                    >
                      <option value="otc">Over The Counter (OTC)</option>
                      <option value="prescription">Prescription Only (Rx)</option>
                      <option value="controlled">Controlled Substance (NDA)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">Dosage Form</label>
                    <input
                      type="text"
                      value={dosageForm}
                      onChange={e => setDosageForm(e.target.value)}
                      placeholder="Tablet, Capsule, Syrup..."
                      className="w-full p-2 border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">Strength</label>
                    <input
                      type="text"
                      value={strength}
                      onChange={e => setStrength(e.target.value)}
                      placeholder="e.g. 500mg or 20mg/5ml"
                      className="w-full p-2 border border-slate-300 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Pricing & Packaging */}
              <div className="space-y-3 pt-2">
                <h4 className="font-semibold text-slate-900 border-b pb-1 text-[11px] uppercase tracking-wider text-slate-500">
                  2. Pricing &amp; Stock Levels
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">Cost Price (UGX)</label>
                    <input
                      type="number"
                      value={costPriceUGX}
                      onChange={e => setCostPriceUGX(Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">Retail Price (UGX)</label>
                    <input
                      type="number"
                      value={retailPriceUGX}
                      onChange={e => setRetailPriceUGX(Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">Wholesale Price (UGX)</label>
                    <input
                      type="number"
                      value={wholesalePriceUGX}
                      onChange={e => setWholesalePriceUGX(Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded font-mono text-emerald-800 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">Wholesale Min Order (MOQ)</label>
                    <input
                      type="number"
                      value={wholesaleMinQty}
                      onChange={e => setWholesaleMinQty(Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">Reorder Threshold</label>
                    <input
                      type="number"
                      value={reorderLevel}
                      onChange={e => setReorderLevel(Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">VAT Rate (%)</label>
                    <select
                      value={taxRatePercent}
                      onChange={e => setTaxRatePercent(Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded bg-white"
                    >
                      <option value={0}>0% (Medicines Exempt)</option>
                      <option value={18}>18% Standard VAT</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold shadow-xs"
                >
                  Save Product Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
