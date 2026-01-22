# Fintracker AI Coding Agent Instructions

## Project Overview
**Fintracker** is a personal finance management web application built with Next.js 14, TypeScript, Material-UI (MUI), Firebase, and Recharts. It provides users with centralized financial tracking through dashboards, analytics, and transaction management.

## Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router) with TypeScript (strict mode)
- **UI**: Material-UI v5 (complete design system)
- **Auth**: Firebase Authentication (email/password)
- **Database**: Firebase Firestore
- **Charts**: Recharts for data visualization
- **Banking Integration**: Fintoc API (Chilean financial data)

### Project Structure
```
src/
├── app/              # Next.js App Router pages (layout-based routing)
├── components/       # React components (features, shared UI)
├── contexts/         # Context API providers (Auth, Finance, UserProfile, FinanceProfile)
├── hooks/            # Custom React hooks (analytics, auth redirect, monthly reset)
├── lib/              # Utilities & Firebase setup
│   ├── firebase/     # Config, auth operations
│   ├── dateUtils.ts  # Safe date handling (critical for Firestore Timestamps)
│   └── banking/      # Fintoc banking integration
└── styles/           # MUI theme configuration
```

### Context Layer Architecture
Providers wrap the entire app in strict hierarchy:
1. **AuthContext** - Manages user authentication state & methods (login, register, logout, resetPassword)
2. **UserProfileContext** - User profile data from Firestore
3. **FinanceProfileContext** - Financial settings & monthly budget state
4. **FinanceProvider** - Real-time Firestore listeners for transactions, maintains `balance`, `income`, `expenses`, `debts`, `recentTransactions`

Access via: `useAuth()`, `useUserProfile()`, `useFinanceProfile()`, `useFinance()`

### Firestore Data Schema
```
users/{userId}/
  - profile (user data)
transactions/  # Denormalized global collection
  - userId, type (income|expense|compra), amount, category, date, description
incomes, expenses, debts, savings/ # Legacy subcollections (being phased out)
compras/ # Supermarket shopping (category-tracked)
```

## Critical Patterns & Conventions

### 1. **Safe Date Handling**
All Firebase Timestamp values must use `safeDate()` utility - it converts Firestore Timestamps, Date objects, strings (YYYY-MM-DD), and numbers to valid JavaScript Dates. **Never assume raw Firebase dates are Date objects**.

### 2. **Client-side Components**
Mark components with `"use client"` at the top. Context consumption requires client rendering. Examples:
- [src/contexts/FinanceContext.tsx](src/contexts/FinanceContext.tsx#L1)
- [src/app/providers.tsx](src/app/providers.tsx#L1)

### 3. **Real-time Listeners Pattern**
Use `onSnapshot()` for live data, not one-time `getDocs()`. The `FinanceProvider` manages listeners and cleanup:
- Query by `where('userId', '==', user.uid)` to isolate user data
- Use `orderBy()` and `limit()` for performance
- Always unsubscribe listeners on unmount to prevent memory leaks

### 4. **Simple Transactional Data**
Use `guardarTransaccionSimple()` [src/lib/firebaseSimple.ts](src/lib/firebaseSimple.ts) for adding transactions. It enforces structure: `{type, category, amount, description, userId, date, createdAt}`.

### 5. **Analytics Hook Pattern**
`useAnalytics()` and `useAnalyticsSimplified()` accept `selectedPeriod` and `selectedYear` props. They fetch and aggregate transactions across users' financial data. Returns `AnalyticsData` interface with monthly rollups, category breakdowns, and totals.

### 6. **Theme & Styling**
- MUI theme centralized at [src/styles/theme.ts](src/styles/theme.ts)
- Component styling: Use `sx` prop for all styling needs
- MUI provides complete design system with responsive breakpoints
- Typography, spacing, colors all managed through MUI theme

### 7. **Type Safety**
- Define interfaces for all Firebase documents (see `Transaction` interface in [src/contexts/FinanceContext.tsx](src/contexts/FinanceContext.tsx#L9-L15))
- Use `@/* path aliases` defined in `tsconfig.json` for imports: `import { useAuth } from '@/contexts/AuthContext'`

## Development Workflow

### Build & Run
```bash
npm install          # Install dependencies
npm run dev          # Start Next.js dev server on port 3000
npm run build        # Production build
npm run lint         # ESLint check
```

### Common Tasks
- **Adding a page**: Create `.tsx` file in `src/app/{route}/page.tsx`
- **Creating a context**: Add to `src/contexts/`, export hook `useName()` and Provider
- **Firestore queries**: Always filter by `userId` for multi-user isolation
- **Date comparisons**: Always convert to `Date` objects first using `safeDate()`

## Key Integration Points

1. **Firebase Auth** → Triggers `AuthContext` state → Enables `useAuth()` hook
2. **Firestore Listeners** → Update `FinanceProvider` state → Components re-render via context
3. **User Settings** → `FinanceProfileContext` stores budget/profile → Used by analytics hooks
4. **Fintoc API** → Bank account connection → Syncs transactions to Firestore
5. **Analytics** → Aggregates `transactions` collection → Renders via Recharts

## Common Gotchas

- **Unresolved Imports**: Use `@/` alias, not relative paths
- **Date Bugs**: Firebase Timestamps are not Date objects—always use `safeDate()`
- **Missing User Context**: Pages must be wrapped by `Providers` (done in layout)
- **Listener Memory Leaks**: Always return unsubscribe function from `useEffect`
- **Firestore Security**: Rules validate `userId` matches auth—cannot query across users

---

*Last updated: January 2026 | Fintracker v0.1.0*
