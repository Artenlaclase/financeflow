import { NextResponse } from 'next/server';
import { exchangePublicToken } from '@/lib/banking/fintoc';
import { encrypt } from '@/lib/crypto';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  try {
  const authHeader = (req.headers as any).get?.('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!idToken) return NextResponse.json({ error: 'Missing Authorization Bearer token' }, { status: 401 });
  const decoded = await adminAuth.verifyIdToken(idToken);

  const body = await req.json();
  const { userId, publicToken, linkId, institutionId, accountId } = body as { userId: string; publicToken?: string; linkId?: string; institutionId?: string; accountId?: string };
  if (!userId || (!publicToken && !linkId)) return NextResponse.json({ error: 'Missing userId and token/linkId' }, { status: 400 });
  if (decoded.uid !== userId) return NextResponse.json({ error: 'Token/user mismatch' }, { status: 403 });

    let tokenToStore: string;
    if (typeof linkId === 'string' && linkId.startsWith('link_')) {
      // Aceptar directamente el link_id de Fintoc como credencial de acceso
      tokenToStore = linkId;
    } else if (typeof publicToken === 'string') {
      const { accessToken } = await exchangePublicToken(publicToken);
      tokenToStore = accessToken;
    } else {
      return NextResponse.json({ error: 'Invalid token or linkId' }, { status: 400 });
    }

    const encrypted = encrypt(tokenToStore);

    const ref = adminDb.doc(`users/${userId}/bankConnections/fintoc`);
    await ref.set({
      provider: 'fintoc',
      institutionId: institutionId || null,
      accessTokenEnc: encrypted,
      accountId: accountId && accountId.startsWith('acc_') ? accountId : null,
      updatedAt: new Date(),
      createdAt: new Date(),
    }, { merge: true });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('exchange-public-token error', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
