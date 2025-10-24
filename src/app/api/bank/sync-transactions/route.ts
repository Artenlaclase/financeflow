import { NextResponse } from 'next/server';
import { fetchTransactions } from '@/lib/banking/fintoc';
import { decrypt } from '@/lib/crypto';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase/firestore';

function toLocalNoonTimestamp(dateISO: string): Timestamp {
  const d = new Date(dateISO);
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
  return Timestamp.fromDate(local);
}

export async function POST(req: Request) {
  try {
    const authHeader = (req.headers as any).get?.('authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!idToken) return NextResponse.json({ error: 'Missing Authorization Bearer token' }, { status: 401 });
    const decoded = await adminAuth.verifyIdToken(idToken);

    const body = await req.json();
    const { userId, fromISO, toISO, accountId: accountIdOverride } = body as { userId: string; fromISO: string; toISO: string; accountId?: string };
    if (!userId || !fromISO || !toISO) return NextResponse.json({ error: 'Missing userId/fromISO/toISO' }, { status: 400 });
    if (decoded.uid !== userId) return NextResponse.json({ error: 'Token/user mismatch' }, { status: 403 });

  const connRef = adminDb.doc(`users/${userId}/bankConnections/fintoc`);
  const connSnap = await connRef.get();
  if (!connSnap.exists) return NextResponse.json({ error: 'No connection' }, { status: 400 });
  const { accessTokenEnc, accountId: storedAccountId } = connSnap.data() as any;
    const accessToken = decrypt(accessTokenEnc);
  const accountId = accountIdOverride || storedAccountId || null;

  const providerTxs = await fetchTransactions(accessToken, fromISO, toISO);

  const batch = adminDb.batch();
    for (const tx of providerTxs) {
      const amount = tx.amount;
      const type = amount >= 0 ? 'income' : 'expense';
      const amountAbs = Math.abs(amount);
      const date = toLocalNoonTimestamp(tx.date);
      const idempotentId = `${'fintoc'}:${tx.id}`;

      const ref = adminDb.collection('transactions').doc();
      batch.set(ref, {
        provider: 'fintoc',
        providerTxId: tx.id,
        idempotentKey: idempotentId,
        userId,
        type,
        amount: amountAbs,
        description: tx.description || null,
        merchant: tx.merchant || null,
        category: tx.category || null,
        paymentMethod: null,
        date,
        createdAt: new Date(),
        source: 'bank-sync',
      });
    }
    await batch.commit();
    return NextResponse.json({ imported: providerTxs.length });
  } catch (e: any) {
    console.error('sync-transactions error', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
