import { AlertCircle, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

export function StatusPill({ status }) {
  const styles =
    {
      Active: { wrap: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20', dot: 'bg-emerald-500' },
      Onboarding: { wrap: 'bg-amber-500/10 text-amber-700 border-amber-500/20', dot: 'bg-amber-500' },
      'On Leave': { wrap: 'bg-zinc-500/10 text-zinc-600 border-zinc-400/25', dot: 'bg-zinc-400' },
    }[status] || { wrap: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border tracking-tight ${styles.wrap}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} />
      <span>{status}</span>
    </span>
  );
}

export function FormField({ label, required, hint, error, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs font-medium text-zinc-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {hint && <span className="text-[10px] font-mono tabular-nums text-[#71717A]">{hint}</span>}
      </div>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export function SortableHeader({ label, sortKey, widthClass, sortConfig, onSort }) {
  const isActive = sortConfig.key === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`${widthClass} px-3 py-2.5 cursor-pointer hover:text-[#09090B] transition-colors`}
    >
      <span className="inline-flex items-center gap-1">
        <span>{label}</span>
        {isActive ? (
          sortConfig.direction === 'asc' ? (
            <ArrowUp className="w-3 h-3 text-[#09090B]" />
          ) : (
            <ArrowDown className="w-3 h-3 text-[#09090B]" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </span>
    </th>
  );
}
