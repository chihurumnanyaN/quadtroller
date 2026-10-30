"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { App } from "@capacitor/app";
import { Capacitor, SystemBars } from "@capacitor/core";
import { KeepAwake } from "@capacitor-community/keep-awake";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { MdRefresh, MdWifiOff } from "react-icons/md";
import { useDrone } from "@/context/drone-provider";
import { PressableButton } from "@/components/ui/pressable-button";
import { useDroneSettings } from "@/hooks/use-drone-settings";
import type { Axis, ControlInput } from "@/lib/drone/types";
import { savePhotoFrame, saveRecordedVideo, startDemoFrameRecorder, type DemoFrameRecorder } from "@/lib/gallery/media-store";
import { saveLastFlight } from "@/lib/settings/last-flight-store";
import { FlightDock } from "./flight-dock";
import { FlightJoystick } from "./flight-joystick";
import { FlightTopbar } from "./flight-topbar";
import { ModesPanel } from "./flight-panels";
import styles from "./flight-screen.module.css";

const zeroControl: ControlInput = { throttle: 0, yaw: 0, pitch: 0, roll: 0 };

export function FlightScreen() {
  const drone = useDrone();
  const { settings } = useDroneSettings();
  const controlsRef = useRef<ControlInput>({ ...zeroControl });
  const pressedKeysRef = useRef(new Set<string>());
  const controlTimerRef = useRef<number | null>(null);
  const controlSuspendedRef = useRef(false);
  const neutralSentRef = useRef(true);
  const wasConnectedRef = useRef(false);
  const connectionLostRef = useRef(false);
  const gamepadButtonsRef = useRef({ takeoff: false, stop: false });
  const flightStartedAtRef = useRef<number | null>(null);
  const actionRefs = useRef<{ takeoffOrLand: () => void; stop: () => void }>({ takeoffOrLand: () => undefined, stop: () => undefined });
  const speedRef = useRef(60);
  const connectedRef = useRef(false);
  const settingsRef = useRef(settings);
  const recorderRef = useRef<DemoFrameRecorder | null>(null);
  const idleTimer = useRef<number | null>(null);
  const [speed, setSpeed] = useState(60);
  const [panel, setPanel] = useState(false);
  const [resetSticks, setResetSticks] = useState(0);
  const [modes, setModes] = useState<Record<string, boolean>>({});
  const [idle, setIdle] = useState(false);
  const [connectionLost, setConnectionLost] = useState(false);

  connectedRef.current = drone.state === "connected";
  settingsRef.current = settings;

  const wakeControls = useCallback(() => {
    setIdle(false);
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setIdle(true), 3000);
  }, []);

  const resetControlInput = useCallback(() => { controlsRef.current = { ...zeroControl }; setResetSticks((key) => key + 1); }, []);
  const takeoffOrLand = useCallback(() => {
    wakeControls();
    if (drone.telemetry.altitude > 0) { resetControlInput(); void drone.land(); }
    else void drone.takeoff();
  }, [drone, resetControlInput, wakeControls]);
  const stop = useCallback(() => {
    pressedKeysRef.current.clear();
    gamepadButtonsRef.current = { takeoff: false, stop: false };
    resetControlInput();
    void drone.emergencyStop();
  }, [drone, resetControlInput]);
  actionRefs.current = { takeoffOrLand, stop };

  const stopControlLoop = useCallback((resetJoystick = true) => {
    if (controlTimerRef.current !== null) window.clearInterval(controlTimerRef.current);
    controlTimerRef.current = null;
    controlsRef.current = { ...zeroControl };
    pressedKeysRef.current.clear();
    gamepadButtonsRef.current = { takeoff: false, stop: false };
    if (resetJoystick) setResetSticks((key) => key + 1);
    if (!neutralSentRef.current) drone.client.neutralizeControls();
    neutralSentRef.current = true;
  }, [drone.client]);

  const startControlLoop = useCallback(() => {
    if (controlTimerRef.current !== null || !connectedRef.current || controlSuspendedRef.current) return;
    neutralSentRef.current = false;
    const deadzone = (value: number) => {
      const magnitude = Math.abs(value);
      return magnitude <= 0.1 ? 0 : Math.sign(value) * ((magnitude - 0.1) / 0.9);
    };
    const clamp = (value: number) => Math.max(-1, Math.min(1, value));
    controlTimerRef.current = window.setInterval(() => {
      if (!connectedRef.current || controlSuspendedRef.current) return;

      const keys = pressedKeysRef.current;
      const keyboard: ControlInput = {
        throttle: Number(keys.has("KeyW")) - Number(keys.has("KeyS")),
        yaw: Number(keys.has("KeyD")) - Number(keys.has("KeyA")),
        pitch: Number(keys.has("ArrowUp")) - Number(keys.has("ArrowDown")),
        roll: Number(keys.has("ArrowRight")) - Number(keys.has("ArrowLeft")),
      };
      const gamepadInput: ControlInput = { ...zeroControl };
      if (drone.client.mode === "demo" && typeof navigator.getGamepads === "function") {
        const gamepad = Array.from(navigator.getGamepads()).find((pad) => pad?.mapping === "standard");
        if (gamepad) {
          gamepadInput.yaw = deadzone(gamepad.axes[0] ?? 0);
          gamepadInput.throttle = -deadzone(gamepad.axes[1] ?? 0);
          gamepadInput.roll = deadzone(gamepad.axes[2] ?? 0);
          gamepadInput.pitch = -deadzone(gamepad.axes[3] ?? 0);

          const takeoffPressed = Boolean(gamepad.buttons[0]?.pressed);
          const stopPressed = Boolean(gamepad.buttons[1]?.pressed);
          if (takeoffPressed && !gamepadButtonsRef.current.takeoff) actionRefs.current.takeoffOrLand();
          if (stopPressed && !gamepadButtonsRef.current.stop) actionRefs.current.stop();
          gamepadButtonsRef.current = { takeoff: takeoffPressed, stop: stopPressed };
        } else {
          gamepadButtonsRef.current = { takeoff: false, stop: false };
        }
      }

      const current = settingsRef.current;
      const scale = (speedRef.current / 100) * (current.sensitivity / 100);
      const output = (axis: keyof ControlInput) => {
        const combined = clamp(controlsRef.current[axis] + keyboard[axis] + gamepadInput[axis]);
        return (current.invertAxes ? -combined : combined) * scale;
      };
      drone.client.sendControl({ throttle: output("throttle"), yaw: output("yaw"), pitch: output("pitch"), roll: output("roll") });
    }, 40);
  }, [drone.client]);

  const handleConnection = useCallback((state: typeof drone.state) => {
    if (state === "connected") {
      connectedRef.current = true;
      wasConnectedRef.current = true;
      connectionLostRef.current = false;
      setConnectionLost(false);
      if (!document.hidden && !controlSuspendedRef.current) startControlLoop();
      return;
    }

    const lost = state === "error" || wasConnectedRef.current;
    connectedRef.current = false;
    stopControlLoop();
    if (lost) {
      if (flightStartedAtRef.current !== null) {
        saveLastFlight(flightStartedAtRef.current);
        flightStartedAtRef.current = null;
      }
      connectionLostRef.current = true;
      setConnectionLost(true);
    }
  }, [startControlLoop, stopControlLoop]);

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    let disposed = false;
    let isKeepingAwake = false;
    let appListeners: Array<{ remove(): Promise<void> }> = [];
    const suspend = () => {
      controlSuspendedRef.current = true;
      stopControlLoop();
    };
    const resume = () => {
      controlSuspendedRef.current = document.hidden;
      if (!controlSuspendedRef.current) startControlLoop();
    };
    const onVisibilityChange = () => document.hidden ? suspend() : resume();
    document.documentElement.classList.add("flight-document-lock");
    document.body.classList.add("flight-document-lock");
    controlSuspendedRef.current = document.hidden;
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", suspend);
    window.addEventListener("focus", resume);
    wakeControls();
    void Promise.all([
      App.addListener("appStateChange", ({ isActive }) => isActive ? resume() : suspend()),
      App.addListener("pause", suspend),
      App.addListener("resume", resume),
    ]).then((listeners) => {
      if (disposed) void Promise.all(listeners.map((listener) => listener.remove()));
      else appListeners = listeners;
    }).catch((error: unknown) => console.warn("Flight lifecycle listeners unavailable", error));
    void (async () => {
      if (isNative) {
        await Promise.all([
          SystemBars.hide(),
          ScreenOrientation.lock({ orientation: "landscape" }),
        ]);
      }
      if ((await KeepAwake.isSupported()).isSupported) {
        await KeepAwake.keepAwake();
        isKeepingAwake = true;
        if (disposed) await KeepAwake.allowSleep();
      }
    })().catch((error: unknown) => console.warn("Flight display setup failed", error));
    return () => {
      disposed = true;
      stopControlLoop(false);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", suspend);
      window.removeEventListener("focus", resume);
      void Promise.all(appListeners.map((listener) => listener.remove()));
      document.documentElement.classList.remove("flight-document-lock");
      document.body.classList.remove("flight-document-lock");
      if (isNative) void Promise.allSettled([SystemBars.show(), ScreenOrientation.unlock()]);
      if (isKeepingAwake) void KeepAwake.allowSleep();
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    };
  }, [startControlLoop, stopControlLoop, wakeControls]);

  useEffect(() => {
    const unsubscribe = drone.client.subscribe("connection", handleConnection);
    handleConnection(drone.state);
    return unsubscribe;
  }, [drone.client, drone.state, handleConnection]);

  useEffect(() => {
    if (drone.state !== "disconnected" || connectionLostRef.current) return;
    const timer = window.setTimeout(() => void drone.connect(), 0);
    return () => window.clearTimeout(timer);
  }, [drone.connect, drone.state]);

  useEffect(() => {
    drone.client.setSpeed(speedRef.current);
    if (drone.state === "connected") startControlLoop();
    else stopControlLoop();
  }, [drone.client, drone.state, startControlLoop, stopControlLoop]);

  useEffect(() => {
    if (drone.client.mode !== "demo") return;
    const movementCodes = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
    const actionCodes = new Set(["Space", "Escape"]);
    const onKeyDown = (event: KeyboardEvent) => {
      const isControlKey = movementCodes.has(event.code) || actionCodes.has(event.code);
      if (!isControlKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("button, a, input, select, textarea") && event.code !== "Escape") return;
      event.preventDefault();
      if (event.repeat) return;
      if (event.code === "Escape") { actionRefs.current.stop(); return; }
      if (event.code === "Space") { actionRefs.current.takeoffOrLand(); return; }
      pressedKeysRef.current.add(event.code);
      wakeControls();
    };
    const onKeyUp = (event: KeyboardEvent) => { pressedKeysRef.current.delete(event.code); };
    const onWindowBlur = () => pressedKeysRef.current.clear();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onWindowBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onWindowBlur);
      pressedKeysRef.current.clear();
    };
  }, [drone.client.mode, wakeControls]);

  useEffect(() => {
    if (drone.telemetry.altitude > 0 && flightStartedAtRef.current === null) flightStartedAtRef.current = Date.now();
    if (drone.telemetry.altitude === 0 && flightStartedAtRef.current !== null) {
      saveLastFlight(flightStartedAtRef.current);
      flightStartedAtRef.current = null;
    }
  }, [drone.telemetry.altitude]);

  useEffect(() => () => { if (recorderRef.current) void recorderRef.current.stop(); }, []);

  const onStickPosition = useCallback((axisX: Axis, axisY: Axis, position: { x: number; y: number }) => {
    controlsRef.current[axisX] = position.x;
    controlsRef.current[axisY] = -position.y;
  }, []);
  const cycleSpeed = () => {
    const next = speed === 30 ? 60 : speed === 60 ? 100 : 30;
    speedRef.current = next;
    setSpeed(next);
    drone.setSpeed(next);
  };
  const runStickAction = (action: "takeoff" | "land") => {
    if (action === "takeoff") void drone.takeoff();
    else { controlsRef.current = { ...zeroControl }; setResetSticks((key) => key + 1); void drone.land(); }
  };
  const takePhoto = async () => {
    try { await drone.takePhoto(); await savePhotoFrame(drone.frame); }
    catch (error) { console.error("Photo capture failed", error); }
  };
  const toggleRecord = async () => {
    try {
      if (!drone.telemetry.recording) {
        await drone.client.startRecording();
        recorderRef.current = startDemoFrameRecorder(() => drone.frame);
      } else {
        await drone.client.stopRecording();
        const recorder = recorderRef.current;
        recorderRef.current = null;
        if (recorder) { const video = await recorder.stop(); await saveRecordedVideo(video, drone.frame); }
      }
    } catch (error) {
      recorderRef.current = null;
      console.error("Recording action failed", error);
    }
  };
  const changeMode = (name: string, enabled: boolean) => {
    setModes((current) => ({ ...current, [name]: enabled }));
    drone.setMode(name, enabled);
  };
  const setTrim = (axis: Axis, value: number) => drone.client.setTrim(axis, value);

  const reverseVideo = modes["reverse-video"];
  const vrSplit = modes["vr-split-view"];
  const videoClass = `hud-video-feed${reverseVideo ? " is-reversed" : ""}${modes["flip-360"] ? " is-flipped" : ""}`;
  const modeLayout = settings.controlMode === "mode1"
    ? { left: ["roll", "throttle"] as const, right: ["yaw", "pitch"] as const }
    : { left: ["yaw", "throttle"] as const, right: ["roll", "pitch"] as const };
  const leftAxes = settings.leftHanded ? modeLayout.right : modeLayout.left;
  const rightAxes = settings.leftHanded ? modeLayout.left : modeLayout.right;

  return <main className={`fly-screen ${styles.screen}${idle ? " is-idle" : ""}`} onPointerDown={wakeControls}>
    <div className="hud-video-background" aria-label="Drone camera feed">
      {vrSplit ? <div className="hud-vr-feed"><img className={videoClass} src={drone.frame} alt="Drone camera view" /><img className={videoClass} src={drone.frame} alt="Drone camera view" /></div> : <img className={videoClass} src={drone.frame} alt="Drone camera view" />}
    </div>
    {connectionLost && drone.state !== "connecting" && <div className="hud-connection-loss" role="alert" aria-label="Drone connection lost">
      <MdWifiOff className="hud-connection-loss-icon" size={32} />
      <PressableButton className="hud-connection-retry" onClick={() => { connectionLostRef.current = false; setConnectionLost(false); void drone.connect(); }} aria-label="Retry drone connection"><MdRefresh size={24} /></PressableButton>
    </div>}
    <FlightTopbar telemetry={drone.telemetry} onModes={() => setPanel(true)} onStop={stop} />
    <section className="hud-stick-zone" aria-label="Flight controls">
      <FlightJoystick side="left" xAxis={leftAxes[0]} yAxis={leftAxes[1]} action="takeoff" disabled={drone.state !== "connected"} autoCentreThrottle={true} resetKey={resetSticks} onPosition={onStickPosition} onTouch={wakeControls} onAction={runStickAction} />
      <FlightJoystick side="right" xAxis={rightAxes[0]} yAxis={rightAxes[1]} action="land" disabled={drone.state !== "connected"} autoCentreThrottle={true} resetKey={resetSticks} onPosition={onStickPosition} onTouch={wakeControls} onAction={runStickAction} />
    </section>
    <FlightDock speed={speed} airborne={drone.telemetry.altitude > 0} recording={drone.telemetry.recording} connected={drone.state === "connected"} onSpeed={cycleSpeed} onFlightAction={takeoffOrLand} onPhoto={() => void takePhoto()} onRecord={() => void toggleRecord()} />
    <AnimatePresence>{panel && <ModesPanel values={modes} onChange={changeMode} onTrim={setTrim} onClose={() => setPanel(false)} />}</AnimatePresence>
    <span className="hud-screen-reader" aria-live="polite">{drone.message}</span>
  </main>;
}
