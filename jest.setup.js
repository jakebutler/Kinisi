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

// Polyfill WHATWG streams needed by LangChain in Node test env
try {
  if (typeof global.ReadableStream === 'undefined') {
    const { ReadableStream, WritableStream, TransformStream } = require('stream/web');
    global.ReadableStream = ReadableStream;
    global.WritableStream = WritableStream;
    global.TransformStream = TransformStream;
  }
} catch {}

// Mock NextResponse and NextRequest for API route testing
jest.mock('next/server', () => {
  class MockNextResponse {
    constructor(body, init) {
      this._body = body;
      this._status = init?.status || 200;
      this._headers = new Headers({
        'Content-Type': 'application/json',
        ...(init?.headers || {})
      });
    }

    static json(body, init) {
      const status = init?.status || 200;
      return {
        status,
        ok: status >= 200 && status < 300,
        headers: new Headers({
          'Content-Type': 'application/json',
          ...(init?.headers || {})
        }),
        json: jest.fn().mockResolvedValue(body),
        text: jest.fn().mockResolvedValue(JSON.stringify(body)),
      };
    }
  }

  class MockNextRequest extends Request {
    constructor(input, init) {
      super(input, init);
      this.nextUrl = new URL(input);
      this.cookies = new Map();
      this.page = {};
      this.ua = '';
      this._init = init || {};
    }

    async json() {
      // If init.body is provided (string), parse it; otherwise fallback to super.text()
      if (this._init && typeof this._init.body === 'string') {
        return JSON.parse(this._init.body);
      }
      const txt = await this.text();
      return txt ? JSON.parse(txt) : {};
    }
  }

  return { NextResponse: MockNextResponse, NextRequest: MockNextRequest };
});

// Block all real network calls in tests
beforeAll(() => {
  // Block fetch
  if (typeof global.fetch === 'undefined') {
    // Define a stub to satisfy libs expecting fetch to exist
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const stub = (..._args) => {
      throw new Error('Unexpected real network call in test: fetch');
    };
    global.fetch = stub;
    try { globalThis.fetch = stub; } catch {}
  } else {
    jest.spyOn(global, 'fetch').mockImplementation(() => {
      throw new Error('Unexpected real network call in test: fetch');
    });
    try { globalThis.fetch = global.fetch; } catch {}
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

// Mock next/navigation (App Router) used by client components
jest.mock('next/navigation', () => {
  const router = {
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  };
  return {
    useRouter: jest.fn(() => router),
    usePathname: jest.fn(() => '/'),
    useSearchParams: jest.fn(() => new URLSearchParams()),
    redirect: jest.fn(),
  };
});

// Mock PromptLayer tracking to no-op while allowing assertions in tests
jest.mock('@/utils/promptlayer', () => {
  const actual = jest.requireActual('@/utils/promptlayer');
  return {
    ...actual,
    trackPromptRun: jest.fn().mockResolvedValue(undefined),
  };
});

// Prevent JSDOM from attempting actual navigation when setting window.location.href/hash in tests
if (typeof window !== 'undefined') {
  try {
    const state = { href: 'http://localhost/' };
    const loc = {
      assign: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
    };
    Object.defineProperty(loc, 'href', {
      get: () => state.href,
      set: (value) => { state.href = value; },
      configurable: true,
    });
    Object.defineProperty(loc, 'hash', {
      get: () => new URL(state.href, 'http://localhost').hash,
      set: (value) => {
        const u = new URL(state.href, 'http://localhost');
        u.hash = value;
        state.href = u.toString();
      },
      configurable: true,
    });
    Object.defineProperty(loc, 'search', {
      get: () => new URL(state.href, 'http://localhost').search,
      configurable: true,
    });
    Object.defineProperty(loc, 'pathname', {
      get: () => new URL(state.href, 'http://localhost').pathname,
      configurable: true,
    });
    Object.defineProperty(loc, 'origin', {
      get: () => new URL(state.href, 'http://localhost').origin,
      configurable: true,
    });
    Object.defineProperty(window, 'location', {
      value: loc,
      configurable: true,
    });
  } catch {
    // ignore if jsdom disallows overriding in this version
  }
}
