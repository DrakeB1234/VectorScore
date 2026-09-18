// ScoreFormatter.ts
import { measureInputNotesParser, type ParsedNote, type PositionedNote, type NoteDurations } from "./devNoteHelpers";
import type { SystemStaffTypes } from "./DevStaff";
import type { StaffTypes } from "./devStaffHelpers";

export interface FormatterConfig {
  targetWidth: number;
  startX: number;
  paddingPerMeasure: number;
};

export interface LayoutSystem {
  x: number;
  y: number;
  measures: LayoutMeasure[];
}

export interface LayoutMeasure {
  x: number;
  width: number;
  barlineX: number;
  staves: LayoutStaff[];
}

export interface LayoutStaff {
  clef: StaffTypes;
  notesData: ScaledStaffData;
}

export interface ScaledStaffData {
  positionedNotes: PositionedNote[];
  nextStartX: number;
}

const baseNoteDurationPosition = 120;

const noteDurationPositioningMap: Record<NoteDurations, number> = {
  "w": baseNoteDurationPosition,
  "h": baseNoteDurationPosition / 2,
  "q": baseNoteDurationPosition / 4,
  "e": baseNoteDurationPosition / 8,
  "s": baseNoteDurationPosition / 16,
};

export class ScoreFormatter {

  private config: FormatterConfig;

  constructor(config: FormatterConfig) {
    this.config = config;
  }

  public formatSystem(topMeasures: string[], bassMeasures: string[] = [], systemType: SystemStaffTypes): LayoutSystem {
    const { parsedMeasuresData, totalRawWidth } = this.calculateRawWidths(topMeasures, bassMeasures, systemType);

    const targetTotalWidth = this.config.targetWidth - this.config.startX - (this.config.paddingPerMeasure * topMeasures.length);
    const globalScaleRatio = targetTotalWidth / totalRawWidth;

    const layoutMeasures = this.buildLayoutMeasures(parsedMeasuresData, globalScaleRatio, systemType);

    return {
      x: this.config.startX,
      y: 0,
      measures: layoutMeasures
    };
  };

  private calculateRawWidths(topMeasures: string[], bassMeasures: string[], systemType: SystemStaffTypes) {
    let totalRawWidth = 0;
    const parsedMeasuresData = [];

    for (let i = 0; i < topMeasures.length; i++) {
      const parsedTopNotes = measureInputNotesParser(topMeasures[i]);
      const rawTopObj = this.calculateMeasureSpacing(parsedTopNotes);

      let rawBassObj = null;
      let topMeasureRawWidth = rawTopObj.rawWidth;

      if (systemType === "grand" && bassMeasures[i]) {
        const parsedBassNotes = measureInputNotesParser(bassMeasures[i]);
        rawBassObj = this.calculateMeasureSpacing(parsedBassNotes);
        topMeasureRawWidth = Math.max(topMeasureRawWidth, rawBassObj.rawWidth);
      }

      totalRawWidth += topMeasureRawWidth;
      parsedMeasuresData.push({ rawTopObj, rawBassObj, topMeasureRawWidth });
    }

    return { parsedMeasuresData, totalRawWidth };
  };

  private buildLayoutMeasures(parsedMeasuresData: any[], globalScaleRatio: number, systemType: SystemStaffTypes): LayoutMeasure[] {
    let currentX = this.config.startX;
    const layoutMeasures: LayoutMeasure[] = [];

    for (let i = 0; i < parsedMeasuresData.length; i++) {
      const { rawTopObj, rawBassObj, topMeasureRawWidth } = parsedMeasuresData[i];
      const measureStaves: LayoutStaff[] = [];

      // Scale Top Staff
      const justifiedTop = this.scaleMeasureSpacing(rawTopObj, currentX, globalScaleRatio);
      measureStaves.push({
        clef: systemType !== "grand" ? (systemType as StaffTypes) : "treble",
        notesData: justifiedTop
      });

      // Scale Bass Staff
      if (systemType === "grand" && rawBassObj) {
        const justifiedBass = this.scaleMeasureSpacing(rawBassObj, currentX, globalScaleRatio);
        measureStaves.push({
          clef: "bass",
          notesData: justifiedBass
        });
      }

      // Barline and Padding Calculations
      const measureScaledWidth = topMeasureRawWidth * globalScaleRatio;
      const halfPadding = this.config.paddingPerMeasure / 2;

      let barlineX = currentX + measureScaledWidth + halfPadding;
      if (i === parsedMeasuresData.length - 1) barlineX += halfPadding;

      layoutMeasures.push({
        x: currentX,
        width: measureScaledWidth,
        barlineX: barlineX,
        staves: measureStaves
      });

      currentX = barlineX + halfPadding;
    }

    return layoutMeasures;
  }

  private calculateMeasureSpacing(notes: ParsedNote[]) {
    let currentX = 0;
    const positionedNotes: PositionedNote[] = [];

    notes.forEach(note => {
      positionedNotes.push({
        ...note,
        x: currentX
      });

      let noteWidth = noteDurationPositioningMap[note.duration];
      currentX += noteWidth;
    });

    return {
      positionedNotes,
      rawWidth: currentX
    };
  };

  private scaleMeasureSpacing(
    rawSpacing: ReturnType<typeof this.calculateMeasureSpacing>,
    startX: number,
    scaleRatio: number
  ) {
    const scaledNotes: PositionedNote[] = [];

    for (const note of rawSpacing.positionedNotes) {
      scaledNotes.push({
        ...note,
        x: startX + (note.x * scaleRatio)
      });
    }

    const finalMeasureWidth = rawSpacing.rawWidth * scaleRatio;

    return {
      positionedNotes: scaledNotes,
      nextStartX: startX + finalMeasureWidth
    };
  }
}