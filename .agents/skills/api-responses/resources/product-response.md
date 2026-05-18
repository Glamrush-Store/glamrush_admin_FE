## Response Types

### 1. Product List Success

- **Status Code**: 200 OK
- **Message**: "Success"
- **Action**:
- **payload**: {
  "success": true,
  "message": "Success",
  "data": [
  {
  "id": "01KH1KG4F4HW65CGSW3EZRT5X0",
  "name": "facere pariatur consequuntur",
  "slug": "fugiat-inventore-et",
  "type": "variable",
  "status": "draft",
  "price": 9173.95,
  "sale_price": 8175.83,
  "category": {
  "id": "01KH1KG23BCXX1DQ8ZSQM4CRGJ",
  "name": "voluptatum",
  "slug": "voluptatum-hh"
  },
  "brand": {
  "id": "01KH1KG26RRKX0ER6PT0P62TF1",
  "name": "quas sit",
  "slug": "quas-sit-bs"
  },
  "vendor": {
  "id": "01kh1kg3bsjn0530d9dkdnfzfq",
  "business_name": "Cormier Ltd"
  },
  "created_at": "2026-02-09T16:24:34.000000Z",
  "updated_at": "2026-02-09T16:24:34.000000Z"
  }
  ],
  "meta": {
  "current_page": 1,
  "from": 1,
  "last_page": 150,
  "links": [
  {
  "url": null,
  "label": "&laquo; Previous",
  "page": null,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/products?page=1",
  "label": "1",
  "page": 1,
  "active": true
  },
  {
  "url": "http://localhost:8000/api/v1/products?page=2",
  "label": "2",
  "page": 2,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/products?page=3",
  "label": "3",
  "page": 3,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/products?page=4",
  "label": "4",
  "page": 4,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/products?page=5",
  "label": "5",
  "page": 5,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/products?page=6",
  "label": "6",
  "page": 6,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/products?page=7",
  "label": "7",
  "page": 7,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/products?page=8",
  "label": "8",
  "page": 8,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/products?page=9",
  "label": "9",
  "page": 9,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/products?page=10",
  "label": "10",
  "page": 10,
  "active": false
  },
  {
  "url": null,
  "label": "...",
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/products?page=149",
  "label": "149",
  "page": 149,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/products?page=150",
  "label": "150",
  "page": 150,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/products?page=2",
  "label": "Next &raquo;",
  "page": 2,
  "active": false
  }
  ],
  "path": "http://localhost:8000/api/v1/products",
  "per_page": 1,
  "to": 1,
  "total": 150
  },
  "links": {
  "first": "http://localhost:8000/api/v1/products?page=1",
  "last": "http://localhost:8000/api/v1/products?page=150",
  "prev": null,
  "next": "http://localhost:8000/api/v1/products?page=2"
  }
  }

### 2. Get Simple Product by ID Success

- **Status Code**: 200 OK
- **Message**: "Success"
- **Action**:
- **payload**:{
  "success": true,
  "message": "Success",
  "data": {
  "id": "01kha4a10fw7v8m41dwbpcy2v8",
  "images_debug": [],
  "name": "test 4",
  "sku": "O7LA-TES4-993851",
  "sequence": "993851",
  "slug": "test-4",
  "short_description": null,
  "description": null,
  "type": "simple",
  "status": "draft",
  "published_at": "2026-02-12T20:39:52.000000Z",
  "meta": {
  "title": null,
  "keywords": null,
  "description": null
  },
  "images": [
  {
  "id": 3,
  "name": "Stelway_EmbellishedBlackBelliesforwomen_6",
  "url": "https://storage.googleapis.com/glamrush-images-dev/3/Stelway_EmbellishedBlackBelliesforwomen_6.jpg",
  "thumb": "https://storage.googleapis.com/glamrush-images-dev/3/conversions/Stelway_EmbellishedBlackBelliesforwomen_6-thumb.jpg",
  "medium": "https://storage.googleapis.com/glamrush-images-dev/3/conversions/Stelway_EmbellishedBlackBelliesforwomen_6-medium.jpg"
  }
  ],
  "pricing": {
  "price": "5000.00",
  "sale_price": "3000.00",
  "sale_starts_at": "2026-02-04 23:24:00",
  "sale_ends_at": "2026-02-20 23:24:00"
  },
  "inventory": {
  "manage_stock": true,
  "stock_quantity": 6,
  "in_stock": true
  },
  "flags": {
  "is_featured": false,
  "sort_order": 0
  },
  "metrics": {
  "views_count": 0,
  "sales_count": 0
  },
  "category": {
  "id": "01KH9S9VJZZ6ZNKWBG2J5Z4B2K",
  "name": "eum",
  "slug": "eum-La"
  },
  "brand": {
  "id": "01KH9S9VMDKVXCZCY8PVYGPPJF",
  "name": "pariatur eum",
  "code": "O7LA",
  "slug": "pariatur-eum-mh"
  },
  "vendor": {
  "id": "01kh9s9wpx92h59z8tfvgsc64b",
  "name": "Myrtis Hermiston",
  "business_name": "Bailey, Quigley and Feest",
  "code": "6UUHDC4B"
  },
  "variants": [],
  "timestamps": {
  "created_at": "2026-02-12T23:52:15.000000Z",
  "updated_at": "2026-02-12T23:52:15.000000Z"
  }
  }
  }

### 3. Get Variable Product by ID Success

- **Status Code**: 200 OK
- **Message**: "Success"
- **Action**:
- **payload**:{
  "success": true,
  "message": "Success",
  "data": {
  "id": "01khc69c60sfr8eb78kbcz4ysz",
  "images_debug": [],
  "name": "Test Variable Product",
  "sku": "QPCR-TESVARPR-994277",
  "sequence": "994277",
  "slug": "test-variable-product",
  "short_description": null,
  "description": null,
  "type": "variable",
  "status": "published",
  "published_at": "2026-02-13T11:53:36.000000Z",
  "meta": {
  "title": null,
  "keywords": null,
  "description": null
  },
  "images": [],
  "pricing": {
  "price": null,
  "sale_price": null,
  "sale_starts_at": null,
  "sale_ends_at": null
  },
  "inventory": {
  "manage_stock": true,
  "stock_quantity": 0,
  "in_stock": true
  },
  "flags": {
  "is_featured": false,
  "sort_order": 0
  },
  "metrics": {
  "views_count": 0,
  "sales_count": 0
  },
  "category": {
  "id": "01KHBDJYGSB5D8CSSEYDFES7MD",
  "name": "ratione",
  "slug": "ratione-FE"
  },
  "brand": {
  "id": "01KHBDJYNGR4R03B3PHXNR4M1S",
  "name": "excepturi sunt",
  "code": "QPCR",
  "slug": "excepturi-sunt-98"
  },
  "vendor": {
  "id": "01khbdk2nbcmps93q84vf333vy",
  "name": "Cleo Streich PhD",
  "business_name": "Blick Inc",
  "code": "LAXOXN7J"
  },
  "variants": [
  {
  "id": "01khc69c8crz9w51719ngpvz2x",
  "sku": "QPCR-TESVARPR-994277-008-RED",
  "is_default": true,
  "images": [
  {
  "id": 1,
  "name": "1_18",
  "url": "https://storage.googleapis.com/glamrush-images-dev/1/1_18.jpg",
  "thumb": "https://storage.googleapis.com/glamrush-images-dev/1/conversions/1_18-thumb.jpg",
  "medium": "https://storage.googleapis.com/glamrush-images-dev/1/conversions/1_18-medium.jpg"
  },
  {
  "id": 2,
  "name": "aveeno-daily-moisturising-body-wash-500ml_1",
  "url": "https://storage.googleapis.com/glamrush-images-dev/2/aveeno-daily-moisturising-body-wash-500ml_1.jpg",
  "thumb": "https://storage.googleapis.com/glamrush-images-dev/2/conversions/aveeno-daily-moisturising-body-wash-500ml_1-thumb.jpg",
  "medium": "https://storage.googleapis.com/glamrush-images-dev/2/conversions/aveeno-daily-moisturising-body-wash-500ml_1-medium.jpg"
  }
  ],
  "pricing": {
  "price": "5000.00",
  "sale_price": "4000.00",
  "sale_starts_at": "2026-02-10 18:45:00",
  "sale_ends_at": "2026-02-20 18:45:00"
  },
  "inventory": {
  "manage_stock": true,
  "stock_quantity": 20,
  "in_stock": true
  },
  "attributes": [
  {
  "type": "size",
  "value": "8"
  },
  {
  "type": "color",
  "value": "Red"
  }
  ],
  "sort_order": 10,
  "status": "active"
  },
  {
  "id": "01khc69epyjanxtvrn5x1re9f5",
  "sku": "QPCR-TESVARPR-994277-WHT-008",
  "is_default": false,
  "images": [
  {
  "id": 3,
  "name": "OLAY-VC",
  "url": "https://storage.googleapis.com/glamrush-images-dev/3/OLAY-VC.jpg",
  "thumb": "https://storage.googleapis.com/glamrush-images-dev/3/conversions/OLAY-VC-thumb.jpg",
  "medium": "https://storage.googleapis.com/glamrush-images-dev/3/conversions/OLAY-VC-medium.jpg"
  }
  ],
  "pricing": {
  "price": "3000.00",
  "sale_price": "2500.00",
  "sale_starts_at": "2026-02-04 18:47:00",
  "sale_ends_at": "2026-02-27 18:47:00"
  },
  "inventory": {
  "manage_stock": true,
  "stock_quantity": 30,
  "in_stock": true
  },
  "attributes": [
  {
  "type": "color",
  "value": "White"
  },
  {
  "type": "size",
  "value": "8"
  }
  ],
  "sort_order": 11,
  "status": "active"
  }
  ],
  "timestamps": {
  "created_at": "2026-02-13T19:05:19.000000Z",
  "updated_at": "2026-02-13T19:05:19.000000Z"
  }
  }
  }

### 3. Get a single Variant by ID Success

- **Status Code**: 200 OK
- **Message**: "Success"
- **Action**:
- **payload**: {
  "success": true,
  "message": "Success",
  "data": {
  "id": "01khc69c8crz9w51719ngpvz2x",
  "product_id": "01khc69c60sfr8eb78kbcz4ysz",
  "sku": "QPCR-TESVARPR-994277-008-RED",
  "is_default": true,
  "price": "5000.00",
  "sale_price": "4000.00",
  "sale_starts_at": "2026-02-10 18:45:00",
  "sale_ends_at": "2026-02-20 18:45:00",
  "manage_stock": true,
  "stock_quantity": 20,
  "in_stock": true,
  "attributes": [
  {
  "type": "size",
  "value": "8"
  },
  {
  "type": "color",
  "value": "Red"
  }
  ],
  "images": [
  {
  "id": 1,
  "name": "1_18",
  "url": "https://storage.googleapis.com/glamrush-images-dev/1/1_18.jpg",
  "thumb": "https://storage.googleapis.com/glamrush-images-dev/1/conversions/1_18-thumb.jpg",
  "medium": "https://storage.googleapis.com/glamrush-images-dev/1/conversions/1_18-medium.jpg"
  },
  {
  "id": 2,
  "name": "aveeno-daily-moisturising-body-wash-500ml_1",
  "url": "https://storage.googleapis.com/glamrush-images-dev/2/aveeno-daily-moisturising-body-wash-500ml_1.jpg",
  "thumb": "https://storage.googleapis.com/glamrush-images-dev/2/conversions/aveeno-daily-moisturising-body-wash-500ml_1-thumb.jpg",
  "medium": "https://storage.googleapis.com/glamrush-images-dev/2/conversions/aveeno-daily-moisturising-body-wash-500ml_1-medium.jpg"
  }
  ],
  "sort_order": 10,
  "status": "active",
  "created_at": "2026-02-13T19:05:19.000000Z",
  "updated_at": "2026-02-13T19:05:19.000000Z"
  }
  }
