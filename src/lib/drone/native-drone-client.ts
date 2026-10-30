import { Capacitor, registerPlugin } from "@capacitor/core";
import { getDroneProfile } from "./profiles";
import { readSettings } from "@/lib/settings/settings-store";
import type { ControlInput, DroneClient, DroneEventMap, TrimAxis, Unsubscribe } from "./types";

type NativePlugin = {
  connect(options: { profile: ReturnType<typeof getDroneProfile> }): Promise<void>;
  disconnect(): Promise<void>;
  sendControl(input: ControlInput): Promise<void>;
  takeoff(): Promise<void>;
  land(): Promise<void>;
  emergencyStop(): Promise<void>;
  setTrim(options: { axis: TrimAxis; value: number }): Promise<void>;
  setMode(options: { name: string; enabled: boolean }): Promise<void>;
  setSpeed(options: { percent: number }): Promise<void>;
  takePhoto(): Promise<void>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<void>;
  addListener(event: string, listener: (payload: unknown) => void): Promise<{ remove(): Promise<void> }>;
};

const QuadtrollerDrone = registerPlugin<NativePlugin>("QuadtrollerDrone");

/** Native bridge contract. Register QuadtrollerDrone through Capacitor when the Android plugin is implemented. */
export class NativeDroneClient implements DroneClient {
  readonly mode = "native" as const;
  private listeners = new Map<keyof DroneEventMap, Set<(value: never) => void>>();
  private nativeListeners: Array<{ remove(): Promise<void> }> = [];
  private controlStreamActive = false;

  private plugin() {
    if (!Capacitor.isNativePlatform()) throw new Error("Native drone controls are only available in the Android app.");
    if (!Capacitor.isPluginAvailable("QuadtrollerDrone")) throw new Error("The QuadtrollerDrone Capacitor plugin is not installed.");
    return QuadtrollerDrone;
  }

  subscribe<K extends keyof DroneEventMap>(event: K, listener: (value: DroneEventMap[K]) => void): Unsubscribe {
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(listener as (value: never) => void);
    this.listeners.set(event, listeners);
    return () => listeners.delete(listener as (value: never) => void);
  }

  private emit<K extends keyof DroneEventMap>(event: K, value: DroneEventMap[K]) {
    this.listeners.get(event)?.forEach((listener) => listener(value as never));
  }

  async connect() {
    this.emit("connection", "connecting");
    try {
      const plugin = this.plugin();
      const eventMap = { connectionState: "connection", battery: "battery", signal: "signal", videoFrame: "videoFrame", telemetry: "telemetry", message: "message" } as const;
      for (const [nativeEvent, appEvent] of Object.entries(eventMap)) {
        this.nativeListeners.push(await plugin.addListener(nativeEvent, (payload) => {
          if (appEvent === "connection" && payload !== "connected") this.neutralizeControls();
          this.emit(appEvent, payload as never);
        }));
      }
      await plugin.connect({ profile: getDroneProfile(readSettings().profileId) });
      this.emit("connection", "connected");
    } catch (error) {
      this.emit("connection", "error");
      throw error;
    }
  }
  async disconnect() {
    this.neutralizeControls();
    await this.plugin().disconnect();
    await Promise.all(this.nativeListeners.map((listener) => listener.remove()));
    this.nativeListeners = [];
    this.emit("connection", "disconnected");
  }
  sendControl(input: ControlInput) {
    this.controlStreamActive = true;
    try { void this.plugin().sendControl(input).catch(() => undefined); } catch { /* The native link may disappear between ticks. */ }
  }
  neutralizeControls() {
    if (!this.controlStreamActive) return;
    this.controlStreamActive = false;
    try {
      void this.plugin().sendControl({ throttle: 0, yaw: 0, pitch: 0, roll: 0 }).catch(() => undefined);
    } catch { /* A dropped native bridge cannot accept another packet. */ }
  }
  takeoff() { return this.plugin().takeoff(); }
  land() { return this.plugin().land(); }
  emergencyStop() { return this.plugin().emergencyStop(); }
  setTrim(axis: TrimAxis, value: number) { void this.plugin().setTrim({ axis, value }); }
  setMode(name: string, enabled: boolean) { void this.plugin().setMode({ name, enabled }); }
  setSpeed(percent: number) { void this.plugin().setSpeed({ percent }); }
  takePhoto() { return this.plugin().takePhoto(); }
  startRecording() { return this.plugin().startRecording(); }
  stopRecording() { return this.plugin().stopRecording(); }
}
