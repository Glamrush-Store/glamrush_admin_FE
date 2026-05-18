## Response Types

### 1. Get payment methods Success Success

- **Status Code**: 200 OK
- **Message**: "Success"
- **Action**:
- **payload**:{
  "success": true,
  "message": "Success",
  "data": [
  {
  "id": "01kr9yej8d846aw2z0mhvt4ejd",
  "name": "Paystack",
  "code": "paystack",
  "description": "Card, bank transfer, USSD and other Paystack-supported channels.",
  "public_config": {
  "channels": [
  "card",
  "bank",
  "ussd",
  "transfer"
  ]
  }
  },
  {
  "id": "01kr9yej8q6k123vanq2gsj9jx",
  "name": "Flutterwave",
  "code": "flutterwave",
  "description": "Card, bank transfer and other Flutterwave-supported channels.",
  "public_config": {
  "channels": [
  "card",
  "bank_transfer"
  ]
  }
  }
  ],
  "meta": null,
  "links": null
  }
