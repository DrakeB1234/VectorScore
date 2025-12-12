import { STAFF_LINE_SPACING } from "../constants";
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

export default class MusicStaff {
  private rendererInstance: SVGRenderer;
  private strategyInstance: StaffStrategy;
  private options: Required<MusicStaffOptions>;

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

  /**
   * @param {string | string[]} notes - The musical note to be drawn on the staff. Can pass an array for multiple notes at a time.
   * @description A string representing a single musical note, structured as:
   * `C#4w` == `<PITCH><OCTAVE><DURATION><MODIFIER>`
  */
  drawNote(notes: string | string[]) {
    const normalizedNotesArray = Array.isArray(notes) ? notes : [notes];
    const notesLayer = this.rendererInstance.getLayerByName("notes");

    const noteGroups: SVGGElement[] = [];
    for (const noteString of normalizedNotesArray) {
      const noteObj: NoteObj = parsedNoteString(noteString);

      const newNoteGroup = this.strategyInstance.handleDrawNote(noteObj);
      noteGroups.push(newNoteGroup);
    }

    // Commit the newly created note/notes element to the 'notes' layer
    this.rendererInstance.commitElementsToDOM(noteGroups, notesLayer);
  }
}