export type Photo = {
  id: string;
  src: string;
  alt?: string;
};

export type PhotoSize = { w: number; h: number } | null;

export type StackTransform = {
  id: string;
  rot: number;
  x: number;
  y: number;
  z: number;
};
