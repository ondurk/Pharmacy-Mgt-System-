# THIRD-PARTY LICENSES AND DEPENDENCY AUDIT

This system was engineered from first principles without copying Sentrifugo source code, CSS stylesheets, images, or assets. Below is the audited inventory of third-party libraries incorporated into the codebase and their respective open-source licenses:

| Package | Version | License | Primary Purpose |
| :--- | :--- | :--- | :--- |
| **React** | ^19.0.1 | MIT License | Declarative UI component architecture |
| **React DOM** | ^19.0.1 | MIT License | DOM rendering engine |
| **Tailwind CSS** | ^4.3.3 | MIT License | Utility-first CSS layout engine |
| **Lucide React** | ^0.546.0 | ISC License | Clean, accessible SVG iconography |
| **Vite** | ^8.3.0 | MIT License | Frontend build tool and local dev server |
| **TypeScript** | ^7.0.2 | Apache-2.0 | Static type analysis and safety |
| **Motion** | ^12.23.24 | MIT License | Smooth micro-interaction transitions |
| **Express** | ^4.21.2 | MIT License | Backend API & middleware routing |
| **Dotenv** | ^17.2.3 | BSD-2-Clause | Environment configuration parser |
| **PostgreSQL 16** | 16-alpine | PostgreSQL License | Relational database engine |
| **Redis** | 7.2-alpine | BSD-3-Clause | Cache and background message broker |
| **Nginx** | 1.25-alpine | 2-Clause BSD | Reverse proxy and TLS termination |

### Legal Compliance Note
- **Sentrifugo**: No GPL code, stylesheets, or binary assets from Sentrifugo are included. The visual hierarchy (breadcrumbs, collapsible grouping, calm palette, tile widgets) was recreated cleanly from scratch using modern Tailwind CSS and ISC/MIT icon sets.
