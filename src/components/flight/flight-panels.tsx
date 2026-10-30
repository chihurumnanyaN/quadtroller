"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Md3dRotation, MdExplore, MdFlip, MdFlipCameraAndroid, MdGpsFixed, MdKeyboardArrowDown, MdKeyboardArrowLeft, MdKeyboardArrowRight, MdKeyboardArrowUp, MdTune, MdViewInAr, MdClose } from "react-icons/md";
import { PressableButton } from "@/components/ui/pressable-button";
import type { Axis } from "@/lib/drone/types";

const modes = [
  { name: "altitude-hold", label: "Altitude hold", Icon: MdGpsFixed },
  { name: "headless", label: "Headless mode", Icon: MdExplore },
  { name: "gyro-control", label: "Gyro control", Icon: Md3dRotation },
  { name: "flip-360", label: "360 flip", Icon: MdFlip },
  { name: "reverse-video", label: "Mirror video", Icon: MdFlipCameraAndroid },
  { name: "vr-split-view", label: "VR view", Icon: MdViewInAr },
] as const;

export function ModesPanel({ values, onChange, onTrim, onClose }: {
  values: Record<string, boolean>;
  onChange: (name: string, enabled: boolean) => void;
  onTrim: (axis: Axis, value: number) => void;
  onClose: () => void;
}) {
  const [trimOpen, setTrimOpen] = useState(false);
  const [trim, setTrim] = useState({ pitch: 0, roll: 0 });
  const reducedMotion = useReducedMotion();
  const spring = reducedMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 500, damping: 26, mass: 0.8 };
  const nudge = (axis: "pitch" | "roll", amount: number) => {
    const value = Math.max(-50, Math.min(50, trim[axis] + amount));
    setTrim((current) => ({ ...current, [axis]: value }));
    onTrim(axis, value);
  };

  return <>
    <motion.button className="hud-sheet-backdrop" aria-label="Close flight modes" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
    <motion.aside
      className="hud-sheet"
      role="dialog"
      aria-label={trimOpen ? "Trim controls" : "Flight modes"}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={spring}
    >
      <div className="hud-sheet-header"><PressableButton className="hud-icon-button" onClick={trimOpen ? () => setTrimOpen(false) : onClose} aria-label={trimOpen ? "Back to modes" : "Close modes"}><MdClose size={24} /></PressableButton></div>
      {!trimOpen ? <div className="hud-mode-grid">
        {modes.map(({ name, label, Icon }) => <PressableButton key={name} className={`hud-mode-tile${values[name] ? " is-active" : ""}`} aria-label={label} aria-pressed={values[name] ?? false} onClick={() => onChange(name, !(values[name] ?? false))}><Icon size={24} /></PressableButton>)}
        <PressableButton className="hud-mode-tile" aria-label="Open trim controls" onClick={() => setTrimOpen(true)}><MdTune size={24} /></PressableButton>
      </div> : <div className="hud-trim-pad" aria-label="Trim adjustment">
        <PressableButton className="hud-trim-arrow hud-trim-up" aria-label="Increase pitch trim" onClick={() => nudge("pitch", 5)}><MdKeyboardArrowUp size={24} /></PressableButton>
        <PressableButton className="hud-trim-arrow hud-trim-left" aria-label="Decrease roll trim" onClick={() => nudge("roll", -5)}><MdKeyboardArrowLeft size={24} /></PressableButton>
        <span className="hud-trim-center"><MdTune size={24} /></span>
        <PressableButton className="hud-trim-arrow hud-trim-right" aria-label="Increase roll trim" onClick={() => nudge("roll", 5)}><MdKeyboardArrowRight size={24} /></PressableButton>
        <PressableButton className="hud-trim-arrow hud-trim-down" aria-label="Decrease pitch trim" onClick={() => nudge("pitch", -5)}><MdKeyboardArrowDown size={24} /></PressableButton>
      </div>}
    </motion.aside>
  </>;
}
