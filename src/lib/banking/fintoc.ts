import type { NextRequest } from 'next/server';

// Placeholder client for Fintoc. Replace stubs with real HTTP calls to Fintoc API.
// Docs: https://fintoc.com/ (obtain sandbox keys)

export type CreateLinkTokenResponse = {
  linkToken: string; // Token or URL required by the Fintoc Link widget
};

export async function createLinkToken(_userId: string): Promise<CreateLinkTokenResponse> {
  // TODO: Call Fintoc API to create a link token for the user
  // Return the token used by the Fintoc Link widget on the client
  // Example shape; adjust to real response
  return { linkToken: 'stub_link_token_replace_with_fintoc_value' };
}

export async function exchangePublicToken(_publicToken: string): Promise<{ accessToken: string; institutionId?: string; }> {
  // TODO: Exchange public token from the client (Link) for a permanent access token
  return { accessToken: 'stub_access_token_replace_with_fintoc_value' };
}

export type ProviderTransaction = {
  id: string;
  date: string; // ISO date string
  amount: number; // negative for expenses, positive for income (adjust if provider differs)
  description?: string;
  merchant?: string;
  category?: string;
  // ... add fields you need
};

export async function fetchTransactions(_accessToken: string, _fromISO: string, _toISO: string): Promise<ProviderTransaction[]> {
  // TODO: Fetch transactions from Fintoc API in the date range
  return [];
}
