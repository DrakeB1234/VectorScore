import { NOTE_LAYER_START_X, STAFF_LINE_SPACING } from "../constants";
import type { GlyphNames } from "../glyphs";
import GrandStaffStrategy from "../strategies/GrandStaffStrategy";
import SingleStaffStrategy from "../strategies/SingleStaffStrategy";
import type { StaffStrategy } from "../strategies/StrategyInterface";
import type { StaffTypes } from "../types";
import NoteRenderer from "./NoteRenderer";
import SVGRenderer from "./SVGRenderer";

export type ScrollingStaffOptions = {
  width?: number;
  scale?: number;
  staffType?: StaffTypes;
  spaceAbove?: number;
  spaceBelow?: number;
  staffColor?: string;
  staffBackgroundColor?: string;
  onNotesOut?: () => void;
};

const USE_GLPYHS: GlyphNames[] = [
  "CLEF_TREBLE", "CLEF_BASS", "CLEF_ALTO",
  "NOTE_HEAD_WHOLE", "NOTE_HEAD_HALF", "NOTE_HEAD_QUARTER", "EIGHTH_NOTE", "EIGHTH_NOTE_FLIPPED",
  "ACCIDENTAL_SHARP", "ACCIDENTAL_FLAT", "ACCIDENTAL_NATURAL", "ACCIDENTAL_DOUBLE_SHARP", "ACCIDENTAL_DOUBLE_FLAT"
];

export type NoteSequence = (string | string[])[];

type BufferedEntry = {
  type: "note" | "chord";
  notes: string[];
}

type ActiveEntry = {
  noteWrapper: SVGGElement;
  xPos: number;
}

const SCROLLING_NOTE_SPACING = 60;
const SPAWN_X_OFFSET = SCROLLING_NOTE_SPACING;

export default class ScrollingStaff {
  private svgRendererInstance: SVGRenderer;
  private strategyInstance: StaffStrategy;
  private noteRendererInstance: NoteRenderer;

  private options: Required<ScrollingStaffOptions>;

  private activeEntries: ActiveEntry[] = [];
  private noteBuffer: BufferedEntry[] = [];

  private notesLayer: SVGGElement;

  private noteCursorX: number = 0;

  constructor(rootElementCtx: HTMLElement, options?: ScrollingStaffOptions) {
    this.options = {
      width: 300,
      scale: 1,
      staffType: "treble",
      spaceAbove: 0,
      spaceBelow: 0,
      staffColor: "black",
      staffBackgroundColor: "transparent",
      ...options
    } as Required<ScrollingStaffOptions>;

    // Create the SVGRenderer instance with its options passed into this class
    this.svgRendererInstance = new SVGRenderer(rootElementCtx, {
      width: this.options.width,
      height: 100,
      scale: this.options.scale,
      staffColor: this.options.staffColor,
      staffBackgroundColor: this.options.staffBackgroundColor,
      useGlyphs: USE_GLPYHS
    });
    const rootSvgElement = this.svgRendererInstance.rootSvgElement;

    // Create the strategy instance based on the staffType
    switch (this.options.staffType) {
      case "grand":
        this.strategyInstance = new GrandStaffStrategy(this.svgRendererInstance, "grand");
        break;
      case "bass":
        this.strategyInstance = new SingleStaffStrategy(this.svgRendererInstance, "bass");
        break;
      case "treble":
        this.strategyInstance = new SingleStaffStrategy(this.svgRendererInstance, "treble");
        break;
      case "alto":
        this.strategyInstance = new SingleStaffStrategy(this.svgRendererInstance, "alto");
        break;
      default:
        throw new Error(`The staff type ${this.options.staffType} is not supported. Please use "treble", "bass", "alto", or "grand".`);
    };
    this.strategyInstance.drawStaff(this.options.width);

    // Create instance of NoteRenderer, with ref to svgRenderer and the strategy
    this.noteRendererInstance = new NoteRenderer(this.svgRendererInstance, this.strategyInstance);

    // Determine staff spacing positioning
    if (this.options.spaceAbove) {
      const yOffset = this.options.spaceAbove * (STAFF_LINE_SPACING);
      this.svgRendererInstance.addTotalRootSvgYOffset(yOffset);
    }
    if (this.options.spaceBelow) {
      let height = this.options.spaceBelow * (STAFF_LINE_SPACING);
      // Due to how different grand staff is setup, handle edge case of bottom spacing
      if (this.options.staffType === "grand") height -= (STAFF_LINE_SPACING / 2)
      this.svgRendererInstance.addTotalRootSvgHeight(height);
    }

    // Add class for transition css animation
    this.notesLayer = this.svgRendererInstance.getLayerByName("notes");
    this.notesLayer.classList.add("scrolling-notes-layer");

    // Commit to DOM for one batch operation
    this.svgRendererInstance.applySizingToRootSvg();
    this.svgRendererInstance.commitElementsToDOM(rootSvgElement);
  }

  private renderFirstNoteGroups() {
    // Calculate the cutoff point for visible notes, keep rendering notes until the cursor overreaches bounds + offset
    const maxVisibleX = (this.options.width - NOTE_LAYER_START_X) + SPAWN_X_OFFSET;

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
    const noteWrapper = this.svgRendererInstance.createGroup("note-wrapper");

    if (nextNoteInBuffer.type === "chord") {
      const res = this.noteRendererInstance.renderChord(nextNoteInBuffer.notes);
      res.noteGroup.setAttribute("transform", `translate(0, ${res.noteYPos})`);
      noteWrapper.appendChild(res.noteGroup);

    } else {
      const res = this.noteRendererInstance.renderNote(nextNoteInBuffer.notes[0]);
      res.noteGroup.setAttribute("transform", `translate(0, ${res.noteYPos})`);
      noteWrapper.appendChild(res.noteGroup);
    };

    // The note cursor at this stage will be placed at the last spawned position
    noteWrapper.style.transform = `translate(${this.noteCursorX}px, 0px)`;

    // Add current rendered note to active drawn notes, remove from buffer
    this.activeEntries.push({
      noteWrapper: noteWrapper,
      xPos: this.noteCursorX,
    });
    this.noteBuffer.shift();

    this.notesLayer.appendChild(noteWrapper);
  }

  queueNotes(notes: NoteSequence) {
    this.clearAllNotes();
    for (const entry of notes) {
      if (Array.isArray(entry)) {
        this.noteBuffer.push({
          type: "chord",
          notes: entry
        });
      } else {
        this.noteBuffer.push({
          type: "note",
          notes: [entry]
        });
      }
    }

    this.renderFirstNoteGroups();
  }

  advanceNotes() {
    if (this.activeEntries.length <= 0) {
      this.options.onNotesOut();
      return;
    };

    this.activeEntries.forEach(e => {
      e.xPos -= SCROLLING_NOTE_SPACING;
      e.noteWrapper.style.transform = `translate(${e.xPos}px, 0px)`;
    });

    const firstActiveNote = this.activeEntries[0];
    if (firstActiveNote.xPos <= 0) {
      this.notesLayer.removeChild(firstActiveNote.noteWrapper);
      this.activeEntries.shift();
    }
    this.renderNextNote();
  }

  clearAllNotes() {
    this.noteCursorX = 0;

    this.notesLayer.replaceChildren();
    this.activeEntries = [];
    this.noteBuffer = [];
  }

  destroy() {
    this.svgRendererInstance.destroy();
  }

  addClassToFirstNote(className: string) {
    if (this.activeEntries.length < 1) return;
    const firstNote = this.activeEntries[0];
    firstNote.noteWrapper.classList.add(className);
  }

  removeClassToFirstNote(className: string) {
    if (this.activeEntries.length < 1) return;
    const firstNote = this.activeEntries[0];
    firstNote.noteWrapper.classList.remove(className);
  }
}