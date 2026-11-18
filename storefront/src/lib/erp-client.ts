import fs from "fs/promises";
import path from "path";

export function getErpApiBase(): string {
  return (process.env.ERP_API_BASE_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");
}

export function getErpPublicOrigin(): string {
  return (process.env.ERP_PUBLIC_ORIGIN || "http://127.0.0.1:8000").replace(/\/$/, "");
}

export function getErpFrontendUrl(): string {
  return (process.env.ERP_FRONTEND_URL || "/erp").replace(/\/$/, "");
}

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/uploads/")) {
    return url;
  }
  if (url.startsWith("/media/")) {
    return `${getErpPublicOrigin()}${url}`;
  }
  return url;
}

const memoryFallback = new Map<string, unknown>();
const CACHE_FILE = path.join(process.cwd(), ".data", "cms-fallback-cache.json");

async function readDiskFallback(): Promise<Record<string, unknown>> {
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function writeDiskFallback(key: string, data: unknown): Promise<void> {
  memoryFallback.set(key, data);
  try {
    const existing = await readDiskFallback();
    existing[key] = data;
    await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
    await fs.writeFile(CACHE_FILE, JSON.stringify(existing), "utf8");
  } catch {
    // Read-only serverless filesystem fallback: memory cache still protects availability
  }
}

export async function clearFallbackCache() {
  memoryFallback.clear();
  try {
    await fs.unlink(CACHE_FILE);
  } catch {
    // Ignore if absent
  }
}

export interface ErpFetchOptions {
  tags?: string[];
  revalidate?: number;
  previewToken?: string | null;
  fallbackValue: unknown;
}

/**
 * Fetches public CMS data from the Django ERP with Next.js cache tags and
 * automatic last-good cached fallback if the ERP is temporarily unreachable.
 */
export async function fetchErpPublic<T>(endpoint: string, options: ErpFetchOptions): Promise<T> {
  const cleanPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${getErpApiBase()}${cleanPath}`;
  const cacheKey = cleanPath;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (options.previewToken) {
    headers["X-Preview-Token"] = options.previewToken;
  }

  try {
    const fetchOpts: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {
      headers,
      signal: AbortSignal.timeout(5000),
    };

    if (options.previewToken) {
      fetchOpts.cache = "no-store";
    } else {
      fetchOpts.next = {
        revalidate: options.revalidate ?? 30,
        tags: options.tags ?? ["site"],
      };
    }

    const res = await fetch(url, fetchOpts);
    if (!res.ok) {
      throw new Error(`ERP returned HTTP ${res.status} for ${cleanPath}`);
    }
    const data = (await res.json()) as T;
    if (!options.previewToken) {
      await writeDiskFallback(cacheKey, data);
    }
    return data;
  } catch {
    if (memoryFallback.has(cacheKey)) {
      return memoryFallback.get(cacheKey) as T;
    }
    const disk = await readDiskFallback();
    if (disk[cacheKey] !== undefined) {
      memoryFallback.set(cacheKey, disk[cacheKey]);
      return disk[cacheKey] as T;
    }
    return options.fallbackValue as T;
  }
}
