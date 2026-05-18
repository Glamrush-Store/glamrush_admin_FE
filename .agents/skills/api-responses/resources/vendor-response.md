## Response Types

### 1. Vendor List Success

- **Status Code**: 200 OK
- **Message**: "Success"
- **Description**: Pagniated list of Vendors
- **Action**:
- **payload**:{
  "success": true,
  "message": "Success",
  "data": [
  {
  "id": "01kh93brjdt4q6a5dfzgb2p8xn",
  "name": "Dr. Kristin Wiza",
  "business_name": "Kohler, Swift and Turcotte",
  "sort_order": 0,
  "is_active": true,
  "image": null,
  "address_line_1": "67170 Chanel Streets Suite 726",
  "address_line_2": "Apt. 850",
  "city": "Dareland",
  "state": "North Carolina",
  "postal_code": "68164-2887",
  "country": "VN",
  "created_at": "2026-02-12T14:16:29.000000Z",
  "updated_at": "2026-02-12T14:16:29.000000Z"
  }
  ],
  "meta": {
  "current_page": 1,
  "from": 1,
  "last_page": 5,
  "links": [
  {
  "url": null,
  "label": "&laquo; Previous",
  "page": null,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/vendors?page=1",
  "label": "1",
  "page": 1,
  "active": true
  },
  {
  "url": "http://localhost:8000/api/v1/vendors?page=2",
  "label": "2",
  "page": 2,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/vendors?page=3",
  "label": "3",
  "page": 3,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/vendors?page=4",
  "label": "4",
  "page": 4,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/vendors?page=5",
  "label": "5",
  "page": 5,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/vendors?page=2",
  "label": "Next &raquo;",
  "page": 2,
  "active": false
  }
  ],
  "path": "http://localhost:8000/api/v1/vendors",
  "per_page": 1,
  "to": 1,
  "total": 5
  },
  "links": {
  "first": "http://localhost:8000/api/v1/vendors?page=1",
  "last": "http://localhost:8000/api/v1/vendors?page=5",
  "prev": null,
  "next": "http://localhost:8000/api/v1/vendors?page=2"
  }
  }
