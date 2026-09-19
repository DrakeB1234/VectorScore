import { durationBeatValueMap, HALF_NOTEHEAD_WIDTH, NOTE_LAYER_START_X, NOTEHEAD_STEM_HEIGHT, STAFF_LINE_SPACING } from "../constants";
import { NOTEHEAD_BLACK, NOTEHEAD_HALF, NOTEHEAD_WHOLE, TIMESIG_3, TIMESIG_4, type GlyphDef } from "../glyphs";
import { parseDurationNoteString } from "../helpers/notehelpers";
import type { NoteDurations } from "../types";
import SVGRenderer from "./SVGRenderer";

export type RhythmStaffOptions = {
  width?: number;
  scale?: number;
  topNumber?: number;
  barsCount?: number;
  padding?: number;
  svgAutoFill?: boolean;

  /** @deprecated Use `padding` instead. */
  spaceAbove?: number;
  /** @deprecated Use `padding` instead. */
  spaceBelow?: number;
};

// Applies to top and bottom
const STAFF_SPACING = 30;
const TIME_SIGNATURE_HEIGHT = 19;
const BAR_SPACING = 12;

const BEAM_LINE_HEIGHT = 4;
const BEAM_LINE_Y_OFFSET = 6;

// STAFF RIGHT SPACING TO PREVENT EIGTH NOTES FROM OVERFLOWING
const STAFF_RIGHT_PADDING = 1;

const CURRENT_BEAT_UI_START_X_POS = NOTE_LAYER_START_X;

const USE_GLPYHS: GlyphDef[] = [
  NOTEHEAD_WHOLE, NOTEHEAD_HALF, NOTEHEAD_BLACK,
  TIMESIG_3, TIMESIG_4
]

export default class RhythmStaff {
  private svgRendererInstance: SVGRenderer;
  private options: Required<RhythmStaffOptions>;

  private barSpacing: number;
  private quarterNoteSpacing: number;
  private noteCursorX: number = 0;
  private noteEntries: SVGGElement[] = [];

  private maxBeatCount: number;
  private currentBeatCount: number = 0;

  private currentBeatUICount: number = 0;
  private currentBeatUIElement: SVGRectElement | null = null;
  private currentBeatUIXPos: number = CURRENT_BEAT_UI_START_X_POS;

  /**
   * Creates an instance of a RhythmStaff, A single staff that will automatically apply positioning of elements based on the duration of a note.
   *
   * @param rootElementCtx - The element (div) reference that will append the music staff elements to.
   * @param options - Optional configuration settings. All config options are in the type RhythmStaffOptions
   * @throws {Error} - If top number is not 3 or 4 OR if bars count is not between 1 - 3. These are the currently only supported values.
  */
  constructor(rootElementCtx: HTMLElement, options?: RhythmStaffOptions) {
    this.options = {
      width: 300,
      scale: 1,
      topNumber: 4,
      barsCount: 2,
      padding: 10,
      svgAutoFill: true,

      /** @deprecated Use `padding` instead. */
      spaceAbove: 0,
      /** @deprecated Use `padding` instead. */
      spaceBelow: 0,
      ...options
    } as Required<RhythmStaffOptions>;

    this.svgRendererInstance = new SVGRenderer(rootElementCtx, USE_GLPYHS);
    const rootSvgElement = this.svgRendererInstance.svgElementRef;

    const staffLayer = this.svgRendererInstance.createLayer("staff");
    const notesLayer = this.svgRendererInstance.createLayer("notes");
    this.svgRendererInstance.createLayer("ui");

    // Determine the time signature, if top number isn't supported throw early
    let topNumberGlyphName = "TIMESIG_4";
    switch (this.options.topNumber) {
      case 3: topNumberGlyphName = "TIMESIG_3"; break;
      case 4: topNumberGlyphName = "TIMESIG_4"; break;
      default:
        throw new Error(`Time signature ${this.options.topNumber} not supported. Please use either 3 or 4.`);
    };

    if (this.options.barsCount < 1 || this.options.barsCount > 3) throw new Error(`Bars count ${this.options.barsCount} not supported. Please use 1 - 3`);

    // Determine spacing positioning
    if (this.options.spaceAbove) {
      this.options.padding += this.options.spaceAbove * STAFF_LINE_SPACING;
    }
    if (this.options.spaceBelow) {
      this.options.padding += this.options.spaceBelow * STAFF_LINE_SPACING;
    };

    // Draw time signature in its own group
    const timeSignatureGroup = this.svgRendererInstance.createGroup("time-signature");
    staffLayer.appendChild(timeSignatureGroup);
    const groupYPos = STAFF_SPACING - TIME_SIGNATURE_HEIGHT;
    this.svgRendererInstance.drawGlyph(topNumberGlyphName, timeSignatureGroup);
    this.svgRendererInstance.drawGlyph("TIMESIG_4", timeSignatureGroup, { y: TIME_SIGNATURE_HEIGHT });
    timeSignatureGroup.setAttribute("transform", `translate(0, ${groupYPos})`);

    // Total width minus starting size of the notes (distance from time signature)
    let notesLayerWidth = this.options.width - NOTE_LAYER_START_X;
    // For each bar, remove the padding they take up from the overall width of the staff.
    if (this.options.barsCount > 1) notesLayerWidth -= (this.options.barsCount - 1) * BAR_SPACING;
    // Add padding to the right of the staff
    notesLayerWidth -= STAFF_RIGHT_PADDING;

    // Draw single staff line and time signature
    this.svgRendererInstance.drawLine(0, STAFF_SPACING, this.options.width - STAFF_RIGHT_PADDING, STAFF_SPACING, staffLayer);

    // Calculates internal positioning props for ensuring correctly spaced notes based on duration
    this.barSpacing = notesLayerWidth / this.options.barsCount;
    this.quarterNoteSpacing = Math.round(this.barSpacing / this.options.topNumber);
    this.maxBeatCount = this.options.barsCount * this.options.topNumber;

    // Draw bar lines
    let barLineX = this.barSpacing + NOTE_LAYER_START_X;
    const barLineStartY = STAFF_SPACING / 2;
    const barLineEndY = STAFF_SPACING + barLineStartY;
    for (let i = 0; i < this.options.barsCount - 1; i++) {
      this.svgRendererInstance.drawLine(barLineX, barLineStartY, barLineX, barLineEndY, staffLayer);
      barLineX += this.barSpacing;
    };

    // Applying sizing to root SVG
    const totalHeight = (STAFF_SPACING * 2) + (this.options.padding * 2);
    staffLayer.setAttribute("transform", `translate(0, ${this.options.padding})`);
    notesLayer.setAttribute("transform", `translate(${NOTE_LAYER_START_X}, ${STAFF_SPACING})`);

    this.svgRendererInstance.setRootSVGSizing(this.options.width, totalHeight, this.options.scale);
    this.svgRendererInstance.setSVGAutoFill(this.options.svgAutoFill);

    this.svgRendererInstance.commitElementsToDOM(rootSvgElement);
  };

  private createBeatUIElement() {
    const uiLayer = this.svgRendererInstance.getLayer("ui");
    if (!uiLayer) throw new Error("BeatUI Error: Failed to retrieve ui layer");

    this.currentBeatUIElement = this.svgRendererInstance.drawRect(
      this.quarterNoteSpacing / 2,
      STAFF_SPACING * 2,
      uiLayer,
      {
        x: CURRENT_BEAT_UI_START_X_POS,
        fill: "rgba(0,255,40,0.4)",
        classes: "rhythm-current-beat"
      }
    );
  }

  private handleNewBar() {
    this.noteCursorX += BAR_SPACING;
  }

  // Translates group, returns cursor increment amount
  private translateGroupByDuration(beatValue: number, noteGroup: SVGGElement): number {
    noteGroup.setAttribute("transform", `translate(${this.noteCursorX}, 0)`);

    return this.quarterNoteSpacing * beatValue;
  }

  private drawStem(noteGroup: SVGGElement, xOffset?: number) {
    this.svgRendererInstance.drawLine(HALF_NOTEHEAD_WIDTH + (xOffset ?? 0), 0, HALF_NOTEHEAD_WIDTH + (xOffset ?? 0), -NOTEHEAD_STEM_HEIGHT, noteGroup);
  }

  private renderNote(duration: NoteDurations, noteGroup: SVGGElement) {
    switch (duration) {
      case "w":
        this.svgRendererInstance.drawGlyph("NOTE_HEAD_WHOLE", noteGroup);
        break;
      case "h":
        this.svgRendererInstance.drawGlyph("NOTE_HEAD_HALF", noteGroup);
        this.drawStem(noteGroup);
        break;
      case "q":
        this.svgRendererInstance.drawGlyph("NOTE_HEAD_QUARTER", noteGroup);
        this.drawStem(noteGroup);
        break;
      case "e":
        this.svgRendererInstance.drawGlyph("EIGHTH_NOTE", noteGroup);
        this.drawStem(noteGroup);
        break;
    }
  }

  private renderRest(duration: NoteDurations, restGroup: SVGGElement) {
    switch (duration) {
      case "w":
        this.svgRendererInstance.drawGlyph("REST_WHOLE", restGroup);
        break;
      case "h":
        this.svgRendererInstance.drawGlyph("REST_HALF", restGroup);
        break;
      case "q":
        this.svgRendererInstance.drawGlyph("REST_QUARTER", restGroup);
        break;
      case "e":
        this.svgRendererInstance.drawGlyph("REST_EIGHTH", restGroup);
        break;
    };
  }

  private checkAndCreateNewBar() {
    const isBarFull = this.currentBeatCount > 0 && (this.currentBeatCount % this.options.topNumber === 0);
    const isNotLastBar = this.currentBeatCount < this.maxBeatCount;

    if (isBarFull && isNotLastBar) {
      this.handleNewBar();
    };
  }

  private checkAndFillBarWithRests(beatValue: number): SVGGElement[] | null {
    const remainingBeatsInBar = this.options.topNumber - (this.currentBeatCount % this.options.topNumber);
    if (beatValue > remainingBeatsInBar) {
      const restGroups = this.createRemainingRests(remainingBeatsInBar);
      this.handleNewBar();
      return restGroups;
    };
    return null;
  };

  // If the last beat exceeded the remaining value in bar, fill the space with approiate rests
  private createRemainingRests(remainingBeatsInBar: number): SVGGElement[] {
    const restGroups: SVGGElement[] = [];
    let beatsLeft = remainingBeatsInBar;

    while (beatsLeft > 0) {
      const newGroup = this.svgRendererInstance.createGroup("rest");
      let beatValue = 0;

      // Try adding the biggest rest first
      if (beatsLeft - durationBeatValueMap["h"] >= 0) {
        this.svgRendererInstance.drawGlyph("REST_HALF", newGroup);
        beatValue = durationBeatValueMap["h"];
      }
      else if (beatsLeft - durationBeatValueMap["q"] >= 0) {
        this.svgRendererInstance.drawGlyph("REST_QUARTER", newGroup);
        beatValue = durationBeatValueMap["q"];
      }
      else {
        this.svgRendererInstance.drawGlyph("REST_EIGHTH", newGroup);
        beatValue = durationBeatValueMap["e"];
      }
      beatsLeft -= beatValue;
      this.currentBeatCount += beatValue;
      newGroup.setAttribute("transform", `translate(${this.noteCursorX}, 0)`);

      this.noteCursorX += beatValue * this.quarterNoteSpacing;
      restGroups.push(newGroup);
    }

    return restGroups;
  }

  private renderBeamRect(localX: number, spacingAmount: number, parentGroup: SVGGElement, yOffset?: number) {
    this.svgRendererInstance.drawRect(
      localX - spacingAmount,
      BEAM_LINE_HEIGHT,
      parentGroup,
      {
        x: HALF_NOTEHEAD_WIDTH,
        y: -NOTEHEAD_STEM_HEIGHT + (yOffset ?? 0),
      }
    );
  }

  /**
   * Draws a note duration on the staff.
   * @param notes - A single string OR array of note strings in the format `[Duration]`.
   * If an array is passed, it will draw each individual note duration on the staff.
   * If a duration exceeds the remaining value on the bar, rests will fill the empty space.
   *
   * * **Duration**: `w` (whole) `h` (half) `q` (quarter) `e` (eighth)
   * @returns void
   * @throws {Error} If a note string is not correct format. If an array was passed, it will still draw whatever correctly formatted notes before it. 
   * 
   * * @example
   * // Draws the specified note durations individually on the staff
   * drawNote(["q", "q", "q", "q", "w"]);
   * 
   * * @example
   * // Draws the specified single note duration on the staff
   * drawNote("w");
  */
  drawNote(notes: string | string[]) {
    const normalizedNotesArray = Array.isArray(notes) ? notes : [notes];
    const notesLayer = this.svgRendererInstance.getLayer("notes");
    if (!notesLayer) throw new Error("DrawNote Error: Failed to retrieve notes layer");

    const noteGroups: SVGGElement[] = [];
    for (const noteString of normalizedNotesArray) {
      let durationString: NoteDurations = "w";
      try {
        durationString = parseDurationNoteString(noteString);
      }
      catch (error) {
        if (noteGroups.length > 0) this.svgRendererInstance.commitElementsToDOM(noteGroups, notesLayer);
        throw error;
      }
      const beatValue = durationBeatValueMap[durationString];

      if (this.currentBeatCount >= this.maxBeatCount) {
        if (noteGroups.length > 0) this.svgRendererInstance.commitElementsToDOM(noteGroups, notesLayer);
        throw new Error("Max beat count reached. Can't add additional notes.");
      };

      this.checkAndCreateNewBar();

      const restGroups = this.checkAndFillBarWithRests(beatValue);
      if (restGroups) restGroups.forEach(e => {
        noteGroups.push(e);
        this.noteEntries.push(e);
      });

      const noteGroup = this.svgRendererInstance.createGroup("note");
      const cursorXIncrement = this.translateGroupByDuration(beatValue, noteGroup);

      // Apply cursor increment
      this.noteCursorX += cursorXIncrement;
      this.currentBeatCount += beatValue;

      this.renderNote(durationString, noteGroup);

      noteGroups.push(noteGroup);
      this.noteEntries.push(noteGroup);
    }

    // Commit the newly created note/notes element to the 'notes' layer
    this.svgRendererInstance.commitElementsToDOM(noteGroups, notesLayer);
  }

  /**
   * Draws a rest duration on the staff.
   * @param rests - A single string OR array of rest strings in the format `[Duration]`.
   * If an array is passed, it will draw each individual rest duration on the staff.
   * If a duration exceeds the remaining value on the bar, rests will fill the empty space.
   *
   * * **Duration**: `w` (whole) `h` (half) `q` (quarter) `e` (eighth)
   * @returns void
   * @throws {Error} If a rest string is not correct format. If an array was passed, it will still draw whatever correctly formatted rests before it. 
   * 
   * * @example
   * // Draws the specified rest durations individually on the staff
   * drawRest(["q", "q", "q", "q", "w"]);
   * 
   * * @example
   * // Draws the specified single rest duration on the staff
   * drawRest("w");
  */
  drawRest(rests: string | string[]) {
    const normalizedNotesArray = Array.isArray(rests) ? rests : [rests];
    const notesLayer = this.svgRendererInstance.getLayer("notes");
    if (!notesLayer) throw new Error("DrawRest Error: Failed to retrieve notes layer");

    const restGroups: SVGGElement[] = [];
    for (const restString of normalizedNotesArray) {
      let durationString: NoteDurations = "w";
      try {
        durationString = parseDurationNoteString(restString);
      }
      catch (error) {
        if (restGroups.length > 0) this.svgRendererInstance.commitElementsToDOM(restGroups, notesLayer);
        throw error;
      }

      const restGroup = this.svgRendererInstance.createGroup("rest");
      const beatValue = durationBeatValueMap[durationString];
      const spacing = beatValue * this.quarterNoteSpacing;

      if (this.currentBeatCount >= this.maxBeatCount) {
        if (restGroups.length > 0) this.svgRendererInstance.commitElementsToDOM(restGroups, notesLayer);
        throw new Error("Max beat count reached. Can't add additional notes.");
      };

      this.checkAndCreateNewBar();

      const remainingGroups = this.checkAndFillBarWithRests(beatValue);
      if (remainingGroups) remainingGroups.forEach(e => {
        restGroups.push(e);
        this.noteEntries.push(e);
      });

      this.renderRest(durationString, restGroup);
      restGroup.setAttribute("transform", `translate(${this.noteCursorX}, 0)`);

      this.noteCursorX += spacing;
      this.currentBeatCount += beatValue;
      restGroups.push(restGroup);
      this.noteEntries.push(restGroup);
    }

    this.svgRendererInstance.commitElementsToDOM(restGroups, notesLayer);
  }

  /**
   * Draws a beamed note of specified duration/count on the staff.
   * Will stop beam early if bar line is reached / if beat count is over max limit
   * @param note - A duration string of either 'e' (eighth) or 's' (sixth).
   * @param noteCount - The amount of notes in the beam
   *
   * @returns void
   * @throws {Error} If a rest string is not correct format. If an array was passed, it will still draw whatever correctly formatted rests before it. 
   * 
   * * @example
   * // Draws a 4 beamed eighth note
   * drawBeamedNotes("e", 4);
   * 
   * * @example
   * // Draws a 8 beamed sixth note
   * drawBeamedNotes("s", 8);
  */
  drawBeamedNotes(note: "e" | "s", noteCount: number) {
    if (noteCount < 2) {
      throw new Error("Must provide a value greater than 2 for beamed note.");
    }

    if (this.currentBeatCount >= this.maxBeatCount) {
      throw new Error("Max beat count reached. Can't add additional beamed note.");
    }
    let durationString: NoteDurations = "s";
    if (note === "s") {
      durationString = "s";
    }
    else {
      durationString = parseDurationNoteString(note);
    }

    this.checkAndCreateNewBar();

    const notesLayer = this.svgRendererInstance.getLayer("notes");
    if (!notesLayer) throw new Error("drawBeamedNotes Error: Failed to retrieve notes layer");
    const beatValue = durationBeatValueMap[durationString];
    const spacingAmount = beatValue * this.quarterNoteSpacing;

    // Forces number to be less if it reaches the bar line
    const remainingBeatsInBar = this.options.topNumber - (this.currentBeatCount % this.options.topNumber);
    const fixedNoteCount = Math.min(noteCount, remainingBeatsInBar / beatValue);

    const beamedGroup = this.svgRendererInstance.createGroup("beamed-note");
    beamedGroup.setAttribute("transform", `translate(${this.noteCursorX}, 0)`);
    let localX = 0;

    for (let i = 0; i < fixedNoteCount; i++) {
      this.svgRendererInstance.drawGlyph("NOTE_HEAD_QUARTER", beamedGroup, { x: localX });
      this.drawStem(beamedGroup, localX);

      localX += spacingAmount;
      this.currentBeatCount += beatValue;
    };

    // Render beam line
    this.renderBeamRect(localX, spacingAmount, beamedGroup);

    // If sixteenth notes, add a second beam line
    if (note === "s") {
      this.renderBeamRect(localX, spacingAmount, beamedGroup, BEAM_LINE_Y_OFFSET);
    }

    this.noteCursorX += localX;
    this.noteEntries.push(beamedGroup);

    this.svgRendererInstance.commitElementsToDOM(beamedGroup, notesLayer);
  }

  /**
   * Will increment the UI showing the current beat in quarters. Once exceeded, must be reset with `resetCurrentBeatUI()`
   * @returns void
  */
  incrementCurrentBeatUI() {
    if (!this.currentBeatUIElement) this.createBeatUIElement();

    if (this.currentBeatUICount >= this.maxBeatCount) {
      this.currentBeatUIElement!.setAttribute("display", "none");
      return;
    };

    if (this.currentBeatUIElement?.getAttribute("display") === "none") this.currentBeatUIElement.removeAttribute("display");

    this.currentBeatUICount++;

    // Calls per bar, ignores first occurence
    if (this.currentBeatUICount > this.options.topNumber && this.currentBeatUICount % this.options.topNumber === 1) {
      this.currentBeatUIXPos += BAR_SPACING;
    };

    if (this.currentBeatUICount > 1) this.currentBeatUIXPos += this.quarterNoteSpacing;

    this.currentBeatUIElement!.setAttribute("x", this.currentBeatUIXPos.toString());
  }

  /**
   * Resets the ui showing the current beat value.
   * @returns void
  */
  resetCurrentBeatUI() {
    this.currentBeatUICount = 0;
    this.currentBeatUIXPos = CURRENT_BEAT_UI_START_X_POS;

    if (this.currentBeatUIElement) {
      this.currentBeatUIElement.setAttribute("display", "none");
      this.currentBeatUIElement.setAttribute("x", this.currentBeatUIXPos.toString());
    }
  };

  /**
   * Clears staff of notes and resets internal positioning.
   * @returns void
  */
  clearAllNotes() {
    this.noteCursorX = 0;
    this.currentBeatCount = 0;

    const notesLayer = this.svgRendererInstance.getLayer("notes");
    notesLayer?.replaceChildren();
    this.noteEntries = [];
  }

  /**
   * Removes the root svg element and cleans up arrays.
   * @returns void
  */
  destroy() {
    this.noteEntries = [];
    this.svgRendererInstance.destroy();
  }
}