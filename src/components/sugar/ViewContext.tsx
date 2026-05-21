"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type SugarViewMode = "thesis" | "personal";

interface SugarViewContextValue {
  mode: SugarViewMode;
  setMode: (m: SugarViewMode) => void;
}

const STORAGE_KEY = "sugar-view-mode";

const SugarViewContext = createContext<SugarViewContextValue>({
  mode: "thesis",
  setMode: () => {},
});

export function useSugarView() {
  return useContext(SugarViewContext);
}

export function SugarViewProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<SugarViewMode>("thesis");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "thesis" || stored === "personal") {
        setModeState(stored);
      }
    } catch {
      // ignore — incognito, etc.
    }
    setHydrated(true);
  }, []);

  const setMode = (m: SugarViewMode) => {
    setModeState(m);
    try {
      window.localStorage.setItem(STORAGE_KEY, m);
    } catch {
      // ignore
    }
  };

  // Until hydrated, render in default ("thesis") mode to keep SSR markup stable.
  const value: SugarViewContextValue = { mode: hydrated ? mode : "thesis", setMode };

  return <SugarViewContext.Provider value={value}>{children}</SugarViewContext.Provider>;
}
