import type { NoteAccidentals, NoteArticulations, NoteDurations } from "./helpers/inputHelpers";
import type { ClefTypes } from "./types";

export type GlyphDef = {
  name: string;
  path: string;
  // Width + Height is from Figma, rounded to nearest whole number
  glyphWidth: number;
  glyphHeight: number;
  yOffset: number;
};

export function getNoteheadGlyphByDuration(duration: NoteDurations) {
  switch (duration) {
    case "w": return NOTEHEAD_WHOLE;
    case "h": return NOTEHEAD_HALF;
    default: return NOTEHEAD_BLACK;
  };
};

export function getRestGlyphByDuration(duration: NoteDurations) {
  switch (duration) {
    case "w": return REST_WHOLE;
    case "h": return REST_HALF;
    case "q": return REST_QUARTER;
    case "e": return REST_EIGHTH;
    case "s": return REST_SIXTEENTH;
    case "t": return REST_THIRTY_SECOND;
    default: {
      throw new Error("Unable to retrieve rest glyph for given value " + duration);
    };
  };
};

export function getAccidentalGlyph(accidental: NoteAccidentals | "sharp" | "flat") {
  switch (accidental) {
    case "#": return ACCIDENTAL_SHARP;
    case "sharp": return ACCIDENTAL_SHARP;
    case "##": return ACCIDENTAL_DOUBLESHARP;
    case "b": return ACCIDENTAL_FLAT;
    case "flat": return ACCIDENTAL_FLAT;
    case "bb": return ACCIDENTAL_DOUBLEFLAT;
    case "n": return ACCIDENTAL_NATURAL;
    default: {
      throw new Error("Unable to retrieve accidental glyph for given value " + accidental);
    };
  };
};

export function getArticulationGlyph(artic: NoteArticulations) {
  switch (artic) {
    case "accent": return ARTIC_ACCENT;
    case "marcato": return ARTIC_MARCATO;
    case "tenuto": return ARTIC_TENUTO;
    case "staccato": return ARTIC_STACCATO;
    case "fermata": return ARTIC_FERMATA;
    default: {
      throw new Error("Unable to retrieve articulation glyph for given value " + artic);
    };
  }
}

export function getClefGlyph(clef: ClefTypes) {
  switch (clef) {
    case "treble": return CLEF_TREBLE;
    case "bass": return CLEF_BASS;
    case "alto": return CLEF_ALTO;
    default: {
      throw new Error("Unable to retrieve clef glyph for given value " + clef);
    };
  };
};

export function getTimeSigGlyph(number: number) {
  switch (number) {
    case 0: return TIMESIG_0
    case 1: return TIMESIG_1
    case 2: return TIMESIG_2
    case 3: return TIMESIG_3
    case 4: return TIMESIG_4
    case 5: return TIMESIG_5
    case 6: return TIMESIG_6
    case 7: return TIMESIG_7
    case 8: return TIMESIG_8
    case 9: return TIMESIG_9
    default: {
      throw new Error("Unable to retrieve time signature glyph for given value " + number);
    };
  }
};

export function getFlagGlyph(duration: Extract<NoteDurations, "s" | "e" | "t">, isDown: boolean) {
  switch (duration) {
    case "e": {
      if (isDown) return FLAG_EIGHTH_DOWN
      return FLAG_EIGHTH_UP
    }
    case "s": {
      if (isDown) return FLAG_SIXTEENTH_DOWN
      return FLAG_SIXTEENTH_UP
    }
    case "t": {
      if (isDown) return FLAG_THIRTY_SECOND_DOWN
      return FLAG_THIRTY_SECOND_UP
    }
    default: {
      throw new Error("Unable to retrieve flag glyph for given value " + duration);
    };
  }
}

export const NOTEHEAD_WHOLE: GlyphDef = {
  name: "NOTEHEAD_WHOLE",
  path: "M7.8 9.5c1.6 0 3-.3 3-2.3 0-1-.7-3.5-1.3-4.6q-.7-1.4-2.4-1.3-1 0-1.7.2-1.5.5-1.3 2c0 1.1.8 3.7 1.3 4.7q.8 1.4 2.4 1.3M7.5 0c5.5 0 7.4 2.8 7.4 5.4s-1.9 5.4-7.4 5.4S0 8 0 5.4 2 0 7.5 0",
  glyphWidth: 15,
  glyphHeight: 11,
  yOffset: -5.5
};
export const NOTEHEAD_HALF: GlyphDef = {
  name: "NOTEHEAD_HALF",
  path: "M3 8.7c1.8 0 8.6-3.4 8.6-5.4Q11.6 2 10 2C8.1 2 1.4 5.4 1.4 7.4c0 .3.3 1.4 1.6 1.4M8.5 0C11 0 13 1.3 13 3.7c0 3.5-4.4 6.9-8.5 6.9C1.2 10.6 0 8.6 0 7c0-3.8 4.6-7 8.5-7",
  glyphWidth: 13,
  glyphHeight: 11,
  yOffset: -5
};
export const NOTEHEAD_BLACK: GlyphDef = {
  name: "NOTEHEAD_BLACK",
  path: "M0 7c0-3.7 4.6-7 8.5-7C11 0 13 1.3 13 3.7c0 3.5-4.4 6.9-8.5 6.9C1.2 10.6 0 8.6 0 7",
  glyphWidth: 13,
  glyphHeight: 11,
  yOffset: -5
};

export const REST_WHOLE: GlyphDef = {
  name: "REST_WHOLE",
  path: "M.6 0h11.8q.6 0 .6.6v4.3q0 .5-.6.5H.6L0 5V.6Q0 0 .6 0",
  glyphWidth: 13,
  glyphHeight: 6,
  yOffset: 20
};
export const REST_HALF: GlyphDef = {
  name: "REST_HALF",
  path: REST_WHOLE.path,
  glyphWidth: 14,
  glyphHeight: 6,
  yOffset: 15
};
export const REST_QUARTER: GlyphDef = {
  name: "REST_QUARTER",
  path: "M9.2 22.7v.1q.3.2.2.3l-.1.4-.4.2-.3-.1-1.6-1q-.5-.4-1.3-.4-2 .2-2.2 2.4.1 1.1.3 1.2l1.4 2.6v.3q0 .3-.2.5h-.2l-.5-.2-3.9-5q-.4-.7-.4-1.6a3.7 3.7 0 0 1 4.6-3.6L.2 13.2 0 13v-.3l.1-.4 4-6.1.2-.5-.1-.5-3-4.1Q1 1 1 .5l.2-.4.3-.1.4.2L8.4 9l.1.3v.7l-4.2 6-.1.4v.2L9 22.4z",
  glyphWidth: 9,
  glyphHeight: 30,
  yOffset: 4
};
export const REST_EIGHTH: GlyphDef = {
  name: "REST_EIGHTH",
  path: "M10.7 0q.3.3.3.5v.2L5.4 18.4l-1-.4L8.8 3.8Q6.9 6.2 4 6.3c-1.9 0-4-1-4-3.2a2.9 2.9 0 1 1 5 2q1-.3 1.8-.9C8.6 3 9.8.6 10 .3q.1-.3.5-.3z",
  glyphWidth: 11,
  glyphHeight: 18,
  yOffset: 12

};
export const REST_SIXTEENTH: GlyphDef = {
  name: "REST_SIXTEENTH",
  path: "M13.7.7 5.9 28.4l-1.1-.2 4-14.6a6 6 0 0 1-4.7 2.6q-1.2.1-2.2-.4-1.7-.7-1.9-2.6c0-1.6 1.2-3 2.8-3s3 1.2 3 2.8q0 1-.8 2c2-.6 4.4-3.2 5-5l1.7-6.4A6 6 0 0 1 7 6.2c-2 0-4-.7-4.2-3a3 3 0 0 1 2.8-3c1.6 0 3 1.3 3 2.8q0 1.1-.7 2c2.2-.6 3.8-2.8 4.7-4.7q.2-.3.6-.3h.2q.3.2.3.5z",
  glyphWidth: 14,
  glyphHeight: 28,
  yOffset: 12
};
export const REST_THIRTY_SECOND: GlyphDef = {
  name: "REST_THIRTY_SECOND",
  path: "M6 16.4c-1.8 0-3.6-1.1-3.6-3 0-1.6 1.3-2.8 2.8-2.8 1.6 0 3 1 3 2.6q0 1.2-.7 2c2.3-.6 4-3.4 4.8-5.4l1.5-6.4a6 6 0 0 1-4.6 2.8h-.6c-1.8-.1-3.6-1-3.6-3 0-1.7 1.3-3 2.8-3q2.6.2 2.8 2.8.2 1-.6 1.9c2-.5 3.8-2.9 4.6-4.5q0-.4.5-.4h.1q.4.2.4.5v.2l-9.3 38-1-.3 3.6-14.8a6 6 0 0 1-5 2.8c-2.1 0-3.9-1-3.9-3 0-1.7 1.3-2.9 2.8-2.9 1.6 0 2.9 1 2.9 2.7A3 3 0 0 1 5 25c2.3-.7 3.9-3.3 4.7-5.4l1.5-6A6 6 0 0 1 6 16.3",
  glyphWidth: 16,
  glyphHeight: 39,
  yOffset: 2
};

export const ACCIDENTAL_SHARP: GlyphDef = {
  name: "ACCIDENTAL_SHARP",
  path: "M3.1 10.4V17l3.6-.7V9.7zm6.2-1.2-1.5.2V16l1.3-.2h.1q.5 0 .6.5v2.4q0 .4-.5.5l-1.5.3v5.9H6.7v-5.6l-3.6.7v6.2H2v-6L.7 21H.6a.5.5 0 0 1-.6-.6v-2.3q0-.4.4-.5l1.6-.4v-6.6L.7 11H.6a.5.5 0 0 1-.6-.5V8q0-.4.4-.5L2 7.2v-6h1.1V7l3.6-.7V0h1.1v6l1.3-.3h.1q.5 0 .6.5v2.4q0 .4-.5.6",
  glyphWidth: 10,
  glyphHeight: 27,
  yOffset: -13
};
export const ACCIDENTAL_FLAT: GlyphDef = {
  name: "ACCIDENTAL_FLAT",
  path: "M5.3 16.5v-.4c0-.9-.1-2.2-1.6-2.2-1.6 0-2.2 1.1-2.3 1.5v7.8c2.2-1.8 3.9-3.5 3.9-6.7M4.8 12c2.4 0 3.3 2 3.3 4 0 4.2-3.6 7.5-7 9.2H.8a.5.5 0 0 1-.6-.5L0 .6Q0 0 .6 0H1q.6 0 .6.6l-.2 12.8c.2-.2 1.4-1.5 3.4-1.5",
  glyphWidth: 8,
  glyphHeight: 25,
  yOffset: -18
};
export const ACCIDENTAL_NATURAL: GlyphDef = {
  name: "ACCIDENTAL_NATURAL",
  path: "m1.1 16.9 4.7-1.3V9L1 10.3zM6.6 5.7q.3.1.2.4V26h-1v-7l-5 1.4H.5q-.6 0-.6-.5V0H1v7l5-1.4h.5",
  glyphWidth: 7,
  glyphHeight: 26,
  yOffset: -13
};
export const ACCIDENTAL_DOUBLEFLAT: GlyphDef = {
  name: "ACCIDENTAL_DOUBLEFLAT",
  path: "M5.3 16.5v-.4c0-.9-.1-2.2-1.6-2.2-1.6 0-2.2 1.1-2.3 1.5v7.8c2.2-1.8 3.9-3.5 3.9-6.7m6.7 0v-.4c0-.9-.1-2.2-1.6-2.2-1.6 0-2.2 1.1-2.2 1.5L8 23.2c2.4-1.8 4-3.5 4-6.7m-.5-4.6c2.4 0 3.3 2 3.3 4 0 4.1-3.6 7.4-7 9.1l-.3.2a.5.5 0 0 1-.6-.6V20A15 15 0 0 1 1 25l-.3.2a.5.5 0 0 1-.6-.6L0 .6Q0 0 .6 0H1q.6 0 .6.6l-.2 12.8c.2-.2 1.4-1.5 3.4-1.5q1.3 0 2 .7V.6q0-.6.5-.6h.5q.5 0 .5.6l-.1 12.8c.2-.3 1.3-1.5 3.3-1.5",
  glyphWidth: 15,
  glyphHeight: 25,
  yOffset: -18
};
export const ACCIDENTAL_DOUBLESHARP: GlyphDef = {
  name: "ACCIDENTAL_DOUBLESHARP",
  path: "M10.4 3.5h-2l-2 2 2 2h2q.6 0 .6.6v2.3q0 .6-.6.6H8.1a.5.5 0 0 1-.6-.6v-2l-2-2-2 2v2q0 .6-.6.6H.6a.5.5 0 0 1-.6-.6V8.1q0-.5.6-.5h2l2-2v-.2l-2-2h-2L0 3V.6Q0 0 .6 0h2.3q.5 0 .5.6v2l2 2h.2l2-2v-2q0-.6.5-.6h2.3q.6 0 .6.6v2.3q0 .5-.6.6",
  glyphWidth: 11,
  glyphHeight: 11,
  yOffset: -5.5
};

export const FLAG_EIGHTH_UP: GlyphDef = {
  name: "FLAG_EIGHTH_UP",
  path: "M0 9.6v-9Q0 0 .5 0t.5.3L1.4 2c0 .1.8 2.4 2.2 4.7 1.1 1.7 5 6.6 4.8 6.6 0 0 3 3.8 3.2 9q.1 5.6-2.5 10.5-.3.5-.7.5t-.4-.4.2-.6q1.7-4.5 1.8-8.8c0-3.3-1.2-5-2-6.2A16 16 0 0 0 .4 10Q0 9.8 0 9.6",
  glyphWidth: 12,
  glyphHeight: 33,
  yOffset: 0
};
export const FLAG_EIGHTH_DOWN: GlyphDef = {
  name: "FLAG_EIGHTH_DOWN",
  path: "M0 32.6v-9q0-.2.3-.4A17 17 0 0 0 8.8 16c.7-1.2 1.9-3 1.9-6.3 0-2.9-.7-5-2.3-8.7V.5q0-.3.2-.5h.2q.4 0 .6.4c2.1 4 3 7 3 10.6s-1.2 6.2-3.2 9-4.4 4.6-6 7.2q-2 3.8-1.8 4L1 32.9q-.1.3-.5.4a.5.5 0 0 1-.5-.6",
  glyphWidth: 12,
  glyphHeight: 33,
  yOffset: -33
};
export const FLAG_SIXTEENTH_UP: GlyphDef = {
  name: "FLAG_SIXTEENTH_UP",
  path: "m8.4 19.4 1 1.6v-1.2a8 8 0 0 0-1.9-5.2c-1.4-1.8-4-4.6-6-4.6v.8q.3 1.6 2.6 4c2 2 3.2 3.2 4.3 4.6M0 15.7V.5Q0 0 .6 0t.6.5s1 4.1 2.6 6.3c1.5 2.2 3.6 4.3 5.4 6.8q2 2.6 2 5.7-.1 2.9-.8 5l.2 2.9c0 2.2-1 4.4-1.8 5.5q-.2.5-.6.6H8q-.3-.2-.2-.5l.1-.6c.6-1.6.9-3.7.9-4.6v-.7q.2-2-1.6-4.9a17 17 0 0 0-6.6-5.9z",
  glyphWidth: 11,
  glyphHeight: 33,
  yOffset: 0
};
export const FLAG_SIXTEENTH_DOWN: GlyphDef = {
  name: "FLAG_SIXTEENTH_DOWN",
  path: "M1.5 22.5c5.8-1.5 9-4.5 9.2-10.7-1.1 2-3.9 4.2-6.2 6S1.8 21 1.5 22zM0 32.5V16.6s.3-1 .6-1c3-.8 9-4.3 9.8-7.7v-.1l.2-1.5c0-2.7-1-4-2.4-5.5L7.8.3c0-.2.5-.3.6-.3q.4 0 .7.2c1.3 1 3.1 3.2 3.1 6.4q0 1.5-.2 2.3l.4 4.3c0 7.4-5.6 10.4-7.8 12.5-1.6 1.5-2.8 2.7-3.4 6.8q0 .6-.6.7-.5-.1-.6-.7",
  glyphWidth: 12,
  glyphHeight: 33,
  yOffset: -33
};
export const FLAG_THIRTY_SECOND_UP: GlyphDef = {
  name: "FLAG_THIRTY_SECOND_UP",
  path: "M7.5 14.6c-1.4-1.8-4-4.6-6.1-4.6a8 8 0 0 0 1.1 2.8c1.5 2.2 4.9 5 6.7 7.4l.2.3v-.7a8 8 0 0 0-1.9-5.2m.9 11.8 1 1.6v-1.5a8 8 0 0 0-1.9-5.2c-1.4-1.9-4-4.3-6.1-4.3l.2.8q.3 1.6 2.5 4c2 2 3.2 3.2 4.3 4.6M0 22.7V.5Q0 0 .6 0t.6.5s1 4.1 2.6 6.3c1.5 2.2 3.6 4.3 5.4 6.8q2 2.6 2 5.7a17 17 0 0 1-.5 3.8q.5 1.4.5 2.9-.1 3-.8 5.2l.2 3c0 2.2-1 4.4-1.8 5.5q-.2.5-.6.6H8q-.3-.2-.2-.5l.1-.6c.6-1.6.9-3.7.9-4.6v-.7q.2-2-1.6-4.9a17 17 0 0 0-6.6-5.9z",
  glyphWidth: 11,
  glyphHeight: 40,
  yOffset: 0
};
export const FLAG_THIRTY_SECOND_DOWN: GlyphDef = {
  name: "FLAG_THIRTY_SECOND_DOWN",
  path: "M4.5 17.8c-2.3 1.8-2.7 3.2-3 4.2v.6c4.4-1.7 9.1-4.4 9.1-9.7v-.7l-.4.7c-1.1 1.4-3.3 2.9-5.7 4.9M1.4 30c2-.6 5.1-1.6 7.6-4.6 1-1.3 1.7-3 1.7-6l-1 1.5c-2.1 2.3-5.7 4.2-7.2 6.4q-.8 1.3-1.1 2.7M0 40V16.6s.3-1 .6-1c1.8-.5 5.7-2.2 8.5-5.4q1.5-1.7 1.5-4c0-2.6-1-4-2.4-5.4L7.8.3Q8 0 8.5 0l.6.2c1.3 1 3.1 3.2 3.1 6.4a10 10 0 0 1-.4 3q.4 1.9.4 3.8v.6l-.2 2q.4 2.6.4 4.8c0 7.4-5.6 10.4-7.8 12.4-1.6 1.6-2.8 2.8-3.4 7q0 .5-.6.6-.5-.1-.6-.7",
  glyphWidth: 12,
  glyphHeight: 41,
  yOffset: -41
};

export const BRACE: GlyphDef = {
  name: "BRACE",
  path: "M.4 19.8A7 7 0 0 1 2.5 25c0 3.6-1.6 7.3-1.6 9.6 0 2.4 1.4 4.7 1.5 4.8v.2h-.2c0-.1-2.2-2.3-2.2-5.6 0-3.5 1.4-6 1.4-10.6A6 6 0 0 0 .1 20v-.2a6 6 0 0 0 1.3-3.5C1.4 11.6 0 9 0 5.6S2.2 0 2.2 0l.2-.1v.2S1 2.6 1 5c0 2.3 1.6 6 1.6 9.6 0 2.9-1.4 4.4-2.1 5.2",
  glyphWidth: 3,
  glyphHeight: 40,
  yOffset: 0
};

export const ARTIC_ACCENT: GlyphDef = {
  name: "ARTIC_ACCENT",
  path: "M.7 0 14 4.2q.4 0 .4.5t-.4.5L.7 9.4H.6a.5.5 0 0 1-.6-.6V8q0-.3.4-.5L9 4.7.4 2Q0 1.9 0 1.5v-1Q0 0 .6 0z",
  glyphWidth: 15,
  glyphHeight: 10,
  yOffset: -5
}
export const ARTIC_MARCATO: GlyphDef = {
  name: "ARTIC_MARCATO",
  path: "m1 9.8-1-.5 5.4-9q.1-.3.5-.3.3 0 .5.2l5.4 9v.4q0 .5-.5.5H8.8q-.4 0-.6-.3L4.8 3.5z",
  glyphWidth: 12,
  glyphHeight: 10,
  yOffset: -10
}
export const ARTIC_TENUTO: GlyphDef = {
  name: "ARTIC_TENUTO",
  path: "M.6 0H12q.5 0 .5.6v.7q0 .5-.5.5H.6a.5.5 0 0 1-.6-.5V.6Q0 0 .6 0",
  glyphWidth: 13,
  glyphHeight: 2,
  yOffset: -1
}
export const ARTIC_STACCATO: GlyphDef = {
  name: "ARTIC_STACCATO",
  path: "M.5 2.7Q-.4 1.5.5.5 1 0 1.5 0a1.6 1.6 0 0 1 1.2 2.7q-.5.4-1.1.4T.4 2.7",
  glyphWidth: 3,
  glyphHeight: 3,
  yOffset: -1
}
export const ARTIC_FERMATA: GlyphDef = {
  name: "ARTIC_FERMATA",
  path: "M21.6 4.3c2 2.1 3.3 6.5 3.3 8.6q0 1.3-.6 1.3c-1.1 0-.5-3.4-3.9-6.8-3-3-7-3-7.9-3h-.1c-1 0-5 0-8 3-3.3 3.4-2.7 6.8-3.8 6.8q-.6 0-.6-1.3c0-2.1 1.4-6.4 3.3-8.6 3.8-4 7-4.3 9.1-4.3s5.4.2 9.2 4.3M9.6 12a2.8 2.8 0 0 1 5.6 0 2.8 2.8 0 0 1-5.5 0",
  glyphWidth: 25,
  glyphHeight: 15,
  yOffset: -15
}

export const REPEAT_DOTS: GlyphDef = {
  name: "REPEAT_DOTS",
  path: "M4.2 2.1c0 1.2-1 2.1-2.1 2.1S0 3.2 0 2.2C0 1 1 0 2 0c1.2 0 2.2 1 2.2 2.1m0 10c0 1.2-1 2.1-2.1 2.1s-2.1-1-2.1-2C0 11 1 10 2 10c1.2 0 2.2 1 2.2 2.1",
  glyphWidth: 4,
  glyphHeight: 14,
  yOffset: 13
}

export const CLEF_TREBLE: GlyphDef = {
  name: "CLEF_TREBLE",
  path: "m16.8 52.7-2.3-13.1a5 5 0 0 0-4.2 5q0 2.7 2.5 3.9.7.4.8.9 0 .5-.6.5c-3.2 0-5.4-3.9-5.4-6.7 0-3.7 2.4-7.6 6-8.6l-.8-5.7-2 1.7c-3.5 3-7 7.4-7 12.3 0 6 5 10 10.7 10zm-3.5-41.1q-.5 1.8-.5 4 0 2.6.5 5c2.7-2.8 5.8-6 5.8-10 0-2.8-1-4.8-1.5-4.8-2.1 0-4 4.2-4.3 5.8m9.2 33.7c0-3.5-2.6-6-6.2-6l2.2 13c2.8-1.2 4-4.1 4-7M4.9 65c0-2.6 1.8-5 4.6-5 3 0 4.6 2.4 4.6 4.5 0 2.6-1.9 4.2-3.7 4.5l-.2.1v.1l2 .2q6 0 6.1-6.3 0-3.1-1.2-8.8-1.4.3-3.1.3c-7.5 0-14-5.9-14-13.4 0-8 5-12.8 8.7-16.2l3-2.8c-.7-4.5-1-6.5-1-8.6 0-3.4.8-8.5 3.3-11.6q2.3-2 3-2 1.2.2 2.8 3.4c.7 1.5 1.8 4.4 1.8 8 0 6.4-3 11.4-7.2 15.9l1.2 7c5.8 0 10.1 4 10.1 10.1 0 4.1-3 8.2-6.8 9.5l.6 3.5q.6 3.4.6 5.7c0 2.5-.6 5.1-2.7 6.7Q15 71 12.3 71C7 71.1 5 67.6 5 65",
  glyphWidth: 26,
  glyphHeight: 71,
  yOffset: -14
};
export const CLEF_BASS: GlyphDef = {
  name: "CLEF_BASS",
  path: "M22.7 5c0-1 .9-2 2-2 1 0 1.9 1 1.9 2a2 2 0 0 1-2 2 2 2 0 0 1-1.9-2M10.2 0c7.2 0 11 4.5 11 11.4 0 7.4-6.4 14.5-12 18.6A39 39 0 0 1 1 34.7H.8q-.5.1-.8-.5V34c0-.4.5-.7.5-.7s4-1.8 8.1-5.6a25 25 0 0 0 7.2-16.2q0-10-6-10-2.2 0-3.7.8a6 6 0 0 0-3 4.3l1.3-.8 1.3-.2C8 5.6 10 7.5 10 9.8c0 2.6-2 4.3-4.6 4.3-3 0-4.6-2.1-4.6-5a9 9 0 0 1 3.8-7.3S7.1 0 10.2 0m12.5 15q.2-1.9 2-2c1 0 1.9.8 1.9 2 0 1-1 2-2 2s-1.9-1-1.9-2",
  glyphWidth: 27,
  glyphHeight: 35,
  yOffset: 0
};
export const CLEF_ALTO: GlyphDef = {
  name: "CLEF_ALTO",
  path: "M0 0h4v40H0zm25.7 30.9c0 5.8-4.3 9.1-9.4 9.1-3 0-7.5-1.3-7.5-5.1 0-2 1.4-3.4 3.4-3.4a3 3 0 0 1 3.1 3.2q-.1 2.9-3 3H12q1.5 1 3.5 1c4.4 0 5-3.4 5-7.2 0-3.2 0-7.8-3.7-7.8-3.6 0-4.4 4-4.5 4.4 0 0 0 .5-.6.5l-.6-.5c-.4-2.4-1.2-6.3-3.7-7.3V40h-1V0h1v19.2c2.3-1 3.4-5 3.7-7.2 0 0 0-.6.6-.6s.6.5.6.6c.1.4.9 4.3 4.5 4.3 3.7 0 3.8-4.6 3.8-7.8 0-3.8-.7-7.3-5.1-7.3q-2 0-3.5 1 3.2-.2 3.4 3.1a3 3 0 0 1-3 3.2Q9 8.4 8.7 5c0-3.8 4.4-5.1 7.5-5.1 5 0 9.4 3.3 9.4 9.1 0 4.5-2.5 9.2-7.6 9.2-1.8 0-2.3-.1-4-1a8 8 0 0 1-2 2.8 8 8 0 0 1 2.3 2.8c1.6-1 2.3-1.1 3.3-1.1 5.4 0 8.2 4 8.2 9.2",
  glyphWidth: 26,
  glyphHeight: 40,
  yOffset: 0
};

export const TIMESIG_0: GlyphDef = {
  name: "TIMESIG_0",
  path: "M7.5 0C11.7 0 15 4.4 15 10.2s-3.3 10.2-7.5 10.2S0 16 0 10.2 3.2 0 7.5 0m2.3 15.8V4.6c0-1.4-.6-3-2.3-3S5 3.2 5 4.6v11.2c0 1.4.7 3 2.4 3s2.3-1.6 2.3-3",
  glyphWidth: 15,
  glyphHeight: 20,
  yOffset: 0
};
export const TIMESIG_1: GlyphDef = {
  name: "TIMESIG_1",
  path: "M9.4 17.7h3q.4 0 .4.5v.8q0 .5-.4.5h-11L1 19v-.8q0-.5.4-.5h3V4L1.7 9l-.4.2L1 9l-.8-.5-.2-.4V8L4.5.2l.2-.1.2-.1h4q.5 0 .5.5z",
  glyphWidth: 13,
  glyphHeight: 20,
  yOffset: 0
};
export const TIMESIG_2: GlyphDef = {
  name: "TIMESIG_2",
  path: "M13 11.4q.3-.6.8-.6t.7.8c0 1-1 4-1.7 5.5a5 5 0 0 1-3.7 2.4q-2 0-3.1-1.7c-.7-1-1.2-2.4-2.3-2.4q-1.4.1-1.3.7v.3l.2 1.4.2.5q-.2 1.1-1.4 1.2c-.4 0-1.4-.1-1.4-2S1.2 14 1.2 14c2.3-3.5 7.9-4.5 7.9-9.2 0-2-.5-3.4-2.7-3.4q-1 0-1.4.2-1 .3-1 .7t.4.4c1 .4 1.8 1.7 1.8 2.8a3 3 0 0 1-3 3 3 3 0 0 1-3-3C.2 3.6 1.4 0 7.4 0s6.8 3.3 6.8 5c0 2.4-1 4.5-5.3 5.8s-5.3 2.8-5.3 2.8h1c2.2 0 2.8 1.5 5.4 1.5 2 0 2.8-2.9 3-3.7",
  glyphWidth: 15,
  glyphHeight: 20,
  yOffset: 0
};
export const TIMESIG_3: GlyphDef = {
  name: "TIMESIG_3",
  path: "M10.3 9.1C12 9.7 14 11 14 13.8c0 4.4-4.2 5.7-8 5.7-3 0-6-1.6-6-4.9C0 13.2 1.2 12 2.6 12s2.6 1.2 2.6 2.6c0 1.3-1.1 2.5-2.4 2.6a5 5 0 0 0 2.6.6c1.6 0 3.4-.7 3.4-3.4q0-4-2.6-4.2l-3-.3c-.4 0-.4-.5-.4-.5v-.8s0-.5.5-.5l3.2-.3c.5 0 2.3-.4 2.3-3 0-2-1.8-3-3.4-3q-1.3 0-2.1.5l-.1.1c1 .3 2 1.4 2 2.6 0 1.4-1.2 2.5-2.6 2.5A2.6 2.6 0 0 1 0 5v-.1S-.2 0 6.7 0s7 4.5 7 4.9V5c0 .7-.2 2.8-3.4 4",
  glyphWidth: 14,
  glyphHeight: 20,
  yOffset: 0
};
export const TIMESIG_4: GlyphDef = {
  name: "TIMESIG_4",
  path: "M7.8 15h-7l-.4-.2-.4-.7v-.3l.1-.4q1.7-2 3.3-6.7C4.4 3.4 4.6.5 4.6.5q0-.5.6-.5h6l.3.2.9.8.1.4-.2.6C7.6 8.3 3.1 13.1 3.1 13.1h4.7V9.8l.1-.4 3.7-3.3.4-.1h.2l.5.2.3.6V13h3.6q.5 0 .5.6v.7q0 .6-.5.6H13v3h3.6q.5 0 .5.6v.7q0 .5-.5.6H4.4l-.5-.6v-.7q.1-.6.5-.6h3.4z",
  glyphWidth: 17,
  glyphHeight: 20,
  yOffset: 0
};
export const TIMESIG_5: GlyphDef = {
  name: "TIMESIG_5",
  path: "M.5 1.1q0-.8.9-.8h.4q2.6.4 4.6.4 2.1 0 5-.6l.5-.1q.7 0 .7.6V1c-1.2 3-3.3 3.5-6.2 3.5l-3.3-.2q-.5 0-.5.5v2.5q0 .2.3.3H3a7 7 0 0 1 4-1.2c4 0 6.9 2.2 6.9 6.5s-3.4 6.7-7.5 6.7c-3 0-6.4-1.5-6.4-5 0-1.4 1-2.8 2.6-2.8s3 .8 3 2.7S4.3 17 4 17.2q-.2 0-.2.2t.2.3 1.7.3H6c2.6-.2 3.3-3 3.3-5s-.5-4.4-3.4-4.4c-2.5 0-3 2-3.1 2.6q-.2.3-.4.3h-.2l-1.4-.3c-.3 0-.3-.5-.3-.7l.2-4.9v-.5z",
  glyphWidth: 14,
  glyphHeight: 20,
  yOffset: 0
};
export const TIMESIG_6: GlyphDef = {
  name: "TIMESIG_6",
  path: "M7.8 17.9c1.3 0 2.4-1.8 2.4-4s-1-4.1-2.4-4.1-2.4 1.8-2.4 4 1 4 2.4 4m1.5-10c2.5 0 5.6 1.5 5.6 5.4 0 4.6-5.3 6.3-6.7 6.3s-2.8-.1-5.2-1.9c-2.3-2-3-4.8-3-7.3 0-2.2.6-4.2 1-5.1C1.8 3.4 4.4 0 8 0c4 0 5.7 2.1 6.2 3.6q.3.6.2 1.2V5q-.2 2.3-2.6 2.5A2.5 2.5 0 0 1 9.3 5q.1-1.7 1.5-2.4-.6-.7-2-.8c-2.8 0-3.6 3-3.6 5.3l.2 2.1c.6-.6 1.4-1.3 3.9-1.3",
  glyphWidth: 15,
  glyphHeight: 20,
  yOffset: 0
};
export const TIMESIG_7: GlyphDef = {
  name: "TIMESIG_7",
  path: "m5.9 15 5.3-9c-.4.5-1.9.6-2.7.6-3.2 0-3.3-1.5-4.7-1.5s-2 1.2-2 2.1v1.3q0 .5-.4.5h-1a.4.4 0 0 1-.4-.5V1.1Q0 .8.4.7h1q.3 0 .4.4v2C1.9 2.7 3.4.2 5.9.2 8.5.3 9 3.7 10.7 3.7S12.4 1 12.4.6q0-.6.4-.6h.8q.3 0 .4.6v.9c0 .9-.2 3.1-.6 4.3-1 2.6-2.2 6-2.7 7.8l-.3 2.7.2 2.8v.1q-.2.7-1 .8l-2.5-.2h-.4c-1.3 0-1.7.2-2.3.2q-.6 0-.6-.6c0-1.5 1.2-3.1 2-4.4",
  glyphWidth: 14,
  glyphHeight: 20,
  yOffset: 0
};
export const TIMESIG_8: GlyphDef = {
  name: "TIMESIG_8",
  path: "M10.1 8c.7-.3 1.6-1.2 1.6-3.2 0-1.8-1.7-3-4.1-3-1.8 0-3.2.7-3.2 2.2 0 1.8 3 3.2 5.7 4m-2.5 9.5c2.5 0 3.9-1.4 3.9-2.5 0-2.2-3.9-3.5-6.6-4.4 0 0-2.1.6-2.1 3.3 0 2.2 2.2 3.6 4.8 3.6m4.8-8.4Q15.2 11 15 14c0 3.3-3.4 5.9-7.5 5.9-4.2 0-7.6-2.6-7.6-5.9q.1-3 2.9-4.5A5 5 0 0 1 .5 5.2C.5 2.4 3.7 0 7.5 0c4 0 7.1 2.4 7.1 5.2q-.2 2.5-2.2 4",
  glyphWidth: 15,
  glyphHeight: 20,
  yOffset: 0
};
export const TIMESIG_9: GlyphDef = {
  name: "TIMESIG_9",
  path: "M7 1.6c-1.2 0-2.4 1.9-2.4 4.1 0 2.3 1.2 4 2.5 4s2.4-1.7 2.4-4-1.1-4-2.4-4m-1.4 10C3.1 11.7 0 10.3 0 6.4 0 1.6 5.2 0 6.6 0s3 0 5.2 1.8c2.4 2.1 3 4.9 3 7.3q-.1 3.6-1 5.2c-.7 1.8-3.3 5.3-7 5.3-4 0-5.6-2.2-6.1-3.6q-.3-.7-.3-1.3v-.1C.4 13.2 1.6 12 3 12s2.6 1.2 2.6 2.6q-.2 1.7-1.5 2.4.6.6 2 .7c2.8 0 3.6-3 3.6-5.2l-.2-2.1c-.6.6-1.5 1.3-3.9 1.3",
  glyphWidth: 15,
  glyphHeight: 20,
  yOffset: 0
};

export const AUGMENTATION_DOT: GlyphDef = {
  name: "AUGMENTATION_DOT",
  path: "M4 2a2 2 0 0 1-2 2 2 2 0 0 1-2-2Q.2.2 2 0a2 2 0 0 1 2 2",
  glyphWidth: 4,
  glyphHeight: 4,
  yOffset: -2
}