"use client";

import { createContext, useContext } from "react";
import type { DeviceLayout } from "@/types/sceneState";

export type WireframeCinematicValue = {
  cinematic: boolean;
  heroViewport: boolean;
  deviceLayout: DeviceLayout;
};

const defaultValue: WireframeCinematicValue = {
  cinematic: false,
  heroViewport: false,
  deviceLayout: "desktop",
};

const WireframeCinematicContext = createContext<WireframeCinematicValue>(defaultValue);

export function WireframeCinematicProvider({
  cinematic,
  heroViewport = false,
  deviceLayout = "desktop",
  children,
}: {
  cinematic?: boolean;
  heroViewport?: boolean;
  deviceLayout?: DeviceLayout;
  children: React.ReactNode;
}) {
  return (
    <WireframeCinematicContext.Provider
      value={{
        cinematic: !!cinematic,
        heroViewport: !!heroViewport,
        deviceLayout: deviceLayout ?? "desktop",
      }}
    >
      {children}
    </WireframeCinematicContext.Provider>
  );
}

export function useWireframeCinematic() {
  return useContext(WireframeCinematicContext).cinematic;
}

export function useDeviceLayout() {
  return useContext(WireframeCinematicContext).deviceLayout;
}

export function useHeroViewport() {
  return useContext(WireframeCinematicContext).heroViewport;
}
