"use client";

import Link from "next/link";
import { useDroneSettings } from "@/hooks/use-drone-settings";
import { UiIcon } from "@/components/ui-icon";
import { PressableButton } from "@/components/ui/pressable-button";
import { droneProfiles, type DroneProfileId } from "@/lib/drone/profiles";

export default function SettingsPage() {
  const { settings, updateSettings, ready } = useDroneSettings();
  const toggle = (label: string, checked: boolean, onChange: (value: boolean) => void) => <PressableButton type="button" role="switch" aria-label={label} aria-checked={checked} onClick={() => onChange(!checked)} className={`settings-toggle-tile${checked ? " is-on" : ""}`}><span>{label}</span><i aria-hidden="true" /></PressableButton>;

  return <main className="settings-screen">
    <header className="subpage-topbar"><Link className="subpage-back" href="/" aria-label="Back to home"><UiIcon name="back" size={24} /></Link><h1>Settings</h1><span aria-hidden="true" /></header>
    {!ready ? <div className="settings-loading" aria-label="Loading settings" /> : <div className="settings-bento">
      {droneProfiles.length > 1 && <label className="settings-tile settings-profile-tile"><span>Drone profile</span><select value={settings.profileId} onChange={(event) => updateSettings({ profileId: event.target.value as DroneProfileId })}>{droneProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label>}
      <section className="settings-tile settings-layout-tile"><h2>Stick layout</h2><div className="settings-segmented" role="group" aria-label="Stick layout">
        <PressableButton className={settings.controlMode === "mode1" ? "is-selected" : ""} aria-pressed={settings.controlMode === "mode1"} onClick={() => updateSettings({ controlMode: "mode1" })}>Mode 1</PressableButton>
        <PressableButton className={settings.controlMode === "mode2" ? "is-selected" : ""} aria-pressed={settings.controlMode === "mode2"} onClick={() => updateSettings({ controlMode: "mode2" })}>Mode 2</PressableButton>
      </div></section>

      <label className="settings-tile settings-sensitivity-tile"><span><strong>Sensitivity</strong><b>{settings.sensitivity}%</b></span><input type="range" min="1" max="100" value={settings.sensitivity} onChange={(event) => updateSettings({ sensitivity: Number(event.target.value) })} aria-label="Sensitivity" /></label>

      {toggle("Left-handed", settings.leftHanded, (value) => updateSettings({ leftHanded: value }))}
      {toggle("Invert axes", settings.invertAxes, (value) => updateSettings({ invertAxes: value }))}
      {toggle("Haptics", settings.haptics, (value) => updateSettings({ haptics: value }))}
    </div>}
  </main>;
}
