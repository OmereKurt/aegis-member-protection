const API_ORIGIN = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
let csrfToken: string | null = null;

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const browserApiBase = API_ORIGIN;

  if (typeof window === "undefined") {
    const serverApiBase = process.env.INTERNAL_API_BASE_URL || browserApiBase;
    return serverApiBase ? `${serverApiBase.replace(/\/$/, "")}${normalizedPath}` : `/backend${normalizedPath}`;
  }

  return browserApiBase ? `${browserApiBase.replace(/\/$/, "")}${normalizedPath}` : `/backend${normalizedPath}`;
}

function requestMethod(init?: RequestInit) {
  return (init?.method || "GET").toUpperCase();
}

function isCsrfExempt(url: string) {
  return url.includes("/api/auth/login") || url.includes("/api/auth/logout");
}

async function getCsrfToken() {
  if (csrfToken) return csrfToken;

  const response = await fetch(apiUrl("/api/auth/csrf"), {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (typeof window !== "undefined" && response.status === 401) {
      csrfToken = null;
      window.dispatchEvent(new CustomEvent("aegis-auth-unauthorized"));
    }
    throw new Error("Unable to prepare secure request.");
  }

  const data = (await response.json()) as { csrf_token: string };
  csrfToken = data.csrf_token;
  return csrfToken;
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const method = requestMethod(init);
  const csrfHeaders: Record<string, string> = {};
  if (typeof window !== "undefined" && unsafeMethods.has(method) && !isCsrfExempt(url)) {
    csrfHeaders["X-CSRF-Token"] = await getCsrfToken();
  }

  const response = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...csrfHeaders,
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
    if (typeof window !== "undefined" && response.status === 401) {
      csrfToken = null;
      window.dispatchEvent(new CustomEvent("aegis-auth-unauthorized"));
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function clearCsrfToken() {
  csrfToken = null;
}
