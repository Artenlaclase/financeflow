import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/server/auth';

export async function GET(req: Request) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
    }

    const uid = await getUserIdFromRequest(req).catch(() => null);
    if (!uid) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const url = new URL(req.url);
    const linkId = url.searchParams.get('linkId') || '';
    if (!linkId || !linkId.startsWith('link_')) {
      return NextResponse.json({ error: 'Missing or invalid linkId (expected link_...)' }, { status: 400 });
    }

    const base = process.env.FINTOC_BASE_URL || 'https://api.fintoc.com/v1';
    const urlObj = new URL(req.url);
    const linkToken = urlObj.searchParams.get('linkToken') || '';
    // Preferir linkToken; si no viene, intentaremos con SECRET pero muchos endpoints link-scoped requieren link_token.
    const headers = linkToken
      ? { Authorization: `Bearer ${linkToken}` }
      : { Authorization: `Bearer ${process.env.FINTOC_SECRET_KEY || ''}` } as Record<string, string>;
    const tried: string[] = [];

    // Preflight del link para devolver un error claro si no es accesible
    const preflight = `${base}/links/${encodeURIComponent(linkId)}`;
    tried.push(`http:${preflight}`);
    const preResp = await fetch(preflight, { headers });
    if (!preResp.ok) {
      const detail = await preResp.text().catch(() => '');
      return NextResponse.json({ error: `LINK_NOT_ACCESSIBLE (${preResp.status}) ${detail || ''}. Si estás usando SECRET, intenta con linkToken.` , tried }, { status: preResp.status });
    }

    const families = [
      { family: 'accounts', url: `${base}/links/${encodeURIComponent(linkId)}/accounts` },
      { family: 'bank_accounts', url: `${base}/links/${encodeURIComponent(linkId)}/bank_accounts` },
      { family: 'credit_cards', url: `${base}/links/${encodeURIComponent(linkId)}/credit_cards` },
    ];

    const results: any[] = [];
    for (const f of families) {
      tried.push(`http:${f.url}`);
      const resp = await fetch(f.url, { headers });
      if (!resp.ok) continue;
      const data = await resp.json();
      const arr: any[] = Array.isArray(data) ? data : (data?.data || []);
      for (const it of arr) {
        const id = it?.id || it?._id || it?.uuid;
        if (!id) continue;
        results.push({
          id,
          family: f.family,
          name: it?.name || it?.holder_name || it?.account_name || null,
          last4: it?.last4 || it?.number?.slice?.(-4) || null,
          currency: it?.currency || it?.balance?.currency || null,
        });
      }
    }

    return NextResponse.json({ linkId, accounts: results, tried });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
