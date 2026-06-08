import { describe, it, expect } from 'vitest';
import {
  buildTransactionUrl,
  formatTransactionDatesForCSV,
  formatTransactionAmountsForCSV,
  parseCPETransactionAmount,
} from '../src/utils/transactionUtils';
import type { Transaction } from '../src/types';

describe('buildTransactionUrl', () => {
  it('should build the correct URL for amazon.com', () => {
    const url = buildTransactionUrl('https://www.amazon.com', '112-1234567-1234567');
    expect(url).toBe(
      'https://www.amazon.com/cpe/yourpayments/transactions?transactionTag=112-1234567-1234567'
    );
  });

  it('should build the correct URL for amazon.de', () => {
    const url = buildTransactionUrl('https://www.amazon.de', '123-4567890-1234567');
    expect(url).toBe(
      'https://www.amazon.de/cpe/yourpayments/transactions?transactionTag=123-4567890-1234567'
    );
  });

  it('should build the correct URL for amazon.co.uk', () => {
    const url = buildTransactionUrl('https://www.amazon.co.uk', '026-9876543-2109876');
    expect(url).toBe(
      'https://www.amazon.co.uk/cpe/yourpayments/transactions?transactionTag=026-9876543-2109876'
    );
  });

  it('should URL-encode the order ID', () => {
    const url = buildTransactionUrl('https://www.amazon.com', '112-1234567-1234567');
    expect(url).toContain('transactionTag=112-1234567-1234567');
  });

  it('should use the provided origin verbatim', () => {
    const url = buildTransactionUrl('https://www.amazon.fr', '111-2222222-3333333');
    expect(url.startsWith('https://www.amazon.fr')).toBe(true);
  });
});

describe('formatTransactionDatesForCSV', () => {
  it('should return empty string for no transactions', () => {
    expect(formatTransactionDatesForCSV([])).toBe('');
  });

  it('should return the date for a single transaction', () => {
    const transactions: Transaction[] = [{ date: '2026-04-17', amount: 14.93, currency: 'USD' }];
    expect(formatTransactionDatesForCSV(transactions)).toBe('2026-04-17');
  });

  it('should join multiple dates with " | "', () => {
    const transactions: Transaction[] = [
      { date: '2026-04-17', amount: 14.93, currency: 'USD' },
      { date: '2026-04-20', amount: 61.01, currency: 'USD' },
    ];
    expect(formatTransactionDatesForCSV(transactions)).toBe('2026-04-17 | 2026-04-20');
  });

  it('should handle three transactions', () => {
    const transactions: Transaction[] = [
      { date: '2026-01-01', amount: 10.0, currency: 'EUR' },
      { date: '2026-01-05', amount: 20.0, currency: 'EUR' },
      { date: '2026-01-10', amount: 5.5, currency: 'EUR' },
    ];
    expect(formatTransactionDatesForCSV(transactions)).toBe('2026-01-01 | 2026-01-05 | 2026-01-10');
  });
});

describe('formatTransactionAmountsForCSV', () => {
  it('should return empty string for no transactions', () => {
    expect(formatTransactionAmountsForCSV([])).toBe('');
  });

  it('should return the amount as a string for a single transaction', () => {
    const transactions: Transaction[] = [{ date: '2026-04-17', amount: 14.93, currency: 'USD' }];
    expect(formatTransactionAmountsForCSV(transactions)).toBe('14.93');
  });

  it('should join multiple amounts with " | "', () => {
    const transactions: Transaction[] = [
      { date: '2026-04-17', amount: 14.93, currency: 'USD' },
      { date: '2026-04-20', amount: 61.01, currency: 'USD' },
    ];
    expect(formatTransactionAmountsForCSV(transactions)).toBe('14.93 | 61.01');
  });

  it('should handle integer amounts', () => {
    const transactions: Transaction[] = [
      { date: '2026-01-01', amount: 10, currency: 'EUR' },
      { date: '2026-01-05', amount: 20, currency: 'EUR' },
    ];
    expect(formatTransactionAmountsForCSV(transactions)).toBe('10 | 20');
  });

  it('should handle three transactions', () => {
    const transactions: Transaction[] = [
      { date: '2026-01-01', amount: 10.0, currency: 'EUR' },
      { date: '2026-01-05', amount: 20.5, currency: 'EUR' },
      { date: '2026-01-10', amount: 5.99, currency: 'EUR' },
    ];
    expect(formatTransactionAmountsForCSV(transactions)).toBe('10 | 20.5 | 5.99');
  });
});

describe('parseCPETransactionAmount', () => {
  it('treats "-$X.XX" (Amazon debit) as positive charge in export', () => {
    expect(parseCPETransactionAmount('-$51.12')).toEqual({ amount: 51.12, currency: 'USD' });
  });

  it('treats "$X.XX" (Amazon credit) as negative refund in export', () => {
    expect(parseCPETransactionAmount('$10.00')).toEqual({ amount: -10, currency: 'USD' });
  });

  it('handles EUR amounts with European decimal comma', () => {
    expect(parseCPETransactionAmount('-€52,95')).toEqual({ amount: 52.95, currency: 'EUR' });
  });

  it('handles the unicode minus sign (−) as a debit indicator', () => {
    expect(parseCPETransactionAmount('−$51.12')).toEqual({ amount: 51.12, currency: 'USD' });
  });

  it('returns null for zero amounts', () => {
    expect(parseCPETransactionAmount('$0.00')).toBeNull();
  });

  it('returns null when no price is found', () => {
    expect(parseCPETransactionAmount('no amount here')).toBeNull();
  });

  it('trims whitespace before checking for the minus sign', () => {
    expect(parseCPETransactionAmount('  -$14.93  ')).toEqual({ amount: 14.93, currency: 'USD' });
  });
});
