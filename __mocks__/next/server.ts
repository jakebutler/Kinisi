// Manual mock for next/server
export class NextRequest {
  public url: string;
  public init?: any;
  public nextUrl: any;
  public cookies: any;
  public page: any;
  public ua: string;

  constructor(url: string, init?: any) {
    this.url = url;
    this.init = init;
    this.nextUrl = new URL(url);
    this.cookies = new Map();
    this.page = {};
    this.ua = '';
  }

  async json() {
    return this.init?.body ? JSON.parse(this.init.body) : {};
  }
}

export class NextResponse {
  constructor(public body?: any, public init?: any) {}
  
  static json = jest.fn().mockImplementation((body: any, init?: any) => {
    const status = init?.status || 200;
    console.log('🎭 NextResponse.json mock called with:', { body, status });
    const mockResponse = {
      json: jest.fn().mockResolvedValue(body),
      text: jest.fn().mockResolvedValue(JSON.stringify(body)),
      status: status,
      statusText: init?.statusText || 'OK',
      headers: new Headers(init?.headers || {}),
      ok: status >= 200 && status < 300
    };
    console.log('🎭 NextResponse.json mock returning:', mockResponse);
    return mockResponse;
  });

  async json() {
    return this.body;
  }
}

console.log('🎭 NextResponse manual mock loaded');
