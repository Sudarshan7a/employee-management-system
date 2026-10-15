import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Command,
  Download,
  FileSpreadsheet,
  FileText,
  GitBranch,
  History,
  Layers,
  LayoutGrid,
  LayoutList,
  Plus,
  Redo2,
  Search,
  SlidersHorizontal,
  Trash2,
  Undo2,
  Upload,
  X,
} from 'lucide-react';
import { useEmployees } from '../context/EmployeeContext.jsx';
import { DEPARTMENTS } from '../data/seedEmployees.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { copyTextToClipboard, downloadFile, formatINR, getInitials, parseSalaryNumber } from '../utils/format.js';
import { employeesToCsv } from '../utils/csv.js';
import { validateEmployeeForm } from '../utils/validation.js';
import { EmployeeTableRow } from './EmployeeTableRow.jsx';
import { EmployeeDrawer } from './EmployeeDrawer.jsx';
import { AuditHistoryDrawer, BatchImportModal } from './Overlays.jsx';
import { OrgChartTreeView } from './OrgChartTreeView.jsx';
import { CommandPalette } from './CommandPalette.jsx';
import { ReadmeView } from './ReadmeView.jsx';
import { SortableHeader, StatusPill } from './ui.jsx';

export function DirectoryWorkspace() {
  const {
    employees,
    past,
    future,
    undo,
    redo,
    route,
    setRoute,
    updateEmployee,
    deleteEmployees,
    bulkUpdateStatus,
    toast,
    dismissToast,
    showToast,
  } = useEmployees();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 120);

  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [groupBy, setGroupBy] = useState('none');
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [viewMode, setViewMode] = useState('table');
  const [density, setDensity] = useState('comfortable');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [visibleCols, setVisibleCols] = useState({
    role: true,
    department: true,
    email: true,
    phone: true,
    manager: true,
    salary: true,
    status: true,
  });
  const [isColsPopoverOpen, setIsColsPopoverOpen] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);
  const [focusedRowIndex, setFocusedRowIndex] = useState(-1);
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineDraft, setInlineDraft] = useState({});
  const [inlineError, setInlineError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const searchInputRef = useRef(null);

  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const isNewDrawerOpen = route === '/employees/new';
  const activeEmployeeId = route.startsWith('/employees/EMP-') ? route.replace('/employees/', '') : null;
  const activeEmployee = useMemo(
    () => employees.find((e) => e.id === activeEmployeeId) || null,
    [employees, activeEmployeeId],
  );

  const processedEmployees = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const filtered = employees.filter((emp) => {
      const mgrName = emp.managerId ? employeeMap.get(emp.managerId)?.name?.toLowerCase() || '' : '';
      const matchesSearch =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.phone.toLowerCase().includes(q) ||
        emp.id.toLowerCase().includes(q) ||
        emp.location.toLowerCase().includes(q) ||
        mgrName.includes(q);
      const matchesDept = deptFilter === 'All' || emp.department === deptFilter;
      const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      if (sortConfig.key === 'salary') {
        const numA = parseSalaryNumber(a.salary);
        const numB = parseSalaryNumber(b.salary);
        return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
      }
      const valA = (a[sortConfig.key] || '').toString().toLowerCase();
      const valB = (b[sortConfig.key] || '').toString().toLowerCase();
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [employees, employeeMap, debouncedSearch, deptFilter, statusFilter, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(processedEmployees.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedEmployees.slice(start, start + pageSize);
  }, [processedEmployees, currentPage, pageSize]);

  const groupedSwimlanes = useMemo(() => {
    if (groupBy === 'none') return null;
    const groups = new Map();
    processedEmployees.forEach((emp) => {
      const key = emp[groupBy] || 'Unassigned';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(emp);
    });
    return Array.from(groups.entries()).map(([groupKey, items]) => ({
      groupKey,
      items,
      totalPayroll: items.reduce((sum, item) => sum + parseSalaryNumber(item.salary), 0),
      activeCount: items.filter((i) => i.status === 'Active').length,
    }));
  }, [processedEmployees, groupBy]);

  useEffect(() => {
    setPage(1);
    setFocusedRowIndex(-1);
  }, [debouncedSearch, deptFilter, statusFilter, pageSize, groupBy]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select';

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCmdOpen((prev) => !prev);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && !isTyping && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (e.key === 'Escape') {
        if (isCmdOpen) setIsCmdOpen(false);
        else if (isBatchModalOpen) setIsBatchModalOpen(false);
        else if (isAuditOpen) setIsAuditOpen(false);
        else if (isColsPopoverOpen) setIsColsPopoverOpen(false);
        else if (inlineEditId) {
          setInlineEditId(null);
          setInlineError(null);
        } else if (route !== '/employees') {
          setRoute('/employees');
        } else if (selectedIds.length > 0) {
          setSelectedIds([]);
        }
        return;
      }
      if (isTyping || isCmdOpen || isBatchModalOpen || isAuditOpen || route !== '/employees') return;

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setRoute('/employees/new');
      } else if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRowIndex((prev) => Math.min(paginatedEmployees.length - 1, prev + 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedRowIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Enter' && focusedRowIndex >= 0) {
        const target = paginatedEmployees[focusedRowIndex];
        if (target) setRoute(`/employees/${target.id}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isCmdOpen,
    isBatchModalOpen,
    isAuditOpen,
    isColsPopoverOpen,
    inlineEditId,
    route,
    selectedIds.length,
    focusedRowIndex,
    paginatedEmployees,
    setRoute,
    undo,
    redo,
  ]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const startInlineEdit = (emp, e) => {
    e?.stopPropagation();
    setInlineEditId(emp.id);
    setInlineDraft({
      name: emp.name,
      role: emp.role,
      department: emp.department,
      email: emp.email,
      phone: emp.phone,
      salary: emp.salary,
      status: emp.status,
    });
    setInlineError(null);
  };

  const commitInlineEdit = (id, e) => {
    e?.stopPropagation();
    const validationErrors = validateEmployeeForm(inlineDraft, employees, id);
    if (Object.keys(validationErrors).length > 0) {
      setInlineError(Object.values(validationErrors)[0]);
      return;
    }
    updateEmployee(id, inlineDraft, 'INLINE_EDIT');
    setInlineEditId(null);
    setInlineError(null);
  };

  const toggleSelectAllPage = () => {
    const pageIds = paginatedEmployees.map((e) => e.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    else setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
  };

  const toggleSelectRow = (id, e) => {
    e.stopPropagation();
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleCopyEmail = (email, id, e) => {
    e.stopPropagation();
    copyTextToClipboard(email);
    setCopiedId(id);
    showToast(`Copied ${email}`);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const exportToJson = () => {
    const targetList = selectedIds.length > 0 ? employees.filter((e) => selectedIds.includes(e.id)) : processedEmployees;
    downloadFile(
      JSON.stringify(targetList, null, 2),
      `acme-employees-${new Date().toISOString().slice(0, 10)}.json`,
      'application/json',
    );
    showToast(`Exported ${targetList.length} records as JSON`, { type: 'success' });
  };

  const exportToCsv = () => {
    const targetList = selectedIds.length > 0 ? employees.filter((e) => selectedIds.includes(e.id)) : processedEmployees;
    downloadFile(employeesToCsv(targetList), `acme-employees-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
    showToast(`Exported ${targetList.length} records as CSV`, { type: 'success' });
  };

  const counts = useMemo(() => {
    const totalPayroll = employees.reduce((sum, e) => sum + parseSalaryNumber(e.salary), 0);
    return {
      total: employees.length,
      active: employees.filter((e) => e.status === 'Active').length,
      onboarding: employees.filter((e) => e.status === 'Onboarding').length,
      onLeave: employees.filter((e) => e.status === 'On Leave').length,
      totalPayroll,
    };
  }, [employees]);

  const rowPad = density === 'compact' ? 'py-2' : 'py-3';

  const renderEmployeeRow = (emp, idx) => (
    <EmployeeTableRow
      key={emp.id}
      emp={emp}
      managerObj={emp.managerId ? employeeMap.get(emp.managerId) : null}
      rowPad={rowPad}
      visibleCols={visibleCols}
      isSelected={selectedIds.includes(emp.id)}
      isInline={inlineEditId === emp.id}
      isFocused={focusedRowIndex === idx}
      isActiveDrawer={activeEmployeeId === emp.id}
      inlineDraft={inlineDraft}
      setInlineDraft={setInlineDraft}
      onSelectRow={toggleSelectRow}
      onOpenDrawer={(id) => setRoute(`/employees/${id}`)}
      onStartInlineEdit={startInlineEdit}
      onCommitInlineEdit={commitInlineEdit}
      onCancelInlineEdit={() => {
        setInlineEditId(null);
        setInlineError(null);
      }}
      onDeleteEmployee={deleteEmployees}
      copiedId={copiedId}
      onCopyEmail={handleCopyEmail}
    />
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#09090B] flex flex-col selection:bg-[#09090B] selection:text-white">
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0.4; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideUpDock {
          from { transform: translate(-50%, 24px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.97); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <header className="sticky top-0 z-20 h-14 bg-white/90 backdrop-blur-md border-b border-[#E4E4E7] px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-5">
          <div onClick={() => setRoute('/employees')} className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-6 h-6 rounded-md bg-[#09090B] text-white flex items-center justify-center font-mono text-xs font-bold">
              A
            </div>
            <span className="font-semibold text-sm tracking-tight text-[#09090B]">Acme Directory</span>
            <span className="text-zinc-300 hidden sm:inline">/</span>
            <span className="hidden sm:inline-block font-mono tabular-nums text-xs text-[#71717A] bg-zinc-100 px-2 py-0.5 rounded border border-[#E4E4E7]">
              {route}
            </span>
          </div>
          <nav className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setRoute('/employees')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                route === '/employees' ? 'bg-zinc-100 text-[#09090B]' : 'text-[#71717A] hover:text-[#09090B]'
              }`}
            >
              Directory
            </button>
            <button
              type="button"
              onClick={() => setRoute('/readme')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                route === '/readme' ? 'bg-zinc-100 text-[#09090B]' : 'text-[#71717A] hover:text-[#09090B]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Rubric & README</span>
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:inline-flex items-center rounded-md border border-[#E4E4E7] bg-white overflow-hidden">
            <button
              type="button"
              onClick={undo}
              disabled={past.length === 0}
              className="px-2 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 disabled:opacity-35 flex items-center gap-1 border-r border-[#E4E4E7] transition-colors"
              title="Undo last mutation (⌘Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="font-mono tabular-nums text-[10px]">{past.length}</span>
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={future.length === 0}
              className="px-2 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 disabled:opacity-35 flex items-center gap-1 border-r border-[#E4E4E7] transition-colors"
              title="Redo mutation (⌘⇧Z)"
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span className="font-mono tabular-nums text-[10px]">{future.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAuditOpen(true)}
              className="px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-1.5 transition-colors"
              title="Open State History & Field Diff Audit Log"
            >
              <History className="w-3.5 h-3.5 text-zinc-500" />
              <span>Audit</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCmdOpen(true)}
            className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#71717A] bg-[#FAFAFA] hover:bg-zinc-100 border border-[#E4E4E7] rounded-md active:scale-[0.98] transition-all"
            title="Open Command Palette (⌘K)"
          >
            <Command className="w-3.5 h-3.5 text-zinc-400" />
            <span>Command</span>
            <kbd className="text-[10px] font-mono px-1 bg-white border border-[#E4E4E7] rounded text-zinc-500">⌘K</kbd>
          </button>

          <button
            type="button"
            onClick={() => setRoute('/employees/new')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#09090B] text-white rounded-md hover:bg-zinc-800 active:scale-[0.98] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Employee</span>
            <kbd className="hidden sm:inline-block ml-1 text-[10px] font-mono px-1 bg-zinc-800 text-zinc-300 rounded">N</kbd>
          </button>
        </div>
      </header>

      {route === '/readme' ? (
        <ReadmeView
          onBack={() => setRoute('/employees')}
          onOpenAudit={() => setIsAuditOpen(true)}
          onOpenBatch={() => setIsBatchModalOpen(true)}
          onSwitchOrgView={() => setViewMode('org')}
        />
      ) : (
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#E4E4E7]">
            <div className="flex items-center gap-4 sm:gap-5 text-xs flex-wrap">
              <button
                type="button"
                onClick={() => setStatusFilter('All')}
                className={`flex items-center gap-2 transition-colors ${
                  statusFilter === 'All' ? 'text-[#09090B] font-semibold' : 'text-[#71717A] hover:text-[#09090B]'
                }`}
              >
                <span>All People</span>
                <span className="font-mono tabular-nums text-[11px] px-1.5 py-0.5 bg-zinc-200/70 text-[#09090B] rounded">
                  {counts.total}
                </span>
              </button>
              <span className="text-zinc-300">·</span>
              {[
                { key: 'Active', dot: 'bg-emerald-500', activeClass: 'text-emerald-700 font-semibold' },
                { key: 'Onboarding', dot: 'bg-amber-500', activeClass: 'text-amber-700 font-semibold' },
                { key: 'On Leave', dot: 'bg-zinc-400', activeClass: 'text-[#09090B] font-semibold' },
              ].map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === s.key ? 'All' : s.key)}
                  className={`flex items-center gap-1.5 transition-colors ${
                    statusFilter === s.key ? s.activeClass : 'text-[#71717A] hover:text-[#09090B]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  <span>{s.key}</span>
                  <span className="font-mono tabular-nums text-[11px] text-zinc-400">
                    {s.key === 'Active' ? counts.active : s.key === 'Onboarding' ? counts.onboarding : counts.onLeave}
                  </span>
                </button>
              ))}
              <span className="text-zinc-300 hidden sm:inline">·</span>
              <div className="hidden sm:flex items-center gap-1.5 text-[#71717A]">
                <span>Annual Payroll:</span>
                <span className="font-mono tabular-nums text-[11px] font-semibold text-[#09090B] bg-zinc-100 px-1.5 py-0.5 rounded border border-[#E4E4E7]">
                  {formatINR(counts.totalPayroll, true)}
                </span>
              </div>
            </div>
            <div className="hidden xl:flex items-center gap-3 text-[11px] text-[#71717A] font-mono">
              <span>Double-click row to inline edit</span>
              <span>·</span>
              <span>
                Undo: <kbd className="px-1 py-0.5 bg-white border border-[#E4E4E7] rounded text-zinc-700">⌘Z</kbd>
              </span>
              <span>·</span>
              <span>
                Navigate: <kbd className="px-1 py-0.5 bg-white border border-[#E4E4E7] rounded text-zinc-700">J</kbd>{' '}
                <kbd className="px-1 py-0.5 bg-white border border-[#E4E4E7] rounded text-zinc-700">K</kbd>
              </span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, role, manager, ID..."
                  className="w-full pl-8 pr-10 py-1.5 text-xs bg-white border border-[#E4E4E7] rounded-md text-[#09090B] placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-800"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 bg-[#FAFAFA] text-zinc-400 border border-[#E4E4E7] rounded pointer-events-none">
                    /
                  </kbd>
                )}
              </div>

              <div className="inline-flex items-center p-0.5 rounded-md bg-zinc-200/60 border border-[#E4E4E7]">
                {['All', ...DEPARTMENTS].map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setDeptFilter(dept)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-[5px] transition-all ${
                      deptFilter === dept ? 'bg-white text-[#09090B] shadow-sm' : 'text-[#71717A] hover:text-[#09090B]'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>

              {viewMode === 'table' && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E4E4E7] rounded-md text-xs">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[#71717A]">Group:</span>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                    className="font-medium text-[#09090B] bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="none">None</option>
                    <option value="department">Department</option>
                    <option value="status">Status</option>
                    <option value="location">Location</option>
                  </select>
                </div>
              )}

              {(search || deptFilter !== 'All' || statusFilter !== 'All' || groupBy !== 'none') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setDeptFilter('All');
                    setStatusFilter('All');
                    setGroupBy('none');
                  }}
                  className="text-xs text-[#71717A] hover:text-[#09090B] underline underline-offset-2 px-1"
                >
                  Reset ({processedEmployees.length})
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto">
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-[#E4E4E7] rounded-md hover:bg-zinc-50 active:scale-[0.98] transition-all"
                title="Batch Import CSV / JSON"
              >
                <Upload className="w-3.5 h-3.5 text-zinc-500" />
                <span>Batch Import</span>
              </button>
              <button
                type="button"
                onClick={exportToCsv}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-[#E4E4E7] rounded-md hover:bg-zinc-50 active:scale-[0.98] transition-all"
                title="Export directory as CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-500" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                type="button"
                onClick={exportToJson}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-[#E4E4E7] rounded-md hover:bg-zinc-50 active:scale-[0.98] transition-all"
                title="Export directory as JSON"
              >
                <Download className="w-3.5 h-3.5 text-zinc-500" />
                <span className="hidden sm:inline">JSON</span>
              </button>

              {viewMode === 'table' && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsColsPopoverOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-[#E4E4E7] rounded-md hover:bg-zinc-50 transition-all"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="hidden sm:inline">Columns</span>
                  </button>
                  {isColsPopoverOpen && (
                    <div className="absolute right-0 mt-1.5 w-48 bg-white border border-[#E4E4E7] rounded-lg shadow-xl p-2 z-30 space-y-1">
                      <div className="px-2 py-1 text-[10px] font-mono uppercase text-[#71717A]">Toggle Columns</div>
                      {[
                        { key: 'role', label: 'Role Title' },
                        { key: 'department', label: 'Department' },
                        { key: 'email', label: 'Work Email' },
                        { key: 'phone', label: 'Phone Number' },
                        { key: 'manager', label: 'Reporting Manager' },
                        { key: 'salary', label: 'Compensation (CTC)' },
                        { key: 'status', label: 'Status Pill' },
                      ].map((col) => (
                        <label
                          key={col.key}
                          className="flex items-center justify-between px-2 py-1.5 text-xs text-zinc-800 hover:bg-zinc-50 rounded cursor-pointer"
                        >
                          <span>{col.label}</span>
                          <input
                            type="checkbox"
                            checked={visibleCols[col.key]}
                            onChange={() => setVisibleCols((prev) => ({ ...prev, [col.key]: !prev[col.key] }))}
                            className="rounded border-zinc-300 text-[#09090B] focus:ring-0"
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="inline-flex p-0.5 bg-zinc-200/60 rounded-md border border-[#E4E4E7]">
                {[
                  { key: 'table', icon: LayoutList, label: 'Table' },
                  { key: 'org', icon: GitBranch, label: 'Org Tree' },
                  { key: 'grid', icon: LayoutGrid, label: 'Grid' },
                ].map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => setViewMode(v.key)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                      viewMode === v.key ? 'bg-white text-[#09090B] shadow-sm' : 'text-[#71717A] hover:text-[#09090B]'
                    }`}
                    title={`${v.label} View`}
                  >
                    <v.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{v.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {inlineError && (
            <div className="px-3.5 py-2 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Inline Edit Validation: {inlineError}</span>
              </span>
              <button type="button" onClick={() => setInlineError(null)} className="text-red-500 hover:text-red-800">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {viewMode === 'table' && (
            <div className="bg-white border border-[#E4E4E7] rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed min-w-[980px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#E4E4E7] bg-[#FAFAFA] text-[11px] font-mono uppercase tracking-wider text-[#71717A] select-none">
                      <th className="w-10 px-3.5 py-2.5">
                        <input
                          type="checkbox"
                          checked={paginatedEmployees.length > 0 && paginatedEmployees.every((e) => selectedIds.includes(e.id))}
                          onChange={toggleSelectAllPage}
                          aria-label="Select all employees on page"
                          className="rounded border-zinc-300 text-[#09090B] focus:ring-0 cursor-pointer"
                        />
                      </th>
                      <SortableHeader label="Employee" sortKey="name" widthClass="w-[19%]" sortConfig={sortConfig} onSort={handleSort} />
                      {visibleCols.role && (
                        <SortableHeader label="Role" sortKey="role" widthClass="w-[16%]" sortConfig={sortConfig} onSort={handleSort} />
                      )}
                      {visibleCols.department && (
                        <SortableHeader
                          label="Dept"
                          sortKey="department"
                          widthClass="w-[10%]"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        />
                      )}
                      {visibleCols.email && <th className="w-[17%] px-3 py-2.5">Email</th>}
                      {visibleCols.phone && <th className="w-[12%] px-3 py-2.5">Phone</th>}
                      {visibleCols.manager && <th className="w-[12%] px-3 py-2.5">Reports To</th>}
                      {visibleCols.salary && (
                        <SortableHeader label="CTC" sortKey="salary" widthClass="w-[8%]" sortConfig={sortConfig} onSort={handleSort} />
                      )}
                      {visibleCols.status && (
                        <SortableHeader
                          label="Status"
                          sortKey="status"
                          widthClass="w-[9%]"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        />
                      )}
                      <th className="w-20 px-3.5 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E4E7]/70 text-xs">
                    {processedEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-16 text-center">
                          <div className="max-w-xs mx-auto space-y-2">
                            <p className="text-sm font-medium text-[#09090B]">No matching employee records</p>
                            <p className="text-xs text-[#71717A]">
                              No employees matched your active search or department filters.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setSearch('');
                                setDeptFilter('All');
                                setStatusFilter('All');
                              }}
                              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#09090B] text-white rounded-md hover:bg-zinc-800"
                            >
                              Reset Filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : groupedSwimlanes ? (
                      groupedSwimlanes.map((group) => {
                        const isCollapsed = collapsedGroups[group.groupKey];
                        return (
                          <React.Fragment key={group.groupKey}>
                            <tr
                              onClick={() => setCollapsedGroups((prev) => ({ ...prev, [group.groupKey]: !prev[group.groupKey] }))}
                              className="bg-zinc-100/80 hover:bg-zinc-200/50 cursor-pointer select-none border-y border-[#E4E4E7]"
                            >
                              <td colSpan={10} className="px-3.5 py-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {isCollapsed ? (
                                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                                    )}
                                    <span className="font-semibold text-xs text-[#09090B]">{group.groupKey}</span>
                                    <span className="font-mono tabular-nums text-[11px] px-1.5 py-0.5 rounded bg-white border border-[#E4E4E7] text-zinc-700">
                                      {group.items.length} {group.items.length === 1 ? 'person' : 'people'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 font-mono tabular-nums text-[11px] text-[#71717A]">
                                    <span>
                                      Active: <strong className="text-[#09090B]">{group.activeCount}/{group.items.length}</strong>
                                    </span>
                                    <span>
                                      Group Payroll: <strong className="text-[#09090B]">{formatINR(group.totalPayroll, true)}</strong>
                                    </span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                            {!isCollapsed && group.items.map((emp, idx) => renderEmployeeRow(emp, idx))}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      paginatedEmployees.map((emp, idx) => renderEmployeeRow(emp, idx))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-2.5 border-t border-[#E4E4E7] bg-[#FAFAFA] flex flex-wrap items-center justify-between gap-3 text-xs text-[#71717A]">
                <div className="flex items-center gap-3 font-mono tabular-nums text-[11px]">
                  <span>
                    Showing <strong className="text-[#09090B]">{processedEmployees.length === 0 ? 0 : groupBy !== 'none' ? processedEmployees.length : (currentPage - 1) * pageSize + 1}</strong>
                    {groupBy === 'none' && (
                      <>
                        –<strong className="text-[#09090B]">{Math.min(currentPage * pageSize, processedEmployees.length)}</strong>
                      </>
                    )}{' '}
                    of <strong className="text-[#09090B]">{processedEmployees.length}</strong>
                  </span>
                  {groupBy === 'none' && (
                    <div className="flex items-center gap-1.5">
                      <span>· Rows:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="px-1.5 py-0.5 bg-white border border-[#E4E4E7] rounded text-[#09090B] focus:outline-none"
                      >
                        {[6, 8, 10, 20].map((sz) => (
                          <option key={sz} value={sz}>
                            {sz}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setDensity((d) => (d === 'compact' ? 'comfortable' : 'compact'))}
                    className="hidden sm:inline-block px-2 py-0.5 bg-white border border-[#E4E4E7] rounded text-zinc-700 hover:bg-zinc-50"
                  >
                    Density: {density}
                  </button>
                </div>
                {groupBy === 'none' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="p-1 rounded border border-[#E4E4E7] bg-white text-zinc-700 disabled:opacity-40 hover:bg-zinc-50 transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono tabular-nums text-[11px] px-2">
                      Page {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1 rounded border border-[#E4E4E7] bg-white text-zinc-700 disabled:opacity-40 hover:bg-zinc-50 transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {viewMode === 'org' && (
            <OrgChartTreeView employees={processedEmployees} onSelectEmployee={(emp) => setRoute(`/employees/${emp.id}`)} />
          )}

          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {processedEmployees.map((emp) => {
                const mgr = emp.managerId ? employeeMap.get(emp.managerId) : null;
                return (
                  <div
                    key={emp.id}
                    onClick={() => setRoute(`/employees/${emp.id}`)}
                    className="group bg-white border border-[#E4E4E7] hover:border-zinc-900 rounded-lg p-4 transition-all cursor-pointer flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[#09090B] text-white text-xs font-medium flex items-center justify-center shrink-0">
                          {getInitials(emp.name)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-[#09090B] truncate">{emp.name}</h3>
                          <p className="text-xs text-[#71717A] truncate">{emp.role}</p>
                        </div>
                      </div>
                      <StatusPill status={emp.status} />
                    </div>
                    <div className="space-y-1.5 pt-3 border-t border-zinc-100 text-xs text-zinc-600">
                      <div className="flex items-center justify-between font-mono tabular-nums text-[11px]">
                        <span className="text-zinc-400">ID / CTC</span>
                        <span className="text-[#09090B] font-medium">
                          {emp.id} · {formatINR(emp.salary, true)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-mono tabular-nums text-[11px]">
                        <span className="text-zinc-400">EMAIL</span>
                        <span className="truncate max-w-[200px]">{emp.email}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-zinc-400">MANAGER</span>
                        <span className="text-zinc-700 truncate">{mgr ? mgr.name : 'Root Executive'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-zinc-400">DEPT</span>
                        <span className="font-medium text-zinc-800">
                          {emp.department} · {emp.location}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {selectedIds.length > 0 && (
        <div
          style={{ animation: 'slideUpDock 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          className="fixed bottom-5 left-1/2 z-30 bg-[#09090B] text-white px-4 py-2.5 rounded-full shadow-2xl border border-zinc-800 flex items-center gap-3 text-xs"
        >
          <span className="font-mono tabular-nums text-[11px] px-2 py-0.5 bg-zinc-800 rounded-full text-zinc-200">
            {selectedIds.length} selected
          </span>
          <div className="h-3.5 w-[1px] bg-zinc-700" />
          <button
            type="button"
            onClick={() => {
              bulkUpdateStatus(selectedIds, 'Active');
              setSelectedIds([]);
            }}
            className="hover:text-emerald-400 transition-colors font-medium"
          >
            Set Active
          </button>
          <button
            type="button"
            onClick={() => {
              bulkUpdateStatus(selectedIds, 'Onboarding');
              setSelectedIds([]);
            }}
            className="hover:text-amber-300 transition-colors font-medium"
          >
            Set Onboarding
          </button>
          <button
            type="button"
            onClick={() => {
              bulkUpdateStatus(selectedIds, 'On Leave');
              setSelectedIds([]);
            }}
            className="hover:text-zinc-300 transition-colors font-medium"
          >
            Set On Leave
          </button>
          <div className="h-3.5 w-[1px] bg-zinc-700" />
          <button
            type="button"
            onClick={() => {
              deleteEmployees(selectedIds);
              setSelectedIds([]);
            }}
            className="text-red-400 hover:text-red-300 transition-colors font-medium inline-flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
          <button type="button" onClick={() => setSelectedIds([])} className="p-1 text-zinc-400 hover:text-white" title="Clear selection (Esc)">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {toast && (
        <div
          style={{ animation: 'scaleIn 0.16s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          className="fixed bottom-5 right-5 z-50 bg-[#09090B] text-white px-4 py-3 rounded-lg shadow-2xl border border-zinc-800 flex items-center gap-3 text-xs max-w-sm"
        >
          <span className="text-zinc-100 font-medium">{toast.message}</span>
          {past.length > 0 && (
            <button
              type="button"
              onClick={() => {
                undo();
                dismissToast();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-[#09090B] font-semibold rounded hover:bg-zinc-200 active:scale-[0.98] transition-all shrink-0"
            >
              <Undo2 className="w-3 h-3" />
              Undo
            </button>
          )}
          <button type="button" onClick={dismissToast} className="text-zinc-400 hover:text-white p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <EmployeeDrawer
        isOpen={isNewDrawerOpen || Boolean(activeEmployee)}
        mode={isNewDrawerOpen ? 'create' : 'inspect'}
        employee={activeEmployee}
        onClose={() => setRoute('/employees')}
      />
      <AuditHistoryDrawer isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
      <BatchImportModal isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} />
      <CommandPalette
        isOpen={isCmdOpen}
        onClose={() => setIsCmdOpen(false)}
        onCreateNew={() => setRoute('/employees/new')}
        onSelectEmployee={(emp) => setRoute(`/employees/${emp.id}`)}
        onExportJson={exportToJson}
        onExportCsv={exportToCsv}
        onOpenBatchImport={() => setIsBatchModalOpen(true)}
        onOpenAuditDrawer={() => setIsAuditOpen(true)}
        onSwitchView={(mode) => setViewMode(mode)}
      />
    </div>
  );
}
