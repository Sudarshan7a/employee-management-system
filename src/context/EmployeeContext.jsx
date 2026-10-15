import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AUDIT_STORAGE_KEY,
  DEFAULT_ONBOARDING_TASKS,
  DEPARTMENTS,
  LOCATIONS,
  SEED_EMPLOYEES,
  STATUSES,
  STORAGE_KEY,
} from '../data/seedEmployees.js';
import { formatINR, parseSalaryNumber } from '../utils/format.js';
import { computeEmployeeDiffs } from '../utils/validation.js';

const EmployeeContext = createContext(null);

export function useEmployees() {
  const ctx = useContext(EmployeeContext);
  if (!ctx) throw new Error('useEmployees must be used within an EmployeeProvider');
  return ctx;
}

function nextEmployeeId(employees) {
  const maxNum = employees.reduce((max, emp) => {
    const num = parseInt(String(emp.id).replace('EMP-', ''), 10);
    return Number.isNaN(num) ? max : Math.max(max, num);
  }, 100);
  return `EMP-${maxNum + 1}`;
}

export function EmployeeProvider({ children }) {
  const [employees, setEmployees] = useState(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('localStorage read fallback:', e);
    }
    return SEED_EMPLOYEES;
  });

  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const [auditLog, setAuditLog] = useState(() => {
    try {
      const savedAudit = window.localStorage.getItem(AUDIT_STORAGE_KEY);
      if (savedAudit) {
        const parsed = JSON.parse(savedAudit);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('auditLog read fallback:', e);
    }
    return [
      {
        id: 'AUD-INIT',
        timestamp: new Date().toISOString(),
        actionType: 'SYSTEM_INIT',
        summary: 'Initialized directory with 10 seed employee records',
        targetId: null,
        diffs: [],
        snapshot: SEED_EMPLOYEES,
      },
    ];
  });

  // Hash routes: /employees, /employees/new, /employees/:id, /readme
  const [route, setRouteState] = useState(() => {
    const hash = window.location.hash.replace(/^#/, '');
    return hash.startsWith('/') ? hash : '/employees';
  });

  const setRoute = useCallback((nextPath) => {
    setRouteState(nextPath);
    try {
      window.location.hash = nextPath;
    } catch {
      // ignore hash restrictions
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash.startsWith('/')) setRouteState(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [createPrefill, setCreatePrefill] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
    } catch (e) {
      console.warn('localStorage write error:', e);
    }
  }, [employees]);

  useEffect(() => {
    try {
      window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(auditLog.slice(0, 40)));
    } catch (e) {
      console.warn('auditLog write error:', e);
    }
  }, [auditLog]);

  const showToast = useCallback((message, options = {}) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ id: Date.now(), message, type: options.type || 'default' });
    toastTimerRef.current = setTimeout(() => setToast(null), 5500);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  }, []);

  const commitMutation = useCallback(
    ({ nextEmployees, actionType, summary, targetId = null, diffs = [] }) => {
      setPast((prev) => [
        ...prev.slice(-29),
        { employees, summary, actionType, timestamp: new Date().toISOString() },
      ]);
      setFuture([]);
      setEmployees(nextEmployees);

      const entry = {
        id: `AUD-${Date.now().toString().slice(-5)}`,
        timestamp: new Date().toISOString(),
        actionType,
        summary,
        targetId,
        diffs,
        snapshot: nextEmployees,
      };
      setAuditLog((prev) => [entry, ...prev.slice(0, 49)]);
    },
    [employees],
  );

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setFuture((prev) => [
      { employees, summary: previous.summary, actionType: previous.actionType, timestamp: new Date().toISOString() },
      ...prev,
    ]);
    setPast((prev) => prev.slice(0, prev.length - 1));
    setEmployees(previous.employees);
    showToast(`Undid: ${previous.summary}`);
  }, [past, employees, showToast]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const nextState = future[0];
    setPast((prev) => [
      ...prev,
      { employees, summary: nextState.summary, actionType: nextState.actionType, timestamp: new Date().toISOString() },
    ]);
    setFuture((prev) => prev.slice(1));
    setEmployees(nextState.employees);
    showToast(`Redid: ${nextState.summary}`);
  }, [future, employees, showToast]);

  const revertToSnapshot = useCallback(
    (auditEntry) => {
      if (!auditEntry?.snapshot) return;
      commitMutation({
        nextEmployees: auditEntry.snapshot,
        actionType: 'TIME_TRAVEL',
        summary: `Reverted state to snapshot ${auditEntry.id}`,
        diffs: [{ field: 'headcount', before: `${employees.length} records`, after: `${auditEntry.snapshot.length} records` }],
      });
      showToast(`Time-traveled to snapshot ${auditEntry.id}`, { type: 'success' });
    },
    [commitMutation, employees.length, showToast],
  );

  const addEmployee = useCallback(
    (payload) => {
      const newEmployee = {
        id: nextEmployeeId(employees),
        name: payload.name.trim(),
        role: payload.role.trim(),
        email: payload.email.trim().toLowerCase(),
        phone: payload.phone.trim(),
        department: payload.department || 'Engineering',
        location: payload.location || 'Bengaluru',
        status: payload.status || 'Active',
        joinedAt: payload.joinedAt || new Date().toISOString().split('T')[0],
        salary: parseSalaryNumber(payload.salary),
        managerId: payload.managerId || null,
        onboardingTasks: payload.onboardingTasks || DEFAULT_ONBOARDING_TASKS.map((t) => ({ ...t })),
      };

      commitMutation({
        nextEmployees: [newEmployee, ...employees],
        actionType: 'CREATE',
        summary: `Created ${newEmployee.name} (${newEmployee.id})`,
        targetId: newEmployee.id,
        diffs: [
          { field: 'role', before: 'None', after: newEmployee.role },
          { field: 'dept', before: 'None', after: newEmployee.department },
          { field: 'salary', before: '₹0', after: formatINR(newEmployee.salary) },
        ],
      });
      showToast(`Created ${newEmployee.name} (${newEmployee.id})`, { type: 'success' });
      return newEmployee;
    },
    [employees, commitMutation, showToast],
  );

  const updateEmployee = useCallback(
    (id, updates, actionType = 'UPDATE') => {
      const target = employees.find((e) => e.id === id);
      if (!target) return;
      const updatedRecord = {
        ...target,
        ...updates,
        salary: updates.salary !== undefined ? parseSalaryNumber(updates.salary) : target.salary,
      };
      const diffs = computeEmployeeDiffs(target, updatedRecord);
      commitMutation({
        nextEmployees: employees.map((emp) => (emp.id === id ? updatedRecord : emp)),
        actionType,
        summary:
          actionType === 'INLINE_EDIT' ? `Inline edited ${updatedRecord.name} (${id})` : `Updated ${updatedRecord.name} (${id})`,
        targetId: id,
        diffs,
      });
      showToast(`Saved changes to ${updatedRecord.name}`, { type: 'success' });
    },
    [employees, commitMutation, showToast],
  );

  const updateOnboardingTasks = useCallback(
    (employeeId, nextTasks, taskSummary) => {
      const target = employees.find((e) => e.id === employeeId);
      if (!target) return;
      const doneBefore = (target.onboardingTasks || []).filter((t) => t.done).length;
      const doneAfter = nextTasks.filter((t) => t.done).length;
      commitMutation({
        nextEmployees: employees.map((emp) => (emp.id === employeeId ? { ...emp, onboardingTasks: nextTasks } : emp)),
        actionType: 'CHECKLIST_TOGGLE',
        summary: `${target.name}: ${taskSummary}`,
        targetId: employeeId,
        diffs: [
          {
            field: 'onboarding',
            before: `${doneBefore}/${(target.onboardingTasks || []).length} done`,
            after: `${doneAfter}/${nextTasks.length} done`,
          },
        ],
      });
    },
    [employees, commitMutation],
  );

  const deleteEmployees = useCallback(
    (idsToDelete) => {
      const idSet = new Set(Array.isArray(idsToDelete) ? idsToDelete : [idsToDelete]);
      const removedItems = employees.filter((emp) => idSet.has(emp.id));
      if (removedItems.length === 0) return;

      const nextEmployees = employees
        .filter((emp) => !idSet.has(emp.id))
        .map((emp) => (idSet.has(emp.managerId) ? { ...emp, managerId: null } : emp));

      const label =
        removedItems.length === 1
          ? `Deleted ${removedItems[0].name} (${removedItems[0].id})`
          : `Deleted ${removedItems.length} employee records`;

      commitMutation({
        nextEmployees,
        actionType: 'DELETE',
        summary: label,
        targetId: removedItems.length === 1 ? removedItems[0].id : null,
        diffs: removedItems.map((r) => ({ field: r.id, before: `${r.name} · ${r.role}`, after: 'Removed' })),
      });
      showToast(label, { type: 'warning' });
    },
    [employees, commitMutation, showToast],
  );

  const bulkUpdateStatus = useCallback(
    (ids, status) => {
      const idSet = new Set(ids);
      commitMutation({
        nextEmployees: employees.map((emp) => (idSet.has(emp.id) ? { ...emp, status } : emp)),
        actionType: 'BULK_STATUS',
        summary: `Bulk updated ${ids.length} record(s) to ${status}`,
        diffs: [{ field: 'status', before: `${ids.length} selected`, after: status }],
      });
      showToast(`Updated ${ids.length} record(s) to ${status}`, { type: 'success' });
    },
    [employees, commitMutation, showToast],
  );

  const batchImportEmployees = useCallback(
    (validRows) => {
      if (!validRows?.length) return;
      let maxNum = employees.reduce((max, emp) => {
        const num = parseInt(String(emp.id).replace('EMP-', ''), 10);
        return Number.isNaN(num) ? max : Math.max(max, num);
      }, 100);

      const createdRecords = validRows.map((row) => {
        maxNum += 1;
        return {
          id: `EMP-${maxNum}`,
          name: row.name.trim(),
          role: row.role.trim(),
          department: DEPARTMENTS.includes(row.department) ? row.department : 'Engineering',
          email: row.email.trim().toLowerCase(),
          phone: row.phone.trim(),
          location: LOCATIONS.includes(row.location) ? row.location : 'Bengaluru',
          status: STATUSES.includes(row.status) ? row.status : 'Active',
          joinedAt: new Date().toISOString().split('T')[0],
          salary: parseSalaryNumber(row.salary),
          managerId: 'EMP-101',
          onboardingTasks: DEFAULT_ONBOARDING_TASKS.map((t) => ({ ...t })),
        };
      });

      commitMutation({
        nextEmployees: [...createdRecords, ...employees],
        actionType: 'BATCH_IMPORT',
        summary: `Batch imported ${createdRecords.length} employees`,
        diffs: createdRecords.map((c) => ({ field: c.id, before: 'New Import', after: `${c.name} (${c.department})` })),
      });
      showToast(`Imported ${createdRecords.length} employees into directory`, { type: 'success' });
    },
    [employees, commitMutation, showToast],
  );

  const resetToSeed = useCallback(() => {
    commitMutation({
      nextEmployees: SEED_EMPLOYEES,
      actionType: 'SEED_RESET',
      summary: 'Reset directory to initial 10 seed records',
      diffs: [{ field: 'state', before: `${employees.length} records`, after: '10 seed records' }],
    });
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_EMPLOYEES));
    } catch {
      // ignore
    }
    showToast('Reset directory to initial 10 seed records');
  }, [commitMutation, employees.length, showToast]);

  const openCreateWithManager = useCallback(
    (managerEmp) => {
      setCreatePrefill({
        managerId: managerEmp?.id || null,
        department: managerEmp?.department || 'Engineering',
        location: managerEmp?.location || 'Bengaluru',
      });
      setRoute('/employees/new');
    },
    [setRoute],
  );

  const value = useMemo(
    () => ({
      employees,
      past,
      future,
      auditLog,
      undo,
      redo,
      revertToSnapshot,
      route,
      setRoute,
      createPrefill,
      setCreatePrefill,
      openCreateWithManager,
      addEmployee,
      updateEmployee,
      updateOnboardingTasks,
      deleteEmployees,
      bulkUpdateStatus,
      batchImportEmployees,
      resetToSeed,
      toast,
      dismissToast,
      showToast,
    }),
    [
      employees,
      past,
      future,
      auditLog,
      undo,
      redo,
      revertToSnapshot,
      route,
      setRoute,
      createPrefill,
      openCreateWithManager,
      addEmployee,
      updateEmployee,
      updateOnboardingTasks,
      deleteEmployees,
      bulkUpdateStatus,
      batchImportEmployees,
      resetToSeed,
      toast,
      dismissToast,
      showToast,
    ],
  );

  return <EmployeeContext.Provider value={value}>{children}</EmployeeContext.Provider>;
}
