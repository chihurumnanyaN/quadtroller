"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { MdArrowBack, MdBatteryAlert, MdBatteryFull, MdGridView, MdSignalCellularAlt, MdStop } from "react-icons/md";
import { PressableButton } from "@/components/ui/pressable-button";
import type { DroneTelemetry } from "@/lib/drone/types";
import { haptic } from "@/lib/theme/haptics";

export function FlightTopbar({ telemetry, onModes, onStop }: {
  telemetry: DroneTelemetry;
  onModes: () => void;
  onStop: () => void;
}) {
  const lowBatteryHapticRef = useRef(false);
  const lowBattery = telemetry.battery <= 20;

  useEffect(() => {
    if (lowBattery && !lowBatteryHapticRef.current) {
      lowBatteryHapticRef.current = true;
      void haptic("heavy");
    } else if (!lowBattery) {
      lowBatteryHapticRef.current = false;
    }
  }, [lowBattery]);

  return <>
    <Link href="/" className="hud-back hud-control" aria-label="Back to home"><MdArrowBack size={24} /></Link>
    <div className="hud-status hud-control" aria-label={`Battery ${Math.round(telemetry.battery)} percent, signal ${telemetry.signal} percent`}>
      <span>{lowBattery ? <MdBatteryAlert size={24} /> : <MdBatteryFull size={24} />}<b>{Math.round(telemetry.battery)}%</b></span>
      <span><MdSignalCellularAlt size={24} /><b>{telemetry.signal}%</b></span>
    </div>
    <div className="hud-top-actions">
      <PressableButton className="hud-icon-button hud-control" onClick={onModes} aria-label="Open flight modes"><MdGridView size={24} /></PressableButton>
      <PressableButton className="hud-stop" onClick={onStop} aria-label="Emergency stop" hapticWeight="heavy"><MdStop size={24} /></PressableButton>
    </div>
  </>;
}
