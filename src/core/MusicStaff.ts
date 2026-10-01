import { ACCIDENTAL_DOUBLEFLAT, ACCIDENTAL_DOUBLESHARP, ACCIDENTAL_FLAT, ACCIDENTAL_NATURAL, ACCIDENTAL_SHARP, AUGMENTATION_DOT, CLEF_ALTO, CLEF_BASS, CLEF_TREBLE, FLAG_EIGHTH_DOWN, FLAG_EIGHTH_UP, FLAG_SIXTEENTH_DOWN, FLAG_SIXTEENTH_UP, FLAG_THIRTY_SECOND_DOWN, FLAG_THIRTY_SECOND_UP, NOTEHEAD_BLACK, NOTEHEAD_HALF, NOTEHEAD_WHOLE, REST_EIGHTH, REST_HALF, REST_QUARTER, REST_SIXTEENTH, REST_THIRTY_SECOND, REST_WHOLE, TIMESIG_1, TIMESIG_2, TIMESIG_3, TIMESIG_4, TIMESIG_5, TIMESIG_6, TIMESIG_7, TIMESIG_8, TIMESIG_9, type GlyphDef } from "../glyphs";
import { parseNoteString, parseChordNoteString, type DrawChordConfig, type DrawNoteConfig, type DrawRestConfig, type NoteDurations, type VSChordNoteObj, type VSNoteObj, parseDurationString, type BeamableConfig, getPitchStepClefDifference, getPitchStep, convertPitchStepToYPos } from "../helpers/noteHelpers";
import { BASE_STAFF_HEIGHT, GRAND_STAFF_SPACING, validateKeySignature, validateTimeSignature, type KeySignatures, type TimeSignature } from "../helpers/staffHelpers";
import type { ClefTypes, SystemTypes } from "../types";
import NoteRenderer from "../classes/NoteRenderer";
import StaffFrame from "../classes/StaffFrame";
import SVGRenderer from "../classes/SVGRenderer";

export type MusicStaffUserOptions = {
  width?: number;
  scale?: number;
  /** - Overrides constant that defaults this value to '16'. */
  noteStartX?: number;
  /** - Value refers to pixel amount */
  paddingTop?: number;
  /** - Value refers to pixel amount */
  paddingBottom?: number;
  staffType?: SystemTypes;
  svgAutoFill?: boolean;
  keySignature?: KeySignatures;
  timeSignature?: TimeSignature;
};

type ResolvedStaffOptions =
  Required<Omit<MusicStaffUserOptions, "keySignature" | "timeSignature">> &
  Pick<MusicStaffUserOptions, "keySignature" | "timeSignature">;

const USE_GLPYHS: GlyphDef[] = [
  CLEF_TREBLE, CLEF_BASS, CLEF_ALTO,
  NOTEHEAD_WHOLE, NOTEHEAD_HALF, NOTEHEAD_BLACK,
  ACCIDENTAL_SHARP, ACCIDENTAL_FLAT, ACCIDENTAL_NATURAL, ACCIDENTAL_DOUBLESHARP, ACCIDENTAL_DOUBLEFLAT,
  TIMESIG_1, TIMESIG_2, TIMESIG_3, TIMESIG_4, TIMESIG_5, TIMESIG_6, TIMESIG_7, TIMESIG_8, TIMESIG_9,
  FLAG_EIGHTH_DOWN, FLAG_EIGHTH_UP, FLAG_SIXTEENTH_DOWN, FLAG_SIXTEENTH_UP, FLAG_THIRTY_SECOND_DOWN, FLAG_THIRTY_SECOND_UP,
  REST_WHOLE, REST_HALF, REST_QUARTER, REST_EIGHTH, REST_SIXTEENTH, REST_THIRTY_SECOND,
  AUGMENTATION_DOT
];

const NOTE_LAYER_START_X = 16;
const NOTE_SPACING = 14;

const DEFAULT_STAFF_OPTIONS: Required<Omit<MusicStaffUserOptions, "keySignature" | "timeSignature">> = {
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

type StaffEntry = NoteEntry | ChordEntry | RestEntry | BeamEntry;

export type DrawOptions = {
  staff?: "top" | "bottom";
  // className?: string;
};

// Config types for use in replaceByIndex

export type ReplaceConfig = DrawNoteConfig | DrawChordConfig | DrawRestConfig;

export default class MusicStaff {
  private options: ResolvedStaffOptions;

  private svgRendererInstance: SVGRenderer;
  private noteRendererInstance: NoteRenderer;
  private staffFrame: StaffFrame;

  private notesLayer: SVGGElement;
  public uiLayer: SVGGElement;

  private noteEntries: StaffEntry[] = [];
  private noteCursorX: number = 0;

  private currentNoteSpacing: number = NOTE_SPACING;

  /**
   * Creates an instance of a MusicStaff, A single staff.
   *
   * @param rootElementCtx - The element (div) reference that will append the music staff elements to.
   * @param userOptions - Optional configuration settings, will default to preset ones. All config options are in the type MusicStaffUserOptions
  */
  constructor(rootElementCtx: HTMLElement, userOptions?: MusicStaffUserOptions) {
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
      console.warn("MusicStaff: Options stated 'staff: bottom', but staff configuration type is not 'grand'. Using default 'staff: top'.");
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

  private updateLayersX(startX: number) {
    this.notesLayer.setAttribute("transform", `translate(${startX}, ${this.options.paddingTop})`);
    this.uiLayer.setAttribute("transform", `translate(${startX}, ${this.options.paddingTop})`);
  };

  /** 
   * - Draws a note on the staff. 
   */
  public drawNote(note: string, options?: DrawOptions) {
    const noteObj = parseNoteString(note);
    const { targetClef, yOffset, isTopStaff } = this.resolveStaffTarget(options?.staff);

    const noteGroup = this.svgRendererInstance.createGroup("note");

    const { fullWidth, originXOffset, yPos } = this.noteRendererInstance.drawNote(noteObj, targetClef, noteGroup);

    noteGroup.setAttribute("transform", `translate(${originXOffset + this.noteCursorX}, ${yOffset})`);
    this.notesLayer.appendChild(noteGroup);

    this.noteEntries.push({
      type: "note",
      gElement: noteGroup,
      noteData: noteObj,
      xPos: this.noteCursorX,
      totalWidth: fullWidth,
      originXOffset,
      yOffset,
      isTopStaff,
      yPos: yPos
    });

    this.noteCursorX += NOTE_SPACING + fullWidth;
  }

  /** - Draws a chord on the staff. */
  public drawChord(noteStrings: string[], duration: string, options?: DrawOptions) {
    const noteObjs = noteStrings.map(str => parseChordNoteString(str));
    const { duration: _duration, isDotted } = parseDurationString(duration);

    const { targetClef, yOffset, isTopStaff } = this.resolveStaffTarget(options?.staff);

    const chordGroup = this.svgRendererInstance.createGroup("chord");

    const { fullWidth, originXOffset, yPosArray } = this.noteRendererInstance.drawChord(noteObjs, _duration, isDotted, targetClef, chordGroup);

    chordGroup.setAttribute("transform", `translate(${originXOffset + this.noteCursorX}, ${yOffset})`);
    this.notesLayer.appendChild(chordGroup);

    this.noteEntries.push({
      type: "chord",
      gElement: chordGroup,
      noteData: noteObjs,
      duration: _duration,
      xPos: this.noteCursorX,
      totalWidth: fullWidth,
      originXOffset,
      yOffset,
      isTopStaff,
      yPosArray
    });

    this.noteCursorX += NOTE_SPACING + fullWidth;
  }

  /** - Draws a rest on the staff. */
  public drawRest(duration: string, options?: DrawOptions) {
    const { duration: _duration, isDotted } = parseDurationString(duration);
    const { targetClef: _, yOffset, isTopStaff } = this.resolveStaffTarget(options?.staff);

    const restGroup = this.svgRendererInstance.createGroup("rest");

    // originXOffset will be 0, due to rest not shifting into negative space.
    const { fullWidth, originXOffset, yPos } = this.noteRendererInstance.drawRest(_duration, isDotted, restGroup);

    restGroup.setAttribute("transform", `translate(${this.noteCursorX}, ${yOffset})`);
    this.notesLayer.appendChild(restGroup);

    this.noteEntries.push({
      type: "rest",
      gElement: restGroup,
      duration: _duration,
      xPos: this.noteCursorX,
      totalWidth: fullWidth,
      yOffset,
      originXOffset: originXOffset,
      isTopStaff,
      yPos
    });

    this.noteCursorX += NOTE_SPACING + fullWidth;
  };

  public drawBeam(entries: BeamableConfig[], options?: DrawOptions) {

    const { targetClef, yOffset, isTopStaff } = this.resolveStaffTarget(options?.staff);

    const group = this.svgRendererInstance.createGroup("beam");

    const { fullWidth, originXOffset, yPosArray } = this.noteRendererInstance.drawBeam(entries, targetClef, group);

    group.setAttribute("transform", `translate(${this.noteCursorX + originXOffset}, ${yOffset})`);
    this.notesLayer.appendChild(group);

    this.noteEntries.push({
      type: "beam",
      gElement: group,
      xPos: this.noteCursorX,
      totalWidth: fullWidth,
      yOffset,
      originXOffset: originXOffset,
      isTopStaff,
      yPosArray
    });

    this.noteCursorX += NOTE_SPACING + fullWidth;
  }

  /** - Replaces a entry on staff by, only accepts notes, chords, and rests are possible replace values. */
  public replaceByIndex(index: number, config: ReplaceConfig, options?: DrawOptions) {
    if (index < 0 || index >= this.noteEntries.length) throw new Error(`MusicStaff replaceByIndex: Index ${index} is out of bounds.`);
    if (!config.type) throw new Error(`MusicStaff replaceByIndex: Incorrect replace config provided.`);

    const oldEntry = this.noteEntries[index];

    const staffArg = options?.staff ?? (oldEntry.isTopStaff ? "top" : "bottom"); // Ensures if staff not in options, use old entries type
    const { targetClef, yOffset, isTopStaff } = this.resolveStaffTarget(staffArg);

    const newGroup = this.svgRendererInstance.createGroup(config.type);
    let newEntry: StaffEntry;

    if (config.type === "note") {
      const { fullWidth, originXOffset, yPos } = this.noteRendererInstance.drawNote(config.note, targetClef, newGroup);

      newEntry = {
        type: "note",
        gElement: newGroup,
        noteData: config.note,
        xPos: 0,
        totalWidth: fullWidth,
        originXOffset,
        yOffset,
        isTopStaff,
        yPos
      };
    }
    else if (config.type === "chord") {
      const { fullWidth, originXOffset, yPosArray } = this.noteRendererInstance.drawChord(config.notes, config.duration, config.isDotted, targetClef, newGroup);

      newEntry = {
        type: "chord",
        gElement: newGroup,
        noteData: config.notes,
        duration: config.duration,
        xPos: 0,
        totalWidth: fullWidth,
        originXOffset,
        yOffset,
        isTopStaff,
        yPosArray
      };
    }
    else {
      const { fullWidth, originXOffset, yPos } = this.noteRendererInstance.drawRest(config.duration, config.isDotted, newGroup);

      newEntry = {
        type: "rest",
        gElement: newGroup,
        duration: config.duration,
        xPos: 0,
        totalWidth: fullWidth,
        originXOffset,
        yOffset,
        isTopStaff,
        yPos
      };
    }

    this.notesLayer.replaceChild(newGroup, oldEntry.gElement);
    this.noteEntries[index] = newEntry;

    this.applySpacing();
  };

  /** - Evenly spaces out the notes on the staff. */
  public justifyNotes() {
    const notesCount = this.noteEntries.length;
    if (notesCount <= 0) return;

    const startX = this.staffFrame.getNoteStartX();
    const rightPadding = NOTE_SPACING;
    const availableWidth = this.options.width - startX - rightPadding;

    // Calculate the total footprint of all glyphs (no note spacing included)
    const totalGlyphWidth = this.noteEntries.reduce((sum, entry) => sum + entry.totalWidth, 0);

    const remainingSpace = availableWidth - totalGlyphWidth;

    // If notes overflow the staff, fallback to the standard minimum spacing
    const dynamicGap = remainingSpace > 0
      ? remainingSpace / notesCount
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

  /** - Clears staff of notes and resets internal positioning. */
  public clearAllNotes() {
    this.noteCursorX = 0;

    const notesLayer = this.svgRendererInstance.getLayer("notes");
    notesLayer?.replaceChildren();
    this.noteEntries = [];
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

  /** X coord relative to start of the notes layer */
  public getCoordsFromEntryIndex(index: number) {
    if (index >= this.noteEntries.length || index < 0) throw new Error("MusicStaff Error: Index out of bounds.");

    const noteEntry = this.noteEntries[index];
    let y = 0;
    if (noteEntry.type === "note") y = noteEntry.yPos;
    if (noteEntry.type === "chord") y = noteEntry.yPosArray[0];
    if (noteEntry.type === "rest") y = noteEntry.yPos;
    if (noteEntry.type === "beam") y = noteEntry.yPosArray[0];
    y += noteEntry.yOffset;

    let x = noteEntry.xPos + (noteEntry.totalWidth / 2);
    if (noteEntry.type === "beam") x = noteEntry.xPos + NOTEHEAD_BLACK.glyphWidth;

    return {
      x: x,
      y: y
    };
  };

  /**  - Returns the exact absolute Y-coordinate for a specific pitch (e.g., "C4"). Accounts for staff offsets (top vs bottom) and clef differences. */
  public getYFromPitch(pitch: string, options?: DrawOptions): number {
    // This parser doesn't consider durations
    const noteObj = parseChordNoteString(pitch);

    const { targetClef, yOffset } = this.resolveStaffTarget(options?.staff);

    // Calculate the physical staff steps and convert to a pixel coordinate
    const pitchStep = getPitchStepClefDifference(noteObj.letter, noteObj.octave, targetClef);
    const localYPos = convertPitchStepToYPos(pitchStep);

    return localYPos + yOffset;
  }

  /** - Removes the root svg element and cleans up arrays. */
  public destroy() {
    this.noteEntries = [];
    this.svgRendererInstance.destroy();
    this.notesLayer.replaceChildren();
    this.uiLayer.replaceChildren();
  };
}