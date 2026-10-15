# Acme Directory — Employee Management System (SPA)

A polished, keyboard-first **Employee Management single-page app** built with **React 19 + Vite + Tailwind CSS**. It covers 100% of the Frontend Intern assignment (CRUD, search/filter, validation, responsive UI) and adds staff-level extras: **time-travel undo/redo**, an **O(N) org-chart tree**, **batch CSV/JSON import**, **command palette**, and **hash routes** (`#/employees`, `#/employees/new`, `#/employees/:id`, `#/readme`).

Monochrome Linear / Attio / Vercel aesthetic (`#09090B` on `#FAFAFA`) — dense, scannable, and demo-ready for recruiters.

![Stack](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Live Demo in 60 Seconds (recruiter script)

1. `npm start` → opens `http://localhost:3000/#/employees`.
2. Press `/`, type `aarav` — debounced search filters across name, role, email, phone, manager, ID.
3. **Double-click any row** → inline edit in place (`Enter` saves, `Esc` cancels).
4. Press `N` → **Smart Paste** `Nikhil Kamath, Senior Frontend Engineer, nikhil.k@acme.dev, +91 98451 67210, Engineering, Bengaluru, 34L` → 7 fields auto-fill.
5. Press `⌘K` → command palette → *Batch Import* → *Load Sample 4-Row Batch* → Import.
6. Select rows → floating dock → *Delete* → press `⌘Z` → deletion is undone.
7. Switch to **Org Tree** view → click nodes, collapse subtrees, hover → *Add Report*.
8. Open **Rubric & README** (`#/readme`) → click *Test /employees/new* to jump back live.

---

## 🚀 Setup & Run

**Prerequisites:** Node.js 18+ and npm.

```bash
# 1. Clone
git clone https://github.com/Sudarshan7a/employee-management-system.git
cd employee-management-system

# 2. Install
npm install

# 3. Run (opens http://localhost:3000 automatically)
npm start
# …or without auto-open:
npm run dev

# 4. Production build check
npm run build
npm run preview
```

> Both `npm start` and `npm run dev` work, so whichever command the evaluator tries will launch the app.

---

## ✅ Required Features (100% coverage)

| # | Requirement | Where / How |
|---|-------------|-------------|
| 1 | **Employee List (Read)** — Name, Role, Email, Phone + actions | `DirectoryWorkspace.jsx` table (`table-fixed`) + `EmployeeTableRow.jsx`; card grid + org tree as alternate reads |
| 2 | **Add Employee (Create)** — validate name & email minimum | `EmployeeDrawer.jsx` (`#/employees/new`); live validation, duplicate-email guard, `validateEmployeeForm` |
| 3 | **Edit Employee (Update)** — form or inline, reflects immediately | Double-click inline edit (`Enter`/`Esc`) + 3-tab inspector (`#/employees/:id`) |
| 4 | **Delete Employee (Delete)** — confirmation recommended | Two-step row confirm, drawer confirm, bulk dock; orphaned reports cleanly reassigned to `null` |
| 5 | **Search / Filter** — by name, role, or email | `useDebouncedValue` (120ms) across name, role, email, phone, manager, location, ID + dept pills + status filter |
| 6 | **State Management** — hooks; Context optional | `useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`, `useContext` + `EmployeeContext` |
| 7 | **Data Source** — JSON array in code, no backend | `src/data/seedEmployees.js` (`SEED_EMPLOYEES`, 10 records) |

---

## 🏆 Bonus Features (all implemented)

- **localStorage persistence** — state + audit log survive refresh; 1-click seed reset.
- **Sorting** — by name, role, department, CTC, status (clickable headers).
- **Inline error handling** — per-field messages in drawer + inline-row error banner.
- **Pagination + density + Group-By swimlanes** — page size 6/8/10/20, compact/comfortable, group by department/status/location with payroll rollups.
- **Routes** — `#/employees`, `#/employees/new`, `#/employees/:id`, `#/readme` with Back/Forward support.
- **Context store** — `EmployeeContext` with immutable time-travel stack.
- **Time-travel undo/redo (`⌘Z` / `⌘⇧Z`)** — `past / present / future` snapshots + field-level `before → after` audit log + revert-to-snapshot.
- **O(N) org chart** — adjacency-list build + DFS post-order rollups (direct/total/payroll); DFS `detectReportingCycle` blocks `A → B → A`.
- **Batch CSV/JSON importer** — live schema validation, duplicate isolation, atomic commit.
- **Command palette (`⌘K`)**, **keyboard choreography** (`/`, `N`, `J`/`K`, `Esc`), **CSV/JSON export**, **column visibility**, **onboarding checklists**.

### ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search |
| `N` | New employee (`#/employees/new`) |
| `⌘K` / `Ctrl+K` | Command palette |
| `⌘Z` / `⌘⇧Z` | Undo / redo |
| `J` / `K` or `↓` / `↑` | Move row focus |
| `Enter` | Open focused row |
| `Esc` | Close drawer / modal / inline edit / clear selection |

---

## 🗂️ Project Structure

```text
employee-management-system/
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── index.css
    ├── App.jsx
    ├── context/
    │   └── EmployeeContext.jsx   # CRUD, undo/redo, audit, hash routing, toasts
    ├── hooks/
    │   └── useDebouncedValue.js  # 120ms debounced search
    ├── data/
    │   └── seedEmployees.js      # SEED_EMPLOYEES + constants + CSV samples
    ├── utils/
    │   ├── format.js             # clipboard, download, initials, INR parse/format
    │   ├── orgTree.js            # detectReportingCycle, buildOrgHierarchy, getUpwardChain
    │   ├── validation.js         # validateEmployeeForm, smart-paste parser, diffs
    │   └── csv.js                # employeesToCsv, parseBatchInput
    └── components/
        ├── ui.jsx                # StatusPill, FormField, SortableHeader
        ├── EmployeeTableRow.jsx  # inline edit + two-step delete row
        ├── EmployeeDrawer.jsx    # create + 3-tab inspect drawer
        ├── Overlays.jsx          # AuditHistoryDrawer + BatchImportModal
        ├── OrgChartTreeView.jsx  # N-ary tree with payroll rollups
        ├── CommandPalette.jsx    # ⌘K palette
        ├── ReadmeView.jsx        # /readme rubric matrix
        ├── DirectoryWorkspace.jsx# header, filters, table/grid/org, dock, toasts
        └── ErrorBoundary.jsx     # recovery mode (clears localStorage)
```

---

## 🧠 Key Engineering Decisions

- **Immutable time-travel:** every mutation pushes `{ employees, summary }` onto a capped (30-step) `past` stack and clears `future`; undo/redo swap stacks. Each commit also writes an audit entry with `snapshot` for 1-click revert.
- **O(N) hierarchy:** `buildOrgHierarchy` uses a `Map` adjacency list + post-order DFS, so direct reports, transitive team size, and subtree payroll are single-pass rollups.
- **Cycle guard:** `detectReportingCycle` walks the manager chain upward from the candidate; cyclic options are disabled in the manager `<select>` with the offending path shown.
- **Debounced search:** `useDebouncedValue` keeps typing at 60fps while filtering/sorting runs on the settled value.
- **Hash routing over react-router:** `#/employees*` deep-links without server rewrites, so `dist/` can be served statically (GitHub Pages, Netlify, Vercel) with zero config.

---

## 🧪 Manual Test Checklist

- [ ] Create with empty name → inline error appears; duplicate email blocked.
- [ ] Paste Smart-Paste preset → 7 fields flash green and populate.
- [ ] Double-click row → edit → `Enter` saves + toast with Undo; `Esc` cancels.
- [ ] Delete row → two-step confirm → `⌘Z` restores.
- [ ] Assign a subordinate as manager → `Circular hierarchy blocked` error.
- [ ] Batch import conflict sample → 1 duplicate isolated, 2 valid committed.
- [ ] Refresh page → data persists (localStorage).
- [ ] `npm run build` passes with no errors.

---

## 📦 Scripts

| Script | What it does |
|--------|--------------|
| `npm start` | Dev server on `:3000` + auto-open (evaluator-friendly) |
| `npm run dev` | Dev server on `:3000` |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | `oxlint` static checks |

---

## 📄 License

MIT — free for interviews, portfolios, and extensions.
