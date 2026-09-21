import { STAFF_LINE_SPACING } from "../constants";
import type { ClefTypes } from "../types";

export interface VSNoteObj {
  letter: NoteLetters;
  accidental: NoteAccidentals | undefined;
  octave: number;
  duration: NoteDurations;
}

export type NoteLetters = "A" | "B" | "C" | "D" | "E" | "F" | "G";
export type NoteDurations = "w" | "h" | "q" | "e" | "s";
export type NoteAccidentals = "#" | "b" | "n" | "##" | "bb";

const DIATONIC_STEPS: Record<string, number> = {
  "C": 0, "D": 1, "E": 2, "F": 3, "G": 4, "A": 5, "B": 6
};

// Represents the top line pitch/note of each clef, by (octave * 7) + diatonic note index
// Ex: treble: F5 == (5 * 7) + 3 == 38
const CLEF_TOP_LINE_STEPS: Record<ClefTypes, number> = {
  "treble": 38,
  "bass": 26,
  "alto": 32
};

const REGEX_NOTE_STRING = /^(?<letter>[A-Ga-g])(?<accidental>##|bb|[#bn]?)(?<octave>\d)(?<duration>[whqesWHQES])$/;

export function _parseNoteString(noteString: string): VSNoteObj {
  const match = noteString.match(REGEX_NOTE_STRING);

  if (!match || !match.groups) {
    throw new Error(`Invalid note string format: ${noteString}. Expected format: [A-Ga-g][#|b]?[0-9][w|h|q|e].`);
  };

  let { letter, accidental, octave, duration } = match.groups;

  letter = letter.toUpperCase();
  duration = duration.toLowerCase();

  const noteObj: VSNoteObj = {
    letter: letter as NoteLetters,
    octave: parseInt(octave),
    duration: duration as NoteDurations,
    accidental: accidental ? accidental as NoteAccidentals : undefined
  }

  return noteObj;
}

function getPitchStep(letter: string, octave: number) {
  return (octave * 7) + DIATONIC_STEPS[letter];
};

export function getPitchStepClefDifference(letter: string, octave: number, clef: ClefTypes): number {
  const noteStep = (octave * 7) + DIATONIC_STEPS[letter];
  return CLEF_TOP_LINE_STEPS[clef] - noteStep;
};

export function convertPitchStepToYPos(pitchStep: number) {
  return pitchStep * (STAFF_LINE_SPACING / 2);
};

export function getLedgerLineYCoords(rawPitchStep: number): number[] {
  const ledgerYCoords: number[] = [];
  const halfStaffLineSpacing = STAFF_LINE_SPACING / 2;

  for (let i = -2; i >= rawPitchStep; i -= 2) {
    ledgerYCoords.push(i * halfStaffLineSpacing);
  }

  for (let i = 10; i <= rawPitchStep; i += 2) {
    ledgerYCoords.push(i * halfStaffLineSpacing);
  }

  return ledgerYCoords;
}