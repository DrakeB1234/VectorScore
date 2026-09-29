import { ACCIDENTAL_DOUBLEFLAT, ACCIDENTAL_DOUBLESHARP, ACCIDENTAL_FLAT, ACCIDENTAL_NATURAL, ACCIDENTAL_SHARP, CLEF_ALTO, CLEF_BASS, CLEF_TREBLE, FLAG_EIGHTH_DOWN, FLAG_EIGHTH_UP, FLAG_SIXTEENTH_DOWN, FLAG_SIXTEENTH_UP, NOTEHEAD_BLACK, NOTEHEAD_HALF, NOTEHEAD_WHOLE, REST_EIGHTH, REST_HALF, REST_QUARTER, REST_SIXTEENTH, REST_WHOLE, TIMESIG_1, TIMESIG_2, TIMESIG_3, TIMESIG_4, TIMESIG_5, TIMESIG_6, TIMESIG_7, TIMESIG_8, TIMESIG_9, type GlyphDef } from "../glyphs";
import type { SystemTypes } from "../types";
import NoteRenderer from "../classes/NoteRenderer";
import SVGRenderer from "../classes/SVGRenderer";
import StaffFrame from "../classes/StaffFrame";
import { validateKeySignature, validateTimeSignature, type KeySignatures, type TimeSignature } from "../helpers/staffHelpers";
import { parseNoteString, parseChordNoteString, type DrawChordConfig, type DrawNoteConfig, type DrawRestConfig } from "../helpers/noteHelpers";

const USE_GLPYHS: GlyphDef[] = [
  CLEF_TREBLE, CLEF_BASS, CLEF_ALTO,
  NOTEHEAD_WHOLE, NOTEHEAD_HALF, NOTEHEAD_BLACK,
  ACCIDENTAL_SHARP, ACCIDENTAL_FLAT, ACCIDENTAL_NATURAL, ACCIDENTAL_DOUBLESHARP, ACCIDENTAL_DOUBLEFLAT,
  TIMESIG_1, TIMESIG_2, TIMESIG_3, TIMESIG_4, TIMESIG_5, TIMESIG_6, TIMESIG_7, TIMESIG_8, TIMESIG_9,
  FLAG_EIGHTH_DOWN, FLAG_EIGHTH_UP, FLAG_SIXTEENTH_DOWN, FLAG_SIXTEENTH_UP,
  REST_WHOLE, REST_HALF, REST_QUARTER, REST_EIGHTH, REST_SIXTEENTH
];

export type ScrollingStaffUserOptions = {
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
  onNotesOut?: () => void;
};

type ResolvedScrollingStaffOptions =
  Required<Omit<ScrollingStaffUserOptions, "keySignature" | "timeSignature" | "onNotesOut">> &
  Pick<ScrollingStaffUserOptions, "keySignature" | "timeSignature" | "onNotesOut">;


type DrawConfig = DrawNoteConfig | DrawChordConfig | DrawRestConfig;

type ActiveEntry = {
  gElement: SVGGElement;
  xPos: number;
  width: number;
  originXOffset: number;
}

const SCROLLING_NOTE_SPACING = 60;
const SPAWN_X_OFFSET = SCROLLING_NOTE_SPACING;

const NOTE_LAYER_START_X = 16;

const DEFAULT_STAFF_OPTIONS: Required<Omit<ScrollingStaffUserOptions, "keySignature" | "timeSignature" | "onNotesOut">> = {
  width: 300,
  scale: 1,
  noteStartX: NOTE_LAYER_START_X,
  staffType: "treble",
  paddingTop: 20,
  paddingBottom: 20,
  svgAutoFill: true,
};

export default class ScrollingStaff {
  private options: ResolvedScrollingStaffOptions;

  private svgRendererInstance: SVGRenderer;
  private staffFrame: StaffFrame;
  private noteRendererInstance: NoteRenderer;

  private notesLayer: SVGGElement;

  private activeEntries: ActiveEntry[] = [];
  private noteBuffer: DrawConfig[] = [];
  private noteCursorX: number = 0;

  /**
   * Creates an instance of a ScrollingStaff, A single staff that takes in a queue of notes that can be advanced with in a 'endless' style of staff.
   *
   * @param rootElementCtx - The element (div) reference that will append the music staff elements to.
   * @param options - Optional configuration settings. All config options are in the type ScrollingStaffOptions
  */
  constructor(rootElementCtx: HTMLElement, userOptions?: ScrollingStaffUserOptions) {
    this.options = { ...DEFAULT_STAFF_OPTIONS, ...userOptions };

    if (this.options.keySignature) validateKeySignature(this.options.keySignature);
    if (this.options.timeSignature) validateTimeSignature(this.options.timeSignature.topNumber, this.options.timeSignature.bottomNumber);

    this.svgRendererInstance = new SVGRenderer(rootElementCtx, USE_GLPYHS);
    this.noteRendererInstance = new NoteRenderer(this.svgRendererInstance);
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

  private updateNotesLayerTransform(startX: number) {
    this.notesLayer.setAttribute("transform", `translate(${startX}, ${this.options.paddingTop})`);
  };

  private renderFirstNoteGroups() {
    // Calculate the cutoff point for visible notes, keep rendering notes until the cursor overreaches bounds + offset
    const maxVisibleX = (this.options.width - this.options.noteStartX) + SPAWN_X_OFFSET;

    while (this.noteBuffer.length > 0 && this.noteCursorX < maxVisibleX) {
      this.renderNextNote();

      this.noteCursorX += SCROLLING_NOTE_SPACING;
    }

    // Removed the lastly applied noteCurorX increment, due to the final op in while loop incrementing cursor
    if (this.activeEntries.length > 1) this.noteCursorX -= SCROLLING_NOTE_SPACING;
  }

  private renderNextNote() {
    if (this.noteBuffer.length < 1) return;

    const nextNoteInBuffer = this.noteBuffer[0];
    const group = this.svgRendererInstance.createGroup(nextNoteInBuffer.type);

    let _fullWidth: number, _originXOffset: number;

    if (nextNoteInBuffer.type === "chord") {
      const noteObjs = nextNoteInBuffer.notes.map(noteStr => parseChordNoteString(noteStr));
      const { fullWidth, originXOffset } = this.noteRendererInstance.drawChord(noteObjs, nextNoteInBuffer.duration, "treble", group);
      _fullWidth = fullWidth;
      _originXOffset = originXOffset;
    }
    else if (nextNoteInBuffer.type === "note") {
      const noteObj = parseNoteString(nextNoteInBuffer.note);
      const { fullWidth, originXOffset } = this.noteRendererInstance.drawNote(noteObj, "treble", group);
      _fullWidth = fullWidth;
      _originXOffset = originXOffset;
    }
    else {
      const { fullWidth, originXOffset } = this.noteRendererInstance.drawRest(nextNoteInBuffer.duration, group);
      _fullWidth = fullWidth;
      _originXOffset = originXOffset;
    }

    // The note cursor at this stage will be placed at the last spawned position
    group.setAttribute("transform", `translate(${this.noteCursorX + _originXOffset}, 0)`);

    // Add current rendered note to active drawn notes, remove from buffer
    this.activeEntries.push({
      gElement: group,
      xPos: this.noteCursorX,
      width: _fullWidth,
      originXOffset: _originXOffset,
    });
    this.noteBuffer.shift();

    this.notesLayer.appendChild(group);
  }

  /** Adds notes to the queue for scrolling staff. Clears any previously added notes. */
  queueNotes(notes: DrawConfig[]) {
    this.clearAllNotes();

    this.noteBuffer = [...notes];

    this.renderFirstNoteGroups();
  }

  /**
   * Advances to the next note in sequence, if theres any remaining notes left.
   * @callback onNotesOut Constructor option: Calls if there are no more notes remaining.
  */
  advanceNotes() {
    if (this.activeEntries.length <= 0) {
      this.clearAllNotes();
      if (this.options.onNotesOut) this.options.onNotesOut();
      return;
    };

    this.activeEntries.forEach(e => {
      e.xPos -= SCROLLING_NOTE_SPACING;
      e.gElement.setAttribute("transform", `translate(${e.xPos}, 0)`);
    });

    const firstActiveNote = this.activeEntries[0];
    if (firstActiveNote.xPos <= 0) {
      this.notesLayer.removeChild(firstActiveNote.gElement);
      this.activeEntries.shift();
    }
    this.renderNextNote();
  }

  /**
   * Clears staff of notes and resets internal positioning.
   * @returns void
  */
  clearAllNotes() {
    this.noteCursorX = 0;

    this.notesLayer.replaceChildren();
    this.activeEntries = [];
    this.noteBuffer = [];
  }

  /**
   * Removes the root svg element and cleans up arrays.
   * @returns void
  */
  destroy() {
    this.svgRendererInstance.destroy();
    this.activeEntries = [];
    this.noteBuffer = [];
  }
}