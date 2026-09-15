/**
 * Safe API fetch utility with automatic content-type validation,
 * Rate Limit / 429 backoff support, and fallback protection against non-JSON errors.
 */

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit,
  fallbackValue: T = [] as any
): Promise<T> {
  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn(`[SafeFetch] ${options?.method || 'GET'} ${url} returned ${res.status}: ${text.slice(0, 100)}`);
      return fallbackValue;
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text().catch(() => '');
      console.warn(`[SafeFetch] Non-JSON content type received (${contentType}) from ${url}: ${text.slice(0, 100)}`);
      return fallbackValue;
    }

    const data = await res.json();
    return data as T;
  } catch (err: any) {
    console.warn(`[SafeFetch] Request error for ${url}:`, err?.message || err);
    return fallbackValue;
  }
}
