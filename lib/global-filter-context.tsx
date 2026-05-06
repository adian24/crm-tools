"use client";

import React, { createContext, useContext, useState } from "react";

interface GlobalFilterCtx {
  month: number;
  year: number;
  setMonth: (m: number) => void;
  setYear: (y: number) => void;
}

const GlobalFilterContext = createContext<GlobalFilterCtx | undefined>(undefined);

export function GlobalFilterProvider({ children }: { children: React.ReactNode }) {
  const now   = new Date();
  const prev  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const [month, setMonth] = useState(prev.getMonth() + 1);
  const [year,  setYear]  = useState(prev.getFullYear());

  return (
    <GlobalFilterContext.Provider value={{ month, year, setMonth, setYear }}>
      {children}
    </GlobalFilterContext.Provider>
  );
}

export function useGlobalFilter() {
  const ctx = useContext(GlobalFilterContext);
  if (!ctx) throw new Error("useGlobalFilter must be inside GlobalFilterProvider");
  return ctx;
}
