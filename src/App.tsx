import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Photo = {
  id: string;
  src: string;
  alt?: string;
};

// Dynamically load all photos from src/assets/photos folder
const photoModules = import.meta.glob('/src/assets/photos/*', { eager: true }) as Record<string, any>;

function getInitialPhotos(): Photo[] {
  const photos = Object.entries(photoModules)
    .map(([path, module], index) => ({
      id: `p${index}`,
      src: (module.default || path).replace(/\/src/, ''),
      alt: `Photo ${index + 1}`,
    }));

  // Shuffle the array
  const shuffled = [...photos];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

const PHOTOS = getInitialPhotos();

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function seededRotate(seed: string): number {
  // Create deterministic rotation based on string seed (range ~[-8, 8] degrees)
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const r01 = (h % 1000) / 1000;
  return (r01 - 0.5) * 16;
}

export default function App(): JSX.Element {
  const [inEnvelope, setInEnvelope] = useState<Photo[]>(PHOTOS);
  const [inStack, setInStack] = useState<Photo[]>([]);

  const topPhoto = inEnvelope[0] ?? null;

  // Calculate transforms for stacked photos
  const stackTransforms = useMemo(() => {
    const n = inStack.length;
    return inStack.map((p, idx) => {
      const depthFromTop = n - 1 - idx; // 0 = top/newest, larger = deeper/older
      const rot = seededRotate(p.id) + (idx % 3 - 1) * 1.5;
      const x = clamp(depthFromTop * 10, 0, 70);
      const y = clamp(depthFromTop * 8, 0, 56);
      return { id: p.id, rot, x, y, z: idx + 1 };
    });
  }, [inStack]);

  const moveTopToStack = (): void => {
    if (!topPhoto) return;
    setInEnvelope((prev) => prev.slice(1));
    setInStack((prev) => [...prev, topPhoto]);
  };

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body, html, #root {
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden;
          width: 100%;
          height: 100%;
        }
      `}</style>
      <div className="fixed inset-0 w-full h-full bg-white text-neutral-900 overflow-hidden" style={{ margin: 0, padding: 0, top: 0, left: 0 }}>
      <div className="relative flex h-full w-full items-stretch">
        {/* LEFT: Envelope */}
        <div className="relative w-[50%] min-w-[360px] overflow-hidden">
          <div className="absolute w-full h-full left-1/2 -translate-x-1/2">
            <EnvelopeScene
              topPhoto={topPhoto}
              remaining={inEnvelope.length}
              onClickTop={moveTopToStack}
            />
          </div>
        </div>

        {/* RIGHT: Photo stack */}
        <div className="relative w-[50%] flex-1 overflow-hidden">
          <div className="absolute right-1/2 top-1/2 translate-x-1/2 -translate-y-1/2">
            <PhotoStack photos={inStack} transforms={stackTransforms} />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

interface EnvelopeSceneProps {
  topPhoto: Photo | null;
  remaining: number;
  onClickTop: () => void;
}

function EnvelopeScene({
  topPhoto,
  onClickTop,
}: EnvelopeSceneProps): JSX.Element {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative w-full h-full">
      {/* Container to control scaling */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%]" style={{ aspectRatio: '4/3' }}>
        {/* Photo peeking out */}
        <div className="absolute left-1/2 top-1/4 -translate-x-1/2" style={{ width: '65%', aspectRatio: '4/3', zIndex: 2 }}>
          <AnimatePresence mode="popLayout">
            {topPhoto ? (
              <motion.div
                key={topPhoto.id}
                layoutId={topPhoto.id}
                className="w-full h-full"
                whileHover={{ y: -14, scale: 1.01 }}
                initial={{ y: 22, opacity: 0 }}
                animate={{ y: isHovered ? -14 : 22, opacity: 1, scale: isHovered ? 1.01 : 1 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              >
                <img
                  src={topPhoto.src}
                  alt={topPhoto.alt ?? "Photo"}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className=""
            >
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {/* Envelope illustration */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
        {/* Envelope back (bottom layer) */}
        <img
          src="/envelope.png"
          alt="Envelope back"
          className="absolute inset-0 w-full object-contain"
          draggable={false}
          style={{ zIndex: 1 }}
        />

        {/* Remaining count */}
        {/* <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-neutral-500" style={{ zIndex: 4 }}>
          {remaining > 0 ? `${remaining} photo${remaining === 1 ? "" : "s"} in envelope` : "Envelope empty"}
        </div> */}
        </div>

        {/* Envelope front flap (separate to sit above photo) */}
        <img
          src="/envelope_front.png"
          alt="Envelope front"
          className="absolute inset-0 w-full object-contain"
          draggable={false}
          style={{ zIndex: 3 }}
        />

        {/* Transparent button overlay for clicking through envelope_front */}
        {topPhoto && (
          <button
            onClick={onClickTop}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="absolute cursor-pointer focus:outline-none"
            style={{
              left: '50%',
              top: '25%',
              transform: 'translate(-50%, -50%)',
              width: '65%',
              aspectRatio: '4/3',
              background: 'transparent',
              border: 'none',
              padding: 0,
              zIndex: 4,
            }}
            aria-label="Move photo to the right"
            title="Click to move to stack"
          />
        )}
      </div>
    </div>
  );
}

interface PhotoStackProps {
  photos: Photo[];
  transforms: { id: string; rot: number; x: number; y: number; z: number }[];
}

function PhotoStack({
  photos,
  transforms,
}: PhotoStackProps): JSX.Element {
  return (
    <div className="relative" style={{ width: 420, height: 320 }}>
      <div className="absolute left-0 top-0 text-xs text-neutral-500">
        {photos.length ? "" : ""}
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
                  className="relative rounded-2xl bg-white shadow-md"
                  style={{ width: '100%', height: '100%', aspectRatio: '4/3' }}
                  whileHover={{ y: -10 }}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                >
                  <img
                    src={p.src}
                    alt={p.alt ?? "Photo"}
                    className="h-full w-full rounded-2xl object-cover"
                    draggable={false}
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* {!photos.length && (
        <div className="absolute left-6 top-16 rounded-xl border border-dashed border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-500">
          Click photos on the left to add them here.
        </div>
      )} */}
    </div>
  );
}
