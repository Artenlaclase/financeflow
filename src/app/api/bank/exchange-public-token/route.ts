import { NextResponse } from 'next/server';
import { exchangePublicToken } from '@/lib/banking/fintoc';
import { encrypt } from '@/lib/crypto';
import { adminDb } from '@/lib/firebase/admin';
import { getUserIdFromRequest } from '@/lib/server/auth';

export async function POST(req: Request) {
  try {
  const body = await req.json();
  const { userId, publicToken, linkId, institutionId, accountId } = body as { userId: string; publicToken?: string; linkId?: string; institutionId?: string; accountId?: string };
  if (!userId || (!publicToken && !linkId)) return NextResponse.json({ error: 'Missing userId and token/linkId' }, { status: 400 });
  const authUid = await getUserIdFromRequest(req).catch(() => null);
  if (authUid !== userId) return NextResponse.json({ error: 'Token/user mismatch' }, { status: 403 });

    let tokenToStore: string;
    if (typeof linkId === 'string' && linkId.startsWith('link_')) {
      // Aceptar directamente el link_id de Fintoc como credencial de acceso
      // Normalizar: recortar espacios y extraer el patrón link_XXXX por si viene con texto adicional
      const trimmed = linkId.trim();
      const match = trimmed.match(/link_[A-Za-z0-9]+/);
      tokenToStore = match ? match[0] : trimmed;
    } else if (typeof publicToken === 'string') {
      const { accessToken } = await exchangePublicToken(publicToken);
      tokenToStore = accessToken;
    } else {
      return NextResponse.json({ error: 'Invalid token or linkId' }, { status: 400 });
    }

    // Preflight: validar que la SECRET actual puede acceder al link antes de guardar
    try {
      const base = process.env.FINTOC_BASE_URL || 'https://api.fintoc.com/v1';
      const sk = process.env.FINTOC_SECRET_KEY;
      if (!sk) throw new Error('Missing FINTOC_SECRET_KEY');
      const resp = await fetch(`${base}/links/${encodeURIComponent(tokenToStore)}`, {
        headers: { Authorization: `Bearer ${sk}` }
      });
      if (!resp.ok) {
        let detail = '';
        try { detail = await resp.text(); } catch {}
        return NextResponse.json({ error: `LINK_NOT_ACCESSIBLE (${resp.status}). Verifica proyecto/ambiente. linkId=${tokenToStore}${detail ? ` · ${detail}` : ''}` }, { status: 403 });
      }
    } catch (e: any) {
      // Si falla por red, dejamos continuar; se detectará en sync
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
    const status = e?.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: e?.message || 'Server error' }, { status });
  }
}
