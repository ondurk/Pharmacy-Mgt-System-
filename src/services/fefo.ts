import { StockBatch } from '../types';

export interface BatchAllocation {
  batch: StockBatch;
  allocatedQty: number;
}

export type ExpiryStatus = 'expired' | 'critical_30' | 'warning_60' | 'notice_90' | 'safe';

/**
 * Calculates days remaining until a batch expires.
 * Positive = valid days left, Negative = expired days ago.
 */
export function getDaysUntilExpiry(expiryDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getExpiryStatus(expiryDateStr: string): {
  status: ExpiryStatus;
  label: string;
  days: number;
} {
  const days = getDaysUntilExpiry(expiryDateStr);
  if (days <= 0) {
    return { status: 'expired', label: 'EXPIRED', days };
  } else if (days <= 30) {
    return { status: 'critical_30', label: `< ${days}d (Critical)`, days };
  } else if (days <= 60) {
    return { status: 'warning_60', label: `< ${days}d (Warning)`, days };
  } else if (days <= 90) {
    return { status: 'notice_90', label: `< ${days}d (Notice)`, days };
  }
  return { status: 'safe', label: `${days}d (Good)`, days };
}

/**
 * FEFO Algorithm (First Expiry First Out)
 * Orders candidate batches by earliest expiry date.
 * Strictly excludes any batch that has already expired.
 */
export function allocateBatchesFEFO(
  batches: StockBatch[],
  requiredQty: number
): {
  allocations: BatchAllocation[];
  allocatedTotal: number;
  unfulfilledQty: number;
  hasExpiredStockBlocked: boolean;
} {
  // Sort batches ascending by expiry date (earliest first)
  const validBatches = batches
    .filter(b => b.quantityOnHand > 0)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  const allocations: BatchAllocation[] = [];
  let remainingNeeded = requiredQty;
  let hasExpiredStockBlocked = false;

  for (const batch of validBatches) {
    const days = getDaysUntilExpiry(batch.expiryDate);
    if (days <= 0) {
      // Strictly block expired stock from being sold
      hasExpiredStockBlocked = true;
      continue;
    }

    if (remainingNeeded <= 0) break;

    const qtyToTake = Math.min(batch.quantityOnHand, remainingNeeded);
    allocations.push({
      batch,
      allocatedQty: qtyToTake,
    });
    remainingNeeded -= qtyToTake;
  }

  const allocatedTotal = requiredQty - remainingNeeded;

  return {
    allocations,
    allocatedTotal,
    unfulfilledQty: remainingNeeded,
    hasExpiredStockBlocked,
  };
}
