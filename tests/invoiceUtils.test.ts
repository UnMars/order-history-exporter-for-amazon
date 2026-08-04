import { describe, it, expect } from 'vitest';
import {
  buildInvoicePopoverUrl,
  isPdfInvoiceHref,
  buildInvoiceFilename,
} from '../src/utils/invoiceUtils';

describe('buildInvoicePopoverUrl', () => {
  it('builds the correct URL for amazon.fr', () => {
    expect(buildInvoicePopoverUrl('https://www.amazon.fr', '407-0100142-8760371')).toBe(
      'https://www.amazon.fr/your-orders/invoice/popover?orderId=407-0100142-8760371&ref_=fed_invoice_ajax'
    );
  });

  it('uses the provided origin verbatim (no locale assumptions)', () => {
    expect(buildInvoicePopoverUrl('https://www.amazon.de', '123-4567890-1234567')).toBe(
      'https://www.amazon.de/your-orders/invoice/popover?orderId=123-4567890-1234567&ref_=fed_invoice_ajax'
    );
  });

  it('URL-encodes the order ID', () => {
    const url = buildInvoicePopoverUrl('https://www.amazon.com', 'x?y&z');
    expect(url).toContain('orderId=x%3Fy%26z');
  });
});

describe('isPdfInvoiceHref', () => {
  it('accepts the /documents/download/<uuid>/invoice.pdf pattern (Amazon direct)', () => {
    expect(
      isPdfInvoiceHref('/documents/download/83f29a5a-8a6b-4e33-912f-faca564f0155/invoice.pdf')
    ).toBe(true);
  });

  it('accepts any .pdf link (third-party sellers)', () => {
    expect(isPdfInvoiceHref('/invoice/Invoice-10311208054609.pdf')).toBe(true);
    expect(isPdfInvoiceHref('/invoice/download?file=invoiceId-2509869886.pdf')).toBe(true);
  });

  it('rejects the printable order summary link', () => {
    expect(isPdfInvoiceHref('/gp/css/summary/print.html?orderID=407-0100142-8760371')).toBe(false);
  });

  it('rejects the "request an invoice" contact link', () => {
    expect(isPdfInvoiceHref('/gp/help/contact/contact.html?orderID=407-0100142-8760371')).toBe(
      false
    );
  });

  it('rejects javascript: pseudo-URLs', () => {
    expect(isPdfInvoiceHref('javascript:void(0)')).toBe(false);
  });

  it('rejects empty strings', () => {
    expect(isPdfInvoiceHref('')).toBe(false);
  });

  it('is case-insensitive on the extension', () => {
    expect(isPdfInvoiceHref('/documents/download/x/INVOICE.PDF')).toBe(true);
  });
});

describe('buildInvoiceFilename', () => {
  it('returns the plain order-id filename when there is only one invoice', () => {
    expect(buildInvoiceFilename('407-0100142-8760371', 0, 1)).toBe('407-0100142-8760371.pdf');
  });

  it('suffixes with a 1-based index when the order has several invoices', () => {
    expect(buildInvoiceFilename('407-0100142-8760371', 0, 3)).toBe('407-0100142-8760371_1.pdf');
    expect(buildInvoiceFilename('407-0100142-8760371', 1, 3)).toBe('407-0100142-8760371_2.pdf');
    expect(buildInvoiceFilename('407-0100142-8760371', 2, 3)).toBe('407-0100142-8760371_3.pdf');
  });

  it('prepends the subfolder when provided', () => {
    expect(buildInvoiceFilename('407-0100142-8760371', 0, 1, 'amazon-invoices')).toBe(
      'amazon-invoices/407-0100142-8760371.pdf'
    );
  });

  it('keeps the subfolder in the multi-invoice case too', () => {
    expect(buildInvoiceFilename('407-0100142-8760371', 1, 2, 'amazon-invoices')).toBe(
      'amazon-invoices/407-0100142-8760371_2.pdf'
    );
  });
});
