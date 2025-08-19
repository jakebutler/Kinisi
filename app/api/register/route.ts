import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseAdmin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
    });

    if (linkError) {
        return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    const confirmationLink = linkData.properties.action_link;

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Confirm your email address',
      html: `<p>Please confirm your email address by clicking on this link: <a href="${confirmationLink}">Confirm Email</a></p>`,
    });


    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to process request.' }, { status: 500 });
  }
}
