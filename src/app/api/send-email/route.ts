import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export async function POST(request: Request) {
  try {
    const { to, subject, html, attachments } = await request.json();

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not set. Email will not be sent.");
      return NextResponse.json({ success: true, message: "Mocked email sent (No API Key)" });
    }

    const data = await resend.emails.send({
      from: 'Casa Criativa <sistema@casacriativa.app>', // Substitua por um domínio validado no Resend
      to,
      subject,
      html,
      attachments,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ success: false, error: 'Falha ao enviar e-mail' }, { status: 500 });
  }
}
