export type UserRole = 
  | 'admin'
  | 'director'
  | 'manager'
  | 'pharmacist'
  | 'cashier'
  | 'storekeeper';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  twoFactorEnabled: boolean;
  avatarInitials: string;
}

export type MedicineSchedule = 'otc' | 'prescription' | 'controlled';

export type UnitOfMeasure = 'box' | 'strip' | 'tablet' | 'bottle' | 'vial' | 'tube' | 'sachet' | 'piece' | 'metre' | 'sqm' | 'roll';

export interface UomConversion {
  fromUnit: UnitOfMeasure;
  toUnit: UnitOfMeasure;
  multiplier: number; // e.g. 1 box = 10 strips, 1 strip = 10 tablets
}

export interface Product {
  id: string;
  code: string;
  barcode: string;
  brandName: string;
  genericName: string;
  strength?: string; // e.g. "500mg"
  dosageForm?: string; // e.g. "Tablet", "Syrup"
  packSize?: string; // e.g. "10x10 blister"
  category: string;
  schedule: MedicineSchedule;
  ndaRegNumber?: string; // Uganda NDA Reg No, e.g. "NDA/MAL/2023/0481"
  baseUnit: UnitOfMeasure;
  secondaryUnit?: UnitOfMeasure;
  conversionFactor?: number;
  costPriceUGX: number; // Stored in UGX integer
  retailPriceUGX: number; // Stored in UGX integer
  wholesalePriceUGX: number; // Wholesale price tier
  wholesaleMinQty: number; // Minimum order quantity for wholesale
  reorderLevel: number;
  taxRatePercent: number; // 0 for exempt, 18 for standard VAT
  requiresPrescription: boolean;
  isControlled: boolean;
  active: boolean;
}

export interface StockBatch {
  id: string;
  productId: string;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  quantityOnHand: number;
  costPriceUGX: number;
  location: 'Shop Floor' | 'Main Store';
  supplierId: string;
  receivedDate: string;
}

export type MovementType = 
  | 'receive'
  | 'sell'
  | 'return'
  | 'adjust_add'
  | 'adjust_sub'
  | 'write_off'
  | 'transfer';

export interface StockMovement {
  id: string;
  timestamp: string;
  productId: string;
  batchNumber: string;
  movementType: MovementType;
  quantity: number; // positive or negative
  previousQuantity: number;
  newQuantity: number;
  referenceType: 'sale' | 'grn' | 'adjustment' | 'write_off' | 'stock_take';
  referenceId: string;
  reason?: string;
  location: string;
  userId: string;
  userName: string;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  tinNumber: string;
  phone: string;
  email: string;
  address: string;
  paymentTermsDays: number;
  leadTimeDays: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  type: 'walk_in' | 'retail_regular' | 'wholesale';
  tinNumber?: string;
  address?: string;
  creditLimitUGX: number; // Feature-flagged for future
  outstandingBalanceUGX: number;
  notes?: string;
}

export interface PrescriptionDetails {
  prescriberName: string;
  prescriberRegNo: string;
  patientName: string;
  patientAge?: number;
  patientPhone?: string;
  prescriptionDate: string;
  notes?: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  genericName: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unit: UnitOfMeasure;
  unitPriceUGX: number;
  discountUGX: number;
  taxAmountUGX: number;
  totalUGX: number;
  schedule: MedicineSchedule;
  prescriptionDetails?: PrescriptionDetails;
}

export type PaymentMethod = 'cash' | 'mtn_momo' | 'airtel_money' | 'card' | 'credit';

export interface PaymentRecord {
  method: PaymentMethod;
  amountUGX: number;
  transactionReference?: string; // e.g. MTN MoMo Tx ID MM9482104
}

export interface EfrisInvoiceRecord {
  fiscalDocNumber: string; // FDN
  fiscalInvoiceNumber: string; // e.g. INV-UG-2026-00481
  verificationCode: string; // 6-digit verification code
  antiTamperSignature: string;
  qrPayload: string;
  taxableAmountUGX: number;
  taxAmountUGX: number;
  grossAmountUGX: number;
  buyerTin?: string;
  issuedAt: string;
  syncStatus: 'synced_mock' | 'pending' | 'failed';
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  timestamp: string;
  saleType: 'retail' | 'wholesale';
  customerId: string;
  customerName: string;
  customerPhone?: string;
  cashierId: string;
  cashierName: string;
  items: SaleItem[];
  subtotalUGX: number;
  discountUGX: number;
  taxUGX: number;
  totalUGX: number;
  payments: PaymentRecord[];
  amountPaidUGX: number;
  changeGivenUGX: number;
  status: 'completed' | 'refunded' | 'partially_refunded';
  efrisRecord: EfrisInvoiceRecord;
  shiftId: string;
  notes?: string;
}

export interface ControlledDrugEntry {
  id: string;
  timestamp: string;
  productId: string;
  drugName: string;
  strength: string;
  batchNumber: string;
  transactionType: 'receipt' | 'dispense' | 'destruction';
  quantity: number;
  runningBalance: number;
  patientName?: string;
  patientAddress?: string;
  patientContact?: string;
  prescriberName?: string;
  prescriberRegNo?: string;
  pharmacistId: string;
  pharmacistName: string;
  referenceDoc: string; // Invoice # or GRN #
}

export type ApprovalType = 'discount' | 'refund' | 'write_off' | 'stock_adjustment';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalRequest {
  id: string;
  requestType: ApprovalType;
  requestedByUserId: string;
  requestedByUserName: string;
  requestedAt: string;
  title: string;
  details: string;
  amountUGX?: number;
  relatedRecordId?: string; // e.g. saleId or batchId
  status: ApprovalStatus;
  reviewedByUserId?: string;
  reviewedByUserName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface CashierShift {
  id: string;
  cashierId: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  openingFloatUGX: number;
  cashSalesUGX: number;
  mtnMoMoSalesUGX: number;
  airtelSalesUGX: number;
  cardSalesUGX: number;
  totalSalesUGX: number;
  expectedCashInDrawerUGX: number;
  actualCountedCashUGX?: number;
  varianceUGX?: number; // actual - expected
  status: 'open' | 'closed';
  notes?: string;
}

export interface GoodsReceivedNote {
  id: string;
  grnNumber: string;
  supplierId: string;
  supplierName: string;
  supplierInvoiceRef: string;
  receivedDate: string;
  receivedByUserId: string;
  receivedByUserName: string;
  items: {
    productId: string;
    productName: string;
    batchNumber: string;
    expiryDate: string;
    quantityReceived: number;
    unitCostUGX: number;
    retailPriceUGX: number;
    wholesalePriceUGX: number;
    lineTotalUGX: number;
    location: 'Shop Floor' | 'Main Store';
  }[];
  totalAmountUGX: number;
  status: 'verified' | 'draft';
  notes?: string;
}

export interface WholesaleOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  orderType: 'quotation' | 'pro_forma' | 'invoice';
  date: string;
  validUntilDate: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPriceUGX: number;
    lineTotalUGX: number;
  }[];
  subtotalUGX: number;
  taxUGX: number;
  totalUGX: number;
  status: 'draft' | 'issued' | 'converted_to_sale' | 'expired';
  deliveryNoteNumber?: string;
}

export interface CompanySettings {
  businessName: string;
  logoDataUrl?: string;
  legalEntity: string;
  tinNumber: string;
  vatNumber: string;
  drugAuthorityLicense: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  receiptFooterMessage: string;
  currencyCode: string; // "UGX"
  standardVatRatePercent: number; // 18
  efrisDeviceNumber: string;
  backupRetentionDays: number;
}
