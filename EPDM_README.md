# ACME HR — Employee Performance & Development Management Platform

A full-stack web application built to centralize employee performance tracking, development planning, competency management, and training records for ACME Inc.

**Live URL:** https://dvxzneq8fkhnj.cloudfront.net

---

## Table of Contents

- [Business Problem](#business-problem)
- [Solution Overview](#solution-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Role-Based Access Control](#role-based-access-control)
- [Local Development](#local-development)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)

---

## Business Problem

ACME Inc. struggled to track employee performance, development progress, and career growth. Performance reviews and development plans were scattered across spreadsheets and emails, making it impossible to:

- Identify high performers and employees at risk
- Track skill gaps across the organization
- Monitor training and development activities
- Support succession planning and promotion decisions

---

## Solution Overview

A centralized self-service platform where HR teams, managers, and employees can manage the full performance and development lifecycle — without any integration with external tools.

---

## Features

### Authentication & Authorization
- Email and password login with JWT tokens (custom implementation, no third-party auth)
- Three roles: HR, Manager, Employee
- Token stored in `localStorage`, auto-attached to every API request
- Auto-redirect to login on token expiry (401 response)

### Employee Management
- Full CRUD — create, view, edit, mark active/inactive
- Fields: name, email, department, job title, hire date, status, manager
- Search by name, email, department, job title, status

### Performance Reviews
- Create reviews with rating (1–5), period, comments, reviewer
- Status workflow: Draft → Submitted → Approved
- Only approved reviews count toward analytics and dashboard
- Search by employee name, rating, status, period

### Development Plans
- Create plans per employee with start/end dates and status
- Nested goals within each plan — title, description, progress (0–100%), due date
- Goal status: Pending → In Progress → Completed
- Search by employee name, plan title, status

### Competencies & Skill Management
- HR-managed competency library (name, category, description)
- Assign competencies to employees with current level and target level (1–5)
- Gap analysis — visualizes difference between current and target
- Edit skill levels after assignment

### Training Records
- Log training with provider, completion date, duration hours
- Link training to a specific competency
- Edit and delete existing records
- Search by employee name, training title, provider, completion status

### Dashboard & Analytics
Five API endpoints power the dashboard:

| Chart | API Endpoint | What It Shows |
|---|---|---|
| Performance Distribution | `GET /analytics/performance-distribution` | Count of approved reviews by rating band |
| Employees by Department | `GET /analytics/employees-by-role` | Headcount per job title/department |
| Training Completion | `GET /analytics/training-completion` | Completed vs pending training records |
| Employees at Risk | `GET /dashboard` | Employees with no review or rating < 2.5 |
| High Performers | `GET /dashboard` | Employees with avg approved rating ≥ 4.0 |

### Search
Real-time client-side search on every page using a shared `useSearch` hook — no API calls, instant results, case-insensitive.

### Dummy Data Fallback
When the database is empty, the frontend automatically shows sample data so the UI always looks populated during demos. Once real data is added, the fallback is permanently disabled.

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 7 | Build tool and dev server |
| Material UI | 6 | Component library |
| @mui/x-charts | 7 | Bar, pie, donut, line charts |
| Axios | 1.7 | HTTP client |
| React Router | 6 | Client-side routing |

### Backend
| Technology | Purpose |
|---|---|
| Python 3.11 | Backend language |
| Flask | Local dev server wrapping the Lambda handler |
| pg8000 | Pure Python PostgreSQL driver (Lambda-compatible) |
| JWT (custom) | Stateless authentication — no third-party library |

### Database
| Technology | Purpose |
|---|---|
| PostgreSQL | Relational database |
| Neon | Cloud PostgreSQL hosting (AWS us-east-1) |

### Infrastructure
| Service | Purpose |
|---|---|
| AWS Lambda | Serverless Python backend (ap-south-1) |
| AWS CloudFront | CDN — HTTPS, global distribution, API routing |
| AWS S3 | Static file hosting for built React app |
| AWS SQS | Dead letter queue for Lambda failures |
| Terraform | Infrastructure as Code |

---

## Architecture

```
Browser
  │
  │ HTTPS
  ▼
CloudFront (dvxzneq8fkhnj.cloudfront.net)
  │
  ├── /api/epdm-service/* ──────► AWS Lambda (Python)
  │                                     │
  │                               function.py
  │                               (regex router)
  │                                     │
  │                    ┌────────────────┼────────────────┐
  │                    ▼                ▼                ▼
  │             routes_auth      routes_employees   routes_reviews
  │             routes_plans     routes_competencies routes_training
  │             routes_dashboard routes_analytics
  │                    │
  │                    ▼
  │             pg8000 driver
  │                    │
  │                    ▼
  │             Neon PostgreSQL
  │
  └── /* ────────────────────────► S3 (React static files)
```

### Request Flow
1. User logs in → React sends `POST /api/epdm-service/auth/login`
2. CloudFront routes to Lambda
3. Lambda verifies credentials against `users` table
4. JWT token returned → stored in `localStorage`
5. Every subsequent request includes `Authorization: Bearer <token>`
6. Lambda validates token on every protected route before executing

### Local Development Flow
```
React (localhost:5173)
  │ /api/* requests
  ▼
Vite proxy (strips /api prefix)
  │
  ▼
Flask server (localhost:8000)
  │
  ▼
function.py handler → routes → PostgreSQL (localhost:5432)
```

---

## Project Structure

```
coding-workshop-participant/
├── backend/
│   └── epdm-service/
│       ├── function.py          # Lambda entry point — regex router
│       ├── db.py                # PostgreSQL connection + schema init (pg8000)
│       ├── auth.py              # JWT create/verify, password hash
│       ├── response.py          # Shared HTTP response helpers
│       ├── server.py            # Flask local dev server
│       ├── routes_auth.py       # POST /auth/login, /auth/register, GET /auth/me
│       ├── routes_employees.py  # CRUD /employees
│       ├── routes_reviews.py    # CRUD /reviews
│       ├── routes_plans.py      # CRUD /plans + /goals
│       ├── routes_competencies.py # CRUD /competencies + /employee-competencies
│       ├── routes_training.py   # CRUD /training
│       ├── routes_dashboard.py  # GET /dashboard
│       ├── routes_analytics.py  # GET /analytics/*
│       └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Layout.jsx        # Sidebar + AppBar + navigation
│       │   ├── ProtectedRoute.jsx # Auth guard for React Router
│       │   ├── SearchBar.jsx     # Reusable search input component
│       │   └── Notify.jsx        # Snackbar notification system
│       ├── context/
│       │   └── AuthContext.jsx   # Auth state — signIn, signUp, signOut, hasRole
│       ├── hooks/
│       │   ├── useApi.js         # Async API call wrapper with loading/error state
│       │   └── useSearch.js      # Client-side real-time search hook
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── DashboardPage.jsx
│       │   ├── EmployeesPage.jsx
│       │   ├── ReviewsPage.jsx
│       │   ├── PlansPage.jsx
│       │   ├── CompetenciesPage.jsx
│       │   └── TrainingPage.jsx
│       ├── services/
│       │   └── api.js            # All API functions (axios, auto JWT header)
│       ├── data/
│       │   └── dummy.js          # Fallback sample data for empty DB
│       └── App.jsx               # MUI theme + React Router setup
│
└── infra/
    ├── provider.tf    # AWS provider + S3 backend config
    ├── lambda.tf      # Lambda function + IAM + SQS DLQ
    ├── s3.tf          # S3 bucket for frontend
    ├── cloudfront.tf  # CloudFront distribution
    ├── rds.tf         # Aurora PostgreSQL (disabled — using Neon)
    ├── locals.tf      # Computed values + env vars
    ├── variable.tf    # Input variables
    ├── output.tf      # Outputs: URLs, bucket names
    └── data.tf        # AWS data sources (VPC, subnets, etc.)
```

---

## Database Schema

```sql
users              — authentication (email, hashed password, role)
employees          — employee records (name, department, job title, status)
performance_reviews — review records (rating 1-5, period, status, comments)
development_plans  — plans per employee (title, dates, status)
goals              — goals within plans (progress 0-100%, status)
competencies       — skill library (name, category, description)
employee_competencies — skill assignments (current level, target level 1-5)
training_records   — training log (provider, hours, completion date)
```

All tables use UUID primary keys generated by PostgreSQL's `pgcrypto` extension.

---

## API Reference

### Authentication
| Method | Endpoint | Auth | Body |
|---|---|---|---|
| POST | `/auth/register` | No | `{email, password, role}` |
| POST | `/auth/login` | No | `{email, password}` |
| GET | `/auth/me` | Bearer | — |

### Employees
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/employees` | Bearer |
| GET | `/employees?status=all` | Bearer |
| POST | `/employees` | HR, Manager |
| GET | `/employees/:id` | Bearer |
| PUT | `/employees/:id` | HR, Manager |
| DELETE | `/employees/:id` | HR only |

### Performance Reviews
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/reviews` | Bearer |
| POST | `/reviews` | HR, Manager |
| GET | `/reviews/:id` | Bearer |
| PUT | `/reviews/:id` | HR, Manager |
| DELETE | `/reviews/:id` | HR only |

### Development Plans & Goals
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/plans` | Bearer |
| POST | `/plans` | HR, Manager |
| GET/PUT/DELETE | `/plans/:id` | Bearer / HR+Manager / HR |
| POST | `/goals` | HR, Manager |
| PUT | `/goals/:id` | HR, Manager |

### Competencies
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/competencies` | Bearer |
| POST | `/competencies` | HR only |
| PUT/DELETE | `/competencies/:id` | HR only |
| GET | `/employee-competencies` | Bearer |
| POST | `/employee-competencies` | HR, Manager |

### Training
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/training` | Bearer |
| POST | `/training` | HR, Manager |
| DELETE | `/training/:id` | HR, Manager |

### Dashboard & Analytics
| Method | Endpoint | Returns |
|---|---|---|
| GET | `/dashboard` | Summary stats, high performers, at-risk, skill gaps, trends |
| GET | `/analytics/employees-by-role` | Headcount by job title |
| GET | `/analytics/performance-distribution` | Rating band breakdown |
| GET | `/analytics/training-completion` | Completed vs pending |
| GET | `/analytics/monthly-performance-trend` | Monthly review counts + ratings |

---

## Role-Based Access Control

| Action | HR | Manager | Employee |
|---|---|---|---|
| View all data | ✅ | ✅ | ✅ |
| Create records | ✅ | ✅ | ❌ |
| Edit records | ✅ | ✅ | ❌ |
| Delete records | ✅ | ❌ | ❌ |
| Manage competency library | ✅ | ❌ | ❌ |
| Assign competencies | ✅ | ✅ | ❌ |

Enforced on both frontend (button visibility) and backend (every route validates the JWT role).

---

## Local Development

### Prerequisites
- Python 3.11
- Node.js 18+
- PostgreSQL running on localhost:5432

### Backend
```bash
cd backend/epdm-service
pip install flask flask-cors pg8000
IS_LOCAL=true python3 server.py
# Running at http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Running at http://localhost:5173
```

### Test the stack
```bash
# Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"Admin1234","role":"hr"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"Admin1234"}'
```

---

## Deployment

### Deploy Backend (Lambda)
```bash
cd backend/epdm-service
zip -r /tmp/epdm-update.zip . \
  -x "*.pyc" -x "__pycache__/*" \
  -x "psycopg*" -x "psycopg_binary*" \
  -x "server.py" -x "lambda_pkg/*"

aws lambda update-function-code \
  --function-name coding-workshop-epdm-service-d2da61c9 \
  --zip-file fileb:///tmp/epdm-update.zip

# Always restore env vars after backend deploy
aws lambda update-function-configuration \
  --function-name coding-workshop-epdm-service-d2da61c9 \
  --vpc-config SubnetIds=[],SecurityGroupIds=[] \
  --environment "Variables={
    IS_LOCAL=false,
    POSTGRES_HOST=ep-polished-frog-a43yw7as.us-east-1.aws.neon.tech,
    POSTGRES_PORT=5432,
    POSTGRES_NAME=neondb,
    POSTGRES_USER=neondb_owner,
    POSTGRES_PASS=<your-neon-password>
  }"
```

### Deploy Frontend (S3 + CloudFront)
```bash
cd frontend
VITE_API_URL="https://dvxzneq8fkhnj.cloudfront.net" \
  node_modules/.bin/vite build

aws s3 sync dist/ s3://coding-workshop-website-d2da61c9-135306227752/ --delete

aws cloudfront create-invalidation \
  --distribution-id E3ENZR8A236G6 \
  --paths "/*"
```

---

## Environment Variables

### Backend (Lambda / local)
| Variable | Local | Production |
|---|---|---|
| `IS_LOCAL` | `true` | `false` |
| `POSTGRES_HOST` | `localhost` | Neon hostname |
| `POSTGRES_PORT` | `5432` | `5432` |
| `POSTGRES_NAME` | `postgres` | `neondb` |
| `POSTGRES_USER` | `postgres` | `neondb_owner` |
| `POSTGRES_PASS` | `postgres123` | Neon password |

### Frontend
| Variable | Value |
|---|---|
| `VITE_API_URL` | CloudFront URL (production) or empty (local — uses Vite proxy) |

---

## AWS Resources

| Resource | Name |
|---|---|
| Lambda Function | `coding-workshop-epdm-service-d2da61c9` |
| S3 Bucket | `coding-workshop-website-d2da61c9-135306227752` |
| CloudFront Distribution | `E3ENZR8A236G6` |
| CloudFront Domain | `dvxzneq8fkhnj.cloudfront.net` |
| Lambda URL | `mnfhatoreb5v3s3uj5pf5zinxm0zwzlt.lambda-url.ap-south-1.on.aws` |
| AWS Region | `ap-south-1` (Mumbai) |
| Terraform State Bucket | `coding-workshop-tfstate-135306227752` |
