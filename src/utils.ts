import { Photo } from './types';

const PHOTO_COUNT = 8;

export function getInitialPhotos(): Photo[] {
  const photos: Photo[] = [];
  
  for (let i = 1; i <= PHOTO_COUNT; i++) {
    photos.push({
      id: `p${i}`,
      src: `/photos/${i}.jpg`,
      alt: `Photo ${i}`,
    });
  }

  const shuffled = [...photos];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function seededRotate(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const r01 = (h % 1000) / 1000;
  return (r01 - 0.5) * 16;
}
