import { NextRequest, NextResponse } from 'next/server';

const PROJECT_ID = 'brokerage-504502';
const SITE_KEY = '6LfEX3QtAAAAAG6arHcjbcMh4aFHPw8IF5ZudC5X';
const SCORE_THRESHOLD = 0.5;

export async function POST(req: NextRequest) {
  const { token, action } = await req.json();

  if (!token || !action) {
    return NextResponse.json({ success: false, error: 'Missing token or action' }, { status: 400 });
  }

  const apiKey = process.env.RECAPTCHA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'reCAPTCHA not configured' }, { status: 500 });
  }

  const res = await fetch(
    `https://recaptchaenterprise.googleapis.com/v1/projects/${PROJECT_ID}/assessments?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: {
          token,
          expectedAction: action,
          siteKey: SITE_KEY,
        },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('reCAPTCHA API error:', text);
    return NextResponse.json({ success: false, error: 'Assessment failed', detail: text }, { status: 500 });
  }

  const data = await res.json();
  const valid: boolean = data.tokenProperties?.valid ?? false;
  const score: number = data.riskAnalysis?.score ?? 0;
  const invalidReason: string = data.tokenProperties?.invalidReason ?? '';

  console.log('reCAPTCHA assessment:', { valid, score, invalidReason });

  if (!valid || score < SCORE_THRESHOLD) {
    return NextResponse.json({ success: false, score, invalidReason }, { status: 403 });
  }

  return NextResponse.json({ success: true, score });
}
