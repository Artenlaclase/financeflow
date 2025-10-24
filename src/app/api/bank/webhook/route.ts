import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // TODO: Verify provider signature and handle events (new transactions, updates)
  // For now, accept and log
  const body = await req.text();
  console.log('bank webhook received:', body.substring(0, 2000));
  return NextResponse.json({ ok: true });
}
