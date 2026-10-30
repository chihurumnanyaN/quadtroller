import { DemoDroneClient } from "./demo-drone-client";
import { NativeDroneClient } from "./native-drone-client";
import type { DroneClient, DroneClientMode } from "./types";

export type { DroneClientMode } from "./types";

export function createDroneClient(mode: DroneClientMode): DroneClient {
  return mode === "native" ? new NativeDroneClient() : new DemoDroneClient();
}
