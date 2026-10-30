"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { deleteGalleryMedia, listGalleryMedia, type GalleryMedia } from "@/lib/gallery/media-store";
import { UiIcon } from "@/components/ui-icon";
import { PressableButton } from "@/components/ui/pressable-button";

type GalleryItem = GalleryMedia & { url: string; posterUrl?: string };

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const itemsRef = useRef<GalleryItem[]>([]);
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const swipeStart = useRef<{ id: number; x: number; y: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const media = await listGalleryMedia();
      itemsRef.current.forEach((item) => { URL.revokeObjectURL(item.url); if (item.posterUrl) URL.revokeObjectURL(item.posterUrl); });
      const next = media.map((item) => ({ ...item, url: URL.createObjectURL(item.blob), posterUrl: item.poster ? URL.createObjectURL(item.poster) : undefined }));
      itemsRef.current = next;
      setItems(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load the gallery.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => () => itemsRef.current.forEach((item) => { URL.revokeObjectURL(item.url); if (item.posterUrl) URL.revokeObjectURL(item.posterUrl); }), []);
  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  const remove = async (item: GalleryItem) => {
    try {
      await deleteGalleryMedia(item.id);
      setSelected(null);
      if (item.posterUrl) URL.revokeObjectURL(item.posterUrl);
      URL.revokeObjectURL(item.url);
      itemsRef.current = itemsRef.current.filter((entry) => entry.id !== item.id);
      setItems(itemsRef.current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this capture.");
    }
  };

  const share = async (item: GalleryItem) => {
    try {
      const file = new File([item.blob], item.name, { type: item.mimeType });
      if (navigator.canShare?.({ files: [file] }) && navigator.share) await navigator.share({ files: [file], title: item.name });
      else { const anchor = document.createElement("a"); anchor.href = item.url; anchor.download = item.name; anchor.click(); }
    } catch (cause) {
      if (cause instanceof Error && cause.name !== "AbortError") setError("Could not share this capture.");
    }
  };

  const onViewerPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest(".gallery-viewer-bar")) return;
    swipeStart.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };
  const onViewerPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || start.id !== event.pointerId) return;
    const deltaY = event.clientY - start.y;
    if (deltaY > 104 && deltaY > Math.abs(event.clientX - start.x) * 1.15) setSelected(null);
  };

  return <main className="gallery-screen">
    <header className="subpage-topbar"><Link className="subpage-back" href="/" aria-label="Back to home"><UiIcon name="back" size={24} /></Link><h1>Gallery</h1><span aria-hidden="true" /></header>
    {loading ? <div className="gallery-loading" aria-label="Loading gallery" /> : error ? <div className="gallery-error" role="alert"><span>Gallery unavailable</span><PressableButton className="gallery-retry" onClick={() => void load()} aria-label="Retry loading gallery"><UiIcon name="refresh" size={24} /></PressableButton></div> : items.length === 0 ? <div className="gallery-empty"><img src="/icon.svg" alt="" /><p>Nothing yet</p><Link className="gallery-go-fly" href="/fly">Go fly</Link></div> : <div className="gallery-grid">{items.map((item) => <PressableButton className="gallery-tile" key={item.id} onClick={() => setSelected(item)} aria-label={`Open ${item.type === "photo" ? "photo" : "video"}`}>
      {item.type === "photo" ? <img src={item.url} alt="" /> : <><video src={item.url} poster={item.posterUrl} muted /><span className="gallery-video-mark"><UiIcon name="video" size={24} /></span></>}
    </PressableButton>)}</div>}

    {selected && <div className="gallery-viewer" role="dialog" aria-modal="true" aria-label="Capture" onPointerDown={onViewerPointerDown} onPointerUp={onViewerPointerUp} onPointerCancel={() => { swipeStart.current = null; }}>
      <div className="gallery-viewer-bar">
        <PressableButton onClick={() => void share(selected)} aria-label="Share capture"><UiIcon name="share" size={24} /></PressableButton>
        <PressableButton onClick={() => void remove(selected)} aria-label="Delete capture"><UiIcon name="trash" size={24} /></PressableButton>
      </div>
      <div className="gallery-viewer-media">{selected.type === "photo" ? <img src={selected.url} alt="Captured drone view" /> : <video src={selected.url} poster={selected.posterUrl} controls autoPlay playsInline />}</div>
    </div>}
  </main>;
}
