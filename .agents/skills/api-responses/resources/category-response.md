## Response Types

### 1. Category List Success

- **Status Code**: 200 OK
- **Message**: "Success"
- **Description**: paginated list of categories
- **Action**:
- **payload**{
  "success": true,
  "message": "Success",
  "data": [
  {
  "id": "01KH1KG233JW07W3DCZSXCPDB0",
  "name": "rerum",
  "slug": "rerum-l0",
  "parent_id": null,
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
  "url": "http://localhost:8000/api/v1/categories?page=1",
  "label": "1",
  "page": 1,
  "active": true
  },
  {
  "url": "http://localhost:8000/api/v1/categories?page=2",
  "label": "2",
  "page": 2,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/categories?page=3",
  "label": "3",
  "page": 3,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/categories?page=4",
  "label": "4",
  "page": 4,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/categories?page=5",
  "label": "5",
  "page": 5,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/categories?page=6",
  "label": "6",
  "page": 6,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/categories?page=7",
  "label": "7",
  "page": 7,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/categories?page=8",
  "label": "8",
  "page": 8,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/categories?page=9",
  "label": "9",
  "page": 9,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/categories?page=10",
  "label": "10",
  "page": 10,
  "active": false
  },
  {
  "url": "http://localhost:8000/api/v1/categories?page=2",
  "label": "Next &raquo;",
  "page": 2,
  "active": false
  }
  ],
  "path": "http://localhost:8000/api/v1/categories",
  "per_page": 1,
  "to": 1,
  "total": 10
  },
  "links": {
  "first": "http://localhost:8000/api/v1/categories?page=1",
  "last": "http://localhost:8000/api/v1/categories?page=10",
  "prev": null,
  "next": "http://localhost:8000/api/v1/categories?page=2"
  }
  }

### 1. Get Category Success

- **Status Code**: 200 OK
- **Message**: "Success"
- **Description**: Get a single category by id
- **Action**:
- **payload**:{
  "success": true,
  "message": "Success",
  "data": {
  "id": "01KH93BMYR1TKPH7K2D4RVNY9P",
  "name": "placeat",
  "slug": "placeat-zY",
  "parent_id": null,
  "description": "Reprehenderit sed quo vero fugiat ut. Sit consectetur dolores hic nulla consequatur ut nulla et. Ut esse accusamus numquam quis voluptatum. Officia magni culpa nobis.\n\nMolestiae rerum mollitia non ea porro. Fuga consectetur fuga expedita. Optio voluptatibus aperiam dolores culpa ut nisi. Est alias dolore quis alias error quibusdam cumque cupiditate.",
  "meta_title": "placeat",
  "meta_description": "Sed in hic sint. Id ut et sed perferendis officia. Occaecati eveniet quis deserunt animi accusamus et. Aut voluptatem deleniti enim eveniet cum doloribus aut nobis.\n\nQui consequuntur laboriosam laudantium magnam eligendi. Rerum impedit non ullam architecto harum dolorem non. Libero dolorum enim aliquam nihil. Quos reprehenderit ad voluptatibus velit sint.\n\nA sit amet cum omnis incidunt eum. Aut sequi fuga vitae amet est est. A similique necessitatibus tempora et iusto aperiam ex. Enim molestiae et saepe accusamus architecto sint.\n\nQuibusdam neque quia inventore omnis. Sunt et ullam voluptas dolores.",
  "meta_keywords": null,
  "sort_order": 0,
  "is_active": true,
  "image": null,
  "created_at": "2026-02-12T14:16:25.000000Z",
  "updated_at": "2026-02-12T14:16:25.000000Z",
  "deleted_at": null
  }
  }
