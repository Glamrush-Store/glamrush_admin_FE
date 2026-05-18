## Response Types

### 1. Brand List Success

- **Status Code**: 200 OK
- **Message**: "Success"
- **Description**: Pagniated list of Brands
- **Action**:
- **payload**:{
  "success": true,
  "message": "Success",
  "data": [
  {
  "id": "01KH1KG233JW07W3DCZSXCPDB0",
  "name": "rerum",
  "slug": "rerum-l0",
  "sort_order": 0,
  "is_active": true,
  "image": null,
  "created_at": "2026-02-09T16:24:31.000000Z",
  "updated_at": "2026-02-09T16:24:31.000000Z"
  }
  ],
  "meta": {
  "current_page": 1,
  "from": 1,
  "last_page": 10,
  "links": [
  {
  "url": null,
  "label": "&laquo; Previous",
  "page": null,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/brands?page=1",
  "label": "1",
  "page": 1,
  "active": true
  },
  {
  "url": "http://localhost:8000/api/v1/brands?page=2",
  "label": "2",
  "page": 2,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/brands?page=3",
  "label": "3",
  "page": 3,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/brands?page=4",
  "label": "4",
  "page": 4,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/brands?page=5",
  "label": "5",
  "page": 5,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/brands?page=6",
  "label": "6",
  "page": 6,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/brands?page=7",
  "label": "7",
  "page": 7,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/brands?page=8",
  "label": "8",
  "page": 8,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/brands?page=9",
  "label": "9",
  "page": 9,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/brands?page=10",
  "label": "10",
  "page": 10,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/brands?page=2",
  "label": "Next &raquo;",
  "page": 2,
  "active": false
  }
  ],
  "path": "http://localhost:8000/api/v1/brands",
  "per_page": 1,
  "to": 1,
  "total": 10
  },
  "links": {
  "first": "http://localhost:8000/api/v1/brands?page=1",
  "last": "http://localhost:8000/api/v1/brands?page=10",
  "prev": null,
  "next": "http://localhost:8000/api/v1/brands?page=2"
  }
  }
