import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CompanySettings,
  User,
  Product,
  StockBatch,
  StockMovement,
  Supplier,
  Customer,
  Sale,
  ControlledDrugEntry,
  ApprovalRequest,
  CashierShift,
  GoodsReceivedNote,
  WholesaleOrder,
  PaymentRecord,
  PrescriptionDetails,
} from '../types';
import {
  initialSettings,
  initialUsers,
  initialProducts,
  initialBatches,
  initialMovements,
  initialSuppliers,
  initialCustomers,
  initialControlledEntries,
  initialShift,
  initialApprovals,
  initialWholesaleOrders,
} from '../data/mockDatabase';
import { allocateBatchesFEFO } from '../services/fefo';
import { generateEfrisFiscalRecord } from '../services/efris';
import { validateApprovalPermission } from '../services/approvals';

interface ProcessSaleParams {
  customerId: string;
  customerName: string;
  customerPhone?: string;
  saleType: 'retail' | 'wholesale';
  items: {
    productId: string;
    quantity: number;
    customUnitPrice?: number;
    discountUGX?: number;
    prescriptionDetails?: PrescriptionDetails;
  }[];
  payments: PaymentRecord[];
  notes?: string;
}

interface AppContextType {
  settings: CompanySettings;
  updateSettings: (newSettings: Partial<CompanySettings>) => void;
  users: User[];
  currentUser: User;
  setCurrentUser: (user: User) => void;
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  batches: StockBatch[];
  movements: StockMovement[];
  suppliers: Supplier[];
  customers: Customer[];
  addCustomer: (cust: Omit<Customer, 'id' | 'outstandingBalanceUGX'>) => Customer;
  sales: Sale[];
  controlledEntries: ControlledDrugEntry[];
  approvals: ApprovalRequest[];
  currentShift: CashierShift;
  openShift: (openingFloatUGX: number, notes?: string) => void;
  closeShift: (actualCountedCashUGX: number, notes?: string) => void;
  grnList: GoodsReceivedNote[];
  processGRN: (grn: Omit<GoodsReceivedNote, 'id' | 'grnNumber'>) => GoodsReceivedNote;
  wholesaleOrders: WholesaleOrder[];
  addWholesaleOrder: (order: Omit<WholesaleOrder, 'id' | 'orderNumber'>) => WholesaleOrder;
  processSale: (params: ProcessSaleParams) => { success: boolean; sale?: Sale; error?: string };
  requestApproval: (req: Omit<ApprovalRequest, 'id' | 'requestedAt' | 'status'>) => ApprovalRequest;
  reviewApproval: (
    requestId: string,
    action: 'approved' | 'rejected',
    notes?: string
  ) => { success: boolean; error?: string };
  importProductsAndBatches: (
    newProducts: Omit<Product, 'id'>[],
    newBatches: Omit<StockBatch, 'id'>[]
  ) => { productsAdded: number; batchesAdded: number };
  resetDatabaseToDefault: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'esart_management_system_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
    if (!saved) return initialSettings;
    const parsed = JSON.parse(saved);
    return { ...initialSettings, ...parsed, logoDataUrl: parsed.logoDataUrl || initialSettings.logoDataUrl };
  });

  const [users] = useState<User[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_curr_user`);
    return saved ? JSON.parse(saved) : initialUsers[0]; // Software Owner (Director) default
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_products`);
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [batches, setBatches] = useState<StockBatch[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_batches`);
    return saved ? JSON.parse(saved) : initialBatches;
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_movements`);
    return saved ? JSON.parse(saved) : initialMovements;
  });

  const [suppliers] = useState<Supplier[]>(initialSuppliers);
  
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_customers`);
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_sales`);
    return saved ? JSON.parse(saved) : [];
  });

  const [controlledEntries, setControlledEntries] = useState<ControlledDrugEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_controlled`);
    return saved ? JSON.parse(saved) : initialControlledEntries;
  });

  const [approvals, setApprovals] = useState<ApprovalRequest[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_approvals`);
    return saved ? JSON.parse(saved) : initialApprovals;
  });

  const [currentShift, setCurrentShift] = useState<CashierShift>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_shift`);
    return saved ? JSON.parse(saved) : initialShift;
  });

  const [grnList, setGrnList] = useState<GoodsReceivedNote[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_grn`);
    return saved ? JSON.parse(saved) : [];
  });

  const [wholesaleOrders, setWholesaleOrders] = useState<WholesaleOrder[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_wholesale`);
    return saved ? JSON.parse(saved) : initialWholesaleOrders;
  });



  const [activeView, setActiveView] = useState<string>('dashboard');

  // Persistence side-effects
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_curr_user`, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_batches`, JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_movements`, JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_customers`, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_sales`, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_controlled`, JSON.stringify(controlledEntries));
  }, [controlledEntries]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_approvals`, JSON.stringify(approvals));
  }, [approvals]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_shift`, JSON.stringify(currentShift));
  }, [currentShift]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_grn`, JSON.stringify(grnList));
  }, [grnList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_wholesale`, JSON.stringify(wholesaleOrders));
  }, [wholesaleOrders]);



  const updateSettings = (newSettings: Partial<CompanySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const addProduct = (productData: Omit<Product, 'id'>): Product => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
    };
    setProducts(prev => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...updated } : p)));
  };

  const addCustomer = (custData: Omit<Customer, 'id' | 'outstandingBalanceUGX'>): Customer => {
    const newCust: Customer = {
      ...custData,
      id: `cust-${Date.now()}`,
      outstandingBalanceUGX: 0,
    };
    setCustomers(prev => [...prev, newCust]);
    return newCust;
  };

  // Open Shift
  const openShift = (openingFloatUGX: number, notes?: string) => {
    const newShift: CashierShift = {
      id: `shift-${Date.now()}`,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      openedAt: new Date().toISOString(),
      openingFloatUGX,
      cashSalesUGX: 0,
      mtnMoMoSalesUGX: 0,
      airtelSalesUGX: 0,
      cardSalesUGX: 0,
      totalSalesUGX: 0,
      expectedCashInDrawerUGX: openingFloatUGX,
      status: 'open',
      notes,
    };
    setCurrentShift(newShift);
  };

  // Close Shift with variance reconciliation
  const closeShift = (actualCountedCashUGX: number, notes?: string) => {
    const variance = actualCountedCashUGX - currentShift.expectedCashInDrawerUGX;
    const closed: CashierShift = {
      ...currentShift,
      closedAt: new Date().toISOString(),
      actualCountedCashUGX,
      varianceUGX: variance,
      status: 'closed',
      notes: notes || currentShift.notes,
    };
    setCurrentShift(closed);
  };

  // Process a Point-of-Sale transaction with FEFO, ledger, controlled registry, and EFRIS invoice
  const processSale = (params: ProcessSaleParams) => {
    const now = new Date();
    const invoiceNumber = `INV-UG-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const lineItems: Sale['items'] = [];
    const newBatches = [...batches];
    const newMovements: StockMovement[] = [];
    const newControlledEntries: ControlledDrugEntry[] = [];

    let subtotalUGX = 0;
    let totalDiscountUGX = 0;
    let totalTaxUGX = 0;

    // Allocate each line item via FEFO
    for (const item of params.items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return { success: false, error: `Product not found: ${item.productId}` };
      }

      // Check prescription requirement
      if (product.requiresPrescription && !item.prescriptionDetails?.prescriberName) {
        return {
          success: false,
          error: `Prescription required: '${product.brandName}' is a prescription medication. Doctor and patient details must be recorded.`,
        };
      }

      const productBatches = newBatches.filter(b => b.productId === product.id);
      const allocation = allocateBatchesFEFO(productBatches, item.quantity);

      if (allocation.hasExpiredStockBlocked && allocation.unfulfilledQty > 0) {
        return {
          success: false,
          error: `Safety Alert: Unexpired stock is insufficient for '${product.brandName}'. Remaining units are expired and strictly blocked from dispensing under NDA regulation.`,
        };
      }

      if (allocation.unfulfilledQty > 0) {
        return {
          success: false,
          error: `Insufficient stock for '${product.brandName}'. Available: ${allocation.allocatedTotal}, Requested: ${item.quantity}`,
        };
      }

      // Unit price resolution
      let unitPrice = item.customUnitPrice ?? (params.saleType === 'wholesale' ? product.wholesalePriceUGX : product.retailPriceUGX);
      const discount = item.discountUGX || 0;

      // Deduct from batches and record stock movements
      for (const alloc of allocation.allocations) {
        const batchIdx = newBatches.findIndex(b => b.id === alloc.batch.id);
        const prevQty = newBatches[batchIdx].quantityOnHand;
        const newQty = prevQty - alloc.allocatedQty;
        newBatches[batchIdx] = { ...newBatches[batchIdx], quantityOnHand: newQty };

        // Line item
        const lineTotal = alloc.allocatedQty * unitPrice - discount;
        const taxRate = product.taxRatePercent / 100;
        const lineTax = Math.round(lineTotal * taxRate);

        lineItems.push({
          id: `line-${Date.now()}-${Math.random()}`,
          productId: product.id,
          productName: product.brandName,
          genericName: product.genericName,
          batchId: alloc.batch.id,
          batchNumber: alloc.batch.batchNumber,
          expiryDate: alloc.batch.expiryDate,
          quantity: alloc.allocatedQty,
          unit: product.baseUnit,
          unitPriceUGX: unitPrice,
          discountUGX: discount,
          taxAmountUGX: lineTax,
          totalUGX: lineTotal,
          schedule: product.schedule,
          prescriptionDetails: item.prescriptionDetails,
        });

        subtotalUGX += alloc.allocatedQty * unitPrice;
        totalDiscountUGX += discount;
        totalTaxUGX += lineTax;

        // Stock movement ledger entry
        newMovements.push({
          id: `mov-${Date.now()}-${Math.random()}`,
          timestamp: now.toISOString(),
          productId: product.id,
          batchNumber: alloc.batch.batchNumber,
          movementType: 'sell',
          quantity: -alloc.allocatedQty,
          previousQuantity: prevQty,
          newQuantity: newQty,
          referenceType: 'sale',
          referenceId: invoiceNumber,
          reason: `Dispensed to customer ${params.customerName}`,
          location: alloc.batch.location,
          userId: currentUser.id,
          userName: currentUser.name,
        });

        // Controlled substances register entry
        if (product.isControlled) {
          const lastEntry = [...controlledEntries, ...newControlledEntries]
            .filter(e => e.productId === product.id)
            .pop();
          const prevBal = lastEntry ? lastEntry.runningBalance : prevQty;
          const newBal = prevBal - alloc.allocatedQty;

          newControlledEntries.push({
            id: `cde-${Date.now()}-${Math.random()}`,
            timestamp: now.toISOString(),
            productId: product.id,
            drugName: product.brandName,
            strength: product.strength || '',
            batchNumber: alloc.batch.batchNumber,
            transactionType: 'dispense',
            quantity: alloc.allocatedQty,
            runningBalance: newBal,
            patientName: item.prescriptionDetails?.patientName || params.customerName,
            patientContact: item.prescriptionDetails?.patientPhone || params.customerPhone,
            prescriberName: item.prescriptionDetails?.prescriberName,
            prescriberRegNo: item.prescriptionDetails?.prescriberRegNo,
            pharmacistId: currentUser.id,
            pharmacistName: currentUser.name,
            referenceDoc: invoiceNumber,
          });
        }
      }
    }

    const totalUGX = subtotalUGX - totalDiscountUGX + totalTaxUGX;
    const amountPaidUGX = params.payments.reduce((sum, p) => sum + p.amountUGX, 0);
    const changeGivenUGX = Math.max(0, amountPaidUGX - totalUGX);

    // Generate compliant URA EFRIS fiscal record
    const buyerTin = customers.find(c => c.id === params.customerId)?.tinNumber;
    const efrisRecord = generateEfrisFiscalRecord(totalUGX, totalTaxUGX, buyerTin, settings);

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      invoiceNumber,
      timestamp: now.toISOString(),
      saleType: params.saleType,
      customerId: params.customerId,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      items: lineItems,
      subtotalUGX,
      discountUGX: totalDiscountUGX,
      taxUGX: totalTaxUGX,
      totalUGX,
      payments: params.payments,
      amountPaidUGX,
      changeGivenUGX,
      status: 'completed',
      efrisRecord,
      shiftId: currentShift.id,
      notes: params.notes,
    };

    // Update active cashier shift reconciliation figures
    const cashPortion = params.payments.filter(p => p.method === 'cash').reduce((s, p) => s + p.amountUGX, 0) - changeGivenUGX;
    const mtnPortion = params.payments.filter(p => p.method === 'mtn_momo').reduce((s, p) => s + p.amountUGX, 0);
    const airtelPortion = params.payments.filter(p => p.method === 'airtel_money').reduce((s, p) => s + p.amountUGX, 0);
    const cardPortion = params.payments.filter(p => p.method === 'card').reduce((s, p) => s + p.amountUGX, 0);

    setCurrentShift(prev => ({
      ...prev,
      cashSalesUGX: prev.cashSalesUGX + Math.max(0, cashPortion),
      mtnMoMoSalesUGX: prev.mtnMoMoSalesUGX + mtnPortion,
      airtelSalesUGX: prev.airtelSalesUGX + airtelPortion,
      cardSalesUGX: prev.cardSalesUGX + cardPortion,
      totalSalesUGX: prev.totalSalesUGX + totalUGX,
      expectedCashInDrawerUGX: prev.expectedCashInDrawerUGX + Math.max(0, cashPortion),
    }));

    // Commit state changes
    setBatches(newBatches);
    setMovements(prev => [...newMovements, ...prev]);
    setControlledEntries(prev => [...prev, ...newControlledEntries]);
    setSales(prev => [newSale, ...prev]);

    return { success: true, sale: newSale };
  };

  // Process Goods Received Note (GRN)
  const processGRN = (grnData: Omit<GoodsReceivedNote, 'id' | 'grnNumber'>): GoodsReceivedNote => {
    const grnNumber = `GRN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newGRN: GoodsReceivedNote = {
      ...grnData,
      id: `grn-${Date.now()}`,
      grnNumber,
    };

    const newBatches = [...batches];
    const newMovements: StockMovement[] = [];
    const newControlled: ControlledDrugEntry[] = [];

    for (const item of grnData.items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) continue;

      // Update retail and wholesale prices if new ones provided
      if (item.retailPriceUGX || item.wholesalePriceUGX) {
        updateProduct(product.id, {
          retailPriceUGX: item.retailPriceUGX || product.retailPriceUGX,
          wholesalePriceUGX: item.wholesalePriceUGX || product.wholesalePriceUGX,
          costPriceUGX: item.unitCostUGX || product.costPriceUGX,
        });
      }

      // Check if batch already exists in this location
      const existingBatchIdx = newBatches.findIndex(
        b => b.productId === item.productId && b.batchNumber === item.batchNumber && b.location === item.location
      );

      let prevQty = 0;
      let newQty = item.quantityReceived;

      if (existingBatchIdx >= 0) {
        prevQty = newBatches[existingBatchIdx].quantityOnHand;
        newQty = prevQty + item.quantityReceived;
        newBatches[existingBatchIdx] = {
          ...newBatches[existingBatchIdx],
          quantityOnHand: newQty,
          costPriceUGX: item.unitCostUGX,
          expiryDate: item.expiryDate,
        };
      } else {
        const newBatch: StockBatch = {
          id: `bat-${Date.now()}-${Math.random()}`,
          productId: item.productId,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          quantityOnHand: item.quantityReceived,
          costPriceUGX: item.unitCostUGX,
          location: item.location,
          supplierId: grnData.supplierId,
          receivedDate: grnData.receivedDate,
        };
        newBatches.push(newBatch);
      }

      // Movement ledger
      newMovements.push({
        id: `mov-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString(),
        productId: item.productId,
        batchNumber: item.batchNumber,
        movementType: 'receive',
        quantity: item.quantityReceived,
        previousQuantity: prevQty,
        newQuantity: newQty,
        referenceType: 'grn',
        referenceId: grnNumber,
        reason: `Delivery receipt from ${grnData.supplierName} (Inv: ${grnData.supplierInvoiceRef})`,
        location: item.location,
        userId: currentUser.id,
        userName: currentUser.name,
      });

      // Controlled drug intake
      if (product.isControlled) {
        const lastEntry = [...controlledEntries, ...newControlled]
          .filter(e => e.productId === product.id)
          .pop();
        const prevBal = lastEntry ? lastEntry.runningBalance : prevQty;
        const newBal = prevBal + item.quantityReceived;

        newControlled.push({
          id: `cde-${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
          productId: product.id,
          drugName: product.brandName,
          strength: product.strength || '',
          batchNumber: item.batchNumber,
          transactionType: 'receipt',
          quantity: item.quantityReceived,
          runningBalance: newBal,
          pharmacistId: currentUser.id,
          pharmacistName: currentUser.name,
          referenceDoc: `${grnNumber} / Inv ${grnData.supplierInvoiceRef}`,
        });
      }
    }

    setBatches(newBatches);
    setMovements(prev => [...newMovements, ...prev]);
    setControlledEntries(prev => [...prev, ...newControlled]);
    setGrnList(prev => [newGRN, ...prev]);

    return newGRN;
  };

  // Wholesale Orders
  const addWholesaleOrder = (orderData: Omit<WholesaleOrder, 'id' | 'orderNumber'>): WholesaleOrder => {
    const orderNumber = `WO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newOrder: WholesaleOrder = {
      ...orderData,
      id: `wo-${Date.now()}`,
      orderNumber,
      deliveryNoteNumber: orderData.orderType === 'invoice' ? `DN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
    };
    setWholesaleOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };

  // Approval Requests (Dual Control Enforcement)
  const requestApproval = (reqData: Omit<ApprovalRequest, 'id' | 'requestedAt' | 'status'>): ApprovalRequest => {
    const newReq: ApprovalRequest = {
      ...reqData,
      id: `app-${Date.now()}`,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };
    setApprovals(prev => [newReq, ...prev]);
    return newReq;
  };

  const reviewApproval = (
    requestId: string,
    action: 'approved' | 'rejected',
    notes?: string
  ): { success: boolean; error?: string } => {
    const req = approvals.find(a => a.id === requestId);
    if (!req) return { success: false, error: 'Request not found' };

    // Check anti-self-approval and role
    const check = validateApprovalPermission(req, currentUser);
    if (!check.canApprove) {
      return { success: false, error: check.reason };
    }

    // Apply side effect if approved write-off
    if (action === 'approved' && req.requestType === 'write_off' && req.relatedRecordId) {
      const batchIdx = batches.findIndex(b => b.id === req.relatedRecordId);
      if (batchIdx >= 0) {
        const batch = batches[batchIdx];
        const prevQty = batch.quantityOnHand;
        const newBatches = [...batches];
        newBatches[batchIdx] = { ...batch, quantityOnHand: 0 };
        setBatches(newBatches);

        // Record stock movement
        const mov: StockMovement = {
          id: `mov-${Date.now()}`,
          timestamp: new Date().toISOString(),
          productId: batch.productId,
          batchNumber: batch.batchNumber,
          movementType: 'write_off',
          quantity: -prevQty,
          previousQuantity: prevQty,
          newQuantity: 0,
          referenceType: 'write_off',
          referenceId: req.id,
          reason: `Approved write-off by Director ${currentUser.name}: ${req.title}`,
          location: batch.location,
          userId: currentUser.id,
          userName: currentUser.name,
        };
        setMovements(prev => [mov, ...prev]);
      }
    }

    setApprovals(prev =>
      prev.map(a =>
        a.id === requestId
          ? {
              ...a,
              status: action,
              reviewedByUserId: currentUser.id,
              reviewedByUserName: currentUser.name,
              reviewedAt: new Date().toISOString(),
              reviewNotes: notes,
            }
          : a
      )
    );

    return { success: true };
  };

  // Import products and opening batches
  const importProductsAndBatches = (
    newProductsData: Omit<Product, 'id'>[],
    newBatchesData: Omit<StockBatch, 'id'>[]
  ) => {
    const createdProducts: Product[] = newProductsData.map((p, idx) => ({
      ...p,
      id: `prod-imp-${Date.now()}-${idx}`,
    }));

    const createdBatches: StockBatch[] = newBatchesData.map((b, idx) => {
      // Find corresponding created product if needed
      const matched = createdProducts.find(p => p.code === b.productId || p.brandName === b.productId);
      return {
        ...b,
        id: `bat-imp-${Date.now()}-${idx}`,
        productId: matched ? matched.id : b.productId,
      };
    });

    setProducts(prev => [...createdProducts, ...prev]);
    setBatches(prev => [...createdBatches, ...prev]);

    return {
      productsAdded: createdProducts.length,
      batchesAdded: createdBatches.length,
    };
  };

  const resetDatabaseToDefault = () => {
    localStorage.clear();
    setSettings(initialSettings);
    setCurrentUser(initialUsers[0]);
    setProducts(initialProducts);
    setBatches(initialBatches);
    setMovements(initialMovements);
    setCustomers(initialCustomers);
    setSales([]);
    setControlledEntries(initialControlledEntries);
    setApprovals(initialApprovals);
    setCurrentShift(initialShift);
    setGrnList([]);
    setWholesaleOrders(initialWholesaleOrders);
    setActiveView('dashboard');
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        users,
        currentUser,
        setCurrentUser,
        products,
        addProduct,
        updateProduct,
        batches,
        movements,
        suppliers,
        customers,
        addCustomer,
        sales,
        controlledEntries,
        approvals,
        currentShift,
        openShift,
        closeShift,
        grnList,
        processGRN,
        wholesaleOrders,
        addWholesaleOrder,
        processSale,
        requestApproval,
        reviewApproval,
        importProductsAndBatches,
        resetDatabaseToDefault,
        activeView,
        setActiveView,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
