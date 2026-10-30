import type { ControlInput, DroneClient, DroneEventMap, DroneTelemetry, TrimAxis, Unsubscribe } from "./types";

type Listener<K extends keyof DroneEventMap> = (value: DroneEventMap[K]) => void;

const initialTelemetry: DroneTelemetry = {
  battery: 86,
  signal: 98,
  altitude: 0,
  speed: 0,
  recording: false,
  photoCount: 0,
  flightMode: "STABLE",
};

export class DemoDroneClient implements DroneClient {
  readonly mode = "demo" as const;
  private listeners = new Map<keyof DroneEventMap, Set<(value: never) => void>>();
  private telemetry: DroneTelemetry = { ...initialTelemetry };
  private connected = false;
  private airborne = false;
  private input: ControlInput = { throttle: 0, yaw: 0, pitch: 0, roll: 0 };
  private tick = 0;
  private interval: ReturnType<typeof setInterval> | undefined;
  private frame = 0;
  private speedPercent = 50;
  private controlLoopActive = false;

  subscribe<K extends keyof DroneEventMap>(event: K, listener: Listener<K>): Unsubscribe {
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(listener as (value: never) => void);
    this.listeners.set(event, listeners);
    return () => listeners.delete(listener as (value: never) => void);
  }

  private emit<K extends keyof DroneEventMap>(event: K, value: DroneEventMap[K]) {
    this.listeners.get(event)?.forEach((listener) => listener(value as never));
  }

  private updateTelemetry() {
    const altitude = this.airborne ? Math.max(1.2, Math.min(12, this.telemetry.altitude + this.input.throttle * 0.18)) : 0;
    this.telemetry = {
      ...this.telemetry,
      altitude: Number(altitude.toFixed(1)),
      speed: Number((Math.hypot(this.input.pitch, this.input.roll) * (this.airborne ? this.speedPercent * 0.08 : 0)).toFixed(1)),
      battery: Math.max(1, this.telemetry.battery - (this.airborne ? 0.008 : 0.001)),
    };
    this.emit("battery", Math.round(this.telemetry.battery));
    this.emit("telemetry", this.telemetry);
  }

  async connect() {
    this.emit("connection", "connecting");
    await new Promise((resolve) => setTimeout(resolve, 800));
    this.connected = true;
    this.telemetry = { ...initialTelemetry };
    this.emit("connection", "connected");
    this.emit("message", "Link ready. Take your time.");
    if (!this.interval) {
      this.interval = setInterval(() => {
        if (!this.connected) return;
        this.tick += 1;
        const signal = Math.round(96 + Math.sin(this.tick / 4) * 3);
        this.telemetry = { ...this.telemetry, signal };
        this.emit("signal", signal);
        this.emit("videoFrame", `/demo/frame-${(this.frame++ % 4) + 1}.svg`);
        this.updateTelemetry();
      }, 900);
    }
    this.emit("videoFrame", "/demo/frame-1.svg");
  }

  async disconnect() {
    this.neutralizeControls();
    this.connected = false;
    this.airborne = false;
    this.input = { throttle: 0, yaw: 0, pitch: 0, roll: 0 };
    this.telemetry = { ...this.telemetry, altitude: 0, speed: 0, recording: false, flightMode: "STABLE" };
    this.emit("connection", "disconnected");
    this.emit("telemetry", this.telemetry);
    this.emit("message", "Disconnected. Drone controls are idle.");
  }

  sendControl(input: ControlInput) { this.input = input; this.controlLoopActive = true; }
  neutralizeControls() {
    if (!this.controlLoopActive) return;
    this.input = { throttle: 0, yaw: 0, pitch: 0, roll: 0 };
    this.controlLoopActive = false;
  }

  async takeoff() {
    if (!this.connected) throw new Error("Connect the demo drone before takeoff.");
    this.airborne = true;
    this.telemetry = { ...this.telemetry, altitude: 1.2 };
    this.emit("telemetry", this.telemetry);
    this.emit("message", "Takeoff complete. Hover is stable.");
  }

  async land() {
    this.airborne = false;
    this.input = { ...this.input, throttle: 0 };
    this.telemetry = { ...this.telemetry, altitude: 0, speed: 0 };
    this.emit("telemetry", this.telemetry);
    this.emit("message", "Landed. Motors are idle.");
  }

  async emergencyStop() {
    this.airborne = false;
    this.input = { throttle: 0, yaw: 0, pitch: 0, roll: 0 };
    this.controlLoopActive = false;
    this.telemetry = { ...this.telemetry, altitude: 0, speed: 0, recording: false };
    this.emit("telemetry", this.telemetry);
    this.emit("message", "Motors stopped. The drone is safe.");
  }

  setTrim(_axis: TrimAxis, _value: number) {}
  setMode(name: string, enabled: boolean) {
    this.telemetry = { ...this.telemetry, flightMode: enabled ? name.toUpperCase() : "STABLE" };
    this.emit("telemetry", this.telemetry);
  }
  setSpeed(percent: number) { this.speedPercent = percent; }

  async takePhoto() {
    this.telemetry = { ...this.telemetry, photoCount: this.telemetry.photoCount + 1 };
    this.emit("telemetry", this.telemetry);
    this.emit("message", `Photo saved · ${this.telemetry.photoCount} captured`);
  }
  async startRecording() {
    this.telemetry = { ...this.telemetry, recording: true };
    this.emit("telemetry", this.telemetry);
    this.emit("message", "Recording started.");
  }
  async stopRecording() {
    this.telemetry = { ...this.telemetry, recording: false };
    this.emit("telemetry", this.telemetry);
    this.emit("message", "Recording saved to demo gallery.");
  }

  getTelemetry() { return this.telemetry; }
}
