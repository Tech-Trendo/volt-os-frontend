import { create } from "zustand";
import type { Role } from "@/lib/permissions";
interface UiState {
  collapsed: boolean;
  mobileOpen: boolean;
  language: "en" | "ne";
  role: Role;
  toggleSidebar: () => void;
  setMobileOpen: (open: boolean) => void;
  setLanguage: (language: "en" | "ne") => void;
  setRole: (role: Role) => void;
}
export const useUi = create<UiState>((set) => ({
  collapsed: false,
  mobileOpen: false,
  language: "en",
  role: "Super Administrator",
  toggleSidebar: () =>
    set((s) =>
      typeof window !== "undefined" && window.innerWidth <= 1100
        ? { collapsed: false, mobileOpen: !s.mobileOpen }
        : { collapsed: !s.collapsed, mobileOpen: false },
    ),
  setMobileOpen: (mobileOpen) => set({ mobileOpen }),
  setLanguage: (language) => set({ language }),
  setRole: (role) => set({ role }),
}));
