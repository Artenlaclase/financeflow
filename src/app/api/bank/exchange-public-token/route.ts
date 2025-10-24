import { NextResponse } from 'next/server';
import { exchangePublicToken } from '@/lib/banking/fintoc';
import { encrypt } from '@/lib/crypto';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, publicToken, institutionId } = body as { userId: string; publicToken: string; institutionId?: string };
    if (!userId || !publicToken) return NextResponse.json({ error: 'Missing userId or publicToken' }, { status: 400 });

    const { accessToken } = await exchangePublicToken(publicToken);
    const encrypted = encrypt(accessToken);

    const ref = doc(db, 'users', userId, 'bankConnections', 'fintoc');
    await setDoc(ref, {
      provider: 'fintoc',
      institutionId: institutionId || null,
      accessTokenEnc: encrypted,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('exchange-public-token error', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
