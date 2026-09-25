import { getAccidentalGlyph, getFlagGlyph, getNoteheadGlyphByDuration } from "../glyphs";
import { applySecondIntervalOffsets, convertPitchStepToYPos, getChordStemDirection, getChordLedgerLineSpans, getLedgerLineYCoords, getPitchStepClefDifference, getPitchStepRange, getStemSteps, MIDDLE_LINE_STEP, type LedgerLineSpan, type NoteDurations, type PositionedChordNote, type VSChordNoteObj, type VSNoteObj, assignAccidentalColumns, SECOND_INTERVAL_X_OFFSET } from "../helpers/_noteHelpers";
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
const ACCIDENTAL_COLUMN_GAP = 3;

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

  private drawChordAccidentals(notes: PositionedChordNote[], group: SVGGElement): number {
    const placements = assignAccidentalColumns(notes);
    if (placements.length === 0) return 0;

    const accidentals = placements.map(placement => ({
      ...placement,
      def: getAccidentalGlyph(placement.accidental)
    }));

    // Each column is as wide as its widest accidental
    const columnWidths: number[] = [];
    accidentals.forEach(({ column, def }) => {
      columnWidths[column] = Math.max(columnWidths[column] ?? 0, def.glyphWidth);
    });

    // Column 0 sits just left of the leftmost notehead (which includes second interval notes shifted left).
    // Each following column sits to the left of the previous one (into negative space of group).
    let columnRightEdge = Math.min(...notes.map(n => n.xOffset)) - ACCIDENTAL_X_OFFSET;
    const columnRightEdges = columnWidths.map(width => {
      const rightEdge = columnRightEdge;
      columnRightEdge -= width + ACCIDENTAL_COLUMN_GAP;
      return rightEdge;
    });

    // Right aligned within the column, so every accidental sits equally close to the noteheads
    accidentals.forEach(({ column, yPos, def }) => {
      this.svgRendererInstance.drawGlyph(def.name, group, {
        x: columnRightEdges[column] - def.glyphWidth,
        y: yPos
      });
    });

    // Returns the leftmost X coord (will be higher the more accidentals are drawn)
    const lastColumn = columnWidths.length - 1;
    return columnRightEdges[lastColumn] - columnWidths[lastColumn];
  };

  /** 
   * @returns {number} fullWidth: Full bounding box width of the all drawn glyphs in group
   * @returns {number} originXOffset: Amount of space drawn into negative space (below x:0 in group)
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
    let accidentalMinX = 0;
    if (noteObj.accidental) {
      const def = getAccidentalGlyph(noteObj.accidental);
      accidentalMinX = -(def.glyphWidth + ACCIDENTAL_X_OFFSET);

      this.svgRendererInstance.drawGlyph(def.name, noteGroup, {
        y: noteYPos,
        x: -(def.glyphWidth + ACCIDENTAL_X_OFFSET)
      });
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

    // Get bounding box width to return to caller
    const hasLedgers = ledgerYCoords.length > 0;
    const ledgerMinX = hasLedgers ? -LEDGER_LINE_PADDING : 0;
    const ledgerMaxX = noteHeadDef.glyphWidth + (hasLedgers ? LEDGER_LINE_PADDING : 0);

    // The leftmost point is either the ledger line or the accidental, whichever takes more space
    const minX = Math.min(ledgerMinX, accidentalMinX);
    const maxX = ledgerMaxX;

    return {
      fullWidth: maxX - minX,
      originXOffset: Math.abs(minX)
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

    // Draw accidentals, returns the leftmost coord of the accidentals
    const accidentalMinX = this.drawChordAccidentals(positionedNoteObjs, chordGroup);

    // Bounding box math for caller
    // Noteheads can be shifted negative (left) due to 2nd intervals (which is determined by the notes set X offset)
    const noteMinX = Math.min(...positionedNoteObjs.map(n => n.xOffset));
    const noteMaxX = Math.max(...positionedNoteObjs.map(n => n.xOffset)) + noteHeadDef.glyphWidth;

    // Caculate padding for the ledger line
    // EDGE CASE: First ledger line for second intervals DOES NOT FULLY EXTENT, accounted for in this block
    let ledgerMinX = noteMinX;
    let ledgerMaxX = noteMaxX;

    if (ledgerLineSpans.length > 0) {
      const spanMinX = Math.min(...ledgerLineSpans.map(s => s.minX));
      const spanMaxX = Math.max(...ledgerLineSpans.map(s => s.maxX));

      ledgerMinX = spanMinX - LEDGER_LINE_PADDING;
      ledgerMaxX = spanMaxX + LEDGER_LINE_PADDING;
    }

    const minX = Math.min(noteMinX, ledgerMinX, accidentalMinX);
    const maxX = Math.max(noteMaxX, ledgerMaxX);

    return {
      fullWidth: maxX - minX,
      originXOffset: Math.abs(minX)
    };
  }
}