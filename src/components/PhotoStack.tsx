import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Photo, PhotoSize, StackTransform } from '../types';

interface PhotoStackProps {
  photos: Photo[];
  transforms: StackTransform[];
  photoSize?: PhotoSize;
}

export function PhotoStack({
  photos,
  transforms,
  photoSize,
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
                  className="relative rounded-2xl bg-white shadow-lg"
                  style={photoSize ? { width: photoSize.w, height: photoSize.h } : { width: '100%', height: '100%', aspectRatio: '4/3' }}
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
    </div>
  );
}
