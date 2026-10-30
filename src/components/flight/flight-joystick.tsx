"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MdArrowDownward, MdKeyboardArrowDown, MdKeyboardArrowLeft, MdKeyboardArrowRight, MdKeyboardArrowUp, MdRocketLaunch } from "react-icons/md";
import { PressableButton } from "@/components/ui/pressable-button";
import type { Axis } from "@/lib/drone/types";

type StickPosition = { x: number; y: number };
const zero = { x: 0, y: 0 };

export function FlightJoystick({ side, xAxis, yAxis, action, disabled, autoCentreThrottle, resetKey, onPosition, onTouch, onAction }: {
  side: "left" | "right";
  xAxis: Axis;
  yAxis: Axis;
  action: "takeoff" | "land";
  disabled: boolean;
  autoCentreThrottle: boolean;
  resetKey: number;
  onPosition: (axisX: Axis, axisY: Axis, position: StickPosition) => void;
  onTouch: () => void;
  onAction: (action: "takeoff" | "land") => void;
}) {
  const stickRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<number | null>(null);
  const currentRef = useRef<StickPosition>(zero);
  const reducedMotion = useReducedMotion();
  const [position, setPosition] = useState<StickPosition>(zero);
  const [dragging, setDragging] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (pointerRef.current !== null) return;
    currentRef.current = zero;
    setPosition(zero);
    onPosition(xAxis, yAxis, zero);
  }, [resetKey, xAxis, yAxis, onPosition]);

  const updateFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = stickRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const radius = Math.min(bounds.width, bounds.height) * 0.32;
    const dx = (event.clientX - (bounds.left + bounds.width / 2)) / radius;
    const dy = (event.clientY - (bounds.top + bounds.height / 2)) / radius;
    const magnitude = Math.hypot(dx, dy);
    const scale = magnitude > 1 ? 1 / magnitude : 1;
    const next = { x: dx * scale, y: dy * scale };
    currentRef.current = next;
    setPosition(next);
    onPosition(xAxis, yAxis, next);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerRef.current !== null) return;
    event.preventDefault();
    onTouch();
    setTouched(true);
    setDragging(true);
    pointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerRef.current === event.pointerId) updateFromPointer(event);
  };
  const onPointerRelease = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerRef.current !== event.pointerId) return;
    pointerRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const next = yAxis === "throttle" && !autoCentreThrottle ? { x: 0, y: currentRef.current.y } : zero;
    currentRef.current = next;
    setPosition(next);
    onPosition(xAxis, yAxis, next);
  };

  const spring = reducedMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 500, damping: 26 };
  const travel = stickRef.current ? Math.min(stickRef.current.clientWidth, stickRef.current.clientHeight) * 0.32 : 48;
  const chevronOpacity = touched ? 0 : 0.24;

  return <div className={`hud-stick hud-stick-${side}`}>
    <PressableButton className={`hud-stick-action hud-control is-${action}`} onClick={() => { onTouch(); onAction(action); }} aria-label={action === "takeoff" ? "Take off" : "Land"} hapticWeight="medium" disabled={disabled}>
      {action === "takeoff" ? <MdRocketLaunch size={24} /> : <MdArrowDownward size={24} />}
    </PressableButton>
    <div
      className="hud-stick-base"
      ref={stickRef}
      role="group"
      aria-label={`${yAxis} and ${xAxis} joystick`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerRelease}
      onPointerCancel={onPointerRelease}
      onLostPointerCapture={onPointerRelease}
    >
      <span className="hud-stick-ring" />
      <span className="hud-stick-hint hud-hint-up" style={{ opacity: chevronOpacity }}><MdKeyboardArrowUp size={24} /></span>
      <span className="hud-stick-hint hud-hint-down" style={{ opacity: chevronOpacity }}><MdKeyboardArrowDown size={24} /></span>
      <span className="hud-stick-hint hud-hint-left" style={{ opacity: chevronOpacity }}><MdKeyboardArrowLeft size={24} /></span>
      <span className="hud-stick-hint hud-hint-right" style={{ opacity: chevronOpacity }}><MdKeyboardArrowRight size={24} /></span>
      <motion.span
        className={`hud-stick-thumb${dragging ? " is-dragging" : ""}`}
        animate={{ x: position.x * travel, y: position.y * travel, scaleX: dragging ? 1 + Math.abs(position.x) * 0.1 : 1, scaleY: dragging ? 1 + Math.abs(position.y) * 0.1 : 1 }}
        transition={spring}
      />
    </div>
  </div>;
}
