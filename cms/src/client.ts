import type { CmsRecord } from './schema';
import type { PreviewData } from './storage';

export type CmsOperation = 'create' | 'update' | 'delete' | 'archive';

export class CmsApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'CmsApiError';
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', ...init });
  } catch {
    throw new CmsApiError('Could not reach the CMS service. Check your connection and try again.', 0);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new CmsApiError('The CMS service returned an invalid response.', response.status);
  }

  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
      ? payload.error
      : `The CMS request failed (HTTP ${response.status}).`;
    throw new CmsApiError(message, response.status);
  }
  return payload as T;
}

export async function getSession() {
  return request<{ authenticated: boolean }>('/api/cms-auth');
}

export async function signIn(password: string) {
  return request<{ authenticated: boolean }>('/api/cms-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
}

export async function signOut() {
  return request<{ authenticated: boolean }>('/api/cms-auth', { method: 'DELETE' });
}

export async function loadCatalogue(): Promise<PreviewData> {
  const result = await request<{ data: PreviewData }>('/api/cms-data?collection=all');
  if (!result.data || typeof result.data !== 'object') throw new CmsApiError('The CMS service returned no catalogue data.', 502);
  return result.data;
}

export async function writeRecord(collection: string, action: CmsOperation, record: CmsRecord) {
  return request<{ ok: true; record?: CmsRecord }>('/api/cms-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ collection, action, record }),
  });
}
