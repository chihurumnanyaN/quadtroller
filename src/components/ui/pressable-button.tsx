"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, type ButtonHTMLAttributes, type MouseEvent } from "react";
import { haptic, type HapticWeight } from "@/lib/theme/haptics";

type PressableButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { hapticWeight?: HapticWeight | false };

export function PressableButton({ hapticWeight = "light", onClick, ...props }: PressableButtonProps) {
  const reducedMotion = useReducedMotion();
  const handleClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    if (hapticWeight) void haptic(hapticWeight);
    onClick?.(event);
  }, [hapticWeight, onClick]);

  return <motion.button
    {...props}
    onClick={handleClick}
    whileTap={reducedMotion ? undefined : { scale: 0.94, borderRadius: "var(--shape-28)" }}
    transition={{ type: "spring", stiffness: 500, damping: 26 }}
  />;
}
