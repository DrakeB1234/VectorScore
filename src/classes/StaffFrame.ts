import { BARLINE_X_OFFSET, COMPONENT_GAP } from "./StaffRenderer";
import StaffRenderer from "./StaffRenderer";
import type SVGRenderer from "./SVGRenderer";
import type { ClefTypes, SystemTypes } from "../types";
import { BASE_STAFF_HEIGHT, GRAND_STAFF_SPACING, validateKeySignature, validateTimeSignature, type KeySignatures, type TimeSignature } from "../helpers/staffHelpers";
import { setTransformAttr } from "../constants";

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
  public staffRenderer: StaffRenderer;

  private staffLayer: SVGGElement;
  private staffGroup: SVGGElement;
  private clefGroup: SVGGElement;
  private keySigGroup: SVGGElement;
  private timeSigGroup: SVGGElement;

  public totalStaffHeight: number;
  private currentNoteStartX: number = 0;

  private braceWidth: number;
  private clefWidth: number;
  private keySigWidth: number = 0;
  private timeSigWidth: number = 0;

  constructor(svgRendererInstance: SVGRenderer, options: StaffLayoutOptions) {
    this.options = options;

    this.svgRendererInstance = svgRendererInstance;
    this.staffRenderer = new StaffRenderer(this.svgRendererInstance);

    // Create the layer and set its vertical padding immediately
    this.staffLayer = this.svgRendererInstance.createLayer("staff");
    setTransformAttr(this.staffLayer, 0, this.options.paddingTop);

    this.staffGroup = this.svgRendererInstance.createGroup("staff");
    this.clefGroup = this.svgRendererInstance.createGroup("clef");
    this.keySigGroup = this.svgRendererInstance.createGroup("key-sig");
    this.timeSigGroup = this.svgRendererInstance.createGroup("time-sig");

    this.staffLayer.appendChild(this.staffGroup);
    this.staffLayer.appendChild(this.clefGroup);
    this.staffLayer.appendChild(this.keySigGroup);
    this.staffLayer.appendChild(this.timeSigGroup);

    // Draw Staff
    if (this.options.staffType === "grand") {
      const res = this.renderGrandStaff();
      this.totalStaffHeight = res.totalStaffHeight;
      this.clefWidth = res.clefWidth;
      this.braceWidth = res.braceWidth;
    }
    else {
      const staffHeight = this.staffRenderer.drawStaffLines({
        width: this.options.width,
        startYPos: 0,
        startXPos: 0,
        staffGroup: this.staffGroup,
      });
      const clefWidth = this.staffRenderer.drawClef({
        clefType: this.options.staffType,
        startYPos: 0,
        clefGroup: this.clefGroup
      });

      this.totalStaffHeight = staffHeight;
      this.clefWidth = clefWidth;
      this.braceWidth = 0;
    }

    // Draw Signatures & Barlines
    if (this.options.keySignature) this.drawKeySignature(this.options.keySignature);
    if (this.options.timeSignature) this.drawTimeSignature(this.options.timeSignature);

    this.staffRenderer.drawStaffBarLine(BARLINE_X_OFFSET + this.braceWidth, this.options.staffType, this.staffGroup);
    this.staffRenderer.drawStaffBarLine(this.options.width - BARLINE_X_OFFSET, this.options.staffType, this.staffGroup);

    this.updateStaffLayout();
  }

  private renderGrandStaff() {

    const totalStaffHeight = (BASE_STAFF_HEIGHT * 2) + GRAND_STAFF_SPACING;
    let y = 0;

    const braceWidth = this.staffRenderer.drawBrace({
      topY: 0,
      bottomY: totalStaffHeight,
      staffGroup: this.staffGroup
    });

    setTransformAttr(this.clefGroup, braceWidth, 0);

    const trebleStaffHeight = this.staffRenderer.drawStaffLines({
      width: this.options.width,
      startYPos: y,
      startXPos: braceWidth,
      staffGroup: this.staffGroup,
    });
    const trebleClefWidth = this.staffRenderer.drawClef({
      clefType: "treble",
      startYPos: y,
      clefGroup: this.clefGroup
    });
    y += trebleStaffHeight + GRAND_STAFF_SPACING;

    const bassStaffHeight = this.staffRenderer.drawStaffLines({
      width: this.options.width,
      startYPos: y,
      startXPos: braceWidth,
      staffGroup: this.staffGroup,
    });
    const bassClefWidth = this.staffRenderer.drawClef({
      clefType: "bass",
      startYPos: y,
      clefGroup: this.clefGroup
    });
    y += bassStaffHeight;

    return {
      clefWidth: Math.max(trebleClefWidth, bassClefWidth),
      totalStaffHeight: y,
      braceWidth
    }
  }

  /**
   * Recalculates horizontal spacing for the UI components.
   * @returns The new starting X coordinate where notes should safely begin.
   */
  private updateStaffLayout(): number {
    let currentX = this.clefWidth + this.braceWidth;

    if (this.options.keySignature && this.keySigWidth > 0) {
      currentX += COMPONENT_GAP;
      setTransformAttr(this.keySigGroup, currentX, 0);
      currentX += this.keySigWidth;
    } else {
      setTransformAttr(this.keySigGroup, 0, 0);
    }

    if (this.options.timeSignature && this.timeSigWidth > 0) {
      currentX += COMPONENT_GAP;
      setTransformAttr(this.timeSigGroup, currentX, 0);
      currentX += this.timeSigWidth;
    } else {
      setTransformAttr(this.timeSigGroup, 0, 0);
    }

    this.currentNoteStartX = currentX + this.options.noteStartX;
    return this.currentNoteStartX;
  }

  private drawKeySignature(key: KeySignatures) {
    if (this.options.staffType === "grand") {
      const trebleWidth = this.staffRenderer.drawKeySignature({
        key: key,
        clefType: "treble",
        startYPos: 0,
        staffGroup: this.keySigGroup,
      });

      const bassWidth = this.staffRenderer.drawKeySignature({
        key: key,
        clefType: "bass",
        startYPos: BASE_STAFF_HEIGHT + GRAND_STAFF_SPACING,
        staffGroup: this.keySigGroup,
      });

      this.keySigWidth = Math.max(trebleWidth, bassWidth);
    } else {
      this.keySigWidth = this.staffRenderer.drawKeySignature({
        key: key,
        clefType: this.options.staffType as ClefTypes,
        startYPos: 0,
        staffGroup: this.keySigGroup,
      });
    }
  }

  private drawTimeSignature(timeSig: TimeSignature) {
    if (this.options.staffType === "grand") {
      const topWidth = this.staffRenderer.drawTimeSignature({
        topNumber: timeSig.topNumber,
        bottomNumber: timeSig.bottomNumber,
        startYPos: 0,
        staffGroup: this.timeSigGroup,
      });

      const bottomWidth = this.staffRenderer.drawTimeSignature({
        topNumber: timeSig.topNumber,
        bottomNumber: timeSig.bottomNumber,
        startYPos: BASE_STAFF_HEIGHT + GRAND_STAFF_SPACING,
        staffGroup: this.timeSigGroup,
      });

      this.timeSigWidth = Math.max(topWidth, bottomWidth);
    } else {
      this.timeSigWidth = this.staffRenderer.drawTimeSignature({
        topNumber: timeSig.topNumber,
        bottomNumber: timeSig.bottomNumber,
        startYPos: 0,
        staffGroup: this.timeSigGroup,
      });
    }
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
    if (this.options.timeSignature === undefined) return this.currentNoteStartX;

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
    if (this.options.keySignature === undefined) return this.currentNoteStartX;

    this.options.keySignature = undefined;
    this.keySigGroup.replaceChildren();

    return this.updateStaffLayout();
  }
}