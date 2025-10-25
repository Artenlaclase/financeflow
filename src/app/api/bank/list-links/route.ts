import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/server/auth';

export async function GET(req: Request) {
  try {
    // Solo disponible en no-producción para debugging
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
    }
    const uid = await getUserIdFromRequest(req).catch(() => null);
    if (!uid) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const base = process.env.FINTOC_BASE_URL || 'https://api.fintoc.com/v1';
    const sk = process.env.FINTOC_SECRET_KEY;
    if (!sk) return NextResponse.json({ error: 'Missing FINTOC_SECRET_KEY' }, { status: 500 });
    const resp = await fetch(`${base}/links`, { headers: { Authorization: `Bearer ${sk}` } });
    if (!resp.ok) return NextResponse.json({ error: `HTTP ${resp.status}` }, { status: resp.status });
    const data = await resp.json();
    const items: any[] = Array.isArray(data) ? data : (data?.data || []);
    // Resumimos por seguridad
    const links = items.map((l: any) => ({ id: l.id || l._id || l.uuid, institution: l.institution || l.institution_id || null }));
    return NextResponse.json({ links });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
