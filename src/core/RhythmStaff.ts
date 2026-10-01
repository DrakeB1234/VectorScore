import { AUGMENTATION_DOT, FLAG_EIGHTH_DOWN, FLAG_EIGHTH_UP, FLAG_SIXTEENTH_DOWN, FLAG_SIXTEENTH_UP, NOTEHEAD_BLACK, NOTEHEAD_HALF, NOTEHEAD_WHOLE, REST_EIGHTH, REST_HALF, REST_QUARTER, REST_SIXTEENTH, REST_WHOLE, TIMESIG_1, TIMESIG_2, TIMESIG_3, TIMESIG_4, TIMESIG_5, TIMESIG_6, TIMESIG_7, TIMESIG_8, TIMESIG_9, type GlyphDef } from "../glyphs";
import SVGRenderer from "../classes/SVGRenderer";
import NoteRenderer, { STEM_UP_X_OFFSET } from "../classes/NoteRenderer";
import StaffRenderer from "../classes/StaffRenderer";
import { parseDurationString, type NoteDurations } from "../helpers/noteHelpers";

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
  width: 400,
  scale: 1,
  maxMeasures: 2,
  topNumber: 4,
  bottomNumber: 4,
  padding: 24,
  svgAutoFill: true,
};

type ResolvedStaffOptions =
  Required<RhythmStaffUserOptions>;

const USE_GLPYHS: GlyphDef[] = [
  NOTEHEAD_WHOLE, NOTEHEAD_HALF, NOTEHEAD_BLACK,
  TIMESIG_1, TIMESIG_2, TIMESIG_3, TIMESIG_4, TIMESIG_5, TIMESIG_6, TIMESIG_7, TIMESIG_8, TIMESIG_9,
  FLAG_EIGHTH_DOWN, FLAG_EIGHTH_UP, FLAG_SIXTEENTH_DOWN, FLAG_SIXTEENTH_UP,
  REST_WHOLE, REST_HALF, REST_QUARTER, REST_EIGHTH, REST_SIXTEENTH,
  AUGMENTATION_DOT
];

export type RhythmItem =
  | { type: "note"; duration: string }
  | { type: "rest"; duration: string }
  | { type: "beam"; durations: string };

type RenderedItem = {
  group: SVGGElement;
  fullWidth: number;
  baseSpacing: number;
};

const TIME_SIG_START_X = 8;
const NOTES_LAYER_START_X = 16;
const NOTES_SPACING = 10;
const STAFF_RIGHT_SPACING = 1;
const MEASURE_LEFT_PADDING = 16;

const MIN_PER_MEASURE_WIDTH = 100;

const PRIMARY_BEAM_Y = -35;
const BEAM_SPACING = 6;
const BEAM_THICKNESS = 3;

const allowedDurationValues = ["w", "h", "q", "e", "s"];
const allowedBeamDurationValues = ["e", "s"];

const WHOLE_NOTE_SPACE = 100;

const NOTE_SPACING_MAP: Record<string, number> = {
  "w": WHOLE_NOTE_SPACE,
  "h": WHOLE_NOTE_SPACE / 2,
  "q": WHOLE_NOTE_SPACE / 4,
  "e": WHOLE_NOTE_SPACE / 8,
  "s": WHOLE_NOTE_SPACE / 16,
};

export default class RhythmStaff {
  private options: ResolvedStaffOptions;

  private svgRendererInstance: SVGRenderer;
  private staffRendererInstance: StaffRenderer;
  private noteRendererInstance: NoteRenderer;

  private staffLayer: SVGGElement;
  private notesLayer: SVGGElement;
  private uiLayer: SVGGElement;
  private timeSigGroup: SVGGElement;

  private noteLayerStartX: number;
  private noteCursorX: number = 0;
  private dynamicMeasureWidth: number = 0;
  private measuresDrawn: number = 0;

  /**
   * Creates an instance of a RhythmStaff, A single staff that will automatically apply positioning of elements based on the duration of a note.
   *
   * @param rootElementCtx - The element (div) reference that will append the music staff elements to.
   * @param userOptions - Optional configuration settings. All config options are in the type RhythmStaffOptions
   * @throws {Error} - If top number is not 3 or 4 OR if bars count is not between 1 - 3. These are the currently only supported values.
  */
  constructor(rootElementCtx: HTMLElement, userOptions?: RhythmStaffUserOptions) {
    this.options = { ...DEFAULT_STAFF_OPTIONS, ...userOptions };

    this.svgRendererInstance = new SVGRenderer(rootElementCtx, USE_GLPYHS);
    this.staffRendererInstance = new StaffRenderer(this.svgRendererInstance);
    this.noteRendererInstance = new NoteRenderer(this.svgRendererInstance);

    this.staffLayer = this.svgRendererInstance.createLayer("staff");
    this.notesLayer = this.svgRendererInstance.createLayer("notes");
    this.uiLayer = this.svgRendererInstance.createLayer("rhythm-ui");
    this.staffLayer.setAttribute("transform", `translate(0, ${this.options.padding})`);

    // Draw time sig
    this.timeSigGroup = this.svgRendererInstance.createGroup("time-sig");
    const timeSigTotalHeight = TIMESIG_4.glyphHeight * 2;

    const timeSigWidth = this.staffRendererInstance.drawTimeSignature({
      topNumber: this.options.topNumber,
      bottomNumber: this.options.bottomNumber,
      startYPos: 0,
      staffGroup: this.timeSigGroup,
    });
    this.timeSigGroup.setAttribute("transform", `translate(${TIME_SIG_START_X}, 0)`);
    this.staffLayer.appendChild(this.timeSigGroup);

    // Draw single line staff
    const staffLineY = timeSigTotalHeight / 2;

    const staffGroup = this.svgRendererInstance.createGroup("staff");
    this.svgRendererInstance.drawLine(0, staffLineY, this.options.width, staffLineY, staffGroup);
    this.staffLayer.appendChild(staffGroup);

    this.noteLayerStartX = timeSigWidth + TIME_SIG_START_X + NOTES_LAYER_START_X;
    this.notesLayer.setAttribute("transform", `translate(${this.noteLayerStartX}, ${staffLineY + this.options.padding})`);
    this.uiLayer.setAttribute("transform", `translate(${this.noteLayerStartX}, ${staffLineY + this.options.padding})`);

    // Calculate exact width per measure. 
    const availableWidth = this.options.width - this.noteLayerStartX - STAFF_RIGHT_SPACING;
    this.dynamicMeasureWidth = availableWidth / this.options.maxMeasures;

    if (this.dynamicMeasureWidth < MIN_PER_MEASURE_WIDTH) throw new Error(`RhythmStaff init Error: Not enough space to support '${this.options.maxMeasures}' measures with a staff width of '${this.options.width}'.`);

    const totalHeight = timeSigTotalHeight + this.options.padding * 2;
    this.svgRendererInstance.setRootSVGSizing(this.options.width, totalHeight, this.options.scale);
    this.svgRendererInstance.setSVGAutoFill(this.options.svgAutoFill);
    this.svgRendererInstance.commitElementsToDOM(this.svgRendererInstance.svgElementRef);
  };

  private drawBeamSegment(x1: number, y1: number, x2: number, y2: number, group: SVGGElement) {
    this.svgRendererInstance.drawPolygon([
      [x1, y1],
      [x2, y2],
      [x2, y2 + BEAM_THICKNESS],
      [x1, y1 + BEAM_THICKNESS]
    ], group);
  };

  private drawBeams(stemCoords: number[], durations: NoteDurations[], baseSpacing: number, group: SVGGElement) {
    const STUB_LENGTH = baseSpacing / 2;

    // Draw the continuous Primary Beam (8th note level)
    const firstStemX = stemCoords[0];
    const lastStemX = stemCoords[stemCoords.length - 1];
    this.drawBeamSegment(firstStemX, PRIMARY_BEAM_Y, lastStemX, PRIMARY_BEAM_Y, group);

    //  Draw the Secondary Beams (16th note level)
    const secondaryBeamY = PRIMARY_BEAM_Y + BEAM_SPACING;

    for (let i = 0; i < durations.length; i++) {
      if (durations[i] === "s") {
        const hasNext16th = i < durations.length - 1 && durations[i + 1] === "s";
        const hasPrev16th = i > 0 && durations[i - 1] === "s";

        if (hasNext16th) {
          this.drawBeamSegment(stemCoords[i], secondaryBeamY, stemCoords[i + 1], secondaryBeamY, group);
        }
        else if (!hasPrev16th) {
          // It doesn't connect forward or backward, so it's a fractional stub.
          const directionMultiplier = i === 0 ? 1 : -1;
          const stubEndX = stemCoords[i] + (STUB_LENGTH * directionMultiplier);

          this.drawBeamSegment(stemCoords[i], secondaryBeamY, stubEndX, secondaryBeamY, group);
        }
      }
    }
  }

  private handleBeamRendering(durations: NoteDurations[], group: SVGGElement) {
    const baseSpacing = NOTE_SPACING_MAP["e"];
    let internalX = 0;

    // Array to track the absolute X coordinate of every stem in this group
    const stemCoords: number[] = [];

    // Render all notes and record their stem X positions
    durations.forEach((duration) => {
      const noteGroup = this.svgRendererInstance.createGroup("note");

      this.noteRendererInstance.drawRhythmNote("q", false, noteGroup);
      noteGroup.setAttribute("transform", `translate(${internalX}, 0)`);
      group.appendChild(noteGroup);

      const stemX = internalX + NOTEHEAD_BLACK.glyphWidth - STEM_UP_X_OFFSET;
      stemCoords.push(stemX);

      internalX += baseSpacing;
    });

    if (stemCoords.length > 0) {
      this.drawBeams(stemCoords, durations, baseSpacing, group);
    }

    return {
      fullWidth: (internalX - baseSpacing) + NOTEHEAD_BLACK.glyphWidth,
      originXOffset: 0
    };
  };

  private justifyMeasure(renderedItems: RenderedItem[], targetWidth: number): number {
    const totalGlyphWidth = renderedItems.reduce((sum, i) => sum + i.fullWidth, 0);
    const totalBaseSpacing = renderedItems.reduce((sum, i) => sum + i.baseSpacing, 0);

    // Remaining space that needs to be distributed to fill the measure
    const remainingSpace = targetWidth - totalGlyphWidth - totalBaseSpacing;

    // Distribute remaining space proportionally based on base spacing footprint
    return remainingSpace > 0 ? remainingSpace / totalBaseSpacing : 0;
  }

  public drawRyhthmNote(duration: string) {
    const res = parseDurationString(duration);
    if (!allowedDurationValues.includes(res.duration)) throw new Error("RhythmStaff drawBeam Error: Invalid duration provided, use [w|h|q|e|s].");

    const group = this.svgRendererInstance.createGroup("note");

    const { fullWidth, originXOffset } = this.noteRendererInstance.drawRhythmNote(res.duration, res.isDotted, group);
    group.setAttribute("transform", `translate(${this.noteCursorX + originXOffset}, 0)`);
    this.notesLayer.appendChild(group);

    this.noteCursorX += fullWidth + NOTES_SPACING;
  };

  public drawRest(duration: string) {
    const res = parseDurationString(duration);
    if (!allowedDurationValues.includes(res.duration)) throw new Error("RhythmStaff drawBeam Error: Invalid duration provided, use [w|h|q|e|s].");

    const group = this.svgRendererInstance.createGroup("rest");
    const startY = -(this.options.padding / 2);

    const { fullWidth, originXOffset } = this.noteRendererInstance.drawRest(res.duration, res.isDotted, group);
    group.setAttribute("transform", `translate(${this.noteCursorX + originXOffset}, ${startY})`);
    this.notesLayer.appendChild(group);

    this.noteCursorX += fullWidth + NOTES_SPACING;
  }

  public drawBeam(durations: string) {
    const durationsArr = durations.split("");

    durationsArr.forEach(e => {
      if (!allowedBeamDurationValues.includes(e)) throw new Error("RhythmStaff drawBeam Error: Invalid duration provided, use [e|s].")
    });

    const group = this.svgRendererInstance.createGroup("beam");
    const { fullWidth, originXOffset } = this.handleBeamRendering(durationsArr as NoteDurations[], group);
    group.setAttribute("transform", `translate(${this.noteCursorX + originXOffset}, ${0})`);
    this.notesLayer.appendChild(group);

    this.noteCursorX += fullWidth + NOTES_SPACING;
  };

  public drawMeasure(items: RhythmItem[]) {
    if (this.measuresDrawn >= this.options.maxMeasures) {
      throw new Error(`RhythmStaff Error: Cannot draw more than ${this.options.maxMeasures} measures per line.`);
    }

    const measureStartX = this.noteCursorX;

    // Pre render Pass
    const renderedItems = items.map(item => {
      let group: SVGGElement;
      let fullWidth = 0;
      let baseSpacing = 0;

      if (item.type === "note") {
        group = this.svgRendererInstance.createGroup("note");
        const res = parseDurationString(item.duration);
        const drawRes = this.noteRendererInstance.drawRhythmNote(res.duration, res.isDotted, group);

        fullWidth = drawRes.fullWidth;
        baseSpacing = NOTE_SPACING_MAP[res.duration];
      }
      else if (item.type === "rest") {
        group = this.svgRendererInstance.createGroup("rest");
        const res = parseDurationString(item.duration);
        const drawRes = this.noteRendererInstance.drawRest(res.duration, res.isDotted, group);

        group.setAttribute("y-offset", (-(this.options.padding / 2)).toString());
        fullWidth = drawRes.fullWidth;
        baseSpacing = NOTE_SPACING_MAP[res.duration];
      }
      else {
        group = this.svgRendererInstance.createGroup("beam");
        const durationsArr = item.durations.split("") as NoteDurations[];
        const drawRes = this.handleBeamRendering(durationsArr, group);

        fullWidth = drawRes.fullWidth;
        baseSpacing = NOTE_SPACING_MAP[durationsArr[durationsArr.length - 1]];
      }

      return { group, fullWidth, baseSpacing };
    });

    // Justification Pass
    const targetWidth = this.dynamicMeasureWidth - MEASURE_LEFT_PADDING - NOTES_SPACING;
    const stretchFactor = this.justifyMeasure(renderedItems, targetWidth);

    // Layout Pass
    let currentX = measureStartX + MEASURE_LEFT_PADDING;

    renderedItems.forEach(item => {
      const finalSpacing = item.baseSpacing + (item.baseSpacing * stretchFactor);

      const yOffset = item.group.getAttribute("y-offset") || "0";
      item.group.setAttribute("transform", `translate(${currentX}, ${yOffset})`);
      this.notesLayer.appendChild(item.group);

      currentX += item.fullWidth + finalSpacing;
    });

    // Draw Barline and Advance Cursor
    // Barlines are drawn in the staffLayer (x=0), so we must add the noteLayer's start offset
    const absoluteBarlineX = this.noteLayerStartX + measureStartX + this.dynamicMeasureWidth;
    this.staffRendererInstance.drawStaffBarLine(absoluteBarlineX, "treble", this.staffLayer);

    // The cursor jumps by exactly the dynamic width, ensuring the next measure starts cleanly on the barline
    this.noteCursorX = measureStartX + this.dynamicMeasureWidth;
    this.measuresDrawn++;
  };
}