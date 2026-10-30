"use client";

import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

export type HapticWeight = "light" | "medium" | "heavy";

export async function haptic(weight: HapticWeight = "light") {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const rawSettings = window.localStorage.getItem("quadtroller.settings.v1");
    if (rawSettings && JSON.parse(rawSettings).haptics === false) return;
  } catch { /* Use haptics when preferences cannot be read. */ }
  const style = weight === "heavy" ? ImpactStyle.Heavy : weight === "medium" ? ImpactStyle.Medium : ImpactStyle.Light;
  try { await Haptics.impact({ style }); } catch { /* Haptics may be unavailable on the active platform. */ }
}
