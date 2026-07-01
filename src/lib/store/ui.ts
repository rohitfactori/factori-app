"use client";
import { create } from "zustand";

type UIState = {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  cmdkOpen: boolean;
  setCmdk: (b: boolean) => void;
};

export const useUI = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  cmdkOpen: false,
  setCmdk: (b) => set({ cmdkOpen: b }),
}));
