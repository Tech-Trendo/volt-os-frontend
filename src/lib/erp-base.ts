export const isEmbeddedSpa = import.meta.env["VITE_ERP_SPA"] === "true";

export const erpBasePath = (
  (import.meta.env["VITE_ERP_BASE_PATH"] as string | undefined) || ""
).replace(/\/$/, "");

export function stripErpBase(pathname: string): string {
  if (!erpBasePath) return pathname || "/";
  if (pathname === erpBasePath) return "/";
  if (pathname.startsWith(`${erpBasePath}/`)) {
    return pathname.slice(erpBasePath.length) || "/";
  }
  return pathname || "/";
}

export function getPublicStorefrontUrl(): string {
  if (isEmbeddedSpa) return "/";
  return (
    (import.meta.env["VITE_STOREFRONT_URL"] as string | undefined) || "http://localhost:3001"
  ).replace(/\/$/, "");
}
