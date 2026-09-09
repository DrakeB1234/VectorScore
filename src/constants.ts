import type { StaffParams } from "./strategies/StrategyInterface";
import type { Durations, StaffTypes } from "./types";

export const NAMESPACE = "vs";

// Staff constants
export const STAFF_LINE_COUNT = 5;
export const STAFF_LINE_SPACING = 10;
export const NOTE_LAYER_START_X = 38;
export const GRAND_STAFF_SPACING = 30;

// Accidental constants
export const ACCIDENTAL_OFFSET_X = -8;
export const DOUBLE_SHARP_ACCIDENTAL_OFFSET_X = -2;
export const DOUBLE_FLAT_ACCIDENTAL_OFFSET_X = -6;

// Note constants
export const HALF_NOTEHEAD_WIDTH = 10;
export const NOTEHEAD_STEM_HEIGHT = 28;
export const NOTE_SPACING = 28;

// Ledger line constants
export const START_LEDGER_LINE_X = -2;
export const WHOLE_NOTE_LEDGER_LINE_WIDTH = 17;
export const HALF_NOTE_LEDGER_LINE_WIDTH = 12.5;

// Chord constants
export const CHORD_MAX_CONSECUTIVE_ACCIDENTALS = 3;


export const staffParams: Record<StaffTypes, StaffParams> = {
  treble: {
    staffType: "treble",
    paddingTop: 13,
    paddingBottom: 3,
    topLineNote: { name: "F", octave: 5 },
    topLineYPos: 0,
    bottomLineYPos: STAFF_LINE_SPACING * (STAFF_LINE_COUNT - 1),
  },
  bass: {
    staffType: "bass",
    paddingTop: 0,
    paddingBottom: 0,
    topLineNote: { name: "A", octave: 3 },
    topLineYPos: 0,
    bottomLineYPos: STAFF_LINE_SPACING * (STAFF_LINE_COUNT - 1)
  },
  alto: {
    staffType: "alto",
    paddingTop: 0,
    paddingBottom: 0,
    topLineNote: { name: "G", octave: 4 },
    topLineYPos: 0,
    bottomLineYPos: STAFF_LINE_SPACING * (STAFF_LINE_COUNT - 1)
  },
  grand: {
    staffType: "grand",
    paddingTop: 13,
    paddingBottom: 0,
    topLineNote: { name: "F", octave: 5 },
    topLineYPos: 0,
    bottomLineYPos: STAFF_LINE_SPACING * (STAFF_LINE_COUNT * 2 - 2) + GRAND_STAFF_SPACING
  },
}

export const durationBeatValueMap: Record<Durations, number> = {
  w: 4,
  h: 2,
  q: 1,
  e: 0.5,
  s: 0.25
};

// Guitar chord diagram constants
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
export const GUITAR_NUT_SPACE_ABOVE = (GUITAR_MARKER_RADIUS * 2) + GUITAR_NUT_THICKNESS + 4;

export const GUITAR_FONT_BASE = 16;
export const GUITAR_FONT_SMALL = 12;

export const GUITAR_LABEL_HEIGHT = GUITAR_FONT_BASE; // space reserved above the diagram for the chord name label

export const GUITAR_FRET_LABEL_OFFSET_X = 2; // gap between the grid and the "2fr" side label