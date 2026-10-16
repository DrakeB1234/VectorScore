import { AUGMENTATION_DOT, FLAG_EIGHTH_DOWN, FLAG_EIGHTH_UP, FLAG_SIXTEENTH_DOWN, FLAG_SIXTEENTH_UP, NOTEHEAD_BLACK, NOTEHEAD_HALF, NOTEHEAD_WHOLE, REST_EIGHTH, REST_HALF, REST_QUARTER, REST_SIXTEENTH, REST_WHOLE, TIMESIG_0, TIMESIG_1, TIMESIG_2, TIMESIG_3, TIMESIG_4, TIMESIG_5, TIMESIG_6, TIMESIG_7, TIMESIG_8, TIMESIG_9, type GlyphDef } from "../glyphs";
import SVGRenderer from "../classes/SVGRenderer";
import NoteRenderer, { STEM_UP_X_OFFSET } from "../classes/NoteRenderer";
import StaffRenderer from "../classes/StaffRenderer";
import { type NoteDurations } from "../helpers/inputHelpers";
import { setTransformAttr } from "../constants";
import { parseDurationString } from "../helpers/noteHelpers";
import { BASE_STAFF_HEIGHT } from "../helpers/staffHelpers";
import type { StemCoord } from "../classes/BeamRenderer";

export type RhythmStaffUserOptions = {
  width?: number;
  scale?: number;
  maxMeasures?: number;
  topNumber?: number;
  bottomNumber?: number;
  padding?: number;
  svgAutoFill?: boolean;
};

const DEFAULT_STAFF_OPTIONS: Required<RhythmStaffUserOptions> = {
  width: 450,
  scale: 1,
  maxMeasures: 2,
  topNumber: 4,
  bottomNumber: 4,
  padding: 24,
  svgAutoFill: true,
};

type ResolvedStaffOptions = Required<RhythmStaffUserOptions>;

const USE_GLPYHS: GlyphDef[] = [
  NOTEHEAD_WHOLE, NOTEHEAD_HALF, NOTEHEAD_BLACK,
  TIMESIG_0, TIMESIG_1, TIMESIG_2, TIMESIG_3, TIMESIG_4, TIMESIG_5, TIMESIG_6, TIMESIG_7, TIMESIG_8, TIMESIG_9,
  FLAG_EIGHTH_DOWN, FLAG_EIGHTH_UP, FLAG_SIXTEENTH_DOWN, FLAG_SIXTEENTH_UP,
  REST_WHOLE, REST_HALF, REST_QUARTER, REST_EIGHTH, REST_SIXTEENTH,
  AUGMENTATION_DOT
];

export type RhythmItem =
  | { type: "note"; duration: string }
  | { type: "rest"; duration: string }
  | { type: "beam"; durations: string };

const TIME_SIG_START_X = 8;
const NOTES_LAYER_START_X = 16;
const MEASURE_LEFT_PADDING = 16;
const MEASURE_RIGHT_PADDING = 10;
const STAFF_RIGHT_SPACING = 1;

const MIN_PER_MEASURE_WIDTH = 100;

// Fractional whole-note values for pure time-grid calculation
const DURATION_TIME_MAP: Record<Exclude<NoteDurations, "t">, number> = {
  "w": 1,
  "h": 0.5,
  "q": 0.25,
  "e": 0.125,
  "s": 0.0625,
};

export default class RhythmStaff {
  private options: ResolvedStaffOptions;

  private svgRendererInstance: SVGRenderer;
  private staffRendererInstance: StaffRenderer;
  private noteRendererInstance: NoteRenderer;

  private staffLayer: SVGGElement;
  private notesLayer: SVGGElement;
  private barlinesGroup: SVGGElement;
  public readonly uiLayer: SVGGElement;
  private timeSigGroup: SVGGElement;

  private noteLayerStartX: number;
  private noteCursorX: number = 0;
  private dynamicMeasureWidth: number = 0;
  private measuresDrawn: number = 0;

  constructor(rootElementCtx: HTMLElement, userOptions?: RhythmStaffUserOptions) {
    if (rootElementCtx === null) throw new Error("RhythmStaff Error: RootElementCtx was not defined. Please ensure a valid HTML element is provided to append the staff to.");

    this.options = { ...DEFAULT_STAFF_OPTIONS, ...userOptions };

    this.svgRendererInstance = new SVGRenderer(rootElementCtx, USE_GLPYHS);
    this.staffRendererInstance = new StaffRenderer(this.svgRendererInstance);
    this.noteRendererInstance = new NoteRenderer(this.svgRendererInstance);

    this.staffLayer = this.svgRendererInstance.createLayer("staff");
    this.notesLayer = this.svgRendererInstance.createLayer("notes");
    this.uiLayer = this.svgRendererInstance.createLayer("rhythm-ui");
    setTransformAttr(this.staffLayer, 0, this.options.padding);

    // Draw time sig
    this.timeSigGroup = this.svgRendererInstance.createGroup("time-sig");
    const timeSigTotalHeight = TIMESIG_4.glyphHeight * 2;

    const timeSigWidth = this.staffRendererInstance.drawTimeSignature({
      topNumber: this.options.topNumber,
      bottomNumber: this.options.bottomNumber,
      startYPos: 0,
      staffGroup: this.timeSigGroup,
    });
    setTransformAttr(this.timeSigGroup, TIME_SIG_START_X, 0);
    this.staffLayer.appendChild(this.timeSigGroup);

    // Draw single line staff
    const staffLineY = timeSigTotalHeight / 2;

    const staffGroup = this.svgRendererInstance.createGroup("staff");
    this.svgRendererInstance.drawLine(0, staffLineY, this.options.width, staffLineY, staffGroup);
    this.staffLayer.appendChild(staffGroup);

    this.barlinesGroup = this.svgRendererInstance.createGroup("barlines");
    this.staffLayer.appendChild(this.barlinesGroup);

    this.noteLayerStartX = timeSigWidth + TIME_SIG_START_X + NOTES_LAYER_START_X;
    setTransformAttr(this.notesLayer, this.noteLayerStartX, staffLineY + this.options.padding);
    setTransformAttr(this.uiLayer, this.noteLayerStartX, staffLineY + this.options.padding);

    // Calculate exact width per measure
    const availableWidth = this.options.width - this.noteLayerStartX - STAFF_RIGHT_SPACING;
    this.dynamicMeasureWidth = availableWidth / this.options.maxMeasures;

    if (this.dynamicMeasureWidth < MIN_PER_MEASURE_WIDTH || this.options.maxMeasures < 1) {
      throw new Error(`RhythmStaff init Error: Not enough space to support '${this.options.maxMeasures}' measures with a staff width of '${this.options.width}'.`);
    }

    const totalHeight = timeSigTotalHeight + this.options.padding * 2;
    this.svgRendererInstance.setRootSVGSizing(this.options.width, totalHeight, this.options.scale);
    this.svgRendererInstance.setSVGAutoFill(this.options.svgAutoFill);
    this.svgRendererInstance.commitElementsToDOM(this.svgRendererInstance.svgElementRef);
  }

  /** Total whole-note fraction capacity of a single measure (e.g., 4/4 = 1.0, 3/4 = 0.75) */
  private getMeasureCapacity(): number {
    return this.options.topNumber / this.options.bottomNumber;
  }

  /** Usable horizontal pixel space inside a measure where beat steps are mapped */
  private getWorkableMeasureWidth(): number {
    return this.dynamicMeasureWidth - MEASURE_LEFT_PADDING - MEASURE_RIGHT_PADDING;
  }

  private resolveDuration(durationStr: string) {
    const res = parseDurationString(durationStr);
    if (res.duration === "t") {
      throw new Error("RhythmStaff Error: Invalid duration value 't' used, Rhythm staff does not support 32nd notes.");
    }
    const baseTime = DURATION_TIME_MAP[res.duration];
    const timeValue = res.isDotted ? baseTime * 1.5 : baseTime;

    return { ...res, timeValue };
  }

  public drawMeasure(items: RhythmItem[]) {
    if (this.measuresDrawn >= this.options.maxMeasures) {
      throw new Error(`RhythmStaff Error: Cannot draw more than ${this.options.maxMeasures} measures per line.`);
    }

    const measureStartX = this.noteCursorX;
    const workableWidth = this.getWorkableMeasureWidth();
    const measureCapacity = this.getMeasureCapacity();

    let elapsedTime = 0;

    // Converts a fractional time offset within the measure to a local X coordinate
    const timeToX = (time: number) =>
      measureStartX + MEASURE_LEFT_PADDING + (time / measureCapacity) * workableWidth;

    items.forEach(item => {
      const itemStartX = timeToX(elapsedTime);

      if (item.type === "note") {
        const group = this.svgRendererInstance.createGroup("note");
        const res = this.resolveDuration(item.duration);

        this.noteRendererInstance.drawRhythmNote(res.duration, res.isDotted, group);
        setTransformAttr(group, itemStartX, 0);
        this.notesLayer.appendChild(group);

        elapsedTime += res.timeValue;
      }
      else if (item.type === "rest") {
        const group = this.svgRendererInstance.createGroup("rest");
        const res = this.resolveDuration(item.duration);

        this.noteRendererInstance.drawRest({ duration: res.duration, isDotted: res.isDotted }, group);
        setTransformAttr(group, itemStartX, -(this.options.padding * 0.8));
        this.notesLayer.appendChild(group);

        elapsedTime += res.timeValue;
      }
      else if (item.type === "beam") {
        const beamGroup = this.svgRendererInstance.createGroup("beam");
        setTransformAttr(beamGroup, itemStartX, 0);

        const rawTokens = item.durations.match(/[whqestWHQEST]\.?/g);
        if (!rawTokens || rawTokens.join("") !== item.durations || rawTokens.length < 2) {
          throw new Error(`RhythmStaff Error: Invalid beam durations string '${item.durations}'.`);
        }

        const parsedNotes = rawTokens.map(token => this.resolveDuration(token));
        const stemCoords: StemCoord[] = [];

        parsedNotes.forEach(note => {
          const noteGroup = this.svgRendererInstance.createGroup("note");
          const localX = timeToX(elapsedTime) - itemStartX;

          this.noteRendererInstance.drawRhythmNote("q", note.isDotted, noteGroup, { skipStem: true });
          setTransformAttr(noteGroup, localX, 0);
          beamGroup.appendChild(noteGroup);

          stemCoords.push({
            x: localX + NOTEHEAD_BLACK.glyphWidth - STEM_UP_X_OFFSET,
            startY: -1, // Matches STEM_Y_OFFSET in NoteRenderer
            endY: -35,  // Standard rhythm beam height
            duration: note.duration as "e" | "s",
            noteStep: 0
          });

          elapsedTime += note.timeValue;
        });

        this.noteRendererInstance.drawRhythmBeamStems(stemCoords, beamGroup);
        this.notesLayer.appendChild(beamGroup);
      }
    });

    // Draw Barline and Advance Cursor
    const absoluteBarlineX = this.noteLayerStartX + measureStartX + this.dynamicMeasureWidth;
    const barline = this.svgRendererInstance.createGroup("barline");
    this.staffRendererInstance.drawBarline({
      barType: "single",
      topY: 0,
      bottomY: BASE_STAFF_HEIGHT,
      group: barline
    });
    setTransformAttr(barline, absoluteBarlineX, 0);
    this.barlinesGroup.appendChild(barline);

    this.noteCursorX = measureStartX + this.dynamicMeasureWidth;
    this.measuresDrawn++;
  }

  public clear() {
    this.notesLayer.replaceChildren();
    this.barlinesGroup.replaceChildren();
    this.noteCursorX = 0;
    this.measuresDrawn = 0;
  }

  public setMaxMeasures(count: number) {
    const availableWidth = this.options.width - this.noteLayerStartX - STAFF_RIGHT_SPACING;
    const dynamicMeasureWidth = availableWidth / count;

    if (dynamicMeasureWidth < MIN_PER_MEASURE_WIDTH || count < 1) {
      throw new Error(`RhythmStaff init Error: Not enough space to support '${count}' measures with a staff width of '${this.options.width}'.`);
    }

    this.options.maxMeasures = count;
    this.dynamicMeasureWidth = dynamicMeasureWidth;

    this.clear();
  }

  /** - Returns the X position of given time value on measure, returns X centered on notehead glyph */
  public getBeatCoordinateX(index: number, dividend: number = this.options.bottomNumber): number {
    const stepsPerMeasure = (this.options.topNumber * dividend) / this.options.bottomNumber;
    const totalSteps = this.options.maxMeasures * stepsPerMeasure;

    if (index < 0 || index >= totalSteps) return -1;

    const measureIndex = Math.floor(index / stepsPerMeasure);
    const stepIndex = index % stepsPerMeasure;

    const measureStartX = measureIndex * this.dynamicMeasureWidth;
    const workableWidth = this.getWorkableMeasureWidth();

    let res = measureStartX + MEASURE_LEFT_PADDING + (stepIndex / stepsPerMeasure) * workableWidth;
    res += NOTEHEAD_BLACK.glyphWidth / 2;

    // Uses the exact same proportional ratio as timeToX in drawMeasure
    return res;
  }
}