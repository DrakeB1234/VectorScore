import type { StaffTypes } from "../types";

type KeySignatureDef = { type: string; count: number };

export const KEY_SIGNATURE_ORDER: Record<string, string[]> = {
  sharp: ["F", "C", "G", "D", "A", "E", "B"],
  flat: ["B", "E", "A", "D", "G", "C", "F"],
};

export const KEY_SIGNATURES: Record<string, KeySignatureDef> = {
  C: { type: "sharp", count: 0 },
  G: { type: "sharp", count: 1 },
  D: { type: "sharp", count: 2 },
  A: { type: "sharp", count: 3 },
  E: { type: "sharp", count: 4 },
  B: { type: "sharp", count: 5 },
  "F#": { type: "sharp", count: 6 },
  "C#": { type: "sharp", count: 7 },
  F: { type: "flat", count: 1 },
  Bb: { type: "flat", count: 2 },
  Eb: { type: "flat", count: 3 },
  Ab: { type: "flat", count: 4 },
  Db: { type: "flat", count: 5 },
  Gb: { type: "flat", count: 6 },
  Cb: { type: "flat", count: 7 },
};

// per-clef, in the order F C G D A E B / B E A D G C F
export const KEY_SIG_OCTAVES: Record<StaffTypes, Record<string, number[]>> = {
  treble: {
    sharp: [5, 5, 5, 5, 4, 5, 4], // F5 C5 G5 D5 A4 E5 B4
    flat: [4, 5, 4, 5, 4, 5, 4],  // B4 E5 A4 D5 G4 C5 F4
  },
  bass: {
    sharp: [3, 3, 3, 3, 2, 3, 2], // F3 C3 G3 D3 A2 E3 B2
    flat: [2, 3, 2, 3, 2, 3, 2],  // B2 E3 A2 D3 G2 C3 F2
  },
  alto: {
    sharp: [4, 4, 4, 4, 3, 4, 3], // F4 C4 G4 D4 A3 E4 B3
    flat: [3, 4, 3, 4, 3, 4, 3],  // B3 E4 A3 D4 G3 C4 F3
  },
};

/** @throws Error - If key is not in record */
export function validateKeySignature(key: string): void {
  const def = KEY_SIGNATURES[key];
  if (!def) throw new Error(`Unknown key signature "${key}". Valid keys: ${Object.keys(KEY_SIGNATURES).join(", ")}`);
};

/** @throws Error - Invalid values, numbers over 100 or NaN */
export function validateTimeSignature(top: number, bottom: number): void {
  if (isNaN(top) || isNaN(bottom)) throw new Error("Invalid time signature values. Must be less than 100 for each parameter.");
  if (top > 100 || bottom > 100) throw new Error("Invalid time signature values. Must be less than 100 for each parameter.");
}