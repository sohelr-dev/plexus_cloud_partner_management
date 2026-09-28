# Plexus Cloud — Partner Management System

> A full-stack ISP/Telecom Partner Management platform built with **Laravel 12** (REST API) + **React + Vite** (SPA Frontend).
> Manages the complete lifecycle of reseller/franchise partners — from onboarding to financial reporting, bandwidth, equipment, commissions, and business intelligence.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Modules](#modules)
- [Database Schema](#database-schema)
- [API Structure](#api-structure)
- [Frontend Routes](#frontend-routes)
- [RBAC and Permissions](#rbac-and-permissions)
- [Scheduled Jobs](#scheduled-jobs)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Development Commands](#development-commands)
- [Project Structure](#project-structure)

---

## Project Overview

Plexus Cloud Partner Management is an internal enterprise platform for an ISP/Telecom company to manage their **Partners** (resellers and franchises) end-to-end.

### Business Models Supported (BR-01)

A single partner can operate under **multiple** business models simultaneously:

| # | Business Model | Description |
|---|---|---|
| 1 | Bandwidth Sales | Partner sells bandwidth packages to end customers |
| 2 | Commission Based | Partner earns commission on referred revenue |
| 3 | End Device Based | Partner manages/distributes CPE/end devices |
| 4 | Support Center | Partner operates branded support center branches |

### Core Business Rules

- **Source of Truth (s85):** This module aggregates — it does not duplicate billing/network/inventory data.
- **Traceability (BR-13):** Every financial figure is traceable to its source transaction.
- **Soft Deletes (BR-06):** Financial records are never hard deleted.
- **Status Audit (BR-12):** All status changes create an immutable history record.
- **IDOR Protection:** All child resources are scoped to their parent partner.

---

## Tech Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| PHP | 8.2+ | Runtime |
| Laravel | 12.x | API Framework |
| Laravel Sanctum | 4.3+ | Token-based API Authentication |
| Spatie Permission | 6.25+ | RBAC (10 roles, granular permissions) |
| Maatwebsite Excel | 3.1+ | Excel export for reports |
| barryvdh/laravel-dompdf | 3.1+ | PDF export for reports |
| SQLite / MySQL | — | Database (SQLite default for local dev) |
| Laravel Queues | database driver | Background job processing |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18+ | UI Framework |
| Vite | — | Build Tool |
| React Router DOM | v7 | Client-side routing |
| TanStack React Query | v5 | Server state management and caching |
| Bootstrap | 5.3.8 | CSS UI framework |
| Recharts | — | Data visualization / charts |
| React Hook Form + Zod | — | Form management and validation |
| Lucide React | — | Icon library |
| Axios | — | HTTP client |

---

## Architecture

```
plexus_cloud_partner_management/
├── backend/          # Laravel 12 REST API
├── frontend/         # React + Vite SPA
└── project_docs/     # PRD, database diagram, master plan
```

### Backend Architecture (Domain-Driven)

```
backend/app/
├── Http/
│   ├── Controllers/Api/V1/   # REST API controllers (versioned)
│   └── Resources/            # API response transformers
├── Models/               # Eloquent models grouped by domain
├── Services/             # Business logic layer (17 services)
├── Repositories/         # Data access layer
├── Jobs/                 # Queue jobs (4 background jobs)
├── Observers/            # Eloquent model observers
├── Exports/              # Excel/PDF export classes
├── Notifications/        # In-app notification handlers
└── Providers/            # Service providers
```

### Frontend Architecture (Feature-Based)

```
frontend/src/
├── api/              # Axios API helper functions (20 modules)
├── components/
│   ├── layout/       # AppLayout, Sidebar, Header
│   └── common/       # Shared UI components
├── features/
│   └── partners/     # Partner profile tab components (8 tabs)
├── pages/            # Route-level page components (12 modules)
├── hooks/            # Custom React hooks
├── context/          # AuthContext, PermissionContext
└── routes/           # ProtectedRoute, RoleRoute guards
```

---

## Modules

### 1. Partner Management
- Partner registration, profile, and lifecycle management
- Status: Pending Approval to Active to Suspended/Terminated
- Multi-model assignment (one partner, multiple business models)
- Geographic hierarchy: Territory — Zone — Area
- Account Manager and Relationship Manager assignment
- Bulk status update and cross-search (MAC/Serial/Device/Customer ID)

**Controllers:** PartnerController, PartnerProfileController

### 2. Financial Module
- Revenue tracking with source references (PartnerRevenue)
- Cost tracking with traceability (PartnerCost)
- Payments and outstanding (PartnerPayment)
- P&L Reports (PartnerProfitLoss)
- ROI Snapshots (PartnerRoi)
- Monthly financial archival (PartnerFinancialSnapshot)

**Services:** FinancialCalculationService

### 3. Bandwidth Management
- Bandwidth allocation per partner (Mbps/Gbps)
- Upgrade/downgrade request to approval workflow
- Change history tracking
- Approval/rejection with reason and notes

**Services:** BandwidthManagementService

### 4. Equipment and End Devices
- Equipment inventory (routers, switches, CPE)
- Assignment to partners and tracking
- End device management with status lifecycle
- Warranty tracking and maintenance records

**Services:** EquipmentManagementService

### 5. Commission Module
- Commission rule configuration (rate, period, type)
- Auto-calculation based on revenue
- Payout tracking and adjustments/reversals
- Period-based reporting (monthly/quarterly/annual)

**Services:** CommissionService

### 6. Support Center Module
- Partner-operated support center/branch management
- Staff count and monthly cost tracking
- Service coverage area tracking
- Center status lifecycle

**Services:** SupportCenterManagementService

### 7. Marketing and Customer Growth
- Customer metrics: opening, new, churned, closing
- Growth and churn rate calculations
- Campaign tracking
- Sales and package metrics

**Services:** MarketingService

### 8. Documents Module
- Document upload and versioning
- Expiry date tracking and alerts
- Document type categorization

**Services:** DocumentManagementService

### 9. Intelligence Module (Health, Risk, Insights)
- **Partner Health Score:** Composite score across financial, bandwidth growth, customer growth, and operational dimensions
- **Risk Indicators:** Automated risk flag detection
- **Partner Insights:** AI-assisted business recommendations

**Services:** PartnerHealthService, PartnerRiskService, PartnerInsightService

### 10. Reports Module

Seven built-in report types with Excel/PDF export:

| Report Type | Description |
|---|---|
| Partner Performance | Revenue, cost, net profit, ROI by partner |
| Financial and P&L | Revenue, cost, margin, payment, outstanding |
| Marketing and Customer Growth | Active/new/churned customers, churn rate |
| Bandwidth and Utilization | Allocated vs used Mbps, utilization % |
| Equipment and Asset | Equipment inventory, status, cost |
| Commission and Payout | Commission earned, rate, period |
| Support Center and Branch | Branch staff, cost, coverage |

**Service:** ReportService

### 11. Dashboard
Real-time KPI aggregation with multi-dimensional filtering:

- **Partner KPIs:** Total, Active, Pending, Suspended, New
- **Financial KPIs:** Revenue, Cost, Net Profit, Commission, Investment
- **Operational KPIs:** Total Bandwidth, Active Devices, Support Centers, Active Customers

Filter dimensions: partner_type, status, area_id, zone_id, account_manager_id, partner_id, business_model_id, month, quarter, year, start_date, end_date

### 12. Notifications
- In-app notification system
- Document expiry alerts via queue jobs
- Bandwidth approval status notifications

### 13. Audit Log
- Comprehensive action logging for all sensitive operations
- Filterable by user, action type, module, date

### 14. Settings
- Global system settings management
- Key-value store with typed values
- Role-restricted (setting.manage permission only)

---

## Database Schema

Approximately 45 tables across 12 domains:

```
CORE          partners, partner_business_models, partner_profiles,
              partner_relationships, partner_relationship_history

MARKETING     partner_customer_metrics, partner_campaigns,
              partner_sales_metrics, partner_package_metrics, partner_area_metrics

FINANCIAL     partner_revenues, partner_costs, partner_payments,
              partner_profit_losses, partner_financial_snapshots, partner_roi

BANDWIDTH     partner_bandwidth_allocations, partner_bandwidth_changes

EQUIPMENT     partner_equipment, partner_end_devices

COMMISSION    partner_commission_rules, partner_commissions,
              partner_commission_payments, partner_commission_adjustments

SUPPORT       partner_support_centers, partner_support_center_staff,
              partner_support_center_costs

DOCUMENTS     partner_documents, partner_document_versions

TIMELINE      partner_timeline_events, partner_notes

INTELLIGENCE  partner_health_scores, partner_risk_indicators, partner_insights

SYSTEM        users, audit_logs, notifications, settings,
              areas, zones, territories, packages, business_models
              (+ Spatie: roles, permissions, model_has_roles, model_has_permissions)
```

### Key Design Decisions

- All financial tables use **soft deletes** (BR-06)
- source_ref and source_type on revenue/cost for **traceability** (BR-13)
- effective_date and expiry_date on bandwidth and commission records
- Composite indexes on (partner_id, transaction_date) for all query paths

---

## API Structure

**Base URL:** `http://localhost:8000/api/v1`
**Authentication:** Bearer token (Laravel Sanctum)
**Content-Type:** `application/json`

| Endpoint | Module | Purpose |
|---|---|---|
| POST /auth/login | Auth | Login, get token |
| GET /dashboard/summary | Dashboard | Aggregated KPIs with filters |
| GET /partners | Partners | List with search and filters |
| POST /partners | Partners | Create new partner |
| GET /partners/{id} | Partners | Partner details |
| PUT /partners/{id} | Partners | Update partner |
| GET /partners/{id}/financial/* | Financial | Revenue, cost, payment, P&L |
| GET /partners/{id}/bandwidth | Bandwidth | Allocations and changes |
| POST /bandwidth/changes/{id}/approve | Bandwidth | Approve bandwidth request |
| GET /equipment/end-devices | Equipment | All end devices (global) |
| GET /equipment/assets | Equipment | All equipment (global) |
| GET /partners/{id}/commission/* | Commission | Rules and payouts |
| GET /partners/{id}/support-centers | Support Center | Branch list |
| GET /partners/{id}/marketing/* | Marketing | Customer metrics, campaigns |
| GET /partners/{id}/documents | Documents | Document list with expiry |
| GET /partners/{id}/health | Intelligence | Health score |
| GET /partners/{id}/risk | Intelligence | Risk indicators |
| GET /reports | Reports | Generate any of 7 report types |
| GET /reports/export | Reports | Export as Excel or PDF |
| GET /audit-logs | Audit | Action log with filters |
| GET /notifications | Notifications | Notification list |
| GET /settings | Settings | System settings |
| GET /roles | RBAC | Roles and permissions |

---

## Frontend Routes

| Route | Page | Guard |
|---|---|---|
| / | Dashboard | Authenticated |
| /partners | Partners List | Authenticated |
| /partners/new | Create Partner | Authenticated |
| /partners/:id | Partner Details | Authenticated |
| /partners/:id/edit | Edit Partner | Authenticated |
| /bandwidth | Bandwidth Dashboard | Authenticated |
| /commission | Commission Dashboard | Authenticated |
| /end-devices | End Devices | Authenticated |
| /support-centers | Support Centers | Authenticated |
| /reports | Reports | Authenticated |
| /partner-accounts | Partner Accounts | payment.view |
| /notifications | Notifications | Authenticated |
| /audit-logs | Audit Logs | audit-log.view |
| /settings | Settings | setting.manage |
| /login | Login Page | Public |

### Partner Details Tabs

Business Information, Business Models, Financial, Bandwidth & Equipment, Commission, Support Centers, Users & Customers, Health & Risk, History & Timeline

---

## RBAC and Permissions

**Authentication:** Laravel Sanctum (Personal Access Tokens)
**Authorization:** Spatie Laravel Permission v6

### Roles (10)

| Role | Access Level |
|---|---|
| Super Admin | Full system access |
| Admin | All modules except system config |
| Account Manager | Assigned partners only |
| Relationship Manager | Partner relationship data |
| Finance Manager | Financial module full access |
| Finance Viewer | Financial read-only |
| Network Engineer | Bandwidth and Equipment |
| Commission Manager | Commission module |
| Support Center Manager | Support center data |
| Viewer | Read-only access |

### Key Permissions

partner.view, partner.create, partner.update, partner.delete,
financial.view, financial.manage, bandwidth.view, bandwidth.manage,
equipment.view, device.view, device.update, commission.view, commission.manage,
support-center.view, report.view, report.export,
audit-log.view, setting.manage, payment.view

---

## Scheduled Jobs

| Job | Schedule | Purpose |
|---|---|---|
| DailyPartnerMetricsAggregationJob | Daily | Aggregate partner customer metrics |
| MonthlyFinancialSnapshotJob | Monthly (1st) | Archive financial snapshot per partner |
| RecalculateHealthScoresJob | Daily | Recalculate composite health scores |
| RefreshDocumentExpiryAlertsJob | Daily | Send alerts for expiring documents |

**Queue Driver:** database (configured in .env)
**Run Worker:** `php artisan queue:work`

---

## Getting Started

### Prerequisites

- PHP 8.2+
- Composer
- Node.js 18+ / npm
- MySQL 8+ or SQLite (for local dev)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd plexus_cloud_partner_management
```

### 2. Backend Setup

```bash
cd backend

# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure your database in .env

# Run migrations
php artisan migrate

# Seed roles, permissions, and initial data
php artisan db:seed

# Start API server
php artisan serve
```

### 3. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Start dev server
npm run dev
```

### 4. Queue Worker (separate terminal)

```bash
cd backend
php artisan queue:work
```

### 5. All-in-One (from backend directory)

```bash
# Starts: php artisan serve + queue:listen + pail logs + npm run dev
composer run dev
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
APP_NAME="Plexus Cloud Partner Management"
APP_ENV=local
APP_KEY=                    # Generated by: php artisan key:generate
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database — SQLite (default for local dev)
DB_CONNECTION=sqlite

# Database — MySQL (uncomment for production)
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=partner_management
# DB_USERNAME=root
# DB_PASSWORD=

# Queue and Session
QUEUE_CONNECTION=database
SESSION_DRIVER=database

# CORS — must match your frontend dev URL
FRONTEND_URL=http://localhost:5173

# Mail (use log driver locally)
MAIL_MAILER=log
```

---

## Development Commands

### Backend

```bash
php artisan serve                     # Start API server (port 8000)
php artisan migrate                   # Run pending migrations
php artisan migrate:fresh --seed      # Fresh migrate with seeders
php artisan test                      # Run test suite
php artisan queue:work                # Process queue jobs
php artisan pail                      # Real-time log viewer
php artisan optimize:clear            # Clear all caches
```

### Frontend

```bash
npm run dev        # Start dev server at http://localhost:5173
npm run build      # Build for production
npm run preview    # Preview production build
```

---

## Project Structure

```
plexus_cloud_partner_management/
│
├── backend/                               # Laravel 12 REST API
│   ├── app/
│   │   ├── Http/Controllers/Api/V1/
│   │   │   ├── DashboardController.php
│   │   │   ├── AuthController.php
│   │   │   ├── AuditLogController.php
│   │   │   ├── RolePermissionController.php
│   │   │   ├── SettingController.php
│   │   │   ├── Bandwidth/
│   │   │   ├── Commission/
│   │   │   ├── Document/
│   │   │   ├── Equipment/
│   │   │   ├── Financial/
│   │   │   ├── Marketing/
│   │   │   ├── Partner/
│   │   │   ├── Report/
│   │   │   └── SupportCenter/
│   │   ├── Models/
│   │   │   ├── Partner/
│   │   │   ├── Financial/
│   │   │   ├── Bandwidth/
│   │   │   ├── Equipment/
│   │   │   ├── Commission/
│   │   │   ├── Marketing/
│   │   │   ├── SupportCenter/
│   │   │   ├── Intelligence/
│   │   │   ├── Document/
│   │   │   └── Lookup/
│   │   ├── Services/                  # 17 business logic services
│   │   ├── Jobs/                      # 4 scheduled queue jobs
│   │   ├── Exports/
│   │   ├── Notifications/
│   │   └── Observers/
│   ├── database/
│   │   ├── migrations/                # 26 migration files
│   │   ├── seeders/
│   │   └── factories/
│   └── routes/
│       ├── api.php                    # All API v1 routes
│       └── console.php                # Scheduled job registration
│
├── frontend/                              # React + Vite SPA
│   └── src/
│       ├── api/                           # 20 Axios API helper modules
│       ├── components/layout/             # AppLayout, Sidebar, Header
│       ├── features/partners/             # 8 partner profile tab components
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── Partners/
│       │   ├── Bandwidth/
│       │   ├── Commission/
│       │   ├── EndDevices/
│       │   ├── SupportCenter/
│       │   ├── Reports/
│       │   ├── Notifications/
│       │   ├── PartnerAccounts/
│       │   ├── AuditLogs/
│       │   ├── Settings/
│       │   └── Auth/
│       ├── context/                       # AuthContext, PermissionContext
│       └── routes/                        # ProtectedRoute, RoleRoute
│
└── project_docs/                   # Complete development roadmap
    ├── Partner Management Module.docx.md  # PRD reference
    ├── database_diagram_plexus.png        # ERD diagram
    └── database_diagram_plexus.sql        # SQL schema export
```

---

## Development Notes

- **CORS:** Backend allows `http://localhost:5173`. Update `FRONTEND_URL` in `.env` for other environments.
- **API Versioning:** All endpoints are prefixed with `/api/v1/`.
- **Token Auth:** Include `Authorization: Bearer {token}` header on all protected routes.
- **Queue:** Run `php artisan queue:work` in a separate terminal for background jobs to process.
- **Line Endings:** Windows users may see CRLF warnings from git — safe to ignore.

---

*Built for Plexus Cloud — Internal Use Only*
 