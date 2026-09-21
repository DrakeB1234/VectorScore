import { getAccidentalGlyph, getFlagGlyph, getNoteheadGlyphByDuration } from "../glyphs";
import { convertPitchStepToYPos, getLedgerLineYCoords, getPitchStepClefDifference, type VSNoteObj } from "../helpers/_noteHelpers";
import type { ClefTypes } from "../types";
import type SVGRenderer from "./SVGRenderer";

const ACCIDENTAL_X_OFFSET = 3;
const STANDARD_STEM_STEPS = 7;
const MIDDLE_LINE_STEP = 4;
const STEM_X_OFFSET = 0.5;
const LEDGER_LINE_PADDING = 3;
const FLAG_Y_OFFSET = 3;
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
          y: stemEndY + FLAG_Y_OFFSET
        });
      } else {
        this.svgRendererInstance.drawGlyph(def.name, noteGroup, {
          x: noteHeadDef.glyphWidth - FLAG_X_OFFSET,
          y: stemEndY - FLAG_Y_OFFSET
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
  }
}