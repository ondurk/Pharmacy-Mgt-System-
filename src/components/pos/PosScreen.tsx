import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Barcode,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  FileText,
  UserCheck,
  CreditCard,
  Smartphone,
  Coins,
  Printer,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatUGX, formatDate } from '../../services/formatters';
import { getDaysUntilExpiry, allocateBatchesFEFO } from '../../services/fefo';
import { Product, PrescriptionDetails, PaymentRecord, PaymentMethod, Sale } from '../../types';

interface CartItem {
  product: Product;
  quantity: number;
  unitPriceUGX: number;
  discountUGX: number;
  prescriptionDetails?: PrescriptionDetails;
}

export const PosScreen: React.FC<{ onCompletedSale: (sale: Sale) => void }> = ({ onCompletedSale }) => {
  const {
    products,
    batches,
    customers,
    currentUser,
    processSale,
    requestApproval,
    settings,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-walkin');
  const [saleType, setSaleType] = useState<'retail' | 'wholesale'>('retail');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Prescription modal state
  const [prescriptionModalItem, setPrescriptionModalItem] = useState<{
    product: Product;
    pendingQty: number;
  } | null>(null);
  const [prescriberName, setPrescriberName] = useState('Demo Prescriber');
  const [prescriberRegNo, setPrescriberRegNo] = useState('UMDC/REG/2014/098');
  const [patientName, setPatientName] = useState('Walk-in Patient');
  const [patientAge, setPatientAge] = useState<number>(34);
  const [patientPhone, setPatientPhone] = useState('+256 700 000 000');
  const [rxNotes, setRxNotes] = useState('Dispensed per stamped physical prescription');

  // Discount approval request modal
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [discountReason, setDiscountReason] = useState('Special concession for long-term customer');

  // Checkout & Payment Modal
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [mobileMoneyRef, setMobileMoneyRef] = useState(`MM${Math.floor(10000000 + Math.random() * 90000000)}`);
  const [splitPayments, setSplitPayments] = useState<PaymentRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus barcode/search on load
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Filter products by search query, barcode, category
  const filteredProducts = products.filter(p => {
    if (!p.active) return false;
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();
    return (
      p.brandName.toLowerCase().includes(query) ||
      p.genericName.toLowerCase().includes(query) ||
      p.barcode.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query) ||
      (p.ndaRegNumber && p.ndaRegNumber.toLowerCase().includes(query))
    );
  });

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  // Helper: Get available non-expired stock count for product
  const getProductStockInfo = (productId: string) => {
    const pBatches = batches.filter(b => b.productId === productId);
    const validBatches = pBatches.filter(b => getDaysUntilExpiry(b.expiryDate) > 0);
    const expiredBatches = pBatches.filter(b => getDaysUntilExpiry(b.expiryDate) <= 0);

    const availableQty = validBatches.reduce((s, b) => s + b.quantityOnHand, 0);
    const expiredQty = expiredBatches.reduce((s, b) => s + b.quantityOnHand, 0);

    // Earliest expiring valid batch
    const earliestBatch = validBatches.sort(
      (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    )[0];

    return {
      availableQty,
      expiredQty,
      earliestExpiry: earliestBatch?.expiryDate,
      earliestBatchNumber: earliestBatch?.batchNumber,
    };
  };

  // Add product to cart with FEFO check & prescription gate
  const handleAddToCart = (product: Product) => {
    const stockInfo = getProductStockInfo(product.id);

    if (stockInfo.availableQty <= 0) {
      if (stockInfo.expiredQty > 0) {
        alert(
          `DISPENSING BLOCKED:\n\nAll ${stockInfo.expiredQty} units of ${product.brandName} on premises are EXPIRED.\nDispensing expired medicines is strictly illegal under National Drug Authority regulations.`
        );
      } else {
        alert(`Out of stock: ${product.brandName} has zero inventory on hand.`);
      }
      return;
    }

    // Prescription gate: if prescription-only or controlled, trigger Rx capture if not already provided
    if (product.requiresPrescription || product.isControlled) {
      setPrescriptionModalItem({ product, pendingQty: 1 });
      return;
    }

    applyCartAddition(product, 1);
  };

  const applyCartAddition = (
    product: Product,
    qty: number,
    rxDetails?: PrescriptionDetails
  ) => {
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    const unitPrice = saleType === 'wholesale' ? product.wholesalePriceUGX : product.retailPriceUGX;

    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += qty;
      if (rxDetails) {
        updated[existingIndex].prescriptionDetails = rxDetails;
      }
      setCart(updated);
    } else {
      setCart(prev => [
        ...prev,
        {
          product,
          quantity: qty,
          unitPriceUGX: unitPrice,
          discountUGX: 0,
          prescriptionDetails: rxDetails,
        },
      ]);
    }
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const updateCartQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter(i => i.product.id !== productId));
      return;
    }
    const stockInfo = getProductStockInfo(productId);
    if (newQty > stockInfo.availableQty) {
      alert(`Cannot exceed available unexpired stock (${stockInfo.availableQty} units).`);
      return;
    }
    setCart(prev =>
      prev.map(i => (i.product.id === productId ? { ...i, quantity: newQty } : i))
    );
  };

  const clearCart = () => {
    setCart([]);
    setErrorMessage(null);
  };

  // Cart financial totals
  const subtotalUGX = cart.reduce((sum, item) => sum + item.quantity * item.unitPriceUGX, 0);
  const totalDiscountsUGX = cart.reduce((sum, item) => sum + item.discountUGX, 0);
  const totalTaxUGX = cart.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPriceUGX - item.discountUGX;
    return sum + Math.round(itemTotal * (item.product.taxRatePercent / 100));
  }, 0);
  const totalPayableUGX = subtotalUGX - totalDiscountsUGX + totalTaxUGX;

  // Sync cash tendered default
  useEffect(() => {
    setCashTendered(totalPayableUGX);
  }, [totalPayableUGX]);

  // Handle Checkout
  const handleProceedToPayment = () => {
    if (cart.length === 0) return;
    setErrorMessage(null);
    setCheckoutModalOpen(true);
  };

  const handleFinalizeSale = () => {
    setIsProcessing(true);
    setErrorMessage(null);

    const customer = customers.find(c => c.id === selectedCustomerId) || customers[0];

    // Build payment records
    let payments: PaymentRecord[] = [];
    if (splitPayments.length > 0) {
      payments = splitPayments;
    } else {
      payments = [
        {
          method: paymentMethod,
          amountUGX: paymentMethod === 'cash' ? cashTendered : totalPayableUGX,
          transactionReference:
            paymentMethod === 'mtn_momo' || paymentMethod === 'airtel_money'
              ? mobileMoneyRef
              : undefined,
        },
      ];
    }

    const saleItems = cart.map(i => ({
      productId: i.product.id,
      quantity: i.quantity,
      customUnitPrice: i.unitPriceUGX,
      discountUGX: i.discountUGX,
      prescriptionDetails: i.prescriptionDetails,
    }));

    const result = processSale({
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      saleType,
      items: saleItems,
      payments,
      notes: `POS Counter sale via ${paymentMethod}`,
    });

    setIsProcessing(false);

    if (result.success && result.sale) {
      setCheckoutModalOpen(false);
      clearCart();
      onCompletedSale(result.sale);
    } else {
      setErrorMessage(result.error || 'Failed to process sale.');
    }
  };

  // Submit discount approval request (dual control)
  const handleSubmitDiscountApproval = () => {
    const discountAmount = Math.round((subtotalUGX * discountPercent) / 100);
    requestApproval({
      requestType: 'discount',
      requestedByUserId: currentUser.id,
      requestedByUserName: currentUser.name,
      title: `${discountPercent}% Sale Discount Request (${formatUGX(discountAmount)})`,
      details: `${discountReason}. Requested by ${currentUser.name} (${currentUser.role}). Requires Director sign-off.`,
      amountUGX: discountAmount,
    });
    setDiscountModalOpen(false);
    alert(
      `Approval request for ${formatUGX(discountAmount)} submitted to Director queue.\nRemember: Dual control prevents self-approval.`
    );
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col lg:flex-row gap-4 -m-2">
      {/* LEFT PANE: Product Catalogue & Rapid Search */}
      <div className="flex-1 bg-white border border-slate-200 rounded-lg flex flex-col overflow-hidden shadow-xs">
        {/* Search & Barcode Header */}
        <div className="p-3 border-b border-slate-200 bg-slate-50 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Scan barcode or type brand, generic name, NDA #..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && filteredProducts.length === 1) {
                    handleAddToCart(filteredProducts[0]);
                  }
                }}
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-medium"
              />
              <Barcode className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Wholesale vs Retail Toggle */}
            <div className="flex items-center bg-slate-200 p-0.5 rounded-md text-xs font-semibold shrink-0">
              <button
                onClick={() => setSaleType('retail')}
                className={`px-3 py-1.5 rounded transition-colors ${
                  saleType === 'retail'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Retail
              </button>
              <button
                onClick={() => setSaleType('wholesale')}
                className={`px-3 py-1.5 rounded transition-colors ${
                  saleType === 'wholesale'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Wholesale
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded capitalize whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-emerald-700 text-white font-medium'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid / List */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
          {filteredProducts.map(product => {
            const stockInfo = getProductStockInfo(product.id);
            const isOutOfStock = stockInfo.availableQty <= 0;
            const price = saleType === 'wholesale' ? product.wholesalePriceUGX : product.retailPriceUGX;

            return (
              <div
                key={product.id}
                onClick={() => !isOutOfStock && handleAddToCart(product)}
                className={`p-3 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                  isOutOfStock
                    ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                    : 'border-slate-200 bg-white hover:border-emerald-600 hover:shadow-xs cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5">
                    <h3 className="font-bold text-slate-900 text-xs leading-snug">
                      {product.brandName}
                    </h3>
                    {product.isControlled ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded shrink-0">
                        NDA Controlled
                      </span>
                    ) : product.requiresPrescription ? (
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded shrink-0">
                        Rx Required
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
                        OTC
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 italic mt-0.5">
                    {product.genericName} {product.strength ? `· ${product.strength}` : ''}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Pack: {product.packSize || product.baseUnit}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 font-mono tabular-nums text-sm">
                      {formatUGX(price)}
                    </span>
                    {saleType === 'wholesale' && (
                      <span className="text-[10px] text-slate-400 block">Min MOQ: {product.wholesaleMinQty}</span>
                    )}
                  </div>

                  <div className="text-right">
                    {isOutOfStock ? (
                      <span className="text-rose-600 font-bold text-[11px]">
                        {stockInfo.expiredQty > 0 ? 'Expired on shelf' : 'Out of Stock'}
                      </span>
                    ) : (
                      <div className="text-[11px]">
                        <span className="font-semibold text-emerald-700 font-mono tabular-nums">
                          {stockInfo.availableQty} {product.baseUnit}s
                        </span>
                        {stockInfo.earliestExpiry && (
                          <span className="block text-[10px] text-slate-400">
                            FEFO exp: {formatDate(stockInfo.earliestExpiry)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANE: Counter Cart, Prescription Verifications, Totals & Payment */}
      <div className="w-full lg:w-96 bg-white border border-slate-200 rounded-lg flex flex-col overflow-hidden shadow-xs">
        {/* Cart Header */}
        <div className="p-3 border-b border-slate-200 bg-slate-50 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-emerald-700" />
              <span className="font-bold text-slate-900 text-xs">Counter Order Slip</span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] text-rose-600 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          {/* Customer Selection */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-500 shrink-0">Customer:</label>
            <select
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              className="flex-1 py-1 px-2 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium text-slate-800"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.type === 'wholesale' ? '(Wholesale Acct)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingBag className="w-10 h-10 stroke-1 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">Counter cart is empty</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Scan barcode or select medicines from catalogue on the left.
              </p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.product.id}
                className="p-2.5 rounded-md border border-slate-200 bg-white hover:border-slate-300 transition-colors text-xs space-y-1.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">{item.product.brandName}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatUGX(item.unitPriceUGX)} / {item.product.baseUnit}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 font-mono tabular-nums">
                    {formatUGX(item.quantity * item.unitPriceUGX - item.discountUGX)}
                  </span>
                </div>

                {/* Prescription note if required */}
                {item.prescriptionDetails && (
                  <div className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 p-1 rounded flex items-center justify-between">
                    <span>
                      Prescriber: {item.prescriptionDetails.prescriberName} (Reg #{item.prescriptionDetails.prescriberRegNo})
                    </span>
                    <UserCheck className="w-3 h-3 text-emerald-600" />
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center border border-slate-300 rounded bg-slate-50">
                    <button
                      onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                      className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 font-bold font-mono text-xs">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                      className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => updateCartQty(item.product.id, 0)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Financial Summary & Checkout Button */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2 text-xs">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-mono tabular-nums">{formatUGX(subtotalUGX)}</span>
            </div>
            {totalDiscountsUGX > 0 && (
              <div className="flex items-center justify-between text-emerald-700">
                <span>Discount Approved:</span>
                <span className="font-mono tabular-nums">-{formatUGX(totalDiscountsUGX)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-slate-500">
              <span>VAT (Exempt on human drugs):</span>
              <span className="font-mono tabular-nums">{formatUGX(totalTaxUGX)}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Net Payable (UGX):</span>
              <span className="font-mono tabular-nums text-base text-emerald-800">
                {formatUGX(totalPayableUGX)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setDiscountModalOpen(true)}
              disabled={cart.length === 0}
              className="flex-1 py-1.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              Request Discount
            </button>
            <button
              onClick={handleProceedToPayment}
              disabled={cart.length === 0}
              className="flex-2 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded shadow-xs disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Coins className="w-4 h-4" />
              <span>Checkout &amp; Fiscalize</span>
            </button>
          </div>
        </div>
      </div>

      {/* PRESCRIPTION CAPTURE MODAL */}
      {prescriptionModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Prescription Capture (NDA Regulation)
                </h3>
              </div>
              <button
                onClick={() => setPrescriptionModalItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600">
              <strong>{prescriptionModalItem.product.brandName}</strong> is classified as{' '}
              <span className="font-bold uppercase text-rose-700">
                {prescriptionModalItem.product.schedule}
              </span>
              . The dispensing pharmacist must capture prescriber registration and patient records.
            </p>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Prescribing Doctor / Clinician
                </label>
                <input
                  type="text"
                  value={prescriberName}
                  onChange={e => setPrescriberName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                  placeholder="e.g. Demo Prescriber"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  UMDC / Clinician Reg No.
                </label>
                <input
                  type="text"
                  value={prescriberRegNo}
                  onChange={e => setPrescriberRegNo(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                  placeholder="e.g. UMDC/REG/2014/098"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Patient Contact</label>
                  <input
                    type="text"
                    value={patientPhone}
                    onChange={e => setPatientPhone(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Prescription Notes / Verification
                </label>
                <input
                  type="text"
                  value={rxNotes}
                  onChange={e => setRxNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setPrescriptionModalItem(null)}
                className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 text-slate-700 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!prescriberName.trim()) {
                    alert('Prescriber name is mandatory.');
                    return;
                  }
                  const rx: PrescriptionDetails = {
                    prescriberName,
                    prescriberRegNo,
                    patientName,
                    patientAge,
                    patientPhone,
                    prescriptionDate: new Date().toISOString().split('T')[0],
                    notes: rxNotes,
                  };
                  applyCartAddition(
                    prescriptionModalItem.product,
                    prescriptionModalItem.pendingQty,
                    rx
                  );
                  setPrescriptionModalItem(null);
                }}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold shadow-xs"
              >
                Verify &amp; Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISCOUNT APPROVAL MODAL (Dual Control) */}
      {discountModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">
                Request Concession / Director Approval
              </h3>
              <button onClick={() => setDiscountModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <p className="text-slate-600">
              Per Esart governance policy, discounts exceeding 5% require approval by an
              Operations Director. You cannot approve your own transaction.
            </p>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Discount Percentage
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={discountPercent}
                  onChange={e => setDiscountPercent(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Business Justification
                </label>
                <textarea
                  value={discountReason}
                  onChange={e => setDiscountReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded h-20"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setDiscountModalOpen(false)}
                className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDiscountApproval}
                className="px-4 py-1.5 bg-emerald-700 text-white font-bold rounded hover:bg-emerald-800"
              >
                Submit to Director Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT & PAYMENT MODAL */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Payment &amp; URA EFRIS Fiscalization
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Select payment channels (Split payment supported)
                </p>
              </div>
              <button onClick={() => setCheckoutModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 font-medium">
                {errorMessage}
              </div>
            )}

            {/* Total Display */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <span className="text-slate-600 font-medium">Total Amount Due:</span>
              <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                {formatUGX(totalPayableUGX)}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-2.5 rounded-md border text-center transition-colors ${
                  paymentMethod === 'cash'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Coins className="w-4 h-4 mx-auto mb-1" />
                <span>Cash</span>
              </button>

              <button
                onClick={() => setPaymentMethod('mtn_momo')}
                className={`p-2.5 rounded-md border text-center transition-colors ${
                  paymentMethod === 'mtn_momo'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Smartphone className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                <span>MTN MoMo</span>
              </button>

              <button
                onClick={() => setPaymentMethod('airtel_money')}
                className={`p-2.5 rounded-md border text-center transition-colors ${
                  paymentMethod === 'airtel_money'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Smartphone className="w-4 h-4 mx-auto mb-1 text-rose-600" />
                <span>Airtel Money</span>
              </button>

              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-2.5 rounded-md border text-center transition-colors ${
                  paymentMethod === 'card'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <CreditCard className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                <span>Card (POS)</span>
              </button>
            </div>

            {/* Payment specifics */}
            {paymentMethod === 'cash' && (
              <div className="space-y-3 p-3 bg-slate-50 rounded border border-slate-200">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Cash Tendered (UGX)
                  </label>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={e => setCashTendered(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded font-mono text-base font-bold text-slate-900"
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-600">Change Due to Customer:</span>
                  <span className="font-bold text-emerald-800 font-mono text-sm tabular-nums">
                    {formatUGX(Math.max(0, cashTendered - totalPayableUGX))}
                  </span>
                </div>
              </div>
            )}

            {(paymentMethod === 'mtn_momo' || paymentMethod === 'airtel_money') && (
              <div className="space-y-2 p-3 bg-amber-50 rounded border border-amber-200">
                <label className="font-semibold text-slate-700 block">
                  Mobile Money Transaction Reference Code (Mandatory)
                </label>
                <input
                  type="text"
                  value={mobileMoneyRef}
                  onChange={e => setMobileMoneyRef(e.target.value)}
                  placeholder="e.g. MM94812038 or TRX-90412"
                  className="w-full p-2 border border-slate-300 rounded font-mono font-bold"
                />
                <p className="text-[11px] text-slate-500">
                  Customer confirms prompt on their handset; cashier transcribes SMS transaction ref.
                </p>
              </div>
            )}

            {/* URA EFRIS Notice */}
            <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200 text-emerald-900 flex items-start gap-2 text-[11px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong>URA EFRIS Integration Active:</strong>
                <p className="text-emerald-800 mt-0.5">
                  Fiscal Device {settings.efrisDeviceNumber} will stamp this sale with a tamper-proof verification code &amp; QR payload.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50 text-slate-700 font-medium"
              >
                Back to Cart
              </button>
              <button
                onClick={handleFinalizeSale}
                disabled={isProcessing}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold shadow-xs flex items-center gap-1.5"
              >
                {isProcessing ? 'Transmitting to EFRIS...' : 'Complete & Print Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
