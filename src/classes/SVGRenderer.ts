import { NAMESPACE } from "../constants";
import { type GlyphDef } from "../glyphs";

export const SVG_HREF = "http://www.w3.org/2000/svg";

type DrawGlyphOptions = {
  yOffset?: number;
  xOffset?: number;
}

type DrawLineOptions = {
  strokeWidth?: number;
  classes?: string | string[];
}

type DrawRectOptions = {
  x?: number;
  y?: number;
  fill?: string;
  rx?: number;
  classes?: string | string[];
}

type DrawCircleOptions = {
  filled?: boolean;
  fill?: string;
  strokeWidth?: number;
  classes?: string | string[];
}

type DrawTextOptions = {
  fontSize?: number;
  anchor?: "start" | "middle" | "end";
  baseline?: "central"
  fill?: string;
  fontWeight?: string;
  classes?: string | string[];
}

export default class SVGRenderer {
  private rootElementRef: HTMLElement;
  svgElementRef: SVGElement;

  // Layers
  private layers: Record<string, SVGGElement> = {};

  // Positioning variables
  private viewBoxWidth: number = 0;
  private viewBoxHeight: number = 0;
  private scale: number = 1;

  // Setups root SVG element and layers, sets attributes for scaling, creates defs for glyphs
  // Does not append to DOM automatically, must be done manually with commitElementsToDOM and passing rootSvgElement
  // from get rootSvgElement().
  // HEIGHT and YOfsset should be set externally, values are calculated internally.
  constructor(rootElementCtx: HTMLElement, useGlyphs?: GlyphDef[]) {
    this.rootElementRef = rootElementCtx;

    this.svgElementRef = document.createElementNS(SVG_HREF, "svg");
    this.svgElementRef.classList.add(`${NAMESPACE}-svg-renderer-root`);

    if (useGlyphs) this.makeGlyphDefs(useGlyphs);
  }

  // Creates SVG defs for all glyphs in GLYPH_ENTRIES, applies global scale and offsets, appends to root SVG
  private makeGlyphDefs(useGlyphs: GlyphDef[]) {
    const defsElement = document.createElementNS(SVG_HREF, "defs");

    useGlyphs.forEach((glyph) => {
      const path = document.createElementNS(SVG_HREF, "path");

      path.setAttribute("id", `glyph-${glyph.name}`);

      path.setAttribute("d", glyph.path);
      path.setAttribute("transform", `translate(0, ${glyph.yOffset})`);

      defsElement.appendChild(path);
    });

    this.svgElementRef.appendChild(defsElement);
  }

  private addNamespacedClassesToElement(classes: string | string[], parent: SVGElement) {
    const classesArr = [classes].flat();
    classesArr.forEach(className => parent.classList.add(`${NAMESPACE}-${className}`));
  }

  setRootSVGSizing(width: number, height: number, scale: number) {
    const scaledWidth = Math.round(width * scale);
    const scaledHeight = Math.round(height * scale);

    this.svgElementRef.setAttribute("viewBox", `0 0 ${width} ${height}`);
    this.svgElementRef.setAttribute("width", scaledWidth.toString());
    this.svgElementRef.setAttribute("height", scaledHeight.toString());

    this.viewBoxWidth = width;
    this.viewBoxHeight = height;
    this.scale = scale;
  }

  setRootSVGHeight(newHeight: number) {
    const scaledHeight = newHeight * this.scale;

    this.svgElementRef.setAttribute("viewBox", `0 0 ${this.viewBoxWidth} ${newHeight}`);
    this.svgElementRef.setAttribute("height", scaledHeight.toString());

    this.viewBoxHeight = newHeight;
  }

  setSVGAutoFill(autoFill: boolean) {
    if (autoFill) {
      this.svgElementRef.style.maxWidth = "100%";
      this.svgElementRef.style.height = "auto";
    }
    else {
      this.svgElementRef.style.maxWidth = "";
      this.svgElementRef.style.height = "";
    };
  }

  /**
   * Creates a layer that is appended to parent element.
   * layerName arg is the key that is appended to the internal list of layers, which
   * can be used in method getLayer() arg. Best to call on construction.
   *
   * @param {string} layerName 
   * @returns {SVGGElement} 
   */
  createLayer(layerName: string): SVGGElement {
    const layer = document.createElementNS(SVG_HREF, "g");
    layer.classList.add(`${NAMESPACE}-${layerName}-layer`);
    this.layers[layerName] = layer;
    this.svgElementRef.appendChild(this.layers[layerName]);

    return layer;
  }

  getLayer(layerName: string): SVGGElement | null {
    const layer = this.layers[layerName];
    return layer ?? null;
  }

  createGroup(className?: string): SVGGElement {
    const g = document.createElementNS(SVG_HREF, "g");
    if (className) g.classList.add(`${NAMESPACE}-${className}`);
    return g;
  }

  commitElementsToDOM(elements: SVGElement[] | SVGElement, parent: HTMLElement | SVGElement = this.rootElementRef) {
    const fragment = document.createDocumentFragment();

    if (Array.isArray(elements)) {
      elements.forEach(element => {
        fragment.appendChild(element);
      });
    }
    else {
      fragment.appendChild(elements);
    }

    parent.appendChild(fragment);
  }

  // ==== Drawing Methods ====

  drawLine(x1: number, y1: number, x2: number, y2: number, parent: SVGElement, options?: DrawLineOptions) {
    const strokeWidth = options?.strokeWidth ?? 1;

    const line = document.createElementNS(SVG_HREF, "line");
    line.setAttribute("x1", x1.toString());
    line.setAttribute("y1", y1.toString());
    line.setAttribute("x2", x2.toString());
    line.setAttribute("y2", y2.toString());
    line.setAttribute("stroke", "currentColor");
    line.setAttribute("stroke-width", strokeWidth.toString());

    if (options?.classes) this.addNamespacedClassesToElement(options.classes, parent);

    parent.appendChild(line);
  }

  drawRect(width: number, height: number, parent: SVGElement, options?: DrawRectOptions): SVGRectElement {
    const rect = document.createElementNS(SVG_HREF, "rect");

    rect.setAttribute("width", width.toString());
    rect.setAttribute("height", height.toString());

    // Default to 0 if not provided
    rect.setAttribute("x", (options?.x ?? 0).toString());
    rect.setAttribute("y", (options?.y ?? 0).toString());

    if (options?.fill) rect.setAttribute("fill", options.fill);
    else rect.setAttribute("fill", "currentColor");

    if (options?.rx) rect.setAttribute("rx", options.rx.toString());

    if (options?.classes) this.addNamespacedClassesToElement(options.classes, rect);

    parent.appendChild(rect);
    return rect;
  }

  drawGlyph(glyphName: string, parent: SVGElement, options?: DrawGlyphOptions) {
    options = {
      xOffset: 0,
      yOffset: 0,
      ...options
    };

    const useElement = document.createElementNS(SVG_HREF, "use");
    useElement.setAttribute("href", `#glyph-${glyphName}`);
    useElement.setAttribute("fill", `currentColor`);

    if (options.xOffset || options.yOffset) useElement.setAttribute("transform", `translate(${options.xOffset}, ${options.yOffset})`);

    parent.appendChild(useElement);
  }

  drawCircle(cx: number, cy: number, radius: number, parent: SVGElement, options?: DrawCircleOptions): SVGCircleElement {
    const circle = document.createElementNS(SVG_HREF, "circle");
    circle.setAttribute("cx", cx.toString());
    circle.setAttribute("cy", cy.toString());
    circle.setAttribute("r", radius.toString());

    if (options?.filled === false) {
      circle.setAttribute("fill", "none");
      circle.setAttribute("stroke", "currentColor");
      circle.setAttribute("stroke-width", (options?.strokeWidth ?? 1.5).toString());
    } else {
      circle.setAttribute("fill", options?.fill ?? "currentColor");
    }

    if (options?.classes) this.addNamespacedClassesToElement(options.classes, circle);

    parent.appendChild(circle);
    return circle;
  }

  drawText(text: string, x: number, y: number, parent: SVGElement, options?: DrawTextOptions): SVGTextElement {
    const textElement = document.createElementNS(SVG_HREF, "text");
    textElement.setAttribute("x", x.toString());
    textElement.setAttribute("y", y.toString());
    textElement.setAttribute("text-anchor", options?.anchor ?? "middle");
    textElement.setAttribute("fill", options?.fill ?? "currentColor");

    if (options?.fontSize) textElement.setAttribute("font-size", options.fontSize + "px")
    if (options?.fontWeight) textElement.setAttribute("font-weight", options.fontWeight);
    if (options?.baseline) textElement.setAttribute("dominant-baseline", options.baseline);
    if (options?.classes) this.addNamespacedClassesToElement(options.classes, textElement);

    textElement.textContent = text;
    parent.appendChild(textElement);
    return textElement;
  }

  destroy() {
    if (this.rootElementRef && this.svgElementRef) {
      if (this.rootElementRef.contains(this.svgElementRef)) {
        this.rootElementRef.removeChild(this.svgElementRef);
      }
    }
  }
}