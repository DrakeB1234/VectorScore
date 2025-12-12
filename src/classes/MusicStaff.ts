import { ACCIDENTAL_OFFSET_X, HALF_NOTEHEAD_WIDTH, NOTEHEAD_STEM_HEIGHT, STAFF_LINE_SPACING } from "../constants";
import { parseNoteString as parsedNoteString } from "../helpers/notehelpers";
import GrandStaffStrategy from "../strategies/GrandStaffStrategy";
import SingleStaffStrategy from "../strategies/SingleStaffStrategy";
import type { StaffStrategy } from "../strategies/StrategyInterface";
import type { NoteObj, StaffTypes } from "../types";
import SVGRenderer from "./SVGRenderer";

export type MusicStaffOptions = {
  width?: number;
  scale?: number;
  staffType?: StaffTypes;
  spaceAbove?: number;
  spaceBelow?: number;
};

type NoteEntry = {
  gElement: SVGGElement;
  note: NoteObj;
  xPos: number;
  yPos: number;
}

const NOTE_SPACING = 28;

export default class MusicStaff {
  private rendererInstance: SVGRenderer;
  private strategyInstance: StaffStrategy;
  private options: Required<MusicStaffOptions>;

  private noteEntries: NoteEntry[] = [];
  private noteCursorX: number = 0;

  constructor(rootElementCtx: HTMLElement, options?: MusicStaffOptions) {
    this.options = {
      width: 300,
      scale: 1,
      staffType: "treble",
      spaceAbove: 0,
      spaceBelow: 0,
      ...options
    } as Required<MusicStaffOptions>;

    this.rendererInstance = new SVGRenderer(rootElementCtx, {
      width: this.options.width,
      height: 100,
      scale: this.options.scale
    });
    const rootSvgElement = this.rendererInstance.rootSvgElement;

    switch (this.options.staffType) {
      case "grand":
        this.strategyInstance = new GrandStaffStrategy(this.rendererInstance, "grand");
        break;
      case "bass":
        this.strategyInstance = new SingleStaffStrategy(this.rendererInstance, "bass");
        break;
      case "treble":
        this.strategyInstance = new SingleStaffStrategy(this.rendererInstance, "treble");
        break;
      default:
        throw new Error(`The staff type ${this.options.staffType} is not supported. Please use "treble", "bass", or "grand".`);
    };
    this.strategyInstance.drawStaff(this.options.width);

    // Determine spacing positioning
    if (this.options.spaceAbove) {
      const yOffset = this.options.spaceAbove * (STAFF_LINE_SPACING);
      this.rendererInstance.addTotalRootSvgYOffset(yOffset);
    }
    if (this.options.spaceBelow) {
      let height = this.options.spaceBelow * (STAFF_LINE_SPACING);
      // Due to how different grand staff is setup, handle edge case of bottom spacing
      if (this.options.staffType === "grand") height -= (STAFF_LINE_SPACING / 2)
      this.rendererInstance.addTotalRootSvgHeight(height);
    }

    // Commit to DOM for one batch operation
    this.rendererInstance.applySizingToRootSvg();
    this.rendererInstance.commitElementsToDOM(rootSvgElement);
  }

  private drawStem(noteGroup: SVGGElement) {
    this.rendererInstance.drawLine(HALF_NOTEHEAD_WIDTH, 0, HALF_NOTEHEAD_WIDTH, -NOTEHEAD_STEM_HEIGHT, noteGroup);
  }

  // Handles drawing the glyphs to internal group, applies the xPositioning to this.noteCursorX
  private renderNote(note: NoteObj, ySpacing: number): SVGGElement {
    const noteGroup = this.rendererInstance.createGroup("note");

    switch (note.duration) {
      case "h":
        this.rendererInstance.drawGlyph("NOTE_HEAD_HALF", noteGroup);
        this.drawStem(noteGroup);
        break;
      case "q":
        this.rendererInstance.drawGlyph("NOTE_HEAD_QUARTER", noteGroup);
        this.drawStem(noteGroup);
        break;
      default:
        this.rendererInstance.drawGlyph("NOTE_HEAD_WHOLE", noteGroup);
    };

    // Draw accidental, add its offset
    let xOffset = 0;
    switch (note.accidental) {
      case "#":
        this.rendererInstance.drawGlyph("ACCIDENTAL_SHARP", noteGroup);
        xOffset -= ACCIDENTAL_OFFSET_X;
        break;
      case "b":
        this.rendererInstance.drawGlyph("ACCIDENTAL_FLAT", noteGroup);
        xOffset -= ACCIDENTAL_OFFSET_X;
        break;
    }
    // If accidental, add its offset
    this.noteCursorX += xOffset;

    // Strategy returns coords of expected ledger lines, this class will handle drawing them.
    const ledgerLines = this.strategyInstance.getLedgerLinesX({
      name: note.name,
      octave: note.octave,
      duration: note.duration
    }, ySpacing);
    ledgerLines.forEach(e => {
      this.rendererInstance.drawLine(e.x1, e.yPos, e.x2, e.yPos, noteGroup);
    })

    // Apply positioning to note group container
    noteGroup.setAttribute("transform", `translate(${this.noteCursorX}, ${ySpacing})`);
    this.noteCursorX += NOTE_SPACING;

    return noteGroup;
  }

  /**
   * @param {string | string[]} notes - The musical note to be drawn on the staff. Can pass an array for multiple notes at a time.
   * @description A string representing a single musical note, structured as:
   * `C#4w` == `<PITCH><OCTAVE><DURATION><MODIFIER>`
  */
  drawNote(notes: string | string[]) {
    // Normalizes input by converting a single string into an array
    const normalizedNotesArray = Array.isArray(notes) ? notes : [notes];
    const notesLayer = this.rendererInstance.getLayerByName("notes");

    const noteGroups: SVGGElement[] = [];
    for (const noteString of normalizedNotesArray) {
      const noteObj: NoteObj = parsedNoteString(noteString);

      const yPos = this.strategyInstance.calculateNoteYPos({
        name: noteObj.name,
        octave: noteObj.octave
      });
      const noteGroup = this.renderNote(noteObj, yPos);

      this.noteEntries.push({
        gElement: noteGroup,
        note: noteObj,
        yPos: yPos,
        xPos: this.noteCursorX
      });

      noteGroups.push(noteGroup);
    }

    // Commit the newly created note/notes element to the 'notes' layer
    this.rendererInstance.commitElementsToDOM(noteGroups, notesLayer);
  }
}