import 'server-only';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseAdmin';
import { Resend } from 'resend';
import { withErrorHandling, ApiErrors } from '@/utils/api/errorHandler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

export const POST = withErrorHandling(async (request: Request) => {
  if (!supabaseAdmin) {
    throw ApiErrors.serverError('Supabase admin client is not initialized.');
  }
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    throw ApiErrors.serviceUnavailable('Too many requests. Please try again later.');
  }

  const { email, password, accessCode } = await request.json();

  if (!email || !password || !accessCode) {
    throw ApiErrors.validation('Email, password, and access code are required.');
  }

  const expectedAccessCode = process.env.ACCESS_CODE;
  if (!expectedAccessCode) {
    throw ApiErrors.serverError('Unable to process request.');
  }

  if (accessCode !== expectedAccessCode) {
    throw ApiErrors.unauthorized('Invalid access code.');
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
    throw ApiErrors.serverError('Email service not configured.');
  }

  let user;
  let createUserError;

  try {
    const result = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // We will send a confirmation email manually
    });
    user = result.data.user;
    createUserError = result.error;
  } catch (fetchError) {
    console.error('[register] Supabase connection error:', fetchError);
    // In development, if Supabase is unreachable, provide a mock success response
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[register] Development mode: Bypassing Supabase due to connection error');
      // Create a mock user object for development
      user = {
        id: `dev-user-${Date.now()}`,
        email: email,
        aud: 'authenticated',
        role: 'authenticated',
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: {},
        confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      createUserError = null;
    } else {
      throw ApiErrors.serverError('Unable to create user.');
    }
  }

  if (createUserError) {
    let rawMsg = '';
    if (
      createUserError &&
      typeof (createUserError as { message?: unknown }).message === 'string'
    ) {
      rawMsg = ((createUserError as { message: string }).message).toLowerCase();
    }
    const isConflict = rawMsg.includes('already') || rawMsg.includes('exists') || rawMsg.includes('duplicate');
    throw isConflict
      ? ApiErrors.unprocessableEntity('Email already registered.')
      : ApiErrors.validation('Unable to create user.');
  }
  if(!user) {
      throw ApiErrors.serverError('Unable to create user.');
  }

  // In development mode with Supabase bypass, skip confirmation link generation and email sending
  if (process.env.NODE_ENV !== 'production' && user.id.startsWith('dev-user-')) {
    console.warn('[register] Development mode: Skipping email confirmation for mock user');
    // Return success with redirect for development
    return NextResponse.json({
      success: true,
      redirectTo: '/survey',
      developmentMode: true
    }, { status: 200 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || undefined;
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email,
      password: password,
      options: {
        redirectTo: siteUrl ? `${siteUrl}/auth/callback?next=/survey` : undefined,
      },
  });

  if (linkError) {
      throw ApiErrors.serverError('Failed to generate confirmation link.');
  }

  const confirmationLink = linkData?.properties?.action_link;
  if (!confirmationLink) {
      throw ApiErrors.serverError('Failed to generate confirmation link.');
  }

  const resend = new Resend(resendApiKey);
  try {
    await resend.emails.send({
      from: emailFrom,
      to: email,
      subject: 'Confirm your email address',
      html: `<p>Please confirm your email address by clicking on this link: <a href="${confirmationLink}">Confirm Email</a></p>`,
    });
  } catch {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[register] Resend send failed');
    }
    // Roll back the created user so the client can retry without hitting a duplicate email conflict
    try { await supabaseAdmin.auth.admin.deleteUser(user.id); } catch {}
    throw ApiErrors.serverError('Failed to send confirmation email.');
  }

  return NextResponse.json({ success: true }, { status: 200 });
});