# Esart Pharmacy Management System — Release Specification

## Status

Release candidate for team testing. This repository is sanitized for GitHub: demo data is synthetic, contact details use placeholder values, and no private deployment URLs, LAN IPs, API keys, passwords, or personal staff/patient details are required to run the app.

## Product scope

Esart Pharmacy Management System is a pharmacy-only management frontend for owner review and staff workflow validation.

### In scope

- Pharmacy dashboard with sales, expiry, low-stock and approval KPIs.
- Counter POS with split payment flow and receipt preview.
- Medicine catalogue with schedules, reorder levels, retail/wholesale pricing and NDA registration fields.
- FEFO batch inventory, stock ledger, expiry control, batch recall and stock take.
- Goods received notes and supplier intake.
- Controlled medicine register for receipt/dispense audit workflow.
- Wholesale / credit account orders.
- Director approval queue for discounts, write-offs and exceptional actions.
- Reports for sales, inventory, expiry, purchasing and fiscal review.
- Company settings with configurable logo upload.
- CSV import helper for medicine/batch seed data.
- Docker/Nginx packaging with SPA fallback and `/health/` endpoint.

### Explicitly out of scope / removed

- Non-pharmacy business verticals.
- Non-pharmacy sales, measurement, installation or field-service workflows.
- Generic project-management modules unrelated to pharmacy operations.
- Any real staff, patient, supplier, customer, tax or private infrastructure data.

## Current architecture

- Frontend: React + TypeScript + Vite.
- Styling: Tailwind CSS utility classes and project CSS.
- Runtime container: production Vite build served by Nginx.
- Health endpoint: `/health/` returns `ok`.
- Current persistence: browser `localStorage` only.
- Current authentication: demo frontend gate only; any non-empty user ID and password signs in.

## Demo login policy

The team-testing build is intentionally not using a real password store. Use the login form only for review/demo access. Do not treat the current login as production authentication.

Backend authentication must replace this before live operations.

## Data policy for this repository

- Seed users use role-based synthetic names and `.test` email domains.
- Phone/contact values are placeholders.
- Tax identifiers, pharmacy license number and EFRIS device number are placeholders.
- Demo patients and prescribers are synthetic.
- Public/private server URLs and LAN IPs are not part of the checked-in specification.
- Secrets must stay out of Git. Use environment variables or a secret manager for future backend/API integration.

## Production acceptance gates not yet complete

The app must not be used for regulated live pharmacy records until these are implemented and verified:

1. Backend API and durable database persistence.
2. Server-side authentication, password policy, session handling and RBAC.
3. Immutable audit log for stock, sales, controlled medicines and settings changes.
4. Encrypted scheduled backups plus restore test into a fresh database.
5. Real URA EFRIS integration and reconciliation tests.
6. NDA / pharmacist-in-charge compliance review.
7. Staff UAT day with no developer assistance.
8. Security review of exposed routes, headers, dependency updates and container runtime.

## Verification checklist for this release candidate

Before pushing or deploying this frontend release candidate:

```bash
npm install --legacy-peer-deps
npm run lint
npm run build
git diff --check
```

Also verify:

- repository scan has no old non-pharmacy terms;
- repository scan has no hardcoded secrets or personal records;
- Docker container is healthy;
- `/health/` returns `ok`;
- public/team test link returns the Esart Pharmacy title.

## Handoff notes

Use the externally provided team-testing URL for review. Keep credentials and production infrastructure details outside this repository.
