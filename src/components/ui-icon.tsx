import type { SVGProps } from "react";
import { Airplane, ArrowLeft, BatteryFull, Camera, CloseCircle, Gallery, Link2, Record, Setting2, Stop, Video, Wifi } from "iconsax-react";
import { Icon as IconifyIcon } from "@iconify/react";

const icons = {
  link: Link2,
  camera: Camera,
  video: Video,
  land: Airplane,
  takeoff: Airplane,
  airplane: Airplane,
  stop: Stop,
  settings: Setting2,
  battery: BatteryFull,
  signal: Wifi,
  record: Record,
  gallery: Gallery,
  back: ArrowLeft,
  close: CloseCircle,
};

type IconName = keyof typeof icons | "chevron" | "expand" | "refresh" | "share" | "trash";
type Glyph = { body: string; width: number; height: number };

const solar: Partial<Record<IconName, Glyph>> = {
  chevron: { width: 24, height: 24, body: '<path fill="currentColor" fill-opacity=".38" d="M5.4 8.1a1.5 1.5 0 0 1 2.1 0L12 12.6l4.5-4.5a1.5 1.5 0 1 1 2.1 2.1l-5.55 5.55a1.5 1.5 0 0 1-2.1 0L5.4 10.2a1.5 1.5 0 0 1 0-2.1Z"/><path fill="currentColor" d="M7.5 8.7 12 13.2l4.5-4.5a1.5 1.5 0 0 1 2.1 2.1l-5.55 5.55a1.5 1.5 0 0 1-2.1 0L5.4 10.8a1.5 1.5 0 0 1 2.1-2.1Z"/>' },
  expand: { width: 24, height: 24, body: '<path fill="currentColor" fill-opacity=".38" d="M4 3h7v3H7v4H4V3Zm9 0h7v7h-3V6h-4V3ZM4 14h3v4h4v3H4v-7Zm13 0h3v7h-7v-3h4v-4Z"/><path fill="currentColor" d="M4 4h6v2H6v4H4V4Zm10 0h6v6h-2V6h-4V4ZM4 14h2v4h4v2H4v-6Zm14 0h2v6h-6v-2h4v-4Z"/>' },
  refresh: { width: 24, height: 24, body: '<path fill="currentColor" fill-opacity=".38" d="M20.4 8.8a1.5 1.5 0 0 1-2.8 1.1A6 6 0 0 0 6.3 8.4l1.8.2a1.5 1.5 0 0 1-.3 3l-4.5-.5a1.5 1.5 0 0 1-1.3-1.7l.5-4.5a1.5 1.5 0 1 1 3 .3l-.2 1.6a9 9 0 0 1 15.1 2Z"/><path fill="currentColor" d="M3.6 15.2a1.5 1.5 0 0 1 2.8-1.1 6 6 0 0 0 11.3 1.5l-1.8-.2a1.5 1.5 0 0 1 .3-3l4.5.5a1.5 1.5 0 0 1 1.3 1.7l-.5 4.5a1.5 1.5 0 1 1-3-.3l.2-1.6a9 9 0 0 1-15.1-2Z"/>' },
  share: { width: 24, height: 24, body: '<path fill="currentColor" fill-opacity=".38" d="M6.5 11.2 15 6.4a1.5 1.5 0 0 1 1.5 2.6L8 13.8a1.5 1.5 0 0 1-1.5-2.6Zm1.5 0 8.5 4.8a1.5 1.5 0 0 1-1.5 2.6l-8.5-4.8A1.5 1.5 0 0 1 8 11.2Z"/><path fill="currentColor" d="M18 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM6 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm12 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"/>' },
  trash: { width: 24, height: 24, body: '<path fill="currentColor" fill-opacity=".38" d="M5 7h14l-1 13H6L5 7Zm3 3v7h2v-7H8Zm6 0v7h2v-7h-2Z"/><path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v7h-2v-7Z"/>' },
};

export function UiIcon({ name, size = 24, className, ...props }: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  if (solar[name]) return <IconifyIcon icon={solar[name]!} aria-hidden="true" width={size} height={size} className={className} />;
  const Icon = icons[name as keyof typeof icons];
  return <Icon aria-hidden="true" variant="Bulk" color="currentColor" size={size} className={className} {...props} />;
}
