import { getAccidentalGlyph, getClefGlyph, getTimeSigGlyph } from "../glyphs";
import { getPitchStepClefDifference } from "../helpers/_noteHelpers";
import { KEY_SIG_OCTAVES, KEY_SIGNATURE_ORDER, KEY_SIGNATURES, validateKeySignature, validateTimeSignature, type KeySignatures } from "../helpers/staffHelpers";
import type { ClefTypes, SystemTypes } from "../types";
import type SVGRenderer from "./SVGRenderer";

type DrawStaffArgs = {
  width: number;
  staffType: SystemTypes;
  startYPos: number;
  staffGroup: SVGGElement;
};

type DrawKeySignatureArgs = {
  key: KeySignatures,
  staffType: SystemTypes,
  staffGroup: SVGGElement,
}

type DrawTimeSignatureArgs = {
  topNumber: number,
  bottomNumber: number,
  staffType: SystemTypes,
  staffGroup: SVGGElement,
}

const STAFF_LINE_COUNT = 5;
const STAFF_LINE_SPACING = 10;
const STAFF_LINE_SPACING_HALVED = STAFF_LINE_SPACING / 2;
export const BASE_STAFF_HEIGHT = ((STAFF_LINE_COUNT - 1) * STAFF_LINE_SPACING);
export const GRAND_STAFF_SPACING = 60;
export const COMPONENT_GAP = 10;

export const CLEF_X_OFFSET = 4;
const KEY_SIG_ACCIDENTAL_SPACING = 10;

export default class StaffRenderer {
  private svgRendererInstance: SVGRenderer;

  private grandStaffSpacing: number = GRAND_STAFF_SPACING;

  constructor(svgRenderer: SVGRenderer, overrideGrandStaffSpacing?: number) {
    this.svgRendererInstance = svgRenderer;

    if (overrideGrandStaffSpacing) this.grandStaffSpacing = overrideGrandStaffSpacing;
  };

  // Returns the width of the clef glyph
  private drawClefOnStaff(clefType: ClefTypes, yPos: number, staffGroup: SVGGElement) {
    const glyphEntry = getClefGlyph(clefType);

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

  private drawSingleStaff(width: number, clefType: ClefTypes, startYPos: number, staffGroup: SVGGElement) {
    let yCurrent = startYPos;

    for (let i = 0; i < STAFF_LINE_COUNT; i++) {
      this.svgRendererInstance.drawLine(0, yCurrent, width, yCurrent, staffGroup);
      yCurrent += STAFF_LINE_SPACING;
    };

    const glyphWidth = this.drawClefOnStaff(clefType, startYPos, staffGroup);

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
  public drawKeySignature({ key, staffType, staffGroup }: DrawKeySignatureArgs): number {
    validateKeySignature(key);

    const keyDef = KEY_SIGNATURES[key];
    if (keyDef.count === 0) return 0;

    const keySigType = keyDef.type;
    const keySigCount = keyDef.count;
    const glyphDef = getAccidentalGlyph(keySigType);
    const letters = KEY_SIGNATURE_ORDER[keySigType].slice(0, keySigCount);

    if (staffType === "grand") {
      const trebleOctaves = KEY_SIG_OCTAVES.treble[keySigType];
      const bassOctaves = KEY_SIG_OCTAVES.bass[keySigType];
      const trebleStaffHeight = BASE_STAFF_HEIGHT;

      letters.forEach((name, i) => {
        const xOffset = i * KEY_SIG_ACCIDENTAL_SPACING;

        const trebleSteps = getPitchStepClefDifference(name, trebleOctaves[i], "treble");
        const trebleY = trebleSteps * STAFF_LINE_SPACING_HALVED;
        this.svgRendererInstance.drawGlyph(glyphDef.name, staffGroup, { x: xOffset, y: trebleY });

        const bassSteps = getPitchStepClefDifference(name, bassOctaves[i], "bass");
        const bassY = (bassSteps * STAFF_LINE_SPACING_HALVED) + trebleStaffHeight + this.grandStaffSpacing;
        this.svgRendererInstance.drawGlyph(glyphDef.name, staffGroup, { x: xOffset, y: bassY });
      });

    } else {
      const octaves = KEY_SIG_OCTAVES[staffType as ClefTypes][keySigType];

      letters.forEach((name, i) => {
        const steps = getPitchStepClefDifference(name, octaves[i], staffType as ClefTypes);
        const yPos = steps * STAFF_LINE_SPACING_HALVED;

        this.svgRendererInstance.drawGlyph(glyphDef.name, staffGroup, {
          x: i * KEY_SIG_ACCIDENTAL_SPACING,
          y: yPos
        });
      });
    }

    return keySigCount * KEY_SIG_ACCIDENTAL_SPACING;
  }

  /** @returns Total X space taken by the time signature */
  public drawTimeSignature({ topNumber, bottomNumber, staffType, staffGroup }: DrawTimeSignatureArgs) {
    validateTimeSignature(topNumber, bottomNumber);

    // Calculate widths to determine the bounding box
    const topWidth = this.getTimeSigNumberWidth(topNumber);
    const bottomWidth = this.getTimeSigNumberWidth(bottomNumber);
    const maxWidth = Math.max(topWidth, bottomWidth);

    // Calculate the starting X for each number so they are centered over each other
    const topStartX = (maxWidth - topWidth) / 2;
    const bottomStartX = (maxWidth - bottomWidth) / 2;
    const numberHeight = getTimeSigGlyph(4).glyphHeight;

    // Render Top and Bottom numbers
    this.drawTimeSigNumber(topNumber, topStartX, 0, staffGroup);
    this.drawTimeSigNumber(bottomNumber, bottomStartX, numberHeight, staffGroup);

    if (staffType === "grand") {
      const newBaseY = BASE_STAFF_HEIGHT + this.grandStaffSpacing;

      this.drawTimeSigNumber(topNumber, topStartX, newBaseY, staffGroup);
      this.drawTimeSigNumber(bottomNumber, bottomStartX, newBaseY + numberHeight, staffGroup);
    }

    return maxWidth;
  };
}