import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Drop your assets into /public so these paths work:
 *   /envelope.png
 *   /envelope_front.png
 *   /photos/1.jpg, /photos/2.jpg, ...
 *
 * This component matches the wireframe behavior:
 * - Left side: envelope with a photo peeking out
 * - Hover on the photo: it raises
 * - Click the photo: it flies to the right and joins a photo stack
 */

type Photo = {
  id: string;
  src: string;
  alt?: string;
};

const INITIAL_PHOTOS: Photo[] = [
  { id: "p1", src: "/photos/1.jpg", alt: "Photo 1" },
  { id: "p2", src: "/photos/2.jpg", alt: "Photo 2" },
  { id: "p3", src: "/photos/3.jpg", alt: "Photo 3" },
  { id: "p4", src: "/photos/4.jpg", alt: "Photo 4" },
];

const ENVELOPE_BACK = "/envelope.png";
const ENVELOPE_FRONT = "/envelope_front.png";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function seededRotate(seed: string) {
  // deterministic-ish rotation per id (range ~[-8, 8])
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const r01 = (h % 1000) / 1000;
  return (r01 - 0.5) * 16;
}

export default function App() {
  const [inEnvelope, setInEnvelope] = useState<Photo[]>(INITIAL_PHOTOS);
  const [inStack, setInStack] = useState<Photo[]>([]);

  const topPhoto = inEnvelope[0] ?? null;

  const stackTransforms = useMemo(() => {
    // Newest photo should be on TOP and visually least-offset.
    // We keep stack order as [oldest ... newest], but compute offsets by "depth from top".
    const n = inStack.length;
    return inStack.map((p, idx) => {
      const depthFromTop = n - 1 - idx; // 0 => top/newest, larger => deeper/older
      const rot = seededRotate(p.id) + (idx % 3 - 1) * 1.5; // ensure visible variation even for similar ids
      const x = clamp(depthFromTop * 10, 0, 70);
      const y = clamp(depthFromTop * 8, 0, 56);
      return { id: p.id, rot, x, y, z: idx + 1 };
    });
  }, [inStack]);

  const moveTopToStack = () => {
    if (!topPhoto) return;
    setInEnvelope((prev) => prev.slice(1));
    setInStack((prev) => [...prev, topPhoto]);
  };

  return (
    <div className="min-h-screen w-full bg-white text-neutral-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-stretch">
        {/* LEFT: Envelope area */}
        <div className="relative w-[44%] min-w-[360px] overflow-hidden">
          <div className="absolute left-10 top-1/2 -translate-y-1/2">
            <EnvelopeScene
              topPhoto={topPhoto}
              remaining={inEnvelope.length}
              onClickTop={moveTopToStack}
            />
          </div>
        </div>

        {/* RIGHT: Empty space + photo stack */}
        <div className="relative flex-1 overflow-hidden">
          <div className="pointer-events-none absolute inset-0" />

          <div className="absolute right-12 top-1/2 -translate-y-1/2">
            <PhotoStack photos={inStack} transforms={stackTransforms} />
          </div>
        </div>
      </div>
    </div>
  );
}

function EnvelopeScene({
  topPhoto,
  remaining,
  onClickTop,
}: {
  topPhoto: Photo | null;
  remaining: number;
  onClickTop: () => void;
}) {
  // Sizes tuned to feel like the wireframes
  const w = 360;
  const h = 260;

  return (
    <div className="relative" style={{ width: w, height: h + 40 }}>
      {/* Photo peeking out */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2">
        <AnimatePresence mode="popLayout">
          {topPhoto ? (
            <motion.button
              key={topPhoto.id}
              layoutId={topPhoto.id}
              type="button"
              onClick={onClickTop}
              className="group relative block cursor-pointer rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
              style={{ width: 300, height: 190 }}
              whileHover={{ y: -14, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              initial={{ y: 22, opacity: 0 }}
              animate={{ y: 22, opacity: 1 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              aria-label="Move photo to the right"
              title="Click to move to stack"
            >
              <img
                src={topPhoto.src}
                alt={topPhoto.alt ?? "Photo"}
                className="h-full w-full rounded-xl object-cover"
                draggable={false}
              />
              <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-black/5" />
            </motion.button>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-[190px] w-[300px] items-center justify-center rounded-xl border border-neutral-200 bg-white text-sm text-neutral-500"
            >
              No more photos
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Envelope (back) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: w, height: h }}>
        <img
          src={ENVELOPE_BACK}
          alt="Envelope"
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
        />

        {/* Envelope (front) */}
        <img
          src={ENVELOPE_FRONT}
          alt="Envelope front"
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
        />

        {/* Remaining count */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-neutral-500">
          {remaining > 0 ? `${remaining} photo${remaining === 1 ? "" : "s"} in envelope` : "Envelope empty"}
        </div>
      </div>
    </div>
  );
}

function PhotoStack({
  photos,
  transforms,
}: {
  photos: Photo[];
  transforms: { id: string; rot: number; x: number; y: number; z: number }[];
}) {
  return (
    <div className="relative" style={{ width: 420, height: 320 }}>
      <div className="absolute left-0 top-0 text-xs text-neutral-500">
        {photos.length ? "Photo stack" : ""}
      </div>

      <div className="relative h-full w-full">
        <AnimatePresence>
          {photos.map((p) => {
            const t = transforms.find((x) => x.id === p.id);
            return (
              <motion.div
                key={p.id}
                layoutId={p.id}
                className="absolute left-6 top-10"
                style={{ zIndex: t?.z ?? 1 }}
                initial={{ opacity: 0, x: 120, y: -60, rotate: 0 }}
                animate={{
                  opacity: 1,
                  x: t?.x ?? 0,
                  y: t?.y ?? 0,
                  rotate: t?.rot ?? 0,
                }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
              >
                <motion.div
                  className="relative rounded-2xl bg-white shadow-lg"
                  style={{ width: 320, height: 210 }}
                  whileHover={{ y: -10 }}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                >
                  <img
                    src={p.src}
                    alt={p.alt ?? "Photo"}
                    className="h-full w-full rounded-2xl object-cover"
                    draggable={false}
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-black/5" />
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {!photos.length && (
        <div className="absolute left-6 top-16 rounded-xl border border-dashed border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-500">
          Click photos on the left to add them here.
        </div>
      )}
    </div>
  );
}
