import type SVGRenderer from "../classes/SVGRenderer";
import type { StaffStrategy } from "../strategies/StrategyInterface";
import type { AccidentalType, KeySignatureDef, NoteNames, StaffTypes } from "../types";

const KEY_SIG_ACCIDENTAL_SPACING = 8;
export const KEY_SIGNATURE_START_X = 40;

export const KEY_SIGNATURE_ORDER: Record<AccidentalType, NoteNames[]> = {
  sharp: ["F", "C", "G", "D", "A", "E", "B"],
  flat: ["B", "E", "A", "D", "G", "C", "F"],
};

export const KEY_SIGNATURES: Record<string, KeySignatureDef> = {
  C: { type: "sharp", count: 0 },
  G: { type: "sharp", count: 1 },
  D: { type: "sharp", count: 2 },
  A: { type: "sharp", count: 3 },
  E: { type: "sharp", count: 4 },
  B: { type: "sharp", count: 5 },
  "F#": { type: "sharp", count: 6 },
  F: { type: "flat", count: 1 },
  Bb: { type: "flat", count: 2 },
  Eb: { type: "flat", count: 3 },
  Ab: { type: "flat", count: 4 },
  Db: { type: "flat", count: 5 },
  Gb: { type: "flat", count: 6 },
};

// per-clef, in the order F C G D A E B / B E A D G C F
export const KEY_SIG_OCTAVES: Record<StaffTypes, Record<AccidentalType, number[]>> = {
  treble: {
    sharp: [5, 5, 5, 5, 4, 5, 4], // F5 C5 G5 D5 A4 E5 B4
    flat: [4, 5, 4, 5, 4, 5, 4], // B4 E5 A4 D5 G4 C5 F4
  },
  bass: {
    sharp: [3, 3, 3, 3, 2, 3, 2], // F3 C3 G3 D3 A2 E3 B2
    flat: [2, 3, 2, 3, 2, 3, 3], // B2 E3 A2 D3 G2 C3 F3
  },
  alto: {
    sharp: [4, 4, 4, 4, 3, 4, 4], // F5 C5 G5 D5 A4 E5 B4
    flat: [4, 5, 4, 5, 4, 5, 4], // B4 E5 A4 D5 G4 C5 F4
  },
  grand: { sharp: [], flat: [] },
};

export function parseKeySignature(key: string): KeySignatureDef {
  const def = KEY_SIGNATURES[key];
  if (!def) throw new Error(`Unknown key signature "${key}". Valid keys: ${Object.keys(KEY_SIGNATURES).join(", ")}`);
  return def;
}

export function drawKeySignature(
  svgRenderer: SVGRenderer,
  strategy: StaffStrategy,
  key: string,
  startX: number
): number {
  const keyDef = parseKeySignature(key);
  if (keyDef.count === 0) return 0;

  const glyph = keyDef.type === "sharp" ? "ACCIDENTAL_SHARP" : "ACCIDENTAL_FLAT";
  const staffLayer = svgRenderer.getLayerByName("staff");
  const yPositionGroups = strategy.getKeySignatureYPositions(keyDef.type, keyDef.count);

  yPositionGroups.forEach(group => {
    group.forEach((yPos, i) => {
      svgRenderer.drawGlyph(glyph, staffLayer, { xOffset: startX + i * KEY_SIG_ACCIDENTAL_SPACING, yOffset: yPos });
    });
  });

  return keyDef.count * KEY_SIG_ACCIDENTAL_SPACING;
}