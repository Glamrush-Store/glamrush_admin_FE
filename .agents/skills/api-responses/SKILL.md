---
name: api-responses
description: Use when handling authentication-related responses, such as login success, login failure, password reset requests, and account verification. Defines the standard messages, status codes, and user feedback for various authentication scenarios in the Glamrush Admin panel.
---

--# Authentication Responses

## Overview

This skill defines the standard responses for authentication-related actions in the Glamrush Admin panel. It covers scenarios such as login success, login failure, password reset requests, and account verification. The goal is to provide consistent and clear feedback to users during authentication processes.

## Response Types For Authentication

### 1. Login Success

- **Status Code**: 200 OK
- **Message**: "Login successful. Welcome back!"
- **Action**: Redirect to dashboard
- **payload**: {
  "success": true,
  "message": "OK",
  "data": {
  "access_token": "8|Isoq7oS89yPrup1bsR0673OHOrIRbqKipquDx9QSe0c749ad",
  "token_type": "Bearer"
  },
  "errors": null
  }

### 2. Login Failure

- **Status Code**: 401 Unauthorized
- **Message**: "Login failed. Please check your credentials and try again."
- **Action**: Prompt user to re-enter credentials

### 3. Password Reset Request

- **Status Code**: 200 OK
- **Message**: read message from response
- **payload**: {
  "success": true,
  "message": "Password reset link sent to your email.",
  "data": null,
  "errors": null
  }

### 4. Code Verification

- **Status Code**: 200 OK
- **Message**: "Verification successful. You can now reset your password."
- **payload**: {
  "success": true,
  "message": "OK",
  "data": {
  "reset_token": "9|ODNjGrTSnKV1A1Z6NvphvtDFkB2gmD8qh2cBGJXx79975699"
  },
  "errors": null
  }

### 5. Password Changed Successfully

- **Status Code**: 200 OK
- **Message**: "Password changed successfully. You can now log in with your new password."
- **Action**: Redirect to login page
- **payload**: {
  "success": true,
  "message": "OK",
  "data": null,
  "errors": null
  }

### 6. get user details

- **Status Code**: 200 OK
- **Message**: "User details retrieved successfully."
- **payload**: {
  "success": true,
  "message": "OK",
  "data": {
  "id": 1,
  "name": "Test User",
  "email": "test@example.com",
  "email_verified_at": "2026-02-09T16:24:30.000000Z",
  "created_at": "2026-02-09T16:24:30.000000Z",
  "updated_at": "2026-02-09T16:24:30.000000Z"
  },
  "errors": null
  }

## Response Types For Products

## Additional Resources

- [Product Responses](resources/product-response.md)
- [Category Responses](resources/category-response.md)
- [Brand Responses](resources/brand-response.md)
- [Vendor Responses](resources/vendor-response.md)
- [Sku Attribute Responses](resources/attribute-code-response.md)
- [Shipping Responses](resources/shipping-response.md)
- [Payment Responses](resources/payment-response.md)
