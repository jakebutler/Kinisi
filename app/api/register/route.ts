import 'server-only';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseAdmin';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const rateLimiter = new Map<string, { count: number; start: number }>();

function getClientIp(request: Request): string {
  const xf = request.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  const xr = request.headers.get('x-real-ip');
  if (xr) return xr;
  return 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW_MS) {
    rateLimiter.set(ip, { count: 1, start: now });
    return false;
  }
  entry.count += 1;
  rateLimiter.set(ip, entry);
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase admin client is not initialized.' }, { status: 500 });
  }
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }
  try {
    const { email, password, accessCode } = await request.json();

    if (!email || !password || !accessCode) {
      return NextResponse.json({ error: 'Email, password, and access code are required.' }, { status: 400 });
    }

    const expectedAccessCode = process.env.ACCESS_CODE;
    if (!expectedAccessCode) {
      return NextResponse.json({ error: 'Unable to process request.' }, { status: 500 });
    }

    if (accessCode !== expectedAccessCode) {
      return NextResponse.json({ error: 'Invalid access code.' }, { status: 401 });
    }

    // Early email service validation to avoid creating a user when email cannot be sent
    const resendApiKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.EMAIL_FROM;
    if (!resendApiKey || !emailFrom) {
      if (process.env.NODE_ENV !== 'production') {
        const missing: string[] = [];
        if (!resendApiKey) missing.push('RESEND_API_KEY');
        if (!emailFrom) missing.push('EMAIL_FROM');
        console.warn('[register] Missing email configuration:', missing.join(', '));
      }
      return NextResponse.json({ error: 'Email service not configured.' }, { status: 500 });
    }

    const { data: { user }, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // We will send a confirmation email manually
    });

    if (createUserError) {
      const msg = (createUserError as any)?.message?.toLowerCase?.() || '';
      const isConflict = msg.includes('already') || msg.includes('exists') || msg.includes('duplicate');
      return NextResponse.json(
        { error: isConflict ? 'Email already registered.' : 'Unable to create user.' },
        { status: isConflict ? 409 : 400 }
      );
    }
    if(!user) {
        return NextResponse.json({ error: 'Unable to create user.' }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || undefined;
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: email,
        password: password,
        options: {
          redirectTo: siteUrl ? `${siteUrl}/survey` : undefined,
        },
    });

    if (linkError) {
        return NextResponse.json({ error: 'Failed to generate confirmation link.' }, { status: 500 });
    }

    const confirmationLink = linkData?.properties?.action_link;
    if (!confirmationLink) {
      return NextResponse.json({ error: 'Failed to generate confirmation link.' }, { status: 500 });
    }

    const resend = new Resend(resendApiKey);
    try {
      await resend.emails.send({
        from: emailFrom,
        to: email,
        subject: 'Confirm your email address',
        html: `<p>Please confirm your email address by clicking on this link: <a href="${confirmationLink}">Confirm Email</a></p>`,
      });
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[register] Resend send failed');
      }
      // Roll back the created user so the client can retry without hitting a duplicate email conflict
      try { await supabaseAdmin.auth.admin.deleteUser(user.id); } catch {}
      return NextResponse.json({ error: 'Failed to send confirmation email.' }, { status: 500 });
    }


    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to process request.' }, { status: 500 });
  }
}
