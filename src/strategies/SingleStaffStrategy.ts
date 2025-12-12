import type SVGRenderer from "../classes/SVGRenderer";
import { HALF_NOTE_LEDGER_LINE_WIDTH, STAFF_LINE_COUNT, STAFF_LINE_SPACING, staffParams, START_LEDGER_LINE_X, WHOLE_NOTE_LEDGER_LINE_WIDTH } from "../constants";
import { getGlyphNameByClef, getNoteSpacingFromReference } from "../helpers/notehelpers";
import type { NoteObj, StaffTypes } from "../types";
import type { LedgerLineEntry, StaffParams, StaffStrategy } from "./StrategyInterface";

const MIDDLE_LINE_Y_POS = 20;

export default class SingleStaffStrategy implements StaffStrategy {
  private params: StaffParams;
  private rendererRef: SVGRenderer;

  constructor(rendererRef: SVGRenderer, staffType: StaffTypes) {
    this.rendererRef = rendererRef;

    const params = staffParams[staffType];
    if (!params) throw new Error(`Staff type ${staffType} is not supported`);
    this.params = params;
  }

  drawStaff = (width: number) => {
    const musicStaffLayer = this.rendererRef.getLayerByName('staff');
    let yCurrent = 0;

    for (let i = 0; i < STAFF_LINE_COUNT; i++) {
      this.rendererRef.drawLine(0, yCurrent, width, yCurrent, musicStaffLayer);
      yCurrent += STAFF_LINE_SPACING;
    }
    // Staff End lines
    this.rendererRef.drawLine(0, 0, 0, yCurrent - STAFF_LINE_SPACING, musicStaffLayer);
    this.rendererRef.drawLine(width, 0, width, yCurrent - STAFF_LINE_SPACING, musicStaffLayer);

    // Add height from staff lines, One added for line thickness compensation
    let newHeight = yCurrent - STAFF_LINE_SPACING + 1;
    let newYOffset = 1;

    // Add clef
    const clefGlpyh = getGlyphNameByClef(this.params.staffType);
    this.rendererRef.drawGlyph(clefGlpyh, musicStaffLayer);

    newHeight += this.params.paddingTop + this.params.paddingBottom;
    newYOffset += this.params.paddingTop;

    // Add padding to height and y offset to root svg
    this.rendererRef.addTotalRootSvgHeight(newHeight);
    this.rendererRef.addTotalRootSvgYOffset(newYOffset);
  }

  shouldNoteFlip(noteYPos: number): boolean {
    return noteYPos <= MIDDLE_LINE_Y_POS;
  }

  getLedgerLinesX(note: Omit<NoteObj, "accidental">, yPos: number): LedgerLineEntry[] {
    const ledgerLineEntries: LedgerLineEntry[] = []
    let ledgerLineWidth = note.duration === "w" ? WHOLE_NOTE_LEDGER_LINE_WIDTH : HALF_NOTE_LEDGER_LINE_WIDTH;

    if (yPos < this.params.topLineYPos) {
      let lineAbsoluteY = this.params.topLineYPos - STAFF_LINE_SPACING;

      while (lineAbsoluteY >= yPos) {
        ledgerLineEntries.push({
          x1: START_LEDGER_LINE_X,
          x2: ledgerLineWidth,
          yPos: lineAbsoluteY - yPos
        });
        lineAbsoluteY -= STAFF_LINE_SPACING;
      }
    }
    else if (yPos > this.params.bottomLineYPos) {
      let lineAbsoluteY = this.params.bottomLineYPos + STAFF_LINE_SPACING;

      while (lineAbsoluteY <= yPos) {
        ledgerLineEntries.push({
          x1: START_LEDGER_LINE_X,
          x2: ledgerLineWidth,
          yPos: lineAbsoluteY - yPos
        });
        lineAbsoluteY += STAFF_LINE_SPACING;
      }
    }

    return ledgerLineEntries;
  }

  calculateNoteYPos = (note: Omit<NoteObj, "accidental">): number => {
    let spaceCount = getNoteSpacingFromReference(this.params.topLineNote, note);
    let yPos = spaceCount * (STAFF_LINE_SPACING / 2);

    return yPos;
  }
}