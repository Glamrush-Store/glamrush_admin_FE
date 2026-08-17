# Glamrush Admin

The staff-facing administration interface for the Glamrush commerce platform. This Nuxt single-page application consumes the Glamrush Admin Service and provides operational workflows for catalog, merchandising, orders, customers, fulfillment, content, promotions, settings, and access control.

## Platform context

| Repository | Responsibility |
| --- | --- |
| `glamrush_admin_service` | Laravel Admin API and catalog/configuration owner |
| `glamrush-admin` | This Nuxt staff application |
| `glamrush_backend_service` | Customer-facing commerce API |
| `glamrush_storefront` | Customer-facing Nuxt storefront |

Staff use this application; customer browsers use the Storefront. Do not configure the Admin frontend to call the customer Backend Service as a replacement for its Admin API.

## Core capabilities

- Staff authentication, password recovery, users, roles, and permission-aware navigation
- Dashboard analytics, stock alerts, and cache monitoring
- Categories, brands, vendors, products, variants, attributes, media, and collections
- Storefront campaigns, homepage merchandising, and announcement settings
- Discount-code management
- Content pages, FAQ categories, and FAQs
- Customers, orders, manual orders, payment transactions, and shipments
- Shipping zones, methods, rates, and payment methods
- Newsletter subscriber filtering and CSV export
- Categorized site settings and email-delivery testing

See [Feature catalog](docs/features.md) for details.

## Technology

- Nuxt 3 in client-side SPA mode
- Vue 3 Composition API
- Pinia
- PrimeVue and PrimeIcons
- Tailwind CSS
- PrimeVue Forms and Yup
- Plain JavaScript

## Local installation

### Prerequisites

- Node.js 20+
- npm
- A running `glamrush_admin_service`

### Setup

```bash
npm install
```

Create `.env` in the repository root:

```dotenv
API_BASE=http://127.0.0.1:8001/api/v1
```

The URL must point to the Admin Service, not the customer Backend Service. Nuxt defaults to `http://127.0.0.1:8000/api/v1` when `API_BASE` is absent.

### Run locally

To avoid using the same port as the Storefront:

```bash
npm run dev -- --port 3001
```

Open `http://localhost:3001`. A valid Admin Service account and permissions are required after login.

## Build and verification

```bash
npm run build
npm run preview -- --port 3001
```

The repository does not currently define an automated unit/E2E test script. Until one is added, every change should at minimum pass `npm run build` and be manually verified against the affected API workflow and permission state.

## Architecture conventions

- All API calls go through `app/composables/apiClient.js`.
- API paths belong in `app/constants` rather than inline page strings.
- Each business capability uses a dedicated Pinia store.
- Pages orchestrate reusable components and stores; business/API logic should not be duplicated in pages.
- Route access is enforced by the global auth middleware.
- Permission-dependent UI uses the current user's API-provided permissions.
- Forms use PrimeVue Forms and Yup where validation is required.
- The codebase uses JavaScript, not TypeScript.

See [Architecture](docs/architecture.md) and `AGENTS.md` before implementing changes.

## Authentication and security

The Admin Service returns a Sanctum bearer token. The application stores it in the `auth_token` cookie and attaches it as `Authorization: Bearer ...` through the shared API client. A `401` clears local authentication and redirects to login.

Treat the application as a privileged surface:

- Serve it only over HTTPS in production.
- Restrict Admin Service CORS to the deployed admin origin.
- Never place secrets in `runtimeConfig.public` or client-side source.
- Enforce permissions in the API even when controls are hidden in the UI.
- Avoid logging tokens, customer data, or exported subscriber information.

## Repository layout

```text
app/
├── components/       Reusable feature and presentation components
├── composables/       Shared API and permission behavior
├── constants/         Endpoint and feature constants
├── layouts/           Authenticated and authentication layouts
├── middleware/        Global route protection
├── pages/             File-based routes
└── stores/            Pinia feature stores
docs/                  API references and project documentation
public/                Static public assets
```

## Documentation

- [Architecture](docs/architecture.md)
- [Feature catalog](docs/features.md)
- [Collection API integration](docs/collection-api.md)
- `docs/api-docs.json` — checked-in API contract/reference
- `SPEC.md` — product and UI engineering rules

## Contribution workflow

1. Confirm the Admin Service endpoint and permission already exist.
2. Add or reuse endpoint constants and a feature store method.
3. Build the page from reusable PrimeVue/Tailwind components.
4. Cover loading, empty, forbidden, validation, and server-error states.
5. Run `npm run build` and manually verify the complete workflow.

Do not invent an endpoint or bypass the shared API client to complete a UI feature.
