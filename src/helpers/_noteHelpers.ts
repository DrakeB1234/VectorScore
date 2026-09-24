import { STAFF_LINE_SPACING } from "../constants";
import type { ClefTypes } from "../types";

export interface VSNoteObj {
  letter: NoteLetters;
  accidental: NoteAccidentals | null;
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

export type LedgerLineSpan = {
  y: number;
  minX: number;
  maxX: number;
};

export type AccidentalPlacement = {
  accidental: NoteAccidentals;
  yPos: number;
  /** 0 = closest to the noteheads, higher numbers sit further left */
  column: number;
};

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
const TOP_LINE_STEP = 0;
const BOTTOM_LINE_STEP = 8;

export const STANDARD_STEM_STEPS = 7;
export const SECOND_INTERVAL_X_OFFSET = 1;

// Accidentals whose notes are a seventh (6 steps) or more apart don't overlap vertically, so they can share a column.
const ACCIDENTAL_MIN_STEP_GAP = 6;

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
    accidental: accidental ? accidental as NoteAccidentals : null
  }

  return noteObj;
};

export function parseChordNoteString(chordNoteString: string): VSChordNoteObj {
  const match = chordNoteString.match(REGEX_CHORD_NOTE_STRING);

  if (!match || !match.groups) {
    throw new Error(`Invalid chord note string format: ${chordNoteString}. Expected format: [A-Ga-g][#|b]?[0-9].`);
  };

  let { letter, accidental, octave } = match.groups;

  letter = letter.toUpperCase();

  const noteObj: VSChordNoteObj = {
    letter: letter as NoteLetters,
    octave: parseInt(octave),
    accidental: accidental ? accidental as NoteAccidentals : null
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

/** 
 * - Handles cases of ledger lines above / below the staff
 * - For example, i starts at -2 (two steps) above staff and i starts at 10 (2 steps below staff)
 */
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

export function getChordStemDirection(notes: Pick<PositionedChordNote, "pitchStep">[]): boolean {
  if (notes.length === 0) return false;

  // Rule 1: whichever side of the middle line holds more noteheads decides direction.
  // Notes on the middle line count for neither side. More notes above -> stem down, more below -> stem up.
  const notesAbove = notes.filter(n => n.pitchStep < MIDDLE_LINE_STEP).length;
  const notesBelow = notes.filter(n => n.pitchStep > MIDDLE_LINE_STEP).length;
  if (notesAbove !== notesBelow) return notesAbove > notesBelow;

  // Rule 2: If equal amount of notes, the note furthest from the middle line decides.
  // If still equal, standard notation defaults to stem DOWN.
  const { highStep, lowStep } = getPitchStepRange(notes);
  const distHigh = Math.abs(highStep - MIDDLE_LINE_STEP);
  const distLow = Math.abs(lowStep - MIDDLE_LINE_STEP);

  return distHigh >= distLow;
};

/** 
 * - Where a stem starts and ends, in pitch steps. Works for single note / chords
 * - Will attach stem to AT LEAST the middle line.
 */
export function getStemSteps(highStep: number, lowStep: number, isStemDown: boolean) {
  if (isStemDown) {
    return {
      startStep: highStep,
      endStep: Math.max(lowStep + STANDARD_STEM_STEPS, MIDDLE_LINE_STEP)
    };
  }

  return {
    startStep: lowStep,
    endStep: Math.min(highStep - STANDARD_STEM_STEPS, MIDDLE_LINE_STEP)
  };
};

/** 
 * - Pitch steps count down from the top line of staff. Smallest step is the highest pitch.
 * @returns highStep: highest pitch in range
 * @returns lowStep: lowest pitch in range
 */
export function getPitchStepRange(notes: Pick<PositionedChordNote, "pitchStep">[]) {
  const steps = notes.map(n => n.pitchStep);
  return { highStep: Math.min(...steps), lowStep: Math.max(...steps) };
};

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
};

// Only considers notes above and below the staff. Notes inside staff are ignored.
export function getChordLedgerLineSpans(
  notes: Pick<PositionedChordNote, "pitchStep" | "xOffset">[],
  noteHeadWidth: number
): LedgerLineSpan[] {
  const above = notes.filter(n => n.pitchStep < TOP_LINE_STEP);
  const below = notes.filter(n => n.pitchStep > BOTTOM_LINE_STEP);
  let spans: LedgerLineSpan[] = [];

  if (above.length > 0) {
    const ledgerLineSpans = createSideLedgerSpans(above, getPitchStepRange(above).highStep, noteHeadWidth);
    spans.push(...ledgerLineSpans);
  }
  if (below.length > 0) {
    const ledgerLineSpans = createSideLedgerSpans(below, getPitchStepRange(below).lowStep, noteHeadWidth);
    spans.push(...ledgerLineSpans);
  }

  return spans;
};

// Extreme step is the furthest note from either above or below the staff. Side notes refer to which side on staff (above / below).
function createSideLedgerSpans(
  sideNotes: Pick<PositionedChordNote, "pitchStep" | "xOffset">[],
  extremeStep: number,
  noteHeadWidth: number
): LedgerLineSpan[] {
  const ledgerYCoords = getLedgerLineYCoords(extremeStep);
  if (ledgerYCoords.length === 0) return [];

  // Every ledger line on this side (above / below staff) spans all noteheads beyond
  const xOffsets = sideNotes.map(n => n.xOffset);
  const minX = Math.min(...xOffsets);
  const maxX = Math.max(...xOffsets) + noteHeadWidth;
  const spans: LedgerLineSpan[] = ledgerYCoords.map(y => ({ y, minX, maxX }));

  // Exception: if the extreme (first / last) note sits ON the outermost line, that line only needs
  // to cover that single notehead. Even steps are lines, odd steps are spaces.
  if (Math.abs(extremeStep) % 2 === 0) {
    const extremeXOffsets = sideNotes.filter(n => n.pitchStep === extremeStep).map(n => n.xOffset);
    const outermost = spans[spans.length - 1];
    outermost.minX = Math.min(...extremeXOffsets);
    outermost.maxX = Math.max(...extremeXOffsets) + noteHeadWidth;
  }

  return spans;
};

export function assignAccidentalColumns(notes: PositionedChordNote[]): AccidentalPlacement[] {
  // filter() copies, so sorting here doesn't reorder the caller's array
  const highToLow = notes
    .filter(n => n.noteObj.accidental !== null)
    .sort((a, b) => a.pitchStep - b.pitchStep);

  const columnSteps: number[][] = []; // Pitch steps of the accidentals already placed in each column
  const placements: AccidentalPlacement[] = [];

  for (const note of highToLow) {
    const accidental = note.noteObj.accidental;
    if (!accidental) continue;

    let column = columnSteps.findIndex(steps =>
      steps.every(step => Math.abs(step - note.pitchStep) >= ACCIDENTAL_MIN_STEP_GAP)
    );

    if (column === -1) {
      column = columnSteps.length;
      columnSteps.push([]);
    }

    columnSteps[column].push(note.pitchStep);
    placements.push({ accidental, yPos: note.yPos, column });
  }

  return placements;
};