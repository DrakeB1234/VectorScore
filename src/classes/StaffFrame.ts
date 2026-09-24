import type { SystemTypes } from "../types";
import StaffRenderer, { CLEF_X_OFFSET, type TimeSignature } from "./StaffRenderer";
import type SVGRenderer from "./SVGRenderer";

export type StaffFrameOptions = {
  width?: number;
  scale?: number;
  /** Extra space between the end of the clef / key signature / time signature and the first note */
  noteStartX?: number;
  padding?: number;
  staffType?: SystemTypes;
  svgAutoFill?: boolean;
  keySignature?: string;
  timeSignature?: TimeSignature

  /** @deprecated Use `padding` instead. */
  spaceAbove?: number;
  /** @deprecated Use `padding` instead. */
  spaceBelow?: number;
};

export type ResolvedStaffFrameOptions =
  Required<Omit<StaffFrameOptions, "spaceAbove" | "spaceBelow" | "keySignature" | "timeSignature">>
  & Pick<StaffFrameOptions, "keySignature" | "timeSignature">;

export default class StaffFrame {
  private svgRendererInstance: SVGRenderer;
  private staffRenderer: StaffRenderer;

  private staffType: SystemTypes;
  private padding: number;
  private keySignature: string | undefined;
  private timeSignature: TimeSignature | undefined;

  private notesLayer: SVGGElement;
  private staffGroup: SVGGElement;
  private keySigGroup: SVGGElement;
  private timeSigGroup: SVGGElement;

  private clefWidth: number = 0;
  private keySigWidth: number = 0;
  private timeSigWidth: number = 0;
  private _notesStartX: number = 0;
  private noteStartOffset: number;

  constructor(svgRenderer: SVGRenderer, options: ResolvedStaffFrameOptions) {
    this.svgRendererInstance = svgRenderer;
    this.staffRenderer = new StaffRenderer(svgRenderer);

    this.staffType = options.staffType;
    this.padding = options.padding;
    this.noteStartOffset = options.noteStartX;
    this.keySignature = options.keySignature;
    this.timeSignature = options.timeSignature;

    // Layer order matters, notes are drawn on top of the staff
    const staffLayer = svgRenderer.createLayer("staff");
    this.notesLayer = svgRenderer.createLayer("notes");

    this.staffGroup = svgRenderer.createGroup("staff");
    this.keySigGroup = svgRenderer.createGroup("key-sig");
    this.timeSigGroup = svgRenderer.createGroup("time-sig");
    staffLayer.appendChild(this.staffGroup);
    staffLayer.appendChild(this.keySigGroup);
    staffLayer.appendChild(this.timeSigGroup);

    const { totalStaffHeight, glyphWidth } = this.staffRenderer.drawStaff({
      width: options.width,
      staffType: this.staffType,
      startYPos: 0,
      staffGroup: this.staffGroup
    });
    this.clefWidth = glyphWidth + CLEF_X_OFFSET;
  }
}