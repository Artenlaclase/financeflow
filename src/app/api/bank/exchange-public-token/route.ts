import { NextResponse } from 'next/server';
import { exchangePublicToken } from '@/lib/banking/fintoc';
import { encrypt } from '@/lib/crypto';
import { adminDb } from '@/lib/firebase/admin';
import { getUserIdFromRequest } from '@/lib/server/auth';

export async function POST(req: Request) {
  try {
  const body = await req.json();
    const { userId, publicToken, linkId, linkToken, exchangeToken, institutionId, accountId } = body as { userId: string; publicToken?: string; linkId?: string; linkToken?: string; exchangeToken?: string; institutionId?: string; accountId?: string };
    if (!userId || (!publicToken && !linkId && !linkToken && !exchangeToken)) return NextResponse.json({ error: 'Missing userId and token' }, { status: 400 });
  const authUid = await getUserIdFromRequest(req).catch(() => null);
  if (authUid !== userId) return NextResponse.json({ error: 'Token/user mismatch' }, { status: 403 });

  let tokenToStore: string;
  let mode: 'live' | 'sandbox' = 'live';
    // 1) Direct link_token (preferido en live)
    if (typeof linkToken === 'string' && /^link_[A-Za-z0-9]+_token_[A-Za-z0-9]+$/.test(linkToken.trim())) {
      tokenToStore = linkToken.trim();
    // 2) exchange_token -> llamar a /v1/links/exchange
    } else if (typeof exchangeToken === 'string') {
      const base = process.env.FINTOC_BASE_URL || 'https://api.fintoc.com/v1';
      const sk = process.env.FINTOC_SECRET_KEY;
      if (!sk) throw new Error('Missing FINTOC_SECRET_KEY');
      const params = new URLSearchParams({ exchange_token: exchangeToken.trim() });
      const resp = await fetch(`${base}/links/exchange?${params.toString()}`, {
        headers: { Authorization: `Bearer ${sk}` },
      });
      if (!resp.ok) {
        const detail = await resp.text().catch(() => '');
        return NextResponse.json({ error: `EXCHANGE_FAILED (${resp.status}) ${detail}` }, { status: 400 });
      }
      const linkData = await resp.json();
      const lt = linkData?.link_token || linkData?.linkToken || linkData?.token;
      if (!lt || !/^link_[A-Za-z0-9]+_token_[A-Za-z0-9]+$/.test(lt)) {
        return NextResponse.json({ error: 'EXCHANGE_OK_BUT_NO_LINK_TOKEN' }, { status: 400 });
      }
      tokenToStore = lt;
      mode = (process.env.FINTOC_SECRET_KEY || '').startsWith('sk_test') ? 'sandbox' : 'live';
    // 3) Sandbox: public_token (flujo antiguo)
    } else if (typeof publicToken === 'string') {
      try {
        const { accessToken } = await exchangePublicToken(publicToken);
        tokenToStore = accessToken;
        mode = 'sandbox';
      } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'INVALID_PUBLIC_TOKEN' }, { status: 400 });
      }
    // 4) No soportamos solo link_id en live
    } else if (typeof linkId === 'string') {
      return NextResponse.json({ error: 'En live usa link_token (link_..._token_...) o exchange_token (li_..._sec_...). El link_id solo no es suficiente.' }, { status: 400 });
    } else {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Preflight: validar que la SECRET actual puede acceder al link antes de guardar
    // Validación básica de formato de link_token
    if (!/^link_[A-Za-z0-9]+_token_[A-Za-z0-9]+$/.test(tokenToStore)) {
        return NextResponse.json({ error: 'TOKEN_INVALIDO. Se espera link_token (link_..._token_...)' }, { status: 400 });
    }

    const encrypted = encrypt(tokenToStore);

    const ref = adminDb.doc(`users/${userId}/bankConnections/fintoc`);
    await ref.set({
  provider: 'fintoc',
  institutionId: institutionId || null,
  accessTokenEnc: encrypted, // Guarda link_token cifrado
      accountId: accountId && accountId.startsWith('acc_') ? accountId : null,
      mode,
      updatedAt: new Date(),
      createdAt: new Date(),
    }, { merge: true });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('exchange-public-token error', e);
    const status = e?.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: e?.message || 'Server error' }, { status });
  }
}
