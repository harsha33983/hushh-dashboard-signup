/**
 * Backend client — calls FastAPI when available.
 *
 * Used inside Next.js API routes (server-side only).
 * Falls back gracefully if BACKEND_URL is not set.
 */

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const API_KEY = process.env.BACKEND_API_KEY || process.env.NEXT_PUBLIC_API_KEY || "dev-api-key-12345";
const WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "workspace-123";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "X-Api-Key": API_KEY,
  "X-Workspace-Id": WORKSPACE_ID,
};

type FetchOptions = {
  method?: string;
  body?: unknown;
  timeoutMs?: number;
};

/**
 * Fetch from FastAPI backend.
 * Throws on network error or non-2xx response.
 */
export async function backendFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = "GET", body, timeoutMs = 5000 } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers: DEFAULT_HEADERS,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`FastAPI ${path} returned ${res.status}`);
    }

    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

export { BACKEND_URL };
