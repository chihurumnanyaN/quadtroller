"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MdArrowDownward, MdCameraAlt, MdRadioButtonChecked, MdRocketLaunch } from "react-icons/md";
import { PressableButton } from "@/components/ui/pressable-button";

export function FlightDock({ speed, airborne, recording, connected, onSpeed, onFlightAction, onPhoto, onRecord }: {
  speed: number;
  airborne: boolean;
  recording: boolean;
  connected: boolean;
  onSpeed: () => void;
  onFlightAction: () => void;
  onPhoto: () => void;
  onRecord: () => void;
}) {
  const reducedMotion = useReducedMotion();
  return <div className="hud-dock-group">
    <PressableButton className="hud-speed hud-control" onClick={onSpeed} aria-label={`Speed ${speed} percent. Change speed`}><span>{speed}</span></PressableButton>
    <div className="hud-dock hud-control">
      <PressableButton className="hud-dock-action" onClick={onPhoto} disabled={!connected} aria-label="Take photo"><MdCameraAlt size={24} /></PressableButton>
      <PressableButton className={`hud-flight-action${airborne ? " is-land" : ""}`} onClick={onFlightAction} disabled={!connected} aria-label={airborne ? "Land" : "Take off"} hapticWeight="medium">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={airborne ? "land" : "takeoff"} initial={reducedMotion ? false : { scale: 0.65, rotate: airborne ? -25 : 25, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} exit={reducedMotion ? undefined : { scale: 0.65, rotate: airborne ? 25 : -25, opacity: 0 }} transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 26 }}>
            {airborne ? <MdArrowDownward size={32} /> : <MdRocketLaunch size={32} />}
          </motion.span>
        </AnimatePresence>
      </PressableButton>
      <PressableButton className={`hud-dock-action${recording ? " is-recording" : ""}`} onClick={onRecord} disabled={!connected} aria-label={recording ? "Stop recording" : "Start recording"}><MdRadioButtonChecked size={24} /></PressableButton>
    </div>
  </div>;
}
