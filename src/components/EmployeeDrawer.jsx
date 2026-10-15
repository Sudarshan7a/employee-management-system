import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CheckSquare,
  Edit3,
  Plus,
  Sparkles,
  Square,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { useEmployees } from '../context/EmployeeContext.jsx';
import {
  DEPARTMENTS,
  DEFAULT_ONBOARDING_TASKS,
  LOCATIONS,
  SMART_PASTE_PRESETS,
  STATUSES,
} from '../data/seedEmployees.js';
import { formatINR, getInitials } from '../utils/format.js';
import { buildOrgHierarchy, detectReportingCycle, getUpwardChain } from '../utils/orgTree.js';
import { parseUnstructuredCandidateText, validateEmployeeForm } from '../utils/validation.js';
import { FormField, StatusPill } from './ui.jsx';

/**
 * Slide-over inspector: /employees/new (create) and /employees/:id (3 tabs).
 * Tab 1: profile fields · Tab 2: reporting & org · Tab 3: tasks & audit.
 */
export function EmployeeDrawer({ isOpen, mode, employee, onClose }) {
  const {
    employees,
    auditLog,
    addEmployee,
    updateEmployee,
    updateOnboardingTasks,
    deleteEmployees,
    setRoute,
    createPrefill,
    setCreatePrefill,
    openCreateWithManager,
  } = useEmployees();

  const isCreate = mode === 'create';
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(isCreate);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [smartPasteText, setSmartPasteText] = useState('');
  const [smartPasteNotice, setSmartPasteNotice] = useState('');
  const [flashedFields, setFlashedFields] = useState({});
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    department: 'Engineering',
    email: '',
    phone: '+91 ',
    location: 'Bengaluru',
    status: 'Active',
    joinedAt: new Date().toISOString().split('T')[0],
    salary: 2400000,
    managerId: 'EMP-101',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const firstInputRef = useRef(null);

  useEffect(() => {
    setConfirmDelete(false);
    setSmartPasteText('');
    setSmartPasteNotice('');
    setFlashedFields({});
    setNewTaskTitle('');
    setActiveTab('profile');

    if (isCreate) {
      setIsEditing(true);
      setFormData({
        name: '',
        role: '',
        department: createPrefill?.department || 'Engineering',
        email: '',
        phone: '+91 ',
        location: createPrefill?.location || 'Bengaluru',
        status: 'Onboarding',
        joinedAt: new Date().toISOString().split('T')[0],
        salary: 2400000,
        managerId: createPrefill?.managerId !== undefined ? createPrefill.managerId : 'EMP-101',
      });
      setErrors({});
      setTouched({});
      setTimeout(() => firstInputRef.current?.focus(), 80);
    } else if (employee) {
      setIsEditing(false);
      setFormData({ ...employee, managerId: employee.managerId || '' });
      setErrors({});
      setTouched({});
    }
  }, [isCreate, employee, isOpen, createPrefill]);

  const orgData = useMemo(() => {
    if (!employee) return { upwardChain: [], directReports: [], totalTeamSize: 0, subtreePayroll: 0 };
    const upwardChain = getUpwardChain(employees, employee);
    const { nodeMap } = buildOrgHierarchy(employees);
    const node = nodeMap.get(employee.id);
    return {
      upwardChain,
      directReports: node?.children || [],
      totalTeamSize: node?.totalTeamSize || 0,
      subtreePayroll: node?.subtreePayroll || 0,
    };
  }, [employees, employee]);

  const employeeAuditHistory = useMemo(() => {
    if (!employee) return [];
    return auditLog.filter((entry) => entry.targetId === employee.id);
  }, [auditLog, employee]);

  if (!isOpen) return null;

  const handleFieldChange = (field, value) => {
    const next = { ...formData, [field]: value };
    setFormData(next);
    if (touched[field] || field === 'managerId') {
      setErrors(validateEmployeeForm(next, employees, isCreate ? null : employee?.id));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateEmployeeForm(formData, employees, isCreate ? null : employee?.id));
  };

  const handleSmartPaste = (rawText) => {
    setSmartPasteText(rawText);
    const extracted = parseUnstructuredCandidateText(rawText);
    const matchedKeys = Object.keys(extracted);
    if (matchedKeys.length > 0) {
      setFormData((prev) => ({ ...prev, ...extracted }));
      setSmartPasteNotice(`Auto-populated: ${matchedKeys.join(', ')}`);
      setErrors({});
      const flashMap = {};
      matchedKeys.forEach((k) => {
        flashMap[k] = true;
      });
      setFlashedFields(flashMap);
      setTimeout(() => setFlashedFields({}), 1100);
    } else {
      setSmartPasteNotice('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const normalizedData = { ...formData, managerId: formData.managerId || null };
    const validationErrors = validateEmployeeForm(normalizedData, employees, isCreate ? null : employee?.id);
    setErrors(validationErrors);
    setTouched({ name: true, role: true, email: true, phone: true, managerId: true });
    if (Object.keys(validationErrors).length > 0) return;

    if (isCreate) {
      setCreatePrefill(null);
      const created = addEmployee(normalizedData);
      setRoute(`/employees/${created.id}`);
    } else if (employee) {
      updateEmployee(employee.id, normalizedData, 'UPDATE');
      setIsEditing(false);
    }
  };

  const handleToggleTask = (taskId) => {
    if (!employee) return;
    const currentTasks = employee.onboardingTasks || DEFAULT_ONBOARDING_TASKS;
    let toggledTaskTitle = '';
    const nextTasks = currentTasks.map((t) => {
      if (t.id === taskId) {
        toggledTaskTitle = `${!t.done ? 'Completed' : 'Reopened'} "${t.title}"`;
        return { ...t, done: !t.done };
      }
      return t;
    });
    updateOnboardingTasks(employee.id, nextTasks, toggledTaskTitle);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!employee || !newTaskTitle.trim()) return;
    const currentTasks = employee.onboardingTasks || DEFAULT_ONBOARDING_TASKS;
    const nextTasks = [...currentTasks, { id: `t-${Date.now()}`, title: newTaskTitle.trim(), done: false }];
    updateOnboardingTasks(employee.id, nextTasks, `Added onboarding task "${newTaskTitle.trim()}"`);
    setNewTaskTitle('');
  };

  const getFieldClass = (fieldName, isMono = false) => {
    const isFlashed = flashedFields[fieldName];
    const hasError = errors[fieldName];
    return `w-full px-3 py-2 text-xs sm:text-sm rounded-md border transition-all duration-300 ${
      isMono ? 'font-mono tabular-nums' : ''
    } ${
      !isEditing
        ? 'bg-zinc-50/70 border-zinc-200/70 text-zinc-800 cursor-default'
        : isFlashed
          ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-zinc-900'
          : hasError
            ? 'bg-white border-red-400 focus:outline-none focus:border-red-600'
            : 'bg-white border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900'
    }`;
  };

  const tasks = employee?.onboardingTasks || DEFAULT_ONBOARDING_TASKS;
  const completedTasksCount = tasks.filter((t) => t.done).length;
  const onboardingPct = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 100;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        onClick={() => {
          setCreatePrefill(null);
          onClose();
        }}
        className="fixed inset-0 bg-zinc-950/20 backdrop-blur-[1px] transition-opacity duration-200"
      />

      <aside
        style={{ animation: 'slideInRight 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        className="relative z-50 w-full max-w-[500px] bg-white h-full border-l border-[#E4E4E7] shadow-2xl flex flex-col justify-between overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-[#E4E4E7] flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <span className="font-mono tabular-nums text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-200/80 text-zinc-800 font-medium">
              {isCreate ? 'NEW RECORD' : employee?.id}
            </span>
            <span className="text-xs text-[#71717A] font-mono">{isCreate ? '/employees/new' : `/employees/${employee?.id}`}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {!isCreate && activeTab === 'profile' && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#09090B] bg-white border border-[#E4E4E7] rounded-md hover:bg-zinc-50 active:scale-[0.98] transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setCreatePrefill(null);
                onClose();
              }}
              className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-md hover:bg-zinc-100 active:scale-[0.98] transition-all"
              title="Close panel (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isCreate && employee && (
          <div className="px-6 pt-4 bg-white border-b border-[#E4E4E7]">
            <div className="flex items-start gap-3.5 pb-4">
              <div className="w-11 h-11 rounded-full bg-[#09090B] text-white font-semibold text-sm flex items-center justify-center shrink-0">
                {getInitials(employee.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-semibold text-[#09090B] tracking-tight truncate">{employee.name}</h2>
                  <StatusPill status={employee.status} />
                </div>
                <p className="text-xs text-[#71717A] mt-0.5">
                  {employee.role} · {employee.department} ·{' '}
                  <span className="font-mono tabular-nums text-zinc-700">{formatINR(employee.salary, true)}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5 text-xs font-medium -mb-px">
              {[
                { key: 'profile', label: 'Profile & Fields' },
                { key: 'org', label: `Reporting & Org`, badge: orgData.directReports.length },
                { key: 'onboarding', label: 'Tasks & Audit', badge: `${onboardingPct}%` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === tab.key
                      ? 'border-[#09090B] text-[#09090B]'
                      : 'border-transparent text-[#71717A] hover:text-[#09090B]'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="font-mono tabular-nums text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {(isCreate || activeTab === 'profile') && (
            <>
              {isCreate && (
                <div className="p-3.5 rounded-lg bg-[#FAFAFA] border border-[#E4E4E7] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#09090B]" />
                      Smart Paste Parser
                    </span>
                    <span className="text-[10px] font-mono text-[#71717A]">Extracts 7 fields + CTC</span>
                  </div>
                  <textarea
                    rows={2}
                    value={smartPasteText}
                    onChange={(e) => handleSmartPaste(e.target.value)}
                    placeholder='Paste Slack/LinkedIn snippet (e.g. "Nikhil Kamath, Senior Frontend Engineer, nikhil.k@acme.dev, +91 98451 67210, Engineering, Bengaluru, 34L")...'
                    className="w-full text-xs bg-white border border-[#E4E4E7] rounded-md px-2.5 py-2 text-[#09090B] placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors resize-none"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    {SMART_PASTE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleSmartPaste(preset.raw)}
                        className="text-[11px] font-medium px-2 py-1 rounded bg-white border border-[#E4E4E7] text-zinc-700 hover:border-zinc-900 hover:text-zinc-950 active:scale-[0.98] transition-all"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  {smartPasteNotice && (
                    <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{smartPasteNotice}</span>
                    </p>
                  )}
                </div>
              )}

              <form id="employee-drawer-form" onSubmit={handleSubmit} noValidate className="space-y-4">
                <FormField label="Full Name" required error={errors.name}>
                  <input
                    ref={firstInputRef}
                    type="text"
                    disabled={!isEditing}
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    onBlur={() => handleBlur('name')}
                    placeholder="e.g. Siddharth Joshi"
                    className={getFieldClass('name')}
                  />
                </FormField>
                <FormField label="Role Title" required error={errors.role}>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.role}
                    onChange={(e) => handleFieldChange('role', e.target.value)}
                    onBlur={() => handleBlur('role')}
                    placeholder="e.g. Senior Frontend Engineer"
                    className={getFieldClass('role')}
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Department">
                    <select
                      disabled={!isEditing}
                      value={formData.department}
                      onChange={(e) => handleFieldChange('department', e.target.value)}
                      className={getFieldClass('department')}
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Status">
                    <select
                      disabled={!isEditing}
                      value={formData.status}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                      className={getFieldClass('status')}
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
                <FormField label="Work Email" required error={errors.email}>
                  <input
                    type="email"
                    disabled={!isEditing}
                    value={formData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    placeholder="name@acme.dev"
                    className={getFieldClass('email', true)}
                  />
                </FormField>
                <FormField label="Phone Number" required error={errors.phone}>
                  <input
                    type="tel"
                    disabled={!isEditing}
                    value={formData.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    onBlur={() => handleBlur('phone')}
                    placeholder="+91 98450 00000"
                    className={getFieldClass('phone', true)}
                  />
                </FormField>
                <FormField label="Reporting Manager" hint="DFS cycle-checked" error={errors.managerId}>
                  <select
                    disabled={!isEditing}
                    value={formData.managerId || ''}
                    onChange={(e) => handleFieldChange('managerId', e.target.value || null)}
                    className={getFieldClass('managerId')}
                  >
                    <option value="">None (Root Executive / Lead)</option>
                    {employees
                      .filter((m) => isCreate || m.id !== employee?.id)
                      .map((mgr) => {
                        const cycleCheck = !isCreate
                          ? detectReportingCycle(employees, employee?.id, mgr.id)
                          : { hasCycle: false };
                        return (
                          <option key={mgr.id} value={mgr.id} disabled={cycleCheck.hasCycle}>
                            {mgr.name} ({mgr.id} · {mgr.role})
                            {cycleCheck.hasCycle ? ' [Blocked: Subordinate]' : ''}
                          </option>
                        );
                      })}
                  </select>
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Office Location">
                    <select
                      disabled={!isEditing}
                      value={formData.location}
                      onChange={(e) => handleFieldChange('location', e.target.value)}
                      className={getFieldClass('location')}
                    >
                      {LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Joined Date">
                    <input
                      type="date"
                      disabled={!isEditing}
                      value={formData.joinedAt}
                      onChange={(e) => handleFieldChange('joinedAt', e.target.value)}
                      className={getFieldClass('joinedAt', true)}
                    />
                  </FormField>
                </div>
                <FormField
                  label="Annual Compensation (CTC in INR)"
                  hint={`${formatINR(formData.salary)} (${formatINR(formData.salary, true)})`}
                >
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.salary}
                    onChange={(e) => handleFieldChange('salary', e.target.value)}
                    placeholder="e.g. 3200000 or 32L"
                    className={getFieldClass('salary', true)}
                  />
                </FormField>
              </form>

              {!isCreate && employee && (
                <div className="pt-5 border-t border-[#E4E4E7]">
                  {!confirmDelete ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete employee record...
                    </button>
                  ) : (
                    <div className="p-3 rounded-lg bg-red-50/80 border border-red-200 flex items-center justify-between gap-2">
                      <span className="text-xs text-red-800 font-medium">Remove {employee.name}? (Undoable via ⌘Z)</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="px-2.5 py-1 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded hover:bg-zinc-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteEmployees(employee.id);
                            onClose();
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 active:scale-[0.98] transition-all"
                        >
                          Confirm Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {!isCreate && employee && activeTab === 'org' && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: 'Direct Reports', value: orgData.directReports.length },
                  { label: 'Total Org Size', value: orgData.totalTeamSize },
                  { label: 'Subtree Payroll', value: formatINR(orgData.subtreePayroll, true) },
                ].map((stat) => (
                  <div key={stat.label} className="p-3 rounded-lg border border-[#E4E4E7] bg-[#FAFAFA]">
                    <div className="text-[10px] font-mono uppercase text-[#71717A]">{stat.label}</div>
                    <div className="text-base font-semibold font-mono tabular-nums text-[#09090B] mt-0.5">{stat.value}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">Upward Reporting Chain</div>
                {orgData.upwardChain.length === 0 ? (
                  <div className="p-3 rounded-lg border border-[#E4E4E7] bg-white text-xs text-[#71717A]">
                    {employee.name} is a top-level Root Executive (no reporting manager).
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {[...orgData.upwardChain].reverse().map((mgr, idx) => (
                      <div
                        key={mgr.id}
                        onClick={() => setRoute(`/employees/${mgr.id}`)}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-[#E4E4E7] bg-white hover:border-zinc-400 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono text-[10px] text-zinc-400 w-4">L{idx + 1}</span>
                          <div className="w-6 h-6 rounded-full bg-[#09090B] text-white text-[10px] font-medium flex items-center justify-center shrink-0">
                            {getInitials(mgr.name)}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-medium text-[#09090B] truncate">{mgr.name}</div>
                            <div className="text-[11px] text-[#71717A] truncate">{mgr.role}</div>
                          </div>
                        </div>
                        <span className="font-mono text-[11px] text-zinc-400">{mgr.id} →</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
                    Direct Reports ({orgData.directReports.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => openCreateWithManager(employee)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#09090B] hover:underline"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add Direct Report
                  </button>
                </div>
                {orgData.directReports.length === 0 ? (
                  <div className="p-4 rounded-lg border border-dashed border-[#E4E4E7] text-center space-y-2">
                    <p className="text-xs text-[#71717A]">No direct reports assigned to {employee.name}.</p>
                    <button
                      type="button"
                      onClick={() => openCreateWithManager(employee)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[#09090B] text-white rounded-md hover:bg-zinc-800"
                    >
                      <Plus className="w-3 h-3" />
                      Add First Direct Report
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E4E4E7] border border-[#E4E4E7] rounded-lg bg-white overflow-hidden">
                    {orgData.directReports.map((rep) => (
                      <div
                        key={rep.id}
                        onClick={() => setRoute(`/employees/${rep.id}`)}
                        className="p-2.5 flex items-center justify-between hover:bg-[#FAFAFA] cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-zinc-800 text-white text-[10px] font-medium flex items-center justify-center shrink-0">
                            {getInitials(rep.name)}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-medium text-[#09090B] truncate">{rep.name}</div>
                            <div className="text-[11px] text-[#71717A] truncate">{rep.role}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusPill status={rep.status} />
                          <span className="font-mono text-[11px] text-zinc-400">{rep.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!isCreate && employee && activeTab === 'onboarding' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
                    Onboarding & Provisioning Checklist
                  </span>
                  <span className="font-mono tabular-nums text-xs font-semibold text-[#09090B]">
                    {completedTasksCount}/{tasks.length} ({onboardingPct}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-[#E4E4E7]">
                  <div className="h-full bg-[#09090B] transition-all duration-300" style={{ width: `${onboardingPct}%` }} />
                </div>
                <div className="divide-y divide-[#E4E4E7] border border-[#E4E4E7] rounded-lg bg-white overflow-hidden">
                  {tasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => handleToggleTask(task.id)}
                      className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-[#FAFAFA] transition-colors text-xs"
                    >
                      {task.done ? (
                        <CheckSquare className="w-4 h-4 text-[#09090B] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-400 shrink-0" />
                      )}
                      <span className={task.done ? 'line-through text-[#71717A]' : 'text-[#09090B] font-medium'}>
                        {task.title}
                      </span>
                    </button>
                  ))}
                </div>
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Add custom provisioning or milestone task..."
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-[#E4E4E7] rounded-md focus:outline-none focus:border-zinc-900"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-medium bg-[#09090B] text-white rounded-md hover:bg-zinc-800 shrink-0"
                  >
                    Add Task
                  </button>
                </form>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-[#E4E4E7]">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] block">
                  Record Mutation & Diff Log ({employeeAuditHistory.length})
                </span>
                {employeeAuditHistory.length === 0 ? (
                  <p className="text-xs text-[#71717A] bg-[#FAFAFA] p-3 rounded-lg border border-[#E4E4E7]">
                    No mutations recorded since initial seed state. Edit any field or toggle a task to inspect live
                    field diffs.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {employeeAuditHistory.map((item) => (
                      <div key={item.id} className="p-3 rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-200/80 text-zinc-800 font-medium">
                            {item.actionType}
                          </span>
                          <span className="font-mono tabular-nums text-[10px] text-[#71717A]">
                            {new Date(item.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="font-medium text-[#09090B]">{item.summary}</div>
                        {item.diffs?.length > 0 && (
                          <div className="space-y-1 pt-1">
                            {item.diffs.map((d, i) => (
                              <div
                                key={i}
                                className="font-mono text-[11px] flex items-center gap-1.5 text-zinc-600 bg-white px-2 py-1 rounded border border-[#E4E4E7]"
                              >
                                <span className="text-zinc-400">{d.field}:</span>
                                <span className="line-through text-red-600/80 truncate max-w-[120px]">{d.before}</span>
                                <ArrowRight className="w-3 h-3 text-zinc-400 shrink-0" />
                                <span className="text-emerald-700 font-medium truncate max-w-[140px]">{d.after}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 border-t border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-between">
          <span className="text-[11px] text-[#71717A] font-mono">
            Press <kbd className="px-1.5 py-0.5 bg-white border border-[#E4E4E7] rounded text-zinc-700">Esc</kbd> to close
          </span>
          {(isCreate || activeTab === 'profile') &&
            (isEditing ? (
              <div className="flex items-center gap-2">
                {!isCreate && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...employee, managerId: employee.managerId || '' });
                      setErrors({});
                      setIsEditing(false);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-[#E4E4E7] rounded-md hover:bg-zinc-50 active:scale-[0.98] transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  form="employee-drawer-form"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#09090B] rounded-md hover:bg-zinc-800 active:scale-[0.98] transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isCreate ? 'Create Employee' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#09090B] rounded-md hover:bg-zinc-800 active:scale-[0.98] transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Record
              </button>
            ))}
        </div>
      </aside>
    </div>
  );
}
