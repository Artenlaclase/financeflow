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
  // Prefer link_id because listing endpoints typically use link identifiers
  const linkId = data.link_id || data.link || null;
  const access = data.access_token || data.accessToken || null;
  const token = linkId || access;
  if (!token) throw new Error('Exchange did not return link_id/access_token');
  const institutionId = data.institution_id || data.institutionId;
  return { accessToken: token, institutionId };
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

export type FetchDebug = { method?: string; endpoint?: string; tried?: string[]; error?: string };

export async function fetchTransactions(accessTokenOrLinkId: string, fromISO: string, toISO: string, accountId?: string | null): Promise<{ txs: ProviderTransaction[]; debug?: FetchDebug }> {
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
    return { txs: out, debug: { method: 'mock' } };
  }

  const base = getBaseUrl();
  const auth = getAuthHeader();
  const linkId = accessTokenOrLinkId; // we store link_id when available, else access token; endpoints below expect link id

  // Build candidate endpoints (account-scoped first if provided), then link-scoped
  const endpoints: string[] = [];
  if (accountId) {
    endpoints.push(`${base}/links/${encodeURIComponent(linkId)}/accounts/${encodeURIComponent(accountId)}/movements`);
    endpoints.push(`${base}/links/${encodeURIComponent(linkId)}/accounts/${encodeURIComponent(accountId)}/transactions`);
  }
  endpoints.push(`${base}/links/${encodeURIComponent(linkId)}/movements`);
  endpoints.push(`${base}/links/${encodeURIComponent(linkId)}/transactions`);

  const params = new URLSearchParams();
  params.set('since', fromISO.slice(0, 10));
  params.set('until', toISO.slice(0, 10));
  if (accountId) params.set('account_id', accountId);
  const tried: string[] = [];
  let lastError = '';

  // Attempt via official SDK if available
  try {
    // Dynamically import to avoid bundling on client
    const mod = await import('fintoc');
    const FintocCtor: any = (mod as any).Fintoc || (mod as any).default;
    if (FintocCtor) {
      const client = new FintocCtor(process.env.FINTOC_SECRET_KEY);
      const since = fromISO.slice(0, 10);
      const until = toISO.slice(0, 10);
      const link = await client.links.get(linkId);
      const collect = async (gen: AsyncGenerator<any, any, any> | any): Promise<any[]> => {
        const arr: any[] = [];
        const iterator = await gen;
        if (iterator && typeof iterator[Symbol.asyncIterator] === 'function') {
          for await (const it of iterator as any) arr.push(it);
        } else if (Array.isArray(iterator)) {
          arr.push(...iterator);
        }
        return arr;
      };
      // Account-scoped first
      if (accountId) {
        try {
          tried.push('sdk:accounts.movements');
          const account = await link.accounts.get(accountId);
          const gen = await account.movements.list({ since, until });
          const items = await collect(gen);
          if (items.length) {
            return {
              txs: items.map((mv: any) => ({
                id: String(mv.id),
                date: mv.date || mv.posted_at || mv.booked_at || mv.created_at,
                amount: Number(mv.amount),
                description: mv.description || mv.detail || mv.note,
                merchant: mv.merchant?.name || mv.counterparty || null,
                category: mv.category || (Number(mv.amount) >= 0 ? 'income' : 'expense'),
              })),
              debug: { method: 'sdk', endpoint: 'accounts.movements', tried }
            };
          }
        } catch (e: any) { lastError = String(e?.message || e); }
        try {
          tried.push('sdk:accounts.transactions');
          const account = await link.accounts.get(accountId);
          const gen = await account.transactions.list({ since, until });
          const items = await collect(gen);
          if (items.length) {
            return {
              txs: items.map((mv: any) => ({
                id: String(mv.id),
                date: mv.date || mv.posted_at || mv.booked_at || mv.created_at,
                amount: Number(mv.amount),
                description: mv.description || mv.detail || mv.note,
                merchant: mv.merchant?.name || mv.counterparty || null,
                category: mv.category || (Number(mv.amount) >= 0 ? 'income' : 'expense'),
              })),
              debug: { method: 'sdk', endpoint: 'accounts.transactions', tried }
            };
          }
        } catch (e: any) { lastError = String(e?.message || e); }
      }
      // Link-scoped
      try {
        tried.push('sdk:link.movements');
        const gen = await link.movements.list({ since, until });
        const items = await collect(gen);
        if (items.length) {
          return {
            txs: items.map((mv: any) => ({
              id: String(mv.id),
              date: mv.date || mv.posted_at || mv.booked_at || mv.created_at,
              amount: Number(mv.amount),
              description: mv.description || mv.detail || mv.note,
              merchant: mv.merchant?.name || mv.counterparty || null,
              category: mv.category || (Number(mv.amount) >= 0 ? 'income' : 'expense'),
            })),
            debug: { method: 'sdk', endpoint: 'link.movements', tried }
          };
        }
      } catch (e: any) { lastError = String(e?.message || e); }
      try {
        tried.push('sdk:link.transactions');
        const gen = await link.transactions.list({ since, until });
        const items = await collect(gen);
        if (items.length) {
          return {
            txs: items.map((mv: any) => ({
              id: String(mv.id),
              date: mv.date || mv.posted_at || mv.booked_at || mv.created_at,
              amount: Number(mv.amount),
              description: mv.description || mv.detail || mv.note,
              merchant: mv.merchant?.name || mv.counterparty || null,
              category: mv.category || (Number(mv.amount) >= 0 ? 'income' : 'expense'),
            })),
            debug: { method: 'sdk', endpoint: 'link.transactions', tried }
          };
        }
      } catch (e: any) { lastError = String(e?.message || e); }
    }
  } catch (e: any) { lastError = String(e?.message || e); }

  for (const url of endpoints) {
    try {
      tried.push(`http:${url}`);
      const resp = await fetch(`${url}?${params.toString()}`, {
        headers: { 'Authorization': auth },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const items: any[] = Array.isArray(data) ? data : (data?.data || []);
      return { txs: items.map((mv: any) => ({
        id: String(mv.id || mv._id || mv.uuid || mv.reference || mv.hash || mv.transaction_id),
        date: mv.date || mv.posted_at || mv.post_date || mv.booked_at || mv.created_at,
        amount: Number(mv.amount || mv.value || mv.money || 0),
        description: mv.description || mv.concept || mv.details || mv.note,
        merchant: mv.merchant?.name || mv.merchant || mv.counterparty || null,
        category: mv.category || (Number(mv.amount || mv.value || mv.money || 0) >= 0 ? 'income' : 'expense'),
      })).filter((t: any) => t.id && t.date && typeof t.amount === 'number'), debug: { method: 'http', endpoint: url, tried } };
    } catch (e: any) {
      lastError = String(e?.message || e);
      // try next endpoint
    }
  }

  // If everything fails
  return { txs: [], debug: { tried, error: lastError } };
}
