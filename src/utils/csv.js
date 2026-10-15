import { formatINR } from './format.js';

/** Serialises employees (or a selection) to CSV for Excel/Sheets. */
export function employeesToCsv(rows) {
  const headers = ['ID', 'Name', 'Role', 'Department', 'Email', 'Phone', 'Location', 'Salary', 'Status', 'ManagerID'];
  const lines = [
    headers.join(','),
    ...rows.map((e) =>
      [
        e.id,
        `"${(e.name || '').replace(/"/g, '""')}"`,
        `"${(e.role || '').replace(/"/g, '""')}"`,
        e.department,
        e.email,
        `"${e.phone}"`,
        e.location,
        e.salary,
        e.status,
        e.managerId || '',
      ].join(','),
    ),
  ];
  return lines.join('\n');
}

/**
 * Parses pasted CSV (with optional header) or a JSON array into
 * { rows } with per-row VALID / DUPLICATE_EMAIL / INVALID_SCHEMA status.
 */
export function parseBatchInput(text, employees) {
  const trimmed = (text || '').trim();
  if (!trimmed) return [];

  const existingEmails = new Set(employees.map((e) => e.email.toLowerCase()));
  const seenInBatch = new Set();

  let rawRows = [];
  if (trimmed.startsWith('[')) {
    try {
      const parsedJson = JSON.parse(trimmed);
      if (Array.isArray(parsedJson)) rawRows = parsedJson;
    } catch {
      return [];
    }
  } else {
    const lines = trimmed
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const startIndex = lines[0] && /name.*role.*email/i.test(lines[0]) ? 1 : 0;
    rawRows = lines.slice(startIndex).map((line) => {
      const cols = line.split(',').map((c) => c.trim());
      return {
        name: cols[0] || '',
        role: cols[1] || '',
        department: cols[2] || 'Engineering',
        email: cols[3] || '',
        phone: cols[4] || '+91 98000 00000',
        location: cols[5] || 'Bengaluru',
        salary: cols[6] || '2400000',
        status: cols[7] || 'Active',
      };
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return rawRows.map((row, idx) => {
    const emailLower = (row.email || '').toLowerCase();
    let validationStatus = 'VALID';
    let reason = 'Ready to import';

    if (!row.name || row.name.length < 2 || !row.role) {
      validationStatus = 'INVALID_SCHEMA';
      reason = 'Missing required Name or Role';
    } else if (!emailRegex.test(emailLower)) {
      validationStatus = 'INVALID_SCHEMA';
      reason = 'Invalid email format';
    } else if (existingEmails.has(emailLower)) {
      validationStatus = 'DUPLICATE_EMAIL';
      reason = 'Email already exists in directory';
    } else if (seenInBatch.has(emailLower)) {
      validationStatus = 'DUPLICATE_EMAIL';
      reason = 'Duplicate email within batch';
    } else {
      seenInBatch.add(emailLower);
    }

    return { idx: idx + 1, ...row, validationStatus, reason };
  });
}

export { formatINR };
