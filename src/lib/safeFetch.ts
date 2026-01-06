/**
 * Safe fetch wrapper that handles empty/invalid JSON responses
 * Use this for ALL API calls to prevent crashes
 */

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function safeFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T | null> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    // Handle non-OK responses
    if (!response.ok) {
      console.warn(`[safeFetch] ${url} returned ${response.status}`);
      return null;
    }

    // Read response as text first
    const text = await response.text();

    // Handle empty responses
    if (!text || text.trim() === '') {
      console.warn(`[safeFetch] Empty response from ${url}`);
      return null;
    }

    // Try to parse JSON
    try {
      return JSON.parse(text) as T;
    } catch (parseError) {
      console.error(`[safeFetch] Invalid JSON from ${url}:`, text.substring(0, 200));
      return null;
    }
  } catch (networkError) {
    console.error(`[safeFetch] Network error for ${url}:`, networkError);
    return null;
  }
}

/**
 * Safe fetch with default value fallback
 */
export async function safeFetchWithDefault<T>(
  url: string,
  defaultValue: T,
  options?: RequestInit
): Promise<T> {
  const result = await safeFetch<T>(url, options);
  return result ?? defaultValue;
}
