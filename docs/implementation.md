# EPDM Platform — Implementation Guide

> [Main Guide](./README.md) | [Validation Guide](./validation.md) | [Evaluation Guide](./evaluation.md) | [Testing Guide](./testing.md) | **Implementation Guide**

## Overview

This is the **Employee Performance & Development Management (EPDM) Platform** — a full-stack serverless web application built on the existing coding-workshop scaffold.

---

## Architecture

```
frontend/src/
├── context/AuthContext.jsx       # JWT auth state (login/logout/role)
├── components/
│   ├── Layout.jsx                # Sidebar nav + AppBar
│   ├── Notify.jsx                # Global snackbar notifications
│   └── ProtectedRoute.jsx        # Role-aware route guard
├── pages/
│   ├── LoginPage.jsx             # Sign in / Register
│   ├── DashboardPage.jsx         # KPIs, high performers, skill gaps, at-risk
│   ├── EmployeesPage.jsx         # CRUD employees
│   ├── ReviewsPage.jsx           # CRUD performance reviews
│   ├── PlansPage.jsx             # Development plans + goals
│   ├── CompetenciesPage.jsx      # Competency library + skill assignments
│   └── TrainingPage.jsx          # Training records
└── services/api.js               # Axios client — all API calls

backend/epdm-service/
├── function.py                   # Lambda handler + URL router
├── db.py                         # psycopg3 connection pool + schema DDL
├── auth.py                       # JWT create/verify, password hashing
├── response.py                   # HTTP response helpers
├── routes_auth.py                # POST /auth/login, /auth/register, GET /auth/me
├── routes_employees.py           # CRUD /employees
├── routes_reviews.py             # CRUD /reviews
├── routes_plans.py               # CRUD /plans + /goals
├── routes_competencies.py        # CRUD /competencies + /employee-competencies
├── routes_training.py            # CRUD /training
├── routes_dashboard.py           # GET /dashboard
└── requirements.txt              # psycopg[binary]==3.1.14
```

---

## API Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | public | Sign in, returns JWT |
| POST | `/auth/register` | public | Register new user |
| GET | `/auth/me` | any | Current user info |
| GET | `/employees` | any | List employees |
| POST | `/employees` | admin/manager | Create employee |
| PUT | `/employees/:id` | admin/manager | Update employee |
| DELETE | `/employees/:id` | admin | Delete employee |
| GET | `/reviews` | any | List reviews |
| POST | `/reviews` | admin/manager | Create review |
| PUT | `/reviews/:id` | admin/manager | Update review |
| DELETE | `/reviews/:id` | admin | Delete review |
| GET | `/plans` | any | List dev plans |
| POST | `/plans` | admin/manager | Create plan |
| PUT | `/plans/:id` | admin/manager | Update plan |
| DELETE | `/plans/:id` | admin | Delete plan |
| POST | `/goals` | admin/manager | Add goal to plan |
| PUT | `/goals/:id` | any | Update goal progress |
| GET | `/competencies` | any | List competencies |
| POST | `/competencies` | admin | Create competency |
| PUT | `/competencies/:id` | admin | Update competency |
| DELETE | `/competencies/:id` | admin | Delete competency |
| GET | `/employee-competencies` | any | List skill assignments |
| POST | `/employee-competencies` | admin/manager | Assign competency |
| GET | `/training` | any | List training records |
| POST | `/training` | admin/manager | Add training record |
| DELETE | `/training/:id` | admin/manager | Delete training record |
| GET | `/dashboard` | any | KPIs + analytics |

---

## Database Schema (PostgreSQL)

- `users` — auth credentials + role
- `employees` — employee profiles
- `performance_reviews` — review cycles with ratings
- `development_plans` — employee dev plans
- `goals` — goals within a plan (with progress %)
- `competencies` — competency library
- `employee_competencies` — skill assignments with current/target levels
- `training_records` — completed training linked to competencies

Schema is auto-created on first Lambda invocation via `db.init_schema()`.

---

## Role-Based Access Control

| Role | Permissions |
|------|-------------|
| `admin` | Full access including delete and user management |
| `manager` | Create/update employees, reviews, plans, training |
| `employee` | Read-only + update own goal progress |

---

## Local Development

```bash
# Start all services (PostgreSQL, LocalStack, backend Lambda, frontend)
./bin/start-dev.sh

# Frontend only
cd frontend && npm run dev

# Backend only (smoke test)
cd backend/epdm-service && python function.py
```

---

## Deployment

```bash
# Deploy backend (Lambda + RDS + CloudFront)
./bin/deploy-backend.sh

# Deploy frontend (build + S3 + CloudFront invalidation)
./bin/deploy-frontend.sh
```
