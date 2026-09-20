import { getAccidentalGlyph, getClefGlyph, getTimeSigGlyph } from "../glyphs";
import { getPitchStepClefDifference } from "../helpers/_noteHelpers";
import type { StaffTypes, SystemTypes } from "../types";
import type SVGRenderer from "./SVGRenderer";

type DrawStaffArgs = {
  width: number;
  staffType: SystemTypes;
  startYPos: number;
  staffGroup: SVGGElement;
};

type DrawKeySignatureArgs = {
  keySignature: string,
  /** @description Start of key sig, should be the total width taken by the clef */
  startX: number,
  staffType: SystemTypes,
  staffGroup: SVGGElement,
}

type DrawTimeSignatureArgs = {
  topNumber: number,
  bottomNumber: number,
  startX: number,
  staffType: SystemTypes,
  staffGroup: SVGGElement,
}

const STAFF_LINE_COUNT = 5;
const STAFF_LINE_SPACING = 10;
const STAFF_LINE_SPACING_HALVED = STAFF_LINE_SPACING / 2;
const BASE_STAFF_HEIGHT = ((STAFF_LINE_COUNT - 1) * STAFF_LINE_SPACING);
export const GRAND_STAFF_SPACING = 40;

export const CLEF_X_OFFSET = 4;
const KEY_SIG_ACCIDENTAL_SPACING = 10;
const KEY_SIG_PADDING = 8;
const TIME_SIG_PADDING = 8;

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
    flat: [3, 4, 3, 4, 3, 4, 3],
  },
};

export default class StaffRenderer {
  private svgRendererInstance: SVGRenderer;

  private grandStaffSpacing: number = GRAND_STAFF_SPACING;

  constructor(svgRenderer: SVGRenderer, overrideGrandStaffSpacing?: number) {
    this.svgRendererInstance = svgRenderer;

    if (overrideGrandStaffSpacing) this.grandStaffSpacing = overrideGrandStaffSpacing;
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

  private getTimeSigNumberWidth(num: number): number {
    const digits = String(num).split("");
    return digits.reduce((totalWidth, digitStr) => {
      const glyph = getTimeSigGlyph(parseInt(digitStr, 10));
      return totalWidth + glyph.glyphWidth;
    }, 0);
  };

  private drawTimeSigNumber(num: number, startX: number, yPos: number, staffGroup: SVGGElement) {
    let currentX = startX;
    const digits = String(num).split("");

    for (const digitStr of digits) {
      const glyph = getTimeSigGlyph(parseInt(digitStr, 10));

      this.svgRendererInstance.drawGlyph(glyph.name, staffGroup, {
        x: currentX,
        y: yPos
      });

      currentX += glyph.glyphWidth;
    }
  };

  private drawSingleStaff(width: number, staffType: StaffTypes, startYPos: number, staffGroup: SVGGElement) {
    let yCurrent = startYPos;

    for (let i = 0; i < STAFF_LINE_COUNT; i++) {
      this.svgRendererInstance.drawLine(0, yCurrent, width, yCurrent, staffGroup);
      yCurrent += STAFF_LINE_SPACING;
    };

    const glyphWidth = this.drawClefOnStaff(staffType, startYPos, staffGroup);

    return {
      totalStaffHeight: BASE_STAFF_HEIGHT,
      glyphWidth
    };
  };

  // Top level function, draws either single or grand staff AND render clef / clefs
  /** 
   * @returns {number} totalStaffHeight: The total space taken by either single staff or grand staff (which grand staff includes the spacing inbetween the two staffs)
   * @returns {number} glyphWidth: The width of the clef glyph
  */
  public drawStaff({ width, staffType, startYPos, staffGroup }: DrawStaffArgs) {
    if (staffType === "grand") {
      const treble = this.drawSingleStaff(width, "treble", startYPos, staffGroup);
      const bass = this.drawSingleStaff(width, "bass", startYPos + treble.totalStaffHeight + this.grandStaffSpacing, staffGroup);

      // Choose the largest glyph from drawn glyphs
      const widestGlyph = Math.max(treble.glyphWidth, bass.glyphWidth);

      return {
        totalStaffHeight: treble.totalStaffHeight + bass.totalStaffHeight + this.grandStaffSpacing,
        glyphWidth: widestGlyph
      };
    }

    return this.drawSingleStaff(width, staffType, startYPos, staffGroup);
  };

  public drawStaffBarLine(xPos: number, staffType: SystemTypes, staffGroup: SVGGElement) {
    let topY = BASE_STAFF_HEIGHT;

    if (staffType === "grand") {
      topY = topY * 2 + this.grandStaffSpacing;
    }

    this.svgRendererInstance.drawLine(xPos, 0, xPos, topY, staffGroup);
  };

  /** @returns Total X space taken by the key signature */
  public drawKeySignature({ keySignature, staffType, startX: clefEndX, staffGroup }: DrawKeySignatureArgs): number {
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
      const trebleStaffHeight = BASE_STAFF_HEIGHT;

      letters.forEach((name, i) => {
        const xOffset = keySigStartX + i * KEY_SIG_ACCIDENTAL_SPACING;

        const trebleSteps = getPitchStepClefDifference(name, trebleOctaves[i], "treble");
        const trebleY = trebleSteps * STAFF_LINE_SPACING_HALVED;
        this.svgRendererInstance.drawGlyph(glyphDef.name, staffGroup, { x: xOffset, y: trebleY });

        const bassSteps = getPitchStepClefDifference(name, bassOctaves[i], "bass");
        const bassY = (bassSteps * STAFF_LINE_SPACING_HALVED) + trebleStaffHeight + this.grandStaffSpacing;
        this.svgRendererInstance.drawGlyph(glyphDef.name, staffGroup, { x: xOffset, y: bassY });
      });

    } else {
      const octaves = KEY_SIG_OCTAVES[staffType as StaffTypes][keySigType];

      letters.forEach((name, i) => {
        const steps = getPitchStepClefDifference(name, octaves[i], staffType as StaffTypes);
        const yPos = steps * STAFF_LINE_SPACING_HALVED;

        this.svgRendererInstance.drawGlyph(glyphDef.name, staffGroup, {
          x: keySigStartX + i * KEY_SIG_ACCIDENTAL_SPACING,
          y: yPos
        });
      });
    }

    return (keySigCount * KEY_SIG_ACCIDENTAL_SPACING) + KEY_SIG_PADDING;
  }

  /** @returns Total X space taken by the time signature */
  public drawTimeSignature({ topNumber, bottomNumber, staffType, startX, staffGroup }: DrawTimeSignatureArgs) {
    const paddedStartX = startX + TIME_SIG_PADDING;

    // Calculate widths to determine the bounding box
    const topWidth = this.getTimeSigNumberWidth(topNumber);
    const bottomWidth = this.getTimeSigNumberWidth(bottomNumber);
    const maxWidth = Math.max(topWidth, bottomWidth);

    // 2Calculate the starting X for each number so they are centered over each other
    const topStartX = paddedStartX + (maxWidth - topWidth) / 2;
    const bottomStartX = paddedStartX + (maxWidth - bottomWidth) / 2;

    // Height for numbers, which are all close enough to just grab the height from the "4"
    const numberHeight = getTimeSigGlyph(4).glyphHeight;

    // 4. Render Top and Bottom numbers
    this.drawTimeSigNumber(topNumber, topStartX, 0, staffGroup);
    this.drawTimeSigNumber(bottomNumber, bottomStartX, numberHeight, staffGroup);

    if (staffType === "grand") {
      const newBaseY = BASE_STAFF_HEIGHT + this.grandStaffSpacing;

      this.drawTimeSigNumber(topNumber, topStartX, newBaseY, staffGroup);
      this.drawTimeSigNumber(bottomNumber, bottomStartX, newBaseY + numberHeight, staffGroup);
    }

    return maxWidth + TIME_SIG_PADDING;
  }
}