import type { GlyphNames } from "../glyphs";
import SVGRenderer from "../classes/SVGRenderer";
import { drawStaff, type StaffTypes } from "./devStaffHelpers";
import { calculateMeasureSpacing, renderPositionedNotes, measureInputNotesParser } from "./devNoteHelpers";

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
    const parsedNoteObj = measureInputNotesParser(measureNoteInput);
    const positionedNotes = calculateMeasureSpacing(parsedNoteObj, 0);

    const noteElements = renderPositionedNotes(positionedNotes, this.systemStaffType, this.svgRendererInstance);
    this.svgRendererInstance.commitElementsToDOM(noteElements, this.staffLayer);
  }

  destroy() {
    this.svgRendererInstance.destroy();
  }
}