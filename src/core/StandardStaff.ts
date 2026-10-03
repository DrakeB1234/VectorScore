import { ACCIDENTAL_DOUBLEFLAT, ACCIDENTAL_DOUBLESHARP, ACCIDENTAL_FLAT, ACCIDENTAL_NATURAL, ACCIDENTAL_SHARP, AUGMENTATION_DOT, CLEF_ALTO, CLEF_BASS, CLEF_TREBLE, FLAG_EIGHTH_DOWN, FLAG_EIGHTH_UP, FLAG_SIXTEENTH_DOWN, FLAG_SIXTEENTH_UP, FLAG_THIRTY_SECOND_DOWN, FLAG_THIRTY_SECOND_UP, NOTEHEAD_BLACK, NOTEHEAD_HALF, NOTEHEAD_WHOLE, REST_EIGHTH, REST_HALF, REST_QUARTER, REST_SIXTEENTH, REST_THIRTY_SECOND, REST_WHOLE, TIMESIG_0, TIMESIG_1, TIMESIG_2, TIMESIG_3, TIMESIG_4, TIMESIG_5, TIMESIG_6, TIMESIG_7, TIMESIG_8, TIMESIG_9, type GlyphDef } from "../glyphs";
import { parseNoteString, parseChordNoteString, type DrawChordConfig, type DrawNoteConfig, type DrawRestConfig, type NoteDurations, type VSChordNoteObj, type VSNoteObj, parseDurationString, type BeamableConfig, getPitchStepClefDifference, convertPitchStepToYPos, type DrawBeamConfig } from "../helpers/noteHelpers";
import { BASE_STAFF_HEIGHT, GRAND_STAFF_SPACING, validateKeySignature, validateTimeSignature, type KeySignatures, type TimeSignature } from "../helpers/staffHelpers";
import type { ClefTypes, SystemTypes } from "../types";
import NoteRenderer from "../classes/NoteRenderer";
import StaffFrame from "../classes/StaffFrame";
import SVGRenderer from "../classes/SVGRenderer";
import { VALID_CLASS_ATTR_REGEX } from "../constants";

export type StandardStaffUserOptions = {
  width?: number;
  scale?: number;
  /** - Overrides constant that defaults this value to '16'. */
  noteStartX?: number;
  paddingTop?: number;
  paddingBottom?: number;
  staffType?: SystemTypes;
  svgAutoFill?: boolean;
  keySignature?: KeySignatures;
  timeSignature?: TimeSignature;
};

type ResolvedStaffOptions =
  Required<Omit<StandardStaffUserOptions, "keySignature" | "timeSignature">> &
  Pick<StandardStaffUserOptions, "keySignature" | "timeSignature">;

const USE_GLPYHS: GlyphDef[] = [
  CLEF_TREBLE, CLEF_BASS, CLEF_ALTO,
  NOTEHEAD_WHOLE, NOTEHEAD_HALF, NOTEHEAD_BLACK,
  ACCIDENTAL_SHARP, ACCIDENTAL_FLAT, ACCIDENTAL_NATURAL, ACCIDENTAL_DOUBLESHARP, ACCIDENTAL_DOUBLEFLAT,
  TIMESIG_0, TIMESIG_1, TIMESIG_2, TIMESIG_3, TIMESIG_4, TIMESIG_5, TIMESIG_6, TIMESIG_7, TIMESIG_8, TIMESIG_9,
  FLAG_EIGHTH_DOWN, FLAG_EIGHTH_UP, FLAG_SIXTEENTH_DOWN, FLAG_SIXTEENTH_UP, FLAG_THIRTY_SECOND_DOWN, FLAG_THIRTY_SECOND_UP,
  REST_WHOLE, REST_HALF, REST_QUARTER, REST_EIGHTH, REST_SIXTEENTH, REST_THIRTY_SECOND,
  AUGMENTATION_DOT
];

const NOTE_LAYER_START_X = 16;
const NOTE_SPACING = 14;
const NOTEHEAD_WIDTH = NOTEHEAD_BLACK.glyphWidth;

const DEFAULT_STAFF_OPTIONS: Required<Omit<StandardStaffUserOptions, "keySignature" | "timeSignature">> = {
  width: 300,
  scale: 1,
  noteStartX: NOTE_LAYER_START_X,
  staffType: "grand",
  paddingTop: 20,
  paddingBottom: 20,
  svgAutoFill: true,
};

type BaseEntry = {
  gElement: SVGGElement;
  xPos: number;
  totalWidth: number;
  originXOffset: number;
  yOffset: number;
  isTopStaff: boolean;
};

type NoteEntry = BaseEntry & {
  type: "note";
  noteData: VSNoteObj;
  yPos: number;
};

type ChordEntry = BaseEntry & {
  type: "chord";
  noteData: VSChordNoteObj[];
  duration: NoteDurations;
  yPosArray: number[];
};

type RestEntry = BaseEntry & {
  type: "rest";
  duration: NoteDurations;
  yPos: number;
};

type BeamEntry = BaseEntry & {
  type: "beam";
  yPosArray: number[];
};

type BarlineEntry = BaseEntry & {
  type: "barline",
}

type StaffEntry = NoteEntry | ChordEntry | RestEntry | BeamEntry | BarlineEntry;

export type StandardStaffDrawOptions = {
  staff?: "top" | "bottom";
  classes?: string[];
};

export type StandardStaffDrawConfig = DrawNoteConfig | DrawChordConfig | DrawRestConfig | DrawBeamConfig | { type: "barline" };

export default class StandardStaff {
  private options: ResolvedStaffOptions;

  private svgRendererInstance: SVGRenderer;
  private noteRendererInstance: NoteRenderer;
  private staffFrame: StaffFrame;

  private notesLayer: SVGGElement;
  public readonly uiLayer: SVGGElement;

  private noteEntries: StaffEntry[] = [];
  private noteCursorX: number = 0;

  private currentNoteSpacing: number = NOTE_SPACING;

  /**
   * @param rootElementCtx - The element (div) reference that will append the music staff elements to.
   * @param userOptions - Optional configuration settings, will default to preset ones. All config options are in the type StandardStaffUserOptions
  */
  constructor(rootElementCtx: HTMLElement, userOptions?: StandardStaffUserOptions) {
    if (rootElementCtx === null) throw new Error("StandardStaff Error: RootElementCtx was not defined. Please ensure a valid HTML element is provided to append the staff to.");

    this.options = { ...DEFAULT_STAFF_OPTIONS, ...userOptions };

    if (this.options.keySignature) validateKeySignature(this.options.keySignature);
    if (this.options.timeSignature) validateTimeSignature(this.options.timeSignature.topNumber, this.options.timeSignature.bottomNumber);

    this.svgRendererInstance = new SVGRenderer(rootElementCtx, USE_GLPYHS);
    this.noteRendererInstance = new NoteRenderer(this.svgRendererInstance);
    // Renders the frame on init
    this.staffFrame = new StaffFrame(this.svgRendererInstance, this.options);

    this.notesLayer = this.svgRendererInstance.createLayer("notes");
    this.uiLayer = this.svgRendererInstance.createLayer("ui");
    this.updateLayersX(this.staffFrame.getNoteStartX());

    // Apply total sizing to root SVG
    const totalHeight = this.staffFrame.totalStaffHeight + this.options.paddingTop + this.options.paddingBottom;
    this.svgRendererInstance.setRootSVGSizing(this.options.width, totalHeight, this.options.scale);
    this.svgRendererInstance.setSVGAutoFill(this.options.svgAutoFill);
    this.svgRendererInstance.commitElementsToDOM(this.svgRendererInstance.svgElementRef);
  };

  /** - Takes care of edge cases of targeted staff to draw notes / chords */
  private resolveStaffTarget(rawStaff?: "top" | "bottom") {
    let targetStaff = rawStaff || "top";

    if (targetStaff === "bottom" && this.options.staffType !== "grand") {
      console.warn("StandardStaff: Options stated 'staff: bottom', but staff configuration type is not 'grand'. Using default 'staff: top'.");
      targetStaff = "top";
    }

    const isTopStaff = targetStaff === "top";
    let targetClef: ClefTypes;
    let yOffset = 0;

    if (this.options.staffType === "grand") {
      targetClef = isTopStaff ? "treble" : "bass";
      yOffset = isTopStaff ? 0 : GRAND_STAFF_SPACING + BASE_STAFF_HEIGHT;
    } else {
      targetClef = this.options.staffType as ClefTypes;
      yOffset = 0;
    }

    return { targetClef, yOffset, isTopStaff };
  };

  private resolveDrawClasses(classes?: string[]) {
    if (!classes) return []

    const res: string[] = [];

    classes.forEach(_class => {
      if (VALID_CLASS_ATTR_REGEX.test(_class)) res.push(_class);
      else console.warn(`Invalid class name '${_class}' provided in DrawOptions.`)
    });

    return res;
  }

  private updateLayersX(startX: number) {
    this.notesLayer.setAttribute("transform", `translate(${startX}, ${this.options.paddingTop})`);
    this.uiLayer.setAttribute("transform", `translate(${startX}, ${this.options.paddingTop})`);
  };

  // General helper to create staff entries and call relative draw method on note renderer
  private createEntry(config: StandardStaffDrawConfig, options?: StandardStaffDrawOptions): StaffEntry {

    const { targetClef, yOffset, isTopStaff } = this.resolveStaffTarget(options?.staff);

    const group = this.svgRendererInstance.createGroup(config.type);
    const resolvedClasses = this.resolveDrawClasses(options?.classes);
    resolvedClasses.forEach(_class => group.classList.add(_class));

    let newEntry: Partial<StaffEntry> = {
      gElement: group,
      xPos: this.noteCursorX,
      yOffset,
      isTopStaff
    };

    if (config.type === "note") {
      const { fullWidth, originXOffset, yPos } = this.noteRendererInstance.drawNote(config.note, targetClef, group);
      newEntry = {
        ...newEntry,
        type: "note",
        noteData: config.note,
        originXOffset,
        totalWidth: fullWidth,
        yPos: yPos
      };
    }
    else if (config.type === "chord") {
      if (config.notes.length < 1 || config.notes.length > 10) throw new Error("Invalid amount of notes provided in chord config. Please provide 1-10 notes.");

      const { fullWidth, originXOffset, yPosArray } = this.noteRendererInstance.drawChord(config.notes, config.duration, config.isDotted, targetClef, group);
      newEntry = {
        ...newEntry,
        type: "chord",
        noteData: config.notes,
        duration: config.duration,
        originXOffset,
        totalWidth: fullWidth,
        yPosArray
      };
    }
    else if (config.type === "rest") {
      const { fullWidth, originXOffset, yPos } = this.noteRendererInstance.drawRest(config.duration, config.isDotted, group);
      newEntry = {
        ...newEntry,
        type: "rest",
        duration: config.duration,
        originXOffset,
        totalWidth: fullWidth,
        yPos: yPos
      };
    }
    else if (config.type === "beam") {
      const { fullWidth, originXOffset, yPosArray } = this.noteRendererInstance.drawBeam(config.entries, targetClef, group);
      newEntry = {
        ...newEntry,
        type: "beam",
        originXOffset,
        totalWidth: fullWidth,
        yPosArray,
      };
    }
    else if (config.type === "barline") {
      this.staffFrame.staffRenderer.drawStaffBarLine(0, this.options.staffType, group);
      newEntry = {
        ...newEntry,
        type: "barline",
        totalWidth: 0,
        originXOffset: 0,
      };
    }

    return newEntry as StaffEntry;
  };

  // General helper to add new entry and append element onto staff visually (handles positioning)
  private appendEntry(config: StandardStaffDrawConfig, options?: StandardStaffDrawOptions): number {
    const newEntry = this.createEntry(config, options);

    const x = newEntry.type === "barline"
      ? this.noteCursorX + 0
      : this.noteCursorX + newEntry.originXOffset;

    newEntry.gElement.setAttribute("transform", `translate(${x}, ${newEntry.yOffset})`);
    this.notesLayer.appendChild(newEntry.gElement);

    this.noteEntries.push(newEntry);
    this.noteCursorX += this.currentNoteSpacing + newEntry.totalWidth;

    return this.noteEntries.length - 1;
  }

  private validateEntriesIndex(index: number) {
    if (index < 0 || index >= this.noteEntries.length) throw new Error(`StandardStaff Error: Index provided '${index}' is out of bounds of entries.`);
    return true;
  }

  /** - Draws a note on the staff. Returns the index of the drawn element */
  public drawNote(note: string, options?: StandardStaffDrawOptions) {
    const noteObj = parseNoteString(note);
    return this.appendEntry({ type: "note", note: noteObj }, options);
  }

  /** - Draws a chord on the staff. Returns the index of the drawn element */
  public drawChord(noteStrings: string[], duration: string, options?: StandardStaffDrawOptions) {
    const noteObjs = noteStrings.map(str => parseChordNoteString(str));
    const { duration: _duration, isDotted } = parseDurationString(duration);
    return this.appendEntry({ type: "chord", notes: noteObjs, duration: _duration, isDotted }, options);
  }

  /** - Draws a rest on the staff. Returns the index of the drawn element */
  public drawRest(duration: string, options?: StandardStaffDrawOptions) {
    const { duration: _duration, isDotted } = parseDurationString(duration);
    return this.appendEntry({ type: "rest", duration: _duration, isDotted }, options);
  }

  /** - Draws a beam on the staff. Returns the index of the drawn element */
  public drawBeam(entries: BeamableConfig[], options?: StandardStaffDrawOptions) {
    return this.appendEntry({ type: "beam", entries }, options);
  }

  /** - Draws a barline on the staff. Returns the index of the drawn element */
  public drawBarline(options?: Pick<StandardStaffDrawOptions, "classes">) {
    return this.appendEntry({ type: "barline" }, { ...options, staff: "top" });
  }

  /** - Draw multiple elements in one operation. Uses config objects as its parameter */
  public drawBatchElements(
    items: { config: StandardStaffDrawConfig; options?: StandardStaffDrawOptions }[]
  ): number[] {
    return items.map(({ config, options }) => this.appendEntry(config, options));
  }

  /** - Replaces a entry on staff by index, uses config object as parameter */
  public replaceByIndex(index: number, config: StandardStaffDrawConfig, options?: StandardStaffDrawOptions) {
    this.validateEntriesIndex(index);

    const oldEntry = this.noteEntries[index];
    const staffArg = options?.staff ?? (oldEntry.isTopStaff ? "top" : "bottom");

    const newEntry = this.createEntry(config, { ...options, staff: staffArg });

    // Reset xPos to 0, applySpacing will recalculate it
    newEntry.xPos = 0;

    this.notesLayer.replaceChild(newEntry.gElement, oldEntry.gElement);
    this.noteEntries[index] = newEntry;

    this.applySpacing();
  }

  /** - Evenly spaces out the notes on the staff. */
  public justifyNotes() {
    const notesCount = this.noteEntries.length;
    if (notesCount <= 0) return;
    let fixedNotesCount = Math.max(1, notesCount - 1);

    const startX = this.staffFrame.getNoteStartX();
    const rightPadding = NOTE_SPACING;
    const availableWidth = this.options.width - startX - rightPadding;

    // Calculate the total footprint of all glyphs (no note spacing included)
    const totalGlyphWidth = this.noteEntries.reduce((sum, entry) => sum + entry.totalWidth, 0);

    const remainingSpace = availableWidth - totalGlyphWidth;

    // If notes overflow the staff, fallback to the standard minimum spacing
    const dynamicGap = remainingSpace > 0
      ? remainingSpace / fixedNotesCount
      : NOTE_SPACING;

    this.applySpacing(dynamicGap);
  };

  /** 
   * - Applies spacing between each note
   * @param spacingOverride - Default is normal note spacing, if value is provided then it will override
  */
  public applySpacing(spacingOverride?: number) {

    // Useful if justifyNotes was called, it will remember it for if replaceByIndex is called. 
    const gap = spacingOverride ?? this.currentNoteSpacing;
    this.currentNoteSpacing = gap;

    let currentX = 0;

    this.noteEntries.forEach(entry => {
      entry.xPos = currentX;

      entry.gElement.setAttribute(
        "transform",
        `translate(${currentX + entry.originXOffset}, ${entry.yOffset})`
      );

      currentX += entry.totalWidth + gap;
    });

    this.noteCursorX = currentX;
  }

  public changeTimeSignature(top: number, bottom: number) {
    const newStartX = this.staffFrame.changeTimeSignature(top, bottom);
    this.updateLayersX(newStartX);
  };

  public removeTimeSignature() {
    const newStartX = this.staffFrame.removeTimeSignature();
    this.updateLayersX(newStartX);
  }

  public changeKeySignature(key: KeySignatures) {
    const newStartX = this.staffFrame.changeKeySignature(key);
    this.updateLayersX(newStartX);
  };

  public removeKeySignature() {
    const newStartX = this.staffFrame.removeKeySignature();
    this.updateLayersX(newStartX);
  }

  /** - Gets coordinate data and staff options from entry on staff by index*/
  public getDataFromEntryIndex(index: number) {
    this.validateEntriesIndex(index);

    const noteEntry = this.noteEntries[index];
    let y = 0;
    if (noteEntry.type === "note") y = noteEntry.yPos;
    else if (noteEntry.type === "chord") y = noteEntry.yPosArray[0];
    else if (noteEntry.type === "rest") y = noteEntry.yPos;
    else if (noteEntry.type === "beam") y = noteEntry.yPosArray[0];
    else if (noteEntry.type === "barline") y = 0;
    y += noteEntry.yOffset;

    const x = noteEntry.xPos + noteEntry.originXOffset + (NOTEHEAD_WIDTH / 2);

    return {
      x: x,
      y: y,
      isTopStaff: noteEntry.isTopStaff
    };
  };

  /**  - Returns the exact absolute Y-coordinate for a list of pitches (e.g., ["C4", "E4"]). Accounts for staff offsets (top vs bottom) and clef differences. */
  public getYFromPitches(pitches: string[], isTopStaff = true): number[] {

    const { targetClef, yOffset } = this.resolveStaffTarget(isTopStaff ? "top" : "bottom");

    const res: number[] = [];
    pitches.forEach(pitch => {
      const noteObj = parseChordNoteString(pitch);
      const pitchStep = getPitchStepClefDifference(noteObj.letter, noteObj.octave, targetClef);
      res.push(convertPitchStepToYPos(pitchStep) + yOffset);
    });

    return res;
  };

  /**  - Returns the group element that contains a entry (note, chord, rest, beam, or barline) */
  public getElementByIndex(index: number): SVGGElement {
    this.validateEntriesIndex(index);

    return this.noteEntries[index].gElement;
  }

  /** - Removed element on staff (note,chord,rest,beam,barline) by relative index */
  public removeElementByIndex(index: number): void {
    this.validateEntriesIndex(index);

    const entry = this.noteEntries[index];
    entry.gElement.remove();
    this.noteEntries.splice(index, 1);

    this.applySpacing();
  }

  /** - Clears staff of notes and resets internal positioning. */
  public clearAllNotes() {
    this.noteCursorX = 0;
    this.currentNoteSpacing = NOTE_SPACING;

    this.notesLayer?.replaceChildren();
    this.noteEntries = [];
  }

  /** - Removes the root svg element and cleans up arrays. */
  public destroy() {
    this.noteEntries = [];
    this.svgRendererInstance.destroy();
    this.notesLayer.replaceChildren();
    this.uiLayer.replaceChildren();
  };
}