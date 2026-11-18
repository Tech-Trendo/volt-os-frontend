export const roles = [
  "Super Administrator",
  "Management",
  "Sales Manager",
  "Inventory Manager",
  "Project Manager",
  "Service Manager",
  "Accountant",
  "Report Viewer",
] as const;
export type Role = (typeof roles)[number];
export interface RolePolicy {
  finance: boolean;
  modules: Record<string, { view: boolean; edit: boolean }>;
}
export type DemoPolicy = RolePolicy;
const overrides: Partial<Record<Role, RolePolicy>> = {};
export function saveRolePermissions(role: Role, policy: RolePolicy) {
  if (role === "Super Administrator") return;
  overrides[role] = structuredClone(policy);
}
export const saveDemoPermissions = saveRolePermissions;
export function financeAccess(role: Role) {
  return (
    overrides[role]?.finance ?? ["Super Administrator", "Management", "Accountant"].includes(role)
  );
}
export function canEdit(role: Role, domain: string) {
  if (role === "Report Viewer") return false;
  if (role === "Super Administrator") return true;
  const override = overrides[role]?.modules[domain];
  if (override) return override.edit;
  if (role === "Management") return true;
  const permissions: Partial<Record<Role, string[]>> = {
    "Sales Manager": ["sales"],
    "Inventory Manager": ["inventory", "procurement"],
    "Project Manager": ["projects", "network"],
    "Service Manager": ["service", "network"],
    Accountant: ["finance"],
  };
  return permissions[role]?.includes(domain) ?? false;
}
export function canView(role: Role, domain: string) {
  if (role === "Super Administrator") return true;
  const override = overrides[role]?.modules[domain];
  if (override) return override.view;
  if (["Management", "Report Viewer"].includes(role)) return true;
  if (domain === "overview" || domain === "network" || domain === "reports") return true;
  return canEdit(role, domain);
}
