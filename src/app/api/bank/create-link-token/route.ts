import { NextResponse } from 'next/server';
import { createLinkToken } from '@/lib/banking/fintoc';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    // TODO: replace with Firebase ID token verification; for now accept userId from body
    const userId = body.userId as string;
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const { linkToken } = await createLinkToken(userId);
    return NextResponse.json({ linkToken });
  } catch (e: any) {
    console.error('create-link-token error', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
