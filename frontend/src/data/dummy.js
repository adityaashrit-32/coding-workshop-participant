/**
 * Dummy seed data for UI preview.
 * Used by all pages when VITE_USE_DUMMY_DATA=true or when the API is unreachable.
 * No backend calls are made when this data is active.
 */

export const DUMMY_EMPLOYEES = [
  { id: 'e1', user_id: null, first_name: 'Sarah',   last_name: 'Mitchell',  email: 'sarah.mitchell@acme.com',  department: 'Engineering',  job_title: 'Senior Engineer',    manager_id: null, hire_date: '2021-03-15', status: 'active',   created_at: '2021-03-15T09:00:00Z', updated_at: '2024-01-10T09:00:00Z' },
  { id: 'e2', user_id: null, first_name: 'James',   last_name: 'Okafor',    email: 'james.okafor@acme.com',    department: 'Engineering',  job_title: 'Software Engineer',  manager_id: 'e1', hire_date: '2022-07-01', status: 'active',   created_at: '2022-07-01T09:00:00Z', updated_at: '2024-01-10T09:00:00Z' },
  { id: 'e3', user_id: null, first_name: 'Priya',   last_name: 'Sharma',    email: 'priya.sharma@acme.com',    department: 'Product',      job_title: 'Product Manager',    manager_id: null, hire_date: '2020-11-20', status: 'active',   created_at: '2020-11-20T09:00:00Z', updated_at: '2024-01-10T09:00:00Z' },
  { id: 'e4', user_id: null, first_name: 'Carlos',  last_name: 'Rivera',    email: 'carlos.rivera@acme.com',   department: 'Sales',        job_title: 'Account Executive',  manager_id: null, hire_date: '2023-01-09', status: 'active',   created_at: '2023-01-09T09:00:00Z', updated_at: '2024-01-10T09:00:00Z' },
  { id: 'e5', user_id: null, first_name: 'Amara',   last_name: 'Diallo',    email: 'amara.diallo@acme.com',    department: 'HR',           job_title: 'HR Business Partner', manager_id: null, hire_date: '2019-06-03', status: 'active',   created_at: '2019-06-03T09:00:00Z', updated_at: '2024-01-10T09:00:00Z' },
  { id: 'e6', user_id: null, first_name: 'Tom',     last_name: 'Nguyen',    email: 'tom.nguyen@acme.com',      department: 'Engineering',  job_title: 'DevOps Engineer',    manager_id: 'e1', hire_date: '2022-03-14', status: 'active',   created_at: '2022-03-14T09:00:00Z', updated_at: '2024-01-10T09:00:00Z' },
  { id: 'e7', user_id: null, first_name: 'Fatima',  last_name: 'Al-Hassan', email: 'fatima.alhassan@acme.com', department: 'Finance',      job_title: 'Financial Analyst',  manager_id: null, hire_date: '2021-09-27', status: 'active',   created_at: '2021-09-27T09:00:00Z', updated_at: '2024-01-10T09:00:00Z' },
  { id: 'e8', user_id: null, first_name: 'Marcus',  last_name: 'Webb',      email: 'marcus.webb@acme.com',     department: 'Sales',        job_title: 'Sales Manager',      manager_id: null, hire_date: '2018-04-11', status: 'inactive', created_at: '2018-04-11T09:00:00Z', updated_at: '2024-01-10T09:00:00Z' },
]

export const DUMMY_REVIEWS = [
  { id: 'r1', employee_id: 'e1', reviewer_id: 'e5', period: '2024-Q1', rating: 4.5, comments: 'Exceptional delivery on the platform migration. Strong technical leadership.', status: 'approved',  created_at: '2024-04-01T09:00:00Z', updated_at: '2024-04-05T09:00:00Z' },
  { id: 'r2', employee_id: 'e2', reviewer_id: 'e1', period: '2024-Q1', rating: 3.5, comments: 'Good progress on backend services. Needs to improve documentation habits.',   status: 'approved',  created_at: '2024-04-01T09:00:00Z', updated_at: '2024-04-05T09:00:00Z' },
  { id: 'r3', employee_id: 'e3', reviewer_id: 'e5', period: '2024-Q1', rating: 4.0, comments: 'Excellent stakeholder management and roadmap clarity.',                        status: 'approved',  created_at: '2024-04-01T09:00:00Z', updated_at: '2024-04-05T09:00:00Z' },
  { id: 'r4', employee_id: 'e4', reviewer_id: 'e8', period: '2024-Q1', rating: 2.5, comments: 'Missed quarterly targets. Needs coaching on pipeline management.',             status: 'submitted', created_at: '2024-04-01T09:00:00Z', updated_at: '2024-04-03T09:00:00Z' },
  { id: 'r5', employee_id: 'e6', reviewer_id: 'e1', period: '2024-Q1', rating: 4.0, comments: 'Solid CI/CD improvements. Reduced deployment time by 40%.',                   status: 'approved',  created_at: '2024-04-01T09:00:00Z', updated_at: '2024-04-05T09:00:00Z' },
  { id: 'r6', employee_id: 'e7', reviewer_id: 'e5', period: '2024-Q1', rating: null, comments: '',                                                                            status: 'draft',     created_at: '2024-04-10T09:00:00Z', updated_at: '2024-04-10T09:00:00Z' },
  { id: 'r7', employee_id: 'e1', reviewer_id: 'e5', period: '2023-Q4', rating: 4.0, comments: 'Consistent high performer. Led the API redesign successfully.',               status: 'approved',  created_at: '2024-01-05T09:00:00Z', updated_at: '2024-01-08T09:00:00Z' },
  { id: 'r8', employee_id: 'e2', reviewer_id: 'e1', period: '2023-Q4', rating: 3.0, comments: 'Met expectations. Growing steadily.',                                         status: 'approved',  created_at: '2024-01-05T09:00:00Z', updated_at: '2024-01-08T09:00:00Z' },
]

export const DUMMY_PLANS = [
  {
    id: 'p1', employee_id: 'e2', title: 'Backend Engineering Excellence',
    description: 'Develop advanced backend skills and move toward senior engineer level.',
    start_date: '2024-01-01', end_date: '2024-12-31', status: 'active',
    created_at: '2024-01-01T09:00:00Z', updated_at: '2024-01-01T09:00:00Z',
    goals: [
      { id: 'g1', plan_id: 'p1', title: 'Complete AWS Solutions Architect certification', description: 'Pass the SAA-C03 exam', progress: 65, due_date: '2024-06-30', status: 'in_progress', created_at: '2024-01-01T09:00:00Z', updated_at: '2024-03-15T09:00:00Z' },
      { id: 'g2', plan_id: 'p1', title: 'Lead one major feature end-to-end',             description: 'Own design, implementation and release', progress: 40, due_date: '2024-09-30', status: 'in_progress', created_at: '2024-01-01T09:00:00Z', updated_at: '2024-03-15T09:00:00Z' },
      { id: 'g3', plan_id: 'p1', title: 'Improve code review participation',              description: 'Review at least 3 PRs per week', progress: 100, due_date: '2024-03-31', status: 'completed',  created_at: '2024-01-01T09:00:00Z', updated_at: '2024-04-01T09:00:00Z' },
    ],
  },
  {
    id: 'p2', employee_id: 'e4', title: 'Sales Performance Improvement Plan',
    description: 'Structured plan to improve pipeline management and close rates.',
    start_date: '2024-03-01', end_date: '2024-08-31', status: 'active',
    created_at: '2024-03-01T09:00:00Z', updated_at: '2024-03-01T09:00:00Z',
    goals: [
      { id: 'g4', plan_id: 'p2', title: 'Complete Sandler Sales Training',  description: '', progress: 0,  due_date: '2024-05-31', status: 'pending',     created_at: '2024-03-01T09:00:00Z', updated_at: '2024-03-01T09:00:00Z' },
      { id: 'g5', plan_id: 'p2', title: 'Achieve 80% of Q2 quota',          description: '', progress: 30, due_date: '2024-06-30', status: 'in_progress', created_at: '2024-03-01T09:00:00Z', updated_at: '2024-04-10T09:00:00Z' },
    ],
  },
  {
    id: 'p3', employee_id: 'e6', title: 'Platform Reliability Initiative',
    description: 'Improve system uptime and reduce incident response time.',
    start_date: '2023-07-01', end_date: '2023-12-31', status: 'completed',
    created_at: '2023-07-01T09:00:00Z', updated_at: '2024-01-05T09:00:00Z',
    goals: [
      { id: 'g6', plan_id: 'p3', title: 'Achieve 99.9% uptime SLA', description: '', progress: 100, due_date: '2023-12-31', status: 'completed', created_at: '2023-07-01T09:00:00Z', updated_at: '2024-01-05T09:00:00Z' },
    ],
  },
]

export const DUMMY_TRAINING = [
  { id: 't1', employee_id: 'e1', title: 'Advanced System Design',          provider: 'Educative',      completed_date: '2024-02-15', duration_hours: 20,   competency_id: null, notes: 'Excellent course on distributed systems.',  created_at: '2024-02-15T09:00:00Z' },
  { id: 't2', employee_id: 'e2', title: 'AWS Cloud Practitioner',          provider: 'AWS Training',   completed_date: '2024-01-20', duration_hours: 12,   competency_id: null, notes: 'Foundation for SAA-C03 prep.',              created_at: '2024-01-20T09:00:00Z' },
  { id: 't3', employee_id: 'e3', title: 'Product Strategy Masterclass',    provider: 'Reforge',        completed_date: '2024-03-10', duration_hours: 16,   competency_id: null, notes: 'Applied frameworks to Q2 roadmap.',         created_at: '2024-03-10T09:00:00Z' },
  { id: 't4', employee_id: 'e6', title: 'Kubernetes for DevOps Engineers', provider: 'Linux Foundation',completed_date: '2024-02-28', duration_hours: 24,   competency_id: null, notes: 'CKA exam prep completed.',                  created_at: '2024-02-28T09:00:00Z' },
  { id: 't5', employee_id: 'e5', title: 'Employment Law Fundamentals',     provider: 'SHRM',           completed_date: '2024-01-08', duration_hours: 8,    competency_id: null, notes: 'Annual compliance training.',               created_at: '2024-01-08T09:00:00Z' },
  { id: 't6', employee_id: 'e7', title: 'Financial Modelling in Excel',    provider: 'CFI',            completed_date: '2023-11-30', duration_hours: 30,   competency_id: null, notes: 'Completed with distinction.',               created_at: '2023-11-30T09:00:00Z' },
  { id: 't7', employee_id: 'e4', title: 'Sandler Sales Methodology',       provider: 'Sandler Training',completed_date: null,         duration_hours: null, competency_id: null, notes: 'Scheduled for May 2024.',                   created_at: '2024-04-01T09:00:00Z' },
]

export const DUMMY_COMPETENCIES = [
  { id: 'c1', name: 'Python',              description: 'Python programming language',          category: 'Technical',      created_at: '2023-01-01T09:00:00Z' },
  { id: 'c2', name: 'System Design',       description: 'Distributed systems architecture',     category: 'Technical',      created_at: '2023-01-01T09:00:00Z' },
  { id: 'c3', name: 'Leadership',          description: 'Team leadership and mentoring',         category: 'Soft Skills',    created_at: '2023-01-01T09:00:00Z' },
  { id: 'c4', name: 'Communication',       description: 'Written and verbal communication',      category: 'Soft Skills',    created_at: '2023-01-01T09:00:00Z' },
  { id: 'c5', name: 'Product Thinking',    description: 'User-centric product development',      category: 'Product',        created_at: '2023-01-01T09:00:00Z' },
  { id: 'c6', name: 'Cloud Infrastructure',description: 'AWS / GCP / Azure infrastructure',      category: 'Technical',      created_at: '2023-01-01T09:00:00Z' },
]

export const DUMMY_DASHBOARD = {
  summary: {
    total_employees: 7,
    total_reviews: 6,
    active_plans: 2,
    recent_training: 5,
  },
  high_performers: [
    { id: 'e1', first_name: 'Sarah',  last_name: 'Mitchell', department: 'Engineering', avg_rating: 4.25 },
    { id: 'e6', first_name: 'Tom',    last_name: 'Nguyen',   department: 'Engineering', avg_rating: 4.0  },
    { id: 'e3', first_name: 'Priya',  last_name: 'Sharma',   department: 'Product',     avg_rating: 4.0  },
  ],
  skill_gaps: [
    { employee_id: 'e2', first_name: 'James',  last_name: 'Okafor',  department: 'Engineering', competency: 'System Design',  current_level: 2, target_level: 4, gap: 2 },
    { employee_id: 'e4', first_name: 'Carlos', last_name: 'Rivera',  department: 'Sales',       competency: 'Communication',  current_level: 2, target_level: 4, gap: 2 },
    { employee_id: 'e6', first_name: 'Tom',    last_name: 'Nguyen',  department: 'Engineering', competency: 'Leadership',      current_level: 1, target_level: 3, gap: 2 },
  ],
  at_risk: [
    { id: 'e4', first_name: 'Carlos', last_name: 'Rivera',   department: 'Sales',   avg_rating: 2.5,  last_review: '2024-04-01T09:00:00Z' },
  ],
  performance_trends: [
    { period: '2023-Q3', avg_rating: 3.6, count: 5 },
    { period: '2023-Q4', avg_rating: 3.8, count: 6 },
    { period: '2024-Q1', avg_rating: 4.0, count: 5 },
  ],
}
