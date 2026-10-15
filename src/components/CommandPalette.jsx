import { useEffect, useRef, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  GitBranch,
  History,
  Plus,
  RotateCcw,
  Search,
  Upload,
} from 'lucide-react';
import { useEmployees } from '../context/EmployeeContext.jsx';
import { getInitials } from '../utils/format.js';

/** ⌘K command palette: commands + fuzzy jump-to-employee. */
export function CommandPalette({
  isOpen,
  onClose,
  onCreateNew,
  onSelectEmployee,
  onExportJson,
  onExportCsv,
  onOpenBatchImport,
  onOpenAuditDrawer,
  onSwitchView,
}) {
  const { employees, resetToSeed, setRoute, past, future } = useEmployees();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredEmployees = employees
    .filter(
      (e) =>
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.role.toLowerCase().includes(query.toLowerCase()) ||
        e.department.toLowerCase().includes(query.toLowerCase()) ||
        e.id.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 5);

  const commands = [
    { icon: Plus, label: 'Create New Employee (/employees/new)', hint: 'N', run: onCreateNew },
    { icon: GitBranch, label: 'Switch to Interactive N-Ary Org Chart Tree View', hint: 'Org Tree', run: () => onSwitchView('org') },
    { icon: Upload, label: 'Batch Import CSV / JSON with Schema Validation', hint: 'Importer', run: onOpenBatchImport },
    {
      icon: History,
      label: 'Inspect Time-Travel State & Field Diff Audit Log',
      hint: `${past.length} undo / ${future.length} redo`,
      run: onOpenAuditDrawer,
    },
    { icon: FileSpreadsheet, label: 'Export Directory as CSV (Excel / Sheets)', hint: '.csv', run: onExportCsv },
    { icon: Download, label: 'Export Directory as JSON', hint: '.json', run: onExportJson },
    { icon: FileText, label: 'Open Interviewer Rubric & Copy-Ready README.md', hint: '/readme', run: () => setRoute('/readme') },
    { icon: RotateCcw, label: 'Reset localStorage to Initial 10 Seed Records', hint: 'Reset', run: resetToSeed },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
      <div onClick={onClose} className="fixed inset-0 bg-zinc-950/30 backdrop-blur-[1px]" />
      <div
        style={{ animation: 'scaleIn 0.16s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        className="relative z-10 w-full max-w-lg bg-white rounded-xl border border-[#E4E4E7] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center px-3.5 border-b border-[#E4E4E7]">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to employee by name, role, ID..."
            className="w-full px-3 py-3 text-sm text-[#09090B] placeholder:text-zinc-400 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded border border-[#E4E4E7]">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          <div>
            <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Engineering & Directory Commands
            </div>
            {commands.map((cmd) => (
              <button
                key={cmd.label}
                type="button"
                onClick={() => {
                  onClose();
                  cmd.run();
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-zinc-800 hover:bg-zinc-100 rounded-md transition-colors"
              >
                <span className="flex items-center gap-2 font-medium">
                  <cmd.icon className="w-3.5 h-3.5 text-zinc-500" />
                  {cmd.label}
                </span>
                <span className="text-[11px] font-mono text-zinc-400">{cmd.hint}</span>
              </button>
            ))}
          </div>

          <div>
            <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Jump to Employee ({filteredEmployees.length})
            </div>
            {filteredEmployees.map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => {
                  onClose();
                  onSelectEmployee(emp);
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 text-xs hover:bg-zinc-100 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-[#09090B] text-white text-[10px] font-medium flex items-center justify-center shrink-0">
                    {getInitials(emp.name)}
                  </span>
                  <span className="font-medium text-[#09090B] truncate">{emp.name}</span>
                  <span className="text-[#71717A] truncate">· {emp.role}</span>
                </div>
                <span className="font-mono tabular-nums text-[11px] text-zinc-400 shrink-0">{emp.id}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
