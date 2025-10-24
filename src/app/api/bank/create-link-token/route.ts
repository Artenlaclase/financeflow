import { NextResponse } from 'next/server';
import { createLinkToken } from '@/lib/banking/fintoc';
import { getUserIdFromRequest } from '@/lib/server/auth';

export async function POST(req: Request) {
  try {
    await req.json().catch(() => ({})); // keep for parity; no required body
    const userId = await getUserIdFromRequest(req);

    const { linkToken } = await createLinkToken(userId);
    return NextResponse.json({ linkToken });
  } catch (e: any) {
    console.error('create-link-token error', e);
    const status = e?.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: e?.message || 'Server error' }, { status });
  }
}
