import {NextResponse} from 'next/server';
import { Resend } from 'resend';

export async function GET(req) {
    const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const {data} = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'angeldomlu@gmail.com',
        subject: 'Hello',
        html: '<h1>It works!</h1>',
      });
    return NextResponse.json({data}, {status: 200});
  } catch (error) {
    return NextResponse.json({error: error.message}, {status: 500});
  }
}