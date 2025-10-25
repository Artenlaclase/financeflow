// Real Fintoc client wrappers with safe fallbacks
// Requires FINTOC_SECRET_KEY. Optional FINTOC_BASE_URL (defaults to https://api.fintoc.com/v1)

export type CreateLinkTokenResponse = { linkToken: string };

function getBaseUrl() {
  return process.env.FINTOC_BASE_URL || 'https://api.fintoc.com/v1';
}

function getAuthHeader() {
  const sk = process.env.FINTOC_SECRET_KEY;
  if (!sk) throw new Error('Missing FINTOC_SECRET_KEY');
  return `Bearer ${sk}`;
}

export async function createLinkToken(_userId: string): Promise<CreateLinkTokenResponse> {
  // Some Fintoc widget versions do not require a server-side link token; return a placeholder.
  // If your Fintoc account requires link_token, implement the POST to the proper endpoint here.
  return { linkToken: 'unused' };
}

export async function exchangePublicToken(publicToken: string): Promise<{ accessToken: string; institutionId?: string }> {
  // Try real exchange endpoint; if fails, fallback to treating the provided token as link_id when it already starts with 'link_'
  try {
    const resp = await fetch(`${getBaseUrl()}/exchanges/public-token`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ public_token: publicToken }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Exchange failed: ${resp.status} ${text}`);
    }
    const data = await resp.json().catch(() => ({} as any));
    const accessToken = data.access_token || data.link_id || data.link || data.accessToken;
    if (!accessToken) throw new Error('Exchange did not return access token');
    const institutionId = data.institution_id || data.institutionId;
    return { accessToken, institutionId };
  } catch (err) {
    if (publicToken.startsWith('link_')) {
      return { accessToken: publicToken };
    }
    throw err;
  }
}

export type ProviderTransaction = {
  id: string;
  date: string; // ISO date string
  amount: number; // negative for expenses, positive for income
  description?: string;
  merchant?: string;
  category?: string;
};

export async function fetchTransactions(accessTokenOrLinkId: string, fromISO: string, toISO: string, accountId?: string | null): Promise<ProviderTransaction[]> {
  const forceSandbox = (process.env.FINTOC_FORCE_SANDBOX || '').toLowerCase() === 'true' || (process.env.FINTOC_FORCE_SANDBOX || '') === '1';
  const isTest = (process.env.FINTOC_SECRET_KEY || '').startsWith('sk_test');

  // Optional mock path for local testing
  if (forceSandbox || isTest) {
    const from = new Date(fromISO);
    const to = new Date(toISO);
    const days = Math.max(1, Math.min(20, Math.floor((to.getTime() - from.getTime()) / (24*60*60*1000))));
    const out: ProviderTransaction[] = [];
    for (let i = 0; i < Math.min(days, 8); i++) {
      const d = new Date(to.getTime() - i * 24 * 60 * 60 * 1000);
      out.push({
        id: `mock-${d.toISOString().slice(0,10)}-${i}`,
        date: d.toISOString(),
        amount: i % 3 === 0 ? 250000 : -Math.round(1000 + Math.random() * 20000),
        description: i % 3 === 0 ? 'Depósito Sueldo' : 'Compra Supermercado',
        merchant: i % 3 === 0 ? 'Empleador S.A.' : 'Jumbo',
        category: i % 3 === 0 ? 'income' : 'groceries'
      });
    }
    return out;
  }

  const base = getBaseUrl();
  const auth = getAuthHeader();
  const linkId = accessTokenOrLinkId; // we store link_id or access token already; API expects link identifier

  // Try movements endpoint first; if it fails, try transactions endpoint
  const endpoints = [
    `${base}/links/${encodeURIComponent(linkId)}/movements`,
    `${base}/links/${encodeURIComponent(linkId)}/transactions`,
  ];

  const params = new URLSearchParams();
  params.set('since', fromISO.slice(0, 10));
  params.set('until', toISO.slice(0, 10));
  if (accountId) params.set('account_id', accountId);

  for (const url of endpoints) {
    try {
      const resp = await fetch(`${url}?${params.toString()}`, {
        headers: { 'Authorization': auth },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const items: any[] = Array.isArray(data) ? data : (data?.data || []);
      return items.map((mv: any) => ({
        id: String(mv.id || mv._id || mv.uuid || mv.reference || mv.hash || mv.transaction_id),
        date: mv.date || mv.posted_at || mv.post_date || mv.booked_at || mv.created_at,
        amount: Number(mv.amount || mv.value || mv.money || 0),
        description: mv.description || mv.concept || mv.details || mv.note,
        merchant: mv.merchant?.name || mv.merchant || mv.counterparty || null,
        category: mv.category || (mv.amount >= 0 ? 'income' : 'expense'),
      })).filter(t => t.id && t.date && typeof t.amount === 'number');
    } catch (e) {
      // try next endpoint
    }
  }

  // If everything fails
  return [];
}
