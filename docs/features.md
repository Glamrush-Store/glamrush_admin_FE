# Glamrush Admin feature catalog

This catalog describes the screens currently represented in `app/pages` and their supporting stores. Feature availability also depends on the signed-in user's API permissions.

## Authentication and access control

- Login and logout
- Forgot-password, code verification, and password reset
- Current-user hydration across browser refreshes
- Staff user listing, creation, detail, and editing
- Role listing, creation, detail, editing, and permission matrix
- Permission-aware navigation and actions

## Dashboard and cache monitoring

- KPI overview and trend breakdowns
- Order and product-sales tables
- Stock alerts
- Analytics filters and charts
- Cache summary, hit ratio, metrics by area, and Redis health
- Permission-controlled cache refresh and flush workflows

## Catalog management

- Hierarchical categories with create, view, and edit workflows
- Brand and vendor management
- Product listing, creation, detail, and editing
- Simple and variable product support
- Variant editing and product media
- Product assignment to multiple categories, including primary-category selection
- Attribute/SKU code configuration
- Collection creation, editing, detail, and product assignment

See [Collection API integration](collection-api.md).

## Storefront merchandising

- Storefront campaign listing, creation, detail, and editing
- Campaign hero copy, imagery, calls to action, state, and scheduling
- Homepage-section composition and product selection through the campaign workflow
- Storefront announcement text and destination configuration

## Content management

- Static page listing, creation, editing, preview, publication, and duplication
- FAQ category management and ordering
- FAQ listing, creation, editing, preview, publication, and ordering
- Explicit permission-denied states for protected content actions

## Discounts

- Discount-code listing and filters
- Create, detail, and edit workflows
- Eligibility, limits, date ranges, and activation state
- Storefront and catalog target selection
- Activation, deactivation, and duplication actions

## Customers, orders, and payments

- Customer listing
- Order archive, detail, status transitions, and status history
- Staff-assisted manual order creation
- Payment transaction listing and status context
- Shipment listing and fulfillment information

## Shipping

- Shipping-zone listing, creation, and editing
- Shipping-method listing, creation, and editing
- Shipping-rate listing, creation, and editing
- Country/state/city selectors backed by Admin Service location endpoints

## Payment methods and settings

- Payment-method listing, creation, and editing
- Categorized key/value settings
- Storefront announcement settings
- Attribute-code settings
- Email configuration test workflow exposed by the API

Sensitive settings must never be echoed into logs or persisted outside the intended API field state.

## Newsletter subscribers

- Subscriber listing
- Status and search filters
- Subscriber detail context
- CSV download of confirmed subscribers for use in external marketing tools

The customer subscription and confirmation lifecycle belongs to the Backend Service/Storefront; this application is the administrative view and export surface.

## Standard screen behavior

Every list/detail/form workflow should cover:

- Loading and retry behavior
- Empty results
- Pagination, filters, and search where supported
- Server validation errors
- Permission denial
- Confirmation for destructive or irreversible actions
- Success feedback and refreshed server state
- Responsive display at supported desktop/tablet widths
