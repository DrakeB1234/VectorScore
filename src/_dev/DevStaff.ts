import type { GlyphNames } from "../glyphs";
import SVGRenderer from "../classes/SVGRenderer";
import { BARLINE_MEASURE_PADDING, drawBarLine, drawStaff, GRAND_STAFF_SPACING, type StaffTypes } from "./devStaffHelpers";
import { calculateMeasureSpacing, renderPositionedNotes, measureInputNotesParser, scaleMeasureSpacing } from "./devNoteHelpers";
import { STAFF_LINE_COUNT, STAFF_LINE_SPACING } from "../constants";

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

export default class DevStaff {
  private svgRendererInstance: SVGRenderer;
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
  }

  testMethod(measureNoteInput: string) {
    const startX = 100;
    const targetMeasureWidth = this.options.width - startX - BARLINE_MEASURE_PADDING;

    // --- STEP 1: PARSE AND GET RAW WIDTHS ---
    const parsedStaffNotes = measureInputNotesParser(measureNoteInput);
    const rawStaffObj = calculateMeasureSpacing(parsedStaffNotes);

    let rawBassObj = null;
    let maxRawWidth = rawStaffObj.rawWidth;

    if (this.systemStaffType === "grand") {
      const parsedBassNotes = measureInputNotesParser("C3q [Eb3,G3]q [Eb3,G3]q");
      rawBassObj = calculateMeasureSpacing(parsedBassNotes);

      // Find the widest staff so they scale together proportionately
      maxRawWidth = Math.max(rawStaffObj.rawWidth, rawBassObj.rawWidth);
    };

    // --- STEP 2: CALCULATE UNIFIED SCALE RATIO ---
    const scaleRatio = targetMeasureWidth / maxRawWidth;

    // --- STEP 3: SCALE AND RENDER ---
    const justifiedStaffObj = scaleMeasureSpacing(rawStaffObj, startX, scaleRatio);
    const staffElements = renderPositionedNotes(justifiedStaffObj, this.systemStaffType, 0, this.svgRendererInstance);
    this.svgRendererInstance.commitElementsToDOM(staffElements, this.staffLayer);

    if (this.systemStaffType === "grand" && rawBassObj) {
      const justifiedBassObj = scaleMeasureSpacing(rawBassObj, startX, scaleRatio);

      const trebleStaffHeight = (STAFF_LINE_COUNT - 1) * STAFF_LINE_SPACING;
      const bassStaffY = trebleStaffHeight + GRAND_STAFF_SPACING;

      const bassElements = renderPositionedNotes(justifiedBassObj, "bass", bassStaffY, this.svgRendererInstance);
      this.svgRendererInstance.commitElementsToDOM(bassElements, this.staffLayer);
    }

    const maxNextStartX = startX + (maxRawWidth * scaleRatio);
    const barlineX = maxNextStartX + BARLINE_MEASURE_PADDING;

    drawBarLine(this.svgRendererInstance, this.staffLayer, this.systemStaffType, barlineX);
  }

  destroy() {
    this.svgRendererInstance.destroy();
  }
}