import type SVGRenderer from "../classes/SVGRenderer";
import { ACCIDENTAL_OFFSET_X, NOTE_LAYER_START_X, STAFF_LINE_COUNT, STAFF_LINE_SPACING, staffParams } from "../constants";
import { getGlyphNameByClef, getNoteSpacingFromReference } from "../helpers/notehelpers";
import type { NoteObj, StaffTypes } from "../types";
import type { StaffParams, StaffStrategy } from "./StrategyInterface";

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

  private drawLedgerLines() {

  }

  handleDrawNote = (note: NoteObj): SVGGElement => {
    const noteNoAccidental: NoteObj = {
      name: note.name,
      octave: note.octave
    }
    let spaceCount = getNoteSpacingFromReference(this.params.topLineNote, noteNoAccidental);
    let yPos = spaceCount * (STAFF_LINE_SPACING / 2);

    // Determine X Pos
    let xPos = 0;

    // Render the note
    const noteGroup = this.rendererRef.createGroup("note");

    // Draw note head
    switch (note.duration) {
      case "h":
        this.rendererRef.drawGlyph("NOTE_HEAD_HALF", noteGroup);
        break;
      case "q":
        this.rendererRef.drawGlyph("NOTE_HEAD_QUARTER", noteGroup);
        break;
      default:
        this.rendererRef.drawGlyph("NOTE_HEAD_WHOLE", noteGroup);
    };

    // Draw accidental, add its offset
    switch (note.accidental) {
      case "#":
        this.rendererRef.drawGlyph("ACCIDENTAL_SHARP", noteGroup);
        xPos -= ACCIDENTAL_OFFSET_X;
        break;
      case "b":
        this.rendererRef.drawGlyph("ACCIDENTAL_FLAT", noteGroup);
        xPos -= ACCIDENTAL_OFFSET_X;
        break;
    }

    // Apply positioning to note group container
    noteGroup.setAttribute("transform", `translate(${xPos}, ${yPos})`);
    return noteGroup;
  }
}