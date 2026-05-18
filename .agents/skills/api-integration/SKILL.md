---
name: api-integration
description: Use when making API calls, integrating endpoints, or working with backend data. Covers response handling, pagination, validation errors, and the useApi composable pattern.
---

# API Integration Skill

- Always refer to /docs/api-docs.json
- Use useApi composable
- Handle pagination via meta
- Handle 422 validation errors
- Never assume response shape
- Use try/catch for error handling
- Use async/await for API calls
- { success, message, data, errors } always expect this shape in response, data has the actual payload, errors has validation errors if any, message has success or error message, success is boolean
