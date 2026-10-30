import type { Axis } from "../types";

export type DroneProfile = {
  readonly id: string;
  readonly name: string;
  readonly ip: string;
  readonly ports: {
    readonly control: number | null;
    readonly video: number | null;
  };
  readonly packetLayout: {
    readonly encoding: "unconfigured" | "json" | "binary";
    readonly controlFields: readonly Axis[];
    readonly commandField: string | null;
  };
  readonly commandFlags: {
    readonly takeoff: number | null;
    readonly land: number | null;
    readonly emergencyStop: number | null;
  };
  readonly videoFormat: "unconfigured" | "mjpeg" | "h264" | "jpeg";
};
