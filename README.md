# Esart Pharmacy Management System

Self-hosted pharmacy management system for **Esart Pharmacy demo deployment**.

Designed for counter staff, pharmacists, storekeepers and directors. The current release is focused exclusively on pharmacy operations.

---

## 1. Quick Start — Docker Deployment

### Prerequisites

- Docker Engine 24+ and Docker Compose v2+
- Linux host, preferably Ubuntu 22.04/24.04 LTS or Debian 12
- 2 CPU cores and 4GB RAM minimum

### Boot

```bash
git clone <repo-url> esart-pharmacy-management
cd esart-pharmacy-management
docker compose up -d --build
docker compose ps
```

Default port:

```text
http://<server-ip>:8085/
```

Health endpoint:

```text
http://<server-ip>:8085/health/
```

---

## 2. Pharmacy Modules

- **Counter POS** — retail sales, wholesale sales, split payments and receipt printing.
- **FEFO Batch Inventory** — earliest-expiring stock is selected first.
- **Expiry Control** — expired stock is blocked and pushed into write-off controls.
- **Medicine Catalogue** — product list, retail/wholesale prices, reorder level and tax status.
- **Goods Received Notes** — stock intake with batch/lot and expiry capture.
- **Stock Ledger** — immutable stock movement trail.
- **Stock Take** — count sheets and variance approval workflow.
- **NDA Controlled Register** — controlled medicine receipt/dispense log.
- **Prescription Capture** — prescriber and patient details for prescription/controlled medicine sales.
- **Wholesale Operations** — quotations, pro-forma invoices and delivery notes.
- **Batch Recall** — trace customers/sales affected by a specific lot.
- **Director Approvals** — discount, refund and stock write-off dual control.
- **Reports** — sales, expiry, purchase, stock and EFRIS/fiscal summaries.
- **Company Settings** — business identity, logo upload, TIN/NDA/EFRIS identifiers and backup settings.

---

## 3. Production Release Notes

This release is prepared as a **pharmacy-only frontend production build** served by Nginx. It currently stores demo/working data in browser local storage. Before treating it as a regulated live production system, connect it to the approved backend database/API and complete operational acceptance:

- server-side authentication and roles,
- durable database persistence,
- tested encrypted backup/restore,
- final URA EFRIS adapter/API validation,
- NDA compliance review by the owner/pharmacist-in-charge,
- staff trial day without developer help.

Do not enter real patient, prescription, client, tax or confidential business records until those acceptance items are complete.

---

## 4. User Role Summary

| Role | Access Scope |
| :--- | :--- |
| **Director / Admin** | Full access. Approves discounts, refunds, stock write-offs and count adjustments. |
| **Pharmacist** | Prescription verification, controlled drug register, batch expiry management and stock takes. |
| **Cashier** | Counter POS, split payments and shift open/close. |
| **Storekeeper** | Goods received notes, store transfers and count sheets. |

---

## 5. Operations

Build locally:

```bash
npm install --legacy-peer-deps
npm run lint
npm run build
```

Run in Docker:

```bash
docker compose up -d --build
curl -i http://127.0.0.1:8085/health/
```

The Nginx container serves a static SPA with a `/health/` endpoint for monitoring.
