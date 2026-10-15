import { AlertCircle, ArrowRight, Check, History, RotateCcw, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useEmployees } from '../context/EmployeeContext.jsx';
import { SAMPLE_CSV_CLEAN, SAMPLE_CSV_WITH_CONFLICTS } from '../data/seedEmployees.js';
import { formatINR } from '../utils/format.js';
import { parseBatchInput } from '../utils/csv.js';

export function AuditHistoryDrawer({ isOpen, onClose }) {
  const { auditLog, past, future, undo, redo, revertToSnapshot, setRoute } = useEmployees();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div onClick={onClose} className="fixed inset-0 bg-zinc-950/20 backdrop-blur-[1px]" />
      <aside
        style={{ animation: 'slideInRight 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        className="relative z-50 w-full max-w-[460px] bg-white h-full border-l border-[#E4E4E7] shadow-2xl flex flex-col justify-between overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#09090B]" />
              <h2 className="text-sm font-semibold text-[#09090B]">Time-Travel State & Audit Log</h2>
            </div>
            <p className="text-[11px] text-[#71717A] font-mono mt-0.5">
              {past.length} undo steps · {future.length} redo steps
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={undo}
              disabled={past.length === 0}
              className="px-2 py-1 text-xs font-mono bg-white border border-[#E4E4E7] rounded hover:bg-zinc-50 disabled:opacity-40"
              title="Undo (⌘Z)"
            >
              ⌘Z
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={future.length === 0}
              className="px-2 py-1 text-xs font-mono bg-white border border-[#E4E4E7] rounded hover:bg-zinc-50 disabled:opacity-40"
              title="Redo (⌘⇧Z)"
            >
              ⌘⇧Z
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-md hover:bg-zinc-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {auditLog.map((entry, idx) => (
            <div
              key={entry.id}
              className={`p-3.5 rounded-lg border transition-all space-y-2 ${
                idx === 0 ? 'border-[#09090B] bg-[#FAFAFA]' : 'border-[#E4E4E7] bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-200/80 text-zinc-900 font-semibold">
                    {entry.actionType}
                  </span>
                  {idx === 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                      HEAD
                    </span>
                  )}
                </div>
                <span className="font-mono tabular-nums text-[10px] text-[#71717A]">
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <div className="text-xs font-medium text-[#09090B]">{entry.summary}</div>
              {entry.diffs?.length > 0 && (
                <div className="space-y-1">
                  {entry.diffs.slice(0, 4).map((d, i) => (
                    <div
                      key={i}
                      className="font-mono text-[11px] flex items-center gap-1.5 bg-zinc-50 px-2 py-1 rounded border border-[#E4E4E7]"
                    >
                      <span className="text-zinc-400">{d.field}:</span>
                      <span className="line-through text-red-600/80 truncate max-w-[110px]">{d.before}</span>
                      <ArrowRight className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span className="text-emerald-700 font-medium truncate max-w-[130px]">{d.after}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                {entry.targetId ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setRoute(`/employees/${entry.targetId}`);
                    }}
                    className="text-[11px] font-mono text-zinc-500 hover:text-[#09090B] underline underline-offset-2"
                  >
                    Inspect {entry.targetId} →
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-zinc-400">
                    {entry.snapshot?.length || 0} records in snapshot
                  </span>
                )}
                {idx > 0 && entry.snapshot && (
                  <button
                    type="button"
                    onClick={() => revertToSnapshot(entry)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#09090B] bg-zinc-100 hover:bg-zinc-200 rounded transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Revert to Here
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

export function BatchImportModal({ isOpen, onClose }) {
  const { employees, batchImportEmployees } = useEmployees();
  const [rawInput, setRawInput] = useState(SAMPLE_CSV_CLEAN);

  useEffect(() => {
    if (isOpen && !rawInput.trim()) setRawInput(SAMPLE_CSV_CLEAN);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const parsedPreview = useMemo(() => parseBatchInput(rawInput, employees), [rawInput, employees]);

  if (!isOpen) return null;

  const validRows = parsedPreview.filter((r) => r.validationStatus === 'VALID');
  const conflictRows = parsedPreview.filter((r) => r.validationStatus !== 'VALID');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-zinc-950/30 backdrop-blur-[1px]" />
      <div
        style={{ animation: 'scaleIn 0.16s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        className="relative z-10 w-full max-w-3xl bg-white rounded-xl border border-[#E4E4E7] shadow-2xl overflow-hidden flex flex-col max-h-[86vh]"
      >
        <div className="px-6 py-4 border-b border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#09090B] flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Batch CSV / JSON Importer with Live Schema Validation
            </h2>
            <p className="text-xs text-[#71717A] mt-0.5">
              Paste CSV rows or a JSON array. Duplicate emails and malformed rows are isolated before atomic commit.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-md hover:bg-zinc-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRawInput(SAMPLE_CSV_CLEAN)}
                className="px-2.5 py-1 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-[#09090B] rounded-md transition-colors"
              >
                Load Sample 4-Row Batch
              </button>
              <button
                type="button"
                onClick={() => setRawInput(SAMPLE_CSV_WITH_CONFLICTS)}
                className="px-2.5 py-1 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-[#09090B] rounded-md transition-colors"
              >
                Load Batch with Duplicate Conflict
              </button>
            </div>
            <span className="font-mono text-[11px] text-[#71717A]">
              Format: Name, Role, Dept, Email, Phone, Location, Salary, Status
            </span>
          </div>

          <textarea
            rows={4}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            className="w-full font-mono text-xs bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-3 text-[#09090B] focus:outline-none focus:border-zinc-900 resize-none"
          />

          <div className="border border-[#E4E4E7] rounded-lg overflow-hidden">
            <div className="px-3.5 py-2 bg-[#FAFAFA] border-b border-[#E4E4E7] flex items-center justify-between text-xs">
              <span className="font-semibold text-[#09090B]">Live Schema Validation Preview ({parsedPreview.length} rows)</span>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-emerald-700">{validRows.length} Valid</span>
                <span className="text-red-600">{conflictRows.length} Conflicts</span>
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E4E4E7] bg-zinc-50/70 font-mono text-[10px] uppercase text-[#71717A]">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Name & Role</th>
                    <th className="py-2 px-3">Email</th>
                    <th className="py-2 px-3">CTC</th>
                    <th className="py-2 px-3">Validation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E7]">
                  {parsedPreview.map((r) => {
                    const isValid = r.validationStatus === 'VALID';
                    return (
                      <tr key={r.idx} className={isValid ? 'bg-white' : 'bg-red-50/50'}>
                        <td className="py-2 px-3 font-mono text-[11px] text-zinc-400">{r.idx}</td>
                        <td className="py-2 px-3">
                          <div className="font-medium text-[#09090B]">{r.name || '—'}</div>
                          <div className="text-[11px] text-[#71717A]">
                            {r.role} · {r.department}
                          </div>
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-zinc-700">{r.email || '—'}</td>
                        <td className="py-2 px-3 font-mono tabular-nums text-[11px] text-zinc-700">{formatINR(r.salary, true)}</td>
                        <td className="py-2 px-3">
                          {isValid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                              <Check className="w-3 h-3" />
                              VALID
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-red-500/10 text-red-700 border border-red-500/20">
                              <AlertCircle className="w-3 h-3" />
                              {r.reason}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-between">
          <span className="text-xs text-[#71717A]">
            Only valid rows will be committed. Full batch is undoable via{' '}
            <kbd className="font-mono text-[10px] px-1 py-0.5 bg-white border border-[#E4E4E7] rounded">⌘Z</kbd>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-[#E4E4E7] rounded-md hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={validRows.length === 0}
              onClick={() => {
                batchImportEmployees(validRows);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-[#09090B] text-white rounded-md hover:bg-zinc-800 disabled:opacity-40 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              Import {validRows.length} Valid Record(s)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
