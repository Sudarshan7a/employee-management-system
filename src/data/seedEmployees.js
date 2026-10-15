/**
 * In-memory JSON data source for the directory.
 * Persisted to localStorage by EmployeeContext; this file is the seed.
 */
export const SEED_EMPLOYEES = [
  {
    id: 'EMP-101',
    name: 'Aarav Mehta',
    role: 'VP of Engineering',
    department: 'Engineering',
    email: 'aarav.mehta@acme.dev',
    phone: '+91 98450 11204',
    location: 'Bengaluru',
    status: 'Active',
    joinedAt: '2021-06-14',
    salary: 4800000,
    managerId: null,
    onboardingTasks: [
      { id: 't-1', title: 'Hardware & YubiKey provisioning', done: true },
      { id: 't-2', title: 'Production AWS & GitHub Org SSO', done: true },
      { id: 't-3', title: 'Security & SOC2 compliance sign-off', done: true },
      { id: 't-4', title: '30-60-90 day architecture roadmap', done: true },
    ],
  },
  {
    id: 'EMP-102',
    name: 'Riya Sharma',
    role: 'Principal Product Designer',
    department: 'Design',
    email: 'riya.sharma@acme.dev',
    phone: '+91 98201 44910',
    location: 'Mumbai',
    status: 'Active',
    joinedAt: '2022-08-01',
    salary: 3600000,
    managerId: 'EMP-104',
    onboardingTasks: [
      { id: 't-1', title: 'Hardware & YubiKey provisioning', done: true },
      { id: 't-2', title: 'Figma Design System token access', done: true },
      { id: 't-3', title: 'Security & SOC2 compliance sign-off', done: true },
      { id: 't-4', title: 'Audit core design system primitives', done: true },
    ],
  },
  {
    id: 'EMP-103',
    name: 'Devansh Kulkarni',
    role: 'Staff Backend Engineer',
    department: 'Engineering',
    email: 'devansh.k@acme.dev',
    phone: '+91 97312 88341',
    location: 'Bengaluru',
    status: 'Active',
    joinedAt: '2023-01-10',
    salary: 3400000,
    managerId: 'EMP-101',
    onboardingTasks: [
      { id: 't-1', title: 'Hardware & YubiKey provisioning', done: true },
      { id: 't-2', title: 'Production AWS & GitHub Org SSO', done: true },
      { id: 't-3', title: 'Security & SOC2 compliance sign-off', done: true },
      { id: 't-4', title: 'First on-call shadow rotation', done: true },
    ],
  },
  {
    id: 'EMP-104',
    name: 'Ananya Nair',
    role: 'Head of Product & Design',
    department: 'Product',
    email: 'ananya.nair@acme.dev',
    phone: '+91 99001 76234',
    location: 'Bengaluru',
    status: 'On Leave',
    joinedAt: '2021-11-22',
    salary: 4500000,
    managerId: null,
    onboardingTasks: [
      { id: 't-1', title: 'Hardware & YubiKey provisioning', done: true },
      { id: 't-2', title: 'Analytics & Linear workspace admin', done: true },
      { id: 't-3', title: 'Security & SOC2 compliance sign-off', done: true },
    ],
  },
  {
    id: 'EMP-105',
    name: 'Kabir Verma',
    role: 'Frontend Systems Intern',
    department: 'Engineering',
    email: 'kabir.verma@acme.dev',
    phone: '+91 96114 55902',
    location: 'Remote',
    status: 'Onboarding',
    joinedAt: '2025-01-15',
    salary: 1400000,
    managerId: 'EMP-103',
    onboardingTasks: [
      { id: 't-1', title: 'MacBook Pro & YubiKey provisioning', done: true },
      { id: 't-2', title: 'GitHub & Linear repo access', done: true },
      { id: 't-3', title: 'Ship first production PR to staging', done: false },
      { id: 't-4', title: 'Complete security compliance training', done: false },
    ],
  },
  {
    id: 'EMP-106',
    name: 'Meera Krishnan',
    role: 'Security Infrastructure Lead',
    department: 'Engineering',
    email: 'meera.k@acme.dev',
    phone: '+91 94440 31098',
    location: 'Chennai',
    status: 'Active',
    joinedAt: '2022-04-18',
    salary: 4100000,
    managerId: 'EMP-101',
    onboardingTasks: [
      { id: 't-1', title: 'Hardware & YubiKey provisioning', done: true },
      { id: 't-2', title: 'Root KMS & Vault key ceremony', done: true },
      { id: 't-3', title: 'Security & SOC2 compliance sign-off', done: true },
    ],
  },
  {
    id: 'EMP-107',
    name: 'Rohan Deshmukh',
    role: 'Design Systems Engineer',
    department: 'Design',
    email: 'rohan.d@acme.dev',
    phone: '+91 98230 67123',
    location: 'Pune',
    status: 'Active',
    joinedAt: '2023-09-05',
    salary: 2600000,
    managerId: 'EMP-102',
    onboardingTasks: [
      { id: 't-1', title: 'Hardware & YubiKey provisioning', done: true },
      { id: 't-2', title: 'Storybook & Chromatic CI pipeline setup', done: true },
      { id: 't-3', title: 'Accessibility (WCAG AA) audit', done: true },
    ],
  },
  {
    id: 'EMP-108',
    name: 'Sanya Malhotra',
    role: 'People Operations Lead',
    department: 'Operations',
    email: 'sanya.m@acme.dev',
    phone: '+91 98111 90876',
    location: 'Gurugram',
    status: 'Active',
    joinedAt: '2023-06-12',
    salary: 2200000,
    managerId: null,
    onboardingTasks: [
      { id: 't-1', title: 'Hardware & YubiKey provisioning', done: true },
      { id: 't-2', title: 'Payroll & compliance portal setup', done: true },
      { id: 't-3', title: 'Security & SOC2 compliance sign-off', done: true },
    ],
  },
  {
    id: 'EMP-109',
    name: 'Vikramaditya Rao',
    role: 'Product Analytics Lead',
    department: 'Product',
    email: 'vikram.rao@acme.dev',
    phone: '+91 99802 44119',
    location: 'Hyderabad',
    status: 'Active',
    joinedAt: '2022-12-01',
    salary: 2900000,
    managerId: 'EMP-104',
    onboardingTasks: [
      { id: 't-1', title: 'Hardware & YubiKey provisioning', done: true },
      { id: 't-2', title: 'Snowflake & dbt warehouse access', done: true },
      { id: 't-3', title: 'Executive KPI telemetry board', done: true },
    ],
  },
  {
    id: 'EMP-110',
    name: 'Nisha Gupta',
    role: 'Senior QA Automation Engineer',
    department: 'Engineering',
    email: 'nisha.gupta@acme.dev',
    phone: '+91 98332 10944',
    location: 'Bengaluru',
    status: 'Onboarding',
    joinedAt: '2025-02-01',
    salary: 2100000,
    managerId: 'EMP-106',
    onboardingTasks: [
      { id: 't-1', title: 'Hardware & YubiKey provisioning', done: true },
      { id: 't-2', title: 'Playwright e2e test runner access', done: true },
      { id: 't-3', title: 'Configure CI flake-detection alerts', done: false },
      { id: 't-4', title: 'Complete security compliance training', done: false },
    ],
  },
];

export const DEPARTMENTS = ['Engineering', 'Design', 'Product', 'Operations'];
export const STATUSES = ['Active', 'Onboarding', 'On Leave'];
export const LOCATIONS = [
  'Bengaluru',
  'Mumbai',
  'Remote',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Gurugram',
];

export const STORAGE_KEY = 'acme_staff_directory_v5_state';
export const AUDIT_STORAGE_KEY = 'acme_staff_directory_v5_audit';

export const SMART_PASTE_PRESETS = [
  {
    label: 'Preset 1 · Staff Frontend',
    raw: 'Nikhil Kamath, Senior Frontend Engineer, nikhil.k@acme.dev, +91 98451 67210, Engineering, Bengaluru, 34L',
  },
  {
    label: 'Preset 2 · Product Designer',
    raw: 'Tara Sutaria | Senior Product Designer | tara.s@acme.dev | +91 98204 55129 | Design | Mumbai | 28L',
  },
  {
    label: 'Preset 3 · Product Manager',
    raw: 'Arjun Rampal — Technical Product Manager, arjun.pm@acme.dev, +91 99008 11223, Product, Remote, 32L',
  },
];

export const SAMPLE_CSV_CLEAN = `Name,Role,Department,Email,Phone,Location,Salary,Status
Siddharth Joshi,Staff Distributed Systems Engineer,Engineering,siddharth.j@acme.dev,+91 98452 10922,Bengaluru,4200000,Active
Kriti Sanon,Senior Brand Designer,Design,kriti.sanon@acme.dev,+91 98209 33411,Mumbai,2500000,Onboarding
Varun Dhawan,Developer Experience Engineer,Engineering,varun.dx@acme.dev,+91 98118 77421,Remote,2800000,Active
Pooja Hegde,Technical Recruiter,Operations,pooja.h@acme.dev,+91 99004 55210,Hyderabad,1800000,Active`;

export const SAMPLE_CSV_WITH_CONFLICTS = `Name,Role,Department,Email,Phone,Location,Salary,Status
Aditi Rao,Senior Frontend Engineer,Engineering,aditi.rao@acme.dev,+91 98459 33219,Bengaluru,3100000,Active
Duplicate Aarav,Principal Architect,Engineering,aarav.mehta@acme.dev,+91 98450 11204,Bengaluru,4500000,Active
Ishaan Khatter,Product Analyst,Product,ishaan.k@acme.dev,+91 98212 90811,Mumbai,2100000,Onboarding`;

export const DEFAULT_ONBOARDING_TASKS = [
  { id: 't-1', title: 'Hardware & YubiKey provisioning', done: true },
  { id: 't-2', title: 'SSO, GitHub & Linear workspace access', done: false },
  { id: 't-3', title: 'Security & SOC2 compliance sign-off', done: false },
  { id: 't-4', title: 'First 30-day onboarding milestone review', done: false },
];
