import { defaultDroneProfile } from "./default";
import type { DroneProfile } from "./types";

export { defaultDroneProfile } from "./default";
export type { DroneProfile } from "./types";

export const droneProfiles = [defaultDroneProfile] as const satisfies readonly DroneProfile[];
export type DroneProfileId = (typeof droneProfiles)[number]["id"];

export function getDroneProfile(id: string): DroneProfile {
  return droneProfiles.find((profile) => profile.id === id) ?? defaultDroneProfile;
}
