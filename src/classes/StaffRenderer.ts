import { getGlyphNameByClef } from "../helpers/notehelpers";
import type { StaffTypes, SystemTypes } from "../types";
import type SVGRenderer from "./SVGRenderer";

type DrawStaffArgs = {
  width: number;
  staffType: StaffTypes;
  startYPos: number;
  staffGroup: SVGGElement;
  /** @description overrides the global constant for grand staff spacing */
  grandStaffSpacing?: number;
}

const STAFF_LINE_COUNT = 5;
const STAFF_LINE_SPACING = 10;
export const GRAND_STAFF_SPACING = 40;
const CLEF_X_OFFSET = 4;

export default class StaffRenderer {
  private svgRendererInstance: SVGRenderer;

  constructor(svgRenderer: SVGRenderer) {
    this.svgRendererInstance = svgRenderer;
  };

  private drawClefOnStaff(staffType: StaffTypes, yPos: number, staffGroup: SVGGElement) {
    const glyphEntry = getGlyphNameByClef(staffType);

    this.svgRendererInstance.drawGlyph(glyphEntry, staffGroup, {
      y: yPos,
      x: CLEF_X_OFFSET
    });

    return CLEF_X_OFFSET;
  };

  private drawSingleStaff(width: number, staffType: StaffTypes, startYPos: number, staffGroup: SVGGElement) {
    let totalXOffset = 0;
    let yCurrent = startYPos;

    for (let i = 0; i < STAFF_LINE_COUNT; i++) {
      this.svgRendererInstance.drawLine(0, yCurrent, width, yCurrent, staffGroup);
      yCurrent += STAFF_LINE_SPACING;
    };

    const clefXOffset = this.drawClefOnStaff(staffType, startYPos, staffGroup);
    totalXOffset += clefXOffset;

    return {
      totalStaffHeight: (STAFF_LINE_COUNT - 1) * STAFF_LINE_SPACING
    };
  }

  // Top level function, will call drawClef and any other subsequent methods
  // Returns the base height of either single or grand staff
  public drawStaff({ width, staffType, startYPos, staffGroup, grandStaffSpacing = GRAND_STAFF_SPACING }: DrawStaffArgs) {
    if (staffType === "grand") {
      const treble = this.drawSingleStaff(width, "treble", startYPos, staffGroup);
      const bass = this.drawSingleStaff(width, "bass", startYPos + treble.totalStaffHeight + grandStaffSpacing, staffGroup);

      return {
        totalStaffHeight: treble.totalStaffHeight + bass.totalStaffHeight + grandStaffSpacing
      };
    }

    return this.drawSingleStaff(width, staffType, startYPos, staffGroup);
  }

  public drawStaffBarLine(xPos: number, staffType: SystemTypes, staffGroup: SVGGElement) {
    let topY = ((STAFF_LINE_COUNT - 1) * STAFF_LINE_SPACING);

    if (staffType === "grand") {
      topY = topY * 2 + GRAND_STAFF_SPACING;
    }

    this.svgRendererInstance.drawLine(xPos, 0, xPos, topY, staffGroup);
  }
}