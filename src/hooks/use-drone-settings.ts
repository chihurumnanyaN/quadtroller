"use client";

import { useCallback, useEffect, useState } from "react";
import { defaultSettings, readSettings, writeSettings, type DroneSettings } from "@/lib/settings/settings-store";

export function useDroneSettings() {
  const [settings, setSettings] = useState<DroneSettings>(defaultSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hydrate = () => {
      setSettings(readSettings());
      setReady(true);
    };
    hydrate();
    window.addEventListener("storage", hydrate);
    return () => window.removeEventListener("storage", hydrate);
  }, []);

  const updateSettings = useCallback((patch: Partial<DroneSettings> | ((current: DroneSettings) => DroneSettings)) => {
    setSettings((current) => {
      const next = typeof patch === "function"
        ? patch(current)
        : { ...current, ...patch };
      writeSettings(next);
      return next;
    });
  }, []);

  return { settings, updateSettings, ready };
}
