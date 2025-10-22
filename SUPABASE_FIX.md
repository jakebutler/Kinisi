# Supabase Build and Test Fix

This document describes the fix for Supabase-related build and test failures in the Kinisi project.

## Problem

The build-and-test job was failing for dependency update PRs with the following error:
```
Error: @supabase/ssr: Your project's URL and API key are required to create a Supabase client!
Check your Supabase project's API settings to find these values
```

Additionally, tests were failing with errors like:
- `supabase.from(...).select(...).eq(...).eq is not a function`
- `supabase.from(...).select(...).eq(...).order(...).limit(...).maybeSingle is not a function`
- `supabaseClient_1.supabase.auth.getUser is not a function`

## Solution

### 1. Environment Variable Configuration

Added proper error handling in Supabase client initialization:

```typescript
// utils/supabaseClient.ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
```

### 2. GitHub Actions Configuration

Updated the CI workflow to include environment variables for both tests and build:

```yaml
- name: Run tests
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
  run: pnpm test

- name: Build
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
  run: pnpm build
```

### 3. Test Environment Setup

Updated jest.setup.js to include:
- Mock environment variables for tests
- Mock Next.js cookies API for server-side tests

```javascript
// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Mock Next.js cookies API for server-side tests
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => ({ value: 'test-cookie-value' })),
    set: jest.fn(),
    remove: jest.fn(),
  })),
}));
```

### 4. Supabase Mocks

Created comprehensive mocks for Supabase clients:
- `__mocks__/utils/supabaseClient.ts` - Client-side Supabase mock
- `__mocks__/utils/supabaseServer.ts` - Server-side Supabase mock
- `__mocks__/supabase-ssr.js` - @supabase/ssr package mock

Updated jest.config.cjs to include the new mocks:
```javascript
moduleNameMapper: {
  '^@/utils/supabaseClient$': '<rootDir>/__mocks__/utils/supabaseClient.ts',
  '^@/utils/supabaseServer$': '<rootDir>/__mocks__/utils/supabaseServer.ts',
  // ... other mappings
}
```

### 5. Environment Variables Documentation

Created `.env.example` to document required environment variables:
```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# PromptLayer API Key
PROMPTLAYER_API_KEY=your-promptlayer-key
```

## Required Actions

1. **Add GitHub Secrets**: Ensure the following secrets are added to the GitHub repository:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Local Development**: Add the environment variables to your local `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

## Verification

1. Tests should pass: `pnpm test`
2. Build should succeed: `pnpm build`
3. CI/CD pipeline should pass for dependency update PRs

## Files Modified

- `utils/supabaseClient.ts` - Added error handling for missing environment variables
- `utils/supabaseServer.ts` - Added error handling for missing environment variables
- `.github/workflows/ci.yml` - Added environment variables to test and build steps
- `jest.setup.js` - Added environment variable mocks and Next.js cookies mock
- `jest.config.cjs` - Added module mappings for Supabase mocks
- `__mocks__/utils/supabaseClient.ts` - Created comprehensive client-side mock
- `__mocks__/utils/supabaseServer.ts` - Created comprehensive server-side mock
- `__mocks__/supabase-ssr.js` - Updated @supabase/ssr package mock
- `.env.example` - Created to document required environment variables
- `SUPABASE_FIX.md` - This documentation file