import type { StandardStaffDrawConfig } from "../core/StandardStaff";

const noteLetters = ["A", "B", "C", "D", "E", "F", "G"] as const;
export const noteArticulations = ["staccato", "tenuto", "accent", "marcato", "fermata"] as const;
export const noteDurations = ["w", "h", "q", "e", "s", "t"] as const;
const noteAccidentals = ["#", "b", "n", "##", "bb"] as const;
export type NoteLetters = typeof noteLetters[number];
export type NoteArticulations = typeof noteArticulations[number];
export type NoteDurations = typeof noteDurations[number];
export type NoteAccidentals = typeof noteAccidentals[number];

export const barlineTypes = ["single", "double", "end", "repeat-start", "repeat-end"] as const;
export type BarlineTypes = typeof barlineTypes[number];

const excludedBeamDurations: NoteDurations[] = ["w", "h", "q"];

export interface VSNoteObj {
  letter: NoteLetters;
  accidental?: NoteAccidentals;
  octave: number;
  duration: NoteDurations;
  isDotted: boolean;
  articulation?: NoteArticulations;
};

export interface VSChordObj {
  notes: VSChordNoteObj[];
  duration: NoteDurations;
  isDotted: boolean;
  articulation?: NoteArticulations;
}

export interface VSRestObj {
  duration: NoteDurations;
  isDotted: boolean;
}

export interface VSBeamObj {
  entries: (DrawNoteConfig | DrawChordConfig)[];
}

export type VSChordNoteObj = Omit<VSNoteObj, "duration" | "isDotted" | "articulation">;

// )ptional field inputs
export type NoteInput = Omit<VSNoteObj, "isDotted"> & { accidental?: NoteAccidentals | null; isDotted?: boolean };
export type ChordInput = Omit<VSChordObj, "isDotted"> & { isDotted?: boolean };
export type RestInput = Omit<VSRestObj, "isDotted"> & { isDotted?: boolean };

export type DrawNoteConfig = { type: "note"; note: VSNoteObj };
export type DrawChordConfig = { type: "chord"; chord: VSChordObj };
export type DrawRestConfig = { type: "rest"; rest: VSRestObj };
export type DrawBeamConfig = { type: "beam"; beam: VSBeamObj; };
export type DrawBarlineConfig = { type: "barline"; barLineType: BarlineTypes; };

export type BeamableConfig = DrawNoteConfig | DrawChordConfig;

/** @description Replaces string input with object in staff draw methods */
export function noteConfig(note: NoteInput): DrawNoteConfig {
  validateArticulationString(note.articulation);
  return { type: "note", note: { isDotted: false, ...note } };
}

/** @description Replaces string input with object in staff draw methods */
export function chordConfig(chord: ChordInput): DrawChordConfig {
  if (chord.notes.length < 1 || chord.notes.length > 10) throw new Error("Invalid amount of notes provided in chord config. Please provide 1-10 notes.");
  validateArticulationString(chord.articulation);

  return { type: "chord", chord: { isDotted: false, ...chord } };
};

/** @description Replaces string input with object in staff draw methods */
export function restConfig(rest: RestInput): DrawRestConfig {

  return { type: "rest", rest: { isDotted: false, ...rest } };
};

/** @description Replaces string input with object in staff draw methods */
export function beamConfig(beam: VSBeamObj): DrawBeamConfig {
  beam.entries.forEach(entry => {
    const duration = entry.type === "note" ? entry.note.duration : entry.chord.duration;
    const articulation = entry.type === "note" ? entry.note.articulation : entry.chord.articulation;
    if (excludedBeamDurations.includes(duration)) throw new Error(`Invalid duration '${duration}' was provided. Please use e|s|t.`);
    validateArticulationString(articulation);
  });

  return { type: "beam", beam };
};

/** @description Replaces string input with object in staff draw methods */
export function barlineConfig(barLineType: BarlineTypes): DrawBarlineConfig {

  return { type: "barline", barLineType };
};

// String Parsers

const REGEX_NOTE_STRING = /^(?<letter>[A-Ga-g])(?<accidental>##|bb|[#bn]?)(?<octave>\d)(?<duration>[whqestWHQEST])(?<dot>\.?)(?:\((?<articulation>[a-z]+)\))?$/;
const REGEX_CHORD_STRING = /^\[(?<notes>[A-Ga-g0-9#bn\s,]+)\](?<duration>[whqestWHQEST])(?<dot>\.?)(?:\((?<articulation>[a-z]+)\))?$/;
const REGEX_CHORD_NOTE_STRING = /^(?<letter>[A-Ga-g])(?<accidental>##|bb|[#bn]?)(?<octave>\d)$/;
const REGEX_REST_STRING = /^(?:[Rr])?(?<duration>[whqestWHQEST])(?<dot>\.?)$/;

export function parseNoteString(noteString: string): VSNoteObj {
  const match = noteString.match(REGEX_NOTE_STRING);

  if (!match || !match.groups) {
    throw new Error(`Invalid note string format: ${noteString}. Expected format: [A-Ga-g][#|b]?[0-9][w|h|q|e|s|t].(articulation)`);
  };

  let { letter, accidental, octave, duration, dot, articulation } = match.groups;

  letter = letter.toUpperCase();
  duration = duration.toLowerCase();

  const noteObj: VSNoteObj = {
    letter: letter as NoteLetters,
    octave: parseInt(octave),
    duration: duration as NoteDurations,
    isDotted: dot === "."
  };

  if (accidental) noteObj.accidental = accidental as NoteAccidentals;

  if (articulation) {
    validateArticulationString(articulation);
    noteObj.articulation = articulation as NoteArticulations;
  }

  return noteObj;
};

export function parseChordString(chordString: string): VSChordObj {
  const match = chordString.match(REGEX_CHORD_STRING);

  if (!match || !match.groups) {
    throw new Error(`Invalid note string format: ${chordString}. Expected format: [C4,E4,G4]q.(articulation)`);
  };

  const { notes, duration, dot, articulation } = match.groups;

  const rawNotes = notes.split(",").map(n => n.trim());
  const noteObjs = rawNotes.map(note => parseChordNoteString(note));

  const chordObj: VSChordObj = {
    notes: noteObjs,
    duration: duration.toLowerCase() as NoteDurations,
    isDotted: dot === ".",
  };

  if (articulation) {
    validateArticulationString(articulation);
    chordObj.articulation = articulation as NoteArticulations;
  }

  return chordObj;
};

export function parseRestString(restString: string): VSRestObj {
  const match = restString.match(REGEX_REST_STRING);

  if (!match || !match.groups) {
    throw new Error(`Invalid rest string format: ${restString}. Expected format: [R]q[.]`);
  }

  return {
    duration: match.groups.duration.toLowerCase() as NoteDurations,
    isDotted: match.groups.dot === ".",
  };
};

export function parseBeamString(beamString: string): VSBeamObj {
  const chunks = beamString.split("-").map(chunk => chunk.trim());

  if (chunks.length < 2) {
    throw new Error(`Invalid beam string format: ${beamString}. Expected at least two items connected by hyphens (e.g., 'C4e-D4e').`);
  }

  const entries: BeamableConfig[] = chunks.map(chunk => {
    if (chunk.startsWith("[")) {
      return chordConfig(parseChordString(chunk));
    }
    else {
      return noteConfig(parseNoteString(chunk));
    }
  });

  return { entries };
};

export function parseBarlineString(barlineString: string): BarlineTypes {
  switch (barlineString) {
    case "|": return "single";
    case "||": return "double";
    case "|]": return "end";
    case "|:": return "repeat-start";
    case ":|": return "repeat-end";
    default:
      throw new Error(`Invalid barline syntax: '${barlineString}'`);

  }
}

export function parseChordNoteString(chordNoteString: string): VSChordNoteObj {
  const match = chordNoteString.match(REGEX_CHORD_NOTE_STRING);

  if (!match || !match.groups) {
    throw new Error(`Invalid chord note string format: ${chordNoteString}. Expected format: [A-Ga-g][#|b]?[0-9].`);
  };

  let { letter, accidental, octave } = match.groups;

  letter = letter.toUpperCase();

  const noteObj: VSChordNoteObj = {
    letter: letter as NoteLetters,
    octave: parseInt(octave),
  }

  if (accidental) noteObj.accidental = accidental as NoteAccidentals;

  return noteObj;
};

export function parseBatchString(batchString: string): StandardStaffDrawConfig[] {
  // Split by one or more spaces, trimming any trailing/leading whitespace
  const chunks = batchString.trim().split(/\s+/);
  const configs: StandardStaffDrawConfig[] = [];

  for (const chunk of chunks) {
    if (/^[|\]:]+$/.test(chunk)) {
      configs.push(barlineConfig(parseBarlineString(chunk)));
    }
    else if (chunk.includes("-")) {
      configs.push(beamConfig(parseBeamString(chunk)));
    }
    else if (chunk.startsWith("[")) {
      configs.push(chordConfig(parseChordString(chunk)));
    }
    else if (chunk.toLowerCase().startsWith("r")) {
      configs.push(restConfig(parseRestString(chunk)));
    }
    else {
      configs.push(noteConfig(parseNoteString(chunk)));
    }
  }

  return configs;
}

// Validators

export function validateArticulationString(string: string | undefined) {
  if (string && !noteArticulations.includes(string as any)) throw new Error(`Invalid articulation string '${string}'. Valid options are 'staccato', 'tenuto', 'accent', 'marcato' or 'fermata'.`);
}