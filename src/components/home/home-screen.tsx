"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { DroneProvider, useDrone } from "@/context/drone-provider";
import { UiIcon } from "@/components/ui-icon";
import { PressableButton } from "@/components/ui/pressable-button";
import { formatFlightDate, formatFlightDuration, readLastFlight, type LastFlightRecord } from "@/lib/settings/last-flight-store";

export function HomeScreen() {
  const [demoMode, setDemoMode] = useState(true);
  return (
    <DroneProvider
      key={demoMode ? "demo" : "native"}
      mode={demoMode ? "demo" : "native"}
    >
      <HomeContent demoMode={demoMode} onDemoChange={setDemoMode} />
    </DroneProvider>
  );
}

function HomeContent({
  demoMode,
  onDemoChange,
}: {
  demoMode: boolean;
  onDemoChange: (value: boolean) => void;
}) {
  const drone = useDrone();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [lastFlight, setLastFlight] = useState<LastFlightRecord | null>(null);
  const connected = drone.state === "connected";
  const busy = drone.state === "connecting";
  const go = () => (connected ? router.push("/fly") : void drone.connect());
  const spring = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 500, damping: 26 };

  useEffect(() => setLastFlight(readLastFlight()), []);

  const lastFlightDuration = lastFlight ? formatFlightDuration(lastFlight.durationSeconds) : "—";
  const lastFlightDate = lastFlight ? formatFlightDate(lastFlight.endedAt) : "—";

  return (
    <main className="home-screen">
      <div className="home-layout">
        {" "}
        <header className="home-heading">
          <h1>Quadtroller</h1>
          <p className={connected ? "is-connected" : ""}>
            {connected ? "Connected" : "Not connected"}
          </p>
          {!connected && <span>Join the drone&apos;s WiFi</span>}
        </header>
        <div className="home-hero-tile" aria-label="Quadtroller drone">
          <img src="/icon.svg" alt="Quadtroller drone" draggable="false" />
        </div>
        <PressableButton
          className="home-primary-action"
          type="button"
          onClick={go}
          disabled={busy}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={connected ? "fly" : "connect"}
              initial={reducedMotion ? false : { y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reducedMotion ? undefined : { y: -8, opacity: 0 }}
              transition={spring}
            >
              {connected ? "Fly" : "Connect"}
            </motion.span>
          </AnimatePresence>
        </PressableButton>
        <nav className="home-bento" aria-label="App pages">
          <Link className="home-bento-tile" href="/gallery">
            <UiIcon name="gallery" size={24} />
            <span>Gallery</span>
          </Link>
          <Link className="home-bento-tile" href="/settings">
            <UiIcon name="settings" size={24} />
            <span>Settings</span>
          </Link>
          <PressableButton
            className={`home-bento-tile home-demo-toggle${demoMode ? " is-on" : ""}`}
            type="button"
            role="switch"
            aria-checked={demoMode}
            aria-label="Demo mode"
            onClick={() => onDemoChange(!demoMode)}
          >
            <UiIcon name="video" size={24} />
            <span>Demo</span>
          </PressableButton>
          <div className="home-bento-tile home-last-flight" aria-label={lastFlight ? `Last flight: ${lastFlightDuration}, ${lastFlightDate}` : "No last flight recorded"}>
            <span>Last flight</span>
            <strong>{lastFlightDuration}</strong>
            <time dateTime={lastFlight ? new Date(lastFlight.endedAt).toISOString() : undefined}>{lastFlightDate}</time>
          </div>
        </nav>
      </div>
    </main>
  );
}
