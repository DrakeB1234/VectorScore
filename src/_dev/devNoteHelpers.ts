import type SVGRenderer from "../classes/SVGRenderer";
import { STAFF_LINE_COUNT, STAFF_LINE_SPACING } from "../constants";
import { DEV_GLPYH_ENTRIES, drawDevGlyph, type DevGlyphEntry } from "./devGlyphs";
import type { SystemStaffTypes } from "./DevStaff";
import type { StaffTypes } from "./devStaffHelpers";

export interface ParsedNote {
  pitches: string[];
  duration: NoteDurations;
  isRest: boolean;
  beamGroup?: number; // Notes sharing the same number should be beamed together
}

export type NoteDurations = "w" | "h" | "q" | "e" | "s";

const baseNoteDurationPosition = 120;

export const noteDurationPositioningMap: Record<NoteDurations, number> = {
  "w": baseNoteDurationPosition,
  "h": baseNoteDurationPosition / 2,
  "q": baseNoteDurationPosition / 4,
  "e": baseNoteDurationPosition / 8,
  "s": baseNoteDurationPosition / 16,
};

const LEDGER_LINE_X_OFFSET = 0.5;
const LEDGER_LINE_PADDING = 3;
const STEM_LENGTH = (STAFF_LINE_SPACING * (STAFF_LINE_COUNT - 1)) - 5;
const ACCIDENTAL_X_OFFSET = 2;

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

// Assigns notes positioning based purely off durations (raw X coords).
export function calculateMeasureSpacing(notes: ParsedNote[]) {
  let currentX = 0;
  const positionedNotes: PositionedNote[] = [];

  notes.forEach(note => {
    positionedNotes.push({
      ...note,
      x: currentX
    });

    let noteWidth = noteDurationPositioningMap[note.duration];
    currentX += noteWidth;
  });

  return {
    positionedNotes,
    rawWidth: currentX
  };
};

export function scaleMeasureSpacing(
  rawSpacing: ReturnType<typeof calculateMeasureSpacing>,
  startX: number,
  scaleRatio: number
) {
  const scaledNotes: PositionedNote[] = [];

  for (const note of rawSpacing.positionedNotes) {
    scaledNotes.push({
      ...note,
      x: startX + (note.x * scaleRatio)
    });
  }

  const finalMeasureWidth = rawSpacing.rawWidth * scaleRatio;

  return {
    positionedNotes: scaledNotes,
    nextStartX: startX + finalMeasureWidth
  };
}

const DIATONIC_STEPS: Record<string, number> = {
  "C": 0, "D": 1, "E": 2, "F": 3, "G": 4, "A": 5, "B": 6
};

const CLEF_TOP_LINE_STEPS: Record<StaffTypes, number> = {
  "treble": 38,
  "bass": 26,
  "alto": 32
};

function getPitchStepDifference(pitchStr: string, clef: StaffTypes): number {
  const letter = pitchStr.charAt(0).toUpperCase();
  const octave = parseInt(pitchStr.slice(-1), 10);

  const noteStep = (octave * 7) + DIATONIC_STEPS[letter];
  return CLEF_TOP_LINE_STEPS[clef] - noteStep;
}

function getPitchYCoordinate(stepDifference: number): number {
  return stepDifference * (STAFF_LINE_SPACING / 2);
}

function getLedgerLineYCoords(stepDifference: number): number[] {
  const ledgerYCoords: number[] = [];
  const halfStaffLineSpacing = STAFF_LINE_SPACING / 2;

  for (let i = -2; i >= stepDifference; i -= 2) {
    ledgerYCoords.push(i * halfStaffLineSpacing);
  }

  for (let i = 10; i <= stepDifference; i += 2) {
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

function getAccidentalFromPitch(pitch: string) {
  const accidental = pitch.slice(1, -1);

  return accidental.length > 0 ? accidental : null;
};

// Parses through edge cases of rendering rest, chord, or single pitches.
export function renderPositionedNotes(
  positionedNotes: ReturnType<typeof scaleMeasureSpacing>,
  systemStaffType: SystemStaffTypes,
  staffYOffset: number,
  svgRendererRef: SVGRenderer) {
  const parsedStaffType = systemStaffType !== "grand" ? systemStaffType : "treble";

  let noteElements: SVGGElement[] = [];

  positionedNotes.positionedNotes.forEach(note => {
    const xPos = note.x;

    const groupType = note.isRest ? "rest" : note.pitches.length > 1 ? "chord" : "note";

    const noteGroup = svgRendererRef.createGroup(groupType);
    noteGroup.setAttribute(`data-${groupType}`, note.pitches.join(",") + note.duration);
    noteGroup.setAttribute(`data-clef`, parsedStaffType);

    // Translate the parent note group
    noteGroup.setAttribute("transform", `translate(${xPos}, ${staffYOffset})`);

    if (note.isRest) {
      renderRest(note, noteGroup);
    } else {
      renderPitchedGroup(note, parsedStaffType, noteGroup, svgRendererRef);
    }

    noteElements.push(noteGroup);
  });

  return noteElements;
};

function renderPitchedGroup(
  note: PositionedNote,
  staffType: StaffTypes,
  noteGroup: SVGGElement,
  svgRendererRef: SVGRenderer
) {
  const noteheadGlyph = getNoteheadGlyphByDuration(note.duration);

  let averageStep = 0;
  let highestY = Infinity;
  let lowestY = -Infinity;

  // Map pitches to a data object so we can manipulate their X-offsets
  const pitchData = note.pitches.map(pitch => {
    const step = getPitchStepDifference(pitch, staffType);
    const y = getPitchYCoordinate(step);

    const accidental = getAccidentalFromPitch(pitch);
    const accidentalGlyph = accidental ? getAccidentalGlyph(accidental) : null;

    averageStep += step;
    if (y < highestY) highestY = y;
    if (y > lowestY) lowestY = y;

    return {
      pitch,
      step,
      y,
      xOffset: 0,
      accidental,
      accidentalGlyph,
      accidentalColumn: 0
    };
  });

  pitchData.sort((a, b) => a.step - b.step);

  // Check for the interval of a second collision
  for (let i = 0; i < pitchData.length - 1; i++) {
    if (Math.abs(pitchData[i].step - pitchData[i + 1].step) === 1) {
      pitchData[i + 1].xOffset = noteheadGlyph.glyphWidth;
      // Skip the next note so the next don't isn't also shifted if 2nd interval
      i++;
    }
  }

  // Tracking stacked accidentals, to properly offset them in chords if too close
  const notesWithAccidentals = pitchData.filter(d => d.accidental);
  const accidentalColumns: number[] = [];
  notesWithAccidentals.forEach(data => {
    let placed = false;

    for (let col = 0; col < accidentalColumns.length; col++) {
      if (Math.abs(data.step - accidentalColumns[col]) >= 5) {
        accidentalColumns[col] = data.step;
        data.accidentalColumn = col;
        placed = true;
        break;
      }
    }

    if (!placed) {
      accidentalColumns.push(data.step);
      data.accidentalColumn = accidentalColumns.length - 1;
    }
  });

  pitchData.forEach(data => {
    const finalX = data.xOffset;

    // Draw Notehead
    drawDevGlyph(noteheadGlyph, noteGroup, { x: finalX, y: data.y });

    // Draw Ledger Lines (centered on the shifted notehead)
    const ledgerYCoords = getLedgerLineYCoords(data.step);
    ledgerYCoords.forEach(ledgerY => {
      svgRendererRef.drawLine(
        finalX - LEDGER_LINE_PADDING, ledgerY,
        finalX + noteheadGlyph.glyphWidth + LEDGER_LINE_PADDING, ledgerY,
        noteGroup
      );
    });

    // Draw Accidentals
    if (data.accidental && data.accidentalGlyph) {
      const glyph = data.accidentalGlyph;

      // Base x for placing accidental
      const baseX = -(glyph.glyphWidth + ACCIDENTAL_X_OFFSET);
      // Shifts determined by data pass earlier, useful for stacked accidental chords
      const columnShift = data.accidentalColumn * (glyph.glyphWidth + ACCIDENTAL_X_OFFSET);
      const accidentalX = baseX - columnShift;

      drawDevGlyph(glyph, noteGroup, { x: accidentalX, y: data.y });
    }
  });

  const avgStep = averageStep / note.pitches.length;
  const isStemDown = avgStep < 4;
  let stemStartY = 0;
  let stemEndY = 0;
  let stemX = 0;

  // Draw stem (across entire chord if applicable)
  if (note.duration !== "w") {
    if (isStemDown) {
      stemX = LEDGER_LINE_X_OFFSET;
      stemStartY = highestY;
      stemEndY = lowestY + STEM_LENGTH;
    } else {
      stemX = noteheadGlyph.glyphWidth - LEDGER_LINE_X_OFFSET;
      stemStartY = lowestY;
      stemEndY = highestY - STEM_LENGTH;
    }

    svgRendererRef.drawLine(stemX, stemStartY, stemX, stemEndY, noteGroup);
  }

  // Draw eighth note flag
  if (note.duration === "e" || note.duration === "s") {
    let glyph: DevGlyphEntry;

    if (isStemDown) {
      if (note.duration === "e") glyph = DEV_GLPYH_ENTRIES["FLAG_EIGHTH_DOWN"];
      else glyph = DEV_GLPYH_ENTRIES["FLAG_SIXTEENTH_DOWN"];
    }
    else {
      if (note.duration === "e") glyph = DEV_GLPYH_ENTRIES["FLAG_EIGHTH_UP"];
      else glyph = DEV_GLPYH_ENTRIES["FLAG_SIXTEENTH_UP"];
    }

    drawDevGlyph(glyph, noteGroup, { x: stemX, y: stemEndY });
  }
}

function renderRest(note: PositionedNote, noteGroup: SVGGElement) {
  const glyphEntry = getRestGlyphByDuration(note.duration);
  drawDevGlyph(glyphEntry, noteGroup);
}