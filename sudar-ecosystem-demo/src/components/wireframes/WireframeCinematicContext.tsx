"use client";

import { createContext, useContext } from "react";

const WireframeCinematicContext = createContext(false);

export function WireframeCinematicProvider({
  cinematic,
  children,
}: {
  cinematic?: boolean;
  children: React.ReactNode;
}) {
  return (
    <WireframeCinematicContext.Provider value={!!cinematic}>
      {children}
    </WireframeCinematicContext.Provider>
  );
}

export function useWireframeCinematic() {
  return useContext(WireframeCinematicContext);
}
