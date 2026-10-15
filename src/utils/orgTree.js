import { parseSalaryNumber } from './format.js';

/**
 * Prevents circular manager assignments (A reports to B, B reports to A).
 * Walks upward from candidateManagerId in O(depth) time.
 */
export function detectReportingCycle(employees, employeeId, candidateManagerId) {
  if (!employeeId || !candidateManagerId) return { hasCycle: false, path: [] };
  if (employeeId === candidateManagerId) {
    return { hasCycle: true, path: [employeeId, candidateManagerId] };
  }

  const empMap = new Map(employees.map((e) => [e.id, e]));
  const visited = new Set([employeeId]);
  const path = [empMap.get(employeeId)?.name || employeeId];

  let currId = candidateManagerId;
  while (currId) {
    const currEmp = empMap.get(currId);
    path.push(currEmp?.name || currId);
    if (visited.has(currId)) return { hasCycle: true, path };
    visited.add(currId);
    currId = currEmp?.managerId || null;
  }
  return { hasCycle: false, path: [] };
}

/**
 * Builds an n-ary reporting tree in O(N) and computes post-order
 * rollups: direct reports, total transitive team size, subtree payroll.
 */
export function buildOrgHierarchy(employees) {
  const nodeMap = new Map();
  employees.forEach((emp) => {
    nodeMap.set(emp.id, {
      ...emp,
      children: [],
      directReportsCount: 0,
      totalTeamSize: 0,
      subtreePayroll: parseSalaryNumber(emp.salary),
    });
  });

  const roots = [];
  nodeMap.forEach((node) => {
    if (node.managerId && nodeMap.has(node.managerId) && node.managerId !== node.id) {
      nodeMap.get(node.managerId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  const visited = new Set();
  function computeRollups(node) {
    if (visited.has(node.id)) return;
    visited.add(node.id);

    let totalSubordinates = 0;
    let totalPayroll = parseSalaryNumber(node.salary);

    for (const child of node.children) {
      computeRollups(child);
      totalSubordinates += 1 + child.totalTeamSize;
      totalPayroll += child.subtreePayroll;
    }

    node.directReportsCount = node.children.length;
    node.totalTeamSize = totalSubordinates;
    node.subtreePayroll = totalPayroll;
  }

  roots.forEach(computeRollups);
  return { roots, nodeMap };
}

export function getUpwardChain(employees, employee) {
  if (!employee?.managerId) return [];
  const empMap = new Map(employees.map((e) => [e.id, e]));
  const chain = [];
  const seen = new Set([employee.id]);
  let currId = employee.managerId;

  while (currId && empMap.has(currId) && !seen.has(currId)) {
    seen.add(currId);
    const mgr = empMap.get(currId);
    chain.push(mgr);
    currId = mgr.managerId;
  }
  return chain;
}
