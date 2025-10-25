// Real Fintoc client wrappers with safe fallbacks
// Requires FINTOC_SECRET_KEY. Optional FINTOC_BASE_URL (defaults to https://api.fintoc.com/v1)

export type CreateLinkTokenResponse = { linkToken: string };

function getBaseUrl() {
  return process.env.FINTOC_BASE_URL || 'https://api.fintoc.com/v1';
}

function getSecretAuthHeader() {
  const sk = process.env.FINTOC_SECRET_KEY;
  if (!sk) throw new Error('Missing FINTOC_SECRET_KEY');
  return `Bearer ${sk}`;
}

function isLinkToken(token: string) {
  return /^link_[A-Za-z0-9]+_token_[A-Za-z0-9]+$/.test(token);
}

function extractLinkIdFromToken(linkToken: string): string | null {
  const m = linkToken.match(/^(link_[A-Za-z0-9]+)_token_[A-Za-z0-9]+$/);
  return m ? m[1] : null;
}

export async function createLinkToken(_userId: string): Promise<CreateLinkTokenResponse> {
  // Some Fintoc widget versions do not require a server-side link token; return a placeholder.
  // If your Fintoc account requires link_token, implement the POST to the proper endpoint here.
  return { linkToken: 'unused' };
}

export async function exchangePublicToken(publicToken: string): Promise<{ accessToken: string; institutionId?: string }> {
  // Many Fintoc flows provide link_id directly via the widget. Prefer using that.
  if (publicToken.startsWith('link_')) {
    return { accessToken: publicToken };
  }
  // If you truly need to exchange a public token, implement the correct endpoint for your Fintoc account setup.
  // For now, guide the user to provide a link_id instead of attempting a non-existent exchange route.
  throw new Error('Para cuentas live, pega el link_id (link_...) entregado por Fintoc Link. El intercambio de public_token no está habilitado.');
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

export async function fetchTransactions(linkTokenOrLegacy: string, fromISO: string, toISO: string, accountId?: string | null): Promise<{ txs: ProviderTransaction[]; debug?: FetchDebug }> {
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
  const authLink = isLinkToken(linkTokenOrLegacy) ? `Bearer ${linkTokenOrLegacy}` : null;
  const authSecret = getSecretAuthHeader();
  const linkId = isLinkToken(linkTokenOrLegacy) ? (extractLinkIdFromToken(linkTokenOrLegacy) || '') : linkTokenOrLegacy;

  // Prefer link-scoped auth when available

  // Build candidate endpoints (account-scoped first if provided), then link-scoped.
  // We try multiple resource families because Fintoc can expose movements under accounts, bank_accounts, or credit_cards.
  const endpoints: string[] = [];
  if (accountId) {
    // Direct account endpoints
    endpoints.push(`${base}/accounts/${encodeURIComponent(accountId)}/movements`);
    endpoints.push(`${base}/accounts/${encodeURIComponent(accountId)}/transactions`);
    // Link-scoped account endpoints (if supported)
    endpoints.push(`${base}/links/${encodeURIComponent(linkId)}/accounts/${encodeURIComponent(accountId)}/movements`);
    endpoints.push(`${base}/links/${encodeURIComponent(linkId)}/accounts/${encodeURIComponent(accountId)}/transactions`);
    // bank_accounts family
    endpoints.push(`${base}/bank_accounts/${encodeURIComponent(accountId)}/movements`);
    endpoints.push(`${base}/links/${encodeURIComponent(linkId)}/bank_accounts/${encodeURIComponent(accountId)}/movements`);
    // credit_cards family
    endpoints.push(`${base}/credit_cards/${encodeURIComponent(accountId)}/movements`);
    endpoints.push(`${base}/links/${encodeURIComponent(linkId)}/credit_cards/${encodeURIComponent(accountId)}/movements`);
  }
  // Link-level movements as a broad fallback
  endpoints.push(`${base}/links/${encodeURIComponent(linkId)}/movements`);
  endpoints.push(`${base}/links/${encodeURIComponent(linkId)}/transactions`);

  const params = new URLSearchParams();
  params.set('since', fromISO.slice(0, 10));
  params.set('until', toISO.slice(0, 10));
  // Do not pass account_id as query param universally; account-scoped endpoints encode the id in the path.
  const tried: string[] = [];
  let lastError = '';

  // Skipping SDK usage to avoid bundler/type issues in Next.js; rely on HTTP endpoints only.

  for (const url of endpoints) {
    try {
      tried.push(`http:${url}`);
      const resp = await fetch(`${url}?${params.toString()}`, {
        headers: { 'Authorization': authLink || authSecret },
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

  // Discovery fallback: list accounts under link and try their known families
  try {
    const listEndpoints = [
      `${base}/links/${encodeURIComponent(linkId)}/accounts`,
      `${base}/links/${encodeURIComponent(linkId)}/bank_accounts`,
      `${base}/links/${encodeURIComponent(linkId)}/credit_cards`
    ];
    for (const le of listEndpoints) {
      tried.push(`http:${le}`);
      const resp = await fetch(le, { headers: { 'Authorization': authLink || authSecret } });
      if (!resp.ok) continue;
      const list = await resp.json();
      const arr: any[] = Array.isArray(list) ? list : (list?.data || []);
      for (const acc of arr) {
        const id = acc?.id || acc?._id || acc?.uuid;
        if (!id) continue;
        const familyCandidates = [
          `${base}/accounts/${encodeURIComponent(id)}/movements`,
          `${base}/bank_accounts/${encodeURIComponent(id)}/movements`,
          `${base}/credit_cards/${encodeURIComponent(id)}/movements`
        ];
        for (const fu of familyCandidates) {
          try {
            tried.push(`http:${fu}`);
            const r2 = await fetch(`${fu}?${params.toString()}`, { headers: { 'Authorization': authLink || authSecret } });
            if (!r2.ok) throw new Error(`HTTP ${r2.status}`);
            const data = await r2.json();
            const items: any[] = Array.isArray(data) ? data : (data?.data || []);
            return { txs: items.map((mv: any) => ({
              id: String(mv.id || mv._id || mv.uuid || mv.reference || mv.hash || mv.transaction_id),
              date: mv.date || mv.posted_at || mv.post_date || mv.booked_at || mv.created_at,
              amount: Number(mv.amount || mv.value || mv.money || 0),
              description: mv.description || mv.concept || mv.details || mv.note,
              merchant: mv.merchant?.name || mv.merchant || mv.counterparty || null,
              category: mv.category || (Number(mv.amount || mv.value || mv.money || 0) >= 0 ? 'income' : 'expense'),
            })).filter((t: any) => t.id && t.date && typeof t.amount === 'number'), debug: { method: 'http', endpoint: fu, tried } };
          } catch (e2: any) {
            lastError = String(e2?.message || e2);
          }
        }
      }
    }
  } catch (e3: any) {
    lastError = String(e3?.message || e3);
  }

  // If everything still fails
  return { txs: [], debug: { tried, error: lastError } };
}
