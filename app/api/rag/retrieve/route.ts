import { NextRequest, NextResponse } from 'next/server';
import { retrieveRagChunksByText, retrieveRagChunksForSurvey } from '@/utils/rag';

// POST /api/rag/retrieve
// Body: { query?: string, surveyResponses?: Record<string, any>, k?: number }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { query, surveyResponses, k = 5 } = body || {};

    if (!query && !surveyResponses) {
      return NextResponse.json({ error: 'Provide `query` or `surveyResponses`' }, { status: 400 });
    }

    const chunks = query ? await retrieveRagChunksByText(query, k) : await retrieveRagChunksForSurvey(surveyResponses, k);

    return NextResponse.json({ chunks });
  } catch (err: unknown) {
    console.error('RAG retrieve error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
