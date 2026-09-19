import type { StaffTypes } from "../types";

const DIATONIC_STEPS: Record<string, number> = {
  "C": 0, "D": 1, "E": 2, "F": 3, "G": 4, "A": 5, "B": 6
};

// Represents the top line pitch/note of each clef, by (octave * 7) + diatonic note index
// Ex: treble: F5 == (5 * 7) + 3 == 38
const CLEF_TOP_LINE_STEPS: Record<StaffTypes, number> = {
  "treble": 38,
  "bass": 26,
  "alto": 32
};

function getPitchStep(letter: string, octave: number) {
  return (octave * 7) + DIATONIC_STEPS[letter];
};

export function getPitchStepClefDifference(letter: string, octave: number, clef: StaffTypes): number {
  const noteStep = (octave * 7) + DIATONIC_STEPS[letter];
  return CLEF_TOP_LINE_STEPS[clef] - noteStep;
}