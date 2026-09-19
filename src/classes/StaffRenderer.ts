import { getAccidentalGlyph, getClefGlyph } from "../glyphs";
import { getPitchStepClefDifference } from "../helpers/_noteHelpers";
import type { StaffTypes, SystemTypes } from "../types";
import type SVGRenderer from "./SVGRenderer";

type DrawStaffArgs = {
  width: number;
  staffType: SystemTypes;
  startYPos: number;
  staffGroup: SVGGElement;
  /** @description overrides the global constant for grand staff spacing */
  grandStaffSpacing?: number;
};

type DrawKeySignatureArgs = {
  keySignature: string,
  /** @description Start of key sig, should be the total width taken by the clef */
  clefEndX: number,
  staffType: SystemTypes,
  staffGroup: SVGGElement,
  /** @description overrides the global constant for start x of key sig */
  grandStaffSpacing?: number;
}

const STAFF_LINE_COUNT = 5;
const STAFF_LINE_SPACING = 10;
export const GRAND_STAFF_SPACING = 40;
export const CLEF_X_OFFSET = 4;
const KEY_SIG_ACCIDENTAL_SPACING = 10;
const KEY_SIG_PADDING = 8;

type KeySignatureDef = { type: string; count: number };

const KEY_SIGNATURE_ORDER: Record<string, string[]> = {
  sharp: ["F", "C", "G", "D", "A", "E", "B"],
  flat: ["B", "E", "A", "D", "G", "C", "F"],
};

const KEY_SIGNATURES: Record<string, KeySignatureDef> = {
  C: { type: "sharp", count: 0 },
  G: { type: "sharp", count: 1 },
  D: { type: "sharp", count: 2 },
  A: { type: "sharp", count: 3 },
  E: { type: "sharp", count: 4 },
  B: { type: "sharp", count: 5 },
  "F#": { type: "sharp", count: 6 },
  F: { type: "flat", count: 1 },
  Bb: { type: "flat", count: 2 },
  Eb: { type: "flat", count: 3 },
  Ab: { type: "flat", count: 4 },
  Db: { type: "flat", count: 5 },
  Gb: { type: "flat", count: 6 },
};

// per-clef, in the order F C G D A E B / B E A D G C F
export const KEY_SIG_OCTAVES: Record<StaffTypes, Record<string, number[]>> = {
  treble: {
    sharp: [5, 5, 5, 5, 4, 5, 4],
    flat: [4, 5, 4, 5, 4, 5, 4],
  },
  bass: {
    sharp: [3, 3, 3, 3, 2, 3, 2],
    flat: [2, 3, 2, 3, 2, 3, 3],
  },
  alto: {
    sharp: [4, 4, 4, 4, 3, 4, 4],
    flat: [4, 5, 4, 5, 4, 5, 4],
  },
};

export default class StaffRenderer {
  private svgRendererInstance: SVGRenderer;

  constructor(svgRenderer: SVGRenderer) {
    this.svgRendererInstance = svgRenderer;
  };

  // Returns the width of the clef glyph
  private drawClefOnStaff(staffType: StaffTypes, yPos: number, staffGroup: SVGGElement) {
    const glyphEntry = getClefGlyph(staffType);

    this.svgRendererInstance.drawGlyph(glyphEntry.name, staffGroup, {
      y: yPos,
      x: CLEF_X_OFFSET
    });

    return glyphEntry.glyphWidth;
  };

  private drawSingleStaff(width: number, staffType: StaffTypes, startYPos: number, staffGroup: SVGGElement) {
    let yCurrent = startYPos;

    for (let i = 0; i < STAFF_LINE_COUNT; i++) {
      this.svgRendererInstance.drawLine(0, yCurrent, width, yCurrent, staffGroup);
      yCurrent += STAFF_LINE_SPACING;
    };

    const glyphWidth = this.drawClefOnStaff(staffType, startYPos, staffGroup);

    return {
      totalStaffHeight: (STAFF_LINE_COUNT - 1) * STAFF_LINE_SPACING,
      glyphWidth
    };
  };

  // Top level function, will call drawClef and any other subsequent methods
  // Returns the base height of either single or grand staff
  public drawStaff({ width, staffType, startYPos, staffGroup, grandStaffSpacing = GRAND_STAFF_SPACING }: DrawStaffArgs) {
    if (staffType === "grand") {
      const treble = this.drawSingleStaff(width, "treble", startYPos, staffGroup);
      const bass = this.drawSingleStaff(width, "bass", startYPos + treble.totalStaffHeight + grandStaffSpacing, staffGroup);

      // Choose the largest glyph from drawn glyphs
      const widestGlyph = Math.max(treble.glyphWidth, bass.glyphWidth);

      return {
        totalStaffHeight: treble.totalStaffHeight + bass.totalStaffHeight + grandStaffSpacing,
        glyphWidth: widestGlyph
      };
    }

    return this.drawSingleStaff(width, staffType, startYPos, staffGroup);
  };

  public drawStaffBarLine(xPos: number, staffType: SystemTypes, staffGroup: SVGGElement) {
    let topY = ((STAFF_LINE_COUNT - 1) * STAFF_LINE_SPACING);

    if (staffType === "grand") {
      topY = topY * 2 + GRAND_STAFF_SPACING;
    }

    this.svgRendererInstance.drawLine(xPos, 0, xPos, topY, staffGroup);
  };

  public drawKeySignature({ keySignature, staffType, clefEndX, grandStaffSpacing = GRAND_STAFF_SPACING, staffGroup }: DrawKeySignatureArgs): number {
    const def = KEY_SIGNATURES[keySignature];
    if (!def) throw new Error(`Unknown key signature "${keySignature}". Valid keys: ${Object.keys(KEY_SIGNATURES).join(", ")}`);
    if (def.count === 0) return 0;

    const keySigType = def.type;
    const keySigCount = def.count;
    const glyphDef = getAccidentalGlyph(keySigType);
    const letters = KEY_SIGNATURE_ORDER[keySigType].slice(0, keySigCount);

    const keySigStartX = clefEndX + KEY_SIG_PADDING;

    if (staffType === "grand") {
      const trebleOctaves = KEY_SIG_OCTAVES.treble[keySigType];
      const bassOctaves = KEY_SIG_OCTAVES.bass[keySigType];
      const trebleStaffHeight = (STAFF_LINE_COUNT - 1) * STAFF_LINE_SPACING;

      letters.forEach((name, i) => {
        const xOffset = keySigStartX + i * KEY_SIG_ACCIDENTAL_SPACING;

        const trebleSteps = getPitchStepClefDifference(name, trebleOctaves[i], "treble");
        const trebleY = trebleSteps * (STAFF_LINE_SPACING / 2);
        this.svgRendererInstance.drawGlyph(glyphDef.name, staffGroup, { x: xOffset, y: trebleY });

        const bassSteps = getPitchStepClefDifference(name, bassOctaves[i], "bass");
        const bassY = (bassSteps * (STAFF_LINE_SPACING / 2)) + trebleStaffHeight + grandStaffSpacing;
        this.svgRendererInstance.drawGlyph(glyphDef.name, staffGroup, { x: xOffset, y: bassY });
      });

    } else {
      const octaves = KEY_SIG_OCTAVES[staffType as StaffTypes][keySigType];

      letters.forEach((name, i) => {
        const steps = getPitchStepClefDifference(name, octaves[i], staffType as StaffTypes);
        const yPos = steps * (STAFF_LINE_SPACING / 2);

        this.svgRendererInstance.drawGlyph(glyphDef.name, staffGroup, {
          x: keySigStartX + i * KEY_SIG_ACCIDENTAL_SPACING,
          y: yPos
        });
      });
    }

    return (keySigCount * KEY_SIG_ACCIDENTAL_SPACING) + KEY_SIG_PADDING;
  }
}