export type GalleryMedia = {
  id: string;
  type: "photo" | "video";
  name: string;
  mimeType: string;
  createdAt: number;
  blob: Blob;
  poster?: Blob;
};

const DB_NAME = "quadtroller-gallery";
const DB_VERSION = 1;
const STORE = "media";

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("Local gallery storage is unavailable in this browser."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open the local gallery."));
    request.onblocked = () => reject(new Error("Close other Quadtroller tabs to update gallery storage."));
  });
}

async function writeMedia(media: GalleryMedia): Promise<GalleryMedia> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).put(media);
    transaction.oncomplete = () => { db.close(); resolve(media); };
    transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error("Could not save this capture.")); };
    transaction.onabort = () => { db.close(); reject(transaction.error ?? new Error("The gallery save was cancelled.")); };
  });
}

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function savePhotoFrame(frameUrl: string): Promise<GalleryMedia> {
  const response = await fetch(frameUrl);
  if (!response.ok) throw new Error("The camera frame could not be read. Try taking the photo again.");
  const blob = await response.blob();
  const createdAt = Date.now();
  return writeMedia({ id: createId(), type: "photo", name: `quadtroller-photo-${createdAt}.svg`, mimeType: blob.type || "image/svg+xml", createdAt, blob });
}

export async function saveRecordedVideo(blob: Blob, posterUrl: string): Promise<GalleryMedia> {
  const createdAt = Date.now();
  let poster: Blob | undefined;
  try {
    const response = await fetch(posterUrl);
    if (response.ok) poster = await response.blob();
  } catch { /* The video remains useful without a poster frame. */ }
  return writeMedia({ id: createId(), type: "video", name: `quadtroller-video-${createdAt}.webm`, mimeType: blob.type || "video/webm", createdAt, blob, poster });
}

export async function listGalleryMedia(): Promise<GalleryMedia[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, "readonly");
    const request = transaction.objectStore(STORE).getAll() as IDBRequest<GalleryMedia[]>;
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.createdAt - a.createdAt));
    request.onerror = () => reject(request.error ?? new Error("Could not load your gallery."));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error("Could not load your gallery.")); };
  });
}

export async function deleteGalleryMedia(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).delete(id);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error("Could not delete this capture.")); };
  });
}

export type DemoFrameRecorder = { stop: () => Promise<Blob> };

export function startDemoFrameRecorder(getFrameUrl: () => string): DemoFrameRecorder | null {
  if (typeof MediaRecorder === "undefined" || typeof HTMLCanvasElement.prototype.captureStream !== "function") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const stream = canvas.captureStream(12);
  const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((type) => MediaRecorder.isTypeSupported(type));
  const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
  const chunks: BlobPart[] = [];
  let activeImage: HTMLImageElement | null = null;
  let requestedUrl = "";
  let animationFrame = 0;
  let finished = false;

  const draw = () => {
    const currentUrl = getFrameUrl();
    if (currentUrl !== requestedUrl) {
      requestedUrl = currentUrl;
      const image = new Image();
      image.onload = () => { activeImage = image; };
      image.src = currentUrl;
    }
    if (activeImage) context.drawImage(activeImage, 0, 0, canvas.width, canvas.height);
    else { context.fillStyle = "#343d37"; context.fillRect(0, 0, canvas.width, canvas.height); }
    if (!finished) animationFrame = requestAnimationFrame(draw);
  };

  recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data); };
  draw();
  recorder.start(500);

  return {
    stop: () => new Promise((resolve, reject) => {
      if (recorder.state === "inactive") { resolve(new Blob(chunks, { type: recorder.mimeType || "video/webm" })); return; }
      finished = true;
      cancelAnimationFrame(animationFrame);
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        resolve(new Blob(chunks, { type: recorder.mimeType || "video/webm" }));
      };
      recorder.onerror = () => reject(new Error("The browser could not finish this video."));
      recorder.stop();
    }),
  };
}
