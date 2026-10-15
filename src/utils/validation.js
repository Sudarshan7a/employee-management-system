import { DEPARTMENTS, LOCATIONS } from '../data/seedEmployees.js';
import { formatINR, parseSalaryNumber } from './format.js';
import { detectReportingCycle } from './orgTree.js';

/** Shared form validation for create drawer + inline row editing. */
export function validateEmployeeForm(data, employees, editingId = null) {
  const errors = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Full name is required (min 2 characters).';
  }
  if (!data.role || data.role.trim().length < 2) {
    errors.role = 'Role title is required.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email.trim())) {
    errors.email = 'Enter a valid work email address.';
  } else {
    const isDuplicate = employees.some(
      (emp) => emp.email.toLowerCase() === data.email.trim().toLowerCase() && emp.id !== editingId,
    );
    if (isDuplicate) errors.email = 'An employee with this email already exists.';
  }

  const phoneClean = (data.phone || '').replace(/[\s()-]/g, '');
  if (!phoneClean || !/^\+?[0-9]{8,15}$/.test(phoneClean)) {
    errors.phone = 'Enter a valid phone number (8–15 digits).';
  }

  if (editingId && data.managerId) {
    const cycleCheck = detectReportingCycle(employees, editingId, data.managerId);
    if (cycleCheck.hasCycle) {
      errors.managerId = `Circular hierarchy blocked: ${cycleCheck.path.join(' → ')}`;
    }
  }
  return errors;
}

/** Extracts name/role/email/phone/dept/location/salary from pasted text. */
export function parseUnstructuredCandidateText(raw) {
  const result = {};
  if (!raw || !raw.trim()) return result;

  const emailMatch = raw.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  if (emailMatch) result.email = emailMatch[1].toLowerCase();

  const phoneMatch = raw.match(/(\+?\d{1,3}[\s-]?)?\d{5}[\s-]?\d{5}|\+?\d{10,13}/);
  if (phoneMatch) result.phone = phoneMatch[0].trim();

  const salaryMatch = raw.match(/(?:₹\s*\d[\d,]{4,12}|\b\d{2}(?:\.\d+)?\s*L(?:akhs?)?\b)/i);
  if (salaryMatch) result.salary = parseSalaryNumber(salaryMatch[0]);

  for (const dept of DEPARTMENTS) {
    if (new RegExp(`\\b${dept}\\b`, 'i').test(raw)) {
      result.department = dept;
      break;
    }
  }
  for (const loc of LOCATIONS) {
    if (new RegExp(`\\b${loc}\\b`, 'i').test(raw)) {
      result.location = loc;
      break;
    }
  }

  const cleaned = raw
    .replace(emailMatch?.[0] || '', '')
    .replace(phoneMatch?.[0] || '', '')
    .replace(salaryMatch?.[0] || '', '')
    .split(/[,|\n—–-]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);

  const roleKeywords =
    /(engineer|developer|designer|manager|lead|intern|partner|director|architect|analyst|qa|specialist|vp|head)/i;

  for (const segment of cleaned) {
    if (!result.role && roleKeywords.test(segment)) {
      result.role = segment.replace(/^(role|title)\s*:\s*/i, '').trim();
    } else if (
      !result.name &&
      /^[A-Za-z\s.]{3,35}$/.test(segment) &&
      !DEPARTMENTS.some((d) => d.toLowerCase() === segment.toLowerCase()) &&
      !LOCATIONS.some((l) => l.toLowerCase() === segment.toLowerCase())
    ) {
      result.name = segment.replace(/^(name|candidate)\s*:\s*/i, '').trim();
    }
  }

  if (result.role && !result.department) {
    if (/design|ux|ui/i.test(result.role)) result.department = 'Design';
    else if (/product|pm|analytics/i.test(result.role)) result.department = 'Product';
    else if (/people|hr|operations|talent|recruiter/i.test(result.role)) result.department = 'Operations';
    else result.department = 'Engineering';
  }

  return result;
}

/** Field-level before → after diffs for the audit log. */
export function computeEmployeeDiffs(beforeEmp, afterEmp) {
  const trackedFields = [
    'name',
    'role',
    'department',
    'email',
    'phone',
    'location',
    'status',
    'salary',
    'managerId',
    'joinedAt',
  ];
  const diffs = [];
  for (const field of trackedFields) {
    const prevVal = beforeEmp[field] ?? null;
    const nextVal = afterEmp[field] ?? null;
    if (String(prevVal) !== String(nextVal)) {
      diffs.push({
        field,
        before: field === 'salary' ? formatINR(prevVal) : String(prevVal || 'None'),
        after: field === 'salary' ? formatINR(nextVal) : String(nextVal || 'None'),
      });
    }
  }
  return diffs;
}
