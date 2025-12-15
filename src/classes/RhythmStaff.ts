import { durationBeatValueMap, HALF_NOTEHEAD_WIDTH, NOTE_LAYER_START_X, NOTEHEAD_STEM_HEIGHT, STAFF_LINE_SPACING } from "../constants";
import type { GlyphNames } from "../glyphs";
import { parseDurationNoteString } from "../helpers/notehelpers";
import type { Durations } from "../types";
import SVGRenderer from "./SVGRenderer";

export type RhythmStaffOptions = {
  width?: number;
  scale?: number;
  topNumber?: number;
  barsCount?: number;
  spaceAbove?: number;
  spaceBelow?: number;
  staffColor?: string;
  staffBackgroundColor?: string;
};

// Applies to top and bottom
const STAFF_SPACING = 30;
const TIME_SIGNATURE_HEIGHT = 19;
const BAR_SPACING = 12;

// STAFF RIGHT SPACING TO PREVENT EIGTH NOTES FROM OVERFLOWING
const STAFF_RIGHT_PADDING = 1;

const MAX_BEAM_COUNT = 4;

export default class RhythmStaff {
  private rendererInstance: SVGRenderer;
  private options: Required<RhythmStaffOptions>;

  private barSpacing: number;
  private quarterNoteSpacing: number;
  private noteCursorX: number = 0;
  private noteEntries: SVGGElement[] = [];

  private maxBeatCount: number;
  private currentBeatCount: number = 0;

  constructor(rootElementCtx: HTMLElement, options?: RhythmStaffOptions) {
    this.options = {
      width: 300,
      scale: 1,
      topNumber: 4,
      barsCount: 2,
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

    // Draw time signature in its own group
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
    this.rendererInstance.drawGlyph("TIME_4", timeSignatureGroup, { yOffset: TIME_SIGNATURE_HEIGHT });
    timeSignatureGroup.setAttribute("transform", `translate(0, ${groupYPos})`);

    // Total width minus starting size of the notes (distance from time signature)
    let notesLayerWidth = this.options.width - NOTE_LAYER_START_X;
    // Subtract size of bar spacing
    if (this.options.barsCount > 1) notesLayerWidth -= (this.options.barsCount - 1) * BAR_SPACING;
    // Add padding to the right of the staff
    notesLayerWidth -= STAFF_RIGHT_PADDING;

    // Draw single staff line and time signature
    this.rendererInstance.drawLine(0, STAFF_SPACING, this.options.width - STAFF_RIGHT_PADDING, STAFF_SPACING, staffLayer);

    this.barSpacing = notesLayerWidth / this.options.barsCount;
    this.quarterNoteSpacing = Math.round(this.barSpacing / this.options.topNumber);

    this.maxBeatCount = this.options.barsCount * this.options.topNumber;

    // Draw bar line
    this.rendererInstance.drawLine(this.barSpacing + NOTE_LAYER_START_X, 0, this.barSpacing + NOTE_LAYER_START_X, STAFF_SPACING * 2, staffLayer);

    // Translate entire notes layer to match single line on staff
    this.rendererInstance.getLayerByName("notes").setAttribute("transform", `translate(${NOTE_LAYER_START_X}, ${STAFF_SPACING})`);

    // Commit to DOM for one batch operation
    this.rendererInstance.applySizingToRootSvg();
    this.rendererInstance.commitElementsToDOM(rootSvgElement);
  };

  private handleNewBar() {
    this.noteCursorX += BAR_SPACING;
  }

  // Translates group, returns cursor increment amount
  private translateGroupByDuration(beatValue: number, noteGroup: SVGGElement): number {
    noteGroup.setAttribute("transform", `translate(${this.noteCursorX}, 0)`);

    return this.quarterNoteSpacing * beatValue;
  }

  private drawStem(noteGroup: SVGGElement, xOffset?: number) {
    this.rendererInstance.drawLine(HALF_NOTEHEAD_WIDTH + (xOffset ?? 0), 0, HALF_NOTEHEAD_WIDTH + (xOffset ?? 0), -NOTEHEAD_STEM_HEIGHT, noteGroup);
  }

  private renderNote(duration: Durations, noteGroup: SVGGElement) {
    switch (duration) {
      case "w":
        this.rendererInstance.drawGlyph("NOTE_HEAD_WHOLE", noteGroup);
        break;
      case "h":
        this.rendererInstance.drawGlyph("NOTE_HEAD_HALF", noteGroup);
        this.drawStem(noteGroup);
        break;
      case "q":
        this.rendererInstance.drawGlyph("NOTE_HEAD_QUARTER", noteGroup);
        this.drawStem(noteGroup);
        break;
      case "e":
        this.rendererInstance.drawGlyph("EIGHTH_NOTE", noteGroup);
        this.drawStem(noteGroup);
        break;
    }
  }

  drawNote(notes: string | string[]) {
    const normalizedNotesArray = Array.isArray(notes) ? notes : [notes];
    const notesLayer = this.rendererInstance.getLayerByName("notes");

    const noteGroups: SVGGElement[] = [];
    for (const noteString of normalizedNotesArray) {
      const durationString = parseDurationNoteString(noteString);
      const beatValue = durationBeatValueMap[durationString];
      if (this.currentBeatCount >= this.maxBeatCount) {
        if (noteGroups.length > 0) this.rendererInstance.commitElementsToDOM(noteGroups, notesLayer);
        throw new Error("Max beat count reached. Can't add additional notes.");
      }

      this.currentBeatCount += beatValue;

      const noteGroup = this.rendererInstance.createGroup("note");
      const cursorXIncrement = this.translateGroupByDuration(beatValue, noteGroup);

      // Apply cursor increment
      this.noteCursorX += cursorXIncrement;

      this.renderNote(durationString, noteGroup);

      const isBarFull = this.currentBeatCount > 0 && (this.currentBeatCount % this.options.topNumber === 0);
      const isNotLastBar = this.currentBeatCount < this.maxBeatCount;

      if (isBarFull && isNotLastBar) {
        this.handleNewBar();
      }

      noteGroups.push(noteGroup);
      this.noteEntries.push(noteGroup);
    }

    // Commit the newly created note/notes element to the 'notes' layer
    this.rendererInstance.commitElementsToDOM(noteGroups, notesLayer);
  }

  // Will stop beam early if bar line is reached / if beat count is over max limit
  drawBeamedNotes(note: "e", noteCount: number) {
    if (noteCount < 2) {
      throw new Error("Must provide a value greater than 2 for beamed note.");
    }

    if (this.currentBeatCount >= this.maxBeatCount) {
      throw new Error("Max beat count reached. Can't add additional beamed note.");
    }

    const durationString = parseDurationNoteString(note);

    const notesLayer = this.rendererInstance.getLayerByName("notes");
    const beatValue = durationBeatValueMap[durationString];
    const spacingAmount = beatValue * this.quarterNoteSpacing;

    // Forces number to be less if it reaches the bar line
    const remainingBeatsInBar = this.options.topNumber - (this.currentBeatCount % this.options.topNumber);
    const fixedNoteCount = Math.min(noteCount, remainingBeatsInBar / beatValue);

    // Check if bass is full, if so, handle
    const isBarFull = this.currentBeatCount > 0 && (this.currentBeatCount % this.options.topNumber === 0);
    const isNotLastBar = this.currentBeatCount < this.maxBeatCount;

    if (isBarFull && isNotLastBar) {
      this.handleNewBar();
    }

    const beamedGroup = this.rendererInstance.createGroup("beamed-note");
    beamedGroup.setAttribute("transform", `translate(${this.noteCursorX}, 0)`);
    let localX = 0;

    // Render notes
    for (let i = 0; i < fixedNoteCount; i++) {
      this.rendererInstance.drawGlyph("NOTE_HEAD_QUARTER", beamedGroup, { xOffset: localX });
      this.drawStem(beamedGroup, localX);

      localX += spacingAmount;
      this.currentBeatCount += beatValue;
    };

    // Render beam line
    const beamRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    beamedGroup.appendChild(beamRect);
    beamRect.setAttribute("height", "4");
    beamRect.setAttribute("width", `${localX - spacingAmount}`);
    beamRect.setAttribute("x", `${HALF_NOTEHEAD_WIDTH}`);
    beamRect.setAttribute("y", `${-NOTEHEAD_STEM_HEIGHT}`);

    this.noteCursorX += localX;
    this.noteEntries.push(beamedGroup);

    this.rendererInstance.commitElementsToDOM(beamedGroup, notesLayer);
  }

  clearAllNotes() {
    this.noteCursorX = 0;
    this.currentBeatCount = 0;

    this.noteEntries.forEach(e => {
      e.remove();
    });

    this.noteEntries = [];
  }
}