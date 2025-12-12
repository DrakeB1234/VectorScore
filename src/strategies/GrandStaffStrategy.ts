import type SVGRenderer from "../classes/SVGRenderer";
import { STAFF_LINE_COUNT, STAFF_LINE_SPACING, staffParams } from "../constants";
import { getGlyphNameByClef, getNoteSpacingFromReference, noteToAbsoluteSemitone } from "../helpers/notehelpers";
import type { NoteObj, StaffTypes } from "../types";
import type { StaffParams, StaffStrategy } from "./StrategyInterface";

const GRAND_STAFF_SPACING = STAFF_LINE_SPACING * 3;
const MIDDLE_C_SEMITONE = 48;
const MIDDLE_C_Y_POS: number = (STAFF_LINE_SPACING * 4) + (GRAND_STAFF_SPACING / 2)

export default class GrandStaffStrategy implements StaffStrategy {
  private params: StaffParams;
  private rendererRef: SVGRenderer;
  private width: number = 0;

  constructor(rendererRef: SVGRenderer, staffType: StaffTypes) {
    this.rendererRef = rendererRef;

    const params = staffParams[staffType];
    if (!params) throw new Error(`Staff type ${staffType} is not supported`);
    this.params = params;
  }

  private drawStaffLines = (yStart: number, parent: SVGGElement): number => {
    let yCurrent = yStart;
    for (let i = 0; i < STAFF_LINE_COUNT; i++) {
      this.rendererRef.drawLine(0, yCurrent, this.width, yCurrent, parent);
      yCurrent += STAFF_LINE_SPACING;
    }

    // Remove last line spacing
    return yCurrent - STAFF_LINE_SPACING;
  }

  drawStaff = (width: number) => {
    this.width = width;
    const musicStaffLayer = this.rendererRef.getLayerByName('staff');

    let trebleStaffHeight = this.drawStaffLines(0, musicStaffLayer);
    let bassStaffHeight = this.drawStaffLines(trebleStaffHeight + GRAND_STAFF_SPACING, musicStaffLayer);
    // Draw Staff end lines
    this.rendererRef.drawLine(0, 0, 0, bassStaffHeight, musicStaffLayer);
    this.rendererRef.drawLine(this.width, 0, this.width, bassStaffHeight, musicStaffLayer);

    // Add height from staff lines
    let newHeight = bassStaffHeight;
    let newYOffset = 1;

    const trebleGlpyh = getGlyphNameByClef("treble");
    const bassGlpyh = getGlyphNameByClef("bass");
    this.rendererRef.drawGlyph(trebleGlpyh, musicStaffLayer);
    this.rendererRef.drawGlyph(bassGlpyh, musicStaffLayer, trebleStaffHeight + GRAND_STAFF_SPACING);


    // One added for last staff line to prevent clipping
    newHeight += this.params.paddingBottom + 1;
    newYOffset += this.params.paddingTop;

    this.rendererRef.addTotalRootSvgHeight(newHeight);
    this.rendererRef.addTotalRootSvgYOffset(newYOffset);
  }

  calculateNoteYPos = (note: Omit<NoteObj, "accidental">): number => {
    let spaceCount = getNoteSpacingFromReference(this.params.topLineNote, note);
    let yPos = spaceCount * (STAFF_LINE_SPACING / 2);

    // Determines which staff to draw on by comparing pos from C4
    const noteSemitone = noteToAbsoluteSemitone(note);
    if (noteSemitone < MIDDLE_C_SEMITONE) {
      yPos += STAFF_LINE_SPACING;
    }
    else if (noteSemitone === MIDDLE_C_SEMITONE) {
      // Due to uneven spacing between grand staffs, middle c y pos is precalcuated, this handles that edge case
      yPos = MIDDLE_C_Y_POS;
    }

    return yPos;
  }
}