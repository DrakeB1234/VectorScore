import {
  GUITAR_DIAGRAM_BOTTOM_PADDING,
  GUITAR_DIAGRAM_H_SPACING,
  GUITAR_DIAGRAM_TOP_PADDING,
  GUITAR_DIAGRAM_V_SPACING,
  GUITAR_DOT_RADIUS,
  GUITAR_FRET_COUNT_DEFAULT,
  GUITAR_FONT_SMALL,
  GUITAR_FRET_LABEL_OFFSET_X,
  GUITAR_FRET_SPACING,
  GUITAR_FONT_BASE,
  GUITAR_LABEL_HEIGHT,
  GUITAR_MARKER_RADIUS,
  GUITAR_NUT_SPACE_ABOVE,
  GUITAR_NUT_THICKNESS,
  GUITAR_NUT_X_OFFSET,
  GUITAR_STRING_COUNT_DEFAULT,
  GUITAR_STRING_LABEL_HEIGHT,
  GUITAR_STRING_LABEL_OFFSET,
  GUITAR_STRING_SPACING,
} from "../constants";
import { calculateStartFret, createStateStrings, parseFingersEntry, parseFretsEntry } from "../helpers/guitarHelpers";
import type { GuitarBarreDef, GuitarChordDrawOptions, GuitarStringState } from "../types";
import SVGRenderer from "./SVGRenderer";

export type GuitarChordOptions = {
  width?: number;
  inlineChordsAmount?: number;
  scale?: number;
  stringCount?: number;
  fretCount?: number;
  stringLabels?: string[];
  color?: string;
  backgroundColor?: string;
};

type ChordEntry = {
  gElement: SVGGElement;
  strings: GuitarStringState[];
  startFret: number;
  label?: string;
  barres?: GuitarBarreDef[];
  xPos: number;
  yPos: number;
};

type BarreEntry = {
  fromIndex: number;
  toIndex: number;
  fret: number;
  startingFret: number;
  finger?: number;
}

export default class GuitarChord {
  private svgRendererInstance: SVGRenderer;
  private options: Required<GuitarChordOptions>;

  private chordEntries: ChordEntry[] = [];
  private cursorX: number = 0;
  private cursorY: number = 0;

  private readonly diagramWidth: number;
  private readonly diagramHeight: number;
  private readonly gridTopY: number;
  private readonly rowHeight: number;

  /**
   * Creates an instance of a GuitarChord diagram renderer.
   *
   * @param rootElementCtx - The element (div) reference that the chord diagram(s) will be appended to.
   * @param options - Optional configuration. Can adjust total width, scale, string/fret count, and coloring.
   * All config options are in the type GuitarChordOptions.
  */
  constructor(rootElementCtx: HTMLElement, options?: GuitarChordOptions) {
    this.options = {
      stringCount: GUITAR_STRING_COUNT_DEFAULT,
      fretCount: GUITAR_FRET_COUNT_DEFAULT,
      stringLabels: [],
      inlineChordsAmount: 2,
      scale: 1,
      color: "black",
      backgroundColor: "transparent",
      ...options
    } as Required<GuitarChordOptions>;

    this.diagramWidth = (this.options.stringCount - 1) * GUITAR_STRING_SPACING;
    this.diagramHeight = this.options.fretCount * GUITAR_FRET_SPACING;
    this.gridTopY = GUITAR_LABEL_HEIGHT + GUITAR_NUT_SPACE_ABOVE;
    this.rowHeight = this.gridTopY + this.diagramHeight + GUITAR_DIAGRAM_BOTTOM_PADDING;

    if (options?.width) this.options.width = options.width
    else this.options.width = (this.diagramWidth + GUITAR_DIAGRAM_H_SPACING) * this.options.inlineChordsAmount;

    if (this.options.stringLabels.length >= 1) {
      this.rowHeight += GUITAR_STRING_LABEL_HEIGHT + GUITAR_STRING_LABEL_OFFSET;
    }

    if (this.diagramWidth > this.options.width) {
      throw new Error(`The configured width (${this.options.width}) is too small to fit a single ${this.options.stringCount}-string diagram (needs at least ${this.diagramWidth}). Increase 'width'.`);
    }

    // Create the SVGRenderer instance with its options passed into this class.
    // The 'staff' layer is used for chord grids, and 'notes' for markers/dots - reusing
    // SVGRenderer's generic layers rather than introducing guitar-specific ones.
    this.svgRendererInstance = new SVGRenderer(rootElementCtx, {
      width: this.options.width,
      height: 100,
      scale: this.options.scale,
      staffColor: this.options.color,
      staffBackgroundColor: this.options.backgroundColor,
      useGlyphs: []
    });
    const rootSvgElement = this.svgRendererInstance.rootSvgElement;

    this.svgRendererInstance.setTotalRootSvgHeight(this.rowHeight);
    this.svgRendererInstance.applySizingToRootSvg();
    this.svgRendererInstance.commitElementsToDOM(rootSvgElement);
  }

  private getDotsToHide(barres?: GuitarBarreDef[]): Set<string> {
    const hiddenDots = new Set<string>();
    if (!barres) return hiddenDots;

    barres.forEach(barre => {
      const startIdx = barre.fromString - 1;
      const endIdx = barre.toString - 1;

      for (let i = startIdx; i <= endIdx; i++) {
        hiddenDots.add(`${i}-${barre.fret}`);
      }
    });

    return hiddenDots;
  }

  private drawFretDots(frets: string[], fingers: string[], startFret: number, hiddenDots: Set<string>, group: SVGGElement) {
    const markerY = this.gridTopY - GUITAR_NUT_SPACE_ABOVE / 2;
    for (let i = 0; i < this.options.stringCount; i++) {
      const x = i * GUITAR_STRING_SPACING;
      const fret = frets[i].toLowerCase();
      const finger = fingers[i];

      // Draw a X for 'muted' string
      if (fret === "x") {
        this.svgRendererInstance.drawLine(x - GUITAR_MARKER_RADIUS, markerY - GUITAR_MARKER_RADIUS, x + GUITAR_MARKER_RADIUS, markerY + GUITAR_MARKER_RADIUS, group);
        this.svgRendererInstance.drawLine(x - GUITAR_MARKER_RADIUS, markerY + GUITAR_MARKER_RADIUS, x + GUITAR_MARKER_RADIUS, markerY - GUITAR_MARKER_RADIUS, group);
      }
      // Draw a outlined circle for 'open' string
      else if (fret === "0") {
        this.svgRendererInstance.drawCircle(x, markerY, GUITAR_MARKER_RADIUS, group, { filled: false });
      }
      else {

        const absoluteFret = parseInt(fret, 36);

        // Skip rendering this specific dot if it is covered by a barre
        if (hiddenDots.has(`${i}-${absoluteFret}`)) {
          continue;
        }

        // Fretted note - position relative to the diagram's visible fret range
        const relativeFret = absoluteFret - startFret + 1; // Parse int method used due to alphanumeric numbers being used
        if (relativeFret < 1 || relativeFret > this.options.fretCount) {
          throw new Error(`Fret ${fret} on string ${i + 1} is outside the visible range (${startFret}-${startFret + this.options.fretCount - 1}). Adjust 'startFret' or 'fretCount'.`);
        }

        const dotY = this.gridTopY + (relativeFret - 0.5) * GUITAR_FRET_SPACING;
        this.svgRendererInstance.drawCircle(x, dotY, GUITAR_DOT_RADIUS, group, {
          classes: "guitar-fret-dot"
        });

        if (finger !== "0") {
          const fingerTextFill = this.options.backgroundColor === "transparent" ? "white" : this.options.backgroundColor;
          this.svgRendererInstance.drawText(finger, x, dotY + GUITAR_FONT_SMALL / 3, group, {
            fontSize: GUITAR_FONT_SMALL,
            fill: fingerTextFill,
            classes: "guitar-text-small"
          });
        }
      }
    }
  }

  private drawStringLabels(group: SVGElement, stringLabels?: string[]) {
    if (!stringLabels || stringLabels.length === 0) return;

    const radius = GUITAR_DOT_RADIUS;
    const yPos = this.rowHeight - radius - GUITAR_DIAGRAM_BOTTOM_PADDING;

    for (let i = 0; i < this.options.stringCount; i++) {
      const labelText = stringLabels[i];
      if (!labelText) continue;

      const x = i * GUITAR_STRING_SPACING;
      const labelYPos = yPos + radius / 2;

      // this.svgRendererInstance.drawCircle(x, yPos, radius, group, { filled: false });
      this.svgRendererInstance.drawText(labelText, x, labelYPos, group, {
        fontSize: GUITAR_FONT_SMALL,
        classes: "guitar-text-small"
      });
    }
  }

  // Passed in 'from' and 'to' index values are zero-based
  private drawBarre(group: SVGElement, options: BarreEntry) {
    const fret = options.fret;

    if (options.fromIndex < 0 || options.toIndex >= this.options.stringCount || options.fromIndex >= options.toIndex) {
      throw new Error(`Barre fret error: Invalid string range ${options.fromIndex + 1}:${options.toIndex + 1}.`);
    }

    if (fret < options.startingFret || fret > options.startingFret + (this.options.fretCount - 1)) {
      throw new Error(`Barre fret error: ${options.fret} is outside the visible range.`);
    }

    const relativeFret = fret - options.startingFret;

    const startX = options.fromIndex * GUITAR_STRING_SPACING;
    const endX = options.toIndex * GUITAR_STRING_SPACING;
    const height = GUITAR_DOT_RADIUS * 2;
    const width = (endX - startX) + height;

    const y = (this.gridTopY + GUITAR_DOT_RADIUS / 2) + (GUITAR_FRET_SPACING * relativeFret);

    const labelY = this.gridTopY + (GUITAR_FRET_SPACING * relativeFret) + GUITAR_DOT_RADIUS * 2;

    this.svgRendererInstance.drawRect(width, height, group, {
      x: startX - GUITAR_DOT_RADIUS,
      y: y,
      rx: GUITAR_DOT_RADIUS,
      classes: "guitar-barre"
    });

    if (options.finger) {
      const fingerTextFill = this.options.backgroundColor === "transparent" ? "white" : this.options.backgroundColor;
      this.svgRendererInstance.drawText(options.finger.toString(), (startX + endX) / 2, labelY, group, {
        fontSize: GUITAR_FONT_SMALL,
        fill: fingerTextFill,
        classes: "guitar-text-small"
      });
    }
  }

  // Builds a single chord diagram's group element: grid, nut/fret-position label, and per-string markers.
  private renderChordDiagram(frets: string[], fingers: string[], options?: GuitarChordDrawOptions): SVGGElement {
    const group = this.svgRendererInstance.createGroup("chord");
    const startFret = options?.startFret ?? 1;

    if (options?.label) {
      this.svgRendererInstance.drawText(options.label, this.diagramWidth / 2, GUITAR_LABEL_HEIGHT - 5, group, {
        fontSize: GUITAR_FONT_BASE,
        fontWeight: "bold",
        classes: "guitar-text-base"
      });
    }

    // Fret lines (fretCount + 1 lines make up fretCount cells). The first line is drawn as a thicker
    // nut when the diagram starts at the first fret, otherwise a normal line plus a "<n>fr" side label.
    for (let i = 0; i <= this.options.fretCount; i++) {
      const y = this.gridTopY + i * GUITAR_FRET_SPACING;

      if (i === 0 && startFret === 1) {
        this.svgRendererInstance.drawRect(this.diagramWidth + (GUITAR_NUT_X_OFFSET * 2), GUITAR_NUT_THICKNESS, group, {
          x: -GUITAR_NUT_X_OFFSET,
          y: y - GUITAR_NUT_THICKNESS / 2
        });
      } else {
        this.svgRendererInstance.drawLine(0, y, this.diagramWidth, y, group);
      }
    }

    if (startFret > 1) {
      this.svgRendererInstance.drawText(`${startFret}fr`, this.diagramWidth + GUITAR_DOT_RADIUS + GUITAR_FRET_LABEL_OFFSET_X, this.gridTopY + GUITAR_FRET_SPACING / 2 + 4, group, {
        anchor: "start",
        fontSize: GUITAR_FONT_SMALL,
        fontWeight: "bold",
        classes: "guitar-text-small"
      });
    }

    // String lines
    for (let i = 0; i < this.options.stringCount; i++) {
      const x = i * GUITAR_STRING_SPACING;
      this.svgRendererInstance.drawLine(x, this.gridTopY, x, this.gridTopY + this.diagramHeight, group);
    }

    const hiddenDots = this.getDotsToHide(options?.barres);
    this.drawFretDots(frets, fingers, startFret, hiddenDots, group);

    if (this.options.stringLabels.length >= 1) {
      this.drawStringLabels(group, this.options.stringLabels);
    };

    options?.barres?.forEach(barre => {
      // Index values subtract one, as user input is not zero-indexed
      this.drawBarre(group, {
        fromIndex: barre.fromString - 1,
        toIndex: barre.toString - 1,
        fret: barre.fret,
        finger: barre.finger,
        startingFret: startFret
      });
    });

    return group;
  }

  // Repositions every existing chord diagram from scratch, in order, wrapping rows as needed.
  // Called after any add/remove/change so the layout never has to track incremental deltas.
  private relayoutChords() {
    // Start with initial offset of first chord (prevent overflowing)
    this.cursorX = GUITAR_DOT_RADIUS;
    this.cursorY = GUITAR_DIAGRAM_TOP_PADDING;

    if (this.chordEntries.length === 1) {
      const entry = this.chordEntries[0];
      this.cursorX = (this.options.width / 2) - (this.diagramWidth / 2);
      entry.xPos = this.cursorX;
      entry.yPos = this.cursorY;
      entry.gElement.setAttribute("transform", `translate(${this.cursorX}, ${this.cursorY})`);

    }
    else {
      this.chordEntries.forEach((entry, i) => {
        if (i > 0 && (this.cursorX + this.diagramWidth) > this.options.width) {
          this.cursorX = GUITAR_DOT_RADIUS;
          this.cursorY += this.rowHeight + GUITAR_DIAGRAM_V_SPACING;
        }

        entry.xPos = this.cursorX;
        entry.yPos = this.cursorY;
        entry.gElement.setAttribute("transform", `translate(${this.cursorX}, ${this.cursorY})`);

        this.cursorX += this.diagramWidth + GUITAR_DIAGRAM_H_SPACING;
      });
    }

    const totalHeight = this.cursorY + this.rowHeight;
    this.svgRendererInstance.setTotalRootSvgHeight(totalHeight);
    this.svgRendererInstance.applySizingToRootSvg();
  }

  /**
   * Adds a new chord diagram. Diagrams are placed left-to-right in the order added, wrapping to a
   * new row automatically once the configured width is exceeded.
   *
   * @param frets - A string, with each value being ordered low-to-high (e.g. first position in string 0 is the low E string)
   * * `x` - muted string
   * * `0` - open string
   * * `1...n` - fretted at the given absolute fret number (e.g. `3`)
   * @param fingers - A string, with each value being ordered low-to-high (e.g. first position in string 0 is the low E string)
   * * `0` - No finger labeled
   * * `1...n` - Finger labeled as number provided
   * 
   * @param options - Optional per-chord settings: `startFret` (default `1`, for diagrams higher up the neck)
   * and `label` (a chord name drawn above the diagram).
   * 
   * @returns The index of the newly added chord, for later use with the CRUD-by-index methods.
   * 
   * @throws {Error} If fret or finger's string length doesn't match the configured string count.
   *
   * @example
   * // Draw an open C major chord
   * guitarChord.addChord("x32010", "032010", { label: "C" });
  */
  addChord(frets: string, fingers: string, options?: GuitarChordDrawOptions): number {
    const fretParts = parseFretsEntry(frets);
    const fingerParts = parseFingersEntry(fingers);

    if (fretParts.length !== this.options.stringCount) throw new Error("Invalid number of frets provided, entries should be equal to number of strings in diagram.");
    if (fingerParts.length !== this.options.stringCount) throw new Error("Invalid number of fingers provided, entries should be equal to number of strings in diagram.");

    const startFret = options?.startFret ?? calculateStartFret(fretParts, this.options.fretCount);
    const label = options?.label;
    const barres = options?.barres;

    const resolvedOptions = { startFret, label, barres };

    const gElement = this.renderChordDiagram(fretParts, fingerParts, resolvedOptions);
    const chordsLayer = this.svgRendererInstance.getLayerByName("notes");
    this.svgRendererInstance.commitElementsToDOM(gElement, chordsLayer);

    this.chordEntries.push({
      gElement,
      strings: createStateStrings(fretParts, fingerParts),
      ...resolvedOptions,
      xPos: 0,
      yPos: 0
    });

    this.relayoutChords();

    return this.chordEntries.length - 1;
  }

  /**
   * Replaces the chord diagram at the specified index with a new one, in place.
   * 
  * @param frets - A string, with each value being ordered low-to-high (e.g. first position in string 0 is the low E string)
   * * `x` - muted string
   * * `0` - open string
   * * `1...n` - fretted at the given absolute fret number (e.g. `3`)
   * @param fingers - A string, with each value being ordered low-to-high (e.g. first position in string 0 is the low E string)
   * * `0` - No finger labeled
   * * `1...n` - Finger labeled as number provided
   * 
   * @param chordIndex - The index of the chord to replace (as returned by addChord).
   * 
   * @param options - Optional per-chord settings, see addChord.
   * 
   * @returns void
   * 
   * @throws {Error} If the index is out of bounds, or if chordDef is invalid (see addChord).
   *
   * @example
   * // Change chord at index 0 to a D major chord
   * guitarChord.modifyChordByIndex("xx0232", "000132", 0, { label: "D" });
   *   
  */
  modifyChordByIndex(frets: string, fingers: string, chordIndex: number, options?: GuitarChordDrawOptions) {
    if (chordIndex >= this.chordEntries.length || chordIndex < 0) throw new Error("Chord index was out of bounds.");

    const fretParts = parseFretsEntry(frets);
    const fingerParts = parseFingersEntry(fingers);

    if (fretParts.length !== this.options.stringCount) throw new Error("Invalid number of frets provided, entries should be equal to number of strings in diagram.");
    if (fingerParts.length !== this.options.stringCount) throw new Error("Invalid number of fingers provided, entries should be equal to number of strings in diagram.");

    const oldEntry = this.chordEntries[chordIndex];

    // "label" in options distinguishes "key not passed -> keep old" from "key passed as '' -> clear it"
    const label = options && "label" in options
      ? (options.label === "" ? undefined : options.label)
      : oldEntry.label;

    const startFret = options?.startFret ?? calculateStartFret(fretParts, this.options.fretCount);
    const resolvedOptions = { ...options, label, startFret };

    const gElement = this.renderChordDiagram(fretParts, fingerParts, resolvedOptions);
    const chordsLayer = this.svgRendererInstance.getLayerByName("notes");
    chordsLayer.replaceChild(gElement, oldEntry.gElement);

    this.chordEntries[chordIndex] = {
      gElement,
      strings: createStateStrings(fretParts, fingerParts),
      ...resolvedOptions,
      xPos: oldEntry.xPos,
      yPos: oldEntry.yPos
    };

    this.relayoutChords();
  }

  /**
   * Removes the chord diagram at the specified index. Remaining chords are re-flowed to close the gap.
   * @param chordIndex - The index of the chord to remove.
   * @returns void
   * @throws {Error} If the index is out of bounds.
  */
  removeChordByIndex(chordIndex: number) {
    if (chordIndex >= this.chordEntries.length || chordIndex < 0) throw new Error("Chord index was out of bounds.");

    const entry = this.chordEntries[chordIndex];
    entry.gElement.remove();
    this.chordEntries.splice(chordIndex, 1);

    this.relayoutChords();
  }

  /**
   * Removes all chord diagrams and resets internal positioning.
   * @returns void
  */
  clearAllChords() {
    this.svgRendererInstance.getLayerByName("notes").replaceChildren();
    this.chordEntries = [];
    this.cursorX = 0;
    this.cursorY = 0;

    this.svgRendererInstance.setTotalRootSvgHeight(this.rowHeight);
    this.svgRendererInstance.applySizingToRootSvg();
  }

  /**
   * * Used to automatically determine options for creating barre lines.
   * * The returned value then can be used in addChord and modifyChord methods.
   * @returns GuitarBarreDef[]
  */
  determineBarreOptions(frets: string, fingers: string, barreFrets: number[]): GuitarBarreDef[] {
    const fretParts = parseFretsEntry(frets);
    const fingerParts = parseFingersEntry(fingers);

    const barres: GuitarBarreDef[] = [];

    barreFrets.forEach(targetFret => {
      if (targetFret === 0) return;

      let highestFinger = 0;
      const fretIndexes: number[] = [];
      const fingerOccurrences: Record<number, number> = {};

      for (let i = 0; i < fretParts.length; i++) {
        if (fretParts[i].toLowerCase() === 'x') continue;

        // Use base-36 parsing to convert 'a' to 10, 'b' to 11, etc.
        const currentFret = parseInt(fretParts[i], 36);
        const finger = Number(fingerParts[i]);

        if (currentFret === targetFret) {
          if (!fingerOccurrences[finger]) fingerOccurrences[finger] = 1;
          else fingerOccurrences[finger] += 1;

          highestFinger = Math.max(finger, highestFinger);
          fretIndexes.push(i + 1);
        }
      }
      fretIndexes.sort();

      let mostOccurringFinger = 0;
      let maxCount = 0;
      for (const [fingerStr, count] of Object.entries(fingerOccurrences)) {
        if (count > maxCount) {
          maxCount = count;
          mostOccurringFinger = Number(fingerStr);
        }
      }
      const fromString = fretIndexes[0];
      const toString = fretIndexes.at(-1);

      if (fretIndexes.length > 1 && toString) {
        barres.push({
          fret: targetFret,
          fromString: fromString,
          toString: toString,
          finger: mostOccurringFinger
        });
      }
    });

    return barres;
  }

  /**
   * Removes the root svg element and cleans up arrays.
   * @returns void
  */
  destroy() {
    this.chordEntries = [];
    this.svgRendererInstance.destroy();
  }
}