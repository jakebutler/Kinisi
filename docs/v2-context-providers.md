# V2 Context Provider Requirements

## Provider Hierarchy

The v2 components require specific context providers to be available. Here's the required hierarchy:

```
UserProvider (outermost)
└── UIProvider  
    └── OnboardingProvider (onboarding routes only)
        └── Components using contexts
```

## Required Providers by Route Group

### Onboarding Routes (`app/(onboarding)/`)
- **UserProvider**: Required for user authentication state
- **UIProvider**: Required for loading states, notifications, errors
- **OnboardingProvider**: Required for survey/assessment/program state

### Dashboard Routes (`app/(dashboard)/`)
- **UserProvider**: Required for user authentication state
- **UIProvider**: Optional (if components use useUI hook)

## Context Hook Dependencies

| Hook | Provider Required | Used By |
|------|------------------|---------|
| `useUser()` | UserProvider | All layouts, ProtectedRoute |
| `useUI()` | UIProvider | Survey, Assessment, Program pages |
| `useOnboarding()` | OnboardingProvider | Onboarding flow components |

## Layout Implementation Pattern

```tsx
// Correct pattern for layouts using context hooks
'use client';

import { UserProvider, useUser } from '@/lib/v2/contexts/UserContext';

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useUser(); // Hook usage inside provider
  
  return (
    <div>
      {/* Layout content */}
      {children}
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <LayoutInner>
        {children}
      </LayoutInner>
    </UserProvider>
  );
}
```

## Testing Context Providers

Run the integration test to verify provider setup:

```bash
npm test -- __tests__/integration/context-providers.test.tsx
```

This test verifies:
- All layouts provide required contexts
- Context hooks throw appropriate errors when providers are missing
- Provider hierarchy works correctly

## Common Issues

1. **"useUser must be used within a UserProvider"**
   - Add UserProvider wrapper to the layout
   - Ensure hook is called inside provider component tree

2. **"useUI must be used within a UIProvider"**
   - Add UIProvider to layout or component tree
   - Check if component actually needs UI context

3. **Provider order matters**
   - UserProvider should be outermost
   - UIProvider before OnboardingProvider
   - Components using hooks must be children of providers
