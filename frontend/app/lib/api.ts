const API_ORIGIN = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const browserApiBase = API_ORIGIN;

  if (typeof window === "undefined") {
    const serverApiBase = process.env.INTERNAL_API_BASE_URL || browserApiBase;
    return serverApiBase ? `${serverApiBase.replace(/\/$/, "")}${normalizedPath}` : `/backend${normalizedPath}`;
  }

  return browserApiBase ? `${browserApiBase.replace(/\/$/, "")}${normalizedPath}` : `/backend${normalizedPath}`;
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      message = data.detail || data.message || message;
    } catch {
      // Keep the generic message when the backend does not return JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
