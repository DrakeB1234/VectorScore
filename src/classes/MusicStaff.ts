import { NOTE_LAYER_START_X, NOTE_SPACING, STAFF_LINE_SPACING } from "../constants";
import { ACCIDENTAL_DOUBLEFLAT, ACCIDENTAL_DOUBLESHARP, ACCIDENTAL_FLAT, ACCIDENTAL_NATURAL, ACCIDENTAL_SHARP, CLEF_ALTO, CLEF_BASS, CLEF_TREBLE, FLAG_EIGHTH_DOWN, FLAG_EIGHTH_UP, FLAG_SIXTEENTH_DOWN, FLAG_SIXTEENTH_UP, NOTEHEAD_BLACK, NOTEHEAD_HALF, NOTEHEAD_WHOLE, TIMESIG_1, TIMESIG_2, TIMESIG_3, TIMESIG_4, TIMESIG_5, TIMESIG_6, TIMESIG_7, TIMESIG_8, TIMESIG_9, type GlyphDef } from "../glyphs";
import { _parseNoteString, getPitchStepClefDifference } from "../helpers/_noteHelpers";
import { parseNoteString } from "../helpers/notehelpers";
import { validateKeySignature, validateTimeSignature } from "../helpers/staffHelpers";
import GrandStaffStrategy from "../strategies/GrandStaffStrategy";
import SingleStaffStrategy from "../strategies/SingleStaffStrategy";
import type { StaffStrategy } from "../strategies/StrategyInterface";
import type { NoteObj, SystemTypes } from "../types";
import _NoteRenderer from "./_NoteRenderer";
import NoteRenderer, { type RenderNoteReturn } from "./NoteRenderer";
import StaffRenderer, { BASE_STAFF_HEIGHT, CLEF_X_OFFSET, COMPONENT_GAP, GRAND_STAFF_SPACING } from "./StaffRenderer";
import SVGRenderer from "./SVGRenderer";

export type MusicStaffOptions = {
  width?: number;
  scale?: number;
  noteStartX?: number;
  padding?: number;
  staffType?: SystemTypes;
  svgAutoFill?: boolean;
  keySignature?: string;
  timeSignature?: {
    topNumber: number;
    bottomNumber: number;
  };


  /** @deprecated Use `padding` instead. */
  spaceAbove?: number;
  /** @deprecated Use `padding` instead. */
  spaceBelow?: number;
};

const USE_GLPYHS: GlyphDef[] = [
  CLEF_TREBLE, CLEF_BASS, CLEF_ALTO,
  NOTEHEAD_WHOLE, NOTEHEAD_HALF, NOTEHEAD_BLACK,
  ACCIDENTAL_SHARP, ACCIDENTAL_FLAT, ACCIDENTAL_NATURAL, ACCIDENTAL_DOUBLESHARP, ACCIDENTAL_DOUBLEFLAT,
  TIMESIG_1, TIMESIG_2, TIMESIG_3, TIMESIG_4, TIMESIG_5, TIMESIG_6, TIMESIG_7, TIMESIG_8, TIMESIG_9,
  FLAG_EIGHTH_DOWN, FLAG_EIGHTH_UP, FLAG_SIXTEENTH_DOWN, FLAG_SIXTEENTH_UP
];

type NoteEntry = {
  gElement: SVGGElement;
  note: NoteObj;
  xPos: number;
  yPos: number;
  accidentalXOffset: number;
};

export default class MusicStaff {
  private options: Required<MusicStaffOptions>;

  private svgRendererInstance: SVGRenderer;
  private noteRendererInstance: NoteRenderer;
  private _noteRendererInstance: _NoteRenderer;
  private staffRenderer: StaffRenderer;

  private staffGroup: SVGGElement;
  private keySigGroup: SVGGElement;
  private timeSigGroup: SVGGElement;
  private notesLayer: SVGGElement;

  private clefWidth: number = 0;
  private keySigWidth: number = 0;
  private timeSigWidth: number = 0;
  private noteStartX: number = 0;

  private noteEntries: NoteEntry[] = [];
  private noteCursorX: number = 0;

  /**
   * Creates an instance of a MusicStaff, A single staff.
   *
   * @param rootElementCtx - The element (div) reference that will append the music staff elements to.
   * @param options - Optional configuration settings. Can adjust staff type (treble, bass, alto, grand), width, scale, spaces above/below, etc. All config options are in the type MusicStaffOptions
  */
  constructor(rootElementCtx: HTMLElement, options?: MusicStaffOptions) {
    this.options = {
      width: 300,
      scale: 1,
      /** @description affects overrides the global constant for start padding of notes*/
      noteStartX: NOTE_LAYER_START_X,
      staffType: "treble",
      padding: 20,
      svgAutoFill: true,
      spaceAbove: 0,
      spaceBelow: 0,
      ...options
    } as Required<MusicStaffOptions>;

    this.noteStartX = this.options.noteStartX;

    // Create the SVGRenderer instance with its options passed into this class
    this.svgRendererInstance = new SVGRenderer(rootElementCtx, USE_GLPYHS);
    this.staffRenderer = new StaffRenderer(this.svgRendererInstance);
    this._noteRendererInstance = new _NoteRenderer(this.svgRendererInstance);

    // Create the strategy instance based on the staffType
    let _oldStrategyInstance: StaffStrategy;
    switch (this.options.staffType) {
      case "grand":
        _oldStrategyInstance = new GrandStaffStrategy(this.svgRendererInstance, "grand");
        break;
      case "bass":
        _oldStrategyInstance = new SingleStaffStrategy(this.svgRendererInstance, "bass");
        break;
      case "treble":
        _oldStrategyInstance = new SingleStaffStrategy(this.svgRendererInstance, "treble");
        break;
      case "alto":
        _oldStrategyInstance = new SingleStaffStrategy(this.svgRendererInstance, "alto");
        break;
      default:
        throw new Error(`The staff type ${this.options.staffType} is not supported. Please use "treble", "bass", "alto", or "grand".`);
    };
    this.noteRendererInstance = new NoteRenderer(this.svgRendererInstance, _oldStrategyInstance);

    // Create layers
    const notesLayer = this.svgRendererInstance.createLayer("notes");
    const staffLayer = this.svgRendererInstance.createLayer("staff");
    this.notesLayer = notesLayer;

    // Determine staff spacing positioning
    if (this.options.spaceAbove) {
      this.options.padding += this.options.spaceAbove * STAFF_LINE_SPACING;
    }
    if (this.options.spaceBelow) {
      this.options.padding += this.options.spaceBelow * STAFF_LINE_SPACING;
    };

    // Draw staff methods
    const staffGroup = this.svgRendererInstance.createGroup("staff");
    this.staffGroup = staffGroup;
    staffLayer.appendChild(staffGroup);

    const { totalStaffHeight, glyphWidth } = this.staffRenderer.drawStaff({
      width: this.options.width,
      staffType: this.options.staffType,
      startYPos: 0,
      staffGroup,
    });
    this.clefWidth = glyphWidth + CLEF_X_OFFSET;

    const staffKeySigGroup = this.svgRendererInstance.createGroup("key-sig");
    this.keySigGroup = staffKeySigGroup;
    staffLayer.appendChild(staffKeySigGroup);

    if (this.options.keySignature) {
      this.keySigWidth = this.staffRenderer.drawKeySignature({
        keySignature: this.options.keySignature,
        staffGroup: staffKeySigGroup,
        staffType: this.options.staffType,
      });
    };

    const staffTimeSigGroup = this.svgRendererInstance.createGroup("time-sig");
    this.timeSigGroup = staffTimeSigGroup;
    staffLayer.appendChild(staffTimeSigGroup);

    if (this.options.timeSignature) {
      this.timeSigWidth = this.staffRenderer.drawTimeSignature({
        topNumber: this.options.timeSignature.topNumber,
        bottomNumber: this.options.timeSignature.bottomNumber,
        staffGroup: staffTimeSigGroup,
        staffType: this.options.staffType,
      });
    };

    this.staffRenderer.drawStaffBarLine(0.5, this.options.staffType, staffGroup);
    this.staffRenderer.drawStaffBarLine(this.options.width - 0.5, this.options.staffType, staffGroup);
    this.updateStaffLayout();
    staffLayer.appendChild(staffGroup);

    // Applying sizing to root SVG
    const totalHeight = totalStaffHeight + (this.options.padding * 2);
    const totalYOffset = this.options.padding;

    staffLayer.setAttribute("transform", `translate(0, ${totalYOffset})`);

    this.svgRendererInstance.setRootSVGSizing(this.options.width, totalHeight, this.options.scale);
    this.svgRendererInstance.setSVGAutoFill(this.options.svgAutoFill);

    this.svgRendererInstance.commitElementsToDOM(this.svgRendererInstance.svgElementRef);
  };

  public devDrawNote(noteString: string) {
    const noteObj = _parseNoteString(noteString);

    const fixedStaffType = this.options.staffType === "grand" ? "treble" : this.options.staffType;
    const notePitchStep = getPitchStepClefDifference(noteObj.letter, noteObj.octave, fixedStaffType);

    if (notePitchStep > 10 && this.options.staffType === "grand") {
      const noteGroup = this.svgRendererInstance.createGroup("note");
      const { noteHeadWidth: _, accidentalWidth } = this._noteRendererInstance.drawNote(noteObj, "bass", noteGroup);
      noteGroup.setAttribute("transform", `translate(${accidentalWidth + this.noteCursorX}, ${GRAND_STAFF_SPACING + BASE_STAFF_HEIGHT})`);
      this.notesLayer.appendChild(noteGroup);
      this.noteCursorX += 45;
      return;
    }

    const noteGroup = this.svgRendererInstance.createGroup("note");
    const { noteHeadWidth: _, accidentalWidth } = this._noteRendererInstance.drawNote(noteObj, fixedStaffType, noteGroup);
    noteGroup.setAttribute("transform", `translate(${accidentalWidth + this.noteCursorX}, 0)`);
    this.notesLayer.appendChild(noteGroup);

    this.noteCursorX += 45;
  }

  private updateStaffLayout() {
    let currentX = this.clefWidth;

    if (this.options.keySignature && this.keySigWidth > 0) {
      currentX += COMPONENT_GAP;
      this.keySigGroup.setAttribute("transform", `translate(${currentX}, 0)`);
      currentX += this.keySigWidth;
    } else {
      this.keySigGroup.setAttribute("transform", `translate(0, 0)`);
    }

    if (this.options.timeSignature && this.timeSigWidth > 0) {
      currentX += COMPONENT_GAP;
      this.timeSigGroup.setAttribute("transform", `translate(${currentX}, 0)`);
      currentX += this.timeSigWidth;
    } else {
      this.timeSigGroup.setAttribute("transform", `translate(0, 0)`);
    }

    // Shift the entire notes layer
    this.noteStartX = currentX + this.options.noteStartX;
    this.notesLayer.setAttribute("transform", `translate(${this.noteStartX}, ${this.options.padding})`);
  };

  public changeTimeSignature(top: number, bottom: number) {
    validateTimeSignature(top, bottom);
    if (this.options.timeSignature.topNumber === top && this.options.timeSignature.bottomNumber === bottom) return;

    this.options.timeSignature = { topNumber: top, bottomNumber: bottom };
    this.timeSigGroup.replaceChildren();

    this.timeSigWidth = this.staffRenderer.drawTimeSignature({
      topNumber: top,
      bottomNumber: bottom,
      staffGroup: this.timeSigGroup,
      staffType: this.options.staffType
    });

    this.updateStaffLayout();
  };

  public changeKeySignature(key: string) {
    validateKeySignature(key);
    if (this.options.keySignature === key) return;

    this.options.keySignature = key;
    this.keySigGroup.replaceChildren();

    this.keySigWidth = this.staffRenderer.drawKeySignature({
      keySignature: key,
      staffGroup: this.keySigGroup,
      staffType: this.options.staffType
    });

    this.updateStaffLayout();
  };

  /**
   * Draws a note on the staff.
   * @param notes - A single string OR array of note strings in the format `[Root][Accidental?][Octave][Duration?]`.
   * If an array is passed, it will draw each individual note on the staff.
   *
   * * **Root**: (A-G)
   * * **Accidental** (Optional): `#` (sharp) `b` (flat) `n` (natural) `##` (double sharp) or `bb` (double flat).
   * * **Octave**: The octave number (e.g., `4`).
   * * **Duration** (Optional): `w` (whole) `h` (half) `q` (quarter) or `e` (eighth). Defaults to `w` if duration is omitted
   * @returns void
   * @throws {Error} If a note string is not correct format. If an array was passed, it will still draw whatever correctly formatted notes before it. 
   * 
   * * @example
   * // Draws the specified notes individually on the staff
   * drawNote(["D4w", "F4w", "A4w", "B#5q", "Ebb4e"]);
   * 
   * * @example
   * // Draws the specified single note on the staff
   * drawNote("D4w");
  */
  drawNote(notes: string | string[]) {
    // Normalizes input by converting a single string into an array
    const normalizedNotesArray = Array.isArray(notes) ? notes : [notes];
    const notesLayer = this.svgRendererInstance.getLayer("notes");
    if (!notesLayer) throw new Error("DrawNote Error: Failed to retrieve notesLayer to append notes.");

    const noteGroups: SVGGElement[] = [];
    for (const noteString of normalizedNotesArray) {
      let res: RenderNoteReturn | undefined;

      // If theres a failed render of a string entry, commit any remaining note groups
      try {
        res = this.noteRendererInstance.renderNote(noteString);
      }
      catch (error) {
        if (noteGroups.length > 0) this.svgRendererInstance.commitElementsToDOM(noteGroups, notesLayer);
        throw error;
      };

      res.noteGroup.setAttribute("transform", `translate(${this.noteCursorX + res.accidentalOffset}, ${res.noteYPos})`);
      this.noteEntries.push({
        gElement: res.noteGroup,
        note: res.noteObj,
        xPos: this.noteCursorX + res.accidentalOffset,
        yPos: res.noteYPos,
        accidentalXOffset: res.accidentalOffset
      });

      this.noteCursorX += NOTE_SPACING + res.accidentalOffset;
      noteGroups.push(res.noteGroup);
    }

    // Commit the newly created note/notes element to the 'notes' layer
    this.svgRendererInstance.commitElementsToDOM(noteGroups, notesLayer);
  }

  /**
   * Draws a chord on the staff.
   * @param notes - An array of note strings in the format `[Root][Accidental?][Octave][Duration?]`.
   *
   * * **Root**: (A-G)
   * * **Accidental** (Optional): `#` (sharp) `b` (flat) `n` (natural) `##` (double sharp) or `bb` (double flat).
   * * **Octave**: The octave number (e.g., `4`).
   * * **Duration** (Optional): `w` (whole) `h` (half) `q` (quarter) or `e` (eighth). Defaults to `w` if duration is omitted
   * @returns void
   * @throws {Error} If a note string is not correct format OR if less than one note was provided.
   * 
   * * @example
   * // Draw a D minor chord starting on 4th octave
   * drawChord(["D4w", "F4w", "A4w"], 0);
  */
  drawChord(notes: string[]) {
    if (notes.length < 2) throw new Error("Provide more than one note for a chord.");
    const notesLayer = this.svgRendererInstance.getLayer("notes");
    if (!notesLayer) throw new Error("DrawChord Error: Failed to retrieve notesLayer to append chord.");

    const res = this.noteRendererInstance.renderChord(notes);

    // Apply XPos to chord parent
    res.noteGroup.setAttribute("transform", `translate(${this.noteCursorX + res.accidentalOffset}, 0)`);

    this.noteEntries.push({
      gElement: res.noteGroup,
      note: parseNoteString(notes[0]),
      xPos: this.noteCursorX + res.accidentalOffset,
      yPos: 0,
      accidentalXOffset: res.accidentalOffset
    });

    // Increment note cursor due to renderNote function being overriden X pos
    this.noteCursorX += NOTE_SPACING + res.accidentalOffset + res.cursorOffset;

    // Commit the newly created note/notes element to the 'notes' layer
    this.svgRendererInstance.commitElementsToDOM(res.noteGroup, notesLayer);
  }

  /**
   * Evenly spaces out the notes on the staff.
   * @returns Returns early if no notes are on the staff
  */
  justifyNotes() {
    const containerWidth = this.options.width;
    const notesCount = this.noteEntries.length;
    if (notesCount <= 0 || containerWidth <= 0) return;
    const noteSpacing = Math.round(containerWidth / notesCount);

    // Get all calculations first (prevent layout thrashing by writing/reading in the same loop)
    const updates = this.noteEntries.map((e, i) => {
      const slotCenterX = (i + 0.5) * noteSpacing;
      const bbox = e.gElement.getBBox(); // Forces Style Recalc (Expensive)

      // Calculate the final visual position
      const rawPlacedX = slotCenterX - (bbox.width / 2) - bbox.x;
      const finalX = Math.round(rawPlacedX * 10) / 10;

      return {
        entry: e,
        newX: finalX,
        isChord: e.gElement.classList.contains("chord")
      };
    });

    // Write each update (not calling getBBox in this loops helps layout thrasing)
    updates.forEach((update) => {
      const { entry, newX, isChord } = update;

      if (isChord) {
        entry.gElement.setAttribute("transform", `translate(${newX}, 0)`);
      } else {
        entry.gElement.setAttribute("transform", `translate(${newX}, ${entry.yPos})`);
      }

      entry.xPos = newX;
    });
  }

  /**
   * Clears staff of notes and resets internal positioning.
   * @returns void
  */
  clearAllNotes() {
    this.noteCursorX = 0;

    const notesLayer = this.svgRendererInstance.getLayer("notes");
    notesLayer?.replaceChildren();
    this.noteEntries = [];
  }


  /**
   * Changes the note by index to the specified note.
   * @param notes - A note string in the format `[Root][Accidental?][Octave][Duration?]`.
   *
   * * **Root**: (A-G)
   * * **Accidental** (Optional): `#` (sharp) `b` (flat) `n` (natural) `##` (double sharp) or `bb` (double flat).
   * * **Octave**: The octave number (e.g., `4`).
   * * **Duration** (Optional): `w` (whole) `h` (half) `q` (quarter) or `e` (eighth). Defaults to `w` if duration is omitted
   * @param noteIndex The index of the note that will replaced by the specified note.
   * @returns void
   * @throws {Error} If the index provided is out of bounds, or if a note string is not correct format.
   * 
   * * @example
   * // Changes note at pos `0` to a B flat quarter note on the 3rd octave
   * changeNoteByIndex("Bb3q", 0);
  */
  changeNoteByIndex(note: string, noteIndex: number) {
    if (noteIndex >= this.noteEntries.length) throw new Error("Note index was out of bounds.");
    const noteEntry = this.noteEntries[noteIndex];

    const res = this.noteRendererInstance.renderNote(note);
    const normalizedOriginalXPos = noteEntry.xPos - noteEntry.accidentalXOffset;

    // Due to normalization of orignal note pos, this will only consider the newly caculated accidental X offset
    const newXPos = normalizedOriginalXPos + res.accidentalOffset;

    res.noteGroup.setAttribute("transform", `translate(${newXPos}, ${res.noteYPos})`);

    // Replace with new note
    const notesLayer = this.svgRendererInstance.getLayer("notes");
    if (!notesLayer) throw new Error("ChangeNoteByIndex Error: Failed to retrieve notesLayer to append notes.");
    notesLayer.replaceChild(res.noteGroup, noteEntry.gElement);

    // Replace place in list with new note data
    this.noteEntries[noteIndex] = {
      gElement: res.noteGroup,
      note: res.noteObj,
      xPos: newXPos,
      yPos: res.noteYPos,
      accidentalXOffset: res.accidentalOffset
    };
  };

  /**
   * Changes the note by index to the specified chord.
   * @param notes - An array of note strings in the format `[Root][Accidental?][Octave][Duration?]`.
   *
   * * **Root**: (A-G)
   * * **Accidental** (Optional): `#` (sharp) `b` (flat) `n` (natural) `##` (double sharp) or `bb` (double flat).
   * * **Octave**: The octave number (e.g., `4`).
   * * **Duration** (Optional): `w` (whole) `h` (half) `q` (quarter) or `e` (eighth). Defaults to `w` if duration is omitted
   * @param noteIndex The index of the note that will replaced by the specified chord.
   * @returns void
   * @throws {Error} If the index provided is out of bounds, or if a note string is not correct format.
   * 
   * * @example
   * // Changes chord at pos `0` to a C Minor chord
   * changeChordByIndex(["C4w", "D#4w", "G4w"], 0);
  */
  changeChordByIndex(notes: string[], chordIndex: number) {
    if (chordIndex >= this.noteEntries.length) throw new Error("Chord index was out of bounds.");
    if (notes.length < 2) throw new Error("Notes provided need to be more than one to be considered a chord.");
    const chordEntry = this.noteEntries[chordIndex];

    const res = this.noteRendererInstance.renderChord(notes);

    const normalizedOriginalXPos = chordEntry.xPos - chordEntry.accidentalXOffset;
    // Due to normalization of orignal note pos, this will only consider the newly caculated X pos
    const newXPos = normalizedOriginalXPos + res.accidentalOffset;

    // Apply XPos to chord parent not sure how to handle xOffsets without them accumlating
    res.noteGroup.setAttribute("transform", `translate(${newXPos}, 0)`);

    // Replace with new note
    const notesLayer = this.svgRendererInstance.getLayer("notes");
    if (!notesLayer) throw new Error("DrawNote Error: Failed to retrieve notesLayer to append notes.");
    notesLayer.replaceChild(res.noteGroup, chordEntry.gElement);

    // Replace place in list with new note data
    this.noteEntries[chordIndex] = {
      gElement: res.noteGroup,
      note: parseNoteString(notes[0]),
      xPos: newXPos,
      yPos: 0,
      accidentalXOffset: res.accidentalOffset
    };
  };

  /**
   * Adds a class to the note by the index provided.
   * @param className The name added to the note
   * @param noteIndex The index of the note that will have 'className' added to it.
   * @returns void
   * @throws {Error} If the index provided is out of bounds
  */
  addClassToNoteByIndex(className: string, noteIndex: number) {
    if (noteIndex >= this.noteEntries.length) throw new Error("Note index was out of bounds.");
    const noteEntry = this.noteEntries[noteIndex];

    noteEntry.gElement.classList.add(className);
  }

  /**
   * Removes a class to the note by the index provided.
   * @param className The name removed from the note
   * @param noteIndex The index of the note that will have 'className' removed from it.
   * @returns void
   * @throws {Error} If the index provided is out of bounds
  */
  removeClassToNoteByIndex(className: string, noteIndex: number) {
    if (noteIndex >= this.noteEntries.length) throw new Error("Note index was out of bounds.");
    const noteEntry = this.noteEntries[noteIndex];

    noteEntry.gElement.classList.remove(className);
  };

  /**
   * Removes the root svg element and cleans up arrays.
   * @returns void
  */
  destroy() {
    this.noteEntries = [];
    this.svgRendererInstance.destroy();
  }
}