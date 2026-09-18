import type SVGRenderer from "../classes/SVGRenderer";
import { STAFF_LINE_COUNT, STAFF_LINE_SPACING } from "../constants";
import { DEV_GLPYH_ENTRIES, drawDevGlyph, type DevGlyphEntry } from "./devGlyphs";
import type { StaffTypes } from "./devStaffHelpers";

export interface ParsedNote {
  pitches: string[];
  duration: NoteDurations;
  isRest: boolean;
  beamGroup?: number; // Notes sharing the same number should be beamed together
}

export interface VSNoteObj {
  letter: string;
  accidental?: string;
  octave: number;
  duration: NoteDurations;
}

export type NoteDurations = "w" | "h" | "q" | "e" | "s";

export const LEDGER_LINE_X_OFFSET = 0.5;
const LEDGER_LINE_PADDING = 3;
export const NOTE_STEM_LENGTH = (STAFF_LINE_SPACING * (STAFF_LINE_COUNT - 1)) - 5;
export const ACCIDENTAL_X_OFFSET = 4;

export function measureInputNotesParser(input: string) {
  const parsedNotes: ParsedNote[] = [];

  // 1. Split the string by spaces to get individual rhythmic blocks/beats
  const blocks = input.trim().split(/\s+/);

  let currentBeamId = 1;

  for (const block of blocks) {
    if (!block) continue;

    // 2. Check for explicit beaming (hyphens)
    // If there is no hyphen, items array will just have length 1
    const items = block.split('-');
    const isBeamed = items.length > 1;
    const assignedBeamId = isBeamed ? currentBeamId++ : undefined;

    // 3. Parse the individual items
    for (const item of items) {
      let pitches: string[] = [];
      let duration = "q" as NoteDurations;
      let isRest = false;

      if (item.startsWith("R")) {
        // Handle Rests (e.g., "Rq")
        isRest = true;
        duration = item.slice(1) as NoteDurations;
      }
      else if (item.startsWith("[")) {
        // Handle Chords (e.g., "[C4,E4,G4]h")
        const closeBracketIdx = item.indexOf("]");
        const pitchesStr = item.slice(1, closeBracketIdx);

        pitches = pitchesStr.split(",");
        duration = item.slice(closeBracketIdx + 1) as NoteDurations;
      }
      else {
        // Handle Single Notes (e.g., "F#4e")
        // Assumes duration is always the last single character
        duration = item.slice(-1) as NoteDurations;
        pitches = [item.slice(0, -1)];
      }

      parsedNotes.push({
        pitches,
        duration,
        isRest,
        beamGroup: assignedBeamId
      });
    }
  }

  return parsedNotes;
}

export interface PositionedNote extends ParsedNote {
  x: number;
}

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
}

// Calculates the raw step of a given pitch/note, in which step refers to position on the staff
export function getPitchStepClefDifference(letter: string, octave: number, clef: StaffTypes): number {
  const noteStep = (octave * 7) + DIATONIC_STEPS[letter];
  return CLEF_TOP_LINE_STEPS[clef] - noteStep;
}

// Converts the given pitches raw step to exact y coordinate on staff
export function getPitchYCoordinate(rawPitchStep: number): number {
  return rawPitchStep * (STAFF_LINE_SPACING / 2);
}

function getLedgerLineYCoords(rawPitchStep: number): number[] {
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

export function getNoteheadGlyphByDuration(duration: NoteDurations) {
  switch (duration) {
    case "w": return DEV_GLPYH_ENTRIES["NOTEHEAD_WHOLE"];
    case "h": return DEV_GLPYH_ENTRIES["NOTEHEAD_HALF"];
    default: return DEV_GLPYH_ENTRIES["NOTEHEAD_BLACK"];
  };
};

export function getRestGlyphByDuration(duration: NoteDurations) {
  switch (duration) {
    case "w": return DEV_GLPYH_ENTRIES["REST_WHOLE"];
    case "h": return DEV_GLPYH_ENTRIES["REST_HALF"];
    case "q": return DEV_GLPYH_ENTRIES["REST_QUARTER"];
    case "e": return DEV_GLPYH_ENTRIES["REST_EIGHTH"];
    default: return DEV_GLPYH_ENTRIES["REST_SIXTEENTH"];
  };
};

export function getAccidentalGlyph(accidental: string) {
  switch (accidental) {
    case "#": return DEV_GLPYH_ENTRIES["ACCIDENTAL_SHARP"];
    case "##": return DEV_GLPYH_ENTRIES["ACCIDENTAL_DOUBLESHARP"];
    case "b": return DEV_GLPYH_ENTRIES["ACCIDENTAL_FLAT"];
    case "bb": return DEV_GLPYH_ENTRIES["ACCIDENTAL_DOUBLEFLAT"];
    default: return DEV_GLPYH_ENTRIES["ACCIDENTAL_NATURAL"];
  };
};

export function sortVSNoteObjs(notes: VSNoteObj[]) {
  return notes.sort((a, b) => {
    const diffA = getPitchStep(a.letter, a.octave);
    const diffB = getPitchStep(b.letter, b.octave);
    return diffB - diffA;
  });
}

export function drawNotehead(duration: NoteDurations, xPos: number, yPos: number, group: SVGGElement) {
  const glyph = getNoteheadGlyphByDuration(duration);
  drawDevGlyph(glyph, group, { x: xPos, y: yPos });
  return glyph.glyphWidth;
}

type DrawLedgerLinesArgs = {
  noteheadWidth: number;
  xPos: number;
  rawPitchStep: number;
  group: SVGGElement;
  svgRendererRef: SVGRenderer;
}

export function drawLedgerLines({ noteheadWidth, xPos, rawPitchStep, group, svgRendererRef }: DrawLedgerLinesArgs) {
  const ledgerYCoords = getLedgerLineYCoords(rawPitchStep);
  ledgerYCoords.forEach(ledgerY => {
    svgRendererRef.drawLine(
      xPos - LEDGER_LINE_PADDING, ledgerY,
      xPos + noteheadWidth + LEDGER_LINE_PADDING, ledgerY,
      group
    );
  });
};

export function drawAccidental(accidental: string, xPos: number, yPos: number, group: SVGGElement) {
  const glyph = getAccidentalGlyph(accidental);
  drawDevGlyph(glyph, group, { x: xPos, y: yPos });
};

type DrawStemArgs = {
  startY: number;
  endY: number;
  xPos: number;
  group: SVGGElement;
  svgRendererRef: SVGRenderer;
};

export function drawStem({ startY, endY, xPos, group, svgRendererRef }: DrawStemArgs) {
  svgRendererRef.drawLine(xPos, startY, xPos, endY, group);
};

type DrawFlagArgs = {
  duration: NoteDurations;
  isStemDown: boolean;
  xPos: number;
  yPos: number;
  group: SVGGElement;
};

export function drawFlag({ duration, isStemDown, xPos, yPos, group }: DrawFlagArgs) {
  let glyph: DevGlyphEntry;
  if (isStemDown) {
    glyph = duration === "e" ? DEV_GLPYH_ENTRIES["FLAG_EIGHTH_DOWN"] : DEV_GLPYH_ENTRIES["FLAG_SIXTEENTH_DOWN"];
  } else {
    glyph = duration === "e" ? DEV_GLPYH_ENTRIES["FLAG_EIGHTH_UP"] : DEV_GLPYH_ENTRIES["FLAG_SIXTEENTH_UP"];
  }
  drawDevGlyph(glyph, group, { x: xPos, y: yPos });
}

export function calculateSecondIntervalCollisions(notes: VSNoteObj[], noteheadWidth: number) {
  const noteXOffsetMap: Record<number, number> = {};

  for (let i = 0; i < notes.length - 1; i++) {
    const note = notes[i];
    const nextNote = notes[i + 1];
    const pitchStep = getPitchStep(note.letter, note.octave);
    const nextPitchStep = getPitchStep(nextNote.letter, nextNote.octave);

    if (Math.abs(pitchStep - nextPitchStep) === 1) {
      noteXOffsetMap[i + 1] = noteheadWidth;
      // Skip the next note to prevent chain-shifting 3-note clusters improperly
      i++;
    };
  }

  return noteXOffsetMap;
};

/**
 * Assigns column indices to accidentals to prevent visual overlaps in chords.
 * Returns a map of { noteIndex: columnIndex }
 * IMPORTANT: The `notes` array must be sorted by pitch step before calling.
 */
export function calculateAccidentalCollisions(notes: VSNoteObj[]) {
  const accidentalColumnMap: Record<number, number> = {};

  const accidentalIndices: number[] = [];
  for (let i = 0; i < notes.length; i++) {
    if (notes[i].accidental) {
      accidentalIndices.push(i);
    }
  }

  // 2. Use two pointers to assign columns outside-in
  let left = 0;
  let right = accidentalIndices.length - 1;
  let currentColumn = 0;

  while (left <= right) {
    // Assign the highest available note to the current column
    accidentalColumnMap[accidentalIndices[left]] = currentColumn++;
    left++;

    if (left > right) break;

    accidentalColumnMap[accidentalIndices[right]] = currentColumn++;
    right--;
  }

  return accidentalColumnMap;
}

export function drawRest(duration: NoteDurations, yPos: number, noteGroup: SVGGElement) {
  const glyphEntry = getRestGlyphByDuration(duration);
  drawDevGlyph(glyphEntry, noteGroup, { y: yPos });
}