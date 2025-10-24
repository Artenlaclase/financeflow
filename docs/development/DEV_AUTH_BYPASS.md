# Dev auth bypass for API testing

In development only (NODE_ENV !== 'production'), server API routes use `getUserIdFromRequest` which:
- Verifies `Authorization: Bearer <Firebase ID Token>` via Firebase Admin.
- If verification fails or is absent, accepts a header `x-dev-uid` and uses its value as the authenticated user id.

This is useful for local testing with tools like curl or PowerShell without signing in. Example:

```
POST /api/bank/exchange-public-token
Headers:
  Content-Type: application/json
  x-dev-uid: dev-test-user
Body:
  {
    "userId": "dev-test-user",
    "linkId": "link_sandbox_123",
    "institutionId": "be_sandbox",
    "accountId": "acc_sandbox_001"
  }
```

Notes:
- The bypass is disabled in production automatically.
- Keep this file as a reminder and remove the bypass if not needed.
