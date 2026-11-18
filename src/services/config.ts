export const useMock = import.meta.env["VITE_USE_MOCK"] === "true";

export function getApiBaseUrl(): string {
  // Browser environment
  if (typeof window !== "undefined") {
    // If in Vitest test runner
    if (typeof process !== "undefined" && process.env?.["VITEST"]) {
      return "http://127.0.0.1:8000/api";
    }

    const host = window.location.hostname;
    const configured = import.meta.env["VITE_API_BASE_URL"];

    if (configured && configured.startsWith("/")) {
      return configured;
    }

    if (configured && (configured.includes("localhost") || configured.includes("127.0.0.1"))) {
      if (host !== "localhost" && host !== "127.0.0.1") {
        return configured.replace(/localhost|127\.0\.0\.1/, host);
      }
    }

    return configured || "/api";
  }

  // Server-side (SSR / Node.js)
  return "http://127.0.0.1:8000/api";
}

export async function delay() {
  if (useMock && typeof window !== "undefined") {
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.floor(Math.random() * 500)));
  }
}

export async function rest<T>(path: string, options?: RequestInit): Promise<T> {
  const base = getApiBaseUrl();

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("voltos_access_token") ||
        localStorage.getItem("techtrendo_access_token") ||
        localStorage.getItem("voltnepal_access_token")
      : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  };

  let url: string;
  if (path.startsWith("http")) {
    url = path;
  } else {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    if (base.startsWith("/")) {
      // Relative URL for browser, but if SSR (Node), prefix localhost
      if (typeof window === "undefined") {
        url = `http://127.0.0.1:8000${base}${cleanPath}`.replace(/\/api\/api/, "/api");
      } else {
        url = `${base}${cleanPath}`.replace(/\/api\/api/, "/api");
      }
    } else {
      url = `${base}${cleanPath}`.replace(/\/api\/api/, "/api");
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorDetails = `Request failed (${response.status})`;
      try {
        const errJson = await response.json();
        errorDetails =
          (typeof errJson.error === "object" && errJson.error !== null
            ? errJson.error.message || JSON.stringify(errJson.error.details || errJson.error)
            : errJson.error) ||
          errJson.detail ||
          errJson.message ||
          errorDetails;
      } catch {
        // ignored
      }
      throw new Error(errorDetails);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (err: unknown) {
    if (typeof window !== "undefined" && url.startsWith("/")) {
      try {
        const fallbackUrl = `http://${window.location.hostname}:8000${url}`;
        const fbRes = await fetch(fallbackUrl, { ...options, headers });
        if (fbRes.ok) {
          if (fbRes.status === 204) return {} as T;
          return (await fbRes.json()) as T;
        }
      } catch {
        // Fallback also failed, rethrow original
      }
    }
    throw err;
  }
}
