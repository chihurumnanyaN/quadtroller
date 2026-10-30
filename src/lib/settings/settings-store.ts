import { defaultDroneProfile, droneProfiles, type DroneProfileId } from "@/lib/drone/profiles";

export type ControlMode = "mode1" | "mode2";
export type DroneSettings = {
  profileId: DroneProfileId;
  controlMode: ControlMode;
  sensitivity: number;
  leftHanded: boolean;
  invertAxes: boolean;
  haptics: boolean;
};

export const SETTINGS_KEY = "quadtroller.settings.v1";

export const defaultSettings: DroneSettings = {
  profileId: defaultDroneProfile.id,
  controlMode: "mode2",
  sensitivity: 65,
  leftHanded: false,
  invertAxes: false,
  haptics: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseSettings(value: unknown): DroneSettings {
  if (!isRecord(value)) return { ...defaultSettings };
  const oldAxes = isRecord(value.invertAxes) ? Object.values(value.invertAxes) : [];
  return {
    profileId: droneProfiles.some((profile) => profile.id === value.profileId)
      ? value.profileId as DroneProfileId
      : defaultSettings.profileId,
    controlMode: value.controlMode === "mode1" ? "mode1" : "mode2",
    sensitivity: typeof value.sensitivity === "number" ? Math.max(1, Math.min(100, value.sensitivity)) : defaultSettings.sensitivity,
    leftHanded: typeof value.leftHanded === "boolean" ? value.leftHanded : defaultSettings.leftHanded,
    invertAxes: typeof value.invertAxes === "boolean" ? value.invertAxes : oldAxes.length > 0 && oldAxes.every((axis) => axis === true),
    haptics: typeof value.haptics === "boolean" ? value.haptics : defaultSettings.haptics,
  };
}

export function readSettings(): DroneSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw ? parseSettings(JSON.parse(raw)) : { ...defaultSettings };
  } catch {
    return { ...defaultSettings };
  }
}

export function writeSettings(settings: DroneSettings) {
  try { window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* Storage may be unavailable in private contexts. */ }
}
