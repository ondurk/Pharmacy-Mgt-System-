import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatUGX, formatDate } from '../../services/formatters';
import { WholesaleOrder, Product } from '../../types';
import { Briefcase, Plus, FileText, CheckCircle2, ArrowRight, X } from 'lucide-react';

export const WholesaleOrdersView: React.FC = () => {
  const {
    wholesaleOrders,
    customers,
    products,
    addWholesaleOrder,
    processSale,
    currentUser,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    customers.find(c => c.type === 'wholesale')?.id || customers[0].id
  );
  const [orderType, setOrderType] = useState<'quotation' | 'pro_forma' | 'invoice'>('pro_forma');
  const [validDays, setValidDays] = useState(14);

  const [orderItems, setOrderItems] = useState<{
    productId: string;
    quantity: number;
  }[]>([
    {
      productId: products[0]?.id || '',
      quantity: products[0]?.wholesaleMinQty || 5,
    },
  ]);

  const wholesaleCustomers = customers.filter(c => c.type === 'wholesale');

  const handleAddItem = () => {
    const prod = products[0];
    setOrderItems(prev => [
      ...prev,
      {
        productId: prod.id,
        quantity: prod.wholesaleMinQty,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateWholesaleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === selectedCustomerId) || customers[0];

    const today = new Date();
    const expiryDate = new Date(today.getTime() + validDays * 24 * 3600 * 1000)
      .toISOString()
      .split('T')[0];

    const items = orderItems.map(item => {
      const prod = products.find(p => p.id === item.productId)!;
      const unitPrice = prod.wholesalePriceUGX;
      return {
        productId: prod.id,
        productName: `${prod.brandName} (${prod.packSize || prod.baseUnit})`,
        quantity: Number(item.quantity),
        unitPriceUGX: unitPrice,
        lineTotalUGX: Number(item.quantity) * unitPrice,
      };
    });

    const subtotalUGX = items.reduce((s, i) => s + i.lineTotalUGX, 0);

    addWholesaleOrder({
      customerId: cust.id,
      customerName: cust.name,
      orderType,
      date: today.toISOString().split('T')[0],
      validUntilDate: expiryDate,
      items,
      subtotalUGX,
      taxUGX: 0,
      totalUGX: subtotalUGX,
      status: 'issued',
    });

    setIsModalOpen(false);
    alert(`Wholesale ${orderType.replace('_', ' ')} created successfully!`);
  };

  const handleFulfillOrder = (order: WholesaleOrder) => {
    const cust = customers.find(c => c.id === order.customerId) || customers[0];
    const saleItems = order.items.map(i => ({
      productId: i.productId,
      quantity: i.quantity,
      customUnitPrice: i.unitPriceUGX,
      discountUGX: 0,
    }));

    const result = processSale({
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      saleType: 'wholesale',
      items: saleItems,
      payments: [
        {
          method: 'cash',
          amountUGX: order.totalUGX,
        },
      ],
      notes: `Fulfillment of wholesale pro-forma ${order.orderNumber}. Delivery note ${order.deliveryNoteNumber || 'DN-PENDING'}`,
    });

    if (result.success) {
      alert(`Wholesale order ${order.orderNumber} successfully fulfilled!\nFEFO batches deducted and official URA EFRIS fiscal invoice issued.`);
    } else {
      alert(`Cannot fulfill: ${result.error}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-700" />
            <span>Wholesale Orders, Pro-Forma &amp; Delivery Notes</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional hospital and clinic accounts. Volume pricing with minimum order quantities (MOQ).
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 rounded-md hover:bg-emerald-800 flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Wholesale Quote / Order</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Order / Quote #</th>
                <th className="py-2.5 px-4 font-semibold">Institutional Client</th>
                <th className="py-2.5 px-4 font-semibold">Type</th>
                <th className="py-2.5 px-4 font-semibold">Issued Date</th>
                <th className="py-2.5 px-4 font-semibold">Valid Until</th>
                <th className="py-2.5 px-4 font-semibold">Items</th>
                <th className="py-2.5 px-4 font-semibold text-right">Total Order Value (UGX)</th>
                <th className="py-2.5 px-4 font-semibold">Delivery Note</th>
                <th className="py-2.5 px-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {wholesaleOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                    {order.orderNumber}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">
                    {order.customerName}
                  </td>
                  <td className="py-2.5 px-4 uppercase text-[11px] font-bold text-emerald-800">
                    {order.orderType.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {formatDate(order.date)}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 font-mono">
                    {formatDate(order.validUntilDate)}
                  </td>
                  <td className="py-2.5 px-4">
                    {order.items.length} lines ({order.items.reduce((s, i) => s + i.quantity, 0)} units)
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900 font-mono tabular-nums">
                    {formatUGX(order.totalUGX)}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-600 text-[11px]">
                    {order.deliveryNoteNumber || 'Pending'}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      onClick={() => handleFulfillOrder(order)}
                      className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded text-[11px] transition-colors shadow-xs"
                    >
                      Fulfill &amp; Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-5 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">
                Create Wholesale Quotation / Pro-Forma Invoice
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateWholesaleOrder} className="space-y-4">
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded border border-slate-200">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Wholesale Client *
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white font-medium"
                  >
                    {wholesaleCustomers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Document Type</label>
                  <select
                    value={orderType}
                    onChange={e => setOrderType(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded bg-white font-medium"
                  >
                    <option value="pro_forma">Pro-Forma Invoice</option>
                    <option value="quotation">Formal Quotation</option>
                    <option value="invoice">Wholesale Commercial Invoice</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    value={validDays}
                    onChange={e => setValidDays(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
                    Wholesale Products
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Medicine</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {orderItems.map((item, idx) => {
                    const prod = products.find(p => p.id === item.productId);
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 border border-slate-200 rounded bg-white"
                      >
                        <select
                          value={item.productId}
                          onChange={e => {
                            const newItems = [...orderItems];
                            newItems[idx].productId = e.target.value;
                            setOrderItems(newItems);
                          }}
                          className="flex-1 p-1.5 border border-slate-300 rounded bg-white font-medium"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.brandName} — {formatUGX(p.wholesalePriceUGX)} (MOQ: {p.wholesaleMinQty})
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1">
                          <label className="text-[11px] text-slate-500">Qty:</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => {
                              const newItems = [...orderItems];
                              newItems[idx].quantity = Number(e.target.value);
                              setOrderItems(newItems);
                            }}
                            className="w-20 p-1.5 border border-slate-300 rounded text-right font-mono"
                          />
                        </div>

                        <span className="font-bold text-slate-900 font-mono tabular-nums w-28 text-right">
                          {formatUGX(Number(item.quantity) * (prod?.wholesalePriceUGX || 0))}
                        </span>

                        {orderItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-600 hover:text-rose-800 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold shadow-xs"
                >
                  Issue Wholesale Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
