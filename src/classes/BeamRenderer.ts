import type SVGRenderer from "./SVGRenderer";
import type NoteRenderer from "./NoteRenderer";
import type { ClefTypes } from "../types";
import { convertPitchStepToYPos, getPitchStepClefDifference, getStemSteps, MIDDLE_LINE_STEP, type BeamableConfig, type NoteDurations } from "../helpers/noteHelpers";
import { getNoteheadGlyphByDuration } from "../glyphs";
import { STAFF_LINE_SPACING, STAFF_LINE_SPACING_HALVED } from "../helpers/staffHelpers";

const BEAM_INTERNAL_SPACING = 8;
const STEM_X_OFFSET = 0.5;
const BEAM_THICKNESS = 5; // Standard beam thickness is usually around half a staff space
const BEAM_SPACING = BEAM_THICKNESS + 2; // Vertical space between stacked beams
const STUB_LENGTH = 10; // Length of a fractional (IE single 16th note in beam) beam stub

type BeamDuration = "e" | "s" | "t";

type StemCoord = {
  x: number;
  startY: number;
  endY: number;
  duration: BeamDuration;
  noteStep: number;
};

// The primary (outermost) beam, described as a line: y = y0 + slope * (x - x0).
// A flat beam is simply slope = 0.
type BeamLine = {
  x0: number;
  y0: number;
  slope: number;
};

const yAt = (line: BeamLine, x: number) => line.y0 + line.slope * (x - line.x0);

const BEAM_COUNTS: Record<string, number> = {
  "e": 1,
  "s": 2,
  "t": 3
};

export default class BeamRenderer {
  private svgRendererInstance: SVGRenderer;
  private noteRendererInstance: NoteRenderer;

  constructor(svgRenderer: SVGRenderer, noteRenderer: NoteRenderer) {
    this.svgRendererInstance = svgRenderer;
    this.noteRendererInstance = noteRenderer;
  }

  private getGroupStemDirection(configs: BeamableConfig[], clef: ClefTypes): boolean {
    let highStep = Infinity;
    let lowStep = -Infinity;
    let notesAbove = 0;
    let notesBelow = 0;

    // Helper to capture extreme limits and majority counts in one pass
    const processStep = (step: number) => {
      highStep = Math.min(highStep, step);
      lowStep = Math.max(lowStep, step);

      if (step < MIDDLE_LINE_STEP) notesAbove++;
      else if (step > MIDDLE_LINE_STEP) notesBelow++;
    };

    configs.forEach(config => {
      if (config.type === "note") {
        const step = getPitchStepClefDifference(config.note.letter, config.note.octave, clef);
        processStep(step);
      } else if (config.type === "chord") {
        config.notes.forEach(n => {
          const step = getPitchStepClefDifference(n.letter, n.octave, clef);
          processStep(step);
        });
      }
    });

    const distHigh = Math.abs(highStep - MIDDLE_LINE_STEP);
    const distLow = Math.abs(lowStep - MIDDLE_LINE_STEP);

    // First: The note furthest from the middle line dictates the direction.
    if (distHigh > distLow) return true;  // Extreme note is high, stems go DOWN
    if (distLow > distHigh) return false; // Extreme note is low, stems go UP

    // OR: If the extreme notes are perfectly equidistant, majority rules.
    if (notesAbove !== notesBelow) return notesAbove > notesBelow;

    // Last: If still completely tied, standard engraving defaults to stem DOWN.
    return true;
  }

  private resolveDuration(duration: NoteDurations): BeamDuration {
    if (duration === "w" || duration === "h" || duration === "q") return "e"
    return duration;
  };

  private snapBeamY(y: number, isStemDown: boolean): number {
    const halfSpace = STAFF_LINE_SPACING / 2;
    const centerShift = isStemDown ? -BEAM_THICKNESS / 2 : BEAM_THICKNESS / 2;

    // Find the conceptual center of the beam in terms of pitch steps
    const centerY = y + centerShift;
    const step = centerY / halfSpace;

    const isNegative = step < 4;
    const distFromMiddle = Math.abs(step - 4);

    let snappedDist;
    if (distFromMiddle < 0.25) snappedDist = 0; // 4.0
    else if (distFromMiddle < 1.0) snappedDist = 0.5; // 3.5 or 4.5
    else {
      // Enforce whole step jumps for outer steps
      snappedDist = Math.round(distFromMiddle - 0.5) + 0.5;
    }

    const snappedStep = isNegative ? 4 - snappedDist : 4 + snappedDist;
    return (snappedStep * halfSpace) - centerShift;
  }

  /** Calculates the ideal musical slope based on set interval rules. */
  private calculateMusicalSlope(stems: StemCoord[], isStemDown: boolean, dx: number): number {
    if (dx === 0 || stems.length < 2) return 0;

    const first = stems[0].noteStep;
    const last = stems[stems.length - 1].noteStep;
    const stepDiff = last - first;
    const absDiff = Math.abs(stepDiff);

    // Flatten beam if an internal note forms a peak opposing the overall slant
    const hasPeak = stems.slice(1, -1).some(s => {
      return isStemDown ? s.noteStep > Math.max(first, last) : s.noteStep < Math.min(first, last);
    });

    if (hasPeak || absDiff === 0) return 0;

    // Map standard engraving interval sizes to discrete slants
    let slantSteps = 1.5; // Default max (5th or larger -> slant 3/4 space)
    if (absDiff === 1) slantSteps = 0.5; // 2nd interval -> slant 1/4 space
    else if (absDiff <= 3) slantSteps = 1.0; // 3rd/4th interval -> slant 1/2 space

    const slantY = slantSteps * Math.sign(stepDiff) * STAFF_LINE_SPACING_HALVED;
    return slantY / dx;
  }

  /** Snaps the beam to staff lines and pushes it outward if stems collide. */
  private validateAndSnapY0(stems: StemCoord[], x0: number, rawY0: number, slope: number, isStemDown: boolean): number {
    let snappedY0 = this.snapBeamY(rawY0, isStemDown);

    const pushIncrement = STAFF_LINE_SPACING / 4;
    const pushDir = isStemDown ? pushIncrement : -pushIncrement;

    // Helper checks if ALL stems safely clear the beam line at the current y0
    const stemsAreValid = (y0: number) => stems.every(s => {
      const beamY = y0 + slope * (s.x - x0);
      return isStemDown ? beamY >= s.endY - 0.01 : beamY <= s.endY + 0.01;
    });

    // If the snapped line clipped a stem, push outward and try the next valid snap
    while (!stemsAreValid(snappedY0)) {
      rawY0 += pushDir;
      snappedY0 = this.snapBeamY(rawY0, isStemDown);
    }

    return snappedY0;
  }

  private computeBeamLine(stems: StemCoord[], isStemDown: boolean): BeamLine {
    if (stems.length === 0) return { x0: 0, y0: 0, slope: 0 };

    const x0 = stems[0].x;
    const dx = stems[stems.length - 1].x - x0;

    // First: Get the ideal musical slope
    const slope = this.calculateMusicalSlope(stems, isStemDown, dx);

    // Next: Find the baseline Y (where the beam just touches the shortest stem)
    const requiredY0s = stems.map(s => s.endY - slope * (s.x - x0));
    const rawY0 = isStemDown ? Math.max(...requiredY0s) : Math.min(...requiredY0s);

    // Next: Apply staff snapping and collision resolutions
    const finalY0 = this.validateAndSnapY0(stems, x0, rawY0, slope, isStemDown);

    return { x0, y0: finalY0, slope };
  }

  public drawBeamGroup(configs: BeamableConfig[], clef: ClefTypes, beamGroup: SVGGElement) {
    let internalCursorX = 0;

    // Calculate the unified stem direction for the whole group
    const isStemDown = this.getGroupStemDirection(configs, clef);

    const stemCoordinates: StemCoord[] = [];
    let yPosArray: number[] = [];

    // Loop through and draw the noteheads (skipping stems)
    configs.forEach(config => {

      let entryWidth = 0;
      let originXOffset = 0;

      // We need these to calculate where the stem attaches
      let highStep = Infinity;
      let lowStep = -Infinity;
      const duration = config.type === "note" ? config.note.duration : config.duration;
      const resolvedDuration = this.resolveDuration(duration);

      const wrapperGroup = this.svgRendererInstance.createGroup(config.type);

      if (config.type === "note") {
        const step = getPitchStepClefDifference(config.note.letter, config.note.octave, clef);
        highStep = step;
        lowStep = step;

        const result = this.noteRendererInstance.drawNote(config.note, clef, wrapperGroup, { skipStem: true });
        entryWidth = result.fullWidth;
        originXOffset = result.originXOffset;
        yPosArray.push(result.yPos);

      } else if (config.type === "chord") {

        const steps = config.notes.map(n => getPitchStepClefDifference(n.letter, n.octave, clef));
        highStep = Math.min(...steps);
        lowStep = Math.max(...steps);

        const result = this.noteRendererInstance.drawChord(config.notes, resolvedDuration, config.isDotted, clef, wrapperGroup, { skipStem: true });
        entryWidth = result.fullWidth;
        originXOffset = result.originXOffset;
        yPosArray.push(result.yPosArray[isStemDown ? -1 : 0]);
      }

      wrapperGroup.setAttribute("transform", `translate(${internalCursorX + originXOffset}, 0)`);
      beamGroup.appendChild(wrapperGroup);

      const noteHeadWidth = getNoteheadGlyphByDuration(duration).glyphWidth;
      const localStemX = isStemDown ? STEM_X_OFFSET : noteHeadWidth - STEM_X_OFFSET;

      // Absolute X position within the beam group
      const absoluteStemX = internalCursorX + originXOffset + localStemX;

      // Determine where the stem starts (at the notehead)
      const { startStep, endStep } = getStemSteps(highStep, lowStep, isStemDown, duration, 6);

      stemCoordinates.push({
        x: absoluteStemX,
        startY: convertPitchStepToYPos(startStep),
        endY: convertPitchStepToYPos(endStep),
        duration: resolvedDuration,
        noteStep: isStemDown ? Math.max(highStep, lowStep) : Math.min(highStep, lowStep)
      });

      internalCursorX += entryWidth + BEAM_INTERNAL_SPACING;
    });

    // Build the beam line, then draw stems and beams against it
    const beamLine = this.computeBeamLine(stemCoordinates, isStemDown);

    this.drawStems(stemCoordinates, beamLine, beamGroup);
    this.drawBeams(stemCoordinates, beamLine, isStemDown, beamGroup);

    return {
      fullWidth: internalCursorX - BEAM_INTERNAL_SPACING,
      originXOffset: 0,
      yPosArray
    };
  }

  // Draws each precalculated stem from drawBeamGroup
  private drawStems(stems: StemCoord[], beamLine: BeamLine, group: SVGGElement) {
    stems.forEach(stem => {
      this.svgRendererInstance.drawLine(stem.x, stem.startY, stem.x, yAt(beamLine, stem.x), group);
    });
  }

  private drawBeamSegment(x1: number, y1: number, x2: number, y2: number, isStemDown: boolean, group: SVGGElement) {
    const inwardThickValue = isStemDown ? -BEAM_THICKNESS : BEAM_THICKNESS;

    this.svgRendererInstance.drawPolygon([
      [x1, y1],
      [x2, y2],
      [x2, y2 + inwardThickValue],
      [x1, y1 + inwardThickValue]
    ], group);
  }

  private drawBeams(stems: StemCoord[], beamLine: BeamLine, isStemDown: boolean, group: SVGGElement) {
    if (stems.length === 0) return;

    const maxBeams = Math.max(...stems.map(s => BEAM_COUNTS[s.duration]));

    // Loop through each beam level (8ths, 16ths, 32nds)
    for (let level = 0; level < maxBeams; level++) {

      // Secondary beams stack "inward" toward the noteheads
      const levelShift = isStemDown ? -(level * BEAM_SPACING) : (level * BEAM_SPACING);
      const beamY = (x: number) => yAt(beamLine, x) + levelShift;

      for (let i = 0; i < stems.length; i++) {
        // Does this specific note require a beam at this level?
        if (BEAM_COUNTS[stems[i].duration] <= level) continue;

        const nextI = i + 1;

        // Does the next note also require this beam level? Then draw a continuous beam to it
        if (nextI < stems.length && BEAM_COUNTS[stems[nextI].duration] > level) {
          const x1 = stems[i].x;
          const x2 = stems[nextI].x;
          this.drawBeamSegment(x1, beamY(x1), x2, beamY(x2), isStemDown, group);
        }
        // If not, and it doesn't connect backwards either, it's a fractional stub!
        else if (level > 0 && (i === 0 || BEAM_COUNTS[stems[i - 1].duration] <= level)) {

          // Stubs point inward. If it's the first note, it points right (+). Otherwise, left (-).
          const directionMultiplier = i === 0 ? 1 : -1;
          const x1 = stems[i].x;
          const x2 = x1 + (STUB_LENGTH * directionMultiplier);
          this.drawBeamSegment(x1, beamY(x1), x2, beamY(x2), isStemDown, group);
        }
      }
    }
  }
}