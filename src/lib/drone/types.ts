export type Axis = "throttle" | "yaw" | "pitch" | "roll";
export type TrimAxis = Axis;
export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

export type ControlInput = Record<Axis, number>;
export type DroneClientMode = "demo" | "native";

export type DroneTelemetry = {
  battery: number;
  signal: number;
  altitude: number;
  speed: number;
  recording: boolean;
  photoCount: number;
  flightMode: string;
};

export type DroneEventMap = {
  connection: ConnectionState;
  battery: number;
  signal: number;
  videoFrame: string;
  telemetry: DroneTelemetry;
  message: string;
};

export type Unsubscribe = () => void;

export interface DroneClient {
  readonly mode: DroneClientMode;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendControl(input: ControlInput): void;
  neutralizeControls(): void;
  takeoff(): Promise<void>;
  land(): Promise<void>;
  emergencyStop(): Promise<void>;
  setTrim(axis: TrimAxis, value: number): void;
  setMode(name: string, enabled: boolean): void;
  setSpeed(percent: number): void;
  takePhoto(): Promise<void>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<void>;
  subscribe<K extends keyof DroneEventMap>(event: K, listener: (value: DroneEventMap[K]) => void): Unsubscribe;
}
