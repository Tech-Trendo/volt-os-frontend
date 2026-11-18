import { create } from "zustand";
import type { Role } from "@/lib/permissions";
import { useUi } from "./ui";
import { getApiBaseUrl } from "@/services/config";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: Role;
  phone?: string;
  department?: string;
  is_superuser: boolean;
  is_staff: boolean;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  setUser: (user: AuthUser) => void;
  initialize: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  token:
    typeof window !== "undefined"
      ? localStorage.getItem("voltos_access_token") ||
        localStorage.getItem("techtrendo_access_token") ||
        localStorage.getItem("voltnepal_access_token")
      : null,
  refreshToken:
    typeof window !== "undefined"
      ? localStorage.getItem("voltos_refresh_token") ||
        localStorage.getItem("techtrendo_refresh_token") ||
        localStorage.getItem("voltnepal_refresh_token")
      : null,
  user:
    typeof window !== "undefined" &&
    (localStorage.getItem("voltos_user") ||
      localStorage.getItem("techtrendo_user") ||
      localStorage.getItem("voltnepal_user"))
      ? JSON.parse(
          (localStorage.getItem("voltos_user") ||
            localStorage.getItem("techtrendo_user") ||
            localStorage.getItem("voltnepal_user"))!,
        )
      : null,
  isAuthenticated:
    typeof window !== "undefined"
      ? !!(
          localStorage.getItem("voltos_access_token") ||
          localStorage.getItem("techtrendo_access_token") ||
          localStorage.getItem("voltnepal_access_token")
        )
      : false,
  isLoading: false,

  login: async (usernameOrEmail: string, password: string) => {
    set({ isLoading: true });
    const apiBase = getApiBaseUrl();
    try {
      const res = await fetch(`${apiBase}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username_or_email: usernameOrEmail, password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMsg =
          errorData.non_field_errors?.[0] ||
          errorData.detail ||
          errorData.message ||
          "Invalid credentials.";
        throw new Error(errMsg);
      }

      const data = await res.json();
      const user = data.user as AuthUser;

      if (typeof window !== "undefined") {
        localStorage.setItem("voltos_access_token", data.access);
        localStorage.setItem("voltos_refresh_token", data.refresh);
        localStorage.setItem("voltos_user", JSON.stringify(user));
        localStorage.setItem("techtrendo_access_token", data.access);
        localStorage.setItem("techtrendo_refresh_token", data.refresh);
        localStorage.setItem("techtrendo_user", JSON.stringify(user));
        localStorage.setItem("voltnepal_access_token", data.access);
        localStorage.setItem("voltnepal_refresh_token", data.refresh);
        localStorage.setItem("voltnepal_user", JSON.stringify(user));
      }

      set({
        token: data.access,
        refreshToken: data.refresh,
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      // Synchronize role with UI store
      if (user.role) {
        useUi.getState().setRole(user.role);
      }

      return user;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("voltos_access_token");
      localStorage.removeItem("voltos_refresh_token");
      localStorage.removeItem("voltos_user");
      localStorage.removeItem("techtrendo_access_token");
      localStorage.removeItem("techtrendo_refresh_token");
      localStorage.removeItem("techtrendo_user");
      localStorage.removeItem("voltnepal_access_token");
      localStorage.removeItem("voltnepal_refresh_token");
      localStorage.removeItem("voltnepal_user");
    }
    set({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  },

  setUser: (user: AuthUser) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("voltnepal_user", JSON.stringify(user));
    }
    set({ user });
    if (user.role) {
      useUi.getState().setRole(user.role);
    }
  },

  initialize: async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("voltnepal_access_token") : null;
    if (!token) return;

    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/auth/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
        set({ user, isAuthenticated: true });
        if (user.role) {
          useUi.getState().setRole(user.role);
        }
      } else if (res.status === 401) {
        get().logout();
      }
    } catch {
      // Offline or network error - keep cached user
    }
  },
}));
