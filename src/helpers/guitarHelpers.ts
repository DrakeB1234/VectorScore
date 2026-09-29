import type { GuitarStringState } from "../types";

export const GUITAR_STRING_COUNT_DEFAULT = 6;
export const GUITAR_FRET_COUNT_DEFAULT = 5;

export const GUITAR_STRING_SPACING = 22;
export const GUITAR_FRET_SPACING = 30;

export const GUITAR_DOT_RADIUS = 10;
export const GUITAR_MARKER_RADIUS = 6; // radius for the open/muted (o/x) markers above the nut

export const GUITAR_STRING_LABEL_OFFSET = 4;
export const GUITAR_STRING_LABEL_HEIGHT = GUITAR_DOT_RADIUS * 2;

export const GUITAR_DIAGRAM_H_SPACING = 51; // horizontal gap between adjacent chord diagrams
export const GUITAR_DIAGRAM_V_SPACING = 12; // vertical gap between rows of chord diagrams when wrapping
export const GUITAR_DIAGRAM_TOP_PADDING = 4; // includes padding for the top chord label
export const GUITAR_DIAGRAM_BOTTOM_PADDING = 1; // includes padding for the dot markers under diagram

export const GUITAR_NUT_THICKNESS = 4;
export const GUITAR_NUT_X_OFFSET = 1;
export const GUITAR_NUT_SPACE_ABOVE = (GUITAR_MARKER_RADIUS * 2) + GUITAR_NUT_THICKNESS + 8;

export const GUITAR_FONT_BASE = 16;
export const GUITAR_FONT_SMALL = 12;

export const GUITAR_LABEL_HEIGHT = GUITAR_FONT_BASE; // space reserved above the diagram for the chord name label

export const GUITAR_FRET_LABEL_OFFSET_X = 2; // gap between the grid and the "2fr" side label

const REGEX_FRETS_STRING = /^[xX\da-zA-Z]+$/;
const REGEX_FINGERS_STRING = /^[\d]+$/;

export function createStateStrings(frets: string[], fingers: string[]): GuitarStringState[] {
  const result: GuitarStringState[] = [];
  for (let i = 0; i < frets.length; i++) {
    result.push({
      fret: frets[i],
      finger: fingers[i]
    });
  }
  return result;
}

export function calculateStartFret(fretParts: string[], fretCount: number): number {
  const activeFrets = fretParts
    .filter(f => f.toLowerCase() !== 'x' && f !== '0')
    .map(f => parseInt(f, 36));

  // Edge case: String is entirely open strings or muted (e.g., "000000" or "xxxxxx")
  if (activeFrets.length === 0) return 1;

  const minFret = Math.min(...activeFrets);
  const maxFret = Math.max(...activeFrets);

  // Edge case: If the highest fret fits within the default view
  if (maxFret <= fretCount) {
    return 1;
  }

  // Otherwise, shift the diagram down so the lowest fretted note is at the top.
  return minFret;
}

export function parseFretsEntry(frets: string): string[] {
  if (!REGEX_FRETS_STRING.test(frets)) throw new Error("Invalid frets string. Only 'x', 'X', and digits are allowed.");

  return frets.split("");
}

export function parseFingersEntry(fingers: string): string[] {
  if (!REGEX_FINGERS_STRING.test(fingers)) throw new Error("Invalid fingers string. Only digits are allowed.");

  return fingers.split("");
}