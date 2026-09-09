import type { GuitarStringState } from "../types";

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