import { STAFF_LINE_SPACING } from "../constants";
import type { ClefTypes } from "../types";

export interface VSNoteObj {
  letter: NoteLetters;
  accidental: NoteAccidentals | undefined;
  octave: number;
  duration: NoteDurations;
};

export type VSChordNoteObj = Omit<VSNoteObj, "duration">;

export type PositionedChordNote = {
  noteObj: VSChordNoteObj;
  pitchStep: number;
  yPos: number;
  xOffset: number;
};

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

export const MIDDLE_LINE_STEP = 4;
const SECOND_INTERVAL_X_OFFSET = 1;

const REGEX_NOTE_STRING = /^(?<letter>[A-Ga-g])(?<accidental>##|bb|[#bn]?)(?<octave>\d)(?<duration>[whqesWHQES])$/;
const REGEX_CHORD_NOTE_STRING = /^(?<letter>[A-Ga-g])(?<accidental>##|bb|[#bn]?)(?<octave>\d)$/;

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
};

export function parseChordNoteString(chordNoteString: string): VSChordNoteObj {
  const match = chordNoteString.match(REGEX_CHORD_NOTE_STRING);

  if (!match || !match.groups) {
    throw new Error(`Invalid note string format: ${chordNoteString}. Expected format: [A-Ga-g][#|b]?[0-9].`);
  };

  let { letter, accidental, octave } = match.groups;

  letter = letter.toUpperCase();

  const noteObj: VSChordNoteObj = {
    letter: letter as NoteLetters,
    octave: parseInt(octave),
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
};

export function isSecondInterval(lowNotePitchStep: number, highNotePitchStep: number) {
  return Math.abs(highNotePitchStep - lowNotePitchStep) === 1;
};

export function getChordStemDirection(notes: PositionedChordNote[]): boolean {
  if (notes.length === 0) return false;

  const steps = notes.map(n => n.pitchStep);
  const lowestPitchStep = Math.max(...steps);
  const highestPitchStep = Math.min(...steps);

  const distLow = Math.abs(lowestPitchStep - MIDDLE_LINE_STEP);
  const distHigh = Math.abs(highestPitchStep - MIDDLE_LINE_STEP);

  // Rule: The note furthest from the middle line dictates the stem. 
  // If equal distance, standard notation defaults to stem DOWN.
  return distHigh >= distLow;
}

/** @returns X offset IF has second interval, will be 0 unless is offsetted negatively */
export function applySecondIntervalOffsets(notes: PositionedChordNote[], isStemDown: boolean, baseWidth: number) {

  // Sort pitches lowest to highest pitch
  const sorted = notes.sort((a, b) => b.pitchStep - a.pitchStep);

  if (!isStemDown) {
    // STEM UP: Base notes sit on the LEFT. Displaced notes shift RIGHT.
    // Iterate bottom-to-top, shifting the higher note of the collision to the right.
    for (let i = 0; i < sorted.length - 1; i++) {
      const lowerNote = sorted[i];
      const higherNote = sorted[i + 1];

      if (isSecondInterval(lowerNote.pitchStep, higherNote.pitchStep) && lowerNote.xOffset === 0) {
        higherNote.xOffset = baseWidth - SECOND_INTERVAL_X_OFFSET;
      }
    }
  } else {
    for (let i = sorted.length - 1; i > 0; i--) {
      const higherNote = sorted[i];
      const lowerNote = sorted[i - 1];

      if (isSecondInterval(lowerNote.pitchStep, higherNote.pitchStep) && higherNote.xOffset === 0) {
        lowerNote.xOffset = -baseWidth + SECOND_INTERVAL_X_OFFSET;
      }
    }
  }
}