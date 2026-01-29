import React, { useMemo, useState } from "react";
import { EnvelopeScene } from "./components/EnvelopeScene";
import { PhotoStack } from "./components/PhotoStack";
import { Photo, StackTransform, PhotoSize } from "./types";
import { getInitialPhotos, clamp, seededRotate } from "./utils";

const PHOTOS = getInitialPhotos();

export default function App(): JSX.Element {
  const [inEnvelope, setInEnvelope] = useState<Photo[]>(PHOTOS);
  const [inStack, setInStack] = useState<Photo[]>([]);
  const [photoSize, setPhotoSize] = useState<PhotoSize>(null);

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
            <div className="w-full h-full flex items-center justify-center">
              <EnvelopeScene
                topPhoto={topPhoto}
                remaining={inEnvelope.length}
                onClickTop={moveTopToStack}
                onSizeChange={setPhotoSize}
              />
            </div>
          </div>

          {/* RIGHT: Photo stack */}
          <div className="relative w-[50%] flex-1 overflow-hidden">
            <div className="absolute right-1/2 top-1/2 translate-x-1/2 -translate-y-1/2">
              <PhotoStack photos={inStack} transforms={stackTransforms} photoSize={photoSize} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
