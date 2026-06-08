/**
 * Transaction URL building, CSV formatting, and pure text parsing utilities.
 *
 * DOM traversal for CPE pages lives in the content script (see
 * `parseTransactionsFromCPEDoc` in content.ts). Utilities here are pure data
 * transforms so they can be unit-tested without a DOM implementation.
 */

import type { Transaction } from '../types';
import { extractPriceFromText } from './priceUtils';

export function buildTransactionUrl(origin: string, orderId: string): string {
  return `${origin}/cpe/yourpayments/transactions?transactionTag=${encodeURIComponent(orderId)}`;
}

export function formatTransactionDatesForCSV(transactions: Transaction[]): string {
  if (transactions.length === 0) return '';
  return transactions.map((t) => t.date).join(' | ');
}

export function formatTransactionAmountsForCSV(transactions: Transaction[]): string {
  if (transactions.length === 0) return '';
  return transactions.map((t) => String(t.amount)).join(' | ');
}

/**
 * Convert a raw amount string from Amazon's CPE page into a signed transaction
 * amount. Amazon shows charges as "-$X.XX" (debit) and refunds as "$X.XX"
 * (credit). We normalize so the export reflects the user's perspective —
 * positive means paid, negative means refunded.
 *
 * Returns null when no numeric amount could be parsed.
 */
export function parseCPETransactionAmount(
  amountText: string
): { amount: number; currency: string } | null {
  const isDebit = /^[-−]/.test(amountText.trim());
  const price = extractPriceFromText(amountText);
  if (!price || price.amount === 0) return null;
  return {
    amount: isDebit ? price.amount : -price.amount,
    currency: price.currency,
  };
}
