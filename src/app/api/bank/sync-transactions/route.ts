import { NextResponse } from 'next/server';
import { fetchTransactions } from '@/lib/banking/fintoc';
import { decrypt } from '@/lib/crypto';
import { adminDb } from '@/lib/firebase/admin';
import { getUserIdFromRequest } from '@/lib/server/auth';
// Do NOT import client Firestore Timestamp in server routes; use JS Date instead to avoid type mismatch.

function toLocalNoonDate(dateISO: string): Date {
  const d = new Date(dateISO);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, fromISO, toISO, accountId: accountIdOverride } = body as { userId: string; fromISO: string; toISO: string; accountId?: string };
    if (!userId || !fromISO || !toISO) return NextResponse.json({ error: 'Missing userId/fromISO/toISO' }, { status: 400 });
  const authUid = await getUserIdFromRequest(req).catch(() => null);
  if (authUid !== userId) return NextResponse.json({ error: 'Token/user mismatch' }, { status: 403 });

  const connRef = adminDb.doc(`users/${userId}/bankConnections/fintoc`);
  const connSnap = await connRef.get();
  if (!connSnap.exists) return NextResponse.json({ error: 'No connection' }, { status: 400 });
  const { accessTokenEnc, accountId: storedAccountId } = connSnap.data() as any;
    const accessToken = decrypt(accessTokenEnc); // ahora es link_token (link_..._token_...)
  const accountId = accountIdOverride || storedAccountId || null;

  const { txs: providerTxs, debug: providerDebug } = await fetchTransactions(accessToken, fromISO, toISO, accountId);

  const batch = adminDb.batch();
    for (const tx of providerTxs) {
      const amount = tx.amount;
      const type = amount >= 0 ? 'income' : 'expense';
      const amountAbs = Math.abs(amount);
  const date = toLocalNoonDate(tx.date);
  const idempotentId = `${'fintoc'}:${tx.id}`;

      // Use deterministic document id to ensure idempotency across re-syncs
      const ref = adminDb.collection('transactions').doc(idempotentId);
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
      }, { merge: true });
    }
    await batch.commit();

    // Update connection metadata
    const connRefMeta = adminDb.doc(`users/${userId}/bankConnections/fintoc`);
    await connRefMeta.set({
      lastSyncAt: new Date(),
      lastSyncRange: { fromISO, toISO },
    }, { merge: true });

    const forceSandbox = ((process.env.FINTOC_FORCE_SANDBOX || '').toLowerCase() === 'true') || ((process.env.FINTOC_FORCE_SANDBOX || '') === '1');
    const key = process.env.FINTOC_SECRET_KEY || '';
    const keyType = key ? (key.startsWith('sk_test') ? 'test' : 'live') : 'unset';
    const payload: any = { imported: providerTxs.length };
    if (process.env.NODE_ENV !== 'production') {
  const hasLinkToken = typeof accessToken === 'string' && /_token_/.test(accessToken);
  const syntheticToken = typeof accessToken === 'string' && accessToken.startsWith('link_sandbox_token_');
  // Fetch stored mode for better diagnostics
  const conn = (await connRefMeta.get()).data() as any | undefined;
  const modeStored = (conn?.mode === 'sandbox' || conn?.mode === 'live') ? conn.mode : undefined;
  payload.debug = {
    forceSandbox,
    keyType,
    hasLinkToken,
    usedAccountId: accountId,
    sandboxMode: {
      env: forceSandbox,
      key: keyType === 'test',
      synthetic: syntheticToken,
      modeStored,
    },
    providerDebug
  };
    }
    return NextResponse.json(payload);
  } catch (e: any) {
    console.error('sync-transactions error', e);
    const status = e?.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: e?.message || 'Server error' }, { status });
  }
}
