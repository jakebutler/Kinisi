// Jest setup file for global test configuration
require('@testing-library/jest-dom');

// Mock Next.js environment - polyfill TextEncoder/TextDecoder for Node.js
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill global Request and Response for Node.js test environment
if (typeof global.Request === 'undefined') {
  const { Request } = require('node-fetch');
  global.Request = Request;
}
if (typeof global.Response === 'undefined') {
  const { Response } = require('node-fetch');
  global.Response = Response;
}

// Mock NextResponse and NextRequest for API route testing
const createMockResponse = (data, init) => {
  const status = init?.status || 200;
  return {
    status: status,
    headers: new Map(Object.entries({
      'Content-Type': 'application/json',
      ...init?.headers || {}
    })),
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    ok: status >= 200 && status < 300
  };
};

// Create a mock that mimics NextResponse.json() behavior
const NextResponseMock = {
  json: jest.fn(createMockResponse)
};

jest.mock('next/server', () => ({
  NextResponse: NextResponseMock,
  NextRequest: class MockNextRequest extends Request {
    constructor(input, init) {
      super(input, init);
      this.nextUrl = new URL(input);
      this.cookies = new Map();
      this.page = {};
      this.ua = '';
    }
  }
}));

// Block all real network calls in tests
beforeAll(() => {
  // Block fetch
  if (global.fetch) {
    jest.spyOn(global, 'fetch').mockImplementation(() => {
      throw new Error('Unexpected real network call in test: fetch');
    });
  }
  // Block XMLHttpRequest
  if (typeof global.XMLHttpRequest !== 'undefined') {
    jest.spyOn(global, 'XMLHttpRequest').mockImplementation(() => {
      throw new Error('Unexpected real network call in test: XMLHttpRequest');
    });
  }
  // Block axios (if not mocked)
  try {
    const axios = require('axios');
    jest.spyOn(axios, 'post').mockImplementation(() => {
      throw new Error('Unexpected real network call in test: axios.post');
    });
    jest.spyOn(axios, 'get').mockImplementation(() => {
      throw new Error('Unexpected real network call in test: axios.get');
    });
    jest.spyOn(axios, 'request').mockImplementation(() => {
      throw new Error('Unexpected real network call in test: axios.request');
    });
  } catch (e) {
    // axios not available, skip
  }
});

// Ensure manual mocks are always used for key external dependencies
jest.mock('@/utils/llm');
jest.mock('@/utils/programDataHelpers');
jest.mock('@/utils/supabaseClient');

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.PROMPTLAYER_API_KEY = 'test-promptlayer-key';

// Global mocks for Next.js components if needed
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/'
  }))
}));
