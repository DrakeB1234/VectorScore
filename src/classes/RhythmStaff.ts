import { STAFF_LINE_SPACING } from "../constants";
import type { GlyphNames } from "../glyphs";
import { parseDurationNoteString } from "../helpers/notehelpers";
import type { DurationNoteObj } from "../types";
import SVGRenderer from "./SVGRenderer";

export type RhythmStaffOptions = {
  width?: number;
  scale?: number;
  topNumber?: number
  spaceAbove?: number;
  spaceBelow?: number;
  staffColor?: string;
  staffBackgroundColor?: string;
};

// Applies to top and bottom
const STAFF_SPACING = 40;
const TIME_SIGNATURE_HEIGHT = 19;

export default class RhythmStaff {
  private rendererInstance: SVGRenderer;

  private options: Required<RhythmStaffOptions>;

  constructor(rootElementCtx: HTMLElement, options?: RhythmStaffOptions) {
    this.options = {
      width: 300,
      scale: 1,
      topNumber: 4,
      spaceAbove: 0,
      spaceBelow: 0,
      staffColor: "black",
      staffBackgroundColor: "transparent",
      ...options
    } as Required<RhythmStaffOptions>;

    this.rendererInstance = new SVGRenderer(rootElementCtx, {
      width: this.options.width,
      height: 100,
      scale: this.options.scale,
      staffColor: this.options.staffColor,
      staffBackgroundColor: this.options.staffBackgroundColor
    });
    const rootSvgElement = this.rendererInstance.rootSvgElement;

    // Determine spacing positioning
    if (this.options.spaceAbove) {
      const yOffset = this.options.spaceAbove * (STAFF_LINE_SPACING);
      this.rendererInstance.addTotalRootSvgYOffset(yOffset);
    }
    if (this.options.spaceBelow) {
      let height = this.options.spaceBelow * (STAFF_LINE_SPACING);
      this.rendererInstance.addTotalRootSvgHeight(height);
    }

    const staffLayer = this.rendererInstance.getLayerByName("staff");
    this.rendererInstance.addTotalRootSvgHeight(STAFF_SPACING * 2);

    // Draw single staff line and time signature
    this.rendererInstance.drawLine(0, STAFF_SPACING, this.options.width, STAFF_SPACING, staffLayer);

    const timeSignatureGroup = this.rendererInstance.createGroup("time-signature");
    staffLayer.appendChild(timeSignatureGroup);
    const groupYPos = STAFF_SPACING - TIME_SIGNATURE_HEIGHT;

    let topNumberGlyphName: GlyphNames = "TIME_4";
    switch (this.options.topNumber) {
      case 3:
        topNumberGlyphName = "TIME_3";
        break;
      default:
        topNumberGlyphName = "TIME_4";
    };

    this.rendererInstance.drawGlyph(topNumberGlyphName, timeSignatureGroup);
    this.rendererInstance.drawGlyph("TIME_4", timeSignatureGroup, TIME_SIGNATURE_HEIGHT);
    timeSignatureGroup.setAttribute("transform", `translate(0, ${groupYPos})`);

    // Commit to DOM for one batch operation
    this.rendererInstance.applySizingToRootSvg();
    this.rendererInstance.commitElementsToDOM(rootSvgElement);
  };

  drawNotes(notes: string | string[]) {
    const normalizedNotesArray = Array.isArray(notes) ? notes : [notes];
    const notesLayer = this.rendererInstance.getLayerByName("notes");

    const noteGroups: SVGGElement[] = [];
    for (const noteString of normalizedNotesArray) {
      const noteObj: DurationNoteObj = parseDurationNoteString(noteString);
    }

    // Commit the newly created note/notes element to the 'notes' layer
    // this.rendererInstance.commitElementsToDOM(noteGroups, notesLayer);
  }
}