import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, GitBranch, Plus } from 'lucide-react';
import { useEmployees } from '../context/EmployeeContext.jsx';
import { formatINR, getInitials } from '../utils/format.js';
import { buildOrgHierarchy } from '../utils/orgTree.js';
import { StatusPill } from './ui.jsx';

/** Interactive n-ary org tree with payroll rollups and add-report actions. */
export function OrgChartTreeView({ employees, onSelectEmployee }) {
  const { openCreateWithManager } = useEmployees();
  const { roots } = useMemo(() => buildOrgHierarchy(employees), [employees]);
  const [collapsedIds, setCollapsedIds] = useState(new Set());

  const toggleNode = (id, e) => {
    e.stopPropagation();
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderTreeNode = (node, depth = 0) => {
    const hasChildren = node.children?.length > 0;
    const isCollapsed = collapsedIds.has(node.id);

    return (
      <div key={node.id} className="relative">
        <div
          onClick={() => onSelectEmployee(node)}
          className="group flex items-center justify-between p-3 rounded-lg bg-white border border-[#E4E4E7] hover:border-zinc-900 transition-all cursor-pointer my-1.5"
        >
          <div className="flex items-center gap-3 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleNode(node.id, e)}
                className="w-6 h-6 rounded border border-[#E4E4E7] bg-[#FAFAFA] hover:bg-zinc-200/70 flex items-center justify-center text-zinc-700 shrink-0"
                title={isCollapsed ? 'Expand subtree' : 'Collapse subtree'}
              >
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span className="w-6 h-6 rounded border border-dashed border-zinc-200 flex items-center justify-center font-mono text-[10px] text-zinc-400 shrink-0">
                IC
              </span>
            )}
            <div className="w-8 h-8 rounded-full bg-[#09090B] text-white text-xs font-semibold flex items-center justify-center shrink-0">
              {getInitials(node.name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-semibold text-[#09090B] truncate">{node.name}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-[#E4E4E7]">
                  {node.id}
                </span>
                <StatusPill status={node.status} />
              </div>
              <div className="text-xs text-[#71717A] truncate mt-0.5">
                {node.role} · <span className="text-zinc-700 font-medium">{node.department}</span> · {node.location}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-3">
            <div className="hidden sm:flex items-center gap-2 font-mono tabular-nums text-[11px]">
              {node.totalTeamSize > 0 && (
                <span className="px-2 py-0.5 rounded bg-[#FAFAFA] border border-[#E4E4E7] text-zinc-700">
                  {node.directReportsCount} direct · {node.totalTeamSize} total
                </span>
              )}
              <span className="px-2 py-0.5 rounded bg-[#FAFAFA] border border-[#E4E4E7] text-[#09090B] font-medium">
                {formatINR(node.subtreePayroll, true)}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openCreateWithManager(node);
              }}
              className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-[#09090B] text-white rounded hover:bg-zinc-800 transition-all"
              title={`Add direct report to ${node.name}`}
            >
              <Plus className="w-3 h-3" />
              <span className="hidden md:inline">Add Report</span>
            </button>
          </div>
        </div>

        {hasChildren && !isCollapsed && (
          <div className="pl-6 sm:pl-8 ml-3 border-l border-[#E4E4E7] space-y-1">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="px-4 py-3 bg-white border border-[#E4E4E7] rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <GitBranch className="w-4 h-4 text-[#09090B]" />
          <div>
            <h3 className="text-xs font-semibold text-[#09090B]">N-Ary Reporting Hierarchy & Subtree Payroll Rollup</h3>
            <p className="text-[11px] text-[#71717A]">
              Computed in O(N) via hash-map adjacency list + DFS post-order aggregation. Click any node to inspect or
              hover to add a direct report.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setCollapsedIds(new Set())}
            className="px-2.5 py-1 font-medium text-zinc-700 bg-[#FAFAFA] border border-[#E4E4E7] rounded hover:bg-zinc-100"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={() => setCollapsedIds(new Set(employees.map((e) => e.id)))}
            className="px-2.5 py-1 font-medium text-zinc-700 bg-[#FAFAFA] border border-[#E4E4E7] rounded hover:bg-zinc-100"
          >
            Collapse All
          </button>
        </div>
      </div>
      <div className="space-y-2">{roots.map((rootNode) => renderTreeNode(rootNode, 0))}</div>
    </div>
  );
}
