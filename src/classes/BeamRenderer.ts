import type SVGRenderer from "./SVGRenderer";
import type NoteRenderer from "./NoteRenderer";
import type { ClefTypes } from "../types";
import { convertPitchStepToYPos, getPitchStepClefDifference, getStemSteps, MIDDLE_LINE_STEP, type BeamableConfig, type NoteDurations } from "../helpers/noteHelpers";
import { getNoteheadGlyphByDuration } from "../glyphs";
import { STAFF_LINE_SPACING } from "../helpers/staffHelpers";

const BEAM_INTERNAL_SPACING = 6;
const STEM_X_OFFSET = 0.5;
const BEAM_THICKNESS = 5; // Standard beam thickness is usually around half a staff space
const BEAM_SPACING = BEAM_THICKNESS + 2; // Vertical space between stacked beams
const STUB_LENGTH = 10; // Length of a fractional (IE single 16th note in beam) beam stub
const MAX_BEAM_SLOPE_ANGLE = 0.15;

type BeamDuration = "e" | "s" | "t";

type StemCoord = {
  x: number;
  startY: number; // Notehead end of the stem
  endY: number; // Minimum stem end: the beam must sit at or beyond this
  duration: BeamDuration;
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
    let notesAbove = 0;
    let notesBelow = 0;

    configs.forEach(config => {
      if (config.type === "note") {
        const step = getPitchStepClefDifference(config.note.letter, config.note.octave, clef);
        if (step < MIDDLE_LINE_STEP) notesAbove++;
        else if (step > MIDDLE_LINE_STEP) notesBelow++;
      } else if (config.type === "chord") {
        config.notes.forEach(n => {
          const step = getPitchStepClefDifference(n.letter, n.octave, clef);
          if (step < MIDDLE_LINE_STEP) notesAbove++;
          else if (step > MIDDLE_LINE_STEP) notesBelow++;
        });
      }
    });

    // If tied, default to stem down
    return notesAbove > notesBelow;
  }

  private resolveDuration(duration: NoteDurations): BeamDuration {
    if (duration === "w" || duration === "h" || duration === "q") return "e"
    return duration;
  };

  private snapBeamToStaffLine(line: BeamLine, isStemDown: boolean): BeamLine {
    const centerShift = isStemDown ? -BEAM_THICKNESS / 2 : BEAM_THICKNESS / 2;
    const centerY = line.y0 + centerShift;

    // Round the centerline to the next staff line further from the noteheads
    const snappedCenterY = (isStemDown ? Math.ceil(centerY / STAFF_LINE_SPACING) : Math.floor(centerY / STAFF_LINE_SPACING)) * STAFF_LINE_SPACING;

    return { ...line, y0: snappedCenterY - centerShift };
  }

  private computeBeamSlope(stems: StemCoord[]): number {
    if (stems.length < 2) return 0;

    const first = stems[0];
    const last = stems[stems.length - 1];
    const dx = last.x - first.x;
    if (dx === 0) return 0;

    const lo = Math.min(first.startY, last.startY);
    const hi = Math.max(first.startY, last.startY);
    const hasPeak = stems.slice(1, -1).some(s => s.startY < lo || s.startY > hi);
    if (hasPeak) return 0;

    const rawSlope = (last.startY - first.startY) / dx;
    return Math.max(-MAX_BEAM_SLOPE_ANGLE, Math.min(MAX_BEAM_SLOPE_ANGLE, rawSlope));
  };

  private computeBeamLine(stems: StemCoord[], isStemDown: boolean): BeamLine {
    if (stems.length === 0) return { x0: 0, y0: 0, slope: 0 };

    const x0 = stems[0].x;
    const slope = this.computeBeamSlope(stems);

    // The y0 each stem would require of the line, given the slope
    const requiredY0s = stems.map(s => s.endY - slope * (s.x - x0));
    const y0 = isStemDown ? Math.max(...requiredY0s) : Math.min(...requiredY0s);

    return this.snapBeamToStaffLine({ x0, y0, slope }, isStemDown);
  }

  public drawBeamGroup(configs: BeamableConfig[], clef: ClefTypes, beamGroup: SVGGElement) {
    let internalCursorX = 0;

    // Calculate the unified stem direction for the whole group
    const isStemDown = this.getGroupStemDirection(configs, clef);

    const stemCoordinates: StemCoord[] = [];

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

      } else if (config.type === "chord") {

        const steps = config.notes.map(n => getPitchStepClefDifference(n.letter, n.octave, clef));
        highStep = Math.min(...steps);
        lowStep = Math.max(...steps);

        const result = this.noteRendererInstance.drawChord(config.notes, resolvedDuration, config.isDotted, clef, wrapperGroup, { skipStem: true });
        entryWidth = result.fullWidth;
        originXOffset = result.originXOffset;
      }

      wrapperGroup.setAttribute("transform", `translate(${internalCursorX + originXOffset}, 0)`);
      beamGroup.appendChild(wrapperGroup);

      const noteHeadWidth = getNoteheadGlyphByDuration(duration).glyphWidth;
      const localStemX = isStemDown ? STEM_X_OFFSET : noteHeadWidth - STEM_X_OFFSET;

      // Absolute X position within the beam group
      const absoluteStemX = internalCursorX + originXOffset + localStemX;

      // Determine where the stem starts (at the notehead)
      const { startStep, endStep } = getStemSteps(highStep, lowStep, isStemDown, duration);

      stemCoordinates.push({
        x: absoluteStemX,
        startY: convertPitchStepToYPos(startStep),
        endY: convertPitchStepToYPos(endStep),
        duration: resolvedDuration
      });

      internalCursorX += entryWidth + BEAM_INTERNAL_SPACING;
    });

    // Build the beam line, then draw stems and beams against it
    const beamLine = this.computeBeamLine(stemCoordinates, isStemDown);

    this.drawStems(stemCoordinates, beamLine, beamGroup);
    this.drawBeams(stemCoordinates, beamLine, isStemDown, beamGroup);

    return {
      fullWidth: internalCursorX - BEAM_INTERNAL_SPACING,
      originXOffset: 0
    };
  }

  // Draws each precalculated stem from drawBeamGroup
  private drawStems(stems: StemCoord[], beamLine: BeamLine, group: SVGGElement) {
    stems.forEach(stem => {
      this.svgRendererInstance.drawLine(stem.x, stem.startY, stem.x, yAt(beamLine, stem.x), group);
    });
  }

  private drawBeams(stems: StemCoord[], beamLine: BeamLine, isStemDown: boolean, group: SVGGElement) {
    if (stems.length === 0) return;

    // Determine the maximum number of beams needed in this whole group
    const maxBeams = Math.max(...stems.map(s => BEAM_COUNTS[s.duration]));

    // Loop through each beam level (0 = 8th, 1 = 16th, 2 = 32nd)
    for (let level = 0; level < maxBeams; level++) {

      // Secondary beams stack "inward" toward the noteheads
      const levelShift = isStemDown ? -(level * BEAM_SPACING) : (level * BEAM_SPACING);
      const beamY = (x: number) => yAt(beamLine, x) + levelShift;

      for (let i = 0; i < stems.length; i++) {
        // Does this specific note require a beam at this level?
        if (BEAM_COUNTS[stems[i].duration] > level) {

          const nextI = i + 1;

          // Does the NEXT note also require this beam level?
          if (nextI < stems.length && BEAM_COUNTS[stems[nextI].duration] > level) {
            // Draw a continuous beam to the next note
            const line = this.svgRendererInstance.drawLine(stems[i].x, beamY(stems[i].x), stems[nextI].x, beamY(stems[nextI].x), group, {
              strokeWidth: BEAM_THICKNESS
            });
            const beamOffset = isStemDown ? -(BEAM_THICKNESS / 2) : (BEAM_THICKNESS / 2);
            line.setAttribute("transform", `translate(0, ${beamOffset})`);
          }
          // If not, and it doesn't connect backwards either, it's a fractional stub!
          else if (level > 0 && (i === 0 || BEAM_COUNTS[stems[i - 1].duration] <= level)) {

            // Stubs point inward. If it's the first note, it points right (+). Otherwise, left (-).
            const directionMultiplier = i === 0 ? 1 : -1;
            const stubEndX = stems[i].x + (STUB_LENGTH * directionMultiplier);

            const stub = this.svgRendererInstance.drawLine(stems[i].x, beamY(stems[i].x), stubEndX, beamY(stubEndX), group, {
              strokeWidth: BEAM_THICKNESS
            });
            const beamOffset = isStemDown ? -(BEAM_THICKNESS / 2) : (BEAM_THICKNESS / 2);
            stub.setAttribute("transform", `translate(0, ${beamOffset})`);
          }
        }
      }
    }
  }
}