import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * app/lib/api.ts holds two pieces of state that outlive a single call: the
 * base URL, read from the environment when the module is first imported, and
 * the cached CSRF token. Both make the module order-dependent under test, so
 * every case imports a fresh copy rather than sharing one.
 */
async function loadApi(env: Record<string, string | undefined> = {}) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return import("../app/lib/api");
}

/** A window stub, so the module takes its browser-side branches. */
function stubBrowser() {
  const dispatchEvent = vi.fn();
  vi.stubGlobal("window", { dispatchEvent });
  return dispatchEvent;
}

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.unstubAllGlobals();
});

describe("apiUrl", () => {
  it("adds a missing leading slash", async () => {
    const { apiUrl } = await loadApi({ NEXT_PUBLIC_API_BASE_URL: "http://api.test" });
    stubBrowser();
    expect(apiUrl("api/auth/me")).toBe("http://api.test/api/auth/me");
  });

  it("does not double the slash when the base has a trailing one", async () => {
    const { apiUrl } = await loadApi({ NEXT_PUBLIC_API_BASE_URL: "http://api.test/" });
    stubBrowser();
    expect(apiUrl("/api/auth/me")).toBe("http://api.test/api/auth/me");
  });

  it("falls back to a relative /backend path when no base is configured", async () => {
    const { apiUrl } = await loadApi({
      NEXT_PUBLIC_API_BASE_URL: "",
      INTERNAL_API_BASE_URL: "",
    });
    stubBrowser();
    expect(apiUrl("/api/auth/me")).toBe("/backend/api/auth/me");
  });

  it("prefers the internal base on the server, where container DNS applies", async () => {
    // Under Docker Compose the browser reaches the API on localhost while the
    // Next server reaches it on the compose network. Picking the wrong one is
    // the classic way server-side rendering fails while the client works.
    const { apiUrl } = await loadApi({
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:8000",
      INTERNAL_API_BASE_URL: "http://backend:8000",
    });
    // no window stub: this is the server path
    expect(apiUrl("/api/scam-cases")).toBe("http://backend:8000/api/scam-cases");
  });

  it("falls back to the public base on the server when no internal one is set", async () => {
    const { apiUrl } = await loadApi({
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:8000",
      INTERNAL_API_BASE_URL: undefined,
    });
    expect(apiUrl("/api/scam-cases")).toBe("http://localhost:8000/api/scam-cases");
  });
});

describe("CSRF handling", () => {
  it("does not fetch a token for a safe method", async () => {
    const { fetchJson } = await loadApi({ NEXT_PUBLIC_API_BASE_URL: "http://api.test" });
    stubBrowser();

    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchJson("http://api.test/api/scam-cases");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("http://api.test/api/scam-cases");
  });

  it("fetches a token and attaches it to an unsafe method", async () => {
    const { fetchJson } = await loadApi({ NEXT_PUBLIC_API_BASE_URL: "http://api.test" });
    stubBrowser();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ csrf_token: "token-abc" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchJson("http://api.test/api/scam-cases", { method: "POST" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("http://api.test/api/auth/csrf");

    const headers = fetchMock.mock.calls[1][1].headers as Record<string, string>;
    expect(headers["X-CSRF-Token"]).toBe("token-abc");
  });

  it("caches the token across requests", async () => {
    const { fetchJson } = await loadApi({ NEXT_PUBLIC_API_BASE_URL: "http://api.test" });
    stubBrowser();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ csrf_token: "token-abc" }))
      .mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchJson("http://api.test/api/scam-cases", { method: "POST" });
    await fetchJson("http://api.test/api/scam-cases/1", { method: "PATCH" });

    // One token fetch, two writes -- not two token fetches.
    const tokenCalls = fetchMock.mock.calls.filter((c) => String(c[0]).includes("/api/auth/csrf"));
    expect(tokenCalls).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("clearCsrfToken forces the next write to fetch a fresh one", async () => {
    const { fetchJson, clearCsrfToken } = await loadApi({
      NEXT_PUBLIC_API_BASE_URL: "http://api.test",
    });
    stubBrowser();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ csrf_token: "first" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
      .mockResolvedValueOnce(jsonResponse({ csrf_token: "second" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchJson("http://api.test/api/scam-cases", { method: "POST" });
    clearCsrfToken();
    await fetchJson("http://api.test/api/scam-cases", { method: "POST" });

    const headers = fetchMock.mock.calls[3][1].headers as Record<string, string>;
    expect(headers["X-CSRF-Token"]).toBe("second");
  });

  it("exempts login and logout, which run before a session exists", async () => {
    const { fetchJson } = await loadApi({ NEXT_PUBLIC_API_BASE_URL: "http://api.test" });
    stubBrowser();

    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchJson("http://api.test/api/auth/login", { method: "POST" });
    await fetchJson("http://api.test/api/auth/logout", { method: "POST" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const call of fetchMock.mock.calls) {
      expect(String(call[0])).not.toContain("/api/auth/csrf");
    }
  });

  it("sends no token at all when rendering on the server", async () => {
    // There is no cookie jar server-side, so a CSRF round trip would only fail.
    const { fetchJson } = await loadApi({ NEXT_PUBLIC_API_BASE_URL: "http://api.test" });

    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchJson("http://api.test/api/scam-cases", { method: "POST" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers["X-CSRF-Token"]).toBeUndefined();
  });
});

describe("error handling", () => {
  it("surfaces the backend's detail field", async () => {
    const { fetchJson } = await loadApi({ NEXT_PUBLIC_API_BASE_URL: "http://api.test" });
    stubBrowser();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ detail: "Case is already closed." }, 409))
    );

    await expect(fetchJson("http://api.test/api/scam-cases/1")).rejects.toThrow(
      "Case is already closed."
    );
  });

  it("falls back to message, then to the status code", async () => {
    const { fetchJson } = await loadApi({ NEXT_PUBLIC_API_BASE_URL: "http://api.test" });
    stubBrowser();

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Nope" }, 400)));
    await expect(fetchJson("http://api.test/x")).rejects.toThrow("Nope");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 500)));
    await expect(fetchJson("http://api.test/x")).rejects.toThrow("Request failed with status 500");
  });

  it("survives an error body that is not JSON", async () => {
    // A proxy 502 returns HTML. Parsing it must not replace the real failure
    // with a JSON syntax error.
    const { fetchJson } = await loadApi({ NEXT_PUBLIC_API_BASE_URL: "http://api.test" });
    stubBrowser();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => {
          throw new SyntaxError("Unexpected token <");
        },
      } as unknown as Response)
    );

    await expect(fetchJson("http://api.test/x")).rejects.toThrow("Request failed with status 502");
  });

  it("announces a 401 so the app can send the user back to login", async () => {
    const { fetchJson } = await loadApi({ NEXT_PUBLIC_API_BASE_URL: "http://api.test" });
    const dispatchEvent = stubBrowser();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ detail: "Not authenticated" }, 401)));

    await expect(fetchJson("http://api.test/api/scam-cases")).rejects.toThrow();

    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    expect(dispatchEvent.mock.calls[0][0].type).toBe("aegis-auth-unauthorized");
  });

  it("drops the cached token on a 401, so the next write does not reuse a dead one", async () => {
    const { fetchJson } = await loadApi({ NEXT_PUBLIC_API_BASE_URL: "http://api.test" });
    stubBrowser();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ csrf_token: "stale" }))
      .mockResolvedValueOnce(jsonResponse({ detail: "Not authenticated" }, 401))
      .mockResolvedValueOnce(jsonResponse({ csrf_token: "fresh" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchJson("http://api.test/api/scam-cases", { method: "POST" })
    ).rejects.toThrow();
    await fetchJson("http://api.test/api/scam-cases", { method: "POST" });

    const headers = fetchMock.mock.calls[3][1].headers as Record<string, string>;
    expect(headers["X-CSRF-Token"]).toBe("fresh");
  });

  it("reports a readable failure when the token endpoint itself rejects", async () => {
    const { fetchJson } = await loadApi({ NEXT_PUBLIC_API_BASE_URL: "http://api.test" });
    stubBrowser();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 403)));

    await expect(
      fetchJson("http://api.test/api/scam-cases", { method: "POST" })
    ).rejects.toThrow("Unable to prepare secure request.");
  });
});

describe("request defaults", () => {
  it("always sends credentials, or the session cookie never arrives", async () => {
    const { fetchJson } = await loadApi({ NEXT_PUBLIC_API_BASE_URL: "http://api.test" });
    stubBrowser();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchJson("http://api.test/api/auth/me");

    expect(fetchMock.mock.calls[0][1].credentials).toBe("include");
  });

  it("lets a caller override the content type without losing the CSRF header", async () => {
    const { fetchJson } = await loadApi({ NEXT_PUBLIC_API_BASE_URL: "http://api.test" });
    stubBrowser();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ csrf_token: "t" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchJson("http://api.test/api/scam-cases", {
      method: "POST",
      headers: { "X-Trace": "abc" },
    });

    const headers = fetchMock.mock.calls[1][1].headers as Record<string, string>;
    expect(headers["X-Trace"]).toBe("abc");
    expect(headers["X-CSRF-Token"]).toBe("t");
    expect(headers["Content-Type"]).toBe("application/json");
  });
});
