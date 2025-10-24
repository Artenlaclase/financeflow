import { NextResponse } from 'next/server';
import { createLinkToken } from '@/lib/banking/fintoc';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const authHeader = (req.headers as any).get?.('authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!idToken) return NextResponse.json({ error: 'Missing Authorization Bearer token' }, { status: 401 });
    const decoded = await adminAuth.verifyIdToken(idToken);
    const userId = decoded.uid;

    const { linkToken } = await createLinkToken(userId);
    return NextResponse.json({ linkToken });
  } catch (e: any) {
    console.error('create-link-token error', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
