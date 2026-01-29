import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Photo, PhotoSize } from '../types';

interface EnvelopeSceneProps {
  topPhoto: Photo | null;
  remaining: number;
  onClickTop: () => void;
  onSizeChange?: (size: PhotoSize) => void;
}

export function EnvelopeScene({
  topPhoto,
  onClickTop,
  onSizeChange,
}: EnvelopeSceneProps): JSX.Element {
  const [isHovered, setIsHovered] = useState(false);
  const photoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!onSizeChange) return;
    const el = photoRef.current;
    if (!el) {
      onSizeChange(null);
      return;
    }
    const notify = () => {
      const r = el.getBoundingClientRect();
      onSizeChange({ w: Math.round(r.width), h: Math.round(r.height) });
    };
    notify();
    const ro = new ResizeObserver(notify);
    ro.observe(el);
    window.addEventListener('resize', notify);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', notify);
    };
  }, [onSizeChange]);

  return (
    <div className="relative w-full h-full">
      {/* Container to control scaling */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%]" style={{ aspectRatio: '4/3' }}>
        {/* Photo peeking out */}
        <div ref={photoRef} className="absolute left-1/2 top-1/4 -translate-x-1/2" style={{ width: '65%', aspectRatio: '4/3', zIndex: 2 }}>
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
