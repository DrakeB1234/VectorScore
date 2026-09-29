export type SystemTypes = ClefTypes | 'grand';
export type ClefTypes = 'treble' | 'bass' | 'alto';

export type GuitarStringState = { fret: string; finger: string };

export type GuitarBarreDef = {
  fret: number;
  fromString: number;
  toString: number;
  finger?: number;
}

export type GuitarChordDrawOptions = {
  startFret?: number;
  label?: string;
  barres?: GuitarBarreDef[];
}