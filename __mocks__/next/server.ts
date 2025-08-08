// Passthrough to real next/server to avoid double-mocking.
// NextRequest/NextResponse are mocked in jest.setup.js for tests.
export * from 'next/server';
