import { getAccidentalGlyph, getFlagGlyph, getNoteheadGlyphByDuration } from "../glyphs";
import { applySecondIntervalOffsets, convertPitchStepToYPos, getChordStemDirection, getChordLedgerLineSpans, getLedgerLineYCoords, getPitchStepClefDifference, getPitchStepRange, getStemSteps, MIDDLE_LINE_STEP, type LedgerLineSpan, type NoteDurations, type PositionedChordNote, type VSChordNoteObj, type VSNoteObj } from "../helpers/_noteHelpers";
import type { ClefTypes } from "../types";
import type SVGRenderer from "./SVGRenderer";

type StemOptions = {
  duration: NoteDurations;
  isStemDown: boolean;
  highStep: number;
  lowStep: number;
  noteHeadWidth: number;
};

const ACCIDENTAL_X_OFFSET = 3;
const STEM_X_OFFSET = 0.5;
const LEDGER_LINE_PADDING = 3;
const FLAG_X_OFFSET = 1;

export default class NoteRenderer {
  private svgRendererInstance: SVGRenderer;

  constructor(svgRenderer: SVGRenderer) {
    this.svgRendererInstance = svgRenderer;
  };

  private drawStemAndFlag(group: SVGGElement, { duration, isStemDown, highStep, lowStep, noteHeadWidth }: StemOptions) {
    if (duration === "w") return;

    const stemX = isStemDown ? STEM_X_OFFSET : noteHeadWidth - STEM_X_OFFSET;
    const { startStep, endStep } = getStemSteps(highStep, lowStep, isStemDown);
    const stemStartY = convertPitchStepToYPos(startStep);
    const stemEndY = convertPitchStepToYPos(endStep);

    this.svgRendererInstance.drawLine(stemX, stemStartY, stemX, stemEndY, group);

    if (duration === "e" || duration === "s") {
      const flagDef = getFlagGlyph(duration, isStemDown);

      this.svgRendererInstance.drawGlyph(flagDef.name, group, {
        x: isStemDown ? 0 : noteHeadWidth - FLAG_X_OFFSET,
        y: stemEndY
      });
    };
  };

  private drawChordLedgerLines(spans: LedgerLineSpan[], group: SVGGElement) {
    spans.forEach(({ y, minX, maxX }) => {
      this.svgRendererInstance.drawLine(
        minX - LEDGER_LINE_PADDING,
        y,
        maxX + LEDGER_LINE_PADDING,
        y,
        group
      );
    });
  };

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

    // Draw note stem and flag (if applicable)
    this.drawStemAndFlag(noteGroup, {
      duration: noteObj.duration,
      isStemDown: notePitchStep <= MIDDLE_LINE_STEP,
      highStep: notePitchStep,
      lowStep: notePitchStep,
      noteHeadWidth: noteHeadDef.glyphWidth
    });

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

    // Get Y pos for each note and sorted from lowest to highest
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

    // Draw chord stem and flag (if applicable)
    const { highStep, lowStep } = getPitchStepRange(positionedNoteObjs);
    this.drawStemAndFlag(chordGroup, {
      duration,
      isStemDown,
      highStep,
      lowStep,
      noteHeadWidth: noteHeadDef.glyphWidth
    });

    // Draw ledger lines
    const ledgerLineSpans = getChordLedgerLineSpans(positionedNoteObjs, noteHeadDef.glyphWidth);
    this.drawChordLedgerLines(ledgerLineSpans, chordGroup);

    return {
      totalWidth: noteHeadDef.glyphWidth,
      accidentalWidth: 0 // Placeholder until accidental stacking logic is added
    };
  }
}