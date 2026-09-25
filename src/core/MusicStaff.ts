import { ACCIDENTAL_DOUBLEFLAT, ACCIDENTAL_DOUBLESHARP, ACCIDENTAL_FLAT, ACCIDENTAL_NATURAL, ACCIDENTAL_SHARP, CLEF_ALTO, CLEF_BASS, CLEF_TREBLE, FLAG_EIGHTH_DOWN, FLAG_EIGHTH_UP, FLAG_SIXTEENTH_DOWN, FLAG_SIXTEENTH_UP, NOTEHEAD_BLACK, NOTEHEAD_HALF, NOTEHEAD_WHOLE, REST_EIGHTH, REST_HALF, REST_QUARTER, REST_SIXTEENTH, REST_WHOLE, TIMESIG_1, TIMESIG_2, TIMESIG_3, TIMESIG_4, TIMESIG_5, TIMESIG_6, TIMESIG_7, TIMESIG_8, TIMESIG_9, type GlyphDef } from "../glyphs";
import { _parseNoteString, parseChordNoteString, type NoteDurations, type VSChordNoteObj, type VSNoteObj } from "../helpers/_noteHelpers";
import { validateKeySignature, validateTimeSignature, type KeySignatures, type TimeSignature } from "../helpers/staffHelpers";
import type { ClefTypes, SystemTypes } from "../types";
import _NoteRenderer from "../classes/_NoteRenderer";
import StaffFrame from "../classes/StaffFrame";
import { BASE_STAFF_HEIGHT, GRAND_STAFF_SPACING } from "../classes/StaffRenderer";
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
  FLAG_EIGHTH_DOWN, FLAG_EIGHTH_UP, FLAG_SIXTEENTH_DOWN, FLAG_SIXTEENTH_UP,
  REST_WHOLE, REST_HALF, REST_QUARTER, REST_EIGHTH, REST_SIXTEENTH
];

const NOTE_LAYER_START_X = 16;
const NOTE_SPACING = 14;

const DEFAULT_STAFF_OPTIONS: Required<Omit<MusicStaffUserOptions, "keySignature" | "timeSignature">> = {
  width: 300,
  scale: 1,
  noteStartX: NOTE_LAYER_START_X,
  staffType: "treble",
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
};

type ChordEntry = BaseEntry & {
  type: "chord";
  noteData: VSChordNoteObj[];
  duration: NoteDurations;
};

type RestEntry = BaseEntry & {
  type: "rest";
  duration: NoteDurations;
};

// The new unified type for the array
type StaffEntry = NoteEntry | ChordEntry | RestEntry;

export type DrawOptions = {
  staff?: "top" | "bottom";
  // className?: string;
};

// Config types for use in replaceByIndex
export type NoteReplaceConfig = { type: "note"; note: string };
export type ChordReplaceConfig = { type: "chord"; notes: string[]; duration: NoteDurations };
export type RestReplaceConfig = { type: "rest"; duration: NoteDurations };

export type ReplaceConfig = NoteReplaceConfig | ChordReplaceConfig | RestReplaceConfig;

export default class MusicStaff {
  private options: ResolvedStaffOptions;

  private svgRendererInstance: SVGRenderer;
  private _noteRendererInstance: _NoteRenderer;
  private staffFrame: StaffFrame;

  private notesLayer: SVGGElement;

  private noteEntries: StaffEntry[] = [];
  private noteCursorX: number = 0;

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
    this._noteRendererInstance = new _NoteRenderer(this.svgRendererInstance);
    // Renders the frame on init
    this.staffFrame = new StaffFrame(this.svgRendererInstance, this.options);

    this.notesLayer = this.svgRendererInstance.createLayer("notes");
    this.updateNotesLayerTransform(this.staffFrame.getNoteStartX());

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
  }

  private updateNotesLayerTransform(startX: number) {
    this.notesLayer.setAttribute("transform", `translate(${startX}, ${this.options.paddingTop})`);
  };

  public changeTimeSignature(top: number, bottom: number) {
    const newStartX = this.staffFrame.changeTimeSignature(top, bottom);
    this.updateNotesLayerTransform(newStartX);
  };

  public removeTimeSignature() {
    const newStartX = this.staffFrame.removeTimeSignature();
    this.updateNotesLayerTransform(newStartX);
  }

  public changeKeySignature(key: KeySignatures) {
    const newStartX = this.staffFrame.changeKeySignature(key);
    this.updateNotesLayerTransform(newStartX);
  };

  public removeKeySignature() {
    const newStartX = this.staffFrame.removeKeySignature();
    this.updateNotesLayerTransform(newStartX);
  }

  /** 
   * - Draws a note on the staff. 
   */
  public drawNote(note: string, options?: DrawOptions) {
    const noteObj = _parseNoteString(note);
    const { targetClef, yOffset, isTopStaff } = this.resolveStaffTarget(options?.staff);

    const noteGroup = this.svgRendererInstance.createGroup("note");

    const { fullWidth, originXOffset } = this._noteRendererInstance.drawNote(noteObj, targetClef, noteGroup);

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
      isTopStaff
    });

    this.noteCursorX += NOTE_SPACING + fullWidth;
  }

  /** - Draws a chord on the staff. */
  public drawChord(noteStrings: string[], duration: NoteDurations, options?: DrawOptions) {
    const noteObjs = noteStrings.map(str => parseChordNoteString(str));
    const { targetClef, yOffset, isTopStaff } = this.resolveStaffTarget(options?.staff);

    const chordGroup = this.svgRendererInstance.createGroup("chord");

    const { fullWidth, originXOffset } = this._noteRendererInstance.drawChord(noteObjs, duration, targetClef, chordGroup);

    chordGroup.setAttribute("transform", `translate(${originXOffset + this.noteCursorX}, ${yOffset})`);
    this.notesLayer.appendChild(chordGroup);

    this.noteEntries.push({
      type: "chord",
      gElement: chordGroup,
      noteData: noteObjs,
      duration: duration,
      xPos: this.noteCursorX,
      totalWidth: fullWidth,
      originXOffset,
      yOffset,
      isTopStaff
    });

    this.noteCursorX += NOTE_SPACING + fullWidth;
  }

  /** - Draws a rest on the staff. */
  public drawRest(duration: NoteDurations, options?: DrawOptions) {
    const { targetClef: _, yOffset, isTopStaff } = this.resolveStaffTarget(options?.staff);

    const restGroup = this.svgRendererInstance.createGroup("rest");

    // originXOffset will be 0, due to rest not shifting into negative space.
    const { fullWidth, originXOffset } = this._noteRendererInstance.drawRest(duration, restGroup);

    restGroup.setAttribute("transform", `translate(${this.noteCursorX}, ${yOffset})`);
    this.notesLayer.appendChild(restGroup);

    this.noteEntries.push({
      type: "rest",
      gElement: restGroup,
      duration: duration,
      xPos: this.noteCursorX,
      totalWidth: fullWidth,
      yOffset,
      originXOffset: originXOffset,
      isTopStaff
    });

    this.noteCursorX += NOTE_SPACING + fullWidth;
  }

  /** - Replaces a note, chord, or rest by index on staff. */
  public replaceByIndex(index: number, config: ReplaceConfig, options?: DrawOptions) {
    if (index < 0 || index >= this.noteEntries.length) throw new Error(`MusicStaff replaceByIndex: Index ${index} is out of bounds.`);
    if (!config.type) throw new Error(`MusicStaff replaceByIndex: Incorrect replace config provided.`);

    const oldEntry = this.noteEntries[index];
    const { targetClef, yOffset, isTopStaff } = this.resolveStaffTarget(options?.staff);

    const newGroup = this.svgRendererInstance.createGroup(config.type);
    let newEntry: StaffEntry;

    // Set starting point back to original X pos of target, minus its offset from negative space (accidentals, ledgerlines, etc..)
    const startingX = oldEntry.xPos - oldEntry.originXOffset;

    if (config.type === "note") {
      const noteObj = _parseNoteString(config.note);
      const { fullWidth, originXOffset } = this._noteRendererInstance.drawNote(noteObj, targetClef, newGroup);
      const newX = startingX + originXOffset;

      newEntry = {
        type: "note",
        gElement: newGroup,
        noteData: noteObj,
        xPos: newX,
        totalWidth: fullWidth,
        originXOffset,
        yOffset,
        isTopStaff
      };
    }
    else if (config.type === "chord") {
      const noteObjs = config.notes.map(str => parseChordNoteString(str));
      const { fullWidth, originXOffset } = this._noteRendererInstance.drawChord(noteObjs, config.duration, targetClef, newGroup);
      const newX = startingX + originXOffset;

      newEntry = {
        type: "chord",
        gElement: newGroup,
        noteData: noteObjs,
        duration: config.duration,
        xPos: newX,
        totalWidth: fullWidth,
        originXOffset,
        yOffset,
        isTopStaff
      };
    }
    else {
      const { fullWidth, originXOffset } = this._noteRendererInstance.drawRest(config.duration, newGroup);
      const newX = startingX + originXOffset;

      newEntry = {
        type: "rest",
        gElement: newGroup,
        duration: config.duration,
        xPos: newX,
        totalWidth: fullWidth,
        originXOffset,
        yOffset,
        isTopStaff
      };
    }

    newGroup.setAttribute("transform", `translate(${newEntry.xPos}, ${newEntry.yOffset})`);
    this.notesLayer.replaceChild(newGroup, oldEntry.gElement);
    this.noteEntries[index] = newEntry;
  }

  /** - Evenly spaces out the notes on the staff. */
  public justifyNotes() {
    const notesCount = this.noteEntries.length;
    if (notesCount <= 0) return;

    const startX = this.staffFrame.getNoteStartX();
    const rightPadding = NOTE_SPACING;
    const availableWidth = this.options.width - startX - rightPadding;

    // Calculate the total footprint of all glyphs (no empty space included)
    const totalGlyphWidth = this.noteEntries.reduce((sum, entry) => sum + entry.totalWidth, 0);

    const remainingSpace = availableWidth - totalGlyphWidth;

    // If notes overflow the staff, fallback to the standard minimum spacing
    const dynamicGap = remainingSpace > 0
      ? remainingSpace / notesCount
      : NOTE_SPACING;

    let currentX = 0;
    this.noteEntries.forEach(entry => {
      entry.xPos = currentX;

      entry.gElement.setAttribute(
        "transform",
        `translate(${currentX + entry.originXOffset}, ${entry.yOffset})`
      );

      currentX += entry.totalWidth + dynamicGap;
    });

    this.noteCursorX = currentX;
  }

  /** - Clears staff of notes and resets internal positioning. */
  clearAllNotes() {
    this.noteCursorX = 0;

    const notesLayer = this.svgRendererInstance.getLayer("notes");
    notesLayer?.replaceChildren();
    this.noteEntries = [];
  }


  /** - Changes the note by index to the specified note. */
  changeNoteByIndex(note: string, noteIndex: number) {
    // REFACTOR / IMPLEMENT
  };

  /** - Changes the note by index to the specified chord. */
  changeChordByIndex(notes: string[], chordIndex: number) {
    // REFACTOR / IMPLEMENT
  };

  /** - Adds a class to the note by the index provided. */
  addClassToNoteByIndex(className: string, noteIndex: number) {
    // REFACTOR / IMPLEMENT
  }

  /** - Removes a class to the note by the index provided. */
  removeClassToNoteByIndex(className: string, noteIndex: number) {
    // REFACTOR / IMPLEMENT
  };

  /** - Removes the root svg element and cleans up arrays. */
  destroy() {
    this.noteEntries = [];
    this.svgRendererInstance.destroy();
  };
}