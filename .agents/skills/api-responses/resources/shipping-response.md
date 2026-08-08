## Response Types

### 1. Shipping Zones list Success

- **Status Code**: 200 OK
- **Message**: "Success"
- **Action**:
- **payload**: {
  "success": true,
  "message": "Success",
  "data": [
  {
  "id": "01kr1cx4mgk1nwp9q58dhptk14",
  "name": "Lagos",
  "country": "NG",
  "state": "Lagos",
  "city": null,
  "postal_code_pattern": null,
  "is_active": true,
  "created_at": "2026-05-07T14:19:12.000000Z",
  "updated_at": "2026-05-07T14:19:12.000000Z"
  },
  {
  "id": "01kr1cx4mreh0p3vraexf16q1n",
  "name": "Abuja",
  "country": "NG",
  "state": "FCT",
  "city": null,
  "postal_code_pattern": null,
  "is_active": true,
  "created_at": "2026-05-07T14:19:12.000000Z",
  "updated_at": "2026-05-07T14:19:12.000000Z"
  },
  {
  "id": "01kr1cx4mwcmhn1a9g1k9tmnqx",
  "name": "Port Harcourt",
  "country": "NG",
  "state": "Rivers",
  "city": "Port Harcourt",
  "postal_code_pattern": null,
  "is_active": true,
  "created_at": "2026-05-07T14:19:12.000000Z",
  "updated_at": "2026-05-07T14:19:12.000000Z"
  },
  {
  "id": "01kr1cx4mzwvn0gvb75kk1k3v8",
  "name": "Nationwide",
  "country": "NG",
  "state": null,
  "city": null,
  "postal_code_pattern": null,
  "is_active": true,
  "created_at": "2026-05-07T14:19:12.000000Z",
  "updated_at": "2026-05-07T14:19:12.000000Z"
  }
  ],
  "meta": {
  "current_page": 1,
  "from": 1,
  "last_page": 1,
  "links": [
  {
  "url": null,
  "label": "&laquo; Previous",
  "page": null,
  "active": false
  },
  {
  "url": "http://127.0.0.1:8000/api/v1/shipping/zones?page=1",
  "label": "1",
  "page": 1,
  "active": true
  },
  {
  "url": null,
  "label": "Next &raquo;",
  "page": null,
  "active": false
  }
  ],
  "path": "http://127.0.0.1:8000/api/v1/shipping/zones",
  "per_page": 15,
  "to": 4,
  "total": 4
  },
  "links": {
  "first": "http://127.0.0.1:8000/api/v1/shipping/zones?page=1",
  "last": "http://127.0.0.1:8000/api/v1/shipping/zones?page=1",
  "prev": null,
  "next": null
  }
  }

### 2. Shipping Zone by id Success

- **Status Code**: 200 OK
- **Message**: "Success"
- **Action**:
- **payload**:{
  "success": true,
  "message": "Success",
  "data": {
  "id": "01kr1cx4mgk1nwp9q58dhptk14",
  "name": "Lagos",
  "country": "NG",
  "state": "Lagos",
  "city": null,
  "postal_code_pattern": null,
  "is_active": true,
  "rates": [
  {
  "id": "01kr1cx564fqx9rx9dz4ved8kx",
  "rate_type": "flat",
  "amount": "1500.00",
  "method": {
  "id": "01kr1cx41s08s71tg8gb0bk9ec",
  "name": "Standard Delivery",
  "code": "standard"
  }
  },
  {
  "id": "01kr1cx56bdsa4f8x5ep4fs5g2",
  "rate_type": "flat",
  "amount": "3000.00",
  "method": {
  "id": "01kr1cx427fqtv6aa896kaem2r",
  "name": "Express Delivery",
  "code": "express"
  }
  },
  {
  "id": "01kr1cx56fyq91cbs4w4kxeyr8",
  "rate_type": "flat",
  "amount": "0.00",
  "method": {
  "id": "01kr1cx4297931f5z8ndn8mfjy",
  "name": "Store Pickup",
  "code": "pickup"
  }
  }
  ],
  "created_at": "2026-05-07T14:19:12.000000Z",
  "updated_at": "2026-05-07T14:19:12.000000Z"
  }
  }

### 3. Shipping Methods list Success

- **Status Code**: 200 OK
- **Message**: "Success"
- **Action**:
- **payload**:{
  "success": true,
  "message": "Success",
  "data": [
  {
  "id": "01kr1cx41s08s71tg8gb0bk9ec",
  "name": "Standard Delivery",
  "code": "standard",
  "description": "Regular delivery within 3–7 business days.",
  "is_active": true,
  "sort_order": 1,
  "created_at": "2026-05-07T14:19:12.000000Z",
  "updated_at": "2026-05-07T14:19:12.000000Z"
  },
  {
  "id": "01kr1cx427fqtv6aa896kaem2r",
  "name": "Express Delivery",
  "code": "express",
  "description": "Fast delivery within 1–2 business days.",
  "is_active": true,
  "sort_order": 2,
  "created_at": "2026-05-07T14:19:12.000000Z",
  "updated_at": "2026-05-07T14:19:12.000000Z"
  },
  {
  "id": "01kr1cx4297931f5z8ndn8mfjy",
  "name": "Store Pickup",
  "code": "pickup",
  "description": "Collect your order from our nearest store at no extra cost.",
  "is_active": true,
  "sort_order": 3,
  "created_at": "2026-05-07T14:19:12.000000Z",
  "updated_at": "2026-05-07T14:19:12.000000Z"
  }
  ],
  "meta": {
  "current_page": 1,
  "from": 1,
  "last_page": 1,
  "links": [
  {
  "url": null,
  "label": "&laquo; Previous",
  "page": null,
  "active": false
  },
  {
  "url": "http://127.0.0.1:8000/api/v1/shipping/methods?page=1",
  "label": "1",
  "page": 1,
  "active": true
  },
  {
  "url": null,
  "label": "Next &raquo;",
  "page": null,
  "active": false
  }
  ],
  "path": "http://127.0.0.1:8000/api/v1/shipping/methods",
  "per_page": 15,
  "to": 3,
  "total": 3
  },
  "links": {
  "first": "http://127.0.0.1:8000/api/v1/shipping/methods?page=1",
  "last": "http://127.0.0.1:8000/api/v1/shipping/methods?page=1",
  "prev": null,
  "next": null
  }
  }

### 4. Single Shipping Method by ID Success

- **Status Code**: 200 OK
- **Message**: "Success"
- **Action**:
- **payload**:{
  "success": true,
  "message": "Success",
  "data": {
  "id": "01kr1cx41s08s71tg8gb0bk9ec",
  "name": "Standard Delivery",
  "code": "standard",
  "description": "Regular delivery within 3–7 business days.",
  "is_active": true,
  "sort_order": 1,
  "rates": [
  {
  "id": "01kr1cx564fqx9rx9dz4ved8kx",
  "rate_type": "flat",
  "amount": "1500.00",
  "zone": {
  "id": "01kr1cx4mgk1nwp9q58dhptk14",
  "name": "Lagos"
  }
  },
  {
  "id": "01kr1cx56k7c9s6cmakjqzjnpw",
  "rate_type": "flat",
  "amount": "2000.00",
  "zone": {
  "id": "01kr1cx4mreh0p3vraexf16q1n",
  "name": "Abuja"
  }
  },
  {
  "id": "01kr1cx56xddxmfftjgf6sf09j",
  "rate_type": "flat",
  "amount": "2000.00",
  "zone": {
  "id": "01kr1cx4mwcmhn1a9g1k9tmnqx",
  "name": "Port Harcourt"
  }
  },
  {
  "id": "01kr1cx57401s3er55nbnhb4hv",
  "rate_type": "flat",
  "amount": "2500.00",
  "zone": {
  "id": "01kr1cx4mzwvn0gvb75kk1k3v8",
  "name": "Nationwide"
  }
  }
  ],
  "created_at": "2026-05-07T14:19:12.000000Z",
  "updated_at": "2026-05-07T14:19:12.000000Z"
  }
  }

### 5. Shipping Rates List Success

- **Status Code**: 200 OK
- **Message**: "Success"
- **Action**:
- **payload**:{
  "success": true,
  "message": "Success",
  "data": [
  {
  "id": "01kr1cx564fqx9rx9dz4ved8kx",
  "rate_type": "flat",
  "amount": "1500.00",
  "free_over_amount": "20000.00",
  "min_order_amount": null,
  "max_order_amount": null,
  "estimated_days_min": 2,
  "estimated_days_max": 4,
  "is_active": true,
  "zone": {
  "id": "01kr1cx4mgk1nwp9q58dhptk14",
  "name": "Lagos"
  },
  "method": {
  "id": "01kr1cx41s08s71tg8gb0bk9ec",
  "name": "Standard Delivery",
  "code": "standard"
  },
  "created_at": "2026-05-07T14:19:13.000000Z",
  "updated_at": "2026-05-07T14:19:13.000000Z"
  },
  {
  "id": "01kr1cx56bdsa4f8x5ep4fs5g2",
  "rate_type": "flat",
  "amount": "3000.00",
  "free_over_amount": "50000.00",
  "min_order_amount": null,
  "max_order_amount": null,
  "estimated_days_min": 1,
  "estimated_days_max": 1,
  "is_active": true,
  "zone": {
  "id": "01kr1cx4mgk1nwp9q58dhptk14",
  "name": "Lagos"
  },
  "method": {
  "id": "01kr1cx427fqtv6aa896kaem2r",
  "name": "Express Delivery",
  "code": "express"
  },
  "created_at": "2026-05-07T14:19:13.000000Z",
  "updated_at": "2026-05-07T14:19:13.000000Z"
  },
  {
  "id": "01kr1cx56fyq91cbs4w4kxeyr8",
  "rate_type": "flat",
  "amount": "0.00",
  "free_over_amount": null,
  "min_order_amount": null,
  "max_order_amount": null,
  "estimated_days_min": 1,
  "estimated_days_max": 3,
  "is_active": true,
  "zone": {
  "id": "01kr1cx4mgk1nwp9q58dhptk14",
  "name": "Lagos"
  },
  "method": {
  "id": "01kr1cx4297931f5z8ndn8mfjy",
  "name": "Store Pickup",
  "code": "pickup"
  },
  "created_at": "2026-05-07T14:19:13.000000Z",
  "updated_at": "2026-05-07T14:19:13.000000Z"
  },
  {
  "id": "01kr1cx56k7c9s6cmakjqzjnpw",
  "rate_type": "flat",
  "amount": "2000.00",
  "free_over_amount": "25000.00",
  "min_order_amount": null,
  "max_order_amount": null,
  "estimated_days_min": 3,
  "estimated_days_max": 5,
  "is_active": true,
  "zone": {
  "id": "01kr1cx4mreh0p3vraexf16q1n",
  "name": "Abuja"
  },
  "method": {
  "id": "01kr1cx41s08s71tg8gb0bk9ec",
  "name": "Standard Delivery",
  "code": "standard"
  },
  "created_at": "2026-05-07T14:19:13.000000Z",
  "updated_at": "2026-05-07T14:19:13.000000Z"
  },
  {
  "id": "01kr1cx56qea5517a2rk7ahwgc",
  "rate_type": "flat",
  "amount": "4000.00",
  "free_over_amount": "50000.00",
  "min_order_amount": null,
  "max_order_amount": null,
  "estimated_days_min": 1,
  "estimated_days_max": 2,
  "is_active": true,
  "zone": {
  "id": "01kr1cx4mreh0p3vraexf16q1n",
  "name": "Abuja"
  },
  "method": {
  "id": "01kr1cx427fqtv6aa896kaem2r",
  "name": "Express Delivery",
  "code": "express"
  },
  "created_at": "2026-05-07T14:19:13.000000Z",
  "updated_at": "2026-05-07T14:19:13.000000Z"
  },
  {
  "id": "01kr1cx56tcd80t1qxnpbx89p7",
  "rate_type": "flat",
  "amount": "0.00",
  "free_over_amount": null,
  "min_order_amount": null,
  "max_order_amount": null,
  "estimated_days_min": 1,
  "estimated_days_max": 3,
  "is_active": true,
  "zone": {
  "id": "01kr1cx4mreh0p3vraexf16q1n",
  "name": "Abuja"
  },
  "method": {
  "id": "01kr1cx4297931f5z8ndn8mfjy",
  "name": "Store Pickup",
  "code": "pickup"
  },
  "created_at": "2026-05-07T14:19:13.000000Z",
  "updated_at": "2026-05-07T14:19:13.000000Z"
  },
  {
  "id": "01kr1cx56xddxmfftjgf6sf09j",
  "rate_type": "flat",
  "amount": "2000.00",
  "free_over_amount": "25000.00",
  "min_order_amount": null,
  "max_order_amount": null,
  "estimated_days_min": 3,
  "estimated_days_max": 5,
  "is_active": true,
  "zone": {
  "id": "01kr1cx4mwcmhn1a9g1k9tmnqx",
  "name": "Port Harcourt"
  },
  "method": {
  "id": "01kr1cx41s08s71tg8gb0bk9ec",
  "name": "Standard Delivery",
  "code": "standard"
  },
  "created_at": "2026-05-07T14:19:13.000000Z",
  "updated_at": "2026-05-07T14:19:13.000000Z"
  },
  {
  "id": "01kr1cx570tq2vhbdcwk1nzpng",
  "rate_type": "flat",
  "amount": "4500.00",
  "free_over_amount": "50000.00",
  "min_order_amount": null,
  "max_order_amount": null,
  "estimated_days_min": 1,
  "estimated_days_max": 2,
  "is_active": true,
  "zone": {
  "id": "01kr1cx4mwcmhn1a9g1k9tmnqx",
  "name": "Port Harcourt"
  },
  "method": {
  "id": "01kr1cx427fqtv6aa896kaem2r",
  "name": "Express Delivery",
  "code": "express"
  },
  "created_at": "2026-05-07T14:19:13.000000Z",
  "updated_at": "2026-05-07T14:19:13.000000Z"
  },
  {
  "id": "01kr1cx57401s3er55nbnhb4hv",
  "rate_type": "flat",
  "amount": "2500.00",
  "free_over_amount": "30000.00",
  "min_order_amount": null,
  "max_order_amount": null,
  "estimated_days_min": 5,
  "estimated_days_max": 7,
  "is_active": true,
  "zone": {
  "id": "01kr1cx4mzwvn0gvb75kk1k3v8",
  "name": "Nationwide"
  },
  "method": {
  "id": "01kr1cx41s08s71tg8gb0bk9ec",
  "name": "Standard Delivery",
  "code": "standard"
  },
  "created_at": "2026-05-07T14:19:13.000000Z",
  "updated_at": "2026-05-07T14:19:13.000000Z"
  },
  {
  "id": "01kr1cx577aqm69sscm8r2z3rf",
  "rate_type": "flat",
  "amount": "5000.00",
  "free_over_amount": "50000.00",
  "min_order_amount": null,
  "max_order_amount": null,
  "estimated_days_min": 2,
  "estimated_days_max": 3,
  "is_active": true,
  "zone": {
  "id": "01kr1cx4mzwvn0gvb75kk1k3v8",
  "name": "Nationwide"
  },
  "method": {
  "id": "01kr1cx427fqtv6aa896kaem2r",
  "name": "Express Delivery",
  "code": "express"
  },
  "created_at": "2026-05-07T14:19:13.000000Z",
  "updated_at": "2026-05-07T14:19:13.000000Z"
  }
  ],
  "meta": {
  "current_page": 1,
  "from": 1,
  "last_page": 1,
  "links": [
  {
  "url": null,
  "label": "&laquo; Previous",
  "page": null,
  "active": false
  },
  {
  "url": "http://127.0.0.1:8000/api/v1/shipping/rates?page=1",
  "label": "1",
  "page": 1,
  "active": true
  },
  {
  "url": null,
  "label": "Next &raquo;",
  "page": null,
  "active": false
  }
  ],
  "path": "http://127.0.0.1:8000/api/v1/shipping/rates",
  "per_page": 15,
  "to": 10,
  "total": 10
  },
  "links": {
  "first": "http://127.0.0.1:8000/api/v1/shipping/rates?page=1",
  "last": "http://127.0.0.1:8000/api/v1/shipping/rates?page=1",
  "prev": null,
  "next": null
  }
  }

### 6. Single Shipping Rate By ID

- **Status Code**: 200 OK
- **Message**: "Success"
- **Action**:
- **payload**:{
  "success": true,
  "message": "Success",
  "data": {
  "id": "01kr1cx564fqx9rx9dz4ved8kx",
  "rate_type": "flat",
  "amount": "1500.00",
  "free_over_amount": "20000.00",
  "min_order_amount": null,
  "max_order_amount": null,
  "estimated_days_min": 2,
  "estimated_days_max": 4,
  "is_active": true,
  "zone": {
  "id": "01kr1cx4mgk1nwp9q58dhptk14",
  "name": "Lagos"
  },
  "method": {
  "id": "01kr1cx41s08s71tg8gb0bk9ec",
  "name": "Standard Delivery",
  "code": "standard"
  },
  "created_at": "2026-05-07T14:19:13.000000Z",
  "updated_at": "2026-05-07T14:19:13.000000Z"
  }
  }

### 7. Shipments List Success

- **Status Code**: 200 OK
- **Message**: "Success"
- **Action**:
- **payload**: {
  "success": true,
  "message": "Success",
  "data": [
  {
  "id": "01kr1cx5sngczvvastpfy2z3cs",
  "order_id": "01KR1CX5SJCAR334F0D1JTFMN3",
  "shipping_amount": "1500.00",
  "status": "delivered",
  "tracking_number": "GR-20260001",
  "carrier": "GIG Logistics",
  "shipped_at": "2026-05-02T14:19:14.000000Z",
  "delivered_at": "2026-05-05T14:19:14.000000Z",
  "method": {
  "id": "01kr1cx41s08s71tg8gb0bk9ec",
  "name": "Standard Delivery",
  "code": "standard"
  },
  "zone": {
  "id": "01kr1cx4mgk1nwp9q58dhptk14",
  "name": "Lagos"
  },
  "created_at": "2026-05-07T14:19:14.000000Z",
  "updated_at": "2026-05-07T14:19:14.000000Z"
  },
  {
  "id": "01kr1cx5sysydbb63ezbfzzjkr",
  "order_id": "01KR1CX5SK5764FBB6KHYP5R46",
  "shipping_amount": "4000.00",
  "status": "shipped",
  "tracking_number": "GR-20260002",
  "carrier": "DHL",
  "shipped_at": "2026-05-06T14:19:14.000000Z",
  "delivered_at": null,
  "method": {
  "id": "01kr1cx427fqtv6aa896kaem2r",
  "name": "Express Delivery",
  "code": "express"
  },
  "zone": {
  "id": "01kr1cx4mreh0p3vraexf16q1n",
  "name": "Abuja"
  },
  "created_at": "2026-05-07T14:19:14.000000Z",
  "updated_at": "2026-05-07T14:19:14.000000Z"
  },
  {
  "id": "01kr1cx5t1cka0k99w7d3znmf5",
  "order_id": "01KR1CX5SK5764FBB6KHYP5R47",
  "shipping_amount": "0.00",
  "status": "pending",
  "tracking_number": null,
  "carrier": null,
  "shipped_at": null,
  "delivered_at": null,
  "method": {
  "id": "01kr1cx41s08s71tg8gb0bk9ec",
  "name": "Standard Delivery",
  "code": "standard"
  },
  "zone": {
  "id": "01kr1cx4mgk1nwp9q58dhptk14",
  "name": "Lagos"
  },
  "created_at": "2026-05-07T14:19:14.000000Z",
  "updated_at": "2026-05-07T14:19:14.000000Z"
  }
  ],
  "meta": {
  "current_page": 1,
  "from": 1,
  "last_page": 1,
  "links": [
  {
  "url": null,
  "label": "&laquo; Previous",
  "page": null,
  "active": false
  },
  {
  "url": "http://127.0.0.1:8000/api/v1/shipments?page=1",
  "label": "1",
  "page": 1,
  "active": true
  },
  {
  "url": null,
  "label": "Next &raquo;",
  "page": null,
  "active": false
  }
  ],
  "path": "http://127.0.0.1:8000/api/v1/shipments",
  "per_page": 15,
  "to": 3,
  "total": 3
  },
  "links": {
  "first": "http://127.0.0.1:8000/api/v1/shipments?page=1",
  "last": "http://127.0.0.1:8000/api/v1/shipments?page=1",
  "prev": null,
  "next": null
  }
  }

### 6. Get Single Shipment By ID

- **Status Code**: 200 OK
- **Message**: "Success"
- **Action**:
- **payload**: {
  "success": true,
  "message": "Success",
  "data": {
  "id": "01kr1cx5sysydbb63ezbfzzjkr",
  "order_id": "01KR1CX5SK5764FBB6KHYP5R46",
  "shipping_amount": "4000.00",
  "status": "shipped",
  "tracking_number": "GR-20260002",
  "carrier": "DHL",
  "shipped_at": "2026-05-06T14:19:14.000000Z",
  "delivered_at": null,
  "method": {
  "id": "01kr1cx427fqtv6aa896kaem2r",
  "name": "Express Delivery",
  "code": "express"
  },
  "zone": {
  "id": "01kr1cx4mreh0p3vraexf16q1n",
  "name": "Abuja"
  },
  "created_at": "2026-05-07T14:19:14.000000Z",
  "updated_at": "2026-05-07T14:19:14.000000Z"
  }
  }
