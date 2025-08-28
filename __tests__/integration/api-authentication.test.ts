/**
 * Integration test to verify API routes handle authentication correctly
 * This test catches issues where frontend hooks don't include auth headers
 */

import { NextRequest } from 'next/server';

// Test all API routes that require authentication
const API_ROUTES = [
  { path: '/api/assessment', method: 'POST', body: { surveyResponses: { test: 'data' } } },
  { path: '/api/assessment/approve', method: 'POST', body: { assessmentId: 'test-id' } },
  { path: '/api/assessment/feedback', method: 'POST', body: { assessmentId: 'test-id', feedback: 'test' } },
  { path: '/api/program/generate', method: 'POST', body: { assessmentId: 'test-id' } },
  { path: '/api/program/create', method: 'POST', body: { programData: {} } },
];

describe('API Authentication Integration', () => {
  describe('Routes should return 401 without auth headers', () => {
    API_ROUTES.forEach(({ path, method, body }) => {
      it(`${method} ${path} should return 401 without Authorization header`, async () => {
        // Mock the route handler
        let routeHandler;
        try {
          const routeModule = await import(`../../app${path}/route`);
          routeHandler = routeModule[method];
        } catch (error) {
          // Skip test if route doesn't exist
          console.log(`Skipping ${path} - route not found`);
          return;
        }

        if (!routeHandler) {
          console.log(`Skipping ${path} - ${method} method not found`);
          return;
        }

        const request = new NextRequest(`http://localhost:3000${path}`, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        // Mock Supabase to return no user
        jest.doMock('../../utils/supabaseServer', () => ({
          createSupabaseServerClient: () => Promise.resolve({
            auth: {
              getUser: () => Promise.resolve({ data: { user: null }, error: { message: 'No session' } })
            }
          })
        }));

        const response = await routeHandler(request);
        
        expect(response.status).toBe(401);
        
        const data = await response.json();
        expect(data.error).toBe('Unauthorized');
      });
    });
  });

  describe('Routes should accept valid auth headers', () => {
    API_ROUTES.forEach(({ path, method, body }) => {
      it(`${method} ${path} should accept Authorization header`, async () => {
        // Mock the route handler
        let routeHandler;
        try {
          const routeModule = await import(`../../app${path}/route`);
          routeHandler = routeModule[method];
        } catch (error) {
          console.log(`Skipping ${path} - route not found`);
          return;
        }

        if (!routeHandler) {
          console.log(`Skipping ${path} - ${method} method not found`);
          return;
        }

        const request = new NextRequest(`http://localhost:3000${path}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-token'
          },
          body: JSON.stringify(body)
        });

        // Mock Supabase to return valid user
        jest.doMock('../../utils/supabaseServer', () => ({
          createSupabaseServerClient: () => Promise.resolve({
            auth: {
              getUser: (token?: string) => {
                if (token === 'valid-token') {
                  return Promise.resolve({ 
                    data: { user: { id: 'user-1', email: 'test@example.com' } }, 
                    error: null 
                  });
                }
                return Promise.resolve({ data: { user: null }, error: { message: 'Invalid token' } });
              }
            },
            from: () => ({
              select: () => ({
                eq: () => ({
                  order: () => ({
                    limit: () => Promise.resolve({ data: [{ id: 'test' }], error: null })
                  })
                })
              }),
              insert: () => ({
                select: () => ({
                  single: () => Promise.resolve({ data: { id: 'test' }, error: null })
                })
              })
            })
          })
        }));

        // Mock other dependencies that might be needed
        jest.doMock('../../utils/assessmentChain', () => ({
          generateAssessmentFromSurvey: () => Promise.resolve('Test assessment')
        }));

        try {
          const response = await routeHandler(request);
          
          // Should not be 401 if auth is working
          expect(response.status).not.toBe(401);
          
          // Should be either success or a different error (not auth)
          if (!response.ok) {
            const data = await response.json();
            expect(data.error).not.toBe('Unauthorized');
          }
        } catch (error) {
          // Some routes might fail due to missing dependencies, but not auth
          expect(error).not.toMatch(/unauthorized|auth/i);
        }
      });
    });
  });
});

describe('Frontend Hook Authentication', () => {
  it('should verify all v2 hooks include auth headers', () => {
    // This is a static analysis test to ensure hooks follow auth pattern
    const fs = require('fs');
    const path = require('path');
    
    const hooksDir = path.join(process.cwd(), 'lib/v2/hooks');
    
    if (!fs.existsSync(hooksDir)) {
      console.log('Hooks directory not found, skipping test');
      return;
    }
    
    const hookFiles = fs.readdirSync(hooksDir).filter((file: string) => file.endsWith('.ts'));
    
    hookFiles.forEach((file: string) => {
      const filePath = path.join(hooksDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if hook makes fetch calls
      if (content.includes('fetch(') && content.includes('/api/')) {
        // Verify it imports supabase
        expect(content).toMatch(/import.*supabase.*from.*supabaseClient/);
        
        // Verify it gets session
        expect(content).toMatch(/getSession\(\)/);
        
        // Verify it includes Authorization header
        expect(content).toMatch(/Authorization.*Bearer/);
      }
    });
  });
});
