"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createDroneClient, type DroneClientMode } from "@/lib/drone/create-drone-client";
import type { ConnectionState, ControlInput, DroneClient, DroneTelemetry } from "@/lib/drone/types";

type DroneContextValue = {
  client: DroneClient;
  state: ConnectionState;
  telemetry: DroneTelemetry;
  frame: string;
  message: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendControl: (input: ControlInput) => void;
  takeoff: () => Promise<void>;
  land: () => Promise<void>;
  emergencyStop: () => Promise<void>;
  takePhoto: () => Promise<void>;
  toggleRecording: () => Promise<void>;
  setSpeed: (speed: number) => void;
  setMode: (name: string, enabled: boolean) => void;
};

const idleTelemetry: DroneTelemetry = { battery: 86, signal: 0, altitude: 0, speed: 0, recording: false, photoCount: 0, flightMode: "STABLE" };
const DroneContext = createContext<DroneContextValue | null>(null);

export function DroneProvider({ children, mode = "demo" }: { children: ReactNode; mode?: DroneClientMode }) {
  const clientRef = useRef<DroneClient | null>(null);
  const modeRef = useRef(mode);
  if (!clientRef.current || modeRef.current !== mode) {
    clientRef.current = createDroneClient(mode);
    modeRef.current = mode;
  }
  const client = clientRef.current;
  const [state, setState] = useState<ConnectionState>("disconnected");
  const [telemetry, setTelemetry] = useState(idleTelemetry);
  const [frame, setFrame] = useState("/demo/frame-1.svg");
  const [message, setMessage] = useState("Demo ready. Connect to begin.");
  const connectionRef = useRef<ConnectionState>("disconnected");
  connectionRef.current = state;

  useEffect(() => {
    const cleanups = [
      client.subscribe("connection", setState),
      client.subscribe("battery", (battery) => setTelemetry((current) => ({ ...current, battery }))),
      client.subscribe("signal", (signal) => setTelemetry((current) => ({ ...current, signal }))),
      client.subscribe("telemetry", setTelemetry),
      client.subscribe("videoFrame", setFrame),
      client.subscribe("message", setMessage),
    ];
    return () => {
      cleanups.forEach((cleanup) => cleanup());
      if (connectionRef.current === "connected") void client.disconnect().catch(() => undefined);
    };
  }, [client]);

  const run = useCallback(async (action: () => Promise<void>) => {
    try { await action(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "The command could not be sent."); }
  }, []);

  const value = useMemo<DroneContextValue>(() => ({
    client, state, telemetry, frame, message,
    connect: () => run(() => client.connect()),
    disconnect: () => run(() => client.disconnect()),
    sendControl: (input) => client.sendControl(input),
    takeoff: () => run(() => client.takeoff()),
    land: () => run(() => client.land()),
    emergencyStop: () => run(() => client.emergencyStop()),
    takePhoto: () => run(() => client.takePhoto()),
    toggleRecording: () => run(() => telemetry.recording ? client.stopRecording() : client.startRecording()),
    setSpeed: (speed) => client.setSpeed(speed),
    setMode: (name, enabled) => client.setMode(name, enabled),
  }), [client, state, telemetry, frame, message, run]);

  return <DroneContext.Provider value={value}>{children}</DroneContext.Provider>;
}

export function useDrone() {
  const context = useContext(DroneContext);
  if (!context) throw new Error("useDrone must be used inside DroneProvider.");
  return context;
}
