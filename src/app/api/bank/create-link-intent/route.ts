import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/server/auth';

export async function POST(req: Request) {
  try {
    const uid = await getUserIdFromRequest(req);
    const body = await req.json().catch(() => ({} as any));
    const { institutionId } = body as { institutionId?: string };

    const base = process.env.FINTOC_BASE_URL || 'https://api.fintoc.com/v1';
    const sk = process.env.FINTOC_SECRET_KEY;
    if (!sk) return NextResponse.json({ error: 'Missing FINTOC_SECRET_KEY' }, { status: 500 });

    // Minimal payload to request a widget_token for data aggregation (movements)
    const payload: any = {
      products: ['movements'],
    };
    if (institutionId) payload.institution_id = institutionId;

    const resp = await fetch(`${base}/link_intents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sk}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const detail = await resp.text().catch(() => '');
      return NextResponse.json({ error: `CREATE_LINK_INTENT_FAILED (${resp.status}) ${detail}` }, { status: 400 });
    }
    const data = await resp.json();
    const widgetToken = data?.widget_token || data?.widgetToken;
    if (!widgetToken) return NextResponse.json({ error: 'NO_WIDGET_TOKEN' }, { status: 400 });

    return NextResponse.json({ widgetToken });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
