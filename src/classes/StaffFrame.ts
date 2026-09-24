import { CLEF_X_OFFSET, COMPONENT_GAP } from "./StaffRenderer";
import StaffRenderer from "./StaffRenderer";
import type SVGRenderer from "./SVGRenderer";
import type { SystemTypes } from "../types";
import { validateKeySignature, validateTimeSignature, type KeySignatures, type TimeSignature } from "../helpers/staffHelpers";

export type StaffLayoutOptions = {
  width: number;
  staffType: SystemTypes;
  noteStartX: number;
  paddingTop: number;
  keySignature?: KeySignatures;
  timeSignature?: TimeSignature;
};

export default class StaffFrame {
  private options: StaffLayoutOptions;

  private svgRendererInstance: SVGRenderer;
  private staffRenderer: StaffRenderer;

  private staffLayer: SVGGElement;
  private staffGroup: SVGGElement;
  private keySigGroup: SVGGElement;
  private timeSigGroup: SVGGElement;

  public readonly totalStaffHeight: number;
  private currentNoteStartX: number = 0;

  private clefWidth: number = 0;
  private keySigWidth: number = 0;
  private timeSigWidth: number = 0;

  constructor(svgRendererInstance: SVGRenderer, options: StaffLayoutOptions) {
    this.options = options;

    this.svgRendererInstance = svgRendererInstance;
    this.staffRenderer = new StaffRenderer(this.svgRendererInstance);

    // Create the layer and set its vertical padding immediately
    this.staffLayer = this.svgRendererInstance.createLayer("staff");
    this.staffLayer.setAttribute("transform", `translate(0, ${this.options.paddingTop})`);

    this.staffGroup = this.svgRendererInstance.createGroup("staff");
    this.keySigGroup = this.svgRendererInstance.createGroup("key-sig");
    this.timeSigGroup = this.svgRendererInstance.createGroup("time-sig");

    this.staffLayer.appendChild(this.staffGroup);
    this.staffLayer.appendChild(this.keySigGroup);
    this.staffLayer.appendChild(this.timeSigGroup);

    // Draw Base Staff
    const { totalStaffHeight, glyphWidth } = this.staffRenderer.drawStaff({
      width: this.options.width,
      staffType: this.options.staffType,
      startYPos: 0,
      staffGroup: this.staffGroup,
    });
    this.totalStaffHeight = totalStaffHeight;
    this.clefWidth = glyphWidth + CLEF_X_OFFSET;

    // Draw Signatures & Barlines
    if (this.options.keySignature) this.drawKeySignature(this.options.keySignature);
    if (this.options.timeSignature) this.drawTimeSignature(this.options.timeSignature);

    this.staffRenderer.drawStaffBarLine(0.5, this.options.staffType, this.staffGroup);
    this.staffRenderer.drawStaffBarLine(this.options.width - 0.5, this.options.staffType, this.staffGroup);

    this.updateStaffLayout();
  }

  /**
   * Recalculates horizontal spacing for the UI components.
   * @returns The new starting X coordinate where notes should safely begin.
   */
  private updateStaffLayout(): number {
    let currentX = this.clefWidth;

    if (this.options.keySignature && this.keySigWidth > 0) {
      currentX += COMPONENT_GAP;
      this.keySigGroup.setAttribute("transform", `translate(${currentX}, 0)`);
      currentX += this.keySigWidth;
    } else {
      this.keySigGroup.setAttribute("transform", `translate(0, 0)`);
    }

    if (this.options.timeSignature && this.timeSigWidth > 0) {
      currentX += COMPONENT_GAP;
      this.timeSigGroup.setAttribute("transform", `translate(${currentX}, 0)`);
      currentX += this.timeSigWidth;
    } else {
      this.timeSigGroup.setAttribute("transform", `translate(0, 0)`);
    }

    this.currentNoteStartX = currentX + this.options.noteStartX;
    return this.currentNoteStartX;
  }

  private drawKeySignature(key: KeySignatures) {
    this.keySigWidth = this.staffRenderer.drawKeySignature({
      key: key,
      staffGroup: this.keySigGroup,
      staffType: this.options.staffType,
    });
  }

  private drawTimeSignature(timeSig: TimeSignature) {
    this.timeSigWidth = this.staffRenderer.drawTimeSignature({
      topNumber: timeSig.topNumber,
      bottomNumber: timeSig.bottomNumber,
      staffGroup: this.timeSigGroup,
      staffType: this.options.staffType,
    });
  }

  // --- PUBLIC API EXPOSED TO CONTROLLERS ---

  public getNoteStartX(): number {
    return this.currentNoteStartX;
  }

  public changeTimeSignature(top: number, bottom: number): number {
    validateTimeSignature(top, bottom);
    if (this.options.timeSignature?.topNumber === top && this.options.timeSignature?.bottomNumber === bottom) {
      return this.currentNoteStartX;
    }

    this.options.timeSignature = { topNumber: top, bottomNumber: bottom };
    this.timeSigGroup.replaceChildren();
    this.drawTimeSignature(this.options.timeSignature);

    return this.updateStaffLayout();
  }

  public removeTimeSignature(): number {
    this.options.timeSignature = undefined;
    this.timeSigGroup.replaceChildren();

    return this.updateStaffLayout();
  }

  public changeKeySignature(key: KeySignatures): number {
    validateKeySignature(key);
    if (this.options.keySignature === key) return this.currentNoteStartX;

    this.options.keySignature = key;
    this.keySigGroup.replaceChildren();
    this.drawKeySignature(key);

    return this.updateStaffLayout();
  }

  public removeKeySignature(): number {
    this.options.keySignature = undefined;
    this.keySigGroup.replaceChildren();

    return this.updateStaffLayout();
  }
}