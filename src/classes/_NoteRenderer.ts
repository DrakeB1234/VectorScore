import { getAccidentalGlyph, getFlagGlyph, getNoteheadGlyphByDuration, type GlyphDef } from "../glyphs";
import { applySecondIntervalOffsets, convertPitchStepToYPos, getChordStemDirection, getLedgerLineYCoords, getPitchStepClefDifference, isSecondInterval, MIDDLE_LINE_STEP, type NoteDurations, type PositionedChordNote, type VSChordNoteObj, type VSNoteObj } from "../helpers/_noteHelpers";
import type { ClefTypes } from "../types";
import type SVGRenderer from "./SVGRenderer";

const ACCIDENTAL_X_OFFSET = 3;
const STANDARD_STEM_STEPS = 7;
const STEM_X_OFFSET = 0.5;
const LEDGER_LINE_PADDING = 3;
const FLAG_X_OFFSET = 1;

export default class NoteRenderer {
  private svgRendererInstance: SVGRenderer;

  constructor(svgRenderer: SVGRenderer) {
    this.svgRendererInstance = svgRenderer;
  }

  /** 
   * @returns {number} noteHeadWidth
   * @returns {number} accidentalWidth: Width of the glpyh + the accidental x offset 
  */
  public drawNote(noteObj: VSNoteObj, clef: ClefTypes, noteGroup: SVGGElement) {

    const notePitchStep = getPitchStepClefDifference(noteObj.letter, noteObj.octave, clef);
    const noteYPos = convertPitchStepToYPos(notePitchStep);

    // Render notehead
    const noteHeadDef = getNoteheadGlyphByDuration(noteObj.duration);
    this.svgRendererInstance.drawGlyph(noteHeadDef.name, noteGroup, {
      y: noteYPos
    });

    // Render accidental
    let accidentalWidth = 0;
    if (noteObj.accidental) {
      const def = getAccidentalGlyph(noteObj.accidental);
      this.svgRendererInstance.drawGlyph(def.name, noteGroup, {
        y: noteYPos,
        x: -(def.glyphWidth + ACCIDENTAL_X_OFFSET)
      });
      accidentalWidth = def.glyphWidth + ACCIDENTAL_X_OFFSET;
    };

    const isStemDown = notePitchStep <= 4;
    let stemX = 0;
    let stemEndY = 0;

    // Render stem, will draw to middle line if note is greater than +-1 ledger line below staff
    if (noteObj.duration !== "w") {
      let stemStartY: number;

      if (isStemDown) {
        stemX = STEM_X_OFFSET;
        stemStartY = noteYPos;

        const targetTipStep = Math.max(notePitchStep + STANDARD_STEM_STEPS, MIDDLE_LINE_STEP);
        stemEndY = convertPitchStepToYPos(targetTipStep);
      } else {
        stemX = noteHeadDef.glyphWidth - STEM_X_OFFSET;
        stemStartY = noteYPos;

        const targetTipStep = Math.min(notePitchStep - STANDARD_STEM_STEPS, MIDDLE_LINE_STEP);
        stemEndY = convertPitchStepToYPos(targetTipStep);
      };

      this.svgRendererInstance.drawLine(stemX, stemStartY, stemX, stemEndY, noteGroup);
    };

    // Render flag
    if (noteObj.duration === "e" || noteObj.duration === "s") {
      const def = getFlagGlyph(noteObj.duration, isStemDown);

      if (isStemDown) {
        this.svgRendererInstance.drawGlyph(def.name, noteGroup, {
          x: 0,
          y: stemEndY
        });
      } else {
        this.svgRendererInstance.drawGlyph(def.name, noteGroup, {
          x: noteHeadDef.glyphWidth - FLAG_X_OFFSET,
          y: stemEndY
        });
      };
    };

    // Render ledger lines
    const ledgerYCoords = getLedgerLineYCoords(notePitchStep);
    ledgerYCoords.forEach(ledgerY => {
      this.svgRendererInstance.drawLine(
        -LEDGER_LINE_PADDING,
        ledgerY,
        noteHeadDef.glyphWidth + LEDGER_LINE_PADDING,
        ledgerY,
        noteGroup
      );
    });

    return {
      noteHeadWidth: noteHeadDef.glyphWidth,
      accidentalWidth
    };
  };

  public drawChord(noteObjs: VSChordNoteObj[], duration: NoteDurations, clef: ClefTypes, chordGroup: SVGGElement) {

    // Pre calculate values for each note in chord
    const positionedNoteObjs: PositionedChordNote[] = noteObjs.map(noteObj => {
      const pitchStep = getPitchStepClefDifference(noteObj.letter, noteObj.octave, clef);
      return {
        noteObj,
        pitchStep,
        yPos: convertPitchStepToYPos(pitchStep),
        xOffset: 0
      };
    }).sort((a, b) => b.pitchStep - a.pitchStep);

    const noteHeadDef = getNoteheadGlyphByDuration(duration);

    // Get chord stem direction. If tied, standard is usually down.
    const isStemDown = getChordStemDirection(positionedNoteObjs);

    // Applying any second interval x offsets
    applySecondIntervalOffsets(positionedNoteObjs, isStemDown, noteHeadDef.glyphWidth);

    // Render noteheads
    positionedNoteObjs.forEach(posNoteObj => {
      this.svgRendererInstance.drawGlyph(noteHeadDef.name, chordGroup, {
        y: posNoteObj.yPos,
        x: posNoteObj.xOffset
      });
    });

    // Draw unifed chord stem
    if (duration !== "w") {
      const minStep = Math.min(...positionedNoteObjs.map(n => n.pitchStep));
      const maxStep = Math.max(...positionedNoteObjs.map(n => n.pitchStep));

      const minY = convertPitchStepToYPos(minStep);
      const maxY = convertPitchStepToYPos(maxStep);

      let stemX = 0;
      let stemStartY = 0;
      let stemEndY = 0;

      if (isStemDown) {
        stemX = STEM_X_OFFSET;
        stemStartY = minY; // Starts at the top note

        // Target is the bottom note + standard length, or the middle line
        const targetTipStep = Math.max(maxStep + STANDARD_STEM_STEPS, MIDDLE_LINE_STEP);
        stemEndY = convertPitchStepToYPos(targetTipStep);
      } else {
        stemX = noteHeadDef.glyphWidth - STEM_X_OFFSET;
        stemStartY = maxY;

        const targetTipStep = Math.min(minStep - STANDARD_STEM_STEPS, MIDDLE_LINE_STEP);
        stemEndY = convertPitchStepToYPos(targetTipStep);
      };
      this.svgRendererInstance.drawLine(stemX, stemStartY, stemX, stemEndY, chordGroup);

      // Draw flags attached to the end of the stem
      if (duration === "e" || duration === "s") {
        const flagDef = getFlagGlyph(duration, isStemDown);

        if (isStemDown) {
          this.svgRendererInstance.drawGlyph(flagDef.name, chordGroup, { x: 0, y: stemEndY });
        } else {
          this.svgRendererInstance.drawGlyph(flagDef.name, chordGroup, {
            x: noteHeadDef.glyphWidth - FLAG_X_OFFSET,
            y: stemEndY
          });
        }
      };
    }

    // Draw unified ledger lines
    // Maps a Y pos to the min and max X pos required at that level
    // First level of note DOES NOT extend fully across potential second intervals
    const ledgerMap = new Map<number, { minX: number, maxX: number }>();

    positionedNoteObjs.forEach(n => {
      const noteMinX = n.xOffset;
      const noteMaxX = n.xOffset + noteHeadDef.glyphWidth;

      getLedgerLineYCoords(n.pitchStep).forEach(y => {
        if (ledgerMap.has(y)) {
          const bounds = ledgerMap.get(y);
          if (!bounds) return;
          bounds.minX = Math.min(bounds.minX, noteMinX);
          bounds.maxX = Math.max(bounds.maxX, noteMaxX);
        } else {
          ledgerMap.set(y, { minX: noteMinX, maxX: noteMaxX });
        }
      });
    });

    ledgerMap.forEach((bounds, ledgerY) => {
      this.svgRendererInstance.drawLine(
        bounds.minX - LEDGER_LINE_PADDING,
        ledgerY,
        bounds.maxX + LEDGER_LINE_PADDING,
        ledgerY,
        chordGroup
      );
    });

    return {
      totalWidth: noteHeadDef.glyphWidth,
      accidentalWidth: 0 // Placeholder until accidental stacking logic is added
    };
  }
}