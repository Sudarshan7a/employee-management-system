/**
 * Clipboard, download, initials and INR salary helpers.
 * Kept in one module so table, drawer, grid and exporter share logic.
 */

/** Copies text reliably in tabs and sandboxed preview iframes. */
export function copyTextToClipboard(text) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (ok) return true;
  } catch {
    // fall through to Clipboard API
  }
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
    return true;
  }
  return false;
}

export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

/** Accepts numbers, "32L", "₹32,00,000" etc. and returns paise-free INR. */
export function parseSalaryNumber(val) {
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  if (!val) return 2400000;
  const str = String(val).trim().toUpperCase();
  const lakhMatch = str.match(/^₹?\s*(\d+(?:\.\d+)?)\s*L(?:AKHS?)?$/i);
  if (lakhMatch) return Math.round(parseFloat(lakhMatch[1]) * 100000);

  const digits = str.replace(/[^0-9]/g, '');
  const parsed = parseInt(digits, 10);
  if (Number.isNaN(parsed)) return 2400000;
  return parsed < 1000 ? parsed * 100000 : parsed;
}

export function formatINR(val, compact = false) {
  const num = parseSalaryNumber(val);
  if (compact) {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    return `₹${(num / 100000).toFixed(1)}L`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}
