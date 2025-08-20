import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseAdmin';
import { Resend } from 'resend';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase admin client is not initialized.' }, { status: 500 });
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

    const { data: { user }, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // We will send a confirmation email manually
    });

    if (createUserError) {
      return NextResponse.json({ error: createUserError.message }, { status: 400 });
    }
    if(!user) {
        return NextResponse.json({ error: 'User not found after creation.' }, { status: 500 });
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: email,
        password: password,
    });

    if (linkError) {
        return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    const confirmationLink = linkData?.properties?.action_link;
    if (!confirmationLink) {
      return NextResponse.json({ error: 'Failed to generate confirmation link.' }, { status: 500 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json({ error: 'Email service not configured.' }, { status: 500 });
    }
    const resend = new Resend(resendApiKey);
    try {
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Confirm your email address',
        html: `<p>Please confirm your email address by clicking on this link: <a href="${confirmationLink}">Confirm Email</a></p>`,
      });
    } catch (e) {
      return NextResponse.json({ error: 'Failed to send confirmation email.' }, { status: 500 });
    }


    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to process request.' }, { status: 500 });
  }
}
