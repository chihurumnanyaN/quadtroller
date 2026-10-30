import type { DroneProfile } from "./types";

export const defaultDroneProfile: DroneProfile = {
  id: "default",
  name: "Default",
  ip: "",
  ports: { control: null, video: null },
  packetLayout: {
    encoding: "unconfigured",
    controlFields: ["throttle", "yaw", "pitch", "roll"],
    commandField: null,
  },
  commandFlags: { takeoff: null, land: null, emergencyStop: null },
  videoFormat: "unconfigured",
};
