import { BRACE, getAccidentalGlyph, getClefGlyph, getTimeSigGlyph, REPEAT_DOTS } from "../glyphs";
import type { BarlineTypes } from "../helpers/inputHelpers";
import { getPitchStepClefDifference } from "../helpers/noteHelpers";
import { BASE_STAFF_HEIGHT, GRAND_STAFF_SPACING, KEY_SIG_OCTAVES, KEY_SIGNATURE_ORDER, KEY_SIGNATURES, STAFF_LINE_COUNT, STAFF_LINE_SPACING, STAFF_LINE_SPACING_HALVED, validateKeySignature, validateTimeSignature, type KeySignatures } from "../helpers/staffHelpers";
import type { ClefTypes, SystemTypes } from "../types";
import type SVGRenderer from "./SVGRenderer";

type DrawStaffLinesArgs = {
  width: number;
  startYPos: number;
  startXPos?: number;
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
  startYPos: number;
  staffGroup: SVGGElement;
}

type DrawTimeSignatureArgs = {
  topNumber: number;
  bottomNumber: number;
  startYPos: number;
  staffGroup: SVGGElement;
}

type DrawBraceArgs = {
  topY: number;
  bottomY: number;
  staffGroup: SVGGElement;
}

type DrawBarlineArgs = {
  topY: number;
  bottomY: number;
  barType: BarlineTypes;
  group: SVGGElement;
  repeatYStartPositions?: number[];
};

export const COMPONENT_GAP = 10;

const BRACE_PADDING = 3;
export const CLEF_X_OFFSET = 4;
const KEY_SIG_ACCIDENTAL_SPACING = 12;

const BAR_THIN_WIDTH = 1;
const BAR_THICK_WIDTH = 5;
const BAR_STANDARD_GAP = 4;
const BAR_REPEAT_DOT_GAP = 4;
const BAR_REPEAT_DOT_WIDTH = 4;

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
  public drawStaffLines({ width, startYPos, startXPos, staffGroup }: DrawStaffLinesArgs): number {
    let yCurrent = startYPos;
    let startX = startXPos ?? 0;

    for (let i = 0; i < STAFF_LINE_COUNT; i++) {
      this.svgRendererInstance.drawLine(startX, yCurrent, width, yCurrent, staffGroup);
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

  public drawBrace({ topY, bottomY, staffGroup }: DrawBraceArgs) {

    const def = BRACE;
    const height = bottomY - topY;
    const scaleY = height / (def.glyphHeight || 1);
    const scaleX = 2.5;

    const parsedScaleY = parseFloat(scaleY.toFixed(2));

    const braceGroup = this.svgRendererInstance.createGroup("brace");

    // By leaving X as 1, the brace stretches vertically to fit the staves 
    braceGroup.setAttribute("transform", `translate(0, ${topY}) scale(${scaleX}, ${parsedScaleY})`);

    this.svgRendererInstance.drawGlyph(def.name, braceGroup, { x: 0, y: 0 });
    staffGroup.appendChild(braceGroup);

    let totalWidth = (def.glyphWidth * scaleX) + BRACE_PADDING;
    totalWidth = Math.round(totalWidth);

    return totalWidth;
  };

  public drawBarline({ topY, bottomY, barType, repeatYStartPositions, group }: DrawBarlineArgs): number {
    const height = bottomY - topY;

    const drawVerticalBar = (xOffset: number, width: number) => {
      this.svgRendererInstance.drawRect(width, height, group, {
        x: xOffset,
        y: topY
      });
    };

    const drawRepeatDots = (xOffset: number) => {
      if (!repeatYStartPositions) return;
      repeatYStartPositions.forEach(staffTopY => {
        this.svgRendererInstance.drawGlyph(REPEAT_DOTS.name, group, {
          x: xOffset,
          y: staffTopY
        });
      });
    };

    let currentX = 0;

    switch (barType) {
      case "single":
        drawVerticalBar(currentX, BAR_THIN_WIDTH);
        currentX += BAR_THIN_WIDTH;
        return currentX;

      case "double":
        drawVerticalBar(currentX, BAR_THIN_WIDTH);
        currentX += BAR_THIN_WIDTH + BAR_STANDARD_GAP;
        drawVerticalBar(currentX, BAR_THIN_WIDTH);
        currentX += BAR_THIN_WIDTH;
        return currentX;

      case "end":
        drawVerticalBar(currentX, BAR_THIN_WIDTH);
        currentX += BAR_THIN_WIDTH + BAR_STANDARD_GAP;
        drawVerticalBar(currentX, BAR_THICK_WIDTH);
        currentX += BAR_THICK_WIDTH;
        return currentX;

      case "repeat-start":
        drawVerticalBar(currentX, BAR_THICK_WIDTH);
        currentX += BAR_THICK_WIDTH + BAR_STANDARD_GAP;
        drawVerticalBar(currentX, BAR_THIN_WIDTH);
        currentX += BAR_THIN_WIDTH + BAR_REPEAT_DOT_GAP;
        drawRepeatDots(currentX);
        currentX += BAR_REPEAT_DOT_WIDTH;
        return currentX;

      case "repeat-end":
        drawRepeatDots(currentX);
        currentX += BAR_REPEAT_DOT_WIDTH + BAR_REPEAT_DOT_GAP;
        drawVerticalBar(currentX, BAR_THIN_WIDTH);
        currentX += BAR_THIN_WIDTH + BAR_STANDARD_GAP;
        drawVerticalBar(currentX, BAR_THICK_WIDTH);
        currentX += BAR_THICK_WIDTH;
        return currentX;

      default:
        return 0;
    }
  }
}