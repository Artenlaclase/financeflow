import { NextResponse } from 'next/server';
import { fetchTransactions } from '@/lib/banking/fintoc';
import { decrypt } from '@/lib/crypto';
import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

function toLocalNoonTimestamp(dateISO: string): Timestamp {
  const d = new Date(dateISO);
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
  return Timestamp.fromDate(local);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, fromISO, toISO } = body as { userId: string; fromISO: string; toISO: string };
    if (!userId || !fromISO || !toISO) return NextResponse.json({ error: 'Missing userId/fromISO/toISO' }, { status: 400 });

    const connRef = doc(db, 'users', userId, 'bankConnections', 'fintoc');
    const connSnap = await getDoc(connRef);
    if (!connSnap.exists()) return NextResponse.json({ error: 'No connection' }, { status: 400 });
    const { accessTokenEnc } = connSnap.data() as any;
    const accessToken = decrypt(accessTokenEnc);

    const providerTxs = await fetchTransactions(accessToken, fromISO, toISO);

    const batchWrites: Promise<any>[] = [];
    for (const tx of providerTxs) {
      const amount = tx.amount;
      const type = amount >= 0 ? 'income' : 'expense';
      const amountAbs = Math.abs(amount);
      const date = toLocalNoonTimestamp(tx.date);
      const idempotentId = `${'fintoc'}:${tx.id}`;

      const ref = doc(collection(db, 'transactions'));
      batchWrites.push(setDoc(ref, {
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
        createdAt: Timestamp.now(),
        source: 'bank-sync',
      }, { merge: true }));
    }

    await Promise.all(batchWrites);
    return NextResponse.json({ imported: providerTxs.length });
  } catch (e: any) {
    console.error('sync-transactions error', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
