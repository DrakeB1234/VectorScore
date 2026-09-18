import type { GlyphNames } from "../glyphs";
import SVGRenderer from "../classes/SVGRenderer";
import { BARLINE_MEASURE_PADDING, drawBarLine, drawStaff, GRAND_STAFF_SPACING, type StaffTypes } from "./devStaffHelpers";
import { ACCIDENTAL_X_OFFSET, calculateAccidentalCollisions, calculateSecondIntervalCollisions, drawAccidental, drawFlag, drawLedgerLines, drawNotehead, drawRest, drawStem, getAccidentalGlyph, getNoteheadGlyphByDuration, getPitchStepClefDifference, getPitchYCoordinate, LEDGER_LINE_X_OFFSET, NOTE_STEM_LENGTH, sortVSNoteObjs, type NoteDurations, type PositionedNote, type VSNoteObj } from "./devNoteHelpers";
import { STAFF_LINE_COUNT, STAFF_LINE_SPACING } from "../constants";
import { ScoreFormatter, type ScaledStaffData } from "./ScoreFormatter";
import type { DevGlyphEntry } from "./devGlyphs";

export type DevStaffOptions = {
  width?: number;
  scale?: number;
  svgAutoFill?: boolean;
};

export type SystemStaffTypes = StaffTypes | "grand";

const USE_GLPYHS: GlyphNames[] = [
  "CLEF_TREBLE", "CLEF_BASS", "CLEF_ALTO",
  "NOTE_HEAD_WHOLE", "NOTE_HEAD_HALF", "NOTE_HEAD_QUARTER", "EIGHTH_NOTE", "EIGHTH_NOTE_FLIPPED",
  "ACCIDENTAL_SHARP", "ACCIDENTAL_FLAT", "ACCIDENTAL_NATURAL", "ACCIDENTAL_DOUBLE_SHARP", "ACCIDENTAL_DOUBLE_FLAT"
];

// Knows about page size, scale, and holds all Systems.
interface Score {
  width: number;
  systems: System[];
};

// A single horizontal row of music across the screen
// If the music hits the right edge of the page, it wraps to a new System.
interface System {
  x: number;
  y: number;
  measures: Measure[];
};

// Holds pre-calculated raw widths from note durations for a measure
interface Measure {
  rawWidth: number;
  staves: Staff[];
};

// A single 5-line staff, for grand staffs, voices array will contain two (treble and bass)
interface Staff {
  clef: "treble" | "bass" | "alto";
  voices: Voice[];
};

interface Voice {
  notes: PositionedNote[];
};

export interface PitchRenderData {
  pitch: string;
  step: number;
  y: number;
  xOffset: number;
  accidental: string | null;
  accidentalGlyph: DevGlyphEntry | null;
  accidentalColumn: number;
}

export default class DevStaff {
  private svgRendererInstance: SVGRenderer;
  private scoreFormatterInstance: ScoreFormatter;
  private options: Required<DevStaffOptions>;

  private staffLayer: SVGGElement;
  private systemStaffType: SystemStaffTypes;

  constructor(rootElementCtx: HTMLElement, options?: DevStaffOptions) {
    this.options = {
      width: 300,
      scale: 1,
      svgAutoFill: true,
      ...options
    } as Required<DevStaffOptions>;

    this.svgRendererInstance = new SVGRenderer(rootElementCtx, {
      width: this.options.width,
      height: 100,
      scale: this.options.scale,
      useGlyphs: USE_GLPYHS,
      svgAutoFill: this.options.svgAutoFill
    });
    this.systemStaffType = "grand";

    this.scoreFormatterInstance = new ScoreFormatter({
      paddingPerMeasure: BARLINE_MEASURE_PADDING,
      startX: 60,
      targetWidth: this.options.width
    });

    const rootSvgElement = this.svgRendererInstance.rootSvgElement;

    // Creating staff, applying height / offset / padding values
    let totalBaseHeight = 0;

    const staffObj = drawStaff(this.systemStaffType, this.options.width, this.svgRendererInstance);
    rootSvgElement.appendChild(staffObj.staffLayer);
    totalBaseHeight += staffObj.staffHeight;


    // Adds total height from staff, offset is applied in applySizingToRootSvg, which adds height == yOffset amount
    // ==== Would be best to rely on functions returning height values, then applying in a single function call to the SVGRenderer ====
    // ==== AVOIDING CALLING OFFSET ON PARENT GROUP, JUST BY ELEMENTS LIKE STAFF GROUP ON ITS OWN.
    this.svgRendererInstance.addTotalRootSvgHeight(totalBaseHeight);
    this.svgRendererInstance.applySizingToRootSvg(); // Applies a 'viewbox padding', which is why staff doesn't extend all the way to the end of the container

    // NOTE: Avoiding the use of the vs-svg-renderer-parent, in favor of indivdual group elements in root SVG element.
    this.svgRendererInstance.commitElementsToDOM(rootSvgElement);

    this.staffLayer = staffObj.staffLayer;
  };

  private renderPositionedNotes(
    positionedNotes: ScaledStaffData,
    systemStaffType: SystemStaffTypes,
    staffYOffset: number
  ) {
    const parsedStaffType = systemStaffType !== "grand" ? systemStaffType : "treble";

    positionedNotes.positionedNotes.forEach(note => {
      const xPos = note.x;
      const groupType = note.isRest ? "rest" : note.pitches.length > 1 ? "chord" : "note";

      const noteGroup = this.svgRendererInstance.createGroup(groupType);
      noteGroup.setAttribute(`data-${groupType}`, note.pitches.join(",") + note.duration);
      noteGroup.setAttribute(`data-clef`, parsedStaffType);

      noteGroup.setAttribute("transform", `translate(${xPos}, ${staffYOffset})`);

      if (note.isRest) {
        drawRest(note.duration, 0, noteGroup);
      } else {
        this.renderPitchedGroup(note, parsedStaffType, noteGroup);
      }

      this.staffLayer.appendChild(noteGroup);
    });
  };

  private renderPitchedGroup(
    note: PositionedNote,
    staffType: StaffTypes,
    noteGroup: SVGGElement
  ) {
    const noteheadGlyph = getNoteheadGlyphByDuration(note.duration);
    const noteheadWidth = noteheadGlyph.glyphWidth;

    const vsNotes: VSNoteObj[] = note.pitches.map(pitch =>
      this.convertPitchToVSNoteObj(pitch, note.duration)
    );

    // Sorts highest to lowest pitch
    sortVSNoteObjs(vsNotes);

    const offsetMap = calculateSecondIntervalCollisions(vsNotes, noteheadWidth);
    const accidentalMap = calculateAccidentalCollisions(vsNotes);

    let averageStep = 0;
    let highestY = Infinity;
    let lowestY = -Infinity;

    // Draw the notes
    vsNotes.forEach((vsNote, index) => {
      const step = getPitchStepClefDifference(vsNote.letter, vsNote.octave, staffType);
      const y = getPitchYCoordinate(step);

      averageStep += step;
      if (y < highestY) highestY = y;
      if (y > lowestY) lowestY = y;

      // Pull from the dictionaries, default to 0 if no collision/shift is needed
      const xOffset = offsetMap[index] || 0;
      const colIndex = accidentalMap[index] || 0;

      drawNotehead(note.duration, xOffset, y, noteGroup);

      drawLedgerLines({
        noteheadWidth,
        xPos: xOffset,
        rawPitchStep: step,
        group: noteGroup,
        svgRendererRef: this.svgRendererInstance
      });

      if (vsNote.accidental) {
        const accidentalGlyph = getAccidentalGlyph(vsNote.accidental);

        const baseX = -(accidentalGlyph.glyphWidth + ACCIDENTAL_X_OFFSET);
        const columnShift = colIndex * (accidentalGlyph.glyphWidth + ACCIDENTAL_X_OFFSET);

        drawAccidental(vsNote.accidental, baseX - columnShift, y, noteGroup);
      }
    });

    // Stem / Flag drawing
    if (note.duration !== "w") {
      const avgStep = averageStep / vsNotes.length;
      const isStemDown = avgStep < 4;

      let stemX: number, stemStartY: number, stemEndY: number;

      if (isStemDown) {
        stemX = LEDGER_LINE_X_OFFSET;
        stemStartY = highestY;
        stemEndY = lowestY + NOTE_STEM_LENGTH;
      } else {
        stemX = noteheadWidth - LEDGER_LINE_X_OFFSET;
        stemStartY = lowestY;
        stemEndY = highestY - NOTE_STEM_LENGTH;
      }

      drawStem({
        startY: stemStartY,
        endY: stemEndY,
        xPos: stemX,
        group: noteGroup,
        svgRendererRef: this.svgRendererInstance
      });

      if (note.duration === "e" || note.duration === "s") {
        drawFlag({
          duration: note.duration,
          isStemDown,
          xPos: stemX,
          yPos: stemEndY,
          group: noteGroup
        });
      }
    }
  }

  private convertPitchToVSNoteObj(pitchStr: string, duration: NoteDurations): VSNoteObj {
    const letter = pitchStr.charAt(0).toUpperCase();
    const octave = parseInt(pitchStr.slice(-1), 10);

    const accidentalSlice = pitchStr.slice(1, -1);
    const accidental = accidentalSlice.length > 0 ? accidentalSlice : undefined;

    return {
      letter,
      octave,
      accidental,
      duration
    };
  }

  testMethod(trebleMeasures: string[], bassMeasures: string[] = []) {
    const systemLayout = this.scoreFormatterInstance.formatSystem(trebleMeasures, bassMeasures, this.systemStaffType);

    const trebleStaffHeight = (STAFF_LINE_COUNT - 1) * STAFF_LINE_SPACING;
    const bassStaffY = trebleStaffHeight + GRAND_STAFF_SPACING;

    systemLayout.measures.forEach(measure => {
      measure.staves.forEach(staff => {
        const yOffset = staff.clef === "bass" ? bassStaffY : 0;
        this.renderPositionedNotes(staff.notesData, staff.clef, yOffset);
      });

      drawBarLine(this.svgRendererInstance, this.staffLayer, this.systemStaffType, measure.barlineX);
    });
  };

  destroy() {
    this.svgRendererInstance.destroy();
  }
}