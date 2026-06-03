"use client";

import { useSim } from "./store";

export function useIsAdmin(): boolean {
  return useSim((s) => s.isAdmin);
}

export function setIsAdmin(value: boolean) {
  useSim.getState().setIsAdmin(value);
}
