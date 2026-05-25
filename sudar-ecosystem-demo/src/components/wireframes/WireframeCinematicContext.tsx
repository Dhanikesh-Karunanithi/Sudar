"use client";

import { createContext, useContext } from "react";
import type { DeviceLayout } from "@/types/sceneState";

export type WireframeCinematicValue = {
  cinematic: boolean;
  deviceLayout: DeviceLayout;
};

const defaultValue: WireframeCinematicValue = {
  cinematic: false,
  deviceLayout: "desktop",
};

const WireframeCinematicContext = createContext<WireframeCinematicValue>(defaultValue);

export function WireframeCinematicProvider({
  cinematic,
  deviceLayout = "desktop",
  children,
}: {
  cinematic?: boolean;
  deviceLayout?: DeviceLayout;
  children: React.ReactNode;
}) {
  return (
    <WireframeCinematicContext.Provider
      value={{ cinematic: !!cinematic, deviceLayout: deviceLayout ?? "desktop" }}
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
