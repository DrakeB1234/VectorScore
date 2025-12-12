import type { StaffParams } from "./strategies/StrategyInterface";
import type { StaffTypes } from "./types";

export const STAFF_LINE_COUNT = 5;
export const STAFF_LINE_SPACING = 10;
export const NOTE_LAYER_START_X = 34;

export const ACCIDENTAL_OFFSET_X = -8;
export const HALF_NOTEHEAD_WIDTH = 10;
export const NOTEHEAD_STEM_HEIGHT = 34;

export const staffParams: Partial<Record<StaffTypes, StaffParams>> = {
  treble: {
    staffType: "treble",
    paddingTop: 13,
    paddingBottom: 3,
    topLineNote: { name: "F", octave: 5 },
    bottomLineNote: { name: "E", octave: 4 },
  },
  bass: {
    staffType: "bass",
    paddingTop: 0,
    paddingBottom: 0,
    topLineNote: { name: "A", octave: 3 },
    bottomLineNote: { name: "G", octave: 2 },
  },
  grand: {
    staffType: "grand",
    paddingTop: 13,
    paddingBottom: 0,
    topLineNote: { name: "F", octave: 5 },
    bottomLineNote: { name: "G", octave: 2 },
  },
}