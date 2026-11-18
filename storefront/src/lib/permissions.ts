import { NextResponse } from "next/server";

export type AppRole = "SUPER_ADMIN" | "USER";

export interface SessionActor {
  id: string;
  email: string;
  name?: string | null;
  role: AppRole;
  isActive: boolean;
}

export function isSuperAdmin(user?: Partial<SessionActor> | null): boolean {
  return Boolean(user && user.isActive !== false && user.role === "SUPER_ADMIN");
}

export function canAccessAdmin(user?: Partial<SessionActor> | null): boolean {
  return isSuperAdmin(user);
}

export function canEditContent(user?: Partial<SessionActor> | null): boolean {
  return isSuperAdmin(user);
}

export function canUseWishlist(user?: Partial<SessionActor> | null): boolean {
  return Boolean(user && user.isActive !== false && (user.role === "USER" || user.role === "SUPER_ADMIN"));
}

export function assertSuperAdminActor(
  user?: Partial<SessionActor> | null,
): { ok: true; actor: SessionActor } | { ok: false; response: NextResponse } {
  if (!user || !user.id || !user.email) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Authentication required." }, { status: 401 }),
    };
  }
  if (!isSuperAdmin(user)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden: Super Admin access required." }, { status: 403 }),
    };
  }
  return {
    ok: true,
    actor: {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  };
}
