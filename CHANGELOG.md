# CHANGELOG

All notable changes to the Esart Pharmacy Management System will be documented in this file.

## [1.0.0-rc.1] - 2026-10-07

### Changed

- Removed non-pharmacy workflow evidence from the application UI, state, seed data and release metadata.
- Repositioned the product as a pharmacy-only management system for Esart Pharmacy Uganda.
- Simplified Docker Compose to the production static Nginx web service used by this release candidate.
- Updated package metadata from generated demo naming to `esart-pharmacy-management-system`.
- Polished Esart branding and configurable business-logo upload.

### Pharmacy features retained

- Counter POS.
- FEFO batch and expiry tracking.
- Medicine catalogue.
- Goods received notes.
- Stock movement ledger.
- Stock take workflow.
- NDA controlled drug register.
- Prescription capture.
- Wholesale quotations, pro-forma and delivery note workflows.
- Batch recall lookup.
- Director approvals.
- Sales, stock, purchase and fiscal reports.
- Company settings and monitoring health endpoint.

### Production note

This release candidate is ready for owner review as a polished pharmacy frontend deployment. It is not yet a regulated live-production system until durable backend persistence, authenticated server-side roles, encrypted backup/restore, final URA EFRIS integration and staff acceptance are complete.
