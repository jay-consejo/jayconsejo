"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export type SofiaStatus =
  | "idle"
  | "signing"
  | "talking"
  | "locked"
  | "already_contacted"
  | "error";

type Ctx = {
  status: SofiaStatus;
  setStatus: Dispatch<SetStateAction<SofiaStatus>>;
};

const SofiaStateContext = createContext<Ctx | null>(null);

export function SofiaStateProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SofiaStatus>("idle");
  return (
    <SofiaStateContext.Provider value={{ status, setStatus }}>
      {children}
    </SofiaStateContext.Provider>
  );
}

export function useSofiaState(): Ctx {
  const ctx = useContext(SofiaStateContext);
  if (!ctx) throw new Error("useSofiaState must be used inside SofiaStateProvider");
  return ctx;
}
