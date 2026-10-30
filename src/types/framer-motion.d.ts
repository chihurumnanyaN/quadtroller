declare module "framer-motion" {
  import type { ComponentType, HTMLAttributes, ReactNode, ButtonHTMLAttributes } from "react";

  type MotionProps = {
    whileTap?: boolean | Record<string, string | number>;
    initial?: boolean | Record<string, string | number>;
    animate?: Record<string, string | number>;
    exit?: Record<string, string | number>;
    transition?: { type?: string; stiffness?: number; damping?: number; mass?: number; duration?: number };
  };

  export const motion: {
    button: ComponentType<ButtonHTMLAttributes<HTMLButtonElement> & MotionProps>;
    aside: ComponentType<HTMLAttributes<HTMLElement> & MotionProps>;
    span: ComponentType<HTMLAttributes<HTMLSpanElement> & MotionProps>;
  };
  export function useReducedMotion(): boolean | null;
  export function AnimatePresence(props: { children?: ReactNode; mode?: string; initial?: boolean }): ReactNode;
}
