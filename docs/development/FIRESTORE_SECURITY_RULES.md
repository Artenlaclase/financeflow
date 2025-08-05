# Firestore Security Rules Documentation

## Overview
This document explains the comprehensive security rules implemented for the FinTracker application. These rules ensure that users can only access their own data and prevent unauthorized access to sensitive financial information.

## Security Principles

### 1. Authentication Required
- All operations require user authentication
- Anonymous access is completely blocked
- Users must have a valid `auth.uid`

### 2. User Isolation
- Each user can only access their own data
- Data is segregated by `userId` field matching `auth.uid`
- Cross-user data access is prevented

### 3. Data Validation
- Input validation for critical fields
- Type checking for monetary amounts
- Required field validation

## Rule Structure

### Helper Functions

```javascript
function isAuthenticated() {
  return request.auth != null && request.auth.uid != null;
}

function isOwner(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}
```

### Collection-Specific Rules

#### User Profiles (`/userProfiles/{userId}`)
- **Access**: User can only access their own profile
- **Operations**: Full CRUD for profile owner
- **Validation**: UserId must match authenticated user

#### Finance Profiles (`/financeProfiles/{userId}`)
- **Access**: User can only access their own finance profile
- **Operations**: Full CRUD for profile owner
- **Validation**: UserId must match authenticated user

#### Transactions (`/transactions/{transactionId}`)
- **Read/Delete**: Only if `resource.data.userId == auth.uid`
- **Create**: Requires valid transaction data with correct userId
- **Update**: Must be owner and maintain data integrity
- **Required Fields**: `userId`, `amount`, `category`, `date`
- **Validation**: 
  - Amount must be number
  - Category must be string
  - Date must be timestamp
  - UserId must match authenticated user

#### Product History (`/productos-historial/{productId}`)
- **Read/Delete**: Only if `resource.data.userId == auth.uid`
- **Create**: Requires valid product data with correct userId
- **Update**: Must be owner and maintain data integrity
- **Required Fields**: `userId`, `nombre`, `precio`, `fecha`
- **Validation**:
  - Price must be number
  - Name must be string
  - Date must be timestamp
  - UserId must match authenticated user

#### Shopping Data (`/compras/{compraId}`)
- **Access**: User-specific with userId validation
- **Operations**: Full CRUD with ownership verification
- **Validation**: UserId must match on create and update

#### Analytics (`/analytics/{userId}`)
- **Access**: Document ID must match authenticated user ID
- **Operations**: Full CRUD for data owner

#### Debts (`/debts/{debtId}`)
- **Access**: User-specific with userId validation
- **Operations**: Full CRUD with ownership verification
- **Validation**: UserId must match on create and update

#### User Collections (`/users/{userId}`)
- **Access**: User can only access their own user document
- **Subcollections**: Inherited security - all nested data follows same rules
- **Operations**: Full CRUD for data owner

## Security Features

### 1. Data Validation
```javascript
function isValidTransaction() {
  return request.resource.data.keys().hasAll(['userId', 'amount', 'category', 'date']) &&
         request.resource.data.userId == request.auth.uid &&
         request.resource.data.amount is number &&
         request.resource.data.category is string &&
         request.resource.data.date is timestamp;
}
```

### 2. Ownership Verification
- Every document requires a `userId` field
- UserId must match the authenticated user's UID
- Prevents data access across users

### 3. Type Safety
- Monetary amounts validated as numbers
- Dates validated as timestamps
- Strings validated for text fields

### 4. Default Deny
```javascript
match /{document=**} {
  allow read, write: if false;
}
```
Any document not explicitly covered by rules is denied access.

## Testing Rules

### Valid Operations
```javascript
// User accessing their own transaction
GET /transactions/trans123 
// WHERE resource.data.userId == auth.uid

// User creating their own transaction
POST /transactions/trans124
// WITH data.userId == auth.uid
```

### Blocked Operations
```javascript
// User trying to access another user's data
GET /transactions/trans125
// WHERE resource.data.userId != auth.uid (DENIED)

// Unauthenticated access
GET /transactions/trans123
// WHERE auth == null (DENIED)
```

## Migration from Previous Rules

### Before (Too Permissive)
```javascript
match /transactions/{transactionId} {
  allow read, write: if request.auth != null;
}
```

### After (Secure)
```javascript
match /transactions/{transactionId} {
  allow read, delete: if isAuthenticated() && 
    resource.data.userId == request.auth.uid;
  allow create: if isAuthenticated() && 
    isValidTransaction();
  allow update: if isAuthenticated() && 
    resource.data.userId == request.auth.uid &&
    isValidTransaction();
}
```

## Best Practices Implemented

1. **Principle of Least Privilege**: Users only get access to what they need
2. **Defense in Depth**: Multiple validation layers
3. **Input Validation**: All user inputs are validated
4. **Type Safety**: Proper data type checking
5. **Explicit Deny**: Default deny rule at the end

## Production Considerations

1. Remove or restrict `test-connection` collection before production
2. Monitor rule performance and optimize if needed
3. Regular security audits of rule changes
4. Test with Firebase Security Rules Playground
5. Implement proper error handling in client code

## Deployment

After updating rules, deploy with:
```bash
firebase deploy --only firestore:rules
```

## Testing

Use Firebase Security Rules Playground to test:
1. Authenticated user accessing own data ✅
2. Authenticated user accessing other user's data ❌
3. Unauthenticated access ❌
4. Invalid data types ❌
5. Missing required fields ❌
