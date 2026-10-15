import { useState } from 'react';
import { Check, Copy, Edit3, Trash2, X } from 'lucide-react';
import { DEPARTMENTS, STATUSES } from '../data/seedEmployees.js';
import { formatINR, getInitials } from '../utils/format.js';
import { StatusPill } from './ui.jsx';

/**
 * Single directory row: select checkbox, inline editing,
 * two-step delete confirmation and hover actions.
 */
export function EmployeeTableRow({
  emp,
  managerObj,
  rowPad,
  visibleCols,
  isSelected,
  isInline,
  isFocused,
  isActiveDrawer,
  inlineDraft,
  setInlineDraft,
  onSelectRow,
  onOpenDrawer,
  onStartInlineEdit,
  onCommitInlineEdit,
  onCancelInlineEdit,
  onDeleteEmployee,
  copiedId,
  onCopyEmail,
}) {
  const [confirmRowDelete, setConfirmRowDelete] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onCommitInlineEdit(emp.id, e);
    if (e.key === 'Escape') onCancelInlineEdit();
  };

  return (
    <tr
      onClick={() => {
        if (!isInline && !confirmRowDelete) onOpenDrawer(emp.id);
      }}
      onDoubleClick={(e) => onStartInlineEdit(emp, e)}
      className={`group transition-colors cursor-pointer ${
        isInline
          ? 'bg-amber-50/40'
          : confirmRowDelete
            ? 'bg-red-50/50'
            : isSelected || isActiveDrawer
              ? 'bg-zinc-100/80'
              : isFocused
                ? 'bg-zinc-50 ring-1 ring-inset ring-zinc-300'
                : 'hover:bg-[#FAFAFA]'
      }`}
    >
      <td className={`px-3.5 ${rowPad}`} onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelectRow(emp.id, e)}
          aria-label={`Select ${emp.name}`}
          className="rounded border-zinc-300 text-[#09090B] focus:ring-0 cursor-pointer"
        />
      </td>

      <td className={`px-3 ${rowPad} truncate`}>
        {isInline ? (
          <input
            type="text"
            value={inlineDraft.name}
            onChange={(e) => setInlineDraft((d) => ({ ...d, name: e.target.value }))}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 text-xs bg-white border border-zinc-300 rounded focus:outline-none focus:border-zinc-900"
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#09090B] text-white text-[11px] font-medium flex items-center justify-center shrink-0">
              {getInitials(emp.name)}
            </div>
            <div className="min-w-0 truncate">
              <div className="font-medium text-[#09090B] truncate">{emp.name}</div>
              <div className="font-mono tabular-nums text-[10px] text-[#71717A]">
                {emp.id} · {emp.location}
              </div>
            </div>
          </div>
        )}
      </td>

      {visibleCols.role && (
        <td className={`px-3 ${rowPad} truncate`}>
          {isInline ? (
            <input
              type="text"
              value={inlineDraft.role}
              onChange={(e) => setInlineDraft((d) => ({ ...d, role: e.target.value }))}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 text-xs bg-white border border-zinc-300 rounded focus:outline-none focus:border-zinc-900"
            />
          ) : (
            <span className="text-zinc-800 font-medium truncate block">{emp.role}</span>
          )}
        </td>
      )}

      {visibleCols.department && (
        <td className={`px-3 ${rowPad} truncate`}>
          {isInline ? (
            <select
              value={inlineDraft.department}
              onChange={(e) => setInlineDraft((d) => ({ ...d, department: e.target.value }))}
              className="w-full px-1.5 py-1 text-xs bg-white border border-zinc-300 rounded focus:outline-none"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-[#E4E4E7]">
              {emp.department}
            </span>
          )}
        </td>
      )}

      {visibleCols.email && (
        <td className={`px-3 ${rowPad} truncate`}>
          {isInline ? (
            <input
              type="email"
              value={inlineDraft.email}
              onChange={(e) => setInlineDraft((d) => ({ ...d, email: e.target.value }))}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 text-xs font-mono bg-white border border-zinc-300 rounded focus:outline-none focus:border-zinc-900"
            />
          ) : (
            <div className="flex items-center gap-1.5 group/email truncate">
              <span className="font-mono tabular-nums text-[11px] text-zinc-600 truncate">{emp.email}</span>
              <button
                type="button"
                onClick={(e) => onCopyEmail(emp.email, emp.id, e)}
                title="Copy email address"
                className="opacity-0 group-hover/email:opacity-100 p-0.5 text-zinc-400 hover:text-[#09090B] transition-opacity shrink-0"
              >
                {copiedId === emp.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          )}
        </td>
      )}

      {visibleCols.phone && (
        <td className={`px-3 ${rowPad} font-mono tabular-nums text-[11px] text-zinc-600 truncate`}>
          {isInline ? (
            <input
              type="text"
              value={inlineDraft.phone}
              onChange={(e) => setInlineDraft((d) => ({ ...d, phone: e.target.value }))}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 text-xs font-mono bg-white border border-zinc-300 rounded focus:outline-none focus:border-zinc-900"
            />
          ) : (
            emp.phone
          )}
        </td>
      )}

      {visibleCols.manager && (
        <td className={`px-3 ${rowPad} truncate`}>
          {managerObj ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-700 truncate">
              <span className="w-4 h-4 rounded-full bg-zinc-200 text-zinc-800 text-[9px] font-semibold flex items-center justify-center shrink-0">
                {getInitials(managerObj.name)}
              </span>
              <span className="truncate">{managerObj.name}</span>
            </span>
          ) : (
            <span className="font-mono text-[10px] text-zinc-400">Root Exec</span>
          )}
        </td>
      )}

      {visibleCols.salary && (
        <td className={`px-3 ${rowPad} font-mono tabular-nums text-[11px] text-[#09090B] font-medium truncate`}>
          {isInline ? (
            <input
              type="text"
              value={inlineDraft.salary}
              onChange={(e) => setInlineDraft((d) => ({ ...d, salary: e.target.value }))}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 text-xs font-mono bg-white border border-zinc-300 rounded focus:outline-none focus:border-zinc-900"
            />
          ) : (
            formatINR(emp.salary, true)
          )}
        </td>
      )}

      {visibleCols.status && (
        <td className={`px-3 ${rowPad}`}>
          {isInline ? (
            <select
              value={inlineDraft.status}
              onChange={(e) => setInlineDraft((d) => ({ ...d, status: e.target.value }))}
              className="px-1.5 py-1 text-xs bg-white border border-zinc-300 rounded focus:outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <StatusPill status={emp.status} />
          )}
        </td>
      )}

      <td className={`px-3.5 ${rowPad} text-right`} onClick={(e) => e.stopPropagation()}>
        {isInline ? (
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => onCommitInlineEdit(emp.id, e)}
              className="p-1 bg-[#09090B] text-white rounded hover:bg-zinc-700"
              title="Save Inline Changes (Enter)"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={onCancelInlineEdit}
              className="p-1 bg-zinc-200 text-zinc-700 rounded hover:bg-zinc-300"
              title="Cancel (Esc)"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : confirmRowDelete ? (
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setConfirmRowDelete(false);
                onDeleteEmployee(emp.id);
              }}
              className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-600 text-white rounded hover:bg-red-700"
              title="Confirm Delete"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmRowDelete(false)}
              className="p-0.5 text-zinc-500 hover:text-zinc-900 rounded"
              title="Cancel"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => onStartInlineEdit(emp, e)}
              className="p-1 text-zinc-400 hover:text-[#09090B] hover:bg-zinc-200/60 rounded"
              title="Inline Edit Row"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmRowDelete(true)}
              className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded"
              title="Delete Employee"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
