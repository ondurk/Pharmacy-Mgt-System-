import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatUGX, formatDate } from '../../services/formatters';
import { Truck, Plus, PackageCheck, FileText, CheckCircle2, X } from 'lucide-react';
import { Product } from '../../types';

export const GoodsReceivedNoteView: React.FC = () => {
  const { suppliers, products, processGRN, grnList, currentUser } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [supplierInvoiceRef, setSupplierInvoiceRef] = useState(`INV-${Math.floor(10000 + Math.random() * 90000)}`);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('Standard consignment delivery. Cold chain unbroken, seals verified intact.');

  // GRN items staging
  const [grnItems, setGrnItems] = useState<{
    productId: string;
    productName: string;
    batchNumber: string;
    expiryDate: string;
    quantityReceived: number;
    unitCostUGX: number;
    retailPriceUGX: number;
    wholesalePriceUGX: number;
    location: 'Shop Floor' | 'Main Store';
  }[]>([
    {
      productId: products[0]?.id || '',
      productName: products[0]?.brandName || '',
      batchNumber: `BAT-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`,
      expiryDate: '2028-06-30',
      quantityReceived: 50,
      unitCostUGX: products[0]?.costPriceUGX || 16000,
      retailPriceUGX: products[0]?.retailPriceUGX || 25000,
      wholesalePriceUGX: products[0]?.wholesalePriceUGX || 20000,
      location: 'Shop Floor',
    },
  ]);

  const handleAddItemRow = () => {
    const prod = products[0];
    setGrnItems(prev => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.brandName,
        batchNumber: `BAT-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`,
        expiryDate: '2028-06-30',
        quantityReceived: 20,
        unitCostUGX: prod.costPriceUGX,
        retailPriceUGX: prod.retailPriceUGX,
        wholesalePriceUGX: prod.wholesalePriceUGX,
        location: 'Shop Floor',
      },
    ]);
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    setGrnItems(prev => {
      const updated = [...prev];
      if (field === 'productId') {
        const prod = products.find(p => p.id === value);
        if (prod) {
          updated[index] = {
            ...updated[index],
            productId: prod.id,
            productName: prod.brandName,
            unitCostUGX: prod.costPriceUGX,
            retailPriceUGX: prod.retailPriceUGX,
            wholesalePriceUGX: prod.wholesalePriceUGX,
          };
        }
      } else {
        (updated[index] as any)[field] = value;
      }
      return updated;
    });
  };

  const handleRemoveItemRow = (index: number) => {
    setGrnItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitGRN = (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = suppliers.find(s => s.id === selectedSupplierId) || suppliers[0];

    const items = grnItems.map(item => ({
      productId: item.productId,
      productName: item.productName,
      batchNumber: item.batchNumber,
      expiryDate: item.expiryDate,
      quantityReceived: Number(item.quantityReceived),
      unitCostUGX: Number(item.unitCostUGX),
      retailPriceUGX: Number(item.retailPriceUGX),
      wholesalePriceUGX: Number(item.wholesalePriceUGX),
      lineTotalUGX: Number(item.quantityReceived) * Number(item.unitCostUGX),
      location: item.location,
    }));

    const totalAmountUGX = items.reduce((s, i) => s + i.lineTotalUGX, 0);

    processGRN({
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierInvoiceRef,
      receivedDate,
      receivedByUserId: currentUser.id,
      receivedByUserName: currentUser.name,
      items,
      totalAmountUGX,
      status: 'verified',
      notes,
    });

    setIsModalOpen(false);
    alert(`Goods Received Note processed successfully!\nBatches updated and immutable stock movement records generated.`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-700" />
            <span>Goods Received Notes (GRN Intake)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Receive supplier deliveries with mandatory batch lot, expiry date &amp; wholesale/retail price capture.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 rounded-md hover:bg-emerald-800 flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ Receive New Consignment</span>
        </button>
      </div>

      {/* GRN History Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="font-bold text-slate-800 text-xs">Verified GRN Intake Archive</span>
          <span className="text-[11px] text-slate-500">{grnList.length} verified consignments</span>
        </div>

        {grnList.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <PackageCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No goods received notes logged in this session</p>
            <p className="text-slate-400 mt-1">
              Click "+ Receive New Consignment" to log supplier delivery intake with batch &amp; expiry controls.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">GRN Number</th>
                  <th className="py-2.5 px-4 font-semibold">Date</th>
                  <th className="py-2.5 px-4 font-semibold">Supplier</th>
                  <th className="py-2.5 px-4 font-semibold">Supplier Invoice Ref</th>
                  <th className="py-2.5 px-4 font-semibold">Items Received</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Consignment Value (UGX)</th>
                  <th className="py-2.5 px-4 font-semibold">Received By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {grnList.map(grn => (
                  <tr key={grn.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      {grn.grnNumber}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {formatDate(grn.receivedDate)}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      {grn.supplierName}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">
                      {grn.supplierInvoiceRef}
                    </td>
                    <td className="py-2.5 px-4">
                      {grn.items.length} line items (
                      {grn.items.map(i => `${i.productName} [Lot: ${i.batchNumber}]`).join(', ')}
                      )
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900 font-mono tabular-nums">
                      {formatUGX(grn.totalAmountUGX)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">
                      {grn.receivedByUserName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE GRN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full p-5 space-y-4 text-xs max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Receive Supplier Consignment &amp; Verify Batches
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitGRN} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 rounded border border-slate-200">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Distributor / Supplier *
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white font-medium"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Supplier Invoice Ref # *
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierInvoiceRef}
                    onChange={e => setSupplierInvoiceRef(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Received Date
                  </label>
                  <input
                    type="date"
                    value={receivedDate}
                    onChange={e => setReceivedDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
                    Delivery Consignment Items
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-2 font-semibold">Medicine</th>
                        <th className="p-2 font-semibold">Batch Lot #</th>
                        <th className="p-2 font-semibold">Expiry Date</th>
                        <th className="p-2 font-semibold">Qty</th>
                        <th className="p-2 font-semibold">Cost (UGX)</th>
                        <th className="p-2 font-semibold">Retail Price</th>
                        <th className="p-2 font-semibold">Wholesale Price</th>
                        <th className="p-2 font-semibold">Store Location</th>
                        <th className="p-2 font-semibold text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {grnItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2">
                            <select
                              value={item.productId}
                              onChange={e => handleUpdateItem(idx, 'productId', e.target.value)}
                              className="w-40 p-1.5 border border-slate-300 rounded bg-white"
                            >
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.brandName}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              required
                              value={item.batchNumber}
                              onChange={e => handleUpdateItem(idx, 'batchNumber', e.target.value)}
                              className="w-24 p-1.5 border border-slate-300 rounded font-mono"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="date"
                              required
                              value={item.expiryDate}
                              onChange={e => handleUpdateItem(idx, 'expiryDate', e.target.value)}
                              className="w-32 p-1.5 border border-slate-300 rounded"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              required
                              value={item.quantityReceived}
                              onChange={e =>
                                handleUpdateItem(idx, 'quantityReceived', Number(e.target.value))
                              }
                              className="w-16 p-1.5 border border-slate-300 rounded font-mono"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              value={item.unitCostUGX}
                              onChange={e =>
                                handleUpdateItem(idx, 'unitCostUGX', Number(e.target.value))
                              }
                              className="w-24 p-1.5 border border-slate-300 rounded font-mono"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              value={item.retailPriceUGX}
                              onChange={e =>
                                handleUpdateItem(idx, 'retailPriceUGX', Number(e.target.value))
                              }
                              className="w-24 p-1.5 border border-slate-300 rounded font-mono"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              value={item.wholesalePriceUGX}
                              onChange={e =>
                                handleUpdateItem(idx, 'wholesalePriceUGX', Number(e.target.value))
                              }
                              className="w-24 p-1.5 border border-slate-300 rounded font-mono"
                            />
                          </td>

                          <td className="p-2">
                            <select
                              value={item.location}
                              onChange={e => handleUpdateItem(idx, 'location', e.target.value)}
                              className="p-1.5 border border-slate-300 rounded bg-white"
                            >
                              <option value="Shop Floor">Shop Floor</option>
                              <option value="Main Store">Main Store</option>
                            </select>
                          </td>

                          <td className="p-2 text-center">
                            {grnItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItemRow(idx)}
                                className="text-rose-600 hover:text-rose-800 p-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Intake Notes / Verification
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify GRN &amp; Update Inventory</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
