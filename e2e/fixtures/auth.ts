import { test as base, expect, Page } from '@playwright/test';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const EXPLICIT_REF = process.env.E2E_SUPABASE_PROJECT_REF || '';

function extractProjectRef(url: string): string {
  try {
    const m = url.match(/^https?:\/\/([^.]+)\./);
    return m?.[1] || 'local';
  } catch {
    return 'local';
  }
}

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const E2E_USER_ID = process.env.E2E_USER_ID || process.env.E2E_USER || 'e2e-user';
    const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL || process.env.E2E_EMAIL || 'e2e@example.com';
    const derivedRef = extractProjectRef(SUPABASE_URL);
    const refs = Array.from(new Set([derivedRef, EXPLICIT_REF, 'local', 'localhost', '127.0.0.1'].filter(Boolean)));
    const baseKeys = refs.map((ref) => `sb-${ref}-auth-token`);
    const keys = baseKeys.flatMap((k) => [k, `${k}.0`]);

    const nowSec = Math.floor(Date.now() / 1000);
    const expIn = 3600;

    // Flattened format expected by supabase-js in localStorage
    const flatSession = {
      access_token: 'e2e-access-token',
      token_type: 'bearer',
      expires_in: expIn,
      expires_at: nowSec + expIn,
      refresh_token: 'e2e-refresh-token',
      provider_token: null,
      user: {
        id: E2E_USER_ID,
        aud: 'authenticated',
        role: 'authenticated',
        email: E2E_USER_EMAIL,
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: {},
        confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    } as any;
    // Nested fallback some versions may read
    const nestedSession = { currentSession: flatSession, expiresAt: nowSec + expIn } as any;

    if (process.env.DEBUG_E2E_AUTH) {
      // Minimal debug log to verify fixture inputs and project URL
      console.log('[auth.fixture] Using', {
        E2E_USER_ID,
        E2E_USER_EMAIL,
        NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL || '(unset)'
      });
    }

    // Seed storage and cookies prior to any app scripts
    await page.addInitScript((args) => {
      const { keys, flatSession, nestedSession, refs } = args as { keys: string[]; flatSession: any; nestedSession: any; refs: string[] };
      try {
        // Seed plausible Supabase keys
        for (const k of keys) {
          localStorage.setItem(k, JSON.stringify(flatSession));
          // Provide a nested variant under a sister key for max compatibility
          localStorage.setItem(`${k}-nested`, JSON.stringify(nestedSession));
        }
        // Legacy keys for any custom checks
        localStorage.setItem('sb-access-token', 'e2e-access-token');
        localStorage.setItem('sb-refresh-token', 'e2e-refresh-token');

        // Also set cookies since @supabase/ssr may use cookie-based storage in the browser
        const cookieVal = encodeURIComponent(JSON.stringify(flatSession));
        const expires = new Date(Date.now() + 60 * 60 * 1000).toUTCString();
        for (const k of keys) {
          document.cookie = `${k}=${cookieVal}; Expires=${expires}; Path=/; SameSite=Lax`;
        }
        // Token cookies used by @supabase/ssr (both generic and namespaced per project ref)
        document.cookie = `sb-access-token=e2e-access-token; Expires=${expires}; Path=/; SameSite=Lax`;
        document.cookie = `sb-refresh-token=e2e-refresh-token; Expires=${expires}; Path=/; SameSite=Lax`;
        for (const ref of refs) {
          document.cookie = `sb-${ref}-access-token=e2e-access-token; Expires=${expires}; Path=/; SameSite=Lax`;
          document.cookie = `sb-${ref}-refresh-token=e2e-refresh-token; Expires=${expires}; Path=/; SameSite=Lax`;
        }
      } catch {}
    }, { keys, flatSession, nestedSession, refs });

    const authBase = (() => {
      try { return new URL(SUPABASE_URL).origin + '/auth/v1'; } catch { return '/auth/v1'; }
    })();
    const restBase = (() => {
      try { return new URL(SUPABASE_URL).origin + '/rest/v1'; } catch { return '/rest/v1'; }
    })();

    // Mock Supabase auth user fetch (absolute and relative)
    await page.route((url) => url.toString().startsWith(authBase + '/user') || /\/auth\/v1\/user/.test(url.toString()), async (route) => {
      if (process.env.DEBUG_E2E_AUTH) console.log('[auth.fixture] intercept auth user:', route.request().url());
      const body = JSON.stringify(flatSession.user);
      await route.fulfill({ status: 200, contentType: 'application/json', body });
    });

    // Mock token refresh if triggered (absolute and relative)
    await page.route((url) => url.toString().startsWith(authBase + '/token') || /\/auth\/v1\/token/.test(url.toString()), async (route) => {
      if (process.env.DEBUG_E2E_AUTH) console.log('[auth.fixture] intercept auth token:', route.request().url());
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    // Intercept survey_responses select to avoid RLS failures with fake JWT during e2e
    await page.route((url) => {
      const s = url.toString();
      return s.startsWith(restBase + '/survey_responses') || /\/rest\/v1\/survey_responses/.test(s);
    }, async (route) => {
      if (process.env.DEBUG_E2E_AUTH) console.log('[auth.fixture] intercept survey_responses:', route.request().url());
      const body = JSON.stringify([
        {
          id: 'e2e-survey-id',
          user_id: E2E_USER_ID,
          response: {
            goal: 'general_fitness',
            experience: 'beginner',
            timeCommitment: { daysPerWeek: 3, minutesPerSession: 45, preferredTimeOfDay: 'morning' },
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);
      await route.fulfill({ status: 200, contentType: 'application/json', body });
    });

    // Intercept assessments to ensure approved=true so dashboard proceeds to program steps
    await page.route((url) => {
      const s = url.toString();
      return s.startsWith(restBase + '/assessments') || /\/rest\/v1\/assessments/.test(s);
    }, async (route) => {
      if (process.env.DEBUG_E2E_AUTH) console.log('[auth.fixture] intercept assessments:', route.request().url());
      const body = JSON.stringify({
        id: 'e2e-assessment-id',
        user_id: E2E_USER_ID,
        survey_response_id: 'e2e-survey-id',
        assessment: 'Assessment content...',
        approved: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      await route.fulfill({ status: 200, contentType: 'application/json', body });
    });

    // Intercept exercise_programs queries (by user_id and by id) and return a single row object
    const title = testInfo.title || '';
    const file = (testInfo as any).file || '';
    const isGenerateSchedulePath = /dashboardGenerateSchedule/i.test(String(file)) || /Generate Schedule path/i.test(title);
    if (process.env.DEBUG_E2E_AUTH) {
      console.log('[auth.fixture] testInfo.title:', title);
      console.log('[auth.fixture] testInfo.file:', String(file));
      console.log('[auth.fixture] isGenerateSchedulePath:', isGenerateSchedulePath);
    }
    const programIdForTest = isGenerateSchedulePath ? 'e2e-prog-unscheduled' : 'e2e-prog-scheduled';
    const baseWeeks = [
      {
        week: 1,
        sessions: [
          { id: 'sess-1', session: 1, goal: 'Upper Body', exercises: [{ exercise_id: 'ex-1' }, { exercise_id: 'ex-2' }] },
          { id: 'sess-2', session: 2, goal: 'Lower Body', exercises: [{ exercise_id: 'ex-3' }] },
        ],
      },
    ];
    // For the scheduled path, add concrete start_at values so ProgramCalendar renders .fc
    const scheduledWeeks = baseWeeks.map((w) => ({
      ...w,
      sessions: w.sessions.map((s, idx) => ({
        ...s,
        start_at: new Date(Date.now() + (idx + 1) * 60 * 60 * 1000).toISOString().slice(0, 16),
        duration_minutes: 60,
      })),
    }));
    const programRow = {
      id: programIdForTest,
      user_id: E2E_USER_ID,
      status: 'approved',
      start_date: new Date().toISOString().slice(0, 10),
      program_json: {
        weeks: isGenerateSchedulePath ? baseWeeks : scheduledWeeks,
      },
      last_scheduled_at: isGenerateSchedulePath ? null : new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any;
    await page.route((url) => {
      const s = url.toString();
      return s.startsWith(restBase + '/exercise_programs') || /\/rest\/v1\/exercise_programs/.test(s);
    }, async (route) => {
      if (process.env.DEBUG_E2E_AUTH) console.log('[auth.fixture] intercept exercise_programs:', route.request().url());
      const s = route.request().url();
      // If querying by user_id (latest program), return single object
      if (/user_id=eq\./.test(s)) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(programRow) });
        return;
      }
      // If querying by id, also return single object
      if (/id=eq\./.test(s)) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(programRow) });
        return;
      }
      // Default: return array with single row
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([programRow]) });
    });

    // Intercept sessions for the program
    await page.route((url) => {
      const s = url.toString();
      return s.startsWith(restBase + '/sessions') || /\/rest\/v1\/sessions/.test(s);
    }, async (route) => {
      if (process.env.DEBUG_E2E_AUTH) console.log('[auth.fixture] intercept sessions:', route.request().url());
      const body = JSON.stringify([
        { id: 'sess-1', program_id: programIdForTest, day_index: 1, title: 'Upper Body' },
        { id: 'sess-2', program_id: programIdForTest, day_index: 3, title: 'Lower Body' },
      ]);
      await route.fulfill({ status: 200, contentType: 'application/json', body });
    });

    // Intercept session_exercises for the sessions
    await page.route((url) => {
      const s = url.toString();
      return s.startsWith(restBase + '/session_exercises') || /\/rest\/v1\/session_exercises/.test(s);
    }, async (route) => {
      if (process.env.DEBUG_E2E_AUTH) console.log('[auth.fixture] intercept session_exercises:', route.request().url());
      const body = JSON.stringify([
        { id: 'se-1', session_id: 'sess-1', exercise_id: 'ex-1', order: 1 },
        { id: 'se-2', session_id: 'sess-1', exercise_id: 'ex-2', order: 2 },
        { id: 'se-3', session_id: 'sess-2', exercise_id: 'ex-3', order: 1 },
      ]);
      await route.fulfill({ status: 200, contentType: 'application/json', body });
    });

    // Intercept exercises lookup used by ProgramSection preview
    await page.route((url) => {
      const s = url.toString();
      return s.startsWith(restBase + '/exercises') || /\/rest\/v1\/exercises/.test(s);
    }, async (route) => {
      if (process.env.DEBUG_E2E_AUTH) console.log('[auth.fixture] intercept exercises:', route.request().url());
      const body = JSON.stringify([
        { exercise_id: 'ex-1', name: 'Push Up', target_muscles: ['chest'], equipments: [] },
        { exercise_id: 'ex-2', name: 'Pull Up', target_muscles: ['back'], equipments: [] },
        { exercise_id: 'ex-3', name: 'Squat', target_muscles: ['legs'], equipments: [] },
      ]);
      await route.fulfill({ status: 200, contentType: 'application/json', body });
    });

    // Mock Next.js API routes used on dashboard
    await page.route((url) => /\/api\/program\/create$/.test(new URL(url.toString(), 'http://localhost').pathname), async (route) => {
      if (process.env.DEBUG_E2E_AUTH) console.log('[auth.fixture] intercept api create:', route.request().url());
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(programRow) });
    });
    await page.route((url) => /\/api\/program\/.+\/schedule$/.test(new URL(url.toString(), 'http://localhost').pathname), async (route) => {
      if (process.env.DEBUG_E2E_AUTH) console.log('[auth.fixture] intercept api schedule:', route.request().url());
      const scheduled = {
        ...programRow,
        last_scheduled_at: new Date().toISOString(),
        program_json: {
          weeks: scheduledWeeks,
        },
      };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(scheduled) });
    });

    await use(page);
  },
});

export async function waitForAuthReady(page: Page, opts: { timeoutMs?: number } = {}) {
  const timeout = opts.timeoutMs ?? 7000;

  // Ensure both legacy keys and a primary sb-*-auth-token are present
  await page.waitForFunction(() => {
    try {
      const hasLegacy = !!localStorage.getItem('sb-access-token') && !!localStorage.getItem('sb-refresh-token');
      const hasPrimary = Object.keys(localStorage).some((k) => /^sb-.*-auth-token$/.test(k) && !!localStorage.getItem(k));
      return hasLegacy && hasPrimary;
    } catch { return false; }
  }, {}, { timeout });

  // Ensure the auth user endpoint has succeeded at least once
  await page.waitForResponse((r) => r.url().includes('/auth/v1/user') && r.status() === 200, { timeout }).catch(() => {});

  // Small buffer for app state propagation
  await page.waitForTimeout(150);
}

export { expect } from '@playwright/test';
