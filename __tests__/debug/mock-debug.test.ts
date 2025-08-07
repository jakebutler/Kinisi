import { jest } from '@jest/globals';

describe('Mock Debug', () => {
  it('should show mock state', async () => {
    console.log('🔍 Before mocking:');
    
    // Try to import and see what happens
    let NextResponse1;
    try {
      const module1 = await import('next/server');
      NextResponse1 = module1.NextResponse;
      console.log('🔍 NextResponse type:', typeof NextResponse1);
      console.log('🔍 NextResponse.json type:', typeof NextResponse1.json);
      console.log('🔍 NextResponse.json:', NextResponse1.json);
    } catch (e) {
      console.log('🔍 Error importing:', e);
    }

    // Mock it
    jest.doMock('next/server', () => ({
      NextResponse: {
        json: jest.fn().mockReturnValue({ mocked: true })
      }
    }));

    console.log('🔍 After mocking:');
    
    // Clear module cache and re-import
    jest.resetModules();
    const module2 = await import('next/server');
    const NextResponse2 = module2.NextResponse;
    
    console.log('🔍 Mocked NextResponse type:', typeof NextResponse2);
    console.log('🔍 Mocked NextResponse.json type:', typeof NextResponse2.json);
    console.log('🔍 Is jest mock?', jest.isMockFunction(NextResponse2.json));

    // Test the mock
    const result = NextResponse2.json({ test: 'data' });
    console.log('🔍 Mock result:', result);
  });

  it('should test manual mock loading', async () => {
    console.log('🔍 Testing manual mock loading...');
    
    // Clear everything first
    jest.resetModules();
    
    // Mock at the top level
    jest.mock('next/server');
    
    // Import after mocking
    const module = await import('next/server');
    console.log('🔍 Manual mock NextResponse:', module.NextResponse);
    console.log('🔍 Manual mock NextResponse.json:', module.NextResponse.json);
    console.log('🔍 Is manual mock a jest function?', jest.isMockFunction(module.NextResponse.json));
    
    if (module.NextResponse.json) {
      const testResult = module.NextResponse.json({ test: 'manual mock' }, { status: 200 });
      console.log('🔍 Manual mock test result:', testResult);
    }
  });
});
