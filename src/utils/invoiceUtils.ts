/**
 * Invoice URL building and pure link-classification utilities.
 *
 * DOM traversal for the invoice popover page lives in the content script
 * (see `extractInvoicePdfHrefs` in content.ts). Helpers here are pure so
 * they can be unit-tested without a DOM implementation.
 */

/**
 * Build the URL of the "Invoice" popover that Amazon opens on click.
 * The popover HTML is the only place the real PDF link lives; the
 * order-details page only holds an AJAX trigger URL. We omit
 * `relatedRequestId` (a page-scoped token) since Amazon still serves
 * the popover without it as long as the session cookies are valid.
 */
export function buildInvoicePopoverUrl(origin: string, orderId: string): string {
  return `${origin}/your-orders/invoice/popover?orderId=${encodeURIComponent(
    orderId
  )}&ref_=fed_invoice_ajax`;
}

/**
 * Decide whether an `<a href>` from the invoice popover points at a
 * downloadable PDF. The popover typically lists three links:
 *   1. `/gp/css/summary/print.html?orderID=...` (HTML order summary)
 *   2. `/documents/download/<uuid>/invoice.pdf` (the actual invoice PDF)
 *   3. `/gp/help/contact/...` ("request an invoice" fallback)
 * We keep only the second one, or any other `.pdf`-looking link, since
 * third-party sellers may use different paths.
 */
export function isPdfInvoiceHref(href: string): boolean {
  if (!href) return false;
  const normalized = href.trim().toLowerCase();
  if (normalized.startsWith('javascript:')) return false;
  if (normalized.includes('/gp/help/')) return false;
  if (normalized.includes('/summary/print.html')) return false;
  if (normalized.includes('/summary/print.htm')) return false;
  return /\.pdf(?:$|[?#])/i.test(normalized) || normalized.includes('/documents/download/');
}

/**
 * Build the on-disk filename for a downloaded invoice PDF. The order ID
 * appears verbatim so downstream tools can match files back to orders.
 * When one order yields several invoices (multi-shipment orders), a
 * 1-based index keeps filenames unique.
 *
 * The `subfolder` prefix (e.g. `"amazon-invoices"`) is relative to the
 * browser's Downloads directory and lets the user keep invoices grouped
 * without touching the browser's download settings.
 */
export function buildInvoiceFilename(
  orderId: string,
  index: number,
  total: number,
  subfolder?: string
): string {
  const suffix = total > 1 ? `_${index + 1}` : '';
  const base = `${orderId}${suffix}.pdf`;
  return subfolder ? `${subfolder}/${base}` : base;
}
