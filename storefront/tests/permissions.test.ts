import { describe, expect, it } from "vitest";
import {
  assertSuperAdminActor,
  canAccessAdmin,
  canEditContent,
  canUseWishlist,
  isSuperAdmin,
} from "@/lib/permissions";

describe("Role-Based Access Control (RBAC) permissions", () => {
  const superAdmin = {
    id: "usr_admin",
    email: "admin@voltnepal.com",
    role: "SUPER_ADMIN" as const,
    isActive: true,
  };

  const deactivatedAdmin = {
    id: "usr_admin_off",
    email: "oldadmin@voltnepal.com",
    role: "SUPER_ADMIN" as const,
    isActive: false,
  };

  const normalUser = {
    id: "usr_normal",
    email: "customer@example.com",
    role: "USER" as const,
    isActive: true,
  };

  it("grants Super Admin full CMS and inline editing access", () => {
    expect(isSuperAdmin(superAdmin)).toBe(true);
    expect(canAccessAdmin(superAdmin)).toBe(true);
    expect(canEditContent(superAdmin)).toBe(true);
    expect(canUseWishlist(superAdmin)).toBe(true);
  });

  it("allows Normal Users to use wishlist but blocks admin and CMS edits", () => {
    expect(isSuperAdmin(normalUser)).toBe(false);
    expect(canAccessAdmin(normalUser)).toBe(false);
    expect(canEditContent(normalUser)).toBe(false);
    expect(canUseWishlist(normalUser)).toBe(true);
  });

  it("blocks Guests from admin, editing, and wishlist", () => {
    expect(isSuperAdmin(null)).toBe(false);
    expect(canAccessAdmin(undefined)).toBe(false);
    expect(canEditContent(null)).toBe(false);
    expect(canUseWishlist(null)).toBe(false);
  });

  it("blocks deactivated Super Admin accounts", () => {
    expect(isSuperAdmin(deactivatedAdmin)).toBe(false);
    expect(canAccessAdmin(deactivatedAdmin)).toBe(false);
    expect(canUseWishlist(deactivatedAdmin)).toBe(false);
  });

  it("returns 401 for unauthenticated API requests and 403 for Normal Users", () => {
    const guestRes = assertSuperAdminActor(null);
    expect(guestRes.ok).toBe(false);
    if (!guestRes.ok) expect(guestRes.response.status).toBe(401);

    const userRes = assertSuperAdminActor(normalUser);
    expect(userRes.ok).toBe(false);
    if (!userRes.ok) expect(userRes.response.status).toBe(403);

    const adminRes = assertSuperAdminActor(superAdmin);
    expect(adminRes.ok).toBe(true);
    if (adminRes.ok) expect(adminRes.actor.email).toBe("admin@voltnepal.com");
  });
});
