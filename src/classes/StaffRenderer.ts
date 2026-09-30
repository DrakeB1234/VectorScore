import { getAccidentalGlyph, getClefGlyph, getTimeSigGlyph } from "../glyphs";
import { getPitchStepClefDifference } from "../helpers/noteHelpers";
import { BASE_STAFF_HEIGHT, GRAND_STAFF_SPACING, KEY_SIG_OCTAVES, KEY_SIGNATURE_ORDER, KEY_SIGNATURES, STAFF_LINE_COUNT, STAFF_LINE_SPACING, STAFF_LINE_SPACING_HALVED, validateKeySignature, validateTimeSignature, type KeySignatures } from "../helpers/staffHelpers";
import type { ClefTypes, SystemTypes } from "../types";
import type SVGRenderer from "./SVGRenderer";

type DrawStaffLinesArgs = {
  width: number;
  startYPos: number;
  staffGroup: SVGGElement;
};

type DrawClefsArgs = {
  clefType: ClefTypes;
  startYPos: number;
  clefGroup: SVGGElement;
};

type DrawKeySignatureArgs = {
  key: KeySignatures;
  clefType: ClefTypes;
  startYPos: number;   // Drives the vertical placement
  staffGroup: SVGGElement;
}

type DrawTimeSignatureArgs = {
  topNumber: number;
  bottomNumber: number;
  startYPos: number;   // Drives vertical placement
  staffGroup: SVGGElement;
}

export const COMPONENT_GAP = 10;

export const CLEF_X_OFFSET = 4;
const KEY_SIG_ACCIDENTAL_SPACING = 12;

export default class StaffRenderer {
  private svgRendererInstance: SVGRenderer;

  private grandStaffSpacing: number = GRAND_STAFF_SPACING;

  constructor(svgRenderer: SVGRenderer, overrideGrandStaffSpacing?: number) {
    this.svgRendererInstance = svgRenderer;

    if (overrideGrandStaffSpacing) this.grandStaffSpacing = overrideGrandStaffSpacing;
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

  /** @returns Total X space taken by the clef(s), including offsets */
  public drawClef({ clefType: staffType, startYPos, clefGroup: staffGroup }: DrawClefsArgs): number {
    const glyphEntry = getClefGlyph(staffType);

    this.svgRendererInstance.drawGlyph(glyphEntry.name, staffGroup, {
      y: startYPos,
      x: CLEF_X_OFFSET
    });

    return glyphEntry.glyphWidth + CLEF_X_OFFSET;
  }

  /** @returns Total Y space taken by the staff lines */
  public drawStaffLines({ width, startYPos, staffGroup }: DrawStaffLinesArgs): number {
    let yCurrent = startYPos;

    for (let i = 0; i < STAFF_LINE_COUNT; i++) {
      this.svgRendererInstance.drawLine(0, yCurrent, width, yCurrent, staffGroup);
      yCurrent += STAFF_LINE_SPACING;
    }

    return BASE_STAFF_HEIGHT;
  }

  public drawStaffBarLine(xPos: number, staffType: SystemTypes, staffGroup: SVGGElement) {
    let topY = BASE_STAFF_HEIGHT;

    if (staffType === "grand") {
      topY = topY * 2 + this.grandStaffSpacing;
    }

    this.svgRendererInstance.drawLine(xPos, 0, xPos, topY, staffGroup);
  };

  /** @returns Total X space taken by the key signature */
  public drawKeySignature({ key, clefType, startYPos, staffGroup }: DrawKeySignatureArgs): number {
    validateKeySignature(key);

    const keyDef = KEY_SIGNATURES[key];
    if (keyDef.count === 0) return 0;

    const keySigType = keyDef.type;
    const keySigCount = keyDef.count;
    const glyphDef = getAccidentalGlyph(keySigType);
    const letters = KEY_SIGNATURE_ORDER[keySigType].slice(0, keySigCount);

    // Grab the octaves for this specific clef
    const octaves = KEY_SIG_OCTAVES[clefType][keySigType];

    letters.forEach((name, i) => {
      const steps = getPitchStepClefDifference(name, octaves[i], clefType);
      const yPos = (steps * STAFF_LINE_SPACING_HALVED) + startYPos;

      this.svgRendererInstance.drawGlyph(glyphDef.name, staffGroup, {
        x: i * KEY_SIG_ACCIDENTAL_SPACING,
        y: yPos
      });
    });

    return keySigCount * KEY_SIG_ACCIDENTAL_SPACING;
  }

  /** @returns Total X space taken by the time signature */
  public drawTimeSignature({ topNumber, bottomNumber, startYPos, staffGroup }: DrawTimeSignatureArgs) {
    validateTimeSignature(topNumber, bottomNumber);

    const topWidth = this.getTimeSigNumberWidth(topNumber);
    const bottomWidth = this.getTimeSigNumberWidth(bottomNumber);
    const maxWidth = Math.max(topWidth, bottomWidth);

    const topStartX = (maxWidth - topWidth) / 2;
    const bottomStartX = (maxWidth - bottomWidth) / 2;
    const numberHeight = getTimeSigGlyph(4).glyphHeight;

    // Render Top and Bottom numbers using the dynamic startYPos
    this.drawTimeSigNumber(topNumber, topStartX, startYPos, staffGroup);
    this.drawTimeSigNumber(bottomNumber, bottomStartX, startYPos + numberHeight, staffGroup);

    return maxWidth;
  }
}