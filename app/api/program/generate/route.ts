// Stub for fitness program generation API route
// Will accept user/assessment ID, call LLM, store and return program

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // TODO: Implement program generation logic
  return NextResponse.json({ message: 'Program generation not yet implemented.' }, { status: 501 });
}
