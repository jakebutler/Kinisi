import { NextResponse } from 'next/server';
import { createBetaRequest, findBetaRequestByEmail } from '@/utils/betaRequests';
import { supabaseAdmin } from '@/utils/supabaseAdmin';

function isValidEmail(email: string) {
  // Simple RFC5322-like check sufficient for server-side validation
  return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, name, referral_source } = body || {};

    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }

    // Ensure server is configured with admin Supabase client; avoid falling back to public client
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server misconfiguration: beta signup is temporarily unavailable.' },
        { status: 500 }
      );
    }

    // Idempotent: if already exists, return success 200 to avoid leaking membership details
    const existing = await findBetaRequestByEmail(email, supabaseAdmin);
    if (existing) {
      return NextResponse.json(
        { success: true, message: 'This email is already on the beta list.' },
        { status: 200 }
      );
    }

    const created = await createBetaRequest({ email, name, referral_source }, supabaseAdmin);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    // Generic error to avoid leaking details
    return NextResponse.json({ error: 'Unable to process request at this time.' }, { status: 500 });
  }
}
