/**
 * Single-source-of-truth API client. ONLY AuthContext + api.ts may touch localStorage.
 *
 * Usage:
 *   apiCall("/admin/users") → GET http://127.0.0.1:5000/api/admin/users
 *   apiCall("/pickups", { method: "POST", body: {...} })
 *
 * RULES:
 * - Endpoint should NOT include /api prefix (this function adds it)
 * - JWT automatically attached from localStorage (key: access_token)
 * - 401 triggers token clear + redirect to /login
 * - Components NEVER pass Authorization header — apiCall handles it
 */

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() || '';
const TOKEN_KEY = 'access_token';

type ApiCallOptions = RequestInit & { _skip401Redirect?: boolean };

export async function apiCall<T = any>(
  endpoint: string,
  options: ApiCallOptions = {}
): Promise<T> {
  const { _skip401Redirect, ...fetchOptions } = options;
  const token = localStorage.getItem(TOKEN_KEY);
  const base = API_BASE || '';
  const url = `${base}/api${endpoint}`;
  const isFormData = fetchOptions.body instanceof FormData;

  if (import.meta.env.DEV && !token && endpoint.startsWith('/admin')) {
    console.warn('[AUTH] Admin API called without token');
  }

  if (import.meta.env.DEV) {
    console.log('[API CALL]', url);
    console.log('[API TOKEN]', token);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      credentials: 'include',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(fetchOptions.headers || {}),
      },
      ...fetchOptions,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    console.error('[API ERROR] Failed to fetch:', msg);
    const friendly =
      msg.includes('fetch') || msg.includes('Failed to fetch')
        ? 'Backend unreachable. Ensure the EcoSwap backend server is running.'
        : msg;
    throw new Error(friendly);
  }

  if (response.status === 401 && !_skip401Redirect) {
    if (import.meta.env.DEV) {
      console.warn('[AUTH] Token expired or missing');
    }
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const text = await response.text();
    console.error('[API ERROR]', text);
    let message = text || 'API request failed';
    try {
      const parsed = text?.startsWith('{') ? JSON.parse(text) : null;
      if (parsed && typeof parsed.error === 'string') message = parsed.error;
    } catch {
      /* use message as-is */
    }
    throw new Error(message);
  }

  return response.json();
}

/**
 * Fetch binary/blob response (e.g. PDF download).
 * Same token + URL logic as apiCall, returns Blob.
 */
export async function apiCallBlob(endpoint: string, options: RequestInit = {}): Promise<Blob> {
  const token = localStorage.getItem(TOKEN_KEY);
  const url = `${API_BASE}/api${endpoint}`;

  if (import.meta.env.DEV && !token && endpoint.startsWith('/admin')) {
    console.warn('[AUTH] Admin API called without token');
  }

  if (import.meta.env.DEV) {
    console.log('[API CALL]', url);
    console.log('[API TOKEN]', token);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      credentials: 'include',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    console.error('[API ERROR] Failed to fetch:', msg);
    const friendly =
      msg.includes('fetch') || msg.includes('Failed to fetch')
        ? 'Backend unreachable. Ensure the EcoSwap backend server is running.'
        : msg;
    throw new Error(friendly);
  }

  if (response.status === 401) {
    if (import.meta.env.DEV) {
      console.warn('[AUTH] Token expired or missing');
    }
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const text = await response.text();
    console.error('[API ERROR]', text);
    let message = text || 'API request failed';
    try {
      const parsed = text?.startsWith('{') ? JSON.parse(text) : null;
      if (parsed && typeof parsed.error === 'string') message = parsed.error;
    } catch {
      /* use message as-is */
    }
    throw new Error(message);
  }

  return response.blob();
}
