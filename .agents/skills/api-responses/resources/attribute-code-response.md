## Response Types

### 1. Attribute List Success

- **Status Code**: 200 OK
- **Message**: "Success"
- **Description**: Pagniated list of Attributes
- **Action**:
- **payload**:{
  "success": true,
  "message": "Success",
  "data": [
  {
  "id": 1,
  "type": "color",
  "value": "Black",
  "code": "BLK",
  "display_type" : "color_swatch",
  "meta" : "{'hex': "#FFFFFF"}"
  "is_active": true,
  "created_at": "2026-02-13T12:02:38.000000Z",
  "updated_at": "2026-02-13T12:02:38.000000Z"
  },
  {
  "id": 2,
  "type": "size",
  "value": "Large",
  "code": "L",
  "display_type" : "size_label",
  "meta" : []
  "is_active": true,
  "created_at": "2026-02-13T12:03:18.000000Z",
  "updated_at": "2026-02-13T12:03:18.000000Z"
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
  "url": "http://127.0.0.1:8000/api/v1/sku-attribute-code?page=1",
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
  "path": "http://127.0.0.1:8000/api/v1/sku-attribute-code",
  "per_page": 15,
  "to": 2,
  "total": 2
  },
  "links": {
  "first": "http://127.0.0.1:8000/api/v1/sku-attribute-code?page=1",
  "last": "http://127.0.0.1:8000/api/v1/sku-attribute-code?page=1",
  "prev": null,
  "next": null
  }
  }

## Response Types

### 1. Attribute types list

- **Status Code**: 200 OK
- **Message**: "Success"
- **Description**: list of Attributes types
- **Action**:
- **payload**:{
  "success": true,
  "message": "Success",
  "data": [
  {
  "value": "coverage",
  "label": "Coverage"
  "display_type" : 'select'
  },
  {
  "value": "skin_type",
  "label": "Skin Type",
  "display_type" : "select"
  },
  {
  "value": "undertone",
  "label": "Undertone"
  "display_type": "select"
  }
  ]
  }
