import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getUserIdFromRequest } from '@/lib/server/auth';

export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { provider } = body as { provider?: string };
    const prov = provider || 'fintoc';

    const ref = adminDb.doc(`users/${userId}/bankConnections/${prov}`);
    await ref.delete();

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status = e?.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: e?.message || 'Server error' }, { status });
  }
}
