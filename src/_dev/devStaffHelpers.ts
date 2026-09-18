import type SVGRenderer from "../classes/SVGRenderer";
import { STAFF_LINE_COUNT, STAFF_LINE_SPACING } from "../constants";
import type { SystemStaffTypes } from "./DevStaff";
import { DEV_GLYPH_CLEF_MAP, drawDevGlyph } from "./devGlyphs";

export type StaffTypes = "treble" | "bass" | "alto";

export const BASE_STAFF_PADDING = 36;
export const GRAND_STAFF_SPACING = 40;

export function drawStaff(
  systemStaffType: SystemStaffTypes,
  svgWidth: number,
  svgRendererRef: SVGRenderer,
) {
  const newStaffLayer = svgRendererRef.createLayer("staff");
  const staffGroup = svgRendererRef.createGroup("staff");
  let totalHeight = 0;
  let totalYOffset = 0;

  if (systemStaffType === "grand") {
    let currentY = 0;

    const staffLinesObjTreble = drawStaffLines(svgRendererRef, staffGroup, svgWidth, 0);
    totalHeight += staffLinesObjTreble.height;

    drawClefOnStaff(svgRendererRef, staffGroup, "treble");

    currentY += staffLinesObjTreble.height + GRAND_STAFF_SPACING;
    const staffLinesObjBass = drawStaffLines(svgRendererRef, staffGroup, svgWidth, currentY);
    totalHeight += staffLinesObjBass.height + GRAND_STAFF_SPACING;

    drawClefOnStaff(svgRendererRef, staffGroup, "bass", { y: currentY });
  }
  else {
    const staffType = systemStaffType as StaffTypes;

    const staffObj = drawStaffLines(svgRendererRef, staffGroup, svgWidth, 0);
    totalHeight += staffObj.height;

    drawClefOnStaff(svgRendererRef, staffGroup, staffType);
  }

  // Apply padding on top / bottom of new staff
  totalHeight += BASE_STAFF_PADDING * 2;
  totalYOffset += BASE_STAFF_PADDING;

  newStaffLayer.setAttribute("transform", `translate(0, ${totalYOffset})`);
  newStaffLayer.appendChild(staffGroup);

  return {
    staffHeight: totalHeight,
    staffLayer: newStaffLayer
  }
}

export function drawStaffLines(
  svgRendererRef: SVGRenderer,
  staffGroup: SVGGElement,
  width: number,
  startY: number,
  lineSpacing: number = STAFF_LINE_SPACING
) {

  let yCurrent = startY;

  for (let i = 0; i < STAFF_LINE_COUNT; i++) {
    svgRendererRef.drawLine(0, yCurrent, width, yCurrent, staffGroup);
    yCurrent += lineSpacing;
  }

  return {
    height: (STAFF_LINE_COUNT - 1) * lineSpacing,
  };
}

// Doesn't rely on preset offset for clefs, instead relies on STAFF_PADDING to handle overflow
// TEMP, AVOIDS USING SVGRENDERER METHOD FOR NEW DEV VERSION
export function drawClefOnStaff(
  svgRendererRef: SVGRenderer,
  staffGroup: SVGGElement,
  staffType: StaffTypes,
  offsets?: {
    x?: number,
    y?: number,
  }
) {

  const xOffset = offsets?.x ?? 0;
  const yOffset = offsets?.y ?? 0;

  const glyphEntry = DEV_GLYPH_CLEF_MAP[staffType];
  drawDevGlyph(glyphEntry, staffGroup, {
    y: yOffset,
    x: xOffset
  });

  // svgRendererRef.drawGlyph(clefGlpyh, staffGroup);
}